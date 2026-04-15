'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Route, Trophy, Star, Target, Zap, Calendar, TrendingUp, Award, Flame,
  ChevronRight, ArrowRight, Shield, Flag, Crown, Globe, Medal, Crosshair,
  User, Activity, BarChart3, Clock, CircleDot, Footprints, Gift, Swords,
  Mountain, History, Timer, Gem,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// SVG HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

function buildHexPoints(cx: number, cy: number, radius: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
}

function buildRadarDataPoints(
  cx: number,
  cy: number,
  maxRadius: number,
  sides: number,
  values: number[],
): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const r = (values[i] / 100) * maxRadius;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

function buildSemiArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function buildAreaPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const lineParts = points.map((p) => `${p.x},${p.y}`).join(' ');
  return `M ${lineParts} L ${points[points.length - 1].x},${baseY} L ${points[0].x},${baseY} Z`;
}

// ══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════

const TOKENS = {
  black: '#000',
  orange: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  panelDark: '#0d1117',
  panel: '#161b22',
  panelLight: '#21262d',
  border: '#30363d',
  muted: '#8b949e',
  dim: '#484f58',
  text: '#c9d1d9',
} as const;

const DONUT_COLORS = ['#FF5500', '#00E5FF', '#CCFF00', '#FF5500', '#00E5FF'];

// ══════════════════════════════════════════════════════════════════
// ANIMATION CONSTANTS
// ══════════════════════════════════════════════════════════════════

const ANIM_DURATION = 0.25;
const STAGGER = 0.05;

// ══════════════════════════════════════════════════════════════════
// DONUT SEGMENT TYPE
// ══════════════════════════════════════════════════════════════════

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// ══════════════════════════════════════════════════════════════════
// DETERMINISTIC MOCK DATA (outside component)
// ══════════════════════════════════════════════════════════════════

interface MockSeasonData {
  season: number;
  rating: number;
  age: number;
}

const MOCK_CAREER_PROGRESSION: MockSeasonData[] = [
  { season: 1, rating: 42, age: 14 },
  { season: 2, rating: 50, age: 15 },
  { season: 3, rating: 58, age: 16 },
  { season: 4, rating: 65, age: 17 },
  { season: 5, rating: 72, age: 18 },
  { season: 6, rating: 78, age: 19 },
  { season: 7, rating: 83, age: 20 },
  { season: 8, rating: 87, age: 21 },
];

interface MockClubHistoryItem {
  name: string;
  seasons: number;
}

const MOCK_CLUB_HISTORY: MockClubHistoryItem[] = [
  { name: 'Youth Academy', seasons: 3 },
  { name: 'First Club', seasons: 2 },
  { name: 'Development', seasons: 1 },
  { name: 'Peak Club', seasons: 2 },
];

const MOCK_CAREER_PHASES = [
  { label: 'Youth Development', value: 45 },
  { label: 'Breakthrough', value: 70 },
  { label: 'Peak Performance', value: 85 },
  { label: 'Veteran Leadership', value: 30 },
  { label: 'Legend Status', value: 10 },
];

interface MockMilestone {
  label: string;
  season: number;
}

const MOCK_MILESTONES: MockMilestone[] = [
  { label: 'Debut', season: 1 },
  { label: 'First Goal', season: 2 },
  { label: 'First Trophy', season: 4 },
  { label: '50 Goals', season: 5 },
  { label: '100 Apps', season: 6 },
  { label: 'International', season: 6 },
  { label: '100 Goals', season: 8 },
  { label: 'Legend', season: 10 },
];

interface MockTrophyCount {
  label: string;
  count: number;
}

const MOCK_TROPHY_COLLECTION: MockTrophyCount[] = [
  { label: 'League', count: 3 },
  { label: 'Cup', count: 2 },
  { label: 'Super Cup', count: 1 },
  { label: 'Continental', count: 1 },
  { label: 'Individual', count: 4 },
];

const MOCK_ACHIEVEMENT_DENSITY = [2, 5, 8, 12, 10, 15, 18, 14];

const MOCK_STATS_RADAR = [
  { label: 'Goals', value: 78 },
  { label: 'Assists', value: 65 },
  { label: 'Tackles', value: 42 },
  { label: 'Pass Accuracy', value: 71 },
  { label: 'Fitness', value: 88 },
];

const MOCK_SEASON_COMPARISON = [
  { label: 'Goals', best: 28, avg: 14 },
  { label: 'Assists', best: 12, avg: 6 },
  { label: 'Apps', best: 42, avg: 30 },
  { label: 'Rating', best: 8.5, avg: 6.8 },
  { label: 'MoM', best: 8, avg: 3 },
];

const MOCK_FORM_TREND = [7.2, 6.8, 8.1, 7.5, 9.0, 6.2, 7.8, 8.4];

// ══════════════════════════════════════════════════════════════════
// DONUT HELPERS — immutable offset computation
// ══════════════════════════════════════════════════════════════════

interface DonutSegmentRender extends DonutSegment {
  segmentLength: number;
  offset: number;
}

