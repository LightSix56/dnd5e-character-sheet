/**
 * Пороги опыта D&D 5e (PHB, «Развитие персонажа»).
 * Индекс массива — уровень, значение — сколько опыта нужно, чтобы на нём находиться.
 */
export const XP_THRESHOLDS: readonly number[] = [
  0, // индекс 0 не используется
  0, 300, 900, 2700, 6500,
  14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
];

export const MAX_LEVEL = 20;

function safeLevel(level: unknown): number {
  const n = Math.floor(Number(level));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_LEVEL);
}

function safeXp(xp: unknown): number {
  const n = Math.floor(Number(xp));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Сколько опыта нужно для указанного уровня. */
export function xpRequiredForLevel(level: number): number {
  return XP_THRESHOLDS[safeLevel(level)];
}

/** Хватает ли опыта, чтобы перейти на следующий уровень. */
export function canLevelUpWithXp(level: number, xp: number): boolean {
  const current = safeLevel(level);
  if (current >= MAX_LEVEL) return false;
  return safeXp(xp) >= XP_THRESHOLDS[current + 1];
}

/** Сколько опыта не хватает до следующего уровня (0, если хватает или уровень максимальный). */
export function xpMissingForNextLevel(level: number, xp: number): number {
  const current = safeLevel(level);
  if (current >= MAX_LEVEL) return 0;
  return Math.max(0, XP_THRESHOLDS[current + 1] - safeXp(xp));
}
