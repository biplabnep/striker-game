'use client';

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Trophy,
  Star,
  Target,
  Zap,
  TrendingUp,
  Award,
  Shield,
  Swords,
  Calendar,
  BarChart3,
  Flame,
  ChevronLeft,
  Heart,
  Globe,
  Medal,
  Footprints,
  Gem,
  Lock,
  CheckCircle2,
} from 'lucide-react';

// ── Animation Constants ─────────────────────────────────────
const BASE_ANIM = { duration: 0.18, ease: 'easeOut' as const };
const TAB_DELAY = 0.04;
const STAGGER = 0.03;

// ── Color Constants ─────────────────────────────────────────
const COLORS = {
  pageBg: '#0d1117',
  cardBg: '#161b22',
  innerBg: '#21262d',
  border: '#30363d',
  primary: '#e6edf3',
  secondary: '#c9d1d9',
  muted: '#8b949e',
  dim: '#484f58',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  cyan: '#06B6D4',
};

// ── Tab Definitions ─────────────────────────────────────────
const TABS = [
  { label: 'Legends', icon: <Crown className="h-3.5 w-3.5" /> },
  { label: 'Records', icon: <Trophy className="h-3.5 w-3.5" /> },
  { label: 'Compare', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { label: 'Path', icon: <TrendingUp className="h-3.5 w-3.5" /> },
] as const;

// ── Legendary Players Data ──────────────────────────────────
interface LegendPlayer {
  id: string;
  name: string;
  country: string;
  era: string;
  position: string;
  ovr: number;
  goals: number;
  assists: number;
  trophies: number;
  ballons: number;
  achievements: string[];
}

const LEGENDARY_PLAYERS: LegendPlayer[] = [
  { id: 'pele', name: 'Pelé', country: 'Brazil', era: '1950s-1970s', position: 'ST', ovr: 98, goals: 1281, assists: 370, trophies: 26, ballons: 0, achievements: ['3x World Cup Winner', 'All-time top scorer', 'Football Ambassador'] },
  { id: 'maradona', name: 'Maradona', country: 'Argentina', era: '1970s-1990s', position: 'CAM', ovr: 97, goals: 353, assists: 220, trophies: 12, ballons: 1, achievements: ['1986 World Cup', 'Hand of God', 'Napoli Legend'] },
  { id: 'messi', name: 'Messi', country: 'Argentina', era: '2000s-2020s', position: 'RW', ovr: 96, goals: 838, assists: 380, trophies: 45, ballons: 8, achievements: ['2022 World Cup', '8x Ballon d\'Or', 'Barça Legend'] },
  { id: 'ronaldo', name: 'C. Ronaldo', country: 'Portugal', era: '2000s-2020s', position: 'ST', ovr: 95, goals: 919, assists: 265, trophies: 35, ballons: 5, achievements: ['5x UCL Winner', 'Euro 2016', 'All-time UCL scorer'] },
  { id: 'zidane', name: 'Zidane', country: 'France', era: '1990s-2000s', position: 'CAM', ovr: 95, goals: 159, assists: 180, trophies: 16, ballons: 3, achievements: ['1998 World Cup', '2002 UCL Final', 'Real Madrid Legend'] },
  { id: 'ronaldinho', name: 'Ronaldinho', country: 'Brazil', era: '1990s-2010s', position: 'LW', ovr: 94, goals: 283, assists: 200, trophies: 22, ballons: 1, achievements: ['2005 Ballon d\'Or', 'El Clásico Hero', 'Joy of Football'] },
  { id: 'cruyff', name: 'Cruyff', country: 'Netherlands', era: '1960s-1980s', position: 'CF', ovr: 94, goals: 402, assists: 185, trophies: 18, ballons: 3, achievements: ['Total Football', 'Ajax Legend', '3x European Cup'] },
  { id: 'beckham', name: 'Beckham', country: 'England', era: '1990s-2010s', position: 'RM', ovr: 90, goals: 129, assists: 195, trophies: 19, ballons: 0, achievements: ['Free Kick Master', 'Global Icon', 'United Legend'] },
];

// ── All-Time Records Data ───────────────────────────────────
interface RecordCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  topThree: { name: string; value: number }[];
  unit: string;
}

const RECORD_CATEGORIES: RecordCategory[] = [
  { id: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" />, topThree: [{ name: 'C. Ronaldo', value: 919 }, { name: 'Pelé', value: 1281 }, { name: 'Messi', value: 838 }], unit: 'goals' },
  { id: 'assists', label: 'Assists', icon: <Swords className="h-4 w-4" />, topThree: [{ name: 'Messi', value: 380 }, { name: 'Pelé', value: 370 }, { name: 'Maradona', value: 220 }], unit: 'assists' },
  { id: 'appearances', label: 'Appearances', icon: <Calendar className="h-4 w-4" />, topThree: [{ name: 'Buffon', value: 915 }, { name: 'Casillas', value: 885 }, { name: 'Maldini', value: 902 }], unit: 'caps' },
  { id: 'trophies', label: 'Trophies', icon: <Trophy className="h-4 w-4" />, topThree: [{ name: 'Messi', value: 45 }, { name: 'Alves', value: 43 }, { name: 'Pelé', value: 26 }], unit: 'trophies' },
  { id: 'clean_sheets', label: 'Clean Sheets', icon: <Shield className="h-4 w-4" />, topThree: [{ name: 'Buffon', value: 502 }, { name: 'Casillas', value: 440 }, { name: 'Cech', value: 397 }], unit: 'sheets' },
  { id: 'ratings', label: 'Avg Rating', icon: <Star className="h-4 w-4" />, topThree: [{ name: 'Messi', value: 88 }, { name: 'Ronaldo', value: 86 }, { name: 'Pelé', value: 85 }], unit: 'avg' },
];

// ── Career Comparison Data ──────────────────────────────────
interface LegendComparison {
  id: string;
  name: string;
  country: string;
  goals: number;
  assists: number;
  trophies: number;
  ballons: number;
  caps: number;
  awards: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  trajectory: number[];
}

const LEGEND_COMPARISONS: LegendComparison[] = [
  { id: 'pele', name: 'Pelé', country: 'Brazil', goals: 762, assists: 370, trophies: 26, ballons: 0, caps: 92, awards: 34, pace: 88, shooting: 97, passing: 91, dribbling: 95, defending: 42, physical: 82, trajectory: [65, 78, 88, 95, 98, 97, 94, 88] },
  { id: 'maradona', name: 'Maradona', country: 'Argentina', goals: 353, assists: 220, trophies: 12, ballons: 1, caps: 91, awards: 22, pace: 84, shooting: 92, passing: 95, dribbling: 97, defending: 35, physical: 75, trajectory: [60, 72, 82, 90, 97, 96, 91, 82] },
  { id: 'messi', name: 'Messi', country: 'Argentina', goals: 838, assists: 380, trophies: 45, ballons: 8, caps: 187, awards: 56, pace: 85, shooting: 94, passing: 96, dribbling: 98, defending: 38, physical: 68, trajectory: [55, 68, 80, 90, 96, 96, 95, 90] },
];

// ── Path to Legend Milestones ───────────────────────────────
interface LegendMilestone {
  id: string;
  label: string;
  threshold: number;
  unit: string;
  icon: React.ReactNode;
  description: string;
}

const LEGEND_MILESTONES: LegendMilestone[] = [
  { id: 'debuts', label: 'Professional Debut', threshold: 1, unit: 'appearance', icon: <Footprints className="h-4 w-4" />, description: 'Play your first professional match' },
  { id: 'fifty_goals', label: '50 Goals', threshold: 50, unit: 'goals', icon: <Target className="h-4 w-4" />, description: 'Score 50 career goals' },
  { id: 'first_trophy', label: 'First Trophy', threshold: 1, unit: 'trophy', icon: <Trophy className="h-4 w-4" />, description: 'Win your first trophy' },
  { id: 'hundred_apps', label: '100 Appearances', threshold: 100, unit: 'apps', icon: <Calendar className="h-4 w-4" />, description: 'Reach 100 career appearances' },
  { id: 'international', label: 'International Call-up', threshold: 1, unit: 'cap', icon: <Globe className="h-4 w-4" />, description: 'Earn your first international cap' },
  { id: 'two_hundred_goals', label: '200 Goals', threshold: 200, unit: 'goals', icon: <Flame className="h-4 w-4" />, description: 'Score 200 career goals' },
  { id: 'ten_trophies', label: '10 Trophies', threshold: 10, unit: 'trophies', icon: <Award className="h-4 w-4" />, description: 'Win 10 major trophies' },
  { id: 'legend_status', label: 'Legend Status', threshold: 80, unit: 'legend score', icon: <Crown className="h-4 w-4" />, description: 'Reach legend score of 80+' },
];

// ── Legend Criteria ─────────────────────────────────────────
interface LegendCriterion {
  id: string;
  label: string;
  description: string;
  maxPoints: number;
  color: string;
}

const LEGEND_CRITERIA: LegendCriterion[] = [
  { id: 'goals', label: 'Goals', description: 'Score 500+ career goals', maxPoints: 30, color: COLORS.emerald },
  { id: 'trophies', label: 'Trophies', description: 'Win 20+ major trophies', maxPoints: 25, color: COLORS.amber },
  { id: 'ratings', label: 'Ratings', description: 'Maintain 8.0+ avg rating', maxPoints: 20, color: COLORS.blue },
  { id: 'longevity', label: 'Longevity', description: 'Play 15+ seasons', maxPoints: 15, color: COLORS.purple },
  { id: 'impact', label: 'Impact', description: 'Win 3+ Ballon d\'Ors', maxPoints: 10, color: COLORS.red },
];

// ── Legend Challenges ───────────────────────────────────────
interface LegendChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  progress: number;
}

