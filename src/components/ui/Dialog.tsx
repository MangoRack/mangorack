"use client"

import { useEffect, useRef, useCallback, type ReactNode } from "react"

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleKeyDown)
    // Focus first focusable element
    const timer = setTimeout(() => {
      if (panelRef.current) {
        const focusable = panelRef.current.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }
    }, 0)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      clearTimeout(timer)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const titleId = `dialog-title-${title.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className}
      >
        <h3
          id={titleId}
          className="text-lg font-semibold text-card-foreground"
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
