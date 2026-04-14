'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield, AlertTriangle, Activity, Heart, Zap, Target,
  TrendingUp, TrendingDown, Clock, BarChart3, Dumbbell,
  Brain, Stethoscope, Thermometer, ChevronRight, Play,
  RotateCcw, Leaf, Apple, Moon, Flame, Footprints,
  Timer, RefreshCw, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react';

// ============================================================
// Color Palette Constants
// ============================================================
const COLORS = {
  bg: '#0d1117',
  card: '#161b22',
  border: '#21262d',
  muted: '#30363d',
  textMuted: '#8b949e',
  textPrimary: '#c9d1d9',
  blue: '#58a6ff',
  orange: '#f0883e',
  green: '#3fb950',
  red: '#f85149',
  purple: '#d2a8ff',
  lightBlue: '#79c0ff',
  amber: '#ffa657',
} as const;

// ============================================================
// Data Types
// ============================================================
interface BodyPartRisk {
  name: string;
  risk: number;
  trend: 'up' | 'down' | 'stable';
  injuries: number;
}

interface RiskFactor {
  name: string;
  value: number;
  seasonAvg: number;
  icon: React.ReactNode;
}

interface SimulationResult {
  noInjury: number;
  minor: number;
  moderate: number;
  severe: number;
  duration: number;
  tackles: number;
  sprints: number;
  distance: number;
  avgSpeed: number;
  fatiguePeak: number;
}

interface RecoveryPhase {
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  progress: number;
  description: string;
}

interface PhysioRecommendation {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  type: string;
}

interface PreventionStrategy {
  name: string;
  score: number;
  target: number;
  icon: React.ReactNode;
  description: string;
}

interface PreventionTip {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================================
// Static Data
// ============================================================
const TABS = [
  { label: 'Risk Assessment', icon: <Shield className="h-3.5 w-3.5" /> },
  { label: 'Match Simulation', icon: <Play className="h-3.5 w-3.5" /> },
  { label: 'Recovery Planning', icon: <Heart className="h-3.5 w-3.5" /> },
  { label: 'Prevention', icon: <Shield className="h-3.5 w-3.5" /> },
];

const BODY_PARTS: BodyPartRisk[] = [
  { name: 'Hamstring', risk: 72, trend: 'up', injuries: 3 },
  { name: 'Knee', risk: 45, trend: 'stable', injuries: 1 },
  { name: 'Ankle', risk: 58, trend: 'down', injuries: 2 },
  { name: 'Shoulder', risk: 23, trend: 'stable', injuries: 0 },
  { name: 'Groin', risk: 65, trend: 'up', injuries: 2 },
  { name: 'Back', risk: 38, trend: 'down', injuries: 1 },
  { name: 'Wrist', risk: 15, trend: 'stable', injuries: 0 },
  { name: 'Head', risk: 12, trend: 'stable', injuries: 0 },
];

const RISK_FACTORS: RiskFactor[] = [
  {
    name: 'Fatigue Level',
    value: 68,
    seasonAvg: 52,
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  {
    name: 'Previous Injury',
    value: 55,
    seasonAvg: 40,
    icon: <RotateCcw className="h-3.5 w-3.5" />,
  },
  {
    name: 'Workload',
    value: 74,
    seasonAvg: 60,
    icon: <BarChart3 className="h-3.5 w-3.5" />,
  },
];

const SCENARIOS = [
  { id: 'normal', label: 'Normal Match', description: 'Standard 90-minute match', multiplier: 1 },
  { id: 'high', label: 'High Intensity', description: 'Competitive derby match', multiplier: 1.4 },
  { id: 'extra', label: 'Extra Time', description: 'Cup match with extra time', multiplier: 1.7 },
];

const RECOVERY_PHASES: RecoveryPhase[] = [
  { name: 'Diagnosis', status: 'completed', progress: 100, description: 'Medical assessment and imaging' },
  { name: 'Treatment', status: 'completed', progress: 100, description: 'Initial medical treatment' },
  { name: 'Rehabilitation', status: 'current', progress: 65, description: 'Physiotherapy and rehab exercises' },
  { name: 'Light Training', status: 'upcoming', progress: 0, description: 'Gradual return to activity' },
  { name: 'Full Training', status: 'upcoming', progress: 0, description: 'Full squad training sessions' },
  { name: 'Match Ready', status: 'upcoming', progress: 0, description: 'Cleared for competitive play' },
];

const PHYSIO_RECOMMENDATIONS: PhysioRecommendation[] = [
  {
    title: 'Hamstring Eccentric Loading',
    description: 'Nordic curls and Romanian deadlifts to strengthen posterior chain. 3 sets of 6 reps, 3x per week.',
    priority: 'High',
    type: 'Strength',
  },
  {
    title: 'Hip Mobility Protocol',
    description: 'Dynamic hip flexor stretches and glute activation drills before all sessions. 10-minute routine.',
    priority: 'Medium',
    type: 'Flexibility',
  },
  {
    title: 'Load Management Adjustments',
    description: 'Reduce sprint volume by 30% this week. Monitor GPS data for high-speed running distance.',
    priority: 'High',
    type: 'Load Management',
  },
  {
    title: 'Soft Tissue Therapy',
    description: 'Sports massage targeting hamstring and glute complex. Schedule twice this week with physio.',
    priority: 'Medium',
    type: 'Recovery',
  },
];

const PREVENTION_STRATEGIES: PreventionStrategy[] = [
  { name: 'Warm-up', score: 82, target: 95, icon: <Flame className="h-3.5 w-3.5" />, description: 'Dynamic warm-up compliance' },
  { name: 'Strength', score: 67, target: 85, icon: <Dumbbell className="h-3.5 w-3.5" />, description: 'Prehab strength program' },
  { name: 'Flexibility', score: 54, target: 80, icon: <Activity className="h-3.5 w-3.5" />, description: 'Mobility and stretching' },
  { name: 'Nutrition', score: 71, target: 90, icon: <Apple className="h-3.5 w-3.5" />, description: 'Diet and supplementation' },
  { name: 'Rest', score: 60, target: 88, icon: <Moon className="h-3.5 w-3.5" />, description: 'Sleep and recovery time' },
];

const PREVENTION_TIPS: PreventionTip[] = [
  {
    title: 'Increase Nordic Curl Volume',
    description: 'Your hamstring injury history suggests adding eccentric loading exercises. Start with 2 sets of 4 reps and progress weekly.',
    icon: <Dumbbell className="h-3.5 w-3.5" />,
  },
  {
    title: 'Monitor Acute:Chronic Workload Ratio',
    description: 'Keep your weekly training load within 0.8-1.3x of your 4-week average to minimize injury risk.',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
  },
  {
    title: 'Prioritize Sleep Quality',
    description: 'Aim for 8-9 hours of sleep per night. Poor sleep increases injury risk by up to 70% according to recent studies.',
    icon: <Moon className="h-3.5 w-3.5" />,
  },
];

const RISK_TREND_DATA = [
  { week: 'W1', risk: 32 },
  { week: 'W2', risk: 38 },
  { week: 'W3', risk: 45 },
  { week: 'W4', risk: 41 },
  { week: 'W5', risk: 52 },
  { week: 'W6', risk: 58 },
  { week: 'W7', risk: 55 },
  { week: 'W8', risk: 63 },
  { week: 'W9', risk: 71 },
  { week: 'W10', risk: 68 },
];

const FATIGUE_PERFORMANCE_DATA = [
  { minute: 0, fatigue: 5, performance: 95 },
  { minute: 15, fatigue: 18, performance: 92 },
  { minute: 30, fatigue: 32, performance: 87 },
  { minute: 45, fatigue: 45, performance: 80 },
  { minute: 60, fatigue: 58, performance: 72 },
  { minute: 75, fatigue: 70, performance: 63 },
  { minute: 90, fatigue: 82, performance: 55 },
];

const CHALLENGE_TYPES = [
  { name: 'Sprint', intensity: 78 },
  { name: 'Tackle', intensity: 62 },
  { name: 'Jump', intensity: 45 },
  { name: 'Change Dir', intensity: 85 },
  { name: 'Shot', intensity: 38 },
  { name: 'Header', intensity: 28 },
];

const PITCH_ZONE_DATA = [
  [15, 25, 35, 25, 15],
  [20, 40, 55, 40, 20],
  [10, 20, 30, 20, 10],
];

const SEASON_INJURY_HISTORY = [
  { week: 2, type: 'minor', body: 'Ankle' },
  { week: 5, type: 'moderate', body: 'Hamstring' },
  { week: 9, type: 'minor', body: 'Groin' },
  { week: 14, type: 'moderate', body: 'Knee' },
  { week: 18, type: 'minor', body: 'Back' },
  { week: 23, type: 'severe', body: 'Hamstring' },
  { week: 27, type: 'minor', body: 'Ankle' },
];

const PHYSIO_SESSION_TYPES = [
  { name: 'Massage', minutes: 45, intensity: 3 },
  { name: 'Stretching', minutes: 30, intensity: 2 },
  { name: 'Strength', minutes: 50, intensity: 7 },
  { name: 'Cardio', minutes: 25, intensity: 5 },
  { name: 'Pool Work', minutes: 40, intensity: 3 },
];

// ============================================================
// Utility Functions
// ============================================================
function getRiskColor(risk: number): string {
  if (risk >= 75) return COLORS.red;
  if (risk >= 50) return COLORS.orange;
  if (risk >= 25) return COLORS.amber;
  return COLORS.green;
}

function getRiskLabel(risk: number): string {
  if (risk >= 75) return 'Very High';
  if (risk >= 50) return 'High';
  if (risk >= 25) return 'Moderate';
  return 'Low';
}

function getOverallRisk(): number {
  return BODY_PARTS.reduce((sum, bp) => sum + bp.risk, 0) / BODY_PARTS.length;
}

function getPreventionScore(): number {
  return PREVENTION_STRATEGIES.reduce((sum, s) => sum + s.score, 0) / PREVENTION_STRATEGIES.length;
}

function simulateMatch(scenario: string): SimulationResult {
  const base = SCENARIOS.find(s => s.id === scenario);
  const mult = base ? base.multiplier : 1;
  const noInjury = Math.max(5, Math.round(65 / mult + (Math.random() * 15 - 7)));
  const minor = Math.round(18 * mult + (Math.random() * 8 - 4));
  const moderate = Math.round(10 * mult + (Math.random() * 6 - 3));
  const severe = Math.round(4 * mult + (Math.random() * 4 - 2));
  const total = noInjury + minor + moderate + severe;

  return {
    noInjury: Math.round((noInjury / total) * 100),
    minor: Math.round((minor / total) * 100),
    moderate: Math.round((moderate / total) * 100),
    severe: 100 - Math.round((noInjury / total) * 100) - Math.round((minor / total) * 100) - Math.round((moderate / total) * 100),
    duration: scenario === 'extra' ? 120 : 90,
    tackles: Math.round((12 + Math.random() * 8) * mult),
    sprints: Math.round((25 + Math.random() * 15) * mult),
    distance: +(9.5 + Math.random() * 3 * mult).toFixed(1),
    avgSpeed: +(21 + Math.random() * 4).toFixed(1),
    fatiguePeak: Math.min(99, Math.round(75 * mult + Math.random() * 10)),
  };
}

function getBodyPartPosition(name: string): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    Head: { x: 150, y: 30 },
    Shoulder: { x: 85, y: 110 },
    Groin: { x: 150, y: 210 },
    Back: { x: 215, y: 150 },
    Hamstring: { x: 150, y: 290 },
    Knee: { x: 150, y: 340 },
    Ankle: { x: 150, y: 395 },
    Wrist: { x: 60, y: 180 },
  };
  return positions[name] || { x: 150, y: 200 };
}

