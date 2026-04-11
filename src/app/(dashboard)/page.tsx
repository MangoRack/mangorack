"use client"

import { useState, useRef, useEffect } from "react"
import { Settings2, Plus, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { useDashboardLayout } from "@/hooks/useDashboardLayout"
import { useDashboardStore } from "@/stores/dashboardStore"
import { useLicense } from "@/hooks/useLicense"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { WIDGET_DEFINITIONS } from "@/types/dashboard"

const DEFAULT_LAYOUT = [
  { id: "w1", type: "quick_stats", size: "medium" as const, position: 0 },
  { id: "w2", type: "service_status", size: "medium" as const, position: 1 },
  { id: "w3", type: "uptime_summary", size: "medium" as const, position: 2 },
  { id: "w4", type: "log_stream", size: "medium" as const, position: 3 },
  { id: "w5", type: "alerts_feed", size: "medium" as const, position: 4 },
  { id: "w6", type: "response_time", size: "large" as const, position: 5 },
]

export default function DashboardPage() {
  const { isEditMode, setEditMode, addWidget, widgets, saveLayout } =
    useDashboardLayout()
  useLicense() // refresh license status on mount
  const [addOpen, setAddOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleReset = () => {
    useDashboardStore.setState({ widgets: DEFAULT_LAYOUT })
    saveLayout()
    toast.success("Dashboard layout reset to default")
  }

  const handleAddWidget = (type: string) => {
    const def = WIDGET_DEFINITIONS.find((w) => w.type === type)
    addWidget(type, def?.defaultSize ?? "medium")
    setAddOpen(false)
    toast.success(`Added ${def?.name ?? type} widget`)
  }

  const existingTypes = widgets.map((w) => w.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              {/* Add widget */}
              <div className="relative" ref={popoverRef}>
                <button
                  onClick={() => setAddOpen(!addOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors text-foreground"
                >
                  <Plus className="w-4 h-4" />
                  Add Widget
                </button>
                {addOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <span className="text-sm font-medium text-popover-foreground">
                        Add Widget
                      </span>
                      <button
                        onClick={() => setAddOpen(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto py-1">
                      {WIDGET_DEFINITIONS.map((def) => {
                        const alreadyAdded = existingTypes.includes(def.type)
                        return (
                          <button
                            key={def.type}
                            onClick={() => !alreadyAdded && handleAddWidget(def.type)}
                            disabled={alreadyAdded}
                            className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors ${
                              alreadyAdded
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-muted cursor-pointer"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-popover-foreground">
                                  {def.name}
                                </span>
                                {def.isPro && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--pro))]/10 text-[hsl(var(--pro))]">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {def.description}
                              </p>
                            </div>
                            {alreadyAdded && (
                              <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
                                Added
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset layout */}
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Layout
              </button>
            </>
          )}

          {/* Edit toggle */}
          <button
            onClick={() => setEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              isEditMode
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted text-foreground"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            {isEditMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <DashboardGrid />
    </div>
  )
}
