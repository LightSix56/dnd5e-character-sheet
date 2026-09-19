import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_COMPENDIUM_RACES, findRaceByName } from '../src/data/compendium/races';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass } from '../src/data/compendium/classes';
import { DND_CLASS_PROGRESSION, normalizeClassName, getClassSubclassLevel } from '../src/data/compendium/class-progression';
import { CLASS_TEMPLATES } from '../src/lib/dnd-types';
import { BARBARIAN_EXPLOITS, getExploitsByDegree } from '../src/data/compendium/barbarian-exploits';

test('Race: Scourgeborne (Порождение Бедствия) and Belua subrace exist and conform to schema', () => {
  const race = DND_COMPENDIUM_RACES.find(r => r.id === 'scourgeborne');
  assert.ok(race, 'Scourgeborne race must exist in compendium');
  assert.equal(race.name, 'Порождение Бедствия');
  assert.equal(race.nameEn, 'Scourgeborne');
  assert.equal(race.category, 'setting');
  assert.equal(race.size, 'Средний');
  assert.equal(race.speed, 30);
  assert.equal(race.abilityBonuses['ТЕЛ'], 1, 'Base race grants +1 CON');

  // Base traits
  const traitNames = race.traits.map(t => t.name);
  assert.ok(traitNames.some(n => n.includes('Смертоносные конечности')), 'Must have Deadly Limbs');
  assert.ok(traitNames.some(n => n.includes('Жуткое проклятие')), 'Must have Eldritch Curse');
  assert.ok(traitNames.some(n => n.includes('Рожденный безумием') || n.includes('Рождённый безумием')), 'Must have Born of Madness');

  // Subraces: exactly 4
  assert.ok(race.subraces, 'Must have subraces');
  assert.equal(race.subraces.length, 4, 'Must have exactly 4 subraces');

  const subraceIds = race.subraces.map(s => s.id);
  assert.ok(subraceIds.includes('scourgeborne-belua'), 'Must include Belua');
  assert.ok(subraceIds.includes('scourgeborne-aranea'), 'Must include Aranea');
  assert.ok(subraceIds.includes('scourgeborne-cervus'), 'Must include Cervus');
  assert.ok(subraceIds.includes('scourgeborne-vespertilio'), 'Must include Vespertilio');

  // Inspect Belua specifically
  const belua = race.subraces.find(s => s.id === 'scourgeborne-belua')!;
  assert.equal(belua.name, 'Белуа');
  assert.equal(belua.nameEn, 'Belua');
  assert.equal(belua.abilityBonuses['СИЛ'], 1, 'Belua grants +1 STR');
  assert.equal(belua.choices?.isFlexibleASI, true, 'Belua allows choosing +1 to another ability');

  const beluaTraits = belua.traits.map(t => t.name);
  assert.ok(beluaTraits.some(n => n.includes('Острый слух и тонкий нюх')), 'Belua has Keen Senses');
  assert.ok(beluaTraits.some(n => n.includes('Голодные челюсти')), 'Belua has Hungry Jaws');

  // Verify findRaceByName
  const found = findRaceByName('Порождение Бедствия');
  assert.ok(found, 'findRaceByName must resolve Порождение Бедствия');
  assert.equal(found?.id, 'scourgeborne');
});

