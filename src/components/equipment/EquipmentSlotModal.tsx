'use client';

import React, { useState, useMemo } from 'react';
import { CharacterData } from '@/lib/dnd-types';
import {
  EquipmentSlotId,
  EquippedItem,
  EQUIPMENT_SLOTS,
  isOffHandBlocked,
} from '@/lib/equipment-types';
import { DND_COMPENDIUM_ITEMS } from '@/data/compendium/items';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export interface EquipmentSlotModalProps {
  slotId: EquipmentSlotId;
  char: CharacterData;
  isOpen: boolean;
  onClose: () => void;
  onEquip: (slotId: EquipmentSlotId, item: EquippedItem) => void;
  onUnequip: (slotId: EquipmentSlotId) => void;
}

// Preset catalog for accessory and specialty slots
const SLOT_PRESETS: Record<string, Partial<EquippedItem>[]> = {
  head: [
    { name: 'Шлем', description: 'Обычный стальной или кожаный шлем', weight: 3 },
    { name: 'Латный шлем', description: 'Тяжелый шлем с забралом', weight: 5 },
    { name: 'Обруч интеллекта', description: 'Интеллект владельца становится 19, если он не был выше', rarity: 'Необычный' },
    { name: 'Шляпа маскировки', description: 'Позволяет творить заклинание «Маскировка» по желанию', rarity: 'Необычный' },
    { name: 'Венец адаптации', description: 'Позволяет дышать под водой и в вакууме', rarity: 'Необычный' },
    { name: 'Очки ночного зрения', description: 'Даруют темное зрение на 60 фт.', rarity: 'Необычный' },
    { name: 'Капюшон следопыта', description: 'Маскировочный капюшон из плотной ткани', weight: 1 },
  ],
  neck: [
    { name: 'Амулет здоровья', description: 'Телосложение владельца становится 19, если оно не было выше', rarity: 'Редкий' },
    { name: 'Священный символ', description: 'Фокусировка для жрецов и паладинов', weight: 1 },
    { name: 'Медальон мыслей', description: 'Позволяет читать мысли окружающих (3 заряда)', rarity: 'Необычный' },
    { name: 'Ожерелье адаптации', description: 'Иммунитет к ядовитым газам и удушению', rarity: 'Необычный' },
    { name: 'Амулет защиты от обнаружения', description: 'Защита от прорицания и ментального слежения', rarity: 'Редкий' },
    { name: 'Талисман чистых помыслов', description: 'Оберег от ментального подчинения и страха' },
  ],
  belt: [
    { name: 'Пояс силы великана (Холмовой)', description: 'Сила владельца становится 21', rarity: 'Редкий' },
    { name: 'Пояс силы великана (Каменный)', description: 'Сила владельца становится 23', rarity: 'Очень редкий' },
    { name: 'Пояс карликовой стойкости', description: 'Дарует устойчивость к яду и +2 к Телосложению', rarity: 'Редкий' },
    { name: 'Кожаный ремень с подсумками', description: 'Удобный пояс для крепления зелий и ножен', weight: 1 },
    { name: 'Шелковый кушак', description: 'Восточный пояс для ношения кинжалов и свитков' },
  ],
  ring1: [
    { name: 'Кольцо защиты', bonusAC: 1, description: '+1 к Классу Доспеха и всем спасброскам', rarity: 'Редкий' },
    { name: 'Кольцо свободного перемещения', description: 'Игнорирует труднопроходимую местность и паралич', rarity: 'Редкий' },
    { name: 'Кольцо хранения заклинаний', description: 'Позволяет хранить до 5 уровней заклинаний', rarity: 'Редкий' },
    { name: 'Кольцо сопротивления (Огонь)', description: 'Дарует сопротивление урону от огня', rarity: 'Редкий' },
    { name: 'Кольцо прыжков', description: 'Троит дальность прыжков владельца', rarity: 'Необычный' },
    { name: 'Серебряное кольцо с печаткой', description: 'Фамильное дворянское кольцо' },
  ],
  ring2: [
    { name: 'Кольцо защиты', bonusAC: 1, description: '+1 к Классу Доспеха и всем спасброскам', rarity: 'Редкий' },
    { name: 'Кольцо свободного перемещения', description: 'Игнорирует труднопроходимую местность и паралич', rarity: 'Редкий' },
    { name: 'Кольцо уклонения', description: 'Позволяет автоматически преуспеть в спасброске Ловкости', rarity: 'Редкий' },
    { name: 'Кольцо перьевого падения', description: 'Автоматически активирует плавное падение', rarity: 'Редкий' },
    { name: 'Кольцо регенерации', description: 'Восстанавливает 1d6 хитов каждые 10 минут', rarity: 'Очень редкий' },
    { name: 'Золотое витое кольцо', description: 'Украшение тонкой гномьей работы' },
  ],
  cloak: [
    { name: 'Плащ защиты', bonusAC: 1, description: '+1 к Классу Доспеха и всем спасброскам', rarity: 'Необычный' },
    { name: 'Плащ эльфийского рода', description: 'Помеха на проверки обнаружения владельца', rarity: 'Необычный' },
    { name: 'Плащ перемещения', description: 'Атаки по владельцу совершаются с помехой', rarity: 'Редкий' },
    { name: 'Плащ невидимости', description: 'Дарует невидимость на 2 часа в день', rarity: 'Легендарный' },
    { name: 'Мантия архимага', bonusAC: 3, description: '+3 к КД, преимущество на спасброски от магии', rarity: 'Легендарный' },
    { name: 'Теплый дорожный плащ', description: 'Защищает от холода, дождя и ветра', weight: 4 },
  ],
  quiver: [
    { name: 'Колчан (20 стрел)', description: 'Вместительный кожаный колчан со стрелами для лука', weight: 2 },
    { name: 'Колчан с серебряными стрелами (20 шт.)', description: 'Стрелы с посеребренными наконечниками', weight: 2 },
    { name: 'Тубус для болтов (20 шт.)', description: 'Жесткий футляр для арбалетных болтов', weight: 2 },
    { name: 'Колчан Элонны', description: 'Магический колчан с 3 отделениями под стрелы, копья и луки', rarity: 'Редкий' },
  ],
  gloves: [
    { name: 'Рукавицы силы огра', description: 'Сила владельца становится 19, если она не была выше', rarity: 'Необычный' },
    { name: 'Наручи защиты', bonusAC: 2, description: '+2 к КД (действует, если не носите доспех и щит)', rarity: 'Редкий' },
    { name: 'Наручи лучника', description: '+2 к урону дальнобойным оружием', rarity: 'Необычный' },
    { name: 'Перчатки ловкости вора', description: '+5 к проверкам Ловкости рук и вскрытия замков', rarity: 'Редкий' },
    { name: 'Перчатки плавания и лазания', description: 'Скорость плавания и лазания равна обычной скорости', rarity: 'Необычный' },
    { name: 'Кожаные боевые перчатки', description: 'Удобные перчатки с усиленными ладонями', weight: 1 },
  ],
  pouch: [
    { name: 'Зелье лечения', description: 'Восстанавливает 2d4 + 2 хитов при употреблении', rarity: 'Обычный', weight: 0.5 },
    { name: 'Зелье великого лечения', description: 'Восстанавливает 4d4 + 4 хитов при употреблении', rarity: 'Необычный', weight: 0.5 },
    { name: 'Зелье превосходного лечения', description: 'Восстанавливает 8d4 + 8 хитов при употреблении', rarity: 'Редкий', weight: 0.5 },
    { name: 'Зелье невидимости', description: 'Делает выпившего невидимым на 1 час', rarity: 'Очень редкий', weight: 0.5 },
    { name: 'Зелье скорости', description: 'Дарует эффект заклинания «Ускорение» на 1 минуту', rarity: 'Очень редкий', weight: 0.5 },
    { name: 'Флакон со святой водой', description: 'Наносит 2d6 урона излучением нежити и бестиям', weight: 1 },
    { name: 'Кошель с золотыми монетами', description: 'Поясной кошель для монет и самоцветов', weight: 1 },
  ],
  boots: [
    { name: 'Сапоги скороходов', bonusSpeed: 10, description: '+10 фт. к базовой скорости перемещения', rarity: 'Редкий' },
    { name: 'Сапоги эльфийского рода', description: 'Шаги владельца абсолютно бесшумны', rarity: 'Необычный' },
    { name: 'Сапоги парения', description: 'Позволяет использовать заклинание «Левитация» по желанию', rarity: 'Редкий' },
    { name: 'Сапоги хождения по паутине', description: 'Иммунитет к застреванию в паутине и хождение по ней', rarity: 'Необычный' },
    { name: 'Прочные дорожные сапоги', description: 'Надежная кожаная обувь для дальних переходов', weight: 3 },
  ],
};

