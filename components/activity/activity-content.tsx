"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Mail, Phone, Calendar as CalendarIcon, StickyNote,
  Plus, Loader2, Trash2, Filter, X, ChevronRight,
  MoreHorizontal, Download, Upload, AlertCircle,
} from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { he, enUS } from "date-fns/locale"
import Papa from "papaparse"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { useTranslations, useLocale } from "next-intl"
import {
  fetchActivities,
  addActivity,
  deleteActivity,
} from "@/lib/features/activities/activitiesSlice"
import { type Activity } from "@/lib/crm-service"
import { exportToCSV } from "@/lib/utils/csv"
import { CSVImportDialog } from "@/components/shared/csv-import-dialog"

// ─── Type config ──────────────────────────────────────────────────────────────

const typeIcons = {
  email:   Mail,
  call:    Phone,
  meeting: CalendarIcon,
  note:    StickyNote,
}

const typeColors = {
  email:   "bg-chart-2/20 text-chart-2",
  call:    "bg-primary/20 text-primary",
  meeting: "bg-warning/20 text-warning",
  note:    "bg-chart-5/20 text-chart-5",
}

const typeBadgeStyles = {
  email:   "bg-chart-2/15 text-chart-2 border-chart-2/30",
  call:    "bg-primary/15 text-primary border-primary/30",
  meeting: "bg-warning/15 text-warning border-warning/30",
  note:    "bg-chart-5/15 text-chart-5 border-chart-5/30",
}

const emptyForm = {
  type: "call" as Activity["type"],
  title: "",
  contact: "",
  description: "",
}

// ─── CSV Import Component ────────────────────────────────────────────────────

// ─── Main Component ──────────────────────────────────────────────────────────

