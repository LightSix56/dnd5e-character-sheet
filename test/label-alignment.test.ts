import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Label row height uniformity and input alignment in Basic Info', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');

  // Verify StatInput has h-5 label container
  assert.ok(
    code.includes('function StatInput') && code.includes('h-5 flex items-center'),
    'StatInput must wrap its label in h-5 flex items-center container'
  );

  // Verify char-input-name header has h-5
  assert.ok(
    code.includes('char-input-name') && code.includes('h-5 flex items-center justify-between'),
    'char-input-name header must use h-5 flex items-center justify-between'
  );
});
