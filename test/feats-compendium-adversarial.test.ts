import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { 
  DND_COMPENDIUM_FEATS, 
  findFeatByName, 
  getFeats, 
  getTraits, 
  CompendiumFeat 
} from '../src/data/compendium/feats';
import { findTraitByName, DND_TRAITS } from '../src/data/dnd-traits';

describe('Adversarial Quality Gate: D&D 5e Feats Compendium Integrity', () => {
  it('contains at least 105 official feats + core class traits with no duplicate IDs', () => {
    assert.ok(DND_COMPENDIUM_FEATS.length >= 112, `Expected at least 112 entries, found ${DND_COMPENDIUM_FEATS.length}`);
    const seenIds = new Set<string>();
    for (const f of DND_COMPENDIUM_FEATS) {
      assert.ok(f.id && typeof f.id === 'string', `Feat missing id: ${JSON.stringify(f.name)}`);
      assert.ok(!seenIds.has(f.id), `Duplicate feat id detected: "${f.id}" for feat "${f.name}"`);
      seenIds.add(f.id);
    }
  });

  it('all feats satisfy strict schema constraints', () => {
    const validCategories = new Set(['Черта', 'Классовое', 'Расовое', 'Прочее']);

    for (const f of DND_COMPENDIUM_FEATS) {
      // Basic text validation
      assert.ok(f.name && f.name.trim().length > 0, `Feat ${f.id} missing name`);
      assert.ok(f.nameEn && f.nameEn.trim().length > 0, `Feat ${f.id} missing nameEn`);
      assert.ok(validCategories.has(f.category), `Feat ${f.id} invalid category: "${f.category}"`);
      assert.ok(f.summary && f.summary.trim().length > 0, `Feat ${f.id} missing summary`);
      assert.ok(f.description && f.description.trim().length > 0, `Feat ${f.id} missing description`);

      // If from dnd.su, check URL format
      if (f.dndsuUrl) {
        assert.ok(f.dndsuUrl.startsWith('https://dnd.su/feats/'), `Feat ${f.id} invalid dndsuUrl: ${f.dndsuUrl}`);
      }
    }
  });

  it('getFeats() and getTraits() cleanly partition the compendium', () => {
    const feats = getFeats();
    const traits = getTraits();

    assert.strictEqual(feats.length + traits.length, DND_COMPENDIUM_FEATS.length, 'Partition must account for every entry');
    assert.strictEqual(feats.length, 105, `Expected exactly 105 feats, found ${feats.length}`);
    assert.strictEqual(traits.length, 7, `Expected exactly 7 core class traits, found ${traits.length}`);

    // Verify all feats are either 'Черта' or 'Расовое'
    for (const f of feats) {
      assert.ok(f.category === 'Черта' || f.category === 'Расовое', `Unexpected feat category: ${f.category} for ${f.name}`);
    }

    // Verify traits are 'Классовое'
    for (const t of traits) {
      assert.strictEqual(t.category, 'Классовое', `Unexpected trait category: ${t.category} for ${t.name}`);
    }
  });

  it('findFeatByName() accurately performs bilingual lookups', () => {
    const warCasterRu = findFeatByName('Боевой заклинатель');
    assert.ok(warCasterRu, 'Should find War Caster by Russian name');
    assert.strictEqual(warCasterRu?.nameEn, 'War Caster');

    const warCasterEn = findFeatByName('War Caster');
    assert.ok(warCasterEn, 'Should find War Caster by English name');
    assert.strictEqual(warCasterEn?.id, warCasterRu?.id);

    const gwm = findFeatByName('great weapon master');
    assert.ok(gwm, 'Should find Great Weapon Master case-insensitively');
    assert.strictEqual(gwm?.name, 'Мастер большого оружия');

    const elvenAcc = findFeatByName('эльфийская точность');
    assert.ok(elvenAcc, 'Should find Elven Accuracy');
    assert.strictEqual(elvenAcc?.category, 'Расовое');

    const nonexistent = findFeatByName('Nonexistent Feat 12345');
    assert.strictEqual(nonexistent, undefined, 'Should return undefined for unknown feats');
  });

  it('correctly extracts ability score bonuses for half-feats', () => {
    const feyTouched = findFeatByName('Fey Touched');
    assert.ok(feyTouched, 'Fey Touched must exist');
    assert.ok(feyTouched?.abilityBonus, 'Fey Touched must have abilityBonus');
    assert.match(feyTouched!.abilityBonus!, /ИНТ|МДР|ХАР/);

    const resilient = findFeatByName('Resilient');
    assert.ok(resilient, 'Resilient must exist');
    assert.ok(resilient?.abilityBonus, 'Resilient must have abilityBonus');
    assert.match(resilient!.abilityBonus!, /любая|выбранн/i);

    const tavernBrawler = findFeatByName('Tavern Brawler');
    assert.ok(tavernBrawler, 'Tavern Brawler must exist');
    assert.ok(tavernBrawler?.abilityBonus, 'Tavern Brawler must have abilityBonus');
    assert.match(tavernBrawler!.abilityBonus!, /СИЛ.*ТЕЛ/);
  });

  it('prerequisites are cleanly captured for conditional feats', () => {
    const warCaster = findFeatByName('War Caster');
    assert.ok(warCaster?.prerequisite, 'War Caster must have prerequisite');
    assert.match(warCaster!.prerequisite!, /заклинание/i);

    const heavyArmorMaster = findFeatByName('Heavy Armor Master');
    assert.ok(heavyArmorMaster?.prerequisite, 'Heavy Armor Master must have prerequisite');
    assert.match(heavyArmorMaster!.prerequisite!, /тяж[её]л/i);

    const elvenAcc = findFeatByName('Elven Accuracy');
    assert.ok(elvenAcc?.prerequisite, 'Elven Accuracy must have racial prerequisite');
    assert.match(elvenAcc!.prerequisite!, /Эльф/i);
  });

  it('integrates seamlessly with findTraitByName in dnd-traits.ts', () => {
    assert.ok(DND_TRAITS.length >= 112, `DND_TRAITS must have at least 112 items, found ${DND_TRAITS.length}`);

    const foundActionSurge = findTraitByName('Всплеск действий');
    assert.ok(foundActionSurge, 'Should find Action Surge via findTraitByName');
    assert.strictEqual(foundActionSurge?.category, 'Классовое');

    const foundSneakAttack = findTraitByName('Скрытая атака');
    assert.ok(foundSneakAttack, 'Should find Sneak Attack via findTraitByName');

    const foundFeat = findTraitByName('Бдительный');
    assert.ok(foundFeat, 'Should find Alert feat via findTraitByName');
    assert.strictEqual(foundFeat?.category, 'Черта');
  });
});
