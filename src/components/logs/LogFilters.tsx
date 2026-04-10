"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  X,
  Play,
  Pause,
  Filter,
} from "lucide-react"
import type { LogLevel } from "@/types/log"

const LOG_LEVELS: { level: LogLevel; color: string; bgColor: string }[] = [
  { level: "DEBUG", color: "text-slate-400", bgColor: "bg-slate-400" },
  { level: "INFO", color: "text-blue-400", bgColor: "bg-blue-400" },
  { level: "WARN", color: "text-yellow-400", bgColor: "bg-yellow-400" },
  { level: "ERROR", color: "text-red-400", bgColor: "bg-red-400" },
  { level: "FATAL", color: "text-red-600", bgColor: "bg-red-600" },
]

const TIME_RANGES = [
  { label: "15min", value: 15 },
  { label: "1h", value: 60 },
  { label: "6h", value: 360 },
  { label: "24h", value: 1440 },
] as const

export interface LogFiltersState {
  levels: LogLevel[]
  serviceId: string
  search: string
  timeRange: number | null
  from: string
  to: string
  live: boolean
}

interface LogFiltersProps {
  filters: LogFiltersState
  onChange: (filters: LogFiltersState) => void
  total?: number
  showing?: number
  services?: Array<{ id: string; name: string }>
}

export function LogFilters({
  filters,
  onChange,
  total,
  showing,
  services,
}: LogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, onChange])

  const toggleLevel = useCallback(
    (level: LogLevel) => {
      const current = filters.levels
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level]
      onChange({ ...filters, levels: next })
    },
    [filters, onChange]
  )

  const setTimeRange = useCallback(
    (mins: number | null) => {
      if (mins === null) {
        onChange({ ...filters, timeRange: null, from: "", to: "" })
        return
      }
      const now = new Date()
      const from = new Date(now.getTime() - mins * 60 * 1000)
      onChange({
        ...filters,
        timeRange: mins,
        from: from.toISOString(),
        to: now.toISOString(),
      })
    },
    [filters, onChange]
  )

  const clearFilters = useCallback(() => {
    setSearchInput("")
    onChange({
      levels: [],
      serviceId: "",
      search: "",
      timeRange: null,
      from: "",
      to: "",
      live: filters.live,
    })
  }, [filters.live, onChange])

  const hasActiveFilters =
    filters.levels.length > 0 ||
    filters.serviceId ||
    filters.search ||
    filters.timeRange

  return (
    <div className="flex flex-col gap-3">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Live toggle */}
        <button
          onClick={() => onChange({ ...filters, live: !filters.live })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filters.live
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-secondary text-secondary-foreground border border-border"
          }`}
        >
          {filters.live ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {filters.live ? "Live" : "Paused"}
        </button>

        {/* Time range buttons */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() =>
                setTimeRange(filters.timeRange === value ? null : value)
              }
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-border last:border-r-0 ${
                filters.timeRange === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Service filter */}
        {services && services.length > 0 && (
          <select
            value={filters.serviceId}
            onChange={(e) =>
              onChange({ ...filters, serviceId: e.target.value })
            }
            className="h-[34px] px-3 text-sm bg-secondary text-secondary-foreground border border-border rounded-md"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-[34px] pl-8 pr-3 text-sm bg-secondary text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        {/* Log count */}
        {total !== undefined && showing !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Showing {showing} of {total.toLocaleString()} logs
          </span>
        )}
      </div>

      {/* Level checkboxes */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Levels:</span>
        {LOG_LEVELS.map(({ level, color, bgColor }) => (
          <label
            key={level}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <div
              className={`h-3.5 w-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                filters.levels.length === 0 || filters.levels.includes(level)
                  ? `${bgColor} border-transparent`
                  : "border-muted-foreground/30 bg-transparent"
              }`}
            >
              {(filters.levels.length === 0 ||
                filters.levels.includes(level)) && (
                <svg
                  className="h-2.5 w-2.5 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className={`text-xs font-medium ${color}`}>{level}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
