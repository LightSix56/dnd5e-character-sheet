// -- Dynamic AC Calculator for Character Sheet and Wizard --

export function calculateWizardAC(
  className: string,
  equippedArmor: string,
  equippedShield: boolean,
  dexMod: number,
  conMod: number,
  wisMod: number,
  options?: {
    hasDefenseFightingStyle?: boolean;
    isDraconicSorcerer?: boolean;
    raceName?: string;
  }
): number {
  const shieldBonus = equippedShield ? 2 : 0;
  const normClass = className.trim().toLowerCase();
  const normRace = (options?.raceName || '').trim().toLowerCase();

  const isWarforged = normRace.includes('кован') || normRace.includes('warforged');
  const warforgedBonus = isWarforged ? 1 : 0;

  // Racial and class natural/unarmored defenses when not wearing armor
  if (!equippedArmor) {
    if (normRace.includes('тортл') || normRace.includes('tortle')) {
      return 17 + shieldBonus + warforgedBonus;
    }
    if (
      normRace.includes('трикрин') ||
      normRace.includes('thri-kreen') ||
      normRace.includes('людоящер') ||
      normRace.includes('lizardfolk') ||
      normRace.includes('автогном') ||
      normRace.includes('autognome')
    ) {
      return 13 + dexMod + shieldBonus + warforgedBonus;
    }
    if (normRace.includes('локсодон') || normRace.includes('loxodon')) {
      return 12 + conMod + shieldBonus + warforgedBonus;
    }
    if (normRace.includes('локата') || normRace.includes('locathah')) {
      return 12 + dexMod + shieldBonus + warforgedBonus;
    }

    // Draconic Sorcerer Unarmored Defense (13 + DEX, shield allowed)
    if (options?.isDraconicSorcerer) {
      return 13 + dexMod + shieldBonus + warforgedBonus;
    }

    // Barbarian Unarmored Defense (10 + DEX + CON + shield)
    if (normClass.includes('варвар') || normClass.includes('barbarian')) {
      return 10 + dexMod + conMod + shieldBonus + warforgedBonus;
    }
    // Monk Unarmored Defense (10 + DEX + WIS, no shield allowed)
    if ((normClass.includes('монах') || normClass.includes('monk')) && !equippedShield) {
      return 10 + dexMod + wisMod + warforgedBonus;
    }
  }

  let ac = 10 + dexMod + shieldBonus + warforgedBonus;

  if (equippedArmor) {
    const lowerArmor = equippedArmor.toLowerCase();
    // Heavy: Chain Mail / Кольчуга / Латы
    if (lowerArmor.includes('кольчуг') || lowerArmor.includes('chain mail') || lowerArmor.includes('латы') || lowerArmor.includes('наборн') || lowerArmor.includes('колечн')) {
      ac = 16 + shieldBonus + warforgedBonus;
    }
    // Medium: Scale Mail / Чешуйчатый доспех (14 + min(2, max(0, dexMod)))
    else if (lowerArmor.includes('чешуйчат') || lowerArmor.includes('scale mail') || lowerArmor.includes('рубах') || lowerArmor.includes('кирас') || lowerArmor.includes('полулат') || lowerArmor.includes('шкурн')) {
      ac = 14 + Math.min(2, Math.max(0, dexMod)) + shieldBonus + warforgedBonus;
    }
    // Light: Leather / Кожаный доспех (11 + dexMod)
    else if (lowerArmor.includes('кожан') || lowerArmor.includes('leather') || lowerArmor.includes('стеган') || lowerArmor.includes('проклепан')) {
      ac = 11 + dexMod + shieldBonus + warforgedBonus;
    }

    if (options?.hasDefenseFightingStyle) {
      ac += 1;
    }
  }

  return ac;
}
