'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CharacterData,
  AbilityName,
  ABILITY_NAMES,
  ABILITY_FULL,
  formatModifier,
  calcProficiencyBonus,
  getTotalScore,
  getModifier,
  LevelUpEntry,
  TraitItem,
  getHitDieSize,
  getHitDieAverage,
  getHitDiceNotation,
} from '@/lib/dnd-types';
import {
  getClassFeaturesForLevel,
  getClassSubclassLevel,
  getSubclassesForClass,
  getSpellSlotsForClassLevel,
  getNewSpellLevelUnlocked,
  isClassASILevel,
  DND_COMPENDIUM_FEATS,
  getRacialFeaturesForLevel,
  getRacialHPBonusPerLevel,
  getAvailableSpellsForCharacter,
  getMaxAvailableSpellSlotLevel,
  normalizeClassName,
  getNewCantripsGainedForLevel,
  getNewSpellsLearnedForLevel,
} from '@/data/compendium';
import {
  getAutoGrantedSpellsForLevel,
  type AutoGrantedSpell,
} from '@/data/compendium/auto-spells-engine';
import {
  getLevelUpChoicesConfig,
  getThirdCasterSpellSlots,
  METAMAGIC_OPTIONS,
  ELDRITCH_INVOCATIONS,
  BATTLE_MASTER_MANEUVERS,
  getKnownSpellNames,
  filterAvailableSpells,
  normalizeSpellName,
} from './level-up-choices';
import { DND_COMPENDIUM_SPELLS } from '@/data/compendium/spells';
import {
  WARLOCK_INVOCATIONS,
  WARLOCK_PACT_BOONS,
  WARLOCK_PACT_BOONS_LIST,
  GENIE_KINDS,
  GENIE_KINDS_LIST,
  WARLOCK_MYSTIC_ARCANUM_SPELLS,
} from '@/data/compendium/warlock-choices';
import { FIGHTING_STYLES } from '@/components/wizard/wizard-helpers';
import {
  AutocompleteInput,
  type AutocompleteItem,
} from '@/components/compendium/AutocompleteInput';
import {
  D20Icon,
  CrossedSwordsIcon,
  SparklesDndIcon,
  ScrollIcon,
  SpellbookIcon,
  GoldSealCheckIcon,
  CrystalBallDndIcon,
  HourglassIcon,
} from '@/components/dnd-icons';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export interface LevelUpModalProps {
  char: CharacterData;
  onConfirm: (entry: LevelUpEntry) => void;
  onCancel: () => void;
}

