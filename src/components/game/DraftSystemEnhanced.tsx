'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Users, Star, Target, TrendingUp, Clock, Filter,
  BarChart3, Flame, Crosshair, ArrowRight, Timer,
  UserCheck, Sparkles, AlertTriangle, Trophy, Layers,
  Shield, Swords, Zap, Eye, Award, PieChart, LayoutGrid,
  GitCompare, CheckCircle, XCircle, ChevronRight
} from 'lucide-react';

/* ============================================================
   Constants
   ============================================================ */

const DRAFT_TABS = [
  { key: 'pool', label: 'Pool' },
  { key: 'board', label: 'Board' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'results', label: 'Results' },
] as const;

type DraftTab = (typeof DRAFT_TABS)[number]['key'];

/* ============================================================
   Seeded random for deterministic data
   ============================================================ */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

/* ============================================================
   Draft Pool Players (seeded data)
   ============================================================ */

interface DraftPlayer {
  id: string;
  name: string;
  position: string;
  overall: number;
  age: number;
  nationality: string;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  potential: number;
  status: 'available' | 'drafted' | 'watching';
}

const POSITION_GROUPS: Record<string, string> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LM: 'MID',
  RM: 'MID',
  LW: 'ATT',
  RW: 'ATT',
  ST: 'ATT',
  CF: 'ATT',
};

const POOL_PLAYERS: DraftPlayer[] = [
  { id: 'dp1', name: 'Lucas Fernandez', position: 'ST', overall: 86, age: 21, nationality: 'Brazil', pace: 88, shooting: 90, passing: 68, defending: 28, physical: 80, potential: 93, status: 'available' },
  { id: 'dp2', name: 'Tobias Schneider', position: 'CM', overall: 84, age: 23, nationality: 'Germany', pace: 72, shooting: 78, passing: 86, defending: 72, physical: 76, potential: 89, status: 'available' },
  { id: 'dp3', name: 'Yuki Tanaka', position: 'CB', overall: 83, age: 22, nationality: 'Japan', pace: 74, shooting: 38, passing: 68, defending: 88, physical: 82, potential: 88, status: 'available' },
  { id: 'dp4', name: 'Omar Benali', position: 'GK', overall: 82, age: 24, nationality: 'Algeria', pace: 46, shooting: 16, passing: 62, defending: 32, physical: 78, potential: 86, status: 'available' },
  { id: 'dp5', name: 'Callum Wright', position: 'RW', overall: 85, age: 20, nationality: 'England', pace: 92, shooting: 80, passing: 76, defending: 30, physical: 65, potential: 92, status: 'available' },
  { id: 'dp6', name: 'Enzo Moretti', position: 'CAM', overall: 81, age: 25, nationality: 'Italy', pace: 70, shooting: 82, passing: 84, defending: 40, physical: 62, potential: 85, status: 'available' },
  { id: 'dp7', name: 'Victor Andersen', position: 'LB', overall: 80, age: 22, nationality: 'Denmark', pace: 86, shooting: 60, passing: 74, defending: 78, physical: 72, potential: 86, status: 'available' },
  { id: 'dp8', name: 'Santiago Ruiz', position: 'CDM', overall: 82, age: 26, nationality: 'Spain', pace: 64, shooting: 66, passing: 82, defending: 84, physical: 80, potential: 84, status: 'drafted' },
  { id: 'dp9', name: 'Kofi Mensah', position: 'ST', overall: 79, age: 19, nationality: 'Ghana', pace: 90, shooting: 74, passing: 62, defending: 22, physical: 70, potential: 90, status: 'available' },
  { id: 'dp10', name: 'Nikolai Petrov', position: 'RB', overall: 78, age: 24, nationality: 'Russia', pace: 82, shooting: 58, passing: 70, defending: 76, physical: 74, potential: 82, status: 'available' },
  { id: 'dp11', name: 'Aiden Murphy', position: 'CF', overall: 83, age: 22, nationality: 'Ireland', pace: 78, shooting: 86, passing: 72, defending: 32, physical: 74, potential: 88, status: 'available' },
  { id: 'dp12', name: 'Rafael Costa', position: 'CM', overall: 77, age: 21, nationality: 'Portugal', pace: 74, shooting: 70, passing: 80, defending: 68, physical: 66, potential: 84, status: 'available' },
  { id: 'dp13', name: 'Johan Lindqvist', position: 'GK', overall: 80, age: 23, nationality: 'Sweden', pace: 44, shooting: 14, passing: 60, defending: 30, physical: 82, potential: 85, status: 'available' },
  { id: 'dp14', name: 'Hassan Diallo', position: 'LW', overall: 81, age: 20, nationality: 'Senegal', pace: 94, shooting: 72, passing: 68, defending: 26, physical: 64, potential: 89, status: 'available' },
  { id: 'dp15', name: 'Mateo Silva', position: 'CB', overall: 79, age: 27, nationality: 'Argentina', pace: 68, shooting: 35, passing: 64, defending: 84, physical: 80, potential: 82, status: 'available' },
  { id: 'dp16', name: 'Liam O\'Brien', position: 'ST', overall: 80, age: 24, nationality: 'Ireland', pace: 82, shooting: 82, passing: 64, defending: 26, physical: 76, potential: 84, status: 'available' },
  { id: 'dp17', name: 'Andre Williams', position: 'LB', overall: 78, age: 23, nationality: 'Jamaica', pace: 84, shooting: 56, passing: 72, defending: 76, physical: 70, potential: 83, status: 'available' },
  { id: 'dp18', name: 'Park Ji-hoon', position: 'CAM', overall: 82, age: 21, nationality: 'South Korea', pace: 76, shooting: 78, passing: 86, defending: 38, physical: 58, potential: 90, status: 'available' },
  { id: 'dp19', name: 'Marco Bianchi', position: 'CB', overall: 81, age: 25, nationality: 'Italy', pace: 70, shooting: 32, passing: 66, defending: 86, physical: 78, potential: 84, status: 'available' },
  { id: 'dp20', name: 'Chen Wei', position: 'RM', overall: 77, age: 22, nationality: 'China', pace: 80, shooting: 68, passing: 76, defending: 60, physical: 68, potential: 82, status: 'available' },
  { id: 'dp21', name: 'Diego Fuentes', position: 'RB', overall: 76, age: 20, nationality: 'Mexico', pace: 86, shooting: 54, passing: 68, defending: 72, physical: 66, potential: 83, status: 'available' },
  { id: 'dp22', name: 'Tom Henderson', position: 'CDM', overall: 80, age: 28, nationality: 'Australia', pace: 58, shooting: 62, passing: 80, defending: 82, physical: 82, potential: 82, status: 'available' },
  { id: 'dp23', name: 'Ali Karimi', position: 'GK', overall: 77, age: 26, nationality: 'Iran', pace: 42, shooting: 12, passing: 58, defending: 28, physical: 80, potential: 80, status: 'available' },
  { id: 'dp24', name: 'Kwame Asante', position: 'LW', overall: 79, age: 23, nationality: 'Ghana', pace: 88, shooting: 70, passing: 72, defending: 28, physical: 66, potential: 84, status: 'available' },
  { id: 'dp25', name: 'Bruno Alves', position: 'CF', overall: 78, age: 24, nationality: 'Portugal', pace: 72, shooting: 80, passing: 70, defending: 30, physical: 72, potential: 82, status: 'available' },
];

