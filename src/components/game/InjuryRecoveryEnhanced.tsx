'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useGameStore } from '@/store/gameStore';
import {
  Heart,
  Activity,
  Stethoscope,
  Calendar,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  TrendingUp,
  Dumbbell,
  Target,
  Timer,
  Thermometer,
  Brain,
  Flame,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   Seeded PRNG — deterministic from player name + week
   ════════════════════════════════════════════════════════════ */
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(playerName: string, week: number, extra: string = ''): number {
  const seed = hashSeed(`${playerName}-ire-w${week}-${extra}`);
  return mulberry32(seed)();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

/* ════════════════════════════════════════════════════════════
   Design Tokens
   ════════════════════════════════════════════════════════════ */
const COLORS = {
  pageBg: '#0d1117',
  cardBg: '#161b22',
  innerBg: '#21262d',
  border: '#30363d',
  primary: '#c9d1d9',
  secondary: '#8b949e',
  dim: '#484f58',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  gray: '#666',
};

/* ════════════════════════════════════════════════════════════
   Animation Constants — opacity only per Uncodixify bans
   ════════════════════════════════════════════════════════════ */
const BASE_ANIM = { duration: 0.18, ease: 'easeOut' as const };
const TAB_DELAY = 0.04;
const STAGGER = 0.03;

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ════════════════════════════════════════════════════════════
   Tab Definitions
   ════════════════════════════════════════════════════════════ */
const TABS = [
  { label: 'Status', icon: <Heart className="h-3.5 w-3.5" /> },
  { label: 'Treatment', icon: <Stethoscope className="h-3.5 w-3.5" /> },
  { label: 'Prevention', icon: <Shield className="h-3.5 w-3.5" /> },
  { label: 'Return', icon: <Zap className="h-3.5 w-3.5" /> },
] as const;

/* ════════════════════════════════════════════════════════════
   Helper: Polar to Cartesian
   ════════════════════════════════════════════════════════════ */
function polarToCart(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function buildPolygonPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

function buildPolylinePoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

/* ════════════════════════════════════════════════════════════
   Helper: Semi-circle arc for gauge
   ════════════════════════════════════════════════════════════ */
function describeSemiArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start[0]} ${start[1]} A ${r} ${r} 0 ${largeArc} 1 ${end[0]} ${end[1]}`;
}

/* ════════════════════════════════════════════════════════════
   Helper: Value color based on threshold
   ════════════════════════════════════════════════════════════ */
function valueColor(v: number): string {
  if (v >= 75) return COLORS.neonLime;
  if (v >= 50) return COLORS.electricOrange;
  if (v >= 25) return COLORS.cyanBlue;
  return COLORS.gray;
}

/* ════════════════════════════════════════════════════════════
   SVG 1: InjuryStatusGauge — Semi-circular gauge 0-100 (Tab 1)
   ════════════════════════════════════════════════════════════ */
function InjuryStatusGauge({ value, label }: { value: number; label: string }): React.JSX.Element {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const clampedValue = Math.max(0, Math.min(100, value));
  const endAngle = 180 + (clampedValue / 100) * 180;
  const bgColor = COLORS.innerBg;
  const fillColor = valueColor(clampedValue);

  const bgArc = describeSemiArc(cx, cy, r, 180, 360);
  const fgArc = clampedValue > 0 ? describeSemiArc(cx, cy, r, 180, endAngle) : '';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">{label}</h3>
      <svg viewBox="0 0 240 150" className="w-full">
        {/* Background semi-circle track */}
        <path d={bgArc} fill="none" stroke={bgColor} strokeWidth={12} strokeLinecap="round" />
        {/* Foreground semi-circle arc */}
        {fgArc && (
          <motion.path
            d={fgArc}
            fill="none"
            stroke={fillColor}
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, duration: 0.5 }}
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill={fillColor}
          fontSize="28"
          fontWeight="bold"
        >
          {clampedValue}
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill={COLORS.secondary} fontSize="9">
          out of 100
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const angle = 180 + (mark / 100) * 180;
          const outerPt = polarToCart(cx, cy, r + 14, angle);
          const innerPt = polarToCart(cx, cy, r + 6, angle);
          return (
            <g key={`mark-${mark}`}>
              <line
                x1={innerPt[0]}
                y1={innerPt[1]}
                x2={outerPt[0]}
                y2={outerPt[1]}
                stroke={COLORS.dim}
                strokeWidth={1}
              />
              <text
                x={polarToCart(cx, cy, r + 22, angle)[0]}
                y={polarToCart(cx, cy, r + 22, angle)[1]}
                textAnchor="middle"
                fill={COLORS.dim}
                fontSize="7"
              >
                {mark}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 2: InjuryHistoryTimeline — 8-node timeline (Tab 1)
   ════════════════════════════════════════════════════════════ */
function InjuryHistoryTimeline({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const nodeData = useMemo(() => {
    const labels = [
      'Hamstring Strain',
      'Ankle Sprain',
      'Calf Pull',
      'Back Spasm',
      'Knee Contusion',
      'Groin Strain',
      'Shoulder Bruise',
      'Rib Contusion',
    ];
    return labels.map((label, i) => ({
      label,
      severity: seededInt(playerName, week, `hist-sev-${i}`, 0, 3),
      daysOut: seededInt(playerName, week, `hist-days-${i}`, 3, 42),
      season: seededInt(playerName, week, `hist-season-${i}`, week - 4, week),
      weekNum: seededInt(playerName, week, `hist-week-${i}`, 1, 38),
    }));
  }, [playerName, week]);

  const severityColors = [COLORS.neonLime, COLORS.cyanBlue, COLORS.electricOrange, '#EF4444'];
  const chartW = 320;
  const nodeSpacing = chartW / (nodeData.length - 1);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Injury History Timeline</h3>
      <svg viewBox="0 0 340 170" className="w-full">
        {/* Horizontal connecting line */}
        <line x1={10} y1={60} x2={330} y2={60} stroke={COLORS.dim} strokeWidth={1} />
        {/* Nodes */}
        {nodeData.map((node, i) => {
          const x = 10 + i * nodeSpacing;
          const color = severityColors[node.severity];
          return (
            <g key={`hist-${i}`}>
              <motion.circle
                cx={x}
                cy={60}
                r={8}
                fill={COLORS.cardBg}
                stroke={color}
                strokeWidth={2.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <motion.circle
                cx={x}
                cy={60}
                r={3}
                fill={color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY + 0.05 }}
              />
              {/* Label */}
              <text
                x={x}
                y={42}
                textAnchor="middle"
                fill={COLORS.primary}
                fontSize="7"
                fontWeight="bold"
              >
                {node.label}
              </text>
              <text x={x} y={82} textAnchor="middle" fill={color} fontSize="7">
                {node.daysOut}d
              </text>
              <text x={x} y={95} textAnchor="middle" fill={COLORS.dim} fontSize="6">
                S{node.season} W{node.weekNum}
              </text>
              {/* Vertical tick */}
              <line x1={x} y1={52} x2={x} y2={68} stroke={color} strokeWidth={0.5} />
            </g>
          );
        })}
        {/* Bottom summary */}
        <text x={10} y={125} textAnchor="start" fill={COLORS.secondary} fontSize="8">
          Total Injuries:
        </text>
        <text x={85} y={125} textAnchor="start" fill={COLORS.electricOrange} fontSize="8" fontWeight="bold">
          {nodeData.length}
        </text>
        <text x={110} y={125} textAnchor="start" fill={COLORS.secondary} fontSize="8">
          Total Days Lost:
        </text>
        <text x={200} y={125} textAnchor="start" fill={COLORS.electricOrange} fontSize="8" fontWeight="bold">
          {nodeData.reduce((sum, n) => sum + n.daysOut, 0)}
        </text>
        <text x={10} y={140} textAnchor="start" fill={COLORS.secondary} fontSize="8">
          Avg Recovery:
        </text>
        <text x={80} y={140} textAnchor="start" fill={COLORS.cyanBlue} fontSize="8" fontWeight="bold">
          {Math.round(nodeData.reduce((sum, n) => sum + n.daysOut, 0) / nodeData.length)}d
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 3: RecoveryProgressRing — Circular ring (Tab 1)
   ════════════════════════════════════════════════════════════ */
function RecoveryProgressRing({ percent }: { percent: number }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const progress = clamped / 100;
  const dashOffset = circumference * (1 - progress);
  const fillColor = clamped >= 80 ? COLORS.neonLime : clamped >= 50 ? COLORS.electricOrange : COLORS.cyanBlue;
  const statusLabel = clamped >= 80 ? 'Advanced' : clamped >= 50 ? 'On Track' : clamped >= 25 ? 'Early' : 'Critical';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 text-center">Recovery Progress</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.innerBg} strokeWidth={10} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, duration: 0.5 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={fillColor} fontSize="32" fontWeight="bold">
          {clamped}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.secondary} fontSize="9">
          recovered
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill={fillColor} fontSize="8" fontWeight="bold">
          {statusLabel}
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 4: TreatmentEffectivenessBars — 5 bars (Tab 2)
   ════════════════════════════════════════════════════════════ */
function TreatmentEffectivenessBars({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const treatments = useMemo(() => [
    { label: 'Physiotherapy', value: seededInt(playerName, week, 'tx-phys', 55, 95) },
    { label: 'Hydrotherapy', value: seededInt(playerName, week, 'tx-hydro', 40, 88) },
    { label: 'Massage', value: seededInt(playerName, week, 'tx-mass', 50, 90) },
    { label: 'Cryo Therapy', value: seededInt(playerName, week, 'tx-cryo', 35, 82) },
    { label: 'Laser Treat.', value: seededInt(playerName, week, 'tx-laser', 30, 78) },
  ], [playerName, week]);

  const barColors = [COLORS.neonLime, COLORS.cyanBlue, COLORS.electricOrange, '#8B5CF6', COLORS.gray];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Treatment Effectiveness</h3>
      <svg viewBox="0 0 280 160" className="w-full">
        {treatments.map((tx, i) => {
          const barWidth = (tx.value / 100) * 150;
          const y = 8 + i * 28;
          return (
            <g key={`tx-${i}`}>
              <text x={70} y={y + 12} textAnchor="end" fill={COLORS.primary} fontSize="9">
                {tx.label}
              </text>
              {/* Background bar */}
              <rect x={75} y={y} width={150} height={16} rx={3} fill={COLORS.innerBg} />
              {/* Value bar */}
              <motion.rect
                x={75}
                y={y}
                width={barWidth}
                height={16}
                rx={3}
                fill={barColors[i]}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={80 + barWidth} y={y + 12} textAnchor="start" fill={barColors[i]} fontSize="9" fontWeight="bold">
                {tx.value}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 5: MedicalStaffRadar — 5-axis radar (Tab 2)
   ════════════════════════════════════════════════════════════ */
function MedicalStaffRadar({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const cx = 120;
  const cy = 110;
  const r = 75;
  const axes = ['Physio', 'Doctor', 'Surgeon', 'Nutrition', 'Psych'];
  const count = axes.length;
  const angles = axes.map((_, i) => (i / count) * 360 - 90);
  const maxVal = 100;

  const values = useMemo(() => [
    seededInt(playerName, week, 'staff-phys', 60, 98),
    seededInt(playerName, week, 'staff-doc', 55, 95),
    seededInt(playerName, week, 'staff-surg', 40, 90),
    seededInt(playerName, week, 'staff-nutr', 50, 92),
    seededInt(playerName, week, 'staff-psych', 45, 88),
  ], [playerName, week]);

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const dataPoints = values.map((v, i) => polarToCart(cx, cy, (v / maxVal) * r, angles[i]));
  const dataPolyStr = buildPolygonPoints(dataPoints);
  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Medical Staff Rating</h3>
      <svg viewBox="0 0 240 220" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={`grid-${i}`} points={pts} fill="none" stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]} stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        <motion.polygon
          points={dataPolyStr}
          fill={COLORS.cyanBlue}
          fillOpacity={0.2}
          stroke={COLORS.cyanBlue}
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />
        {dataPoints.map((pt, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r={3.5}
            fill={COLORS.cyanBlue}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 16, angles[i]);
          return (
            <text
              key={`label-${i}`}
              x={labelPt[0]}
              y={labelPt[1]}
              textAnchor="middle"
              fill={COLORS.secondary}
              fontSize="9"
            >
              {label}
            </text>
          );
        })}
        {/* Bottom values */}
        {axes.map((_, i) => (
          <text
            key={`val-${i}`}
            x={55 + i * 38}
            y={210}
            textAnchor="start"
            fill={COLORS.cyanBlue}
            fontSize="8"
            fontWeight="bold"
          >
            {values[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 6: FacilityQualityRing — Circular ring (Tab 2)
   ════════════════════════════════════════════════════════════ */
function FacilityQualityRing({
  facilities,
}: {
  facilities: number;
}): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, facilities));
  const progress = clamped / 100;
  const dashOffset = circumference * (1 - progress);
  const fillColor = clamped >= 80 ? COLORS.neonLime : clamped >= 50 ? COLORS.cyanBlue : COLORS.electricOrange;
  const tierLabel = clamped >= 80 ? 'World Class' : clamped >= 60 ? 'Top Tier' : clamped >= 40 ? 'Standard' : 'Basic';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2 text-center">Facility Quality</h3>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.innerBg} strokeWidth={10} />
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, duration: 0.5 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={fillColor} fontSize="32" fontWeight="bold">
          {clamped}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.secondary} fontSize="9">
          quality score
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill={fillColor} fontSize="8" fontWeight="bold">
          {tierLabel}
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 7: InjuryRiskRadar — 5-axis radar (Tab 3)
   ════════════════════════════════════════════════════════════ */
function InjuryRiskRadar({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const cx = 120;
  const cy = 110;
  const r = 75;
  const axes = ['Muscle', 'Ligament', 'Bone', 'Concussion', 'Overuse'];
  const count = axes.length;
  const angles = axes.map((_, i) => (i / count) * 360 - 90);
  const maxVal = 100;

  const values = useMemo(() => [
    seededInt(playerName, week, 'risk-musc', 10, 75),
    seededInt(playerName, week, 'risk-liga', 5, 60),
    seededInt(playerName, week, 'risk-bone', 3, 45),
    seededInt(playerName, week, 'risk-conc', 2, 35),
    seededInt(playerName, week, 'risk-over', 15, 80),
  ], [playerName, week]);

  const riskColors = values.map(v => v >= 60 ? '#EF4444' : v >= 35 ? COLORS.electricOrange : COLORS.neonLime);

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const dataPoints = values.map((v, i) => polarToCart(cx, cy, (v / maxVal) * r, angles[i]));
  const dataPolyStr = buildPolygonPoints(dataPoints);
  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Injury Risk Profile</h3>
      <svg viewBox="0 0 240 220" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={`grid-${i}`} points={pts} fill="none" stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]} stroke={COLORS.dim} strokeWidth={0.5} />
        ))}
        <motion.polygon
          points={dataPolyStr}
          fill={COLORS.electricOrange}
          fillOpacity={0.2}
          stroke={COLORS.electricOrange}
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />
        {dataPoints.map((pt, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r={3.5}
            fill={riskColors[i]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 16, angles[i]);
          return (
            <text
              key={`label-${i}`}
              x={labelPt[0]}
              y={labelPt[1]}
              textAnchor="middle"
              fill={riskColors[i]}
              fontSize="8"
              fontWeight="bold"
            >
              {label}
            </text>
          );
        })}
        {/* Bottom values */}
        {values.map((v, i) => (
          <g key={`val-${i}`}>
            <rect x={25 + i * 44} y={200} width={6} height={6} rx={1} fill={riskColors[i]} />
            <text x={34 + i * 44} y={206} textAnchor="start" fill={COLORS.secondary} fontSize="7">
              {v}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 8: PreventionProtocolBars — 5 bars (Tab 3)
   ════════════════════════════════════════════════════════════ */
function PreventionProtocolBars({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const protocols = useMemo(() => [
    { label: 'Warm-Up', value: seededInt(playerName, week, 'prev-warm', 60, 98) },
    { label: 'Cool Down', value: seededInt(playerName, week, 'prev-cool', 50, 95) },
    { label: 'Strength', value: seededInt(playerName, week, 'prev-str', 40, 90) },
    { label: 'Flexibility', value: seededInt(playerName, week, 'prev-flex', 45, 92) },
    { label: 'Rest Days', value: seededInt(playerName, week, 'prev-rest', 55, 96) },
  ], [playerName, week]);

  const barColors = [COLORS.neonLime, COLORS.cyanBlue, COLORS.electricOrange, '#8B5CF6', '#F59E0B'];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Prevention Protocol Adherence</h3>
      <svg viewBox="0 0 280 160" className="w-full">
        {protocols.map((proto, i) => {
          const barWidth = (proto.value / 100) * 150;
          const y = 8 + i * 28;
          return (
            <g key={`proto-${i}`}>
              <text x={70} y={y + 12} textAnchor="end" fill={COLORS.primary} fontSize="9">
                {proto.label}
              </text>
              {/* Background */}
              <rect x={75} y={y} width={150} height={16} rx={3} fill={COLORS.innerBg} />
              {/* Value bar */}
              <motion.rect
                x={75}
                y={y}
                width={barWidth}
                height={16}
                rx={3}
                fill={barColors[i]}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={80 + barWidth} y={y + 12} textAnchor="start" fill={barColors[i]} fontSize="9" fontWeight="bold">
                {proto.value}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 9: FitnessVsInjuryAreaChart — 8-point area chart (Tab 3)
   ════════════════════════════════════════════════════════════ */
function FitnessVsInjuryAreaChart({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const chartW = 320;
  const chartH = 120;
  const padX = 30;
  const padTop = 20;
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

  const fitnessData = useMemo(() =>
    Array.from({ length: 8 }, (_, i) =>
      seededInt(playerName, week, `fit-${i}`, 50, 95)
    ),
  [playerName, week]);

  const injuryRiskData = useMemo(() =>
    Array.from({ length: 8 }, (_, i) =>
      seededInt(playerName, week, `risk-chart-${i}`, 5, 60)
    ),
  [playerName, week]);

  const xScale = (i: number) => padX + (i / 7) * (chartW - padX * 2);
  const yFitScale = (v: number) => padTop + chartH - ((v - 40) / 60) * chartH;
  const yRiskScale = (v: number) => padTop + chartH - (v / 70) * chartH;

  const fitLinePoints = fitnessData.map((v, i) => [xScale(i), yFitScale(v)] as [number, number]);
  const fitAreaPoints = [
    [xScale(0), padTop + chartH] as [number, number],
    ...fitLinePoints,
    [xScale(7), padTop + chartH] as [number, number],
  ];

  const riskLinePoints = injuryRiskData.map((v, i) => [xScale(i), yRiskScale(v)] as [number, number]);
  const riskAreaPoints = [
    [xScale(0), padTop + chartH] as [number, number],
    ...riskLinePoints,
    [xScale(7), padTop + chartH] as [number, number],
  ];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Fitness vs Injury Risk</h3>
      <svg viewBox="0 0 340 180" className="w-full">
        {/* Grid lines */}
        <line x1={padX} y1={padTop} x2={chartW} y2={padTop} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH / 2} x2={chartW} y2={padTop + chartH / 2} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH} x2={chartW} y2={padTop + chartH} stroke={COLORS.dim} strokeWidth={0.5} />

        {/* Fitness area */}
        <motion.polygon
          points={buildPolygonPoints(fitAreaPoints)}
          fill={COLORS.neonLime}
          fillOpacity={0.12}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />
        <polyline
          points={buildPolylinePoints(fitLinePoints)}
          fill="none"
          stroke={COLORS.neonLime}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Risk area */}
        <motion.polygon
          points={buildPolygonPoints(riskAreaPoints)}
          fill={COLORS.electricOrange}
          fillOpacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...BASE_ANIM, delay: 0.05 }}
        />
        <polyline
          points={buildPolylinePoints(riskLinePoints)}
          fill="none"
          stroke={COLORS.electricOrange}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {fitnessData.map((v, i) => (
          <motion.circle
            key={`fit-dot-${i}`}
            cx={xScale(i)}
            cy={yFitScale(v)}
            r={3}
            fill={COLORS.neonLime}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
          />
        ))}
        {injuryRiskData.map((v, i) => (
          <motion.circle
            key={`risk-dot-${i}`}
            cx={xScale(i)}
            cy={yRiskScale(v)}
            r={3}
            fill={COLORS.electricOrange}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: i * TAB_DELAY + 0.02 }}
          />
        ))}

        {/* X-axis labels */}
        {labels.map((lbl, i) => (
          <text key={`xlbl-${i}`} x={xScale(i)} y={padTop + chartH + 14} textAnchor="middle" fill={COLORS.dim} fontSize="7">
            {lbl}
          </text>
        ))}

        {/* Legend */}
        <rect x={100} y={3} width={8} height={8} rx={1} fill={COLORS.neonLime} fillOpacity={0.85} />
        <text x={112} y={10} textAnchor="start" fill={COLORS.neonLime} fontSize="8">Fitness</text>
        <rect x={160} y={3} width={8} height={8} rx={1} fill={COLORS.electricOrange} fillOpacity={0.85} />
        <text x={172} y={10} textAnchor="start" fill={COLORS.electricOrange} fontSize="8">Risk</text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 10: ReturnTimelineLine — 8-point line chart (Tab 4)
   ════════════════════════════════════════════════════════════ */
function ReturnTimelineLine({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const chartW = 320;
  const chartH = 120;
  const padX = 30;
  const padTop = 20;
  const labels = ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 10', 'Day 14', 'Day 18', 'Day 21'];

  const readinessData = useMemo(() =>
    Array.from({ length: 8 }, (_, i) =>
      seededInt(playerName, week, `ready-${i}`, 10 + i * 10, 30 + i * 9)
    ),
  [playerName, week]);

  const xScale = (i: number) => padX + (i / 7) * (chartW - padX * 2);
  const yScale = (v: number) => padTop + chartH - (v / 100) * chartH;

  const linePoints = readinessData.map((v, i) => [xScale(i), yScale(v)] as [number, number]);
  const areaPoints = [
    [xScale(0), padTop + chartH] as [number, number],
    ...linePoints,
    [xScale(7), padTop + chartH] as [number, number],
  ];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Return Readiness Timeline</h3>
      <svg viewBox="0 0 340 180" className="w-full">
        {/* Grid lines */}
        <line x1={padX} y1={padTop} x2={chartW} y2={padTop} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH / 2} x2={chartW} y2={padTop + chartH / 2} stroke={COLORS.dim} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH} x2={chartW} y2={padTop + chartH} stroke={COLORS.dim} strokeWidth={0.5} />

        {/* Threshold line at 75% */}
        <line x1={padX} y1={yScale(75)} x2={chartW} y2={yScale(75)} stroke={COLORS.neonLime} strokeWidth={0.5} strokeDasharray="6,3" />
        <text x={chartW - 5} y={yScale(75) - 4} textAnchor="end" fill={COLORS.neonLime} fontSize="6">
          Clear 75%
        </text>

        {/* Area */}
        <motion.polygon
          points={buildPolygonPoints(areaPoints)}
          fill={COLORS.cyanBlue}
          fillOpacity={0.12}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        />

        {/* Line */}
        <polyline
          points={buildPolylinePoints(linePoints)}
          fill="none"
          stroke={COLORS.cyanBlue}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {readinessData.map((v, i) => {
          const ptColor = v >= 75 ? COLORS.neonLime : v >= 50 ? COLORS.cyanBlue : COLORS.electricOrange;
          return (
            <motion.g
              key={`ready-dot-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
            >
              <circle cx={xScale(i)} cy={yScale(v)} r={3.5} fill={ptColor} />
              <text x={xScale(i)} y={yScale(v) - 8} textAnchor="middle" fill={ptColor} fontSize="7">
                {v}%
              </text>
            </motion.g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((lbl, i) => (
          <text key={`xlbl-${i}`} x={xScale(i)} y={padTop + chartH + 14} textAnchor="middle" fill={COLORS.dim} fontSize="6">
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 11: MatchReadinessGauge — Semi-circular gauge (Tab 4)
   ════════════════════════════════════════════════════════════ */
function MatchReadinessGauge({ value }: { value: number }): React.JSX.Element {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const clampedValue = Math.max(0, Math.min(100, value));
  const endAngle = 180 + (clampedValue / 100) * 180;
  const bgColor = COLORS.innerBg;
  const fillColor = clampedValue >= 75 ? COLORS.neonLime : clampedValue >= 50 ? COLORS.cyanBlue : COLORS.electricOrange;
  const readinessLabel = clampedValue >= 90 ? 'Match Ready' : clampedValue >= 75 ? 'Near Ready' : clampedValue >= 50 ? 'Building' : 'Early Stage';

  const bgArc = describeSemiArc(cx, cy, r, 180, 360);
  const fgArc = clampedValue > 0 ? describeSemiArc(cx, cy, r, 180, endAngle) : '';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Match Readiness</h3>
      <svg viewBox="0 0 240 150" className="w-full">
        {/* Background semi-circle track */}
        <path d={bgArc} fill="none" stroke={bgColor} strokeWidth={12} strokeLinecap="round" />
        {/* Foreground semi-circle arc */}
        {fgArc && (
          <motion.path
            d={fgArc}
            fill="none"
            stroke={fillColor}
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, duration: 0.5 }}
          />
        )}
        {/* Center value */}
        <text x={cx} y={cy + 10} textAnchor="middle" fill={fillColor} fontSize="28" fontWeight="bold">
          {clampedValue}
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill={readinessLabel === 'Match Ready' ? COLORS.neonLime : COLORS.secondary} fontSize="9" fontWeight="bold">
          {readinessLabel}
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const angle = 180 + (mark / 100) * 180;
          const outerPt = polarToCart(cx, cy, r + 14, angle);
          const innerPt = polarToCart(cx, cy, r + 6, angle);
          return (
            <g key={`mark-${mark}`}>
              <line x1={innerPt[0]} y1={innerPt[1]} x2={outerPt[0]} y2={outerPt[1]} stroke={COLORS.dim} strokeWidth={1} />
              <text x={polarToCart(cx, cy, r + 22, angle)[0]} y={polarToCart(cx, cy, r + 22, angle)[1]} textAnchor="middle" fill={COLORS.dim} fontSize="7">
                {mark}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SVG 12: ComebackStatsBars — 5 bars (Tab 4)
   ════════════════════════════════════════════════════════════ */
function ComebackStatsBars({
  playerName,
  week,
}: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const stats = useMemo(() => [
    { label: 'Endurance', value: seededInt(playerName, week, 'cb-endur', 40, 92) },
    { label: 'Sprint Speed', value: seededInt(playerName, week, 'cb-sprint', 35, 90) },
    { label: 'Agility', value: seededInt(playerName, week, 'cb-agility', 38, 88) },
    { label: 'Strength', value: seededInt(playerName, week, 'cb-strength', 42, 95) },
    { label: 'Ball Control', value: seededInt(playerName, week, 'cb-ball', 50, 94) },
  ], [playerName, week]);

  const barColors = [COLORS.neonLime, COLORS.cyanBlue, COLORS.electricOrange, '#8B5CF6', '#F59E0B'];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Comeback Physical Stats</h3>
      <svg viewBox="0 0 280 160" className="w-full">
        {stats.map((stat, i) => {
          const barWidth = (stat.value / 100) * 150;
          const y = 8 + i * 28;
          return (
            <g key={`stat-${i}`}>
              <text x={70} y={y + 12} textAnchor="end" fill={COLORS.primary} fontSize="9">
                {stat.label}
              </text>
              {/* Background */}
              <rect x={75} y={y} width={150} height={16} rx={3} fill={COLORS.innerBg} />
              {/* Value bar */}
              <motion.rect
                x={75}
                y={y}
                width={barWidth}
                height={16}
                rx={3}
                fill={barColors[i]}
                fillOpacity={0.85}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...BASE_ANIM, delay: i * TAB_DELAY }}
              />
              <text x={80 + barWidth} y={y + 12} textAnchor="start" fill={barColors[i]} fontSize="9" fontWeight="bold">
                {stat.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Weekly Breakdown Card
   ════════════════════════════════════════════════════════════ */
function WeeklyBreakdownCard({ playerName, week }: { playerName: string; week: number }): React.JSX.Element {
  const weeklyData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      sessions: seededInt(playerName, week, `wb-sess-${i}`, 1, 4),
      restHours: seededInt(playerName, week, `wb-rest-${i}`, 6, 12),
      painLevel: seededInt(playerName, week, `wb-pain-${i}`, 0, 8),
      compliance: seededInt(playerName, week, `wb-comp-${i}`, 60, 100),
    })),
  [playerName, week]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Weekly Recovery Breakdown</h3>
      <div className="grid grid-cols-7 gap-1">
        {weeklyData.map((day, i) => {
          const painColor = day.painLevel >= 6 ? '#EF4444' : day.painLevel >= 3 ? COLORS.electricOrange : COLORS.neonLime;
          const compColor = day.compliance >= 85 ? COLORS.neonLime : day.compliance >= 70 ? COLORS.cyanBlue : COLORS.electricOrange;
          return (
            <div key={`day-${i}`} className="bg-[#21262d] rounded-lg p-1.5 text-center space-y-1">
              <span className="text-[8px] text-[#8b949e] font-bold block">{day.day}</span>
              <span className="text-[10px] text-[#c9d1d9] font-bold block">{day.sessions}</span>
              <span className="text-[7px] text-[#484f58] block">sessions</span>
              <div className="w-4 h-4 rounded mx-auto" style={{ backgroundColor: `${painColor}20`, border: `1px solid ${painColor}` }}>
                <span className="text-[7px] font-bold block leading-4" style={{ color: painColor }}>{day.painLevel}</span>
              </div>
              <span className="text-[7px] block" style={{ color: compColor }}>{day.compliance}%</span>
              <span className="text-[6px] text-[#484f58] block">{day.restHours}h rest</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS.neonLime }} />
          <span className="text-[7px] text-[#8b949e]">Low Pain</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS.electricOrange }} />
          <span className="text-[7px] text-[#8b949e]">Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[7px] text-[#8b949e]">High Pain</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Treatment Schedule Card
   ════════════════════════════════════════════════════════════ */
function TreatmentScheduleCard({ playerName, week }: { playerName: string; week: number }): React.JSX.Element {
  const scheduleItems = useMemo(() => {
    const treatments = [
      'Morning Physio', 'Pool Session', 'Ice Bath', 'Massage Therapy',
      'Strength Rehab', 'Stretching', 'Cryo Session', 'Acupuncture',
    ];
    return treatments.map((treatment, i) => ({
      name: treatment,
      time: `${7 + i}:00`,
      duration: seededInt(playerName, week, `sched-dur-${i}`, 15, 60),
      intensity: seededInt(playerName, week, `sched-int-${i}`, 1, 5),
      completed: seededInt(playerName, week, `sched-done-${i}`, 0, 1) === 1,
    }));
  }, [playerName, week]);

  const intensityLabels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const intensityColors = ['', COLORS.neonLime, COLORS.cyanBlue, COLORS.electricOrange, '#F59E0B', '#EF4444'];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Daily Treatment Schedule</h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {scheduleItems.map((item, i) => (
          <div key={`sched-${i}`} className="flex items-center gap-2 p-1.5 rounded bg-[#21262d]">
            <div
              className="w-6 h-6 rounded flex items-center justify-center shrink-0"
              style={{
                backgroundColor: item.completed ? `${COLORS.neonLime}18` : '#161b22',
                border: `1px solid ${item.completed ? COLORS.neonLime : COLORS.dim}`,
              }}
            >
              {item.completed ? (
                <span className="text-[8px]" style={{ color: COLORS.neonLime }}>&#10003;</span>
              ) : (
                <Timer className="h-3 w-3" style={{ color: COLORS.dim }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold truncate ${item.completed ? 'text-[#c9d1d9]' : 'text-[#8b949e]'}`}>
                {item.name}
              </p>
              <p className="text-[8px] text-[#484f58]">{item.time} — {item.duration} min</p>
            </div>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0"
              style={{
                backgroundColor: `${intensityColors[item.intensity]}15`,
                color: intensityColors[item.intensity],
              }}
            >
              {intensityLabels[item.intensity]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Risk Alert Banner
   ════════════════════════════════════════════════════════════ */
function RiskAlertBanner({ playerName, week }: { playerName: string; week: number }): React.JSX.Element {
  const highestRisk = useMemo(() => {
    const riskAreas = ['muscle', 'ligament', 'bone', 'concussion', 'overuse'];
    return riskAreas.reduce<{ area: string; level: number }>((max, area, i) => {
      const level = seededInt(playerName, week, `risk-alert-${area}`, 5, 85);
      return level > max.level ? { area, level } : max;
    }, { area: 'none', level: 0 });
  }, [playerName, week]);

  const areaLabels: Record<string, string> = {
    muscle: 'Muscle Strain',
    ligament: 'Ligament Damage',
    bone: 'Bone Stress',
    concussion: 'Head Impact',
    overuse: 'Overuse Injury',
  };

  const isHigh = highestRisk.level >= 65;
  const isMedium = highestRisk.level >= 40 && highestRisk.level < 65;

  return (
    <div
      className="rounded-lg border p-3 flex items-start gap-2"
      style={{
        backgroundColor: isHigh ? '#EF444412' : isMedium ? `${COLORS.electricOrange}12` : `${COLORS.neonLime}12`,
        borderColor: isHigh ? '#EF444430' : isMedium ? `${COLORS.electricOrange}30` : `${COLORS.neonLime}30`,
      }}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 mt-0.5"
        style={{ color: isHigh ? '#EF4444' : isMedium ? COLORS.electricOrange : COLORS.neonLime }}
      />
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold"
          style={{ color: isHigh ? '#EF4444' : isMedium ? COLORS.electricOrange : COLORS.neonLime }}
        >
          {isHigh ? 'High Risk Alert' : isMedium ? 'Moderate Risk' : 'Low Risk'}
        </p>
        <p className="text-[10px] text-[#8b949e] mt-0.5">
          {areaLabels[highestRisk.area] ?? 'General'} — Risk level: {highestRisk.level}%
        </p>
        <p className="text-[9px] text-[#484f58] mt-0.5">
          {isHigh
            ? 'Reduce training intensity and consult medical staff immediately.'
            : isMedium
              ? 'Monitor closely and consider modified training sessions.'
              : 'Continue current prevention protocols.'}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Return Plan Card
   ════════════════════════════════════════════════════════════ */
function ReturnPlanCard({ playerName, week, injuryWeeks }: { playerName: string; week: number; injuryWeeks: number }): React.JSX.Element {
  const phases = useMemo(() => [
    {
      name: 'Phase 1: Rest & Recover',
      status: 'completed',
      desc: 'Initial rest period with anti-inflammatory treatment.',
      daysRange: 'Days 1-3',
    },
    {
      name: 'Phase 2: Gentle Mobility',
      status: injuryWeeks <= 2 ? 'completed' : 'active',
      desc: 'Range of motion exercises and gentle stretching.',
      daysRange: 'Days 3-7',
    },
    {
      name: 'Phase 3: Progressive Loading',
      status: injuryWeeks <= 0 ? 'completed' : injuryWeeks <= 3 ? 'active' : 'locked',
      desc: 'Gradually increase load with targeted strengthening.',
      daysRange: 'Days 7-14',
    },
    {
      name: 'Phase 4: Sport-Specific Training',
      status: injuryWeeks <= 0 ? 'completed' : 'locked',
      desc: 'Ball work, agility drills, and tactical sessions.',
      daysRange: 'Days 14-18',
    },
    {
      name: 'Phase 5: Full Training',
      status: injuryWeeks <= 0 ? 'completed' : 'locked',
      desc: 'Full participation in team training sessions.',
      daysRange: 'Days 18-21',
    },
    {
      name: 'Phase 6: Match Return',
      status: injuryWeeks <= 0 ? 'completed' : 'locked',
      desc: 'Cleared for competitive match action.',
      daysRange: 'Day 21+',
    },
  ], [injuryWeeks]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    completed: { color: COLORS.neonLime, label: 'Done' },
    active: { color: COLORS.cyanBlue, label: 'Active' },
    locked: { color: COLORS.dim, label: 'Locked' },
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Return to Play Plan</h3>
      <div className="space-y-2">
        {phases.map((phase, i) => {
          const cfg = statusConfig[phase.status];
          return (
            <div key={`phase-${i}`} className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: phase.status === 'completed' ? `${COLORS.neonLime}15` : '#21262d',
                  border: `1.5px solid ${cfg.color}`,
                }}
              >
                {phase.status === 'completed' ? (
                  <span className="text-[8px]" style={{ color: COLORS.neonLime }}>&#10003;</span>
                ) : phase.status === 'active' ? (
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: COLORS.cyanBlue }} />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[10px] font-semibold ${phase.status === 'locked' ? 'text-[#484f58]' : 'text-[#c9d1d9]'}`}>
                    {phase.name}
                  </p>
                  <span
                    className="text-[7px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className={`text-[9px] mt-0.5 ${phase.status === 'locked' ? 'text-[#484f58]' : 'text-[#8b949e]'}`}>
                  {phase.desc}
                </p>
                <p className="text-[8px] text-[#484f58] mt-0.5">{phase.daysRange}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Nutrition Plan Card
   ════════════════════════════════════════════════════════════ */
function NutritionPlanCard({ playerName, week }: { playerName: string; week: number }): React.JSX.Element {
  const meals = useMemo(() => [
    {
      name: 'Breakfast',
      time: '07:00',
      calories: seededInt(playerName, week, 'nut-cal-0', 400, 700),
      protein: seededInt(playerName, week, 'nut-pro-0', 25, 50),
      items: 'Oats, eggs, fruit, yogurt',
    },
    {
      name: 'Mid-Morning',
      time: '10:00',
      calories: seededInt(playerName, week, 'nut-cal-1', 200, 400),
      protein: seededInt(playerName, week, 'nut-pro-1', 10, 25),
      items: 'Protein shake, nuts, banana',
    },
    {
      name: 'Lunch',
      time: '13:00',
      calories: seededInt(playerName, week, 'nut-cal-2', 600, 900),
      protein: seededInt(playerName, week, 'nut-pro-2', 35, 60),
      items: 'Chicken, rice, vegetables, salmon',
    },
    {
      name: 'Pre-Training',
      time: '15:30',
      calories: seededInt(playerName, week, 'nut-cal-3', 200, 350),
      protein: seededInt(playerName, week, 'nut-pro-3', 10, 20),
      items: 'Energy bar, electrolytes, fruit',
    },
    {
      name: 'Post-Training',
      time: '17:30',
      calories: seededInt(playerName, week, 'nut-cal-4', 300, 500),
      protein: seededInt(playerName, week, 'nut-pro-4', 20, 40),
      items: 'Protein shake, recovery drink, fruit',
    },
    {
      name: 'Dinner',
      time: '19:30',
      calories: seededInt(playerName, week, 'nut-cal-5', 500, 800),
      protein: seededInt(playerName, week, 'nut-pro-5', 30, 55),
      items: 'Fish, sweet potato, greens, quinoa',
    },
  ], [playerName, week]);

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-[#c9d1d9]">Recovery Nutrition Plan</h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#8b949e]">{totalCalories} kcal</span>
          <span className="text-[9px] font-bold" style={{ color: COLORS.neonLime }}>{totalProtein}g protein</span>
        </div>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {meals.map((meal, i) => (
          <div key={`meal-${i}`} className="flex items-center gap-2 p-1.5 rounded bg-[#21262d]">
            <div
              className="w-6 h-6 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.electricOrange}15`, color: COLORS.electricOrange }}
            >
              <span className="text-[9px] font-bold">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#c9d1d9]">{meal.name} — {meal.time}</p>
              <p className="text-[8px] text-[#484f58]">{meal.items}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-[#c9d1d9]">{meal.calories}</p>
              <p className="text-[7px] text-[#484f58]">kcal</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold" style={{ color: COLORS.neonLime }}>{meal.protein}g</p>
              <p className="text-[7px] text-[#484f58]">protein</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Helper: Mental Readiness Card
   ════════════════════════════════════════════════════════════ */
function MentalReadinessCard({ playerName, week }: { playerName: string; week: number }): React.JSX.Element {
  const metrics = useMemo(() => [
    { label: 'Confidence', value: seededInt(playerName, week, 'mental-conf', 30, 95) },
    { label: 'Motivation', value: seededInt(playerName, week, 'mental-motiv', 40, 98) },
    { label: 'Focus', value: seededInt(playerName, week, 'mental-focus', 35, 92) },
    { label: 'Anxiety', value: seededInt(playerName, week, 'mental-anx', 5, 60) },
    { label: 'Sleep Quality', value: seededInt(playerName, week, 'mental-sleep', 40, 95) },
  ], [playerName, week]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="h-3.5 w-3.5 text-[#8b949e]" />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Mental Readiness Score</h3>
      </div>
      <div className="space-y-2">
        {metrics.map((metric, i) => {
          const isInverted = metric.label === 'Anxiety';
          const displayColor = isInverted
            ? (metric.value >= 40 ? '#EF4444' : metric.value >= 20 ? COLORS.electricOrange : COLORS.neonLime)
            : valueColor(metric.value);
          return (
            <div key={`mental-${i}`} className="flex items-center gap-2">
              <span className="text-[9px] text-[#8b949e] w-[72px] text-right shrink-0">{metric.label}</span>
              <div className="flex-1 h-2 bg-[#21262d] rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{ width: `${metric.value}%`, backgroundColor: displayColor }}
                />
              </div>
              <span className="text-[9px] font-bold w-[28px] text-right shrink-0" style={{ color: displayColor }}>
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Tab 1: Status Panel
   ════════════════════════════════════════════════════════════ */
function StatusTab({ playerName, week, fitness, injuryWeeks }: {
  playerName: string;
  week: number;
  fitness: number;
  injuryWeeks: number;
}): React.JSX.Element {
  const overallStatus = useMemo(() => {
    const injuryFactor = injuryWeeks > 0 ? Math.max(0, 100 - injuryWeeks * 12) : 100;
    return Math.round(fitness * 0.4 + injuryFactor * 0.6);
  }, [fitness, injuryWeeks]);

  const recoveryPercent = useMemo(() => {
    if (injuryWeeks <= 0) return 100;
    const seed = hashSeed(`${playerName}-recovery-${week}`);
    return 30 + (seed % 55);
  }, [playerName, week, injuryWeeks]);

  return (
    <div className="space-y-3">
      {/* Injury info card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#FF550018', color: COLORS.electricOrange }}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#c9d1d9] truncate">
                {injuryWeeks > 0 ? 'Currently Injured' : 'Fully Fit'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {injuryWeeks > 0 ? `${injuryWeeks} week${injuryWeeks > 1 ? 's' : ''} remaining` : 'No active injury'}
                </span>
              </div>
            </div>
            <div
              className="px-2 py-1 rounded text-[10px] font-bold"
              style={{
                backgroundColor: injuryWeeks <= 0 ? `${COLORS.neonLime}18` : `${COLORS.electricOrange}18`,
                color: injuryWeeks <= 0 ? COLORS.neonLime : COLORS.electricOrange,
              }}
            >
              {injuryWeeks <= 0 ? 'FIT' : 'INJURED'}
            </div>
          </div>

          {/* Fitness bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#8b949e]">Fitness Level</span>
              <span className="text-xs font-semibold" style={{ color: valueColor(fitness) }}>
                {fitness}/100
              </span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-700"
                style={{ width: `${fitness}%`, backgroundColor: valueColor(fitness) }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SVG 1: Injury Status Gauge */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.04 }}>
        <InjuryStatusGauge value={overallStatus} label="Overall Condition" />
      </motion.div>

      {/* SVG 2: Injury History Timeline */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.08 }}>
        <InjuryHistoryTimeline playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 3: Recovery Progress Ring */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.12 }}>
        <RecoveryProgressRing percent={injuryWeeks > 0 ? recoveryPercent : 100} />
      </motion.div>

      {/* Weekly Breakdown */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.16 }}>
        <WeeklyBreakdownCard playerName={playerName} week={week} />
      </motion.div>

      {/* Mental Readiness */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.2 }}>
        <MentalReadinessCard playerName={playerName} week={week} />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Tab 2: Treatment Panel
   ════════════════════════════════════════════════════════════ */
function TreatmentTab({ playerName, week, facilities }: {
  playerName: string;
  week: number;
  facilities: number;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      {/* Treatment overview card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.cyanBlue}18`, color: COLORS.cyanBlue }}
            >
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#c9d1d9]">Treatment Center</p>
              <p className="text-[11px] text-[#8b949e]">Active rehabilitation protocols</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#21262d] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#8b949e]">Sessions</p>
              <p className="text-sm font-bold text-[#CCFF00]">{seededInt(playerName, week, 'sessions', 8, 32)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#8b949e]">Hours</p>
              <p className="text-sm font-bold text-[#00E5FF]">{seededInt(playerName, week, 'hours', 12, 48)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#8b949e]">Compliance</p>
              <p className="text-sm font-bold text-[#FF5500]">{seededInt(playerName, week, 'comply', 75, 100)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SVG 4: Treatment Effectiveness Bars */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.04 }}>
        <TreatmentEffectivenessBars playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 5: Medical Staff Radar */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.08 }}>
        <MedicalStaffRadar playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 6: Facility Quality Ring */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.12 }}>
        <FacilityQualityRing facilities={facilities} />
      </motion.div>

      {/* Treatment Schedule */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.16 }}>
        <TreatmentScheduleCard playerName={playerName} week={week} />
      </motion.div>

      {/* Nutrition Plan */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.2 }}>
        <NutritionPlanCard playerName={playerName} week={week} />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Tab 3: Prevention Panel
   ════════════════════════════════════════════════════════════ */
function PreventionTab({ playerName, week }: {
  playerName: string;
  week: number;
}): React.JSX.Element {
  const preventionTips = useMemo(() => [
    {
      icon: <Flame className="h-4 w-4" />,
      title: 'Dynamic Warm-Up',
      desc: 'Complete 15-min dynamic warm-up before every session focusing on hip mobility.',
      color: COLORS.electricOrange,
    },
    {
      icon: <Dumbbell className="h-4 w-4" />,
      title: 'Eccentric Strength',
      desc: 'Include Nordic curls and eccentric hamstring exercises 2x per week.',
      color: COLORS.neonLime,
    },
    {
      icon: <Brain className="h-4 w-4" />,
      title: 'Recovery Monitoring',
      desc: 'Track sleep quality and HRV daily to catch overtraining early.',
      color: COLORS.cyanBlue,
    },
    {
      icon: <Activity className="h-4 w-4" />,
      title: 'Load Management',
      desc: 'Gradually increase training volume by max 10% per week.',
      color: '#8B5CF6',
    },
  ], []);

  return (
    <div className="space-y-3">
      {/* Prevention overview card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.neonLime}18`, color: COLORS.neonLime }}
            >
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#c9d1d9]">Injury Prevention Hub</p>
              <p className="text-[11px] text-[#8b949e]">Proactive risk management protocols</p>
            </div>
          </div>

          {/* Prevention tips */}
          <div className="space-y-2">
            {preventionTips.map((tip, i) => (
              <div key={`tip-${i}`} className="flex items-start gap-2 p-2 rounded-lg bg-[#21262d]">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${tip.color}18`, color: tip.color }}
                >
                  {tip.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#c9d1d9]">{tip.title}</p>
                  <p className="text-[10px] text-[#8b949e] leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SVG 7: Injury Risk Radar */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.04 }}>
        <InjuryRiskRadar playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 8: Prevention Protocol Bars */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.08 }}>
        <PreventionProtocolBars playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 9: Fitness vs Injury Area Chart */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.12 }}>
        <FitnessVsInjuryAreaChart playerName={playerName} week={week} />
      </motion.div>

      {/* Risk Alert Banner */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.16 }}>
        <RiskAlertBanner playerName={playerName} week={week} />
      </motion.div>

      {/* Mental Readiness in Prevention context */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.2 }}>
        <MentalReadinessCard playerName={playerName} week={week} />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Tab 4: Return Panel
   ════════════════════════════════════════════════════════════ */
function ReturnTab({ playerName, week, injuryWeeks }: {
  playerName: string;
  week: number;
  injuryWeeks: number;
}): React.JSX.Element {
  const matchReadiness = useMemo(() => {
    if (injuryWeeks <= 0) return 95;
    return seededInt(playerName, week, 'match-ready', 20, 85);
  }, [playerName, week, injuryWeeks]);

  return (
    <div className="space-y-3">
      {/* Return overview card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.electricOrange}18`, color: COLORS.electricOrange }}
            >
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#c9d1d9]">Return to Play</p>
              <p className="text-[11px] text-[#8b949e]">Comeback planning and readiness tracking</p>
            </div>
            <div
              className="px-2 py-1 rounded text-[10px] font-bold"
              style={{
                backgroundColor: matchReadiness >= 75 ? `${COLORS.neonLime}18` : `${COLORS.electricOrange}18`,
                color: matchReadiness >= 75 ? COLORS.neonLime : COLORS.electricOrange,
              }}
            >
              {matchReadiness >= 90 ? 'READY' : matchReadiness >= 75 ? 'NEAR' : 'BUILDING'}
            </div>
          </div>

          {/* Return milestones */}
          <div className="space-y-2">
            {[
              { label: 'Full Range of Motion', done: true, color: COLORS.neonLime },
              { label: 'Pain-Free Movement', done: matchReadiness >= 40, color: matchReadiness >= 40 ? COLORS.neonLime : COLORS.electricOrange },
              { label: 'Match Fitness (80%+)', done: matchReadiness >= 65, color: matchReadiness >= 65 ? COLORS.neonLime : COLORS.electricOrange },
              { label: 'Medical Clearance', done: matchReadiness >= 85, color: matchReadiness >= 85 ? COLORS.neonLime : COLORS.dim },
              { label: 'Match Debut', done: matchReadiness >= 95, color: matchReadiness >= 95 ? COLORS.neonLime : COLORS.dim },
            ].map((milestone, i) => (
              <div key={`milestone-${i}`} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: milestone.done ? `${COLORS.neonLime}20` : '#21262d', border: `1.5px solid ${milestone.color}` }}
                >
                  {milestone.done && (
                    <span className="text-[8px]" style={{ color: COLORS.neonLime }}>&#10003;</span>
                  )}
                </div>
                <span
                  className="text-[11px]"
                  style={{ color: milestone.done ? COLORS.primary : COLORS.dim, fontWeight: milestone.done ? 600 : 400 }}
                >
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SVG 10: Return Timeline Line */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.04 }}>
        <ReturnTimelineLine playerName={playerName} week={week} />
      </motion.div>

      {/* SVG 11: Match Readiness Gauge */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.08 }}>
        <MatchReadinessGauge value={matchReadiness} />
      </motion.div>

      {/* SVG 12: Comeback Stats Bars */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.12 }}>
        <ComebackStatsBars playerName={playerName} week={week} />
      </motion.div>

      {/* Return Plan */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.16 }}>
        <ReturnPlanCard playerName={playerName} week={week} injuryWeeks={injuryWeeks} />
      </motion.div>

      {/* Nutrition Plan for Return */}
      <motion.div {...fadeIn} transition={{ ...BASE_ANIM, delay: 0.2 }}>
        <NutritionPlanCard playerName={playerName} week={week} />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */
export default function InjuryRecoveryEnhanced() {
  const [activeTab, setActiveTab] = useState(0);
  const gameState = useGameStore(state => state.gameState);

  const playerName = gameState?.player.name ?? 'Player';
  const week = gameState?.currentWeek ?? 1;
  const fitness = gameState?.player.fitness ?? 70;
  const injuryWeeks = gameState?.player.injuryWeeks ?? 0;
  const facilities = gameState?.currentClub.facilities ?? 65;
  const clubName = gameState?.currentClub.name ?? 'Club';

  if (!gameState) {
    return <></>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <motion.div className="flex items-center gap-2" {...fadeIn}>
        <Heart className="h-5 w-5" style={{ color: COLORS.electricOrange }} />
        <h2 className="text-lg font-bold text-[#c9d1d9]">Injury Recovery Enhanced</h2>
        <span className="text-xs text-[#484f58] ml-auto">{clubName}</span>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
        {TABS.map((tab, i) => (
          <button
            key={`tab-${i}`}
            onClick={() => setActiveTab(i)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-md text-[11px] font-semibold transition-all
              ${activeTab === i
                ? 'text-[#c9d1d9] bg-[#21262d]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={`tab-content-${activeTab}`} {...fadeIn} transition={{ duration: 0.2 }}>
        {activeTab === 0 && (
          <StatusTab playerName={playerName} week={week} fitness={fitness} injuryWeeks={injuryWeeks} />
        )}
        {activeTab === 1 && (
          <TreatmentTab playerName={playerName} week={week} facilities={facilities} />
        )}
        {activeTab === 2 && (
          <PreventionTab playerName={playerName} week={week} />
        )}
        {activeTab === 3 && (
          <ReturnTab playerName={playerName} week={week} injuryWeeks={injuryWeeks} />
        )}
      </motion.div>

      {/* Footer Summary */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-[10px] text-[#8b949e]">
                {playerName} — Season {gameState.currentSeason}, Week {week}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" style={{ color: valueColor(fitness) }} />
              <span className="text-[10px] font-bold" style={{ color: valueColor(fitness) }}>
                Fitness: {fitness}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
