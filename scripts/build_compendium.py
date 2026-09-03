import os
import json
import re
import urllib.request

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

def fetch_json(url):
    print(f"Fetching: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def strip_tags(text):
    if not text:
        return ""
    text = re.sub(r'\{@[a-zA-Z]+\s+([^}|]+)(?:\|[^}]*)?\}', r'\1', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

print("Starting Compendium Builder...")

# ── 1. SPELLS ──
print("Building Spells...")
srd_spells = fetch_json("https://raw.githubusercontent.com/5e-bits/5e-database/master/src/2014/en/5e-SRD-Spells.json") or []
ru_spells_data = fetch_json("https://raw.githubusercontent.com/Alexanik/FoundryVTT-dnd5e-lang-ru-RU/master/compendium/dnd5e.spells.json") or {}
ru_spells_entries = {e["id"].lower(): e for e in ru_spells_data.get("entries", [])}

school_map_ru = {
    "Abjuration": "Ограждение",
    "Conjuration": "Вызов",
    "Divination": "Прорицание",
    "Enchantment": "Очарование",
    "Evocation": "Воплощение",
    "Illusion": "Иллюзия",
    "Necromancy": "Некромантия",
    "Transmutation": "Преобразование",
}

class_map_ru = {
    "Wizard": "Волшебник",
    "Sorcerer": "Чародей",
    "Warlock": "Колдун",
    "Cleric": "Жрец",
    "Druid": "Друид",
    "Bard": "Бард",
    "Paladin": "Паладин",
    "Ranger": "Следопыт",
    "Artificer": "Изобретатель",
}

spells_output = []
for s in srd_spells:
    name_en = s.get("name", "")
    ru_entry = ru_spells_entries.get(name_en.lower())
    name_ru = ru_entry["name"] if ru_entry else name_en
    desc_ru = strip_tags(ru_entry.get("description", "")) if ru_entry else " ".join(s.get("desc", []))
    higher_ru = strip_tags(ru_entry.get("higherLevels", "")) if ru_entry and "higherLevels" in ru_entry else " ".join(s.get("higher_level", []))
    
    school_en = s.get("school", {}).get("name", "")
    school_ru = school_map_ru.get(school_en, school_en)
    
    components = s.get("components", [])
    classes = [class_map_ru.get(c.get("name"), c.get("name")) for c in s.get("classes", [])]
    
    dmg_info = s.get("damage", {})
    dmg_dice = ""
    dmg_type = ""
    if "damage_at_slot_level" in dmg_info:
        dmg_dice = dmg_info["damage_at_slot_level"].get(str(s.get("level", 1)), "")
    elif "damage_at_character_level" in dmg_info:
        dmg_dice = dmg_info["damage_at_character_level"].get("1", "")
    if "damage_type" in dmg_info:
        dmg_type = dmg_info["damage_type"].get("name", "").lower()

    save_info = s.get("dc", {})
    save_type = save_info.get("dc_type", {}).get("name", "")
    
    spells_output.append({
        "name": name_ru,
        "nameEn": name_en,
        "level": s.get("level", 0),
        "school": school_ru,
        "castingTime": s.get("casting_time", "1 действие"),
        "range": s.get("range", "На себя"),
        "components": {
            "v": "V" in components,
            "s": "S" in components,
            "m": s.get("material", "") if "M" in components else ""
        },
        "duration": s.get("duration", "Мгновенная"),
        "concentration": s.get("concentration", False),
        "ritual": s.get("ritual", False),
        "damage": dmg_dice,
        "damageType": dmg_type,
        "save": save_type,
        "classes": classes,
        "description": desc_ru,
        "higherLevels": higher_ru
    })

extra_spells = [
    {
        "name": "Мистический заряд",
        "nameEn": "Eldritch Blast",
        "level": 0,
        "school": "Воплощение",
        "castingTime": "1 действие",
        "range": "120 футов",
        "components": { "v": True, "s": True },
        "duration": "Мгновенная",
        "concentration": False,
        "ritual": False,
        "damage": "1d10",
        "damageType": "силовое поле",
        "save": "",
        "classes": ["Колдун"],
        "description": "Луч потрескивающей энергии устремляется к существу в пределах дистанции. Совершите дальнобойную атаку заклинанием по цели. При попадании цель получает 1d10 силового урона.",
        "higherLevels": "Заклинание создаёт больше одного луча на более высоких уровнях: два на 5-м уровне, три на 11-м уровне и четыре на 17-м уровне."
    },
    {
        "name": "Погребальный звон",
        "nameEn": "Toll the Dead",
        "level": 0,
        "school": "Некромантия",
        "castingTime": "1 действие",
        "range": "60 футов",
        "components": { "v": True, "s": True },
        "duration": "Мгновенная",
        "concentration": False,
        "ritual": False,
        "damage": "1d8 / 1d12",
        "damageType": "некротический",
        "save": "Мудрость",
        "classes": ["Жрец", "Волшебник", "Колдун"],
        "description": "Вы указываете на существо в пределах дистанции. Звук скорбного колокола разносится в воздухе. Цель должна преуспеть в спасброске Мудрости или получить 1d8 некротического урона. Если у цели не все хиты, урон равен 1d12.",
        "higherLevels": "Урон увеличивается на 1 кость на 5-м (2d8/2d12), 11-м (3d8/3d12) и 17-м (4d8/4d12) уровнях."
    },
    {
        "name": "Хаос-болт",
        "nameEn": "Chaos Bolt",
        "level": 1,
        "school": "Воплощение",
        "castingTime": "1 действие",
        "range": "120 футов",
        "components": { "v": True, "s": True },
        "duration": "Мгновенная",
        "concentration": False,
        "ritual": False,
        "damage": "2d8 + 1d6",
        "damageType": "случайный",
        "save": "",
        "classes": ["Чародей"],
        "description": "Вы швыряете колышущийся сгусток хаотической энергии. Совершите дальнобойную атаку заклинанием. При попадании цель получает 2d8 урона + 1d6 урона.",
        "higherLevels": "Каждый круг выше 1-го добавляет 1d6 урона."
    },
    {
        "name": "Гекс",
        "nameEn": "Hex",
        "level": 1,
        "school": "Очарование",
        "castingTime": "1 бонусное действие",
        "range": "90 футов",
        "components": { "v": True, "s": True, "m": "окаменевший глаз тритона" },
        "duration": "Концентрация, до 1 часа",
        "concentration": True,
        "ritual": False,
        "damage": "1d6",
        "damageType": "некротический",
        "save": "",
        "classes": ["Колдун"],
        "description": "Вы накладываете проклятие на существо в пределах дистанции. Вы наносите дополнительные 1d6 некротического урона цели при каждом попадании атакой.",
        "higherLevels": "На 3-м или 4-м круге концентрация длится до 8 часов; на 5-м круге и выше — до 24 часов."
    }
]

existing_names = set(s["name"].lower() for s in spells_output)
for es in extra_spells:
    if es["name"].lower() not in existing_names:
        spells_output.append(es)

spells_output.sort(key=lambda s: (s["level"], s["name"]))

print(f"Total spells compiled: {len(spells_output)}")

with open("src/data/compendium/spells.ts", "w", encoding="utf-8") as f:
    f.write("""// D&D 5e Full Spells Compendium
export interface DndSpell {
  name: string;
  nameEn?: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    v?: boolean;
    s?: boolean;
    m?: string;
  };
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  damage?: string;
  damageType?: string;
  save?: string;
  classes?: string[];
  description: string;
  higherLevels?: string;
}

export const DND_COMPENDIUM_SPELLS: DndSpell[] = """)
    json.dump(spells_output, f, ensure_ascii=False, indent=2)
    f.write(""";

export function findSpellByName(query: string): DndSpell | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return DND_COMPENDIUM_SPELLS.find(s => 
    s.name.toLowerCase() === q || 
    (s.nameEn && s.nameEn.toLowerCase() === q)
  );
}
""")

print("Spells compendium generated successfully!")
