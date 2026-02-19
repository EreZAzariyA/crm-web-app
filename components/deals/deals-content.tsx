"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, ArrowUpRight } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { deals, type Deal } from "@/lib/crm-data"

type Stage = Deal["stage"]

const stages: { key: Stage; label: string; color: string }[] = [
  { key: "discovery", label: "Discovery", color: "bg-chart-2" },
  { key: "proposal", label: "Proposal", color: "bg-warning" },
  { key: "negotiation", label: "Negotiation", color: "bg-chart-5" },
  { key: "closed-won", label: "Closed Won", color: "bg-primary" },
  { key: "closed-lost", label: "Closed Lost", color: "bg-destructive" },
]

const stageColorMap: Record<Stage, string> = {
  discovery: "border-chart-2/30",
  proposal: "border-warning/30",
  negotiation: "border-chart-5/30",
  "closed-won": "border-primary/30",
  "closed-lost": "border-destructive/30",
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div
      className={`rounded-lg border bg-secondary/30 p-3 ${stageColorMap[deal.stage]} hover:bg-secondary/50 transition-colors cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{deal.title}</span>
          <span className="text-xs text-muted-foreground">{deal.company}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">Options for {deal.title}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Deal</DropdownMenuItem>
            <DropdownMenuItem>Move Stage</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">
          ${deal.value.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
      </div>
      <Progress value={deal.probability} className="mt-2 h-1" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{deal.contact}</span>
        <span className="text-xs text-muted-foreground">{deal.expectedClose}</span>
      </div>
    </div>
  )
}

function PipelineView() {
  const groupedDeals = stages.reduce(
    (acc, stage) => {
      acc[stage.key] = deals.filter((d) => d.stage === stage.key)
      return acc
    },
    {} as Record<Stage, Deal[]>,
  )

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stages.map((stage) => {
        const stageDeals = groupedDeals[stage.key] || []
        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0)

        return (
          <div key={stage.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full ${stage.color}`} />
                <span className="text-sm font-medium text-foreground">
                  {stage.label}
                </span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {stageDeals.length}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              ${totalValue.toLocaleString()} total
            </div>
            <div className="flex flex-col gap-2">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView() {
  return (
    <div className="flex flex-col gap-2">
      {deals.map((deal) => {
        const stage = stages.find((s) => s.key === deal.stage)
        return (
          <div
            key={deal.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`size-2 rounded-full ${stage?.color}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {deal.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {deal.company} &middot; {deal.contact}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  ${deal.value.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {deal.probability}% probability
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {stage?.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {deal.expectedClose}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <ArrowUpRight className="size-3.5" />
                <span className="sr-only">View {deal.title}</span>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DealsContent() {
  return (
    <>
      <CrmHeader title="Deals" description="Track and manage your sales pipeline" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="pipeline" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-3.5" />
              New Deal
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Total Pipeline</span>
                  <span className="text-xl font-bold text-foreground">$742,000</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Weighted Value</span>
                  <span className="text-xl font-bold text-foreground">$398,350</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Avg Deal Size</span>
                  <span className="text-xl font-bold text-foreground">$92,750</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Close Rate</span>
                  <span className="text-xl font-bold text-foreground">68%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="pipeline">
            <PipelineView />
          </TabsContent>
          <TabsContent value="list">
            <ListView />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
