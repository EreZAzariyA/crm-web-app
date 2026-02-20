import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { signToken } from '@/lib/auth/jwt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error || 'oauth_cancelled')}`, req.url)
    )
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const { access_token } = await tokenRes.json()

    // Fetch user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      throw new Error('Failed to fetch Google profile')
    }

    const profile = await profileRes.json()
    const { id: oauthId, email, given_name: firstName, family_name: lastName, picture: avatar } = profile

    if (!email) {
      throw new Error('No email returned from Google')
    }

    await connectDB()

    // Upsert: find by OAuth ID or email, update/create
    let user = await User.findOne({ $or: [{ oauthId, oauthProvider: 'google' }, { email }] })

    if (user) {
      // Link Google to existing account if not already linked
      if (!user.oauthId) {
        user.oauthProvider = 'google'
        user.oauthId = oauthId
      }
      if (!user.firstName && firstName) user.firstName = firstName
      if (!user.lastName && lastName) user.lastName = lastName
      if (!user.avatar && avatar) user.avatar = avatar
      await user.save()
    } else {
      user = await User.create({
        email,
        hashedPassword: null,
        oauthProvider: 'google',
        oauthId,
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        avatar: avatar ?? null,
      })
    }

    const token = await signToken({ userId: user._id.toString(), email: user.email })

    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', req.url)
    )
  }
}
