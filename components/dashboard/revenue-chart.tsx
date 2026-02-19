"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { format, parse, compareAsc } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"

export function RevenueChart() {
  const { items: deals } = useAppSelector((state) => state.deals)

  const revenueData = useMemo(() => {
    const monthlyData = new Map<string, { revenue: number; deals: number; date: Date }>()

    deals
      .filter((deal) => deal.stage === "closed-won")
      .forEach((deal) => {
        // Parse date "Mar 15, 2026"
        const date = new Date(deal.expectedClose)
        if (isNaN(date.getTime())) return // Skip invalid dates

        const monthKey = format(date, "MMM") // "Mar"
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { revenue: 0, deals: 0, date })
        }
        
        const current = monthlyData.get(monthKey)!
        current.revenue += deal.value
        current.deals += 1
      })

    // Convert to array and sort by date
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        deals: data.deals,
        date: data.date
      }))
      .sort((a, b) => compareAsc(a.date, b.date))
  }, [deals])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Revenue Overview
          </CardTitle>
          <span className="text-xs text-muted-foreground">Closed Won Deals</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.65 0.2 160)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.65 0.2 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.26 0.005 260)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 260)",
                  border: "1px solid oklch(0.26 0.005 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.65 0.2 160)"
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
