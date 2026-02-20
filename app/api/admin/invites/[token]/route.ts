import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Invite from '@/lib/models/Invite'

// ─── DELETE /api/admin/invites/[token] — revoke invite ─────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  if (req.headers.get('x-user-system-role') !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { token } = await params

  await connectDB()

  const invite = await Invite.findOneAndDelete({ token })
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
