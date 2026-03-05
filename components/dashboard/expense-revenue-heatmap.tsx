"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { he, enUS } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations, useLocale } from "next-intl"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { IDeal } from "@/lib/models/Deal"

interface HeatmapCell {
  month: string
  disbursed: number
  repaid: number
  disbursedCount: number
  repaidCount: number
}

interface ExpenseRevenueHeatmapProps {
  deals: IDeal[]
}

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted"
  const ratio = value / max
  if (ratio > 0.75) return "bg-primary/80"
  if (ratio > 0.5) return "bg-primary/55"
  if (ratio > 0.25) return "bg-primary/35"
  return "bg-primary/15"
}

export function ExpenseRevenueHeatmap({ deals }: ExpenseRevenueHeatmapProps) {
  const t = useTranslations("Dashboard.heatmap")
  const locale = useLocale()
  const dateLocale = locale === "he" ? he : enUS

  const { cells, maxVal } = useMemo(() => {
    const monthMap = new Map<string, HeatmapCell>()

    for (const deal of deals) {
      // Disbursed deals (active, monitoring, etc.)
      if (deal.disbursementDate || deal.expectedClose) {
        const dateStr = deal.disbursementDate || deal.expectedClose
        try {
          const date = new Date(dateStr!)
          if (!isNaN(date.getTime())) {
            const key = format(date, "yyyy-MM")
            const label = format(date, "MMM yy", { locale: dateLocale })
            if (!monthMap.has(key)) {
              monthMap.set(key, { month: label, disbursed: 0, repaid: 0, disbursedCount: 0, repaidCount: 0 })
            }
            const entry = monthMap.get(key)!
            if (deal.stage !== "closed_won") {
              entry.disbursed += deal.value
              entry.disbursedCount++
            }
          }
        } catch {}
      }

      // Repaid deals
      if (deal.stage === "closed_won" && deal.expectedClose) {
        try {
          const date = new Date(deal.expectedClose)
          if (!isNaN(date.getTime())) {
            const key = format(date, "yyyy-MM")
            const label = format(date, "MMM yy", { locale: dateLocale })
            if (!monthMap.has(key)) {
              monthMap.set(key, { month: label, disbursed: 0, repaid: 0, disbursedCount: 0, repaidCount: 0 })
            }
            const entry = monthMap.get(key)!
            entry.repaid += deal.value
            entry.repaidCount++
          }
        } catch {}
      }
    }

    const sorted = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-12) // last 12 months

    const max = Math.max(
      ...sorted.map((c) => Math.max(c.disbursed, c.repaid)),
      1
    )

    return { cells: sorted, maxVal: max }
  }, [deals, dateLocale])

  if (cells.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{t("title")}</CardTitle>
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
          <CardTitle className="text-sm font-medium text-foreground">{t("title")}</CardTitle>
          <span className="text-xs text-muted-foreground">{t("last12Months")}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <TooltipProvider>
          <div className="flex flex-col gap-2">
            {/* Row headers */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${cells.length}, 1fr)` }}>
              <div />
              {cells.map((cell) => (
                <div key={cell.month} className="text-center text-[10px] text-muted-foreground font-medium">
                  {cell.month}
                </div>
              ))}
            </div>
            {/* Disbursed row */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${cells.length}, 1fr)` }}>
              <div className="text-xs text-muted-foreground flex items-center">{t("disbursed")}</div>
              {cells.map((cell) => (
                <Tooltip key={`d-${cell.month}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-8 rounded-sm ${getIntensityClass(cell.disbursed, maxVal)} transition-colors cursor-default`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {cell.month}: ${cell.disbursed.toLocaleString()} ({cell.disbursedCount} {t("loans")})
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            {/* Repaid row */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${cells.length}, 1fr)` }}>
              <div className="text-xs text-muted-foreground flex items-center">{t("repaid")}</div>
              {cells.map((cell) => (
                <Tooltip key={`r-${cell.month}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-8 rounded-sm ${getIntensityClass(cell.repaid, maxVal)} transition-colors cursor-default`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {cell.month}: ${cell.repaid.toLocaleString()} ({cell.repaidCount} {t("loans")})
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">{t("less")}</span>
              <div className="flex gap-1">
                <div className="size-3 rounded-sm bg-muted" />
                <div className="size-3 rounded-sm bg-primary/15" />
                <div className="size-3 rounded-sm bg-primary/35" />
                <div className="size-3 rounded-sm bg-primary/55" />
                <div className="size-3 rounded-sm bg-primary/80" />
              </div>
              <span className="text-[10px] text-muted-foreground">{t("more")}</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
