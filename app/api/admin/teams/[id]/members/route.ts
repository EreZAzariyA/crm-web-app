import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Team, { ITeamMember } from '@/lib/models/Team'
import User from '@/lib/models/User'

type Params = { params: Promise<{ id: string }> }

// ─── POST /api/admin/teams/[id]/members — add member ──────────────────────

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['lead', 'member']).default('member'),
})

export async function POST(req: NextRequest, { params }: Params) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = addMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { userId, role } = parsed.data
  await connectDB()

  const team = await Team.findById(id)
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const user = await User.findById(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Remove from any existing team first
  if (user.teamId && user.teamId.toString() !== id) {
    await Team.findByIdAndUpdate(user.teamId, {
      $pull: { members: { userId } },
    })
  }

  // Add to this team (avoid duplicates)
  const alreadyMember = (team.members as ITeamMember[]).some((m) => m.userId.toString() === userId)
  if (!alreadyMember) {
    team.members.push({ userId: user._id, role })
    await team.save()
  } else {
    // Update role if already member
    await Team.updateOne(
      { _id: id, 'members.userId': userId },
      { $set: { 'members.$.role': role } }
    )
  }

  // Set teamId on user
  user.teamId = team._id
  await user.save()

  return NextResponse.json({
    member: {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar ?? null,
      role,
    },
  })
}

// ─── DELETE /api/admin/teams/[id]/members — remove member ─────────────────

const removeMemberSchema = z.object({
  userId: z.string().min(1),
})

export async function DELETE(req: NextRequest, { params }: Params) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = removeMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { userId } = parsed.data
  await connectDB()

  const team = await Team.findByIdAndUpdate(id, {
    $pull: { members: { userId } },
  })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Clear teamId from user
  await User.findByIdAndUpdate(userId, { teamId: null })

  return NextResponse.json({ success: true })
}
