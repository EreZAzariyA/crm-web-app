"use client"

import { useState, useEffect } from "react"
import {
  Mail, Phone, Calendar, StickyNote,
  Plus, Loader2, Trash2, Filter, X,
} from "lucide-react"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import {
  fetchActivities,
  addActivity,
  deleteActivity,
} from "@/lib/features/activities/activitiesSlice"
import { type Activity } from "@/lib/crm-service"

// ─── Type config ──────────────────────────────────────────────────────────────

const typeIcons = {
  email:   Mail,
  call:    Phone,
  meeting: Calendar,
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

const typeLabels: Record<Activity["type"], string> = {
  email: "Email", call: "Call", meeting: "Meeting", note: "Note",
}

const emptyForm = {
  type: "call" as Activity["type"],
  title: "",
  contact: "",
  description: "",
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityContent() {
  const dispatch = useAppDispatch()
  const { items: activities, status } = useAppSelector((s) => s.activities)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "idle") dispatch(fetchActivities())
  }, [status, dispatch])

  // ── Filter ──
  const filtered = typeFilter === "all"
    ? activities
    : activities.filter((a) => a.type === typeFilter)

  // ── Log Activity ──
  async function handleAdd() {
    if (!form.title.trim()) {
      toast.error("Title is required")
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
      toast.success("Activity logged")
      setAddOpen(false)
      setForm(emptyForm)
    } catch {
      toast.error("Failed to log activity")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await dispatch(deleteActivity(deleteTarget.id)).unwrap()
      toast.success("Activity deleted")
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete activity")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <CrmHeader title="Activity" description="Recent interactions and updates" />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4">

          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="size-3.5" />
                    {typeFilter === "all" ? "All Types" : typeLabels[typeFilter as Activity["type"]]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setTypeFilter("all")}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("call")}>Call</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("email")}>Email</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("meeting")}>Meeting</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("note")}>Note</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Active filter chip */}
              {typeFilter !== "all" && (
                <button
                  onClick={() => setTypeFilter("all")}
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  {typeLabels[typeFilter as Activity["type"]]}
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Button size="sm" className="h-9 gap-1.5" onClick={() => { setForm(emptyForm); setAddOpen(true) }}>
              <Plus className="size-3.5" />
              Log Activity
            </Button>
          </div>

          {/* ── Timeline ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No activities yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Log a call, email, meeting or note to get started</p>
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => { setForm(emptyForm); setAddOpen(true) }}>
                <Plus className="size-3.5" /> Log Activity
              </Button>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((activity, index) => {
                const Icon = typeIcons[activity.type]
                const colorClass = typeColors[activity.type]
                const badgeStyle = typeBadgeStyles[activity.type]
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
                                {typeLabels[activity.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                            <button
                              onClick={() => setDeleteTarget(activity)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete activity"
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LOG ACTIVITY DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record a call, email, meeting, or note.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as Activity["type"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act-contact">Contact</Label>
                <Input
                  id="act-contact"
                  placeholder="Jane Smith"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="act-title">Title *</Label>
              <Input
                id="act-title"
                placeholder="Discovery call with Acme Corp"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="act-desc">Notes</Label>
              <Textarea
                id="act-desc"
                placeholder="What was discussed..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
