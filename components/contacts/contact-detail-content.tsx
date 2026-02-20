"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase,
  AtSign, PhoneCall, Clock, TrendingUp,
  Calendar, FileText, Loader2, Edit, Trash2, Kanban,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CrmHeader } from "@/components/crm-header"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { fetchContacts, updateContact, deleteContact } from "@/lib/features/contacts/contactsSlice"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { fetchActivities } from "@/lib/features/activities/activitiesSlice"
import type { Contact, Deal, Activity } from "@/lib/crm-service"
import { useTranslations, useLocale } from "next-intl"

// ─── Status helpers ─────────────────────────────────────────────────────────

const statusStyles: Record<Contact["status"], string> = {
  lead:     "bg-chart-2/15 text-chart-2 border-chart-2/30",
  prospect: "bg-warning/15 text-warning border-warning/30",
  customer: "bg-primary/15 text-primary border-primary/30",
  churned:  "bg-destructive/15 text-destructive border-destructive/30",
}

// ─── Stage helpers ───────────────────────────────────────────────────────────

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

// ─── Activity type helpers ───────────────────────────────────────────────────

const activityTypeIcon: Record<Activity["type"], React.ReactNode> = {
  email:   <Mail className="size-3.5" />,
  call:    <Phone className="size-3.5" />,
  meeting: <Calendar className="size-3.5" />,
  note:    <FileText className="size-3.5" />,
}

const activityTypeColor: Record<Activity["type"], string> = {
  email:   "bg-chart-2/15 text-chart-2",
  call:    "bg-primary/15 text-primary",
  meeting: "bg-warning/15 text-warning",
  note:    "bg-muted text-muted-foreground",
}

// ─── Edit form shape ─────────────────────────────────────────────────────────

type FormState = {
  name: string; email: string; company: string
  role: string; phone: string; status: Contact["status"]
}

