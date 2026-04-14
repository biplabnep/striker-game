'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Star,
  ChevronDown,
  ArrowUpRight,
  Users,
  Banknote,
  Zap,
  Volume2,
  TrendingUp,
  Crown,
  Sun,
  Monitor,
  Trophy,
  CheckCircle,
  XCircle,
  Lightbulb,
  ClipboardList,
  Timer,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface StadiumUpgrade {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  effectDescription: string;
  color: string;
  levelEffects: string[];
}

interface AttendanceDataPoint {
  matchDay: number;
  attendance: number;
}

interface StadiumComparison {
  name: string;
  capacity: number;
  rating: number;
  revenuePerMatch: number;
}

type FanMood = 'happy' | 'neutral' | 'frustrated' | 'angry';
type NoiseLevel = 'quiet' | 'moderate' | 'loud' | 'deafening';

// ============================================================
// Constants
// ============================================================

const MAX_FACILITY_LEVEL = 5;

const STADIUM_NAME_DEFAULTS: Record<string, string> = {
  premier_league: 'Stadium of Light',
  la_liga: 'Estadio Municipal',
  bundesliga: 'Stadion am Park',
  serie_a: 'Stadio Comunale',
  ligue_1: 'Stade Municipal',
};

const FAMOUS_STADIUMS: StadiumComparison[] = [
  { name: 'Wembley', capacity: 90000, rating: 5, revenuePerMatch: 5_500_000 },
  { name: 'Camp Nou', capacity: 99354, rating: 5, revenuePerMatch: 4_800_000 },
  { name: 'Allianz Arena', capacity: 75024, rating: 5, revenuePerMatch: 4_200_000 },
];

const UPGRADE_LEVEL_EFFECTS: Record<string, string[]> = {
  seating_capacity: [
    'Base capacity (20,000 seats)',
    'Expanded to 28,000 seats (+8,000)',
    'Expanded to 38,000 seats (+10,000)',
    'Expanded to 50,000 seats (+12,000)',
    'Expanded to 65,000 seats (+15,000)',
  ],
  vip_boxes: [
    'No VIP facilities',
    '10 VIP boxes (+€150K/match)',
    '25 VIP boxes (+€350K/match)',
    '50 VIP boxes (+€600K/match)',
    '100 VIP boxes (+€1.2M/match)',
  ],
  pitch_quality: [
    'Standard grass pitch',
    'Improved drainage system',
    'Hybrid grass technology',
    'Under-soil heating + DRS',
    'State-of-the-art pitch lab',
  ],
  floodlights: [
    'Basic lighting only',
    'Standard floodlights installed',
    'LED floodlight system',
    'HD broadcast lighting',
    'Premium light show system',
  ],
  scoreboard: [
    'Basic static scoreboard',
    'Digital scoreboard (small)',
    'Large LED video board',
    '4K ultra-HD display',
    'Immersive surround screens',
  ],
  training_ground: [
    'Basic training pitches',
    'Improved gym + recovery',
    'Advanced sports science lab',
    'Full performance center',
    'World-class training facility',
  ],
};

// ============================================================
// Helpers
// ============================================================

function valueToLevel(value: number): number {
  return Math.max(1, Math.min(MAX_FACILITY_LEVEL, Math.ceil(value / 20)));
}

function getUpgradeCost(currentLevel: number): number {
  return currentLevel * 4_000_000;
}

