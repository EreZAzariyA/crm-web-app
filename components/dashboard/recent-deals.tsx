"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/lib/hooks"

const stageStyles: Record<string, string> = {
  discovery: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  proposal: "bg-warning/15 text-warning border-warning/30",
  negotiation: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  "closed-won": "bg-primary/15 text-primary border-primary/30",
  "closed-lost": "bg-destructive/15 text-destructive border-destructive/30",
}

const stageLabels: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
}

export function RecentDeals() {
  const { items: deals } = useAppSelector((state) => state.deals)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Recent Deals
          </CardTitle>
          <button className="text-xs text-primary hover:underline">View all</button>
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
                  className={stageStyles[deal.stage]}
                >
                  {stageLabels[deal.stage]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
