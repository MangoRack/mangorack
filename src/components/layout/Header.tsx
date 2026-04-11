"use client"

import { usePathname } from "next/navigation"
import { Bell, User, LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/services": "Services",
  "/uptime": "Uptime",
  "/logs": "Logs",
  "/analytics": "Analytics",
  "/alerts": "Alerts",
  "/nodes": "Nodes",
  "/settings": "Settings",
  "/settings/profile": "Profile Settings",
  "/settings/license": "License",
  "/settings/notifications": "Notification Settings",
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== "/") return title
  }
  return "MangoRack"
}

export function Header() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover shadow-lg z-50">
              <div className="p-2">
                <a
                  href="/settings/profile"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </a>
                <button
                  onClick={async () => {
                    const { signOut } = await import("next-auth/react")
                    signOut({ callbackUrl: "/login" })
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
