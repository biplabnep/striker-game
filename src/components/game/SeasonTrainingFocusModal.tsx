'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { FOCUS_AREA_ATTRIBUTES, calculateFocusBonusMultiplier } from '@/lib/game/progressionEngine';
import { SeasonTrainingFocusArea, PlayerAttributes, Position } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sword, Shield, Zap, Dumbbell, Brain,
  Check, X, Sparkles, TrendingUp, History, Lock,
} from 'lucide-react';

// ─── Attribute categories (mirrors progressionEngine classification) ───
const ATTR_CATEGORIES: Record<string, 'physical' | 'technical' | 'mental'> = {
  pace: 'physical',
  physical: 'physical',
  shooting: 'technical',
  passing: 'technical',
  dribbling: 'technical',
  defending: 'mental',
};

// ─── Progress bar fill colours per focus accent ───
const BAR_COLORS: Record<string, string> = {
  red: 'bg-red-500/30',
  blue: 'bg-blue-500/30',
  amber: 'bg-amber-500/30',
  emerald: 'bg-emerald-500/30',
  violet: 'bg-violet-500/30',
};

// ─── Age growth multiplier per attribute category (mirrors progressionEngine) ───
function getAgeMultiplier(age: number, category: 'physical' | 'technical' | 'mental'): number {
  if (age <= 16) return category === 'physical' ? 1.5 : category === 'technical' ? 1.8 : 1.6;
  if (age <= 19) return category === 'physical' ? 1.4 : category === 'technical' ? 1.6 : 1.5;
  if (age <= 21) return category === 'physical' ? 1.2 : category === 'technical' ? 1.3 : 1.3;
  if (age <= 23) return category === 'physical' ? 1.0 : category === 'technical' ? 1.1 : 1.2;
  if (age <= 26) return category === 'physical' ? 0.8 : category === 'technical' ? 0.9 : 1.0;
  if (age <= 29) return category === 'physical' ? 0.5 : category === 'technical' ? 0.7 : 0.9;
  if (age <= 31) return category === 'physical' ? 0.1 : category === 'technical' ? 0.4 : 0.6;
  if (age <= 33) return category === 'physical' ? -0.3 : category === 'technical' ? 0.1 : 0.3;
  if (age <= 35) return category === 'physical' ? -0.6 : category === 'technical' ? -0.2 : 0.1;
  if (age <= 37) return category === 'physical' ? -0.9 : category === 'technical' ? -0.5 : -0.2;
  return category === 'physical' ? -1.2 : category === 'technical' ? -0.8 : -0.4;
}

// ─── Recommended focus based on player position ───
function getRecommendedFocus(position: Position): SeasonTrainingFocusArea {
  if (['ST', 'CF', 'LW', 'RW'].includes(position)) return 'attacking';
  if (['CAM', 'CM', 'LM', 'RM'].includes(position)) return 'technical';
  if (['CDM', 'CB', 'LB', 'RB'].includes(position)) return 'tactical';
  return 'defensive'; // GK
}

// ─── Multiplier badge colour classes ───
function getMultiplierBadge(multiplier: number): string {
  if (multiplier >= 1.8) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
  if (multiplier >= 1.65) return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
  return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
}

// ─── Format projected gains as readable string ───
function formatGains(gains: Record<string, number>): string {
  return Object.entries(gains)
    .filter(([, g]) => g > 0)
    .map(([attr, g]) => `+${g} ${attr.charAt(0).toUpperCase() + attr.slice(1)}`)
    .join(', ');
}

// ─── Season / growth constants ───
const WEEKS_PER_SEASON = 38;
const FOCUS_GROWTH_BASE = 0.08; // per attribute per week from engine

