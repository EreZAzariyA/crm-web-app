"use client"

import { Wallet, TrendingDown, BarChart3, ArrowUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { StatCard } from "@/components/shared/stat-card"
import type { IDeal } from "@/lib/models/Deal"

interface FinancialSummaryCardsProps {
  deals: IDeal[]
}

export function FinancialSummaryCards({ deals }: FinancialSummaryCardsProps) {
  const t = useTranslations("Dashboard.financial")

  const activeStages = ["active", "monitoring", "approved"]
  const troubleStages = ["collection", "default"]

  const totalAssets = deals
    .filter((d) => activeStages.includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0)

  const totalLiabilities = deals
    .filter((d) => troubleStages.includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0)

  const netValue = totalAssets - totalLiabilities

  // Estimate monthly cash flow from active deals with interest rate and loan term
  const monthlyCashFlow = deals
    .filter((d) => d.stage === "active" && d.interestRate && d.loanTerm)
    .reduce((sum, d) => {
      const r = (d.interestRate! / 100) / 12
      const n = d.loanTerm!
      if (r === 0) return sum + d.value / n
      const pmt = (d.value * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      return sum + pmt
    }, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("totalAssets")}
        value={`$${totalAssets.toLocaleString()}`}
        sub={t("activeLoansCount", { count: deals.filter((d) => activeStages.includes(d.stage)).length })}
        icon={Wallet}
      />
      <StatCard
        label={t("totalLiabilities")}
        value={`$${totalLiabilities.toLocaleString()}`}
        sub={t("troubleLoansCount", { count: deals.filter((d) => troubleStages.includes(d.stage)).length })}
        icon={TrendingDown}
      />
      <StatCard
        label={t("netPortfolioValue")}
        value={`$${netValue.toLocaleString()}`}
        sub={t("assetsMinusLiabilities")}
        icon={BarChart3}
      />
      <StatCard
        label={t("monthlyCashFlow")}
        value={`$${Math.round(monthlyCashFlow).toLocaleString()}`}
        sub={t("estimatedFromActive")}
        icon={ArrowUpDown}
      />
    </div>
  )
}
