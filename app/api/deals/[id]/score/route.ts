import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'
import User from '@/lib/models/User'
import { computeRiskScore } from '@/lib/engines/risk-scoring'
import { getScopeFilter } from '@/lib/utils/api-utils'

/** POST /api/deals/[id]/score — manually re-score a loan and save the result */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const deal = await Deal.findOne({ _id: id, ...scopeFilter })
      .select('creditScore ltvRatio dtiRatio loanTerm value approvedAmount')
      .lean()

    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = computeRiskScore({
      creditScore:    deal.creditScore    ?? null,
      ltvRatio:       deal.ltvRatio       ?? null,
      dtiRatio:       deal.dtiRatio       ?? null,
      loanTerm:       deal.loanTerm       ?? null,
      value:          deal.value          ?? 0,
      approvedAmount: deal.approvedAmount ?? null,
    })

    if (result.hasEnoughData) {
      await Deal.updateOne({ _id: id }, { $set: { riskRating: result.rating } })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
