// ============================================================
// Elite Striker — Pre-Season Tour Component
// A 4-tab pre-season tour dashboard with matches, fitness,
// team bonding, and analytics visualizations.
//
// Rules Compliance:
//   Rule 1:  All hooks BEFORE conditional returns
//   Rule 2:  Constants NOT wrapped in useMemo
//   Rule 3:  No let accumulation — uses .reduce()
//   Rule 4:  .map().join() extracted to helper functions
//   Rule 5:  React.JSX.Element return types
//   Rule 6:  All JSX arrays have key props
//   Rule 7:  No gradients, no backdrop-blur, no glassmorphism
//   Rule 8:  No rounded-full on elements >24px
//   Rule 9:  Only opacity transitions (no y/scale/rotate)
//   Rule 10: Default export: export default function
//   Rule 11: 'use client' at top
//   Rule 12: No classNameOverride prop
//   Rule 13: Sub-components use camelCase, called as {fn()}
//   Rule 14: Zustand data access null-safe with ?? {} / ?? []
//   Rule 15: Component names start with uppercase
//   Rule 16: lucide-react icons: no "Icon" suffix
//   Rule 17: Reduce variable names must not conflict with outer data
//   Rule 18: motion.div with opacity only
// ============================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plane, MapPin, Calendar, Users, Trophy,
  TrendingUp, Heart, Dumbbell, Star, BarChart3,
  Activity, Zap, Clock, Globe, Award, Target,
  ChevronRight, DollarSign, Shield, Flag,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type TabId = 'overview' | 'fitness' | 'bonding' | 'analytics';
type MatchResult = 'W' | 'D' | 'L' | 'Upcoming';

interface TourMatch {
  id: string;
  opponent: string;
  date: string;
  venue: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
  result: MatchResult;
  goalScorer: string;
}

interface FitnessCategory {
  id: string;
  name: string;
  score: number;
  trend: number;
  color: string;
}

interface InjuryAlert {
  id: string;
  player: string;
  area: string;
  risk: 'Low' | 'Medium' | 'High';
  description: string;
}

interface FitnessTestResult {
  id: string;
  test: string;
  value: string;
  rating: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  week: number;
}

interface BondingActivity {
  id: string;
  name: string;
  type: string;
  date: string;
  description: string;
  attendance: number;
  moodBoost: number;
  color: string;
}

interface PlayerRelationship {
  id: string;
  playerName: string;
  relationship: string;
  change: number;
  description: string;
}

interface BondingCalendarEvent {
  id: string;
  day: number;
  activity: string;
  color: string;
}

interface PlayerPerformance {
  id: string;
  name: string;
  position: string;
  minutes: number;
  rating: number;
  goals: number;
  assists: number;
}

interface RevenueItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface IntegrationPlayer {
  id: string;
  name: string;
  score: number;
  color: string;
}

interface RadarAxis {
  label: string;
  value: number;
  color: string;
}

// ============================================================
// Animation Constants (plain variables, NOT useMemo)
// ============================================================

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeSwitch = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeInDelayed = (delay: number) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay, duration: 0.3 } },
});

// ============================================================
// Color Constants
// ============================================================

const RESULT_COLORS: Record<MatchResult, string> = {
  W: '#10b981',
  D: '#f59e0b',
  L: '#ef4444',
  Upcoming: '#484f58',
};

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

const FITNESS_COLORS: Record<string, string> = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Average: '#f59e0b',
  'Below Average': '#ef4444',
};

// ============================================================
// SVG Helper Functions (Rule 4: no .map().join() in JSX)
// ============================================================

/** Circular progress ring dash offset */
function ringDashOffset(r: number, pct: number): number {
  const c = 2 * Math.PI * r;
  return c - (pct / 100) * c;
}

/** Ring circumference */
function ringCircumference(r: number): number {
  return 2 * Math.PI * r;
}

