export type ItemRarity = 'обычное' | 'необычное' | 'редкое' | 'очень редкое' | 'легендарное' | 'артефакт';

export abstract class BaseItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nameEn: string = '',
    public readonly rarity: ItemRarity = 'обычное',
    public readonly description: string = '',
    public readonly weight: number = 0,
    public readonly cost: string = '',
    public readonly source: string = 'PHB'
  ) {}

  abstract clone(): BaseItem;
  abstract toJSON(): Record<string, any>;
}
