import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireAuth, errorResponse } from "@/lib/auth-helpers"

const severities = z.array(z.enum(["INFO", "WARNING", "CRITICAL"]))

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  email: z.string().email().or(z.literal("")),
  emailSeverities: severities,
  webhookEnabled: z.boolean(),
  webhookUrl: z.string().url().or(z.literal("")),
  webhookSeverities: severities,
  discordEnabled: z.boolean(),
  discordWebhookUrl: z.string().url().or(z.literal("")),
  discordSeverities: severities,
  slackEnabled: z.boolean(),
  slackWebhookUrl: z.string().url().or(z.literal("")),
  slackSeverities: severities,
})

type NotificationSettings = z.infer<typeof notificationSettingsSchema>

const defaultSettings: NotificationSettings = {
  emailEnabled: false,
  email: "",
  emailSeverities: ["WARNING", "CRITICAL"],
  webhookEnabled: false,
  webhookUrl: "",
  webhookSeverities: ["WARNING", "CRITICAL"],
  discordEnabled: false,
  discordWebhookUrl: "",
  discordSeverities: ["WARNING", "CRITICAL"],
  slackEnabled: false,
  slackWebhookUrl: "",
  slackSeverities: ["WARNING", "CRITICAL"],
}

/**
 * Map from UserSettings DB model to the notification settings shape the frontend expects.
 * The UserSettings model doesn't have all the fields the frontend needs (e.g. per-channel
 * severities, enabled toggles), so we store the extended config in the dashboardLayout
 * JSON field as notificationConfig, and fall back to defaults for missing fields.
 */
function dbToNotificationSettings(
  dbSettings: {
    notifyEmail?: string | null
    notifyWebhook?: string | null
    notifyDiscordWebhook?: string | null
    notifySlackWebhook?: string | null
    dashboardLayout?: unknown
  } | null
): NotificationSettings {
  if (!dbSettings) return defaultSettings

  // Check if we have extended notification config stored in dashboardLayout JSON
  const layout = dbSettings.dashboardLayout as Record<string, unknown> | null
  const stored = layout?.notificationConfig as Partial<NotificationSettings> | undefined

  return {
    emailEnabled: stored?.emailEnabled ?? !!dbSettings.notifyEmail,
    email: stored?.email ?? dbSettings.notifyEmail ?? "",
    emailSeverities: stored?.emailSeverities ?? defaultSettings.emailSeverities,
    webhookEnabled: stored?.webhookEnabled ?? !!dbSettings.notifyWebhook,
    webhookUrl: stored?.webhookUrl ?? dbSettings.notifyWebhook ?? "",
    webhookSeverities: stored?.webhookSeverities ?? defaultSettings.webhookSeverities,
    discordEnabled: stored?.discordEnabled ?? !!dbSettings.notifyDiscordWebhook,
    discordWebhookUrl: stored?.discordWebhookUrl ?? dbSettings.notifyDiscordWebhook ?? "",
    discordSeverities: stored?.discordSeverities ?? defaultSettings.discordSeverities,
    slackEnabled: stored?.slackEnabled ?? !!dbSettings.notifySlackWebhook,
    slackWebhookUrl: stored?.slackWebhookUrl ?? dbSettings.notifySlackWebhook ?? "",
    slackSeverities: stored?.slackSeverities ?? defaultSettings.slackSeverities,
  }
}

export async function GET() {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      include: { settings: true },
    })

    const settings = dbToNotificationSettings(user?.settings)

    return NextResponse.json({ data: settings })
  } catch (err) {
    const { status, body } = errorResponse(err)
    return NextResponse.json(body, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const json = await request.json()
    const data = notificationSettingsSchema.parse(json)

    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      include: { settings: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    // Preserve existing dashboardLayout fields, merge in notificationConfig
    const existingLayout = (user.settings?.dashboardLayout as Record<string, unknown>) ?? {}
    const updatedLayout = { ...existingLayout, notificationConfig: data }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        notifyEmail: data.emailEnabled ? data.email || null : null,
        notifyWebhook: data.webhookEnabled ? data.webhookUrl || null : null,
        notifyDiscordWebhook: data.discordEnabled ? data.discordWebhookUrl || null : null,
        notifySlackWebhook: data.slackEnabled ? data.slackWebhookUrl || null : null,
        dashboardLayout: updatedLayout,
      },
      create: {
        userId: user.id,
        notifyEmail: data.emailEnabled ? data.email || null : null,
        notifyWebhook: data.webhookEnabled ? data.webhookUrl || null : null,
        notifyDiscordWebhook: data.discordEnabled ? data.discordWebhookUrl || null : null,
        notifySlackWebhook: data.slackEnabled ? data.slackWebhookUrl || null : null,
        dashboardLayout: updatedLayout,
      },
    })

    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          },
        },
        { status: 400 }
      )
    }
    const { status, body } = errorResponse(err)
    return NextResponse.json(body, { status })
  }
}
