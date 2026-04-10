"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import {
  GripVertical,
  RefreshCw,
  MoreVertical,
  Maximize2,
  Minimize2,
  Square,
  Trash2,
  Lock,
  ChevronDown,
} from "lucide-react"
import { TIME_RANGES, type WidgetSize } from "@/types/dashboard"
import { useDashboardStore } from "@/stores/dashboardStore"

interface WidgetWrapperProps {
  id: string
  title: string
  icon?: ReactNode
  children: ReactNode
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  isPro?: boolean
  showTimeRange?: boolean
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
  dragHandleProps?: Record<string, unknown>
}

export function WidgetWrapper({
  id,
  title,
  icon,
  children,
  isLoading,
  error,
  onRefresh,
  isPro,
  showTimeRange,
  timeRange,
  onTimeRangeChange,
  dragHandleProps,
}: WidgetWrapperProps) {
  const { isEditMode, resizeWidget, removeWidget } = useDashboardStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
        setTimeDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleResize = (size: WidgetSize) => {
    resizeWidget(id, size)
    setMenuOpen(false)
  }

  const handleRemove = () => {
    removeWidget(id)
    setMenuOpen(false)
  }

  return (
    <div
      className={`rounded-lg border bg-card shadow-sm flex flex-col h-full overflow-hidden ${
        isEditMode ? "border-dashed border-2 border-primary/40" : "border-border"
      }`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border min-h-[44px]">
        {isEditMode && (
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
            {...dragHandleProps}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm font-medium text-card-foreground truncate flex-1">
          {title}
        </span>

        {showTimeRange && onTimeRangeChange && (
          <div className="relative" ref={timeRef}>
            <button
              onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
            >
              {timeRange || "24h"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {timeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[80px]">
                {TIME_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      onTimeRangeChange(r.value)
                      setTimeDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                      timeRange === r.value
                        ? "text-primary font-medium"
                        : "text-popover-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {isEditMode && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">
                  Resize
                </div>
                <button
                  onClick={() => handleResize("small")}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-popover-foreground"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Small
                </button>
                <button
                  onClick={() => handleResize("medium")}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-popover-foreground"
                >
                  <Square className="w-3.5 h-3.5" /> Medium
                </button>
                <button
                  onClick={() => handleResize("large")}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-popover-foreground"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Large
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse bg-muted rounded" />
            <div className="h-4 w-1/2 animate-pulse bg-muted rounded" />
            <div className="h-8 w-full animate-pulse bg-muted rounded" />
            <div className="h-4 w-2/3 animate-pulse bg-muted rounded" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-6">
            <p className="text-sm text-destructive">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-xs text-primary hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          children
        )}

        {/* PRO overlay */}
        {isPro && (
          <div className="absolute inset-0 backdrop-blur-sm bg-card/60 flex flex-col items-center justify-center gap-3 z-10">
            <Lock className="w-8 h-8 text-[hsl(var(--pro))]" />
            <p className="text-sm font-semibold text-foreground">Pro Feature</p>
            <a
              href="/settings"
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-[hsl(var(--pro))] text-white hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
