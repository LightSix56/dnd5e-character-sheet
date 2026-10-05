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

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function mergeSpellSlots(
  local: CharacterData['spellSlots'],
  server: unknown,
  base: CharacterData['spellSlots'] | null | undefined
): CharacterData['spellSlots'] {
  if (!server || typeof server !== 'object') return local;
  const serverSlots = server as Record<string, Partial<SpellSlotInfo> | undefined>;
  const baseSlots = (base ?? null) as Record<string, Partial<SpellSlotInfo> | undefined> | null;
  const result: Record<number, SpellSlotInfo> = {};
  for (const [key, slot] of Object.entries(local || {})) {
    const level = Number(key);
    const fromServer = serverSlots[key];
    if (!slot || !fromServer || typeof fromServer !== 'object') {
      result[level] = slot;
      continue;
    }
    // Игрок сам менял потраченные ячейки этого уровня (отдых, пометка) — его значение остаётся
    const touchedLocally = baseSlots !== null && toCount(slot.expendedSlots) !== toCount(baseSlots[key]?.expendedSlots);
    if (touchedLocally) {
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

/**
 * Сливает игровое состояние с сервера в локальный лист.
 *
 * base — лист, каким он был при последней синхронизации с облаком. Если он известен,
 * слияние трёхстороннее: серверное значение берётся только для тех полей, которые игрок
 * сам не менял. Так долгий отдых, сделанный на листе, не отменяется тем, что мастер
 * в это же время начислил опыт. Без base (после перезагрузки страницы) побеждает сервер.
 *
 * serverOwnsExperience — версия для кампании: опыт начисляет только мастер.
 */
export function mergeServerGameState(
  local: CharacterData,
  server: Partial<CharacterData> | null | undefined,
  base?: CharacterData | null,
  options: { serverOwnsExperience?: boolean } = {}
): CharacterData {
  if (!server || typeof server !== 'object') return local;

  const serverLevel = Number(server.level);
  const leveledUpLocally = Number.isFinite(serverLevel) && Number(local.level) > serverLevel;

  const merged: CharacterData = { ...local };
  const target = merged as unknown as Record<string, unknown>;
  const source = server as unknown as Record<string, unknown>;
  const baseline = (base ?? null) as unknown as Record<string, unknown> | null;
  const localValues = local as unknown as Record<string, unknown>;

  for (const field of GAME_STATE_FIELDS) {
    if (!(field in source) || source[field] === undefined) continue;
    if (leveledUpLocally && RESET_BY_LEVEL_UP.includes(field)) continue;
    const serverAlwaysWins = field === 'experiencePoints' && options.serverOwnsExperience;
    const touchedLocally = baseline !== null && !sameValue(localValues[field], baseline[field]);
    if (touchedLocally && !serverAlwaysWins) continue;
    target[field] = source[field];
  }

  if (!leveledUpLocally && 'spellSlots' in source) {
    merged.spellSlots = mergeSpellSlots(local.spellSlots, source.spellSlots, base?.spellSlots);
  }

  return merged;
}
