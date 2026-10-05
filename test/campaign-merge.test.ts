import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, type CharacterData } from '../src/lib/dnd-types';
import { GAME_STATE_FIELDS, mergeServerGameState } from '../src/lib/campaign-merge';

function makeBase(): CharacterData {
  const c = createDefaultCharacter();
  c.name = 'Тест';
  return c;
}

test('server game state wins, sheet edits stay', () => {
  const local = { ...makeBase(), equipment: 'new sword', hpCurrent: 20, experiencePoints: 0 };
  const merged = mergeServerGameState(local, { hpCurrent: 7, experiencePoints: 150, conditions: ['poisoned'] });
  assert.equal(merged.equipment, 'new sword');
  assert.equal(merged.hpCurrent, 7);
  assert.equal(merged.experiencePoints, 150);
  assert.deepEqual(merged.conditions, ['poisoned']);
});

test('non game-state fields from the server are ignored', () => {
  const local = { ...makeBase(), equipment: 'mine', backstory: 'local story' };
  const merged = mergeServerGameState(local, { equipment: 'theirs', backstory: 'server story', name: 'Другой' });
  assert.equal(merged.equipment, 'mine');
  assert.equal(merged.backstory, 'local story');
  assert.equal(merged.name, 'Тест');
});

test('merge clamps expended slots', () => {
  const local = { ...makeBase(), spellSlots: { 1: { totalSlots: 2, expendedSlots: 0 } } };
  const merged = mergeServerGameState(local, {
    spellSlots: { '1': { totalSlots: 4, expendedSlots: 3 } } as unknown as CharacterData['spellSlots'],
  });
  assert.deepEqual(merged.spellSlots[1], { totalSlots: 2, expendedSlots: 2 });
});

test('slot levels missing on the server keep local values; negative and garbage clamp to zero', () => {
  const local = {
    ...makeBase(),
    spellSlots: { 1: { totalSlots: 4, expendedSlots: 1 }, 2: { totalSlots: 2, expendedSlots: 2 } },
  };
  const merged = mergeServerGameState(local, {
    spellSlots: { 1: { totalSlots: 4, expendedSlots: -5 } },
  });
  assert.deepEqual(merged.spellSlots[1], { totalSlots: 4, expendedSlots: 0 });
  assert.deepEqual(merged.spellSlots[2], { totalSlots: 2, expendedSlots: 2 });
  const garbage = mergeServerGameState(local, {
    spellSlots: { 1: { totalSlots: 4, expendedSlots: 'x' } } as unknown as CharacterData['spellSlots'],
  });
  assert.deepEqual(garbage.spellSlots[1], { totalSlots: 4, expendedSlots: 0 });
});

test('merge keeps local level-up and server xp', () => {
  const local = {
    ...makeBase(), level: 2, hpCurrent: 18, hpMax: 18, hpTemp: 0, hitDiceSpent: 0,
    spellSlots: { 1: { totalSlots: 3, expendedSlots: 0 } },
  };
  const merged = mergeServerGameState(local, {
    level: 1, hpCurrent: 3, hpTemp: 5, hitDiceSpent: 1, experiencePoints: 320, conditions: ['prone'],
    spellSlots: { 1: { totalSlots: 2, expendedSlots: 2 } },
  });
  assert.equal(merged.level, 2);
  assert.equal(merged.hpCurrent, 18);
  assert.equal(merged.hpTemp, 0);
  assert.equal(merged.hitDiceSpent, 0);
  assert.deepEqual(merged.spellSlots[1], { totalSlots: 3, expendedSlots: 0 });
  assert.equal(merged.experiencePoints, 320);
  assert.deepEqual(merged.conditions, ['prone']);
});

test('server without game fields changes nothing', () => {
  const base = makeBase();
  assert.deepEqual(mergeServerGameState(base, {}), base);
});

test('does not mutate its arguments', () => {
  const local = { ...makeBase(), spellSlots: { 1: { totalSlots: 2, expendedSlots: 0 } } };
  const snapshot = JSON.stringify(local);
  mergeServerGameState(local, { hpCurrent: 1, spellSlots: { 1: { totalSlots: 2, expendedSlots: 1 } } });
  assert.equal(JSON.stringify(local), snapshot);
});

test('game state field list is the agreed one', () => {
  assert.deepEqual([...GAME_STATE_FIELDS].sort(), [
    'concentration', 'conditions', 'deathSaveFailures', 'deathSaveSuccesses',
    'experiencePoints', 'hitDiceSpent', 'hpCurrent', 'hpTemp',
  ]);
});

test('player rest survives when the master only awarded experience', () => {
  // лист, каким он был при последней синхронизации с облаком
  const base = {
    ...makeBase(), hpMax: 20, hpCurrent: 6, hitDiceSpent: 2, experiencePoints: 100,
    spellSlots: { 1: { totalSlots: 4, expendedSlots: 3 } },
  };
  // игрок сделал долгий отдых
  const local = { ...base, hpCurrent: 20, hitDiceSpent: 1, spellSlots: { 1: { totalSlots: 4, expendedSlots: 0 } } };
  // мастер за это время начислил опыт; остальное на сервере прежнее
  const server = { ...base, experiencePoints: 400 };

  const merged = mergeServerGameState(local, server, base);

  assert.equal(merged.hpCurrent, 20);
  assert.equal(merged.hitDiceSpent, 1);
  assert.deepEqual(merged.spellSlots[1], { totalSlots: 4, expendedSlots: 0 });
  assert.equal(merged.experiencePoints, 400);
});

test('fields the player did not touch still come from the server', () => {
  const base = { ...makeBase(), hpMax: 20, hpCurrent: 20, equipment: 'old', spellSlots: { 1: { totalSlots: 4, expendedSlots: 0 } } };
  const local = { ...base, equipment: 'new sword' };
  const server = { ...base, hpCurrent: 5, conditions: ['prone'], spellSlots: { 1: { totalSlots: 4, expendedSlots: 2 } } };

  const merged = mergeServerGameState(local, server, base);

  assert.equal(merged.equipment, 'new sword');
  assert.equal(merged.hpCurrent, 5);
  assert.deepEqual(merged.conditions, ['prone']);
  assert.deepEqual(merged.spellSlots[1], { totalSlots: 4, expendedSlots: 2 });
});

test('both sides changed the same field: the player\'s value is kept', () => {
  const base = { ...makeBase(), hpMax: 20, hpCurrent: 20 };
  const merged = mergeServerGameState({ ...base, hpCurrent: 12 }, { ...base, hpCurrent: 5 }, base);
  assert.equal(merged.hpCurrent, 12);
});

test('experience on a campaign version always comes from the server', () => {
  const base = { ...makeBase(), experiencePoints: 100 };
  const merged = mergeServerGameState({ ...base, experiencePoints: 999 }, { ...base, experiencePoints: 400 }, base, { serverOwnsExperience: true });
  assert.equal(merged.experiencePoints, 400);
});

test('without a base the server still wins (old behaviour)', () => {
  const merged = mergeServerGameState({ ...makeBase(), hpCurrent: 20 }, { hpCurrent: 7 });
  assert.equal(merged.hpCurrent, 7);
});
