"use client"

import { useMemo } from "react"
import { AlertTriangle, AlertCircle, ShieldAlert, FileWarning } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import type { IDeal } from "@/lib/models/Deal"

interface Alert {
  id: string
  severity: "high" | "medium" | "low"
  message: string
  dealTitle: string
  dealId: string
}

interface RiskAlertsCardProps {
  deals: IDeal[]
}

const severityConfig = {
  high: {
    icon: ShieldAlert,
    badge: "bg-red-500/15 text-red-600 border-red-500/30",
    label: "High",
  },
  medium: {
    icon: AlertTriangle,
    badge: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    label: "Medium",
  },
  low: {
    icon: FileWarning,
    badge: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    label: "Low",
  },
}

export function RiskAlertsCard({ deals }: RiskAlertsCardProps) {
  const t = useTranslations("Dashboard.alerts")

  const alerts = useMemo(() => {
    const result: Alert[] = []

    for (const deal of deals) {
      const id = (deal as any)._id || deal.title

      // High risk rating D
      if (deal.riskRating === "D") {
        result.push({
          id: `${id}-risk-d`,
          severity: "high",
          message: t("ratingD", { title: deal.title }),
          dealTitle: deal.title,
          dealId: id,
        })
      }

      // DTI over threshold
      if (deal.dtiRatio !== null && deal.dtiRatio !== undefined && deal.dtiRatio > 43) {
        result.push({
          id: `${id}-dti`,
          severity: "medium",
          message: t("highDti", { title: deal.title, dti: Math.round(deal.dtiRatio) }),
          dealTitle: deal.title,
          dealId: id,
        })
      }

      // Collection or default stage
      if (deal.stage === "collection" || deal.stage === "default") {
        result.push({
          id: `${id}-stage`,
          severity: "high",
          message: t("troubleStage", { title: deal.title, stage: deal.stage }),
          dealTitle: deal.title,
          dealId: id,
        })
      }

      // Missing critical data
      if (
        deal.creditScore === null &&
        deal.ltvRatio === null &&
        deal.stage !== "lead" &&
        deal.stage !== "closed_won" &&
        deal.stage !== "closed_lost"
      ) {
        result.push({
          id: `${id}-missing`,
          severity: "low",
          message: t("missingData", { title: deal.title }),
          dealTitle: deal.title,
          dealId: id,
        })
      }
    }

    // Sort by severity
    const order = { high: 0, medium: 1, low: 2 }
    return result.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 8)
  }, [deals, t])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {t("title")}
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">{t("noAlerts")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity]
              const Icon = config.icon
              return (
                <Link
                  key={alert.id}
                  href={`/deals/${alert.dealId}`}
                  className="flex items-start gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className={`${config.badge} text-[10px] shrink-0`}>
                    {config.label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
