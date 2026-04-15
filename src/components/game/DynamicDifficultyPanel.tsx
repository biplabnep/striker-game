'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MatchResult, SeasonPlayerStats } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  Award,
  BarChart3,
  Gauge,
  Star,
  Trophy,
  Lock,
  ChevronUp,
  ChevronDown,
  Swords,
  UserCheck,
  Crosshair,
  Brain,
  Timer,
  Medal,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// Helpers
// ============================================================

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return '#34d399';
  if (rating >= 7.0) return '#10b981';
  if (rating >= 6.0) return '#fbbf24';
  if (rating >= 5.0) return '#f97316';
  return '#f87171';
}

function getRatingDotColor(rating: number): string {
  if (rating >= 7.5) return 'bg-emerald-400';
  if (rating >= 6.0) return 'bg-amber-400';
  return 'bg-red-400';
}

function getRatingBgClass(rating: number): string {
  if (rating >= 7.5) return 'bg-emerald-500/10 border-emerald-500/25';
  if (rating >= 6.0) return 'bg-amber-500/10 border-amber-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length);
}

type DifficultyLevel = 'easy' | 'normal' | 'hard';
type FormTrend = 'improving' | 'declining' | 'stable';

interface DifficultyEffects {
  statGrowth: string;
  matchDifficulty: string;
  transferInterest: string;
  injuryRisk: string;
}

const DIFFICULTY_EFFECTS: Record<DifficultyLevel, DifficultyEffects> = {
  easy: {
    statGrowth: '+15% faster',
    matchDifficulty: 'Lower opponent quality',
    transferInterest: 'Higher scout visibility',
    injuryRisk: '-40% injury chance',
  },
  normal: {
    statGrowth: 'Base progression',
    matchDifficulty: 'Balanced opposition',
    transferInterest: 'Standard interest',
    injuryRisk: 'Base injury chance',
  },
  hard: {
    statGrowth: '-10% slower',
    matchDifficulty: 'Top-tier opponents',
    transferInterest: 'Selective scouts only',
    injuryRisk: '+25% injury chance',
  },
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'border-emerald-400 bg-emerald-500/10 text-emerald-300',
  normal: 'border-amber-400 bg-amber-500/10 text-amber-300',
  hard: 'border-red-400 bg-red-500/10 text-red-300',
};

const DIFFICULTY_LABEL_COLORS: Record<DifficultyLevel, string> = {
  easy: 'text-emerald-400',
  normal: 'text-amber-400',
  hard: 'text-red-400',
};

const DIFFICULTY_BORDER_COLORS: Record<DifficultyLevel, string> = {
  easy: 'border-emerald-400',
  normal: 'border-amber-400',
  hard: 'border-red-400',
};

// ============================================================
// Badge definitions
// ============================================================

interface PerfBadge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  unlocked: boolean;
  color: string;
  bgColor: string;
}

// ============================================================
// SVG Chart constants
// ============================================================

const CHART_WIDTH = 340;
const CHART_HEIGHT = 160;
const CHART_PADDING_LEFT = 36;
const CHART_PADDING_RIGHT = 10;
const CHART_PADDING_TOP = 14;
const CHART_PADDING_BOTTOM = 24;
const CHART_PLOT_W = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const CHART_PLOT_H = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
const RATING_MIN = 4.0;
const RATING_MAX = 10.0;

function ratingToY(rating: number): number {
  const pct = (rating - RATING_MIN) / (RATING_MAX - RATING_MIN);
  return CHART_PADDING_TOP + CHART_PLOT_H * (1 - pct);
}

function matchToX(matchIdx: number, totalMatches: number): number {
  if (totalMatches <= 1) return CHART_PADDING_LEFT + CHART_PLOT_W / 2;
  return CHART_PADDING_LEFT + (matchIdx / (totalMatches - 1)) * CHART_PLOT_W;
}

// ============================================================
// Animated number helper
// ============================================================

function AnimatedNumber({ value, className, decimals = 0 }: { value: number; className?: string; decimals?: number }) {
  return (
    <motion.span
      className={className}
      key={String(value)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {value.toFixed(decimals)}
    </motion.span>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FormTrendIndicator({ trend }: { trend: FormTrend }) {
  if (trend === 'improving') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] px-2 py-0.5">
        <TrendingUp className="h-2.5 w-2.5 mr-1" /> Improving
      </Badge>
    );
  }
  if (trend === 'declining') {
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px] px-2 py-0.5">
        <TrendingDown className="h-2.5 w-2.5 mr-1" /> Declining
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-500/15 text-[#8b949e] border-slate-500/25 text-[10px] px-2 py-0.5">
      <Minus className="h-2.5 w-2.5 mr-1" /> Stable
    </Badge>
  );
}

