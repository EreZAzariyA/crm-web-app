"use client"

import { useEffect, useState } from "react"
import { Loader2, ClipboardCheck } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BorrowerScorecard } from "@/components/underwriting/borrower-scorecard"
import { UnderwritingChecklist } from "@/components/underwriting/underwriting-checklist"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchDeals, updateDeal } from "@/lib/features/deals/dealsSlice"
import { RATING_COLORS, RATING_LABELS } from "@/lib/engines/risk-scoring"
import type { Deal } from "@/lib/crm-service"
import { useTranslations, useLocale } from "next-intl"

const STAGE_DOT: Record<string, string> = {
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

function formatDate(iso: string, locale: string) {
  try {
    const d = parseISO(iso)
    return isValid(d) ? format(d, locale === 'he' ? "d בMMM, yyyy · H:mm" : "MMM d, yyyy · h:mm a") : iso
  } catch {
    return iso
  }
}

// ── Left-panel loan item ──────────────────────────────────────────────────────

interface LoanItemProps {
  deal: Deal
  selected: boolean
  onClick: () => void
}

function LoanItem({ deal, selected, onClick }: LoanItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-start px-3 py-3 rounded-lg border transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{deal.title}</p>
          <p className="text-xs text-muted-foreground truncate">{deal.company}</p>
        </div>
        {deal.riskRating && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${RATING_COLORS[deal.riskRating]}`}
          >
            {deal.riskRating}
          </Badge>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">${deal.value.toLocaleString()}</span>
        {deal.creditScore != null && <span>CS {deal.creditScore}</span>}
      </div>
    </button>
  )
}

// ── Stage history timeline ────────────────────────────────────────────────────

function StageTimeline({ deal }: { deal: Deal }) {
  const t = useTranslations("Underwriting")
  const tStages = useTranslations("Stages")
  const locale = useLocale()

  if (!deal.stageHistory || deal.stageHistory.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">{t("history")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">{t("noHistory")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">{t("history")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative flex flex-col gap-0">
          {(deal.stageHistory ?? []).map((entry, idx, arr) => (
            <div key={idx} className="flex gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`size-2.5 rounded-full shrink-0 mt-1 ${
                    STAGE_DOT[entry.stage] ?? "bg-muted"
                  }`}
                />
                {idx < arr.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1 mb-1" />
                )}
              </div>
              {/* Label */}
              <div className={`pb-3 ${idx === arr.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-medium leading-tight">
                  {tStages(entry.stage as any)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDate(entry.changedAt, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Decision panel ────────────────────────────────────────────────────────────

interface DecisionPanelProps {
  deal: Deal
  onDecision: (stage: "approved" | "closed_lost", reason: string) => Promise<void>
  loading: boolean
}

function DecisionPanel({ deal, onDecision, loading }: DecisionPanelProps) {
  const t = useTranslations("Underwriting")
  const [reason, setReason] = useState("")

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">{t("decision")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Textarea
          placeholder={t("reasonPlaceholder")}
          className="resize-none text-sm h-20"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
            onClick={() => onDecision("approved", reason)}
          >
            {loading ? <Loader2 className="size-4 animate-spin me-2" /> : null}
            {t("approve")}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={loading || !reason.trim()}
            onClick={() => onDecision("closed_lost", reason)}
          >
            {t("decline")}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {t.rich("decisionHint", {
            strong: (chunks) => <strong>{chunks}</strong>
          })}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Right panel: full detail view ────────────────────────────────────────────

interface DetailPanelProps {
  deal: Deal
  onDecision: (stage: "approved" | "closed_lost", reason: string) => Promise<void>
  deciding: boolean
}

function DetailPanel({ deal, onDecision, deciding }: DetailPanelProps) {
  const tRisk = useTranslations("Risk")
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-tight">{deal.title}</h2>
          <p className="text-sm text-muted-foreground">{deal.company} · {deal.contact}</p>
        </div>
        {deal.riskRating && (
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0.5 ${RATING_COLORS[deal.riskRating]}`}
          >
            {deal.riskRating} · {tRisk(deal.riskRating as any)}
          </Badge>
        )}
      </div>

      {/* Scorecard */}
      <BorrowerScorecard deal={deal} />

      {/* Checklist */}
      <UnderwritingChecklist dealId={deal.id} />

      {/* Timeline */}
      <StageTimeline deal={deal} />

      {/* Decision */}
      <DecisionPanel deal={deal} onDecision={onDecision} loading={deciding} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function UnderwritingContent() {
  const t = useTranslations("Underwriting")
  const dispatch = useAppDispatch()
  const { items: deals, status } = useAppSelector((s) => s.deals)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => {
    if (status === "idle") dispatch(fetchDeals())
  }, [status, dispatch])

  // Filter to underwriting-stage deals only
  const uwDeals = deals.filter((d) => d.stage === "underwriting")

  // Auto-select first deal when list changes
  useEffect(() => {
    if (uwDeals.length > 0 && (selectedId === null || !uwDeals.find((d) => d.id === selectedId))) {
      setSelectedId(uwDeals[0].id)
    } else if (uwDeals.length === 0) {
      setSelectedId(null)
    }
  }, [uwDeals, selectedId])

  const selectedDeal = uwDeals.find((d) => d.id === selectedId) ?? null

  async function handleDecision(stage: "approved" | "closed_lost", reason: string) {
    if (!selectedId) return
    setDeciding(true)
    try {
      await dispatch(updateDeal({
        id: selectedId,
        updates: { stage, ...(reason.trim() ? { lostReason: reason } : {}) },
      }))
      // Loan will disappear from the underwriting list; auto-select will kick in via useEffect
    } finally {
      setDeciding(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <CrmHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ── */}
        <div className="w-80 shrink-0 border-e border-border overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">
            {t("pendingReview", {count: uwDeals.length})}
          </p>

          {uwDeals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ClipboardCheck className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("noLoans")}</p>
              <p className="text-xs text-muted-foreground/70">
                {t("noLoansSub")}
              </p>
            </div>
          ) : (
            uwDeals.map((deal) => (
              <LoanItem
                key={deal.id}
                deal={deal}
                selected={deal.id === selectedId}
                onClick={() => setSelectedId(deal.id)}
              />
            ))
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {selectedDeal ? (
            <DetailPanel
              deal={selectedDeal}
              onDecision={handleDecision}
              deciding={deciding}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <ClipboardCheck className="size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">{t("selectToReview")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
