import { createRouteClient } from '@/lib/supabase/route';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/';
  // Enforce safe relative path to prevent Open Redirect vulnerabilities (CWE-601, SonarQube S5146)
  const isSafeRelative =
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.startsWith('/\\') &&
    !rawNext.includes('\\') &&
    !rawNext.includes('://');
  const safeNext = isSafeRelative ? rawNext : '/';

  if (code) {
    // Create response early so setAll can attach cookies to it
    const response = NextResponse.redirect(`${origin}${safeNext}`);
    const supabase = createRouteClient(request, { response });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  // Fallback — redirect to home
  return NextResponse.redirect(`${origin}`);
}
