import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSubclassesForClass } from '../src/data/compendium/classes';
import {
  getClassFeaturesForLevel,
  getSpellSlotsForClassLevel,
  getNewCantripsGainedForLevel,
  getNewSpellsLearnedForLevel,
  isClassASILevel,
} from '../src/data/compendium/class-progression';

describe('Rogue (Плут) Subclasses & Progression', () => {
  describe('Batch 1: Core PHB Subclasses (Thief, Assassin, Arcane Trickster)', () => {
    const subclasses = getSubclassesForClass('Плут');

    it('contains Thief (Вор) with all milestone features at levels 3, 9, 13, 17', () => {
      const thief = subclasses.find(s => s.name === 'Вор' || s.nameEn === 'Thief');
      assert.ok(thief, 'Thief subclass must exist');
      const featureLevels = (thief.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (thief.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Быстрые руки')), 'Must have Быстрые руки');
      assert.ok(names.some(n => n.includes('Второе дыхание карманника') || n.includes('Полевая мобильность') || n.includes('Ловкость карманника')), 'Must have Second-Story Work');
      assert.ok(names.some(n => n.includes('Бесшумные шаги') || n.includes('Скрытность в движении')), 'Must have Supreme Sneak');
      assert.ok(names.some(n => n.includes('Использование магических предметов')), 'Must have Use Magic Device');
      assert.ok(names.some(n => n.includes('Воровские рефлексы')), 'Must have Thief Reflexes');
    });

    it('contains Assassin (Убийца) with all milestone features at levels 3, 9, 13, 17', () => {
      const assassin = subclasses.find(s => s.name === 'Убийца' || s.nameEn === 'Assassin');
      assert.ok(assassin, 'Assassin subclass must exist');
      const featureLevels = (assassin.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (assassin.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Ликвидация')), 'Must have Ликвидация');
      assert.ok(names.some(n => n.includes('Бонусные владения') || n.includes('Владение инструментами')), 'Must have bonus proficiencies');
      assert.ok(names.some(n => n.includes('Искусство инфильтрации') || n.includes('Инфильтрация')), 'Must have Infiltration Expertise');
      assert.ok(names.some(n => n.includes('Самозванец')), 'Must have Impostor');
      assert.ok(names.some(n => n.includes('Смертоносный удар')), 'Must have Death Strike');
    });

    it('contains Arcane Trickster (Мистический ловкач) with spellcasting and features at levels 3, 9, 13, 17', () => {
      const trickster = subclasses.find(s => s.name === 'Мистический ловкач' || s.nameEn === 'Arcane Trickster');
      assert.ok(trickster, 'Arcane Trickster subclass must exist');
      const featureLevels = (trickster.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (trickster.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Использование заклинаний')), 'Must have spellcasting');
      assert.ok(names.some(n => n.includes('Ловкость рук волшебной рукой')), 'Must have Mage Hand Legerdemain');
      assert.ok(names.some(n => n.includes('Магическая засада')), 'Must have Magical Ambush');
      assert.ok(names.some(n => n.includes('Универсальный ловкач')), 'Must have Versatile Trickster');
      assert.ok(names.some(n => n.includes('Похититель заклинаний')), 'Must have Spell Thief');
    });

    it('Arcane Trickster progression grants 1/3 caster spell slots and cantrips', () => {
      // Level 3: 3 cantrips (including Mage Hand), 3 spells known, 2 1st-level slots
      assert.strictEqual(getNewCantripsGainedForLevel('Плут', 'Мистический ловкач', 3), 3);
      assert.strictEqual(getNewSpellsLearnedForLevel('Плут', 'Мистический ловкач', 3), 3);
      const slots3 = getSpellSlotsForClassLevel('Плут', 3, 'Мистический ловкач');
      assert.deepStrictEqual(slots3, { 1: 2 });

      // Level 4: 1 new spell learned
      assert.strictEqual(getNewSpellsLearnedForLevel('Плут', 'Мистический ловкач', 4), 1);
      const slots4 = getSpellSlotsForClassLevel('Плут', 4, 'Мистический ловкач');
      assert.deepStrictEqual(slots4, { 1: 3 });

      // Level 7: unlocks 2nd-circle spells
      const slots7 = getSpellSlotsForClassLevel('Плут', 7, 'Мистический ловкач');
      assert.deepStrictEqual(slots7, { 1: 4, 2: 2 });

      // Level 10: gains 4th cantrip
      assert.strictEqual(getNewCantripsGainedForLevel('Плут', 'Мистический ловкач', 10), 1);
    });

    it('Arcane Trickster automatically gets Mage Hand (Волшебная рука) at level 3', async () => {
      const { getAutoGrantedSpellsForLevel } = await import('../src/data/compendium/auto-spells-engine');
      const mockChar = {
        name: 'Trickster Test',
        className: 'Плут',
        level: 2,
        subclass: 'Мистический ловкач',
      } as any;
      const granted = getAutoGrantedSpellsForLevel(mockChar, 3, 'Мистический ловкач');
      assert.ok(
        granted.some(s => s.name === 'Волшебная рука' && s.level === 0),
        'Must auto-grant Волшебная рука at level 3'
      );
    });

    it('Rogue has 6 ASIs including level 10', () => {
      const asiLevels = [4, 8, 10, 12, 16, 19];
      for (let lvl = 1; lvl <= 20; lvl++) {
        assert.strictEqual(
          isClassASILevel('Плут', lvl),
          asiLevels.includes(lvl),
          `Level ${lvl} ASI mismatch for Rogue`
        );
      }
    });
  });

  describe('Batch 2: XGtE / SCAG Subclasses (Swashbuckler, Mastermind, Scout)', () => {
    const subclasses = getSubclassesForClass('Плут');

    it('contains Swashbuckler (Головорез) with all milestone features at levels 3, 9, 13, 17', () => {
      const swashbuckler = subclasses.find(
        s => s.name.includes('Головорез') || s.nameEn === 'Swashbuckler' || s.name.includes('Дуэлянт')
      );
      assert.ok(swashbuckler, 'Swashbuckler subclass must exist');
      const featureLevels = (swashbuckler.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (swashbuckler.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Дерзкая удаль')), 'Must have Fancy Footwork');
      assert.ok(names.some(n => n.includes('Удалая храбрость')), 'Must have Rakish Audacity');
      assert.ok(names.some(n => n.includes('Элегантно и дерзко') || n.includes('Щегольство') || n.includes('Панаш')), 'Must have Panache');
      assert.ok(names.some(n => n.includes('Элегантный манёвр')), 'Must have Elegant Maneuver');
      assert.ok(names.some(n => n.includes('Искусный выпад') || n.includes('Мастер дуэлей')), 'Must have Master Duelist');
    });

    it('contains Mastermind (Мастер интриг) with all milestone features at levels 3, 9, 13, 17', () => {
      const mastermind = subclasses.find(
        s => s.name === 'Мастер интриг' || s.nameEn === 'Mastermind'
      );
      assert.ok(mastermind, 'Mastermind subclass must exist');
      const featureLevels = (mastermind.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (mastermind.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Мастер интриг')), 'Must have Master of Intrigue');
      assert.ok(names.some(n => n.includes('Мастер тактики')), 'Must have Master of Tactics');
      assert.ok(names.some(n => n.includes('Проницательный манипулятор')), 'Must have Insightful Manipulator');
      assert.ok(names.some(n => n.includes('перенаправление') || n.includes('Ложное направление') || n.includes('Вводящее в заблуждение')), 'Must have Misdirection');
      assert.ok(names.some(n => n.includes('Душа из обмана')), 'Must have Soul of Deceit');
    });

    it('contains Scout (Скаут) with all milestone features at levels 3, 9, 13, 17', () => {
      const scout = subclasses.find(s => s.name === 'Скаут' || s.nameEn === 'Scout');
      assert.ok(scout, 'Scout subclass must exist');
      const featureLevels = (scout.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (scout.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Мастер выживания')), 'Must have Survivalist');
      assert.ok(names.some(n => n.includes('Манёвренный боец') || n.includes('Застрельщик')), 'Must have Skirmisher');
      assert.ok(names.some(n => n.includes('Превосходная мобильность')), 'Must have Superior Mobility');
      assert.ok(names.some(n => n.includes('Мастер засад')), 'Must have Ambush Master');
      assert.ok(names.some(n => n.includes('Внезапный удар')), 'Must have Sudden Strike');
    });
  });

  describe('Batch 3: Specialized / TCoE Subclasses (Inquisitive, Phantom, Soulknife)', () => {
    const subclasses = getSubclassesForClass('Плут');

    it('contains Inquisitive (Сыщик) with all milestone features at levels 3, 9, 13, 17', () => {
      const inquisitive = subclasses.find(
        s => s.name === 'Сыщик' || s.nameEn === 'Inquisitive'
      );
      assert.ok(inquisitive, 'Inquisitive subclass must exist');
      const featureLevels = (inquisitive.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (inquisitive.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Проницательный бой')), 'Must have Insightful Fighting');
      assert.ok(names.some(n => n.includes('Внимательный взгляд') || n.includes('Слух на ложь')), 'Must have Ear for Deceit');
      assert.ok(names.some(n => n.includes('Непоколебимое око') || n.includes('Верный глаз')), 'Must have Steady Eye');
      assert.ok(names.some(n => n.includes('Безупречное чутье') || n.includes('Безошибочный глаз')), 'Must have Unerring Eye');
      assert.ok(names.some(n => n.includes('Глаз на слабости') || n.includes('Слабые места')), 'Must have Eye for Weakness');
    });

    it('contains Phantom (Фантом) with all milestone features at levels 3, 9, 13, 17', () => {
      const phantom = subclasses.find(s => s.name === 'Фантом' || s.nameEn === 'Phantom');
      assert.ok(phantom, 'Phantom subclass must exist');
      const featureLevels = (phantom.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (phantom.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Шёпоты мертвецов')), 'Must have Whispers of the Dead');
      assert.ok(names.some(n => n.includes('Загробные вопли') || n.includes('Вопли из могилы')), 'Must have Wails from the Grave');
      assert.ok(names.some(n => n.includes('Жетоны душ') || n.includes('Осколки душ')), 'Must have Tokens of the Departed');
      assert.ok(names.some(n => n.includes('Призрачная прогулка')), 'Must have Ghost Walk');
      assert.ok(names.some(n => n.includes('Смертоносный вопль') || n.includes('Друг смерти')), 'Must have Deaths Friend');
    });

    it('contains Soulknife (Клинок души) with all milestone features at levels 3, 9, 13, 17', () => {
      const soulknife = subclasses.find(
        s => s.name === 'Клинок души' || s.nameEn === 'Soulknife'
      );
      assert.ok(soulknife, 'Soulknife subclass must exist');
      const featureLevels = (soulknife.features || []).map(f => f.level);
      assert.ok(featureLevels.includes(3), 'Must have Level 3 features');
      assert.ok(featureLevels.includes(9), 'Must have Level 9 features');
      assert.ok(featureLevels.includes(13), 'Must have Level 13 features');
      assert.ok(featureLevels.includes(17), 'Must have Level 17 features');

      const names = (soulknife.features || []).map(f => f.name);
      assert.ok(names.some(n => n.includes('Псионическая сила') || n.includes('Псионические клинки') || n.includes('Психические клинки')), 'Must have Psionic Power / Psychic Blades');
      assert.ok(names.some(n => n.includes('Поражающие душу клинки') || n.includes('Клинки души') || n.includes('Телепортация')), 'Must have Soul Blades');
      assert.ok(names.some(n => n.includes('Психическая вуаль') || n.includes('Псионическая завеса')), 'Must have Psychic Veil');
      assert.ok(names.some(n => n.includes('Разрыв разума') || n.includes('Раскол разума')), 'Must have Mind Rend');
    });
  });

  describe('Comprehensive Verification across all 9 Rogue Subclasses', () => {
    const subclasses = getSubclassesForClass('Плут');

    it('has exactly 9 official Rogue subclasses from dnd.su', () => {
      assert.strictEqual(subclasses.length, 9, `Expected 9 subclasses, got ${subclasses.length}`);
    });

    it('every subclass has features for milestone levels [3, 9, 13, 17]', () => {
      const milestones = [3, 9, 13, 17];
      for (const sub of subclasses) {
        const levels = new Set((sub.features || []).map(f => f.level));
        for (const m of milestones) {
          assert.ok(
            levels.has(m),
            `Subclass "${sub.name}" (${sub.nameEn}) is missing level ${m} feature`
          );
        }
      }
    });

    it('can resolve features for levels 1 to 20 for any Rogue subclass', () => {
      for (const sub of subclasses) {
        for (let lvl = 1; lvl <= 20; lvl++) {
          const classFeats = getClassFeaturesForLevel('Плут', lvl);
          assert.ok(Array.isArray(classFeats), `Failed getting class features for level ${lvl}`);
          const subFeats = (sub.features || []).filter(f => f.level === lvl);
          if ([3, 9, 13, 17].includes(lvl)) {
            assert.ok(subFeats.length > 0, `Subclass ${sub.name} must have features at level ${lvl}`);
          }
        }
      }
    });
  });
});


