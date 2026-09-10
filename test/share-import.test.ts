import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ── Unit Tests for Shared Character Import & Cloud Overwrite Protection ──

test('Shared Character Import: Import payload format and state resolution logic', () => {
  // Simulate import payload created by share page
  const sampleChar = {
    name: 'Эльфийский Следопыт',
    className: 'Следопыт',
    level: 5,
    race: 'Лесной эльф',
    abilityScores: { strength: 10, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 16, charisma: 8 },
  };
  const portrait = 'https://example.com/ranger.png';
  const shareCode = 'abc-123';

  const payload = {
    char: sampleChar,
    portraitUrl: portrait,
    fromCode: shareCode,
    timestamp: Date.now(),
  };

  const serialized = JSON.stringify(payload);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.char.name, 'Эльфийский Следопыт');
  assert.equal(parsed.portraitUrl, 'https://example.com/ranger.png');
  assert.equal(parsed.fromCode, 'abc-123');
});

test('Shared Character Import: Overwrite prevention simulation in auth state change', () => {
  // Simulate cloud state where user has existing character in cloud
  const userCloudCharacter = {
    id: 'user-existing-cloud-char-id',
    name: 'Старый персонаж Мастера',
    data: { name: 'Старый персонаж Мастера', className: 'Волшебник', level: 10 },
  };

  const sharedImportCharacter = {
    name: 'Импортированный персонаж Игрока',
    className: 'Плут',
    level: 3,
  };

  // State in editor
  let activeChar = { ...sharedImportCharacter };
  let cloudCharId: string | null = null;
  let isSharedImport = true; // Flag set when shared character is loaded

  // Function simulating auth change handler logic in page.tsx
  function handleAuthSession(newUser: boolean, event: string, cloudData: any[]) {
    if (newUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      if (isSharedImport) {
        // Must protect imported character!
        isSharedImport = false;
        // cloudCharId remains null so auto-save won't overwrite existing cloud characters
        return;
      }
      if (cloudData && cloudData.length > 0) {
        const latest = cloudData[0];
        activeChar = latest.data;
        cloudCharId = latest.id;
      }
    }
  }

  // Trigger auth session with existing cloud character
  handleAuthSession(true, 'INITIAL_SESSION', [userCloudCharacter]);

  // Assert: activeChar MUST STILL BE the shared import character, NOT the old cloud character!
  assert.equal(activeChar.name, 'Импортированный персонаж Игрока');
  assert.equal(cloudCharId, null, 'Active cloud character ID must be null to prevent overwriting cloud slot');
  assert.equal(isSharedImport, false, 'Import flag should be consumed');

  // Second normal auth login (without import) should load cloud character
  handleAuthSession(true, 'SIGNED_IN', [userCloudCharacter]);
  assert.equal(activeChar.name, 'Старый персонаж Мастера');
  assert.equal(cloudCharId, 'user-existing-cloud-char-id');
});

test('Code Contract: share/[code]/page.tsx implements dnd5e_shared_import in handleOpenInEditor', () => {
  const sharePagePath = path.resolve(process.cwd(), 'src/app/share/[code]/page.tsx');
  const content = fs.readFileSync(sharePagePath, 'utf-8');

  // handleOpenInEditor must save dnd5e_shared_import to localStorage
  assert.ok(
    content.includes('dnd5e_shared_import'),
    'share/[code]/page.tsx must store dnd5e_shared_import in localStorage'
  );
  assert.ok(
    content.includes("router.push('/?import=shared')") ||
    content.includes("window.location.href = '/?import=shared'") ||
    content.includes("import=shared"),
    'share/[code]/page.tsx must pass ?import=shared or trigger editor reload'
  );
});

test('Code Contract: app/page.tsx listens for dnd5e_shared_import and protects against cloud overwrite', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  assert.ok(
    content.includes('dnd5e_shared_import'),
    'app/page.tsx must check dnd5e_shared_import'
  );
  assert.ok(
    content.includes('isSharedImport') || content.includes('isSharedImportRef'),
    'app/page.tsx must have an isSharedImport flag to prevent cloud overwrite'
  );
});
