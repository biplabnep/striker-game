'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Crosshair,
  Footprints,
  ArrowLeftRight,
  Dumbbell,
  Zap,
  MoveVertical,
  Target,
  Flame,
  Snowflake,
  Heart,
  Wind,
  BedDouble,
  ChefHat,
  Droplets,
  Apple,
  Brain,
  MonitorPlay,
  MessageCircle,
  Users,
  Mic,
  BookOpen,
  Languages,
  X,
  AlertTriangle,
  Battery,
  TrendingUp,
  Calendar,
  Sparkles,
  Shield,
  Info,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// Type Definitions
// ============================================================

type CategoryId = 'training' | 'recovery' | 'nutrition' | 'mental' | 'social' | 'education';

interface ActivityEffect {
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
}

interface Activity {
  id: string;
  name: string;
  abbrev: string;
  category: CategoryId;
  icon: LucideIcon;
  energyCost: number;
  description: string;
  effects: ActivityEffect;
}

interface DaySlot {
  am: string | null;
  pm: string | null;
}

type WeeklySchedule = Record<string, DaySlot>;

interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hoverBg: string;
}

interface SlotSelection {
  day: string;
  period: 'am' | 'pm';
}

interface Recommendation {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================
// Constants
// ============================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const CATEGORY_META: CategoryMeta[] = [
  { id: 'training', label: 'Training', color: 'emerald', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30', hoverBg: 'hover:bg-emerald-500/20' },
  { id: 'recovery', label: 'Recovery', color: 'blue', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/30', hoverBg: 'hover:bg-blue-500/20' },
  { id: 'nutrition', label: 'Nutrition', color: 'amber', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400', borderClass: 'border-amber-500/30', hoverBg: 'hover:bg-amber-500/20' },
  { id: 'mental', label: 'Mental', color: 'purple', bgClass: 'bg-purple-500/10', textClass: 'text-purple-400', borderClass: 'border-purple-500/30', hoverBg: 'hover:bg-purple-500/20' },
  { id: 'social', label: 'Social', color: 'cyan', bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-400', borderClass: 'border-cyan-500/30', hoverBg: 'hover:bg-cyan-500/20' },
  { id: 'education', label: 'Education', color: 'slate', bgClass: 'bg-slate-500/10', textClass: 'text-slate-400', borderClass: 'border-slate-500/30', hoverBg: 'hover:bg-slate-500/20' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORY_META.map(c => [c.id, c])) as Record<CategoryId, CategoryMeta>;

const ACTIVITIES: Activity[] = [
  // ---- Training (8) ----
  {
    id: 'shooting_practice',
    name: 'Shooting Practice',
    abbrev: 'Shoot',
    category: 'training',
    icon: Crosshair,
    energyCost: 3,
    description: 'Focused drills on finishing, volleys, and placement. Build composure in front of goal.',
    effects: { shooting: 2 },
  },
  {
    id: 'dribbling_drills',
    name: 'Dribbling Drills',
    abbrev: 'Dribble',
    category: 'training',
    icon: Footprints,
    energyCost: 3,
    description: 'Close control exercises through cones, defenders, and tight spaces.',
    effects: { dribbling: 2 },
  },
  {
    id: 'passing_training',
    name: 'Passing Training',
    abbrev: 'Pass',
    category: 'training',
    icon: ArrowLeftRight,
    energyCost: 2,
    description: 'Short, long, and through-ball passing drills to sharpen distribution.',
    effects: { passing: 2 },
  },
  {
    id: 'fitness_session',
    name: 'Fitness Session',
    abbrev: 'Fitness',
    category: 'training',
    icon: Dumbbell,
    energyCost: 4,
    description: 'Endurance and conditioning work with a mix of cardio and core stability.',
    effects: { pace: 1, physical: 2 },
  },
  {
    id: 'sprint_training',
    name: 'Sprint Training',
    abbrev: 'Sprint',
    category: 'training',
    icon: Zap,
    energyCost: 5,
    description: 'Explosive speed work — 10m, 30m, and 60m sprints with recovery intervals.',
    effects: { pace: 3 },
  },
  {
    id: 'heading_practice',
    name: 'Heading Practice',
    abbrev: 'Head',
    category: 'training',
    icon: MoveVertical,
    energyCost: 2,
    description: 'Aerial duels, attacking headers, and defensive clearing technique.',
    effects: { shooting: 1, physical: 1 },
  },
  {
    id: 'free_kick_practice',
    name: 'Free Kick Practice',
    abbrev: 'FK',
    category: 'training',
    icon: Target,
    energyCost: 2,
    description: 'Set-piece delivery and direct free-kick technique over the wall.',
    effects: { shooting: 2 },
  },
  {
    id: 'strength_training',
    name: 'Strength Training',
    abbrev: 'Strength',
    category: 'training',
    icon: Flame,
    energyCost: 4,
    description: 'Compound lifts and resistance training for power and injury resilience.',
    effects: { physical: 3 },
  },

  // ---- Recovery (4) ----
  {
    id: 'ice_bath',
    name: 'Ice Bath',
    abbrev: 'Ice',
    category: 'recovery',
    icon: Snowflake,
    energyCost: 1,
    description: 'Cold water immersion to reduce inflammation and accelerate muscle repair.',
    effects: { physical: 1 },
  },
  {
    id: 'massage_therapy',
    name: 'Massage Therapy',
    abbrev: 'Massage',
    category: 'recovery',
    icon: Heart,
    energyCost: 1,
    description: 'Deep tissue work on key muscle groups to relieve tension and soreness.',
    effects: { pace: 1 },
  },
  {
    id: 'yoga_stretching',
    name: 'Yoga & Stretching',
    abbrev: 'Yoga',
    category: 'recovery',
    icon: Wind,
    energyCost: 2,
    description: 'Flexibility and mobility routines to improve range of motion.',
    effects: { dribbling: 1, pace: 1 },
  },
  {
    id: 'rest_day',
    name: 'Rest Day',
    abbrev: 'Rest',
    category: 'recovery',
    icon: BedDouble,
    energyCost: 0,
    description: 'Complete rest for physical and mental regeneration. Essential for peak performance.',
    effects: { physical: 2 },
  },

  // ---- Nutrition (3) ----
  {
    id: 'meal_prep',
    name: 'Meal Prep',
    abbrev: 'Meals',
    category: 'nutrition',
    icon: ChefHat,
    energyCost: 1,
    description: 'Plan and prepare balanced meals with the right macros for training demands.',
    effects: { physical: 1, pace: 1 },
  },
  {
    id: 'hydration_plan',
    name: 'Hydration Plan',
    abbrev: 'Hydrate',
    category: 'nutrition',
    icon: Droplets,
    energyCost: 1,
    description: 'Structured fluid intake tracking to maintain optimal performance levels.',
    effects: { pace: 1 },
  },
  {
    id: 'supplement_review',
    name: 'Supplement Review',
    abbrev: 'Supplm',
    category: 'nutrition',
    icon: Apple,
    energyCost: 1,
    description: 'Evaluate current supplement stack with the sports science team.',
    effects: { physical: 1 },
  },

  // ---- Mental (3) ----
  {
    id: 'meditation',
    name: 'Meditation',
    abbrev: 'Meditate',
    category: 'mental',
    icon: Brain,
    energyCost: 1,
    description: 'Guided mindfulness and breathing exercises to sharpen focus and composure.',
    effects: { passing: 1, dribbling: 1 },
  },
  {
    id: 'video_analysis',
    name: 'Video Analysis',
    abbrev: 'Video',
    category: 'mental',
    icon: MonitorPlay,
    energyCost: 2,
    description: 'Study opponents, own matches, and tactical patterns with the analyst.',
    effects: { defending: 1, passing: 1 },
  },
  {
    id: 'mental_coaching',
    name: 'Mental Coaching',
    abbrev: 'Mental',
    category: 'mental',
    icon: MessageCircle,
    energyCost: 2,
    description: 'One-on-one sessions with the sports psychologist to build resilience.',
    effects: { shooting: 1, passing: 1 },
  },

  // ---- Social (2) ----
  {
    id: 'team_bonding',
    name: 'Team Bonding',
    abbrev: 'Bonding',
    category: 'social',
    icon: Users,
    energyCost: 2,
    description: 'Group activities to strengthen chemistry and trust with teammates.',
    effects: { passing: 1, physical: 1 },
  },
  {
    id: 'media_interview',
    name: 'Media Interview',
    abbrev: 'Media',
    category: 'social',
    icon: Mic,
    energyCost: 2,
    description: 'Press conference or interview — build your public profile and confidence.',
    effects: { shooting: 1 },
  },

  // ---- Education (2) ----
  {
    id: 'tactical_study',
    name: 'Tactical Study',
    abbrev: 'Tactics',
    category: 'education',
    icon: BookOpen,
    energyCost: 2,
    description: 'Classroom sessions on formations, pressing triggers, and positioning.',
    effects: { defending: 1, passing: 1 },
  },
  {
    id: 'language_learning',
    name: 'Language Learning',
    abbrev: 'Language',
    category: 'education',
    icon: Languages,
    energyCost: 1,
    description: 'Study a new language to improve communication with international teammates.',
    effects: { passing: 1, dribbling: 1 },
  },
];

const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<string, Activity>;

const ENERGY_PER_COST = 8;

const ATTR_LABELS: { key: keyof ActivityEffect; label: string }[] = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
];

const OPACITY_FAST = { duration: 0.15 };
const OPACITY_MED = { duration: 0.2 };

// ============================================================
// Helper Functions
// ============================================================

function buildEmptySchedule(): WeeklySchedule {
  return Object.fromEntries(DAYS.map(d => [d, { am: null, pm: null }]));
}

function countActivitiesForDay(schedule: WeeklySchedule, day: string): number {
  const slot = schedule[day];
  if (!slot) return 0;
  let count = 0;
  if (slot.am) count++;
  if (slot.pm) count++;
  return count;
}

function calculateTotalScheduled(schedule: WeeklySchedule): number {
  return DAYS.reduce((total, day) => total + countActivitiesForDay(schedule, day), 0);
}

function calculateEnergyUsed(schedule: WeeklySchedule): number {
  let used = 0;
  for (const day of DAYS) {
    const slot = schedule[day];
    if (!slot) continue;
    if (slot.am && ACTIVITY_MAP[slot.am]) used += ACTIVITY_MAP[slot.am].energyCost * ENERGY_PER_COST;
    if (slot.pm && ACTIVITY_MAP[slot.pm]) used += ACTIVITY_MAP[slot.pm].energyCost * ENERGY_PER_COST;
  }
  return used;
}

function calculateNetEffects(schedule: WeeklySchedule): ActivityEffect {
  const net: ActivityEffect = {};
  for (const day of DAYS) {
    const slot = schedule[day];
    if (!slot) continue;
    for (const period of ['am', 'pm'] as const) {
      const actId = slot[period];
      if (!actId || !ACTIVITY_MAP[actId]) continue;
      const act = ACTIVITY_MAP[actId];
      for (const [key, val] of Object.entries(act.effects)) {
        const k = key as keyof ActivityEffect;
        net[k] = (net[k] || 0) + (val || 0);
      }
    }
  }
  return net;
}

function getCategoryCounts(schedule: WeeklySchedule): Record<CategoryId, number> {
  const counts: Record<CategoryId, number> = {
    training: 0, recovery: 0, nutrition: 0,
    mental: 0, social: 0, education: 0,
  };
  for (const day of DAYS) {
    const slot = schedule[day];
    if (!slot) continue;
    for (const period of ['am', 'pm'] as const) {
      const actId = slot[period];
      if (!actId || !ACTIVITY_MAP[actId]) continue;
      counts[ACTIVITY_MAP[actId].category]++;
    }
  }
  return counts;
}

function getEnergyBarColor(remaining: number, max: number): string {
  const pct = (remaining / max) * 100;
  if (pct > 60) return 'bg-emerald-500';
  if (pct > 30) return 'bg-amber-500';
  return 'bg-red-500';
}

function getEnergyBarGlow(remaining: number, max: number): string {
  const pct = (remaining / max) * 100;
  if (pct > 60) return 'shadow-emerald-500/20';
  if (pct > 30) return 'shadow-amber-500/20';
  return 'shadow-red-500/20';
}

function generateRecommendations(
  fitness: number,
  morale: number,
  form: number,
  energyRemaining: number,
  energyMax: number,
  catCounts: Record<CategoryId, number>
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Low fitness recommendation
  if (fitness < 40) {
    recs.push({
      id: 'low_fitness',
      icon: AlertTriangle,
      title: 'Low Fitness Alert',
      description: 'Your fitness is critically low. Prioritize Recovery activities like Ice Bath, Massage, and Rest Days to rebuild.',
      priority: 'high',
    });
  } else if (fitness < 60) {
    recs.push({
      id: 'moderate_fitness',
      icon: Shield,
      title: 'Fitness Needs Attention',
      description: 'Fitness is below optimal. Consider adding 2-3 Recovery sessions this week to get back to peak condition.',
      priority: 'medium',
    });
  }

  // Low morale recommendation
  if (morale < 35) {
    recs.push({
      id: 'low_morale',
      icon: MessageCircle,
      title: 'Morale is Rock Bottom',
      description: 'Schedule Mental Coaching, Meditation, and Team Bonding to lift your spirits and confidence.',
      priority: 'high',
    });
  } else if (morale < 55) {
    recs.push({
      id: 'moderate_morale',
      icon: MessageCircle,
      title: 'Boost Your Morale',
      description: 'A couple of Social or Mental activities could help raise your morale and on-pitch confidence.',
      priority: 'medium',
    });
  }

  // Poor form recommendation
  if (form < 5.0) {
    recs.push({
      id: 'poor_form',
      icon: MonitorPlay,
      title: 'Form is Below Par',
      description: 'Your recent performances have dipped. Video Analysis and Tactical Study can help identify areas to improve.',
      priority: 'medium',
    });
  }

  // High morale — good time for intensive training
  if (morale > 75 && fitness > 70) {
    recs.push({
      id: 'peak_condition',
      icon: Sparkles,
      title: 'Peak Condition Window',
      description: 'High morale and strong fitness — ideal conditions for intensive Training. Push hard this week!',
      priority: 'low',
    });
  }

  // Balance check — too much training, not enough recovery
  const total = catCounts.training + catCounts.recovery + catCounts.nutrition + catCounts.mental + catCounts.social + catCounts.education;
  if (total > 4) {
    const trainingPct = catCounts.training / total;
    const recoveryPct = catCounts.recovery / total;
    if (trainingPct > 0.6 && recoveryPct < 0.15) {
      recs.push({
        id: 'overtraining',
        icon: AlertTriangle,
        title: 'Overtraining Risk',
        description: `Training load is heavy (${catCounts.training} sessions) with little Recovery (${catCounts.recovery}). Add rest to avoid burnout.`,
        priority: 'high',
      });
    }
  }

  // Low energy remaining
  if (energyRemaining < energyMax * 0.2 && energyMax > 0) {
    recs.push({
      id: 'low_energy',
      icon: Battery,
      title: 'Running Low on Energy',
      description: "You're close to depleting your weekly energy. Choose lighter activities or clear some demanding slots.",
      priority: 'medium',
    });
  }

  // Under-scheduling
  if (total === 0) {
    recs.push({
      id: 'empty_schedule',
      icon: Calendar,
      title: 'Empty Schedule',
      description: 'Your week is completely empty. Start by scheduling key Training and Recovery activities for each day.',
      priority: 'medium',
    });
  }

  return recs.slice(0, 3);
}

// ============================================================
// Sub-Components
// ============================================================

function EnergyBar({ remaining, max }: { remaining: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (remaining / max) * 100)) : 100;
  const barColor = getEnergyBarColor(remaining, max);
  const glowColor = getEnergyBarGlow(remaining, max);
  const label = remaining > 60 ? 'Energized' : remaining > 30 ? 'Moderate' : remaining > 0 ? 'Fatigued' : 'Exhausted';
  const labelColor = remaining > 60 ? 'text-emerald-400' : remaining > 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery className={`w-4 h-4 ${labelColor}`} />
          <span className="text-xs font-medium text-[#c9d1d9]">Weekly Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">{label}</span>
          <span className={`text-sm font-bold ${labelColor}`}>
            {remaining}<span className="text-[#8b949e] font-normal">/{max}</span>
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-lg overflow-hidden">
        <motion.div
          className={`h-full rounded-lg ${barColor} shadow-sm ${glowColor}`}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={OPACITY_MED}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#8b949e]">
        <span>Exhausted</span>
        <span>Moderate</span>
        <span>Energized</span>
      </div>
    </div>
  );
}

function ActivityIcon({ actId, size = 'sm' }: { actId: string; size?: 'sm' | 'md' | 'lg' }) {
  const act = ACTIVITY_MAP[actId];
  if (!act) return null;
  const cat = CATEGORY_MAP[act.category];
  const Icon = act.icon;
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`${cat.bgClass} ${sizeClass} rounded-md flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${sizeClass} ${cat.textClass}`} />
    </div>
  );
}