export function EquipmentSlotModal({
  slotId,
  char,
  isOpen,
  onClose,
  onEquip,
  onUnequip,
}: EquipmentSlotModalProps) {
  useEscapeKey(onClose, isOpen);

  const [activeTab, setActiveTab] = useState<'compendium' | 'custom'>('compendium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customBonusAC, setCustomBonusAC] = useState<string>('');
  const [customBonusSpeed, setCustomBonusSpeed] = useState<string>('');
  const [customTwoHanded, setCustomTwoHanded] = useState(false);
  const [customIsShield, setCustomIsShield] = useState(slotId === 'offHand');
  const [customWeight, setCustomWeight] = useState<string>('');

  const slotConfig = useMemo(() => {
    return EQUIPMENT_SLOTS.find(s => s.id === slotId) || {
      id: slotId,
      name: slotId,
      description: '',
      icon: '🛡️',
      category: 'armor' as const,
    };
  }, [slotId]);

  const currentEquipped = char.equippedSlots?.[slotId];
  const isOffHandConflict = slotId === 'offHand' && isOffHandBlocked(char);

  // Parse items from character backpack/inventory text (char.equipment)
  const backpackItems = useMemo(() => {
    if (!char.equipment) return [];
    return char.equipment
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 1 && !line.startsWith('#'))
      .map(line => line.replace(/^[-*•]\s*/, '').trim());
  }, [char.equipment]);

  // Build candidate items based on slot
  const candidateItems = useMemo(() => {
    const list: EquippedItem[] = [];

    // 1. Armor slot: Light, Medium, Heavy armors from compendium
    if (slotId === 'armor') {
      const armors = DND_COMPENDIUM_ITEMS.filter(i => i.category === 'Доспех');
      armors.forEach((a, idx) => {
        list.push({
          id: `armor-${idx}-${a.name}`,
          name: a.name,
          slot: 'armor',
          bonusAC: a.armor?.baseAC ?? 10,
          description: a.description,
          weight: a.weight ? parseFloat(a.weight.replace(/[^\d.]/g, '')) || undefined : undefined,
        });
      });
      // Clothes/Robes
      list.push({
        id: 'armor-clothes',
        name: 'Одежда путешественника',
        slot: 'armor',
        bonusAC: 10,
        description: 'Обычная практичная одежда без доспешной защиты',
      });
      list.push({
        id: 'armor-archmage',
        name: 'Мантия архимага',
        slot: 'armor',
        bonusAC: 15,
        description: 'Базовый КД 15 + модификатор Ловкости, преимущество на спасброски против заклинаний',
        rarity: 'Легендарный',
      });
    }

    // 2. Main Hand: all weapons
    else if (slotId === 'mainHand') {
      const weapons = DND_COMPENDIUM_ITEMS.filter(i => i.category === 'Оружие');
      weapons.forEach((w, idx) => {
        const is2H = (w.weapon?.properties || []).some(p => /двуручное|two-handed/i.test(p));
        list.push({
          id: `weapon-${idx}-${w.name}`,
          name: w.name,
          slot: 'mainHand',
          twoHanded: is2H,
          description: `${w.weapon?.damageDice || ''} ${w.weapon?.damageType || ''}. ${(w.weapon?.properties || []).join(', ')}`,
          weight: w.weight ? parseFloat(w.weight.replace(/[^\d.]/g, '')) || undefined : undefined,
        });
      });
      // Shield in main hand (improvised)
      list.push({
        id: 'main-shield',
        name: 'Щит',
        slot: 'mainHand',
        isShield: true,
        bonusAC: 2,
        description: '+2 к Классу Доспеха',
      });
    }

    // 3. Off Hand: shields and 1-handed weapons
    else if (slotId === 'offHand') {
      list.push({
        id: 'off-shield',
        name: 'Щит',
        slot: 'offHand',
        isShield: true,
        bonusAC: 2,
        description: '+2 к Классу Доспеха',
        weight: 6,
      });
      list.push({
        id: 'off-shield-plus-1',
        name: 'Щит +1',
        slot: 'offHand',
        isShield: true,
        bonusAC: 3,
        description: '+3 к Классу Доспеха (магический щит +1)',
        rarity: 'Необычный',
        weight: 6,
      });
      list.push({
        id: 'off-torch',
        name: 'Факел',
        slot: 'offHand',
        description: 'Освещает ярким светом радиус 20 фт. и тусклым еще на 20 фт.',
        weight: 1,
      });
      // Add 1-handed weapons for dual wielding
      const weapons = DND_COMPENDIUM_ITEMS.filter(
        i => i.category === 'Оружие' && !(i.weapon?.properties || []).some(p => /двуручное|two-handed/i.test(p))
      );
      weapons.forEach((w, idx) => {
        list.push({
          id: `off-wep-${idx}-${w.name}`,
          name: w.name,
          slot: 'offHand',
          description: `Оружие во второй руке (${w.weapon?.damageDice || ''} ${w.weapon?.damageType || ''})`,
          weight: w.weight ? parseFloat(w.weight.replace(/[^\d.]/g, '')) || undefined : undefined,
        });
      });
    }

    // 4. Other slots (head, neck, ring1, ring2, cloak, quiver, gloves, belt, pouch, boots)
    else {
      const presets = SLOT_PRESETS[slotId] || [];
      presets.forEach((p, idx) => {
        list.push({
          id: `${slotId}-preset-${idx}`,
          name: p.name || '',
          slot: slotId,
          bonusAC: p.bonusAC,
          bonusSpeed: p.bonusSpeed,
          description: p.description,
          rarity: p.rarity,
          weight: p.weight,
        });
      });
    }

    return list;
  }, [slotId]);

  // Filter candidates by search and category
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return candidateItems.filter(item => {
      if (q && !item.name.toLowerCase().includes(q) && !(item.description || '').toLowerCase().includes(q)) {
        return false;
      }
      if (slotId === 'mainHand') {
        if (filterType === '2h' && !item.twoHanded) return false;
        if (filterType === '1h' && item.twoHanded) return false;
      }
      return true;
    });
  }, [candidateItems, searchQuery, slotId, filterType]);

  // Handle equipping an item
  const handleSelectEquip = (item: EquippedItem) => {
    onEquip(slotId, item);
    onClose();
  };

  // Handle custom item submission
  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: EquippedItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      slot: slotId,
      description: customDesc.trim() || undefined,
      bonusAC: customBonusAC ? parseInt(customBonusAC, 10) || undefined : undefined,
      bonusSpeed: customBonusSpeed ? parseInt(customBonusSpeed, 10) || undefined : undefined,
      twoHanded: slotId === 'mainHand' ? customTwoHanded : undefined,
      isShield: slotId === 'offHand' ? customIsShield : undefined,
      weight: customWeight ? parseFloat(customWeight) || undefined : undefined,
      rarity: 'Свой предмет',
    };

    onEquip(slotId, newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="parchment-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-lg border-2 border-[#C9A84C] overflow-hidden text-[#3D2012]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#C9A84C]/40 bg-[#EFE3CD]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{slotConfig.icon}</span>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#3D2012] leading-tight">
                {slotConfig.name}
              </h3>
              <p className="text-xs text-[#8B6914] font-medium">
                {slotConfig.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="parchment-remove-btn w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none"
            title="Закрыть (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Current Equipped Banner */}
        {currentEquipped && (
          <div className="mx-4 mt-3 p-3 bg-[#EAD6B8]/70 rounded border border-[#C9A84C]/60 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold text-[#8B6914] tracking-wider">Экипировано:</span>
                <span className="font-serif font-bold text-[#3D2012] truncate">{currentEquipped.name}</span>
                {currentEquipped.bonusAC ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#C9A84C]/30 font-bold text-[#3D2012]">
                    +{currentEquipped.bonusAC} КД
                  </span>
                ) : null}
                {currentEquipped.twoHanded && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200/80 font-semibold text-amber-900">
                    Двуручное
                  </span>
                )}
              </div>
              {currentEquipped.description && (
                <p className="text-xs text-[#5C341F] mt-0.5 line-clamp-1">{currentEquipped.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onUnequip(slotId);
                onClose();
              }}
              className="px-3 py-1 text-xs font-semibold rounded bg-[#8B2500]/10 hover:bg-[#8B2500]/20 text-[#8B2500] border border-[#8B2500]/30 transition-colors whitespace-nowrap"
            >
              Снять предмет
            </button>
          </div>
        )}

        {/* Two-Handed Context Notice */}
        {slotId === 'mainHand' && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded bg-amber-50/80 border border-amber-300 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base">⚔️</span>
            <span>
              <strong>Двуручное оружие</strong> автоматически займет обе руки и освободит слот «Вторая рука».
            </span>
          </div>
        )}

        {isOffHandConflict && (
          <div className="mx-4 mt-2 px-3 py-2 rounded bg-amber-100/90 border border-amber-400 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              В основной руке экипировано двуручное оружие. Экипировка в этот слот освободит основную руку.
            </span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-[#C9A84C]/20">
          <button
            type="button"
            onClick={() => setActiveTab('compendium')}
            className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'compendium'
                ? 'bg-[#8B4513] text-[#F5E6C8] shadow-sm'
                : 'bg-transparent text-[#6B3A2A] hover:bg-[#C9A84C]/20'
            }`}
          >
            📚 Из компендиума ({filteredCandidates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'custom'
                ? 'bg-[#8B4513] text-[#F5E6C8] shadow-sm'
                : 'bg-transparent text-[#6B3A2A] hover:bg-[#C9A84C]/20'
            }`}
          >
            ✨ Свой предмет
          </button>
        </div>

        {/* Tab 1: Compendium Catalog */}
        {activeTab === 'compendium' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-5 py-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или свойству..."
                className="parchment-input-boxed flex-1 min-w-[180px] text-xs py-1.5 px-3 rounded"
              />
              {slotId === 'mainHand' && (
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded border text-xs font-medium ${
                      filterType === 'all'
                        ? 'border-[#8B4513] bg-[#8B4513]/10 font-bold'
                        : 'border-[#C9A84C]/40 text-[#6B3A2A]'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('1h')}
                    className={`px-2.5 py-1 rounded border text-xs font-medium ${
                      filterType === '1h'
                        ? 'border-[#8B4513] bg-[#8B4513]/10 font-bold'
                        : 'border-[#C9A84C]/40 text-[#6B3A2A]'
                    }`}
                  >
                    Одноручные
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('2h')}
                    className={`px-2.5 py-1 rounded border text-xs font-medium ${
                      filterType === '2h'
                        ? 'border-[#8B4513] bg-[#8B4513]/10 font-bold'
                        : 'border-[#C9A84C]/40 text-[#6B3A2A]'
                    }`}
                  >
                    Двуручные
                  </button>
                </div>
              )}
            </div>

            {/* Backpack suggestions if available */}
            {backpackItems.length > 0 && searchQuery.trim() === '' && (
              <div className="mb-2">
                <span className="text-[11px] font-bold text-[#8B6914] uppercase tracking-wider block mb-1">
                  📦 Из инвентаря персонажа:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {backpackItems.slice(0, 6).map((itemStr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        handleSelectEquip({
                          id: `inv-${Date.now()}-${i}`,
                          name: itemStr,
                          slot: slotId,
                          description: 'Экипировано из снаряжения персонажа',
                        });
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-[#F5E6C8] hover:bg-[#FFE58F]/60 border border-[#C9A84C]/50 text-[#3D2012] transition-colors truncate max-w-[200px]"
                    >
                      + {itemStr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8B6914] italic">
                  Предметы не найдены. Попробуйте изменить запрос или создайте предмет на вкладке «Свой предмет».
                </div>
              ) : (
                filteredCandidates.map((item) => {
                  const isCurrent = currentEquipped?.name === item.name;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-[#C9A84C] bg-[#FFE58F]/30 shadow-sm'
                          : 'border-[#C9A84C]/30 bg-[#FBF0DC]/60 hover:bg-[#FBF0DC] hover:border-[#C9A84C]/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-[#3D2012]">
                            {item.name}
                          </span>
                          {item.bonusAC !== undefined && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#C9A84C]/25 text-[#3D2012] font-semibold">
                              +{item.bonusAC} КД
                            </span>
                          )}
                          {item.bonusSpeed !== undefined && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                              +{item.bonusSpeed} фт.
                            </span>
                          )}
                          {item.twoHanded && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-200/90 text-amber-900 font-semibold">
                              Двуручное
                            </span>
                          )}
                          {item.isShield && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 font-semibold">
                              Щит
                            </span>
                          )}
                          {item.rarity && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-purple-100 text-purple-900 font-medium">
                              {item.rarity}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-[#6B3A2A] mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectEquip(item)}
                        disabled={isCurrent}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all whitespace-nowrap ${
                          isCurrent
                            ? 'bg-[#C9A84C]/30 text-[#8B6914] cursor-default'
                            : 'parchment-btn hover:brightness-105 active:scale-95'
                        }`}
                      >
                        {isCurrent ? 'Надето' : 'Экипировать'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Item Form */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCreateCustom} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#3D2012] mb-1">
                Название предмета *
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="например: Кольцо драконьей чешуи"
                className="parchment-input-boxed w-full text-xs py-1.5 px-3 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D2012] mb-1">
                Описание и свойства
              </label>
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                rows={2}
                placeholder="например: Дает +1 к КД и сопротивление огню"
                className="parchment-textarea w-full text-xs py-1.5 px-3 rounded"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#6B3A2A] mb-1">
                  Бонус к КД (+X)
                </label>
                <input
                  type="number"
                  value={customBonusAC}
                  onChange={(e) => setCustomBonusAC(e.target.value)}
                  placeholder="0"
                  className="parchment-input-boxed w-full text-xs py-1 px-2 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B3A2A] mb-1">
                  Бонус к скорости (+X фт.)
                </label>
                <input
                  type="number"
                  step="5"
                  value={customBonusSpeed}
                  onChange={(e) => setCustomBonusSpeed(e.target.value)}
                  placeholder="0"
                  className="parchment-input-boxed w-full text-xs py-1 px-2 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B3A2A] mb-1">
                  Вес (фнт.)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="0"
                  className="parchment-input-boxed w-full text-xs py-1 px-2 rounded"
                />
              </div>
            </div>

            {slotId === 'mainHand' && (
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#3D2012]">
                  <input
                    type="checkbox"
                    checked={customTwoHanded}
                    onChange={(e) => setCustomTwoHanded(e.target.checked)}
                    className="rounded border-[#C9A84C] text-[#8B4513] focus:ring-[#C9A84C]"
                  />
                  <span>Двуручное оружие (автоматически блокирует вторую руку)</span>
                </label>
              </div>
            )}

            {slotId === 'offHand' && (
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#3D2012]">
                  <input
                    type="checkbox"
                    checked={customIsShield}
                    onChange={(e) => setCustomIsShield(e.target.checked)}
                    className="rounded border-[#C9A84C] text-[#8B4513] focus:ring-[#C9A84C]"
                  />
                  <span>Считается щитом (+2 КД по правилам 5e)</span>
                </label>
              </div>
            )}

            <div className="pt-3 border-t border-[#C9A84C]/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="parchment-btn-secondary px-3 py-1.5 text-xs rounded"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="parchment-btn px-4 py-1.5 text-xs rounded font-semibold"
              >
                Создать и экипировать
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#EFE3CD]/60 border-t border-[#C9A84C]/30 flex items-center justify-between text-xs text-[#8B6914]">
          <span>Слот: {slotConfig.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#8B4513] hover:underline"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
