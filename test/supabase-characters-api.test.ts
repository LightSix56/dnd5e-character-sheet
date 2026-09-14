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

test('Character Name Validator: Rejects nameless, whitespace, and placeholder "Безымянный" characters', async () => {
  const { validateCharacterName, isNamelessCharacter } = await import('../src/lib/character-validation.js');

  // Valid names
  assert.deepEqual(validateCharacterName('Торин Дубощит'), { isValid: true, safeName: 'Торин Дубощит' });
  assert.deepEqual(validateCharacterName('  Astarion  '), { isValid: true, safeName: 'Astarion' });
  assert.deepEqual(validateCharacterName('Гэндальф'), { isValid: true, safeName: 'Гэндальф' });

  // Invalid nameless cases
  assert.equal(validateCharacterName('').isValid, false);
  assert.equal(validateCharacterName('   ').isValid, false);
  assert.equal(validateCharacterName(null).isValid, false);
  assert.equal(validateCharacterName(undefined).isValid, false);
  assert.equal(validateCharacterName(12345).isValid, false);
  assert.equal(validateCharacterName({}).isValid, false);

  // Invalid placeholder "Безымянный" cases
  assert.equal(validateCharacterName('Безымянный').isValid, false);
  assert.equal(validateCharacterName('безымянный').isValid, false);
  assert.equal(validateCharacterName('  БЕЗЫМЯННЫЙ  ').isValid, false);
  assert.equal(validateCharacterName('Безымянная').isValid, false);
  assert.equal(validateCharacterName('Nameless').isValid, false);
  assert.equal(validateCharacterName('Безымянный герой').isValid, false);
  assert.equal(validateCharacterName('Новый герой').isValid, false);

  // isNamelessCharacter helper
  assert.equal(isNamelessCharacter(''), true);
  assert.equal(isNamelessCharacter('   '), true);
  assert.equal(isNamelessCharacter(null), true);
  assert.equal(isNamelessCharacter(undefined), true);
  assert.equal(isNamelessCharacter('Безымянный'), true);
  assert.equal(isNamelessCharacter('Торин'), false);

  // Overflow case (> 200 chars)
  assert.equal(validateCharacterName('A'.repeat(201)).isValid, false);
});

test('Character Grid Filter: Filters out nameless and placeholder "Безымянный" characters', async () => {
  const { isNamedCharacter } = await import('../src/lib/character-validation.js');

  const list = [
    { id: '1', name: 'Торин' },
    { id: '2', name: 'Безымянный' },
    { id: '3', name: '' },
    { id: '4', name: '   ' },
    { id: '5', name: undefined },
    { id: '6', name: 'Арагорн' },
    { id: '7', name: 'безымянный' },
    { id: '8', name: 'Новый герой' },
    { id: '9', name: 'Гэндальф' },
  ];

  const filtered = list.filter(c => isNamedCharacter(c));
  assert.equal(filtered.length, 3);
  assert.deepEqual(filtered.map(c => c.id), ['1', '6', '9']);
});
