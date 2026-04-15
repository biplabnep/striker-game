'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calendar,
  Dumbbell,
  Heart,
  Brain,
  TrendingUp,
  Zap,
  Battery,
  Shield,
  Moon,
  Sun,
  Activity,
  Target,
  BarChart3,
  BedDouble,
  Droplets,
  Flame,
  Wind,
  Users,
  BookOpen,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

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
// Design Tokens
// ============================================================

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';

// ============================================================
// Web3 Colors
// ============================================================

const W3_ORANGE = '#FF5500';
const W3_LIME = '#CCFF00';
const W3_CYAN = '#00E5FF';
const W3_GRAY = '#666666';

// ============================================================
// Animation Variants
// ============================================================

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const staggerChild = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } };

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

interface SlotSelection {
  day: string;
  period: 'am' | 'pm';
}

interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  hoverBg: string;
}

// ============================================================
// Constants
// ============================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const ENERGY_PER_COST = 8;
const TOTAL_SLOTS = 14;

const CATEGORY_META: CategoryMeta[] = [
  { id: 'training', label: 'Training', color: W3_ORANGE, bgClass: 'bg-[#FF5500]/10', textClass: 'text-[#FF5500]', borderClass: 'border-[#FF5500]/30', hoverBg: 'hover:bg-[#FF5500]/20' },
  { id: 'recovery', label: 'Recovery', color: W3_CYAN, bgClass: 'bg-[#00E5FF]/10', textClass: 'text-[#00E5FF]', borderClass: 'border-[#00E5FF]/30', hoverBg: 'hover:bg-[#00E5FF]/20' },
  { id: 'nutrition', label: 'Nutrition', color: W3_LIME, bgClass: 'bg-[#CCFF00]/10', textClass: 'text-[#CCFF00]', borderClass: 'border-[#CCFF00]/30', hoverBg: 'hover:bg-[#CCFF00]/20' },
  { id: 'mental', label: 'Mental', color: W3_ORANGE, bgClass: 'bg-[#FF5500]/10', textClass: 'text-[#FF5500]', borderClass: 'border-[#FF5500]/30', hoverBg: 'hover:bg-[#FF5500]/20' },
  { id: 'social', label: 'Social', color: W3_CYAN, bgClass: 'bg-[#00E5FF]/10', textClass: 'text-[#00E5FF]', borderClass: 'border-[#00E5FF]/30', hoverBg: 'hover:bg-[#00E5FF]/20' },
  { id: 'education', label: 'Education', color: W3_GRAY, bgClass: 'bg-[#666666]/10', textClass: 'text-[#666666]', borderClass: 'border-[#666666]/30', hoverBg: 'hover:bg-[#666666]/20' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORY_META.map(c => [c.id, c])) as Record<CategoryId, CategoryMeta>;

const ACTIVITIES: Activity[] = [
  { id: 'shooting_practice', name: 'Shooting Practice', abbrev: 'Shoot', category: 'training', icon: Target, energyCost: 3, description: 'Focused drills on finishing, volleys, and placement.', effects: { shooting: 2 } },
  { id: 'dribbling_drills', name: 'Dribbling Drills', abbrev: 'Dribble', category: 'training', icon: Activity, energyCost: 3, description: 'Close control exercises through cones and tight spaces.', effects: { dribbling: 2 } },
  { id: 'passing_training', name: 'Passing Training', abbrev: 'Pass', category: 'training', icon: Users, energyCost: 2, description: 'Short, long, and through-ball passing drills.', effects: { passing: 2 } },
  { id: 'fitness_session', name: 'Fitness Session', abbrev: 'Fitness', category: 'training', icon: Dumbbell, energyCost: 4, description: 'Endurance and conditioning work.', effects: { pace: 1, physical: 2 } },
  { id: 'sprint_training', name: 'Sprint Training', abbrev: 'Sprint', category: 'training', icon: Zap, energyCost: 5, description: 'Explosive speed work with recovery intervals.', effects: { pace: 3 } },
  { id: 'strength_training', name: 'Strength Training', abbrev: 'Strength', category: 'training', icon: Flame, energyCost: 4, description: 'Compound lifts for power and resilience.', effects: { physical: 3 } },
  { id: 'ice_bath', name: 'Ice Bath', abbrev: 'Ice', category: 'recovery', icon: Droplets, energyCost: 1, description: 'Cold water immersion to reduce inflammation.', effects: { physical: 1 } },
  { id: 'massage_therapy', name: 'Massage Therapy', abbrev: 'Massage', category: 'recovery', icon: Heart, energyCost: 1, description: 'Deep tissue work to relieve tension.', effects: { pace: 1 } },
  { id: 'yoga_stretching', name: 'Yoga & Stretching', abbrev: 'Yoga', category: 'recovery', icon: Wind, energyCost: 2, description: 'Flexibility and mobility routines.', effects: { dribbling: 1, pace: 1 } },
  { id: 'rest_day', name: 'Rest Day', abbrev: 'Rest', category: 'recovery', icon: BedDouble, energyCost: 0, description: 'Complete rest for physical and mental regeneration.', effects: { physical: 2 } },
  { id: 'meal_prep', name: 'Meal Prep', abbrev: 'Meals', category: 'nutrition', icon: Sun, energyCost: 1, description: 'Plan and prepare balanced meals.', effects: { physical: 1, pace: 1 } },
  { id: 'hydration_plan', name: 'Hydration Plan', abbrev: 'Hydrate', category: 'nutrition', icon: Droplets, energyCost: 1, description: 'Structured fluid intake tracking.', effects: { pace: 1 } },
  { id: 'supplement_review', name: 'Supplement Review', abbrev: 'Supplm', category: 'nutrition', icon: Shield, energyCost: 1, description: 'Evaluate supplement stack with sports science.', effects: { physical: 1 } },
  { id: 'meditation', name: 'Meditation', abbrev: 'Meditate', category: 'mental', icon: Brain, energyCost: 1, description: 'Mindfulness and breathing exercises.', effects: { passing: 1, dribbling: 1 } },
  { id: 'video_analysis', name: 'Video Analysis', abbrev: 'Video', category: 'mental', icon: BarChart3, energyCost: 2, description: 'Study opponents and tactical patterns.', effects: { defending: 1, passing: 1 } },
  { id: 'mental_coaching', name: 'Mental Coaching', abbrev: 'Mental', category: 'mental', icon: MessageCircle, energyCost: 2, description: 'Sports psychology sessions.', effects: { shooting: 1, passing: 1 } },
  { id: 'team_bonding', name: 'Team Bonding', abbrev: 'Bonding', category: 'social', icon: Users, energyCost: 2, description: 'Group activities to strengthen chemistry.', effects: { passing: 1, physical: 1 } },
  { id: 'media_interview', name: 'Media Interview', abbrev: 'Media', category: 'social', icon: MessageCircle, energyCost: 2, description: 'Press conference or interview.', effects: { shooting: 1 } },
  { id: 'tactical_study', name: 'Tactical Study', abbrev: 'Tactics', category: 'education', icon: BookOpen, energyCost: 2, description: 'Classroom sessions on formations.', effects: { defending: 1, passing: 1 } },
  { id: 'language_learning', name: 'Language Learning', abbrev: 'Language', category: 'education', icon: BookOpen, energyCost: 1, description: 'Study a new language.', effects: { passing: 1, dribbling: 1 } },
];

const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<string, Activity>;

const ATTR_LABELS: { key: keyof ActivityEffect; label: string }[] = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
];

// ============================================================
// Helper Functions
// ============================================================

function buildEmptySchedule(): WeeklySchedule {
  return Object.fromEntries(DAYS.map(d => [d, { am: null, pm: null }])) as WeeklySchedule;
}

function countActivitiesForDay(schedule: WeeklySchedule, day: string): number {
  const slot = schedule[day];
  if (!slot) return 0;
  return ['am', 'pm'].reduce((count, period) => {
    return count + (slot[period] ? 1 : 0);
  }, 0);
}

