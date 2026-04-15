'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Target, Crosshair, Flag, BarChart3, Wind, Shield, Play,
  RefreshCw, RotateCcw, Zap, TrendingUp, Compass, CircleDot, Timer,
  Trophy, ArrowRight, Info,
} from 'lucide-react';

// ============================================================
// SVG Helpers
// ============================================================

function polarToCart(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  if (endAngle - startAngle >= 360) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
  }
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeDonutArc(
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  if (endAngle - startAngle >= 360) {
    const outerStart = polarToCart(cx, cy, outerR, 0);
    const innerStart = polarToCart(cx, cy, innerR, 0);
    return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy} A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y} L ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${innerStart.x} ${innerStart.y} Z`;
  }
  const outerStart = polarToCart(cx, cy, outerR, startAngle);
  const outerEnd = polarToCart(cx, cy, outerR, endAngle);
  const innerEnd = polarToCart(cx, cy, innerR, endAngle);
  const innerStart = polarToCart(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
}

function buildPointsStr(coords: [number, number][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ');
}

// ============================================================
// Design Tokens
// ============================================================

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';

// ============================================================
// Web3 Colors
// ============================================================

const ORANGE = '#FF5500';
const LIME = '#CCFF00';
const CYAN = '#00E5FF';
const DGRAY = '#666666';

// ============================================================
// Animation Variants (opacity only — NO transforms)
// ============================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ============================================================
// Type Definitions
// ============================================================

interface FreeKickAttempt {
  id: number;
  technique: string;
  position: string;
  result: 'goal' | 'saved' | 'wide' | 'post' | 'blocked';
  minute: number;
}

interface PenaltyAttempt {
  id: number;
  round: number;
  placement: string;
  result: 'scored' | 'saved' | 'missed';
  keeperDive: 'left' | 'center' | 'right';
  composure: number;
}

interface CornerRoutineDef {
  id: string;
  name: string;
  type: string;
  successRate: number;
  description: string;
  detail: string;
}

interface MatchSetPieceLog {
  id: number;
  opponent: string;
  competition: string;
  setPieceGoals: number;
  rating: number;
}

// ============================================================
// Static Data: Free Kick Positions
// ============================================================

const FREE_KICK_POSITIONS = [
  { id: 'fk-20c', label: '20m Center', distance: 20, angle: 0, difficulty: 'Medium' },
  { id: 'fk-20l', label: '20m Left', distance: 20, angle: -25, difficulty: 'Hard' },
  { id: 'fk-20r', label: '20m Right', distance: 20, angle: 25, difficulty: 'Hard' },
  { id: 'fk-25c', label: '25m Center', distance: 25, angle: 0, difficulty: 'Medium' },
  { id: 'fk-25l', label: '25m Left', distance: 25, angle: -20, difficulty: 'Hard' },
  { id: 'fk-25r', label: '25m Right', distance: 25, angle: 20, difficulty: 'Hard' },
  { id: 'fk-30c', label: '30m Center', distance: 30, angle: 0, difficulty: 'Expert' },
  { id: 'fk-30l', label: '30m Left', distance: 30, angle: -15, difficulty: 'Expert' },
  { id: 'fk-30r', label: '30m Right', distance: 30, angle: 15, difficulty: 'Expert' },
];

// ============================================================
// Static Data: Techniques
// ============================================================

const TECHNIQUES = [
  { id: 'knuckleball', name: 'Knuckleball', successRate: 18, description: 'Unpredictable minimal spin shot' },
  { id: 'curl', name: 'Curl', successRate: 24, description: 'Curving shot around the wall' },
  { id: 'power', name: 'Power', successRate: 21, description: 'Blistering low-driven strike' },
  { id: 'dip', name: 'Dip', successRate: 22, description: 'Lofted topspin over the wall' },
];

const TECH_COLORS = [ORANGE, CYAN, LIME, DGRAY];

// ============================================================
// Static Data: Corner Routines
// ============================================================

const CORNER_ROUTINES: CornerRoutineDef[] = [
  { id: 'cr-1', name: 'Near Post', type: 'near_post', successRate: 32, description: 'Inswinging delivery', detail: 'Aiming for a flick-on at the near post' },
  { id: 'cr-2', name: 'Far Post', type: 'far_post', successRate: 28, description: 'Outswinging delivery', detail: 'Deep ball to the far post for a header' },
  { id: 'cr-3', name: 'Short Corner', type: 'short', successRate: 22, description: 'Quick short pass', detail: 'Retain possession, reset the angle' },
  { id: 'cr-4', name: 'Driven Low', type: 'driven', successRate: 26, description: 'Low driven corner', detail: 'Pacy delivery at waist height' },
  { id: 'cr-5', name: 'Flick-On', type: 'flick_on', successRate: 30, description: 'Near post flick', detail: 'Redirect into dangerous central area' },
  { id: 'cr-6', name: 'Zonal Mark', type: 'zonal', successRate: 35, description: 'Zone overload', detail: 'Timed runs into six-yard box zones' },
];

// ============================================================
// Static Data: Season Match Logs
// ============================================================

const SEASON_LOGS: MatchSetPieceLog[] = [
  { id: 1, opponent: 'Arsenal', competition: 'PL', setPieceGoals: 1, rating: 7.2 },
  { id: 2, opponent: 'Chelsea', competition: 'PL', setPieceGoals: 0, rating: 6.8 },
  { id: 3, opponent: 'Liverpool', competition: 'PL', setPieceGoals: 2, rating: 8.1 },
  { id: 4, opponent: 'Man City', competition: 'Cup', setPieceGoals: 1, rating: 7.5 },
  { id: 5, opponent: 'Tottenham', competition: 'PL', setPieceGoals: 0, rating: 6.5 },
  { id: 6, opponent: 'Newcastle', competition: 'PL', setPieceGoals: 1, rating: 7.8 },
  { id: 7, opponent: 'Aston Villa', competition: 'Cup', setPieceGoals: 2, rating: 8.4 },
  { id: 8, opponent: 'Brighton', competition: 'PL', setPieceGoals: 1, rating: 7.0 },
];

// ============================================================
// Tab 1: SVG — ShotPlacementHeatmap
// ============================================================

function ShotPlacementHeatmap({ attempts }: { attempts: FreeKickAttempt[] }) {
  const grid = useMemo(() => {
    const base: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    return attempts.reduce<number[][]>((acc, a) => {
      const next = acc.map((r) => [...r]);
      const col = (a.id - 1) % 3;
      const row = Math.floor(((a.id - 1) * 7) % 3);
      const safeRow = Math.max(0, Math.min(row, 2));
      const safeCol = Math.max(0, Math.min(col, 2));
      next[safeRow][safeCol] += a.result === 'goal' ? 3 : 1;
      return next;
    }, base);
  }, [attempts]);

  const getHeatColor = (v: number): string => {
    if (v >= 6) return ORANGE;
    if (v >= 3) return LIME;
    if (v >= 1) return CYAN;
    return '#21262d';
  };

  const getHeatOpacity = (v: number): number => {
    if (v >= 6) return 0.9;
    if (v >= 3) return 0.65;
    if (v >= 1) return 0.4;
    return 0.2;
  };

  const netVerticals = useMemo(() => {
    return [40, 70, 100, 130, 160].reduce<number[]>((acc, xp) => [...acc, xp], []);
  }, []);

  const netHorizontals = useMemo(() => {
    return [30, 50, 70, 90].reduce<number[]>((acc, yp) => [...acc, yp], []);
  }, []);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Shot Placement Heatmap
        </span>
        <span className="text-[10px]" style={{ color: ORANGE }}>3×3 Zones</span>
      </div>
      <div className="flex justify-center">
        <svg width="220" height="150" viewBox="0 0 220 150" className="w-full max-w-[220px]">
          {/* Goal frame background */}
          <rect x="20" y="10" width="180" height="110" fill="#0d1117" stroke="#484f58" strokeWidth={2} rx={2} />
          {/* 3x3 grid heatmap cells */}
          {grid.map((row, ri) =>
            row.map((val, ci) => (
              <rect
                key={`${ri}-${ci}`}
                x={20 + ci * (180 / 3)}
                y={10 + ri * (110 / 3)}
                width={180 / 3}
                height={110 / 3}
                fill={getHeatColor(val)}
                fillOpacity={getHeatOpacity(val)}
                stroke="#30363d"
                strokeWidth={0.5}
              />
            )),
          )}
          {/* Crossbar */}
          <line x1="18" y1="10" x2="202" y2="10" stroke="#c9d1d9" strokeWidth={4} />
          {/* Left post */}
          <line x1="20" y1="8" x2="20" y2="122" stroke="#c9d1d9" strokeWidth={4} />
          {/* Right post */}
          <line x1="200" y1="8" x2="200" y2="122" stroke="#c9d1d9" strokeWidth={4} />
          {/* Goal line */}
          <line x1="20" y1="120" x2="200" y2="120" stroke="#c9d1d9" strokeWidth={2} strokeOpacity={0.4} />
          {/* Net verticals */}
          {netVerticals.map((xp) => (
            <line key={`nv${xp}`} x1={xp} y1="10" x2={xp} y2="120" stroke="#30363d" strokeWidth={0.3} strokeOpacity={0.35} />
          ))}
          {/* Net horizontals */}
          {netHorizontals.map((yp) => (
            <line key={`nh${yp}`} x1="20" y1={yp} x2="200" y2={yp} stroke="#30363d" strokeWidth={0.3} strokeOpacity={0.35} />
          ))}
          {/* Zone labels */}
          <text x="110" y="148" textAnchor="middle" fill="#8b949e" fontSize={7}>Goal Placement Frequency</text>
        </svg>
      </div>
      {/* Color Legend */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ORANGE }} />
          <span className="text-[9px] text-[#8b949e]">Hot Zone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: LIME }} />
          <span className="text-[9px] text-[#8b949e]">Warm Zone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CYAN }} />
          <span className="text-[9px] text-[#8b949e]">Cool Zone</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#21262d' }} />
          <span className="text-[9px] text-[#8b949e]">Cold Zone</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 1: SVG — TechniqueEffectivenessBars
// ============================================================

function TechniqueEffectivenessBars({ attempts }: { attempts: FreeKickAttempt[] }) {
  const stats = useMemo(() => {
    return TECHNIQUES.reduce<{ name: string; rate: number; color: string; description: string }[]>((acc, tech) => {
      const matching = attempts.filter((a) => a.technique === tech.id);
      const total = matching.length;
      const goals = matching.reduce<number>((g, a) => g + (a.result === 'goal' ? 1 : 0), 0);
      const rate = total > 0 ? Math.round((goals / total) * 100) : tech.successRate;
      return [...acc, {
        name: tech.name,
        rate,
        color: TECH_COLORS[acc.length % TECH_COLORS.length],
        description: tech.description,
      }];
    }, []);
  }, [attempts]);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Technique Effectiveness
        </span>
        <span className="text-[10px]" style={{ color: CYAN }}>4 Techniques</span>
      </div>
      <div className="flex flex-col gap-3">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className={`text-[11px] font-medium ${TEXT_PRIMARY}`}>{s.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#484f58]">{s.description}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.rate}%</span>
              </div>
            </div>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md"
                style={{ width: `${s.rate}%`, backgroundColor: s.color, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab 1: SVG — DistanceAccuracyScatter
// ============================================================

function DistanceAccuracyScatter({ attempts }: { attempts: FreeKickAttempt[] }) {
  const dots = useMemo(() => {
    return attempts.reduce<{ x: number; y: number; goal: boolean; minute: number }[]>((acc, a) => {
      const pos = FREE_KICK_POSITIONS.find((p) => p.id === a.position);
      const dist = pos?.distance ?? 20;
      const isGoal = a.result === 'goal';
      const accuracy = isGoal ? 70 + Math.random() * 28 : 15 + Math.random() * 45;
      const px = 30 + ((dist - 18) / 20) * 220;
      const py = 130 - (accuracy / 100) * 120;
      return [...acc, {
        x: Math.min(245, Math.max(35, px)),
        y: Math.max(15, Math.min(125, py)),
        goal: isGoal,
        minute: a.minute,
      }];
    }, []);
  }, [attempts]);

  const goalCount = useMemo(() => dots.reduce<number>((c, d) => c + (d.goal ? 1 : 0), 0), [dots]);
  const missCount = dots.length - goalCount;

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Distance vs Accuracy
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: CYAN }}>{goalCount} goals</span>
          <span className="text-[10px]" style={{ color: ORANGE }}>{missCount} misses</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width="280" height="170" viewBox="0 0 280 170" className="w-full max-w-[280px]">
          {/* Y-axis */}
          <line x1="35" y1="10" x2="35" y2="135" stroke="#30363d" strokeWidth={1} />
          {/* X-axis */}
          <line x1="35" y1="135" x2="265" y2="135" stroke="#30363d" strokeWidth={1} />
          {/* Y-axis labels */}
          <text x="30" y="15" textAnchor="end" fill="#8b949e" fontSize={7}>100%</text>
          <text x="30" y="44" textAnchor="end" fill="#8b949e" fontSize={7}>75%</text>
          <text x="30" y="74" textAnchor="end" fill="#8b949e" fontSize={7}>50%</text>
          <text x="30" y="104" textAnchor="end" fill="#8b949e" fontSize={7}>25%</text>
          <text x="30" y="138" textAnchor="end" fill="#8b949e" fontSize={7}>0%</text>
          {/* X-axis labels */}
          <text x="55" y="150" textAnchor="middle" fill="#8b949e" fontSize={7}>20m</text>
          <text x="110" y="150" textAnchor="middle" fill="#8b949e" fontSize={7}>25m</text>
          <text x="165" y="150" textAnchor="middle" fill="#8b949e" fontSize={7}>30m</text>
          <text x="220" y="150" textAnchor="middle" fill="#8b949e" fontSize={7}>35m</text>
          {/* Horizontal grid lines */}
          {[40, 70, 100, 130].map((yv) => (
            <line key={`sg${yv}`} x1="35" y1={yv} x2="265" y2={yv} stroke="#21262d" strokeWidth={0.5} strokeOpacity={0.5} />
          ))}
          {/* Vertical grid lines */}
          {[55, 110, 165, 220].map((xv) => (
            <line key={`sgv${xv}`} x1={xv} y1="10" x2={xv} y2="135" stroke="#21262d" strokeWidth={0.3} strokeOpacity={0.3} />
          ))}
          {/* Data points */}
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={4}
              fill={d.goal ? CYAN : ORANGE}
              fillOpacity={0.8}
              stroke="#0d1117"
              strokeWidth={1}
            />
          ))}
          {/* Axis labels */}
          <text x="150" y="166" textAnchor="middle" fill="#8b949e" fontSize={8}>Distance (metres)</text>
          <text x="8" y="75" textAnchor="middle" fill="#8b949e" fontSize={8} transform="rotate(-90, 8, 75)">Accuracy %</text>
          {/* Legend */}
          <circle cx="155" cy="6" r={3} fill={CYAN} fillOpacity={0.8} />
          <text x="162" y="9" fill="#8b949e" fontSize={7}>Goal</text>
          <circle cx="200" cy="6" r={3} fill={ORANGE} fillOpacity={0.8} />
          <text x="207" y="9" fill="#8b949e" fontSize={7}>Miss</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 1: Free Kick Mastery Tab
// ============================================================

function FreeKickMasteryTab() {
  const { gameState } = useGameStore();
  const playerName = gameState?.player.name ?? 'Player';
  const clubName = gameState?.currentClub.name ?? 'Club';

  const [selectedPosition, setSelectedPosition] = useState(0);
  const [selectedTechnique, setSelectedTechnique] = useState(0);
  const [windSpeed, setWindSpeed] = useState(12);
  const [windDir, setWindDir] = useState<'none' | 'left' | 'right' | 'headwind'>('right');
  const [wallHeight, setWallHeight] = useState(3);
  const [attempts, setAttempts] = useState<FreeKickAttempt[]>([
    { id: 1, technique: 'curl', position: 'fk-20c', result: 'goal', minute: 12 },
    { id: 2, technique: 'power', position: 'fk-25c', result: 'wide', minute: 23 },
    { id: 3, technique: 'dip', position: 'fk-20l', result: 'saved', minute: 34 },
    { id: 4, technique: 'knuckleball', position: 'fk-25r', result: 'goal', minute: 45 },
    { id: 5, technique: 'curl', position: 'fk-30c', result: 'post', minute: 56 },
    { id: 6, technique: 'power', position: 'fk-20c', result: 'goal', minute: 67 },
    { id: 7, technique: 'dip', position: 'fk-25l', result: 'blocked', minute: 78 },
    { id: 8, technique: 'knuckleball', position: 'fk-30l', result: 'wide', minute: 82 },
  ]);

  const successRate = useMemo(() => {
    if (attempts.length === 0) return 0;
    const goals = attempts.reduce<number>((acc, a) => acc + (a.result === 'goal' ? 1 : 0), 0);
    return Math.round((goals / attempts.length) * 100);
  }, [attempts]);

  const totalGoals = useMemo(() => {
    return attempts.reduce<number>((acc, a) => acc + (a.result === 'goal' ? 1 : 0), 0);
  }, [attempts]);

  const bestTechnique = useMemo(() => {
    const counts = TECHNIQUES.reduce<Record<string, number>>((acc, tech) => {
      return { ...acc, [tech.id]: 0 };
    }, {});
    return attempts.reduce<Record<string, number>>((acc, a) => {
      if (a.result === 'goal') {
        return { ...acc, [a.technique]: (acc[a.technique] ?? 0) + 1 };
      }
      return acc;
    }, counts);
  }, [attempts]);

  const handleTakeShot = useCallback(() => {
    const pos = FREE_KICK_POSITIONS[selectedPosition];
    const tech = TECHNIQUES[selectedTechnique];
    const diffMod = pos.distance > 25 ? -5 : pos.distance < 20 ? 5 : 0;
    const windMod = windDir === 'headwind' ? -8 : windDir === 'none' ? 0 : -4;
    const wallMod = wallHeight >= 4 ? -3 : wallHeight <= 2 ? 3 : 0;
    const rate = Math.max(5, Math.min(80, tech.successRate + diffMod + windMod + wallMod));
    const roll = Math.random() * 100;
    const result: FreeKickAttempt['result'] =
      roll < rate * 0.6 ? 'goal' : roll < rate * 0.85 ? 'saved' : roll < rate ? 'post' : 'wide';
    const newAttempt: FreeKickAttempt = {
      id: attempts.length + 1,
      technique: tech.id,
      position: pos.id,
      result,
      minute: Math.floor(Math.random() * 90) + 1,
    };
    setAttempts((prev) => [...prev.slice(-9), newAttempt]);
  }, [selectedPosition, selectedTechnique, windDir, wallHeight, attempts.length]);

  const handleRandomizeWind = useCallback(() => {
    const dirs: Array<'none' | 'left' | 'right' | 'headwind'> = ['none', 'left', 'right', 'headwind'];
    setWindSpeed(Math.floor(Math.random() * 30) + 5);
    setWindDir(dirs[Math.floor(Math.random() * dirs.length)]);
  }, []);

  const handleResetWall = useCallback(() => {
    setWallHeight(3);
  }, []);

  const getDiffColor = (diff: string): string => {
    if (diff === 'Expert') return ORANGE;
    if (diff === 'Hard') return LIME;
    return CYAN;
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {/* Header */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: ORANGE }} />
            <span className={`text-sm font-bold ${TEXT_PRIMARY}`}>Free Kick Mastery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color: LIME }}>{totalGoals} goals</span>
            <span className="text-xs font-bold" style={{ color: ORANGE }}>{successRate}%</span>
          </div>
        </div>
        <p className={`text-[10px] ${TEXT_SECONDARY} mt-1`}>{playerName} — {clubName}</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={staggerChild} className="grid grid-cols-3 gap-2">
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: ORANGE }}>{attempts.length}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Attempts</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: LIME }}>{successRate}%</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Success</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: CYAN }}>{wallHeight}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Wall Size</span>
        </div>
      </motion.div>

      {/* Position Selector */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Position</span>
          <span className="text-[10px]" style={{ color: ORANGE }}>
            {FREE_KICK_POSITIONS[selectedPosition].distance}m
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {FREE_KICK_POSITIONS.map((pos, i) => (
            <button
              key={pos.id}
              onClick={() => setSelectedPosition(i)}
              className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors border"
              style={selectedPosition === i
                ? { backgroundColor: `${ORANGE}15`, borderColor: `${ORANGE}60`, color: '#c9d1d9' }
                : { backgroundColor: '#21262d', borderColor: '#30363d', color: '#8b949e' }
              }
            >
              {pos.label}
              <span className="block text-[9px] mt-0.5" style={{ color: getDiffColor(pos.difficulty) }}>
                {pos.difficulty}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Technique Selection */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Technique</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TECHNIQUES.map((tech, i) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTechnique(i)}
              className="p-2.5 rounded-lg text-left transition-colors border"
              style={selectedTechnique === i
                ? { backgroundColor: '#21262d', borderColor: `${TECH_COLORS[i]}60` }
                : { backgroundColor: '#0d1117', borderColor: '#30363d' }
              }
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: `${TECH_COLORS[i]}20`, color: TECH_COLORS[i] }}
                >
                  <Zap className="h-3 w-3" />
                </div>
                <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{tech.name}</span>
              </div>
              <p className={`text-[9px] ${TEXT_SECONDARY} leading-tight`}>{tech.description}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold" style={{ color: TECH_COLORS[i] }}>
                  {tech.successRate}% base
                </span>
                <span className="text-[10px]" style={{ color: TECH_COLORS[i] }}>
                  {bestTechnique[tech.id] ?? 0} goals
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Wind & Wall Controls */}
      <motion.div variants={staggerChild} className="grid grid-cols-2 gap-2">
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5" style={{ color: CYAN }} />
              <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Wind</span>
            </div>
            <button
              onClick={handleRandomizeWind}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#21262d] text-[9px] border border-[#30363d] hover:border-[#484f58] transition-colors"
              style={{ color: CYAN }}
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Random
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${TEXT_PRIMARY}`}>{windSpeed} km/h</span>
            <span className="text-xs capitalize" style={{ color: CYAN }}>{windDir === 'none' ? 'Calm' : windDir}</span>
          </div>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Wall</span>
            </div>
            <button
              onClick={handleResetWall}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#21262d] text-[9px] border border-[#30363d] hover:border-[#484f58] transition-colors"
              style={{ color: ORANGE }}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Reset
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${TEXT_PRIMARY}`}>{wallHeight} players</span>
            <span className="text-xs" style={{ color: wallHeight >= 4 ? ORANGE : LIME }}>
              {wallHeight >= 4 ? 'Tall wall' : 'Standard'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Take Shot Button */}
      <motion.div variants={staggerChild}>
        <button
          onClick={handleTakeShot}
          className="w-full py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
        >
          <Play className="h-4 w-4" />
          Take Free Kick
        </button>
      </motion.div>

      {/* Recent Attempts Log */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Recent Attempts</span>
        <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1">
          {attempts.slice(-6).map((a) => {
            const resultColor = a.result === 'goal' ? LIME : a.result === 'saved' ? ORANGE : DGRAY;
            return (
              <div
                key={a.id}
                className="shrink-0 w-16 p-1.5 rounded-md border text-center"
                style={{ backgroundColor: `${resultColor}10`, borderColor: `${resultColor}30` }}
              >
                <span className="text-[9px] font-bold block" style={{ color: resultColor }}>
                  {a.result.toUpperCase()}
                </span>
                <span className="text-[9px] text-[#8b949e] block mt-0.5">{a.minute}&apos;</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* SVG Visualizations */}
      <motion.div variants={staggerChild}>
        <ShotPlacementHeatmap attempts={attempts} />
      </motion.div>
      <motion.div variants={staggerChild}>
        <TechniqueEffectivenessBars attempts={attempts} />
      </motion.div>
      <motion.div variants={staggerChild}>
        <DistanceAccuracyScatter attempts={attempts} />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 2: SVG — PenaltyPlacementGrid
// ============================================================

function PenaltyPlacementGrid({ attempts }: { attempts: PenaltyAttempt[] }) {
  const grid = useMemo(() => {
    const zones: Record<string, number> = {
      'top-left': 0, 'top-center': 0, 'top-right': 0,
      'mid-left': 0, 'mid-center': 0, 'mid-right': 0,
      'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0,
    };
    return attempts.reduce<Record<string, number>>((acc, p) => {
      const next = { ...acc };
      if (next[p.placement] !== undefined) {
        next[p.placement] += 1;
      }
      return next;
    }, zones);
  }, [attempts]);

  const maxVal = useMemo(() => {
    return Math.max(...Object.values(grid), 1);
  }, [grid]);

  const rows = ['top', 'mid', 'bottom'] as const;
  const cols = ['left', 'center', 'right'] as const;

  const getGridColor = (v: number): string => {
    if (v >= 3) return CYAN;
    if (v >= 1) return ORANGE;
    return '#21262d';
  };

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Placement Frequency
        </span>
        <span className="text-[10px]" style={{ color: CYAN }}>9 Zones</span>
      </div>
      <div className="flex justify-center">
        <svg width="220" height="150" viewBox="0 0 220 150" className="w-full max-w-[220px]">
          <rect x="20" y="10" width="180" height="110" fill="#0d1117" stroke="#484f58" strokeWidth={2} rx={2} />
          {rows.map((row, ri) =>
            cols.map((col, ci) => {
              const key = `${row}-${col}`;
              const val = grid[key] ?? 0;
              return (
                <g key={key}>
                  <rect
                    x={20 + ci * (180 / 3)}
                    y={10 + ri * (110 / 3)}
                    width={180 / 3}
                    height={110 / 3}
                    fill={getGridColor(val)}
                    fillOpacity={val > 0 ? Math.min(0.85, 0.3 + (val / maxVal) * 0.55) : 0.12}
                    stroke="#30363d"
                    strokeWidth={0.5}
                  />
                  {val > 0 && (
                    <text
                      x={20 + ci * (180 / 3) + (180 / 3) / 2}
                      y={10 + ri * (110 / 3) + (110 / 3) / 2 + 3}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#c9d1d9"
                      fontSize={14}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  )}
                </g>
              );
            }),
          )}
          {/* Goal frame */}
          <line x1="18" y1="10" x2="202" y2="10" stroke="#c9d1d9" strokeWidth={4} />
          <line x1="20" y1="8" x2="20" y2="122" stroke="#c9d1d9" strokeWidth={4} />
          <line x1="200" y1="8" x2="200" y2="122" stroke="#c9d1d9" strokeWidth={4} />
          {/* Zone labels */}
          <text x="110" y="148" textAnchor="middle" fill="#8b949e" fontSize={7}>Penalty Placement Frequency</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: SVG — ComposureGauge
// ============================================================

function ComposureGauge({ value }: { value: number }) {
  const arcPath = useMemo(() => describeArc(100, 95, 72, 0, (value / 100) * 180), [value]);
  const bgArc = useMemo(() => describeArc(100, 95, 72, 0, 180), []);

  const needleAngle = useMemo(() => (value / 100) * 180, [value]);
  const needleEnd = useMemo(() => polarToCart(100, 95, 55, needleAngle), [needleAngle]);

  const getLabel = (v: number): string => {
    if (v >= 80) return 'Ice Cold';
    if (v >= 65) return 'Composed';
    if (v >= 50) return 'Nervous';
    if (v >= 35) return 'Shaking';
    return 'Panicking';
  };

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Composure Level
        </span>
        <span className="text-[10px] font-bold" style={{ color: LIME }}>{getLabel(value)}</span>
      </div>
      <div className="flex justify-center">
        <svg width="210" height="130" viewBox="0 0 210 130" className="w-full max-w-[210px]">
          {/* Background arc */}
          <path d={bgArc} fill="none" stroke="#21262d" strokeWidth={12} strokeLinecap="round" />
          {/* Value arc */}
          <path d={arcPath} fill="none" stroke={LIME} strokeWidth={12} strokeLinecap="round" strokeOpacity={0.85} />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const pt = polarToCart(100, 95, 80, (tick / 100) * 180);
            return (
              <line
                key={tick}
                x1={pt.x} y1={pt.y}
                x2={polarToCart(100, 95, 86, (tick / 100) * 180).x}
                y2={polarToCart(100, 95, 86, (tick / 100) * 180).y}
                stroke="#484f58"
                strokeWidth={1.5}
              />
            );
          })}
          {/* Center value */}
          <text x="100" y="85" textAnchor="middle" dominantBaseline="middle" fill={LIME} fontSize={28} fontWeight="bold" fontFamily="monospace">
            {value}
          </text>
          <text x="100" y="106" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={9}>
            Composure
          </text>
          {/* Min/Max labels */}
          <text x="22" y="100" textAnchor="middle" fill="#8b949e" fontSize={8}>0</text>
          <text x="178" y="100" textAnchor="middle" fill="#8b949e" fontSize={8}>100</text>
          {/* Needle */}
          <line x1="100" y1="95" x2={needleEnd.x} y2={needleEnd.y} stroke={LIME} strokeWidth={2} strokeOpacity={0.6} />
          <circle cx="100" cy="95" r={3} fill={LIME} fillOpacity={0.8} />
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: SVG — PenaltyStreakTimeline
// ============================================================

function PenaltyStreakTimeline({ attempts }: { attempts: PenaltyAttempt[] }) {
  const recent = attempts.slice(-10);

  const scoredStreak = useMemo(() => {
    let streak = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].result === 'scored') streak++;
      else break;
    }
    return streak;
  }, [recent]);

  const nodeColor = (r: string): string => {
    if (r === 'scored') return CYAN;
    if (r === 'saved') return ORANGE;
    return DGRAY;
  };

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Recent Penalty Streak
        </span>
        {scoredStreak > 0 && (
          <span className="text-[10px] font-bold" style={{ color: CYAN }}>
            {scoredStreak} scored in a row
          </span>
        )}
      </div>
      <div className="flex justify-center">
        <svg width="300" height="80" viewBox="0 0 300 80" className="w-full max-w-[300px]">
          {/* Connection line */}
          {recent.length > 1 && (
            <line
              x1="20"
              y1="40"
              x2={20 + (recent.length - 1) * 28}
              y2="40"
              stroke="#30363d"
              strokeWidth={2}
            />
          )}
          {/* Nodes */}
          {recent.map((a, i) => {
            const cx = 20 + i * 28;
            return (
              <g key={a.id}>
                {/* Outer ring */}
                <circle
                  cx={cx}
                  cy={40}
                  r={10}
                  fill={nodeColor(a.result)}
                  fillOpacity={0.15}
                  stroke="none"
                />
                {/* Inner circle */}
                <circle
                  cx={cx}
                  cy={40}
                  r={7}
                  fill={nodeColor(a.result)}
                  fillOpacity={0.85}
                  stroke="#0d1117"
                  strokeWidth={1.5}
                />
                {/* Label */}
                <text
                  x={cx}
                  y={41}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0d1117"
                  fontSize={7}
                  fontWeight="bold"
                >
                  {a.result === 'scored' ? 'G' : a.result === 'saved' ? 'S' : 'M'}
                </text>
                {/* Round label */}
                <text x={cx} y="62" textAnchor="middle" fill="#8b949e" fontSize={6}>
                  R{a.round}
                </text>
              </g>
            );
          })}
          {/* Legend */}
          <circle cx="30" cy="12" r={3} fill={CYAN} fillOpacity={0.85} />
          <text x="37" y="15" fill="#8b949e" fontSize={7}>Scored</text>
          <circle cx="95" cy="12" r={3} fill={ORANGE} fillOpacity={0.85} />
          <text x="102" y="15" fill="#8b949e" fontSize={7}>Saved</text>
          <circle cx="155" cy="12" r={3} fill={DGRAY} fillOpacity={0.85} />
          <text x="162" y="15" fill="#8b949e" fontSize={7}>Missed</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Penalty Specialist Tab
// ============================================================

function PenaltySpecialistTab() {
  const { gameState } = useGameStore();
  const playerName = gameState?.player.name ?? 'Player';
  const clubName = gameState?.currentClub.name ?? 'Club';

  const [penaltyAttempts, setPenaltyAttempts] = useState<PenaltyAttempt[]>([
    { id: 1, round: 1, placement: 'bottom-left', result: 'scored', keeperDive: 'right', composure: 82 },
    { id: 2, round: 1, placement: 'top-right', result: 'scored', keeperDive: 'left', composure: 78 },
    { id: 3, round: 2, placement: 'mid-center', result: 'saved', keeperDive: 'center', composure: 45 },
    { id: 4, round: 2, placement: 'bottom-right', result: 'scored', keeperDive: 'left', composure: 88 },
    { id: 5, round: 3, placement: 'top-left', result: 'scored', keeperDive: 'right', composure: 91 },
    { id: 6, round: 3, placement: 'bottom-center', result: 'missed', keeperDive: 'left', composure: 30 },
    { id: 7, round: 4, placement: 'top-center', result: 'scored', keeperDive: 'right', composure: 85 },
    { id: 8, round: 4, placement: 'bottom-left', result: 'scored', keeperDive: 'right', composure: 72 },
    { id: 9, round: 5, placement: 'top-right', result: 'saved', keeperDive: 'center', composure: 55 },
    { id: 10, round: 5, placement: 'mid-right', result: 'scored', keeperDive: 'left', composure: 90 },
  ]);
  const [composure, setComposure] = useState(75);
  const [keeperTendency, setKeeperTendency] = useState<'left' | 'center' | 'right'>('center');
  const [shootoutActive, setShootoutActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  const recentPenalties = penaltyAttempts.slice(-10);

  const penaltySuccessRate = useMemo(() => {
    if (recentPenalties.length === 0) return 0;
    const scored = recentPenalties.reduce<number>((acc, p) => acc + (p.result === 'scored' ? 1 : 0), 0);
    return Math.round((scored / recentPenalties.length) * 100);
  }, [recentPenalties]);

  const penaltyStats = useMemo(() => {
    return recentPenalties.reduce<{ scored: number; saved: number; missed: number }>((acc, p) => {
      return {
        scored: acc.scored + (p.result === 'scored' ? 1 : 0),
        saved: acc.saved + (p.result === 'saved' ? 1 : 0),
        missed: acc.missed + (p.result === 'missed' ? 1 : 0),
      };
    }, { scored: 0, saved: 0, missed: 0 });
  }, [recentPenalties]);

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
    const isSameDir = selectedPlacement.includes(diveGuess) || (selectedPlacement.includes('center') && diveGuess === 'center');
    const adjusted = isSameDir ? baseRate - 40 : baseRate;
    const roll = Math.random() * 100;
    const result: PenaltyAttempt['result'] = roll < adjusted ? 'scored' : roll < adjusted + 15 ? 'saved' : 'missed';
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

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {/* Header */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" style={{ color: CYAN }} />
            <span className={`text-sm font-bold ${TEXT_PRIMARY}`}>Penalty Specialist</span>
          </div>
          <div className="flex items-center gap-2">
            {shootoutActive && (
              <span className="text-xs font-bold" style={{ color: LIME }}>R{currentRound}/5</span>
            )}
            <button
              onClick={shootoutActive ? handleReset : handleNewShootout}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] text-[10px] border border-[#30363d] hover:border-[#484f58] transition-colors"
              style={{ color: CYAN }}
            >
              <RotateCcw className="h-3 w-3" />
              {shootoutActive ? 'Reset' : 'New Shootout'}
            </button>
          </div>
        </div>
        <p className={`text-[10px] ${TEXT_SECONDARY} mt-1`}>{playerName} — {clubName}</p>
      </motion.div>

      {/* Penalty Stats */}
      <motion.div variants={staggerChild} className="grid grid-cols-3 gap-2">
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: CYAN }}>{penaltyStats.scored}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Scored</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: ORANGE }}>{penaltyStats.saved}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Saved</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: DGRAY }}>{penaltyStats.missed}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Missed</span>
        </div>
      </motion.div>

      {/* Keeper Tendency */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-3.5 w-3.5" style={{ color: ORANGE }} />
          <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Keeper Tendency</span>
        </div>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setKeeperTendency(dir)}
              className="flex-1 py-2.5 rounded-md text-xs font-medium transition-colors border capitalize"
              style={keeperTendency === dir
                ? { backgroundColor: `${ORANGE}15`, borderColor: `${ORANGE}60`, color: '#c9d1d9' }
                : { backgroundColor: '#21262d', borderColor: '#30363d', color: '#8b949e' }
              }
            >
              {dir === 'center' ? 'Stay' : dir}
              <span className="block text-[9px] mt-0.5 opacity-60">
                {dir === 'center' ? '65% stay' : `65% dive ${dir}`}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Take Penalty Button */}
      <motion.div variants={staggerChild}>
        <button
          onClick={handleTakePenalty}
          className="w-full py-3 rounded-lg text-[#0d1117] font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: CYAN }}
        >
          <Play className="h-4 w-4" />
          Take Penalty
        </button>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px]" style={{ color: CYAN }}>{penaltySuccessRate}% scored</span>
          <span className="text-[10px] text-[#8b949e]">Composure: {composure}</span>
        </div>
      </motion.div>

      {/* SVG Visualizations */}
      <motion.div variants={staggerChild}>
        <PenaltyPlacementGrid attempts={recentPenalties} />
      </motion.div>
      <motion.div variants={staggerChild}>
        <ComposureGauge value={composure} />
      </motion.div>
      <motion.div variants={staggerChild}>
        <PenaltyStreakTimeline attempts={recentPenalties} />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 3: SVG — RoutineSuccessBars
// ============================================================

function RoutineSuccessBars({ selectedRoutine }: { selectedRoutine: string }) {
  const data = useMemo(() => {
    return CORNER_ROUTINES.map((r) => ({
      name: r.name,
      rate: r.id === selectedRoutine ? r.successRate + 5 : r.successRate,
      active: r.id === selectedRoutine,
      description: r.description,
    }));
  }, [selectedRoutine]);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Routine Success Rates
        </span>
        <span className="text-[10px]" style={{ color: LIME }}>6 Routines</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-sm"
                  style={{ backgroundColor: LIME, opacity: d.active ? 1 : 0.4 }}
                />
                <span className={`text-[10px] ${d.active ? TEXT_PRIMARY : TEXT_SECONDARY} font-medium`}>
                  {d.name}
                </span>
                {!d.active && (
                  <span className="text-[8px] text-[#484f58]">{d.description}</span>
                )}
              </div>
              <span className="text-[10px] font-bold" style={{ color: LIME, opacity: d.active ? 1 : 0.5 }}>
                {d.rate}%
              </span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md"
                style={{
                  width: `${d.rate}%`,
                  backgroundColor: LIME,
                  opacity: d.active ? 0.85 : 0.35,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: SVG — DeliveryZoneScatter
// ============================================================

function DeliveryZoneScatter() {
  const dots = useMemo(() => {
    const seeds = [3, 17, 42, 58, 73, 91, 112, 135, 148, 166, 183, 197];
    return seeds.reduce<{ x: number; y: number; label: string }[]>((acc, s, i) => {
      const px = 35 + (s / 210) * 210;
      const py = 22 + ((s * 37) % 95);
      const labels = [
        'NP', 'FP', 'SH', 'DR', 'FO', 'ZN', 'NP', 'FP', 'SH', 'DR', 'FO', 'ZN',
      ];
      return [...acc, {
        x: Math.min(240, px),
        y: Math.max(15, py),
        label: labels[i] ?? '',
      }];
    }, []);
  }, []);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Delivery Zones
        </span>
        <span className="text-[10px]" style={{ color: CYAN }}>12 Zones</span>
      </div>
      <div className="flex justify-center">
        <svg width="290" height="150" viewBox="0 0 290 150" className="w-full max-w-[290px]">
          {/* Pitch outline */}
          <rect x="20" y="10" width="250" height="130" fill="#0d1117" stroke="#30363d" strokeWidth={1} rx={2} />
          {/* Penalty area */}
          <rect x="85" y="10" width="120" height="55" fill="none" stroke="#30363d" strokeWidth={0.8} />
          {/* Six-yard box */}
          <rect x="115" y="10" width="60" height="22" fill="none" stroke="#30363d" strokeWidth={0.8} />
          {/* Goal */}
          <rect x="130" y="4" width="30" height="6" fill="none" stroke="#c9d1d9" strokeWidth={1.5} />
          {/* Corner arcs */}
          <circle cx="20" cy="10" r={8} fill="none" stroke="#484f58" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx="270" cy="10" r={8} fill="none" stroke="#484f58" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx="20" cy="140" r={8} fill="none" stroke="#484f58" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx="270" cy="140" r={8} fill="none" stroke="#484f58" strokeWidth={0.8} strokeDasharray="2 2" />
          {/* Center spot */}
          <circle cx="145" cy="85" r={2} fill="#484f58" />
          {/* Penalty spot */}
          <circle cx="145" cy="60" r={2} fill="#484f58" />
          {/* Center line */}
          <line x1="20" y1="85" x2="270" y2="85" stroke="#30363d" strokeWidth={0.5} strokeDasharray="4 4" />
          {/* Delivery dots */}
          {dots.map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={5} fill={CYAN} fillOpacity={0.2} stroke={CYAN} strokeWidth={1} strokeOpacity={0.5} />
              <circle cx={d.x} cy={d.y} r={2.5} fill={CYAN} fillOpacity={0.8} />
            </g>
          ))}
          {/* Label */}
          <text x="145" y="148" textAnchor="middle" fill="#8b949e" fontSize={7}>Corner Delivery Target Zones</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: SVG — CornerConversionRing
// ============================================================

function CornerConversionRing() {
  const conversionPct = 12;
  const totalCorners = 87;

  const ringPath = useMemo(() => describeArc(85, 85, 62, 0, (conversionPct / 100) * 360), [conversionPct]);
  const bgRing = useMemo(() => describeArc(85, 85, 62, 0, 360), []);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Corner-to-Goal Conversion
        </span>
        <span className="text-[10px]" style={{ color: ORANGE }}>{totalCorners} corners</span>
      </div>
      <div className="flex justify-center">
        <svg width="170" height="170" viewBox="0 0 170 170" className="w-full max-w-[170px]">
          {/* Background ring */}
          <path d={bgRing} fill="none" stroke="#21262d" strokeWidth={14} />
          {/* Value arc */}
          <path d={ringPath} fill="none" stroke={ORANGE} strokeWidth={14} strokeLinecap="round" strokeOpacity={0.85} />
          {/* Center text */}
          <text x="85" y="78" textAnchor="middle" dominantBaseline="middle" fill={ORANGE} fontSize={30} fontWeight="bold" fontFamily="monospace">
            {conversionPct}%
          </text>
          <text x="85" y="102" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={9}>
            Conversion
          </text>
          {/* Secondary stats */}
          <text x="85" y="120" textAnchor="middle" dominantBaseline="middle" fill="#484f58" fontSize={8}>
            ~{Math.round(totalCorners * conversionPct / 100)} goals from {totalCorners} corners
          </text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: Corner Routines Tab
// ============================================================

function CornerRoutinesTab() {
  const { gameState } = useGameStore();
  const playerName = gameState?.player.name ?? 'Player';
  const clubName = gameState?.currentClub.name ?? 'Club';

  const [selectedRoutine, setSelectedRoutine] = useState(CORNER_ROUTINES[0].id);
  const [practiceCount, setPracticeCount] = useState(0);
  const [goalsScored, setGoalsScored] = useState(0);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handlePracticeRoutine = useCallback(() => {
    const routine = CORNER_ROUTINES.find((r) => r.id === selectedRoutine);
    if (!routine) return;
    const roll = Math.random() * 100;
    const scored = roll < routine.successRate;
    const result = scored ? 'Goal from Corner!' : 'No conversion';
    setLastResult(result);
    setPracticeCount((prev) => prev + 1);
    if (scored) {
      setGoalsScored((prev) => prev + 1);
    }
  }, [selectedRoutine]);

  const practiceSuccessRate = useMemo(() => {
    if (practiceCount === 0) return 0;
    return Math.round((goalsScored / practiceCount) * 100);
  }, [practiceCount, goalsScored]);

  const activeRoutine = CORNER_ROUTINES.find((r) => r.id === selectedRoutine);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {/* Header */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4" style={{ color: LIME }} />
            <span className={`text-sm font-bold ${TEXT_PRIMARY}`}>Corner Routines</span>
          </div>
          <span className="text-xs font-bold" style={{ color: LIME }}>{practiceSuccessRate}%</span>
        </div>
        <p className={`text-[10px] ${TEXT_SECONDARY} mt-1`}>{playerName} — {clubName}</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={staggerChild} className="grid grid-cols-3 gap-2">
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: LIME }}>{practiceCount}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Practiced</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: ORANGE }}>{goalsScored}</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Goals</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-base font-bold" style={{ color: CYAN }}>{practiceSuccessRate}%</span>
          <span className={`block text-[9px] ${TEXT_SECONDARY} mt-0.5`}>Success</span>
        </div>
      </motion.div>

      {/* Routine Selector */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Select Routine</span>
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {CORNER_ROUTINES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoutine(r.id)}
              className="p-2 rounded-lg text-left transition-colors border"
              style={selectedRoutine === r.id
                ? { backgroundColor: '#21262d', borderColor: `${LIME}60` }
                : { backgroundColor: '#0d1117', borderColor: '#30363d' }
              }
            >
              <span className={`text-[11px] font-semibold ${selectedRoutine === r.id ? TEXT_PRIMARY : TEXT_SECONDARY}`}>
                {r.name}
              </span>
              <span className="block text-[9px] mt-0.5" style={{ color: selectedRoutine === r.id ? LIME : '#484f58' }}>
                {r.description}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px]" style={{ color: LIME }}>{r.successRate}%</span>
                {selectedRoutine === r.id && (
                  <ArrowRight className="h-3 w-3" style={{ color: LIME }} />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Active Routine Detail */}
      {activeRoutine && (
        <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-1.5">
            <Info className="h-3.5 w-3.5" style={{ color: LIME }} />
            <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{activeRoutine.name} Detail</span>
          </div>
          <p className={`text-[10px] ${TEXT_SECONDARY} leading-relaxed`}>{activeRoutine.detail}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px]" style={{ color: LIME }}>Success: {activeRoutine.successRate}%</span>
            <span className="text-[10px] text-[#484f58]">Type: {activeRoutine.type}</span>
          </div>
        </motion.div>
      )}

      {/* Practice Button */}
      <motion.div variants={staggerChild}>
        <button
          onClick={handlePracticeRoutine}
          className="w-full py-3 rounded-lg text-[#0d1117] font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: LIME }}
        >
          <Play className="h-4 w-4" />
          Practice Routine
        </button>
        {lastResult && (
          <p className="text-xs text-center mt-1.5 font-medium" style={{
            color: lastResult.includes('Goal') ? LIME : ORANGE,
          }}>
            {lastResult}
          </p>
        )}
      </motion.div>

      {/* SVG Visualizations */}
      <motion.div variants={staggerChild}>
        <RoutineSuccessBars selectedRoutine={selectedRoutine} />
      </motion.div>
      <motion.div variants={staggerChild}>
        <DeliveryZoneScatter />
      </motion.div>
      <motion.div variants={staggerChild}>
        <CornerConversionRing />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 4: SVG — SeasonSetPieceDonut
// ============================================================

function SeasonSetPieceDonut() {
  const segments = useMemo(() => {
    const fkGoals = SEASON_LOGS.reduce<number>((acc, log) => acc + log.setPieceGoals, 0);
    const cornerGoals = Math.round(fkGoals * 0.4);
    const penaltyGoals = Math.round(fkGoals * 0.35);
    const otherGoals = Math.round(fkGoals * 0.25);
    const total = fkGoals + cornerGoals + penaltyGoals + otherGoals || 1;
    return [
      { label: 'Free Kick Goals', value: fkGoals, color: ORANGE },
      { label: 'Corner Goals', value: cornerGoals, color: CYAN },
      { label: 'Penalty Goals', value: penaltyGoals, color: LIME },
      { label: 'Other', value: otherGoals, color: DGRAY },
    ].map((s) => ({ ...s, pct: (s.value / total) * 100 }));
  }, []);

  const totalGoals = useMemo(() => {
    return segments.reduce<number>((acc, s) => acc + s.value, 0);
  }, [segments]);

  const arcPaths = useMemo(() => {
    const paths: { d: string; color: string }[] = [];
    let currentAngle = 0;
    segments.forEach((seg) => {
      if (seg.pct < 0.5) {
        currentAngle += seg.pct * 3.6;
        return;
      }
      const startAngle = currentAngle;
      const endAngle = startAngle + seg.pct * 3.6;
      const d = describeDonutArc(100, 100, 78, 46, startAngle, endAngle);
      paths.push({ d, color: seg.color });
      currentAngle = endAngle;
    });
    return paths;
  }, [segments]);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Season Set Piece Breakdown
        </span>
        <span className="text-[10px]" style={{ color: ORANGE }}>{totalGoals} total</span>
      </div>
      <div className="flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="w-full max-w-[200px]">
          {/* Donut segments */}
          {arcPaths.map((seg, i) => (
            <path key={i} d={seg.d} fill={seg.color} fillOpacity={0.8} />
          ))}
          {/* Center text */}
          <text x="100" y="93" textAnchor="middle" dominantBaseline="middle" fill="#c9d1d9" fontSize={20} fontWeight="bold" fontFamily="monospace">
            {totalGoals}
          </text>
          <text x="100" y="112" textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={9}>
            Total Goals
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-[#8b949e]">{seg.label}</span>
            <span className="text-[10px] font-bold ml-auto" style={{ color: seg.color }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: SVG — SetPieceRatingTrend
// ============================================================

function SetPieceRatingTrend() {
  const points = useMemo(() => {
    return SEASON_LOGS.reduce<{ x: number; y: number }[]>((acc, log, i) => {
      const px = 35 + i * 30;
      const py = 115 - ((log.rating - 5) / 5) * 85;
      return [...acc, { x: px, y: Math.max(15, Math.min(118, py)) }];
    }, []);
  }, []);

  const linePointsStr = useMemo(() => buildPointsStr(points.map((p) => [p.x, p.y] as [number, number])), [points]);

  const areaPointsStr = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return '';
    const areaCoords: [number, number][] = [
      [first.x, 125],
      ...points.map((p) => [p.x, p.y] as [number, number]),
      [last.x, 125],
    ];
    return buildPointsStr(areaCoords);
  }, [points]);

  const avgRating = useMemo(() => {
    if (SEASON_LOGS.length === 0) return 0;
    const total = SEASON_LOGS.reduce<number>((acc, log) => acc + log.rating, 0);
    return (total / SEASON_LOGS.length).toFixed(1);
  }, []);

  const maxRating = useMemo(() => {
    return SEASON_LOGS.reduce<number>((acc, log) => Math.max(acc, log.rating), 0);
  }, []);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Set Piece Rating Trend
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: CYAN }}>Avg: {avgRating}</span>
          <span className="text-[10px]" style={{ color: LIME }}>Best: {maxRating}</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width="290" height="160" viewBox="0 0 290 160" className="w-full max-w-[290px]">
          {/* Y-axis */}
          <line x1="30" y1="12" x2="30" y2="125" stroke="#30363d" strokeWidth={1} />
          {/* X-axis */}
          <line x1="30" y1="125" x2="280" y2="125" stroke="#30363d" strokeWidth={1} />
          {/* Y-axis labels */}
          <text x="25" y="16" textAnchor="end" fill="#8b949e" fontSize={7}>10</text>
          <text x="25" y="42" textAnchor="end" fill="#8b949e" fontSize={7}>8</text>
          <text x="25" y="68" textAnchor="end" fill="#8b949e" fontSize={7}>6</text>
          <text x="25" y="94" textAnchor="end" fill="#8b949e" fontSize={7}>4</text>
          <text x="25" y="128" textAnchor="end" fill="#8b949e" fontSize={7}>2</text>
          {/* Grid lines */}
          {[30, 55, 80, 105].map((yv) => (
            <line key={`trg${yv}`} x1="30" y1={yv} x2="280" y2={yv} stroke="#21262d" strokeWidth={0.5} strokeOpacity={0.5} />
          ))}
          {/* X-axis match labels */}
          {SEASON_LOGS.map((log, i) => (
            <text key={`trlbl${i}`} x={35 + i * 30} y="140" textAnchor="middle" fill="#8b949e" fontSize={6}>
              {log.opponent.slice(0, 3)}
            </text>
          ))}
          {/* Area fill */}
          {areaPointsStr && (
            <polygon points={areaPointsStr} fill={CYAN} fillOpacity={0.07} />
          )}
          {/* Line */}
          {linePointsStr && (
            <polyline points={linePointsStr} fill="none" stroke={CYAN} strokeWidth={2} strokeLinejoin="round" />
          )}
          {/* Data points with values */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill={CYAN} fillOpacity={0.9} stroke="#0d1117" strokeWidth={1} />
              <text x={p.x} y={p.y - 9} textAnchor="middle" fill={CYAN} fontSize={7} fontWeight="bold">
                {SEASON_LOGS[i]?.rating.toFixed(1)}
              </text>
            </g>
          ))}
          {/* Axis titles */}
          <text x="155" y="156" textAnchor="middle" fill="#8b949e" fontSize={7}>Last 8 Matches</text>
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: SVG — OverallSetPieceRadar
// ============================================================

function OverallSetPieceRadar() {
  const cx = 105;
  const cy = 105;
  const maxR = 75;

  const axes = useMemo(() => {
    return [
      { label: 'Accuracy', value: 78 },
      { label: 'Power', value: 65 },
      { label: 'Deception', value: 82 },
      { label: 'Consistency', value: 71 },
      { label: 'Variety', value: 88 },
    ];
  }, []);

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const radarPointsStr = useMemo(() => {
    const coords: [number, number][] = axes.map((ax, i) => {
      const angle = (i / axes.length) * 360 - 90;
      const r = (ax.value / 100) * maxR;
      const pt = polarToCart(cx, cy, r, angle);
      return [pt.x, pt.y];
    });
    return buildPointsStr(coords);
  }, [axes, cx, cy, maxR]);

  const gridPointsStrs = useMemo(() => {
    return gridRings.map((ring) => {
      const coords: [number, number][] = axes.map((_ax, i) => {
        const angle = (i / axes.length) * 360 - 90;
        const r = ring * maxR;
        const pt = polarToCart(cx, cy, r, angle);
        return [pt.x, pt.y];
      });
      return buildPointsStr(coords);
    });
  }, [axes, gridRings, cx, cy, maxR]);

  const avgScore = useMemo(() => {
    const total = axes.reduce<number>((acc, ax) => acc + ax.value, 0);
    return Math.round(total / axes.length);
  }, [axes]);

  return (
    <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>
          Set Piece Skill Radar
        </span>
        <span className="text-[10px] font-bold" style={{ color: ORANGE }}>
          OVR: {avgScore}
        </span>
      </div>
      <div className="flex justify-center">
        <svg width="210" height="210" viewBox="0 0 210 210" className="w-full max-w-[210px]">
          {/* Grid rings */}
          {gridPointsStrs.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth={0.8} />
          ))}
          {/* Axis lines */}
          {axes.map((_ax, i) => {
            const angle = (i / axes.length) * 360 - 90;
            const pt = polarToCart(cx, cy, maxR, angle);
            return (
              <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#30363d" strokeWidth={0.5} />
            );
          })}
          {/* Data area */}
          {radarPointsStr && (
            <polygon
              points={radarPointsStr}
              fill={ORANGE}
              fillOpacity={0.18}
              stroke={ORANGE}
              strokeWidth={2}
            />
          )}
          {/* Data dots and labels */}
          {axes.map((ax, i) => {
            const angle = (i / axes.length) * 360 - 90;
            const r = (ax.value / 100) * maxR;
            const pt = polarToCart(cx, cy, r, angle);
            const labelPt = polarToCart(cx, cy, maxR + 16, angle);
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={3.5} fill={ORANGE} stroke="#0d1117" strokeWidth={1} />
                <text
                  x={labelPt.x} y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#8b949e"
                  fontSize={8}
                >
                  {ax.label}
                </text>
                <text
                  x={labelPt.x}
                  y={labelPt.y + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={ORANGE}
                  fontSize={7}
                  fontWeight="bold"
                >
                  {ax.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Set Piece Analytics Tab
// ============================================================

function SetPieceAnalyticsTab() {
  const { gameState } = useGameStore();
  const playerName = gameState?.player.name ?? 'Player';
  const clubName = gameState?.currentClub.name ?? 'Club';
  const season = gameState?.currentSeason ?? 1;

  const totalSetPieceGoals = useMemo(() => {
    return SEASON_LOGS.reduce<number>((acc, log) => acc + log.setPieceGoals, 0);
  }, []);

  const avgRating = useMemo(() => {
    if (SEASON_LOGS.length === 0) return '0.0';
    const total = SEASON_LOGS.reduce<number>((acc, log) => acc + log.rating, 0);
    return (total / SEASON_LOGS.length).toFixed(1);
  }, []);

  const matchesPlayed = SEASON_LOGS.length;

  const topMatch = useMemo(() => {
    return SEASON_LOGS.reduce<MatchSetPieceLog>((best, log) => {
      return log.rating > best.rating ? log : best;
    }, SEASON_LOGS[0] ?? { id: 0, opponent: '-', competition: '-', setPieceGoals: 0, rating: 0 });
  }, []);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {/* Header */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" style={{ color: ORANGE }} />
            <span className={`text-sm font-bold ${TEXT_PRIMARY}`}>Set Piece Analytics</span>
          </div>
          <span className="text-xs font-bold" style={{ color: ORANGE }}>Season {season}</span>
        </div>
        <p className={`text-[10px] ${TEXT_SECONDARY} mt-1`}>{playerName} — {clubName}</p>
      </motion.div>

      {/* Summary Stats Grid */}
      <motion.div variants={staggerChild} className="grid grid-cols-4 gap-2">
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-lg font-bold" style={{ color: ORANGE }}>{totalSetPieceGoals}</span>
          <span className={`block text-[8px] ${TEXT_SECONDARY} mt-0.5`}>SP Goals</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-lg font-bold" style={{ color: CYAN }}>{avgRating}</span>
          <span className={`block text-[8px] ${TEXT_SECONDARY} mt-0.5`}>Avg Rating</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-lg font-bold" style={{ color: LIME }}>{matchesPlayed}</span>
          <span className={`block text-[8px] ${TEXT_SECONDARY} mt-0.5`}>Matches</span>
        </div>
        <div className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-2.5 text-center`}>
          <span className="text-lg font-bold" style={{ color: ORANGE }}>{topMatch.rating.toFixed(1)}</span>
          <span className={`block text-[8px] ${TEXT_SECONDARY} mt-0.5`}>Best</span>
        </div>
      </motion.div>

      {/* Match Log */}
      <motion.div variants={staggerChild} className={`${CARD_BG} ${BORDER_COLOR} border rounded-lg p-3`}>
        <span className={`text-xs ${TEXT_SECONDARY} uppercase tracking-wide font-medium`}>Season Match Log</span>
        <div className="mt-2 space-y-0">
          {SEASON_LOGS.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-[#21262d] last:border-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-6 rounded-sm"
                  style={{
                    backgroundColor: log.setPieceGoals >= 2 ? LIME : log.setPieceGoals === 1 ? CYAN : DGRAY,
                  }}
                />
                <div>
                  <span className={`text-xs ${TEXT_PRIMARY}`}>{log.opponent}</span>
                  <span className="text-[9px] text-[#484f58] ml-1.5">{log.competition}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold" style={{
                  color: log.setPieceGoals > 0 ? LIME : DGRAY,
                }}>
                  {log.setPieceGoals} {log.setPieceGoals === 1 ? 'goal' : 'goals'}
                </span>
                <span className="text-[10px] font-bold min-w-[28px] text-right" style={{
                  color: log.rating >= 7.5 ? CYAN : log.rating >= 7 ? LIME : TEXT_SECONDARY,
                }}>
                  {log.rating.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG Visualizations */}
      <motion.div variants={staggerChild}>
        <SeasonSetPieceDonut />
      </motion.div>
      <motion.div variants={staggerChild}>
        <SetPieceRatingTrend />
      </motion.div>
      <motion.div variants={staggerChild}>
        <OverallSetPieceRadar />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Component — SetPieceTrainerEnhanced
