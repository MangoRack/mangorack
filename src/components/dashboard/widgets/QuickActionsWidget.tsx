"use client"

import { useRouter } from "next/navigation"
import { Plus, ScrollText, PlayCircle, FileDown, Zap } from "lucide-react"
import { toast } from "sonner"
import { WidgetWrapper } from "../WidgetWrapper"

interface QuickActionsWidgetProps {
  id: string
  dragHandleProps?: Record<string, unknown>
}

export function QuickActionsWidget({ id, dragHandleProps }: QuickActionsWidgetProps) {
  const router = useRouter()

  const handleManualCheck = async () => {
    try {
      toast.info("Running checks on all services...")
      const res = await fetch("/api/services/check", { method: "POST" })
      if (res.ok) {
        toast.success("All service checks triggered")
      } else {
        toast.error("Failed to trigger checks")
      }
    } catch {
      toast.error("Failed to trigger checks")
    }
  }

  return (
    <WidgetWrapper
      id={id}
      title="Quick Actions"
      icon={<Zap className="w-4 h-4" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => router.push("/services/new")}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors border border-border"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span className="text-foreground">Add Service</span>
        </button>

        <button
          onClick={() => router.push("/logs")}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors border border-border"
        >
          <ScrollText className="w-4 h-4 text-primary" />
          <span className="text-foreground">View Logs</span>
        </button>

        <button
          onClick={handleManualCheck}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors border border-border"
        >
          <PlayCircle className="w-4 h-4 text-primary" />
          <span className="text-foreground">Run Manual Check</span>
        </button>

        <button
          disabled
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left border border-border opacity-50 cursor-not-allowed"
        >
          <FileDown className="w-4 h-4 text-[hsl(var(--pro))]" />
          <span className="text-foreground">Export Report</span>
          <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--pro))]/10 text-[hsl(var(--pro))]">
            PRO
          </span>
        </button>
      </div>
    </WidgetWrapper>
  )
}