function calculateTotalScheduled(schedule: WeeklySchedule): number {
  return DAYS.reduce((total, day) => total + countActivitiesForDay(schedule, day), 0);
}

function calculateEnergyUsed(schedule: WeeklySchedule): number {
  return DAYS.reduce((used, day) => {
    const slot = schedule[day];
    if (!slot) return used;
    const amCost = slot.am && ACTIVITY_MAP[slot.am] ? ACTIVITY_MAP[slot.am].energyCost * ENERGY_PER_COST : 0;
    const pmCost = slot.pm && ACTIVITY_MAP[slot.pm] ? ACTIVITY_MAP[slot.pm].energyCost * ENERGY_PER_COST : 0;
    return used + amCost + pmCost;
  }, 0);
}

function calculateNetEffects(schedule: WeeklySchedule): ActivityEffect {
  return DAYS.reduce((net, day) => {
    const slot = schedule[day];
    if (!slot) return net;
    return ['am', 'pm'].reduce((acc, period) => {
      const actId = slot[period];
      if (!actId || !ACTIVITY_MAP[actId]) return acc;
      const act = ACTIVITY_MAP[actId];
      return Object.entries(act.effects).reduce((inner, [key, val]) => {
        const k = key as keyof ActivityEffect;
        return { ...inner, [k]: (inner[k] || 0) + (val || 0) };
      }, acc);
    }, net);
  }, {} as ActivityEffect);
}

function getCategoryCounts(schedule: WeeklySchedule): Record<CategoryId, number> {
  const initial: Record<CategoryId, number> = { training: 0, recovery: 0, nutrition: 0, mental: 0, social: 0, education: 0 };
  return DAYS.reduce((counts, day) => {
    const slot = schedule[day];
    if (!slot) return counts;
    return ['am', 'pm'].reduce((acc, period) => {
      const actId = slot[period];
      if (!actId || !ACTIVITY_MAP[actId]) return acc;
      return { ...acc, [ACTIVITY_MAP[actId].category]: acc[ACTIVITY_MAP[actId].category] + 1 };
    }, counts);
  }, initial);
}

function getEnergyBarColor(remaining: number, max: number): string {
  const pct = max > 0 ? (remaining / max) * 100 : 100;
  if (pct > 60) return 'bg-[#CCFF00]';
  if (pct > 30) return 'bg-[#FF5500]';
  return 'bg-red-500';
}

// ============================================================
// Sample Data Constants (derived from player stats)
// ============================================================

const SAMPLE_CONSISTENCY = [62, 71, 68, 75, 80, 73, 78, 82];
const SAMPLE_WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
const SAMPLE_SLEEP = [7.5, 6.0, 8.0, 7.0, 6.5, 9.0, 8.5];
const INJURY_RISK_LABELS = ['Hamstring', 'Ankle', 'Knee', 'Shoulder', 'Muscle'];
const WELLBEING_CATEGORIES = ['Training', 'Rest', 'Social', 'Nutrition', 'Mental'];
const RADAR_AXES = ['Speed', 'Power', 'Technique', 'Stamina', 'Focus'];

// ============================================================
// SVG Component: ActivityDistributionDonut
// ============================================================

