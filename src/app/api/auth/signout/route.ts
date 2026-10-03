import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const supabase = createRouteClient(request, { response });

  await supabase.auth.signOut();

  // Additionally clear all Supabase auth cookies on the response
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-') || name.includes('supabase')) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
      });
    }
  });

  return response;
}