// ============================================================
// SVG Component Functions
// ============================================================

// SVG 1: Body Risk Map
function BodyRiskMapSVG(): React.JSX.Element {
  return (
    <svg viewBox="0 0 300 440" className="w-full h-auto">
      {/* Head */}
      <ellipse cx="150" cy="38" rx="28" ry="32" fill="none" stroke={COLORS.muted} strokeWidth="2" />
      {/* Neck */}
      <rect x="138" y="68" width="24" height="22" rx="4" fill="none" stroke={COLORS.muted} strokeWidth="2" />
      {/* Torso */}
      <path d="M95 90 L205 90 L200 220 L100 220 Z" fill="none" stroke={COLORS.muted} strokeWidth="2" rx="6" />
      {/* Left Arm */}
      <path d="M95 90 L55 100 L45 180 L55 185 L70 115 L95 108" fill="none" stroke={COLORS.muted} strokeWidth="2" strokeLinejoin="round" />
      {/* Right Arm */}
      <path d="M205 90 L245 100 L255 180 L245 185 L230 115 L205 108" fill="none" stroke={COLORS.muted} strokeWidth="2" strokeLinejoin="round" />
      {/* Left Leg */}
      <path d="M115 220 L108 340 L105 400 L125 400 L128 340 L140 220" fill="none" stroke={COLORS.muted} strokeWidth="2" strokeLinejoin="round" />
      {/* Right Leg */}
      <path d="M160 220 L172 340 L175 400 L195 400 L192 340 L185 220" fill="none" stroke={COLORS.muted} strokeWidth="2" strokeLinejoin="round" />
      {/* Spine line */}
      <line x1="150" y1="90" x2="150" y2="220" stroke={COLORS.muted} strokeWidth="1" strokeDasharray="4 3" />

      {/* Risk dots */}
      {BODY_PARTS.map((bp) => {
        const pos = getBodyPartPosition(bp.name);
        const color = getRiskColor(bp.risk);
        const radius = 6 + (bp.risk / 100) * 8;
        return (
          <g key={bp.name}>
            <circle cx={pos.x} cy={pos.y} r={radius + 4} fill={color} fillOpacity="0.15" />
            <circle cx={pos.x} cy={pos.y} r={radius} fill={color} fillOpacity="0.8" stroke={COLORS.card} strokeWidth="2" />
            <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">{bp.risk}</text>
            <text x={pos.x + radius + 6} y={pos.y + 3} textAnchor="start" fill={COLORS.textPrimary} fontSize="9">{bp.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// SVG 2: Risk Distribution Donut
function RiskDistributionDonutSVG(): React.JSX.Element {
  const donutParts = ['Hamstring', 'Knee', 'Ankle', 'Groin', 'Back'];
  const selectedParts = BODY_PARTS.filter(bp => donutParts.includes(bp.name));
  const totalRisk = selectedParts.reduce((sum, bp) => sum + bp.risk, 0);
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 50;
  const segmentColors = [COLORS.red, COLORS.orange, COLORS.amber, COLORS.orange, COLORS.amber];

  const segments = selectedParts.reduce<{ acc: { d: string; color: string; name: string; risk: number }[]; angle: number }>((acc, bp, i) => {
    const percentage = bp.risk / totalRisk;
    const angle = percentage * 360;
    const startAngle = acc.angle;
    const endAngle = acc.angle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const outerStartX = cx + outerR * Math.cos(startRad);
    const outerStartY = cy + outerR * Math.sin(startRad);
    const outerEndX = cx + outerR * Math.cos(endRad);
    const outerEndY = cy + outerR * Math.sin(endRad);
    const innerStartX = cx + innerR * Math.cos(endRad);
    const innerStartY = cy + innerR * Math.sin(endRad);
    const innerEndX = cx + innerR * Math.cos(startRad);
    const innerEndY = cy + innerR * Math.sin(startRad);

    const d = `M ${outerStartX} ${outerStartY} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX} ${outerEndY} L ${innerStartX} ${innerStartY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY} Z`;

    return { acc: [...acc.acc, { d, color: segmentColors[i], name: bp.name, risk: bp.risk }], angle: endAngle };
  }, { acc: [], angle: -90 }).acc;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
      {segments.map((seg, i) => (
        <path key={i} d={seg.d} fill={seg.color} fillOpacity="0.8" stroke={COLORS.card} strokeWidth="2" />
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fill={COLORS.textPrimary} fontSize="18" fontWeight="bold">
        {Math.round(getOverallRisk())}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        Overall Risk
      </text>
      {/* Legend below */}
      {segments.map((seg, i) => (
        <g key={`legend-${i}`}>
          <rect x={10} y={180 + i * 0} width="0" height="0" />
        </g>
      ))}
    </svg>
  );
}

// SVG 3: Injury Risk Trend Area Chart
function InjuryRiskTrendSVG(): React.JSX.Element {
  const svgW = 300;
  const svgH = 140;
  const padX = 35;
  const padY = 20;
  const chartW = svgW - padX - 15;
  const chartH = svgH - padY - 25;
  const dangerLine = 70;

  const points = RISK_TREND_DATA.map((d, i) => ({
    x: padX + (i / (RISK_TREND_DATA.length - 1)) * chartW,
    y: padY + chartH - (d.risk / 100) * chartH,
    risk: d.risk,
    week: d.week,
  }));

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fillArea = `${padX},${padY + chartH} ${linePoints} ${padX + chartW},${padY + chartH}`;
  const dangerY = padY + chartH - (dangerLine / 100) * chartH;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(val => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={padX - 5} y={y + 3} textAnchor="end" fill={COLORS.textMuted} fontSize="7">{val}</text>
          </g>
        );
      })}

      {/* Danger line */}
      <line x1={padX} y1={dangerY} x2={padX + chartW} y2={dangerY} stroke={COLORS.red} strokeWidth="1" strokeDasharray="4 3" />
      <text x={padX + chartW + 2} y={dangerY + 3} fill={COLORS.red} fontSize="6">Danger</text>

      {/* Area fill */}
      <polygon points={fillArea} fill={COLORS.orange} fillOpacity="0.1" />

      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={COLORS.orange} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={getRiskColor(p.risk)} stroke={COLORS.card} strokeWidth="1.5" />
          <text x={p.x} y={padY + chartH + 12} textAnchor="middle" fill={COLORS.textMuted} fontSize="6">{p.week}</text>
        </g>
      ))}

      {/* Y axis label */}
      <text x={8} y={padY + chartH / 2} textAnchor="middle" fill={COLORS.textMuted} fontSize="7" dominantBaseline="middle">
        Risk %
      </text>
    </svg>
  );
}

// SVG 4: Risk Factor Comparison Bars
function RiskFactorComparisonBarsSVG(): React.JSX.Element {
  const barH = 14;
  const gap = 28;
  const labelW = 80;
  const barMaxW = 140;
  const svgW = 300;
  const svgH = gap * RISK_FACTORS.length + 30;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {RISK_FACTORS.map((rf, i) => {
        const y = 10 + i * gap;
        const currentW = (rf.value / 100) * barMaxW;
        const avgW = (rf.seasonAvg / 100) * barMaxW;

        return (
          <g key={i}>
            {/* Label */}
            <text x={labelW - 5} y={y + barH / 2 + 3} textAnchor="end" fill={COLORS.textPrimary} fontSize="9">
              {rf.name}
            </text>

            {/* Background bar */}
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.border} />

            {/* Season avg bar */}
            <rect x={labelW} y={y + barH + 1} width={avgW} height={5} rx="2" fill={COLORS.textMuted} fillOpacity="0.4" />

            {/* Current value bar */}
            <rect x={labelW} y={y} width={currentW} height={barH} rx="3" fill={getRiskColor(rf.value)} fillOpacity="0.85" />

            {/* Value text */}
            <text x={labelW + currentW + 6} y={y + barH / 2 + 3} fill={COLORS.textPrimary} fontSize="8" fontWeight="bold">
              {rf.value}%
            </text>

            {/* Avg label */}
            <text x={labelW + avgW + 4} y={y + barH + 5.5} fill={COLORS.textMuted} fontSize="6">
              Avg {rf.seasonAvg}%
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g>
        <rect x={labelW} y={svgH - 14} width="8" height="6" rx="1.5" fill={COLORS.orange} />
        <text x={labelW + 12} y={svgH - 9} fill={COLORS.textMuted} fontSize="7">Current</text>
        <rect x={labelW + 60} y={svgH - 14} width="8" height="6" rx="1.5" fill={COLORS.textMuted} fillOpacity="0.4" />
        <text x={labelW + 72} y={svgH - 9} fill={COLORS.textMuted} fontSize="7">Season Avg</text>
      </g>
    </svg>
  );
}

// SVG 5: Simulation Risk Gauge
function SimulationRiskGaugeSVG({ value }: { value: number }): React.JSX.Element {
  const cx = 120;
  const cy = 110;
  const radius = 80;
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = endAngle - startAngle + 360;
  const sweepAngle = (value / 100) * 180;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + 180) * Math.PI) / 180;

  // Background arc
  const bgX1 = cx + radius * Math.cos(startRad);
  const bgY1 = cy + radius * Math.sin(startRad);
  const bgX2 = cx + radius * Math.cos(endRad);
  const bgY2 = cy + radius * Math.sin(endRad);

  // Value arc
  const valAngleRad = ((startAngle + sweepAngle) * Math.PI) / 180;
  const valX = cx + radius * Math.cos(valAngleRad);
  const valY = cy + radius * Math.sin(valAngleRad);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const color = getRiskColor(value);

  // Tick marks
  const ticks: { x: number; y: number; label: string }[] = [];
  for (let i = 0; i <= 10; i++) {
    const angle = ((startAngle + (i / 10) * 180) * Math.PI) / 180;
    const tx = cx + (radius + 10) * Math.cos(angle);
    const ty = cy + (radius + 10) * Math.sin(angle);
    ticks.push({ x: tx, y: ty, label: `${i * 10}` });
  }

  // Needle
  const needleAngle = ((startAngle + sweepAngle) * Math.PI) / 180;
  const needleLen = radius - 15;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 240 140" className="w-full h-auto">
      {/* Background arc */}
      <path
        d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`}
        fill="none"
        stroke={COLORS.border}
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Color zone indicators */}
      <path
        d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos(((startAngle + 45) * Math.PI) / 180)} ${cy + radius * Math.sin(((startAngle + 45) * Math.PI) / 180)}`}
        fill="none"
        stroke={COLORS.green}
        strokeWidth="12"
        strokeLinecap="round"
        fillOpacity="0.3"
      />
      <path
        d={`M ${cx + radius * Math.cos(((startAngle + 45) * Math.PI) / 180)} ${cy + radius * Math.sin(((startAngle + 45) * Math.PI) / 180)} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos(((startAngle + 90) * Math.PI) / 180)} ${cy + radius * Math.sin(((startAngle + 90) * Math.PI) / 180)}`}
        fill="none"
        stroke={COLORS.amber}
        strokeWidth="12"
        strokeLinecap="round"
        fillOpacity="0.3"
      />
      <path
        d={`M ${cx + radius * Math.cos(((startAngle + 90) * Math.PI) / 180)} ${cy + radius * Math.sin(((startAngle + 90) * Math.PI) / 180)} A ${radius} ${radius} 0 0 1 ${bgX2} ${bgY2}`}
        fill="none"
        stroke={COLORS.red}
        strokeWidth="12"
        strokeLinecap="round"
        fillOpacity="0.3"
      />

      {/* Value arc */}
      <path
        d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 ${largeArc} 1 ${valX} ${valY}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Tick labels */}
      {ticks.filter((_, i) => i % 2 === 0).map((t, i) => (
        <text key={i} x={t.x} y={t.y + 3} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
          {t.label}
        </text>
      ))}

      {/* Center value */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={COLORS.textMuted} fontSize="9">
        Risk Score
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize="8" fontWeight="bold">
        {getRiskLabel(value)}
      </text>
    </svg>
  );
}

