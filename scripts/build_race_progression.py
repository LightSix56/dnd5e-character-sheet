# -*- coding: utf-8 -*-
"""
Builds src/data/compendium/race-progression.ts with official D&D 5e level-scaling
racial and subracial features (Tiefling, Drow, Aasimar, Dragonborn, Hill Dwarf,
Duergar, Genasi, Triton, Gith, Eladrin, Shadar-kai, etc.).
"""

import json

RACE_PROGRESSION_DATA = [
    # Тифлинг (Tiefling)
    {
        "race": "Тифлинг",
        "subrace": None,
        "level": 3,
        "name": "Адское возмездие (Адское наследие)",
        "description": "Вы можете сотворить заклинание «Адское возмездие» (Hellish Rebuke) как заклинание 2-го круга 1 раз в день без траты ячеек заклинаний (базовая характеристика — Харизма).",
        "spell": {"name": "Адское возмездие", "level": 2, "prepared": True}
    },
    {
        "race": "Тифлинг",
        "subrace": None,
        "level": 5,
        "name": "Тьма (Адское наследие)",
        "description": "Вы можете сотворить заклинание «Тьма» (Darkness) 1 раз в день без траты ячеек заклинаний (базовая характеристика — Харизма).",
        "spell": {"name": "Тьма", "level": 2, "prepared": True}
    },

    # Дроу (Темный эльф)
    {
        "race": "Эльф",
        "subrace": "Дроу",
        "level": 3,
        "name": "Огонь фей (Магия дроу)",
        "description": "Вы можете сотворить заклинание «Огонь фей» (Faerie Fire) 1 раз в день без траты ячеек заклинаний (базовая характеристика — Харизма).",
        "spell": {"name": "Огонь фей", "level": 1, "prepared": True}
    },
    {
        "race": "Эльф",
        "subrace": "Дроу",
        "level": 5,
        "name": "Тьма (Магия дроу)",
        "description": "Вы можете сотворить заклинание «Тьма» (Darkness) 1 раз в день без траты ячеек заклинаний (базовая характеристика — Харизма).",
        "spell": {"name": "Тьма", "level": 2, "prepared": True}
    },

    # Аасимар (Aasimar)
    {
        "race": "Аасимар",
        "subrace": "Защитник",
        "level": 3,
        "name": "Сияющая душа (Божественное откровение)",
        "description": "Действием вы высвобождаете небесную энергию на 1 минуту: за вашей спиной появляются крылья света (скорость полёта 30 футов), а также раз в ход вы наносите дополнительный урон излучением, равный ВАШЕМУ УРОВНЮ, к одной атаке или заклинанию (1/длинный отдых).",
        "spell": None
    },
    {
        "race": "Аасимар",
        "subrace": "Каратель",
        "level": 3,
        "name": "Сияющий саван (Божественное откровение)",
        "description": "Действием вы высвобождаете божественную ярость: из ваших глаз и рта льётся свет, аура в 10 футах наносит вам и врагам урон излучением (половина уровня в конце вашего хода), а раз в ход одна атака или заклинание наносит дополнительный урон излучением, равный ВАШЕМУ УРОВНЮ (1/длинный отдых).",
        "spell": None
    },
    {
        "race": "Аасимар",
        "subrace": "Падший",
        "level": 3,
        "name": "Некротический саван (Божественное откровение)",
        "description": "Действием вы высвобождаете тьму: призрачные костяные крылья распахиваются за спиной. Существа в 10 футах проходят спасбросок Харизмы (СЛ 8 + мастерство + ХАР) или становятся испуганными до конца вашего следующего хода. Раз в ход одна атака наносит дополнительный некротический урон, равный ВАШЕМУ УРОВНЮ (1/длинный отдых).",
        "spell": None
    },

    # Драконорожденный (Dragonborn) - масштабирование дыхания
    {
        "race": "Драконорожденный",
        "subrace": None,
        "level": 6,
        "name": "Усиление оружия дыхания (3d6)",
        "description": "Урон вашего расового дыхания дракона увеличивается до 3d6 (СЛ спасброска: 8 + модификатор Телосложения + ваш бонус мастерства).",
        "spell": None
    },
    {
        "race": "Драконорожденный",
        "subrace": None,
        "level": 11,
        "name": "Усиление оружия дыхания (4d6)",
        "description": "Урон вашего расового дыхания дракона увеличивается до 4d6.",
        "spell": None
    },
    {
        "race": "Драконорожденный",
        "subrace": None,
        "level": 16,
        "name": "Усиление оружия дыхания (5d6)",
        "description": "Урон вашего расового дыхания дракона достигает максимума — 5d6!",
        "spell": None
    },

    # Дуэргар (Серый дворф)
    {
        "race": "Дворф",
        "subrace": "Дуэргар",
        "level": 3,
        "name": "Увеличение (Магия дуэргаров)",
        "description": "Вы можете сотворить заклинание «Увеличение/уменьшение» (только Увеличение на себя) 1 раз в день без компонентов и траты ячеек.",
        "spell": {"name": "Увеличение/уменьшение", "level": 2, "prepared": True}
    },
    {
        "race": "Дворф",
        "subrace": "Дуэргар",
        "level": 5,
        "name": "Невидимость (Магия дуэргаров)",
        "description": "Вы можете сотворить заклинание «Невидимость» (только на себя) 1 раз в день без компонентов и траты ячеек.",
        "spell": {"name": "Невидимость", "level": 2, "prepared": True}
    },

    # Эластрин (Эльф фей / Eladrin)
    {
        "race": "Эльф",
        "subrace": "Эладрин",
        "level": 3,
        "name": "Усиленный шаг фей (Сезоны Фейвильда)",
        "description": "При использовании телепортации Шаг фей вы активируете эффект выбранного сезона: Осень (очарование 2 существ), Зима (испуг существа в 5 фт), Весна (телепортация согласного союзника), Лето (урон огнем = мод. Харизмы).",
        "spell": None
    },

    # Шадар-кай (Теневой эльф / Shadar-kai)
    {
        "race": "Эльф",
        "subrace": "Шадар-кай",
        "level": 3,
        "name": "Теневая устойчивость (Благословение Королевы Воронов)",
        "description": "После телепортации Благословением Королевы Воронов вы получаете сопротивление абсолютно ВСЕМУ урону до начала вашего следующего хода.",
        "spell": None
    },

    # Генази (Genasi)
    {
        "race": "Генази",
        "subrace": "Генази огня",
        "level": 3,
        "name": "Пылающие руки (Магия огня)",
        "description": "Вы можете сотворить заклинание «Пылающие руки» как заклинание 1-го круга 1 раз в день (характеристика — Телосложение).",
        "spell": {"name": "Пылающие руки", "level": 1, "prepared": True}
    },
    {
        "race": "Генази",
        "subrace": "Генази воды",
        "level": 3,
        "name": "Создание или уничтожение воды (Магия воды)",
        "description": "Вы можете сотворить заклинание «Создание или уничтожение воды» как заклинание 2-го круга 1 раз в день (характеристика — Телосложение).",
        "spell": {"name": "Создание или уничтожение воды", "level": 2, "prepared": True}
    },
    {
        "race": "Генази",
        "subrace": "Генази воздуха",
        "level": 3,
        "name": "Парение / Левитация (Магия воздуха)",
        "description": "Вы можете сотворить заклинание «Левитация» 1 раз в день без материальных компонентов (характеристика — Телосложение).",
        "spell": {"name": "Левитация", "level": 2, "prepared": True}
    },
    {
        "race": "Генази",
        "subrace": "Генази земли",
        "level": 3,
        "name": "Бесследное передвижение (Магия земли)",
        "description": "Вы можете сотворить заклинание «Бесследное передвижение» 1 раз в день без материальных компонентов (характеристика — Телосложение).",
        "spell": {"name": "Бесследное передвижение", "level": 2, "prepared": True}
    },

    # Тритон (Triton)
    {
        "race": "Тритон",
        "subrace": None,
        "level": 3,
        "name": "Порыв ветра (Магия глубин)",
        "description": "Вы можете сотворить заклинание «Порыв ветра» (Gust of Wind) 1 раз в день (характеристика — Харизма).",
        "spell": {"name": "Порыв ветра", "level": 2, "prepared": True}
    },
    {
        "race": "Тритон",
        "subrace": None,
        "level": 5,
        "name": "Стена воды (Магия глубин)",
        "description": "Вы можете сотворить заклинание «Стена воды» 1 раз в день (характеристика — Харизма).",
        "spell": {"name": "Стена воды", "level": 3, "prepared": True}
    },

    # Юань-ти (Yuan-ti Pureblood)
    {
        "race": "Юань-ти",
        "subrace": None,
        "level": 3,
        "name": "Внушение (Змеиная магия)",
        "description": "Вы можете сотворить заклинание «Внушение» (Suggestion) 1 раз в день (характеристика — Харизма).",
        "spell": {"name": "Внушение", "level": 2, "prepared": True}
    },

    # Гитьянки (Githyanki)
    {
        "race": "Гитьянки",
        "subrace": None,
        "level": 3,
        "name": "Прыжок (Псионика гитьянки)",
        "description": "Вы можете сотворить заклинание «Прыжок» (Jump) на себя 1 раз в день без компонентов (характеристика — Интеллект).",
        "spell": {"name": "Прыжок", "level": 1, "prepared": True}
    },
    {
        "race": "Гитьянки",
        "subrace": None,
        "level": 5,
        "name": "Туманный шаг (Псионика гитьянки)",
        "description": "Вы можете сотворить заклинание «Туманный шаг» (Misty Step) 1 раз в день без компонентов (характеристика — Интеллект).",
        "spell": {"name": "Туманный шаг", "level": 2, "prepared": True}
    },

    # Гитцерай (Githzerai)
    {
        "race": "Гитцерай",
        "subrace": None,
        "level": 3,
        "name": "Щит (Псионика гитцераев)",
        "description": "Вы можете сотворить заклинание «Щит» (Shield) 1 раз в день без компонентов (характеристика — Мудрость).",
        "spell": {"name": "Щит", "level": 1, "prepared": True}
    },
    {
        "race": "Гитцерай",
        "subrace": None,
        "level": 5,
        "name": "Обнаружение мыслей (Псионика гитцераев)",
        "description": "Вы можете сотворить заклинание «Обнаружение мыслей» 1 раз в день без компонентов (характеристика — Мудрость).",
        "spell": {"name": "Обнаружение мыслей", "level": 2, "prepared": True}
    }
]

