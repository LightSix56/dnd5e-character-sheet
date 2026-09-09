import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Header Toolbar Dropdown Menu', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(
    code.includes('showSheetMenu') || code.includes('sheetMenuOpen'),
    'header must manage sheet dropdown menu state (showSheetMenu or sheetMenuOpen)'
  );
  assert.ok(
    code.includes('parchment-dropdown') || code.includes('parchment-menu-dropdown'),
    'must contain parchment styled dropdown class'
  );
  assert.ok(
    code.includes('Готовые шаблоны') || code.includes('Шаблоны классов'),
    'dropdown must contain option to pick templates'
  );
});
