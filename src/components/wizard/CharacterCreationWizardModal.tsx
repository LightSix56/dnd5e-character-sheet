'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  CharacterData, AbilityName, ABILITY_NAMES, ABILITY_FULL, ALL_SKILLS, SKILL_MAP,
  calcModifier, formatModifier, Attack, SpellEntry, createDefaultCharacter
} from '@/lib/dnd-types';
import { DND_COMPENDIUM_RACES, type CompendiumRace, type CompendiumSubrace } from '@/data/compendium/races';
import { DND_COMPENDIUM_CLASSES, type CompendiumClass } from '@/data/compendium/classes';
import { DND_COMPENDIUM_BACKGROUNDS, type CompendiumBackground } from '@/data/compendium/backgrounds';
import { DND_COMPENDIUM_SPELLS, type DndSpell } from '@/data/compendium/spells';
import {
  generateFantasyName,
  getRacialSkillData,
  getRacialBonusConfig,
  getClassSkillConfig,
  getClassSpellcastingLimits,
  POINT_BUY_BUDGET,
  POINT_BUY_COST_TABLE,
  calcPointBuyTotalSpent,
  roll4d6DropLowest,
  validateStandardArray,
  calcPreparedSpellsLimit,
  calculateWizardAC
} from './wizard-helpers';
import {
  D20Icon, ScrollIcon, SpellbookIcon, CrossedSwordsIcon,
  EngravedShieldIcon, SparklesDndIcon, CoinsChestIcon,
  MasksDramaIcon, BackpackPackIcon, InfoSealIcon
} from '@/components/dnd-icons';

interface CharacterCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (character: CharacterData) => void;
}

