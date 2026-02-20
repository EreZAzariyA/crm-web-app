import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

// ─── GET /api/admin/users — list all users ────────────────────────────────────

export async function GET(req: NextRequest) {
  const systemRole = req.headers.get('x-user-system-role')
  if (systemRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const users = await User.find({}).select('-hashedPassword').sort({ createdAt: 1 }).lean()

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,                         // job title
      systemRole: u.systemRole ?? 'user',
      isActive: u.isActive ?? true,
      teamId: u.teamId?.toString() ?? null,
      createdAt: u.createdAt,
    })),
  })
}

// POST is intentionally not implemented here.
// User creation is invite-only — use POST /api/admin/invites to generate an invite link.