function ActivityDistributionDonut({ catCounts }: { catCounts: Record<CategoryId, number> }) {
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 50;
  const segmentGap = 3;
  const colors = [W3_ORANGE, W3_CYAN, W3_LIME, W3_ORANGE, W3_CYAN, W3_GRAY];
  const labels: CategoryId[] = ['training', 'recovery', 'nutrition', 'mental', 'social', 'education'];

  const total = labels.reduce((sum, label) => sum + catCounts[label], 0);

  const segments = (() => {
    if (total === 0) return [];
    let currentAngle = 0;
    return labels.reduce((acc, label, i) => {
      const count = catCounts[label];
      if (count === 0) return acc;
      const angle = (count / total) * 360;
      const startAngle = currentAngle + segmentGap;
      const endAngle = currentAngle + angle - segmentGap;
      const midAngle = currentAngle + angle / 2;
      const path = describeDonutArc(cx, cy, outerR, innerR, startAngle, Math.max(startAngle + 0.5, endAngle));
      const pct = Math.round((count / total) * 100);
      currentAngle += angle;
      return [...acc, { path, color: colors[i], label, count, pct, midAngle }];
    }, [] as { path: string; color: string; label: CategoryId; count: number; pct: number; midAngle: number }[]);
  })();

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Activity Distribution</h4>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} opacity={0.85} />
        ))}
        {total === 0 && (
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={W3_GRAY} strokeWidth={outerR - innerR} opacity={0.2} />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={TEXT_PRIMARY} className="text-[14px] font-bold" fontSize="14">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={TEXT_SECONDARY} className="text-[9px]" fontSize="9">
          activities
        </text>
      </svg>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors[i] }} />
            <span className="text-[9px] capitalize" style={{ color: colors[i] }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SVG Component: WeeklyEnergyLoadAreaChart
// ============================================================

function WeeklyEnergyLoadAreaChart({ schedule }: { schedule: WeeklySchedule }) {
  const chartW = 260;
  const chartH = 100;
  const padX = 30;
  const padY = 10;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const energyPerDay = useMemo(() => {
    return DAYS.map(day => {
      const slot = schedule[day];
      if (!slot) return 0;
      return ['am', 'pm'].reduce((sum, period) => {
        const actId = slot[period];
        if (!actId || !ACTIVITY_MAP[actId]) return sum;
        return sum + ACTIVITY_MAP[actId].energyCost * ENERGY_PER_COST;
      }, 0);
    });
  }, [schedule]);

  const maxVal = useMemo(() => Math.max(...energyPerDay, 1), [energyPerDay]);

  const points = useMemo(() => {
    return energyPerDay.map((val, i) => {
      const x = padX + (i / 6) * plotW;
      const y = padY + plotH - (val / maxVal) * plotH;
      return [x, y] as [number, number];
    });
  }, [energyPerDay, maxVal, plotW, plotH, padX, padY]);

  const baseline = useMemo(() => {
    return DAYS.map((_, i) => {
      const x = padX + (i / 6) * plotW;
      return [x, padY + plotH] as [number, number];
    });
  }, [plotW, padX, padY, plotH]);

  const areaPoints = useMemo(() => {
    return buildPointsStr([...points, ...baseline.slice().reverse()]);
  }, [points, baseline]);

  const linePoints = useMemo(() => buildPointsStr(points), [points]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Weekly Energy Load</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padY + plotH - pct * plotH;
          return <line key={i} x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#30363d" strokeWidth="0.5" />;
        })}
        {/* Area fill */}
        <polygon points={areaPoints} fill={W3_CYAN} opacity={0.15} />
        {/* Line */}
        <polyline points={linePoints} fill="none" stroke={W3_CYAN} strokeWidth="2" strokeLinejoin="round" />
        {/* Data points */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={W3_CYAN} opacity={0.9} />
        ))}
        {/* Day labels */}
        {DAYS.map((day, i) => {
          const x = padX + (i / 6) * plotW;
          return (
            <text key={i} x={x} y={chartH - 1} textAnchor="middle" fill="#8b949e" fontSize="8">
              {day}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: ScheduleCompletionRing
// ============================================================

function ScheduleCompletionRing({ schedule }: { schedule: WeeklySchedule }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeW = 12;

  const filledSlots = useMemo(() => calculateTotalScheduled(schedule), [schedule]);
  const pct = TOTAL_SLOTS > 0 ? filledSlots / TOTAL_SLOTS : 0;
  const angle = pct * 360;

  const bgArc = useMemo(() => describeArc(cx, cy, r, 0, 360), [cx, cy, r]);
  const fgArc = useMemo(() => {
    if (angle < 0.5) return '';
    return describeArc(cx, cy, r, 0, angle);
  }, [cx, cy, r, angle]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Schedule Completion</h4>
      <svg viewBox="0 0 200 200" className="w-full max-w-[160px] mx-auto">
        <path d={bgArc} fill="none" stroke="#30363d" strokeWidth={strokeW} strokeLinecap="round" />
        {fgArc && (
          <path d={fgArc} fill="none" stroke={W3_ORANGE} strokeWidth={strokeW} strokeLinecap="round" opacity={0.9} />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={W3_ORANGE} className="text-[22px] font-bold" fontSize="22">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" className="text-[9px]" fontSize="9">
          {filledSlots}/{TOTAL_SLOTS} slots
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: AttributeGainsBars
// ============================================================

function AttributeGainsBars({ effects, attributes }: { effects: ActivityEffect; attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number } }) {
  const chartW = 260;
  const chartH = 180;
  const padX = 40;
  const padY = 15;
  const barH = 16;
  const barGap = 12;
  const plotW = chartW - padX - 20;

  const projectedGains = useMemo(() => {
    return ATTR_LABELS.map(({ key, label }) => {
      const base = attributes[key] ?? 50;
      const gain = (effects[key] || 0) * 2;
      return { label, base, gain, total: Math.min(99, base + gain) };
    });
  }, [effects, attributes]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Projected Attribute Gains</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {projectedGains.map((item, i) => {
          const y = padY + i * (barH + barGap);
          const barW = (item.base / 99) * plotW;
          const gainW = (item.gain / 99) * plotW;
          return (
            <g key={i}>
              <text x={padX - 6} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="10" fontWeight="600">
                {item.label}
              </text>
              <rect x={padX} y={y} width={barW} height={barH} rx="3" fill="#30363d" />
              {gainW > 0 && (
                <rect x={padX + barW} y={y} width={gainW} height={barH} rx="3" fill={W3_LIME} opacity={0.7} />
              )}
              <text x={padX + barW + gainW + 6} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="9" fontWeight="600">
                {item.base}
                {item.gain > 0 && (
                  <tspan fill={W3_LIME}> +{item.gain}</tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: TrainingConsistencyLine
// ============================================================

function TrainingConsistencyLine({ fitness }: { fitness: number }) {
  const chartW = 260;
  const chartH = 120;
  const padX = 30;
  const padY = 15;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const data = useMemo(() => {
    const base = Math.min(fitness + 10, 95);
    return SAMPLE_CONSISTENCY.map((v, i) => {
      const adjusted = Math.min(99, Math.max(20, v + (base - 70) * 0.3 + (Math.sin(i * 1.5) * 5)));
      return Math.round(adjusted);
    });
  }, [fitness]);

  const maxVal = 100;
  const minVal = 0;

  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = padX + (i / (data.length - 1)) * plotW;
      const y = padY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
      return [x, y] as [number, number];
    });
  }, [data, plotW, plotH, padX, padY, minVal, maxVal]);

  const linePoints = useMemo(() => buildPointsStr(points), [points]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Training Consistency (8 Weeks)</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {[0, 25, 50, 75, 100].map((pct, i) => {
          const y = padY + plotH - (pct / 100) * plotH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#30363d" strokeWidth="0.5" />
              <text x={padX - 5} y={y + 3} textAnchor="end" fill="#8b949e" fontSize="7">{pct}</text>
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" stroke={W3_CYAN} strokeWidth="2" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill={W3_CYAN} opacity={0.9} />
            {i === data.length - 1 && (
              <text x={x + 6} y={y + 3} fill={W3_CYAN} fontSize="8" fontWeight="600">{data[i]}</text>
            )}
          </g>
        ))}
        {SAMPLE_WEEKS.map((week, i) => {
          const x = padX + (i / (SAMPLE_WEEKS.length - 1)) * plotW;
          return (
            <text key={i} x={x} y={chartH - 2} textAnchor="middle" fill="#8b949e" fontSize="7">
              {week}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: PeakPerformanceRadar
// ============================================================

function PeakPerformanceRadar({ attributes, fitness, morale }: { attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }; fitness: number; morale: number }) {
  const cx = 130;
  const cy = 130;
  const maxR = 100;

  const values = useMemo(() => {
    const speed = attributes.pace;
    const power = attributes.physical;
    const technique = Math.round((attributes.shooting + attributes.dribbling + attributes.passing) / 3);
    const stamina = fitness;
    const focus = morale;
    return [speed, power, technique, stamina, focus];
  }, [attributes, fitness, morale]);

  const axisCount = RADAR_AXES.length;
  const angleStep = 360 / axisCount;

  const gridPoints = useMemo(() => {
    return [0.25, 0.5, 0.75, 1].map(scale => {
      return RADAR_AXES.map((_, i) => {
        const angle = i * angleStep - 90;
        const pt = polarToCart(cx, cy, maxR * scale, angle);
        return [pt.x, pt.y] as [number, number];
      });
    });
  }, [cx, cy, maxR, angleStep]);

  const dataPoints = useMemo(() => {
    return RADAR_AXES.map((_, i) => {
      const val = values[i] ?? 50;
      const r = (val / 100) * maxR;
      const angle = i * angleStep - 90;
      const pt = polarToCart(cx, cy, r, angle);
      return [pt.x, pt.y] as [number, number];
    });
  }, [values, cx, cy, maxR, angleStep]);

  const dataPolygonStr = useMemo(() => buildPointsStr(dataPoints), [dataPoints]);

  const axisEndpoints = useMemo(() => {
    return RADAR_AXES.map((_, i) => {
      const angle = i * angleStep - 90;
      const pt = polarToCart(cx, cy, maxR, angle);
      return { ...pt, label: RADAR_AXES[i], value: values[i] };
    });
  }, [angleStep, cx, cy, maxR, values]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Peak Performance Radar</h4>
      <svg viewBox="0 0 260 260" className="w-full max-w-[240px] mx-auto">
        {/* Grid polygons */}
        {gridPoints.map((polygon, i) => (
          <polygon key={i} points={buildPointsStr(polygon)} fill="none" stroke="#30363d" strokeWidth="0.5" />
        ))}
        {/* Axis lines */}
        {axisEndpoints.map((ep, i) => (
          <line key={i} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#30363d" strokeWidth="0.5" />
        ))}
        {/* Data polygon */}
        <polygon points={dataPolygonStr} fill={W3_ORANGE} opacity={0.15} stroke={W3_ORANGE} strokeWidth="1.5" />
        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={W3_ORANGE} />
        ))}
        {/* Labels */}
        {axisEndpoints.map((ep, i) => {
          const labelR = maxR + 14;
          const angle = i * angleStep - 90;
          const lp = polarToCart(cx, cy, labelR, angle);
          return (
            <g key={i}>
              <text x={lp.x} y={lp.y - 3} textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="600">
                {ep.label}
              </text>
              <text x={lp.x} y={lp.y + 7} textAnchor="middle" fill={W3_ORANGE} fontSize="7">
                {ep.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: RecoveryStatusGauge
// ============================================================

function RecoveryStatusGauge({ fitness, morale }: { fitness: number; morale: number }) {
  const cx = 120;
  const cy = 110;
  const r = 80;
  const strokeW = 14;

  const recoveryScore = useMemo(() => {
    return Math.round((fitness * 0.6 + morale * 0.4));
  }, [fitness, morale]);

  const gaugeAngle = (recoveryScore / 100) * 180;

  const bgArc = useMemo(() => describeArc(cx, cy, r, 0, 180), [cx, cy, r]);
  const fgArc = useMemo(() => {
    if (gaugeAngle < 0.5) return '';
    return describeArc(cx, cy, r, 0, gaugeAngle);
  }, [cx, cy, r, gaugeAngle]);

  const scoreColor = useMemo(() => {
    if (recoveryScore >= 75) return W3_LIME;
    if (recoveryScore >= 45) return W3_ORANGE;
    return '#ff3333';
  }, [recoveryScore]);

  const statusLabel = useMemo(() => {
    if (recoveryScore >= 85) return 'Excellent';
    if (recoveryScore >= 65) return 'Good';
    if (recoveryScore >= 45) return 'Moderate';
    return 'Low';
  }, [recoveryScore]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Recovery Status</h4>
      <svg viewBox="0 0 240 160" className="w-full max-w-[220px] mx-auto">
        <path d={bgArc} fill="none" stroke="#30363d" strokeWidth={strokeW} strokeLinecap="round" />
        {fgArc && (
          <path d={fgArc} fill="none" stroke={scoreColor} strokeWidth={strokeW} strokeLinecap="round" opacity={0.9} />
        )}
        {/* Needle dot */}
        {(() => {
          const needleAngle = (recoveryScore / 100) * 180;
          const pt = polarToCart(cx, cy, r, needleAngle);
          return <circle cx={pt.x} cy={pt.y} r="5" fill={scoreColor} />;
        })()}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={scoreColor} className="text-[26px] font-bold" fontSize="26">
          {recoveryScore}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" className="text-[10px]" fontSize="10">
          {statusLabel}
        </text>
        {/* Scale labels */}
        <text x={cx - r - 5} y={cy + 20} textAnchor="middle" fill="#8b949e" fontSize="8">0</text>
        <text x={cx + r + 5} y={cy + 20} textAnchor="middle" fill="#8b949e" fontSize="8">100</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: InjuryRiskBars
// ============================================================

function InjuryRiskBars({ fitness, age }: { fitness: number; age: number }) {
  const chartW = 260;
  const chartH = 160;
  const padX = 72;
  const padY = 10;
  const barH = 14;
  const barGap = 12;
  const plotW = chartW - padX - 16;

  const riskValues = useMemo(() => {
    const baseRisk = Math.max(0, 100 - fitness) * 0.5;
    const ageFactor = age > 30 ? (age - 30) * 3 : 0;
    const base = baseRisk + ageFactor;
    return INJURY_RISK_LABELS.map((_, i) => {
      const variation = Math.sin(i * 2.1 + 0.5) * 10;
      return Math.max(5, Math.min(95, Math.round(base + variation + i * 4)));
    });
  }, [fitness, age]);

  const getBarColor = (val: number): string => {
    if (val >= 60) return '#ff3333';
    if (val >= 35) return W3_ORANGE;
    return W3_CYAN;
  };

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Injury Risk Assessment</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {riskValues.map((val, i) => {
          const y = padY + i * (barH + barGap);
          const barW = (val / 100) * plotW;
          const color = getBarColor(val);
          return (
            <g key={i}>
              <text x={padX - 6} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="9">
                {INJURY_RISK_LABELS[i]}
              </text>
              <rect x={padX} y={y} width={plotW} height={barH} rx="3" fill="#30363d" />
              <rect x={padX} y={y} width={barW} height={barH} rx="3" fill={color} opacity={0.75} />
              <text x={padX + barW + 5} y={y + barH / 2 + 3} fill={color} fontSize="8" fontWeight="600">
                {val}%
              </text>
            </g>
          );
        })}
        {/* Threshold line */}
        <line x1={padX + plotW * 0.6} y1={padY} x2={padX + plotW * 0.6} y2={padY + INJURY_RISK_LABELS.length * (barH + barGap)} stroke="#ff3333" strokeWidth="0.5" strokeDasharray="3 3" opacity={0.5} />
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: SleepQualityAreaChart
// ============================================================

function SleepQualityAreaChart() {
  const chartW = 260;
  const chartH = 110;
  const padX = 30;
  const padY = 10;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;
  const maxHours = 10;

  const points = useMemo(() => {
    return SAMPLE_SLEEP.map((hours, i) => {
      const x = padX + (i / 6) * plotW;
      const y = padY + plotH - (hours / maxHours) * plotH;
      return [x, y] as [number, number];
    });
  }, [plotW, plotH, padX, padY, maxHours]);

  const baseline = useMemo(() => {
    return SAMPLE_SLEEP.map((_, i) => {
      const x = padX + (i / 6) * plotW;
      return [x, padY + plotH] as [number, number];
    });
  }, [plotW, padX, padY, plotH]);

  const areaPoints = useMemo(() => buildPointsStr([...points, ...baseline.slice().reverse()]), [points, baseline]);
  const linePoints = useMemo(() => buildPointsStr(points), [points]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Sleep Quality (Hours/Night)</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map((hours, i) => {
          const y = padY + plotH - (hours / maxHours) * plotH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#30363d" strokeWidth="0.5" />
              <text x={padX - 5} y={y + 3} textAnchor="end" fill="#8b949e" fontSize="7">{hours}h</text>
            </g>
          );
        })}
        {/* Recommended zone */}
        {(() => {
          const topY = padY + plotH - (8 / maxHours) * plotH;
          const botY = padY + plotH - (7 / maxHours) * plotH;
          return <rect x={padX} y={topY} width={plotW} height={botY - topY} fill={W3_CYAN} opacity={0.06} />;
        })()}
        <polygon points={areaPoints} fill={W3_CYAN} opacity={0.15} />
        <polyline points={linePoints} fill="none" stroke={W3_CYAN} strokeWidth="2" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill={W3_CYAN} opacity={0.9} />
            <text x={x} y={y - 6} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontWeight="600">
              {SAMPLE_SLEEP[i]}h
            </text>
          </g>
        ))}
        {DAYS.map((day, i) => {
          const x = padX + (i / 6) * plotW;
          return (
            <text key={i} x={x} y={chartH - 1} textAnchor="middle" fill="#8b949e" fontSize="7">
              {day}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: WellbeingScoreRing
// ============================================================

function WellbeingScoreRing({ morale, fitness, form }: { morale: number; fitness: number; form: number }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const strokeW = 12;

  const wellbeingScore = useMemo(() => {
    const formScaled = form * 10;
    return Math.round((morale * 0.35 + fitness * 0.35 + formScaled * 0.3));
  }, [morale, fitness, form]);

  const pct = wellbeingScore / 100;
  const angle = pct * 360;

  const bgArc = useMemo(() => describeArc(cx, cy, r, 0, 360), [cx, cy, r]);
  const fgArc = useMemo(() => {
    if (angle < 0.5) return '';
    return describeArc(cx, cy, r, 0, angle);
  }, [cx, cy, r, angle]);

  const scoreColor = useMemo(() => {
    if (wellbeingScore >= 75) return W3_LIME;
    if (wellbeingScore >= 45) return W3_ORANGE;
    return '#ff3333';
  }, [wellbeingScore]);

  const gradeLabel = useMemo(() => {
    if (wellbeingScore >= 90) return 'A+';
    if (wellbeingScore >= 80) return 'A';
    if (wellbeingScore >= 70) return 'B';
    if (wellbeingScore >= 55) return 'C';
    return 'D';
  }, [wellbeingScore]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Wellbeing Score</h4>
      <svg viewBox="0 0 200 200" className="w-full max-w-[160px] mx-auto">
        <path d={bgArc} fill="none" stroke="#30363d" strokeWidth={strokeW} strokeLinecap="round" />
        {fgArc && (
          <path d={fgArc} fill="none" stroke={scoreColor} strokeWidth={strokeW} strokeLinecap="round" opacity={0.9} />
        )}
        <text x={cx} y={cy - 14} textAnchor="middle" fill={scoreColor} className="text-[28px] font-bold" fontSize="28">
          {wellbeingScore}
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#c9d1d9" className="text-[14px] font-bold" fontSize="14">
          Grade: {gradeLabel}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#8b949e" className="text-[8px]" fontSize="8">
          M:{morale} F:{fitness} Fm:{form.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG Component: LifestyleBalanceDonut
// ============================================================

function LifestyleBalanceDonut({ schedule, morale, fitness }: { schedule: WeeklySchedule; morale: number; fitness: number }) {
  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 48;
  const segmentGap = 4;
  const colors = [W3_ORANGE, W3_CYAN, W3_LIME, W3_ORANGE, W3_GRAY];

  const catCounts = getCategoryCounts(schedule);

  const distribution = (() => {
    const training = catCounts.training;
    const rest = catCounts.recovery;
    const social = catCounts.social;
    const nutrition = catCounts.nutrition;
    const mental = catCounts.mental + catCounts.education;
    const total = training + rest + social + nutrition + mental;
    return [
      { label: 'Training', value: training },
      { label: 'Rest', value: rest },
      { label: 'Social', value: social },
      { label: 'Nutrition', value: nutrition },
      { label: 'Mental', value: mental },
    ].map(d => ({
      ...d,
      pct: total > 0 ? Math.round((d.value / total) * 100) : 20,
    }));
  })();

  const total = distribution.reduce((sum, d) => sum + d.value, 0);

  const segments = (() => {
    if (total === 0) return [];
    let currentAngle = 0;
    return distribution.reduce((acc, item, i) => {
      if (item.value === 0) return acc;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle + segmentGap;
      const endAngle = currentAngle + angle - segmentGap;
      const path = describeDonutArc(cx, cy, outerR, innerR, startAngle, Math.max(startAngle + 0.5, endAngle));
      currentAngle += angle;
      return [...acc, { path, color: colors[i], label: item.label, value: item.value, pct: item.pct }];
    }, [] as { path: string; color: string; label: string; value: number; pct: number }[]);
  })();

  const balanceScore = (() => {
    const ideal = 20;
    const deviation = distribution.reduce((sum, d) => sum + Math.abs(d.pct - ideal), 0);
    return Math.max(0, 100 - deviation * 1.5);
  })();

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Lifestyle Balance</h4>
      <svg viewBox="0 0 200 200" className="w-full max-w-[170px] mx-auto">
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} opacity={0.8} />
        ))}
        {total === 0 && (
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={W3_GRAY} strokeWidth={outerR - innerR} opacity={0.2} />
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={W3_LIME} className="text-[20px] font-bold" fontSize="20">
          {Math.round(balanceScore)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" className="text-[8px]" fontSize="8">
          balance
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-1 mt-2">
        {WELLBEING_CATEGORIES.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors[i] }} />
            <span className="text-[9px]" style={{ color: colors[i] }}>{label}</span>
            <span className="text-[8px] text-[#8b949e] ml-auto">{distribution[i]?.pct ?? 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SVG Component: MoraleTrendLine
// ============================================================

function MoraleTrendLine({ morale, currentWeek }: { morale: number; currentWeek: number }) {
  const chartW = 260;
  const chartH = 120;
  const padX = 30;
  const padY = 15;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const data = useMemo(() => {
    const base = morale;
    return SAMPLE_WEEKS.map((_, i) => {
      const variation = Math.sin(i * 1.2 + 0.8) * 8 + Math.cos(i * 0.7) * 5;
      const trend = i * 1.5;
      return Math.max(10, Math.min(99, Math.round(base - 12 + variation + trend)));
    });
  }, [morale]);

  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = padX + (i / (data.length - 1)) * plotW;
      const y = padY + plotH - (val / 100) * plotH;
      return [x, y] as [number, number];
    });
  }, [data, plotW, plotH, padX, padY]);

  const linePoints = useMemo(() => buildPointsStr(points), [points]);

  const trendDirection = useMemo(() => {
    if (data.length < 2) return 'Stable';
    const recent = data[data.length - 1];
    const earlier = data[Math.max(0, data.length - 4)];
    const diff = recent - earlier;
    if (diff > 5) return 'Rising';
    if (diff < -5) return 'Falling';
    return 'Stable';
  }, [data]);

  const trendColor = useMemo(() => {
    if (trendDirection === 'Rising') return W3_LIME;
    if (trendDirection === 'Falling') return '#ff3333';
    return W3_ORANGE;
  }, [trendDirection]);

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <h4 className="text-xs font-semibold ${TEXT_PRIMARY} mb-3">Morale Trajectory (8 Weeks)</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {[0, 25, 50, 75, 100].map((pct, i) => {
          const y = padY + plotH - (pct / 100) * plotH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#30363d" strokeWidth="0.5" />
              <text x={padX - 5} y={y + 3} textAnchor="end" fill="#8b949e" fontSize="7">{pct}</text>
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" stroke={W3_ORANGE} strokeWidth="2" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill={W3_ORANGE} opacity={0.9} />
            {i === data.length - 1 && (
              <text x={x + 6} y={y + 3} fill={W3_ORANGE} fontSize="8" fontWeight="600">{data[i]}</text>
            )}
          </g>
        ))}
        {SAMPLE_WEEKS.map((week, i) => {
          const x = padX + (i / (SAMPLE_WEEKS.length - 1)) * plotW;
          return (
            <text key={i} x={x} y={chartH - 2} textAnchor="middle" fill="#8b949e" fontSize="7">
              {week}
            </text>
          );
        })}
        {/* Trend indicator */}
        <rect x={padX + plotW - 45} y={padY + 2} width={45} height={16} rx="4" fill="#161b22" stroke="#30363d" strokeWidth="0.5" />
        <text x={padX + plotW - 22} y={padY + 13} textAnchor="middle" fill={trendColor} fontSize="7" fontWeight="700">
          {trendDirection}
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// Sub-Components: EnergyBar, ScheduleSlot, ActivityPicker
// ============================================================

function RestRecommendationPanel({ fitness, morale, age }: { fitness: number; morale: number; age: number }) {
  const recommendations = useMemo(() => {
    const recs: { text: string; priority: 'high' | 'medium' | 'low'; color: string }[] = [];
    if (fitness < 40) {
      recs.push({ text: 'Critical: Your fitness is dangerously low. Schedule at least 3 recovery sessions and limit high-intensity training this week.', priority: 'high', color: '#ff3333' });
    } else if (fitness < 60) {
      recs.push({ text: 'Warning: Fitness is below optimal. Add 2 recovery sessions including yoga and ice bath for best results.', priority: 'medium', color: W3_ORANGE });
    }
    if (morale < 35) {
      recs.push({ text: 'Critical: Morale is very low. Mental coaching and team bonding sessions should be prioritized.', priority: 'high', color: '#ff3333' });
    } else if (morale < 55) {
      recs.push({ text: 'Suggestion: Consider a social activity this week to boost your morale and team relationships.', priority: 'medium', color: W3_ORANGE });
    }
    if (age > 30) {
      recs.push({ text: 'Age Factor: At your age, extra recovery time is essential. Consider scheduling an additional rest day.', priority: 'medium', color: W3_ORANGE });
    }
    if (fitness >= 70 && morale >= 65) {
      recs.push({ text: 'Great condition: You are in prime shape. This is the ideal window for intensive training blocks.', priority: 'low', color: W3_LIME });
    }
    if (recs.length === 0) {
      recs.push({ text: 'Your recovery needs are being met. Keep maintaining a balanced weekly routine.', priority: 'low', color: W3_CYAN });
    }
    return recs;
  }, [fitness, morale, age]);

  const priorityBorder: Record<string, string> = {
    high: 'border-red-500/30',
    medium: 'border-[#FF5500]/30',
    low: 'border-[#CCFF00]/30',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#00E5FF]" />
        <span className="text-xs font-semibold text-[#c9d1d9]">Rest Recommendations</span>
      </div>
      <div className="space-y-1.5">
        {recommendations.map((rec, i) => (
          <div key={i} className={`${CARD_BG} border ${priorityBorder[rec.priority]} rounded-lg p-2.5`}>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-sm mt-1.5 flex-shrink-0" style={{ backgroundColor: rec.color }} />
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{rec.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingBalanceIndicator({ catCounts }: { catCounts: Record<CategoryId, number> }) {
  const balanceData = useMemo(() => {
    const categories = ['training', 'recovery', 'nutrition', 'mental', 'social', 'education'] as const;
    const total = categories.reduce((sum, cat) => sum + catCounts[cat], 0);
    if (total === 0) {
      return categories.map(cat => ({ category: cat, count: 0, pct: 0 }));
    }
    return categories.map(cat => ({
      category: cat,
      count: catCounts[cat],
      pct: Math.round((catCounts[cat] / total) * 100),
    }));
  }, [catCounts]);

  const balanceScore = useMemo(() => {
    const idealPct = Math.round(100 / 6);
    const deviation = balanceData.reduce((sum, d) => sum + Math.abs(d.pct - (d.count > 0 ? idealPct : 0)), 0);
    return Math.max(0, 100 - deviation * 1.2);
  }, [balanceData]);

  const scoreColor = balanceScore >= 70 ? W3_LIME : balanceScore >= 40 ? W3_ORANGE : '#ff3333';
  const balanceLabel = balanceScore >= 80 ? 'Excellent' : balanceScore >= 60 ? 'Good' : balanceScore >= 40 ? 'Needs Work' : 'Poor';

  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-[#c9d1d9]">Training Balance</h4>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: scoreColor }}>{Math.round(balanceScore)}</span>
          <span className="text-[9px] text-[#8b949e]">{balanceLabel}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-lg overflow-hidden mb-3">
        <div className="h-full rounded-lg transition-all" style={{ width: `${balanceScore}%`, backgroundColor: scoreColor }} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {balanceData.map((item, i) => {
          const meta = CATEGORY_MAP[item.category];
          return (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[9px] capitalize" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-[9px] text-[#8b949e]">{item.count} ({item.pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WellbeingInsightCards({ morale, fitness, form, age }: { morale: number; fitness: number; form: number; age: number }) {
  const insights = useMemo(() => {
    const cards: { icon: LucideIcon; title: string; value: string; desc: string; color: string }[] = [];

    // Stress level
    const stressLevel = Math.max(0, 100 - morale);
    const stressLabel = stressLevel < 20 ? 'Low' : stressLevel < 50 ? 'Moderate' : stressLevel < 75 ? 'High' : 'Extreme';
    const stressColor = stressLevel < 20 ? W3_LIME : stressLevel < 50 ? W3_CYAN : stressLevel < 75 ? W3_ORANGE : '#ff3333';
    cards.push({ icon: Flame, title: 'Stress Level', value: `${stressLevel}%`, desc: stressLabel, color: stressColor });

    // Recovery potential
    const recoveryPotential = Math.min(100, Math.round(fitness * 0.7 + (100 - age * 1.5) * 0.3));
    const recoveryLabel = recoveryPotential >= 80 ? 'High' : recoveryPotential >= 55 ? 'Moderate' : 'Limited';
    const recoveryColor = recoveryPotential >= 80 ? W3_LIME : recoveryPotential >= 55 ? W3_CYAN : W3_ORANGE;
    cards.push({ icon: Heart, title: 'Recovery Potential', value: `${recoveryPotential}%`, desc: recoveryLabel, color: recoveryColor });

    // Match readiness
    const matchReadiness = Math.round(fitness * 0.4 + morale * 0.3 + form * 10 * 0.3);
    const matchLabel = matchReadiness >= 80 ? 'Ready' : matchReadiness >= 60 ? 'Adequate' : 'Not Ready';
    const matchColor = matchReadiness >= 80 ? W3_LIME : matchReadiness >= 60 ? W3_CYAN : '#ff3333';
    cards.push({ icon: Shield, title: 'Match Readiness', value: `${matchReadiness}%`, desc: matchLabel, color: matchColor });

    // Consistency
    const consistencyScore = form >= 7.5 ? 85 : form >= 6.5 ? 65 : form >= 5.5 ? 45 : 25;
    const consistencyLabel = consistencyScore >= 70 ? 'Strong' : consistencyScore >= 45 ? 'Variable' : 'Weak';
    const consistencyColor = consistencyScore >= 70 ? W3_LIME : consistencyScore >= 45 ? W3_ORANGE : '#ff3333';
    cards.push({ icon: BarChart3, title: 'Consistency', value: `${consistencyScore}%`, desc: consistencyLabel, color: consistencyColor });

    return cards;
  }, [morale, fitness, form, age]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {insights.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <span className="text-[10px] text-[#8b949e] font-medium">{card.title}</span>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-lg font-bold" style={{ color: card.color }}>{card.value}</span>
              <span className="text-[9px] text-[#8b949e] mb-0.5">{card.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EnergyBar({ remaining, max }: { remaining: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (remaining / max) * 100)) : 100;
  const barColor = getEnergyBarColor(remaining, max);
  const label = remaining > 60 ? 'Energized' : remaining > 30 ? 'Moderate' : remaining > 0 ? 'Fatigued' : 'Exhausted';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4 text-[#c9d1d9]" />
          <span className="text-xs font-medium text-[#c9d1d9]">Weekly Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">{label}</span>
          <span className="text-sm font-bold text-[#c9d1d9]">
            {remaining}<span className="text-[#8b949e] font-normal">/{max}</span>
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-lg overflow-hidden">
        <motion.div
          className={`h-full rounded-lg ${barColor}`}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ActivityIcon({ actId }: { actId: string }) {
  const act = ACTIVITY_MAP[actId];
  if (!act) return null;
  const cat = CATEGORY_MAP[act.category];
  const Icon = act.icon;
  return (
    <div className={`${cat.bgClass} w-3.5 h-3.5 rounded-md flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-3.5 h-3.5 ${cat.textClass}`} />
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

  return (
    <motion.button
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`
        relative w-full p-1.5 rounded-lg border text-left transition-opacity
        ${isSelected
          ? 'border-[#FF5500]/60 bg-[#FF5500]/5'
          : isCurrentDay
            ? 'border-[#FF5500]/20 bg-[#161b22]'
            : `border-[#30363d] bg-[#161b22]`
        }
        ${canAssign && energyRemaining > 0 ? 'cursor-pointer hover:border-[#484f58]' : 'cursor-default'}
        min-h-[48px] flex flex-col gap-0.5
      `}
    >
      <div className={`text-[9px] font-semibold uppercase tracking-wider ${isCurrentDay ? 'text-[#FF5500]' : 'text-[#484f58]'}`}>
        {period === 'am' ? 'AM' : 'PM'}
      </div>
      {act ? (
        <div className="flex items-center gap-1">
          <ActivityIcon actId={actId!} />
          <span className={`text-[10px] font-medium leading-tight ${cat?.textClass || 'text-[#8b949e]'} truncate`}>
            {act.abbrev}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-md bg-red-500/20 border border-red-500/30
                       flex items-center justify-center hover:bg-red-500/40 transition-opacity"
          >
            <span className="text-red-400 text-[8px] font-bold">x</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-5">
          <span className="text-[10px] text-[#30363d]">--</span>
        </div>
      )}
    </motion.button>
  );
}

function WeeklyEffectsPanel({ effects }: { effects: ActivityEffect }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
        <span className="text-sm font-semibold text-[#c9d1d9]">Weekly Attribute Effects</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ATTR_LABELS.map(({ key, label }) => {
          const val = effects[key] || 0;
          const colorClass = val > 0 ? 'text-[#CCFF00]' : 'text-[#484f58]';
          return (
            <div key={key} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-[#8b949e] font-medium">{label}</span>
              <span className={`text-lg font-bold ${colorClass}`}>
                {val > 0 ? '+' : ''}{val}
              </span>
            </div>
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
    <div className="space-y-2">
      <span className="text-xs font-semibold text-[#c9d1d9]">Select Activity</span>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {affordable.map((act) => {
          const Icon = act.icon;
          const cat = CATEGORY_MAP[act.category];
          const cost = act.energyCost * ENERGY_PER_COST;
          return (
            <motion.button
              key={act.id}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSelect(act.id)}
              className={`w-full text-left p-2 rounded-lg border ${cat.borderClass} ${cat.bgClass} ${cat.hoverBg}
                         transition-opacity cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <div className={`${cat.bgClass} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${cat.textClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${cat.textClass}`}>{act.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium
                      ${cost === 0 ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-slate-700 text-[#8b949e]'}`}>
                      {cost === 0 ? 'FREE' : `-${cost}`}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {Object.entries(act.effects).map(([key, val], i) => (
                      <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-slate-700/50 text-[#CCFF00] font-medium">
                        +{val} {key.slice(0, 3).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
        {unaffordable.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[9px] text-[#484f58] font-medium uppercase tracking-wider">Insufficient Energy</span>
            {unaffordable.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="w-full p-1.5 rounded-lg border border-[#21262d] bg-[#0d1117]/50 opacity-40">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[#484f58]" />
                    <span className="text-[10px] text-[#484f58] flex-1 truncate">{act.name}</span>
                    <span className="text-[8px] text-[#30363d]">-{act.energyCost * ENERGY_PER_COST}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tab Content Panels
// ============================================================

function SchedulePlannerTab({ schedule, selectedSlot, currentDayIndex, energyRemaining, maxEnergy, catCounts, netEffects, onSlotClick, onClearSlot, onAssignActivity }: {
  schedule: WeeklySchedule;
  selectedSlot: SlotSelection | null;
  currentDayIndex: number;
  energyRemaining: number;
  maxEnergy: number;
  catCounts: Record<CategoryId, number>;
  netEffects: ActivityEffect;
  onSlotClick: (day: string, period: 'am' | 'pm') => void;
  onClearSlot: (day: string, period: 'am' | 'pm') => void;
  onAssignActivity: (actId: string) => void;
}) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* Header and Energy */}
      <motion.div variants={staggerChild} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Weekly Schedule Planner</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Season Week</span>
          </div>
        </div>
        <EnergyBar remaining={energyRemaining} max={maxEnergy} />
      </motion.div>

      {/* Schedule Grid */}
      <motion.div variants={staggerChild} className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, di) => (
          <div key={di} className="space-y-1">
            <div className={`text-center text-[9px] font-bold uppercase tracking-wider ${di === currentDayIndex ? 'text-[#FF5500]' : 'text-[#8b949e]'}`}>
              {day}
            </div>
            <ScheduleSlot
              day={day}
              period="am"
              slot={schedule[day]}
              isCurrentDay={di === currentDayIndex}
              isSelected={selectedSlot?.day === day && selectedSlot?.period === 'am'}
              energyRemaining={energyRemaining}
              onClick={() => onSlotClick(day, 'am')}
              onClear={() => onClearSlot(day, 'am')}
            />
            <ScheduleSlot
              day={day}
              period="pm"
              slot={schedule[day]}
              isCurrentDay={di === currentDayIndex}
              isSelected={selectedSlot?.day === day && selectedSlot?.period === 'pm'}
              energyRemaining={energyRemaining}
              onClick={() => onSlotClick(day, 'pm')}
              onClear={() => onClearSlot(day, 'pm')}
            />
          </div>
        ))}
      </motion.div>

      {/* Activity Picker (shown when slot selected) */}
      {selectedSlot && (
        <motion.div variants={staggerChild} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <ActivityPicker energyRemaining={energyRemaining} onSelect={onAssignActivity} />
        </motion.div>
      )}

      {/* SVG Charts */}
      <motion.div variants={staggerChild} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActivityDistributionDonut catCounts={catCounts} />
        <WeeklyEnergyLoadAreaChart schedule={schedule} />
        <ScheduleCompletionRing schedule={schedule} />
      </motion.div>

      {/* Effects Panel */}
      <motion.div variants={staggerChild}>
        <WeeklyEffectsPanel effects={netEffects} />
      </motion.div>

      {/* Training Balance */}
      <motion.div variants={staggerChild}>
        <TrainingBalanceIndicator catCounts={catCounts} />
      </motion.div>
    </motion.div>
  );
}

function PerformanceTrackingTab({ attributes, fitness, morale, catCounts, netEffects }: { attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }; fitness: number; morale: number; catCounts: Record<CategoryId, number>; netEffects: ActivityEffect }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={staggerChild}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Performance Tracking</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Training Metrics</span>
          </div>
        </div>
      </motion.div>

      {/* Current attributes overview */}
      <motion.div variants={staggerChild} className="grid grid-cols-3 gap-2">
        {ATTR_LABELS.map(({ key, label }) => {
          const val = attributes[key] ?? 50;
          return (
            <div key={key} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5 text-center`}>
              <span className="text-[9px] text-[#8b949e] font-medium">{label}</span>
              <div className="text-xl font-bold text-[#c9d1d9] mt-0.5">{val}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Training Balance Indicator */}
      <motion.div variants={staggerChild}>
        <TrainingBalanceIndicator catCounts={catCounts} />
      </motion.div>

      {/* SVG Charts */}
      <motion.div variants={staggerChild} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AttributeGainsBars effects={netEffects} attributes={attributes} />
        <TrainingConsistencyLine fitness={fitness} />
      </motion.div>

      <motion.div variants={staggerChild} className="flex justify-center">
        <PeakPerformanceRadar attributes={attributes} fitness={fitness} morale={morale} />
      </motion.div>
    </motion.div>
  );
}

function RecoveryCenterTab({ fitness, morale, age, currentInjury }: { fitness: number; morale: number; age: number; currentInjury: { name: string; weeksRemaining: number } | null }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={staggerChild}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Recovery Center</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Heart className="w-3.5 h-3.5" />
            <span>Recovery Metrics</span>
          </div>
        </div>
      </motion.div>

      {/* Current injury banner */}
      {currentInjury && (
        <motion.div variants={staggerChild} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-red-400">{currentInjury.name}</span>
            <span className="text-[10px] text-[#8b949e] ml-2">{currentInjury.weeksRemaining} weeks remaining</span>
          </div>
        </motion.div>
      )}

      {/* Fitness & Morale summary */}
      <motion.div variants={staggerChild} className="grid grid-cols-2 gap-3">
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3`}>
          <span className="text-[10px] text-[#8b949e] font-medium">Fitness Level</span>
          <div className="text-2xl font-bold text-[#CCFF00] mt-1">{fitness}</div>
          <div className="h-1.5 bg-slate-700 rounded-lg overflow-hidden mt-1">
            <div className="h-full bg-[#CCFF00] rounded-lg" style={{ width: `${fitness}%` }} />
          </div>
        </div>
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3`}>
          <span className="text-[10px] text-[#8b949e] font-medium">Morale</span>
          <div className="text-2xl font-bold text-[#00E5FF] mt-1">{morale}</div>
          <div className="h-1.5 bg-slate-700 rounded-lg overflow-hidden mt-1">
            <div className="h-full bg-[#00E5FF] rounded-lg" style={{ width: `${morale}%` }} />
          </div>
        </div>
      </motion.div>

      {/* SVG Charts */}
      <motion.div variants={staggerChild} className="flex justify-center">
        <RecoveryStatusGauge fitness={fitness} morale={morale} />
      </motion.div>

      <motion.div variants={staggerChild} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InjuryRiskBars fitness={fitness} age={age} />
        <SleepQualityAreaChart />
      </motion.div>

      {/* Rest Recommendations */}
      <motion.div variants={staggerChild}>
        <RestRecommendationPanel fitness={fitness} morale={morale} age={age} />
      </motion.div>
    </motion.div>
  );
}

function WellbeingTab({ morale, fitness, form, schedule, currentWeek, age }: { morale: number; fitness: number; form: number; schedule: WeeklySchedule; currentWeek: number; age: number }) {
  const mentalHealthScore = useMemo(() => {
    return Math.round((morale * 0.5 + form * 10 * 0.3 + fitness * 0.2));
  }, [morale, form, fitness]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={staggerChild}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Wellbeing Hub</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Brain className="w-3.5 h-3.5" />
            <span>Mental Health & Lifestyle</span>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={staggerChild} className="grid grid-cols-3 gap-2">
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5 text-center`}>
          <span className="text-[9px] text-[#8b949e] font-medium">Mental Health</span>
          <div className="text-lg font-bold text-[#FF5500] mt-0.5">{mentalHealthScore}</div>
        </div>
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5 text-center`}>
          <span className="text-[9px] text-[#8b949e] font-medium">Form</span>
          <div className="text-lg font-bold text-[#CCFF00] mt-0.5">{form.toFixed(1)}</div>
        </div>
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5 text-center`}>
          <span className="text-[9px] text-[#8b949e] font-medium">Stress</span>
          <div className="text-lg font-bold text-[#00E5FF] mt-0.5">{Math.max(0, 100 - morale)}</div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div variants={staggerChild} className="bg-[#FF5500]/5 border border-[#FF5500]/20 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-[#FF5500]" />
          <span className="text-[11px] font-semibold text-[#FF5500]">Wellbeing Tips</span>
        </div>
        {morale < 50 && (
          <p className="text-[10px] text-[#8b949e] leading-relaxed">Low morale detected. Consider scheduling mental coaching or team bonding activities.</p>
        )}
        {fitness < 50 && (
          <p className="text-[10px] text-[#8b949e] leading-relaxed">Fitness is below optimal. Prioritize recovery sessions and adequate sleep.</p>
        )}
        {morale >= 50 && fitness >= 50 && (
          <p className="text-[10px] text-[#8b949e] leading-relaxed">Your physical and mental condition is solid. Maintain a balanced routine for peak performance.</p>
        )}
        {form < 6.0 && (
          <p className="text-[10px] text-[#8b949e] leading-relaxed">Recent form has dipped. Video analysis and extra training can help turn things around.</p>
        )}
      </motion.div>

      {/* SVG Charts */}
      <motion.div variants={staggerChild} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <WellbeingScoreRing morale={morale} fitness={fitness} form={form} />
        <LifestyleBalanceDonut schedule={schedule} morale={morale} fitness={fitness} />
        <MoraleTrendLine morale={morale} currentWeek={currentWeek} />
      </motion.div>

      {/* Wellbeing Insight Cards */}
      <motion.div variants={staggerChild}>
        <WellbeingInsightCards morale={morale} fitness={fitness} form={form} age={age} />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function DailyRoutineEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const player = useGameStore(state => state.gameState?.player);
  const currentClub = useGameStore(state => state.gameState?.currentClub);
  const currentWeek = useGameStore(state => state.gameState?.currentWeek) ?? 1;
  const currentInjury = useGameStore(state => state.gameState?.currentInjury);

  const clubName = currentClub?.name ?? 'Unknown Club';

  // Local state
  const [schedule, setSchedule] = useState<WeeklySchedule>(buildEmptySchedule);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);

  // Derived values
  const maxEnergy = useMemo(() => Math.min((player?.fitness ?? 70) * 1.0, 100), [player?.fitness]);
  const energyUsed = useMemo(() => calculateEnergyUsed(schedule), [schedule]);
  const energyRemaining = useMemo(() => Math.max(0, maxEnergy - energyUsed), [maxEnergy, energyUsed]);
  const netEffects = useMemo(() => calculateNetEffects(schedule), [schedule]);
  const catCounts = useMemo(() => getCategoryCounts(schedule), [schedule]);
  const currentDayIndex = useMemo(() => (currentWeek - 1) % 7, [currentWeek]);

  const attributes = useMemo(() => ({
    pace: player?.attributes.pace ?? 50,
    shooting: player?.attributes.shooting ?? 50,
    passing: player?.attributes.passing ?? 50,
    dribbling: player?.attributes.dribbling ?? 50,
    defending: player?.attributes.defending ?? 50,
    physical: player?.attributes.physical ?? 50,
  }), [player?.attributes]);

  const fitness = player?.fitness ?? 70;
  const morale = player?.morale ?? 60;
  const form = player?.form ?? 6.0;
  const age = player?.age ?? 20;

  // Handlers
  const handleSlotClick = useCallback((day: string, period: 'am' | 'pm') => {
    setSelectedSlot(prev => {
      if (prev && prev.day === day && prev.period === period) return null;
      return { day, period };
    });
  }, []);

  const handleClearSlot = useCallback((day: string, period: 'am' | 'pm') => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [period]: null },
    }));
    setSelectedSlot(null);
  }, []);

  const handleAssignActivity = useCallback((actId: string) => {
    if (!selectedSlot) return;
    const act = ACTIVITY_MAP[actId];
    if (!act) return;
    const cost = act.energyCost * ENERGY_PER_COST;
    if (cost > energyRemaining) return;

    setSchedule(prev => ({
      ...prev,
      [selectedSlot.day]: { ...prev[selectedSlot.day], [selectedSlot.period]: actId },
    }));
    setSelectedSlot(null);
  }, [selectedSlot, energyRemaining]);

  // No game state guard
  if (!gameState || !player) {
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
    <div className={`max-w-4xl mx-auto px-4 py-6 ${DARK_BG} min-h-screen`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#FF5500]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#c9d1d9]">Daily Routine</h2>
            <p className="text-[11px] text-[#8b949e]">{clubName} &middot; Week {currentWeek}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[#8b949e]">Overall</span>
              <span className="text-sm font-bold text-[#c9d1d9] ml-1.5">{player.overall}</span>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[#8b949e]">Age</span>
              <span className="text-sm font-bold text-[#c9d1d9] ml-1.5">{player.age}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5`}>
            <span className="text-[9px] text-[#8b949e] font-medium">Fitness</span>
            <div className="text-sm font-bold text-[#CCFF00]">{fitness}</div>
          </div>
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5`}>
            <span className="text-[9px] text-[#8b949e] font-medium">Morale</span>
            <div className="text-sm font-bold text-[#00E5FF]">{morale}</div>
          </div>
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5`}>
            <span className="text-[9px] text-[#8b949e] font-medium">Form</span>
            <div className="text-sm font-bold text-[#FF5500]">{form.toFixed(1)}</div>
          </div>
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5`}>
            <span className="text-[9px] text-[#8b949e] font-medium">Energy</span>
            <div className="text-sm font-bold text-[#c9d1d9]">{energyRemaining}/{maxEnergy}</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className={`${CARD_BG} border ${BORDER_COLOR} w-full h-auto flex p-1`}>
          <TabsTrigger
            value="schedule"
            className="flex-1 text-[11px] font-medium py-2 px-2 data-[state=active]:bg-[#FF5500]/10 data-[state=active]:text-[#FF5500] text-[#8b949e]"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex-1 text-[11px] font-medium py-2 px-2 data-[state=active]:bg-[#CCFF00]/10 data-[state=active]:text-[#CCFF00] text-[#8b949e]"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="recovery"
            className="flex-1 text-[11px] font-medium py-2 px-2 data-[state=active]:bg-[#00E5FF]/10 data-[state=active]:text-[#00E5FF] text-[#8b949e]"
          >
            <Heart className="w-3.5 h-3.5 mr-1.5" />
            Recovery
          </TabsTrigger>
          <TabsTrigger
            value="wellbeing"
            className="flex-1 text-[11px] font-medium py-2 px-2 data-[state=active]:bg-[#FF5500]/10 data-[state=active]:text-[#FF5500] text-[#8b949e]"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            Wellbeing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <SchedulePlannerTab
            schedule={schedule}
            selectedSlot={selectedSlot}
            currentDayIndex={currentDayIndex}
            energyRemaining={energyRemaining}
            maxEnergy={maxEnergy}
            catCounts={catCounts}
            netEffects={netEffects}
            onSlotClick={handleSlotClick}
            onClearSlot={handleClearSlot}
            onAssignActivity={handleAssignActivity}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <PerformanceTrackingTab
            attributes={attributes}
            fitness={fitness}
            morale={morale}
            catCounts={catCounts}
            netEffects={netEffects}
          />
        </TabsContent>

        <TabsContent value="recovery" className="mt-4">
          <RecoveryCenterTab
            fitness={fitness}
            morale={morale}
            age={age}
            currentInjury={currentInjury ? { name: currentInjury.name, weeksRemaining: currentInjury.weeksRemaining } : null}
          />
        </TabsContent>

        <TabsContent value="wellbeing" className="mt-4">
          <WellbeingTab
            morale={morale}
            fitness={fitness}
            form={form}
            schedule={schedule}
            currentWeek={currentWeek}
            age={age}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
