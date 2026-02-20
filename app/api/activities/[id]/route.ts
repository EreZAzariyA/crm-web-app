import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Activity from '@/lib/models/Activity'
import User from '@/lib/models/User'
import { getScopeFilter } from '@/lib/utils/api-utils'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const activity = await Activity.findOneAndUpdate(
      { _id: id, ...scopeFilter },
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.title,
      contact: activity.contact,
      time: activity.time,
      description: activity.description,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id')
    const systemRole = req.headers.get('x-user-system-role')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const scopeFilter = await getScopeFilter(userId, systemRole)
    const activity = await Activity.findOneAndDelete({ _id: id, ...scopeFilter })
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
