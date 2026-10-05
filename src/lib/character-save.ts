/**
 * Сохранение персонажа с учётом ревизии строки.
 *
 * Лист персонажа теперь меняют с двух сторон: игрок на этом сайте и сайт мастера
 * (итоги боя, опыт). Чтобы одна сторона не затирала запись другой, клиент присылает
 * номер ревизии, с которой он загрузил лист; если в базе ревизия уже другая —
 * сохранение не выполняется и клиент получает свежую строку.
 */

export const CHARACTER_META_COLUMNS =
  'id, name, portrait_url, created_at, updated_at, revision, campaign_id, campaign_name, source_character_id';

export const CHARACTER_COLUMNS =
  'id, name, data, portrait_url, created_at, updated_at, revision, campaign_id, campaign_name, source_character_id';

/** Ревизия из тела запроса: только целое число ≥ 0, всё остальное — «не передана». */
export function parseExpectedRevision(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null;
  return value;
}

export type SaveOutcome = 'updated' | 'conflict' | 'insert';

/**
 * Что произошло после попытки обновить строку по id (и ревизии, если она передана).
 * updatedRow — строка, которую вернул UPDATE; currentRow — строка, найденная повторным
 * чтением по id, когда UPDATE ничего не изменил.
 */
export function decideSaveOutcome(input: {
  expectedRevision: number | null;
  updatedRow: unknown | null | undefined;
  currentRow: unknown | null | undefined;
}): SaveOutcome {
  if (input.updatedRow) return 'updated';
  if (input.currentRow && input.expectedRevision !== null) return 'conflict';
  return 'insert';
}

/** Ошибка Postgres «на строку ссылаются другие таблицы» (участник комнаты). */
export function isForeignKeyViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === '23503');
}

export const CHARACTER_IN_ROOM_MESSAGE =
  'Этот персонаж участвует в комнате. Сначала закройте комнату или выберите в ней другого героя.';

export const SAVE_CONFLICT_MESSAGE = 'Лист изменился на сервере';
