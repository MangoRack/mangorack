"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )}
        aria-label="Toggle theme"
      >
        <Monitor className="h-5 w-5 shrink-0" />
        {!collapsed && <span>Theme</span>}
      </button>
    )
  }

  function cycleTheme() {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const icon =
    theme === "light" ? (
      <Sun className="h-5 w-5 shrink-0" />
    ) : theme === "dark" ? (
      <Moon className="h-5 w-5 shrink-0" />
    ) : (
      <Monitor className="h-5 w-5 shrink-0" />
    )

  const label =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full",
        collapsed && "justify-center px-2"
      )}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
