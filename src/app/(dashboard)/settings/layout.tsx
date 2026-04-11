"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, User, Bell, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/settings", label: "General", icon: Settings },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/license", label: "License", icon: KeyRound },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your MangoLab configuration.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-48 shrink-0">
          <ul className="flex md:flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Page content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
