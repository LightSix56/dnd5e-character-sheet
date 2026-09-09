import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Global CSS Materiality and Tactile Buttons', () => {
  const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf-8');
  assert.ok(
    css.includes('active:scale-[0.98]') || css.includes('transform: scale(0.98)') || css.includes('scale(0.98)'),
    'must contain tactile scale down on active'
  );
  assert.ok(
    css.includes('rgba(60, 36, 21'),
    'must contain warm oak tinted shadows (rgba(60, 36, 21...))'
  );
  assert.ok(
    css.includes('inset 0 1px 0 rgba(255, 240, 200') || css.includes('inset 0 1px 0 rgba(255, 229, 143'),
    'must contain subtle gold/parchment inner edge highlight'
  );
});
