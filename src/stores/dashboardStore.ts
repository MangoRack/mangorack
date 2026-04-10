import { create } from "zustand"
import type { WidgetConfig, DashboardState, WidgetSize } from "@/types/dashboard"

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "w1", type: "quick_stats", size: "medium", position: 0 },
  { id: "w2", type: "service_status", size: "medium", position: 1 },
  { id: "w3", type: "uptime_summary", size: "medium", position: 2 },
  { id: "w4", type: "log_stream", size: "medium", position: 3 },
  { id: "w5", type: "alerts_feed", size: "medium", position: 4 },
  { id: "w6", type: "response_time", size: "large", position: 5 },
]

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSave(saveFn: () => Promise<void>) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveFn()
  }, 2000)
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  widgets: DEFAULT_LAYOUT,
  isEditMode: false,
  isLoading: false,

  setEditMode: (edit: boolean) => {
    set({ isEditMode: edit })
    if (!edit) {
      get().saveLayout()
    }
  },

  moveWidget: (activeId: string, overId: string) => {
    const widgets = [...get().widgets]
    const activeIndex = widgets.findIndex((w) => w.id === activeId)
    const overIndex = widgets.findIndex((w) => w.id === overId)
    if (activeIndex === -1 || overIndex === -1) return

    const [moved] = widgets.splice(activeIndex, 1)
    widgets.splice(overIndex, 0, moved)

    const reindexed = widgets.map((w, i) => ({ ...w, position: i }))
    set({ widgets: reindexed })
    debouncedSave(() => get().saveLayout())
  },

  resizeWidget: (id: string, size: WidgetSize) => {
    const widgets = get().widgets.map((w) =>
      w.id === id ? { ...w, size } : w
    )
    set({ widgets })
    debouncedSave(() => get().saveLayout())
  },

  removeWidget: (id: string) => {
    const widgets = get()
      .widgets.filter((w) => w.id !== id)
      .map((w, i) => ({ ...w, position: i }))
    set({ widgets })
    debouncedSave(() => get().saveLayout())
  },

  addWidget: (type: string, size: WidgetSize = "medium") => {
    const widgets = get().widgets
    const newId = `w${Date.now()}`
    const newWidget: WidgetConfig = {
      id: newId,
      type,
      size,
      position: widgets.length,
    }
    set({ widgets: [...widgets, newWidget] })
    debouncedSave(() => get().saveLayout())
  },

  loadLayout: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch("/api/dashboard/layout")
      if (res.ok) {
        const json = await res.json()
        // API returns { data: { layout: { widgets: [...] } } }
        const layoutData = json?.data?.layout
        const widgets = layoutData?.widgets
        if (widgets && Array.isArray(widgets) && widgets.length > 0) {
          // Normalize: ensure each widget has id, type, size, position
          const normalized: WidgetConfig[] = widgets.map((w: Record<string, unknown>, i: number) => ({
            id: (w.id as string) ?? `w${i}`,
            type: (w.type as string) ?? "quick_stats",
            size: (w.size as WidgetSize) ?? "medium",
            position: typeof w.position === "number" ? w.position : i,
          }))
          set({ widgets: normalized })
        }
      }
    } catch {
      // Use default layout on error
    } finally {
      set({ isLoading: false })
    }
  },

  saveLayout: async () => {
    const { widgets } = get()
    try {
      await fetch("/api/dashboard/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Default",
          isDefault: true,
          layout: { widgets },
        }),
      })
    } catch {
      // Silently fail - layout is still in memory
    }
  },
}))
