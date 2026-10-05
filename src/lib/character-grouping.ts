/**
 * Группировка списка персонажей: версии для кампаний идут сразу за своим оригиналом.
 *
 * Версия — строка с заполненным campaign_id. Если её оригинала в списке нет
 * (удалён или версия создана сразу в кампании), она показывается самостоятельной карточкой.
 */
export interface GroupableCharacter {
  id: string;
  name?: string;
  isLocal?: boolean;
  campaign_id?: string | null;
  campaign_name?: string | null;
  source_character_id?: string | null;
}

export interface CharacterGroup<T extends GroupableCharacter> {
  original: T;
  versions: T[];
}

export function isCampaignVersion(c: GroupableCharacter | null | undefined): boolean {
  return Boolean(c && !c.isLocal && c.campaign_id);
}

export function groupCharacterVersions<T extends GroupableCharacter>(list: T[]): CharacterGroup<T>[] {
  const unique: T[] = [];
  const seen = new Set<string>();
  for (const c of list) {
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    unique.push(c);
  }

  const originalIds = new Set(unique.filter(c => !isCampaignVersion(c)).map(c => c.id));
  const hasOriginalInList = (c: T) =>
    isCampaignVersion(c) &&
    Boolean(c.source_character_id) &&
    c.source_character_id !== c.id &&
    originalIds.has(c.source_character_id as string);

  const versionsBySource = new Map<string, T[]>();
  for (const c of unique) {
    if (!hasOriginalInList(c)) continue;
    const key = c.source_character_id as string;
    versionsBySource.set(key, [...(versionsBySource.get(key) ?? []), c]);
  }

  const groups: CharacterGroup<T>[] = [];
  for (const c of unique) {
    if (hasOriginalInList(c)) continue;
    const versions = [...(versionsBySource.get(c.id) ?? [])].sort((a, b) =>
      (a.campaign_name ?? '').localeCompare(b.campaign_name ?? '', 'ru')
    );
    groups.push({ original: c, versions });
  }
  return groups;
}

/** Оставляет группы, где совпал оригинал (со всеми версиями) или хотя бы одна версия (оригинал + совпавшие). */
export function filterCharacterGroups<T extends GroupableCharacter>(
  groups: CharacterGroup<T>[],
  matches: (c: T) => boolean
): CharacterGroup<T>[] {
  const result: CharacterGroup<T>[] = [];
  for (const group of groups) {
    if (matches(group.original)) {
      result.push(group);
      continue;
    }
    const versions = group.versions.filter(matches);
    if (versions.length > 0) result.push({ original: group.original, versions });
  }
  return result;
}

export function flattenCharacterGroups<T extends GroupableCharacter>(groups: CharacterGroup<T>[]): T[] {
  return groups.flatMap(g => [g.original, ...g.versions]);
}
