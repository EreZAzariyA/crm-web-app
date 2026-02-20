"use client"

import { useMemo, useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations } from "next-intl"

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

// Active stages in funnel order (excludes terminals)
const FUNNEL_STAGES = [
  { key: "lead",              label: "Lead" },
  { key: "pre_qualification", label: "Pre-Qual" },
  { key: "underwriting",      label: "Underwriting" },
  { key: "approved",          label: "Approved" },
  { key: "active",            label: "Active" },
  { key: "monitoring",        label: "Monitoring" },
  { key: "collection",        label: "Collection" },
] as const

export function StageFunnelChart() {
  const t = useTranslations("Dashboard.charts")
  const tStages = useTranslations("Stages")
  const { items: deals } = useAppSelector((s) => s.deals)
  const [colors, setColors] = useState({
    primary: "#10b981", border: "#e2e8f0", mutedFg: "#64748b",
    card: "#ffffff", cardFg: "#0f172a",
  })

  useEffect(() => {
    function readColors() {
      setColors({
        primary: getCssVar("--primary",            "#10b981"),
        border:  getCssVar("--border",             "#e2e8f0"),
        mutedFg: getCssVar("--muted-foreground",   "#64748b"),
        card:    getCssVar("--card",               "#ffffff"),
        cardFg:  getCssVar("--card-foreground",    "#0f172a"),
      })
    }
    readColors()
    const observer = new MutationObserver(readColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const data = useMemo(() => {
    return FUNNEL_STAGES.map(({ key }) => {
      const stageDeals = deals.filter((d) => d.stage === key)
      return {
        stage: tStages(key as any),
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + d.value, 0),
      }
    }).filter((d) => d.count > 0)
  }, [deals, tStages])

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">{t("stageFunnel")}</CardTitle>
          <span className="text-xs text-muted-foreground">{t("stageFunnelSub")}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, maxCount + 1]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.mutedFg, fontSize: 11 }}
                tickFormatter={(v) => String(Math.round(v))}
              />
              <YAxis
                type="category"
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.mutedFg, fontSize: 11 }}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  color: colors.cardFg,
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string, props: { payload?: { value: number } }) => {
                  if (name === "count") {
                    const val = props?.payload?.value
                    return [
                      `${value} ${value === 1 ? t("loan", {count: value}) : t("loans", {count: value})}${val ? ` · $${val.toLocaleString()}` : ""}`,
                      t("count"),
                    ]
                  }
                  return [value, name]
                }}
                cursor={{ fill: colors.border, opacity: 0.4 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {data.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={colors.primary}
                    fillOpacity={1 - (i * 0.08)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
