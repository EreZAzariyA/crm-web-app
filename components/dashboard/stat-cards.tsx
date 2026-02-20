"use client"

import { DollarSign, Users, Kanban, TrendingUp } from "lucide-react"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations } from "next-intl"
import { StatCard } from "@/components/shared/stat-card"

export function StatCards() {
  const t = useTranslations("Dashboard.stats")
  const { items: contacts } = useAppSelector((s) => s.contacts)
  const { items: deals } = useAppSelector((s) => s.deals)

  const activeContacts = contacts.length
  const openDeals = deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost").length
  const totalRevenue = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((acc, d) => acc + d.value, 0)

  const closedDeals = deals.filter((d) => d.stage === "closed_won" || d.stage === "closed_lost")
  const wonDeals = deals.filter((d) => d.stage === "closed_won")
  const winRate = closedDeals.length > 0
    ? Math.round((wonDeals.length / closedDeals.length) * 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("repaidCapital")}
        value={`$${totalRevenue.toLocaleString()}`}
        sub={wonDeals.length === 1 ? t("repaidLoans", {count: wonDeals.length}) : t("repaidLoansPlural", {count: wonDeals.length})}
        icon={DollarSign}
      />
      <StatCard
        label={t("activeContacts")}
        value={activeContacts.toString()}
        sub={t("newLeads", {count: contacts.filter((c) => c.status === "lead").length})}
        icon={Users}
      />
      <StatCard
        label={t("activeLoans")}
        value={openDeals.toString()}
        sub={t("totalInPortfolio", {count: deals.length})}
        icon={Kanban}
      />
      <StatCard
        label={t("approvalRate")}
        value={`${winRate}%`}
        sub={t("wonClosed", {won: wonDeals.length, closed: closedDeals.length})}
        icon={TrendingUp}
      />
    </div>
  )
}
