"use client"

import { Bell, Search, CheckCheck, Languages } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { openGlobalSearch } from "@/components/global-search"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/routing"

export function CrmHeader({ title, description }: { title: string; description?: string }) {
  const t = useTranslations("Header")
  const ts = useTranslations("Stages")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  
  const [readIds, setReadIds] = useState<number[]>([])

  const notifications = [
    { 
      id: 1, 
      title: t("mock.newContact"), 
      body: t("mock.newContactBody", {name: "Sarah Johnson"}), 
      time: t("mock.time2m")
    },
    { 
      id: 2, 
      title: t("mock.dealStage"), 
      body: t("mock.dealStageBody", {company: "Acme Corp", stage: ts("underwriting")}), 
      time: t("mock.time1h")
    },
    { 
      id: 3, 
      title: t("mock.activity"), 
      body: t("mock.activityBody", {company: "TechCorp"}), 
      time: t("mock.time3h")
    },
  ].map(n => ({ ...n, read: readIds.includes(n.id) }))

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setReadIds(notifications.map(n => n.id))
  }

  function handleLanguageChange(newLocale: string) {
    router.replace(pathname, {locale: newLocale})
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-5">
      <SidebarTrigger className="-ms-1 size-8 text-muted-foreground hover:bg-accent hover:text-foreground" />
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
        {/* Search trigger — opens global command palette */}
        <button
          onClick={openGlobalSearch}
          className="hidden md:flex h-8 w-52 items-center gap-2 rounded-lg border border-border bg-secondary px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-start">{t("search")}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[9px] font-mono leading-none">⌘</kbd>
            <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[9px] font-mono leading-none">K</kbd>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Languages className="size-4" />
              <span className="sr-only">{t("language")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLanguageChange("en")} disabled={locale === "en"}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange("he")} disabled={locale === "he"}>
              עברית (Hebrew)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">{t("notifications")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{t("notifications")}</p>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-muted-foreground">{t("unread", {count: unreadCount})}</p>
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
                  {t("markAllRead")}
                </Button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setReadIds(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                  className="flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-accent"
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
                {t("viewAll")}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
