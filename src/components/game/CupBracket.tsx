'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getClubById, CUP_NAMES, CUP_MATCH_WEEKS } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, XCircle, Crown, Swords, ChevronRight, Calendar, Users,
  CheckCircle2, Target, BarChart3, TrendingUp, MapPin, MinusCircle,
  Eye, Flame, Star, Zap, Home, Plane, Clock, Award, Flag, Activity,
  Compass, Cloud, BookOpen, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Fixture, MatchResult, MatchEvent } from '@/lib/game/types';

// ─── Round name helper ─────────────────────────────────────────────────
function getRoundName(round: number, totalRounds: number, teamsInRound?: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  // Show Round of N based on team count
  const t = teamsInRound ?? Math.pow(2, totalRounds - round + 1);
  if (t >= 64) return `Round of ${t}`;
  if (t === 32) return 'Round of 32';
  if (t === 16) return 'Round of 16';
  return `Round ${round}`;
}

function getRoundAbbrev(round: number, totalRounds: number, teamsInRound?: number): string {
  if (round === totalRounds) return 'F';
  if (round === totalRounds - 1) return 'SF';
  if (round === totalRounds - 2) return 'QF';
  const t = teamsInRound ?? Math.pow(2, totalRounds - round + 1);
  if (t === 32) return 'R32';
  if (t === 16) return 'R16';
  return `R${round}`;
}

// ─── Match result type for timeline ─────────────────────────────────────
interface CupRunMatch {
  round: number;
  roundName: string;
  opponent: string;
  opponentLogo: string;
  playerScore: number;
  opponentScore: number;
  result: 'W' | 'D' | 'L';
  isHome: boolean;
  playerGoals: number;
  playerAssists: number;
  playerRating: number;
  isKeyMoment: boolean;
  matchDate: string;
}

// ─── SVG bracket types ──────────────────────────────────────────────────
interface BracketMatch {
  fixture: Fixture;
  homeClub: { id: string; shortName: string; logo: string };
  awayClub: { id: string; shortName: string; logo: string };
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  isPlayerMatch: boolean;
  winnerId: string | null;
  roundIdx: number;
  matchIdx: number;
}

interface BracketRound {
  roundNum: number;
  name: string;
  abbrev: string;
  matches: BracketMatch[];
}

// ─── SVG Trophy Icon Component ──────────────────────────────────────────
function TrophyIcon({ size = 48, color = '#d97706' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8h20v2c0 4-2 7-5 9l1 5H18l1-5c-3-2-5-5-5-9V8z" fill={color} opacity="0.9"/>
      <path d="M14 10H8c0 6 3 10 8 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 10h6c0 6-3 10-8 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <rect x="18" y="24" width="12" height="4" rx="1" fill={color} opacity="0.7"/>
      <rect x="16" y="28" width="16" height="3" rx="1" fill={color} opacity="0.5"/>
      <rect x="14" y="31" width="20" height="4" rx="2" fill={color} opacity="0.8"/>
      {/* Star */}
      <path d="M24 4l1.5 3H29l-2.5 2 1 3L24 10l-3.5 2 1-3L19 7h3.5L24 4z" fill="#fbbf24" opacity="0.9"/>
    </svg>
  );
}

// ─── Mini Trophy for bracket winner ─────────────────────────────────────
function MiniTrophyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6h12v1.5c0 3-1.5 5-3.5 6.5l.7 3h-6.4l.7-3C11.5 12.5 10 10.5 10 7.5V6z" fill="#fbbf24"/>
      <path d="M10 7.5H6c0 4 2 7 6 8.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M22 7.5h4c0 4-2 7-6 8.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="17" width="8" height="2.5" rx="0.5" fill="#d97706"/>
      <rect x="10.5" y="19.5" width="11" height="2" rx="1" fill="#92400e"/>
      <rect x="9.5" y="21.5" width="13" height="3" rx="1.5" fill="#fbbf24"/>
      <path d="M16 2.5l1 2h2.2l-1.8 1.3.7 2.2L16 6.7l-2.1 1.3.7-2.2-1.8-1.3h2.2L16 2.5z" fill="#fef3c7"/>
    </svg>
  );
}

// ─── Deterministic goalscorer generator ────────────────────────────────
const GOALSCORERS: Record<string, string[]> = {
  default: ['Martinez', 'Silva', 'Fernandes', 'Müller', 'Lukaku', 'Son', 'Rashford', 'Saka', 'Rodriguez', 'Dybala'],
};

function getDeterministicGoalscorers(fixtureId: string, goals: number, team: string): { name: string; minute: number }[] {
  const scorers: { name: string; minute: number }[] = [];
  const names = GOALSCORERS.default;
  for (let i = 0; i < goals; i++) {
    const seed = fixtureId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 17 + (team === 'away' ? 7 : 0);
    const nameIdx = (seed * 31 + i * 13) % names.length;
    const minute = ((seed * 7 + i * 23) % 85) + 5;
    scorers.push({ name: names[nameIdx], minute });
  }
  return scorers.sort((a, b) => a.minute - b.minute);
}

function getDeterministicStats(fixtureId: string, side: string): { possession: number; shots: number; shotsOnTarget: number; passes: number; passAccuracy: number } {
  const seed = fixtureId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + (side === 'away' ? 42 : 0);
  const basePossession = 35 + ((seed * 7) % 30);
  const opponentBase = 35 + (((seed + 42) * 7) % 30);
  const totalBase = basePossession + opponentBase;
  const possession = Math.round((basePossession / totalBase) * 100);
  const shots = 5 + ((seed * 11) % 15);
  const shotsOnTarget = 2 + ((seed * 13) % (shots - 1));
  const passes = 250 + ((seed * 17) % 350);
  const passAccuracy = 65 + ((seed * 19) % 25);
  return { possession, shots, shotsOnTarget, passes, passAccuracy };
}

