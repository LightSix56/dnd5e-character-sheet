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

import { getLocalShareStore } from '@/lib/share-store';

// Создать публичную ссылку на снимок персонажа.
// Поддерживает как авторизованных пользователей, так и гостей (анонимные ссылки).
export async function POST(request: NextRequest) {
  const supabase = createClient(request);
  let user: any = null;
  try {
    const authRes = await supabase.auth.getUser();
    user = authRes.data?.user || null;
  } catch {
    // Supabase unreachable or offline
  }

  const body = await request.json().catch(() => ({}));
  const { id, name, data, portrait_url, portraitUrl, expiresInDays } = body as {
    id?: string;
    name?: string;
    data?: Record<string, unknown>;
    portrait_url?: string;
    portraitUrl?: string;
    expiresInDays?: number;
  };

  // Снимок берём из тела запроса, либо из сохранённого персонажа по id.
  let snapshot: unknown = data;
  let snapshotName = name;
  const attachedPortrait = portraitUrl || portrait_url;

  if (!snapshot && id && user) {
    try {
      const { data: character, error } = await supabase
        .from('characters')
        .select('name, data, portrait_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && character) {
        snapshot = character.data;
        snapshotName = snapshotName || character.name;
        if (snapshot && typeof snapshot === 'object' && character.portrait_url && !(snapshot as Record<string, unknown>).portraitUrl) {
          (snapshot as Record<string, unknown>).portraitUrl = character.portrait_url;
        }
      }
    } catch {
      // Supabase query error fallback
    }
  }

  if (!snapshot || typeof snapshot !== 'object') {
    return NextResponse.json({ error: 'Нужны данные персонажа (data) или его id' }, { status: 400 });
  }

  if (attachedPortrait && typeof snapshot === 'object' && !(snapshot as Record<string, unknown>).portraitUrl) {
    (snapshot as Record<string, unknown>).portraitUrl = attachedPortrait;
  }

  const days = Number.isFinite(expiresInDays) ? Number(expiresInDays) : 30;
  const expiresAt =
    days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null;

  // Попытка записать в Supabase (если подключена база)
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode();

      const insertRecord: Record<string, unknown> = {
        code,
        character_id: (user && id) ? id : null,
        name: snapshotName || 'Безымянный',
        data: snapshot,
        expires_at: expiresAt,
      };

      if (user) {
        insertRecord.user_id = user.id;
      }

      const { data: inserted, error } = await supabase
        .from('character_shares')
        .insert(insertRecord)
        .select('code, name, created_at, expires_at')
        .maybeSingle();

      if (!error && inserted) {
        const origin = request.nextUrl.origin;
        return NextResponse.json({
          share: inserted,
          code: inserted.code,
          url: `${origin}/share/${inserted.code}`,
          apiUrl: `${origin}/api/share/${inserted.code}`,
        });
      }

      if (error && (error.code === '23502' || error.code === '42501' || error.message?.includes('user_id')) && !user) {
        break;
      }

      if (error && error.code !== '23505') {
        break;
      }
    }
  } catch {
    // Supabase network / connection issue — fallback to local in-memory store
  }

  // Локальное резервное хранилище (для работы офлайн, в разработке и без настроенного Supabase)
  const fallbackCode = generateCode();
  const origin = request.nextUrl.origin;
  const store = getLocalShareStore();
  const fallbackRecord = {
    code: fallbackCode,
    name: snapshotName || 'Безымянный',
    character_id: (user && id) ? id : null,
    data: snapshot,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  };
  store.set(fallbackCode, fallbackRecord);

  return NextResponse.json({
    share: fallbackRecord,
    code: fallbackCode,
    url: `${origin}/share/${fallbackCode}`,
    apiUrl: `${origin}/api/share/${fallbackCode}`,
    isLocalFallback: true,
  });
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
