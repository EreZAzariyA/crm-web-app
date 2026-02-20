import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Contact from '@/lib/models/Contact'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const contact = await Contact.findOne({ _id: id, userId }).lean()
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      company: contact.company,
      role: contact.role,
      status: contact.status,
      phone: contact.phone,
      lastActivity: contact.lastActivity,
      avatar: contact.avatar,
    })
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

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      company: contact.company,
      role: contact.role,
      status: contact.status,
      phone: contact.phone,
      lastActivity: contact.lastActivity,
      avatar: contact.avatar,
    })
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

    const contact = await Contact.findOneAndDelete({ _id: id, userId })
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
