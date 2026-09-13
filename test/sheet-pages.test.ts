import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Sheet Page Components Contract', () => {
  test('components exist and export valid React components', async () => {
    const detailsMod = await import('../src/components/sheet/pages/DetailsSheetPage.js');
    assert.ok(typeof detailsMod.DetailsSheetPage === 'function' || typeof detailsMod.DetailsSheetPage === 'object');

    const spellsMod = await import('../src/components/sheet/pages/SpellsSheetPage.js');
    assert.ok(typeof spellsMod.SpellsSheetPage === 'function' || typeof spellsMod.SpellsSheetPage === 'object');

    const mainMod = await import('../src/components/sheet/pages/MainSheetPage.js');
    assert.ok(typeof mainMod.MainSheetPage === 'function' || typeof mainMod.MainSheetPage === 'object');
  });
});
