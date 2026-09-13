'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type SheetTab = 'page1' | 'page2' | 'page3';

export interface SheetNavbarProps {
  activeTab: SheetTab;
  setActiveTab: (tab: SheetTab) => void;
}

export const SheetNavbar = React.memo(function SheetNavbar({
  activeTab,
  setActiveTab,
}: SheetNavbarProps) {
  const tabs: { key: SheetTab; label: string; shortLabel: string }[] = [
    { key: 'page1', label: 'Основной лист', shortLabel: 'Лист' },
    { key: 'page2', label: 'Детали', shortLabel: 'Детали' },
    { key: 'page3', label: 'Заклинания', shortLabel: 'Магия' },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2 mb-6 parchment-tabs relative p-1.5 rounded-lg"
      style={{
        background: 'rgba(32, 18, 11, 0.85)',
        border: '1px solid rgba(201, 168, 76, 0.45)',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 240, 200, 0.15)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded min-h-[44px] flex items-center justify-center cursor-pointer select-none transition-all ${
              isActive
                ? 'text-[#3D2012]'
                : 'text-[#F5E6C8] bg-[rgba(60,36,21,0.7)] hover:bg-[rgba(85,48,28,0.9)] hover:text-[#FFF8EB] border border-[rgba(201,168,76,0.3)] shadow-sm'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="activeTabParchment"
                className="absolute inset-0 rounded parchment-tab-active shadow-md"
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              />
            )}
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
});
