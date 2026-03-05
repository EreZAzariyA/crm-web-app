"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { RecentDeals } from "@/components/dashboard/recent-deals"
import { RiskDistributionChart } from "@/components/dashboard/risk-distribution-chart"
import { StageFunnelChart } from "@/components/dashboard/stage-funnel-chart"
import { PortfolioHealthCard } from "@/components/dashboard/portfolio-health-card"
import { FinancialSummaryCards } from "@/components/dashboard/financial-summary-cards"
import { CreditScoreGauge } from "@/components/dashboard/credit-score-gauge"
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card"
import { ExpenseRevenueHeatmap } from "@/components/dashboard/expense-revenue-heatmap"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchContacts } from "@/lib/features/contacts/contactsSlice"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { useTranslations } from "next-intl"

type TimeFilter = "7d" | "30d" | "90d" | "12m" | "all"

const TIME_FILTERS: TimeFilter[] = ["7d", "30d", "90d", "12m", "all"]

function getFilterCutoff(filter: TimeFilter): Date | null {
  if (filter === "all") return null
  const now = new Date()
  switch (filter) {
    case "7d":  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case "12m": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  }
}

export function DashboardContent() {
  const t = useTranslations("Dashboard")
  const dispatch = useAppDispatch()
  const contactsStatus = useAppSelector((state) => state.contacts.status)
  const dealsStatus = useAppSelector((state) => state.deals.status)
  const allDeals = useAppSelector((state) => state.deals.items)
  const [mounted, setMounted] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

  useEffect(() => {
    setMounted(true)
    if (contactsStatus === 'idle') {
      dispatch(fetchContacts())
    }
    if (dealsStatus === 'idle') {
      dispatch(fetchDeals())
    }
  }, [contactsStatus, dealsStatus, dispatch])

  const filteredDeals = useMemo(() => {
    const cutoff = getFilterCutoff(timeFilter)
    if (!cutoff) return allDeals
    return allDeals.filter((deal) => {
      const created = (deal as any).createdAt ? new Date((deal as any).createdAt) : null
      const expected = deal.expectedClose ? new Date(deal.expectedClose) : null
      const refDate = created || expected
      return refDate ? refDate >= cutoff : true
    })
  }, [allDeals, timeFilter])

  // Only show the loading spinner on the client after mount to avoid hydration mismatch
  const isLoading = contactsStatus === 'loading' || dealsStatus === 'loading'

  if (mounted && isLoading && contactsStatus !== 'succeeded' && dealsStatus !== 'succeeded') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Timeframe filter */}
          <div className="flex items-center gap-2">
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {t(`timeFilter.${f}`)}
              </button>
            ))}
          </div>

          <StatCards />

          {/* Financial Summary */}
          <FinancialSummaryCards deals={filteredDeals} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <PipelineChart />
          </div>

          {/* Credit Score Gauge + Risk Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <CreditScoreGauge deals={filteredDeals} />
            <div className="lg:col-span-2">
              <RiskAlertsCard deals={filteredDeals} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentDeals />
            <ActivityFeed />
          </div>

          {/* Expense/Revenue Heatmap */}
          <ExpenseRevenueHeatmap deals={filteredDeals} />

          <div className="grid gap-6 lg:grid-cols-3">
            <RiskDistributionChart />
            <StageFunnelChart />
            <PortfolioHealthCard />
          </div>
        </div>
      </div>
    </>
  )
}