// ─── Focus area configuration with icons and colours ───
const FOCUS_AREAS: {
  area: SeasonTrainingFocusArea;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}[] = [
  {
    area: 'attacking',
    label: 'Attacking',
    icon: <Sword className="h-6 w-6" />,
    accentColor: 'red',
    accentBg: 'bg-red-500/10',
    accentBorder: 'border-red-500/25',
    accentText: 'text-red-400',
    description: 'Shooting & Dribbling',
  },
  {
    area: 'defensive',
    label: 'Defensive',
    icon: <Shield className="h-6 w-6" />,
    accentColor: 'blue',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/25',
    accentText: 'text-blue-400',
    description: 'Defending',
  },
  {
    area: 'physical',
    label: 'Physical',
    icon: <Zap className="h-6 w-6" />,
    accentColor: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/25',
    accentText: 'text-amber-400',
    description: 'Pace & Physical',
  },
  {
    area: 'technical',
    label: 'Technical',
    icon: <Dumbbell className="h-6 w-6" />,
    accentColor: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/25',
    accentText: 'text-emerald-400',
    description: 'Passing, Dribbling & Shooting',
  },
  {
    area: 'tactical',
    label: 'Tactical',
    icon: <Brain className="h-6 w-6" />,
    accentColor: 'violet',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/25',
    accentText: 'text-violet-400',
    description: 'Passing & Defending',
  },
];