const POSITION_FILTERS = ['All', 'GK', 'DEF', 'MID', 'ATT'] as const;

/* ============================================================
   Draft Board Data (seeded)
   ============================================================ */

interface DraftPick {
  round: number;
  team: string;
  player: string;
  position: string;
  overall: number;
}

const DRAFT_BOARD_TEAMS = [
  'Red Lions', 'Blue Eagles', 'Green Wolves', 'Gold Hawks', 'Silver Foxes',
];

const DRAFT_BOARD_PICKS: DraftPick[] = [
  { round: 1, team: 'Red Lions', player: 'Lucas Fernandez', position: 'ST', overall: 86 },
  { round: 1, team: 'Blue Eagles', player: 'Callum Wright', position: 'RW', overall: 85 },
  { round: 1, team: 'Green Wolves', player: 'Tobias Schneider', position: 'CM', overall: 84 },
  { round: 1, team: 'Gold Hawks', player: 'Yuki Tanaka', position: 'CB', overall: 83 },
  { round: 1, team: 'Silver Foxes', player: 'Aiden Murphy', position: 'CF', overall: 83 },
  { round: 2, team: 'Silver Foxes', player: 'Omar Benali', position: 'GK', overall: 82 },
  { round: 2, team: 'Gold Hawks', player: 'Santiago Ruiz', position: 'LB', overall: 80 },
  { round: 2, team: 'Green Wolves', player: 'Enzo Moretti', position: 'CAM', overall: 81 },
  { round: 2, team: 'Blue Eagles', player: 'Andre Williams', position: 'LB', overall: 78 },
  { round: 2, team: 'Red Lions', player: 'Park Ji-hoon', position: 'CAM', overall: 82 },
  { round: 3, team: 'Red Lions', player: 'Hassan Diallo', position: 'LW', overall: 81 },
  { round: 3, team: 'Blue Eagles', player: 'Marco Bianchi', position: 'CB', overall: 81 },
  { round: 3, team: 'Green Wolves', player: 'Liam O\'Brien', position: 'ST', overall: 80 },
  { round: 3, team: 'Gold Hawks', player: 'Tom Henderson', position: 'CDM', overall: 80 },
  { round: 3, team: 'Silver Foxes', player: 'Nikolai Petrov', position: 'RB', overall: 78 },
  { round: 4, team: 'Silver Foxes', player: 'Kofi Mensah', position: 'ST', overall: 79 },
  { round: 4, team: 'Gold Hawks', player: 'Rafael Costa', position: 'CM', overall: 77 },
  { round: 4, team: 'Green Wolves', player: 'Diego Fuentes', position: 'RB', overall: 76 },
  { round: 4, team: 'Blue Eagles', player: 'Bruno Alves', position: 'CF', overall: 78 },
  { round: 4, team: 'Red Lions', player: 'Johan Lindqvist', position: 'GK', overall: 80 },
  { round: 5, team: 'Red Lions', player: 'Mateo Silva', position: 'CB', overall: 79 },
  { round: 5, team: 'Blue Eagles', player: 'Chen Wei', position: 'RM', overall: 77 },
  { round: 5, team: 'Green Wolves', player: 'Kwame Asante', position: 'LW', overall: 79 },
  { round: 5, team: 'Gold Hawks', player: 'Ali Karimi', position: 'GK', overall: 77 },
  { round: 5, team: 'Silver Foxes', player: 'Victor Andersen', position: 'LB', overall: 80 },
  { round: 6, team: 'Silver Foxes', player: 'TBD', position: '-', overall: 0 },
  { round: 6, team: 'Gold Hawks', player: 'TBD', position: '-', overall: 0 },
  { round: 6, team: 'Green Wolves', player: 'TBD', position: '-', overall: 0 },
  { round: 6, team: 'Blue Eagles', player: 'TBD', position: '-', overall: 0 },
  { round: 6, team: 'Red Lions', player: 'TBD', position: '-', overall: 0 },
  { round: 7, team: 'Red Lions', player: 'TBD', position: '-', overall: 0 },
  { round: 7, team: 'Blue Eagles', player: 'TBD', position: '-', overall: 0 },
  { round: 7, team: 'Green Wolves', player: 'TBD', position: '-', overall: 0 },
  { round: 7, team: 'Gold Hawks', player: 'TBD', position: '-', overall: 0 },
  { round: 7, team: 'Silver Foxes', player: 'TBD', position: '-', overall: 0 },
  { round: 8, team: 'Silver Foxes', player: 'TBD', position: '-', overall: 0 },
  { round: 8, team: 'Gold Hawks', player: 'TBD', position: '-', overall: 0 },
  { round: 8, team: 'Green Wolves', player: 'TBD', position: '-', overall: 0 },
  { round: 8, team: 'Blue Eagles', player: 'TBD', position: '-', overall: 0 },
  { round: 8, team: 'Red Lions', player: 'TBD', position: '-', overall: 0 },
];

/* ============================================================
   Strategy Data (seeded)
   ============================================================ */

interface StrategyItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  effectiveness: number;
}

const STRATEGY_ITEMS: StrategyItem[] = [
  { id: 'bpa', name: 'Best Player Available', description: 'Select the highest-rated player regardless of position', icon: <Star className="w-4 h-4" />, effectiveness: 82 },
  { id: 'need', name: 'Positional Need', description: 'Target positions where the squad lacks depth', icon: <Crosshair className="w-4 h-4" />, effectiveness: 76 },
  { id: 'trade', name: 'Trade Value', description: 'Draft players with high trade value for later deals', icon: <GitCompare className="w-4 h-4" />, effectiveness: 68 },
  { id: 'reach', name: 'Risky Reach', description: 'Take a chance on high-potential but raw talent', icon: <Flame className="w-4 h-4" />, effectiveness: 54 },
];

/* ============================================================
   Results Data (seeded)
   ============================================================ */

interface DraftResult {
  round: number;
  pick: number;
  player: string;
  position: string;
  overall: number;
  grade: string;
  category: 'steal' | 'value' | 'expected' | 'reach' | 'bust';
  performanceRating: number;
}

const DRAFT_RESULTS: DraftResult[] = [
  { round: 1, pick: 3, player: 'Tobias Schneider', position: 'CM', overall: 84, grade: 'A', category: 'steal', performanceRating: 91 },
  { round: 2, pick: 8, player: 'Enzo Moretti', position: 'CAM', overall: 81, grade: 'B+', category: 'value', performanceRating: 84 },
  { round: 3, pick: 14, player: 'Hassan Diallo', position: 'LW', overall: 81, grade: 'A-', category: 'steal', performanceRating: 88 },
  { round: 4, pick: 18, player: 'Johan Lindqvist', position: 'GK', overall: 80, grade: 'B', category: 'expected', performanceRating: 79 },
  { round: 5, pick: 23, player: 'Mateo Silva', position: 'CB', overall: 79, grade: 'B-', category: 'value', performanceRating: 82 },
  { round: 6, pick: 28, player: 'Diego Fuentes', position: 'RB', overall: 76, grade: 'C+', category: 'expected', performanceRating: 73 },
  { round: 7, pick: 33, player: 'Ali Karimi', position: 'GK', overall: 77, grade: 'C-', category: 'reach', performanceRating: 65 },
  { round: 8, pick: 38, player: 'Chen Wei', position: 'RM', overall: 77, grade: 'B', category: 'value', performanceRating: 80 },
];