const emptyForm: FormState = {
  name: "", email: "", company: "", role: "", phone: "", status: "lead",
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ContactDetailContent({ contactId }: { contactId: string }) {
  const t = useTranslations("Contacts")
  const tt = useTranslations("Toasts")
  const common = useTranslations("Common")
  const stages = useTranslations("Stages")
  const router   = useRouter()
  const dispatch = useAppDispatch()

  const { items: contacts, status: contactsStatus } = useAppSelector((s) => s.contacts)
  const { items: deals,    status: dealsStatus    } = useAppSelector((s) => s.deals)
  const { items: activities, status: activitiesStatus } = useAppSelector((s) => s.activities)

  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form,       setForm]       = useState<FormState>(emptyForm)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    if (contactsStatus   === "idle") dispatch(fetchContacts())
    if (dealsStatus      === "idle") dispatch(fetchDeals())
    if (activitiesStatus === "idle") dispatch(fetchActivities())
  }, [contactsStatus, dealsStatus, activitiesStatus, dispatch])

  const contact           = contacts.find((c) => c.id === contactId)
  const contactDeals      = deals.filter((d) => d.contact === contact?.name)
  const contactActivities = activities.filter((a) => a.contact === contact?.name)

  // ── Loading ──
  if (contactsStatus === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Not found ──
  if (contactsStatus === "succeeded" && !contact) {
    return (
      <>
        <CrmHeader title={t("notFound")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">{t("notFoundSub")}</p>
          <Button variant="outline" onClick={() => router.push("/contacts")}>
            <ArrowLeft className="me-2 size-4" /> {t("backToList")}
          </Button>
        </div>
      </>
    )
  }

  if (!contact) return null

  function openEdit() {
    setForm({
      name: contact!.name, email: contact!.email,
      company: contact!.company, role: contact!.role,
      phone: contact!.phone, status: contact!.status,
    })
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(tt("requiredFields")); return
    }
    setSaving(true)
    try {
      await dispatch(updateContact({ id: contactId, updates: form })).unwrap()
      toast.success(tt("updateSuccess"))
      setEditOpen(false)
    } catch {
      toast.error(tt("updateError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await dispatch(deleteContact(contactId)).unwrap()
      toast.success(tt("deleteSuccess"))
      router.push("/contacts")
    } catch {
      toast.error(tt("deleteError"))
    } finally {
      setDeleting(false)
    }
  }

  const totalPipeline = contactDeals.reduce((sum, d) => sum + d.value, 0)

  return (
    <>
      <CrmHeader
        title={contact.name}
        description={[contact.role, contact.company].filter(Boolean).join(" · ")}
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 lg:p-6 flex flex-col gap-5">

          {/* ── Top bar: back + actions ── */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button
              variant="ghost" size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ms-2"
              onClick={() => router.push("/contacts")}
            >
              <ArrowLeft className="size-3.5" />
              {t("allContacts")}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="h-8 gap-1.5"
                onClick={() => window.open(`mailto:${contact.email}`)}
              >
                <Mail className="size-3.5" /> {t("email")}
              </Button>
              {contact.phone && (
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5"
                  onClick={() => window.open(`tel:${contact.phone}`)}
                >
                  <Phone className="size-3.5" /> {t("call")}
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={openEdit}>
                <Edit className="size-3.5" /> {t("edit")}
              </Button>
              <Button
                variant="outline" size="sm"
                className="h-8 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" /> {t("delete")}
              </Button>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">

            {/* ── Left: Profile ── */}
            <div className="flex flex-col gap-4">

              {/* Avatar + name card */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center text-center gap-3">
                <Avatar className="size-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {contact.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold leading-tight">{contact.name}</h2>
                  {contact.role    && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                  {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
                </div>
                <Badge variant="outline" className={statusStyles[contact.status as Contact["status"]]}>
                  {t(`status.${contact.status}` as any)}
                </Badge>
              </div>

              {/* Contact info */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("info")}
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={<AtSign className="size-3.5" />} label={t("table.email" as any)}>
                    <a href={`mailto:${contact.email}`}
                      className="text-sm text-primary hover:underline truncate block">
                      {contact.email}
                    </a>
                  </InfoRow>
                  <InfoRow icon={<PhoneCall className="size-3.5" />} label={t("form.phone" as any)}>
                    {contact.phone
                      ? <a href={`tel:${contact.phone}`} className="text-sm text-primary hover:underline">{contact.phone}</a>
                      : <span className="text-sm text-muted-foreground">—</span>
                    }
                  </InfoRow>
                  <InfoRow icon={<Building2 className="size-3.5" />} label={t("table.company")}>
                    <span className="text-sm">{contact.company || "—"}</span>
                  </InfoRow>
                  <InfoRow icon={<Briefcase className="size-3.5" />} label={t("role")}>
                    <span className="text-sm">{contact.role || "—"}</span>
                  </InfoRow>
                  <InfoRow icon={<Clock className="size-3.5" />} label={t("lastActivity")}>
                    <span className="text-sm text-muted-foreground">{contact.lastActivity || "—"}</span>
                  </InfoRow>
                </div>
              </div>

              {/* Quick stats */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("summary")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox value={contactDeals.length}      label={t("deals")}      color="text-warning" />
                  <StatBox value={contactActivities.length} label={t("activities")} color="text-chart-2" />
                  <StatBox
                    value={`$${totalPipeline.toLocaleString()}`}
                    label={t("totalPipeline")}
                    color="text-primary"
                    colSpan
                  />
                </div>
              </div>
            </div>

            {/* ── Right: Tabs ── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[400px]">
              <Tabs defaultValue="deals">
                <div className="border-b border-border px-5 pt-4">
                  <TabsList className="h-9 gap-0 bg-transparent p-0">
                    <TabsTrigger
                      value="deals"
                      className="h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium
                        data-[state=active]:border-primary data-[state=active]:text-foreground
                        data-[state=active]:bg-transparent data-[state=active]:shadow-none
                        text-muted-foreground transition-colors"
                    >
                      {t("deals")}
                      {contactDeals.length > 0 && (
                        <span className="ms-1.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning leading-none">
                          {contactDeals.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="activities"
                      className="h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium
                        data-[state=active]:border-primary data-[state=active]:text-foreground
                        data-[state=active]:bg-transparent data-[state=active]:shadow-none
                        text-muted-foreground transition-colors"
                    >
                      {t("activities")}
                      {contactActivities.length > 0 && (
                        <span className="ms-1.5 rounded-full bg-chart-2/15 px-1.5 py-0.5 text-[10px] font-medium text-chart-2 leading-none">
                          {contactActivities.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Deals tab */}
                <TabsContent value="deals" className="p-5 space-y-3 mt-0">
                  {contactDeals.length === 0 ? (
                    <EmptyState
                      icon={<Kanban className="size-8 text-muted-foreground/30" />}
                      message={t("noDeals")}
                    />
                  ) : (
                    contactDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
                  )}
                </TabsContent>

                {/* Activities tab */}
                <TabsContent value="activities" className="p-5 mt-0">
                  {contactActivities.length === 0 ? (
                    <EmptyState
                      icon={<TrendingUp className="size-8 text-muted-foreground/30" />}
                      message={t("noActivities")}
                    />
                  ) : (
                    <div className="space-y-1">
                      {contactActivities.map((a) => <ActivityItem key={a.id} activity={a} />)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.editDescription")}</DialogDescription>
          </DialogHeader>
          <ContactEditForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {common("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.deleteTitle", {name: contact.name})}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Deal Card ───────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const t = useTranslations("Contacts")
  const tStages = useTranslations("Stages")
  const locale = useLocale()
  
  const closeDate = deal.expectedClose
    ? new Date(deal.expectedClose).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: "short", day: "numeric", year: "numeric" })
    : null

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{deal.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{deal.company}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] capitalize ${stageBadge[deal.stage] ?? ""}`}>
          {tStages(deal.stage as any)}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">${deal.value.toLocaleString()}</span>
        <span className="text-muted-foreground">{t("probability", {count: deal.probability})}</span>
        {closeDate && <span className="text-muted-foreground">{t("closes", {date: closeDate})}</span>}
      </div>

      <Progress value={deal.probability} className="h-1" />
    </div>
  )
}

// ─── Activity Item ───────────────────────────────────────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-accent/30 transition-colors">
      <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${activityTypeColor[activity.type]}`}>
        {activityTypeIcon[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{activity.title}</p>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{activity.time}</span>
        </div>
        {activity.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ─── Stat Box ────────────────────────────────────────────────────────────────

function StatBox({ value, label, color, colSpan = false }: {
  value: number | string; label: string; color: string; colSpan?: boolean
}) {
  return (
    <div className={`rounded-lg border border-border p-3 text-center ${colSpan ? "col-span-2" : ""}`}>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

function ContactEditForm({ form, onChange }: {
  form: FormState; onChange: (f: FormState) => void
}) {
  const t = useTranslations("Contacts.form")
  const ts = useTranslations("Contacts.status")
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [field]: e.target.value })

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cdf-name">{t("fullName")}</Label>
          <Input id="cdf-name" placeholder="Jane Smith" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cdf-email">{t("email")}</Label>
          <Input id="cdf-email" type="email" placeholder="jane@company.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdf-company">{t("company")}</Label>
          <Input id="cdf-company" placeholder="Acme Corp" value={form.company} onChange={set("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdf-role">{t("role")}</Label>
          <Input id="cdf-role" placeholder="VP of Sales" value={form.role} onChange={set("role")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdf-phone">{t("phone")}</Label>
          <Input id="cdf-phone" placeholder="+1 555 000 0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdf-status">{t("status")}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => onChange({ ...form, status: v as Contact["status"] })}
          >
            <SelectTrigger id="cdf-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">{ts("lead")}</SelectItem>
              <SelectItem value="prospect">{ts("prospect")}</SelectItem>
              <SelectItem value="customer">{ts("customer")}</SelectItem>
              <SelectItem value="churned">{ts("churned")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
