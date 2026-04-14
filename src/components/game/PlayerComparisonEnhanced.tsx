'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, GitCompareArrows, Star, BarChart3, TrendingUp,
  Zap, Target, Shield, Users, Award, Clock, ChevronRight,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const ATTR_KEYS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;

type AttrKey = typeof ATTR_KEYS[number];

const ATTR_LABELS: Record<AttrKey, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

const ATTR_FULL: Record<AttrKey, string> = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

const RIVAL_NAMES = [
  'Marco Reus', 'Frenkie de Jong', 'Bukayo Saka',
  'Pedri González', 'Vinícius Jr', 'Jamal Musiala',
];

const RIVAL_POSITIONS = ['LW', 'CM', 'RW', 'CAM', 'ST', 'CAM'];

const SEASON_LABELS = ['21/22', '22/23', '23/24', '24/25', '25/26'];

const FORM_RESULTS = ['W', 'D', 'L', 'W', 'W'] as const;

const CAREER_AGES = [17, 19, 21, 23, 26, 30];

const ADVANCED_AXES = ['Pressing', 'Aerial', 'Creativity', 'Leadership', 'Consistency'] as const;

// ──────────────────────────────────────────────────────────────
// SVG Geometry Helpers
// ──────────────────────────────────────────────────────────────

function buildPolygonPoints(
  values: number[],
  maxR: number,
  cx: number,
  cy: number,
): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const r = (v / 100) * maxR;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
}

function buildAxisPoints(
  n: number,
  maxR: number,
  cx: number,
  cy: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const px = cx + maxR * Math.cos(angle);
    const py = cy + maxR * Math.sin(angle);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(' ');
}

function buildLinePoints(
  xValues: number[],
  yValues: number[],
): string {
  return xValues
    .map((x, i) => `${x.toFixed(1)},${yValues[i].toFixed(1)}`)
    .join(' ');
}

function buildAreaPoints(
  xValues: number[],
  yValues: number[],
  baseline: number,
): string {
  const line = xValues
    .map((x, i) => `${x.toFixed(1)},${yValues[i].toFixed(1)}`)
    .join(' ');
  const last = xValues[xValues.length - 1];
  const first = xValues[0];
  return `${line} ${last.toFixed(1)},${baseline.toFixed(1)} ${first.toFixed(1)},${baseline.toFixed(1)}`;
}

function buildScatterPoints(
  data: Array<{ x: number; y: number }>,
): string {
  return data.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' ');
}

function getAxisLabelPos(
  index: number,
  total: number,
  maxR: number,
  cx: number,
  cy: number,
): { x: number; y: number; anchor: string } {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
  const r = maxR + 16;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  const cosA = Math.cos(angle);
  const anchor = cosA > 0.2 ? 'start' : cosA < -0.2 ? 'end' : 'middle';
  return { x, y: y + 4, anchor };
}

// ──────────────────────────────────────────────────────────────
// Seeded random helper
// ──────────────────────────────────────────────────────────────

function seedHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export default function PlayerComparisonEnhanced() {
  // ── Store ──
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const playerName = playerData?.name ?? 'Your Player';

  // ── ALL hooks before conditional returns ──
  const [activeTab, setActiveTab] = useState('h2h');
  const [rivalIdx, setRivalIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBack = useCallback(() => {
    setScreen('dashboard');
  }, [setScreen]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // ── Derived: Rival data ──
  const rivalData = useMemo(() => {
    const seed = seedHash(playerName + String(rivalIdx));
    const name = RIVAL_NAMES[rivalIdx % RIVAL_NAMES.length];
    const pos = RIVAL_POSITIONS[rivalIdx % RIVAL_POSITIONS.length];
    const base = 72 + (seed % 18);
    const age = 21 + (seed % 8);
    const attrs: Record<AttrKey, number> = {
      pace: Math.max(40, Math.min(95, base + ((seed % 20) - 10))),
      shooting: Math.max(40, Math.min(95, base + (((seed + 7) % 20) - 10))),
      passing: Math.max(40, Math.min(95, base + (((seed + 13) % 20) - 10))),
      dribbling: Math.max(40, Math.min(95, base + (((seed + 19) % 20) - 10))),
      defending: Math.max(40, Math.min(95, base + (((seed + 29) % 20) - 10))),
      physical: Math.max(40, Math.min(95, base + (((seed + 37) % 20) - 10))),
    };
    const overall = Math.round(
      ATTR_KEYS.reduce((sum, k) => sum + attrs[k], 0) / ATTR_KEYS.length,
    );
    return { name, position: pos, age, overall, attrs };
  }, [playerName, rivalIdx]);

  // ── Derived: Player attrs array ──
  const playerAttrs: Record<AttrKey, number> = useMemo(() => {
    if (!playerData) {
      return { pace: 65, shooting: 65, passing: 65, dribbling: 65, defending: 65, physical: 65 };
    }
    const a = playerData.attributes;
    return {
      pace: a.pace ?? 65,
      shooting: a.shooting ?? 65,
      passing: a.passing ?? 65,
      dribbling: a.dribbling ?? 65,
      defending: a.defending ?? 65,
      physical: a.physical ?? 65,
    };
  }, [playerData]);

  const playerOverall = playerData?.overall ?? 70;
  const playerPosition = playerData?.position ?? 'CM';
  const playerAge = playerData?.age ?? 22;

  // ── Derived: Attribute comparison pairs ──
  const attrPairs = useMemo(
    () =>
      ATTR_KEYS.map((k) => ({
        key: k,
        label: ATTR_LABELS[k],
        full: ATTR_FULL[k],
        playerVal: playerAttrs[k],
        rivalVal: rivalData.attrs[k],
        diff: playerAttrs[k] - rivalData.attrs[k],
      })),
    [playerAttrs, rivalData.attrs],
  );

  // ── Derived: Rival stats for seasons ──
  const rivalSeasonStats = useMemo(() => {
    const seed = seedHash(rivalData.name + '-seasons');
    return SEASON_LABELS.map((season, i) => {
      const goals = 5 + ((seed + i * 11) % 18);
      const assists = 3 + ((seed + i * 13) % 12);
      return { season, goals, assists };
    });
  }, [rivalData.name]);

  const playerSeasonStats = useMemo(() => {
    const seed = seedHash(playerName + '-seasons');
    return SEASON_LABELS.map((season, i) => {
      const goals = 4 + ((seed + i * 7) % 16);
      const assists = 2 + ((seed + i * 17) % 10);
      return { season, goals, assists };
    });
  }, [playerName]);

  // ── Derived: Per-90 stats ──
  const per90Data = useMemo(() => {
    const seed = seedHash(playerName + '-per90');
    return {
      player: {
        goals: parseFloat((0.3 + ((seed % 40) / 100)).toFixed(2)),
        assists: parseFloat((0.15 + ((seed + 7) % 30) / 100).toFixed(2)),
        keyPasses: parseFloat((1.2 + ((seed + 13) % 20) / 10).toFixed(1)),
        tackles: parseFloat((1.0 + ((seed + 19) % 15) / 10).toFixed(1)),
      },
      rival: {
        goals: parseFloat((0.25 + ((seed + 3) % 35) / 100).toFixed(2)),
        assists: parseFloat((0.18 + ((seed + 11) % 28) / 100).toFixed(2)),
        keyPasses: parseFloat((1.1 + ((seed + 23) % 18) / 10).toFixed(1)),
        tackles: parseFloat((0.9 + ((seed + 29) % 16) / 10).toFixed(1)),
      },
    };
  }, [playerName]);

  // ── Derived: Form comparison ──
  const playerForm = useMemo(() => {
    const seed = seedHash(playerName + '-form');
    return FORM_RESULTS.map((_, i) => {
      const r = (seed + i * 3) % 3;
      return r === 0 ? 'W' : r === 1 ? 'D' : 'L';
    });
  }, [playerName]);

  const rivalForm = useMemo(() => {
    const seed = seedHash(rivalData.name + '-form');
    return FORM_RESULTS.map((_, i) => {
      const r = (seed + i * 5) % 3;
      return r === 0 ? 'W' : r === 1 ? 'D' : 'L';
    });
  }, [rivalData.name]);

  // ── Derived: Career trajectory ──
  const careerTrajectory = useMemo(() => {
    const pSeed = seedHash(playerName + '-career');
    const rSeed = seedHash(rivalData.name + '-career');
    const playerRatings = CAREER_AGES.map((age, i) =>
      Math.max(45, Math.min(92, playerOverall - (CAREER_AGES.length - 1 - i) * 3 + ((pSeed + i * 7) % 8) - 4)),
    );
    const rivalRatings = CAREER_AGES.map((age, i) =>
      Math.max(45, Math.min(92, rivalData.overall - (CAREER_AGES.length - 1 - i) * 2 + ((rSeed + i * 11) % 8) - 4)),
    );
    return { playerRatings, rivalRatings };
  }, [playerName, rivalData.name, playerOverall, rivalData.overall]);

  // ── Derived: Transfer value trend ──
  const transferTrend = useMemo(() => {
    const pSeed = seedHash(playerName + '-transfer');
    const rSeed = seedHash(rivalData.name + '-transfer');
    const playerValues = SEASON_LABELS.map((_, i) =>
      Math.max(5, Math.round((20 + i * 8 + ((pSeed + i * 13) % 15)) * 10) / 10),
    );
    const rivalValues = SEASON_LABELS.map((_, i) =>
      Math.max(5, Math.round((18 + i * 7 + ((rSeed + i * 17) % 12)) * 10) / 10),
    );
    return { playerValues, rivalValues };
  }, [playerName, rivalData.name]);

  // ── Derived: Milestones ──
  const milestones = useMemo(() => {
    const pSeed = seedHash(playerName + '-mile');
    const rSeed = seedHash(rivalData.name + '-mile');
    const pLabels = ['Debut', 'First Goal', '50 Apps', '100 Apps', 'Intl Debut', 'Captain'];
    const rLabels = ['Debut', 'First Goal', '50 Apps', '100 Apps', 'Intl Debut', 'Captain'];
    return {
      player: pLabels.map((label, i) => ({
        label,
        age: 16 + i * 2 + ((pSeed + i * 3) % 2),
      })),
      rival: rLabels.map((label, i) => ({
        label,
        age: 17 + i * 2 + ((rSeed + i * 5) % 2),
      })),
    };
  }, [playerName, rivalData.name]);

  // ── Derived: xG data ──
  const xgData = useMemo(() => {
    const pSeed = seedHash(playerName + '-xg');
    const rSeed = seedHash(rivalData.name + '-xg');
    const seasons4 = SEASON_LABELS.slice(0, 4);
    const playerExpected = seasons4.map((_, i) =>
      parseFloat((8 + ((pSeed + i * 7) % 12) + ((pSeed + i * 3) % 5) / 10).toFixed(1)),
    );
    const playerActual = seasons4.map((_, i) =>
      Math.max(3, playerExpected[i] + ((pSeed + i * 11) % 7) - 3),
    );
    return { seasons: seasons4, playerExpected, playerActual };
  }, [playerName, rivalData.name]);

  // ── Derived: Advanced metrics ──
  const advancedMetrics = useMemo(() => {
    const pSeed = seedHash(playerName + '-adv');
    const rSeed = seedHash(rivalData.name + '-adv');
    const playerAdvanced = ADVANCED_AXES.map((_, i) =>
      Math.max(35, Math.min(95, playerOverall + ((pSeed + i * 7) % 20) - 10)),
    );
    const rivalAdvanced = ADVANCED_AXES.map((_, i) =>
      Math.max(35, Math.min(95, rivalData.overall + ((rSeed + i * 11) % 20) - 10)),
    );
    return { playerAdvanced, rivalAdvanced };
  }, [playerName, rivalData.name, playerOverall, rivalData.overall]);

  // ── Derived: Big game scatter data ──
  const bigGameScatterData = useMemo(() => {
    const pSeed = seedHash(playerName + '-biggame');
    const rSeed = seedHash(rivalData.name + '-biggame');
    const playerDots: Array<{ x: number; y: number }> = [];
    const rivalDots: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 6; i++) {
      playerDots.push({
        x: 20 + ((pSeed + i * 7) % 60),
        y: 5.0 + ((pSeed + i * 11) % 40) / 10,
      });
      rivalDots.push({
        x: 20 + ((rSeed + i * 9) % 60),
        y: 5.0 + ((rSeed + i * 13) % 40) / 10,
      });
    }
    return { playerDots, rivalDots };
  }, [playerName, rivalData.name]);

  // ── Derived: Clutch & pressing stats ──
  const clutchStats = useMemo(() => {
    const pSeed = seedHash(playerName + '-clutch');
    const rSeed = seedHash(rivalData.name + '-clutch');
    return {
      player: {
        clutchFactor: Math.max(40, Math.min(99, playerOverall + ((pSeed % 20) - 8))),
        pressingIntensity: Math.max(30, Math.min(98, 60 + ((pSeed + 7) % 30))),
        aerialDuelPct: Math.max(25, Math.min(90, 50 + ((pSeed + 13) % 35))),
        bigGameRating: parseFloat((6.2 + ((pSeed + 19) % 25) / 10).toFixed(1)),
      },
      rival: {
        clutchFactor: Math.max(40, Math.min(99, rivalData.overall + ((rSeed % 20) - 8))),
        pressingIntensity: Math.max(30, Math.min(98, 55 + ((rSeed + 11) % 30))),
        aerialDuelPct: Math.max(25, Math.min(90, 48 + ((rSeed + 17) % 35))),
        bigGameRating: parseFloat((6.0 + ((rSeed + 23) % 25) / 10).toFixed(1)),
      },
    };
  }, [playerName, rivalData.name, playerOverall, rivalData.overall]);

  // ── Derived: International caps ──
  const internationalCaps = useMemo(() => {
    const pSeed = seedHash(playerName + '-intl');
    const rSeed = seedHash(rivalData.name + '-intl');
    return {
      player: { caps: 5 + (pSeed % 30), goals: 1 + (pSeed % 10), assists: 2 + (pSeed % 8) },
      rival: { caps: 10 + (rSeed % 40), goals: 3 + (rSeed % 12), assists: 4 + (rSeed % 10) },
    };
  }, [playerName, rivalData.name]);

  // ── Derived: Season stats grid ──
  const seasonStatsGrid = useMemo(() => {
    const pSeed = seedHash(playerName + '-sgrid');
    const rSeed = seedHash(rivalData.name + '-sgrid');
    return {
      player: {
        goals: 12 + (pSeed % 14),
        assists: 6 + (pSeed % 10),
        passes: 800 + (pSeed % 600),
        tackles: 20 + (pSeed % 30),
        interceptions: 15 + (pSeed % 20),
        cleanSheets: (pSeed % 5),
      },
      rival: {
        goals: 10 + (rSeed % 16),
        assists: 8 + (rSeed % 8),
        passes: 900 + (rSeed % 500),
        tackles: 25 + (rSeed % 25),
        interceptions: 18 + (rSeed % 18),
        cleanSheets: (rSeed % 4),
      },
    };
  }, [playerName, rivalData.name]);

  // ── Conditional return (after all hooks) ──
  if (!gameState || !playerData) return null;

  // ──────────────────────────────────────────────────────────
  // Sub-components (camelCase, inside main)
  // ──────────────────────────────────────────────────────────

  function headerSection(): React.JSX.Element {
    return (
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GitCompareArrows className="h-5 w-5 text-emerald-400 shrink-0" />
          <h2 className="text-lg font-bold text-[#c9d1d9] truncate">Player Comparison</h2>
        </div>
        <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 border-emerald-500/40 text-emerald-400">
          Enhanced
        </Badge>
      </div>
    );
  }

  function playerCardsRow(): React.JSX.Element {
    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Player A */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 mx-auto mb-2 flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white truncate">{playerName}</p>
              <p className="text-[10px] text-[#8b949e]">{playerPosition} · Age {playerAge}</p>
              <div className="mt-2 text-2xl font-black text-emerald-400">{playerOverall}</div>
              <p className="text-[10px] text-[#8b949e]">Overall</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player B */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/15 mx-auto mb-2 flex items-center justify-center">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white truncate">{rivalData.name}</p>
              <p className="text-[10px] text-[#8b949e]">{rivalData.position} · Age {rivalData.age}</p>
              <div className="mt-2 text-2xl font-black text-cyan-400">{rivalData.overall}</div>
              <p className="text-[10px] text-[#8b949e]">Overall</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  function rivalSelector(): React.JSX.Element {
    return (
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <span className="text-[10px] text-[#8b949e] shrink-0">Compare vs:</span>
        {RIVAL_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => setRivalIdx(i)}
            className={`shrink-0 text-[11px] px-2.5 py-1 rounded-md transition-colors font-medium ${
              rivalIdx === i
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] border border-transparent'
            }`}
          >
            {name.split(' ')[1] ?? name.split(' ')[0]}
          </button>
        ))}
      </div>
    );
  }

  // ─── Tab 1: Head-to-Head ───

  function attributeComparisonBars(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5" /> Core Attributes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {attrPairs.map((pair) => {
            const maxVal = Math.max(pair.playerVal, pair.rivalVal, 1);
            const pWidth = (pair.playerVal / maxVal) * 100;
            const rWidth = (pair.rivalVal / maxVal) * 100;
            return (
              <div key={pair.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400">{pair.playerVal}</span>
                  <span className="text-[11px] font-bold text-[#c9d1d9]">{pair.label}</span>
                  <span className="text-[10px] font-bold text-cyan-400">{pair.rivalVal}</span>
                </div>
                <div className="flex gap-0.5 h-2">
                  <div className="flex-1 flex justify-end">
                    <div
                      className="h-full bg-emerald-500 rounded-sm"
                      style={{ width: `${pWidth}%` }}
                    />
                  </div>
                  <div className="w-px bg-[#30363d]" />
                  <div className="flex-1">
                    <div
                      className="h-full bg-cyan-500 rounded-sm"
                      style={{ width: `${rWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  function butterflyChart(): React.JSX.Element {
    const w = 340;
    const h = 220;
    const cx = w / 2;
    const barH = 18;
    const gap = 10;
    const maxStat = 99;
    const halfW = (w / 2) - 30;

    const buildBarPoints = (
      val: number,
      direction: 'left' | 'right',
      yPos: number,
    ): string => {
      const barW = (val / maxStat) * halfW;
      if (direction === 'right') {
        return `${cx},${yPos} ${cx + barW},${yPos} ${cx + barW},${yPos + barH} ${cx},${yPos + barH}`;
      }
      return `${cx},${yPos} ${cx - barW},${yPos} ${cx - barW},${yPos + barH} ${cx},${yPos + barH}`;
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Attribute Butterfly Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Center line */}
            <line x1={cx} y1={8} x2={cx} y2={h - 8} stroke="#30363d" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
            {/* Grid lines */}
            {[25, 50, 75, 100].map((pct, gi) => {
              const offset = (pct / maxStat) * halfW;
              return (
                <g key={gi}>
                  <line x1={cx - offset} y1={8} x2={cx - offset} y2={h - 8} stroke="#30363d" strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2} />
                  <line x1={cx + offset} y1={8} x2={cx + offset} y2={h - 8} stroke="#30363d" strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2} />
                </g>
              );
            })}
            {/* Bars */}
            {attrPairs.map((pair, i) => {
              const y = 14 + i * (barH + gap);
              return (
                <g key={pair.key}>
                  <polygon
                    points={buildBarPoints(pair.rivalVal, 'left', y)}
                    fill="#22d3ee"
                    opacity={0.7}
                  />
                  <polygon
                    points={buildBarPoints(pair.playerVal, 'right', y)}
                    fill="#34d399"
                    opacity={0.7}
                  />
                  <text x={12} y={y + barH / 2 + 4} fill="#22d3ee" fontSize={11} fontWeight={700} fontFamily="monospace">
                    {pair.rivalVal}
                  </text>
                  <text x={w - 12} y={y + barH / 2 + 4} fill="#34d399" fontSize={11} fontWeight={700} fontFamily="monospace" textAnchor="end">
                    {pair.playerVal}
                  </text>
                  <text x={cx} y={y + barH / 2 + 4} fill="#c9d1d9" fontSize={10} fontWeight={600} textAnchor="middle">
                    {pair.label}
                  </text>
                </g>
              );
            })}
            {/* Labels */}
            <text x={cx - halfW - 5} y={h - 2} fill="#22d3ee" fontSize={10} textAnchor="end">
              {rivalData.name.split(' ')[1]}
            </text>
            <text x={cx + halfW + 5} y={h - 2} fill="#34d399" fontSize={10} textAnchor="start">
              You
            </text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function overallRatingGauge(): React.JSX.Element {
    const w = 320;
    const h = 160;
    const radius = 55;
    const cy = h - 20;
    const cxL = w / 4 + 10;
    const cxR = (3 * w) / 4 - 10;

    const buildArcPath = (centerX: number, value: number): string => {
      const startAngle = Math.PI;
      const endAngle = 2 * Math.PI;
      const valAngle = startAngle + (value / 100) * Math.PI;
      const sx = centerX + radius * Math.cos(startAngle);
      const sy = cy + radius * Math.sin(startAngle);
      const ex = centerX + radius * Math.cos(valAngle);
      const ey = cy + radius * Math.sin(valAngle);
      const largeArc = value > 50 ? 1 : 0;
      return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`;
    };

    const buildBgArcPath = (centerX: number): string => {
      const sx = centerX + radius * Math.cos(Math.PI);
      const sy = cy + radius * Math.sin(Math.PI);
      const ex = centerX + radius * Math.cos(2 * Math.PI);
      const ey = cy + radius * Math.sin(2 * Math.PI);
      return `M ${sx} ${sy} A ${radius} ${radius} 0 1 1 ${ex} ${ey}`;
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> Overall Rating Gauge
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Left gauge (Player) */}
            <path d={buildBgArcPath(cxL)} fill="none" stroke="#30363d" strokeWidth={10} strokeLinecap="round" />
            <motion.path
              d={buildArcPath(cxL, playerOverall)}
              fill="none"
              stroke="#34d399"
              strokeWidth={10}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
            <text x={cxL} y={cy - 8} fill="white" fontSize={28} fontWeight={900} textAnchor="middle" fontFamily="monospace">
              {playerOverall}
            </text>
            <text x={cxL} y={cy + 8} fill="#8b949e" fontSize={10} textAnchor="middle">
              {playerName.split(' ')[0]}
            </text>

            {/* Right gauge (Rival) */}
            <path d={buildBgArcPath(cxR)} fill="none" stroke="#30363d" strokeWidth={10} strokeLinecap="round" />
            <motion.path
              d={buildArcPath(cxR, rivalData.overall)}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={10}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <text x={cxR} y={cy - 8} fill="white" fontSize={28} fontWeight={900} textAnchor="middle" fontFamily="monospace">
              {rivalData.overall}
            </text>
            <text x={cxR} y={cy + 8} fill="#8b949e" fontSize={10} textAnchor="middle">
              {rivalData.name.split(' ')[1]}
            </text>

            {/* Scale ticks */}
            {[0, 25, 50, 75, 100].map((tick, ti) => {
              const angle = Math.PI + (tick / 100) * Math.PI;
              const lx = cxL + (radius + 14) * Math.cos(angle);
              const ly = cy + (radius + 14) * Math.sin(angle);
              return (
                <text key={ti} x={lx} y={ly + 3} fill="#484f58" fontSize={7} textAnchor="middle">
                  {tick}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function playerCardPreview(): React.JSX.Element {
    const w = 320;
    const h = 120;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Award className="h-3.5 w-3.5" /> Player Card Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Player A card */}
            <rect x={10} y={10} width={140} height={100} rx={8} fill="#1c2333" stroke="#34d399" strokeWidth={1.5} />
            <circle cx={42} cy={45} r={16} fill="#34d399" opacity={0.15} stroke="#34d399" strokeWidth={1} />
            <text x={42} y={49} fill="#34d399" fontSize={10} fontWeight={700} textAnchor="middle">
              {playerPosition}
            </text>
            <text x={80} y={35} fill="white" fontSize={12} fontWeight={800}>
              {playerName.length > 12 ? playerName.slice(0, 12) + '..' : playerName}
            </text>
            <text x={80} y={50} fill="#8b949e" fontSize={9}>
              Age {playerAge}
            </text>
            <text x={80} y={65} fill="#8b949e" fontSize={9}>
              POT {playerData?.potential ?? playerOverall + 5}
            </text>
            <rect x={18} y={75} width={50} height={26} rx={4} fill="#34d399" opacity={0.15} />
            <text x={43} y={93} fill="#34d399" fontSize={16} fontWeight={900} textAnchor="middle">
              {playerOverall}
            </text>
            {/* Mini stats */}
            {attrPairs.slice(0, 3).map((pair, i) => (
              <text key={i} x={80} y={75 + i * 10} fill="#c9d1d9" fontSize={8}>
                {pair.label} {pair.playerVal}
              </text>
            ))}

            {/* Player B card */}
            <rect x={170} y={10} width={140} height={100} rx={8} fill="#1c2333" stroke="#22d3ee" strokeWidth={1.5} />
            <circle cx={202} cy={45} r={16} fill="#22d3ee" opacity={0.15} stroke="#22d3ee" strokeWidth={1} />
            <text x={202} y={49} fill="#22d3ee" fontSize={10} fontWeight={700} textAnchor="middle">
              {rivalData.position}
            </text>
            <text x={240} y={35} fill="white" fontSize={12} fontWeight={800}>
              {rivalData.name.length > 12 ? rivalData.name.slice(0, 12) + '..' : rivalData.name}
            </text>
            <text x={240} y={50} fill="#8b949e" fontSize={9}>
              Age {rivalData.age}
            </text>
            <text x={240} y={65} fill="#8b949e" fontSize={9}>
              POT {rivalData.overall + 3}
            </text>
            <rect x={178} y={75} width={50} height={26} rx={4} fill="#22d3ee" opacity={0.15} />
            <text x={203} y={93} fill="#22d3ee" fontSize={16} fontWeight={900} textAnchor="middle">
              {rivalData.overall}
            </text>
            {attrPairs.slice(0, 3).map((pair, i) => (
              <text key={i} x={240} y={75 + i * 10} fill="#c9d1d9" fontSize={8}>
                {pair.label} {pair.rivalVal}
              </text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function tabH2H(): React.JSX.Element {
    return (
      <div className="space-y-3">
        {playerCardsRow()}
        {attributeComparisonBars()}
        <div className="grid grid-cols-1 gap-3">
          {butterflyChart()}
          {overallRatingGauge()}
          {playerCardPreview()}
        </div>
      </div>
    );
  }

  // ─── Tab 2: Statistical Comparison ───

  function seasonStatsGridSection(): React.JSX.Element {
    const stats = [
      { label: 'Goals', pVal: seasonStatsGrid.player.goals, rVal: seasonStatsGrid.rival.goals, icon: <Target className="h-3.5 w-3.5" /> },
      { label: 'Assists', pVal: seasonStatsGrid.player.assists, rVal: seasonStatsGrid.rival.assists, icon: <Zap className="h-3.5 w-3.5" /> },
      { label: 'Passes', pVal: seasonStatsGrid.player.passes, rVal: seasonStatsGrid.rival.passes, icon: <ChevronRight className="h-3.5 w-3.5" /> },
      { label: 'Tackles', pVal: seasonStatsGrid.player.tackles, rVal: seasonStatsGrid.rival.tackles, icon: <Shield className="h-3.5 w-3.5" /> },
      { label: 'Interceptions', pVal: seasonStatsGrid.player.interceptions, rVal: seasonStatsGrid.rival.interceptions, icon: <Shield className="h-3.5 w-3.5" /> },
      { label: 'Clean Sheets', pVal: seasonStatsGrid.player.cleanSheets, rVal: seasonStatsGrid.rival.cleanSheets, icon: <Award className="h-3.5 w-3.5" /> },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Season Stats Grid
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.map((s) => {
              const pWin = s.pVal > s.rVal;
              const rWin = s.rVal > s.pVal;
              return (
                <div key={s.label} className="bg-[#21262d] rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8b949e]">
                    {s.icon}
                    <span className="text-[10px] font-medium">{s.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${pWin ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {s.pVal}
                    </span>
                    <span className="text-[10px] text-[#484f58]">vs</span>
                    <span className={`text-sm font-bold ${rWin ? 'text-cyan-400' : 'text-[#c9d1d9]'}`}>
                      {s.rVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  function per90Section(): React.JSX.Element {
    const metrics = [
      { label: 'Goals / 90', pVal: per90Data.player.goals, rVal: per90Data.rival.goals },
      { label: 'Assists / 90', pVal: per90Data.player.assists, rVal: per90Data.rival.assists },
      { label: 'Key Passes / 90', pVal: per90Data.player.keyPasses, rVal: per90Data.rival.keyPasses },
      { label: 'Tackles / 90', pVal: per90Data.player.tackles, rVal: per90Data.rival.tackles },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Per-90-Minute Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-bold w-16 text-right">{m.pVal}</span>
              <span className="text-[10px] text-[#8b949e] flex-1 text-center">{m.label}</span>
              <span className="text-xs text-cyan-400 font-bold w-16 text-left">{m.rVal}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function formComparisonSection(): React.JSX.Element {
    const formColor = (result: string): string => {
      if (result === 'W') return 'bg-emerald-500';
      if (result === 'D') return 'bg-amber-500';
      return 'bg-red-500';
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Form (Last 5)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold">{playerName.split(' ')[0]}</span>
            <div className="flex items-center gap-1.5">
              {playerForm.map((r, i) => (
                <div key={i} className={`w-6 h-6 rounded flex items-center justify-center ${formColor(r)}`}>
                  <span className="text-[10px] text-white font-bold">{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold">{rivalData.name.split(' ')[1]}</span>
            <div className="flex items-center gap-1.5">
              {rivalForm.map((r, i) => (
                <div key={i} className={`w-6 h-6 rounded flex items-center justify-center ${formColor(r)}`}>
                  <span className="text-[10px] text-white font-bold">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function goalsAssistsBars(): React.JSX.Element {
    const w = 340;
    const h = 200;
    const padding = { top: 25, bottom: 30, left: 40, right: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const seasons3 = SEASON_LABELS.slice(0, 3);
    const maxGoals = Math.max(
      ...playerSeasonStats.slice(0, 3).map(s => s.goals),
      ...rivalSeasonStats.slice(0, 3).map(s => s.goals),
      1,
    );
    const barGroupW = chartW / seasons3.length;
    const barW = barGroupW * 0.25;
    const gap = 3;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Goals + Assists Grouped Bars
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => {
              const y = padding.top + chartH * (1 - pct);
              const val = Math.round(maxGoals * pct);
              return (
                <g key={gi}>
                  <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.3} />
                  <text x={padding.left - 5} y={y + 3} fill="#484f58" fontSize={9} textAnchor="end">
                    {val}
                  </text>
                </g>
              );
            })}
            {/* Bars */}
            {seasons3.map((season, si) => {
              const gx = padding.left + si * barGroupW + barGroupW * 0.15;
              const pGoalsH = (playerSeasonStats[si].goals / maxGoals) * chartH;
              const pAssistsH = (playerSeasonStats[si].assists / maxGoals) * chartH;
              const rGoalsH = (rivalSeasonStats[si].goals / maxGoals) * chartH;
              const rAssistsH = (rivalSeasonStats[si].assists / maxGoals) * chartH;
              return (
                <g key={season}>
                  {/* Player Goals */}
                  <rect x={gx} y={padding.top + chartH - pGoalsH} width={barW} height={pGoalsH} fill="#34d399" opacity={0.85} rx={2} />
                  {/* Player Assists */}
                  <rect x={gx + barW + gap} y={padding.top + chartH - pAssistsH} width={barW} height={pAssistsH} fill="#34d399" opacity={0.45} rx={2} />
                  {/* Rival Goals */}
                  <rect x={gx + 2 * (barW + gap)} y={padding.top + chartH - rGoalsH} width={barW} height={rGoalsH} fill="#22d3ee" opacity={0.85} rx={2} />
                  {/* Rival Assists */}
                  <rect x={gx + 3 * (barW + gap)} y={padding.top + chartH - rAssistsH} width={barW} height={rAssistsH} fill="#22d3ee" opacity={0.45} rx={2} />
                  {/* Season label */}
                  <text x={gx + 2 * barW + gap} y={h - 8} fill="#8b949e" fontSize={10} textAnchor="middle">
                    {season}
                  </text>
                </g>
              );
            })}
            {/* Legend */}
            <rect x={padding.left} y={6} width={8} height={8} fill="#34d399" opacity={0.85} rx={1} />
            <text x={padding.left + 12} y={14} fill="#8b949e" fontSize={8}>Your Goals</text>
            <rect x={padding.left + 70} y={6} width={8} height={8} fill="#34d399" opacity={0.45} rx={1} />
            <text x={padding.left + 82} y={14} fill="#8b949e" fontSize={8}>Your Assists</text>
            <rect x={padding.left + 150} y={6} width={8} height={8} fill="#22d3ee" opacity={0.85} rx={1} />
            <text x={padding.left + 162} y={14} fill="#8b949e" fontSize={8}>Rival Goals</text>
            <rect x={padding.left + 230} y={6} width={8} height={8} fill="#22d3ee" opacity={0.45} rx={1} />
            <text x={padding.left + 242} y={14} fill="#8b949e" fontSize={8}>Rival Assists</text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function formDotsChart(): React.JSX.Element {
    const w = 300;
    const h = 100;
    const dotR = 14;
    const startX = 60;
    const spacing = 42;

    const dotColor = (result: string): string => {
      if (result === 'W') return '#34d399';
      if (result === 'D') return '#f59e0b';
      return '#ef4444';
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Form Comparison Dots
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Player row */}
            <text x={startX - 8} y={30} fill="#34d399" fontSize={10} fontWeight={600} textAnchor="end">
              You
            </text>
            {playerForm.map((r, i) => (
              <g key={`pf-${i}`}>
                <circle cx={startX + i * spacing} cy={26} r={dotR} fill={dotColor(r)} opacity={0.2} />
                <circle cx={startX + i * spacing} cy={26} r={dotR - 3} fill={dotColor(r)} />
                <text x={startX + i * spacing} y={30} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">
                  {r}
                </text>
              </g>
            ))}
            {/* Rival row */}
            <text x={startX - 8} y={72} fill="#22d3ee" fontSize={10} fontWeight={600} textAnchor="end">
              Rival
            </text>
            {rivalForm.map((r, i) => (
              <g key={`rf-${i}`}>
                <circle cx={startX + i * spacing} cy={68} r={dotR} fill={dotColor(r)} opacity={0.2} />
                <circle cx={startX + i * spacing} cy={68} r={dotR - 3} fill={dotColor(r)} />
                <text x={startX + i * spacing} y={72} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">
                  {r}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function statsRadar(): React.JSX.Element {
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 35;
    const n = ATTR_KEYS.length;
    const gridLevels = [25, 50, 75, 100];

    const playerVals = ATTR_KEYS.map(k => playerAttrs[k]);
    const rivalVals = ATTR_KEYS.map(k => rivalData.attrs[k]);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5" /> Stats Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="max-w-full">
            {/* Grid */}
            {gridLevels.map((level, gi) => (
              <polygon
                key={gi}
                points={buildPolygonPoints(ATTR_KEYS.map(() => level), maxR, cx, cy)}
                fill="none"
                stroke={level === 100 ? '#30363d' : '#21262d'}
                strokeWidth={level === 100 ? 1.5 : 0.5}
              />
            ))}
            {/* Axes */}
            {ATTR_KEYS.map((_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const ex = cx + maxR * Math.cos(angle);
              const ey = cy + maxR * Math.sin(angle);
              return (
                <line key={`axis-${i}`} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#30363d" strokeWidth={0.4} />
              );
            })}
            {/* Rival polygon (behind) */}
            <motion.polygon
              points={buildPolygonPoints(rivalVals, maxR, cx, cy)}
              fill="#22d3ee"
              fillOpacity={0}
              stroke="#22d3ee"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              animate={{ fillOpacity: 0.1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            {/* Player polygon (front) */}
            <motion.polygon
              points={buildPolygonPoints(playerVals, maxR, cx, cy)}
              fill="#34d399"
              fillOpacity={0}
              stroke="#34d399"
              strokeWidth={2}
              animate={{ fillOpacity: 0.15 }}
              transition={{ duration: 0.5 }}
            />
            {/* Player data points */}
            {playerVals.map((v, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const r = (v / 100) * maxR;
              return (
                <circle
                  key={`pd-${i}`}
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r={3}
                  fill="#34d399"
                />
              );
            })}
            {/* Rival data points */}
            {rivalVals.map((v, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const r = (v / 100) * maxR;
              return (
                <circle
                  key={`rd-${i}`}
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r={2.5}
                  fill="#22d3ee"
                />
              );
            })}
            {/* Labels */}
            {ATTR_KEYS.map((k, i) => {
              const { x, y, anchor } = getAxisLabelPos(i, n, maxR, cx, cy);
              return (
                <text key={`lbl-${k}`} x={x} y={y} textAnchor={anchor as "start" | "middle" | "end"} fill="#c9d1d9" fontSize={11} fontWeight={700} fontFamily="monospace">
                  {ATTR_LABELS[k]}
                </text>
              );
            })}
          </svg>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-emerald-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{playerName.split(' ')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-cyan-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{rivalData.name.split(' ')[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function tabStats(): React.JSX.Element {
    return (
      <div className="space-y-3">
        {seasonStatsGridSection()}
        {per90Section()}
        {formComparisonSection()}
        {goalsAssistsBars()}
        <div className="grid grid-cols-1 gap-3">
          {formDotsChart()}
          {statsRadar()}
        </div>
      </div>
    );
  }

  // ─── Tab 3: Career Trajectory ───

  function careerArcSection(): React.JSX.Element {
    const items = [
      { label: 'Career Peak', pVal: Math.max(...careerTrajectory.playerRatings), rVal: Math.max(...careerTrajectory.rivalRatings) },
      { label: 'Avg Rating', pVal: Math.round(careerTrajectory.playerRatings.reduce((a, b) => a + b, 0) / careerTrajectory.playerRatings.length), rVal: Math.round(careerTrajectory.rivalRatings.reduce((a, b) => a + b, 0) / careerTrajectory.rivalRatings.length) },
      { label: 'Growth Rate', pVal: '+3.2/yr', rVal: '+2.8/yr' },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Career Arc Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.label} className="bg-[#21262d] rounded-lg p-2.5 text-center space-y-1">
                <p className="text-[10px] text-[#8b949e]">{item.label}</p>
                <p className="text-sm font-bold text-emerald-400">{String(item.pVal)}</p>
                <div className="w-px h-2 bg-[#30363d] mx-auto" />
                <p className="text-sm font-bold text-cyan-400">{String(item.rVal)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function transferHistorySection(): React.JSX.Element {
    const pSeed = seedHash(playerName + '-transfers');
    const rSeed = seedHash(rivalData.name + '-transfers');
    const pClubs = ['Academy', 'U21', 'First Team', 'Big Club'];
    const rClubs = ['Youth', 'Reserves', 'Senior', 'Top Club'];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5" /> Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-[10px] text-emerald-400 font-bold mb-1.5">{playerName.split(' ')[0]}</p>
            {pClubs.map((club, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-sm shrink-0" />
                <span className="text-[11px] text-[#c9d1d9]">{club}</span>
                <span className="text-[10px] text-[#484f58]">Age {17 + i * 3 + (pSeed % 2)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-cyan-400 font-bold mb-1.5">{rivalData.name.split(' ')[1]}</p>
            {rClubs.map((club, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-sm shrink-0" />
                <span className="text-[11px] text-[#c9d1d9]">{club}</span>
                <span className="text-[10px] text-[#484f58]">Age {18 + i * 3 + (rSeed % 2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function intlCapsSection(): React.JSX.Element {
    const pIntl = internationalCaps.player;
    const rIntl = internationalCaps.rival;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> International Caps
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#21262d] rounded-lg p-3 text-center space-y-2">
              <p className="text-[10px] text-emerald-400 font-bold">{playerName.split(' ')[0]}</p>
              <p className="text-2xl font-black text-white">{pIntl.caps}</p>
              <p className="text-[10px] text-[#8b949e]">Caps</p>
              <div className="flex justify-center gap-3">
                <div>
                  <p className="text-sm font-bold text-emerald-400">{pIntl.goals}</p>
                  <p className="text-[9px] text-[#484f58]">Goals</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">{pIntl.assists}</p>
                  <p className="text-[9px] text-[#484f58]">Assists</p>
                </div>
              </div>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3 text-center space-y-2">
              <p className="text-[10px] text-cyan-400 font-bold">{rivalData.name.split(' ')[1]}</p>
              <p className="text-2xl font-black text-white">{rIntl.caps}</p>
              <p className="text-[10px] text-[#8b949e]">Caps</p>
              <div className="flex justify-center gap-3">
                <div>
                  <p className="text-sm font-bold text-cyan-400">{rIntl.goals}</p>
                  <p className="text-[9px] text-[#484f58]">Goals</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-cyan-400">{rIntl.assists}</p>
                  <p className="text-[9px] text-[#484f58]">Assists</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function careerRatingAreaChart(): React.JSX.Element {
    const w = 340;
    const h = 200;
    const padding = { top: 20, bottom: 35, left: 40, right: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const minRating = 40;
    const maxRating = 95;

    const xValues = CAREER_AGES.map((age, i) => padding.left + (i / (CAREER_AGES.length - 1)) * chartW);
    const pYValues = careerTrajectory.playerRatings.map(r => padding.top + chartH * (1 - (r - minRating) / (maxRating - minRating)));
    const rYValues = careerTrajectory.rivalRatings.map(r => padding.top + chartH * (1 - (r - minRating) / (maxRating - minRating)));
    const baseline = padding.top + chartH;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Career Rating Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Grid */}
            {[45, 55, 65, 75, 85, 95].map((val, gi) => {
              const y = padding.top + chartH * (1 - (val - minRating) / (maxRating - minRating));
              return (
                <g key={gi}>
                  <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.2} />
                  <text x={padding.left - 5} y={y + 3} fill="#484f58" fontSize={9} textAnchor="end">{val}</text>
                </g>
              );
            })}
            {/* Player area */}
            <polygon
              points={buildAreaPoints(xValues, pYValues, baseline)}
              fill="#34d399"
              opacity={0.12}
            />
            <polyline
              points={buildLinePoints(xValues, pYValues)}
              fill="none"
              stroke="#34d399"
              strokeWidth={2}
            />
            {/* Rival area */}
            <polygon
              points={buildAreaPoints(xValues, rYValues, baseline)}
              fill="#22d3ee"
              opacity={0.1}
            />
            <polyline
              points={buildLinePoints(xValues, rYValues)}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            {/* Player dots */}
            {xValues.map((x, i) => (
              <circle key={`pdot-${i}`} cx={x} cy={pYValues[i]} r={3} fill="#34d399" />
            ))}
            {/* Rival dots */}
            {xValues.map((x, i) => (
              <circle key={`rdot-${i}`} cx={x} cy={rYValues[i]} r={3} fill="#22d3ee" />
            ))}
            {/* Age labels */}
            {CAREER_AGES.map((age, i) => (
              <text key={`age-${i}`} x={xValues[i]} y={h - 8} fill="#8b949e" fontSize={10} textAnchor="middle">
                {age}
              </text>
            ))}
            <text x={w / 2} y={h - 0} fill="#484f58" fontSize={8} textAnchor="middle">
              Age
            </text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function transferValueLine(): React.JSX.Element {
    const w = 340;
    const h = 180;
    const padding = { top: 20, bottom: 30, left: 45, right: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const seasons = transferTrend.playerValues;
    const allVals = [...transferTrend.playerValues, ...transferTrend.rivalValues];
    const maxVal = Math.max(...allVals, 1);

    const xValues = seasons.map((_, i) => padding.left + (i / (seasons.length - 1)) * chartW);
    const pYValues = transferTrend.playerValues.map(v => padding.top + chartH * (1 - v / maxVal));
    const rYValues = transferTrend.rivalValues.map(v => padding.top + chartH * (1 - v / maxVal));

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Transfer Value Trend (€M)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => {
              const y = padding.top + chartH * (1 - pct);
              const val = Math.round(maxVal * pct);
              return (
                <g key={gi}>
                  <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.2} />
                  <text x={padding.left - 5} y={y + 3} fill="#484f58" fontSize={9} textAnchor="end">€{val}M</text>
                </g>
              );
            })}
            {/* Player line */}
            <polyline
              points={buildLinePoints(xValues, pYValues)}
              fill="none"
              stroke="#34d399"
              strokeWidth={2}
            />
            {/* Rival line */}
            <polyline
              points={buildLinePoints(xValues, rYValues)}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2}
              strokeDasharray="5 3"
            />
            {/* Dots */}
            {xValues.map((x, i) => (
              <circle key={`pv-${i}`} cx={x} cy={pYValues[i]} r={3} fill="#34d399" />
            ))}
            {xValues.map((x, i) => (
              <circle key={`rv-${i}`} cx={x} cy={rYValues[i]} r={3} fill="#22d3ee" />
            ))}
            {/* Season labels */}
            {SEASON_LABELS.map((season, i) => (
              <text key={`sl-${i}`} x={xValues[i]} y={h - 8} fill="#8b949e" fontSize={10} textAnchor="middle">
                {season}
              </text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function milestoneTimeline(): React.JSX.Element {
    const w = 340;
    const h = 130;
    const cx = w / 2;
    const lineY = 45;
    const nodeR = 8;
    const pSeed = seedHash(playerName + '-tl');
    const nodeCount = 6;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Milestone Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Center line */}
            <line x1={30} y1={lineY} x2={w - 30} y2={lineY} stroke="#30363d" strokeWidth={2} />
            {/* Nodes */}
            {milestones.player.map((m, i) => {
              const x = 45 + (i / (nodeCount - 1)) * (w - 90);
              const rAge = milestones.rival[i]?.age ?? m.age + 1;
              return (
                <g key={i}>
                  {/* Player node (top) */}
                  <circle cx={x} cy={lineY - 22} r={nodeR} fill="#161b22" stroke="#34d399" strokeWidth={1.5} />
                  <text x={x} y={lineY - 19} fill="#34d399" fontSize={8} fontWeight={700} textAnchor="middle">
                    {m.age}
                  </text>
                  <text x={x} y={lineY - 38} fill="#c9d1d9" fontSize={8} textAnchor="middle">
                    {m.label}
                  </text>
                  <line x1={x} y1={lineY - 22 + nodeR} x2={x} y2={lineY - 2} stroke="#34d399" strokeWidth={1} opacity={0.4} />
                  {/* Rival node (bottom) */}
                  <circle cx={x} cy={lineY + 22} r={nodeR} fill="#161b22" stroke="#22d3ee" strokeWidth={1.5} />
                  <text x={x} y={lineY + 25} fill="#22d3ee" fontSize={8} fontWeight={700} textAnchor="middle">
                    {rAge}
                  </text>
                  <text x={x} y={lineY + 42} fill="#c9d1d9" fontSize={8} textAnchor="middle">
                    {milestones.rival[i]?.label ?? m.label}
                  </text>
                  <line x1={x} y1={lineY + 2} x2={x} y2={lineY + 22 - nodeR} stroke="#22d3ee" strokeWidth={1} opacity={0.4} />
                </g>
              );
            })}
            {/* Legend */}
            <text x={30} y={lineY - 38} fill="#34d399" fontSize={9} fontWeight={600}>You</text>
            <text x={30} y={lineY + 42} fill="#22d3ee" fontSize={9} fontWeight={600}>Rival</text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function tabCareer(): React.JSX.Element {
    return (
      <div className="space-y-3">
        {careerArcSection()}
        {transferHistorySection()}
        {intlCapsSection()}
        {careerRatingAreaChart()}
        {transferValueLine()}
        {milestoneTimeline()}
      </div>
    );
  }

  // ─── Tab 4: Advanced Metrics ───

  function xgSection(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> xG vs Actual Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {xgData.seasons.map((season, i) => {
            const diff = xgData.playerActual[i] - xgData.playerExpected[i];
            const overPerforming = diff > 0;
            return (
              <div key={season} className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5">
                <span className="text-[10px] text-[#8b949e] w-12">{season}</span>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className="text-xs text-[#c9d1d9]">xG: <span className="font-bold text-amber-400">{xgData.playerExpected[i]}</span></span>
                  <ChevronRight className="h-3 w-3 text-[#484f58]" />
                  <span className="text-xs text-[#c9d1d9]">Actual: <span className="font-bold text-white">{xgData.playerActual[i]}</span></span>
                </div>
                <span className={`text-[10px] font-bold ${overPerforming ? 'text-emerald-400' : 'text-red-400'}`}>
                  {overPerforming ? '+' : ''}{diff}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  function pressingIntensitySection(): React.JSX.Element {
    const pStats = clutchStats.player;
    const rStats = clutchStats.rival;

    const items = [
      { label: 'Pressing Intensity', pVal: pStats.pressingIntensity, rVal: rStats.pressingIntensity, suffix: '/100' },
      { label: 'Aerial Duel %', pVal: pStats.aerialDuelPct, rVal: rStats.aerialDuelPct, suffix: '%' },
      { label: 'Big Game Rating', pVal: pStats.bigGameRating, rVal: rStats.bigGameRating, suffix: '/10' },
      { label: 'Clutch Factor', pVal: pStats.clutchFactor, rVal: rStats.clutchFactor, suffix: '/100' },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Advanced Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          {items.map((item) => {
            const maxV = item.suffix === '/10' ? 10 : 100;
            const pPct = (Number(item.pVal) / maxV) * 100;
            const rPct = (Number(item.rVal) / maxV) * 100;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400">{String(item.pVal)}{item.suffix}</span>
                  <span className="text-[10px] text-[#8b949e]">{item.label}</span>
                  <span className="text-[10px] font-bold text-cyan-400">{String(item.rVal)}{item.suffix}</span>
                </div>
                <div className="flex gap-1 h-1.5">
                  <div className="flex-1 flex justify-end">
                    <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${Math.min(pPct, 100)}%` }} />
                  </div>
                  <div className="flex-1">
                    <div className="h-full bg-cyan-500 rounded-sm" style={{ width: `${Math.min(rPct, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  function xgBars(): React.JSX.Element {
    const w = 340;
    const h = 200;
    const padding = { top: 25, bottom: 30, left: 40, right: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const seasons4 = xgData.seasons;
    const allXG = [...xgData.playerExpected, ...xgData.playerActual];
    const maxVal = Math.max(...allXG, 1);
    const barGroupW = chartW / seasons4.length;
    const barW = barGroupW * 0.28;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> xG vs Actual Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => {
              const y = padding.top + chartH * (1 - pct);
              const val = (maxVal * pct).toFixed(1);
              return (
                <g key={gi}>
                  <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.3} />
                  <text x={padding.left - 5} y={y + 3} fill="#484f58" fontSize={9} textAnchor="end">{val}</text>
                </g>
              );
            })}
            {/* Bars */}
            {seasons4.map((season, si) => {
              const gx = padding.left + si * barGroupW + barGroupW * 0.18;
              const expH = (xgData.playerExpected[si] / maxVal) * chartH;
              const actH = (xgData.playerActual[si] / maxVal) * chartH;
              return (
                <g key={season}>
                  <rect x={gx} y={padding.top + chartH - expH} width={barW} height={expH} fill="#f59e0b" opacity={0.6} rx={2} />
                  <rect x={gx + barW + 4} y={padding.top + chartH - actH} width={barW} height={actH} fill="#34d399" opacity={0.8} rx={2} />
                  <text x={gx + barW + 2} y={h - 8} fill="#8b949e" fontSize={10} textAnchor="middle">{season}</text>
                </g>
              );
            })}
            {/* Legend */}
            <rect x={padding.left} y={6} width={8} height={8} fill="#f59e0b" opacity={0.6} rx={1} />
            <text x={padding.left + 12} y={14} fill="#8b949e" fontSize={8}>Expected</text>
            <rect x={padding.left + 70} y={6} width={8} height={8} fill="#34d399" opacity={0.8} rx={1} />
            <text x={padding.left + 82} y={14} fill="#8b949e" fontSize={8}>Actual</text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function advancedStatsRadar(): React.JSX.Element {
    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 35;
    const n = ADVANCED_AXES.length;
    const gridLevels = [25, 50, 75, 100];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5" /> Advanced Stats Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="max-w-full">
            {/* Grid pentagons */}
            {gridLevels.map((level, gi) => (
              <polygon
                key={gi}
                points={buildPolygonPoints(ADVANCED_AXES.map(() => level), maxR, cx, cy)}
                fill="none"
                stroke={level === 100 ? '#30363d' : '#21262d'}
                strokeWidth={level === 100 ? 1.5 : 0.5}
              />
            ))}
            {/* Axes */}
            {ADVANCED_AXES.map((_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const ex = cx + maxR * Math.cos(angle);
              const ey = cy + maxR * Math.sin(angle);
              return (
                <line key={`ax-${i}`} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#30363d" strokeWidth={0.4} />
              );
            })}
            {/* Rival polygon */}
            <motion.polygon
              points={buildPolygonPoints(advancedMetrics.rivalAdvanced, maxR, cx, cy)}
              fill="#22d3ee"
              fillOpacity={0}
              stroke="#22d3ee"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              animate={{ fillOpacity: 0.1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            {/* Player polygon */}
            <motion.polygon
              points={buildPolygonPoints(advancedMetrics.playerAdvanced, maxR, cx, cy)}
              fill="#34d399"
              fillOpacity={0}
              stroke="#34d399"
              strokeWidth={2}
              animate={{ fillOpacity: 0.15 }}
              transition={{ duration: 0.5 }}
            />
            {/* Player dots */}
            {advancedMetrics.playerAdvanced.map((v, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const r = (v / 100) * maxR;
              return (
                <circle
                  key={`padv-${i}`}
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r={3}
                  fill="#34d399"
                />
              );
            })}
            {/* Rival dots */}
            {advancedMetrics.rivalAdvanced.map((v, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const r = (v / 100) * maxR;
              return (
                <circle
                  key={`radv-${i}`}
                  cx={cx + r * Math.cos(angle)}
                  cy={cy + r * Math.sin(angle)}
                  r={2.5}
                  fill="#22d3ee"
                />
              );
            })}
            {/* Labels */}
            {ADVANCED_AXES.map((label, i) => {
              const { x, y, anchor } = getAxisLabelPos(i, n, maxR, cx, cy);
              return (
                <text key={`albl-${i}`} x={x} y={y} textAnchor={anchor as "start" | "middle" | "end"} fill="#c9d1d9" fontSize={10} fontWeight={700} fontFamily="monospace">
                  {label.slice(0, 5)}
                </text>
              );
            })}
          </svg>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-emerald-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{playerName.split(' ')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-cyan-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{rivalData.name.split(' ')[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function bigGameScatter(): React.JSX.Element {
    const w = 320;
    const h = 220;
    const padding = { top: 20, bottom: 35, left: 40, right: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const minX = 0;
    const maxX = 100;
    const minY = 4.0;
    const maxY = 10.0;

    const toSvgX = (val: number) => padding.left + ((val - minX) / (maxX - minX)) * chartW;
    const toSvgY = (val: number) => padding.top + chartH * (1 - (val - minY) / (maxY - minY));

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> Big Game Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
            {/* Grid */}
            {[5, 6, 7, 8, 9, 10].map((val, gi) => {
              const y = toSvgY(val);
              return (
                <g key={gi}>
                  <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.2} />
                  <text x={padding.left - 5} y={y + 3} fill="#484f58" fontSize={9} textAnchor="end">{val}.0</text>
                </g>
              );
            })}
            {[0, 25, 50, 75, 100].map((val, gi) => {
              const x = toSvgX(val);
              return (
                <g key={gi}>
                  <line x1={x} y1={padding.top} x2={x} y2={h - padding.bottom} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.2} />
                </g>
              );
            })}
            {/* Player dots */}
            {bigGameScatterData.playerDots.map((d, i) => (
              <circle
                key={`pscat-${i}`}
                cx={toSvgX(d.x)}
                cy={toSvgY(d.y)}
                r={5}
                fill="#34d399"
                opacity={0.8}
              />
            ))}
            {/* Rival dots */}
            {bigGameScatterData.rivalDots.map((d, i) => (
              <circle
                key={`rscat-${i}`}
                cx={toSvgX(d.x)}
                cy={toSvgY(d.y)}
                r={5}
                fill="#22d3ee"
                opacity={0.8}
              />
            ))}
            {/* Axis labels */}
            <text x={w / 2} y={h - 5} fill="#8b949e" fontSize={9} textAnchor="middle">Match Importance</text>
            <text x={12} y={h / 2} fill="#8b949e" fontSize={9} textAnchor="middle" writingMode="tb">Rating</text>
          </svg>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{playerName.split(' ')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
              <span className="text-[10px] text-[#8b949e]">{rivalData.name.split(' ')[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function tabAdvanced(): React.JSX.Element {
    return (
      <div className="space-y-3">
        {xgSection()}
        {pressingIntensitySection()}
        <div className="grid grid-cols-1 gap-3">
          {xgBars()}
          {advancedStatsRadar()}
          {bigGameScatter()}
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div ref={containerRef} className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {headerSection()}
      {rivalSelector()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full h-auto flex p-1 rounded-xl">
          <TabsTrigger
            value="h2h"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">H2H</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger
            value="career"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Career</span>
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TabsContent value="h2h" className="mt-3 space-y-3">
              {tabH2H()}
            </TabsContent>
            <TabsContent value="stats" className="mt-3 space-y-3">
              {tabStats()}
            </TabsContent>
            <TabsContent value="career" className="mt-3 space-y-3">
              {tabCareer()}
            </TabsContent>
            <TabsContent value="advanced" className="mt-3 space-y-3">
              {tabAdvanced()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
