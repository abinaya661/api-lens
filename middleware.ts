import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { getSafeRedirect } from './lib/utils/safe-redirect';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/estimator',
  '/api/estimator',
  '/api/webhooks',
  '/api/cron',
  '/api/health',
  '/privacy',
  '/terms',
  '/security',
  '/blog',
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Detect geo country for region-specific pricing display.
  // Vercel provides x-vercel-ip-country, Cloudflare provides cf-ipcountry.
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null;

  const needsGeoCookie = !!country && (!request.cookies.get('geo_country') || request.cookies.get('geo_country')?.value !== country);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // Re-apply geo_country whenever setAll creates a new response object
          if (needsGeoCookie) {
            supabaseResponse.cookies.set('geo_country', country!, {
              httpOnly: false, // readable by client JS
              sameSite: 'lax',
              maxAge: 86400, // 1 day
              path: '/',
            });
          }
        },
      },
    },
  );

  // Set geo cookie on the initial response (covers requests where setAll is never called)
  if (needsGeoCookie) {
    supabaseResponse.cookies.set('geo_country', country!, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });
  }

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone();
      // Honour the redirect param so users land where they intended
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const safePath = getSafeRedirect(redirectTo);
      url.pathname = safePath !== '/' ? safePath : '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Add security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
