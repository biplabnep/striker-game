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
type TabId = 'potential' | 'teammate' | 'league' | 'development';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'potential',   label: 'vs Potential', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'teammate',    label: 'vs Teammate',  icon: <Users className="h-4 w-4" /> },
  { id: 'league',      label: 'League Avg',   icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'development', label: 'Train Plan',   icon: <ClipboardList className="h-4 w-4" /> },
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
