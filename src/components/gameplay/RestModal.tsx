'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  CharacterData,
  getHitDieSize,
  getHitDiceNotation,
  getModifier,
  formatModifier,
  applyShortRest,
  applyLongRest,
} from '@/lib/dnd-types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  D20Icon,
  HourglassIcon,
  SparklesDndIcon,
  GoldSealCheckIcon,
  SpellbookIcon,
} from '@/components/dnd-icons';

export interface RestModalProps {
  char: CharacterData;
  onApplyRest: (updatedChar: CharacterData, toastTitle: string, toastDesc: string) => void;
  onClose: () => void;
}

interface RollHistoryEntry {
  rollIndex: number;
  dieResult: number;
  conMod: number;
  healing: number;
}

export function RestModal({ char, onApplyRest, onClose }: RestModalProps) {
  useEscapeKey(onClose);

  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');

  // Short rest state
  const [diceSpent, setDiceSpent] = useState<number>(0);
  const [hpHealedTotal, setHpHealedTotal] = useState<number>(0);
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([]);
  const isWarlock = useMemo(() => /колдун|warlock/i.test(char.className || ''), [char.className]);
  const [resetWarlockSlots, setResetWarlockSlots] = useState<boolean>(isWarlock);

  // Derived character properties
  const maxHP = char.hpMax ?? 10;
  const currentHP = char.hpCurrent ?? 0;
  const projectedHP = Math.min(maxHP, currentHP + hpHealedTotal);
  const totalHitDice = char.level || 1;
  const initiallySpentDice = char.hitDiceSpent || 0;
  const availableDice = Math.max(0, totalHitDice - initiallySpentDice - diceSpent);

  const dieSize = useMemo(() => getHitDieSize(char.hitDice || '1d8'), [char.hitDice]);
  const notation = useMemo(() => getHitDiceNotation(char.hitDice || '1d8'), [char.hitDice]);
  const conMod = useMemo(() => getModifier(char, 'ТЕЛ'), [char]);

  // Long rest recovery calculation
  const diceToRecoverOnLongRest = Math.max(1, Math.floor(totalHitDice / 2));
  const newSpentAfterLongRest = Math.max(0, initiallySpentDice - diceToRecoverOnLongRest);

  // Spend one hit die
  const handleRollHitDie = useCallback(() => {
    if (availableDice <= 0 || projectedHP >= maxHP) return;

    // Cryptographically unbiased uniform random die roll (1..dieSize)
    const arr = new Uint32Array(1);
    const maxSafe = Math.floor(0xffffffff / dieSize) * dieSize;
    let val: number;
    do {
      crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= maxSafe);
    const dieRoll = (val % dieSize) + 1;

    // Healing is roll + CON modifier, minimum 0
    const healedAmount = Math.max(0, dieRoll + conMod);
    const actualHealing = Math.min(healedAmount, maxHP - projectedHP);

    const newEntry: RollHistoryEntry = {
      rollIndex: diceSpent + 1,
      dieResult: dieRoll,
      conMod,
      healing: actualHealing,
    };

    setDiceSpent(prev => prev + 1);
    setHpHealedTotal(prev => prev + actualHealing);
    setRollHistory(prev => [newEntry, ...prev]);
  }, [availableDice, projectedHP, maxHP, dieSize, conMod, diceSpent]);

  // Confirm short rest
  const handleFinishShortRest = useCallback(() => {
    const updated = applyShortRest(char, {
      diceSpent,
      hpHealed: hpHealedTotal,
      resetWarlockSlots,
    });

    const parts: string[] = [];
    if (hpHealedTotal > 0) parts.push(`Восстановлено ${hpHealedTotal} HP`);
    if (diceSpent > 0) parts.push(`Потрачено костей: ${diceSpent}`);
    if (resetWarlockSlots && isWarlock) parts.push('Ячейки пакта восстановлены');

    const desc = parts.length > 0 ? parts.join(' · ') : 'Отдых завершён без изменений';
    onApplyRest(updated, 'Короткий отдых завершён', desc);
    onClose();
  }, [char, diceSpent, hpHealedTotal, resetWarlockSlots, isWarlock, onApplyRest, onClose]);

  // Confirm long rest
  const handleFinishLongRest = useCallback(() => {
    const updated = applyLongRest(char);
    const recoveredCount = Math.min(initiallySpentDice, diceToRecoverOnLongRest);

    onApplyRest(
      updated,
      'Продолжительный отдых завершён',
      `HP полностью восстановлены (${maxHP}/${maxHP}) · Восстановлено костей: ${recoveredCount} · Ячейки обновлены`
    );
    onClose();
  }, [char, initiallySpentDice, diceToRecoverOnLongRest, maxHP, onApplyRest, onClose]);

  return (
    <div
      className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      // Deliberately no backdrop dismiss to avoid accidental loss of rest/dice state
    >
      <div
        className="w-full max-w-xl rounded-xl border-2 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: '#F5E6C8',
          borderColor: '#C9A84C',
          color: '#3D2012',
          boxShadow: '0 20px 45px rgba(35, 17, 7, 0.55), 0 0 0 1px rgba(201, 168, 76, 0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.4)',
            background: 'linear-gradient(180deg, rgba(232, 211, 162, 0.6) 0%, rgba(245, 230, 200, 0.4) 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-inner"
              style={{ background: '#5C341F', border: '1px solid #C9A84C' }}
            >
              <HourglassIcon size={20} />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold leading-tight"
                style={{ fontFamily: 'Georgia, serif', color: '#3D2012' }}
              >
                Лагерь и Отдых
              </h2>
              <p className="text-xs" style={{ color: '#8B6914' }}>
                {char.name || 'Безымянный герой'} · {char.className || 'Класс'} {char.level} ур.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="parchment-remove-btn w-8 h-8 flex items-center justify-center rounded text-sm font-bold"
            title="Закрыть (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex border-b text-xs sm:text-sm font-bold"
          style={{ borderColor: 'rgba(201, 168, 76, 0.35)', background: 'rgba(232, 211, 162, 0.35)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('short')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'short'
                ? 'border-[#5C341F] text-[#3D2012] bg-[#F5E6C8] font-bold shadow-xs'
                : 'border-transparent text-[#8B6914] hover:text-[#5C341F] hover:bg-black/5'
            }`}
          >
            <span>⏳ Короткий отдых (1 ч.)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('long')}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'long'
                ? 'border-[#5C341F] text-[#3D2012] bg-[#F5E6C8] font-bold shadow-xs'
                : 'border-transparent text-[#8B6914] hover:text-[#5C341F] hover:bg-black/5'
            }`}
          >
            <span>🌙 Продолжительный отдых (8 ч.)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'short' ? (
            // SHORT REST CONTENT
            <div className="space-y-4">
              <div
                className="p-3 rounded-lg text-xs leading-relaxed"
                style={{
                  background: 'rgba(201, 168, 76, 0.12)',
                  border: '1px solid rgba(201, 168, 76, 0.35)',
                  color: '#4A2A18',
                }}
              >
                Короткий отдых длится не менее 1 часа. Вы можете потратить одну или несколько костей хитов, бросая их и восстанавливая здоровье на значение броска плюс ваш модификатор Телосложения.
              </div>

              {/* Status overview */}
              <div
                className="p-3.5 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 text-center"
                style={{ background: 'rgba(232, 211, 162, 0.45)', border: '1px solid rgba(201, 168, 76, 0.4)' }}
              >
                <div>
                  <span className="text-[11px] block font-medium" style={{ color: '#8B6914' }}>
                    Здоровье
                  </span>
                  <span className="text-base sm:text-lg font-bold" style={{ color: '#3D2012' }}>
                    {projectedHP} / {maxHP}
                  </span>
                  {hpHealedTotal > 0 && (
                    <span className="text-[11px] block font-bold text-emerald-800">
                      (+{hpHealedTotal} HP)
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] block font-medium" style={{ color: '#8B6914' }}>
                    Кости хитов
                  </span>
                  <span className="text-base sm:text-lg font-bold" style={{ color: '#3D2012' }}>
                    {availableDice} / {totalHitDice}
                  </span>
                  <span className="text-[11px] block" style={{ color: '#8B6914' }}>
                    размер 1{notation}{dieSize}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] block font-medium" style={{ color: '#8B6914' }}>
                    Мод. Телосложения
                  </span>
                  <span className="text-base sm:text-lg font-bold" style={{ color: '#3D2012' }}>
                    {formatModifier(conMod)}
                  </span>
                  <span className="text-[11px] block" style={{ color: '#8B6914' }}>
                    к каждому броску
                  </span>
                </div>
              </div>

              {/* Roll hit die button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRollHitDie}
                  disabled={availableDice <= 0 || projectedHP >= maxHP}
                  className="w-full parchment-btn py-3 px-4 rounded-lg flex items-center justify-center gap-2.5 font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <D20Icon size={18} />
                  <span>
                    Потратить кость хитов (1{notation}{dieSize} {conMod >= 0 ? `+ ${conMod}` : `- ${Math.abs(conMod)}`})
                  </span>
                </button>

                {projectedHP >= maxHP && (
                  <p className="text-center text-xs font-semibold text-emerald-800">
                    ✨ Здоровье уже полностью восстановлено!
                  </p>
                )}
                {availableDice <= 0 && projectedHP < maxHP && (
                  <p className="text-center text-xs font-semibold" style={{ color: '#8B2500' }}>
                    ⚠️ Все кости хитов потрачены. Для их восстановления требуется продолжительный отдых.
                  </p>
                )}
              </div>

              {/* Roll history */}
              {rollHistory.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold" style={{ color: '#5C341F' }}>
                    История бросков отдыха:
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                    {rollHistory.map(entry => (
                      <div
                        key={entry.rollIndex}
                        className="flex items-center justify-between px-3 py-1.5 rounded text-xs"
                        style={{
                          background: 'rgba(251, 240, 220, 0.9)',
                          border: '1px solid rgba(201, 168, 76, 0.35)',
                        }}
                      >
                        <span>Кость #{entry.rollIndex}: бросок <strong>{entry.dieResult}</strong> {entry.conMod >= 0 ? `+ ${entry.conMod}` : `- ${Math.abs(entry.conMod)}`}</span>
                        <strong className="text-emerald-800">+{entry.healing} HP</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warlock pact slot checkbox */}
              {isWarlock && (
                <label className="flex items-center gap-2 p-2.5 rounded cursor-pointer select-none" style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.35)' }}>
                  <input
                    type="checkbox"
                    checked={resetWarlockSlots}
                    onChange={e => setResetWarlockSlots(e.target.checked)}
                    className="accent-[#8B6914] w-4 h-4 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold" style={{ color: '#3D2012' }}>🔮 Магия пакта Колдуна:</span>
                    <span className="text-[#5C341F] ml-1">восстановить все ячейки заклинаний</span>
                  </div>
                </label>
              )}
            </div>
          ) : (
            // LONG REST CONTENT
            <div className="space-y-4">
              <div
                className="p-3 rounded-lg text-xs leading-relaxed"
                style={{
                  background: 'rgba(201, 168, 76, 0.12)',
                  border: '1px solid rgba(201, 168, 76, 0.35)',
                  color: '#4A2A18',
                }}
              >
                Продолжительный отдых длится не менее 8 часов. Персонаж полностью восстанавливает силы, излечивает раны и обновляет магическую энергию.
              </div>

              <div
                className="p-3.5 rounded-lg space-y-2.5 text-xs"
                style={{ background: 'rgba(232, 211, 162, 0.45)', border: '1px solid rgba(201, 168, 76, 0.4)' }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#C9A84C]/30">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>💖</span> <span>Здоровье:</span>
                  </span>
                  <span className="font-bold text-sm" style={{ color: '#3D2012' }}>
                    {currentHP} ➔ <strong className="text-emerald-800">{maxHP} HP (100%)</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#C9A84C]/30">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>🛡️</span> <span>Временные хиты:</span>
                  </span>
                  <span className="font-bold">
                    {char.hpTemp > 0 ? `${char.hpTemp} ➔ 0` : '0 (нет)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#C9A84C]/30">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>💀</span> <span>Спасброски от смерти:</span>
                  </span>
                  <span className="font-bold">
                    {char.deathSaveSuccesses > 0 || char.deathSaveFailures > 0
                      ? `Сброс (${char.deathSaveSuccesses} усп. / ${char.deathSaveFailures} пров. ➔ 0)`
                      : '0 / 0'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#C9A84C]/30">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>🎲</span> <span>Восстановление костей хитов:</span>
                  </span>
                  <span className="font-bold" style={{ color: '#3D2012' }}>
                    +{diceToRecoverOnLongRest} костей ({initiallySpentDice} ➔ {newSpentAfterLongRest} потрачено)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>🔮</span> <span>Ячейки заклинаний:</span>
                  </span>
                  <span className="font-bold text-emerald-800">
                    Полное восстановление всех кругов
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.4)',
            background: 'linear-gradient(180deg, rgba(245, 230, 200, 0.95) 0%, #F5E6C8 100%)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="parchment-btn-secondary px-4 py-2 text-xs sm:text-sm cursor-pointer"
          >
            Отмена
          </button>

          {activeTab === 'short' ? (
            <button
              type="button"
              onClick={handleFinishShortRest}
              className="parchment-btn px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <GoldSealCheckIcon size={16} />
              <span>Завершить короткий отдых</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishLongRest}
              className="parchment-btn px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <SparklesDndIcon size={16} />
              <span>Завершить продолжительный отдых</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
