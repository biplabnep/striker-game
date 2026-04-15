'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, Target, Zap, Shield, Activity,
  TrendingUp, Footprints, AlertTriangle,
  Crosshair, Users, Flame, BarChart3, MapPin,
  Gauge, Flag, Wind, LayoutGrid, Star,
} from 'lucide-react';
import type { MatchResult, Club } from '@/lib/game/types';

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
// Helper: deterministic seeded value
// -----------------------------------------------------------
function seededValue(seed: number, index: number, min: number, max: number): number {
  const hash = ((seed * 2654435761 + index * 40503 + 12345) >>> 0) % 1000;
  return min + (hash / 1000) * (max - min);
}

// -----------------------------------------------------------
// Helper: format SVG points string (avoids nested .map().join() in JSX)
// -----------------------------------------------------------
function formatSvgPoints(pts: Array<{ x: number; y: number }>): string {
  return pts.map(p => `${p.x},${p.y}`).join(' ');
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
  const gap = 4;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
        />
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
        <span className={`text-xs font-bold w-8 text-right tabular-nums ${playerHigher ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
          {displayPlayer}
        </span>
        <div className="flex-1 flex h-3 overflow-hidden rounded-md bg-[#21262d]">
          <motion.div
            className="bg-emerald-600 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${playerPct}%` }}
            transition={{ delay: delay + 0.1, duration: 0.35, ease: 'easeOut' }}
          />
          <div className="w-px bg-[#30363d]" />
          <div className="flex-1 flex justify-end">
            <motion.div
              className="bg-slate-600 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${opponentPct}%` }}
              transition={{ delay: delay + 0.15, duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
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
  const periods = data.length;
  const stepX = chartW / (periods - 1);

  const points = data.map((val, i) => ({
    x: padding + i * stepX,
    y: padding + chartH - ((val - 15) / 70) * chartH,
  }));

  const areaPath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
    + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const midY = padding + chartH - ((50 - 15) / 70) * chartH;

  const periodLabels = ['0-18\'', '18-36\'', '36-54\'', '54-72\'', '72-90\''];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[300px]"
      >
        <line
          x1={padding}
          y1={midY}
          x2={width - padding}
          y2={midY}
          stroke="#30363d"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <motion.path
          d={areaPath}
          fill="#10b981"
          fillOpacity={0.12}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
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
      <div className="flex w-full max-w-[300px] justify-between px-0">
        {periodLabels.map((lbl, i) => (
          <span key={i} className="text-[8px] text-[#484f58] font-mono">
            {lbl}
          </span>
        ))}
      </div>
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
// 1. SVG Shot Accuracy Scatter Plot
// -----------------------------------------------------------
function ShotAccuracyScatter({ stats }: { stats: ExtendedMatchStats }) {
  const width = 320;
  const height = 180;
  const padL = 35;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const totalShots = stats.shots.playerTotal;
  const onTarget = stats.shots.playerOnTarget;
  const seed = totalShots * 7 + onTarget * 3;

  const dots = Array.from({ length: 12 }, (_, i) => {
    const dist = seededValue(seed, i, 5, 32);
    const accBase = 100 - dist * 2;
    const accOffset = seededValue(seed, i + 20, -25, 25);
    const accuracy = Math.max(5, Math.min(98, accBase + accOffset));
    const hitTarget = i < onTarget;
    return {
      x: padL + (dist / 35) * chartW,
      y: padT + chartH - (accuracy / 100) * chartH,
      hitTarget,
      dist: Math.round(dist),
      acc: Math.round(accuracy),
    };
  });

  const xTicks = [0, 10, 20, 30];
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {yTicks.map(tick => {
        const yy = padT + chartH - (tick / 100) * chartH;
        return (
          <line key={`y-${tick}`} x1={padL} y1={yy} x2={padL + chartW} y2={yy} stroke="#21262d" strokeWidth={1} />
        );
      })}
      {xTicks.map(tick => {
        const xx = padL + (tick / 35) * chartW;
        return (
          <line key={`x-${tick}`} x1={xx} y1={padT} x2={xx} y2={padT + chartH} stroke="#21262d" strokeWidth={1} />
        );
      })}
      {/* Axis lines */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      {/* Y-axis labels */}
      {yTicks.map(tick => {
        const yy = padT + chartH - (tick / 100) * chartH;
        return (
          <text key={`yl-${tick}`} x={padL - 4} y={yy} fill="#484f58" fontSize={7} textAnchor="end" dominantBaseline="middle">
            {tick}%
          </text>
        );
      })}
      {/* X-axis labels */}
      {xTicks.map(tick => {
        const xx = padL + (tick / 35) * chartW;
        return (
          <text key={`xl-${tick}`} x={xx} y={padT + chartH + 12} fill="#484f58" fontSize={7} textAnchor="middle" dominantBaseline="hanging">
            {tick}y
          </text>
        );
      })}
      {/* Scatter dots */}
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={4}
          fill={dot.hitTarget ? '#10b981' : '#ef4444'}
          fillOpacity={0.85}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.05, duration: 0.2 }}
        />
      ))}
      {/* Axis titles */}
      <text x={padL + chartW / 2} y={height - 3} fill="#8b949e" fontSize={8} textAnchor="middle">Distance</text>
      {/* Legend */}
      <circle cx={padL + 5} cy={padT + 2} r={3} fill="#10b981" />
      <text x={padL + 11} y={padT + 2} fill="#8b949e" fontSize={7} dominantBaseline="middle">On Target</text>
      <circle cx={padL + 60} cy={padT + 2} r={3} fill="#ef4444" />
      <text x={padL + 66} y={padT + 2} fill="#8b949e" fontSize={7} dominantBaseline="middle">Off Target</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 2. SVG Pass Network Mini Diagram
