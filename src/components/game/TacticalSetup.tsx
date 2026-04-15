'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Swords,
  Target,
  Zap,
  ArrowUp,
  Lock,
  Crosshair,
  Sparkles,
  Rocket,
  Timer,
  Brain,
  CheckCircle2,
  ChevronRight,
  Scale,
  Users,
  ClipboardCheck,
  Activity,
} from 'lucide-react';
import type { Position, PlayerAttributes } from '@/lib/game/types';
import { useGameStore } from '@/store/gameStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TacticalSetupProps {
  isOpen: boolean;
  onClose: () => void;
  playerPosition: Position;
  playerAttributes: PlayerAttributes;
}

interface FormationDef {
  id: string;
  name: string;
  description: string;
  positions: { x: number; y: number }[];
}

interface EffectTag {
  label: string;
  positive: boolean;
}

interface SelectOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  effects: EffectTag[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_BG = 'bg-[#161b22]';
const BORDER = 'border-[#30363d]';
const TEXT_PRI = 'text-[#c9d1d9]';
const TEXT_SEC = 'text-[#8b949e]';

const FORMATIONS: FormationDef[] = [
  {
    id: '4-4-2',
    name: '4-4-2',
    description: 'Classic flat formation — solid in defence and attack',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 15, y: 44 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 85, y: 44 },
      { x: 38, y: 22 }, { x: 62, y: 22 },
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    description: 'Wide attacking shape with wingers and a lone striker',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 30, y: 44 }, { x: 50, y: 40 }, { x: 70, y: 44 },
      { x: 18, y: 20 }, { x: 50, y: 16 }, { x: 82, y: 20 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    description: 'Three centre-backs with wingbacks supporting two strikers',
    positions: [
      { x: 50, y: 88 }, { x: 28, y: 68 }, { x: 50, y: 72 }, { x: 72, y: 68 },
      { x: 10, y: 46 }, { x: 30, y: 42 }, { x: 50, y: 40 }, { x: 70, y: 42 }, { x: 90, y: 46 },
      { x: 38, y: 20 }, { x: 62, y: 20 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    description: 'Double pivot shield with an attacking three behind a striker',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 38, y: 52 }, { x: 62, y: 52 },
      { x: 20, y: 34 }, { x: 50, y: 32 }, { x: 80, y: 34 },
      { x: 50, y: 16 },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    description: 'Solid defensive block with five at the back',
    positions: [
      { x: 50, y: 88 }, { x: 22, y: 68 }, { x: 50, y: 72 }, { x: 78, y: 68 },
      { x: 8, y: 60 }, { x: 92, y: 60 },
      { x: 30, y: 42 }, { x: 50, y: 40 }, { x: 70, y: 42 },
      { x: 38, y: 20 }, { x: 62, y: 20 },
    ],
  },
  {
    id: '3-4-3',
    name: '3-4-3',
    description: 'Three centre-backs, flat midfield, and a three-man attack',
    positions: [
      { x: 50, y: 88 }, { x: 28, y: 68 }, { x: 50, y: 72 }, { x: 72, y: 68 },
      { x: 15, y: 44 }, { x: 38, y: 46 }, { x: 62, y: 46 }, { x: 85, y: 44 },
      { x: 18, y: 20 }, { x: 50, y: 16 }, { x: 82, y: 20 },
    ],
  },
];

const PLAYING_STYLES: SelectOption[] = [
  {
    id: 'attacking',
    name: 'Attacking',
    description: 'Focus on goals and creativity',
    icon: <Swords className="w-4 h-4" />,
    effects: [
      { label: 'Shooting', positive: true },
      { label: 'Chance creation', positive: true },
      { label: 'Defending', positive: false },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Well-rounded approach',
    icon: <Scale className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'defensive',
    name: 'Defensive',
    description: 'Solid and compact',
    icon: <Shield className="w-4 h-4" />,
    effects: [
      { label: 'Defending', positive: true },
      { label: 'Clean sheets', positive: true },
      { label: 'Attacking output', positive: false },
    ],
  },
];

const INSTRUCTIONS: SelectOption[] = [
  {
    id: 'get_forward',
    name: 'Get Forward',
    description: 'Push higher up the pitch',
    icon: <ArrowUp className="w-4 h-4" />,
    effects: [
      { label: 'Goals', positive: true },
      { label: 'Fatigue', positive: false },
    ],
  },
  {
    id: 'hold_position',
    name: 'Hold Position',
    description: 'Stay in your zone',
    icon: <Lock className="w-4 h-4" />,
    effects: [
      { label: 'Fatigue', positive: true },
      { label: 'Tactical discipline', positive: true },
    ],
  },
  {
    id: 'man_marking',
    name: 'Man Marking',
    description: 'Track specific opponent',
    icon: <Crosshair className="w-4 h-4" />,
    effects: [
      { label: 'Defending', positive: true },
      { label: 'Stamina', positive: false },
    ],
  },
  {
    id: 'free_role',
    name: 'Free Role',
    description: 'Roam across the pitch',
    icon: <Sparkles className="w-4 h-4" />,
    effects: [
      { label: 'Creativity', positive: true },
      { label: 'Positional discipline', positive: false },
    ],
  },
];

const MATCH_PLANS: SelectOption[] = [
  {
    id: 'early_pressure',
    name: 'Early Pressure',
    description: 'Attack from the start, may tire later',
    icon: <Rocket className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'grow_into_game',
    name: 'Grow Into Game',
    description: 'Start cautious, increase intensity in 2nd half',
    icon: <Timer className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'control_possession',
    name: 'Control Possession',
    description: 'Focus on passing and ball retention',
    icon: <Brain className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'counter_attack',
    name: 'Counter Attack',
    description: 'Absorb pressure, hit on the break',
    icon: <Zap className="w-4 h-4" />,
    effects: [],
  },
];

// ─── Opacity-only animation variants ─────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0 },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ─── SVG Pitch Diagram ───────────────────────────────────────────────────────

function PitchDiagram({
  positions,
  selected,
  small,
}: {
  positions: { x: number; y: number }[];
  selected: boolean;
  small?: boolean;
}) {
  const dotColor = selected ? '#10b981' : '#6b7280';
  const lineColor = '#2d6a4f';
  const fieldColor = '#1a472a';

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-auto ${small ? 'max-w-[90px]' : 'max-w-[110px]'}`}>
      {/* Pitch */}
      <rect x="2" y="2" width="96" height="96" rx="2" fill={fieldColor} />
      <rect x="2" y="2" width="96" height="96" rx="2" fill="none" stroke={lineColor} strokeWidth="0.8" />
      {/* Centre line & circle */}
      <line x1="2" y1="50" x2="98" y2="50" stroke={lineColor} strokeWidth="0.5" />
      <circle cx="50" cy="50" r="10" fill="none" stroke={lineColor} strokeWidth="0.5" />
      {/* Penalty areas */}
      <rect x="22" y="2" width="56" height="16" fill="none" stroke={lineColor} strokeWidth="0.5" />
      <rect x="22" y="82" width="56" height="16" fill="none" stroke={lineColor} strokeWidth="0.5" />
      {/* Goal areas */}
      <rect x="36" y="2" width="28" height="7" fill="none" stroke={lineColor} strokeWidth="0.4" />
      <rect x="36" y="91" width="28" height="7" fill="none" stroke={lineColor} strokeWidth="0.4" />
      {/* Player dots */}
      {positions.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 ? 2.5 : 2}
          fill={dotColor}
          stroke={selected ? '#064e3b' : '#374151'}
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${TEXT_SEC} flex items-center gap-1.5 mb-2.5`}>
      {icon}
      {children}
    </h3>
  );
}

