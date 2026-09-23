'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { CharacterData, PotionItem, GearItem } from '@/lib/dnd-types';
import {
  itemRegistry,
  mergeGearItems,
  GearItemModel,
  HealingPotion,
  BuffPotion,
  UtilityPotion,
  OFFICIAL_EQUIPMENT_PACKS,
} from '@/lib/inventory';
import '@/data/compendium/potions-data';
import {
  BackpackPackIcon,
  SparklesDndIcon,
  InfoSealIcon,
  ScrollIcon,
  LightningStrikeIcon,
  ChestIcon,
  SearchLensIcon,
} from '@/components/dnd-icons';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export interface InventoryManagerProps {
  char: CharacterData;
  update: <K extends keyof CharacterData>(field: K, value: CharacterData[K]) => void;
}

export function handlePotionQuantityChange(
  potions: PotionItem[],
  potionId: string,
  delta: number
): PotionItem[] {
  return potions
    .map(p => {
      if (p.id !== potionId) return p;
      return { ...p, quantity: p.quantity + delta };
    })
    .filter(p => p.quantity > 0);
}

export function handleDrinkPotionAction(
  char: CharacterData,
  potionId: string
): {
  updatedPotions: PotionItem[];
  hpCurrent: number;
  hpTemp: number;
  message: string;
} {
  const currentPotions = char.potions || [];
  const targetPotion = currentPotions.find(p => p.id === potionId);
  if (!targetPotion || targetPotion.quantity <= 0) {
    return {
      updatedPotions: currentPotions,
      hpCurrent: char.hpCurrent,
      hpTemp: char.hpTemp,
      message: 'Зелье не найдено в инвентаре.',
    };
  }

  // Deduct 1 from quantity, remove if <= 0
  const updatedPotions = currentPotions
    .map(p => (p.id === potionId ? { ...p, quantity: p.quantity - 1 } : p))
    .filter(p => p.quantity > 0);

  // Look up model in registry or construct fallback
  const registered = itemRegistry.getPotion(potionId);
  let useResult;
  if (registered) {
    useResult = registered.use(char);
  } else if (targetPotion.type === 'heal' || targetPotion.formula) {
    const healModel = new HealingPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      formula: targetPotion.formula,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = healModel.use(char);
  } else if (targetPotion.type === 'buff') {
    const buffModel = new BuffPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      buffApplied: targetPotion.effectSummary,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = buffModel.use(char);
  } else {
    const utilModel = new UtilityPotion({
      id: targetPotion.id,
      name: targetPotion.name,
      nameEn: targetPotion.nameEn,
      utilityEffect: targetPotion.effectSummary,
      effectSummary: targetPotion.effectSummary,
    });
    useResult = utilModel.use(char);
  }

  let hpCurrent = char.hpCurrent;
  if (useResult.hpHealed && useResult.hpHealed > 0) {
    const maxHp = char.hpMax ?? 999;
    hpCurrent = Math.min(maxHp, char.hpCurrent + useResult.hpHealed);
  }

  let hpTemp = char.hpTemp;
  if (useResult.tempHp && useResult.tempHp > 0) {
    hpTemp = Math.max(char.hpTemp, useResult.tempHp);
  }

  return {
    updatedPotions,
    hpCurrent,
    hpTemp,
    message: useResult.message,
  };
}

export function handleAddPotionAction(
  potions: PotionItem[],
  newPotion: PotionItem
): PotionItem[] {
  const existing = potions.find(
    p => p.id === newPotion.id || p.name.toLowerCase() === newPotion.name.toLowerCase()
  );
  if (existing) {
    return potions.map(p =>
      p === existing ? { ...p, quantity: p.quantity + (newPotion.quantity || 1) } : p
    );
  }
  return [...potions, { ...newPotion, quantity: newPotion.quantity || 1 }];
}

export function handleUnpackPackAction(
  currentGear: GearItem[],
  packId: string
): { updatedGear: GearItem[]; packName: string; addedCount: number } {
  const pack = itemRegistry.getPack(packId);
  if (!pack) {
    throw new Error(`Набор с ID ${packId} не найден.`);
  }

  const existingModels = currentGear.map(
    g => new GearItemModel({ id: g.id, name: g.name, quantity: g.quantity, unit: g.unit })
  );
  const unpacked = pack.unpack();
  const merged = mergeGearItems(existingModels, unpacked);

  return {
    updatedGear: merged.map(m => m.toJSON()),
    packName: pack.name,
    addedCount: unpacked.length,
  };
}