// SVG 6: Fatigue vs Performance Line Chart
function FatiguePerformanceSVG({ scenario }: { scenario: string }): React.JSX.Element {
  const svgW = 300;
  const svgH = 150;
  const padX = 35;
  const padY = 15;
  const chartW = svgW - padX - 15;
  const chartH = svgH - padY - 25;

  const mult = SCENARIOS.find(s => s.id === scenario)?.multiplier || 1;

  const points = FATIGUE_PERFORMANCE_DATA.map((d, i) => ({
    x: padX + (i / (FATIGUE_PERFORMANCE_DATA.length - 1)) * chartW,
    fatigueY: padY + chartH - (Math.min(99, d.fatigue * mult) / 100) * chartH,
    perfY: padY + chartH - (Math.max(10, d.performance - (mult - 1) * 15)) / 100 * chartH,
    minute: d.minute,
    fatigue: Math.min(99, Math.round(d.fatigue * mult)),
    performance: Math.max(10, Math.round(d.performance - (mult - 1) * 15)),
  }));

  const fatigueLine = points.map(p => `${p.x},${p.fatigueY}`).join(' ');
  const perfLine = points.map(p => `${p.x},${p.perfY}`).join(' ');

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(val => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <line key={val} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
        );
      })}

      {/* Fatigue area */}
      <polygon
        points={`${padX},${padY + chartH} ${fatigueLine} ${padX + chartW},${padY + chartH}`}
        fill={COLORS.red}
        fillOpacity="0.08"
      />

      {/* Fatigue line */}
      <polyline points={fatigueLine} fill="none" stroke={COLORS.red} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Performance line */}
      <polyline points={perfLine} fill="none" stroke={COLORS.green} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.fatigueY} r="3" fill={COLORS.red} stroke={COLORS.card} strokeWidth="1.5" />
          <circle cx={p.x} cy={p.perfY} r="3" fill={COLORS.green} stroke={COLORS.card} strokeWidth="1.5" />
          <text x={p.x} y={padY + chartH + 12} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">{p.minute}&apos;</text>
        </g>
      ))}

      {/* Legend */}
      <line x1={padX} y1={svgH - 5} x2={padX + 15} y2={svgH - 5} stroke={COLORS.red} strokeWidth="2" />
      <text x={padX + 18} y={svgH - 2} fill={COLORS.textMuted} fontSize="7">Fatigue</text>
      <line x1={padX + 60} y1={svgH - 5} x2={padX + 75} y2={svgH - 5} stroke={COLORS.green} strokeWidth="2" strokeDasharray="4 2" />
      <text x={padX + 78} y={svgH - 2} fill={COLORS.textMuted} fontSize="7">Performance</text>
    </svg>
  );
}

