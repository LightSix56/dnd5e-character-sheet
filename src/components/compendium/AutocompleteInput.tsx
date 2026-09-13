'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface AutocompleteItem {
  name: string;
  badge?: string;
  secondary?: string;
  data?: any;
}

export interface DropdownPosition {
  placement: 'bottom' | 'top';
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

/**
 * Calculates dropdown positioning relative to viewport.
 * Automatically flips to 'top' if space below the input is tight (< minRequiredSpace),
 * completely preventing the dropdown from extending off-screen or forcing the user to scroll.
 */
export function calculateDropdownPosition(
  rect: { top: number; bottom: number; left: number; width: number },
  viewportHeight: number,
  preferredMaxHeight: number = 240,
  minRequiredSpace: number = 180
): DropdownPosition {
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  const openUpwards = spaceBelow < minRequiredSpace && spaceAbove > spaceBelow;

  if (openUpwards) {
    const maxHeight = Math.min(preferredMaxHeight, Math.max(100, spaceAbove - 16));
    return {
      placement: 'top',
      bottom: viewportHeight - rect.top + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    };
  } else {
    const maxHeight = Math.min(preferredMaxHeight, Math.max(100, spaceBelow - 16));
    return {
      placement: 'bottom',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    };
  }
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  items: AutocompleteItem[];
  placeholder?: string;
  className?: string;
  minChars?: number;
  autoClearOnSelect?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  items,
  placeholder = '',
  className = '',
  minChars = 1,
  autoClearOnSelect = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<DropdownPosition | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = query.length >= minChars
    ? items.filter(it => it.name.toLowerCase().includes(query)).slice(0, 10)
    : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return;
    const rect = wrapperRef.current.getBoundingClientRect();

    // If element is completely scrolled out of the viewport, close suggestions
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const pos = calculateDropdownPosition(rect, window.innerHeight);
    setCoords(pos);
  }, []);

  useEffect(() => {
    if (!isOpen || filtered.length === 0) return;

    updatePosition();

    // Listen on window resize and capture-phase scroll (so nested scrolls in modals/cards trigger update)
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, filtered.length, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      if (filtered[highlightIndex]) {
        e.preventDefault();
        handleSelectItem(filtered[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: AutocompleteItem) => {
    if (autoClearOnSelect) {
      onChange('');
    } else {
      onChange(item.name);
    }
    if (onSelect) onSelect(item);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightIndex(0);
        }}
        onFocus={() => {
          if (value.trim().length >= minChars && filtered.length > 0) {
            setIsOpen(true);
            updatePosition();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {mounted &&
        isOpen &&
        filtered.length > 0 &&
        coords &&
        typeof document !== 'undefined' &&
        document.body &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            className="rounded-md shadow-2xl overflow-y-auto custom-scrollbar animate-fade-in"
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              ...(coords.placement === 'bottom'
                ? { top: `${coords.top}px` }
                : { bottom: `${coords.bottom}px` }),
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 9999,
              background: '#FDF7EC',
              border: '2px solid #C9A84C',
              boxShadow: '0 10px 30px rgba(61, 32, 18, 0.4)',
            }}
          >
            {filtered.map((item, idx) => (
              <div
                key={item.name + idx}
                role="option"
                aria-selected={idx === highlightIndex}
                onMouseDown={e => {
                  e.preventDefault();
                  handleSelectItem(item);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors border-b last:border-b-0 ${
                  idx === highlightIndex ? 'bg-[#F0DEB4]' : 'hover:bg-[#F7EACD]'
                }`}
                style={{ borderColor: 'rgba(201, 168, 76, 0.25)' }}
              >
                <div
                  className="flex items-center gap-2 font-medium"
                  style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <span className="font-bold">{item.name}</span>
                  {item.secondary && (
                    <span className="text-[11px] opacity-75" style={{ color: '#8B6914' }}>
                      ({item.secondary})
                    </span>
                  )}
                </div>
                {item.badge && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2"
                    style={{
                      background: '#E8D3A2',
                      color: '#5C341F',
                      border: '1px solid rgba(201, 168, 76, 0.5)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
