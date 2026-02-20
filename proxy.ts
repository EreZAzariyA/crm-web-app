import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const PUBLIC_PATHS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/github',
  '/login',
  '/register',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value

  if (!token) {
    // Redirect page requests to login; return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const payload = await verifyToken(token)
    const res = NextResponse.next()
    res.headers.set('x-user-id', payload.userId)
    return res
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/api/contacts/:path*',
    '/api/deals/:path*',
    '/api/activities/:path*',
    '/api/users/:path*',
    '/api/auth/me',
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
}