// SVG 7: Challenge Intensity Bars
function ChallengeIntensityBarsSVG(): React.JSX.Element {
  const barH = 16;
  const gap = 24;
  const labelW = 70;
  const barMaxW = 160;
  const svgW = 280;
  const svgH = gap * CHALLENGE_TYPES.length + 20;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {CHALLENGE_TYPES.map((ct, i) => {
        const y = 8 + i * gap;
        const w = (ct.intensity / 100) * barMaxW;
        const color = getRiskColor(ct.intensity);

        return (
          <g key={i}>
            <text x={labelW - 5} y={y + barH / 2 + 3} textAnchor="end" fill={COLORS.textPrimary} fontSize="9">
              {ct.name}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.border} />
            <rect x={labelW} y={y} width={w} height={barH} rx="3" fill={color} fillOpacity="0.85" />
            <text x={labelW + w + 5} y={y + barH / 2 + 3} fill={COLORS.textPrimary} fontSize="8" fontWeight="bold">
              {ct.intensity}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// SVG 8: Pitch Zone Risk Heatmap
function PitchZoneHeatmapSVG(): React.JSX.Element {
  const rows = 3;
  const cols = 5;
  const cellW = 48;
  const cellH = 40;
  const padX = 20;
  const padY = 30;
  const svgW = padX * 2 + cols * cellW;
  const svgH = padY + rows * cellH + 10;

  const zoneLabels = ['Defensive', 'Midfield', 'Attacking'];

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Title */}
      <text x={svgW / 2} y={18} textAnchor="middle" fill={COLORS.textMuted} fontSize="9" fontWeight="bold">
        Pitch Zone Risk Heatmap
      </text>

      {PITCH_ZONE_DATA.map((row, ri) => (
        <g key={ri}>
          <text x={padX - 5} y={padY + ri * cellH + cellH / 2 + 3} textAnchor="end" fill={COLORS.textMuted} fontSize="7">
            {zoneLabels[ri]}
          </text>
          {row.map((val, ci) => {
            const x = padX + ci * cellW;
            const y = padY + ri * cellH;
            const color = getRiskColor(val);
            return (
              <g key={ci}>
                <rect x={x} y={y} width={cellW} height={cellH} rx="3" fill={color} fillOpacity="0.7" stroke={COLORS.card} strokeWidth="1" />
                <text x={x + cellW / 2} y={y + cellH / 2 + 3} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {val}%
                </text>
              </g>
            );
          })}
        </g>
      ))}

      {/* Column labels */}
      {['Left', 'L-Center', 'Center', 'R-Center', 'Right'].map((label, i) => (
        <text key={i} x={padX + i * cellW + cellW / 2} y={padY + rows * cellH + 9} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
          {label}
        </text>
      ))}
    </svg>
  );
}

// SVG 9: Recovery Progress Ring
function RecoveryProgressRingSVG({ progress }: { progress: number }): React.JSX.Element {
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress >= 75 ? COLORS.green : progress >= 50 ? COLORS.amber : COLORS.orange;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.border} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill={color} fontSize="28" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

// SVG 10: Recovery Timeline Chart
function RecoveryTimelineChartSVG(): React.JSX.Element {
  const svgW = 320;
  const svgH = 80;
  const padX = 15;
  const padY = 15;
  const barH = 28;
  const barY = padY + 10;
  const totalW = svgW - padX * 2;

  const phaseWidths = [15, 15, 25, 15, 15, 15];
  const totalPhaseWidth = phaseWidths.reduce((s, w) => s + w, 0);
  const phaseColors = [COLORS.green, COLORS.green, COLORS.orange, COLORS.blue, COLORS.purple, COLORS.green];

  const bars = RECOVERY_PHASES.reduce<{ acc: { x: number; w: number; color: string; phase: RecoveryPhase; index: number }[]; offset: number }>((acc, phase, i) => {
    const w = (phaseWidths[i] / totalPhaseWidth) * totalW;
    const bar = { x: acc.offset, w, color: phaseColors[i], phase, index: i };
    return { acc: [...acc.acc, bar], offset: acc.offset + w };
  }, { acc: [], offset: padX }).acc;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Background bar */}
      <rect x={padX} y={barY} width={totalW} height={barH} rx="4" fill={COLORS.border} />

      {/* Phase segments */}
      {bars.map((bar) => (
        <g key={bar.index}>
          <rect
            x={bar.x}
            y={barY}
            width={bar.w}
            height={barH}
            rx="4"
            fill={bar.color}
            fillOpacity={bar.phase.status === 'completed' ? 0.8 : bar.phase.status === 'current' ? 0.6 : 0.2}
            stroke={COLORS.card}
            strokeWidth="1"
          />
          {bar.phase.status === 'current' && (
            <rect
              x={bar.x}
              y={barY}
              width={bar.w * (bar.phase.progress / 100)}
              height={barH}
              rx="4"
              fill={bar.color}
              fillOpacity="0.4"
            />
          )}
          <text
            x={bar.x + bar.w / 2}
            y={barY + barH / 2 + 3}
            textAnchor="middle"
            fill={COLORS.textPrimary}
            fontSize="7"
            fontWeight="bold"
          >
            {bar.phase.name}
          </text>
        </g>
      ))}

      {/* Progress marker */}
      <line x1={padX + totalW * 0.55} y1={barY - 3} x2={padX + totalW * 0.55} y2={barY + barH + 3} stroke={COLORS.orange} strokeWidth="2" />
      <text x={padX + totalW * 0.55} y={barY - 6} textAnchor="middle" fill={COLORS.orange} fontSize="7" fontWeight="bold">
        Now
      </text>
    </svg>
  );
}

