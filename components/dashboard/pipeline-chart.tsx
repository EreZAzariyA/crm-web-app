"use client"

import { useMemo, useEffect, useState } from "react"
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

/** Read a CSS variable from :root as a string, falling back to the provided default. */
function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export function PipelineChart() {
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

  const pipelineData = useMemo(() => {
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
                stroke={colors.border}
                vertical={false}
              />
              <XAxis
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.mutedFg, fontSize: 11 }}
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
              />
              <Bar
                dataKey="value"
                fill={colors.primary}
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
