import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCharacter, CharacterData } from '../src/lib/dnd-types';
import {
  getLevelUpChoicesConfig,
  getThirdCasterSpellSlots,
  METAMAGIC_OPTIONS,
  ELDRITCH_INVOCATIONS,
  HUNTER_PREY_OPTIONS,
  HUNTER_DEFENSE_OPTIONS,
  TOTEM_SPIRIT_OPTIONS,
  TOTEM_ASPECT_OPTIONS,
  BATTLE_MASTER_MANEUVERS,
} from '../src/components/levelup/level-up-choices';

describe('Level-Up Interactive Choices Engine', () => {
  it('Paladin level 2 returns 4 paladin fighting styles', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Паладин',
      level: 1,
    };
    const config = getLevelUpChoicesConfig(char, 2);
    assert.strictEqual(config.needsFightingStyle, true);
    assert.ok(config.fightingStyleOptions);
    assert.strictEqual(config.fightingStyleOptions.length, 4);
    const styleIds = config.fightingStyleOptions.map(o => o.id).sort();
    assert.deepStrictEqual(styleIds, ['defense', 'dueling', 'great-weapon', 'protection'].sort());
  });

  it('Ranger level 2 returns 4 ranger fighting styles', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Следопыт',
      level: 1,
    };
    const config = getLevelUpChoicesConfig(char, 2);
    assert.strictEqual(config.needsFightingStyle, true);
    assert.ok(config.fightingStyleOptions);
    assert.strictEqual(config.fightingStyleOptions.length, 4);
    const styleIds = config.fightingStyleOptions.map(o => o.id).sort();
    assert.deepStrictEqual(styleIds, ['archery', 'defense', 'dueling', 'two-weapon'].sort());
  });

  it('Fighter (Champion) level 10 returns all 6 fighting styles', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Воин',
      subclass: 'Чемпион',
      level: 9,
    };
    const config = getLevelUpChoicesConfig(char, 10);
    assert.strictEqual(config.needsFightingStyle, true);
    assert.ok(config.fightingStyleOptions);
    assert.strictEqual(config.fightingStyleOptions.length, 6);
  });

  it('Bard level 3 and level 10 return needsExpertise: true with expertiseCount: 2', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Бард',
      level: 2,
      skillProficiencies: {
        'Внимательность': true,
        'Убеждение': true,
        'Магия': true,
      },
      skillExpertise: {
        'Магия': true,
      },
    };

    const configLvl3 = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(configLvl3.needsExpertise, true);
    assert.strictEqual(configLvl3.expertiseCount, 2);
    assert.deepStrictEqual(configLvl3.eligibleSkills?.sort(), ['Внимательность', 'Убеждение'].sort());

    const configLvl10 = getLevelUpChoicesConfig(char, 10);
    assert.strictEqual(configLvl10.needsExpertise, true);
    assert.strictEqual(configLvl10.expertiseCount, 2);
  });

  it('Rogue level 6 returns needsExpertise: true with expertiseCount: 2', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Плут',
      level: 5,
      skillProficiencies: {
        'Скрытность': true,
        'Ловкость рук': true,
        'Акробатика': true,
      },
      skillExpertise: {
        'Скрытность': true,
      },
    };

    const config = getLevelUpChoicesConfig(char, 6);
    assert.strictEqual(config.needsExpertise, true);
    assert.strictEqual(config.expertiseCount, 2);
    assert.deepStrictEqual(config.eligibleSkills?.sort(), ['Акробатика', 'Ловкость рук'].sort());
  });

  it('Sorcerer level 3 returns needsMetamagic: 2 and level 10/17 returns 1', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Чародей',
      level: 2,
    };

    const config3 = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(config3.needsMetamagic, true);
    assert.strictEqual(config3.metamagicCount, 2);
    assert.strictEqual(config3.metamagicOptions?.length, 8);

    const config10 = getLevelUpChoicesConfig(char, 10);
    assert.strictEqual(config10.needsMetamagic, true);
    assert.strictEqual(config10.metamagicCount, 1);

    const config17 = getLevelUpChoicesConfig(char, 17);
    assert.strictEqual(config17.needsMetamagic, true);
    assert.strictEqual(config17.metamagicCount, 1);
  });

  it('Warlock level 2 returns 2 invocations and level 5 returns 1 with levelReq filtering', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Колдун',
      level: 1,
    };

    const config2 = getLevelUpChoicesConfig(char, 2);
    assert.strictEqual(config2.needsInvocations, true);
    assert.strictEqual(config2.invocationsCount, 2);
    assert.ok(config2.invocationsOptions);
    // levelReq <= 2 should NOT include thirsting-blade (levelReq: 5)
    assert.strictEqual(config2.invocationsOptions.some(i => i.id === 'thirsting-blade'), false);

    const config5 = getLevelUpChoicesConfig(char, 5);
    assert.strictEqual(config5.needsInvocations, true);
    assert.strictEqual(config5.invocationsCount, 1);
    assert.strictEqual(config5.invocationsOptions?.some(i => i.id === 'thirsting-blade'), true);
  });

  it('Ranger Hunter choices at level 3 and 7', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Следопыт',
      subclass: 'Охотник',
      level: 2,
    };

    const config3 = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(config3.needsHunterChoice, true);
    assert.strictEqual(config3.hunterChoiceTitle, 'Добыча охотника');
    assert.strictEqual(config3.hunterOptions?.length, 3);

    const config7 = getLevelUpChoicesConfig(char, 7);
    assert.strictEqual(config7.needsHunterChoice, true);
    assert.strictEqual(config7.hunterChoiceTitle, 'Оборонительная тактика');
    assert.strictEqual(config7.hunterOptions?.length, 3);
  });

  it('Barbarian Totem choices at level 3 and 6', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Варвар',
      subclass: 'Путь тотемного воина',
      level: 2,
    };

    const config3 = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(config3.needsTotemChoice, true);
    assert.strictEqual(config3.totemChoiceTitle, 'Дух тотема');
    assert.strictEqual(config3.totemOptions?.length, 3);

    const config6 = getLevelUpChoicesConfig(char, 6);
    assert.strictEqual(config6.needsTotemChoice, true);
    assert.strictEqual(config6.totemChoiceTitle, 'Аспект зверя');
    assert.strictEqual(config6.totemOptions?.length, 3);
  });

  it('Fighter Battle Master choices at level 3', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Воин',
      subclass: 'Мастер боевых искусств',
      level: 2,
    };

    const config = getLevelUpChoicesConfig(char, 3);
    assert.strictEqual(config.needsManeuvers, true);
    assert.strictEqual(config.maneuverCount, 3);
    assert.strictEqual(config.maneuverOptions?.length, 8);
  });

  it('subclassOverride parameter works when char.subclass is not yet set', () => {
    const char: CharacterData = {
      ...createDefaultCharacter(),
      className: 'Воин',
      subclass: '',
      level: 2,
    };

    const config = getLevelUpChoicesConfig(char, 3, 'Battle Master');
    assert.strictEqual(config.needsManeuvers, true);
    assert.strictEqual(config.maneuverCount, 3);
  });

  it('getThirdCasterSpellSlots correctly returns slots for 1/3 casters', () => {
    assert.strictEqual(getThirdCasterSpellSlots(1), null);
    assert.strictEqual(getThirdCasterSpellSlots(2), null);
    assert.deepStrictEqual(getThirdCasterSpellSlots(3), { 1: 2 });
    assert.deepStrictEqual(getThirdCasterSpellSlots(4), { 1: 3 });
    assert.deepStrictEqual(getThirdCasterSpellSlots(7), { 1: 4, 2: 2 });
    assert.deepStrictEqual(getThirdCasterSpellSlots(13), { 1: 4, 2: 3, 3: 2 });
    assert.deepStrictEqual(getThirdCasterSpellSlots(19), { 1: 4, 2: 3, 3: 3, 4: 1 });
  });
});
