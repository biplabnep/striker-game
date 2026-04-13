'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Target, Route, Zap, Shield, Crosshair, Heart,
  Brain, Flag, Gamepad2, ChevronUp, ChevronDown,
  Trophy, Star, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

type Difficulty = 'easy' | 'medium' | 'hard';

type DrillTypeId =
  | 'shooting' | 'passing' | 'dribbling' | 'defensive'
  | 'free_kick' | 'fitness' | 'tactical' | 'penalty';

interface DrillSubType {
  id: string;
  label: string;
}

interface DrillStats {
  accuracy: number;
  goalsScored: number;
  rating: number;
}

interface DrillDefinition {
  id: DrillTypeId;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subTypes: DrillSubType[];
  primaryAttribute: string;
}

interface DrillResult {
  id: string;
  drillType: DrillTypeId;
  score: number;
  stars: number;
  xpGained: number;
  completedAt: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

interface TrainingAchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  color: string;
}

interface WeeklyPlanDay {
  day: string;
  drill: DrillTypeId | null;
  completed: boolean;
}

// ============================================================
// Constants
// ============================================================

const DRILL_DEFINITIONS: DrillDefinition[] = [
  {
    id: 'shooting',
    name: 'Shooting Practice',
    description: 'Improve your finishing accuracy and power',
    icon: <Target className="h-5 w-5" />,
    color: '#ef4444',
    subTypes: [
      { id: 'finishing', label: 'Finishing' },
      { id: 'long_range', label: 'Long Range' },
      { id: 'volleys', label: 'Volleys' },
    ],
    primaryAttribute: 'shooting',
  },
  {
    id: 'passing',
    name: 'Passing Drills',
    description: 'Master short and long passing techniques',
    icon: <Route className="h-5 w-5" />,
    color: '#3b82f6',
    subTypes: [
      { id: 'short_pass', label: 'Short Pass' },
      { id: 'long_ball', label: 'Long Ball' },
      { id: 'through_ball', label: 'Through Ball' },
    ],
    primaryAttribute: 'passing',
  },
  {
    id: 'dribbling',
    name: 'Dribbling Course',
    description: 'Navigate through cones and defenders',
    icon: <Zap className="h-5 w-5" />,
    color: '#f59e0b',
    subTypes: [
      { id: 'cone_dribble', label: 'Cone Dribble' },
      { id: 'one_v_one', label: '1v1' },
      { id: 'skill_moves', label: 'Skill Moves' },
    ],
    primaryAttribute: 'dribbling',
  },
  {
    id: 'defensive',
    name: 'Defensive Training',
    description: 'Improve tackling and positioning',
    icon: <Shield className="h-5 w-5" />,
    color: '#a78bfa',
    subTypes: [
      { id: 'tackling', label: 'Tackling' },
      { id: 'positioning', label: 'Positioning' },
      { id: 'aerial_duels', label: 'Aerial Duels' },
    ],
    primaryAttribute: 'defending',
  },
  {
    id: 'free_kick',
    name: 'Free Kick Practice',
    description: 'Perfect your set-piece technique',
    icon: <Crosshair className="h-5 w-5" />,
    color: '#34d399',
    subTypes: [
      { id: 'direct_fk', label: 'Direct FK' },
      { id: 'indirect_fk', label: 'Indirect FK' },
      { id: 'curl_power', label: 'Curl vs Power' },
    ],
    primaryAttribute: 'shooting',
  },
  {
    id: 'fitness',
    name: 'Fitness Training',
    description: 'Build stamina and strength',
    icon: <Heart className="h-5 w-5" />,
    color: '#ef4444',
    subTypes: [
      { id: 'cardio', label: 'Cardio' },
      { id: 'strength', label: 'Strength' },
      { id: 'agility', label: 'Agility' },
    ],
    primaryAttribute: 'physical',
  },
  {
    id: 'tactical',
    name: 'Tactical Training',
    description: 'Learn formations and positioning',
    icon: <Brain className="h-5 w-5" />,
    color: '#3b82f6',
    subTypes: [
      { id: 'positioning', label: 'Positioning' },
      { id: 'pressing', label: 'Pressing' },
      { id: 'counter_attack', label: 'Counter-Attack' },
    ],
    primaryAttribute: 'defending',
  },
  {
    id: 'penalty',
    name: 'Penalty Shootout',
    description: 'Practice under pressure scenarios',
    icon: <Flag className="h-5 w-5" />,
    color: '#f59e0b',
    subTypes: [
      { id: 'standard', label: 'Standard' },
      { id: 'pressure', label: 'Pressure' },
      { id: 'skill_penalty', label: 'Skill Penalty' },
    ],
    primaryAttribute: 'shooting',
  },
];

