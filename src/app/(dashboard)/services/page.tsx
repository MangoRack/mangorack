"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Lock,
  Server,
  X,
} from "lucide-react"
import { useServices, type ServiceFilters } from "@/hooks/useServices"
import ServiceCard from "@/components/services/ServiceCard"
import ServiceTable from "@/components/services/ServiceTable"
import type { ServiceStatus } from "@/types/service"

const FREE_LIMIT = 5

export default function ServicesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [view, setView] = useState<"grid" | "table">("grid")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const filters: ServiceFilters = {
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  }

  const { data, isLoading, error } = useServices(filters)
  const services: any[] = Array.isArray((data as any)?.data) ? (data as any).data : []
  const total = (data as any)?.meta?.total ?? services.length
  const atFreeLimit = total >= FREE_LIMIT

  const upCount = services.filter((s: any) => s.currentStatus === "UP").length
  const downCount = services.filter((s: any) => s.currentStatus === "DOWN").length
  const degradedCount = services.filter(
    (s: any) => s.currentStatus === "DEGRADED"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage your homelab services
          </p>
        </div>
        {atFreeLimit ? (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Lock className="h-4 w-4" />
            Add Service
          </button>
        ) : (
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Link>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          Total: {total}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Up: {upCount}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Down: {downCount}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-500">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          Degraded: {degradedCount}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="ALL">All Status</option>
          <option value="UP">Up</option>
          <option value="DOWN">Down</option>
          <option value="DEGRADED">Degraded</option>
        </select>
        <div className="flex items-center rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={`inline-flex items-center justify-center h-10 w-10 transition-colors ${
              view === "grid"
                ? "bg-accent text-accent-foreground"
                : "bg-background text-muted-foreground hover:bg-accent/50"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`inline-flex items-center justify-center h-10 w-10 transition-colors ${
              view === "table"
                ? "bg-accent text-accent-foreground"
                : "bg-background text-muted-foreground hover:bg-accent/50"
            }`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full animate-pulse bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                  <div className="h-3 w-32 animate-pulse bg-muted rounded" />
                </div>
              </div>
              <div className="h-5 w-16 animate-pulse bg-muted rounded" />
              <div className="h-4 w-full animate-pulse bg-muted rounded" />
              <div className="h-3 w-20 animate-pulse bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load services. Please try again.
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No services yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Start monitoring your homelab by adding your first service.
          </p>
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first service
          </Link>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <ServiceTable services={services} />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Upgrade to Pro
              </h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You&apos;ve reached the free tier limit of {FREE_LIMIT} services.
              Upgrade to Pro for unlimited services, faster check intervals, and
              more.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-4 w-4 text-violet-400" />
              <span className="bg-violet-500/10 text-violet-400 text-xs rounded-full px-2 py-0.5">
                PRO
              </span>
              <span className="text-sm text-muted-foreground">
                Unlimited services, 10s intervals, priority alerts
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Maybe Later
              </button>
              <Link
                href="/settings?tab=billing"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
