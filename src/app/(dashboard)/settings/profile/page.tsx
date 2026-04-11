"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const profileSchema = z.object({
  name: z.string().min(1, "Display name is required").max(100),
  email: z.string().email("Invalid email address"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfileSettingsPage() {
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onProfileSubmit(data: ProfileFormData) {
    setSavingProfile(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile."
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setSavingPassword(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to change password")
      }

      toast.success("Password changed successfully.")
      passwordForm.reset()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password."
      )
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account details and password.
        </p>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
        className="space-y-4 rounded-lg border border-border p-6 bg-card"
      >
        <h3 className="text-sm font-semibold text-foreground">
          Account Details
        </h3>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            Display Name
          </label>
          <input
            id="name"
            type="text"
            {...profileForm.register("name")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Your name"
          />
          {profileForm.formState.errors.name && (
            <p className="text-xs text-destructive">
              {profileForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...profileForm.register("email")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {profileForm.formState.errors.email && (
            <p className="text-xs text-destructive">
              {profileForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className={cn(
            "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Password Form */}
      <form
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        className="space-y-4 rounded-lg border border-border p-6 bg-card"
      >
        <h3 className="text-sm font-semibold text-foreground">
          Change Password
        </h3>

        <div className="space-y-2">
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-foreground"
          >
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            {...passwordForm.register("currentPassword")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {passwordForm.formState.errors.currentPassword && (
            <p className="text-xs text-destructive">
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-foreground"
          >
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            {...passwordForm.register("newPassword")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-xs text-destructive">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...passwordForm.register("confirmPassword")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className={cn(
            "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {savingPassword ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  )
}
