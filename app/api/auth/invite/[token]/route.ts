import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Invite from '@/lib/models/Invite'
import User from '@/lib/models/User'
import Team from '@/lib/models/Team'
import { signToken } from '@/lib/auth/jwt'

type Params = { params: Promise<{ token: string }> }

// ─── GET /api/auth/invite/[token] — validate token (public) ───────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params

  await connectDB()

  const invite = await Invite.findOne({ token }).lean()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or invalid' }, { status: 404 })
  }

  if (invite.usedAt) {
    return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  return NextResponse.json({
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    systemRole: invite.systemRole,
  })
}

// ─── POST /api/auth/invite/[token] — complete registration (public) ────────

const acceptSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params

  const body = await req.json()
  const parsed = acceptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { password } = parsed.data

  await connectDB()

  const invite = await Invite.findOne({ token })
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or invalid' }, { status: 404 })
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 })
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
  }

  // Check no existing user
  const existing = await User.findOne({ email: invite.email })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    email: invite.email,
    hashedPassword,
    firstName: invite.firstName,
    lastName: invite.lastName,
    systemRole: invite.systemRole,
    teamId: invite.teamId ?? null,
    isActive: true,
  })

  // If invite has a team, add user to team members
  if (invite.teamId) {
    await Team.findByIdAndUpdate(invite.teamId, {
      $push: { members: { userId: user._id, role: 'member' } },
    })
  }

  // Mark invite as used
  invite.usedAt = new Date()
  await invite.save()

  // Sign JWT and set cookie
  const jwtToken = await signToken({
    userId: user._id.toString(),
    email: user.email,
    systemRole: user.systemRole,
  })

  const res = NextResponse.json(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        teamId: user.teamId?.toString() ?? null,
        phone: '',
        company: '',
        role: '',
        location: '',
        bio: '',
        notifications: user.notifications,
        appearance: user.appearance,
      },
    },
    { status: 201 }
  )

  res.cookies.set('token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return res
}
