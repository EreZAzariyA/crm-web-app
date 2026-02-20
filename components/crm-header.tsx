"use client"

import { Bell, Search, CheckCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New contact added", body: "Sarah Johnson was added to your contacts.", time: "2m ago", read: false },
  { id: 2, title: "Deal stage updated", body: "Acme Corp deal moved to Negotiation.", time: "1h ago", read: false },
  { id: 3, title: "Activity reminder", body: "Follow-up call with TechCorp is due today.", time: "3h ago", read: false },
]

export function CrmHeader({ title, description }: { title: string; description?: string }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-5">
      <SidebarTrigger className="-ml-1 size-8 text-muted-foreground hover:bg-accent hover:text-foreground" />
      <Separator orientation="vertical" className="h-5 bg-border" />

      {/* Title */}
      <div className="flex flex-1 min-w-0 flex-col justify-center">
        <h1 className="truncate text-sm font-semibold leading-tight text-foreground">{title}</h1>
        {description && (
          <p className="truncate text-xs leading-tight text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="h-8 w-44 rounded-lg border-border bg-secondary pl-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <ModeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-2">
              <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
