"use client"

import { useState, useEffect } from "react"
import { Cpu, Plus, X, Shield } from "lucide-react"
import { toast } from "sonner"
import { useLicense } from "@/hooks/useLicense"
import { cn } from "@/lib/utils"

interface Node {
  id: string
  name: string
  description: string | null
  type: "PHYSICAL" | "VIRTUAL" | "CONTAINER" | "CLOUD"
  hostname: string | null
  ipAddress: string | null
  os: string | null
  cpu: string | null
  ram: string | null
  storage: string | null
  tags: string[]
  isActive: boolean
  _count?: { services: number }
}

const NODE_TYPES = ["PHYSICAL", "VIRTUAL", "CONTAINER", "CLOUD"] as const

const typeBadgeColors: Record<string, string> = {
  PHYSICAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VIRTUAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CONTAINER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLOUD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export default function NodesPage() {
  const { isPro, isLoading: licenseLoading } = useLicense()
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formType, setFormType] = useState<(typeof NODE_TYPES)[number]>("PHYSICAL")
  const [formHostname, setFormHostname] = useState("")
  const [formIp, setFormIp] = useState("")
  const [formOs, setFormOs] = useState("")
  const [formCpu, setFormCpu] = useState("")
  const [formRam, setFormRam] = useState("")
  const [formStorage, setFormStorage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isPro) fetchNodes()
  }, [isPro])

  async function fetchNodes() {
    try {
      const res = await fetch("/api/nodes")
      if (!res.ok) throw new Error("Failed to fetch nodes")
      const data = await res.json()
      setNodes(Array.isArray(data.data) ? data.data : data.data?.nodes || [])
    } catch {
      toast.error("Failed to load nodes.")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormName("")
    setFormDescription("")
    setFormType("PHYSICAL")
    setFormHostname("")
    setFormIp("")
    setFormOs("")
    setFormCpu("")
    setFormRam("")
    setFormStorage("")
    setEditingNode(null)
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(node: Node) {
    setFormName(node.name)
    setFormDescription(node.description || "")
    setFormType(node.type)
    setFormHostname(node.hostname || "")
    setFormIp(node.ipAddress || "")
    setFormOs(node.os || "")
    setFormCpu(node.cpu || "")
    setFormRam(node.ram || "")
    setFormStorage(node.storage || "")
    setEditingNode(node)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error("Node name is required.")
      return
    }

    setSubmitting(true)
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        type: formType,
        hostname: formHostname.trim() || null,
        ipAddress: formIp.trim() || null,
        os: formOs.trim() || null,
        cpu: formCpu.trim() || null,
        ram: formRam.trim() || null,
        storage: formStorage.trim() || null,
      }

      const url = editingNode ? `/api/nodes?id=${editingNode.id}` : "/api/nodes"
      const method = editingNode ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save node")
      }

      toast.success(editingNode ? "Node updated." : "Node created.")
      closeForm()
      fetchNodes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save node.")
    } finally {
      setSubmitting(false)
    }
  }

  // PRO lock overlay for free users
  if (!licenseLoading && !isPro) {
    return (
      <div className="relative h-full">
        {/* Blurred placeholder grid */}
        <div className="filter blur-sm pointer-events-none select-none">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Nodes</h1>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Add Node
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-5 space-y-3"
              >
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-[hsl(var(--pro))]/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-[hsl(var(--pro))]" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Upgrade to Pro
            </h3>
            <p className="text-muted-foreground">
              Track up to 20 nodes with full hardware specs, service mapping,
              and health monitoring. Upgrade your license to unlock node
              tracking.
            </p>
            <a
              href="/settings/license"
              className="inline-block rounded-md bg-[hsl(var(--pro))] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Enter License Key
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nodes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your homelab hardware and virtual machines.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Node
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editingNode ? "Edit Node" : "Add Node"}
            </h3>
            <button
              onClick={closeForm}
              className="p-1 rounded-md text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. proxmox-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as (typeof NODE_TYPES)[number])
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {NODE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Hostname
                </label>
                <input
                  type="text"
                  value={formHostname}
                  onChange={(e) => setFormHostname(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. proxmox-01.local"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formIp}
                  onChange={(e) => setFormIp(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 192.168.1.100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Operating System
                </label>
                <input
                  type="text"
                  value={formOs}
                  onChange={(e) => setFormOs(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Debian 12"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  CPU
                </label>
                <input
                  type="text"
                  value={formCpu}
                  onChange={(e) => setFormCpu(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Intel i7-12700K"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  RAM
                </label>
                <input
                  type="text"
                  value={formRam}
                  onChange={(e) => setFormRam(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 64 GB DDR5"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Storage
                </label>
                <input
                  type="text"
                  value={formStorage}
                  onChange={(e) => setFormStorage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 2 TB NVMe"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingNode
                    ? "Update Node"
                    : "Create Node"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nodes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Loading nodes...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Cpu className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No nodes added yet.</p>
          <button
            onClick={openAddForm}
            className="text-sm text-primary hover:underline"
          >
            Add your first node
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="rounded-lg border border-border bg-card p-5 space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => openEditForm(node)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{node.name}</h3>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase px-2 py-0.5 rounded",
                    node.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  )}
                >
                  {node.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <span
                className={cn(
                  "inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded",
                  typeBadgeColors[node.type] || "bg-muted text-muted-foreground"
                )}
              >
                {node.type}
              </span>

              {node.ipAddress && (
                <p className="text-sm text-muted-foreground">{node.ipAddress}</p>
              )}

              {node.os && (
                <p className="text-sm text-muted-foreground">{node.os}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {node.cpu && <span>CPU: {node.cpu}</span>}
                {node.ram && <span>RAM: {node.ram}</span>}
              </div>

              {node._count && (
                <p className="text-xs text-muted-foreground">
                  {node._count.services} service
                  {node._count.services !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