// -----------------------------------------------------------
function PassNetworkDiagram({ stats }: { stats: ExtendedMatchStats }) {
  const width = 280;
  const height = 220;

  const seed = stats.passing.playerTotal * 3 + stats.passing.playerKeyPasses * 7;

  const positions = [
    { label: 'GK', x: 140, y: 200 },
    { label: 'LB', x: 40, y: 160 },
    { label: 'CB', x: 100, y: 170 },
    { label: 'CB', x: 180, y: 170 },
    { label: 'RB', x: 240, y: 160 },
    { label: 'LM', x: 30, y: 100 },
    { label: 'CM', x: 120, y: 110 },
    { label: 'RM', x: 250, y: 100 },
  ];

  const connections = [
    { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }, { from: 0, to: 4 },
    { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    { from: 1, to: 5 }, { from: 2, to: 6 }, { from: 3, to: 6 }, { from: 4, to: 7 },
    { from: 5, to: 6 }, { from: 6, to: 7 },
  ];

  const passFreqs = connections.map((_, i) =>
    Math.round(seededValue(seed, i, 3, 18))
  );

  const nodeSizes = positions.map((_, i) =>
    5 + seededValue(seed, i + 50, 0, 6)
  );

  const maxFreq = Math.max(...passFreqs, 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Connections */}
      {connections.map((conn, i) => (
        <line
          key={`conn-${i}`}
          x1={positions[conn.from].x}
          y1={positions[conn.from].y}
          x2={positions[conn.to].x}
          y2={positions[conn.to].y}
          stroke="#10b981"
          strokeWidth={Math.max(0.5, (passFreqs[i] / maxFreq) * 4)}
          strokeOpacity={0.3 + (passFreqs[i] / maxFreq) * 0.5}
        />
      ))}
      {/* Nodes */}
      {positions.map((pos, i) => (
        <g key={`node-${i}`}>
          <circle cx={pos.x} cy={pos.y} r={nodeSizes[i]} fill="#161b22" stroke="#10b981" strokeWidth={1.5} />
          <text
            x={pos.x}
            y={pos.y + nodeSizes[i] + 10}
            fill="#8b949e"
            fontSize={8}
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {pos.label}
          </text>
        </g>
      ))}
      {/* Frequency label */}
      <text x={width - 5} y={10} fill="#484f58" fontSize={7} textAnchor="end">Line width = pass freq.</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 3. SVG Player Heatmap Mini (4×5 grid)
// -----------------------------------------------------------
function PlayerHeatmap({ stats }: { stats: ExtendedMatchStats }) {
  const width = 280;
  const height = 200;
  const cols = 5;
  const rows = 4;
  const cellW = width / cols;
  const cellH = height / rows;

  const seed = stats.playerPerformance.distance * 10 + stats.possession.player;

  const intensityGrid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const raw = seededValue(seed, row * cols + col, 0, 100);
      const centerBonus = (2 - Math.abs(col - 2)) * 8 + (2 - Math.abs(row - 1.5)) * 5;
      return Math.max(0, Math.min(100, raw * 0.5 + centerBonus * 2 + stats.possession.player * 0.3));
    })
  );

  const getHeatColor = (val: number): string => {
    if (val > 75) return '#10b981';
    if (val > 55) return '#065f46';
    if (val > 35) return '#1e3a2f';
    if (val > 15) return '#21262d';
    return '#161b22';
  };

  const zoneLabels = ['Def', 'Def', 'Mid', 'Mid'];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Pitch outline */}
      <rect x={0} y={0} width={width} height={height} fill="none" stroke="#30363d" strokeWidth={1} />
      {/* Center line */}
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#30363d" strokeWidth={0.5} />
      {/* Heat cells */}
      {intensityGrid.map((row, ri) =>
        row.map((val, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellW}
            y={ri * cellH}
            width={cellW}
            height={cellH}
            fill={getHeatColor(val)}
            fillOpacity={0.7}
            stroke="#30363d"
            strokeWidth={0.5}
          />
        ))
      )}
      {/* Zone labels */}
      {zoneLabels.map((lbl, i) => (
        <text
          key={`zone-${i}`}
          x={4}
          y={i * cellH + cellH / 2}
          fill="#484f58"
          fontSize={7}
          dominantBaseline="middle"
        >
          {lbl}
        </text>
      ))}
      {/* Legend */}
      <rect x={width - 80} y={height - 18} width={8} height={8} fill="#10b981" fillOpacity={0.7} />
      <text x={width - 68} y={height - 14} fill="#8b949e" fontSize={7} dominantBaseline="middle">High</text>
      <rect x={width - 45} y={height - 18} width={8} height={8} fill="#21262d" fillOpacity={0.7} />
      <text x={width - 33} y={height - 14} fill="#8b949e" fontSize={7} dominantBaseline="middle">Low</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 4. SVG Expected Goals (xG) vs Actual — Dual bar chart
