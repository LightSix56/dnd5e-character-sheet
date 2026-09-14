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
  LEFT_EQUIPMENT_SLOTS,
  RIGHT_EQUIPMENT_SLOTS,
  CENTER_EQUIPMENT_SLOTS,
  MANNEQUIN_ANCHORS,
  MannequinAnchor,
  equipItem,
  unequipItem,
  deleteCustomItem,
  isOffHandBlocked,
  getOffHandBlockedReason,
  toggleMainHandGrip,
} from '@/lib/equipment-types';
import { canToggleWeaponGrip, findWeaponByName } from '@/data/dnd-weapons';
import { EquipmentSlotModal } from './EquipmentSlotModal';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  LockSealIcon,
  EngravedShieldIcon,
  WingedBootIcon,
  WeightAnvilIcon,
} from '@/components/dnd-icons';

export interface EquipmentPaperDollProps {
  char: CharacterData;
  onChange: (updatedChar: CharacterData) => void;
  onClose?: () => void;
  onToggleMainHandGrip?: () => void;
}

export function EquipmentPaperDoll({ char, onChange, onClose, onToggleMainHandGrip }: EquipmentPaperDollProps) {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotId | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<EquipmentSlotId | null>(null);
  const [lines, setLines] = useState<
    Record<string, { x1: number; y1: number; x2: number; y2: number; points?: Array<{ x: number; y: number }> }>
  >({});

  const containerRef = React.useRef<HTMLDivElement>(null);
  const mannequinRef = React.useRef<HTMLDivElement>(null);

  useEscapeKey(onClose, !!onClose && !selectedSlot);

  const leftSlotIds = LEFT_EQUIPMENT_SLOTS;
  const rightSlotIds = RIGHT_EQUIPMENT_SLOTS;

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

  const handleDeleteCustomItem = useCallback(
    (itemId: string) => {
      const updated = deleteCustomItem(char, itemId);
      onChange(updated);
    },
    [char, onChange]
  );

  const updateLines = useCallback(() => {
    if (!containerRef.current || !mannequinRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mannequinRect = mannequinRef.current.getBoundingClientRect();

    if (containerRect.width === 0 || mannequinRect.width === 0) return;

    const newLines: Record<
      string,
      { x1: number; y1: number; x2: number; y2: number; points?: Array<{ x: number; y: number }> }
    > = {};

    for (const [slotId, anchor] of Object.entries(MANNEQUIN_ANCHORS) as [EquipmentSlotId, MannequinAnchor][]) {
      const cardEl = containerRef.current.querySelector<HTMLElement>(`[data-slot-id="${slotId}"]`);
      if (!cardEl) continue;

      const cardRect = cardEl.getBoundingClientRect();
      const x2 = mannequinRect.left - containerRect.left + mannequinRect.width * anchor.x;
      const y2 = mannequinRect.top - containerRect.top + mannequinRect.height * anchor.y;

      let x1 = 0;
      let y1 = 0;

      if (LEFT_EQUIPMENT_SLOTS.includes(slotId)) {
        x1 = cardRect.right - containerRect.left;
        y1 = cardRect.top - containerRect.top + cardRect.height / 2;
      } else if (RIGHT_EQUIPMENT_SLOTS.includes(slotId)) {
        x1 = cardRect.left - containerRect.left;
        y1 = cardRect.top - containerRect.top + cardRect.height / 2;
      } else if (slotId === 'boots') {
        x1 = cardRect.left - containerRect.left + cardRect.width / 2;
        y1 = cardRect.top - containerRect.top;
      }

      const points = anchor.points?.map((pt) => ({
        x: mannequinRect.left - containerRect.left + mannequinRect.width * pt.x,
        y: mannequinRect.top - containerRect.top + mannequinRect.height * pt.y,
      }));

      newLines[slotId] = { x1, y1, x2, y2, points };
    }

    setLines(newLines);
  }, []);

  React.useEffect(() => {
    updateLines();
    const timer = setTimeout(updateLines, 60);

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          updateLines();
        })
      : null;

    if (containerRef.current && ro) {
      ro.observe(containerRef.current);
    }
    if (mannequinRef.current && ro) {
      ro.observe(mannequinRef.current);
    }

    window.addEventListener('resize', updateLines);
    return () => {
      clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener('resize', updateLines);
    };
  }, [updateLines, char]);

  const renderSlotCard = (slotId: EquipmentSlotId) => {
    const config = slotConfigMap.get(slotId);
    if (!config) return null;

    const equipped = char.equippedSlots?.[slotId];
    const isLockedOffHand = slotId === 'offHand' && offHandBlocked;
    const isMainHand = slotId === 'mainHand';
    const mainWeaponDef = isMainHand && equipped ? findWeaponByName(equipped.name) : undefined;
    const canToggleGrip = isMainHand && canToggleWeaponGrip(mainWeaponDef);
    const isHovered = hoveredSlot === slotId;

    return (
      <div
        key={slotId}
        data-slot-id={slotId}
        onClick={() => {
          setSelectedSlot(slotId);
        }}
        onMouseEnter={() => setHoveredSlot(slotId)}
        onMouseLeave={() => setHoveredSlot(null)}
        className={`group relative p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
          isLockedOffHand
            ? 'border-dashed border-amber-500/50 bg-[#E8DAC2]/50 hover:bg-[#E8DAC2]/80 opacity-85'
            : equipped
            ? 'border-[#C9A84C] bg-[#FBF0DC]/95 hover:bg-[#FFF8EC] shadow-[0_2px_8px_rgba(201,168,76,0.2)]'
            : 'border-dashed border-[#C9A84C]/50 bg-[#F5E6C8]/40 hover:bg-[#F5E6C8]/80 hover:border-[#C9A84C]'
        } ${isHovered ? 'ring-2 ring-[#C9A84C] shadow-[0_0_12px_rgba(201,168,76,0.35)] scale-[1.01]' : ''}`}
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
            <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
              <LockSealIcon size={13} />
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
              {equipped.twoHanded ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-900 font-semibold">
                  Двуручное
                </span>
              ) : equipped.twoHandGrip ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-900 font-semibold">
                  2H хват
                </span>
              ) : canToggleGrip ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C9A84C]/25 text-[#3D2012] font-semibold">
                  1H хват
                </span>
              ) : null}
              {equipped.isShield && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 font-semibold">
                  Щит
                </span>
              )}
            </div>

            {/* Interactive Grip Toggle for Versatile / Special weapons */}
            {canToggleGrip && (
              <div className="mt-1 pt-1 border-t border-[#C9A84C]/30 flex items-center justify-between gap-1">
                <span className="text-[10px] text-[#8B6914] font-medium">Хват:</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleMainHandGrip) {
                      onToggleMainHandGrip();
                    } else {
                      onChange(toggleMainHandGrip(char));
                    }
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  style={{
                    background: equipped.twoHandGrip
                      ? 'linear-gradient(180deg, #8B4513, #5C341F)'
                      : 'rgba(232, 211, 162, 0.95)',
                    color: equipped.twoHandGrip ? '#FFE58F' : '#5C341F',
                    border: equipped.twoHandGrip ? '1px solid #C9A84C' : '1px solid rgba(139, 105, 20, 0.45)',
                  }}
                  title={equipped.twoHandGrip
                    ? 'Двуручный хват (увеличенный урон, вторая рука блокируется). Нажмите для 1H хвата'
                    : 'Одноручный хват (базовый урон, вторая рука свободна). Нажмите для 2H хвата'}
                >
                  <span>{equipped.twoHandGrip ? '👐 2H хват' : '✋ 1H хват'}</span>
                </button>
              </div>
            )}
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
      <div ref={containerRef} className="relative">
        {/* SVG Connector Lines Overlay (visible on desktop/laptop where 3 columns sit side-by-side) */}
        <svg
          className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <filter id="equip-gold-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {Object.entries(lines).map(([slotKey, line]) => {
            const slotId = slotKey as EquipmentSlotId;
            const isHovered = hoveredSlot === slotId;
            const isEquipped = !!char.equippedSlots?.[slotId];
            const hasBranch = !!line.points && line.points.length > 0;

            const strokeColor = isHovered
              ? '#FFE58F'
              : isEquipped
              ? '#C9A84C'
              : 'rgba(139, 105, 20, 0.45)';
            const strokeWidth = isHovered ? 2 : isEquipped ? 1.5 : 1.2;
            const strokeDash = isEquipped || isHovered ? 'none' : '3 3';

            return (
              <g key={slotId} className="transition-all duration-150">
                {/* Connector line path */}
                {hasBranch ? (
                  <>
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      filter={isHovered ? 'url(#equip-gold-glow)' : undefined}
                    />
                    {line.points!.map((pt, idx) => (
                      <line
                        key={idx}
                        x1={line.x2}
                        y1={line.y2}
                        x2={pt.x}
                        y2={pt.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        filter={isHovered ? 'url(#equip-gold-glow)' : undefined}
                      />
                    ))}
                  </>
                ) : (
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    filter={isHovered ? 'url(#equip-gold-glow)' : undefined}
                  />
                )}

                {/* Card anchor dot */}
                <circle
                  cx={line.x1}
                  cy={line.y1}
                  r={isHovered ? 3.5 : 2.5}
                  fill={isHovered ? '#FFE58F' : isEquipped ? '#C9A84C' : '#8B6914'}
                  opacity={isEquipped || isHovered ? 1 : 0.6}
                />

                {/* Body pin dot(s) */}
                {hasBranch ? (
                  line.points!.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : 3.5}
                        fill={isEquipped ? '#C9A84C' : '#5C341F'}
                        stroke={isHovered ? '#FFE58F' : '#E5C158'}
                        strokeWidth={isHovered ? 2 : 1.2}
                        filter={isHovered ? 'url(#equip-gold-glow)' : undefined}
                      />
                      {/* Interactive hover and click hit target */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer pointer-events-auto"
                        onClick={() => setSelectedSlot(slotId)}
                        onMouseEnter={() => setHoveredSlot(slotId)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      />
                    </g>
                  ))
                ) : (
                  <g>
                    <circle
                      cx={line.x2}
                      cy={line.y2}
                      r={isHovered ? 5 : 3.5}
                      fill={isEquipped ? '#C9A84C' : '#5C341F'}
                      stroke={isHovered ? '#FFE58F' : '#E5C158'}
                      strokeWidth={isHovered ? 2 : 1.2}
                      filter={isHovered ? 'url(#equip-gold-glow)' : undefined}
                    />
                    {/* Interactive hover and click hit target */}
                    <circle
                      cx={line.x2}
                      cy={line.y2}
                      r={12}
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                      onClick={() => setSelectedSlot(slotId)}
                      onMouseEnter={() => setHoveredSlot(slotId)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative z-20">
          {/* Left Column: 6 slots */}
          <div className="lg:col-span-4 flex flex-col justify-start gap-2 order-2 lg:order-1">
            {leftSlotIds.map(renderSlotCard)}
          </div>

          {/* Center Column: Silhouette Mannequin (tall) + Boots slot at bottom */}
          <div className="lg:col-span-4 flex flex-col items-center justify-between order-1 lg:order-2 py-1">
            {/* Mannequin figure container: tall to reach near top and bottom */}
            <div
              ref={mannequinRef}
              className="relative w-full max-w-[240px] sm:max-w-[270px] lg:max-w-[280px] h-[470px] sm:h-[500px] lg:h-[520px] flex items-center justify-center select-none"
            >
              {/* Ambient backlight glow */}
              <div className="absolute inset-4 rounded-full bg-[#FFE58F]/15 blur-2xl pointer-events-none" />

              <Image
                src="/mannequin.png"
                alt="Манекен персонажа"
                fill
                sizes="(max-width: 768px) 270px, 280px"
                className="object-contain filter drop-shadow-[0_4px_14px_rgba(61,32,18,0.3)] select-none pointer-events-none mix-blend-multiply"
                priority
                onLoad={updateLines}
              />
            </div>

            {/* Bottom Center: Boots card */}
            <div className="w-full max-w-[260px] mt-2">
              {renderSlotCard('boots')}
            </div>
          </div>

          {/* Right Column: 6 slots */}
          <div className="lg:col-span-4 flex flex-col justify-start gap-2 order-3">
            {rightSlotIds.map(renderSlotCard)}
          </div>
        </div>
      </div>

      {/* Live Stats Summary Bar */}
      <div className="mt-5 pt-3 border-t border-[#C9A84C]/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2.5">
          <EngravedShieldIcon size={24} />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#8B6914] block leading-none">
              Класс Доспеха
            </span>
            <span className="font-serif text-lg font-bold text-[#3D2012]">
              {liveAC}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2.5">
          <WingedBootIcon size={24} />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-[#8B6914] block leading-none">
              Скорость
            </span>
            <span className="font-serif text-lg font-bold text-[#3D2012]">
              {liveSpeed} фт.
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#EAD6B8]/50 border border-[#C9A84C]/50 flex items-center justify-center gap-2.5">
          <WeightAnvilIcon size={24} />
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
          onDeleteCustomItem={handleDeleteCustomItem}
        />
      )}
    </div>
  );
}
