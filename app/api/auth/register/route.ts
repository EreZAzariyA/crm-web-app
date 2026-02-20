import { NextResponse } from 'next/server'

// Registration is invite-only — use /api/admin/invites to generate an invite link
export async function POST() {
  return NextResponse.json(
    { error: 'Registration is by invitation only. Contact your admin for an invite link.' },
    { status: 403 }
  )
}
