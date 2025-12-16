import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for Firebase Authentication
 * Handles session verification and protected routes
 * Note: Firebase Admin SDK doesn't work in Edge Runtime, so we just check cookie existence
 * Actual verification happens in server components/actions
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  // Protected routes - redirect to auth if not authenticated
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/app');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  // Simple cookie existence check (actual verification in server actions)
  const hasSession = !!sessionCookie;

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth page
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
