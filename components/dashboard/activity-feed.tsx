"use client"

import Link from "next/link"
import { Mail, Phone, Calendar, StickyNote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAppSelector } from "@/lib/hooks"

const typeIcons = {
  email:   Mail,
  call:    Phone,
  meeting: Calendar,
  note:    StickyNote,
}

const typeColors = {
  email:   "bg-chart-2/20 text-chart-2",
  call:    "bg-primary/20 text-primary",
  meeting: "bg-warning/20 text-warning",
  note:    "bg-chart-5/20 text-chart-5",
}

export function ActivityFeed() {
  const { items: activities } = useAppSelector((s) => s.activities)
  const recent = activities.slice(0, 5)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle>
          <Link href="/activity" className="text-xs text-primary hover:underline">View all</Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No recent activity</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recent.map((activity) => {
              const Icon = typeIcons[activity.type]
              const colorClass = typeColors[activity.type]
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{activity.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{activity.description}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
