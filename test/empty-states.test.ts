import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Alive Parchment Empty States', () => {
  const code = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf-8');
  const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf-8');

  // Verify CSS class
  assert.ok(
    css.includes('.parchment-empty-state'),
    'globals.css must define .parchment-empty-state class'
  );

  // Verify empty state for attacks / weapons
  assert.ok(
    code.includes('Оружие не экипировано') || code.includes('Оружие не выбрано') || code.includes('Нет доступных атак'),
    'page.tsx must contain friendly empty state text for attacks'
  );

  // Verify empty state for equipment / inventory
  assert.ok(
    code.includes('Рюкзак пуст') || code.includes('Снаряжение не записано') || code.includes('Нет предметов'),
    'page.tsx must contain friendly empty state text for equipment'
  );

  // Verify empty state for spells
  assert.ok(
    code.includes('В книге заклинаний пока нет записей') || code.includes('Нет изученных заклинаний') || code.includes('Книга заклинаний пуста'),
    'page.tsx must contain friendly empty state text for spells'
  );
});
