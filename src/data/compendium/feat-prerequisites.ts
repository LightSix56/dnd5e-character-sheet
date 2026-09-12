import { CompendiumFeat } from './feats';

export interface CharacterPrereqContext {
  stats?: Record<string, number>;
  level?: number;
  race?: string;
  subrace?: string;
  className?: string;
  armorProficiencies?: string[];
  canCastSpells?: boolean;
  existingFeatNames?: string[];
  background?: string;
}

export interface PrerequisiteCheckResult {
  satisfied: boolean;
  unmetReason?: string;
  requirementText?: string;
}

/**
 * Checks whether a character satisfies the prerequisites of a feat (D&D 5e official rules).
 * Returns `satisfied: true` if all conditions are met or if the feat has no requirements.
 * Returns `satisfied: false` with a clear human-readable `unmetReason` otherwise.
 */
export function checkFeatPrerequisites(
  feat: CompendiumFeat,
  context: CharacterPrereqContext
): PrerequisiteCheckResult {
  if (!feat.prerequisite || feat.prerequisite.trim() === '') {
    return { satisfied: true };
  }

  const prereq = feat.prerequisite.trim();
  const lowerPrereq = prereq.toLowerCase();

  // Helper stat getters
  const getStat = (nameRu: string, nameEn: string): number => {
    if (!context.stats) return 10;
    return context.stats[nameRu] ?? context.stats[nameEn] ?? context.stats[nameRu.toUpperCase()] ?? 10;
  };

  // 1. Level Check (e.g., "4 уровень", "4 уровень, ...")
  const levelMatch = prereq.match(/(\d+)\s*уровень/i);
  if (levelMatch) {
    const reqLevel = parseInt(levelMatch[1], 10);
    const charLevel = context.level ?? 1;
    if (charLevel < reqLevel) {
      return {
        satisfied: false,
        unmetReason: `Требуется: ${reqLevel}-й уровень (у вас ${charLevel}-й)`,
        requirementText: prereq,
      };
    }
  }

  // 2. Ability Score Requirements
  if (lowerPrereq.includes('сила 13 или выше')) {
    const val = getStat('СИЛ', 'str');
    if (val < 13) {
      return {
        satisfied: false,
        unmetReason: `Требуется: Сила 13+ (у вас ${val})`,
        requirementText: prereq,
      };
    }
  }

  if (lowerPrereq.includes('ловкость 13 или выше')) {
    const val = getStat('ЛОВ', 'dex');
    if (val < 13) {
      return {
        satisfied: false,
        unmetReason: `Требуется: Ловкость 13+ (у вас ${val})`,
        requirementText: prereq,
      };
    }
  }

  if (lowerPrereq.includes('харизма 13 или выше')) {
    const val = getStat('ХАР', 'cha');
    if (val < 13) {
      return {
        satisfied: false,
        unmetReason: `Требуется: Харизма 13+ (у вас ${val})`,
        requirementText: prereq,
      };
    }
  }

  if (lowerPrereq.includes('интеллект или мудрость 13 или выше')) {
    const intVal = getStat('ИНТ', 'int');
    const wisVal = getStat('МДР', 'wis');
    if (intVal < 13 && wisVal < 13) {
      return {
        satisfied: false,
        unmetReason: `Требуется: Интеллект или Мудрость 13+ (у вас ИНТ ${intVal}, МДР ${wisVal})`,
        requirementText: prereq,
      };
    }
  }

  // 3. Spellcasting Ability
  if (
    lowerPrereq.includes('способность накладывать хотя бы одно заклинание') ||
    lowerPrereq.includes('использование заклинаний') ||
    lowerPrereq.includes('магия договора')
  ) {
    let canCast = context.canCastSpells;
    if (canCast === undefined && context.className) {
      const cls = context.className.toLowerCase();
      const casterClasses = [
        'волшебник', 'чародей', 'колдун', 'жрец', 'друид', 'бард', 'паладин', 'следопыт', 'изобретатель',
        'wizard', 'sorcerer', 'warlock', 'cleric', 'druid', 'bard', 'paladin', 'ranger', 'artificer'
      ];
      canCast = casterClasses.some(c => cls.includes(c));
    }

    if (canCast === false) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Способность накладывать хотя бы одно заклинание',
        requirementText: prereq,
      };
    }
  }

  // 4. Armor Proficiencies
  if (lowerPrereq.includes('владение тяжёлыми доспехами')) {
    const profs = context.armorProficiencies || [];
    const hasHeavy = profs.some(p => /(тяж[её]л|все).*доспех|heavy\s*armor|all\s*armor/i.test(p));
    if (!hasHeavy) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Владение тяжёлыми доспехами',
        requirementText: prereq,
      };
    }
  } else if (lowerPrereq.includes('владение средними доспехами')) {
    const profs = context.armorProficiencies || [];
    const hasMedium = profs.some(p => /(средн|тяж[её]л|все).*доспех|medium\s*armor|heavy\s*armor|all\s*armor/i.test(p));
    if (!hasMedium) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Владение средними доспехами',
        requirementText: prereq,
      };
    }
  } else if (lowerPrereq.includes('владение лёгкими доспехами')) {
    const profs = context.armorProficiencies || [];
    const hasLight = profs.some(p => /(л[её]гк|средн|тяж[её]л|все).*доспех|light\s*armor|medium\s*armor|heavy\s*armor|all\s*armor/i.test(p));
    if (!hasLight) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Владение лёгкими доспехами',
        requirementText: prereq,
      };
    }
  }

  // 4.1. Martial Weapon Proficiency
  if (lowerPrereq.includes('воинским оружием') || lowerPrereq.includes('воинское оружие')) {
    const profs = context.armorProficiencies || [];
    const martialClasses = ['воин', 'паладин', 'следопыт', 'варвар', 'fighter', 'paladin', 'ranger', 'barbarian'];
    const isMartialClass = context.className && martialClasses.some(c => context.className!.toLowerCase().includes(c));
    const hasMartialInProfs = profs.some(p => /воинск|martial/i.test(p));
    const hasBg = context.background && /великаний подкидыш/i.test(context.background);

    if (!isMartialClass && !hasMartialInProfs && !hasBg) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Владение воинским оружием',
        requirementText: prereq,
      };
    }
  }

  // 4.2. Campaign / Background / Specific Class Feats
  if (lowerPrereq.includes('посвящённый в высшее волшебство') || lowerPrereq.includes('посвящение в высшее волшебство')) {
    // Already checked under chained feats or level if chained
  }
  if (lowerPrereq.includes('чародей, волшебник или предыстория «маг высшего волшебства»')) {
    const cls = (context.className || '').toLowerCase();
    const isMage = cls.includes('чародей') || cls.includes('волшебник') || cls.includes('sorcerer') || cls.includes('wizard');
    const bg = (context.background || '').toLowerCase();
    const hasBg = bg.includes('маг высшего волшебства') || bg.includes('mage of high sorcery');
    if (!isMage && !hasBg) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Чародей, Волшебник или предыстория «Маг Высшего Волшебства»',
        requirementText: prereq,
      };
    }
  }
  if (lowerPrereq.includes('воин или паладин или предыстория «соламнийский рыцарь»')) {
    const cls = (context.className || '').toLowerCase();
    const isWarrior = cls.includes('воин') || cls.includes('паладин') || cls.includes('fighter') || cls.includes('paladin');
    const bg = (context.background || '').toLowerCase();
    const hasBg = bg.includes('соламнийский рыцарь') || bg.includes('knight of solamnia');
    if (!isWarrior && !hasBg) {
      return {
        satisfied: false,
        unmetReason: 'Требуется: Воин, Паладин или предыстория «Соламнийский Рыцарь»',
        requirementText: prereq,
      };
    }
  }

  // 5. Racial Restrictions
  const fullRaceStr = `${context.race || ''} ${context.subrace || ''}`.toLowerCase();

  if (context.race) {
    if (lowerPrereq.includes('эльф (дроу)')) {
      if (!fullRaceStr.includes('дроу') && !fullRaceStr.includes('drow')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Дроу (тёмный эльф)',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('эльф (высший)')) {
      if (!fullRaceStr.includes('высш') && !fullRaceStr.includes('high')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Высший эльф',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('эльф (лесной)')) {
      if (!fullRaceStr.includes('лесн') && !fullRaceStr.includes('wood')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Лесной эльф',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('эльф или полуэльф')) {
      if (!fullRaceStr.includes('эльф') && !fullRaceStr.includes('elf')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Эльф или Полуэльф',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.startsWith('эльф') && !lowerPrereq.includes('полуэльф')) {
      if (!fullRaceStr.includes('эльф') || fullRaceStr.includes('полуэльф')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Эльф',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('дварф или маленькая раса')) {
      const isSmallOrDwarf =
        fullRaceStr.includes('дварф') || fullRaceStr.includes('дворф') || fullRaceStr.includes('dwarf') ||
        fullRaceStr.includes('полурослик') || fullRaceStr.includes('гном') || fullRaceStr.includes('кобольд') || fullRaceStr.includes('гоблин');
      if (!isSmallOrDwarf) {
        return {
          satisfied: false,
          unmetReason: 'Требуется: Дварф или Маленькая раса',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('дварф')) {
      if (!fullRaceStr.includes('дварф') && !fullRaceStr.includes('дворф') && !fullRaceStr.includes('dwarf')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Дварф',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('полурослик')) {
      if (!fullRaceStr.includes('полурослик') && !fullRaceStr.includes('halfling')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Полурослик',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('гном (глубинный гном)')) {
      if (!fullRaceStr.includes('глубин') && !fullRaceStr.includes('свирф')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Глубинный гном (Свирфнеблин)',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('гном')) {
      if (!fullRaceStr.includes('гном') && !fullRaceStr.includes('gnome')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Гном',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('драконорождённый')) {
      if (!fullRaceStr.includes('дракон') && !fullRaceStr.includes('dragonborn')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Драконорождённый',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('тифлинг')) {
      if (!fullRaceStr.includes('тифлинг') && !fullRaceStr.includes('tiefling')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Тифлинг',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('полуэльф, полуорк или человек')) {
      const ok = fullRaceStr.includes('полуэльф') || fullRaceStr.includes('полуорк') || fullRaceStr.includes('человек') || fullRaceStr.includes('human');
      if (!ok) {
        return {
          satisfied: false,
          unmetReason: 'Требуется: Полуэльф, Полуорк или Человек',
          requirementText: prereq,
        };
      }
    } else if (lowerPrereq.includes('полуорк')) {
      if (!fullRaceStr.includes('полуорк') && !fullRaceStr.includes('half-orc')) {
        return {
          satisfied: false,
          unmetReason: 'Требуется раса: Полуорк',
          requirementText: prereq,
        };
      }
    }
  }

  // 6. Chained Feats Check (e.g. "черта «...»")
  const featNameMatch = prereq.match(/черта\s*[«"]([^»"]+)[»"]/i);
  if (featNameMatch && context.existingFeatNames) {
    const requiredFeatName = featNameMatch[1].toLowerCase();
    const hasIt = context.existingFeatNames.some(
      n => n.toLowerCase().includes(requiredFeatName) || requiredFeatName.includes(n.toLowerCase())
    );
    if (!hasIt) {
      return {
        satisfied: false,
        unmetReason: `Требуется: черта «${featNameMatch[1]}»`,
        requirementText: prereq,
      };
    }
  }

  return { satisfied: true, requirementText: prereq };
}
