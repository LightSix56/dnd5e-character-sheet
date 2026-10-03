import { NextResponse, type NextRequest } from 'next/server';

// ── Rate limiting ──
// Скользящее окно в памяти процесса. На одном сервере (next start / standalone) работает точно;
// на serverless каждый инстанс считает отдельно, поэтому это защита от случайного и грубого
// злоупотребления, а не строгая квота.

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var _rateLimitBuckets: Map<string, Bucket> | undefined;
}

const MAX_BUCKETS = 10_000;

function getBuckets(): Map<string, Bucket> {
  if (!globalThis._rateLimitBuckets) globalThis._rateLimitBuckets = new Map();
  return globalThis._rateLimitBuckets;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const buckets = getBuckets();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
      // Все корзины ещё активны — выбрасываем самые старые (Map хранит порядок вставки).
      for (const k of buckets.keys()) {
        if (buckets.size < MAX_BUCKETS) break;
        buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Возвращает готовый ответ 429, если лимит исчерпан, иначе null. */
export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const result = checkRateLimit(`${scope}:${getClientIp(request)}`, limit, windowMs);
  if (result.ok) return null;
  return NextResponse.json(
    { error: 'Слишком много запросов. Попробуйте чуть позже.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  );
}

// ── Ограничение размера тела запроса ──

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse };

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Читает JSON-тело, отклоняя запросы больше maxBytes (413) и невалидный JSON (400). */
export async function readJsonBody(request: NextRequest, maxBytes: number): Promise<JsonBodyResult> {
  const tooLarge = () => ({
    ok: false as const,
    response: NextResponse.json(
      { error: `Запрос слишком большой (максимум ${Math.round(maxBytes / 1024)} КБ)` },
      { status: 413 }
    ),
  });

  const declared = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declared) && declared > maxBytes) return tooLarge();

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Не удалось прочитать тело запроса' }, { status: 400 }),
    };
  }

  if (utf8ByteLength(text) > maxBytes) return tooLarge();

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Некорректное тело запроса (ожидался JSON)' }, { status: 400 }),
    };
  }
}

// ── Проверка формата изображения по сигнатуре ──

export type SniffedImageType = 'png' | 'jpg' | 'webp' | null;

/** Определяет реальный формат по первым байтам — заявленному клиентом MIME доверять нельзя. */
export function sniffImageType(bytes: Uint8Array): SniffedImageType {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}
