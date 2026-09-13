import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const readFile = (relPath: string) => {
  return fs.readFileSync(path.resolve(rootDir, relPath), 'utf8');
};

describe('Performance: Internalize Spell Autocomplete in SpellsSheetPage', () => {
  it('src/app/page.tsx does not directly import DND_SPELLS database', () => {
    const content = readFile('src/app/page.tsx');
    assert.doesNotMatch(
      content,
      /import\s*\{[^}]*DND_SPELLS[^}]*\}\s*from\s*['"]@\/data\/dnd-spells['"]/,
      'src/app/page.tsx must not directly import DND_SPELLS (1.3MB database)'
    );
  });

  it('src/components/sheet/pages/SpellsSheetPage.tsx encapsulates spellAutocompleteItems computation', () => {
    const content = readFile('src/components/sheet/pages/SpellsSheetPage.tsx');
    assert.match(
      content,
      /DND_SPELLS/,
      'SpellsSheetPage must import and use DND_SPELLS internally'
    );
    assert.match(
      content,
      /spellAutocompleteItems/,
      'SpellsSheetPage must define spellAutocompleteItems locally'
    );
  });
});
