import type { AbilityName } from './dnd-types.js';

export const ALL_DND_ABILITIES: AbilityName[] = ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'];

export interface FeatAbilityBonusConfig {
  options: AbilityName[];
  amount: number;
  isChoice: boolean;
  rawBonusText: string;
}

/**
 * Parses feat ability bonus text (e.g., "+1 СИЛ или ЛОВ", "+1 к любой характеристике", "+1 СИЛ")
 * into a structured FeatAbilityBonusConfig.
 * 
 * Returns null if no ability bonus is found.
 */
export function parseFeatAbilityBonus(bonusText?: string): FeatAbilityBonusConfig | null {
  if (!bonusText || typeof bonusText !== 'string') return null;
  const trimmed = bonusText.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  // Any stat choice
  if (
    lower.includes('любой') ||
    lower.includes('выбранной') ||
    lower.includes('на ваш выбор') ||
    lower.includes('по вашему выбору')
  ) {
    return {
      options: [...ALL_DND_ABILITIES],
      amount: 1,
      isChoice: true,
      rawBonusText: trimmed,
    };
  }

  // Detect specific abilities
  const matched: AbilityName[] = [];
  for (const ab of ALL_DND_ABILITIES) {
    if (trimmed.includes(ab)) {
      matched.push(ab);
    }
  }

  if (matched.length === 0) return null;

  return {
    options: matched,
    amount: 1,
    isChoice: matched.length > 1,
    rawBonusText: trimmed,
  };
}

/**
 * Extracts FeatAbilityBonusConfig directly from a feat object.
 * Checks `feat.abilityBonus` first, then falls back to parsing text if needed.
 */
export function getFeatAbilityBonusFromFeat(feat?: {
  abilityBonus?: string;
  description?: string;
  summary?: string;
} | null): FeatAbilityBonusConfig | null {
  if (!feat) return null;
  if (feat.abilityBonus) {
    const parsed = parseFeatAbilityBonus(feat.abilityBonus);
    if (parsed) return parsed;
  }

  // Fallback check in summary or description
  const text = `${feat.summary || ''} ${feat.description || ''}`;
  if (!text) return null;

  const lower = text.toLowerCase();
  if (lower.includes('увеличьте значение')) {
    if (lower.includes('силы или ловкости')) return { options: ['СИЛ', 'ЛОВ'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ или ЛОВ' };
    if (lower.includes('силы или телосложения')) return { options: ['СИЛ', 'ТЕЛ'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ или ТЕЛ' };
    if (lower.includes('ловкости или интеллекта')) return { options: ['ЛОВ', 'ИНТ'], amount: 1, isChoice: true, rawBonusText: '+1 ЛОВ или ИНТ' };
    if (lower.includes('интеллекта или мудрости')) return { options: ['ИНТ', 'МДР'], amount: 1, isChoice: true, rawBonusText: '+1 ИНТ или МДР' };
    if (lower.includes('интеллекта или харизмы')) return { options: ['ИНТ', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 ИНТ или ХАР' };
    if (lower.includes('мудрости или харизмы')) return { options: ['МДР', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 МДР или ХАР' };
    if (lower.includes('телосложения или мудрости')) return { options: ['ТЕЛ', 'МДР'], amount: 1, isChoice: true, rawBonusText: '+1 ТЕЛ или МДР' };
    if (lower.includes('интеллекта, мудрости или харизмы')) return { options: ['ИНТ', 'МДР', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 ИНТ, МДР или ХАР' };
    if (lower.includes('ловкости, интеллекта, мудрости или харизмы')) return { options: ['ЛОВ', 'ИНТ', 'МДР', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 ЛОВ, ИНТ, МДР или ХАР' };
    if (lower.includes('силы, ловкости или телосложения')) return { options: ['СИЛ', 'ЛОВ', 'ТЕЛ'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ, ЛОВ или ТЕЛ' };
    if (lower.includes('силы, телосложения или мудрости')) return { options: ['СИЛ', 'ТЕЛ', 'МДР'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ, ТЕЛ или МДР' };
    if (lower.includes('силы, телосложения или харизмы')) return { options: ['СИЛ', 'ТЕЛ', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ, ТЕЛ или ХАР' };
    if (lower.includes('силы, мудрости или харизмы')) return { options: ['СИЛ', 'МДР', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 СИЛ, МДР или ХАР' };
    if (lower.includes('телосложения, мудрости или харизмы')) return { options: ['ТЕЛ', 'МДР', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 ТЕЛ, МДР или ХАР' };
    if (lower.includes('ловкости, телосложения или харизмы')) return { options: ['ЛОВ', 'ТЕЛ', 'ХАР'], amount: 1, isChoice: true, rawBonusText: '+1 ЛОВ, ТЕЛ или ХАР' };
    if (
      lower.includes('одной характеристики на ваш выбор') ||
      lower.includes('по вашему выбору на 1') ||
      lower.includes('характеристики по вашему выбору')
    ) {
      return { options: [...ALL_DND_ABILITIES], amount: 1, isChoice: true, rawBonusText: '+1 к любой характеристике' };
    }
  }

  return null;
}
