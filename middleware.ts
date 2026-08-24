import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// Routes that require authentication
const PROTECTED_ROUTES = ['/social-media-onboarding', '/api/social-media-onboarding'];

function getDb() {
  if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
    throw new Error('Database not configured');
  }
  return createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route needs protection
  const needsAuth = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('user_session');

  if (!sessionCookie) {
    // Redirect to login if accessing protected route without session
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);

    if (sessionData.expiresAt < Date.now()) {
      // Session expired
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check if email is verified for onboarding access
    if (pathname.startsWith('/social-media-onboarding')) {
      try {
        const db = getDb();
        const userResult = await db.execute({
          sql: 'SELECT email_verified FROM users WHERE id = ?',
          args: [sessionData.userId],
        });

        if (userResult.rows.length > 0 && !(userResult.rows[0] as any).email_verified) {
          return NextResponse.redirect(new URL('/auth/verify', request.url));
        }
      } catch (dbError) {
        console.error('DB check error:', dbError);
        // Allow access if DB check fails
      }
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: ['/social-media-onboarding/:path*', '/api/social-media-onboarding/:path*'],
};
