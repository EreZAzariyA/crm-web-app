import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

const updateSchema = z
  .object({
    systemRole: z.enum(['admin', 'manager', 'user']).optional(),
    isActive: z.boolean().optional(),
    teamId: z.string().nullable().optional(),
  })
  .refine((d) => d.systemRole !== undefined || d.isActive !== undefined || d.teamId !== undefined, {
    message: 'Provide at least systemRole, isActive, or teamId',
  })

// ─── PUT /api/admin/users/[id] — update role and/or active status ─────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestingUserId = req.headers.get('x-user-id')
  const systemRole = req.headers.get('x-user-system-role')

  if (!requestingUserId || systemRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-modification
  if (id === requestingUserId) {
    return NextResponse.json(
      { error: 'You cannot change your own role or status' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectDB()

  // Prevent demoting the last admin
  if (parsed.data.systemRole && parsed.data.systemRole !== 'admin') {
    const target = await User.findById(id)
    if (target?.systemRole === 'admin') {
      const adminCount = await User.countDocuments({ systemRole: 'admin' })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin' },
          { status: 400 }
        )
      }
    }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.systemRole !== undefined) updateData.systemRole = parsed.data.systemRole
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive
  if (parsed.data.teamId !== undefined) updateData.teamId = parsed.data.teamId

  const updated = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
    .select('-hashedPassword')
    .lean()

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: updated._id.toString(),
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
      systemRole: updated.systemRole ?? 'user',
      isActive: updated.isActive ?? true,
      teamId: updated.teamId?.toString() ?? null,
    },
  })
}
