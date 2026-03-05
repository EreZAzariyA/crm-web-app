"use client"

import { useMemo, useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { computeAmortization } from "@/lib/engines/amortization"
import type { ScenarioData } from "./scenario-card"

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const SCENARIO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"]

interface ComparisonChartProps {
  scenarios: ScenarioData[]
}

export function ComparisonChart({ scenarios }: ComparisonChartProps) {
  const t = useTranslations("Simulation")
  const [mounted, setMounted] = useState(false)
  const [colors, setColors] = useState({
    border: "#e2e8f0",
    mutedFg: "#64748b",
    card: "#ffffff",
    cardFg: "#0f172a",
  })

  useEffect(() => {
    setMounted(true)
    function readColors() {
      setColors({
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

  const chartData = useMemo(() => {
    const validScenarios = scenarios.filter((s) => s.loanAmount > 0 && s.loanTerm > 0)
    if (validScenarios.length === 0) return []

    const maxTerm = Math.max(...validScenarios.map((s) => s.loanTerm))
    const data: Record<string, any>[] = []

    const results = validScenarios.map((s) => computeAmortization(s.loanAmount, s.interestRate, s.loanTerm))

    for (let month = 0; month <= maxTerm; month++) {
      const point: Record<string, any> = { month }
      validScenarios.forEach((s, i) => {
        const letter = String.fromCharCode(65 + scenarios.indexOf(s))
        if (month === 0) {
          point[`scenario${letter}`] = s.loanAmount
        } else if (month <= s.loanTerm) {
          point[`scenario${letter}`] = results[i].rows[month - 1].balance
        }
      })
      data.push(point)
    }

    return data
  }, [scenarios])

  const validScenarios = scenarios.filter((s) => s.loanAmount > 0 && s.loanTerm > 0)

  if (validScenarios.length === 0) return null

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{t("balanceOverTime")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-72">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.mutedFg, fontSize: 12 }}
                  label={{ value: t("month"), position: "insideBottom", offset: -5, fill: colors.mutedFg, fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.mutedFg, fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.cardFg,
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                />
                <Legend />
                {scenarios.map((s, i) => {
                  const letter = String.fromCharCode(65 + i)
                  if (s.loanAmount <= 0 || s.loanTerm <= 0) return null
                  return (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={`scenario${letter}`}
                      name={t("scenario", { letter })}
                      stroke={SCENARIO_COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
