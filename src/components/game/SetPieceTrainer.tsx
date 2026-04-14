'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Target, Crosshair, CircleDot, Zap, TrendingUp, Award,
  BarChart3, Wind, Shield, Flag, Compass, Timer,
  ChevronRight, RefreshCw, Play, Pause, RotateCcw, Trophy,
} from 'lucide-react';
import type { Player, Club } from '@/lib/game/types';

// ============================================================
// Type Definitions
// ============================================================

interface FreeKickPosition {
  id: string;
  label: string;
  distance: number;
  angle: number;
  difficulty: string;
}

interface FreeKickTechnique {
  id: string;
  name: string;
  description: string;
  successRate: number;
  icon: React.ReactNode;
  color: string;
}

interface FreeKickAttempt {
  id: number;
  technique: string;
  position: string;
  result: 'goal' | 'saved' | 'wide' | 'post' | 'blocked';
  minute: number;
}

interface WindCondition {
  speed: number;
  direction: 'none' | 'left' | 'right' | 'headwind' | 'tailwind';
  strength: number;
}

interface PenaltyAttempt {
  id: number;
  round: number;
  placement: string;
  result: 'scored' | 'saved' | 'missed';
  keeperDive: 'left' | 'center' | 'right';
  composure: number;
}

interface CornerRoutine {
  id: string;
  name: string;
  type: 'near_post' | 'far_post' | 'short' | 'driven' | 'flick_on' | 'zonal';
  taker: string;
  receiver: string;
  deliveryQuality: number;
  successRate: number;
  description: string;
  color: string;
}

interface SetPieceAnalytics {
  rating: number;
  seasonGoals: number;
  seasonAssists: number;
  seasonCorners: number;
  seasonFreeKicks: number;
  seasonPenalties: number;
  seasonThrowIns: number;
}

interface MatchSetPieceLog {
  id: number;
  opponent: string;
  competition: string;
  setPieceGoals: number;
  setPieceAssists: number;
  rating: number;
}

// ============================================================
// Static Data: Free Kick Positions
// ============================================================

const FREE_KICK_POSITIONS: FreeKickPosition[] = [
  { id: 'fk-20m-center', label: '20m Center', distance: 20, angle: 0, difficulty: 'Medium' },
  { id: 'fk-20m-left', label: '20m Left', distance: 20, angle: -25, difficulty: 'Hard' },
  { id: 'fk-20m-right', label: '20m Right', distance: 20, angle: 25, difficulty: 'Hard' },
  { id: 'fk-25m-center', label: '25m Center', distance: 25, angle: 0, difficulty: 'Medium' },
  { id: 'fk-25m-left', label: '25m Left', distance: 25, angle: -20, difficulty: 'Hard' },
  { id: 'fk-30m-center', label: '30m Center', distance: 30, angle: 0, difficulty: 'Expert' },
];

const FREE_KICK_TECHNIQUES: FreeKickTechnique[] = [
  {
    id: 'knuckleball',
    name: 'Knuckleball',
    description: 'Unpredictable ball movement with minimal spin. Difficult to control but hard to save.',
    successRate: 18,
    icon: <CircleDot className="h-4 w-4" />,
    color: '#ef4444',
  },
  {
    id: 'curl',
    name: 'Curl',
    description: 'Curving shot that bends around the wall into the far corner. Reliable and accurate.',
    successRate: 24,
    icon: <Compass className="h-4 w-4" />,
    color: '#3b82f6',
  },
  {
    id: 'power',
    name: 'Power Strike',
    description: 'Blistering low-driven shot aimed through gaps in the wall. Raw power beats the keeper.',
    successRate: 21,
    icon: <Zap className="h-4 w-4" />,
    color: '#f59e0b',
  },
  {
    id: 'dip',
    name: 'Topspin Dip',
    description: 'Lofted over the wall with heavy backspin to dip under the crossbar. Precision required.',
    successRate: 22,
    icon: <Target className="h-4 w-4" />,
    color: '#10b981',
  },
];

// ============================================================
// Static Data: Corner Routines
// ============================================================

const CORNER_ROUTINES: CornerRoutine[] = [
  {
    id: 'corner-near',
    name: 'Near Post',
    type: 'near_post',
    taker: 'Player',
    receiver: 'Target Man',
    deliveryQuality: 85,
    successRate: 32,
    description: 'Inswinging delivery to the near post for a flick-on or header.',
    color: '#10b981',
  },
  {
    id: 'corner-far',
    name: 'Far Post',
    type: 'far_post',
    taker: 'Player',
    receiver: 'Attacker',
    deliveryQuality: 78,
    successRate: 28,
    description: 'Outswinging delivery to the far post area for a towering header.',
    color: '#3b82f6',
  },
  {
    id: 'corner-short',
    name: 'Short Corner',
    type: 'short',
    taker: 'Player',
    receiver: 'Midfielder',
    deliveryQuality: 90,
    successRate: 22,
    description: 'Quick short pass to retain possession and create a better angle.',
    color: '#f59e0b',
  },
  {
    id: 'corner-driven',
    name: 'Driven Low',
    type: 'driven',
    taker: 'Player',
    receiver: 'Runner',
    deliveryQuality: 72,
    successRate: 26,
    description: 'Low driven corner at pace to the edge of the six-yard box.',
    color: '#ef4444',
  },
  {
    id: 'corner-flick',
    name: 'Flick-On',
    type: 'flick_on',
    taker: 'Player',
    receiver: 'Poacher',
    deliveryQuality: 80,
    successRate: 30,
    description: 'Near post flick deflects the ball into a dangerous area.',
    color: '#8b5cf6',
  },
  {
    id: 'corner-zonal',
    name: 'Zonal Mark',
    type: 'zonal',
    taker: 'Player',
    receiver: 'Zonal Runner',
    deliveryQuality: 82,
    successRate: 35,
    description: 'Zone overload in the six-yard box with timed runs.',
    color: '#ec4899',
  },
];

// ============================================================
// Tab Configuration
// ============================================================

