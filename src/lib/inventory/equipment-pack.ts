import { BaseItem, ItemRarity } from './base-item';
import { GearItemModel } from './gear-item';

export interface EquipmentPackOptions {
  id: string;
  name: string;
  nameEn?: string;
  rarity?: ItemRarity;
  description?: string;
  weight?: number;
  cost?: string;
  source?: string;
  items: GearItemModel[];
}

export class EquipmentPackModel extends BaseItem {
  public items: GearItemModel[];

  constructor(options: EquipmentPackOptions) {
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
    this.items = options.items;
  }

  unpack(): GearItemModel[] {
    return this.items.map(item => item.clone());
  }

  clone(): EquipmentPackModel {
    return new EquipmentPackModel({
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      items: this.items.map(i => i.clone()),
    });
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      rarity: this.rarity,
      description: this.description,
      weight: this.weight,
      cost: this.cost,
      source: this.source,
      items: this.items.map(i => i.toJSON()),
    };
  }
}

// ── 7 Official D&D 5e Equipment Packs ──

export function createExplorersPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-explorers',
    name: 'Набор путешественника',
    nameEn: "Explorer's Pack",
    cost: '10 зм',
    weight: 59,
    description: 'Включает в себя рюкзак, спальник, столовый набор, трутницу, 10 факелов, 10 дней рационов, бурдюк и 50 футов пеньковой верёвки.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-bedroll', name: 'Спальник', quantity: 1, unit: 'шт.', weight: 7, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-mess-kit', name: 'Столовый набор', quantity: 1, unit: 'шт.', weight: 1, cost: '2 см' }),
      new GearItemModel({ id: 'gear-tinderbox', name: 'Трутница', quantity: 1, unit: 'шт.', weight: 1, cost: '5 см' }),
      new GearItemModel({ id: 'gear-torch', name: 'Факел', quantity: 10, unit: 'шт.', weight: 1, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 10, unit: 'дн.', weight: 2, cost: '5 см' }),
      new GearItemModel({ id: 'gear-waterskin', name: 'Бурдюк', quantity: 1, unit: 'шт.', weight: 5, cost: '2 см' }),
      new GearItemModel({ id: 'gear-hempen-rope', name: 'Пеньковая верёвка', quantity: 50, unit: 'фт.', weight: 10, cost: '1 зм' }),
    ],
  });
}

export function createDungeoneersPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-dungeoneers',
    name: 'Набор исследователя подземелий',
    nameEn: "Dungeoneer's Pack",
    cost: '12 зм',
    weight: 61.5,
    description: 'Включает в себя рюкзак, лом, молоток, 10 питонов, 10 факелов, трутницу, 10 дней рационов, бурдюк и 50 футов пеньковой верёвки.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-crowbar', name: 'Лом', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-hammer', name: 'Молоток', quantity: 1, unit: 'шт.', weight: 3, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-pitons', name: 'Питоны', quantity: 10, unit: 'шт.', weight: 0.25, cost: '5 мм' }),
      new GearItemModel({ id: 'gear-torch', name: 'Факел', quantity: 10, unit: 'шт.', weight: 1, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-tinderbox', name: 'Трутница', quantity: 1, unit: 'шт.', weight: 1, cost: '5 см' }),
      new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 10, unit: 'дн.', weight: 2, cost: '5 см' }),
      new GearItemModel({ id: 'gear-waterskin', name: 'Бурдюк', quantity: 1, unit: 'шт.', weight: 5, cost: '2 см' }),
      new GearItemModel({ id: 'gear-hempen-rope', name: 'Пеньковая верёвка', quantity: 50, unit: 'фт.', weight: 10, cost: '1 зм' }),
    ],
  });
}

