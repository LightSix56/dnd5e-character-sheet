'use client';

import React from 'react';
import { EquipmentSlotId, MANNEQUIN_ANCHORS } from '@/lib/equipment-types';

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 520;

export interface EquipmentMannequinProps {
  /** Слоты, в которых сейчас что-то надето. */
  equippedSlots: ReadonlySet<EquipmentSlotId>;
  /** Слот под курсором — его точка на фигуре подсвечивается. */
  hoveredSlot: EquipmentSlotId | null;
  onHoverSlot: (slotId: EquipmentSlotId | null) => void;
  onSelectSlot: (slotId: EquipmentSlotId) => void;
  className?: string;
}

/**
 * Векторный манекен в чернильно-пергаментной гамме сайта.
 * Контур получается двумя слоями одних и тех же фигур: нижний толще и чернильный,
 * верхний — заливка. Так у составной фигуры единая обводка без швов на суставах.
 * Точки слотов берутся из MANNEQUIN_ANCHORS, поэтому фигура нарисована под эти координаты.
 */
export function EquipmentMannequin({
  equippedSlots,
  hoveredSlot,
  onHoverSlot,
  onSelectSlot,
  className = '',
}: EquipmentMannequinProps) {
  const slotIds = Object.keys(MANNEQUIN_ANCHORS) as EquipmentSlotId[];

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      fill="none"
      role="img"
      aria-label="Манекен персонажа со слотами экипировки"
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="mannequinSkin" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VIEW_HEIGHT}>
          <stop offset="0" stopColor="#EDDCB8" />
          <stop offset="1" stopColor="#D9C192" />
        </linearGradient>
      </defs>

      <g className="mannequin-outline" stroke="#5C341F" fill="#5C341F" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="140" cy="34" rx="24.0" ry="29.0" stroke="none" />
      <path d="M97 82Q140 73 183 82L181 150Q176 190 169 213L178 262Q140 277 102 262L111 213Q104 190 99 150Z" strokeWidth="14" />
      <line x1="140" y1="56" x2="140" y2="80" strokeWidth="28" />
      <line x1="95" y1="92" x2="59" y2="165" strokeWidth="31" />
      <line x1="59" y1="165" x2="29" y2="228" strokeWidth="26" />
      <line x1="27" y1="234" x2="17" y2="258" strokeWidth="21" />
      <line x1="185" y1="92" x2="221" y2="165" strokeWidth="31" />
      <line x1="221" y1="165" x2="251" y2="228" strokeWidth="26" />
      <line x1="253" y1="234" x2="263" y2="258" strokeWidth="21" />
      <line x1="122" y1="264" x2="109" y2="372" strokeWidth="43" />
      <line x1="109" y1="372" x2="101" y2="470" strokeWidth="34" />
      <line x1="101" y1="478" x2="90" y2="493" strokeWidth="23" />
      <line x1="158" y1="264" x2="171" y2="372" strokeWidth="43" />
      <line x1="171" y1="372" x2="179" y2="470" strokeWidth="34" />
      <line x1="179" y1="478" x2="190" y2="493" strokeWidth="23" />
      </g>
      <g className="mannequin-body" stroke="url(#mannequinSkin)" fill="url(#mannequinSkin)" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="140" cy="34" rx="21.0" ry="26.0" stroke="none" />
      <path d="M97 82Q140 73 183 82L181 150Q176 190 169 213L178 262Q140 277 102 262L111 213Q104 190 99 150Z" strokeWidth="8" />
      <line x1="140" y1="56" x2="140" y2="80" strokeWidth="22" />
      <line x1="95" y1="92" x2="59" y2="165" strokeWidth="25" />
      <line x1="59" y1="165" x2="29" y2="228" strokeWidth="20" />
      <line x1="27" y1="234" x2="17" y2="258" strokeWidth="15" />
      <line x1="185" y1="92" x2="221" y2="165" strokeWidth="25" />
      <line x1="221" y1="165" x2="251" y2="228" strokeWidth="20" />
      <line x1="253" y1="234" x2="263" y2="258" strokeWidth="15" />
      <line x1="122" y1="264" x2="109" y2="372" strokeWidth="37" />
      <line x1="109" y1="372" x2="101" y2="470" strokeWidth="28" />
      <line x1="101" y1="478" x2="90" y2="493" strokeWidth="17" />
      <line x1="158" y1="264" x2="171" y2="372" strokeWidth="37" />
      <line x1="171" y1="372" x2="179" y2="470" strokeWidth="28" />
      <line x1="179" y1="478" x2="190" y2="493" strokeWidth="17" />
      </g>
      <g stroke="#8B6914" strokeOpacity="0.55" fill="none" strokeLinecap="round">
      <path d="M140 88v170" strokeWidth="1.5" strokeDasharray="3 6" />
      <path d="M112 214q28 9 56 0" strokeWidth="1.5" />
      <path d="M104 126q36 14 72 0" strokeWidth="1.5" />
      </g>
      <g fill="none" stroke="#8B6914" strokeOpacity="0.5" strokeWidth="1.5">
      <circle cx="59" cy="165" r="3.5" />
      <circle cx="221" cy="165" r="3.5" />
      <circle cx="109" cy="372" r="3.5" />
      <circle cx="171" cy="372" r="3.5" />
      </g>

      {slotIds.map(slotId => {
        const anchor = MANNEQUIN_ANCHORS[slotId];
        const points = anchor.points ?? [{ x: anchor.x, y: anchor.y }];
        const isEquipped = equippedSlots.has(slotId);
        const isHovered = hoveredSlot === slotId;
        return (
          <g
            key={slotId}
            className="cursor-pointer"
            onMouseEnter={() => onHoverSlot(slotId)}
            onMouseLeave={() => onHoverSlot(null)}
            onClick={() => onSelectSlot(slotId)}
          >
            <title>{anchor.label}</title>
            {points.map((point, index) => {
              const cx = point.x * VIEW_WIDTH;
              const cy = point.y * VIEW_HEIGHT;
              return (
                <g key={index}>
                  {/* Невидимая увеличенная зона наведения */}
                  <circle cx={cx} cy={cy} r={13} fill="transparent" />
                  {isHovered && <circle cx={cx} cy={cy} r={12} fill="#FFE58F" fillOpacity={0.45} />}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 8 : isEquipped ? 7 : 5.5}
                    fill={isEquipped ? '#C9A84C' : '#FBF0DC'}
                    stroke={isEquipped ? '#5C341F' : '#C9A84C'}
                    strokeWidth={2}
                    style={{ transition: 'r 120ms ease-out' }}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
