import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  className?: string
}

export function StatCard({ label, value, sub, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
          </div>
          {Icon && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
          )}
        </div>
        {sub && (
          <div className="mt-3">
            <span className="text-xs text-muted-foreground">{sub}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