export function CharacterCreationWizardModal({ isOpen, onClose, onComplete }: CharacterCreationWizardModalProps) {
  // ── Step Navigation ──
  // 1: Concept & Race, 2: Class & Skills, 3: Background, 4: Ability Scores, 5: Spells, 6: Finalize & Review
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // ── Step 1: Character Concept & Race ──
  const [charName, setCharName] = useState<string>('');
  const [selectedRaceId, setSelectedRaceId] = useState<string>('human');
  const [selectedSubraceId, setSelectedSubraceId] = useState<string>('human-standard');
  const [raceSearch, setRaceSearch] = useState<string>('');
  // For races with customizable ability bonuses (Half-Elf, Variant Human)
  const [customRacialBonuses, setCustomRacialBonuses] = useState<AbilityName[]>(['ИНТ', 'ТЕЛ']);
  // For races with skill choice (Variant Human, Half-Elf, Kenku, etc.)
  const [customRacialSkills, setCustomRacialSkills] = useState<string[]>([]);

  // ── Step 2: Class & Skills ──
  const [selectedClassId, setSelectedClassId] = useState<string>('fighter');
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>(['Атлетика', 'Внимательность']);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string>('');

  // ── Step 3: Background ──
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>('soldier');
  // If background skills overlap with race/class, user picks replacements
  const [backgroundSkillReplacements, setBackgroundSkillReplacements] = useState<Record<string, string>>({});

  // ── Step 4: Ability Scores ──
  const [scoreMethod, setScoreMethod] = useState<'point-buy' | 'standard' | 'roll'>('standard');
  // Base scores (before racial bonuses)
  const [baseScores, setBaseScores] = useState<Record<AbilityName, number>>({
    'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 10, 'МДР': 12, 'ХАР': 8
  });
  // 4d6 roll results record
  const [rollResults, setRollResults] = useState<Record<AbilityName, { dice: number[]; droppedIndex: number; total: number } | null>>({
    'СИЛ': null, 'ЛОВ': null, 'ТЕЛ': null, 'ИНТ': null, 'МДР': null, 'ХАР': null
  });

  // ── Step 5: Spells (Level 1 Casters) ──
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  const [activeSpellInfo, setActiveSpellInfo] = useState<DndSpell | null>(null);
  const [spellSearch, setSpellSearch] = useState<string>('');

  // ── Step 6: Alignment & Details ──
  const [alignment, setAlignment] = useState<string>('Хаотично-добрый');
  const [age, setAge] = useState<string>('25');
  const [height, setHeight] = useState<string>('178 см');
  const [weight, setWeight] = useState<string>('75 кг');
  const [eyes, setEyes] = useState<string>('Карие');
  const [skin, setSkin] = useState<string>('Светлая');
  const [hair, setHair] = useState<string>('Тёмные');
  const [appearance, setAppearance] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [personalityTraits, setPersonalityTraits] = useState<string>('');
  const [ideals, setIdeals] = useState<string>('');
  const [bonds, setBonds] = useState<string>('');
  const [flaws, setFlaws] = useState<string>('');

  // ── Computed Entities ──

  const selectedRace = useMemo(() => {
    return DND_COMPENDIUM_RACES.find(r => r.id === selectedRaceId) || DND_COMPENDIUM_RACES[0];
  }, [selectedRaceId]);

  const selectedSubrace = useMemo(() => {
    if (!selectedRace.subraces || selectedRace.subraces.length === 0) return undefined;
    return selectedRace.subraces.find(sr => sr.id === selectedSubraceId) || selectedRace.subraces[0];
  }, [selectedRace, selectedSubraceId]);

  const selectedClass = useMemo(() => {
    return DND_COMPENDIUM_CLASSES.find(c => c.id === selectedClassId) || DND_COMPENDIUM_CLASSES[0];
  }, [selectedClassId]);

  const selectedSubclass = useMemo(() => {
    if (selectedClass.subclassLevel !== 1 || !selectedClass.subclasses || selectedClass.subclasses.length === 0) {
      return undefined;
    }
    return selectedClass.subclasses.find(s => s.id === selectedSubclassId || s.name === selectedSubclassId) || selectedClass.subclasses[0];
  }, [selectedClass, selectedSubclassId]);

  const selectedBackground = useMemo(() => {
    return DND_COMPENDIUM_BACKGROUNDS.find(b => b.id === selectedBackgroundId) || DND_COMPENDIUM_BACKGROUNDS[0];
  }, [selectedBackgroundId]);

  // Racial bonuses configuration
  const racialBonusConfig = useMemo(() => {
    return getRacialBonusConfig(selectedRace, selectedSubrace);
  }, [selectedRace, selectedSubrace]);

  // Final effective racial bonuses map
  const racialBonuses = useMemo<Record<AbilityName, number>>(() => {
    const map: Record<AbilityName, number> = { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 };
    // Add fixed bonuses from race/subrace
    if (selectedRace.abilityBonuses) {
      for (const [k, v] of Object.entries(selectedRace.abilityBonuses)) {
        if (v) map[k as AbilityName] = (map[k as AbilityName] || 0) + v;
      }
    }
    if (selectedSubrace?.abilityBonuses) {
      for (const [k, v] of Object.entries(selectedSubrace.abilityBonuses)) {
        if (v) map[k as AbilityName] = (map[k as AbilityName] || 0) + v;
      }
    }
    // Add custom picked bonuses
    if (racialBonusConfig.hasCustomBonus) {
      for (const ab of customRacialBonuses) {
        map[ab] = (map[ab] || 0) + racialBonusConfig.bonusAmount;
      }
    }
    return map;
  }, [selectedRace, selectedSubrace, racialBonusConfig, customRacialBonuses]);

  // Racial skills
  const racialSkillData = useMemo(() => {
    return getRacialSkillData(selectedRace, selectedSubrace);
  }, [selectedRace, selectedSubrace]);

  const finalRacialSkills = useMemo(() => {
    const list = [...racialSkillData.fixedSkills];
    for (const s of customRacialSkills) {
      if (!list.includes(s)) list.push(s);
    }
    return list;
  }, [racialSkillData, customRacialSkills]);

  // Class skill config
  const classSkillConfig = useMemo(() => {
    return getClassSkillConfig(selectedClass.name);
  }, [selectedClass]);

  // Spellcasting limits
  const spellLimits = useMemo(() => {
    return getClassSpellcastingLimits(selectedClass.name, baseScores, racialBonuses);
  }, [selectedClass, baseScores, racialBonuses]);

  // Available spells for class from compendium
  const availableClassCantrips = useMemo(() => {
    return DND_COMPENDIUM_SPELLS.filter(s =>
      s.level === 0 && (s.classes || []).some(cls => cls.toLowerCase() === selectedClass.name.toLowerCase())
    );
  }, [selectedClass]);

  const availableClassSpells = useMemo(() => {
    return DND_COMPENDIUM_SPELLS.filter(s =>
      s.level === 1 && (s.classes || []).some(cls => cls.toLowerCase() === selectedClass.name.toLowerCase())
    );
  }, [selectedClass]);

  // Total ability scores and modifiers
  const finalAbilityScores = useMemo(() => {
    const totals: Record<AbilityName, number> = {} as any;
    const mods: Record<AbilityName, number> = {} as any;
    for (const ab of ABILITY_NAMES) {
      const base = baseScores[ab] || 10;
      const bonus = racialBonuses[ab] || 0;
      const tot = base + bonus;
      totals[ab] = tot;
      mods[ab] = calcModifier(tot);
    }
    return { totals, mods };
  }, [baseScores, racialBonuses]);

  // Background skills calculation (with overlap detection and replacements)
  const backgroundSkills = useMemo(() => {
    const list: string[] = [];
    for (const s of selectedBackground.skillProficiencies) {
      // Check if already obtained from race or class
      const isFromRace = finalRacialSkills.includes(s);
      const isFromClass = selectedClassSkills.includes(s);
      if (isFromRace || isFromClass) {
        // Overlap! Use replacement if selected, else mark as needed
        const rep = backgroundSkillReplacements[s];
        if (rep) list.push(rep);
        else list.push(s);
      } else {
        list.push(s);
      }
    }
    return list;
  }, [selectedBackground, finalRacialSkills, selectedClassSkills, backgroundSkillReplacements]);

  // All combined proficient skills
  const allProficientSkills = useMemo(() => {
    const set = new Set<string>();
    for (const s of finalRacialSkills) set.add(s);
    for (const s of selectedClassSkills) set.add(s);
    for (const s of backgroundSkills) set.add(s);
    return Array.from(set);
  }, [finalRacialSkills, selectedClassSkills, backgroundSkills]);

  // ── Synchronize state when Race or Class changes ──

  // Random name generator button
  const handleGenerateName = useCallback(() => {
    const name = generateFantasyName(selectedRace.id);
    setCharName(name);
  }, [selectedRace]);

  // On selecting race
  const handleSelectRace = useCallback((race: CompendiumRace) => {
    setSelectedRaceId(race.id);
    const firstSubrace = race.subraces && race.subraces.length > 0 ? race.subraces[0] : undefined;
    if (firstSubrace) {
      setSelectedSubraceId(firstSubrace.id);
    } else {
      setSelectedSubraceId('');
    }
    // Reset custom bonus
    const cfg = getRacialBonusConfig(race, firstSubrace);
    if (cfg.hasCustomBonus) {
      setCustomRacialBonuses(cfg.availableAbilities.slice(0, cfg.choiceCount));
    } else {
      setCustomRacialBonuses([]);
    }
    const sData = getRacialSkillData(race, firstSubrace);
    setCustomRacialSkills([]);
    // Prune class skills that conflict with new race's fixed skills
    setSelectedClassSkills(prev => prev.filter(s => !sData.fixedSkills.includes(s)));
  }, []);

  const handleSelectSubrace = useCallback((subrace: CompendiumSubrace) => {
    setSelectedSubraceId(subrace.id);
    const cfg = getRacialBonusConfig(selectedRace, subrace);
    if (cfg.hasCustomBonus) {
      setCustomRacialBonuses(cfg.availableAbilities.slice(0, cfg.choiceCount));
    } else {
      setCustomRacialBonuses([]);
    }
    const sData = getRacialSkillData(selectedRace, subrace);
    setCustomRacialSkills([]);
    setSelectedClassSkills(prev => prev.filter(s => !sData.fixedSkills.includes(s)));
  }, [selectedRace]);

  // On selecting class: initialize default recommended skills and scores
  const handleSelectClass = useCallback((cls: CompendiumClass) => {
    setSelectedClassId(cls.id);
    if (cls.subclassLevel === 1 && cls.subclasses && cls.subclasses.length > 0) {
      setSelectedSubclassId(cls.subclasses[0].id);
    } else {
      setSelectedSubclassId('');
    }
    const cfg = getClassSkillConfig(cls.name);

    // Filter out skills already given by race
    const availableRec = cfg.recommendedSkills.filter(s => !finalRacialSkills.includes(s));
    setSelectedClassSkills(availableRec.slice(0, cfg.skillChoices));

    // Reset spells
    setSelectedCantrips([]);
    setSelectedSpells([]);

    // Update standard array preset if on standard method
    if (scoreMethod === 'standard' && cfg.template) {
      setBaseScores({ ...cfg.template.recommendedScores });
    }
  }, [finalRacialSkills, scoreMethod]);

  // Toggle class skill (with strict limit enforcement)
  const handleToggleClassSkill = useCallback((skill: string) => {
    // If skill is already granted by race, it's locked!
    if (finalRacialSkills.includes(skill)) return;

    setSelectedClassSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      }
      if (prev.length >= classSkillConfig.skillChoices) {
        return prev; // Strict limit!
      }
      return [...prev, skill];
    });
  }, [finalRacialSkills, classSkillConfig]);

  // Toggle custom racial skill (for Half-Elf, Kenku, etc.)
  const handleToggleCustomRacialSkill = useCallback((skill: string) => {
    setCustomRacialSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= racialSkillData.choiceCount) return prev;
      return [...prev, skill];
    });
  }, [racialSkillData]);

  // Toggle custom racial ability bonus (for Half-Elf, Variant Human)
  const handleToggleCustomBonus = useCallback((ab: AbilityName) => {
    setCustomRacialBonuses(prev => {
      if (prev.includes(ab)) return prev.filter(a => a !== ab);
      if (prev.length >= racialBonusConfig.choiceCount) return prev;
      return [...prev, ab];
    });
  }, [racialBonusConfig]);

  // Point Buy handlers
  const handlePointBuyChange = useCallback((ab: AbilityName, delta: number) => {
    setBaseScores(prev => {
      const current = prev[ab] || 8;
      const next = current + delta;
      if (next < 8 || next > 15) return prev;

      const currentCost = POINT_BUY_COST_TABLE[current] ?? 0;
      const nextCost = POINT_BUY_COST_TABLE[next] ?? 0;
      const costDiff = nextCost - currentCost;

      const currentSpent = calcPointBuyTotalSpent(prev);
      if (currentSpent + costDiff > POINT_BUY_BUDGET) return prev;

      return { ...prev, [ab]: next };
    });
  }, []);

  // Standard Array presets
  const handleApplyStandardPreset = useCallback(() => {
    const tmpl = classSkillConfig.template;
    if (tmpl) {
      setBaseScores({ ...tmpl.recommendedScores });
    } else {
      setBaseScores({ 'СИЛ': 15, 'ЛОВ': 14, 'ТЕЛ': 13, 'ИНТ': 10, 'МДР': 12, 'ХАР': 8 });
    }
  }, [classSkillConfig]);

  // Roll 4d6 for all stats
  const handleRollAllStats = useCallback(() => {
    const newResults: Record<AbilityName, any> = {} as any;
    const newScores: Record<AbilityName, number> = {} as any;
    for (const ab of ABILITY_NAMES) {
      const roll = roll4d6DropLowest();
      newResults[ab] = roll;
      newScores[ab] = roll.total;
    }
    setRollResults(newResults);
    setBaseScores(newScores);
  }, []);

  const handleRollSingleStat = useCallback((ab: AbilityName) => {
    const roll = roll4d6DropLowest();
    setRollResults(prev => ({ ...prev, [ab]: roll }));
    setBaseScores(prev => ({ ...prev, [ab]: roll.total }));
  }, []);

  // Spell toggling with strict limits
  const handleToggleCantrip = useCallback((spellName: string) => {
    setSelectedCantrips(prev => {
      if (prev.includes(spellName)) return prev.filter(s => s !== spellName);
      if (prev.length >= spellLimits.cantripsLimit) return prev;
      return [...prev, spellName];
    });
  }, [spellLimits]);

  const handleToggleSpell = useCallback((spellName: string) => {
    setSelectedSpells(prev => {
      if (prev.includes(spellName)) return prev.filter(s => s !== spellName);
      if (prev.length >= spellLimits.spellsLimit) return prev;
      return [...prev, spellName];
    });
  }, [spellLimits]);

  // Validation before advancing to next step
  const validateStep = (step: number): { valid: boolean; error?: string } => {
    if (step === 1) {
      if (!charName.trim()) {
        return { valid: false, error: 'Пожалуйста, введите имя персонажа или воспользуйтесь генератором 🎲.' };
      }
      if (racialBonusConfig.hasCustomBonus) {
        if (customRacialBonuses.length < racialBonusConfig.choiceCount) {
          return { valid: false, error: `Пожалуйста, выберите ${racialBonusConfig.choiceCount} характеристики для расового бонуса.` };
        }
        if (new Set(customRacialBonuses).size !== customRacialBonuses.length) {
          return { valid: false, error: 'Расовые бонусы должны быть назначены к разным характеристикам.' };
        }
      }
      if (racialSkillData.choiceCount > 0) {
        if (customRacialSkills.length < racialSkillData.choiceCount) {
          return { valid: false, error: `Пожалуйста, выберите ${racialSkillData.choiceCount} расовых навыка.` };
        }
        if (new Set(customRacialSkills).size !== customRacialSkills.length) {
          return { valid: false, error: 'Расовые навыки не могут повторяться.' };
        }
      }
      return { valid: true };
    }
    if (step === 2) {
      if (selectedClass.subclassLevel === 1 && !selectedSubclass) {
        return {
          valid: false,
          error: `Для класса «${selectedClass.name}» необходимо выбрать архетип (${selectedClass.subclassTitle || 'Подкласс'}) на 1-м уровне.`
        };
      }
      if (selectedClassSkills.length < classSkillConfig.skillChoices) {
        return {
          valid: false,
          error: `Вам необходимо выбрать ещё ${classSkillConfig.skillChoices - selectedClassSkills.length} навыка от класса.`
        };
      }
      const overlap = selectedClassSkills.find(s => finalRacialSkills.includes(s));
      if (overlap) {
        return {
          valid: false,
          error: `Навык «${overlap}» уже получен от расы. Пожалуйста, выберите другой навык класса.`
        };
      }
      return { valid: true };
    }
    if (step === 3) {
      // Check if any overlapping skill wasn't replaced
      for (const s of selectedBackground.skillProficiencies) {
        if (finalRacialSkills.includes(s) || selectedClassSkills.includes(s)) {
          const rep = backgroundSkillReplacements[s];
          if (!rep) {
            return { valid: false, error: `Навык «${s}» уже выбран. Пожалуйста, укажите навык на замену.` };
          }
          if (finalRacialSkills.includes(rep) || selectedClassSkills.includes(rep)) {
            return { valid: false, error: `Заменяющий навык «${rep}» уже имеется у персонажа. Выберите другой навык.` };
          }
        }
      }
      return { valid: true };
    }
    if (step === 4) {
      if (scoreMethod === 'point-buy') {
        const spent = calcPointBuyTotalSpent(baseScores);
        if (Number.isNaN(spent)) {
          return { valid: false, error: 'В методе Point Buy все характеристики должны быть в диапазоне от 8 до 15.' };
        }
        if (spent > POINT_BUY_BUDGET) {
          return { valid: false, error: `Превышен лимит очков Point Buy! Потрачено: ${spent} из ${POINT_BUY_BUDGET}.` };
        }
        if (spent < POINT_BUY_BUDGET) {
          return { valid: false, error: `У вас осталось ${POINT_BUY_BUDGET - spent} непотраченных очков Point Buy. Распределите их перед переходом.` };
        }
      } else if (scoreMethod === 'standard') {
        const stdRes = validateStandardArray(baseScores);
        if (!stdRes.valid) return stdRes;
      } else if (scoreMethod === 'roll') {
        for (const ab of ABILITY_NAMES) {
          if (!rollResults[ab]) {
            return { valid: false, error: `Пожалуйста, бросьте кубики для характеристики «${ABILITY_FULL[ab]}» (${ab}).` };
          }
        }
      }
      return { valid: true };
    }
    if (step === 5) {
      if (spellLimits.isCaster) {
        if (selectedCantrips.length !== spellLimits.cantripsLimit) {
          return { valid: false, error: `Пожалуйста, выберите ровно ${spellLimits.cantripsLimit} заговора (выбрано: ${selectedCantrips.length}).` };
        }
        if (selectedSpells.length !== spellLimits.spellsLimit) {
          return { valid: false, error: `Пожалуйста, выберите ровно ${spellLimits.spellsLimit} заклинаний 1-го уровня (выбрано: ${selectedSpells.length}).` };
        }
      }
      return { valid: true };
    }
    return { valid: true };
  };

  // Safe navigation checker across step buttons
  const canNavigateTo = (targetStep: number): boolean => {
    if (targetStep <= currentStep) return true;
    for (let s = 1; s < targetStep; s++) {
      if (s === 5 && !spellLimits.isCaster) continue;
      if (!validateStep(s).valid) return false;
    }
    return true;
  };

  const handleNext = () => {
    const v = validateStep(currentStep);
    if (!v.valid) {
      setStepError(v.error || 'Заполните обязательные поля');
      return;
    }
    setStepError(null);

    // If step 4 and class is not caster, skip step 5 directly to step 6
    if (currentStep === 4 && !spellLimits.isCaster) {
      setCurrentStep(6);
    } else {
      setCurrentStep(prev => Math.min(6, prev + 1));
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStep === 6 && !spellLimits.isCaster) {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => Math.max(1, prev - 1));
    }
  };

  // ── Build Final Character Data ──

  const handleFinish = () => {
    // 1. Comprehensive validation of all preceding steps
    for (let s = 1; s <= 5; s++) {
      if (s === 5 && !spellLimits.isCaster) continue;
      const v = validateStep(s);
      if (!v.valid) {
        setCurrentStep(s);
        setStepError(v.error || 'Заполните обязательные поля перед завершением');
        return;
      }
    }

    const tmpl = classSkillConfig.template;
    const strMod = finalAbilityScores.mods['СИЛ'];
    const dexMod = finalAbilityScores.mods['ЛОВ'];
    const conMod = finalAbilityScores.mods['ТЕЛ'];
    const intMod = finalAbilityScores.mods['ИНТ'];
    const wisMod = finalAbilityScores.mods['МДР'];

    // Hill Dwarf gets +1 HP per level
    const isHillDwarf = selectedSubraceId.includes('hill') || selectedSubrace?.name.toLowerCase().includes('холмов');
    const racialHpBonus = isHillDwarf ? 1 : 0;
    const hpMax = Math.max(1, classSkillConfig.hitDieSize + conMod + racialHpBonus);

    // Armor and Shield detection
    let equippedArmor = '';
    let equippedShield = false;
    if (tmpl) {
      equippedArmor = tmpl.equipment.toLowerCase().includes('кольчуга') ? 'Кольчуга' :
                      tmpl.equipment.toLowerCase().includes('чешуйчат') ? 'Чешуйчатый доспех' :
                      tmpl.equipment.toLowerCase().includes('кожан') ? 'Кожаный доспех' : '';
      equippedShield = tmpl.equipment.toLowerCase().includes('щит');
    }

    // Dynamic AC calculation based on actual ability modifiers
    const ac = calculateWizardAC(selectedClass.name, equippedArmor, equippedShield, dexMod, conMod, wisMod);

    // Saving throws map
    const savingThrowProficiencies: Record<AbilityName, boolean> = {
      'СИЛ': false, 'ЛОВ': false, 'ТЕЛ': false, 'ИНТ': false, 'МДР': false, 'ХАР': false
    };
    for (const ab of classSkillConfig.savingThrowProfs) {
      savingThrowProficiencies[ab] = true;
    }

    // Skill proficiencies map
    const skillProficiencies: Record<string, boolean> = {};
    for (const s of ALL_SKILLS) {
      skillProficiencies[s] = allProficientSkills.includes(s);
    }

    // Skill expertise map (Rogue gets expertise in 2 skills at 1st level)
    const skillExpertise: Record<string, boolean> = {};
    for (const s of ALL_SKILLS) {
      skillExpertise[s] = false;
    }
    if (selectedClass.name === 'Плут') {
      // Pick first 2 proficient skills for expertise by default
      const profs = allProficientSkills.slice(0, 2);
      for (const p of profs) skillExpertise[p] = true;
    }

    // Starting gold
    const startingGold = (selectedBackground.startingGold || 10);

    // Languages: Race languages + Background languages
    const languagesList = [
      ...(selectedRace.languages || []),
      ...(selectedBackground.languages || [])
    ];
    const languagesText = `Языки: ${languagesList.join(', ')}\nВладение доспехами и оружием: ${classSkillConfig.template?.armorWeaponProfs || selectedClass.armorWeaponProfs}\nВладение инструментами: ${selectedBackground.toolProficiencies.join(', ') || 'Нет'}`;

    // Features & Traits list
    const traitsList: any[] = [];
    const featureTextLines: string[] = [];

    // Racial traits
    for (const t of (selectedRace.traits || [])) {
      traitsList.push({
        id: `race-${t.name}`,
        name: t.name,
        source: selectedRace.name,
        summary: t.description.slice(0, 90) + '...',
        description: t.description
      });
      featureTextLines.push(`[${selectedRace.name}] ${t.name}: ${t.description}`);
    }
    if (selectedSubrace?.traits) {
      for (const t of selectedSubrace.traits) {
        traitsList.push({
          id: `subrace-${t.name}`,
          name: t.name,
          source: selectedSubrace.name,
          summary: t.description.slice(0, 90) + '...',
          description: t.description
        });
        featureTextLines.push(`[${selectedSubrace.name}] ${t.name}: ${t.description}`);
      }
    }

    // Class 1st level features
    if (selectedClass.featuresAt1) {
      traitsList.push({
        id: `class-${selectedClass.name}`,
        name: 'Классовые особенности 1-го уровня',
        source: selectedClass.name,
        summary: selectedClass.featuresAt1.slice(0, 90),
        description: selectedClass.featuresAt1
      });
      featureTextLines.push(`[${selectedClass.name}] 1 ур.:\n${selectedClass.featuresAt1}`);
    }

    // Subclass 1st level features (for classes choosing subclass at level 1)
    if (selectedClass.subclassLevel === 1 && selectedSubclass) {
      const subFeatures = selectedSubclass.features.filter(f => f.level <= 1);
      for (const f of subFeatures) {
        traitsList.push({
          id: `subclass-${f.name}`,
          name: f.name,
          source: `Подкласс: ${selectedSubclass.name}`,
          summary: f.description.slice(0, 90) + '...',
          description: f.description
        });
        featureTextLines.push(`[${selectedSubclass.name}] 1 ур. — ${f.name}: ${f.description}`);
      }
    }

    // Background feature
    if (selectedBackground.feature) {
      traitsList.push({
        id: `bg-${selectedBackground.feature.name}`,
        name: selectedBackground.feature.name,
        source: selectedBackground.name,
        summary: selectedBackground.feature.description.slice(0, 90) + '...',
        description: selectedBackground.feature.description
      });
      featureTextLines.push(`[Предыстория: ${selectedBackground.name}] ${selectedBackground.feature.name}: ${selectedBackground.feature.description}`);
    }

    // Equipment text
    const equipmentText = `[Класс]: ${classSkillConfig.template?.equipment || selectedClass.equipmentDefault}\n[Предыстория]: ${selectedBackground.equipment}`;

    // Attacks scaled with actual stat modifiers & proficiency (+2)
    const attacks: Attack[] = (tmpl?.typicalAttacks || []).map(att => {
      const isFinesseOrRanged = /рапира|короткий меч|кинжал|лук|арбалет|дротик|rapier|bow|crossbow|dagger/i.test(att.name);
      const mod = isFinesseOrRanged ? Math.max(dexMod, strMod) : strMod;
      const atkBonusNum = 2 + mod;
      const sign = atkBonusNum >= 0 ? '+' : '';
      
      const diceMatch = att.damageAndType.match(/(\d+d\d+)/);
      const dice = diceMatch ? diceMatch[1] : '1d8';
      const typeMatch = att.damageAndType.match(/(рубящий|колющий|дробящий|slashing|piercing|bludgeoning)/i);
      const damType = typeMatch ? typeMatch[1] : '';
      const dmgSign = mod >= 0 ? '+' : '';
      const dmgStr = `${dice}${dmgSign}${mod} ${damType}`.trim();

      return {
        name: att.name,
        attackBonus: `${sign}${atkBonusNum}`,
        damageAndType: dmgStr
      };
    });

    if (attacks.length === 0) {
      attacks.push({
        name: 'Безоружный удар',
        attackBonus: formatModifier(strMod + 2),
        damageAndType: `${Math.max(1, 1 + strMod)} дроб.`
      });
    }

    // Spells structure: for wizard mark only intMod + 1 as prepared; for others all chosen are prepared
    const spellsByLevel: Record<number, SpellEntry[]> = {};
    if (spellLimits.isCaster && selectedSpells.length > 0) {
      if (spellLimits.spellbookOnly) {
        const prepLimit = calcPreparedSpellsLimit('Волшебник', 1, intMod);
        spellsByLevel[1] = selectedSpells.map((name, idx) => ({
          name,
          prepared: idx < prepLimit
        }));
      } else {
        spellsByLevel[1] = selectedSpells.map(name => ({ name, prepared: true }));
      }
    }

    const newChar: CharacterData = {
      name: charName.trim() || 'Герой',
      className: selectedClass.name,
      level: 1,
      background: selectedBackground.name,
      playerName: playerName.trim(),
      race: selectedRace.name,
      subrace: selectedSubrace?.name || '',
      subclass: (selectedClass.subclassLevel === 1 && selectedSubclass) ? selectedSubclass.name : '',
      alignment,
      experiencePoints: 0,
      inspiration: false,

      abilityScores: { ...baseScores },
      abilityBonuses: { ...racialBonuses },
      asiBonuses: { 'СИЛ': 0, 'ЛОВ': 0, 'ТЕЛ': 0, 'ИНТ': 0, 'МДР': 0, 'ХАР': 0 },

      savingThrowProficiencies,
      skillProficiencies,
      skillExpertise,

      armorClass: ac,
      equippedArmor,
      equippedShield,
      initiativeOverride: null,
      speed: selectedSubrace?.speed || selectedRace.speed || 30,
      hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDice: `1d${classSkillConfig.hitDieSize}`,

      deathSaveSuccesses: 0,
      deathSaveFailures: 0,

      attacks,

      cp: 0,
      sp: 0,
      ep: 0,
      gp: startingGold,
      pp: 0,

      personalityTraits: personalityTraits || selectedBackground.suggestedCharacteristics?.personalityTraits[0] || '',
      ideals: ideals || selectedBackground.suggestedCharacteristics?.ideals[0] || '',
      bonds: bonds || selectedBackground.suggestedCharacteristics?.bonds[0] || '',
      flaws: flaws || selectedBackground.suggestedCharacteristics?.flaws[0] || '',

      otherProficienciesLanguages: languagesText,
      featuresTraits: featureTextLines.join('\n\n'),
      traitsList,
      equipment: equipmentText,

      age,
      height,
      weight,
      eyes,
      skin,
      hair,
      appearance,
      alliesOrganizations: '',
      additionalFeaturesTraits: '',
      backstory: `Предыстория: ${selectedBackground.name}. ${selectedBackground.description}`,
      treasure: '',

      spellcastingClass: spellLimits.isCaster ? selectedClass.name : '',
      spellcastingAbility: spellLimits.spellcastingAbility,
      spellSlots: spellLimits.isCaster && spellLimits.spellSlotsAt1[1]
        ? { 1: { totalSlots: spellLimits.spellSlotsAt1[1], expendedSlots: 0 } }
        : {},
      cantrips: spellLimits.isCaster ? selectedCantrips : [],
      spellsByLevel,
      levelHistory: []
    };

    onComplete(newChar);
  };

  // ── Step Indicators ──
  const steps = [
    { num: 1, title: 'Раса', icon: '👤' },
    { num: 2, title: 'Класс & Навыки', icon: '⚔️' },
    { num: 3, title: 'Предыстория', icon: '📜' },
    { num: 4, title: 'Характеристики', icon: '🎲' },
    { num: 5, title: spellLimits.isCaster ? 'Заклинания' : 'Магия (—)', icon: '✨' },
    { num: 6, title: 'Завершение', icon: '👑' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 parchment-modal-overlay z-[350] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="parchment-modal max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative rounded-xl overflow-hidden"
        style={{
          background: '#F5E6C8',
          border: '3px solid #C9A84C',
          boxShadow: '0 16px 56px rgba(30, 15, 8, 0.7)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(201, 168, 76, 0.4)', background: 'linear-gradient(180deg, rgba(232, 211, 162, 0.6) 0%, rgba(245, 230, 200, 0.3) 100%)' }}>
          <div className="flex items-center gap-2.5">
            <D20Icon size={26} />
            <div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#3D2012', fontFamily: 'Georgia, serif' }}>
                Интерактивное создание персонажа
              </h2>
              <p className="text-[11px] leading-tight" style={{ color: '#8B6914' }}>
                Пошаговый мастер D&D 5-й редакции (SRD 5.1) · Шаг {currentStep} из 6
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Закрыть"
            className="w-8 h-8 flex items-center justify-center rounded-full text-base font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(139, 105, 20, 0.15)', color: '#5C341F' }}
          >
            ✕
          </button>
        </div>

        {/* Step Progress Bar & Indicators */}
        <div className="px-5 py-2.5 border-b flex flex-col gap-2" style={{ borderColor: 'rgba(201, 168, 76, 0.25)', background: 'rgba(232, 211, 162, 0.2)' }}>
          {/* Progress fill */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[rgba(139,105,20,0.15)]">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${(currentStep / 6) * 100}%`,
                background: 'linear-gradient(90deg, #8B6914 0%, #C9A84C 100%)'
              }}
            />
          </div>

          {/* Steps buttons */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {steps.map(s => {
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (canNavigateTo(s.num)) {
                      setStepError(null);
                      setCurrentStep(s.num);
                    } else {
                      for (let stepNum = 1; stepNum < s.num; stepNum++) {
                        if (stepNum === 5 && !spellLimits.isCaster) continue;
                        const v = validateStep(stepNum);
                        if (!v.valid) {
                          setStepError(v.error || 'Заполните обязательные поля');
                          break;
                        }
                      }
                    }
                  }}
                  className={`text-left px-1.5 py-1 rounded transition-all flex flex-col sm:flex-row items-center sm:items-start gap-1 ${
                    isActive
                      ? 'font-bold shadow-xs'
                      : isPassed
                      ? 'opacity-90 hover:opacity-100 cursor-pointer'
                      : 'opacity-60 cursor-pointer'
                  }`}
                  style={
                    isActive
                      ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                      : { border: '1px solid transparent' }
                  }
                >
                  <span className="text-xs">{s.icon}</span>
                  <span className="text-[10px] sm:text-xs truncate hidden sm:inline" style={{ color: isActive ? '#3D2012' : '#5C341F' }}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message banner */}
        {stepError && (
          <div className="px-5 py-2 text-xs flex items-center gap-2 bg-[#FDE8E8] border-b border-[#F8B4B4] text-[#9B1C1C]">
            <span>⚠️</span>
            <span>{stepError}</span>
          </div>
        )}

        {/* Main Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ══════════════════════════════════════════════
              ШАГ 1: КОНЦЕПЦИЯ И РАСА
          ══════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Name Generator Block */}
              <div className="p-4 rounded-lg space-y-2.5" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <label className="parchment-label text-sm font-bold block" style={{ color: '#3D2012' }}>
                  Имя персонажа
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={charName}
                    onChange={e => setCharName(e.target.value)}
                    placeholder="Например, Торин Дубощит, Лираэль Лунная Тень..."
                    className="parchment-input-boxed flex-1 text-sm py-1.5 px-3"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateName}
                    title="Сгенерировать атмосферное фэнтезийное имя"
                    className="parchment-btn text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <span>🎲</span>
                    <span className="hidden sm:inline">Случайное имя</span>
                  </button>
                </div>
              </div>

              {/* Race Selector Grid & Detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Race List (Left Column) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="parchment-label text-xs font-bold" style={{ color: '#3D2012' }}>Выберите расу:</span>
                    <span className="text-[10px] text-[#8B6914]">{DND_COMPENDIUM_RACES.length} доступно</span>
                  </div>
                  <input
                    type="text"
                    value={raceSearch}
                    onChange={e => setRaceSearch(e.target.value)}
                    placeholder="Поиск расы..."
                    className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                  />
                  <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
                    {DND_COMPENDIUM_RACES.filter(r =>
                      !raceSearch.trim() ||
                      r.name.toLowerCase().includes(raceSearch.toLowerCase().trim()) ||
                      r.nameEn.toLowerCase().includes(raceSearch.toLowerCase().trim())
                    ).map(r => {
                      const isSel = r.id === selectedRaceId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRace(r)}
                          className={`w-full text-left px-3 py-2 rounded text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSel ? 'font-bold shadow-xs' : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                          }`}
                          style={
                            isSel
                              ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                              : { border: '1px solid transparent' }
                          }
                        >
                          <div>
                            <div>{r.name}</div>
                            <div className="text-[10px] opacity-75">{r.nameEn} · {r.source}</div>
                          </div>
                          <span className="text-[11px] font-mono text-[#8B6914]">
                            {Object.entries(r.abilityBonuses || {}).map(([k, v]) => `${k}+${v}`).join(' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subrace & Racial Details (Right 2 Columns) */}
                <div className="md:col-span-2 space-y-4">
                  {/* Subrace Selector (if available) */}
                  {selectedRace.subraces && selectedRace.subraces.length > 0 && (
                    <div className="p-3.5 rounded-lg space-y-2" style={{ background: 'rgba(232, 211, 162, 0.3)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                      <label className="parchment-label text-xs font-bold block" style={{ color: '#3D2012' }}>
                        Подраса / Разновидность:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedRace.subraces.map(sr => {
                          const isSrSel = sr.id === selectedSubraceId;
                          return (
                            <button
                              key={sr.id}
                              type="button"
                              onClick={() => handleSelectSubrace(sr)}
                              className={`text-left p-2 rounded text-xs cursor-pointer transition-all ${
                                isSrSel ? 'font-bold' : 'hover:bg-[rgba(201,168,76,0.15)]'
                              }`}
                              style={
                                isSrSel
                                  ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                                  : { border: '1px solid rgba(139, 105, 20, 0.2)', color: '#5C341F' }
                              }
                            >
                              <div className="font-semibold">{sr.name}</div>
                              <div className="text-[10px] opacity-75 mt-0.5">{sr.description}</div>
                              {sr.abilityBonuses && Object.keys(sr.abilityBonuses).length > 0 && (
                                <div className="text-[10px] font-mono mt-1 text-[#4a7c3f]">
                                  Бонус: {Object.entries(sr.abilityBonuses).map(([k, v]) => `${k} +${v}`).join(', ')}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customizable Racial Ability Bonuses (Half-Elf, Variant Human) */}
                  {racialBonusConfig.hasCustomBonus && (
                    <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(254, 243, 199, 0.6)', border: '1px dashed #D97706' }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#92400E]">✨ Настройка расовых бонусов:</span>
                        <span className="text-[11px] font-medium text-[#B45309]">
                          Выбрано {customRacialBonuses.length} из {racialBonusConfig.choiceCount} (+{racialBonusConfig.bonusAmount} к каждой)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78350F]">{racialBonusConfig.description}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {racialBonusConfig.availableAbilities.map(ab => {
                          const isChecked = customRacialBonuses.includes(ab);
                          return (
                            <button
                              key={ab}
                              type="button"
                              onClick={() => handleToggleCustomBonus(ab)}
                              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                                isChecked ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                              }`}
                              style={
                                isChecked
                                  ? { background: '#D97706', color: '#FFFBEB', border: '1px solid #B45309' }
                                  : { background: 'rgba(245, 230, 200, 0.75)', color: '#92400E', border: '1px solid #D97706' }
                              }
                            >
                              {isChecked ? '✓ ' : '+1 '}{ABILITY_FULL[ab]} ({ab})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customizable Racial Skills (Kenku, Changeling, Half-Elf, Variant Human) */}
                  {racialSkillData.choiceCount > 0 && (
                    <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(92, 58, 110, 0.08)', border: '1px dashed #5C3A6E' }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#5C3A6E]">🎯 Расовые навыки на выбор:</span>
                        <span className="text-[11px] font-medium text-[#6B3A2A]">
                          Выбрано {customRacialSkills.length} из {racialSkillData.choiceCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#3D2012]">{racialSkillData.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(racialSkillData.choiceOptions || ALL_SKILLS).map(skill => {
                          const isChecked = customRacialSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleToggleCustomRacialSkill(skill)}
                              className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${
                                isChecked ? 'font-bold shadow-xs' : 'opacity-75 hover:opacity-100'
                              }`}
                              style={
                                isChecked
                                  ? { background: '#5C3A6E', color: '#FBF0DC', border: '1px solid #3E244B' }
                                  : { background: 'rgba(245, 230, 200, 0.75)', color: '#5C3A6E', border: '1px solid rgba(92, 58, 110, 0.4)' }
                              }
                            >
                              {isChecked ? '✓ ' : ''}{skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Highlights Summary Card */}
                  <div className="p-4 rounded-lg space-y-3" style={{ background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                      <div>
                        <h3 className="text-sm font-bold text-[#3D2012]">
                          {selectedRace.name} {selectedSubrace ? `(${selectedSubrace.name})` : ''}
                        </h3>
                        <p className="text-[11px] text-[#8B6914]">{selectedRace.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: '#E8D3A2', color: '#5C341F' }}>
                        {selectedRace.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded" style={{ background: 'rgba(232, 211, 162, 0.25)' }}>
                        <div className="text-[10px] text-[#8B6914]">Бонусы:</div>
                        <div className="font-bold text-[#4a7c3f]">
                          {Object.entries(racialBonuses).filter(([_, v]) => v > 0).map(([k, v]) => `${k} +${v}`).join(', ') || 'Нет'}
                        </div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(232, 211, 162, 0.25)' }}>
                        <div className="text-[10px] text-[#8B6914]">Скорость:</div>
                        <div className="font-bold text-[#3D2012]">
                          {selectedSubrace?.speed || selectedRace.speed} футов
                        </div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(232, 211, 162, 0.25)' }}>
                        <div className="text-[10px] text-[#8B6914]">Тёмное зрение:</div>
                        <div className="font-bold text-[#3D2012]">
                          {selectedRace.darkvision ? `${selectedRace.darkvision} фт` : 'Нет'}
                        </div>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(232, 211, 162, 0.25)' }}>
                        <div className="text-[10px] text-[#8B6914]">Расовые навыки:</div>
                        <div className="font-bold text-[#5C3A6E]">
                          {finalRacialSkills.length > 0 ? finalRacialSkills.join(', ') : 'Нет'}
                        </div>
                      </div>
                    </div>

                    {/* Traits breakdown */}
                    <div className="space-y-1.5 text-xs pt-1">
                      <span className="font-semibold text-[#5C341F] text-[11px]">📜 Расовые особенности и черты:</span>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {[...(selectedRace.traits || []), ...(selectedSubrace?.traits || [])].map((t, idx) => (
                          <div key={idx} className="p-2 rounded text-[11px]" style={{ background: 'rgba(232, 211, 162, 0.15)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                            <strong className="text-[#3D2012]">{t.name}: </strong>
                            <span className="text-[#5C341F]">{t.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ШАГ 2: КЛАСС И НАВЫКИ
          ══════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Class Selection Carousel / Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="parchment-label text-sm font-bold block" style={{ color: '#3D2012' }}>
                    Выберите класс персонажа:
                  </label>
                  <span className="text-xs text-[#8B6914]">Кость хитов и спасброски назначаются автоматически</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DND_COMPENDIUM_CLASSES.map(cls => {
                    const isSel = cls.id === selectedClassId;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleSelectClass(cls)}
                        className={`p-2.5 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                          isSel ? 'font-bold shadow-md scale-102' : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                        }`}
                        style={
                          isSel
                            ? { background: '#E8D3A2', border: '2px solid #C9A84C', color: '#3D2012' }
                            : { background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(139, 105, 20, 0.2)' }
                        }
                      >
                        <span className="text-2xl">{cls.emoji}</span>
                        <span className="text-xs font-semibold">{cls.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">1d{cls.hitDieSize}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class Feature Details & Proficiency summary */}
              <div className="p-4 rounded-lg space-y-3" style={{ background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2.5 gap-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedClass.emoji}</span>
                    <div>
                      <h3 className="text-base font-bold text-[#3D2012]">{selectedClass.name} ({selectedClass.nameEn})</h3>
                      <p className="text-xs text-[#8B6914]">{selectedClass.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded text-xs font-bold" style={{ background: 'rgba(139, 37, 0, 0.1)', color: '#8B2500', border: '1px solid rgba(139, 37, 0, 0.25)' }}>
                      🎲 Кость хитов: 1d{selectedClass.hitDieSize}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-bold" style={{ background: 'rgba(92, 58, 110, 0.1)', color: '#5C3A6E', border: '1px solid rgba(92, 58, 110, 0.25)' }}>
                      🛡️ Спасброски: {selectedClass.savingThrowProfs.map(a => ABILITY_FULL[a]).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#5C341F] space-y-1">
                  <div><strong>Владение оружием и доспехами: </strong>{selectedClass.armorWeaponProfs}</div>
                  <div><strong>Особенности 1-го уровня: </strong>{selectedClass.featuresAt1}</div>
                </div>
              </div>

              {/* ── Subclass Selection at 1st Level (Cleric, Sorcerer, Warlock) ── */}
              {selectedClass.subclassLevel === 1 && selectedClass.subclasses && selectedClass.subclasses.length > 0 && (
                <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(232, 211, 162, 0.45)', border: '2px solid #C9A84C' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#3D2012' }}>
                        <span>👑</span>
                        <span>{selectedClass.subclassTitle || 'Выбор архетипа / подкласса'} (1-й уровень)</span>
                      </h4>
                      <p className="text-[11px] text-[#8B6914]">
                        Класс «{selectedClass.name}» определяет свой архетип уже на 1-м уровне. Выберите специализацию вашего персонажа:
                      </p>
                    </div>
                    {selectedSubclass && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded shadow-xs self-start sm:self-auto" style={{ background: '#5C341F', color: '#FFE58F' }}>
                        Выбран: {selectedSubclass.name}
                      </span>
                    )}
                  </div>

                  {/* Subclass cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {selectedClass.subclasses.map(sub => {
                      const isSel = sub.id === selectedSubclassId || sub.name === selectedSubclassId;
                      const lvl1Features = sub.features.filter(f => f.level <= 1);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubclassId(sub.id)}
                          className={`p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSel ? 'shadow-md scale-[1.01]' : 'hover:bg-[rgba(201,168,76,0.18)]'
                          }`}
                          style={
                            isSel
                              ? { background: '#E8D3A2', border: '2px solid #5C341F', color: '#3D2012' }
                              : { background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(139, 105, 20, 0.3)', color: '#4A2A18' }
                          }
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs" style={{ color: isSel ? '#3D2012' : '#5C341F' }}>{sub.name}</span>
                              <span className="text-[10px] opacity-70 italic">{sub.nameEn}</span>
                            </div>
                            <p className="text-[11px] mt-1 leading-snug line-clamp-3 opacity-90">{sub.description}</p>
                          </div>
                          {lvl1Features.length > 0 && (
                            <div className="text-[10px] pt-1.5 border-t border-[rgba(201,168,76,0.3)] space-y-0.5">
                              <span className="font-semibold text-[#6B3A2A]">Умения 1-го уровня:</span>
                              <div className="text-[#3D2012] line-clamp-2">
                                {lvl1Features.map(f => f.name).join(', ')}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Strict Class Skill Picker ── */}
              <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div>
                    <h4 className="text-sm font-bold text-[#3D2012]">
                      Выбор классовых навыков
                    </h4>
                    <p className="text-[11px] text-[#8B6914]">
                      Классу положено выбрать строго <strong>{classSkillConfig.skillChoices}</strong> навыка из доступного списка.
                    </p>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-full shadow-xs self-start sm:self-auto" style={{
                    background: selectedClassSkills.length === classSkillConfig.skillChoices ? '#D1E7DD' : '#FFF3CD',
                    color: selectedClassSkills.length === classSkillConfig.skillChoices ? '#0F5132' : '#664D03',
                    border: `1px solid ${selectedClassSkills.length === classSkillConfig.skillChoices ? '#BADBCC' : '#FFECB5'}`
                  }}>
                    Выбрано: {selectedClassSkills.length} из {classSkillConfig.skillChoices}
                  </div>
                </div>

                {/* Skill Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {classSkillConfig.skillOptions.map(skill => {
                    const isFromRace = finalRacialSkills.includes(skill);
                    const isSelected = selectedClassSkills.includes(skill);
                    const isRecommended = classSkillConfig.recommendedSkills.includes(skill);
                    const isMaxReached = selectedClassSkills.length >= classSkillConfig.skillChoices;
                    const isDisabled = isFromRace || (!isSelected && isMaxReached);

                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleClassSkill(skill)}
                        disabled={isDisabled}
                        className={`p-2.5 rounded-md text-left text-xs transition-all flex items-center justify-between ${
                          isFromRace
                            ? 'opacity-85 cursor-not-allowed'
                            : isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:shadow-xs'
                        }`}
                        style={
                          isFromRace
                            ? { background: 'rgba(92, 58, 110, 0.12)', border: '1px solid #5C3A6E', color: '#5C3A6E' }
                            : isSelected
                            ? { background: '#4a7c3f', border: '1px solid #365b2e', color: '#FFFFFF' }
                            : { background: 'rgba(245, 230, 200, 0.75)', border: '1px solid rgba(139, 105, 20, 0.3)', color: '#3D2012' }
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {isFromRace ? '🔒' : isSelected ? '☑' : '☐'}
                          </span>
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              <span>{skill}</span>
                              {isRecommended && !isFromRace && <span title="Рекомендуется для этого класса" className="text-amber-500 text-[10px]">⭐</span>}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {SKILL_MAP[skill] ? `${ABILITY_FULL[SKILL_MAP[skill]]} (${SKILL_MAP[skill]})` : ''}
                            </div>
                          </div>
                        </div>

                        {isFromRace ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: '#5C3A6E', color: '#FFFFFF' }}>
                            От расы
                          </span>
                        ) : isSelected ? (
                          <span className="text-[10px] font-bold">Выбран</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ШАГ 3: ПРЕДЫСТОРИЯ
          ══════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Background Selector Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="parchment-label text-sm font-bold block" style={{ color: '#3D2012' }}>
                    Выберите предысторию персонажа:
                  </label>
                  <span className="text-xs text-[#8B6914]">{DND_COMPENDIUM_BACKGROUNDS.length} вариантов предысторий</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DND_COMPENDIUM_BACKGROUNDS.map(bg => {
                    const isSel = bg.id === selectedBackgroundId;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSelectedBackgroundId(bg.id)}
                        className={`p-2.5 rounded-lg text-left text-xs cursor-pointer transition-all ${
                          isSel ? 'font-bold shadow-sm' : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                        }`}
                        style={
                          isSel
                            ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                            : { background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(139, 105, 20, 0.2)' }
                        }
                      >
                        <div className="font-bold">{bg.name}</div>
                        <div className="text-[10px] opacity-75">{bg.nameEn}</div>
                        <div className="text-[10px] font-mono mt-1 text-[#5C3A6E]">
                          {bg.skillProficiencies.join(', ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Detail & Skill Overlap Resolver */}
              <div className="p-4 rounded-lg space-y-4" style={{ background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div className="border-b pb-2.5" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <h3 className="text-base font-bold text-[#3D2012]">
                    Предыстория: {selectedBackground.name} ({selectedBackground.nameEn})
                  </h3>
                  <p className="text-xs text-[#5C341F] mt-1">{selectedBackground.description}</p>
                </div>

                {/* Skills granted by background & overlap handling */}
                <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(232, 211, 162, 0.25)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                  <span className="text-xs font-bold text-[#3D2012] block">
                    🎯 Навыки предыстории (2 фиксированных):
                  </span>
                  <div className="space-y-2">
                    {selectedBackground.skillProficiencies.map(bgSkill => {
                      const isFromRace = finalRacialSkills.includes(bgSkill);
                      const isFromClass = selectedClassSkills.includes(bgSkill);
                      const isOverlapping = isFromRace || isFromClass;
                      const replacement = backgroundSkillReplacements[bgSkill] || '';

                      return (
                        <div key={bgSkill} className="p-2.5 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ background: 'rgba(245, 230, 200, 0.8)', border: '1px solid rgba(139, 105, 20, 0.3)' }}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#3D2012]">{bgSkill}</span>
                            {isOverlapping && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#8B2500]" style={{ background: 'rgba(217, 56, 30, 0.1)', border: '1px solid rgba(217, 56, 30, 0.3)' }}>
                                ⚠️ Уже получен от {isFromRace ? 'расы' : 'класса'}!
                              </span>
                            )}
                          </div>

                          {isOverlapping ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#8B2500]">Выберите замену:</span>
                              <select
                                value={replacement}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBackgroundSkillReplacements(prev => ({ ...prev, [bgSkill]: val }));
                                }}
                                className="parchment-select text-xs py-1 px-2"
                              >
                                <option value="">— Выберите другой навык —</option>
                                {ALL_SKILLS.filter(s =>
                                  !finalRacialSkills.includes(s) &&
                                  !selectedClassSkills.includes(s) &&
                                  s !== bgSkill &&
                                  !Object.values(backgroundSkillReplacements).includes(s)
                                ).map(s => (
                                  <option key={s} value={s}>{s} ({SKILL_MAP[s]})</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#4a7c3f] font-semibold">✓ Будет добавлен</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Background Feature */}
                <div className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(232, 211, 162, 0.25)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                  <div className="text-xs font-bold text-[#3D2012]">
                    📜 Умение: {selectedBackground.feature.name}
                  </div>
                  <p className="text-xs text-[#5C341F]">{selectedBackground.feature.description}</p>
                </div>

                {/* Additional proficiencies & equipment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded" style={{ background: 'rgba(232, 211, 162, 0.2)' }}>
                    <div className="font-semibold text-[#8B6914]">Инструменты:</div>
                    <div className="text-[#3D2012] mt-0.5">{selectedBackground.toolProficiencies.join(', ') || 'Нет'}</div>
                  </div>
                  <div className="p-2.5 rounded" style={{ background: 'rgba(232, 211, 162, 0.2)' }}>
                    <div className="font-semibold text-[#8B6914]">Языки:</div>
                    <div className="text-[#3D2012] mt-0.5">{selectedBackground.languages.join(', ') || 'Нет'}</div>
                  </div>
                  <div className="p-2.5 rounded" style={{ background: 'rgba(232, 211, 162, 0.2)' }}>
                    <div className="font-semibold text-[#8B6914]">Стартовое золото:</div>
                    <div className="font-bold text-[#4a7c3f] mt-0.5">{selectedBackground.startingGold} зм</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8B6914]">Снаряжение предыстории:</div>
                  <p className="text-xs text-[#3D2012] mt-0.5">{selectedBackground.equipment}</p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ШАГ 4: ХАРАКТЕРИСТИКИ
          ══════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Method Switcher Header */}
              <div className="p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(232, 211, 162, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <div>
                  <label className="parchment-label text-sm font-bold block" style={{ color: '#3D2012' }}>
                    Способ определения характеристик:
                  </label>
                  <p className="text-[11px] text-[#8B6914]">
                    Выберите удобный для вас метод генерации базовых значений.
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setScoreMethod('point-buy');
                      setBaseScores({ 'СИЛ': 8, 'ЛОВ': 8, 'ТЕЛ': 8, 'ИНТ': 8, 'МДР': 8, 'ХАР': 8 });
                    }}
                    className={`px-3 py-1.5 rounded text-xs cursor-pointer font-semibold transition-all ${
                      scoreMethod === 'point-buy' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      scoreMethod === 'point-buy'
                        ? { background: '#5C341F', color: '#FBF0DC', border: '1px solid #3D2012' }
                        : { background: 'rgba(245, 230, 200, 0.7)', color: '#5C341F', border: '1px solid rgba(139,105,20,0.35)' }
                    }
                  >
                    ⚖️ Point Buy (27 очков)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScoreMethod('standard');
                      handleApplyStandardPreset();
                    }}
                    className={`px-3 py-1.5 rounded text-xs cursor-pointer font-semibold transition-all ${
                      scoreMethod === 'standard' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      scoreMethod === 'standard'
                        ? { background: '#5C341F', color: '#FBF0DC', border: '1px solid #3D2012' }
                        : { background: 'rgba(245, 230, 200, 0.7)', color: '#5C341F', border: '1px solid rgba(139,105,20,0.35)' }
                    }
                  >
                    📊 Стандартный массив
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScoreMethod('roll');
                      handleRollAllStats();
                    }}
                    className={`px-3 py-1.5 rounded text-xs cursor-pointer font-semibold transition-all ${
                      scoreMethod === 'roll' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      scoreMethod === 'roll'
                        ? { background: '#5C341F', color: '#FBF0DC', border: '1px solid #3D2012' }
                        : { background: 'rgba(245, 230, 200, 0.7)', color: '#5C341F', border: '1px solid rgba(139,105,20,0.35)' }
                    }
                  >
                    🎲 Бросок 4d6
                  </button>
                </div>
              </div>

              {/* Point Buy Status Bar */}
              {scoreMethod === 'point-buy' && (
                <div className="p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2" style={{ background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                  <div>
                    <span className="font-bold text-[#3D2012]">Покупка характеристик (Point Buy): </span>
                    <span className="text-[#5C341F]">Базовые значения от 8 (0 очков) до 15 (9 очков).</span>
                  </div>
                  {(() => {
                    const spent = calcPointBuyTotalSpent(baseScores);
                    const isNaN = Number.isNaN(spent);
                    const remaining = isNaN ? 0 : POINT_BUY_BUDGET - spent;
                    const isPerfect = !isNaN && remaining === 0;
                    const isOver = !isNaN && remaining < 0;
                    return (
                      <div className="font-bold text-xs sm:text-sm px-3 py-1 rounded self-start sm:self-auto" style={{
                        background: isPerfect ? '#D1E7DD' : isOver ? '#FDE8E8' : '#FFF3CD',
                        color: isPerfect ? '#0F5132' : isOver ? '#9B1C1C' : '#664D03',
                        border: `1px solid ${isPerfect ? '#BADBCC' : isOver ? '#F8B4B4' : '#FFECB5'}`
                      }}>
                        {isOver ? `Превышение на ${Math.abs(remaining)} очков!` : `Осталось очков: ${remaining} / ${POINT_BUY_BUDGET}`}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Standard Array Preset Button & Status */}
              {scoreMethod === 'standard' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[#5C341F]">
                      Значения стандартного набора: <strong>15, 14, 13, 12, 10, 8</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyStandardPreset}
                      className="text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-all active:scale-95"
                      style={{ background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }}
                    >
                      ⭐ Рекомендованный для «{selectedClass.name}»
                    </button>
                  </div>
                  {(() => {
                    const stdVal = validateStandardArray(baseScores);
                    if (!stdVal.valid) {
                      return (
                        <div className="p-2 rounded text-xs flex items-center gap-2 bg-[rgba(254,243,199,0.7)] border border-[#D97706] text-[#92400E]">
                          <span>⚠️</span>
                          <span>{stdVal.error}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-2 rounded text-xs flex items-center gap-2 bg-[rgba(209,231,221,0.7)] border border-[#BADBCC] text-[#0F5132]">
                        <span>✓</span>
                        <span>Все 6 значений стандартного набора распределены корректно без повторов.</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Roll 4d6 All Button */}
              {scoreMethod === 'roll' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5C341F]">
                    Бросок 4 шестигранных костей с отбрасыванием наименьшей (3..18)
                  </span>
                  <button
                    type="button"
                    onClick={handleRollAllStats}
                    className="text-xs font-bold px-3 py-1 rounded cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                    style={{ background: '#5C341F', color: '#FBF0DC' }}
                  >
                    <span>🎲</span>
                    <span>Перебросить все</span>
                  </button>
                </div>
              )}

              {/* Abilities Interactive Grid Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ABILITY_NAMES.map(ab => {
                  const base = baseScores[ab] || 10;
                  const bonus = racialBonuses[ab] || 0;
                  const total = finalAbilityScores.totals[ab];
                  const mod = finalAbilityScores.mods[ab];
                  const isPrimary = classSkillConfig.primaryAbility.includes(ab);
                  const rollData = rollResults[ab];

                  return (
                    <div
                      key={ab}
                      className="p-3 rounded-lg space-y-2.5 relative"
                      style={{
                        background: isPrimary ? 'rgba(254, 243, 199, 0.6)' : '#FFFDF9',
                        border: isPrimary ? '2px solid #D97706' : '1px solid rgba(201, 168, 76, 0.4)'
                      }}
                    >
                      {/* Ability Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[#3D2012]">{ABILITY_FULL[ab]}</span>
                          <span className="text-xs text-[#8B6914] font-mono">({ab})</span>
                        </div>
                        {isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-[#B45309]" style={{ background: '#FDE68A' }}>
                            ⭐ Ключевая
                          </span>
                        )}
                      </div>

                      {/* Controls according to method */}
                      <div className="flex items-center justify-between pt-1">
                        {scoreMethod === 'point-buy' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePointBuyChange(ab, -1)}
                              disabled={base <= 8}
                              className="w-7 h-7 rounded flex items-center justify-center font-bold text-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ background: '#E8D3A2', color: '#3D2012' }}
                            >
                              −
                            </button>
                            <span className="text-base font-bold font-mono min-w-[28px] text-center">{base}</span>
                            <button
                              type="button"
                              onClick={() => handlePointBuyChange(ab, 1)}
                              disabled={base >= 15 || calcPointBuyTotalSpent(baseScores) >= POINT_BUY_BUDGET}
                              className="w-7 h-7 rounded flex items-center justify-center font-bold text-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ background: '#E8D3A2', color: '#3D2012' }}
                            >
                              +
                            </button>
                          </div>
                        )}

                        {scoreMethod === 'standard' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8B6914]">Значение:</span>
                            <select
                              value={base}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setBaseScores(prev => ({ ...prev, [ab]: val }));
                              }}
                              className="parchment-select text-xs font-bold py-1 px-2"
                            >
                              {[15, 14, 13, 12, 10, 8].map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {scoreMethod === 'roll' && (
                          <div className="flex items-center gap-2">
                            {rollData && (
                              <div className="text-[11px] font-mono flex items-center gap-1 text-[#5C341F]">
                                <span>[</span>
                                {rollData.dice.map((d, i) => (
                                  <span key={i} className={i === rollData.droppedIndex ? 'line-through text-neutral-400' : 'font-bold'}>
                                    {d}
                                  </span>
                                ))}
                                <span>]</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRollSingleStat(ab)}
                              title="Перебросить этот кубик"
                              className="w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer active:scale-95 transition-transform"
                              style={{ background: '#E8D3A2', color: '#3D2012' }}
                            >
                              🎲
                            </button>
                          </div>
                        )}

                        {/* Breakdown: Base + Racial = Total & Mod */}
                        <div className="text-right">
                          <div className="text-[10px] text-[#8B6914]">
                            {base} {bonus > 0 ? `+ ${bonus} раса` : ''}
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-lg font-bold font-mono text-[#3D2012]">{total}</span>
                            <span className="calc-badge font-mono text-xs font-bold">
                              {formatModifier(mod)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ШАГ 5: ЗАКЛИНАНИЯ (ДЛЯ ЗАКЛИНАТЕЛЕЙ 1 УРОВНЯ)
          ══════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {!spellLimits.isCaster ? (
                /* Non-caster Card */
                <div className="p-8 rounded-xl text-center space-y-4 max-w-lg mx-auto" style={{ background: '#FFFDF9', border: '2px solid rgba(201, 168, 76, 0.4)' }}>
                  <span className="text-5xl block">⚔️</span>
                  <h3 className="text-lg font-bold text-[#3D2012]">
                    Класс «{selectedClass.name}» не использует заклинания на 1-м уровне
                  </h3>
                  <p className="text-xs text-[#5C341F] leading-relaxed">
                    Ваш персонаж полагается на воинскую доблесть, физические навыки и классовые особенности.
                    Этот шаг пропускается автоматически.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="parchment-btn text-sm px-6 py-2 shadow-md inline-flex items-center gap-2"
                  >
                    <span>Перейти к шагу 6: Завершение →</span>
                  </button>
                </div>
              ) : (
                /* Caster Spell Selection */
                <div className="space-y-6">
                  {/* Spells Header & Rule Explanation */}
                  <div className="p-4 rounded-lg space-y-2" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                      <div className="flex items-center gap-2">
                        <SpellbookIcon size={24} />
                        <div>
                          <h3 className="text-sm font-bold text-[#3D2012]">
                            Магия класса {selectedClass.name} ({spellLimits.spellcastingAbility ? ABILITY_FULL[spellLimits.spellcastingAbility] : ''})
                          </h3>
                          <p className="text-[11px] text-[#8B6914]">{spellLimits.ruleExplanation}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded font-semibold" style={{ background: '#EDE0C8', color: '#5C3A6E', border: '1px solid #C9A84C' }}>
                          Ячейки 1-го круга: {spellLimits.spellSlotsAt1[1] || 1}
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={spellSearch}
                      onChange={e => setSpellSearch(e.target.value)}
                      placeholder="Быстрый поиск по заклинаниям..."
                      className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                    />
                  </div>

                  {/* 1. Cantrips Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#3D2012]">
                          Заговоры (0-й круг)
                        </h4>
                        <p className="text-[11px] text-[#8B6914]">
                          Не расходуют ячейки заклинаний. Применяются неограниченное число раз.
                        </p>
                      </div>
                      <div className="text-xs font-bold px-3 py-1 rounded-full shadow-xs" style={{
                        background: selectedCantrips.length === spellLimits.cantripsLimit ? '#D1E7DD' : '#FFF3CD',
                        color: selectedCantrips.length === spellLimits.cantripsLimit ? '#0F5132' : '#664D03',
                        border: `1px solid ${selectedCantrips.length === spellLimits.cantripsLimit ? '#BADBCC' : '#FFECB5'}`
                      }}>
                        Выбрано: {selectedCantrips.length} из {spellLimits.cantripsLimit}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {availableClassCantrips.filter(s =>
                        !spellSearch.trim() ||
                        s.name.toLowerCase().includes(spellSearch.toLowerCase().trim()) ||
                        (s.nameEn && s.nameEn.toLowerCase().includes(spellSearch.toLowerCase().trim()))
                      ).map(s => {
                        const isSelected = selectedCantrips.includes(s.name);
                        const isMax = selectedCantrips.length >= spellLimits.cantripsLimit;
                        const isDisabled = !isSelected && isMax;

                        return (
                          <div
                            key={s.name}
                            onClick={() => !isDisabled && handleToggleCantrip(s.name)}
                            className={`p-2.5 rounded-md text-xs transition-all flex items-start justify-between gap-2 ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xs'
                            }`}
                            style={
                              isSelected
                                ? { background: '#5C3A6E', border: '1px solid #3E244B', color: '#FFFFFF' }
                                : { background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.3)', color: '#3D2012' }
                            }
                          >
                            <div className="flex-1">
                              <div className="font-semibold flex items-center gap-1.5">
                                <span>{isSelected ? '✓ ' : '+ '}{s.name}</span>
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-[#8B6914]'}`}>
                                {s.school} · {s.castingTime} · {s.range}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setActiveSpellInfo(s);
                              }}
                              title="Подробнее о заклинании"
                              className="w-5 h-5 flex items-center justify-center rounded transition-transform active:scale-95 cursor-pointer opacity-80 hover:opacity-100"
                            >
                              <InfoSealIcon size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Level 1 Spells Section */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#3D2012]">
                          {spellLimits.spellbookOnly ? 'Заклинания 1-го круга в книгу' : 'Заклинания 1-го круга'}
                        </h4>
                        <p className="text-[11px] text-[#8B6914]">
                          {spellLimits.spellbookOnly
                            ? '6 заклинаний записываются в вашу книгу заклинаний на 1-м уровне.'
                            : 'Выбираются согласно правилам класса.'}
                        </p>
                      </div>
                      <div className="text-xs font-bold px-3 py-1 rounded-full shadow-xs" style={{
                        background: selectedSpells.length === spellLimits.spellsLimit ? '#D1E7DD' : '#FFF3CD',
                        color: selectedSpells.length === spellLimits.spellsLimit ? '#0F5132' : '#664D03',
                        border: `1px solid ${selectedSpells.length === spellLimits.spellsLimit ? '#BADBCC' : '#FFECB5'}`
                      }}>
                        Выбрано: {selectedSpells.length} из {spellLimits.spellsLimit}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {availableClassSpells.filter(s =>
                        !spellSearch.trim() ||
                        s.name.toLowerCase().includes(spellSearch.toLowerCase().trim()) ||
                        (s.nameEn && s.nameEn.toLowerCase().includes(spellSearch.toLowerCase().trim()))
                      ).map(s => {
                        const isSelected = selectedSpells.includes(s.name);
                        const isMax = selectedSpells.length >= spellLimits.spellsLimit;
                        const isDisabled = !isSelected && isMax;

                        return (
                          <div
                            key={s.name}
                            onClick={() => !isDisabled && handleToggleSpell(s.name)}
                            className={`p-2.5 rounded-md text-xs transition-all flex items-start justify-between gap-2 ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xs'
                            }`}
                            style={
                              isSelected
                                ? { background: '#6B3A2A', border: '1px solid #4D2619', color: '#FFFFFF' }
                                : { background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.3)', color: '#3D2012' }
                            }
                          >
                            <div className="flex-1">
                              <div className="font-semibold flex items-center gap-1.5">
                                <span>{isSelected ? '✓ ' : '+ '}{s.name}</span>
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-[#8B6914]'}`}>
                                {s.school} · {s.castingTime} · {s.range}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setActiveSpellInfo(s);
                              }}
                              title="Подробнее о заклинании"
                              className="w-5 h-5 flex items-center justify-center rounded transition-transform active:scale-95 cursor-pointer opacity-80 hover:opacity-100"
                            >
                              <InfoSealIcon size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ШАГ 6: ЗАВЕРШЕНИЕ И СТАРТ
          ══════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Alignment Selector */}
              <div className="p-4 rounded-lg space-y-2.5" style={{ background: 'rgba(232, 211, 162, 0.35)', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <label className="parchment-label text-sm font-bold block" style={{ color: '#3D2012' }}>
                  Мировоззрение (Alignment):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    'Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый',
                    'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный',
                    'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой',
                    'Без мировоззрения'
                  ].map(al => {
                    const isSel = alignment === al;
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => setAlignment(al)}
                        className={`px-2.5 py-2 rounded text-xs cursor-pointer text-center transition-all ${
                          isSel ? 'font-bold shadow-xs' : 'hover:bg-[rgba(201,168,76,0.15)] text-[#5C341F]'
                        }`}
                        style={
                          isSel
                            ? { background: '#E8D3A2', border: '1px solid #C9A84C', color: '#3D2012' }
                            : { background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(139, 105, 20, 0.2)' }
                        }
                      >
                        {al}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio & Appearance Inputs */}
              <div className="p-4 rounded-lg space-y-3" style={{ background: '#FFFDF9', border: '1px solid rgba(201, 168, 76, 0.4)' }}>
                <h4 className="text-sm font-bold text-[#3D2012]">
                  Внешность и данные персонажа:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="parchment-label block mb-1">Имя игрока:</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      placeholder="Ваше имя"
                      className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                    />
                  </div>
                  <div>
                    <label className="parchment-label block mb-1">Возраст:</label>
                    <input
                      type="text"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="25 лет"
                      className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                    />
                  </div>
                  <div>
                    <label className="parchment-label block mb-1">Рост:</label>
                    <input
                      type="text"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="175 см"
                      className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                    />
                  </div>
                  <div>
                    <label className="parchment-label block mb-1">Вес:</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="70 кг"
                      className="parchment-input-boxed text-xs w-full py-1.5 px-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="parchment-label block mb-1 text-xs">Внешность / Описание:</label>
                  <textarea
                    value={appearance}
                    onChange={e => setAppearance(e.target.value)}
                    placeholder="Опишите внешность вашего персонажа, особые приметы, шрамы, осанку..."
                    rows={2}
                    className="parchment-textarea text-xs w-full p-2.5"
                  />
                </div>
              </div>

              {/* ── Ready Character Preview Sheet ── */}
              <div className="p-5 rounded-xl space-y-4 shadow-sm" style={{ background: '#FFFDF9', border: '2px solid #C9A84C' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
                  <div>
                    <div className="text-xl font-bold text-[#3D2012]" style={{ fontFamily: 'Georgia, serif' }}>
                      {charName || 'Безымянный герой'}
                    </div>
                    <div className="text-xs text-[#8B6914]">
                      {selectedRace.name} {selectedSubrace ? `(${selectedSubrace.name})` : ''} · {selectedClass.name}{selectedSubclass ? ` (${selectedSubclass.name})` : ''} 1 ур. · {selectedBackground.name} · {alignment}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#E8D3A2', color: '#5C341F' }}>
                      1 Уровень
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-bold text-[#4a7c3f]" style={{ background: 'rgba(74, 124, 63, 0.1)' }}>
                      💰 {selectedBackground.startingGold} зм
                    </span>
                  </div>
                </div>

                {/* Combat Stats Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded" style={{ background: 'rgba(139, 37, 0, 0.08)', border: '1px solid rgba(139, 37, 0, 0.2)' }}>
                    <div className="text-[10px] text-[#8B2500]">Макс. Хиты</div>
                    <div className="text-base font-bold text-[#8B2500]">
                      {Math.max(1, classSkillConfig.hitDieSize + finalAbilityScores.mods['ТЕЛ'] + (selectedSubraceId.includes('hill') || selectedSubrace?.name.toLowerCase().includes('холмов') ? 1 : 0))}
                    </div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(139, 105, 20, 0.08)', border: '1px solid rgba(139, 105, 20, 0.2)' }}>
                    <div className="text-[10px] text-[#8B6914]">Класс доспеха (КД)</div>
                    <div className="text-base font-bold text-[#6B3A2A]">
                      {(() => {
                        const tmpl = classSkillConfig.template;
                        const dexMod = finalAbilityScores.mods['ЛОВ'];
                        const conMod = finalAbilityScores.mods['ТЕЛ'];
                        const wisMod = finalAbilityScores.mods['МДР'];
                        let equippedArmor = '';
                        let equippedShield = false;
                        if (tmpl) {
                          equippedArmor = tmpl.equipment.toLowerCase().includes('кольчуга') ? 'Кольчуга' :
                                          tmpl.equipment.toLowerCase().includes('чешуйчат') ? 'Чешуйчатый доспех' :
                                          tmpl.equipment.toLowerCase().includes('кожан') ? 'Кожаный доспех' : '';
                          equippedShield = tmpl.equipment.toLowerCase().includes('щит');
                        }
                        return calculateWizardAC(selectedClass.name, equippedArmor, equippedShield, dexMod, conMod, wisMod);
                      })()}
                    </div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(74, 124, 63, 0.08)', border: '1px solid rgba(74, 124, 63, 0.2)' }}>
                    <div className="text-[10px] text-[#4a7c3f]">Инициатива</div>
                    <div className="text-base font-bold text-[#4a7c3f]">
                      {formatModifier(finalAbilityScores.mods['ЛОВ'])}
                    </div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'rgba(92, 58, 110, 0.08)', border: '1px solid rgba(92, 58, 110, 0.2)' }}>
                    <div className="text-[10px] text-[#5C3A6E]">Скорость</div>
                    <div className="text-base font-bold text-[#5C3A6E]">
                      {selectedSubrace?.speed || selectedRace.speed} фт
                    </div>
                  </div>
                  <div className="p-2 rounded col-span-2 sm:col-span-1" style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                    <div className="text-[10px] text-[#3D2012]">Кость хитов</div>
                    <div className="text-base font-bold text-[#3D2012]">1d{selectedClass.hitDieSize}</div>
                  </div>
                </div>

                {/* Abilities Summary Row */}
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  {ABILITY_NAMES.map(ab => (
                    <div key={ab} className="p-2 rounded" style={{ background: 'rgba(232, 211, 162, 0.2)', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                      <div className="text-[10px] text-[#8B6914]">{ab}</div>
                      <div className="font-bold text-sm text-[#3D2012]">{finalAbilityScores.totals[ab]}</div>
                      <div className="text-[10px] font-mono text-[#5C341F]">{formatModifier(finalAbilityScores.mods[ab])}</div>
                    </div>
                  ))}
                </div>

                {/* Skills with source tags */}
                <div className="text-xs space-y-1.5 pt-1">
                  <span className="font-semibold text-[#3D2012]">🎯 Владение навыками ({allProficientSkills.length}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {allProficientSkills.map(skill => {
                      const fromRace = finalRacialSkills.includes(skill);
                      const fromClass = selectedClassSkills.includes(skill);
                      const fromBg = backgroundSkills.includes(skill);

                      let badgeText = 'От класса';
                      let badgeStyle = { background: 'rgba(74, 124, 63, 0.15)', color: '#2d4d23', border: '1px solid #4a7c3f' };
                      if (fromRace) {
                        badgeText = 'От расы';
                        badgeStyle = { background: 'rgba(92, 58, 110, 0.15)', color: '#5C3A6E', border: '1px solid #5C3A6E' };
                      } else if (fromBg) {
                        badgeText = 'От предыстории';
                        badgeStyle = { background: 'rgba(139, 105, 20, 0.15)', color: '#8B6914', border: '1px solid #8B6914' };
                      }

                      return (
                        <span key={skill} className="px-2 py-1 rounded text-xs flex items-center gap-1.5" style={badgeStyle}>
                          <span className="font-bold">{skill}</span>
                          <span className="text-[9px] opacity-75 uppercase font-mono">({badgeText})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Spells summary (if caster) */}
                {spellLimits.isCaster && (
                  <div className="text-xs space-y-1 pt-1 border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.25)' }}>
                    <div className="font-semibold text-[#5C3A6E]">✨ Магическая книга и заклинания:</div>
                    <div className="text-[11px] text-[#5C341F]">
                      <strong>Заговоры: </strong>{selectedCantrips.join(', ') || 'Не выбраны'}
                    </div>
                    <div className="text-[11px] text-[#5C341F]">
                      <strong>Заклинания 1-го круга: </strong>{selectedSpells.join(', ') || 'Не выбраны'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Toolbar */}
        <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(201, 168, 76, 0.4)', background: 'linear-gradient(180deg, rgba(245, 230, 200, 0.3) 0%, rgba(232, 211, 162, 0.6) 100%)' }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="parchment-btn-secondary text-xs sm:text-sm px-4 py-2 cursor-pointer font-semibold"
              >
                ← Назад
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded text-xs text-[#5C341F] hover:underline cursor-pointer"
            >
              Отмена
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="parchment-btn text-xs sm:text-sm px-6 py-2 shadow-md cursor-pointer font-bold flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>Далее</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, #5C341F 0%, #3D2012 100%)',
                  color: '#FBF0DC',
                  border: '1px solid #C9A84C'
                }}
              >
                <span>🎉</span>
                <span>Завершить и начать играть</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spell Detail Submodal */}
      {activeSpellInfo && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setActiveSpellInfo(null)}>
          <div
            className="parchment-modal max-w-md w-full p-5 space-y-3 rounded-lg shadow-2xl relative"
            style={{ background: '#F5E6C8', border: '2px solid #C9A84C' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(201, 168, 76, 0.4)' }}>
              <div>
                <h4 className="text-base font-bold text-[#3D2012]">{activeSpellInfo.name}</h4>
                <div className="text-xs text-[#8B6914]">{activeSpellInfo.nameEn || ''} · {activeSpellInfo.school}</div>
              </div>
              <button onClick={() => setActiveSpellInfo(null)} className="text-sm font-bold cursor-pointer">✕</button>
            </div>
            <div className="text-xs space-y-1.5 text-[#5C341F]">
              <div><strong>Время сотворения: </strong>{activeSpellInfo.castingTime}</div>
              <div><strong>Дистанция: </strong>{activeSpellInfo.range}</div>
              <div><strong>Длительность: </strong>{activeSpellInfo.duration}</div>
              <p className="pt-2 text-xs leading-relaxed text-[#3D2012] whitespace-pre-wrap">{activeSpellInfo.description}</p>
            </div>
            <div className="pt-3 border-t text-right" style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}>
              <button
                type="button"
                onClick={() => setActiveSpellInfo(null)}
                className="parchment-btn-secondary text-xs py-1 px-3"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
