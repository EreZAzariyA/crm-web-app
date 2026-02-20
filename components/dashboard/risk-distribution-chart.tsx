"use client"

import { useMemo, useEffect, useState } from "react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/lib/hooks"
import type { RiskRating } from "@/lib/engines/risk-scoring"
import { useTranslations } from "next-intl"

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const RATING_FILL: Record<RiskRating, string> = {
  A: "#10b981", // emerald-500
  B: "#3b82f6", // blue-500
  C: "#f59e0b", // amber-500
  D: "#ef4444", // red-500
}

const ALL_RATINGS: RiskRating[] = ["A", "B", "C", "D"]

export function RiskDistributionChart() {
  const t = useTranslations("Dashboard.charts")
  const tRisk = useTranslations("Risk")
  const { items: deals } = useAppSelector((s) => s.deals)
  const [colors, setColors] = useState({
    card: "#ffffff", cardFg: "#0f172a", border: "#e2e8f0", mutedFg: "#64748b",
  })

  useEffect(() => {
    function readColors() {
      setColors({
        card:    getCssVar("--card",             "#ffffff"),
        cardFg:  getCssVar("--card-foreground",  "#0f172a"),
        border:  getCssVar("--border",           "#e2e8f0"),
        mutedFg: getCssVar("--muted-foreground", "#64748b"),
      })
    }
    readColors()
    const observer = new MutationObserver(readColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const { data, total } = useMemo(() => {
    const counts: Record<RiskRating, number> = { A: 0, B: 0, C: 0, D: 0 }
    deals.forEach((d) => { if (d.riskRating) counts[d.riskRating]++ })
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const data = ALL_RATINGS
      .filter((r) => counts[r] > 0)
      .map((r) => ({
        rating: r,
        count:  counts[r],
        pct:    total > 0 ? Math.round((counts[r] / total) * 100) : 0,
      }))
    return { data, total }
  }, [deals])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">{t("riskDistribution")}</CardTitle>
          <span className="text-xs text-muted-foreground">{t("riskDistributionSub", {count: total})}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {total === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <p className="text-sm">{t("noScoredLoans")}</p>
            <p className="text-xs">{t("riskDataHint")}</p>
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="rating"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.rating} fill={RATING_FILL[entry.rating as RiskRating]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      color: colors.cardFg,
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} ${value === 1 ? t("loan", {count: value}) : t("loans", {count: value})} (${data.find((d) => d.rating === name)?.pct ?? 0}%)`,
                      `Rating ${name} · ${tRisk(name as any)}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ALL_RATINGS.map((r) => {
                const entry = data.find((d) => d.rating === r)
                return (
                  <div key={r} className="flex flex-col items-center gap-1">
                    <div className="size-2.5 rounded-full" style={{ background: RATING_FILL[r] }} />
                    <span className="text-xs font-bold text-foreground">{r}</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {entry ? `${entry.count} (${entry.pct}%)` : "0 (0%)"}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
