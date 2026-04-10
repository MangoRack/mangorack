"use client"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { LayoutGrid } from "lucide-react"
import { useDashboardStore } from "@/stores/dashboardStore"
import type { WidgetConfig } from "@/types/dashboard"

import { UptimeWidget } from "./widgets/UptimeWidget"
import { ServiceStatusWidget } from "./widgets/ServiceStatusWidget"
import { LogStreamWidget } from "./widgets/LogStreamWidget"
import { MetricsChartWidget } from "./widgets/MetricsChartWidget"
import { AlertsWidget } from "./widgets/AlertsWidget"
import { NetworkWidget } from "./widgets/NetworkWidget"
import { ResourceUsageWidget } from "./widgets/ResourceUsageWidget"
import { QuickActionsWidget } from "./widgets/QuickActionsWidget"
import { QuickStatsWidget } from "./widgets/QuickStatsWidget"
import { ResponseTimeWidget } from "./widgets/ResponseTimeWidget"

const SIZE_CLASSES: Record<string, string> = {
  small: "col-span-12 sm:col-span-6 lg:col-span-3",
  medium: "col-span-12 md:col-span-6",
  large: "col-span-12",
}

function getWidgetComponent(type: string) {
  switch (type) {
    case "quick_stats":
      return QuickStatsWidget
    case "service_status":
      return ServiceStatusWidget
    case "uptime_summary":
      return UptimeWidget
    case "log_stream":
      return LogStreamWidget
    case "alerts_feed":
      return AlertsWidget
    case "response_time":
      return ResponseTimeWidget
    case "metrics_chart":
      return MetricsChartWidget
    case "network_map":
      return NetworkWidget
    case "resource_usage":
      return ResourceUsageWidget
    case "quick_actions":
      return QuickActionsWidget
    default:
      return null
  }
}

function SortableWidget({ widget }: { widget: WidgetConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  }

  const Component = getWidgetComponent(widget.type)
  if (!Component) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${SIZE_CLASSES[widget.size] || SIZE_CLASSES.medium} min-h-[200px]`}
      {...attributes}
    >
      <Component id={widget.id} dragHandleProps={listeners} />
    </div>
  )
}

export function DashboardGrid() {
  const { widgets, moveWidget, isLoading } = useDashboardStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      moveWidget(active.id as string, over.id as string)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="col-span-12 md:col-span-6 h-[200px] animate-pulse bg-muted rounded-lg"
          />
        ))}
      </div>
    )
  }

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutGrid className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No widgets on your dashboard
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Click the &quot;Add Widget&quot; button above to start building your
          dashboard.
        </p>
      </div>
    )
  }

  const sorted = [...widgets].sort((a, b) => a.position - b.position)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sorted.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-12 gap-4">
          {sorted.map((widget) => (
            <SortableWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
