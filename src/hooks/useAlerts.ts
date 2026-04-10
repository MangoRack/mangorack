"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Alert, AlertWithEvents } from "@/types/alert"
import type { ApiResponse } from "@/types/api"

async function fetchAlerts(): Promise<ApiResponse<AlertWithEvents[]>> {
  const res = await fetch("/api/alerts")
  if (!res.ok) throw new Error("Failed to fetch alerts")
  return res.json()
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    select: (data) => data.data || [],
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alert: Partial<Alert>) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Failed to create alert")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
    },
  })
}

export function useUpdateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Alert> & { id: string }) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Failed to update alert")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
    },
  })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete alert")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
    },
  })
}
