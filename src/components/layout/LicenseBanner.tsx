"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Crown, Zap, AlertTriangle } from "lucide-react"
import { useLicense } from "@/hooks/useLicense"

export function LicenseBanner() {
  const { plan, isFree, isPro, isLoading } = useLicense()
  const [serviceCount, setServiceCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/services")
        if (res.ok) {
          const data = await res.json()
          setServiceCount(data?.meta?.total ?? (Array.isArray(data?.data) ? data.data.length : 0))
        }
      } catch {
        // Silently fail
      }
    }
    if (isFree) {
      fetchUsage()
    }
  }, [isFree])

  if (isLoading) return null

  if (isPro) {
    return (
      <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {plan} Plan
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-2 px-3 py-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">Free Plan</span>
      </div>
      {serviceCount !== null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Services</span>
            <span>{serviceCount}/5</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min((serviceCount / 5) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      <Link
        href="/settings/license"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
      >
        <Zap className="h-3 w-3" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
