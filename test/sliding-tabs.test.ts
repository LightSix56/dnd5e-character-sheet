import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Sliding Tab Indicator with layoutId', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  assert.ok(
    code.includes('layoutId="activeTabParchment"'),
    'tabs must include motion layoutId="activeTabParchment" for sliding transition'
  );
});
