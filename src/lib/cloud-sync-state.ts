import { isNamelessCharacter } from './character-validation';

/**
 * Состояние синхронизации локального листа с облаком.
 *
 * Хранится в localStorage рядом с самим персонажем и отвечает на один вопрос при входе:
 * есть ли на этом устройстве правки, которые ещё не попали в облако. Если есть — локальную
 * версию нельзя молча заменять облачной.
 *
 * Сравнение идёт по флагу и отметке updated_at сервера, а не по часам устройства,
 * поэтому расхождение времени между устройствами на результат не влияет.
 */
export const CLOUD_SYNC_KEY = 'dnd5e_cloud_sync';

export interface CloudSyncMeta {
  /** Есть локальные изменения, не подтверждённые сохранением в облако. */
  dirty: boolean;
  /** id облачного персонажа, с которым связан локальный лист. */
  cloudId: string | null;
  /** updated_at этого персонажа на момент последней синхронизации с этого устройства. */
  cloudUpdatedAt: string | null;
  /** Аккаунт, которому принадлежит cloudId. */
  userId: string | null;
  /** Ревизия облачной строки, с которой лист был загружен или последний раз сохранён. */
  cloudRevision: number | null;
}

export const EMPTY_SYNC_META: CloudSyncMeta = {
  dirty: false,
  cloudId: null,
  cloudUpdatedAt: null,
  userId: null,
  cloudRevision: null,
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function readSyncMeta(storage: StorageLike | null | undefined): CloudSyncMeta {
  if (!storage) return { ...EMPTY_SYNC_META };
  try {
    const raw = storage.getItem(CLOUD_SYNC_KEY);
    if (!raw) return { ...EMPTY_SYNC_META };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_SYNC_META };
    return {
      dirty: parsed.dirty === true,
      cloudId: typeof parsed.cloudId === 'string' ? parsed.cloudId : null,
      cloudUpdatedAt: typeof parsed.cloudUpdatedAt === 'string' ? parsed.cloudUpdatedAt : null,
      userId: typeof parsed.userId === 'string' ? parsed.userId : null,
      cloudRevision:
        typeof parsed.cloudRevision === 'number' && Number.isInteger(parsed.cloudRevision) && parsed.cloudRevision >= 0
          ? parsed.cloudRevision
          : null,
    };
  } catch {
    return { ...EMPTY_SYNC_META };
  }
}

export function writeSyncMeta(
  storage: StorageLike | null | undefined,
  patch: Partial<CloudSyncMeta>
): CloudSyncMeta {
  const next = { ...readSyncMeta(storage), ...patch };
  if (storage) {
    try {
      storage.setItem(CLOUD_SYNC_KEY, JSON.stringify(next));
    } catch {
      /* quota exceeded / private mode — состояние останется только в памяти вкладки */
    }
  }
  return next;
}

export interface CloudCharacterSummary {
  id: string;
  name?: string | null;
  updated_at?: string | null;
  /** Заполнено у версии персонажа для кампании: в такую строку пишет ещё и сайт мастера. */
  campaign_id?: string | null;
}

export type LoginSyncDecision<T extends CloudCharacterSummary> =
  /** Локальных правок нет — берём последнюю облачную версию (или ничего, если облако пусто). */
  | { action: 'use-cloud'; character: T | null }
  /**
   * Локальные правки сохраняем. cloudId — куда их записать: в того же облачного персонажа
   * либо (null) отдельной новой записью. conflict — облачную версию успели изменить
   * с другого устройства, поэтому её не перезаписываем.
   */
  | {
      action: 'keep-local';
      cloudId: string | null;
      conflict: boolean;
      /**
       * Версия кампании, которую за это время изменил сайт мастера (итоги боя, опыт).
       * Отдельную копию не создаём: локальные правки сливаются с её игровым состоянием.
       */
      mergeFrom?: T;
    };

function sameInstant(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isFinite(ta) && ta === tb;
}

/** Что делать с локальным листом при входе в аккаунт / загрузке страницы с активной сессией. */
export function resolveLoginSync<T extends CloudCharacterSummary>(input: {
  meta: CloudSyncMeta;
  localName: string | null | undefined;
  userId: string;
  /** Облачные персонажи пользователя, отсортированные от новых к старым. */
  cloudCharacters: T[];
}): LoginSyncDecision<T> {
  const { meta, localName, userId, cloudCharacters } = input;

  // Безымянный черновик в облако не сохраняется, так что терять в нём нечего.
  if (!meta.dirty || isNamelessCharacter(localName)) {
    return { action: 'use-cloud', character: cloudCharacters[0] ?? null };
  }

  const linkedId = meta.userId === userId ? meta.cloudId : null;
  const linked = linkedId ? cloudCharacters.find(c => c.id === linkedId) ?? null : null;

  // Лист ещё не был в облаке этого аккаунта (создан гостем, или запись удалили) — сохраняем как новый.
  if (!linked) return { action: 'keep-local', cloudId: null, conflict: false };

  // Облачную версию не трогали с момента нашей последней синхронизации — просто дописываем правки.
  if (sameInstant(linked.updated_at, meta.cloudUpdatedAt)) {
    return { action: 'keep-local', cloudId: linked.id, conflict: false };
  }

  // Версию кампании меняет ещё и мастер. Копия здесь расколола бы героя надвое,
  // поэтому пишем в ту же запись, а игровое состояние берём из облачной строки.
  if (linked.campaign_id) {
    return { action: 'keep-local', cloudId: linked.id, conflict: false, mergeFrom: linked };
  }

  // Изменения есть и здесь, и в облаке: сохраняем локальные отдельной копией, облачные остаются.
  return { action: 'keep-local', cloudId: null, conflict: true };
}
