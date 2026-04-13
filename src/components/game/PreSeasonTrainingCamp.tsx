'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type {
  GameState,
  PlayerAttributes,
  TrainingSession,
  TrainingType,
  CoreAttribute,
} from '@/lib/game/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Footprints,
  Target,
  ClipboardList,
  Dumbbell,
  Heart,
  Star,
  Zap,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Shield,
  Check,
  Flame,
  Calendar,
  BarChart3,
  Lightbulb,
  X,
  Award,
  ArrowUp,
  ArrowDown,
  Activity,
  MessageCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

interface CampTrainingType {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  improves: { attr: keyof PlayerAttributes; label: string; delta: [number, number] }[];
  energyCost: number;
  weekMultiplier: number[];
}

interface SlotAssignment {
  trainingId: string | null;
  completed: boolean;
  result: TrainingResult | null;
}

interface TrainingResult {
  gains: Partial<Record<keyof PlayerAttributes, number>>;
  ovrChange: number;
  fitnessChange: number;
  quality: 'excellent' | 'good' | 'average';
  message: string;
}

interface CampState {
  currentWeek: number;
  schedule: SlotAssignment[][]; // 4 weeks × 3 slots
  totalGains: Partial<Record<keyof PlayerAttributes, number>>;
  ovrChange: number;
  fitnessChange: number;
  isComplete: boolean;
}

const CAMP_WEEKS = 4;
const SLOTS_PER_WEEK = 3;

const CAMP_TRAINING_TYPES: CampTrainingType[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    icon: <Footprints className="h-4 w-4" />,
    description: 'Endurance drills, sprint training',
    color: '#10b981',
    improves: [
      { attr: 'pace', label: 'PAC', delta: [1, 2] },
      { attr: 'physical', label: 'PHY', delta: [1, 2] },
    ],
    energyCost: 2,
    weekMultiplier: [1.0, 1.1, 1.2, 1.3],
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: <Target className="h-4 w-4" />,
    description: 'Ball mastery, shooting drills',
    color: '#f59e0b',
    improves: [
      { attr: 'shooting', label: 'SHO', delta: [1, 2] },
      { attr: 'passing', label: 'PAS', delta: [1, 1] },
      { attr: 'dribbling', label: 'DRI', delta: [1, 1] },
    ],
    energyCost: 3,
    weekMultiplier: [1.0, 1.1, 1.2, 1.3],
  },
  {
    id: 'tactical',
    label: 'Tactical',
    icon: <ClipboardList className="h-4 w-4" />,
    description: 'Positioning, game intelligence',
    color: '#8b5cf6',
    improves: [
      { attr: 'passing', label: 'PAS', delta: [1, 2] },
      { attr: 'defending', label: 'DEF', delta: [1, 1] },
    ],
    energyCost: 1,
    weekMultiplier: [1.0, 1.1, 1.2, 1.3],
  },
  {
    id: 'strength',
    label: 'Strength',
    icon: <Dumbbell className="h-4 w-4" />,
    description: 'Gym work, physical conditioning',
    color: '#ef4444',
    improves: [
      { attr: 'physical', label: 'PHY', delta: [2, 3] },
      { attr: 'defending', label: 'DEF', delta: [1, 1] },
    ],
    energyCost: 3,
    weekMultiplier: [1.0, 1.1, 1.2, 1.3],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    icon: <Heart className="h-4 w-4" />,
    description: 'Rest, physio, light training',
    color: '#ec4899',
    improves: [],
    energyCost: 1,
    weekMultiplier: [1.0, 1.0, 1.0, 1.0],
  },
  {
    id: 'set_pieces',
    label: 'Set Pieces',
    icon: <Star className="h-4 w-4" />,
    description: 'Free kicks, penalties, corners',
    color: '#06b6d4',
    improves: [
      { attr: 'shooting', label: 'SHO', delta: [1, 3] },
    ],
    energyCost: 2,
    weekMultiplier: [1.0, 1.15, 1.25, 1.4],
  },
];

const ATTR_LABELS: Record<CoreAttribute, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

const ATTR_FULL: Record<CoreAttribute, string> = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

const CORE_ATTRS: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

const OPACITY_FAST = { duration: 0.15 };
const OPACITY_MED = { duration: 0.25 };

// ============================================================
// Helpers
// ============================================================

function buildEmptySchedule(): SlotAssignment[][] {
  return Array.from({ length: CAMP_WEEKS }, () =>
    Array.from({ length: SLOTS_PER_WEEK }, () => ({
      trainingId: null,
      completed: false,
      result: null,
    }))
  );
}

function buildEmptyCampState(): CampState {
  return {
    currentWeek: 1,
    schedule: buildEmptySchedule(),
    totalGains: {},
    ovrChange: 0,
    fitnessChange: 0,
    isComplete: false,
  };
}

