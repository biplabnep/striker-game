'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, Target, Zap, Shield, Heart, Clock, Activity,
  TrendingUp, Footprints, AlertTriangle,
} from 'lucide-react';
import type { MatchResult, MatchEvent, Club } from '@/lib/game/types';

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------
interface MatchStatsPopupProps {
  matchResult: MatchResult;
  opponentClub: Club;
  isHome: boolean;
  onClose: () => void;
}

// -----------------------------------------------------------
// Extended match stats for the popup
// -----------------------------------------------------------
interface ExtendedMatchStats {
  possession: { player: number; opponent: number };
  shots: { playerTotal: number; opponentTotal: number; playerOnTarget: number; opponentOnTarget: number; playerOffTarget: number; opponentOffTarget: number };
  passing: { playerAccuracy: number; opponentAccuracy: number; playerTotal: number; opponentTotal: number; playerKeyPasses: number; opponentKeyPasses: number };
  discipline: { playerYellow: number; opponentYellow: number; playerRed: number; opponentRed: number };
  playerPerformance: {
    rating: number;
    goals: number;
    assists: number;
    passes: number;
    tackles: number;
    distance: number;
  };
  momentum: number[];
}

// -----------------------------------------------------------
// Stats generator (seeded from match result for consistency)
// -----------------------------------------------------------
function generateExtendedStats(
  matchResult: MatchResult,
  isHome: boolean,
): ExtendedMatchStats {
  const playerClub = isHome ? matchResult.homeClub : matchResult.awayClub;
  const oppClub = isHome ? matchResult.awayClub : matchResult.homeClub;
  const playerScore = isHome ? matchResult.homeScore : matchResult.awayScore;
  const oppScore = isHome ? matchResult.awayScore : matchResult.homeScore;
  const qualityDiff = playerClub.squadQuality - oppClub.squadQuality;
  const scoreDiff = playerScore - oppScore;

  // Count cards from events
  const playerCards = matchResult.events.filter(
    e => (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')
      && ((isHome && e.team === 'home') || (!isHome && e.team === 'away'))
  );
  const oppCards = matchResult.events.filter(
    e => (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')
      && ((isHome && e.team === 'away') || (!isHome && e.team === 'home'))
  );

  const playerYellow = playerCards.filter(e => e.type === 'yellow_card' || e.type === 'second_yellow').length;
  const playerRed = playerCards.filter(e => e.type === 'red_card' || e.type === 'second_yellow').length;
  const opponentYellow = oppCards.filter(e => e.type === 'yellow_card' || e.type === 'second_yellow').length;
  const opponentRed = oppCards.filter(e => e.type === 'red_card' || e.type === 'second_yellow').length;

  // Possession
  const playerPossession = Math.max(30, Math.min(70, Math.round(50 + qualityDiff * 0.25 + scoreDiff * 2 + (Math.random() * 8 - 4))));
  const opponentPossession = 100 - playerPossession;

  // Shots
  const playerTotalShots = Math.max(4, Math.round(11 + qualityDiff * 0.15 + playerScore * 2.5 + (Math.random() * 5 - 2)));
  const opponentTotalShots = Math.max(4, Math.round(11 - qualityDiff * 0.15 + oppScore * 2.5 + (Math.random() * 5 - 2)));
  const playerOnTarget = Math.min(playerTotalShots, Math.max(1, Math.round(playerScore + 1.5 + Math.random() * 2)));
  const opponentOnTarget = Math.min(opponentTotalShots, Math.max(1, Math.round(oppScore + 1.5 + Math.random() * 2)));

  // Passing
  const playerAccuracy = Math.max(62, Math.min(93, Math.round(79 + qualityDiff * 0.12 + (Math.random() * 6 - 3))));
  const opponentAccuracy = Math.max(62, Math.min(93, Math.round(79 - qualityDiff * 0.12 + (Math.random() * 6 - 3))));
  const playerTotalPasses = Math.max(200, Math.round(380 + qualityDiff * 2 + playerPossession * 2 + (Math.random() * 40 - 20)));
  const opponentTotalPasses = Math.max(200, Math.round(380 - qualityDiff * 2 + opponentPossession * 2 + (Math.random() * 40 - 20)));
  const playerKeyPasses = Math.max(1, Math.round(matchResult.playerAssists * 3 + qualityDiff * 0.05 + Math.random() * 5));
  const opponentKeyPasses = Math.max(1, Math.round(Math.random() * 8 + 2));

  // Player performance
  const rating = matchResult.playerRating;
  const distance = Math.max(6.5, Math.round((matchResult.playerMinutesPlayed / 90) * (9.5 + Math.random() * 2.5) * 10) / 10);
  const passes = Math.max(0, Math.round(matchResult.playerMinutesPlayed / 90 * (35 + qualityDiff * 0.2 + Math.random() * 15)));
  const tackles = Math.max(0, Math.round(matchResult.playerMinutesPlayed / 90 * (2 + Math.random() * 3)));

  // Momentum (5 periods: 0-18, 18-36, 36-54, 54-72, 72-90)
  const momentum: number[] = [];
  let currentMomentum = 50 + qualityDiff * 0.2;
  for (let i = 0; i < 5; i++) {
    currentMomentum += (Math.random() * 20 - 10) + scoreDiff * 1.5;
    currentMomentum = Math.max(15, Math.min(85, currentMomentum));
    momentum.push(Math.round(currentMomentum));
  }

  return {
    possession: { player: playerPossession, opponent: opponentPossession },
    shots: {
      playerTotal: playerTotalShots,
      opponentTotal: opponentTotalShots,
      playerOnTarget,
      opponentOnTarget,
      playerOffTarget: playerTotalShots - playerOnTarget,
      opponentOffTarget: opponentTotalShots - opponentOnTarget,
    },
    passing: {
      playerAccuracy,
      opponentAccuracy,
      playerTotal: playerTotalPasses,
      opponentTotal: opponentTotalPasses,
      playerKeyPasses,
      opponentKeyPasses,
    },
    discipline: {
      playerYellow,
      opponentYellow,
      playerRed,
      opponentRed,
    },
    playerPerformance: {
      rating,
      goals: matchResult.playerGoals,
      assists: matchResult.playerAssists,
      passes,
      tackles,
      distance,
    },
    momentum,
  };
}

// -----------------------------------------------------------
// SVG Donut chart for possession
// -----------------------------------------------------------
function PossessionDonut({ playerPct, opponentPct }: { playerPct: number; opponentPct: number }) {
  const size = 120;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const playerArc = (playerPct / 100) * circumference;
  const opponentArc = (opponentPct / 100) * circumference;
  const gap = 4; // small gap between segments

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
        />
        {/* Player segment (emerald) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${Math.max(0, playerArc - gap)} ${circumference}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />
        {/* Opponent segment (slate) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#64748b"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${Math.max(0, opponentArc - gap)} ${circumference}`}
          strokeDashoffset={-playerArc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        />
      </svg>
      <div className="flex items-center gap-4 -mt-[calc(50%+4px)]" style={{ marginTop: `-${size / 2 + 8}px` }}>
        <div className="text-center">
          <p className="text-lg font-black text-emerald-400">{playerPct}%</p>
          <p className="text-[9px] text-[#8b949e] font-semibold">YOU</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="text-[10px] text-[#8b949e]">Your Team</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
          <span className="text-[10px] text-[#8b949e]">Opponent</span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Side-by-side comparison bar
// -----------------------------------------------------------
function ComparisonBar({
  label,
  playerValue,
  opponentValue,
  isPercentage,
  delay,
}: {
  label: string;
  playerValue: number;
  opponentValue: number;
  isPercentage?: boolean;
  delay: number;
}) {
  const total = playerValue + opponentValue;
  const playerPct = total > 0 ? (playerValue / total) * 100 : 50;
  const opponentPct = total > 0 ? (opponentValue / total) * 100 : 50;
  const playerHigher = playerValue > opponentValue;
  const opponentHigher = opponentValue > playerValue;

  const displayPlayer = isPercentage ? `${playerValue}%` : String(playerValue);
  const displayOpponent = isPercentage ? `${opponentValue}%` : String(opponentValue);

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
    >
      <p className="text-[10px] text-[#8b949e] text-center font-medium">{label}</p>
      <div className="flex items-center gap-1.5">
        {/* Player value */}
        <span className={`text-xs font-bold w-8 text-right tabular-nums ${playerHigher ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
          {displayPlayer}
        </span>
        {/* Bar container */}
        <div className="flex-1 flex h-3 overflow-hidden rounded-md bg-[#21262d]">
          {/* Player bar (grows from left) */}
          <motion.div
            className="bg-emerald-600 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${playerPct}%` }}
            transition={{ delay: delay + 0.1, duration: 0.35, ease: 'easeOut' }}
          />
          {/* Center divider */}
          <div className="w-px bg-[#30363d]" />
          {/* Opponent bar (grows from right) */}
          <div className="flex-1 flex justify-end">
            <motion.div
              className="bg-slate-600 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${opponentPct}%` }}
              transition={{ delay: delay + 0.15, duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
        {/* Opponent value */}
        <span className={`text-xs font-bold w-8 tabular-nums ${opponentHigher ? 'text-slate-300' : 'text-[#8b949e]'}`}>
          {displayOpponent}
        </span>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Discipline card row
// -----------------------------------------------------------
function DisciplineRow({
  label,
  playerCount,
  opponentCount,
  cardColor,
  cardEmoji,
  delay,
}: {
  label: string;
  playerCount: number;
  opponentCount: number;
  cardColor: string;
  cardEmoji: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{cardEmoji}</span>
        <span className="text-xs text-[#c9d1d9] font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold tabular-nums ${playerCount > opponentCount ? 'text-amber-400' : 'text-[#8b949e]'}`}>
          {playerCount}
        </span>
        <span className="text-[10px] text-[#484f58]">vs</span>
        <span className={`text-sm font-bold tabular-nums ${opponentCount > playerCount ? 'text-amber-400' : 'text-[#8b949e]'}`}>
          {opponentCount}
        </span>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Player performance stat pill
// -----------------------------------------------------------
function PerformanceStat({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'positive' | 'negative' | 'neutral';
  delay: number;
}) {
  const colorMap = {
    positive: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    negative: 'text-red-400 border-red-500/20 bg-red-500/5',
    neutral: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  };
  const iconColorMap = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-amber-400',
  };

  return (
    <motion.div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${colorMap[color]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
    >
      <span className={iconColorMap[color]}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-sm font-bold tabular-nums">{value}</span>
        <span className="text-[9px] opacity-70">{label}</span>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Momentum SVG area chart
// -----------------------------------------------------------
function MomentumChart({ data }: { data: number[] }) {
  const width = 300;
  const height = 100;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const periods = data.length; // 5
  const stepX = chartW / (periods - 1);

  // Build path points
  const points = data.map((val, i) => ({
    x: padding + i * stepX,
    y: padding + chartH - ((val - 15) / 70) * chartH,
  }));

  // Area path
  const areaPath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
    + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  // Line path
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // 50% reference line
  const midY = padding + chartH - ((50 - 15) / 70) * chartH;

  // Period labels
  const periodLabels = ['0-18\'', '18-36\'', '36-54\'', '54-72\'', '72-90\''];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[300px]"
      >
        {/* Reference line at 50% */}
        <line
          x1={padding}
          y1={midY}
          x2={width - padding}
          y2={midY}
          stroke="#30363d"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="#10b981"
          fillOpacity={0.12}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        />
        {/* Dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={data[i] > 55 ? '#10b981' : data[i] < 45 ? '#ef4444' : '#f59e0b'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.2 }}
          />
        ))}
      </svg>
      {/* Period labels */}
      <div className="flex w-full max-w-[300px] justify-between px-0">
        {periodLabels.map((lbl, i) => (
          <span key={i} className="text-[8px] text-[#484f58] font-mono">
            {lbl}
          </span>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-emerald-500" />
          <span className="text-[9px] text-[#8b949e]">Dominant</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-amber-500" />
          <span className="text-[9px] text-[#8b949e]">Even</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-red-500" />
          <span className="text-[9px] text-[#8b949e]">Under Pressure</span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Section wrapper
// -----------------------------------------------------------
function SectionCard({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] rounded-lg border border-[#30363d] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-emerald-400">{icon}</span>
        <h3 className="text-xs font-bold text-[#c9d1d9] tracking-wide uppercase">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function MatchStatsPopup({
  matchResult,
  opponentClub,
  isHome,
  onClose,
}: MatchStatsPopupProps) {
  // Generate extended stats (memoized)
  const stats = useMemo(
    () => generateExtendedStats(matchResult, isHome),
    [matchResult, isHome],
  );

  // Determine player performance stat colors
  const perfColor = (val: number, goodThreshold: number, neutralThreshold: number) => {
    if (val >= goodThreshold) return 'positive' as const;
    if (val >= neutralThreshold) return 'neutral' as const;
    return 'negative' as const;
  };

  const pp = stats.playerPerformance;
  const playerClub = isHome ? matchResult.homeClub : matchResult.awayClub;
  const oppClub = isHome ? matchResult.awayClub : matchResult.homeClub;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overlay backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
          role="button"
          tabIndex={0}
          aria-label="Close match stats popup"
        />

        {/* Popup content */}
        <motion.div
          className="relative bg-[#0d1117] border border-[#30363d] rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-thin mx-2 mb-2 sm:mb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-[#c9d1d9]">Match Statistics</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#21262d] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[#8b949e]" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Match Score Summary */}
            <motion.div
              className="flex items-center justify-center gap-4 bg-[#161b22] rounded-lg border border-[#30363d] p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.25 }}
            >
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <span className="text-xl">{playerClub.logo}</span>
                <span className="text-[10px] text-[#c9d1d9] font-semibold truncate max-w-[70px]">
                  {playerClub.shortName || playerClub.name.slice(0, 3)}
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-wider">
                {matchResult.homeClub.id === playerClub.id ? matchResult.homeScore : matchResult.awayScore}
                <span className="text-[#484f58]"> - </span>
                {matchResult.homeClub.id === playerClub.id ? matchResult.awayScore : matchResult.homeScore}
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <span className="text-xl">{oppClub.logo}</span>
                <span className="text-[10px] text-[#c9d1d9] font-semibold truncate max-w-[70px]">
                  {oppClub.shortName || oppClub.name.slice(0, 3)}
                </span>
              </div>
            </motion.div>

            {/* a) Possession */}
            <SectionCard title="Possession" icon={<Target className="w-3.5 h-3.5" />} delay={0.1}>
              <div className="flex justify-center py-2">
                <PossessionDonut
                  playerPct={stats.possession.player}
                  opponentPct={stats.possession.opponent}
                />
              </div>
            </SectionCard>

            {/* b) Shots */}
            <SectionCard title="Shots" icon={<Target className="w-3.5 h-3.5" />} delay={0.15}>
              <div className="space-y-3">
                <ComparisonBar
                  label="Total Shots"
                  playerValue={stats.shots.playerTotal}
                  opponentValue={stats.shots.opponentTotal}
                  delay={0.2}
                />
                <ComparisonBar
                  label="Shots on Target"
                  playerValue={stats.shots.playerOnTarget}
                  opponentValue={stats.shots.opponentOnTarget}
                  delay={0.25}
                />
                <ComparisonBar
                  label="Shots off Target"
                  playerValue={stats.shots.playerOffTarget}
                  opponentValue={stats.shots.opponentOffTarget}
                  delay={0.3}
                />
              </div>
            </SectionCard>

            {/* c) Passing */}
            <SectionCard title="Passing" icon={<Zap className="w-3.5 h-3.5" />} delay={0.2}>
              <div className="space-y-3">
                <ComparisonBar
                  label="Pass Accuracy"
                  playerValue={stats.passing.playerAccuracy}
                  opponentValue={stats.passing.opponentAccuracy}
                  isPercentage
                  delay={0.25}
                />
                <ComparisonBar
                  label="Total Passes"
                  playerValue={stats.passing.playerTotal}
                  opponentValue={stats.passing.opponentTotal}
                  delay={0.3}
                />
                <ComparisonBar
                  label="Key Passes"
                  playerValue={stats.passing.playerKeyPasses}
                  opponentValue={stats.passing.opponentKeyPasses}
                  delay={0.35}
                />
              </div>
            </SectionCard>

            {/* d) Discipline */}
            <SectionCard title="Discipline" icon={<AlertTriangle className="w-3.5 h-3.5" />} delay={0.25}>
              <div className="space-y-3 bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <DisciplineRow
                  label="Yellow Cards"
                  playerCount={stats.discipline.playerYellow}
                  opponentCount={stats.discipline.opponentYellow}
                  cardColor="yellow"
                  cardEmoji="🟨"
                  delay={0.3}
                />
                <div className="h-px bg-[#30363d]" />
                <DisciplineRow
                  label="Red Cards"
                  playerCount={stats.discipline.playerRed}
                  opponentCount={stats.discipline.opponentRed}
                  cardColor="red"
                  cardEmoji="🟥"
                  delay={0.35}
                />
              </div>
            </SectionCard>

            {/* e) Player Performance */}
            <SectionCard title="Your Performance" icon={<Activity className="w-3.5 h-3.5" />} delay={0.3}>
              {matchResult.playerMinutesPlayed > 0 ? (
                <div className="space-y-3">
                  {/* Rating display */}
                  <motion.div
                    className="flex items-center justify-center gap-2 bg-[#0d1117] rounded-lg p-3 border border-[#30363d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.25 }}
                  >
                    <span
                      className="text-3xl font-black tabular-nums"
                      style={{
                        color: pp.rating >= 7 ? '#10b981' : pp.rating >= 6 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {pp.rating.toFixed(1)}
                    </span>
                    <Badge
                      className="text-[9px] font-bold border-0"
                      style={{
                        backgroundColor: pp.rating >= 7 ? 'rgba(16,185,129,0.15)' : pp.rating >= 6 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: pp.rating >= 7 ? '#10b981' : pp.rating >= 6 ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      RATING
                    </Badge>
                  </motion.div>
                  {/* Stat pills grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <PerformanceStat
                      icon={<Target className="w-3.5 h-3.5" />}
                      label="Goals"
                      value={pp.goals}
                      color={perfColor(pp.goals, 1, 0)}
                      delay={0.4}
                    />
                    <PerformanceStat
                      icon={<Zap className="w-3.5 h-3.5" />}
                      label="Assists"
                      value={pp.assists}
                      color={perfColor(pp.assists, 1, 0)}
                      delay={0.42}
                    />
                    <PerformanceStat
                      icon={<Shield className="w-3.5 h-3.5" />}
                      label="Passes"
                      value={pp.passes}
                      color={perfColor(pp.passes, 40, 25)}
                      delay={0.44}
                    />
                    <PerformanceStat
                      icon={<TrendingUp className="w-3.5 h-3.5" />}
                      label="Tackles"
                      value={pp.tackles}
                      color={perfColor(pp.tackles, 4, 2)}
                      delay={0.46}
                    />
                  </div>
                  {/* Distance covered */}
                  <motion.div
                    className="flex items-center justify-center gap-2 bg-[#0d1117] rounded-lg px-3 py-2 border border-[#30363d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.48, duration: 0.25 }}
                  >
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Distance:</span>
                    <span className="text-sm font-bold text-[#c9d1d9] tabular-nums">{pp.distance} km</span>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-[#484f58]">You did not play in this match.</p>
                </div>
              )}
            </SectionCard>

            {/* f) Match Momentum */}
            <SectionCard title="Match Momentum" icon={<TrendingUp className="w-3.5 h-3.5" />} delay={0.35}>
              <div className="flex justify-center py-1">
                <MomentumChart data={stats.momentum} />
              </div>
            </SectionCard>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.25 }}
            >
              <Button
                onClick={onClose}
                className="w-full h-10 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm"
              >
                Close
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