test('Class: Alternate Barbarian (laserllama) exists with 19 subclasses and features', () => {
  const altBarbarian = DND_COMPENDIUM_CLASSES.find(c => c.id === 'alt-barbarian');
  assert.ok(altBarbarian, 'Alternate Barbarian class must exist in compendium');
  assert.equal(altBarbarian.name, 'Альтернативный варвар');
  assert.equal(altBarbarian.nameEn, 'Alternate Barbarian');
  assert.equal(altBarbarian.hitDieSize, 12);
  assert.deepEqual(altBarbarian.savingThrowProfs, ['СИЛ', 'ТЕЛ']);
  assert.equal(altBarbarian.subclassLevel, 3);

  // Subclasses: exactly 19
  assert.equal(altBarbarian.subclasses.length, 19, 'Must have all 19 subclasses');

  const expectedSubclasses = [
    'Путь берсерка',
    'Путь вожака стаи',
    'Путь глубин',
    'Путь головореза',
    'Путь драконьей крови',
    'Путь звериного сердца',
    'Путь избранника',
    'Путь крови и стали',
    'Путь кулаков',
    'Путь мутанта',
    'Путь оборотня',
    'Путь пекла',
    'Путь поборника',
    'Путь предков',
    'Путь природы',
    'Путь ревнителя',
    'Путь стихийного хаоса',
    'Путь титана',
    'Путь чародейства'
  ];

  for (const name of expectedSubclasses) {
    const sub = altBarbarian.subclasses.find(s => s.name === name);
    assert.ok(sub, `Subclass "${name}" must exist in Alternate Barbarian`);
    for (const lvl of [3, 6, 10, 14]) {
      const featAtLvl = sub.features.filter(f => f.level === lvl);
      assert.ok(featAtLvl.length > 0, `Subclass "${name}" must have features at level ${lvl}`);
    }
  }
});

test('Progression & Normalization: Alternate Barbarian isolated from standard Barbarian', () => {
  // Check normalization
  assert.equal(normalizeClassName('Альтернативный варвар'), 'Альтернативный варвар');
  assert.equal(normalizeClassName('альтернативный варвар'), 'Альтернативный варвар');
  assert.equal(normalizeClassName('alternate barbarian'), 'Альтернативный варвар');
  assert.equal(normalizeClassName('alt-barbarian'), 'Альтернативный варвар');
  
  // Standard barbarian must NOT be overridden
  assert.equal(normalizeClassName('Варвар'), 'Варвар');
  assert.equal(normalizeClassName('barbarian'), 'Варвар');

  // Progression entries
  const prog = DND_CLASS_PROGRESSION['Альтернативный варвар'];
  assert.ok(prog, 'Progression table for Альтернативный варвар must exist');
  assert.equal(prog.hitDie, 12);
  assert.equal(prog.subclassLevel, 3);
  assert.deepEqual(prog.asiLevels, [4, 8, 12, 16, 19]);
  assert.deepEqual(prog.subclassFeatureLevels, [3, 6, 10, 14]);

  // Check 1-20 levels exist
  for (let lvl = 1; lvl <= 20; lvl++) {
    const feats = prog.featuresByLevel[String(lvl)];
    assert.ok(feats && feats.length > 0, `Features must exist for level ${lvl}`);
  }
});

test('Exploits: Savage Exploits catalog contains 5 degrees and full requirements', () => {
  assert.ok(Array.isArray(BARBARIAN_EXPLOITS), 'BARBARIAN_EXPLOITS must be an array');
  assert.ok(BARBARIAN_EXPLOITS.length >= 50, `Expected at least 50 exploits, got ${BARBARIAN_EXPLOITS.length}`);

  for (let degree = 1; degree <= 5; degree++) {
    const list = getExploitsByDegree(degree as 1 | 2 | 3 | 4 | 5);
    assert.ok(list.length > 0, `Degree ${degree} must contain exploits`);
  }

  for (const exp of BARBARIAN_EXPLOITS) {
    assert.ok(exp.id, 'Exploit must have id');
    assert.ok(exp.name, 'Exploit must have name');
    assert.ok(exp.degree >= 1 && exp.degree <= 5, 'Degree must be between 1 and 5');
    assert.ok(exp.description, `Exploit ${exp.name} must have description`);
  }
});

test('Wizard Template: alt-barbarian template exists in CLASS_TEMPLATES', () => {
  const template = CLASS_TEMPLATES.find(t => t.id === 'alt-barbarian');
  assert.ok(template, 'alt-barbarian template must exist in CLASS_TEMPLATES');
  assert.equal(template.hitDieSize, 12);
  assert.equal(template.primaryAbility, 'СИЛ');
  assert.deepEqual(template.savingThrowProfs, ['СИЛ', 'ТЕЛ']);
});
