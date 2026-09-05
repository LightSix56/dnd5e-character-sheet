import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPointBuyTotalSpent,
  POINT_BUY_BUDGET,
  POINT_BUY_COST_TABLE,
  getClassSkillConfig,
  getClassSpellcastingLimits,
  getRacialBonusConfig,
  getRacialSkillData,
  roll4d6DropLowest,
  generateFantasyName,
  validateStandardArray,
  calcPreparedSpellsLimit,
  calculateWizardAC
} from '../src/components/wizard/wizard-helpers';
import { DND_COMPENDIUM_SPELLS } from '../src/data/compendium/spells';
import { DND_COMPENDIUM_RACES } from '../src/data/compendium/races';
import { DND_COMPENDIUM_CLASSES } from '../src/data/compendium/classes';
import { DND_COMPENDIUM_BACKGROUNDS } from '../src/data/compendium/backgrounds';

// ── Baseline Tests ──

test('Wizard Engine Baseline: point buy starting cost is 0 for all 8s', () => {
  const base = { 'СИЛ': 8, 'ЛОВ': 8, 'ТЕЛ': 8, 'ИНТ': 8, 'МДР': 8, 'ХАР': 8 };
  assert.equal(calcPointBuyTotalSpent(base), 0);
  assert.equal(POINT_BUY_BUDGET, 27);
});

test('Wizard Engine Baseline: 4d6 roll drops lowest die', () => {
  const roll = roll4d6DropLowest();
  assert.equal(roll.dice.length, 4);
  assert.ok(roll.total >= 3 && roll.total <= 18);
  assert.ok(roll.droppedIndex >= 0 && roll.droppedIndex < 4);
});

// ── RED TEAM ADVERSARIAL STRESS TESTS ──

test('Flaw 1: Artificer spellcaster must have cantrips and 1st-level spells in compendium', () => {
  const limits = getClassSpellcastingLimits('Изобретатель', { 'СИЛ': 8, 'ЛОВ': 10, 'ТЕЛ': 14, 'ИНТ': 16, 'МДР': 12, 'ХАР': 10 }, { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 });
  assert.equal(limits.isCaster, true, 'Artificer must be recognized as a spellcaster');
  assert.ok(limits.cantripsLimit > 0, 'Artificer must have at least 2 cantrips');
  assert.ok(limits.spellsLimit > 0, 'Artificer must prepare at least 1 spell');

  // Filter available spells in compendium for Artificer
  const availableCantrips = DND_COMPENDIUM_SPELLS.filter(s =>
    s.level === 0 && (s.classes || []).some(cls => cls.toLowerCase() === 'изобретатель')
  );
  const availableSpells = DND_COMPENDIUM_SPELLS.filter(s =>
    s.level === 1 && (s.classes || []).some(cls => cls.toLowerCase() === 'изобретатель')
  );

  // STRESS ASSERTION: If compendium lacks Artificer spells, the player is trapped in Step 5!
  assert.ok(
    availableCantrips.length >= limits.cantripsLimit,
    `Compendium must have at least ${limits.cantripsLimit} cantrips for Artificer, but found ${availableCantrips.length}!`
  );
  assert.ok(
    availableSpells.length >= limits.spellsLimit,
    `Compendium must have at least ${limits.spellsLimit} 1st-level spells for Artificer, but found ${availableSpells.length}!`
  );
});

test('Flaw 2: Point Buy calculator must reject illegal out-of-bounds scores (< 8 or > 15)', () => {
  // Scores below 8 or above 15 are strictly illegal in 5e Point Buy (PHB p. 13)
  const illegalScores = { 'СИЛ': 18, 'ЛОВ': 16, 'ТЕЛ': 14, 'ИНТ': 10, 'МДР': 8, 'ХАР': 6 };
  
  // Currently calcPointBuyTotalSpent silently clamps 18 -> 15 and 6 -> 8
  // If silent clamping occurs: 18->9 pts, 16->9 pts, 14->7 pts, 10->2 pts, 8->0 pts, 6->0 pts = 27 pts!
  // This masquerades as a valid 27-budget spend!
  const total = calcPointBuyTotalSpent(illegalScores);
  assert.notEqual(
    total,
    27,
    'Point Buy calculator must NOT silently clamp scores 18 and 6 to appear as exactly 27 points spent!'
  );
});

test('Flaw 3: Standard Array validation function must exist and reject duplicate values', () => {
  assert.equal(typeof validateStandardArray, 'function', 'wizard-helpers must export validateStandardArray');
  
  const all15s = { 'СИЛ': 15, 'ЛОВ': 15, 'ТЕЛ': 15, 'ИНТ': 15, 'МДР': 15, 'ХАР': 15 };
  const res = validateStandardArray(all15s);
  assert.equal(res.valid, false, 'Standard Array with all 15s must be invalid');
  
  const validArray = { 'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 12, 'МДР': 10, 'ХАР': 8 };
  assert.equal(validateStandardArray(validArray).valid, true, 'Valid Standard Array permutation must be valid');
});

test('Flaw 4: Wizard spellbook vs prepared spells calculation distinction', () => {
  assert.equal(typeof calcPreparedSpellsLimit, 'function', 'wizard-helpers must export calcPreparedSpellsLimit');

  // Wizard with INT 16 (+3) at Level 1
  const prepLimit = calcPreparedSpellsLimit('Волшебник', 1, 3);
  assert.equal(prepLimit, 4, 'Wizard (INT +3, level 1) must prepare exactly 3 + 1 = 4 spells');

  // Wizard with INT 8 (-1) at Level 1 (minimum 1 spell per PHB p. 114)
  const prepLimitLow = calcPreparedSpellsLimit('Волшебник', 1, -1);
  assert.equal(prepLimitLow, 1, 'Wizard (INT -1, level 1) must prepare at least 1 spell');
});

test('Flaw 5: AC calculation must reflect character actual DEX modifier, not static template', () => {
  assert.equal(typeof calculateWizardAC, 'function', 'wizard-helpers must export calculateWizardAC');

  // Fighter wearing Chain Mail (Кольчуга: base 16, heavy -> no dex)
  assert.equal(calculateWizardAC('Боец', 'Кольчуга', false, 3, 2, 0), 16);
  // Fighter wearing Chain Mail with Shield (+2) -> 18
  assert.equal(calculateWizardAC('Боец', 'Кольчуга', true, 3, 2, 0), 18);

  // Rogue wearing Leather Armor (Кожаный доспех: base 11 + DEX)
  // DEX +4 -> AC 15
  assert.equal(calculateWizardAC('Плут', 'Кожаный доспех', false, 4, 1, 0), 15);
  // DEX +1 -> AC 12 (must NOT be stuck at template typicalAC 14!)
  assert.equal(calculateWizardAC('Плут', 'Кожаный доспех', false, 1, 1, 0), 12);

  // Barbarian Unarmored Defense (10 + DEX + CON)
  // DEX +2, CON +3 -> 15
  assert.equal(calculateWizardAC('Варвар', '', false, 2, 3, 0), 15);
  // Monk Unarmored Defense (10 + DEX + WIS)
  // DEX +3, WIS +2 -> 15
  assert.equal(calculateWizardAC('Монах', '', false, 3, 1, 2), 15);
});