export function handleAddGearItemAction(
  currentGear: GearItem[],
  item: { name: string; quantity: number; unit: 'шт.' | 'фт.' | 'дн.' | 'фнт.' }
): GearItem[] {
  const trimmedName = item.name.trim();
  const existing = currentGear.find(
    g => g.name.toLowerCase() === trimmedName.toLowerCase() && g.unit === item.unit
  );

  if (existing) {
    return currentGear.map(g =>
      g === existing ? { ...g, quantity: g.quantity + item.quantity } : g
    );
  }

  const newItem: GearItem = {
    id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    quantity: item.quantity,
    unit: item.unit,
  };
  return [...currentGear, newItem];
}

export function handleUpdateGearQuantityAction(
  currentGear: GearItem[],
  itemId: string,
  delta: number
): GearItem[] {
  return currentGear
    .map(g => (g.id === itemId ? { ...g, quantity: g.quantity + delta } : g))
    .filter(g => g.quantity > 0);
}

export function handleRemoveGearItemAction(
  currentGear: GearItem[],
  itemId: string
): GearItem[] {
  return currentGear.filter(g => g.id !== itemId);
}

export function getRarityBadgeStyle(rarity?: string): string {
  switch (rarity) {
    case 'необычное':
      return 'bg-[#2E6930]/15 text-[#2E6930] border-[#2E6930]/40';
    case 'редкое':
      return 'bg-[#1A5276]/15 text-[#1A5276] border-[#1A5276]/40';
    case 'очень редкое':
      return 'bg-[#6C3483]/15 text-[#6C3483] border-[#6C3483]/40';
    case 'легендарное':
      return 'bg-[#B9770E]/20 text-[#8C5808] border-[#B9770E]/50 font-bold';
    case 'артефакт':
      return 'bg-[#A04000]/20 text-[#A04000] border-[#A04000]/50 font-bold';
    case 'обычное':
    default:
      return 'bg-[#8B6914]/15 text-[#5C341F] border-[#8B6914]/30';
  }
}

