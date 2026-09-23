import { BaseItem, ItemRarity } from './base-item';
import type { CharacterData, PotionItem } from '../dnd-types';

export interface PotionUseResult {
  success: boolean;
  potionName: string;
  message: string;
  hpHealed?: number;
  tempHp?: number;
  buffApplied?: string;
  actionCost: 'bonus_action';
}

export type PotionType = 'heal' | 'buff' | 'utility';

export interface PotionItemModelOptions {
  id: string;
  name: string;
  nameEn?: string;
  rarity?: ItemRarity;
  description?: string;
  weight?: number;
  cost?: string;
  source?: string;
  potionType: PotionType;
  formula?: string;
  effectSummary: string;
  quantity?: number;
}

export function rollDiceFormula(formula: string): { total: number; rolls: number[]; modifier: number } {
  const clean = formula.replace(/\s+/g, '').replace(/[кК]/g, 'd');
  const match = clean.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
  if (!match) {
    const directNum = parseInt(clean, 10);
    return {
      total: isNaN(directNum) ? 0 : directNum,
      rolls: [],
      modifier: isNaN(directNum) ? 0 : directNum,
    };
  }
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const sign = match[3] === '-' ? -1 : 1;
  const rawMod = match[4] ? parseInt(match[4], 10) : 0;
  const modifier = sign * rawMod;

  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    sum += r;
  }
  return {
    total: sum + modifier,
    rolls,
    modifier,
  };
}

export class PotionItemModel extends BaseItem {
  public potionType: PotionType;
  public formula?: string;
  public effectSummary: string;
  public readonly actionCost: 'bonus_action' = 'bonus_action';
  public quantity: number;

  constructor(options: PotionItemModelOptions) {
    super(
      options.id,
      options.name,
      options.nameEn || '',
      options.rarity || 'обычное',
      options.description || '',
      options.weight ?? 0.5,
      options.cost || '',
      options.source || 'PHB'
    );
    this.potionType = options.potionType;
    this.formula = options.formula;
    this.effectSummary = options.effectSummary;
    this.quantity = options.quantity ?? 1;
  }

  use(char?: CharacterData): PotionUseResult {
    return {
      success: true,
      potionName: this.name,
      message: `Использовано зелье: ${this.name}. Эффект: ${this.effectSummary}`,
      buffApplied: this.effectSummary,
      actionCost: this.actionCost,
    };
  }

  clone(): PotionItemModel {
    return new PotionItemModel({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      potionType: this.potionType,
      formula: this.formula,
      effectSummary: this.effectSummary,
      quantity: this.quantity,
    });
  }

  toJSON(): PotionItem {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      type: this.potionType,
      rarity: this.rarity,
      quantity: this.quantity,
      formula: this.formula,
      effectSummary: this.effectSummary,
      description: this.description,
      actionCost: this.actionCost,
    };
  }
}

export interface HealingPotionOptions extends Omit<PotionItemModelOptions, 'potionType'> {
  fixedHeal?: number;
}

export class HealingPotion extends PotionItemModel {
  public readonly fixedHeal?: number;

  constructor(options: HealingPotionOptions) {
    super({ ...options, potionType: 'heal' });
    this.fixedHeal = options.fixedHeal;
  }

  override use(char?: CharacterData): PotionUseResult {
    let hpHealed = 0;
    let rollDetails = '';

    if (this.formula && this.formula !== '0') {
      const rolled = rollDiceFormula(this.formula);
      hpHealed = Math.max(1, rolled.total);
      const modStr = rolled.modifier !== 0 ? (rolled.modifier > 0 ? `+${rolled.modifier}` : `${rolled.modifier}`) : '';
      rollDetails = ` (${this.formula} ➔ [${rolled.rolls.join(', ')}]${modStr} = ${hpHealed})`;
    } else if (this.fixedHeal !== undefined) {
      hpHealed = this.fixedHeal;
    }

    const message = hpHealed > 0
      ? `Вы выпиваете ${this.name} бонусным действием и восстанавливаете ${hpHealed} хитов${rollDetails}.`
      : `Вы выпиваете ${this.name} бонусным действием. ${this.effectSummary}`;

    return {
      success: true,
      potionName: this.name,
      message,
      hpHealed: hpHealed > 0 ? hpHealed : undefined,
      buffApplied: this.effectSummary,
      actionCost: this.actionCost,
    };
  }

  override clone(): HealingPotion {
    return new HealingPotion({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      formula: this.formula,
      effectSummary: this.effectSummary,
      quantity: this.quantity,
      fixedHeal: this.fixedHeal,
    });
  }
}

export interface BuffPotionOptions extends Omit<PotionItemModelOptions, 'potionType'> {
  buffApplied?: string;
  tempHp?: number;
}

export class BuffPotion extends PotionItemModel {
  public buffApplied: string;
  public tempHp?: number;

  constructor(options: BuffPotionOptions) {
    super({ ...options, potionType: 'buff' });
    this.buffApplied = options.buffApplied || options.effectSummary;
    this.tempHp = options.tempHp;
  }

  override use(char?: CharacterData): PotionUseResult {
    let message = `Вы выпиваете ${this.name} бонусным действием. Наложен эффект: ${this.buffApplied}.`;
    if (this.tempHp !== undefined && this.tempHp > 0) {
      message += ` Получено ${this.tempHp} временных хитов.`;
    }

    return {
      success: true,
      potionName: this.name,
      message,
      tempHp: this.tempHp,
      buffApplied: this.buffApplied,
      actionCost: this.actionCost,
    };
  }

  override clone(): BuffPotion {
    return new BuffPotion({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      formula: this.formula,
      effectSummary: this.effectSummary,
      quantity: this.quantity,
      buffApplied: this.buffApplied,
      tempHp: this.tempHp,
    });
  }
}

export interface UtilityPotionOptions extends Omit<PotionItemModelOptions, 'potionType'> {
  utilityEffect?: string;
}

export class UtilityPotion extends PotionItemModel {
  public utilityEffect: string;

  constructor(options: UtilityPotionOptions) {
    super({ ...options, potionType: 'utility' });
    this.utilityEffect = options.utilityEffect || options.effectSummary;
  }

  override use(char?: CharacterData): PotionUseResult {
    return {
      success: true,
      potionName: this.name,
      message: `Вы используете ${this.name} бонусным действием. Статус эффекта: ${this.utilityEffect}.`,
      buffApplied: this.utilityEffect,
      actionCost: this.actionCost,
    };
  }

  override clone(): UtilityPotion {
    return new UtilityPotion({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      formula: this.formula,
      effectSummary: this.effectSummary,
      quantity: this.quantity,
      utilityEffect: this.utilityEffect,
    });
  }
}
