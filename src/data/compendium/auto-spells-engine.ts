// D&D 5e Auto-Spells Level Progression Engine
// Automatically grants spells unlocked at specific level-ups:
// 1. Paladin Level 2 Divine Smite
// 2. Subclass expanded / domain / oath / circle / archetype spells
// 3. Innate racial scaling spells (for ALL classes)

import type { CharacterData } from '@/lib/dnd-types';
import { findSpellByName, DND_COMPENDIUM_SPELLS } from './spells';
import { SUBCLASS_EXPANDED_SPELLS } from './class-spells';
import { getRacialFeaturesForLevel } from './race-progression';

export interface AutoGrantedSpell {
  name: string;
  level: number;
  prepared: boolean;
  source: string;
  isRacial?: boolean;
}

/**
 * Returns spells automatically granted to the character upon reaching `newLevel`.
 */
export function getAutoGrantedSpellsForLevel(
  char: CharacterData,
  newLevel: number,
  subclassOverride?: string
): AutoGrantedSpell[] {
  const result: AutoGrantedSpell[] = [];
  const classNameLower = (char.className || '').trim().toLowerCase();

  // 1. Paladin level 2: Divine Smite
  if ((classNameLower === 'паладин' || classNameLower === 'paladin') && newLevel === 2) {
    result.push({
      name: 'Божественная кара',
      level: 1,
      prepared: true,
      source: 'Паладин: Божественная кара',
    });
  }

  // 1b. Warlock Patron bonus cantrips at level 1
  const effectiveSubclassForWarlock = (subclassOverride || char.subclass || '').toLowerCase();
  if (
    (classNameLower === 'колдун' || classNameLower === 'warlock' || classNameLower.includes('колдун')) &&
    newLevel === 1
  ) {
    if (effectiveSubclassForWarlock.includes('небожитель') || effectiveSubclassForWarlock.includes('celestial')) {
      result.push({
        name: 'Священное пламя',
        level: 0,
        prepared: true,
        source: 'Покровитель: Небожитель',
      });
      result.push({
        name: 'Свет',
        level: 0,
        prepared: true,
        source: 'Покровитель: Небожитель',
      });
    }
    if (effectiveSubclassForWarlock.includes('бессмертный') || effectiveSubclassForWarlock.includes('undying')) {
      result.push({
        name: 'Уход за умирающим',
        level: 0,
        prepared: true,
        source: 'Покровитель: Бессмертный',
      });
    }
  }

  // 1c. Arcane Trickster (Мистический ловкач) level 3: Mage Hand (Волшебная рука)
  const isRogue = classNameLower === 'плут' || classNameLower === 'rogue' || classNameLower.includes('плут');
  if (isRogue && newLevel === 3) {
    const subLower = (subclassOverride || char.subclass || '').toLowerCase();
    if (subLower.includes('мистический ловкач') || subLower.includes('arcane trickster')) {
      result.push({
        name: 'Волшебная рука',
        level: 0,
        prepared: true,
        source: 'Архетип: Мистический ловкач',
      });
    }
  }

  // 1d. Barbarian Totem Warrior (Путь тотемного воина) ritual spells
  const isBarbarian = classNameLower === 'варвар' || classNameLower === 'barbarian' || classNameLower.includes('варвар');
  if (isBarbarian) {
    const subLower = (subclassOverride || char.subclass || '').toLowerCase();
    if (subLower.includes('тотем') || subLower.includes('totem')) {
      if (newLevel === 3) {
        result.push({
          name: 'Разговор с животными',
          level: 1,
          prepared: true,
          source: 'Путь тотемного воина: Поиски духа (ритуал)',
        });
        result.push({
          name: 'Общение с животными',
          level: 1,
          prepared: true,
          source: 'Путь тотемного воина: Поиски духа (ритуал)',
        });
      } else if (newLevel === 10) {
        result.push({
          name: 'Общение с природой',
          level: 5,
          prepared: true,
          source: 'Путь тотемного воина: Проводник духов (ритуал)',
        });
      }
    }

    // Path of the Ancestral Guardian: Clairvoyance & Augury at level 10
    if (subLower.includes('предок') || subLower.includes('предков') || subLower.includes('ancestral')) {
      if (newLevel === 10) {
        result.push({
          name: 'Ясновидение',
          level: 3,
          prepared: true,
          source: 'Путь хранителя предков: Совет предков',
        });
        result.push({
          name: 'Гадание',
          level: 2,
          prepared: true,
          source: 'Путь хранителя предков: Совет предков',
        });
      }
    }

    // Path of Wild Magic: Detect Magic at level 3
    if (subLower.includes('дикой магии') || subLower.includes('wild-magic') || subLower.includes('wild magic')) {
      if (newLevel === 3) {
        result.push({
          name: 'Обнаружение магии',
          level: 1,
          prepared: true,
          source: 'Путь дикой магии: Магическое чутьё',
        });
      }
    }
  }

  // 1e. Wizard subclasses (Школа Иллюзии, Школа Некромантии, Школа Преобразования)
  const isWizard = classNameLower === 'волшебник' || classNameLower === 'wizard' || classNameLower.includes('волшебник');
  if (isWizard) {
    const subLower = (subclassOverride || char.subclass || '').toLowerCase();
    // School of Illusion: Minor Illusion at level 2
    if (subLower.includes('иллюзи') || subLower.includes('illusion')) {
      if (newLevel === 2) {
        result.push({
          name: 'Малая иллюзия',
          level: 0,
          prepared: true,
          source: 'Школа Иллюзии: Улучшенная малая иллюзия',
        });
      }
    }

    // School of Necromancy: Animate Dead at level 6
    if (subLower.includes('некромант') || subLower.includes('necromanc')) {
      if (newLevel === 6) {
        result.push({
          name: 'Восставший труп',
          level: 3,
          prepared: false,
          source: 'Школа Некромантии: Неживые рабы',
        });
      }
    }

    // School of Transmutation: Polymorph at level 10
    if (subLower.includes('преобразован') || subLower.includes('transmut')) {
      if (newLevel === 10) {
        result.push({
          name: 'Превращение',
          level: 4,
          prepared: false,
          source: 'Школа Преобразования: Преобразователь формы',
        });
      }
    }
  }

  // 1e. Ranger archetype bonus cantrips at level 3
  const isRanger = classNameLower === 'следопыт' || classNameLower === 'ranger' || classNameLower.includes('следопыт');
  if (isRanger && newLevel === 3) {
    const subLower = (subclassOverride || char.subclass || '').toLowerCase();
    if (subLower.includes('роя') || subLower.includes('swarm')) {
      result.push({
        name: 'Волшебная рука',
        level: 0,
        prepared: true,
        source: 'Архетип: Хранитель роя',
      });
    }
    if (subLower.includes('дрейк') || subLower.includes('дракон') || subLower.includes('drake')) {
      result.push({
        name: 'Волшебство',
        level: 0,
        prepared: true,
        source: 'Архетип: Драконий страж',
      });
    }
  }

  // 1f. Shadow Magic Sorcerer (Теневая магия) level 3: Darkness (Тьма)
  const isSorcerer = classNameLower === 'чародей' || classNameLower === 'sorcerer' || classNameLower.includes('чародей');
  if (isSorcerer && newLevel === 3) {
    const subLower = (subclassOverride || char.subclass || '').toLowerCase();
    if (subLower.includes('тень') || subLower.includes('теневая') || subLower.includes('shadow')) {
      result.push({
        name: 'Тьма',
        level: 2,
        prepared: true,
        source: 'Теневая магия: Глаза тьмы',
      });
    }
  }

  // 2. Subclass expanded spells
  const effectiveSubclass = (subclassOverride || char.subclass || '').trim();
  if (effectiveSubclass) {
    const subLower = effectiveSubclass.toLowerCase();
    let matchedSubKey: string | undefined;
    let bonusSpells: string[] | undefined;

    for (const [key, spells] of Object.entries(SUBCLASS_EXPANDED_SPELLS)) {
      const k = key.toLowerCase();
      if (subLower === k || subLower.includes(k) || k.includes(subLower)) {
        matchedSubKey = key;
        bonusSpells = spells;
        break;
      }
    }

    if (bonusSpells && matchedSubKey) {
      let category: 'paladin' | 'cleric' | 'druid' | 'ranger' | 'artificer' | 'sorcerer' | null = null;
      if (classNameLower.includes('паладин') || classNameLower.includes('paladin')) {
        category = 'paladin';
      } else if (classNameLower.includes('жрец') || classNameLower.includes('cleric')) {
        category = 'cleric';
      } else if (classNameLower.includes('друид') || classNameLower.includes('druid')) {
        category = 'druid';
      } else if (classNameLower.includes('следопыт') || classNameLower.includes('ranger')) {
        category = 'ranger';
      } else if (classNameLower.includes('изобретатель') || classNameLower.includes('artificer')) {
        category = 'artificer';
      } else if (classNameLower.includes('чародей') || classNameLower.includes('sorcerer')) {
        category = 'sorcerer';
      } else {
        // Infer from subclass key
        if (matchedSubKey.startsWith('клятва') || matchedSubKey === 'клятвопреступник') {
          category = 'paladin';
        } else if (matchedSubKey.startsWith('домен')) {
          category = 'cleric';
        } else if (matchedSubKey.startsWith('круг')) {
          category = 'druid';
        } else if (['сумрачный охотник', 'странник горизонта', 'убийца чудовищ', 'странник фей', 'фейский странник', 'хранитель роя'].includes(matchedSubKey)) {
          category = 'ranger';
        } else if (['алхимик', 'артиллерист', 'боевой кузнец'].includes(matchedSubKey)) {
          category = 'artificer';
        }
      }

      let targetCircle = 0;
      let spellNames: string[] = [];

      if (category === 'paladin') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'cleric') {
        if (newLevel === 1) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 3) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 5) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 7) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 9) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'druid') {
        const isLand = matchedSubKey === 'круг земли';
        if (newLevel === 3) { targetCircle = 2; spellNames = isLand ? bonusSpells.slice(0, 2) : bonusSpells.slice(2, 4); }
        else if (newLevel === 5) { targetCircle = 3; spellNames = isLand ? bonusSpells.slice(4, 6) : bonusSpells.slice(4, 6); }
        else if (newLevel === 7) { targetCircle = 4; spellNames = isLand ? bonusSpells.slice(8, 10) : bonusSpells.slice(6, 8); }
        else if (newLevel === 9) { targetCircle = 5; spellNames = isLand ? bonusSpells.slice(12, 14) : (bonusSpells.length >= 10 ? bonusSpells.slice(8, 10) : bonusSpells.slice(6, 8)); }
      } else if (category === 'ranger') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 1); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(1, 2); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(2, 3); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(3, 4); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(4, 5); }
      } else if (category === 'artificer') {
        if (newLevel === 3) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
        else if (newLevel === 5) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
        else if (newLevel === 9) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
        else if (newLevel === 13) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
        else if (newLevel === 17) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
      } else if (category === 'sorcerer') {
        const isAberrant = matchedSubKey.includes('аберра') || matchedSubKey.includes('aberrant');
        if (isAberrant) {
          if (newLevel === 1) { targetCircle = 1; spellNames = bonusSpells.slice(0, 3); }
          else if (newLevel === 3) { targetCircle = 2; spellNames = bonusSpells.slice(3, 5); }
          else if (newLevel === 5) { targetCircle = 3; spellNames = bonusSpells.slice(5, 7); }
          else if (newLevel === 7) { targetCircle = 4; spellNames = bonusSpells.slice(7, 9); }
          else if (newLevel === 9) { targetCircle = 5; spellNames = bonusSpells.slice(9, 11); }
        } else {
          if (newLevel === 1) { targetCircle = 1; spellNames = bonusSpells.slice(0, 2); }
          else if (newLevel === 3) { targetCircle = 2; spellNames = bonusSpells.slice(2, 4); }
          else if (newLevel === 5) { targetCircle = 3; spellNames = bonusSpells.slice(4, 6); }
          else if (newLevel === 7) { targetCircle = 4; spellNames = bonusSpells.slice(6, 8); }
          else if (newLevel === 9) { targetCircle = 5; spellNames = bonusSpells.slice(8, 10); }
        }
      }

      for (const sName of spellNames) {
        const sp = findSpellByName(sName);
        const lvl = sp ? sp.level : (sName.toLowerCase().includes('расщепление разума') ? 0 : targetCircle);
        result.push({
          name: sName,
          level: lvl,
          prepared: true,
          source: 'Архетип: ' + effectiveSubclass,
        });
      }
    }
  }

  // 3. Racial scaling spells (runs for ALL characters, including martial)
  if (char.race) {
    const racialFeatures = getRacialFeaturesForLevel(char.race, char.subrace, newLevel);
    for (const rf of racialFeatures) {
      if (rf.spell) {
        result.push({
          name: rf.spell.name,
          level: rf.spell.level,
          prepared: true,
          isRacial: true,
          source: 'Раса: ' + rf.name,
        });
      }
    }
  }

  return result;
}
