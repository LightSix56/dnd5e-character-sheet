// D&D 5e Full Spells Compendium Types
export interface SpellComponentInfo {
  v?: boolean;
  s?: boolean;
  m?: string;
  raw?: string;
  costly?: boolean;
  consumed?: boolean;
}

export interface SpellSubclassInfo {
  name: string;
  class: string;
  raw?: string;
}

export interface SpellSourceInfo {
  code: string;
  name: string;
}

export interface DndSpell {
  id?: string;
  name: string;
  nameEn?: string;
  level: number;
  school: string;
  schoolEn?: string;
  castingTime: string;
  range: string;
  components: SpellComponentInfo;
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  damage?: string;
  damageType?: string;
  save?: string;
  classes?: string[];
  optionalClasses?: string[];
  subclasses?: SpellSubclassInfo[];
  sources?: SpellSourceInfo[];
  sourceBook?: string;
  description: string;
  higherLevels?: string;
  dndsuUrl?: string;
}
