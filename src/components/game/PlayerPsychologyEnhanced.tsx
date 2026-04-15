'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Heart, Target, Zap, Shield, Flame, Eye, Wind,
  Activity, TrendingUp, Award, BookOpen, Clock, Star,
  AlertTriangle, Sparkles, Sun, Moon, Compass, Users, GitBranch, Lightbulb
} from 'lucide-react';

// ============================================================
// Design Tokens
// ============================================================

const TOKENS = {
  accent: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  muted: '#666666',
  bg: '#0d1117',
  card: '#161b22',
  text: '#c9d1d9',
  secondary: '#8b949e',
  border: '#30363d',
} as const;

// ============================================================
// Seeded Random Helpers
// ============================================================

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================
// Data Generation Helpers
// ============================================================

interface RadarAxis {
  label: string;
  value: number;
}

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface ScatterPoint {
  x: number;
  y: number;
  color: string;
  label: string;
}

interface TimelineNode {
  label: string;
  value: number;
  color: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface TrendPoint {
  label: string;
  value: number;
}

function generateTab1Data(rng: () => number): {
  radarAxes: RadarAxis[];
  pressureScore: number;
  confidenceTrend: TrendPoint[];
} {
  const radarAxes: RadarAxis[] = [
    { label: 'Focus', value: Math.round(40 + rng() * 55) },
    { label: 'Composure', value: Math.round(35 + rng() * 60) },
    { label: 'Determination', value: Math.round(45 + rng() * 50) },
    { label: 'Vision', value: Math.round(30 + rng() * 55) },
    { label: 'Leadership', value: Math.round(25 + rng() * 60) },
  ];

  const pressureScore = Math.round(20 + rng() * 75);

  const confidenceTrend: TrendPoint[] = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'].reduce<TrendPoint[]>((acc, label) => {
    const prevVal = acc.length > 0 ? acc[acc.length - 1].value : 50;
    const value = Math.max(10, Math.min(95, Math.round(prevVal + (rng() - 0.42) * 18)));
    return [...acc, { label, value }];
  }, []);

  return { radarAxes, pressureScore, confidenceTrend };
}

function generateTab2Data(rng: () => number): {
  stressSegments: DonutSegment[];
  copingBars: BarItem[];
  scatterPoints: ScatterPoint[];
} {
  const rawVals = [0, 1, 2, 3].map(() => Math.round(10 + rng() * 40));
  const total = rawVals.reduce((s, v) => s + v, 0);
  const stressSegments: DonutSegment[] = [
    { label: 'Match Anxiety', value: Math.round((rawVals[0] / total) * 100), color: TOKENS.accent },
    { label: 'Training Load', value: Math.round((rawVals[1] / total) * 100), color: TOKENS.lime },
    { label: 'Media Pressure', value: Math.round((rawVals[2] / total) * 100), color: TOKENS.cyan },
    { label: 'Personal', value: 100 - Math.round((rawVals[0] / total) * 100) - Math.round((rawVals[1] / total) * 100) - Math.round((rawVals[2] / total) * 100), color: TOKENS.muted },
  ];

  const copingBars: BarItem[] = [
    { label: 'Meditation', value: Math.round(50 + rng() * 45), color: TOKENS.lime },
    { label: 'Visualization', value: Math.round(40 + rng() * 50), color: TOKENS.cyan },
    { label: 'Breathing', value: Math.round(55 + rng() * 40), color: TOKENS.accent },
    { label: 'Social Support', value: Math.round(30 + rng() * 50), color: TOKENS.muted },
    { label: 'Pre-Match Routine', value: Math.round(60 + rng() * 35), color: TOKENS.lime },
  ];

  const scatterColors = [TOKENS.accent, TOKENS.cyan];
  const scatterPoints: ScatterPoint[] = Array.from({ length: 8 }, (_, i) => ({
    x: Math.round(10 + rng() * 80),
    y: Math.round(3 + rng() * 7),
    color: scatterColors[i % 2],
    label: `M${i + 1}`,
  }));

  return { stressSegments, copingBars, scatterPoints };
}

function generateTab3Data(rng: () => number): {
  personalityAxes: RadarAxis[];
  temperamentNodes: TimelineNode[];
  teamRoleBars: BarItem[];
} {
  const personalityAxes: RadarAxis[] = [
    { label: 'Extraversion', value: Math.round(30 + rng() * 60) },
    { label: 'Agreeableness', value: Math.round(35 + rng() * 55) },
    { label: 'Conscientiousness', value: Math.round(40 + rng() * 50) },
    { label: 'Stability', value: Math.round(25 + rng() * 65) },
    { label: 'Openness', value: Math.round(30 + rng() * 55) },
  ];

  const tempColors = [TOKENS.lime, TOKENS.accent, TOKENS.muted, TOKENS.lime, TOKENS.accent, TOKENS.muted, TOKENS.lime, TOKENS.accent];
  const temperamentNodes: TimelineNode[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label, i) => ({
    label,
    value: Math.round(20 + rng() * 75),
    color: tempColors[i],
  }));

  const teamRoleBars: BarItem[] = [
    { label: 'Leader', value: Math.round(30 + rng() * 60), color: TOKENS.accent },
    { label: 'Team Player', value: Math.round(50 + rng() * 45), color: TOKENS.lime },
    { label: 'Mentor', value: Math.round(20 + rng() * 50), color: TOKENS.cyan },
    { label: 'Specialist', value: Math.round(35 + rng() * 55), color: TOKENS.muted },
    { label: 'Workhorse', value: Math.round(45 + rng() * 45), color: TOKENS.accent },
  ];

  return { personalityAxes, temperamentNodes, teamRoleBars };
}

