"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Server,
  Activity,
  FileText,
  BarChart2,
  Bell,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/uiStore"
import { useLicenseStore } from "@/stores/licenseStore"
import { ThemeToggle } from "./ThemeToggle"

const SIDEBAR_STORAGE_KEY = "mangorack-sidebar-collapsed"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  proBadge?: boolean
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Services", icon: Server, href: "/services" },
  { label: "Uptime", icon: Activity, href: "/uptime" },
  { label: "Logs", icon: FileText, href: "/logs" },
  { label: "Analytics", icon: BarChart2, href: "/analytics" },
  { label: "Alerts", icon: Bell, href: "/alerts" },
  { label: "Nodes", icon: Cpu, href: "/nodes", proBadge: true },
]

const bottomNavItems: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useUIStore()
  const plan = useLicenseStore((s) => s.plan)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === "true") {
      setSidebarCollapsed(true)
    }
  }, [setSidebarCollapsed])

  function handleToggle() {
    const next = !sidebarCollapsed
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
    toggleSidebar()
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const SidebarInner = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200 h-full",
        mobile ? "w-64" : sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border h-16 shrink-0",
          sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"
        )}
      >
        <span className="text-2xl" role="img" aria-label="MangoRack">
          🥭
        </span>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-lg leading-tight">
              MangoRack
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit",
                plan === "FREE"
                  ? "bg-muted text-muted-foreground"
                  : "bg-[hsl(var(--pro))] text-white"
              )}
            >
              {plan}
            </span>
          </div>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!sidebarCollapsed && item.proBadge && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--pro))] text-white px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </Link>
          )
        })}

        <div className="my-2 border-t border-border" />

        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1">
        <ThemeToggle collapsed={sidebarCollapsed} />
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full",
            sidebarCollapsed && "justify-center px-2"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand" : "Collapse"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="shrink-0">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-md p-2 bg-card border border-border text-foreground md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 z-10 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarInner mobile />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SidebarInner />
      </div>
    </div>
  )
}