export function ActivityContent() {
  const t = useTranslations("Activity")
  const tp = useTranslations("Activity.placeholders")
  const common = useTranslations("Common")
  const tt = useTranslations("Toasts")
  const locale = useLocale()
  
  const dispatch = useAppDispatch()
  const { items: activities, status } = useAppSelector((s) => s.activities)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("timeline")
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  async function handleImportActivities(data: any[]) {
    let successCount = 0
    let errorCount = 0

    for (const row of data) {
      try {
        const activityData = {
          type: (row.type || row.Type || "call").toLowerCase() as Activity["type"],
          title: row.title || row.Title || "",
          contact: row.contact || row.Contact || row.borrower || row.Borrower || "",
          description: row.description || row.Description || row.notes || row.Notes || "",
          date: row.date || row.Date || new Date().toISOString(),
        }

        if (activityData.title && activityData.type) {
          await dispatch(addActivity(activityData)).unwrap()
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      toast.success(t("import.success", {count: successCount}))
      dispatch(fetchActivities())
    }
    if (errorCount > 0) {
      toast.error(tt("importError"))
    }
  }

  useEffect(() => {
    if (status === "idle") dispatch(fetchActivities())
  }, [status, dispatch])

  const filtered = typeFilter === "all"
    ? activities
    : activities.filter((a) => a.type === typeFilter)

  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return []
    return activities.filter((a) => {
      if (a.time.includes("hours ago") || a.time.includes("minutes ago") || a.time.includes("שעות") || a.time.includes("דקות")) {
        return isSameDay(new Date(), selectedDate)
      }
      if (a.time.includes("days ago") || a.time.includes("day ago") || a.time.includes("ימים") || a.time.includes("יום")) {
        const days = parseInt(a.time) || 0
        const date = new Date()
        date.setDate(date.getDate() - days)
        return isSameDay(date, selectedDate)
      }
      try {
        return isSameDay(parseISO(a.time), selectedDate)
      } catch {
        return false
      }
    })
  }, [activities, selectedDate])

  const activityDays = useMemo(() => {
    return activities.map(a => {
      if (a.time.includes("hours ago") || a.time.includes("minutes ago") || a.time.includes("שעות") || a.time.includes("דקות")) {
        return new Date()
      }
      if (a.time.includes("days ago") || a.time.includes("day ago") || a.time.includes("ימים") || a.time.includes("יום")) {
        const days = parseInt(a.time) || 0
        const date = new Date()
        date.setDate(date.getDate() - days)
        return date
      }
      try {
        return parseISO(a.time)
      } catch {
        return null
      }
    }).filter(Boolean) as Date[]
  }, [activities])

  async function handleAdd() {
    if (!form.title.trim()) {
      toast.error(tt("requiredFields"))
      return
    }
    setSaving(true)
    try {
      await dispatch(addActivity({
        type: form.type,
        title: form.title,
        contact: form.contact,
        description: form.description,
      })).unwrap()
      toast.success(tt("saveSuccess"))
      setAddOpen(false)
      setForm(emptyForm)
    } catch {
      toast.error(tt("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await dispatch(deleteActivity(deleteTarget.id)).unwrap()
      toast.success(tt("deleteSuccess"))
      setDeleteTarget(null)
    } catch {
      toast.error(tt("deleteError"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <TabsList className="h-9">
                <TabsTrigger value="timeline" className="px-3 text-xs">{t("tabs.timeline")}</TabsTrigger>
                <TabsTrigger value="calendar" className="px-3 text-xs">{t("tabs.calendar")}</TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 ms-2">
                    <Filter className="size-3.5" />
                    {typeFilter === "all" ? t("filters.all") : t(`filters.${typeFilter}` as any)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setTypeFilter("all")}>{t("filters.all")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTypeFilter("call")}>{t("filters.call")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTypeFilter("email")}>{t("filters.email")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTypeFilter("meeting")}>{t("filters.meeting")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTypeFilter("note")}>{t("filters.note")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {typeFilter !== "all" && (
                <button
                  onClick={() => setTypeFilter("all")}
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  {t(`filters.${typeFilter}` as any)}
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Download className="size-3.5" />
                    {t("actions.exportImport")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => exportToCSV(filtered, "activities.csv", {})}
                    disabled={filtered.length === 0}
                  >
                    <Download className="me-2 size-3.5" /> {t("actions.export")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                    <Upload className="me-2 size-3.5" /> {t("actions.import")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" className="h-9 gap-1.5" onClick={() => { setForm(emptyForm); setAddOpen(true) }}>
                <Plus className="size-3.5" />
                {t("actions.log")}
              </Button>
            </div>
          </div>

          <TabsContent value="timeline" className="mt-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                  <CalendarIcon className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("empty.title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("empty.sub")}</p>
                <Button size="sm" className="mt-4 gap-1.5" onClick={() => { setForm(emptyForm); setAddOpen(true) }}>
                  <Plus className="size-3.5" /> {t("actions.log")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((activity, index) => {
                  const Icon = typeIcons[activity.type as keyof typeof typeIcons]
                  const colorClass = typeColors[activity.type as keyof typeof typeColors]
                  const badgeStyle = typeBadgeStyles[activity.type as keyof typeof typeBadgeStyles]
                  return (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon className="size-4" />
                        </div>
                        {index < filtered.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">{activity.title}</span>
                                <Badge variant="outline" className={badgeStyle}>
                                  {t(`filters.${activity.type}` as any)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                              <button
                                onClick={() => setDeleteTarget(activity)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title={common("delete")}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          {activity.contact && (
                            <div className="mt-3 flex items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                                  {activity.contact.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{activity.contact}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              <Card className="border-border bg-card overflow-hidden">
                <CardContent className="p-4 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md"
                    locale={locale === 'he' ? he : enUS}
                    modifiers={{ hasActivity: activityDays }}
                    modifiersClassNames={{
                      hasActivity: "after:absolute after:bottom-1 after:start-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary relative"
                    }}
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy", { locale: locale === 'he' ? he : enUS }) : t("calendar.selectDate")}
                  </h3>
                  <Badge variant="secondary" className="h-5 px-1.5">{selectedDateActivities.length}</Badge>
                </div>

                <div className="space-y-3">
                  {selectedDateActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border bg-secondary/10">
                      <CalendarIcon className="size-6 text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">{t("calendar.noActivities")}</p>
                    </div>
                  ) : (
                    selectedDateActivities.map((activity) => {
                      const Icon = typeIcons[activity.type as keyof typeof typeIcons]
                      const colorClass = typeColors[activity.type as keyof typeof typeColors]
                      return (
                        <div key={activity.id} className="flex gap-3 rounded-lg border border-border bg-card p-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                            <Icon className="size-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                              {activity.contact && (
                                <>
                                  <span className="text-[10px] text-muted-foreground/30">•</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{activity.contact}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="size-3.5 text-muted-foreground self-center" />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportActivities}
        title={t("import.title")}
        description={t("import.description")}
        mappingHint={t("import.mappingHint")}
        previewColumns={[
          { header: t("dialogs.type"), key: "type", format: (v) => v.charAt(0).toUpperCase() + v.slice(1) },
          { header: t("dialogs.activityTitle"), key: "title" },
          { header: t("dialogs.contact"), key: "contact" },
        ]}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.logTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.logSub")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("dialogs.type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as Activity["type"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">{t("filters.call")}</SelectItem>
                    <SelectItem value="email">{t("filters.email")}</SelectItem>
                    <SelectItem value="meeting">{t("filters.meeting")}</SelectItem>
                    <SelectItem value="note">{t("filters.note")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act-contact">{t("dialogs.contact")}</Label>
                <Input
                  id="act-contact"
                  placeholder={tp("contact")}
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="act-title">{t("dialogs.activityTitle")}</Label>
              <Input
                id="act-title"
                placeholder={tp("title")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="act-desc">{t("dialogs.notes")}</Label>
              <Textarea
                id="act-desc"
                placeholder={tp("notes")}
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("actions.log")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteConfirm", { title: deleteTarget?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