with open("src/data/compendium/race-progression.ts", "w", encoding="utf-8") as f:
    f.write("""// D&D 5e Race & Subrace Level-Scaling Progression Database
// Complete level-scaling traits: innate spells, breath weapon scaling, Aasimar transformation, Hill Dwarf HP bonus, etc.

export interface RaceProgressionFeature {
  race: string;
  subrace: string | null;
  level: number;
  name: string;
  description: string;
  spell?: { name: string; level: number; prepared: boolean } | null;
}

export const DND_RACE_PROGRESSION: RaceProgressionFeature[] = """)
    json.dump(RACE_PROGRESSION_DATA, f, ensure_ascii=False, indent=2)
    f.write(""";

export function getRacialHPBonusPerLevel(raceName: string, subraceName?: string): number {
  if (!raceName) return 0;
  const r = raceName.toLowerCase();
  const sr = (subraceName || '').toLowerCase();
  // Hill Dwarf (Холмовой дворф): +1 HP per level
  if (r.includes('дворф') && (sr.includes('холм') || sr.includes('hill'))) {
    return 1;
  }
  return 0;
}

export function getRacialFeaturesForLevel(
  raceName: string,
  subraceName: string | undefined,
  level: number
): RaceProgressionFeature[] {
  if (!raceName) return [];
  const r = raceName.trim().toLowerCase();
  const sr = (subraceName || '').trim().toLowerCase();

  return DND_RACE_PROGRESSION.filter(feat => {
    if (feat.level !== level) return false;

    const featRace = feat.race.toLowerCase();
    const raceMatch = r.includes(featRace) || featRace.includes(r);
    if (!raceMatch) return false;

    if (feat.subrace) {
      const featSub = feat.subrace.toLowerCase();
      return sr.includes(featSub) || featSub.includes(sr);
    }

    return true;
  });
}
""")

print("Race progression database generated successfully!")
