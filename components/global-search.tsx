"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, Kanban, Activity,
  Settings, ShieldCheck, User, ChevronRight,
  Building2, Phone,
} from "lucide-react"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations } from "next-intl"

// ─── Stage badge colours ─────────────────────────────────────────────────────

const stageBadge: Record<string, string> = {
  lead:              "bg-chart-2/15 text-chart-2 border-chart-2/30",
  pre_qualification: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  underwriting:      "bg-warning/15 text-warning border-warning/30",
  approved:          "bg-chart-3/15 text-chart-3 border-chart-3/30",
  active:            "bg-primary/15 text-primary border-primary/30",
  monitoring:        "bg-chart-4/15 text-chart-4 border-chart-4/30",
  collection:        "bg-orange-500/15 text-orange-500 border-orange-500/30",
  closed_won:        "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  closed_lost:       "bg-destructive/15 text-destructive border-destructive/30",
  default:           "bg-red-700/15 text-red-700 border-red-700/30",
}

// ─── Custom event ─────────────────────────────────────────────────────────────

export function openGlobalSearch() {
  document.dispatchEvent(new CustomEvent("open-global-search"))
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GlobalSearch() {
  const t = useTranslations("Search")
  const ts = useTranslations("Sidebar")
  const tc = useTranslations("Contacts")
  const tStages = useTranslations("Stages")
  const ta = useTranslations("Activity")
  
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const contacts   = useAppSelector((s) => s.contacts.items)
  const deals      = useAppSelector((s) => s.deals.items)
  const activities = useAppSelector((s) => s.activities.items)
  const user       = useAppSelector((s) => s.auth.user)

  const NAV_ITEMS = [
    { id: "dashboard", label: ts("dashboard"),  href: "/",         icon: LayoutDashboard },
    { id: "contacts",  label: ts("contacts"),   href: "/contacts", icon: Users },
    { id: "loans",     label: ts("loans"),      href: "/deals",    icon: Kanban },
    { id: "activity",  label: ts("activity"),   href: "/activity", icon: Activity },
    { id: "settings",  label: ts("settings"),   href: "/settings", icon: Settings },
  ]

  // ── Open shortcuts ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    function onCustomEvent() {
      setOpen(true)
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("open-global-search", onCustomEvent)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("open-global-search", onCustomEvent)
    }
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery("")
  }, [])

  const handleSelect = useCallback(
    (href: string) => {
      handleClose()
      router.push(href)
    },
    [router, handleClose]
  )

  // ── Filter results from Redux store ──
  const q = query.toLowerCase().trim()

  const matchedContacts = q
    ? contacts
        .filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : []

  const matchedDeals = q
    ? deals
        .filter(
          (d) =>
            d.title?.toLowerCase().includes(q) ||
            d.company?.toLowerCase().includes(q) ||
            d.contact?.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : []

  const matchedActivities = q
    ? activities
        .filter(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.contact?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : []

  const matchedNav = NAV_ITEMS.filter(
    (n) => !q || n.label.toLowerCase().includes(q)
  )

  const hasDataResults =
    matchedContacts.length + matchedDeals.length + matchedActivities.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}
      title={t("title")}
      description={t("description")}
      showCloseButton={false}
    >
      <CommandInput
        placeholder={t("placeholder")}
        value={query}
        onValueChange={setQuery}
      />

      <CommandList className="max-h-[420px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-2">
            <p className="text-sm text-muted-foreground">{t("noResults", {query})}</p>
            <p className="text-xs text-muted-foreground/70">{t("trySearching")}</p>
          </div>
        </CommandEmpty>

        {/* ── Contacts ── */}
        {matchedContacts.length > 0 && (
          <CommandGroup heading={ts("contacts")}>
            {matchedContacts.map((c) => (
              <CommandItem
                key={c.id}
                value={`contact-${c.id}-${c.name}-${c.email}`}
                onSelect={() => handleSelect("/contacts")}
                className="gap-3"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-chart-2/15">
                  <User className="size-3.5 text-chart-2" />
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {[c.company, c.email].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {c.status && (
                  <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                    {tc(`status.${c.status}` as any)}
                  </Badge>
                )}
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* ── Deals ── */}
        {matchedDeals.length > 0 && (
          <>
            {matchedContacts.length > 0 && <CommandSeparator />}
            <CommandGroup heading={ts("loans")}>
              {matchedDeals.map((d) => (
                <CommandItem
                  key={d.id}
                  value={`deal-${d.id}-${d.title}-${d.company}`}
                  onSelect={() => handleSelect("/deals")}
                  className="gap-3"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/15">
                    <Kanban className="size-3.5 text-warning" />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{d.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {d.company} · ${d.value.toLocaleString()}
                    </span>
                  </div>
                  {d.stage && (
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] ${stageBadge[d.stage] ?? ""}`}
                    >
                      {tStages(d.stage as any)}
                    </Badge>
                  )}
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ── Activities ── */}
        {matchedActivities.length > 0 && (
          <>
            {(matchedContacts.length + matchedDeals.length > 0) && <CommandSeparator />}
            <CommandGroup heading={ts("activity")}>
              {matchedActivities.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`activity-${a.id}-${a.title}`}
                  onSelect={() => handleSelect("/activity")}
                  className="gap-3"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="size-3.5 text-primary" />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{a.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {[a.contact, a.time].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{ta(`filters.${a.type}` as any)}</Badge>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ── Navigation ── */}
        {matchedNav.length > 0 && (
          <>
            {hasDataResults && <CommandSeparator />}
            <CommandGroup heading={t("navigation")}>
              {matchedNav.map((n) => (
                <CommandItem
                  key={n.id}
                  value={`nav-${n.id}-${n.label}`}
                  onSelect={() => handleSelect(n.href)}
                  className="gap-3"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <n.icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{t("goTo", {label: n.label})}</span>
                  <ChevronRight className="ms-auto size-3.5 shrink-0 text-muted-foreground" />
                </CommandItem>
              ))}
              {user?.systemRole === "admin" && (
                (!q || ts("admin").toLowerCase().includes(q)) && (
                  <CommandItem
                    value="nav-admin-panel"
                    onSelect={() => handleSelect("/admin")}
                    className="gap-3"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <ShieldCheck className="size-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm">{t("goTo", {label: ts("admin")})}</span>
                    <ChevronRight className="ms-auto size-3.5 shrink-0 text-muted-foreground" />
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </>
        )}

        {/* ── Footer hint ── */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">
            {t("shortcuts")}
          </span>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘</kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">K</kbd>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  )
}
