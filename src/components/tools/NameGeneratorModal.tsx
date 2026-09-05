'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FANTASY_NAMES_DATABASE,
  normalizeRaceKey,
  generateMultipleFantasyNames,
  getAvailableCultures,
  type FantasyNameResult,
} from '@/data/compendium/names-data';
import { QuillIcon, SparklesDndIcon } from '@/components/dnd-icons';

export interface NameGeneratorModalProps {
  currentRace?: string;
  onSelectName: (name: string) => void;
  onClose: () => void;
}

export function NameGeneratorModal({ currentRace, onSelectName, onClose }: NameGeneratorModalProps) {
  // Initialize race based on current character race
  const initialRaceKey = useMemo(() => {
    return normalizeRaceKey(currentRace || 'human');
  }, [currentRace]);

  const [selectedRaceKey, setSelectedRaceKey] = useState<string>(initialRaceKey);
  const [selectedCultureId, setSelectedCultureId] = useState<string>('all');
  const [gender, setGender] = useState<'male' | 'female' | 'any'>('any');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Available cultures for selected race
  const availableCultures = useMemo(() => {
    return getAvailableCultures(selectedRaceKey);
  }, [selectedRaceKey]);

  // Generated names state
  const [generatedNames, setGeneratedNames] = useState<FantasyNameResult[]>([]);

  // Generate names function
  const handleGenerate = () => {
    const cultureParam = selectedCultureId === 'all' ? undefined : selectedCultureId;
    const names = generateMultipleFantasyNames(selectedRaceKey, gender, 4, cultureParam);
    setGeneratedNames(names);
    setCopiedIndex(null);
  };

  // Generate on mount and when race/culture changes
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRaceKey, selectedCultureId, gender]);

  // Copy to clipboard with visual indicator
  const handleCopy = async (name: string, index: number) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(name);
      } else {
        // Fallback for older browsers / iframe environments
        const textArea = document.createElement('textarea');
        textArea.value = name;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(prev => (prev === index ? null : prev));
      }, 2000);
    } catch {
      // Ignore copy error silently
    }
  };

  const handleSelect = (name: string) => {
    onSelectName(name);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-modal max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative rounded-lg"
        style={{
          background: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 12px 48px rgba(30, 15, 8, 0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
          <div className="flex items-center gap-2.5">
            <QuillIcon size={24} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Генератор фэнтезийных имён
              </h3>
              <span className="text-[11px]" style={{ color: '#8B6914' }}>
                Имена и традиции именования для всех рас D&D 5e (dnd.su)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          className="p-3.5 border-b space-y-3"
          style={{ background: 'rgba(232, 211, 162, 0.35)', borderColor: 'rgba(201, 168, 76, 0.3)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Race selector */}
            <div className="space-y-1">
              <label className="parchment-label font-bold text-[11px] uppercase tracking-wide block">
                Раса
              </label>
              <select
                value={selectedRaceKey}
                onChange={e => {
                  setSelectedRaceKey(e.target.value);
                  setSelectedCultureId('all');
                }}
                className="parchment-select w-full text-xs font-semibold py-1.5 px-2"
              >
                {FANTASY_NAMES_DATABASE.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Culture / Lineage selector */}
            <div className="space-y-1">
              <label className="parchment-label font-bold text-[11px] uppercase tracking-wide block">
                Культура / Наследие
              </label>
              <select
                value={selectedCultureId}
                onChange={e => setSelectedCultureId(e.target.value)}
                className="parchment-select w-full text-xs font-semibold py-1.5 px-2"
              >
                <option value="all">Случайная культура</option>
                {availableCultures.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender selector */}
            <div className="space-y-1">
              <label className="parchment-label font-bold text-[11px] uppercase tracking-wide block">
                Пол
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'any', label: 'Любой' },
                    { id: 'male', label: 'Муж' },
                    { id: 'female', label: 'Жен' },
                  ] as const
                ).map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`text-xs py-1.5 px-1 rounded font-medium transition-colors text-center cursor-pointer ${
                      gender === g.id
                        ? 'font-bold shadow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      gender === g.id
                        ? {
                            background: '#8B4513',
                            color: '#FBF0DC',
                            border: '1px solid #C9A84C',
                          }
                        : {
                            background: 'rgba(251, 240, 220, 0.6)',
                            border: '1px solid rgba(139, 105, 20, 0.3)',
                            color: '#5C341F',
                          }
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] italic" style={{ color: '#8B6914' }}>
              Каждое имя генерируется из аутентичных смысловых морфем
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              className="parchment-btn text-xs px-4 py-1.5 flex items-center gap-1.5 font-bold shadow"
            >
              <SparklesDndIcon size={14} />
              <span>Сгенерировать имя</span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[55vh]">
          {generatedNames.map((item, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="p-3 rounded-lg transition-all space-y-2 relative group"
                style={{
                  background: 'rgba(251, 240, 220, 0.65)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  boxShadow: '0 2px 8px rgba(60, 36, 21, 0.08)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-base font-bold tracking-wide"
                      style={{
                        color: '#3D2012',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: 'rgba(201, 168, 76, 0.25)',
                        color: '#5C341F',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      {item.culture}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.name, idx)}
                      className="parchment-btn-secondary text-[11px] px-2.5 py-1 transition-colors flex items-center gap-1"
                      title="Скопировать имя в буфер обмена"
                    >
                      {isCopied ? (
                        <span className="text-green-700 font-bold">✓ Скопировано</span>
                      ) : (
                        <span>Скопировать</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.name)}
                      className="parchment-btn text-[11px] px-3 py-1 font-bold"
                      title="Выбрать это имя для персонажа"
                    >
                      Выбрать имя
                    </button>
                  </div>
                </div>

                {/* Meaning / Etymology breakdown */}
                <div
                  className="p-2 rounded text-xs leading-relaxed"
                  style={{
                    background: 'rgba(232, 211, 162, 0.3)',
                    borderLeft: '3px solid #C9A84C',
                    color: '#4A2A18',
                  }}
                >
                  <span className="font-semibold" style={{ color: '#8B6914' }}>
                    Значение:
                  </span>{' '}
                  <span className="italic">{item.meaning}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="p-3 flex items-center justify-between border-t"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.4)',
            background: 'rgba(232, 211, 162, 0.2)',
          }}
        >
          <span className="text-xs" style={{ color: '#6B3A2A' }}>
            Нажмите <strong>«Выбрать имя»</strong>, чтобы записать его в лист персонажа
          </span>
          <button onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