// Deterministic training result from player stats + training type + week
function computeTrainingResult(
  trainingType: CampTrainingType,
  week: number,
  playerAttrs: PlayerAttributes,
  playerFitness: number,
  playerAge: number,
): TrainingResult {
  const gains: Partial<Record<keyof PlayerAttributes, number>> = {};
  let totalGainPoints = 0;

  for (const imp of trainingType.improves) {
    const currentVal = playerAttrs[imp.attr] ?? 50;
    const [minD, maxD] = imp.delta;
    const weekMult = trainingType.weekMultiplier[week - 1] ?? 1.0;

    // Diminishing returns: higher stats = less gain
    const diminishFactor = Math.max(0.3, 1 - (currentVal / 120));

    // Younger players gain more
    const ageFactor = playerAge < 20 ? 1.2 : playerAge < 25 ? 1.0 : playerAge < 30 ? 0.85 : 0.7;

    // Fitness factor: lower fitness = less effective
    const fitnessFactor = playerFitness > 70 ? 1.0 : playerFitness > 40 ? 0.8 : 0.5;

    // Deterministic base: use attribute value + week * training type char code sum for seed
    const seed = currentVal * 7 + week * 13 + trainingType.id.charCodeAt(0) * 3 + trainingType.id.charCodeAt(1) * 11;
    const normalizedSeed = ((seed % 100) / 100); // 0-1

    const baseGain = minD + normalizedSeed * (maxD - minD);
    const finalGain = Math.round(baseGain * weekMult * diminishFactor * ageFactor * fitnessFactor * 10) / 10;
    const clampedGain = Math.max(0, Math.round(finalGain * 2) / 2); // round to 0.5 steps

    if (clampedGain > 0) {
      gains[imp.attr] = clampedGain;
      totalGainPoints += clampedGain;
    }
  }

  // Recovery special: fitness boost
  if (trainingType.id === 'recovery') {
    const fitnessBoost = Math.round((8 + week * 2) * (playerFitness < 60 ? 1.3 : 1.0));
    return {
      gains: {},
      ovrChange: 0,
      fitnessChange: Math.min(fitnessBoost, 100 - playerFitness),
      quality: 'good',
      message: 'Good recovery session. Body is regenerating.',
    };
  }

  // OVR estimate (rough: average of gains * 0.4)
  const gainCount = Object.values(gains).length;
  const avgGain = gainCount > 0 ? totalGainPoints / gainCount : 0;
  const ovrChange = Math.round(avgGain * 0.4 * 10) / 10;

  let quality: TrainingResult['quality'];
  let message: string;
  if (totalGainPoints >= 4) {
    quality = 'excellent';
    message = 'Excellent session! Outstanding improvements across the board.';
  } else if (totalGainPoints >= 2) {
    quality = 'good';
    message = 'Good work! Solid progress in key areas.';
  } else {
    quality = 'average';
    message = 'Room for improvement. Keep pushing!';
  }

  return {
    gains,
    ovrChange,
    fitnessChange: -Math.round(trainingType.energyCost * 1.5),
    quality,
    message,
  };
}

function getAttrColor(val: number): string {
  if (val >= 80) return '#10b981';
  if (val >= 65) return '#10b981';
  if (val >= 50) return '#f59e0b';
  if (val >= 35) return '#f97316';
  return '#ef4444';
}

function getQualityColor(q: TrainingResult['quality']): string {
  switch (q) {
    case 'excellent': return '#10b981';
    case 'good': return '#f59e0b';
    case 'average': return '#8b949e';
  }
}

