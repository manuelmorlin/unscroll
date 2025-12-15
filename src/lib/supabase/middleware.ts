import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Supabase Client
 * Handles session refresh and protected routes
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to auth if not authenticated
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/app');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth page
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