// SVG 11: Physio Session Plan Bars
function PhysioSessionPlanBarsSVG(): React.JSX.Element {
  const barH = 18;
  const gap = 30;
  const labelW = 72;
  const barMaxW = 150;
  const svgW = 290;
  const svgH = gap * PHYSIO_SESSION_TYPES.length + 35;
  const maxMinutes = Math.max(...PHYSIO_SESSION_TYPES.map(s => s.minutes));

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {PHYSIO_SESSION_TYPES.map((session, i) => {
        const y = 8 + i * gap;
        const w = (session.minutes / maxMinutes) * barMaxW;
        const intensityColor = session.intensity >= 6 ? COLORS.red : session.intensity >= 4 ? COLORS.orange : COLORS.green;

        return (
          <g key={i}>
            <text x={labelW - 5} y={y + barH / 2 + 3} textAnchor="end" fill={COLORS.textPrimary} fontSize="9">
              {session.name}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.border} />
            <rect x={labelW} y={y} width={w} height={barH} rx="3" fill={COLORS.blue} fillOpacity="0.7" />
            <text x={labelW + w - 5} y={y + barH / 2 + 3} textAnchor="end" fill="#ffffff" fontSize="8" fontWeight="bold">
              {session.minutes}min
            </text>

            {/* Intensity dots */}
            <g>
              {Array.from({ length: 5 }).map((_, di) => (
                <circle
                  key={di}
                  cx={labelW + barMaxW + 10 + di * 9}
                  cy={y + barH / 2}
                  r="3"
                  fill={di < session.intensity ? intensityColor : COLORS.muted}
                  fillOpacity={di < session.intensity ? 0.8 : 0.3}
                />
              ))}
            </g>
          </g>
        );
      })}

      {/* Legend */}
      <g>
        <circle cx={labelW + barMaxW + 12} cy={svgH - 10} r="3" fill={COLORS.green} />
        <text x={labelW + barMaxW + 20} y={svgH - 7} fill={COLORS.textMuted} fontSize="6">Low</text>
        <circle cx={labelW + barMaxW + 38} cy={svgH - 10} r="3" fill={COLORS.orange} />
        <text x={labelW + barMaxW + 46} y={svgH - 7} fill={COLORS.textMuted} fontSize="6">Med</text>
        <circle cx={labelW + barMaxW + 64} cy={svgH - 10} r="3" fill={COLORS.red} />
        <text x={labelW + barMaxW + 72} y={svgH - 7} fill={COLORS.textMuted} fontSize="6">High</text>
      </g>
    </svg>
  );
}

