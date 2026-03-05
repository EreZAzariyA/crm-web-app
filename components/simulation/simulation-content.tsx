"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { ScenarioCard, type ScenarioData } from "./scenario-card"
import { ComparisonChart } from "./comparison-chart"
import { computeAmortization } from "@/lib/engines/amortization"

const SCENARIO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"]
const LETTERS = ["A", "B", "C"]

function createScenario(): ScenarioData {
  return {
    id: crypto.randomUUID(),
    loanAmount: 100000,
    interestRate: 5.5,
    loanTerm: 36,
    originationFee: 1.0,
  }
}

export function SimulationContent() {
  const t = useTranslations("Simulation")
  const [scenarios, setScenarios] = useState<ScenarioData[]>([createScenario()])

  function addScenario() {
    if (scenarios.length >= 3) return
    setScenarios((prev) => [...prev, createScenario()])
  }

  function removeScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  function updateScenario(updated: ScenarioData) {
    setScenarios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  // Summary comparison data
  const summaryRows = useMemo(() => {
    const validScenarios = scenarios.filter((s) => s.loanAmount > 0 && s.loanTerm > 0)
    if (validScenarios.length === 0) return []

    const results = validScenarios.map((s) => {
      const amort = computeAmortization(s.loanAmount, s.interestRate, s.loanTerm)
      const feeAmount = s.loanAmount * s.originationFee / 100
      const effectiveRate = s.loanTerm > 0
        ? ((amort.totalPaid + feeAmount - s.loanAmount) / s.loanAmount / (s.loanTerm / 12) * 100)
        : 0
      return { ...amort, feeAmount, effectiveRate, scenario: s }
    })

    const metrics = [
      {
        label: t("monthlyPayment"),
        values: results.map((r) => r.monthlyPayment),
        format: (v: number) => `$${v.toLocaleString()}`,
        bestIndex: results.reduce((best, r, i) => r.monthlyPayment < results[best].monthlyPayment ? i : best, 0),
      },
      {
        label: t("totalInterest"),
        values: results.map((r) => r.totalInterest),
        format: (v: number) => `$${v.toLocaleString()}`,
        bestIndex: results.reduce((best, r, i) => r.totalInterest < results[best].totalInterest ? i : best, 0),
      },
      {
        label: t("totalPaid"),
        values: results.map((r) => r.totalPaid + r.feeAmount),
        format: (v: number) => `$${Math.round(v).toLocaleString()}`,
        bestIndex: results.reduce((best, r, i) => (r.totalPaid + r.feeAmount) < (results[best].totalPaid + results[best].feeAmount) ? i : best, 0),
      },
      {
        label: t("effectiveRate"),
        values: results.map((r) => r.effectiveRate),
        format: (v: number) => `${v.toFixed(2)}%`,
        bestIndex: results.reduce((best, r, i) => r.effectiveRate < results[best].effectiveRate ? i : best, 0),
      },
    ]

    return { metrics, validScenarios }
  }, [scenarios, t])

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Scenario Cards */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {scenarios.length}/3 {t("maxScenarios").toLowerCase()}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={addScenario}
              disabled={scenarios.length >= 3}
            >
              <Plus className="size-4 mr-1" />
              {t("addScenario")}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario, i) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                letter={LETTERS[i]}
                color={SCENARIO_COLORS[i]}
                onChange={updateScenario}
                onRemove={() => removeScenario(scenario.id)}
                canRemove={scenarios.length > 1}
              />
            ))}
          </div>

          {/* Comparison Chart */}
          <ComparisonChart scenarios={scenarios} />

          {/* Summary Table */}
          {summaryRows && "metrics" in summaryRows && summaryRows.metrics.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {t("summaryTable")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground" />
                        {summaryRows.validScenarios.map((s, i) => (
                          <th key={s.id} className="text-start py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="size-2.5 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[scenarios.indexOf(s)] }} />
                              <span className="text-xs font-medium text-foreground">
                                {t("scenario", { letter: LETTERS[scenarios.indexOf(s)] })}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.metrics.map((metric) => (
                        <tr key={metric.label} className="border-b border-border last:border-0">
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{metric.label}</td>
                          {metric.values.map((val, i) => (
                            <td key={i} className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${i === metric.bestIndex ? "font-semibold text-primary" : "text-foreground"}`}>
                                  {metric.format(val)}
                                </span>
                                {i === metric.bestIndex && metric.values.length > 1 && (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                                    {t("best")}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