function generateTab4Data(rng: () => number): {
  growthTrend: TrendPoint[];
  sessionAttendance: number;
  mindsetSegments: DonutSegment[];
} {
  const growthTrend: TrendPoint[] = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'].reduce<TrendPoint[]>((acc, label) => {
    const prevVal = acc.length > 0 ? acc[acc.length - 1].value : 30;
    const value = Math.max(10, Math.min(95, Math.round(prevVal + (rng() - 0.35) * 14)));
    return [...acc, { label, value }];
  }, []);

  const sessionAttendance = Math.round(55 + rng() * 40);

  const rawVals = [0, 1, 2, 3].map(() => Math.round(10 + rng() * 35));
  const total = rawVals.reduce((s, v) => s + v, 0);
  const mindsetSegments: DonutSegment[] = [
    { label: 'Growth', value: Math.round((rawVals[0] / total) * 100), color: TOKENS.lime },
    { label: 'Fixed', value: Math.round((rawVals[1] / total) * 100), color: TOKENS.accent },
    { label: 'Adaptive', value: Math.round((rawVals[2] / total) * 100), color: TOKENS.cyan },
    { label: 'Defensive', value: 100 - Math.round((rawVals[0] / total) * 100) - Math.round((rawVals[1] / total) * 100) - Math.round((rawVals[2] / total) * 100), color: TOKENS.muted },
  ];

  return { growthTrend, sessionAttendance, mindsetSegments };
}

// ============================================================
// SVG 1: MentalStateRadar (5-axis, #FF5500)
// ============================================================

