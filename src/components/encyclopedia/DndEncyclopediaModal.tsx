'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ENCYCLOPEDIA_CHAPTERS } from '@/data/encyclopedia/encyclopedia-content';
import type { EncyclopediaChapter, EncyclopediaSection } from '@/data/encyclopedia/encyclopedia-types';
import {
  ScrollIcon,
  D20Icon,
  UserHeroIcon,
  CrossedSwordsIcon,
  SpellbookIcon,
  HourglassIcon,
  CrownRulerIcon,
  InfoSealIcon,
} from '@/components/dnd-icons';

export interface DndEncyclopediaModalProps {
  isOpen: boolean;
  initialChapterId?: string | null;
  initialSectionId?: string | null;
  onClose: () => void;
  onStartTour?: () => void;
}

const ICON_MAP = {
  ScrollIcon,
  D20Icon,
  UserHeroIcon,
  CrossedSwordsIcon,
  SpellbookIcon,
  HourglassIcon,
  CrownRulerIcon,
};

export const DndEncyclopediaModal = React.memo(function DndEncyclopediaModal({
  isOpen,
  initialChapterId,
  initialSectionId,
  onClose,
  onStartTour,
}: DndEncyclopediaModalProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    return initialChapterId || ENCYCLOPEDIA_CHAPTERS[0].id;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Sync with initialChapterId on open
  useEffect(() => {
    if (initialChapterId) {
      const exists = ENCYCLOPEDIA_CHAPTERS.some(c => c.id === initialChapterId);
      if (exists) setSelectedChapterId(initialChapterId);
    }
  }, [initialChapterId]);

  // Scroll to section if specified
  useEffect(() => {
    if (!isOpen) return;

    if (initialSectionId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`section-${initialSectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = 0;
    }
  }, [isOpen, selectedChapterId, initialSectionId]);

  // Escape key handler (No Backdrop Dismiss, but escape is supported)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const results: { chapter: EncyclopediaChapter; section: EncyclopediaSection }[] = [];
    for (const ch of ENCYCLOPEDIA_CHAPTERS) {
      for (const sec of ch.sections) {
        if (
          sec.title.toLowerCase().includes(q) ||
          sec.content.toLowerCase().includes(q) ||
          ch.title.toLowerCase().includes(q) ||
          (sec.callout && sec.callout.text.toLowerCase().includes(q))
        ) {
          results.push({ chapter: ch, section: sec });
        }
      }
    }
    return results;
  }, [searchQuery]);

  const currentChapter = useMemo(() => {
    return ENCYCLOPEDIA_CHAPTERS.find(c => c.id === selectedChapterId) || ENCYCLOPEDIA_CHAPTERS[0];
  }, [selectedChapterId]);

  if (!isOpen) return null;

  const CurrentIcon = ICON_MAP[currentChapter.iconName] || ScrollIcon;

  return (
    <div
      className="fixed inset-0 z-[350] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      // DELIBERATELY NO BACKDROP DISMISS: window does NOT close on backdrop click!
    >
      <div
        className="w-full max-w-5xl my-auto rounded-xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        style={{
          backgroundColor: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 10px 40px rgba(61, 32, 18, 0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.5)',
            background: 'linear-gradient(180deg, rgba(232, 211, 162, 0.95) 0%, rgba(245, 230, 200, 0.95) 100%)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ScrollIcon size={26} className="shrink-0" />
            <div className="min-w-0">
              <h2
                className="text-base sm:text-xl font-bold text-[#3D2012] leading-tight truncate"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Большая Энциклопедия D&D 5e: Фолиант Правил
              </h2>
              <p className="text-[11px] text-[#8B6914] truncate hidden sm:block">
                Полное руководство по правилам, механике d20 и листу персонажа для новичков
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStartTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="parchment-btn text-xs px-3 py-1.5 cursor-pointer font-bold flex items-center gap-1.5 shadow-sm"
                title="Запустить интерактивную экскурсию по листу"
              >
                <D20Icon size={14} />
                <span className="hidden sm:inline">🎯 Экскурсия по листу</span>
                <span className="sm:hidden">Тур</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="parchment-remove-btn text-sm w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer font-bold"
              title="Закрыть энциклопедию (Escape)"
              aria-label="Закрыть энциклопедию"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Body: Sidebar + Content */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div
            className="w-full md:w-80 md:border-r flex flex-col shrink-0 overflow-hidden"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.4)',
              backgroundColor: 'rgba(232, 211, 162, 0.35)',
            }}
          >
            {/* Search Input */}
            <div className="p-3 border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по правилам и терминам…"
                  className="parchment-input-boxed text-xs w-full py-2 px-3 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B6914] hover:text-[#3D2012] font-bold p-1 cursor-pointer"
                    title="Очистить поиск"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchResults !== null && (
                <div className="text-[11px] text-[#8B6914] font-medium pt-1.5 px-0.5">
                  Найдено совпадений: {searchResults.length}
                </div>
              )}
            </div>

            {/* Chapters / Search List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {searchResults !== null ? (
                // Search Results Mode
                searchResults.length > 0 ? (
                  searchResults.map(({ chapter, section }) => (
                    <button
                      key={`${chapter.id}-${section.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedChapterId(chapter.id);
                        setSearchQuery('');
                        setTimeout(() => {
                          const el = document.getElementById(`section-${section.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                      className="w-full text-left p-2.5 rounded-lg text-xs cursor-pointer transition-all hover:bg-[rgba(201,168,76,0.2)] border border-transparent hover:border-[rgba(201,168,76,0.4)]"
                      style={{ background: 'rgba(251, 240, 220, 0.7)' }}
                    >
                      <div className="font-bold text-[#3D2012]">{section.title}</div>
                      <div className="text-[10px] text-[#8B6914] flex items-center gap-1 mt-0.5">
                        <span>Глава:</span>
                        <span className="font-semibold">{chapter.title}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#8B6914]">
                    Ничего не найдено по запросу «{searchQuery}»
                  </div>
                )
              ) : (
                // Standard Chapters List
                ENCYCLOPEDIA_CHAPTERS.map((chapter, idx) => {
                  const isSelected = chapter.id === selectedChapterId;
                  const ChapterIcon = ICON_MAP[chapter.iconName] || ScrollIcon;

                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'shadow-xs ring-1 ring-[#C9A84C]'
                          : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(232, 211, 162, 0.9)' : 'transparent',
                        border: isSelected ? '1px solid #C9A84C' : '1px solid transparent',
                        color: isSelected ? '#3D2012' : '#5C341F',
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        <ChapterIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold leading-tight">
                            {idx + 1}. {chapter.title}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8B6914] truncate mt-0.5">
                          {chapter.sections.length} тем · {chapter.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Content View */}
          <div
            ref={contentAreaRef}
            className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 bg-[rgba(251,240,220,0.5)]"
          >
            {/* Chapter Header Banner */}
            <div
              className="p-4 sm:p-5 rounded-xl space-y-1.5 shadow-xs"
              style={{
                background: 'linear-gradient(180deg, rgba(232, 211, 162, 0.6) 0%, rgba(245, 230, 200, 0.6) 100%)',
                border: '1.5px solid rgba(201, 168, 76, 0.5)',
              }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#8B6914] uppercase tracking-wide">
                <CurrentIcon size={18} />
                <span>Глава {ENCYCLOPEDIA_CHAPTERS.findIndex(c => c.id === currentChapter.id) + 1}</span>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold text-[#3D2012]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {currentChapter.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#5C341F] font-medium leading-relaxed">
                {currentChapter.subtitle}
              </p>
            </div>

            {/* Sections Content */}
            <div className="space-y-6">
              {currentChapter.sections.map(section => (
                <div
                  key={section.id}
                  id={`section-${section.id}`}
                  className="parchment-card p-4 sm:p-5 space-y-3 rounded-xl border border-[rgba(201,168,76,0.35)] shadow-xs"
                >
                  <h3
                    className="text-base sm:text-lg font-bold text-[#3D2012] flex items-center gap-2"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C9A84C] shrink-0" />
                    <span>{section.title}</span>
                  </h3>

                  <div className="text-xs sm:text-sm text-[#3D2012] whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>

                  {/* Callout Box */}
                  {section.callout && (
                    <div
                      className="p-3.5 rounded-lg text-xs space-y-1 border"
                      style={{
                        background:
                          section.callout.type === 'master'
                            ? 'rgba(139, 37, 0, 0.08)'
                            : section.callout.type === 'warning'
                            ? 'rgba(180, 83, 9, 0.1)'
                            : 'rgba(74, 124, 63, 0.1)',
                        borderColor:
                          section.callout.type === 'master'
                            ? 'rgba(139, 37, 0, 0.3)'
                            : section.callout.type === 'warning'
                            ? 'rgba(180, 83, 9, 0.35)'
                            : 'rgba(74, 124, 63, 0.35)',
                      }}
                    >
                      {section.callout.title && (
                        <div
                          className="font-bold flex items-center gap-1.5"
                          style={{
                            color:
                              section.callout.type === 'master'
                                ? '#8B2500'
                                : section.callout.type === 'warning'
                                ? '#B45309'
                                : '#2d5f24',
                          }}
                        >
                          <InfoSealIcon size={14} />
                          <span>{section.callout.title}</span>
                        </div>
                      )}
                      <p className="text-[#3D2012] leading-relaxed">
                        {section.callout.text}
                      </p>
                    </div>
                  )}

                  {/* Formatted Table */}
                  {section.table && (
                    <div className="overflow-x-auto my-2 rounded-lg border border-[rgba(201,168,76,0.35)]">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr
                            style={{
                              background: 'rgba(232, 211, 162, 0.8)',
                              borderBottom: '1px solid rgba(201, 168, 76, 0.4)',
                            }}
                          >
                            {section.table.headers.map((h, i) => (
                              <th key={i} className="p-2.5 font-bold text-[#3D2012]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="border-b last:border-0 hover:bg-[rgba(201,168,76,0.1)] transition-colors"
                              style={{ borderColor: 'rgba(201, 168, 76, 0.2)' }}
                            >
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2.5 text-[#3D2012]">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Chapter Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
              {(() => {
                const curIdx = ENCYCLOPEDIA_CHAPTERS.findIndex(c => c.id === currentChapter.id);
                const prev = curIdx > 0 ? ENCYCLOPEDIA_CHAPTERS[curIdx - 1] : null;
                const next = curIdx < ENCYCLOPEDIA_CHAPTERS.length - 1 ? ENCYCLOPEDIA_CHAPTERS[curIdx + 1] : null;

                return (
                  <>
                    {prev ? (
                      <button
                        type="button"
                        onClick={() => setSelectedChapterId(prev.id)}
                        className="parchment-btn-secondary text-xs px-3 py-1.5 cursor-pointer font-semibold"
                      >
                        ← {prev.title}
                      </button>
                    ) : <div />}

                    {next && (
                      <button
                        type="button"
                        onClick={() => setSelectedChapterId(next.id)}
                        className="parchment-btn text-xs px-3 py-1.5 cursor-pointer font-bold"
                      >
                        {next.title} →
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
