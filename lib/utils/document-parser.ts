/**
 * Financial Document Parser
 *
 * Extracts financial metrics from CSV, Excel (.xlsx/.xls), and PDF files.
 * All functions accept a Buffer and return ExtractedFinancialData.
 * Uses dynamic imports to keep the module tree lean.
 */

import type { ExtractedFinancialData } from '@/lib/models/Document'

// ── Column name patterns ──────────────────────────────────────────────────────

const REVENUE_COLS  = /revenue|income|sales|receipts/i
const EXPENSE_COLS  = /expense|cost|expenditure|spend/i
const DEBT_COLS     = /debt|loan.payment|obligation|installment/i
const BALANCE_COLS  = /balance|cash|account.balance|bank/i

// ── Regex for PDF text ────────────────────────────────────────────────────────

const REVENUE_RE = /(?:revenue|income|sales)[:\s]+\$?([\d,]+(?:\.\d{2})?)/gi
const EXPENSE_RE = /(?:expenses?|costs?|expenditure)[:\s]+\$?([\d,]+(?:\.\d{2})?)/gi
const DEBT_RE    = /(?:debt|payment|obligation|installment)[:\s]+\$?([\d,]+(?:\.\d{2})?)/gi
const BALANCE_RE = /(?:balance|cash)[:\s]+\$?([\d,]+(?:\.\d{2})?)/gi

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, ''))
}

function extractAllMatches(text: string, re: RegExp): number[] {
  const results: number[] = []
  let m: RegExpExecArray | null
  const regex = new RegExp(re.source, re.flags)
  while ((m = regex.exec(text)) !== null) {
    const v = parseNum(m[1])
    if (!isNaN(v)) results.push(v)
  }
  return results
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round(nums.reduce((s, v) => s + v, 0) / nums.length)
}

function sum(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round(nums.reduce((s, v) => s + v, 0))
}

function deriveMetrics(
  monthlyRevenue: number | null,
  totalRevenue: number | null,
  monthlyExpenses: number | null,
  monthlyDebtObligations: number | null,
  accountBalance: number | null,
): ExtractedFinancialData {
  const rev = monthlyRevenue ?? (totalRevenue != null ? Math.round(totalRevenue / 12) : null)
  const suggestedDtiRatio =
    rev != null && rev > 0 && monthlyDebtObligations != null
      ? Math.round((monthlyDebtObligations / rev) * 100)
      : null
  const suggestedMaxLoan = rev != null ? rev * 36 : null

  return {
    monthlyRevenue,
    totalRevenue,
    monthlyExpenses,
    monthlyDebtObligations,
    accountBalance,
    suggestedDtiRatio,
    suggestedMaxLoan,
    rawLines: [],
  }
}

// ── CSV parser ────────────────────────────────────────────────────────────────

export async function parseCSV(buffer: Buffer): Promise<ExtractedFinancialData> {
  const Papa = (await import('papaparse')).default
  const text = buffer.toString('utf-8')
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (data.length === 0) return deriveMetrics(null, null, null, null, null)

  const headers = Object.keys(data[0])

  const revenueCol  = headers.find((h) => REVENUE_COLS.test(h))
  const expenseCol  = headers.find((h) => EXPENSE_COLS.test(h))
  const debtCol     = headers.find((h) => DEBT_COLS.test(h))
  const balanceCol  = headers.find((h) => BALANCE_COLS.test(h))

  function colSum(col: string | undefined): number | null {
    if (!col) return null
    const vals = data.map((row) => parseNum(row[col] ?? '')).filter((v) => !isNaN(v))
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0)) : null
  }

  const totalRevenue     = colSum(revenueCol)
  const totalExpenses    = colSum(expenseCol)
  const totalDebt        = colSum(debtCol)
  const latestBalance    = balanceCol
    ? parseNum(data[data.length - 1][balanceCol] ?? '')
    : null

  const monthlyRevenue   = totalRevenue   != null ? Math.round(totalRevenue   / data.length) : null
  const monthlyExpenses  = totalExpenses  != null ? Math.round(totalExpenses  / data.length) : null
  const monthlyDebt      = totalDebt      != null ? Math.round(totalDebt      / data.length) : null
  const accountBalance   = !isNaN(latestBalance as number) ? latestBalance : null

  return deriveMetrics(monthlyRevenue, totalRevenue, monthlyExpenses, monthlyDebt, accountBalance)
}

// ── Excel parser ──────────────────────────────────────────────────────────────

export async function parseExcel(buffer: Buffer): Promise<ExtractedFinancialData> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return deriveMetrics(null, null, null, null, null)

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  if (rows.length === 0) return deriveMetrics(null, null, null, null, null)

  const headers = Object.keys(rows[0])

  const revenueCol  = headers.find((h) => REVENUE_COLS.test(h))
  const expenseCol  = headers.find((h) => EXPENSE_COLS.test(h))
  const debtCol     = headers.find((h) => DEBT_COLS.test(h))
  const balanceCol  = headers.find((h) => BALANCE_COLS.test(h))

  function colSum(col: string | undefined): number | null {
    if (!col) return null
    const vals = rows
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v) && isFinite(v))
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0)) : null
  }

  const totalRevenue    = colSum(revenueCol)
  const totalExpenses   = colSum(expenseCol)
  const totalDebt       = colSum(debtCol)
  const rawBalance      = balanceCol ? Number(rows[rows.length - 1][balanceCol]) : NaN
  const accountBalance  = !isNaN(rawBalance) ? rawBalance : null

  const monthlyRevenue  = totalRevenue  != null ? Math.round(totalRevenue  / rows.length) : null
  const monthlyExpenses = totalExpenses != null ? Math.round(totalExpenses / rows.length) : null
  const monthlyDebt     = totalDebt     != null ? Math.round(totalDebt     / rows.length) : null

  return deriveMetrics(monthlyRevenue, totalRevenue, monthlyExpenses, monthlyDebt, accountBalance)
}

// ── PDF parser ────────────────────────────────────────────────────────────────

export async function parsePDF(buffer: Buffer): Promise<ExtractedFinancialData> {
  // Lazy import avoids pdf-parse's test-file side-effect at module load time.
  // pdf-parse may export as CJS default or as named export depending on the build.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any
  const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
    pdfParseModule.default ?? pdfParseModule
  const data = await pdfParse(buffer)
  const text: string = data.text

  const revenues  = extractAllMatches(text, REVENUE_RE)
  const expenses  = extractAllMatches(text, EXPENSE_RE)
  const debts     = extractAllMatches(text, DEBT_RE)
  const balances  = extractAllMatches(text, BALANCE_RE)

  // Collect lines containing $ amounts (up to 20)
  const rawLines = text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.includes('$') && l.length < 200)
    .slice(0, 20)

  const monthlyRevenue  = avg(revenues)
  const totalRevenue    = sum(revenues)
  const monthlyExpenses = avg(expenses)
  const monthlyDebt     = avg(debts)
  const accountBalance  = balances.length > 0 ? balances[balances.length - 1] : null

  const result = deriveMetrics(monthlyRevenue, totalRevenue, monthlyExpenses, monthlyDebt, accountBalance)
  result.rawLines = rawLines
  return result
}
