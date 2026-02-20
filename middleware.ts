import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/invite',
  '/login',
  '/register',
  '/invite',
]

function isPublicPath(pathname: string) {
  // Check if it's a public path directly
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  
  // Check if it's a locale-prefixed public path (e.g. /en/login)
  const localePrefixes = ['/en', '/he'];
  for (const prefix of localePrefixes) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(`${prefix}${p}`))) return true;
  }
  
  return false;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Handle API routes - Bypass intl to prevent redirects to /en/api/...
  const isApi = pathname.startsWith('/api/')
  
  // Redirect localized API calls (e.g. /en/api/...) to root API
  const localizedApiMatch = pathname.match(/^\/(en|he)(\/api\/.*)/)
  if (localizedApiMatch) {
    return NextResponse.redirect(new URL(localizedApiMatch[2], req.url))
  }

  // 2. Handle I18n for non-API routes
  let response: NextResponse;
  if (isApi) {
    response = NextResponse.next();
  } else {
    response = intlMiddleware(req);
    // If intlMiddleware is redirecting (e.g. adding default locale), return it
    if (response.headers.get('x-next-intl-redirect')) {
      return response;
    }
  }

  // 3. Allow public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // 4. Auth logic
  const token = req.cookies.get('token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const payload = await verifyToken(token)

    // Admin-only route protection
    const isAdminRoute = pathname.startsWith('/admin') || 
                        pathname.startsWith('/he/admin') || 
                        pathname.startsWith('/en/admin') || 
                        pathname.startsWith('/api/admin')
    
    if (isAdminRoute && payload.systemRole !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Set headers to pass identity to route handlers
    // For API routes, we must set them on the request headers
    if (isApi) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-system-role', payload.systemRole ?? 'user')
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // For UI routes, set on the response from intlMiddleware
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-system-role', payload.systemRole ?? 'user')
    return response
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
    '/api/admin/:path*',
    '/api/auth/me',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
}
