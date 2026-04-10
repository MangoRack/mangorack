"use client"

import { ScrollText } from "lucide-react"
import { LogViewer } from "@/components/logs/LogViewer"

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">
            View and search logs from all your services
          </p>
        </div>
      </div>

      {/* Log Viewer */}
      <LogViewer maxHeight="calc(100vh - 280px)" />
    </div>
  )
}
