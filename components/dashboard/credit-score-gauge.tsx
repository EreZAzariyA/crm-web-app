"use client"

import { useMemo, useEffect, useState } from "react"
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import type { IDeal } from "@/lib/models/Deal"

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function getScoreColor(score: number): string {
  if (score >= 750) return "#10b981" // emerald
  if (score >= 700) return "#3b82f6" // blue
  if (score >= 650) return "#f59e0b" // amber
  return "#ef4444" // red
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 750) return t("excellent")
  if (score >= 700) return t("good")
  if (score >= 650) return t("fair")
  return t("poor")
}

interface CreditScoreGaugeProps {
  deals: IDeal[]
}

export function CreditScoreGauge({ deals }: CreditScoreGaugeProps) {
  const t = useTranslations("Dashboard.creditGauge")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { avgScore, scoredCount } = useMemo(() => {
    const scored = deals.filter((d) => d.creditScore !== null && d.creditScore !== undefined)
    if (scored.length === 0) return { avgScore: 0, scoredCount: 0 }
    const avg = Math.round(scored.reduce((sum, d) => sum + d.creditScore!, 0) / scored.length)
    return { avgScore: avg, scoredCount: scored.length }
  }, [deals])

  const bgColor = getCssVar("--muted", "#f1f5f9")
  const fillColor = getScoreColor(avgScore)
  // Normalize 300-850 range to 0-100 for chart
  const normalized = scoredCount > 0 ? Math.round(((avgScore - 300) / 550) * 100) : 0

  const data = [{ name: "score", value: normalized, fill: fillColor }]

  if (scoredCount === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {t("title")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("scoredLoans", { count: scoredCount })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center">
          <div className="relative h-40 w-40">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={210}
                  endAngle={-30}
                  data={data}
                  barSize={12}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                    angleAxisId={0}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={6}
                    background={{ fill: bgColor }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{avgScore}</span>
              <span
                className="text-xs font-medium"
                style={{ color: fillColor }}
              >
                {getScoreLabel(avgScore, t)}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>300</span>
            <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-blue-500 to-emerald-500" />
            <span>850</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