function computeDonutSegments(
  rawItems: { label: string; value: number }[],
): DonutSegmentRender[] {
  const segments: DonutSegment[] = rawItems.reduce<DonutSegment[]>((acc, item) => {
    acc.push({
      label: item.label,
      value: item.value,
      color: DONUT_COLORS[acc.length % DONUT_COLORS.length],
    });
    return acc;
  }, []);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * 70;

  return segments.map((seg, i) => {
    const prevOffset = segments
      .slice(0, i)
      .reduce((running, s) => running + (s.value / Math.max(total, 1)) * circumference, 0);
    const segmentLength = (seg.value / Math.max(total, 1)) * circumference;
    return {
      ...seg,
      segmentLength,
      offset: prevOffset,
    };
  });
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: CareerProgressionLine (Tab 1, SVG #1)
// ══════════════════════════════════════════════════════════════════

function CareerProgressionLine({ data }: { data: MockSeasonData[] }) {
  const svgW = 300;
  const svgH = 200;
  const padX = 35;
  const padTop = 20;
  const padBottom = 28;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padTop - padBottom;
  const minRating = 30;
  const maxRating = 100;

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - ((d.rating - minRating) / (maxRating - minRating)) * chartH,
  }));

  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points, padTop + chartH);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Career progression line chart">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padTop + chartH - ((v - minRating) / (maxRating - minRating)) * chartH;
        return (
          <g key={v}>
            <line
              x1={padX}
              y1={y}
              x2={svgW - padX}
              y2={y}
              stroke={TOKENS.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <text x={padX - 6} y={y + 3} fill={TOKENS.muted} fontSize={7} textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill={TOKENS.orange} fillOpacity={0.12} />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={TOKENS.orange}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={TOKENS.black} stroke={TOKENS.orange} strokeWidth={2} />
          <text x={p.x} y={padTop + chartH + 14} fill={TOKENS.muted} fontSize={6} textAnchor="middle">
            S{data[i].season}
          </text>
          {i % 2 === 0 && (
            <text
              x={p.x}
              y={p.y - 10}
              fill={TOKENS.orange}
              fontSize={7}
              textAnchor="middle"
              fontWeight="bold"
            >
              {data[i].rating}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: ClubHistoryDonut (Tab 1, SVG #2)
// ══════════════════════════════════════════════════════════════════

function ClubHistoryDonut({ clubHistory }: { clubHistory: MockClubHistoryItem[] }) {
  const cx = 100;
  const cy = 85;
  const radius = 60;
  const strokeWidth = 18;
  const total = clubHistory.reduce((sum, c) => sum + c.seasons, 0);
  const circumference = 2 * Math.PI * radius;

  const segments = clubHistory.reduce<DonutSegmentRender[]>((acc, item, i) => {
    const prevOffset = acc.length > 0
      ? acc[acc.length - 1].offset + acc[acc.length - 1].segmentLength
      : 0;
    const segmentLength = (item.seasons / Math.max(total, 1)) * circumference;
    acc.push({
      label: item.name,
      value: item.seasons,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      segmentLength,
      offset: prevOffset,
    });
    return acc;
  }, []);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto" aria-label="Club history donut chart">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.panelLight}
        strokeWidth={strokeWidth}
      />
      {/* Donut segments */}
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.segmentLength} ${circumference - seg.segmentLength}`}
          strokeDashoffset={-seg.offset}
          strokeOpacity={0.85}
          strokeLinecap="butt"
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 2} fill={TOKENS.text} fontSize={14} textAnchor="middle" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 12} fill={TOKENS.muted} fontSize={7} textAnchor="middle">
        Seasons
      </text>
      {/* Legend below */}
      {segments.map((seg, i) => (
        <g key={`legend-${seg.label}`}>
          <rect
            x={4}
            y={165 + i * 14}
            width={8}
            height={8}
            rx={2}
            fill={seg.color}
          />
          <text x={16} y={173 + i * 14} fill={TOKENS.muted} fontSize={7}>
            {seg.label} ({seg.value})
          </text>
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: CareerPhaseRadar (Tab 1, SVG #3)
// ══════════════════════════════════════════════════════════════════

function CareerPhaseRadar({ phases }: { phases: { label: string; value: number }[] }) {
  const cx = 100;
  const cy = 100;
  const maxRadius = 70;
  const sides = phases.length;

  const gridLevels = [25, 50, 75, 100];
  const values = phases.map((p) => p.value);
  const dataPoints = buildRadarDataPoints(cx, cy, maxRadius, sides, values);

  return (
    <svg viewBox="0 0 200 200" className="w-full" aria-label="Career phase radar chart">
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const gridValues = phases.map(() => level);
        const gridPoints = buildRadarDataPoints(cx, cy, maxRadius, sides, gridValues);
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke={TOKENS.border}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        );
      })}
      {/* Axis lines */}
      {phases.map((_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        const x = cx + maxRadius * Math.cos(angle);
        const y = cy + maxRadius * Math.sin(angle);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={TOKENS.border} strokeWidth={1} />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill={TOKENS.lime}
        fillOpacity={0.1}
        stroke={TOKENS.lime}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Data points */}
      {phases.map((phase, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        const r = (phase.value / 100) * maxRadius;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        const lx = cx + (maxRadius + 16) * Math.cos(angle);
        const ly = cy + (maxRadius + 16) * Math.sin(angle);
        return (
          <g key={phase.label}>
            <circle cx={px} cy={py} r={3} fill={TOKENS.black} stroke={TOKENS.lime} strokeWidth={2} />
            <text
              x={lx}
              y={ly + 3}
              fill={TOKENS.text}
              fontSize={6}
              textAnchor="middle"
              fontWeight="bold"
            >
              {phase.label}
            </text>
            <text
              x={lx}
              y={ly + 11}
              fill={TOKENS.lime}
              fontSize={6}
              textAnchor="middle"
            >
              {phase.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: MilestoneTimeline (Tab 2, SVG #4)
// ══════════════════════════════════════════════════════════════════

function MilestoneTimeline({ milestones }: { milestones: MockMilestone[] }) {
  const svgW = 300;
  const svgH = 200;
  const lineY = 80;
  const startX = 20;
  const endX = svgW - 20;
  const maxSeason = Math.max(...milestones.map((m) => m.season), 1);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Milestone timeline">
      {/* Base line */}
      <line
        x1={startX}
        y1={lineY}
        x2={endX}
        y2={lineY}
        stroke={TOKENS.border}
        strokeWidth={2}
      />
      {/* Arrow end */}
      <polygon
        points={`${endX + 8},${lineY} ${endX},${lineY - 4} ${endX},${lineY + 4}`}
        fill={TOKENS.border}
      />
      {/* Milestone nodes */}
      {milestones.map((m) => {
        const xPos = startX + ((m.season - 1) / Math.max(maxSeason - 1, 1)) * (endX - startX);
        const isAchieved = m.season <= 8;
        return (
          <g key={m.label}>
            {/* Vertical connector */}
            <line
              x1={xPos}
              y1={lineY - 18}
              x2={xPos}
              y2={lineY}
              stroke={isAchieved ? TOKENS.orange : TOKENS.dim}
              strokeWidth={1}
            />
            {/* Node circle */}
            <circle
              cx={xPos}
              cy={lineY}
              r={6}
              fill={TOKENS.black}
              stroke={isAchieved ? TOKENS.orange : TOKENS.dim}
              strokeWidth={2}
            />
            {isAchieved && (
              <circle
                cx={xPos}
                cy={lineY}
                r={2.5}
                fill={TOKENS.orange}
              />
            )}
            {/* Label above */}
            <text
              x={xPos}
              y={lineY - 24}
              fill={isAchieved ? TOKENS.text : TOKENS.dim}
              fontSize={6}
              textAnchor="middle"
              fontWeight="bold"
            >
              {m.label}
            </text>
            {/* Season below */}
            <text
              x={xPos}
              y={lineY + 18}
              fill={TOKENS.muted}
              fontSize={6}
              textAnchor="middle"
            >
              S{m.season}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: TrophyCollectionBars (Tab 2, SVG #5)
// ══════════════════════════════════════════════════════════════════

function TrophyCollectionBars({ trophies }: { trophies: MockTrophyCount[] }) {
  const svgW = 300;
  const svgH = 200;
  const padX = 80;
  const padTop = 14;
  const barHeight = 22;
  const gap = 8;
  const maxVal = Math.max(...trophies.map((t) => t.count), 1);
  const chartW = svgW - padX - 20;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Trophy collection bar chart">
      {trophies.map((trophy, i) => {
        const barW = Math.max(4, (trophy.count / maxVal) * chartW);
        const y = padTop + i * (barHeight + gap);
        return (
          <g key={trophy.label}>
            {/* Label */}
            <text
              x={padX - 8}
              y={y + barHeight / 2 + 4}
              fill={TOKENS.text}
              fontSize={8}
              textAnchor="end"
              fontWeight="bold"
            >
              {trophy.label}
            </text>
            {/* Background bar */}
            <rect
              x={padX}
              y={y}
              width={chartW}
              height={barHeight}
              rx={4}
              fill={TOKENS.panelLight}
            />
            {/* Filled bar */}
            <rect
              x={padX}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={TOKENS.cyan}
              fillOpacity={0.8}
            />
            {/* Value */}
            <text
              x={padX + barW + 6}
              y={y + barHeight / 2 + 4}
              fill={TOKENS.cyan}
              fontSize={8}
              fontWeight="bold"
            >
              {trophy.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: AchievementDensityArea (Tab 2, SVG #6)
// ══════════════════════════════════════════════════════════════════

function AchievementDensityArea({ data }: { data: number[] }) {
  const svgW = 300;
  const svgH = 200;
  const padX = 35;
  const padTop = 16;
  const padBottom = 28;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padTop - padBottom;
  const maxVal = Math.max(...data, 1);

  const points = data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - (v / maxVal) * chartH,
  }));

  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points, padTop + chartH);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Achievement density area chart">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padTop + chartH * (1 - f);
        return (
          <g key={f}>
            <line
              x1={padX}
              y1={y}
              x2={svgW - padX}
              y2={y}
              stroke={TOKENS.border}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <text x={padX - 6} y={y + 3} fill={TOKENS.muted} fontSize={7} textAnchor="end">
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill={TOKENS.lime} fillOpacity={0.2} />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={TOKENS.lime}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Points and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={TOKENS.black} stroke={TOKENS.lime} strokeWidth={1.5} />
          <text x={p.x} y={padTop + chartH + 14} fill={TOKENS.muted} fontSize={7} textAnchor="middle">
            S{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: StatsProgressionRadar (Tab 3, SVG #7)
// ══════════════════════════════════════════════════════════════════

function StatsProgressionRadar({ stats }: { stats: { label: string; value: number }[] }) {
  const cx = 100;
  const cy = 100;
  const maxRadius = 70;
  const sides = stats.length;

  const gridLevels = [25, 50, 75, 100];
  const values = stats.map((s) => s.value);
  const dataPoints = buildRadarDataPoints(cx, cy, maxRadius, sides, values);

  return (
    <svg viewBox="0 0 200 200" className="w-full" aria-label="Stats progression radar chart">
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const gridValues = stats.map(() => level);
        const gridPoints = buildRadarDataPoints(cx, cy, maxRadius, sides, gridValues);
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke={TOKENS.border}
            strokeWidth={1}
            strokeDasharray="2,4"
          />
        );
      })}
      {/* Axis lines */}
      {stats.map((_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        const x = cx + maxRadius * Math.cos(angle);
        const y = cy + maxRadius * Math.sin(angle);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={TOKENS.border} strokeWidth={1} />
        );
      })}
      {/* Data shape */}
      <polygon
        points={dataPoints}
        fill={TOKENS.cyan}
        fillOpacity={0.08}
        stroke={TOKENS.cyan}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Data points and labels */}
      {stats.map((stat, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        const r = (stat.value / 100) * maxRadius;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        const lx = cx + (maxRadius + 18) * Math.cos(angle);
        const ly = cy + (maxRadius + 18) * Math.sin(angle);
        return (
          <g key={stat.label}>
            <circle cx={px} cy={py} r={3} fill={TOKENS.black} stroke={TOKENS.cyan} strokeWidth={2} />
            <text x={lx} y={ly + 3} fill={TOKENS.text} fontSize={6} textAnchor="middle" fontWeight="bold">
              {stat.label}
            </text>
            <text x={lx} y={ly + 11} fill={TOKENS.cyan} fontSize={6} textAnchor="middle">
              {stat.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: SeasonComparisonBars (Tab 3, SVG #8)
// ══════════════════════════════════════════════════════════════════

function SeasonComparisonBars({
  data,
}: {
  data: { label: string; best: number; avg: number }[];
}) {
  const svgW = 300;
  const svgH = 200;
  const padX = 60;
  const padTop = 12;
  const barHeight = 12;
  const gap = 5;
  const maxVal = Math.max(...data.map((d) => d.best), 1);
  const chartW = svgW - padX - 30;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Season comparison bar chart">
      {/* Legend */}
      <rect x={padX} y={svgH - 10} width={10} height={5} rx={2} fill={TOKENS.orange} fillOpacity={0.9} />
      <text x={padX + 14} y={svgH - 5} fill={TOKENS.muted} fontSize={7}>Best</text>
      <rect x={padX + 40} y={svgH - 10} width={10} height={5} rx={2} fill={TOKENS.panelLight} stroke={TOKENS.border} strokeWidth={0.5} />
      <text x={padX + 54} y={svgH - 5} fill={TOKENS.muted} fontSize={7}>Average</text>

      {data.map((item) => {
        const bestW = Math.max(4, (item.best / maxVal) * chartW);
        const avgW = Math.max(4, (item.avg / maxVal) * chartW);
        const i = data.indexOf(item);
        const y = padTop + i * ((barHeight * 2) + gap + 6);
        return (
          <g key={item.label}>
            {/* Label */}
            <text
              x={padX - 8}
              y={y + barHeight + 8}
              fill={TOKENS.text}
              fontSize={8}
              textAnchor="end"
              fontWeight="bold"
            >
              {item.label}
            </text>
            {/* Best bar */}
            <rect x={padX} y={y} width={chartW} height={barHeight} rx={3} fill={TOKENS.panelLight} />
            <rect x={padX} y={y} width={bestW} height={barHeight} rx={3} fill={TOKENS.orange} fillOpacity={0.9} />
            <text x={padX + bestW + 5} y={y + barHeight - 2} fill={TOKENS.orange} fontSize={7} fontWeight="bold">
              {item.best}
            </text>
            {/* Avg bar */}
            <rect x={padX} y={y + barHeight + 2} width={chartW} height={barHeight} rx={3} fill={TOKENS.panelLight} stroke={TOKENS.border} strokeWidth={0.5} />
            <rect
              x={padX}
              y={y + barHeight + 2}
              width={avgW}
              height={barHeight}
              rx={3}
              fill={TOKENS.border}
              fillOpacity={0.7}
            />
            <text x={padX + avgW + 5} y={y + barHeight * 2 + 2} fill={TOKENS.muted} fontSize={7}>
              {item.avg}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: FormTrendLine (Tab 3, SVG #9)
// ══════════════════════════════════════════════════════════════════

function FormTrendLine({ data }: { data: number[] }) {
  const svgW = 300;
  const svgH = 200;
  const padX = 30;
  const padTop = 16;
  const padBottom = 28;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padTop - padBottom;
  const minVal = 0;
  const maxVal = 10;

  const points = data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padTop + chartH - ((v - minVal) / (maxVal - minVal)) * chartH,
  }));

  const linePath = buildLinePath(points);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Form trend line chart">
      {/* Grid lines */}
      {[0, 2, 4, 6, 8, 10].map((v) => {
        const y = padTop + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
        return (
          <g key={v}>
            <line
              x1={padX}
              y1={y}
              x2={svgW - padX}
              y2={y}
              stroke={TOKENS.border}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <text x={padX - 6} y={y + 3} fill={TOKENS.muted} fontSize={7} textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}
      {/* Form zone band */}
      <rect
        x={padX}
        y={padTop + chartH - (4 / 10) * chartH}
        width={chartW}
        height={(4 / 10) * chartH}
        fill={TOKENS.orange}
        fillOpacity={0.04}
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={TOKENS.lime}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={TOKENS.black} stroke={TOKENS.lime} strokeWidth={1.5} />
          <text x={p.x} y={p.y - 9} fill={TOKENS.lime} fontSize={7} textAnchor="middle" fontWeight="bold">
            {data[i].toFixed(1)}
          </text>
          <text x={p.x} y={padTop + chartH + 14} fill={TOKENS.muted} fontSize={7} textAnchor="middle">
            M{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: LegacyScoreGauge (Tab 4, SVG #10)
// ══════════════════════════════════════════════════════════════════

function LegacyScoreGauge({ score }: { score: number }) {
  const cx = 100;
  const cy = 110;
  const radius = 80;
  const strokeWidth = 14;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  const scoreAngle = startAngle + (score / 100) * Math.PI;
  const arcPath = buildSemiArcPath(cx, cy, radius, startAngle, scoreAngle);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto" aria-label="Legacy score gauge">
      {/* Background arc */}
      <path
        d={buildSemiArcPath(cx, cy, radius, startAngle, endAngle)}
        fill="none"
        stroke={TOKENS.panelLight}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Score arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={TOKENS.orange}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((val) => {
        const angle = startAngle + (val / 100) * Math.PI;
        const x1 = cx + (radius + strokeWidth / 2 + 4) * Math.cos(angle);
        const y1 = cy + (radius + strokeWidth / 2 + 4) * Math.sin(angle);
        const x2 = cx + (radius + strokeWidth / 2 + 10) * Math.cos(angle);
        const y2 = cy + (radius + strokeWidth / 2 + 10) * Math.sin(angle);
        return (
          <g key={val}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={TOKENS.muted} strokeWidth={1} />
            <text
              x={cx + (radius + strokeWidth / 2 + 18) * Math.cos(angle)}
              y={cy + (radius + strokeWidth / 2 + 18) * Math.sin(angle) + 3}
              fill={TOKENS.muted}
              fontSize={6}
              textAnchor="middle"
            >
              {val}
            </text>
          </g>
        );
      })}
      {/* Score text */}
      <text x={cx} y={cy - 6} fill={TOKENS.text} fontSize={28} textAnchor="middle" fontWeight="bold">
        {score}
      </text>
      <text x={cx} y={cy + 10} fill={TOKENS.muted} fontSize={8} textAnchor="middle">
        LEGACY SCORE
      </text>
      {/* Min/Max labels */}
      <text x={cx - radius - 6} y={cy + 26} fill={TOKENS.dim} fontSize={7} textAnchor="middle">
        0
      </text>
      <text x={cx + radius + 6} y={cy + 26} fill={TOKENS.dim} fontSize={7} textAnchor="middle">
        100
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: HallOfFameReadinessRing (Tab 4, SVG #11)
// ══════════════════════════════════════════════════════════════════

function HallOfFameReadinessRing({ readiness }: { readiness: number }) {
  const cx = 100;
  const cy = 100;
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (readiness / 100) * circumference;
  const gapAngle = 90;
  const gapLength = (gapAngle / 360) * circumference;
  const effectiveLength = circumference - gapLength;
  const startOffset = circumference * 0.25 + gapLength / 2;

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto" aria-label="Hall of fame readiness ring">
      {/* Background ring (with gap) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.panelLight}
        strokeWidth={strokeWidth}
        strokeDasharray={`${effectiveLength} ${gapLength}`}
        strokeDashoffset={-startOffset}
        strokeLinecap="round"
      />
      {/* Filled ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.cyan}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filledLength} ${circumference - filledLength}`}
        strokeDashoffset={-startOffset}
        strokeLinecap="round"
      />
      {/* Center content */}
      <text x={cx} y={cy - 6} fill={TOKENS.text} fontSize={26} textAnchor="middle" fontWeight="bold">
        {readiness}%
      </text>
      <text x={cx} y={cy + 12} fill={TOKENS.cyan} fontSize={8} textAnchor="middle" fontWeight="bold">
        HOF READY
      </text>
      {/* Decorative marks */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (startOffset / circumference) * 2 * Math.PI + (i / 4) * (effectiveLength / circumference) * 2 * Math.PI;
        const x = cx + (radius + strokeWidth / 2 + 6) * Math.cos(angle);
        const y = cy + (radius + strokeWidth / 2 + 6) * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r={1.5} fill={TOKENS.dim} />;
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// INLINE SVG COMPONENT: HistoricalComparisonDonut (Tab 4, SVG #12)
// ══════════════════════════════════════════════════════════════════

function HistoricalComparisonDonut({
  segments: rawSegments,
}: {
  segments: { label: string; value: number }[];
}) {
  const cx = 100;
  const cy = 85;
  const radius = 55;
  const strokeWidth = 20;

  const total = rawSegments.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * radius;

  const segments = rawSegments.reduce<DonutSegmentRender[]>((acc, item, i) => {
    const prevOffset = acc.length > 0
      ? acc[acc.length - 1].offset + acc[acc.length - 1].segmentLength
      : 0;
    const segmentLength = (item.value / Math.max(total, 1)) * circumference;
    acc.push({
      label: item.label,
      value: item.value,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      segmentLength,
      offset: prevOffset,
    });
    return acc;
  }, []);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto" aria-label="Historical comparison donut chart">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.panelLight}
        strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.segmentLength} ${circumference - seg.segmentLength}`}
          strokeDashoffset={-seg.offset}
          strokeOpacity={0.85}
          strokeLinecap="butt"
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 2} fill={TOKENS.text} fontSize={14} textAnchor="middle" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} fill={TOKENS.muted} fontSize={7} textAnchor="middle">
        TOTAL PTS
      </text>
      {/* Legend */}
      {segments.map((seg, i) => (
        <g key={`legend-${seg.label}`}>
          <rect x={4} y={165 + i * 14} width={8} height={8} rx={2} fill={seg.color} />
          <text x={16} y={173 + i * 14} fill={TOKENS.text} fontSize={7} fontWeight="bold">
            {seg.label}
          </text>
          <text x={192} y={173 + i * 14} fill={TOKENS.muted} fontSize={7} textAnchor="end">
            {seg.value} ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
          </text>
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// CAREER PHASE COMPUTATION
// ══════════════════════════════════════════════════════════════════

function computeCareerPhase(
  age: number,
  overall: number,
  seasonsPlayed: number,
  trophyCount: number,
): string {
  if (age <= 17) return 'Youth';
  if (age <= 21 && overall < 75) return 'Breakthrough';
  if (overall >= 88 && trophyCount >= 5) return 'Legend';
  if (age >= 33) return 'Veteran';
  if (seasonsPlayed >= 5 && overall >= 80) return 'Peak';
  return 'Breakthrough';
}

// ══════════════════════════════════════════════════════════════════
// COMPUTED DATA INTERFACE
// ══════════════════════════════════════════════════════════════════

interface ComputedTimelineData {
  playerName: string;
  playerAge: number;
  playerOverall: number;
  playerPosition: string;
  clubName: string;
  seasonsPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalApps: number;
  totalTrophies: number;
  currentSeason: number;
  careerPhase: string;
  careerProgression: MockSeasonData[];
  clubHistory: MockClubHistoryItem[];
  careerPhases: { label: string; value: number }[];
  milestones: MockMilestone[];
  trophyCollection: MockTrophyCount[];
  achievementDensity: number[];
  statsRadar: { label: string; value: number }[];
  seasonComparison: { label: string; best: number; avg: number }[];
  formTrend: number[];
  legacyScore: number;
  hofReadiness: number;
  historicalSegments: { label: string; value: number }[];
}

// ══════════════════════════════════════════════════════════════════
// STAT CARD SUB-COMPONENT
// ══════════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
      className="flex flex-col items-center gap-1 p-3 bg-[#161b22] border border-[#30363d] rounded-lg"
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: color + '15' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-base font-bold" style={{ color }}>{value}</span>
      <span className="text-[9px] text-[#8b949e] uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SVG CHART CARD WRAPPER
// ══════════════════════════════════════════════════════════════════

function ChartCard({
  title,
  subtitle,
  icon,
  delay,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <Card className="bg-[#161b22] border-[#30363d] text-white">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-[#21262d] rounded-lg">
                {icon}
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-[#c9d1d9]">{title}</CardTitle>
                <p className="text-[9px] text-[#8b949e]">{subtitle}</p>
              </div>
            </div>
            <Badge className="text-[8px] px-1.5 py-0 bg-[#21262d] text-[#8b949e] border-[#30363d] hover:bg-[#21262d]">
              SVG
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function PlayerCareerTimelineEnhanced() {
  const [activeTab, setActiveTab] = useState('journey');
  const gameState = useGameStore((s) => s.gameState);

  // ══════════════════════════════════════════════════════════════
  // COMPUTED DATA
  // ══════════════════════════════════════════════════════════════

  const data: ComputedTimelineData | null = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, currentSeason, seasons, recentResults } = gameState;
    const career = player.careerStats;
    const totalGoals = career.totalGoals;
    const totalAssists = career.totalAssists;
    const totalApps = career.totalAppearances;
    const totalTrophies = career.trophies?.length ?? 0;
    const seasonsPlayed = career.seasonsPlayed || seasons.length;
    const phase = computeCareerPhase(player.age, player.overall, seasonsPlayed, totalTrophies);

    // ── Career Progression ──
    const careerProgression: MockSeasonData[] = MOCK_CAREER_PROGRESSION.map((mock, i) => {
      const realSeason = seasons[i];
      if (realSeason) {
        return {
          season: realSeason.number,
          rating: Math.min(99, player.overall - (currentSeason - realSeason.number) * 2 + Math.floor(Math.random() * 3)),
          age: player.age - (currentSeason - realSeason.number),
        };
      }
      return mock;
    });

    // ── Club History via .reduce() ──
    const clubHistory: MockClubHistoryItem[] = [
      { name: `${currentClub.name} Youth`, seasons: Math.min(3, seasonsPlayed) },
      ...MOCK_CLUB_HISTORY.slice(1).filter((_, i) => i < Math.max(0, seasonsPlayed - 3)),
      { name: currentClub.name, seasons: Math.max(1, seasonsPlayed - 3) },
    ];

    // ── Career Phases for Radar ──
    const careerPhases = MOCK_CAREER_PHASES.map((p, i) => {
      const valMap = [
        Math.min(100, player.age * 5),
        Math.min(100, player.overall),
        Math.min(100, player.overall + (totalGoals > 50 ? 10 : 0)),
        Math.min(100, player.age * 2),
        Math.min(100, Math.floor((totalTrophies * 15) + (totalGoals / 5))),
      ];
      return { label: p.label, value: valMap[i] ?? p.value };
    });

    // ── Milestones ──
    const activeMilestones: MockMilestone[] = MOCK_MILESTONES.filter((m) => {
      if (m.label === 'Debut') return totalApps >= 1;
      if (m.label === 'First Goal') return totalGoals >= 1;
      if (m.label === 'First Trophy') return totalTrophies >= 1;
      if (m.label === '50 Goals') return totalGoals >= 50;
      if (m.label === '100 Apps') return totalApps >= 100;
      if (m.label === 'International') return gameState.internationalCareer.caps >= 1;
      if (m.label === '100 Goals') return totalGoals >= 100;
      if (m.label === 'Legend') return player.overall >= 90 && totalTrophies >= 5;
      return true;
    });

    // ── Trophy Collection ──
    const trophyNames = (career.trophies ?? []).map((t) => t.name.toLowerCase());
    const trophyCollection: MockTrophyCount[] = MOCK_TROPHY_COLLECTION.map((cat) => {
      if (cat.label === 'League') return { ...cat, count: trophyNames.filter((n) => n.includes('league') || n.includes('premier')).length || cat.count };
      if (cat.label === 'Cup') return { ...cat, count: trophyNames.filter((n) => n.includes('cup')).length || cat.count };
      if (cat.label === 'Continental') return { ...cat, count: trophyNames.filter((n) => n.includes('champion') || n.includes('europa')).length || cat.count };
      if (cat.label === 'Individual') return { ...cat, count: gameState.seasonAwards?.length ?? cat.count };
      return cat;
    });

    // ── Achievement Density ──
    const unlockedAchs = gameState.achievements?.filter((a) => a.unlocked).length ?? 0;
    const achievementDensity = MOCK_ACHIEVEMENT_DENSITY.map((base, i) => {
      const seasonAchs = seasons[i]?.achievements?.length ?? 0;
      return i < seasons.length ? seasonAchs + Math.floor(unlockedAchs / Math.max(seasons.length, 1)) : base;
    });

    // ── Stats Radar ──
    const statsRadar = MOCK_STATS_RADAR.map((s) => {
      if (s.label === 'Goals') return { ...s, value: Math.min(100, totalGoals * 2) };
      if (s.label === 'Assists') return { ...s, value: Math.min(100, totalAssists * 3) };
      if (s.label === 'Fitness') return { ...s, value: player.fitness };
      if (s.label === 'Pass Accuracy') return { ...s, value: player.attributes.passing };
      return s;
    });

    // ── Season Comparison ──
    const seasonStats = seasons.map((s) => s.playerStats);
    const bestGoals = seasonStats.length > 0 ? Math.max(...seasonStats.map((s) => s.goals), player.seasonStats.goals) : MOCK_SEASON_COMPARISON[0].best;
    const avgGoals = seasonStats.length > 0 ? Math.round(seasonStats.reduce((sum, s) => sum + s.goals, 0) / seasonStats.length) : MOCK_SEASON_COMPARISON[0].avg;
    const seasonComparison = MOCK_SEASON_COMPARISON.map((item) => {
      if (item.label === 'Goals') return { ...item, best: bestGoals, avg: avgGoals };
      if (item.label === 'Assists') {
        const b = seasonStats.length > 0 ? Math.max(...seasonStats.map((s) => s.assists)) : item.best;
        const a = seasonStats.length > 0 ? Math.round(seasonStats.reduce((sum, s) => sum + s.assists, 0) / seasonStats.length) : item.avg;
        return { ...item, best: b, avg: a };
      }
      return item;
    });

    // ── Form Trend (from recent results) ──
    const formTrend = recentResults
      .slice(-8)
      .map((r) => r.playerRating)
      .filter((r): r is number => r > 0)
      .slice(-8);
    const filledForm = formTrend.length >= 3 ? formTrend : MOCK_FORM_TREND;

    // ── Legacy Score ──
    const goalScore = Math.min(30, Math.floor(totalGoals / 10));
    const trophyScore = Math.min(30, totalTrophies * 6);
    const appScore = Math.min(20, Math.floor(totalApps / 25));
    const ratingScore = Math.min(20, Math.floor(player.overall / 5));
    const legacyScore = Math.min(100, goalScore + trophyScore + appScore + ratingScore);

    // ── Hall of Fame Readiness ──
    const hofReadiness = Math.min(100, Math.floor(
      (totalGoals / 200) * 25 +
      (totalTrophies / 10) * 25 +
      (totalApps / 500) * 25 +
      (player.overall / 90) * 25
    ));

    // ── Historical Comparison Segments ──
    const historicalSegments = [
      { label: 'Goals', value: totalGoals || 45 },
      { label: 'Assists', value: totalAssists || 22 },
      { label: 'Awards', value: totalTrophies + (gameState.seasonAwards?.length ?? 0) || 8 },
      { label: 'Years', value: seasonsPlayed || 6 },
    ];

    return {
      playerName: player.name,
      playerAge: player.age,
      playerOverall: player.overall,
      playerPosition: player.position,
      clubName: currentClub.name,
      seasonsPlayed,
      totalGoals,
      totalAssists,
      totalApps,
      totalTrophies,
      currentSeason,
      careerPhase: phase,
      careerProgression,
      clubHistory,
      careerPhases,
      milestones: activeMilestones,
      trophyCollection,
      achievementDensity,
      statsRadar,
      seasonComparison,
      formTrend: filledForm,
      legacyScore,
      hofReadiness,
      historicalSegments,
    };
  }, [gameState]);

  // ══════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════

  if (!gameState || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: TOKENS.black, fontFamily: "'Monaspace Neon', 'Space Grotesk', monospace" }}
      >
        <div className="text-center">
          <Route className="h-10 w-10 mx-auto mb-3" style={{ color: TOKENS.orange }} />
          <p className="text-sm" style={{ color: TOKENS.muted }}>
            No career data available. Start a new career to see your timeline.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // TAB METADATA
  // ══════════════════════════════════════════════════════════════

  const tabConfig = [
    {
      value: 'journey',
      label: 'Career Journey',
      icon: <Route className="h-3.5 w-3.5" />,
    },
    {
      value: 'moments',
      label: 'Key Moments',
      icon: <Star className="h-3.5 w-3.5" />,
    },
    {
      value: 'stats',
      label: 'Statistics Evolution',
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
    {
      value: 'legacy',
      label: 'Legacy',
      icon: <Crown className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor: TOKENS.black,
        fontFamily: "'Monaspace Neon', 'Space Grotesk', monospace",
        color: TOKENS.text,
      }}
    >
      <div className="max-w-lg mx-auto pb-24">

        {/* ══════════════════════════════════════════════════════════
            HEADER SECTION
            ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6 pt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 flex items-center justify-center rounded-lg border"
              style={{ backgroundColor: TOKENS.orange + '15', borderColor: TOKENS.orange + '40' }}
            >
              <Route className="h-5 w-5" style={{ color: TOKENS.orange }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate" style={{ color: TOKENS.text }}>
                {data.playerName}
              </h1>
              <p className="text-xs truncate" style={{ color: TOKENS.muted }}>
                {data.clubName} · {data.playerPosition} · Age {data.playerAge} · OVR {data.playerOverall}
              </p>
            </div>
            <Badge
              className="text-[9px] px-2 py-1 rounded-lg font-bold border"
              style={{
                backgroundColor: TOKENS.orange + '15',
                borderColor: TOKENS.orange + '40',
                color: TOKENS.orange,
              }}
            >
              {data.careerPhase}
            </Badge>
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-4 gap-2">
            <StatCard
              icon={<Crosshair className="h-4 w-4" />}
              label="Goals"
              value={data.totalGoals}
              color={TOKENS.orange}
              delay={0.05}
            />
            <StatCard
              icon={<ArrowRight className="h-4 w-4" />}
              label="Assists"
              value={data.totalAssists}
              color={TOKENS.cyan}
              delay={0.1}
            />
            <StatCard
              icon={<Trophy className="h-4 w-4" />}
              label="Trophies"
              value={data.totalTrophies}
              color={TOKENS.lime}
              delay={0.15}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" />}
              label="Seasons"
              value={data.seasonsPlayed}
              color="#a78bfa"
              delay={0.2}
            />
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════
            TABS
            ══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: ANIM_DURATION, delay: 0.25 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg h-auto p-1 mb-5">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-[10px] font-bold transition-all data-[state=active]:bg-[#21262d] data-[state=active]:text-white data-[state=active]:shadow-none text-[#8b949e] hover:text-[#c9d1d9]"
                  style={{
                    fontFamily: "'Monaspace Neon', 'Space Grotesk', monospace",
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ════════════════════════════════════════════════════════
                TAB 1: CAREER JOURNEY (3 SVGs)
                Stroke: #FF5500, #00E5FF, #CCFF00
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="journey">
              <div className="space-y-4">
                {/* Career Journey Sub-header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: ANIM_DURATION, delay: STAGGER }}
                  className="flex items-center gap-2 mb-2"
                >
                  <Mountain className="h-4 w-4" style={{ color: TOKENS.orange }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TOKENS.dim }}>
                    From Youth to Professional — {data.seasonsPlayed} Seasons Tracked
                  </span>
                </motion.div>

                {/* SVG #1: CareerProgressionLine — 8-season line chart */}
                <ChartCard
                  title="Rating Progression"
                  subtitle="8-season trajectory from youth to current level"
                  icon={<TrendingUp className="h-4 w-4" style={{ color: TOKENS.orange }} />}
                  delay={STAGGER * 2}
                >
                  <CareerProgressionLine data={data.careerProgression} />
                </ChartCard>

                {/* SVG #2: ClubHistoryDonut — 5 segments */}
                <ChartCard
                  title="Club History"
                  subtitle="Season distribution across career stages"
                  icon={<Flag className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
                  delay={STAGGER * 3}
                >
                  <div className="flex justify-center">
                    <ClubHistoryDonut clubHistory={data.clubHistory} />
                  </div>
                </ChartCard>

                {/* SVG #3: CareerPhaseRadar — 5-axis */}
                <ChartCard
                  title="Career Phase Analysis"
                  subtitle="Multi-axis view of career development areas"
                  icon={<Activity className="h-4 w-4" style={{ color: TOKENS.lime }} />}
                  delay={STAGGER * 4}
                >
                  <CareerPhaseRadar phases={data.careerPhases} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                TAB 2: KEY MOMENTS (3 SVGs)
                Stroke: #FF5500, #00E5FF, #CCFF00
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="moments">
              <div className="space-y-4">
                {/* Key Moments Sub-header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: ANIM_DURATION, delay: STAGGER }}
                  className="flex items-center gap-2 mb-2"
                >
                  <Medal className="h-4 w-4" style={{ color: TOKENS.lime }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TOKENS.dim }}>
                    Career Milestones & Achievements — {data.milestones.length} Unlocked
                  </span>
                </motion.div>

                {/* SVG #4: MilestoneTimeline — 8-node horizontal */}
                <ChartCard
                  title="Milestone Timeline"
                  subtitle="Key career moments mapped across seasons"
                  icon={<Gem className="h-4 w-4" style={{ color: TOKENS.orange }} />}
                  delay={STAGGER * 2}
                >
                  <MilestoneTimeline milestones={data.milestones} />
                </ChartCard>

                {/* SVG #5: TrophyCollectionBars — 5 bars */}
                <ChartCard
                  title="Trophy Collection"
                  subtitle="Breakdown of honours by competition type"
                  icon={<Trophy className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
                  delay={STAGGER * 3}
                >
                  <TrophyCollectionBars trophies={data.trophyCollection} />
                </ChartCard>

                {/* SVG #6: AchievementDensityArea — 8-season area */}
                <ChartCard
                  title="Achievement Density"
                  subtitle="Accomplishments accumulated per season"
                  icon={<Target className="h-4 w-4" style={{ color: TOKENS.lime }} />}
                  delay={STAGGER * 4}
                >
                  <AchievementDensityArea data={data.achievementDensity} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                TAB 3: STATISTICS EVOLUTION (3 SVGs)
                Stroke: #00E5FF, #FF5500, #CCFF00
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="stats">
              <div className="space-y-4">
                {/* Statistics Sub-header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: ANIM_DURATION, delay: STAGGER }}
                  className="flex items-center gap-2 mb-2"
                >
                  <BarChart3 className="h-4 w-4" style={{ color: TOKENS.cyan }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TOKENS.dim }}>
                    Performance Metrics & Seasonal Trends
                  </span>
                </motion.div>

                {/* SVG #7: StatsProgressionRadar — 5-axis */}
                <ChartCard
                  title="Stats Radar"
                  subtitle="Current season attribute distribution"
                  icon={<Crosshair className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
                  delay={STAGGER * 2}
                >
                  <StatsProgressionRadar stats={data.statsRadar} />
                </ChartCard>

                {/* SVG #8: SeasonComparisonBars — 5 bars */}
                <ChartCard
                  title="Season Comparison"
                  subtitle="Best season vs career average"
                  icon={<Swords className="h-4 w-4" style={{ color: TOKENS.orange }} />}
                  delay={STAGGER * 3}
                >
                  <SeasonComparisonBars data={data.seasonComparison} />
                </ChartCard>

                {/* SVG #9: FormTrendLine — 8-match recent form */}
                <ChartCard
                  title="Recent Form"
                  subtitle="Last 8 match ratings trend"
                  icon={<Timer className="h-4 w-4" style={{ color: TOKENS.lime }} />}
                  delay={STAGGER * 4}
                >
                  <FormTrendLine data={data.formTrend} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                TAB 4: LEGACY (3 SVGs)
                Stroke: #FF5500, #00E5FF, #CCFF00
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="legacy">
              <div className="space-y-4">
                {/* Legacy Sub-header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: ANIM_DURATION, delay: STAGGER }}
                  className="flex items-center gap-2 mb-2"
                >
                  <Crown className="h-4 w-4" style={{ color: TOKENS.orange }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TOKENS.dim }}>
                    Legacy Score: {data.legacyScore}/100 · HOF Readiness: {data.hofReadiness}%
                  </span>
                </motion.div>

                {/* SVG #10: LegacyScoreGauge — semi-circular 0-100 */}
                <ChartCard
                  title="Legacy Score"
                  subtitle="Composite rating based on goals, trophies, appearances & rating"
                  icon={<Crown className="h-4 w-4" style={{ color: TOKENS.orange }} />}
                  delay={STAGGER * 2}
                >
                  <div className="flex justify-center">
                    <LegacyScoreGauge score={data.legacyScore} />
                  </div>
                </ChartCard>

                {/* SVG #11: HallOfFameReadinessRing — circular 0-100 */}
                <ChartCard
                  title="Hall of Fame Readiness"
                  subtitle="Progress towards legendary status"
                  icon={<Award className="h-4 w-4" style={{ color: TOKENS.cyan }} />}
                  delay={STAGGER * 3}
                >
                  <div className="flex justify-center">
                    <HallOfFameReadinessRing readiness={data.hofReadiness} />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-[#21262d] rounded-lg">
                      <p className="text-[9px] text-[#8b949e] uppercase">Goals</p>
                      <p className="text-xs font-bold" style={{ color: TOKENS.orange }}>{data.totalGoals}/200</p>
                    </div>
                    <div className="text-center p-2 bg-[#21262d] rounded-lg">
                      <p className="text-[9px] text-[#8b949e] uppercase">Trophies</p>
                      <p className="text-xs font-bold" style={{ color: TOKENS.cyan }}>{data.totalTrophies}/10</p>
                    </div>
                    <div className="text-center p-2 bg-[#21262d] rounded-lg">
                      <p className="text-[9px] text-[#8b949e] uppercase">Apps</p>
                      <p className="text-xs font-bold" style={{ color: TOKENS.lime }}>{data.totalApps}/500</p>
                    </div>
                    <div className="text-center p-2 bg-[#21262d] rounded-lg">
                      <p className="text-[9px] text-[#8b949e] uppercase">Rating</p>
                      <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>{data.playerOverall}/90</p>
                    </div>
                  </div>
                </ChartCard>

                {/* SVG #12: HistoricalComparisonDonut — 4 segments */}
                <ChartCard
                  title="Historical Comparison"
                  subtitle="Career contribution breakdown by category"
                  icon={<History className="h-4 w-4" style={{ color: TOKENS.lime }} />}
                  delay={STAGGER * 4}
                >
                  <div className="flex justify-center">
                    <HistoricalComparisonDonut segments={data.historicalSegments} />
                  </div>
                </ChartCard>

                {/* Legacy Summary Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: ANIM_DURATION, delay: STAGGER * 6 }}
                  className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4" style={{ color: TOKENS.orange }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TOKENS.dim }}>
                      Legacy Projection
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: TOKENS.muted }}>Career Status</span>
                      <span className="text-xs font-bold" style={{ color: TOKENS.text }}>{data.careerPhase}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: TOKENS.muted }}>Goals per Season</span>
                      <span className="text-xs font-bold" style={{ color: TOKENS.orange }}>
                        {data.seasonsPlayed > 0 ? (data.totalGoals / data.seasonsPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: TOKENS.muted }}>Trophies per Season</span>
                      <span className="text-xs font-bold" style={{ color: TOKENS.cyan }}>
                        {data.seasonsPlayed > 0 ? (data.totalTrophies / data.seasonsPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: TOKENS.muted }}>Avg Match Rating</span>
                      <span className="text-xs font-bold" style={{ color: TOKENS.lime }}>
                        {data.formTrend.length > 0
                          ? (data.formTrend.reduce((sum, v) => sum + v, 0) / data.formTrend.length).toFixed(1)
                          : '0.0'}
                      </span>
                    </div>
                    {/* Legacy progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: TOKENS.dim }}>
                          Legacy Progress
                        </span>
                        <span className="text-[9px] font-bold" style={{ color: TOKENS.orange }}>
                          {data.legacyScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: STAGGER * 7 }}
                          className="h-full rounded-sm"
                          style={{
                            width: `${data.legacyScore}%`,
                            backgroundColor: TOKENS.orange,
                          }}
                        />
                      </div>
                    </div>
                    {/* HOF progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: TOKENS.dim }}>
                          Hall of Fame
                        </span>
                        <span className="text-[9px] font-bold" style={{ color: TOKENS.cyan }}>
                          {data.hofReadiness}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: STAGGER * 8 }}
                          className="h-full rounded-sm"
                          style={{
                            width: `${data.hofReadiness}%`,
                            backgroundColor: TOKENS.cyan,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

          </Tabs>
        </motion.div>

      </div>
    </div>
  );
}
