export interface CharacterShareRecord {
  code: string;
  name: string;
  character_id?: string | null;
  data: any;
  created_at: string;
  expires_at: string | null;
}

declare global {
  var _localCharacterShares: Map<string, CharacterShareRecord> | undefined;
}

/** Потолок записей в резервном хранилище, чтобы оно не росло бесконечно в памяти процесса. */
export const LOCAL_SHARE_STORE_LIMIT = 200;

export function getLocalShareStore(): Map<string, CharacterShareRecord> {
  if (!globalThis._localCharacterShares) {
    globalThis._localCharacterShares = new Map();
  }
  return globalThis._localCharacterShares;
}

/** Кладёт запись в резервное хранилище, вычищая истёкшие и вытесняя самые старые. */
export function putLocalShare(record: CharacterShareRecord, now = Date.now()): void {
  const store = getLocalShareStore();

  for (const [code, existing] of store) {
    if (existing.expires_at && new Date(existing.expires_at).getTime() <= now) store.delete(code);
  }
  // Map хранит порядок вставки, поэтому первые ключи — самые старые.
  for (const code of store.keys()) {
    if (store.size < LOCAL_SHARE_STORE_LIMIT) break;
    store.delete(code);
  }

  store.set(record.code, record);
}