// -----------------------------------------------------------
function ExpectedGoalsChart({ stats }: { stats: ExtendedMatchStats }) {
  const width = 300;
  const height = 170;
  const padL = 35;
  const padR = 10;
  const padT = 15;
  const padB = 35;
  const chartH = height - padT - padB;
  const barGroupW = (width - padL - padR) / 2;
  const barW = barGroupW * 0.3;
  const gap = barGroupW * 0.08;

  const playerGoals = stats.playerPerformance.goals;
  const oppGoals = stats.shots.opponentTotal > 0
    ? Math.round(stats.shots.opponentOnTarget * 0.3)
    : 0;
  const playerXg = Math.max(0.2, +(stats.shots.playerOnTarget * 0.35 + stats.shots.playerTotal * 0.04).toFixed(1));
  const oppXg = Math.max(0.2, +(stats.shots.opponentOnTarget * 0.35 + stats.shots.opponentTotal * 0.04).toFixed(1));

  const maxVal = Math.max(playerGoals, oppGoals, playerXg, oppXg, 1);
  const yTicks = [0, 0.5, 1, 1.5, 2, 2.5, 3].filter(v => v <= maxVal + 0.5);

  const bars = [
    { label: 'Your xG', value: playerXg, color: '#10b981', group: 0 },
    { label: 'Your Goals', value: playerGoals, color: '#34d399', group: 0 },
    { label: 'Opp xG', value: oppXg, color: '#64748b', group: 1 },
    { label: 'Opp Goals', value: oppGoals, color: '#94a3b8', group: 1 },
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Y-axis gridlines */}
      {yTicks.map(tick => {
        const yy = padT + chartH - (tick / (maxVal + 0.5)) * chartH;
        return (
          <g key={`yt-${tick}`}>
            <line x1={padL} y1={yy} x2={width - padR} y2={yy} stroke="#21262d" strokeWidth={0.5} />
            <text x={padL - 4} y={yy} fill="#484f58" fontSize={7} textAnchor="end" dominantBaseline="middle">
              {tick % 1 === 0 ? String(tick) : tick.toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* Axis lines */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      <line x1={padL} y1={padT + chartH} x2={width - padR} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      {/* Bars */}
      {bars.map((bar, i) => {
        const groupX = padL + bar.group * barGroupW + barGroupW * 0.25;
        const barX = groupX + (i % 2) * (barW + gap);
        const barH = (bar.value / (maxVal + 0.5)) * chartH;
        return (
          <motion.rect
            key={i}
            x={barX}
            y={padT + chartH - barH}
            width={barW}
            height={barH}
            fill={bar.color}
            fillOpacity={0.85}
            rx={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
          />
        );
      })}
      {/* Bar value labels */}
      {bars.map((bar, i) => {
        const groupX = padL + bar.group * barGroupW + barGroupW * 0.25;
        const barX = groupX + (i % 2) * (barW + gap);
        const barH = (bar.value / (maxVal + 0.5)) * chartH;
        return (
          <text
            key={`vl-${i}`}
            x={barX + barW / 2}
            y={padT + chartH - barH - 4}
            fill="#c9d1d9"
            fontSize={7}
            textAnchor="middle"
            dominantBaseline="text-after-edge"
          >
            {bar.value % 1 === 0 ? String(bar.value) : bar.value.toFixed(1)}
          </text>
        );
      })}
      {/* Group labels */}
      <text x={padL + barGroupW * 0.5} y={height - 5} fill="#8b949e" fontSize={8} textAnchor="middle">Your Team</text>
      <text x={padL + barGroupW * 1.5} y={height - 5} fill="#8b949e" fontSize={8} textAnchor="middle">Opponent</text>
      {/* Legend */}
      <rect x={padL} y={padT} width={8} height={4} fill="#10b981" />
      <text x={padL + 11} y={padT + 4} fill="#8b949e" fontSize={6} dominantBaseline="middle">xG</text>
      <rect x={padL + 30} y={padT} width={8} height={4} fill="#34d399" />
      <text x={padL + 41} y={padT + 4} fill="#8b949e" fontSize={6} dominantBaseline="middle">Goals</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 5. SVG Key Pass Locations — Mini pitch with dots
// -----------------------------------------------------------
function KeyPassLocations({ stats }: { stats: ExtendedMatchStats }) {
  const width = 280;
  const height = 180;
  const pitchPad = 15;

  const seed = stats.passing.playerKeyPasses * 13 + stats.passing.playerTotal;

  const keyPasses = Array.from({ length: 8 }, (_, i) => ({
    x: pitchPad + seededValue(seed, i, 20, width - pitchPad * 2 - 20),
    y: pitchPad + seededValue(seed, i + 10, 15, height - pitchPad * 2 - 15),
    size: 3 + seededValue(seed, i + 20, 0, 4),
  }));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Pitch background */}
      <rect x={pitchPad} y={pitchPad} width={width - pitchPad * 2} height={height - pitchPad * 2} fill="#0d1117" stroke="#30363d" strokeWidth={1} />
      {/* Center line */}
      <line x1={width / 2} y1={pitchPad} x2={width / 2} y2={height - pitchPad} stroke="#30363d" strokeWidth={0.5} />
      {/* Center circle */}
      <circle cx={width / 2} cy={height / 2} r={18} fill="none" stroke="#30363d" strokeWidth={0.5} />
      {/* Penalty areas */}
      <rect x={pitchPad} y={(height - 60) / 2} width={35} height={60} fill="none" stroke="#30363d" strokeWidth={0.5} />
      <rect x={width - pitchPad - 35} y={(height - 60) / 2} width={35} height={60} fill="none" stroke="#30363d" strokeWidth={0.5} />
      {/* Goal boxes */}
      <rect x={pitchPad} y={(height - 28) / 2} width={12} height={28} fill="none" stroke="#30363d" strokeWidth={0.5} />
      <rect x={width - pitchPad - 12} y={(height - 28) / 2} width={12} height={28} fill="none" stroke="#30363d" strokeWidth={0.5} />
      {/* Lines from each key pass to center (faint) */}
      {keyPasses.map((kp, i) => (
        <line
          key={`line-${i}`}
          x1={width / 2}
          y1={height / 2}
          x2={kp.x}
          y2={kp.y}
          stroke="#f59e0b"
          strokeWidth={0.5}
          strokeOpacity={0.25}
        />
      ))}
      {/* Key pass dots */}
      {keyPasses.map((kp, i) => (
        <motion.circle
          key={`dot-${i}`}
          cx={kp.x}
          cy={kp.y}
          r={kp.size}
          fill="#f59e0b"
          fillOpacity={0.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.06, duration: 0.2 }}
        />
      ))}
      {/* Label */}
      <text x={width - pitchPad} y={height - 3} fill="#484f58" fontSize={6} textAnchor="end">{stats.passing.playerKeyPasses} key passes</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 6. SVG Pressing Intensity Bars
// -----------------------------------------------------------
function PressingIntensityBars({ stats }: { stats: ExtendedMatchStats }) {
  const width = 300;
  const height = 150;
  const padL = 55;
  const padR = 35;
  const padT = 10;
  const padB = 25;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const barH = 14;
  const barGap = (chartH - barH * 5) / 4;

  const seed = stats.playerPerformance.tackles * 11 + stats.possession.player;
  const periods = ['0-18\'', '18-36\'', '36-54\'', '54-72\'', '72-90\''];

  const values = periods.map((_, i) => {
    const momFactor = (stats.momentum[i] ?? 50) / 100;
    const base = 30 + momFactor * 40 + seededValue(seed, i, -10, 10);
    return Math.max(10, Math.min(95, Math.round(base)));
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Background bars */}
      {values.map((_, i) => {
        const yy = padT + i * (barH + barGap);
        return (
          <rect key={`bg-${i}`} x={padL} y={yy} width={chartW} height={barH} fill="#21262d" rx={3} />
        );
      })}
      {/* Value bars */}
      {values.map((val, i) => {
        const yy = padT + i * (barH + barGap);
        const barWidth = (val / 100) * chartW;
        const color = val > 70 ? '#10b981' : val > 45 ? '#f59e0b' : '#ef4444';
        return (
          <motion.rect
            key={`bar-${i}`}
            x={padL}
            y={yy}
            width={barWidth}
            height={barH}
            fill={color}
            fillOpacity={0.8}
            rx={3}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
          />
        );
      })}
      {/* Period labels */}
      {periods.map((lbl, i) => {
        const yy = padT + i * (barH + barGap) + barH / 2;
        return (
          <text key={`lbl-${i}`} x={padL - 4} y={yy} fill="#8b949e" fontSize={8} textAnchor="end" dominantBaseline="middle">
            {lbl}
          </text>
        );
      })}
      {/* Value labels */}
      {values.map((val, i) => {
        const yy = padT + i * (barH + barGap) + barH / 2;
        const barWidth = (val / 100) * chartW;
        return (
          <text key={`val-${i}`} x={padL + barWidth + 4} y={yy} fill="#c9d1d9" fontSize={8} textAnchor="start" dominantBaseline="middle">
            {val}%
          </text>
        );
      })}
    </svg>
  );
}

// -----------------------------------------------------------
// 7. SVG Duel Success Rate Donut
// -----------------------------------------------------------
function DuelSuccessDonut({ stats }: { stats: ExtendedMatchStats }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 65;
  const innerR = 40;
  const ringWidth = outerR - innerR;
  const midR = innerR + ringWidth / 2;

  const pp = stats.playerPerformance;
  const tackleRate = Math.min(92, Math.max(28, Math.round((pp.tackles / Math.max(1, pp.tackles + 2)) * 100)));
  const aerialRate = Math.min(88, Math.max(25, 42 + (stats.shots.playerTotal - stats.shots.opponentTotal) * 3));
  const interceptRate = Math.min(90, Math.max(22, 48 + (stats.passing.playerAccuracy - stats.passing.opponentAccuracy) * 0.6));

  const segments = [
    { label: 'Tackle', rate: tackleRate, color: '#10b981' },
    { label: 'Aerial', rate: aerialRate, color: '#f59e0b' },
    { label: 'Intercept', rate: interceptRate, color: '#64748b' },
  ];

  const gapAngle = 0.06;
  const totalGap = gapAngle * segments.length;
  const availableAngle = 2 * Math.PI - totalGap;

  const sectorPaths = segments.reduce<Array<{
    d: string;
    midAngle: number;
    segment: typeof segments[number];
  }>>((acc, seg, i) => {
    const prevEnd = i === 0 ? -Math.PI / 2 : acc[i - 1].midAngle + (availableAngle / segments.length) / 2 + gapAngle / 2;
    const startAngle = prevEnd + gapAngle / 2;
    const arcAngle = availableAngle / segments.length;
    const endAngle = startAngle + arcAngle;
    const midAngle = startAngle + arcAngle / 2;

    const outerStart = { x: cx + outerR * Math.cos(startAngle), y: cy + outerR * Math.sin(startAngle) };
    const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
    const innerStart = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };
    const innerEnd = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
    const largeArc = arcAngle > Math.PI ? 1 : 0;

    const d = `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;

    return [...acc, { d, midAngle, segment: seg }];
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-full">
      {/* Donut segments */}
      {sectorPaths.map((sp, i) => (
        <motion.path
          key={i}
          d={sp.d}
          fill={sp.segment.color}
          fillOpacity={0.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 6} fill="#e6edf3" fontSize={12} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
        {Math.round((tackleRate + aerialRate + interceptRate) / 3)}%
      </text>
      <text x={cx} y={cy + 8} fill="#8b949e" fontSize={7} textAnchor="middle" dominantBaseline="middle">
        AVG
      </text>
      {/* Labels around the donut */}
      {sectorPaths.map((sp, i) => {
        const labelR = outerR + 14;
        const lx = cx + labelR * Math.cos(sp.midAngle);
        const ly = cy + labelR * Math.sin(sp.midAngle);
        const anchor = Math.abs(Math.cos(sp.midAngle)) < 0.15
          ? "middle" as "start" | "middle" | "end"
          : Math.cos(sp.midAngle) > 0
            ? "start" as "start" | "middle" | "end"
            : "end" as "start" | "middle" | "end";
        return (
          <g key={`lbl-${i}`}>
            <text x={lx} y={ly - 4} fill={sp.segment.color} fontSize={8} fontWeight="bold" textAnchor={anchor} dominantBaseline="middle">
              {sp.segment.rate}%
            </text>
            <text x={lx} y={ly + 6} fill="#8b949e" fontSize={7} textAnchor={anchor} dominantBaseline="middle">
              {sp.segment.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -----------------------------------------------------------
// 8. SVG Set Piece Efficiency
// -----------------------------------------------------------
function SetPieceEfficiency({ stats, matchResult }: { stats: ExtendedMatchStats; matchResult: MatchResult }) {
  const width = 300;
  const height = 140;
  const padL = 75;
  const padR = 35;
  const padT = 10;
  const padB = 10;
  const chartW = width - padL - padR;
  const barH = 20;
  const barGap = 20;

  const corners = matchResult.events.filter(e => e.type === 'corner').length;
  const freeKicks = matchResult.events.filter(e => e.type === 'free_kick').length;
  const penalties = matchResult.events.filter(e => e.type === 'penalty_won' || e.type === 'penalty_missed').length;

  const seed = corners * 5 + freeKicks * 3 + penalties * 11;
  const items = [
    {
      label: 'Corners',
      total: Math.max(1, corners + Math.round(seededValue(seed, 0, 2, 5))),
      success: Math.max(0, Math.round(seededValue(seed, 1, 0, corners + 1))),
      color: '#10b981',
    },
    {
      label: 'Free Kicks',
      total: Math.max(1, freeKicks + Math.round(seededValue(seed, 2, 1, 4))),
      success: Math.max(0, Math.round(seededValue(seed, 3, 0, freeKicks + 1))),
      color: '#f59e0b',
    },
    {
      label: 'Penalties',
      total: Math.max(0, penalties),
      success: Math.max(0, penalties > 0 ? Math.round(seededValue(seed, 4, 0, 1)) : 0),
      color: '#64748b',
    },
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {items.map((item, i) => {
        const yy = padT + i * (barH + barGap);
        const successW = item.total > 0 ? (item.success / item.total) * chartW : 0;
        const failW = chartW - successW;
        return (
          <g key={i}>
            <text x={padL - 6} y={yy + barH / 2} fill="#8b949e" fontSize={9} textAnchor="end" dominantBaseline="middle">
              {item.label}
            </text>
            {/* Background */}
            <rect x={padL} y={yy} width={chartW} height={barH} fill="#21262d" rx={3} />
            {/* Success bar */}
            <motion.rect
              x={padL}
              y={yy}
              width={successW}
              height={barH}
              fill={item.color}
              fillOpacity={0.8}
              rx={3}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
            />
            {/* Label */}
            <text
              x={padL + chartW + 4}
              y={yy + barH / 2}
              fill="#c9d1d9"
              fontSize={8}
              dominantBaseline="middle"
            >
              {item.success}/{item.total}
            </text>
            {/* Success indicator */}
            {item.success > 0 && (
              <text
                x={padL + 6}
                y={yy + barH / 2}
                fill="#0d1117"
                fontSize={9}
                fontWeight="bold"
                dominantBaseline="middle"
              >
                ✓
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// -----------------------------------------------------------
// 9. SVG Player Sprint Speed Chart — Line chart
// -----------------------------------------------------------
function SprintSpeedChart({ stats }: { stats: ExtendedMatchStats }) {
  const width = 300;
  const height = 140;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const seed = stats.playerPerformance.distance * 5 + stats.playerPerformance.tackles;
  const periods = ['0-18\'', '18-36\'', '36-54\'', '54-72\'', '72-90\''];

  const sprintCounts = periods.map((_, i) =>
    Math.max(1, Math.round(seededValue(seed, i, 2, 12) + stats.momentum[i] * 0.03))
  );

  const maxSprints = Math.max(...sprintCounts, 1);

  const dataPoints = sprintCounts.map((val, i) => ({
    x: padL + (i / (periods.length - 1)) * chartW,
    y: padT + chartH - (val / maxSprints) * chartH,
  }));

  const linePath = dataPoints.reduce((acc, pt, i) => {
    const prefix = i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    return acc + prefix;
  }, '');

  const areaPath = linePath
    + ` L ${dataPoints[dataPoints.length - 1].x} ${padT + chartH} L ${dataPoints[0].x} ${padT + chartH} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const yy = padT + chartH - frac * chartH;
        const val = Math.round(frac * maxSprints);
        return (
          <g key={`grid-${i}`}>
            <line x1={padL} y1={yy} x2={padL + chartW} y2={yy} stroke="#21262d" strokeWidth={0.5} />
            <text x={padL - 4} y={yy} fill="#484f58" fontSize={7} textAnchor="end" dominantBaseline="middle">{val}</text>
          </g>
        );
      })}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#30363d" strokeWidth={1} />
      {/* Area */}
      <motion.path
        d={areaPath}
        fill="#f59e0b"
        fillOpacity={0.1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      />
      {/* Dots and labels */}
      {dataPoints.map((pt, i) => (
        <g key={`dp-${i}`}>
          <motion.circle
            cx={pt.x}
            cy={pt.y}
            r={3.5}
            fill="#f59e0b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.06, duration: 0.2 }}
          />
          <text x={pt.x} y={pt.y - 7} fill="#c9d1d9" fontSize={7} textAnchor="middle" dominantBaseline="text-after-edge">
            {sprintCounts[i]}
          </text>
        </g>
      ))}
      {/* Period labels */}
      {periods.map((lbl, i) => {
        const xx = padL + (i / (periods.length - 1)) * chartW;
        return (
          <text key={`pl-${i}`} x={xx} y={height - 5} fill="#484f58" fontSize={7} textAnchor="middle">
            {lbl}
          </text>
        );
      })}
      {/* Y-axis title */}
      <text x={8} y={padT + chartH / 2} fill="#484f58" fontSize={7} textAnchor="middle" dominantBaseline="middle">
        Sprints
      </text>
    </svg>
  );
}

// -----------------------------------------------------------
// 10. SVG Tactical Formation Overlay
// -----------------------------------------------------------
function TacticalFormationOverlay({ stats }: { stats: ExtendedMatchStats }) {
  const halfW = 130;
  const halfH = 165;
  const width = halfW * 2 + 20;
  const height = halfH + 30;

  const pitchPad = 8;
  const pw = halfW - pitchPad * 2;
  const ph = halfH - pitchPad * 2 - 12;

  // Player formation: 4-4-2
  const playerFormation = [
    { x: 0.5, y: 0.9, label: 'GK' },
    { x: 0.15, y: 0.7, label: 'LB' },
    { x: 0.38, y: 0.75, label: 'CB' },
    { x: 0.62, y: 0.75, label: 'CB' },
    { x: 0.85, y: 0.7, label: 'RB' },
    { x: 0.15, y: 0.45, label: 'LM' },
    { x: 0.38, y: 0.5, label: 'CM' },
    { x: 0.62, y: 0.5, label: 'CM' },
    { x: 0.85, y: 0.45, label: 'RM' },
    { x: 0.35, y: 0.2, label: 'ST' },
    { x: 0.65, y: 0.2, label: 'ST' },
  ];

  // Opponent formation: 4-3-3
  const oppFormation = [
    { x: 0.5, y: 0.1, label: 'GK' },
    { x: 0.15, y: 0.3, label: 'LB' },
    { x: 0.38, y: 0.25, label: 'CB' },
    { x: 0.62, y: 0.25, label: 'CB' },
    { x: 0.85, y: 0.3, label: 'RB' },
    { x: 0.3, y: 0.5, label: 'CM' },
    { x: 0.5, y: 0.48, label: 'CM' },
    { x: 0.7, y: 0.5, label: 'CM' },
    { x: 0.2, y: 0.75, label: 'LW' },
    { x: 0.5, y: 0.8, label: 'ST' },
    { x: 0.8, y: 0.75, label: 'RW' },
  ];

  const renderPitch = (ox: number, oy: number) => (
    <g>
      <rect x={ox} y={oy} width={pw} height={ph} fill="#0d1117" stroke="#30363d" strokeWidth={1} rx={2} />
      <line x1={ox} y1={oy + ph / 2} x2={ox + pw} y2={oy + ph / 2} stroke="#30363d" strokeWidth={0.5} />
      <circle cx={ox + pw / 2} cy={oy + ph / 2} r={12} fill="none" stroke="#30363d" strokeWidth={0.5} />
      <rect x={ox} y={oy + (ph - 36) / 2} width={18} height={36} fill="none" stroke="#30363d" strokeWidth={0.5} />
      <rect x={ox + pw - 18} y={oy + (ph - 36) / 2} width={18} height={36} fill="none" stroke="#30363d" strokeWidth={0.5} />
    </g>
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Left pitch — Player team */}
      {renderPitch(pitchPad, 15)}
      {playerFormation.map((pos, i) => (
        <g key={`p-${i}`}>
          <circle
            cx={pitchPad + pos.x * pw}
            cy={15 + pos.y * ph}
            r={5}
            fill="#10b981"
            fillOpacity={0.85}
            stroke="#10b981"
            strokeWidth={0.5}
          />
          <text
            x={pitchPad + pos.x * pw}
            y={15 + pos.y * ph}
            fill="#0d1117"
            fontSize={6}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {pos.label}
          </text>
        </g>
      ))}
      <text x={pitchPad + pw / 2} y={8} fill="#8b949e" fontSize={8} textAnchor="middle">Your Team (4-4-2)</text>

      {/* Right pitch — Opponent */}
      {renderPitch(halfW + 10 + pitchPad, 15)}
      {oppFormation.map((pos, i) => (
        <g key={`o-${i}`}>
          <circle
            cx={halfW + 10 + pitchPad + pos.x * pw}
            cy={15 + pos.y * ph}
            r={5}
            fill="#64748b"
            fillOpacity={0.85}
            stroke="#64748b"
            strokeWidth={0.5}
          />
          <text
            x={halfW + 10 + pitchPad + pos.x * pw}
            y={15 + pos.y * ph}
            fill="#0d1117"
            fontSize={6}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {pos.label}
          </text>
        </g>
      ))}
      <text x={halfW + 10 + pitchPad + pw / 2} y={8} fill="#8b949e" fontSize={8} textAnchor="middle">Opponent (4-3-3)</text>
    </svg>
  );
}

// -----------------------------------------------------------
// 11. SVG Match Rating Breakdown Radar
// -----------------------------------------------------------
function MatchRatingRadar({ stats }: { stats: ExtendedMatchStats }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2 + 5;
  const maxR = 75;
  const axes = 5;

  const pp = stats.playerPerformance;
  const values = [
    Math.min(1, Math.max(0, (pp.goals * 0.25 + pp.assists * 0.15 + stats.shots.playerOnTarget * 0.03) / 1.5)),
    Math.min(1, Math.max(0, pp.tackles / 5)),
    Math.min(1, Math.max(0, (stats.passing.playerAccuracy - 50) / 45)),
    Math.min(1, Math.max(0, pp.distance / 11)),
    Math.min(1, Math.max(0, (pp.rating - 4) / 6)),
  ];

  const labels = ['Attack', 'Defense', 'Passing', 'Physical', 'Mental'];
  const colors = ['#10b981', '#64748b', '#f59e0b', '#ef4444', '#8b5cf6'];

  const gridLevels = [0.33, 0.66, 1.0];

  const axisEndpoints = Array.from({ length: axes }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes;
    return {
      x: cx + maxR * Math.cos(angle),
      y: cy + maxR * Math.sin(angle),
    };
  });

  const valuePoints = values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes;
    return {
      x: cx + maxR * v * Math.cos(angle),
      y: cy + maxR * v * Math.sin(angle),
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-full">
      {/* Grid polygons */}
      {gridLevels.map((level, li) => {
        const pts = axisEndpoints.map(ap => ({
          x: cx + (ap.x - cx) * level,
          y: cy + (ap.y - cy) * level,
        }));
        return (
          <polygon
            key={`grid-${li}`}
            points={formatSvgPoints(pts)}
            fill="none"
            stroke="#21262d"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Axis lines */}
      {axisEndpoints.map((ap, i) => (
        <line key={`axis-${i}`} x1={cx} y1={cy} x2={ap.x} y2={ap.y} stroke="#21262d" strokeWidth={0.5} />
      ))}
      {/* Value polygon */}
      <motion.polygon
        points={formatSvgPoints(valuePoints)}
        fill="#10b981"
        fillOpacity={0.15}
        stroke="#10b981"
        strokeWidth={2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
      {/* Value dots */}
      {valuePoints.map((vp, i) => (
        <motion.circle
          key={`vdot-${i}`}
          cx={vp.x}
          cy={vp.y}
          r={3.5}
          fill={colors[i]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + i * 0.06, duration: 0.2 }}
        />
      ))}
      {/* Labels */}
      {axisEndpoints.map((ap, i) => {
        const labelR = maxR + 16;
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.15
          ? "middle" as "start" | "middle" | "end"
          : Math.cos(angle) > 0
            ? "start" as "start" | "middle" | "end"
            : "end" as "start" | "middle" | "end";
        const pctVal = Math.round(values[i] * 100);
        return (
          <g key={`rlbl-${i}`}>
            <text x={lx} y={ly - 5} fill={colors[i]} fontSize={9} fontWeight="bold" textAnchor={anchor} dominantBaseline="middle">
              {pctVal}%
            </text>
            <text x={lx} y={ly + 6} fill="#8b949e" fontSize={7} textAnchor={anchor} dominantBaseline="middle">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
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
  const stats = useMemo(
    () => generateExtendedStats(matchResult, isHome),
    [matchResult, isHome],
  );

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

            {/* 1. Shot Accuracy Scatter Plot */}
            <SectionCard title="Shot Accuracy" icon={<Crosshair className="w-3.5 h-3.5" />} delay={0.4}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <ShotAccuracyScatter stats={stats} />
              </div>
            </SectionCard>

            {/* 2. Pass Network Diagram */}
            <SectionCard title="Pass Network" icon={<Users className="w-3.5 h-3.5" />} delay={0.42}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <PassNetworkDiagram stats={stats} />
              </div>
            </SectionCard>

            {/* 3. Player Heatmap */}
            <SectionCard title="Positional Heatmap" icon={<Flame className="w-3.5 h-3.5" />} delay={0.44}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <PlayerHeatmap stats={stats} />
              </div>
            </SectionCard>

            {/* 4. Expected Goals vs Actual */}
            <SectionCard title="Expected Goals (xG)" icon={<BarChart3 className="w-3.5 h-3.5" />} delay={0.46}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <ExpectedGoalsChart stats={stats} />
              </div>
            </SectionCard>

            {/* 5. Key Pass Locations */}
            <SectionCard title="Key Pass Locations" icon={<MapPin className="w-3.5 h-3.5" />} delay={0.48}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <KeyPassLocations stats={stats} />
              </div>
            </SectionCard>

            {/* 6. Pressing Intensity */}
            <SectionCard title="Pressing Intensity" icon={<Gauge className="w-3.5 h-3.5" />} delay={0.5}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <PressingIntensityBars stats={stats} />
              </div>
            </SectionCard>

            {/* 7. Duel Success Rate Donut */}
            <SectionCard title="Duel Success Rate" icon={<Shield className="w-3.5 h-3.5" />} delay={0.52}>
              <div className="flex justify-center py-2">
                <DuelSuccessDonut stats={stats} />
              </div>
            </SectionCard>

            {/* 8. Set Piece Efficiency */}
            <SectionCard title="Set Piece Efficiency" icon={<Flag className="w-3.5 h-3.5" />} delay={0.54}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <SetPieceEfficiency stats={stats} matchResult={matchResult} />
              </div>
            </SectionCard>

            {/* 9. Sprint Speed Chart */}
            <SectionCard title="Sprint Activity" icon={<Wind className="w-3.5 h-3.5" />} delay={0.56}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <SprintSpeedChart stats={stats} />
              </div>
            </SectionCard>

            {/* 10. Tactical Formation */}
            <SectionCard title="Tactical Formations" icon={<LayoutGrid className="w-3.5 h-3.5" />} delay={0.58}>
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <TacticalFormationOverlay stats={stats} />
              </div>
            </SectionCard>

            {/* 11. Match Rating Radar */}
            <SectionCard title="Rating Breakdown" icon={<Star className="w-3.5 h-3.5" />} delay={0.6}>
              <div className="flex justify-center py-2">
                <MatchRatingRadar stats={stats} />
              </div>
            </SectionCard>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.25 }}
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
