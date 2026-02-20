"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations } from "next-intl"

function HealthDot({ rate, label }: { rate: number; label: string }) {
  const color = rate < 2 ? "bg-emerald-500" : rate < 5 ? "bg-amber-500" : "bg-red-500"
  return <span className={`inline-block size-2.5 rounded-full ${color}`} title={`${label}: ${rate.toFixed(1)}%`} />
}

export function PortfolioHealthCard() {
  const t = useTranslations("Dashboard.charts")
  const tm = useTranslations("Dashboard.metrics")
  const { items: deals } = useAppSelector((s) => s.deals)

  const metrics = useMemo(() => {
    const activeDeals = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
    const defaultDeals   = activeDeals.filter((d) => d.stage === "default")
    const collectionDeals= activeDeals.filter((d) => d.stage === "collection")
    const base = activeDeals.length > 0 ? activeDeals.length : 1

    const defaultRate    = (defaultDeals.length    / base) * 100
    const collectionRate = (collectionDeals.length / base) * 100

    const scored = deals.filter((d) => d.creditScore != null)
    const avgCreditScore = scored.length > 0
      ? Math.round(scored.reduce((s, d) => s + (d.creditScore ?? 0), 0) / scored.length)
      : null

    const withRate = deals.filter((d) => d.interestRate != null && d.value > 0)
    const totalValue = withRate.reduce((s, d) => s + d.value, 0)
    const weightedRate = totalValue > 0
      ? withRate.reduce((s, d) => s + d.value * (d.interestRate ?? 0), 0) / totalValue
      : null

    return { defaultRate, collectionRate, avgCreditScore, weightedRate }
  }, [deals])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">{t("portfolioHealth")}</CardTitle>
          <HealthDot rate={metrics.defaultRate} label={tm("defaultRate")} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 h-64 content-center">
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tm("defaultRate")}</p>
            <p className={`text-2xl font-bold ${metrics.defaultRate >= 5 ? "text-red-500" : metrics.defaultRate >= 2 ? "text-amber-500" : "text-emerald-500"}`}>
              {metrics.defaultRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tm("collectionRate")}</p>
            <p className={`text-2xl font-bold ${metrics.collectionRate >= 10 ? "text-red-500" : metrics.collectionRate >= 5 ? "text-amber-500" : "text-foreground"}`}>
              {metrics.collectionRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tm("avgCreditScore")}</p>
            <p className="text-2xl font-bold text-foreground">
              {metrics.avgCreditScore != null ? metrics.avgCreditScore : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3 flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tm("wtdAvgRate")}</p>
            <p className="text-2xl font-bold text-foreground">
              {metrics.weightedRate != null ? `${metrics.weightedRate.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
