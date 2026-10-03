import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient, getAuthenticatedUser } from '@/lib/supabase/route';
import { enforceRateLimit, sniffImageType } from '@/lib/request-guards';

const MAX_PORTRAIT_BYTES = 500 * 1024;

const CONTENT_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
} as const;

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'upload-portrait', 30, 10 * 60_000);
  if (limited) return limited;

  const supabase = createRouteClient(request, { forwardAuth: true });
  const { user } = await getAuthenticatedUser(supabase, request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const declaredLength = Number(request.headers.get('content-length') || 0);
  // Небольшой запас на служебные поля multipart-формы.
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PORTRAIT_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 500 КБ)' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос формы' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string' || typeof file.size !== 'number') {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
  }

  if (file.size > MAX_PORTRAIT_BYTES) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 500 КБ)' }, { status: 400 });
  }

  // Формат определяем по сигнатуре файла, а не по MIME из запроса: его задаёт клиент.
  // Разрешены только PNG, JPEG и WebP — SVG отклоняется, чтобы исключить Stored XSS.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = sniffImageType(bytes);
  if (!imageType) {
    return NextResponse.json({ error: 'Поддерживаются только изображения PNG, JPEG или WEBP' }, { status: 400 });
  }

  // Путь строим только из времени сервера и проверенного расширения, имя файла клиента игнорируем.
  const filePath = `${user.id}/${Date.now()}.${imageType}`;

  const { error } = await supabase.storage
    .from('portraits')
    .upload(filePath, bytes, { upsert: false, contentType: CONTENT_TYPES[imageType] });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