// ─── Props ───
interface SeasonTrainingFocusModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ───
export default function SeasonTrainingFocusModal({ open, onClose }: SeasonTrainingFocusModalProps) {
  const gameState = useGameStore(state => state.gameState);
  const setSeasonTrainingFocus = useGameStore(state => state.setSeasonTrainingFocus);

  const [selected, setSelected] = useState<SeasonTrainingFocusArea | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedFocus, setConfirmedFocus] = useState<{
    label: string;
    multiplier: number;
    attrs: string[];
    gains: Record<string, number>;
  } | null>(null);

  // ─── Base bonus multiplier from engine (age / gametime / form / potential) ───
  const baseMultiplier = useMemo(() => {
    if (!gameState) return 1.5;
    return calculateFocusBonusMultiplier(gameState.player, gameState.player.seasonStats);
  }, [gameState]);

  // ─── Per-area effective multiplier (FIXED: now varies by focus area) ───
  // Each area covers different attribute categories with different age growth profiles,
  // so the actual bonus effectiveness differs per area.
  const areaMultipliers = useMemo(() => {
    if (!gameState) return {} as Record<SeasonTrainingFocusArea, number>;
    const player = gameState.player;
    const result = {} as Record<SeasonTrainingFocusArea, number>;

    for (const area of Object.keys(FOCUS_AREA_ATTRIBUTES) as SeasonTrainingFocusArea[]) {
      const attrs = FOCUS_AREA_ATTRIBUTES[area];
      // Average age growth factor across this area's focused attributes
      const avgAgeFactor = attrs.reduce((sum, attr) => {
        const cat = ATTR_CATEGORIES[attr] as 'physical' | 'technical' | 'mental';
        return sum + Math.max(getAgeMultiplier(player.age, cat), 0.2);
      }, 0) / attrs.length;

      // Scale the base multiplier by the area's attribute growth potential.
      // avgAgeFactor ranges from 0.2 (old + wrong category) to 1.8 (young + right category).
      const effective = baseMultiplier * (0.55 + (avgAgeFactor / 1.8) * 0.65);
      result[area] = Math.round(Math.max(1.3, Math.min(2.0, effective)) * 100) / 100;
    }

    return result;
  }, [gameState, baseMultiplier]);

  // ─── Projected season gains per area ───
  // Estimates focus-only growth: 0.08 × baseBonus × max(ageMul, 0.2) × 38 weeks per attribute
  const projectedGains = useMemo(() => {
    if (!gameState) return {} as Record<SeasonTrainingFocusArea, Record<string, number>>;
    const player = gameState.player;
    const result = {} as Record<SeasonTrainingFocusArea, Record<string, number>>;

    for (const area of Object.keys(FOCUS_AREA_ATTRIBUTES) as SeasonTrainingFocusArea[]) {
      const gains: Record<string, number> = {};
      for (const attr of FOCUS_AREA_ATTRIBUTES[area]) {
        const cat = ATTR_CATEGORIES[attr] as 'physical' | 'technical' | 'mental';
        const ageMul = Math.max(getAgeMultiplier(player.age, cat), 0.2);
        const weeklyGain = FOCUS_GROWTH_BASE * baseMultiplier * ageMul;
        const seasonGain = weeklyGain * WEEKS_PER_SEASON;
        gains[attr] = Math.round(seasonGain);
      }
      result[area] = gains;
    }

    return result;
  }, [gameState, baseMultiplier]);

  // ─── Recommended focus area based on player position ───
  const recommendedFocus = useMemo((): SeasonTrainingFocusArea | null => {
    if (!gameState) return null;
    return getRecommendedFocus(gameState.player.position);
  }, [gameState]);

  // ─── Focus history (derived from seasonTrainingFocus set in a previous season) ───
  const focusHistory = useMemo(() => {
    if (!gameState) return null;
    const focus = gameState.seasonTrainingFocus;
    if (!focus || focus.setAtSeason >= gameState.currentSeason) return null;
    return {
      label: focus.area.charAt(0).toUpperCase() + focus.area.slice(1),
      multiplier: focus.bonusMultiplier,
    };
  }, [gameState]);

  // ─── Reset state when modal closes ───
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelected(null);
        setShowConfirmation(false);
        setConfirmedFocus(null);
      }, 0);
    }
  }, [open]);

  // ─── Auto-dismiss confirmation overlay after 2 seconds ───
  useEffect(() => {
    if (!showConfirmation) return;
    const timer = setTimeout(() => {
      setShowConfirmation(false);
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [showConfirmation, onClose]);

  // ─── Confirm selection and show summary overlay ───
  const handleConfirm = () => {
    if (!selected || showConfirmation) return;

    setSeasonTrainingFocus(selected);

    const focusConfig = FOCUS_AREAS.find(f => f.area === selected);
    const gains = projectedGains[selected] ?? {};
    const attrs = FOCUS_AREA_ATTRIBUTES[selected];

    setConfirmedFocus({
      label: focusConfig?.label ?? selected,
      multiplier: areaMultipliers[selected] ?? baseMultiplier,
      attrs: attrs.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
      gains,
    });
    setShowConfirmation(true);
  };

  // ─── Early return if no game state ───
  if (!gameState) return null;

  const { player } = gameState;
  const attributes = player.attributes;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70"
            onClick={showConfirmation ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-lg shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              onClick={showConfirmation ? undefined : onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#21262d] transition-all duration-150 z-10"
              style={{
                opacity: showConfirmation ? 0 : 1,
                pointerEvents: showConfirmation ? 'none' : 'auto',
              }}
            >
              <X className="h-4 w-4 text-[#8b949e]" />
            </button>

            {/* Header */}
            <div className="p-5 pb-3">
              <h2 className="text-lg font-bold text-[#c9d1d9]">
                Set Your Season Training Focus
              </h2>
              <p className="text-sm text-[#8b949e] mt-1.5 leading-relaxed">
                Choose a training focus for the season. Focused attributes receive a{' '}
                <span className="text-emerald-400 font-semibold">1.5x–2.0x</span>{' '}
                growth bonus based on your age, gametime, form, and potential.
              </p>
            </div>

            {/* Focus History Banner */}
            <AnimatePresence>
              {focusHistory && (
                <motion.div
                  className="mx-5 mb-3 px-3.5 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center gap-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <History className="h-4 w-4 text-[#8b949e] shrink-0" />
                  <span className="text-xs text-[#8b949e]">
                    Last season:{' '}
                    <span className="text-[#c9d1d9] font-semibold">
                      {focusHistory.label} Focus
                    </span>
                    <span className="text-emerald-400 ml-1.5 font-medium">
                      ({focusHistory.multiplier.toFixed(2)}x bonus)
                    </span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Focus Area Cards */}
            <div className="px-5 pb-3 space-y-2.5">
              {FOCUS_AREAS.map((focus, index) => {
                const focusAttrs = FOCUS_AREA_ATTRIBUTES[focus.area];
                const isSelected = selected === focus.area;
                const isRecommended = recommendedFocus === focus.area;
                const multiplier = areaMultipliers[focus.area] ?? baseMultiplier;
                const gains = projectedGains[focus.area] ?? {};

                return (
                  <motion.button
                    key={focus.area}
                    onClick={() => {
                      if (!showConfirmation) setSelected(focus.area);
                    }}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-[#161b22] border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon — larger */}
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${focus.accentBg} ${focus.accentText}`}
                      >
                        {focus.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top row: label, recommended tag, multiplier badge, check */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-[#c9d1d9]">
                              {focus.label}
                            </span>
                            {isRecommended && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/12 text-amber-400 text-[10px] font-semibold rounded">
                                <Sparkles className="h-2.5 w-2.5" />
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Multiplier badge — coloured by value */}
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded ${getMultiplierBadge(multiplier)}`}
                            >
                              {multiplier.toFixed(2)}x
                            </span>
                            {/* Selected check */}
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#8b949e] mt-0.5">{focus.description}</p>

                        {/* Attribute progress bars + projected gains */}
                        <div className="mt-2 space-y-1.5">
                          {focusAttrs.map(attr => {
                            const value = attributes[attr as keyof PlayerAttributes] ?? 0;
                            const gain = gains[attr] ?? 0;
                            const projected = Math.min(value + gain, 99);

                            return (
                              <div key={attr}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-[#8b949e] capitalize">
                                    {attr}
                                  </span>
                                  <span className="text-[10px]">
                                    <span className="text-[#8b949e]">{value}</span>
                                    <span className="text-[#484f58] mx-0.5">&rarr;</span>
                                    <span className="text-emerald-400 font-semibold">
                                      ~{projected}
                                    </span>
                                    {gain > 0 && (
                                      <span className="text-emerald-400/70 ml-0.5">
                                        (+{gain} est.)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {/* Tiny progress bar showing current value / 100 */}
                                <div className="h-1 bg-[#21262d] rounded mt-0.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded ${BAR_COLORS[focus.accentColor]}`}
                                    style={{ width: `${Math.min(value ?? 0, 99)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <div className="p-5 pt-3">
              <Button
                onClick={handleConfirm}
                disabled={!selected || showConfirmation}
                className={`w-full h-11 font-semibold rounded-lg transition-all duration-150 ${
                  selected && !showConfirmation
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                }`}
              >
                {showConfirmation
                  ? 'Locking Focus\u2026'
                  : selected
                    ? `Confirm ${FOCUS_AREAS.find(f => f.area === selected)?.label} Focus`
                    : 'Select a Focus Area'}
              </Button>
            </div>

            {/* ─── Confirmation Summary Overlay ─── */}
            <AnimatePresence>
              {showConfirmation && confirmedFocus && (
                <motion.div
                  className="absolute inset-0 z-10 bg-[#0d1117]/95 rounded-lg flex flex-col items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-center"
                  >
                    {/* Lock icon */}
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-6 w-6 text-emerald-400" />
                    </div>

                    <h3 className="text-base font-bold text-[#c9d1d9]">
                      Training Focus Locked
                    </h3>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      {confirmedFocus.label}
                    </p>

                    {/* Bonus badge */}
                    <div className="mt-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded inline-block">
                      <span className="text-xs text-[#8b949e]">Bonus: </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {confirmedFocus.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-xs text-[#8b949e]">
                        {' '}on {confirmedFocus.attrs.join(' & ')}
                      </span>
                    </div>

                    {/* Estimated growth */}
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-[#8b949e]">
                        Estimated season growth:{' '}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {formatGains(confirmedFocus.gains)}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
