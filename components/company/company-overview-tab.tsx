"use client"

import { useMemo } from "react"
import { Kanban, DollarSign, ShieldCheck, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { useTranslations } from "next-intl"
import type { IDeal } from "@/lib/models/Deal"
import type { IContact } from "@/lib/models/Contact"

interface CompanyOverviewTabProps {
  deals: IDeal[]
  contacts: IContact[]
}

export function CompanyOverviewTab({ deals, contacts }: CompanyOverviewTabProps) {
  const t = useTranslations("Companies.overview")

  const stats = useMemo(() => {
    const activeStages = ["active", "monitoring", "approved", "underwriting", "pre_qualification"]
    const activeLoans = deals.filter((d) => activeStages.includes(d.stage)).length
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0)

    const scored = deals.filter((d) => d.creditScore !== null && d.creditScore !== undefined)
    const avgCredit = scored.length > 0
      ? Math.round(scored.reduce((sum, d) => sum + d.creditScore!, 0) / scored.length)
      : null

    const rated = deals.filter((d) => d.riskRating !== null)
    const avgRisk = rated.length > 0
      ? (() => {
          const ratingValues = { A: 4, B: 3, C: 2, D: 1 } as const
          const avg = rated.reduce((sum, d) => sum + ratingValues[d.riskRating as keyof typeof ratingValues], 0) / rated.length
          if (avg >= 3.5) return "A"
          if (avg >= 2.5) return "B"
          if (avg >= 1.5) return "C"
          return "D"
        })()
      : null

    return { activeLoans, totalValue, avgCredit, avgRisk }
  }, [deals])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("activeLoans")}
          value={stats.activeLoans.toString()}
          icon={Kanban}
        />
        <StatCard
          label={t("totalLoanValue")}
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          label={t("avgCreditScore")}
          value={stats.avgCredit !== null ? stats.avgCredit.toString() : "N/A"}
          icon={ShieldCheck}
        />
        <StatCard
          label={t("avgRiskRating")}
          value={stats.avgRisk ?? "N/A"}
          icon={TrendingUp}
        />
      </div>
    </div>
  )
}
