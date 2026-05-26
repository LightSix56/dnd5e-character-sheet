import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Not an image' }, { status: 400 });
  }
  if (file.size > 500 * 1024) {
    return NextResponse.json({ error: 'File too large (max 500KB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'png';
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('portraits')
    .upload(filePath, file, { upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('portraits').getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl });
}
