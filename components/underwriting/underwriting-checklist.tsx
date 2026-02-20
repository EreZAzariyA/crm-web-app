"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"

const CHECKLIST_KEYS = [
  "creditReport",
  "incomeVerification",
  "collateralAssessed",
  "legalDocuments",
  "bankStatements",
  "identityVerification",
  "propertyTitle",
]

interface Props {
  dealId: string
}

export function UnderwritingChecklist({ dealId }: Props) {
  const t = useTranslations("Underwriting")
  const storageKey = `uw-checklist-${dealId}`
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST_KEYS.length).fill(false))
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as boolean[]
        if (Array.isArray(parsed) && parsed.length === CHECKLIST_KEYS.length) {
          setChecked(parsed)
        }
      }
    } catch { /* ignore */ }
    setMounted(true)
  }, [storageKey])

  // Save to localStorage on change
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked))
    } catch { /* ignore */ }
  }, [checked, storageKey, mounted])

  function toggle(idx: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[idx] = !next[idx]
      return next
    })
  }

  const doneCount = checked.filter(Boolean).length
  const progress = Math.round((doneCount / CHECKLIST_KEYS.length) * 100)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t("checklistTitle")}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("checklistStatus", { count: doneCount, total: CHECKLIST_KEYS.length })}
          </span>
        </div>
        <Progress value={progress} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        {CHECKLIST_KEYS.map((key, idx) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => toggle(idx)}
          >
            <Checkbox
              checked={checked[idx]}
              onCheckedChange={() => toggle(idx)}
              className="shrink-0"
            />
            <span
              className={`text-sm leading-snug transition-colors ${
                checked[idx]
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {t(`checklistItems.${key}` as any)}
            </span>
            {checked[idx] && (
              <Check className="ms-auto size-3.5 shrink-0 text-emerald-600" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
