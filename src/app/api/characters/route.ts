import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('characters')
    .select('id, name, data, portrait_url, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ characters: data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, name, data, portrait_url } = body;

  // If ID provided — try to UPDATE existing character first
  if (id) {
    const { data: updated, error: updateError } = await supabase
      .from('characters')
      .update({ name: name || 'Безымянный', data, portrait_url, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, portrait_url, created_at, updated_at')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (updated) {
      return NextResponse.json({ character: updated });
    }
    // If character with this id does not exist, fall through to insert
  }

  // No ID or not found — INSERT new character
  const { data: inserted, error: insertError } = await supabase
    .from('characters')
    .insert({ user_id: user.id, name: name || 'Безымянный', data, portrait_url })
    .select('id, name, portrait_url, created_at, updated_at')
    .maybeSingle();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  if (!inserted) return NextResponse.json({ error: 'Failed to save character' }, { status: 500 });
  return NextResponse.json({ character: inserted });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, name, data, portrait_url } = body;

  if (!id) return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });

  const { data: character, error } = await supabase
    .from('characters')
    .update({ name: name || 'Безымянный', data, portrait_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, portrait_url, created_at, updated_at')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  return NextResponse.json({ character });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
