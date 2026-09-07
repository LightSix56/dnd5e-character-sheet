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

export function getLocalShareStore(): Map<string, CharacterShareRecord> {
  if (!globalThis._localCharacterShares) {
    globalThis._localCharacterShares = new Map();
  }
  return globalThis._localCharacterShares;
}
