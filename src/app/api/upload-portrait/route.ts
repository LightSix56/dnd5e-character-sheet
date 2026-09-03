import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос формы' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file.size !== 'number') {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
  }

  // Allow only safe image formats (PNG, JPEG, WebP) - explicitly reject SVG to prevent Stored XSS
  const ALLOWED_MIME_MAP: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
  };

  const fileMime = (file.type || '').toLowerCase();
  const safeExt = ALLOWED_MIME_MAP[fileMime];
  if (!safeExt) {
    return NextResponse.json({ error: 'Поддерживаются только изображения PNG, JPEG или WEBP' }, { status: 400 });
  }

  if (file.size > 500 * 1024) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 500 КБ)' }, { status: 400 });
  }

  // Derive file path strictly from server timestamp and safe extension, discarding any client filename
  const filePath = `${user.id}/${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from('portraits')
    .upload(filePath, file, { upsert: true, contentType: fileMime });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
