'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  CharacterData,
  getAC,
  getEffectiveSpeed,
  getCarryingCapacity,
} from '@/lib/dnd-types';
import {
  EquipmentSlotId,
  EquippedItem,
  EQUIPMENT_SLOTS,
  equipItem,
  unequipItem,
  isOffHandBlocked,
  getOffHandBlockedReason,
} from '@/lib/equipment-types';
import { EquipmentSlotModal } from './EquipmentSlotModal';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export interface EquipmentPaperDollProps {
  char: CharacterData;
  onChange: (updatedChar: CharacterData) => void;
  onClose?: () => void;
}

export function EquipmentPaperDoll({ char, onChange, onClose }: EquipmentPaperDollProps) {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotId | null>(null);

  useEscapeKey(onClose, !!onClose && !selectedSlot);

  // Split slots into Left column (7 slots) and Right column (6 slots)
  const leftSlotIds: EquipmentSlotId[] = [
    'head',
    'neck',
    'armor',
    'mainHand',
    'offHand',
    'belt',
    'ring1',
  ];

  const rightSlotIds: EquipmentSlotId[] = [
    'cloak',
    'quiver',
    'gloves',
    'ring2',
    'pouch',
    'boots',
  ];

  const slotConfigMap = useMemo(() => {
    const map = new Map<EquipmentSlotId, (typeof EQUIPMENT_SLOTS)[0]>();
    for (const slot of EQUIPMENT_SLOTS) {
      map.set(slot.id, slot);
    }
    return map;
  }, []);

  const offHandBlocked = useMemo(() => isOffHandBlocked(char), [char]);
  const offHandReason = useMemo(() => getOffHandBlockedReason(char), [char]);

  const liveAC = useMemo(() => getAC(char), [char]);
  const liveSpeed = useMemo(() => getEffectiveSpeed(char), [char]);
  const capacity = useMemo(() => getCarryingCapacity(char), [char]);

  const handleEquip = useCallback(
    (slotId: EquipmentSlotId, item: EquippedItem) => {
      const updated = equipItem(char, slotId, item);
      onChange(updated);
    },
    [char, onChange]
  );

  const handleUnequip = useCallback(
    (slotId: EquipmentSlotId) => {
      const updated = unequipItem(char, slotId);
      onChange(updated);
    },
    [char, onChange]
  );

  const renderSlotCard = (slotId: EquipmentSlotId) => {
    const config = slotConfigMap.get(slotId);
    if (!config) return null;

    const equipped = char.equippedSlots?.[slotId];
    const isLockedOffHand = slotId === 'offHand' && offHandBlocked;

    return (
      <div
        key={slotId}
        onClick={() => {
          setSelectedSlot(slotId);
        }}
        className={`group relative p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
          isLockedOffHand
            ? 'border-dashed border-amber-500/50 bg-[#E8DAC2]/50 hover:bg-[#E8DAC2]/80 opacity-85'
            : equipped
            ? 'border-[#C9A84C] bg-[#FBF0DC]/95 hover:bg-[#FFF8EC] shadow-[0_2px_8px_rgba(201,168,76,0.2)]'
            : 'border-dashed border-[#C9A84C]/50 bg-[#F5E6C8]/40 hover:bg-[#F5E6C8]/80 hover:border-[#C9A84C]'
        }`}
      >
        {/* Slot Header */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none select-none">{config.icon}</span>
            <span className="font-serif text-xs font-bold text-[#3D2012] truncate">
              {config.name}
            </span>
          </div>

          {/* Quick Unequip Button */}
          {equipped && !isLockedOffHand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUnequip(slotId);
              }}
              className="parchment-remove-btn w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-80 hover:opacity-100 hover:scale-110 transition-transform"
              title="Снять предмет"
            >
              ✕
            </button>
          )}
        </div>

        {/* Slot Body */}
        {isLockedOffHand ? (
          <div className="py-1">
            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
              <span>🔒</span>
              <span>[ Занято хватом ]</span>
            </div>
            <p className="text-[10px] text-amber-700/90 leading-tight mt-0.5">
              {offHandReason || 'Двуручное оружие'}
            </p>
          </div>
        ) : equipped ? (
          <div className="space-y-1">
            <div className="font-serif text-xs font-bold text-[#3D2012] leading-tight truncate">
              {equipped.name}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {equipped.bonusAC !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C9A84C]/25 text-[#3D2012] font-semibold">
                  +{equipped.bonusAC} КД
                </span>
              )}
              {equipped.bonusSpeed !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-semibold">
                  +{equipped.bonusSpeed} фт.
                </span>
              )}
              {equipped.twoHanded && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-900 font-semibold">
                  Двуручное
                </span>
              )}
              {equipped.isShield && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 font-semibold">
                  Щит
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-1">
            <span className="text-[11px] text-[#8B6914] italic">
              Пусто — нажать для выбора
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="parchment-card p-4 sm:p-6 rounded-xl border-2 border-[#C9A84C] shadow-xl text-[#3D2012]">
      {/* Top Header strictly «ЭКИПИРОВКА» */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#C9A84C]/40">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#C9A84C] rounded-sm shadow-sm" />
          <h2 className="font-serif text-2xl font-bold tracking-wider text-[#3D2012] uppercase">
            Экипировка
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="parchment-remove-btn w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none"
            title="Закрыть"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Container: Left Slots + Center Silhouette + Right Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Column: 7 slots */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 order-2 lg:order-1">
          {leftSlotIds.map(renderSlotCard)}
        </div>

        {/* Center: Silhouette Mannequin with ambient golden glow */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-2 order-1 lg:order-2">
          <div className="relative w-[240px] sm:w-[280px] h-[360px] sm:h-[440px] flex items-center justify-center">
            {/* Ambient backlight */}
            <div className="absolute inset-4 rounded-full bg-[#FFE58F]/15 blur-2xl pointer-events-none" />

            <Image
              src="/mannequin.png"
              alt="Манекен персонажа"
              fill
              className="object-contain filter drop-shadow-[0_4px_12px_rgba(61,32,18,0.25)] select-none pointer-events-none"
              priority
            />
          </div>
        </div>

        {/* Right Column: 6 slots */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 order-3">
          {rightSlotIds.map(renderSlotCard)}
        </div>
      </div>

      {/* Live Stats Summary Bar */}
      <div className="mt-5 pt-3 border-t border-[#C9A84C]/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2">
          <span className="text-xl">🛡️</span>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#8B6914] block leading-none">
              Класс Доспеха
            </span>
            <span className="font-serif text-lg font-bold text-[#3D2012]">
              {liveAC}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2">
          <span className="text-xl">🏃</span>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#8B6914] block leading-none">
              Скорость
            </span>
            <span className="font-serif text-lg font-bold text-[#3D2012]">
              {liveSpeed} фт.
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2">
          <span className="text-xl">⚖️</span>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#8B6914] block leading-none">
              Грузоподъемность
            </span>
            <span className="font-serif text-lg font-bold text-[#3D2012]">
              {capacity.maxCarry} фнт.
            </span>
          </div>
        </div>
      </div>

      {/* Equipment Slot Item Selection Modal */}
      {selectedSlot && (
        <EquipmentSlotModal
          slotId={selectedSlot}
          char={char}
          isOpen={true}
          onClose={() => setSelectedSlot(null)}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      )}
    </div>
  );
}
