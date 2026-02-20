"use client"

import { useEffect, useState } from "react"
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
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchContacts } from "@/lib/features/contacts/contactsSlice"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { useTranslations } from "next-intl"

export function DashboardContent() {
  const t = useTranslations("Dashboard")
  const dispatch = useAppDispatch()
  const contactsStatus = useAppSelector((state) => state.contacts.status)
  const dealsStatus = useAppSelector((state) => state.deals.status)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (contactsStatus === 'idle') {
      dispatch(fetchContacts())
    }
    if (dealsStatus === 'idle') {
      dispatch(fetchDeals())
    }
  }, [contactsStatus, dealsStatus, dispatch])

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
          <StatCards />
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <PipelineChart />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentDeals />
            <ActivityFeed />
          </div>
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