const LEGEND_CHALLENGES: LegendChallenge[] = [
  { id: 'golden_boot', title: 'Golden Boot Quest', description: 'Finish as top scorer in any league season', reward: '+10 Legend Score', difficulty: 'Medium', color: COLORS.amber, progress: 0 },
  { id: 'invincible', title: 'The Invincible', description: 'Go unbeaten for 20+ consecutive league matches', reward: '+15 Legend Score', difficulty: 'Hard', color: COLORS.red, progress: 0 },
  { id: 'hat_trick_king', title: 'Hat-trick King', description: 'Score 10+ career hat-tricks', reward: '+8 Legend Score', difficulty: 'Medium', color: COLORS.purple, progress: 0 },
];

// ── Player of the Day ───────────────────────────────────────
function getPlayerOfDay(): LegendPlayer {
  const dayIndex = new Date().getDate() % LEGENDARY_PLAYERS.length;
  return LEGENDARY_PLAYERS[dayIndex];
}

// ── Helper: Position to position group ──────────────────────
function getPositionGroup(pos: string): string {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  if (['LW', 'RW'].includes(pos)) return 'Winger';
  return 'FWD';
}

// ── Helper: Country flag ────────────────────────────────────
function getFlag(country: string): string {
  const flags: Record<string, string> = {
    Brazil: '🇧🇷', Argentina: '🇦🇷', Portugal: '🇵🇹', France: '🇫🇷',
    Netherlands: '🇳🇱', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  };
  return flags[country] ?? '🏳️';
}

// ── Helper: OVR color ───────────────────────────────────────
function getOvrColor(ovr: number): string {
  if (ovr >= 95) return COLORS.emerald;
  if (ovr >= 90) return '#4ade80';
  if (ovr >= 85) return COLORS.amber;
  if (ovr >= 80) return COLORS.blue;
  return COLORS.muted;
}

// ── Helper: Position color ──────────────────────────────────
function getPosColor(pos: string): string {
  if (pos === 'GK') return COLORS.amber;
  if (['CB', 'LB', 'RB'].includes(pos)) return COLORS.blue;
  if (['CDM', 'CM', 'CAM'].includes(pos)) return COLORS.emerald;
  if (['LW', 'RW', 'LM', 'RM'].includes(pos)) return COLORS.red;
  if (['ST', 'CF'].includes(pos)) return COLORS.purple;
  return COLORS.muted;
}

// ── Helper: Difficulty color ────────────────────────────────
function getDiffColor(d: string): string {
  if (d === 'Easy') return COLORS.emerald;
  if (d === 'Medium') return COLORS.amber;
  return COLORS.red;
}

// ── Helper: Build polygon points string ─────────────────────
function buildPolygonPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

// ── Helper: Build polyline points string ────────────────────
function buildPolylinePoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