function getResultBadgeColor(result: string): string {
  switch (result) {
    case 'Winner': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Runner-Up': return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
    case 'Semi-Finalist': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Quarter-Finalist': return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    default: return 'bg-[#21262d] text-[#8b949e] border-[#30363d]';
  }
}

// ─── Stat Bar component for match detail ─────────────────────────────
function StatBar({ label, home, away, unit }: { label: string; home: number; away: number; unit: string }) {
  const total = home + away || 1;
  const homePct = Math.round((home / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="flex items-center gap-1.5 text-[9px]">
      <span className="w-7 text-right text-[#c9d1d9] tabular-nums font-medium">{home}{unit}</span>
      <div className="flex-1 flex h-1 rounded-sm overflow-hidden bg-[#0d1117]">
        <div className="h-full bg-emerald-500/50 rounded-l-sm" style={{ width: `${homePct}%`, minWidth: 2 }} />
        <div className="h-full bg-sky-500/50 rounded-r-sm" style={{ width: `${awayPct}%`, minWidth: 2 }} />
      </div>
      <span className="w-7 text-[#c9d1d9] tabular-nums font-medium">{away}{unit}</span>
      <span className="w-[52px] text-[#484f58] text-right text-[8px]">{label}</span>
    </div>
  );
}

// ─── 1. TournamentProgressRing ─────────────────────────────────────────
function TournamentProgressRing({
  roundReached,
  totalRounds,
  size = 80,
}: {
  roundReached: number;
  totalRounds: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(1, (size - 12) / 2);
  const strokeW = 5;
  const circumference = 2 * Math.PI * radius;
  const progress = totalRounds > 0 ? roundReached / totalRounds : 0;
  const dashLength = circumference * progress;
  const gapLength = circumference - dashLength;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#30363d"
        strokeWidth={strokeW}
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#FF5500"
        strokeWidth={strokeW}
        fill="none"
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        opacity={0.9}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#c9d1d9"
        fontSize={14}
        fontWeight={700}
        fontFamily="system-ui"
      >
        {roundReached}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#8b949e"
        fontSize={9}
        fontFamily="system-ui"
      >
        of {totalRounds}
      </text>
    </svg>
  );
}

// ─── 2. CupRunFormAreaChart ───────────────────────────────────────────
function CupRunFormAreaChart({
  ratings,
  width = 200,
  height = 60,
}: {
  ratings: number[];
  width?: number;
  height?: number;
}) {
  const padX = 8;
  const padY = 6;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const dataPoints = ratings.slice(-8);
  const maxR = 10;
  const minR = 4;

  const points = dataPoints.map((r, i) => {
    const x = padX + (dataPoints.length > 1 ? (i / (dataPoints.length - 1)) * chartW : chartW / 2);
    const clamped = Math.min(maxR, Math.max(minR, r));
    const y = padY + chartH - ((clamped - minR) / (maxR - minR)) * chartH;
    return { x, y };
  });

  const linePath = points.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    ''
  );
  const areaPath = points.length > 0
    ? `${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`
    : '';

  const dotElements = points.map((p, i) => (
    <circle key={`form-dot-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#00E5FF" opacity={0.9} />
  ));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <rect x={0} y={0} width={width} height={height} rx={4} fill="#0d1117" stroke="#30363d" strokeWidth={0.5} />
      <line x1={padX} y1={padY} x2={padX + chartW} y2={padY} stroke="#21262d" strokeWidth={0.5} strokeDasharray="2 2" />
      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#21262d" strokeWidth={0.5} />
      {areaPath && <path d={areaPath} fill="#00E5FF" opacity={0.15} />}
      {linePath && <path d={linePath} stroke="#00E5FF" strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {dotElements}
    </svg>
  );
}

// ─── 3. GoalDistributionDonut ─────────────────────────────────────────
function GoalDistributionDonut({
  groupGoals,
  knockoutGoals,
  qfGoals,
  sfGoals,
  size = 100,
}: {
  groupGoals: number;
  knockoutGoals: number;
  qfGoals: number;
  sfGoals: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = Math.max(1, (size - 8) / 2);
  const innerR = Math.max(1, outerR - 10);
  const segments = [
    { value: groupGoals, color: '#CCFF00', label: 'Group' },
    { value: knockoutGoals, color: '#FF5500', label: 'KO' },
    { value: qfGoals, color: '#00E5FF', label: 'QF' },
    { value: sfGoals, color: '#666666', label: 'SF' },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcPaths = segments.reduce<{ d: string; color: string; label: string; lx: number; ly: number; pct: number; angle: number }[]>((acc, seg, i) => {
    if (total === 0 || seg.value === 0) return acc;
    const prevEnd = acc.reduce((p, a) => p + a.angle, 0);
    const angle = (seg.value / total) * 2 * Math.PI;
    const startAngle = -Math.PI / 2 + prevEnd;
    const endAngle = startAngle + angle;
    const midAngle = startAngle + angle / 2;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);
    const labelR = outerR + 10;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    return [
      ...acc,
      {
        d: `M${x1},${y1} A${outerR},${outerR} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc} 0 ${x4},${y4} Z`,
        color: seg.color,
        label: seg.label,
        lx,
        ly,
        pct: Math.round((seg.value / total) * 100),
        angle,
      },
    ];
  }, []);

  return (
    <svg width={size + 20} height={size + 20} viewBox={`0 0 ${size + 20} ${size + 20}`} fill="none">
      {arcPaths.map((arc, i) => (
        <path key={`donut-seg-${i}`} d={arc.d} fill={arc.color} opacity={0.8} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#0d1117" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize={12} fontWeight={700} fontFamily="system-ui">
        {total}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize={7} fontFamily="system-ui">
        goals
      </text>
    </svg>
  );
}

// ─── 4. OpponentStrengthRadar ─────────────────────────────────────────
function OpponentStrengthRadar({
  stats,
  size = 120,
}: {
  stats: { attack: number; defense: number; midfield: number; setPieces: number; experience: number };
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = Math.max(1, (size - 24) / 2);
  const labels = ['ATT', 'DEF', 'MID', 'SP', 'EXP'];
  const values = [stats.attack, stats.defense, stats.midfield, stats.setPieces, stats.experience];
  const axes = labels.length;

  const axisAngles = labels.map((_, i) => (-Math.PI / 2) + (2 * Math.PI * i) / axes);
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const gridPolygons = gridLevels.map((level, li) => {
    const pts = axisAngles.map(a => {
      const px = cx + maxR * level * Math.cos(a);
      const py = cy + maxR * level * Math.sin(a);
      return `${px},${py}`;
    });
    return <polygon key={`radar-grid-${li}`} points={pts.join(' ')} fill="none" stroke="#21262d" strokeWidth={0.5} />;
  });

  const axisLines = axisAngles.map((a, i) => (
    <line key={`radar-axis-${i}`} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="#21262d" strokeWidth={0.5} />
  ));

  const dataPoints = values.map((v, i) => {
    const clamped = Math.min(100, Math.max(0, v));
    const r = (clamped / 100) * maxR;
    return { x: cx + r * Math.cos(axisAngles[i]), y: cy + r * Math.sin(axisAngles[i]) };
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labelElements = axisAngles.map((a, i) => {
    const labelR = maxR + 10;
    return (
      <text
        key={`radar-label-${i}`}
        x={cx + labelR * Math.cos(a)}
        y={cy + labelR * Math.sin(a) + 3}
        textAnchor="middle"
        fill="#8b949e"
        fontSize={7}
        fontFamily="system-ui"
      >
        {labels[i]}
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {gridPolygons}
      {axisLines}
      <polygon points={dataPolygon} fill="#FF5500" opacity={0.12} stroke="#FF5500" strokeWidth={1.5} />
      {dataPoints.map((p, i) => (
        <circle key={`radar-dot-${i}`} cx={p.x} cy={p.y} r={2} fill="#FF5500" />
      ))}
      {labelElements}
    </svg>
  );
}

// ─── 5. CupHistoryTimeline ────────────────────────────────────────────
function CupHistoryTimeline({
  results,
  width = 280,
  height = 50,
}: {
  results: { result: 'W' | 'D' | 'L'; label: string }[];
  width?: number;
  height?: number;
}) {
  const padX = 20;
  const padY = 16;
  const usable = width - padX * 2;
  const data = results.slice(-8);
  const nodeCount = data.length;

  const nodePositions = data.map((_, i) => ({
    x: nodeCount > 1 ? padX + (i / (nodeCount - 1)) * usable : padX + usable / 2,
    y: height / 2,
  }));

  const colorMap: Record<string, string> = { W: '#CCFF00', D: '#FF5500', L: '#666666' };

  const lineSegments = nodePositions.slice(0, -1).map((p, i) => (
    <line
      key={`timeline-line-${i}`}
      x1={p.x}
      y1={p.y}
      x2={nodePositions[i + 1].x}
      y2={nodePositions[i + 1].y}
      stroke="#CCFF00"
      strokeWidth={1.5}
      opacity={0.4}
    />
  ));

  const nodeElements = data.map((d, i) => {
    const pos = nodePositions[i];
    const fill = colorMap[d.result] || '#666666';
    return (
      <g key={`timeline-node-${i}`}>
        <circle cx={pos.x} cy={pos.y} r={5} fill="#0d1117" stroke={fill} strokeWidth={1.5} />
        <circle cx={pos.x} cy={pos.y} r={2} fill={fill} />
        <text
          x={pos.x}
          y={pos.y - 10}
          textAnchor="middle"
          fill={fill}
          fontSize={8}
          fontWeight={700}
          fontFamily="system-ui"
        >
          {d.result}
        </text>
        <text
          x={pos.x}
          y={pos.y + 16}
          textAnchor="middle"
          fill="#8b949e"
          fontSize={6}
          fontFamily="system-ui"
        >
          {d.label}
        </text>
      </g>
    );
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {lineSegments}
      {nodeElements}
    </svg>
  );
}

// ─── 6. UpsetProbabilityBars ──────────────────────────────────────────
function UpsetProbabilityBars({
  probabilities,
  labels,
  width = 180,
  height = 100,
}: {
  probabilities: number[];
  labels: string[];
  width?: number;
  height?: number;
}) {
  const padX = 48;
  const padY = 8;
  const barH = 12;
  const barGap = 6;
  const colors = ['#00E5FF', '#CCFF00', '#FF5500', '#666666', '#FF5500'];
  const data = probabilities.slice(0, 5).map((p, i) => ({
    label: labels[i] || '',
    value: Math.min(100, Math.max(0, p)),
    color: colors[i] || '#666666',
  }));

  const barElements = data.map((d, i) => {
    const y = padY + i * (barH + barGap);
    const barMaxW = width - padX - 32;
    const barW = (d.value / 100) * barMaxW;
    return (
      <g key={`upset-bar-${i}`}>
        <text
          x={padX - 4}
          y={y + barH / 2 + 3}
          textAnchor="end"
          fill="#8b949e"
          fontSize={8}
          fontFamily="system-ui"
        >
          {d.label}
        </text>
        <rect
          x={padX}
          y={y}
          width={barMaxW}
          height={barH}
          rx={2}
          fill="#161b22"
          stroke="#21262d"
          strokeWidth={0.5}
        />
        <rect
          x={padX}
          y={y}
          width={Math.max(1, barW)}
          height={barH}
          rx={2}
          fill={d.color}
          opacity={0.7}
        />
        <text
          x={padX + barMaxW + 4}
          y={y + barH / 2 + 3}
          fill="#c9d1d9"
          fontSize={8}
          fontWeight={600}
          fontFamily="system-ui"
        >
          {d.value}%
        </text>
      </g>
    );
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {barElements}
    </svg>
  );
}

// ─── 7. MatchDifficultyGauge ──────────────────────────────────────────
function MatchDifficultyGauge({
  difficulty,
  size = 100,
}: {
  difficulty: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size * 0.65;
  const radius = Math.max(1, (size - 16) / 2);
  const strokeW = 6;
  const clamped = Math.min(100, Math.max(0, difficulty));
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const sweepAngle = endAngle - startAngle;
  const valueAngle = startAngle + (clamped / 100) * sweepAngle;

  const bgArcPath = (() => {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    return `M${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2}`;
  })();

  const valueArcPath = (() => {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(valueAngle);
    const y2 = cy + radius * Math.sin(valueAngle);
    const largeArc = (valueAngle - startAngle) > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2}`;
  })();

  const indicatorX = cx + (radius - strokeW) * Math.cos(valueAngle);
  const indicatorY = cy + (radius - strokeW) * Math.sin(valueAngle);

  const label = clamped < 30 ? 'Easy' : clamped < 55 ? 'Medium' : clamped < 80 ? 'Hard' : 'Extreme';
  const labelColor = clamped < 30 ? '#CCFF00' : clamped < 55 ? '#c9d1d9' : clamped < 80 ? '#FF5500' : '#ef4444';

  return (
    <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.8}`} fill="none">
      <path d={bgArcPath} stroke="#30363d" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      <path d={valueArcPath} stroke="#CCFF00" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      <circle cx={indicatorX} cy={indicatorY} r={3} fill="#CCFF00" />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#c9d1d9"
        fontSize={18}
        fontWeight={700}
        fontFamily="system-ui"
      >
        {clamped}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill={labelColor}
        fontSize={9}
        fontWeight={600}
        fontFamily="system-ui"
      >
        {label}
      </text>
    </svg>
  );
}

// ─── 8. PathToFinalRadar ──────────────────────────────────────────────
function PathToFinalRadar({
  stats,
  size = 120,
}: {
  stats: { strength: number; fatigue: number; homeAdv: number; momentum: number; depth: number };
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = Math.max(1, (size - 24) / 2);
  const labels = ['STR', 'FAT', 'HOME', 'MOM', 'DEP'];
  const values = [stats.strength, 100 - stats.fatigue, stats.homeAdv, stats.momentum, stats.depth];
  const axes = labels.length;

  const axisAngles = labels.map((_, i) => (-Math.PI / 2) + (2 * Math.PI * i) / axes);
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const gridPolygons = gridLevels.map((level, li) => {
    const pts = axisAngles.map(a => {
      const px = cx + maxR * level * Math.cos(a);
      const py = cy + maxR * level * Math.sin(a);
      return `${px},${py}`;
    });
    return <polygon key={`path-grid-${li}`} points={pts.join(' ')} fill="none" stroke="#21262d" strokeWidth={0.5} />;
  });

  const axisLines = axisAngles.map((a, i) => (
    <line key={`path-axis-${i}`} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="#21262d" strokeWidth={0.5} />
  ));

  const dataPoints = values.map((v, i) => {
    const clamped = Math.min(100, Math.max(0, v));
    const r = (clamped / 100) * maxR;
    return { x: cx + r * Math.cos(axisAngles[i]), y: cy + r * Math.sin(axisAngles[i]) };
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labelElements = axisAngles.map((a, i) => {
    const labelR = maxR + 10;
    return (
      <text
        key={`path-label-${i}`}
        x={cx + labelR * Math.cos(a)}
        y={cy + labelR * Math.sin(a) + 3}
        textAnchor="middle"
        fill="#8b949e"
        fontSize={7}
        fontFamily="system-ui"
      >
        {labels[i]}
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {gridPolygons}
      {axisLines}
      <polygon points={dataPolygon} fill="#00E5FF" opacity={0.12} stroke="#00E5FF" strokeWidth={1.5} />
      {dataPoints.map((p, i) => (
        <circle key={`path-dot-${i}`} cx={p.x} cy={p.y} r={2} fill="#00E5FF" />
      ))}
      {labelElements}
    </svg>
  );
}

// ─── 9. CupGoalsTrendLine ─────────────────────────────────────────────
function CupGoalsTrendLine({
  goalsPerRound,
  width = 200,
  height = 60,
}: {
  goalsPerRound: number[];
  width?: number;
  height?: number;
}) {
  const padX = 8;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const data = goalsPerRound.slice(-8);
  const maxGoals = Math.max(1, ...data);

  const points = data.map((g, i) => {
    const x = padX + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2);
    const y = padY + chartH - (g / maxGoals) * chartH;
    return { x, y };
  });

  const linePath = points.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    ''
  );

  const goalLabels = data.map((g, i) => (
    <text
      key={`goal-label-${i}`}
      x={points[i].x}
      y={points[i].y - 5}
      textAnchor="middle"
      fill="#c9d1d9"
      fontSize={7}
      fontWeight={600}
      fontFamily="system-ui"
    >
      {g}
    </text>
  ));

  const dotElements = points.map((p, i) => (
    <circle key={`goal-dot-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#FF5500" opacity={0.9} />
  ));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <rect x={0} y={0} width={width} height={height} rx={4} fill="#0d1117" stroke="#30363d" strokeWidth={0.5} />
      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#21262d" strokeWidth={0.5} />
      {linePath && <path d={linePath} stroke="#FF5500" strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {dotElements}
      {goalLabels}
    </svg>
  );
}

// ─── 10. TrophyChanceRing ─────────────────────────────────────────────
function TrophyChanceRing({
  probability,
  size = 80,
}: {
  probability: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(1, (size - 12) / 2);
  const strokeW = 5;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, probability));
  const dashLength = (clamped / 100) * circumference;
  const gapLength = circumference - dashLength;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#30363d"
        strokeWidth={strokeW}
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#CCFF00"
        strokeWidth={strokeW}
        fill="none"
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        opacity={0.9}
      />
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        fill="#c9d1d9"
        fontSize={15}
        fontWeight={700}
        fontFamily="system-ui"
      >
        {clamped}%
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#8b949e"
        fontSize={7}
        fontFamily="system-ui"
      >
        TROPHY
      </text>
    </svg>
  );
}

