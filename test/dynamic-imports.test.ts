import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Performance: Dynamic Imports in page.tsx', () => {
  const pagePath = path.resolve('src/app/page.tsx');
  const pageCode = fs.readFileSync(pagePath, 'utf8');

  it('imports dynamic from next/dynamic', () => {
    assert.match(pageCode, /import dynamic from ['"]next\/dynamic['"]/);
  });

  it('dynamically loads heavy modals and tools', () => {
    const dynamicComponents = [
      'CharacterCreationWizardModal',
      'LevelUpModal',
      'EquipmentPaperDoll',
      'StatsCalculatorModal',
      'CharacterGridModal',
      'ShareModal',
      'NameGeneratorModal',
      'RestModal',
      'ClassSelectorModal',
      'RaceSelectorModal',
      'SubclassSelectorModal',
      'ItemDetailModal',
      'SpellDetailModal',
      'WeaponDetailModal',
      'TraitDetailModal',
      'LevelDownModal',
      'LevelHistoryModal',
      'NonClassSpellConfirmModal',
      'TemplateModal',
      'AuthModal',
      'SignOutModal',
      'ResetModal',
      'CreateChoiceModal',
    ];

    for (const comp of dynamicComponents) {
      const pattern = new RegExp(`const\\s+\\b${comp}\\b\\s*=\\s*dynamic\\(`);
      assert.ok(
        pattern.test(pageCode),
        `Expected ${comp} to be loaded via dynamic(...)`
      );
    }
  });

  it('dynamically loads secondary sheet tabs (DetailsSheetPage, SpellsSheetPage)', () => {
    const tabs = ['DetailsSheetPage', 'SpellsSheetPage'];
    for (const tab of tabs) {
      const pattern = new RegExp(`const\\s+\\b${tab}\\b\\s*=\\s*dynamic\\(`);
      assert.ok(
        pattern.test(pageCode),
        `Expected ${tab} to be loaded via dynamic(...)`
      );
    }
  });
});
