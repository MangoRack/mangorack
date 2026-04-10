import { create } from "zustand"

interface LicenseState {
  plan: "FREE" | "PRO" | "LIFETIME"
  isValid: boolean
  features: Record<string, boolean | number>
  isLoading: boolean
  refreshStatus: () => Promise<void>
  validateKey: (key: string) => Promise<{ success: boolean; error?: string }>
}

export const useLicenseStore = create<LicenseState>((set) => ({
  plan: "FREE",
  isValid: false,
  features: {},
  isLoading: true,

  refreshStatus: async () => {
    try {
      set({ isLoading: true })
      const res = await fetch("/api/license/status")
      if (!res.ok) throw new Error("Failed to fetch license status")
      const data = await res.json()
      set({
        plan: data.plan,
        isValid: data.isValid,
        features: data.features,
        isLoading: false,
      })
    } catch (error) {
      console.error("Failed to refresh license status:", error)
      set({ isLoading: false })
    }
  },

  validateKey: async (key: string) => {
    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        return { success: false, error: data.error || "Invalid license key" }
      }

      set({
        plan: data.plan,
        isValid: true,
        features: data.features || {},
      })

      return { success: true }
    } catch (error) {
      console.error("Failed to validate license key:", error)
      return { success: false, error: "Failed to validate license key" }
    }
  },
}))
