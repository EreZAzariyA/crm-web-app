import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import FinancialReport from '@/lib/models/FinancialReport'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

// Zod schema for the AI structured output
const FinancialAnalysisSchema = z.object({
  transactions: z.array(z.object({
    date:        z.string(),
    category:    z.string(),
    type:        z.enum(['income', 'expense']),
    description: z.string(),
    amount:      z.number(),
    currency:    z.string(),
  })),
  totalRevenue:       z.number(),
  totalExpenses:      z.number(),
  netCashFlow:        z.number(),
  debtRatio:          z.number(),
  profitabilityRatio: z.number(),
  creditScore:        z.number().min(0).max(100),
  creditRating:       z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
  scoreExplanation:   z.string(),
  metrics: z.array(z.object({
    name:   z.string(),
    value:  z.string(),
    impact: z.enum(['positive', 'neutral', 'negative']),
  })),
  expenseBreakdown: z.array(z.object({
    category:   z.string(),
    amount:     z.number(),
    percentage: z.number(),
  })),
})

function parseCSVBuffer(buffer: Buffer): Record<string, string>[] {
  const text = buffer.toString('utf-8')
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return result.data
}

function parseExcelBuffer(buffer: Buffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheet = workbook.SheetNames[0]
  if (!firstSheet) return []
  const sheet = workbook.Sheets[firstSheet]
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReport(d: any) {
  return {
    id:               d._id.toString(),
    companyName:      d.companyName,
    originalName:     d.originalName,
    transactions:     d.transactions ?? [],
    summary:          d.summary ?? null,
    creditScore:      d.creditScore ?? null,
    creditRating:     d.creditRating ?? null,
    scoreExplanation: d.scoreExplanation ?? null,
    metrics:          d.metrics ?? [],
    status:           d.status,
    errorMessage:     d.errorMessage ?? null,
    createdAt:        d.createdAt,
    updatedAt:        d.updatedAt,
  }
}

/** GET /api/companies/[name]/financial-reports */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await params
    const companyName = decodeURIComponent(name)
    await connectDB()

    const reports = await FinancialReport.find({ companyName })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(reports.map(mapReport))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/companies/[name]/financial-reports */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await params
    const companyName = decodeURIComponent(name)

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: CSV, Excel (.xlsx/.xls)' },
        { status: 400 }
      )
    }

    // Validate size
    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(arrayBuffer)
    await connectDB()

    // Create DB record with processing status
    const report = await FinancialReport.create({
      companyName,
      userId,
      originalName: file.name,
      status: 'processing',
    })

    try {
      // Parse the file to get raw rows
      let rawRows: Record<string, string>[]
      if (file.type === 'text/csv') {
        rawRows = parseCSVBuffer(buffer)
      } else {
        rawRows = parseExcelBuffer(buffer)
      }

      if (rawRows.length === 0) {
        throw new Error('No data rows found in the uploaded file')
      }

      // Limit to 500 rows to avoid token limits
      const trimmedRows = rawRows.slice(0, 500)

      // Send to Gemini via AI SDK 6 for analysis
      const { output } = await generateText({
        model: 'google/gemini-2.5-flash',
        output: Output.object({ schema: FinancialAnalysisSchema }),
        prompt: `You are a financial analyst. Analyze the following company transaction data and calculate a credit score.

Here is the raw transaction data from a CSV/Excel upload (${trimmedRows.length} rows):

${JSON.stringify(trimmedRows, null, 2)}

Instructions:
1. Classify each row as income or expense based on the data (look at amounts, descriptions, categories).
2. Calculate total revenue (sum of all income) and total expenses (sum of all expenses).
3. Calculate net cash flow = totalRevenue - totalExpenses.
4. Calculate debt ratio = (debt-related expenses like loan payments, interest, etc.) / totalRevenue. If no clear debt expenses, estimate from context.
5. Calculate profitability ratio = netCashFlow / totalRevenue.
6. Provide an expense breakdown by category with amounts and percentages.
7. Calculate a credit score from 0 to 100 where:
   - 80-100: Excellent (strong cash flow, low debt, high profitability)
   - 60-79: Good (positive cash flow, manageable debt)
   - 40-59: Fair (break-even or slight profit, moderate debt)
   - 0-39: Poor (negative cash flow, high debt, unprofitable)
8. Provide the rating: "Excellent", "Good", "Fair", or "Poor".
9. Write a 2-3 sentence human-readable explanation of the score.
10. List the key metrics used in the scoring with their values and whether each metric's impact is positive, neutral, or negative.

Make sure all amounts use the same currency (default to USD if not specified). Return structured JSON.`,
      })

      if (!output) {
        throw new Error('AI analysis returned no structured output')
      }

      // Update the report with AI results
      await FinancialReport.updateOne(
        { _id: report._id },
        {
          $set: {
            transactions: output.transactions,
            summary: {
              totalRevenue: output.totalRevenue,
              totalExpenses: output.totalExpenses,
              netCashFlow: output.netCashFlow,
              debtRatio: output.debtRatio,
              profitabilityRatio: output.profitabilityRatio,
              expenseBreakdown: output.expenseBreakdown,
            },
            creditScore: output.creditScore,
            creditRating: output.creditRating,
            scoreExplanation: output.scoreExplanation,
            metrics: output.metrics,
            status: 'done',
          },
        },
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      await FinancialReport.updateOne(
        { _id: report._id },
        { $set: { status: 'failed', errorMessage: msg } },
      )
    }

    const fresh = await FinancialReport.findById(report._id).lean()
    return NextResponse.json(mapReport(fresh), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
