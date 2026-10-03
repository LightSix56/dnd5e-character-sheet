import { NextRequest, NextResponse } from 'next/server';
import { exportCharacterToPdf } from '@/lib/pdf-export';
import { type CharacterData, normalizeCharacterData } from '@/lib/dnd-types';
import { enforceRateLimit, readJsonBody } from '@/lib/request-guards';

// Экспорт нагружает процессор и доступен без входа, поэтому ограничиваем размер и частоту.
const MAX_EXPORT_BODY_BYTES = 6 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'export', 30, 5 * 60_000);
  if (limited) return limited;

  const parsed = await readJsonBody(req, MAX_EXPORT_BODY_BYTES);
  if (!parsed.ok) return parsed.response;
  if (!parsed.body || typeof parsed.body !== 'object' || Array.isArray(parsed.body)) {
    return NextResponse.json({ error: 'Ожидались данные персонажа' }, { status: 400 });
  }

  try {
    const char = normalizeCharacterData(parsed.body as Partial<CharacterData>);

    const pdfBytes = await exportCharacterToPdf(char);

    const cleanName = (char.name || 'Персонаж').replace(/[\\/:*?"<>|]/g, '_');
    const className = char.className || 'Герой';
    const level = char.level || 1;
    const filename = 'DnD5e_' + cleanName + '_' + className + level + '.pdf';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(filename),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('PDF export error:', err);
    return NextResponse.json(
      { error: err?.message || 'Не удалось сформировать PDF' },
      { status: 500 }
    );
  }
}
