"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { CrmService, type FinancialReportRecord } from "@/lib/crm-service"
import { useTranslations } from "next-intl"

interface Props {
  companyName: string
}

export function CompanyFinancialReportsTab({ companyName }: Props) {
  const t = useTranslations("Companies.financialReports")
  const { toast } = useToast()
  const [reports, setReports] = useState<FinancialReportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const data = await CrmService.getFinancialReports(companyName)
      setReports(data)
    } catch {
      toast({ title: t("fetchError"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [companyName, toast, t])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleUpload = async (file: File) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!allowed.includes(file.type)) {
      toast({ title: t("invalidFileType"), variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("fileTooLarge"), variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      const report = await CrmService.uploadFinancialReport(companyName, file)
      setReports((prev) => [report, ...prev])

      // If it came back processing, poll for status
      if (report.status === "processing") {
        pollForResult(report.id)
      } else {
        toast({ title: t("uploadSuccess") })
      }
    } catch (err) {
      toast({
        title: t("uploadFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const pollForResult = async (reportId: string) => {
    // Re-fetch all reports after a delay to pick up the AI result
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const data = await CrmService.getFinancialReports(companyName)
        const found = data.find((r) => r.id === reportId)
        if (found && found.status !== "processing") {
          setReports(data)
          clearInterval(interval)
          if (found.status === "done") {
            toast({ title: t("analysisComplete") })
          } else {
            toast({ title: t("analysisFailed"), variant: "destructive" })
          }
        }
      } catch {
        // silently retry
      }
      if (attempts > 30) clearInterval(interval) // stop after ~60s
    }, 2000)
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = "" // reset to allow re-uploading
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground"
    if (score >= 80) return "text-emerald-500"
    if (score >= 60) return "text-blue-500"
    if (score >= 40) return "text-amber-500"
    return "text-red-500"
  }

  const ratingBadgeVariant = (rating: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!rating) return "outline"
    switch (rating) {
      case "Excellent": return "default"
      case "Good": return "secondary"
      case "Fair": return "outline"
      case "Poor": return "destructive"
      default: return "outline"
    }
  }

  const impactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <TrendingUp className="size-3.5 text-emerald-500" />
      case "negative": return <TrendingDown className="size-3.5 text-red-500" />
      default: return <Minus className="size-3.5 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload area */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            {uploading ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("processing")}</p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{t("dropzone")}</p>
                  <p className="text-xs text-muted-foreground">{t("dropzoneSub")}</p>
                </div>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span>{t("browse")}</span>
                  </Button>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="sr-only"
                    onChange={onFileInputChange}
                    disabled={uploading}
                  />
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <FileSpreadsheet className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("noReports")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id
            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {report.originalName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.status === "processing" && (
                        <Badge variant="outline" className="gap-1.5">
                          <Loader2 className="size-3 animate-spin" />
                          {t("statusProcessing")}
                        </Badge>
                      )}
                      {report.status === "failed" && (
                        <Badge variant="destructive" className="gap-1.5">
                          <AlertCircle className="size-3" />
                          {t("statusFailed")}
                        </Badge>
                      )}
                      {report.status === "done" && report.creditScore !== null && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold tabular-nums ${scoreColor(report.creditScore)}`}>
                            {report.creditScore}
                          </span>
                          <Badge variant={ratingBadgeVariant(report.creditRating)}>
                            {report.creditRating}
                          </Badge>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && report.status === "done" && (
                  <CardContent className="border-t pt-6">
                    <div className="flex flex-col gap-6">
                      {/* Score explanation */}
                      {report.scoreExplanation && (
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-sm leading-relaxed text-foreground">
                            {report.scoreExplanation}
                          </p>
                        </div>
                      )}

                      {/* Summary stats */}
                      {report.summary && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <SummaryStat
                            label={t("totalRevenue")}
                            value={`$${report.summary.totalRevenue.toLocaleString()}`}
                            positive
                          />
                          <SummaryStat
                            label={t("totalExpenses")}
                            value={`$${report.summary.totalExpenses.toLocaleString()}`}
                            positive={false}
                          />
                          <SummaryStat
                            label={t("netCashFlow")}
                            value={`$${report.summary.netCashFlow.toLocaleString()}`}
                            positive={report.summary.netCashFlow >= 0}
                          />
                          <SummaryStat
                            label={t("debtRatio")}
                            value={`${(report.summary.debtRatio * 100).toFixed(1)}%`}
                            positive={report.summary.debtRatio < 0.4}
                          />
                          <SummaryStat
                            label={t("profitability")}
                            value={`${(report.summary.profitabilityRatio * 100).toFixed(1)}%`}
                            positive={report.summary.profitabilityRatio > 0}
                          />
                        </div>
                      )}

                      {/* Metrics table */}
                      {report.metrics && report.metrics.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">{t("scoringMetrics")}</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("metricName")}</TableHead>
                                <TableHead>{t("metricValue")}</TableHead>
                                <TableHead className="w-[80px]">{t("metricImpact")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.metrics.map((m, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm">{m.name}</TableCell>
                                  <TableCell className="text-sm font-medium tabular-nums">{m.value}</TableCell>
                                  <TableCell>{impactIcon(m.impact)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Expense breakdown */}
                      {report.summary?.expenseBreakdown && report.summary.expenseBreakdown.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">{t("expenseBreakdown")}</h4>
                          <div className="flex flex-col gap-2">
                            {report.summary.expenseBreakdown.map((cat, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-32 truncate text-sm text-muted-foreground">
                                  {cat.category}
                                </span>
                                <div className="flex-1">
                                  <div className="h-2 rounded-full bg-muted">
                                    <div
                                      className="h-2 rounded-full bg-primary"
                                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                                  ${cat.amount.toLocaleString()} ({cat.percentage.toFixed(0)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}

                {isExpanded && report.status === "failed" && (
                  <CardContent className="border-t pt-6">
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                      <AlertCircle className="size-4 text-destructive" />
                      <p className="text-sm text-destructive">
                        {report.errorMessage || t("unknownError")}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {value}
      </p>
    </div>
  )
}
