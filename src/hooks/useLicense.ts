"use client"

import { useEffect } from "react"
import { useLicenseStore } from "@/stores/licenseStore"

export function useLicense() {
  const store = useLicenseStore()

  useEffect(() => {
    store.refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    plan: store.plan,
    isValid: store.isValid,
    features: store.features,
    isLoading: store.isLoading,
    isPro: store.plan === "PRO" || store.plan === "LIFETIME",
    isFree: store.plan === "FREE",
    refreshStatus: store.refreshStatus,
    validateKey: store.validateKey,
  }
}
