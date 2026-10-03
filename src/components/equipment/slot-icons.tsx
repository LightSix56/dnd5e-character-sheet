import React from 'react';
import type { EquipmentSlotId } from '@/lib/equipment-types';
import {
  HelmetIcon,
  AmuletIcon,
  CuirassIcon,
  BeltIcon,
  SwordIcon,
  EngravedShieldIcon,
  RingIcon,
  CloakIcon,
  QuiverIcon,
  GauntletIcon,
  PouchIcon,
  BootIcon,
} from '@/components/dnd-icons';

type SlotIconComponent = (props: { size?: number | string; className?: string }) => React.ReactElement;

/** Векторная иконка для каждого слота экипировки — вместо системных эмодзи. */
export const SLOT_ICONS: Record<EquipmentSlotId, SlotIconComponent> = {
  head: HelmetIcon,
  neck: AmuletIcon,
  armor: CuirassIcon,
  mainHand: SwordIcon,
  offHand: EngravedShieldIcon,
  belt: BeltIcon,
  ring1: RingIcon,
  ring2: RingIcon,
  cloak: CloakIcon,
  quiver: QuiverIcon,
  gloves: GauntletIcon,
  pouch: PouchIcon,
  boots: BootIcon,
};

export function SlotIcon({ slotId, size = 20, className }: { slotId: EquipmentSlotId; size?: number; className?: string }) {
  const Icon = SLOT_ICONS[slotId] ?? EngravedShieldIcon;
  return <Icon size={size} className={className} />;
}
