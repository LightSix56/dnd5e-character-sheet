import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcPointBuyTotalSpent,
  POINT_BUY_BUDGET,
  getClassSkillConfig,
  getClassSpellcastingLimits,
  getRacialBonusConfig,
  getRacialSkillData,
  roll4d6DropLowest,
  generateFantasyName
} from '../src/components/wizard/wizard-helpers';

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