/** Hexagonal radar polygon points for a given set of values */
function hexRadarPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values.map((val, i) => {
    const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
    const dist = (val / 100) * r;
    return `${(cx + dist * Math.cos(angle)).toFixed(1)},${(cy + dist * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

/** Hexagonal radar grid polygon at a given radius */
function hexRadarGrid(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((Math.PI * 2) / sides) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

/** Area chart polyline points from data array */
function areaChartPoints(data: number[], w: number, h: number, padX: number, padY: number): string {
  const maxVal = Math.max(...data, 1);
  return data.map((val, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2);
    const y = h - padY - (val / maxVal) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

/** Area chart filled polygon (line + baseline) */
function areaChartFill(data: number[], w: number, h: number, padX: number, padY: number): string {
  const maxVal = Math.max(...data, 1);
  const linePts = data.map((val, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2);
    const y = h - padY - (val / maxVal) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastX = padX + ((data.length - 1) / Math.max(data.length - 1, 1)) * (w - padX * 2);
  return `${linePts.join(' ')} ${lastX.toFixed(1)},${(h - padY).toFixed(1)} ${padX.toFixed(1)},${(h - padY).toFixed(1)}`;
}

/** Semi-circular arc path for gauge */
function semiCircleArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Donut arc path between two angles */
function donutArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Compute radar label positions */
function computeRadarLabels(cx: number, cy: number, r: number, count: number, offset: number): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    return { x: cx + (r + offset) * Math.cos(angle), y: cy + (r + offset) * Math.sin(angle) };
  });
}

/** Compute donut segments via reduce (avoids let accumulation) */
interface DonutSegment {
  path: string;
  color: string;
  label: string;
  value: number;
  endAngle: number;
}

function computeDonutSegments(items: Array<{ label: string; value: number; color: string }>): DonutSegment[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return [];
  return items.reduce<DonutSegment[]>((acc, item) => {
    if (item.value === 0) return acc;
    const pct = (item.value / total) * 360;
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    acc.push({
      path: donutArcPath(100, 100, 70, startAngle, startAngle + pct - 1),
      color: item.color,
      label: item.label,
      value: item.value,
      endAngle: startAngle + pct,
    });
    return acc;
  }, []);
}

// ============================================================
// Main Component
// ============================================================

export default function PreSeasonTour() {
  // ============================================================
  // Store access (null-safe per Rule 14)
  // ============================================================

  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as Record<string, unknown>);
  const playerName = playerData?.name ?? 'Your Player';
  const teamName = (currentClub?.name as string) ?? 'Your Club';
  const currentWeek = gameState?.currentWeek ?? 1;

  // ============================================================
  // ALL hooks BEFORE conditional returns (Rule 7)
  // ============================================================

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedMatch, setSelectedMatch] = useState(0);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const handleMatchSelect = useCallback((idx: number) => {
    setSelectedMatch(idx);
  }, []);

  const handleBack = useCallback(() => {
    setScreen('dashboard');
  }, [setScreen]);

  // ============================================================
  // Mock Data (plain variables, NOT useMemo per Rule 5)
  // ============================================================

  const tourMatches: TourMatch[] = [
    { id: 'm1', opponent: 'LA Galaxy', date: 'Jul 15, 2026', venue: 'Dignity Health Sports Park', city: 'Los Angeles', homeScore: 3, awayScore: 1, result: 'W', goalScorer: playerName },
    { id: 'm2', opponent: 'NY Red Bulls', date: 'Jul 19, 2026', venue: 'Red Bull Arena', city: 'New York', homeScore: 2, awayScore: 2, result: 'D', goalScorer: playerName },
    { id: 'm3', opponent: 'Seattle Sounders', date: 'Jul 23, 2026', venue: 'Lumen Field', city: 'Seattle', homeScore: 4, awayScore: 0, result: 'W', goalScorer: playerName },
    { id: 'm4', opponent: 'Atlanta United', date: 'Jul 27, 2026', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', homeScore: 1, awayScore: 2, result: 'L', goalScorer: '—' },
    { id: 'm5', opponent: 'Inter Miami', date: 'Jul 31, 2026', venue: 'DRV PNK Stadium', city: 'Miami', homeScore: 2, awayScore: 0, result: 'W', goalScorer: playerName },
    { id: 'm6', opponent: 'Portland Timbers', date: 'Aug 4, 2026', venue: 'Providence Park', city: 'Portland', homeScore: null, awayScore: null, result: 'Upcoming', goalScorer: '—' },
  ];

  const fitnessCategories: FitnessCategory[] = [
    { id: 'end', name: 'Endurance', score: 82, trend: 5, color: '#10b981' },
    { id: 'spd', name: 'Speed', score: 78, trend: 3, color: '#3b82f6' },
    { id: 'str', name: 'Strength', score: 75, trend: -2, color: '#f59e0b' },
    { id: 'agi', name: 'Agility', score: 80, trend: 4, color: '#a855f7' },
    { id: 'flx', name: 'Flexibility', score: 71, trend: 6, color: '#ec4899' },
    { id: 'rec', name: 'Recovery', score: 68, trend: 2, color: '#06b6d4' },
  ];

  const injuryAlerts: InjuryAlert[] = [
    { id: 'ia1', player: 'Marcus Silva', area: 'Hamstring', risk: 'High', description: 'Tightness in right hamstring after sprint drills' },
    { id: 'ia2', player: 'Kenji Tanaka', area: 'Knee', risk: 'Medium', description: 'Mild swelling in left knee, monitored daily' },
    { id: 'ia3', player: 'Carlos Ruiz', area: 'Ankle', risk: 'Low', description: 'Minor ankle sprain, expected to resume training in 2 days' },
  ];

  const fitnessTests: FitnessTestResult[] = [
    { id: 'ft1', test: 'Yo-Yo IR1', value: '2,340m', rating: 'Excellent', week: 1 },
    { id: 'ft2', test: 'Sprint 40m', value: '4.72s', rating: 'Good', week: 1 },
    { id: 'ft3', test: 'Vertical Jump', value: '58cm', rating: 'Good', week: 2 },
    { id: 'ft4', test: 'VO2 Max', value: '62 ml/kg', rating: 'Excellent', week: 2 },
    { id: 'ft5', test: 'Agility T-Test', value: '9.8s', rating: 'Average', week: 3 },
    { id: 'ft6', test: 'Flexibility Sit & Reach', value: '+4cm', rating: 'Good', week: 3 },
    { id: 'ft7', test: 'Bench Press', value: '85kg x10', rating: 'Average', week: 4 },
    { id: 'ft8', test: 'Core Stability', value: '8.5/10', rating: 'Good', week: 4 },
    { id: 'ft9', test: 'Repeated Sprint', value: '24.1s avg', rating: 'Below Average', week: 5 },
    { id: 'ft10', test: 'Body Composition', value: '11.2% BF', rating: 'Excellent', week: 5 },
    { id: 'ft11', test: 'Balance Test', value: '42s', rating: 'Good', week: 6 },
    { id: 'ft12', test: 'Hydration Check', value: 'Optimal', rating: 'Excellent', week: 6 },
  ];

  const fitnessTrendData = [62, 66, 69, 72, 75, 78];

  const injuryRiskData = [
    { id: 'ir1', label: 'Hamstring', value: 72, color: '#ef4444' },
    { id: 'ir2', label: 'Knee', value: 45, color: '#f59e0b' },
    { id: 'ir3', label: 'Ankle', value: 28, color: '#10b981' },
    { id: 'ir4', label: 'Shoulder', value: 15, color: '#3b82f6' },
  ];

  const bondingActivities: BondingActivity[] = [
    { id: 'ba1', name: 'Team Dinner', type: 'Dinner', date: 'Jul 14, 2026', description: 'Welcome dinner at waterfront restaurant in LA', attendance: 28, moodBoost: 15, color: '#10b981' },
    { id: 'ba2', name: 'Beach Training', type: 'Training', date: 'Jul 18, 2026', description: 'Fun beach fitness session with volleyball', attendance: 26, moodBoost: 10, color: '#3b82f6' },
    { id: 'ba3', name: 'Museum Visit', type: 'Cultural', date: 'Jul 22, 2026', description: 'Visit to Seattle Art Museum & local food tour', attendance: 22, moodBoost: 8, color: '#a855f7' },
    { id: 'ba4', name: 'Pool Day', type: 'Leisure', date: 'Jul 30, 2026', description: 'Relaxation day at resort pool in Miami', attendance: 25, moodBoost: 12, color: '#ec4899' },
  ];

  const playerRelationships: PlayerRelationship[] = [
    { id: 'pr1', playerName: 'Marcus Silva', relationship: 'Close Friend', change: 12, description: 'Bonded during training drills, great on-field chemistry' },
    { id: 'pr2', playerName: 'Kenji Tanaka', relationship: 'Good', change: 8, description: 'Shared cultural interests, improving communication' },
    { id: 'pr3', playerName: 'Lucas Müller', relationship: 'New Teammate', change: 15, description: 'Quick integration, similar playing style' },
    { id: 'pr4', playerName: 'Ahmed Hassan', relationship: 'Good', change: 5, description: 'Strong understanding in tactical sessions' },
    { id: 'pr5', playerName: 'James Cooper', relationship: 'Mentor', change: 3, description: 'Veteran leadership helping settle into squad' },
  ];

  const bondingCalendar: BondingCalendarEvent[] = [
    { id: 'bc1', day: 1, activity: 'Arrival & Check-in', color: '#484f58' },
    { id: 'bc2', day: 2, activity: 'Team Dinner', color: '#10b981' },
    { id: 'bc3', day: 3, activity: 'First Training', color: '#3b82f6' },
    { id: 'bc4', day: 5, activity: 'Match vs LA Galaxy', color: '#ef4444' },
    { id: 'bc5', day: 7, activity: 'Beach Training', color: '#3b82f6' },
    { id: 'bc6', day: 9, activity: 'Match vs NY Red Bulls', color: '#ef4444' },
    { id: 'bc7', day: 11, activity: 'Museum Visit', color: '#a855f7' },
    { id: 'bc8', day: 13, activity: 'Match vs Seattle', color: '#ef4444' },
    { id: 'bc9', day: 15, activity: 'Recovery Day', color: '#06b6d4' },
    { id: 'bc10', day: 17, activity: 'Match vs Atlanta', color: '#ef4444' },
    { id: 'bc11', day: 19, activity: 'Tactical Review', color: '#f59e0b' },
    { id: 'bc12', day: 21, activity: 'Match vs Inter Miami', color: '#ef4444' },
    { id: 'bc13', day: 23, activity: 'Pool Day', color: '#ec4899' },
    { id: 'bc14', day: 25, activity: 'Final Match', color: '#ef4444' },
    { id: 'bc15', day: 26, activity: 'Departure', color: '#484f58' },
  ];

  const playerPerformances: PlayerPerformance[] = [
    { id: 'pp1', name: playerName, position: 'ST', minutes: 85, rating: 8.2, goals: 2, assists: 0 },
    { id: 'pp2', name: 'Marcus Silva', position: 'CM', minutes: 90, rating: 7.8, goals: 0, assists: 2 },
    { id: 'pp3', name: 'Lucas Müller', position: 'LW', minutes: 78, rating: 7.5, goals: 1, assists: 1 },
    { id: 'pp4', name: 'Kenji Tanaka', position: 'CB', minutes: 90, rating: 7.9, goals: 0, assists: 0 },
    { id: 'pp5', name: 'Ahmed Hassan', position: 'CDM', minutes: 82, rating: 7.3, goals: 0, assists: 1 },
    { id: 'pp6', name: 'James Cooper', position: 'RB', minutes: 70, rating: 6.8, goals: 0, assists: 0 },
    { id: 'pp7', name: 'Carlos Ruiz', position: 'GK', minutes: 90, rating: 7.1, goals: 0, assists: 0 },
    { id: 'pp8', name: 'Pieter van Berg', position: 'ST', minutes: 65, rating: 6.5, goals: 1, assists: 0 },
  ];

  const topPerformers = [
    { id: 'tp1', name: playerName, rating: 7.9, goals: 4, assists: 1, motm: 2 },
    { id: 'tp2', name: 'Marcus Silva', rating: 7.6, goals: 0, assists: 3, motm: 1 },
    { id: 'tp3', name: 'Kenji Tanaka', rating: 7.4, goals: 0, assists: 0, motm: 1 },
  ];

  const revenueItems: RevenueItem[] = [
    { id: 'rv1', label: 'Match Revenue', value: 2400000, color: '#10b981' },
    { id: 'rv2', label: 'Merchandise', value: 1800000, color: '#3b82f6' },
    { id: 'rv3', label: 'Sponsors', value: 3200000, color: '#f59e0b' },
    { id: 'rv4', label: 'Media Rights', value: 1500000, color: '#a855f7' },
    { id: 'rv5', label: 'Hospitality', value: 800000, color: '#ec4899' },
  ];

  const integrationPlayers: IntegrationPlayer[] = [
    { id: 'ip1', name: 'Lucas Müller', score: 85, color: '#10b981' },
    { id: 'ip2', name: 'Pieter van Berg', score: 62, color: '#f59e0b' },
    { id: 'ip3', name: 'Tomás Araujo', score: 78, color: '#3b82f6' },
    { id: 'ip4', name: 'Riku Hayashi', score: 55, color: '#ef4444' },
    { id: 'ip5', name: 'Sergio Mora', score: 70, color: '#a855f7' },
  ];

  const tourImpactRadar: RadarAxis[] = [
    { label: 'Fitness', value: 78, color: '#10b981' },
    { label: 'Chemistry', value: 72, color: '#3b82f6' },
    { label: 'Revenue', value: 88, color: '#f59e0b' },
    { label: 'Fans', value: 82, color: '#a855f7' },
    { label: 'Tactical', value: 65, color: '#ec4899' },
    { label: 'Commercial', value: 90, color: '#06b6d4' },
  ];

  // Computed values (plain variables, NOT useMemo)
  const completedMatches = tourMatches.filter(m => m.result !== 'Upcoming').length;
  const totalMatches = tourMatches.length;
  const totalGoalsFor = tourMatches.reduce((sum, m) => sum + (m.homeScore ?? 0), 0);
  const totalGoalsAgainst = tourMatches.reduce((sum, m) => sum + (m.awayScore ?? 0), 0);
  const tourCompletionPct = Math.round((completedMatches / totalMatches) * 100);
  const wins = tourMatches.filter(m => m.result === 'W').length;
  const draws = tourMatches.filter(m => m.result === 'D').length;
  const losses = tourMatches.filter(m => m.result === 'L').length;
  const overallFitness = Math.round(fitnessCategories.reduce((sum, cat) => sum + cat.score, 0) / fitnessCategories.length);
  const teamChemistry = 72;
  const totalRevenue = revenueItems.reduce((sum, item) => sum + item.value, 0);
  const totalFanGrowth = 245000;

  const totalRevenueFormatted = `$${(totalRevenue / 1000000).toFixed(1)}M`;
  const maxRevenue = Math.max(...revenueItems.map(r => r.value));

  // Tab configuration
  const tabConfig: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'bonding', label: 'Bonding' },
    { id: 'analytics', label: 'Analytics' },
  ];

  // ============================================================
  // Conditional return AFTER all hooks (Rule 7)
  // ============================================================

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-[#484f58]">
          <Plane className="h-12 w-12" />
          <p>Loading tour data...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUB-COMPONENTS (camelCase, called as {fn()} per Rule 13)
  // ============================================================

  // -----------------------------------------------------------
  // Tab 1: Tour Overview
  // -----------------------------------------------------------

  /** Tour Header Card */
  function tourHeader(): React.JSX.Element {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Plane className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#c9d1d9]">USA Pre-Season Tour 2026</h2>
            <p className="text-[10px] text-[#8b949e]">Jul 14 – Aug 4, 2026 • {teamName}</p>
          </div>
          <Badge className="h-6 px-2.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
            In Progress
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">{wins}W-{draws}D-{losses}L</span>
            <span className="text-[7px] text-[#484f58] uppercase">Record</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
            <Target className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">{totalGoalsFor}</span>
            <span className="text-[7px] text-[#484f58] uppercase">Goals For</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">{totalGoalsAgainst}</span>
            <span className="text-[7px] text-[#484f58] uppercase">Goals Ag.</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
            <Heart className="h-3.5 w-3.5 text-pink-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">High</span>
            <span className="text-[7px] text-[#484f58] uppercase">Morale</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /** Tour Progress Ring SVG */
  function svgTourProgressRing(): React.JSX.Element {
    const r = 55;
    const circ = ringCircumference(r);
    const offset = ringDashOffset(r, tourCompletionPct);
    return (
      <svg viewBox="0 0 150 150" className="w-full">
        <circle cx="75" cy="75" r={r} fill="none" stroke="#21262d" strokeWidth="10" />
        <circle
          cx="75" cy="75" r={r} fill="none" stroke="#10b981" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="75" y="70" textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="12">Completed</text>
        <text x="75" y="88" textAnchor="middle" className="text-[10px] fill-[#c9d1d9]" fontSize="20" fontWeight="bold">
          {completedMatches}/{totalMatches}
        </text>
      </svg>
    );
  }

  /** Tour Revenue Bars SVG */
  function svgRevenueBars(): React.JSX.Element {
    const barMaxW = 180;
    return (
      <svg viewBox="0 0 300 180" className="w-full">
        <text x="10" y="18" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">Tour Revenue Breakdown</text>
        {revenueItems.map((item, idx) => {
          const barW = maxRevenue > 0 ? (item.value / maxRevenue) * barMaxW : 0;
          const y = 35 + idx * 28;
          return (
            <g key={item.id}>
              <text x="10" y={y + 12} className="text-[10px] fill-[#8b949e]" fontSize="11">{item.label}</text>
              <rect x="110" y={y} width={barMaxW} height="16" fill="#21262d" rx="3" />
              <rect x="110" y={y} width={Math.max(0, barW)} height="16" fill={item.color} rx="3" opacity="0.85" />
              <text x={115 + barW + 5} y={y + 12} className="text-[10px] fill-[#c9d1d9]" fontSize="10">
                ${(item.value / 1000000).toFixed(1)}M
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  /** Match Results Timeline SVG */
  function svgMatchResultsTimeline(): React.JSX.Element {
    const dotSpacing = 44;
    const startX = 20;
    return (
      <svg viewBox="0 0 300 80" className="w-full">
        {tourMatches.map((match, idx) => {
          const cx = startX + idx * dotSpacing;
          const cy = 35;
          const col = RESULT_COLORS[match.result];
          const nextCx = startX + (idx + 1) * dotSpacing;
          return (
            <g key={match.id}>
              {idx < tourMatches.length - 1 && (
                <line
                  x1={cx + 8} y1={cy}
                  x2={nextCx - 8} y2={cy}
                  stroke="#30363d" strokeWidth="2" strokeDasharray="4,3"
                />
              )}
              <circle cx={cx} cy={cy} r="8" fill={col} opacity="0.85" />
              <text x={cx} y={cy + 3} textAnchor="middle" className="text-[10px] fill-white" fontSize="9" fontWeight="bold">
                {match.result === 'Upcoming' ? '?' : match.result}
              </text>
              <text x={cx} y={cy + 22} textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="8">
                {match.opponent.split(' ').pop()}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  /** Match Card */
  function matchCard(match: TourMatch, idx: number): React.JSX.Element {
    const isExpanded = expandedMatch === match.id;
    const resultColor = RESULT_COLORS[match.result];
    return (
      <motion.div
        key={match.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: idx * 0.04 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-2 cursor-pointer"
        onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: `${resultColor}15`, color: resultColor }}
            >
              {match.result}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#c9d1d9] truncate">{match.opponent}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-2.5 w-2.5 text-[#484f58]" />
                <span className="text-[10px] text-[#8b949e]">{match.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {match.result !== 'Upcoming' && (
              <span className="text-sm font-bold text-[#c9d1d9]">{match.homeScore}-{match.awayScore}</span>
            )}
            {match.result === 'Upcoming' && (
              <Badge className="h-5 px-1.5 text-[9px] font-medium bg-[#21262d] text-[#484f58] border border-[#30363d] rounded-md">
                Upcoming
              </Badge>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[#484f58]" />
          </div>
        </div>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-[#21262d]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="h-3 w-3 text-[#484f58]" />
              <span className="text-[10px] text-[#8b949e]">{match.venue}, {match.city}</span>
            </div>
            {match.result !== 'Upcoming' && (
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-[#c9d1d9]">Goal scorer: {match.goalScorer}</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  /** Tour Progress Bar */
  function tourProgressBar(): React.JSX.Element {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wide">Tour Progress</span>
          <span className="text-[10px] font-bold text-emerald-400">{tourCompletionPct}%</span>
        </div>
        <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
          <motion.div
            className="h-full rounded-md bg-emerald-500"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: `${tourCompletionPct}%` }}
          />
        </div>
      </div>
    );
  }

  /** Tab 1: Overview Tab Content */
  function tabOverview(): React.JSX.Element {
    return (
      <div className="space-y-3">
        {tourHeader()}
        {tourProgressBar()}
        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Flag className="h-3 w-3 text-emerald-400" />
              Match Results
            </h3>
            {svgMatchResultsTimeline()}
          </CardContent>
        </Card>
        <div>
          <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 px-1 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-blue-400" />
            Fixtures & Results
          </h3>
          {tourMatches.map((match, idx) => matchCard(match, idx))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
            <CardContent className="p-3">
              <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Completion</h3>
              {svgTourProgressRing()}
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
            <CardContent className="p-3">
              <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Revenue</h3>
              {svgRevenueBars()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Tab 2: Fitness Assessment
  // -----------------------------------------------------------

  /** Fitness Hex Radar SVG */
  function svgFitnessRadar(): React.JSX.Element {
    const cx = 150;
    const cy = 110;
    const r = 70;
    const values = fitnessCategories.map(fc => fc.score);
    const labels = fitnessCategories.map(fc => fc.name);
    const labelPositions = computeRadarLabels(cx, cy, r, values.length, 14);
    return (
      <svg viewBox="0 0 300 200" className="w-full">
        {/* Grid layers */}
        {[0.25, 0.5, 0.75, 1].map((scale, layerIdx) => (
          <polygon
            key={`grid-${layerIdx}`}
            points={hexRadarGrid(cx, cy, r * scale, values.length)}
            fill="none" stroke="#30363d" strokeWidth="1" strokeDasharray={layerIdx < 3 ? '3,3' : 'none'}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: values.length }, (_, i) => {
          const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
          const ex = cx + r * Math.cos(angle);
          const ey = cy + r * Math.sin(angle);
          return (
            <line key={`axis-${i}`} x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)} stroke="#30363d" strokeWidth="1" opacity="0.3" />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={hexRadarPoints(cx, cy, r, values)}
          fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="2"
        />
        {/* Data points */}
        {values.map((val, i) => {
          const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
          const dist = (val / 100) * r;
          const px = cx + dist * Math.cos(angle);
          const py = cy + dist * Math.sin(angle);
          return (
            <circle key={`dot-${i}`} cx={px.toFixed(1)} cy={py.toFixed(1)} r="3" fill={fitnessCategories[i].color} />
          );
        })}
        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <text
            key={`label-${i}`}
            x={pos.x.toFixed(1)} y={(pos.y + 4).toFixed(1)}
            textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="10"
          >
            {labels[i]}
          </text>
        ))}
      </svg>
    );
  }

  /** Fitness Trend Area Chart SVG */
  function svgFitnessTrend(): React.JSX.Element {
    const w = 300;
    const h = 140;
    const padX = 35;
    const padY = 20;
    const linePoints = areaChartPoints(fitnessTrendData, w, h, padX, padY);
    const fillPoints = areaChartFill(fitnessTrendData, w, h, padX, padY);
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <text x="10" y="14" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">Fitness Score Trend</text>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val, gridIdx) => {
          const y = h - padY - (val / 100) * (h - padY * 2);
          return (
            <g key={`trend-grid-${gridIdx}`}>
              <line x1={padX} y1={y.toFixed(1)} x2={w - padX} y2={y.toFixed(1)} stroke="#30363d" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
              <text x={padX - 5} y={(y + 3).toFixed(1)} textAnchor="end" className="text-[10px] fill-[#484f58]" fontSize="8">{val}</text>
            </g>
          );
        })}
        {/* Area fill */}
        <polygon points={fillPoints} fill="#3b82f6" fillOpacity="0.1" />
        {/* Line */}
        <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {/* Data points */}
        {fitnessTrendData.map((val, i) => {
          const x = padX + (i / Math.max(fitnessTrendData.length - 1, 1)) * (w - padX * 2);
          const y = h - padY - (val / 100) * (h - padY * 2);
          return (
            <g key={`trend-pt-${i}`}>
              <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#3b82f6" />
              <text x={x.toFixed(1)} y={(y - 6).toFixed(1)} textAnchor="middle" className="text-[10px] fill-[#c9d1d9]" fontSize="8">{val}</text>
              <text x={x.toFixed(1)} y={(h - 3).toFixed(1)} textAnchor="middle" className="text-[10px] fill-[#484f58]" fontSize="8">{weeks[i]}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  /** Injury Risk Bars SVG */
  function svgInjuryRiskBars(): React.JSX.Element {
    return (
      <svg viewBox="0 0 300 120" className="w-full">
        <text x="10" y="16" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">Injury Risk by Body Area</text>
        {injuryRiskData.map((item, idx) => {
          const barW = (item.value / 100) * 180;
          const y = 30 + idx * 22;
          return (
            <g key={item.id}>
              <text x="10" y={y + 12} className="text-[10px] fill-[#8b949e]" fontSize="10">{item.label}</text>
              <rect x="90" y={y} width="180" height="14" fill="#21262d" rx="3" />
              <rect x="90" y={y} width={Math.max(0, barW)} height="14" fill={item.color} rx="3" opacity="0.8" />
              <text x={95 + barW + 5} y={y + 11} className="text-[10px] fill-[#c9d1d9]" fontSize="9">{item.value}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  /** Fitness Category Card */
  function fitnessCategoryCard(cat: FitnessCategory, idx: number): React.JSX.Element {
    const trendIcon = cat.trend > 0 ? '↑' : cat.trend < 0 ? '↓' : '→';
    const trendColor = cat.trend > 0 ? '#10b981' : cat.trend < 0 ? '#ef4444' : '#8b949e';
    return (
      <motion.div
        key={cat.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: idx * 0.04 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        style={{ borderLeft: `3px solid ${cat.color}` }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#c9d1d9]">{cat.name}</span>
          <span className="text-[10px] font-bold" style={{ color: trendColor }}>
            {trendIcon} {Math.abs(cat.trend)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: cat.color }}>{cat.score}</span>
          <div className="flex-1 h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full rounded-md"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  /** Injury Alert Card */
  function injuryAlertCard(alert: InjuryAlert): React.JSX.Element {
    const riskColor = RISK_COLORS[alert.risk] ?? '#8b949e';
    return (
      <div
        key={alert.id}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        style={{ borderLeft: `3px solid ${riskColor}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-[#c9d1d9]">{alert.player}</span>
          <Badge className="h-5 px-1.5 text-[9px] font-bold rounded-md border-0" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
            {alert.risk} Risk
          </Badge>
        </div>
        <p className="text-[10px] text-[#8b949e]">{alert.description}</p>
        <div className="flex items-center gap-1 mt-1">
          <Activity className="h-2.5 w-2.5" style={{ color: riskColor }} />
          <span className="text-[9px]" style={{ color: riskColor }}>{alert.area}</span>
        </div>
      </div>
    );
  }

  /** Tab 2: Fitness Tab Content */
  function tabFitness(): React.JSX.Element {
    return (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#c9d1d9]">Overall Fitness</h3>
              <p className="text-[10px] text-[#8b949e]">Pre-season training assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-bold" style={{ color: overallFitness >= 75 ? '#10b981' : overallFitness >= 50 ? '#f59e0b' : '#ef4444' }}>
              {overallFitness}
            </span>
            <span className="text-xs text-[#8b949e]">/ 100</span>
            <div className="flex-1" />
            <Badge className="h-5 px-2 text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
              On Track
            </Badge>
          </div>
        </motion.div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-blue-400" />
              Fitness Radar
            </h3>
            {svgFitnessRadar()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          {fitnessCategories.map((cat, idx) => fitnessCategoryCard(cat, idx))}
        </div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Fitness Trend (6 Weeks)
            </h3>
            {svgFitnessTrend()}
          </CardContent>
        </Card>

        <div>
          <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 px-1 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-400" />
            Injury Alerts
          </h3>
          {injuryAlerts.map(alert => injuryAlertCard(alert))}
        </div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-red-400" />
              Injury Risk Assessment
            </h3>
            {svgInjuryRiskBars()}
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-purple-400" />
              Fitness Test Results
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {fitnessTests.map(test => (
                <div key={test.id} className="bg-[#0d1117] border border-[#21262d] rounded-md p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">{test.test}</span>
                    <Badge className="h-4 px-1 text-[8px] font-bold rounded-md border-0" style={{
                      backgroundColor: `${FITNESS_COLORS[test.rating]}15`,
                      color: FITNESS_COLORS[test.rating],
                    }}>
                      {test.rating}
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9] block mt-0.5">{test.value}</span>
                  <span className="text-[9px] text-[#484f58]">Week {test.week}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Tab 3: Team Bonding
  // -----------------------------------------------------------

  /** Team Chemistry Gauge SVG */
  function svgChemistryGauge(): React.JSX.Element {
    const cx = 150;
    const cy = 120;
    const r = 80;
    const score = teamChemistry;
    const needleAngle = -180 + (score / 100) * 180;
    const needleRad = (needleAngle * Math.PI) / 180;
    const nx = cx + (r - 10) * Math.cos(needleRad);
    const ny = cy + (r - 10) * Math.sin(needleRad);

    const zones = [
      { start: -180, end: -90, color: '#ef4444' },
      { start: -90, end: 0, color: '#f59e0b' },
      { start: 0, end: 90, color: '#3b82f6' },
      { start: 90, end: 180, color: '#10b981' },
    ];

    return (
      <svg viewBox="0 0 300 180" className="w-full">
        {/* Background arc */}
        <path
          d={semiCircleArc(cx, cy, r, -180, 0)}
          fill="none" stroke="#21262d" strokeWidth="16" strokeLinecap="round"
        />
        {/* Colored zones */}
        {zones.map((zone, zIdx) => (
          <path
            key={`zone-${zIdx}`}
            d={semiCircleArc(cx, cy, r, zone.start, zone.end)}
            fill="none" stroke={zone.color} strokeWidth="14" strokeLinecap="round" opacity="0.3"
          />
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="#c9d1d9" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#c9d1d9" />
        {/* Score text */}
        <text x={cx} y={cy + 25} textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="11">Team Chemistry</text>
        <text x={cx} y={cy + 42} textAnchor="middle" className="text-[10px] fill-[#c9d1d9]" fontSize="22" fontWeight="bold">{score}/100</text>
        {/* Zone labels */}
        <text x="30" y={cy + 5} className="text-[10px] fill-[#ef4444]" fontSize="9">Low</text>
        <text x={cx - 10} y={cy - r - 5} textAnchor="middle" className="text-[10px] fill-[#f59e0b]" fontSize="9">Medium</text>
        <text x={300 - 30} y={cy + 5} textAnchor="end" className="text-[10px] fill-[#10b981]" fontSize="9">High</text>
      </svg>
    );
  }

  /** Bonding Activity Donut SVG (via reduce) */
  function svgBondingDonut(): React.JSX.Element {
    const donutItems = bondingActivities.map(ba => ({
      label: ba.type,
      value: ba.moodBoost,
      color: ba.color,
    }));
    const segments = computeDonutSegments(donutItems);

    return (
      <svg viewBox="0 0 200 200" className="w-full">
        {/* Background circle */}
        <circle cx="100" cy="100" r="70" fill="none" stroke="#21262d" strokeWidth="24" />
        {/* Segments */}
        {segments.map((seg, sIdx) => (
          <path
            key={`donut-${sIdx}`}
            d={seg.path}
            fill="none" stroke={seg.color} strokeWidth="24" strokeLinecap="round"
            opacity="0.8"
          />
        ))}
        {/* Center text */}
        <text x="100" y="95" textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="11">Activities</text>
        <text x="100" y="112" textAnchor="middle" className="text-[10px] fill-[#c9d1d9]" fontSize="16" fontWeight="bold">
          {bondingActivities.length}
        </text>
        {/* Legend */}
        {segments.map((seg, lIdx) => (
          <g key={`legend-${lIdx}`}>
            <rect x={lIdx * 48} y="175" width="8" height="8" fill={seg.color} rx="2" opacity="0.8" />
            <text x={lIdx * 48 + 12} y="183" className="text-[10px] fill-[#8b949e]" fontSize="8">{seg.label}</text>
          </g>
        ))}
      </svg>
    );
  }

  /** Player Integration Bars SVG */
  function svgIntegrationBars(): React.JSX.Element {
    return (
      <svg viewBox="0 0 300 160" className="w-full">
        <text x="10" y="16" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">New Player Integration</text>
        {integrationPlayers.map((player, idx) => {
          const barW = (player.score / 100) * 160;
          const y = 30 + idx * 24;
          return (
            <g key={player.id}>
              <text x="10" y={y + 12} className="text-[10px] fill-[#8b949e]" fontSize="10">{player.name}</text>
              <rect x="120" y={y} width="160" height="16" fill="#21262d" rx="3" />
              <rect x="120" y={y} width={Math.max(0, barW)} height="16" fill={player.color} rx="3" opacity="0.8" />
              <text x={125 + barW + 5} y={y + 12} className="text-[10px] fill-[#c9d1d9]" fontSize="9">{player.score}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  /** Bonding Activity Card */
  function bondingCard(activity: BondingActivity, idx: number): React.JSX.Element {
    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: idx * 0.04 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        style={{ borderLeft: `3px solid ${activity.color}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-[#c9d1d9]">{activity.name}</span>
          <Badge className="h-5 px-1.5 text-[9px] font-medium rounded-md border-0" style={{ backgroundColor: `${activity.color}15`, color: activity.color }}>
            {activity.type}
          </Badge>
        </div>
        <p className="text-[10px] text-[#8b949e] mb-1.5">{activity.description}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-[#484f58]" />
            <span className="text-[9px] text-[#484f58]">{activity.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5 text-[#484f58]" />
            <span className="text-[9px] text-[#484f58]">{activity.attendance} players</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-2.5 w-2.5 text-pink-400" />
            <span className="text-[9px] text-pink-300">+{activity.moodBoost} mood</span>
          </div>
        </div>
      </motion.div>
    );
  }

  /** Tab 3: Bonding Tab Content */
  function tabBonding(): React.JSX.Element {
    return (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-500/10 border border-pink-500/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#c9d1d9]">Team Chemistry</h3>
              <p className="text-[10px] text-[#8b949e]">Building cohesion during the tour</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-bold" style={{ color: teamChemistry >= 70 ? '#10b981' : teamChemistry >= 40 ? '#f59e0b' : '#ef4444' }}>
              {teamChemistry}
            </span>
            <span className="text-xs text-[#8b949e]">/ 100</span>
            <div className="flex-1" />
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] text-emerald-400">+8 from start</span>
          </div>
        </motion.div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-pink-400" />
              Chemistry Gauge
            </h3>
            {svgChemistryGauge()}
          </CardContent>
        </Card>

        <div>
          <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 px-1 flex items-center gap-1.5">
            <Globe className="h-3 w-3 text-purple-400" />
            Team Building Activities
          </h3>
          {bondingActivities.map((activity, idx) => bondingCard(activity, idx))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
            <CardContent className="p-3">
              <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Activity Mix</h3>
              {svgBondingDonut()}
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
            <CardContent className="p-3">
              <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Integration</h3>
              {svgIntegrationBars()}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 px-1 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            Player Relationship Updates
          </h3>
          {playerRelationships.map(rel => (
            <div
              key={rel.id}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#c9d1d9]">{rel.playerName}</span>
                <span className="text-[10px] font-bold text-emerald-400">+{rel.change}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="h-5 px-1.5 text-[9px] font-medium bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-md">
                  {rel.relationship}
                </Badge>
              </div>
              <p className="text-[10px] text-[#8b949e]">{rel.description}</p>
            </div>
          ))}
        </div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-cyan-400" />
              Bonding Event Calendar
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {bondingCalendar.map(event => (
                <div key={event.id} className="bg-[#0d1117] border border-[#21262d] rounded-md p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: event.color }} />
                    <span className="text-[9px] text-[#484f58]">Day {event.day}</span>
                  </div>
                  <span className="text-[10px] text-[#c9d1d9] block truncate">{event.activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Tab 4: Tour Analytics
  // -----------------------------------------------------------

  /** Goals Scored/Conceded Bars SVG */
  function svgGoalsBars(): React.JSX.Element {
    const completedTourMatches = tourMatches.filter(m => m.result !== 'Upcoming');
    const maxGoals = Math.max(
      ...completedTourMatches.map(m => Math.max(m.homeScore ?? 0, m.awayScore ?? 0)),
      1
    );
    const barGroupW = 36;
    const barW = 14;
    const startX = 40;
    return (
      <svg viewBox="0 0 300 180" className="w-full">
        <text x="10" y="16" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">Goals Scored vs Conceded</text>
        {/* Legend */}
        <rect x="160" y="6" width="8" height="8" fill="#10b981" rx="2" />
        <text x="172" y="14" className="text-[10px] fill-[#8b949e]" fontSize="9">Scored</text>
        <rect x="210" y="6" width="8" height="8" fill="#ef4444" rx="2" />
        <text x="222" y="14" className="text-[10px] fill-[#8b949e]" fontSize="9">Conceded</text>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((gVal, gIdx) => {
          const y = 150 - (gVal / 5) * 110;
          return (
            <g key={`goals-grid-${gIdx}`}>
              <line x1={startX - 5} y1={y.toFixed(1)} x2={290} y2={y.toFixed(1)} stroke="#30363d" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
              <text x={startX - 10} y={(y + 3).toFixed(1)} textAnchor="end" className="text-[10px] fill-[#484f58]" fontSize="8">{gVal}</text>
            </g>
          );
        })}
        {/* Bars */}
        {completedTourMatches.map((match, idx) => {
          const gx = startX + idx * barGroupW + 10;
          const gfBarH = ((match.homeScore ?? 0) / 5) * 110;
          const gaBarH = ((match.awayScore ?? 0) / 5) * 110;
          return (
            <g key={`goals-group-${idx}`}>
              <rect x={gx} y={150 - gfBarH} width={barW} height={gfBarH} fill="#10b981" rx="2" opacity="0.8" />
              <rect x={gx + barW + 2} y={150 - gaBarH} width={barW} height={gaBarH} fill="#ef4444" rx="2" opacity="0.8" />
              <text x={gx + barW} y={168} textAnchor="middle" className="text-[10px] fill-[#484f58]" fontSize="8">
                {match.opponent.split(' ').pop()}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={startX - 5} y1="150" x2="290" y2="150" stroke="#30363d" strokeWidth="1" />
      </svg>
    );
  }

  /** Player Performance Scatter SVG */
  function svgPerformanceScatter(): React.JSX.Element {
    const padX = 45;
    const padY = 20;
    const w = 300;
    const h = 180;
    const maxMinutes = 100;
    const maxRating = 10;
    const plotW = w - padX - 15;
    const plotH = h - padY * 2;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <text x="10" y="14" className="text-[10px] fill-[#8b949e]" fontSize="11" fontWeight="bold">Player Performance (Minutes vs Rating)</text>
        {/* Grid */}
        {[0, 2, 4, 6, 8, 10].map((rVal, rIdx) => {
          const y = h - padY - (rVal / maxRating) * plotH;
          return (
            <g key={`perf-grid-y-${rIdx}`}>
              <line x1={padX} y1={y.toFixed(1)} x2={w - 15} y2={y.toFixed(1)} stroke="#30363d" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
              <text x={padX - 5} y={(y + 3).toFixed(1)} textAnchor="end" className="text-[10px] fill-[#484f58]" fontSize="8">{rVal}</text>
            </g>
          );
        })}
        {[0, 25, 50, 75, 100].map((mVal, mIdx) => {
          const x = padX + (mVal / maxMinutes) * plotW;
          return (
            <g key={`perf-grid-x-${mIdx}`}>
              <line x1={x.toFixed(1)} y1={padY} x2={x.toFixed(1)} y2={h - padY} stroke="#30363d" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
              <text x={x.toFixed(1)} y={(h - 3).toFixed(1)} textAnchor="middle" className="text-[10px] fill-[#484f58]" fontSize="8">{mVal}</text>
            </g>
          );
        })}
        {/* Scatter dots */}
        {playerPerformances.map((pp) => {
          const x = padX + (pp.minutes / maxMinutes) * plotW;
          const y = h - padY - (pp.rating / maxRating) * plotH;
          const dotColor = pp.rating >= 7.5 ? '#10b981' : pp.rating >= 6.5 ? '#f59e0b' : '#ef4444';
          return (
            <g key={`perf-${pp.id}`}>
              <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="5" fill={dotColor} opacity="0.8" />
              <text x={(x + 7).toFixed(1)} y={(y - 3).toFixed(1)} className="text-[10px] fill-[#c9d1d9]" fontSize="7">{pp.name.split(' ')[0]}</text>
            </g>
          );
        })}
        {/* Axis labels */}
        <text x={padX + plotW / 2} y={(h - 1).toFixed(1)} textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="8">Minutes Played</text>
        <text x="12" y={padY + plotH / 2} textAnchor="start" className="text-[10px] fill-[#8b949e]" fontSize="8">Rating</text>
      </svg>
    );
  }

  /** Tour Impact Radar SVG */
  function svgImpactRadar(): React.JSX.Element {
    const cx = 150;
    const cy = 115;
    const r = 65;
    const values = tourImpactRadar.map(a => a.value);
    const labels = tourImpactRadar.map(a => a.label);
    const labelPositions = computeRadarLabels(cx, cy, r, values.length, 16);

    return (
      <svg viewBox="0 0 300 200" className="w-full">
        {/* Grid layers */}
        {[0.25, 0.5, 0.75, 1].map((scale, layerIdx) => (
          <polygon
            key={`impact-grid-${layerIdx}`}
            points={hexRadarGrid(cx, cy, r * scale, values.length)}
            fill="none" stroke="#30363d" strokeWidth="1" strokeDasharray={layerIdx < 3 ? '3,3' : 'none'}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: values.length }, (_, i) => {
          const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
          const ex = cx + r * Math.cos(angle);
          const ey = cy + r * Math.sin(angle);
          return (
            <line key={`impact-axis-${i}`} x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)} stroke="#30363d" strokeWidth="1" opacity="0.3" />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={hexRadarPoints(cx, cy, r, values)}
          fill="#a855f7" fillOpacity="0.15" stroke="#a855f7" strokeWidth="2"
        />
        {/* Data points */}
        {values.map((val, i) => {
          const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
          const dist = (val / 100) * r;
          const px = cx + dist * Math.cos(angle);
          const py = cy + dist * Math.sin(angle);
          return (
            <circle key={`impact-dot-${i}`} cx={px.toFixed(1)} cy={py.toFixed(1)} r="3" fill={tourImpactRadar[i].color} />
          );
        })}
        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <text
            key={`impact-label-${i}`}
            x={pos.x.toFixed(1)} y={(pos.y + 4).toFixed(1)}
            textAnchor="middle" className="text-[10px] fill-[#8b949e]" fontSize="10"
          >
            {labels[i]}
          </text>
        ))}
      </svg>
    );
  }

  /** Top Performer Card */
  function topPerformerCard(performer: typeof topPerformers[0], idx: number): React.JSX.Element {
    const medalColors = ['#fbbf24', '#c0c0c0', '#cd7f32'];
    const medalLabels = ['🥇', '🥈', '🥉'];
    return (
      <motion.div
        key={performer.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: idx * 0.06 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: `${medalColors[idx]}15` }}
          >
            {medalLabels[idx]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9]">{performer.name}</span>
              {performer.motm > 0 && (
                <Badge className="h-4 px-1 text-[8px] font-bold bg-amber-500/15 text-amber-300 border-amber-500/30 rounded-md">
                  {performer.motm}x MOTM
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-[#8b949e]">
                <Star className="h-2.5 w-2.5 inline text-amber-400" /> {performer.goals}G
              </span>
              <span className="text-[10px] text-[#8b949e]">
                <Target className="h-2.5 w-2.5 inline text-blue-400" /> {performer.assists}A
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#c9d1d9]">{performer.rating}</span>
            <p className="text-[9px] text-[#484f58]">Avg Rating</p>
          </div>
        </div>
      </motion.div>
    );
  }

  /** Tab 4: Analytics Tab Content */
  function tabAnalytics(): React.JSX.Element {
    return (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#c9d1d9]">Tour Summary</h3>
              <p className="text-[10px] text-[#8b949e]">Comprehensive tour analytics</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
              <Trophy className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-[#c9d1d9]">{totalMatches}</span>
              <span className="text-[7px] text-[#484f58] uppercase">Matches</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-sm font-bold text-[#c9d1d9]">{wins}W-{draws}D-{losses}L</span>
              <span className="text-[7px] text-[#484f58] uppercase">Record</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-bold text-[#c9d1d9]">{totalGoalsFor}/{totalGoalsAgainst}</span>
              <span className="text-[7px] text-[#484f58] uppercase">GF/GA</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
              <DollarSign className="h-3.5 w-3.5 text-green-400" />
              <span className="text-sm font-bold text-[#c9d1d9]">{totalRevenueFormatted}</span>
              <span className="text-[7px] text-[#484f58] uppercase">Revenue</span>
            </div>
          </div>
        </motion.div>

        <div>
          <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 px-1 flex items-center gap-1.5">
            <Award className="h-3 w-3 text-amber-400" />
            Top Performers
          </h3>
          {topPerformers.map((performer, idx) => topPerformerCard(performer, idx))}
        </div>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-blue-400" />
              Goals Scored vs Conceded
            </h3>
            {svgGoalsBars()}
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-purple-400" />
              Player Performance Scatter
            </h3>
            {svgPerformanceScatter()}
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-cyan-400" />
              Tour Impact Radar
            </h3>
            {svgImpactRadar()}
          </CardContent>
        </Card>

        {/* Fan Engagement */}
        <Card className="bg-[#161b22] border border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-emerald-400" />
              Fan Engagement
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                <span className="text-[9px] text-[#484f58] uppercase block">Social Followers</span>
                <span className="text-sm font-bold text-[#c9d1d9]">+{totalFanGrowth.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-400 block">↑ 12% growth</span>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                <span className="text-[9px] text-[#484f58] uppercase block">Merchandise Sales</span>
                <span className="text-sm font-bold text-[#c9d1d9]">$1.8M</span>
                <span className="text-[9px] text-emerald-400 block">↑ 23% vs last tour</span>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                <span className="text-[9px] text-[#484f58] uppercase block">Match Attendance</span>
                <span className="text-sm font-bold text-[#c9d1d9]">285,400</span>
                <span className="text-[9px] text-emerald-400 block">Avg 47,567/match</span>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                <span className="text-[9px] text-[#484f58] uppercase block">Media Mentions</span>
                <span className="text-sm font-bold text-[#c9d1d9]">1,240</span>
                <span className="text-[9px] text-emerald-400 block">↑ 18% coverage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Impact */}
        <Card className="bg-[#161b22] border border-[#30363d] rounded-lg">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-green-400" />
              Commercial Impact Summary
            </h3>
            <div className="space-y-2">
              {revenueItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#c9d1d9]">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9]">${(item.value / 1000000).toFixed(1)}M</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2.5">
                <span className="text-xs font-bold text-emerald-300">Total Revenue</span>
                <span className="text-xs font-bold text-emerald-300">{totalRevenueFormatted}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-[#c9d1d9]">Pre-Season Tour</h1>
          <p className="text-[10px] text-[#8b949e]">{teamName} • 2026 USA Tour</p>
        </div>
        <Badge className="h-6 px-2.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
          {completedMatches}/{totalMatches} Played
        </Badge>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg h-9 p-1">
          {tabConfig.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 h-7 text-[10px] font-semibold rounded-md data-[state=active]:bg-[#161b22] data-[state=active]:text-[#c9d1d9] text-[#8b949e] data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-4">
            <motion.div key="overview" {...fadeSwitch}>
              {tabOverview()}
            </motion.div>
          </TabsContent>
          <TabsContent value="fitness" className="mt-4">
            <motion.div key="fitness" {...fadeSwitch}>
              {tabFitness()}
            </motion.div>
          </TabsContent>
          <TabsContent value="bonding" className="mt-4">
            <motion.div key="bonding" {...fadeSwitch}>
              {tabBonding()}
            </motion.div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <motion.div key="analytics" {...fadeSwitch}>
              {tabAnalytics()}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