function ScheduleSlot({
  day,
  period,
  slot,
  isCurrentDay,
  isSelected,
  energyRemaining,
  onClick,
  onClear,
}: {
  day: string;
  period: 'am' | 'pm';
  slot: DaySlot;
  isCurrentDay: boolean;
  isSelected: boolean;
  energyRemaining: number;
  onClick: () => void;
  onClear: () => void;
}) {
  const actId = period === 'am' ? slot.am : slot.pm;
  const act = actId ? ACTIVITY_MAP[actId] : null;
  const cat = act ? CATEGORY_MAP[act.category] : null;

  const canAssign = !act;
  const currentCost = act ? act.energyCost * ENERGY_PER_COST : 0;

  return (
    <motion.button
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={OPACITY_FAST}
      onClick={onClick}
      className={`
        relative w-full p-1.5 rounded-lg border text-left transition-opacity
        ${isSelected
          ? 'border-emerald-500/60 bg-emerald-500/5'
          : isCurrentDay
            ? 'border-emerald-500/20 bg-[#161b22]'
            : 'border-[#30363d] bg-[#161b22]'
        }
        ${canAssign && energyRemaining > 0 ? 'cursor-pointer hover:border-[#484f58]' : 'cursor-default'}
        min-h-[52px] flex flex-col gap-0.5
      `}
    >
      {/* Period label */}
      <div className={`text-[9px] font-semibold uppercase tracking-wider ${isCurrentDay ? 'text-emerald-500' : 'text-[#484f58]'}`}>
        {period === 'am' ? '☀️ AM' : '🌙 PM'}
      </div>

      {act ? (
        <div className="flex items-center gap-1">
          <ActivityIcon actId={actId} size="sm" />
          <span className={`text-[10px] font-medium leading-tight ${cat?.textClass || 'text-[#8b949e]'} truncate`}>
            {act.abbrev}
          </span>
          {act.energyCost > 0 && (
            <span className="text-[8px] text-[#484f58] ml-auto flex-shrink-0">
              -{currentCost}
            </span>
          )}
          {/* Clear button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-md bg-red-500/20 border border-red-500/30
                       flex items-center justify-center hover:bg-red-500/40 transition-opacity"
          >
            <X className="w-2.5 h-2.5 text-red-400" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-5">
          <span className="text-[10px] text-[#30363d]">—</span>
        </div>
      )}
    </motion.button>
  );
}

function WeeklyEffectsPanel({ effects }: { effects: ActivityEffect }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold text-[#c9d1d9]">Weekly Attribute Effects</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ATTR_LABELS.map(({ key, label }) => {
          const val = effects[key] || 0;
          const isPositive = val > 0;
          const isNegative = val < 0;
          const colorClass = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-[#484f58]';

          return (
            <div
              key={key}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex flex-col items-center gap-0.5"
            >
              <span className="text-[10px] text-[#8b949e] font-medium">{label}</span>
              <span className={`text-lg font-bold ${colorClass}`}>
                {isPositive ? '+' : ''}{val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BalanceScore({ catCounts }: { catCounts: Record<CategoryId, number> }) {
  const trainingTotal = catCounts.training;
  const recoveryTotal = catCounts.recovery;
  const supportTotal = catCounts.nutrition + catCounts.mental + catCounts.social + catCounts.education;
  const grandTotal = trainingTotal + recoveryTotal + supportTotal;

  if (grandTotal === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-[#484f58] flex-shrink-0" />
        <span className="text-xs text-[#8b949e]">Schedule activities to see your training balance.</span>
      </div>
    );
  }

  const trainingPct = Math.round((trainingTotal / grandTotal) * 100);
  const recoveryPct = Math.round((recoveryTotal / grandTotal) * 100);
  const supportPct = Math.round((supportTotal / grandTotal) * 100);

  // Balance quality
  let balanceLabel: string;
  let balanceColor: string;
  if (trainingPct >= 30 && trainingPct <= 55 && recoveryPct >= 15 && recoveryPct <= 35) {
    balanceLabel = 'Well Balanced';
    balanceColor = 'text-emerald-400 border-emerald-500/30';
  } else if (trainingPct > 65) {
    balanceLabel = 'Overtraining';
    balanceColor = 'text-red-400 border-red-500/30';
  } else if (recoveryPct > 50) {
    balanceLabel = 'Too Light';
    balanceColor = 'text-amber-400 border-amber-500/30';
  } else {
    balanceLabel = 'Slightly Off';
    balanceColor = 'text-amber-400 border-amber-500/30';
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#c9d1d9]">Training Balance</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${balanceColor}`}>
          {balanceLabel}
        </span>
      </div>
      <div className="space-y-1.5">
        {/* Training bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 w-14 flex-shrink-0">Training</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-lg overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-lg" style={{ width: `${trainingPct}%` }} />
          </div>
          <span className="text-[10px] text-[#8b949e] w-8 text-right">{trainingPct}%</span>
        </div>
        {/* Recovery bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-blue-400 w-14 flex-shrink-0">Recovery</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-lg overflow-hidden">
            <div className="h-full bg-blue-500 rounded-lg" style={{ width: `${recoveryPct}%` }} />
          </div>
          <span className="text-[10px] text-[#8b949e] w-8 text-right">{recoveryPct}%</span>
        </div>
        {/* Support bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-400 w-14 flex-shrink-0">Support</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-lg overflow-hidden">
            <div className="h-full bg-amber-500 rounded-lg" style={{ width: `${supportPct}%` }} />
          </div>
          <span className="text-[10px] text-[#8b949e] w-8 text-right">{supportPct}%</span>
        </div>
      </div>
      <div className="text-[10px] text-[#484f58] pt-1">
        {trainingTotal} training · {recoveryTotal} recovery · {supportTotal} support
      </div>
    </div>
  );
}

function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;

  const priorityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-amber-500/30 bg-amber-500/5',
    low: 'border-emerald-500/30 bg-emerald-500/5',
  };

  const priorityDotColors = {
    high: 'bg-red-400',
    medium: 'bg-amber-400',
    low: 'bg-emerald-400',
  };

  const priorityLabels = {
    high: 'Important',
    medium: 'Suggested',
    low: 'Tip',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-[#c9d1d9]">Recommendations</span>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={OPACITY_MED}
              className={`border rounded-lg p-3 ${priorityColors[rec.priority]}`}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#c9d1d9]">{rec.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${priorityDotColors[rec.priority]} text-[#0d1117]`}>
                      {priorityLabels[rec.priority]}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] leading-relaxed">{rec.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityPicker({
  energyRemaining,
  onSelect,
}: {
  energyRemaining: number;
  onSelect: (actId: string) => void;
}) {
  const affordable = useMemo(
    () => ACTIVITIES.filter(a => a.energyCost * ENERGY_PER_COST <= energyRemaining || a.energyCost === 0),
    [energyRemaining]
  );

  const unaffordable = useMemo(
    () => ACTIVITIES.filter(a => a.energyCost * ENERGY_PER_COST > energyRemaining && a.energyCost > 0),
    [energyRemaining]
  );

  return (
    <Tabs defaultValue="training" className="w-full">
      <div className="overflow-x-auto -mx-1 px-1 mb-3">
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full flex min-w-max">
          {CATEGORY_META.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className={`data-[state=active]:bg-[#0d1117] data-[state=active]:${cat.textClass} text-[#8b949e] text-xs px-2.5 py-1.5 flex-shrink-0`}
            >
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden text-[10px]">{cat.label.slice(0, 4)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {CATEGORY_META.map((cat) => {
        const catActivities = affordable.filter(a => a.category === cat.id);
        const catUnaffordable = unaffordable.filter(a => a.category === cat.id);

        return (
          <TabsContent key={cat.id} value={cat.id} className="space-y-2 mt-0">
            {catActivities.length > 0 ? (
              catActivities.map((act) => {
                const Icon = act.icon;
                const cost = act.energyCost * ENERGY_PER_COST;
                return (
                  <motion.button
                    key={act.id}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={OPACITY_FAST}
                    onClick={() => onSelect(act.id)}
                    className={`w-full text-left p-2.5 rounded-lg border ${cat.borderClass} ${cat.bgClass} ${cat.hoverBg}
                               transition-opacity cursor-pointer`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`${cat.bgClass} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cat.textClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${cat.textClass}`}>{act.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium
                            ${cost === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-[#8b949e]'}`}>
                            {cost === 0 ? 'FREE' : `-${cost}⚡`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed line-clamp-2">{act.description}</p>
                        {/* Effects tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(act.effects).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-700/50 text-emerald-400 font-medium"
                            >
                              +{val} {(key as string).slice(0, 3).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[#484f58]">No affordable activities in this category.</p>
              </div>
            )}

            {/* Show unaffordable activities as locked */}
            {catUnaffordable.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#484f58] font-medium uppercase tracking-wider">Insufficient Energy</span>
                {catUnaffordable.map((act) => {
                  const Icon = act.icon;
                  const cost = act.energyCost * ENERGY_PER_COST;
                  return (
                    <div
                      key={act.id}
                      className="w-full p-2 rounded-lg border border-[#21262d] bg-[#0d1117]/50 opacity-40"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[#484f58]" />
                        <span className="text-[11px] text-[#484f58] flex-1 truncate">{act.name}</span>
                        <span className="text-[9px] text-[#30363d]">-{cost}⚡</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function DailyRoutineHub() {
  const player = useGameStore(state => state.gameState?.player);
  const currentWeek = useGameStore(state => state.gameState?.currentWeek) ?? 1;

  // Local state for routine scheduling
  const [schedule, setSchedule] = useState<WeeklySchedule>(buildEmptySchedule);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);
  const [clearedSlotKey, setClearedSlotKey] = useState<string | null>(null);

  // Derived values
  const maxEnergy = useMemo(() => Math.min((player?.fitness ?? 70) * 1.0, 100), [player?.fitness]);
  const energyUsed = useMemo(() => calculateEnergyUsed(schedule), [schedule]);
  const energyRemaining = useMemo(() => Math.max(0, maxEnergy - energyUsed), [maxEnergy, energyUsed]);
  const netEffects = useMemo(() => calculateNetEffects(schedule), [schedule]);
  const catCounts = useMemo(() => getCategoryCounts(schedule), [schedule]);
  const totalScheduled = useMemo(() => calculateTotalScheduled(schedule), [schedule]);
  const currentDayIndex = useMemo(() => (currentWeek - 1) % 7, [currentWeek]);

  // Recommendations
  const recommendations = useMemo(
    () => generateRecommendations(
      player?.fitness ?? 70,
      player?.morale ?? 60,
      player?.form ?? 6.0,
      energyRemaining,
      maxEnergy,
      catCounts,
    ),
    [player?.fitness, player?.morale, player?.form, energyRemaining, maxEnergy, catCounts],
  );

  // Handlers
  const handleSlotClick = useCallback((day: string, period: 'am' | 'pm') => {
    const key = `${day}-${period}`;
    if (clearedSlotKey === key) {
      setClearedSlotKey(null);
      setSelectedSlot(null);
      return;
    }
    setClearedSlotKey(null);
    setSelectedSlot(prev => {
      if (prev && prev.day === day && prev.period === period) return null;
      return { day, period };
    });
  }, [clearedSlotKey]);

  const handleClearSlot = useCallback((day: string, period: 'am' | 'pm') => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: null,
      },
    }));
    setClearedSlotKey(`${day}-${period}`);
  }, []);

  const handleAssignActivity = useCallback((actId: string) => {
    if (!selectedSlot) return;
    const act = ACTIVITY_MAP[actId];
    if (!act) return;

    const cost = act.energyCost * ENERGY_PER_COST;
    if (cost > energyRemaining) return;

    setSchedule(prev => ({
      ...prev,
      [selectedSlot.day]: {
        ...prev[selectedSlot.day],
        [selectedSlot.period]: actId,
      },
    }));
    setSelectedSlot(null);
  }, [selectedSlot, energyRemaining]);

  const handleClearAll = useCallback(() => {
    setSchedule(buildEmptySchedule());
    setSelectedSlot(null);
  }, []);

  // No player data guard
  if (!player) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Calendar className="w-8 h-8 text-[#30363d] mx-auto" />
          <p className="text-sm text-[#8b949e]">No active career found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
      {/* ---- Header ---- */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={OPACITY_FAST}
        className="pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Daily Routine</h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Week {currentWeek} · {player.name} · {totalScheduled}/14 slots filled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={OPACITY_MED}
              onClick={handleClearAll}
              className="text-[10px] px-2.5 py-1 rounded-md border border-[#30363d] text-[#8b949e]
                         hover:border-red-500/30 hover:text-red-400 transition-opacity"
            >
              Clear All
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ---- Energy Bar ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
      >
        <EnergyBar remaining={energyRemaining} max={maxEnergy} />
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#21262d]">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e]">Used: {energyUsed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Battery className="w-3 h-3 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e]">Left: {energyRemaining}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar className="w-3 h-3 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e]">{totalScheduled} activities</span>
          </div>
        </div>
      </motion.section>

      {/* ---- Day Selector / Weekly Schedule Grid ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Weekly Schedule</h2>
          <span className="text-[10px] text-[#8b949e]">Tap slot to assign</span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((day, idx) => {
            const isCurrent = idx === currentDayIndex;
            const actCount = countActivitiesForDay(schedule, day);
            return (
              <div
                key={day}
                className={`text-center py-1.5 rounded-lg border transition-opacity
                  ${isCurrent
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-transparent'
                  }`}
              >
                <span className={`text-[10px] font-semibold ${isCurrent ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                  {day}
                </span>
                {actCount > 0 && (
                  <div className="mt-0.5">
                    <span className={`text-[8px] px-1 py-px rounded ${isCurrent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#21262d] text-[#8b949e]'}`}>
                      {actCount}/2
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="w-1 h-1 rounded-sm bg-emerald-500 mx-auto mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, dayIdx) => {
            const isCurrent = dayIdx === currentDayIndex;
            const slot = schedule[day];
            return (
              <div key={day} className="space-y-1">
                <ScheduleSlot
                  day={day}
                  period="am"
                  slot={slot}
                  isCurrentDay={isCurrent}
                  isSelected={selectedSlot?.day === day && selectedSlot?.period === 'am'}
                  energyRemaining={energyRemaining}
                  onClick={() => handleSlotClick(day, 'am')}
                  onClear={() => handleClearSlot(day, 'am')}
                />
                <ScheduleSlot
                  day={day}
                  period="pm"
                  slot={slot}
                  isCurrentDay={isCurrent}
                  isSelected={selectedSlot?.day === day && selectedSlot?.period === 'pm'}
                  energyRemaining={energyRemaining}
                  onClick={() => handleSlotClick(day, 'pm')}
                  onClear={() => handleClearSlot(day, 'pm')}
                />
              </div>
            );
          })}
        </div>

        {/* Current day indicator */}
        <div className="mt-3 pt-2 border-t border-[#21262d] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
          <span className="text-[10px] text-[#8b949e]">
            Today: <span className="text-emerald-400 font-medium">{DAYS[currentDayIndex]}</span>
          </span>
        </div>
      </motion.section>

      {/* ---- Activity Picker (shown when a slot is selected) ---- */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.section
            key="activity-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OPACITY_MED}
            className="bg-[#161b22] border border-emerald-500/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#c9d1d9]">Select Activity</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                  {DAYS[DAYS.indexOf(selectedSlot.day as typeof DAYS[number])]} {selectedSlot.period === 'am' ? 'Morning' : 'Afternoon'}
                </span>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="w-6 h-6 rounded-md bg-[#21262d] border border-[#30363d]
                           flex items-center justify-center hover:border-[#484f58] transition-opacity"
              >
                <X className="w-3 h-3 text-[#8b949e]" />
              </button>
            </div>
            <div className="text-[10px] text-[#8b949e] mb-2">
              Energy available: <span className={energyRemaining > 30 ? 'text-emerald-400 font-medium' : energyRemaining > 0 ? 'text-amber-400 font-medium' : 'text-red-400 font-medium'}>{energyRemaining}</span>
            </div>
            <ActivityPicker energyRemaining={energyRemaining} onSelect={handleAssignActivity} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---- Weekly Effects Summary ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-4"
      >
        <WeeklyEffectsPanel effects={netEffects} />
        <BalanceScore catCounts={catCounts} />
      </motion.section>

      {/* ---- Recommendations ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.15 }}
        className="space-y-3"
      >
        <RecommendationsPanel recommendations={recommendations} />
      </motion.section>

      {/* ---- Quick Schedule Presets ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-[#c9d1d9]">Quick Presets</span>
        </div>
        <div className="space-y-2">
          <PresetButton
            label="Balanced Week"
            description="3 Training, 2 Recovery, 2 Support per day"
            color="emerald"
            onClick={() => applyPreset('balanced', maxEnergy)}
          />
          <PresetButton
            label="Recovery Focus"
            description="Prioritize healing with 5 Recovery slots"
            color="blue"
            onClick={() => applyPreset('recovery', maxEnergy)}
          />
          <PresetButton
            label="Intensive Training"
            description="Push limits with 8 Training sessions"
            color="red"
            onClick={() => applyPreset('intensive', maxEnergy)}
          />
        </div>
      </motion.section>

      {/* ---- Activity Legend ---- */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.25 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-[#8b949e]" />
          <span className="text-sm font-semibold text-[#c9d1d9]">Category Guide</span>
        </div>
        <div className="space-y-2">
          {CATEGORY_META.map((cat) => {
            const count = catCounts[cat.id] || 0;
            return (
              <div key={cat.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-sm bg-${cat.color}-500`} />
                <span className={`text-xs font-medium ${cat.textClass} w-20`}>{cat.label}</span>
                <div className="flex-1 h-1 bg-[#21262d] rounded-lg overflow-hidden">
                  <div className={`h-full bg-${cat.color}-500/40 rounded-lg`} style={{ width: `${Math.min(100, count * 14)}%` }} />
                </div>
                <span className="text-[10px] text-[#8b949e] w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );

  // ---- Preset application function (inline to access setSchedule) ----
  function applyPreset(type: 'balanced' | 'recovery' | 'intensive', maxE: number) {
    const newSchedule = buildEmptySchedule();
    let remaining = maxE;

    const tryAssign = (day: string, period: 'am' | 'pm', actId: string): boolean => {
      const act = ACTIVITY_MAP[actId];
      if (!act) return false;
      const cost = act.energyCost * ENERGY_PER_COST;
      if (cost > remaining) return false;
      newSchedule[day][period] = actId;
      remaining -= cost;
      return true;
    };

    if (type === 'balanced') {
      // Mon-Fri: training in AM, recovery/support in PM
      const trainings = ['shooting_practice', 'passing_training', 'dribbling_drills', 'fitness_session', 'sprint_training'];
      const recoveries = ['ice_bath', 'massage_therapy', 'yoga_stretching', 'rest_day', 'rest_day'];
      const supports = ['meditation', 'video_analysis', 'tactical_study', 'meal_prep', 'hydration_plan'];

      for (let i = 0; i < 5; i++) {
        tryAssign(DAYS[i], 'am', trainings[i]);
        if (i % 2 === 0) {
          tryAssign(DAYS[i], 'pm', recoveries[i]);
        } else {
          tryAssign(DAYS[i], 'pm', supports[i]);
        }
      }
      // Sat: recovery
      tryAssign('Sat', 'am', 'yoga_stretching');
      tryAssign('Sat', 'pm', 'meditation');
      // Sun: rest
      tryAssign('Sun', 'am', 'rest_day');
      tryAssign('Sun', 'pm', 'rest_day');
    } else if (type === 'recovery') {
      const recoveryActs = ['ice_bath', 'massage_therapy', 'yoga_stretching', 'rest_day', 'meal_prep', 'hydration_plan', 'meditation'];
      let actIdx = 0;
      for (const day of DAYS) {
        for (const period of ['am', 'pm'] as const) {
          if (actIdx < recoveryActs.length) {
            tryAssign(day, period, recoveryActs[actIdx]);
            actIdx++;
          } else {
            tryAssign(day, period, 'rest_day');
          }
        }
      }
      // Add a couple light training
      tryAssign('Wed', 'am', 'passing_training');
      tryAssign('Thu', 'am', 'tactical_study');
    } else {
      // Intensive: maximize training
      const trainings = [
        'shooting_practice', 'dribbling_drills', 'passing_training',
        'fitness_session', 'sprint_training', 'free_kick_practice',
        'strength_training', 'heading_practice',
      ];
      let tIdx = 0;
      for (const day of DAYS) {
        for (const period of ['am', 'pm'] as const) {
          if (tIdx < trainings.length) {
            tryAssign(day, period, trainings[tIdx]);
            tIdx++;
          }
        }
      }
      // Fill remaining with rest/recovery
      for (const day of DAYS) {
        if (!newSchedule[day].am) tryAssign(day, 'am', 'rest_day');
        if (!newSchedule[day].pm) tryAssign(day, 'pm', 'rest_day');
      }
    }

    setSchedule(newSchedule);
    setSelectedSlot(null);
  }
}

// ============================================================
// Preset Button Component
// ============================================================

function PresetButton({
  label,
  description,
  color,
  onClick,
}: {
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, { border: string; text: string; dot: string }> = {
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    blue: { border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
    red: { border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <motion.button
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={OPACITY_FAST}
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg border ${colors.border} bg-[#0d1117]/50
                 hover:bg-[#161b22] transition-opacity cursor-pointer`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-sm ${colors.dot} flex-shrink-0`} />
        <div>
          <span className={`text-xs font-semibold ${colors.text}`}>{label}</span>
          <p className="text-[10px] text-[#8b949e] mt-0.5">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