/* ============================================================
   Helper Functions
   ============================================================ */

function getOvrColor(ovr: number): string {
  if (ovr >= 85) return '#CCFF00';
  if (ovr >= 80) return '#00E5FF';
  if (ovr >= 75) return '#999999';
  return '#666666';
}

function getOvrBgColor(ovr: number): string {
  if (ovr >= 85) return 'bg-[#CCFF00]/10 border border-[#CCFF00]/30';
  if (ovr >= 80) return 'bg-[#00E5FF]/10 border border-[#00E5FF]/30';
  if (ovr >= 75) return 'bg-surface-3 border border-border-web3';
  return 'bg-surface-2 border border-border-web3';
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#CCFF00';
  if (grade.startsWith('B')) return '#00E5FF';
  if (grade.startsWith('C')) return '#999999';
  return '#FF5500';
}

function getCategoryColor(cat: string): string {
  if (cat === 'steal') return '#CCFF00';
  if (cat === 'value') return '#00E5FF';
  if (cat === 'expected') return '#999999';
  if (cat === 'reach') return '#FF5500';
  return '#FF5500';
}

function getCategoryLabel(cat: string): string {
  if (cat === 'steal') return 'STEAL';
  if (cat === 'value') return 'VALUE';
  if (cat === 'expected') return 'EXPECTED';
  if (cat === 'reach') return 'REACH';
  return 'BUST';
}

/* ============================================================
   SVG Helpers
   ============================================================ */

function arcToPath(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number, innerR: number
): string {
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

interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

interface DonutArc {
  seg: DonutSegment;
  startAngle: number;
  endAngle: number;
}

function buildDonutArcs(segments: DonutSegment[]): DonutArc[] {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return segments.map((seg) => ({ seg, startAngle: 0, endAngle: 0 }));
  return segments.reduce((acc: DonutArc[], seg) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const segAngle = (seg.count / total) * 360;
    return [...acc, { seg, startAngle: prevEnd, endAngle: prevEnd + segAngle }];
  }, []);
}

function radarPoints(
  cx: number, cy: number, r: number,
  values: number[], axes: number
): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const vr = (v / 100) * r;
      return `${cx + vr * Math.cos(angle)},${cy + vr * Math.sin(angle)}`;
    })
    .join(' ');
}

