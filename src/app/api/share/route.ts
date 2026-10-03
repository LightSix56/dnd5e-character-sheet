import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { putLocalShare } from '@/lib/share-store';
import { enforceRateLimit, readJsonBody } from '@/lib/request-guards';

// Короткий код без похожих символов (0/O, 1/I/l), чтобы его можно было продиктовать.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_REGEX = /^[A-Za-z0-9_-]{4,64}$/;

// Снимок может содержать портрет в виде data-URL (до ~700 КБ), поэтому лимит с запасом.
const MAX_SHARE_BODY_BYTES = 2 * 1024 * 1024;
const DEFAULT_EXPIRES_DAYS = 30;
const MAX_EXPIRES_DAYS = 365;
const MAX_NAME_LENGTH = 200;

function generateCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

/** Срок жизни ссылки: всегда конечный, от 1 до 365 дней. Бессрочных ссылок нет. */
function resolveExpiresDays(raw: unknown): number {
  const days = typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : DEFAULT_EXPIRES_DAYS;
  if (days < 1) return DEFAULT_EXPIRES_DAYS;
  return Math.min(days, MAX_EXPIRES_DAYS);
}

function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_NAME_LENGTH);
}

// Создать публичную ссылку на снимок персонажа.
// Поддерживает как авторизованных пользователей, так и гостей (анонимные ссылки).
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'share-create', 20, 10 * 60_000);
  if (limited) return limited;

  const parsed = await readJsonBody(request, MAX_SHARE_BODY_BYTES);
  if (!parsed.ok) return parsed.response;
  if (!parsed.body || typeof parsed.body !== 'object') {
    return NextResponse.json({ error: 'Некорректное тело запроса (ожидался JSON)' }, { status: 400 });
  }

  const { id, name, data, portrait_url, portraitUrl, expiresInDays } = parsed.body as {
    id?: unknown;
    name?: unknown;
    data?: unknown;
    portrait_url?: unknown;
    portraitUrl?: unknown;
    expiresInDays?: unknown;
  };

  const supabaseReady = isSupabaseConfigured();
  const supabase = createRouteClient(request);
  let user: { id: string } | null = null;
  if (supabaseReady) {
    try {
      const authRes = await supabase.auth.getUser();
      user = authRes.data?.user || null;
    } catch {
      // Supabase unreachable or offline
    }
  }

  // Снимок берём из тела запроса, либо из сохранённого персонажа по id.
  let snapshot: unknown = data;
  let snapshotName = sanitizeName(name);
  const characterId = typeof id === 'string' && id ? id : null;
  const attachedPortrait =
    typeof portraitUrl === 'string' ? portraitUrl : typeof portrait_url === 'string' ? portrait_url : null;

  if (!snapshot && characterId && user) {
    try {
      const { data: character, error } = await supabase
        .from('characters')
        .select('name, data, portrait_url')
        .eq('id', characterId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && character) {
        snapshot = character.data;
        snapshotName = snapshotName || sanitizeName(character.name);
        if (snapshot && typeof snapshot === 'object' && character.portrait_url && !(snapshot as Record<string, unknown>).portraitUrl) {
          (snapshot as Record<string, unknown>).portraitUrl = character.portrait_url;
        }
      }
    } catch {
      // Supabase query error fallback
    }
  }

  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return NextResponse.json({ error: 'Нужны данные персонажа (data) или его id' }, { status: 400 });
  }

  if (attachedPortrait && !(snapshot as Record<string, unknown>).portraitUrl) {
    (snapshot as Record<string, unknown>).portraitUrl = attachedPortrait;
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + resolveExpiresDays(expiresInDays) * 86_400_000).toISOString();
  const shareName = snapshotName || 'Безымянный';
  const origin = request.nextUrl.origin;

  // Попытка записать в Supabase (если подключена база)
  if (supabaseReady) {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const code = generateCode();

        const insertRecord: Record<string, unknown> = {
          code,
          character_id: user && characterId ? characterId : null,
          name: shareName,
          data: snapshot,
          expires_at: expiresAt,
        };
        if (user) insertRecord.user_id = user.id;

        // Без .select(): читать чужие и анонимные строки RLS не разрешает,
        // а всё, что нужно для ответа, мы и так знаем.
        const { error } = await supabase.from('character_shares').insert(insertRecord);

        if (!error) {
          return NextResponse.json({
            share: { code, name: shareName, created_at: createdAt, expires_at: expiresAt },
            code,
            url: `${origin}/share/${code}`,
            apiUrl: `${origin}/api/share/${code}`,
          });
        }

        // 23505 — коллизия кода, пробуем ещё раз; любая другая ошибка — уходим в резервное хранилище.
        if (error.code !== '23505') break;
      }
    } catch {
      // Supabase network / connection issue — fallback to local in-memory store
    }
  }

  // Локальное резервное хранилище (для работы офлайн, в разработке и без настроенного Supabase)
  const fallbackCode = generateCode();
  const fallbackRecord = {
    code: fallbackCode,
    name: shareName,
    character_id: user && characterId ? characterId : null,
    data: snapshot,
    created_at: createdAt,
    expires_at: expiresAt,
  };
  putLocalShare(fallbackRecord);

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
  const supabase = createRouteClient(request);

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
  const supabase = createRouteClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json().catch(() => ({ code: undefined }));
  if (typeof code !== 'string' || !CODE_REGEX.test(code)) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('character_shares')
    .delete()
    .eq('code', code)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