function getQualityBadge(q: TrainingResult['quality']): { label: string; color: string } {
  switch (q) {
    case 'excellent': return { label: 'Excellent Session!', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    case 'good': return { label: 'Good Work!', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    case 'average': return { label: 'Room for Improvement', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  }
}

function generateCoachTips(
  attrs: PlayerAttributes,
  position: string,
): { icon: React.ReactNode; tip: string; priority: 'high' | 'medium' | 'low' }[] {
  const tips: { icon: React.ReactNode; tip: string; priority: 'high' | 'medium' | 'low' }[] = [];
  const entries = CORE_ATTRS.map(a => ({ attr: a, val: attrs[a] ?? 50 }));
  entries.sort((a, b) => a.val - b.val);

  const weakest = entries[0];
  const strongest = entries[entries.length - 1];

  if (weakest) {
    tips.push({
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
      tip: `Focus on ${ATTR_FULL[weakest.attr]} (${weakest.val}) — it is your weakest area and needs attention.`,
      priority: 'high',
    });
  }

  if (strongest) {
    tips.push({
      icon: <Star className="h-3.5 w-3.5 text-emerald-400" />,
      tip: `Your ${ATTR_FULL[strongest.attr]} is excellent at ${strongest.val} — maintain it with regular sessions.`,
      priority: 'low',
    });
  }

  const secondWeakest = entries[1];
  if (secondWeakest && secondWeakest.val < 55) {
    tips.push({
      icon: <Target className="h-3.5 w-3.5 text-orange-400" />,
      tip: `${ATTR_FULL[secondWeakest.attr]} is also below par at ${secondWeakest.val}. Consider technical drills.`,
      priority: 'medium',
    });
  }

  // Position-specific tips
  const attackers = ['ST', 'CF', 'LW', 'RW'];
  const defenders = ['CB', 'LB', 'RB'];
  const midfielders = ['CDM', 'CM', 'CAM', 'LM', 'RM'];

  if (attackers.includes(position)) {
    if ((attrs.shooting ?? 50) < 65) {
      tips.push({
        icon: <Footprints className="h-3.5 w-3.5 text-cyan-400" />,
        tip: `As a ${position}, you need strong shooting. Current SHO is ${attrs.shooting ?? 50} — prioritize set pieces and technical drills.`,
        priority: 'high',
      });
    }
    if ((attrs.pace ?? 50) < 70) {
      tips.push({
        icon: <Zap className="h-3.5 w-3.5 text-emerald-400" />,
        tip: `Pace is critical for ${position} role. Add fitness sessions to improve your acceleration.`,
        priority: 'medium',
      });
    }
  }

  if (defenders.includes(position)) {
    if ((attrs.defending ?? 50) < 65) {
      tips.push({
        icon: <Shield className="h-3.5 w-3.5 text-emerald-400" />,
        tip: `Defending must be strong for ${position}. Current DEF is ${attrs.defending ?? 50}.`,
        priority: 'high',
      });
    }
    if ((attrs.physical ?? 50) < 60) {
      tips.push({
        icon: <Dumbbell className="h-3.5 w-3.5 text-red-400" />,
        tip: `Physical strength is essential in defense. Add strength training to your schedule.`,
        priority: 'medium',
      });
    }
  }

  if (midfielders.includes(position)) {
    if ((attrs.passing ?? 50) < 65) {
      tips.push({
        icon: <Target className="h-3.5 w-3.5 text-amber-400" />,
        tip: `Passing is the backbone of midfield play. Current PAS is ${attrs.passing ?? 50}.`,
        priority: 'high',
      });
    }
  }

  // Balance tip
  const avg = entries.reduce((s, e) => s + e.val, 0) / entries.length;
  const spread = entries[entries.length - 1].val - entries[0].val;
  if (spread > 30) {
    tips.push({
      icon: <BarChart3 className="h-3.5 w-3.5 text-purple-400" />,
      tip: `Your attributes are very unbalanced (${spread} point spread). Work on weaker areas to become more well-rounded.`,
      priority: 'medium',
    });
  }

  return tips.slice(0, 5);
}

function getPositionRecommendedFocus(position: string): string[] {
  const attackers = ['ST', 'CF', 'LW', 'RW'];
  const defenders = ['CB', 'LB', 'RB'];
  const midfielders = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
  const goalkeepers = ['GK'];

  if (attackers.includes(position)) return ['technical', 'fitness', 'set_pieces'];
  if (defenders.includes(position)) return ['strength', 'tactical', 'fitness'];
  if (midfielders.includes(position)) return ['tactical', 'technical', 'recovery'];
  if (goalkeepers.includes(position)) return ['strength', 'tactical', 'recovery'];
  return ['fitness', 'technical', 'tactical'];
}

// ============================================================
// Sub-Components
// ============================================================

function FitnessBar({ value, label, showLabel = true }: { value: number; label?: string; showLabel?: boolean }) {
  const color = value > 70 ? '#10b981' : value > 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">{label}</span>}
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
      )}
      <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
        <motion.div
          className="h-full rounded-md"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function TrainingTypeCard({
  training,
  playerAttrs,
  weekIndex,
  isCompletedThisWeek,
  onTrain,
  disabled,
}: {
  training: CampTrainingType;
  playerAttrs: PlayerAttributes;
  weekIndex: number;
  isCompletedThisWeek: boolean;
  onTrain: () => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={OPACITY_FAST}
      className="relative bg-[#161b22] border border-[#30363d] rounded-lg p-3 transition-opacity"
      style={{ borderLeft: `3px solid ${training.color}` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${training.color}18`, color: training.color }}
        >
          {training.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#c9d1d9]">{training.label}</span>
            <Badge className="h-4 px-1.5 text-[9px] font-bold rounded-md border-0"
              style={{ backgroundColor: `${training.color}15`, color: training.color }}>
              ⚡ {training.energyCost}
            </Badge>
            {isCompletedThisWeek && (
              <Badge className="h-4 px-1.5 text-[8px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
                <Check className="h-2.5 w-2.5 mr-0.5" /> DONE
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-[#8b949e] mt-0.5">{training.description}</p>

          {/* Improves */}
          {training.improves.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {training.improves.map((imp) => {
                const currentVal = playerAttrs[imp.attr] ?? 50;
                const mult = training.weekMultiplier[weekIndex] ?? 1.0;
                const [minG, maxG] = imp.delta;
                const projected = Math.round(minG * mult * 10) / 10;
                return (
                  <div key={imp.attr} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#21262d] border border-[#30363d]">
                    <span className="text-[10px] text-[#8b949e]">{imp.label}</span>
                    <span className="text-[9px] text-[#484f58]">{currentVal}</span>
                    <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">+{projected}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recovery special */}
          {training.id === 'recovery' && (
            <div className="flex items-center gap-1 mt-1.5">
              <Heart className="h-3 w-3 text-pink-400" />
              <span className="text-[10px] text-pink-300">Restores fitness and reduces fatigue</span>
            </div>
          )}

          {/* Train button */}
          {!isCompletedThisWeek && (
            <Button
              size="sm"
              onClick={onTrain}
              disabled={disabled}
              className="mt-2 h-7 text-[11px] font-semibold rounded-md px-3 border-0"
              style={{
                backgroundColor: disabled ? '#21262d' : `${training.color}20`,
                color: disabled ? '#484f58' : training.color,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {disabled ? 'Locked' : 'Train'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ScheduleGrid({
  schedule,
  currentWeek,
  onSelectSlot,
}: {
  schedule: SlotAssignment[][];
  currentWeek: number;
  onSelectSlot: (week: number, slot: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#8b949e]" />
          <span className="text-sm font-semibold text-[#c9d1d9]">Weekly Schedule</span>
        </div>
        <span className="text-[10px] text-[#8b949e]">
          {schedule.flat().filter(s => s.completed).length}/{CAMP_WEEKS * SLOTS_PER_WEEK} completed
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-2 min-w-[540px]" style={{ gridTemplateColumns: `repeat(${CAMP_WEEKS}, 1fr)` }}>
          {Array.from({ length: CAMP_WEEKS }, (_, wi) => (
            <div key={wi} className="space-y-1">
              {/* Week header */}
              <div className={`flex items-center justify-between px-2 py-1.5 rounded-md border ${
                wi === currentWeek - 1
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : wi < currentWeek - 1
                    ? 'border-[#30363d] bg-[#0d1117]/50'
                    : 'border-[#30363d] bg-[#161b22]'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  wi === currentWeek - 1 ? 'text-emerald-400' :
                  wi < currentWeek - 1 ? 'text-[#484f58]' : 'text-[#8b949e]'
                }`}>
                  {wi === currentWeek - 1 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />}
                  Week {wi + 1}
                </span>
                <span className="text-[9px] text-[#484f58]">
                  {schedule[wi]?.filter(s => s.completed).length ?? 0}/{SLOTS_PER_WEEK}
                </span>
              </div>

              {/* Slots */}
              {Array.from({ length: SLOTS_PER_WEEK }, (_, si) => {
                const slot = schedule[wi]?.[si];
                const trainingType = slot?.trainingId ? CAMP_TRAINING_TYPES.find(t => t.id === slot.trainingId) : null;
                const isCurrentWeek = wi === currentWeek - 1;
                const isPast = wi < currentWeek - 1;
                const isFuture = wi > currentWeek - 1;

                return (
                  <motion.button
                    key={si}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: si * 0.03 }}
                    onClick={() => isCurrentWeek && !slot?.completed && onSelectSlot(wi, si)}
                    disabled={!isCurrentWeek || slot?.completed}
                    className={`relative w-full p-2 rounded-md border text-left transition-opacity min-h-[52px] ${
                      slot?.completed
                        ? 'border-[#30363d] bg-[#0d1117]/50'
                        : isCurrentWeek && !slot?.trainingId
                          ? 'border-dashed border-[#484f58] bg-[#161b22] cursor-pointer hover:border-[#8b949e]'
                          : isCurrentWeek && slot?.trainingId
                            ? 'border-[#484f58] bg-[#161b22] cursor-pointer hover:border-[#8b949e]'
                            : isFuture
                              ? 'border-[#21262d] bg-[#0d1117]/30 opacity-40 cursor-not-allowed'
                              : 'border-[#30363d] bg-[#0d1117]/50 cursor-default'
                    }`}
                  >
                    {trainingType && slot ? (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${trainingType.color}18`, color: trainingType.color }}
                        >
                          {trainingType.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-medium text-[#c9d1d9] block truncate">{trainingType.label}</span>
                          {slot.completed ? (
                            <span className="text-[8px] text-emerald-500/70">Completed</span>
                          ) : (
                            <span className="text-[8px] text-[#484f58]">Assigned</span>
                          )}
                        </div>
                        {slot.completed && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                      </div>
                    ) : isFuture ? (
                      <div className="flex items-center justify-center h-full">
                        <Lock className="h-3 w-3 text-[#30363d]" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[10px] text-[#484f58]">+ Assign</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TrainingResultsModal({
  result,
  training,
  onClose,
}: {
  result: TrainingResult;
  training: CampTrainingType;
  onClose: () => void;
}) {
  const qualityBadge = getQualityBadge(result.quality);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={OPACITY_MED}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal content */}
      <Card
        className="relative bg-[#161b22] border-[#30363d] rounded-lg w-full max-w-sm z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-5 space-y-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded-md bg-[#21262d] flex items-center justify-center hover:bg-[#30363d] transition-opacity"
          >
            <X className="h-3.5 w-3.5 text-[#8b949e]" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${training.color}18`, color: training.color }}
            >
              {training.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#c9d1d9]">{training.label} Complete</h3>
              <p className="text-[11px] text-[#8b949e]">Training session results</p>
            </div>
          </div>

          {/* Quality badge */}
          <Badge className={`w-full justify-center h-7 text-xs font-bold rounded-md border ${qualityBadge.color}`}>
            {qualityBadge.label}
          </Badge>

          {/* Skill gains */}
          {Object.keys(result.gains).length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Skill Gains</span>
              <div className="space-y-1.5">
                {Object.entries(result.gains).map(([attr, gain]) => (
                  <div key={attr} className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
                    <span className="text-sm text-[#c9d1d9] font-medium">
                      {ATTR_LABELS[attr as CoreAttribute] ?? attr.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">+{gain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OVR change */}
          {result.ovrChange !== 0 && (
            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-[#c9d1d9] font-medium">Overall Rating</span>
              </div>
              <span className={`text-sm font-bold ${result.ovrChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.ovrChange > 0 ? '+' : ''}{result.ovrChange}
              </span>
            </div>
          )}

          {/* Fitness change */}
          {result.fitnessChange !== 0 && (
            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-400" />
                <span className="text-sm text-[#c9d1d9] font-medium">Fitness</span>
              </div>
              <span className={`text-sm font-bold ${result.fitnessChange > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.fitnessChange > 0 ? '+' : ''}{result.fitnessChange}%
              </span>
            </div>
          )}

          {/* Message */}
          <div className="flex items-start gap-2 bg-[#21262d] rounded-md p-3">
            <MessageCircle className="h-4 w-4 text-[#8b949e] mt-0.5 shrink-0" />
            <p className="text-xs text-[#c9d1d9] leading-relaxed">{result.message}</p>
          </div>

          {/* Close button */}
          <Button
            onClick={onClose}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md border-0"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CampCompletionSummary({
  campState,
  playerAttrs,
  playerOvr,
  playerFitness,
  playerAge,
  season,
  onReset,
}: {
  campState: CampState;
  playerAttrs: PlayerAttributes;
  playerOvr: number;
  playerFitness: number;
  playerAge: number;
  season: number;
  onReset: () => void;
}) {
  const completedCount = campState.schedule.flat().filter(s => s.completed).length;
  const totalPossible = CAMP_WEEKS * SLOTS_PER_WEEK;
  const completionPct = Math.round((completedCount / totalPossible) * 100);

  // Calculate projected new attributes
  const projectedAttrs: Partial<Record<keyof PlayerAttributes, number>> = {};
  for (const attr of CORE_ATTRS) {
    const totalGain = Object.entries(campState.totalGains)
      .filter(([k]) => k === attr)
      .reduce((sum, [, v]) => sum + (v ?? 0), 0);
    projectedAttrs[attr] = Math.min(99, Math.round(((playerAttrs[attr] ?? 50) + totalGain) * 10) / 10);
  }

  const newOvr = playerOvr + campState.ovrChange;
  const newFitness = Math.min(100, Math.max(0, Math.round((playerFitness + campState.fitnessChange) * 10) / 10));

  const readinessScore = Math.min(100, Math.round(
    (completionPct * 0.4) + (newFitness * 0.3) + (campState.ovrChange > 0 ? 30 : 10)
  ));

  const readinessLabel = readinessScore >= 85 ? 'Fully Ready' : readinessScore >= 65 ? 'Good Shape' : readinessScore >= 45 ? 'Needs Work' : 'Underprepared';
  const readinessColor = readinessScore >= 85 ? '#10b981' : readinessScore >= 65 ? '#f59e0b' : readinessScore >= 45 ? '#f97316' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={OPACITY_MED}
      className="space-y-4"
    >
      {/* Header banner */}
      <Card className="bg-emerald-500/10 border-emerald-500/30">
        <CardContent className="p-4 text-center space-y-2">
          <Award className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-emerald-300">Camp Complete!</h3>
          <Badge className="h-6 px-3 text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border-emerald-500/40 rounded-md">
            Ready for Season {season}!
          </Badge>
        </CardContent>
      </Card>

      {/* Summary stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Sessions completed */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Sessions</span>
            <p className="text-xl font-bold text-[#c9d1d9] mt-1">{completedCount}<span className="text-sm text-[#484f58]">/{totalPossible}</span></p>
          </CardContent>
        </Card>

        {/* New OVR */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">New OVR</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-sm text-[#484f58]">{playerOvr}</span>
              <ArrowUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xl font-bold text-emerald-400">{Math.round(newOvr)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fitness */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Fitness</span>
            <p className="text-xl font-bold mt-1" style={{ color: getAttrColor(newFitness) }}>{Math.round(newFitness)}%</p>
          </CardContent>
        </Card>

        {/* Readiness */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Readiness</span>
            <p className="text-sm font-bold mt-1" style={{ color: readinessColor }}>{readinessLabel}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: readinessColor }}>{readinessScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Attribute changes */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Attribute Changes</span>
          <div className="grid grid-cols-3 gap-2">
            {CORE_ATTRS.map((attr) => {
              const oldVal = playerAttrs[attr] ?? 50;
              const gain = campState.totalGains[attr] ?? 0;
              const newVal = Math.min(99, Math.round((oldVal + gain) * 10) / 10);
              return (
                <div key={attr} className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-center">
                  <span className="text-[10px] text-[#8b949e] font-medium">{ATTR_LABELS[attr]}</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-sm text-[#484f58]">{Math.round(oldVal)}</span>
                    {gain > 0 && (
                      <>
                        <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">{newVal}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reset button */}
      <Button
        onClick={onReset}
        variant="outline"
        className="w-full h-9 border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] text-sm rounded-md"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-2" />
        Restart Camp
      </Button>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PreSeasonTrainingCamp() {
  const gameState = useGameStore((s) => s.gameState);
  const player = gameState?.player ?? null;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const year = gameState?.year ?? new Date().getFullYear();

  const [campState, setCampState] = useState<CampState>(buildEmptyCampState);
  const [selectedSlot, setSelectedSlot] = useState<{ week: number; slot: number } | null>(null);
  const [resultModal, setResultModal] = useState<{ result: TrainingResult; training: CampTrainingType } | null>(null);
  const [activeTab, setActiveTab] = useState<'train' | 'schedule' | 'assessment' | 'tips'>('train');

  // Derived
  const schedule = campState.schedule;
  const completedThisWeek = schedule[campState.currentWeek - 1]?.filter(s => s.completed).length ?? 0;
  const totalCompleted = schedule.flat().filter(s => s.completed).length ?? 0;
  const totalPossible = CAMP_WEEKS * SLOTS_PER_WEEK;
  const trainingLoadPct = Math.round((totalCompleted / totalPossible) * 100);

  // Simulated fitness for camp (starts from player fitness, modified by camp activities)
  const campFitness = useMemo(() => {
    if (!player) return 70;
    return Math.max(0, Math.min(100, player.fitness + campState.fitnessChange));
  }, [player, campState.fitnessChange]);

  // Coach tips
  const coachTips = useMemo(() => {
    if (!player) return [];
    return generateCoachTips(player.attributes, player.position);
  }, [player]);

  // Recommended training for position
  const recommendedFocus = useMemo(() => {
    if (!player) return [];
    return getPositionRecommendedFocus(player.position);
  }, [player]);

  // Expected total gains if all slots filled with recommended
  const expectedGrowth = useMemo(() => {
    if (!player) return {};
    const gains: Record<string, number> = {};
    const trainingMap = Object.fromEntries(CAMP_TRAINING_TYPES.map(t => [t.id, t]));

    for (const week of schedule) {
      for (const slot of week) {
        if (slot.trainingId && !slot.completed) {
          const tt = trainingMap[slot.trainingId];
          if (!tt) continue;
          const weekIdx = schedule.indexOf(week);
          const result = computeTrainingResult(tt, weekIdx + 1, player.attributes, campFitness, player.age);
          for (const [attr, gain] of Object.entries(result.gains)) {
            gains[attr] = (gains[attr] ?? 0) + (gain ?? 0);
          }
        }
      }
    }

    // Also add future potential for unassigned slots
    for (const attr of CORE_ATTRS) {
      if (!gains[attr]) gains[attr] = 0;
    }
    return gains;
  }, [player, schedule, campFitness]);

  // Handlers
  const handleSelectSlot = useCallback((week: number, slot: number) => {
    if (week !== campState.currentWeek - 1) return;
    const currentSlot = schedule[week]?.[slot];
    if (currentSlot?.completed) return;

    setSelectedSlot((prev) => {
      if (prev && prev.week === week && prev.slot === slot) return null;
      return { week, slot };
    });
  }, [campState.currentWeek, schedule]);

  const handleAssignTraining = useCallback((trainingId: string) => {
    if (!selectedSlot) return;
    const { week, slot } = selectedSlot;

    setCampState(prev => {
      const newSchedule = prev.schedule.map(w => w.map(s => ({ ...s })));
      newSchedule[week][slot] = {
        trainingId,
        completed: false,
        result: null,
      };
      return { ...prev, schedule: newSchedule };
    });
    setSelectedSlot(null);
  }, [selectedSlot]);

  const handleTrain = useCallback((trainingId: string) => {
    const training = CAMP_TRAINING_TYPES.find(t => t.id === trainingId);
    if (!training || !player) return;

    // Check if already completed this type this week
    const currentWeekSchedule = campState.schedule[campState.currentWeek - 1];
    if (currentWeekSchedule?.some(s => s.trainingId === trainingId && s.completed)) return;

    const result = computeTrainingResult(
      training,
      campState.currentWeek,
      player.attributes,
      campFitness,
      player.age,
    );

    // Update camp state
    setCampState(prev => {
      const newSchedule = prev.schedule.map(w => w.map(s => ({ ...s })));
      const weekSchedule = newSchedule[prev.currentWeek - 1];

      // Find first available slot or assign to an existing matching slot
      let assigned = false;
      for (let i = 0; i < SLOTS_PER_WEEK; i++) {
        if (weekSchedule[i].trainingId === trainingId && !weekSchedule[i].completed) {
          weekSchedule[i].completed = true;
          weekSchedule[i].result = result;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        for (let i = 0; i < SLOTS_PER_WEEK; i++) {
          if (!weekSchedule[i].trainingId) {
            weekSchedule[i] = { trainingId, completed: true, result };
            assigned = true;
            break;
          }
        }
      }

      // Accumulate gains
      const newTotalGains = { ...prev.totalGains };
      for (const [attr, gain] of Object.entries(result.gains)) {
        newTotalGains[attr as keyof PlayerAttributes] = (newTotalGains[attr as keyof PlayerAttributes] ?? 0) + (gain ?? 0);
      }

      const newOvrChange = prev.ovrChange + result.ovrChange;
      const newFitnessChange = prev.fitnessChange + result.fitnessChange;

      // Check if week is complete
      const isWeekComplete = weekSchedule.every(s => s.completed);
      let newCurrentWeek = prev.currentWeek;
      let isComplete = prev.isComplete;
      if (isWeekComplete && newCurrentWeek < CAMP_WEEKS) {
        newCurrentWeek++;
      }
      if (isWeekComplete && newCurrentWeek >= CAMP_WEEKS) {
        isComplete = true;
      }

      return {
        ...prev,
        schedule: newSchedule,
        currentWeek: newCurrentWeek,
        totalGains: newTotalGains,
        ovrChange: Math.round(newOvrChange * 10) / 10,
        fitnessChange: newFitnessChange,
        isComplete,
      };
    });

    // Show result modal
    setResultModal({ result, training });
  }, [player, campState.currentWeek, campState.schedule, campFitness]);

  const handleClearSlot = useCallback((week: number, slot: number) => {
    setCampState(prev => {
      const newSchedule = prev.schedule.map(w => w.map(s => ({ ...s })));
      newSchedule[week][slot] = { trainingId: null, completed: false, result: null };
      return { ...prev, schedule: newSchedule };
    });
  }, []);

  const handleResetCamp = useCallback(() => {
    setCampState(buildEmptyCampState());
    setSelectedSlot(null);
    setResultModal(null);
  }, []);

  // Guard: no player data
  if (!gameState || !player) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Calendar className="h-8 h-8 text-[#30363d] mx-auto" />
          <p className="text-sm text-[#8b949e]">No active career found.</p>
        </div>
      </div>
    );
  }

  // Tab definitions
  const tabs = [
    { id: 'train' as const, label: 'Train', icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { id: 'schedule' as const, label: 'Schedule', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'assessment' as const, label: 'Assess', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'tips' as const, label: 'Tips', icon: <Lightbulb className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
      {/* Result Modal */}
      <AnimatePresence>
        {resultModal && (
          <TrainingResultsModal
            result={resultModal.result}
            training={resultModal.training}
            onClose={() => setResultModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Training Picker (slot selected) */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OPACITY_MED}
            className="fixed inset-0 z-40 flex items-end justify-center"
            onClick={() => setSelectedSlot(null)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <Card
              className="relative z-10 bg-[#161b22] border-[#30363d] rounded-t-lg w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-[#c9d1d9]">
                      Week {selectedSlot.week + 1}, Slot {selectedSlot.slot + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="w-6 h-6 rounded-md bg-[#21262d] flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5 text-[#8b949e]" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {CAMP_TRAINING_TYPES.map((tt) => (
                    <motion.button
                      key={tt.id}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                      onClick={() => handleAssignTraining(tt.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-md border border-[#30363d] bg-[#0d1117] hover:border-[#484f58] transition-opacity text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tt.color}18`, color: tt.color }}>
                        {tt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[#c9d1d9]">{tt.label}</span>
                        <p className="text-[10px] text-[#8b949e]">{tt.description}</p>
                      </div>
                      <Badge className="h-4 px-1.5 text-[9px] font-bold rounded-md border-0 shrink-0"
                        style={{ backgroundColor: `${tt.color}15`, color: tt.color }}>
                        ⚡ {tt.energyCost}
                      </Badge>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Header ---- */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={OPACITY_FAST}
        className="pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">
              Pre-Season Training Camp
            </h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Season {currentSeason} · {year} · {player.name}
            </p>
          </div>
          <Badge className="h-6 px-2.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
            {campState.isComplete ? '✓ Complete' : `Week ${campState.currentWeek}/${CAMP_WEEKS}`}
          </Badge>
        </div>
      </motion.header>

      {/* ---- Camp Overview Card ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4 space-y-3">
            {/* Week indicators */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Camp Progress</span>
              <span className="text-[10px] text-[#8b949e]">{totalCompleted}/{totalPossible} sessions</span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: CAMP_WEEKS }, (_, i) => {
                const weekCompleted = schedule[i]?.every(s => s.completed) ?? false;
                const isCurrent = i === campState.currentWeek - 1 && !campState.isComplete;
                const hasSome = schedule[i]?.some(s => s.completed) ?? false;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-1.5 rounded-md ${
                      weekCompleted ? 'bg-emerald-500' :
                      hasSome ? 'bg-emerald-500/40' :
                      isCurrent ? 'bg-amber-400' :
                      'bg-[#21262d]'
                    }`} />
                    <span className={`text-[9px] font-semibold ${
                      weekCompleted ? 'text-emerald-400' :
                      isCurrent ? 'text-amber-400' :
                      'text-[#484f58]'
                    }`}>
                      {isCurrent ? `W${i + 1} ▸` : `W${i + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Training Load & Fitness */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#21262d]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Training Load</span>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{trainingLoadPct}%</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                  <motion.div
                    className="h-full rounded-md bg-amber-400"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: `${trainingLoadPct}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="h-2.5 w-2.5 text-amber-400" />
                  <span className="text-[9px] text-[#484f58]">
                    {completedThisWeek}/{SLOTS_PER_WEEK} this week
                  </span>
                </div>
              </div>
              <div>
                <FitnessBar value={campFitness} label="Fitness" />
                <div className="flex items-center gap-1 mt-1">
                  <Heart className="h-2.5 w-2.5 text-pink-400" />
                  <span className="text-[9px] text-[#484f58]">
                    {campState.fitnessChange >= 0 ? '+' : ''}{campState.fitnessChange}% change
                  </span>
                </div>
              </div>
            </div>

            {/* Fatigue risk */}
            {trainingLoadPct >= 75 && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-300 font-medium">Warning: High intensity may cause fatigue</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ---- Tab Navigation ---- */}
      <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-opacity ${
              activeTab === tab.id
                ? 'bg-[#0d1117] text-emerald-400 shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ---- Tab Content ---- */}

      {/* TRAIN TAB */}
      {activeTab === 'train' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={OPACITY_MED}
          className="space-y-3"
        >
          {/* Recommended focus */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">
                  Recommended for {player.position}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recommendedFocus.map((id) => {
                  const tt = CAMP_TRAINING_TYPES.find(t => t.id === id);
                  if (!tt) return null;
                  return (
                    <div key={id} className="flex items-center gap-1 px-2 py-1 rounded-md border"
                      style={{ backgroundColor: `${tt.color}10`, borderColor: `${tt.color}30`, color: tt.color }}>
                      {tt.icon}
                      <span className="text-[10px] font-semibold">{tt.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current player attributes summary */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Current Attributes</span>
                <Badge className="ml-auto h-4 px-1.5 text-[9px] font-bold bg-amber-500/15 text-amber-300 border-amber-500/30 rounded-md">
                  OVR {player.overall}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {CORE_ATTRS.map((attr) => {
                  const val = player.attributes[attr] ?? 50;
                  const gain = campState.totalGains[attr] ?? 0;
                  return (
                    <div key={attr} className="bg-[#0d1117] border border-[#30363d] rounded-md p-1.5 text-center">
                      <span className="text-[9px] text-[#8b949e] font-medium">{ATTR_LABELS[attr]}</span>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        <span className="text-base font-bold" style={{ color: getAttrColor(val) }}>{val}</span>
                        {gain > 0 && <ArrowUp className="h-2 w-2 text-emerald-400" />}
                      </div>
                      {gain > 0 && <span className="text-[8px] text-emerald-400">+{gain}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Training type cards */}
          <div className="space-y-2">
            {CAMP_TRAINING_TYPES.map((tt) => {
              const isCompletedThisWeek = campState.schedule[campState.currentWeek - 1]
                ?.some(s => s.trainingId === tt.id && s.completed) ?? false;
              const isDisabled = completedThisWeek >= SLOTS_PER_WEEK || campState.isComplete;

              return (
                <TrainingTypeCard
                  key={tt.id}
                  training={tt}
                  playerAttrs={player.attributes}
                  weekIndex={campState.currentWeek - 1}
                  isCompletedThisWeek={isCompletedThisWeek}
                  onTrain={() => handleTrain(tt.id)}
                  disabled={isDisabled}
                />
              );
            })}
          </div>

          {/* All slots used message */}
          {completedThisWeek >= SLOTS_PER_WEEK && !campState.isComplete && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-3 flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Week {campState.currentWeek} Complete!</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    {campState.currentWeek < CAMP_WEEKS
                      ? `Next week's training slots are now available.`
                      : 'Camp training is complete!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={OPACITY_MED}
          className="space-y-3"
        >
          <ScheduleGrid
            schedule={schedule}
            currentWeek={campState.currentWeek}
            onSelectSlot={handleSelectSlot}
          />

          {/* Clear assigned but uncompleted slots */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCamp}
              className="flex-1 h-8 text-[11px] border-[#30363d] text-[#8b949e] hover:text-red-400 hover:border-red-500/30 rounded-md"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset Camp
            </Button>
          </div>

          {/* Current week detail */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 space-y-2">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">
                Week {campState.currentWeek} Detail
              </span>
              {schedule[campState.currentWeek - 1]?.map((slot, i) => {
                const tt = slot.trainingId ? CAMP_TRAINING_TYPES.find(t => t.id === slot.trainingId) : null;
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#21262d] last:border-0">
                    <div className="flex items-center gap-2">
                      {tt ? (
                        <>
                          <div className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${tt.color}18`, color: tt.color }}>
                            {tt.icon}
                          </div>
                          <span className="text-xs text-[#c9d1d9]">{tt.label}</span>
                        </>
                      ) : (
                        <span className="text-xs text-[#484f58] italic">Empty slot</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.completed && <Badge className="h-4 px-1.5 text-[8px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">Done</Badge>}
                      {!slot.completed && slot.trainingId && (
                        <button
                          onClick={() => handleClearSlot(campState.currentWeek - 1, i)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 transition-opacity"
                        >
                          <X className="h-3 w-3 text-[#484f58]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ASSESSMENT TAB */}
      {activeTab === 'assessment' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={OPACITY_MED}
          className="space-y-3"
        >
          {/* Before/After comparison */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">
                  Expected Growth
                </span>
              </div>
              <div className="space-y-1.5">
                {CORE_ATTRS.map((attr) => {
                  const currentVal = player.attributes[attr] ?? 50;
                  const projectedGain = expectedGrowth[attr] ?? 0;
                  const campGain = campState.totalGains[attr] ?? 0;
                  const projectedTotal = Math.round(Math.min(99, currentVal + projectedGain + campGain));
                  return (
                    <div key={attr} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8b949e] w-8 shrink-0 font-medium">{ATTR_LABELS[attr]}</span>
                      <div className="flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden relative">
                        <div className="absolute h-full rounded-md bg-[#30363d]" style={{ width: `${currentVal}%` }} />
                        {projectedTotal > currentVal && (
                          <motion.div
                            className="absolute h-full rounded-md bg-emerald-500/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{ left: `${currentVal}%`, width: `${projectedTotal - currentVal}%` }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#c9d1d9] w-8 text-right">{currentVal}</span>
                      {projectedTotal > currentVal && (
                        <>
                          <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400 w-8 text-right">{projectedTotal}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* OVR projection */}
              <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-[#c9d1d9]">Projected OVR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[#484f58]">{player.overall}</span>
                  <ArrowUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">
                    {Math.round(player.overall + campState.ovrChange)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total camp gains summary */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">
                  Total Camp Gains
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {CORE_ATTRS.map((attr) => {
                  const gain = campState.totalGains[attr] ?? 0;
                  return (
                    <div key={attr} className="bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-center">
                      <span className="text-[9px] text-[#8b949e] font-medium">{ATTR_LABELS[attr]}</span>
                      <p className={`text-lg font-bold mt-0.5 ${gain > 0 ? 'text-emerald-400' : 'text-[#30363d]'}`}>
                        {gain > 0 ? `+${gain}` : '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
                <span className="text-xs text-[#8b949e]">Total OVR Change</span>
                <span className={`text-sm font-bold ${campState.ovrChange > 0 ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                  {campState.ovrChange > 0 ? '+' : ''}{campState.ovrChange}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Position-specific recommendation */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">
                  Position Focus — {player.position}
                </span>
              </div>
              <div className="space-y-1.5">
                {recommendedFocus.map((id, i) => {
                  const tt = CAMP_TRAINING_TYPES.find(t => t.id === id);
                  if (!tt) return null;
                  const isPriority = i === 0;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-md p-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tt.color}18`, color: tt.color }}>
                        {tt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[#c9d1d9]">{tt.label}</span>
                          {isPriority && (
                            <Badge className="h-3.5 px-1 text-[7px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-sm">
                              PRIORITY
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8b949e]">{tt.description}</span>
                      </div>
                      <span className="text-[10px] text-[#484f58]">⚡ {tt.energyCost}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Risk indicators */}
          <Card className="bg-[#161b22] border border-amber-600/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-400 uppercase tracking-wide font-medium">
                  Risk Assessment
                </span>
              </div>
              {trainingLoadPct >= 75 && (
                <div className="flex items-center gap-2 text-[11px] text-amber-300">
                  <Flame className="h-3 w-3" />
                  <span>High intensity may cause fatigue — consider adding recovery sessions</span>
                </div>
              )}
              {campFitness < 40 && (
                <div className="flex items-center gap-2 text-[11px] text-red-300">
                  <Heart className="h-3 w-3" />
                  <span>Low fitness detected — prioritize recovery to avoid injury risk</span>
                </div>
              )}
              {trainingLoadPct < 50 && !campState.isComplete && (
                <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
                  <Clock className="h-3 w-3" />
                  <span>Training load is below optimal — more sessions will yield better results</span>
                </div>
              )}
              {trainingLoadPct >= 50 && trainingLoadPct < 75 && campFitness >= 40 && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                  <Shield className="h-3 w-3" />
                  <span>Training load is well balanced — maintain this pace</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* TIPS TAB */}
      {activeTab === 'tips' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={OPACITY_MED}
          className="space-y-3"
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-[#c9d1d9]">Coach Tips</span>
              </div>
              <div className="space-y-2">
                {coachTips.map((tip, i) => {
                  const priorityBorder = tip.priority === 'high' ? 'border-amber-500/30' :
                    tip.priority === 'medium' ? 'border-[#30363d]' : 'border-[#30363d]';
                  const priorityBg = tip.priority === 'high' ? 'bg-amber-500/5' : 'bg-[#0d1117]';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: i * 0.04 }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border ${priorityBorder} ${priorityBg}`}
                    >
                      <div className="mt-0.5 shrink-0">{tip.icon}</div>
                      <p className="text-[11px] text-[#c9d1d9] leading-relaxed">{tip.tip}</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Player summary card for tips context */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 space-y-2">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Player Profile</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Position</span>
                  <Badge className="h-4 px-1.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
                    {player.position}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Age</span>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{player.age}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Potential</span>
                  <span className="text-[10px] font-bold text-amber-400">{player.potential}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Form</span>
                  <span className="text-[10px] font-bold" style={{ color: player.form >= 7 ? '#10b981' : player.form >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {player.form.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Morale</span>
                  <span className="text-[10px] font-bold" style={{ color: player.morale > 70 ? '#10b981' : player.morale > 40 ? '#f59e0b' : '#ef4444' }}>
                    {player.morale}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Rep</span>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{player.reputation}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ---- Camp Completion Summary (replaces content when done) ---- */}
      {campState.isComplete && (
        <div className="mt-4">
          <CampCompletionSummary
            campState={campState}
            playerAttrs={player.attributes}
            playerOvr={player.overall}
            playerFitness={player.fitness}
            playerAge={player.age}
            season={currentSeason}
            onReset={handleResetCamp}
          />
        </div>
      )}
    </div>
  );
}
