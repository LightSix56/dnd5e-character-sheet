export * from './compendium/spells';
import { DND_COMPENDIUM_SPELLS, findSpellByName as findCompSpell, type DndSpell } from './compendium/spells';

export const DND_SPELLS: DndSpell[] = DND_COMPENDIUM_SPELLS;
export const findSpellByName = findCompSpell;
