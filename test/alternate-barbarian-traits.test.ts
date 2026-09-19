import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_TRAITS, findTraitByName } from '../src/data/dnd-traits';

test('Trait Compendium: Exact match priority in findTraitByName', () => {
  // "Неистовство" must resolve to Berserker subclass feature, NOT "Неистовство ледяного великана"
  const frenzy = findTraitByName('Неистовство');
  assert.ok(frenzy, 'Trait "Неистовство" must be found');
  assert.equal(frenzy.name, 'Неистовство');
  assert.ok(frenzy.source.includes('Путь берсерка'), `Expected source to include 'Путь берсерка', got: ${frenzy.source}`);
  assert.equal(frenzy.category, 'Классовое');
  assert.ok(frenzy.description.includes('безрассудной атакой'), 'Description must match Berserker Frenzy');

  // "Неистовство ледяного великана" must resolve to the feat
  const frostGiantFrenzy = findTraitByName('Неистовство ледяного великана');
  assert.ok(frostGiantFrenzy, 'Feat "Неистовство ледяного великана" must still be findable');
  assert.equal(frostGiantFrenzy.name, 'Неистовство ледяного великана');
  assert.equal(frostGiantFrenzy.category, 'Черта');
});

test('Trait Compendium: Alternate Barbarian base class features exist and are discoverable', () => {
  const expectedCoreFeatures = [
    'Защита без доспехов',
    'Ярость',
    'Безрассудная атака',
    'Боевые приёмы',
    'Предчувствие опасности',
    'Дополнительная атака',
    'Звериные инстинкты',
    'Расширение критов',
    'Критический приём',
    'Неудержимый',
    'Нескончаемая ярость',
    'Несокрушимое могущество',
    'Воплощение дикости',
  ];

  for (const featName of expectedCoreFeatures) {
    const t = findTraitByName(featName);
    assert.ok(t, `Core feature "${featName}" must be found in compendium`);
    assert.equal(t.category, 'Классовое');
    assert.ok(t.source.includes('Альтернативный варвар') || t.source.includes('Варвар'), `Source must mention Barbarian for ${featName}`);
  }
});

test('Trait Compendium: Path of the Berserker subclass features exist and are discoverable', () => {
  const expectedBerserkerFeatures = [
    'Приёмы берсерка',
    'Неистовство',
    'Бездумная ярость',
    'Устрашающее присутствие',
    'Непревзойдённый гнев',
  ];

  for (const featName of expectedBerserkerFeatures) {
    const t = findTraitByName(featName);
    assert.ok(t, `Berserker feature "${featName}" must be found in compendium`);
    assert.equal(t.category, 'Классовое');
    assert.ok(t.source.includes('Путь берсерка'), `Source must mention 'Путь берсерка' for ${featName}`);
  }
});

test('Trait Compendium: Only Berserker subclass features are added, no other Alt-Barbarian subclasses', () => {
  // Other subclasses of Alternate Barbarian should NOT be in DND_TRAITS
  const packLeader = DND_TRAITS.find(t => t.name === 'Вой стаи' || t.source.includes('Путь вожака стаи'));
  assert.equal(packLeader, undefined, 'Subclass features from "Путь вожака стаи" must not be in general DND_TRAITS');

  const depths = DND_TRAITS.find(t => t.name === 'Дар глубин' || t.source.includes('Путь глубин'));
  assert.equal(depths, undefined, 'Subclass features from "Путь глубин" must not be in general DND_TRAITS');
});

test('Trait Compendium: Savage Exploits are in general traits compendium', () => {
  const bezzhalostnyy = findTraitByName('Безжалостный удар');
  assert.ok(bezzhalostnyy, 'Savage exploit "Безжалостный удар" must be found');
  assert.equal(bezzhalostnyy.category, 'Классовое');
  assert.ok(bezzhalostnyy.source.includes('приём') || bezzhalostnyy.source.includes('Варвар'));

  // With prefix "Боевой приём: Безжалостный удар"
  const withPrefix = findTraitByName('Боевой приём: Безжалостный удар');
  assert.ok(withPrefix, 'Must also match with "Боевой приём: " prefix');
});
