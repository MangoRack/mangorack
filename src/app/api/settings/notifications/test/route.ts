import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, errorResponse } from "@/lib/auth-helpers"
import { isSafeUrl } from "@/lib/url-safety"

const testNotificationSchema = z.object({
  channel: z.enum(["email", "webhook", "discord", "slack"]),
  webhookUrl: z.string().optional(),
  discordWebhookUrl: z.string().optional(),
  slackWebhookUrl: z.string().optional(),
  email: z.string().optional(),
})

async function sendWithTimeout(
  url: string,
  body: Record<string, unknown>,
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const json = await request.json()
    const body = testNotificationSchema.parse(json)
    const { channel } = body

    // --- Email ---
    if (channel === "email") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message:
              "Email notifications require SMTP configuration. Please configure SMTP settings to send email notifications.",
          },
        },
        { status: 422 }
      )
    }

    // --- Webhook / Discord / Slack ---
    const urlMap: Record<string, string | undefined> = {
      webhook: body.webhookUrl,
      discord: body.discordWebhookUrl,
      slack: body.slackWebhookUrl,
    }

    const url = urlMap[channel]

    if (!url) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_URL",
            message: `No ${channel} webhook URL provided. Please enter a URL and try again.`,
          },
        },
        { status: 400 }
      )
    }

    // Validate URL safety — allow private IPs since MangoRack is a homelab product
    // and users will have webhook endpoints on their local network (192.168.x.x, 10.x.x.x).
    // Loopback, cloud metadata endpoints, and obfuscated IPs are still blocked.
    if (!isSafeUrl(url, { allowPrivateIPs: true })) {
      return NextResponse.json(
        {
          error: {
            code: "UNSAFE_URL",
            message:
              "The webhook URL is not allowed. URLs must use http(s) and must not point to loopback or metadata addresses.",
          },
        },
        { status: 400 }
      )
    }

    // Build the channel-specific payload
    let payload: Record<string, unknown>

    if (channel === "discord") {
      payload = {
        content:
          "**MangoRack Test** \u2014 This is a test notification. If you see this, your Discord integration is working!",
      }
    } else if (channel === "slack") {
      payload = {
        text: "*MangoRack Test* \u2014 This is a test notification. If you see this, your Slack integration is working!",
      }
    } else {
      // generic webhook
      payload = {
        event: "test",
        message: "This is a test notification from MangoRack",
        timestamp: new Date().toISOString(),
      }
    }

    try {
      const res = await sendWithTimeout(url, payload)

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        return NextResponse.json(
          {
            error: {
              code: "DELIVERY_FAILED",
              message: `Webhook returned HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
            },
          },
          { status: 502 }
        )
      }

      return NextResponse.json({
        data: { message: `Test ${channel} notification sent successfully` },
      })
    } catch (err: unknown) {
      const isTimeout =
        err instanceof DOMException && err.name === "AbortError"
      const message = isTimeout
        ? "Request timed out after 5 seconds"
        : err instanceof Error
          ? err.message
          : "Unknown error"

      return NextResponse.json(
        {
          error: {
            code: isTimeout ? "TIMEOUT" : "DELIVERY_FAILED",
            message: `Failed to send test notification: ${message}`,
          },
        },
        { status: 502 }
      )
    }
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
