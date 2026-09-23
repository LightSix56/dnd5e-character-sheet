import { PotionItemModel } from './potion-item';
import { EquipmentPackModel, OFFICIAL_EQUIPMENT_PACKS } from './equipment-pack';

export class ItemRegistry {
  private potions = new Map<string, PotionItemModel>();
  private packs = new Map<string, EquipmentPackModel>();
  private packAliases = new Map<string, EquipmentPackModel>();

  constructor() {
    // Pre-register standard equipment packs
    for (const pack of OFFICIAL_EQUIPMENT_PACKS) {
      this.registerPack(pack);
    }
  }

  registerPotion(potion: PotionItemModel): void {
    this.potions.set(potion.id, potion);
  }

  registerPack(pack: EquipmentPackModel): void {
    this.packs.set(pack.id, pack);
    if (pack.id.startsWith('pack-')) {
      const alias = pack.id.replace(/^pack-/, '') + '-pack';
      this.packAliases.set(alias, pack);
    } else if (pack.id.endsWith('-pack')) {
      const alias = 'pack-' + pack.id.replace(/-pack$/, '');
      this.packAliases.set(alias, pack);
    }
  }

  getPotion(id: string): PotionItemModel | undefined {
    return this.potions.get(id);
  }

  getAllPotions(): PotionItemModel[] {
    return Array.from(this.potions.values());
  }

  getPack(idOrName: string): EquipmentPackModel | undefined {
    if (!idOrName) return undefined;
    const direct = this.packs.get(idOrName) || this.packAliases.get(idOrName);
    if (direct) return direct;

    const normalized = idOrName.trim().toLowerCase();
    const normalizedDash = normalized.replace(/\s+/g, '-');
    const directNormalized = this.packs.get(normalizedDash) || this.packAliases.get(normalizedDash);
    if (directNormalized) return directNormalized;

    if (normalizedDash.startsWith('pack-')) {
      const alt = normalizedDash.replace(/^pack-/, '') + '-pack';
      if (this.packs.has(alt)) return this.packs.get(alt);
      if (this.packAliases.has(alt)) return this.packAliases.get(alt);
    } else if (normalizedDash.endsWith('-pack')) {
      const alt = 'pack-' + normalizedDash.replace(/-pack$/, '');
      if (this.packs.has(alt)) return this.packs.get(alt);
      if (this.packAliases.has(alt)) return this.packAliases.get(alt);
    }

    // Search by name (ru or en)
    for (const pack of this.packs.values()) {
      if (
        pack.name.toLowerCase() === normalized ||
        pack.nameEn.toLowerCase() === normalized ||
        normalized.includes(pack.name.toLowerCase()) ||
        (pack.nameEn && normalized.includes(pack.nameEn.toLowerCase()))
      ) {
        return pack;
      }
    }

    return undefined;
  }

  getAllPacks(): EquipmentPackModel[] {
    return Array.from(this.packs.values());
  }

  createPotionInstance(id: string, quantity: number = 1): PotionItemModel | undefined {
    const proto = this.potions.get(id);
    if (!proto) return undefined;
    const clone = proto.clone();
    clone.quantity = quantity;
    return clone;
  }
}

export const itemRegistry = new ItemRegistry();