function formatCost(cost: number): string {
  if (cost >= 1_000_000) return `€${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `€${(cost / 1_000).toFixed(0)}K`;
  return `€${cost}`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function seededValue(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const normalized = x - Math.floor(x);
  return Math.round(min + normalized * (max - min));
}

function seededChoice<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function generateAttendanceData(season: number, week: number, capacity: number, reputation: number): AttendanceDataPoint[] {
  const data: AttendanceDataPoint[] = [];
  const baseRate = 0.6 + (reputation / 100) * 0.35;
  const matchesToShow = Math.min(10, week - 1);

  for (let i = 0; i < matchesToShow; i++) {
    const matchNum = week - matchesToShow + i;
    const variation = Math.sin(matchNum * 2.7 + season * 1.3) * 0.15;
    const attendanceRate = Math.max(0.4, Math.min(0.98, baseRate + variation));
    data.push({
      matchDay: i + 1,
      attendance: Math.round(capacity * attendanceRate),
    });
  }

  // Pad with earlier matches if not enough
  while (data.length < 5) {
    const matchDay = data.length + 1;
    const variation = Math.sin((week - data.length) * 2.7 + season * 1.3) * 0.15;
    const attendanceRate = Math.max(0.4, Math.min(0.98, baseRate + variation));
    data.push({
      matchDay,
      attendance: Math.round(capacity * attendanceRate),
    });
  }

  return data.slice(-10);
}

function deriveFanMood(morale: number, recentResults: { homeScore: number; awayScore: number }[]): FanMood {
  if (recentResults.length === 0) {
    if (morale >= 70) return 'happy';
    if (morale >= 45) return 'neutral';
    if (morale >= 25) return 'frustrated';
    return 'angry';
  }

  const last5 = recentResults.slice(-5);
  const wins = last5.filter(r => r.homeScore > r.awayScore).length;
  const losses = last5.filter(r => r.homeScore < r.awayScore).length;

  if (wins >= 3) return 'happy';
  if (losses >= 3) return 'angry';
  if (wins >= losses) return 'neutral';
  return 'frustrated';
}

function deriveNoiseLevel(mood: FanMood, capacity: number, week: number): NoiseLevel {
  const baseNoise = mood === 'happy' ? 3 : mood === 'neutral' ? 2 : mood === 'frustrated' ? 1 : 0;
  const capacityFactor = capacity > 50000 ? 1 : 0;
  const variation = Math.abs(Math.sin(week * 3.7)) > 0.6 ? 1 : 0;
  const level = baseNoise + capacityFactor + variation;

  if (level >= 4) return 'deafening';
  if (level >= 3) return 'loud';
  if (level >= 2) return 'moderate';
  return 'quiet';
}

function deriveHomeAdvantage(noise: NoiseLevel, mood: FanMood): number {
  const baseAdvantage: Record<NoiseLevel, number> = {
    quiet: 1, moderate: 2, loud: 3, deafening: 4,
  };
  const moodBonus: Record<FanMood, number> = {
    happy: 1, neutral: 0, frustrated: -1, angry: -2,
  };
  return Math.max(1, Math.min(5, baseAdvantage[noise] + moodBonus[mood]));
}

// ============================================================
// SVG Face Component (Fan Mood)
// ============================================================

function MoodFace({ mood, size = 40 }: { mood: FanMood; size?: number }) {
  const colors: Record<FanMood, string> = {
    happy: '#22c55e',
    neutral: '#f59e0b',
    frustrated: '#f97316',
    angry: '#ef4444',
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  // Eyes positions
  const leftEyeX = cx - r * 0.3;
  const rightEyeX = cx + r * 0.3;
  const eyeY = cy - r * 0.15;
  const eyeR = r * 0.08;

  // Mouth
  const mouthY = cy + r * 0.3;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Face circle */}
      <circle cx={cx} cy={cy} r={r} fill={colors[mood]} opacity={0.2} stroke={colors[mood]} strokeWidth={1.5} />

      {/* Left eye */}
      <circle cx={leftEyeX} cy={eyeY} r={eyeR} fill={colors[mood]} />
      {/* Right eye */}
      <circle cx={rightEyeX} cy={eyeY} r={eyeR} fill={colors[mood]} />

      {/* Eyebrows */}
      {mood === 'angry' && (
        <>
          <line x1={leftEyeX - eyeR * 2} y1={eyeY - eyeR * 3} x2={leftEyeX + eyeR * 2} y2={eyeY - eyeR * 1.5} stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
          <line x1={rightEyeX - eyeR * 2} y1={eyeY - eyeR * 1.5} x2={rightEyeX + eyeR * 2} y2={eyeY - eyeR * 3} stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}

      {/* Mouth */}
      {mood === 'happy' && (
        <path d={`M${cx - r * 0.3} ${mouthY} Q${cx} ${mouthY + r * 0.35} ${cx + r * 0.3} ${mouthY}`} fill="none" stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
      )}
      {mood === 'neutral' && (
        <line x1={cx - r * 0.25} y1={mouthY} x2={cx + r * 0.25} y2={mouthY} stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
      )}
      {mood === 'frustrated' && (
        <path d={`M${cx - r * 0.25} ${mouthY + r * 0.1} Q${cx} ${mouthY - r * 0.1} ${cx + r * 0.25} ${mouthY + r * 0.1}`} fill="none" stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
      )}
      {mood === 'angry' && (
        <path d={`M${cx - r * 0.25} ${mouthY + r * 0.15} Q${cx} ${mouthY - r * 0.2} ${cx + r * 0.25} ${mouthY + r * 0.15}`} fill="none" stroke={colors[mood]} strokeWidth={1.5} strokeLinecap="round" />
      )}
    </svg>
  );
}

// ============================================================
// Star Rating Component
// ============================================================

function StarRating({ level, maxLevel = 5, size = 14 }: { level: number; maxLevel?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLevel }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < level ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}
        />
      ))}
    </div>
  );
}

// ============================================================
// Stadium SVG Visualization
// ============================================================

function StadiumSVG({
  capacity,
  vipLevel,
  standNames,
}: {
  capacity: number;
  vipLevel: number;
  standNames: { north: string; south: string; east: string; west: string };
}) {
  const totalWidth = 320;
  const totalHeight = 240;
  const pitchX = 70;
  const pitchY = 55;
  const pitchW = 180;
  const pitchH = 130;
  const standThickness = 18;
  const vipWidth = standThickness * 0.6;

  const northCapacity = Math.round(capacity * 0.3);
  const southCapacity = Math.round(capacity * 0.3);
  const eastCapacity = Math.round(capacity * 0.2);
  const westCapacity = capacity - northCapacity - southCapacity - eastCapacity;

  const vipCount = vipLevel * 10;

  return (
    <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="w-full">
      {/* Background (surroundings) */}
      <rect width={totalWidth} height={totalHeight} fill="#0d1117" rx={6} />

      {/* North Stand */}
      <rect x={pitchX - 10} y={pitchY - standThickness - 8} width={pitchW + 20} height={standThickness} rx={3} fill="#15803d" />
      {/* VIP row */}
      {vipLevel > 0 && (
        <rect x={pitchX - 10} y={pitchY - 8} width={pitchW + 20} height={vipWidth} rx={2} fill="#b45309" opacity={0.8} />
      )}

      {/* South Stand */}
      <rect x={pitchX - 10} y={pitchY + pitchH + 8} width={pitchW + 20} height={standThickness} rx={3} fill="#166534" />
      {/* VIP row */}
      {vipLevel > 0 && (
        <rect x={pitchX - 10} y={pitchY + pitchH + 8 - vipWidth} width={pitchW + 20} height={vipWidth} rx={2} fill="#b45309" opacity={0.8} />
      )}

      {/* East Stand (Away) */}
      <rect x={pitchX + pitchW + 8} y={pitchY - 10} width={standThickness} height={pitchH + 20} rx={3} fill="#991b1b" opacity={0.7} />

      {/* West Stand */}
      <rect x={pitchX - standThickness - 8} y={pitchY - 10} width={standThickness} height={pitchH + 20} rx={3} fill="#15803d" />

      {/* Pitch */}
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH} fill="#16a34a" />

      {/* Pitch markings */}
      {/* Center line */}
      <line x1={pitchX} y1={pitchY + pitchH / 2} x2={pitchX + pitchW} y2={pitchY + pitchH / 2} stroke="#15803d" strokeWidth={0.8} />
      {/* Center circle */}
      <circle cx={pitchX + pitchW / 2} cy={pitchY + pitchH / 2} r={18} fill="none" stroke="#15803d" strokeWidth={0.8} />
      {/* Center dot */}
      <circle cx={pitchX + pitchW / 2} cy={pitchY + pitchH / 2} r={2} fill="#15803d" />

      {/* North penalty area */}
      <rect x={pitchX + pitchW / 2 - 30} y={pitchY} width={60} height={22} fill="none" stroke="#15803d" strokeWidth={0.8} />
      {/* North goal area */}
      <rect x={pitchX + pitchW / 2 - 14} y={pitchY} width={28} height={8} fill="none" stroke="#15803d" strokeWidth={0.8} />
      {/* North goal */}
      <rect x={pitchX + pitchW / 2 - 6} y={pitchY - 3} width={12} height={3} fill="none" stroke="#e2e8f0" strokeWidth={0.8} opacity={0.5} />

      {/* South penalty area */}
      <rect x={pitchX + pitchW / 2 - 30} y={pitchY + pitchH - 22} width={60} height={22} fill="none" stroke="#15803d" strokeWidth={0.8} />
      {/* South goal area */}
      <rect x={pitchX + pitchW / 2 - 14} y={pitchY + pitchH - 8} width={28} height={8} fill="none" stroke="#15803d" strokeWidth={0.8} />
      {/* South goal */}
      <rect x={pitchX + pitchW / 2 - 6} y={pitchY + pitchH} width={12} height={3} fill="none" stroke="#e2e8f0" strokeWidth={0.8} opacity={0.5} />

      {/* Corner arcs */}
      <path d={`M${pitchX + 2} ${pitchY + 2} A4 4 0 0 1 ${pitchX + 2} ${pitchY + 6}`} fill="none" stroke="#15803d" strokeWidth={0.6} />
      <path d={`M${pitchX + pitchW - 2} ${pitchY + 2} A4 4 0 0 0 ${pitchX + pitchW - 2} ${pitchY + 6}`} fill="none" stroke="#15803d" strokeWidth={0.6} />
      <path d={`M${pitchX + 2} ${pitchY + pitchH - 2} A4 4 0 0 0 ${pitchX + 2} ${pitchY + pitchH - 6}`} fill="none" stroke="#15803d" strokeWidth={0.6} />
      <path d={`M${pitchX + pitchW - 2} ${pitchY + pitchH - 2} A4 4 0 0 1 ${pitchX + pitchW - 2} ${pitchY + pitchH - 6}`} fill="none" stroke="#15803d" strokeWidth={0.6} />

      {/* Penalty spots */}
      <circle cx={pitchX + pitchW / 2} cy={pitchY + 16} r={1.2} fill="#15803d" />
      <circle cx={pitchX + pitchW / 2} cy={pitchY + pitchH - 16} r={1.2} fill="#15803d" />

      {/* Penalty arcs */}
      <path d={`M${pitchX + pitchW / 2 - 14} ${pitchY + 22} A14 14 0 0 0 ${pitchX + pitchW / 2 + 14} ${pitchY + 22}`} fill="none" stroke="#15803d" strokeWidth={0.6} />
      <path d={`M${pitchX + pitchW / 2 - 14} ${pitchY + pitchH - 22} A14 14 0 0 1 ${pitchX + pitchW / 2 + 14} ${pitchY + pitchH - 22}`} fill="none" stroke="#15803d" strokeWidth={0.6} />

      {/* Stand capacity labels */}
      <text x={pitchX + pitchW / 2} y={pitchY - standThickness - 12} textAnchor="middle" fill="#8b949e" fontSize={8} fontFamily="system-ui">{standNames.north} ({formatNumber(northCapacity)})</text>
      <text x={pitchX + pitchW / 2} y={pitchY + pitchH + standThickness + 18} textAnchor="middle" fill="#8b949e" fontSize={8} fontFamily="system-ui">{standNames.south} ({formatNumber(southCapacity)})</text>
      <text x={pitchX + pitchW + standThickness + 14} y={pitchY + pitchH / 2} textAnchor="start" fill="#8b949e" fontSize={7} fontFamily="system-ui" dominantBaseline="central">Away ({formatNumber(eastCapacity)})</text>
      <text x={pitchX - standThickness - 14} y={pitchY + pitchH / 2} textAnchor="end" fill="#8b949e" fontSize={7} fontFamily="system-ui" dominantBaseline="central">{standNames.west} ({formatNumber(westCapacity)})</text>

      {/* VIP indicator */}
      {vipLevel > 0 && (
        <text x={pitchX + pitchW + standThickness + 14} y={pitchY + pitchH / 2 + 14} textAnchor="start" fill="#d97706" fontSize={7} fontFamily="system-ui">{vipCount} VIP boxes</text>
      )}

      {/* Floodlight indicators */}
      <circle cx={pitchX + 5} cy={pitchY + 5} r={3} fill="#fef08a" opacity={0.6} />
      <circle cx={pitchX + pitchW - 5} cy={pitchY + 5} r={3} fill="#fef08a" opacity={0.6} />
      <circle cx={pitchX + 5} cy={pitchY + pitchH - 5} r={3} fill="#fef08a" opacity={0.6} />
      <circle cx={pitchX + pitchW - 5} cy={pitchY + pitchH - 5} r={3} fill="#fef08a" opacity={0.6} />
    </svg>
  );
}

// ============================================================
// Attendance Trend Chart (SVG)
// ============================================================

function AttendanceTrendChart({ data, capacity }: { data: AttendanceDataPoint[]; capacity: number }) {
  if (data.length < 2) return null;

  const chartWidth = 320;
  const chartHeight = 120;
  const padLeft = 35;
  const padRight = 10;
  const padTop = 15;
  const padBottom = 25;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const maxAttendance = Math.max(...data.map(d => d.attendance), capacity);
  const yScale = plotH / maxAttendance;
  const xStep = plotW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padLeft + i * xStep,
    y: padTop + plotH - d.attendance * yScale,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x},${padTop + plotH} L${points[0].x},${padTop + plotH} Z`;

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxAttendance / yTicks) * i));

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
      {/* Grid lines */}
      {yTickValues.map((val, i) => {
        const y = padTop + plotH - val * yScale;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke="#21262d" strokeWidth={0.5} />
            <text x={padLeft - 4} y={y} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize={7} fontFamily="system-ui">
              {formatNumber(val)}
            </text>
          </g>
        );
      })}

      {/* Capacity line */}
      <line x1={padLeft} y1={padTop + plotH - capacity * yScale} x2={chartWidth - padRight} y2={padTop + plotH - capacity * yScale} stroke="#ef4444" strokeWidth={0.5} strokeDasharray="4 3" opacity={0.5} />

      {/* Area fill */}
      <path d={areaPath} fill="#22c55e" opacity={0.1} />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#22c55e" stroke="#0d1117" strokeWidth={1.5} />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (data.length > 6 && i % 2 !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={i}
            x={points[i].x}
            y={chartHeight - 5}
            textAnchor="middle"
            fill="#484f58"
            fontSize={7}
            fontFamily="system-ui"
          >
            MD{d.matchDay}
          </text>
        );
      })}

      {/* Legend */}
      <circle cx={padLeft} cy={6} r={2} fill="#22c55e" />
      <text x={padLeft + 6} y={8} fill="#8b949e" fontSize={7} fontFamily="system-ui">Attendance</text>
      <line x1={padLeft + 60} y1={6} x2={padLeft + 72} y2={6} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3 2" />
      <text x={padLeft + 76} y={8} fill="#8b949e" fontSize={7} fontFamily="system-ui">Capacity</text>
    </svg>
  );
}

