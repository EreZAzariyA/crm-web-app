"use client"

import { useMemo, useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { format, compareAsc } from "date-fns"
import { he, enUS } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations, useLocale } from "next-intl"

/** Read a CSS variable from :root as a string, falling back to the provided default. */
function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export function RevenueChart() {
  const t = useTranslations("Dashboard.charts")
  const locale = useLocale()
  const dateLocale = locale === "he" ? he : enUS
  const { items: deals } = useAppSelector((state) => state.deals)
  const [colors, setColors] = useState({
    primary: "#10b981",
    border: "#e2e8f0",
    mutedFg: "#64748b",
    card: "#ffffff",
    cardFg: "#0f172a",
  })

  // Re-read CSS vars whenever theme changes
  useEffect(() => {
    function readColors() {
      setColors({
        primary: getCssVar("--primary", "#10b981"),
        border: getCssVar("--border", "#e2e8f0"),
        mutedFg: getCssVar("--muted-foreground", "#64748b"),
        card: getCssVar("--card", "#ffffff"),
        cardFg: getCssVar("--card-foreground", "#0f172a"),
      })
    }
    readColors()
    const observer = new MutationObserver(readColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const revenueData = useMemo(() => {
    const monthlyData = new Map<string, { revenue: number; deals: number; date: Date }>()

    deals
      .filter((deal) => deal.stage === "closed_won")
      .forEach((deal) => {
        const date = new Date(deal.expectedClose)
        if (isNaN(date.getTime())) return

        const monthKey = format(date, "MMM", { locale: dateLocale })

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, deals: 0, date })
        }

        const current = monthlyData.get(monthKey)!
        current.revenue += deal.value
        current.deals += 1
      })

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        deals: data.deals,
        date: data.date,
      }))
      .sort((a, b) => compareAsc(a.date, b.date))
  }, [deals, dateLocale])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {t("revenue")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{t("revenueSub")}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.mutedFg, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.mutedFg, fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.cardFg,
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, t("amount")]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