const LEADERBOARD_CATEGORIES = ['Shooting', 'Passing', 'Dribbling', 'Fitness', 'Tactical'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const INTENSITY_LEVELS = ['Low', 'Medium', 'High', 'Intense'] as const;

const TEAMMATE_NAMES: string[] = [
  'M. Silva', 'J. Rodriguez', 'A. Müller', 'L. Dubois', 'K. Tanaka',
  'R. Santos', 'D. Wilson', 'P. Bergkamp', 'S. Nakamura', 'C. Vieri',
  'F. De Jong', 'H. Son', 'N. Kante', 'B. Saka', 'V. Jr.',
  'O. Watkins', 'T. Partey', 'E. Haaland', 'M. Salah', 'K. Mbappé',
  'L. Messi', 'C. Ronaldo', 'R. Lewandowski', 'De Bruyne',
];

// ============================================================
// SVG Visualization Components
// ============================================================

function ShootingSVG({ value }: { value: number }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#30363d" strokeWidth="1" />
      <circle cx="40" cy="40" r="26" fill="none" stroke="#30363d" strokeWidth="1" />
      <circle cx="40" cy="40" r="16" fill="none" stroke="#30363d" strokeWidth="1" />
      <circle cx="40" cy="40" r="6" fill="#ef4444" opacity="0.8" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const hitR = 36 - (value / 100) * 20;
        const hx = 40 + hitR * Math.cos(rad);
        const hy = 40 + hitR * Math.sin(rad);
        return <circle key={angle} cx={hx} cy={hy} r="3" fill="#34d399" opacity="0.9" />;
      })}
    </svg>
  );
}

function PassingSVG({ value }: { value: number }) {
  const positions = [
    { x: 15, y: 20 }, { x: 35, y: 15 }, { x: 55, y: 20 },
    { x: 25, y: 40 }, { x: 45, y: 40 }, { x: 65, y: 40 },
    { x: 20, y: 60 }, { x: 40, y: 65 }, { x: 60, y: 60 },
  ];
  const activeCount = Math.floor((value / 100) * positions.length);
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      {positions.slice(0, -1).map((pos, i) => {
        const next = positions[i + 1];
        const active = i < activeCount;
        return (
          <line key={i} x1={pos.x} y1={pos.y} x2={next.x} y2={next.y}
            stroke={active ? '#3b82f6' : '#30363d'} strokeWidth="1.5" opacity={active ? 0.8 : 0.4} />
        );
      })}
      {positions.map((pos, i) => (
        <circle key={i} cx={pos.x} cy={pos.y} r={i < activeCount ? 5 : 4}
          fill={i < activeCount ? '#3b82f6' : '#30363d'} opacity={i < activeCount ? 0.9 : 0.5} />
      ))}
    </svg>
  );
}

function DribblingSVG({ value }: { value: number }) {
  const cones = [
    { x: 15, y: 35 }, { x: 30, y: 50 }, { x: 45, y: 30 },
    { x: 60, y: 50 }, { x: 70, y: 35 },
  ];
  const pathProgress = value / 100;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M 5 60 Q 15 35 30 50 Q 40 30 60 50 Q 70 35 75 45"
        fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4"
        strokeDasharray="4 3" />
      {cones.map((c, i) => {
        const active = i < Math.floor(pathProgress * cones.length);
        return (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="4" fill={active ? '#f59e0b' : '#30363d'} opacity={active ? 0.9 : 0.5} />
            <line x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y + 4}
              stroke={active ? '#fbbf24' : '#30363d'} strokeWidth="1" opacity={active ? 0.7 : 0.3} />
          </g>
        );
      })}
      <circle cx={10 + pathProgress * 55} cy={55 - pathProgress * 15} r="5"
        fill="#f59e0b" opacity="0.9" />
    </svg>
  );
}

function DefensiveSVG({ value }: { value: number }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="10" y="10" width="60" height="60" fill="none" stroke="#30363d" strokeWidth="1" rx="4" />
      <line x1="40" y1="10" x2="40" y2="70" stroke="#30363d" strokeWidth="0.5" opacity="0.5" />
      <line x1="10" y1="40" x2="70" y2="40" stroke="#30363d" strokeWidth="0.5" opacity="0.5" />
      {[25, 40, 55].map((x, i) => (
        <circle key={i} cx={x} cy={55 - (value / 100) * 10} r="5"
          fill="#a78bfa" opacity="0.8" />
      ))}
      <circle cx="40" cy={20 + (value / 100) * 10} r="4" fill="#ef4444" opacity="0.7" />
    </svg>
  );
}

function FreeKickSVG({ value }: { value: number }) {
  const hitY = 40 - (value / 100) * 20;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="50" y="15" width="24" height="50" fill="none" stroke="#8b949e" strokeWidth="1.5" rx="2" />
      <line x1="50" y1="25" x2="74" y2="25" stroke="#30363d" strokeWidth="0.5" />
      <line x1="50" y1="40" x2="74" y2="40" stroke="#30363d" strokeWidth="0.5" />
      <line x1="50" y1="55" x2="74" y2="55" stroke="#30363d" strokeWidth="0.5" />
      {[38, 43, 48].map((x) => (
        <rect key={x} x={x} y="32" width="4" height="16" fill="#8b949e" rx="1" opacity="0.6" />
      ))}
      <circle cx="28" cy="40" r="3" fill="#c9d1d9" opacity="0.8" />
      <path d={`M 28 40 Q 38 42 52 ${hitY}`} fill="none" stroke="#34d399" strokeWidth="1.5"
        strokeDasharray="3 2" opacity="0.8" />
      {value > 60 && <circle cx="62" cy={hitY} r="4" fill="#34d399" opacity="0.9" />}
    </svg>
  );
}

