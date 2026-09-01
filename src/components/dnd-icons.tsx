import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

// ── 1. d20 Polyhedral Die (Logo / Dice Rolls) ──
export function D20Icon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <polygon points="24,4 6,15 13,39 35,39 42,15" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="24,4 15,18 33,18" fill="#7A4529" stroke="#E5C158" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="24,34 15,18 33,18" fill="#3D2012" stroke="#E5C158" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="24,34 13,39 35,39" fill="#6B3A2A" stroke="#E5C158" strokeWidth="2" strokeLinejoin="round" />
      <line x1="6" y1="15" x2="15" y2="18" stroke="#E5C158" strokeWidth="2" />
      <line x1="42" y1="15" x2="33" y2="18" stroke="#E5C158" strokeWidth="2" />
      <line x1="6" y1="15" x2="13" y2="39" stroke="#E5C158" strokeWidth="2" />
      <line x1="42" y1="15" x2="35" y2="39" stroke="#E5C158" strokeWidth="2" />
    </svg>
  );
}

// ── 2. Ancient Scroll (Templates) ──
export function ScrollIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M38 34V10a4 4 0 0 0-4-4H8" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 42h24a4 4 0 0 0 4-4v-4H20a4 4 0 0 0-4 4v4z" fill="#7A4529" stroke="#E5C158" strokeWidth="2.5" />
      <path d="M8 6a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h8V10a4 4 0 0 0-4-4H8z" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <line x1="20" y1="14" x2="30" y2="14" stroke="#E5C158" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="22" x2="30" y2="22" stroke="#E5C158" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── 3. Leather Grimoire (JSON / Save) ──
export function SpellbookIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M8 38V10a4 4 0 0 1 4-4h28v36H12a4 4 0 0 1-4-4z" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <path d="M12 12h20M12 20h20M12 28h12" stroke="#E5C158" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="28" r="3" fill="#E5C158" />
    </svg>
  );
}

// ── 4. Ironbound Chest (Open File / Cloud Library) ──
export function ChestIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M6 14h36v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V14z" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <path d="M6 14l4-8h28l4 8" fill="#7A4529" stroke="#E5C158" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="20" y="20" width="8" height="8" rx="2" fill="#E5C158" stroke="#3D2012" strokeWidth="1.5" />
    </svg>
  );
}

// ── 5. Sand Hourglass (Reset) ──
export function HourglassIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M10 4h28M10 44h28" stroke="#E5C158" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 4v10l8 10-8 10v10h24V34l-8-10 8-10V4H12z" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="3" fill="#E5C158" />
    </svg>
  );
}

// ── 6. Golden Wax Seal with Checkmark (Saved Status) ──
export function GoldSealCheckIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <circle cx="24" cy="24" r="18" fill="#4A2D17" stroke="#E5C158" strokeWidth="3" />
      <path d="M16 24l6 6 12-12" stroke="#FFE58F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 7. Mystic Rotating Spinner (Saving Status) ──
export function MysticSpinnerIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 animate-spin ${className}`} {...props}>
      <circle cx="24" cy="24" r="18" stroke="rgba(229,193,88,0.2)" strokeWidth="3.5" />
      <path d="M24 6a18 18 0 0 1 18 18" stroke="#E5C158" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// ── 8. Mystical Cloud (Cloud Save / Cloud Sync) ──
export function MysticCloudIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path
        d="M14 36h20a10 10 0 0 0 9.8-8A9 9 0 0 0 35 16a12 12 0 0 0-23.2 4A8 8 0 0 0 14 36z"
        fill="#5C341F"
        stroke="#E5C158"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── 9. Arcane Portal / Keyhole (Account / Sign Out) ──
export function PortalIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M8 42h32" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 42V14a12 12 0 0 1 24 0v28" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <circle cx="28" cy="26" r="3" fill="#E5C158" />
    </svg>
  );
}

// ── 10. Golden Quill (Export DOCX) ──
export function QuillIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path
        d="M40 8C28 14 22 24 18 34l-8 8 6 2 8-8c10-4 20-10 26-22-2-4-6-6-10-6z"
        fill="#4A2411"
        stroke="#FFF2D1"
        strokeWidth="2.5"
      />
      <line x1="16" y1="36" x2="6" y2="46" stroke="#FFF2D1" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── 11. Runed Key (Login / Auth) ──
export function RunedKeyIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <circle cx="16" cy="18" r="10" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" />
      <circle cx="16" cy="18" r="4" fill="#3D2012" stroke="#E5C158" strokeWidth="1.5" />
      <path d="M23 25l19 19M36 38l4-4M30 44l4-4" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── 12. Mystic Linked Chain (Share) ──
export function ArcaneLinkIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M20 28l8-8M14 34l-4 4a6 6 0 0 1-8.5-8.5l4-4a6 6 0 0 1 8.5 0M28 20l4-4a6 6 0 0 1 8.5 8.5l-4 4a6 6 0 0 1-8.5 0" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── 13. Crossed Swords (Attacks & Combat) ──
export function CrossedSwordsIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <line x1="8" y1="8" x2="40" y2="40" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="8" x2="8" y2="40" stroke="#E5C158" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 6l-6 6M42 36l-6 6M36 6l6 6M6 36l6 6" stroke="#E5C158" strokeWidth="2" strokeLinecap="round" />
      <polygon points="24,18 30,24 24,30 18,24" fill="#5C341F" stroke="#E5C158" strokeWidth="1.5" />
    </svg>
  );
}

// ── 14. Engraved Shield (Armor Class) ──
export function EngravedShieldIcon({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} {...props}>
      <path d="M24 4L8 10v14c0 12 16 20 16 20s16-8 16-20V10L24 4z" fill="#5C341F" stroke="#E5C158" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 10l-10 4v9c0 8 10 13 10 13s10-5 10-13v-9l-10-4z" fill="#7A4529" stroke="#E5C158" strokeWidth="1.5" />
    </svg>
  );
}