function MentalStateRadar({ axes }: { axes: RadarAxis[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;
  const levels = 5;
  const numAxes = axes.length;
  const angleOffset = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / numAxes;

  const getPoint = (index: number, r: number) => {
    const angle = angleOffset + index * angleStep;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = Array.from({ length: levels }, (_, lvl) => {
    const r = (radius / levels) * (lvl + 1);
    const pts = Array.from({ length: numAxes }, (_, i) => getPoint(i, r));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return { d };
  });

  const valuePoints = axes.map((attr, i) => getPoint(i, (attr.value / 100) * radius));
  const valueD = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 260 }}>
      {gridLevels.map((level, i) => (
        <path key={i} d={level.d} fill="none" stroke={TOKENS.border} strokeWidth="0.5" opacity={i === gridLevels.length - 1 ? 0.6 : 0.3} />
      ))}
      {Array.from({ length: numAxes }, (_, i) => {
        const p = getPoint(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={TOKENS.border} strokeWidth="0.5" opacity={0.4} />;
      })}
      <motion.path d={valueD} fill={TOKENS.accent} fillOpacity={0.12} stroke={TOKENS.accent} strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      {valuePoints.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={4} fill={TOKENS.accent} stroke={TOKENS.bg} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }} />
      ))}
      {axes.map((attr, i) => {
        const labelR = radius + 20;
        const angle = angleOffset + i * angleStep;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text key={attr.label} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="10" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {attr.label}
          </text>
        );
      })}
      {axes.map((attr, i) => {
        const valR = radius + 32;
        const angle = angleOffset + i * angleStep;
        const x = cx + valR * Math.cos(angle);
        const y = cy + valR * Math.sin(angle);
        return (
          <text key={`val-${attr.label}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={TOKENS.accent} fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {attr.value}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 2: PressureHandlingGauge (semi-circular, #CCFF00)
// ============================================================

function PressureHandlingGauge({ score }: { score: number }) {
  const vw = 240;
  const vh = 140;
  const cx = vw / 2;
  const cy = vh - 20;
  const radius = 90;
  const sw = 14;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const scoreAngle = startAngle + (score / 100) * Math.PI;

  const trackPoints = Array.from({ length: 50 }, (_, i) => {
    const angle = startAngle + (i / 49) * Math.PI;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const trackD = trackPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const scoreSteps = Math.max(1, Math.round(score / 2));
  const scorePoints = Array.from({ length: scoreSteps }, (_, i) => {
    const angle = startAngle + (i / Math.max(1, scoreSteps - 1)) * (scoreAngle - startAngle);
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const scoreD = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const needleAngle = scoreAngle;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 240 }}>
      <motion.path d={trackD} fill="none" stroke={TOKENS.border} strokeWidth={sw} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
      <motion.path d={scoreD} fill="none" stroke={TOKENS.lime} strokeWidth={sw} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={TOKENS.lime} strokeWidth={2.5} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
      <circle cx={cx} cy={cy} r={5} fill={TOKENS.card} stroke={TOKENS.lime} strokeWidth={2} />
      <text x={cx} y={cy - 25} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="28" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">
        {score}
      </text>
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1">
        PRESSURE
      </text>
      <text x={30} y={vh - 6} textAnchor="middle" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">0</text>
      <text x={vw - 30} y={vh - 6} textAnchor="middle" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">100</text>
      {[0, 1, 2].map((i) => {
        const angle = startAngle + (i / 2) * Math.PI;
        const x1 = cx + (radius + 10) * Math.cos(angle);
        const y1 = cy + (radius + 10) * Math.sin(angle);
        const x2 = cx + (radius + 16) * Math.cos(angle);
        const y2 = cy + (radius + 16) * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={TOKENS.border} strokeWidth="1" />;
      })}
    </svg>
  );
}

// ============================================================
// SVG 3: ConfidenceTrendArea (8-pt, #00E5FF)
// ============================================================

function ConfidenceTrendArea({ data }: { data: TrendPoint[] }) {
  const vw = 300;
  const vh = 140;
  const padX = 30;
  const padY = 14;
  const chartW = vw - padX * 2;
  const chartH = vh - padY * 2;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    label: d.label,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${points[n - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <svg width={vw} height={vh + 20} viewBox={`0 0 ${vw} ${vh + 20}`} className="block" style={{ width: '100%', maxWidth: 300 }}>
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={padX - 6} y={y} textAnchor="end" dominantBaseline="central" fill={TOKENS.muted} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
          </g>
        );
      })}
      <motion.path d={areaStr} fill={TOKENS.cyan} fillOpacity={0.08} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d={lineStr} fill="none" stroke={TOKENS.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} />
      {points.map((p, i) => {
        const isLast = i === n - 1;
        const isMin = data[i].value === minVal;
        const isMax = data[i].value === maxVal;
        const showLabel = isLast || isMin || isMax;
        return (
          <g key={i}>
            <motion.circle cx={p.x} cy={p.y} r={isLast ? 4 : showLabel ? 3 : 2} fill={isMax ? TOKENS.lime : isMin ? TOKENS.accent : TOKENS.card} stroke={TOKENS.cyan} strokeWidth={isLast ? 2 : 1.5} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }} />
            {showLabel && (
              <text x={p.x} y={p.y - (isMax ? 8 : 10)} textAnchor="middle" fill={TOKENS.text} fontSize="8" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{p.value}</text>
            )}
            <text x={p.x} y={vh + 14} textAnchor="middle" fill={isLast ? TOKENS.text : TOKENS.muted} fontSize="7" fontWeight={isLast ? '600' : '400'} fontFamily="ui-sans-serif, system-ui, sans-serif">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 4: StressLevelDonut (4-seg .reduce(), #FF5500/#CCFF00/#00E5FF/#666)
// ============================================================

function StressLevelDonut({ segments }: { segments: DonutSegment[] }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 70;
  const innerR = 45;
  const angleOffset = -Math.PI / 2;

  const arcs = segments.reduce<{ items: Array<{ d: string; color: string; midAngle: number }>; runningAngle: number }>((carry, seg) => {
    const sliceAngle = (seg.value / 100) * 2 * Math.PI;
    const startAngle = carry.runningAngle;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    const midAngle = (startAngle + endAngle) / 2;

    return {
      items: [...carry.items, { d, color: seg.color, midAngle }],
      runningAngle: endAngle,
    };
  }, { items: [], runningAngle: angleOffset }).items;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 180 }}>
      {arcs.map((arc, i) => (
        <motion.path key={i} d={arc.d} fill={arc.color} fillOpacity={0.75} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.1 }} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 1} fill={TOKENS.card} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="13" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">Stress</text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">Sources</text>
      {segments.map((seg, i) => {
        const lx = cx + (outerR + 18) * Math.cos(arcs[i].midAngle);
        const ly = cy + (outerR + 18) * Math.sin(arcs[i].midAngle);
        return (
          <g key={seg.label}>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={seg.color} fontSize="7" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">{seg.value}%</text>
          </g>
        );
      })}
      {segments.map((seg, i) => (
        <g key={`legend-${seg.label}`}>
          <rect x={6} y={size - 58 + i * 14} width={8} height={8} rx={2} fill={seg.color} />
          <text x={18} y={size - 52 + i * 14} dominantBaseline="central" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">{seg.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 5: CopingMechanismBars (5 bars, alternating colors)
// ============================================================

function CopingMechanismBars({ bars }: { bars: BarItem[] }) {
  const vw = 300;
  const vh = 180;
  const padX = 90;
  const padY = 14;
  const chartW = vw - padX - 16;
  const chartH = vh - padY * 2;
  const barH = 22;
  const gap = 8;
  const n = bars.length;
  const totalBarSpace = n * barH + (n - 1) * gap;
  const startY = padY + (chartH - totalBarSpace) / 2;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 300 }}>
      {[0, 25, 50, 75, 100].map((val) => {
        const x = padX + (val / 100) * chartW;
        return (
          <g key={val}>
            <line x1={x} y1={padY} x2={x} y2={padY + chartH} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="2 2" />
            <text x={x} y={padY + chartH + 12} textAnchor="middle" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
          </g>
        );
      })}
      {bars.map((bar, i) => {
        const barY = startY + i * (barH + gap);
        const barW = (bar.value / 100) * chartW;
        return (
          <g key={i}>
            <rect x={padX} y={barY} width={chartW} height={barH} rx={3} fill={TOKENS.border} fillOpacity={0.2} />
            <motion.rect x={padX} y={barY} width={barW} height={barH} rx={3} fill={bar.color} fillOpacity={0.7} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }} />
            <text x={padX + barW - 6} y={barY + barH / 2} textAnchor="end" dominantBaseline="central" fill={TOKENS.bg} fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{bar.value}</text>
            <text x={padX - 6} y={barY + barH / 2} textAnchor="end" dominantBaseline="central" fill={TOKENS.text} fontSize="9" fontWeight="500" fontFamily="ui-sans-serif, system-ui, sans-serif">{bar.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 6: StressVsPerformanceScatter (8 dots, #FF5500/#00E5FF)
// ============================================================

function StressVsPerformanceScatter({ points }: { points: ScatterPoint[] }) {
  const vw = 280;
  const vh = 200;
  const padX = 35;
  const padY = 20;
  const chartW = vw - padX - 16;
  const chartH = vh - padY * 2;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      <text x={padX + chartW / 2} y={12} textAnchor="middle" fill={TOKENS.secondary} fontSize="9" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">Stress vs Performance</text>
      {[0, 25, 50, 75, 100].map((val) => {
        const x = padX + (val / 100) * chartW;
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <line x1={x} y1={padY} x2={x} y2={padY + chartH} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="2 2" />
            <text x={x} y={padY + chartH + 14} textAnchor="middle" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
            <text x={padX - 6} y={y} textAnchor="end" dominantBaseline="central" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const px = padX + (p.x / 100) * chartW;
        const py = padY + chartH - (p.y / 100) * chartH;
        return (
          <g key={i}>
            <motion.circle cx={px} cy={py} r={6} fill={p.color} fillOpacity={0.25} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }} />
            <motion.circle cx={px} cy={py} r={3.5} fill={p.color} stroke={TOKENS.card} strokeWidth={1.5} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.06 }} />
            <text x={px} y={py - 9} textAnchor="middle" fill={TOKENS.secondary} fontSize="6" fontFamily="ui-sans-serif, system-ui, sans-serif">{p.label}</text>
          </g>
        );
      })}
      <text x={padX + chartW / 2} y={vh - 2} textAnchor="middle" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Stress Level</text>
      <text x={8} y={padY + chartH / 2} textAnchor="middle" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ writingMode: 'vertical-lr' }}>Rating</text>
      <rect x={vw - 70} y={padY + 2} width={6} height={6} rx={2} fill={TOKENS.accent} />
      <text x={vw - 60} y={padY + 6} dominantBaseline="central" fill={TOKENS.secondary} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">High Stress</text>
      <rect x={vw - 70} y={padY + 16} width={6} height={6} rx={2} fill={TOKENS.cyan} />
      <text x={vw - 60} y={padY + 20} dominantBaseline="central" fill={TOKENS.secondary} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Low Stress</text>
    </svg>
  );
}

// ============================================================
// SVG 7: PersonalityRadar (5-axis, #CCFF00)
// ============================================================

function PersonalityRadar({ axes }: { axes: RadarAxis[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 95;
  const levels = 5;
  const numAxes = axes.length;
  const angleOffset = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / numAxes;

  const getPoint = (index: number, r: number) => {
    const angle = angleOffset + index * angleStep;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = Array.from({ length: levels }, (_, lvl) => {
    const r = (radius / levels) * (lvl + 1);
    const pts = Array.from({ length: numAxes }, (_, i) => getPoint(i, r));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return { d };
  });

  const valuePoints = axes.map((attr, i) => getPoint(i, (attr.value / 100) * radius));
  const valueD = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 260 }}>
      {gridLevels.map((level, i) => (
        <path key={i} d={level.d} fill="none" stroke={TOKENS.border} strokeWidth="0.5" opacity={i === gridLevels.length - 1 ? 0.6 : 0.3} />
      ))}
      {Array.from({ length: numAxes }, (_, i) => {
        const p = getPoint(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={TOKENS.border} strokeWidth="0.5" opacity={0.4} />;
      })}
      <motion.path d={valueD} fill={TOKENS.lime} fillOpacity={0.1} stroke={TOKENS.lime} strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      {valuePoints.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={4} fill={TOKENS.lime} stroke={TOKENS.bg} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }} />
      ))}
      {axes.map((attr, i) => {
        const labelR = radius + 20;
        const angle = angleOffset + i * angleStep;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text key={attr.label} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="10" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">{attr.label}</text>
        );
      })}
      {axes.map((attr, i) => {
        const valR = radius + 32;
        const angle = angleOffset + i * angleStep;
        const x = cx + valR * Math.cos(angle);
        const y = cy + valR * Math.sin(angle);
        return (
          <text key={`val-${attr.label}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={TOKENS.lime} fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{attr.value}</text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 8: TemperamentTimeline (8-node, #CCFF00/#FF5500/#666)
// ============================================================

function TemperamentTimeline({ nodes }: { nodes: TimelineNode[] }) {
  const vw = 320;
  const vh = 180;
  const padX = 30;
  const padY = 40;
  const chartW = vw - padX * 2;
  const chartH = vh - padY - 30;
  const n = nodes.length;

  const points = nodes.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    label: d.label,
    color: d.color,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 320 }}>
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={padX - 6} y={y} textAnchor="end" dominantBaseline="central" fill={TOKENS.muted} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
          </g>
        );
      })}
      <motion.path d={lineStr} fill="none" stroke={TOKENS.border} strokeWidth="1" strokeDasharray="4 2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
      {points.map((p, i) => (
        <g key={i}>
          <motion.line x1={p.x} y1={padY + chartH} x2={p.x} y2={p.y} stroke={p.color} strokeWidth="1" strokeDasharray="2 2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }} />
          <motion.circle cx={p.x} cy={p.y} r={6} fill={TOKENS.card} stroke={p.color} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.06 }} />
          <motion.circle cx={p.x} cy={p.y} r={2.5} fill={p.color} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.06 }} />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fill={TOKENS.text} fontSize="8" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{p.value}</text>
          <text x={p.x} y={padY + chartH + 14} textAnchor="middle" fill={TOKENS.secondary} fontSize="8" fontWeight="500" fontFamily="ui-sans-serif, system-ui, sans-serif">{p.label}</text>
        </g>
      ))}
      <rect x={padX} y={8} width={6} height={6} rx={2} fill={TOKENS.lime} />
      <text x={padX + 10} y={12} dominantBaseline="central" fill={TOKENS.secondary} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Calm</text>
      <rect x={padX + 50} y={8} width={6} height={6} rx={2} fill={TOKENS.accent} />
      <text x={padX + 60} y={12} dominantBaseline="central" fill={TOKENS.secondary} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Elevated</text>
      <rect x={padX + 120} y={8} width={6} height={6} rx={2} fill={TOKENS.muted} />
      <text x={padX + 130} y={12} dominantBaseline="central" fill={TOKENS.secondary} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Neutral</text>
    </svg>
  );
}

