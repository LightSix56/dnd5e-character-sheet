import { PotionItemModel } from './potion-item';
import { EquipmentPackModel, OFFICIAL_EQUIPMENT_PACKS } from './equipment-pack';

export class ItemRegistry {
  private potions = new Map<string, PotionItemModel>();
  private packs = new Map<string, EquipmentPackModel>();

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
  }

  getPotion(id: string): PotionItemModel | undefined {
    return this.potions.get(id);
  }

  getAllPotions(): PotionItemModel[] {
    return Array.from(this.potions.values());
  }

  getPack(id: string): EquipmentPackModel | undefined {
    return this.packs.get(id);
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
