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
  LayoutGrid,
  Sun,
  Moon,
  User,
  Crown,
  Camera,
  Play,
  ChevronDown,
  BookOpen,
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
  difficulty: 1 | 2 | 3;
  duration: string;
  intensityLabel: string;
  intensityLevel: number;
  focusAttr: string;
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
  intensity: 'light' | 'moderate' | 'intense';
}

interface TeammateInfo {
  name: string;
  position: string;
  overall: number;
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
    difficulty: 2,
    duration: '45 min',
    intensityLabel: 'Medium',
    intensityLevel: 2,
    focusAttr: 'Pace & Physical',
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
    difficulty: 3,
    duration: '60 min',
    intensityLabel: 'High',
    intensityLevel: 3,
    focusAttr: 'Shooting & Passing',
  },
  {
    id: 'tactical',
    label: 'Tactical',
    icon: <LayoutGrid className="h-4 w-4" />,
    description: 'Positioning, game intelligence',
    color: '#8b5cf6',
    improves: [
      { attr: 'passing', label: 'PAS', delta: [1, 2] },
      { attr: 'defending', label: 'DEF', delta: [1, 1] },
    ],
    energyCost: 1,
    weekMultiplier: [1.0, 1.1, 1.2, 1.3],
    difficulty: 2,
    duration: '40 min',
    intensityLabel: 'Low',
    intensityLevel: 1,
    focusAttr: 'Passing & Defending',
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
    difficulty: 3,
    duration: '55 min',
    intensityLabel: 'High',
    intensityLevel: 3,
    focusAttr: 'Physical & Defending',
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
    difficulty: 1,
    duration: '30 min',
    intensityLabel: 'Low',
    intensityLevel: 1,
    focusAttr: 'Fitness Recovery',
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
    difficulty: 2,
    duration: '50 min',
    intensityLabel: 'Medium',
    intensityLevel: 2,
    focusAttr: 'Shooting',
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

const INTENSITY_CONFIG = {
  light: { label: 'Light', color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', xpMult: 0.6, riskLabel: 'Low fatigue risk', ovrBonus: 0 },
  moderate: { label: 'Moderate', color: '#f59e0b', bg: 'bg-amber-500/15', border: 'border-amber-500/40', xpMult: 1.0, riskLabel: 'Moderate fatigue risk', ovrBonus: 0 },
  intense: { label: 'Intense', color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/40', xpMult: 1.4, riskLabel: 'High fatigue risk', ovrBonus: 1 },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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
    intensity: 'moderate',
  };
}

// Deterministic training result from player stats + training type + week
function computeTrainingResult(
  trainingType: CampTrainingType,
  week: number,
  playerAttrs: PlayerAttributes,
  playerFitness: number,
  playerAge: number,
  intensity: 'light' | 'moderate' | 'intense' = 'moderate',
): TrainingResult {
  const gains: Partial<Record<keyof PlayerAttributes, number>> = {};
  let totalGainPoints = 0;
  const intensityMult = INTENSITY_CONFIG[intensity].xpMult;

  for (const imp of trainingType.improves) {
    const currentVal = playerAttrs[imp.attr] ?? 50;
    const [minD, maxD] = imp.delta;
    const weekMult = trainingType.weekMultiplier[week - 1] ?? 1.0;

    const diminishFactor = Math.max(0.3, 1 - (currentVal / 120));
    const ageFactor = playerAge < 20 ? 1.2 : playerAge < 25 ? 1.0 : playerAge < 30 ? 0.85 : 0.7;
    const fitnessFactor = playerFitness > 70 ? 1.0 : playerFitness > 40 ? 0.8 : 0.5;

    const seed = currentVal * 7 + week * 13 + trainingType.id.charCodeAt(0) * 3 + trainingType.id.charCodeAt(1) * 11;
    const normalizedSeed = ((seed % 100) / 100);

    const baseGain = minD + normalizedSeed * (maxD - minD);
    const finalGain = Math.round(baseGain * weekMult * diminishFactor * ageFactor * fitnessFactor * intensityMult * 10) / 10;
    const clampedGain = Math.max(0, Math.round(finalGain * 2) / 2);

    if (clampedGain > 0) {
      gains[imp.attr] = clampedGain;
      totalGainPoints += clampedGain;
    }
  }

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

  const gainCount = Object.values(gains).length;
  const avgGain = gainCount > 0 ? totalGainPoints / gainCount : 0;
  const ovrChange = Math.round(avgGain * 0.4 * 10) / 10 + INTENSITY_CONFIG[intensity].ovrBonus;

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

  const fatigueCost = intensity === 'intense' ? Math.round(trainingType.energyCost * 2) : intensity === 'light' ? Math.round(trainingType.energyCost * 1) : Math.round(trainingType.energyCost * 1.5);

  return {
    gains,
    ovrChange,
    fitnessChange: -fatigueCost,
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

// Deterministic camp MVP teammate
function getCampMVP(playerName: string, totalGains: Partial<Record<keyof PlayerAttributes, number>>, ovrChange: number): TeammateInfo {
  const names = ['Marcus Silva', 'Lucas Müller', 'Kenji Tanaka', 'Carlos Ruiz', 'Ahmed Hassan', 'James Cooper', 'Pieter van Berg', 'Antoine Dupont'];
  let hash = 0;
  for (let i = 0; i < playerName.length; i++) {
    hash = ((hash << 5) - hash) + playerName.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % names.length;
  const positions = ['CM', 'ST', 'CB', 'LW', 'CAM', 'CDM'];
  return {
    name: names[idx],
    position: positions[Math.abs(hash + 3) % positions.length],
    overall: 72 + Math.abs(hash % 15),
  };
}

// Deterministic weekly schedule for SVG timeline
function generateWeeklySchedule(): { day: string; drillId: string | null; isRest: boolean }[][] {
  const schedules: { day: string; drillId: string | null; isRest: boolean }[][] = [];
  const drillOrder = ['fitness', 'tactical', 'recovery', 'technical', 'strength', 'set_pieces', 'fitness'];

  for (let w = 0; w < CAMP_WEEKS; w++) {
    const weekSchedule: { day: string; drillId: string | null; isRest: boolean }[] = [];
    let drillIdx = w * 2; // offset per week
    for (let d = 0; d < 7; d++) {
      if (d === 6) {
        weekSchedule.push({ day: DAY_NAMES[d], drillId: null, isRest: true });
      } else {
        const drill = drillOrder[(drillIdx + d) % drillOrder.length];
        weekSchedule.push({ day: DAY_NAMES[d], drillId: drill, isRest: false });
      }
    }
    schedules.push(weekSchedule);
  }
  return schedules;
}

const WEEKLY_SCHEDULE = generateWeeklySchedule();

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
  const difficultyDots = Array.from({ length: training.difficulty }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={OPACITY_FAST}
      className="relative bg-[#161b22] border border-[#30363d] rounded-lg p-3 transition-opacity"
      style={{ borderLeft: `3px solid ${training.color}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${training.color}18`, color: training.color }}
        >
          {training.icon}
        </div>

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

          {/* Enhanced meta row: difficulty + duration + focus */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Difficulty dots */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[#484f58]">Difficulty:</span>
              <div className="flex gap-0.5">
                {difficultyDots.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-sm"
                    style={{ backgroundColor: i < training.difficulty ? training.color : '#30363d' }}
                  />
                ))}
              </div>
            </div>
            {/* Duration */}
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-[#484f58]" />
              <span className="text-[9px] text-[#484f58]">{training.duration}</span>
            </div>
            {/* Focus attribute */}
            <Badge className="h-4 px-1.5 text-[9px] font-medium rounded-md border border-[#30363d] bg-[#21262d] text-[#8b949e]">
              {training.focusAttr}
            </Badge>
          </div>

          {/* Intensity bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-[#484f58]">Intensity</span>
              <span className="text-[9px] font-semibold" style={{ color: training.intensityLevel >= 3 ? '#ef4444' : training.intensityLevel >= 2 ? '#f59e0b' : '#10b981' }}>
                {training.intensityLabel}
              </span>
            </div>
            <div className="h-1 bg-[#21262d] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${(training.intensityLevel / 3) * 100}%`,
                  backgroundColor: training.intensityLevel >= 3 ? '#ef4444' : training.intensityLevel >= 2 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>

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

              {Array.from({ length: SLOTS_PER_WEEK }, (_, si) => {
                const slot = schedule[wi]?.[si];
                const trainingType = slot?.trainingId ? CAMP_TRAINING_TYPES.find(t => t.id === slot.trainingId) : null;
                const isCurrentWeek = wi === currentWeek - 1;

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
                            : wi > currentWeek - 1
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
      <div className="absolute inset-0 bg-black/60" />
      <Card
        className="relative bg-[#161b22] border-[#30363d] rounded-lg w-full max-w-sm z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-5 space-y-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded-md bg-[#21262d] flex items-center justify-center hover:bg-[#30363d] transition-opacity"
          >
            <X className="h-3.5 w-3.5 text-[#8b949e]" />
          </button>

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

          <Badge className={`w-full justify-center h-7 text-xs font-bold rounded-md border ${qualityBadge.color}`}>
            {qualityBadge.label}
          </Badge>

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

          <div className="flex items-start gap-2 bg-[#21262d] rounded-md p-3">
            <MessageCircle className="h-4 w-4 text-[#8b949e] mt-0.5 shrink-0" />
            <p className="text-xs text-[#c9d1d9] leading-relaxed">{result.message}</p>
          </div>

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
  playerName,
  onReset,
}: {
  campState: CampState;
  playerAttrs: PlayerAttributes;
  playerOvr: number;
  playerFitness: number;
  playerAge: number;
  season: number;
  playerName: string;
  onReset: () => void;
}) {
  const completedCount = campState.schedule.flat().filter(s => s.completed).length;
  const totalPossible = CAMP_WEEKS * SLOTS_PER_WEEK;
  const completionPct = Math.round((completedCount / totalPossible) * 100);

  const projectedAttrs: Partial<Record<keyof PlayerAttributes, number>> = {};
  for (const attr of CORE_ATTRS) {
    const totalGain = Object.entries(campState.totalGains)
      .filter(([k]) => k === attr)
      .reduce((sum, [, v]) => sum + (v ?? 0), 0);
    projectedAttrs[attr] = Math.min(99, Math.round(((playerAttrs[attr] ?? 50) + totalGain) * 10) / 10);
  }

  const newOvr = playerOvr + campState.ovrChange;
  const newFitness = Math.min(100, Math.max(0, Math.round((playerFitness + campState.fitnessChange) * 10) / 10));

  const totalXP = Math.round(Object.values(campState.totalGains).reduce((s, v) => s + (v ?? 0), 0) * 10);

  const readinessScore = Math.min(100, Math.round(
    (completionPct * 0.4) + (newFitness * 0.3) + (campState.ovrChange > 0 ? 30 : 10)
  ));

  const readinessLabel = readinessScore >= 85 ? 'Fully Ready' : readinessScore >= 65 ? 'Good Shape' : readinessScore >= 45 ? 'Needs Work' : 'Underprepared';
  const readinessColor = readinessScore >= 85 ? '#10b981' : readinessScore >= 65 ? '#f59e0b' : readinessScore >= 45 ? '#f97316' : '#ef4444';

  // Camp MVP
  const mvp = getCampMVP(playerName, campState.totalGains, campState.ovrChange);

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
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Sessions</span>
            <p className="text-xl font-bold text-[#c9d1d9] mt-1">{completedCount}<span className="text-sm text-[#484f58]">/{totalPossible}</span></p>
          </CardContent>
        </Card>

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

        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Fitness</span>
            <p className="text-xl font-bold mt-1" style={{ color: getAttrColor(newFitness) }}>{Math.round(newFitness)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Readiness</span>
            <p className="text-sm font-bold mt-1" style={{ color: readinessColor }}>{readinessLabel}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: readinessColor }}>{readinessScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Total XP Gained */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-[#8b949e] font-medium">Total XP Gained</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">+{totalXP} XP</span>
        </CardContent>
      </Card>

      {/* Before/After Attribute Comparison Bars */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Before → After Comparison</span>
          </div>
          <div className="space-y-2">
            {CORE_ATTRS.map((attr) => {
              const oldVal = playerAttrs[attr] ?? 50;
              const gain = campState.totalGains[attr] ?? 0;
              const newVal = Math.min(99, Math.round((oldVal + gain) * 10) / 10);
              const barMaxWidth = 99;
              return (
                <div key={attr} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-medium w-8">{ATTR_LABELS[attr]}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#484f58]">{Math.round(oldVal)}</span>
                      {gain > 0 && (
                        <>
                          <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400">{newVal}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* Before bar */}
                    <div className="flex-1 h-2 bg-[#21262d] rounded-md overflow-hidden">
                      <div className="h-full rounded-md bg-[#30363d]" style={{ width: `${(oldVal / barMaxWidth) * 100}%` }} />
                    </div>
                    {/* After bar */}
                    <div className="flex-1 h-2 bg-[#21262d] rounded-md overflow-hidden">
                      <motion.div
                        className="h-full rounded-md bg-emerald-500/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ width: `${(newVal / barMaxWidth) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fitness Change Card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="text-xs text-[#8b949e] font-medium">Fitness Change</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold" style={{ color: campState.fitnessChange > 0 ? '#10b981' : '#ef4444' }}>
              {campState.fitnessChange > 0 ? '+' : ''}{campState.fitnessChange}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Camp MVP */}
      <Card className="bg-[#161b22] border-amber-500/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] text-amber-400 uppercase tracking-wide font-medium">Camp MVP</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg font-bold text-amber-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#c9d1d9]">{mvp.name}</p>
              <p className="text-[10px] text-[#8b949e]">{mvp.position} · OVR {mvp.overall}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
// Weekly Training Schedule SVG Timeline
// ============================================================
function WeeklyScheduleTimeline({
  currentWeek,
  campState,
}: {
  currentWeek: number;
  campState: CampState;
}) {
  const barWidth = 320;
  const dayWidth = barWidth / 7;
  const headerH = 20;
  const bodyH = 36;

  const weekSchedule = WEEKLY_SCHEDULE[currentWeek - 1] ?? WEEKLY_SCHEDULE[0];
  const completedDrillIds = new Set(
    campState.schedule[currentWeek - 1]
      ?.filter(s => s.completed && s.trainingId)
      .map(s => s.trainingId) ?? [],
  );

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Week {currentWeek} Schedule</span>
        </div>
        <svg viewBox={`0 0 ${barWidth} ${headerH + bodyH}`} className="w-full" style={{ overflow: 'visible' }}>
          {/* Day columns */}
          {DAY_NAMES.map((day, i) => {
            const drillInfo = weekSchedule[i];
            const isRest = drillInfo?.isRest ?? false;
            const drill = drillInfo?.drillId ? CAMP_TRAINING_TYPES.find(t => t.id === drillInfo.drillId) : null;
            const isCompleted = drillInfo?.drillId ? completedDrillIds.has(drillInfo.drillId) : false;
            const x = i * dayWidth;

            return (
              <g key={day}>
                {/* Header */}
                <text x={x + dayWidth / 2} y={12} textAnchor="middle" className="fill-[#8b949e]" fontSize="8" fontWeight="600">
                  {day}
                </text>
                {/* Body background */}
                <rect x={x + 1} y={headerH} width={dayWidth - 2} height={bodyH - 2} rx="4"
                  fill={isRest ? '#0d1117' : isCompleted ? '#0d1117' : '#161b22'}
                  stroke="#30363d"
                  strokeWidth={0.5}
                />
                {/* Drill content */}
                {isRest ? (
                  <g>
                    <text x={x + dayWidth / 2} y={headerH + bodyH / 2 - 4} textAnchor="middle" className="fill-[#30363d]" fontSize="8">
                      Rest
                    </text>
                    <text x={x + dayWidth / 2} y={headerH + bodyH / 2 + 8} textAnchor="middle" className="fill-[#484f58]" fontSize="6">
                      😴
                    </text>
                  </g>
                ) : drill ? (
                  <g>
                    <circle
                      cx={x + dayWidth / 2}
                      cy={headerH + bodyH / 2 - 2}
                      r={8}
                      fill={isCompleted ? `${drill.color}20` : `${drill.color}30`}
                    />
                    <text x={x + dayWidth / 2} y={headerH + bodyH / 2 - 1} textAnchor="middle"
                      className={isCompleted ? 'fill-emerald-300' : 'fill-[#c9d1d9]'}
                      fontSize="7" fontWeight="600"
                    >
                      {drill.label.slice(0, 3)}
                    </text>
                    {isCompleted && (
                      <text x={x + dayWidth / 2} y={headerH + bodyH / 2 + 9} textAnchor="middle"
                        className="fill-emerald-400" fontSize="6"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                ) : (
                  <text x={x + dayWidth / 2} y={headerH + bodyH / 2 - 2} textAnchor="middle"
                    className="fill-[#30363d]" fontSize="7"
                  >
                    —
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Training Intensity Selector
// ============================================================
function IntensitySelector({
  current,
  onChange,
}: {
  current: 'light' | 'moderate' | 'intense';
  onChange: (v: 'light' | 'moderate' | 'intense') => void;
}) {
  const options: ('light' | 'moderate' | 'intense')[] = ['light', 'moderate', 'intense'];

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Training Intensity</span>
        </div>
        <div className="flex gap-1.5">
          {options.map((opt) => {
            const cfg = INTENSITY_CONFIG[opt];
            const isActive = current === opt;
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`flex-1 py-2 px-2 rounded-lg border text-xs font-semibold transition-opacity flex flex-col items-center gap-1 ${
                  isActive
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
                }`}
              >
                <span className="font-bold">{cfg.label}</span>
                <span className="text-[9px] opacity-70">{cfg.riskLabel}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Camp Timeline SVG
// ============================================================
function CampTimelineSVG({
  currentWeek,
  schedule,
}: {
  currentWeek: number;
  schedule: SlotAssignment[][];
}) {
  const width = 400;
  const nodeSpacing = 95;
  const startX = 30;
  const nodeY = 28;
  const nodeR = 14;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Camp Progression</span>
          </div>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} 120`} className="w-full min-w-[320px]">
              {/* Connecting lines */}
              {Array.from({ length: 3 }, (_, i) => (
                <line key={i}
                  x1={startX + i * nodeSpacing + nodeR} y1={nodeY}
                  x2={startX + (i + 1) * nodeSpacing - nodeR} y2={nodeY}
                  stroke={i + 1 < currentWeek ? '#10b981' : '#30363d'} strokeWidth={2}
                />
              ))}
              {/* Week nodes */}
              {Array.from({ length: CAMP_WEEKS }, (_, i) => {
                const weekNum = i + 1;
                const x = startX + i * nodeSpacing;
                const isCompleted = weekNum < currentWeek;
                const isCurrent = weekNum === currentWeek;
                const fillColor = isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#30363d';
                const textColor = isCompleted || isCurrent ? '#ffffff' : '#8b949e';
                const weekSlots = schedule[i] ?? [];
                const completedCount = weekSlots.filter(s => s.completed).length;

                return (
                  <g key={i}>
                    {/* Pulse ring for current week */}
                    {isCurrent && (
                      <circle cx={x} cy={nodeY} r={nodeR + 5} fill="none" stroke="#f59e0b" strokeWidth={1}>
                        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Node circle */}
                    <circle cx={x} cy={nodeY} r={nodeR} fill={fillColor} />
                    {isCompleted ? (
                      <path
                        d={`M${x - 4} ${nodeY}l3 3 5-6`}
                        fill="none" stroke="#ffffff" strokeWidth={2.5}
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                    ) : (
                      <text x={x} y={nodeY + 4} textAnchor="middle" fill={textColor} fontSize="11" fontWeight="700">
                        {weekNum}
                      </text>
                    )}
                    {/* Week label */}
                    <text x={x} y={nodeY + nodeR + 13} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
                      W{weekNum}
                    </text>
                    {/* Mini training type icons (3 slots) */}
                    {weekSlots.map((slot, si) => {
                      const tt = slot.trainingId ? CAMP_TRAINING_TYPES.find(t => t.id === slot.trainingId) : null;
                      const ix = x - 12 + si * 12;
                      const iy = nodeY + nodeR + 24;
                      return tt ? (
                        <circle key={si} cx={ix} cy={iy} r={4}
                          fill={slot.completed ? `${tt.color}40` : `${tt.color}20`}
                          stroke={slot.completed ? tt.color : `${tt.color}50`}
                          strokeWidth={0.8}
                        />
                      ) : (
                        <circle key={si} cx={ix} cy={iy} r={4} fill="#21262d" stroke="#30363d" strokeWidth={0.5} />
                      );
                    })}
                    {/* Mini readiness bar */}
                    <rect x={x - 16} y={nodeY + nodeR + 34} width={32} height={3} rx="1.5" fill="#21262d" />
                    <rect
                      x={x - 16} y={nodeY + nodeR + 34}
                      width={Math.max(1, 32 * (completedCount / SLOTS_PER_WEEK))}
                      height={3} rx="1.5"
                      fill={completedCount === SLOTS_PER_WEEK ? '#10b981' : completedCount > 0 ? '#f59e0b' : '#30363d'}
                    />
                    <text x={x} y={nodeY + nodeR + 46} textAnchor="middle" fill="#484f58" fontSize="6">
                      {completedCount}/{SLOTS_PER_WEEK}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

// ============================================================
// Training Drill Mini-Game Cards
// ============================================================
function TrainingDrillMiniGames({ attrs }: { attrs: PlayerAttributes }) {
  const shooting = attrs.shooting ?? 50;
  const pace = attrs.pace ?? 50;
  const passing = attrs.passing ?? 50;

  const shots = useMemo(() => {
    const pts: { x: number; y: number; ring: number }[] = [];
    const seed = shooting * 7 + 3;
    for (let i = 0; i < 5; i++) {
      const spread = Math.max(5, 50 - shooting * 0.45);
      const angle = ((seed * (i + 1) * 137.508) % 360) * (Math.PI / 180);
      const dist = spread * (((seed * (i + 1) * 31) % 100) / 100);
      const x = 50 + Math.cos(angle) * dist;
      const y = 50 + Math.sin(angle) * dist;
      const ring = dist < 10 ? 0 : dist < 20 ? 1 : dist < 30 ? 2 : dist < 40 ? 3 : 4;
      pts.push({ x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)), ring });
    }
    return pts;
  }, [shooting]);

  const sprintResult = useMemo(() => {
    const playerTime = Math.round((Math.max(10.5, 14 - pace * 0.035)) * 100) / 100;
    const oppTimes = [
      Math.round((11.8 + ((shooting * 3) % 5) * 0.1) * 100) / 100,
      Math.round((12.2 + ((passing * 7) % 4) * 0.1) * 100) / 100,
      Math.round((11.5 + ((shooting + passing) % 6) * 0.1) * 100) / 100,
    ];
    return { playerTime, oppTimes };
  }, [pace, shooting, passing]);

  const passZones = useMemo(() => {
    const zones: { x: number; y: number; ok: boolean }[] = [];
    const seed = passing * 11 + 7;
    const positions = [
      { x: 25, y: 25 }, { x: 60, y: 20 }, { x: 40, y: 50 },
      { x: 75, y: 40 }, { x: 20, y: 65 }, { x: 55, y: 70 }, { x: 85, y: 60 },
    ];
    for (let i = 0; i < positions.length; i++) {
      zones.push({ ...positions[i], ok: ((seed * (i + 1) * 17) % 100) < passing });
    }
    return zones;
  }, [passing]);

  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const quizItems = [
    { q: 'What formation uses 3 centre-backs?', opts: ['3-5-2', '4-4-2', '4-3-3', '5-3-2'], ans: 0 },
    { q: 'Which role dictates play from deep?', opts: ['Striker', 'CAM', 'CDM', 'CB'], ans: 2 },
    { q: 'Best counter to a high press?', opts: ['Tiki-taka', 'Long ball', 'Park bus', 'Wing play'], ans: 1 },
  ];

  const shotScore = shots.reduce((s, p) => s + (10 - p.ring * 2), 0);
  const shotGrade = shotScore >= 35 ? 'Excellent' : shotScore >= 20 ? 'Pass' : 'Fail';
  const shotColor = shotGrade === 'Excellent' ? '#10b981' : shotGrade === 'Pass' ? '#f59e0b' : '#ef4444';

  const sprintGrade = sprintResult.playerTime < 11.5 ? 'Excellent' : sprintResult.playerTime < 12.5 ? 'Pass' : 'Fail';
  const sprintColor = sprintGrade === 'Excellent' ? '#10b981' : sprintGrade === 'Pass' ? '#f59e0b' : '#ef4444';
  const sprintXp = Math.max(10, Math.round(50 - sprintResult.playerTime * 3));

  const passOk = passZones.filter(p => p.ok).length;
  const passGrade = passOk >= 6 ? 'Excellent' : passOk >= 4 ? 'Pass' : 'Fail';
  const passColor = passGrade === 'Excellent' ? '#10b981' : passGrade === 'Pass' ? '#f59e0b' : '#ef4444';

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Training Drills</span>
          </div>

          {/* Shooting Accuracy */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#c9d1d9]">Shooting Accuracy</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${shotColor}20`, color: shotColor }}>{shotGrade} · +{shotScore} XP</span>
            </div>
            <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto">
              {[40, 30, 20, 10, 4].map((r, i) => (
                <circle key={i} cx={50} cy={50} r={r} fill="none" stroke="#30363d" strokeWidth={0.8} />
              ))}
              <circle cx={50} cy={50} r={2} fill="#ef4444" />
              {shots.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2.5}
                  fill={p.ring <= 1 ? '#10b981' : p.ring <= 3 ? '#f59e0b' : '#ef4444'}
                />
              ))}
            </svg>
          </div>

          {/* Sprint Challenge */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#c9d1d9]">Sprint Challenge</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${sprintColor}20`, color: sprintColor }}>{sprintGrade} · +{sprintXp} XP</span>
            </div>
            <svg viewBox="0 0 300 70" className="w-full">
              {[0, 1, 2, 3].map((lane) => (
                <g key={lane}>
                  <rect x={40} y={5 + lane * 15} width={240} height={12} rx="3"
                    fill={lane === 0 ? '#10b98110' : '#21262d'} stroke="#30363d" strokeWidth={0.5}
                  />
                  {[0, 60, 120, 180, 240].map((mx) => (
                    <line key={mx} x1={40 + mx} y1={5 + lane * 15} x2={40 + mx} y2={17 + lane * 15} stroke="#30363d" strokeWidth={0.3} />
                  ))}
                </g>
              ))}
              <circle cx={40 + 240 * Math.min(1, (12.5 - sprintResult.playerTime) / 2)} cy={11} r={4} fill="#10b981" />
              {sprintResult.oppTimes.map((t, i) => (
                <circle key={i} cx={40 + 240 * Math.min(1, (12.5 - t) / 2)} cy={20 + i * 15} r={3} fill="#8b949e" />
              ))}
              <text x={35} y={14} textAnchor="end" fill="#10b981" fontSize="6" fontWeight="600">YOU</text>
              {sprintResult.oppTimes.map((t, i) => (
                <text key={i} x={35} y={23 + i * 15} textAnchor="end" fill="#484f58" fontSize="5">{t}s</text>
              ))}
              <text x={288} y={14} textAnchor="end" fill="#10b981" fontSize="5" fontWeight="700">{sprintResult.playerTime}s</text>
            </svg>
          </div>

          {/* Passing Accuracy */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#c9d1d9]">Passing Accuracy</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${passColor}20`, color: passColor }}>{passGrade} · {passOk}/7</span>
            </div>
            <svg viewBox="0 0 100 80" className="w-full h-16">
              {passZones.map((z, i) => (
                <g key={i}>
                  <polygon
                    points={`${z.x},${z.y - 8} ${z.x + 7},${z.y - 4} ${z.x + 7},${z.y + 4} ${z.x},${z.y + 8} ${z.x - 7},${z.y + 4} ${z.x - 7},${z.y - 4}`}
                    fill={z.ok ? '#10b98120' : '#ef444420'}
                    stroke={z.ok ? '#10b981' : '#ef4444'} strokeWidth={0.6}
                  />
                  <circle cx={z.x} cy={z.y} r={2} fill={z.ok ? '#10b981' : '#ef4444'} />
                </g>
              ))}
            </svg>
          </div>

          {/* Tactical Quiz */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[11px] font-semibold text-[#c9d1d9]">Tactical Quiz</span>
            </div>
            {quizItems.map((item, qi) => (
              <div key={qi} className="border border-[#21262d] rounded-md overflow-hidden">
                <button
                  onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-left"
                >
                  <span className="text-[10px] text-[#c9d1d9] font-medium">{item.q}</span>
                  <ChevronDown className={`h-3 w-3 text-[#484f58] transition-opacity ${expandedQ === qi ? 'opacity-100' : 'opacity-40'}`} />
                </button>
                {expandedQ === qi && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="px-2.5 pb-2 space-y-1">
                    {item.opts.map((opt, oi) => (
                      <div key={oi} className={`text-[9px] px-2 py-1 rounded-sm ${oi === item.ans ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-[#8b949e]'}`}>
                        {oi === item.ans ? '\u2713 ' : '\u25CB '}{opt}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

// ============================================================
// Camp Photo Gallery
// ============================================================
function CampPhotoGallery() {
  const photos = [
    { label: 'Morning Jog', week: 1, bg: '#1e3a5f', accent: '#3b82f6', key: 'run' },
    { label: 'Gym Session', week: 1, bg: '#5f1e1e', accent: '#ef4444', key: 'gym' },
    { label: 'Tactical Classroom', week: 2, bg: '#3b1f5e', accent: '#8b5cf6', key: 'board' },
    { label: 'Team Bonding', week: 2, bg: '#1e4f5f', accent: '#06b6d4', key: 'team' },
    { label: 'Match Simulation', week: 3, bg: '#1e5f2e', accent: '#10b981', key: 'pitch' },
    { label: 'Rest & Recovery', week: 3, bg: '#5f1e4f', accent: '#ec4899', key: 'rest' },
  ];

  const renderIcon = (key: string, accent: string) => {
    switch (key) {
      case 'run':
        return (
          <g>
            <circle cx="20" cy="18" r="4" fill={accent} />
            <path d="M20 24 L17 40 M20 28 L27 34 M20 28 L13 34 M17 40 L13 50 M17 40 L22 50" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'gym':
        return (
          <g>
            <rect x="14" y="18" width="4" height="24" rx="2" fill={accent} />
            <rect x="22" y="14" width="4" height="28" rx="2" fill={accent} />
            <rect x="12" y="40" width="16" height="3" rx="1.5" fill={accent} opacity="0.6" />
          </g>
        );
      case 'board':
        return (
          <g>
            <rect x="8" y="12" width="24" height="18" rx="2" fill="none" stroke={accent} strokeWidth="1.5" />
            <line x1="20" y1="12" x2="20" y2="30" stroke={accent} strokeWidth="0.8" />
            <circle cx="14" cy="21" r="3" fill={accent} opacity="0.5" />
            <circle cx="26" cy="21" r="3" fill={accent} opacity="0.5" />
          </g>
        );
      case 'team':
        return (
          <g>
            <circle cx="12" cy="22" r="4" fill={accent} opacity="0.7" />
            <circle cx="28" cy="22" r="4" fill={accent} opacity="0.7" />
            <circle cx="20" cy="18" r="4" fill={accent} />
            <line x1="14" y1="28" x2="26" y2="28" stroke={accent} strokeWidth="1.5" />
          </g>
        );
      case 'pitch':
        return (
          <g>
            <rect x="6" y="16" width="28" height="16" rx="2" fill="none" stroke={accent} strokeWidth="1.5" />
            <line x1="20" y1="16" x2="20" y2="32" stroke={accent} strokeWidth="0.8" />
            <circle cx="20" cy="24" r="4" fill="none" stroke={accent} strokeWidth="0.8" />
          </g>
        );
      case 'rest':
        return (
          <g>
            <rect x="8" y="30" width="24" height="10" rx="3" fill={accent} opacity="0.4" />
            <rect x="10" y="22" width="20" height="10" rx="2" fill={accent} opacity="0.7" />
            <line x1="20" y1="22" x2="20" y2="18" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      default: return null;
    }
  };

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Camp Gallery</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.label} className="relative rounded-lg overflow-hidden border border-[#30363d]" style={{ backgroundColor: p.bg }}>
                <svg viewBox="0 0 40 55" className="w-full">
                  <rect width="40" height="55" fill={p.bg} />
                  {renderIcon(p.key, p.accent)}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ backgroundColor: `${p.bg}dd` }}>
                  <span className="text-[7px] font-semibold text-[#c9d1d9] block leading-tight">{p.label}</span>
                  <span className="text-[6px] text-[#8b949e]">Week {p.week}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

// ============================================================
// Camp Comparison Chart
// ============================================================
function CampComparisonChart({ playerAttrs, totalGains, playerOvr, ovrChange }: {
  playerAttrs: PlayerAttributes;
  totalGains: Partial<Record<keyof PlayerAttributes, number>>;
  playerOvr: number;
  ovrChange: number;
}) {
  const chartW = 340;
  const chartH = 200;
  const barH = 8;
  const groupH = 28;
  const leftPad = 36;
  const rightPad = 30;
  const barMaxW = chartW - leftPad - rightPad;
  const topPad = 14;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.26 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Before vs After Camp</span>
          </div>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[300px]">
              {/* Legend */}
              <rect x={leftPad} y={2} width={8} height={5} rx="1" fill="#30363d" />
              <text x={leftPad + 12} y={7} fill="#8b949e" fontSize="6">Before</text>
              <rect x={leftPad + 45} y={2} width={8} height={5} rx="1" fill="#10b981" />
              <text x={leftPad + 57} y={7} fill="#8b949e" fontSize="6">Projected</text>

              {/* Attribute bars */}
              {CORE_ATTRS.map((attr, i) => {
                const before = playerAttrs[attr] ?? 50;
                const gain = totalGains[attr] ?? 0;
                const after = Math.min(99, Math.round((before + gain) * 10) / 10);
                const y = topPad + i * groupH;
                return (
                  <g key={attr}>
                    <text x={leftPad - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="7" fontWeight="600">
                      {ATTR_LABELS[attr]}
                    </text>
                    <rect x={leftPad} y={y} width={(before / 99) * barMaxW} height={barH} rx="2" fill="#30363d" />
                    <rect x={leftPad} y={y + barH + 2} width={(after / 99) * barMaxW} height={barH} rx="2"
                      fill={gain > 0 ? '#10b981' : '#30363d'} opacity={gain > 0 ? 0.7 : 1}
                    />
                    <text x={leftPad + (before / 99) * barMaxW + 4} y={y + barH / 2 + 3} fill="#484f58" fontSize="6">
                      {before}
                    </text>
                    {gain > 0 && (
                      <text x={leftPad + (after / 99) * barMaxW + 4} y={y + barH + barH / 2 + 5} fill="#10b981" fontSize="6" fontWeight="700">
                        +{gain}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* OVR comparison */}
              <line x1={leftPad} y1={topPad + 6 * groupH - 2} x2={chartW - rightPad} y2={topPad + 6 * groupH - 2} stroke="#21262d" strokeWidth={0.5} />
              <text x={leftPad - 4} y={topPad + 6 * groupH + 10} textAnchor="end" fill="#f59e0b" fontSize="7" fontWeight="700">
                OVR
              </text>
              <rect x={leftPad} y={topPad + 6 * groupH + 4} width={(playerOvr / 99) * barMaxW} height={barH} rx="2" fill="#30363d" />
              <rect
                x={leftPad} y={topPad + 6 * groupH + barH + 6}
                width={((playerOvr + ovrChange) / 99) * barMaxW} height={barH} rx="2"
                fill={ovrChange > 0 ? '#10b981' : '#30363d'} opacity={ovrChange > 0 ? 0.8 : 1}
              />
              <text x={leftPad + (playerOvr / 99) * barMaxW + 4} y={topPad + 6 * groupH + 12} fill="#484f58" fontSize="6">
                {playerOvr}
              </text>
              {ovrChange > 0 && (
                <text x={leftPad + ((playerOvr + ovrChange) / 99) * barMaxW + 4} y={topPad + 6 * groupH + barH + 14} fill="#10b981" fontSize="6" fontWeight="700">
                  +{ovrChange}
                </text>
              )}
            </svg>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

// ============================================================
// Coach's Final Report
// ============================================================
function CoachFinalReport({ completionPct, ovrChange, totalGains, playerAttrs, campFitness }: {
  completionPct: number;
  ovrChange: number;
  totalGains: Partial<Record<keyof PlayerAttributes, number>>;
  playerAttrs: PlayerAttributes;
  campFitness: number;
}) {
  const grade = useMemo(() => {
    if (completionPct >= 90 && ovrChange >= 3) return 'A';
    if (completionPct >= 70 && ovrChange >= 2) return 'B';
    if (completionPct >= 50 && ovrChange >= 1) return 'C';
    if (completionPct >= 30) return 'D';
    return 'F';
  }, [completionPct, ovrChange]);

  const gradeColor = grade === 'A' ? '#10b981' : grade === 'B' ? '#10b981' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';

  const readiness = useMemo(() => {
    return Math.min(100, Math.round(completionPct * 0.4 + campFitness * 0.3 + (ovrChange > 0 ? 30 : 10)));
  }, [completionPct, campFitness, ovrChange]);

  const recommendations = useMemo(() => {
    const entries = CORE_ATTRS.map(a => ({ attr: a, val: playerAttrs[a] ?? 50, gain: totalGains[a] ?? 0 }));
    entries.sort((a, b) => a.val - b.val);
    const recs: string[] = [];
    if (entries[0]) recs.push(`Prioritize ${ATTR_FULL[entries[0].attr]} training \u2014 currently at ${entries[0].val} and needs most work.`);
    if (entries[1] && entries[1].val < 55) recs.push(`${ATTR_FULL[entries[1].attr]} is below 55 \u2014 add targeted drills before the season opener.`);
    const totalGain = Object.values(totalGains).reduce((s, v) => s + (v ?? 0), 0);
    if (totalGain < 5) recs.push('Overall gains are modest \u2014 consider increasing training intensity next camp.');
    else recs.push('Solid gains this camp. Maintain consistency through the season with weekly sessions.');
    return recs.slice(0, 3);
  }, [playerAttrs, totalGains]);

  const quotes = [
    '"Champions are made in the off-season."',
    '"The harder you train, the luckier you play."',
    '"Success is where preparation meets opportunity."',
    '"Every champion was once a contender that refused to give up."',
  ];
  const quoteIdx = Math.abs(Math.round(ovrChange * 7 + completionPct * 3)) % quotes.length;

  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (readiness / 100) * circumference;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Coach's Report</span>
          </div>

          {/* Coach avatar + Grade + Readiness */}
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 60 60" className="w-14 h-14 shrink-0">
              <circle cx="30" cy="30" r="28" fill="#21262d" stroke="#30363d" strokeWidth="1" />
              <circle cx="30" cy="24" r="8" fill="#30363d" />
              <rect x="22" y="34" width="16" height="12" rx="3" fill="#30363d" />
              <circle cx="30" cy="22" r="6" fill="#8b949e" />
              <rect x="38" y="26" width="8" height="3" rx="1.5" fill="#8b949e" />
              <circle cx="46" cy="27.5" r="2.5" fill="#8b949e" />
              <line x1="46" y1="25" x2="46" y2="22" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: gradeColor }}>{grade}</span>
                <span className="text-[10px] text-[#8b949e]">Camp Grade</span>
              </div>
              <p className="text-[11px] text-[#c9d1d9] mt-0.5">{completionPct}% completion \u00B7 OVR {ovrChange > 0 ? '+' : ''}{ovrChange}</p>
            </div>
            <svg viewBox="0 0 70 70" className="w-14 h-14 shrink-0">
              <circle cx="35" cy="35" r="30" fill="none" stroke="#21262d" strokeWidth="4" />
              <circle cx="35" cy="35" r="30" fill="none" stroke="#10b981" strokeWidth="4"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              />
              <text x="35" y="33" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700">{readiness}%</text>
              <text x="35" y="43" textAnchor="middle" fill="#484f58" fontSize="5">READY</text>
            </svg>
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-[#8b949e] uppercase tracking-wide font-medium">Recommendations</span>
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[9px] text-emerald-400 mt-0.5 shrink-0">\u25CF</span>
                <span className="text-[10px] text-[#c9d1d9] leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>

          {/* Motivational quote */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2.5">
            <span className="text-[10px] text-[#8b949e] italic leading-relaxed">{quotes[quoteIdx]}</span>
          </div>
        </CardContent>
      </Card>
    </motion.section>
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

  const schedule = campState.schedule;
  const completedThisWeek = schedule[campState.currentWeek - 1]?.filter(s => s.completed).length ?? 0;
  const totalCompleted = schedule.flat().filter(s => s.completed).length ?? 0;
  const totalPossible = CAMP_WEEKS * SLOTS_PER_WEEK;
  const trainingLoadPct = Math.round((totalCompleted / totalPossible) * 100);

  const campFitness = useMemo(() => {
    if (!player) return 70;
    return Math.max(0, Math.min(100, player.fitness + campState.fitnessChange));
  }, [player, campState.fitnessChange]);

  const coachTips = useMemo(() => {
    if (!player) return [];
    return generateCoachTips(player.attributes, player.position);
  }, [player]);

  const recommendedFocus = useMemo(() => {
    if (!player) return [];
    return getPositionRecommendedFocus(player.position);
  }, [player]);

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
          const result = computeTrainingResult(tt, weekIdx + 1, player.attributes, campFitness, player.age, campState.intensity);
          for (const [attr, gain] of Object.entries(result.gains)) {
            gains[attr] = (gains[attr] ?? 0) + (gain ?? 0);
          }
        }
      }
    }

    for (const attr of CORE_ATTRS) {
      if (!gains[attr]) gains[attr] = 0;
    }
    return gains;
  }, [player, schedule, campFitness, campState.intensity]);

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

    const currentWeekSchedule = campState.schedule[campState.currentWeek - 1];
    if (currentWeekSchedule?.some(s => s.trainingId === trainingId && s.completed)) return;

    const result = computeTrainingResult(
      training,
      campState.currentWeek,
      player.attributes,
      campFitness,
      player.age,
      campState.intensity,
    );

    setCampState(prev => {
      const newSchedule = prev.schedule.map(w => w.map(s => ({ ...s })));
      const weekSchedule = newSchedule[prev.currentWeek - 1];

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

      const newTotalGains = { ...prev.totalGains };
      for (const [attr, gain] of Object.entries(result.gains)) {
        newTotalGains[attr as keyof PlayerAttributes] = (newTotalGains[attr as keyof PlayerAttributes] ?? 0) + (gain ?? 0);
      }

      const newOvrChange = prev.ovrChange + result.ovrChange;
      const newFitnessChange = prev.fitnessChange + result.fitnessChange;

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

    setResultModal({ result, training });
  }, [player, campState.currentWeek, campState.schedule, campFitness, campState.intensity]);

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

  const handleIntensityChange = useCallback((v: 'light' | 'moderate' | 'intense') => {
    setCampState(prev => ({ ...prev, intensity: v }));
  }, []);

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

  const tabs = [
    { id: 'train' as const, label: 'Train', icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { id: 'schedule' as const, label: 'Schedule', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'assessment' as const, label: 'Assess', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'tips' as const, label: 'Tips', icon: <Lightbulb className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
      <AnimatePresence>
        {resultModal && (
          <TrainingResultsModal
            result={resultModal.result}
            training={resultModal.training}
            onClose={() => setResultModal(null)}
          />
        )}
      </AnimatePresence>

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

      {/* ---- Camp Progress Overview Card (Enhanced) ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-semibold text-[#c9d1d9]">
                Summer Training Camp {year}
              </span>
            </div>
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b949e]">Camp Completion</span>
                <span className="text-[10px] text-[#8b949e] font-bold">{trainingLoadPct}%</span>
              </div>
              <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
                <motion.div
                  className="h-full rounded-md"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: `${trainingLoadPct}%`, backgroundColor: '#10b981' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#484f58]">
                  {totalCompleted}/{totalPossible} sessions completed
                </span>
                <span className="text-[10px] text-[#484f58]">
                  {CAMP_WEEKS - campState.currentWeek + (campState.isComplete ? 0 : 1)} days remaining
                </span>
              </div>
            </div>
            {/* Overall camp rating */}
            <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Overall Rating</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round((trainingLoadPct / 100) * 5)
                        ? 'text-emerald-400'
                        : 'text-[#30363d]'
                    }`}
                  />
                ))}
              </div>
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

            {trainingLoadPct >= 75 && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-300 font-medium">Warning: High intensity may cause fatigue</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ---- Training Intensity Selector ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <IntensitySelector current={campState.intensity} onChange={handleIntensityChange} />
      </motion.section>

      {/* ---- Camp Timeline ---- */}
      <CampTimelineSVG currentWeek={campState.currentWeek} schedule={schedule} />

      {/* ---- Training Drill Mini-Games ---- */}
      <TrainingDrillMiniGames attrs={player.attributes} />

      {/* ---- Camp Photo Gallery ---- */}
      <CampPhotoGallery />

      {/* ---- Camp Comparison Chart ---- */}
      <CampComparisonChart
        playerAttrs={player.attributes}
        totalGains={campState.totalGains}
        playerOvr={player.overall}
        ovrChange={campState.ovrChange}
      />

      {/* ---- Coach's Final Report ---- */}
      <CoachFinalReport
        completionPct={trainingLoadPct}
        ovrChange={campState.ovrChange}
        totalGains={campState.totalGains}
        playerAttrs={player.attributes}
        campFitness={campFitness}
      />

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

          {/* Current player attributes */}
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
          {/* Weekly Training Schedule SVG Timeline */}
          <WeeklyScheduleTimeline currentWeek={campState.currentWeek} campState={campState} />

          <ScheduleGrid
            schedule={schedule}
            currentWeek={campState.currentWeek}
            onSelectSlot={handleSelectSlot}
          />

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

      {/* ---- Camp Completion Summary ---- */}
      {campState.isComplete && (
        <div className="mt-4">
          <CampCompletionSummary
            campState={campState}
            playerAttrs={player.attributes}
            playerOvr={player.overall}
            playerFitness={player.fitness}
            playerAge={player.age}
            season={currentSeason}
            playerName={player.name}
            onReset={handleResetCamp}
          />
        </div>
      )}
    </div>
  );
}
