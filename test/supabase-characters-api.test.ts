import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Supabase Environment: .env.local exists in project root with valid keys', () => {
  const envPath = path.resolve(process.cwd(), '.env.local');
  assert.ok(fs.existsSync(envPath), '.env.local must exist in project root');

  const content = fs.readFileSync(envPath, 'utf-8');
  assert.ok(content.includes('NEXT_PUBLIC_SUPABASE_URL='), 'Must define NEXT_PUBLIC_SUPABASE_URL');
  assert.ok(content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY='), 'Must define NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=(https:\/\/[^\s]+)/);
  assert.ok(urlMatch && urlMatch[1], 'Must have valid https URL');
  assert.notEqual(urlMatch[1], 'https://placeholder.supabase.co', 'URL must not be placeholder');
});

test('UUID Validator regex correctly validates UUIDv4 and rejects malicious/corrupt strings', () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function isValidUUID(id: unknown): id is string {
    return typeof id === 'string' && UUID_REGEX.test(id);
  }

  assert.ok(isValidUUID('1214e1d6-0c49-474e-a990-5e178a4ef5ca'));
  assert.ok(isValidUUID('8ef6aaf6-d8cf-4719-a3da-8f4c0027e673'));
  assert.ok(isValidUUID('00000000-0000-4000-8000-000000000000'));

  // Invalid cases
  assert.equal(isValidUUID(''), false);
  assert.equal(isValidUUID('local-active'), false);
  assert.equal(isValidUUID('12345'), false);
  assert.equal(isValidUUID('1214e1d6-0c49-474e-a990-5e178a4ef5ca; DROP TABLE characters;'), false);
  assert.equal(isValidUUID(null), false);
  assert.equal(isValidUUID(undefined), false);
  assert.equal(isValidUUID(12345), false);
});

test('Bearer Token Parser accurately parses Bearer header and rejects bad formats', () => {
  function parseBearer(header: string | null): string | null {
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  assert.equal(parseBearer('Bearer my-jwt-token-123'), 'my-jwt-token-123');
  assert.equal(parseBearer('Bearer    trimmed-token   '), 'trimmed-token');
  assert.equal(parseBearer('Basic user:pass'), null);
  assert.equal(parseBearer('Bearer '), null);
  assert.equal(parseBearer(''), null);
  assert.equal(parseBearer(null), null);
});

test('Safe portrait url sanitization avoids overflow while accepting clean URLs', () => {
  function sanitizePortraitUrl(portrait_url: unknown): string | null | undefined {
    return typeof portrait_url === 'string' && portrait_url.length <= 2048
      ? portrait_url
      : (portrait_url === null ? null : undefined);
  }

  assert.equal(sanitizePortraitUrl('https://example.com/pic.png'), 'https://example.com/pic.png');
  assert.equal(sanitizePortraitUrl(null), null);
  assert.equal(sanitizePortraitUrl(undefined), undefined);
  // Very long base64 string (>2048) shouldn't blow up DB text column if restricted
  const hugeData = 'data:image/png;base64,' + 'A'.repeat(3000);
  assert.equal(sanitizePortraitUrl(hugeData), undefined);
});