// SVG 12: Comeback Readiness Hex Radar
function ComebackReadinessRadarSVG(): React.JSX.Element {
  const cx = 130;
  const cy = 120;
  const maxR = 90;
  const axes = [
    { label: 'Strength', value: 65 },
    { label: 'Flexibility', value: 72 },
    { label: 'Endurance', value: 58 },
    { label: 'Speed', value: 45 },
    { label: 'Agility', value: 52 },
    { label: 'Mental', value: 78 },
  ];
  const n = axes.length;

  const getPoint = (index: number, r: number) => {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Grid hexagons
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Value polygon
  const valuePoints = axes.map((axis, i) => {
    const p = getPoint(i, (axis.value / 100) * maxR);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 260 240" className="w-full h-auto">
      {/* Grid hexagons */}
      {gridLevels.map((level, li) => {
        const points = Array.from({ length: n }).map((_, i) => {
          const p = getPoint(i, maxR * level);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon key={li} points={points} fill="none" stroke={COLORS.border} strokeWidth="0.8" />
        );
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.muted} strokeWidth="0.5" />;
      })}

      {/* Value polygon */}
      <polygon points={valuePoints} fill={COLORS.blue} fillOpacity="0.15" stroke={COLORS.blue} strokeWidth="2" />

      {/* Data points and labels */}
      {axes.map((axis, i) => {
        const p = getPoint(i, (axis.value / 100) * maxR);
        const labelP = getPoint(i, maxR + 16);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={COLORS.blue} stroke={COLORS.card} strokeWidth="2" />
            <text x={labelP.x} y={labelP.y + 3} textAnchor="middle" fill={COLORS.textPrimary} fontSize="8">
              {axis.label}
            </text>
            <text x={labelP.x} y={labelP.y + 13} textAnchor="middle" fill={getRiskColor(100 - axis.value)} fontSize="7" fontWeight="bold">
              {axis.value}%
            </text>
          </g>
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy + 3} textAnchor="middle" fill={COLORS.textPrimary} fontSize="10" fontWeight="bold">
        Readiness
      </text>
    </svg>
  );
}

// SVG 13: Prevention Effectiveness Bars
function PreventionEffectivenessBarsSVG(): React.JSX.Element {
  const barH = 20;
  const gap = 34;
  const labelW = 80;
  const barMaxW = 160;
  const svgW = 310;
  const svgH = gap * PREVENTION_STRATEGIES.length + 35;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {PREVENTION_STRATEGIES.map((strategy, i) => {
        const y = 8 + i * gap;
        const scoreW = (strategy.score / 100) * barMaxW;
        const targetW = (strategy.target / 100) * barMaxW;
        const color = strategy.score >= strategy.target * 0.9 ? COLORS.green : strategy.score >= strategy.target * 0.7 ? COLORS.amber : COLORS.red;

        return (
          <g key={i}>
            <text x={labelW - 5} y={y + barH / 2 + 3} textAnchor="end" fill={COLORS.textPrimary} fontSize="9">
              {strategy.name}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill={COLORS.border} />
            {/* Target line */}
            <line x1={labelW + targetW} y1={y - 2} x2={labelW + targetW} y2={y + barH + 2} stroke={COLORS.green} strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Score bar */}
            <rect x={labelW} y={y} width={scoreW} height={barH} rx="3" fill={color} fillOpacity="0.8" />
            <text x={labelW + scoreW - 5} y={y + barH / 2 + 3} textAnchor="end" fill="#ffffff" fontSize="8" fontWeight="bold">
              {strategy.score}
            </text>
            <text x={labelW + targetW} y={y - 4} textAnchor="middle" fill={COLORS.green} fontSize="6">
              Target: {strategy.target}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g>
        <line x1={labelW + 30} y1={svgH - 8} x2={labelW + 45} y2={svgH - 8} stroke={COLORS.green} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x={labelW + 48} y={svgH - 5} fill={COLORS.textMuted} fontSize="7">Target</text>
      </g>
    </svg>
  );
}

// SVG 14: Injury-Free Streak Ring
function InjuryFreeStreakRingSVG({ streak }: { streak: number }): React.JSX.Element {
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const maxStreak = 100;
  const progress = Math.min(1, streak / maxStreak);
  const offset = circumference - progress * circumference;

  const color = streak >= 50 ? COLORS.green : streak >= 25 ? COLORS.amber : COLORS.orange;

  const milestones = [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={COLORS.border} strokeWidth={strokeWidth} />

      {/* Milestone markers on background */}
      {milestones.map((m, i) => {
        const mAngle = -Math.PI / 2 + (m.value / maxStreak) * 2 * Math.PI;
        const mx = size / 2 + radius * Math.cos(mAngle);
        const my = size / 2 + radius * Math.sin(mAngle);
        const reached = streak >= m.value;
        return (
          <g key={i}>
            <circle cx={mx} cy={my} r="3" fill={reached ? COLORS.green : COLORS.muted} stroke={COLORS.card} strokeWidth="1" />
          </g>
        );
      })}

      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />

      {/* Center text */}
      <text x={size / 2} y={size / 2 + 2} textAnchor="middle" fill={color} fontSize="24" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {streak}
      </text>
    </svg>
  );
}

// SVG 15: Season Injury History Timeline
function SeasonInjuryHistorySVG(): React.JSX.Element {
  const svgW = 280;
  const svgH = 160;
  const padX = 35;
  const padY = 20;
  const lineX = padX + 10;
  const lineStartY = padY;
  const lineEndY = svgH - padY;
  const totalWeeks = 38;

  const typeColors: Record<string, string> = {
    minor: COLORS.amber,
    moderate: COLORS.orange,
    severe: COLORS.red,
  };

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Title */}
      <text x={svgW / 2} y={14} textAnchor="middle" fill={COLORS.textMuted} fontSize="8" fontWeight="bold">
        Season Injury Timeline (38 Weeks)
      </text>

      {/* Vertical timeline line */}
      <line x1={lineX} y1={lineStartY} x2={lineX} y2={lineEndY} stroke={COLORS.muted} strokeWidth="1.5" />

      {/* Week markers every 4 weeks */}
      {Array.from({ length: 10 }).map((_, i) => {
        const week = i * 4 + 1;
        const y = lineStartY + ((week - 1) / totalWeeks) * (lineEndY - lineStartY);
        return (
          <g key={i}>
            <line x1={lineX - 4} y1={y} x2={lineX + 4} y2={y} stroke={COLORS.muted} strokeWidth="1" />
            <text x={lineX - 8} y={y + 3} textAnchor="end" fill={COLORS.textMuted} fontSize="6">W{week}</text>
          </g>
        );
      })}

      {/* Injury events */}
      {SEASON_INJURY_HISTORY.map((injury, i) => {
        const y = lineStartY + ((injury.week - 1) / totalWeeks) * (lineEndY - lineStartY);
        const color = typeColors[injury.type] || COLORS.textMuted;
        const dotR = injury.type === 'severe' ? 7 : injury.type === 'moderate' ? 5.5 : 4;
        return (
          <g key={i}>
            <circle cx={lineX} cy={y} r={dotR} fill={color} fillOpacity="0.85" stroke={COLORS.card} strokeWidth="2" />
            <text x={lineX + 14} y={y - 2} fill={COLORS.textPrimary} fontSize="8" fontWeight="bold">
              W{injury.week}: {injury.body}
            </text>
            <text x={lineX + 14} y={y + 8} fill={color} fontSize="7">
              {injury.type}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {Object.entries(typeColors).map(([type, color]) => (
        <g key={type}>
          <circle cx={svgW - 80 + Object.keys(typeColors).indexOf(type) * 55} cy={svgH - 5} r="3" fill={color} />
          <text x={svgW - 74 + Object.keys(typeColors).indexOf(type) * 55} y={svgH - 2} fill={COLORS.textMuted} fontSize="6">
            {type}
          </text>
        </g>
      ))}
    </svg>
  );
}

// SVG 16: Prevention Adherence Gauge
function PreventionAdherenceGaugeSVG({ score }: { score: number }): React.JSX.Element {
  const cx = 120;
  const cy = 100;
  const radius = 75;
  const startAngle = 180;
  const sweepAngle = (score / 100) * 180;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + 180) * Math.PI) / 180;

  const bgX1 = cx + radius * Math.cos(startRad);
  const bgY1 = cy + radius * Math.sin(startRad);
  const bgX2 = cx + radius * Math.cos(endRad);
  const bgY2 = cy + radius * Math.sin(endRad);

  const valAngleRad = ((startAngle + sweepAngle) * Math.PI) / 180;
  const valX = cx + radius * Math.cos(valAngleRad);
  const valY = cy + radius * Math.sin(valAngleRad);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const color = score >= 75 ? COLORS.green : score >= 50 ? COLORS.amber : COLORS.red;

  return (
    <svg viewBox="0 0 240 120" className="w-full h-auto">
      {/* Background arc */}
      <path
        d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`}
        fill="none"
        stroke={COLORS.border}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Value arc */}
      <path
        d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 ${largeArc} 1 ${valX} ${valY}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Scale markers */}
      {[0, 25, 50, 75, 100].map(val => {
        const angle = ((startAngle + (val / 100) * 180) * Math.PI) / 180;
        const tx = cx + (radius + 12) * Math.cos(angle);
        const ty = cy + (radius + 12) * Math.sin(angle);
        return (
          <text key={val} x={tx} y={ty + 3} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
            {val}
          </text>
        );
      })}

      {/* Center value */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={COLORS.textMuted} fontSize="9">
        Adherence Score
      </text>
    </svg>
  );
}

// ============================================================
// Tab Content Components
// ============================================================

// Tab 1: Risk Assessment
function RiskAssessmentTab(): React.JSX.Element {
  const overallRisk = getOverallRisk();
  const riskColor = getRiskColor(overallRisk);
  const riskLabel = getRiskLabel(overallRisk);

  const highRiskParts = BODY_PARTS.filter(bp => bp.risk >= 50).length;

  return (
    <div className="space-y-4">
      {/* Overall Risk Card */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${riskColor}15` }}
            >
              <Shield className="h-6 w-6" style={{ color: riskColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#8b949e] uppercase tracking-wide">Overall Injury Risk</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold" style={{ color: riskColor }}>
                  {Math.round(overallRisk)}%
                </span>
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
                >
                  {riskLabel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8b949e]">High Risk Areas</p>
              <p className="text-lg font-bold" style={{ color: COLORS.orange }}>{highRiskParts}</p>
            </div>
          </div>
          {/* Risk bar */}
          <div className="mt-3 h-2 bg-[#21262d] rounded-md overflow-hidden">
            <div
              className="h-full rounded-md"
              style={{ width: `${overallRisk}%`, backgroundColor: riskColor }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Body Part Risk Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {BODY_PARTS.map((bp) => {
          const bpColor = getRiskColor(bp.risk);
          const trendIcon = bp.trend === 'up'
            ? <TrendingUp className="h-3 w-3" style={{ color: COLORS.red }} />
            : bp.trend === 'down'
              ? <TrendingDown className="h-3 w-3" style={{ color: COLORS.green }} />
              : <Activity className="h-3 w-3" style={{ color: COLORS.textMuted }} />;
          return (
            <Card key={bp.name} className="bg-[#161b22] border-[#21262d]">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{bp.name}</span>
                  {trendIcon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ color: bpColor }}>{bp.risk}%</span>
                  <div className="flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${bp.risk}%`, backgroundColor: bpColor }}
                    />
                  </div>
                </div>
                {bp.injuries > 0 && (
                  <p className="text-[10px] text-[#8b949e] mt-1">{bp.injuries} previous injur{bp.injuries !== 1 ? 'ies' : 'y'}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Factor Cards */}
      <div className="grid grid-cols-1 gap-3">
        {RISK_FACTORS.map((rf) => {
          const rfColor = getRiskColor(rf.value);
          return (
            <Card key={rf.name} className="bg-[#161b22] border-[#21262d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${rfColor}15`, color: rfColor }}
                  >
                    {rf.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#c9d1d9]">{rf.name}</span>
                      <span className="text-sm font-bold" style={{ color: rfColor }}>{rf.value}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md"
                          style={{ width: `${rf.value}%`, backgroundColor: rfColor }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8b949e]">Avg: {rf.seasonAvg}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SVG Charts */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Body Risk Map</span>
          </div>
          <BodyRiskMapSVG />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Distribution</span>
            </div>
            <RiskDistributionDonutSVG />
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {BODY_PARTS.filter(bp => ['Hamstring', 'Knee', 'Ankle', 'Groin', 'Back'].includes(bp.name)).map(bp => (
                <div key={bp.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRiskColor(bp.risk) }} />
                  <span className="text-[9px] text-[#8b949e]">{bp.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Risk Trend</span>
            </div>
            <InjuryRiskTrendSVG />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Risk Factor Comparison</span>
          </div>
          <RiskFactorComparisonBarsSVG />
        </CardContent>
      </Card>
    </div>
  );
}

// Tab 2: Match Simulation
function MatchSimulationTab(): React.JSX.Element {
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setResult(simulateMatch(selectedScenario));
      setIsSimulating(false);
    }, 1500);
  };

  const scenarioConfig = SCENARIOS.find(s => s.id === selectedScenario);

  return (
    <div className="space-y-4">
      {/* Scenario Selection */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Select Scenario</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => { setSelectedScenario(scenario.id); setResult(null); }}
                className="p-3 rounded-lg border text-left"
                style={{
                  backgroundColor: selectedScenario === scenario.id ? `${COLORS.blue}15` : 'transparent',
                  borderColor: selectedScenario === scenario.id ? COLORS.blue : COLORS.border,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: selectedScenario === scenario.id ? COLORS.blue : COLORS.textPrimary }}>
                  {scenario.label}
                </p>
                <p className="text-[10px] text-[#8b949e] mt-0.5">{scenario.description}</p>
              </button>
            ))}
          </div>

          {/* Simulate Button */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: isSimulating ? COLORS.muted : COLORS.blue,
              color: '#ffffff',
              opacity: isSimulating ? 0.6 : 1,
            }}
          >
            {isSimulating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Simulation
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {result && (
        <>
          {/* Risk Gauge */}
          <Card className="bg-[#161b22] border-[#21262d]">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[#8b949e]" />
                <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Simulation Risk Gauge</span>
              </div>
              <SimulationRiskGaugeSVG value={Math.round(result.fatiguePeak)} />
            </CardContent>
          </Card>

          {/* Match Stats */}
          <Card className="bg-[#161b22] border-[#21262d]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
                <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
                  Match Stats — {scenarioConfig?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Duration', value: `${result.duration} min`, color: COLORS.blue },
                  { label: 'Tackles', value: result.tackles.toString(), color: COLORS.orange },
                  { label: 'Sprints', value: result.sprints.toString(), color: COLORS.green },
                  { label: 'Distance', value: `${result.distance} km`, color: COLORS.purple },
                  { label: 'Avg Speed', value: `${result.avgSpeed} km/h`, color: COLORS.lightBlue },
                  { label: 'Fatigue Peak', value: `${result.fatiguePeak}%`, color: COLORS.red },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg bg-[#0d1117]">
                    <span className="text-xs text-[#8b949e]">{stat.label}</span>
                    <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outcome Probabilities */}
          <Card className="bg-[#161b22] border-[#21262d]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
                <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Outcome Probabilities</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'No Injury', value: result.noInjury, color: COLORS.green, icon: <CheckCircle2 className="h-4 w-4" /> },
                  { label: 'Minor Injury', value: result.minor, color: COLORS.amber, icon: <AlertTriangle className="h-4 w-4" /> },
                  { label: 'Moderate Injury', value: result.moderate, color: COLORS.orange, icon: <AlertTriangle className="h-4 w-4" /> },
                  { label: 'Severe Injury', value: result.severe, color: COLORS.red, icon: <XCircle className="h-4 w-4" /> },
                ].map(outcome => (
                  <div key={outcome.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: outcome.color }}>{outcome.icon}</span>
                        <span className="text-xs text-[#c9d1d9]">{outcome.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: outcome.color }}>{outcome.value}%</span>
                    </div>
                    <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md"
                        style={{ width: `${outcome.value}%`, backgroundColor: outcome.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fatigue vs Performance Chart */}
          <Card className="bg-[#161b22] border-[#21262d]">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
                <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Fatigue vs Performance</span>
              </div>
              <FatiguePerformanceSVG scenario={selectedScenario} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-[#161b22] border-[#21262d]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Challenge Intensity</span>
                </div>
                <ChallengeIntensityBarsSVG />
              </CardContent>
            </Card>

            <Card className="bg-[#161b22] border-[#21262d]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Footprints className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Zone Risk</span>
                </div>
                <PitchZoneHeatmapSVG />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* No results placeholder */}
      {!result && !isSimulating && (
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-8 text-center">
            <Play className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-sm text-[#8b949e]">Select a scenario and run the simulation</p>
            <p className="text-xs text-[#484f58] mt-1">
              The simulator will predict injury probabilities based on the selected match intensity
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Tab 3: Recovery Planning
function RecoveryPlanningTab(): React.JSX.Element {
  const injuryStatus = 'Hamstring Strain — Moderate';
  const recoveryProgress = 55;
  const weeksPassed = 3;
  const totalWeeks = 6;

  return (
    <div className="space-y-4">
      {/* Current Injury Status */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Current Injury Status</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${COLORS.orange}15` }}
            >
              <AlertTriangle className="h-6 w-6" style={{ color: COLORS.orange }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: COLORS.orange }}>{injuryStatus}</p>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Week {weeksPassed} of {totalWeeks} &middot; {totalWeeks - weeksPassed} weeks remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Progress Ring */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Recovery Progress</span>
          </div>
          <div className="flex justify-center">
            <div className="w-36">
              <RecoveryProgressRingSVG progress={recoveryProgress} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 rounded-lg bg-[#0d1117]">
              <p className="text-xs text-[#8b949e]">Weeks Done</p>
              <p className="text-lg font-bold" style={{ color: COLORS.green }}>{weeksPassed}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#0d1117]">
              <p className="text-xs text-[#8b949e]">Remaining</p>
              <p className="text-lg font-bold" style={{ color: COLORS.orange }}>{totalWeeks - weeksPassed}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#0d1117]">
              <p className="text-xs text-[#8b949e]">Est. Return</p>
              <p className="text-lg font-bold" style={{ color: COLORS.blue }}>W14</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Timeline */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Recovery Timeline</span>
          </div>
          <RecoveryTimelineChartSVG />

          {/* Phase Details */}
          <div className="space-y-2">
            {RECOVERY_PHASES.map((phase, i) => {
              const statusColor = phase.status === 'completed' ? COLORS.green : phase.status === 'current' ? COLORS.orange : COLORS.muted;
              const statusIcon = phase.status === 'completed'
                ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: COLORS.green }} />
                : phase.status === 'current'
                  ? <RefreshCw className="h-3.5 w-3.5" style={{ color: COLORS.orange }} />
                  : <Clock className="h-3.5 w-3.5" style={{ color: COLORS.muted }} />;

              return (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ borderColor: `${statusColor}30`, backgroundColor: `${statusColor}05` }}>
                  <div className="mt-0.5">{statusIcon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#c9d1d9]">{phase.name}</span>
                      {phase.status === 'current' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${COLORS.orange}20`, color: COLORS.orange }}>
                          {phase.progress}%
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">{phase.description}</p>
                    {phase.status === 'current' && (
                      <div className="mt-1.5 h-1 bg-[#21262d] rounded-md overflow-hidden">
                        <div className="h-full rounded-md" style={{ width: `${phase.progress}%`, backgroundColor: COLORS.orange }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Physio Recommendations */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Physio Recommendations</span>
          </div>
          <div className="space-y-2">
            {PHYSIO_RECOMMENDATIONS.map((rec, i) => {
              const priorityColor = rec.priority === 'High' ? COLORS.red : rec.priority === 'Medium' ? COLORS.amber : COLORS.green;
              return (
                <div key={i} className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#c9d1d9]">{rec.title}</span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-[8px] text-[#484f58]">{rec.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Session Plan Bars */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Session Plan</span>
          </div>
          <PhysioSessionPlanBarsSVG />
        </CardContent>
      </Card>

      {/* Comeback Readiness Radar */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Comeback Readiness</span>
          </div>
          <ComebackReadinessRadarSVG />
        </CardContent>
      </Card>
    </div>
  );
}

// Tab 4: Prevention Dashboard
function PreventionDashboardTab(): React.JSX.Element {
  const preventionScore = getPreventionScore();
  const scoreColor = preventionScore >= 75 ? COLORS.green : preventionScore >= 50 ? COLORS.amber : COLORS.red;
  const injuryFreeStreak = 32;

  return (
    <div className="space-y-4">
      {/* Prevention Score */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${scoreColor}15` }}
            >
              <Shield className="h-6 w-6" style={{ color: scoreColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#8b949e] uppercase tracking-wide">Prevention Score</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                  {Math.round(preventionScore)}
                </span>
                <span className="text-sm text-[#8b949e]">/100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8b949e]">Rating</p>
              <p className="text-sm font-bold" style={{ color: scoreColor }}>
                {preventionScore >= 80 ? 'Excellent' : preventionScore >= 60 ? 'Good' : preventionScore >= 40 ? 'Fair' : 'Needs Work'}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-[#21262d] rounded-md overflow-hidden">
            <div className="h-full rounded-md" style={{ width: `${preventionScore}%`, backgroundColor: scoreColor }} />
          </div>
        </CardContent>
      </Card>

      {/* Strategy Cards */}
      <div className="space-y-2">
        {PREVENTION_STRATEGIES.map((strategy, i) => {
          const gap = strategy.target - strategy.score;
          const gapColor = gap <= 10 ? COLORS.green : gap <= 25 ? COLORS.amber : COLORS.red;
          return (
            <Card key={strategy.name} className="bg-[#161b22] border-[#21262d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${COLORS.blue}15`, color: COLORS.blue }}
                  >
                    {strategy.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#c9d1d9]">{strategy.name}</span>
                      <span className="text-sm font-bold" style={{ color: getRiskColor(100 - strategy.score) }}>{strategy.score}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                        <div className="h-full rounded-md" style={{ width: `${strategy.score}%`, backgroundColor: getRiskColor(100 - strategy.score) }} />
                      </div>
                      <span className="text-[10px]" style={{ color: gapColor }}>
                        {gap > 0 ? `-${gap} to target` : 'Target met'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#484f58] mt-0.5">{strategy.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Personalized Tips */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Personalized Tips</span>
          </div>
          <div className="space-y-2">
            {PREVENTION_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${COLORS.purple}15`, color: COLORS.purple }}
                >
                  {tip.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#c9d1d9]">{tip.title}</p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prevention Effectiveness Bars */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Prevention Effectiveness</span>
          </div>
          <PreventionEffectivenessBarsSVG />
        </CardContent>
      </Card>

      {/* Injury-Free Streak + Adherence Gauge */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Injury-Free Streak</span>
            </div>
            <div className="flex justify-center">
              <div className="w-28">
                <InjuryFreeStreakRingSVG streak={injuryFreeStreak} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: COLORS.green }}>
                {injuryFreeStreak} days
              </p>
              <p className="text-[10px] text-[#8b949e]">
                Next milestone: {injuryFreeStreak < 50 ? '50 days' : injuryFreeStreak < 100 ? '100 days' : '200 days'}
              </p>
            </div>
            {/* Milestone indicators */}
            <div className="flex justify-center gap-3">
              {[
                { val: 10, reached: injuryFreeStreak >= 10 },
                { val: 25, reached: injuryFreeStreak >= 25 },
                { val: 50, reached: injuryFreeStreak >= 50 },
                { val: 100, reached: injuryFreeStreak >= 100 },
              ].map(m => (
                <div key={m.val} className="flex flex-col items-center gap-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: m.reached ? COLORS.green : COLORS.muted, opacity: m.reached ? 1 : 0.3 }} />
                  <span className="text-[8px]" style={{ color: m.reached ? COLORS.green : COLORS.muted }}>
                    {m.val}d
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Adherence</span>
            </div>
            <PreventionAdherenceGaugeSVG score={preventionScore} />
          </CardContent>
        </Card>
      </div>

      {/* Season Injury History */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Season Injury History</span>
            </div>
            <span className="text-[10px] text-[#8b949e]">{SEASON_INJURY_HISTORY.length} injuries</span>
          </div>
          <SeasonInjuryHistorySVG />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function InjurySimulator() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#21262d]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-[#c9d1d9]">Injury Simulator</h1>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-0 -mb-px">
            {TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2"
                style={{
                  color: activeTab === i ? '#34d399' : COLORS.textMuted,
                  borderColor: activeTab === i ? '#34d399' : 'transparent',
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {activeTab === 0 && <RiskAssessmentTab />}
        {activeTab === 1 && <MatchSimulationTab />}
        {activeTab === 2 && <RecoveryPlanningTab />}
        {activeTab === 3 && <PreventionDashboardTab />}
      </main>
    </div>
  );
}
