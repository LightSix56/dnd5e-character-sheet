import type { CharacterData, SpellSlotInfo } from './dnd-types';

/**
 * Слияние листа при конфликте сохранения.
 *
 * Во время игры сайт мастера пишет в лист «игровое состояние»: хиты, потраченные ячейки,
 * состояния, опыт. Всё остальное (снаряжение, умения, описание) правит только игрок здесь.
 * Поэтому при конфликте игровое состояние берём с сервера, остальное оставляем локальным.
 */
export const GAME_STATE_FIELDS = [
  'hpCurrent',
  'hpTemp',
  'conditions',
  'concentration',
  'experiencePoints',
  'deathSaveSuccesses',
  'deathSaveFailures',
  'hitDiceSpent',
] as const satisfies readonly (keyof CharacterData)[];

/** Поля, которые повышение уровня выставляет само — после него серверные значения устарели. */
const RESET_BY_LEVEL_UP: readonly string[] = ['hpCurrent', 'hpTemp', 'hitDiceSpent'];

function toCount(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function mergeSpellSlots(
  local: CharacterData['spellSlots'],
  server: unknown
): CharacterData['spellSlots'] {
  if (!server || typeof server !== 'object') return local;
  const serverSlots = server as Record<string, Partial<SpellSlotInfo> | undefined>;
  const result: Record<number, SpellSlotInfo> = {};
  for (const [key, slot] of Object.entries(local || {})) {
    const level = Number(key);
    const fromServer = serverSlots[key];
    if (!slot || !fromServer || typeof fromServer !== 'object') {
      result[level] = slot;
      continue;
    }
    const total = toCount(slot.totalSlots);
    result[level] = {
      ...slot,
      expendedSlots: Math.min(total, toCount(fromServer.expendedSlots)),
    };
  }
  return result;
}

export function mergeServerGameState(
  local: CharacterData,
  server: Partial<CharacterData> | null | undefined
): CharacterData {
  if (!server || typeof server !== 'object') return local;

  const serverLevel = Number(server.level);
  const leveledUpLocally = Number.isFinite(serverLevel) && Number(local.level) > serverLevel;

  const merged: CharacterData = { ...local };
  const target = merged as unknown as Record<string, unknown>;
  const source = server as unknown as Record<string, unknown>;

  for (const field of GAME_STATE_FIELDS) {
    if (!(field in source) || source[field] === undefined) continue;
    if (leveledUpLocally && RESET_BY_LEVEL_UP.includes(field)) continue;
    target[field] = source[field];
  }

  if (!leveledUpLocally && 'spellSlots' in source) {
    merged.spellSlots = mergeSpellSlots(local.spellSlots, source.spellSlots);
  }

  return merged;
}
