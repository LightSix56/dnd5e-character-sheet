import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Короткий код без похожих символов (0/O, 1/I/l), чтобы его можно было продиктовать.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

function createClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

// Создать публичную ссылку на снимок персонажа. Только для владельца.
export async function POST(request: NextRequest) {
  const supabase = createClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, name, data, expiresInDays } = body as {
    id?: string;
    name?: string;
    data?: unknown;
    expiresInDays?: number;
  };

  // Снимок берём из тела запроса, либо из сохранённого персонажа по id.
  let snapshot = data;
  let snapshotName = name;

  if (!snapshot && id) {
    const { data: character, error } = await supabase
      .from('characters')
      .select('name, data')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });

    snapshot = character.data;
    snapshotName = snapshotName || character.name;
  }

  if (!snapshot || typeof snapshot !== 'object') {
    return NextResponse.json({ error: 'Нужны данные персонажа (data) или его id' }, { status: 400 });
  }

  const days = Number.isFinite(expiresInDays) ? Number(expiresInDays) : 30;
  const expiresAt =
    days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null;

  // Код генерируется случайно; при коллизии первичного ключа пробуем ещё раз.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data: inserted, error } = await supabase
      .from('character_shares')
      .insert({
        code,
        user_id: user.id,
        character_id: id ?? null,
        name: snapshotName || 'Безымянный',
        data: snapshot,
        expires_at: expiresAt,
      })
      .select('code, name, created_at, expires_at')
      .maybeSingle();

    if (!error && inserted) {
      const origin = request.nextUrl.origin;
      return NextResponse.json({
        share: inserted,
        code: inserted.code,
        url: `${origin}/api/share/${inserted.code}`,
      });
    }
    // 23505 — duplicate key: генерируем новый код и пробуем снова.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Не удалось сгенерировать код, попробуйте ещё раз' }, { status: 500 });
}

// Список своих ссылок.
export async function GET(request: NextRequest) {
  const supabase = createClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('character_shares')
    .select('code, name, character_id, created_at, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shares: data });
}

// Отозвать ссылку.
export async function DELETE(request: NextRequest) {
  const supabase = createClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json().catch(() => ({ code: undefined }));
  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  const { error } = await supabase
    .from('character_shares')
    .delete()
    .eq('code', code)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
