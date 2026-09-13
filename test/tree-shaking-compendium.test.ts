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

describe('Performance: Tree-Shakeable Compendium Imports in page.tsx', () => {
  it('does not import from barrel @/data/compendium in page.tsx', () => {
    const content = readFile('src/app/page.tsx');
    assert.doesNotMatch(
      content,
      /from\s+['"]@\/data\/compendium['"]/,
      'page.tsx must not import from the @/data/compendium barrel file'
    );
  });

  it('does not import DND_COMPENDIUM_CLASSES in page.tsx', () => {
    const content = readFile('src/app/page.tsx');
    assert.doesNotMatch(
      content,
      /DND_COMPENDIUM_CLASSES/,
      'page.tsx must not import DND_COMPENDIUM_CLASSES (546KB)'
    );
  });

  it('does not import wizard-helpers in page.tsx', () => {
    const content = readFile('src/app/page.tsx');
    assert.doesNotMatch(
      content,
      /from\s+['"]@\/components\/wizard\/wizard-helpers['"]/,
      'page.tsx must not import from wizard-helpers directly'
    );
  });
});
