"use client"

import { useMemo, useEffect, useState } from "react"
import { Download } from "lucide-react"
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { computeAmortization } from "@/lib/engines/amortization"
import { exportToCSV } from "@/lib/utils/csv"
import type { Deal } from "@/lib/crm-service"
import { useTranslations } from "next-intl"

// ── Theme-aware CSS variable reader ──────────────────────────────────────────

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

// ── Currency formatter ────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Summary tile ─────────────────────────────────────────────────────────────

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground leading-tight">{value}</span>
    </div>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface Props {
  deal: Deal
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AmortizationDialog({ deal, open, onOpenChange }: Props) {
  const t = useTranslations("Loans.view.amortization")

  const [colors, setColors] = useState({
    primary: "#10b981",
    border: "#e2e8f0",
    mutedFg: "#64748b",
    card: "#ffffff",
    cardFg: "#0f172a",
  })

  useEffect(() => {
    function readColors() {
      setColors({
        primary: getCssVar("--primary", "#10b981"),
        border: getCssVar("--border", "#e2e8f0"),
        mutedFg: getCssVar("--muted-foreground", "#64748b"),
        card: getCssVar("--card", "#ffffff"),
        cardFg: getCssVar("--card-foreground", "#0f172a"),
      })
    }
    readColors()
    const observer = new MutationObserver(readColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const hasData = deal.interestRate != null && deal.loanTerm != null

  const result = useMemo(() => {
    if (!hasData) return null
    return computeAmortization(deal.value, deal.interestRate!, deal.loanTerm!)
  }, [hasData, deal.value, deal.interestRate, deal.loanTerm])

  function handleExportCSV() {
    if (!result) return
    const headers: Record<string, string> = {
      month:     t("month"),
      payment:   t("payment"),
      principal: t("principal"),
      interest:  t("interest"),
      balance:   t("balance"),
    }
    exportToCSV(
      result.rows as unknown as Record<string, unknown>[],
      `amortization-${deal.title}.csv`,
      headers,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4">
          <DialogTitle>{t("title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{deal.title}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {!hasData ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("noData")}</p>
          ) : result ? (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-4 gap-2">
                <SummaryTile label={t("monthlyPayment")} value={fmt(result.monthlyPayment)} />
                <SummaryTile label={t("totalInterest")}  value={fmt(result.totalInterest)} />
                <SummaryTile label={t("totalPaid")}      value={fmt(result.totalPaid)} />
                <SummaryTile label={t("payments")}       value={String(result.rows.length)} />
              </div>

              {/* Balance decay chart */}
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={result.rows}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={colors.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: colors.mutedFg, fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: colors.mutedFg, fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "8px",
                        color: colors.cardFg,
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [fmt(value), t("balance")]}
                      labelFormatter={(label) => `${t("month")} ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Amortization table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                      <TableRow className="border-border">
                        <TableHead className="h-8 text-xs">{t("month")}</TableHead>
                        <TableHead className="h-8 text-xs text-end">{t("payment")}</TableHead>
                        <TableHead className="h-8 text-xs text-end">{t("principal")}</TableHead>
                        <TableHead className="h-8 text-xs text-end">{t("interest")}</TableHead>
                        <TableHead className="h-8 text-xs text-end">{t("balance")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row) => (
                        <TableRow key={row.month} className="border-border h-8">
                          <TableCell className="py-1 text-xs">{row.month}</TableCell>
                          <TableCell className="py-1 text-xs text-end">{fmt(row.payment)}</TableCell>
                          <TableCell className="py-1 text-xs text-end">{fmt(row.principal)}</TableCell>
                          <TableCell className="py-1 text-xs text-end text-amber-600">{fmt(row.interest)}</TableCell>
                          <TableCell className="py-1 text-xs text-end font-medium">{fmt(row.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex justify-between gap-2">
          {hasData && result && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="size-4 me-2" />
              {t("exportCSV")}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" size="sm" className={!hasData || !result ? "ms-auto" : ""}>
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
