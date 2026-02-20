import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { connectDB } from '@/lib/db/mongodb'
import Invite from '@/lib/models/Invite'
import User from '@/lib/models/User'
import Team from '@/lib/models/Team'

// ─── GET /api/admin/invites — list all invites ─────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const invites = await Invite.find({}).sort({ createdAt: -1 }).lean()

  const now = new Date()

  return NextResponse.json({
    invites: invites.map((inv) => ({
      token: inv.token,
      email: inv.email,
      firstName: inv.firstName,
      lastName: inv.lastName,
      systemRole: inv.systemRole,
      teamId: inv.teamId?.toString() ?? null,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt ?? null,
      createdAt: inv.createdAt,
      status: inv.usedAt
        ? 'used'
        : inv.expiresAt < now
          ? 'expired'
          : 'pending',
    })),
  })
}

// ─── POST /api/admin/invites — create invite ───────────────────────────────

const createInviteSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().default(''),
  systemRole: z.enum(['admin', 'manager', 'user']).default('user'),
  teamId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invitedBy = req.headers.get('x-user-id')
  if (!invitedBy) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createInviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, firstName, lastName, systemRole, teamId } = parsed.data

  await connectDB()

  // Check no existing user
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  // Validate teamId if provided
  if (teamId) {
    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }
  }

  // Delete any previous unused invite for this email
  await Invite.deleteMany({ email: email.toLowerCase(), usedAt: null })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await Invite.create({
    token,
    email: email.toLowerCase(),
    firstName,
    lastName,
    systemRole,
    teamId: teamId ?? null,
    invitedBy,
    expiresAt,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const inviteUrl = `${appUrl}/invite/${token}`

  return NextResponse.json(
    {
      inviteUrl,
      invite: {
        token: invite.token,
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        systemRole: invite.systemRole,
        teamId: invite.teamId?.toString() ?? null,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        status: 'pending',
      },
    },
    { status: 201 }
  )
}
