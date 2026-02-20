"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { computeRiskScore, RATING_COLORS, RATING_LABELS } from "@/lib/engines/risk-scoring"
import type { Deal } from "@/lib/crm-service"
import { useTranslations } from "next-intl"

function fmt(v: number | null | undefined, prefix = "", suffix = "") {
  if (v == null) return "—"
  return `${prefix}${v.toLocaleString()}${suffix}`
}

interface MetricTileProps {
  label: string
  value: string
  sub?: string
  accent?: string // tailwind text color class
}

function MetricTile({ label, value, sub, accent }: MetricTileProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm font-bold leading-tight ${accent ?? "text-foreground"}`}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  )
}

interface Props {
  deal: Deal
}

export function BorrowerScorecard({ deal }: Props) {
  const t = useTranslations("Underwriting")
  const tm = useTranslations("Metrics")
  const tr = useTranslations("Risk")
  const tt = useTranslations("Tiers")

  const result = computeRiskScore({
    creditScore:    deal.creditScore    ?? null,
    ltvRatio:       deal.ltvRatio       ?? null,
    dtiRatio:       deal.dtiRatio       ?? null,
    loanTerm:       deal.loanTerm       ?? null,
    value:          deal.value,
    approvedAmount: deal.approvedAmount ?? null,
  })

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">{t("scorecardTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Row 1 */}
          <MetricTile
            label={tm("creditScore")}
            value={fmt(deal.creditScore)}
            sub={result.breakdown.creditScore.tier !== "unscored" ? tt(result.breakdown.creditScore.tier as any) : undefined}
            accent={
              result.breakdown.creditScore.tier === "excellent" ? "text-emerald-600" :
              result.breakdown.creditScore.tier === "good"      ? "text-blue-600" :
              result.breakdown.creditScore.tier === "fair"      ? "text-amber-600" :
              result.breakdown.creditScore.tier === "poor"      ? "text-red-600" :
              undefined
            }
          />
          <MetricTile
            label={tm("ltv")}
            value={fmt(deal.ltvRatio, "", "%")}
            sub={result.breakdown.ltv.tier !== "unscored" ? tt(result.breakdown.ltv.tier as any) : undefined}
            accent={
              result.breakdown.ltv.tier === "excellent" ? "text-emerald-600" :
              result.breakdown.ltv.tier === "good"      ? "text-blue-600" :
              result.breakdown.ltv.tier === "fair"      ? "text-amber-600" :
              result.breakdown.ltv.tier === "poor"      ? "text-red-600" :
              undefined
            }
          />
          <MetricTile
            label={tm("dti")}
            value={fmt(deal.dtiRatio, "", "%")}
            sub={result.breakdown.dti.tier !== "unscored" ? tt(result.breakdown.dti.tier as any) : undefined}
            accent={
              result.breakdown.dti.tier === "excellent" ? "text-emerald-600" :
              result.breakdown.dti.tier === "good"      ? "text-blue-600" :
              result.breakdown.dti.tier === "fair"      ? "text-amber-600" :
              result.breakdown.dti.tier === "poor"      ? "text-red-600" :
              undefined
            }
          />

          {/* Row 2 */}
          <MetricTile
            label={tm("loanAmount")}
            value={fmt(deal.value, "$")}
          />
          <MetricTile
            label={tm("loanTerm")}
            value={deal.loanTerm != null ? tm("months", {count: deal.loanTerm}) : "—"}
            sub={result.breakdown.loanTerm.tier !== "unscored" ? tt(result.breakdown.loanTerm.tier as any) : undefined}
          />
          <MetricTile
            label={tm("interestRate")}
            value={fmt(deal.interestRate, "", "%")}
          />

          {/* Row 3 */}
          <MetricTile
            label={tm("collateral")}
            value={fmt(deal.collateralValue, "$")}
          />
          <MetricTile
            label={tm("approvedAmt")}
            value={fmt(deal.approvedAmount, "$")}
          />

          {/* Risk Score tile */}
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {tm("riskScore")}
            </span>
            {result.hasEnoughData ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold leading-tight text-foreground">
                  {result.score}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 ${RATING_COLORS[result.rating]}`}
                >
                  {result.rating} · {tr(result.rating as any)}
                </Badge>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t("insufficientData")}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
