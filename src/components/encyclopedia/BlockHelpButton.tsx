'use client';

import React from 'react';
import { InfoSealIcon } from '@/components/dnd-icons';

export interface BlockHelpButtonProps {
  chapterId: string;
  sectionId?: string;
  label?: string;
  onOpen: (chapterId: string, sectionId?: string) => void;
  className?: string;
}

export const BlockHelpButton = React.memo(function BlockHelpButton({
  chapterId,
  sectionId,
  label = 'Разбор блока в энциклопедии',
  onOpen,
  className = '',
}: BlockHelpButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(chapterId, sectionId);
      }}
      className={`inline-flex items-center justify-center p-1 rounded-full transition-all cursor-pointer opacity-75 hover:opacity-100 hover:scale-105 active:scale-95 shadow-xs ${className}`}
      style={{
        background: 'rgba(245, 230, 200, 0.85)',
        border: '1px solid rgba(201, 168, 76, 0.5)',
      }}
      title={label}
      aria-label={label}
    >
      <InfoSealIcon size={14} />
    </button>
  );
});
