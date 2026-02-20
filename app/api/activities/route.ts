import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import Activity from '@/lib/models/Activity'
import User from '@/lib/models/User'
import { getScopeFilter } from '@/lib/utils/api-utils'

const createActivitySchema = z.object({
  type: z.enum(['email', 'call', 'meeting', 'note']),
  title: z.string().min(1),
  contact: z.string().optional().default(''),
  description: z.string().optional().default(''),
})

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const activities = await Activity.find(scopeFilter).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      activities.map((a) => ({
        id: a._id.toString(),
        type: a.type,
        title: a.title,
        contact: a.contact,
        time: timeAgo(new Date(a.createdAt as Date)),
        description: a.description,
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
    const parsed = createActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(userId).select('teamId').lean()
    const teamId = user?.teamId ?? null

    const activity = await Activity.create({ userId, teamId, ...parsed.data })

    return NextResponse.json(
      {
        id: activity._id.toString(),
        type: activity.type,
        title: activity.title,
        contact: activity.contact,
        time: 'Just now',
        description: activity.description,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
