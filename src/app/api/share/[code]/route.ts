import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createExampleWarrior } from '@/lib/dnd-types';
import { getLocalShareStore } from '@/lib/share-store';
import { enforceRateLimit } from '@/lib/request-guards';

const PUBLIC_HEADERS = {
  // Снимок неизменяем, но ссылку можно отозвать — кэшируем ненадолго.
  'Cache-Control': 'public, max-age=60',
  'Access-Control-Allow-Origin': '*',
};

const NOT_FOUND = { error: 'Ссылка не найдена или истекла' };

interface ShareRow {
  code: string;
  name: string;
  data: unknown;
  created_at: string;
  expires_at: string | null;
}

// Публичное чтение снимка персонажа по коду — авторизация не требуется,
// код и есть секрет. Используется внешними приложениями (AI Dungeon Master).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Ограничиваем перебор кодов с одного адреса.
  const limited = enforceRateLimit(request, 'share-read', 120, 60_000);
  if (limited) return limited;

  const { code } = await params;

  if (!code || !/^[A-Za-z0-9_-]{4,64}$/.test(code)) {
    return NextResponse.json({ error: 'Некорректный код' }, { status: 400 });
  }

  // Demo fallback for visual testing and local preview without DB
  if (code.toUpperCase() === 'DEMO1234' || code.toUpperCase() === 'DEMO') {
    const demoChar = createExampleWarrior();
    return NextResponse.json(
      {
        character: {
          code,
          name: demoChar.name,
          data: demoChar,
          created_at: new Date().toISOString(),
        },
      },
      { headers: PUBLIC_HEADERS }
    );
  }

  // Check in-memory store for local / demo shares
  const localRecord = getLocalShareStore().get(code);
  if (localRecord) {
    if (localRecord.expires_at && new Date(localRecord.expires_at) < new Date()) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }
    return NextResponse.json({ character: localRecord }, { headers: PUBLIC_HEADERS });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }

  const supabase = createRouteClient(request, { anonymous: true });

  // Читаем через SECURITY DEFINER-функцию: таблица закрыта для анонимного SELECT,
  // так что получить снимок можно только зная код, а не выгрузив всю таблицу.
  let row: ShareRow | null = null;
  const rpc = await supabase.rpc('get_character_share', { p_code: code });

  if (!rpc.error) {
    const rows = rpc.data as ShareRow[] | ShareRow | null;
    row = Array.isArray(rows) ? rows[0] ?? null : rows;
  } else if (rpc.error.code === 'PGRST202' || rpc.error.code === '42883') {
    // Функции ещё нет — миграция supabase-security-migration.sql не применена.
    // Работаем по старой схеме, чтобы ссылки не сломались до её запуска.
    const legacy = await supabase
      .from('character_shares')
      .select('code, name, data, created_at, expires_at')
      .eq('code', code)
      .maybeSingle();
    if (legacy.error) return NextResponse.json({ error: legacy.error.message }, { status: 500 });
    row = legacy.data as ShareRow | null;
  } else {
    return NextResponse.json({ error: rpc.error.message }, { status: 500 });
  }

  if (!row || (row.expires_at && new Date(row.expires_at) < new Date())) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }

  return NextResponse.json(
    {
      character: {
        code: row.code,
        name: row.name,
        data: row.data,
        created_at: row.created_at,
        expires_at: row.expires_at,
      },
    },
    { headers: PUBLIC_HEADERS }
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
