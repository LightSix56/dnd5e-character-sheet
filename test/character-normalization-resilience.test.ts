import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCharacterData } from '../src/lib/dnd-types';

test('normalizeCharacterData extracts data from nested snapshot without data loss', () => {
  const nestedCharacterSnapshot = {
    id: 'test-uuid-1234',
    name: 'Торгар',
    level: 3,
    className: 'Воин',
    race: 'Дварф',
    portraitUrl: 'https://example.com/portrait.png',
    data: {
      name: 'Торгар',
      className: 'Воин',
      level: 3,
      race: 'Дварф',
      abilityScores: {
        'СИЛ': 16,
        'ЛОВ': 12,
        'ТЕЛ': 16,
        'ИНТ': 10,
        'МДР': 12,
        'ХАР': 8,
      },
      abilityBonuses: {
        'СИЛ': 2,
        'ЛОВ': 0,
        'ТЕЛ': 2,
        'ИНТ': 0,
        'МДР': 0,
        'ХАР': 0,
      },
      asiBonuses: {
        'СИЛ': 0,
        'ЛОВ': 0,
        'ТЕЛ': 0,
        'ИНТ': 0,
        'МДР': 0,
        'ХАР': 0,
      },
      attacks: [
        {
          name: 'Боевой топор',
          attackBonus: '+5',
          damageAndType: '1d8+3 рубящий',
        },
      ],
      spellSlots: {
        1: { totalSlots: 0, expendedSlots: 0 },
      },
    },
  };

  // If normalizeCharacterData does not unwrap nested .data, it will fall back to default empty stats (10s) and default attacks
  const normalized = normalizeCharacterData(nestedCharacterSnapshot as any);

  assert.equal(normalized.name, 'Торгар');
  assert.equal(normalized.className, 'Воин');
  assert.equal(normalized.level, 3);
  assert.equal(normalized.abilityScores['СИЛ'], 16, 'Strength score should be preserved from nested data');
  assert.equal(normalized.abilityBonuses['СИЛ'], 2, 'Racial strength bonus should be preserved from nested data');
  assert.equal(normalized.attacks.length, 1, 'Attacks should be preserved from nested data');
  assert.equal(normalized.attacks[0].name, 'Боевой топор');
});
