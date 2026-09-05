import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Публичное чтение снимка персонажа по коду — авторизация не требуется,
// код и есть секрет. Используется внешними приложениями (AI Dungeon Master).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || !/^[A-Za-z0-9_-]{4,64}$/.test(code)) {
    return NextResponse.json({ error: 'Некорректный код' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase
    .from('character_shares')
    .select('code, name, data, created_at, expires_at')
    .eq('code', code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || (data.expires_at && new Date(data.expires_at) < new Date())) {
    return NextResponse.json({ error: 'Ссылка не найдена или истекла' }, { status: 404 });
  }

  return NextResponse.json(
    {
      character: {
        code: data.code,
        name: data.name,
        data: data.data,
        created_at: data.created_at,
        expires_at: data.expires_at,
      },
    },
    {
      headers: {
        // Снимок неизменяем, но ссылку можно отозвать — кэшируем ненадолго.
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