// ── Helper: Polar to cartesian for donut charts ─────────────
function polarToCart(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// ── Donut arc path builder ──────────────────────────────────
function buildDonutArc(
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  const outerStart = polarToCart(cx, cy, outerR, startAngle);
  const outerEnd = polarToCart(cx, cy, outerR, endAngle);
  const innerEnd = polarToCart(cx, cy, innerR, endAngle);
  const innerStart = polarToCart(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart[0]} ${outerStart[1]}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]}`,
    `L ${innerEnd[0]} ${innerEnd[1]}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]}`,
    'Z',
  ].join(' ');
}

// ── Helper: Compute donut arcs from segment data ────────────
function computeDonutArcs(
  cx: number, cy: number, outerR: number, innerR: number,
  segments: { label: string; count: number; color: string }[]
): Array<{ path: string; label: string; pct: number; color: string; midAngle: number }> {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  return segments.reduce<Array<{ path: string; label: string; pct: number; color: string; midAngle: number }>>((acc, seg, idx) => {
    const startAngle = idx === 0 ? -90 : acc.reduce((s, a) => s + (a.pct / 100) * 360, -90);
    const segAngle = (seg.count / total) * 360;
    const endAngle = startAngle + segAngle;
    const midAngle = startAngle + segAngle / 2;
    const path = buildDonutArc(cx, cy, outerR, innerR, startAngle, endAngle);
    return [...acc, { path, label: seg.label, pct: Math.round((seg.count / total) * 100), color: seg.color, midAngle }];
  }, []);
}

// ════════════════════════════════════════════════════════════
// SVG: Legend Position Distribution Donut (Tab 1)
// ════════════════════════════════════════════════════════════
function LegendPositionDonut(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 50;

  const segments = LEGENDARY_PLAYERS.reduce<Array<{ label: string; count: number; color: string }>>((acc, p) => {
    const group = getPositionGroup(p.position);
    const existing = acc.find(s => s.label === group);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ label: group, count: 1, color: getPosColor(p.position) });
    }
    return acc;
  }, []);

  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const arcs = computeDonutArcs(cx, cy, outerR, innerR, segments);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Position Distribution</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {arcs.map((arc, i) => (
          <motion.path
            key={i}
            d={arc.path}
            fill={arc.color}
            fillOpacity={0.8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.primary} fontSize="18" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="10">legends</text>
        {arcs.map((arc, i) => {
          const labelPos = polarToCart(cx, cy, outerR + 14, arc.midAngle);
          const anchor = arc.midAngle > 90 && arc.midAngle < 270 ? "end" as "start" | "middle" | "end" : "start" as "start" | "middle" | "end";
          return (
            <text
              key={`label-${i}`}
              x={labelPos[0]}
              y={labelPos[1]}
              textAnchor={anchor}
              fill={COLORS.muted}
              fontSize="9"
            >
              {arc.label} {arc.pct}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Era Contribution Bars (Tab 1)
// ════════════════════════════════════════════════════════════
function EraContributionBars(): React.JSX.Element {
  const eras = ['1960s', '1970s', '1980s', '1990s', '2000s+'];
  const eraColors = [COLORS.amber, COLORS.red, COLORS.blue, COLORS.purple, COLORS.emerald];
  const counts = LEGENDARY_PLAYERS.reduce<number[]>((acc, p) => {
    if (p.era.startsWith('195') || p.era.startsWith('196')) acc[0] += 1;
    else if (p.era.startsWith('197')) acc[1] += 1;
    else if (p.era.startsWith('198')) acc[2] += 1;
    else if (p.era.startsWith('199')) acc[3] += 1;
    else acc[4] += 1;
    return acc;
  }, [0, 0, 0, 0, 0]);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Era Contribution</h3>
      <svg viewBox="0 0 240 130" className="w-full">
        {eras.map((era, i) => {
          const barWidth = (counts[i] / maxCount) * 160;
          const y = 10 + i * 24;
          return (
            <g key={i}>
              <motion.rect
                x={60}
                y={y}
                width={barWidth}
                height={14}
                rx={3}
                fill={eraColors[i]}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={55} y={y + 11} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="10">{era}</text>
              <text x={65 + barWidth} y={y + 11} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.secondary} fontSize="9">{counts[i]}</text>
            </g>
          );
        })}
        {/* Y-axis line */}
        <line x1={58} y1={5} x2={58} y2={125} stroke={COLORS.dim} strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Legend Rating Comparison Bars (Tab 1)
// ════════════════════════════════════════════════════════════
function LegendRatingBars(): React.JSX.Element {
  const sorted = [...LEGENDARY_PLAYERS].sort((a, b) => b.ovr - a.ovr);
  const maxOvr = 100;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">OVR Rating Comparison</h3>
      <svg viewBox="0 0 280 200" className="w-full">
        {sorted.map((p, i) => {
          const barWidth = (p.ovr / maxOvr) * 150;
          const y = 8 + i * 24;
          return (
            <g key={p.id}>
              <text x={58} y={y + 12} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.secondary} fontSize="9">{p.name}</text>
              <motion.rect
                x={62}
                y={y}
                width={barWidth}
                height={16}
                rx={3}
                fill={getOvrColor(p.ovr)}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={66 + barWidth} y={y + 12} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.primary} fontSize="9" fontWeight="bold">{p.ovr}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Goals Record Timeline (Tab 2)
// ════════════════════════════════════════════════════════════
function GoalsTimeline(): React.JSX.Element {
  const records = [
    { year: 1958, goals: 762, name: 'Pelé' },
    { year: 1974, goals: 425, name: 'Müller' },
    { year: 1989, goals: 525, name: 'Puskás' },
    { year: 2003, goals: 353, name: 'Maradona' },
    { year: 2015, goals: 838, name: 'Messi' },
    { year: 2023, goals: 919, name: 'C. Ronaldo' },
  ];
  const maxGoals = Math.max(...records.map(r => r.goals));
  const xScale = (year: number) => 20 + ((year - 1958) / (2023 - 1958)) * 320;
  const yScale = (goals: number) => 150 - (goals / maxGoals) * 120;

  const linePoints = records.map(r => [xScale(r.year), yScale(r.goals)] as [number, number]);
  const pointsStr = buildPolylinePoints(linePoints);

  const areaPoints = [
    [xScale(records[0].year), 150] as [number, number],
    ...linePoints,
    [xScale(records[records.length - 1].year), 150] as [number, number],
  ];
  const areaStr = buildPolygonPoints(areaPoints);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Goals Record Timeline</h3>
      <svg viewBox="0 0 360 170" className="w-full">
        {/* Grid line */}
        <line x1={20} y1={150} x2={340} y2={150} stroke={COLORS.dim} strokeWidth={1} />
        <line x1={20} y1={90} x2={340} y2={90} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={20} y1={30} x2={340} y2={30} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        {/* Axis label */}
        <text x={10} y={30} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.dim} fontSize="7">900</text>
        <text x={10} y={90} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.dim} fontSize="7">500</text>
        <text x={10} y={155} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.dim} fontSize="7">0</text>
        {/* Area fill */}
        <motion.polygon
          points={areaStr}
          fill={COLORS.emerald}
          fillOpacity={0.15}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />
        {/* Line */}
        <polyline
          points={pointsStr}
          fill="none"
          stroke={COLORS.emerald}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Data points */}
        {records.map((r, i) => {
          const x = xScale(r.year);
          const y = yScale(r.goals);
          return (
            <g key={i}>
              <motion.circle
                cx={x}
                cy={y}
                r={4}
                fill={COLORS.emerald}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={x} y={y - 8} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.secondary} fontSize="8">{r.goals}</text>
              <text x={x} y={164} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="7">{r.year}</text>
              {i % 2 === 0 && (
                <text x={x} y={y - 18} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.dim} fontSize="7">{r.name}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Record Holders Radar (Tab 2)
// ════════════════════════════════════════════════════════════
function RecordHoldersRadar(): React.JSX.Element {
  const cx = 120;
  const cy = 110;
  const r = 80;
  const axes = ['Goals', 'Assists', 'Caps', 'Trophies', 'Ballons', 'Awards'];
  const axisCount = axes.length;
  const angles = axes.map((_, i) => (i / axisCount) * 360 - 90);
  const maxVal = 100;

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const holderValues = [92, 85, 78, 95, 88, 90];
  const holderPoints = holderValues.map((v, i) => polarToCart(cx, cy, (v / maxVal) * r, angles[i]));
  const holderPolyStr = buildPolygonPoints(holderPoints);

  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Record Holders Profile</h3>
      <svg viewBox="0 0 240 220" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]} stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        <motion.polygon
          points={holderPolyStr}
          fill={COLORS.cyan}
          fillOpacity={0.2}
          stroke={COLORS.cyan}
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />
        {holderPoints.map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt[0]}
            cy={pt[1]}
            r={3}
            fill={COLORS.cyan}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 16, angles[i]);
          return (
            <text
              key={label}
              x={labelPt[0]}
              y={labelPt[1]}
              textAnchor={"middle" as "start" | "middle" | "end"}
              fill={COLORS.muted}
              fontSize="9"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Record Distribution Donut (Tab 2)
// ════════════════════════════════════════════════════════════
function RecordDistributionDonut(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const outerR = 75;
  const innerR = 45;
  const segments = [
    { label: 'Scoring', count: 38, color: COLORS.emerald },
    { label: 'Playmaking', count: 24, color: COLORS.blue },
    { label: 'Defending', count: 20, color: COLORS.amber },
    { label: 'Goalkeeping', count: 18, color: COLORS.purple },
  ];

  const arcs = computeDonutArcs(cx, cy, outerR, innerR, segments);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Record Distribution</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {arcs.map((arc, i) => (
          <motion.path
            key={i}
            d={arc.path}
            fill={arc.color}
            fillOpacity={0.8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.primary} fontSize="14" fontWeight="bold">100%</text>
        <text x={cx} y={cy + 12} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="8">Records</text>
      </svg>
      <div className="flex justify-center gap-3 mt-1">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: arc.color }} />
            <span className="text-[9px] text-[#8b949e]">{arc.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Career Trajectory Area Chart (Tab 3)
// ════════════════════════════════════════════════════════════
function CareerTrajectoryChart(): React.JSX.Element {
  const ages = [17, 20, 23, 26, 29, 32, 35, 38];
  const chartW = 320;
  const chartH = 130;
  const padX = 30;
  const padTop = 20;
  const xScale = (i: number) => padX + (i / (ages.length - 1)) * (chartW - padX * 2);
  const yScale = (v: number) => padTop + chartH - ((v - 50) / 50) * chartH;
  const chartColors = [COLORS.emerald, COLORS.amber, COLORS.blue];

  const areas = LEGEND_COMPARISONS.map((leg, li) => {
    const linePoints = leg.trajectory.map((v, vi) => [xScale(vi), yScale(v)] as [number, number]);
    const areaPoints = [
      [xScale(0), padTop + chartH] as [number, number],
      ...linePoints,
      [xScale(ages.length - 1), padTop + chartH] as [number, number],
    ];
    return { line: buildPolylinePoints(linePoints), area: buildPolygonPoints(areaPoints), color: chartColors[li], name: leg.name };
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Career Trajectory</h3>
      <svg viewBox="0 0 340 180" className="w-full">
        {/* Grid lines */}
        <line x1={padX} y1={padTop} x2={chartW - padX + padX} y2={padTop} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH / 2} x2={chartW - padX + padX} y2={padTop + chartH / 2} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        {/* Areas */}
        {areas.map((a, i) => (
          <motion.polygon
            key={`area-${i}`}
            points={a.area}
            fill={a.color}
            fillOpacity={0.12}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        {/* Lines */}
        {areas.map((a, i) => (
          <polyline
            key={`line-${i}`}
            points={a.line}
            fill="none"
            stroke={a.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {/* X-axis labels */}
        {ages.map((age, i) => (
          <text key={`age-${i}`} x={xScale(i)} y={padTop + chartH + 14} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="8">{age}</text>
        ))}
        {/* Legend */}
        {areas.map((a, i) => (
          <g key={`legend-g-${i}`}>
            <rect x={60 + i * 90} y={3} width={8} height={8} rx={1} fill={a.color} fillOpacity={0.85} />
            <text x={72 + i * 90} y={10} textAnchor={"start" as "start" | "middle" | "end"} fill={a.color} fontSize="8">{a.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Attribute Hex Radar (Tab 3)
// ════════════════════════════════════════════════════════════
function AttributeHexRadar(): React.JSX.Element {
  const cx = 120;
  const cy = 110;
  const r = 75;
  const attrs = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];
  const attrKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
  const count = attrs.length;
  const angles = attrs.map((_, i) => (i / count) * 360 - 90);
  const chartColors = [COLORS.emerald, COLORS.amber, COLORS.blue];

  const gridRings = [0.33, 0.66, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Attribute Comparison</h3>
      <svg viewBox="0 0 240 220" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]} stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        {LEGEND_COMPARISONS.map((leg, li) => {
          const values = attrKeys.map(k => leg[k]);
          const pts = values.map((v, vi) => polarToCart(cx, cy, (v / 100) * r, angles[vi]));
          const polyStr = buildPolygonPoints(pts);
          return (
            <motion.polygon
              key={leg.id}
              points={polyStr}
              fill={chartColors[li]}
              fillOpacity={0.1}
              stroke={chartColors[li]}
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...BASE_ANIM, delay: li * TAB_DELAY }}
            />
          );
        })}
        {attrs.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 16, angles[i]);
          return (
            <text
              key={label}
              x={labelPt[0]}
              y={labelPt[1]}
              textAnchor={"middle" as "start" | "middle" | "end"}
              fill={COLORS.muted}
              fontSize="9"
            >
              {label}
            </text>
          );
        })}
        {/* Legend */}
        {LEGEND_COMPARISONS.map((leg, li) => (
          <g key={`legend-text-${leg.id}`}>
            <rect x={55 + li * 65} y={203} width={8} height={8} rx={1} fill={chartColors[li]} fillOpacity={0.85} />
            <text x={66 + li * 65} y={210} textAnchor={"start" as "start" | "middle" | "end"} fill={chartColors[li]} fontSize="8">{leg.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Achievement Butterfly Chart (Tab 3)
// ════════════════════════════════════════════════════════════
function AchievementButterfly(): React.JSX.Element {
  const metrics = ['Goals', 'Assists', 'Trophies', 'Ballons', 'Records'];
  const chartColors = [COLORS.emerald, COLORS.amber, COLORS.blue];
  const midX = 170;
  const maxBarW = 120;

  const datasets = LEGEND_COMPARISONS.map(leg => {
    const rawValues = [leg.goals, leg.assists, leg.trophies, leg.ballons, leg.awards];
    const maxV = Math.max(...rawValues, 1);
    const normalized = rawValues.map(v => (v / maxV) * maxBarW);
    return { name: leg.name, values: normalized, rawValues };
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Achievement Comparison</h3>
      <svg viewBox="0 0 340 145" className="w-full">
        {metrics.map((metric, mi) => {
          const y = 10 + mi * 26;
          return (
            <g key={metric}>
              <text x={midX} y={y + 8} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.secondary} fontSize="9" fontWeight="bold">{metric}</text>
              {datasets.map((ds, di) => {
                const barW = ds.values[mi];
                const barY = y + di * 4;
                return (
                  <motion.rect
                    key={`${di}-${mi}`}
                    x={midX + 35 + di * 4}
                    y={barY - 1}
                    width={barW * 0.5}
                    height={3}
                    rx={1}
                    fill={chartColors[di]}
                    fillOpacity={0.85}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...BASE_ANIM, delay: (mi * 3 + di) * TAB_DELAY }}
                  />
                );
              })}
              <text x={midX - 35} y={y + 8} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="8">{datasets[0].rawValues[mi]}</text>
            </g>
          );
        })}
        {/* Legend */}
        {datasets.map((ds, i) => (
          <g key={`legend-${i}`}>
            <rect x={60 + i * 100} y={136} width={8} height={6} rx={1} fill={chartColors[i]} fillOpacity={0.85} />
            <text x={72 + i * 100} y={142} textAnchor={"start" as "start" | "middle" | "end"} fill={chartColors[i]} fontSize="8">{ds.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Legend Status Ring (Tab 4)
// ════════════════════════════════════════════════════════════
function LegendStatusRing({ score }: { score: number }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - progress);
  const statusColor = score >= 80 ? COLORS.emerald : score >= 60 ? COLORS.amber : score >= 40 ? COLORS.blue : COLORS.muted;
  const tierLabel = score >= 80 ? 'Legend' : score >= 60 ? 'Icon' : score >= 40 ? 'Star' : 'Rising';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 text-center">Legend Status</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.dim} strokeWidth={8} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={statusColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, duration: 0.5 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={cx} y={cy - 8} textAnchor={"middle" as "start" | "middle" | "end"} fill={statusColor} fontSize="32" fontWeight="bold">{score}</text>
        <text x={cx} y={cy + 10} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="9">out of 100</text>
        <text x={cx} y={cy + 24} textAnchor={"middle" as "start" | "middle" | "end"} fill={statusColor} fontSize="10" fontWeight="bold">{tierLabel}</text>
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Criteria Progress Bars (Tab 4)
// ════════════════════════════════════════════════════════════
function CriteriaProgressBars({ progress }: { progress: { id: string; label: string; current: number; max: number; color: string }[] }): React.JSX.Element {
  const maxVal = 100;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Legend Criteria Progress</h3>
      <svg viewBox="0 0 280 135" className="w-full">
        {progress.map((p, i) => {
          const barWidth = (p.current / maxVal) * 180;
          const y = 8 + i * 24;
          return (
            <g key={p.id}>
              <text x={50} y={y + 10} textAnchor={"end" as "start" | "middle" | "end"} fill={COLORS.secondary} fontSize="9">{p.label}</text>
              <rect x={55} y={y} width={180} height={14} rx={3} fill={COLORS.innerBg} />
              <motion.rect
                x={55}
                y={y}
                width={barWidth}
                height={14}
                rx={3}
                fill={p.color}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={240} y={y + 11} textAnchor={"start" as "start" | "middle" | "end"} fill={COLORS.muted} fontSize="8">{p.current}/{p.max}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SVG: Legend Path Timeline (Tab 4)
// ════════════════════════════════════════════════════════════
function LegendPathTimeline({ completedSteps }: { completedSteps: number }): React.JSX.Element {
  const nodes = ['Debut', 'Breakout', 'First Trophy', 'Star Player', 'International', 'World Class', 'Icon', 'Legend'];
  const nodeCount = nodes.length;
  const totalW = 320;
  const startX = 20;
  const endX = totalW - 20;
  const gap = (endX - startX) / (nodeCount - 1);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Legend Path</h3>
      <svg viewBox="0 0 340 100" className="w-full">
        {/* Completed portion of line */}
        {completedSteps > 0 && (
          <line
            x1={startX}
            y1={35}
            x2={startX + Math.min(completedSteps - 1, nodeCount - 1) * gap}
            y2={35}
            stroke={COLORS.emerald}
            strokeWidth={2}
          />
        )}
        {/* Remaining portion */}
        <line
          x1={startX}
          y1={35}
          x2={endX}
          y2={35}
          stroke={COLORS.dim}
          strokeWidth={2}
          strokeOpacity={0.4}
        />
        {/* Nodes */}
        {nodes.map((node, i) => {
          const x = startX + i * gap;
          const isCompleted = i < completedSteps;
          const isCurrent = i === completedSteps;
          const fillColor = isCompleted ? COLORS.emerald : isCurrent ? COLORS.amber : COLORS.dim;
          return (
            <g key={i}>
              {isCurrent && (
                <motion.circle
                  cx={x}
                  cy={35}
                  r={12}
                  fill="none"
                  stroke={COLORS.amber}
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={BASE_ANIM}
                />
              )}
              <motion.circle
                cx={x}
                cy={35}
                r={isCurrent ? 8 : 6}
                fill={fillColor}
                fillOpacity={isCompleted || isCurrent ? 1 : 0.4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text
                x={x}
                y={58}
                textAnchor={"middle" as "start" | "middle" | "end"}
                fill={isCompleted ? COLORS.secondary : isCurrent ? COLORS.amber : COLORS.dim}
                fontSize="8"
              >
                {node}
              </text>
              {isCompleted && (
                <text x={x} y={35 + 3} textAnchor={"middle" as "start" | "middle" | "end"} fill={COLORS.pageBg} fontSize="7" fontWeight="bold">✓</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: TabHeader
// ════════════════════════════════════════════════════════════
function TabHeader({ title, subtitle }: { title: string; subtitle: string }): React.JSX.Element {
  return (
    <div className="mb-4">
      <h1 className="text-lg font-bold text-[#e6edf3]">{title}</h1>
      <p className="text-xs text-[#8b949e] mt-0.5">{subtitle}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: LegendCard
// ════════════════════════════════════════════════════════════
function LegendCard({ player, delay }: { player: LegendPlayer; delay: number }): React.JSX.Element {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{getFlag(player.country)}</span>
        <span className="text-xs font-bold text-[#e6edf3] flex-1">{player.name}</span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 text-white rounded-md"
          style={{ backgroundColor: getPosColor(player.position) }}
        >
          {player.position}
        </span>
        <span className="text-xs font-black tabular-nums" style={{ color: getOvrColor(player.ovr) }}>{player.ovr}</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] text-[#8b949e]">{player.era}</span>
        <span className="text-[9px] text-[#484f58]">·</span>
        <span className="text-[9px] text-[#8b949e]">{player.country}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 mb-2">
        <div className="text-center bg-[#21262d] rounded-md p-1">
          <div className="text-[9px] text-[#e6edf3] font-bold tabular-nums">{player.goals}</div>
          <div className="text-[7px] text-[#8b949e]">Goals</div>
        </div>
        <div className="text-center bg-[#21262d] rounded-md p-1">
          <div className="text-[9px] text-[#e6edf3] font-bold tabular-nums">{player.assists}</div>
          <div className="text-[7px] text-[#8b949e]">Assists</div>
        </div>
        <div className="text-center bg-[#21262d] rounded-md p-1">
          <div className="text-[9px] text-[#e6edf3] font-bold tabular-nums">{player.trophies}</div>
          <div className="text-[7px] text-[#8b949e]">Trophies</div>
        </div>
        <div className="text-center bg-[#21262d] rounded-md p-1">
          <div className="text-[9px] text-[#e6edf3] font-bold tabular-nums">{player.ballons}</div>
          <div className="text-[7px] text-[#8b949e]">Ballons</div>
        </div>
      </div>
      <div className="space-y-0.5">
        {player.achievements.map((ach, i) => (
          <div key={i} className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5 text-[#F59E0B]" />
            <span className="text-[9px] text-[#c9d1d9]">{ach}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: PlayerOfDayCard
// ════════════════════════════════════════════════════════════
function PlayerOfDayCard(): React.JSX.Element {
  const player = getPlayerOfDay();
  return (
    <motion.div
      className="bg-[#161b22] border border-[#F59E0B]/30 rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={BASE_ANIM}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5 text-[#F59E0B]" />
        <span className="text-[10px] font-bold text-[#F59E0B]">Player of the Day</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-[#21262d] flex items-center justify-center text-2xl border border-[#30363d]">
          {getFlag(player.country)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#e6edf3]">{player.name}</div>
          <div className="text-[9px] text-[#8b949e]">{player.country} · {player.era}</div>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] text-[#10B981]">{player.goals} goals</span>
            <span className="text-[9px] text-[#3B82F6]">{player.trophies} trophies</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black tabular-nums" style={{ color: getOvrColor(player.ovr) }}>{player.ovr}</div>
          <div className="text-[8px] text-[#484f58]">OVR</div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: AllTimeRecordCard
// ════════════════════════════════════════════════════════════
function AllTimeRecordCard({ record, playerRank, delay }: { record: RecordCategory; playerRank: number; delay: number }): React.JSX.Element {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#10B981]">{record.icon}</span>
        <span className="text-xs font-bold text-[#c9d1d9] flex-1">{record.label}</span>
      </div>
      <div className="space-y-1.5">
        {record.topThree.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[#484f58] w-3">#{i + 1}</span>
            <span className="text-[10px] text-[#c9d1d9] flex-1">{t.name}</span>
            <span className="text-[10px] font-bold text-[#e6edf3] tabular-nums">
              {typeof t.value === 'number' && t.value < 10 ? t.value.toFixed(1) : t.value}
            </span>
          </div>
        ))}
      </div>
      {playerRank > 0 && (
        <div className="mt-2 pt-2 border-t border-[#30363d]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#8b949e]">Your rank</span>
            <span className="text-[10px] font-bold text-[#F59E0B] tabular-nums">#{playerRank}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: ComparisonSideCard
// ════════════════════════════════════════════════════════════
function ComparisonSideCard({ legend, delay }: { legend: LegendComparison; delay: number }): React.JSX.Element {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <div className="text-center mb-2">
        <span className="text-lg">{getFlag(legend.country)}</span>
        <div className="text-xs font-bold text-[#e6edf3] mt-1">{legend.name}</div>
        <div className="text-[8px] text-[#8b949e]">{legend.country}</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: 'Goals', value: legend.goals },
          { label: 'Assists', value: legend.assists },
          { label: 'Trophies', value: legend.trophies },
          { label: 'Caps', value: legend.caps },
        ].map((stat, i) => (
          <div key={i} className="bg-[#21262d] rounded-md p-1.5 text-center">
            <div className="text-[10px] font-bold text-[#e6edf3] tabular-nums">{stat.value}</div>
            <div className="text-[7px] text-[#8b949e]">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1.5">
        <div className="bg-[#21262d] rounded-md p-1 text-center">
          <div className="text-[9px] font-bold text-[#F59E0B] tabular-nums">{legend.ballons}</div>
          <div className="text-[6px] text-[#8b949e]">Ballons</div>
        </div>
        <div className="bg-[#21262d] rounded-md p-1 text-center">
          <div className="text-[9px] font-bold text-[#10B981] tabular-nums">{legend.awards}</div>
          <div className="text-[6px] text-[#8b949e]">Awards</div>
        </div>
        <div className="bg-[#21262d] rounded-md p-1 text-center">
          <div className="text-[9px] font-bold text-[#3B82F6] tabular-nums">{legend.trajectory[4]}</div>
          <div className="text-[6px] text-[#8b949e]">Peak</div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: SimilarityCard
// ════════════════════════════════════════════════════════════
function SimilarityCard({ score, legendName, delay }: { score: number; legendName: string; delay: number }): React.JSX.Element {
  const color = score >= 80 ? COLORS.emerald : score >= 60 ? COLORS.amber : score >= 40 ? COLORS.blue : COLORS.muted;
  const similarityLabel = score >= 80 ? 'Very Similar' : score >= 60 ? 'Similar' : score >= 40 ? 'Some Traits' : 'Different';
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <span className="text-[9px] text-[#8b949e]">Similarity to</span>
      <div className="text-xs font-bold text-[#c9d1d9]">{legendName}</div>
      <div className="text-2xl font-black tabular-nums mt-1" style={{ color }}>{score}%</div>
      <div className="text-[8px] font-bold mt-0.5" style={{ color }}>{similarityLabel}</div>
      <div className="w-full h-1.5 bg-[#21262d] rounded-sm mt-2 overflow-hidden">
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0, width: '0%' }}
          animate={{ opacity: 1, width: `${score}%` }}
          transition={{ ...BASE_ANIM, duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: MilestoneCard
// ════════════════════════════════════════════════════════════
function MilestoneCard({ milestone, achieved, delay }: { milestone: LegendMilestone; achieved: boolean; delay: number }): React.JSX.Element {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: achieved ? 'rgba(16,185,129,0.15)' : 'rgba(139,148,158,0.1)' }}
      >
        <span className={achieved ? 'text-[#10B981]' : 'text-[#484f58]'}>{milestone.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-[#c9d1d9] truncate">{milestone.label}</div>
        <div className="text-[8px] text-[#8b949e]">{milestone.threshold} {milestone.unit}</div>
        <div className="text-[7px] text-[#484f58]">{milestone.description}</div>
      </div>
      {achieved ? (
        <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
      ) : (
        <Lock className="h-4 w-4 text-[#484f58] shrink-0" />
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: ChallengeCard
// ════════════════════════════════════════════════════════════
function ChallengeCard({ challenge, delay }: { challenge: LegendChallenge; delay: number }): React.JSX.Element {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Zap className="h-3.5 w-3.5" style={{ color: challenge.color }} />
        <span className="text-[10px] font-bold text-[#e6edf3] flex-1">{challenge.title}</span>
        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d]" style={{ color: getDiffColor(challenge.difficulty) }}>
          {challenge.difficulty}
        </Badge>
      </div>
      <p className="text-[9px] text-[#8b949e] mb-1.5">{challenge.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Gem className="h-3 w-3 text-[#F59E0B]" />
          <span className="text-[9px] text-[#F59E0B]">{challenge.reward}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[#8b949e]">Progress</span>
          <span className="text-[9px] font-bold text-[#c9d1d9] tabular-nums">{challenge.progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: LegendStatsSummary (Tab 1)
// ════════════════════════════════════════════════════════════
function LegendStatsSummary(): React.JSX.Element {
  const totalGoals = LEGENDARY_PLAYERS.reduce((s, p) => s + p.goals, 0);
  const totalAssists = LEGENDARY_PLAYERS.reduce((s, p) => s + p.assists, 0);
  const totalTrophies = LEGENDARY_PLAYERS.reduce((s, p) => s + p.trophies, 0);
  const totalBallons = LEGENDARY_PLAYERS.reduce((s, p) => s + p.ballons, 0);
  const avgOvr = LEGENDARY_PLAYERS.reduce((s, p) => s + p.ovr, 0) / LEGENDARY_PLAYERS.length;

  const stats = [
    { label: 'Total Goals', value: totalGoals.toLocaleString(), color: COLORS.emerald, icon: <Target className="h-3.5 w-3.5" /> },
    { label: 'Total Assists', value: totalAssists.toLocaleString(), color: COLORS.blue, icon: <Swords className="h-3.5 w-3.5" /> },
    { label: 'Total Trophies', value: totalTrophies.toLocaleString(), color: COLORS.amber, icon: <Trophy className="h-3.5 w-3.5" /> },
    { label: 'Ballon d\'Ors', value: totalBallons.toString(), color: COLORS.purple, icon: <Award className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, delay: i * STAGGER }}
        >
          <div className="flex justify-center mb-1">
            <span style={{ color: s.color }}>{s.icon}</span>
          </div>
          <div className="text-base font-black tabular-nums text-[#e6edf3]">{s.value}</div>
          <div className="text-[8px] text-[#8b949e]">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-component: RecordStatsOverview (Tab 2)
// ════════════════════════════════════════════════════════════
function RecordStatsOverview(): React.JSX.Element {
  const stats = [
    { label: 'Categories', value: RECORD_CATEGORIES.length.toString(), color: COLORS.cyan },
    { label: 'Record Holders', value: '18', color: COLORS.emerald },
    { label: 'Eras Covered', value: '6', color: COLORS.amber },
    { label: 'Countries', value: '12', color: COLORS.blue },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="bg-[#161b22] border border-[#30363d] rounded-md p-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, delay: i * STAGGER }}
        >
          <div className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[7px] text-[#8b949e]">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Tab 1: Legendary Players
// ════════════════════════════════════════════════════════════
function TabLegendaryPlayers(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <TabHeader title="Legendary Players" subtitle="The greatest to ever play the beautiful game" />
      <PlayerOfDayCard />
      <LegendStatsSummary />
      <div className="grid grid-cols-1 gap-2">
        {LEGENDARY_PLAYERS.map((player, i) => (
          <LegendCard key={player.id} player={player} delay={i * 0.04} />
        ))}
      </div>
      <LegendPositionDonut />
      <EraContributionBars />
      <LegendRatingBars />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Tab 2: All-Time Records
// ════════════════════════════════════════════════════════════
function TabAllTimeRecords({ gameState }: { gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']> }): React.JSX.Element {
  const playerGoals = gameState.player.careerStats.totalGoals;
  const playerAssists = gameState.player.careerStats.totalAssists;
  const playerApps = gameState.player.careerStats.totalAppearances;
  const playerTrophies = (gameState.player.careerStats.trophies ?? []).length;
  const playerCS = gameState.player.careerStats.totalCleanSheets;
  const playerSeasons = gameState.player.careerStats.seasonsPlayed || gameState.currentSeason;
  const playerAvg = playerSeasons > 0
    ? Math.round((playerGoals / Math.max(playerSeasons, 1)) * 10) / 10
    : 0;

  const ranks = [
    playerGoals > 0 ? Math.max(1, Math.round(1281 / playerGoals)) : 0,
    playerAssists > 0 ? Math.max(1, Math.round(380 / playerAssists)) : 0,
    playerApps > 0 ? Math.max(1, Math.round(915 / playerApps)) : 0,
    playerTrophies > 0 ? Math.max(1, Math.round(45 / playerTrophies)) : 0,
    playerCS > 0 ? Math.max(1, Math.round(502 / playerCS)) : 0,
    playerAvg > 0 ? Math.max(1, Math.round(88 / playerAvg)) : 0,
  ];

  return (
    <div className="space-y-4">
      <TabHeader title="All-Time Records" subtitle="Historic benchmarks that define football greatness" />
      <RecordStatsOverview />
      <div className="grid grid-cols-1 gap-2">
        {RECORD_CATEGORIES.map((record, i) => (
          <AllTimeRecordCard key={record.id} record={record} playerRank={ranks[i]} delay={i * 0.05} />
        ))}
      </div>
      <GoalsTimeline />
      <RecordHoldersRadar />
      <RecordDistributionDonut />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Tab 3: Career Comparison
// ════════════════════════════════════════════════════════════
function TabCareerComparison({ gameState }: { gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']> }): React.JSX.Element {
  const playerName = gameState?.player?.name ?? 'Player';

  const similarityScores = LEGEND_COMPARISONS.map(l => {
    const totalGoals = gameState.player.careerStats.totalGoals;
    const totalAssists = gameState.player.careerStats.totalAssists;
    const totalTrophies = (gameState.player.careerStats.trophies ?? []).length;
    const goalSim = Math.min(100, (totalGoals / Math.max(l.goals, 1)) * 100);
    const assistSim = Math.min(100, (totalAssists / Math.max(l.assists, 1)) * 100);
    const tropSim = Math.min(100, (totalTrophies / Math.max(l.trophies, 1)) * 100);
    return Math.round(goalSim * 0.5 + assistSim * 0.3 + tropSim * 0.2);
  });

  const bestMatch = LEGEND_COMPARISONS.reduce((best, leg, i) =>
    similarityScores[i] > similarityScores[best] ? i : best, 0
  );
  const bestMatchLegend = LEGEND_COMPARISONS[bestMatch];

  return (
    <div className="space-y-4">
      <TabHeader title="Career Comparison" subtitle={`Compare ${playerName} with the all-time greats`} />

      {/* Best match highlight */}
      <motion.div
        className="bg-[#161b22] border border-[#10B981]/30 rounded-lg p-3 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={BASE_ANIM}
      >
        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-xl border border-[#30363d]">
          {getFlag(bestMatchLegend.country)}
        </div>
        <div className="flex-1">
          <div className="text-[9px] text-[#8b949e]">Most Similar Legend</div>
          <div className="text-xs font-bold text-[#e6edf3]">{bestMatchLegend.name}</div>
          <div className="text-[9px] text-[#10B981]">{similarityScores[bestMatch]}% match</div>
        </div>
        <TrendingUp className="h-4 w-4 text-[#10B981]" />
      </motion.div>

      {/* Legend comparison cards */}
      <div className="grid grid-cols-3 gap-2">
        {LEGEND_COMPARISONS.map((legend, i) => (
          <ComparisonSideCard key={legend.id} legend={legend} delay={i * 0.06} />
        ))}
      </div>

      {/* Similarity scores */}
      <div className="grid grid-cols-3 gap-2">
        {LEGEND_COMPARISONS.map((legend, i) => (
          <SimilarityCard
            key={`sim-${legend.id}`}
            score={similarityScores[i]}
            legendName={legend.name}
            delay={0.2 + i * 0.06}
          />
        ))}
      </div>

      {/* Your stats row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Goals', value: gameState.player.careerStats.totalGoals, color: COLORS.emerald },
          { label: 'Assists', value: gameState.player.careerStats.totalAssists, color: COLORS.blue },
          { label: 'Trophies', value: (gameState.player.careerStats.trophies ?? []).length, color: COLORS.amber },
          { label: 'Apps', value: gameState.player.careerStats.totalAppearances, color: COLORS.purple },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-[#161b22] border border-[#30363d] rounded-md p-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: 0.3 + i * STAGGER }}
          >
            <div className="text-sm font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[7px] text-[#8b949e]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <CareerTrajectoryChart />
      <AttributeHexRadar />
      <AchievementButterfly />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Tab 4: Path to Legend
// ════════════════════════════════════════════════════════════
function TabPathToLegend({ gameState }: { gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']> }): React.JSX.Element {
  const player = gameState.player;
  const goals = player.careerStats.totalGoals;
  const assists = player.careerStats.totalAssists;
  const trophies = (player.careerStats.trophies ?? []).length;
  const apps = player.careerStats.totalAppearances;
  const seasons = player.careerStats.seasonsPlayed || gameState.currentSeason;
  const intlCaps = gameState.internationalCareer?.caps ?? 0;

  const legendScore = Math.min(100, Math.round(
    Math.min(100, goals * 0.06) * 0.3 +
    Math.min(100, trophies * 5) * 0.25 +
    Math.min(100, apps * 0.25) * 0.2 +
    Math.min(100, seasons * 6.67) * 0.15 +
    Math.min(100, intlCaps * 3.33) * 0.1
  ));

  const criteriaProgress = LEGEND_CRITERIA.map(c => {
    const currentMap: Record<string, number> = {
      goals: Math.min(100, Math.round((goals / 500) * 100)),
      trophies: Math.min(100, Math.round((trophies / 20) * 100)),
      ratings: Math.min(100, apps > 0 ? Math.round(Math.min(100, (goals / Math.max(apps, 1)) * 100)) : 0),
      longevity: Math.min(100, Math.round((seasons / 15) * 100)),
      impact: Math.min(100, Math.round((intlCaps / 30) * 100)),
    };
    return {
      id: c.id,
      label: c.label,
      current: currentMap[c.id] ?? 0,
      max: 100,
      color: c.color,
    };
  });

  const achievedMilestones = LEGEND_MILESTONES.map(m => {
    const valueMap: Record<string, number> = {
      debuts: apps,
      fifty_goals: goals,
      first_trophy: trophies,
      hundred_apps: apps,
      international: intlCaps,
      two_hundred_goals: goals,
      ten_trophies: trophies,
      legend_status: legendScore,
    };
    return { milestone: m, achieved: (valueMap[m.id] ?? 0) >= m.threshold };
  });

  const completedSteps = achievedMilestones.reduce((sum, am) => sum + (am.achieved ? 1 : 0), 0);

  const tierLabel = legendScore >= 80 ? 'Club Legend' : legendScore >= 60 ? 'Star Player' : legendScore >= 40 ? 'Rising Star' : 'Newcomer';
  const tierColor = legendScore >= 80 ? COLORS.emerald : legendScore >= 60 ? COLORS.amber : legendScore >= 40 ? COLORS.blue : COLORS.muted;

  const nextMilestone = achievedMilestones.find(am => !am.achieved);

  return (
    <div className="space-y-4">
      <TabHeader title="Path to Legend" subtitle="Your journey to football immortality" />

      {/* Status overview */}
      <LegendStatusRing score={legendScore} />

      {/* Tier info */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={BASE_ANIM}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" style={{ color: tierColor }} />
          <div>
            <div className="text-xs font-bold text-[#e6edf3]">{tierLabel}</div>
            <div className="text-[8px] text-[#8b949e]">Legend Score: {legendScore}/100</div>
          </div>
        </div>
        {nextMilestone && (
          <div className="text-right">
            <div className="text-[8px] text-[#8b949e]">Next milestone</div>
            <div className="text-[9px] font-bold text-[#F59E0B]">{nextMilestone.milestone.label}</div>
          </div>
        )}
      </motion.div>

      {/* Legend Criteria */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-[#F59E0B]" />
          Legend Criteria
        </h3>
        <div className="space-y-2">
          {LEGEND_CRITERIA.map((c, i) => (
            <div key={c.id}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-[#c9d1d9]">{c.label}</span>
                <span className="text-[9px] text-[#8b949e]">{criteriaProgress[i].current}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: c.color }}
                  initial={{ opacity: 0, width: '0%' }}
                  animate={{ opacity: 1, width: `${criteriaProgress[i].current}%` }}
                  transition={{ ...BASE_ANIM, duration: 0.35, delay: i * TAB_DELAY }}
                />
              </div>
              <span className="text-[8px] text-[#484f58]">{c.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 flex items-center gap-1.5">
          <Medal className="h-3.5 w-3.5 text-[#10B981]" />
          Milestones ({completedSteps}/{LEGEND_MILESTONES.length})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {achievedMilestones.map((am, i) => (
            <MilestoneCard
              key={am.milestone.id}
              milestone={am.milestone}
              achieved={am.achieved}
              delay={i * 0.03}
            />
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-[#EF4444]" />
          Legendary Challenges
        </h3>
        <div className="space-y-2">
          {LEGEND_CHALLENGES.map((ch, i) => (
            <ChallengeCard key={ch.id} challenge={ch} delay={i * 0.05} />
          ))}
        </div>
      </div>

      <CriteriaProgressBars progress={criteriaProgress} />
      <LegendPathTimeline completedSteps={completedSteps} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════
export default function HallOfFameEnhanced() {
  const { gameState, setScreen } = useGameStore();
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const playerName = gameState?.player?.name ?? 'Player';
  const totalGoals = gameState?.player?.careerStats?.totalGoals ?? 0;
  const totalAssists = gameState?.player?.careerStats?.totalAssists ?? 0;
  const totalTrophies = (gameState?.player?.careerStats?.trophies ?? []).length;
  const totalApps = gameState?.player?.careerStats?.totalAppearances ?? 0;
  const ovr = gameState?.player?.overall ?? 50;
  const pos = gameState?.player?.position ?? 'ST';

  const legendScore = useMemo(() => {
    if (!gameState) return 0;
    const g = gameState.player.careerStats.totalGoals;
    const t = (gameState.player.careerStats.trophies ?? []).length;
    const a = gameState.player.careerStats.totalAppearances;
    const s = gameState.player.careerStats.seasonsPlayed || gameState.currentSeason;
    const c = gameState.internationalCareer?.caps ?? 0;
    return Math.min(100, Math.round(
      Math.min(100, g * 0.06) * 0.3 +
      Math.min(100, t * 5) * 0.25 +
      Math.min(100, a * 0.25) * 0.2 +
      Math.min(100, s * 6.67) * 0.15 +
      Math.min(100, c * 3.33) * 0.1
    ));
  }, [gameState]);

  if (!gameState) return null;

  const tierLabel = legendScore >= 80 ? 'Club Legend' : legendScore >= 60 ? 'Star Player' : legendScore >= 40 ? 'Rising Star' : 'Newcomer';
  const tierColor = legendScore >= 80 ? COLORS.emerald : legendScore >= 60 ? COLORS.amber : legendScore >= 40 ? COLORS.blue : COLORS.muted;

  function handleTabChange(index: number) {
    setActiveTab(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleBack() {
    setScreen('hall_of_fame');
  }

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-4" ref={scrollRef}>

        {/* ── Header ────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        >
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 text-[#8b949e] hover:text-[#e6edf3] h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-[#e6edf3]">Hall of Fame Enhanced</h1>
            <p className="text-[9px] text-[#8b949e]">Football&apos;s greatest tributes</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold" style={{ color: tierColor }}>{tierLabel}</div>
            <div className="text-[8px] text-[#484f58]">Score: {legendScore}/100</div>
          </div>
        </motion.div>

        {/* ── Player Summary Bar ───────────────────────────── */}
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, delay: 0.05 }}
        >
          <div className="w-9 h-9 rounded-lg bg-[#21262d] flex items-center justify-center border border-[#30363d]">
            <span className="text-xs font-black tabular-nums" style={{ color: getOvrColor(ovr) }}>{ovr}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#e6edf3] truncate">{playerName}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1 py-0.5 text-white rounded-sm" style={{ backgroundColor: getPosColor(pos), fontSize: '8px' }}>{pos}</span>
              <span className="text-[9px] text-[#8b949e]">{totalGoals} goals · {totalTrophies} trophies · {totalApps} apps</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="text-center bg-[#21262d] rounded-md px-2 py-1">
              <div className="text-[10px] font-bold text-[#e6edf3] tabular-nums">{totalGoals}</div>
              <div className="text-[7px] text-[#8b949e]">Goals</div>
            </div>
            <div className="text-center bg-[#21262d] rounded-md px-2 py-1">
              <div className="text-[10px] font-bold text-[#e6edf3] tabular-nums">{totalAssists}</div>
              <div className="text-[7px] text-[#8b949e]">Assists</div>
            </div>
            <div className="text-center bg-[#21262d] rounded-md px-2 py-1">
              <div className="text-[10px] font-bold tabular-nums" style={{ color: tierColor }}>{legendScore}</div>
              <div className="text-[7px] text-[#8b949e]">Score</div>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Bar ──────────────────────────────────────── */}
        <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1">
          {TABS.map((tab, i) => (
            <button
              key={i}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-bold transition-colors"
              style={{
                backgroundColor: activeTab === i ? '#21262d' : 'transparent',
                color: activeTab === i ? COLORS.primary : COLORS.muted,
              }}
              onClick={() => handleTabChange(i)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────── */}
        {activeTab === 0 && <TabLegendaryPlayers />}
        {activeTab === 1 && gameState && <TabAllTimeRecords gameState={gameState} />}
        {activeTab === 2 && gameState && <TabCareerComparison gameState={gameState} />}
        {activeTab === 3 && gameState && <TabPathToLegend gameState={gameState} />}

        {/* ── Footer ───────────────────────────────────────── */}
        <motion.div
          className="text-center py-4 border-t border-[#30363d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Heart className="h-3 w-3 text-[#EF4444]" />
            <span className="text-[9px] text-[#8b949e]">A tribute to football&apos;s greatest players</span>
          </div>
          <span className="text-[8px] text-[#484f58]">Hall of Fame Enhanced · Season {gameState.currentSeason}</span>
        </motion.div>
      </div>
    </div>
  );
}
