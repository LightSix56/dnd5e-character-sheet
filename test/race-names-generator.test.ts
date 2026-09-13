import test from 'node:test';
import * as assert from 'node:assert/strict';
import {
  generateRaceFantasyName,
  lookupRaceNamingEntry
} from '../src/data/compendium/names-data';
import { createDefaultCharacter } from '../src/lib/dnd-types';

test('CharacterData: createDefaultCharacter initializes default gender to "Мужской"', () => {
  const char = createDefaultCharacter();
  assert.equal(char.gender, 'Мужской');
});

test('Race Names DB: Authentic PHB & Core races have hasOfficialRacialNames === true', () => {
  const officialRaces = [
    'human',
    'dwarf',
    'elf',
    'gnome',
    'halfling',
    'half-orc',
    'dragonborn',
    'tiefling',
    'leonin',
    'loxodon',
    'vedalken',
    'warforged',
    'kalashtar',
    'yuan-ti-pureblood'
  ];

  for (const raceId of officialRaces) {
    const entry = lookupRaceNamingEntry(raceId);
    assert.ok(entry, `Race entry for ${raceId} should exist in compendium names db`);
    assert.equal(
      entry.hasOfficialRacialNames,
      true,
      `Race ${raceId} must have hasOfficialRacialNames === true`
    );
  }
});

test('generateRaceFantasyName: Generates authentic male name for Dwarf with isOfficial: true', () => {
  const result = generateRaceFantasyName('dwarf', undefined, 'Мужской');
  assert.equal(result.isOfficial, true);
  assert.equal(result.warning, undefined);
  assert.ok(result.name.length > 0);
  assert.ok(result.tradition && result.tradition.includes('Дварф'));
});

test('generateRaceFantasyName: Generates authentic female name for Dwarf with isOfficial: true', () => {
  const result = generateRaceFantasyName('dwarf', undefined, 'Женский');
  assert.equal(result.isOfficial, true);
  assert.equal(result.warning, undefined);
  assert.ok(result.name.length > 0);
  assert.ok(result.tradition && result.tradition.includes('Дварф'));
});

test('generateRaceFantasyName: Generates authentic male name for Elf', () => {
  const result = generateRaceFantasyName('elf', undefined, 'Мужской');
  assert.equal(result.isOfficial, true);
  assert.equal(result.warning, undefined);
  assert.ok(result.name.length > 0);
});

test('generateRaceFantasyName: Generates authentic female name for Elf', () => {
  const result = generateRaceFantasyName('elf', undefined, 'Женский');
  assert.equal(result.isOfficial, true);
  assert.equal(result.warning, undefined);
  assert.ok(result.name.length > 0);
});

test('generateRaceFantasyName: Generates authentic name for Human across subcultures', () => {
  const resultMale = generateRaceFantasyName('human', undefined, 'Мужской');
  assert.equal(resultMale.isOfficial, true);
  assert.ok(resultMale.name.length > 0);

  const resultFemale = generateRaceFantasyName('human', undefined, 'Женский');
  assert.equal(resultFemale.isOfficial, true);
  assert.ok(resultFemale.name.length > 0);
});

test('generateRaceFantasyName: Custom Lineage / Fairy returns isOfficial: false with warning', () => {
  const customRes = generateRaceFantasyName('custom-lineage', undefined, 'Мужской');
  assert.equal(customRes.isOfficial, false);
  assert.ok(customRes.warning, 'Warning must be present for custom-lineage');
  assert.ok(
    customRes.warning.includes('отсутствуют отдельные расовые имена'),
    `Warning must state missing official names, got: ${customRes.warning}`
  );
  assert.ok(customRes.name.length > 0);

  const fairyRes = generateRaceFantasyName('fairy', undefined, 'Женский');
  assert.equal(fairyRes.isOfficial, false);
  assert.ok(fairyRes.warning);
  assert.ok(fairyRes.warning.includes('отсутствуют отдельные расовые имена'));
  assert.ok(fairyRes.name.length > 0);
});

test('generateRaceFantasyName: Resolves MPMM variants via aliases to base cultural roots', () => {
  const aasimarMpmm = generateRaceFantasyName('aasimar-mpmm', undefined, 'Мужской');
  assert.ok(aasimarMpmm.name.length > 0);
  assert.equal(aasimarMpmm.isOfficial, true);

  const tabaxiMpmm = generateRaceFantasyName('tabaxi-mpmm', undefined, 'Женский');
  assert.ok(tabaxiMpmm.name.length > 0);
  assert.equal(tabaxiMpmm.isOfficial, true);
});

test('generateRaceFantasyName: Handles unknown / empty race gracefully without throwing', () => {
  const emptyRes = generateRaceFantasyName('', undefined, 'Другой');
  assert.ok(emptyRes.name.length > 0);
  assert.equal(emptyRes.isOfficial, false);
  assert.ok(emptyRes.warning);

  const unknownRes = generateRaceFantasyName('unknown-alien-race-999', undefined, 'Мужской');
  assert.ok(unknownRes.name.length > 0);
  assert.equal(unknownRes.isOfficial, false);
  assert.ok(unknownRes.warning);
});
