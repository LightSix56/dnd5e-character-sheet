'use client';

import React, { useState } from 'react';
import { DND_COMPENDIUM_CLASSES, type CompendiumClass } from '@/data/compendium/classes';
import { CrossedSwordsIcon, SparklesDndIcon, ScrollIcon, EngravedShieldIcon } from '@/components/dnd-icons';

interface ClassSelectorModalProps {
  currentClass?: string;
  onSelect: (cls: CompendiumClass) => void;
  onClose: () => void;
}

export function ClassSelectorModal({ currentClass, onSelect, onClose }: ClassSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (currentClass) {
      const match = DND_COMPENDIUM_CLASSES.find(c => 
        currentClass.toLowerCase().includes(c.name.toLowerCase()) || 
        currentClass.toLowerCase().includes(c.nameEn.toLowerCase())
      );
      if (match) return match.id;
    }
    return DND_COMPENDIUM_CLASSES[0]?.id || 'fighter';
  });

  const selectedClass = DND_COMPENDIUM_CLASSES.find(c => c.id === selectedClassId) || DND_COMPENDIUM_CLASSES[0];

  const filteredClasses = DND_COMPENDIUM_CLASSES.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || 
      c.nameEn.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q);
  });

  const handleApply = () => {
    if (selectedClass) {
      onSelect(selectedClass);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="parchment-modal max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative rounded-lg"
        style={{
          background: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 12px 48px rgba(30, 15, 8, 0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
          <div className="flex items-center gap-2">
            <CrossedSwordsIcon size={24} />
            <h3 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Компендиум классов D&D 5e
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
          >
            ✕
          </button>
        </div>

        {/* Content layout: Sidebar list + Detail panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Class list */}
          <div className="w-full md:w-64 border-r flex flex-col p-3 gap-2 overflow-y-auto max-h-[30vh] md:max-h-[70vh]" style={{ borderColor: 'rgba(201, 168, 76, 0.3)', background: 'rgba(232, 211, 162, 0.25)' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск класса..."
              className="parchment-input text-xs w-full py-1.5 px-2.5"
            />
            <div className="space-y-1 overflow-y-auto">
              {filteredClasses.map(cls => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'font-bold shadow-sm'
                        : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                    }`}
                    style={
                      isSelected
                        ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                        : { border: '1px solid transparent' }
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cls.emoji}</span>
                      <div>
                        <div>{cls.name}</div>
                        <div className="text-[10px] opacity-70">{cls.nameEn}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(139, 105, 20, 0.15)' }}>
                      d{cls.hitDieSize}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Class details */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[50vh] md:max-h-[70vh] space-y-4">
            {selectedClass && (
              <>
                <div className="border-b pb-3" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedClass.emoji}</span>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>
                        {selectedClass.name}
                      </h2>
                      <span className="text-xs font-semibold" style={{ color: '#8B6914' }}>
                        {selectedClass.nameEn} • {selectedClass.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4A2A18' }}>
                    {selectedClass.description}
                  </p>
                </div>

                {/* Key stats badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <span className="text-[10px] font-bold block uppercase" style={{ color: '#8B6914' }}>Кость хитов</span>
                    <span className="text-sm font-bold font-mono" style={{ color: '#6B3A2A' }}>d{selectedClass.hitDieSize}</span>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <span className="text-[10px] font-bold block uppercase" style={{ color: '#8B6914' }}>Основная хар-ка</span>
                    <span className="text-sm font-bold" style={{ color: '#6B3A2A' }}>{selectedClass.primaryAbility}</span>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <span className="text-[10px] font-bold block uppercase" style={{ color: '#8B6914' }}>Спасброски</span>
                    <span className="text-sm font-bold" style={{ color: '#6B3A2A' }}>{selectedClass.savingThrowProfs.join(', ')}</span>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <span className="text-[10px] font-bold block uppercase" style={{ color: '#8B6914' }}>Архетип с ур.</span>
                    <span className="text-sm font-bold font-mono" style={{ color: '#6B3A2A' }}>{selectedClass.subclassLevel} ур.</span>
                  </div>
                </div>

                {/* Proficiencies */}
                <div className="p-3 rounded text-xs space-y-1" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                  <div className="font-bold uppercase text-[10px]" style={{ color: '#8B6914' }}>Владение оружием и доспехами:</div>
                  <div className="whitespace-pre-wrap" style={{ color: '#3D2012' }}>{selectedClass.armorWeaponProfs}</div>
                </div>

                {/* Spellcasting if caster */}
                {selectedClass.spellcasting?.isCaster && (
                  <div className="p-3 rounded text-xs space-y-1.5" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <div className="font-bold uppercase text-[10px] flex items-center gap-1.5" style={{ color: '#8B6914' }}>
                      <SparklesDndIcon size={14} />
                      <span>Сотворение заклинаний ({selectedClass.spellcasting.ability}):</span>
                    </div>
                    <p style={{ color: '#3D2012' }}>
                      Базовая характеристика заклинаний: <strong>{selectedClass.spellcasting.ability}</strong>.
                      {selectedClass.spellcasting.cantripsKnown > 0 && ` Известно заговоров на 1 ур.: ${selectedClass.spellcasting.cantripsKnown}.`}
                    </p>
                    {selectedClass.spellcasting.cantrips && selectedClass.spellcasting.cantrips.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[11px] font-bold" style={{ color: '#6B3A2A' }}>Рекомендуемые заговоры:</span>
                        {selectedClass.spellcasting.cantrips.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: '#E8D3A2', border: '1px solid #C9A84C', color: '#5C341F' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Features at 1st level */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide block" style={{ color: '#8B6914' }}>
                    Умения 1-го уровня:
                  </span>
                  <div className="p-3 rounded text-xs whitespace-pre-wrap leading-relaxed" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)', color: '#4A2A18' }}>
                    {selectedClass.featuresAt1}
                  </div>
                </div>

                {/* Subclasses preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#8B6914' }}>
                      {selectedClass.subclassTitle} ({selectedClass.subclasses.length} архетипов):
                    </span>
                    <span className="text-[11px]" style={{ color: '#6B3A2A' }}>
                      Доступно на {selectedClass.subclassLevel} уровне
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {selectedClass.subclasses.map(sc => (
                      <span
                        key={sc.id}
                        className="px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{ background: '#E8D3A2', color: '#3D2012', border: '1px solid rgba(201, 168, 76, 0.5)' }}
                      >
                        {sc.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center justify-between border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.4)', background: 'rgba(232, 211, 162, 0.2)' }}>
          <div className="text-xs" style={{ color: '#6B3A2A' }}>
            Выбрано: <strong>{selectedClass?.name}</strong> ({selectedClass?.nameEn})
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">
              Отмена
            </button>
            <button onClick={handleApply} className="parchment-btn text-xs px-6 py-1.5 font-bold">
              Применить класс
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
