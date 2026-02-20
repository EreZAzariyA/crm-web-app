import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'
import User from '@/lib/models/User'
import { validateTransition } from '@/lib/engines/deal-lifecycle'
import type { Stage } from '@/lib/engines/deal-lifecycle'
import { computeRiskScore } from '@/lib/engines/risk-scoring'
import { getScopeFilter } from '@/lib/utils/api-utils'

const RISK_FIELDS = ['creditScore', 'ltvRatio', 'dtiRatio', 'loanTerm', 'value', 'approvedAmount'] as const



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
    stageHistory:     d.stageHistory ?? [],
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOne({ _id: id, ...scopeFilter }).lean()
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(mapDeal(deal))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)

    // ── State machine validation ──────────────────────────────────────────────
    // If the request includes a stage change, validate the transition first
    let stageHistoryPush: object | null = null

    if (body.stage) {
      const currentDeal = await Deal.findOne({ _id: id, ...scopeFilter }).select('stage').lean()
      if (!currentDeal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const currentStage = currentDeal.stage as Stage
      const newStage = body.stage as Stage

      if (currentStage !== newStage) {
        const result = validateTransition(currentStage, newStage)
        if (!result.allowed) {
          return NextResponse.json({ error: result.reason }, { status: 400 })
        }
        // Prepare history entry to push
        stageHistoryPush = {
          stage: newStage,
          changedAt: new Date(),
          changedBy: new Types.ObjectId(userId),
        }
      }
    }

    // ── Auto risk scoring ─────────────────────────────────────────────────────
    // If any lending field changed, re-score and update riskRating automatically
    const riskFieldChanged = RISK_FIELDS.some(f => f in body)
    if (riskFieldChanged) {
      const currentForScore = await Deal.findOne({ _id: id, ...scopeFilter })
        .select('creditScore ltvRatio dtiRatio loanTerm value approvedAmount').lean()
      if (currentForScore) {
        const merged = { ...currentForScore, ...body }
        const riskResult = computeRiskScore({
          creditScore:    merged.creditScore    ?? null,
          ltvRatio:       merged.ltvRatio       ?? null,
          dtiRatio:       merged.dtiRatio       ?? null,
          loanTerm:       merged.loanTerm       ?? null,
          value:          merged.value          ?? 0,
          approvedAmount: merged.approvedAmount ?? null,
        })
        if (riskResult.hasEnoughData) {
          body.riskRating = riskResult.rating
        }
      }
    }

    // Build the update — append to stageHistory if stage changed
    const updateOp: Record<string, unknown> = { $set: body }
    if (stageHistoryPush) {
      updateOp.$push = { stageHistory: stageHistoryPush }
    }

    // Note: runValidators is omitted — stage transitions are already validated
    // by the state machine above; combining $set + $push with runValidators
    // causes Mongoose to throw for subdocument arrays.
    const deal = await Deal.findOneAndUpdate(
      { _id: id, ...scopeFilter },
      updateOp,
      { new: true }
    ).lean()

    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(mapDeal(deal))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOneAndDelete({ _id: id, ...scopeFilter })
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
