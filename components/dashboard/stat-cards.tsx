"use client"

import { DollarSign, Users, Kanban, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"

export function StatCards() {
  const { items: contacts } = useAppSelector((s) => s.contacts)
  const { items: deals } = useAppSelector((s) => s.deals)

  const activeContacts = contacts.length
  const openDeals = deals.filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost").length
  const totalRevenue = deals
    .filter((d) => d.stage === "closed-won")
    .reduce((acc, d) => acc + d.value, 0)

  const closedDeals = deals.filter((d) => d.stage === "closed-won" || d.stage === "closed-lost")
  const wonDeals = deals.filter((d) => d.stage === "closed-won")
  const winRate = closedDeals.length > 0
    ? Math.round((wonDeals.length / closedDeals.length) * 100)
    : 0

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      sub: `${wonDeals.length} closed deal${wonDeals.length !== 1 ? "s" : ""}`,
      icon: DollarSign,
    },
    {
      title: "Active Contacts",
      value: activeContacts.toString(),
      sub: `${contacts.filter((c) => c.status === "lead").length} new leads`,
      icon: Users,
    },
    {
      title: "Open Deals",
      value: openDeals.toString(),
      sub: `${deals.length} total in pipeline`,
      icon: Kanban,
    },
    {
      title: "Win Rate",
      value: `${winRate}%`,
      sub: `${wonDeals.length} won / ${closedDeals.length} closed`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                <span className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="size-5 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-muted-foreground">{stat.sub}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