// ============================================================

export default function SetPieceTrainerEnhanced() {
  const [activeTab, setActiveTab] = useState('free-kicks');

  return (
    <div className={`${DARK_BG} min-h-screen p-4 pb-24`}>
      <div className="max-w-lg mx-auto">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${TEXT_PRIMARY} tracking-tight`}>
            Set Piece Trainer
          </h1>
          <p className={`text-xs ${TEXT_SECONDARY} mt-0.5`}>
            Master every dead-ball situation with interactive practice and analytics
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg h-10">
            <TabsTrigger
              value="free-kicks"
              className="flex-1 text-[11px] font-medium data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] rounded-md gap-1"
            >
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Free Kicks</span>
              <span className="sm:hidden">FK</span>
            </TabsTrigger>
            <TabsTrigger
              value="penalties"
              className="flex-1 text-[11px] font-medium data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] rounded-md gap-1"
            >
              <Crosshair className="h-3 w-3" />
              <span className="hidden sm:inline">Penalties</span>
              <span className="sm:hidden">PEN</span>
            </TabsTrigger>
            <TabsTrigger
              value="corners"
              className="flex-1 text-[11px] font-medium data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] rounded-md gap-1"
            >
              <Flag className="h-3 w-3" />
              <span className="hidden sm:inline">Corners</span>
              <span className="sm:hidden">COR</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-1 text-[11px] font-medium data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] rounded-md gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">ANA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="free-kicks" className="mt-4">
            <FreeKickMasteryTab />
          </TabsContent>
          <TabsContent value="penalties" className="mt-4">
            <PenaltySpecialistTab />
          </TabsContent>
          <TabsContent value="corners" className="mt-4">
            <CornerRoutinesTab />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <SetPieceAnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
