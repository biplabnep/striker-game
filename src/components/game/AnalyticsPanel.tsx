'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PlayerAttributes, CoreAttribute } from '@/lib/game/types';
import { getAttributeCategory, getOverallColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Flame,
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Shield,
  Swords,
  Wind,
  Footprints,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// -----------------------------------------------------------
// Attribute metadata
// -----------------------------------------------------------
const ATTR_KEYS: (keyof PlayerAttributes)[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical',
];

const ATTR_LABELS: Record<CoreAttribute, string> = {
  pace: 'PAC', shooting: 'SHO', passing: 'PAS',
  dribbling: 'DRI', defending: 'DEF', physical: 'PHY',
};

const ATTR_FULL_LABELS: Record<CoreAttribute, string> = {
  pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
  dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical',
};

const ATTR_ICONS: Record<CoreAttribute, React.ReactNode> = {
  pace: <Wind className="h-3 w-3" />,
  shooting: <Target className="h-3 w-3" />,
  passing: <Swords className="h-3 w-3" />,
  dribbling: <Zap className="h-3 w-3" />,
  defending: <Shield className="h-3 w-3" />,
  physical: <Footprints className="h-3 w-3" />,
};

type AttrCategory = 'Attacking' | 'Defensive' | 'Physical' | 'Technical';

const ATTR_CATEGORIES: Record<CoreAttribute, AttrCategory> = {
  pace: 'Physical',
  shooting: 'Attacking',
  passing: 'Technical',
  dribbling: 'Technical',
  defending: 'Defensive',
  physical: 'Physical',
};

const CATEGORY_COLORS: Record<AttrCategory, string> = {
  Attacking: 'text-red-400 bg-red-500/10 border-red-500/20',
  Defensive: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Physical: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Technical: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

// -----------------------------------------------------------
// SVG Radar Chart helpers
// -----------------------------------------------------------
const RADAR_CX = 140;
const RADAR_CY = 140;
const RADAR_R = 105;
const NUM_AXES = 6;
// Start from top (-90°), go clockwise
const ANGLE_OFFSET = -Math.PI / 2;

function getAngle(i: number): number {
  return ANGLE_OFFSET + (2 * Math.PI * i) / NUM_AXES;
}

function getPoint(index: number, value: number, maxVal: number = 100): { x: number; y: number } {
  const angle = getAngle(index);
  const r = (value / maxVal) * RADAR_R;
  return {
    x: RADAR_CX + r * Math.cos(angle),
    y: RADAR_CY + r * Math.sin(angle),
  };
}

function getPolygonPoints(
  values: number[],
  maxVal: number = 100
): string {
  return values
    .map((v, i) => {
      const p = getPoint(i, v, maxVal);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

// -----------------------------------------------------------
// Animated counter component
// -----------------------------------------------------------
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {value}
    </motion.span>
  );
}

// -----------------------------------------------------------
// Rating color helper
// -----------------------------------------------------------
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return '#22c55e';
  if (rating >= 7.0) return '#10b981';
  if (rating >= 6.0) return '#f59e0b';
  if (rating >= 5.0) return '#f97316';
  return '#ef4444';
}

function getRatingBg(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500/15 border-emerald-500/30';
  if (rating >= 7.0) return 'bg-emerald-600/10 border-emerald-600/25';
  if (rating >= 6.0) return 'bg-amber-500/10 border-amber-500/25';
  if (rating >= 5.0) return 'bg-orange-500/10 border-orange-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

// -----------------------------------------------------------
// Milestone definitions
// -----------------------------------------------------------
interface Milestone {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color: string;
}

function getGoalMilestones(goals: number): { current: number; target: number } {
  const milestones = [5, 10, 15, 20, 25, 30, 50, 75, 100];
  for (const m of milestones) {
    if (goals < m) return { current: goals, target: m };
  }
  return { current: goals, target: goals + 10 };
}

function getAppearancesMilestones(apps: number): { current: number; target: number } {
  const milestones = [10, 20, 30, 50, 75, 100, 150, 200];
  for (const m of milestones) {
    if (apps < m) return { current: apps, target: m };
  }
  return { current: apps, target: apps + 25 };
}

// -----------------------------------------------------------
// Main component
// -----------------------------------------------------------
export default function AnalyticsPanel() {
  const gameState = useGameStore(state => state.gameState);

  // ---- Computed values (before early return) ----
  const attrValues = useMemo(() => {
    if (!gameState) return [] as number[];
    return ATTR_KEYS.map(k => gameState.player.attributes[k] ?? 0);
  }, [gameState]);

  const potentialValues = useMemo(() => {
    if (!gameState) return [] as number[];
    const p = gameState.player;
    // Estimate potential per attribute based on overall → potential ratio
    const gap = p.potential - p.overall;
    return ATTR_KEYS.map(k => (gameState.player.attributes[k] ?? 0) + Math.max(0, Math.floor(gap / 6)));
  }, [gameState]);

  const recentRatings = useMemo(() => {
    if (!gameState) return [] as number[];
    return gameState.recentResults.slice(0, 10).map(r => r.playerRating).filter(r => r > 0);
  }, [gameState]);

  const last5Ratings = useMemo(() => {
    if (!gameState) return [] as number[];
    return gameState.recentResults.slice(0, 5).map(r => r.playerRating).filter(r => r > 0);
  }, [gameState]);

  const formTrend = useMemo(() => {
    if (last5Ratings.length < 3) return 'stable' as const;
    const firstHalf = last5Ratings.slice(Math.ceil(last5Ratings.length / 2));
    const secondHalf = last5Ratings.slice(0, Math.ceil(last5Ratings.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avgSecond - avgFirst > 0.3) return 'improving' as const;
    if (avgFirst - avgSecond > 0.3) return 'declining' as const;
    return 'stable' as const;
  }, [last5Ratings]);

  const bestRating = useMemo(() => {
    if (last5Ratings.length === 0) return 0;
    return Math.max(...last5Ratings);
  }, [last5Ratings]);

  const worstRating = useMemo(() => {
    if (last5Ratings.length === 0) return 0;
    return Math.min(...last5Ratings);
  }, [last5Ratings]);

  const seasonComparison = useMemo(() => {
    if (!gameState || gameState.seasons.length === 0) return null;
    const current = gameState.player.seasonStats;
    // Find best season by average rating
    const bestSeason = gameState.seasons.reduce((best, s) =>
      s.playerStats.averageRating > best.playerStats.averageRating ? s : best
    , gameState.seasons[0]);
    return {
      bestSeason,
      current,
      rows: [
        {
          label: 'Goals',
          prev: bestSeason.playerStats.goals,
          curr: current.goals,
        },
        {
          label: 'Assists',
          prev: bestSeason.playerStats.assists,
          curr: current.assists,
        },
        {
          label: 'Avg Rating',
          prev: bestSeason.playerStats.averageRating,
          curr: current.averageRating,
          isDecimal: true,
        },
        {
          label: 'Appearances',
          prev: bestSeason.playerStats.appearances,
          curr: current.appearances,
        },
      ],
    };
  }, [gameState]);

  const milestones = useMemo((): Milestone[] => {
    if (!gameState) return [];
    const p = gameState.player;
    const goals = getGoalMilestones(p.seasonStats.goals);
    const apps = getAppearancesMilestones(p.seasonStats.appearances);

    const result: Milestone[] = [
      {
        label: 'Goals',
        current: goals.current,
        target: goals.target,
        icon: <Target className="h-3.5 w-3.5" />,
        color: 'text-emerald-400',
      },
      {
        label: 'Appearances',
        current: apps.current,
        target: apps.target,
        icon: <Star className="h-3.5 w-3.5" />,
        color: 'text-amber-400',
      },
    ];

    // Rating milestones
    const avgRating = p.seasonStats.averageRating;
    if (avgRating < 7.0) {
      result.push({
        label: '7.0 Avg Rating',
        current: Math.round(avgRating * 100),
        target: 700,
        icon: <Award className="h-3.5 w-3.5" />,
        color: 'text-blue-400',
      });
    } else if (avgRating < 8.0) {
      result.push({
        label: '8.0 Avg Rating',
        current: Math.round(avgRating * 100),
        target: 800,
        icon: <Trophy className="h-3.5 w-3.5" />,
        color: 'text-purple-400',
      });
    }

    return result;
  }, [gameState]);

  // ---- Heatmap data (7 days × 5 time slots) ----
  const heatmapData = useMemo(() => {
    if (!gameState) return [] as number[][];
    const attrs = ATTR_KEYS.map(k => gameState.player.attributes[k] ?? 0);
    const overall = attrs.reduce((a, b) => a + b, 0) / attrs.length;
    // Deterministic pseudo-random from overall
    const seed = overall * 7 + (gameState.player.potential * 3);
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    const grid: number[][] = [];
    for (let d = 0; d < 7; d++) {
      const row: number[] = [];
      for (let t = 0; t < 5; t++) {
        const base = overall / 100;
        // Simulate variation: weekends slightly higher performance
        const dayBonus = d >= 5 ? 0.08 : 0;
        const timeBonus = t >= 2 && t <= 3 ? 0.06 : 0;
        const noise = (seededRandom(d * 5 + t) - 0.5) * 0.4;
        row.push(Math.max(0, Math.min(1, base + dayBonus + timeBonus + noise)));
      }
      grid.push(row);
    }
    return grid;
  }, [gameState]);

  // ---- League average values for spider chart comparison ----
  const leagueAverageValues = useMemo(() => {
    if (!gameState) return [65, 60, 62, 58, 55, 63] as number[];
    const p = gameState.player;
    const base = Math.max(40, Math.min(85, p.overall - 5));
    // Slight per-attribute variation based on league position
    return ATTR_KEYS.map((_, i) => {
      const variation = Math.sin(i * 1.8) * 8;
      return Math.round(base + variation);
    });
  }, [gameState]);

  // ---- Season trend data (simulated monthly) ----
  const seasonTrendData = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const overall = p.overall;
    const seed = overall + p.potential;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 73.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const goalsPerMonth = Array.from({ length: 8 }, (_, i) => {
      const base = p.seasonStats.goals / Math.max(1, p.seasonStats.appearances || 8);
      return Math.max(0, Math.round((base * (0.5 + seededRandom(i * 3) * 1.2)) * 10) / 10);
    });
    const avgRatingTrend = Array.from({ length: 8 }, (_, i) => {
      const base = p.seasonStats.averageRating || 6.5;
      return Math.max(4, Math.min(10, +(base + (seededRandom(i * 3 + 50) - 0.5) * 1.5).toFixed(1)));
    });
    const minutesPlayed = Array.from({ length: 8 }, (_, i) => {
      const base = p.seasonStats.appearances > 0 ? 60 : 30;
      return Math.max(0, Math.round(base + (seededRandom(i * 3 + 100) - 0.3) * 50));
    });
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return { goalsPerMonth, avgRatingTrend, minutesPlayed, months };
  }, [gameState]);

  // ---- Strengths & Weaknesses ----
  const strengthsWeaknesses = useMemo(() => {
    if (!gameState) return null;
    const entries = ATTR_KEYS.map(k => ({
      key: k as CoreAttribute,
      label: ATTR_FULL_LABELS[k],
      value: gameState.player.attributes[k] ?? 0,
      icon: ATTR_ICONS[k],
      category: ATTR_CATEGORIES[k],
    }));
    const sorted = [...entries].sort((a, b) => b.value - a.value);
    return {
      strengths: sorted.slice(0, 3),
      weaknesses: sorted.slice(-3).reverse(),
    };
  }, [gameState]);

  // ---- Development Trajectory ----
  const developmentTrajectory = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const currentOverall = p.overall;
    const potential = p.potential;
    const age = p.age || 22;
    const gap = potential - currentOverall;
    // Simulate 8 future seasons (2 seasons × 4 quarters per season shown as months)
    const numPoints = 24;
    const projected: { x: number; y: number }[] = [];
    const upperBound: { x: number; y: number }[] = [];
    const lowerBound: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      // Age curve: faster growth early, slower near peak, slight decline at very old age
      const ageFactor = age < 26 ? 1.0 : age < 29 ? 0.7 : age < 32 ? 0.3 : -0.1;
      const growth = gap * (1 - Math.pow(1 - t, 2)) * ageFactor;
      const value = Math.min(potential, currentOverall + growth);
      const noise = Math.sin(i * 2.7) * 1.5;
      projected.push({ x: i, y: value + noise });
      upperBound.push({ x: i, y: Math.min(potential + 2, value + 4 + noise * 0.5) });
      lowerBound.push({ x: i, y: Math.max(currentOverall - 3, value - 4 + noise * 0.5) });
    }
    return { projected, upperBound, lowerBound, numPoints, currentOverall, potential };
  }, [gameState]);

  // ---- Advanced Metrics (xG, xA, pass completion, etc.) ----
  const advancedMetrics = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const ss = p.seasonStats;
    const seed = p.overall * 3 + p.potential * 7 + ss.goals * 13;
    const sr = (i: number) => {
      const x = Math.sin(seed + i * 91.3) * 43758.5453;
      return x - Math.floor(x);
    };
    const apps = Math.max(1, ss.appearances);
    const minutes = Math.max(1, ss.minutesPlayed || apps * 80);
    const minutes90 = minutes / 90;

    return [
      { label: 'xG', value: Math.max(0, +(ss.goals * (0.6 + sr(1) * 0.35)).toFixed(2)), leagueAvg: +(apps * 0.18).toFixed(2), unit: '', gauge: true },
      { label: 'xA', value: Math.max(0, +(ss.assists * (0.55 + sr(2) * 0.4)).toFixed(2)), leagueAvg: +(apps * 0.14).toFixed(2), unit: '', gauge: true },
      { label: 'Pass Comp %', value: Math.min(100, Math.round(65 + (p.attributes.passing ?? 50) * 0.3 + (sr(3) - 0.5) * 10)), leagueAvg: 76, unit: '%', circular: true },
      { label: 'Key Passes /90', value: +(1.2 + (p.attributes.passing ?? 50) / 80 * 1.8 + (sr(4) - 0.5) * 0.8).toFixed(1), leagueAvg: 1.8, unit: '', bar: true },
      { label: 'Dribble Success', value: Math.min(95, Math.round(40 + (p.attributes.dribbling ?? 50) * 0.5 + (sr(5) - 0.5) * 15)), leagueAvg: 52, unit: '%', hBar: true },
      { label: 'Aerial Duel Win', value: Math.min(95, Math.round(35 + (p.attributes.physical ?? 50) * 0.5 + (sr(6) - 0.5) * 12)), leagueAvg: 48, unit: '%', hBar: true },
      { label: 'Pressures /90', value: +(12 + (p.attributes.physical ?? 50) / 80 * 8 + (sr(7) - 0.5) * 5).toFixed(1), leagueAvg: 16.5, unit: '', sparkline: true },
      { label: 'Progressive Passes', value: Math.round(3 + (p.attributes.passing ?? 50) / 80 * 6 + (sr(8) - 0.5) * 3), leagueAvg: 5.2, unit: '/90', trend: true },
    ];
  }, [gameState]);

  // ---- Season-by-Season Breakdown data ----
  const seasonBreakdown = useMemo(() => {
    if (!gameState) return null;
    const seasons = gameState.seasons;
    if (seasons.length === 0) return null;
    return seasons.map(s => ({
      number: s.number,
      goals: s.playerStats.goals,
      assists: s.playerStats.assists,
      appearances: s.playerStats.appearances,
      avgRating: s.playerStats.averageRating,
      cleanSheets: s.playerStats.cleanSheets,
      motm: s.playerStats.manOfTheMatch,
    }));
  }, [gameState]);

  // ---- Performance Radar (8-axis: current vs debut) ----
  const performanceRadar = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const attrs = ATTR_KEYS.map(k => p.attributes[k] ?? 0);
    const radar8Keys = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical', 'Vision', 'Composure'];
    const current = [...attrs,
      Math.round((attrs[2] + attrs[3]) / 2 + 2),
      Math.round((attrs[5] + attrs[0]) / 2 + 1),
    ];
    const debutOffset = Math.round((p.potential - p.overall) * 0.6);
    const debut = current.map(v => Math.max(30, v - debutOffset - Math.round(Math.sin(v) * 3)));
    const overallGrowth = Math.round(
      ((current.reduce((a, b) => a + b, 0) - debut.reduce((a, b) => a + b, 0)) / debut.reduce((a, b) => a + b, 0)) * 100
    );
    return { keys: radar8Keys, current, debut, overallGrowth };
  }, [gameState]);

  // ---- Clutch Performance data ----
  const clutchData = useMemo(() => {
    if (!gameState) return null;
    const results = gameState.recentResults;
    const clutchMatches: Array<{
      week: number;
      rating: number;
      goals: number;
      assists: number;
      type: 'rating' | 'late_goal' | 'motm';
    }> = [];
    let clutchGoals = 0;
    let clutchAssists = 0;
    let lateGoals = 0;
    let matchWinningGoals = 0;

    for (const r of results) {
      let isClutch = false;
      let type: 'rating' | 'late_goal' | 'motm' = 'rating';
      if (r.playerRating >= 8.0) { isClutch = true; type = 'rating'; }
      if (r.playerGoals > 0 && r.events) {
        for (const e of r.events) {
          if (e.type === 'goal' && e.playerName === gameState.player.name && e.minute >= 75) {
            isClutch = true;
            type = 'late_goal';
            lateGoals++;
          }
        }
      }
      if (r.playerRating >= 8.5 && r.playerGoals > 0) {
        isClutch = true;
        if (type !== 'late_goal') type = 'motm';
      }
      if (isClutch) {
        if (r.playerGoals > 0) {
          clutchGoals += r.playerGoals;
          if (r.playerRating >= 8.0 && r.playerGoals > 0) matchWinningGoals++;
        }
        clutchAssists += r.playerAssists;
        clutchMatches.push({ week: r.week, rating: r.playerRating, goals: r.playerGoals, assists: r.playerAssists, type });
      }
    }

    const clutchRating = clutchMatches.length > 0
      ? +(clutchMatches.reduce((s, m) => s + m.rating, 0) / clutchMatches.length).toFixed(1)
      : 0;
    const stars = clutchRating >= 8.5 ? 5 : clutchRating >= 8.0 ? 4 : clutchRating >= 7.5 ? 3 : clutchRating >= 7.0 ? 2 : clutchRating > 0 ? 1 : 0;
    const top3 = [...clutchMatches].sort((a, b) => b.rating - a.rating).slice(0, 3);

    return { clutchMatches, clutchGoals, clutchAssists, lateGoals, matchWinningGoals, clutchRating, stars, top3 };
  }, [gameState]);

  // ---- Opponent Analysis Grid ----
  const opponentAnalysis = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const ss = p.seasonStats;
    const seed = p.overall * 11 + p.potential * 3 + ss.goals * 7;
    const sr = (i: number) => {
      const x = Math.sin(seed + i * 61.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const types = [
      'vs Top 6', 'vs Mid Table', 'vs Bottom 6',
      'vs Strong Def', 'vs Weak Def', 'vs High Press',
      'vs Low Block', 'vs Possession', 'vs Counter',
      'vs Physical', 'vs Technical', 'vs Fast Teams',
    ];
    return types.map((label, i) => {
      const apps = Math.max(0, Math.round(2 + sr(i * 3) * 10));
      const goals = apps > 0 ? Math.round(sr(i * 3 + 1) * apps * 0.5 * (p.attributes.shooting ?? 50) / 80) : 0;
      const assists = apps > 0 ? Math.round(sr(i * 3 + 2) * apps * 0.35 * (p.attributes.passing ?? 50) / 80) : 0;
      const rating = apps > 0
        ? +(5.5 + (p.overall - 60) / 80 + (sr(i * 3 + 10) - 0.3) * 1.5).toFixed(1)
        : 0;
      return { label, apps, goals, assists, rating: Math.max(4, Math.min(10, rating)) };
    });
  }, [gameState]);

  // ---- Early return ----
  if (!gameState) return null;

  const { player } = gameState;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-emerald-400" />
        Analytics
      </h2>

      {/* ============================================= */}
      {/* Overall & Potential - Header Card */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden bg-[#161b22] border border-[#30363d]">
          <CardContent className="p-5">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <motion.div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl border-[3px]"
                  style={{
                    borderColor: getOverallColor(player.overall),
                    color: getOverallColor(player.overall),
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <AnimatedNumber value={player.overall} />
                </motion.div>
                <p className="text-xs text-[#8b949e] mt-2 font-medium">Overall</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-0.5 h-6 bg-[#30363d]" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <TrendingUp className="h-4 w-4 text-emerald-500/60" />
                </motion.div>
                <div className="w-0.5 h-6 bg-[#30363d]" />
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-2xl border-2 border-dashed border-slate-600 text-[#8b949e]">
                  {player.potential}
                </div>
                <p className="text-xs text-[#8b949e] mt-2">Potential</p>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-xs text-[#8b949e]">
                Room to grow:{' '}
                <span className="text-emerald-400 font-semibold">
                  +{player.potential - player.overall}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Performance Summary Cards (2×2) */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Target className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#8b949e]">Total Goals</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">
                    <AnimatedNumber value={player.careerStats.totalGoals} />
                  </p>
                  <span className="text-[9px] text-emerald-400">
                    {player.seasonStats.goals > 0 ? '\u25B2' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#8b949e]">Total Assists</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-amber-400 tabular-nums">
                    <AnimatedNumber value={player.careerStats.totalAssists} />
                  </p>
                  <span className="text-[9px] text-amber-400">
                    {player.seasonStats.assists > 0 ? '\u25B2' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
                <Award className="h-4 w-4 text-sky-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#8b949e]">Avg Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-sky-400 tabular-nums">
                    {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}
                  </p>
                  <span className="text-[9px]" style={{ color: player.seasonStats.averageRating >= 7 ? '#10b981' : '#ef4444' }}>
                    {player.seasonStats.averageRating >= 7 ? '\u25B2' : player.seasonStats.averageRating > 0 ? '\u25BC' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Star className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-[#8b949e]">Matches</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-purple-400 tabular-nums">
                    <AnimatedNumber value={player.careerStats.totalAppearances} />
                  </p>
                  <span className="text-[9px] text-purple-400">
                    {player.seasonStats.appearances > 0 ? '\u25B2' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ============================================= */}
      {/* Radar / Spider Chart */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <Swords className="h-3 w-3 text-emerald-400" /> Attribute Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3 flex justify-center">
            <svg
              width={280}
              height={280}
              viewBox="0 0 280 280"
              className="select-none"
            >
              {/* Grid lines at 20, 40, 60, 80, 100 */}
              {[20, 40, 60, 80, 100].map(level => (
                <polygon
                  key={level}
                  points={getPolygonPoints(Array(6).fill(level))}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}

              {/* Axis lines */}
              {ATTR_KEYS.map((_, i) => {
                const outer = getPoint(i, 100);
                return (
                  <line
                    key={i}
                    x1={RADAR_CX}
                    y1={RADAR_CY}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#334155"
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                );
              })}

              {/* Potential polygon (dashed amber) */}
              <motion.polygon
                points={getPolygonPoints(potentialValues)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.2, delay: 0.6 }}
              />

              {/* Current attributes polygon (emerald fill) */}
              <motion.polygon
                points={getPolygonPoints(attrValues)}
                fill="rgba(16, 185, 129, 0.15)"
                stroke="#10b981"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2, ease: 'easeOut' }}
                style={{ transformOrigin: `${RADAR_CX}px ${RADAR_CY}px` }}
              />

              {/* Attribute dots + labels */}
              {ATTR_KEYS.map((key, i) => {
                const val = player.attributes[key] ?? 0;
                const pt = getPoint(i, val);
                const labelPt = getPoint(i, 125);
                const cat = getAttributeCategory(val);
                return (
                  <g key={key}>
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      r={3.5}
                      fill="#10b981"
                      stroke="#064e3b"
                      strokeWidth={1}
                      initial={{ r: 0 }}
                      animate={{ r: 3.5 }}
                      transition={{ delay: 0.5 + i * 0.06, type: 'spring' }}
                    />
                    {/* Label */}
                    <text
                      x={labelPt.x}
                      y={labelPt.y - 4}
                      textAnchor="middle"
                      className="fill-slate-400"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {ATTR_LABELS[key]}
                    </text>
                    {/* Value */}
                    <text
                      x={labelPt.x}
                      y={labelPt.y + 9}
                      textAnchor="middle"
                      fill={cat.color}
                      fontSize={11}
                      fontWeight={700}
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>

          {/* Attribute category badges */}
          <div className="px-4 pb-3 flex flex-wrap gap-2 justify-center">
            {(['Attacking', 'Technical', 'Defensive', 'Physical'] as AttrCategory[]).map(cat => {
              const attrs = ATTR_KEYS.filter(k => ATTR_CATEGORIES[k] === cat);
              const avg = attrs.reduce((sum, k) => sum + (player.attributes[k] ?? 0), 0) / attrs.length;
              return (
                <Badge
                  key={cat}
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 border ${CATEGORY_COLORS[cat]}`}
                >
                  {cat} {avg.toFixed(0)}
                </Badge>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Attribute Bars with Category Badges */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] ">
              Detailed Attributes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {ATTR_KEYS.map((attr, idx) => {
              const val = player.attributes[attr] ?? 0;
              const cat = getAttributeCategory(val);
              const category = ATTR_CATEGORIES[attr];
              return (
                <motion.div
                  key={attr}
                  className="space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8b949e]">{ATTR_ICONS[attr]}</span>
                      <span className="text-sm text-[#c9d1d9]">{ATTR_FULL_LABELS[attr]}</span>
                      <Badge
                        variant="outline"
                        className={`text-[8px] px-1.5 py-0 border ${CATEGORY_COLORS[category]}`}
                      >
                        {category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: cat.color }}>
                        {cat.label}
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: cat.color }}
                      >
                        <AnimatedNumber value={val} />
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.2, delay: 0.3 + idx * 0.05, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Form Breakdown */}
      {/* ============================================= */}
      {last5Ratings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <Card className="bg-[#161b22]  border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
                  <Flame className="h-3 w-3 text-amber-400" /> Recent Form
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {formTrend === 'improving' && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
                      <TrendingUp className="h-2.5 w-2.5 mr-1" /> Improving
                    </Badge>
                  )}
                  {formTrend === 'declining' && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px]">
                      <TrendingDown className="h-2.5 w-2.5 mr-1" /> Declining
                    </Badge>
                  )}
                  {formTrend === 'stable' && (
                    <Badge className="bg-slate-500/15 text-[#8b949e] border-slate-500/25 text-[10px]">
                      <Minus className="h-2.5 w-2.5 mr-1" /> Stable
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* Last 5 match rating cards */}
              <div className="flex gap-2">
                {last5Ratings.map((rating, i) => (
                  <motion.div
                    key={i}
                    className={`flex-1 rounded-lg border p-2 text-center ${getRatingBg(rating)}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <p
                      className="text-lg font-bold tabular-nums"
                      style={{ color: getRatingColor(rating) }}
                    >
                      {rating.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-[#8b949e] mt-0.5">
                      {i === 0 ? 'Latest' : `${i + 1} ago`}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Best / Worst badges */}
              {bestRating > 0 && (
                <div className="flex gap-3 justify-center">
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1">
                    <Star className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Best</span>
                    <span className="text-xs font-bold text-emerald-300">{bestRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] text-red-400">Worst</span>
                    <span className="text-xs font-bold text-red-300">{worstRating.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Seasonal Rating Trend Line Chart (SVG) */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-emerald-400" /> Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {recentRatings.length > 0 ? (
              <>
                <svg width="100%" height={120} viewBox="0 0 300 120" className="select-none" preserveAspectRatio="xMidYMid meet">
                  {/* Y-axis gridlines + labels */}
                  {[4, 6, 8, 10].map(v => {
                    const y = 110 - ((v - 4) / 6) * 100;
                    return (
                      <g key={v}>
                        <line x1={30} y1={y} x2={290} y2={y} stroke="#30363d" strokeWidth={0.5} opacity={0.4} />
                        <text x={26} y={y + 3} textAnchor="end" className="fill-[#484f58]" fontSize={7}>{v.toFixed(1)}</text>
                      </g>
                    );
                  })}
                  {/* X-axis baseline */}
                  <line x1={30} y1={110} x2={290} y2={110} stroke="#30363d" strokeWidth={0.5} opacity={0.4} />
                  {/* Build data points */}
                  {(() => {
                    const ratings = recentRatings.slice().reverse(); // oldest first
                    const minR = 4;
                    const maxR = 10;
                    const range = maxR - minR;
                    const chartLeft = 35;
                    const chartRight = 285;
                    const chartTop = 10;
                    const chartBottom = 105;
                    const chartW = chartRight - chartLeft;
                    const chartH = chartBottom - chartTop;
                    const pts = ratings.map((r, i) => ({
                      x: chartLeft + (ratings.length > 1 ? (i / (ratings.length - 1)) * chartW : chartW / 2),
                      y: chartBottom - ((r - minR) / range) * chartH,
                      r,
                      i,
                    }));
                    const maxVal = Math.max(...ratings);
                    const hasMultiple = ratings.length > 1;
                    return (
                      <>
                        {/* Area fill underneath */}
                        <polygon
                          points={pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length - 1].x},${chartBottom} ${pts[0].x},${chartBottom}`}
                          fill="rgba(16, 185, 129, 0.08)"
                          stroke="none"
                        />
                        {/* Line */}
                        <polyline
                          points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {/* Dot markers */}
                        {pts.map((p, idx) => {
                          const isMax = p.r === maxVal && hasMultiple;
                          return (
                            <motion.circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r={isMax ? 5 : 3}
                              fill={isMax ? '#f59e0b' : '#10b981'}
                              stroke={isMax ? '#92400e' : '#064e3b'}
                              strokeWidth={1}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 + idx * 0.04 }}
                            />
                          );
                        })}
                        {/* X-axis labels */}
                        {ratings.map((_, i) => {
                          const x = chartLeft + (ratings.length > 1 ? (i / (ratings.length - 1)) * chartW : chartW / 2);
                          return (
                            <text key={i} x={x} y={118} textAnchor="middle" className="fill-[#484f58]" fontSize={7}>
                              {ratings.length - i}
                            </text>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
                <div className="flex justify-between mt-1 text-[9px] text-[#484f58]">
                  <span>← Oldest (Match #{recentRatings.length})</span>
                  <span>Latest (Match 1)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-[#484f58]">
                Play matches to see your rating trend
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Development Gap Analysis */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.22 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <Flame className="h-3 w-3 text-amber-400" /> Development Gap
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {ATTR_KEYS.map((attr, idx) => {
              const val = player.attributes[attr] ?? 0;
              const potVal = potentialValues[ATTR_KEYS.indexOf(attr)] ?? val;
              const gap = Math.max(0, Math.round(potVal - val));
              const gapColor = gap < 5 ? '#10b981' : gap < 15 ? '#f59e0b' : '#ef4444';
              const gapLabel = gap < 5 ? 'Maxed' : gap < 15 ? `${gap} remaining` : `${gap} remaining`;
              return (
                <motion.div
                  key={attr}
                  className="space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.24 + idx * 0.04 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8b949e]">{ATTR_ICONS[attr]}</span>
                      <span className="text-xs text-[#c9d1d9]">{ATTR_FULL_LABELS[attr]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#8b949e] tabular-nums">{val}</span>
                      <span className="text-[9px] text-[#484f58]">→</span>
                      <span className="text-[10px] font-semibold tabular-nums" style={{ color: gapColor }}>{Math.round(potVal)}</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-[#21262d] rounded-lg overflow-hidden">
                    {/* Current value (solid) */}
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-lg"
                      style={{ backgroundColor: getAttributeCategory(val).color, width: `${val}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.3, delay: 0.3 + idx * 0.04, ease: 'easeOut' }}
                    />
                    {/* Potential extension (semi-transparent) */}
                    <motion.div
                      className="absolute top-0 h-full rounded-lg"
                      style={{ backgroundColor: gapColor, opacity: 0.2, left: `${val}%`, width: `${gap}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      transition={{ duration: 0.3, delay: 0.35 + idx * 0.04 }}
                    />
                  </div>
                  <p className="text-[9px] font-medium" style={{ color: gapColor }}>
                    {gapLabel}
                  </p>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Season Comparison */}
      {/* ============================================= */}
      {seasonComparison && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <Card className="bg-[#161b22]  border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
                  <Trophy className="h-3 w-3 text-amber-400" /> Season Comparison
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[9px] text-amber-400 border-amber-500/30 bg-amber-500/10"
                >
                  vs Season {seasonComparison.bestSeason.number}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="space-y-2">
                {seasonComparison.rows.map((row, idx) => {
                  const prev = row.isDecimal ? row.prev.toFixed(1) : row.prev;
                  const curr = row.isDecimal ? row.curr.toFixed(1) : row.curr;
                  const diff = row.curr - row.prev;
                  const isUp = diff > 0;
                  const isDown = diff < 0;
                  const diffStr = row.isDecimal
                    ? Math.abs(diff).toFixed(1)
                    : Math.abs(diff).toString();

                  return (
                    <motion.div
                      key={row.label}
                      className="flex items-center justify-between py-1.5 border-b border-[#30363d] last:border-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + idx * 0.06 }}
                    >
                      <span className="text-xs text-[#8b949e] w-20">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#8b949e] tabular-nums">{prev}</span>
                        <span className="text-[#30363d]">→</span>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isUp
                              ? 'text-emerald-400'
                              : isDown
                              ? 'text-red-400'
                              : 'text-[#c9d1d9]'
                          }`}
                        >
                          {curr}
                        </span>
                        {isUp && (
                          <span className="flex items-center text-emerald-400">
                            <ArrowUp className="h-3 w-3" />
                            <span className="text-[10px] tabular-nums">{diffStr}</span>
                          </span>
                        )}
                        {isDown && (
                          <span className="flex items-center text-red-400">
                            <ArrowDown className="h-3 w-3" />
                            <span className="text-[10px] tabular-nums">{diffStr}</span>
                          </span>
                        )}
                        {!isUp && !isDown && (
                          <Minus className="h-3 w-3 text-[#484f58]" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Milestone Tracker */}
      {/* ============================================= */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.35 }}
        >
          <motion.div
            animate={milestones.some(m => Math.min(100, Math.round((m.current / m.target) * 100)) >= 100) ? { borderColor: ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.08)', 'rgba(16,185,129,0.3)'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-lg"
          >
          <Card className={`bg-[#161b22]  border-[#30363d] ${milestones.some(m => Math.min(100, Math.round((m.current / m.target) * 100)) >= 100) ? 'border-emerald-500/30' : ''}`}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
                <Target className="h-3 w-3 text-emerald-400" /> Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {milestones.map((m, idx) => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                const isRatingMilestone = m.target >= 700;
                const displayCurrent = isRatingMilestone
                  ? (m.current / 100).toFixed(1)
                  : m.current.toString();
                const displayTarget = isRatingMilestone
                  ? (m.target / 100).toFixed(1)
                  : m.target.toString();

                return (
                  <motion.div
                    key={m.label}
                    className="space-y-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.08 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={m.color}>{m.icon}</span>
                        <span className="text-xs text-[#c9d1d9]">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#8b949e] tabular-nums">
                          {displayCurrent}
                        </span>
                        <span className="text-[10px] text-[#484f58]">/</span>
                        <span className="text-[10px] font-semibold text-[#8b949e] tabular-nums">
                          {displayTarget}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.2, delay: 0.5 + idx * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                      {pct >= 100 && (
                        <motion.div
                          className="absolute -right-1 -top-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: 'spring', delay: 0.7 }}
                        >
                          <Award className="h-4 w-4 text-emerald-400" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-[9px] text-[#484f58]">
                      {pct >= 100
                        ? 'Achieved! ✓'
                        : `${100 - pct}% remaining`}
                    </p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Season Stats with Animated Counters */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] ">
              Season Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  <AnimatedNumber value={player.seasonStats.goals} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Goals</p>
              </motion.div>
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xl font-bold text-blue-400 tabular-nums">
                  <AnimatedNumber value={player.seasonStats.assists} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Assists</p>
              </motion.div>
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <p className="text-xl font-bold text-amber-400 tabular-nums">
                  <AnimatedNumber value={player.seasonStats.appearances} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Apps</p>
              </motion.div>
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.seasonStats.starts} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Starts</p>
              </motion.div>
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
              >
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.seasonStats.cleanSheets} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Clean Sheets</p>
              </motion.div>
              <motion.div
                className="bg-[#21262d]  rounded-lg p-2.5 border border-[#30363d]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-lg font-bold text-red-400 tabular-nums">
                  <AnimatedNumber
                    value={player.seasonStats.yellowCards + player.seasonStats.redCards}
                  />
                </p>
                <p className="text-[10px] text-[#8b949e]">Cards</p>
              </motion.div>
            </div>

            {/* Avg Rating */}
            {player.seasonStats.averageRating > 0 && (
              <motion.div
                className="mt-3 bg-[#21262d]  rounded-lg p-3 border border-[#30363d] flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
              >
                <span className="text-xs text-[#8b949e]">Average Rating</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: getRatingColor(player.seasonStats.averageRating) }}
                  >
                    {player.seasonStats.averageRating.toFixed(1)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[8px] ${
                      player.seasonStats.averageRating >= 7.0
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : player.seasonStats.averageRating >= 6.0
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : 'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    {player.seasonStats.averageRating >= 8.0
                      ? 'Excellent'
                      : player.seasonStats.averageRating >= 7.0
                      ? 'Good'
                      : player.seasonStats.averageRating >= 6.0
                      ? 'Average'
                      : 'Poor'}
                  </Badge>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Career Stats Summary */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.45 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <Award className="h-3 w-3 text-purple-400" /> Career Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.careerStats.totalGoals} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Career Goals</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.careerStats.totalAssists} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Career Assists</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.careerStats.totalAppearances} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Career Apps</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-[#c9d1d9] tabular-nums">
                  <AnimatedNumber value={player.careerStats.seasonsPlayed} />
                </p>
                <p className="text-[10px] text-[#8b949e]">Seasons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Performance Heatmap (7 days × 5 time slots) */}
      {/* ============================================= */}
      {heatmapData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Flame className="h-3 w-3 text-amber-400" /> Performance Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex justify-center">
                <svg width={310} height={200} viewBox="0 0 310 200" className="select-none">
                  {/* Time-of-day labels (top) */}
                  {['Dawn', 'AM', 'Noon', 'PM', 'Night'].map((label, t) => (
                    <text
                      key={label}
                      x={55 + t * 44}
                      y={14}
                      textAnchor="middle"
                      className="fill-[#484f58]"
                      fontSize={8}
                    >
                      {label}
                    </text>
                  ))}
                  {/* Day-of-week labels + grid cells */}
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, d) => {
                    const rowY = 24 + d * 24;
                    return (
                      <g key={day}>
                        <text
                          x={30}
                          y={rowY + 14}
                          textAnchor="end"
                          className="fill-[#484f58]"
                          fontSize={9}
                          fontWeight={d >= 5 ? 700 : 400}
                          fill={d >= 5 ? '#8b949e' : '#484f58'}
                        >
                          {day}
                        </text>
                        {heatmapData[d].map((val, t) => {
                          // Color: dark red=poor, amber=average, emerald=excellent
                          let fillColor: string;
                          if (val >= 0.7) fillColor = '#059669'; // emerald
                          else if (val >= 0.55) fillColor = '#10b981';
                          else if (val >= 0.45) fillColor = '#f59e0b'; // amber
                          else if (val >= 0.35) fillColor = '#f97316';
                          else fillColor = '#dc2626'; // red
                          const opacity = 0.25 + val * 0.55;
                          return (
                            <rect
                              key={t}
                              x={42 + t * 44}
                              y={rowY}
                              width={38}
                              height={20}
                              rx={4}
                              fill={fillColor}
                              opacity={opacity}
                              stroke="#21262d"
                              strokeWidth={0.5}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                  {/* Legend */}
                  <g>
                    <text x={55} y={198} className="fill-[#484f58]" fontSize={7}>Poor</text>
                    <rect x={78} y={191} width={12} height={8} rx={2} fill="#dc2626" opacity={0.45} />
                    <rect x={94} y={191} width={12} height={8} rx={2} fill="#f97316" opacity={0.5} />
                    <rect x={110} y={191} width={12} height={8} rx={2} fill="#f59e0b" opacity={0.55} />
                    <rect x={126} y={191} width={12} height={8} rx={2} fill="#10b981" opacity={0.6} />
                    <rect x={142} y={191} width={12} height={8} rx={2} fill="#059669" opacity={0.65} />
                    <text x={160} y={198} className="fill-[#484f58]" fontSize={7}>Excellent</text>
                  </g>
                </svg>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Attribute Comparison Spider Chart (vs League Avg) */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.52 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-400" /> vs League Average
              </CardTitle>
              {/* Legend */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 bg-emerald-500 opacity-80" />
                  <span className="text-[8px] text-[#8b949e]">You</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 bg-sky-500 opacity-50" />
                  <span className="text-[8px] text-[#8b949e]">League</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3 flex justify-center">
            <svg
              width={200}
              height={200}
              viewBox="0 0 200 200"
              className="select-none"
            >
              {/* Grid hexagons */}
              {[20, 40, 60, 80, 100].map(level => {
                const r = (level / 100) * 75;
                const cx = 100;
                const cy = 100;
                const pts = ATTR_KEYS.map((_, i) => {
                  const angle = -Math.PI / 2 + (2 * Math.PI * i) / 6;
                  return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                }).join(' ');
                return (
                  <polygon
                    key={level}
                    points={pts}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={0.4}
                    opacity={0.4}
                  />
                );
              })}
              {/* Axis lines */}
              {ATTR_KEYS.map((_, i) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * i) / 6;
                return (
                  <line
                    key={i}
                    x1={100}
                    y1={100}
                    x2={100 + 75 * Math.cos(angle)}
                    y2={100 + 75 * Math.sin(angle)}
                    stroke="#334155"
                    strokeWidth={0.4}
                    opacity={0.3}
                  />
                );
              })}
              {/* League average polygon (sky, lower opacity) */}
              <polygon
                points={leagueAverageValues.map((v, i) => {
                  const angle = -Math.PI / 2 + (2 * Math.PI * i) / 6;
                  const r = (v / 100) * 75;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(14, 165, 233, 0.1)"
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="3 2"
                opacity={0.6}
              />
              {/* Player polygon (emerald, higher opacity) */}
              <motion.polygon
                points={attrValues.map((v, i) => {
                  const angle = -Math.PI / 2 + (2 * Math.PI * i) / 6;
                  const r = (v / 100) * 75;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10b981"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              />
              {/* Labels with comparison values */}
              {ATTR_KEYS.map((key, i) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * i) / 6;
                const labelR = 88;
                const lx = 100 + labelR * Math.cos(angle);
                const ly = 100 + labelR * Math.sin(angle);
                const val = player.attributes[key] ?? 0;
                const leagueVal = leagueAverageValues[i];
                const diff = val - leagueVal;
                return (
                  <g key={key}>
                    <text
                      x={lx}
                      y={ly - 2}
                      textAnchor="middle"
                      className="fill-[#8b949e]"
                      fontSize={7}
                      fontWeight={600}
                    >
                      {ATTR_LABELS[key]}
                    </text>
                    <text
                      x={lx}
                      y={ly + 8}
                      textAnchor="middle"
                      fill={diff >= 0 ? '#10b981' : '#ef4444'}
                      fontSize={8}
                      fontWeight={700}
                    >
                      {diff >= 0 ? '+' : ''}{diff}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* Season Trend Charts (3 mini charts) */}
      {/* ============================================= */}
      {seasonTrendData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.54 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <BarChart3 className="h-3 w-3 text-emerald-400" /> Season Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-4">
              {/* Mini Chart Helper: renders a small sparkline */}
              {([
                {
                  title: 'Goals / Month',
                  data: seasonTrendData.goalsPerMonth,
                  color: '#10b981',
                  areaColor: 'rgba(16, 185, 129, 0.1)',
                  format: (v: number) => v.toFixed(1),
                  currentVal: seasonTrendData.goalsPerMonth[seasonTrendData.goalsPerMonth.length - 1],
                },
                {
                  title: 'Avg Rating',
                  data: seasonTrendData.avgRatingTrend,
                  color: '#0ea5e9',
                  areaColor: 'rgba(14, 165, 233, 0.1)',
                  format: (v: number) => v.toFixed(1),
                  currentVal: seasonTrendData.avgRatingTrend[seasonTrendData.avgRatingTrend.length - 1],
                },
                {
                  title: 'Minutes Played',
                  data: seasonTrendData.minutesPlayed,
                  color: '#f59e0b',
                  areaColor: 'rgba(245, 158, 11, 0.1)',
                  format: (v: number) => Math.round(v).toString(),
                  currentVal: seasonTrendData.minutesPlayed[seasonTrendData.minutesPlayed.length - 1],
                },
              ] as const).map((chart, ci) => {
                const data = chart.data;
                const maxV = Math.max(...data, 0.01);
                const minV = Math.min(...data, 0);
                const rangeV = maxV - minV || 1;
                const cLeft = 30;
                const cRight = 170;
                const cTop = 5;
                const cBottom = 30;
                const cW = cRight - cLeft;
                const cH = cBottom - cTop;
                const pts = data.map((v, i) => ({
                  x: cLeft + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2),
                  y: cBottom - ((v - minV) / rangeV) * cH,
                }));
                const lastPt = pts[pts.length - 1];
                return (
                  <div key={ci}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#8b949e] font-medium">{chart.title}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: chart.color }}>
                        {chart.format(chart.currentVal)}
                      </span>
                    </div>
                    <svg width="100%" height={40} viewBox="0 0 200 40" className="select-none" preserveAspectRatio="xMidYMid meet">
                      {/* Gridline */}
                      <line x1={cLeft} y1={cBottom} x2={cRight} y2={cBottom} stroke="#30363d" strokeWidth={0.3} opacity={0.4} />
                      {/* Area fill */}
                      <polygon
                        points={pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length - 1].x},${cBottom} ${pts[0].x},${cBottom}`}
                        fill={chart.areaColor}
                        stroke="none"
                      />
                      {/* Line */}
                      <polyline
                        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={chart.color}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* Highlight current dot */}
                      <circle
                        cx={lastPt.x}
                        cy={lastPt.y}
                        r={3}
                        fill={chart.color}
                        stroke="#161b22"
                        strokeWidth={1.5}
                      />
                      {/* Month labels */}
                      {seasonTrendData.months.map((m, i) => {
                        const x = cLeft + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2);
                        return (
                          <text
                            key={m}
                            x={x}
                            y={38}
                            textAnchor="middle"
                            className="fill-[#484f58]"
                            fontSize={5}
                          >
                            {m}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Strengths & Weaknesses Cards */}
      {/* ============================================= */}
      {strengthsWeaknesses && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.56 }}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Strengths */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2.5">
                {strengthsWeaknesses.strengths.map((s, i) => (
                  <motion.div
                    key={s.key}
                    className="space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8b949e]">{s.icon}</span>
                        <span className="text-[11px] text-[#c9d1d9]">{s.label}</span>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[9px] px-1.5 py-0 h-4">
                        {s.value}
                      </Badge>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.value}%` }}
                        transition={{ duration: 0.3, delay: 0.65 + i * 0.06, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] text-red-400 flex items-center gap-1.5">
                  <TrendingDown className="h-3 w-3" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2.5">
                {strengthsWeaknesses.weaknesses.map((w, i) => {
                  const suggestions: Record<string, string> = {
                    pace: 'Sprint drills & agility work',
                    shooting: 'Target practice & finishing',
                    passing: 'Short-pass repetition drills',
                    dribbling: 'Cone drills & close control',
                    defending: 'Positioning & tackle timing',
                    physical: 'Strength & stamina training',
                  };
                  return (
                    <motion.div
                      key={w.key}
                      className="space-y-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.06 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#8b949e]">{w.icon}</span>
                          <span className="text-[11px] text-[#c9d1d9]">{w.label}</span>
                        </div>
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[9px] px-1.5 py-0 h-4">
                          {w.value}
                        </Badge>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${w.value}%` }}
                          transition={{ duration: 0.3, delay: 0.65 + i * 0.06, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-[8px] text-[#484f58] leading-tight">
                        {suggestions[w.key] || 'Focus training here'}
                      </p>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Development Trajectory (Area Chart + Confidence Band) */}
      {/* ============================================= */}
      {developmentTrajectory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.58 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-purple-400" /> Development Trajectory
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[9px] text-purple-400 border-purple-500/30 bg-purple-500/10"
                >
                  Next 2 Seasons
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <svg width="100%" height={130} viewBox="0 0 320 130" className="select-none" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const { projected, upperBound, lowerBound, numPoints, currentOverall, potential } = developmentTrajectory;
                  const cLeft = 35;
                  const cRight = 305;
                  const cTop = 8;
                  const cBottom = 105;
                  const cW = cRight - cLeft;
                  const cH = cBottom - cTop;
                  const yMin = currentOverall - 5;
                  const yMax = potential + 5;
                  const yRange = yMax - yMin || 1;
                  const toX = (i: number) => cLeft + (i / (numPoints - 1)) * cW;
                  const toY = (v: number) => cBottom - ((v - yMin) / yRange) * cH;

                  // Build confidence band polygon
                  const upperPts = upperBound.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ');
                  const lowerPts = lowerBound.map(p => `${toX(p.x)},${toY(p.y)}`).reverse().join(' ');
                  const bandPoints = upperPts + ' ' + lowerPts;

                  // Build area polygon
                  const areaPoints = projected.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ')
                    + ` ${toX(projected[projected.length - 1].x)},${cBottom}`
                    + ` ${toX(projected[0].x)},${cBottom}`;

                  const linePoints = projected.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ');

                  return (
                    <>
                      {/* Y-axis gridlines + labels */}
                      {[Math.ceil(yMin / 5) * 5, Math.ceil(yMin / 5) * 5 + 5, Math.ceil(yMin / 5) * 5 + 10].filter(v => v <= yMax && v >= yMin).map(v => {
                        const y = toY(v);
                        return (
                          <g key={v}>
                            <line x1={cLeft} y1={y} x2={cRight} y2={y} stroke="#30363d" strokeWidth={0.3} opacity={0.4} />
                            <text x={cLeft - 4} y={y + 3} textAnchor="end" className="fill-[#484f58]" fontSize={7}>{v}</text>
                          </g>
                        );
                      })}

                      {/* Baseline */}
                      <line x1={cLeft} y1={cBottom} x2={cRight} y2={cBottom} stroke="#30363d" strokeWidth={0.3} opacity={0.4} />

                      {/* Confidence band (lower opacity area) */}
                      <polygon
                        points={bandPoints}
                        fill="rgba(168, 85, 247, 0.08)"
                        stroke="none"
                      />

                      {/* Projected area fill */}
                      <polygon
                        points={areaPoints}
                        fill="rgba(168, 85, 247, 0.12)"
                        stroke="none"
                      />

                      {/* Projected line */}
                      <polyline
                        points={linePoints}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />

                      {/* Current point */}
                      <circle
                        cx={toX(0)}
                        cy={toY(projected[0].y)}
                        r={4}
                        fill="#a855f7"
                        stroke="#161b22"
                        strokeWidth={2}
                      />
                      {/* Current label */}
                      <text
                        x={toX(0)}
                        y={toY(projected[0].y) - 8}
                        textAnchor="middle"
                        fill="#c084fc"
                        fontSize={8}
                        fontWeight={700}
                      >
                        OVR {currentOverall}
                      </text>

                      {/* End point (projected) */}
                      <circle
                        cx={toX(numPoints - 1)}
                        cy={toY(projected[projected.length - 1].y)}
                        r={3}
                        fill="#a855f7"
                        stroke="#161b22"
                        strokeWidth={1.5}
                        opacity={0.7}
                      />

                      {/* Potential ceiling line */}
                      <line
                        x1={cLeft}
                        y1={toY(potential)}
                        x2={cRight}
                        y2={toY(potential)}
                        stroke="#f59e0b"
                        strokeWidth={0.8}
                        strokeDasharray="4 3"
                        opacity={0.4}
                      />
                      <text
                        x={cRight}
                        y={toY(potential) - 4}
                        textAnchor="end"
                        fill="#f59e0b"
                        fontSize={7}
                        opacity={0.6}
                      >
                        Potential {potential}
                      </text>

                      {/* X-axis season labels */}
                      <text x={cLeft} y={118} textAnchor="middle" className="fill-[#484f58]" fontSize={7}>Now</text>
                      <text x={toX(Math.floor(numPoints / 2))} y={118} textAnchor="middle" className="fill-[#484f58]" fontSize={7}>+1 Season</text>
                      <text x={cRight} y={118} textAnchor="middle" className="fill-[#484f58]" fontSize={7}>+2 Seasons</text>

                      {/* Legend */}
                      <g>
                        <line x1={cLeft} y1={127} x2={cLeft + 16} y2={127} stroke="#a855f7" strokeWidth={1.5} />
                        <text x={cLeft + 20} y={129} className="fill-[#484f58]" fontSize={6}>Projected</text>
                        <rect x={cLeft + 60} y={124} width={10} height={6} rx={1} fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth={0.3} />
                        <text x={cLeft + 74} y={129} className="fill-[#484f58]" fontSize={6}>Confidence</text>
                      </g>
                    </>
                  );
                })()}
              </svg>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Advanced Metrics Dashboard */}
      {/* ============================================= */}
      {advancedMetrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-emerald-400" /> Advanced Metrics
                </CardTitle>
                <Badge className="bg-[#21262d] text-[#8b949e] border-[#30363d] text-[9px]">
                  vs League Avg
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {advancedMetrics.map((m, idx) => {
                const isAbove = m.gauge || m.circular
                  ? m.value >= m.leagueAvg
                  : parseFloat(String(m.value)) >= m.leagueAvg;
                return (
                  <motion.div
                    key={m.label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 + idx * 0.04 }}
                  >
                    {/* Label + value */}
                    <div className="w-28 shrink-0">
                      <p className="text-[10px] text-[#8b949e]">{m.label}</p>
                      <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">
                        {typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value}{m.unit}
                      </p>
                    </div>

                    {/* SVG gauge for xG / xA */}
                    {m.gauge && (
                      <svg width={56} height={28} viewBox="0 0 56 28" className="shrink-0">
                        <path d="M 6 24 A 22 22 0 0 1 50 24" fill="none" stroke="#30363d" strokeWidth={3} strokeLinecap="round" />
                        <motion.path
                          d="M 6 24 A 22 22 0 0 1 50 24"
                          fill="none"
                          stroke={isAbove ? '#34d399' : '#f59e0b'}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeDasharray="69.12"
                          initial={{ strokeDashoffset: 69.12 }}
                          animate={{ strokeDashoffset: 69.12 - (Math.min(parseFloat(String(m.value)) / Math.max(0.01, m.leagueAvg * 2), 1) * 69.12) }}
                          transition={{ duration: 0.3, delay: 0.7 + idx * 0.04 }}
                        />
                        <text x={28} y={22} textAnchor="middle" fill="#8b949e" fontSize={6}>
                          Avg: {m.leagueAvg}
                        </text>
                      </svg>
                    )}

                    {/* Circular progress for Pass Comp */}
                    {m.circular && (() => {
                      const pct = m.value as number;
                      const r = 10;
                      const circ = 2 * Math.PI * r;
                      const offset = circ - (pct / 100) * circ;
                      return (
                        <svg width={28} height={28} viewBox="0 0 28 28" className="shrink-0">
                          <circle cx={14} cy={14} r={r} fill="none" stroke="#30363d" strokeWidth={2.5} />
                          <g transform="rotate(-90 14 14)">
                            <motion.circle
                              cx={14} cy={14} r={r}
                              fill="none"
                              stroke={pct >= 80 ? '#34d399' : pct >= 65 ? '#f59e0b' : '#ef4444'}
                              strokeWidth={2.5}
                              strokeLinecap="round"
                              strokeDasharray={circ}
                              initial={{ strokeDashoffset: circ }}
                              animate={{ strokeDashoffset: offset }}
                              transition={{ duration: 0.3, delay: 0.7 + idx * 0.04 }}
                            />
                          </g>
                        </svg>
                      );
                    })()}

                    {/* Bar for Key Passes */}
                    {m.bar && (
                      <svg width={56} height={20} viewBox="0 0 56 20" className="shrink-0">
                        <rect x={0} y={4} width={56} height={12} rx={3} fill="#21262d" />
                        <motion.rect
                          x={0} y={4}
                          width={Math.min(56, (parseFloat(String(m.value)) / Math.max(0.01, m.leagueAvg * 2)) * 56)}
                          height={12} rx={3}
                          fill={isAbove ? '#34d399' : '#f59e0b'}
                          initial={{ width: 0 }}
                          animate={{ width: Math.min(56, (parseFloat(String(m.value)) / Math.max(0.01, m.leagueAvg * 2)) * 56) }}
                          transition={{ duration: 0.3, delay: 0.7 + idx * 0.04 }}
                        />
                        <line x1={(m.leagueAvg / Math.max(0.01, m.leagueAvg * 2)) * 56} y1={3} x2={(m.leagueAvg / Math.max(0.01, m.leagueAvg * 2)) * 56} y2={17} stroke="#8b949e" strokeWidth={0.8} strokeDasharray="2 1" />
                      </svg>
                    )}

                    {/* Horizontal bars for Dribble/Aerial */}
                    {m.hBar && (
                      <svg width={56} height={20} viewBox="0 0 56 20" className="shrink-0">
                        <rect x={0} y={4} width={56} height={12} rx={3} fill="#21262d" />
                        <motion.rect
                          x={0} y={4}
                          width={((m.value as number) / 100) * 56}
                          height={12} rx={3}
                          fill={isAbove ? '#34d399' : '#f59e0b'}
                          initial={{ width: 0 }}
                          animate={{ width: ((m.value as number) / 100) * 56 }}
                          transition={{ duration: 0.3, delay: 0.7 + idx * 0.04 }}
                        />
                        <line x1={(m.leagueAvg / 100) * 56} y1={3} x2={(m.leagueAvg / 100) * 56} y2={17} stroke="#8b949e" strokeWidth={0.8} strokeDasharray="2 1" />
                      </svg>
                    )}

                    {/* Sparkline for Pressures */}
                    {m.sparkline && (() => {
                      const pts: number[] = [3, 5, 7, 4, 8, 6, 9, parseFloat(String(m.value))];
                      const max = Math.max(...pts, 1);
                      const min = Math.min(...pts, 0);
                      const range = max - min || 1;
                      return (
                        <svg width={56} height={20} viewBox="0 0 56 20" className="shrink-0">
                          <polyline
                            points={pts.map((v, i) => `${(i / (pts.length - 1)) * 54 + 1},${18 - ((v - min) / range) * 15}`).join(' ')}
                            fill="none"
                            stroke={isAbove ? '#34d399' : '#f59e0b'}
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line x1={0} y1={18} x2={56} y2={18} stroke="#30363d" strokeWidth={0.3} />
                        </svg>
                      );
                    })()}

                    {/* Trend line for Progressive Passes */}
                    {m.trend && (() => {
                      const pts: number[] = [2, 4, 3, 5, 6, 4, 7, m.value as number];
                      const max = Math.max(...pts, 1);
                      const min = Math.min(...pts, 0);
                      const range = max - min || 1;
                      return (
                        <svg width={56} height={20} viewBox="0 0 56 20" className="shrink-0">
                          <polygon
                            points={pts.map((v, i) => `${(i / (pts.length - 1)) * 54 + 1},${18 - ((v - min) / range) * 15}`).join(' ') + ` 55,18 1,18`}
                            fill="rgba(59, 130, 246, 0.15)"
                            stroke="none"
                          />
                          <polyline
                            points={pts.map((v, i) => `${(i / (pts.length - 1)) * 54 + 1},${18 - ((v - min) / range) * 15}`).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx={55} cy={18 - ((pts[pts.length - 1] - min) / range) * 15} r={2.5} fill="#3b82f6" stroke="#161b22" strokeWidth={1} />
                        </svg>
                      );
                    })()}

                    {/* Badge */}
                    <Badge
                      className={`text-[8px] px-1.5 py-0 border ${
                        isAbove
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isAbove ? 'Above Avg' : 'Below Avg'}
                    </Badge>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Season-by-Season Breakdown Chart */}
      {/* ============================================= */}
      {seasonBreakdown && seasonBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.62 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Trophy className="h-3 w-3 text-amber-400" /> Season-by-Season Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <svg width="100%" height={180} viewBox="0 0 320 180" className="select-none" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const data = seasonBreakdown;
                  const cLeft = 35;
                  const cRight = 310;
                  const cTop = 10;
                  const cBottom = 145;
                  const cW = cRight - cLeft;
                  const cH = cBottom - cTop;
                  const groupW = cW / data.length;
                  const barW = Math.max(3, groupW / 7 - 1);
                  const statKeys = ['goals', 'assists', 'appearances', 'avgRating', 'cleanSheets', 'motm'] as const;
                  const statColors = ['#34d399', '#3b82f6', '#a78bfa', '#f59e0b', '#ef4444', '#ec4899'];
                  const statLabels = ['Goals', 'Assists', 'Apps', 'Avg Rat', 'CS', 'MotM'];
                  const maxVals: number[] = [];
                  for (const sk of statKeys) {
                    const vals = data.map(d => sk === 'avgRating' ? d[sk] * 10 : d[sk] as number);
                    maxVals.push(Math.max(...vals, 1));
                  }
                  const globalMax = Math.max(...maxVals, 1);

                  return (
                    <>
                      {/* Gridlines */}
                      {[0, 0.25, 0.5, 0.75, 1].map(f => {
                        const y = cBottom - f * cH;
                        return (
                          <g key={f}>
                            <line x1={cLeft} y1={y} x2={cRight} y2={y} stroke="#30363d" strokeWidth={0.3} opacity={0.4} />
                            <text x={cLeft - 4} y={y + 3} textAnchor="end" className="fill-[#484f58]" fontSize={6}>
                              {Math.round(f * globalMax)}
                            </text>
                          </g>
                        );
                      })}
                      {/* Baseline */}
                      <line x1={cLeft} y1={cBottom} x2={cRight} y2={cBottom} stroke="#30363d" strokeWidth={0.4} />

                      {/* Bars per season */}
                      {data.map((season, si) => {
                        const gx = cLeft + si * groupW + groupW / 2;
                        return statKeys.map((sk, bi) => {
                          const rawVal = sk === 'avgRating' ? season[sk] * 10 : season[sk] as number;
                          const normVal = rawVal / globalMax;
                          const bh = normVal * cH;
                          const bx = gx - (statKeys.length * (barW + 1)) / 2 + bi * (barW + 1);
                          return (
                            <rect
                              key={`${si}-${bi}`}
                              x={bx}
                              y={cBottom - bh}
                              width={barW}
                              height={bh}
                              rx={1.5}
                              fill={statColors[bi]}
                              opacity={0.8}
                            />
                          );
                        });
                      })}

                      {/* Season labels */}
                      {data.map((season, si) => {
                        const gx = cLeft + si * groupW + groupW / 2;
                        return (
                          <text key={si} x={gx} y={cBottom + 12} textAnchor="middle" className="fill-[#8b949e]" fontSize={7} fontWeight={600}>
                            S{season.number}
                          </text>
                        );
                      })}

                      {/* Legend */}
                      {statLabels.map((label, i) => (
                        <g key={label}>
                          <rect x={cLeft + i * 45} y={166} width={8} height={6} rx={1.5} fill={statColors[i]} opacity={0.8} />
                          <text x={cLeft + i * 45 + 11} y={172} className="fill-[#484f58]" fontSize={6}>{label}</text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Performance Radar Breakdown (8-axis) */}
      {/* ============================================= */}
      {performanceRadar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.64 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                  <Zap className="h-3 w-3 text-purple-400" /> Growth Radar
                </CardTitle>
                <Badge
                  className={`text-[9px] px-1.5 py-0 border ${
                    performanceRadar.overallGrowth >= 15
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                      : performanceRadar.overallGrowth >= 5
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      : 'bg-red-500/15 text-red-400 border-red-500/25'
                  }`}
                >
                  +{performanceRadar.overallGrowth}% Growth
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 bg-emerald-500 opacity-80" />
                  <span className="text-[8px] text-[#8b949e]">Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1.5 bg-[#484f58] opacity-60" />
                  <span className="text-[8px] text-[#8b949e]">Debut</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3 flex justify-center">
              <svg width={260} height={260} viewBox="0 0 260 260" className="select-none">
                {(() => {
                  const cx = 130;
                  const cy = 130;
                  const R = 100;
                  const numAxes = 8;
                  const aOff = -Math.PI / 2;
                  const getA = (i: number) => aOff + (2 * Math.PI * i) / numAxes;
                  const getR = (i: number, v: number) => {
                    const a = getA(i);
                    const r = (v / 100) * R;
                    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
                  };
                  const poly = (vals: number[]) => vals.map((v, i) => { const p = getR(i, v); return `${p.x},${p.y}`; }).join(' ');

                  return (
                    <>
                      {/* Grid polygons */}
                      {[20, 40, 60, 80, 100].map(level => (
                        <polygon key={level} points={poly(Array(8).fill(level))} fill="none" stroke="#334155" strokeWidth={0.4} opacity={0.4} />
                      ))}
                      {/* Axes */}
                      {Array.from({ length: 8 }, (_, i) => {
                        const a = getA(i);
                        return (
                          <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="#334155" strokeWidth={0.4} opacity={0.3} />
                        );
                      })}
                      {/* Debut polygon */}
                      <polygon
                        points={poly(performanceRadar.debut)}
                        fill="rgba(72, 79, 88, 0.12)"
                        stroke="#484f58"
                        strokeWidth={1.2}
                        strokeDasharray="3 2"
                        opacity={0.6}
                      />
                      {/* Current polygon */}
                      <motion.polygon
                        points={poly(performanceRadar.current)}
                        fill="rgba(52, 211, 153, 0.15)"
                        stroke="#34d399"
                        strokeWidth={2}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                      />
                      {/* Labels */}
                      {performanceRadar.keys.map((label, i) => {
                        const a = getA(i);
                        const lx = cx + (R + 16) * Math.cos(a);
                        const ly = cy + (R + 16) * Math.sin(a);
                        const cur = performanceRadar.current[i];
                        const deb = performanceRadar.debut[i];
                        const delta = cur - deb;
                        return (
                          <g key={label}>
                            <text x={lx} y={ly - 2} textAnchor="middle" className="fill-[#8b949e]" fontSize={7} fontWeight={600}>
                              {label}
                            </text>
                            <text x={lx} y={ly + 8} textAnchor="middle" fill={delta >= 0 ? '#34d399' : '#ef4444'} fontSize={8} fontWeight={700}>
                              {delta >= 0 ? '+' : ''}{delta}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </CardContent>
            {/* Stats table */}
            <div className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-1 text-center">
                {performanceRadar.keys.map((key, i) => {
                  const cur = performanceRadar.current[i];
                  const deb = performanceRadar.debut[i];
                  const delta = cur - deb;
                  return (
                    <div key={key} className="bg-[#21262d] rounded-lg p-1.5">
                      <p className="text-[8px] text-[#8b949e]">{key}</p>
                      <p className="text-xs font-bold text-[#c9d1d9] tabular-nums">{cur}</p>
                      <p className={`text-[8px] tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Clutch Performance Tracker */}
      {/* ============================================= */}
      {clutchData && clutchData.clutchMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.66 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                  <Flame className="h-3 w-3 text-red-400" /> Clutch Performances
                </CardTitle>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < clutchData.stars ? 'text-amber-400' : 'text-[#30363d]'}`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* Summary stats row */}
              <div className="grid grid-cols-4 gap-2">
                {([
                  { label: 'Clutch Goals', value: clutchData.clutchGoals, color: '#34d399' },
                  { label: 'Clutch Assists', value: clutchData.clutchAssists, color: '#3b82f6' },
                  { label: 'Late Goals (75\'+)', value: clutchData.lateGoals, color: '#f59e0b' },
                  { label: 'Match Winners', value: clutchData.matchWinningGoals, color: '#a78bfa' },
                ] as const).map((stat) => (
                  <div key={stat.label} className="bg-[#21262d] rounded-lg p-2 text-center border border-[#30363d]">
                    <p className="text-base font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[8px] text-[#8b949e] leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Clutch Rating */}
              {clutchData.clutchRating > 0 && (
                <div className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d] flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">Clutch Rating</span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: getRatingColor(clutchData.clutchRating) }}
                  >
                    {clutchData.clutchRating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* SVG Timeline */}
              <svg width="100%" height={36} viewBox="0 0 300 36" className="select-none" preserveAspectRatio="xMidYMid meet">
                {/* Timeline line */}
                <line x1={10} y1={18} x2={290} y2={18} stroke="#30363d" strokeWidth={1} />
                {clutchData.clutchMatches.map((m, i) => {
                  const total = Math.max(clutchData.clutchMatches.length, 1);
                  const x = 10 + (i / Math.max(total - 1, 1)) * 280;
                  const dotColor = m.type === 'late_goal' ? '#ef4444' : m.type === 'motm' ? '#a78bfa' : '#34d399';
                  return (
                    <g key={i}>
                      <circle cx={x} cy={18} r={5} fill={dotColor} opacity={0.8} stroke="#161b22" strokeWidth={1.5} />
                      <text x={x} y={10} textAnchor="middle" fill="#8b949e" fontSize={5}>Wk{m.week}</text>
                      <text x={x} y={32} textAnchor="middle" fill={dotColor} fontSize={6} fontWeight={600}>{m.rating.toFixed(1)}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Top 3 performances */}
              {clutchData.top3.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] text-[#484f58] font-semibold">Top Clutch Performances</p>
                  {clutchData.top3.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#21262d] rounded-lg px-2.5 py-1.5 border border-[#30363d]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-amber-400">#{i + 1}</span>
                        <span className="text-[10px] text-[#8b949e]">Week {m.week}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.goals > 0 && <span className="text-[9px] text-emerald-400">{m.goals}G</span>}
                        {m.assists > 0 && <span className="text-[9px] text-blue-400">{m.assists}A</span>}
                        <span className="text-xs font-bold tabular-nums" style={{ color: getRatingColor(m.rating) }}>{m.rating.toFixed(1)}</span>
                        <Badge className={`text-[7px] px-1 py-0 border ${
                          m.type === 'late_goal' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          m.type === 'motm' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {m.type === 'late_goal' ? 'Late Goal' : m.type === 'motm' ? 'MotM' : '8+ Rating'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Opponent Analysis Grid */}
      {/* ============================================= */}
      {opponentAnalysis && opponentAnalysis.some(o => o.apps > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.68 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-400" /> Opponent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-1.5">
                {opponentAnalysis.map((opp) => {
                  const ratingColor = opp.rating >= 7.0 ? 'border-emerald-500/25 bg-emerald-500/5' : opp.rating >= 6.0 ? 'border-amber-500/25 bg-amber-500/5' : opp.apps > 0 ? 'border-red-500/25 bg-red-500/5' : 'border-[#30363d] bg-[#21262d]';
                  const textColor = opp.rating >= 7.0 ? 'text-emerald-400' : opp.rating >= 6.0 ? 'text-amber-400' : opp.apps > 0 ? 'text-red-400' : 'text-[#484f58]';
                  return (
                    <div key={opp.label} className={`rounded-lg border p-2 ${ratingColor} ${opp.apps === 0 ? 'opacity-40' : ''}`}>
                      <p className="text-[9px] text-[#8b949e] font-medium truncate">{opp.label}</p>
                      {opp.apps > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-[#484f58]">MP</span>
                            <span className="text-[9px] text-[#c9d1d9] tabular-nums font-semibold">{opp.apps}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-[#484f58]">G</span>
                            <span className="text-[9px] text-emerald-400 tabular-nums font-semibold">{opp.goals}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-[#484f58]">A</span>
                            <span className="text-[9px] text-blue-400 tabular-nums font-semibold">{opp.assists}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-[#484f58]">Rat</span>
                            <span className={`text-[9px] tabular-nums font-bold ${textColor}`}>{opp.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[8px] text-[#484f58] mt-1">No data</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500/30" />
                  <span className="text-[8px] text-[#484f58]">7.0+ Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-amber-500/30" />
                  <span className="text-[8px] text-[#484f58]">6.0-6.9</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-red-500/30" />
                  <span className="text-[8px] text-[#484f58]">Below 6.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
