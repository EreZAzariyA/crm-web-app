"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowUpDown, Loader2 } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RiskDistributionChart } from "@/components/dashboard/risk-distribution-chart"
import { StageFunnelChart } from "@/components/dashboard/stage-funnel-chart"
import { PortfolioHealthCard } from "@/components/dashboard/portfolio-health-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { computeRiskScore, RATING_COLORS, RATING_LABELS } from "@/lib/engines/risk-scoring"
import type { Deal } from "@/lib/crm-service"
import type { Stage } from "@/lib/engines/deal-lifecycle"
import { TERMINAL_STAGES } from "@/lib/engines/deal-lifecycle"
import { format, parseISO, isValid } from "date-fns"
import { he, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"

const STAGE_BADGE: Record<string, string> = {
  lead:              "bg-chart-2/15 text-chart-2",
  pre_qualification: "bg-chart-5/15 text-chart-5",
  underwriting:      "bg-warning/15 text-warning",
  approved:          "bg-chart-3/15 text-chart-3",
  active:            "bg-primary/15 text-primary",
  monitoring:        "bg-chart-4/15 text-chart-4",
  collection:        "bg-orange-500/15 text-orange-500",
  closed_won:        "bg-emerald-500/15 text-emerald-600",
  closed_lost:       "bg-destructive/15 text-destructive",
  default:           "bg-red-700/15 text-red-700",
}

// Pipeline funnel stages
const FUNNEL_STAGES: Stage[] = [
  "lead", "pre_qualification", "underwriting", "approved",
  "active", "monitoring", "collection",
]

type SortKey = "title" | "stage" | "creditScore" | "ltvRatio" | "dtiRatio" | "score" | "rating"
type SortDir = "asc" | "desc"

export function AnalyticsContent() {
  const t = useTranslations("Analytics")
  const tStages = useTranslations("Stages")
  const tRisk = useTranslations("Risk")
  const tu = useTranslations("Underwriting")
  const locale = useLocale()
  
  const dispatch = useAppDispatch()
  const { items: deals, status } = useAppSelector((s) => s.deals)
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    if (status === "idle") dispatch(fetchDeals())
  }, [status, dispatch])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  // ── Risk tab data ──
  const riskRows = useMemo(() => {
    return deals.map((deal) => {
      const result = computeRiskScore({
        creditScore:    deal.creditScore    ?? null,
        ltvRatio:       deal.ltvRatio       ?? null,
        dtiRatio:       deal.dtiRatio       ?? null,
        loanTerm:       deal.loanTerm       ?? null,
        value:          deal.value,
        approvedAmount: deal.approvedAmount ?? null,
      })
      return { deal, result }
    }).sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      switch (sortKey) {
        case "title":       va = a.deal.title;       vb = b.deal.title;       break
        case "stage":       va = a.deal.stage;       vb = b.deal.stage;       break
        case "creditScore": va = a.deal.creditScore  ?? -1; vb = b.deal.creditScore  ?? -1; break
        case "ltvRatio":    va = a.deal.ltvRatio     ?? -1; vb = b.deal.ltvRatio     ?? -1; break
        case "dtiRatio":    va = a.deal.dtiRatio     ?? -1; vb = b.deal.dtiRatio     ?? -1; break
        case "score":       va = a.result.hasEnoughData ? a.result.score : -1; vb = b.result.hasEnoughData ? b.result.score : -1; break
        case "rating":      va = a.deal.riskRating ?? "Z"; vb = b.deal.riskRating ?? "Z"; break
      }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(String(vb)) : String(vb).localeCompare(va)
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  }, [deals, sortKey, sortDir])

  // ── Pipeline tab data ──
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map((stage, i) => {
      const count = deals.filter((d) => d.stage === stage).length
      const prevStage = i > 0 ? FUNNEL_STAGES[i - 1] : null
      const prevCount = prevStage ? deals.filter((d) => d.stage === prevStage).length : null
      const conversion = prevCount != null && prevCount > 0
        ? Math.round((count / prevCount) * 100)
        : null
      return { stage, label: tStages(stage as any), count, conversion }
    })
  }, [deals, tStages])

  // ── Repayments tab data ──
  const repaymentRows = useMemo(() => {
    const monthMap = new Map<string, { expected: number; count: number }>()
    const dateLocale = locale === "he" ? he : enUS
    deals.forEach((deal) => {
      if (!deal.expectedClose) return
      try {
        const d = parseISO(deal.expectedClose)
        if (!isValid(d)) return
        const key = format(d, "yyyy-MM")
        if (!monthMap.has(key)) monthMap.set(key, { expected: 0, count: 0 })
        const entry = monthMap.get(key)!
        entry.expected += Math.round(deal.value * deal.probability / 100)
        entry.count++
      } catch { /* skip */ }
    })
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const d = parseISO(key + "-01");
        const label = format(d, "MMM yyyy", { locale: dateLocale }) 
        return { month: label, ...val }
      })
  }, [deals, locale])

  function SortButton({ col }: { col: SortKey }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-1 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => toggleSort(col)}
      >
        <ArrowUpDown className="size-3" />
      </Button>
    )
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
      <CrmHeader title={t("title")} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="risk">{t("tabs.risk")}</TabsTrigger>
            <TabsTrigger value="pipeline">{t("tabs.pipeline")}</TabsTrigger>
            <TabsTrigger value="repayments">{t("tabs.repayments")}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <RevenueChart />
              <RiskDistributionChart />
              <StageFunnelChart />
              <PortfolioHealthCard />
            </div>
          </TabsContent>

          {/* ── Risk Analysis ── */}
          <TabsContent value="risk" className="mt-0">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t("risk.title")}</CardTitle>
                  <span className="text-xs text-muted-foreground">{t("risk.loansCount", {count: deals.length})}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="ps-6">
                          <div className="flex items-center gap-1">{t("risk.table.loan")} <SortButton col="title" /></div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">{t("risk.table.stage")} <SortButton col="stage" /></div>
                        </TableHead>
                        <TableHead className="text-end">
                          <div className="flex items-center justify-end gap-1">{t("risk.table.creditScore")} <SortButton col="creditScore" /></div>
                        </TableHead>
                        <TableHead className="text-end">
                          <div className="flex items-center justify-end gap-1">{t("risk.table.ltv")} <SortButton col="ltvRatio" /></div>
                        </TableHead>
                        <TableHead className="text-end">
                          <div className="flex items-center justify-end gap-1">{t("risk.table.dti")} <SortButton col="dtiRatio" /></div>
                        </TableHead>
                        <TableHead className="text-end">
                          <div className="flex items-center justify-end gap-1">{t("risk.table.score")} <SortButton col="score" /></div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">{t("risk.table.rating")} <SortButton col="rating" /></div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskRows.map(({ deal, result }) => (
                        <TableRow key={deal.id}>
                          <TableCell className="ps-6">
                            <div>
                              <p className="text-sm font-medium">{deal.title}</p>
                              <p className="text-xs text-muted-foreground">{deal.company}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${STAGE_BADGE[deal.stage] ?? ""}`}>
                              {tStages(deal.stage as any)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end text-sm">{deal.creditScore ?? "—"}</TableCell>
                          <TableCell className="text-end text-sm">{deal.ltvRatio != null ? `${deal.ltvRatio}%` : "—"}</TableCell>
                          <TableCell className="text-end text-sm">{deal.dtiRatio != null ? `${deal.dtiRatio}%` : "—"}</TableCell>
                          <TableCell className="text-end font-mono text-sm font-medium">
                            {result.hasEnoughData ? result.score : "—"}
                          </TableCell>
                          <TableCell>
                            {result.hasEnoughData ? (
                              <Badge variant="outline" className={`text-xs ${RATING_COLORS[result.rating]}`}>
                                {result.rating} · {tRisk(result.rating as any)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">{tu("insufficientData")}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Pipeline ── */}
          <TabsContent value="pipeline" className="mt-0 space-y-6">
            <div className="h-96">
              <StageFunnelChart />
            </div>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("pipeline.conversionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-6">{t("pipeline.table.stage")}</TableHead>
                      <TableHead className="text-end">{t("pipeline.table.loans")}</TableHead>
                      <TableHead className="text-end">{t("pipeline.table.conversion")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funnelData.map(({ stage, label, count, conversion }) => (
                      <TableRow key={stage}>
                        <TableCell className="ps-6">
                          <Badge variant="outline" className={`text-xs ${STAGE_BADGE[stage] ?? ""}`}>{label}</Badge>
                        </TableCell>
                        <TableCell className="text-end text-sm font-medium">{count}</TableCell>
                        <TableCell className="text-end">
                          {conversion != null ? (
                            <span className={`text-sm font-medium ${conversion >= 70 ? "text-emerald-600" : conversion >= 40 ? "text-amber-600" : "text-red-600"}`}>
                              {conversion}%
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Repayments ── */}
          <TabsContent value="repayments" className="mt-0 space-y-6">
            <RevenueChart />
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t("repayments.title")}</CardTitle>
                  <span className="text-xs text-muted-foreground">{t("repayments.sub")}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {repaymentRows.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">{t("repayments.noDates")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="ps-6">{t("repayments.table.month")}</TableHead>
                        <TableHead className="text-end">{t("repayments.table.loans")}</TableHead>
                        <TableHead className="text-end">{t("repayments.table.expected")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repaymentRows.map(({ month, count, expected }) => (
                        <TableRow key={month}>
                          <TableCell className="ps-6 font-medium">{month}</TableCell>
                          <TableCell className="text-end text-sm">{count}</TableCell>
                          <TableCell className="text-end text-sm font-medium">${expected.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell className="ps-6">{t("repayments.table.total")}</TableCell>
                        <TableCell className="text-end">{repaymentRows.reduce((s, r) => s + r.count, 0)}</TableCell>
                        <TableCell className="text-end">${repaymentRows.reduce((s, r) => s + r.expected, 0).toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