// ─── 11. KnockoutStageDonut ───────────────────────────────────────────
function KnockoutStageDonut({
  r32,
  r16,
  qf,
  sf,
  size = 100,
}: {
  r32: number;
  r16: number;
  qf: number;
  sf: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = Math.max(1, (size - 8) / 2);
  const innerR = Math.max(1, outerR - 10);
  const segments = [
    { value: r32, color: '#FF5500', label: 'R32' },
    { value: r16, color: '#CCFF00', label: 'R16' },
    { value: qf, color: '#00E5FF', label: 'QF' },
    { value: sf, color: '#666666', label: 'SF' },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcPaths = segments.reduce<{ d: string; color: string; label: string; angle: number }[]>((acc, seg, i) => {
    if (total === 0 || seg.value === 0) return acc;
    const prevEnd = acc.reduce((p, a) => p + a.angle, 0);
    const angle = (seg.value / total) * 2 * Math.PI;
    const startAngle = -Math.PI / 2 + prevEnd;
    const endAngle = startAngle + angle;
    const midAngle = startAngle + angle / 2;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    return [
      ...acc,
      {
        d: `M${x1},${y1} A${outerR},${outerR} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc} 0 ${x4},${y4} Z`,
        color: seg.color,
        label: seg.label,
        angle,
      },
    ];
  }, []);

  const legendItems = segments.map((s, i) => (
    <g key={`ko-legend-${i}`}>
      <rect x={4} y={i * 10} width={6} height={6} rx={1} fill={s.color} opacity={0.8} />
      <text x={14} y={i * 10 + 5} fill="#8b949e" fontSize={6} fontFamily="system-ui">
        {s.label}: {s.value}
      </text>
    </g>
  ));

  return (
    <svg width={size + 30} height={size} viewBox={`0 0 ${size + 30} ${size}`} fill="none">
      {arcPaths.map((arc, i) => (
        <path key={`ko-seg-${i}`} d={arc.d} fill={arc.color} opacity={0.8} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#0d1117" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize={12} fontWeight={700} fontFamily="system-ui">
        {total}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize={7} fontFamily="system-ui">
        apps
      </text>
      <g>{legendItems}</g>
    </svg>
  );
}

export default function CupBracket() {
  const gameState = useGameStore(state => state.gameState);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<string | null>(null);

  // ─── Core cup info (existing, enhanced) ─────────────────────────────
  const cupInfo = useMemo(() => {
    if (!gameState) return null;

    const { cupFixtures, cupRound, cupEliminated, currentClub, currentWeek } = gameState;
    const cupData = CUP_NAMES[currentClub.league];
    if (!cupData) return null;

    // Calculate total rounds from fixtures
    const maxRound = cupFixtures.length > 0
      ? Math.max(...cupFixtures.map(f => f.matchday))
      : 1;

    // Group fixtures by round
    const rounds: { round: number; name: string; fixtures: Fixture[]; week: number }[] = [];
    for (let r = 1; r <= maxRound; r++) {
      const roundFixtures = cupFixtures.filter(f => f.matchday === r);
      const cupWeekIdx = r - 1;
      const week = cupWeekIdx < CUP_MATCH_WEEKS.length ? CUP_MATCH_WEEKS[cupWeekIdx] : r * 4;
      rounds.push({
        round: r,
        name: getRoundName(r, maxRound),
        fixtures: roundFixtures,
        week,
      });
    }

    // Find player's next cup match
    const playerNextCupMatch = cupFixtures.find(
      f => f.matchday === cupRound && !f.played &&
           (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );

    const nextCupOpponent = playerNextCupMatch
      ? getClubById(playerNextCupMatch.homeClubId === currentClub.id
          ? playerNextCupMatch.awayClubId
          : playerNextCupMatch.homeClubId)
      : null;

    // Check if player won the cup
    const isCupWinner = !cupEliminated && cupRound > maxRound;

    // Check if this is a cup week
    const isCupWeek = CUP_MATCH_WEEKS.includes(currentWeek);

    // Count remaining teams in current round
    const currentRoundFixtures = cupFixtures.filter(f => f.matchday === cupRound);
    const currentRoundPlayed = currentRoundFixtures.filter(f => f.played);

    return {
      cupName: cupData.name,
      cupEmoji: cupData.emoji,
      cupRound,
      maxRound,
      cupEliminated,
      isCupWinner,
      rounds,
      playerNextCupMatch,
      nextCupOpponent,
      isCupWeek,
      currentWeek,
      remainingTeams: currentRoundFixtures.length > 0 ? currentRoundFixtures.length * 2 : 0,
      currentRoundPlayed: currentRoundPlayed.length,
      currentRoundTotal: currentRoundFixtures.length,
      eliminatedRound: cupEliminated ? cupRound - 1 : null,
    };
  }, [gameState]);

  // ─── Cup run timeline — player's cup journey matches ────────────────
  const cupRunTimeline = useMemo((): CupRunMatch[] => {
    if (!gameState) return [];

    const playerClubId = gameState.currentClub.id;
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    return cupResults.map(result => {
      const isHome = result.homeClub.id === playerClubId;
      const opponent = isHome ? result.awayClub : result.homeClub;
      const playerScore = isHome ? result.homeScore : result.awayScore;
      const opponentScore = isHome ? result.awayScore : result.homeScore;

      let resultType: 'W' | 'D' | 'L';
      if (playerScore > opponentScore) resultType = 'W';
      else if (playerScore < opponentScore) resultType = 'L';
      else resultType = 'D';

      // Determine round from week
      const roundIdx = CUP_MATCH_WEEKS.findIndex(w => w === result.week);
      const round = roundIdx >= 0 ? roundIdx + 1 : 1;
      const maxRound = gameState.cupFixtures.length > 0
        ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
        : 1;

      return {
        round,
        roundName: getRoundName(round, maxRound),
        opponent: opponent.shortName,
        opponentLogo: opponent.logo,
        playerScore,
        opponentScore,
        result: resultType,
        isHome,
        playerGoals: result.playerGoals,
        playerAssists: result.playerAssists,
        playerRating: result.playerRating,
        isKeyMoment: result.playerGoals > 0 || result.playerAssists > 0,
        matchDate: `Season ${result.season}, Week ${result.week}`,
      };
    });
  }, [gameState]);

  // ─── Cup match score lookup (for non-player fixture scores) ─────────
  const cupMatchScoreLookup = useMemo(() => {
    if (!gameState) return new Map<string, { homeScore: number; awayScore: number }>();

    const lookup = new Map<string, { homeScore: number; awayScore: number }>();
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    for (const result of cupResults) {
      const key = `${result.homeClub.id}-${result.awayClub.id}`;
      lookup.set(key, {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
    }
    return lookup;
  }, [gameState]);

  // ─── Team form (last 3 W/D/L) for a club ────────────────────────────
  const teamFormLookup = useMemo(() => {
    if (!gameState) return new Map<string, ('W' | 'D' | 'L')[]>();

    const lookup = new Map<string, ('W' | 'D' | 'L')[]>();
    const allResults = gameState.recentResults;

    for (const result of allResults) {
      const homeId = result.homeClub.id;
      const awayId = result.awayClub.id;
      const homeWon = result.homeScore > result.awayScore;
      const draw = result.homeScore === result.awayScore;

      for (const [clubId, won] of [[homeId, homeWon], [awayId, !homeWon && !draw]] as [string, boolean][]) {
        if (!lookup.has(clubId)) lookup.set(clubId, []);
        const form = lookup.get(clubId)!;
        if (form.length < 3) {
          if (won) form.push('W');
          else if (draw) form.push('D');
          else form.push('L');
        }
      }
    }
    return lookup;
  }, [gameState]);

  // ─── Opponent scout data ─────────────────────────────────────────────
  const opponentScout = useMemo(() => {
    if (!cupInfo?.nextCupOpponent || !gameState) return null;

    const opponent = cupInfo.nextCupOpponent;
    const standing = gameState.leagueTable.find(s => s.clubId === opponent.id);

    const formDots: ('W' | 'D' | 'L')[] = [];
    if (standing) {
      const total = standing.won + standing.drawn + standing.lost;
      const wRatio = total > 0 ? standing.won / total : 0;
      const dRatio = total > 0 ? standing.drawn / total : 0;
      for (let i = 0; i < 5; i++) {
        const r = Math.random();
        if (r < wRatio) formDots.push('W');
        else if (r < wRatio + dRatio) formDots.push('D');
        else formDots.push('L');
      }
    }

    const avgGoalsScored = standing && standing.played > 0
      ? (standing.goalsFor / standing.played).toFixed(1)
      : '-';
    const avgGoalsConceded = standing && standing.played > 0
      ? (standing.goalsAgainst / standing.played).toFixed(1)
      : '-';

    return {
      club: opponent,
      position: standing ? standing.played > 0 ? standing.played : null : null,
      leaguePosition: standing
        ? gameState.leagueTable.findIndex(s => s.clubId === opponent.id) + 1
        : null,
      totalTeams: gameState.leagueTable.length,
      formDots,
      avgGoalsScored,
      avgGoalsConceded,
    };
  }, [cupInfo?.nextCupOpponent, gameState]);

  // ─── Cup statistics ──────────────────────────────────────────────────
  const cupStatistics = useMemo(() => {
    if (!gameState) return null;

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const cupGoals = cupResults.reduce((sum, r) => sum + r.playerGoals, 0);
    const cupAppearances = cupResults.length;
    const wins = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore > opponentScore;
    }).length;
    const winRate = cupAppearances > 0 ? Math.round((wins / cupAppearances) * 100) : 0;

    const playerClubId = gameState.currentClub.id;
    const playerCupFixtures = gameState.cupFixtures.filter(
      f => f.homeClubId === playerClubId || f.awayClubId === playerClubId
    );
    const maxRound = gameState.cupFixtures.length > 0
      ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
      : 1;

    const lastPlayedPlayerFixture = [...playerCupFixtures]
      .filter(f => f.played)
      .sort((a, b) => b.matchday - a.matchday)[0];

    const bestRun = lastPlayedPlayerFixture
      ? getRoundName(lastPlayedPlayerFixture.matchday, maxRound)
      : 'None yet';

    const losses = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore < opponentScore;
    }).length;
    const draws = cupAppearances - wins - losses;

    // MOTM count in cup
    const motmAwards = cupResults.filter(r => r.playerRating >= 8.0).length;

    // Best single-game rating
    const bestRating = cupResults.length > 0
      ? Math.max(...cupResults.map(r => r.playerRating))
      : 0;

    return {
      cupGoals,
      cupAppearances,
      wins,
      draws,
      losses,
      winRate,
      bestRun,
      cupAssists: cupResults.reduce((sum, r) => sum + r.playerAssists, 0),
      motmAwards,
      bestRating,
    };
  }, [gameState]);

  // ─── Historical cup performance (from seasons & trophies) ────────────
  const historicalPerformance = useMemo(() => {
    if (!gameState) return null;

    const cupTrophyNames = Object.values(CUP_NAMES).map(c => c.name);
    const careerTrophies = gameState.player.careerStats?.trophies || [];
    const cupTrophies = careerTrophies.filter(t =>
      cupTrophyNames.some(cn => cn === t.name)
    );

    const seasonHistory = gameState.seasons.map(s => ({
      season: s.number,
      year: s.year,
      bestRun: '-', // derived from current cup context if available
    }));

    return { cupTrophies, seasonHistory };
  }, [gameState]);

  // ─── Bracket tree data for SVG ───────────────────────────────────────
  const bracketData = useMemo((): { rounds: BracketRound[] } | null => {
    if (!cupInfo || !gameState) return null;

    const playerClubId = gameState.currentClub.id;
    const { rounds, maxRound } = cupInfo;

    const bracketRounds: BracketRound[] = rounds.map((rd, roundIdx) => {
      const matches: BracketMatch[] = rd.fixtures.map((fixture, matchIdx) => {
        const homeClub = getClubById(fixture.homeClubId);
        const awayClub = getClubById(fixture.awayClubId);

        const isPlayerMatch =
          fixture.homeClubId === playerClubId || fixture.awayClubId === playerClubId;

        // Score lookup
        const scoreKey = `${fixture.homeClubId}-${fixture.awayClubId}`;
        const scoreData = fixture.played ? cupMatchScoreLookup.get(scoreKey) : null;
        const reverseKey = `${fixture.awayClubId}-${fixture.homeClubId}`;
        const reverseScoreData = !scoreData && fixture.played
          ? cupMatchScoreLookup.get(reverseKey)
          : null;

        const finalScore = scoreData || (reverseScoreData ? {
          homeScore: reverseScoreData.awayScore,
          awayScore: reverseScoreData.homeScore,
        } : null);

        // Determine winner
        let winnerId: string | null = null;
        if (fixture.played && finalScore) {
          if (finalScore.homeScore > finalScore.awayScore) winnerId = fixture.homeClubId;
          else if (finalScore.awayScore > finalScore.homeScore) winnerId = fixture.awayClubId;
        }

        return {
          fixture,
          homeClub: homeClub ? { id: homeClub.id, shortName: homeClub.shortName, logo: homeClub.logo } : { id: fixture.homeClubId, shortName: 'TBD', logo: '❓' },
          awayClub: awayClub ? { id: awayClub.id, shortName: awayClub.shortName, logo: awayClub.logo } : { id: fixture.awayClubId, shortName: 'TBD', logo: '❓' },
          homeScore: finalScore ? finalScore.homeScore : null,
          awayScore: finalScore ? finalScore.awayScore : null,
          played: fixture.played,
          isPlayerMatch,
          winnerId,
          roundIdx,
          matchIdx,
        };
      });

      return {
        roundNum: rd.round,
        name: rd.name,
        abbrev: getRoundAbbrev(rd.round, maxRound),
        matches,
      };
    });

    return { rounds: bracketRounds };
  }, [cupInfo, gameState, cupMatchScoreLookup]);

  // ─── Tournament Overview Dashboard data ─────────────────────────────
  const tournamentOverview = useMemo(() => {
    if (!gameState || !cupInfo || !cupStatistics) return null;

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const goalsConceded = cupResults.reduce((sum, r) => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      return sum + (isHome ? r.awayScore : r.homeScore);
    }, 0);

    let totalOpponentPos = 0;
    let oppCount = 0;
    for (const result of cupResults) {
      const opponentId = result.homeClub.id === gameState.currentClub.id
        ? result.awayClub.id : result.homeClub.id;
      const oppIdx = gameState.leagueTable.findIndex(s => s.clubId === opponentId);
      if (oppIdx >= 0) {
        totalOpponentPos += oppIdx + 1;
        oppCount++;
      }
    }
    const totalTeams = gameState.leagueTable.length || 1;
    const difficulty = oppCount > 0
      ? Math.round(((totalTeams - totalOpponentPos / oppCount) / totalTeams) * 100)
      : 50;

    return {
      season: gameState.currentSeason,
      matchesPlayed: cupResults.length,
      goalsScored: cupStatistics.cupGoals,
      goalsConceded,
      difficulty,
      path: cupRunTimeline.map(m => ({
        round: m.roundName,
        opponent: m.opponent,
        opponentLogo: m.opponentLogo,
        result: m.result,
        score: `${m.playerScore}-${m.opponentScore}`,
      })),
    };
  }, [gameState, cupInfo, cupStatistics, cupRunTimeline]);

  // ─── Match Preview Panel data ──────────────────────────────────────
  const matchPreview = useMemo(() => {
    if (!gameState || !cupInfo?.playerNextCupMatch || !cupInfo.nextCupOpponent || cupInfo.cupEliminated || cupInfo.isCupWinner) return null;

    const opponent = cupInfo.nextCupOpponent;
    const playerClub = gameState.currentClub;
    const isHome = cupInfo.playerNextCupMatch.homeClubId === playerClub.id;

    const h2hMatches = gameState.recentResults.filter(r =>
      (r.homeClub.id === playerClub.id && r.awayClub.id === opponent.id) ||
      (r.homeClub.id === opponent.id && r.awayClub.id === playerClub.id)
    );
    const h2hWins = h2hMatches.filter(r => {
      const ih = r.homeClub.id === playerClub.id;
      return (ih ? r.homeScore : r.awayScore) > (ih ? r.awayScore : r.homeScore);
    }).length;
    const h2hDraws = h2hMatches.filter(r => r.homeScore === r.awayScore).length;
    const h2hLosses = h2hMatches.length - h2hWins - h2hDraws;
    const h2hFor = h2hMatches.reduce((s, r) => {
      const ih = r.homeClub.id === playerClub.id;
      return s + (ih ? r.homeScore : r.awayScore);
    }, 0);
    const h2hAgainst = h2hMatches.reduce((s, r) => {
      const ih = r.homeClub.id === playerClub.id;
      return s + (ih ? r.awayScore : r.homeScore);
    }, 0);

    const seed = (playerClub.id + opponent.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const stadiums = ['City Stadium', 'Arena Grounds', 'National Park', 'Community Field', 'Royal Dome'];
    const weatherOpts = ['Sunny, 22°C', 'Cloudy, 18°C', 'Light Rain, 15°C', 'Windy, 19°C', 'Clear, 24°C'];

    const qualityDiff = playerClub.quality - opponent.quality;
    const homeBonus = isHome ? 8 : 0;
    const winProb = Math.min(90, Math.max(10, Math.round(50 + qualityDiff * 0.5 + homeBonus)));

    const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'];
    const positions = ['ATT', 'MID', 'DEF'];
    const pStats = [72 + (seed * 7 % 18), 68 + (seed * 11 % 20), 65 + (seed * 13 % 22)];
    const oStats = [70 + ((seed + 17) * 7 % 18), 70 + ((seed + 17) * 11 % 20), 68 + ((seed + 17) * 13 % 22)];

    return {
      isHome,
      h2h: { wins: h2hWins, draws: h2hDraws, losses: h2hLosses, for: h2hFor, against: h2hAgainst },
      venue: { name: stadiums[seed % stadiums.length], capacity: 20000 + (seed * 37 % 60000), weather: weatherOpts[seed % weatherOpts.length] },
      battles: positions.map((p, i) => ({ pos: p, player: pStats[i], opponent: oStats[i] })),
      winProb,
      formation: formations[seed % formations.length],
      instruction: isHome ? 'Press high, attack from the whistle' : 'Stay compact, hit on the counter',
    };
  }, [gameState, cupInfo]);

  // ─── Cup History Timeline data ──────────────────────────────────────
  const cupHistoryTimeline = useMemo(() => {
    if (!gameState || !historicalPerformance) return [];

    const entries: {
      season: number;
      roundReached: string;
      opponent: string;
      score: string;
      goalScorers: string[];
      isBest: boolean;
      cleanSheet: boolean;
    }[] = [];

    for (const trophy of historicalPerformance.cupTrophies) {
      const sd = trophy.season * 31;
      const opps = ['Rival United', 'City FC', 'Athletic Club', 'Wanderers'];
      entries.push({
        season: trophy.season,
        roundReached: 'Winner',
        opponent: opps[sd % opps.length],
        score: `${2 + (sd % 3)}-${sd % 2}`,
        goalScorers: ['Martinez', 'Silva', 'Fernandes'].slice(0, 1 + (sd % 3)),
        isBest: true,
        cleanSheet: sd % 4 === 0,
      });
    }

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const maxRd = gameState.cupFixtures.length > 0 ? Math.max(...gameState.cupFixtures.map(f => f.matchday)) : 1;
    for (const r of cupResults) {
      const ih = r.homeClub.id === gameState.currentClub.id;
      const opp = ih ? r.awayClub : r.homeClub;
      const rIdx = CUP_MATCH_WEEKS.findIndex(w => w === r.week);
      entries.push({
        season: r.season,
        roundReached: getRoundName(rIdx >= 0 ? rIdx + 1 : 1, maxRd),
        opponent: opp.shortName,
        score: `${r.homeScore}-${r.awayScore}`,
        goalScorers: r.playerGoals > 0 ? ['You'] : [],
        isBest: false,
        cleanSheet: ih ? r.awayScore === 0 : r.homeScore === 0,
      });
    }

    return entries.sort((a, b) => b.season - a.season);
  }, [gameState, historicalPerformance]);

  // ─── Cup Stats Deep Dive data ───────────────────────────────────────
  const cupStatsDeep = useMemo(() => {
    if (!gameState || !cupStatistics) return null;

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const cleanSheets = cupResults.filter(r => {
      const ih = r.homeClub.id === gameState.currentClub.id;
      return ih ? r.awayScore === 0 : r.homeScore === 0;
    }).length;

    const minSeason = cupResults.length > 0 ? Math.min(...cupResults.map(c => c.season)) : 0;
    const firstSeason = cupResults.filter(r => r.season === minSeason);
    const prevGoals = firstSeason.reduce((s, r) => s + r.playerGoals, 0);
    const prevAssists = firstSeason.reduce((s, r) => s + r.playerAssists, 0);
    const prevApps = firstSeason.length;

    const specialistRating = Math.min(5, Math.max(1,
      Math.round(cupStatistics.cupGoals * 0.3 + cupStatistics.motmAwards * 0.8 + cupStatistics.winRate * 0.02 + (historicalPerformance?.cupTrophies.length ?? 0) * 1.5)
    ));

    const sparkline = cupResults.slice(-5).map(r => r.playerRating);

    return {
      goals: { value: cupStatistics.cupGoals, trend: cupStatistics.cupGoals - prevGoals },
      assists: { value: cupStatistics.cupAssists, trend: cupStatistics.cupAssists - prevAssists },
      cleanSheets: { value: cleanSheets, trend: 0 },
      appearances: { value: cupStatistics.cupAppearances, trend: cupStatistics.cupAppearances - prevApps },
      winRate: { value: cupStatistics.winRate, trend: 0 },
      motm: { value: cupStatistics.motmAwards, trend: 0 },
      specialistRating,
      sparkline,
    };
  }, [gameState, cupStatistics, historicalPerformance]);

  // ─── Famous Cup Moments data ────────────────────────────────────────
  const famousCupMoments = useMemo(() => {
    if (!gameState) return [];

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const moments: { type: string; title: string; description: string; season: number; color: string }[] = [];

    // Giant Killing — beating a higher-ranked opponent
    const giantKill = cupResults.find(r => {
      const ih = r.homeClub.id === gameState.currentClub.id;
      if ((ih ? r.homeScore : r.awayScore) <= (ih ? r.awayScore : r.homeScore)) return false;
      const oppId = ih ? r.awayClub.id : r.homeClub.id;
      const oppPos = gameState.leagueTable.findIndex(s => s.clubId === oppId) + 1;
      const myPos = gameState.leagueTable.findIndex(s => s.clubId === gameState.currentClub.id) + 1;
      return oppPos > 0 && myPos > 0 && oppPos < myPos;
    });
    if (giantKill) {
      const ih = giantKill.homeClub.id === gameState.currentClub.id;
      moments.push({
        type: 'Giant Killing',
        title: 'Upset Victory!',
        description: `Beat league-higher ${(ih ? giantKill.awayClub : giantKill.homeClub).shortName} ${giantKill.homeScore}-${giantKill.awayScore}`,
        season: giantKill.season,
        color: '#34d399',
      });
    }

    // Last Minute Hero — late dramatic contribution
    const lastMin = cupResults.find(r => r.playerGoals > 0 && r.playerRating >= 7.5);
    if (lastMin) {
      const ih = lastMin.homeClub.id === gameState.currentClub.id;
      moments.push({
        type: 'Last Minute Hero',
        title: 'Dramatic Impact',
        description: `Key performance vs ${(ih ? lastMin.awayClub : lastMin.homeClub).shortName} (${lastMin.playerRating.toFixed(1)})`,
        season: lastMin.season,
        color: '#f59e0b',
      });
    }

    // Hat-Trick in the Cup
    const hatTrick = cupResults.find(r => r.playerGoals >= 3);
    if (hatTrick) {
      const ih = hatTrick.homeClub.id === gameState.currentClub.id;
      moments.push({
        type: 'Hat-Trick Hero',
        title: 'Cup Hat-Trick!',
        description: `Scored ${hatTrick.playerGoals} vs ${(ih ? hatTrick.awayClub : hatTrick.homeClub).shortName}`,
        season: hatTrick.season,
        color: '#ef4444',
      });
    }

    // Cup Final Day
    if (historicalPerformance && historicalPerformance.cupTrophies.length > 0) {
      const t = historicalPerformance.cupTrophies[0];
      moments.push({
        type: 'Cup Final Day',
        title: 'Lifted the Trophy!',
        description: `Won the ${t.name} in Season ${t.season}`,
        season: t.season,
        color: '#a78bfa',
      });
    }

    return moments.slice(0, 4);
  }, [gameState, historicalPerformance]);

  // ─── Early return ────────────────────────────────────────────────────
  if (!cupInfo || !gameState) return null;

  const { cupName, cupEmoji, cupRound, maxRound, cupEliminated, isCupWinner, rounds,
          playerNextCupMatch, nextCupOpponent, isCupWeek, currentWeek } = cupInfo;

  // Find the round where player was eliminated
  const eliminatedRoundNum = cupEliminated
    ? gameState.cupFixtures.filter(f =>
        f.played &&
        (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id)
      ).length
    : 0;

  // ─── Render helpers ──────────────────────────────────────────────────
  const getResultColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'text-emerald-400';
      case 'D': return 'text-amber-400';
      case 'L': return 'text-red-400';
    }
  };

  const getResultBg = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'D': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'L': return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
  };

  const getFormDotColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-400';
      case 'D': return 'bg-amber-400';
      case 'L': return 'bg-red-400';
    }
  };

  // ─── SVG Bracket tree rendering ──────────────────────────────────────
  const renderBracketTree = () => {
    if (!bracketData || bracketData.rounds.length === 0) return null;

    const { rounds: bRounds } = bracketData;
    const numRounds = bRounds.length;

    // SVG dimensions
    const matchBoxW = 130;
    const matchBoxH = 38;
    const roundGapX = 36;
    const baseSpacingY = 52;
    const padTop = 32;
    const padLeft = 8;
    const padRight = 60;

    // Calculate column X positions
    const colX = (r: number) => padLeft + r * (matchBoxW + roundGapX);

    // Calculate row Y positions
    const matchesR0 = bRounds[0]?.matches.length || 1;
    const rowY = (roundIdx: number, matchIdx: number): number => {
      if (roundIdx === 0) {
        return padTop + matchIdx * baseSpacingY;
      }
      const parentY1 = rowY(roundIdx - 1, matchIdx * 2);
      const parentY2 = rowY(roundIdx - 1, matchIdx * 2 + 1);
      return (parentY1 + parentY2) / 2;
    };

    // Handle odd first-round fixtures: for rounds beyond 0 where matchIdx * 2 + 1 exceeds available,
    // use the same match's Y
    const safeRowY = (roundIdx: number, matchIdx: number): number => {
      const matchesInPrevRound = bRounds[roundIdx - 1]?.matches.length || 0;
      if (roundIdx === 0) return padTop + matchIdx * baseSpacingY;

      const idx2 = matchIdx * 2;
      const idx3 = matchIdx * 2 + 1;

      if (idx2 < matchesInPrevRound && idx3 < matchesInPrevRound) {
        return (rowY(roundIdx - 1, idx2) + rowY(roundIdx - 1, idx3)) / 2;
      }
      if (idx2 < matchesInPrevRound) {
        return rowY(roundIdx - 1, idx2);
      }
      // Fallback: evenly space
      const totalMatches = bRounds[roundIdx]?.matches.length || 1;
      const totalHeight = (matchesR0 - 1) * baseSpacingY;
      const spacing = totalHeight / Math.max(totalMatches - 1, 1);
      return padTop + matchIdx * spacing;
    };

    const svgWidth = numRounds * matchBoxW + (numRounds - 1) * roundGapX + padLeft + padRight;
    const svgHeight = padTop * 2 + (matchesR0 - 1) * baseSpacingY + matchBoxH + 20;

    const playerClubId = gameState.currentClub.id;

    // Render a single match box with enhanced styling
    const renderMatchBox = (match: BracketMatch, x: number, y: number, roundIdx: number) => {
      const boxHasPlayer = match.isPlayerMatch;
      const isPlayed = match.played;
      const isWinnerHome = match.winnerId === match.homeClub.id;
      const isWinnerAway = match.winnerId === match.awayClub.id;
      const isLastRound = roundIdx === numRounds - 1;

      // Box colors — enhanced
      const boxFill = boxHasPlayer
        ? '#0d2818'
        : isPlayed
        ? '#161b22'
        : '#0d1117';
      const boxStroke = isPlayed && match.winnerId
        ? '#10b981'
        : boxHasPlayer
        ? '#10b981'
        : isPlayed
        ? '#30363d'
        : '#21262d';
      const strokeWidth = isPlayed && match.winnerId ? 1.5 : boxHasPlayer ? 1.5 : 1;

      // Winner background highlight
      const homeWinnerBg = isPlayed && isWinnerHome ? '#0d2818' : 'transparent';
      const awayWinnerBg = isPlayed && isWinnerAway ? '#0d2818' : 'transparent';

      return (
        <g key={`match-${match.fixture.id}-${roundIdx}`}>
          {/* Match box background */}
          <rect
            x={x}
            y={y}
            width={matchBoxW}
            height={matchBoxH}
            rx={4}
            fill={boxFill}
            stroke={boxStroke}
            strokeWidth={strokeWidth}
          />

          {/* Winner row highlight — home */}
          {isPlayed && isWinnerHome && (
            <rect x={x + 1} y={y + 1} width={matchBoxW - 2} height={matchBoxH / 2 - 1} rx={3} fill="#10b981" opacity={0.08} />
          )}
          {/* Winner row highlight — away */}
          {isPlayed && isWinnerAway && (
            <rect x={x + 1} y={y + matchBoxH / 2} width={matchBoxW - 2} height={matchBoxH / 2 - 1} rx={3} fill="#10b981" opacity={0.08} />
          )}

          {/* Home team row */}
          <text
            x={x + 6}
            y={y + 14}
            fill={boxHasPlayer && match.homeClub.id === playerClubId ? '#6ee7b7' : isWinnerHome && isPlayed ? '#c9d1d9' : '#8b949e'}
            fontSize={10}
            fontWeight={boxHasPlayer && match.homeClub.id === playerClubId ? 600 : isWinnerHome && isPlayed ? 500 : 400}
            fontFamily="system-ui"
          >
            {match.homeClub.shortName.substring(0, 12)}
          </text>
          {isPlayed && match.homeScore !== null ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 14}
              fill={isWinnerHome ? '#6ee7b7' : '#8b949e'}
              fontSize={10}
              fontWeight={700}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {match.homeScore}
            </text>
          ) : !isPlayed ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 14}
              fill="#484f58"
              fontSize={8}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {isLastRound ? '—' : '—'}
            </text>
          ) : null}

          {/* Divider line */}
          <line
            x1={x + 4}
            y1={y + matchBoxH / 2}
            x2={x + matchBoxW - 4}
            y2={y + matchBoxH / 2}
            stroke="#30363d"
            strokeWidth={0.5}
          />

          {/* Away team row */}
          <text
            x={x + 6}
            y={y + 30}
            fill={boxHasPlayer && match.awayClub.id === playerClubId ? '#6ee7b7' : isWinnerAway && isPlayed ? '#c9d1d9' : '#8b949e'}
            fontSize={10}
            fontWeight={boxHasPlayer && match.awayClub.id === playerClubId ? 600 : isWinnerAway && isPlayed ? 500 : 400}
            fontFamily="system-ui"
          >
            {match.awayClub.shortName.substring(0, 12)}
          </text>
          {isPlayed && match.awayScore !== null ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 30}
              fill={isWinnerAway ? '#6ee7b7' : '#8b949e'}
              fontSize={10}
              fontWeight={700}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {match.awayScore}
            </text>
          ) : !isPlayed ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 30}
              fill="#484f58"
              fontSize={8}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {isLastRound ? '—' : '—'}
            </text>
          ) : null}

          {/* Player match indicator dot */}
          {boxHasPlayer && (
            <circle
              cx={x - 4}
              cy={y + matchBoxH / 2}
              r={3}
              fill="#10b981"
            />
          )}
        </g>
      );
    };

    // Render connector lines between rounds
    const renderConnectors = () => {
      const lines: React.ReactElement[] = [];

      for (let r = 0; r < numRounds - 1; r++) {
        const currentMatches = bRounds[r]?.matches || [];
        const nextMatches = bRounds[r + 1]?.matches || [];

        for (let m = 0; m < nextMatches.length; m++) {
          const feeder1Idx = m * 2;
          const feeder2Idx = m * 2 + 1;

          if (feeder1Idx >= currentMatches.length) continue;

          const feeder1Y = safeRowY(r, feeder1Idx) + matchBoxH / 2;
          const feeder2Y = feeder2Idx < currentMatches.length
            ? safeRowY(r, feeder2Idx) + matchBoxH / 2
            : feeder1Y;
          const nextMatchY = safeRowY(r + 1, m) + matchBoxH / 2;

          const feederRightX = colX(r) + matchBoxW;
          const nextLeftX = colX(r + 1);
          const midX = feederRightX + (roundGapX / 2);

          // Determine if the connection is "active" (both feeder matches played)
          const feeder1 = currentMatches[feeder1Idx];
          const feeder2 = feeder2Idx < currentMatches.length ? currentMatches[feeder2Idx] : null;
          const isPlayed = feeder1?.played && (feeder2 ? feeder2.played : true);

          const lineColor = isPlayed ? '#484f58' : '#21262d';

          lines.push(
            <path
              key={`conn-${r}-${m}`}
              d={`
                M ${feederRightX} ${feeder1Y}
                H ${midX}
                V ${feeder2Y}
                M ${feederRightX} ${feeder2Y}
                H ${midX}
                M ${midX} ${(feeder1Y + feeder2Y) / 2}
                H ${nextLeftX}
              `}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        }
      }

      return lines;
    };

    // Render round labels with enhanced naming
    const renderRoundLabels = () => {
      return bRounds.map((rd, r) => {
        const teamsInRound = (rd.matches?.length || 1) * 2;
        const label = getRoundName(rd.roundNum, numRounds, teamsInRound);
        return (
          <g key={`label-${r}`}>
            {/* Round label background pill */}
            <rect
              x={colX(r) + matchBoxW / 2 - label.length * 3.5 - 4}
              y={4}
              width={label.length * 7 + 8}
              height={16}
              rx={4}
              fill="#161b22"
              stroke="#30363d"
              strokeWidth={0.5}
            />
            <text
              x={colX(r) + matchBoxW / 2}
              y={16}
              fill={r === numRounds - 1 ? '#fbbf24' : r >= numRounds - 3 ? '#c9d1d9' : '#8b949e'}
              fontSize={8}
              fontWeight={r === numRounds - 1 ? 700 : 600}
              textAnchor="middle"
              fontFamily="system-ui"
            >
              {label}
            </text>
          </g>
        );
      });
    };

    return (
      <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
          style={{ minWidth: svgWidth }}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#0d1117" rx={6} />

          {/* Round labels */}
          {renderRoundLabels()}

          {/* Connector lines */}
          {renderConnectors()}

          {/* Match boxes */}
          {bRounds.map((rd, r) =>
            rd.matches.map((match, m) =>
              renderMatchBox(match, colX(r), safeRowY(r, m), r)
            )
          )}

          {/* Trophy at the end if player won */}
          {isCupWinner && (
            <g>
              <rect
                x={colX(numRounds - 1) + matchBoxW + 12}
                y={safeRowY(numRounds - 1, 0) + matchBoxH / 2 - 20}
                width={36}
                height={40}
                rx={6}
                fill="#0d2818"
                stroke="#10b981"
                strokeWidth={1}
              />
              <text
                x={colX(numRounds - 1) + matchBoxW + 30}
                y={safeRowY(numRounds - 1, 0) + matchBoxH / 2 + 5}
                textAnchor="middle"
                fontSize={20}
              >
                🏆
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* ─── Enhanced Cup Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-amber-900/30 overflow-hidden relative">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-amber-900/30 border border-amber-700/30 flex items-center justify-center">
                  <TrophyIcon size={40} color="#d97706" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-amber-100 flex items-center gap-2">
                    {cupName}
                  </h2>
                  <p className="text-xs text-[#8b949e]">Domestic Cup Competition</p>
                </div>
              </div>

              {/* Status Badge — enhanced with matching colors */}
              {isCupWinner ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <Badge className="bg-amber-500 text-black font-bold px-3 py-1 text-xs border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    WINNER!
                  </Badge>
                </motion.div>
              ) : cupEliminated ? (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-3 py-1 text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  ELIMINATED
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-3 py-1 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* Round Progress Indicator — enhanced dots */}
            {!isCupWinner && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                  <span>Progress</span>
                  <span className="font-medium">
                    {cupEliminated
                      ? `Eliminated in ${getRoundName(eliminatedRoundNum, maxRound)}`
                      : `Round ${Math.min(cupRound, maxRound)} of ${maxRound}`
                    }
                  </span>
                </div>

                {/* Progress dots with enhanced styling */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: maxRound }, (_, i) => {
                    const roundNum = i + 1;
                    const isCompleted = roundNum < cupRound;
                    const isCurrent = roundNum === cupRound && !cupEliminated;

                    return (
                      <div key={roundNum} className="flex items-center gap-1.5 flex-1">
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <motion.div
                            className={`h-2.5 w-2.5 rounded-sm ${
                              isCompleted
                                ? 'bg-amber-400'
                                : isCurrent
                                ? 'bg-amber-400'
                                : 'bg-[#30363d]'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: isCompleted || isCurrent ? 1 : 0.4,
                            }}
                            transition={{ delay: i * 0.05 }}
                          />
                          {isCurrent && (
                            <motion.div
                              className="h-2.5 w-2.5 rounded-sm border border-amber-400/60 absolute"
                              animate={{ opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          {(roundNum === 1 || roundNum === maxRound ||
                            roundNum === maxRound - 1 || roundNum === maxRound - 2 ||
                            isCurrent) && (
                            <span className={`text-[7px] leading-none mt-1 ${
                              isCurrent ? 'text-amber-300 font-semibold' : 'text-[#484f58]'
                            }`}>
                              {roundNum === 1 ? 'R1' :
                               roundNum === maxRound ? 'F' :
                               roundNum === maxRound - 1 ? 'SF' :
                               roundNum === maxRound - 2 ? 'QF' :
                               `R${roundNum}`}
                            </span>
                          )}
                        </div>
                        {roundNum < maxRound && (
                          <div className={`h-0.5 w-full rounded-sm ${
                            isCompleted ? 'bg-amber-400/60' : 'bg-[#30363d]/60'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Winner progress bar */}
            {isCupWinner && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-amber-500/30 rounded-sm">
                  <motion.div
                    className="h-full bg-amber-400 rounded-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                </div>
                <span className="text-[9px] text-amber-300 font-semibold">Complete!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Cup Statistics Bar ─────────────────────────────────────── */}
      {cupStatistics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-2">
                {/* Round Reached */}
                <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center mb-1">
                    {isCupWinner ? (
                      <Trophy className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Flag className="h-4 w-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#c9d1d9] leading-tight">
                    {isCupWinner ? 'Winner!' : cupStatistics.bestRun !== 'None yet' ? cupStatistics.bestRun : '—'}
                  </p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Round Reached</p>
                </div>

                {/* Goals Scored */}
                <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums leading-tight">
                    {cupStatistics.cupGoals}
                  </p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Cup Goals</p>
                </div>

                {/* Matches Played */}
                <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-amber-400 tabular-nums leading-tight">
                    {cupStatistics.cupAppearances}
                  </p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Matches</p>
                </div>

                {/* Best Performance */}
                <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Award className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-sm font-bold text-purple-400 tabular-nums leading-tight">
                    {historicalPerformance?.cupTrophies.length ?? 0}
                  </p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Cup Trophies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Tournament Overview Dashboard ──────────────────────────── */}
      {tournamentOverview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Compass className="h-3 w-3 text-amber-500" />
                Tournament Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Summary banner */}
              <div className="bg-[#21262d] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#c9d1d9]">{cupName}</p>
                    <p className="text-[10px] text-[#8b949e]">Season {tournamentOverview.season}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                    {isCupWinner ? 'Winner' : cupEliminated ? 'Eliminated' : `Round ${cupRound}`}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">{tournamentOverview.matchesPlayed}</p>
                    <p className="text-[8px] text-[#484f58]">Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">{tournamentOverview.goalsScored}</p>
                    <p className="text-[8px] text-[#484f58]">Scored</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-400 tabular-nums">{tournamentOverview.goalsConceded}</p>
                    <p className="text-[8px] text-[#484f58]">Conceded</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-amber-400 tabular-nums">{tournamentOverview.difficulty}%</p>
                    <p className="text-[8px] text-[#484f58]">Difficulty</p>
                  </div>
                </div>
              </div>

              {/* SVG tournament path visualization */}
              {tournamentOverview.path.length > 0 && (
                <div>
                  <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Your Cup Path</p>
                  <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
                    <svg width={tournamentOverview.path.length * 110 + 20} height={56} className="min-w-full">
                      <rect width="100%" height="100%" fill="#0d1117" rx={4} />
                      {tournamentOverview.path.map((step, i) => {
                        const x = 10 + i * 110;
                        const isWin = step.result === 'W';
                        return (
                          <g key={i}>
                            {i > 0 && (
                              <line x1={x - 10} y1={28} x2={x - 2} y2={28} stroke={isWin ? '#34d399' : '#ef4444'} strokeWidth={2} strokeLinecap="round" />
                            )}
                            <circle cx={x + 20} cy={28} r={18} fill={isWin ? '#0d2818' : '#2d0d0d'} stroke={isWin ? '#34d399' : '#ef4444'} strokeWidth={1} />
                            <text x={x + 20} y={26} textAnchor="middle" fontSize={10} fill={isWin ? '#34d399' : '#ef4444'} fontWeight={700} fontFamily="system-ui">
                              {step.score}
                            </text>
                            <text x={x + 20} y={38} textAnchor="middle" fontSize={6} fill="#8b949e" fontFamily="system-ui">
                              vs {step.opponent.substring(0, 8)}
                            </text>
                            <text x={x + 20} y={10} textAnchor="middle" fontSize={7} fill="#484f58" fontFamily="system-ui">
                              {step.round.substring(0, 6)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* Best Cup Run indicator */}
              <div className="flex items-center gap-2 bg-[#21262d] rounded-lg p-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#8b949e]">Best Cup Run</p>
                  <p className="text-xs font-bold text-amber-300">{cupStatistics?.bestRun ?? '—'}</p>
                </div>
                {historicalPerformance && historicalPerformance.cupTrophies.length > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-2">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    {historicalPerformance.cupTrophies.length}x Winner
                  </Badge>
                )}
              </div>

              {/* Cup difficulty meter */}
              <div className="bg-[#21262d] rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">Cup Difficulty</span>
                  <span className={`text-[10px] font-bold ${
                    tournamentOverview.difficulty > 65 ? 'text-red-400' : tournamentOverview.difficulty > 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {tournamentOverview.difficulty > 65 ? 'Hard' : tournamentOverview.difficulty > 40 ? 'Medium' : 'Easy'}
                  </span>
                </div>
                <div className="h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${tournamentOverview.difficulty}%`,
                      backgroundColor: tournamentOverview.difficulty > 65 ? '#ef4444' : tournamentOverview.difficulty > 40 ? '#f59e0b' : '#34d399',
                    }}
                  />
                </div>
                <p className="text-[8px] text-[#484f58] mt-1">Based on opponents' league positions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Cup Winner Celebration ─────────────────────────────────── */}
      {isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <Card className="bg-[#161b22] border-amber-500/40 overflow-hidden">
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <MiniTrophyIcon />
              </motion.div>
              <h3 className="text-xl font-black text-amber-300 mb-1 mt-2">Cup Winner!</h3>
              <p className="text-sm text-amber-200/70">
                You won the {cupName}! A historic achievement for {gameState.currentClub.name}!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge className="bg-amber-500/30 text-amber-200 border border-amber-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Trophy Added to Cabinet
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Eliminated Message ─────────────────────────────────────── */}
      {cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-red-950/20 border border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Eliminated in {getRoundName(eliminatedRoundNum, maxRound)}
                  </p>
                  <p className="text-xs text-red-400/70">
                    Your {cupName} run has ended this season
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── SVG Bracket Tree Diagram (NEW) ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Swords className="h-3.5 w-3.5 text-amber-500" />
                Tournament Bracket
              </CardTitle>
              <div className="flex items-center gap-2 text-[8px] text-[#484f58]">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-sm bg-emerald-400" />
                  <span>Your Club</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-sm bg-[#8b949e]" />
                  <span>Winner</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {renderBracketTree()}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Opponent Scout Card ────────────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && opponentScout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-sky-400" />
                  Opponent Scout
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Opponent header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xl">
                  {opponentScout.club.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#c9d1d9] truncate">
                    {opponentScout.club.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {opponentScout.leaguePosition && (
                      <span className="text-[10px] text-[#8b949e] flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {opponentScout.leaguePosition}{getOrdinalSuffix(opponentScout.leaguePosition)} in league
                      </span>
                    )}
                    <span className="text-[10px] text-[#484f58]">
                      Quality: {opponentScout.club.quality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {opponentScout.leaguePosition && (
                  <div className="bg-[#21262d] rounded-md p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase tracking-wider">League Pos</p>
                    <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
                      {opponentScout.leaguePosition}
                      <span className="text-[10px] text-[#484f58] font-normal">
                        /{opponentScout.totalTeams}
                      </span>
                    </p>
                  </div>
                )}

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Scored</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {opponentScout.avgGoalsScored}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Conceded</p>
                  <p className="text-base font-bold text-red-400 mt-0.5 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {opponentScout.avgGoalsConceded}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Season Form</p>
                  <div className="flex items-center gap-1 mt-1">
                    {opponentScout.formDots.slice(0, 5).map((dot, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-sm ${getFormDotColor(dot)}`}
                        title={dot === 'W' ? 'Win' : dot === 'D' ? 'Draw' : 'Loss'}
                      />
                    ))}
                    <span className="text-[9px] text-[#484f58] ml-1">est.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Next Cup Match (Enhanced) ──────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <Card className="bg-[#161b22] border-amber-900/20 overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e]">
                  Next Cup Match
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Home className="h-2 w-2 text-amber-500/60" />
                    <span className="text-[8px] text-[#484f58]">HOME</span>
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center mx-2">
                  <motion.div
                    className="text-sm font-black text-amber-400/80"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    VS
                  </motion.div>
                  <div className="w-px h-4 bg-[#30363d] mt-1" />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Plane className="h-2 w-2 text-sky-500/60" />
                    <span className="text-[8px] text-[#484f58]">AWAY</span>
                  </div>
                </div>
              </div>

              {/* Week info with home/away indicator */}
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-[#30363d]">
                <Calendar className="h-3 w-3 text-amber-500/60" />
                <span className="text-[10px] text-[#8b949e]">
                  {playerNextCupMatch.homeClubId === gameState.currentClub.id ? 'Home' : 'Away'} • Week {CUP_MATCH_WEEKS[cupRound - 1] ?? cupRound * 4} • {isCupWeek ? 'This week!' : 'Upcoming'}
                </span>
              </div>

              {/* Form comparison */}
              <div className="mt-2.5 bg-[#21262d] rounded-md p-2.5">
                <p className="text-[9px] text-[#484f58] font-semibold uppercase tracking-wider mb-2 text-center">Form Comparison</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-[#8b949e]">{gameState.currentClub.shortName}</span>
                    <div className="flex items-center gap-0.5">
                      {teamFormLookup.get(gameState.currentClub.id)?.slice(0, 5).map((f, fi) => (
                        <div key={fi} className={`h-2 w-2 rounded-sm ${getFormDotColor(f)}`} />
                      )) ?? <span className="text-[8px] text-[#484f58]">—</span>}
                    </div>
                  </div>
                  <span className="text-[8px] text-[#484f58] font-semibold">VS</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-[#8b949e]">{nextCupOpponent.shortName}</span>
                    <div className="flex items-center gap-0.5">
                      {teamFormLookup.get(nextCupOpponent.id)?.slice(0, 5).map((f, fi) => (
                        <div key={fi} className={`h-2 w-2 rounded-sm ${getFormDotColor(f)}`} />
                      )) ?? <span className="text-[8px] text-[#484f58]">—</span>}
                    </div>
                  </div>
                </div>
                {/* Quality comparison bar */}
                <div className="mt-2 flex items-center gap-1 text-[8px]">
                  <span className="text-[#8b949e]">{gameState.currentClub.quality}</span>
                  <div className="flex-1 flex h-1 rounded-sm overflow-hidden bg-[#0d1117]">
                    <div className="h-full bg-emerald-500/60 rounded-l-sm" style={{ width: `${(gameState.currentClub.quality / (gameState.currentClub.quality + nextCupOpponent.quality)) * 100}%` }} />
                    <div className="h-full bg-sky-500/60 rounded-r-sm" style={{ width: `${(nextCupOpponent.quality / (gameState.currentClub.quality + nextCupOpponent.quality)) * 100}%` }} />
                  </div>
                  <span className="text-[#8b949e]">{nextCupOpponent.quality}</span>
                </div>
                <p className="text-[7px] text-[#484f58] text-center mt-1">Quality Rating</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Match Preview Panel ────────────────────────────────────── */}
      {matchPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-sky-400" />
                  Match Preview
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-sky-700/50 text-sky-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Head-to-head record card */}
              <div className="bg-[#21262d] rounded-lg p-2.5">
                <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Head-to-Head Record</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{matchPreview.h2h.wins}</p>
                    <p className="text-[8px] text-[#484f58]">Wins</p>
                  </div>
                  <div className="w-px h-8 bg-[#30363d]" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">{matchPreview.h2h.draws}</p>
                    <p className="text-[8px] text-[#484f58]">Draws</p>
                  </div>
                  <div className="w-px h-8 bg-[#30363d]" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-400">{matchPreview.h2h.losses}</p>
                    <p className="text-[8px] text-[#484f58]">Losses</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-[#8b949e]">
                  <span>GF: <span className="text-emerald-400 font-bold">{matchPreview.h2h.for}</span></span>
                  <span>GA: <span className="text-red-400 font-bold">{matchPreview.h2h.against}</span></span>
                </div>
              </div>

              {/* Key position matchup comparisons */}
              <div className="bg-[#21262d] rounded-lg p-2.5">
                <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Key Position Battles</p>
                <div className="space-y-2">
                  {matchPreview.battles.map((b, i) => {
                    const total = b.player + b.opponent;
                    const pPct = Math.round((b.player / total) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="text-emerald-400 font-medium">{b.player}</span>
                          <span className="text-[#484f58]">{b.pos}</span>
                          <span className="text-sky-400 font-medium">{b.opponent}</span>
                        </div>
                        <div className="flex h-1.5 rounded-sm overflow-hidden bg-[#0d1117]">
                          <div className="h-full bg-emerald-500/60 rounded-l-sm" style={{ width: `${pPct}%` }} />
                          <div className="h-full bg-sky-500/60 rounded-r-sm" style={{ width: `${100 - pPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Venue info card */}
              <div className="bg-[#21262d] rounded-lg p-2.5">
                <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Venue Information</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#c9d1d9]">{matchPreview.venue.name}</p>
                    <p className="text-[9px] text-[#8b949e]">Capacity: {matchPreview.venue.capacity.toLocaleString()}</p>
                  </div>
                  <Badge className={`text-[8px] px-1.5 py-0 h-4 border ${
                    matchPreview.isHome ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  }`}>
                    {matchPreview.isHome ? 'HOME' : 'AWAY'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-[#8b949e]">
                  <Cloud className="h-3 w-3" />
                  <span>{matchPreview.venue.weather}</span>
                </div>
              </div>

              {/* Tactical Preview mini section */}
              <div className="bg-[#21262d] rounded-lg p-2.5">
                <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Tactical Preview</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#484f58]">Formation</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{matchPreview.formation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#484f58]">Key Instruction</p>
                    <p className="text-xs text-amber-300">{matchPreview.instruction}</p>
                  </div>
                </div>
              </div>

              {/* Win probability donut chart */}
              <div className="flex items-center gap-3 bg-[#21262d] rounded-lg p-3">
                <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="#21262d" strokeWidth={6} />
                  <circle
                    cx="32" cy="32" r="24" fill="none"
                    stroke={matchPreview.winProb >= 50 ? '#34d399' : '#f59e0b'}
                    strokeWidth={6}
                    strokeDasharray={`${matchPreview.winProb * 1.508} ${150.8 - matchPreview.winProb * 1.508}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                  <text x="32" y="30" textAnchor="middle" fontSize="14" fontWeight={800} fill="#c9d1d9" fontFamily="system-ui">
                    {matchPreview.winProb}%
                  </text>
                  <text x="32" y="42" textAnchor="middle" fontSize="7" fill="#8b949e" fontFamily="system-ui">
                    Win
                  </text>
                </svg>
                <div>
                  <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Win Probability</p>
                  <p className="text-xs text-[#c9d1d9] mt-0.5">
                    {matchPreview.winProb >= 65 ? 'Strong favourite' : matchPreview.winProb >= 45 ? 'Even contest' : 'Underdog'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Match Detail Cards (expanded from timeline) ─────────────── */}
      <AnimatePresence>
        {selectedMatchDetail && (() => {
          const detailMatch = cupRunTimeline.find(
            m => `${m.round}-${m.opponent}` === selectedMatchDetail
          );
          const detailResult = detailMatch
            ? gameState.recentResults.find(
                r => r.competition === 'cup' &&
                     r.week === CUP_MATCH_WEEKS[detailMatch.round - 1]
              )
            : null;
          if (!detailMatch || !detailResult) return null;

          const homeScorers = getDeterministicGoalscorers(
            detailResult.homeClub.id + detailResult.awayClub.id,
            detailResult.homeScore,
            'home'
          );
          const awayScorers = getDeterministicGoalscorers(
            detailResult.homeClub.id + detailResult.awayClub.id,
            detailResult.awayScore,
            'away'
          );
          const homeStats = getDeterministicStats(
            detailResult.homeClub.id + detailResult.awayClub.id,
            'home'
          );
          const awayStats = getDeterministicStats(
            detailResult.homeClub.id + detailResult.awayClub.id,
            'away'
          );
          // Normalize possession
          const homePoss = homeStats.possession;
          const awayPoss = 100 - homePoss;
          const fixtureId = detailResult.homeClub.id + detailResult.awayClub.id;

          return (
            <motion.div
              key="match-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="bg-[#161b22] border-amber-900/30 overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-amber-500" />
                      Match Detail
                    </CardTitle>
                    <button
                      onClick={() => setSelectedMatchDetail(null)}
                      className="text-[#484f58] hover:text-[#c9d1d9] text-xs flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Close
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Match header */}
                  <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xl">{detailResult.homeClub.logo}</span>
                      <span className="text-xs font-semibold text-[#c9d1d9] text-center max-w-[80px] truncate">
                        {detailResult.homeClub.shortName}
                      </span>
                    </div>
                    <div className="flex flex-col items-center mx-3">
                      <span className={`text-lg font-black tabular-nums ${
                        detailMatch.playerScore > detailMatch.opponentScore ? 'text-emerald-400' :
                        detailMatch.playerScore < detailMatch.opponentScore ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {detailResult.homeScore} — {detailResult.awayScore}
                      </span>
                      <span className="text-[8px] text-[#484f58] mt-0.5">
                        {detailMatch.roundName}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xl">{detailResult.awayClub.logo}</span>
                      <span className="text-xs font-semibold text-[#c9d1d9] text-center max-w-[80px] truncate">
                        {detailResult.awayClub.shortName}
                      </span>
                    </div>
                  </div>

                  {/* Date, venue, competition info */}
                  <div className="flex items-center justify-between text-[9px] text-[#484f58] border-b border-[#30363d] pb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      Season {detailResult.season}, Week {detailResult.week}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {detailMatch.isHome ? 'Home' : 'Away'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-2.5 w-2.5" />
                      {cupName}
                    </span>
                  </div>

                  {/* Goalscorers */}
                  {(homeScorers.length > 0 || awayScorers.length > 0) && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">
                        Goalscorers
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          {homeScorers.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-emerald-400 font-bold tabular-nums w-6 text-right">{s.minute}'</span>
                              <span className="text-[#c9d1d9]">{s.name}</span>
                            </div>
                          ))}
                          {homeScorers.length === 0 && (
                            <span className="text-[9px] text-[#484f58] italic">No goals</span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {awayScorers.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-sky-400 font-bold tabular-nums w-6 text-right">{s.minute}'</span>
                              <span className="text-[#c9d1d9]">{s.name}</span>
                            </div>
                          ))}
                          {awayScorers.length === 0 && (
                            <span className="text-[9px] text-[#484f58] italic">No goals</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats comparison */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">
                      Match Stats
                    </p>
                    {/* Possession */}
                    <div className="space-y-1">
                      <StatBar label="Possession" home={homePoss} away={awayPoss} unit="%" />
                      <StatBar label="Shots" home={homeStats.shots} away={awayStats.shots} unit="" />
                      <StatBar label="On Target" home={homeStats.shotsOnTarget} away={awayStats.shotsOnTarget} unit="" />
                      <StatBar label="Passes" home={homeStats.passes} away={awayStats.passes} unit="" />
                      <StatBar label="Pass Acc." home={homeStats.passAccuracy} away={awayStats.passAccuracy} unit="%" />
                    </div>
                  </div>

                  {/* Player contribution */}
                  {(detailMatch.playerGoals > 0 || detailMatch.playerAssists > 0 || detailMatch.playerRating > 0) && (
                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-[#30363d]">
                      {detailMatch.playerGoals > 0 && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-sm font-medium">
                          ⚽ {detailMatch.playerGoals} goal{detailMatch.playerGoals > 1 ? 's' : ''}
                        </span>
                      )}
                      {detailMatch.playerAssists > 0 && (
                        <span className="text-[10px] bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-sm font-medium">
                          🎯 {detailMatch.playerAssists} assist{detailMatch.playerAssists > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-sm ${
                        detailMatch.playerRating >= 8.0 ? 'bg-amber-500/15 text-amber-300' :
                        detailMatch.playerRating >= 7.0 ? 'bg-emerald-500/15 text-emerald-300' :
                        'bg-[#21262d] text-[#8b949e]'
                      }`}>
                        Rating {detailMatch.playerRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── Cup History Section ────────────────────────────────────── */}
      {historicalPerformance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Cup History
                </CardTitle>
                <span className="text-[9px] text-[#484f58]">
                  {historicalPerformance.cupTrophies.length} trophy{historicalPerformance.cupTrophies.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {historicalPerformance.cupTrophies.length > 0 ? (
                <div className="space-y-2">
                  {historicalPerformance.cupTrophies.map((trophy, i) => {
                    // Simulate progression rounds for each trophy season
                    const maxRounds = maxRound;
                    const trophyRound = maxRounds; // won = reached final round
                    const progressionRounds = Math.min(trophyRound, maxRounds);

                    return (
                      <motion.div
                        key={`${trophy.season}-${trophy.name}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5 border border-amber-500/15"
                      >
                        {/* Season + Cup Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                            <Trophy className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-amber-200 truncate">
                              S{trophy.season} — {trophy.name}
                            </p>
                            <p className="text-[9px] text-[#484f58]">Season {trophy.season}</p>
                          </div>
                        </div>

                        {/* Progression dots */}
                        <div className="flex items-center gap-0.5 mx-2">
                          {Array.from({ length: Math.min(maxRounds, 5) }, (_, ri) => (
                            <div
                              key={ri}
                              className={`h-1.5 w-1.5 rounded-sm ${
                                ri < progressionRounds ? 'bg-amber-400' : 'bg-[#30363d]'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Result badge */}
                        <Badge className={`text-[8px] px-1.5 py-0 h-4 border font-semibold ${getResultBadgeColor('Winner')}`}>
                          Winner
                        </Badge>
                      </motion.div>
                    );
                  })}

                  {/* Current season row */}
                  {!isCupWinner && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + historicalPerformance.cupTrophies.length * 0.05 }}
                      className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                          <Flame className="h-3.5 w-3.5 text-sky-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-sky-200 truncate">
                            Current — {cupName}
                          </p>
                          <p className="text-[9px] text-[#484f58]">
                            {cupEliminated ? 'Eliminated' : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      {/* Progression dots for current season */}
                      <div className="flex items-center gap-0.5 mx-2">
                        {Array.from({ length: Math.min(maxRound, 5) }, (_, ri) => {
                          const roundNum = ri + 1;
                          const isDone = roundNum < cupRound;
                          const isCurrent = roundNum === cupRound && !cupEliminated;
                          return (
                            <div
                              key={ri}
                              className={`h-1.5 w-1.5 rounded-sm ${
                                isDone ? 'bg-emerald-400' :
                                isCurrent ? 'bg-amber-400' :
                                'bg-[#30363d]'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Result badge for current */}
                      <Badge className={`text-[8px] px-1.5 py-0 h-4 border font-semibold ${
                        cupEliminated
                          ? getResultBadgeColor('Quarter-Finalist')
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {cupEliminated ? cupStatistics?.bestRun ?? 'TBD' : 'Active'}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <TrophyIcon size={28} color="#30363d" />
                  <p className="text-[10px] text-[#484f58] mt-2">
                    No cup trophies yet. Make history this season!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

            {/* ─── Cup History Timeline ────────────────────────────────────── */}
      {cupHistoryTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-amber-500" />
                  Cup History Timeline
                </CardTitle>
                <span className="text-[9px] text-[#484f58]">{cupHistoryTimeline.length} entries</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Vertical timeline */}
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#30363d]" />
                <div className="space-y-0">
                  {cupHistoryTimeline.map((entry, idx) => (
                    <motion.div
                      key={`${entry.season}-${entry.roundReached}-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.32 + idx * 0.05 }}
                      className="relative flex items-start gap-3 py-2"
                    >
                      {/* Timeline node */}
                      <div className="relative z-10 flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          entry.isBest
                            ? 'bg-amber-500/20 border-amber-500/40'
                            : 'bg-[#21262d] border-[#30363d]'
                        }`}>
                          {entry.isBest ? (
                            <Trophy className="h-3 w-3 text-amber-400" />
                          ) : (
                            <Flag className="h-2.5 w-2.5 text-[#8b949e]" />
                          )}
                        </div>
                      </div>

                      {/* Entry card */}
                      <div className={`flex-1 rounded-lg border p-2.5 min-w-0 ${
                        entry.isBest
                          ? 'bg-amber-500/[0.06] border-amber-500/20'
                          : 'bg-[#21262d]/60 border-[#30363d]'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[#c9d1d9]">
                            Season {entry.season}
                          </span>
                          <Badge className={`text-[7px] px-1.5 py-0 h-4 border font-semibold ${getResultBadgeColor(
                            entry.roundReached === 'Winner' ? 'Winner' :
                            entry.roundReached.includes('Semi') ? 'Semi-Finalist' :
                            entry.roundReached.includes('Quarter') ? 'Quarter-Finalist' :
                            'Quarter-Finalist'
                          )}`}>
                            {entry.roundReached}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8b949e]">vs {entry.opponent}</span>
                          <span className="font-bold text-[#c9d1d9] tabular-nums">{entry.score}</span>
                        </div>
                        {entry.goalScorers.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Target className="h-2.5 w-2.5 text-emerald-400" />
                            <span className="text-[8px] text-emerald-400">{entry.goalScorers.join(', ')}</span>
                          </div>
                        )}
                        {entry.cleanSheet && (
                          <span className="text-[7px] bg-sky-500/15 text-sky-300 px-1 py-0 rounded-sm mt-1 inline-block border border-sky-500/20">
                            Clean Sheet
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Stats summary */}
              <div className="mt-3 pt-3 border-t border-[#30363d]">
                <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">All-Time Cup Records</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#21262d] rounded-md p-2 text-center">
                    <p className="text-sm font-bold text-amber-400 tabular-nums">{historicalPerformance?.cupTrophies.length ?? 0}</p>
                    <p className="text-[8px] text-[#484f58]">Cup Trophies</p>
                  </div>
                  <div className="bg-[#21262d] rounded-md p-2 text-center">
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">{cupStatistics?.winRate ?? 0}%</p>
                    <p className="text-[8px] text-[#484f58]">Cup Win Rate</p>
                  </div>
                  <div className="bg-[#21262d] rounded-md p-2 text-center">
                    <p className="text-sm font-bold text-sky-400 tabular-nums">{cupStatistics?.cupGoals ?? 0}</p>
                    <p className="text-[8px] text-[#484f58]">Total Cup Goals</p>
                  </div>
                  <div className="bg-[#21262d] rounded-md p-2 text-center">
                    <p className="text-sm font-bold text-purple-400 tabular-nums">{cupHistoryTimeline.filter(e => e.cleanSheet).length}</p>
                    <p className="text-[8px] text-[#484f58]">Clean Sheets</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Enhanced Cup Run Timeline (Road to the Final) ───────────── */}
      {cupRunTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-500" />
                  Road to the Final
                </CardTitle>
                <span className="text-[9px] text-[#484f58]">
                  {cupRunTimeline.length} match{cupRunTimeline.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[#30363d]" />

                <div className="space-y-0">
                  {cupRunTimeline.map((match, idx) => {
                    const isLast = idx === cupRunTimeline.length - 1;
                    const isWinner = match.result === 'W';

                    return (
                      <motion.div
                        key={`${match.round}-${match.opponent}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.06 }}
                        className="relative flex items-start gap-3 py-2.5"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                          {isWinner ? (
                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                          ) : match.result === 'D' ? (
                            <MinusCircle className="h-7 w-7 text-amber-400" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-400" />
                          )}
                        </div>

                        {/* Enhanced match card */}
                        <div
                          onClick={() => setSelectedMatchDetail(
                            selectedMatchDetail === `${match.round}-${match.opponent}`
                              ? null
                              : `${match.round}-${match.opponent}`
                          )}
                          className={`flex-1 rounded-lg border p-2.5 min-w-0 cursor-pointer hover:brightness-110 transition-[filter] ${
                            isWinner
                              ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                              : match.result === 'D'
                              ? 'bg-amber-500/[0.06] border-amber-500/20'
                              : 'bg-red-500/[0.06] border-red-500/20'
                          } ${selectedMatchDetail === `${match.round}-${match.opponent}` ? 'ring-1 ring-amber-400/40' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8b949e] font-medium">
                                {match.roundName}
                              </span>
                              {/* Home/Away indicator */}
                              <span className={`text-[8px] px-1 py-0 rounded-sm ${
                                match.isHome
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-sky-500/15 text-sky-400'
                              }`}>
                                {match.isHome ? 'H' : 'A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Key Moment badge */}
                              {match.isKeyMoment && (
                                <span className="text-[7px] bg-emerald-500/20 text-emerald-300 px-1 py-0 rounded-sm font-bold flex items-center gap-0.5 border border-emerald-500/30">
                                  <Zap className="h-2 w-2" />
                                  KEY
                                </span>
                              )}
                              <Badge className={`text-[8px] px-1.5 py-0 h-4 border font-bold ${getResultBg(match.result)}`}>
                                {match.result}
                              </Badge>
                            </div>
                          </div>

                          {/* Opponent + Score */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{match.opponentLogo}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-[#c9d1d9] font-medium truncate">
                                {match.isHome ? 'vs' : '@'} {match.opponent}
                              </p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${getResultColor(match.result)}`}>
                              {match.playerScore} - {match.opponentScore}
                            </span>
                          </div>

                          {/* Form dots for both teams (last 3 results) */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-0.5">
                              <span className="text-[8px] text-[#484f58] mr-1">Form:</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 3 }, (_, fi) => {
                                  // Derive form from recent cup results before this match
                                  const prevResults = cupRunTimeline.slice(
                                    Math.max(0, idx - 3), idx
                                  );
                                  const formResult = prevResults[fi]?.result;
                                  return (
                                    <div
                                      key={fi}
                                      className={`h-1.5 w-1.5 rounded-sm ${
                                        formResult ? getFormDotColor(formResult) : 'bg-[#30363d]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Rating */}
                            {match.playerRating > 0 && (
                              <span className={`text-[9px] font-bold tabular-nums ${
                                match.playerRating >= 8.0
                                  ? 'text-emerald-400'
                                  : match.playerRating >= 7.0
                                  ? 'text-amber-300'
                                  : 'text-[#8b949e]'
                              }`}>
                                {match.playerRating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Player contribution */}
                          {(match.playerGoals > 0 || match.playerAssists > 0) && (
                            <div className="flex items-center gap-2 mt-1.5">
                              {match.playerGoals > 0 && (
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  ⚽ {match.playerGoals}
                                </span>
                              )}
                              {match.playerAssists > 0 && (
                                <span className="text-[9px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  🎯 {match.playerAssists}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Match date */}
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-2 w-2 text-[#484f58]" />
                            <span className="text-[8px] text-[#484f58]">{match.matchDate}</span>
                            <span className="text-[7px] text-amber-500/40 ml-auto flex items-center gap-0.5">
                              tap detail <ChevronRight className="h-2 w-2" />
                            </span>
                          </div>

                          {/* Progression indicator */}
                          {isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/60" />
                              <span className="text-[8px] text-emerald-500/60">Advanced</span>
                            </div>
                          )}
                          {!isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1">
                              <XCircle className="h-2.5 w-2.5 text-red-500/40" />
                              <span className="text-[8px] text-red-500/40">
                                {match.result === 'D' ? 'Eliminated (away goals / pens)' : 'Eliminated'}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Bracket Rounds (enhanced with scores & form) ────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Swords className="h-3.5 w-3.5 text-amber-500" />
              Round Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {rounds.map((roundData, idx) => {
                  const isCurrentRound = roundData.round === cupRound;
                  const isPastRound = roundData.round < cupRound;

                  const playerInRound = roundData.fixtures.find(
                    f => f.homeClubId === gameState.currentClub.id ||
                         f.awayClubId === gameState.currentClub.id
                  );

                  return (
                    <motion.div
                      key={roundData.round}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.06, duration: 0.2 }}
                      className={`rounded-lg border p-3 ${
                        isCurrentRound
                          ? 'bg-amber-500/10 border-amber-600/30'
                          : isPastRound
                          ? 'bg-[#21262d] border-[#30363d]'
                          : 'bg-[#21262d]/10 border-[#30363d]'
                      }`}
                    >
                      {/* Round header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">
                            {roundData.name}
                          </span>
                          {isCurrentRound && !cupEliminated && (
                            <motion.span
                              className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-sm font-semibold"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              CURRENT
                            </motion.span>
                          )}
                          {isPastRound && playerInRound && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-sm font-semibold">
                              PLAYED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                          <Users className="h-2.5 w-2.5" />
                          <span>{roundData.fixtures.length * 2} teams</span>
                        </div>
                      </div>

                      {/* Enhanced fixture list */}
                      <div className="space-y-1.5">
                        {roundData.fixtures.map(fixture => {
                          const homeClub = getClubById(fixture.homeClubId);
                          const awayClub = getClubById(fixture.awayClubId);
                          if (!homeClub || !awayClub) return null;

                          const isPlayerMatch =
                            fixture.homeClubId === gameState.currentClub.id ||
                            fixture.awayClubId === gameState.currentClub.id;

                          const scoreKey = `${fixture.homeClubId}-${fixture.awayClubId}`;
                          const scoreData = fixture.played ? cupMatchScoreLookup.get(scoreKey) : null;

                          const reverseKey = `${fixture.awayClubId}-${fixture.homeClubId}`;
                          const reverseScoreData = !scoreData && fixture.played
                            ? cupMatchScoreLookup.get(reverseKey)
                            : null;

                          const finalScore = scoreData || (reverseScoreData ? {
                            homeScore: reverseScoreData.awayScore,
                            awayScore: reverseScoreData.homeScore,
                          } : null);

                          // Check if player had a key moment in this fixture
                          const cupResult = fixture.played
                            ? gameState.recentResults.find(
                                r => r.competition === 'cup' &&
                                     ((r.homeClub.id === fixture.homeClubId && r.awayClub.id === fixture.awayClubId) ||
                                      (r.homeClub.id === fixture.awayClubId && r.awayClub.id === fixture.homeClubId))
                              )
                            : null;
                          const isKeyMoment = cupResult && (cupResult.playerGoals > 0 || cupResult.playerAssists > 0);

                          // Team form dots
                          const homeForm = teamFormLookup.get(fixture.homeClubId)?.slice(0, 3) || [];
                          const awayForm = teamFormLookup.get(fixture.awayClubId)?.slice(0, 3) || [];

                          // Determine winner for highlighting
                          const homeWon = finalScore && finalScore.homeScore > finalScore.awayScore;
                          const awayWon = finalScore && finalScore.awayScore > finalScore.homeScore;

                          return (
                            <div
                              key={fixture.id}
                              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                                isPlayerMatch
                                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                                  : 'bg-[#21262d]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-sm">{homeClub.logo}</span>
                                <span className={`truncate ${
                                  isPlayerMatch && fixture.homeClubId === gameState.currentClub.id
                                    ? 'text-emerald-300 font-semibold'
                                    : homeWon ? 'text-[#c9d1d9] font-medium'
                                    : fixture.played ? 'text-[#8b949e]'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {homeClub.shortName}
                                </span>
                                {/* Home team form dots */}
                                {fixture.played && homeForm.length > 0 && (
                                  <div className="flex items-center gap-px ml-1">
                                    {homeForm.map((dot, fi) => (
                                      <div
                                        key={fi}
                                        className={`h-1.5 w-1.5 rounded-sm ${getFormDotColor(dot)}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Score display */}
                              {fixture.played && finalScore ? (
                                <span className="text-[#c9d1d9] mx-2 text-[10px] font-bold tabular-nums bg-[#0d1117] px-1.5 py-0.5 rounded-sm border border-[#30363d]">
                                  {finalScore.homeScore} - {finalScore.awayScore}
                                </span>
                              ) : fixture.played ? (
                                <Badge className="ml-2 bg-slate-700/50 text-[#8b949e] text-[8px] px-1 py-0 h-4 border-0">
                                  Done
                                </Badge>
                              ) : (
                                <span className="text-[#484f58] mx-2 text-[9px]">vs</span>
                              )}

                              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                {/* Away team form dots */}
                                {fixture.played && awayForm.length > 0 && (
                                  <div className="flex items-center gap-px mr-1">
                                    {awayForm.map((dot, fi) => (
                                      <div
                                        key={fi}
                                        className={`h-1.5 w-1.5 rounded-sm ${getFormDotColor(dot)}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <span className={`truncate text-right ${
                                  isPlayerMatch && fixture.awayClubId === gameState.currentClub.id
                                    ? 'text-emerald-300 font-semibold'
                                    : awayWon ? 'text-[#c9d1d9] font-medium'
                                    : fixture.played ? 'text-[#8b949e]'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {awayClub.shortName}
                                </span>
                                <span className="text-sm">{awayClub.logo}</span>
                              </div>

                              {/* Key moment indicator for player matches */}
                              {isPlayerMatch && isKeyMoment && (
                                <Zap className="h-3 w-3 text-emerald-400 ml-1 flex-shrink-0" />
                              )}
                              {isPlayerMatch && !fixture.played && (
                                <ChevronRight className="h-3 w-3 text-emerald-400 ml-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Enhanced Cup Statistics ──────────────────────────────────── */}
      {cupStatistics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="space-y-4"
        >
          {/* Main stats grid */}
          <Card className="bg-[#161b22]/50 border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-amber-500" />
                Cup Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-400 tabular-nums">
                    {cupStatistics.cupGoals}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Goals</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-sky-400 tabular-nums">
                    {cupStatistics.cupAppearances}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Appearances</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400 tabular-nums">
                    {cupStatistics.winRate}%
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Win Rate</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-400 tabular-nums">
                    {cupStatistics.cupAssists}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Assists</p>
                </div>
              </div>

              {/* Best run + Best Rating */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#8b949e]">Best Run</p>
                    <p className="text-sm font-bold text-amber-300">{cupStatistics.bestRun}</p>
                  </div>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#8b949e]">Best Rating</p>
                    <p className="text-sm font-bold text-emerald-300">{cupStatistics.bestRating.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Top Performers section */}
              {cupStatistics.cupAppearances > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Top Performers</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Target className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-[8px] text-[#484f58]">Goals</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">{cupStatistics.cupGoals}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <TrendingUp className="h-2.5 w-2.5 text-sky-400" />
                        <span className="text-[8px] text-[#484f58]">Assists</span>
                      </div>
                      <p className="text-sm font-bold text-sky-400 tabular-nums">{cupStatistics.cupAssists}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Star className="h-2.5 w-2.5 text-amber-400" />
                        <span className="text-[8px] text-[#484f58]">MOTM</span>
                      </div>
                      <p className="text-sm font-bold text-amber-400 tabular-nums">{cupStatistics.motmAwards}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Win/Draw/Loss breakdown */}
              {cupStatistics.cupAppearances > 0 && (
                <div className="flex items-center justify-center gap-4 mb-3 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      W {cupStatistics.wins}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-amber-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      D {cupStatistics.draws}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-red-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      L {cupStatistics.losses}
                    </span>
                  </div>
                </div>
              )}

              {/* Historical Cup Performance */}
              {historicalPerformance && (
                <div className="pt-3 border-t border-[#30363d]">
                  <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Historical Performance</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {historicalPerformance.cupTrophies.length}
                      </p>
                      <p className="text-[9px] text-[#8b949e]">Career Cup Trophies</p>
                    </div>
                    <div className="w-px h-8 bg-[#30363d]" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-400">
                        {gameState.player.careerStats?.trophies?.length ?? 0}
                      </p>
                      <p className="text-[9px] text-[#8b949e]">Total Trophies</p>
                    </div>
                  </div>
                  {/* Trophy list */}
                  {historicalPerformance.cupTrophies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {historicalPerformance.cupTrophies.map((trophy, i) => (
                        <Badge
                          key={i}
                          className="bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[8px] px-1.5 py-0"
                        >
                          🏆 {trophy.name} (S{trophy.season})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cup info footnote */}
              <div className="mt-3 pt-2 border-t border-[#30363d]">
                <p className="text-[10px] text-[#484f58] text-center">
                  Cup matches occur every 4 weeks (Weeks {CUP_MATCH_WEEKS.slice(0, 4).join(', ')}...)
                  • Single elimination knockout format
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Cup Statistics Deep Dive ────────────────────────────────── */}
      {cupStatsDeep && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-amber-500" />
                  Cup Stats Deep Dive
                </CardTitle>
                <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[8px] px-1.5">
                  {Array.from({ length: cupStatsDeep.specialistRating }, () => '★').join('')}{Array.from({ length: 5 - cupStatsDeep.specialistRating }, () => '☆').join('')}
                  <span className="ml-1 text-[#8b949e]">Specialist</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* 2x3 stats grid with sparklines */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Cup Goals', value: cupStatsDeep.goals.value, trend: cupStatsDeep.goals.trend, color: '#34d399', spark: cupStatsDeep.sparkline },
                  { label: 'Cup Assists', value: cupStatsDeep.assists.value, trend: cupStatsDeep.assists.trend, color: '#3b82f6', spark: cupStatsDeep.sparkline },
                  { label: 'Clean Sheets', value: cupStatsDeep.cleanSheets.value, trend: cupStatsDeep.cleanSheets.trend, color: '#a78bfa', spark: cupStatsDeep.sparkline },
                  { label: 'Appearances', value: cupStatsDeep.appearances.value, trend: cupStatsDeep.appearances.trend, color: '#f59e0b', spark: cupStatsDeep.sparkline },
                  { label: 'Win Rate', value: cupStatsDeep.winRate.value, trend: cupStatsDeep.winRate.trend, color: '#34d399', spark: cupStatsDeep.sparkline },
                  { label: 'MotM Awards', value: cupStatsDeep.motm.value, trend: cupStatsDeep.motm.trend, color: '#ef4444', spark: cupStatsDeep.sparkline },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#21262d] rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center mb-1">
                      {/* Mini sparkline SVG */}
                      <svg width={48} height={16} viewBox="0 0 48 16" className="opacity-50">
                        {stat.spark.length > 1 && (
                          <polyline
                            points={stat.spark.map((v: number, si: number) => `${si * (48 / (stat.spark.length - 1))},${16 - (v / 10) * 14}`).join(' ')}
                            fill="none"
                            stroke={stat.color}
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                    </div>
                    <p className="text-sm font-bold tabular-nums" style={{ color: stat.color }}>
                      {stat.label === 'Win Rate' ? `${stat.value}%` : stat.value}
                    </p>
                    <p className="text-[7px] text-[#484f58] mt-0.5">{stat.label}</p>
                    {stat.trend !== 0 && (
                      <span className={`text-[7px] font-bold ${stat.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Famous Cup Moments ──────────────────────────────────────── */}
      {famousCupMoments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Famous Cup Moments
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {famousCupMoments.map((moment, idx) => (
                  <motion.div
                    key={`${moment.type}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.38 + idx * 0.06 }}
                    className="flex items-start gap-3 bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
                  >
                    {/* SVG placeholder moment icon */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${moment.color}15` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L17.18 19 12 15.27 6.82 19l2.09-6.26L3.82 9l6.09-.74L12 2z" fill={moment.color} opacity={0.8} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge className="text-[7px] px-1 py-0 h-3.5 border font-bold" style={{
                          backgroundColor: `${moment.color}15`,
                          color: moment.color,
                          borderColor: `${moment.color}30`,
                        }}>
                          {moment.type}
                        </Badge>
                        <span className="text-[8px] text-[#484f58]">S{moment.season}</span>
                      </div>
                      <p className="text-xs font-bold text-[#c9d1d9]">{moment.title}</p>
                      <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{moment.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Utility: ordinal suffix ────────────────────────────────────────────
function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
