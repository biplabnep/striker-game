'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Star, Zap, TrendingUp,
  Target, Brain, Eye, Gauge, ChevronLeft, Clock,
  Filter, BarChart3, Heart, Flame, Crosshair,
  ArrowRight, Timer, UserCheck, Sparkles,
  AlertTriangle, Trophy, Layers,
  SkipForward, RotateCcw
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const COLORS = {
  pageBg: '#0d1117',
  cardBg: '#161b22',
  innerBg: '#21262d',
  border: '#30363d',
  primaryText: '#e6edf3',
  secondaryText: '#c9d1d9',
  mutedText: '#8b949e',
  dimText: '#484f58',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  cyan: '#06B6D4',
};

const TABS = ['draft_pool', 'my_squad', 'draft_strategy', 'season_projections'] as const;
type TabId = (typeof TABS)[number];

const POSITION_COLORS: Record<string, string> = {
  GK: '#F59E0B',
  CB: '#3B82F6', LB: '#3B82F6', RB: '#3B82F6',
  CDM: '#10B981', CM: '#10B981', CAM: '#10B981', LM: '#10B981', RM: '#10B981',
  LW: '#EF4444', RW: '#EF4444', ST: '#EF4444', CF: '#EF4444',
};

const POSITION_CATEGORY: Record<string, string> = {
  GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD', CF: 'FWD',
};

// ============================================================
// Types
// ============================================================

interface DraftPoolPlayer {
  id: string;
  name: string;
  position: string;
  overall: number;
  age: number;
  nationality: string;
  flag: string;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  value: number;
}

interface DraftedPlayer extends DraftPoolPlayer {
  role: 'starter' | 'sub';
}

interface StrategyCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectiveness: number;
  color: string;
}

interface RecommendedTarget {
  id: string;
  name: string;
  position: string;
  overall: number;
  reason: string;
  fitScore: number;
}

interface ComparisonTeam {
  name: string;
  logo: string;
  rating: number;
  style: string;
}

interface ArcSegment {
  seg: {
    label: string;
    count: number;
    color: string;
  };
  startAngle: number;
  endAngle: number;
}

interface TeamNeed {
  position: string;
  priority: string;
  reason: string;
  color: string;
}

interface DraftPickTimelineEntry {
  round: number;
  status: 'made' | 'current' | 'available' | 'skipped';
  label: string;
}

interface PlayStyleMetric {
  label: string;
  value: number;
  color: string;
}

// ============================================================
// Mock Data
// ============================================================

