'use client';

import React, { useState } from 'react';
import { DND_COMPENDIUM_CLASSES, getSubclassesForClass, type CompendiumSubclass } from '@/data/compendium/classes';
import { CrossedSwordsIcon, SparklesDndIcon } from '@/components/dnd-icons';

interface SubclassSelectorModalProps {
  classNameString: string;
  currentSubclass?: string;
  onSelect: (subclass: CompendiumSubclass) => void;
  onClose: () => void;
}

export function SubclassSelectorModal({ classNameString, currentSubclass, onSelect, onClose }: SubclassSelectorModalProps) {
  const compClass = DND_COMPENDIUM_CLASSES.find(c => 
    classNameString.toLowerCase().includes(c.name.toLowerCase()) || 
    classNameString.toLowerCase().includes(c.nameEn.toLowerCase())
  ) || DND_COMPENDIUM_CLASSES[0];

  const subclasses = compClass.subclasses;
  const [selectedSubclassId, setSelectedSubclassId] = useState<string>(() => {
    if (currentSubclass) {
      const match = subclasses.find(sc => 
        sc.name.toLowerCase() === currentSubclass.toLowerCase() || 
        sc.nameEn.toLowerCase() === currentSubclass.toLowerCase()
      );
      if (match) return match.id;
    }
    return subclasses[0]?.id || '';
  });

  const selectedSubclass = subclasses.find(sc => sc.id === selectedSubclassId) || subclasses[0];

  const handleApply = () => {
    if (selectedSubclass) {
      onSelect(selectedSubclass);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="parchment-modal max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl relative rounded-lg"
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
            <span className="text-xl">{compClass.emoji}</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {compClass.subclassTitle}: {compClass.name}
              </h3>
              <span className="text-xs" style={{ color: '#8B6914' }}>
                Доступно архетипов: {subclasses.length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Subclasses list */}
          <div className="w-full md:w-64 border-r p-3 overflow-y-auto max-h-[25vh] md:max-h-[60vh] space-y-1" style={{ borderColor: 'rgba(201, 168, 76, 0.3)', background: 'rgba(232, 211, 162, 0.25)' }}>
            {subclasses.map(sc => {
              const isSelected = sc.id === selectedSubclassId;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedSubclassId(sc.id)}
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
                  <div>
                    <div>{sc.name}</div>
                    <div className="text-[10px] opacity-70">{sc.nameEn}</div>
                  </div>
                  {sc.source && (
                    <span className="text-[9px] px-1 py-0.5 rounded font-mono font-bold" style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}>
                      {sc.source}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subclass details */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[50vh] md:max-h-[60vh] space-y-3">
            {selectedSubclass && (
              <>
                <div className="border-b pb-2.5" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>
                      {selectedSubclass.name}
                    </h2>
                    {selectedSubclass.source && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#5C341F', border: '1px solid #C9A84C' }}>
                        Книга: {selectedSubclass.source}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: '#8B6914' }}>
                    {selectedSubclass.nameEn}
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4A2A18' }}>
                    {selectedSubclass.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide block" style={{ color: '#8B6914' }}>
                    Умения архетипа:
                  </span>
                  <div className="space-y-2">
                    {selectedSubclass.features.map((feat, idx) => (
                      <div key={idx} className="p-2.5 rounded text-xs space-y-1" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                        <div className="font-bold flex items-center justify-between" style={{ color: '#3D2012' }}>
                          <span className="flex items-center gap-1.5">
                            <SparklesDndIcon size={14} />
                            <span>{feat.name}</span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#E8D3A2', color: '#5C341F' }}>
                            {feat.level} ур.
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#4A2A18' }}>
                          {feat.description}
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
            Выбрано: <strong>{selectedSubclass?.name}</strong>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="parchment-btn-secondary text-xs px-4 py-1.5">
              Отмена
            </button>
            <button onClick={handleApply} className="parchment-btn text-xs px-6 py-1.5 font-bold">
              Выбрать архетип
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