export function InventoryManager({ char, update }: InventoryManagerProps) {
  // Toast state
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(current => (current?.id === toast.id ? null : current));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Potion Modal & Add State
  const [showPotionModal, setShowPotionModal] = useState<boolean>(false);
  const [potionTab, setPotionTab] = useState<'compendium' | 'custom'>('compendium');
  const [potionSearch, setPotionSearch] = useState<string>('');
  const [customPotionName, setCustomPotionName] = useState<string>('');
  const [customPotionFormula, setCustomPotionFormula] = useState<string>('');
  const [customPotionEffect, setCustomPotionEffect] = useState<string>('');
  const [customPotionType, setCustomPotionType] = useState<'heal' | 'buff' | 'utility'>('heal');
  const [customPotionRarity, setCustomPotionRarity] = useState<
    'обычное' | 'необычное' | 'редкое' | 'очень редкое' | 'легендарное'
  >('обычное');
  const [customPotionQty, setCustomPotionQty] = useState<number>(1);

  // Gear Modal State
  const [showGearModal, setShowGearModal] = useState<boolean>(false);
  const [newGearName, setNewGearName] = useState<string>('');
  const [newGearQty, setNewGearQty] = useState<number>(1);
  const [newGearUnit, setNewGearUnit] = useState<'шт.' | 'фт.' | 'дн.' | 'фнт.'>('шт.');

  // Legacy Notes Expansion State
  const [notesExpanded, setNotesExpanded] = useState<boolean>(true);

  // Close modals with escape
  useEscapeKey(() => setShowPotionModal(false), showPotionModal);
  useEscapeKey(() => setShowGearModal(false), showGearModal);

  // Compendium Potions
  const compendiumPotions = useMemo(() => {
    return itemRegistry.getAllPotions();
  }, []);

  const filteredCompendiumPotions = useMemo(() => {
    if (!potionSearch.trim()) return compendiumPotions;
    const q = potionSearch.toLowerCase().trim();
    return compendiumPotions.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.effectSummary.toLowerCase().includes(q) ||
        p.rarity.toLowerCase().includes(q)
    );
  }, [compendiumPotions, potionSearch]);

  // Official Equipment Packs
  const availablePacks = useMemo(() => {
    return itemRegistry.getAllPacks();
  }, []);

  // Handlers for Potions
  const handleDrink = (potionId: string) => {
    const { updatedPotions, hpCurrent, hpTemp, message } = handleDrinkPotionAction(char, potionId);
    update('potions', updatedPotions);
    if (hpCurrent !== char.hpCurrent) update('hpCurrent', hpCurrent);
    if (hpTemp !== char.hpTemp) update('hpTemp', hpTemp);
    showToast(`⚡ ${message} (Бонусное действие)`);
  };

  const handlePotionDelta = (potionId: string, delta: number) => {
    const updated = handlePotionQuantityChange(char.potions || [], potionId, delta);
    update('potions', updated);
  };

  const handleAddCompendiumPotion = (potionId: string) => {
    const proto = itemRegistry.getPotion(potionId);
    if (!proto) return;
    const potionItem = proto.toJSON();
    const updated = handleAddPotionAction(char.potions || [], potionItem);
    update('potions', updated);
    showToast(`Добавлено зелье: ${proto.name}`);
    setShowPotionModal(false);
  };

  const handleCreateCustomPotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPotionName.trim()) return;

    const newPotion: PotionItem = {
      id: `potion-custom-${Date.now()}`,
      name: customPotionName.trim(),
      nameEn: '',
      type: customPotionType,
      rarity: customPotionRarity,
      quantity: Math.max(1, customPotionQty),
      formula: customPotionFormula.trim() || undefined,
      effectSummary: customPotionEffect.trim() || customPotionFormula.trim() || customPotionName.trim(),
      description: customPotionEffect.trim() || 'Пользовательское зелье',
      actionCost: 'bonus_action',
    };

    const updated = handleAddPotionAction(char.potions || [], newPotion);
    update('potions', updated);
    showToast(`Добавлено кастомное зелье: ${newPotion.name}`);
    setCustomPotionName('');
    setCustomPotionFormula('');
    setCustomPotionEffect('');
    setCustomPotionQty(1);
    setShowPotionModal(false);
  };

  // Handlers for Gear
  const handleUnpackPack = (packId: string) => {
    if (!packId) return;
    try {
      const { updatedGear, packName, addedCount } = handleUnpackPackAction(
        char.inventoryGear || [],
        packId
      );
      update('inventoryGear', updatedGear);
      showToast(`📦 «${packName}» распакован! Добавлено ${addedCount} предм.`);
    } catch {
      showToast('Ошибка при распаковке набора.');
    }
  };

  const handleGearDelta = (itemId: string, delta: number) => {
    const updated = handleUpdateGearQuantityAction(char.inventoryGear || [], itemId, delta);
    update('inventoryGear', updated);
  };

  const handleRemoveGear = (itemId: string) => {
    const updated = handleRemoveGearItemAction(char.inventoryGear || [], itemId);
    update('inventoryGear', updated);
  };

  const handleCreateGearItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearName.trim()) return;

    const updated = handleAddGearItemAction(char.inventoryGear || [], {
      name: newGearName.trim(),
      quantity: Math.max(1, newGearQty),
      unit: newGearUnit,
    });
    update('inventoryGear', updated);
    showToast(`Добавлен предмет: ${newGearName.trim()}`);
    setNewGearName('');
    setNewGearQty(1);
    setShowGearModal(false);
  };

  const currentPotions = char.potions || [];
  const currentGear = char.inventoryGear || [];

  return (
    <div className="space-y-6">
      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[400] max-w-md p-3.5 rounded-lg shadow-xl border-2 border-[#C9A84C] bg-[#F5E6C8] text-[#3D2012] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <LightningStrikeIcon size={16} />
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="parchment-remove-btn"
            title="Закрыть уведомление"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── ТАБЛИЦА 1: Зелья и боевые расходники ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[rgba(139,105,20,0.25)] pb-2">
          <div className="flex items-center gap-2">
            <SparklesDndIcon size={18} />
            <h4 className="font-serif font-bold text-sm text-[#3D2012] flex items-center gap-2">
              <span>Зелья и боевые расходники</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#C9A84C] bg-[#FAF0DD] text-[#8B6914] font-sans">
                {currentPotions.reduce((acc, p) => acc + p.quantity, 0)}
              </span>
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowPotionModal(true)}
            className="parchment-btn text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
          >
            <span>+ Добавить зелье</span>
          </button>
        </div>

        {currentPotions.length === 0 ? (
          <div className="parchment-empty-state py-4 text-center rounded border border-dashed border-[rgba(139,105,20,0.3)] bg-[rgba(245,230,200,0.4)]">
            <SparklesDndIcon size={22} className="mx-auto mb-1 opacity-70" />
            <p className="text-xs text-[#5C341F] font-semibold">Нет зелий в рюкзаке</p>
            <p className="text-[11px] text-[#8B6914] max-w-md mx-auto">
              Нажмите «+ Добавить зелье», чтобы выбрать зелье из компендиума D&D 5e или записать собственное.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[rgba(139,105,20,0.35)] shadow-xs bg-[#FAF0DD]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[rgba(240,224,194,0.95)] border-b border-[rgba(139,105,20,0.3)] text-[#5C341F] font-serif font-bold">
                  <th className="py-2 px-3">Зелье</th>
                  <th className="py-2 px-3">Эффект / Формула</th>
                  <th className="py-2 px-3 text-center">Кол-во</th>
                  <th className="py-2 px-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,105,20,0.2)]">
                {currentPotions.map(potion => (
                  <tr key={potion.id} className="hover:bg-[rgba(245,230,200,0.6)] transition-colors">
                    <td className="py-2 px-3 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#3D2012]">{potion.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full border ${getRarityBadgeStyle(
                              potion.rarity
                            )}`}
                          >
                            {potion.rarity}
                          </span>
                        </div>
                        {potion.nameEn && (
                          <span className="text-[10px] text-[#8B6914] italic">{potion.nameEn}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle text-[#5C341F]">
                      <div className="flex items-center gap-1.5">
                        {potion.formula && (
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[rgba(139,105,20,0.12)] border border-[rgba(139,105,20,0.25)] text-[#3D2012]">
                            {potion.formula}
                          </span>
                        )}
                        <span className="text-[11px] leading-snug">{potion.effectSummary}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 border border-[rgba(139,105,20,0.3)] rounded bg-[#FAF0DD] px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => handlePotionDelta(potion.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-[#5C341F] hover:bg-[rgba(139,105,20,0.2)] active:scale-95 transition-all"
                          title="Уменьшить количество"
                        >
                          –
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-[#3D2012]">
                          {potion.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePotionDelta(potion.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-[#5C341F] hover:bg-[rgba(139,105,20,0.2)] active:scale-95 transition-all"
                          title="Увеличить количество"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDrink(potion.id)}
                        className="parchment-btn text-[11px] px-2.5 py-1 inline-flex items-center gap-1 shadow-xs cursor-pointer hover:brightness-110 active:scale-95"
                        title="Выпить зелье (Бонусное действие)"
                      >
                        <LightningStrikeIcon size={12} />
                        <span>Выпить</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── ТАБЛИЦА 2: Снаряжение и предметы ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[rgba(139,105,20,0.25)] pb-2">
          <div className="flex items-center gap-2">
            <BackpackPackIcon size={18} />
            <h4 className="font-serif font-bold text-sm text-[#3D2012] flex items-center gap-2">
              <span>Снаряжение и предметы</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#C9A84C] bg-[#FAF0DD] text-[#8B6914] font-sans">
                {currentGear.length}
              </span>
            </h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Выпадающий список наборов */}
            <div className="relative inline-block">
              <select
                aria-label="Распаковать набор D&D"
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    handleUnpackPack(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="parchment-select text-xs py-1 px-2.5 cursor-pointer max-w-[210px]"
              >
                <option value="" disabled>
                  📦 Распаковать набор D&D...
                </option>
                {availablePacks.map(pack => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.items.length} предм.)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowGearModal(true)}
              className="parchment-btn-secondary text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <span>+ Добавить предмет</span>
            </button>
          </div>
        </div>

        {currentGear.length === 0 ? (
          <div className="parchment-empty-state py-4 text-center rounded border border-dashed border-[rgba(139,105,20,0.3)] bg-[rgba(245,230,200,0.4)]">
            <BackpackPackIcon size={22} className="mx-auto mb-1 opacity-70" />
            <p className="text-xs text-[#5C341F] font-semibold">Снаряжение не записано</p>
            <p className="text-[11px] text-[#8B6914] max-w-md mx-auto">
              Распакуйте официальный походный набор D&D выше или добавьте отдельные предметы инвентаря.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[rgba(139,105,20,0.35)] shadow-xs bg-[#FAF0DD]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[rgba(240,224,194,0.95)] border-b border-[rgba(139,105,20,0.3)] text-[#5C341F] font-serif font-bold">
                  <th className="py-2 px-3">Предмет</th>
                  <th className="py-2 px-3 text-center">Кол-во</th>
                  <th className="py-2 px-3 text-center">Ед.</th>
                  <th className="py-2 px-3 text-right">Удалить</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,105,20,0.2)]">
                {currentGear.map(item => (
                  <tr key={item.id} className="hover:bg-[rgba(245,230,200,0.6)] transition-colors">
                    <td className="py-2 px-3 align-middle font-medium text-[#3D2012]">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 border border-[rgba(139,105,20,0.3)] rounded bg-[#FAF0DD] px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleGearDelta(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-[#5C341F] hover:bg-[rgba(139,105,20,0.2)] active:scale-95 transition-all"
                          title="Уменьшить на 1"
                        >
                          –1
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-[#3D2012]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGearDelta(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold text-[#5C341F] hover:bg-[rgba(139,105,20,0.2)] active:scale-95 transition-all"
                          title="Увеличить на 1"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(139,105,20,0.3)] bg-[rgba(139,105,20,0.08)] text-[#5C341F]">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRemoveGear(item.id)}
                        className="parchment-remove-btn"
                        title="Удалить предмет"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── СЕКЦИЯ 3: Сюжетные трофеи и особые заметки (Legacy Notes) ── */}
      <section className="space-y-2 border border-[rgba(139,105,20,0.3)] rounded-lg p-3 bg-[rgba(245,230,200,0.35)]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setNotesExpanded(!notesExpanded)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setNotesExpanded(!notesExpanded);
            }
          }}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <ScrollIcon size={16} />
            <span className="font-serif font-bold text-xs text-[#3D2012]">
              Сюжетные трофеи и особые заметки
            </span>
            <span className="text-[10px] text-[#8B6914] italic">
              (обратная совместимость с текстовым снаряжением)
            </span>
          </div>
          <span className="text-xs text-[#8B6914]">{notesExpanded ? '▲ скрыть' : '▼ раскрыть'}</span>
        </div>

        {notesExpanded && (
          <div className="pt-2">
            <textarea
              value={char.equipment || ''}
              onChange={e => update('equipment', e.target.value)}
              rows={3}
              placeholder="Сюжетные артефакты, ключи от подземелий, долговые расписки, трофеи с чудовищ..."
              className="parchment-textarea w-full text-xs font-serif leading-relaxed"
            />
          </div>
        )}
      </section>

      {/* ── МОДАЛЬНОЕ ОКНО: Добавить зелье ── */}
      {showPotionModal && (
        <div
          className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setShowPotionModal(false);
          }}
        >
          <div
            className="w-full max-w-xl max-h-[85vh] rounded-lg border-2 border-[#C9A84C] bg-[#F5E6C8] shadow-2xl flex flex-col overflow-hidden text-[#3D2012]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-[rgba(139,105,20,0.3)] bg-[rgba(240,224,194,0.95)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesDndIcon size={18} />
                <h3 className="font-serif font-bold text-base text-[#3D2012]">
                  Добавить зелье в инвентарь
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPotionModal(false)}
                className="parchment-remove-btn"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[rgba(139,105,20,0.3)] bg-[rgba(235,217,185,0.7)] px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setPotionTab('compendium')}
                className={`text-xs font-serif font-bold pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  potionTab === 'compendium'
                    ? 'border-[#8B4513] text-[#3D2012]'
                    : 'border-transparent text-[#8B6914] hover:text-[#3D2012]'
                }`}
              >
                Официальные зелья D&D 5e ({compendiumPotions.length})
              </button>
              <button
                type="button"
                onClick={() => setPotionTab('custom')}
                className={`text-xs font-serif font-bold pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  potionTab === 'custom'
                    ? 'border-[#8B4513] text-[#3D2012]'
                    : 'border-transparent text-[#8B6914] hover:text-[#3D2012]'
                }`}
              >
                + Кастомное зелье
              </button>
            </div>

            {/* Tab 1: Compendium Potions */}
            {potionTab === 'compendium' && (
              <div className="p-5 space-y-3 flex-1 overflow-y-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchLensIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={potionSearch}
                    onChange={e => setPotionSearch(e.target.value)}
                    placeholder="Поиск по названию, эффекту, редкости..."
                    className="parchment-input-boxed w-full pl-9 pr-3 py-1.5 text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCompendiumPotions.map(potion => (
                    <div
                      key={potion.id}
                      className="p-2.5 rounded border border-[rgba(139,105,20,0.3)] bg-[#FAF0DD] hover:bg-[rgba(245,230,200,0.9)] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#3D2012]">{potion.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getRarityBadgeStyle(
                              potion.rarity
                            )}`}
                          >
                            {potion.rarity}
                          </span>
                        </div>
                        {potion.nameEn && (
                          <div className="text-[10px] text-[#8B6914] italic">{potion.nameEn}</div>
                        )}
                        <p className="text-[11px] text-[#5C341F] mt-0.5 line-clamp-2">
                          {potion.effectSummary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCompendiumPotion(potion.id)}
                        className="parchment-btn text-xs px-3 py-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                      >
                        + Взять
                      </button>
                    </div>
                  ))}
                  {filteredCompendiumPotions.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#8B6914]">
                      Ничего не найдено по запросу «{potionSearch}»
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Custom Potion */}
            {potionTab === 'custom' && (
              <form onSubmit={handleCreateCustomPotion} className="p-5 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C341F] font-serif">
                    Название зелья <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customPotionName}
                    onChange={e => setCustomPotionName(e.target.value)}
                    placeholder="Например, Отвар шамана орков"
                    className="parchment-input-boxed w-full text-xs"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5C341F] font-serif">Тип зелья</label>
                    <select
                      value={customPotionType}
                      onChange={e => setCustomPotionType(e.target.value as any)}
                      className="parchment-select w-full text-xs"
                    >
                      <option value="heal">Лечение (ХП)</option>
                      <option value="buff">Усиление (Buff/Temp HP)</option>
                      <option value="utility">Утилитарное (Эффект)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5C341F] font-serif">Редкость</label>
                    <select
                      value={customPotionRarity}
                      onChange={e => setCustomPotionRarity(e.target.value as any)}
                      className="parchment-select w-full text-xs"
                    >
                      <option value="обычное">Обычное</option>
                      <option value="необычное">Необычное</option>
                      <option value="редкое">Редкое</option>
                      <option value="очень редкое">Очень редкое</option>
                      <option value="легендарное">Легендарное</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5C341F] font-serif">
                      Формула костей (для лечения)
                    </label>
                    <input
                      type="text"
                      value={customPotionFormula}
                      onChange={e => setCustomPotionFormula(e.target.value)}
                      placeholder="2d4+2 или 2к4+2"
                      className="parchment-input-boxed w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5C341F] font-serif">Количество</label>
                    <input
                      type="number"
                      min={1}
                      value={customPotionQty}
                      onChange={e => setCustomPotionQty(parseInt(e.target.value, 10) || 1)}
                      className="parchment-input-boxed w-full text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C341F] font-serif">
                    Краткий эффект / Описание
                  </label>
                  <textarea
                    rows={2}
                    value={customPotionEffect}
                    onChange={e => setCustomPotionEffect(e.target.value)}
                    placeholder="Восстанавливает хиты или дарует сопротивление к огню на 1 час..."
                    className="parchment-textarea w-full text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPotionModal(false)}
                    className="parchment-btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="parchment-btn text-xs px-4 py-1.5 cursor-pointer shadow-sm"
                  >
                    Создать и добавить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── МОДАЛЬНОЕ ОКНО: Добавить предмет снаряжения ── */}
      {showGearModal && (
        <div
          className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setShowGearModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-lg border-2 border-[#C9A84C] bg-[#F5E6C8] shadow-2xl flex flex-col overflow-hidden text-[#3D2012]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-[rgba(139,105,20,0.3)] bg-[rgba(240,224,194,0.95)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BackpackPackIcon size={18} />
                <h3 className="font-serif font-bold text-base text-[#3D2012]">
                  Добавить предмет снаряжения
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGearModal(false)}
                className="parchment-remove-btn"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGearItem} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C341F] font-serif">
                  Название предмета <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGearName}
                  onChange={e => setNewGearName(e.target.value)}
                  placeholder="Например, Бурдюк с вином или Веревка"
                  className="parchment-input-boxed w-full text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C341F] font-serif">Количество</label>
                  <input
                    type="number"
                    min={1}
                    value={newGearQty}
                    onChange={e => setNewGearQty(parseInt(e.target.value, 10) || 1)}
                    className="parchment-input-boxed w-full text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C341F] font-serif">
                    Единица измерения
                  </label>
                  <select
                    value={newGearUnit}
                    onChange={e => setNewGearUnit(e.target.value as any)}
                    className="parchment-select w-full text-xs"
                  >
                    <option value="шт.">шт. (штуки)</option>
                    <option value="фт.">фт. (футы)</option>
                    <option value="дн.">дн. (дни)</option>
                    <option value="фнт.">фнт. (фунты)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGearModal(false)}
                  className="parchment-btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="parchment-btn text-xs px-4 py-1.5 cursor-pointer shadow-sm"
                >
                  Добавить в рюкзак
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