function radarGridPoints(
  cx: number, cy: number, r: number, axes: number
): string {
  const result: string[] = [];
  for (let i = 0; i < axes; i++) {
    const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
    result.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return result.join(' ');
}

/* ============================================================
   SVG 1: Position Distribution Donut (Tab 1)
   ============================================================ */

function PositionDistributionDonut(): React.JSX.Element {
  const cx = 80;
  const cy = 85;
  const r = 50;
  const innerR = 30;

  const posCounts = POOL_PLAYERS.reduce<Record<string, number>>((acc, p) => {
    const group = POSITION_GROUPS[p.position] ?? 'MID';
    return { ...acc, [group]: (acc[group] ?? 0) + 1 };
  }, {});

  const segments: DonutSegment[] = [
    { label: 'GK', count: posCounts['GK'] ?? 0, color: '#CCFF00' },
    { label: 'DEF', count: posCounts['DEF'] ?? 0, color: '#00E5FF' },
    { label: 'MID', count: posCounts['MID'] ?? 0, color: '#FF5500' },
    { label: 'ATT', count: posCounts['ATT'] ?? 0, color: '#FF5500' },
    { label: 'Util', count: 0, color: '#666666' },
  ];

  const arcs = buildDonutArcs(segments);
  const total = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <svg viewBox="0 0 160 170" className="w-full max-w-[200px]">
      <text x={cx} y={14} textAnchor="middle" fill="#666666" fontSize="9" fontWeight="600">
        POSITION DISTRIBUTION
      </text>
      {arcs.map((arc) => {
        const gap = 1.5;
        const s = arc.startAngle + gap;
        const e = arc.endAngle - gap;
        if (e <= s) return <></>;
        return (
          <path
            key={arc.seg.label}
            d={arcToPath(cx, cy, r, s, e, innerR)}
            fill={arc.seg.color}
            fillOpacity={0.8}
          />
        );
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#e8e8e8" fontSize="18" fontWeight="700">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#666666" fontSize="8">
        PLAYERS
      </text>
      {segments.filter((seg) => seg.count > 0).map((seg, idx) => {
        const matchingArc = arcs.find((a) => a.seg.label === seg.label);
        const midAngle = matchingArc
          ? (matchingArc.startAngle + matchingArc.endAngle) / 2
          : 0;
        const labelR = r + 16;
        const rad = (midAngle - 90) * (Math.PI / 180);
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        return (
          <text
            key={seg.label}
            x={lx}
            y={ly}
            textAnchor="middle"
            fill={seg.color}
            fontSize="7"
            fontWeight="600"
          >
            {seg.label} ({seg.count})
          </text>
        );
      })}
      {/* Legend */}
      <rect x={10} y={148} width="8" height="8" rx="2" fill="#CCFF00" />
      <text x={22} y={156} fill="#999999" fontSize="7">GK</text>
      <rect x={42} y={148} width="8" height="8" rx="2" fill="#00E5FF" />
      <text x={54} y={156} fill="#999999" fontSize="7">DEF</text>
      <rect x={76} y={148} width="8" height="8" rx="2" fill="#FF5500" />
      <text x={88} y={156} fill="#999999" fontSize="7">MID</text>
      <rect x={108} y={148} width="8" height="8" rx="2" fill="#e8e8e8" />
      <text x={120} y={156} fill="#999999" fontSize="7">ATT</text>
    </svg>
  );
}

/* ============================================================
   SVG 2: Player Rating Bars (Tab 1)
   ============================================================ */

function PlayerRatingBars(): React.JSX.Element {
  const topPlayers = [...POOL_PLAYERS]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 6);

  const maxOvr = 100;
  const barH = 16;
  const gap = 8;
  const labelW = 80;
  const barMaxW = 100;
  const valueW = 24;
  const totalW = labelW + barMaxW + valueW + 16;
  const totalH = topPlayers.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[240px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">TOP PLAYER RATINGS</text>
      {topPlayers.map((player, i) => {
        const y = i * (barH + gap) + 22;
        const barW = (player.overall / maxOvr) * barMaxW;
        const ovrColor = getOvrColor(player.overall);
        return (
          <g key={player.id}>
            <text x={4} y={y + barH - 3} fill="#999999" fontSize="8">{player.name.split(' ')[1]}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#1a1a1a" />
            <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill={ovrColor} fillOpacity={0.8} />
            <text
              x={labelW + barMaxW + 4}
              y={y + barH - 3}
              fill="#e8e8e8"
              fontSize="9"
              fontWeight="700"
            >
              {player.overall}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 3: Draft Pick Value Line (Tab 1)
   ============================================================ */

function DraftPickValueLine(): React.JSX.Element {
  const padL = 28;
  const padR = 8;
  const padT = 24;
  const padB = 24;
  const w = 240;
  const h = 130;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const pickValues = [96, 90, 85, 82, 79, 76, 74, 72];
  const minVal = 65;
  const maxVal = 100;

  const linePoints = pickValues
    .map((val, i) => {
      const x = padL + (i / Math.max(pickValues.length - 1, 1)) * chartW;
      const y = padT + (1 - (val - minVal) / (maxVal - minVal)) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padL},${padT + chartH} ${linePoints} ${padL + chartW},${padT + chartH}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">PICK VALUE BY ROUND</text>
      {[70, 80, 90, 100].map((v) => {
        const y = padT + (1 - (v - minVal) / (maxVal - minVal)) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#222222" strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill="#666666" fontSize="7">{v}</text>
          </g>
        );
      })}
      <polygon points={areaPoints} fill="#00E5FF" fillOpacity={0.08} />
      <polyline
        points={linePoints}
        fill="none"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pickValues.map((val, i) => {
        const x = padL + (i / Math.max(pickValues.length - 1, 1)) * chartW;
        const y = padT + (1 - (val - minVal) / (maxVal - minVal)) * chartH;
        return (
          <g key={`pick-val-${i}`}>
            <circle cx={x} cy={y} r="3" fill="#00E5FF" />
            <text x={x} y={padT + chartH + 14} textAnchor="middle" fill="#666666" fontSize="7">
              R{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 4: Draft Board Heatmap (Tab 2)
   ============================================================ */

function DraftBoardHeatmap(): React.JSX.Element {
  const teams = DRAFT_BOARD_TEAMS;
  const rounds = 8;
  const cellW = 36;
  const cellH = 28;
  const labelW = 62;
  const padT = 22;
  const gap = 2;
  const totalW = labelW + rounds * (cellW + gap);
  const totalH = padT + teams.length * (cellH + gap);

  const maxOvr = 90;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[380px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">DRAFT BOARD HEATMAP</text>
      {/* Round labels */}
      {Array.from({ length: rounds }, (_, ri) => {
        const x = labelW + ri * (cellW + gap) + cellW / 2;
        return (
          <text
            key={`round-label-${ri}`}
            x={x}
            y={padT - 6}
            textAnchor="middle"
            fill="#666666"
            fontSize="7"
          >
            R{ri + 1}
          </text>
        );
      })}
      {/* Grid cells */}
      {teams.map((team, ti) => {
        const y = padT + ti * (cellH + gap);
        return (
          <g key={team}>
            <text x={labelW - 4} y={y + cellH / 2 + 3} textAnchor="end" fill="#999999" fontSize="7">
              {team.split(' ').pop()}
            </text>
            {Array.from({ length: rounds }, (_, ri) => {
              const pick = DRAFT_BOARD_PICKS.find(
                (p) => p.round === ri + 1 && p.team === team
              );
              const x = labelW + ri * (cellW + gap);
              const intensity = pick && pick.overall > 0
                ? Math.round((pick.overall / maxOvr) * 100)
                : 0;
              const fillColor = pick && pick.overall > 0
                ? `rgba(255, 85, 0, ${intensity / 100})`
                : '#1a1a1a';
              return (
                <g key={`cell-${ti}-${ri}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellW}
                    height={cellH}
                    rx="3"
                    fill={fillColor}
                  />
                  {pick && pick.overall > 0 && (
                    <text
                      x={x + cellW / 2}
                      y={y + cellH / 2 + 3}
                      textAnchor="middle"
                      fill="#e8e8e8"
                      fontSize="8"
                      fontWeight="600"
                    >
                      {pick.overall}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 5: Team Needs Radar (Tab 2)
   ============================================================ */

function TeamNeedsRadar(): React.JSX.Element {
  const cx = 100;
  const cy = 105;
  const r = 65;
  const axes = 5;
  const values = [35, 72, 58, 80, 45];
  const labels = ['GK', 'DEF', 'MID', 'ATT', 'Bench'];
  const levels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 210" className="w-full max-w-[240px]">
      <text x={cx} y={14} textAnchor="middle" fill="#666666" fontSize="9" fontWeight="600">
        TEAM NEEDS RADAR
      </text>
      {/* Grid rings */}
      {levels.map((level) => {
        const lr = (level / 100) * r;
        const ringPts = radarGridPoints(cx, cy, lr, axes);
        return (
          <polygon
            key={`grid-ring-${level}`}
            points={ringPts}
            fill="none"
            stroke="#222222"
            strokeWidth="0.5"
          />
        );
      })}
      {/* Axis lines + labels */}
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        const needColor = values[i] < 40 ? '#FF5500' : values[i] < 60 ? '#CCFF00' : '#00E5FF';
        return (
          <g key={label}>
            <line
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="#222222"
              strokeWidth="0.5"
            />
            <text
              x={lx}
              y={ly + 3}
              textAnchor="middle"
              fill={needColor}
              fontSize="8"
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* Data polygon */}
      <polygon
        points={radarPoints(cx, cy, r, values, axes)}
        fill="#00E5FF"
        fillOpacity={0.15}
        stroke="#00E5FF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {values.map((v, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const vr = (v / 100) * r;
        const px = cx + vr * Math.cos(angle);
        const py = cy + vr * Math.sin(angle);
        return (
          <circle key={`radar-dot-${i}`} cx={px} cy={py} r="3" fill="#00E5FF" />
        );
      })}
      {/* Legend */}
      <text x={10} y={198} fill="#666666" fontSize="7">Higher = Greater Need</text>
    </svg>
  );
}

/* ============================================================
   SVG 6: Draft Round Progress Ring (Tab 2)
   ============================================================ */

function DraftRoundProgressRing(): React.JSX.Element {
  const cx = 80;
  const cy = 85;
  const r = 50;
  const strokeWidth = 10;
  const currentRound = 3;
  const totalRounds = 8;
  const progress = currentRound / totalRounds;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[180px]">
      <text x={cx} y={14} textAnchor="middle" fill="#666666" fontSize="9" fontWeight="600">
        ROUND PROGRESS
      </text>
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#CCFF00"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        fillOpacity={1}
      />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e8e8e8" fontSize="22" fontWeight="700">
        {currentRound}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#666666" fontSize="9">
        of {totalRounds}
      </text>
      {/* Round markers */}
      {Array.from({ length: totalRounds }, (_, i) => {
        const angle = (Math.PI * 2 * i) / totalRounds - Math.PI / 2;
        const mx = cx + (r + strokeWidth / 2 + 8) * Math.cos(angle);
        const my = cy + (r + strokeWidth / 2 + 8) * Math.sin(angle);
        const isFilled = i < currentRound;
        return (
          <g key={`round-marker-${i}`}>
            <circle cx={mx} cy={my} r="4" fill={isFilled ? '#CCFF00' : '#222222'} />
            <text
              x={mx}
              y={my + 2.5}
              textAnchor="middle"
              fill={isFilled ? '#000000' : '#666666'}
              fontSize="6"
              fontWeight="700"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 7: Best Available Player Bars (Tab 3)
   ============================================================ */

function BestAvailableBars(): React.JSX.Element {
  const available = POOL_PLAYERS
    .filter((p) => p.status === 'available')
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 5);

  const maxOvr = 100;
  const barH = 18;
  const gap = 8;
  const labelW = 72;
  const barMaxW = 110;
  const valueW = 24;
  const totalW = labelW + barMaxW + valueW + 16;
  const totalH = available.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[260px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">BEST AVAILABLE</text>
      {available.map((player, i) => {
        const y = i * (barH + gap) + 22;
        const barW = (player.overall / maxOvr) * barMaxW;
        return (
          <g key={player.id}>
            <text x={4} y={y + barH - 4} fill="#999999" fontSize="8">
              {player.name.split(' ')[1]}
            </text>
            <text x={4} y={y + barH - 14} fill="#666666" fontSize="6">
              {player.position}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#1a1a1a" />
            <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill="#FF5500" fillOpacity={0.8} />
            <text
              x={labelW + barMaxW + 4}
              y={y + barH - 4}
              fill="#e8e8e8"
              fontSize="9"
              fontWeight="700"
            >
              {player.overall}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 8: Trade Value Comparison Butterfly (Tab 3)
   ============================================================ */

function TradeValueComparison(): React.JSX.Element {
  const cx = 150;
  const padT = 28;
  const h = 160;
  const halfW = 90;
  const barH = 16;
  const gap = 10;

  const metrics = [
    { label: 'OVR', pickValue: 82, playerValue: 88 },
    { label: 'Age', pickValue: 70, playerValue: 60 },
    { label: 'Potential', pickValue: 55, playerValue: 90 },
    { label: 'Fit', pickValue: 65, playerValue: 78 },
    { label: 'Cost', pickValue: 85, playerValue: 50 },
  ];

  const totalBarH = metrics.length * (barH + gap) - gap;

  return (
    <svg viewBox={`0 0 300 ${h}`} className="w-full max-w-[340px]">
      <text x={cx} y={12} textAnchor="middle" fill="#666666" fontSize="9" fontWeight="600">
        TRADE VALUE COMPARISON
      </text>
      {/* Side labels */}
      <text x={cx - halfW} y={padT - 6} textAnchor="start" fill="#666666" fontSize="7">
        PICK VALUE
      </text>
      <text x={cx + halfW} y={padT - 6} textAnchor="end" fill="#666666" fontSize="7">
        PLAYER VALUE
      </text>
      {/* Center line */}
      <line x1={cx} y1={padT} x2={cx} y2={padT + totalBarH} stroke="#222222" strokeWidth="1" />
      {metrics.map((m, i) => {
        const y = padT + i * (barH + gap);
        const pickW = (m.pickValue / 100) * halfW;
        const playerW = (m.playerValue / 100) * halfW;
        return (
          <g key={m.label}>
            {/* Pick bar (left) */}
            <rect
              x={cx - pickW}
              y={y}
              width={pickW}
              height={barH}
              rx="3"
              fill="#00E5FF"
              fillOpacity={0.6}
            />
            {/* Player bar (right) */}
            <rect
              x={cx}
              y={y}
              width={playerW}
              height={barH}
              rx="3"
              fill="#00E5FF"
              fillOpacity={0.9}
            />
            {/* Label */}
            <text
              x={cx}
              y={y + barH - 2}
              textAnchor="middle"
              fill="#000000"
              fontSize="7"
              fontWeight="700"
            >
              {m.label}
            </text>
            {/* Values */}
            <text
              x={cx - pickW - 4}
              y={y + barH - 2}
              textAnchor="end"
              fill="#666666"
              fontSize="7"
            >
              {m.pickValue}
            </text>
            <text
              x={cx + playerW + 4}
              y={y + barH - 2}
              textAnchor="start"
              fill="#e8e8e8"
              fontSize="7"
            >
              {m.playerValue}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 9: Draft Strategy Effectiveness Bars (Tab 3)
   ============================================================ */

function DraftStrategyEffectivenessBars(): React.JSX.Element {
  const bars = STRATEGY_ITEMS.map((s) => ({
    label: s.name.split(' ').slice(0, 2).join(' '),
    value: s.effectiveness,
  }));

  const maxVal = 100;
  const barH = 20;
  const gap = 12;
  const labelW = 52;
  const barMaxW = 110;
  const valueW = 28;
  const totalW = labelW + barMaxW + valueW + 12;
  const totalH = bars.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[220px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">STRATEGY EFFECTIVENESS</text>
      {bars.map((bar, i) => {
        const y = i * (barH + gap) + 22;
        const barW = (bar.value / maxVal) * barMaxW;
        return (
          <g key={bar.label}>
            <text x={4} y={y + barH - 4} fill="#999999" fontSize="8" fontWeight="500">
              {bar.label}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="4" fill="#1a1a1a" />
            <rect x={labelW} y={y} width={barW} height={barH} rx="4" fill="#CCFF00" fillOpacity={0.7} />
            <text
              x={labelW + barMaxW + 4}
              y={y + barH - 4}
              fill="#e8e8e8"
              fontSize="9"
              fontWeight="700"
            >
              {bar.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 10: Draft Grade Gauge (Tab 4)
   ============================================================ */

function DraftGradeGauge(): React.JSX.Element {
  const cx = 100;
  const cy = 110;
  const r = 70;
  const strokeWidth = 14;
  const grades = ['F', 'D', 'C', 'B', 'A'];
  const gradeValues = [40, 55, 65, 78, 90];
  const currentGradeIndex = 3;
  const gradeAngle = (180 / (grades.length - 1));
  const startAngle = 180;

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[260px]">
      <text x={cx} y={14} textAnchor="middle" fill="#666666" fontSize="9" fontWeight="600">
        TEAM DRAFT GRADE
      </text>
      {/* Background arc segments */}
      {grades.map((grade, i) => {
        const sAngle = startAngle - i * gradeAngle;
        const eAngle = startAngle - (i + 1) * gradeAngle;
        const sRad = (sAngle * Math.PI) / 180;
        const eRad = (eAngle * Math.PI) / 180;
        const x1 = cx + r * Math.cos(sRad);
        const y1 = cy - r * Math.sin(sRad);
        const x2 = cx + r * Math.cos(eRad);
        const y2 = cy - r * Math.sin(eRad);
        const isActive = i <= currentGradeIndex;
        return (
          <path
            key={grade}
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`}
            fill="none"
            stroke={isActive ? '#CCFF00' : '#1a1a1a'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
      {/* Grade labels */}
      {grades.map((grade, i) => {
        const midAngle = startAngle - i * gradeAngle - gradeAngle / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const labelR = r + 18;
        const lx = cx + labelR * Math.cos(midRad);
        const ly = cy - labelR * Math.sin(midRad);
        const isActive = i <= currentGradeIndex;
        return (
          <text
            key={`grade-label-${grade}`}
            x={lx}
            y={ly + 4}
            textAnchor="middle"
            fill={isActive ? '#CCFF00' : '#666666'}
            fontSize="10"
            fontWeight="700"
          >
            {grade}
          </text>
        );
      })}
      {/* Needle */}
      {(() => {
        const needleAngle = startAngle - currentGradeIndex * gradeAngle - gradeAngle / 2;
        const needleRad = (needleAngle * Math.PI) / 180;
        const nx = cx + (r - 20) * Math.cos(needleRad);
        const ny = cy - (r - 20) * Math.sin(needleRad);
        return (
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#e8e8e8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })()}
      {/* Center circle */}
      <circle cx={cx} cy={cy} r="6" fill="#1a1a1a" stroke="#CCFF00" strokeWidth="2" />
      {/* Grade display */}
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#CCFF00" fontSize="16" fontWeight="700">
        B+
      </text>
    </svg>
  );
}

/* ============================================================
   SVG 11: Steal vs Bust Scatter (Tab 4)
   ============================================================ */

function StealVsBustScatter(): React.JSX.Element {
  const padL = 36;
  const padR = 12;
  const padT = 24;
  const padB = 28;
  const w = 260;
  const h = 160;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const scatterData = DRAFT_RESULTS.map((dr) => ({
    pick: dr.pick,
    performance: dr.performanceRating,
    category: dr.category,
  }));

  const minPick = 0;
  const maxPick = 40;
  const minPerf = 60;
  const maxPerf = 95;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">STEAL vs BUST SCATTER</text>
      {/* Grid lines */}
      {[70, 80, 90].map((v) => {
        const y = padT + (1 - (v - minPerf) / (maxPerf - minPerf)) * chartH;
        return (
          <g key={`grid-${v}`}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#222222" strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill="#666666" fontSize="7">{v}</text>
          </g>
        );
      })}
      {[10, 20, 30, 40].map((v) => {
        const x = padL + ((v - minPick) / (maxPick - minPick)) * chartW;
        return (
          <g key={`grid-x-${v}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#222222" strokeWidth="0.5" />
            <text x={x} y={padT + chartH + 12} textAnchor="middle" fill="#666666" fontSize="7">
              #{v}
            </text>
          </g>
        );
      })}
      {/* Threshold line */}
      {(() => {
        const thresholdY = padT + (1 - (75 - minPerf) / (maxPerf - minPerf)) * chartH;
        return (
          <line
            x1={padL}
            y1={thresholdY}
            x2={padL + chartW}
            y2={thresholdY}
            stroke="#FF5500"
            strokeWidth="1"
            strokeDasharray="4 2"
            fillOpacity={0.5}
          />
        );
      })()}
      {/* Scatter dots */}
      {scatterData.map((d, i) => {
        const x = padL + ((d.pick - minPick) / (maxPick - minPick)) * chartW;
        const y = padT + (1 - (d.performance - minPerf) / (maxPerf - minPerf)) * chartH;
        const color = d.category === 'steal' || d.category === 'value'
          ? '#00E5FF'
          : '#FF5500';
        return (
          <g key={`scatter-${i}`}>
            <circle cx={x} cy={y} r="6" fill={color} fillOpacity={0.7} />
            <text
              x={x}
              y={y + 2.5}
              textAnchor="middle"
              fill="#000000"
              fontSize="6"
              fontWeight="700"
            >
              {d.pick}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <circle cx={padL} cy={h - 4} r="4" fill="#00E5FF" />
      <text x={padL + 8} y={h - 1} fill="#999999" fontSize="7">Steal/Value</text>
      <circle cx={padL + 80} cy={h - 4} r="4" fill="#FF5500" />
      <text x={padL + 88} y={h - 1} fill="#999999" fontSize="7">Reach/Bust</text>
    </svg>
  );
}

/* ============================================================
   SVG 12: Draft Class Comparison Bars (Tab 4)
   ============================================================ */

function DraftClassComparisonBars(): React.JSX.Element {
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const thisYearOvr = 82;
  const avgOvrs = [76, 79, 74, 81, thisYearOvr];

  const maxOvr = 100;
  const barH = 18;
  const gap = 10;
  const labelW = 36;
  const barMaxW = 120;
  const valueW = 24;
  const totalW = labelW + barMaxW + valueW + 12;
  const totalH = years.length * (barH + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[220px]">
      <text x={4} y={12} fill="#666666" fontSize="9" fontWeight="600">CLASS OVR COMPARISON</text>
      {years.map((year, i) => {
        const y = i * (barH + gap) + 22;
        const barW = (avgOvrs[i] / maxOvr) * barMaxW;
        const isCurrentYear = i === years.length - 1;
        const fillColor = isCurrentYear ? '#CCFF00' : '#222222';
        const strokeColor = isCurrentYear ? '#CCFF00' : '#333333';
        return (
          <g key={year}>
            <text x={4} y={y + barH - 4} fill={isCurrentYear ? '#CCFF00' : '#999999'} fontSize="9" fontWeight={isCurrentYear ? 700 : 400}>
              {year}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="4" fill={fillColor} fillOpacity={isCurrentYear ? 0.7 : 1} stroke={strokeColor} strokeWidth="0.5" />
            {isCurrentYear && (
              <rect x={labelW} y={y} width={barW} height={barH} rx="4" fill="#CCFF00" fillOpacity={0.3} />
            )}
            {!isCurrentYear && (
              <rect x={labelW} y={y} width={barW} height={barH} rx="4" fill="#666666" fillOpacity={0.3} />
            )}
            <text
              x={labelW + barMaxW + 4}
              y={y + barH - 4}
              fill={isCurrentYear ? '#CCFF00' : '#999999'}
              fontSize="9"
              fontWeight={isCurrentYear ? 700 : 400}
            >
              {avgOvrs[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   Draft Pool Player Card Component
   ============================================================ */

function DraftPlayerCard({ player }: { player: DraftPlayer }): React.JSX.Element {
  const ovrColor = getOvrColor(player.overall);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-2 border border-border-web3 rounded-lg p-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-3 border border-border-web3 text-text-dim">
              {player.position}
            </span>
            <span className="text-[10px] text-text-dim">{player.age}y</span>
            <span className="text-[10px] text-text-dim">{player.nationality}</span>
          </div>
          <p className="text-sm font-semibold text-text-bright mt-1 truncate">{player.name}</p>
          <p className="text-[10px] text-text-dim mt-0.5">POT {player.potential}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold" style={{ color: ovrColor }}>{player.overall}</span>
          <span className="text-[8px] text-text-dim">OVR</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1 mt-2">
        {[
          { label: 'PAC', value: player.pace },
          { label: 'SHO', value: player.shooting },
          { label: 'PAS', value: player.passing },
          { label: 'DEF', value: player.defending },
          { label: 'PHY', value: player.physical },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[8px] text-text-dim">{stat.label}</p>
            <p className="text-[10px] font-semibold text-text-mid">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {player.status === 'available' && (
          <span className="text-[9px] px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-medium">
            AVAILABLE
          </span>
        )}
        {player.status === 'drafted' && (
          <span className="text-[9px] px-2 py-0.5 bg-[#666666]/10 text-[#666666] border border-[#666666]/20 font-medium">
            DRAFTED
          </span>
        )}
        {player.status === 'watching' && (
          <span className="text-[9px] px-2 py-0.5 bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 font-medium">
            WATCHING
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   Draft Board Grid Component
   ============================================================ */

function DraftBoardGrid(): React.JSX.Element {
  const currentRound = 3;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-dim">Round {currentRound} of 8</span>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-[#FF5500]" />
          <span className="text-[10px] text-[#FF5500] font-mono">01:45</span>
        </div>
      </div>
      <div className="bg-surface-2 border border-border-web3 rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-px bg-border-web3 text-[8px] font-bold text-text-dim">
          <div className="bg-surface-3 px-2 py-1.5">RND</div>
          {DRAFT_BOARD_TEAMS.map((team) => (
            <div key={team} className="bg-surface-3 px-1 py-1.5 truncate text-center">
              {team.split(' ')[0].slice(0, 3).toUpperCase()}
            </div>
          ))}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {Array.from({ length: 8 }, (_, ri) => {
            const roundNum = ri + 1;
            const isCurrentRound = roundNum === currentRound;
            const picksForRound = DRAFT_BOARD_PICKS.filter((p) => p.round === roundNum);
            return (
              <div
                key={`board-row-${ri}`}
                className={`grid grid-cols-6 gap-px bg-border-web3 ${
                  isCurrentRound ? 'ring-1 ring-[#FF5500] ring-inset' : ''
                }`}
              >
                <div className={`px-2 py-1.5 text-[9px] flex items-center ${
                  isCurrentRound ? 'bg-[#FF5500]/10 text-[#FF5500] font-bold' : 'bg-surface-2 text-text-dim'
                }`}>
                  R{roundNum}
                  {isCurrentRound && <Clock className="w-2.5 h-2.5 ml-1" />}
                </div>
                {DRAFT_BOARD_TEAMS.map((team) => {
                  const pick = picksForRound.find((p) => p.team === team);
                  const isTBD = !pick || pick.overall === 0;
                  return (
                    <div
                      key={`${team}-${roundNum}`}
                      className={`px-1 py-1 text-center min-w-0 ${
                        isTBD ? 'bg-surface-1' : 'bg-surface-2'
                      }`}
                    >
                      {isTBD ? (
                        <span className="text-[8px] text-[#666666]">TBD</span>
                      ) : (
                        <div className="min-w-0">
                          <p className="text-[8px] text-text-bright truncate font-medium">{pick.player}</p>
                          <p className="text-[7px] text-text-dim">{pick.position}</p>
                          <p className="text-[9px] font-bold" style={{ color: getOvrColor(pick.overall) }}>
                            {pick.overall}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Strategy Card Component
   ============================================================ */

function StrategyCard({ strategy }: { strategy: StrategyItem }): React.JSX.Element {
  const barW = (strategy.effectiveness / 100) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-2 border border-border-web3 rounded-lg p-3"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-surface-3 border border-border-web3 flex items-center justify-center text-text-mid">
          {strategy.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-bright">{strategy.name}</p>
          <p className="text-[10px] text-text-dim line-clamp-2">{strategy.description}</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-text-dim">Effectiveness</span>
          <span className="text-[10px] font-bold text-[#CCFF00]">{strategy.effectiveness}%</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#CCFF00] rounded-full"
            style={{ width: `${barW}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Target Player Row Component
   ============================================================ */

function TargetPlayerRow({ rank }: { rank: number }): React.JSX.Element {
  const targets = POOL_PLAYERS
    .filter((p) => p.status === 'available')
    .sort((a, b) => b.potential - a.potential)
    .slice(rank - 1, rank);

  if (targets.length === 0) return <></>;
  const player = targets[0];

  return (
    <div className="flex items-center gap-3 bg-surface-2 border border-border-web3 rounded-lg px-3 py-2">
      <span className="text-[10px] text-text-dim font-mono w-4">#{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-bright truncate">{player.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-text-dim">{player.position}</span>
          <span className="text-[9px] text-text-dim">{player.age}y</span>
          <span className="text-[9px] text-text-dim">{player.nationality}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-text-bright">{player.overall}</div>
        <div className="text-[9px] text-[#CCFF00]">POT {player.potential}</div>
      </div>
    </div>
  );
}

/* ============================================================
   Draft Result Row Component
   ============================================================ */

function DraftResultRow({ result }: { result: DraftResult }): React.JSX.Element {
  const catColor = getCategoryColor(result.category);
  const catLabel = getCategoryLabel(result.category);
  const gradeColor = getGradeColor(result.grade);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 bg-surface-2 border border-border-web3 rounded-lg px-3 py-2"
    >
      <div className="text-center w-8">
        <p className="text-[9px] text-text-dim">R{result.round}</p>
        <p className="text-[8px] text-text-dim">#{result.pick}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-bright truncate">{result.player}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] px-1.5 py-0.5 bg-surface-3 border border-border-web3 text-text-dim">
            {result.position}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 font-medium"
            style={{ color: catColor, backgroundColor: `${catColor}15` }}
          >
            {catLabel}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-text-bright">{result.overall}</div>
        <div className="text-sm font-bold" style={{ color: gradeColor }}>{result.grade}</div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Trade Consideration Card Component
   ============================================================ */

function TradeConsiderationCard(): React.JSX.Element {
  const trades = [
    { give: 'R3 Pick (#14)', receive: '82 OVR CM', value: '+6', positive: true },
    { give: 'R5 Pick (#23)', receive: '78 OVR ST', value: '-2', positive: false },
    { give: 'R7 Pick (#33)', receive: '80 OVR GK', value: '+8', positive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-2 border border-border-web3 rounded-lg p-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitCompare className="w-4 h-4 text-[#00E5FF]" />
        <span className="text-xs font-semibold text-text-bright">Trade Considerations</span>
      </div>
      <div className="space-y-2">
        {trades.map((trade) => (
          <div key={trade.give} className="flex items-center gap-2 bg-surface-3 border border-border-web3 rounded-md px-2 py-1.5">
            <ArrowRight className="w-3 h-3 text-text-dim" />
            <span className="text-[10px] text-text-mid flex-1">{trade.give}</span>
            <span className="text-[10px] text-text-dim">for</span>
            <span className="text-[10px] text-text-bright flex-1 text-right">{trade.receive}</span>
            <span
              className={`text-[10px] font-bold ${
                trade.positive ? 'text-[#CCFF00]' : 'text-[#FF5500]'
              }`}
            >
              {trade.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ============================================================
   Main Component
   ============================================================ */

export default function DraftSystemEnhanced(): React.JSX.Element {
  const [tab, setTab] = useState<DraftTab>('pool');
  const [positionFilter, setPositionFilter] = useState('All');

  const gameState = useGameStore((s) => s.gameState);
  const currentSeason = gameState?.currentSeason ?? 1;
  const clubName = gameState?.currentClub.name ?? 'Your Club';

  /* Stat cards data */
  const statCards = [
    {
      label: 'Available',
      value: POOL_PLAYERS.filter((p) => p.status === 'available').length.toString(),
      icon: <Users className="w-4 h-4 text-[#00E5FF]" />,
      color: '#00E5FF',
    },
    {
      label: 'Drafted',
      value: POOL_PLAYERS.filter((p) => p.status === 'drafted').length.toString(),
      icon: <CheckCircle className="w-4 h-4 text-[#CCFF00]" />,
      color: '#CCFF00',
    },
    {
      label: 'Top OVR',
      value: Math.max(...POOL_PLAYERS.map((p) => p.overall)).toString(),
      icon: <Star className="w-4 h-4 text-[#FF5500]" />,
      color: '#FF5500',
    },
  ];

  /* Filtered pool players */
  const filteredPool = POOL_PLAYERS.filter((p) => {
    if (positionFilter === 'All') return true;
    const group = POSITION_GROUPS[p.position] ?? 'MID';
    return group === positionFilter;
  }).sort((a, b) => b.overall - a.overall);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20 font-grotesk">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border-web3 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-bright">Draft System</h1>
          <p className="text-[10px] text-text-dim">Season {currentSeason} | {clubName}</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3 flex flex-col items-center gap-1"
          >
            {card.icon}
            <span className="text-lg font-bold text-text-bright">{card.value}</span>
            <span className="text-[9px] text-text-dim">{card.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-border-web3">
        {DRAFT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 text-[10px] font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-surface-2 text-[#FF5500]'
                : 'text-text-mid hover:text-text-bright'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1: Draft Pool
          ============================================================ */}
      {tab === 'pool' && (
        <div className="space-y-3">
          {/* Position Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-dim" />
            <span className="text-[10px] text-text-dim mr-1">Filter:</span>
            {POSITION_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setPositionFilter(filter)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  positionFilter === filter
                    ? 'bg-[#FF5500] text-black'
                    : 'bg-surface-3 text-text-dim border border-border-web3 hover:text-text-bright'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* SVG 1: Position Distribution Donut */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Pool Breakdown</span>
            </div>
            <PositionDistributionDonut />
          </motion.div>

          {/* SVG 2: Player Rating Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Top Ratings</span>
            </div>
            <PlayerRatingBars />
          </motion.div>

          {/* SVG 3: Draft Pick Value Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs font-semibold text-text-bright">Pick Value Trend</span>
            </div>
            <DraftPickValueLine />
          </motion.div>

          {/* Player Cards */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-bright">
              Available Players ({filteredPool.length})
            </span>
            <span className="text-[10px] text-text-dim">Sorted by OVR</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPool.map((player) => (
              <DraftPlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: Draft Board
          ============================================================ */}
      {tab === 'board' && (
        <div className="space-y-3">
          {/* Live Timer Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#FF5500]/10 border border-[#FF5500]/30 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-[#FF5500] animate-pulse" />
              <span className="text-xs font-semibold text-[#FF5500]">LIVE DRAFT</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
              <span className="text-sm font-mono font-bold text-[#FF5500]">01:45</span>
            </div>
          </motion.div>

          {/* SVG 6: Draft Round Progress Ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4 flex justify-center"
          >
            <DraftRoundProgressRing />
          </motion.div>

          {/* Draft Board Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-semibold text-text-bright">Draft Board</span>
            </div>
            <DraftBoardGrid />
          </motion.div>

          {/* SVG 4: Draft Board Heatmap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-semibold text-text-bright">Pick Quality Heatmap</span>
            </div>
            <DraftBoardHeatmap />
          </motion.div>

          {/* SVG 5: Team Needs Radar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4 flex justify-center"
          >
            <TeamNeedsRadar />
          </motion.div>

          {/* On the Clock */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-semibold text-text-bright">On The Clock</span>
            </div>
            <div className="bg-surface-3 border border-border-web3 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-bright">Green Wolves</p>
                  <p className="text-[10px] text-text-dim">Round 3 | Pick #13</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border-web3 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#FF5500]" />
                </div>
              </div>
              <p className="text-[10px] text-text-mid mt-2">
                Projected: CF - Aiden Murphy (83 OVR)
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================
          TAB 3: Strategy
          ============================================================ */}
      {tab === 'strategy' && (
        <div className="space-y-3">
          {/* Strategy Cards */}
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-semibold text-text-bright">Draft Strategies</span>
          </div>
          <div className="space-y-2">
            {STRATEGY_ITEMS.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>

          {/* SVG 7: Best Available Player Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-semibold text-text-bright">Best Available</span>
            </div>
            <BestAvailableBars />
          </motion.div>

          {/* SVG 8: Trade Value Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs font-semibold text-text-bright">Trade Analysis</span>
            </div>
            <TradeValueComparison />
          </motion.div>

          {/* SVG 9: Draft Strategy Effectiveness Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Strategy Comparison</span>
            </div>
            <DraftStrategyEffectivenessBars />
          </motion.div>

          {/* Target Players */}
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-4 h-4 text-[#FF5500]" />
            <span className="text-xs font-semibold text-text-bright">Target Players</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((rank) => (
              <TargetPlayerRow key={rank} rank={rank} />
            ))}
          </div>

          {/* Trade Considerations */}
          <TradeConsiderationCard />

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs font-semibold text-text-bright">Draft Tips</span>
            </div>
            <div className="space-y-1.5">
              {[
                'Best Player Available is safest in early rounds',
                'Target positional needs from Round 3 onwards',
                'Watch for high-potential players slipping in later rounds',
                'Consider trading back for extra picks in deep drafts',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-[#CCFF00] mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-text-mid">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================
          TAB 4: Results
          ============================================================ */}
      {tab === 'results' && (
        <div className="space-y-3">
          {/* SVG 10: Draft Grade Gauge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4 flex justify-center"
          >
            <DraftGradeGauge />
          </motion.div>

          {/* Grade Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Steals', value: DRAFT_RESULTS.filter((r) => r.category === 'steal').length.toString(), color: '#CCFF00' },
              { label: 'Value', value: DRAFT_RESULTS.filter((r) => r.category === 'value').length.toString(), color: '#00E5FF' },
              { label: 'Expected', value: DRAFT_RESULTS.filter((r) => r.category === 'expected').length.toString(), color: '#999999' },
              { label: 'Reaches', value: DRAFT_RESULTS.filter((r) => r.category === 'reach' || r.category === 'bust').length.toString(), color: '#FF5500' },
            ].map((card) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-2 border border-border-web3 rounded-lg p-2 flex flex-col items-center gap-0.5"
              >
                <span className="text-lg font-bold" style={{ color: card.color }}>{card.value}</span>
                <span className="text-[8px] text-text-dim">{card.label}</span>
              </motion.div>
            ))}
          </div>

          {/* SVG 11: Steal vs Bust Scatter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-xs font-semibold text-text-bright">Steal vs Bust</span>
            </div>
            <StealVsBustScatter />
          </motion.div>

          {/* SVG 12: Draft Class Comparison Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Class Comparison</span>
            </div>
            <DraftClassComparisonBars />
          </motion.div>

          {/* Draft Results List */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Draft Picks</span>
            </div>
            <span className="text-[10px] text-text-dim">
              Avg OVR: {Math.round(DRAFT_RESULTS.reduce((s, r) => s + r.overall, 0) / DRAFT_RESULTS.length)}
            </span>
          </div>
          <div className="space-y-2">
            {DRAFT_RESULTS.map((result) => (
              <DraftResultRow key={result.pick} result={result} />
            ))}
          </div>

          {/* Draft Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-xs font-semibold text-text-bright">Draft Summary</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Best Pick', value: 'Tobias Schneider (R1, #3) - 84 OVR', color: '#CCFF00' },
                { label: 'Biggest Steal', value: 'Hassan Diallo (R3, #14) - 81 OVR', color: '#00E5FF' },
                { label: 'Biggest Reach', value: 'Ali Karimi (R7, #33) - 77 OVR', color: '#FF5500' },
                { label: 'Team Grade', value: 'B+ (79.5 Avg Performance)', color: '#CCFF00' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-[10px] text-text-dim w-20 flex-shrink-0">{item.label}</span>
                  <span className="text-[10px] font-medium" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#FF5500]/5 border border-[#FF5500]/20 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-[#FF5500] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-[#FF5500]">Early Assessment</p>
              <p className="text-[10px] text-text-mid mt-0.5">
                Performance ratings are projected. Actual results may vary based on
                development, injuries, and playing time.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
