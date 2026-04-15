'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Shield, Swords, Target, Zap, ChevronRight,
  ArrowRight, Cpu, Sliders, Move, Play, Users, Settings,
  Star, Crosshair, Compass, BarChart3, TrendingUp, Brain,
  Eye, AlertTriangle, Timer, RotateCcw,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

type TabId = 'formations' | 'setpieces' | 'strategy' | 'opposition';

interface PositionDot {
  x: number;
  y: number;
  label: string;
}

interface FormationDef {
  name: string;
  style: string;
  color: string;
  values: number[];
  positions: PositionDot[];
  effectiveness: { label: string; value: number }[];
}

interface SetPieceType {
  name: string;
  success: number;
  trained: number;
  total: number;
  icon: typeof Target;
  color: string;
}

interface StrategyDef {
  name: string;
  icon: typeof Swords;
  color: string;
  desc: string;
  metrics: number[];
}

interface PressingEntry {
  label: string;
  location: string;
  value: number;
  color: string;
}

interface OppAttribute {
  label: string;
  value: number;
  color: string;
}

interface ThreatEntry {
  label: string;
  value: number;
  color: string;
}

interface HistoryResult {
  label: string;
  result: 'W' | 'D' | 'L';
  score: string;
}

// ============================================================
// DATA: Formation definitions
// ============================================================

const FORMATIONS: FormationDef[] = [
  {
    name: '4-4-2', style: 'Balanced', color: '#CCFF00',
    values: [70, 75, 72, 65, 80],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 15, y: 70, label: 'LB' },
      { x: 37, y: 72, label: 'CB' }, { x: 63, y: 72, label: 'CB' },
      { x: 85, y: 70, label: 'RB' }, { x: 15, y: 50, label: 'LM' },
      { x: 37, y: 48, label: 'CM' }, { x: 63, y: 48, label: 'CM' },
      { x: 85, y: 50, label: 'RM' }, { x: 37, y: 25, label: 'ST' },
      { x: 63, y: 25, label: 'ST' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 1.8 },
      { label: 'Possession', value: 52 },
      { label: 'Clean Sheets', value: 40 },
      { label: 'Pass Acc', value: 78 },
    ],
  },
  {
    name: '4-3-3', style: 'Attacking', color: '#FF5500',
    values: [85, 60, 78, 75, 70],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 15, y: 70, label: 'LB' },
      { x: 37, y: 72, label: 'CB' }, { x: 63, y: 72, label: 'CB' },
      { x: 85, y: 70, label: 'RB' }, { x: 37, y: 48, label: 'CM' },
      { x: 50, y: 45, label: 'CM' }, { x: 63, y: 48, label: 'CM' },
      { x: 15, y: 25, label: 'LW' }, { x: 50, y: 20, label: 'ST' },
      { x: 85, y: 25, label: 'RW' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 2.1 },
      { label: 'Possession', value: 48 },
      { label: 'Clean Sheets', value: 30 },
      { label: 'Pass Acc', value: 75 },
    ],
  },
  {
    name: '3-5-2', style: 'Versatile', color: '#00E5FF',
    values: [75, 65, 80, 85, 65],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 25, y: 72, label: 'CB' },
      { x: 50, y: 74, label: 'CB' }, { x: 75, y: 72, label: 'CB' },
      { x: 10, y: 50, label: 'LWB' }, { x: 30, y: 45, label: 'CM' },
      { x: 50, y: 38, label: 'CAM' }, { x: 70, y: 45, label: 'CM' },
      { x: 90, y: 50, label: 'RWB' }, { x: 37, y: 22, label: 'ST' },
      { x: 63, y: 22, label: 'ST' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 1.9 },
      { label: 'Possession', value: 55 },
      { label: 'Clean Sheets', value: 35 },
      { label: 'Pass Acc', value: 80 },
    ],
  },
  {
    name: '4-2-3-1', style: 'Control', color: '#CCFF00',
    values: [72, 82, 85, 68, 78],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 15, y: 70, label: 'LB' },
      { x: 37, y: 72, label: 'CB' }, { x: 63, y: 72, label: 'CB' },
      { x: 85, y: 70, label: 'RB' }, { x: 37, y: 52, label: 'CDM' },
      { x: 63, y: 52, label: 'CDM' }, { x: 15, y: 30, label: 'LW' },
      { x: 50, y: 28, label: 'CAM' }, { x: 85, y: 30, label: 'RW' },
      { x: 50, y: 18, label: 'ST' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 1.7 },
      { label: 'Possession', value: 58 },
      { label: 'Clean Sheets', value: 45 },
      { label: 'Pass Acc', value: 82 },
    ],
  },
  {
    name: '4-5-1', style: 'Defensive', color: '#00E5FF',
    values: [60, 88, 82, 55, 72],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 15, y: 70, label: 'LB' },
      { x: 37, y: 72, label: 'CB' }, { x: 63, y: 72, label: 'CB' },
      { x: 85, y: 70, label: 'RB' }, { x: 10, y: 48, label: 'LM' },
      { x: 30, y: 44, label: 'CM' }, { x: 50, y: 42, label: 'CM' },
      { x: 70, y: 44, label: 'CM' }, { x: 90, y: 48, label: 'RM' },
      { x: 50, y: 20, label: 'ST' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 1.3 },
      { label: 'Possession', value: 60 },
      { label: 'Clean Sheets', value: 52 },
      { label: 'Pass Acc', value: 84 },
    ],
  },
  {
    name: '3-4-3', style: 'Aggressive', color: '#FF5500',
    values: [90, 55, 70, 80, 60],
    positions: [
      { x: 50, y: 90, label: 'GK' }, { x: 25, y: 72, label: 'CB' },
      { x: 50, y: 74, label: 'CB' }, { x: 75, y: 72, label: 'CB' },
      { x: 15, y: 50, label: 'LM' }, { x: 37, y: 45, label: 'CM' },
      { x: 63, y: 45, label: 'CM' }, { x: 85, y: 50, label: 'RM' },
      { x: 15, y: 22, label: 'LW' }, { x: 50, y: 18, label: 'ST' },
      { x: 85, y: 22, label: 'RW' },
    ],
    effectiveness: [
      { label: 'Goals/Match', value: 2.3 },
      { label: 'Possession', value: 45 },
      { label: 'Clean Sheets', value: 25 },
      { label: 'Pass Acc', value: 72 },
    ],
  },
];

// ============================================================
// DATA: Set piece types
// ============================================================

