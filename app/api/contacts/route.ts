import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Contact from '@/lib/models/Contact'

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(''),
  role: z.string().optional().default(''),
  status: z.enum(['lead', 'prospect', 'customer', 'churned']).default('lead'),
  phone: z.string().optional().default(''),
})

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    await connectDB()

    const query: Record<string, unknown> = { userId }
    if (status) query.status = status
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ]
    }

    const contacts = await Contact.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      contacts.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        company: c.company,
        role: c.role,
        status: c.status,
        phone: c.phone,
        lastActivity: c.lastActivity,
        avatar: c.avatar,
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
    const parsed = createContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, company, role, status, phone } = parsed.data

    await connectDB()

    // Duplicate email check
    const existing = await Contact.findOne({ userId, email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      )
    }

    const avatar = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    const contact = await Contact.create({
      userId,
      name,
      email: email.toLowerCase(),
      company,
      role,
      status,
      phone,
      avatar,
      lastActivity: 'Just now',
    })

    return NextResponse.json(
      {
        id: contact._id.toString(),
        name: contact.name,
        email: contact.email,
        company: contact.company,
        role: contact.role,
        status: contact.status,
        phone: contact.phone,
        lastActivity: contact.lastActivity,
        avatar: contact.avatar,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
