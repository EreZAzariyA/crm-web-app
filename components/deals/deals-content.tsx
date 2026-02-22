"use client"

import { useState, useEffect, useRef } from "react"
import {
  Plus, MoreHorizontal, Loader2, DollarSign,
  Building2, User, CalendarDays, ChevronRight,
  Search, Filter, FileText, X, GripVertical, Download,
  Percent, TrendingUp, ChevronDown, ShieldAlert, RefreshCw,
  Upload, Trash2, CheckCircle2, AlertCircle, Clock, CalendarRange,
} from "lucide-react"
import {
  DndContext, DragOverlay, PointerSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent, closestCenter,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import Papa from "papaparse"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { type Deal, type DocumentRecord, type ExtractedFinancialData } from "@/lib/crm-service"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import {
  fetchDeals, addDeal, updateDeal, deleteDeal,
} from "@/lib/features/deals/dealsSlice"
import { exportToCSV } from "@/lib/utils/csv"
import { VALID_TRANSITIONS, TERMINAL_STAGES, validateTransition } from "@/lib/engines/deal-lifecycle"
import type { Stage } from "@/lib/engines/deal-lifecycle"
import { computeRiskScore, RATING_COLORS, RATING_LABELS, TIER_COLORS } from "@/lib/engines/risk-scoring"
import { CrmService } from "@/lib/crm-service"
import { AmortizationDialog } from "@/components/deals/amortization-dialog"
import { useTranslations, useLocale } from "next-intl"
import { StatCard } from "@/components/shared/stat-card"
import { DetailRow } from "@/components/shared/detail-row"
import { CSVImportDialog } from "@/components/shared/csv-import-dialog"

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_DOTS: Record<Stage, string> = {
  lead:              "bg-chart-2",
  pre_qualification: "bg-chart-5",
  underwriting:      "bg-warning",
  approved:          "bg-chart-3",
  active:            "bg-primary",
  monitoring:        "bg-chart-4",
  collection:        "bg-orange-500",
  closed_won:        "bg-emerald-500",
  closed_lost:       "bg-destructive",
  default:           "bg-red-700",
}

const ALL_STAGES: Stage[] = [
  "lead", "pre_qualification", "underwriting", "approved", "active",
  "monitoring", "collection", "closed_won", "closed_lost", "default"
]

const ACTIVE_STAGES = ALL_STAGES.filter((s) => !TERMINAL_STAGES.includes(s) && s !== "default")
const TERMINAL_STAGES_LIST = ALL_STAGES.filter((s) => TERMINAL_STAGES.includes(s) || s === "default")

const stageBorderMap: Record<Stage, string> = {
  lead:              "border-chart-2/30",
  pre_qualification: "border-chart-5/30",
  underwriting:      "border-warning/30",
  approved:          "border-chart-3/30",
  active:            "border-primary/30",
  monitoring:        "border-chart-4/30",
  collection:        "border-orange-500/30",
  closed_won:        "border-emerald-500/30",
  closed_lost:       "border-destructive/30",
  default:           "border-red-700/30",
}

const stageBadgeMap: Record<Stage, string> = {
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

// ─── Form ─────────────────────────────────────────────────────────────────────

const emptyForm = {
  title: "", company: "", value: "", stage: "lead" as Stage,
  probability: "", contact: "", expectedClose: "", notes: "",
  interestRate: "", loanTerm: "", ltvRatio: "", dtiRatio: "",
  creditScore: "", riskRating: "" as Deal["riskRating"] | "",
  approvedAmount: "", disbursementDate: "", maturityDate: "",
  originationFee: "", collateralValue: "",
}
type FormState = typeof emptyForm

function LoanForm({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  const t = useTranslations("Loans.form")
  const tStages = useTranslations("Stages")
  const tr = useTranslations("Risk")
  const [showLending, setShowLending] = useState(false)

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [field]: e.target.value })

  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="df-title">{t("core.title")}</Label>
        <Input id="df-title" placeholder={t("placeholders.title")} value={form.title} onChange={set("title")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="df-company">{t("core.borrower")}</Label>
          <Input id="df-company" placeholder={t("placeholders.borrower")} value={form.company} onChange={set("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-contact">{t("core.contact")}</Label>
          <Input id="df-contact" placeholder={t("placeholders.contact")} value={form.contact} onChange={set("contact")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-value">{t("core.amount")}</Label>
          <Input id="df-value" type="number" placeholder="500000" value={form.value} onChange={set("value")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-prob">{t("core.probability")}</Label>
          <Input id="df-prob" type="number" placeholder="85" min="0" max="100" value={form.probability} onChange={set("probability")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("core.stage")}</Label>
          <Select value={form.stage} onValueChange={(v) => onChange({ ...form, stage: v as Stage })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_STAGES.map((key) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block size-2 rounded-full ${STAGE_DOTS[key]}`} />
                    {tStages(key as any)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="df-close">{t("core.disbursement")}</Label>
          <Input id="df-close" placeholder="2024-12-31" value={form.expectedClose} onChange={set("expectedClose")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="df-notes">{t("core.notes")}</Label>
        <Textarea id="df-notes" placeholder={t("placeholders.notes")} rows={2} value={form.notes} onChange={set("notes")} />
      </div>

      <button
        type="button"
        onClick={() => setShowLending(!showLending)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="size-3.5" />
          {t("lending.title")}
        </span>
        <ChevronDown className={`size-3.5 transition-transform ${showLending ? "rotate-180" : ""}`} />
      </button>

      {showLending && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-secondary/10 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="df-rate">{t("lending.rate")}</Label>
            <Input id="df-rate" type="number" step="0.01" placeholder="8.5" value={form.interestRate} onChange={set("interestRate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-term">{t("lending.term")}</Label>
            <Input id="df-term" type="number" placeholder="36" value={form.loanTerm} onChange={set("loanTerm")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-ltv">{t("lending.ltv")}</Label>
            <Input id="df-ltv" type="number" step="0.1" placeholder="75.0" value={form.ltvRatio} onChange={set("ltvRatio")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-dti">{t("lending.dti")}</Label>
            <Input id="df-dti" type="number" step="0.1" placeholder="35.0" value={form.dtiRatio} onChange={set("dtiRatio")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-credit">{t("lending.creditScore")}</Label>
            <Input id="df-credit" type="number" placeholder="720" min="300" max="850" value={form.creditScore} onChange={set("creditScore")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("lending.riskRating")}</Label>
            <Select value={form.riskRating || ""} onValueChange={(v) => onChange({ ...form, riskRating: v as Deal["riskRating"] || "" })}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A – {tr("A")}</SelectItem>
                <SelectItem value="B">B – {tr("B")}</SelectItem>
                <SelectItem value="C">C – {tr("C")}</SelectItem>
                <SelectItem value="D">D – {tr("D")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-approved">{t("lending.approvedAmount")}</Label>
            <Input id="df-approved" type="number" placeholder="480000" value={form.approvedAmount} onChange={set("approvedAmount")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-origfee">{t("lending.origFee")}</Label>
            <Input id="df-origfee" type="number" step="0.1" placeholder="1.5" value={form.originationFee} onChange={set("originationFee")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-disbDate">{t("lending.disbDate")}</Label>
            <Input id="df-disbDate" placeholder="2025-01-15" value={form.disbursementDate} onChange={set("disbursementDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-matDate">{t("lending.matDate")}</Label>
            <Input id="df-matDate" placeholder="2028-01-15" value={form.maturityDate} onChange={set("maturityDate")} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="df-collateral">{t("lending.collateral")}</Label>
            <Input id="df-collateral" type="number" placeholder="650000" value={form.collateralValue} onChange={set("collateralValue")} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseOptNum(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function formToPayload(form: FormState): Omit<Deal, "id"> {
  return {
    title:            form.title,
    company:          form.company,
    value:            Number(form.value) || 0,
    stage:            form.stage,
    probability:      Number(form.probability) || 0,
    contact:          form.contact,
    expectedClose:    form.expectedClose,
    notes:            form.notes,
    lostReason:       "",
    interestRate:     parseOptNum(form.interestRate),
    loanTerm:         parseOptNum(form.loanTerm),
    ltvRatio:         parseOptNum(form.ltvRatio),
    dtiRatio:         parseOptNum(form.dtiRatio),
    creditScore:      parseOptNum(form.creditScore),
    riskRating:       (form.riskRating || null) as Deal["riskRating"],
    approvedAmount:   parseOptNum(form.approvedAmount),
    disbursementDate: form.disbursementDate || null,
    maturityDate:     form.maturityDate || null,
    originationFee:   parseOptNum(form.originationFee),
    collateralValue:  parseOptNum(form.collateralValue),
    underwriterId:    null,
    stageHistory:     [],
  }
}

function dealToForm(deal: Deal): FormState {
  return {
    title:            deal.title,
    company:          deal.company,
    value:            String(deal.value),
    stage:            deal.stage,
    probability:      String(deal.probability),
    contact:          deal.contact,
    expectedClose:    deal.expectedClose,
    notes:            deal.notes || "",
    interestRate:     deal.interestRate != null ? String(deal.interestRate) : "",
    loanTerm:         deal.loanTerm != null ? String(deal.loanTerm) : "",
    ltvRatio:         deal.ltvRatio != null ? String(deal.ltvRatio) : "",
    dtiRatio:         deal.dtiRatio != null ? String(deal.dtiRatio) : "",
    creditScore:      deal.creditScore != null ? String(deal.creditScore) : "",
    riskRating:       deal.riskRating || "",
    approvedAmount:   deal.approvedAmount != null ? String(deal.approvedAmount) : "",
    disbursementDate: deal.disbursementDate || "",
    maturityDate:     deal.maturityDate || "",
    originationFee:   deal.originationFee != null ? String(deal.originationFee) : "",
    collateralValue:  deal.collateralValue != null ? String(deal.collateralValue) : "",
  }
}

function RiskAssessmentPanel({ deal, onRescore }: { deal: Deal; onRescore: (rating: Deal["riskRating"]) => void }) {
  const t = useTranslations("Loans.riskAssessment")
  const tm = useTranslations("Metrics")
  const tr = useTranslations("Risk")
  const tt = useTranslations("Toasts")
  
  const [rescoring, setRescoring] = useState(false)
  const result = computeRiskScore({
    creditScore:    deal.creditScore    ?? null,
    ltvRatio:       deal.ltvRatio       ?? null,
    dtiRatio:       deal.dtiRatio       ?? null,
    loanTerm:       deal.loanTerm       ?? null,
    value:          deal.value,
    approvedAmount: deal.approvedAmount ?? null,
  })

  const metricRows: { label: string; metric: keyof typeof result.breakdown }[] = [
    { label: tm("creditScore"),  metric: "creditScore" },
    { label: tm("ltv"),     metric: "ltv" },
    { label: tm("dti"),     metric: "dti" },
    { label: tm("loanTerm"),     metric: "loanTerm" },
  ]

  async function handleRescore() {
    setRescoring(true)
    try {
      const res = await CrmService.rescoreDeal(deal.id)
      onRescore(res.rating)
      toast.success(tt("rescoreSuccess"))
    } catch {
      toast.error(tt("error"))
    } finally {
      setRescoring(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center size-14 rounded-full border-2 border-border bg-secondary/30">
            <span className="text-xl font-bold text-foreground leading-none">
              {result.hasEnoughData ? result.score : "—"}
            </span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
          <div>
            {result.hasEnoughData ? (
              <>
                <Badge variant="outline" className={`text-sm font-bold px-2 py-0.5 ${RATING_COLORS[result.rating]}`}>
                  {result.rating}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{tr(result.rating as any)}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t("hint")}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={handleRescore} disabled={rescoring}>
          {rescoring ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          {t("rescore")}
        </Button>
      </div>

      <div className="space-y-1.5">
        {metricRows.map(({ label, metric }) => {
          const m = result.breakdown[metric]
          return (
            <div key={metric} className="flex items-center gap-2">
              <div className={`size-1.5 rounded-full shrink-0 ${TIER_COLORS[m.tier]}`} />
              <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
              <span className="text-xs text-foreground">{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function applyExtractedData(
  data: ExtractedFinancialData,
  form: FormState,
  onChange: (f: FormState) => void,
) {
  const updates: Partial<FormState> = {}
  if (data.suggestedDtiRatio != null) updates.dtiRatio = String(data.suggestedDtiRatio)
  if (data.accountBalance    != null) updates.collateralValue = String(data.accountBalance)
  onChange({ ...form, ...updates })
  toast.success("Extracted data applied")
}

function DocStatusBadge({ status }: { status: DocumentRecord["status"] }) {
  if (status === "done")       return <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="size-3" /> Done</span>
  if (status === "failed")     return <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" /> Failed</span>
  if (status === "processing") return <span className="flex items-center gap-1 text-xs text-amber-600"><Loader2 className="size-3 animate-spin" /> Processing</span>
  return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> Pending</span>
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsTab({
  dealId,
  form,
  onChange,
}: {
  dealId: string | null
  form: FormState
  onChange: (f: FormState) => void
}) {
  const t = useTranslations("Loans.documents")
  const tt = useTranslations("Toasts")
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!dealId) return
    setLoadingDocs(true)
    CrmService.getDocuments(dealId)
      .then(setDocs)
      .catch(() => toast.error(tt("error")))
      .finally(() => setLoadingDocs(false))
  }, [dealId, tt])

  async function handleFileSelect(file: File) {
    if (!dealId) return
    setUploading(true)
    try {
      const doc = await CrmService.uploadDocument(dealId, file)
      setDocs((prev) => [doc, ...prev])
      toast.success(tt("uploadSuccess"))
    } catch (err: unknown) {
      toast.error(tt("uploadError"))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!dealId) return
    try {
      await CrmService.deleteDocument(dealId, doc.id)
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success(tt("deleteSuccess"))
    } catch {
      toast.error(tt("deleteError"))
    }
  }

  if (!dealId) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Upload className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("saveFirst")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div
        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFileSelect(file)
        }}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">{uploading ? t("uploading") : t("dropzone")}</p>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
            e.target.value = ""
          }}
        />
      </div>

      {loadingDocs ? (
        <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : docs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">{t("noDocs")}</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.originalName}</p>
                  <p className="text-xs text-muted-foreground">{fmtBytes(doc.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DocStatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDelete(doc)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {doc.status === "done" && doc.extractedData && (
                <div className="rounded-md bg-secondary/30 p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {doc.extractedData.monthlyRevenue != null && (
                      <>
                        <span className="text-muted-foreground">{t("extracted.revenue")}</span>
                        <span className="font-medium">${doc.extractedData.monthlyRevenue.toLocaleString()}</span>
                      </>
                    )}
                    {doc.extractedData.suggestedDtiRatio != null && (
                      <>
                        <span className="text-muted-foreground">{t("extracted.dti")}</span>
                        <span className="font-medium">{doc.extractedData.suggestedDtiRatio}%</span>
                      </>
                    )}
                    {doc.extractedData.accountBalance != null && (
                      <>
                        <span className="text-muted-foreground">{t("extracted.balance")}</span>
                        <span className="font-medium">${doc.extractedData.accountBalance.toLocaleString()}</span>
                      </>
                    )}
                    {doc.extractedData.suggestedMaxLoan != null && (
                      <>
                        <span className="text-muted-foreground">{t("extracted.maxLoan")}</span>
                        <span className="font-medium">${doc.extractedData.suggestedMaxLoan.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs w-full"
                    onClick={() => applyExtractedData(doc.extractedData!, form, onChange)}
                  >
                    {t("applyData")}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentsViewSection({ dealId }: { dealId: string }) {
  const t = useTranslations("Loans.documents")
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    CrmService.getDocuments(dealId)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dealId])

  if (loading) return <div className="flex justify-center py-3"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
  if (docs.length === 0) return <p className="text-xs text-muted-foreground">{t("noDocs")}</p>

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div key={doc.id} className="rounded-lg border border-border bg-card/50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{doc.originalName}</p>
              <p className="text-[11px] text-muted-foreground">{fmtBytes(doc.size)}</p>
            </div>
            <DocStatusBadge status={doc.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DealCard({ deal, onView, onEdit, onMoveStage, onDelete, dragHandleProps }: {
  deal: Deal
  onView: (d: Deal) => void
  onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void
  onDelete: (d: Deal) => void
  dragHandleProps?: any
}) {
  const tLoans = useTranslations("Loans.actions")
  const td = useTranslations("Loans.dialogs")
  const isTerminal = TERMINAL_STAGES.includes(deal.stage)
  return (
    <div
      className={`rounded-lg border bg-secondary/30 p-3 ${stageBorderMap[deal.stage]} hover:bg-secondary/50 transition-colors group cursor-pointer`}
      onClick={() => onView(deal)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-1.5 min-w-0 flex-1 pe-1">
          <div 
            {...dragHandleProps} 
            className="mt-0.5 cursor-grab active:cursor-grabbing p-1 -m-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{deal.title}</span>
            <span className="text-xs text-muted-foreground truncate">{deal.company}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground relative z-10" 
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onView(deal)}>{tLoans("viewDetails")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(deal)}>{tLoans("editLoan")}</DropdownMenuItem>
            {!isTerminal && (
              <DropdownMenuItem onSelect={() => onMoveStage(deal)}>{td("moveTitle")}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive"
              onSelect={() => onDelete(deal)}
            >
              {tLoans("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">${deal.value.toLocaleString()}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {deal.riskRating && (
            <Badge variant="outline" className={`text-xs h-4 px-1 ${RATING_COLORS[deal.riskRating]}`}>{deal.riskRating}</Badge>
          )}
          <span>{deal.probability}%</span>
        </div>
      </div>
      <Progress value={deal.probability} className="mt-2 h-1" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate">{deal.contact}</span>
        {deal.interestRate != null && (
          <span className="text-xs text-muted-foreground shrink-0 ms-1">{deal.interestRate}%</span>
        )}
      </div>
    </div>
  )
}

function DraggableDealCard({ deal, onView, onEdit, onMoveStage, onDelete }: {
  deal: Deal; onView: (d: Deal) => void; onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void; onDelete: (d: Deal) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id, data: { deal },
  })
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none",
  }
  return (
    <div ref={setNodeRef} style={style}>
      <DealCard 
        deal={deal} 
        onView={onView} 
        onEdit={onEdit} 
        onMoveStage={onMoveStage} 
        onDelete={onDelete} 
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function DroppableColumn({ stageKey, stageDeals, activeStage, onView, onEdit, onMoveStage, onDelete }: {
  stageKey: Stage; stageDeals: Deal[]; activeStage?: Stage | null
  onView: (d: Deal) => void; onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void; onDelete: (d: Deal) => void
}) {
  const t = useTranslations("Stages")
  const td = useTranslations("Loans.dialogs")
  
  const isAllowed = !activeStage || activeStage === stageKey || (VALID_TRANSITIONS[activeStage] ?? []).includes(stageKey)
  
  const { setNodeRef, isOver } = useDroppable({ 
    id: stageKey,
    disabled: !isAllowed
  })
  
  const total = stageDeals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={`flex flex-col gap-3 h-full min-w-[200px] transition-opacity ${!isAllowed ? "opacity-40 grayscale" : ""}`}>
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${STAGE_DOTS[stageKey]}`} />
        <span className="text-sm font-medium text-foreground">{t(stageKey as any)}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{stageDeals.length}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">${total.toLocaleString()} total</div>
      <div ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg p-1 -m-1 transition-all ${
          isOver ? "ring-2 ring-primary/40 ring-dashed bg-primary/5" : ""
        }`}>
        {stageDeals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} onView={onView} onEdit={onEdit} onMoveStage={onMoveStage} onDelete={onDelete} />
        ))}
        {stageDeals.length === 0 && (
          <div className={`flex flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-all min-h-[80px] ${
            isOver ? "border-primary/60 bg-primary/5 text-primary/70" : "border-border/40 text-muted-foreground/30"
          }`}>
            <span className="text-xs">{isOver ? td("dropHere") : td("noLoansCol")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineView({ deals, onView, onEdit, onMoveStage, onDelete, onStageDrop }: {
  deals: Deal[]; onView: (d: Deal) => void; onEdit: (d: Deal) => void
  onMoveStage: (d: Deal) => void; onDelete: (d: Deal) => void
  onStageDrop: (dealId: string, newStage: Stage) => void
}) {
  const t = useTranslations("Loans.dialogs")
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [showClosed, setShowClosed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  )

  const grouped = ALL_STAGES.reduce((acc, s) => {
    acc[s] = deals.filter((d) => d.stage === s)
    return acc
  }, {} as Record<Stage, Deal[]>)

  function handleDragStart({ active }: DragStartEvent) {
    const deal = deals.find((d) => d.id === String(active.id))
    if (deal) setActiveDeal(deal)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDeal(null)
    if (!over) return
    const newStage = String(over.id) as Stage
    const deal = deals.find((d) => d.id === String(active.id))
    if (!deal || newStage === deal.stage) return

    // Validate transition on frontend before calling API
    const validation = validateTransition(deal.stage, newStage)
    if (!validation.allowed) {
      toast.error(validation.reason || "Invalid transition")
      return
    }

    onStageDrop(String(active.id), newStage)
  }

  const closedTotal = TERMINAL_STAGES_LIST.reduce((sum, s) => sum + (grouped[s]?.length ?? 0), 0)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max items-stretch">
          {ACTIVE_STAGES.map((key) => (
            <div key={key} className="w-52">
              <DroppableColumn 
                stageKey={key} 
                stageDeals={grouped[key] || []}
                activeStage={activeDeal?.stage}
                onView={onView} onEdit={onEdit} onMoveStage={onMoveStage} onDelete={onDelete} 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowClosed(!showClosed)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronDown className={`size-4 transition-transform ${showClosed ? "rotate-180" : ""}`} />
          {t("closedCol", {count: closedTotal})}
        </button>
        {showClosed && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {TERMINAL_STAGES_LIST.map((key) => (
                <div key={key} className="w-52">
                  <DroppableColumn 
                    stageKey={key} 
                    stageDeals={grouped[key] || []}
                    activeStage={activeDeal?.stage}
                    onView={onView} onEdit={onEdit} onMoveStage={onMoveStage} onDelete={onDelete} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeDeal && (
          <div className="rotate-1 scale-105 shadow-2xl shadow-black/20">
            <DealCard deal={activeDeal} onView={() => {}} onEdit={() => {}} onMoveStage={() => {}} onDelete={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function ListView({ deals, onView, onEdit, onDelete }: {
  deals: Deal[]; onView: (d: Deal) => void; onEdit: (d: Deal) => void; onDelete: (d: Deal) => void
}) {
  const tStages = useTranslations("Stages")
  const tLoans = useTranslations("Loans.actions")
  const td = useTranslations("Loans.dialogs")
  
  return (
    <div className="flex flex-col gap-2">
      {deals.length === 0 && (
        <p className="py-12 text-center text-muted-foreground text-sm">{td("noLoans")}</p>
      )}
      {deals.map((deal) => {
        return (
          <div key={deal.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
            onClick={() => onView(deal)}
          >
            <div className="flex items-center gap-4">
              <div className={`size-2 rounded-full ${STAGE_DOTS[deal.stage]}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{deal.title}</span>
                <span className="text-xs text-muted-foreground">
                  {deal.company}{deal.contact ? ` · ${deal.contact}` : ""}
                  {deal.interestRate != null ? ` · ${deal.interestRate}%` : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-foreground">${deal.value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{deal.probability}% repayment</span>
              </div>
              <Badge variant="outline" className={`text-xs ${stageBadgeMap[deal.stage]}`}>{tStages(deal.stage as any)}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onView(deal)}>{tLoans("viewDetails")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onEdit(deal)}>{tLoans("editLoan")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    variant="destructive"
                    onSelect={() => onDelete(deal)}
                  >
                    {tLoans("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DealsContent() {
  const t = useTranslations("Loans")
  const tStages = useTranslations("Stages")
  const common = useTranslations("Common")
  const tt = useTranslations("Toasts")
  const ta = useTranslations("Loans.actions")
  const tr = useTranslations("Risk")
  const tdesc = useTranslations("Loans.stageDescriptions")
  
  const dispatch = useAppDispatch()
  const { items: deals, status } = useAppSelector((s) => s.deals)

  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")

  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [viewDeal, setViewDeal] = useState<Deal | null>(null)
  const [deleteDeal_, setDeleteDeal] = useState<Deal | null>(null)
  const [closeReason, setCloseReason] = useState("")
  const [moveStageDeal, setMoveStageDeal] = useState<Deal | null>(null)
  const [moveStageTarget, setMoveStageTarget] = useState<Stage>("lead")

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "idle") dispatch(fetchDeals())
  }, [status, dispatch])

  const activeLoanValue = deals.filter((d) => !TERMINAL_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0)
  const totalPortfolio = deals.reduce((s, d) => s + d.value, 0)
  const expectedRepayments = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0)
  const avgLoanSize = deals.length > 0 ? totalPortfolio / deals.length : 0
  const closedWon = deals.filter((d) => d.stage === "closed_won").length
  const closedLost = deals.filter((d) => d.stage === "closed_lost").length
  const approvalRate = closedWon + closedLost > 0 ? Math.round((closedWon / (closedWon + closedLost)) * 100) : 0

  const filtered = deals.filter((d) => {
    const matchSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.contact.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === "all" || d.stage === stageFilter
    return matchSearch && matchStage
  })

  async function handleImportDeals(data: any[]) {
    let successCount = 0
    let errorCount = 0

    for (const row of data) {
      try {
        const dealData = {
          title: row.title || row.Title || "",
          company: row.company || row.Company || row.borrower || row.Borrower || "",
          value: Number(row.value || row.Value || row.amount || row.Amount || 0),
          stage: (row.stage || row.Stage || "lead").toLowerCase().replace(" ", "_") as Stage,
          probability: Number(row.probability || row.Probability || 50),
          contact: row.contact || row.Contact || "",
          expectedClose: row.expectedClose || row.ExpectedClose || "",
          notes: row.notes || row.Notes || "",
        }

        if (dealData.title && dealData.value) {
          await dispatch(addDeal(dealData)).unwrap()
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
      dispatch(fetchDeals())
    }
    if (errorCount > 0) {
      toast.error(tt("importError"))
    }
  }

  function openAdd() { setForm(emptyForm); setAddOpen(true) }

  async function handleAdd() {
    if (!form.title.trim() || !form.value) { toast.error(tt("requiredFields")); return }
    setSaving(true)
    try {
      await dispatch(addDeal(formToPayload(form))).unwrap()
      toast.success(tt("saveSuccess"))
      setAddOpen(false)
    } catch { toast.error(tt("saveError")) }
    finally { setSaving(false) }
  }

  function openEdit(deal: Deal) { setForm(dealToForm(deal)); setEditDeal(deal) }

  async function handleEdit() {
    if (!editDeal) return
    if (!form.title.trim() || !form.value) { toast.error(tt("requiredFields")); return }
    setSaving(true)
    try {
      const updated = await dispatch(updateDeal({
        id: editDeal.id,
        updates: formToPayload(form),
      })).unwrap()
      toast.success(tt("updateSuccess"))
      setEditDeal(null)
      if (viewDeal?.id === editDeal.id) setViewDeal(updated)
    } catch (err: unknown) {
      toast.error(tt("updateError"))
    }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteDeal_) return
    setDeleting(true)
    try {
      if (closeReason.trim()) {
        await dispatch(updateDeal({ id: deleteDeal_.id, updates: { lostReason: closeReason } }))
      }
      await dispatch(deleteDeal(deleteDeal_.id)).unwrap()
      toast.success(tt("deleteSuccess"))
      setDeleteDeal(null)
      setCloseReason("")
      if (viewDeal?.id === deleteDeal_.id) setViewDeal(null)
    } catch { toast.error(tt("deleteError")) }
    finally { setDeleting(false) }
  }

  async function handleStageDrop(dealId: string, newStage: Stage) {
    try {
      const updated = await dispatch(updateDeal({ id: dealId, updates: { stage: newStage } })).unwrap()
      toast.success(tt("updateSuccess"))
      if (viewDeal?.id === dealId) setViewDeal(updated)
    } catch (err: unknown) {
      toast.error(tt("updateError"))
    }
  }

  function openMoveStage(deal: Deal) { setMoveStageTarget(deal.stage); setMoveStageDeal(deal) }

  async function handleMoveStage() {
    if (!moveStageDeal) return
    setSaving(true)
    try {
      const updated = await dispatch(updateDeal({ id: moveStageDeal.id, updates: { stage: moveStageTarget } })).unwrap()
      toast.success(tt("updateSuccess"))
      setMoveStageDeal(null)
      if (viewDeal?.id === moveStageDeal.id) setViewDeal(updated)
    } catch (err: unknown) {
      toast.error(tt("updateError"))
    }
    finally { setSaving(false) }
  }

  const validNextStages = moveStageDeal
    ? (VALID_TRANSITIONS[moveStageDeal.stage] ?? []).map((key) => ({
        key,
        label: tStages(key as any),
        description: tdesc(key as any),
        dotColor: STAGE_DOTS[key]
      }))
    : []

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="pipeline" className="flex flex-col gap-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <TabsList>
                <TabsTrigger value="pipeline">{t("pipeline")}</TabsTrigger>
                <TabsTrigger value="list">{t("list")}</TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-52 bg-secondary ps-8 text-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="size-3.5" />
                    {stageFilter === "all" ? t("allStages") : tStages(stageFilter as any)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setStageFilter("all")}>{t("allStages")}</DropdownMenuItem>
                  {ALL_STAGES.map((key) => (
                    <DropdownMenuItem key={key} onSelect={() => setStageFilter(key)}>
                      <div className={`me-2 size-2 rounded-full ${STAGE_DOTS[key]}`} />
                      {tStages(key as any)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Download className="size-3.5" />
                    {ta("exportImport")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => exportToCSV(filtered, "loans.csv", {})}>
                    <Download className="me-2 size-3.5" /> {ta("export")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                    <Upload className="me-2 size-3.5" /> {ta("import")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" className="h-9 gap-1.5" onClick={openAdd}>
                <Plus className="size-3.5" />
                {t("newLoan")}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label={t("stats.activePortfolio")} value={`$${activeLoanValue.toLocaleString()}`} />
            <StatCard label={t("stats.expectedRepayments")} value={`$${Math.round(expectedRepayments).toLocaleString()}`} />
            <StatCard label={t("stats.avgLoanSize")} value={`$${Math.round(avgLoanSize).toLocaleString()}`} />
            <StatCard label={t("stats.approvalRate")} value={`${approvalRate}%`} />
          </div>

          <TabsContent value="pipeline">
            <PipelineView deals={filtered} onView={setViewDeal} onEdit={openEdit} onMoveStage={openMoveStage} onDelete={setDeleteDeal} onStageDrop={handleStageDrop} />
          </TabsContent>
          <TabsContent value="list">
            <ListView deals={filtered} onView={setViewDeal} onEdit={openEdit} onDelete={setDeleteDeal} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialogs.addTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.addDescription")}</DialogDescription>
          </DialogHeader>
          <LoanForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}{t("newLoan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDeal} onOpenChange={(o) => !o && setEditDeal(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.editDescription")}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="mt-0">
            <TabsList className="mb-2">
              <TabsTrigger value="details">{t("form.tabs.details")}</TabsTrigger>
              <TabsTrigger value="documents">{t("form.tabs.documents")}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <LoanForm form={form} onChange={setForm} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab dealId={editDeal?.id ?? null} form={form} onChange={setForm} />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeal(null)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}{common("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!viewDeal} onOpenChange={(o) => !o && setViewDeal(null)}>
        <SheetContent className="w-full sm:max-w-[460px] flex flex-col gap-0 p-0">
          {viewDeal && (() => {
            const isTerminal = TERMINAL_STAGES.includes(viewDeal.stage)
            return (
              <>
                <SheetHeader className="p-6 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 size-3 rounded-full shrink-0 ${STAGE_DOTS[viewDeal.stage]}`} />
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg leading-tight">{viewDeal.title}</SheetTitle>
                      <SheetDescription className="mt-0.5">{viewDeal.company}</SheetDescription>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={stageBadgeMap[viewDeal.stage]}>{tStages(viewDeal.stage as any)}</Badge>
                        {viewDeal.riskRating && (
                          <Badge variant="outline" className={`text-xs ${RATING_COLORS[viewDeal.riskRating]}`}>
                            {viewDeal.riskRating} · {tr(viewDeal.riskRating as any)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetHeader>
                <Separator />
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  <div className="rounded-lg bg-secondary/40 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("view.amount")}</p>
                      <p className="text-2xl font-bold text-foreground">${viewDeal.value.toLocaleString()}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground mb-1">{t("view.probability")}</p>
                      <p className="text-2xl font-bold text-foreground">{viewDeal.probability}%</p>
                    </div>
                  </div>
                  <Progress value={viewDeal.probability} className="h-1.5" />

                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("view.details")}</h4>
                    <div className="space-y-3">
                      <DetailRow icon={<Building2 className="size-4 text-muted-foreground" />} label={t("form.core.borrower")}>
                        <span className="text-sm">{viewDeal.company || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<User className="size-4 text-muted-foreground" />} label={t("form.core.contact")}>
                        <span className="text-sm">{viewDeal.contact || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<CalendarDays className="size-4 text-muted-foreground" />} label={t("form.core.disbursement")}>
                        <span className="text-sm">{viewDeal.expectedClose || "—"}</span>
                      </DetailRow>
                      <DetailRow icon={<DollarSign className="size-4 text-muted-foreground" />} label={t("view.repayments")}>
                        <span className="text-sm">${Math.round(viewDeal.value * viewDeal.probability / 100).toLocaleString()}</span>
                      </DetailRow>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="size-3.5" /> {t("riskAssessment.title")}
                    </h4>
                    <RiskAssessmentPanel deal={viewDeal} onRescore={(r) => setViewDeal({...viewDeal, riskRating: r})} />
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="size-3.5" /> {t("documents.title")}
                    </h4>
                    <DocumentsViewSection dealId={viewDeal.id} />
                  </div>
                </div>
                <Separator />
                <div className="p-4 flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => { setViewDeal(null); openEdit(viewDeal) }}>{ta("editLoan")}</Button>
                  {!isTerminal && (
                    <Button className="flex-1" variant="outline" onClick={() => { setViewDeal(null); openMoveStage(viewDeal) }}>
                      {t("dialogs.moveTitle")}
                    </Button>
                  )}
                  {viewDeal.interestRate != null && viewDeal.loanTerm != null && (
                    <Button variant="outline" size="icon" title={t("view.schedule")} onClick={() => setScheduleOpen(true)}>
                      <CalendarRange className="size-4" />
                    </Button>
                  )}
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={!!moveStageDeal} onOpenChange={(o) => !o && setMoveStageDeal(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.moveTitle")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.moveDescription", {name: moveStageDeal?.title ?? ""})}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            {validNextStages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("dialogs.noTransitions")}</p>
            ) : (
              validNextStages.map((s) => (
                <button key={s.key} onClick={() => setMoveStageTarget(s.key as Stage)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-start transition-colors ${moveStageTarget === s.key ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                  <div className={`size-2.5 rounded-full ${s.dotColor}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{s.label}</span>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  {moveStageTarget === s.key && <span className="text-xs text-primary font-medium">{t("dialogs.selected")}</span>}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveStageDeal(null)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={handleMoveStage} disabled={saving || moveStageTarget === moveStageDeal?.stage || validNextStages.length === 0}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDeal_} onOpenChange={(o) => { if (!o) { setDeleteDeal(null); setCloseReason("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.deleteTitle", {name: deleteDeal_?.title ?? ""})}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialogs.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteDeal_ && (TERMINAL_STAGES.includes(deleteDeal_.stage) || deleteDeal_.stage === "default") && (
            <div className="space-y-1.5 py-2">
              <Label htmlFor="close-reason">{t("dialogs.reasonLabel")}</Label>
              <Textarea
                id="close-reason"
                placeholder={t("dialogs.reasonPlaceholder")}
                rows={2}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}{common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportDeals}
        title={t("import.title")}
        description={t("import.description")}
        mappingHint={t("import.mappingHint")}
        previewColumns={[
          { header: t("form.core.title"), key: "title" },
          { header: t("form.core.amount"), key: "value", format: (v) => `$${Number(v || 0).toLocaleString()}` },
        ]}
      />

      {viewDeal && (
        <AmortizationDialog
          deal={viewDeal}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
        />
      )}
    </>
  )
}