function FitnessSVG({ value }: { value: number }) {
  const stations = [
    { x: 20, y: 20 }, { x: 60, y: 20 },
    { x: 20, y: 50 }, { x: 60, y: 50 },
  ];
  const activeStations = Math.floor((value / 100) * stations.length);
  return (
    <svg viewBox="0 0 80 70" className="w-full h-full">
      {stations.map((s, i) => {
        const next = stations[(i + 1) % stations.length];
        const active = i < activeStations;
        return (
          <line key={`line-${i}`} x1={s.x} y1={s.y} x2={next.x} y2={next.y}
            stroke={active ? '#ef4444' : '#30363d'} strokeWidth="1" opacity={active ? 0.6 : 0.3} />
        );
      })}
      {stations.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={8} fill={i < activeStations ? '#ef4444' : '#21262d'}
            stroke={i < activeStations ? '#f87171' : '#30363d'} strokeWidth="1" opacity={i < activeStations ? 0.8 : 0.5} />
          {i < activeStations && (
            <polyline points={`${s.x - 3} ${s.y} ${s.x} ${s.y - 4} ${s.x + 3} ${s.y}`}
              fill="none" stroke="#c9d1d9" strokeWidth="1.5" />
          )}
        </g>
      ))}
    </svg>
  );
}

function TacticalSVG({ value }: { value: number }) {
  const players = [
    { x: 40, y: 60 }, { x: 25, y: 45 }, { x: 40, y: 42 }, { x: 55, y: 45 },
    { x: 15, y: 28 }, { x: 30, y: 25 }, { x: 50, y: 25 }, { x: 65, y: 28 },
    { x: 40, y: 15 },
  ];
  return (
    <svg viewBox="0 0 80 75" className="w-full h-full">
      <rect x="5" y="5" width="70" height="65" fill="none" stroke="#30363d" strokeWidth="1" rx="2" />
      <line x1="5" y1="40" x2="75" y2="40" stroke="#30363d" strokeWidth="0.5" opacity="0.4" />
      <circle cx="40" cy="37" r="8" fill="none" stroke="#30363d" strokeWidth="0.5" opacity="0.3" />
      {players.map((p, i) => {
        const spread = (value / 100) * 4;
        const dx = p.x > 40 ? spread : p.x < 40 ? -spread : 0;
        return (
          <circle key={i} cx={p.x + dx} cy={p.y} r="4"
            fill="#3b82f6" opacity="0.8" />
        );
      })}
      <text x="40" y="72" textAnchor="middle" fill="#8b949e" fontSize="5" opacity="0.5">4-3-3</text>
    </svg>
  );
}

function PenaltySVG({ value }: { value: number }) {
  const zones = [
    { x: 62, y: 25, label: 'TL' }, { x: 62, y: 40, label: 'TC' }, { x: 62, y: 55, label: 'TR' },
    { x: 52, y: 25, label: 'BL' }, { x: 52, y: 40, label: 'BC' }, { x: 52, y: 55, label: 'BR' },
  ];
  const hitZone = value > 80 ? 0 : value > 60 ? 1 : value > 40 ? 3 : value > 20 ? 4 : 5;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="45" y="15" width="28" height="50" fill="none" stroke="#8b949e" strokeWidth="1.5" rx="2" />
      {zones.map((z, i) => (
        <g key={i}>
          <rect x={z.x - 5} y={z.y - 10} width="10" height="20"
            fill={i === hitZone ? '#34d399' : '#21262d'} stroke="#30363d"
            strokeWidth="0.5" rx="1" opacity={i === hitZone ? 0.6 : 0.4} />
        </g>
      ))}
      <circle cx="20" cy="40" r="3" fill="#c9d1d9" opacity="0.8" />
      <circle cx={zones[hitZone].x} cy={zones[hitZone].y} r="3" fill="#34d399" opacity="0.9" />
    </svg>
  );
}

const DRILL_SVG_MAP: Record<DrillTypeId, React.FC<{ value: number }>> = {
  shooting: ShootingSVG,
  passing: PassingSVG,
  dribbling: DribblingSVG,
  defensive: DefensiveSVG,
  free_kick: FreeKickSVG,
  fitness: FitnessSVG,
  tactical: TacticalSVG,
  penalty: PenaltySVG,
};

// ============================================================
// Radar Chart Component
// ============================================================

interface RadarPoint {
  label: string;
  value: number;
  color: string;
}

function RadarChart({ data, size = 200 }: { data: RadarPoint[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const count = data.length;
  const angleStep = (2 * Math.PI) / count;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisPoints = data.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: cx + maxR * Math.cos(angle),
      y: cy + maxR * Math.sin(angle),
    };
  });

  const dataPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const polygonStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={axisPoints.map((p) => `${cx + (p.x - cx) * level},${cy + (p.y - cy) * level}`).join(' ')}
          fill="none" stroke="#30363d" strokeWidth="0.5" opacity="0.5"
        />
      ))}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#30363d" strokeWidth="0.5" opacity="0.3" />
      ))}
      <polygon
        points={polygonStr}
        fill="#34d399" fillOpacity="0.15"
        stroke="#34d399" strokeWidth="1.5" opacity="0.8"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={data[i].color} opacity="0.9" />
      ))}
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelR = maxR + 18;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="#8b949e" fontSize="9" fontWeight="500">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Progress Bar Component
// ============================================================

