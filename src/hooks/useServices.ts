"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Service, ServiceWithNode } from "@/types/service"
import type { ApiResponse } from "@/types/api"

export interface ServiceFilters {
  search?: string
  status?: string
  type?: string
  category?: string
  page?: number
  limit?: number
}

async function fetchServices(
  filters?: ServiceFilters
): Promise<ApiResponse<ServiceWithNode[]>> {
  const params = new URLSearchParams()
  if (filters?.search) params.set("search", filters.search)
  if (filters?.status && filters.status !== "ALL")
    params.set("status", filters.status)
  if (filters?.type) params.set("type", filters.type)
  if (filters?.category) params.set("category", filters.category)
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))

  const qs = params.toString()
  const res = await fetch(`/api/services${qs ? `?${qs}` : ""}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to fetch services")
  }
  return res.json()
}

async function fetchService(id: string): Promise<ApiResponse<Service>> {
  const res = await fetch(`/api/services/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to fetch service")
  }
  return res.json()
}

async function createService(
  data: Partial<Service>
): Promise<ApiResponse<Service>> {
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to create service")
  }
  return res.json()
}

async function updateService({
  id,
  ...data
}: Partial<Service> & { id: string }): Promise<ApiResponse<Service>> {
  const res = await fetch(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to update service")
  }
  return res.json()
}

async function deleteService(id: string): Promise<void> {
  const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? "Failed to delete service")
  }
}

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: ["services", filters],
    queryFn: () => fetchServices(filters),
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ["services", id],
    queryFn: () => fetchService(id),
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateService,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["services", variables.id] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}