export function createPriestsPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-priests',
    name: 'Набор священника',
    nameEn: "Priest's Pack",
    cost: '19 зм',
    weight: 25,
    description: 'Включает в себя рюкзак, одеяло, 10 свечей, трутницу, коробку для подаяний, 2 палочки благовоний, кадило, облачение, 2 дня рационов и бурдюк.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-blanket', name: 'Одеяло', quantity: 1, unit: 'шт.', weight: 3, cost: '5 см' }),
      new GearItemModel({ id: 'gear-candles', name: 'Свечи', quantity: 10, unit: 'шт.', weight: 0, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-tinderbox', name: 'Трутница', quantity: 1, unit: 'шт.', weight: 1, cost: '5 см' }),
      new GearItemModel({ id: 'gear-alms-box', name: 'Коробка для подаяний', quantity: 1, unit: 'шт.', weight: 1, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-incense-block', name: 'Палочки благовоний', quantity: 2, unit: 'шт.', weight: 0, cost: '1 см' }),
      new GearItemModel({ id: 'gear-censer', name: 'Кадило', quantity: 1, unit: 'шт.', weight: 2, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-vestments', name: 'Облачение', quantity: 1, unit: 'шт.', weight: 4, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 2, unit: 'дн.', weight: 2, cost: '5 см' }),
      new GearItemModel({ id: 'gear-waterskin', name: 'Бурдюк', quantity: 1, unit: 'шт.', weight: 5, cost: '2 см' }),
    ],
  });
}

export function createScholarsPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-scholars',
    name: 'Набор учёного',
    nameEn: "Scholar's Pack",
    cost: '40 зм',
    weight: 10,
    description: 'Включает в себя рюкзак, книгу научных трудов, бутылочку чернил, писчее перо, 10 листов пергамента, мешочек с песком и маленький ножик.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-lore-book', name: 'Книга научных трудов', quantity: 1, unit: 'шт.', weight: 5, cost: '25 зм' }),
      new GearItemModel({ id: 'gear-ink-bottle', name: 'Бутылочка чернил', quantity: 1, unit: 'шт.', weight: 0, cost: '10 зм' }),
      new GearItemModel({ id: 'gear-ink-pen', name: 'Писчее перо', quantity: 1, unit: 'шт.', weight: 0, cost: '2 мм' }),
      new GearItemModel({ id: 'gear-parchment-sheet', name: 'Листы пергамента', quantity: 10, unit: 'шт.', weight: 0, cost: '1 см' }),
      new GearItemModel({ id: 'gear-sand-pouch', name: 'Мешочек с песком', quantity: 1, unit: 'шт.', weight: 1, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-small-knife', name: 'Маленький ножик', quantity: 1, unit: 'шт.', weight: 0.5, cost: '2 зм' }),
    ],
  });
}

export function createDiplomatsPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-diplomats',
    name: 'Набор дипломата',
    nameEn: "Diplomat's Pack",
    cost: '39 зм',
    weight: 36,
    description: 'Включает в себя сундук, 2 футляра для карт и свитков, комплект богатой одежды, бутылочку чернил, писчее перо, лампу, 2 фляги с маслом, 5 листов бумаги, флакон духов, сургуч и мыло.',
    items: [
      new GearItemModel({ id: 'gear-chest', name: 'Сундук', quantity: 1, unit: 'шт.', weight: 25, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-map-case', name: 'Футляры для карт и свитков', quantity: 2, unit: 'шт.', weight: 1, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-fine-clothes', name: 'Комплект богатой одежды', quantity: 1, unit: 'шт.', weight: 6, cost: '15 зм' }),
      new GearItemModel({ id: 'gear-ink-bottle', name: 'Бутылочка чернил', quantity: 1, unit: 'шт.', weight: 0, cost: '10 зм' }),
      new GearItemModel({ id: 'gear-ink-pen', name: 'Писчее перо', quantity: 1, unit: 'шт.', weight: 0, cost: '2 мм' }),
      new GearItemModel({ id: 'gear-lamp', name: 'Лампа', quantity: 1, unit: 'шт.', weight: 1, cost: '5 см' }),
      new GearItemModel({ id: 'gear-oil-flask', name: 'Фляги с маслом', quantity: 2, unit: 'шт.', weight: 1, cost: '1 см' }),
      new GearItemModel({ id: 'gear-paper-sheet', name: 'Листы бумаги', quantity: 5, unit: 'шт.', weight: 0, cost: '2 см' }),
      new GearItemModel({ id: 'gear-perfume', name: 'Флакон духов', quantity: 1, unit: 'шт.', weight: 0, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-sealing-wax', name: 'Сургуч', quantity: 1, unit: 'шт.', weight: 0, cost: '5 см' }),
      new GearItemModel({ id: 'gear-soap', name: 'Мыло', quantity: 1, unit: 'шт.', weight: 0, cost: '2 мм' }),
    ],
  });
}

