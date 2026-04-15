'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute, PlayerAttributes, Position } from '@/lib/game/types';
import { getAttributeCategory, getPositionCategory, getPositionColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, TrendingUp, Footprints, Crosshair, Target,
  Zap, Shield, Dumbbell, Users, BarChart3, ClipboardList,
  ChevronRight, Crown, AlertTriangle, Clock, Check, Star, Swords, Percent, Trophy, User,
  Activity, Calendar, DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// -----------------------------------------------------------
// Attribute metadata
// -----------------------------------------------------------
const ATTR_META: Record<CoreAttribute, { label: string; icon: React.ReactNode; short: string }> = {
  pace:      { label: 'Pace',      icon: <Footprints className="h-3.5 w-3.5" />, short: 'PAC' },
  shooting:  { label: 'Shooting',  icon: <Crosshair className="h-3.5 w-3.5" />,  short: 'SHO' },
  passing:   { label: 'Passing',   icon: <Target className="h-3.5 w-3.5" />,    short: 'PAS' },
  dribbling: { label: 'Dribbling', icon: <Zap className="h-3.5 w-3.5" />,       short: 'DRI' },
  defending: { label: 'Defending', icon: <Shield className="h-3.5 w-3.5" />,    short: 'DEF' },
  physical:  { label: 'Physical',  icon: <Dumbbell className="h-3.5 w-3.5" />,  short: 'PHY' },
};

const ATTR_KEYS: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

// -----------------------------------------------------------
// Position weights for distributing growth
// -----------------------------------------------------------
const POS_WEIGHTS: Record<string, Record<CoreAttribute, number>> = {
  attack:     { pace: 0.20, shooting: 0.35, passing: 0.10, dribbling: 0.20, defending: 0.02, physical: 0.13 },
  midfield:   { pace: 0.10, shooting: 0.12, passing: 0.30, dribbling: 0.20, defending: 0.13, physical: 0.15 },
  defence:    { pace: 0.12, shooting: 0.02, passing: 0.10, dribbling: 0.05, defending: 0.40, physical: 0.31 },
  goalkeeping:{ pace: 0.05, shooting: 0.00, passing: 0.10, dribbling: 0.00, defending: 0.15, physical: 0.20 },
};

// -----------------------------------------------------------
// League average baselines per position
// -----------------------------------------------------------
const LEAGUE_AVG: Record<string, Record<CoreAttribute, number>> = {
  attack:     { pace: 72, shooting: 70, passing: 62, dribbling: 68, defending: 35, physical: 65 },
  midfield:   { pace: 65, shooting: 60, passing: 70, dribbling: 66, defending: 58, physical: 68 },
  defence:    { pace: 62, shooting: 40, passing: 58, dribbling: 50, defending: 72, physical: 74 },
  goalkeeping:{ pace: 45, shooting: 20, passing: 50, dribbling: 30, defending: 40, physical: 70 },
};

const LEAGUE_STD_DEV = 12;

// -----------------------------------------------------------
// Radar Chart Geometry Helpers
// -----------------------------------------------------------
const NUM_AXES = 6;
const ANGLE_STEP = (Math.PI * 2) / NUM_AXES;
const START_ANGLE = -Math.PI / 2; // Start from top

function getAxisPoint(index: number, radius: number, cx: number, cy: number): { x: number; y: number } {
  const angle = START_ANGLE + index * ANGLE_STEP;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function getPolygonPoints(values: number[], maxRadius: number, cx: number, cy: number): string {
  return values.map((val, i) => {
    const r = (val / 100) * maxRadius;
    const pt = getAxisPoint(i, r, cx, cy);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');
}

function getLabelPosition(index: number, radius: number, cx: number, cy: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const pt = getAxisPoint(index, radius, cx, cy);
  // Determine text anchor based on position
  const angle = START_ANGLE + index * ANGLE_STEP;
  const cosA = Math.cos(angle);
  let anchor: 'start' | 'middle' | 'end' = 'middle';
  if (cosA > 0.3) anchor = 'start';
  else if (cosA < -0.3) anchor = 'end';
  // Offset slightly outward
  const offset = 14;
  const ox = cx + (radius + offset) * cosA;
  const oy = cy + (radius + offset) * Math.sin(angle);
  return { x: ox, y: oy + 4, anchor };
}

// -----------------------------------------------------------
// Radar Chart Component
// -----------------------------------------------------------
interface RadarChartProps {
  playerValues: number[];
  comparisonValues: number[];
  playerLabel?: string;
  comparisonLabel?: string;
  size?: number;
  showLegend?: boolean;
  playerColor?: string;
  comparisonColor?: string;
}

function RadarChart({
  playerValues,
  comparisonValues,
  playerLabel = 'Player',
  comparisonLabel = 'Comparison',
  size = 300,
  showLegend = true,
  playerColor = '#34d399',
  comparisonColor = '#22d3ee',
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 36;

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="max-w-full"
        style={{ width: size, height: size }}
      >
        {/* Grid hexagons */}
        {gridLevels.map(level => {
          const pts = getPolygonPoints(
            ATTR_KEYS.map(() => level),
            maxR, cx, cy
          );
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke={level === 100 ? '#30363d' : '#21262d'}
              strokeWidth={level === 100 ? 1.5 : 0.75}
            />
          );
        })}

        {/* Axis lines */}
        {ATTR_KEYS.map((_, i) => {
          const pt = getAxisPoint(i, maxR, cx, cy);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="#30363d"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Comparison polygon (rendered first so it's behind) */}
        {comparisonValues.length > 0 && (
          <motion.polygon
            points={getPolygonPoints(comparisonValues, maxR, cx, cy)}
            fill={comparisonColor}
            fillOpacity={0}
            stroke={comparisonColor}
            strokeWidth={1.5}
            strokeOpacity={0.6}
            animate={{ fillOpacity: 0.12 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        )}

        {/* Player polygon */}
        <motion.polygon
          points={getPolygonPoints(playerValues, maxR, cx, cy)}
          fill={playerColor}
          fillOpacity={0}
          stroke={playerColor}
          strokeWidth={2}
          animate={{ fillOpacity: 0.18 }}
          transition={{ duration: 0.5 }}
        />

        {/* Data points for player */}
        {playerValues.map((val, i) => {
          const pt = getAxisPoint(i, (val / 100) * maxR, cx, cy);
          return (
            <circle
              key={`p-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={playerColor}
            />
          );
        })}

        {/* Data points for comparison */}
        {comparisonValues.map((val, i) => {
          const pt = getAxisPoint(i, (val / 100) * maxR, cx, cy);
          return (
            <circle
              key={`c-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              fill={comparisonColor}
            />
          );
        })}

        {/* Axis labels */}
        {ATTR_KEYS.map((key, i) => {
          const { x, y, anchor } = getLabelPosition(i, maxR, cx, cy);
          const meta = ATTR_META[key];
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor={anchor}
              fill="#c9d1d9"
              fontSize={11}
              fontWeight={700}
              fontFamily="monospace"
            >
              {meta.short}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: playerColor }} />
            <span className="text-[10px] text-[#8b949e]">{playerLabel}</span>
          </div>
          {comparisonValues.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: comparisonColor }} />
              <span className="text-[10px] text-[#8b949e]">{comparisonLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Mini Radar Preview (for summary card)
// -----------------------------------------------------------
function MiniRadar({ values }: { values: number[] }) {
  const size = 44;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 5;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      {/* Background hexagon */}
      <polygon
        points={getPolygonPoints(ATTR_KEYS.map(() => 100), maxR, cx, cy)}
        fill="none"
        stroke="#30363d"
        strokeWidth={0.75}
      />
      {/* Value polygon */}
      <motion.polygon
        points={getPolygonPoints(values, maxR, cx, cy)}
        fill="#34d399"
        fillOpacity={0}
        stroke="#34d399"
        strokeWidth={1}
        animate={{ fillOpacity: 0.25 }}
        transition={{ duration: 0.4 }}
      />
    </svg>
  );
}

// -----------------------------------------------------------
// Detailed Comparison Radar (20/40/60/80/100 grid levels)
// -----------------------------------------------------------
function DetailedComparisonRadar({
  playerValues,
  comparisonValues,
  playerLabel = 'Player',
  comparisonLabel = 'Comparison',
}: {
  playerValues: number[];
  comparisonValues: number[];
  playerLabel?: string;
  comparisonLabel?: string;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const gridLevels = [20, 40, 60, 80, 100];
  const playerColor = '#34d399';
  const compColor = '#22d3ee';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="max-w-full" style={{ width: size, height: size }}>
      {/* Grid hexagons at 20/40/60/80/100 */}
      {gridLevels.map(level => {
        const pts = getPolygonPoints(ATTR_KEYS.map(() => level), maxR, cx, cy);
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke={level === 100 ? '#30363d' : '#21262d'}
            strokeWidth={level === 100 ? 1.5 : 0.5}
          />
        );
      })}

      {/* Grid level numbers along the top axis */}
      {gridLevels.map(level => {
        const pt = getAxisPoint(0, (level / 100) * maxR, cx, cy);
        return (
          <text key={`lvl-${level}`} x={cx + 4} y={pt.y + 3} fill="#484f58" fontSize={7} fontFamily="monospace">
            {level}
          </text>
        );
      })}

      {/* Axis lines */}
      {ATTR_KEYS.map((_, i) => {
        const pt = getAxisPoint(i, maxR, cx, cy);
        return (
          <line key={`ax-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#30363d" strokeWidth={0.4} />
        );
      })}

      {/* Comparison polygon (behind) */}
      {comparisonValues.length > 0 && (
        <motion.polygon
          points={getPolygonPoints(comparisonValues, maxR, cx, cy)}
          fill={compColor}
          fillOpacity={0}
          stroke={compColor}
          strokeWidth={1.5}
          strokeOpacity={0.5}
          animate={{ fillOpacity: 0.1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      )}

      {/* Player polygon (front) */}
      <motion.polygon
        points={getPolygonPoints(playerValues, maxR, cx, cy)}
        fill={playerColor}
        fillOpacity={0}
        stroke={playerColor}
        strokeWidth={2}
        animate={{ fillOpacity: 0.15 }}
        transition={{ duration: 0.5 }}
      />

      {/* Data points + value labels for both players */}
      {ATTR_KEYS.map((key, i) => {
        const pVal = playerValues[i];
        const cVal = comparisonValues[i] ?? 0;
        const pt = getAxisPoint(i, (pVal / 100) * maxR, cx, cy);
        const ct = getAxisPoint(i, (cVal / 100) * maxR, cx, cy);
        return (
          <g key={`dp-${key}`}>
            <circle cx={pt.x} cy={pt.y} r={3} fill={playerColor} />
            <text x={pt.x + 5} y={pt.y - 4} fill={playerColor} fontSize={8} fontWeight={700} fontFamily="monospace">
              {pVal}
            </text>
            {comparisonValues.length > 0 && (
              <>
                <circle cx={ct.x} cy={ct.y} r={2.5} fill={compColor} />
                <text x={ct.x + 4} y={ct.y + 10} fill={compColor} fontSize={7} fontWeight={600} fontFamily="monospace">
                  {cVal}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Vertex labels */}
      {ATTR_KEYS.map((key, i) => {
        const { x, y, anchor } = getLabelPosition(i, maxR, cx, cy);
        const meta = ATTR_META[key];
        return (
          <text key={`vl-${key}`} x={x} y={y - 6} textAnchor={anchor} fill="#c9d1d9" fontSize={10} fontWeight={700} fontFamily="monospace">
            {meta.label}
          </text>
        );
      })}
    </svg>
  );
}

// -----------------------------------------------------------
// SVG Player Silhouette (simple placeholder)
// -----------------------------------------------------------
function PlayerSilhouetteSVG({ color = '#484f58' }: { color?: string }) {
  return (
    <svg viewBox="0 0 40 56" width={40} height={56} className="shrink-0">
      <circle cx={20} cy={12} r={8} fill={color} opacity={0.6} />
      <path d="M20 20 C12 22, 8 30, 10 38 L14 50 C14.5 52, 16 54, 18 54 L22 54 C24 54, 25.5 52, 26 50 L30 38 C32 30, 28 22, 20 20Z" fill={color} opacity={0.4} />
    </svg>
  );
}

// -----------------------------------------------------------
// NPC teammate generation (seeded pseudo-random from club name)
// -----------------------------------------------------------
interface NPCTeammate {
  name: string;
  position: Position;
  age: number;
  overall: number;
  attributes: PlayerAttributes;
}

const NPC_FIRST = ['Liam', 'Marcus', 'Ravi', 'Yuki', 'Erik', 'Davi', 'Kwame', 'Mateo', 'Lucas', 'Omar'];
const NPC_LAST = ['Chen', 'Okafor', 'Tanaka', 'Lindqvist', 'Almeida', 'Diallo', 'Rossi', 'Petrov', 'Park', 'Fernandez'];
const NPC_POSITIONS: Position[] = ['ST', 'CAM', 'CM', 'CDM', 'CB', 'LW', 'RW', 'LB', 'RB', 'GK'];

function seedHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateNPCTeammates(clubName: string, clubQuality: number, count: number = 5): NPCTeammate[] {
  const seed = seedHash(clubName);
  const teammates: NPCTeammate[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % NPC_FIRST.length;
    const name = `${NPC_FIRST[idx]} ${NPC_LAST[(seed + i * 13) % NPC_LAST.length]}`;
    const pos = NPC_POSITIONS[(seed + i * 3) % NPC_POSITIONS.length];
    const cat = getPositionCategory(pos);
    const baseQuality = Math.max(35, Math.min(90, clubQuality + ((seed + i * 17) % 20) - 10));
    const age = 18 + ((seed + i * 11) % 16);

    const baselines = LEAGUE_AVG[cat];
    const attrs: PlayerAttributes = {
      pace:      Math.max(30, Math.min(95, baselines.pace      + (((seed + i * 23) % 30) - 15))),
      shooting:  Math.max(20, Math.min(95, baselines.shooting  + (((seed + i * 29) % 30) - 15))),
      passing:   Math.max(25, Math.min(95, baselines.passing   + (((seed + i * 31) % 30) - 15))),
      dribbling: Math.max(25, Math.min(95, baselines.dribbling + (((seed + i * 37) % 30) - 15))),
      defending: Math.max(20, Math.min(95, baselines.defending + (((seed + i * 41) % 30) - 15))),
      physical:  Math.max(30, Math.min(95, baselines.physical  + (((seed + i * 43) % 30) - 15))),
    };

    const overall = Math.round(
      (attrs.pace + attrs.shooting + attrs.passing + attrs.dribbling + attrs.defending + attrs.physical) / 6
    );

    teammates.push({ name, position: pos, age, overall, attributes: attrs });
  }

  return teammates;
}

// -----------------------------------------------------------
// Tab definitions
// -----------------------------------------------------------
type TabId = 'potential' | 'teammate' | 'league' | 'development' | 'advanced';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'potential',   label: 'vs Potential', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'teammate',    label: 'vs Teammate',  icon: <Users className="h-4 w-4" /> },
  { id: 'league',      label: 'League Avg',   icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'development', label: 'Train Plan',   icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'advanced',    label: 'Advanced',    icon: <Activity className="h-4 w-4" /> },
];

// -----------------------------------------------------------
// Helper: estimate potential attributes
// -----------------------------------------------------------
function estimatePotentialAttrs(
  attrs: PlayerAttributes,
  overall: number,
  potential: number,
  position: string
): PlayerAttributes {
  const growthRoom = Math.max(0, potential - overall);
  const weights = POS_WEIGHTS[getPositionCategory(position)] ?? POS_WEIGHTS.attack;

  const result = { ...attrs };
  for (const key of ATTR_KEYS) {
    const growth = Math.round(growthRoom * (weights[key] ?? 0.1) * (0.8 + 0.4 * 0.5));
    result[key] = Math.min(99, attrs[key] + growth);
  }
  return result;
}

// -----------------------------------------------------------
// Helper: get player values array
// -----------------------------------------------------------
function getAttrValues(attrs: PlayerAttributes): number[] {
  return ATTR_KEYS.map(k => attrs[k]);
}

// -----------------------------------------------------------
// Helper: generate comparison summary text
// -----------------------------------------------------------
function generateComparisonSummary(attrs: PlayerAttributes): string {
  const pairs: [CoreAttribute, CoreAttribute][] = [
    ['shooting', 'defending'],
    ['pace', 'passing'],
    ['dribbling', 'physical'],
  ];
  const descriptors: string[] = [];

  for (const [a, b] of pairs) {
    if (attrs[a] >= 80) {
      descriptors.push(`elite ${ATTR_META[a].label.toLowerCase()}`);
    } else if (attrs[a] >= 70) {
      descriptors.push(`strong ${ATTR_META[a].label.toLowerCase()}`);
    } else if (attrs[a] <= 50) {
      descriptors.push(`weak ${ATTR_META[a].label.toLowerCase()}`);
    } else {
      descriptors.push(`average ${ATTR_META[a].label.toLowerCase()}`);
    }
  }

  // Pick the best and worst
  const sorted = ATTR_KEYS
    .map(k => ({ key: k, val: attrs[k] }))
    .sort((a, b) => b.val - a.val);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (best.val >= 85 && worst.val <= 45) {
    return `Elite ${ATTR_META[best.key].label.toLowerCase()}, needs work on ${ATTR_META[worst.key].label.toLowerCase()}`;
  }
  if (best.val >= 80) {
    return `Elite ${ATTR_META[best.key].label.toLowerCase()}, average ${ATTR_META[worst.key].label.toLowerCase()}`;
  }
  return `${ATTR_META[best.key].label} specialist, developing ${ATTR_META[worst.key].label.toLowerCase()}`;
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function PlayerComparison() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const [activeTab, setActiveTab] = useState<TabId>('potential');
  const [selectedTeammate, setSelectedTeammate] = useState<string | null>(null);

  // Derived data
  const potentialAttrs = useMemo(() => {
    if (!gameState) return null;
    const { player } = gameState;
    return estimatePotentialAttrs(player.attributes, player.overall, player.potential, player.position);
  }, [gameState]);

  const teammates = useMemo(() => {
    if (!gameState) return [];
    return generateNPCTeammates(gameState.currentClub.name, gameState.currentClub.quality);
  }, [gameState]);

  const chosenTeammate = useMemo(
    () => teammates.find(t => t.name === selectedTeammate) ?? teammates[0] ?? null,
    [teammates, selectedTeammate]
  );

  // Best teammate (highest OVR) for radar comparison
  const bestTeammate = useMemo(
    () => [...teammates].sort((a, b) => b.overall - a.overall)[0] ?? null,
    [teammates]
  );

  // Squad ranking
  const squadRank = useMemo(() => {
    if (!gameState) return null;
    const allPlayers = [...teammates, { overall: gameState.player.overall, name: gameState.player.name }];
    const sorted = [...allPlayers].sort((a, b) => b.overall - a.overall);
    const rank = sorted.findIndex(p => p.name === gameState.player.name) + 1;
    return rank;
  }, [gameState, teammates]);

  // Comparison summary text
  const comparisonSummary = useMemo(() => {
    if (!gameState) return '';
    return generateComparisonSummary(gameState.player.attributes);
  }, [gameState]);

  // League comparison with percentile calculation
  const leagueComparison = useMemo(() => {
    if (!gameState) return null;
    const cat = getPositionCategory(gameState.player.position);
    const avg = LEAGUE_AVG[cat];

    return ATTR_KEYS.map(key => {
      const val = gameState.player.attributes[key];
      const mean = avg[key];
      const z = (val - mean) / LEAGUE_STD_DEV;
      const percentile = Math.max(1, Math.min(99, Math.round(50 + z * 20)));
      const diff = val - mean;
      return { key, val, mean, percentile, diff };
    });
  }, [gameState]);

  // Development plan
  const developmentPlan = useMemo(() => {
    if (!gameState) return [];
    const { player } = gameState;
    const cat = getPositionCategory(player.position);
    const weights = POS_WEIGHTS[cat] ?? POS_WEIGHTS.attack;
    const avg = LEAGUE_AVG[cat];
    const growthRoom = Math.max(0, player.potential - player.overall);

    return ATTR_KEYS
      .map(key => {
        const val = player.attributes[key];
        const target = Math.min(99, val + Math.round(growthRoom * (weights[key] ?? 0.1)));
        const gap = target - val;
        const priority = weights[key] ?? 0.1;
        const weakness = (99 - val) * priority + (avg[key] - val) * 0.5;
        const weeksEstimate = gap > 0 ? Math.max(1, Math.ceil(gap / 0.8)) : 0;
        return {
          key,
          label: ATTR_META[key].label,
          short: ATTR_META[key].short,
          icon: ATTR_META[key].icon,
          current: val,
          target,
          gap,
          priority,
          weakness,
          weeksEstimate,
          positionWeight: weights[key] ?? 0.1,
        };
      })
      .sort((a, b) => b.weakness - a.weakness);
  }, [gameState]);

  // ── Derived data for new comparison sections (before early return) ──
  const headToHeadRecord = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}`);
    const matchesPlayed = 8 + (seed % 14);
    const playerWins = Math.floor(matchesPlayed * (0.3 + ((seed % 40) / 100)));
    const teammateWins = Math.floor(matchesPlayed * (0.2 + (((seed + 7) % 30) / 100)));
    const draws = matchesPlayed - playerWins - teammateWins;
    const playerGoals = 5 + ((seed + 13) % 20);
    const teammateGoals = 3 + ((seed + 29) % 18);
    const playerWinPct = Math.round((playerWins / matchesPlayed) * 100);
    return { matchesPlayed, playerWins, teammateWins, draws, playerGoals, teammateGoals, playerWinPct };
  }, [gameState, chosenTeammate]);

  const similarPlayers = useMemo(() => {
    if (!gameState) return [];
    const seed = seedHash(gameState.player.name + gameState.player.position);
    const similarFirst = ['Adrian', 'Felix', 'Bruno', 'Kai', 'Declan', 'Jamal', 'Pedri', 'Gavi', 'Florian', 'Dušan'];
    const similarLast = ['Müller', 'Torres', 'Fernandes', 'Havertz', 'Rice', 'Musiala', 'González', 'Wirtz', 'Diaz', 'Vlahović'];
    const similarClubs = ['Dortmund', 'Atlético', 'Man Utd', 'Arsenal', 'West Ham', 'Bayern', 'Barcelona', 'Leverkusen', 'Liverpool', 'Juventus'];
    const similarPositions: Position[] = ['ST', 'CAM', 'CM', 'CF', 'LW', 'RW', 'CDM', 'CB'];
    const result: { name: string; club: string; position: Position; overall: number; similarity: number; posMatch: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = (seed + i * 11) % similarFirst.length;
      const name = `${similarFirst[idx]} ${similarLast[(seed + i * 17) % similarLast.length]}`;
      const club = similarClubs[(seed + i * 23) % similarClubs.length];
      const pos = similarPositions[(seed + i * 31) % similarPositions.length];
      const ovr = Math.max(55, Math.min(92, gameState.player.overall + ((seed + i * 19) % 20) - 10));
      const similarity = Math.max(72, Math.min(95, 80 + ((seed + i * 13) % 16)));
      const posMatch = pos === gameState.player.position;
      result.push({ name, club, position: pos, overall: ovr, similarity, posMatch });
    }
    return result;
  }, [gameState]);

  const comparisonVerdict = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const diffs = ATTR_KEYS.map(key => ({
      key,
      label: ATTR_META[key].label,
      diff: gameState.player.attributes[key] - chosenTeammate.attributes[key],
    }));
    const playerWinsCount = diffs.filter(d => d.diff > 0).length;
    const teammateWinsCount = diffs.filter(d => d.diff < 0).length;
    const overallWinner = playerWinsCount > teammateWinsCount ? 'player' : teammateWinsCount > playerWinsCount ? 'teammate' : 'tie';
    const topDiff = [...diffs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 3);
    return { diffs, playerWinsCount, teammateWinsCount, overallWinner, topDiff };
  }, [gameState, chosenTeammate]);

  // ── Season-by-Season Comparison Data ──
  const seasonComparisonData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seasons: string[] = ['20/21', '21/22', '22/23', '23/24', '24/25'];
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}-seasons`);
    const playerRatings: number[] = [];
    const teammateRatings: number[] = [];
    for (let i = 0; i < seasons.length; i++) {
      const baseRating = gameState.player.overall - (seasons.length - 1 - i) * 3;
      const variance = ((seed + i * 17) % 10) - 5;
      playerRatings.push(Math.max(40, Math.min(95, baseRating + variance)));
      const tBase = chosenTeammate.overall - (seasons.length - 1 - i) * 2;
      const tVar = ((seed + i * 23) % 12) - 6;
      teammateRatings.push(Math.max(40, Math.min(95, tBase + tVar)));
    }
    return { seasons, playerRatings, teammateRatings };
  }, [gameState, chosenTeammate]);

  // ── Advanced Metrics Data ──
  const advancedMetrics = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}-adv`);
    const defs: { key: string; label: string; unit: string; isPercent: boolean }[] = [
      { key: 'xG90', label: 'xG per 90', unit: '', isPercent: false },
      { key: 'xA90', label: 'xA per 90', unit: '', isPercent: false },
      { key: 'shotConv', label: 'Shot Conversion', unit: '%', isPercent: true },
      { key: 'keyPasses', label: 'Key Passes/90', unit: '', isPercent: false },
      { key: 'dribbleSuc', label: 'Dribble Success', unit: '%', isPercent: true },
      { key: 'aerialWin', label: 'Aerial Win %', unit: '%', isPercent: true },
      { key: 'progPasses', label: 'Prog. Passes/90', unit: '', isPercent: false },
      { key: 'pressures', label: 'Pressures/90', unit: '', isPercent: false },
      { key: 'tackleSuc', label: 'Tackle Success', unit: '%', isPercent: true },
      { key: 'passes90', label: 'Passes per 90', unit: '', isPercent: false },
    ];
    type MetricWinner = 'player' | 'teammate' | 'tie';
    type MetricEntry = {
      key: string; label: string; unit: string;
      playerValue: number; teammateValue: number; winner: MetricWinner;
    };
    const result: MetricEntry[] = defs.map((d, i) => {
      const pBase = d.isPercent
        ? 30 + (gameState.player.overall / 100) * 50
        : 0.1 + (gameState.player.overall / 100) * 0.8;
      const pVal = pBase + ((seed + i * 7) % 20) / (d.isPercent ? 1 : 10);
      const tBase = d.isPercent
        ? 30 + (chosenTeammate.overall / 100) * 50
        : 0.1 + (chosenTeammate.overall / 100) * 0.8;
      const tVal = tBase + ((seed + i * 11) % 20) / (d.isPercent ? 1 : 10);
      const pFinal = d.isPercent ? Math.round(Math.min(95, pVal)) : parseFloat(Math.min(9.99, pVal).toFixed(2));
      const tFinal = d.isPercent ? Math.round(Math.min(95, tVal)) : parseFloat(Math.min(9.99, tVal).toFixed(2));
      const winner: MetricWinner = pFinal > tFinal ? 'player' : tFinal > pFinal ? 'teammate' : 'tie';
      return { key: d.key, label: d.label, unit: d.unit, playerValue: pFinal, teammateValue: tFinal, winner };
    });
    return result;
  }, [gameState, chosenTeammate]);

  // ── Head-to-Head Match History ──
  const matchHistory = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}-h2h`);
    const competitions: string[] = ['Premier League', 'Champions League', 'FA Cup', 'League Cup', 'Friendly'];
    type MatchResult = 'win' | 'loss' | 'draw';
    type PlayerMatchStats = { goals: number; assists: number; rating: number };
    type MatchEntry = {
      date: string; competition: string; score: string; result: MatchResult;
      playerStats: PlayerMatchStats; teammateStats: PlayerMatchStats;
    };
    const matches: MatchEntry[] = [];
    for (let i = 0; i < 5; i++) {
      const month = 1 + ((seed + i * 3) % 12);
      const day = 1 + ((seed + i * 5) % 28);
      const year = 2021 + Math.floor(i * 0.8 + (seed % 3));
      const competition = competitions[(seed + i * 7) % competitions.length];
      const pGoals = (seed + i * 11) % 4;
      const tGoals = (seed + i * 13) % 4;
      const result: MatchResult = pGoals > tGoals ? 'win' : pGoals < tGoals ? 'loss' : 'draw';
      const pRating = parseFloat((6.0 + ((seed + i * 17) % 30) / 10).toFixed(1));
      const tRating = parseFloat((6.0 + ((seed + i * 19) % 30) / 10).toFixed(1));
      matches.push({
        date: `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}/${year}`,
        competition,
        score: `${pGoals} - ${tGoals}`,
        result,
        playerStats: { goals: pGoals, assists: (seed + i * 23) % 3, rating: pRating },
        teammateStats: { goals: tGoals, assists: (seed + i * 29) % 3, rating: tRating },
      });
    }
    const aggregate = {
      wins: matches.filter(m => m.result === 'win').length,
      draws: matches.filter(m => m.result === 'draw').length,
      losses: matches.filter(m => m.result === 'loss').length,
      goalsFor: matches.reduce((s, m) => s + m.playerStats.goals, 0),
      goalsAgainst: matches.reduce((s, m) => s + m.teammateStats.goals, 0),
    };
    return { matches, aggregate };
  }, [gameState, chosenTeammate]);

  // ── Playing Style Analysis Data ──
  const playingStyleData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}-style`);
    const dimensions = ['Speed', 'Technical', 'Physical', 'Creative', 'Defensive', 'Aerial'] as const;
    const playerStyle: number[] = dimensions.map((_, i) => {
      const base = gameState.player.attributes[ATTR_KEYS[i]] || 60;
      const v = ((seed + i * 7) % 15) - 7;
      return Math.max(30, Math.min(98, base + v));
    });
    const teammateStyle: number[] = dimensions.map((_, i) => {
      const base = chosenTeammate.attributes[ATTR_KEYS[i]] || 60;
      const v = ((seed + i * 11) % 15) - 7;
      return Math.max(30, Math.min(98, base + v));
    });
    const compatibility = Math.round(
      dimensions.reduce((sum, _, i) => sum + Math.min(playerStyle[i], teammateStyle[i]), 0)
      / (dimensions.length * 98) * 100
    );
    const similarityPct = Math.round(
      dimensions.reduce((sum, _, i) => sum + (100 - Math.abs(playerStyle[i] - teammateStyle[i])), 0)
      / dimensions.length
    );
    return { dimensions: [...dimensions], playerStyle, teammateStyle, compatibility, similarityPct };
  }, [gameState, chosenTeammate]);

  // ── Transfer Value Comparison Data ──
  const transferValueData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const seed = seedHash(`${gameState.player.name}-${chosenTeammate.name}-xfer`);
    const pBase = (gameState.player.overall - 40) * 1.2 + (30 - gameState.player.age) * 0.8;
    const tBase = (chosenTeammate.overall - 40) * 1.2 + (30 - chosenTeammate.age) * 0.8;
    const playerValue = Math.max(1, Math.round((pBase + ((seed % 20) - 10)) * 10) / 10);
    const teammateValue = Math.max(1, Math.round((tBase + (((seed + 7) % 20) - 10)) * 10) / 10);
    const playerWage = Math.round(playerValue * 4.5 + ((seed + 13) % 20));
    const teammateWage = Math.round(teammateValue * 4.5 + (((seed + 17) % 20)));
    const playerContract = 1 + ((seed + 3) % 5);
    const teammateContract = 1 + ((seed + 11) % 5);
    type ValueTrend = 'increasing' | 'stable' | 'decreasing';
    const playerTrend: ValueTrend = gameState.player.age < 26 ? 'increasing' : gameState.player.age < 30 ? 'stable' : 'decreasing';
    const teammateTrend: ValueTrend = chosenTeammate.age < 26 ? 'increasing' : chosenTeammate.age < 30 ? 'stable' : 'decreasing';
    const betterInvestment = playerValue / Math.max(1, playerWage) >= teammateValue / Math.max(1, teammateWage) ? 'player' : 'teammate';
    return {
      playerValue, teammateValue, playerWage, teammateWage,
      playerContract, teammateContract, playerTrend, teammateTrend, betterInvestment,
    };
  }, [gameState, chosenTeammate]);

  // ── 5-Axis Radar Data (compact) ──
  const fiveAxisRadarData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const dims = ['SPD', 'SHT', 'PAS', 'DRI', 'PHY'] as const;
    const pAttrs = gameState.player.attributes;
    const pVals = [pAttrs.pace, pAttrs.shooting, pAttrs.passing, pAttrs.dribbling, pAttrs.physical];
    const tVals = [chosenTeammate.attributes.pace, chosenTeammate.attributes.shooting, chosenTeammate.attributes.passing, chosenTeammate.attributes.dribbling, chosenTeammate.attributes.physical];
    return { dims: [...dims], pVals, tVals };
  }, [gameState, chosenTeammate]);

  // ── Donut Chart Data (4 attribute categories via reduce) ──
  const donutChartData = useMemo(() => {
    if (!gameState) return null;
    const { attributes } = gameState.player;
    type DonutSegment = { label: string; value: number; color: string; pct?: number };
    const segments: DonutSegment[] = [
      { label: 'Attack', value: attributes.pace + attributes.shooting + attributes.dribbling, color: '#FF5500' },
      { label: 'Create', value: attributes.passing + attributes.dribbling, color: '#CCFF00' },
      { label: 'Defend', value: attributes.defending + attributes.physical, color: '#00E5FF' },
      { label: 'Growth', value: Math.max(0, gameState.player.potential - gameState.player.overall), color: '#8b949e' },
    ];
    return segments;
  }, [gameState]);

  // ── Gauge Data (0-100) ──
  const gaugeData = useMemo(() => {
    if (!gameState) return null;
    const pAttrs = gameState.player.attributes;
    const fitness = Math.max(0, Math.min(100, 50 + pAttrs.physical * 0.3 + pAttrs.pace * 0.2 - (gameState.player.age - 22) * 1.5));
    return { overall: gameState.player.overall, fitness: Math.round(fitness) };
  }, [gameState]);

  // ── Area Chart Data (8 data points) ──
  const areaChartData = useMemo(() => {
    if (!gameState) return null;
    const seed = seedHash(gameState.player.name + '-area');
    const points: number[] = [];
    for (let i = 0; i < 8; i++) {
      const base = gameState.player.overall - 8 + i * 2;
      const v = ((seed + i * 13) % 14) - 7;
      points.push(Math.max(40, Math.min(95, base + v)));
    }
    return points;
  }, [gameState]);

  // ── Horizontal Bars Data (5 bars) ──
  const horizontalBarsData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const bars = ATTR_KEYS.slice(0, 5).map(key => ({
      label: ATTR_META[key].short,
      pVal: gameState.player.attributes[key],
      tVal: chosenTeammate.attributes[key],
    }));
    return bars;
  }, [gameState, chosenTeammate]);

  // ── Timeline Data (8 nodes) ──
  const timelineData = useMemo(() => {
    if (!gameState) return null;
    const milestones = ['Debut', 'First Goal', '10 Apps', 'First Assist', '50 Apps', 'Captain', '100 Apps', 'Legend'];
    const seed = seedHash(gameState.player.name + '-timeline');
    const ratings: number[] = milestones.map((_, i) => {
      const base = 55 + i * 5;
      const v = ((seed + i * 11) % 12) - 6;
      return Math.max(40, Math.min(95, base + v));
    });
    return { milestones, ratings };
  }, [gameState]);

  // ── Ring Chart Data (0-100) ──
  const ringChartData = useMemo(() => {
    if (!gameState || !chosenTeammate) return null;
    const pAttrs = gameState.player.attributes;
    const tAttrs = chosenTeammate.attributes;
    const pAvg = Math.round((pAttrs.pace + pAttrs.shooting + pAttrs.passing + pAttrs.dribbling + pAttrs.defending + pAttrs.physical) / 6);
    const tAvg = Math.round((tAttrs.pace + tAttrs.shooting + tAttrs.passing + tAttrs.dribbling + tAttrs.defending + tAttrs.physical) / 6);
    return { playerAvg: pAvg, teammateAvg: tAvg };
  }, [gameState, chosenTeammate]);

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const growthRoom = Math.max(0, player.potential - player.overall);

  const playerValues = getAttrValues(player.attributes);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#8b949e]" />
        </button>
        <h2 className="text-lg font-bold text-[#c9d1d9]">Player Comparison</h2>
      </div>

      {/* Player Summary Card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Mini radar + OVR */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MiniRadar values={playerValues} />
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#21262d] flex items-center justify-center">
                  <span className="text-lg font-black text-emerald-400">{player.overall}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{player.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs font-bold px-1.5" style={{ color: getPositionColor(player.position), borderColor: getPositionColor(player.position) }}>
                    {player.position}
                  </Badge>
                  <span className="text-xs text-[#8b949e]">Age {player.age}</span>
                  <span className="text-xs text-[#8b949e]">{currentClub.name}</span>
                </div>
                {/* Squad ranking */}
                {squadRank && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-[#8b949e]">#{squadRank} in squad</span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-[#8b949e]">POT</div>
                <div className="text-lg font-bold text-emerald-400">{player.potential}</div>
                <div className="text-[10px] text-emerald-400/70">+{growthRoom} room</div>
              </div>
            </div>
            {/* Comparison Summary */}
            <div className="mt-2.5 pt-2.5 border-t border-[#30363d]">
              <p className="text-[11px] text-[#8b949e] italic">{comparisonSummary}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
        <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ─── Tab 1: Self vs Potential ─── */}
          {activeTab === 'potential' && potentialAttrs && (
            <div className="space-y-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> Current vs Potential
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  {/* Overall comparison */}
                  <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-[10px] text-[#8b949e]">Current</div>
                      <div className="text-2xl font-black text-[#c9d1d9]">{player.overall}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-px flex-1 w-12 bg-[#30363d]" />
                      <ChevronRight className="h-4 w-4 text-emerald-400 my-1" />
                      <div className="h-px flex-1 w-12 bg-[#30363d]" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-[#8b949e]">Potential</div>
                      <div className="text-2xl font-black text-emerald-400">{player.potential}</div>
                    </div>
                  </div>

                  {/* Room to Grow */}
                  <div className="bg-[#21262d] rounded-lg p-3 text-center">
                    <div className="text-[10px] text-[#8b949e] mb-1">Room to Grow</div>
                    <div className="text-2xl font-black text-amber-400">
                      {growthRoom > 0
                        ? `${Math.round((growthRoom / (99 - player.overall + growthRoom)) * 100)}%`
                        : 'Maxed out'
                      }
                    </div>
                    <div className="text-[10px] text-[#8b949e] mt-1">
                      {growthRoom > 0
                        ? `${growthRoom} OVR points to unlock`
                        : 'You have reached your ceiling'
                      }
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <div className="flex justify-center">
                    <RadarChart
                      playerValues={playerValues}
                      comparisonValues={getAttrValues(potentialAttrs)}
                      playerLabel="Current"
                      comparisonLabel="Potential"
                      size={260}
                      playerColor="#34d399"
                      comparisonColor="#fbbf24"
                    />
                  </div>

                  {/* Attribute bars with ghost potential */}
                  {ATTR_KEYS.map((key, i) => {
                    const current = player.attributes[key];
                    const potential = potentialAttrs[key];
                    const gap = potential - current;
                    const meta = ATTR_META[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {meta.icon}
                            <span className="text-xs text-[#c9d1d9] font-medium">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-[#c9d1d9]">{current}</span>
                            <span className="text-[#8b949e]">→</span>
                            <span className="text-emerald-400 font-bold">{potential}</span>
                            {gap > 0 && (
                              <span className="text-emerald-400/60 text-[10px]">+{gap}</span>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          {/* Ghost bar for potential */}
                          <div
                            className="absolute top-0 left-0 h-2.5 border border-dashed border-[#484f58] rounded-lg"
                            style={{ width: `${potential}%` }}
                          />
                          {/* Current filled bar */}
                          <motion.div
                            className="h-2.5 bg-slate-500 rounded-lg relative z-[1]"
                            initial={{ width: 0 }}
                            animate={{ width: `${current}%` }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                          />
                          {/* Growth portion */}
                          {gap > 0 && (
                            <motion.div
                              className="h-2.5 bg-emerald-500/40 rounded-lg relative z-[1]"
                              initial={{ width: 0 }}
                              animate={{ width: `${gap}%` }}
                              transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Position Suitability */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" /> Position Suitability
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(['ST', 'LW', 'RW', 'CAM', 'CM', 'CF'] as string[]).map(pos => {
                      const cat = getPositionCategory(pos);
                      const weights = POS_WEIGHTS[cat] ?? POS_WEIGHTS.attack;
                      let score = 0;
                      for (const key of ATTR_KEYS) {
                        score += player.attributes[key] * (weights[key] ?? 0.1);
                      }
                      const maxScore = 99 * ATTR_KEYS.reduce((s, k) => s + (weights[k] ?? 0.1), 0);
                      const suitability = Math.round((score / maxScore) * 100);
                      const isPrimary = pos === player.position;
                      return (
                        <div
                          key={pos}
                          className={`rounded-lg p-2 flex items-center justify-between ${
                            isPrimary ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#21262d]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isPrimary && <Crown className="h-3 w-3 text-emerald-400" />}
                            <span className={`text-xs font-bold ${isPrimary ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                              {pos}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${isPrimary ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                            {suitability}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 2: Compare with Teammate ─── */}
          {activeTab === 'teammate' && (
            <div className="space-y-3">
              {/* Teammate selector */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3">
                  <div className="text-[10px] text-[#8b949e] font-medium mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Select Teammate
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                    {teammates.map(tm => (
                      <button
                        key={tm.name}
                        onClick={() => setSelectedTeammate(tm.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          chosenTeammate?.name === tm.name
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'hover:bg-[#21262d] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold px-1.5" style={{ color: getPositionColor(tm.position), borderColor: getPositionColor(tm.position) }}>
                            {tm.position}
                          </Badge>
                          <div className="text-left">
                            <div className={`text-xs font-medium ${chosenTeammate?.name === tm.name ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                              {tm.name}
                            </div>
                            <div className="text-[10px] text-[#8b949e]">Age {tm.age}</div>
                          </div>
                        </div>
                        <span className={`text-sm font-bold font-mono ${chosenTeammate?.name === tm.name ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                          {tm.overall}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison */}
              {chosenTeammate && (
                <>
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5" /> {player.name} vs {chosenTeammate.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {/* Side-by-side stat cards */}
                    <div className="flex gap-2">
                      <div className={`flex-1 rounded-lg p-3 text-center border ${
                        player.overall >= chosenTeammate.overall
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-[#21262d] border-[#30363d]'
                      }`}>
                        <div className="text-[10px] text-[#8b949e] mb-0.5">{player.name.split(' ')[0]}</div>
                        <div className={`text-xl font-black ${
                          player.overall >= chosenTeammate.overall ? 'text-emerald-400' : 'text-[#c9d1d9]'
                        }`}>
                          {player.overall}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold px-1"
                            style={{ color: getPositionColor(player.position), borderColor: getPositionColor(player.position) }}
                          >
                            {player.position}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="text-xs text-[#484f58] font-bold">VS</span>
                      </div>

                      <div className={`flex-1 rounded-lg p-3 text-center border ${
                        chosenTeammate.overall >= player.overall
                          ? 'bg-cyan-500/5 border-cyan-500/30'
                          : 'bg-[#21262d] border-[#30363d]'
                      }`}>
                        <div className="text-[10px] text-[#8b949e] mb-0.5">{chosenTeammate.name.split(' ')[0]}</div>
                        <div className={`text-xl font-black ${
                          chosenTeammate.overall >= player.overall ? 'text-cyan-400' : 'text-[#c9d1d9]'
                        }`}>
                          {chosenTeammate.overall}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold px-1"
                            style={{ color: getPositionColor(chosenTeammate.position), borderColor: getPositionColor(chosenTeammate.position) }}
                          >
                            {chosenTeammate.position}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="flex justify-center">
                      <RadarChart
                        playerValues={playerValues}
                        comparisonValues={getAttrValues(chosenTeammate.attributes)}
                        playerLabel={player.name.split(' ')[0]}
                        comparisonLabel={chosenTeammate.name.split(' ')[0]}
                        size={260}
                        playerColor="#34d399"
                        comparisonColor="#22d3ee"
                      />
                    </div>

                    {/* Attribute side-by-side with who-wins indicators */}
                    {ATTR_KEYS.map((key, i) => {
                      const pVal = player.attributes[key];
                      const tVal = chosenTeammate.attributes[key];
                      const diff = pVal - tVal;
                      const meta = ATTR_META[key];
                      const playerWins = diff > 0;
                      const tie = diff === 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {meta.icon}
                              <span className="text-xs text-[#c9d1d9]">{meta.label}</span>
                              {/* Who wins indicator */}
                              {playerWins && (
                                <Check className="h-3 w-3 text-emerald-400" />
                              )}
                              {!tie && !playerWins && (
                                <div className="w-3 h-3 rounded-sm bg-[#21262d] flex items-center justify-center">
                                  <div className="w-1.5 h-0.5 bg-red-400 rounded-full" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className={playerWins ? 'text-emerald-400 font-bold' : 'text-[#c9d1d9]'}>
                                {pVal}
                              </span>
                              <span className="text-[#484f58]">vs</span>
                              <span className={!tie && !playerWins ? 'text-cyan-400 font-bold' : 'text-[#c9d1d9]'}>
                                {tVal}
                              </span>
                              {diff !== 0 && (
                                <span className={`text-[10px] font-bold ${diff > 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                  {diff > 0 ? '+' : ''}{diff}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 h-2">
                            <div className="flex-1 bg-[#21262d] rounded-lg overflow-hidden flex justify-end">
                              <motion.div
                                className={`h-full rounded-lg ${diff >= 0 ? 'bg-emerald-500/60' : 'bg-slate-600/60'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pVal}%` }}
                                transition={{ delay: i * 0.05, duration: 0.2 }}
                              />
                            </div>
                            <div className="flex-1 bg-[#21262d] rounded-lg overflow-hidden">
                              <motion.div
                                className={`h-full rounded-lg ${diff <= 0 ? 'bg-cyan-500/60' : 'bg-slate-600/60'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${tVal}%` }}
                                transition={{ delay: i * 0.05 + 0.1, duration: 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Overall verdict */}
                    {(() => {
                      const wins = ATTR_KEYS.filter(k => player.attributes[k] > chosenTeammate.attributes[k]);
                      const losses = ATTR_KEYS.filter(k => player.attributes[k] < chosenTeammate.attributes[k]);
                      const draws = 6 - wins.length - losses.length;

                      // Determine which areas each player wins
                      const playerWinLabels = wins.map(k => ATTR_META[k].short);
                      const teammateWinLabels = losses.map(k => ATTR_META[k].short);

                      return (
                        <div className={`rounded-lg p-3 text-center ${
                          wins.length > losses.length ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          wins.length < losses.length ? 'bg-cyan-500/10 border border-cyan-500/30' :
                          'bg-[#21262d]'
                        }`}>
                          <div className="text-xs font-bold text-[#c9d1d9]">
                            {wins.length > losses.length ? (
                              <span className="text-emerald-400">You win {wins.length}-{losses.length}!</span>
                            ) : wins.length < losses.length ? (
                              <span className="text-cyan-400">{chosenTeammate.name.split(' ')[0]} wins {losses.length}-{wins.length}</span>
                            ) : (
                              <span className="text-[#8b949e]">Dead even! {wins.length} each</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8b949e] mt-1">
                            {wins.length} better · {draws} equal · {losses.length} worse
                          </div>
                          {/* Verdict text */}
                          <div className="text-[10px] text-[#8b949e] mt-1.5 pt-1.5 border-t border-[#30363d]">
                            {wins.length > losses.length
                              ? `You're stronger in ${playerWinLabels.join(', ')}`
                              : wins.length < losses.length
                                ? `They're stronger in ${teammateWinLabels.join(', ')}`
                                : 'Evenly matched across all areas'
                            }
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* ─── Detailed Comparison Radar ─── */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <Crosshair className="h-3.5 w-3.5" /> Detailed Attribute Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex justify-center">
                      <DetailedComparisonRadar
                        playerValues={playerValues}
                        comparisonValues={getAttrValues(chosenTeammate.attributes)}
                        playerLabel={player.name.split(' ')[0]}
                        comparisonLabel={chosenTeammate.name.split(' ')[0]}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: '#34d399' }} />
                        <span className="text-[10px] text-[#8b949e]">{player.name.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: '#22d3ee' }} />
                        <span className="text-[10px] text-[#8b949e]">{chosenTeammate.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ─── Attribute Detail Breakdown ─── */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5" /> Attribute Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Column headers */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400">{player.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-[#484f58]">ATTR</span>
                      <span className="text-[10px] font-bold text-sky-400">{chosenTeammate.name.split(' ')[0]}</span>
                    </div>
                    {ATTR_KEYS.map((key, i) => {
                      const pVal = player.attributes[key];
                      const cVal = chosenTeammate.attributes[key];
                      const diff = pVal - cVal;
                      const meta = ATTR_META[key];
                      return (
                        <div key={key} className="space-y-1">
                          {/* Values row */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold w-6 text-right ${diff >= 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{pVal}</span>
                            <div className="flex items-center gap-1.5">
                              {meta.icon}
                              <span className="text-[10px] text-[#8b949e] font-medium">{meta.short}</span>
                            </div>
                            <span className={`text-xs font-mono font-bold w-6 ${diff <= 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>{cVal}</span>
                          </div>
                          {/* Mirrored bars */}
                          <div className="flex items-center gap-1">
                            <div className="flex-1 flex justify-end">
                              <div className="w-full bg-[#21262d] rounded-sm h-1.5 overflow-hidden flex justify-end">
                                <motion.div
                                  className={`h-full rounded-sm ${diff >= 0 ? 'bg-emerald-500/70' : 'bg-emerald-500/25'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pVal}%` }}
                                  transition={{ delay: i * 0.04, duration: 0.2 }}
                                />
                              </div>
                            </div>
                            <div className="w-px h-3 bg-[#30363d] shrink-0" />
                            <div className="flex-1">
                              <div className="w-full bg-[#21262d] rounded-sm h-1.5 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-sm ${diff <= 0 ? 'bg-sky-500/70' : 'bg-sky-500/25'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${cVal}%` }}
                                  transition={{ delay: i * 0.04 + 0.1, duration: 0.2 }}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Delta + badge */}
                          <div className="flex items-center justify-between">
                            <div />
                            <div className="flex items-center gap-1.5">
                              {diff !== 0 && (
                                <span className={`text-[9px] font-bold font-mono ${diff > 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
                                  {diff > 0 ? '+' : ''}{diff}
                                </span>
                              )}
                              {diff > 0 && (
                                <Badge className="text-[8px] font-bold border-0 bg-emerald-500/20 text-emerald-400 px-1.5 py-0">
                                  Advantage
                                </Badge>
                              )}
                              {diff < 0 && (
                                <Badge className="text-[8px] font-bold border-0 bg-red-500/20 text-red-400 px-1.5 py-0">
                                  Disadvantage
                                </Badge>
                              )}
                              {diff === 0 && (
                                <span className="text-[9px] text-[#484f58]">Even</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* ─── Head-to-Head Record ─── */}
                {headToHeadRecord && (
                  <Card className="bg-[#161b22] border-[#30363d]">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                        <Swords className="h-3.5 w-3.5" /> Head-to-Head Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {/* H2H rows with comparison bars */}
                      {([
                        { label: 'Matches Against', pVal: headToHeadRecord.matchesPlayed, cVal: headToHeadRecord.matchesPlayed },
                        { label: 'Wins', pVal: headToHeadRecord.playerWins, cVal: headToHeadRecord.teammateWins },
                        { label: 'Goals Scored', pVal: headToHeadRecord.playerGoals, cVal: headToHeadRecord.teammateGoals },
                      ] as const).map((row, ri) => {
                        const maxVal = Math.max(row.pVal, row.cVal, 1);
                        const pPct = (row.pVal / maxVal) * 100;
                        const cPct = (row.cVal / maxVal) * 100;
                        return (
                          <div key={ri} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#8b949e]">{row.label}</span>
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-emerald-400 font-bold">{row.pVal}</span>
                                <span className="text-[#484f58]">-</span>
                                <span className="text-sky-400 font-bold">{row.cVal}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 flex justify-end">
                                <div className="w-full bg-[#21262d] rounded-sm h-2 overflow-hidden flex justify-end">
                                  <motion.div
                                    className="h-full rounded-sm bg-emerald-500/60"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pPct}%` }}
                                    transition={{ delay: ri * 0.1, duration: 0.2 }}
                                  />
                                </div>
                              </div>
                              <div className="w-px h-3 bg-[#30363d] shrink-0" />
                              <div className="flex-1">
                                <div className="w-full bg-[#21262d] rounded-sm h-2 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-sm bg-sky-500/60"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cPct}%` }}
                                    transition={{ delay: ri * 0.1 + 0.1, duration: 0.2 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Draws summary stat */}
                      <div className="pt-1 border-t border-[#30363d]">
                        <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5">
                          <span className="text-[10px] text-[#8b949e]">Draws</span>
                          <span className="text-sm font-black text-amber-400">{headToHeadRecord.draws}</span>
                        </div>
                      </div>
                      {/* Overall H2H verdict */}
                      <div className={`rounded-lg p-3 text-center ${
                        headToHeadRecord.playerWinPct >= 50
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'bg-sky-500/10 border border-sky-500/30'
                      }`}>
                        <div className="text-[10px] text-[#8b949e] mb-1">Overall H2H</div>
                        <Badge className={`text-xs font-bold border-0 px-3 py-0.5 ${
                          headToHeadRecord.playerWinPct >= 50
                            ? 'bg-emerald-500/25 text-emerald-400'
                            : 'bg-sky-500/25 text-sky-400'
                        }`}>
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {headToHeadRecord.playerWinPct}% Win Rate
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ─── Similar Players Carousel ─── */}
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Similar Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-4 -mx-4">
                      {similarPlayers.map((sp, i) => {
                        const posColor = getPositionColor(sp.position);
                        return (
                          <motion.div
                            key={sp.name}
                            className="shrink-0 w-[120px] bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.06, duration: 0.2 }}
                          >
                            {/* Silhouette */}
                            <div className="flex justify-center mb-2">
                              <PlayerSilhouetteSVG color={posColor} />
                            </div>
                            {/* OVR badge */}
                            <div className="flex items-center justify-between mb-1">
                              <Badge className="text-[10px] font-black border-0 bg-[#0d1117] text-white px-1.5 py-0">
                                {sp.overall}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold px-1"
                                style={{ color: posColor, borderColor: posColor }}
                              >
                                {sp.position}
                              </Badge>
                            </div>
                            {/* Name */}
                            <div className="text-[11px] font-bold text-[#c9d1d9] truncate">{sp.name}</div>
                            <div className="text-[9px] text-[#8b949e] truncate">{sp.club}</div>
                            {/* Similarity + position match */}
                            <div className="flex items-center justify-between mt-2">
                              <Badge className={`text-[8px] font-bold border-0 px-1.5 py-0 ${
                                sp.similarity >= 88
                                  ? 'bg-emerald-500/25 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                <Percent className="h-2.5 w-2.5 mr-0.5" />
                                {sp.similarity}% Similar
                              </Badge>
                              {sp.posMatch && (
                                <Badge className="text-[7px] font-bold border-0 bg-[#0d1117] text-[#c9d1d9] px-1 py-0">
                                  POS MATCH
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* ─── Comparison Summary Card ─── */}
                {comparisonVerdict && (
                  <Card className="bg-[#161b22] border-[#30363d]">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5" /> Overall Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {/* Verdict text */}
                      <div className={`rounded-lg p-3 ${
                        comparisonVerdict.overallWinner === 'player'
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : comparisonVerdict.overallWinner === 'teammate'
                            ? 'bg-sky-500/10 border border-sky-500/30'
                            : 'bg-[#21262d]'
                      }`}>
                        <div className="text-sm font-bold text-[#c9d1d9]">
                          {comparisonVerdict.overallWinner === 'player' ? (
                            <span className="text-emerald-400">{player.name.split(' ')[0]} is better overall</span>
                          ) : comparisonVerdict.overallWinner === 'teammate' ? (
                            <span className="text-sky-400">{chosenTeammate.name.split(' ')[0]} is better overall</span>
                          ) : (
                            <span className="text-amber-400">Players are evenly matched</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8b949e] mt-1">
                          Wins {comparisonVerdict.playerWinsCount}-{comparisonVerdict.teammateWinsCount} in attributes
                        </div>
                      </div>

                      {/* Key differentiators */}
                      <div>
                        <div className="text-[10px] text-[#8b949e] font-medium mb-2">Key Differentiators</div>
                        <div className="space-y-1.5">
                          {comparisonVerdict.topDiff.map((d) => {
                            const isPlayerAdvantage = d.diff > 0;
                            return (
                              <div key={d.key} className="flex items-center justify-between bg-[#21262d] rounded-md px-2.5 py-2">
                                <div className="flex items-center gap-1.5">
                                  {ATTR_META[d.key as CoreAttribute].icon}
                                  <span className="text-[11px] text-[#c9d1d9] font-medium">{d.label}</span>
                                </div>
                                <span className={`text-[10px] font-bold font-mono ${
                                  d.diff > 0 ? 'text-emerald-400' : d.diff < 0 ? 'text-sky-400' : 'text-[#484f58]'
                                }`}>
                                  {isPlayerAdvantage
                                    ? `${player.name.split(' ')[0]} +${Math.abs(d.diff)}`
                                    : d.diff < 0
                                      ? `${chosenTeammate.name.split(' ')[0]} +${Math.abs(d.diff)}`
                                      : 'Even'
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommended Transfer badge */}
                      {comparisonVerdict.overallWinner === 'teammate' && comparisonVerdict.teammateWinsCount >= 4 && (
                        <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="text-[11px] font-bold text-amber-400">Recommended Transfer Target</div>
                            <div className="text-[9px] text-[#8b949e]">
                              Consider {chosenTeammate.name} as an upgrade in {comparisonVerdict.teammateWinsCount} areas
                            </div>
                          </div>
                        </div>
                      )}
                      {comparisonVerdict.overallWinner === 'player' && comparisonVerdict.playerWinsCount >= 4 && (
                        <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-2">
                          <Star className="h-4 w-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-[11px] font-bold text-emerald-400">You\u2019re the starter</div>
                            <div className="text-[9px] text-[#8b949e]">
                              Keep your spot — you lead in {comparisonVerdict.playerWinsCount} of 6 attributes
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
              )}
            </div>
          )}

          {/* ─── Tab 3: League Average ─── */}
          {activeTab === 'league' && leagueComparison && (
            <div className="space-y-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" /> vs {player.position} League Average
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  {/* Overall percentile */}
                  {(() => {
                    const cat = getPositionCategory(player.position);
                    const avgAttrs = LEAGUE_AVG[cat];
                    const avgOvr = Math.round(ATTR_KEYS.reduce((s, k) => s + avgAttrs[k], 0) / 6);
                    const diff = player.overall - avgOvr;
                    const z = diff / LEAGUE_STD_DEV;
                    const percentile = Math.max(1, Math.min(99, Math.round(50 + z * 20)));
                    return (
                      <div className="bg-[#21262d] rounded-lg p-3 text-center">
                        <div className="text-[10px] text-[#8b949e] mb-1">Overall Percentile</div>
                        <div className={`text-3xl font-black ${percentile >= 75 ? 'text-emerald-400' : percentile >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          Top {100 - percentile}%
                        </div>
                        <div className="text-xs text-[#8b949e] mt-1">
                          Your OVR {player.overall} vs League Avg {avgOvr}
                          <span className={`ml-1 font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({diff >= 0 ? '+' : ''}{diff})
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Radar Chart: Player vs League Average */}
                  <div className="flex justify-center">
                    <RadarChart
                      playerValues={playerValues}
                      comparisonValues={ATTR_KEYS.map(k => LEAGUE_AVG[getPositionCategory(player.position)][k])}
                      playerLabel="You"
                      comparisonLabel="League Avg"
                      size={260}
                      playerColor="#34d399"
                      comparisonColor="#fbbf24"
                    />
                  </div>

                  {/* Summary stats */}
                  {(() => {
                    const aboveAvg = leagueComparison.filter(item => item.diff >= 0).length;
                    const belowAvg = leagueComparison.filter(item => item.diff < 0).length;
                    const eliteCount = leagueComparison.filter(item => item.percentile >= 90).length;
                    return (
                      <div className="flex gap-2">
                        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center">
                          <div className="text-lg font-black text-emerald-400">{aboveAvg}</div>
                          <div className="text-[10px] text-[#8b949e]">Above Avg</div>
                        </div>
                        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
                          <div className="text-lg font-black text-red-400">{belowAvg}</div>
                          <div className="text-[10px] text-[#8b949e]">Below Avg</div>
                        </div>
                        {eliteCount > 0 && (
                          <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
                            <div className="text-lg font-black text-amber-400">{eliteCount}</div>
                            <div className="text-[10px] text-[#8b949e]">Elite</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Per-attribute percentile */}
                  {leagueComparison.map((item, i) => {
                    const { key, val, mean, percentile, diff } = item;
                    const meta = ATTR_META[key];
                    const isElite = percentile >= 90;
                    const color = diff >= 8 ? 'emerald' : diff >= 0 ? 'amber' : 'red';
                    const percentileLabel =
                      percentile >= 90 ? 'Elite' :
                      percentile >= 75 ? 'Very Good' :
                      percentile >= 50 ? 'Above Average' :
                      percentile >= 25 ? 'Below Average' : 'Weak';
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {meta.icon}
                            <span className="text-xs text-[#c9d1d9]">{meta.label}</span>
                            {isElite && (
                              <Badge className="text-[8px] font-bold border-0 bg-amber-500/20 text-amber-400 px-1">
                                Elite
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="text-[9px] font-bold border-0 px-1.5"
                              style={{
                                backgroundColor: color === 'emerald' ? 'rgba(16,185,129,0.15)' : color === 'amber' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: color === 'emerald' ? '#34d399' : color === 'amber' ? '#fbbf24' : '#f87171',
                              }}
                            >
                              Top {100 - percentile}%
                            </Badge>
                            <span className="text-xs font-mono text-[#8b949e]">{percentileLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#21262d] rounded-lg overflow-hidden relative">
                            {/* League average marker */}
                            <div
                              className="absolute top-0 h-full w-0.5 bg-[#8b949e]/40 z-10"
                              style={{ left: `${mean}%` }}
                            />
                            <motion.div
                              className={`h-full rounded-lg ${color === 'emerald' ? 'bg-emerald-500/60' : color === 'amber' ? 'bg-amber-500/60' : 'bg-red-500/60'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#484f58]">
                          <span>{val} (you)</span>
                          <span>{mean} (avg)</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 4: Development Plan ─── */}
          {activeTab === 'development' && developmentPlan.length > 0 && (
            <div className="space-y-3">
              {/* Priority Summary */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" /> Training Priority
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-3 bg-[#21262d] rounded-lg p-3">
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs text-[#c9d1d9] font-medium">
                        Focus on <span className="text-amber-400 font-bold">{developmentPlan[0].label}</span> first
                      </div>
                      <div className="text-[10px] text-[#8b949e]">
                        Your biggest weakness relative to your position demands
                      </div>
                    </div>
                  </div>

                  {/* Priority list */}
                  <div className="space-y-2">
                    {developmentPlan.map((item, i) => {
                      const isTop = i === 0;
                      const barColor = isTop ? 'bg-amber-500/60' : item.gap > 3 ? 'bg-emerald-500/40' : 'bg-slate-600/40';
                      return (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.15 }}
                          className={`rounded-lg p-3 ${isTop ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-[#21262d]'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-black w-5 h-5 rounded-md flex items-center justify-center ${
                              isTop ? 'bg-amber-500/20 text-amber-400' : 'bg-[#0d1117] text-[#484f58]'
                            }`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {item.icon}
                                <span className={`text-xs font-bold ${isTop ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                                  {item.label}
                                </span>
                                {isTop && <Badge className="text-[8px] font-bold border-0 bg-amber-500/20 text-amber-400 px-1">TOP</Badge>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono text-[#c9d1d9]">
                                {item.current} <span className="text-[#484f58]">→</span>{' '}
                                <span className="text-emerald-400 font-bold">{item.target}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar showing current vs target */}
                          <div className="h-1.5 bg-[#0d1117] rounded-lg overflow-hidden mb-1.5">
                            <div className="flex h-full">
                              <motion.div
                                className={`h-full rounded-l-lg ${barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.current}%` }}
                                transition={{ delay: 0.2 + i * 0.05, duration: 0.2 }}
                              />
                              {item.gap > 0 && (
                                <motion.div
                                  className="h-full bg-emerald-500/20 rounded-r-lg"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.gap}%` }}
                                  transition={{ delay: 0.4 + i * 0.05, duration: 0.2 }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#484f58]">
                              Pos weight: {Math.round(item.positionWeight * 100)}% · Gap: +{item.gap}
                            </span>
                            {item.weeksEstimate > 0 ? (
                              <span className="text-[#8b949e]">
                                ~{item.weeksEstimate} weeks to reach target
                              </span>
                            ) : (
                              <span className="text-emerald-400/60">At ceiling</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Weekly training recommendation */}
                  <div className="mt-3 pt-3 border-t border-[#30363d]">
                    <div className="text-[10px] text-[#8b949e] mb-2">Recommended Weekly Schedule</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <Dumbbell className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">2x Focus</div>
                        <div className="text-[9px] text-[#8b949e]">{developmentPlan[0].label}</div>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <Shield className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">1x Balance</div>
                        <div className="text-[9px] text-[#8b949e]">{developmentPlan[1]?.label ?? 'Recovery'}</div>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">1x Physical</div>
                        <div className="text-[9px] text-[#8b949e]">Fitness</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 5: Advanced Comparison ─── */}
          {activeTab === 'advanced' && chosenTeammate && (
            <div className="space-y-3">
              {/* ── Season-by-Season Comparison ── */}
              {seasonComparisonData && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> Season-by-Season Ratings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex justify-center">
                      <svg viewBox="0 0 320 160" width="320" height="160" className="max-w-full">
                        {/* Y-axis */}
                        <line x1="40" y1="10" x2="40" y2="130" stroke="#30363d" strokeWidth={1} />
                        {/* X-axis */}
                        <line x1="40" y1="130" x2="300" y2="130" stroke="#30363d" strokeWidth={1} />
                        {/* Gridlines */}
                        {[40, 60, 80, 100].map((val) => {
                          const y = 130 - ((val - 40) / 60) * 120;
                          return (
                            <g key={`grid-${val}`}>
                              <line x1="40" y1={y} x2="300" y2={y} stroke="#21262d" strokeWidth={0.5} />
                              <text x="35" y={y + 3} fill="#484f58" fontSize={7} textAnchor="end" fontFamily="monospace">{val}</text>
                            </g>
                          );
                        })}
                        {/* Season labels */}
                        {seasonComparisonData.seasons.map((season, i) => {
                          const x = 40 + (i / (seasonComparisonData.seasons.length - 1)) * 260;
                          return <text key={season} x={x} y="148" fill="#8b949e" fontSize={8} textAnchor="middle" fontFamily="monospace">{season}</text>;
                        })}
                        {/* Player line */}
                        <polyline
                          points={seasonComparisonData.playerRatings.map((rating, i) => {
                            const x = 40 + (i / (seasonComparisonData.seasons.length - 1)) * 260;
                            const y = 130 - ((rating - 40) / 60) * 120;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none" stroke="#34d399" strokeWidth={2}
                        />
                        {/* Player data points */}
                        {seasonComparisonData.playerRatings.map((rating, i) => {
                          const x = 40 + (i / (seasonComparisonData.seasons.length - 1)) * 260;
                          const y = 130 - ((rating - 40) / 60) * 120;
                          return (
                            <g key={`pp-${i}`}>
                              <circle cx={x} cy={y} r={3} fill="#34d399" />
                              <text x={x} y={y - 6} fill="#34d399" fontSize={7} textAnchor="middle" fontWeight={700} fontFamily="monospace">{rating}</text>
                            </g>
                          );
                        })}
                        {/* Teammate line */}
                        <polyline
                          points={seasonComparisonData.teammateRatings.map((rating, i) => {
                            const x = 40 + (i / (seasonComparisonData.seasons.length - 1)) * 260;
                            const y = 130 - ((rating - 40) / 60) * 120;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4,2"
                        />
                        {/* Teammate data points */}
                        {seasonComparisonData.teammateRatings.map((rating, i) => {
                          const x = 40 + (i / (seasonComparisonData.seasons.length - 1)) * 260;
                          const y = 130 - ((rating - 40) / 60) * 120;
                          return (
                            <g key={`tp-${i}`}>
                              <circle cx={x} cy={y} r={2.5} fill="#38bdf8" />
                              <text x={x} y={y + 12} fill="#38bdf8" fontSize={7} textAnchor="middle" fontWeight={600} fontFamily="monospace">{rating}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 rounded-sm" style={{ backgroundColor: '#34d399' }} />
                        <span className="text-[10px] text-[#8b949e]">{player.name.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 rounded-sm" style={{ backgroundColor: '#38bdf8', borderStyle: 'dashed' }} />
                        <span className="text-[10px] text-[#8b949e]">{chosenTeammate.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Advanced Metrics Comparison ── */}
              {advancedMetrics && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Advanced Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {/* Column headers */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#34d399]">{player.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-[#484f58]">METRIC</span>
                      <span className="text-[10px] font-bold text-[#38bdf8]">{chosenTeammate.name.split(' ')[0]}</span>
                    </div>
                    {advancedMetrics.map((m, i) => {
                      const maxVal = Math.max(m.playerValue, m.teammateValue, 0.01);
                      const pPct = (m.playerValue / maxVal) * 100;
                      const tPct = (m.teammateValue / maxVal) * 100;
                      return (
                        <div key={m.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-mono font-bold w-12 text-right ${m.winner === 'player' ? 'text-[#34d399]' : 'text-[#8b949e]'}`}>
                              {m.unit === '%' ? `${m.playerValue}%` : m.playerValue}
                            </span>
                            <span className="text-[10px] text-[#8b949e]">{m.label}</span>
                            <span className={`text-[11px] font-mono font-bold w-12 ${m.winner === 'teammate' ? 'text-[#38bdf8]' : 'text-[#8b949e]'}`}>
                              {m.unit === '%' ? `${m.teammateValue}%` : m.teammateValue}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 bg-[#21262d] rounded-sm h-1.5 overflow-hidden flex justify-end">
                              <div className="h-full rounded-sm" style={{ width: `${pPct}%`, backgroundColor: m.winner === 'player' ? '#34d399' : '#30363d' }} />
                            </div>
                            <div className="w-px h-2.5 bg-[#30363d] shrink-0" />
                            <div className="flex-1 bg-[#21262d] rounded-sm h-1.5 overflow-hidden">
                              <div className="h-full rounded-sm" style={{ width: `${tPct}%`, backgroundColor: m.winner === 'teammate' ? '#38bdf8' : '#30363d' }} />
                            </div>
                          </div>
                          {/* Who Wins badge */}
                          <div className="flex justify-end">
                            {m.winner !== 'tie' && (
                              <Badge className="text-[8px] font-bold border-0 px-1.5 py-0" style={{
                                backgroundColor: m.winner === 'player' ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.15)',
                                color: m.winner === 'player' ? '#34d399' : '#38bdf8',
                              }}>
                                {m.winner === 'player' ? `${player.name.split(' ')[0]} wins` : `${chosenTeammate.name.split(' ')[0]} wins`}
                              </Badge>
                            )}
                            {m.winner === 'tie' && (
                              <span className="text-[9px] text-[#484f58]">Even</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* ── Head-to-Head Match History ── */}
              {matchHistory && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <Swords className="h-3.5 w-3.5" /> Match History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {matchHistory.matches.map((match, mi) => {
                      const resultColor = match.result === 'win' ? '#34d399' : match.result === 'loss' ? '#ef4444' : '#f59e0b';
                      const resultLabel = match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D';
                      return (
                        <motion.div
                          key={mi}
                          className="bg-[#21262d] rounded-lg p-2.5 space-y-1.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: mi * 0.06, duration: 0.15 }}
                        >
                          {/* Header row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="text-[8px] font-bold border-0 px-1.5 py-0" style={{ backgroundColor: `${resultColor}22`, color: resultColor }}>
                                {resultLabel}
                              </Badge>
                              <span className="text-[10px] text-[#8b949e]">{match.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#484f58]">{match.competition}</span>
                              <span className="text-xs font-bold text-[#c9d1d9] font-mono">{match.score}</span>
                            </div>
                          </div>
                          {/* Player stats row */}
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#8b949e]">{player.name.split(' ')[0]}</span>
                              <span className="font-mono text-[#c9d1d9]">{match.playerStats.goals}G {match.playerStats.assists}A</span>
                              <Badge className="text-[8px] font-bold border-0 px-1 py-0" style={{
                                backgroundColor: match.playerStats.rating >= 7.0 ? 'rgba(52,211,153,0.15)' : 'rgba(139,148,158,0.15)',
                                color: match.playerStats.rating >= 7.0 ? '#34d399' : '#8b949e',
                              }}>{match.playerStats.rating}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#c9d1d9]">{match.teammateStats.goals}G {match.teammateStats.assists}A</span>
                              <span className="text-[#8b949e]">{chosenTeammate.name.split(' ')[0]}</span>
                              <Badge className="text-[8px] font-bold border-0 px-1 py-0" style={{
                                backgroundColor: match.teammateStats.rating >= 7.0 ? 'rgba(56,189,248,0.15)' : 'rgba(139,148,158,0.15)',
                                color: match.teammateStats.rating >= 7.0 ? '#38bdf8' : '#8b949e',
                              }}>{match.teammateStats.rating}</Badge>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {/* Aggregate H2H stats */}
                    <div className="pt-2 border-t border-[#30363d]">
                      <div className="flex items-center justify-around bg-[#0d1117] rounded-lg p-2.5">
                        <div className="text-center">
                          <div className="text-sm font-black text-[#34d399]">{matchHistory.aggregate.wins}</div>
                          <div className="text-[9px] text-[#8b949e]">Wins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-[#f59e0b]">{matchHistory.aggregate.draws}</div>
                          <div className="text-[9px] text-[#8b949e]">Draws</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-[#ef4444]">{matchHistory.aggregate.losses}</div>
                          <div className="text-[9px] text-[#8b949e]">Losses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-black text-[#c9d1d9]">{matchHistory.aggregate.goalsFor}-{matchHistory.aggregate.goalsAgainst}</div>
                          <div className="text-[9px] text-[#8b949e]">Goals</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Playing Style Analysis ── */}
              {playingStyleData && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5" /> Playing Style Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Style compatibility */}
                    <div className={`rounded-lg p-2.5 text-center ${
                      playingStyleData.compatibility >= 70 ? 'bg-[#34d399]/10 border border-[#34d399]/30' : 'bg-[#21262d]'
                    }`}>
                      <div className="text-[10px] text-[#8b949e] mb-1">Style Compatibility</div>
                      <div className={`text-xl font-black ${playingStyleData.compatibility >= 70 ? 'text-[#34d399]' : 'text-[#f59e0b]'}`}>
                        {playingStyleData.compatibility}%
                      </div>
                      <div className="text-[9px] text-[#8b949e]">
                        {playingStyleData.compatibility >= 80 ? 'Great synergy' : playingStyleData.compatibility >= 60 ? 'Good fit' : 'Different styles'}
                      </div>
                    </div>
                    {/* Side-by-side style bars */}
                    {playingStyleData.dimensions.map((dim, i) => {
                      const pVal = playingStyleData.playerStyle[i];
                      const tVal = playingStyleData.teammateStyle[i];
                      const diff = pVal - tVal;
                      return (
                        <div key={dim} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#8b949e]">{dim}</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span className={diff >= 0 ? 'text-[#34d399]' : 'text-[#38bdf8]'}>{pVal}</span>
                              <span className="text-[#484f58]">vs</span>
                              <span className={diff < 0 ? 'text-[#38bdf8]' : 'text-[#34d399]'}>{tVal}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 h-1.5">
                            <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden flex justify-end">
                              <div className="h-full rounded-sm" style={{ width: `${pVal}%`, backgroundColor: diff >= 0 ? '#34d399' : '#34d39980' }} />
                            </div>
                            <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden">
                              <div className="h-full rounded-sm" style={{ width: `${tVal}%`, backgroundColor: diff < 0 ? '#38bdf8' : '#38bdf880' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Similarity badge */}
                    <div className="flex items-center justify-center">
                      <Badge className="text-[10px] font-bold border-0 px-3 py-1" style={{
                        backgroundColor: playingStyleData.similarityPct >= 80 ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                        color: playingStyleData.similarityPct >= 80 ? '#34d399' : '#f59e0b',
                      }}>
                        <Percent className="h-3 w-3 mr-1" />
                        {playingStyleData.similarityPct}% Similar Playing Style
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Transfer Value Comparison ── */}
              {transferValueData && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Transfer Value Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Market value comparison */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#34d399]">€{transferValueData.playerValue}M</span>
                        <span className="text-[10px] text-[#8b949e]">Market Value</span>
                        <span className="text-[10px] font-bold text-[#38bdf8]">€{transferValueData.teammateValue}M</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden flex justify-end">
                          <div className="h-full rounded-sm bg-[#34d399]" style={{ width: `${(transferValueData.playerValue / Math.max(transferValueData.playerValue, transferValueData.teammateValue)) * 100}%` }} />
                        </div>
                        <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden">
                          <div className="h-full rounded-sm bg-[#38bdf8]" style={{ width: `${(transferValueData.teammateValue / Math.max(transferValueData.playerValue, transferValueData.teammateValue)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Wage comparison */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#34d399]">€{transferValueData.playerWage}K/w</span>
                        <span className="text-[10px] text-[#8b949e]">Weekly Wage</span>
                        <span className="text-[10px] font-bold text-[#38bdf8]">€{transferValueData.teammateWage}K/w</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden flex justify-end">
                          <div className="h-full rounded-sm bg-[#34d399]/60" style={{ width: `${(transferValueData.playerWage / Math.max(transferValueData.playerWage, transferValueData.teammateWage)) * 100}%` }} />
                        </div>
                        <div className="flex-1 bg-[#21262d] rounded-sm overflow-hidden">
                          <div className="h-full rounded-sm bg-[#38bdf8]/60" style={{ width: `${(transferValueData.teammateWage / Math.max(transferValueData.playerWage, transferValueData.teammateWage)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Contract & trend row */}
                    <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5">
                      <div className="text-center">
                        <div className="text-[9px] text-[#8b949e]">Contract</div>
                        <div className="text-xs font-bold text-[#c9d1d9]">{transferValueData.playerContract}y</div>
                        <div className={`text-[8px] font-bold ${transferValueData.playerTrend === 'increasing' ? 'text-[#34d399]' : transferValueData.playerTrend === 'stable' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                          {transferValueData.playerTrend === 'increasing' ? '\u2191 Rising' : transferValueData.playerTrend === 'stable' ? '\u2192 Stable' : '\u2193 Falling'}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#484f58]">vs</div>
                      <div className="text-center">
                        <div className="text-[9px] text-[#8b949e]">Contract</div>
                        <div className="text-xs font-bold text-[#c9d1d9]">{transferValueData.teammateContract}y</div>
                        <div className={`text-[8px] font-bold ${transferValueData.teammateTrend === 'increasing' ? 'text-[#34d399]' : transferValueData.teammateTrend === 'stable' ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                          {transferValueData.teammateTrend === 'increasing' ? '\u2191 Rising' : transferValueData.teammateTrend === 'stable' ? '\u2192 Stable' : '\u2193 Falling'}
                        </div>
                      </div>
                    </div>
                    {/* Better Investment badge */}
                    <div className={`rounded-lg p-3 text-center ${
                      transferValueData.betterInvestment === 'player'
                        ? 'bg-[#34d399]/10 border border-[#34d399]/30'
                        : 'bg-[#38bdf8]/10 border border-[#38bdf8]/30'
                    }`}>
                      <Trophy className="h-4 w-4 mx-auto mb-1" style={{ color: transferValueData.betterInvestment === 'player' ? '#34d399' : '#38bdf8' }} />
                      <div className="text-[11px] font-bold" style={{ color: transferValueData.betterInvestment === 'player' ? '#34d399' : '#38bdf8' }}>
                        Better Investment: {transferValueData.betterInvestment === 'player' ? player.name.split(' ')[0] : chosenTeammate.name.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-[#8b949e] mt-0.5">
                        Higher value-to-wage ratio
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 7 NEW GRITTY FUTURISM SVG DATA VISUALIZATION SECTIONS    */}
          {/* ═══════════════════════════════════════════════════════════ */}

          {/* ── SVG 1: 5-Axis Compact Radar Chart ── */}
          {fiveAxisRadarData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Compact Radar</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {/* Pentagon grid - 3 levels */}
                    {[0.33, 0.66, 1.0].map((scale, li) => {
                      const r = 42 * scale;
                      const cx = 80; const cy = 60;
                      const pts = [0,1,2,3,4].map(i => {
                        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
                      }).join(' ');
                      return <polygon key={li} points={pts} fill="none" stroke={li === 2 ? '#30363d' : '#161b22'} strokeWidth={0.5} />;
                    })}
                    {/* Axes */}
                    {[0,1,2,3,4].map(i => {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                      const cx = 80; const cy = 60;
                      return <line key={i} x1={cx} y1={cy} x2={cx + 42 * Math.cos(angle)} y2={cy + 42 * Math.sin(angle)} stroke="#21262d" strokeWidth={0.4} />;
                    })}
                    {/* Player polygon */}
                    <polygon
                      points={fiveAxisRadarData.pVals.map((v, i) => {
                        const r = (v / 100) * 42;
                        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                        return `${(80 + r * Math.cos(angle)).toFixed(1)},${(60 + r * Math.sin(angle)).toFixed(1)}`;
                      }).join(' ')}
                      fill="#FF5500" fillOpacity={0.15} stroke="#FF5500" strokeWidth={1.5} strokeLinejoin="round"
                    />
                    {/* Teammate polygon */}
                    <polygon
                      points={fiveAxisRadarData.tVals.map((v, i) => {
                        const r = (v / 100) * 42;
                        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                        return `${(80 + r * Math.cos(angle)).toFixed(1)},${(60 + r * Math.sin(angle)).toFixed(1)}`;
                      }).join(' ')}
                      fill="#00E5FF" fillOpacity={0.08} stroke="#00E5FF" strokeWidth={1} strokeDasharray="3,2" strokeLinejoin="round"
                    />
                    {/* Axis labels */}
                    {fiveAxisRadarData.dims.map((dim, i) => {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                      const lx = 80 + 52 * Math.cos(angle);
                      const ly = 60 + 52 * Math.sin(angle);
                      return <text key={dim} x={lx} y={ly + 3} fill="#8b949e" fontSize={8} textAnchor="middle" fontFamily="monospace" fontWeight={700}>{dim}</text>;
                    })}
                    {/* Legend on right side */}
                    <line x1="150" y1="30" x2="165" y2="30" stroke="#FF5500" strokeWidth={2} strokeLinecap="round" />
                    <text x="170" y="33" fill="#c9d1d9" fontSize={8} fontFamily="monospace">{player.name.split(' ')[0]}</text>
                    <line x1="150" y1="48" x2="165" y2="48" stroke="#00E5FF" strokeWidth={1} strokeDasharray="3,2" strokeLinecap="round" />
                    <text x="170" y="51" fill="#8b949e" fontSize={8} fontFamily="monospace">{chosenTeammate?.name.split(' ')[0]}</text>
                    {/* Stat summary */}
                    <text x="150" y="78" fill="#484f58" fontSize={7} fontFamily="monospace">ATK CRE DEF PHY</text>
                    <text x="150" y="92" fill="#FF5500" fontSize={8} fontFamily="monospace" fontWeight={700}>
                      {fiveAxisRadarData.pVals.slice(0,3).map(v => v.toString().padStart(2)).join(' ')} {fiveAxisRadarData.pVals[4]}
                    </text>
                    <text x="150" y="106" fill="#00E5FF" fontSize={8} fontFamily="monospace" fontWeight={600}>
                      {fiveAxisRadarData.tVals.slice(0,3).map(v => v.toString().padStart(2)).join(' ')} {fiveAxisRadarData.tVals[4]}
                    </text>
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── SVG 2: Donut Chart (4 segments via reduce, each has color) ── */}
          {donutChartData && (() => {
            const total = donutChartData.reduce((sum, s) => sum + s.value, 0);
            const filteredSegments = donutChartData.filter((s): s is typeof s & { color: string } => Boolean(s.color));
            let cumAngle = 0;
            const paths = filteredSegments.map(seg => {
              const pct = total > 0 ? seg.value / total : 0;
              const startAngle = cumAngle;
              cumAngle += pct * 2 * Math.PI;
              const endAngle = cumAngle;
              const cx = 60; const cy = 60; const r = 38; const innerR = 24;
              const largeArc = pct > 0.5 ? 1 : 0;
              const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
              const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
              const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
              const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);
              const x3 = cx + innerR * Math.cos(endAngle - Math.PI / 2);
              const y3 = cy + innerR * Math.sin(endAngle - Math.PI / 2);
              const x4 = cx + innerR * Math.cos(startAngle - Math.PI / 2);
              const y4 = cy + innerR * Math.sin(startAngle - Math.PI / 2);
              const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
              return { ...seg, pct, d };
            });
            return (
              <motion.div key="donut" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <Card className="bg-[#0d1117] border-[#21262d]">
                  <CardHeader className="pb-1 pt-2 px-3">
                    <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Attribute Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                      {paths.map((seg, i) => (
                        <motion.path key={i} d={seg.d} fill={seg.color} fillOpacity={0} stroke="#0d1117" strokeWidth={2} strokeLinejoin="round" animate={{ fillOpacity: 0.8 }} transition={{ duration: 0.5, delay: i * 0.1 }} />
                      ))}
                      {/* Center text */}
                      <text x={60} y={57} fill="#c9d1d9" fontSize={16} fontWeight={900} textAnchor="middle" fontFamily="monospace">{total}</text>
                      <text x={60} y={70} fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">TOTAL PTS</text>
                      {/* Legend */}
                      {filteredSegments.map((seg, i) => (
                        <g key={`leg-${i}`}>
                          <rect x="120" y={18 + i * 22} width={10} height={10} fill={seg.color} opacity={0.85} rx="1" />
                          <text x="136" y={27 + i * 22} fill="#c9d1d9" fontSize={9} fontFamily="monospace" fontWeight={600}>{seg.label}</text>
                          <text x="210" y={27 + i * 22} fill="#8b949e" fontSize={9} fontFamily="monospace">{seg.value}pts</text>
                          <text x="260" y={27 + i * 22} fill="#484f58" fontSize={8} fontFamily="monospace">{Math.round((seg.pct ?? 0) * 100)}%</text>
                        </g>
                      ))}
                    </svg>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })()}

          {/* ── SVG 3: Semi-Circular Gauge (0-100) ── */}
          {gaugeData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Overall Gauge</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {/* Background arc */}
                    <path d="M 40 100 A 60 60 0 0 1 160 100" fill="none" stroke="#21262d" strokeWidth={10} strokeLinecap="round" />
                    {/* Value arc - OVR */}
                    {(() => {
                      const pct = gaugeData.overall / 100;
                      const angle = Math.PI * pct;
                      const x = 100 + 60 * Math.cos(Math.PI - angle);
                      const y = 100 - 60 * Math.sin(angle);
                      const largeArc = pct > 0.5 ? 1 : 0;
                      return <motion.path d={`M 40 100 A 60 60 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="#FF5500" strokeWidth={10} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />;
                    })()}
                    {/* Fitness arc - smaller */}
                    <path d="M 185 105 A 45 45 0 0 1 275 105" fill="none" stroke="#161b22" strokeWidth={7} strokeLinecap="round" />
                    {(() => {
                      const pct = gaugeData.fitness / 100;
                      const angle = Math.PI * pct;
                      const x = 230 + 45 * Math.cos(Math.PI - angle);
                      const y = 105 - 45 * Math.sin(angle);
                      const largeArc = pct > 0.5 ? 1 : 0;
                      return <motion.path d={`M 185 105 A 45 45 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="#CCFF00" strokeWidth={7} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />;
                    })()}
                    {/* Labels */}
                    <text x={100} y={80} fill="#c9d1d9" fontSize={22} fontWeight={900} textAnchor="middle" fontFamily="monospace">{gaugeData.overall}</text>
                    <text x={100} y={94} fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">OVR RATING</text>
                    <text x={230} y={80} fill="#CCFF00" fontSize={16} fontWeight={900} textAnchor="middle" fontFamily="monospace">{gaugeData.fitness}</text>
                    <text x={230} y={92} fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">FITNESS</text>
                    {/* Scale markers */}
                    {[0, 25, 50, 75, 100].map(v => {
                      const a = Math.PI * (1 - v / 100);
                      const x = 100 + 68 * Math.cos(a);
                      const y = 100 - 68 * Math.sin(a);
                      return <text key={v} x={x} y={y} fill="#484f58" fontSize={6} textAnchor="middle" fontFamily="monospace">{v}</text>;
                    })}
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── SVG 4: Area Chart (8 data points, 20% fill) ── */}
          {areaChartData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Performance Trend</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {/* Grid */}
                    <line x1="30" y1="10" x2="30" y2="95" stroke="#21262d" strokeWidth={0.5} />
                    <line x1="30" y1="95" x2="310" y2="95" stroke="#30363d" strokeWidth={0.5} />
                    {[40, 60, 80, 100].map(v => {
                      const y = 95 - ((v - 40) / 60) * 85;
                      return <line key={v} x1="30" y1={y} x2="310" y2={y} stroke="#161b22" strokeWidth={0.3} />;
                    })}
                    {/* Area fill (20% opacity) */}
                    {(() => {
                      const pts = areaChartData.map((v, i) => {
                        const x = 30 + (i / 7) * 280;
                        const y = 95 - ((v - 40) / 60) * 85;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      });
                      const linePoints = pts.join(' ');
                      const areaPoints = `30,95 ${linePoints} 310,95`;
                      return <polygon points={areaPoints} fill="#00E5FF" fillOpacity={0.2} stroke="none" />;
                    })()}
                    {/* Line */}
                    <polyline
                      points={areaChartData.map((v, i) => {
                        const x = 30 + (i / 7) * 280;
                        const y = 95 - ((v - 40) / 60) * 85;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none" stroke="#00E5FF" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
                    />
                    {/* Data points */}
                    {areaChartData.map((v, i) => {
                      const x = 30 + (i / 7) * 280;
                      const y = 95 - ((v - 40) / 60) * 85;
                      return (
                        <g key={`ap-${i}`}>
                          <circle cx={x} cy={y} r={2.5} fill="#00E5FF" />
                          <text x={x} y={y - 6} fill="#c9d1d9" fontSize={7} textAnchor="middle" fontFamily="monospace" fontWeight={700}>{v}</text>
                          <text x={x} y={107} fill="#484f58" fontSize={6} textAnchor="middle" fontFamily="monospace">W{i + 1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── SVG 5: Horizontal Bars Chart (5 bars) ── */}
          {horizontalBarsData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.25 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Attribute Bars</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {horizontalBarsData.map((bar, i) => {
                      const y = 10 + i * 21;
                      const pW = (bar.pVal / 100) * 160;
                      const tW = (bar.tVal / 100) * 160;
                      return (
                        <g key={bar.label}>
                          <text x="28" y={y + 9} fill="#8b949e" fontSize={8} textAnchor="end" fontFamily="monospace" fontWeight={700}>{bar.label}</text>
                          {/* Player bar */}
                          <rect x="32" y={y + 1} width={pW} height={7} fill="#FF5500" opacity={0.85} rx="1" />
                          <text x={pW + 36} y={y + 8} fill="#FF5500" fontSize={7} fontFamily="monospace" fontWeight={700}>{bar.pVal}</text>
                          {/* Teammate bar */}
                          <rect x="32" y={y + 10} width={tW} height={5} fill="#00E5FF" opacity={0.5} rx="1" />
                          <text x={tW + 36} y={y + 15} fill="#00E5FF" fontSize={6} fontFamily="monospace">{bar.tVal}</text>
                        </g>
                      );
                    })}
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── SVG 6: Timeline Chart (8 nodes) ── */}
          {timelineData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Career Timeline</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {/* Timeline track */}
                    <line x1="20" y1="55" x2="300" y2="55" stroke="#21262d" strokeWidth={2} strokeLinecap="round" />
                    {/* Nodes and labels */}
                    {timelineData.milestones.map((m, i) => {
                      const x = 20 + (i / 7) * 280;
                      const rating = timelineData.ratings[i];
                      const color = rating >= 80 ? '#CCFF00' : rating >= 65 ? '#FF5500' : '#484f58';
                      return (
                        <g key={m}>
                          <circle cx={x} cy={55} r={6} fill="#0d1117" stroke={color} strokeWidth={2} />
                          <circle cx={x} cy={55} r={2.5} fill={color} />
                          <text x={x} y={40} fill={color} fontSize={8} textAnchor="middle" fontFamily="monospace" fontWeight={700}>{rating}</text>
                          <text x={x} y={78} fill="#8b949e" fontSize={6} textAnchor="middle" fontFamily="monospace">{m}</text>
                        </g>
                      );
                    })}
                    {/* Direction arrow */}
                    <text x="290" y="48" fill="#484f58" fontSize={8} fontFamily="monospace">&#x25B6;</text>
                    {/* Stats */}
                    <text x="20" y="105" fill="#484f58" fontSize={7} fontFamily="monospace">START: {timelineData.ratings[0]}</text>
                    <text x="100" y="105" fill="#CCFF00" fontSize={7} fontFamily="monospace">PEAK: {Math.max(...timelineData.ratings)}</text>
                    <text x="200" y="105" fill="#00E5FF" fontSize={7} fontFamily="monospace">PROJ: {timelineData.ratings[7]}</text>
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── SVG 7: Circular Ring Chart (0-100) ── */}
          {ringChartData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}>
              <Card className="bg-[#0d1117] border-[#21262d]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[10px] text-[#484f58] font-bold tracking-widest uppercase">Avg Attribute Ring</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <svg viewBox="0 0 320 120" width="320" height="120" className="max-w-full">
                    {/* Player ring - background */}
                    <circle cx={70} cy={60} r={42} fill="none" stroke="#21262d" strokeWidth={8} />
                    {/* Player ring - value */}
                    {(() => {
                      const circumference = 2 * Math.PI * 42;
                      const offset = circumference * (1 - ringChartData.playerAvg / 100);
                      return <motion.circle cx={70} cy={60} r={42} fill="none" stroke="#FF5500" strokeWidth={8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, delay: 0.3 }} />;
                    })()}
                    {/* Player ring center */}
                    <text x={70} y={57} fill="#FF5500" fontSize={18} fontWeight={900} textAnchor="middle" fontFamily="monospace">{ringChartData.playerAvg}</text>
                    <text x={70} y={70} fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">{player.name.split(' ')[0]}</text>

                    {/* Teammate ring - background */}
                    <circle cx={200} cy={60} r={42} fill="none" stroke="#21262d" strokeWidth={8} />
                    {/* Teammate ring - value */}
                    {(() => {
                      const circumference = 2 * Math.PI * 42;
                      const offset = circumference * (1 - ringChartData.teammateAvg / 100);
                      return <motion.circle cx={200} cy={60} r={42} fill="none" stroke="#00E5FF" strokeWidth={8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, delay: 0.4 }} />;
                    })()}
                    {/* Teammate ring center */}
                    <text x={200} y={57} fill="#00E5FF" fontSize={18} fontWeight={900} textAnchor="middle" fontFamily="monospace">{ringChartData.teammateAvg}</text>
                    <text x={200} y={70} fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">{chosenTeammate?.name.split(' ')[0]}</text>

                    {/* VS divider */}
                    <line x1="140" y1="25" x2="140" y2="95" stroke="#30363d" strokeWidth={1} strokeDasharray="3,3" />
                    <text x="140" y="55" fill="#8b949e" fontSize={10} textAnchor="middle" fontWeight={900} fontFamily="monospace">VS</text>

                    {/* Comparison stats */}
                    <text x="275" y="42" fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">DIFF</text>
                    <text x="275" y="60" fill={ringChartData.playerAvg >= ringChartData.teammateAvg ? '#FF5500' : '#00E5FF'} fontSize={14} fontWeight={900} textAnchor="middle" fontFamily="monospace">
                      {ringChartData.playerAvg > ringChartData.teammateAvg ? '+' : ''}{ringChartData.playerAvg - ringChartData.teammateAvg}
                    </text>
                    <text x="275" y="78" fill="#484f58" fontSize={7} textAnchor="middle" fontFamily="monospace">
                      {ringChartData.playerAvg > ringChartData.teammateAvg ? player.name.split(' ')[0] : chosenTeammate?.name.split(' ')[0]} leads
                    </text>
                  </svg>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty state for Advanced tab when no teammate selected */}
          {activeTab === 'advanced' && !chosenTeammate && (
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto text-[#484f58] mb-3" />
                <div className="text-sm font-bold text-[#c9d1d9] mb-1">Select a Teammate First</div>
                <div className="text-[11px] text-[#8b949e]">
                  Go to the &quot;vs Teammate&quot; tab and select a player to see advanced comparisons, match history, and transfer analysis.
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