// ─── Effect Tags ─────────────────────────────────────────────────────────────

function EffectTags({ effects }: { effects: EffectTag[] }) {
  if (effects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {effects.map((e, i) => (
        <span
          key={i}
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
            e.positive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-red-500/12 text-red-400 border border-red-500/20'
          }`}
        >
          {e.positive ? '↑' : '↓'} {e.label}
        </span>
      ))}
    </div>
  );
}

// ─── SVG Helper Functions ────────────────────────────────────────────────────

function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCart(cx, cy, outerR, startAngle);
  const outerEnd = polarToCart(cx, cy, outerR, endAngle);
  const innerStart = polarToCart(cx, cy, innerR, endAngle);
  const innerEnd = polarToCart(cx, cy, innerR, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function semiCirclePath(cx: number, cy: number, r: number, fraction: number): string {
  const n = 40;
  const maxAngle = fraction * Math.PI;
  return Array.from({ length: n + 1 }, (_, i) => {
    const angle = Math.PI - (maxAngle * i) / n;
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function radarPolygonPoints(
  cx: number,
  cy: number,
  maxR: number,
  values: number[],
  totalAxes: number
): string {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
      const r = (v / 100) * maxR;
      return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
    })
    .join(' ');
}

function gridPolygonPoints(
  cx: number,
  cy: number,
  r: number,
  totalAxes: number
): string {
  return Array.from({ length: totalAxes }, (_, i) => {
    const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TacticalSetup({
  isOpen,
  onClose,
  playerPosition,
  playerAttributes,
}: TacticalSetupProps) {
  const [formation, setFormation] = useState('4-4-2');
  const [playingStyle, setPlayingStyle] = useState('balanced');
  const [instruction, setInstruction] = useState('hold_position');
  const [matchPlan, setMatchPlan] = useState('control_possession');
  const [confirmed, setConfirmed] = useState(false);

  const gameState = useGameStore(state => state.gameState);

  const handleConfirm = useCallback(() => {
    const store = useGameStore.getState();
    const gs = store.gameState;
    if (gs) {
      const updatedPlayer = { ...gs.player, morale: Math.min(100, gs.player.morale + 1) };
      useGameStore.setState({ gameState: { ...gs, player: updatedPlayer } });
    }
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 600);
  }, [onClose]);

  // Derived labels for summary
  const formationLabel = FORMATIONS.find(f => f.id === formation)?.name ?? formation;
  const styleLabel = PLAYING_STYLES.find(s => s.id === playingStyle)?.name ?? playingStyle;
  const instructionLabel = INSTRUCTIONS.find(i => i.id === instruction)?.name ?? instruction;
  const planLabel = MATCH_PLANS.find(m => m.id === matchPlan)?.name ?? matchPlan;

  // ─── SVG Data Computation ────────────────────────────────────────────────

  const playerOverall = gameState?.player.overall ?? 70;
  const clubName = gameState?.currentClub.name ?? 'Club';
  const clubQuality = gameState?.currentClub.quality ?? 60;
  const seasonWeek = gameState?.currentWeek ?? 1;
  const pAttr = gameState?.player.attributes ?? playerAttributes;

  const formationFamiliarity = Math.round(
    Math.min(95, 50 + sr(formation.charCodeAt(0) * 137 + playerOverall) * 35 + (playerOverall - 50) * 0.15)
  );

  const tacticalStyleSegments = [
    { label: 'Attacking', value: playingStyle === 'attacking' ? 38 : playingStyle === 'balanced' ? 20 : 8 },
    { label: 'Defensive', value: playingStyle === 'defensive' ? 35 : playingStyle === 'balanced' ? 20 : 8 },
    { label: 'Possession', value: matchPlan === 'control_possession' ? 28 : playingStyle === 'balanced' ? 22 : 12 },
    { label: 'Counter', value: matchPlan === 'counter_attack' ? 26 : 10 },
    { label: 'High Press', value: instruction === 'get_forward' ? 24 : 12 },
  ];
  const totalStyleValue = tacticalStyleSegments.reduce((sum, s) => sum + s.value, 0);
  const cumulativeAngles = tacticalStyleSegments.reduce<number[]>((acc, seg, i) => {
    const prev = i === 0 ? 0 : acc[acc.length - 1];
    return [...acc, prev + (seg.value / totalStyleValue) * 360];
  }, []);
  const donutColors = ['#CCFF00', '#00E5FF', '#FF5500', '#FF5500', '#666666'];

  const setPieceData = Array.from({ length: 8 }, (_, i) =>
    Math.round(45 + sr(i * 31 + 7 + seasonWeek) * 45)
  );

  const oppositionAxes = ['Attack', 'Defense', 'Midfield', 'Pace', 'Physical'].map((label, i) => ({
    label,
    value: Math.round(35 + sr(i * 47 + 13 + clubQuality) * 60),
  }));

  const flexibilityScore = Math.min(100, Math.round(
    ((gameState?.player.secondaryPositions?.length ?? 0) + 1) * 18 + sr(42 + seasonWeek) * 20
  ));

  const pressingBars = [
    { label: 'Low Block', value: Math.round(playingStyle === 'defensive' ? 72 + sr(1) * 18 : 20 + sr(101) * 30) },
    { label: 'Mid Block', value: Math.round(playingStyle === 'balanced' ? 65 + sr(2) * 20 : 28 + sr(102) * 28) },
    { label: 'High Press', value: Math.round(instruction === 'get_forward' ? 60 + sr(3) * 28 : 18 + sr(103) * 25) },
    { label: 'Gegenpress', value: Math.round(matchPlan === 'early_pressure' ? 50 + sr(4) * 35 : 8 + sr(104) * 22) },
  ];
  const pressingColors = ['#00E5FF', '#CCFF00', '#FF5500', '#FF5500'];

  const matchPhaseLabels = [
    'Kick Off', '1-15\'', '16-30\'', '31-45\'',
    '46-60\'', '61-75\'', '76-85\'', '85-90\'',
  ];
  const matchPhases = matchPhaseLabels.map((label, i) => ({
    label,
    tactic: ['Defend', 'Build', 'Press', 'Attack', 'Control', 'Counter', 'Hold', 'See Out'][i],
    intensity: Math.round(25 + sr(i * 53 + 11 + seasonWeek) * 65),
  }));

  const roleFitBars = [
    {
      label: 'Playmaker',
      value: Math.round((pAttr.passing ?? 60) * 0.6 + (pAttr.dribbling ?? 60) * 0.4),
    },
    {
      label: 'Target Man',
      value: Math.round((pAttr.shooting ?? 60) * 0.5 + (pAttr.physical ?? 60) * 0.5),
    },
    {
      label: 'Box-to-Box',
      value: Math.round(
        (pAttr.physical ?? 60) * 0.35 + (pAttr.passing ?? 60) * 0.3 + (pAttr.pace ?? 60) * 0.35
      ),
    },
    {
      label: 'Winger',
      value: Math.round((pAttr.pace ?? 60) * 0.5 + (pAttr.dribbling ?? 60) * 0.5),
    },
    {
      label: 'Anchor',
      value: Math.round((pAttr.defending ?? 60) * 0.6 + (pAttr.physical ?? 60) * 0.4),
    },
  ];

  const passingDots = Array.from({ length: 10 }, (_, i) => ({
    x: Math.round(20 + sr(i * 29 + 71 + seasonWeek) * 280),
    y: Math.round(12 + sr(i * 41 + 37 + seasonWeek) * 96),
    size: Math.round(3 + sr(i * 19 + 53 + seasonWeek) * 5),
  }));

  const defensiveAxes = ['Line', 'Depth', 'Width', 'Press', 'Cover'].map((label, i) => ({
    label,
    value: Math.round(
      Math.min(95, (pAttr.defending ?? 50) * (0.5 + sr(i * 61 + 23 + seasonWeek) * 0.5) * 0.7 + 25)
    ),
  }));

  const tacticalTrend = Array.from({ length: 6 }, (_, i) =>
    Math.round((5.5 + sr(i * 67 + 41 + (gameState?.currentSeason ?? 1)) * 3.5) * 10) / 10
  );

  // Donut segment paths
  const donutPaths = tacticalStyleSegments.map((seg, i) => {
    const start = cumulativeAngles[i];
    const end = cumulativeAngles[i + 1] ?? 360;
    return donutSlicePath(160, 60, 25, 45, start, end);
  });

  // Area chart path for set piece data
  const setPieceChartX = (i: number) => 35 + i * 38.6;
  const setPieceChartY = (v: number) => 110 - v * 0.95;
  const setPieceAreaPath =
    `M ${setPieceChartX(0)} ${setPieceChartY(setPieceData[0])}` +
    setPieceData
      .slice(1)
      .map((v, i) => ` L ${setPieceChartX(i + 1)} ${setPieceChartY(v)}`)
      .join('') +
    ` L ${setPieceChartX(7)} 110 L ${setPieceChartX(0)} 110 Z`;
  const setPieceLinePath =
    `M ${setPieceChartX(0)} ${setPieceChartY(setPieceData[0])}` +
    setPieceData
      .slice(1)
      .map((v, i) => ` L ${setPieceChartX(i + 1)} ${setPieceChartY(v)}`)
      .join('');

  // Semi-circle gauge path
  const gaugeBgPath = semiCirclePath(160, 90, 48, 1);
  const gaugeValuePath = semiCirclePath(160, 90, 48, flexibilityScore / 100);

  // Timeline x positions
  const timelineX = (i: number) => 20 + i * 40;

  // Trend line path
  const trendX = (i: number) => 35 + i * 50;
  const trendY = (v: number) => 105 - (v - 5) * 18;
  const trendLinePath =
    `M ${trendX(0)} ${trendY(tacticalTrend[0])}` +
    tacticalTrend
      .slice(1)
      .map((v, i) => ` L ${trendX(i + 1)} ${trendY(v)}`)
      .join('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Modal Content */}
          <motion.div
            className={`relative w-full max-w-lg ${CARD_BG} border ${BORDER} rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col z-10`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0"
              variants={staggerChild}
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Tactical Setup</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Scrollable body */}
            <div className="px-4 pb-4 overflow-y-auto scrollbar-thin space-y-5">

              {/* ── Formation Selection ────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Users className="w-3.5 h-3.5" />}>Formation</SectionHeader>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATIONS.map(f => {
                    const isSelected = f.id === formation;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormation(f.id)}
                        className={`rounded-lg border p-2 text-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <PitchDiagram positions={f.positions} selected={isSelected} small />
                        <p className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                          {f.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className={`text-[10px] ${TEXT_SEC} mt-1.5 leading-relaxed`}>
                  {FORMATIONS.find(f => f.id === formation)?.description}
                </p>
              </motion.div>

              {/* ── Playing Style ──────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Target className="w-3.5 h-3.5" />}>Playing Style</SectionHeader>
                <div className="grid grid-cols-3 gap-2">
                  {PLAYING_STYLES.map(s => {
                    const isSelected = s.id === playingStyle;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setPlayingStyle(s.id)}
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                        }`}>
                          {s.icon}
                        </div>
                        <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                          {s.name}
                        </p>
                        <p className={`text-[9px] ${TEXT_SEC} mt-0.5`}>{s.description}</p>
                        <EffectTags effects={s.effects} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Individual Instruction ─────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Crosshair className="w-3.5 h-3.5" />}>Individual Instruction</SectionHeader>
                <p className={`text-[10px] ${TEXT_SEC} -mt-1.5 mb-2`}>
                  Your role as <span className="text-white font-semibold">{playerPosition}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INSTRUCTIONS.map(inst => {
                    const isSelected = inst.id === instruction;
                    return (
                      <button
                        key={inst.id}
                        onClick={() => setInstruction(inst.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                          }`}>
                            {inst.icon}
                          </div>
                          <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                            {inst.name}
                          </p>
                        </div>
                        <p className={`text-[9px] ${TEXT_SEC} ml-9`}>{inst.description}</p>
                        <div className="ml-9">
                          <EffectTags effects={inst.effects} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Match Plan ─────────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Timer className="w-3.5 h-3.5" />}>Match Plan</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  {MATCH_PLANS.map(mp => {
                    const isSelected = mp.id === matchPlan;
                    return (
                      <button
                        key={mp.id}
                        onClick={() => setMatchPlan(mp.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                          }`}>
                            {mp.icon}
                          </div>
                          <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                            {mp.name}
                          </p>
                        </div>
                        <p className={`text-[9px] ${TEXT_SEC} ml-9`}>{mp.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Confirmation Summary ───────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<CheckCircle2 className="w-3.5 h-3.5" />}>Summary</SectionHeader>
                <div className={`rounded-lg border ${BORDER} bg-[#21262d] p-3 space-y-2`}>
                  {[
                    { label: 'Formation', value: formationLabel },
                    { label: 'Style', value: styleLabel },
                    { label: 'Instruction', value: instructionLabel },
                    { label: 'Plan', value: planLabel },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SEC}`}>{row.label}</span>
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[#30363d] pt-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] text-amber-400 font-medium">
                        Tactical preparation grants +1 morale
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ═══════════════════════════════════════════════════════════════
                  ── 11 SVG DATA VISUALIZATIONS ── Tactical Analytics
                  ═══════════════════════════════════════════════════════════════ */}

              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Activity className="w-3.5 h-3.5" />}>
                  Tactical Analytics
                </SectionHeader>
              </motion.div>

              {/* ── 2-Col: Formation Familiarity Ring + Tactical Flexibility Gauge ── */}
              <div className="grid grid-cols-2 gap-2">
                {/* SVG 1: Formation Familiarity Ring */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a10 10 0 0 1 7.07 2.93" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Familiarity</h3>
                    </div>
                    <span className="text-[8px] font-bold text-[#FF5500]">{formationLabel}</span>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {/* Background ring */}
                    <circle
                      cx="80" cy="55" r="38"
                      fill="none" stroke="#222222" strokeWidth="8"
                    />
                    {/* Value ring */}
                    <circle
                      cx="80" cy="55" r="38"
                      fill="none" stroke="#FF5500" strokeWidth="8"
                      strokeDasharray={String(2 * Math.PI * 38)}
                      strokeDashoffset={String(2 * Math.PI * 38 * (1 - formationFamiliarity / 100))}
                      strokeLinecap="butt"
                    />
                    {/* Center text */}
                    <text x="80" y="52" textAnchor="middle" fill="#FF5500" fontSize="20" fontWeight="bold" fontFamily="monospace">
                      {formationFamiliarity}%
                    </text>
                    <text x="80" y="66" textAnchor="middle" fill="#999999" fontSize="7" fontFamily="sans-serif">
                      Mastery
                    </text>
                    <text x="80" y="112" textAnchor="middle" fill="#666666" fontSize="6" fontFamily="sans-serif">
                      {clubName}
                    </text>
                  </svg>
                </motion.div>

                {/* SVG 5: Tactical Flexibility Gauge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2 L4 20 L20 20 Z" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Flexibility</h3>
                    </div>
                    <span className="text-[8px] font-bold text-[#CCFF00]">{flexibilityScore}/100</span>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {/* Gauge background arc */}
                    <path
                      d={gaugeBgPath}
                      fill="none" stroke="#222222" strokeWidth="8" strokeLinecap="butt"
                    />
                    {/* Gauge value arc */}
                    <path
                      d={gaugeValuePath}
                      fill="none" stroke="#CCFF00" strokeWidth="8" strokeLinecap="butt"
                    />
                    {/* Tick marks at 0%, 50%, 100% */}
                    {[
                      { angle: 180, label: '0' },
                      { angle: 90, label: '50' },
                      { angle: 0, label: '100' },
                    ].map((tick) => {
                      const rad = ((tick.angle - 90) * Math.PI) / 180;
                      const tx = 160 + 56 * Math.cos(rad);
                      const ty = 90 - 56 * Math.sin(rad);
                      return (
                        <text
                          key={tick.label}
                          x={tx} y={ty}
                          textAnchor="middle" fill="#666666" fontSize="6" fontFamily="sans-serif"
                        >
                          {tick.label}
                        </text>
                      );
                    })}
                    {/* Center value */}
                    <text x="160" y="80" textAnchor="middle" fill="#CCFF00" fontSize="18" fontWeight="bold" fontFamily="monospace">
                      {flexibilityScore}
                    </text>
                    <text x="160" y="92" textAnchor="middle" fill="#999999" fontSize="6" fontFamily="sans-serif">
                      Formations Known
                    </text>
                    {/* Needle indicator */}
                    {(() => {
                      const needleAngle = Math.PI * (1 - flexibilityScore / 100);
                      const nx = 160 + 35 * Math.cos(needleAngle);
                      const ny = 90 - 35 * Math.sin(needleAngle);
                      return <line x1="160" y1="90" x2={nx} y2={ny} stroke="#e8e8e8" strokeWidth="1.5" />;
                    })()}
                    <circle cx="160" cy="90" r="3" fill="#1a1a1a" stroke="#e8e8e8" strokeWidth="1" />
                  </svg>
                </motion.div>
              </div>

              {/* SVG 3: Set Piece Efficiency Area Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Set Piece Efficiency</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#00E5FF]">Last 8 Matches</span>
                </div>
                <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Horizontal grid lines */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <line
                      key={`grid-${i}`}
                      x1="35" y1={10 + i * 25} x2="310" y2={10 + i * 25}
                      stroke="#222222" strokeWidth="0.5"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <text
                      key={`ylbl-${i}`}
                      x="30" y={13 + i * 25}
                      textAnchor="end" fill="#666666" fontSize="7" fontFamily="monospace"
                    >
                      {100 - i * 25}
                    </text>
                  ))}
                  {/* Area fill */}
                  <path d={setPieceAreaPath} fill="#00E5FF" fillOpacity="0.1" />
                  {/* Line */}
                  <path d={setPieceLinePath} fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                  {/* Data points */}
                  {setPieceData.map((v, i) => (
                    <g key={`sp-${i}`}>
                      <circle
                        cx={setPieceChartX(i)} cy={setPieceChartY(v)}
                        r="3" fill="#00E5FF"
                      />
                      <circle
                        cx={setPieceChartX(i)} cy={setPieceChartY(v)}
                        r="5" fill="none" stroke="#00E5FF" strokeWidth="0.5" strokeOpacity="0.4"
                      />
                    </g>
                  ))}
                  {/* X-axis match labels */}
                  {setPieceData.map((_, i) => (
                    <text
                      key={`xlbl-${i}`}
                      x={setPieceChartX(i)} y="118"
                      textAnchor="middle" fill="#666666" fontSize="6" fontFamily="sans-serif"
                    >
                      M{i + 1}
                    </text>
                  ))}
                </svg>
              </motion.div>

              {/* SVG 4: Opposition Analysis Radar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Opposition Analysis</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#FF5500]">Next Opponent</span>
                </div>
                <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid rings */}
                  {[0.25, 0.5, 0.75, 1].map((scale, ring) => (
                    <polygon
                      key={`ring-${ring}`}
                      points={gridPolygonPoints(160, 60, 42 * scale, 5)}
                      fill="none" stroke="#222222" strokeWidth="0.5"
                    />
                  ))}
                  {/* Axis lines */}
                  {Array.from({ length: 5 }, (_, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const ex = 160 + 42 * Math.cos(angle);
                    const ey = 60 + 42 * Math.sin(angle);
                    return (
                      <line
                        key={`axis-${i}`}
                        x1="160" y1="60" x2={ex.toFixed(2)} y2={ey.toFixed(2)}
                        stroke="#222222" strokeWidth="0.5"
                      />
                    );
                  })}
                  {/* Data polygon */}
                  <polygon
                    points={radarPolygonPoints(160, 60, 42, oppositionAxes.map(a => a.value), 5)}
                    fill="#FF5500" fillOpacity="0.12" stroke="#FF5500" strokeWidth="1.5"
                  />
                  {/* Data points */}
                  {oppositionAxes.map((axis, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const r = (axis.value / 100) * 42;
                    const px = (160 + r * Math.cos(angle)).toFixed(2);
                    const py = (60 + r * Math.sin(angle)).toFixed(2);
                    return <circle key={`dp-${i}`} cx={px} cy={py} r="2.5" fill="#FF5500" />;
                  })}
                  {/* Axis labels */}
                  {oppositionAxes.map((axis, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const lx = (160 + 55 * Math.cos(angle)).toFixed(2);
                    const ly = (60 + 55 * Math.sin(angle)).toFixed(2);
                    return (
                      <text
                        key={`lbl-${i}`}
                        x={lx} y={ly}
                        textAnchor="middle" fill="#999999" fontSize="7" fontFamily="sans-serif"
                      >
                        {axis.label}
                      </text>
                    );
                  })}
                  {/* Value labels next to axis labels */}
                  {oppositionAxes.map((axis, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const vx = (160 + 64 * Math.cos(angle)).toFixed(2);
                    const vy = (60 + 64 * Math.sin(angle)).toFixed(2);
                    return (
                      <text
                        key={`val-${i}`}
                        x={vx} y={vy}
                        textAnchor="middle" fill="#FF5500" fontSize="6" fontWeight="bold" fontFamily="monospace"
                      >
                        {axis.value}
                      </text>
                    );
                  })}
                </svg>
              </motion.div>

              {/* SVG 2: Tactical Style Donut */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                        <path d="M22 12A10 10 0 0 0 12 2v10z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Tactical Style Breakdown</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#CCFF00]">{styleLabel} Setup</span>
                </div>
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0" xmlns="http://www.w3.org/2000/svg">
                    {/* Donut segments */}
                    {tacticalStyleSegments.map((seg, i) => (
                      <path
                        key={`donut-${i}`}
                        d={donutPaths[i]}
                        fill={donutColors[i]} fillOpacity="0.75"
                        stroke="#161b22" strokeWidth="1"
                      />
                    ))}
                    {/* Center circle overlay */}
                    <circle cx="160" cy="60" r="25" fill="#161b22" />
                    {/* Center text */}
                    <text x="160" y="57" textAnchor="middle" fill="#e8e8e8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {styleLabel}
                    </text>
                    <text x="160" y="68" textAnchor="middle" fill="#666666" fontSize="6" fontFamily="sans-serif">
                      Style
                    </text>
                  </svg>
                  {/* Legend */}
                  <div className="flex-1 space-y-1.5">
                    {tacticalStyleSegments.map((seg, i) => {
                      const pct = Math.round((seg.value / totalStyleValue) * 100);
                      return (
                        <div key={`legend-${i}`} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-sm shrink-0"
                            style={{ backgroundColor: donutColors[i] }}
                          />
                          <span className="text-[9px] text-[#999999] flex-1">{seg.label}</span>
                          <span className="text-[9px] font-bold" style={{ color: donutColors[i] }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* ── 2-Col: Pressing Intensity Bars + Player Role Fit Bars ── */}
              <div className="grid grid-cols-2 gap-2">
                {/* SVG 6: Pressing Intensity Bars */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="4" y1="21" x2="4" y2="14" />
                          <line x1="4" y1="10" x2="4" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12" y2="3" />
                          <line x1="20" y1="21" x2="20" y2="16" />
                          <line x1="20" y1="12" x2="20" y2="3" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Pressing</h3>
                    </div>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {pressingBars.map((bar, i) => {
                      const barY = 8 + i * 28;
                      const barWidth = (bar.value / 100) * 110;
                      return (
                        <g key={`press-${i}`}>
                          {/* Label */}
                          <text x="0" y={barY + 8} fill="#999999" fontSize="6.5" fontFamily="sans-serif">
                            {bar.label}
                          </text>
                          {/* Background bar */}
                          <rect
                            x="0" y={barY + 12} width="110" height="10" rx="2"
                            fill="#222222"
                          />
                          {/* Value bar */}
                          <rect
                            x="0" y={barY + 12} width={barWidth} height="10" rx="2"
                            fill={pressingColors[i]} fillOpacity="0.8"
                          />
                          {/* Value text */}
                          <text x="115" y={barY + 20} fill={pressingColors[i]} fontSize="7" fontWeight="bold" fontFamily="monospace">
                            {bar.value}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* SVG 8: Player Role Fit Bars */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Role Fit</h3>
                    </div>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {roleFitBars.map((bar, i) => {
                      const barY = 8 + i * 22;
                      const barWidth = (bar.value / 100) * 108;
                      return (
                        <g key={`role-${i}`}>
                          {/* Label */}
                          <text x="0" y={barY + 7} fill="#999999" fontSize="6.5" fontFamily="sans-serif">
                            {bar.label}
                          </text>
                          {/* Background bar */}
                          <rect
                            x="0" y={barY + 10} width="108" height="8" rx="2"
                            fill="#222222"
                          />
                          {/* Value bar */}
                          <rect
                            x="0" y={barY + 10} width={barWidth} height="8" rx="2"
                            fill="#CCFF00" fillOpacity="0.7"
                          />
                          {/* Value text */}
                          <text x="113" y={barY + 17} fill="#CCFF00" fontSize="7" fontWeight="bold" fontFamily="monospace">
                            {bar.value}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>
              </div>

              {/* SVG 7: Match Strategy Timeline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <polyline points="12 2 22 12 12 22" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Match Strategy Timeline</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#FF5500]">{planLabel}</span>
                </div>
                <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Timeline base line */}
                  <line x1="20" y1="45" x2="300" y2="45" stroke="#222222" strokeWidth="2" />
                  {/* Phase nodes and connectors */}
                  {matchPhases.map((phase, i) => {
                    const x = timelineX(i);
                    const dotColor = phase.intensity > 70 ? '#FF5500' : phase.intensity > 45 ? '#CCFF00' : '#666666';
                    return (
                      <g key={`phase-${i}`}>
                        {/* Vertical connector */}
                        <line x1={x} y1="45" x2={x} y2={85} stroke={dotColor} strokeWidth="1" strokeOpacity="0.3" />
                        {/* Intensity bar */}
                        <rect
                          x={x - 5} y={85 - phase.intensity * 0.35} width="10" height={phase.intensity * 0.35} rx="1"
                          fill={dotColor} fillOpacity="0.2"
                        />
                        {/* Node circle */}
                        <circle cx={x} cy="45" r="4" fill={dotColor} />
                        <circle cx={x} cy="45" r="2" fill="#161b22" />
                        {/* Phase label */}
                        <text x={x} y="30" textAnchor="middle" fill="#999999" fontSize="6" fontFamily="sans-serif">
                          {phase.label}
                        </text>
                        {/* Tactic label */}
                        <text x={x} y="100" textAnchor="middle" fill={dotColor} fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
                          {phase.tactic}
                        </text>
                        {/* Intensity value */}
                        <text x={x} y="112" textAnchor="middle" fill="#666666" fontSize="5.5" fontFamily="monospace">
                          {phase.intensity}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </motion.div>

              {/* SVG 9: Passing Network Scatter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="4" cy="6" r="1.5" />
                        <circle cx="20" cy="6" r="1.5" />
                        <circle cx="6" cy="20" r="1.5" />
                        <circle cx="18" cy="20" r="1.5" />
                        <line x1="12" y1="12" x2="4" y2="6" />
                        <line x1="12" y1="12" x2="20" y2="6" />
                        <line x1="12" y1="12" x2="6" y2="20" />
                        <line x1="12" y1="12" x2="18" y2="20" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Passing Network</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#00E5FF]">10 Positions</span>
                </div>
                <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                  {/* Pitch outline */}
                  <rect x="15" y="5" width="290" height="110" rx="3" fill="none" stroke="#222222" strokeWidth="0.8" />
                  <line x1="15" y1="60" x2="305" y2="60" stroke="#222222" strokeWidth="0.4" strokeDasharray="4 2" />
                  {/* Connection lines between nearby dots */}
                  {passingDots.map((dot, i) =>
                    passingDots
                      .slice(i + 1)
                      .filter((other) => {
                        const dx = dot.x - other.x;
                        const dy = dot.y - other.y;
                        return Math.sqrt(dx * dx + dy * dy) < 120;
                      })
                      .map((other, j) => (
                        <line
                          key={`conn-${i}-${j}`}
                          x1={dot.x} y1={dot.y} x2={other.x} y2={other.y}
                          stroke="#00E5FF" strokeWidth="0.5" strokeOpacity="0.15"
                        />
                      ))
                  )}
                  {/* Scatter dots */}
                  {passingDots.map((dot, i) => (
                    <g key={`dot-${i}`}>
                      <circle
                        cx={dot.x} cy={dot.y} r={dot.size}
                        fill="#00E5FF" fillOpacity="0.2"
                      />
                      <circle
                        cx={dot.x} cy={dot.y} r={Math.max(2, dot.size * 0.5)}
                        fill="#00E5FF"
                      />
                    </g>
                  ))}
                </svg>
              </motion.div>

              {/* ── 2-Col: Defensive Shape Radar + Tactical Performance Trend ── */}
              <div className="grid grid-cols-2 gap-2">
                {/* SVG 10: Defensive Shape Radar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Def. Shape</h3>
                    </div>
                    <span className="text-[8px] font-bold text-[#FF5500]">Org.</span>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid rings */}
                    {[0.25, 0.5, 0.75, 1].map((scale, ring) => (
                      <polygon
                        key={`d-ring-${ring}`}
                        points={gridPolygonPoints(80, 55, 38 * scale, 5)}
                        fill="none" stroke="#222222" strokeWidth="0.5"
                      />
                    ))}
                    {/* Axis lines */}
                    {Array.from({ length: 5 }, (_, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      const ex = 80 + 38 * Math.cos(angle);
                      const ey = 55 + 38 * Math.sin(angle);
                      return (
                        <line
                          key={`d-axis-${i}`}
                          x1="80" y1="55" x2={ex.toFixed(2)} y2={ey.toFixed(2)}
                          stroke="#222222" strokeWidth="0.5"
                        />
                      );
                    })}
                    {/* Data polygon */}
                    <polygon
                      points={radarPolygonPoints(80, 55, 38, defensiveAxes.map(a => a.value), 5)}
                      fill="#FF5500" fillOpacity="0.12" stroke="#FF5500" strokeWidth="1.5"
                    />
                    {/* Axis labels */}
                    {defensiveAxes.map((axis, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      const lx = (80 + 50 * Math.cos(angle)).toFixed(2);
                      const ly = (55 + 50 * Math.sin(angle)).toFixed(2);
                      return (
                        <text
                          key={`d-lbl-${i}`}
                          x={lx} y={ly}
                          textAnchor="middle" fill="#999999" fontSize="6.5" fontFamily="sans-serif"
                        >
                          {axis.label}
                        </text>
                      );
                    })}
                    {/* Value labels */}
                    {defensiveAxes.map((axis, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      const vx = (80 + 50 * Math.cos(angle)).toFixed(2);
                      const vy = (55 + 50 * Math.sin(angle) + 8).toFixed(2);
                      return (
                        <text
                          key={`d-val-${i}`}
                          x={vx} y={vy}
                          textAnchor="middle" fill="#FF5500" fontSize="5.5" fontWeight="bold" fontFamily="monospace"
                        >
                          {axis.value}
                        </text>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* SVG 11: Tactical Performance Trend */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
                        <svg className="h-2.5 w-2.5 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold text-[#c9d1d9]">Trend</h3>
                    </div>
                    <span className="text-[8px] font-bold text-[#CCFF00]">6 Matches</span>
                  </div>
                  <svg viewBox="0 0 160 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                    {/* Horizontal grid */}
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={`t-grid-${i}`}
                        x1="30" y1={15 + i * 25} x2="150" y2={15 + i * 25}
                        stroke="#222222" strokeWidth="0.4"
                      />
                    ))}
                    {/* Y-axis labels */}
                    {['10', '8', '6', '5'].map((label, i) => (
                      <text
                        key={`t-ylbl-${i}`}
                        x="26" y={18 + i * 25}
                        textAnchor="end" fill="#666666" fontSize="6" fontFamily="monospace"
                      >
                        {label}
                      </text>
                    ))}
                    {/* Area under line */}
                    <path
                      d={
                        tacticalTrend
                          .map((v, i) => `${i === 0 ? 'M' : 'L'} ${trendX(i)} ${trendY(v)}`)
                          .join(' ') +
                        ` L ${trendX(5)} 105 L ${trendX(0)} 105 Z`
                      }
                      fill="#CCFF00" fillOpacity="0.08"
                    />
                    {/* Line */}
                    <path
                      d={tacticalTrend
                        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${trendX(i)} ${trendY(v)}`)
                        .join(' ')}
                      fill="none" stroke="#CCFF00" strokeWidth="1.5"
                    />
                    {/* Data points */}
                    {tacticalTrend.map((v, i) => (
                      <g key={`t-dot-${i}`}>
                        <circle cx={trendX(i)} cy={trendY(v)} r="3" fill="#CCFF00" />
                        <circle cx={trendX(i)} cy={trendY(v)} r="4.5" fill="none" stroke="#CCFF00" strokeWidth="0.5" strokeOpacity="0.3" />
                        <text
                          x={trendX(i)} y={trendY(v) - 6}
                          textAnchor="middle" fill="#CCFF00" fontSize="5.5" fontWeight="bold" fontFamily="monospace"
                        >
                          {v.toFixed(1)}
                        </text>
                      </g>
                    ))}
                    {/* X-axis match labels */}
                    {tacticalTrend.map((_, i) => (
                      <text
                        key={`t-xlbl-${i}`}
                        x={trendX(i)} y="115"
                        textAnchor="middle" fill="#666666" fontSize="5.5" fontFamily="sans-serif"
                      >
                        W{i + 1}
                      </text>
                    ))}
                  </svg>
                </motion.div>
              </div>

              {/* ── Confirm Button ─────────────────────────────── */}
              <motion.div variants={staggerChild} className="pb-2">
                <button
                  onClick={handleConfirm}
                  disabled={confirmed}
                  className={`w-full h-12 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    confirmed
                      ? 'bg-emerald-600/50 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Tactics Confirmed
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Confirm Tactics
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