export function createEntertainersPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-entertainers',
    name: 'Набор артиста',
    nameEn: "Entertainer's Pack",
    cost: '40 зм',
    weight: 38,
    description: 'Включает в себя рюкзак, спальник, 2 костюма, 5 свечей, 5 дней рационов, бурдюк и набор для грима.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-bedroll', name: 'Спальник', quantity: 1, unit: 'шт.', weight: 7, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-costume', name: 'Костюмы', quantity: 2, unit: 'шт.', weight: 4, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-candles', name: 'Свечи', quantity: 5, unit: 'шт.', weight: 0, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 5, unit: 'дн.', weight: 2, cost: '5 см' }),
      new GearItemModel({ id: 'gear-waterskin', name: 'Бурдюк', quantity: 1, unit: 'шт.', weight: 5, cost: '2 см' }),
      new GearItemModel({ id: 'gear-disguise-kit', name: 'Набор для грима', quantity: 1, unit: 'шт.', weight: 3, cost: '25 зм' }),
    ],
  });
}

export function createBurglarsPack(): EquipmentPackModel {
  return new EquipmentPackModel({
    id: 'pack-burglars',
    name: 'Набор грабителя',
    nameEn: "Burglar's Pack",
    cost: '16 зм',
    weight: 47.5,
    description: 'Включает в себя рюкзак, 1000 шариков в мешке, колокольчик, 5 свечей, лом, молоток, 10 питонов, закрытый фонарь, 2 фляги масла, 5 дней рационов, трутницу, бурдюк и 50 футов пеньковой верёвки.',
    items: [
      new GearItemModel({ id: 'gear-backpack', name: 'Рюкзак', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-ball-bearings', name: 'Мешки с шариками', quantity: 1000, unit: 'шт.', weight: 2, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-bell', name: 'Колокольчик', quantity: 1, unit: 'шт.', weight: 0, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-candles', name: 'Свечи', quantity: 5, unit: 'шт.', weight: 0, cost: '1 мм' }),
      new GearItemModel({ id: 'gear-crowbar', name: 'Лом', quantity: 1, unit: 'шт.', weight: 5, cost: '2 зм' }),
      new GearItemModel({ id: 'gear-hammer', name: 'Молоток', quantity: 1, unit: 'шт.', weight: 3, cost: '1 зм' }),
      new GearItemModel({ id: 'gear-pitons', name: 'Питоны', quantity: 10, unit: 'шт.', weight: 0.25, cost: '5 мм' }),
      new GearItemModel({ id: 'gear-hooded-lantern', name: 'Закрытый фонарь', quantity: 1, unit: 'шт.', weight: 2, cost: '5 зм' }),
      new GearItemModel({ id: 'gear-oil-flask', name: 'Фляги с маслом', quantity: 2, unit: 'шт.', weight: 1, cost: '1 см' }),
      new GearItemModel({ id: 'gear-rations', name: 'Рационы', quantity: 5, unit: 'дн.', weight: 2, cost: '5 см' }),
      new GearItemModel({ id: 'gear-tinderbox', name: 'Трутница', quantity: 1, unit: 'шт.', weight: 1, cost: '5 см' }),
      new GearItemModel({ id: 'gear-waterskin', name: 'Бурдюк', quantity: 1, unit: 'шт.', weight: 5, cost: '2 см' }),
      new GearItemModel({ id: 'gear-hempen-rope', name: 'Пеньковая верёвка', quantity: 50, unit: 'фт.', weight: 10, cost: '1 зм' }),
    ],
  });
}

export const OFFICIAL_EQUIPMENT_PACKS: EquipmentPackModel[] = [
  createExplorersPack(),
  createDungeoneersPack(),
  createPriestsPack(),
  createScholarsPack(),
  createDiplomatsPack(),
  createEntertainersPack(),
  createBurglarsPack(),
];
