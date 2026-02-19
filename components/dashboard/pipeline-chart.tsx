"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"

const stageMapping: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
}

export function PipelineChart() {
  const { items: deals } = useAppSelector((state) => state.deals)

  const pipelineData = useMemo(() => {
    // Initialize map with all stages to ensure they appear even if empty
    const stages = new Map([
      ["Discovery", { value: 0, count: 0 }],
      ["Proposal", { value: 0, count: 0 }],
      ["Negotiation", { value: 0, count: 0 }],
      ["Closed Won", { value: 0, count: 0 }],
    ])

    deals.forEach((deal) => {
      const label = stageMapping[deal.stage]
      if (stages.has(label)) {
        const current = stages.get(label)!
        stages.set(label, {
          value: current.value + deal.value,
          count: current.count + 1,
        })
      }
    })

    return Array.from(stages.entries()).map(([stage, data]) => ({
      stage,
      value: data.value,
      count: data.count,
    }))
  }, [deals])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Pipeline Value
          </CardTitle>
          <span className="text-xs text-muted-foreground">By stage</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.26 0.005 260)"
                vertical={false}
              />
              <XAxis
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
              />
              <Bar
                dataKey="value"
                fill="oklch(0.65 0.2 160)"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
