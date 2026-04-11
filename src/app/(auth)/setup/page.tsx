"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

const setupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    licenseKey: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function SetupPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseKey: "",
  })

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/health")
        if (res.ok) {
          const data = await res.json()
          if (data.hasUsers) {
            router.push("/login")
            return
          }
        }
      } catch {
        // Health endpoint may not exist yet, allow setup
      }
      setIsChecking(false)
    }
    checkSetup()
  }, [router])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsLoading(true)

    const validation = setupSchema.safeParse(form)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      for (const err of validation.error.errors) {
        const field = err.path[0] as string
        errors[field] = err.message
      }
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Setup failed")
        setIsLoading(false)
        return
      }

      router.push("/login?success=Account created successfully. Please sign in.")
    } catch {
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="w-full max-w-md px-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg p-8 text-center">
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MangoRack Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your admin account to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Admin"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="admin@homelab.local"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Min 8 characters"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium leading-none"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="licenseKey"
              className="text-sm font-medium leading-none"
            >
              License Key{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="licenseKey"
              type="text"
              value={form.licenseKey}
              onChange={(e) => updateField("licenseKey", e.target.value)}
              placeholder="MANGO-XXXXX-XXXXX-XXXXX-XXXXX"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter a Pro or Lifetime key to unlock all features. You can add
              this later in settings.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Setting up..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  )
}
