import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'
import User from '@/lib/models/User'
import { computeRiskScore } from '@/lib/engines/risk-scoring'
import { getScopeFilter } from '@/lib/utils/api-utils'

// ── Zod schema ────────────────────────────────────────────────────────────────

const createDealSchema = z.object({
  title:         z.string().min(1),
  company:       z.string().optional().default(''),
  value:         z.number().min(0).default(0),
  stage: z.enum([
    'lead', 'pre_qualification', 'underwriting', 'approved',
    'active', 'monitoring', 'collection',
    'closed_won', 'closed_lost', 'default',
  ]).default('lead'),
  probability:      z.number().min(0).max(100).default(0),
  contact:          z.string().optional().default(''),
  expectedClose:    z.string().optional().default(''),
  notes:            z.string().optional().default(''),
  lostReason:       z.string().optional().default(''),

  // Lending fields (all optional)
  interestRate:     z.number().min(0).max(100).nullable().optional().default(null),
  loanTerm:         z.number().min(1).nullable().optional().default(null),
  ltvRatio:         z.number().min(0).max(200).nullable().optional().default(null),
  dtiRatio:         z.number().min(0).max(100).nullable().optional().default(null),
  creditScore:      z.number().min(300).max(850).nullable().optional().default(null),
  riskRating:       z.enum(['A', 'B', 'C', 'D']).nullable().optional().default(null),
  approvedAmount:   z.number().min(0).nullable().optional().default(null),
  disbursementDate: z.string().nullable().optional().default(null),
  maturityDate:     z.string().nullable().optional().default(null),
  originationFee:   z.number().min(0).max(100).nullable().optional().default(null),
  collateralValue:  z.number().min(0).nullable().optional().default(null),
  underwriterId:    z.string().nullable().optional().default(null),
})

// ── Response mapper ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeal(d: any) {
  return {
    id:               d._id.toString(),
    title:            d.title,
    company:          d.company,
    value:            d.value,
    stage:            d.stage,
    probability:      d.probability,
    contact:          d.contact,
    expectedClose:    d.expectedClose,
    notes:            d.notes            ?? '',
    lostReason:       d.lostReason       ?? '',
    // Lending fields
    interestRate:     d.interestRate     ?? null,
    loanTerm:         d.loanTerm         ?? null,
    ltvRatio:         d.ltvRatio         ?? null,
    dtiRatio:         d.dtiRatio         ?? null,
    creditScore:      d.creditScore      ?? null,
    riskRating:       d.riskRating       ?? null,
    approvedAmount:   d.approvedAmount   ?? null,
    disbursementDate: d.disbursementDate ?? null,
    maturityDate:     d.maturityDate     ?? null,
    originationFee:   d.originationFee   ?? null,
    collateralValue:  d.collateralValue  ?? null,
    underwriterId:    d.underwriterId ? d.underwriterId.toString() : null,
    // Audit trail
    stageHistory:     (d.stageHistory ?? []).map((e: { stage: string; changedAt: Date; changedBy: { toString(): string } }) => ({
      stage:     e.stage,
      changedAt: e.changedAt,
      changedBy: e.changedBy?.toString() ?? '',
    })),
  }
}

// ── GET /api/deals ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const query: Record<string, unknown> = { ...scopeFilter }
    if (stage) query.stage = stage

    const deals = await Deal.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json(deals.map(mapDeal))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/deals ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createDealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(userId).select('teamId').lean()
    const teamId = user?.teamId ?? null

    // Auto-score if we have enough lending data
    const riskResult = computeRiskScore({
      creditScore:    parsed.data.creditScore    ?? null,
      ltvRatio:       parsed.data.ltvRatio       ?? null,
      dtiRatio:       parsed.data.dtiRatio       ?? null,
      loanTerm:       parsed.data.loanTerm       ?? null,
      value:          parsed.data.value,
      approvedAmount: parsed.data.approvedAmount ?? null,
    })
    const autoRiskRating = riskResult.hasEnoughData ? riskResult.rating : (parsed.data.riskRating ?? null)

    const deal = await Deal.create({
      userId,
      teamId,
      ...parsed.data,
      riskRating: autoRiskRating,
      // Seed stageHistory with initial stage
      stageHistory: [{
        stage:     parsed.data.stage,
        changedAt: new Date(),
        changedBy: userId,
      }],
    })

    return NextResponse.json(mapDeal(deal), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
