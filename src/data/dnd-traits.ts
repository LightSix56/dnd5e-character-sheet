export * from './compendium/feats';
import { DND_COMPENDIUM_FEATS } from './compendium/feats';

export interface DndTrait {
  name: string;
  source: string;
  category: 'Классовое' | 'Расовое' | 'Черта' | 'Прочее';
  summary: string;
  description: string;
}

export const DND_TRAITS: DndTrait[] = DND_COMPENDIUM_FEATS.map(f => ({
  name: f.name,
  source: f.source || (f.category === 'Черта' ? 'Черта (Feat)' : 'Способность'),
  category: f.category,
  summary: f.summary,
  description: f.description
}));

export function findTraitByName(name: string): DndTrait | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return DND_TRAITS.find(t => 
    t.name.toLowerCase() === clean || 
    clean.startsWith(t.name.toLowerCase()) || 
    t.name.toLowerCase().startsWith(clean)
  );
}
