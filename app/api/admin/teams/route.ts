import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Team, { ITeamMember } from '@/lib/models/Team'
import User from '@/lib/models/User'

// ─── GET /api/admin/teams ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const teams = await Team.find({})
    .populate('members.userId', 'firstName lastName email avatar')
    .lean()

  return NextResponse.json({
    teams: teams.map((t) => {
      const members = (t.members as ITeamMember[]).map((m) => {
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
      const lead = members.find((m) => m.role === 'lead')
      return {
        id: t._id.toString(),
        name: t.name,
        description: t.description,
        memberCount: members.length,
        lead: lead ? `${lead.firstName} ${lead.lastName}`.trim() : null,
        members,
        createdAt: t.createdAt,
      }
    }),
  })
}

// ─── POST /api/admin/teams ─────────────────────────────────────────────────

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').trim(),
  description: z.string().default(''),
  memberIds: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const createdBy = req.headers.get('x-user-id')
  if (!createdBy) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { name, description, memberIds } = parsed.data

  await connectDB()

  const members = memberIds.map((uid) => ({ userId: uid, role: 'member' as const }))
  const team = await Team.create({ name, description, members, createdBy })

  // Set teamId on each member
  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { teamId: team._id })
  }

  return NextResponse.json(
    {
      team: {
        id: team._id.toString(),
        name: team.name,
        description: team.description,
        memberCount: team.members.length,
        members: memberIds.map((uid) => ({ userId: uid, role: 'member' })),
        createdAt: team.createdAt,
      },
    },
    { status: 201 }
  )
}
