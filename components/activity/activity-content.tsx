"use client"

import { Mail, Phone, Calendar, StickyNote, Filter } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { activities } from "@/lib/crm-data"

const typeIcons = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: StickyNote,
}

const typeColors = {
  email: "bg-chart-2/20 text-chart-2",
  call: "bg-primary/20 text-primary",
  meeting: "bg-warning/20 text-warning",
  note: "bg-chart-5/20 text-chart-5",
}

const typeBadgeStyles = {
  email: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  call: "bg-primary/15 text-primary border-primary/30",
  meeting: "bg-warning/15 text-warning border-warning/30",
  note: "bg-chart-5/15 text-chart-5 border-chart-5/30",
}

export function ActivityContent() {
  return (
    <>
      <CrmHeader title="Activity" description="Recent interactions and updates" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Filter className="size-3.5" />
              Filter
            </Button>
          </div>

          {/* Timeline */}
          <div className="flex flex-col">
            {activities.map((activity, index) => {
              const Icon = typeIcons[activity.type]
              const colorClass = typeColors[activity.type]
              const badgeStyle = typeBadgeStyles[activity.type]

              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {activity.title}
                            </span>
                            <Badge variant="outline" className={badgeStyle}>
                              {activity.type.charAt(0).toUpperCase() +
                                activity.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-primary/10 text-primary text-[9px]">
                            {activity.contact
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {activity.contact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
