import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient, getAuthenticatedUser } from '@/lib/supabase/route';
import { utf8ByteLength } from '@/lib/request-guards';
import { validateCharacterName, isNamelessCharacter } from '@/lib/character-validation';

const MAX_CHARACTER_BYTES = 5 * 1024 * 1024;

function createClient(request: NextRequest) {
  return createRouteClient(request, { forwardAuth: true });
}

export async function GET(request: NextRequest) {
  const supabase = createClient(request);
  const { user, error: authError } = await getAuthenticatedUser(supabase, request);
  if (!user) return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });

  // Безымянные черновики не удаляем: чтение списка не должно менять данные.
  // Они не попадают в облако (POST/PUT их отклоняют) и просто отфильтровываются ниже.
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, data, portrait_url, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[API Characters GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const validCharacters = (data || []).filter(c => !isNamelessCharacter(c.name));
  return NextResponse.json({ characters: validCharacters });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function POST(request: NextRequest) {
  const supabase = createClient(request);
  const { user, error: authError } = await getAuthenticatedUser(supabase, request);
  if (!user) return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Некорректное тело запроса (ожидался JSON)' }, { status: 400 });
  }

  const { id, name, data, portrait_url } = body as {
    id?: unknown;
    name?: unknown;
    data?: unknown;
    portrait_url?: unknown;
  };

  // Validate ID format if supplied
  if (id !== undefined && id !== null && !isValidUUID(id)) {
    return NextResponse.json({ error: 'Некорректный формат ID' }, { status: 400 });
  }

  // Validate payload size and type
  if (data !== undefined && data !== null) {
    if (typeof data !== 'object') {
      return NextResponse.json({ error: 'Данные персонажа должны быть объектом' }, { status: 400 });
    }
    const serialized = JSON.stringify(data);
    if (utf8ByteLength(serialized) > MAX_CHARACTER_BYTES) {
      return NextResponse.json({ error: 'Данные персонажа превышают лимит 5 МБ' }, { status: 400 });
    }
  }

  const nameValidation = validateCharacterName(name);
  if (!nameValidation.isValid) {
    return NextResponse.json({ error: nameValidation.error }, { status: 400 });
  }
  const safeName = nameValidation.safeName!;

  if (data && typeof data === 'object' && 'name' in (data as any)) {
    const dataNameValidation = validateCharacterName((data as any).name);
    if (!dataNameValidation.isValid) {
      return NextResponse.json({ error: dataNameValidation.error }, { status: 400 });
    }
  }

  const safePortraitUrl = typeof portrait_url === 'string' && portrait_url.length <= 2048 ? portrait_url : (portrait_url === null ? null : undefined);

  // If ID provided — try to UPDATE existing character first
  if (id) {
    const { data: updated, error: updateError } = await supabase
      .from('characters')
      .update({ name: safeName, data: data || {}, portrait_url: safePortraitUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, portrait_url, created_at, updated_at')
      .maybeSingle();

    if (updateError) {
      console.error('[API Characters POST update] Error:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (updated) {
      return NextResponse.json({ character: updated });
    }
    // If character with this id does not exist, fall through to insert
  }

  // No ID or not found — INSERT new character
  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    name: safeName,
    data: data || {},
    portrait_url: safePortraitUrl,
  };
  if (id && isValidUUID(id)) {
    insertPayload.id = id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('characters')
    .insert(insertPayload)
    .select('id, name, portrait_url, created_at, updated_at')
    .maybeSingle();

  if (insertError) {
    console.error('[API Characters POST insert] Error:', insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  if (!inserted) return NextResponse.json({ error: 'Failed to save character' }, { status: 500 });
  return NextResponse.json({ character: inserted });
}

export async function PUT(request: NextRequest) {
  const supabase = createClient(request);
  const { user, error: authError } = await getAuthenticatedUser(supabase, request);
  if (!user) return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Некорректное тело запроса (ожидался JSON)' }, { status: 400 });
  }

  const { id, name, data, portrait_url } = body as {
    id?: unknown;
    name?: unknown;
    data?: unknown;
    portrait_url?: unknown;
  };

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Character ID is required and must be a valid UUID' }, { status: 400 });
  }

  if (data !== undefined && data !== null) {
    if (typeof data !== 'object') {
      return NextResponse.json({ error: 'Данные персонажа должны быть объектом' }, { status: 400 });
    }
    const serialized = JSON.stringify(data);
    if (utf8ByteLength(serialized) > MAX_CHARACTER_BYTES) {
      return NextResponse.json({ error: 'Данные персонажа превышают лимит 5 МБ' }, { status: 400 });
    }
  }

  const nameValidation = validateCharacterName(name);
  if (!nameValidation.isValid) {
    return NextResponse.json({ error: nameValidation.error }, { status: 400 });
  }
  const safeName = nameValidation.safeName!;

  if (data && typeof data === 'object' && 'name' in (data as any)) {
    const dataNameValidation = validateCharacterName((data as any).name);
    if (!dataNameValidation.isValid) {
      return NextResponse.json({ error: dataNameValidation.error }, { status: 400 });
    }
  }

  const safePortraitUrl = typeof portrait_url === 'string' && portrait_url.length <= 2048 ? portrait_url : (portrait_url === null ? null : undefined);

  const { data: character, error } = await supabase
    .from('characters')
    .update({ name: safeName, data: data || {}, portrait_url: safePortraitUrl, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, portrait_url, created_at, updated_at')
    .maybeSingle();

  if (error) {
    console.error('[API Characters PUT] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  return NextResponse.json({ character });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(request);
  const { user, error: authError } = await getAuthenticatedUser(supabase, request);
  if (!user) return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Character ID is required and must be a valid UUID' }, { status: 400 });

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[API Characters DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
