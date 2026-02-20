"use client"

import { useState, useEffect } from "react"
import {
  Plus, MoreHorizontal, Loader2, DollarSign,
  Building2, User, CalendarDays, ChevronRight,
  Search, Filter, FileText, X,
} from "lucide-react"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { type Deal } from "@/lib/crm-service"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import {
  fetchDeals, addDeal, updateDeal, deleteDeal,
} from "@/lib/features/deals/dealsSlice"

// ─── Stage config ─────────────────────────────────────────────────────────────

type Stage = Deal["stage"]

const stages: { key: Stage; label: string; dotColor: string }[] = [
  { key: "discovery",   label: "Discovery",   dotColor: "bg-chart-2" },
  { key: "proposal",    label: "Proposal",    dotColor: "bg-warning" },
  { key: "negotiation", label: "Negotiation", dotColor: "bg-chart-5" },
  { key: "closed-won",  label: "Closed Won",  dotColor: "bg-primary" },
  { key: "closed-lost", label: "Closed Lost", dotColor: "bg-destructive" },
]

const stageBorderMap: Record<Stage, string> = {
  discovery:    "border-chart-2/30",
  proposal:     "border-warning/30",
  negotiation:  "border-chart-5/30",
  "closed-won": "border-primary/30",
  "closed-lost":"border-destructive/30",
}

const stageBadgeMap: Record<Stage, string> = {
  discovery:    "bg-chart-2/15 text-chart-2 border-chart-2/30",
  proposal:     "bg-warning/15 text-warning border-warning/30",
  negotiation:  "bg-chart-5/15 text-chart-5 border-chart-5/30",
  "closed-won": "bg-primary/15 text-primary border-primary/30",
  "closed-lost":"bg-destructive/15 text-destructive border-destructive/30",
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const emptyForm = {
  title: "", company: "", value: "", stage: "discovery" as Stage,
  probability: "", contact: "", expectedClose: "", notes: "",
}
type FormState = typeof emptyForm

function DealForm({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [field]: e.target.value })

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="df-title">Deal Title *</Label>
        <Input id="df-title" placeholder="Enterprise License" value={form.title} onChange={set("title")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="df-company">Company</Label>
          <Input id="df-company" placeholder="Acme Corp" value={form.company} onChange={set("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-contact">Contact</Label>
          <Input id="df-contact" placeholder="Jane Smith" value={form.contact} onChange={set("contact")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-value">Value ($) *</Label>
          <Input id="df-value" type="number" placeholder="10000" value={form.value} onChange={set("value")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-prob">Probability (%)</Label>
          <Input id="df-prob" type="number" placeholder="50" min="0" max="100" value={form.probability} onChange={set("probability")} />
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={(v) => onChange({ ...form, stage: v as Stage })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {stages.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-close">Expected Close</Label>
          <Input id="df-close" placeholder="2024-12-31" value={form.expectedClose} onChange={set("expectedClose")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="df-notes">Notes</Label>
        <Textarea id="df-notes" placeholder="Key details, next steps..." rows={3} value={form.notes} onChange={set("notes")} />
      </div>
    </div>
  )
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onView, onEdit, onMoveStage, onDelete }: {
  deal: Deal
  onView: (d: Deal) => void
  onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void
  onDelete: (d: Deal) => void
}) {
  return (
    <div
      className={`rounded-lg border bg-secondary/30 p-3 ${stageBorderMap[deal.stage]} hover:bg-secondary/50 transition-colors cursor-pointer`}
      onClick={() => onView(deal)}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0 pr-1">
          <span className="text-sm font-medium text-foreground truncate">{deal.title}</span>
          <span className="text-xs text-muted-foreground truncate">{deal.company}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(deal) }}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal) }}>Edit Deal</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveStage(deal) }}>Move Stage</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(deal) }}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">${deal.value.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
      </div>
      <Progress value={deal.probability} className="mt-2 h-1" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate">{deal.contact}</span>
        <span className="text-xs text-muted-foreground shrink-0 ml-1">{deal.expectedClose}</span>
      </div>
    </div>
  )
}

// ─── Pipeline view ────────────────────────────────────────────────────────────

