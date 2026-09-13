'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { D20Icon } from '@/components/dnd-icons';

// ── Small helper components ──

export function CalcBadge({ value, label }: { value: string | number; label?: string }) {
  return (
    <span className="calc-badge" title={label || 'Авторасчёт'}>
      {value}
    </span>
  );
}

// ── Crypto-random dice roller (true uniform distribution) ──

export function rollD20(): number {
  // Use crypto.getRandomValues for unbiased randomness
  // Rejection sampling to avoid modulo bias: reject values >= 256 - (256 % 20) = 240
  const arr = new Uint8Array(1);
  let val: number;
  do {
    crypto.getRandomValues(arr);
    val = arr[0];
  } while (val >= 240); // reject to ensure uniform distribution
  return (val % 20) + 1; // 1..20
}

// ── Roll Result Popup ──

export interface RollResult {
  dieResult: number;   // the d20 roll (1-20) or sum of dice
  modifier: number;    // the modifier value (can be negative)
  total: number;       // dieResult + modifier
  label: string;       // what was rolled, e.g. "Проверка Силы" or "Спасбросок Лов"
  breakdown?: string;  // optional formula breakdown, e.g. "1d8 [6] + 3"
  customTotal?: string; // optional formatted display, e.g. "19 / 23"
}

export const RollResultPopup = React.memo(function RollResultPopup({
  result,
  onClose,
}: {
  result: RollResult;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const isCustomBreakdown = !!result.breakdown;
  const isNat20 = !isCustomBreakdown && !result.customTotal && result.dieResult === 20;
  const isNat1 = !isCustomBreakdown && !result.customTotal && result.dieResult === 1;

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEscapeKey(handleClose);

  // Auto-close after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(handleClose, 3500);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 parchment-modal-overlay z-[300] flex items-center justify-center bg-black/60 backdrop-blur-xs"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={closing ? { scale: 0.8, opacity: 0, y: 10 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className={`roll-result-popup ${closing ? 'closing' : ''} ${
          isNat20
            ? 'shadow-[0_0_25px_rgba(201,168,76,0.5)] border-[#C9A84C]'
            : isNat1
            ? 'shadow-[0_0_25px_rgba(139,37,0,0.4)] border-[#8B2500]'
            : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1 text-xs">
          <motion.div
            initial={{ rotate: -180, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 15 }}
          >
            <D20Icon size={18} />
          </motion.div>
          <span className="roll-result-label font-bold mb-0">{result.label}</span>
        </div>

        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: [0.6, 1.15, 1] }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`roll-result-die ${isNat20 ? 'nat20' : ''} ${isNat1 ? 'nat1' : ''}`}
        >
          {result.customTotal || (isCustomBreakdown ? result.total : result.dieResult)}
        </motion.div>

        <div className="roll-result-breakdown">
          {result.breakdown || `d20 (${result.dieResult}) ${result.modifier >= 0 ? '+' : ''}${result.modifier}`}
        </div>
        <div className="roll-result-total">= {result.customTotal || result.total}</div>
        {isNat20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="roll-result-tag crit"
          >
            ✨ Критический успех!
          </motion.div>
        )}
        {isNat1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="roll-result-tag fumble"
          >
            💀 Критический провал!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});

// ── Rollable Badge (clickable modifier badge for checks & saves) ──

export const RollBadge = React.memo(function RollBadge({
  value,
  label,
  modifier,
  onRoll,
}: {
  value: string | number;
  label?: string;
  modifier: number;
  onRoll: (result: RollResult) => void;
}) {
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const dieResult = rollD20();
    const total = dieResult + modifier;
    onRoll({ dieResult, modifier, total, label: label || 'Проверка' });
  };

  return (
    <button
      type="button"
      className="calc-badge roll-badge cursor-pointer"
      title={label ? `${label} — нажмите для броска d20` : 'Нажмите для броска d20'}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      {value}
    </button>
  );
});

export function StatInput({
  label,
  value,
  onChange,
  type = 'number',
  placeholder,
  className = '',
}: {
  label: string;
  value: string | number;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  const inputId = 'stat-input-' + label.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-');
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-5 flex items-center">
        <label className="parchment-label" htmlFor={inputId}>
          {label}
        </label>
      </div>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
          )
        }
        placeholder={placeholder}
        className="parchment-input"
      />
    </div>
  );
}

export const inputClass = 'parchment-input';
export const inputClassCenter = 'parchment-input-center';
export const textareaClass = 'parchment-textarea';

// ── Third-Casters Spell Slots (Eldritch Knight / Arcane Trickster) ──
export function getThirdCasterSpellSlots(level: number): Record<number, number> | null {
  if (level < 3) return null;
  if (level <= 3) return { 1: 2 };
  if (level <= 6) return { 1: 3 };
  if (level <= 8) return { 1: 4, 2: 2 };
  if (level <= 9) return { 1: 4, 2: 2 };
  if (level <= 12) return { 1: 4, 2: 3 };
  if (level <= 15) return { 1: 4, 2: 3, 3: 2 };
  if (level <= 18) return { 1: 4, 2: 3, 3: 3 };
  return { 1: 4, 2: 3, 3: 3, 4: 1 };
}