const SET_PIECE_TYPES: SetPieceType[] = [
  { name: 'Corner Kicks', success: 72, trained: 8, total: 12, icon: Target, color: '#CCFF00' },
  { name: 'Free Kicks', success: 28, trained: 5, total: 10, icon: Zap, color: '#FF5500' },
  { name: 'Penalties', success: 85, trained: 6, total: 8, icon: Star, color: '#00E5FF' },
  { name: 'Throw-ins', success: 45, trained: 4, total: 8, icon: ArrowRight, color: '#FF5500' },
  { name: 'Goal Kicks', success: 62, trained: 3, total: 6, icon: Shield, color: '#CCFF00' },
  { name: 'Defensive Set', success: 78, trained: 7, total: 10, icon: AlertTriangle, color: '#00E5FF' },
];

// ============================================================
// DATA: Set piece danger zone positions
// ============================================================

const DANGER_ZONES = [
  { x: 30, y: 22, r: 3.5 }, { x: 42, y: 18, r: 4 },
  { x: 55, y: 15, r: 3 }, { x: 68, y: 18, r: 4.5 },
  { x: 78, y: 22, r: 3 }, { x: 35, y: 35, r: 2.5 },
  { x: 50, y: 30, r: 3 }, { x: 65, y: 35, r: 2.5 },
  { x: 25, y: 40, r: 2 }, { x: 75, y: 40, r: 2 },
  { x: 50, y: 45, r: 2 }, { x: 40, y: 12, r: 3.5 },
];

// ============================================================
// DATA: Match strategies
// ============================================================

const STRATEGIES: StrategyDef[] = [
  {
    name: 'Attacking', icon: Swords, color: '#CCFF00',
    desc: 'High press, fast tempo, width',
    metrics: [90, 45, 60, 85, 55],
  },
  {
    name: 'Balanced', icon: Compass, color: '#FF5500',
    desc: 'Controlled tempo, organized shape',
    metrics: [70, 70, 72, 65, 75],
  },
  {
    name: 'Defensive', icon: Shield, color: '#00E5FF',
    desc: 'Deep block, compact shape',
    metrics: [40, 92, 45, 35, 88],
  },
  {
    name: 'Counter-Attack', icon: TrendingUp, color: '#CCFF00',
    desc: 'Absorb pressure, quick transitions',
    metrics: [55, 75, 85, 50, 65],
  },
];

// ============================================================
// DATA: Pressing intensity periods
// ============================================================

const PRESSING_DATA: PressingEntry[] = [
  { label: '1ST H', location: 'HOME', value: 78, color: '#CCFF00' },
  { label: '1ST H', location: 'AWAY', value: 62, color: '#FF5500' },
  { label: '2ND H', location: 'HOME', value: 85, color: '#CCFF00' },
  { label: '2ND H', location: 'AWAY', value: 55, color: '#FF5500' },
];

// ============================================================
// DATA: Opposition attributes
// ============================================================

const OPP_ATTRIBUTES: OppAttribute[] = [
  { label: 'Attack', value: 78, color: '#FF5500' },
  { label: 'Defense', value: 65, color: '#00E5FF' },
  { label: 'Midfield', value: 72, color: '#CCFF00' },
  { label: 'Set Pieces', value: 80, color: '#FF5500' },
  { label: 'Weaknesses', value: 35, color: '#ff3333' },
];

// ============================================================
// DATA: Historical match results
// ============================================================

const HISTORICAL_RESULTS: HistoryResult[] = [
  { label: 'W1', result: 'W', score: '2-1' },
  { label: 'W5', result: 'D', score: '1-1' },
  { label: 'W10', result: 'W', score: '3-0' },
  { label: 'W15', result: 'L', score: '0-2' },
  { label: 'W20', result: 'W', score: '2-1' },
  { label: 'W25', result: 'D', score: '0-0' },
];

// ============================================================
// DATA: Opposition threats
// ============================================================

const OPP_THREATS: ThreatEntry[] = [
  { label: 'Counter Attack', value: 82, color: '#ff3333' },
  { label: 'Set Pieces', value: 75, color: '#FF5500' },
  { label: 'Wide Play', value: 68, color: '#FF5500' },
  { label: 'Long Shots', value: 55, color: '#CCFF00' },
  { label: 'Aerial Duels', value: 72, color: '#FF5500' },
  { label: 'High Press', value: 45, color: '#CCFF00' },
];

// ============================================================
// DATA: Tab definitions
// ============================================================

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'formations', label: 'Formations', icon: LayoutGrid },
  { id: 'setpieces', label: 'Set Pieces', icon: Target },
  { id: 'strategy', label: 'Strategy', icon: Swords },
  { id: 'opposition', label: 'Opposition', icon: Eye },
];

// ============================================================
// DATA: Radar axis labels shared across charts
// ============================================================

const FORMATION_AXES = ['Attack', 'Defense', 'Midfield', 'Width', 'Flexibility'];
const OPP_RADAR_AXES = ['Attack', 'Defense', 'Midfield', 'Set Pieces', 'Mentality'];

// ============================================================
// HELPERS: Build radar grid polygon strings
// ============================================================

function buildRadarGridStrings(
  cx: number,
  cy: number,
  r: number,
  axisCount: number
): string[] {
  const scales = [0.25, 0.5, 0.75, 1];
  return scales.map((scale) =>
    Array.from({ length: axisCount }, (_, i) => {
      const angle = (i / axisCount) * 2 * Math.PI - Math.PI / 2;
      const px = cx + r * scale * Math.cos(angle);
      const py = cy + r * scale * Math.sin(angle);
      return `${px},${py}`;
    }).join(' ')
  );
}

// ============================================================
// HELPERS: Build radar data polygon points string
// ============================================================

function buildRadarPolygonString(
  cx: number,
  cy: number,
  r: number,
  values: number[]
): string {
  return values.map((v, i) => {
    const angle = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    const val = (v ?? 50) / 100;
    const px = cx + r * val * Math.cos(angle);
    const py = cy + r * val * Math.sin(angle);
    return `${px},${py}`;
  }).join(' ');
}

// ============================================================
// HELPERS: Build radar data points array
// ============================================================

function buildRadarDataPoints(
  cx: number,
  cy: number,
  r: number,
  values: number[]
): { x: number; y: number }[] {
  return values.map((v, i) => {
    const angle = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    const val = (v ?? 50) / 100;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
    };
  });
}

// ============================================================
// HELPERS: Build arrow head polygon points string
// ============================================================

function buildArrowPoints(x2: number, y2: number): string {
  return `${x2},${y2} ${x2 - 2},${y2 - 1.5} ${x2 - 2},${y2 + 1.5}`;
}

// ============================================================
// HELPERS: Radar axis angle
// ============================================================

