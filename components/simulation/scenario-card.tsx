"use client"

import { useMemo } from "react"
import { X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { computeAmortization, type AmortizationResult } from "@/lib/engines/amortization"

export interface ScenarioData {
  id: string
  loanAmount: number
  interestRate: number
  loanTerm: number
  originationFee: number
}

interface ScenarioCardProps {
  scenario: ScenarioData
  letter: string
  color: string
  onChange: (updated: ScenarioData) => void
  onRemove: () => void
  canRemove: boolean
}

export function ScenarioCard({ scenario, letter, color, onChange, onRemove, canRemove }: ScenarioCardProps) {
  const t = useTranslations("Simulation")

  const result: AmortizationResult | null = useMemo(() => {
    if (scenario.loanAmount <= 0 || scenario.loanTerm <= 0) return null
    return computeAmortization(scenario.loanAmount, scenario.interestRate, scenario.loanTerm)
  }, [scenario.loanAmount, scenario.interestRate, scenario.loanTerm])

  function handleChange(field: keyof ScenarioData, value: string) {
    const num = parseFloat(value) || 0
    onChange({ ...scenario, [field]: num })
  }

  return (
    <Card className="border-border bg-card flex-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("scenario", { letter })}
            </CardTitle>
          </div>
          {canRemove && (
            <Button variant="ghost" size="icon" className="size-7" onClick={onRemove}>
              <X className="size-3.5" />
              <span className="sr-only">{t("removeScenario")}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("loanAmount")}</Label>
          <Input
            type="number"
            min={0}
            value={scenario.loanAmount || ""}
            onChange={(e) => handleChange("loanAmount", e.target.value)}
            placeholder="100000"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("interestRate")}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={scenario.interestRate || ""}
            onChange={(e) => handleChange("interestRate", e.target.value)}
            placeholder="5.5"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("loanTerm")}</Label>
          <Input
            type="number"
            min={1}
            max={360}
            value={scenario.loanTerm || ""}
            onChange={(e) => handleChange("loanTerm", e.target.value)}
            placeholder="36"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">{t("originationFee")}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={scenario.originationFee || ""}
            onChange={(e) => handleChange("originationFee", e.target.value)}
            placeholder="1.0"
          />
        </div>

        {/* Results */}
        {result && (
          <div className="mt-2 rounded-md border border-border bg-muted/50 p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("monthlyPayment")}</span>
                <span className="text-sm font-semibold text-foreground">${result.monthlyPayment.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("totalInterest")}</span>
                <span className="text-sm font-medium text-foreground">${result.totalInterest.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("totalPaid")}</span>
                <span className="text-sm font-medium text-foreground">${result.totalPaid.toLocaleString()}</span>
              </div>
              {scenario.originationFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t("originationFee")}</span>
                  <span className="text-sm font-medium text-foreground">
                    ${Math.round(scenario.loanAmount * scenario.originationFee / 100).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
