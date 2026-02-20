import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      dealUpdates: z.boolean().optional(),
      contactUpdates: z.boolean().optional(),
      activityAlerts: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
    })
    .optional(),
  appearance: z
    .object({
      language: z.string().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      sidebarCollapsed: z.boolean().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
    })
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const user = await User.findById(userId).select('-hashedPassword').lean()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      role: user.role,
      location: user.location,
      bio: user.bio,
      notifications: user.notifications,
      appearance: user.appearance,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    await connectDB()

    const { currentPassword, newPassword, ...profileUpdates } = parsed.data
    const updateData: Record<string, unknown> = { ...profileUpdates }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }
      const user = await User.findById(userId)
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const valid = await bcrypt.compare(currentPassword, user.hashedPassword)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      updateData.hashedPassword = await bcrypt.hash(newPassword, 10)
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .select('-hashedPassword')
      .lean()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      role: user.role,
      location: user.location,
      bio: user.bio,
      notifications: user.notifications,
      appearance: user.appearance,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
