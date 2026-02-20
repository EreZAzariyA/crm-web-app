import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Deal from '@/lib/models/Deal'

function mapDeal(d: Record<string, unknown> & { _id: { toString(): string } }) {
  return {
    id: d._id.toString(),
    title: d.title as string,
    company: d.company as string,
    value: d.value as number,
    stage: d.stage as string,
    probability: d.probability as number,
    contact: d.contact as string,
    expectedClose: d.expectedClose as string,
    notes: (d.notes as string) || '',
    lostReason: (d.lostReason as string) || '',
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const deal = await Deal.findOne({ _id: id, userId }).lean()
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(mapDeal(deal as Parameters<typeof mapDeal>[0]))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    await connectDB()

    const deal = await Deal.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(mapDeal(deal as Parameters<typeof mapDeal>[0]))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const deal = await Deal.findOneAndDelete({ _id: id, userId })
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