function WinLossDrawBars({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses;
  if (total === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#484f58]">No matches played</span>
      </div>
    );
  }
  const winPct = (wins / total) * 100;
  const drawPct = (draws / total) * 100;
  const lossPct = (losses / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-16 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-400" />
          <span className="text-[10px] text-[#8b949e]">W {wins}</span>
        </div>
        <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-emerald-400 rounded-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${winPct}%` }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </div>
        <span className="text-[10px] text-emerald-400 tabular-nums w-9 text-right">{winPct.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-400" />
          <span className="text-[10px] text-[#8b949e]">D {draws}</span>
        </div>
        <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-amber-400 rounded-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${drawPct}%` }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
        </div>
        <span className="text-[10px] text-amber-400 tabular-nums w-9 text-right">{drawPct.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-400" />
          <span className="text-[10px] text-[#8b949e]">L {losses}</span>
        </div>
        <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-red-400 rounded-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${lossPct}%` }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
        </div>
        <span className="text-[10px] text-red-400 tabular-nums w-9 text-right">{lossPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function SeasonComparisonRow({
  label,
  prev,
  curr,
  isDecimal = false,
}: {
  label: string;
  prev: number;
  curr: number;
  isDecimal?: boolean;
}) {
  const prevStr = isDecimal ? prev.toFixed(1) : String(prev);
  const currStr = isDecimal ? curr.toFixed(1) : String(curr);
  const diff = curr - prev;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const diffStr = isDecimal ? Math.abs(diff).toFixed(1) : String(Math.abs(diff));

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#30363d] last:border-0">
      <span className="text-[11px] text-[#8b949e] w-20">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#484f58] tabular-nums">{prevStr}</span>
        <span className="text-[#30363d] text-[10px]">→</span>
        <span
          className={`text-[11px] font-semibold tabular-nums ${
            isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-[#c9d1d9]'
          }`}
        >
          {currStr}
        </span>
        {isUp && (
          <span className="flex items-center text-emerald-400">
            <ChevronUp className="h-3 w-3" />
            <span className="text-[9px] tabular-nums">{diffStr}</span>
          </span>
        )}
        {isDown && (
          <span className="flex items-center text-red-400">
            <ChevronDown className="h-3 w-3" />
            <span className="text-[9px] tabular-nums">{diffStr}</span>
          </span>
        )}
        {!isUp && !isDown && <Minus className="h-3 w-3 text-[#30363d]" />}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}) {
  return (
    <motion.div
      className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={`flex justify-center mb-1.5 ${color}`}>{icon}</div>
      <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-[#8b949e] mt-0.5">{label}</p>
      {subtext && <p className="text-[9px] text-[#484f58] mt-0.5">{subtext}</p>}
    </motion.div>
  );
}

function PerfBadgeCard({ badge }: { badge: PerfBadge }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${
        badge.unlocked
          ? `${badge.bgColor} border-[#30363d]`
          : 'bg-[#21262d]/50 border-[#21262d] opacity-50'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
          badge.unlocked ? badge.bgColor : 'bg-[#161b22]'
        }`}
      >
        {badge.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold ${badge.unlocked ? badge.color : 'text-[#484f58]'}`}>
          {badge.name}
        </p>
        <p className="text-[9px] text-[#484f58] truncate">{badge.description}</p>
      </div>
      {badge.unlocked && (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[8px] px-1.5 py-0 shrink-0">
          Active
        </Badge>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function DynamicDifficultyPanel() {
  const gameState = useGameStore((s) => s.gameState);

  // ---- Computed values (before early return) ----
  const last5Ratings = useMemo(() => {
    if (!gameState) return [] as number[];
    return gameState.recentResults.slice(0, 5).map((r) => r.playerRating).filter((r) => r > 0);
  }, [gameState]);

  const last10Ratings = useMemo(() => {
    if (!gameState) return [] as number[];
    return gameState.recentResults.slice(0, 10).map((r) => r.playerRating).filter((r) => r > 0);
  }, [gameState]);

  const rolling5Avg = useMemo(() => {
    if (last5Ratings.length === 0) return 0;
    return last5Ratings.reduce((a, b) => a + b, 0) / last5Ratings.length;
  }, [last5Ratings]);

  const formTrend = useMemo((): FormTrend => {
    if (last5Ratings.length < 3) return 'stable';
    const mid = Math.ceil(last5Ratings.length / 2);
    const recentHalf = last5Ratings.slice(0, mid);
    const olderHalf = last5Ratings.slice(mid);
    const avgRecent = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
    const avgOlder = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
    if (avgRecent - avgOlder > 0.3) return 'improving';
    if (avgOlder - avgRecent > 0.3) return 'declining';
    return 'stable';
  }, [last5Ratings]);

  const wldRecord = useMemo(() => {
    if (!gameState) return { wins: 0, draws: 0, losses: 0 };
    const recent = gameState.recentResults.filter((r) => r.playerMinutesPlayed > 0);
    let wins = 0, draws = 0, losses = 0;
    for (const r of recent) {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const myGoals = isHome ? r.homeScore : r.awayScore;
      const oppGoals = isHome ? r.awayScore : r.homeScore;
      if (myGoals > oppGoals) wins++;
      else if (myGoals === oppGoals) draws++;
      else losses++;
    }
    return { wins, draws, losses };
  }, [gameState]);

  const seasonComparison = useMemo(() => {
    if (!gameState || gameState.seasons.length === 0) return null;
    const currentStats = gameState.player.seasonStats;
    const prevSeason = gameState.seasons[gameState.seasons.length - 1];
    return { prev: prevSeason.playerStats, current: currentStats };
  }, [gameState]);

  const performanceMetrics = useMemo(() => {
    if (!gameState) return null;
    const p = gameState.player;
    const career = p.careerStats;
    const season = p.seasonStats;
    const isGK = p.position === 'GK';

    const goalsPerGame =
      career.totalAppearances > 0
        ? (career.totalGoals / career.totalAppearances)
        : 0;
    const assistsPerGame =
      career.totalAppearances > 0
        ? (career.totalAssists / career.totalAppearances)
        : 0;
    const ratingAvg = season.appearances > 0 ? season.averageRating : 0;
    const { wins, draws, losses } = wldRecord;
    const total = wins + draws + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const cleanSheetPct =
      season.appearances > 0
        ? (season.cleanSheets / season.appearances) * 100
        : 0;
    const consistency = last5Ratings.length >= 2 ? standardDeviation(last5Ratings) : 0;

    return {
      goalsPerGame,
      assistsPerGame,
      ratingAvg,
      winRate,
      cleanSheetPct,
      consistency,
      isGK,
    };
  }, [gameState, wldRecord, last5Ratings]);

  const chartData = useMemo(() => {
    if (!gameState) return [] as { matchNum: number; rating: number }[];
    const results = gameState.recentResults
      .filter((r) => r.playerRating > 0 && r.season === gameState.currentSeason)
      .reverse();
    return results.map((r, i) => ({ matchNum: i + 1, rating: r.playerRating }));
  }, [gameState]);

  const chartAvgColor = useMemo(() => {
    if (chartData.length === 0) return '#f59e0b';
    const avg = chartData.reduce((s, d) => s + d.rating, 0) / chartData.length;
    if (avg >= 7.0) return '#34d399';
    if (avg >= 6.0) return '#fbbf24';
    return '#f87171';
  }, [chartData]);

  const recommendedAction = useMemo(() => {
    if (!gameState || last5Ratings.length < 5) {
      return { type: 'insufficient' as const, message: 'Play at least 5 matches to receive a recommendation.', action: null };
    }
    const avg = rolling5Avg;
    const currentDiff: DifficultyLevel = gameState.difficulty;

    // Check consecutive goals for Goal Machine analysis
    const recent5 = gameState.recentResults.slice(0, 5);
    const goalsPerMatch = recent5.reduce((s, r) => s + r.playerGoals, 0) / 5;

    if (avg > 7.5 && currentDiff !== 'hard') {
      return {
        type: 'increase' as const,
        message: `Your 5-match average of ${avg.toFixed(1)} indicates strong overperformance. Consider increasing difficulty for a greater challenge.`,
        action: currentDiff === 'easy' ? ('normal' as DifficultyLevel) : ('hard' as DifficultyLevel),
      };
    }
    if (avg < 5.5 && currentDiff !== 'easy') {
      return {
        type: 'decrease' as const,
        message: `Your 5-match average of ${avg.toFixed(1)} suggests you're struggling. Consider lowering difficulty to enjoy the game more.`,
        action: currentDiff === 'hard' ? ('normal' as DifficultyLevel) : ('easy' as DifficultyLevel),
      };
    }
    if (avg >= 6.5 && avg <= 7.5) {
      return {
        type: 'maintain' as const,
        message: `Your form is solid with a ${avg.toFixed(1)} average. Current difficulty feels well-matched to your skill level.`,
        action: null,
      };
    }
    return {
      type: 'maintain' as const,
      message: `Your ${avg.toFixed(1)} average suggests you're in a reasonable range. Keep playing and see if the trend continues.`,
      action: null,
    };
  }, [gameState, last5Ratings, rolling5Avg]);

  const performanceBadges = useMemo((): PerfBadge[] => {
    if (!gameState) return [];
    const recent = gameState.recentResults.slice(0, 10);

    // Hot Streak: 3+ matches with rating >= 8.0
    const hotStreakCount = recent.filter((r) => r.playerRating >= 8.0).length;
    const hotStreakActive = hotStreakCount >= 3;

    // Consistent: last 5 matches all between 6.0-8.0
    const last5 = recent.slice(0, 5);
    const consistentActive =
      last5.length >= 5 &&
      last5.every((r) => r.playerRating >= 6.0 && r.playerRating <= 8.0);

    // Goal Machine: scored in 3+ consecutive matches
    let goalStreak = 0;
    for (const r of recent) {
      if (r.playerGoals > 0) goalStreak++;
      else break;
    }
    const goalMachineActive = goalStreak >= 3;

    // Iron Man: played 10+ consecutive matches
    const consecutiveApps = recent.filter((r) => r.playerMinutesPlayed > 0).length;
    const ironManActive = consecutiveApps >= 10;

    // Underperforming: avg < 5.5 over 5 matches
    const last5Rats = last5.map((r) => r.playerRating);
    const underperfAvg =
      last5Rats.length >= 5 ? last5Rats.reduce((a, b) => a + b, 0) / 5 : 0;
    const underperfActive = underperfAvg < 5.5 && last5Rats.length >= 5;

    return [
      {
        id: 'hot_streak',
        name: 'Hot Streak',
        icon: <Flame className="h-4 w-4 text-orange-400" />,
        description: `${hotStreakCount} matches rated 8.0+ in last 10`,
        unlocked: hotStreakActive,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
      },
      {
        id: 'consistent',
        name: 'Consistent',
        icon: <Target className="h-4 w-4 text-emerald-400" />,
        description: 'Last 5 ratings all between 6.0-8.0',
        unlocked: consistentActive,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        id: 'goal_machine',
        name: 'Goal Machine',
        icon: <Crosshair className="h-4 w-4 text-yellow-400" />,
        description: `Scored in ${goalStreak} consecutive matches`,
        unlocked: goalMachineActive,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
      },
      {
        id: 'iron_man',
        name: 'Iron Man',
        icon: <Shield className="h-4 w-4 text-blue-400" />,
        description: `${consecutiveApps} consecutive appearances`,
        unlocked: ironManActive,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
      {
        id: 'underperforming',
        name: 'Underperforming',
        icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
        description: `Avg rating ${underperfAvg.toFixed(1)} over last 5 matches`,
        unlocked: underperfActive,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
      },
    ];
  }, [gameState]);

  // ---- Early return ----
  if (!gameState) return null;

  const { player, difficulty: currentDifficulty, currentWeek, currentSeason } = gameState;
  const midSeason = currentWeek > 5 && currentWeek < 34;
  const unlockedBadges = performanceBadges.filter((b) => b.unlocked).length;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Gauge className="h-5 w-5 text-emerald-400" />
        Dynamic Difficulty
      </h2>
      <p className="text-xs text-[#8b949e] -mt-2">
        Performance analysis and difficulty optimization for Season {currentSeason}, Week {currentWeek}
      </p>

      {/* ============================================= */}
      {/* 1. Performance Tracker Section */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-400" /> Performance Tracker
              </CardTitle>
              <FormTrendIndicator trend={formTrend} />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Rolling Average */}
            <div className="flex items-center justify-between bg-[#21262d] rounded-lg border border-[#30363d] p-3">
              <div>
                <p className="text-[10px] text-[#8b949e]">Rolling 5-Match Average</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: getRatingColor(rolling5Avg) }}
                  >
                    {last5Ratings.length > 0 ? rolling5Avg.toFixed(2) : '--'}
                  </span>
                  {last5Ratings.length >= 5 && (
                    <Badge
                      className={`text-[9px] px-1.5 py-0 ${
                        rolling5Avg >= 7.5
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : rolling5Avg >= 6.0
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          : 'bg-red-500/15 text-red-400 border-red-500/25'
                      }`}
                    >
                      {rolling5Avg >= 7.5 ? 'Excellent' : rolling5Avg >= 6.0 ? 'Average' : 'Below Avg'}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Last 5 rating dots */}
              <div className="flex items-center gap-1.5">
                {last5Ratings.map((r, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                  >
                    <div className={`w-3 h-3 rounded-sm ${getRatingDotColor(r)}`} title={`Match ${i + 1}: ${r.toFixed(1)}`} />
                    <span className="text-[7px] text-[#484f58] tabular-nums">{r.toFixed(1)}</span>
                  </motion.div>
                ))}
                {last5Ratings.length === 0 && (
                  <span className="text-[10px] text-[#484f58]">No data</span>
                )}
              </div>
            </div>

            {/* Win/Loss/Draw */}
            <div>
              <p className="text-[10px] text-[#8b949e] mb-2 font-medium">Recent Results</p>
              <WinLossDrawBars {...wldRecord} />
            </div>

            {/* Season Comparison */}
            {seasonComparison && (
              <div>
                <p className="text-[10px] text-[#8b949e] mb-1.5 font-medium">
                  Current vs Previous Season
                </p>
                <div className="bg-[#21262d] rounded-lg border border-[#30363d] px-3 py-1.5">
                  <SeasonComparisonRow label="Goals" prev={seasonComparison.prev.goals} curr={seasonComparison.current.goals} />
                  <SeasonComparisonRow label="Assists" prev={seasonComparison.prev.assists} curr={seasonComparison.current.assists} />
                  <SeasonComparisonRow label="Avg Rating" prev={seasonComparison.prev.averageRating} curr={seasonComparison.current.averageRating} isDecimal />
                  <SeasonComparisonRow label="Apps" prev={seasonComparison.prev.appearances} curr={seasonComparison.current.appearances} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 2. Difficulty Analysis Engine */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Brain className="h-3 w-3 text-emerald-400" /> Difficulty Analysis Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Current difficulty indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8b949e]">Current Difficulty</span>
              <div className="flex items-center gap-1.5">
                {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((d) => {
                  const isActive = d === currentDifficulty;
                  const diffIdx = d === 'easy' ? 0 : d === 'normal' ? 1 : 2;
                  const currentIdx =
                    currentDifficulty === 'easy' ? 0 : currentDifficulty === 'normal' ? 1 : 2;
                  const isPast = diffIdx < currentIdx;
                  const isFuture = diffIdx > currentIdx;

                  return (
                    <div
                      key={d}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-medium capitalize ${
                        isActive
                          ? DIFFICULTY_COLORS[d]
                          : isPast
                          ? 'border-[#30363d] text-[#484f58]'
                          : 'border-[#30363d] text-[#484f58]'
                      }`}
                    >
                      {d === 'easy' && <Shield className="h-3 w-3" />}
                      {d === 'normal' && <Swords className="h-3 w-3" />}
                      {d === 'hard' && <Flame className="h-3 w-3" />}
                      {d}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-sm bg-current" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Difficulty scale bar */}
            <div className="relative">
              <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden flex">
                <div className="flex-1 bg-emerald-500/40" />
                <div className="flex-1 bg-amber-500/40" />
                <div className="flex-1 bg-red-500/40" />
              </div>
              <motion.div
                className="absolute top-0 h-full w-1 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, left: `${currentDifficulty === 'easy' ? 16 : currentDifficulty === 'normal' ? 50 : 84}%` }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
              <div className="flex justify-between mt-1 text-[8px] text-[#484f58] px-0.5">
                <span>Easy</span>
                <span>Normal</span>
                <span>Hard</span>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div
              className={`rounded-lg border p-3 ${
                recommendedAction.type === 'increase'
                  ? 'bg-emerald-500/8 border-emerald-500/25'
                  : recommendedAction.type === 'decrease'
                  ? 'bg-red-500/8 border-red-500/25'
                  : recommendedAction.type === 'insufficient'
                  ? 'bg-[#21262d] border-[#30363d]'
                  : 'bg-amber-500/8 border-amber-500/25'
              }`}
            >
              <div className="flex items-start gap-2">
                {recommendedAction.type === 'increase' && (
                  <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                )}
                {recommendedAction.type === 'decrease' && (
                  <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                )}
                {recommendedAction.type === 'insufficient' && (
                  <Timer className="h-4 w-4 text-[#484f58] mt-0.5 shrink-0" />
                )}
                {recommendedAction.type === 'maintain' && (
                  <Minus className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[#c9d1d9] mb-0.5">
                    {recommendedAction.type === 'insufficient'
                      ? 'Data Collecting'
                      : recommendedAction.type === 'increase'
                      ? 'Difficulty Up Recommended'
                      : recommendedAction.type === 'decrease'
                      ? 'Difficulty Down Recommended'
                      : 'Well Balanced'}
                  </p>
                  <p className="text-[10px] text-[#8b949e] leading-relaxed">
                    {recommendedAction.message}
                  </p>
                  {recommendedAction.action && (
                    <Button
                      size="sm"
                      className={`mt-2 h-7 text-[10px] px-3 ${
                        recommendedAction.type === 'increase'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      Switch to {recommendedAction.action.charAt(0).toUpperCase() + recommendedAction.action.slice(1)}
                      {recommendedAction.type === 'increase' ? (
                        <ChevronUp className="h-3 w-3 ml-1" />
                      ) : (
                        <ChevronDown className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            {last5Ratings.length >= 3 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#21262d] rounded-lg border border-[#30363d] p-2.5">
                  <p className="text-[9px] text-[#484f58] mb-0.5">Goals/Match (last 5)</p>
                  <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">
                    {gameState.recentResults
                      .slice(0, 5)
                      .reduce((s, r) => s + r.playerGoals, 0) / Math.min(5, gameState.recentResults.length)}
                    <span className="text-[9px] text-[#484f58] ml-0.5">per game</span>
                  </p>
                </div>
                <div className="bg-[#21262d] rounded-lg border border-[#30363d] p-2.5">
                  <p className="text-[9px] text-[#484f58] mb-0.5">Assists/Match (last 5)</p>
                  <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">
                    {gameState.recentResults
                      .slice(0, 5)
                      .reduce((s, r) => s + r.playerAssists, 0) / Math.min(5, gameState.recentResults.length)}
                    <span className="text-[9px] text-[#484f58] ml-0.5">per game</span>
                  </p>
                </div>
                {player.position === 'GK' && (
                  <div className="bg-[#21262d] rounded-lg border border-[#30363d] p-2.5">
                    <p className="text-[9px] text-[#484f58] mb-0.5">Clean Sheets (Season)</p>
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">
                      {player.seasonStats.cleanSheets}
                      <span className="text-[9px] text-[#484f58] ml-0.5">
                        / {player.seasonStats.appearances} apps
                      </span>
                    </p>
                  </div>
                )}
                <div className="bg-[#21262d] rounded-lg border border-[#30363d] p-2.5">
                  <p className="text-[9px] text-[#484f58] mb-0.5">Form Deviation</p>
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{
                      color:
                        last5Ratings.length >= 2
                          ? standardDeviation(last5Ratings) < 0.8
                            ? '#34d399'
                            : standardDeviation(last5Ratings) < 1.5
                            ? '#fbbf24'
                            : '#f87171'
                          : '#8b949e',
                    }}
                  >
                    {last5Ratings.length >= 2 ? standardDeviation(last5Ratings).toFixed(2) : '--'}
                    <span className="text-[9px] text-[#484f58] ml-0.5">std dev</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 3. Performance Metrics Grid (3 cols) */}
      {/* ============================================= */}
      {performanceMetrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <BarChart3 className="h-3 w-3 text-emerald-400" /> Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                <MetricCard
                  label="Goals/Game"
                  value={performanceMetrics.goalsPerGame.toFixed(2)}
                  icon={<Target className="h-4 w-4 text-emerald-400" />}
                  color="text-emerald-400"
                  subtext="Career average"
                />
                <MetricCard
                  label="Assists/Game"
                  value={performanceMetrics.assistsPerGame.toFixed(2)}
                  icon={<Zap className="h-4 w-4 text-blue-400" />}
                  color="text-blue-400"
                  subtext="Career average"
                />
                <MetricCard
                  label="Rating Avg"
                  value={performanceMetrics.ratingAvg > 0 ? performanceMetrics.ratingAvg.toFixed(1) : '--'}
                  icon={<Star className="h-4 w-4 text-amber-400" />}
                  color={getRatingColor(performanceMetrics.ratingAvg)}
                  subtext="Season average"
                />
                <MetricCard
                  label="Win Rate"
                  value={`${performanceMetrics.winRate.toFixed(0)}%`}
                  icon={<Trophy className="h-4 w-4 text-emerald-400" />}
                  color="text-emerald-400"
                  subtext="Recent form"
                />
                {performanceMetrics.isGK ? (
                  <MetricCard
                    label="Clean Sheet %"
                    value={`${performanceMetrics.cleanSheetPct.toFixed(0)}%`}
                    icon={<Shield className="h-4 w-4 text-cyan-400" />}
                    color="text-cyan-400"
                    subtext="Season"
                  />
                ) : (
                  <MetricCard
                    label="Shot Accuracy"
                    value={
                      player.seasonStats.goals > 0 && player.careerStats.totalAppearances > 0
                        ? `${Math.min(
                            100,
                            Math.round(
                              (player.seasonStats.goals /
                                Math.max(1, player.seasonStats.appearances)) *
                                100 *
                                2.5
                            )
                          )}%`
                        : '--'
                    }
                    icon={<Crosshair className="h-4 w-4 text-orange-400" />}
                    color="text-orange-400"
                    subtext="Est. accuracy"
                  />
                )}
                <MetricCard
                  label="Consistency"
                  value={
                    performanceMetrics.consistency > 0
                      ? performanceMetrics.consistency.toFixed(2)
                      : '--'
                  }
                  icon={<Medal className="h-4 w-4 text-purple-400" />}
                  color={
                    performanceMetrics.consistency < 0.8
                      ? 'text-emerald-400'
                      : performanceMetrics.consistency < 1.5
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }
                  subtext={
                    performanceMetrics.consistency > 0
                      ? performanceMetrics.consistency < 0.8
                        ? 'Very consistent'
                        : performanceMetrics.consistency < 1.5
                        ? 'Moderate'
                        : 'Volatile'
                      : 'Need more data'
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 4. Season Progress Chart */}
      {/* ============================================= */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-emerald-400" /> Rating Trend
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[9px] text-[#484f58]">
                  <span
                    className="w-2 h-2 rounded-sm inline-block"
                    style={{ backgroundColor: chartAvgColor }}
                  />
                  Avg:{' '}
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: chartAvgColor }}
                  >
                    {(chartData.reduce((s, d) => s + d.rating, 0) / chartData.length).toFixed(1)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <svg
                width="100%"
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="select-none"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Background */}
                <rect
                  x={CHART_PADDING_LEFT}
                  y={CHART_PADDING_TOP}
                  width={CHART_PLOT_W}
                  height={CHART_PLOT_H}
                  fill="#0d1117"
                  rx={2}
                />

                {/* Grid lines at 6.0, 7.0, 8.0 */}
                {[6.0, 7.0, 8.0].map((threshold) => {
                  const y = ratingToY(threshold);
                  const color =
                    threshold === 8.0
                      ? '#22c55e'
                      : threshold === 7.0
                      ? '#fbbf24'
                      : '#f87171';
                  return (
                    <g key={threshold}>
                      <line
                        x1={CHART_PADDING_LEFT}
                        y1={y}
                        x2={CHART_PADDING_LEFT + CHART_PLOT_W}
                        y2={y}
                        stroke={color}
                        strokeWidth={0.5}
                        strokeDasharray="3 3"
                        opacity={0.4}
                      />
                      <text
                        x={CHART_PADDING_LEFT - 4}
                        y={y + 3}
                        textAnchor="end"
                        fill={color}
                        fontSize={8}
                        opacity={0.6}
                      >
                        {threshold.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis labels for 4.0 and 10.0 */}
                <text x={CHART_PADDING_LEFT - 4} y={ratingToY(RATING_MIN) + 3} textAnchor="end" fill="#484f58" fontSize={8}>
                  {RATING_MIN.toFixed(1)}
                </text>
                <text x={CHART_PADDING_LEFT - 4} y={ratingToY(RATING_MAX) + 3} textAnchor="end" fill="#484f58" fontSize={8}>
                  {RATING_MAX.toFixed(1)}
                </text>

                {/* X-axis labels */}
                {chartData.length > 0 && (
                  <>
                    <text
                      x={matchToX(0, chartData.length)}
                      y={CHART_HEIGHT - 6}
                      textAnchor="middle"
                      fill="#484f58"
                      fontSize={8}
                    >
                      1
                    </text>
                    <text
                      x={matchToX(chartData.length - 1, chartData.length)}
                      y={CHART_HEIGHT - 6}
                      textAnchor="middle"
                      fill="#484f58"
                      fontSize={8}
                    >
                      {chartData.length}
                    </text>
                  </>
                )}

                {/* Polyline */}
                <motion.polyline
                  points={chartData
                    .map((d, i) => `${matchToX(i, chartData.length)},${ratingToY(d.rating)}`)
                    .join(' ')}
                  fill="none"
                  stroke={chartAvgColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />

                {/* Data points */}
                {chartData.map((d, i) => (
                  <motion.circle
                    key={i}
                    cx={matchToX(i, chartData.length)}
                    cy={ratingToY(d.rating)}
                    r={3}
                    fill="#0d1117"
                    stroke={getRatingColor(d.rating)}
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  />
                ))}
              </svg>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 5. Difficulty Adjustment Controls */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Shield className="h-3 w-3 text-emerald-400" /> Difficulty Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Mid-season warning */}
            {midSeason && (
              <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/25 rounded-lg p-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-amber-400 font-medium">
                    Mid-Season Adjustment Warning
                  </p>
                  <p className="text-[9px] text-[#8b949e] mt-0.5">
                    Changing difficulty mid-season will not retroactively adjust previous match results
                    or player progression. Changes take effect from next match onwards.
                  </p>
                </div>
              </div>
            )}

            {/* Three difficulty cards */}
            <div className="space-y-2">
              {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((diff) => {
                const isActive = diff === currentDifficulty;
                const effects = DIFFICULTY_EFFECTS[diff];
                const labelColor = DIFFICULTY_LABEL_COLORS[diff];
                const borderColor = DIFFICULTY_BORDER_COLORS[diff];

                return (
                  <motion.div
                    key={diff}
                    className={`rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                      isActive
                        ? `${borderColor} bg-[#161b22]`
                        : 'border-[#30363d] bg-[#21262d] hover:border-[#484f58]'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 + (diff === 'easy' ? 0 : diff === 'normal' ? 0.06 : 0.12) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {diff === 'easy' && <Shield className="h-4 w-4 text-emerald-400" />}
                        {diff === 'normal' && <Swords className="h-4 w-4 text-amber-400" />}
                        {diff === 'hard' && <Flame className="h-4 w-4 text-red-400" />}
                        <span className={`text-sm font-bold capitalize ${labelColor}`}>
                          {diff}
                        </span>
                      </div>
                      {isActive && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[9px] px-2 py-0">
                          <UserCheck className="h-2.5 w-2.5 mr-1" /> Active
                        </Badge>
                      )}
                      {!isActive && (
                        <Lock className="h-3 w-3 text-[#30363d]" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-2.5 w-2.5 text-[#484f58]" />
                        <span className="text-[9px] text-[#8b949e]">Growth:</span>
                        <span className="text-[9px] text-[#c9d1d9] font-medium">{effects.statGrowth}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Swords className="h-2.5 w-2.5 text-[#484f58]" />
                        <span className="text-[9px] text-[#8b949e]">Matches:</span>
                        <span className="text-[9px] text-[#c9d1d9] font-medium">{effects.matchDifficulty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-2.5 w-2.5 text-[#484f58]" />
                        <span className="text-[9px] text-[#8b949e]">Scouts:</span>
                        <span className="text-[9px] text-[#c9d1d9] font-medium">{effects.transferInterest}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-2.5 w-2.5 text-[#484f58]" />
                        <span className="text-[9px] text-[#8b949e]">Injury:</span>
                        <span className="text-[9px] text-[#c9d1d9] font-medium">{effects.injuryRisk}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 6. Performance Badges */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Award className="h-3 w-3 text-emerald-400" /> Performance Badges
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[9px] text-[#8b949e] border-[#30363d] bg-[#21262d]"
              >
                {unlockedBadges}/{performanceBadges.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {performanceBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <PerfBadgeCard badge={badge} />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