function getAxisAngle(index: number, total: number): number {
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

// ============================================================
// HELPERS: Build danger zone circle points string
// ============================================================

function buildCirclePointsString(
  cx: number,
  cy: number,
  r: number,
  segments: number
): string {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * 2 * Math.PI;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    return `${px},${py}`;
  }).join(' ');
}

// ============================================================
// SVG #1: Formation Preview (pitch with position dots)
// ============================================================

function FormationPreview({
  positions,
  color,
}: {
  positions: PositionDot[];
  color: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-44">
      <rect
        x={5} y={5} width={90} height={90}
        fill="#0a0a0a" stroke="#222222" strokeWidth={0.8} rx={1}
      />
      <line x1={5} y1={50} x2={95} y2={50} stroke="#222222" strokeWidth={0.4} />
      <circle cx={50} cy={50} r={12} fill="none" stroke="#222222" strokeWidth={0.4} />
      <circle cx={50} cy={50} r={1} fill="#222222" />
      <rect x={20} y={5} width={60} height={18} fill="none" stroke="#222222" strokeWidth={0.3} rx={0.5} />
      <rect x={28} y={5} width={44} height={8} fill="none" stroke="#222222" strokeWidth={0.3} rx={0.5} />
      <rect x={20} y={77} width={60} height={18} fill="none" stroke="#222222" strokeWidth={0.3} rx={0.5} />
      <rect x={28} y={87} width={44} height={8} fill="none" stroke="#222222" strokeWidth={0.3} rx={0.5} />
      {positions.map((p, i) => (
        <motion.g
          key={`${p.label}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
        >
          <circle
            cx={p.x} cy={p.y} r={3.5}
            fill="#0a0a0a" stroke={color} strokeWidth={0.8}
          />
          <text
            x={p.x} y={p.y + 1.2}
            textAnchor="middle"
            className="text-[2.5px] font-bold"
            fill={color}
            fontFamily="monospace"
          >
            {p.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG #2: Formation Compatibility Radar (5-axis)
// ============================================================

function FormationCompatibilityRadar({ values }: { values: number[] }) {
  const cx = 50;
  const cy = 50;
  const r = 38;
  const gridStrings = buildRadarGridStrings(cx, cy, r, FORMATION_AXES.length);
  const polyString = buildRadarPolygonString(cx, cy, r, values);
  const dataPoints = buildRadarDataPoints(cx, cy, r, values);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      {gridStrings.map((gl, i) => (
        <polygon
          key={`grid-${i}`}
          points={gl}
          fill="none" stroke="#222222" strokeWidth={0.3}
        />
      ))}
      {FORMATION_AXES.map((a, i) => {
        const angle = getAxisAngle(i, FORMATION_AXES.length);
        return (
          <g key={a}>
            <line
              x1={cx} y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="#222222" strokeWidth={0.3}
            />
            <text
              x={cx + (r + 9) * Math.cos(angle)}
              y={cy + (r + 9) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[3.5px]"
              fill="#666666"
              fontFamily="monospace"
            >
              {a}
            </text>
          </g>
        );
      })}
      <motion.polygon
        points={polyString}
        fill="#CCFF00" fillOpacity={0.12} stroke="#CCFF00" strokeWidth={1}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      />
      {dataPoints.map((p, i) => (
        <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={1.5} fill="#CCFF00" />
      ))}
    </svg>
  );
}

// ============================================================
// SVG #3: Formation Effectiveness Bars
// ============================================================

function FormationEffectivenessBars({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <svg viewBox="0 0 100 52" className="w-full h-28">
      {data.map((d, i) => {
        const y = 4 + i * 12;
        const maxVal = d.label === 'Goals/Match' ? 3 : 100;
        const barW = (d.value / maxVal) * 60;
        const displayVal = d.label === 'Goals/Match' ? String(d.value) : `${d.value}%`;
        return (
          <g key={`eff-${i}`}>
            <text
              x={2} y={y + 5}
              className="text-[3px]"
              fill="#666666"
              fontFamily="monospace"
            >
              {d.label.toUpperCase()}
            </text>
            <rect x={28} y={y} width={60} height={6} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={28} y={y} width={barW} height={6}
              fill="#FF5500" rx={0.5} opacity={0.85}
              initial={{ opacity: 0 }} animate={{ opacity: 0.85 }}
              transition={{ delay: i * 0.1 }}
            />
            <text
              x={92} y={y + 5}
              className="text-[3px] font-bold"
              fill="#CCFF00"
              fontFamily="monospace"
              textAnchor="end"
            >
              {displayVal}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #4: Set Piece Success Bars (6 horizontal bars)
// ============================================================

function SetPieceSuccessBars() {
  const bars = SET_PIECE_TYPES.map((sp) => ({
    label: sp.name.split(' ')[0].toUpperCase().slice(0, 5),
    value: sp.success,
    color: sp.color,
  }));

  return (
    <svg viewBox="0 0 100 72" className="w-full h-40">
      {bars.map((b, i) => {
        const y = 2 + i * 11;
        const barW = (b.value / 100) * 55;
        return (
          <g key={`sp-bar-${i}`}>
            <text
              x={2} y={y + 5}
              className="text-[3px]"
              fill="#666666"
              fontFamily="monospace"
            >
              {b.label}
            </text>
            <rect x={22} y={y} width={55} height={5.5} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={22} y={y} width={barW} height={5.5}
              fill={b.color} rx={0.5} opacity={0.8}
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
              transition={{ delay: i * 0.08 }}
            />
            <text
              x={80} y={y + 5}
              className="text-[3px] font-bold"
              fill="#CCFF00"
              fontFamily="monospace"
              textAnchor="start"
            >
              {b.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #5: Set Piece Danger Zones Scatter (12 dots on mini pitch)
// ============================================================

function SetPieceDangerZones() {
  return (
    <svg viewBox="0 0 100 70" className="w-full h-40">
      <rect
        x={5} y={3} width={90} height={58}
        fill="#0a0a0a" stroke="#222222" strokeWidth={0.5} rx={1}
      />
      <line x1={5} y1={32} x2={95} y2={32} stroke="#222222" strokeWidth={0.3} />
      <line x1={50} y1={3} x2={50} y2={61} stroke="#222222" strokeWidth={0.3} />
      <circle cx={50} cy={32} r={8} fill="none" stroke="#222222" strokeWidth={0.3} />
      <rect x={20} y={3} width={60} height={14} fill="none" stroke="#222222" strokeWidth={0.3} />
      <rect x={32} y={3} width={36} height={6} fill="none" stroke="#222222" strokeWidth={0.3} />
      {DANGER_ZONES.map((z, i) => (
        <motion.circle
          key={`dz-${i}`}
          cx={z.x} cy={z.y} r={z.r}
          fill="#FF5500" opacity={0.5}
          initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
      <text
        x={50} y={68} textAnchor="middle"
        className="text-[3.5px]" fill="#666666" fontFamily="monospace"
      >
        DANGER ZONES
      </text>
    </svg>
  );
}

// ============================================================
// SVG #6: Set Piece Routine Ring (circular progress)
// ============================================================

function SetPieceRoutineRing() {
  const cx = 50;
  const cy = 50;
  const r = 35;
  const circumference = 2 * Math.PI * r;

  const trainedTotal = SET_PIECE_TYPES.reduce((sum, sp) => sum + sp.trained, 0);
  const allTotal = SET_PIECE_TYPES.reduce((sum, sp) => sum + sp.total, 0);
  const overallProgress = Math.min(trainedTotal / allTotal, 1);
  const overallOffset = circumference * (1 - overallProgress);
  const outerRingPoints = buildCirclePointsString(cx, cy, r + 3, 60);
  const innerRingPoints = buildCirclePointsString(cx, cy, r - 3, 60);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      <polygon
        points={outerRingPoints}
        fill="none" stroke="#1a1a1a" strokeWidth={0.5}
      />
      <polygon
        points={innerRingPoints}
        fill="none" stroke="#1a1a1a" strokeWidth={0.5}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#1a1a1a" strokeWidth={5}
      />
      <motion.circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#CCFF00" strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={overallOffset}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <circle cx={cx} cy={cy} r={26} fill="#0a0a0a" />
      <text
        x={cx} y={cy - 4} textAnchor="middle"
        className="text-[10px] font-bold" fill="#CCFF00" fontFamily="monospace"
      >
        {trainedTotal}/{allTotal}
      </text>
      <text
        x={cx} y={cy + 6} textAnchor="middle"
        className="text-[4px]" fill="#666666" fontFamily="monospace"
      >
        ROUTINES
      </text>
      <text
        x={cx} y={cy + 14} textAnchor="middle"
        className="text-[5px] font-bold" fill="#00E5FF" fontFamily="monospace"
      >
        {Math.round(overallProgress * 100)}%
      </text>
    </svg>
  );
}

// ============================================================
// SVG #7: Strategy Butterfly Chart (5 metrics)
// ============================================================

function StrategyButterflyChart({ strategy }: { strategy: StrategyDef }) {
  const metrics = ['Attack', 'Defense', 'Midfield', 'Width', 'Press'];
  const ourVals = strategy.metrics;
  const oppVals = ourVals.map((v) => Math.round((100 - v) * 0.8 + 20));

  return (
    <svg viewBox="0 0 100 62" className="w-full h-36">
      <line x1={50} y1={3} x2={50} y2={57} stroke="#222222" strokeWidth={0.4} />
      <text
        x={28} y={5} textAnchor="middle"
        className="text-[3px]" fill="#666666" fontFamily="monospace"
      >
        OPPONENT
      </text>
      <text
        x={72} y={5} textAnchor="middle"
        className="text-[3px]" fill="#666666" fontFamily="monospace"
      >
        YOUR TEAM
      </text>
      {metrics.map((m, i) => {
        const y = 10 + i * 10;
        const ourW = (ourVals[i] / 100) * 42;
        const oppW = (oppVals[i] / 100) * 42;
        return (
          <g key={`bf-${i}`}>
            <text
              x={50} y={y + 1.5} textAnchor="middle"
              className="text-[2.5px] font-bold" fill="#999999" fontFamily="monospace"
            >
              {m.toUpperCase()}
            </text>
            <rect x={50 - 42} y={y + 3} width={42} height={4} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={50 - oppW} y={y + 3} width={oppW} height={4}
              fill="#00E5FF" rx={0.5} opacity={0.7}
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
              transition={{ delay: i * 0.08 }}
            />
            <rect x={50} y={y + 3} width={42} height={4} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={50} y={y + 3} width={ourW} height={4}
              fill="#CCFF00" rx={0.5} opacity={0.7}
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
              transition={{ delay: i * 0.08 + 0.2 }}
            />
            <text
              x={50 - oppW - 1} y={y + 7}
              textAnchor="end"
              className="text-[2.5px] font-bold" fill="#00E5FF" fontFamily="monospace"
            >
              {oppVals[i]}
            </text>
            <text
              x={50 + ourW + 1} y={y + 7}
              textAnchor="start"
              className="text-[2.5px] font-bold" fill="#CCFF00" fontFamily="monospace"
            >
              {ourVals[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #8: Pressing Intensity Bars (4 periods)
// ============================================================

function PressingIntensityBars() {
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <text
        x={35} y={5} textAnchor="middle"
        className="text-[3.5px] font-bold" fill="#999999" fontFamily="monospace"
      >
        1ST HALF
      </text>
      <text
        x={72} y={5} textAnchor="middle"
        className="text-[3.5px] font-bold" fill="#999999" fontFamily="monospace"
      >
        2ND HALF
      </text>
      {PRESSING_DATA.map((pd, i) => {
        const col = i < 2 ? 0 : 1;
        const row = i % 2;
        const x = 12 + col * 38;
        const y = 10 + row * 22;
        const barW = (pd.value / 100) * 30;
        return (
          <g key={`press-${i}`}>
            <text
              x={x + 15} y={y} textAnchor="middle"
              className="text-[2.5px]" fill="#666666" fontFamily="monospace"
            >
              {pd.location}
            </text>
            <rect x={x} y={y + 3} width={30} height={7} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={x} y={y + 3} width={barW} height={7}
              fill={pd.color} rx={0.5} opacity={0.8}
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
              transition={{ delay: i * 0.1 }}
            />
            <text
              x={x + 15} y={y + 14} textAnchor="middle"
              className="text-[3px] font-bold" fill={pd.color} fontFamily="monospace"
            >
              {pd.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #9: Decision Flow (4 nodes horizontal)
// ============================================================

function DecisionFlow() {
  const nodes = [
    { x: 10, y: 30, label: 'KICK OFF', color: '#FF5500' },
    { x: 35, y: 30, label: 'SCORE?', color: '#CCFF00' },
    { x: 60, y: 14, label: 'DEFEND', color: '#00E5FF' },
    { x: 60, y: 46, label: 'CHASE', color: '#ff3333' },
    { x: 85, y: 14, label: 'SEE OUT', color: '#00E5FF' },
    { x: 85, y: 46, label: 'PUSH UP', color: '#CCFF00' },
  ];

  const lines = [
    { x1: 18, y1: 30, x2: 27, y2: 30 },
    { x1: 43, y1: 27, x2: 52, y2: 17 },
    { x1: 43, y1: 33, x2: 52, y2: 43 },
    { x1: 68, y1: 14, x2: 77, y2: 14 },
    { x1: 68, y1: 46, x2: 77, y2: 46 },
  ];

  return (
    <svg viewBox="0 0 100 60" className="w-full h-28">
      {lines.map((l, i) => {
        const arrowStr = buildArrowPoints(l.x2, l.y2);
        return (
          <g key={`line-${i}`}>
            <line
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#222222" strokeWidth={0.5}
            />
            <polygon points={arrowStr} fill="#222222" />
          </g>
        );
      })}
      <text
        x={47} y={22} textAnchor="middle"
        className="text-[2.5px] font-bold" fill="#CCFF00" fontFamily="monospace"
      >
        YES
      </text>
      <text
        x={47} y={42} textAnchor="middle"
        className="text-[2.5px] font-bold" fill="#ff3333" fontFamily="monospace"
      >
        NO
      </text>
      {nodes.map((n, i) => (
        <motion.g
          key={`node-${i}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <rect
            x={n.x} y={n.y - 5} width={16} height={10}
            fill="#0a0a0a" stroke={n.color} strokeWidth={0.6} rx={1}
          />
          <text
            x={n.x + 8} y={n.y + 1} textAnchor="middle"
            className="text-[2.5px] font-bold" fill={n.color} fontFamily="monospace"
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG #10: Opposition Weakness Radar (5-axis)
// ============================================================

function OppositionWeaknessRadar() {
  const values = [78, 65, 72, 80, 45];
  const cx = 50;
  const cy = 50;
  const r = 38;
  const gridStrings = buildRadarGridStrings(cx, cy, r, OPP_RADAR_AXES.length);
  const polyString = buildRadarPolygonString(cx, cy, r, values);
  const dataPoints = buildRadarDataPoints(cx, cy, r, values);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      {gridStrings.map((gl, i) => (
        <polygon
          key={`owg-${i}`}
          points={gl}
          fill="none" stroke="#222222" strokeWidth={0.3}
        />
      ))}
      {OPP_RADAR_AXES.map((a, i) => {
        const angle = getAxisAngle(i, OPP_RADAR_AXES.length);
        return (
          <g key={`owa-${i}`}>
            <line
              x1={cx} y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="#222222" strokeWidth={0.3}
            />
            <text
              x={cx + (r + 10) * Math.cos(angle)}
              y={cy + (r + 10) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[3px]"
              fill="#666666"
              fontFamily="monospace"
            >
              {a}
            </text>
          </g>
        );
      })}
      <motion.polygon
        points={polyString}
        fill="#FF5500" fillOpacity={0.1} stroke="#FF5500" strokeWidth={0.8}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      />
      {dataPoints.map((p, i) => (
        <circle key={`owp-${i}`} cx={p.x} cy={p.y} r={1.5} fill="#FF5500" />
      ))}
      {dataPoints[4] && (
        <circle
          cx={dataPoints[4].x} cy={dataPoints[4].y} r={3}
          fill="none" stroke="#ff3333" strokeWidth={0.5} opacity={0.8}
        />
      )}
    </svg>
  );
}

// ============================================================
// SVG #11: Match History Timeline (6 dots W/D/L)
// ============================================================

function MatchHistoryTimeline() {
  const colorMap: Record<string, string> = {
    W: '#CCFF00',
    D: '#FF5500',
    L: '#ff3333',
  };

  return (
    <svg viewBox="0 0 100 50" className="w-full h-28">
      <line x1={8} y1={25} x2={92} y2={25} stroke="#222222" strokeWidth={0.5} />
      {HISTORICAL_RESULTS.map((r, i) => {
        const x = 12 + (i / (HISTORICAL_RESULTS.length - 1)) * 76;
        const color = colorMap[r.result] ?? '#999999';
        return (
          <motion.g
            key={`hist-${i}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <circle
              cx={x} cy={25} r={5}
              fill="#0a0a0a" stroke={color} strokeWidth={0.8}
            />
            <text
              x={x} y={26} textAnchor="middle"
              className="text-[3px] font-bold" fill={color} fontFamily="monospace"
            >
              {r.result}
            </text>
            <text
              x={x} y={38} textAnchor="middle"
              className="text-[2.5px]" fill="#666666" fontFamily="monospace"
            >
              {r.label}
            </text>
            <text
              x={x} y={16} textAnchor="middle"
              className="text-[2.5px]" fill="#999999" fontFamily="monospace"
            >
              {r.score}
            </text>
          </motion.g>
        );
      })}
      <g>
        <circle cx={30} cy={47} r={1.5} fill="#CCFF00" />
        <text x={33} y={48} className="text-[2.5px]" fill="#666666" fontFamily="monospace">W</text>
        <circle cx={45} cy={47} r={1.5} fill="#FF5500" />
        <text x={48} y={48} className="text-[2.5px]" fill="#666666" fontFamily="monospace">D</text>
        <circle cx={60} cy={47} r={1.5} fill="#ff3333" />
        <text x={63} y={48} className="text-[2.5px]" fill="#666666" fontFamily="monospace">L</text>
      </g>
    </svg>
  );
}

// ============================================================
// SVG #12: Opposition Threat Bars (6 threats)
// ============================================================

function OppositionThreatBars() {
  return (
    <svg viewBox="0 0 100 72" className="w-full h-40">
      {OPP_THREATS.map((t, i) => {
        const y = 2 + i * 11;
        const barW = (t.value / 100) * 55;
        const threatLevel = t.value >= 75 ? 'HIGH' : t.value >= 55 ? 'MED' : 'LOW';
        const threatColor = t.value >= 75 ? '#ff3333' : t.value >= 55 ? '#FF5500' : '#CCFF00';
        return (
          <g key={`threat-${i}`}>
            <text
              x={2} y={y + 5}
              className="text-[2.8px]"
              fill="#666666"
              fontFamily="monospace"
            >
              {t.label.toUpperCase()}
            </text>
            <rect x={32} y={y} width={50} height={5.5} fill="#1a1a1a" rx={0.5} />
            <motion.rect
              x={32} y={y} width={barW} height={5.5}
              fill={t.color} rx={0.5} opacity={0.8}
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}
              transition={{ delay: i * 0.08 }}
            />
            <text
              x={85} y={y + 5}
              className="text-[2.8px] font-bold" fill={threatColor} fontFamily="monospace"
              textAnchor="start"
            >
              {threatLevel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// TAB 1: Formation Builder
// ============================================================

function FormationBuilderTab() {
  const [selectedFormation, setSelectedFormation] = useState<number>(0);
  const gameState = useGameStore((s) => s.gameState);
  const clubName = gameState?.currentClub?.name ?? 'My Club';

  const currentFormation = FORMATIONS[selectedFormation];
  const compatibilityScore = currentFormation.values.reduce((a, b) => a + b, 0) / currentFormation.values.length;

  const strengths = currentFormation.values
    .map((v, i) => ({ v, i }))
    .filter((item) => item.v >= 70);

  const weaknesses = currentFormation.values
    .map((v, i) => ({ v, i }))
    .filter((item) => item.v < 70);

  const defCount = currentFormation.positions
    .filter((p) => ['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(p.label)).length;
  const midCount = currentFormation.positions
    .filter((p) => ['LM', 'CM', 'RM', 'CAM', 'CDM'].includes(p.label)).length;
  const fwdCount = currentFormation.positions
    .filter((p) => ['ST', 'LW', 'RW'].includes(p.label)).length;

  const positionRoles = [
    { role: 'GK', count: 1, color: '#666666' },
    { role: 'DEF', count: defCount, color: '#00E5FF' },
    { role: 'MID', count: midCount, color: '#FF5500' },
    { role: 'FWD', count: fwdCount, color: '#CCFF00' },
  ];

  return (
    <div className="space-y-4">
      {/* Club Name Header */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-[#CCFF00]" />
        <span className="text-xs text-[#999999] font-mono">{clubName}</span>
        <Badge
          className="ml-auto text-[10px] font-mono border-[#222222] text-[#CCFF00]"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {currentFormation.name}
        </Badge>
      </div>

      {/* Formation Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        {FORMATIONS.map((f, i) => {
          const isSelected = selectedFormation === i;
          return (
            <motion.button
              key={`fm-card-${i}`}
              className={`p-3 text-left border transition-colors ${
                isSelected
                  ? 'border-[#CCFF00] bg-[#111111]'
                  : 'border-[#222222] bg-[#0a0a0a] hover:border-[#333333]'
              }`}
              onClick={() => setSelectedFormation(i)}
              whileTap={{ opacity: 0.7 }}
            >
              <div className="text-sm font-mono font-bold" style={{ color: f.color }}>
                {f.name}
              </div>
              <div className="text-[10px] text-[#666666] font-mono mt-1">
                {f.style}
              </div>
              <div className="flex gap-1 mt-2">
                {f.values.slice(0, 3).map((v, vi) => (
                  <div
                    key={`fm-ind-${i}-${vi}`}
                    className="h-1 flex-1 rounded-sm"
                    style={{
                      backgroundColor: f.color,
                      opacity: 0.2 + (v / 100) * 0.8,
                    }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Formation Preview SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Move className="w-4 h-4" style={{ color: currentFormation.color }} />
            Formation Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <FormationPreview
            positions={currentFormation.positions}
            color={currentFormation.color}
          />
        </CardContent>
      </Card>

      {/* Compatibility Radar SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
            Compatibility Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <FormationCompatibilityRadar values={currentFormation.values} />
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">COMPATIBILITY</div>
            <div className="text-lg font-mono font-bold text-[#CCFF00]">
              {Math.round(compatibilityScore)}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">SQUAD FIT</div>
            <div className="text-lg font-mono font-bold text-[#00E5FF]">
              {Math.round(compatibilityScore * 0.95)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Effectiveness Bars SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF5500]" />
            Effectiveness Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <FormationEffectivenessBars data={currentFormation.effectiveness} />
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#CCFF00]" />
            Strengths &amp; Weaknesses
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-[#CCFF00] font-mono font-bold mb-2">STRENGTHS</div>
              {strengths.map((item) => (
                <div key={`str-${item.i}`} className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#CCFF00' }} />
                  <span className="text-[10px] text-[#999999] font-mono">{FORMATION_AXES[item.i]}</span>
                  <span className="text-[10px] text-[#CCFF00] font-mono ml-auto">{item.v}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] text-[#ff3333] font-mono font-bold mb-2">WEAKNESSES</div>
              {weaknesses.map((item) => (
                <div key={`weak-${item.i}`} className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#ff3333' }} />
                  <span className="text-[10px] text-[#999999] font-mono">{FORMATION_AXES[item.i]}</span>
                  <span className="text-[10px] text-[#ff3333] font-mono ml-auto">{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Breakdown */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00E5FF]" />
            Position Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {positionRoles.map((pos) => (
              <div
                key={pos.role}
                className="p-2 text-center border"
                style={{ backgroundColor: '#0a0a0a', borderColor: '#222222' }}
              >
                <div className="text-base font-mono font-bold" style={{ color: pos.color }}>
                  {pos.count}
                </div>
                <div className="text-[9px] text-[#666666] font-mono">{pos.role}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Apply Formation Button */}
      <Button
        className="w-full font-mono text-xs border-[#CCFF00] text-[#CCFF00]"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <Play className="w-3 h-3 mr-2" />
        Apply {currentFormation.name} Formation
      </Button>
    </div>
  );
}

// ============================================================
// TAB 2: Set Pieces
// ============================================================

function SetPiecesTab() {
  const [selectedPiece, setSelectedPiece] = useState<number>(0);
  const gameState = useGameStore((s) => s.gameState);
  const clubName = gameState?.currentClub?.name ?? 'My Club';

  const currentPiece = SET_PIECE_TYPES[selectedPiece];
  const averageSuccess = SET_PIECE_TYPES.reduce((s, sp) => s + sp.success, 0) / SET_PIECE_TYPES.length;

  const takers = [
    { type: 'Corners', name: 'Martinez', rating: 78, color: '#CCFF00' },
    { type: 'Free Kicks', name: 'Silva', rating: 85, color: '#FF5500' },
    { type: 'Penalties', name: 'Kowalski', rating: 92, color: '#00E5FF' },
    { type: 'Throw-ins', name: 'Chen', rating: 71, color: '#CCFF00' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-[#FF5500]" />
        <span className="text-xs text-[#999999] font-mono">{clubName} Set Pieces</span>
        <Badge
          className="ml-auto text-[10px] font-mono border-[#222222] text-[#00E5FF]"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          AVG {Math.round(averageSuccess)}%
        </Badge>
      </div>

      {/* Set Piece Type Cards Grid */}
      <div className="grid grid-cols-2 gap-2">
        {SET_PIECE_TYPES.map((sp, i) => {
          const isSelected = selectedPiece === i;
          const IconComp = sp.icon;
          return (
            <motion.button
              key={`sp-card-${i}`}
              className={`p-3 text-left border transition-colors ${
                isSelected
                  ? 'border-[#FF5500] bg-[#111111]'
                  : 'border-[#222222] bg-[#0a0a0a] hover:border-[#333333]'
              }`}
              onClick={() => setSelectedPiece(i)}
              whileTap={{ opacity: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComp className="w-4 h-4" style={{ color: sp.color }} />
                <span className="text-xs font-mono font-bold text-[#e8e8e8]">
                  {sp.name}
                </span>
              </div>
              <div className="text-lg font-mono font-bold" style={{ color: sp.color }}>
                {sp.success}%
              </div>
              <div className="text-[10px] text-[#666666] font-mono">
                {sp.trained}/{sp.total} trained
              </div>
              <div className="mt-2 h-1.5 w-full rounded-sm" style={{ backgroundColor: '#1a1a1a' }}>
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${sp.success}%`,
                    backgroundColor: sp.color,
                    opacity: 0.8,
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Success Rate Bars SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#CCFF00]" />
            Success Rate Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <SetPieceSuccessBars />
        </CardContent>
      </Card>

      {/* Danger Zones SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5500]" />
            Danger Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <SetPieceDangerZones />
        </CardContent>
      </Card>

      {/* Routine Ring SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#CCFF00]" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <SetPieceRoutineRing />
        </CardContent>
      </Card>

      {/* Set Piece Taker Cards */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Star className="w-4 h-4 text-[#CCFF00]" />
            Set Piece Takers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {takers.map((taker) => (
              <div
                key={`taker-${taker.type}`}
                className="p-2 border"
                style={{ backgroundColor: '#0a0a0a', borderColor: '#222222' }}
              >
                <div className="text-[10px] text-[#666666] font-mono">{taker.type.toUpperCase()}</div>
                <div className="text-xs font-mono font-bold text-[#e8e8e8]">{taker.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1 rounded-sm" style={{ backgroundColor: '#1a1a1a' }}>
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${taker.rating}%`,
                        backgroundColor: taker.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: taker.color }}>
                    {taker.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Set Piece Stats Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">GOALS FROM</div>
            <div className="text-lg font-mono font-bold text-[#CCFF00]">12</div>
            <div className="text-[9px] text-[#666666] font-mono">SET PIECES</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">CONCEDED</div>
            <div className="text-lg font-mono font-bold text-[#ff3333]">5</div>
            <div className="text-[9px] text-[#666666] font-mono">FROM SETS</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">ROUTINES</div>
            <div className="text-lg font-mono font-bold text-[#00E5FF]">33</div>
            <div className="text-[9px] text-[#666666] font-mono">PRACTICED</div>
          </CardContent>
        </Card>
      </div>

      {/* Train Button */}
      <Button
        className="w-full font-mono text-xs border-[#FF5500] text-[#FF5500]"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <Timer className="w-3 h-3 mr-2" />
        Train {currentPiece.name}
      </Button>
    </div>
  );
}

// ============================================================
// TAB 3: Match Strategy
// ============================================================

function MatchStrategyTab() {
  const [selectedStrategy, setSelectedStrategy] = useState<number>(0);
  const gameState = useGameStore((s) => s.gameState);
  const clubName = gameState?.currentClub?.name ?? 'My Club';

  const currentStrategy = STRATEGIES[selectedStrategy];
  const StrategyIcon = currentStrategy.icon;
  const overallRating = currentStrategy.metrics.reduce((a, b) => a + b, 0) / currentStrategy.metrics.length;

  const metricLabels = ['Attack', 'Defense', 'Midfield', 'Width', 'Pressing'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Swords className="w-4 h-4 text-[#CCFF00]" />
        <span className="text-xs text-[#999999] font-mono">{clubName} Strategy</span>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-2">
        {STRATEGIES.map((s, i) => {
          const isSelected = selectedStrategy === i;
          const SIcon = s.icon;
          return (
            <motion.button
              key={`strat-card-${i}`}
              className={`p-3 text-left border transition-colors ${
                isSelected
                  ? 'border-[#CCFF00] bg-[#111111]'
                  : 'border-[#222222] bg-[#0a0a0a] hover:border-[#333333]'
              }`}
              onClick={() => setSelectedStrategy(i)}
              whileTap={{ opacity: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <SIcon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-sm font-mono font-bold text-[#e8e8e8]">
                  {s.name}
                </span>
              </div>
              <div className="text-[10px] text-[#666666] font-mono mt-1">
                {s.desc}
              </div>
              <div className="flex gap-1 mt-2">
                {s.metrics.map((m, mi) => (
                  <div
                    key={`strat-bar-${i}-${mi}`}
                    className="h-1 flex-1 rounded-sm"
                    style={{
                      backgroundColor: s.color,
                      opacity: 0.2 + (m / 100) * 0.8,
                    }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Strategy Detail Header */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center border"
              style={{ borderColor: currentStrategy.color, backgroundColor: '#0a0a0a' }}
            >
              <StrategyIcon className="w-5 h-5" style={{ color: currentStrategy.color }} />
            </div>
            <div>
              <div className="text-sm font-mono font-bold" style={{ color: currentStrategy.color }}>
                {currentStrategy.name}
              </div>
              <div className="text-[10px] text-[#666666] font-mono">
                {currentStrategy.desc}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-mono font-bold text-[#CCFF00]">
                {Math.round(overallRating)}
              </div>
              <div className="text-[10px] text-[#666666] font-mono">RATING</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Butterfly SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#00E5FF]" />
            Strategy Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <StrategyButterflyChart strategy={currentStrategy} />
        </CardContent>
      </Card>

      {/* Pressing Bars SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#CCFF00]" />
            Pressing Intensity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <PressingIntensityBars />
        </CardContent>
      </Card>

      {/* Decision Flow SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#FF5500]" />
            In-Game Decisions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <DecisionFlow />
        </CardContent>
      </Card>

      {/* Metrics Breakdown */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#CCFF00]" />
            Metrics Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {metricLabels.map((metric, i) => {
              const val = currentStrategy.metrics[i];
              const color = val >= 75 ? '#CCFF00' : val >= 50 ? '#FF5500' : '#ff3333';
              return (
                <div key={`metric-${i}`} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#666666] font-mono w-16">{metric}</span>
                  <div className="flex-1 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a' }}>
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${val}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold w-6 text-right" style={{ color }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Comparison Summary */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">ATTACK RATING</div>
            <div className="text-lg font-mono font-bold text-[#CCFF00]">
              {currentStrategy.metrics[0]}
            </div>
            <div className="text-[9px] text-[#666666] font-mono">OUT OF 100</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">DEFENSE RATING</div>
            <div className="text-lg font-mono font-bold text-[#00E5FF]">
              {currentStrategy.metrics[1]}
            </div>
            <div className="text-[9px] text-[#666666] font-mono">OUT OF 100</div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Strategy Button */}
      <Button
        className="w-full font-mono text-xs border-[#CCFF00] text-[#CCFF00]"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <Play className="w-3 h-3 mr-2" />
        Apply {currentStrategy.name} Strategy
      </Button>
    </div>
  );
}

// ============================================================
// TAB 4: Opposition Analysis
// ============================================================

function OppositionAnalysisTab() {
  const gameState = useGameStore((s) => s.gameState);
  const clubName = gameState?.currentClub?.name ?? 'My Club';
  const overallWeakness = OPP_ATTRIBUTES.reduce((s, a) => s + a.value, 0) / OPP_ATTRIBUTES.length;
  const wins = HISTORICAL_RESULTS.filter((r) => r.result === 'W').length;
  const losses = HISTORICAL_RESULTS.filter((r) => r.result === 'L').length;

  const keyPlayers = [
    { name: 'J. Henderson', position: 'ST', rating: 87, threat: 'HIGH', color: '#ff3333' },
    { name: 'M. Santos', position: 'CAM', rating: 82, threat: 'HIGH', color: '#ff3333' },
    { name: 'A. Petrov', position: 'CM', rating: 79, threat: 'MED', color: '#FF5500' },
  ];

  const tacticalNotes = [
    { note: 'Opponent weak on left side - target RB overlap', priority: '#CCFF00' },
    { note: 'Star striker prefers aerial duels - keep ball on ground', priority: '#FF5500' },
    { note: 'Weak set piece defending - exploit corners', priority: '#CCFF00' },
    { note: 'Counter-attack danger in transition moments', priority: '#ff3333' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-[#FF5500]" />
        <span className="text-xs text-[#999999] font-mono">{clubName} Scouting</span>
        <Badge
          className="ml-auto text-[10px] font-mono border-[#222222] text-[#ff3333]"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          NEXT: ARSENAL
        </Badge>
      </div>

      {/* Opponent Attribute Cards */}
      <div className="grid grid-cols-5 gap-2">
        {OPP_ATTRIBUTES.map((attr, i) => (
          <Card
            key={`opp-attr-${i}`}
            className="bg-[#0a0a0a] border-[#222222]"
          >
            <CardContent className="p-2 text-center">
              <div className="text-[9px] text-[#666666] font-mono mb-1">
                {attr.label.toUpperCase().slice(0, 4)}
              </div>
              <div className="text-base font-mono font-bold" style={{ color: attr.color }}>
                {attr.value}
              </div>
              <div className="mt-1 h-1 rounded-sm w-full" style={{ backgroundColor: '#1a1a1a' }}>
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${attr.value}%`,
                    backgroundColor: attr.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">OVERALL</div>
            <div className="text-lg font-mono font-bold text-[#FF5500]">
              {Math.round(overallWeakness)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">WINS</div>
            <div className="text-lg font-mono font-bold text-[#CCFF00]">
              {wins}/{HISTORICAL_RESULTS.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardContent className="p-3">
            <div className="text-[10px] text-[#666666] font-mono">LOSSES</div>
            <div className="text-lg font-mono font-bold text-[#ff3333]">
              {losses}/{HISTORICAL_RESULTS.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weakness Radar SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#FF5500]" />
            Weakness Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <OppositionWeaknessRadar />
        </CardContent>
      </Card>

      {/* Match History Timeline SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
            Match History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <MatchHistoryTimeline />
        </CardContent>
      </Card>

      {/* Threat Bars SVG */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff3333]" />
            Threat Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <OppositionThreatBars />
        </CardContent>
      </Card>

      {/* Key Players to Watch */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff3333]" />
            Key Players to Watch
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {keyPlayers.map((player) => (
              <div
                key={`opp-player-${player.name}`}
                className="flex items-center gap-3 p-2 border"
                style={{ backgroundColor: '#0a0a0a', borderColor: '#222222' }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-[10px] font-mono font-bold border"
                  style={{ borderColor: player.color, color: player.color, backgroundColor: '#111111' }}
                >
                  {player.position}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono font-bold text-[#e8e8e8]">{player.name}</div>
                  <div className="text-[10px] text-[#666666] font-mono">OVR {player.rating}</div>
                </div>
                <Badge
                  className="text-[9px] font-mono"
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderColor: player.color,
                    color: player.color,
                  }}
                >
                  {player.threat}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tactical Notes */}
      <Card className="bg-[#0a0a0a] border-[#222222]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-mono text-[#e8e8e8] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#CCFF00]" />
            Tactical Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {tacticalNotes.map((item) => (
              <div key={`note-${item.note.slice(0, 10)}`} className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-sm mt-1"
                  style={{ backgroundColor: item.priority }}
                />
                <span className="text-[10px] text-[#999999] font-mono leading-relaxed">
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scout Report Button */}
      <Button
        className="w-full font-mono text-xs border-[#00E5FF] text-[#00E5FF]"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <Sliders className="w-3 h-3 mr-2" />
        Generate Full Scout Report
      </Button>
    </div>
  );
}

// ============================================================
// MAIN: TacticalBoardEnhanced
// ============================================================

export default function TacticalBoardEnhanced() {
  const [activeTab, setActiveTab] = useState<TabId>('formations');
  const gameState = useGameStore((s) => s.gameState);

  // All hooks declared before conditional return (rule #4)
  if (!gameState) {
    return <></>;
  }

  const currentClubName = gameState.currentClub.name;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-5 h-5 text-[#FF5500]" />
          <h1 className="text-lg font-mono font-bold text-[#e8e8e8]">
            Tactical Board
          </h1>
          <Settings className="w-4 h-4 text-[#666666] ml-auto" />
        </div>
        <div className="text-[10px] text-[#666666] font-mono">
          {currentClubName} — Season {gameState.currentSeason} — Week {gameState.currentWeek}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono whitespace-nowrap border transition-colors ${
                isActive
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-[#222222] text-[#666666]'
              }`}
              style={{
                backgroundColor: isActive ? '#111111' : '#0a0a0a',
              }}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ opacity: 0.7 }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-1" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'formations' && <FormationBuilderTab />}
            {activeTab === 'setpieces' && <SetPiecesTab />}
            {activeTab === 'strategy' && <MatchStrategyTab />}
            {activeTab === 'opposition' && <OppositionAnalysisTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