function PipelineView({ deals, onView, onEdit, onMoveStage, onDelete }: {
  deals: Deal[]
  onView: (d: Deal) => void
  onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void
  onDelete: (d: Deal) => void
}) {
  const grouped = stages.reduce((acc, s) => {
    acc[s.key] = deals.filter((d) => d.stage === s.key)
    return acc
  }, {} as Record<Stage, Deal[]>)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stages.map((stage) => {
        const stageDeals = grouped[stage.key] || []
        const total = stageDeals.reduce((sum, d) => sum + d.value, 0)
        return (
          <div key={stage.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${stage.dotColor}`} />
              <span className="text-sm font-medium text-foreground">{stage.label}</span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">{stageDeals.length}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">${total.toLocaleString()} total</div>
            <div className="flex flex-col gap-2">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onView={onView} onEdit={onEdit} onMoveStage={onMoveStage} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ deals, onView, onEdit, onDelete }: {
  deals: Deal[]
  onView: (d: Deal) => void
  onEdit: (d: Deal) => void
  onDelete: (d: Deal) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {deals.length === 0 && (
        <p className="py-12 text-center text-muted-foreground text-sm">No deals found</p>
      )}
      {deals.map((deal) => {
        const stage = stages.find((s) => s.key === deal.stage)
        return (
          <div key={deal.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => onView(deal)}>
            <div className="flex items-center gap-4">
              <div className={`size-2 rounded-full ${stage?.dotColor}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{deal.title}</span>
                <span className="text-xs text-muted-foreground">{deal.company} · {deal.contact}</span>
              </div>
            </div>
            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-foreground">${deal.value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{deal.probability}% probability</span>
              </div>
              <Badge variant="outline" className={`text-xs ${stageBadgeMap[deal.stage]}`}>{stage?.label}</Badge>
              <span className="text-xs text-muted-foreground w-20 text-right">{deal.expectedClose}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(deal)}>View Details</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(deal)}>Edit Deal</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(deal)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DealsContent() {
  const dispatch = useAppDispatch()
  const { items: deals, status } = useAppSelector((s) => s.deals)

  // ── Search / filter state ──
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")

  // ── Modal state ──
  const [addOpen, setAddOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [viewDeal, setViewDeal] = useState<Deal | null>(null)
  const [deleteDeal_, setDeleteDeal] = useState<Deal | null>(null)
  const [lostReason, setLostReason] = useState("")
  const [moveStageDeal, setMoveStageDeal] = useState<Deal | null>(null)
  const [moveStageTarget, setMoveStageTarget] = useState<Stage>("discovery")

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "idle") dispatch(fetchDeals())
  }, [status, dispatch])

  // ── Stats ──
  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0)
  const weightedValue = deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0
  const closedWon = deals.filter((d) => d.stage === "closed-won").length
  const closedLost = deals.filter((d) => d.stage === "closed-lost").length
  const closeRate = closedWon + closedLost > 0 ? Math.round((closedWon / (closedWon + closedLost)) * 100) : 0

  // ── Filtered deals ──
  const filtered = deals.filter((d) => {
    const matchSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.contact.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === "all" || d.stage === stageFilter
    return matchSearch && matchStage
  })

  // ── Add ──
  function openAdd() { setForm(emptyForm); setAddOpen(true) }

  async function handleAdd() {
    if (!form.title.trim() || !form.value) { toast.error("Title and value are required"); return }
    setSaving(true)
    try {
      await dispatch(addDeal({
        title: form.title, company: form.company, value: Number(form.value),
        stage: form.stage, probability: Number(form.probability) || 0,
        contact: form.contact, expectedClose: form.expectedClose,
        notes: form.notes, lostReason: "",
      })).unwrap()
      toast.success(`"${form.title}" added`)
      setAddOpen(false)
    } catch { toast.error("Failed to add deal") }
    finally { setSaving(false) }
  }

  // ── Edit ──
  function openEdit(deal: Deal) {
    setForm({
      title: deal.title, company: deal.company, value: String(deal.value),
      stage: deal.stage, probability: String(deal.probability),
      contact: deal.contact, expectedClose: deal.expectedClose,
      notes: deal.notes || "",
    })
    setEditDeal(deal)
  }

  async function handleEdit() {
    if (!editDeal) return
    if (!form.title.trim() || !form.value) { toast.error("Title and value are required"); return }
    setSaving(true)
    try {
      const updated = await dispatch(updateDeal({
        id: editDeal.id,
        updates: {
          title: form.title, company: form.company, value: Number(form.value),
          stage: form.stage, probability: Number(form.probability) || 0,
          contact: form.contact, expectedClose: form.expectedClose,
          notes: form.notes,
        },
      })).unwrap()
      toast.success(`"${form.title}" updated`)
      setEditDeal(null)
      if (viewDeal?.id === editDeal.id) setViewDeal(updated)
    } catch { toast.error("Failed to update deal") }
    finally { setSaving(false) }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!deleteDeal_) return
    setDeleting(true)
    try {
      // Save lost reason if closing as lost
      if (lostReason.trim()) {
        await dispatch(updateDeal({ id: deleteDeal_.id, updates: { lostReason } }))
      }
      await dispatch(deleteDeal(deleteDeal_.id)).unwrap()
      toast.success(`"${deleteDeal_.title}" deleted`)
      setDeleteDeal(null)
      setLostReason("")
      if (viewDeal?.id === deleteDeal_.id) setViewDeal(null)
    } catch { toast.error("Failed to delete deal") }
    finally { setDeleting(false) }
  }

  // ── Move Stage ──
  function openMoveStage(deal: Deal) { setMoveStageTarget(deal.stage); setMoveStageDeal(deal) }

  async function handleMoveStage() {
    if (!moveStageDeal) return
    setSaving(true)
    try {
      const updated = await dispatch(updateDeal({ id: moveStageDeal.id, updates: { stage: moveStageTarget } })).unwrap()
      toast.success(`Moved to ${stages.find((s) => s.key === moveStageTarget)?.label}`)
      setMoveStageDeal(null)
      if (viewDeal?.id === moveStageDeal.id) setViewDeal(updated)
    } catch { toast.error("Failed to move stage") }
    finally { setSaving(false) }
  }

  return (
    <>
      <CrmHeader title="Deals" description="Track and manage your sales pipeline" />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="pipeline" className="flex flex-col gap-4">

          {/* ── Top bar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <TabsList>
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-52 bg-secondary pl-8 text-sm"
                />
              </div>

              {/* Stage filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="size-3.5" />
                    {stageFilter === "all" ? "All Stages" : stages.find((s) => s.key === stageFilter)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setStageFilter("all")}>All Stages</DropdownMenuItem>
                  {stages.map((s) => (
                    <DropdownMenuItem key={s.key} onClick={() => setStageFilter(s.key)}>
                      <div className={`mr-2 size-2 rounded-full ${s.dotColor}`} />
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Active filter chip */}
              {stageFilter !== "all" && (
                <button
                  onClick={() => setStageFilter("all")}
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  {stages.find((s) => s.key === stageFilter)?.label}
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={openAdd}>
              <Plus className="size-3.5" />
              New Deal
            </Button>
          </div>

          {/* ── Stats cards ── */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Pipeline", value: `$${totalPipeline.toLocaleString()}` },
              { label: "Weighted Value", value: `$${Math.round(weightedValue).toLocaleString()}` },
              { label: "Avg Deal Size",  value: `$${Math.round(avgDealSize).toLocaleString()}` },
              { label: "Close Rate",     value: `${closeRate}%` },
            ].map((stat) => (
              <Card key={stat.label} className="border-border bg-card">
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Views ── */}
          <TabsContent value="pipeline">
            <PipelineView deals={filtered} onView={setViewDeal} onEdit={openEdit} onMoveStage={openMoveStage} onDelete={setDeleteDeal} />
          </TabsContent>
          <TabsContent value="list">
            <ListView deals={filtered} onView={setViewDeal} onEdit={openEdit} onDelete={setDeleteDeal} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ ADD DEAL ═══ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
            <DialogDescription>Fill in the details to add a new deal to your pipeline.</DialogDescription>
          </DialogHeader>
          <DealForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Add Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DEAL ═══ */}
      <Dialog open={!!editDeal} onOpenChange={(o) => !o && setEditDeal(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>Update the deal information below.</DialogDescription>
          </DialogHeader>
          <DealForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeal(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ VIEW DETAILS SHEET ═══ */}
      <Sheet open={!!viewDeal} onOpenChange={(o) => !o && setViewDeal(null)}>
        <SheetContent className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0">
          {viewDeal && (() => {
            const stage = stages.find((s) => s.key === viewDeal.stage)
            return (
              <>
                <SheetHeader className="p-6 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 size-3 rounded-full shrink-0 ${stage?.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg leading-tight">{viewDeal.title}</SheetTitle>
                      <SheetDescription className="mt-0.5">{viewDeal.company}</SheetDescription>
                      <Badge variant="outline" className={`mt-2 ${stageBadgeMap[viewDeal.stage]}`}>{stage?.label}</Badge>
                    </div>
                  </div>
                </SheetHeader>
                <Separator />
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  <div className="rounded-lg bg-secondary/40 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Deal Value</p>
                      <p className="text-2xl font-bold text-foreground">${viewDeal.value.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Probability</p>
                      <p className="text-2xl font-bold text-foreground">{viewDeal.probability}%</p>
                    </div>
                  </div>
                  <Progress value={viewDeal.probability} className="h-1.5" />
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
                    <div className="space-y-3">
                      <DetailRow icon={<Building2 className="size-4 text-muted-foreground" />} label="Company">
                        <span className="text-sm">{viewDeal.company || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<User className="size-4 text-muted-foreground" />} label="Contact">
                        <span className="text-sm">{viewDeal.contact || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<CalendarDays className="size-4 text-muted-foreground" />} label="Expected Close">
                        <span className="text-sm">{viewDeal.expectedClose || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<DollarSign className="size-4 text-muted-foreground" />} label="Weighted Value">
                        <span className="text-sm">${Math.round(viewDeal.value * viewDeal.probability / 100).toLocaleString()}</span>
                      </DetailRow>
                    </div>
                  </div>
                  {viewDeal.notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="size-3.5" /> Notes
                        </h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{viewDeal.notes}</p>
                      </div>
                    </>
                  )}
                  {viewDeal.lostReason && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">Lost Reason</h4>
                        <p className="text-sm text-muted-foreground">{viewDeal.lostReason}</p>
                      </div>
                    </>
                  )}
                </div>
                <Separator />
                <div className="p-4 flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => { setViewDeal(null); openEdit(viewDeal) }}>Edit Deal</Button>
                  <Button className="flex-1" variant="outline" onClick={() => { setViewDeal(null); openMoveStage(viewDeal) }}>
                    <ChevronRight className="mr-1.5 size-3.5" />Move Stage
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => { setViewDeal(null); setDeleteDeal(viewDeal) }} title="Delete deal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* ═══ MOVE STAGE ═══ */}
      <Dialog open={!!moveStageDeal} onOpenChange={(o) => !o && setMoveStageDeal(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Move Stage</DialogTitle>
            <DialogDescription>Move <strong>{moveStageDeal?.title}</strong> to a different stage.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {stages.map((s) => (
              <button key={s.key} onClick={() => setMoveStageTarget(s.key)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${moveStageTarget === s.key ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                <div className={`size-2.5 rounded-full ${s.dotColor}`} />
                <span className="text-sm font-medium">{s.label}</span>
                {moveStageTarget === s.key && <span className="ml-auto text-xs text-primary font-medium">Selected</span>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveStageDeal(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleMoveStage} disabled={saving || moveStageTarget === moveStageDeal?.stage}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={!!deleteDeal_} onOpenChange={(o) => { if (!o) { setDeleteDeal(null); setLostReason("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteDeal_?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          {/* Win/loss reason capture */}
          {(deleteDeal_?.stage === "closed-lost" || deleteDeal_?.stage === "closed-won") && (
            <div className="space-y-1.5 py-2">
              <Label htmlFor="lost-reason">
                {deleteDeal_.stage === "closed-lost" ? "Lost reason (optional)" : "Close notes (optional)"}
              </Label>
              <Textarea
                id="lost-reason"
                placeholder={deleteDeal_.stage === "closed-lost" ? "Why was this deal lost?" : "Any final notes..."}
                rows={2}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
