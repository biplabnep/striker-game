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
    </div>
  );
}
