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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const { access_token, error: tokenError } = await tokenRes.json()
    if (tokenError || !access_token) {
      throw new Error(tokenError || 'No access token returned')
    }

    // Fetch user profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!profileRes.ok) {
      throw new Error('Failed to fetch GitHub profile')
    }

    const profile = await profileRes.json()

    // GitHub may not return email in profile — fetch it separately
    let email = profile.email as string | null

    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (emailRes.ok) {
        const emails: { email: string; primary: boolean; verified: boolean }[] = await emailRes.json()
        const primary = emails.find((e) => e.primary && e.verified)
        email = primary?.email ?? emails.find((e) => e.verified)?.email ?? null
      }
    }

    if (!email) {
      throw new Error('No verified email found on GitHub account')
    }

    const oauthId = String(profile.id)
    const nameParts = (profile.name ?? '').split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ') ?? ''
    const avatar = profile.avatar_url ?? null

    await connectDB()

    let user = await User.findOne({ $or: [{ oauthId, oauthProvider: 'github' }, { email }] })

    if (user) {
      if (!user.oauthId) {
        user.oauthProvider = 'github'
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
        oauthProvider: 'github',
        oauthId,
        firstName,
        lastName,
        avatar,
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
    console.error('GitHub OAuth error:', err)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', req.url)
    )
  }
}