const TAB_CONFIG = [
  { id: 0, label: 'Free Kicks', icon: <Target className="h-4 w-4" /> },
  { id: 1, label: 'Penalties', icon: <Crosshair className="h-4 w-4" /> },
  { id: 2, label: 'Corners', icon: <Flag className="h-4 w-4" /> },
  { id: 3, label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

// ============================================================
// SVG Helper: Circular Progress Ring
// ============================================================

function CircularProgressRing({
  value,
  size,
  strokeWidth,
  color,
  bgColor,
}: {
  value: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor: string;
}): React.JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * Math.max(radius, 1);
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={Math.max(radius, 1)}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={Math.max(radius, 1)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference.toFixed(2)}
        strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round"
        strokeOpacity={0.9}
      />
      <text
        x={center}
        y={center + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {value}%
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper: Semi-Circular Gauge
// ============================================================

function SemiCircleGauge({
  value,
  size,
  color,
  label,
}: {
  value: number;
  size: number;
  color: string;
  label: string;
}): React.JSX.Element {
  const center = size / 2;
  const radius = Math.max(size / 2 - 12, 1);
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const valueAngle = startAngle + (value / 100) * Math.PI;

  const arcPath = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`;
  const valueArcEndX = center + radius * Math.cos(valueAngle);
  const valueArcEndY = center + radius * Math.sin(valueAngle);
  const largeArc = value > 50 ? 1 : 0;
  const valuePath = `M ${center - radius} ${center} A ${radius} ${radius} 0 ${largeArc} 1 ${valueArcEndX.toFixed(1)} ${valueArcEndY.toFixed(1)}`;

  return (
    <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
      <path d={arcPath} fill="none" stroke="#30363d" strokeWidth={10} strokeLinecap="round" />
      <path d={valuePath} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeOpacity={0.9} />
      <text
        x={center}
        y={center - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={20}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {value}
      </text>
      <text
        x={center}
        y={center + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#8b949e"
        fontSize={10}
      >
        {label}
      </text>
    </svg>
  );
}

// ============================================================
// Sub-component: Tab 1 - Free Kick Practice
// ============================================================

function FreeKickPracticeTab(): React.JSX.Element {
  const [selectedPosition, setSelectedPosition] = useState(0);
  const [selectedTechnique, setSelectedTechnique] = useState(0);
  const [attempts, setAttempts] = useState<FreeKickAttempt[]>([
    { id: 1, technique: 'curl', position: 'fk-20m-center', result: 'goal', minute: 12 },
    { id: 2, technique: 'power', position: 'fk-25m-center', result: 'wide', minute: 23 },
    { id: 3, technique: 'dip', position: 'fk-20m-left', result: 'saved', minute: 34 },
    { id: 4, technique: 'knuckleball', position: 'fk-25m-left', result: 'post', minute: 45 },
    { id: 5, technique: 'curl', position: 'fk-20m-center', result: 'goal', minute: 56 },
  ]);
  const [wind, setWind] = useState<WindCondition>({ speed: 12, direction: 'right', strength: 2 });
  const [wallHeight, setWallHeight] = useState(3);

  const currentAttemptCount = attempts.length;

  const heatmapData = useMemo(() => {
    const grid: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    return attempts.reduce<number[][]>((acc, attempt) => {
      const col = attempt.id % 3;
      const row = Math.floor((attempt.id - 1) % 3);
      const safeRow = Math.max(0, Math.min(row, 2));
      const safeCol = Math.max(0, Math.min(col, 2));
      const newGrid = acc.map((r) => [...r]);
      newGrid[safeRow][safeCol] += attempt.result === 'goal' ? 3 : 1;
      return newGrid;
    }, grid);
  }, [attempts]);

  const successCount = attempts.reduce<number>((acc, a) => {
    return acc + (a.result === 'goal' ? 1 : 0);
  }, 0);
  const successRate = currentAttemptCount > 0 ? Math.round((successCount / currentAttemptCount) * 100) : 0;

  const techniqueStats = useMemo(() => {
    return FREE_KICK_TECHNIQUES.reduce<Record<string, { total: number; goals: number }>>((acc, tech) => {
      const matching = attempts.filter((a) => a.technique === tech.id);
      return {
        ...acc,
        [tech.id]: {
          total: matching.length,
          goals: matching.filter((a) => a.result === 'goal').length,
        },
      };
    }, {});
  }, [attempts]);

  const handleTakeShot = useCallback(() => {
    const pos = FREE_KICK_POSITIONS[selectedPosition];
    const tech = FREE_KICK_TECHNIQUES[selectedTechnique];
    const difficultyMod = pos.distance > 25 ? -5 : pos.distance < 20 ? 5 : 0;
    const windMod = wind.direction === 'headwind' ? -8 : wind.direction === 'tailwind' ? 3 : wind.direction === 'left' || wind.direction === 'right' ? -4 : 0;
    const adjustedRate = Math.max(5, Math.min(80, tech.successRate + difficultyMod + windMod));
    const roll = Math.random() * 100;
    const result: FreeKickAttempt['result'] = roll < adjustedRate * 0.6 ? 'goal' : roll < adjustedRate * 0.85 ? 'saved' : roll < adjustedRate ? 'post' : 'wide';
    const newAttempt: FreeKickAttempt = {
      id: currentAttemptCount + 1,
      technique: tech.id,
      position: pos.id,
      result,
      minute: Math.floor(Math.random() * 90) + 1,
    };
    setAttempts((prev) => [...prev.slice(-4), newAttempt]);
  }, [selectedPosition, selectedTechnique, wind, currentAttemptCount]);

  const handleRandomizeWind = useCallback(() => {
    const directions: WindCondition['direction'][] = ['none', 'left', 'right', 'headwind', 'tailwind'];
    setWind({
      speed: Math.floor(Math.random() * 30) + 5,
      direction: directions[Math.floor(Math.random() * directions.length)],
      strength: Math.floor(Math.random() * 4) + 1,
    });
  }, []);

  const handleResetWall = useCallback(() => {
    setWallHeight(3);
  }, []);

  const getHeatmapColor = (val: number): string => {
    if (val >= 6) return '#ef4444';
    if (val >= 4) return '#f59e0b';
    if (val >= 2) return '#3b82f6';
    return '#21262d';
  };

  const getHeatmapOpacity = (val: number): number => {
    if (val >= 6) return 0.9;
    if (val >= 4) return 0.7;
    if (val >= 2) return 0.5;
    return 0.3;
  };

  const getResultColor = (result: FreeKickAttempt['result']): string => {
    switch (result) {
      case 'goal': return '#10b981';
      case 'saved': return '#f59e0b';
      case 'post': return '#f97316';
      default: return '#ef4444';
    }
  };

  const getResultLabel = (result: FreeKickAttempt['result']): string => {
    switch (result) {
      case 'goal': return 'GOAL';
      case 'saved': return 'SAVED';
      case 'post': return 'POST';
      case 'blocked': return 'BLOCKED';
      default: return 'WIDE';
    }
  };

  return (
    <div className="space-y-3">
      {/* Position Selector */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Free Kick Position</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {FREE_KICK_POSITIONS.map((pos, i) => (
            <button
              key={pos.id}
              onClick={() => setSelectedPosition(i)}
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                selectedPosition === i
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {pos.label}
              <span className="block text-[10px] opacity-60 mt-0.5">{pos.difficulty}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Technique Cards */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Technique</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FREE_KICK_TECHNIQUES.map((tech, i) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTechnique(i)}
              className={`p-2.5 rounded-lg text-left transition-colors border ${
                selectedTechnique === i
                  ? 'bg-[#21262d] border-emerald-500/40'
                  : 'bg-[#0d1117] border-[#30363d] hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                >
                  {tech.icon}
                </div>
                <span className="text-sm font-semibold text-[#c9d1d9]">{tech.name}</span>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-tight">{tech.description}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[10px] font-bold" style={{ color: tech.color }}>
                  {techniqueStats[tech.id]?.total ?? 0} taken
                </span>
                <span className="text-[10px] text-[#484f58]">|</span>
                <span className="text-[10px] font-bold" style={{ color: tech.color }}>
                  {techniqueStats[tech.id]?.goals ?? 0} goals
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Wind & Wall Height */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Wind</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#c9d1d9]">{wind.speed} km/h</span>
            <span className="text-xs text-sky-400">{wind.direction}</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleRandomizeWind}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] text-[10px] text-sky-400 border border-[#30363d] hover:border-sky-500/40 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Randomize
            </button>
          </div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Wall</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#c9d1d9]">{wallHeight} players</span>
            <span className="text-xs text-amber-400">
              {wallHeight >= 4 ? 'Tall wall' : wallHeight >= 3 ? 'Standard' : 'Gap in wall'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleResetWall}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] text-[10px] text-amber-400 border border-[#30363d] hover:border-amber-500/40 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Take Shot Button */}
      <button
        onClick={handleTakeShot}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
      >
        <Play className="h-4 w-4" />
        Take Free Kick
      </button>

      {/* Recent Attempts */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Recent Attempts</span>
          <span className="ml-auto text-xs font-bold text-emerald-400">{successRate}% success</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {attempts.slice(-5).map((attempt) => (
            <div
              key={attempt.id}
              className="shrink-0 w-16 p-1.5 rounded-md border text-center"
              style={{
                backgroundColor: `${getResultColor(attempt.result)}10`,
                borderColor: `${getResultColor(attempt.result)}30`,
              }}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: getResultColor(attempt.result) }}
              >
                {getResultLabel(attempt.result)}
              </span>
              <span className="block text-[9px] text-[#8b949e] mt-0.5">{attempt.minute}&apos;</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Goal Zone Heatmap */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Shot Placement Heatmap</span>
        <div className="flex justify-center mt-2">
          <svg width="200" height="140" viewBox="0 0 200 140" style={{ width: '100%', maxWidth: 200 }}>
            {/* Goal frame */}
            <rect x="20" y="10" width="160" height="100" fill="none" stroke="#484f58" strokeWidth={2} rx={2} />
            {/* 3x3 grid heatmap */}
            {heatmapData.map((row, ri) =>
              row.map((val, ci) => (
                <rect
                  key={`${ri}-${ci}`}
                  x={20 + ci * (160 / 3)}
                  y={10 + ri * (100 / 3)}
                  width={160 / 3}
                  height={100 / 3}
                  fill={getHeatmapColor(val)}
                  fillOpacity={getHeatmapOpacity(val)}
                  stroke="#30363d"
                  strokeWidth={0.5}
                />
              ))
            )}
            {/* Crossbar */}
            <line x1="20" y1="10" x2="180" y2="10" stroke="#c9d1d9" strokeWidth={3} />
            {/* Posts */}
            <line x1="20" y1="10" x2="20" y2="110" stroke="#c9d1d9" strokeWidth={3} />
            <line x1="180" y1="10" x2="180" y2="110" stroke="#c9d1d9" strokeWidth={3} />
            {/* Net lines */}
            {[30, 60, 90, 120, 150].map((xPos) => (
              <line key={`net-${xPos}`} x1={xPos} y1="10" x2={xPos} y2="110" stroke="#30363d" strokeWidth={0.3} strokeOpacity={0.4} />
            ))}
            {[25, 45, 65, 85].map((yPos) => (
              <line key={`net-${yPos}`} x1="20" y1={yPos} x2="180" y2={yPos} stroke="#30363d" strokeWidth={0.3} strokeOpacity={0.4} />
            ))}
          </svg>
        </div>
      </div>

      {/* SVG Free Kick Success Ring + Technique Bars */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-2">Success Rate</span>
          <CircularProgressRing value={successRate} size={100} strokeWidth={8} color="#10b981" bgColor="#21262d" />
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Technique Effectiveness</span>
          <div className="flex flex-col gap-2 mt-2">
            {FREE_KICK_TECHNIQUES.map((tech) => {
              const stats = techniqueStats[tech.id];
              const techTotal = stats?.total ?? 0;
              const techGoals = stats?.goals ?? 0;
              const rate = techTotal > 0 ? Math.round((techGoals / techTotal) * 100) : tech.successRate;
              return (
                <div key={tech.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#8b949e]">{tech.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: tech.color }}>{rate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-300"
                      style={{ width: `${rate}%`, backgroundColor: tech.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG Distance Accuracy Scatter */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Distance vs Accuracy</span>
        <div className="flex justify-center mt-2">
          <svg width="260" height="160" viewBox="0 0 260 160" style={{ width: '100%', maxWidth: 260 }}>
            {/* Axes */}
            <line x1="30" y1="10" x2="30" y2="130" stroke="#30363d" strokeWidth={1} />
            <line x1="30" y1="130" x2="250" y2="130" stroke="#30363d" strokeWidth={1} />
            {/* Y-axis labels */}
            <text x="25" y="15" textAnchor="end" fill="#8b949e" fontSize={8}>100%</text>
            <text x="25" y="45" textAnchor="end" fill="#8b949e" fontSize={8}>75%</text>
            <text x="25" y="75" textAnchor="end" fill="#8b949e" fontSize={8}>50%</text>
            <text x="25" y="105" textAnchor="end" fill="#8b949e" fontSize={8}>25%</text>
            <text x="25" y="133" textAnchor="end" fill="#8b949e" fontSize={8}>0%</text>
            {/* X-axis labels */}
            <text x="50" y="145" textAnchor="middle" fill="#8b949e" fontSize={8}>20m</text>
            <text x="110" y="145" textAnchor="middle" fill="#8b949e" fontSize={8}>25m</text>
            <text x="170" y="145" textAnchor="middle" fill="#8b949e" fontSize={8}>30m</text>
            <text x="230" y="145" textAnchor="middle" fill="#8b949e" fontSize={8}>35m</text>
            {/* Grid lines */}
            {[40, 70, 100, 130].map((yVal) => (
              <line key={`grid-${yVal}`} x1="30" y1={yVal} x2="250" y2={yVal} stroke="#21262d" strokeWidth={0.5} strokeOpacity={0.5} />
            ))}
            {/* Scatter points */}
            {attempts.map((att) => {
              const pos = FREE_KICK_POSITIONS.find((p) => p.id === att.position);
              const dist = pos?.distance ?? 20;
              const isGoal = att.result === 'goal';
              const accuracy = isGoal ? 70 + Math.random() * 30 : 15 + Math.random() * 50;
              const x = 30 + ((dist - 18) / 20) * 220;
              const y = 130 - (accuracy / 100) * 120;
              return (
                <circle
                  key={att.id}
                  cx={Math.min(245, Math.max(35, x))}
                  cy={Math.max(15, Math.min(125, y))}
                  r={4}
                  fill={isGoal ? '#10b981' : '#ef4444'}
                  fillOpacity={0.8}
                  stroke="#0d1117"
                  strokeWidth={1}
                />
              );
            })}
            {/* Legend */}
            <circle cx="160" cy="8" r={3} fill="#10b981" fillOpacity={0.8} />
            <text x="167" y="11" fill="#8b949e" fontSize={7}>Goal</text>
            <circle cx="200" cy="8" r={3} fill="#ef4444" fillOpacity={0.8} />
            <text x="207" y="11" fill="#8b949e" fontSize={7}>Miss</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: Tab 2 - Penalty Training
// ============================================================

function PenaltyTrainingTab(): React.JSX.Element {
  const [penaltyAttempts, setPenaltyAttempts] = useState<PenaltyAttempt[]>([
    { id: 1, round: 1, placement: 'bottom-left', result: 'scored', keeperDive: 'right', composure: 82 },
    { id: 2, round: 1, placement: 'top-right', result: 'scored', keeperDive: 'left', composure: 78 },
    { id: 3, round: 2, placement: 'center', result: 'saved', keeperDive: 'center', composure: 45 },
    { id: 4, round: 2, placement: 'bottom-right', result: 'scored', keeperDive: 'left', composure: 88 },
    { id: 5, round: 3, placement: 'top-left', result: 'scored', keeperDive: 'right', composure: 91 },
    { id: 6, round: 3, placement: 'bottom-center', result: 'scored', keeperDive: 'left', composure: 75 },
    { id: 7, round: 4, placement: 'top-center', result: 'missed', keeperDive: 'center', composure: 30 },
    { id: 8, round: 4, placement: 'bottom-right', result: 'scored', keeperDive: 'left', composure: 85 },
    { id: 9, round: 5, placement: 'top-left', result: 'scored', keeperDive: 'right', composure: 90 },
    { id: 10, round: 5, placement: 'bottom-left', result: 'scored', keeperDive: 'right', composure: 72 },
  ]);
  const [composure, setComposure] = useState(75);
  const [shootoutActive, setShootoutActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [keeperTendency, setKeeperTendency] = useState<'left' | 'center' | 'right'>('center');

  const recentPenalties = penaltyAttempts.slice(-10);

  const scoredCount = recentPenalties.reduce<number>((acc, p) => {
    return acc + (p.result === 'scored' ? 1 : 0);
  }, 0);
  const savedCount = recentPenalties.reduce<number>((acc, p) => {
    return acc + (p.result === 'saved' ? 1 : 0);
  }, 0);
  const penaltySuccessRate = recentPenalties.length > 0 ? Math.round((scoredCount / recentPenalties.length) * 100) : 0;

  const placementGrid = useMemo(() => {
    const zones: Record<string, number> = {
      'top-left': 0, 'top-center': 0, 'top-right': 0,
      'mid-left': 0, 'mid-center': 0, 'mid-right': 0,
      'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0,
    };
    return recentPenalties.reduce<Record<string, number>>((acc, p) => {
      const newZones = { ...acc };
      if (newZones[p.placement] !== undefined) {
        newZones[p.placement] += 1;
      }
      return newZones;
    }, zones);
  }, [recentPenalties]);

  const maxPlacementVal = Math.max(...Object.values(placementGrid), 1);

  const handleTakePenalty = useCallback(() => {
    const placements = ['top-left', 'top-center', 'top-right', 'mid-left', 'mid-center', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    const dives: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

    const selectedPlacement = placements[Math.floor(Math.random() * placements.length)];
    const diveGuess = keeperTendency === 'center'
      ? dives[Math.floor(Math.random() * 3)]
      : Math.random() < 0.65
        ? keeperTendency
        : dives[Math.floor(Math.random() * 3)];

    const composureBonus = (composure - 50) / 100 * 20;
    const baseRate = 75 + composureBonus;
    const isSameDirection = selectedPlacement.includes(diveGuess) || (selectedPlacement.includes('center') && diveGuess === 'center');
    const adjustedRate = isSameDirection ? baseRate - 40 : baseRate;

    const roll = Math.random() * 100;
    const result: PenaltyAttempt['result'] = roll < adjustedRate ? 'scored' : roll < adjustedRate + 15 ? 'saved' : 'missed';

    const newAttempt: PenaltyAttempt = {
      id: penaltyAttempts.length + 1,
      round: currentRound,
      placement: selectedPlacement,
      result,
      keeperDive: diveGuess,
      composure,
    };

    setPenaltyAttempts((prev) => [...prev.slice(-9), newAttempt]);
    setComposure((prev) => Math.max(10, Math.min(100, prev + (result === 'scored' ? 5 : -10))));

    if (shootoutActive) {
      setCurrentRound((prev) => Math.min(prev + 1, 5));
    }
  }, [composure, currentRound, keeperTendency, penaltyAttempts.length, shootoutActive]);

  const handleNewShootout = useCallback(() => {
    setShootoutActive(true);
    setCurrentRound(1);
    setComposure(75);
    setPenaltyAttempts([]);
  }, []);

  const handleReset = useCallback(() => {
    setShootoutActive(false);
    setCurrentRound(1);
    setComposure(75);
  }, []);

  const getComposureColor = (val: number): string => {
    if (val >= 75) return '#10b981';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getComposureLabel = (val: number): string => {
    if (val >= 80) return 'Ice Cold';
    if (val >= 65) return 'Composed';
    if (val >= 50) return 'Nervous';
    if (val >= 35) return 'Shaking';
    return 'Panicking';
  };

  const getPlacementColor = (val: number): string => {
    if (val >= 3) return '#ef4444';
    if (val >= 2) return '#f59e0b';
    if (val >= 1) return '#3b82f6';
    return '#21262d';
  };

  return (
    <div className="space-y-3">
      {/* Penalty Shootout Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">Penalty Shootout</span>
          </div>
          <div className="flex items-center gap-2">
            {shootoutActive && (
              <span className="text-xs font-bold text-sky-400">Round {currentRound}/5</span>
            )}
            <button
              onClick={shootoutActive ? handleReset : handleNewShootout}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] text-[10px] text-sky-400 border border-[#30363d] hover:border-sky-500/40 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              {shootoutActive ? 'Reset' : 'New Shootout'}
            </button>
          </div>
        </div>
      </div>

      {/* Composure Meter */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5" style={{ color: getComposureColor(composure) }} />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Composure</span>
          </div>
          <span className="text-xs font-bold" style={{ color: getComposureColor(composure) }}>
            {getComposureLabel(composure)}
          </span>
        </div>
        <div className="flex justify-center">
          <SemiCircleGauge value={composure} size={180} color={getComposureColor(composure)} label="Composure" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#8b949e]">Pressure affects accuracy</span>
          <span className="text-sm font-bold" style={{ color: getComposureColor(composure) }}>{composure}</span>
        </div>
      </div>

      {/* Keeper Tendency */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Keeper Tendency</span>
        </div>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setKeeperTendency(dir)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors border capitalize ${
                keeperTendency === dir
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {dir === 'center' ? 'Stay' : dir}
            </button>
          ))}
        </div>
      </div>

      {/* Penalty Placement Target Grid */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Placement Frequency</span>
        <div className="flex justify-center mt-2">
          <svg width="200" height="140" viewBox="0 0 200 140" style={{ width: '100%', maxWidth: 200 }}>
            {/* Goal frame */}
            <rect x="20" y="10" width="160" height="100" fill="none" stroke="#484f58" strokeWidth={2} rx={2} />
            {/* 3x3 placement grid */}
            {(['top', 'mid', 'bottom'] as const).map((row, ri) =>
              (['left', 'center', 'right'] as const).map((col, ci) => {
                const key = `${row}-${col}`;
                const val = placementGrid[key] ?? 0;
                const color = getPlacementColor(val);
                return (
                  <g key={key}>
                    <rect
                      x={20 + ci * (160 / 3)}
                      y={10 + ri * (100 / 3)}
                      width={160 / 3}
                      height={100 / 3}
                      fill={color}
                      fillOpacity={val > 0 ? 0.5 : 0.15}
                      stroke="#30363d"
                      strokeWidth={0.5}
                    />
                    {val > 0 && (
                      <text
                        x={20 + ci * (160 / 3) + (160 / 3) / 2}
                        y={10 + ri * (100 / 3) + (100 / 3) / 2 + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#c9d1d9"
                        fontSize={12}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              })
            )}
            {/* Goal frame overlay */}
            <line x1="20" y1="10" x2="180" y2="10" stroke="#c9d1d9" strokeWidth={3} />
            <line x1="20" y1="110" x2="180" y2="110" stroke="#c9d1d9" strokeWidth={3} />
            <line x1="20" y1="10" x2="20" y2="110" stroke="#c9d1d9" strokeWidth={3} />
            <line x1="180" y1="10" x2="180" y2="110" stroke="#c9d1d9" strokeWidth={3} />
          </svg>
        </div>
      </div>

      {/* Take Penalty Button */}
      <button
        onClick={handleTakePenalty}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
      >
        <Play className="h-4 w-4" />
        Take Penalty
      </button>

      {/* Penalty Success Donut + Streak Timeline */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-2">Score vs Saved</span>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 100 }}>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#21262d" strokeWidth={12} />
            {recentPenalties.length > 0 && (
              <>
                <circle
                  cx="50" cy="50" r="35"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={12}
                  strokeDasharray={`${(scoredCount / recentPenalties.length) * 220} 220`}
                  strokeDashoffset="0"
                  strokeOpacity={0.9}
                />
                <circle
                  cx="50" cy="50" r="35"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={12}
                  strokeDasharray={`${(savedCount / recentPenalties.length) * 220} 220`}
                  strokeDashoffset={`${-(scoredCount / recentPenalties.length) * 220}`}
                  strokeOpacity={0.9}
                />
              </>
            )}
            <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize={16} fontWeight="bold" fontFamily="monospace">
              {penaltySuccessRate}%
            </text>
            <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={8}>
              {scoredCount}/{recentPenalties.length}
            </text>
          </svg>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-[#8b949e]">Scored</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-[#8b949e]">Saved</span>
            </div>
          </div>
        </div>

        {/* Streak Timeline */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Last 10 Penalties</span>
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {recentPenalties.map((p, i) => (
              <div
                key={p.id}
                className="w-7 h-7 rounded-md flex items-center justify-center border"
                style={{
                  backgroundColor: p.result === 'scored' ? '#10b98120' : '#ef444420',
                  borderColor: p.result === 'scored' ? '#10b98150' : '#ef444450',
                }}
              >
                <span
                  className="text-[10px] font-bold"
                  style={{ color: p.result === 'scored' ? '#10b981' : '#ef4444' }}
                >
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            {recentPenalties.map((p) => (
              <div
                key={`dot-${p.id}`}
                className="flex-1 h-1.5 rounded-sm"
                style={{ backgroundColor: p.result === 'scored' ? '#10b981' : '#ef4444' }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-[#8b949e]">Oldest</span>
            <span className="text-[8px] text-[#8b949e]">Newest</span>
          </div>
        </div>
      </div>

      {/* Shoot/Save History */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Shoot/Save History</span>
        <div className="mt-2 space-y-1">
          {recentPenalties.slice(-5).map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-md bg-[#0d1117]">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: p.result === 'scored' ? '#10b98120' : '#ef444420',
                  color: p.result === 'scored' ? '#10b981' : '#ef4444',
                }}
              >
                {p.result === 'scored' ? 'G' : 'S'}
              </div>
              <span className="text-[10px] text-[#c9d1d9] capitalize flex-1">{p.placement.replace('-', ' ')}</span>
              <span className="text-[10px] text-[#8b949e]">R{p.round}</span>
              <span className="text-[10px] text-amber-400">C:{p.composure}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: Tab 3 - Corner Routines
// ============================================================

function CornerRoutinesTab(): React.JSX.Element {
  const [selectedRoutine, setSelectedRoutine] = useState(0);
  const [cornerAttempts, setCornerAttempts] = useState([
    { id: 1, routine: 'near_post', result: 'goal', minute: 12 },
    { id: 2, routine: 'far_post', result: 'cleared', minute: 23 },
    { id: 3, routine: 'short', result: 'goal', minute: 34 },
    { id: 4, routine: 'driven', result: 'cleared', minute: 45 },
    { id: 5, routine: 'flick_on', result: 'goal', minute: 56 },
    { id: 6, routine: 'zonal', result: 'goal', minute: 67 },
    { id: 7, routine: 'near_post', result: 'cleared', minute: 78 },
    { id: 8, routine: 'far_post', result: 'goal', minute: 89 },
    { id: 9, routine: 'driven', result: 'goal', minute: 90 },
    { id: 10, routine: 'short', result: 'cleared', minute: 55 },
  ]);

  const currentRoutine = CORNER_ROUTINES[selectedRoutine];

  const goalDistribution = useMemo(() => {
    const init = { near_post: 0, far_post: 0, short: 0, other: 0 } as const;
    return cornerAttempts.reduce<Record<string, number>>((acc, att) => {
      const newAcc = { ...acc };
      if (att.result === 'goal') {
        if (newAcc[att.routine] !== undefined) {
          newAcc[att.routine] += 1;
        } else {
          newAcc.other += 1;
        }
      }
      return newAcc;
    }, { ...init });
  }, [cornerAttempts]);

  const totalGoals = cornerAttempts.reduce<number>((acc, a) => acc + (a.result === 'goal' ? 1 : 0), 0);
  const totalAttempts = cornerAttempts.length;
  const assistConversionRate = totalAttempts > 0 ? Math.round((totalGoals / totalAttempts) * 100) : 0;

  const routineSuccessStats = useMemo(() => {
    return CORNER_ROUTINES.reduce<Record<string, { total: number; goals: number }>>((acc, routine) => {
      const matching = cornerAttempts.filter((a) => a.routine === routine.type);
      return {
        ...acc,
        [routine.type]: {
          total: matching.length,
          goals: matching.filter((a) => a.result === 'goal').length,
        },
      };
    }, {});
  }, [cornerAttempts]);

  const handleExecuteCorner = useCallback(() => {
    const roll = Math.random() * 100;
    const result = roll < currentRoutine.successRate ? 'goal' : 'cleared';
    const newAttempt = {
      id: cornerAttempts.length + 1,
      routine: currentRoutine.type,
      result,
      minute: Math.floor(Math.random() * 90) + 1,
    };
    setCornerAttempts((prev) => [...prev.slice(-9), newAttempt]);
  }, [currentRoutine, cornerAttempts.length]);

  const deliveryZones = [
    { label: 'NP', x: 15, y: 15, color: '#10b981' },
    { label: 'FP', x: 155, y: 15, color: '#3b82f6' },
    { label: 'SH', x: 8, y: 55, color: '#f59e0b' },
    { label: 'DR', x: 75, y: 55, color: '#ef4444' },
    { label: 'FL', x: 42, y: 30, color: '#8b5cf6' },
    { label: 'ZO', x: 85, y: 30, color: '#ec4899' },
  ];

  return (
    <div className="space-y-3">
      {/* Corner Routine Cards */}
      <div className="grid grid-cols-2 gap-2">
        {CORNER_ROUTINES.map((routine, i) => {
          const stats = routineSuccessStats[routine.type];
          const total = stats?.total ?? 0;
          const goals = stats?.goals ?? 0;
          return (
            <button
              key={routine.id}
              onClick={() => setSelectedRoutine(i)}
              className={`p-2.5 rounded-lg text-left transition-colors border ${
                selectedRoutine === i
                  ? 'bg-[#21262d] border-emerald-500/40'
                  : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: routine.color }}
                />
                <span className="text-xs font-semibold text-[#c9d1d9]">{routine.name}</span>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-tight mb-1">{routine.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold" style={{ color: routine.color }}>
                  {routine.successRate}%
                </span>
                <span className="text-[9px] text-[#484f58]">|</span>
                <span className="text-[10px] text-[#8b949e]">
                  {goals}/{total} goals
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Routine Details */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRoutine.color }} />
          <span className="text-sm font-bold text-[#c9d1d9]">{currentRoutine.name}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <span className="text-[10px] text-[#8b949e] block">Taker</span>
            <span className="text-xs font-bold text-[#c9d1d9]">{currentRoutine.taker}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-[#8b949e] block">Receiver</span>
            <span className="text-xs font-bold text-[#c9d1d9]">{currentRoutine.receiver}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-[#8b949e] block">Delivery</span>
            <span className="text-xs font-bold" style={{ color: currentRoutine.color }}>{currentRoutine.deliveryQuality}%</span>
          </div>
        </div>
      </div>

      {/* Execute Corner */}
      <button
        onClick={handleExecuteCorner}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
      >
        <Play className="h-4 w-4" />
        Execute Corner
      </button>

      {/* SVG Corner Delivery Zones */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Delivery Zones</span>
        <div className="flex justify-center mt-2">
          <svg width="200" height="160" viewBox="0 0 200 160" style={{ width: '100%', maxWidth: 200 }}>
            {/* Pitch outline */}
            <rect x="10" y="10" width="180" height="140" fill="#0a2e14" stroke="#2d6a3f" strokeWidth={1.5} rx={2} />
            {/* Penalty area */}
            <rect x="40" y="10" width="120" height="70" fill="none" stroke="#2d6a3f" strokeWidth={1} />
            {/* 6-yard box */}
            <rect x="65" y="10" width="70" height="30" fill="none" stroke="#2d6a3f" strokeWidth={1} />
            {/* Goal */}
            <rect x="80" y="2" width="40" height="10" fill="none" stroke="#c9d1d9" strokeWidth={1.5} rx={1} />
            {/* Corner arc */}
            <path d="M 10 16 A 6 6 0 0 1 16 10" fill="none" stroke="#2d6a3f" strokeWidth={1} />
            {/* Penalty spot */}
            <circle cx="100" cy="65" r="2" fill="#2d6a3f" />
            {/* Delivery zones */}
            {deliveryZones.map((zone) => {
              const isSelected = selectedRoutine === deliveryZones.findIndex((z) => z.label === zone.label);
              return (
                <g key={zone.label}>
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={isSelected ? 12 : 8}
                    fill={zone.color}
                    fillOpacity={isSelected ? 0.5 : 0.2}
                    stroke={zone.color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 0.9 : 0.5}
                  />
                  <text
                    x={zone.x}
                    y={zone.y + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#c9d1d9"
                    fontSize={isSelected ? 9 : 7}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {zone.label}
                  </text>
                </g>
              );
            })}
            {/* Corner taker position */}
            <circle cx="12" cy="12" r="4" fill="#f59e0b" fillOpacity={0.8} stroke="#0d1117" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* SVG Routine Success Comparison */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Routine Effectiveness</span>
        <div className="mt-2 space-y-2">
          {CORNER_ROUTINES.map((routine) => {
            const stats = routineSuccessStats[routine.type];
            const total = stats?.total ?? 0;
            const goals = stats?.goals ?? 0;
            const rate = total > 0 ? Math.round((goals / total) * 100) : routine.successRate;
            return (
              <div key={routine.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#8b949e]">{routine.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: routine.color }}>{rate}%</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${rate}%`, backgroundColor: routine.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SVG Corner Goal Distribution + Assist Conversion */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Goal Distribution</span>
          <div className="flex justify-center mt-2">
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ width: '100%', maxWidth: 120 }}>
              {(() => {
                const segments = [
                  { label: 'Near', value: goalDistribution.near_post ?? 0, color: '#10b981' },
                  { label: 'Far', value: goalDistribution.far_post ?? 0, color: '#3b82f6' },
                  { label: 'Short', value: goalDistribution.short ?? 0, color: '#f59e0b' },
                  { label: 'Other', value: goalDistribution.other ?? 0, color: '#ef4444' },
                ];
                const total = segments.reduce<number>((s, seg) => s + seg.value, 0);
                if (total === 0) {
                  return (
                    <>
                      <circle cx="60" cy="60" r="40" fill="none" stroke="#21262d" strokeWidth={14} />
                      <text x="60" y="63" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={10}>No data</text>
                    </>
                  );
                }
                let currentOffset = 0;
                const circumference = 2 * Math.PI * 40;
                return segments.map((seg) => {
                  if (seg.value === 0) return null;
                  const pct = seg.value / total;
                  const dashLen = pct * circumference;
                  const dashOffset = -currentOffset;
                  currentOffset += dashLen;
                  return (
                    <circle
                      key={seg.label}
                      cx="60" cy="60" r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={14}
                      strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                      strokeDashoffset={dashOffset}
                      strokeOpacity={0.8}
                    />
                  );
                });
              })()}
              {totalGoals > 0 && (
                <text x="60" y="57" textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize={16} fontWeight="bold" fontFamily="monospace">
                  {totalGoals}
                </text>
              )}
              {totalGoals > 0 && (
                <text x="60" y="72" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={8}>goals</text>
              )}
            </svg>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[
              { label: 'Near', color: '#10b981' },
              { label: 'Far', color: '#3b82f6' },
              { label: 'Short', color: '#f59e0b' },
              { label: 'Other', color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[8px] text-[#8b949e]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assist Conversion Ring */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-2">Assist Conversion</span>
          <CircularProgressRing
            value={assistConversionRate}
            size={100}
            strokeWidth={8}
            color="#8b5cf6"
            bgColor="#21262d"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: Tab 4 - Set Piece Analytics
// ============================================================

function SetPieceAnalyticsTab(): React.JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const player = gameState?.player ?? {} as Player;
  const club = gameState?.currentClub ?? {} as Club;

  const analytics = useMemo<SetPieceAnalytics>(() => {
    const goals = player.careerStats?.totalGoals ?? 0;
    const assists = player.careerStats?.totalAssists ?? 0;
    return {
      rating: Math.min(99, Math.round((player.overall ?? 50) * 0.4 + (player.form ?? 6) * 5)),
      seasonGoals: player.seasonStats?.goals ?? 0,
      seasonAssists: player.seasonStats?.assists ?? 0,
      seasonCorners: Math.round((player.careerStats?.totalAssists ?? 0) * 0.3),
      seasonFreeKicks: Math.round(goals * 0.15),
      seasonPenalties: Math.round(goals * 0.25),
      seasonThrowIns: Math.floor(Math.random() * 10) + 3,
    };
  }, [player]);

  const matchLog: MatchSetPieceLog[] = [
    { id: 1, opponent: 'Arsenal (A)', competition: 'League', setPieceGoals: 1, setPieceAssists: 0, rating: 7.8 },
    { id: 2, opponent: 'Chelsea (H)', competition: 'Cup', setPieceGoals: 0, setPieceAssists: 1, rating: 7.2 },
    { id: 3, opponent: 'Liverpool (A)', competition: 'League', setPieceGoals: 2, setPieceAssists: 0, rating: 8.9 },
    { id: 4, opponent: 'Man City (H)', competition: 'League', setPieceGoals: 0, setPieceAssists: 0, rating: 6.5 },
    { id: 5, opponent: 'Tottenham (A)', competition: 'League', setPieceGoals: 1, setPieceAssists: 1, rating: 8.1 },
    { id: 6, opponent: 'Newcastle (H)', competition: 'Cup', setPieceGoals: 1, setPieceAssists: 0, rating: 7.5 },
    { id: 7, opponent: 'Brighton (A)', competition: 'League', setPieceGoals: 0, setPieceAssists: 1, rating: 7.0 },
    { id: 8, opponent: 'Aston Villa (H)', competition: 'League', setPieceGoals: 0, setPieceAssists: 0, rating: 6.8 },
  ];

  const radarData = useMemo(() => {
    const base = {
      goals: Math.min(100, analytics.seasonGoals * 10 + 20),
      assists: Math.min(100, analytics.seasonAssists * 12 + 15),
      chanceCreation: Math.min(100, (analytics.seasonCorners + analytics.seasonFreeKicks) * 3 + 25),
      accuracy: Math.min(100, 55 + Math.round(Math.random() * 20)),
      consistency: Math.min(100, 50 + Math.round(Math.random() * 30)),
      pressure: Math.min(100, 40 + Math.round(Math.random() * 35)),
    };
    return base;
  }, [analytics]);

  const monthTrend = [
    { month: 'Aug', value: 2 },
    { month: 'Sep', value: 4 },
    { month: 'Oct', value: 3 },
    { month: 'Nov', value: 5 },
    { month: 'Dec', value: 7 },
    { month: 'Jan', value: 4 },
  ];

  const typeDistribution = useMemo(() => {
    const init = [
      { label: 'Free Kicks', value: analytics.seasonFreeKicks, color: '#ef4444' },
      { label: 'Penalties', value: analytics.seasonPenalties, color: '#10b981' },
      { label: 'Corners', value: analytics.seasonCorners, color: '#3b82f6' },
      { label: 'Throw-ins', value: analytics.seasonThrowIns, color: '#f59e0b' },
      { label: 'Indirect', value: Math.floor(Math.random() * 4) + 1, color: '#8b5cf6' },
    ];
    return init;
  }, [analytics]);

  const peerComparison = [
    { label: 'Free Kick Goals', player: analytics.seasonFreeKicks, leagueAvg: 2, color: '#ef4444' },
    { label: 'Penalty Goals', player: analytics.seasonPenalties, leagueAvg: 3, color: '#10b981' },
    { label: 'Corner Assists', player: analytics.seasonCorners, leagueAvg: 1, color: '#3b82f6' },
    { label: 'Set Piece Goals', player: analytics.seasonGoals, leagueAvg: 4, color: '#f59e0b' },
    { label: 'Success Rate', player: analytics.rating, leagueAvg: 50, color: '#8b5cf6' },
  ];

  const efficiency = useMemo(() => {
    const totalContributions = analytics.seasonGoals + analytics.seasonAssists;
    const totalSetPieces = analytics.seasonCorners + analytics.seasonFreeKicks + analytics.seasonPenalties + analytics.seasonThrowIns;
    if (totalSetPieces === 0) return 0;
    return Math.min(99, Math.round((totalContributions / Math.max(totalSetPieces, 1)) * 100));
  }, [analytics]);

  const radarLabels = ['Goals', 'Assists', 'Chance', 'Accuracy', 'Consistency', 'Pressure'];
  const radarValues = [radarData.goals, radarData.assists, radarData.chanceCreation, radarData.accuracy, radarData.consistency, radarData.pressure];
  const radarKeys: (keyof typeof radarData)[] = ['goals', 'assists', 'chanceCreation', 'accuracy', 'consistency', 'pressure'];

  const buildHexPoints = (values: number[], cx: number, cy: number, r: number): string => {
    const n = values.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;
    return values
      .map((val, i) => {
        const angle = startAngle + i * angleStep;
        const normVal = Math.max(0, Math.min(val, 100)) / 100;
        const x = cx + r * normVal * Math.cos(angle);
        const y = cy + r * normVal * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const buildHexGrid = (cx: number, cy: number, r: number): string => {
    const n = 6;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;
    return Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="space-y-3">
      {/* Overall Rating */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <Award className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Set Piece Rating</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-emerald-400">{analytics.rating}</span>
              <span className="text-xs text-[#8b949e]">/100</span>
            </div>
          </div>
          <SemiCircleGauge value={analytics.rating} size={80} color="#10b981" label="Overall" />
        </div>
      </div>

      {/* Season Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Goals', value: analytics.seasonGoals, color: '#10b981' },
          { label: 'Assists', value: analytics.seasonAssists, color: '#3b82f6' },
          { label: 'Corners', value: analytics.seasonCorners, color: '#f59e0b' },
          { label: 'Free Kicks', value: analytics.seasonFreeKicks, color: '#ef4444' },
          { label: 'Penalties', value: analytics.seasonPenalties, color: '#8b5cf6' },
          { label: 'Throw-ins', value: analytics.seasonThrowIns, color: '#ec4899' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 text-center">
            <span className="text-[10px] text-[#8b949e] block">{stat.label}</span>
            <span className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* SVG Set Piece Contribution Radar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Contribution Radar</span>
        <div className="flex justify-center mt-2">
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 220 }}>
            {[25, 50, 75, 100].map((val) => (
              <polygon
                key={val}
                points={buildHexGrid(110, 110, (val / 100) * 85)}
                fill="none"
                stroke="#30363d"
                strokeWidth={val === 100 ? 1 : 0.5}
                strokeOpacity={val === 100 ? 0.6 : 0.3}
              />
            ))}
            {/* Axis lines */}
            {radarKeys.map((_, i) => {
              const angle = -Math.PI / 2 + i * (2 * Math.PI / 6);
              const x2 = 110 + 85 * Math.cos(angle);
              const y2 = 110 + 85 * Math.sin(angle);
              return (
                <line key={i} x1={110} y1={110} x2={x2} y2={y2} stroke="#30363d" strokeWidth={0.5} strokeOpacity={0.3} />
              );
            })}
            {/* Data polygon */}
            <polygon
              points={buildHexPoints(radarValues, 110, 110, 85)}
              fill="#10b981"
              fillOpacity={0.2}
              stroke="#10b981"
              strokeWidth={2}
              strokeOpacity={0.8}
            />
            {/* Data points */}
            {radarValues.map((val, i) => {
              const angle = -Math.PI / 2 + i * (2 * Math.PI / 6);
              const normVal = Math.max(0, Math.min(val, 100)) / 100;
              const x = 110 + 85 * normVal * Math.cos(angle);
              const y = 110 + 85 * normVal * Math.sin(angle);
              return (
                <circle key={i} cx={x} cy={y} r={3} fill="#10b981" stroke="#0d1117" strokeWidth={1} />
              );
            })}
            {/* Labels */}
            {radarLabels.map((label, i) => {
              const angle = -Math.PI / 2 + i * (2 * Math.PI / 6);
              const labelR = 100;
              const x = 110 + labelR * Math.cos(angle);
              const y = 110 + labelR * Math.sin(angle);
              return (
                <text
                  key={label}
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#8b949e"
                  fontSize={9}
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* SVG Season Set Piece Trend Area Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Monthly Set Piece Trend</span>
        <div className="flex justify-center mt-2">
          <svg width="260" height="140" viewBox="0 0 260 140" style={{ width: '100%', maxWidth: 260 }}>
            {/* Axes */}
            <line x1="30" y1="10" x2="30" y2="110" stroke="#30363d" strokeWidth={1} />
            <line x1="30" y1="110" x2="250" y2="110" stroke="#30363d" strokeWidth={1} />
            {/* Grid lines */}
            {[30, 50, 70, 90].map((yVal) => (
              <line key={`tg-${yVal}`} x1="30" y1={yVal} x2="250" y2={yVal} stroke="#21262d" strokeWidth={0.5} strokeOpacity={0.5} />
            ))}
            {/* Area path */}
            {(() => {
              const maxVal = Math.max(...monthTrend.map((m) => m.value), 1);
              const xStep = 220 / (monthTrend.length - 1);
              const areaPath = monthTrend
                .map((m, i) => {
                  const x = 30 + i * xStep;
                  const y = 110 - (m.value / maxVal) * 90;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ');
              const closingPath = `L ${30 + (monthTrend.length - 1) * xStep} 110 L 30 110 Z`;
              return (
                <g>
                  <path d={`${areaPath} ${closingPath}`} fill="#10b981" fillOpacity={0.15} stroke="none" />
                  <path d={areaPath} fill="none" stroke="#10b981" strokeWidth={2} strokeOpacity={0.8} />
                  {monthTrend.map((m, i) => {
                    const x = 30 + i * xStep;
                    const y = 110 - (m.value / maxVal) * 90;
                    return (
                      <g key={m.month}>
                        <circle cx={x} cy={y} r={3} fill="#10b981" stroke="#0d1117" strokeWidth={1} />
                        <text x={x} y="125" textAnchor="middle" fill="#8b949e" fontSize={8}>{m.month}</text>
                        <text x={x} y={y - 8} textAnchor="middle" fill="#c9d1d9" fontSize={8} fontWeight="bold">{m.value}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* SVG Type Distribution Donut + Efficiency Gauge */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Type Distribution</span>
          <div className="flex justify-center mt-2">
            <svg width="110" height="110" viewBox="0 0 110 110" style={{ width: '100%', maxWidth: 110 }}>
              {(() => {
                const total = typeDistribution.reduce<number>((s, d) => s + d.value, 0);
                if (total === 0) {
                  return <circle cx="55" cy="55" r="35" fill="none" stroke="#21262d" strokeWidth={12} />;
                }
                let currentOffset = 0;
                const circumference = 2 * Math.PI * 35;
                return typeDistribution.map((seg) => {
                  if (seg.value === 0) return null;
                  const pct = seg.value / total;
                  const dashLen = pct * circumference;
                  const dashOff = -currentOffset;
                  currentOffset += dashLen;
                  return (
                    <circle
                      key={seg.label}
                      cx="55" cy="55" r="35"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={12}
                      strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                      strokeDashoffset={dashOff}
                      strokeOpacity={0.8}
                    />
                  );
                });
              })()}
              <text x="55" y="52" textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize={14} fontWeight="bold" fontFamily="monospace">
                {typeDistribution.reduce<number>((s, d) => s + d.value, 0)}
              </text>
              <text x="55" y="66" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={7}>total</text>
            </svg>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {typeDistribution.map((seg) => (
              <div key={seg.label} className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-[7px] text-[#8b949e]">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-2">Efficiency</span>
          <SemiCircleGauge value={efficiency} size={130} color="#f59e0b" label="Score" />
          <span className="text-sm font-bold text-amber-400 mt-1">{efficiency}/100</span>
        </div>
      </div>

      {/* SVG Peer Comparison Bars */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">vs League Average</span>
        <div className="mt-2 space-y-2.5">
          {peerComparison.map((stat) => {
            const maxVal = Math.max(stat.player, stat.leagueAvg, 1);
            const playerWidth = Math.round((stat.player / maxVal) * 100);
            const leagueWidth = Math.round((stat.leagueAvg / maxVal) * 100);
            return (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#8b949e]">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: stat.color }}>{stat.player}</span>
                    <span className="text-[9px] text-[#484f58]">avg {stat.leagueAvg}</span>
                  </div>
                </div>
                <div className="relative h-2 bg-[#21262d] rounded-md overflow-hidden">
                  {/* League average bar */}
                  <div
                    className="absolute top-0 h-full rounded-md bg-[#30363d]"
                    style={{ width: `${leagueWidth}%` }}
                  />
                  {/* Player bar */}
                  <div
                    className="absolute top-0 h-full rounded-md"
                    style={{ width: `${playerWidth}%`, backgroundColor: stat.color, opacity: 0.8 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match-by-Match Set Piece Log */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Match Log (Recent)</span>
        <div className="mt-2 space-y-1">
          {matchLog.map((match) => {
            const hasContribution = match.setPieceGoals > 0 || match.setPieceAssists > 0;
            return (
              <div key={match.id} className="flex items-center gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold"
                  style={{
                    backgroundColor: hasContribution ? '#10b98120' : '#21262d',
                    color: hasContribution ? '#10b981' : '#484f58',
                    borderColor: hasContribution ? '#10b98140' : '#30363d',
                    border: `1px solid ${hasContribution ? '#10b98140' : '#30363d'}`,
                  }}
                >
                  {match.setPieceGoals + match.setPieceAssists}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[#c9d1d9] font-medium block">{match.opponent}</span>
                  <span className="text-[9px] text-[#8b949e]">{match.competition}</span>
                </div>
                <div className="text-right shrink-0">
                  {match.setPieceGoals > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">{match.setPieceGoals}G</span>
                  )}
                  {match.setPieceAssists > 0 && (
                    <span className="text-[10px] text-sky-400 font-bold ml-1">{match.setPieceAssists}A</span>
                  )}
                  {match.setPieceGoals === 0 && match.setPieceAssists === 0 && (
                    <span className="text-[10px] text-[#484f58]">-</span>
                  )}
                  <span className="block text-[9px] text-[#8b949e]">{match.rating}</span>
                </div>
                <ChevronRight className="h-3 w-3 text-[#30363d] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component: SetPieceTrainer
// ============================================================

export default function SetPieceTrainer(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const gameState = useGameStore((s) => s.gameState);
  const player = gameState?.player ?? {} as Player;
  const club = gameState?.currentClub ?? {} as Club;

  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-[#0d1117] pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9] leading-tight">Set Piece Trainer</h1>
            <p className="text-xs text-[#8b949e]">Master free kicks, penalties, corners, and throw-ins</p>
          </div>
        </div>
      </div>

      {/* Player Info Banner */}
      <div className="px-4 mb-2">
        <div className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d]">
            <span className="text-lg font-bold text-emerald-400">{(player.overall ?? 50)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#c9d1d9] block">{player.name ?? 'Unknown Player'}</span>
            <span className="text-[10px] text-[#8b949e]">{club.name ?? 'No Club'} | {player.position ?? 'ST'} | Age {player.age ?? 0}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-[#8b949e] block">Form</span>
            <span className="text-sm font-bold text-emerald-400">{(player.form ?? 6.0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-4 mb-3">
        <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1 gap-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={fadeVariant.hidden}
            animate={fadeVariant.visible}
            exit={fadeVariant.exit}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && <FreeKickPracticeTab />}
            {activeTab === 1 && <PenaltyTrainingTab />}
            {activeTab === 2 && <CornerRoutinesTab />}
            {activeTab === 3 && <SetPieceAnalyticsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
