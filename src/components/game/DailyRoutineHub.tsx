'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
// SVG Helper Functions
// ============================================================

function polarToCart(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 360) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
  }
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeDonutArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 360) {
    const outerStart = polarToCart(cx, cy, outerR, 0);
    const innerStart = polarToCart(cx, cy, innerR, 0);
    return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy} A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y} L ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${innerStart.x} ${innerStart.y} Z`;
  }
  const outerStart = polarToCart(cx, cy, outerR, startAngle);
  const outerEnd = polarToCart(cx, cy, outerR, endAngle);
  const innerEnd = polarToCart(cx, cy, innerR, endAngle);
  const innerStart = polarToCart(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
}

function buildPointsStr(coords: [number, number][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ');
}

// ============================================================
// SVG Sample Data Constants
// ============================================================

const SLEEP_HOURS = [7.5, 6.0, 8.0, 7.0, 6.5, 9.0, 8.5] as const;
const CALORIE_INTAKE = [2800, 3100, 2600, 2900, 3200, 2500, 2700] as const;
const TIMELINE_SLOTS = [
  { label: 'Morning', time: '06:00', color: 'text-amber-400', fill: 'fill-amber-500' },
  { label: 'Training', time: '09:00', color: 'text-emerald-400', fill: 'fill-emerald-500' },
  { label: 'Lunch', time: '12:00', color: 'text-orange-400', fill: 'fill-orange-500' },
  { label: 'Rest', time: '15:00', color: 'text-blue-400', fill: 'fill-blue-500' },
  { label: 'Evening', time: '18:00', color: 'text-purple-400', fill: 'fill-purple-500' },
  { label: 'Sleep', time: '22:00', color: 'text-slate-400', fill: 'fill-slate-500' },
] as const;
const REST_BENEFITS = [
  { label: 'Injury Reduction', value: 65, color: 'fill-red-500' },
  { label: 'Mental Refresh', value: 80, color: 'fill-purple-500' },
  { label: 'Performance Gain', value: 55, color: 'fill-emerald-500' },
  { label: 'Recovery', value: 90, color: 'fill-blue-500' },
] as const;
const RADAR_AXES = ['Fitness', 'Technical', 'Tactical', 'Mental', 'Physical'] as const;

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
          <ActivityIcon actId={actId!} size="sm" />
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

  // Derived data for SVG charts
  const trainingLoadPerDay = DAYS.map(day => {
    const slot = schedule[day];
    if (!slot) return 0;
    const periods: ('am' | 'pm')[] = ['am', 'pm'];
    const dayCost = periods
      .map(p => {
        const actId = slot[p];
        if (!actId || !ACTIVITY_MAP[actId]) return 0;
        return ACTIVITY_MAP[actId].energyCost;
      })
      .reduce((sum: number, c: number) => sum + c, 0);
    return Math.round((dayCost / 10) * 100);
  });

  const maxLoad = Math.max(1, ...trainingLoadPerDay);

  const radarValues = RADAR_AXES.map((_axis, i) => {
    const effectKeys: (keyof ActivityEffect)[] = ['pace', 'shooting', 'defending', 'passing', 'physical'];
    const val = netEffects[effectKeys[i]] || 0;
    return Math.min(100, Math.max(0, val * 12 + 30));
  });

  const scatterData = DAYS.map((day, i) => {
    const slot = schedule[day];
    const periods2: ('am' | 'pm')[] = ['am', 'pm'];
    const footballHrs = slot
      ? periods2
          .map(p => {
            const actId = slot[p];
            if (!actId || !ACTIVITY_MAP[actId]) return 0;
            return ACTIVITY_MAP[actId].category === 'training' ? 3 : ACTIVITY_MAP[actId].category === 'recovery' ? 1 : 0.5;
          })
          .reduce((s: number, h: number) => s + h, 0)
      : 0;
    const personalHrs = Math.max(1, 8 - footballHrs + Math.sin(i * 1.2) * 1.5);
    return { day, x: footballHrs, y: personalHrs };
  });

  const donutSegments = [
    { label: 'Training', count: catCounts.training, fill: '#10b981' },
    { label: 'Rest', count: catCounts.recovery, fill: '#3b82f6' },
    { label: 'Recovery', count: catCounts.nutrition, fill: '#f59e0b' },
    { label: 'Social', count: catCounts.social + catCounts.mental, fill: '#06b6d4' },
    { label: 'Media', count: catCounts.education, fill: '#8b5cf6' },
  ];
  const donutTotal = donutSegments.reduce((s: number, seg: typeof donutSegments[number]) => s + seg.count, 0);

  // ============================================================
  // SVG 1: Daily Routine Timeline
  // ============================================================
  function dailyRoutineTimeline(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Daily Routine Timeline</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 220" fill="none" className="w-full">
            <line x1="30" y1="10" x2="30" y2="210" stroke="#30363d" strokeWidth="2" />
            {TIMELINE_SLOTS.map((slot, i) => {
              const yPos = 20 + i * 38;
              return (
                <g key={i}>
                  <circle cx="30" cy={yPos} r="6" className={slot.fill} />
                  <circle cx="30" cy={yPos} r="3" fill="#0d1117" />
                  <text x="46" y={yPos - 6} className={slot.color} fontSize="9" fontWeight="600">{slot.label}</text>
                  <text x="46" y={yPos + 6} fill="#8b949e" fontSize="8">{slot.time}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 2: Activity Distribution Donut
  // ============================================================
  function activityDonut(): React.JSX.Element {
    const cx = 60;
    const cy = 60;
    const outerR = 50;
    const innerR = 30;

    interface DonutSlice { label: string; count: number; fill: string; startAngle: number; endAngle: number }

    const donutPaths = donutTotal > 0
      ? donutSegments
          .filter(seg => seg.count > 0)
          .reduce<{ acc: DonutSlice[]; angle: number }>(
            (prev, seg) => {
              const sliceAngle = (seg.count / donutTotal) * 360;
              const startA = prev.angle;
              const endA = prev.angle + sliceAngle;
              return {
                acc: [...prev.acc, { ...seg, startAngle: startA, endAngle: endA }],
                angle: endA,
              };
            },
            { acc: [], angle: 0 }
          ).acc
      : [];

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Activity Distribution</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 flex-shrink-0">
              {donutPaths.map((seg, i) => (
                <path
                  key={i}
                  d={describeDonutArc(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
                  fill={seg.fill}
                  opacity="0.8"
                />
              ))}
              {donutPaths.length === 0 && (
                <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#30363d" strokeWidth={outerR - innerR} />
              )}
            </svg>
            <div className="flex-1 space-y-1">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.fill }} />
                  <span className="text-[10px] text-[#8b949e] flex-1">{seg.label}</span>
                  <span className="text-[10px] text-[#c9d1d9] font-medium">{seg.count}</span>
                </div>
              ))}
              <div className="text-[10px] text-[#484f58] pt-0.5">{donutTotal} total activities</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 3: Energy Level Gauge
  // ============================================================
  function energyGauge(): React.JSX.Element {
    const pct = maxEnergy > 0 ? Math.round((energyRemaining / maxEnergy) * 100) : 0;
    const gaugeAngle = Math.round(pct * 1.8);
    const gaugeColor = pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444';
    const cx = 100;
    const cy = 90;
    const r = 70;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Energy Level</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 120" fill="none" className="w-full">
            <path d={describeArc(cx, cy, r, 0, 180)} stroke="#30363d" strokeWidth="10" strokeLinecap="round" />
            <path d={describeArc(cx, cy, r, 0, gaugeAngle)} stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
            <text x={cx} y={cy - 10} textAnchor="middle" fill={gaugeColor} fontSize="24" fontWeight="700">{pct}%</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="9">{energyRemaining}/{maxEnergy} remaining</text>
            <text x={20} y={cy + 24} fill="#484f58" fontSize="8">0</text>
            <text x={cx - 4} y={cy - r - 2} fill="#484f58" fontSize="8">50</text>
            <text x={180} y={cy + 24} fill="#484f58" fontSize="8">100</text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 4: Weekly Training Load Bars
  // ============================================================
  function trainingLoadBars(): React.JSX.Element {
    const barH = 12;
    const barGap = 28;
    const labelW = 28;
    const barMaxW = 130;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Weekly Training Load</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 210" fill="none" className="w-full">
            {DAYS.map((day, i) => {
              const y = 10 + i * barGap;
              const val = trainingLoadPerDay[i] as number;
              const w = maxLoad > 0 ? (val / maxLoad) * barMaxW : 0;
              const barColor = val > 70 ? '#ef4444' : val > 40 ? '#f59e0b' : '#10b981';
              return (
                <g key={i}>
                  <text x={0} y={y + 10} fill="#8b949e" fontSize="9" fontWeight="600">{day}</text>
                  <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#21262d" />
                  <rect x={labelW} y={y} width={Math.max(0, w)} height={barH} rx="3" fill={barColor} opacity="0.85" />
                  <text x={labelW + barMaxW + 6} y={y + 10} fill="#c9d1d9" fontSize="8">{val}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 5: Recovery Progress Ring
  // ============================================================
  function recoveryRing(): React.JSX.Element {
    const recoveryPct = donutTotal > 0 ? Math.round((catCounts.recovery / donutTotal) * 100) : 0;
    const cx = 60;
    const cy = 60;
    const r = 45;
    const circumference = 2 * Math.PI * r;
    const dashLen = (recoveryPct / 100) * circumference;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Recovery Progress</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 flex-shrink-0">
              <circle cx={cx} cy={cy} r={r} stroke="#21262d" strokeWidth="8" />
              <circle
                cx={cx} cy={cy} r={r}
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeLinecap="round"
                strokeDashoffset={circumference * 0.25}
              />
              <text x={cx} y={cy - 2} textAnchor="middle" fill="#3b82f6" fontSize="22" fontWeight="700">{recoveryPct}%</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">Recovery</text>
            </svg>
            <div className="flex-1 space-y-2">
              <div className="text-[10px] text-[#8b949e]">
                <span className="text-blue-400 font-semibold">{catCounts.recovery}</span> recovery sessions
              </div>
              <div className="text-[10px] text-[#8b949e]">
                of <span className="text-[#c9d1d9] font-medium">{donutTotal}</span> total scheduled
              </div>
              <div className="text-[10px] text-[#484f58] pt-1">
                {recoveryPct >= 20 ? 'Adequate recovery balance' : 'Consider adding recovery slots'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 6: Nutrition Tracking Area Chart
  // ============================================================
  function nutritionAreaChart(): React.JSX.Element {
    const maxCal = Math.max(...CALORIE_INTAKE);
    const chartW = 170;
    const chartH = 80;
    const offsetX = 15;
    const offsetY = 10;
    const stepX = chartW / 6;

    const areaCoords: [number, number][] = [];
    const lineCoords: [number, number][] = [];
    CALORIE_INTAKE.forEach((cal, i) => {
      const x = offsetX + i * stepX;
      const y = offsetY + chartH - (cal / maxCal) * chartH;
      areaCoords.push([x, y]);
      lineCoords.push([x, y]);
    });
    areaCoords.push([offsetX + 6 * stepX, offsetY + chartH]);
    areaCoords.unshift([offsetX, offsetY + chartH]);

    const areaPoints = buildPointsStr(areaCoords);
    const linePoints = buildPointsStr(lineCoords);

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Nutrition Tracking</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 110" fill="none" className="w-full">
            <polygon points={areaPoints} fill="#f59e0b" opacity="0.12" />
            <polyline points={linePoints} stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
            {CALORIE_INTAKE.map((cal, i) => {
              const x = offsetX + i * stepX;
              const y = offsetY + chartH - (cal / maxCal) * chartH;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="3" fill="#f59e0b" />
                  <text x={x} y={y - 8} textAnchor="middle" fill="#c9d1d9" fontSize="7">{cal}</text>
                  <text x={x} y={offsetY + chartH + 14} textAnchor="middle" fill="#8b949e" fontSize="7">{DAYS[i]}</text>
                </g>
              );
            })}
          </svg>
          <div className="text-[10px] text-[#484f58] mt-1">Daily calorie intake (kcal)</div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 7: Sleep Quality Bars
  // ============================================================
  function sleepBars(): React.JSX.Element {
    const maxSleep = 10;
    const barH = 12;
    const barGap = 28;
    const labelW = 28;
    const barMaxW = 130;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Sleep Quality</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 210" fill="none" className="w-full">
            {SLEEP_HOURS.map((hrs, i) => {
              const y = 10 + i * barGap;
              const w = (hrs / maxSleep) * barMaxW;
              const barColor = hrs >= 8 ? '#10b981' : hrs >= 7 ? '#f59e0b' : '#ef4444';
              return (
                <g key={i}>
                  <text x={0} y={y + 10} fill="#8b949e" fontSize="9" fontWeight="600">{DAYS[i]}</text>
                  <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#21262d" />
                  <rect x={labelW} y={y} width={Math.max(0, w)} height={barH} rx="3" fill={barColor} opacity="0.85" />
                  <text x={labelW + barMaxW + 6} y={y + 10} fill="#c9d1d9" fontSize="8">{hrs}h</text>
                </g>
              );
            })}
          </svg>
          <div className="flex justify-between text-[10px] text-[#484f58] mt-1 px-7">
            <span>&lt;7h Poor</span>
            <span>7-8h Fair</span>
            <span>8h+ Optimal</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 8: Training Focus Radar
  // ============================================================
  function trainingFocusRadar(): React.JSX.Element {
    const cx = 100;
    const cy = 100;
    const maxR = 70;
    const numAxes = RADAR_AXES.length;
    const angleStep = 360 / numAxes;

    const gridRings = [0.25, 0.5, 0.75, 1.0];
    const gridPaths = gridRings.map(scale => {
      const pts: [number, number][] = RADAR_AXES.map((_, i) => {
        const pt = polarToCart(cx, cy, maxR * scale, i * angleStep);
        return [pt.x, pt.y];
      });
      return buildPointsStr(pts);
    });

    const valuePoints: [number, number][] = RADAR_AXES.map((_, i) => {
      const val = radarValues[i] / 100;
      const pt = polarToCart(cx, cy, maxR * val, i * angleStep);
      return [pt.x, pt.y];
    });
    const valuePathStr = buildPointsStr(valuePoints);

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Training Focus</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 200" fill="none" className="w-full max-w-[200px] mx-auto">
            {gridPaths.map((pts, i) => (
              <polygon key={i} points={pts} stroke="#30363d" strokeWidth="1" />
            ))}
            {RADAR_AXES.map((_, i) => {
              const pt = polarToCart(cx, cy, maxR, i * angleStep);
              return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#30363d" strokeWidth="1" />;
            })}
            <polygon points={valuePathStr} fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="2" />
            {RADAR_AXES.map((label, i) => {
              const pt = polarToCart(cx, cy, maxR + 16, i * angleStep);
              return (
                <text key={i} x={pt.x} y={pt.y + 3} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="500">
                  {label}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 9: Rest Day Benefits Bars
  // ============================================================
  function restBenefitsBars(): React.JSX.Element {
    const barH = 16;
    const barGap = 38;
    const labelW = 80;
    const barMaxW = 90;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Rest Day Benefits</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 165" fill="none" className="w-full">
            {REST_BENEFITS.map((item, i) => {
              const y = 8 + i * barGap;
              const w = (item.value / 100) * barMaxW;
              return (
                <g key={i}>
                  <text x={0} y={y + 12} fill="#8b949e" fontSize="8">{item.label}</text>
                  <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#21262d" />
                  <rect x={labelW} y={y} width={Math.max(0, w)} height={barH} rx="3" className={item.color} opacity="0.85" />
                  <text x={labelW + barMaxW + 6} y={y + 12} fill="#c9d1d9" fontSize="8">{item.value}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 10: Schedule Adherence Ring
  // ============================================================
  function scheduleAdherenceRing(): React.JSX.Element {
    const adherencePct = Math.round((totalScheduled / 14) * 100);
    const cx = 60;
    const cy = 60;
    const r = 45;
    const circumference = 2 * Math.PI * r;
    const dashLen = (adherencePct / 100) * circumference;
    const ringColor = adherencePct >= 70 ? '#10b981' : adherencePct >= 40 ? '#f59e0b' : '#ef4444';

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Schedule Adherence</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 flex-shrink-0">
              <circle cx={cx} cy={cy} r={r} stroke="#21262d" strokeWidth="8" />
              <circle
                cx={cx} cy={cy} r={r}
                stroke={ringColor}
                strokeWidth="8"
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeLinecap="round"
                strokeDashoffset={circumference * 0.25}
              />
              <text x={cx} y={cy - 2} textAnchor="middle" fill={ringColor} fontSize="22" fontWeight="700">{adherencePct}%</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">Filled</text>
            </svg>
            <div className="flex-1 space-y-2">
              <div className="text-[10px] text-[#8b949e]">
                <span className="text-[#c9d1d9] font-semibold">{totalScheduled}</span> of 14 slots
              </div>
              <div className="text-[10px] text-[#8b949e]">
                <span className="text-[#c9d1d9] font-medium">{14 - totalScheduled}</span> remaining
              </div>
              <div className="text-[10px] text-[#484f58] pt-1">
                {adherencePct >= 70 ? 'Great week planning!' : adherencePct >= 40 ? 'Keep filling your schedule' : 'Plan your week ahead'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // SVG 11: Work-Life Balance Scatter
  // ============================================================
  function workLifeScatter(): React.JSX.Element {
    const plotW = 160;
    const plotH = 120;
    const offX = 25;
    const offY = 10;
    const maxX = 10;
    const maxY = 10;

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="px-4 py-3 pb-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Work-Life Balance</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <svg viewBox="0 0 200 160" fill="none" className="w-full">
            <line x1={offX} y1={offY + plotH} x2={offX + plotW} y2={offY + plotH} stroke="#30363d" strokeWidth="1" />
            <line x1={offX} y1={offY} x2={offX} y2={offY + plotH} stroke="#30363d" strokeWidth="1" />
            <text x={offX + plotW / 2} y={offY + plotH + 16} textAnchor="middle" fill="#8b949e" fontSize="7">Football Hours</text>
            <text x={8} y={offY + plotH / 2} textAnchor="middle" fill="#8b949e" fontSize="7" dominantBaseline="middle">Personal</text>
            {scatterData.map((pt, i) => {
              const dotX = offX + (pt.x / maxX) * plotW;
              const dotY = offY + plotH - (pt.y / maxY) * plotH;
              const dotColor = i === currentDayIndex ? '#10b981' : '#3b82f6';
              return (
                <g key={i}>
                  <circle cx={dotX} cy={dotY} r={i === currentDayIndex ? 5 : 4} fill={dotColor} opacity={i === currentDayIndex ? 1 : 0.7} />
                  <text x={dotX + 7} y={dotY + 3} fill="#8b949e" fontSize="6">{pt.day}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
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

      {/* ---- SVG Data Visualizations ---- */}
      {dailyRoutineTimeline()}
      {activityDonut()}
      {energyGauge()}
      {trainingLoadBars()}
      {recoveryRing()}
      {nutritionAreaChart()}
      {sleepBars()}
      {trainingFocusRadar()}
      {restBenefitsBars()}
      {scheduleAdherenceRing()}
      {workLifeScatter()}
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
