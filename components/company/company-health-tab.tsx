"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { CreditScoreGauge } from "@/components/dashboard/credit-score-gauge"
import { RATING_COLORS } from "@/lib/engines/risk-scoring"
import type { IDeal } from "@/lib/models/Deal"

interface CompanyHealthTabProps {
  deals: IDeal[]
}

export function CompanyHealthTab({ deals }: CompanyHealthTabProps) {
  const t = useTranslations("Companies.health")
  const ts = useTranslations("Stages")

  const stats = useMemo(() => {
    const activeStages = ["active", "monitoring", "approved"]
    const activeDeals = deals.filter((d) => activeStages.includes(d.stage))
    const portfolioValue = activeDeals.reduce((sum, d) => sum + d.value, 0)

    // Weighted avg interest rate
    const ratedDeals = activeDeals.filter((d) => d.interestRate !== null)
    const totalWeightedRate = ratedDeals.reduce((sum, d) => sum + d.interestRate! * d.value, 0)
    const totalValue = ratedDeals.reduce((sum, d) => sum + d.value, 0)
    const weightedAvgRate = totalValue > 0 ? totalWeightedRate / totalValue : 0

    // Risk distribution
    const riskCounts = { A: 0, B: 0, C: 0, D: 0 }
    for (const deal of deals) {
      if (deal.riskRating && deal.riskRating in riskCounts) {
        riskCounts[deal.riskRating as keyof typeof riskCounts]++
      }
    }

    return { portfolioValue, weightedAvgRate, riskCounts }
  }, [deals])

  // Funding history - deals sorted by creation
  const fundingHistory = useMemo(() => {
    return [...deals]
      .filter((d) => (d as any).createdAt || d.expectedClose)
      .sort((a, b) => {
        const dateA = new Date((a as any).createdAt || a.expectedClose)
        const dateB = new Date((b as any).createdAt || b.expectedClose)
        return dateB.getTime() - dateA.getTime()
      })
  }, [deals])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Credit Score Gauge */}
        <CreditScoreGauge deals={deals} />

        {/* Portfolio stats */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t("portfolioValue")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  ${stats.portfolioValue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("weightedAvgRate")}</span>
                <span className="text-sm font-medium text-foreground">{stats.weightedAvgRate.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{t("riskDistribution")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              {(["A", "B", "C", "D"] as const).map((rating) => (
                <div key={rating} className="flex items-center justify-between">
                  <Badge variant="outline" className={`${RATING_COLORS[rating]} text-[10px]`}>
                    {rating}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{stats.riskCounts[rating]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funding History Timeline */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{t("fundingHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {fundingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("noHistory")}</p>
          ) : (
            <div className="relative">
              <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
              <div className="flex flex-col gap-4">
                {fundingHistory.map((deal, i) => {
                  const dealId = (deal as any)._id || deal.title
                  const date = (deal as any).createdAt
                    ? new Date((deal as any).createdAt).toLocaleDateString()
                    : deal.expectedClose
                    ? new Date(deal.expectedClose).toLocaleDateString()
                    : ""
                  return (
                    <div key={dealId} className="relative flex items-start gap-4 ps-10">
                      <div className="absolute start-2.5 top-1.5 size-3 rounded-full border-2 border-primary bg-card" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{deal.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ts(deal.stage as any)}
                          </Badge>
                          {deal.riskRating && (
                            <Badge variant="outline" className={`${RATING_COLORS[deal.riskRating]} text-[10px]`}>
                              {deal.riskRating}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">${deal.value.toLocaleString()}</span>
                          {date && <span className="text-xs text-muted-foreground">{date}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