// ============================================================
// Stadium Comparison Chart
// ============================================================

function StadiumComparisonChart({
  current,
  comparisons,
}: {
  current: StadiumComparison;
  comparisons: StadiumComparison[];
}) {
  const chartWidth = 320;
  const chartHeight = 180;
  const padLeft = 70;
  const padRight = 55;
  const padTop = 10;
  const barHeight = 14;
  const barGap = 28;
  const maxCapacity = Math.max(current.capacity, ...comparisons.map(c => c.capacity));
  const maxBarW = chartWidth - padLeft - padRight;

  const metrics: { label: string; key: keyof StadiumComparison; max: number; unit: string }[] = [
    { label: 'Capacity', key: 'capacity', max: maxCapacity, unit: '' },
    { label: 'Rating', key: 'rating', max: 5, unit: '/5' },
    { label: 'Revenue', key: 'revenuePerMatch', max: Math.max(current.revenuePerMatch, ...comparisons.map(c => c.revenuePerMatch)), unit: '' },
  ];

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
      {metrics.map((metric, mi) => {
        const baseY = padTop + mi * (barGap * 3 + barHeight * 3 + 10);

        return (
          <g key={metric.key}>
            {/* Metric label */}
            <text x={padLeft - 6} y={baseY + barHeight * 1.5 + barGap * 1} textAnchor="end" dominantBaseline="central" fill="#8b949e" fontSize={9} fontWeight="bold" fontFamily="system-ui">
              {metric.label}
            </text>

            {/* Current stadium */}
            <rect x={padLeft} y={baseY} width={maxBarW} height={barHeight} rx={2} fill="#21262d" />
            <rect x={padLeft} y={baseY} width={Math.max((current[metric.key] as number / metric.max) * maxBarW, 0)} height={barHeight} rx={2} fill="#22c55e" opacity={0.8} />
            <text x={padLeft + maxBarW + 4} y={baseY + barHeight / 2} dominantBaseline="central" fill="#c9d1d9" fontSize={7} fontFamily="system-ui">
              {metric.key === 'revenuePerMatch' ? formatCost(current[metric.key] as number) : `${formatNumber(current[metric.key] as number)}${metric.unit}`}
            </text>
            <text x={padLeft + 4} y={baseY + barHeight / 2} dominantBaseline="central" fill="#0d1117" fontSize={7} fontWeight="bold" fontFamily="system-ui">
              You
            </text>

            {/* Comparison stadiums */}
            {comparisons.map((comp, ci) => {
              const y = baseY + (ci + 1) * (barHeight + 3);
              return (
                <g key={comp.name}>
                  <rect x={padLeft} y={y} width={maxBarW} height={barHeight} rx={2} fill="#21262d" />
                  <rect x={padLeft} y={y} width={Math.max((comp[metric.key] as number / metric.max) * maxBarW, 0)} height={barHeight} rx={2} fill="#30363d" opacity={0.8} />
                  <text x={padLeft + maxBarW + 4} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize={7} fontFamily="system-ui">
                    {metric.key === 'revenuePerMatch' ? formatCost(comp[metric.key] as number) : `${formatNumber(comp[metric.key] as number)}${metric.unit}`}
                  </text>
                  <text x={padLeft + 4} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize={6} fontFamily="system-ui">
                    {comp.name}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Noise Level Meter
// ============================================================

function NoiseMeter({ level }: { level: NoiseLevel }) {
  const levels: NoiseLevel[] = ['quiet', 'moderate', 'loud', 'deafening'];
  const labels: Record<NoiseLevel, string> = {
    quiet: 'Quiet',
    moderate: 'Moderate',
    loud: 'Loud',
    deafening: 'Deafening',
  };
  const colors: Record<NoiseLevel, string> = {
    quiet: '#3b82f6',
    moderate: '#f59e0b',
    loud: '#f97316',
    deafening: '#ef4444',
  };
  const currentIdx = levels.indexOf(level);

  return (
    <div className="flex items-center gap-1.5">
      {levels.map((l, i) => (
        <div
          key={l}
          className="h-4 w-3 rounded-sm transition-all duration-300"
          style={{
            backgroundColor: i <= currentIdx ? colors[level] : '#21262d',
            opacity: i <= currentIdx ? 1 : 0.4,
          }}
        />
      ))}
      <span className="text-xs font-semibold ml-2" style={{ color: colors[level] }}>
        {labels[level]}
      </span>
    </div>
  );
}

// ============================================================
// Home Advantage Badge
// ============================================================

function HomeAdvantageBadge({ rating }: { rating: number }) {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];
  const labels = ['Poor', 'Weak', 'Decent', 'Strong', 'Formidable'];
  const color = colors[rating - 1] || '#8b949e';
  const label = labels[rating - 1] || 'N/A';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-5 rounded-sm"
            style={{
              backgroundColor: i < rating ? color : '#21262d',
              opacity: i < rating ? 0.9 : 0.3,
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function StadiumBuilder() {
  const gameState = useGameStore(state => state.gameState);
  const [isEditingName, setIsEditingName] = useState(false);
  const [stadiumName, setStadiumName] = useState('');
  const [expandedUpgrade, setExpandedUpgrade] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const club = gameState?.currentClub;
  const player = gameState?.player;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const teamDynamics = gameState?.teamDynamics;

  // ===== Derived Stadium Data =====
  const stadiumData = useMemo(() => {
    if (!club) return null;

    const reputation = club.reputation ?? 50;
    const facilities = club.facilities ?? 50;
    const finances = club.finances ?? 50;
    const tier = club.tier ?? 3;

    // Stadium capacity based on reputation + tier
    const baseCapacity = 15000 + (reputation * 300) + (tier * 5000);
    const seatingLevel = valueToLevel(facilities);
    const capacityBonus = [0, 8000, 10000, 12000, 15000][seatingLevel - 1] ?? 0;
    const capacity = Math.min(80000, baseCapacity + capacityBonus);

    // Default stadium name
    const defaultName = STADIUM_NAME_DEFAULTS[club.league] ?? `${club.name} Stadium`;

    // Stadium rating (1-5)
    const rawRating = (reputation / 25) + (finances / 50) + (seatingLevel / 5);
    const rating = Math.max(1, Math.min(5, Math.round(rawRating)));

    // Average attendance
    const attendanceRate = 0.55 + (reputation / 100) * 0.35 + (seatingLevel * 0.02);
    const avgAttendance = Math.round(capacity * Math.min(attendanceRate, 0.95));

    // Revenue per match
    const vipLevel = valueToLevel(finances);
    const vipRevenue = [0, 150000, 350000, 600000, 1200000][vipLevel - 1] ?? 0;
    const ticketRevenue = avgAttendance * (35 + tier * 15);
    const revenuePerMatch = ticketRevenue + vipRevenue;

    // Upgrade levels
    const upgrades: StadiumUpgrade[] = [
      { id: 'seating_capacity', name: 'Seating Capacity', icon: <Users className="h-4 w-4" />, description: 'Expand stadium seating to accommodate more fans', currentLevel: seatingLevel, maxLevel: MAX_FACILITY_LEVEL, baseCost: seatingLevel * 4_000_000, effectDescription: '+8-15K seats per level', color: '#22c55e', levelEffects: UPGRADE_LEVEL_EFFECTS['seating_capacity'] },
      { id: 'vip_boxes', name: 'VIP Boxes', icon: <Crown className="h-4 w-4" />, description: 'Premium corporate boxes for matchday revenue', currentLevel: vipLevel, maxLevel: MAX_FACILITY_LEVEL, baseCost: vipLevel * 5_000_000, effectDescription: '+€150K-€1.2M per match', color: '#d97706', levelEffects: UPGRADE_LEVEL_EFFECTS['vip_boxes'] },
      { id: 'pitch_quality', name: 'Pitch Quality', icon: <ClipboardList className="h-4 w-4" />, description: 'Improve the playing surface for better performance', currentLevel: valueToLevel(facilities), maxLevel: MAX_FACILITY_LEVEL, baseCost: valueToLevel(facilities) * 2_000_000, effectDescription: 'Match performance +1-5%', color: '#16a34a', levelEffects: UPGRADE_LEVEL_EFFECTS['pitch_quality'] },
      { id: 'floodlights', name: 'Floodlights', icon: <Lightbulb className="h-4 w-4" />, description: 'Install and upgrade lighting for night matches', currentLevel: valueToLevel(Math.min(facilities + 10, 100)), maxLevel: MAX_FACILITY_LEVEL, baseCost: valueToLevel(facilities) * 1_500_000, effectDescription: 'Enables night matches', color: '#eab308', levelEffects: UPGRADE_LEVEL_EFFECTS['floodlights'] },
      { id: 'scoreboard', name: 'Scoreboard', icon: <Monitor className="h-4 w-4" />, description: 'Upgrade matchday experience with modern displays', currentLevel: valueToLevel(Math.max(finances - 10, 10)), maxLevel: MAX_FACILITY_LEVEL, baseCost: valueToLevel(finances) * 1_800_000, effectDescription: 'Fan experience +5-20%', color: '#3b82f6', levelEffects: UPGRADE_LEVEL_EFFECTS['scoreboard'] },
      { id: 'training_ground', name: 'Training Ground', icon: <TrendingUp className="h-4 w-4" />, description: 'Develop training facilities for player growth', currentLevel: valueToLevel(facilities), maxLevel: MAX_FACILITY_LEVEL, baseCost: valueToLevel(facilities) * 3_500_000, effectDescription: 'Player development +3-15%', color: '#8b5cf6', levelEffects: UPGRADE_LEVEL_EFFECTS['training_ground'] },
    ];

    return {
      name: defaultName,
      capacity,
      avgAttendance,
      attendancePct: Math.round((avgAttendance / capacity) * 100),
      rating,
      revenuePerMatch,
      seatingLevel,
      vipLevel,
      upgrades,
    };
  }, [club]);

  // Initialize stadium name
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (stadiumData && !isEditingName) {
      setStadiumName(stadiumData.name);
    }
  }, [stadiumData, isEditingName]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ===== Attendance Trend =====
  const attendanceData = useMemo(() => {
    if (!stadiumData || !club) return [];
    return generateAttendanceData(currentSeason, currentWeek, stadiumData.capacity, club.reputation);
  }, [stadiumData, currentSeason, currentWeek, club]);

  // ===== Fan Mood & Atmosphere =====
  const recentHomeResults = useMemo(() => {
    if (!gameState) return [];
    return gameState.recentResults
      .filter(r => r.homeClub.id === club?.id)
      .slice(-5)
      .map(r => ({ homeScore: r.homeScore, awayScore: r.awayScore }));
  }, [gameState, club]);

  const fanMood: FanMood = useMemo(() => {
    const morale = teamDynamics?.morale ?? player?.morale ?? 60;
    return deriveFanMood(morale, recentHomeResults);
  }, [teamDynamics?.morale, player?.morale, recentHomeResults]);

  const noiseLevel: NoiseLevel = useMemo(() => {
    if (!stadiumData) return 'quiet';
    return deriveNoiseLevel(fanMood, stadiumData.capacity, currentWeek);
  }, [fanMood, stadiumData, currentWeek]);

  const homeAdvantage = useMemo(() => {
    return deriveHomeAdvantage(noiseLevel, fanMood);
  }, [noiseLevel, fanMood]);

  // ===== Current Stadium Comparison =====
  const currentComparison: StadiumComparison | null = useMemo(() => {
    if (!stadiumData) return null;
    return {
      name: club?.shortName ?? 'Your Club',
      capacity: stadiumData.capacity,
      rating: stadiumData.rating,
      revenuePerMatch: stadiumData.revenuePerMatch,
    };
  }, [stadiumData, club]);

  // ===== Stand Names =====
  const standNames = useMemo(() => ({
    north: 'North Stand',
    south: 'South Stand',
    east: 'East Stand',
    west: 'West Stand',
  }), []);

  // ===== Handlers =====
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleNameSave = useCallback(() => {
    setIsEditingName(false);
    if (stadiumName.trim()) {
      showToast('Stadium name updated!', 'success');
    }
  }, [stadiumName, showToast]);

  const handleUpgrade = useCallback((upgrade: StadiumUpgrade) => {
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      showToast('Already at maximum level!', 'error');
      return;
    }
    const cost = getUpgradeCost(upgrade.currentLevel);
    const budget = club?.budget ?? 0;

    if (budget < cost) {
      showToast(`Insufficient funds! Need ${formatCost(cost)}`, 'error');
      return;
    }

    showToast(`${upgrade.name} upgrading to Level ${upgrade.currentLevel + 1}!`, 'success');
  }, [club?.budget, showToast]);

  if (!gameState || !club || !stadiumData) return null;

  const st = stadiumData!;

  // ============================================================
  // SVG Data Visualization Sub-Components
  // ============================================================

  function toPolyPoints(pts: { x: number; y: number }[]): string {
    return pts.map((pt) => `${pt.x},${pt.y}`).join(' ');
  }

  function polarToXY(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // 1. Stadium Capacity Progress Ring
  function capacityProgressRing(): React.JSX.Element {
    const maxCap = 80000;
    const pct = Math.min(st.capacity / maxCap, 1);
    const r = 45;
    const sw = 8;
    const circ = 2 * Math.PI * r;
    const dashOff = circ * (1 - pct);
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
          <circle cx={60} cy={60} r={r} fill="none" stroke="#21262d" strokeWidth={sw} />
          <circle cx={60} cy={60} r={r} fill="none" stroke="#22c55e" strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={dashOff} strokeLinecap="round" opacity={0.85} />
          <text x={60} y={55} textAnchor="middle" fill="#c9d1d9" fontSize={16} fontWeight="bold" fontFamily="system-ui">{formatNumber(st.capacity)}</text>
          <text x={60} y={70} textAnchor="middle" fill="#8b949e" fontSize={8} fontFamily="system-ui">of {formatNumber(maxCap)}</text>
          <text x={60} y={82} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold" fontFamily="system-ui">{Math.round(pct * 100)}%</text>
        </svg>
        <div className="flex-1 space-y-2">
          <div className="text-[10px] text-[#8b949e] uppercase tracking-wider">Capacity Utilization</div>
          <div className="text-lg font-bold text-[#c9d1d9]">{st.attendancePct}% Avg Fill</div>
          <div className="text-[10px] text-[#484f58]">{formatNumber(st.avgAttendance)} avg attendance</div>
        </div>
      </div>
    );
  }

  // 2. Facility Completion Donut (5-segment via .reduce())
  function facilityCompletionDonut(): React.JSX.Element {
    const segInput = [
      { name: 'Training', value: st.upgrades[5].currentLevel, color: '#8b5cf6' },
      { name: 'Stands', value: st.upgrades[0].currentLevel, color: '#22c55e' },
      { name: 'Pitch', value: st.upgrades[2].currentLevel, color: '#16a34a' },
      { name: 'Lighting', value: st.upgrades[3].currentLevel, color: '#eab308' },
      { name: 'Facilities', value: st.upgrades[4].currentLevel, color: '#3b82f6' },
    ];
    const segTotal = segInput.reduce((s, seg) => s + seg.value, 0);
    const cx = 60, cy = 60, outerR = 48, innerR = 30;
    const donutResult = segInput.reduce<{ arcs: { d: string; color: string }[]; prevAngle: number }>((acc, seg) => {
      const startA = acc.prevAngle;
      const sweep = segTotal > 0 ? (seg.value / segTotal) * 360 : 0;
      const endA = startA + sweep;
      const large = sweep > 180 ? 1 : 0;
      const so = polarToXY(cx, cy, outerR, startA);
      const eo = polarToXY(cx, cy, outerR, endA);
      const si = polarToXY(cx, cy, innerR, endA);
      const ei = polarToXY(cx, cy, innerR, startA);
      const d = `M${so.x},${so.y} A${outerR},${outerR} 0 ${large} 1 ${eo.x},${eo.y} L${si.x},${si.y} A${innerR},${innerR} 0 ${large} 0 ${ei.x},${ei.y} Z`;
      return { arcs: [...acc.arcs, { d, color: seg.color }], prevAngle: endA };
    }, { arcs: [], prevAngle: 0 });
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
          {donutResult.arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={arc.color} opacity={0.8} />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={14} fontWeight="bold" fontFamily="system-ui">{segTotal}/25</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize={7} fontFamily="system-ui">Total Levels</text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {segInput.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-[#8b949e] flex-1">{seg.name}</span>
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{seg.value}/5</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Budget Allocation Bars
  function budgetAllocationBars(): React.JSX.Element {
    const budgetItems = [
      { name: 'Seating', pct: 28, color: '#22c55e' },
      { name: 'VIP Boxes', pct: 22, color: '#d97706' },
      { name: 'Pitch', pct: 18, color: '#16a34a' },
      { name: 'Floodlights', pct: 12, color: '#eab308' },
      { name: 'Training', pct: 20, color: '#8b5cf6' },
    ];
    const maxBarW = 180;
    return (
      <svg viewBox="0 0 280 130" className="w-full">
        {budgetItems.map((item, i) => {
          const y = 10 + i * 24;
          return (
            <g key={i}>
              <text x={0} y={y + 12} fill="#8b949e" fontSize={9} fontFamily="system-ui">{item.name}</text>
              <rect x={70} y={y} width={maxBarW} height={14} rx={2} fill="#21262d" />
              <rect x={70} y={y} width={Math.max((item.pct / 100) * maxBarW, 0)} height={14} rx={2} fill={item.color} opacity={0.8} />
              <text x={70 + maxBarW + 6} y={y + 11} fill="#c9d1d9" fontSize={9} fontWeight="bold" fontFamily="system-ui">{item.pct}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 4. Upgrade Priority Radar
  function upgradePriorityRadar(): React.JSX.Element {
    const radarData = [
      { label: 'Capacity', value: (st.seatingLevel / 5) * 100 },
      { label: 'Comfort', value: (st.upgrades[2].currentLevel / 5) * 100 },
      { label: 'Safety', value: (st.upgrades[3].currentLevel / 5) * 100 },
      { label: 'Revenue', value: (st.vipLevel / 5) * 100 },
      { label: 'Fan Exp.', value: (st.upgrades[4].currentLevel / 5) * 100 },
    ];
    const cx = 100, cy = 85, maxR = 60;
    const gridLevels = [20, 40, 60, 80, 100];
    const gridPolygons = gridLevels.map((level) => {
      const vertices = radarData.map((_, ai) => polarToXY(cx, cy, (level / 100) * maxR, ai * 72));
      return { pts: vertices };
    });
    const dataVertices = radarData.map((d, ai) =>
      polarToXY(cx, cy, (d.value / 100) * maxR, ai * 72)
    );
    const labelPositions = radarData.map((_, ai) =>
      polarToXY(cx, cy, maxR + 16, ai * 72)
    );
    return (
      <svg viewBox="0 0 200 170" className="w-full">
        {gridPolygons.map((gp, gi) => (
          <polygon key={gi} points={toPolyPoints(gp.pts)} fill="none" stroke="#21262d" strokeWidth={0.5} opacity={0.6} />
        ))}
        {radarData.map((_, ai) => {
          const axisEnd = polarToXY(cx, cy, maxR, ai * 72);
          return <line key={ai} x1={cx} y1={cy} x2={axisEnd.x} y2={axisEnd.y} stroke="#21262d" strokeWidth={0.5} />;
        })}
        <polygon points={toPolyPoints(dataVertices)} fill="#22c55e" opacity={0.15} />
        <polygon points={toPolyPoints(dataVertices)} fill="none" stroke="#22c55e" strokeWidth={1.5} opacity={0.8} />
        {dataVertices.map((v, vi) => (
          <circle key={vi} cx={v.x} cy={v.y} r={2.5} fill="#22c55e" />
        ))}
        {labelPositions.map((lp, li) => (
          <text key={li} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={7} fontFamily="system-ui">{radarData[li].label}</text>
        ))}
      </svg>
    );
  }

  // 5. Build Progress Timeline
  function buildProgressTimeline(): React.JSX.Element {
    const milestones = [
      { label: 'Foundation', done: true },
      { label: 'Structure', done: st.seatingLevel >= 2 },
      { label: 'Interior', done: st.seatingLevel >= 3 },
      { label: 'Systems', done: st.upgrades[3].currentLevel >= 2 },
      { label: 'Finishes', done: st.rating >= 4 },
      { label: 'Complete', done: st.rating >= 5 },
    ];
    const completedCount = milestones.reduce((cnt, m) => cnt + (m.done ? 1 : 0), 0);
    const lineY = 40;
    const padX = 25;
    const gap = 46;
    return (
      <svg viewBox="0 0 280 80" className="w-full">
        <line x1={padX} y1={lineY} x2={padX + (milestones.length - 1) * gap} y2={lineY} stroke="#21262d" strokeWidth={2} />
        {milestones.map((ms, i) => {
          const nodeCx = padX + i * gap;
          return (
            <g key={i}>
              {i > 0 && ms.done && (
                <line x1={padX + (i - 1) * gap} y1={lineY} x2={nodeCx} y2={lineY} stroke="#22c55e" strokeWidth={2} opacity={0.6} />
              )}
              <circle cx={nodeCx} cy={lineY} r={8} fill={ms.done ? '#22c55e' : '#21262d'} stroke={ms.done ? '#22c55e' : '#30363d'} strokeWidth={1.5} />
              {ms.done && (
                <path d={`M${nodeCx - 3},${lineY} L${nodeCx - 1},${lineY + 3} L${nodeCx + 3},${lineY - 2}`} fill="none" stroke="#0d1117" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              )}
              <text x={nodeCx} y={lineY - 16} textAnchor="middle" fill={ms.done ? '#c9d1d9' : '#484f58'} fontSize={7} fontWeight={ms.done ? 'bold' : 'normal'} fontFamily="system-ui">{ms.label}</text>
            </g>
          );
        })}
        <text x={140} y={70} textAnchor="middle" fill="#8b949e" fontSize={8} fontFamily="system-ui">{completedCount}/{milestones.length} milestones completed</text>
      </svg>
    );
  }

  // 6. Revenue Impact Bars
  function revenueImpactBars(): React.JSX.Element {
    const revItems = [
      { name: 'Match Day', value: st.revenuePerMatch, color: '#22c55e' },
      { name: 'Events', value: Math.round(st.revenuePerMatch * 0.3), color: '#3b82f6' },
      { name: 'Sponsorship', value: Math.round(st.revenuePerMatch * 0.5), color: '#d97706' },
      { name: 'Other', value: Math.round(st.revenuePerMatch * 0.15), color: '#8b5cf6' },
    ];
    const maxRev = Math.max(...revItems.map((ri) => ri.value));
    const maxBarW = 160;
    return (
      <svg viewBox="0 0 280 110" className="w-full">
        {revItems.map((item, i) => {
          const y = 8 + i * 24;
          const barW = maxRev > 0 ? (item.value / maxRev) * maxBarW : 0;
          return (
            <g key={i}>
              <text x={0} y={y + 12} fill="#8b949e" fontSize={9} fontFamily="system-ui">{item.name}</text>
              <rect x={68} y={y} width={maxBarW} height={14} rx={2} fill="#21262d" />
              <rect x={68} y={y} width={Math.max(barW, 0)} height={14} rx={2} fill={item.color} opacity={0.8} />
              <text x={68 + maxBarW + 6} y={y + 11} fill="#c9d1d9" fontSize={8} fontFamily="system-ui">{formatCost(item.value)}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 7. Stadium Comparison Gauge (semi-circular 0-100)
  function stadiumComparisonGauge(): React.JSX.Element {
    const gaugeScore = Math.min(100, Math.round(
      (st.capacity / 80000) * 40 +
      (st.rating / 5) * 30 +
      (st.attendancePct / 100) * 30
    ));
    const cx = 100, cy = 95, r = 80;
    const sx = cx - r, sy = cy;
    const exFull = cx + r, eyFull = cy;
    const valAngle = Math.PI * (1 - gaugeScore / 100);
    const exVal = cx + r * Math.cos(valAngle);
    const eyVal = cy - r * Math.sin(valAngle);
    const gaugeColor = gaugeScore >= 70 ? '#22c55e' : gaugeScore >= 40 ? '#eab308' : '#ef4444';
    return (
      <svg viewBox="0 0 200 120" className="w-full">
        <path d={`M${sx},${sy} A${r},${r} 0 0 0 ${exFull},${eyFull}`} fill="none" stroke="#21262d" strokeWidth={10} strokeLinecap="round" />
        <path d={`M${sx},${sy} A${r},${r} 0 0 0 ${exVal},${eyVal}`} fill="none" stroke={gaugeColor} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#c9d1d9" fontSize={22} fontWeight="bold" fontFamily="system-ui">{gaugeScore}</text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#8b949e" fontSize={8} fontFamily="system-ui">Stadium Score</text>
        <text x={cx - r} y={cy + 18} textAnchor="middle" fill="#484f58" fontSize={7} fontFamily="system-ui">0</text>
        <text x={cx} y={8} textAnchor="middle" fill="#484f58" fontSize={7} fontFamily="system-ui">50</text>
        <text x={cx + r} y={cy + 18} textAnchor="middle" fill="#484f58" fontSize={7} fontFamily="system-ui">100</text>
      </svg>
    );
  }

  // 8. Facility Condition Bars
  function facilityConditionBars(): React.JSX.Element {
    const condItems = [
      { name: 'Seating', pct: (st.seatingLevel / 5) * 100, color: '#22c55e' },
      { name: 'VIP Area', pct: (st.vipLevel / 5) * 100, color: '#d97706' },
      { name: 'Pitch', pct: (st.upgrades[2].currentLevel / 5) * 100, color: '#16a34a' },
      { name: 'Floodlights', pct: (st.upgrades[3].currentLevel / 5) * 100, color: '#eab308' },
      { name: 'Training', pct: (st.upgrades[5].currentLevel / 5) * 100, color: '#8b5cf6' },
    ];
    const maxBarW = 160;
    return (
      <svg viewBox="0 0 280 130" className="w-full">
        {condItems.map((item, i) => {
          const y = 8 + i * 24;
          return (
            <g key={i}>
              <text x={0} y={y + 12} fill="#8b949e" fontSize={9} fontFamily="system-ui">{item.name}</text>
              <rect x={68} y={y} width={maxBarW} height={14} rx={2} fill="#21262d" />
              <rect x={68} y={y} width={Math.max((item.pct / 100) * maxBarW, 0)} height={14} rx={2} fill={item.color} opacity={0.8} />
              <text x={68 + maxBarW + 6} y={y + 11} fill="#c9d1d9" fontSize={9} fontWeight="bold" fontFamily="system-ui">{Math.round(item.pct)}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 9. Expansion Cost Trend (area chart)
  function expansionCostTrend(): React.JSX.Element {
    const phaseCosts = [4000000, 8000000, 12000000, 16000000, 20000000];
    const cumulativeCosts = phaseCosts.reduce<number[]>((running, cost) => {
      return [...running, (running.length > 0 ? running[running.length - 1] : 0) + cost];
    }, []);
    const maxCost = cumulativeCosts[cumulativeCosts.length - 1];
    const padL = 42, padR = 10, padT = 15, padB = 25;
    const plotW = 210, plotH = 75;
    const xStep = plotW / (cumulativeCosts.length - 1);
    const dataPts = cumulativeCosts.map((val, i) => ({
      x: padL + i * xStep,
      y: padT + plotH - (val / maxCost) * plotH,
    }));
    const areaPts = [
      ...dataPts,
      { x: dataPts[dataPts.length - 1].x, y: padT + plotH },
      { x: dataPts[0].x, y: padT + plotH },
    ];
    const lineStr = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return (
      <svg viewBox="0 0 280 120" className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const gy = padT + plotH - frac * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#21262d" strokeWidth={0.5} />
              <text x={padL - 4} y={gy} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize={7} fontFamily="system-ui">{formatCost(maxCost * frac)}</text>
            </g>
          );
        })}
        <polygon points={toPolyPoints(areaPts)} fill="#d97706" opacity={0.1} />
        <path d={lineStr} fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        {dataPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#d97706" stroke="#0d1117" strokeWidth={1.5} />
            <text x={p.x} y={padT + plotH + 14} textAnchor="middle" fill="#484f58" fontSize={7} fontFamily="system-ui">P{i + 1}</text>
          </g>
        ))}
      </svg>
    );
  }

  // 10. Fan Satisfaction Ring
  function fanSatisfactionRing(): React.JSX.Element {
    const moodScores: Record<FanMood, number> = { happy: 90, neutral: 65, frustrated: 40, angry: 20 };
    const satPct = Math.min(100, Math.round(moodScores[fanMood] + (st.rating * 2)));
    const r = 42, sw = 8;
    const circ = 2 * Math.PI * r;
    const dashOff = circ * (1 - satPct / 100);
    const satColor = satPct >= 75 ? '#22c55e' : satPct >= 50 ? '#eab308' : satPct >= 30 ? '#f97316' : '#ef4444';
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 110 110" className="w-28 h-28 shrink-0">
          <circle cx={55} cy={55} r={r} fill="none" stroke="#21262d" strokeWidth={sw} />
          <circle cx={55} cy={55} r={r} fill="none" stroke={satColor} strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={dashOff} strokeLinecap="round" opacity={0.85} />
          <text x={55} y={52} textAnchor="middle" fill="#c9d1d9" fontSize={18} fontWeight="bold" fontFamily="system-ui">{satPct}</text>
          <text x={55} y={67} textAnchor="middle" fill="#8b949e" fontSize={7} fontFamily="system-ui">out of 100</text>
        </svg>
        <div className="flex-1 space-y-2">
          <div className="text-[10px] text-[#8b949e] uppercase tracking-wider">Fan Satisfaction</div>
          <div className="text-sm font-semibold text-[#c9d1d9]">{fanMoodLabels[fanMood]} Mood</div>
          <div className="text-[10px] text-[#484f58]">Stadium rating: {st.rating}.0</div>
        </div>
      </div>
    );
  }

  // 11. Seat Type Distribution Donut (4-segment via .reduce())
  function seatTypeDonut(): React.JSX.Element {
    const seatInput = [
      { name: 'General', value: 75, color: '#22c55e' },
      { name: 'VIP', value: st.vipLevel * 4, color: '#d97706' },
      { name: 'Corporate', value: 12, color: '#3b82f6' },
      { name: 'Disabled', value: 5, color: '#8b5cf6' },
    ];
    const seatTotal = seatInput.reduce((s, st) => s + st.value, 0);
    const cx = 55, cy = 55, outerR = 45, innerR = 28;
    const seatResult = seatInput.reduce<{ arcs: { d: string; color: string }[]; prevAngle: number }>((acc, seg) => {
      const startA = acc.prevAngle;
      const sweep = seatTotal > 0 ? (seg.value / seatTotal) * 360 : 0;
      const endA = startA + sweep;
      const large = sweep > 180 ? 1 : 0;
      const so = polarToXY(cx, cy, outerR, startA);
      const eo = polarToXY(cx, cy, outerR, endA);
      const si = polarToXY(cx, cy, innerR, endA);
      const ei = polarToXY(cx, cy, innerR, startA);
      const d = `M${so.x},${so.y} A${outerR},${outerR} 0 ${large} 1 ${eo.x},${eo.y} L${si.x},${si.y} A${innerR},${innerR} 0 ${large} 0 ${ei.x},${ei.y} Z`;
      return { arcs: [...acc.arcs, { d, color: seg.color }], prevAngle: endA };
    }, { arcs: [], prevAngle: 0 });
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 110 110" className="w-28 h-28 shrink-0">
          {seatResult.arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={arc.color} opacity={0.8} />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize={12} fontWeight="bold" fontFamily="system-ui">{seatTotal}%</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize={7} fontFamily="system-ui">Allocation</text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {seatInput.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-[#8b949e] flex-1">{seg.name}</span>
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const fanMoodLabels: Record<FanMood, string> = {
    happy: 'Happy',
    neutral: 'Neutral',
    frustrated: 'Frustrated',
    angry: 'Angry',
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border text-sm font-semibold shadow ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-red-900/90 border-red-500/30 text-red-400'
                : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Section 1: Header ===== */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center border border-[#30363d]">
          <Building2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[#c9d1d9]">Stadium Builder</h1>
          <p className="text-xs text-[#8b949e]">Customize and upgrade your home ground</p>
        </div>
        <div className="shrink-0 px-2 py-1 rounded-md bg-[#21262d] border border-[#30363d]">
          <span className="text-[10px] text-[#8b949e]">{club.logo} {club.shortName}</span>
        </div>
      </div>

      {/* ===== Section 2: Stadium Overview Card ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          {/* Editable Stadium Name */}
          <div className="flex items-center gap-2 mb-3">
            {isEditingName ? (
              <input
                type="text"
                value={stadiumName}
                onChange={(e) => setStadiumName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                autoFocus
                className="flex-1 bg-[#0d1117] border border-emerald-500/40 rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500/60"
              />
            ) : (
              <button
                onClick={() => { setIsEditingName(true); setStadiumName(stadiumData.name); }}
                className="flex items-center gap-1.5 group"
              >
                <h2 className="text-base font-bold text-[#c9d1d9] group-hover:text-emerald-400 transition-colors">
                  {stadiumName || stadiumData.name}
                </h2>
                <span className="text-[10px] text-[#484f58] group-hover:text-[#8b949e] transition-colors">edit</span>
              </button>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <StarRating level={stadiumData.rating} size={16} />
            <span className="text-xs text-[#8b949e]">
              {stadiumData.rating}.0 Stadium Rating
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-[#8b949e]">Capacity</span>
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">{formatNumber(stadiumData.capacity)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-[10px] text-[#8b949e]">Avg Attendance</span>
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">{formatNumber(stadiumData.avgAttendance)}</p>
              <p className="text-[10px] text-emerald-400 font-medium">{stadiumData.attendancePct}% full</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Banknote className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-[#8b949e]">Revenue/Match</span>
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">{formatCost(stadiumData.revenuePerMatch)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-[#8b949e]">Season Revenue</span>
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">{formatCost(stadiumData.revenuePerMatch * 19)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Section 3: Stadium SVG Visualization ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Stadium View</h3>
          </div>
          <StadiumSVG capacity={stadiumData.capacity} vipLevel={stadiumData.vipLevel} standNames={standNames} />

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#30363d]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#15803d]" />
              <span className="text-[9px] text-[#8b949e]">Home Stands</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#991b1b] opacity-70" />
              <span className="text-[9px] text-[#8b949e]">Away Section</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#b45309] opacity-80" />
              <span className="text-[9px] text-[#8b949e]">VIP Boxes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-[#fef08a] opacity-60" />
              <span className="text-[9px] text-[#8b949e]">Floodlights</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Section 4: Facility Upgrades ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 px-1">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-[#c9d1d9]">Facility Upgrades</h3>
          <span className="text-[9px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-sm">
            Budget: {formatCost(club.budget ?? 0)}
          </span>
        </div>

        {stadiumData.upgrades.map((upgrade, idx) => {
          const isExpanded = expandedUpgrade === upgrade.id;
          const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
          const cost = getUpgradeCost(upgrade.currentLevel);
          const canAfford = (club.budget ?? 0) >= cost;

          return (
            <motion.div
              key={upgrade.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 * idx }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedUpgrade(prev => (prev === upgrade.id ? null : upgrade.id))}
                className="w-full p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${upgrade.color}15`,
                      borderColor: `${upgrade.color}30`,
                      color: upgrade.color,
                    }}
                  >
                    {upgrade.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#c9d1d9]">{upgrade.name}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ color: upgrade.color, backgroundColor: `${upgrade.color}15` }}
                        >
                          Lv.{upgrade.currentLevel}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#8b949e] transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-60'}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating level={upgrade.currentLevel} size={10} />
                      <span className="text-[10px] text-[#8b949e]">{upgrade.effectDescription}</span>
                    </div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-[#30363d]"
                  >
                    <div className="p-3 space-y-3">
                      <p className="text-xs text-[#8b949e] leading-relaxed">{upgrade.description}</p>

                      {/* Level breakdown */}
                      <div className="space-y-1">
                        {Array.from({ length: upgrade.maxLevel }, (_, lv) => {
                          const levelNum = lv + 1;
                          const isCurrent = levelNum === upgrade.currentLevel;
                          return (
                            <div
                              key={lv}
                              className={`flex items-center gap-2 p-1.5 rounded-lg ${isCurrent ? 'bg-[#21262d] border border-[#30363d]' : ''}`}
                            >
                              <Star
                                size={10}
                                className={levelNum <= upgrade.currentLevel ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}
                              />
                              <span className={`text-[10px] flex-1 ${isCurrent ? 'text-[#c9d1d9] font-medium' : 'text-[#484f58]'}`}>
                                Lv.{levelNum} — {upgrade.levelEffects[lv] ?? 'Unknown'}
                              </span>
                              {isCurrent && (
                                <span className="text-[8px] text-emerald-400 font-bold">CURRENT</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Upgrade button */}
                      {!isMaxed ? (
                        <button
                          onClick={() => handleUpgrade(upgrade)}
                          disabled={!canAfford}
                          className={`w-full rounded-lg font-semibold text-xs py-2 transition-colors ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
                          }`}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 mr-1.5 inline-block" />
                          {canAfford
                            ? `Upgrade to Level ${upgrade.currentLevel + 1} — ${formatCost(cost)}`
                            : `Need ${formatCost(cost)} — Insufficient Budget`}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Maximum Level Reached</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ===== Section 5: Attendance Trend Chart ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Attendance Trend</h3>
            <span className="text-[9px] text-[#484f58]">Last {attendanceData.length} home matches</span>
          </div>
          {attendanceData.length >= 2 ? (
            <AttendanceTrendChart data={attendanceData} capacity={stadiumData.capacity} />
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">Not enough match data yet.</p>
              <p className="text-[10px] text-[#484f58] mt-1">Play home matches to see attendance trends.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ===== Section 6: Stadium Comparison ===== */}
      {currentComparison && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-[#8b949e]" />
              <h3 className="text-xs font-semibold text-[#c9d1d9]">Stadium Comparison</h3>
            </div>
            <StadiumComparisonChart current={currentComparison} comparisons={FAMOUS_STADIUMS} />
          </div>
        </motion.div>
      )}

      {/* ===== Section 7: Match Day Atmosphere ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Match Day Atmosphere</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Fan Mood */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#21262d]">
              <MoodFace mood={fanMood} size={44} />
              <div className="flex-1">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-0.5">Fan Mood</p>
                <p className="text-sm font-semibold text-[#c9d1d9]">{fanMoodLabels[fanMood]}</p>
                <p className="text-[10px] text-[#484f58] mt-0.5">
                  Based on recent {recentHomeResults.length} home result{recentHomeResults.length !== 1 ? 's' : ''} & team morale
                </p>
              </div>
            </div>

            {/* Noise Level */}
            <div className="p-3 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-3.5 w-3.5 text-[#8b949e]" />
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">Noise Level</p>
              </div>
              <NoiseMeter level={noiseLevel} />
            </div>

            {/* Home Advantage */}
            <div className="p-3 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-[#8b949e]" />
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">Home Advantage</p>
              </div>
              <HomeAdvantageBadge rating={homeAdvantage} />
              <p className="text-[10px] text-[#484f58] mt-1.5">
                {homeAdvantage >= 4
                  ? 'The atmosphere gives your team a significant edge.'
                  : homeAdvantage >= 3
                  ? 'A solid home advantage that can swing close matches.'
                  : homeAdvantage >= 2
                  ? 'Moderate home support provides a slight edge.'
                  : 'The crowd atmosphere offers minimal advantage.'}
              </p>
            </div>

            {/* Atmosphere Score Summary */}
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">Overall Atmosphere</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#c9d1d9]">{Math.round((homeAdvantage / 5) * 100)}</span>
                    <span className="text-[10px] text-[#484f58]">/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <MoodFace mood={fanMood} size={20} />
                    <span className="text-[#8b949e]">{fanMoodLabels[fanMood]}</span>
                  </div>
                  <div className="w-px h-4 bg-[#30363d]" />
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-[#8b949e]" />
                    <span className="text-[#8b949e] capitalize">{noiseLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Section 8: Stadium Capacity Ring ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Capacity Ring</h3>
          </div>
          {capacityProgressRing()}
        </div>
      </motion.div>

      {/* ===== Section 9: Facility Completion Donut ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.38 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Facility Completion</h3>
          </div>
          {facilityCompletionDonut()}
        </div>
      </motion.div>

      {/* ===== Section 10: Budget Allocation ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.41 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Budget Allocation</h3>
            <span className="text-[9px] text-[#484f58]">Upgrade investment split</span>
          </div>
          {budgetAllocationBars()}
        </div>
      </motion.div>

      {/* ===== Section 11: Upgrade Priority Radar ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.44 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Upgrade Priority Radar</h3>
          </div>
          {upgradePriorityRadar()}
        </div>
      </motion.div>

      {/* ===== Section 12: Build Progress Timeline ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.47 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Build Progress</h3>
          </div>
          {buildProgressTimeline()}
        </div>
      </motion.div>

      {/* ===== Section 13: Revenue Impact ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.50 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Revenue Impact</h3>
            <span className="text-[9px] text-[#484f58]">Per-match potential</span>
          </div>
          {revenueImpactBars()}
        </div>
      </motion.div>

      {/* ===== Section 14: Stadium Score Gauge ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.53 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Stadium Score Gauge</h3>
            <span className="text-[9px] text-[#484f58]">vs league average</span>
          </div>
          {stadiumComparisonGauge()}
        </div>
      </motion.div>

      {/* ===== Section 15: Facility Condition ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.56 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="h-4 w-4 text-yellow-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Facility Condition</h3>
          </div>
          {facilityConditionBars()}
        </div>
      </motion.div>

      {/* ===== Section 16: Expansion Cost Trend ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.59 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Expansion Cost Trend</h3>
            <span className="text-[9px] text-[#484f58]">5-phase cumulative</span>
          </div>
          {expansionCostTrend()}
        </div>
      </motion.div>

      {/* ===== Section 17: Fan Satisfaction ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.62 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Fan Satisfaction</h3>
          </div>
          {fanSatisfactionRing()}
        </div>
      </motion.div>

      {/* ===== Section 18: Seat Distribution ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.65 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Seat Distribution</h3>
          </div>
          {seatTypeDonut()}
        </div>
      </motion.div>
    </div>
  );
}
