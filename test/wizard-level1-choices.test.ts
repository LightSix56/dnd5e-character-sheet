import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIGHTING_STYLES,
  DRAGON_ANCESTRIES,
  DWARF_TOOL_OPTIONS,
  STANDARD_LANGUAGES,
  EXOTIC_LANGUAGES,
  ALL_DND_LANGUAGES,
  getRacialChoicesConfig,
  getClassLevel1ChoicesConfig,
  calculateWizardAC
} from '../src/components/wizard/wizard-helpers';
import { DND_COMPENDIUM_RACES } from '../src/data/compendium/races';

test('Level 1 Rule Engine: Fighting Styles contains all 6 core styles', () => {
  assert.ok(Array.isArray(FIGHTING_STYLES));
  assert.equal(FIGHTING_STYLES.length, 6);
  const ids = FIGHTING_STYLES.map(s => s.id);
  assert.ok(ids.includes('archery'));
  assert.ok(ids.includes('defense'));
  assert.ok(ids.includes('dueling'));
  assert.ok(ids.includes('great-weapon'));
  assert.ok(ids.includes('protection'));
  assert.ok(ids.includes('two-weapon'));
});

test('Level 1 Rule Engine: Draconic Ancestries contains 10 chromatic and metallic dragons', () => {
  assert.ok(Array.isArray(DRAGON_ANCESTRIES));
  assert.equal(DRAGON_ANCESTRIES.length, 10);
  const colors = DRAGON_ANCESTRIES.map(d => d.color);
  assert.ok(colors.includes('Красный'));
  assert.ok(colors.includes('Золотой'));
  assert.ok(colors.includes('Серебряный'));
  assert.ok(colors.includes('Белый'));
  assert.ok(colors.includes('Синий'));
});

test('Level 1 Rule Engine: Dwarf tools has 3 artisan options', () => {
  assert.equal(DWARF_TOOL_OPTIONS.length, 3);
  assert.ok(DWARF_TOOL_OPTIONS.includes('Инструменты кузнеца'));
  assert.ok(DWARF_TOOL_OPTIONS.includes('Инструменты каменщика'));
  assert.ok(DWARF_TOOL_OPTIONS.includes('Инструменты пивовара'));
});

test('Level 1 Rule Engine: Languages contains standard and exotic sets', () => {
  assert.ok(STANDARD_LANGUAGES.length >= 8);
  assert.ok(EXOTIC_LANGUAGES.length >= 8);
  assert.ok(ALL_DND_LANGUAGES.includes('Драконий'));
  assert.ok(ALL_DND_LANGUAGES.includes('Эльфийский'));
  assert.ok(ALL_DND_LANGUAGES.includes('Дворфийский'));
});

test('Level 1 Rule Engine: getRacialChoicesConfig accurately flags choices for races', () => {
  const human = DND_COMPENDIUM_RACES.find(r => r.id === 'human')!;
  const varHumanSub = human.subraces?.find(sr => sr.id === 'human-variant');
  const varCfg = getRacialChoicesConfig(human, varHumanSub);
  assert.equal(varCfg.needsFeat, true, 'Variant Human must choose 1 feat');
  assert.equal(varCfg.extraLanguageCount, 1, 'Variant Human must choose 1 extra language');

  const elf = DND_COMPENDIUM_RACES.find(r => r.id === 'elf')!;
  const highElfSub = elf.subraces?.find(sr => sr.id === 'elf-high');
  const highElfCfg = getRacialChoicesConfig(elf, highElfSub);
  assert.equal(highElfCfg.needsCantrip, true, 'High Elf must choose 1 wizard cantrip');
  assert.equal(highElfCfg.extraLanguageCount, 1, 'High Elf must choose 1 extra language');

  const dwarf = DND_COMPENDIUM_RACES.find(r => r.id === 'dwarf')!;
  const dwarfCfg = getRacialChoicesConfig(dwarf);
  assert.equal(dwarfCfg.needsTool, true, 'Dwarf must choose 1 artisan tool');

  const dragonborn = DND_COMPENDIUM_RACES.find(r => r.id === 'dragonborn')!;
  const dragonbornCfg = getRacialChoicesConfig(dragonborn);
  assert.equal(dragonbornCfg.needsDragonColor, true, 'Dragonborn must choose draconic ancestry');
});

test('Level 1 Rule Engine: getClassLevel1ChoicesConfig flags class choices accurately', () => {
  const fighterCfg = getClassLevel1ChoicesConfig('Воин');
  assert.equal(fighterCfg.needsFightingStyle, true, 'Fighter needs fighting style');

  const rogueCfg = getClassLevel1ChoicesConfig('Плут');
  assert.equal(rogueCfg.needsExpertise, true, 'Rogue needs expertise');
  assert.equal(rogueCfg.expertiseCount, 2, 'Rogue needs 2 expertises');

  const rangerCfg = getClassLevel1ChoicesConfig('Следопыт');
  assert.equal(rangerCfg.needsFavoredEnemy, true, 'Ranger needs favored enemy');
  assert.equal(rangerCfg.needsFavoredTerrain, true, 'Ranger needs favored terrain');

  const draconicSorcererCfg = getClassLevel1ChoicesConfig('Чародей', 'sorcerer-draconic');
  assert.equal(draconicSorcererCfg.needsDraconicAncestor, true, 'Draconic Sorcerer needs dragon color');
});

test('Level 1 Rule Engine: calculateWizardAC applies Defense Fighting Style and Draconic Resilience', () => {
  // Fighter with Chain Mail (base 16) and Defense (+1) -> 17
  assert.equal(
    calculateWizardAC('Воин', 'Кольчуга', false, 0, 2, 0, { hasDefenseFightingStyle: true }),
    17
  );
  // Fighter with Chain Mail and Shield (+2) and Defense (+1) -> 19
  assert.equal(
    calculateWizardAC('Воин', 'Кольчуга', true, 0, 2, 0, { hasDefenseFightingStyle: true }),
    19
  );
  // Fighter with Defense but NO armor (unarmored) -> NO +1 bonus (10 + DEX)
  assert.equal(
    calculateWizardAC('Воин', '', false, 2, 2, 0, { hasDefenseFightingStyle: true }),
    12
  );

  // Draconic Sorcerer unarmored (13 + DEX)
  // DEX +3 -> 16
  assert.equal(
    calculateWizardAC('Чародей', '', false, 3, 2, 0, { isDraconicSorcerer: true }),
    16
  );
  // Draconic Sorcerer unarmored with shield (+2) -> 18
  assert.equal(
    calculateWizardAC('Чародей', '', true, 3, 2, 0, { isDraconicSorcerer: true }),
    18
  );
});
