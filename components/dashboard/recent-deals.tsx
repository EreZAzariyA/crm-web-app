"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/lib/hooks"
import { useTranslations } from "next-intl"

const stageStyles: Record<string, string> = {
  lead:              "bg-chart-2/15 text-chart-2 border-chart-2/30",
  pre_qualification: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  underwriting:      "bg-warning/15 text-warning border-warning/30",
  approved:          "bg-chart-3/15 text-chart-3 border-chart-3/30",
  active:            "bg-primary/15 text-primary border-primary/30",
  monitoring:        "bg-chart-4/15 text-chart-4 border-chart-4/30",
  collection:        "bg-orange-500/15 text-orange-500 border-orange-500/30",
  closed_won:        "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  closed_lost:       "bg-destructive/15 text-destructive border-destructive/30",
  default:           "bg-red-700/15 text-red-700 border-red-700/30",
}

export function RecentDeals() {
  const t = useTranslations("Dashboard.charts")
  const tStages = useTranslations("Stages")
  const { items: deals } = useAppSelector((state) => state.deals)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {t("recentDeals")}
          </CardTitle>
          <button className="text-xs text-primary hover:underline">{t("viewAll")}</button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          {deals.slice(0, 5).map((deal) => (
            <div
              key={deal.id}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {deal.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {deal.company} &middot; {deal.contact}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  ${deal.value.toLocaleString()}
                </span>
                <Badge
                  variant="outline"
                  className={stageStyles[deal.stage] ?? "bg-muted/15 text-muted-foreground border-muted/30"}
                >
                  {tStages(deal.stage as any)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
