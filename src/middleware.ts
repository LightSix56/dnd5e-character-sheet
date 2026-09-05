import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon-*.png, apple-touch-icon.png, android-chrome-*.png
     * - book-bg.png, logo.svg, robots.txt
     * - api/ (API routes handle their own auth to avoid double roundtrip latency)
     */
    '/((?!_next/static|_next/image|api/|favicon|apple-touch-icon|android-chrome|book-bg\\.(?:png|webp)|logo\\.svg|robots\\.txt|sitemap|yandex).*)',
  ],
};

