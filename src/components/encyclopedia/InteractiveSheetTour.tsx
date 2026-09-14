'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SHEET_TOUR_STEPS } from '@/data/encyclopedia/encyclopedia-content';
import {
  D20Icon,
  ScrollIcon,
  CrownRulerIcon,
  InfoSealIcon,
} from '@/components/dnd-icons';

export interface InteractiveSheetTourProps {
  isActive: boolean;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
  onOpenEncyclopedia: (chapterId: string, sectionId?: string) => void;
}

export const InteractiveSheetTour = React.memo(function InteractiveSheetTour({
  isActive,
  currentStepIndex,
  onStepChange,
  onClose,
  onOpenEncyclopedia,
}: InteractiveSheetTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = useMemo(() => {
    if (currentStepIndex < 0 || currentStepIndex >= SHEET_TOUR_STEPS.length) {
      return SHEET_TOUR_STEPS[0];
    }
    return SHEET_TOUR_STEPS[currentStepIndex];
  }, [currentStepIndex]);

  const updateTargetRect = useCallback(() => {
    if (!isActive || !step) return;
    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isActive, step]);

  // Scroll to element and update rect on step change
  useEffect(() => {
    if (!isActive || !step) return;

    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Update rect after scroll animation starts and finishes
      updateTargetRect();
      const t1 = setTimeout(updateTargetRect, 200);
      const t2 = setTimeout(updateTargetRect, 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setTargetRect(null);
    }
  }, [isActive, step, updateTargetRect]);

  // Handle resize and scroll
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isActive, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < SHEET_TOUR_STEPS.length - 1) {
          onStepChange(currentStepIndex + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          onStepChange(currentStepIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex, onStepChange, onClose]);

  if (!isActive || !step) return null;

  const totalSteps = SHEET_TOUR_STEPS.length;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  // Tooltip position calculation
  let tooltipTop: number | undefined;
  let tooltipBottom: number | undefined;
  let tooltipLeft: number = 16;
  const tooltipWidth = 360;

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
      tooltipTop = Math.min(window.innerHeight - 240, targetRect.bottom + 12);
    } else {
      tooltipBottom = Math.max(16, window.innerHeight - targetRect.top + 12);
    }

    // Horizontal centering
    const idealLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, idealLeft));
  } else {
    // Center of screen fallback
    tooltipTop = window.innerHeight / 2 - 110;
    tooltipLeft = Math.max(16, window.innerWidth / 2 - tooltipWidth / 2);
  }

  return (
    <div className="fixed inset-0 z-[320] pointer-events-none transition-all duration-300">
      {/* Target Element Highlight Box */}
      {targetRect && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            border: '2px solid #C9A84C',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65), 0 0 25px rgba(201, 168, 76, 0.85)',
          }}
        />
      )}

      {/* Fallback dark overlay if target element not found on page */}
      {!targetRect && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs pointer-events-auto" />
      )}

      {/* Parchment Tooltip Card */}
      <div
        className="absolute pointer-events-auto parchment-card shadow-2xl p-4 sm:p-5 flex flex-col gap-3 animate-fade-in"
        style={{
          top: tooltipTop !== undefined ? `${tooltipTop}px` : undefined,
          bottom: tooltipBottom !== undefined ? `${tooltipBottom}px` : undefined,
          left: `${tooltipLeft}px`,
          width: `min(${tooltipWidth}px, calc(100vw - 32px))`,
          border: '2px solid #C9A84C',
          backgroundColor: '#F5E6C8',
        }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B6914] uppercase tracking-wide">
              <D20Icon size={14} />
              <span>{step.badge}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#3D2012] leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="parchment-remove-btn text-xs w-6 h-6 flex items-center justify-center shrink-0 cursor-pointer"
            title="Закрыть экскурсию (Escape)"
            aria-label="Закрыть экскурсию"
          >
            ✕
          </button>
        </div>

        {/* Step Content */}
        <p className="text-xs sm:text-sm text-[#3D2012] leading-relaxed">
          {step.description}
        </p>

        {/* Deep link button to Encyclopedia */}
        <button
          type="button"
          onClick={() => onOpenEncyclopedia(step.chapterId, step.sectionId)}
          className="w-full text-left p-2 rounded flex items-center justify-between text-xs font-semibold cursor-pointer transition-all hover:bg-[rgba(201,168,76,0.25)] group"
          style={{
            background: 'rgba(232, 211, 162, 0.5)',
            border: '1px solid rgba(201, 168, 76, 0.4)',
            color: '#3D2012',
          }}
        >
          <span className="flex items-center gap-1.5">
            <ScrollIcon size={14} />
            <span>Подробнее об этом в Энциклопедии</span>
          </span>
          <span className="text-[#8B6914] group-hover:translate-x-0.5 transition-transform">→</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#8B6914] hover:text-[#3D2012] font-semibold cursor-pointer py-1 px-2"
          >
            Пропустить тур
          </button>

          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={() => onStepChange(currentStepIndex - 1)}
                className="parchment-btn-secondary text-xs px-2.5 py-1.5 cursor-pointer font-semibold"
              >
                ← Назад
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  onStepChange(currentStepIndex + 1);
                }
              }}
              className="parchment-btn text-xs px-3 py-1.5 cursor-pointer font-bold flex items-center gap-1 shadow-sm"
            >
              <span>{isLast ? 'Завершить тур ✓' : 'Далее →'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
