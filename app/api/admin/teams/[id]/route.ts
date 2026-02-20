import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Team, { ITeamMember } from '@/lib/models/Team'
import User from '@/lib/models/User'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/admin/teams/[id] ─────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await connectDB()

  const team = await Team.findById(id)
    .populate('members.userId', 'firstName lastName email avatar')
    .lean()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const members = (team.members as ITeamMember[]).map((m) => {
    const u = m.userId as unknown as { _id: { toString(): string }; firstName: string; lastName: string; email: string; avatar?: string }
    return {
      userId: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatar: u.avatar ?? null,
      role: m.role,
    }
  })

  return NextResponse.json({
    team: {
      id: team._id.toString(),
      name: team.name,
      description: team.description,
      memberCount: members.length,
      members,
      createdAt: team.createdAt,
    },
  })
}

// ─── PUT /api/admin/teams/[id] ─────────────────────────────────────────────

const updateTeamSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectDB()

  const team = await Team.findByIdAndUpdate(id, parsed.data, { new: true })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json({
    team: { id: team._id.toString(), name: team.name, description: team.description },
  })
}

// ─── DELETE /api/admin/teams/[id] ──────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await connectDB()

  const team = await Team.findById(id)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Clear teamId from all members
  const memberIds = (team.members as ITeamMember[]).map((m) => m.userId)
  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { teamId: null })
  }

  await Team.findByIdAndDelete(id)

  return NextResponse.json({ success: true })
}
