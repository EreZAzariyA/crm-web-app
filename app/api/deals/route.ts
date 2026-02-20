import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'

const createDealSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional().default(''),
  value: z.number().min(0),
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).default('discovery'),
  probability: z.number().min(0).max(100).default(0),
  contact: z.string().optional().default(''),
  expectedClose: z.string().optional().default(''),
})

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    await connectDB()

    const query: Record<string, unknown> = { userId }
    if (stage) query.stage = stage

    const deals = await Deal.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      deals.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        company: d.company,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        contact: d.contact,
        expectedClose: d.expectedClose,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const deal = await Deal.create({ userId, ...parsed.data })

    return NextResponse.json(
      {
        id: deal._id.toString(),
        title: deal.title,
        company: deal.company,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        contact: deal.contact,
        expectedClose: deal.expectedClose,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
