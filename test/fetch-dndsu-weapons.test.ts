import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWeaponsTableHtml,
  detectWeaponCategoryPlaceholder,
  type ParsedWeapon
} from '../scripts/fetch-dndsu-weapons';

test('dnd.su Weapons Scraper and Placeholder Detection', async (t) => {
  const sampleTableHtml = `
    <table>
      <tr><th>Название</th><th>Стоимость</th><th>Урон</th><th>Вес</th><th>Свойства</th></tr>
      <tr><td colspan="5">Простое рукопашное оружие</td></tr>
      <tr><td>Боевой посох</td><td>2 см</td><td>1к6 дробящий</td><td>4 фнт.</td><td>Универсальное (1к8)</td></tr>
      <tr><td>Кинжал</td><td>2 зм</td><td>1к4 колющий</td><td>1 фнт.</td><td>Дистанция (20/60), Лёгкое, Метательное, Фехтовальное</td></tr>
      <tr><td colspan="5">Простое дальнобойное оружие</td></tr>
      <tr><td>Короткий лук</td><td>25 зм</td><td>1к6 колющий</td><td>2 фнт.</td><td>Боеприпас (дис. 80/320), Двуручное</td></tr>
      <tr><td colspan="5">Воинское рукопашное оружие</td></tr>
      <tr><td>Длинный меч</td><td>15 зм</td><td>1к8 рубящий</td><td>3 фнт.</td><td>Универсальное (1к10)</td></tr>
      <tr><td>Рапира</td><td>25 зм</td><td>1к8 колющий</td><td>2 фнт.</td><td>Фехтовальное</td></tr>
      <tr><td colspan="5">Воинское дальнобойное оружие</td></tr>
      <tr><td>Длинный лук</td><td>50 зм</td><td>1к8 колющий</td><td>2 фнт.</td><td>Боеприпас (дис. 150/600), Двуручное, Тяжёлое</td></tr>
    </table>
  `;

  await t.test('1. parseWeaponsTableHtml extracts weapons by category', () => {
    const weapons = parseWeaponsTableHtml(sampleTableHtml);
    assert.equal(weapons.length, 6);

    const staff = weapons.find(w => w.name === 'Боевой посох');
    assert.ok(staff);
    assert.equal(staff.category, 'Простое рукопашное');
    assert.equal(staff.damageDice, '1d6');
    assert.equal(staff.damageType, 'дробящий');
    assert.equal(staff.cost, '2 см');
    assert.equal(staff.weight, '4 фнт.');
    assert.ok(staff.properties.includes('Универсальное (1к8)'));

    const dagger = weapons.find(w => w.name === 'Кинжал');
    assert.ok(dagger);
    assert.equal(dagger.category, 'Простое рукопашное');
    assert.equal(dagger.damageDice, '1d4');
    assert.equal(dagger.damageType, 'колющий');
    assert.ok(dagger.finesse, 'Dagger has finesse');

    const sword = weapons.find(w => w.name === 'Длинный меч');
    assert.ok(sword);
    assert.equal(sword.category, 'Воинское рукопашное');

    const bow = weapons.find(w => w.name === 'Длинный лук');
    assert.ok(bow);
    assert.equal(bow.category, 'Воинское дальнобойное');
  });

  await t.test('2. detectWeaponCategoryPlaceholder accurately detects generic weapon choices', () => {
    // Martial melee
    const mMelee = detectWeaponCategoryPlaceholder('любое воинское рукопашное оружие');
    assert.equal(mMelee.needed, true);
    assert.equal(mMelee.category, 'Воинское рукопашное');

    // Simple any
    const sAny = detectWeaponCategoryPlaceholder('любое простое оружие');
    assert.equal(sAny.needed, true);
    assert.equal(sAny.category, 'Простое');

    // Martial any with shield
    const mShield = detectWeaponCategoryPlaceholder('воинское оружие и щит');
    assert.equal(mShield.needed, true);
    assert.equal(mShield.category, 'Воинское');
    assert.equal(mShield.hasShield, true);

    // Two martial weapons
    const twoMartial = detectWeaponCategoryPlaceholder('два воинских оружия');
    assert.equal(twoMartial.needed, true);
    assert.equal(twoMartial.category, 'Воинское');

    // Fixed specific weapon: NOT a placeholder
    const fixedAxe = detectWeaponCategoryPlaceholder('секира');
    assert.equal(fixedAxe.needed, false);

    const fixedSwords = detectWeaponCategoryPlaceholder('два ручных топора');
    assert.equal(fixedSwords.needed, false);
  });

  await t.test('3. DND_WEAPONS and category getters integrity', async () => {
    const { DND_WEAPONS, getWeaponsByCategory, findWeaponByName, getDefaultWeaponForCategory } = await import('../src/data/dnd-weapons');
    
    // Exactly 37 weapons from dnd.su
    assert.equal(DND_WEAPONS.length, 37);

    // Simple weapons (10 melee + 4 ranged) = 14
    const simple = getWeaponsByCategory('Простое');
    assert.equal(simple.length, 14);

    // Martial weapons (18 melee + 5 ranged) = 23
    const martial = getWeaponsByCategory('Воинское');
    assert.equal(martial.length, 23);

    // Total 14 + 23 = 37
    assert.equal(simple.length + martial.length, 37);

    // findWeaponByName exact & fuzzy tests
    const rapier = findWeaponByName('Рапира');
    assert.ok(rapier);
    assert.equal(rapier.name, 'Рапира');
    assert.equal(rapier.finesse, true);
    assert.equal(rapier.damageDice, '1d8');

    const crossbow = findWeaponByName('легкий арбалет');
    assert.ok(crossbow);
    assert.equal(crossbow.name, 'Арбалет, лёгкий');

    const axe = findWeaponByName('два ручных топора');
    assert.ok(axe);
    assert.equal(axe.name, 'Ручной топор');

    // Default weapons
    assert.equal(getDefaultWeaponForCategory('Воинское рукопашное', 0), 'Длинный меч');
    assert.equal(getDefaultWeaponForCategory('Воинское рукопашное', 1), 'Короткий меч');
    assert.equal(getDefaultWeaponForCategory('Простое', 0), 'Кинжал');
  });
});

