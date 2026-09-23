import { BaseItem, ItemRarity } from './base-item';
import type { GearItem } from '../dnd-types';

export type GearUnit = 'шт.' | 'фт.' | 'дн.' | 'фнт.';

export interface GearItemOptions {
  id: string;
  name: string;
  nameEn?: string;
  rarity?: ItemRarity;
  description?: string;
  weight?: number;
  cost?: string;
  source?: string;
  quantity: number;
  unit: GearUnit;
  category?: string;
}

export class GearItemModel extends BaseItem {
  public quantity: number;
  public unit: GearUnit;
  public category?: string;

  constructor(options: GearItemOptions) {
    super(
      options.id,
      options.name,
      options.nameEn || '',
      options.rarity || 'обычное',
      options.description || '',
      options.weight || 0,
      options.cost || '',
      options.source || 'PHB'
    );
    this.quantity = options.quantity;
    this.unit = options.unit;
    this.category = options.category;
  }

  clone(): GearItemModel {
    return new GearItemModel({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      quantity: this.quantity,
      unit: this.unit,
      category: this.category,
    });
  }

  toJSON(): GearItem {
    return {
      id: this.id,
      name: this.name,
      quantity: this.quantity,
      unit: this.unit,
    };
  }
}
