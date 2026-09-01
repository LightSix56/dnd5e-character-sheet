'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface AutocompleteItem {
  name: string;
  badge?: string;
  secondary?: string;
  data?: any;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  items: AutocompleteItem[];
  placeholder?: string;
  className?: string;
  minChars?: number;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  items,
  placeholder = '',
  className = '',
  minChars = 1
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter items matching current value
  const filtered = value.trim().length >= minChars
    ? items.filter(it => it.name.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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
    onChange(item.name);
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
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {isOpen && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded shadow-xl max-h-56 overflow-y-auto"
          style={{
            background: '#FDF7EC',
            border: '2px solid #C9A84C',
            boxShadow: '0 8px 24px rgba(61, 32, 18, 0.25)'
          }}
        >
          {filtered.map((item, idx) => (
            <div
              key={item.name + idx}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors border-b last:border-b-0 ${
                idx === highlightIndex ? 'bg-[#F0DEB4]' : 'hover:bg-[#F7EACD]'
              }`}
              style={{ borderColor: 'rgba(201, 168, 76, 0.25)' }}
            >
              <div className="flex items-center gap-2 font-medium" style={{ color: '#3D2012', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <span>{item.name}</span>
                {item.secondary && (
                  <span className="text-[10px] opacity-70" style={{ color: '#8B6914' }}>
                    ({item.secondary})
                  </span>
                )}
              </div>
              {item.badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: 'rgba(139, 105, 20, 0.15)',
                    color: '#6B3A2A',
                    border: '1px solid rgba(201, 168, 76, 0.4)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
