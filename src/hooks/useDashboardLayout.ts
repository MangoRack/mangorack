"use client"

import { useEffect } from "react"
import { useDashboardStore } from "@/stores/dashboardStore"

export function useDashboardLayout() {
  const store = useDashboardStore()

  useEffect(() => {
    store.loadLayout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}
