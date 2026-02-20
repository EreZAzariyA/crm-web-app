"use client"

import React, { useState, useRef } from "react"
import { Upload, Loader2, AlertCircle } from "lucide-react"
import Papa from "papaparse"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[]) => Promise<void>
  title: string
  description: string
  mappingHint: string
  previewColumns: { header: string; key: string; format?: (v: any) => string }[]
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
  title,
  description,
  mappingHint,
  previewColumns,
}: CSVImportDialogProps) {
  const common = useTranslations("Common")
  const tp = useTranslations("Activity.placeholders")
  const ta = useTranslations("Activity.import")
  
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5))
        },
      })
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await onImport(results.data)
          onOpenChange(false)
        } catch (err) {
          console.error("Import error:", err)
        } finally {
          setImporting(false)
          setFile(null)
          setPreview([])
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-secondary/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{file ? file.name : tp("dropzone")}</p>
            <p className="text-xs text-muted-foreground mt-1">{tp("hint")}</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ta("preview")}</Label>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/50">
                    <TableRow className="h-8 border-border">
                      {previewColumns.map((col) => (
                        <TableHead key={col.key} className="text-[10px] h-8">{col.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i} className="h-8 border-border">
                        {previewColumns.map((col) => (
                          <TableCell key={col.key} className="text-[10px] py-1">
                            {col.format ? col.format(row[col.key] || row[col.header]) : (row[col.key] || row[col.header] || "—")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {file && (
            <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-amber-600 dark:text-amber-500">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs">{mappingHint}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>{common("cancel")}</Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing && <Loader2 className="me-2 size-4 animate-spin" />}
            {common("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