// ============================================================
// SVG 9: TeamRoleFitBars (5 bars, #FF5500/#CCFF00/#00E5FF/#666/#FF5500)
// ============================================================

function TeamRoleFitBars({ bars }: { bars: BarItem[] }) {
  const vw = 300;
  const vh = 200;
  const padX = 85;
  const padY = 14;
  const chartW = vw - padX - 16;
  const chartH = vh - padY * 2;
  const barH = 24;
  const gap = 10;
  const n = bars.length;
  const totalBarSpace = n * barH + (n - 1) * gap;
  const startY = padY + (chartH - totalBarSpace) / 2;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 300 }}>
      {[0, 25, 50, 75, 100].map((val) => {
        const x = padX + (val / 100) * chartW;
        return (
          <g key={val}>
            <line x1={x} y1={padY} x2={x} y2={padY + chartH} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="2 2" />
            <text x={x} y={padY + chartH + 12} textAnchor="middle" fill={TOKENS.muted} fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
          </g>
        );
      })}
      {bars.map((bar, i) => {
        const barY = startY + i * (barH + gap);
        const barW = (bar.value / 100) * chartW;
        return (
          <g key={i}>
            <rect x={padX} y={barY} width={chartW} height={barH} rx={3} fill={TOKENS.border} fillOpacity={0.2} />
            <motion.rect x={padX} y={barY} width={barW} height={barH} rx={3} fill={bar.color} fillOpacity={0.7} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }} />
            <text x={padX + barW - 6} y={barY + barH / 2} textAnchor="end" dominantBaseline="central" fill={TOKENS.bg} fontSize="9" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{bar.value}</text>
            <text x={padX - 6} y={barY + barH / 2} textAnchor="end" dominantBaseline="central" fill={TOKENS.text} fontSize="9" fontWeight="500" fontFamily="ui-sans-serif, system-ui, sans-serif">{bar.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: MentalGrowthArea (8-pt, #CCFF00)
// ============================================================

function MentalGrowthArea({ data }: { data: TrendPoint[] }) {
  const vw = 300;
  const vh = 150;
  const padX = 35;
  const padY = 16;
  const chartW = vw - padX * 2;
  const chartH = vh - padY * 2;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    label: d.label,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${points[n - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <svg width={vw} height={vh + 20} viewBox={`0 0 ${vw} ${vh + 20}`} className="block" style={{ width: '100%', maxWidth: 300 }}>
      {[0, 25, 50, 75, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return <line key={val} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="3 3" />;
      })}
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <text key={`label-${val}`} x={padX - 6} y={y} textAnchor="end" dominantBaseline="central" fill={TOKENS.muted} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">{val}</text>
        );
      })}
      <motion.path d={areaStr} fill={TOKENS.lime} fillOpacity={0.07} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d={lineStr} fill="none" stroke={TOKENS.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} />
      {points.map((p, i) => {
        const isLast = i === n - 1;
        const isMin = data[i].value === minVal;
        const isMax = data[i].value === maxVal;
        const showLabel = isLast || isMin || isMax;
        return (
          <g key={i}>
            <motion.circle cx={p.x} cy={p.y} r={isLast ? 4 : showLabel ? 3 : 2} fill={isMax ? TOKENS.lime : isMin ? TOKENS.accent : TOKENS.card} stroke={TOKENS.lime} strokeWidth={isLast ? 2 : 1.5} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }} />
            {showLabel && (
              <text x={p.x} y={p.y - (isMax ? 8 : 10)} textAnchor="middle" fill={TOKENS.text} fontSize="8" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif">{p.value}</text>
            )}
            <text x={p.x} y={vh + 14} textAnchor="middle" fill={isLast ? TOKENS.text : TOKENS.muted} fontSize="7" fontWeight={isLast ? '600' : '400'} fontFamily="ui-sans-serif, system-ui, sans-serif">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: PsychSessionAttendanceRing (circular, #00E5FF)
// ============================================================

function PsychSessionAttendanceRing({ percentage }: { percentage: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 68;
  const sw = 12;

  const describeArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg - 90) * (Math.PI / 180);
    const endRad = (endDeg - 90) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    if (endDeg - startDeg <= 0) return '';
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const trackArc = describeArc(0, 359.9);
  const progressArc = percentage > 0 ? describeArc(0, Math.min(359.9, (percentage / 100) * 360)) : '';

  const sessions = Math.round(percentage * 2.4);
  const totalSessions = 24;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 180 }}>
      {trackArc && <path d={trackArc} fill="none" stroke={TOKENS.border} strokeWidth={sw} strokeLinecap="round" />}
      {progressArc && (
        <motion.path d={progressArc} fill="none" stroke={TOKENS.cyan} strokeWidth={sw} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      )}
      <motion.text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="28" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {percentage}%
      </motion.text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fill={TOKENS.secondary} fontSize="9" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="0.8">
        ATTENDANCE
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" dominantBaseline="central" fill={TOKENS.cyan} fontSize="8" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">
        {sessions}/{totalSessions} sessions
      </text>
      <circle cx={cx} cy={cy} r={radius - sw - 8} fill="none" stroke={TOKENS.border} strokeWidth="0.5" strokeDasharray="2 4" />
    </svg>
  );
}

// ============================================================
// SVG 12: MindsetBreakdownDonut (4-seg .reduce(), #CCFF00/#FF5500/#00E5FF/#666)
// ============================================================

function MindsetBreakdownDonut({ segments }: { segments: DonutSegment[] }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 70;
  const innerR = 45;
  const angleOffset = -Math.PI / 2;

  const arcs = segments.reduce<{ items: Array<{ d: string; color: string; midAngle: number }>; runningAngle: number }>((carry, seg) => {
    const sliceAngle = (seg.value / 100) * 2 * Math.PI;
    const startAngle = carry.runningAngle;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    const midAngle = (startAngle + endAngle) / 2;

    return {
      items: [...carry.items, { d, color: seg.color, midAngle }],
      runningAngle: endAngle,
    };
  }, { items: [], runningAngle: angleOffset }).items;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 180 }}>
      {arcs.map((arc, i) => (
        <motion.path key={i} d={arc.d} fill={arc.color} fillOpacity={0.75} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.1 }} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 1} fill={TOKENS.card} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill={TOKENS.text} fontSize="13" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">Mindset</text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">Profile</text>
      {segments.map((seg, i) => {
        const lx = cx + (outerR + 18) * Math.cos(arcs[i].midAngle);
        const ly = cy + (outerR + 18) * Math.sin(arcs[i].midAngle);
        return (
          <g key={seg.label}>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={seg.color} fontSize="7" fontWeight="600" fontFamily="ui-sans-serif, system-ui, sans-serif">{seg.value}%</text>
          </g>
        );
      })}
      {segments.map((seg, i) => (
        <g key={`legend-${seg.label}`}>
          <rect x={6} y={size - 58 + i * 14} width={8} height={8} rx={2} fill={seg.color} />
          <text x={18} y={size - 52 + i * 14} dominantBaseline="central" fill={TOKENS.secondary} fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">{seg.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Stat Card Helper
// ============================================================

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 border"
      style={{
        backgroundColor: TOKENS.card,
        borderColor: TOKENS.border,
        borderRadius: 10,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}18` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 10, color: TOKENS.secondary, lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.text, lineHeight: 1.3 }}>{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PlayerPsychologyEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState('mental-state');

  const playerName = gameState?.player.name ?? 'Young Star';
  const clubName = gameState?.currentClub.name ?? 'FC Elite';
  const playerAge = gameState?.player.age ?? 19;
  const playerMorale = gameState?.player.morale ?? 65;
  const playerForm = gameState?.player.form ?? 6.5;
  const playerFitness = gameState?.player.fitness ?? 75;
  const playerReputation = gameState?.player.reputation ?? 25;
  const playerTraits = gameState?.player.traits ?? [];

  const seed = hashString(`${playerName}-${clubName}-${playerMorale}-${playerAge}`);
  const rng = seededRandom(seed);

  const tab1Data = generateTab1Data(rng);
  const tab2Data = generateTab2Data(rng);
  const tab3Data = generateTab3Data(rng);
  const tab4Data = generateTab4Data(rng);

  const overallMental = Math.round(
    tab1Data.radarAxes.reduce((s, a) => s + a.value, 0) / tab1Data.radarAxes.length
  );

  const overallStress = tab2Data.stressSegments.reduce((s, seg) => s + seg.value, 0) / tab2Data.stressSegments.length;

  const topCoping = tab2Data.copingBars.reduce<{ best: BarItem | null; maxVal: number }>(
    (carry, bar) => bar.value > carry.maxVal ? { best: bar, maxVal: bar.value } : carry,
    { best: null, maxVal: 0 }
  );

  const avgTeamFit = Math.round(tab3Data.teamRoleBars.reduce((s, b) => s + b.value, 0) / tab3Data.teamRoleBars.length);

  const avgTemperament = Math.round(tab3Data.temperamentNodes.reduce((s, n) => s + n.value, 0) / tab3Data.temperamentNodes.length);

  const growthDirection = tab4Data.growthTrend[tab4Data.growthTrend.length - 1].value - tab4Data.growthTrend[0].value;

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: TOKENS.bg }}>
        <p style={{ color: TOKENS.secondary, fontSize: 14 }}>No active career found. Start a new career to access Player Psychology.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: TOKENS.bg }}>
      {/* Header */}
      <div style={{ backgroundColor: TOKENS.card, borderBottom: `1px solid ${TOKENS.border}` }} className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${TOKENS.accent}18` }}>
            <Brain className="h-5 w-5" style={{ color: TOKENS.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 16, fontWeight: 700, color: TOKENS.text, lineHeight: 1.2 }}>Player Psychology</h1>
            <p style={{ fontSize: 10, color: TOKENS.secondary, marginTop: 2 }}>
              {playerName} &middot; {clubName} &middot; Age {playerAge}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: 8, backgroundColor: `${TOKENS.accent}18`, border: `1px solid ${TOKENS.accent}33` }}>
            <Activity className="h-3 w-3" style={{ color: TOKENS.accent }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TOKENS.accent }}>{overallMental}</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatCard
            icon={<Target className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
            label="Mental Score"
            value={overallMental}
            color={TOKENS.cyan}
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" style={{ color: TOKENS.accent }} />}
            label="Stress Level"
            value={`${Math.round(overallStress)}%`}
            color={TOKENS.accent}
          />
          <StatCard
            icon={<Shield className="h-4 w-4" style={{ color: TOKENS.lime }} />}
            label="Team Fit"
            value={`${avgTeamFit}%`}
            color={TOKENS.lime}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
            label="Growth"
            value={growthDirection > 0 ? `+${growthDirection}` : `${growthDirection}`}
            color={TOKENS.cyan}
          />
        </div>

        {/* Shadcn Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-0.5 gap-0.5" style={{ backgroundColor: `${TOKENS.bg}`, borderRadius: 10 }}>
            <TabsTrigger
              value="mental-state"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold data-[state=active]:shadow-none"
              style={{
                borderRadius: 8,
                backgroundColor: activeTab === 'mental-state' ? `${TOKENS.accent}18` : 'transparent',
                color: activeTab === 'mental-state' ? TOKENS.accent : TOKENS.secondary,
              }}
            >
              <Brain className="h-3.5 w-3.5" />
              Mental State
            </TabsTrigger>
            <TabsTrigger
              value="stress"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold data-[state=active]:shadow-none"
              style={{
                borderRadius: 8,
                backgroundColor: activeTab === 'stress' ? `${TOKENS.lime}18` : 'transparent',
                color: activeTab === 'stress' ? TOKENS.lime : TOKENS.secondary,
              }}
            >
              <Flame className="h-3.5 w-3.5" />
              Stress
            </TabsTrigger>
            <TabsTrigger
              value="personality"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold data-[state=active]:shadow-none"
              style={{
                borderRadius: 8,
                backgroundColor: activeTab === 'personality' ? `${TOKENS.cyan}18` : 'transparent',
                color: activeTab === 'personality' ? TOKENS.cyan : TOKENS.secondary,
              }}
            >
              <Users className="h-3.5 w-3.5" />
              Personality
            </TabsTrigger>
            <TabsTrigger
              value="development"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold data-[state=active]:shadow-none"
              style={{
                borderRadius: 8,
                backgroundColor: activeTab === 'development' ? `${TOKENS.accent}18` : 'transparent',
                color: activeTab === 'development' ? TOKENS.accent : TOKENS.secondary,
              }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Development
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* ============================================================ */}
          {/* TAB 1: Mental State */}
          {/* ============================================================ */}
          <TabsContent value="mental-state" className="mt-0 space-y-4">
            {/* Radar Chart Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" style={{ color: TOKENS.accent }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Mental Attributes Radar</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.accent}44`, color: TOKENS.accent, fontSize: 10 }}>
                  {tab1Data.radarAxes.length} axes
                </Badge>
              </div>
              <div className="flex justify-center">
                <MentalStateRadar axes={tab1Data.radarAxes} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {tab1Data.radarAxes.map((axis) => (
                  <div key={axis.label} className="text-center">
                    <p style={{ fontSize: 9, color: TOKENS.secondary }}>{axis.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.accent }}>{axis.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pressure Handling Gauge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: TOKENS.lime }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Pressure Handling</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.lime}44`, color: TOKENS.lime, fontSize: 10 }}>
                  {tab1Data.pressureScore >= 70 ? 'Strong' : tab1Data.pressureScore >= 40 ? 'Moderate' : 'Needs Work'}
                </Badge>
              </div>
              <div className="flex justify-center">
                <PressureHandlingGauge score={tab1Data.pressureScore} />
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 11, color: TOKENS.secondary }}>
                {tab1Data.pressureScore >= 70
                  ? 'You handle high-pressure situations with composure and clarity.'
                  : tab1Data.pressureScore >= 40
                  ? 'Room for improvement under pressure. Practice breathing techniques.'
                  : 'Pressure is affecting your game. Focus on mental preparation exercises.'}
              </p>
            </motion.div>

            {/* Confidence Trend Area */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: TOKENS.cyan }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Confidence Trend</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.cyan}44`, color: TOKENS.cyan, fontSize: 10 }}>
                  8 weeks
                </Badge>
              </div>
              <div className="flex justify-center">
                <ConfidenceTrendArea data={tab1Data.confidenceTrend} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Current: <span style={{ color: TOKENS.cyan, fontWeight: 700 }}>{tab1Data.confidenceTrend[tab1Data.confidenceTrend.length - 1].value}</span>
                </p>
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Peak: <span style={{ color: TOKENS.lime, fontWeight: 700 }}>{Math.max(...tab1Data.confidenceTrend.map(t => t.value))}</span>
                </p>
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Low: <span style={{ color: TOKENS.accent, fontWeight: 700 }}>{Math.min(...tab1Data.confidenceTrend.map(t => t.value))}</span>
                </p>
              </div>
            </motion.div>

            {/* Mental State Insights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" style={{ color: TOKENS.lime }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Mental Insights</h2>
              </div>
              <div className="space-y-2">
                {playerTraits.length > 0 ? playerTraits.slice(0, 3).map((trait) => (
                  <div key={trait} className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: TOKENS.lime }} />
                    <p style={{ fontSize: 11, color: TOKENS.text }}>
                      <span style={{ fontWeight: 600, color: TOKENS.lime }}>{trait.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      {' '}trait detected — boosting mental resilience
                    </p>
                  </div>
                )) : (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                    <Compass className="h-3.5 w-3.5" style={{ color: TOKENS.accent }} />
                    <p style={{ fontSize: 11, color: TOKENS.text }}>
                      No personality traits yet. Experiences will shape your mental profile over time.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.cyan}08`, borderRadius: 8 }}>
                  <Activity className="h-3.5 w-3.5" style={{ color: TOKENS.cyan }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    Morale at <span style={{ fontWeight: 700, color: TOKENS.cyan }}>{playerMorale}</span> and form <span style={{ fontWeight: 700, color: TOKENS.cyan }}>{playerForm.toFixed(1)}</span> directly influence your mental state.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Weekly Mental Goals */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" style={{ color: TOKENS.accent }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Weekly Mental Goals</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.accent}44`, color: TOKENS.accent, fontSize: 10 }}>
                  {['Complete pre-match visualization', 'Journal after each training', 'Practice breathing exercises', 'Review match footage mentally'].filter(() => rng() > 0.4).length}/4
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: TOKENS.lime }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: TOKENS.bg }}>&#10003;</span>
                  </div>
                  <p style={{ fontSize: 11, color: TOKENS.text, flex: 1 }}>Complete pre-match visualization</p>
                  <span style={{ fontSize: 9, color: TOKENS.lime, fontWeight: 600 }}>Done</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: TOKENS.lime }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: TOKENS.bg }}>&#10003;</span>
                  </div>
                  <p style={{ fontSize: 11, color: TOKENS.text, flex: 1 }}>Journal after each training session</p>
                  <span style={{ fontSize: 9, color: TOKENS.lime, fontWeight: 600 }}>Done</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: TOKENS.border }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.muted }}>-</span>
                  </div>
                  <p style={{ fontSize: 11, color: TOKENS.text, flex: 1 }}>Practice breathing exercises daily</p>
                  <span style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 600 }}>Pending</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: TOKENS.border }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.muted }}>-</span>
                  </div>
                  <p style={{ fontSize: 11, color: TOKENS.text, flex: 1 }}>Review match footage mentally for 10 min</p>
                  <span style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 600 }}>Pending</span>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: Stress Management */}
          {/* ============================================================ */}
          <TabsContent value="stress" className="mt-0 space-y-4">
            {/* Stress Level Donut */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" style={{ color: TOKENS.accent }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Stress Level Breakdown</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.accent}44`, color: TOKENS.accent, fontSize: 10 }}>
                  4 sources
                </Badge>
              </div>
              <div className="flex justify-center">
                <StressLevelDonut segments={tab2Data.stressSegments} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {tab2Data.stressSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2 px-2 py-1.5" style={{ backgroundColor: `${seg.color}08`, borderRadius: 6 }}>
                    <div className="w-2.5 h-2.5" style={{ borderRadius: 4, backgroundColor: seg.color }} />
                    <span style={{ fontSize: 10, color: TOKENS.secondary, flex: 1 }}>{seg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: seg.color }}>{seg.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Coping Mechanism Bars */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" style={{ color: TOKENS.lime }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Coping Mechanisms</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.lime}44`, color: TOKENS.lime, fontSize: 10 }}>
                  {topCoping.best ? topCoping.best.label : 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-center">
                <CopingMechanismBars bars={tab2Data.copingBars} />
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 11, color: TOKENS.secondary }}>
                {topCoping.best
                  ? `Your most effective coping method is ${topCoping.best.label} at ${topCoping.best.value}%.`
                  : 'Track your coping strategies to find what works best for you.'}
              </p>
            </motion.div>

            {/* Stress vs Performance Scatter */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: TOKENS.cyan }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Stress vs Performance</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.cyan}44`, color: TOKENS.cyan, fontSize: 10 }}>
                  8 matches
                </Badge>
              </div>
              <div className="flex justify-center">
                <StressVsPerformanceScatter points={tab2Data.scatterPoints} />
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 11, color: TOKENS.secondary }}>
                How stress levels correlate with match performance ratings.
              </p>
            </motion.div>

            {/* Stress Tips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" style={{ color: TOKENS.lime }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Stress Management Tips</h2>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <Wind className="h-3.5 w-3.5" style={{ color: TOKENS.lime }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.lime }}>Box Breathing:</span> 4-4-4-4 pattern before matches reduces cortisol by up to 25%.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.cyan}08`, borderRadius: 8 }}>
                  <BookOpen className="h-3.5 w-3.5" style={{ color: TOKENS.cyan }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.cyan }}>Journaling:</span> Writing down worries for 5 minutes before sleep improves sleep quality.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <Sun className="h-3.5 w-3.5" style={{ color: TOKENS.accent }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.accent }}>Recovery:</span> Rest days are as important as training days for mental health.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: Personality Profile */}
          {/* ============================================================ */}
          <TabsContent value="personality" className="mt-0 space-y-4">
            {/* Personality Radar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: TOKENS.lime }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Personality Profile</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.lime}44`, color: TOKENS.lime, fontSize: 10 }}>
                  Big Five
                </Badge>
              </div>
              <div className="flex justify-center">
                <PersonalityRadar axes={tab3Data.personalityAxes} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {tab3Data.personalityAxes.map((axis) => (
                  <div key={axis.label} className="text-center">
                    <p style={{ fontSize: 9, color: TOKENS.secondary }}>{axis.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.lime }}>{axis.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Temperament Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" style={{ color: TOKENS.accent }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Temperament Timeline</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.accent}44`, color: TOKENS.accent, fontSize: 10 }}>
                  Avg: {avgTemperament}
                </Badge>
              </div>
              <div className="flex justify-center">
                <TemperamentTimeline nodes={tab3Data.temperamentNodes} />
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 11, color: TOKENS.secondary }}>
                Monthly emotional regulation scores across the season.
              </p>
            </motion.div>

            {/* Team Role Fit Bars */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" style={{ color: TOKENS.cyan }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Team Role Fit</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.cyan}44`, color: TOKENS.cyan, fontSize: 10 }}>
                  Avg: {avgTeamFit}%
                </Badge>
              </div>
              <div className="flex justify-center">
                <TeamRoleFitBars bars={tab3Data.teamRoleBars} />
              </div>
              <p className="mt-2 text-center" style={{ fontSize: 11, color: TOKENS.secondary }}>
                How well your personality aligns with different team roles at {clubName}.
              </p>
            </motion.div>

            {/* Personality Insights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Compass className="h-4 w-4" style={{ color: TOKENS.lime }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Personality Insights</h2>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <Star className="h-3.5 w-3.5" style={{ color: TOKENS.lime }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    Your <span style={{ fontWeight: 600, color: TOKENS.lime }}>strongest personality trait</span> is{' '}
                    {tab3Data.personalityAxes.reduce<{ best: RadarAxis | null; max: number }>(
                      (c, a) => a.value > c.max ? { best: a, max: a.value } : c,
                      { best: null, max: 0 }
                    ).best?.label ?? 'Unknown'}{' '}
                    which helps you excel under pressure.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <Zap className="h-3.5 w-3.5" style={{ color: TOKENS.accent }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.accent }}>Development area:</span> Focus on improving{' '}
                    {tab3Data.personalityAxes.reduce<{ worst: RadarAxis | null; min: number }>(
                      (c, a) => a.value < c.min ? { worst: a, min: a.value } : c,
                      { worst: null, min: 101 }
                    ).worst?.label ?? 'Unknown'}{' '}
                    to unlock new leadership opportunities.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.cyan}08`, borderRadius: 8 }}>
                  <Eye className="h-3.5 w-3.5" style={{ color: TOKENS.cyan }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.cyan }}>Club compatibility:</span> {avgTeamFit}% fit suggests your personality aligns well with {clubName}'s culture.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 4: Development */}
          {/* ============================================================ */}
          <TabsContent value="development" className="mt-0 space-y-4">
            {/* Mental Growth Area */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: TOKENS.lime }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Mental Growth Trend</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.lime}44`, color: TOKENS.lime, fontSize: 10 }}>
                  {growthDirection > 0 ? 'Growing' : growthDirection < 0 ? 'Declining' : 'Stable'}
                </Badge>
              </div>
              <div className="flex justify-center">
                <MentalGrowthArea data={tab4Data.growthTrend} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Start: <span style={{ color: TOKENS.text, fontWeight: 700 }}>{tab4Data.growthTrend[0].value}</span>
                </p>
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Current: <span style={{ color: TOKENS.lime, fontWeight: 700 }}>{tab4Data.growthTrend[tab4Data.growthTrend.length - 1].value}</span>
                </p>
                <p style={{ fontSize: 11, color: TOKENS.secondary }}>
                  Change: <span style={{ color: growthDirection > 0 ? TOKENS.lime : TOKENS.accent, fontWeight: 700 }}>{growthDirection > 0 ? '+' : ''}{growthDirection}</span>
                </p>
              </div>
            </motion.div>

            {/* Psych Session Attendance Ring */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" style={{ color: TOKENS.cyan }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Psych Session Attendance</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.cyan}44`, color: TOKENS.cyan, fontSize: 10 }}>
                  Season Total
                </Badge>
              </div>
              <div className="flex justify-center">
                <PsychSessionAttendanceRing percentage={tab4Data.sessionAttendance} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center px-2 py-2" style={{ backgroundColor: `${TOKENS.cyan}08`, borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: TOKENS.secondary }}>Sessions</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.cyan }}>{Math.round(tab4Data.sessionAttendance * 2.4)}</p>
                </div>
                <div className="text-center px-2 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: TOKENS.secondary }}>Attendance</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.lime }}>{tab4Data.sessionAttendance}%</p>
                </div>
                <div className="text-center px-2 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: TOKENS.secondary }}>Streak</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TOKENS.accent }}>{Math.min(8, Math.round(tab4Data.sessionAttendance / 12))}</p>
                </div>
              </div>
            </motion.div>

            {/* Mindset Breakdown Donut */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" style={{ color: TOKENS.accent }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Mindset Breakdown</h2>
                </div>
                <Badge variant="outline" style={{ borderColor: `${TOKENS.accent}44`, color: TOKENS.accent, fontSize: 10 }}>
                  4 profiles
                </Badge>
              </div>
              <div className="flex justify-center">
                <MindsetBreakdownDonut segments={tab4Data.mindsetSegments} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {tab4Data.mindsetSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2 px-2 py-1.5" style={{ backgroundColor: `${seg.color}08`, borderRadius: 6 }}>
                    <div className="w-2.5 h-2.5" style={{ borderRadius: 4, backgroundColor: seg.color }} />
                    <span style={{ fontSize: 10, color: TOKENS.secondary, flex: 1 }}>{seg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: seg.color }}>{seg.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Development Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="border p-4"
              style={{ backgroundColor: TOKENS.card, borderColor: TOKENS.border, borderRadius: 12 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4" style={{ color: TOKENS.lime }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: TOKENS.text }}>Development Recommendations</h2>
              </div>
              <div className="space-y-2">
                {tab4Data.mindsetSegments.filter(s => s.label === 'Growth').length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: TOKENS.lime }} />
                    <p style={{ fontSize: 11, color: TOKENS.text }}>
                      <span style={{ fontWeight: 600, color: TOKENS.lime }}>Growth Mindset:</span> {tab4Data.mindsetSegments.find(s => s.label === 'Growth')?.value ?? 0}% of your approach is growth-oriented. Keep pushing boundaries.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.cyan}08`, borderRadius: 8 }}>
                  <Moon className="h-3.5 w-3.5" style={{ color: TOKENS.cyan }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.cyan }}>Sleep Hygiene:</span> Quality sleep is the foundation of mental recovery. Target 8-9 hours nightly.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.accent}08`, borderRadius: 8 }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: TOKENS.accent }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.accent }}>Consistency:</span> Attend regular psychology sessions to build long-term mental resilience.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: `${TOKENS.lime}08`, borderRadius: 8 }}>
                  <Eye className="h-3.5 w-3.5" style={{ color: TOKENS.lime }} />
                  <p style={{ fontSize: 11, color: TOKENS.text }}>
                    <span style={{ fontWeight: 600, color: TOKENS.lime }}>Goal Review:</span> Weekly mental goals compound over time. Small wins build lasting confidence.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
