import test from 'node:test';
import assert from 'node:assert/strict';
import { DND_WEAPONS, findWeaponByName } from '../src/data/dnd-weapons.js';
import { getWeaponItems, findItemByName } from '../src/data/compendium/items.js';

test('Weapons Catalog: DND_WEAPONS contains all 37 standard dnd.su weapons', () => {
  assert.equal(DND_WEAPONS.length, 37, 'Must have exactly 37 standard weapons');

  const names = DND_WEAPONS.map(w => w.name);
  assert.ok(names.includes('Длинное копьё'), 'Must include Длинное копьё');
  assert.ok(names.includes('Боевая кирка'), 'Must include Боевая кирка');
  assert.ok(names.includes('Кнут'), 'Must include Кнут');
  assert.ok(names.includes('Сеть'), 'Must include Сеть');
  assert.ok(names.includes('Духовая трубка'), 'Must include Духовая трубка');
  assert.ok(names.includes('Секира'), 'Must include Секира');
  assert.ok(names.includes('Пика'), 'Must include Пика');
  assert.ok(names.includes('Молот'), 'Must include Молот');
});

test('Weapons Catalog: Compendium getWeaponItems() returns all 37 weapons from unified list', () => {
  const compendiumWeapons = getWeaponItems();
  assert.equal(compendiumWeapons.length, 37, 'Compendium must have exactly 37 weapons');

  const compendiumNames = compendiumWeapons.map(w => w.name);
  assert.ok(compendiumNames.includes('Длинное копьё'), 'Compendium must include Длинное копьё');
  assert.ok(compendiumNames.includes('Боевая кирка'), 'Compendium must include Боевая кирка');
  assert.ok(compendiumNames.includes('Кнут'), 'Compendium must include Кнут');
  assert.ok(compendiumNames.includes('Сеть'), 'Compendium must include Сеть');
  assert.ok(compendiumNames.includes('Духовая трубка'), 'Compendium must include Духовая трубка');
  assert.ok(compendiumNames.includes('Секира'), 'Compendium must include Секира');
  assert.ok(compendiumNames.includes('Пика'), 'Compendium must include Пика');
  assert.ok(compendiumNames.includes('Молот'), 'Compendium must include Молот');

  // Verify all 37 weapons in DND_WEAPONS exist identically in Compendium
  for (const w of DND_WEAPONS) {
    const compItem = compendiumWeapons.find(ci => ci.name === w.name);
    assert.ok(compItem, `Weapon ${w.name} must be present in compendium`);
    assert.equal(compItem.category, 'Оружие');
    assert.equal(compItem.weapon?.damageDice, w.damageDice);
    assert.equal(compItem.weapon?.damageType, w.damageType);
  }
});

test('Weapons Catalog: "Длинное копьё" (Lance) has accurate D&D 5e / dnd.su stats', () => {
  const lance = findWeaponByName('Длинное копьё');
  assert.ok(lance, 'Lance must be found by name');
  assert.equal(lance.category, 'Воинское рукопашное');
  assert.equal(lance.damageDice, '1d12');
  assert.equal(lance.damageType, 'колющий');
  assert.ok(lance.properties.includes('Досягаемость'));
  assert.ok(lance.properties.includes('Особое') || lance.properties.includes('особое'));

  const lanceItem = findItemByName('Длинное копьё');
  assert.ok(lanceItem, 'Lance must be found in compendium items');
  assert.equal(lanceItem.weapon?.damageDice, '1d12');
  assert.equal(lanceItem.weapon?.damageType, 'колющий');
});

test('Weapons Catalog: Search supports ё/е normalization and English names', () => {
  // ё vs е normalization
  const lanceWithE = findWeaponByName('длинное копье');
  assert.ok(lanceWithE, 'findWeaponByName should resolve "длинное копье" with "е"');
  assert.equal(lanceWithE?.name, 'Длинное копьё');

  const lanceItemWithE = findItemByName('длинное копье');
  assert.ok(lanceItemWithE, 'findItemByName should resolve "длинное копье" with "е"');
  assert.equal(lanceItemWithE?.name, 'Длинное копьё');

  // English names
  const lanceEn = findWeaponByName('Lance');
  assert.ok(lanceEn, 'findWeaponByName should resolve "Lance"');
  assert.equal(lanceEn?.name, 'Длинное копьё');

  const lanceItemEn = findItemByName('Lance');
  assert.ok(lanceItemEn, 'findItemByName should resolve "Lance"');
  assert.equal(lanceItemEn?.name, 'Длинное копьё');
});

test('Weapons Catalog: Off-hand filtering accurately distinguishes two-handed weapons', () => {
  const compendiumWeapons = getWeaponItems();
  const offHandWeapons = compendiumWeapons.filter(
    i => !(i.weapon?.properties || []).some(p => /двуручное|two-handed/i.test(p))
  );

  const offHandNames = offHandWeapons.map(w => w.name);

  // Must exclude strictly two-handed weapons
  assert.ok(!offHandNames.includes('Двуручный меч'), 'Greatsword cannot be in off-hand');
  assert.ok(!offHandNames.includes('Секира'), 'Greataxe cannot be in off-hand');
  assert.ok(!offHandNames.includes('Алебарда'), 'Halberd cannot be in off-hand');
  assert.ok(!offHandNames.includes('Глефа'), 'Glaive cannot be in off-hand');
  assert.ok(!offHandNames.includes('Молот'), 'Maul cannot be in off-hand');
  assert.ok(!offHandNames.includes('Пика'), 'Pike cannot be in off-hand');
  assert.ok(!offHandNames.includes('Длинный лук'), 'Longbow cannot be in off-hand');
  assert.ok(!offHandNames.includes('Арбалет, тяжёлый'), 'Heavy Crossbow cannot be in off-hand');

  // Must include one-handed weapons
  assert.ok(offHandNames.includes('Кинжал'), 'Dagger must be allowed in off-hand');
  assert.ok(offHandNames.includes('Короткий меч'), 'Shortsword must be allowed in off-hand');
  assert.ok(offHandNames.includes('Скимитар'), 'Scimitar must be allowed in off-hand');
  assert.ok(offHandNames.includes('Ручной топор'), 'Handaxe must be allowed in off-hand');
  assert.ok(offHandNames.includes('Боевой молот'), 'Warhammer (versatile, 1-handed) must be allowed in off-hand');
});

test('Weapons Catalog: Aliases properly resolve to canonical weapon names', () => {
  assert.equal(findWeaponByName('кувалда')?.name, 'Молот');
  assert.equal(findWeaponByName('лэнс')?.name, 'Длинное копьё');
  assert.equal(findWeaponByName('клевец')?.name, 'Боевая кирка');
  assert.equal(findWeaponByName('легкий арбалет')?.name, 'Арбалет, лёгкий');
  assert.equal(findWeaponByName('тяжелый арбалет')?.name, 'Арбалет, тяжёлый');
  assert.equal(findWeaponByName('двуручный топор')?.name, 'Секира');

  // Compendium findItemByName with aliases
  assert.equal(findItemByName('кувалда')?.name, 'Молот');
  assert.equal(findItemByName('лэнс')?.name, 'Длинное копьё');
  assert.equal(findItemByName('клевец')?.name, 'Боевая кирка');
  assert.equal(findItemByName('легкий арбалет')?.name, 'Арбалет, лёгкий');
});

