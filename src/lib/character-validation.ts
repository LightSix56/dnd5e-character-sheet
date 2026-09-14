export const NAMELESS_PLACEHOLDERS = new Set([
  'безымянный',
  'безымянная',
  'nameless',
  'безымянный герой',
  'новый герой',
]);

export interface CharacterNameValidationResult {
  isValid: boolean;
  error?: string;
  safeName?: string;
}

/**
 * Validates a character's name for cloud persistence.
 * Rejects empty strings, whitespace, null/undefined, placeholder names ("Безымянный", etc.),
 * and strings exceeding 200 characters.
 */
export function validateCharacterName(name: unknown): CharacterNameValidationResult {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Имя персонажа должно быть строкой' };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Персонаж должен иметь имя для сохранения в облаке' };
  }
  if (NAMELESS_PLACEHOLDERS.has(trimmed.toLowerCase())) {
    return { isValid: false, error: 'Персонаж должен иметь имя для сохранения в облаке' };
  }
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Имя персонажа не должно превышать 200 символов' };
  }
  return { isValid: true, safeName: trimmed };
}

/**
 * Returns true if the character is nameless or has a placeholder name.
 */
export function isNamelessCharacter(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim().toLowerCase();
  return !trimmed || NAMELESS_PLACEHOLDERS.has(trimmed);
}

/**
 * Returns true if the character has a valid non-placeholder name.
 */
export function isNamedCharacter(char: { name?: string | null; data?: { name?: string | null } }): boolean {
  const name = char.name || char.data?.name;
  return !isNamelessCharacter(name);
}
