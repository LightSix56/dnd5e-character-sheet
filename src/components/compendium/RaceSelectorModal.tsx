'use client';

import React, { useState } from 'react';
import { DND_COMPENDIUM_RACES, type CompendiumRace, type CompendiumSubrace, type RaceCategory } from '@/data/compendium/races';
import { UserHeroIcon, SparklesDndIcon } from '@/components/dnd-icons';

interface RaceSelectorModalProps {
  currentRace?: string;
  onSelect: (race: CompendiumRace, subrace?: CompendiumSubrace) => void;
  onClose: () => void;
}

const CATEGORIES: { id: 'all' | RaceCategory; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'core', label: 'PHB' },
  { id: 'multiverse', label: 'Мультивселенная' },
  { id: 'setting', label: 'Сеттинги' },
  { id: 'spelljammer', label: 'Космос' },
  { id: 'lineage', label: 'Родословные' },
];

export function RaceSelectorModal({ currentRace, onSelect, onClose }: RaceSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | RaceCategory>('all');
  const [selectedRaceId, setSelectedRaceId] = useState<string>(() => {
    if (currentRace) {
      const match = DND_COMPENDIUM_RACES.find(r => 
        currentRace.toLowerCase().startsWith(r.name.toLowerCase()) || 
        currentRace.toLowerCase().startsWith(r.nameEn.toLowerCase())
      );
      if (match) return match.id;
    }
    return DND_COMPENDIUM_RACES[0]?.id || 'human';
  });
  const [selectedSubraceId, setSelectedSubraceId] = useState<string>('');

  const selectedRace = DND_COMPENDIUM_RACES.find(r => r.id === selectedRaceId) || DND_COMPENDIUM_RACES[0];
  const selectedSubrace = selectedRace?.subraces.find(sr => sr.id === selectedSubraceId);

  const filteredRaces = DND_COMPENDIUM_RACES.filter(r => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return r.name.toLowerCase().includes(q) || 
      r.nameEn.toLowerCase().includes(q) || 
      (r.source && r.source.toLowerCase().includes(q)) ||
      r.subraces.some(sr => sr.name.toLowerCase().includes(q) || sr.nameEn.toLowerCase().includes(q));
  });

  const handleApply = () => {
    if (selectedRace) {
      onSelect(selectedRace, selectedSubrace);
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
            <UserHeroIcon size={24} />
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Компендиум рас D&D 5e
              </h3>
              <span className="text-[11px]" style={{ color: '#8B6914' }}>
                49 официальных рас и свыше 70 подрас/родословий
              </span>
            </div>
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
          {/* Left: Races list */}
          <div className="w-full md:w-72 border-r flex flex-col p-3 gap-2 overflow-y-auto max-h-[35vh] md:max-h-[70vh]" style={{ borderColor: 'rgba(201, 168, 76, 0.3)', background: 'rgba(232, 211, 162, 0.25)' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск расы или книги..."
              className="parchment-input text-xs w-full py-1.5 px-2.5"
            />

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 pb-1">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      isActive ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      isActive
                        ? { background: '#5C341F', color: '#FBF0DC' }
                        : { background: 'rgba(201, 168, 76, 0.2)', color: '#5C341F' }
                    }
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
              {filteredRaces.map(race => {
                const isSelected = race.id === selectedRaceId;
                return (
                  <button
                    key={race.id}
                    onClick={() => {
                      setSelectedRaceId(race.id);
                      setSelectedSubraceId(race.subraces[0]?.id || '');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-all flex items-center justify-between ${
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
                    <div className="min-w-0 pr-1">
                      <div className="truncate">{race.name}</div>
                      <div className="text-[10px] opacity-70 truncate">{race.nameEn}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold" style={{ background: 'rgba(92, 52, 31, 0.1)', color: '#5C341F' }}>
                        {race.source || 'PHB'}
                      </span>
                      {race.subraces.length > 0 && (
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono" style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#8B6914' }}>
                          +{race.subraces.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Race details */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[50vh] md:max-h-[70vh] space-y-4">
            {selectedRace && (
              <>
                <div className="border-b pb-3" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>
                          {selectedRace.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono" style={{ background: '#E8D3A2', border: '1px solid #C9A84C', color: '#5C341F' }}>
                          {selectedRace.source}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#8B6914' }}>
                        {selectedRace.nameEn} • Размер: {selectedRace.size} • Скорость: {selectedSubrace?.speed || selectedRace.speed} фт.
                        {selectedRace.darkvision > 0 && ` • Тёмное зрение ${selectedRace.darkvision} фт.`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4A2A18' }}>
                    {selectedRace.description}
                  </p>
                </div>

                {/* Subraces tabs if available */}
                {selectedRace.subraces.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide block" style={{ color: '#8B6914' }}>
                      Выберите подрасу / разновидность:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRace.subraces.map(sr => {
                        const isSubSelected = sr.id === selectedSubraceId;
                        return (
                          <button
                            key={sr.id}
                            onClick={() => setSelectedSubraceId(sr.id)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              isSubSelected
                                ? 'shadow-sm'
                                : 'hover:bg-[rgba(201,168,76,0.2)]'
                            }`}
                            style={
                              isSubSelected
                                ? { background: '#C9A84C', color: '#FFF', border: '1px solid #A08230' }
                                : { background: 'rgba(232, 211, 162, 0.6)', color: '#5C341F', border: '1px solid rgba(201, 168, 76, 0.4)' }
                            }
                          >
                            {sr.name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSubrace && (
                      <div className="p-3 rounded text-xs space-y-1" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                        <div className="font-bold" style={{ color: '#3D2012' }}>{selectedSubrace.name} ({selectedSubrace.nameEn})</div>
                        <p style={{ color: '#5C341F' }}>{selectedSubrace.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ability score bonuses */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: '#8B6914' }}>
                    Бонусы к характеристикам:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const bonuses = { ...selectedRace.abilityBonuses, ...(selectedSubrace?.abilityBonuses || {}) };
                      const entries = Object.entries(bonuses).filter(([_, v]) => v && v > 0);
                      if (entries.length === 0) {
                        return <span className="text-xs" style={{ color: '#5C341F' }}>+1 к двум характеристикам на выбор (универсальный)</span>;
                      }
                      return entries.map(([ab, val]) => (
                        <span
                          key={ab}
                          className="px-2.5 py-1 rounded text-xs font-bold font-mono"
                          style={{ background: '#E8D3A2', border: '1px solid #C9A84C', color: '#5C341F' }}
                        >
                          {ab} +{val}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide block mb-1" style={{ color: '#8B6914' }}>
                    Языки:
                  </span>
                  <span className="text-xs" style={{ color: '#3D2012' }}>
                    {selectedRace.languages.join(', ')}
                  </span>
                </div>

                {/* Racial Traits */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide block" style={{ color: '#8B6914' }}>
                    Расовые особенности:
                  </span>
                  <div className="space-y-2">
                    {[...(selectedRace.traits || []), ...(selectedSubrace?.traits || [])].map((tr, idx) => (
                      <div key={idx} className="p-2.5 rounded text-xs space-y-1" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                        <div className="font-bold flex items-center gap-1.5" style={{ color: '#3D2012' }}>
                          <SparklesDndIcon size={14} />
                          <span>{tr.name}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#4A2A18' }}>
                          {tr.description}
                        </p>
                      </div>
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
            Выбрано: <strong>{selectedRace?.name}</strong> {selectedSubrace ? `(${selectedSubrace.name})` : ''}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">
              Отмена
            </button>
            <button onClick={handleApply} className="parchment-btn text-xs px-6 py-1.5 font-bold">
              Применить расу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
