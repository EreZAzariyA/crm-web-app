"use client"

import { Kanban } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { RATING_COLORS } from "@/lib/engines/risk-scoring"
import type { IDeal } from "@/lib/models/Deal"

interface CompanyLoansTableProps {
  deals: IDeal[]
}

export function CompanyLoansTable({ deals }: CompanyLoansTableProps) {
  const t = useTranslations("Companies.loans")
  const ts = useTranslations("Stages")

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Kanban className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("noLoans")}</p>
      </div>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {t("title")} ({deals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("title")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("stage")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("value")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("riskRating")}</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const dealId = (deal as any)._id || deal.title
                return (
                  <tr key={dealId} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                    <td className="py-2.5 px-3">
                      <Link href={`/deals/${dealId}`} className="text-sm font-medium text-foreground hover:text-primary">
                        {deal.title}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {ts(deal.stage as any)}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-foreground">
                      ${deal.value.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {deal.riskRating ? (
                        <Badge variant="outline" className={`${RATING_COLORS[deal.riskRating]} text-[10px]`}>
                          {deal.riskRating}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