function ProgressBar({
  value, max, color, height = 8, showLabel = false,
}: {
  value: number; max: number; color: string; height?: number; showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-[#21262d] rounded-lg overflow-hidden" style={{ height }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-lg"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#8b949e] font-medium min-w-[36px] text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ============================================================
// Drill Card Component
// ============================================================

function DrillCard({
  drill, stats, difficulty, onDifficultyChange, onSelect, isActive,
}: {
  drill: DrillDefinition;
  stats: DrillStats;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onSelect: () => void;
  isActive: boolean;
}) {
  const SVGComponent = DRILL_SVG_MAP[drill.id];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`relative flex flex-col gap-2 p-3 rounded-xl border text-left transition-all w-full cursor-pointer ${
        isActive
          ? 'bg-[#21262d] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
      )}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${drill.color}15` }}>
          <span style={{ color: drill.color }}>{drill.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#c9d1d9] truncate">{drill.name}</h3>
          <p className="text-[10px] text-[#8b949e] truncate">{drill.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); onDifficultyChange(d); }}
            className={`px-2 py-0.5 text-[9px] font-medium rounded-lg capitalize transition-colors ${
              difficulty === d
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#21262d] text-[#8b949e] border border-transparent hover:border-[#30363d]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="h-16 rounded-lg bg-[#0d1117] overflow-hidden p-1">
        <SVGComponent value={stats.accuracy} />
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="flex flex-col items-center bg-[#0d1117] rounded-lg py-1 px-1">
          <span className="text-[#8b949e]">Acc</span>
          <span className="font-semibold text-[#c9d1d9]">{stats.accuracy}%</span>
        </div>
        <div className="flex flex-col items-center bg-[#0d1117] rounded-lg py-1 px-1">
          <span className="text-[#8b949e]">Goals</span>
          <span className="font-semibold text-[#c9d1d9]">{stats.goalsScored}</span>
        </div>
        <div className="flex flex-col items-center bg-[#0d1117] rounded-lg py-1 px-1">
          <span className="text-[#8b949e]">Rating</span>
          <span className="font-semibold" style={{ color: stats.rating >= 7 ? '#34d399' : stats.rating >= 5 ? '#f59e0b' : '#ef4444' }}>
            {stats.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Training Hub Header
// ============================================================

function TrainingHubHeader({
  fitness, energy, trainingFocus, drillsCompleted, trainingXP, xpToNext, facilitiesLevel,
}: {
  fitness: number;
  energy: number;
  trainingFocus: string;
  drillsCompleted: number;
  trainingXP: number;
  xpToNext: number;
  facilitiesLevel: number;
}) {
  return (
    <div className="space-y-3 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/15 rounded-lg">
            <Gamepad2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Training Ground</h1>
            <p className="text-[10px] text-[#8b949e]">Sharpen your skills</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] bg-[#21262d]">
          Lv. {Math.floor(trainingXP / xpToNext) + 1}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e]">Fitness</span>
            <span className="text-[10px] font-semibold text-[#c9d1d9]">{fitness}/100</span>
          </div>
          <ProgressBar value={fitness} max={100} color={fitness > 60 ? '#34d399' : fitness > 30 ? '#f59e0b' : '#ef4444'} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e]">Training XP</span>
            <span className="text-[10px] font-semibold text-[#c9d1d9]">{trainingXP % xpToNext}/{xpToNext}</span>
          </div>
          <ProgressBar value={trainingXP % xpToNext} max={xpToNext} color="#a78bfa" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8b949e]">Energy:</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-lg border ${
                  i < energy
                    ? 'bg-[#34d399] border-[#34d399]'
                    : 'bg-[#21262d] border-[#30363d]'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-4 w-px bg-[#30363d]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8b949e]">Focus:</span>
          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded-lg">
            {trainingFocus || 'None'}
          </Badge>
        </div>
        <div className="h-4 w-px bg-[#30363d]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8b949e]">Today:</span>
          <span className="text-[10px] font-semibold text-[#c9d1d9]">{drillsCompleted}/3</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#8b949e]">Facilities:</span>
        <ProgressBar value={facilitiesLevel} max={100} color="#3b82f6" height={6} showLabel />
      </div>
    </div>
  );
}

// ============================================================
// Active Drill View
// ============================================================

function ActiveDrillView({
  drill, difficulty, stats, drillResults, subTypeIndex, onSubTypeChange, onClose,
}: {
  drill: DrillDefinition;
  difficulty: Difficulty;
  stats: DrillStats;
  drillResults: DrillResult[];
  subTypeIndex: number;
  onSubTypeChange: (i: number) => void;
  onClose: () => void;
}) {
  const SVGComponent = DRILL_SVG_MAP[drill.id];
  const instructions: string[] = useMemo(() => {
    const base = [
      'Warm up with light stretches and jogging for 5 minutes',
      `Focus on the selected difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
    ];
    const specific: Record<DrillTypeId, string> = {
      shooting: 'Aim for corners of the goal, vary power on each shot',
      passing: 'Keep your head up, communicate with passing targets',
      dribbling: 'Use both feet, maintain close ball control at speed',
      defensive: 'Stay on your toes, anticipate the attacker\'s movement',
      free_kick: 'Practice different techniques: curl, power, and placement',
      fitness: 'Complete each station with proper form before moving on',
      tactical: 'Watch for space, maintain formation shape at all times',
      penalty: 'Decide placement before run-up, commit fully to your choice',
    };
    base.push(specific[drill.id]);
    return base;
  }, [drill.id, difficulty]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: drill.color }}>{drill.icon}</span>
          <h2 className="text-base font-bold text-[#c9d1d9]">{drill.name}</h2>
          <Badge variant="outline" className="text-[9px] rounded-lg border-[#30363d] text-[#8b949e] bg-[#21262d]">
            {difficulty}
          </Badge>
        </div>
        <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9] text-xs font-medium">
          Back
        </button>
      </div>

      <div className="flex items-center gap-2">
        {drill.subTypes.map((st, i) => (
          <button
            key={st.id}
            onClick={() => onSubTypeChange(i)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
              subTypeIndex === i
                ? 'text-[#c9d1d9] border'
                : 'text-[#8b949e] bg-[#21262d] border border-transparent hover:border-[#30363d]'
            }`}
            style={subTypeIndex === i ? { backgroundColor: `${drill.color}20`, borderColor: `${drill.color}40`, color: drill.color } : undefined}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="h-48 rounded-xl bg-[#0d1117] border border-[#21262d] p-2">
        <SVGComponent value={stats.accuracy} />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9]">Instructions</h3>
        {instructions.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-lg bg-[#21262d] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#8b949e]">{i + 1}</span>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0d1117] transition-colors"
          style={{ backgroundColor: drill.color }}>
          Start Drill
        </button>
        <button className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8b949e] bg-[#21262d] border border-[#30363d] hover:border-[#484f58] transition-colors">
          Adjust
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9]">Recent Results</h3>
        {drillResults.length > 0 ? (
          <div className="space-y-1.5">
            {drillResults.slice(0, 5).map((result) => (
              <div key={result.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d1117]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((star) => (
                      <Star key={star} className={`h-3 w-3 ${star <= result.stars ? 'text-[#f59e0b]' : 'text-[#30363d]'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8b949e]">Score: {result.score}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400">+{result.xpGained} XP</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#484f58] text-center py-4">No drills completed yet. Start your first one!</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Skill Progression Tracker
// ============================================================

function SkillProgressionTracker({
  attributes, fitness, morale, potential, trainingFocus,
}: {
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
  fitness: number;
  morale: number;
  potential: number;
  trainingFocus: string;
}) {
  const radarData: RadarPoint[] = useMemo(() => [
    { label: 'PAC', value: attributes.pace, color: '#3b82f6' },
    { label: 'SHO', value: attributes.shooting, color: '#ef4444' },
    { label: 'PAS', value: attributes.passing, color: '#34d399' },
    { label: 'DRI', value: attributes.dribbling, color: '#f59e0b' },
    { label: 'DEF', value: attributes.defending, color: '#a78bfa' },
    { label: 'PHY', value: attributes.physical, color: '#ef4444' },
    { label: 'FIT', value: fitness, color: '#3b82f6' },
    { label: 'MRL', value: morale, color: '#34d399' },
  ], [attributes, fitness, morale]);

  const recommendations = useMemo(() => {
    const allAttrs: { key: string; value: number; label: string }[] = [
      { key: 'pace', value: attributes.pace, label: 'Pace' },
      { key: 'shooting', value: attributes.shooting, label: 'Shooting' },
      { key: 'passing', value: attributes.passing, label: 'Passing' },
      { key: 'dribbling', value: attributes.dribbling, label: 'Dribbling' },
      { key: 'defending', value: attributes.defending, label: 'Defending' },
      { key: 'physical', value: attributes.physical, label: 'Physical' },
    ];
    return allAttrs.sort((a, b) => a.value - b.value).slice(0, 3);
  }, [attributes]);

  const weeklyPlan: WeeklyPlanDay[] = useMemo(() => {
    const drillTypes: DrillTypeId[] = ['shooting', 'passing', 'dribbling', 'defensive', 'free_kick', 'fitness', 'tactical'];
    return DAY_LABELS.map((day, i) => ({
      day,
      drill: drillTypes[i % drillTypes.length],
      completed: i < 3,
    }));
  }, []);

  const intensityLevel = useMemo(() => {
    const avg = (attributes.pace + attributes.shooting + attributes.passing + attributes.dribbling + attributes.defending + attributes.physical) / 6;
    if (avg < 50) return 0;
    if (avg < 65) return 1;
    if (avg < 80) return 2;
    return 3;
  }, [attributes]);

  const growthProjection = useMemo(() => {
    const focusBoost: Record<string, number> = {
      pace: 0, shooting: 2, passing: 1, dribbling: 1, defending: 0, physical: 1,
    };
    return [
      { label: 'Pace', current: attributes.pace, projected: Math.min(potential, attributes.pace + 1 + focusBoost.pace) },
      { label: 'Shooting', current: attributes.shooting, projected: Math.min(potential, attributes.shooting + 2 + focusBoost.shooting) },
      { label: 'Passing', current: attributes.passing, projected: Math.min(potential, attributes.passing + 1 + focusBoost.passing) },
      { label: 'Dribbling', current: attributes.dribbling, projected: Math.min(potential, attributes.dribbling + 2 + focusBoost.dribbling) },
      { label: 'Defending', current: attributes.defending, projected: Math.min(potential, attributes.defending + 1 + focusBoost.defending) },
      { label: 'Physical', current: attributes.physical, projected: Math.min(potential, attributes.physical + 1 + focusBoost.physical) },
    ];
  }, [attributes, potential]);

  const plateauWarnings = useMemo(() => {
    return growthProjection.filter((g) => g.projected - g.current <= 1 && g.current >= potential - 3);
  }, [growthProjection, potential]);

  return (
    <div className="space-y-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
      <h2 className="text-sm font-bold text-[#c9d1d9]">Skill Progression</h2>

      <div className="flex justify-center py-2">
        <div className="w-56 h-56">
          <RadarChart data={radarData} size={224} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          Recommended Training Focus
        </h3>
        {recommendations.map((rec) => (
          <div key={rec.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d1117]">
            <span className="text-[11px] text-[#8b949e]">{rec.label}</span>
            <div className="flex items-center gap-2">
              <ProgressBar value={rec.value} max={100} color="#34d399" height={5} />
              <span className="text-[10px] font-semibold text-[#c9d1d9] min-w-[24px] text-right">{rec.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9]">Weekly Training Plan</h3>
        <div className="grid grid-cols-7 gap-1">
          {weeklyPlan.map((day) => {
            const drillDef = DRILL_DEFINITIONS.find((d) => d.id === day.drill);
            return (
              <div key={day.day} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-[#8b949e] font-medium">{day.day}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  day.completed ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-[#21262d] border-[#30363d]'
                }`}>
                  {day.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px]" style={{ color: drillDef?.color }}>•</span>
                  )}
                </div>
                <span className="text-[7px] text-[#484f58] truncate w-full text-center">
                  {drillDef?.name.split(' ')[0] || ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9]">Training Intensity</h3>
        <div className="flex items-center gap-2">
          {INTENSITY_LEVELS.map((level, i) => (
            <div
              key={level}
              className={`flex-1 h-6 rounded-lg flex items-center justify-center text-[9px] font-medium border transition-colors ${
                i <= intensityLevel
                  ? 'border-emerald-500/30 text-emerald-400'
                  : 'border-[#30363d] text-[#484f58] bg-[#21262d]'
              }`}
              style={i <= intensityLevel ? { backgroundColor: `rgba(52, 211, 153, ${0.05 + i * 0.08})` } : undefined}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#c9d1d9]">4-Week Growth Projection</h3>
        <div className="space-y-1.5">
          {growthProjection.map((g) => {
            const growth = g.projected - g.current;
            const atCap = g.current >= potential - 1;
            return (
              <div key={g.label} className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e] w-14">{g.label}</span>
                <div className="flex-1 h-4 bg-[#0d1117] rounded-lg overflow-hidden relative">
                  <div className="h-full rounded-lg bg-[#21262d]" style={{ width: `${g.current}%` }} />
                  <div className="absolute top-0 left-0 h-full rounded-lg opacity-40"
                    style={{ width: `${g.projected}%`, backgroundColor: atCap ? '#8b949e' : '#34d399' }} />
                </div>
                <span className={`text-[10px] font-semibold min-w-[24px] text-right ${
                  atCap ? 'text-[#8b949e]' : 'text-emerald-400'
                }`}>
                  {growth > 0 ? `+${growth}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {plateauWarnings.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f59e0b] border border-[#f59e0b]/30">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-[#f59e0b]">Training Plateau Warning</p>
            <p className="text-[10px] text-[#8b949e]">
              {plateauWarnings.map((w) => w.label).join(', ')} approaching potential cap ({potential}). Focus on other areas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Training Leaderboard
// ============================================================

function TrainingLeaderboard({
  attributes, playerOverall,
}: {
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
  playerOverall: number;
}) {
  const leaderboardData = useMemo(() => {
    const categories: { key: string; label: string; playerScore: number }[] = [
      { key: 'shooting', label: 'Shooting', playerScore: attributes.shooting },
      { key: 'passing', label: 'Passing', playerScore: attributes.passing },
      { key: 'dribbling', label: 'Dribbling', playerScore: attributes.dribbling },
      { key: 'fitness', label: 'Fitness', playerScore: attributes.physical },
      { key: 'tactical', label: 'Tactical', playerScore: attributes.defending },
    ];

    return categories.map((cat) => {
      const teammates: LeaderboardEntry[] = TEAMMATE_NAMES.map((name, i) => ({
        rank: 0,
        name,
        score: Math.max(30, Math.min(99, cat.playerScore + ((i * 7 + 13) % 30) - 15 + Math.floor(playerOverall / 10) - 5)),
        isPlayer: false,
      }));
      teammates.push({ rank: 0, name: 'You', score: cat.playerScore, isPlayer: true });
      teammates.sort((a, b) => b.score - a.score);
      teammates.forEach((entry, idx) => { entry.rank = idx + 1; });
      const playerEntry = teammates.find((e) => e.isPlayer);
      return { category: cat.label, entries: teammates.slice(0, 10), playerRank: playerEntry?.rank ?? 25, isTop: (playerEntry?.rank ?? 25) === 1 };
    });
  }, [attributes, playerOverall]);

  return (
    <div className="space-y-4 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
      <h2 className="text-sm font-bold text-[#c9d1d9]">Training Leaderboard</h2>

      {leaderboardData.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#8b949e]">{cat.category}</h3>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#8b949e]">Your Rank:</span>
              <span className={`text-sm font-bold ${
                cat.isTop ? 'text-[#f59e0b]' : cat.playerRank <= 5 ? 'text-emerald-400' : 'text-[#c9d1d9]'
              }`}>
                #{cat.playerRank}
              </span>
              {cat.isTop && (
                <Trophy className="h-3.5 w-3.5 text-[#f59e0b]" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            {cat.entries.map((entry) => (
              <div
                key={entry.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                  entry.isPlayer ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#0d1117]'
                }`}
              >
                <span className={`text-[10px] font-bold w-5 text-center ${
                  entry.rank === 1 ? 'text-[#f59e0b]' : entry.rank === 2 ? 'text-[#8b949e]' : entry.rank === 3 ? 'text-[#b87333]' : 'text-[#484f58]'
                }`}>
                  {entry.rank}
                </span>
                <span className={`text-[11px] flex-1 truncate ${entry.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>
                  {entry.name}
                </span>
                <div className="w-20 h-2 bg-[#21262d] rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg ${entry.isPlayer ? 'bg-emerald-400' : 'bg-[#30363d]'}`}
                    style={{ width: `${entry.score}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold min-w-[20px] text-right ${entry.isPlayer ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Training Achievements
// ============================================================

function TrainingAchievements({ totalDrills, trainingHistoryLen }: { totalDrills: number; trainingHistoryLen: number }) {
  const achievements: TrainingAchievementDef[] = useMemo(() => {
    return [
      { id: 'sharpshooter', name: 'Sharpshooter', description: '100 shooting drills', icon: '🎯', target: 100, current: Math.min(totalDrills, 100), color: '#ef4444' },
      { id: 'pass_master', name: 'Pass Master', description: '100 passing drills', icon: '🎯', target: 100, current: Math.min(Math.floor(totalDrills * 0.8), 100), color: '#3b82f6' },
      { id: 'dribble_king', name: 'Dribble King', description: '100 dribbling drills', icon: '👑', target: 100, current: Math.min(Math.floor(totalDrills * 0.6), 100), color: '#f59e0b' },
      { id: 'iron_man', name: 'Iron Man', description: '50 fitness drills', icon: '🏋️', target: 50, current: Math.min(Math.floor(totalDrills * 0.5), 50), color: '#ef4444' },
      { id: 'tactician', name: 'Tactician', description: '50 tactical drills', icon: '🧠', target: 50, current: Math.min(Math.floor(totalDrills * 0.4), 50), color: '#3b82f6' },
      { id: 'dead_ball', name: 'Dead Ball Specialist', description: '50 FK drills', icon: '⚽', target: 50, current: Math.min(Math.floor(totalDrills * 0.35), 50), color: '#34d399' },
      { id: 'hat_trick', name: 'Hat Trick Hero', description: 'Score 3 in one session', icon: '🎩', target: 3, current: totalDrills >= 15 ? 3 : totalDrills >= 10 ? 2 : totalDrills >= 5 ? 1 : 0, color: '#f59e0b' },
      { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all daily drills', icon: '📅', target: 7, current: Math.min(trainingHistoryLen, 7), color: '#34d399' },
      { id: 'legend', name: 'Training Ground Legend', description: '500 total drills', icon: '🏆', target: 500, current: Math.min(totalDrills, 500), color: '#f59e0b' },
    ];
  }, [totalDrills, trainingHistoryLen]);

  return (
    <div className="space-y-3 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
      <h2 className="text-sm font-bold text-[#c9d1d9]">Training Achievements</h2>

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((ach) => {
          const completed = ach.current >= ach.target;
          const pct = Math.min(100, (ach.current / ach.target) * 100);
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`p-2.5 rounded-xl border text-center space-y-1.5 ${
                completed
                  ? 'border-[#f59e0b]/30 bg-[#f59e0b]/5'
                  : 'border-[#30363d] bg-[#0d1117]'
              }`}
            >
              <span className="text-xl">{ach.icon}</span>
              <p className="text-[10px] font-semibold text-[#c9d1d9] leading-tight">{ach.name}</p>
              <div className="w-full h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                <div className="h-full rounded-lg transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: ach.color }} />
              </div>
              <p className="text-[9px] text-[#8b949e]">
                {ach.current}/{ach.target}
              </p>
              {completed && (
                <div className="flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3 text-[#f59e0b]" />
                  <span className="text-[8px] font-bold text-[#f59e0b]">DONE</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TrainingDrillMiniGames() {
  const gameState = useGameStore((s) => s.gameState);

  const [selectedDrill, setSelectedDrill] = useState<DrillTypeId | null>(null);
  const [difficulties, setDifficulties] = useState<Record<DrillTypeId, Difficulty>>({
    shooting: 'medium', passing: 'medium', dribbling: 'medium', defensive: 'medium',
    free_kick: 'medium', fitness: 'medium', tactical: 'medium', penalty: 'medium',
  });
  const [subTypeIndices, setSubTypeIndices] = useState<Record<DrillTypeId, number>>({
    shooting: 0, passing: 0, dribbling: 0, defensive: 0,
    free_kick: 0, fitness: 0, tactical: 0, penalty: 0,
  });
  const [activeTab, setActiveTab] = useState('drills');

  const handleDifficultyChange = useCallback((drillId: DrillTypeId, difficulty: Difficulty) => {
    setDifficulties((prev) => ({ ...prev, [drillId]: difficulty }));
  }, []);

  const handleSubTypeChange = useCallback((drillId: DrillTypeId, index: number) => {
    setSubTypeIndices((prev) => ({ ...prev, [drillId]: index }));
  }, []);

  const drillStats = useMemo((): Record<DrillTypeId, DrillStats> => {
    if (!gameState) {
      const empty = { accuracy: 0, goalsScored: 0, rating: 0 };
      return {
        shooting: empty, passing: empty, dribbling: empty, defensive: empty,
        free_kick: empty, fitness: empty, tactical: empty, penalty: empty,
      };
    }
    const { player, trainingHistory, currentWeek, currentSeason } = gameState;
    const attrMap: Record<DrillTypeId, number> = {
      shooting: player.attributes.shooting,
      passing: player.attributes.passing,
      dribbling: player.attributes.dribbling,
      defensive: player.attributes.defending,
      free_kick: player.attributes.shooting,
      fitness: player.attributes.physical,
      tactical: Math.round((player.attributes.defending + player.attributes.passing) / 2),
      penalty: player.attributes.shooting,
    };

    const statsMap: Record<DrillTypeId, DrillStats> = {} as Record<DrillTypeId, DrillStats>;
    const drillIds: DrillTypeId[] = ['shooting', 'passing', 'dribbling', 'defensive', 'free_kick', 'fitness', 'tactical', 'penalty'];
    drillIds.forEach((id) => {
      const baseAttr = attrMap[id];
      const seed = currentWeek * 7 + currentSeason * 13 + baseAttr;
      const typeIdx = drillIds.indexOf(id);
      const completed = trainingHistory.filter((_, i) => (i + seed) % 8 === typeIdx).length;
      const accuracy = Math.min(99, baseAttr + Math.floor((completed * 3 + seed) % 15));
      const goalsScored = Math.max(0, Math.floor(completed * (baseAttr / 50) * 0.6 + (seed % 5)));
      const rating = Math.min(10, Math.max(1, (baseAttr / 10) + (completed % 3) * 0.3 + ((seed % 10) / 10)));
      statsMap[id] = { accuracy, goalsScored, rating: parseFloat(rating.toFixed(1)) };
    });
    return statsMap;
  }, [gameState]);

  const drillResults = useMemo((): Record<DrillTypeId, DrillResult[]> => {
    if (!gameState) {
      const empty: DrillResult[] = [];
      return {
        shooting: empty, passing: empty, dribbling: empty, defensive: empty,
        free_kick: empty, fitness: empty, tactical: empty, penalty: empty,
      };
    }
    const { currentWeek, currentSeason, trainingHistory } = gameState;
    const results: Record<DrillTypeId, DrillResult[]> = {
      shooting: [], passing: [], dribbling: [], defensive: [],
      free_kick: [], fitness: [], tactical: [], penalty: [],
    };
    const drillIds: DrillTypeId[] = ['shooting', 'passing', 'dribbling', 'defensive', 'free_kick', 'fitness', 'tactical', 'penalty'];

    trainingHistory.forEach((session, i) => {
      const drillId = drillIds[i % 8];
      const score = 40 + ((currentWeek + i * 3 + currentSeason * 5) % 60);
      const stars = score > 85 ? 3 : score > 60 ? 2 : 1;
      results[drillId].push({
        id: `drill-${drillId}-${i}`,
        drillType: drillId,
        score,
        stars,
        xpGained: stars * 15 + Math.floor(score / 10),
        completedAt: session.completedAt,
      });
    });

    return results;
  }, [gameState]);

  const headerData = useMemo(() => {
    if (!gameState) {
      return { fitness: 0, energy: 3, trainingFocus: 'None', drillsCompleted: 0, trainingXP: 0, xpToNext: 500, facilitiesLevel: 0 };
    }
    const { player, trainingHistory, seasonTrainingFocus, currentWeek, currentClub, trainingAvailable } = gameState;
    const totalDrills = trainingHistory.length;
    const trainingXP = totalDrills * 25 + Math.floor(player.overall * 1.5);
    const xpToNext = 500;
    const drillsToday = Math.min(3, Math.floor((currentWeek + totalDrills) % 4));

    return {
      fitness: player.fitness,
      energy: trainingAvailable,
      trainingFocus: seasonTrainingFocus?.area ?? 'None',
      drillsCompleted: drillsToday,
      trainingXP,
      xpToNext,
      facilitiesLevel: currentClub.facilities,
    };
  }, [gameState]);

  const totalDrillsCount = useMemo(() => {
    if (!gameState) return 0;
    return gameState.trainingHistory.length;
  }, [gameState]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[#8b949e]">No active career. Start a new game to access training.</p>
      </div>
    );
  }

  const { player, currentClub } = gameState;
  const activeDrillDef = selectedDrill ? DRILL_DEFINITIONS.find((d) => d.id === selectedDrill) ?? null : null;

  return (
    <div className="max-w-lg mx-auto space-y-4 p-4 pb-24">
      <TrainingHubHeader
        fitness={headerData.fitness}
        energy={headerData.energy}
        trainingFocus={headerData.trainingFocus}
        drillsCompleted={headerData.drillsCompleted}
        trainingXP={headerData.trainingXP}
        xpToNext={headerData.xpToNext}
        facilitiesLevel={headerData.facilitiesLevel}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#161b22] border border-[#30363d] rounded-xl w-full">
          <TabsTrigger value="drills" className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Drills
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Progression
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Awards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drills" className="space-y-4 mt-4">
          {selectedDrill && activeDrillDef ? (
            <ActiveDrillView
              drill={activeDrillDef}
              difficulty={difficulties[selectedDrill]}
              stats={drillStats[selectedDrill]}
              drillResults={drillResults[selectedDrill]}
              subTypeIndex={subTypeIndices[selectedDrill]}
              onSubTypeChange={(i) => handleSubTypeChange(selectedDrill, i)}
              onClose={() => setSelectedDrill(null)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {DRILL_DEFINITIONS.map((drill) => (
                <DrillCard
                  key={drill.id}
                  drill={drill}
                  stats={drillStats[drill.id]}
                  difficulty={difficulties[drill.id]}
                  onDifficultyChange={(d) => handleDifficultyChange(drill.id, d)}
                  onSelect={() => setSelectedDrill(drill.id)}
                  isActive={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progression" className="mt-4">
          <SkillProgressionTracker
            attributes={player.attributes}
            fitness={player.fitness}
            morale={player.morale}
            potential={player.potential}
            trainingFocus={headerData.trainingFocus}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <TrainingLeaderboard
            attributes={player.attributes}
            playerOverall={player.overall}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <TrainingAchievements
            totalDrills={totalDrillsCount}
            trainingHistoryLen={Math.min(gameState.trainingHistory.length, 7)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