const MOCK_POOL_PLAYERS: DraftPoolPlayer[] = [
  { id: 'p1', name: 'Marcus Rashford', position: 'LW', overall: 84, age: 25, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 91, shooting: 79, passing: 77, defending: 35, physical: 73, value: 75 },
  { id: 'p2', name: 'Virgil van Dijk', position: 'CB', overall: 88, age: 30, nationality: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', pace: 73, shooting: 55, passing: 72, defending: 92, physical: 85, value: 68 },
  { id: 'p3', name: 'Pedro Goncalves', position: 'CAM', overall: 81, age: 24, nationality: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}', pace: 76, shooting: 82, passing: 80, defending: 42, physical: 65, value: 45 },
  { id: 'p4', name: 'Mike Maignan', position: 'GK', overall: 86, age: 27, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 48, shooting: 18, passing: 62, defending: 35, physical: 78, value: 58 },
  { id: 'p5', name: 'Jude Bellingham', position: 'CM', overall: 85, age: 20, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 72, shooting: 78, passing: 83, defending: 72, physical: 77, value: 92 },
  { id: 'p6', name: 'Khvicha Kvaratskhelia', position: 'LW', overall: 82, age: 22, nationality: 'Georgia', flag: '\u{1F1EC}\u{1F1EA}', pace: 88, shooting: 78, passing: 80, defending: 30, physical: 68, value: 70 },
];

const MOCK_DRAFTED_SQUAD: DraftedPlayer[] = [
  { id: 's1', name: 'Alisson Becker', position: 'GK', overall: 87, age: 30, nationality: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', pace: 50, shooting: 20, passing: 68, defending: 40, physical: 80, value: 72, role: 'starter' },
  { id: 's2', name: 'Trent Alexander-Arnold', position: 'RB', overall: 85, age: 24, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 78, shooting: 72, passing: 90, defending: 76, physical: 68, value: 80, role: 'starter' },
  { id: 's3', name: 'Ruben Dias', position: 'CB', overall: 86, age: 26, nationality: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}', pace: 68, shooting: 42, passing: 70, defending: 89, physical: 84, value: 70, role: 'starter' },
  { id: 's4', name: 'William Saliba', position: 'CB', overall: 84, age: 22, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 80, shooting: 35, passing: 65, defending: 86, physical: 80, value: 65, role: 'starter' },
  { id: 's5', name: 'Theo Hernandez', position: 'LB', overall: 84, age: 25, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 90, shooting: 72, passing: 75, defending: 78, physical: 82, value: 68, role: 'starter' },
  { id: 's6', name: 'Rodri', position: 'CDM', overall: 88, age: 26, nationality: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', pace: 58, shooting: 70, passing: 85, defending: 88, physical: 82, value: 85, role: 'starter' },
  { id: 's7', name: 'Kevin De Bruyne', position: 'CAM', overall: 88, age: 31, nationality: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}', pace: 68, shooting: 85, passing: 93, defending: 55, physical: 70, value: 90, role: 'starter' },
  { id: 's8', name: 'Federico Valverde', position: 'CM', overall: 84, age: 24, nationality: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}', pace: 86, shooting: 76, passing: 78, defending: 74, physical: 82, value: 72, role: 'starter' },
  { id: 's9', name: 'Vinicius Jr', position: 'LW', overall: 87, age: 22, nationality: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', pace: 95, shooting: 82, passing: 78, defending: 28, physical: 60, value: 95, role: 'starter' },
  { id: 's10', name: 'Erling Haaland', position: 'ST', overall: 89, age: 22, nationality: 'Norway', flag: '\u{1F1F3}\u{1F1F4}', pace: 78, shooting: 94, passing: 60, defending: 25, physical: 88, value: 98, role: 'starter' },
  { id: 's11', name: 'Bukayo Saka', position: 'RW', overall: 85, age: 21, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 84, shooting: 76, passing: 82, defending: 68, physical: 65, value: 82, role: 'starter' },
  { id: 's12', name: 'Giovanni Di Lorenzo', position: 'RB', overall: 80, age: 29, nationality: 'Italy', flag: '\u{1F1EE}\u{1F1F9}', pace: 74, shooting: 55, passing: 72, defending: 80, physical: 78, value: 42, role: 'sub' },
  { id: 's13', name: 'Dayot Upamecano', position: 'CB', overall: 81, age: 24, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 78, shooting: 40, passing: 62, defending: 84, physical: 80, value: 50, role: 'sub' },
  { id: 's14', name: 'Martin Zubimendi', position: 'CDM', overall: 80, age: 24, nationality: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', pace: 62, shooting: 62, passing: 82, defending: 82, physical: 72, value: 48, role: 'sub' },
  { id: 's15', name: 'Phil Foden', position: 'CAM', overall: 83, age: 22, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 78, shooting: 80, passing: 85, defending: 48, physical: 55, value: 75, role: 'sub' },
  { id: 's16', name: 'Randal Kolo Muani', position: 'ST', overall: 79, age: 24, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 82, shooting: 76, passing: 68, defending: 40, physical: 78, value: 45, role: 'sub' },
  { id: 's17', name: 'Manuel Neuer', position: 'GK', overall: 82, age: 36, nationality: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', pace: 42, shooting: 15, passing: 72, defending: 30, physical: 75, value: 25, role: 'sub' },
  { id: 's18', name: 'Nico Williams', position: 'LW', overall: 78, age: 21, nationality: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', pace: 92, shooting: 72, passing: 74, defending: 32, physical: 62, value: 40, role: 'sub' },
];

const MOCK_STRATEGIES: StrategyCard[] = [
  { id: 'best_avail', name: 'Best Available', description: 'Always pick the highest-rated player remaining in the pool regardless of position.', icon: '\u2B50', effectiveness: 78, color: COLORS.amber },
  { id: 'pos_need', name: 'Position Need', description: 'Prioritize filling empty squad slots and weakest positions first.', icon: '\u{1F3AF}', effectiveness: 85, color: COLORS.emerald },
  { id: 'budget_val', name: 'Budget Value', description: 'Maximize overall-per-cost ratio to get the best value picks.', icon: '\u{1F4B0}', effectiveness: 72, color: COLORS.blue },
  { id: 'youth_first', name: 'Youth First', description: 'Target players under 23 with high potential for long-term growth.', icon: '\u{1F31F}', effectiveness: 68, color: COLORS.purple },
];

const MOCK_RECOMMENDED_TARGETS: RecommendedTarget[] = [
  { id: 't1', name: 'Lamine Yamal', position: 'RW', overall: 79, reason: 'Young winger with elite potential and fits RW gap', fitScore: 94 },
  { id: 't2', name: 'Leny Yoro', position: 'CB', overall: 77, reason: 'Top young CB prospect, strong defensive cover', fitScore: 88 },
  { id: 't3', name: 'Arda Guler', position: 'CAM', overall: 78, reason: 'Creative playmaker to strengthen midfield depth', fitScore: 82 },
];

const MOCK_COMPARISON_TEAMS: ComparisonTeam[] = [
  { name: 'Manchester City', logo: '\u{1F535}', rating: 90, style: 'Possession' },
  { name: 'Arsenal', logo: '\u{1F534}', rating: 87, style: 'Pressing' },
  { name: 'Liverpool', logo: '\u{1F7E5}', rating: 86, style: 'Counter' },
];

const MOCK_EXTRA_POOL_PLAYERS: DraftPoolPlayer[] = [
  { id: 'p7', name: 'Declan Rice', position: 'CDM', overall: 86, age: 24, nationality: 'England', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', pace: 70, shooting: 68, passing: 82, defending: 86, physical: 80, value: 80 },
  { id: 'p8', name: 'Florian Wirtz', position: 'CAM', overall: 83, age: 20, nationality: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', pace: 75, shooting: 78, passing: 88, defending: 38, physical: 58, value: 78 },
  { id: 'p9', name: 'William Saliba', position: 'CB', overall: 85, age: 22, nationality: 'France', flag: '\u{1F1EB}\u{1F1F7}', pace: 80, shooting: 35, passing: 65, defending: 87, physical: 80, value: 72 },
  { id: 'p10', name: 'Gavi', position: 'CM', overall: 80, age: 19, nationality: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', pace: 74, shooting: 68, passing: 82, defending: 72, physical: 70, value: 55 },
];

const ALL_POOL_PLAYERS: DraftPoolPlayer[] = [...MOCK_POOL_PLAYERS, ...MOCK_EXTRA_POOL_PLAYERS];

const TEAM_NEEDS_DATA: TeamNeed[] = [
  { position: 'CB', priority: 'High', reason: 'Need 1 more quality center-back for depth', color: COLORS.red },
  { position: 'CM', priority: 'Medium', reason: 'Add depth to midfield rotation', color: COLORS.amber },
  { position: 'ST', priority: 'High', reason: 'Backup striker needed for squad depth', color: COLORS.red },
  { position: 'RB', priority: 'Low', reason: 'Current RB is sufficient for the season', color: COLORS.emerald },
];

const PLAY_STYLE_DATA: PlayStyleMetric[] = [
  { label: 'Attacking', value: 72, color: COLORS.red },
  { label: 'Possession', value: 65, color: COLORS.blue },
  { label: 'Pressing', value: 78, color: COLORS.amber },
  { label: 'Defensive', value: 68, color: COLORS.emerald },
];

// ============================================================
// Helper Functions
// ============================================================

function getOvrColor(ovr: number): string {
  if (ovr >= 85) return 'text-yellow-400';
  if (ovr >= 75) return 'text-green-400';
  if (ovr >= 65) return COLORS.secondaryText;
  return COLORS.mutedText;
}

function getOvrBg(ovr: number): string {
  if (ovr >= 85) return 'bg-yellow-400/10 border border-yellow-400/30';
  if (ovr >= 75) return 'bg-green-400/10 border border-green-400/30';
  if (ovr >= 65) return `bg-[${COLORS.innerBg}] border border-[${COLORS.border}]`;
  return `bg-[${COLORS.cardBg}] border border-[${COLORS.border}]`;
}

function buildDonutArcs(
  segments: { label: string; count: number; color: string }[],
  cx: number,
  cy: number,
  r: number
): ArcSegment[] {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return segments.map((seg) => ({ seg, startAngle: 0, endAngle: 0 }));

  return segments.reduce((acc: ArcSegment[], seg) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const segAngle = (seg.count / total) * 360;
    return [...acc, { seg, startAngle: prevEnd, endAngle: prevEnd + segAngle }];
  }, []);
}

function arcToPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number, innerR: number): string {
  const startRad = (startDeg - 90) * (Math.PI / 180);
  const endRad = (endDeg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const ix1 = cx + innerR * Math.cos(endRad);
  const iy1 = cy + innerR * Math.sin(endRad);
  const ix2 = cx + innerR * Math.cos(startRad);
  const iy2 = cy + innerR * Math.sin(startRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}

function radarPoints(cx: number, cy: number, r: number, values: number[], axes: number): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const vr = (v / 100) * r;
      return `${cx + vr * Math.cos(angle)},${cy + vr * Math.sin(angle)}`;
    })
    .join(' ');
}

function radarAxisPoints(cx: number, cy: number, r: number, index: number, total: number): string {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  return `${cx},${cy} ${x},${y}`;
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildRadarGridPoints(cx: number, cy: number, r: number, axes: number): string {
  const result: string[] = [];
  for (let i = 0; i < axes; i++) {
    const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
    result.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return result.join(' ');
}

function buildLineChartPoints(
  data: number[],
  padL: number,
  padT: number,
  chartW: number,
  chartH: number,
  minVal: number,
  maxVal: number
): string {
  return data
    .map((val, i) => {
      const x = padL + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = padT + (1 - (val - minVal) / (maxVal - minVal)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');
}

function buildAreaChartPoints(
  data: number[],
  padL: number,
  padT: number,
  chartW: number,
  chartH: number,
  minVal: number,
  maxVal: number
): string {
  const linePoints = buildLineChartPoints(data, padL, padT, chartW, chartH, minVal, maxVal);
  return `${padL},${padT + chartH} ${linePoints} ${padL + chartW},${padT + chartH}`;
}

function getPositionGroup(pos: string): string {
  return POSITION_CATEGORY[pos] ?? 'MID';
}

function calculatePositionCounts(players: DraftPoolPlayer[]): Record<string, number> {
  const groups = ['GK', 'DEF', 'MID', 'FWD', 'CF'];
  return players.reduce((acc, player) => {
    const group = getPositionGroup(player.position);
    return { ...acc, [group]: (acc[group] ?? 0) + 1 };
  }, {} as Record<string, number>);
}

function calculateRatingBuckets(players: DraftPoolPlayer[]): { label: string; count: number }[] {
  return [
    { label: '85+', count: players.filter((p) => p.overall >= 85).length },
    { label: '80-84', count: players.filter((p) => p.overall >= 80 && p.overall <= 84).length },
    { label: '75-79', count: players.filter((p) => p.overall >= 75 && p.overall <= 79).length },
    { label: '70-74', count: players.filter((p) => p.overall >= 70 && p.overall <= 74).length },
    { label: '65-69', count: players.filter((p) => p.overall >= 65 && p.overall <= 69).length },
  ];
}

// ============================================================
// SVG: Position Distribution Donut (Tab 1)
// ============================================================

function PositionDistributionDonut(): React.JSX.Element {
  const cx = 80;
  const cy = 80;
  const r = 55;
  const innerR = 35;

  const segments = [
    { label: 'GK', count: 3, color: COLORS.amber },
    { label: 'DEF', count: 12, color: COLORS.blue },
    { label: 'MID', count: 15, color: COLORS.emerald },
    { label: 'FWD', count: 10, color: COLORS.red },
    { label: 'CF', count: 4, color: COLORS.purple },
  ];

  const arcs = buildDonutArcs(segments, cx, cy, r);

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px]">
      <text x={cx} y={14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="9" fontWeight="600">POSITION DISTRIBUTION</text>
      {arcs.map((arc, i) => {
        const gap = 1.5;
        const s = arc.startAngle + gap;
        const e = arc.endAngle - gap;
        if (e <= s) return null;
        return (
          <path
            key={arc.seg.label}
            d={arcToPath(cx, cy, r, s, e, innerR)}
            fill={arc.seg.color}
            fillOpacity={0.85}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.primaryText} fontSize="16" fontWeight="700">44</text>
      <text x={cx} y={cy + 10} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="8">PLAYERS</text>
      {segments.map((seg, i) => {
        const midAngle = arcs[i] ? (arcs[i].startAngle + arcs[i].endAngle) / 2 : 0;
        const labelR = r + 14;
        const rad = (midAngle - 90) * (Math.PI / 180);
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        return (
          <text key={seg.label} x={lx} y={ly} textAnchor={"middle" as "start" | "middle" | "end"} fill={seg.color} fontSize="7" fontWeight="600">
            {seg.label} ({seg.count})
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Player Rating Distribution Bars (Tab 1)
// ============================================================

function PlayerRatingBars(): React.JSX.Element {
  const bars = [
    { label: '85+', count: 8, color: COLORS.amber },
    { label: '80-84', count: 14, color: COLORS.emerald },
    { label: '75-79', count: 12, color: COLORS.blue },
    { label: '70-74', count: 7, color: COLORS.purple },
    { label: '65-69', count: 3, color: COLORS.mutedText },
  ];

  const maxCount = 14;
  const barH = 16;
  const gap = 8;
  const labelW = 42;
  const barMaxW = 100;
  const valueW = 28;
  const totalW = labelW + barMaxW + valueW + 16;
  const totalH = bars.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[220px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">RATING DISTRIBUTION</text>
      {bars.map((bar, i) => {
        const y = i * (barH + gap) + 22;
        const barW = (bar.count / maxCount) * barMaxW;
        return (
          <g key={bar.label}>
            <text x={4} y={y + barH - 3} fill={COLORS.mutedText} fontSize="9">{bar.label}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.innerBg} />
            <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill={bar.color} fillOpacity={0.8} />
            <text x={labelW + barMaxW + 4} y={y + barH - 3} fill={COLORS.secondaryText} fontSize="9" fontWeight="600">{bar.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Draft Pick Timeline (Tab 1)
// ============================================================

function DraftPickTimeline(): React.JSX.Element {
  const cx = 140;
  const cy = 30;
  const dotR = 8;
  const spacing = 34;
  const startX = cx - (spacing * 3.5);

  const picks = [
    { round: 1, status: 'made' as const, label: 'Haaland' },
    { round: 2, status: 'made' as const, label: 'Bellingham' },
    { round: 3, status: 'current' as const, label: '' },
    { round: 4, status: 'available' as const, label: '' },
    { round: 5, status: 'available' as const, label: '' },
    { round: 6, status: 'skipped' as const, label: '' },
    { round: 7, status: 'available' as const, label: '' },
    { round: 8, status: 'available' as const, label: '' },
  ];

  const statusColors: Record<string, string> = {
    made: COLORS.emerald,
    current: COLORS.amber,
    available: COLORS.border,
    skipped: COLORS.dimText,
  };

  const connectionPoints = picks.map((_, i) => `${startX + i * spacing},${cy}`).join(' ');

  return (
    <svg viewBox="0 0 280 70" className="w-full max-w-[320px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">DRAFT PICK TIMELINE</text>
      <polyline points={connectionPoints} fill="none" stroke={COLORS.border} strokeWidth="2" strokeLinecap="round" />
      {picks.map((pick, i) => {
        const px = startX + i * spacing;
        return (
          <g key={pick.round}>
            <circle cx={px} cy={cy} r={dotR} fill={statusColors[pick.status]} />
            {pick.status === 'current' && (
              <circle cx={px} cy={cy} r={dotR + 3} fill="none" stroke={COLORS.amber} strokeWidth="1.5" fillOpacity={0.3} />
            )}
            <text x={px} y={cy + 3} textAnchor={"middle" as "start" | "middle" | "end"} fill={pick.status === 'available' ? COLORS.dimText : COLORS.pageBg} fontSize="7" fontWeight="700">{pick.round}</text>
            <text x={px} y={cy + dotR + 14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">{pick.label || `R${pick.round}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Squad Rating Radar (Tab 2)
// ============================================================

function SquadRatingRadar(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const axes = 6;
  const values = [88, 82, 85, 80, 78, 84];
  const labels = ['Attack', 'Midfield', 'Defense', 'Pace', 'Physical', 'Technique'];
  const levels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[240px]">
      <text x={cx} y={14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="9" fontWeight="600">SQUAD RATING RADAR</text>
      {/* Grid rings */}
      {levels.map((level) => {
        const lr = (level / 100) * r;
        const ringPts = labels.map((_, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          return `${cx + lr * Math.cos(angle)},${cy + lr * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon key={level} points={ringPts} fill="none" stroke={COLORS.border} strokeWidth="0.5" />
        );
      })}
      {/* Axis lines */}
      {labels.map((_, i) => {
        const pts = radarAxisPoints(cx, cy, r, i, axes);
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        return (
          <g key={labels[i]}>
            <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={lx} y={ly + 3} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">{labels[i]}</text>
          </g>
        );
      })}
      {/* Data polygon */}
      <polygon
        points={radarPoints(cx, cy, r, values, axes)}
        fill={COLORS.emerald}
        fillOpacity={0.2}
        stroke={COLORS.emerald}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {values.map((v, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const vr = (v / 100) * r;
        const px = cx + vr * Math.cos(angle);
        const py = cy + vr * Math.sin(angle);
        return <circle key={labels[i]} cx={px} cy={py} r="3" fill={COLORS.emerald} />;
      })}
    </svg>
  );
}

// ============================================================
// SVG: Squad Value Distribution Donut (Tab 2)
// ============================================================

function SquadValueDonut(): React.JSX.Element {
  const cx = 80;
  const cy = 80;
  const r = 52;
  const innerR = 32;

  const segments = [
    { label: 'Starters', count: 45, color: COLORS.emerald },
    { label: 'Subs', count: 20, color: COLORS.blue },
    { label: 'Youth', count: 10, color: COLORS.cyan },
    { label: 'Stars', count: 18, color: COLORS.amber },
    { label: 'Budget', count: 7, color: COLORS.mutedText },
  ];

  const arcs = buildDonutArcs(segments, cx, cy, r);

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px]">
      <text x={cx} y={14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="9" fontWeight="600">SQUAD VALUE</text>
      {arcs.map((arc) => {
        const gap = 1.5;
        const s = arc.startAngle + gap;
        const e = arc.endAngle - gap;
        if (e <= s) return null;
        return (
          <path
            key={arc.seg.label}
            d={arcToPath(cx, cy, r, s, e, innerR)}
            fill={arc.seg.color}
            fillOpacity={0.8}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.primaryText} fontSize="14" fontWeight="700">€820M</text>
      <text x={cx} y={cy + 10} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">TOTAL VALUE</text>
      {segments.map((seg, i) => {
        const midAngle = arcs[i] ? (arcs[i].startAngle + arcs[i].endAngle) / 2 : 0;
        const labelR = r + 14;
        const rad = (midAngle - 90) * (Math.PI / 180);
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        return (
          <text key={seg.label} x={lx} y={ly} textAnchor={"middle" as "start" | "middle" | "end"} fill={seg.color} fontSize="6" fontWeight="600">
            {seg.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Position Depth Bars (Tab 2)
// ============================================================

function PositionDepthBars(): React.JSX.Element {
  const bars = [
    { label: 'GK', depth: 2, needed: 2, color: COLORS.amber },
    { label: 'CB', depth: 4, needed: 4, color: COLORS.blue },
    { label: 'FB', depth: 3, needed: 4, color: COLORS.cyan },
    { label: 'CDM', depth: 2, needed: 2, color: COLORS.emerald },
    { label: 'CM', depth: 3, needed: 3, color: COLORS.purple },
    { label: 'FWD', depth: 4, needed: 4, color: COLORS.red },
  ];

  const maxDepth = 5;
  const barH = 14;
  const gap = 7;
  const labelW = 32;
  const barMaxW = 90;
  const totalW = labelW + barMaxW + 40;
  const totalH = bars.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[200px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">POSITION DEPTH</text>
      {bars.map((bar) => {
        const y = bars.indexOf(bar) * (barH + gap) + 22;
        const depthW = (bar.depth / maxDepth) * barMaxW;
        const neededW = (bar.needed / maxDepth) * barMaxW;
        return (
          <g key={bar.label}>
            <text x={4} y={y + barH - 3} fill={COLORS.mutedText} fontSize="8">{bar.label}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.innerBg} />
            <rect x={labelW} y={y} width={neededW} height={barH} rx="3" fill={COLORS.border} />
            <rect x={labelW} y={y} width={depthW} height={barH} rx="3" fill={bar.color} fillOpacity={0.8} />
            <text x={labelW + barMaxW + 4} y={y + barH - 3} fill={COLORS.secondaryText} fontSize="8">{bar.depth}/{bar.needed}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Strategy Effectiveness Bars (Tab 3)
// ============================================================

function StrategyEffectivenessBars(): React.JSX.Element {
  const bars = MOCK_STRATEGIES.map((s) => ({
    label: s.name,
    value: s.effectiveness,
    color: s.color,
  }));

  const maxVal = 100;
  const barH = 18;
  const gap = 10;
  const labelW = 72;
  const barMaxW = 110;
  const valueW = 28;
  const totalW = labelW + barMaxW + valueW + 12;
  const totalH = bars.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[260px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">STRATEGY EFFECTIVENESS</text>
      {bars.map((bar) => {
        const y = bars.indexOf(bar) * (barH + gap) + 22;
        const barW = (bar.value / maxVal) * barMaxW;
        return (
          <g key={bar.label}>
            <text x={4} y={y + barH - 4} fill={COLORS.mutedText} fontSize="8">{bar.label}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="4" fill={COLORS.innerBg} />
            <rect x={labelW} y={y} width={barW} height={barH} rx="4" fill={bar.color} fillOpacity={0.8} />
            <text x={labelW + barMaxW + 4} y={y + barH - 4} fill={COLORS.secondaryText} fontSize="9" fontWeight="600">{bar.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Needs Analysis Radar (Tab 3)
// ============================================================

function NeedsAnalysisRadar(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 65;
  const axes = 5;
  const values = [40, 75, 60, 80, 50];
  const labels = ['GK', 'DEF', 'MID', 'FWD', 'Depth'];
  const levels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[240px]">
      <text x={cx} y={14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="9" fontWeight="600">NEEDS ANALYSIS</text>
      {levels.map((level) => {
        const lr = (level / 100) * r;
        const ringPts = labels.map((_, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          return `${cx + lr * Math.cos(angle)},${cy + lr * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon key={level} points={ringPts} fill="none" stroke={COLORS.border} strokeWidth="0.5" />
        );
      })}
      {labels.map((_, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        const needColor = values[i] < 50 ? COLORS.red : values[i] < 70 ? COLORS.amber : COLORS.emerald;
        return (
          <g key={labels[i]}>
            <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={lx} y={ly + 3} textAnchor={"middle" as "start" | "middle" | "end"} fill={needColor} fontSize="8" fontWeight="600">{labels[i]}</text>
          </g>
        );
      })}
      <polygon
        points={radarPoints(cx, cy, r, values, axes)}
        fill={COLORS.red}
        fillOpacity={0.15}
        stroke={COLORS.amber}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const vr = (v / 100) * r;
        const px = cx + vr * Math.cos(angle);
        const py = cy + vr * Math.sin(angle);
        return <circle key={labels[i]} cx={px} cy={py} r="3" fill={COLORS.amber} />;
      })}
    </svg>
  );
}

// ============================================================
// SVG: Draft Value Line Chart (Tab 3)
// ============================================================

function DraftValueLineChart(): React.JSX.Element {
  const padL = 30;
  const padR = 10;
  const padT = 24;
  const padB = 24;
  const w = 220;
  const h = 120;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const picks = [
    { round: 1, value: 92 },
    { round: 2, value: 87 },
    { round: 3, value: 85 },
    { round: 4, value: 82 },
    { round: 5, value: 80 },
    { round: 6, value: 78 },
    { round: 7, value: 76 },
    { round: 8, value: 74 },
  ];

  const minVal = 70;
  const maxVal = 95;

  const linePoints = picks
    .map((p, i) => {
      const x = padL + (i / (picks.length - 1)) * chartW;
      const y = padT + (1 - (p.value - minVal) / (maxVal - minVal)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padL},${padT + chartH} ${linePoints} ${padL + chartW},${padT + chartH}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[260px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">DRAFT VALUE PER ROUND</text>
      {/* Y axis labels */}
      {[70, 80, 90].map((v) => {
        const y = padT + (1 - (v - minVal) / (maxVal - minVal)) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill={COLORS.dimText} fontSize="7">{v}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <polygon points={areaPoints} fill={COLORS.emerald} fillOpacity={0.1} />
      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={COLORS.emerald} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots and labels */}
      {picks.map((p, i) => {
        const x = padL + (i / (picks.length - 1)) * chartW;
        const y = padT + (1 - (p.value - minVal) / (maxVal - minVal)) * chartH;
        return (
          <g key={p.round}>
            <circle cx={x} cy={y} r="3" fill={COLORS.emerald} />
            <text x={x} y={padT + chartH + 14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">R{p.round}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Projected Points Area Chart (Tab 4)
// ============================================================

function ProjectedPointsAreaChart(): React.JSX.Element {
  const padL = 32;
  const padR = 10;
  const padT = 24;
  const padB = 24;
  const w = 280;
  const h = 140;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const matches = [18, 22, 25, 28, 30, 33, 35, 38, 40, 43];
  const minPts = 10;
  const maxPts = 50;

  const linePoints = matches
    .map((pts, i) => {
      const x = padL + (i / (matches.length - 1)) * chartW;
      const y = padT + (1 - (pts - minPts) / (maxPts - minPts)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padL},${padT + chartH} ${linePoints} ${padL + chartW},${padT + chartH}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[320px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">PROJECTED POINTS TREND</text>
      {[10, 20, 30, 40, 50].map((v) => {
        const y = padT + (1 - (v - minPts) / (maxPts - minPts)) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill={COLORS.dimText} fontSize="7">{v}</text>
          </g>
        );
      })}
      <polygon points={areaPoints} fill={COLORS.blue} fillOpacity={0.12} />
      <polyline points={linePoints} fill="none" stroke={COLORS.blue} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {matches.map((pts, i) => {
        const x = padL + (i / (matches.length - 1)) * chartW;
        const y = padT + (1 - (pts - minPts) / (maxPts - minPts)) * chartH;
        return (
          <g key={`match-${i}`}>
            <circle cx={x} cy={y} r="2.5" fill={COLORS.blue} />
            <text x={x} y={padT + chartH + 14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">GW{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Strength Comparison Butterfly (Tab 4)
// ============================================================

function StrengthComparisonButterfly(): React.JSX.Element {
  const cx = 150;
  const padT = 28;
  const padB = 12;
  const h = 150;
  const chartH = h - padT - padB;
  const halfW = 100;

  const metrics = [
    { label: 'Attack', yours: 88, league: 78 },
    { label: 'Midfield', yours: 84, league: 76 },
    { label: 'Defense', yours: 86, league: 74 },
    { label: 'Pace', yours: 82, league: 75 },
    { label: 'Physical', yours: 80, league: 73 },
  ];

  const maxVal = 100;
  const barH = 14;
  const gap = 10;
  const totalBarH = metrics.length * (barH + gap) - gap;

  return (
    <svg viewBox={`0 0 300 ${h}`} className="w-full max-w-[340px]">
      <text x={cx} y={12} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="9" fontWeight="600">STRENGTH VS LEAGUE AVG</text>
      {/* Labels */}
      <text x={cx - halfW} y={padT - 4} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.dimText} fontSize="7">LEAGUE AVG</text>
      <text x={cx + halfW} y={padT - 4} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.dimText} fontSize="7">YOUR SQUAD</text>
      {/* Center line */}
      <line x1={cx} y1={padT} x2={cx} y2={padT + totalBarH} stroke={COLORS.border} strokeWidth="1" />
      {metrics.map((m, i) => {
        const y = padT + i * (barH + gap);
        const yourW = (m.yours / maxVal) * halfW;
        const leagueW = (m.league / maxVal) * halfW;
        return (
          <g key={m.label}>
            {/* League bar (left) */}
            <rect x={cx - leagueW} y={y} width={leagueW} height={barH} rx="3" fill={COLORS.purple} fillOpacity={0.5} />
            {/* Your bar (right) */}
            <rect x={cx} y={y} width={yourW} height={barH} rx="3" fill={COLORS.emerald} fillOpacity={0.7} />
            {/* Label */}
            <text x={cx} y={y + barH - 2} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7" fontWeight="600">{m.label}</text>
            {/* Values */}
            <text x={cx - leagueW - 3} y={y + barH - 2} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.mutedText} fontSize="7">{m.league}</text>
            <text x={cx + yourW + 3} y={y + barH - 2} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.secondaryText} fontSize="7">{m.yours}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Chemistry Build Bars (Tab 4)
// ============================================================

function ChemistryBuildBars(): React.JSX.Element {
  const stages = [
    { label: 'Foundation', value: 45, color: COLORS.red },
    { label: 'Understanding', value: 62, color: COLORS.amber },
    { label: 'Coordination', value: 74, color: COLORS.blue },
    { label: 'Synergy', value: 85, color: COLORS.cyan },
    { label: 'Peak Chemistry', value: 92, color: COLORS.emerald },
  ];

  const maxVal = 100;
  const barH = 16;
  const gap = 10;
  const labelW = 80;
  const barMaxW = 130;
  const valueW = 30;
  const totalW = labelW + barMaxW + valueW + 16;
  const totalH = stages.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[300px]">
      <text x={4} y={12} fill={COLORS.mutedText} fontSize="9" fontWeight="600">CHEMISTRY DEVELOPMENT</text>
      {stages.map((stage) => {
        const y = stages.indexOf(stage) * (barH + gap) + 22;
        const barW = (stage.value / maxVal) * barMaxW;
        return (
          <g key={stage.label}>
            <text x={4} y={y + barH - 4} fill={COLORS.mutedText} fontSize="8">{stage.label}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="4" fill={COLORS.innerBg} />
            <rect x={labelW} y={y} width={barW} height={barH} rx="4" fill={stage.color} fillOpacity={0.75} />
            <text x={labelW + barMaxW + 4} y={y + barH - 4} fill={COLORS.secondaryText} fontSize="9" fontWeight="600">{stage.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TabHeader({ title, subtitle }: { title: string; subtitle: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryText }}>{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: COLORS.mutedText }}>{subtitle}</p>
      </div>
    </div>
  );
}

function DraftPoolPlayerCard({ player, onDraft }: { player: DraftPoolPlayer; onDraft: (p: DraftPoolPlayer) => void }): React.JSX.Element {
  const posColor = POSITION_COLORS[player.position] ?? COLORS.mutedText;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg p-3 border"
      style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border, borderLeftColor: posColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border" style={{ backgroundColor: COLORS.innerBg, borderColor: COLORS.border }}>
          <span className={`text-sm font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{player.flag}</span>
            <span className="text-xs font-semibold truncate" style={{ color: COLORS.primaryText }}>{player.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${posColor}20`, color: posColor }}>
              {player.position}
            </span>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>Age {player.age}</span>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{player.nationality}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-semibold" style={{ color: COLORS.emerald }}>€{player.value}M</span>
          <Button size="sm" className="h-6 px-2 text-[10px] rounded-md" style={{ backgroundColor: COLORS.emerald }} onClick={() => onDraft(player)}>
            <UserCheck className="h-3 w-3 mr-1" /> Draft
          </Button>
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        {[
          { label: 'PAC', val: player.pace },
          { label: 'SHO', val: player.shooting },
          { label: 'PAS', val: player.passing },
          { label: 'DEF', val: player.defending },
          { label: 'PHY', val: player.physical },
        ].map((attr) => (
          <div key={attr.label} className="flex flex-col items-center flex-1">
            <span className="text-[8px]" style={{ color: COLORS.dimText }}>{attr.label}</span>
            <div className="w-full h-1 rounded-full mt-0.5" style={{ backgroundColor: COLORS.innerBg }}>
              <div className="h-full rounded-full" style={{ width: `${attr.val}%`, backgroundColor: posColor, opacity: 0.8 }} />
            </div>
            <span className="text-[8px] mt-0.5" style={{ color: COLORS.mutedText }}>{attr.val}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DraftTimer(): React.JSX.Element {
  const timerRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 45;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerColor = timeLeft <= 10 ? COLORS.red : timeLeft <= 20 ? COLORS.amber : COLORS.emerald;

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <Timer className="h-4 w-4" style={{ color: timerColor }} />
      <div className="flex flex-col">
        <span className="text-[10px]" style={{ color: COLORS.mutedText }}>DRAFT TIMER</span>
        <span className="text-sm font-bold font-mono" style={{ color: timerColor }}>{formatTimer(timeLeft)}</span>
      </div>
    </div>
  );
}

function DraftPoolFilters({
  positionFilter,
  setPositionFilter,
  ratingFilter,
  setRatingFilter,
}: {
  positionFilter: string;
  setPositionFilter: (f: string) => void;
  ratingFilter: string;
  setRatingFilter: (f: string) => void;
}): React.JSX.Element {
  const posOptions = ['All', 'GK', 'DEF', 'MID', 'FWD'];
  const ratingOptions = ['Any', '85+', '80-84', '75-79', '70-74'];

  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Filter className="h-3 w-3" style={{ color: COLORS.mutedText }} />
        {posOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setPositionFilter(opt)}
            className="px-2 py-1 rounded-md text-[10px] font-medium border transition-colors"
            style={{
              backgroundColor: positionFilter === opt ? `${COLORS.emerald}15` : COLORS.cardBg,
              borderColor: positionFilter === opt ? `${COLORS.emerald}50` : COLORS.border,
              color: positionFilter === opt ? COLORS.emerald : COLORS.mutedText,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Gauge className="h-3 w-3" style={{ color: COLORS.mutedText }} />
        {ratingOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setRatingFilter(opt)}
            className="px-2 py-1 rounded-md text-[10px] font-medium border transition-colors"
            style={{
              backgroundColor: ratingFilter === opt ? `${COLORS.blue}15` : COLORS.cardBg,
              borderColor: ratingFilter === opt ? `${COLORS.blue}50` : COLORS.border,
              color: ratingFilter === opt ? COLORS.blue : COLORS.mutedText,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SquadStatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }): React.JSX.Element {
  return (
    <div className="rounded-lg p-3 border flex items-center gap-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: COLORS.primaryText }}>{value}</span>
      </div>
    </div>
  );
}

function SquadPlayerRow({ player, index }: { player: DraftedPlayer; index: number }): React.JSX.Element {
  const posColor = POSITION_COLORS[player.position] ?? COLORS.mutedText;

  return (
    <div
      className="flex items-center gap-2 rounded-md px-2.5 py-2 border"
      style={{
        backgroundColor: player.role === 'starter' ? `${COLORS.innerBg}` : COLORS.cardBg,
        borderColor: COLORS.border,
      }}
    >
      <span className="text-[10px] font-bold w-5 text-center" style={{ color: COLORS.dimText }}>{index + 1}</span>
      <div className="w-7 h-7 rounded-md flex items-center justify-center border flex-shrink-0" style={{ backgroundColor: COLORS.innerBg, borderColor: COLORS.border }}>
        <span className={`text-[10px] font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
      </div>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${posColor}20`, color: posColor }}>
        {player.position}
      </span>
      <span className="text-xs font-medium truncate flex-1" style={{ color: COLORS.primaryText }}>{player.name}</span>
      <span className="text-xs">{player.flag}</span>
      <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 rounded-md" style={{ borderColor: player.role === 'starter' ? `${COLORS.emerald}40` : `${COLORS.mutedText}40`, color: player.role === 'starter' ? COLORS.emerald : COLORS.mutedText }}>
        {player.role === 'starter' ? 'XI' : 'SUB'}
      </Badge>
    </div>
  );
}

function StrategyCardItem({ strategy }: { strategy: StrategyCard }): React.JSX.Element {
  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border, borderLeftColor: strategy.color, borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{strategy.icon}</span>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>{strategy.name}</span>
        <Badge className="ml-auto text-[9px] px-1.5 h-4 rounded-md" style={{ backgroundColor: `${strategy.color}20`, color: strategy.color }}>
          {strategy.effectiveness}%
        </Badge>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: COLORS.mutedText }}>{strategy.description}</p>
    </div>
  );
}

function RecommendedTargetCard({ target }: { target: RecommendedTarget }): React.JSX.Element {
  const posColor = POSITION_COLORS[target.position] ?? COLORS.mutedText;

  return (
    <div className="rounded-lg p-3 border flex items-center gap-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${COLORS.emerald}10`, borderColor: `${COLORS.emerald}30` }}>
        <Target className="h-4 w-4" style={{ color: COLORS.emerald }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>{target.name}</span>
          <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ backgroundColor: `${posColor}20`, color: posColor }}>{target.position}</span>
          <span className={`text-[10px] font-bold ${getOvrColor(target.overall)}`}>{target.overall}</span>
        </div>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: COLORS.mutedText }}>{target.reason}</p>
      </div>
      <div className="flex flex-col items-center flex-shrink-0">
        <span className="text-[9px]" style={{ color: COLORS.mutedText }}>FIT</span>
        <span className="text-sm font-bold" style={{ color: target.fitScore >= 90 ? COLORS.emerald : COLORS.amber }}>{target.fitScore}</span>
      </div>
    </div>
  );
}

function DraftBoardPreview(): React.JSX.Element {
  const picks = [
    { round: 3, position: 'LW', overall: 84, name: 'M. Rashford' },
    { round: 4, position: 'CM', overall: 81, name: 'P. Goncalves' },
    { round: 5, position: 'CB', overall: 86, name: 'V. van Dijk' },
    { round: 6, position: 'GK', overall: 85, name: 'M. Maignan' },
    { round: 7, position: 'LW', overall: 82, name: 'K. Kvaratskhelia' },
  ];

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-3.5 w-3.5" style={{ color: COLORS.cyan }} />
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Next 5 Picks Preview</span>
      </div>
      <div className="space-y-1.5">
        {picks.map((pick) => {
          const posColor = POSITION_COLORS[pick.position] ?? COLORS.mutedText;
          return (
            <div key={pick.round} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ backgroundColor: COLORS.innerBg }}>
              <span className="text-[10px] font-bold w-5" style={{ color: COLORS.mutedText }}>R{pick.round}</span>
              <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ backgroundColor: `${posColor}20`, color: posColor }}>{pick.position}</span>
              <span className="text-[10px] font-bold flex-1" style={{ color: COLORS.primaryText }}>{pick.name}</span>
              <span className={`text-[10px] font-bold ${getOvrColor(pick.overall)}`}>{pick.overall}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectionCard({ label, value, subtext, color }: { label: string; value: string; subtext: string; color: string }): React.JSX.Element {
  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{label}</span>
      <div className="text-lg font-bold mt-0.5" style={{ color }}>{value}</div>
      <span className="text-[10px]" style={{ color: COLORS.dimText }}>{subtext}</span>
    </div>
  );
}

function ComparisonTeamCard({ team }: { team: ComparisonTeam }): React.JSX.Element {
  return (
    <div className="rounded-lg p-3 border flex items-center gap-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: COLORS.innerBg }}>
        {team.logo}
      </div>
      <div className="flex-1">
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>{team.name}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-bold ${getOvrColor(team.rating)}`}>{team.rating}</span>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{team.style}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4" style={{ color: COLORS.dimText }} />
    </div>
  );
}

function DraftActionButtons(): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        className="h-9 text-[10px] rounded-md flex items-center justify-center gap-1"
        style={{ borderColor: COLORS.border, color: COLORS.secondaryText, backgroundColor: COLORS.cardBg }}
      >
        <SkipForward className="h-3 w-3" /> Skip Pick
      </Button>
      <Button
        className="h-9 text-[10px] rounded-md flex items-center justify-center gap-1"
        style={{ backgroundColor: COLORS.emerald, color: '#ffffff' }}
      >
        <Zap className="h-3 w-3" /> Auto Draft
      </Button>
      <Button
        variant="outline"
        className="h-9 text-[10px] rounded-md flex items-center justify-center gap-1"
        style={{ borderColor: COLORS.border, color: COLORS.secondaryText, backgroundColor: COLORS.cardBg }}
      >
        <RotateCcw className="h-3 w-3" /> Reset
      </Button>
    </div>
  );
}

function BudgetTrackerCard(): React.JSX.Element {
  const budgetTotal = 1000;
  const budgetSpent = 620;
  const budgetRemaining = budgetTotal - budgetSpent;
  const pct = Math.round((budgetSpent / budgetTotal) * 100);
  const barW = 180;
  const fillW = (pct / 100) * barW;
  const barColor = pct > 90 ? COLORS.red : pct > 70 ? COLORS.amber : COLORS.emerald;

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: COLORS.amber }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Draft Budget</span>
        </div>
        <span className="text-xs font-bold" style={{ color: barColor }}>€{budgetRemaining}M left</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>€{budgetSpent}M spent</span>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{pct}%</span>
          </div>
          <svg viewBox={`0 0 ${barW} 8`} className="w-full" style={{ maxWidth: barW }}>
            <rect x="0" y="0" width={barW} height="8" rx="4" fill={COLORS.innerBg} />
            <rect x="0" y="0" width={fillW} height="8" rx="4" fill={barColor} fillOpacity={0.8} />
          </svg>
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS.emerald }} />
          <span className="text-[9px]" style={{ color: COLORS.mutedText }}>Budget OK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS.amber }} />
          <span className="text-[9px]" style={{ color: COLORS.mutedText }}>Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS.red }} />
          <span className="text-[9px]" style={{ color: COLORS.mutedText }}>Over Budget</span>
        </div>
      </div>
    </div>
  );
}

function DraftProgressCard(): React.JSX.Element {
  const totalPicks = 12;
  const madePicks = 2;
  const currentPick = 3;
  const remainingPicks = totalPicks - currentPick;
  const pctComplete = Math.round((madePicks / totalPicks) * 100);

  const milestones = [
    { pick: 1, label: '1st Pick', done: true },
    { pick: 4, label: 'Rd 4', done: false },
    { pick: 8, label: 'Mid-Draft', done: false },
    { pick: 12, label: 'Final Pick', done: false },
  ];

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Draft Progress</span>
        <span className="text-[10px] font-bold" style={{ color: COLORS.emerald }}>{pctComplete}% complete</span>
      </div>
      <svg viewBox="0 0 200 24" className="w-full">
        <rect x="0" y="8" width="200" height="8" rx="4" fill={COLORS.innerBg} />
        <rect x="0" y="8" width={(pctComplete / 100) * 200} height="8" rx="4" fill={COLORS.emerald} fillOpacity={0.7} />
        {milestones.map((m) => {
          const mx = (m.pick / totalPicks) * 200;
          return (
            <g key={m.label}>
              <circle cx={mx} cy="12" r="5" fill={m.done ? COLORS.emerald : COLORS.cardBg} stroke={m.done ? COLORS.emerald : COLORS.border} strokeWidth="1.5" />
              {m.done && (
                <polyline
                  points={`${mx - 3},${12} ${mx - 1},${14} ${mx + 3},${10}`}
                  fill="none"
                  stroke={COLORS.pageBg}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {milestones.map((m) => (
          <span key={m.label} className="text-[8px]" style={{ color: m.done ? COLORS.emerald : COLORS.dimText }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1 rounded-md p-2 text-center" style={{ backgroundColor: COLORS.innerBg }}>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>Remaining</span>
          <div className="text-sm font-bold" style={{ color: COLORS.secondaryText }}>{remainingPicks}</div>
        </div>
        <div className="flex-1 rounded-md p-2 text-center" style={{ backgroundColor: COLORS.innerBg }}>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>Avg OVR</span>
          <div className="text-sm font-bold" style={{ color: COLORS.amber }}>86</div>
        </div>
        <div className="flex-1 rounded-md p-2 text-center" style={{ backgroundColor: COLORS.innerBg }}>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>Best Pick</span>
          <div className="text-sm font-bold" style={{ color: COLORS.emerald }}>89</div>
        </div>
      </div>
    </div>
  );
}

function SquadStrengthSummary(): React.JSX.Element {
  const starters = MOCK_DRAFTED_SQUAD.filter((p) => p.role === 'starter');
  const avgPace = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.pace, 0) / starters.length) : 0;
  const avgShooting = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.shooting, 0) / starters.length) : 0;
  const avgPassing = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.passing, 0) / starters.length) : 0;
  const avgDefending = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.defending, 0) / starters.length) : 0;
  const avgPhysical = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.physical, 0) / starters.length) : 0;

  const attributes = [
    { label: 'Pace', value: avgPace, color: COLORS.amber },
    { label: 'Shooting', value: avgShooting, color: COLORS.red },
    { label: 'Passing', value: avgPassing, color: COLORS.emerald },
    { label: 'Defending', value: avgDefending, color: COLORS.blue },
    { label: 'Physical', value: avgPhysical, color: COLORS.purple },
  ];

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-3.5 w-3.5" style={{ color: COLORS.blue }} />
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Starting XI Strength</span>
      </div>
      <div className="space-y-2">
        {attributes.map((attr) => (
          <div key={attr.label} className="flex items-center gap-2">
            <span className="text-[10px] w-14" style={{ color: COLORS.mutedText }}>{attr.label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: COLORS.innerBg }}>
              <div className="h-full rounded-full" style={{ width: `${attr.value}%`, backgroundColor: attr.color, opacity: 0.75 }} />
            </div>
            <span className="text-[10px] font-bold w-5 text-right" style={{ color: COLORS.secondaryText }}>{attr.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonFixturePreview(): React.JSX.Element {
  const fixtures = [
    { opp: 'Arsenal', home: true, difficulty: 'Hard' },
    { opp: 'Fulham', home: false, difficulty: 'Easy' },
    { opp: 'Chelsea', home: true, difficulty: 'Medium' },
    { opp: 'Newcastle', home: false, difficulty: 'Hard' },
  ];

  const diffColors: Record<string, string> = {
    Easy: COLORS.emerald,
    Medium: COLORS.amber,
    Hard: COLORS.red,
  };

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="h-3.5 w-3.5" style={{ color: COLORS.amber }} />
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Upcoming Fixtures</span>
      </div>
      <div className="space-y-1.5">
        {fixtures.map((fix, i) => (
          <div key={fix.opp} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ backgroundColor: COLORS.innerBg }}>
            <span className="text-[10px] w-4" style={{ color: COLORS.dimText }}>GW{i + 1}</span>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{fix.home ? 'H' : 'A'}</span>
            <span className="text-[10px] font-medium flex-1" style={{ color: COLORS.primaryText }}>vs {fix.opp}</span>
            <Badge className="text-[8px] px-1.5 h-4 rounded-md" style={{ backgroundColor: `${diffColors[fix.difficulty]}20`, color: diffColors[fix.difficulty] }}>
              {fix.difficulty}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab Content: Draft Pool
// ============================================================

function DraftPoolTab(): React.JSX.Element {
  const [positionFilter, setPositionFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('Any');
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set());

  function handleDraft(player: DraftPoolPlayer) {
    setDraftedIds((prev) => new Set(prev).add(player.id));
  }

  const filteredPlayers = ALL_POOL_PLAYERS.filter((p) => {
    if (draftedIds.has(p.id)) return false;
    if (positionFilter !== 'All' && POSITION_CATEGORY[p.position] !== positionFilter) return false;
    if (ratingFilter === '85+' && p.overall < 85) return false;
    if (ratingFilter === '80-84' && (p.overall < 80 || p.overall > 84)) return false;
    if (ratingFilter === '75-79' && (p.overall < 75 || p.overall > 79)) return false;
    if (ratingFilter === '70-74' && (p.overall < 70 || p.overall > 74)) return false;
    return true;
  });

  const round = 3;
  const totalRounds = 12;
  const picksMade = 2 + draftedIds.size;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Round Counter + Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg px-3 py-2 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>CURRENT ROUND</span>
            <div className="text-xl font-bold" style={{ color: COLORS.emerald }}>
              {round}<span className="text-sm font-normal" style={{ color: COLORS.mutedText }}> / {totalRounds}</span>
            </div>
          </div>
          <div className="rounded-lg px-3 py-2 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
            <span className="text-[10px]" style={{ color: COLORS.mutedText }}>PICKS MADE</span>
            <div className="text-xl font-bold" style={{ color: COLORS.secondaryText }}>{picksMade}</div>
          </div>
        </div>
        <DraftTimer />
      </div>

      {/* Budget + Progress + Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BudgetTrackerCard />
        <DraftProgressCard />
      </div>
      <DraftActionButtons />

      {/* Filters */}
      <DraftPoolFilters positionFilter={positionFilter} setPositionFilter={setPositionFilter} ratingFilter={ratingFilter} setRatingFilter={setRatingFilter} />

      {/* Player Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Available Players</span>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>{filteredPlayers.length} available</span>
        </div>
        {filteredPlayers.map((player) => (
          <DraftPoolPlayerCard key={player.id} player={player} onDraft={handleDraft} />
        ))}
        {filteredPlayers.length === 0 && (
          <div className="rounded-lg p-6 border flex flex-col items-center" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
            <Users className="h-8 w-8 mb-2" style={{ color: COLORS.dimText }} />
            <span className="text-xs" style={{ color: COLORS.mutedText }}>No players match your filters</span>
          </div>
        )}
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <PositionDistributionDonut />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <PlayerRatingBars />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <DraftPickTimeline />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Content: My Squad
// ============================================================

function MySquadTab(): React.JSX.Element {
  const starters = MOCK_DRAFTED_SQUAD.filter((p) => p.role === 'starter');
  const subs = MOCK_DRAFTED_SQUAD.filter((p) => p.role === 'sub');

  const squadOvr = starters.length > 0
    ? Math.round(starters.reduce((sum, p) => sum + p.overall, 0) / starters.length)
    : 0;

  const avgAge = starters.length > 0
    ? Math.round(starters.reduce((sum, p) => sum + p.age, 0) / starters.length)
    : 0;

  const totalValue = MOCK_DRAFTED_SQUAD.reduce((sum, p) => sum + p.value, 0);

  const chemistry = Math.min(95, Math.max(30, 50 + starters.length * 3 + Math.round((squadOvr - 70) * 0.4)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Squad Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="rounded-lg px-4 py-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>SQUAD OVR</span>
          <div className="text-3xl font-bold" style={{ color: getOvrColor(squadOvr) }}>{squadOvr}</div>
        </div>
        <div className="flex gap-2 flex-1">
          <SquadStatCard label="Squad Size" value={`${MOCK_DRAFTED_SQUAD.length}`} icon={<Users className="h-4 w-4" />} color={COLORS.blue} />
          <SquadStatCard label="Avg Age" value={`${avgAge}`} icon={<Clock className="h-4 w-4" />} color={COLORS.purple} />
          <SquadStatCard label="Chemistry" value={`${chemistry}`} icon={<Heart className="h-4 w-4" />} color={COLORS.emerald} />
          <SquadStatCard label="Total Value" value={`€${totalValue}M`} icon={<Sparkles className="h-4 w-4" />} color={COLORS.amber} />
        </div>
      </div>

      {/* Formation Display */}
      <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-3.5 w-3.5" style={{ color: COLORS.cyan }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Formation: 4-3-3</span>
        </div>
        <svg viewBox="0 0 220 160" className="w-full max-w-[320px]">
          <rect x="0" y="0" width="220" height="160" rx="8" fill="#0a2e1a" />
          <rect x="8" y="8" width="204" height="144" rx="4" fill="none" stroke="#1a5c38" strokeWidth="1" />
          <line x1="110" y1="8" x2="110" y2="152" stroke="#1a5c38" strokeWidth="0.5" />
          <circle cx="110" cy="80" r="18" fill="none" stroke="#1a5c38" strokeWidth="0.5" />
          <rect x="8" y="52" width="26" height="56" fill="none" stroke="#1a5c38" strokeWidth="0.5" />
          <rect x="186" y="52" width="26" height="56" fill="none" stroke="#1a5c38" strokeWidth="0.5" />
          {[
            { x: 110, y: 138, label: 'GK' },
            { x: 35, y: 108, label: 'LB' },
            { x: 80, y: 100, label: 'CB' },
            { x: 140, y: 100, label: 'CB' },
            { x: 185, y: 108, label: 'RB' },
            { x: 110, y: 75, label: 'CDM' },
            { x: 55, y: 58, label: 'CM' },
            { x: 165, y: 58, label: 'CM' },
            { x: 30, y: 30, label: 'LW' },
            { x: 110, y: 22, label: 'ST' },
            { x: 190, y: 30, label: 'RW' },
          ].map((pos) => (
            <g key={pos.label}>
              <circle cx={pos.x} cy={pos.y} r="14" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
              <text x={pos.x} y={pos.y + 3} textAnchor={pos.x as unknown as "middle"} fill="#c9d1d9" fontSize="7" fontWeight="600">{pos.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Starters */}
      <div>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Starting XI ({starters.length})</span>
        <div className="space-y-1 mt-2">
          {starters.map((player, i) => (
            <SquadPlayerRow key={player.id} player={player} index={i} />
          ))}
        </div>
      </div>

      {/* Substitutes */}
      <div>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Substitutes ({subs.length})</span>
        <div className="space-y-1 mt-2">
          {subs.map((player, i) => (
            <SquadPlayerRow key={player.id} player={player} index={starters.length + i} />
          ))}
        </div>
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <SquadRatingRadar />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <SquadValueDonut />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <PositionDepthBars />
        </div>
      </div>

      {/* Squad Strength Summary */}
      <SquadStrengthSummary />
    </motion.div>
  );
}

// ============================================================
// Tab Content: Draft Strategy
// ============================================================

function DraftStrategyTab(): React.JSX.Element {
  const teamNeeds = TEAM_NEEDS_DATA;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Strategy Cards */}
      <div>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Draft Strategies</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {MOCK_STRATEGIES.map((strategy) => (
            <StrategyCardItem key={strategy.id} strategy={strategy} />
          ))}
        </div>
      </div>

      {/* Team Needs */}
      <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5" style={{ color: COLORS.amber }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Team Needs Analysis</span>
        </div>
        <div className="space-y-2">
          {teamNeeds.map((need) => (
            <div key={need.position} className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ backgroundColor: COLORS.innerBg }}>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.blue}20`, color: COLORS.blue }}>
                {need.position}
              </span>
              <Badge className="text-[8px] px-1.5 h-4 rounded-md" style={{ backgroundColor: `${need.color}20`, color: need.color }}>
                {need.priority}
              </Badge>
              <span className="text-[10px] flex-1" style={{ color: COLORS.mutedText }}>{need.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Targets */}
      <div>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Recommended Targets</span>
        <div className="space-y-2 mt-2">
          {MOCK_RECOMMENDED_TARGETS.map((target) => (
            <RecommendedTargetCard key={target.id} target={target} />
          ))}
        </div>
      </div>

      {/* Draft Board Preview */}
      <DraftBoardPreview />

      {/* SVG Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <StrategyEffectivenessBars />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <NeedsAnalysisRadar />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <DraftValueLineChart />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Content: Season Projections
// ============================================================

function SeasonProjectionsTab(): React.JSX.Element {
  const projectedFinish = 4;
  const playStyle = PLAY_STYLE_DATA;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Projected League Finish */}
      <div className="rounded-lg p-4 border flex items-center gap-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="w-16 h-16 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${COLORS.emerald}10`, borderColor: `${COLORS.emerald}30` }}>
          <Trophy className="h-8 w-8" style={{ color: COLORS.emerald }} />
        </div>
        <div>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>PROJECTED LEAGUE FINISH</span>
          <div className="text-3xl font-bold" style={{ color: COLORS.emerald }}>
            {projectedFinish}<sup className="text-sm">th</sup>
          </div>
          <span className="text-xs" style={{ color: COLORS.mutedText }}>Champions League qualification predicted</span>
        </div>
      </div>

      {/* Key Stat Projections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ProjectionCard label="Projected Points" value="72 pts" subtext="+8 from last season" color={COLORS.emerald} />
        <ProjectionCard label="Goals Scored" value="68" subtext="3rd in league" color={COLORS.amber} />
        <ProjectionCard label="Goals Conceded" value="34" subtext="5th best defense" color={COLORS.blue} />
        <ProjectionCard label="Clean Sheets" value="14" subtext="Top 4 in league" color={COLORS.cyan} />
      </div>

      {/* Comparison Teams */}
      <div>
        <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Comparison Teams</span>
        <div className="space-y-2 mt-2">
          {MOCK_COMPARISON_TEAMS.map((team) => (
            <ComparisonTeamCard key={team.name} team={team} />
          ))}
        </div>
      </div>

      {/* Play Style Analysis */}
      <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-3.5 w-3.5" style={{ color: COLORS.purple }} />
          <span className="text-xs font-semibold" style={{ color: COLORS.primaryText }}>Play Style Analysis</span>
        </div>
        <div className="space-y-2">
          {playStyle.map((style) => (
            <div key={style.label} className="flex items-center gap-2">
              <span className="text-[10px] w-16" style={{ color: COLORS.mutedText }}>{style.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: COLORS.innerBg }}>
                <div className="h-full rounded-full" style={{ width: `${style.value}%`, backgroundColor: style.color, opacity: 0.8 }} />
              </div>
              <span className="text-[10px] font-semibold w-6 text-right" style={{ color: COLORS.secondaryText }}>{style.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <ProjectedPointsAreaChart />
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
          <StrengthComparisonButterfly />
        </div>
      </div>
      <div className="rounded-lg p-3 border" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <ChemistryBuildBars />
      </div>

      {/* Season Fixture Preview */}
      <SeasonFixturePreview />
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function FantasyDraftEnhanced(): React.JSX.Element {
  const { gameState, setScreen } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabId>('draft_pool');

  const playerName = gameState?.player?.name ?? 'Player';
  const clubName = gameState?.currentClub?.name ?? 'My Club';

  const tabConfig: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'draft_pool', label: 'Draft Pool', icon: <Users className="h-4 w-4" /> },
    { id: 'my_squad', label: 'My Squad', icon: <Star className="h-4 w-4" /> },
    { id: 'draft_strategy', label: 'Strategy', icon: <Brain className="h-4 w-4" /> },
    { id: 'season_projections', label: 'Projections', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  function handleTabChange(tabId: TabId): void {
    setActiveTab(tabId);
  }

  if (!gameState) return <></>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.pageBg }}>
      {/* Top Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: COLORS.pageBg, borderColor: COLORS.border }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 px-2" style={{ color: COLORS.mutedText }} onClick={() => setScreen('dashboard')}>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Back</span>
            </Button>
            <div>
              <h1 className="text-sm font-bold" style={{ color: COLORS.primaryText }}>Fantasy Draft Enhanced</h1>
              <p className="text-[10px]" style={{ color: COLORS.mutedText }}>{clubName} &middot; {playerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] px-2 h-5 rounded-md" style={{ backgroundColor: `${COLORS.emerald}20`, color: COLORS.emerald }}>
              Round 3 / 12
            </Badge>
            <Badge className="text-[10px] px-2 h-5 rounded-md" style={{ backgroundColor: `${COLORS.amber}20`, color: COLORS.amber }}>
              <Flame className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[52px] z-10 border-b" style={{ backgroundColor: COLORS.pageBg, borderColor: COLORS.border }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabConfig.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderBottomColor: activeTab === tab.id ? COLORS.emerald : 'transparent',
                  color: activeTab === tab.id ? COLORS.emerald : COLORS.mutedText,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {activeTab === 'draft_pool' && (
          <TabHeader title="Draft Pool" subtitle="Browse and draft players to build your squad" />
        )}
        {activeTab === 'my_squad' && (
          <TabHeader title="My Squad" subtitle="Manage your drafted players and formation" />
        )}
        {activeTab === 'draft_strategy' && (
          <TabHeader title="Draft Strategy" subtitle="Analyze team needs and optimize your draft approach" />
        )}
        {activeTab === 'season_projections' && (
          <TabHeader title="Season Projections" subtitle="Projected performance and season outlook" />
        )}

        {activeTab === 'draft_pool' && <DraftPoolTab />}
        {activeTab === 'my_squad' && <MySquadTab />}
        {activeTab === 'draft_strategy' && <DraftStrategyTab />}
        {activeTab === 'season_projections' && <SeasonProjectionsTab />}
      </div>
    </div>
  );
}
