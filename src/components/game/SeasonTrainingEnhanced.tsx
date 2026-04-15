'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TrainingType } from '@/lib/game/types';

/* ============================================================
   Seeded deterministic pseudo-random helper
   ============================================================ */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* ============================================================
   Attribute helpers
   ============================================================ */
type CoreAttr = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';

const CORE_ATTRS: CoreAttr[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

const ATTR_LABELS: Record<CoreAttr, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

const ATTR_FULL: Record<CoreAttr, string> = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

/* ============================================================
   Tab configuration
   ============================================================ */
type TabKey = 'plan' | 'drills' | 'tracking' | 'recovery';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'plan', label: 'Season Plan' },
  { key: 'drills', label: 'Drills' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'recovery', label: 'Recovery' },
];

/* ============================================================
   Radar point builder
   ============================================================ */
function buildRadarPoints(
  values: number[],
  cx: number,
  cy: number,
  r: number
): string {
  const n = values.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  return values
    .map((v, i) => {
      const angle = start + i * step;
      const x = cx + r * (v / 100) * Math.cos(angle);
      const y = cy + r * (v / 100) * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function radarLabelPositions(
  count: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number }[] {
  const step = (2 * Math.PI) / count;
  const start = -Math.PI / 2;
  const lr = r + 14;
  return Array.from({ length: count }, (_, i) => {
    const angle = start + i * step;
    return {
      x: cx + lr * Math.cos(angle),
      y: cy + lr * Math.sin(angle),
    };
  });
}

/* ============================================================
   Donut arc helper
   ============================================================ */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const s = ((startAngle - 90) * Math.PI) / 180;
  const e = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/* ============================================================
   Circle ring path helper for progress rings
   ============================================================ */
function circlePath(cx: number, cy: number, r: number, pct: number): string {
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (filled / circumference) * 2 * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = filled > circumference / 2 ? 1 : 0;
  if (filled <= 0) {
    return '';
  }
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/* ============================================================
   Drill definitions for Tab 2
   ============================================================ */
interface DrillDef {
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  duration: string;
  color: string;
}

const DRILL_CATEGORIES = [
  { name: 'Shooting', icon: 'target', count: 12 },
  { name: 'Passing', icon: 'arrows', count: 10 },
  { name: 'Defending', icon: 'shield', count: 8 },
  { name: 'Physical', icon: 'bolt', count: 9 },
  { name: 'Mental', icon: 'brain', count: 6 },
];

const DRILLS: DrillDef[] = [
  { name: 'Finishing Under Pressure', category: 'Shooting', difficulty: 'Intermediate', duration: '30 min', color: '#CCFF00' },
  { name: 'Long Range Striking', category: 'Shooting', difficulty: 'Advanced', duration: '25 min', color: '#CCFF00' },
  { name: 'One-Touch Finishing', category: 'Shooting', difficulty: 'Elite', duration: '20 min', color: '#CCFF00' },
  { name: 'Penalty Box Drills', category: 'Shooting', difficulty: 'Beginner', duration: '15 min', color: '#CCFF00' },
  { name: 'Volley Practice', category: 'Shooting', difficulty: 'Advanced', duration: '25 min', color: '#CCFF00' },
  { name: 'Short Passing Grid', category: 'Passing', difficulty: 'Beginner', duration: '20 min', color: '#00E5FF' },
  { name: 'Through Ball Mastery', category: 'Passing', difficulty: 'Advanced', duration: '30 min', color: '#00E5FF' },
  { name: 'Cross Field Switches', category: 'Passing', difficulty: 'Intermediate', duration: '25 min', color: '#00E5FF' },
  { name: '1v1 Defending', category: 'Defending', difficulty: 'Intermediate', duration: '25 min', color: '#FF5500' },
  { name: 'Aerial Duels', category: 'Defending', difficulty: 'Elite', duration: '30 min', color: '#FF5500' },
  { name: 'Positioning Drill', category: 'Defending', difficulty: 'Beginner', duration: '20 min', color: '#FF5500' },
  { name: 'Sprint Intervals', category: 'Physical', difficulty: 'Advanced', duration: '35 min', color: '#FF5500' },
  { name: 'Agility Ladder', category: 'Physical', difficulty: 'Beginner', duration: '15 min', color: '#FF5500' },
  { name: 'Strength Circuit', category: 'Physical', difficulty: 'Elite', duration: '40 min', color: '#FF5500' },
  { name: 'Match Simulation', category: 'Mental', difficulty: 'Elite', duration: '60 min', color: '#666666' },
  { name: 'Visualization Session', category: 'Mental', difficulty: 'Beginner', duration: '20 min', color: '#666666' },
  { name: 'Set Piece Analysis', category: 'Mental', difficulty: 'Intermediate', duration: '25 min', color: '#666666' },
];

/* ============================================================
   Recovery definitions for Tab 4
   ============================================================ */
const RECOVERY_PROTOCOLS = [
  { name: 'Ice Bath', effectiveness: 82, color: '#00E5FF' },
  { name: 'Massage', effectiveness: 91, color: '#00E5FF' },
  { name: 'Stretching', effectiveness: 75, color: '#00E5FF' },
  { name: 'Sleep', effectiveness: 95, color: '#00E5FF' },
  { name: 'Nutrition', effectiveness: 88, color: '#00E5FF' },
];

const INJURY_PREVENTION_TIPS = [
  { title: 'Dynamic Warm-up', desc: '10 min mobility before every session' },
  { title: 'Hydration Protocol', desc: 'Minimum 3L water intake daily' },
  { title: 'Load Management', desc: 'Rest 1 day after high-intensity sessions' },
  { title: 'Flexibility Work', desc: '15 min stretching post-training' },
];

/* ============================================================
   Week plan blocks for Tab 1
   ============================================================ */
function generateWeekBlocks(currentWeek: number, season: number): { week: number; label: string; focus: string; sessions: number }[] {
  const phases = [
    { range: [1, 6], label: 'Pre-Season Base', focus: 'Physical & Conditioning' },
    { range: [7, 14], label: 'Technical Phase', focus: 'Technical & Ball Work' },
    { range: [15, 22], label: 'Tactical Integration', focus: 'Tactical & Match Prep' },
    { range: [23, 30], label: 'Competitive Peak', focus: 'Match Readiness' },
    { range: [31, 38], label: 'End-Season Recovery', focus: 'Recovery & Maintenance' },
  ];

  return phases.map((phase, idx) => {
    const midWeek = Math.round((phase.range[0] + phase.range[1]) / 2);
    const seed = season * 100 + midWeek + idx * 7;
    return {
      week: midWeek,
      label: phase.label,
      focus: phase.focus,
      sessions: Math.floor(seededRandom(seed) * 3) + 2,
    };
  });
}

/* ============================================================
   Main Component
   ============================================================ */
export default function SeasonTrainingEnhanced() {
  const gameState = useGameStore((s) => s.gameState);
  const [tab, setTab] = useState<TabKey>('plan');

  if (!gameState) return <></>;

  const { player } = gameState;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const trainingHistory = gameState?.trainingHistory ?? [];
  const trainingAvailable = gameState?.trainingAvailable ?? 3;
  const fitness = player?.fitness ?? 80;
  const morale = player?.morale ?? 70;
  const overall = player?.overall ?? 65;
  const currentClubName = gameState?.currentClub?.name ?? 'Club';

  /* ============================================================
    Derived data — deterministic from game state
    ============================================================ */

  const totalSessionsThisSeason = trainingHistory.length;

  const focusDistribution = ['attacking', 'defensive', 'physical', 'technical', 'tactical'].reduce(
    (acc, type) => {
      const count = trainingHistory.filter((s) => s.type === type).length;
      acc.push({ type, count });
      return acc;
    },
    [] as { type: string; count: number }[]
  );

  const focusTotal = focusDistribution.reduce((sum, f) => sum + f.count, 0);

  const weeklyVolume = Array.from({ length: 10 }, (_, i) => {
    const weekIdx = Math.max(0, currentWeek - 10 + i);
    const seed = currentSeason * 1000 + weekIdx;
    const base = seededRandom(seed) * 5 + 1;
    return {
      week: weekIdx + 1,
      sessions: Math.round(base),
    };
  });

  const drillDifficultyDist = ['Beginner', 'Intermediate', 'Advanced', 'Elite'].reduce(
    (acc, diff) => {
      const count = DRILLS.filter((d) => d.difficulty === diff).length;
      acc.push({ difficulty: diff, count });
      return acc;
    },
    [] as { difficulty: string; count: number }[]
  );

  const maxDrillCount = Math.max(...drillDifficultyDist.map((d) => d.count), 1);

  const drillCompletionRate = totalSessionsThisSeason > 0
    ? Math.min(Math.round((totalSessionsThisSeason / Math.max(currentWeek * 3, 1)) * 100), 100)
    : 0;

  const startAttrs: Record<CoreAttr, number> = CORE_ATTRS.reduce(
    (acc, attr) => {
      const seed = currentSeason * 100 + attr.charCodeAt(0) * 7;
      acc[attr] = Math.max(30, (player?.attributes?.[attr] ?? 60) - Math.floor(seededRandom(seed) * 8));
      return acc;
    },
    {} as Record<CoreAttr, number>
  );

  const currentAttrs: Record<CoreAttr, number> = CORE_ATTRS.reduce(
    (acc, attr) => {
      acc[attr] = player?.attributes?.[attr] ?? 60;
      return acc;
    },
    {} as Record<CoreAttr, number>
  );

  const monthLabels = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const seasonGrowthData = CORE_ATTRS.map((attr) => {
    const start = startAttrs[attr];
    const current = currentAttrs[attr];
    const growthPerMonth = (current - start) / 8;
    return Array.from({ length: 8 }, (_, m) => {
      const seed = currentSeason * 1000 + attr.charCodeAt(0) * 13 + m * 3;
      const noise = (seededRandom(seed) - 0.5) * 2;
      return Math.max(start, Math.min(current, start + growthPerMonth * (m + 1) + noise));
    });
  });

  const projectedAttrs = CORE_ATTRS.reduce(
    (acc, attr) => {
      const seed = currentSeason * 200 + attr.charCodeAt(0) * 11;
      const growth = Math.floor(seededRandom(seed) * 5) + 1;
      acc[attr] = Math.min(99, currentAttrs[attr] + growth);
      return acc;
    },
    {} as Record<CoreAttr, number>
  );

  const injuryRiskScore = fitness > 70
    ? Math.round(seededRandom(currentSeason * 50 + currentWeek) * 25 + 5)
    : fitness > 40
      ? Math.round(seededRandom(currentSeason * 50 + currentWeek) * 30 + 30)
      : Math.round(seededRandom(currentSeason * 50 + currentWeek) * 25 + 55);

  const fitnessTrend = Array.from({ length: 8 }, (_, i) => {
    const seed = currentSeason * 80 + currentWeek * 3 + i * 17;
    const base = fitness + (seededRandom(seed) - 0.4) * 20;
    return Math.max(20, Math.min(100, Math.round(base)));
  });

  /* ============================================================
    Week plan blocks
    ============================================================ */
  const weekBlocks = generateWeekBlocks(currentWeek, currentSeason);

  /* ============================================================
    Render — Header
    ============================================================ */
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border-web3 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M2 12h4M18 12h4M12 2v4M12 18v4" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-bright font-grotesk">Season Training</h1>
          <p className="text-[10px] text-text-dim">
            Season {currentSeason} &middot; Week {currentWeek} &middot; {currentClubName}
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-2 border border-border-web3 rounded-lg p-3">
          <p className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Fitness</p>
          <p className="text-sm font-bold text-neon-lime mt-0.5">{fitness}%</p>
        </div>
        <div className="bg-surface-2 border border-border-web3 rounded-lg p-3">
          <p className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Overall</p>
          <p className="text-sm font-bold text-cyan-accent mt-0.5">{overall}</p>
        </div>
        <div className="bg-surface-2 border border-border-web3 rounded-lg p-3">
          <p className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Sessions</p>
          <p className="text-sm font-bold text-electric-orange mt-0.5">{totalSessionsThisSeason}</p>
        </div>
      </div>

      {/* Training available indicator */}
      <div className="bg-surface-2 border border-border-web3 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-text-dim" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-[10px] text-text-mid uppercase tracking-wider font-medium">Weekly Sessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-md border ${
                  i < 3 - trainingAvailable
                    ? 'bg-neon-lime border-neon-lime'
                    : 'bg-transparent border-border-web3'
                }`}
              />
            ))}
            <span className="text-[10px] font-bold text-text-bright ml-1">
              {3 - trainingAvailable}/3
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-border-web3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 text-[10px] font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-surface-2 text-neon-lime'
                : 'text-text-mid hover:text-text-bright'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB 1: Season Plan
          ============================================================ */}
      {tab === 'plan' && (
        <div className="space-y-3">
          {/* SVG 1: Season Training Progress Ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-electric-orange/50 border border-electric-orange/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Season Progress</h3>
              </div>
              <span className="text-[9px] font-bold text-electric-orange">
                {currentWeek}/38 Weeks
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Background ring */}
              <circle
                cx="160"
                cy="75"
                r="50"
                fill="none"
                stroke="#222222"
                strokeWidth="8"
              />
              {/* Progress arc */}
              {(() => {
                const pct = (currentWeek / 38) * 100;
                const path = circlePath(160, 75, 50, pct);
                return path ? (
                  <path
                    d={path}
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                ) : null;
              })()}
              {/* Center text */}
              <text x="160" y="70" textAnchor="middle" fill="#e8e8e8" fontSize="18" fontWeight="bold" fontFamily="monospace">
                {Math.round((currentWeek / 38) * 100)}%
              </text>
              <text x="160" y="88" textAnchor="middle" fill="#666666" fontSize="9" fontFamily="monospace">
                COMPLETE
              </text>
              {/* Week markers at 25%, 50%, 75% */}
              {[25, 50, 75].map((mark) => {
                const angle = ((mark / 100) * 360 - 90) * (Math.PI / 180);
                const mx = 160 + 60 * Math.cos(angle);
                const my = 75 + 60 * Math.sin(angle);
                return (
                  <text
                    key={mark}
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    fill="#666666"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    W{Math.round(38 * mark / 100)}
                  </text>
                );
              })}
            </svg>
          </motion.div>

          {/* SVG 2: Weekly Focus Donut */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-neon-lime/50 border border-neon-lime/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-neon-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Weekly Focus</h3>
              </div>
              <span className="text-[9px] font-bold text-neon-lime">
                {focusTotal} Sessions
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 110;
                const cy = 70;
                const outerR = 45;
                const innerR = 28;
                const colors = ['#CCFF00', '#00E5FF', '#FF5500', '#FF5500', '#666666'];
                const labels = ['ATK', 'DEF', 'PHY', 'TEC', 'TAC'];
                const data = focusDistribution.map((f) => f.count);
                const total = Math.max(focusTotal, 1);

                const angleOffsets = data.reduce(
                  (acc, val) => {
                    const lastEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
                    const pct = (val / total) * 360;
                    acc.push({
                      startAngle: lastEnd,
                      endAngle: lastEnd + pct,
                      midAngle: lastEnd + pct / 2,
                      pct,
                      val,
                    });
                    return acc;
                  },
                  [] as { startAngle: number; endAngle: number; midAngle: number; pct: number; val: number }[]
                );

                return (
                  <>
                    {/* Donut segments */}
                    {angleOffsets.map((seg, i) => {
                      const { startAngle, endAngle, midAngle, pct, val } = seg;

                      if (val === 0) return <></>;

                      const outerStart = ((startAngle - 90) * Math.PI) / 180;
                      const outerEnd = ((endAngle - 90) * Math.PI) / 180;
                      const innerStart = ((endAngle - 90) * Math.PI) / 180;
                      const innerEnd = ((startAngle - 90) * Math.PI) / 180;

                      const ox1 = cx + outerR * Math.cos(outerStart);
                      const oy1 = cy + outerR * Math.sin(outerStart);
                      const ox2 = cx + outerR * Math.cos(outerEnd);
                      const oy2 = cy + outerR * Math.sin(outerEnd);
                      const ix1 = cx + innerR * Math.cos(innerStart);
                      const iy1 = cy + innerR * Math.sin(innerStart);
                      const ix2 = cx + innerR * Math.cos(innerEnd);
                      const iy2 = cy + innerR * Math.sin(innerEnd);
                      const large = pct > 180 ? 1 : 0;

                      const labelR = (outerR + innerR) / 2;
                      const lx = cx + labelR * Math.cos(((midAngle - 90) * Math.PI) / 180);
                      const ly = cy + labelR * Math.sin(((midAngle - 90) * Math.PI) / 180);

                      return (
                        <g key={labels[i]}>
                          <path
                            d={`M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`}
                            fill={colors[i]}
                            opacity={0.85}
                          />
                          {pct > 20 && (
                            <text
                              x={lx}
                              y={ly}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#000000"
                              fontSize="7"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {labels[i]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* Center label */}
                    <text x={cx} y={cy - 4} textAnchor="middle" fill="#e8e8e8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                      {totalSessionsThisSeason}
                    </text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fill="#666666" fontSize="7" fontFamily="monospace">
                      TOTAL
                    </text>
                    {/* Legend */}
                    {labels.map((label, i) => {
                      const lx = 210;
                      const ly = 20 + i * 22;
                      return (
                        <g key={`legend-${label}`}>
                          <rect x={lx} y={ly} width="10" height="10" rx="2" fill={colors[i]} />
                          <text x={lx + 16} y={ly + 8} fill="#999999" fontSize="9" fontFamily="monospace">
                            {label} {data[i]}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* SVG 3: Training Volume Area Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-accent/50 border border-cyan-accent/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-cyan-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 4-10" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Training Volume</h3>
              </div>
              <span className="text-[9px] font-bold text-cyan-accent">
                10-Week View
              </span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const padding = { left: 30, right: 10, top: 10, bottom: 25 };
                const w = 320 - padding.left - padding.right;
                const h = 120 - padding.top - padding.bottom;
                const maxVal = Math.max(...weeklyVolume.map((v) => v.sessions), 6);

                const points = weeklyVolume.map((v, i) => {
                  const x = padding.left + (i / (weeklyVolume.length - 1)) * w;
                  const y = padding.top + h - (v.sessions / maxVal) * h;
                  return { x, y };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + h} L ${points[0].x} ${padding.top + h} Z`;

                return (
                  <>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                      const y = padding.top + h * (1 - frac);
                      return (
                        <g key={`grid-${idx}`}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={320 - padding.right}
                            y2={y}
                            stroke="#222222"
                            strokeWidth="0.5"
                          />
                          <text
                            x={padding.left - 5}
                            y={y + 3}
                            textAnchor="end"
                            fill="#666666"
                            fontSize="7"
                            fontFamily="monospace"
                          >
                            {Math.round(maxVal * frac)}
                          </text>
                        </g>
                      );
                    })}
                    {/* Area fill */}
                    <path
                      d={areaPath}
                      fill="#00E5FF"
                      opacity={0.15}
                    />
                    {/* Line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    {points.map((p, i) => (
                      <circle
                        key={`dot-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill="#00E5FF"
                        stroke="#0a0a0a"
                        strokeWidth="1.5"
                      />
                    ))}
                    {/* X-axis labels */}
                    {weeklyVolume.map((v, i) => {
                      const x = padding.left + (i / (weeklyVolume.length - 1)) * w;
                      return (
                        <text
                          key={`x-${i}`}
                          x={x}
                          y={120 - 5}
                          textAnchor="middle"
                          fill="#666666"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          W{v.week}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* Season Plan Week Blocks */}
          <div className="space-y-2">
            {weekBlocks.map((block, idx) => {
              const isCurrent = currentWeek >= block.week - 3 && currentWeek <= block.week + 3;
              return (
                <motion.div
                  key={block.week}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                  className={`bg-surface-2 border rounded-lg p-3 ${
                    isCurrent ? 'border-electric-orange/50' : 'border-border-web3'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-dim">W{block.week}</span>
                        <span className="text-xs font-bold text-text-bright">{block.label}</span>
                        {isCurrent && (
                          <span className="text-[8px] font-bold text-electric-orange bg-electric-orange/15 px-1.5 py-0.5 rounded-md">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-mid mt-0.5">{block.focus}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-cyan-accent">{block.sessions}</p>
                      <p className="text-[9px] text-text-dim">sessions/wk</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: Drills
          ============================================================ */}
      {tab === 'drills' && (
        <div className="space-y-3">
          {/* SVG 4: Drill Difficulty Distribution Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-neon-lime/50 border border-neon-lime/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-neon-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Difficulty Distribution</h3>
              </div>
              <span className="text-[9px] font-bold text-neon-lime">
                {DRILLS.length} Drills
              </span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const colors = ['#CCFF00', '#00E5FF', '#FF5500', '#FF5500'];
                const barH = 18;
                const gap = 8;
                const startY = 10;
                const labelW = 75;
                const barMaxW = 320 - labelW - 40;

                return drillDifficultyDist.map((item, i) => {
                  const y = startY + i * (barH + gap);
                  const barW = (item.count / maxDrillCount) * barMaxW;
                  return (
                    <g key={item.difficulty}>
                      {/* Background bar */}
                      <rect
                        x={labelW}
                        y={y}
                        width={barMaxW}
                        height={barH}
                        rx="4"
                        fill="#1a1a1a"
                      />
                      {/* Value bar */}
                      <rect
                        x={labelW}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="4"
                        fill={colors[i]}
                        opacity={0.85}
                      />
                      {/* Label */}
                      <text
                        x={labelW - 5}
                        y={y + barH / 2 + 3}
                        textAnchor="end"
                        fill="#999999"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {item.difficulty}
                      </text>
                      {/* Count */}
                      <text
                        x={labelW + barW + 5}
                        y={y + barH / 2 + 3}
                        fill="#e8e8e8"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {item.count}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* SVG 5: Drill Category Radar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-accent/50 border border-cyan-accent/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-cyan-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Category Coverage</h3>
              </div>
              <span className="text-[9px] font-bold text-cyan-accent">
                5 Axes
              </span>
            </div>
            <svg viewBox="0 0 320 160" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 130;
                const cy = 80;
                const r = 55;
                const categoryValues = DRILL_CATEGORIES.map((cat) => {
                  const maxPossible = 15;
                  return (cat.count / maxPossible) * 100;
                });
                const labels = DRILL_CATEGORIES.map((c) => c.name.slice(0, 3).toUpperCase());
                const labelPositions = radarLabelPositions(5, cx, cy, r);

                return (
                  <>
                    {/* Grid pentagons */}
                    {[25, 50, 75, 100].map((val) => (
                      <polygon
                        key={val}
                        points={buildRadarPoints(
                          Array.from({ length: 5 }, () => val),
                          cx,
                          cy,
                          r * (val / 100)
                        )}
                        fill="none"
                        stroke="#222222"
                        strokeWidth="0.5"
                      />
                    ))}
                    {/* Axis lines */}
                    {labelPositions.map((pos, i) => (
                      <line
                        key={`axis-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={cx + r * Math.cos((-Math.PI / 2 + i * (2 * Math.PI / 5)))}
                        y2={cy + r * Math.sin((-Math.PI / 2 + i * (2 * Math.PI / 5)))}
                        stroke="#222222"
                        strokeWidth="0.5"
                      />
                    ))}
                    {/* Data polygon */}
                    <polygon
                      points={buildRadarPoints(categoryValues, cx, cy, r)}
                      fill="#00E5FF"
                      opacity={0.2}
                      stroke="#00E5FF"
                      strokeWidth="1.5"
                    />
                    {/* Data points */}
                    {(() => {
                      const n = 5;
                      const step = (2 * Math.PI) / n;
                      const start = -Math.PI / 2;
                      return categoryValues.map((v, i) => {
                        const angle = start + i * step;
                        const px = cx + r * (v / 100) * Math.cos(angle);
                        const py = cy + r * (v / 100) * Math.sin(angle);
                        return (
                          <circle
                            key={`radar-dot-${i}`}
                            cx={px}
                            cy={py}
                            r="3"
                            fill="#00E5FF"
                            stroke="#0a0a0a"
                            strokeWidth="1.5"
                          />
                        );
                      });
                    })()}
                    {/* Labels */}
                    {labels.map((label, i) => (
                      <text
                        key={`rl-${i}`}
                        x={labelPositions[i].x}
                        y={labelPositions[i].y + 3}
                        textAnchor="middle"
                        fill="#999999"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {label}
                      </text>
                    ))}
                    {/* Legend on right */}
                    {DRILL_CATEGORIES.map((cat, i) => (
                      <g key={`cat-leg-${i}`}>
                        <text
                          x={230}
                          y={25 + i * 24}
                          fill="#e8e8e8"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {cat.name}
                        </text>
                        <text
                          x={230}
                          y={37 + i * 24}
                          fill="#666666"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {cat.count} drills
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* SVG 6: Drill Completion Rate Ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-neon-lime/50 border border-neon-lime/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-neon-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Completion Rate</h3>
              </div>
              <span className="text-[9px] font-bold text-neon-lime">
                Season Avg
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Background ring */}
              <circle
                cx="120"
                cy="70"
                r="45"
                fill="none"
                stroke="#222222"
                strokeWidth="8"
              />
              {/* Progress arc */}
              {(() => {
                const path = circlePath(120, 70, 45, drillCompletionRate);
                return path ? (
                  <path
                    d={path}
                    fill="none"
                    stroke="#CCFF00"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                ) : null;
              })()}
              {/* Center text */}
              <text x="120" y="65" textAnchor="middle" fill="#e8e8e8" fontSize="18" fontWeight="bold" fontFamily="monospace">
                {drillCompletionRate}%
              </text>
              <text x="120" y="82" textAnchor="middle" fill="#666666" fontSize="9" fontFamily="monospace">
                COMPLETION
              </text>
              {/* Stats on right */}
              <g>
                <text x="210" y="45" fill="#999999" fontSize="9" fontFamily="monospace">Planned</text>
                <text x="210" y="60" fill="#e8e8e8" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {Math.max(currentWeek * 3, 0)}
                </text>
                <text x="210" y="80" fill="#999999" fontSize="9" fontFamily="monospace">Completed</text>
                <text x="210" y="95" fill="#CCFF00" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {totalSessionsThisSeason}
                </text>
              </g>
            </svg>
          </motion.div>

          {/* Drill category cards */}
          <div className="space-y-2">
            {DRILL_CATEGORIES.map((cat, idx) => {
              const catDrills = DRILLS.filter((d) => d.category === cat.name);
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + idx * 0.04 }}
                  className="bg-surface-2 border border-border-web3 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-surface-3 border border-border-web3 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 text-text-mid" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-text-bright">{cat.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-text-dim">{cat.count} drills</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {catDrills.slice(0, 3).map((d) => (
                      <span
                        key={d.name}
                        className="text-[9px] px-2 py-1 rounded-md bg-surface-3 border border-border-web3 text-text-mid"
                      >
                        {d.name}
                      </span>
                    ))}
                    {catDrills.length > 3 && (
                      <span className="text-[9px] px-2 py-1 rounded-md bg-surface-3 border border-border-web3 text-text-dim">
                        +{catDrills.length - 3} more
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: Tracking
          ============================================================ */}
      {tab === 'tracking' && (
        <div className="space-y-3">
          {/* SVG 7: Attribute Growth Comparison Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-neon-lime/50 border border-neon-lime/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-neon-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10M18 20V4M6 20v-4" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Growth Comparison</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[8px] text-text-dim">
                  <span className="w-2 h-2 rounded-sm bg-[#666666]" /> Start
                </span>
                <span className="flex items-center gap-1 text-[8px] text-text-dim">
                  <span className="w-2 h-2 rounded-sm bg-neon-lime" /> Current
                </span>
              </div>
            </div>
            <svg viewBox="0 0 320 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const labelW = 35;
                const barW = 105;
                const barH = 12;
                const gap = 6;
                const startY = 8;

                return CORE_ATTRS.map((attr, i) => {
                  const y = startY + i * (barH * 2 + gap + 6);
                  const startVal = startAttrs[attr];
                  const currentVal = currentAttrs[attr];
                  const startW = (startVal / 99) * barW;
                  const currentW = (currentVal / 99) * barW;

                  return (
                    <g key={attr}>
                      {/* Label */}
                      <text
                        x={labelW - 5}
                        y={y + barH + 4}
                        textAnchor="end"
                        fill="#999999"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {ATTR_LABELS[attr]}
                      </text>
                      {/* Start bar */}
                      <rect
                        x={labelW}
                        y={y}
                        width={startW}
                        height={barH}
                        rx="3"
                        fill="#666666"
                        opacity={0.6}
                      />
                      <text
                        x={labelW + startW + 4}
                        y={y + barH - 2}
                        fill="#666666"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {startVal}
                      </text>
                      {/* Current bar */}
                      <rect
                        x={labelW}
                        y={y + barH + 3}
                        width={currentW}
                        height={barH}
                        rx="3"
                        fill="#CCFF00"
                        opacity={0.85}
                      />
                      <text
                        x={labelW + currentW + 4}
                        y={y + barH * 2 + 1}
                        fill="#CCFF00"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {currentVal}
                      </text>
                      {/* Delta */}
                      {currentVal !== startVal && (
                        <text
                          x={320 - 10}
                          y={y + barH + 4}
                          textAnchor="end"
                          fill={currentVal > startVal ? '#CCFF00' : '#FF5500'}
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {currentVal > startVal ? '+' : ''}{currentVal - startVal}
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* SVG 8: Season Training Impact Area Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-accent/50 border border-cyan-accent/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-cyan-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 4-6" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Season Impact</h3>
              </div>
              <span className="text-[9px] font-bold text-cyan-accent">
                8-Month
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const padding = { left: 30, right: 10, top: 10, bottom: 25 };
                const w = 320 - padding.left - padding.right;
                const h = 140 - padding.top - padding.bottom;
                const allVals = seasonGrowthData.flat();
                const minVal = Math.min(...allVals, 30);
                const maxVal = Math.max(...allVals, 99);
                const range = maxVal - minVal || 1;

                return (
                  <>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                      const y = padding.top + h * (1 - frac);
                      return (
                        <g key={`sgrid-${idx}`}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={320 - padding.right}
                            y2={y}
                            stroke="#222222"
                            strokeWidth="0.5"
                          />
                          <text
                            x={padding.left - 5}
                            y={y + 3}
                            textAnchor="end"
                            fill="#666666"
                            fontSize="7"
                            fontFamily="monospace"
                          >
                            {Math.round(minVal + range * frac)}
                          </text>
                        </g>
                      );
                    })}
                    {/* Area for each attribute */}
                    {seasonGrowthData.map((data, attrIdx) => {
                      const points = data.map((v, m) => {
                        const x = padding.left + (m / (data.length - 1)) * w;
                        const y = padding.top + h - ((v - minVal) / range) * h;
                        return { x, y };
                      });
                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + h} L ${points[0].x} ${padding.top + h} Z`;
                      return (
                        <g key={`attr-area-${attrIdx}`}>
                          <path
                            d={areaPath}
                            fill="#00E5FF"
                            opacity={0.04 + attrIdx * 0.03}
                          />
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#00E5FF"
                            strokeWidth="1"
                            opacity={0.3 + attrIdx * 0.12}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      );
                    })}
                    {/* Month labels */}
                    {monthLabels.map((label, i) => {
                      const x = padding.left + (i / (monthLabels.length - 1)) * w;
                      return (
                        <text
                          key={`ml-${i}`}
                          x={x}
                          y={140 - 5}
                          textAnchor="middle"
                          fill="#666666"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {label}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* SVG 9: Projected End-of-Season Radar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-electric-orange/50 border border-electric-orange/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 0 20" fill="#FF5500" opacity="0.3" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Projected Stats</h3>
              </div>
              <span className="text-[9px] font-bold text-electric-orange">
                End of Season
              </span>
            </div>
            <svg viewBox="0 0 320 160" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 110;
                const cy = 80;
                const r = 55;
                const projectedValues = CORE_ATTRS.map((a) => projectedAttrs[a]);
                const labelPositions = radarLabelPositions(6, cx, cy, r);

                return (
                  <>
                    {/* Grid hexagons */}
                    {[25, 50, 75, 100].map((val) => (
                      <polygon
                        key={val}
                        points={buildRadarPoints(
                          Array.from({ length: 6 }, () => val),
                          cx,
                          cy,
                          r * (val / 100)
                        )}
                        fill="none"
                        stroke="#222222"
                        strokeWidth="0.5"
                      />
                    ))}
                    {/* Axis lines */}
                    {labelPositions.map((_, i) => (
                      <line
                        key={`proj-axis-${i}`}
                        x1={cx}
                        y1={cy}
                        x2={cx + r * Math.cos((-Math.PI / 2 + i * (2 * Math.PI / 6)))}
                        y2={cy + r * Math.sin((-Math.PI / 2 + i * (2 * Math.PI / 6)))}
                        stroke="#222222"
                        strokeWidth="0.5"
                      />
                    ))}
                    {/* Projected polygon */}
                    <polygon
                      points={buildRadarPoints(projectedValues, cx, cy, r)}
                      fill="#FF5500"
                      opacity={0.2}
                      stroke="#FF5500"
                      strokeWidth="1.5"
                    />
                    {/* Data points */}
                    {(() => {
                      const n = 6;
                      const step = (2 * Math.PI) / n;
                      const start = -Math.PI / 2;
                      return projectedValues.map((v, i) => {
                        const angle = start + i * step;
                        const px = cx + r * (v / 100) * Math.cos(angle);
                        const py = cy + r * (v / 100) * Math.sin(angle);
                        return (
                          <circle
                            key={`proj-dot-${i}`}
                            cx={px}
                            cy={py}
                            r="3"
                            fill="#FF5500"
                            stroke="#0a0a0a"
                            strokeWidth="1.5"
                          />
                        );
                      });
                    })()}
                    {/* Labels */}
                    {CORE_ATTRS.map((attr, i) => (
                      <text
                        key={`proj-lbl-${i}`}
                        x={labelPositions[i].x}
                        y={labelPositions[i].y + 3}
                        textAnchor="middle"
                        fill="#999999"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {ATTR_LABELS[attr]}
                      </text>
                    ))}
                    {/* Right side stats */}
                    {CORE_ATTRS.map((attr, i) => {
                      const rx = 220;
                      const ry = 18 + i * 22;
                      return (
                        <g key={`proj-stat-${i}`}>
                          <text
                            x={rx}
                            y={ry}
                            fill="#999999"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {ATTR_FULL[attr]}
                          </text>
                          <text
                            x={rx}
                            y={ry + 12}
                            fill="#FF5500"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {projectedAttrs[attr]}
                          </text>
                          {projectedAttrs[attr] > currentAttrs[attr] && (
                            <text
                              x={rx + 30}
                              y={ry + 12}
                              fill="#CCFF00"
                              fontSize="8"
                              fontFamily="monospace"
                            >
                              +{projectedAttrs[attr] - currentAttrs[attr]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* Attribute progress cards */}
          <div className="grid grid-cols-2 gap-2">
            {CORE_ATTRS.map((attr, idx) => {
              const current = currentAttrs[attr];
              const start = startAttrs[attr];
              const projected = projectedAttrs[attr];
              const delta = current - start;
              return (
                <motion.div
                  key={attr}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + idx * 0.04 }}
                  className="bg-surface-2 border border-border-web3 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-text-mid">{ATTR_LABELS[attr]}</span>
                    <span className={`text-[9px] font-bold ${
                      delta > 0 ? 'text-neon-lime' : delta < 0 ? 'text-electric-orange' : 'text-text-dim'
                    }`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold text-text-bright">{current}</span>
                    <span className="text-[9px] text-text-dim pb-0.5">{start} &rarr; {projected}</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-md mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-neon-lime"
                      style={{ width: `${(current / 99) * 100}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: Recovery
          ============================================================ */}
      {tab === 'recovery' && (
        <div className="space-y-3">
          {/* SVG 10: Injury Risk Gauge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-electric-orange/50 border border-electric-orange/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Injury Risk</h3>
              </div>
              <span className={`text-[9px] font-bold ${
                injuryRiskScore < 30 ? 'text-neon-lime' : injuryRiskScore < 60 ? 'text-electric-orange' : 'text-electric-orange'
              }`}>
                {injuryRiskScore < 30 ? 'LOW' : injuryRiskScore < 60 ? 'MEDIUM' : 'HIGH'}
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 160;
                const cy = 110;
                const r = 80;
                const startDeg = 180;
                const endDeg = 360;
                const riskDeg = startDeg + (injuryRiskScore / 100) * (endDeg - startDeg);

                const gaugeArc = describeArc(cx, cy, r, startDeg, riskDeg);
                const bgArc = describeArc(cx, cy, r, startDeg, endDeg);

                const riskColor = injuryRiskScore < 30 ? '#CCFF00' : injuryRiskScore < 60 ? '#FF5500' : '#FF5500';

                const needleAngle = ((riskDeg - 90) * Math.PI) / 180;
                const needleLen = r - 15;
                const nx = cx + needleLen * Math.cos(needleAngle);
                const ny = cy + needleLen * Math.sin(needleAngle);

                return (
                  <>
                    {/* Background arc */}
                    <path
                      d={bgArc}
                      fill="none"
                      stroke="#222222"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* Value arc */}
                    {gaugeArc && (
                      <path
                        d={gaugeArc}
                        fill="none"
                        stroke={riskColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Needle */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={nx}
                      y2={ny}
                      stroke={riskColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx={cx} cy={cy} r="4" fill={riskColor} />
                    {/* Value text */}
                    <text
                      x={cx}
                      y={cy - 15}
                      textAnchor="middle"
                      fill="#e8e8e8"
                      fontSize="22"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {injuryRiskScore}
                    </text>
                    <text
                      x={cx}
                      y={cy - 2}
                      textAnchor="middle"
                      fill="#666666"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      OUT OF 100
                    </text>
                    {/* Scale labels */}
                    {[
                      { deg: 180, label: '0' },
                      { deg: 225, label: '25' },
                      { deg: 270, label: '50' },
                      { deg: 315, label: '75' },
                      { deg: 360, label: '100' },
                    ].map((mark) => {
                      const angle = ((mark.deg - 90) * Math.PI) / 180;
                      const lx = cx + (r + 14) * Math.cos(angle);
                      const ly = cy + (r + 14) * Math.sin(angle);
                      return (
                        <text
                          key={`gauge-${mark.label}`}
                          x={lx}
                          y={ly + 3}
                          textAnchor="middle"
                          fill="#666666"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {mark.label}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* SVG 11: Fitness Trend Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-neon-lime/50 border border-neon-lime/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-neon-lime" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Fitness Trend</h3>
              </div>
              <span className="text-[9px] font-bold text-neon-lime">
                {fitness}% Now
              </span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const padding = { left: 35, right: 10, top: 10, bottom: 25 };
                const w = 320 - padding.left - padding.right;
                const h = 120 - padding.top - padding.bottom;

                const points = fitnessTrend.map((v, i) => ({
                  x: padding.left + (i / (fitnessTrend.length - 1)) * w,
                  y: padding.top + h - (v / 100) * h,
                }));

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((val) => {
                      const y = padding.top + h * (1 - val / 100);
                      return (
                        <g key={`fgrid-${val}`}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={320 - padding.right}
                            y2={y}
                            stroke="#222222"
                            strokeWidth="0.5"
                          />
                          <text
                            x={padding.left - 5}
                            y={y + 3}
                            textAnchor="end"
                            fill="#666666"
                            fontSize="7"
                            fontFamily="monospace"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                    {/* Danger zone (below 40) */}
                    <rect
                      x={padding.left}
                      y={padding.top + h * 0.6}
                      width={w}
                      height={h * 0.4}
                      fill="#FF5500"
                      opacity={0.05}
                    />
                    {/* Line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#CCFF00"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    {points.map((p, i) => {
                      const val = fitnessTrend[i];
                      const color = val < 40 ? '#FF5500' : val < 70 ? '#00E5FF' : '#CCFF00';
                      return (
                        <circle
                          key={`fdot-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill={color}
                          stroke="#0a0a0a"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                    {/* X-axis labels */}
                    {fitnessTrend.map((_, i) => {
                      const x = padding.left + (i / (fitnessTrend.length - 1)) * w;
                      return (
                        <text
                          key={`fx-${i}`}
                          x={x}
                          y={120 - 5}
                          textAnchor="middle"
                          fill="#666666"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          W{i + 1}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* SVG 12: Recovery Protocol Bars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-accent/50 border border-cyan-accent/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-cyan-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-text-bright">Recovery Protocols</h3>
              </div>
              <span className="text-[9px] font-bold text-cyan-accent">
                Effectiveness
              </span>
            </div>
            <svg viewBox="0 0 320 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const labelW = 70;
                const barMaxW = 180;
                const barH = 16;
                const gap = 8;
                const startY = 10;

                return RECOVERY_PROTOCOLS.map((proto, i) => {
                  const y = startY + i * (barH + gap);
                  const barW = (proto.effectiveness / 100) * barMaxW;

                  return (
                    <g key={proto.name}>
                      {/* Background */}
                      <rect
                        x={labelW}
                        y={y}
                        width={barMaxW}
                        height={barH}
                        rx="4"
                        fill="#1a1a1a"
                      />
                      {/* Value bar */}
                      <rect
                        x={labelW}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="4"
                        fill="#00E5FF"
                        opacity={0.8}
                      />
                      {/* Label */}
                      <text
                        x={labelW - 5}
                        y={y + barH / 2 + 3}
                        textAnchor="end"
                        fill="#999999"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {proto.name}
                      </text>
                      {/* Percentage */}
                      <text
                        x={labelW + barMaxW + 5}
                        y={y + barH / 2 + 3}
                        fill="#e8e8e8"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {proto.effectiveness}%
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* Recovery metrics cards */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="bg-surface-2 border border-border-web3 rounded-lg p-3"
            >
              <p className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Current Fitness</p>
              <p className={`text-lg font-bold mt-0.5 ${
                fitness > 70 ? 'text-neon-lime' : fitness > 40 ? 'text-cyan-accent' : 'text-electric-orange'
              }`}>
                {fitness}%
              </p>
              <div className="h-1.5 bg-surface-3 rounded-md mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-md ${
                    fitness > 70 ? 'bg-neon-lime' : fitness > 40 ? 'bg-cyan-accent' : 'bg-electric-orange'
                  }`}
                  style={{ width: `${fitness}%` }}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-surface-2 border border-border-web3 rounded-lg p-3"
            >
              <p className="text-[9px] text-text-dim uppercase tracking-wider font-medium">Morale</p>
              <p className={`text-lg font-bold mt-0.5 ${
                morale > 70 ? 'text-neon-lime' : morale > 40 ? 'text-cyan-accent' : 'text-electric-orange'
              }`}>
                {morale}%
              </p>
              <div className="h-1.5 bg-surface-3 rounded-md mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-md ${
                    morale > 70 ? 'bg-neon-lime' : morale > 40 ? 'bg-cyan-accent' : 'bg-electric-orange'
                  }`}
                  style={{ width: `${morale}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* Injury prevention tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="bg-surface-2 border border-border-web3 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-electric-orange/50 border border-electric-orange/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
              </div>
              <h3 className="text-xs font-bold text-text-bright">Injury Prevention Tips</h3>
            </div>
            <div className="space-y-2">
              {INJURY_PREVENTION_TIPS.map((tip, i) => (
                <div
                  key={tip.title}
                  className="flex items-start gap-2.5 p-2.5 bg-surface-3 border border-border-web3 rounded-lg"
                >
                  <div className="w-5 h-5 rounded-md bg-surface-2 border border-border-web3 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-neon-lime">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-text-bright">{tip.title}</p>
                    <p className="text-[10px] text-text-mid mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active injury warning */}
          {gameState?.currentInjury && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-surface-2 border border-electric-orange/50 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-electric-orange/50 border border-electric-orange/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-electric-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-electric-orange">Active Injury</h3>
                  <p className="text-[10px] text-text-dim">{gameState.currentInjury.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-text-mid">Weeks Remaining</p>
                  <p className="text-sm font-bold text-text-bright">{gameState.currentInjury.weeksRemaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-mid">Severity</p>
                  <p className="text-sm font-bold text-electric-orange capitalize">{gameState.currentInjury.type}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