export const LevelUpModal = React.memo(function LevelUpModal({
  char,
  onConfirm,
  onCancel,
}: LevelUpModalProps) {
  useEscapeKey(onCancel);
  const newLevel = char.level + 1;
  const dieSize = char.hitDice ? getHitDieSize(char.hitDice) : 8;
  const diceNotation = char.hitDice ? getHitDiceNotation(char.hitDice) : 'd';
  const conMod = getModifier(char, 'ТЕЛ');

  // Tough feat bonus (+2 HP per level)
  const hasTough = (char.traitsList || []).some(
    t =>
      t.name.toLowerCase().includes('живучий') ||
      t.name.toLowerCase().includes('tough')
  );
  const toughBonus = hasTough ? 2 : 0;

  // Racial HP bonus (Hill Dwarf: +1 HP per level)
  const racialHPBonus = getRacialHPBonusPerLevel(char.race, char.subrace);

  const avgHP =
    (char.hitDice ? getHitDieAverage(char.hitDice) : 5) +
    conMod +
    toughBonus +
    racialHPBonus;

  // Class progression data
  const classFeatures = useMemo(
    () => getClassFeaturesForLevel(char.className, newLevel),
    [char.className, newLevel]
  );
  const isASI = useMemo(
    () => isClassASILevel(char.className, newLevel),
    [char.className, newLevel]
  );
  const subclassReqLevel = useMemo(
    () => getClassSubclassLevel(char.className),
    [char.className]
  );
  const isSubclassChoice = !char.subclass && newLevel >= subclassReqLevel;
  const availableSubclasses = useMemo(
    () => getSubclassesForClass(char.className),
    [char.className]
  );

  // Subclass choice
  const [chosenSubclass, setChosenSubclass] = useState<string>(
    availableSubclasses[0]?.name || ''
  );
  const effectiveSubclass =
    char.subclass || (isSubclassChoice ? chosenSubclass : '');

  // Subclass object
  const currentSubclassObj = useMemo(() => {
    if (!effectiveSubclass) return null;
    return (
      availableSubclasses.find(
        s =>
          s.name.toLowerCase() === effectiveSubclass.toLowerCase() ||
          s.nameEn.toLowerCase() === effectiveSubclass.toLowerCase()
      ) || null
    );
  }, [effectiveSubclass, availableSubclasses]);

  // Subclass features for this level
  const subclassFeatures = useMemo(() => {
    if (!currentSubclassObj?.features) return [];
    if (isSubclassChoice) {
      return currentSubclassObj.features.filter(f => f.level <= newLevel);
    }
    return currentSubclassObj.features.filter(f => f.level === newLevel);
  }, [currentSubclassObj, isSubclassChoice, newLevel]);

  // Third-caster check
  const isThirdCaster = useMemo(() => {
    const s = effectiveSubclass.toLowerCase();
    return (
      s.includes('мистический рыцарь') ||
      s.includes('eldritch knight') ||
      s.includes('мистический ловкач') ||
      s.includes('arcane trickster')
    );
  }, [effectiveSubclass]);

  const newSpellSlots = useMemo(() => {
    if (isThirdCaster) {
      return getThirdCasterSpellSlots(newLevel);
    }
    return getSpellSlotsForClassLevel(char.className, newLevel);
  }, [isThirdCaster, char.className, newLevel]);

  const unlockedCircle = useMemo(() => {
    if (isThirdCaster) {
      const cur = getThirdCasterSpellSlots(newLevel);
      const prev = newLevel > 3 ? getThirdCasterSpellSlots(newLevel - 1) : null;
      const curMax = cur ? Math.max(...Object.keys(cur).map(Number)) : 0;
      const prevMax = prev ? Math.max(...Object.keys(prev).map(Number)) : 0;
      return curMax > prevMax ? curMax : null;
    }
    return getNewSpellLevelUnlocked(char.className, newLevel);
  }, [isThirdCaster, char.className, newLevel]);

  const profChanged =
    calcProficiencyBonus(newLevel) !== calcProficiencyBonus(char.level);

  // Racial progression features
  const racialFeatures = useMemo(
    () => getRacialFeaturesForLevel(char.race, char.subrace, newLevel),
    [char.race, char.subrace, newLevel]
  );

  // Auto-granted spells engine
  const autoSpells: AutoGrantedSpell[] = useMemo(() => {
    return getAutoGrantedSpellsForLevel(char, newLevel, effectiveSubclass);
  }, [char, newLevel, effectiveSubclass]);

  // Interactive choices config
  const choicesConfig = useMemo(() => {
    return getLevelUpChoicesConfig(char, newLevel, effectiveSubclass);
  }, [char, newLevel, effectiveSubclass]);

  // States
  const [hpMode, setHpMode] = useState<'average' | 'roll'>('average');
  const [hpRoll, setHpRoll] = useState(dieSize);

  const rollHpDie = useCallback(() => {
    const rolled = Math.floor(Math.random() * dieSize) + 1;
    setHpRoll(rolled);
  }, [dieSize]);

  // Selected features (class & subclass)
  const [selectedFeatures, setSelectedFeatures] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const f of classFeatures) init[f.name] = true;
    for (const sf of subclassFeatures) init[sf.name] = true;
    return init;
  });

  useEffect(() => {
    if (subclassFeatures.length > 0) {
      setSelectedFeatures(prev => {
        const next = { ...prev };
        for (const sf of subclassFeatures) {
          if (next[sf.name] === undefined) next[sf.name] = true;
        }
        return next;
      });
    }
  }, [subclassFeatures]);

  // Selected racial features
  const [selectedRacialFeatures, setSelectedRacialFeatures] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const rf of racialFeatures) init[rf.name] = true;
    return init;
  });

  // Interactive choices states
  const [selectedFightingStyle, setSelectedFightingStyle] = useState<string>(
    () => choicesConfig.fightingStyleOptions?.[0]?.id || ''
  );
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedMetamagic, setSelectedMetamagic] = useState<string[]>([]);
  const [selectedInvocations, setSelectedInvocations] = useState<string[]>([]);
  const [selectedHunterChoice, setSelectedHunterChoice] = useState<string>(
    () => choicesConfig.hunterOptions?.[0]?.id || ''
  );
  const [selectedTotemChoice, setSelectedTotemChoice] = useState<string>(
    () => choicesConfig.totemOptions?.[0]?.id || ''
  );
  const [selectedManeuvers, setSelectedManeuvers] = useState<string[]>([]);

  // Warlock specific choices states
  const [selectedPactBoon, setSelectedPactBoon] = useState<string>(
    () => choicesConfig.pactBoonOptions?.[0]?.id || 'blade'
  );
  const [selectedTomeCantrips, setSelectedTomeCantrips] = useState<string[]>([]);
  const [swappedOutInvocation, setSwappedOutInvocation] = useState<string>('');
  const [swappedInInvocation, setSwappedInInvocation] = useState<string>('');
  const [selectedArcanumSpell, setSelectedArcanumSpell] = useState<string>(
    () => choicesConfig.arcanumOptions?.[0] || ''
  );
  const [selectedFiendResilience, setSelectedFiendResilience] = useState<string>(
    () => choicesConfig.fiendResilienceOptions?.[0] || 'огонь'
  );
  const [selectedGenieKind, setSelectedGenieKind] = useState<string>(
    () => choicesConfig.genieKindOptions?.[0]?.id || 'dao'
  );

  // Saving throw choice (e.g. Gloom Stalker Iron Mind)
  const [selectedSavingThrow, setSelectedSavingThrow] = useState<AbilityName>(
    () => choicesConfig.savingThrowOptions?.[0] || 'МДР'
  );
  // Skill choice (e.g. Fey Wanderer Otherworldly Glamour)
  const [selectedFeyWandererSkill, setSelectedFeyWandererSkill] = useState<string>(
    () => choicesConfig.feyWandererSkillOptions?.[0] || 'Обман'
  );

  useEffect(() => {
    if (choicesConfig.savingThrowOptions?.length) {
      setSelectedSavingThrow(choicesConfig.savingThrowOptions[0]);
    }
  }, [choicesConfig.savingThrowOptions]);

  useEffect(() => {
    if (choicesConfig.feyWandererSkillOptions?.length) {
      setSelectedFeyWandererSkill(choicesConfig.feyWandererSkillOptions[0]);
    }
  }, [choicesConfig.feyWandererSkillOptions]);

  // ASI / Feat choice
  const [asiChoice, setAsiChoice] = useState<'stats' | 'feat'>('stats');
  const [asiAbility1, setAsiAbility1] = useState<AbilityName>('СИЛ');
  const [asiAbility2, setAsiAbility2] = useState<AbilityName>('ЛОВ');
  const allFeats = useMemo(
    () => DND_COMPENDIUM_FEATS.filter(f => f.category === 'Черта'),
    []
  );
  const [selectedFeatId, setSelectedFeatId] = useState<string>(
    allFeats[0]?.id || 'alert'
  );
  const selectedFeat = allFeats.find(f => f.id === selectedFeatId);

  // ASI Cap calculation (max 20 per 5e rules)
  const score1 = getTotalScore(char, asiAbility1);
  const score2 = getTotalScore(char, asiAbility2);
  const isSameAbility = asiAbility1 === asiAbility2;
  const nextScore1 = score1 + (isSameAbility ? 2 : 1);
  const nextScore2 = isSameAbility ? nextScore1 : score2 + 1;
  const isScore1OverCap = nextScore1 > 20;
  const isScore2OverCap = nextScore2 > 20;
  const isASIOverCap =
    isASI && asiChoice === 'stats' && (isScore1OverCap || isScore2OverCap);

  const [notes, setNotes] = useState('');

  const finalHP = Math.max(
    1,
    hpMode === 'average'
      ? avgHP
      : hpRoll + conMod + toughBonus + racialHPBonus
  );

  const toggleFeature = (name: string) => {
    setSelectedFeatures(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleRacialFeature = (name: string) => {
    setSelectedRacialFeatures(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const charWithEffectiveSubclass = useMemo(() => {
    return { ...char, subclass: effectiveSubclass };
  }, [char, effectiveSubclass]);

  const maxSlotLevelAtNewLevel = useMemo(() => {
    return getMaxAvailableSpellSlotLevel(charWithEffectiveSubclass, newLevel);
  }, [charWithEffectiveSubclass, newLevel]);

  // Determine if character is a spellcaster
  const normClass = useMemo(
    () => normalizeClassName(char.className || ''),
    [char.className]
  );
  const isSpellcasterClass = useMemo(() => {
    const casters = [
      'Волшебник',
      'Чародей',
      'Бард',
      'Колдун',
      'Жрец',
      'Друид',
      'Паладин',
      'Следопыт',
      'Изобретатель',
    ];
    return casters.includes(normClass) || isThirdCaster;
  }, [normClass, isThirdCaster]);

  const hasSpellSlots = Boolean(
    newSpellSlots && Object.keys(newSpellSlots).length > 0
  );
  const isCasterAtNewLevel =
    isSpellcasterClass || hasSpellSlots || maxSlotLevelAtNewLevel > 0;

  const newCantripsGained = useMemo(() => {
    return getNewCantripsGainedForLevel(normClass, effectiveSubclass, newLevel);
  }, [normClass, effectiveSubclass, newLevel]);

  const newSpellsLearned = useMemo(() => {
    return getNewSpellsLearnedForLevel(normClass, effectiveSubclass, newLevel);
  }, [normClass, effectiveSubclass, newLevel]);

  const availableClassSpells = useMemo(() => {
    if (!isCasterAtNewLevel) return [];
    return getAvailableSpellsForCharacter(charWithEffectiveSubclass);
  }, [isCasterAtNewLevel, charWithEffectiveSubclass]);

  const availableCantrips = useMemo(() => {
    const list = availableClassSpells.filter(s => s.level === 0);
    const effectiveList = list.length > 0 ? list : DND_COMPENDIUM_SPELLS.filter(s => s.level === 0);
    return [...effectiveList].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [availableClassSpells]);

  const getAvailableSpellsForLevel = useCallback(
    (lvl: number) => {
      const list = availableClassSpells.filter(s => s.level === lvl);
      const effectiveList = list.length > 0 ? list : DND_COMPENDIUM_SPELLS.filter(s => s.level === lvl);
      return [...effectiveList].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    },
    [availableClassSpells]
  );

  const defaultSpellLevel = Math.min(
    unlockedCircle || 1,
    Math.max(1, maxSlotLevelAtNewLevel)
  );

  // Set of normalized spell names already known by the character or auto-granted at this level
  const baseKnownSpells = useMemo(() => {
    const additional = [
      ...autoSpells.map(s => s.name),
      ...racialFeatures.filter(rf => rf.spell).map(rf => rf.spell!.name),
    ];
    return getKnownSpellNames(char, additional);
  }, [char, autoSpells, racialFeatures]);

  const autoCantripsCount = useMemo(() => {
    return autoSpells.filter(s => s.level === 0).length;
  }, [autoSpells]);

  const selectableCantripsGained = useMemo(() => {
    return Math.max(0, newCantripsGained - autoCantripsCount);
  }, [newCantripsGained, autoCantripsCount]);

  // Clean spellcasting learning state (pre-populated with count gained at this level per dnd.su)
  const [newCantrips, setNewCantrips] = useState<string[]>(() => {
    return selectableCantripsGained > 0 ? Array(selectableCantripsGained).fill('') : [];
  });
  const [customCantrips, setCustomCantrips] = useState<Record<number, boolean>>({});

  const [newSpells, setNewSpells] = useState<
    { level: number; name: string; prepared: boolean; isCustom?: boolean }[]
  >(() => {
    if (newSpellsLearned > 0 && maxSlotLevelAtNewLevel > 0) {
      return Array.from({ length: newSpellsLearned }, () => ({
        level: defaultSpellLevel,
        name: '',
        prepared: true,
        isCustom: false,
      }));
    }
    return [];
  });

  // Synchronize cantrip slots when subclass or selectable cantrips change
  useEffect(() => {
    if (selectableCantripsGained > 0) {
      setNewCantrips(prev => {
        if (prev.length === 0) {
          return Array(selectableCantripsGained).fill('');
        }
        return prev;
      });
    } else if (newCantripsGained === 0) {
      setNewCantrips([]);
    }
  }, [selectableCantripsGained, newCantripsGained]);

  // Synchronize spell slots when subclass or spells learned change
  useEffect(() => {
    if (newSpellsLearned > 0 && maxSlotLevelAtNewLevel > 0) {
      setNewSpells(prev => {
        if (prev.length === 0) {
          return Array.from({ length: newSpellsLearned }, () => ({
            level: defaultSpellLevel,
            name: '',
            prepared: true,
            isCustom: false,
          }));
        }
        return prev;
      });
    } else if (newSpellsLearned === 0 || maxSlotLevelAtNewLevel === 0) {
      setNewSpells([]);
    }
  }, [newSpellsLearned, maxSlotLevelAtNewLevel, defaultSpellLevel]);

  const addCantripRow = () => setNewCantrips(prev => [...prev, '']);
  const removeCantripRow = (i: number) => {
    setNewCantrips(prev => prev.filter((_, j) => j !== i));
    setCustomCantrips(prev => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };
  const updateCantripRow = (i: number, v: string) =>
    setNewCantrips(prev => {
      const a = [...prev];
      a[i] = v;
      return a;
    });
  const toggleCustomCantrip = (i: number, isCustom: boolean) =>
    setCustomCantrips(prev => ({ ...prev, [i]: isCustom }));

  const addSpellRow = () =>
    setNewSpells(prev => [
      ...prev,
      {
        level: defaultSpellLevel,
        name: '',
        prepared: true,
        isCustom: false,
      },
    ]);
  const removeSpellRow = (i: number) =>
    setNewSpells(prev => prev.filter((_, j) => j !== i));
  const updateSpellRow = (
    i: number,
    field: 'level' | 'name' | 'prepared' | 'isCustom',
    value: string | number | boolean
  ) =>
    setNewSpells(prev => {
      const a = [...prev];
      a[i] = { ...a[i], [field]: value };
      return a;
    });

  const getSelectableCantripsForIndex = useCallback(
    (index: number, currentName?: string) => {
      const otherSelected = newCantrips
        .filter((c, idx) => idx !== index && c.trim())
        .map(normalizeSpellName);
      const otherTome = selectedTomeCantrips.map(normalizeSpellName);
      const excludeSet = new Set([...baseKnownSpells, ...otherSelected, ...otherTome]);
      return filterAvailableSpells(availableCantrips, excludeSet, currentName);
    },
    [baseKnownSpells, newCantrips, selectedTomeCantrips, availableCantrips]
  );

  const getSelectableSpellsForIndex = useCallback(
    (index: number, lvl: number, currentName?: string) => {
      const otherSelected = newSpells
        .filter((s, idx) => idx !== index && s.name.trim())
        .map(s => normalizeSpellName(s.name));
      const excludeSet = new Set([...baseKnownSpells, ...otherSelected]);
      const classSpells = getAvailableSpellsForLevel(lvl);
      return filterAvailableSpells(classSpells, excludeSet, currentName);
    },
    [baseKnownSpells, newSpells, getAvailableSpellsForLevel]
  );

  // Validation
  const requiredExpertiseCount = Math.min(
    choicesConfig.expertiseCount || 0,
    choicesConfig.eligibleSkills?.length || 0
  );
  const requiredMetamagicCount = Math.min(
    choicesConfig.metamagicCount || 0,
    choicesConfig.metamagicOptions?.length || 0
  );
  const requiredInvocationsCount = Math.min(
    choicesConfig.invocationsCount || 0,
    choicesConfig.invocationsOptions?.length || 0
  );
  const requiredManeuversCount = Math.min(
    choicesConfig.maneuverCount || 0,
    choicesConfig.maneuverOptions?.length || 0
  );

  const validationErrors: string[] = useMemo(() => {
    const errs: string[] = [];
    if (isASIOverCap) {
      errs.push(
        'Значение характеристики не может превышать 20 при стандартном ASI.'
      );
    }
    if (
      isSubclassChoice &&
      availableSubclasses.length > 0 &&
      !chosenSubclass.trim()
    ) {
      errs.push('Необходимо выбрать архетип / специализацию.');
    }
    if (choicesConfig.needsFightingStyle && !selectedFightingStyle) {
      errs.push('Необходимо выбрать боевой стиль.');
    }
    if (
      choicesConfig.needsExpertise &&
      selectedExpertise.length < requiredExpertiseCount
    ) {
      errs.push(
        `Выберите ${requiredExpertiseCount} навыка для Компетентности (выбрано: ${selectedExpertise.length}).`
      );
    }
    if (
      choicesConfig.needsMetamagic &&
      selectedMetamagic.length < requiredMetamagicCount
    ) {
      errs.push(
        `Выберите ${requiredMetamagicCount} варианта Метамагии (выбрано: ${selectedMetamagic.length}).`
      );
    }
    if (
      choicesConfig.needsInvocations &&
      selectedInvocations.length < requiredInvocationsCount
    ) {
      errs.push(
        `Выберите ${requiredInvocationsCount} воззвания (выбрано: ${selectedInvocations.length}).`
      );
    }
    if (choicesConfig.needsHunterChoice && !selectedHunterChoice) {
      errs.push(
        `Выберите опцию: ${choicesConfig.hunterChoiceTitle || 'Охотник'}.`
      );
    }
    if (choicesConfig.needsTotemChoice && !selectedTotemChoice) {
      errs.push(
        `Выберите дух тотема: ${choicesConfig.totemChoiceTitle || 'Тотем'}.`
      );
    }
    if (
      choicesConfig.needsManeuvers &&
      selectedManeuvers.length < requiredManeuversCount
    ) {
      errs.push(
        `Выберите ${requiredManeuversCount} маневра (выбрано: ${selectedManeuvers.length}).`
      );
    }
    if (choicesConfig.needsPactBoon && !selectedPactBoon) {
      errs.push('Необходимо выбрать Предмет договора (Клинок, Гримуар, Цепь или Талисман).');
    }
    if (choicesConfig.needsPactBoon && selectedPactBoon === 'tome' && selectedTomeCantrips.length < 3) {
      errs.push(`Выберите 3 заговора для Книги Теней (выбрано: ${selectedTomeCantrips.length}).`);
    }
    if (choicesConfig.needsMysticArcanum && !selectedArcanumSpell) {
      errs.push(`Необходимо выбрать заклинание для Таинственного арканума (${choicesConfig.arcanumCircle || 6} круг).`);
    }
    if (choicesConfig.needsFiendResilience && !selectedFiendResilience) {
      errs.push('Необходимо выбрать тип урона для Стойкости исчадия.');
    }
    if (choicesConfig.needsGenieKind && !selectedGenieKind) {
      errs.push('Необходимо выбрать вид джинна-покровителя.');
    }
    if (choicesConfig.canSwapInvocation && swappedOutInvocation && !swappedInInvocation) {
      errs.push(`Выберите новое воззвание взамен «${swappedOutInvocation}».`);
    }

    // Spells and cantrips duplication validation
    for (let i = 0; i < newSpells.length; i++) {
      const s = newSpells[i];
      if (s.name.trim()) {
        const norm = normalizeSpellName(s.name);
        if (baseKnownSpells.has(norm)) {
          errs.push(`Заклинание «${s.name}» уже известно персонажу.`);
        }
        for (let j = i + 1; j < newSpells.length; j++) {
          if (normalizeSpellName(newSpells[j].name) === norm) {
            errs.push(`Заклинание «${s.name}» выбрано более одного раза.`);
            break;
          }
        }
      }
    }

    for (let i = 0; i < newCantrips.length; i++) {
      const c = newCantrips[i];
      if (c.trim()) {
        const norm = normalizeSpellName(c);
        if (baseKnownSpells.has(norm)) {
          errs.push(`Заговор «${c}» уже известен персонажу.`);
        }
        for (let j = i + 1; j < newCantrips.length; j++) {
          if (normalizeSpellName(newCantrips[j]) === norm) {
            errs.push(`Заговор «${c}» выбран более одного раза.`);
            break;
          }
        }
      }
    }

    for (const tc of selectedTomeCantrips) {
      if (baseKnownSpells.has(normalizeSpellName(tc))) {
        errs.push(`Заговор «${tc}» для Книги Теней уже известен персонажу.`);
      }
    }

    return errs;
  }, [
    isASIOverCap,
    isSubclassChoice,
    availableSubclasses,
    chosenSubclass,
    choicesConfig,
    selectedFightingStyle,
    selectedExpertise,
    requiredExpertiseCount,
    selectedMetamagic,
    requiredMetamagicCount,
    selectedInvocations,
    requiredInvocationsCount,
    selectedHunterChoice,
    selectedTotemChoice,
    selectedManeuvers,
    requiredManeuversCount,
    selectedPactBoon,
    selectedTomeCantrips,
    selectedArcanumSpell,
    selectedFiendResilience,
    selectedGenieKind,
    swappedOutInvocation,
    swappedInInvocation,
    newSpells,
    newCantrips,
    baseKnownSpells,
  ]);

  // Serialization
  const buildEntry = (): LevelUpEntry => {
    const addedTraits: TraitItem[] = [];

    // Class features
    for (const f of classFeatures) {
      if (selectedFeatures[f.name]) {
        addedTraits.push({
          id: `feat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          source: `${char.className || 'Класс'} (${newLevel} ур.)`,
          summary: f.name,
          description: f.description,
        });
      }
    }

    // Subclass features
    for (const sf of subclassFeatures) {
      if (isSubclassChoice || selectedFeatures[sf.name] !== false) {
        addedTraits.push({
          id: `subfeat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: sf.name,
          source: `${effectiveSubclass} (${sf.level || newLevel} ур.)`,
          summary: sf.name,
          description: sf.description,
        });
      }
    }

    // Racial features
    for (const rf of racialFeatures) {
      if (selectedRacialFeatures[rf.name]) {
        addedTraits.push({
          id: `racefeat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
          name: rf.name,
          source: `${char.subrace || char.race || 'Раса'} (${newLevel} ур.)`,
          summary: rf.name,
          description: rf.description,
        });
      }
    }

    // Fighting style trait
    if (choicesConfig.needsFightingStyle && selectedFightingStyle) {
      const fs = (choicesConfig.fightingStyleOptions || FIGHTING_STYLES).find(
        f => f.id === selectedFightingStyle
      );
      if (fs) {
        addedTraits.push({
          id: `fighting-style-${fs.id}`,
          name: `Боевой стиль: ${fs.name}`,
          source: `${char.className || 'Класс'} (${newLevel} ур.)`,
          summary: fs.description,
          description: `${fs.name} (${fs.nameEn}): ${fs.description}`,
        });
      }
    }

    // Metamagic traits
    if (choicesConfig.needsMetamagic && selectedMetamagic.length > 0) {
      for (const mId of selectedMetamagic) {
        const m = METAMAGIC_OPTIONS.find(opt => opt.id === mId);
        if (m) {
          addedTraits.push({
            id: `metamagic-${m.id}`,
            name: `Метамагия: ${m.name}`,
            source: `Чародей (${newLevel} ур.)`,
            summary: `${m.cost}: ${m.description}`,
            description: `${m.name} [${m.cost}]: ${m.description}`,
          });
        }
      }
    }

    // Warlock Pact Boon trait (Level 3)
    if (choicesConfig.needsPactBoon && selectedPactBoon) {
      const pb = (choicesConfig.pactBoonOptions || WARLOCK_PACT_BOONS_LIST).find(b => b.id === selectedPactBoon);
      if (pb) {
        addedTraits.push({
          id: `pact-boon-${pb.id}`,
          name: pb.name,
          source: `Колдун (${newLevel} ур.)`,
          summary: pb.description,
          description: `${pb.name} (${pb.nameEn}): ${pb.description}\n${pb.features.map(f => `• ${f}`).join('\n')}${selectedPactBoon === 'tome' && selectedTomeCantrips.length > 0 ? `\n\nВыбранные заговоры Книги Теней: ${selectedTomeCantrips.join(', ')}` : ''}`,
        });
      }
    }

    // Invocations traits
    if (choicesConfig.needsInvocations && selectedInvocations.length > 0) {
      for (const invId of selectedInvocations) {
        const inv = WARLOCK_INVOCATIONS.find(opt => opt.id === invId) || ELDRITCH_INVOCATIONS.find(opt => opt.id === invId);
        if (inv) {
          const prereq = 'prerequisiteDescription' in inv && inv.prerequisiteDescription ? ` [${inv.prerequisiteDescription}]` : '';
          addedTraits.push({
            id: `invocation-${inv.id}`,
            name: `Таинственное воззвание: ${inv.name}`,
            source: `Колдун (${newLevel} ур.)`,
            summary: inv.description,
            description: `${inv.name}${prereq}: ${inv.description}`,
          });
        }
      }
    }

    // Swapped Invocation
    if (choicesConfig.canSwapInvocation && swappedOutInvocation && swappedInInvocation) {
      const inv = WARLOCK_INVOCATIONS.find(opt => opt.id === swappedInInvocation || opt.name === swappedInInvocation);
      if (inv) {
        const prereq = 'prerequisiteDescription' in inv && inv.prerequisiteDescription ? ` [${inv.prerequisiteDescription}]` : '';
        addedTraits.push({
          id: `invocation-${inv.id}`,
          name: `Таинственное воззвание: ${inv.name}`,
          source: `Колдун (${newLevel} ур., замена: ${swappedOutInvocation})`,
          summary: inv.description,
          description: `${inv.name}${prereq}: ${inv.description} (заменено вместо «${swappedOutInvocation}»)`,
        });
      }
    }

    // Mystic Arcanum trait (Levels 11, 13, 15, 17)
    if (choicesConfig.needsMysticArcanum && selectedArcanumSpell) {
      const circle = choicesConfig.arcanumCircle || (newLevel === 11 ? 6 : newLevel === 13 ? 7 : newLevel === 15 ? 8 : 9);
      addedTraits.push({
        id: `mystic-arcanum-${circle}`,
        name: `Таинственный арканум (${circle} круг): ${selectedArcanumSpell}`,
        source: `Колдун (${newLevel} ур.)`,
        summary: `1 раз в день без ячейки заклинаний сотворяет «${selectedArcanumSpell}».`,
        description: `Вы можете сотворить это заклинание арканума один раз без траты ячейки заклинаний. Вы должны окончить продолжительный отдых, чтобы сделать это снова.`,
      });
    }

    // Fiend Resilience (Level 10 Fiend)
    if (choicesConfig.needsFiendResilience && selectedFiendResilience) {
      addedTraits.push({
        id: 'fiendish-resilience',
        name: `Стойкость исчадия (Сопротивление: ${selectedFiendResilience})`,
        source: `Колдун: Исчадие (${newLevel} ур.)`,
        summary: `Сопротивление урону типа «${selectedFiendResilience}».`,
        description: `Вы выбираете один тип урона при окончании короткого или продолжительного отдыха. Вы получаете сопротивление этому типу урона.`,
      });
    }

    // Genie Kind (Level 1 or missing)
    if (choicesConfig.needsGenieKind && selectedGenieKind) {
      const g = (choicesConfig.genieKindOptions || GENIE_KINDS_LIST).find(k => k.id === selectedGenieKind);
      if (g) {
        addedTraits.push({
          id: 'warlock-genie-kind',
          name: `Покровитель: Джинн (${g.name})`,
          source: `Колдун: Джинн (${newLevel} ур.)`,
          summary: `Стихия: ${g.element}. Урон: ${g.damageType}. Сосуд: ${g.vesselType}.`,
          description: `Вид джинна: ${g.name}. Стихия: ${g.element}. Дополнительный урон от «Гнева джинна»: ${g.damageType}. Сосуд джинна: ${g.vesselType}.`,
        });
      }
    }

    // Hunter archetype trait
    if (choicesConfig.needsHunterChoice && selectedHunterChoice) {
      const hOpt = choicesConfig.hunterOptions?.find(
        o => o.id === selectedHunterChoice
      );
      if (hOpt) {
        addedTraits.push({
          id: `hunter-${hOpt.id}`,
          name: `${choicesConfig.hunterChoiceTitle || 'Охотник'}: ${hOpt.name}`,
          source: `Следопыт: Охотник (${newLevel} ур.)`,
          summary: hOpt.description,
          description: `${hOpt.name}: ${hOpt.description}`,
        });
      }
    }

    // Totem archetype trait
    if (choicesConfig.needsTotemChoice && selectedTotemChoice) {
      const tOpt = choicesConfig.totemOptions?.find(
        o => o.id === selectedTotemChoice
      );
      if (tOpt) {
        addedTraits.push({
          id: `totem-${tOpt.id}`,
          name: `${choicesConfig.totemChoiceTitle || 'Тотем'}: ${tOpt.name}`,
          source: `Варвар: Тотемный воин (${newLevel} ур.)`,
          summary: tOpt.description,
          description: `${tOpt.name}: ${tOpt.description}`,
        });
      }
    }

    // Maneuvers traits
    if (choicesConfig.needsManeuvers && selectedManeuvers.length > 0) {
      for (const mId of selectedManeuvers) {
        const m = BATTLE_MASTER_MANEUVERS.find(opt => opt.id === mId);
        if (m) {
          addedTraits.push({
            id: `maneuver-${m.id}`,
            name: `Маневр: ${m.name}`,
            source: `Воин: Мастер боевых искусств (${newLevel} ур.)`,
            summary: m.description,
            description: `${m.name}: ${m.description}`,
          });
        }
      }
    }

    // Feat trait
    let featName: string | undefined = undefined;
    if (isASI && asiChoice === 'feat' && selectedFeat) {
      featName = selectedFeat.name;
      addedTraits.push({
        id: `feat-${newLevel}-${Math.random().toString(36).slice(2, 8)}`,
        name: selectedFeat.name,
        source: `Черта (${newLevel} ур.)`,
        summary: selectedFeat.summary,
        description: selectedFeat.description,
      });
    }

    // Spells: Auto-granted + Racial + User learned (deduplicated by name)
    const combinedSpells: { level: number; name: string; prepared: boolean }[] =
      [];
    const seenSpellNames = new Set<string>();

    for (const as of autoSpells) {
      const key = as.name.trim().toLowerCase();
      if (!seenSpellNames.has(key)) {
        seenSpellNames.add(key);
        combinedSpells.push({
          name: as.name.trim(),
          level: as.level,
          prepared: as.prepared,
        });
      }
    }

    for (const rf of racialFeatures) {
      if (selectedRacialFeatures[rf.name] && rf.spell) {
        const key = rf.spell.name.trim().toLowerCase();
        if (!seenSpellNames.has(key)) {
          seenSpellNames.add(key);
          combinedSpells.push({
            name: rf.spell.name.trim(),
            level: rf.spell.level,
            prepared: true,
          });
        }
      }
    }

    for (const ls of newSpells) {
      const key = ls.name.trim().toLowerCase();
      if (key && !seenSpellNames.has(key)) {
        seenSpellNames.add(key);
        combinedSpells.push({
          name: ls.name.trim(),
          level: ls.level,
          prepared: ls.prepared,
        });
      }
    }

    // Construct enriched notes
    let fullNotes = notes.trim();
    const extraNotes: string[] = [];
    if (choicesConfig.needsFightingStyle && selectedFightingStyle) {
      const fs = (choicesConfig.fightingStyleOptions || FIGHTING_STYLES).find(
        f => f.id === selectedFightingStyle
      );
      if (fs) extraNotes.push(`[Боевой стиль]: ${fs.name}`);
    }
    if (selectedExpertise.length > 0) {
      extraNotes.push(`[Компетентность]: ${selectedExpertise.join(', ')}`);
    }
    if (selectedMetamagic.length > 0) {
      const names = selectedMetamagic
        .map(id => METAMAGIC_OPTIONS.find(m => m.id === id)?.name || id)
        .join(', ');
      extraNotes.push(`[Метамагия]: ${names}`);
    }
    if (selectedInvocations.length > 0) {
      const names = selectedInvocations
        .map(id => ELDRITCH_INVOCATIONS.find(i => i.id === id)?.name || id)
        .join(', ');
      extraNotes.push(`[Воззвания]: ${names}`);
    }
    if (choicesConfig.needsHunterChoice && selectedHunterChoice) {
      const hOpt = choicesConfig.hunterOptions?.find(
        o => o.id === selectedHunterChoice
      );
      if (hOpt) {
        extraNotes.push(
          `[${choicesConfig.hunterChoiceTitle || 'Охотник'}]: ${hOpt.name}`
        );
      }
    }
    if (choicesConfig.needsTotemChoice && selectedTotemChoice) {
      const tOpt = choicesConfig.totemOptions?.find(
        o => o.id === selectedTotemChoice
      );
      if (tOpt) {
        extraNotes.push(
          `[${choicesConfig.totemChoiceTitle || 'Тотем'}]: ${tOpt.name}`
        );
      }
    }
    if (selectedManeuvers.length > 0) {
      const names = selectedManeuvers
        .map(id => BATTLE_MASTER_MANEUVERS.find(m => m.id === id)?.name || id)
        .join(', ');
      extraNotes.push(`[Маневры]: ${names}`);
    }
    if (choicesConfig.needsPactBoon && selectedPactBoon) {
      const pb = (choicesConfig.pactBoonOptions || WARLOCK_PACT_BOONS_LIST).find(b => b.id === selectedPactBoon);
      if (pb) extraNotes.push(`[Предмет договора]: ${pb.name}`);
      if (selectedPactBoon === 'tome' && selectedTomeCantrips.length > 0) {
        extraNotes.push(`[Заговоры Книги Теней]: ${selectedTomeCantrips.join(', ')}`);
      }
    }
    if (choicesConfig.needsMysticArcanum && selectedArcanumSpell) {
      extraNotes.push(`[Таинственный арканум (${choicesConfig.arcanumCircle || 6} круг)]: ${selectedArcanumSpell}`);
    }
    if (choicesConfig.canSwapInvocation && swappedOutInvocation && swappedInInvocation) {
      const inv = WARLOCK_INVOCATIONS.find(opt => opt.id === swappedInInvocation || opt.name === swappedInInvocation);
      extraNotes.push(`[Замена воззвания]: «${swappedOutInvocation}» ➔ «${inv?.name || swappedInInvocation}»`);
    }
    if (choicesConfig.needsFiendResilience && selectedFiendResilience) {
      extraNotes.push(`[Стойкость исчадия]: сопротивление «${selectedFiendResilience}»`);
    }
    if (choicesConfig.needsGenieKind && selectedGenieKind) {
      const g = (choicesConfig.genieKindOptions || GENIE_KINDS_LIST).find(k => k.id === selectedGenieKind);
      if (g) extraNotes.push(`[Покровитель джинн]: ${g.name}`);
    }

    // Scout Level 3: Survivalist (Nature + Survival proficiency and expertise)
    const isScoutLevel3 =
      normClass === 'Плут' &&
      newLevel === 3 &&
      (effectiveSubclass.toLowerCase().includes('скаут') ||
        effectiveSubclass.toLowerCase().includes('scout'));

    const scoutSkillProfs = isScoutLevel3 ? ['Природа', 'Выживание'] : [];
    const scoutSkillExpertise = isScoutLevel3 ? ['Природа', 'Выживание'] : [];
    if (isScoutLevel3) {
      extraNotes.push('[Мастер выживания]: Владение и компетентность в навыках «Природа» и «Выживание»');
    }

    // Saving Throw Proficiencies (Gloom Stalker Iron Mind, Rogue Slippery Mind, Monk Diamond Soul)
    const calculatedNewSavingThrowProfs: AbilityName[] = [];
    if (choicesConfig.needsSavingThrowProficiency && selectedSavingThrow) {
      calculatedNewSavingThrowProfs.push(selectedSavingThrow);
      extraNotes.push(`[Владение спасброском (${choicesConfig.savingThrowTitle || 'Умение'})]: ${ABILITY_FULL[selectedSavingThrow] || selectedSavingThrow}`);
    }
    if (normClass === 'Плут' && newLevel === 15) {
      if (!char.savingThrowProficiencies?.['МДР'] && !calculatedNewSavingThrowProfs.includes('МДР')) {
        calculatedNewSavingThrowProfs.push('МДР');
        extraNotes.push('[Скользкий разум]: Владение спасбросками Мудрости');
      }
    }
    if (normClass === 'Монах' && newLevel === 14) {
      const allAbilities: AbilityName[] = ['СИЛ', 'ЛОВ', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'];
      for (const a of allAbilities) {
        if (!char.savingThrowProficiencies?.[a] && !calculatedNewSavingThrowProfs.includes(a)) {
          calculatedNewSavingThrowProfs.push(a);
        }
      }
      extraNotes.push('[Алмазная душа]: Владение всеми спасбросками');
    }

    // Fey Wanderer Level 3: Otherworldly Glamour
    const feyWandererSkillProfs: string[] = [];
    if (choicesConfig.needsFeyWandererSkill && selectedFeyWandererSkill) {
      if (!char.skillProficiencies?.[selectedFeyWandererSkill]) {
        feyWandererSkillProfs.push(selectedFeyWandererSkill);
      }
      extraNotes.push(`[Потустороннее очарование]: Владение навыком «${selectedFeyWandererSkill}»`);
    }

    // Drakewarden Level 3: Draconic Gift
    let drakewardenProfText = '';
    const isDrakewardenLvl3 =
      normClass === 'Следопыт' &&
      newLevel === 3 &&
      (effectiveSubclass.toLowerCase().includes('дрейк') ||
        effectiveSubclass.toLowerCase().includes('дракон') ||
        effectiveSubclass.toLowerCase().includes('drake'));
    if (isDrakewardenLvl3) {
      drakewardenProfText = 'Язык: Драконий';
      extraNotes.push('[Драконий дар]: Язык Драконий');
    }

    if (extraNotes.length > 0) {
      fullNotes = fullNotes
        ? `${fullNotes}\n${extraNotes.join('\n')}`
        : extraNotes.join('\n');
    }

    const allNewCantrips = Array.from(new Set([
      ...newCantrips.filter(c => c.trim()),
      ...(choicesConfig.needsPactBoon && selectedPactBoon === 'tome' ? selectedTomeCantrips : [])
    ]));

    return {
      level: newLevel,
      hpGained: finalHP,
      asiAbilities:
        isASI && asiChoice === 'stats' && !isASIOverCap
          ? [asiAbility1, asiAbility2]
          : null,
      selectedFeat: featName,
      newSubclass:
        isSubclassChoice && chosenSubclass ? chosenSubclass : undefined,
      selectedFightingStyle:
        choicesConfig.needsFightingStyle && selectedFightingStyle
          ? selectedFightingStyle
          : undefined,
      addedTraits,
      spellSlotsGained: newSpellSlots || undefined,
      notes: fullNotes,
      newCantrips: allNewCantrips,
      newSpells: combinedSpells,
      newSavingThrowProfs: calculatedNewSavingThrowProfs,
      newSkillProfs: Array.from(new Set([...scoutSkillProfs, ...feyWandererSkillProfs])),
      newSkillExpertise: Array.from(new Set([...selectedExpertise, ...scoutSkillExpertise])),
      newAttacks: [],
      newProficienciesText: drakewardenProfText,
      newEquipmentText: '',
      pactBoon: choicesConfig.needsPactBoon ? selectedPactBoon : undefined,
      tomeCantrips: (choicesConfig.needsPactBoon && selectedPactBoon === 'tome') ? selectedTomeCantrips : undefined,
      warlockInvocations: choicesConfig.needsInvocations ? selectedInvocations : undefined,
      swappedOutInvocation: (choicesConfig.canSwapInvocation && swappedOutInvocation && swappedInInvocation) ? swappedOutInvocation : undefined,
      swappedInInvocation: (choicesConfig.canSwapInvocation && swappedOutInvocation && swappedInInvocation) ? swappedInInvocation : undefined,
      mysticArcanumSpell: choicesConfig.needsMysticArcanum ? selectedArcanumSpell : undefined,
      fiendResilienceDamageType: choicesConfig.needsFiendResilience ? selectedFiendResilience : undefined,
      genieKind: choicesConfig.needsGenieKind ? selectedGenieKind : undefined,
    };
  };

  return (
    <div
      className="fixed inset-0 parchment-modal-overlay z-[350] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="parchment-modal max-w-4xl w-[96vw] max-h-[92vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{ background: '#F5E6C8', border: '3px solid #C9A84C' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between flex-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.4)',
            background:
              'linear-gradient(180deg, rgba(232, 211, 162, 0.5) 0%, rgba(245, 230, 200, 0.25) 100%)',
          }}
        >
          <div>
            <h2
              className="text-lg sm:text-xl font-bold flex items-center gap-2"
              style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}
            >
              <D20Icon size={24} />
              <span>Повышение до {newLevel}-го уровня</span>
            </h2>
            <div
              className="flex items-center gap-3 text-xs mt-1"
              style={{ color: '#8B6914' }}
            >
              <span>
                {char.name || 'Персонаж'} —{' '}
                <strong>{char.className || 'Без класса'}</strong>{' '}
                {effectiveSubclass ? `(${effectiveSubclass})` : ''}
              </span>
              <span className="font-mono">
                Кость хитов: 1{diceNotation}
                {dieSize}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            title="Закрыть"
            className="parchment-remove-btn w-8 h-8 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 pr-3 sm:pr-6">
          {/* Proficiency Bonus Notification */}
          {profChanged && (
            <div
              className="p-2.5 rounded text-xs flex items-center gap-2.5"
              style={{
                background: 'rgba(230, 140, 20, 0.15)',
                border: '1px solid rgba(200, 120, 20, 0.4)',
                color: '#7C3E08',
              }}
            >
              <GoldSealCheckIcon size={20} />
              <div>
                <strong>Бонус мастерства увеличивается:</strong>{' '}
                {formatModifier(calcProficiencyBonus(char.level))} →{' '}
                <span className="font-bold text-sm">
                  {formatModifier(calcProficiencyBonus(newLevel))}
                </span>
                <div className="opacity-80 text-[11px]">
                  Автоматически увеличит все ваши профильные атаки, спасброски и
                  навыки.
                </div>
              </div>
            </div>
          )}

          {/* 1. HP Gain Section */}
          <div className="parchment-modal-section">
            <h3
              className="text-sm font-bold mb-2 flex items-center justify-between"
              style={{ color: '#3C2415' }}
            >
              <span className="flex items-center gap-1.5">
                <SparklesDndIcon size={16} />
                <span>Прирост хитов на {newLevel} уровне:</span>
              </span>
              <span
                className="text-sm font-extrabold"
                style={{ color: '#8B2500' }}
              >
                +{finalHP} HP
              </span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setHpMode('average')}
                className={
                  hpMode === 'average'
                    ? 'parchment-btn text-xs py-1'
                    : 'parchment-btn-secondary text-xs py-1'
                }
              >
                Среднее ({avgHP})
              </button>
              <button
                type="button"
                onClick={() => setHpMode('roll')}
                className={
                  hpMode === 'roll'
                    ? 'parchment-btn text-xs py-1'
                    : 'parchment-btn-secondary text-xs py-1'
                }
              >
                Бросок кубика (1{diceNotation}
                {dieSize})
              </button>
            </div>
            {hpMode === 'roll' && (
              <div
                className="flex flex-wrap items-center gap-2 p-2 rounded text-xs mb-2"
                style={{ background: 'rgba(232, 211, 162, 0.3)' }}
              >
                <button
                  type="button"
                  onClick={rollHpDie}
                  className="parchment-btn text-xs py-1 px-2.5 flex items-center gap-1 shrink-0"
                >
                  <D20Icon size={14} />
                  <span>
                    Бросить 1{diceNotation}
                    {dieSize}
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <label style={{ color: '#8B6914' }}>Выпало:</label>
                  <input
                    type="number"
                    min={1}
                    max={dieSize}
                    value={hpRoll}
                    onChange={e =>
                      setHpRoll(
                        Math.min(
                          dieSize,
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      )
                    }
                    className="parchment-input-boxed text-center w-16 text-xs"
                  />
                </div>
                <span style={{ color: '#8B6914' }}>
                  + мод. ТЕЛ ({formatModifier(conMod)}){' '}
                  {hasTough ? '+ Живучий (+2)' : ''}{' '}
                  {racialHPBonus > 0 ? '+ Дворф (+1)' : ''} ={' '}
                  <strong>{hpRoll + conMod + toughBonus + racialHPBonus}</strong>
                </span>
              </div>
            )}
            <div className="text-[11px]" style={{ color: '#6B3A2A' }}>
              Новый максимум здоровья:{' '}
              <strong>{(char.hpMax || 0) + finalHP} HP</strong>{' '}
              {hasTough ? '(включая +2 от «Живучий») ' : ''}
              {racialHPBonus > 0
                ? '(включая +1 от «Дворфская стойкость»)'
                : ''}
            </div>
          </div>

          {/* 2. Subclass Choice (if reaching subclass level and not yet chosen) */}
          {isSubclassChoice && availableSubclasses.length > 0 && (
            <div
              className="p-3.5 rounded-lg border space-y-2.5"
              style={{
                background: 'rgba(92, 58, 110, 0.08)',
                borderColor: '#8A5D9D',
              }}
            >
              <div className="flex items-center gap-2">
                <ScrollIcon size={18} />
                <h3 className="text-sm font-bold" style={{ color: '#5C3A6E' }}>
                  Выбор воинского пути / Архетипа ({newLevel} уровень):
                </h3>
              </div>
              <p className="text-xs" style={{ color: '#5C3A6E' }}>
                Ваш класс <strong>{char.className}</strong> открывает выбор
                специализации на {newLevel} уровне. Выберите архетип:
              </p>
              <select
                value={chosenSubclass}
                onChange={e => setChosenSubclass(e.target.value)}
                className="parchment-select w-full font-bold text-xs"
              >
                {availableSubclasses.map(sc => (
                  <option key={sc.id} value={sc.name}>
                    {sc.name} ({sc.nameEn}) — {sc.source || 'PHB'}
                  </option>
                ))}
              </select>
              {availableSubclasses.find(s => s.name === chosenSubclass) && (
                <div
                  className="p-2 rounded text-[11px] leading-relaxed"
                  style={{
                    background: 'rgba(245, 230, 200, 0.75)',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    color: '#3D2012',
                  }}
                >
                  <p className="font-semibold mb-1">
                    {
                      availableSubclasses.find(s => s.name === chosenSubclass)
                        ?.description
                    }
                  </p>
                  {availableSubclasses
                    .find(s => s.name === chosenSubclass)
                    ?.features?.filter(f => f.level <= newLevel)
                    .map(feat => (
                      <div
                        key={feat.name}
                        className="text-[10px] mt-1 border-t pt-1"
                        style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}
                      >
                        <strong>{feat.name}: </strong>
                        {feat.description}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Class Features at this level */}
          {classFeatures.length > 0 && (
            <div className="parchment-modal-section space-y-2">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <CrossedSwordsIcon size={16} />
                  <span>Классовые умения {newLevel}-го уровня:</span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>
                  Отмеченные умения добавятся в особенности листа
                </span>
              </div>
              <div className="space-y-2">
                {classFeatures.map(f => (
                  <div
                    key={f.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedFeatures[f.name]
                        ? 'rgba(232, 211, 162, 0.45)'
                        : 'rgba(232, 211, 162, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedFeatures[f.name]}
                          onChange={() => toggleFeature(f.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-bold text-xs block"
                          style={{ color: '#3D2012' }}
                        >
                          {f.name}
                        </span>
                        <p
                          className="text-[11px] mt-0.5 leading-relaxed"
                          style={{ color: '#6B3A2A' }}
                        >
                          {f.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Subclass Features at this level */}
          {!isSubclassChoice && subclassFeatures.length > 0 && (
            <div
              className="parchment-modal-section space-y-2"
              style={{
                background: 'rgba(92, 58, 110, 0.08)',
                borderColor: 'rgba(138, 93, 157, 0.4)',
              }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#5C3A6E' }}
                >
                  <ScrollIcon size={16} />
                  <span>
                    Умения архетипа ({effectiveSubclass}, {newLevel} ур.):
                  </span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>
                  Особенности вашей специализации
                </span>
              </div>
              <div className="space-y-2">
                {subclassFeatures.map(sf => (
                  <div
                    key={sf.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedFeatures[sf.name]
                        ? 'rgba(232, 211, 162, 0.45)'
                        : 'rgba(232, 211, 162, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedFeatures[sf.name]}
                          onChange={() => toggleFeature(sf.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-bold text-xs block"
                          style={{ color: '#3D2012' }}
                        >
                          {sf.name}
                        </span>
                        <p
                          className="text-[11px] mt-0.5 leading-relaxed"
                          style={{ color: '#6B3A2A' }}
                        >
                          {sf.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Racial Progression at this level */}
          {racialFeatures.length > 0 && (
            <div
              className="parchment-modal-section space-y-2"
              style={{
                background: 'rgba(201, 168, 76, 0.12)',
                border: '1px solid rgba(201, 168, 76, 0.45)',
              }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#5C341F' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>
                    Расовое развитие ({char.race || 'Раса'}
                    {char.subrace ? ` — ${char.subrace}` : ''}, {newLevel} ур.):
                  </span>
                </h3>
                <span className="text-[10px]" style={{ color: '#8B6914' }}>
                  Врождённая магия и масштабирование
                </span>
              </div>
              <div className="space-y-2">
                {racialFeatures.map(rf => (
                  <div
                    key={rf.name}
                    className="p-2.5 rounded text-xs transition-colors"
                    style={{
                      background: selectedRacialFeatures[rf.name]
                        ? 'rgba(232, 211, 162, 0.55)'
                        : 'rgba(232, 211, 162, 0.2)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <label className="parchment-checkbox parchment-checkbox-sm mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!selectedRacialFeatures[rf.name]}
                          onChange={() => toggleRacialFeature(rf.name)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold text-xs"
                            style={{ color: '#3D2012' }}
                          >
                            {rf.name}
                          </span>
                          {rf.spell && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono"
                              style={{
                                background: '#E8D3A2',
                                color: '#5C341F',
                                border: '1px solid #C9A84C',
                              }}
                            >
                              Заклинание {rf.spell.level} круга
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] mt-0.5 leading-relaxed"
                          style={{ color: '#6B3A2A' }}
                        >
                          {rf.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Interactive Level-Up Choices */}

          {/* 6.a. Fighting Style Choice */}
          {choicesConfig.needsFightingStyle && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <CrossedSwordsIcon size={16} />
                  <span>Выбор боевого стиля ({newLevel} ур.):</span>
                </h3>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: selectedFightingStyle ? '#4a7c3f' : '#8B2500',
                  }}
                >
                  {selectedFightingStyle ? 'Стиль выбран' : 'Требуется выбор'}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#6B3A2A' }}>
                Выберите специализацию владения оружием или защитой:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.fightingStyleOptions || []).map(fs => {
                  const isSel = selectedFightingStyle === fs.id;
                  return (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setSelectedFightingStyle(fs.id)}
                      className="text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5 cursor-pointer"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {fs.name}{' '}
                          <span className="font-normal opacity-75">
                            ({fs.nameEn})
                          </span>
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={18} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {fs.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.b. Expertise Choice */}
          {choicesConfig.needsExpertise && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <GoldSealCheckIcon size={16} />
                  <span>Выбор навыков для Компетентности (Экспертизы):</span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#E8D3A2',
                    border: '1px solid #C9A84C',
                    color: '#5C341F',
                  }}
                >
                  Выбрано {selectedExpertise.length} из{' '}
                  {choicesConfig.expertiseCount || 2}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#6B3A2A' }}>
                Бонус мастерства удваивается для выбранных навыков:
              </p>
              {(choicesConfig.eligibleSkills || []).length === 0 ? (
                <p
                  className="text-xs italic p-2 rounded"
                  style={{
                    background: 'rgba(201, 168, 76, 0.15)',
                    color: '#8B6914',
                  }}
                >
                  Нет доступных навыков с владением без уже имеющейся
                  компетентности.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(choicesConfig.eligibleSkills || []).map(skill => {
                    const isSel = selectedExpertise.includes(skill);
                    const canSelect =
                      isSel ||
                      selectedExpertise.length <
                        (choicesConfig.expertiseCount || 2);
                    return (
                      <button
                        key={skill}
                        type="button"
                        disabled={!canSelect}
                        onClick={() => {
                          if (isSel) {
                            setSelectedExpertise(prev =>
                              prev.filter(s => s !== skill)
                            );
                          } else {
                            if (
                              selectedExpertise.length <
                              (choicesConfig.expertiseCount || 2)
                            ) {
                              setSelectedExpertise(prev => [...prev, skill]);
                            }
                          }
                        }}
                        className="p-2 rounded text-xs flex items-center justify-between transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: isSel
                            ? 'rgba(232, 211, 162, 0.75)'
                            : 'rgba(232, 211, 162, 0.25)',
                          border: isSel
                            ? '2px solid #C9A84C'
                            : '1px solid rgba(201, 168, 76, 0.4)',
                          color: '#3D2012',
                        }}
                      >
                        <span className="font-semibold text-xs truncate mr-1">
                          {skill}
                        </span>
                        <span className="text-sm shrink-0">
                          {isSel ? '⭐' : '☆'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6.c. Metamagic Choice */}
          {choicesConfig.needsMetamagic && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>Выбор опций Метамагии:</span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#E8D3A2',
                    border: '1px solid #C9A84C',
                    color: '#5C341F',
                  }}
                >
                  Выбрано {selectedMetamagic.length} из{' '}
                  {choicesConfig.metamagicCount || 1}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.metamagicOptions || []).map(opt => {
                  const isSel = selectedMetamagic.includes(opt.id);
                  const canSelect =
                    isSel ||
                    selectedMetamagic.length <
                      (choicesConfig.metamagicCount || 1);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => {
                        if (isSel) {
                          setSelectedMetamagic(prev =>
                            prev.filter(id => id !== opt.id)
                          );
                        } else {
                          setSelectedMetamagic(prev => [...prev, opt.id]);
                        }
                      }}
                      className="text-left p-2.5 rounded-lg transition-all flex flex-col justify-between gap-1 disabled:opacity-40"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {opt.name}
                        </span>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: '#E8D3A2', color: '#5C341F' }}
                        >
                          {opt.cost}
                        </span>
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Warlock Pact Boon (3rd Level) ── */}
          {choicesConfig.needsPactBoon && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <CrossedSwordsIcon size={16} />
                  <span>Предмет договора колдуна (Pact Boon):</span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#5C341F',
                    color: '#FFE58F',
                  }}
                >
                  3-й уровень
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#8B6914' }}>
                Ваш покровитель одаряет вас особым магическим даром в знак верности и служения (dnd.su):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.pactBoonOptions || WARLOCK_PACT_BOONS_LIST).map(boon => {
                  const isSel = selectedPactBoon === boon.id;
                  return (
                    <button
                      key={boon.id}
                      type="button"
                      onClick={() => setSelectedPactBoon(boon.id)}
                      className={`text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSel ? 'shadow-md scale-[1.01]' : 'hover:bg-[rgba(201,168,76,0.18)]'
                      }`}
                      style={
                        isSel
                          ? { background: '#E8D3A2', border: '2px solid #5C341F', color: '#3D2012' }
                          : { background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(139, 105, 20, 0.3)', color: '#4A2A18' }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: isSel ? '#3D2012' : '#5C341F' }}>
                          {boon.name}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={16} />
                        ) : (
                          <span className="text-[10px] opacity-70 italic">{boon.nameEn}</span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{boon.description}</p>
                      <div className="text-[10px] pt-1.5 border-t border-[rgba(201,168,76,0.3)] space-y-0.5">
                        {boon.features.slice(0, 2).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="text-[#8B6914]">✦</span>
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* If Tome is selected: 3 cantrips picker from any class */}
              {selectedPactBoon === 'tome' && (
                <div
                  className="p-3 rounded-lg space-y-2 mt-2"
                  style={{
                    background: 'rgba(251, 240, 220, 0.9)',
                    border: '1px solid rgba(201, 168, 76, 0.5)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3D2012]">
                      📖 Заговоры «Книги Теней» (выберите 3 заговора из любых классов):
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold"
                      style={{
                        background: selectedTomeCantrips.length === 3 ? '#5C341F' : '#E8D3A2',
                        color: selectedTomeCantrips.length === 3 ? '#FFE58F' : '#5C341F',
                      }}
                    >
                      {selectedTomeCantrips.length} / 3
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 custom-scrollbar">
                    {DND_COMPENDIUM_SPELLS.filter(s => s.level === 0).map(cantrip => {
                      const isAlreadyKnown =
                        baseKnownSpells.has(normalizeSpellName(cantrip.name)) ||
                        newCantrips.some(c => normalizeSpellName(c) === normalizeSpellName(cantrip.name));
                      const isChosen = selectedTomeCantrips.includes(cantrip.name);
                      return (
                        <button
                          key={cantrip.name}
                          type="button"
                          onClick={() => {
                            if (isAlreadyKnown) return;
                            if (isChosen) {
                              setSelectedTomeCantrips(prev => prev.filter(n => n !== cantrip.name));
                            } else if (selectedTomeCantrips.length < 3) {
                              setSelectedTomeCantrips(prev => [...prev, cantrip.name]);
                            }
                          }}
                          disabled={isAlreadyKnown || (!isChosen && selectedTomeCantrips.length >= 3)}
                          title={isAlreadyKnown ? 'Этот заговор уже изучен вашим персонажем' : undefined}
                          className={`text-left px-2 py-1.5 rounded text-[11px] transition-all flex items-center justify-between ${
                            isChosen
                              ? 'font-bold'
                              : isAlreadyKnown
                                ? 'opacity-40 cursor-not-allowed line-through'
                                : 'disabled:opacity-40'
                          }`}
                          style={
                            isChosen
                              ? { background: '#E8D3A2', border: '1px solid #5C341F', color: '#3D2012' }
                              : isAlreadyKnown
                                ? { background: 'rgba(200, 180, 160, 0.3)', border: '1px solid rgba(139, 105, 20, 0.15)', color: '#7A6B60' }
                                : { background: 'rgba(245, 230, 200, 0.6)', border: '1px solid rgba(139, 105, 20, 0.25)', color: '#4A2A18' }
                          }
                        >
                          <span className="truncate mr-1">{cantrip.name}</span>
                          <span className="shrink-0 text-[10px] opacity-70">
                            {isAlreadyKnown ? 'уже изучен' : cantrip.classes?.[0] || 'заговор'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6.d. Eldritch Invocations Choice */}
          {choicesConfig.needsInvocations && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <SpellbookIcon size={16} />
                  <span>
                    Выбор Таинственных воззваний (Eldritch Invocations):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#E8D3A2',
                    border: '1px solid #C9A84C',
                    color: '#5C341F',
                  }}
                >
                  Выбрано {selectedInvocations.length} из{' '}
                  {choicesConfig.invocationsCount || 1}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.invocationsOptions || []).map(opt => {
                  const isSel = selectedInvocations.includes(opt.id);
                  const canSelect =
                    isSel ||
                    selectedInvocations.length <
                      (choicesConfig.invocationsCount || 1);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => {
                        if (isSel) {
                          setSelectedInvocations(prev =>
                            prev.filter(id => id !== opt.id)
                          );
                        } else {
                          setSelectedInvocations(prev => [...prev, opt.id]);
                        }
                      }}
                      className="text-left p-2.5 rounded-lg transition-all flex flex-col justify-between gap-1 disabled:opacity-40"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {opt.name}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={16} />
                        ) : (
                          <span className="text-[10px] opacity-75 font-mono">
                            Треб. {opt.levelReq} ур.
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Invocation Swapping (Level 3+) ── */}
          {choicesConfig.canSwapInvocation && choicesConfig.existingInvocations && choicesConfig.existingInvocations.length > 0 && (
            <div
              className="parchment-modal-section space-y-2.5 p-3 rounded-lg"
              style={{
                background: 'rgba(232, 211, 162, 0.25)',
                border: '1px solid rgba(201, 168, 76, 0.4)',
              }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#3D2012] flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>Замена одного воззвания (опционально по dnd.su):</span>
                </h4>
                <span className="text-[10px] text-[#8B6914] italic">При повышении уровня</span>
              </div>
              <p className="text-[11px] text-[#5C341F]">
                Вы можете заменить одно из известных вам таинственных воззваний на другое доступное воззвание:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#3D2012] block mb-1">Забыть воззвание:</label>
                  <select
                    value={swappedOutInvocation}
                    onChange={e => {
                      setSwappedOutInvocation(e.target.value);
                      if (!e.target.value) setSwappedInInvocation('');
                    }}
                    className="parchment-select w-full text-xs py-1.5 px-2"
                  >
                    <option value="">-- Не заменять --</option>
                    {choicesConfig.existingInvocations.map(invName => (
                      <option key={invName} value={invName}>
                        {invName}
                      </option>
                    ))}
                  </select>
                </div>
                {swappedOutInvocation && (
                  <div>
                    <label className="text-[10px] font-bold text-[#3D2012] block mb-1">Изучить взамен:</label>
                    <select
                      value={swappedInInvocation}
                      onChange={e => setSwappedInInvocation(e.target.value)}
                      className="parchment-select w-full text-xs py-1.5 px-2"
                    >
                      <option value="">-- Выберите новое воззвание --</option>
                      {(choicesConfig.invocationsOptions || WARLOCK_INVOCATIONS)
                        .filter(opt => !selectedInvocations.includes(opt.id) && opt.name !== swappedOutInvocation)
                        .map(opt => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.levelReq} ур.)
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Warlock Mystic Arcanum (Levels 11, 13, 15, 17) ── */}
          {choicesConfig.needsMysticArcanum && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <CrystalBallDndIcon size={16} />
                  <span>
                    Таинственный арканум ({choicesConfig.arcanumCircle || 6}-й круг):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{ background: '#5C341F', color: '#FFE58F' }}
                >
                  1 заклинание
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#8B6914' }}>
                Ваш покровитель дарует вам доступ к великой магии. Выберите одно заклинание {choicesConfig.arcanumCircle || 6}-го круга, которое вы сможете сотворять один раз в день без ячейки заклинаний (dnd.su):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(choicesConfig.arcanumOptions || []).map(spellName => {
                  const isSel = selectedArcanumSpell === spellName;
                  const spellData = DND_COMPENDIUM_SPELLS.find(s => s.name.toLowerCase() === spellName.toLowerCase());
                  return (
                    <button
                      key={spellName}
                      type="button"
                      onClick={() => setSelectedArcanumSpell(spellName)}
                      className={`text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                        isSel ? 'shadow-md scale-[1.01]' : 'hover:bg-[rgba(201,168,76,0.18)]'
                      }`}
                      style={
                        isSel
                          ? { background: '#E8D3A2', border: '2px solid #5C341F', color: '#3D2012' }
                          : { background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(139, 105, 20, 0.3)', color: '#4A2A18' }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: isSel ? '#3D2012' : '#5C341F' }}>
                          {spellName}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={16} />
                        ) : (
                          <span className="text-[10px] opacity-75 font-mono">
                            {spellData?.school || 'Арканум'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2 opacity-90">
                        {spellData?.description || 'Могущественное заклинание великой магии.'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Warlock The Fiend: Fiendish Resilience (Level 10) ── */}
          {choicesConfig.needsFiendResilience && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <span>🛡️</span>
                  <span>Стойкость исчадия (10-й уровень):</span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{ background: '#5C341F', color: '#FFE58F' }}
                >
                  Сопротивление
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#8B6914' }}>
                Выберите тип урона, к которому вы получаете сопротивление. Вы можете менять его в конце короткого или продолжительного отдыха (dnd.su):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(choicesConfig.fiendResilienceOptions || []).map(dt => {
                  const isSel = selectedFiendResilience === dt;
                  return (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setSelectedFiendResilience(dt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSel ? 'shadow-md scale-105' : 'hover:bg-[rgba(201,168,76,0.18)]'
                      }`}
                      style={
                        isSel
                          ? { background: '#5C341F', color: '#FFE58F', border: '1px solid #C9A84C' }
                          : { background: 'rgba(245, 230, 200, 0.75)', color: '#3D2012', border: '1px solid rgba(139, 105, 20, 0.3)' }
                      }
                    >
                      {dt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Warlock Genie Kind (if needed) ── */}
          {choicesConfig.needsGenieKind && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3C2415' }}>
                  <span>🏺</span>
                  <span>Вид джинна-покровителя (Джинн):</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold" style={{ background: '#5C341F', color: '#FFE58F' }}>
                  Покровитель
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {GENIE_KINDS_LIST.map(g => {
                  const isSel = selectedGenieKind === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGenieKind(g.id)}
                      className={`p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSel ? 'shadow-md scale-[1.01]' : 'hover:bg-[rgba(201,168,76,0.18)]'
                      }`}
                      style={
                        isSel
                          ? { background: '#E8D3A2', border: '2px solid #5C341F', color: '#3D2012' }
                          : { background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(139, 105, 20, 0.3)', color: '#4A2A18' }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: isSel ? '#3D2012' : '#5C341F' }}>
                          {g.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: '#5C341F', color: '#FFE58F' }}>
                          {g.damageType}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5C341F] space-y-0.5">
                        <div><strong>Стихия:</strong> {g.element}</div>
                        <div className="text-[10px] opacity-90"><strong>Сосуд:</strong> {g.vesselType}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.e. Archetype Choices: Hunter */}
          {choicesConfig.needsHunterChoice && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <CrossedSwordsIcon size={16} />
                  <span>
                    {choicesConfig.hunterChoiceTitle || 'Выбор Охотника'} (
                    {newLevel} ур.):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: selectedHunterChoice ? '#4a7c3f' : '#8B2500',
                  }}
                >
                  {selectedHunterChoice ? 'Выбрано' : 'Требуется выбор'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.hunterOptions || []).map(opt => {
                  const isSel = selectedHunterChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedHunterChoice(opt.id)}
                      className="text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {opt.name}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={18} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.f. Archetype Choices: Totem */}
          {choicesConfig.needsTotemChoice && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>
                    {choicesConfig.totemChoiceTitle || 'Выбор тотема'} (
                    {newLevel} ур.):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: selectedTotemChoice ? '#4a7c3f' : '#8B2500',
                  }}
                >
                  {selectedTotemChoice ? 'Выбрано' : 'Требуется выбор'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(choicesConfig.totemOptions || []).map(opt => {
                  const isSel = selectedTotemChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedTotemChoice(opt.id)}
                      className="text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {opt.name}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={18} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.g. Archetype Choices: Maneuvers */}
          {choicesConfig.needsManeuvers && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <CrossedSwordsIcon size={16} />
                  <span>Выбор Маневров (Battle Master Maneuvers):</span>
                </h3>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#E8D3A2',
                    border: '1px solid #C9A84C',
                    color: '#5C341F',
                  }}
                >
                  Выбрано {selectedManeuvers.length} из{' '}
                  {choicesConfig.maneuverCount || 3}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.maneuverOptions || []).map(opt => {
                  const isSel = selectedManeuvers.includes(opt.id);
                  const canSelect =
                    isSel ||
                    selectedManeuvers.length <
                      (choicesConfig.maneuverCount || 3);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => {
                        if (isSel) {
                          setSelectedManeuvers(prev =>
                            prev.filter(id => id !== opt.id)
                          );
                        } else {
                          setSelectedManeuvers(prev => [...prev, opt.id]);
                        }
                      }}
                      className="text-left p-2.5 rounded-lg transition-all flex flex-col justify-between gap-1 disabled:opacity-40"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {opt.name}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={16} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.h. Saving Throw Proficiency Choice (e.g. Gloom Stalker Iron Mind) */}
          {choicesConfig.needsSavingThrowProficiency && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <D20Icon size={16} />
                  <span>
                    {choicesConfig.savingThrowTitle || 'Владение спасброском'} ({newLevel} ур.):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: selectedSavingThrow ? '#4a7c3f' : '#8B2500',
                  }}
                >
                  {selectedSavingThrow ? `Выбрано: ${ABILITY_FULL[selectedSavingThrow] || selectedSavingThrow}` : 'Требуется выбор'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(choicesConfig.savingThrowOptions || []).map(abil => {
                  const isSel = selectedSavingThrow === abil;
                  return (
                    <button
                      key={abil}
                      type="button"
                      onClick={() => setSelectedSavingThrow(abil)}
                      className="text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          Спасбросок: {ABILITY_FULL[abil] || abil} ({abil})
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={18} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        Вы получаете владение спасбросками этой характеристики, добавляя бонус мастерства.
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6.i. Fey Wanderer Skill Choice */}
          {choicesConfig.needsFeyWandererSkill && (
            <div className="parchment-modal-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>
                    Потустороннее очарование: Выбор навыка ({newLevel} ур.):
                  </span>
                </h3>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: selectedFeyWandererSkill ? '#4a7c3f' : '#8B2500',
                  }}
                >
                  {selectedFeyWandererSkill ? `Выбрано: ${selectedFeyWandererSkill}` : 'Требуется выбор'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(choicesConfig.feyWandererSkillOptions || []).map(skillName => {
                  const isSel = selectedFeyWandererSkill === skillName;
                  return (
                    <button
                      key={skillName}
                      type="button"
                      onClick={() => setSelectedFeyWandererSkill(skillName)}
                      className="text-left p-3 rounded-lg transition-all flex flex-col justify-between gap-1.5"
                      style={{
                        background: isSel
                          ? 'rgba(232, 211, 162, 0.7)'
                          : 'rgba(232, 211, 162, 0.25)',
                        border: isSel
                          ? '2px solid #C9A84C'
                          : '1px solid rgba(201, 168, 76, 0.4)',
                        boxShadow: isSel
                          ? '0 0 10px rgba(201, 168, 76, 0.4)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#3D2012' }}
                        >
                          {skillName}
                        </span>
                        {isSel ? (
                          <GoldSealCheckIcon size={18} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#C9A84C]/60" />
                        )}
                      </div>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: '#5C341F' }}
                      >
                        Владение навыком на выбор странника фей.
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Auto-Granted Spells Block */}
          {autoSpells.length > 0 && (
            <div
              className="p-3.5 rounded-lg border space-y-2"
              style={{
                background: 'rgba(232, 211, 162, 0.35)',
                borderColor: '#C9A84C',
              }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3D2012' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>
                    ✨ Подготовленные заклинания архетипа и расы (автоматически
                    добавлены):
                  </span>
                </h3>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                  style={{
                    background: '#E8D3A2',
                    border: '1px solid #C9A84C',
                    color: '#5C341F',
                  }}
                >
                  +{autoSpells.length}{' '}
                  {autoSpells.length === 1
                    ? 'заклинание'
                    : autoSpells.length < 5
                      ? 'заклинания'
                      : 'заклинаний'}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: '#6B3A2A' }}>
                Эти заклинания дарованы вашей священной клятвой, божественным
                доменом, кругом, расой или боевой карой. Они всегда подготовлены
                и не занимают лимит подготавливаемых заклинаний.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {autoSpells.map(s => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded text-xs flex flex-col justify-between gap-1.5"
                    style={{
                      background: 'rgba(245, 230, 200, 0.75)',
                      border: '1px solid rgba(201, 168, 76, 0.5)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className="font-bold text-xs"
                        style={{ color: '#3D2012' }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
                        style={{
                          background: '#E8D3A2',
                          border: '1px solid #C9A84C',
                          color: '#5C341F',
                        }}
                      >
                        {s.level > 0 ? `${s.level} круг` : 'Заговор'}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between text-[10px] pt-1 border-t"
                      style={{
                        borderColor: 'rgba(201, 168, 76, 0.3)',
                        color: '#8B6914',
                      }}
                    >
                      <span className="truncate max-w-[140px] sm:max-w-[160px]">
                        {s.source}
                      </span>
                      <span
                        className="font-semibold text-[10px]"
                        style={{ color: '#4a7c3f' }}
                      >
                        {s.isRacial ? '1 раз в день' : 'Всегда подготовлено'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ASI or Feat Choice */}
          {isASI && (
            <div className="parchment-modal-section space-y-3">
              <div className="flex items-center justify-between">
                <h3
                  className="text-sm font-bold flex items-center gap-1.5"
                  style={{ color: '#3C2415' }}
                >
                  <SparklesDndIcon size={16} />
                  <span>Улучшение характеристик (ASI) или Черта:</span>
                </h3>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: '#8B6914' }}
                >
                  Уровень {newLevel}
                </span>
              </div>

              {/* Tabs: Stats vs Feat */}
              <div
                className="flex gap-2 border-b pb-2"
                style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
              >
                <button
                  type="button"
                  onClick={() => setAsiChoice('stats')}
                  className={
                    asiChoice === 'stats'
                      ? 'parchment-btn text-xs py-1 px-3 font-bold flex items-center gap-1.5'
                      : 'parchment-btn-secondary text-xs py-1 px-3 flex items-center gap-1.5'
                  }
                >
                  <ScrollIcon size={14} />
                  <span>Характеристики (+2 или +1/+1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAsiChoice('feat')}
                  className={
                    asiChoice === 'feat'
                      ? 'parchment-btn text-xs py-1 px-3 font-bold flex items-center gap-1.5'
                      : 'parchment-btn-secondary text-xs py-1 px-3 flex items-center gap-1.5'
                  }
                >
                  <CrossedSwordsIcon size={14} />
                  <span>Выбрать черту (Feat)</span>
                </button>
              </div>

              {asiChoice === 'stats' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="parchment-label text-xs">
                      Первая характеристика +1:
                    </label>
                    <select
                      value={asiAbility1}
                      onChange={e =>
                        setAsiAbility1(e.target.value as AbilityName)
                      }
                      className="parchment-select text-xs w-full"
                    >
                      {ABILITY_NAMES.map(a => (
                        <option key={a} value={a}>
                          {ABILITY_FULL[a]} ({getTotalScore(char, a)} →{' '}
                          {getTotalScore(char, a) + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="parchment-label text-xs">
                      Вторая характеристика +1:
                    </label>
                    <select
                      value={asiAbility2}
                      onChange={e =>
                        setAsiAbility2(e.target.value as AbilityName)
                      }
                      className="parchment-select text-xs w-full"
                    >
                      {ABILITY_NAMES.map(a => (
                        <option key={a} value={a}>
                          {ABILITY_FULL[a]} ({getTotalScore(char, a)} →{' '}
                          {getTotalScore(char, a) + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p
                    className="col-span-full text-[11px]"
                    style={{ color: '#8B6914' }}
                  >
                    * Если выбрать одну и ту же характеристику в обоих полях, она
                    получит +2.
                  </p>
                  {isASIOverCap && (
                    <div
                      className="col-span-full p-2.5 rounded text-xs font-bold flex items-center gap-2"
                      style={{
                        background: 'rgba(139, 37, 0, 0.12)',
                        border: '1px solid rgba(139, 37, 0, 0.35)',
                        color: '#8B2500',
                      }}
                    >
                      <HourglassIcon size={16} />
                      <span>
                        Значение характеристики не может превышать 20 при
                        стандартном повышении (PHB 5e). Выберите другую
                        характеристику.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <label className="parchment-label text-xs">
                    Выберите официальную черту D&D 5e:
                  </label>
                  <select
                    value={selectedFeatId}
                    onChange={e => setSelectedFeatId(e.target.value)}
                    className="parchment-select text-xs w-full font-bold"
                  >
                    {allFeats.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.nameEn}){' '}
                        {f.abilityBonus ? `[+1 к ${f.abilityBonus}]` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedFeat && (
                    <div
                      className="p-2.5 rounded text-xs space-y-1"
                      style={{
                        background: 'rgba(232, 211, 162, 0.4)',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      <div
                        className="font-bold text-sm"
                        style={{ color: '#3D2012' }}
                      >
                        {selectedFeat.name}
                      </div>
                      <div
                        className="text-[11px] font-medium"
                        style={{ color: '#8B6914' }}
                      >
                        {selectedFeat.summary}
                      </div>
                      <div
                        className="text-[11px] leading-relaxed whitespace-pre-line pt-1 border-t border-amber-900/10"
                        style={{ color: '#5C341F' }}
                      >
                        {selectedFeat.description}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 9. Spellcasting Progression & Spell Learning (Only for spellcasters) */}
          {hasSpellSlots && (
            <div className="parchment-modal-section space-y-2">
              <h3
                className="text-sm font-bold flex items-center gap-1.5"
                style={{ color: '#3C2415' }}
              >
                <SparklesDndIcon size={16} />
                <span>Магия и ячейки заклинаний:</span>
              </h3>
              {unlockedCircle && (
                <div
                  className="p-2 rounded text-xs font-bold flex items-center gap-2"
                  style={{
                    background: 'rgba(92, 58, 110, 0.12)',
                    border: '1px solid #8A5D9D',
                    color: '#5C3A6E',
                  }}
                >
                  <CrystalBallDndIcon size={18} />
                  <span>
                    Поздравляем! Открыт доступ к заклинаниям {unlockedCircle}
                    -го круга!
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(newSpellSlots || {}).map(([circle, count]) => (
                  <span
                    key={circle}
                    className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
                    style={{
                      background: '#E8D3A2',
                      border: '1px solid #C9A84C',
                      color: '#5C341F',
                    }}
                  >
                    {circle} круг: {count}{' '}
                    {count === 1
                      ? 'ячейка'
                      : count < 5
                        ? 'ячейки'
                        : 'ячеек'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 9.b. New Cantrips (only if class gains new selectable cantrips at this level) */}
          {selectableCantripsGained > 0 && (
            <div className="parchment-modal-section space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3
                    className="text-sm font-bold flex items-center gap-1.5"
                    style={{ color: '#3C2415' }}
                  >
                    <SparklesDndIcon size={16} />
                    <span>Новые заговоры:</span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-[11px] font-mono font-bold" style={{ color: '#5C341F' }}>
                      +{selectableCantripsGained}{' '}
                      {selectableCantripsGained === 1
                        ? 'новый заговор'
                        : selectableCantripsGained < 5
                          ? 'новых заговора'
                          : 'новых заговоров'}{' '}
                      (по таблице класса на {newLevel}-м ур.{autoCantripsCount > 0 ? ` + ${autoCantripsCount} авт.: ${autoSpells.filter(s => s.level === 0).map(s => s.name).join(', ')}` : ''})
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                      style={{
                        background:
                          newCantrips.filter(c => c.trim()).length >= selectableCantripsGained
                            ? 'rgba(74, 124, 63, 0.15)'
                            : 'rgba(139, 37, 0, 0.12)',
                        color:
                          newCantrips.filter(c => c.trim()).length >= selectableCantripsGained
                            ? '#4a7c3f'
                            : '#8B2500',
                        border: `1px solid ${
                          newCantrips.filter(c => c.trim()).length >= selectableCantripsGained
                            ? 'rgba(74, 124, 63, 0.35)'
                            : 'rgba(139, 37, 0, 0.35)'
                        }`,
                      }}
                    >
                      Выбрано {newCantrips.filter(c => c.trim()).length} из {selectableCantripsGained}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCantripRow}
                  className="parchment-btn-sm font-bold shrink-0"
                  style={{ color: '#4a7c3f' }}
                >
                  + Заговор
                </button>
              </div>
              {newCantrips.length === 0 ? (
                <p
                  className="text-xs italic"
                  style={{ color: '#8B6914' }}
                >
                  Нажмите «+ Заговор», чтобы выбрать положенный заговор для персонажа.
                </p>
              ) : (
                <div className="space-y-2">
                  {newCantrips.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg border"
                      style={{
                        background: 'rgba(245, 230, 200, 0.65)',
                        borderColor: 'rgba(201, 168, 76, 0.45)',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        {customCantrips[i] ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={c}
                              onChange={e => updateCantripRow(i, e.target.value)}
                              placeholder="Название заговора вашего класса…"
                              className="w-full parchment-input-boxed text-xs py-1 px-2.5"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => toggleCustomCantrip(i, false)}
                              className="parchment-btn-secondary text-[11px] py-1 px-2 shrink-0"
                              title="Вернуться к списку заговоров"
                            >
                              Список
                            </button>
                          </div>
                        ) : (
                          (() => {
                            const selectableCantrips = getSelectableCantripsForIndex(i, c);
                            return (
                              <select
                                value={c}
                                onChange={e => {
                                  if (e.target.value === '__custom__') {
                                    toggleCustomCantrip(i, true);
                                    updateCantripRow(i, '');
                                  } else {
                                    updateCantripRow(i, e.target.value);
                                  }
                                }}
                                className="parchment-select text-xs w-full py-1 px-2 font-medium"
                              >
                                <option value="">
                                  {selectableCantrips.length === 0
                                    ? '-- Все доступные заговоры уже изучены --'
                                    : `-- Выберите заговор (${selectableCantrips.length} доступно) --`}
                                </option>
                                {selectableCantrips.map(spell => (
                                  <option key={spell.name} value={spell.name}>
                                    {spell.name} ({spell.school}){spell.nameEn ? ` — ${spell.nameEn}` : ''}
                                  </option>
                                ))}
                                <option value="__custom__">✍️ Ввести другое название вручную...</option>
                              </select>
                            );
                          })()
                        )}
                      </div>
                      <div className="flex items-center justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => removeCantripRow(i)}
                          className="parchment-remove-btn w-6 h-6 flex items-center justify-center text-xs"
                          title="Удалить заговор"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9.c. New Leveled Spells (only if class learns new spells at this level) */}
          {newSpellsLearned > 0 && maxSlotLevelAtNewLevel > 0 && (
            <div className="parchment-modal-section space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3
                    className="text-sm font-bold flex items-center gap-1.5"
                    style={{ color: '#3C2415' }}
                  >
                    <SpellbookIcon size={16} />
                    <span>
                      {normClass === 'Волшебник'
                        ? 'Новые заклинания в книгу заклинаний:'
                        : 'Изучение новых заклинаний:'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: '#5C341F' }}
                    >
                      +{newSpellsLearned}{' '}
                      {newSpellsLearned === 1
                        ? 'заклинание'
                        : newSpellsLearned < 5
                          ? 'заклинания'
                          : 'заклинаний'}{' '}
                      (по таблице класса на {newLevel}-м ур.)
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: '#8B6914' }}
                    >
                      • Доступны круги до {maxSlotLevelAtNewLevel}-го включительно
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                      style={{
                        background:
                          newSpells.filter(s => s.name.trim()).length >= newSpellsLearned
                            ? 'rgba(74, 124, 63, 0.15)'
                            : 'rgba(139, 37, 0, 0.12)',
                        color:
                          newSpells.filter(s => s.name.trim()).length >= newSpellsLearned
                            ? '#4a7c3f'
                            : '#8B2500',
                        border: `1px solid ${
                          newSpells.filter(s => s.name.trim()).length >= newSpellsLearned
                            ? 'rgba(74, 124, 63, 0.35)'
                            : 'rgba(139, 37, 0, 0.35)'
                        }`,
                      }}
                    >
                      Выбрано {newSpells.filter(s => s.name.trim()).length} из {newSpellsLearned}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addSpellRow}
                  className="parchment-btn-sm font-bold shrink-0"
                  style={{ color: '#6B3A2A' }}
                >
                  + Заклинание
                </button>
              </div>
              {newSpells.length === 0 ? (
                <p
                  className="text-xs italic"
                  style={{ color: '#8B6914' }}
                >
                  Нажмите «+ Заклинание», чтобы добавить положенные заклинания вашего класса.
                </p>
              ) : (
                <div className="space-y-2">
                  {newSpells.map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg border"
                      style={{
                        background: 'rgba(245, 230, 200, 0.65)',
                        borderColor: 'rgba(201, 168, 76, 0.45)',
                      }}
                    >
                      {/* Circle Selector */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-[11px] font-bold" style={{ color: '#8B6914' }}>
                          Круг:
                        </label>
                        <select
                          value={s.level}
                          onChange={e => {
                            const lvl = Number(e.target.value);
                            updateSpellRow(i, 'level', lvl);
                            updateSpellRow(i, 'name', '');
                          }}
                          className="parchment-select text-xs font-bold shrink-0"
                          style={{ width: '82px' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                            .filter(l => l <= Math.max(1, maxSlotLevelAtNewLevel))
                            .map(l => (
                              <option key={l} value={l}>
                                {l} круг
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Spell Selector / Custom Input */}
                      <div className="flex-1 min-w-0">
                        {s.isCustom ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={s.name}
                              onChange={e => updateSpellRow(i, 'name', e.target.value)}
                              placeholder="Название заклинания вашего класса…"
                              className="w-full parchment-input-boxed text-xs py-1 px-2.5"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateSpellRow(i, 'isCustom', false);
                                updateSpellRow(i, 'name', '');
                              }}
                              className="parchment-btn-secondary text-[11px] py-1 px-2 shrink-0"
                              title="Вернуться к каталогу заклинаний"
                            >
                              Список
                            </button>
                          </div>
                        ) : (
                          (() => {
                            const selectableSpells = getSelectableSpellsForIndex(i, s.level, s.name);
                            return (
                              <select
                                value={s.name}
                                onChange={e => {
                                  if (e.target.value === '__custom__') {
                                    updateSpellRow(i, 'isCustom', true);
                                    updateSpellRow(i, 'name', '');
                                  } else {
                                    updateSpellRow(i, 'name', e.target.value);
                                  }
                                }}
                                className="parchment-select text-xs w-full py-1 px-2 font-medium"
                              >
                                <option value="">
                                  {selectableSpells.length === 0
                                    ? `-- Все доступные заклинания ${s.level}-го круга уже изучены --`
                                    : `-- Выберите заклинание ${s.level}-го круга (${selectableSpells.length} доступно) --`}
                                </option>
                                {selectableSpells.map(spell => (
                                  <option key={spell.name} value={spell.name}>
                                    {spell.name} ({spell.school}){spell.nameEn ? ` — ${spell.nameEn}` : ''}
                                  </option>
                                ))}
                                <option value="__custom__">✍️ Ввести другое название вручную...</option>
                              </select>
                            );
                          })()
                        )}
                      </div>

                      {/* Prepared checkbox & Remove */}
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <label
                          className="parchment-checkbox parchment-checkbox-sm flex items-center gap-1"
                          style={{ color: '#8B6914' }}
                          title="Заклинание подготовлено к использованию"
                        >
                          <input
                            type="checkbox"
                            checked={s.prepared}
                            onChange={e =>
                              updateSpellRow(i, 'prepared', e.target.checked)
                            }
                          />
                          <span className="checkmark"></span>
                          <span className="text-xs select-none">Подг.</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSpellRow(i)}
                          className="parchment-remove-btn w-6 h-6 flex items-center justify-center text-xs"
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. Freeform Notes */}
          <div className="parchment-modal-section">
            <h3
              className="text-sm font-bold mb-2 flex items-center gap-1.5"
              style={{ color: '#3C2415' }}
            >
              <ScrollIcon size={16} />
              <span>Заметки к уровню:</span>
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="parchment-textarea"
              placeholder="Дополнительные примечания к повышению уровня…"
            />
          </div>

          {/* 11. Summary of Changes */}
          <div
            className="parchment-modal-section-accent text-xs space-y-1"
            style={{ color: '#3C2415' }}
          >
            <p
              className="font-bold text-sm mb-1"
              style={{ color: '#5C3A6E' }}
            >
              Итоговые изменения {newLevel}-го уровня:
            </p>
            <p>
              • Уровень: {char.level} → <strong>{newLevel}</strong>
            </p>
            <p>
              • Хиты: +{finalHP} (новый максимум:{' '}
              {(char.hpMax || 0) + finalHP})
            </p>
            {profChanged && (
              <p>
                • Бонус мастерства:{' '}
                {formatModifier(calcProficiencyBonus(char.level))} →{' '}
                {formatModifier(calcProficiencyBonus(newLevel))}
              </p>
            )}
            {isSubclassChoice && chosenSubclass && (
              <p>
                • Выбран архетип: <strong>{chosenSubclass}</strong>
              </p>
            )}
            {choicesConfig.needsFightingStyle && selectedFightingStyle && (
              <p>
                • Боевой стиль:{' '}
                <strong>
                  {
                    (
                      choicesConfig.fightingStyleOptions || FIGHTING_STYLES
                    ).find(f => f.id === selectedFightingStyle)?.name
                  }
                </strong>
              </p>
            )}
            {selectedExpertise.length > 0 && (
              <p>
                • Компетентность в навыках:{' '}
                <strong>{selectedExpertise.join(', ')}</strong>
              </p>
            )}
            {selectedMetamagic.length > 0 && (
              <p>
                • Метамагия:{' '}
                <strong>
                  {selectedMetamagic
                    .map(
                      id =>
                        METAMAGIC_OPTIONS.find(m => m.id === id)?.name || id
                    )
                    .join(', ')}
                </strong>
              </p>
            )}
            {selectedInvocations.length > 0 && (
              <p>
                • Воззвания:{' '}
                <strong>
                  {selectedInvocations
                    .map(
                      id =>
                        ELDRITCH_INVOCATIONS.find(i => i.id === id)?.name || id
                    )
                    .join(', ')}
                </strong>
              </p>
            )}
            {choicesConfig.needsHunterChoice && selectedHunterChoice && (
              <p>
                • {choicesConfig.hunterChoiceTitle || 'Охотник'}:{' '}
                <strong>
                  {
                    choicesConfig.hunterOptions?.find(
                      o => o.id === selectedHunterChoice
                    )?.name
                  }
                </strong>
              </p>
            )}
            {choicesConfig.needsTotemChoice && selectedTotemChoice && (
              <p>
                • {choicesConfig.totemChoiceTitle || 'Тотем'}:{' '}
                <strong>
                  {
                    choicesConfig.totemOptions?.find(
                      o => o.id === selectedTotemChoice
                    )?.name
                  }
                </strong>
              </p>
            )}
            {selectedManeuvers.length > 0 && (
              <p>
                • Маневры:{' '}
                <strong>
                  {selectedManeuvers
                    .map(
                      id =>
                        BATTLE_MASTER_MANEUVERS.find(m => m.id === id)?.name ||
                        id
                    )
                    .join(', ')}
                </strong>
              </p>
            )}
            {isASI && asiChoice === 'stats' && (
              <p>
                • Улучшение характеристик: {ABILITY_FULL[asiAbility1]} +1,{' '}
                {ABILITY_FULL[asiAbility2]} +1
              </p>
            )}
            {isASI && asiChoice === 'feat' && selectedFeat && (
              <p>
                • Получена черта: <strong>{selectedFeat.name}</strong>
              </p>
            )}
            {autoSpells.length > 0 && (
              <p>
                • Авто-заклинания:{' '}
                {autoSpells.map(s => s.name).join(', ')}
              </p>
            )}
            {newSpells.filter(s => s.name.trim()).length > 0 && (
              <p>
                • Изученные заклинания:{' '}
                {newSpells
                  .filter(s => s.name.trim())
                  .map(s => `${s.name} (${s.level} ур.)`)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="p-3.5 sm:p-4 border-t flex flex-wrap items-center justify-between gap-3 flex-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.4)',
            background:
              'linear-gradient(180deg, rgba(245, 230, 200, 0.95) 0%, #F5E6C8 100%)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="parchment-btn-secondary px-5 py-2 text-xs sm:text-sm"
          >
            Отмена
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {validationErrors.length > 0 && (
              <div
                className="px-2.5 py-1 rounded text-xs flex items-center gap-1.5 font-bold"
                style={{
                  background: 'rgba(139, 37, 0, 0.12)',
                  border: '1px solid rgba(139, 37, 0, 0.35)',
                  color: '#8B2500',
                }}
              >
                <HourglassIcon size={14} />
                <span>{validationErrors[0]}</span>
              </div>
            )}

            <button
              type="button"
              disabled={validationErrors.length > 0}
              onClick={() => onConfirm(buildEntry())}
              className="parchment-btn font-bold text-xs sm:text-sm px-5 py-2 flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <D20Icon size={18} />
              <span>Повысить до {newLevel}-го уровня</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
