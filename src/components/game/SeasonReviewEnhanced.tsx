'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Star,
  Award,
  ArrowLeft,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Flame,
  Crown,
  ArrowRight,
  ChevronRight,
  Activity,
  Medal,
  Swords,
  Flag,
  Lightbulb,
  GitBranch,
} from 'lucide-react';

// ============================================================
// Design System Constants
// ============================================================

const COLORS = {
  bg: '#0d1117',
  cardBg: '#161b22',
  innerBg: '#21262d',
  border: '#30363d',
  primaryText: '#e6edf3',
  secondaryText: '#c9d1d9',
  mutedText: '#8b949e',
  dimText: '#484f58',
  emerald: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  cyan: '#06B6D4',
} as const;

const TAB_IDS = ['overview', 'personal', 'team', 'highlights'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Season Overview',
  personal: 'Personal Stats',
  team: 'Team Analysis',
  highlights: 'Highlights',
};

// ============================================================
// Deterministic Seeded Data Generator
// ============================================================

function seededValue(seed: number, index: number, min: number, max: number): number {
  const hash = ((seed * 2654435761 + index * 40503) >>> 0) % 1000;
  return min + (hash / 1000) * (max - min);
}

// ============================================================
// SVG Helper Functions
// ============================================================

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygonPoints(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (360 / sides) * i - 90;
    const p = polarToCartesian(cx, cy, r, angle);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function buildRadarPath(
  cx: number,
  cy: number,
  values: number[],
  maxVal: number,
  sides: number
): string {
  return values
    .map((v, i) => {
      const angle = (360 / sides) * i - 90;
      const r = (v / maxVal) * Math.min(cx, cy) * 0.75;
      const p = polarToCartesian(cx, cy, r, angle);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    })
    .join(' ') + ' Z';
}

function buildDonutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const x1o = cx + outerR * Math.cos(startRad);
  const y1o = cy + outerR * Math.sin(startRad);
  const x2o = cx + outerR * Math.cos(endRad);
  const y2o = cy + outerR * Math.sin(endRad);
  const x1i = cx + innerR * Math.cos(endRad);
  const y1i = cy + innerR * Math.sin(endRad);
  const x2i = cx + innerR * Math.cos(startRad);
  const y2i = cy + innerR * Math.sin(startRad);
  return `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
}

// ============================================================
// Data Derivation Helpers
// ============================================================

interface MatchResultRow {
  week: number;
  result: 'W' | 'D' | 'L';
  goalsFor: number;
  goalsAgainst: number;
  position: number;
  rating: number;
}

function deriveMatchResults(
  season: number,
  results: { homeScore: number; awayScore: number; week: number }[],
  playerClubId: string,
  fixtures: { homeClubId: string; awayClubId: string; matchday: number }[]
): MatchResultRow[] {
  if (results.length > 0) {
    return results.slice(0, 38).map((r, i) => {
      const isHome = fixtures[i]?.homeClubId === playerClubId;
      const gf = isHome ? r.homeScore : r.awayScore;
      const ga = isHome ? r.awayScore : r.homeScore;
      return {
        week: r.week,
        result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
        goalsFor: gf,
        goalsAgainst: ga,
        position: Math.max(1, Math.round(seededValue(season, i, 1, 18))),
        rating: parseFloat(seededValue(season, i + 100, 5.0, 9.5).toFixed(1)),
      };
    });
  }
  return Array.from({ length: 38 }, (_, i) => {
    const gf = Math.round(seededValue(season, i, 0, 3));
    const ga = Math.round(seededValue(season, i + 200, 0, 3));
    return {
      week: i + 1,
      result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
      goalsFor: gf,
      goalsAgainst: ga,
      position: Math.max(1, Math.round(seededValue(season, i + 50, 1, 18))),
      rating: parseFloat(seededValue(season, i + 100, 5.0, 9.5).toFixed(1)),
    };
  });
}

function deriveMonthlyData(
  season: number,
  matchResults: MatchResultRow[]
): { month: string; goalsFor: number; goalsAgainst: number; avgRating: number }[] {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const perMonth = months.map((month, mi) => {
    const start = mi * 4;
    const end = start + 4;
    const slice = matchResults.slice(start, end);
    const goalsFor = slice.reduce((s, m) => s + m.goalsFor, 0);
    const goalsAgainst = slice.reduce((s, m) => s + m.goalsAgainst, 0);
    const avgRating = slice.length > 0
      ? parseFloat((slice.reduce((s, m) => s + m.rating, 0) / slice.length).toFixed(1))
      : 6.0;
    return { month, goalsFor, goalsAgainst, avgRating };
  });
  return perMonth;
}

function getSeasonGrade(
  rating: number,
  goals: number,
  assists: number,
  appearances: number,
  position: number
): { grade: string; color: string; bgColor: string } {
  const ratingScore = Math.min(rating / 10, 1) * 50;
  const contribScore = Math.min((goals + assists * 0.5) / 20, 1) * 30;
  const posScore = Math.max(0, (20 - position) / 19) * 20;
  const total = ratingScore + contribScore + posScore;
  if (total >= 88) return { grade: 'A+', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.15)' };
  if (total >= 78) return { grade: 'A', color: '#34D399', bgColor: 'rgba(52,211,153,0.15)' };
  if (total >= 68) return { grade: 'B+', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.15)' };
  if (total >= 58) return { grade: 'B', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' };
  if (total >= 48) return { grade: 'C', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' };
  if (total >= 35) return { grade: 'D', color: '#F97316', bgColor: 'rgba(249,115,22,0.15)' };
  return { grade: 'F', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' };
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============================================================
// Tab 1 SVGs
// ============================================================

function SeasonResultsTimelineSvg({ results }: { results: MatchResultRow[] }): React.JSX.Element {
  const colorMap: Record<string, string> = { W: COLORS.emerald, D: COLORS.amber, L: COLORS.red };
  const total = results.length;
  const spacing = 280 / Math.max(total - 1, 1);
  const timelineY = 70;
  const pointStr = results
    .map((r, i) => {
      const x = 10 + i * spacing;
      return `${x},${timelineY}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 300 100" className="w-full" style={{ maxHeight: 120 }}>
      <line x1="10" y1={timelineY} x2="290" y2={timelineY} stroke={COLORS.border} strokeWidth={1} />
      <polyline points={pointStr} fill="none" stroke={COLORS.dimText} strokeWidth={1} strokeDasharray="2,3" />
      {results.map((r, i) => {
        const x = 10 + i * spacing;
        return (
          <circle key={i} cx={x} cy={timelineY} r={3.5} fill={colorMap[r.result]} />
        );
      })}
      <circle cx={14} cy={10} r={3} fill={COLORS.emerald} />
      <text x={22} y={13} fill={COLORS.mutedText} fontSize={8} textAnchor={"start" as "start"}>Win</text>
      <circle cx={54} cy={10} r={3} fill={COLORS.amber} />
      <text x={62} y={13} fill={COLORS.mutedText} fontSize={8} textAnchor={"start" as "start"}>Draw</text>
      <circle cx={100} cy={10} r={3} fill={COLORS.red} />
      <text x={108} y={13} fill={COLORS.mutedText} fontSize={8} textAnchor={"start" as "start"}>Loss</text>
      <text x={210} y={13} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>GW1</text>
      <text x={290} y={13} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>GW{total}</text>
    </svg>
  );
}

function GoalsAreaChartSvg({ data }: { data: { month: string; goalsFor: number; goalsAgainst: number }[] }): React.JSX.Element {
  const chartLeft = 30;
  const chartRight = 280;
  const chartTop = 15;
  const chartBottom = 80;
  const maxGoals = Math.max(8, ...data.map(d => Math.max(d.goalsFor, d.goalsAgainst)));
  const barW = (chartRight - chartLeft) / data.length;

  const scoredPoints = data.map((d, i) => {
    const x = chartLeft + i * barW + barW / 2;
    const y = chartBottom - (d.goalsFor / maxGoals) * (chartBottom - chartTop);
    return `${x},${y}`;
  }).join(' ');

  const concededPoints = data.map((d, i) => {
    const x = chartLeft + i * barW + barW / 2;
    const y = chartBottom - (d.goalsAgainst / maxGoals) * (chartBottom - chartTop);
    return `${x},${y}`;
  }).join(' ');

  const scoredArea = scoredPoints + ` ${chartLeft + (data.length - 0.5) * barW},${chartBottom} ${chartLeft + barW / 2},${chartBottom}`;
  const concededArea = concededPoints + ` ${chartLeft + (data.length - 0.5) * barW},${chartBottom} ${chartLeft + barW / 2},${chartBottom}`;

  return (
    <svg viewBox="0 0 300 100" className="w-full" style={{ maxHeight: 130 }}>
      <polygon points={scoredArea} fill="rgba(16,185,129,0.2)" />
      <polyline points={scoredPoints} fill="none" stroke={COLORS.emerald} strokeWidth={2} />
      <polygon points={concededArea} fill="rgba(239,68,68,0.15)" />
      <polyline points={concededPoints} fill="none" stroke={COLORS.red} strokeWidth={2} />
      {data.map((d, i) => {
        const x = chartLeft + i * barW + barW / 2;
        return (
          <text key={i} x={x} y={93} fill={COLORS.dimText} fontSize={7} textAnchor={"middle" as "middle"}>
            {d.month}
          </text>
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const yVal = chartBottom - (i / 3) * (chartBottom - chartTop);
        const label = Math.round((i / 3) * maxGoals);
        return (
          <g key={i}>
            <line x1={chartLeft} y1={yVal} x2={chartRight} y2={yVal} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={chartLeft - 4} y={yVal + 3} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>
              {label}
            </text>
          </g>
        );
      })}
      <circle cx={190} cy={10} r={3} fill={COLORS.emerald} />
      <text x={196} y={13} fill={COLORS.mutedText} fontSize={7} textAnchor={"start" as "start"}>Scored</text>
      <circle cx={245} cy={10} r={3} fill={COLORS.red} />
      <text x={251} y={13} fill={COLORS.mutedText} fontSize={7} textAnchor={"start" as "start"}>Conceded</text>
    </svg>
  );
}

function PositionTrajectorySvg({ results }: { results: MatchResultRow[] }): React.JSX.Element {
  const chartLeft = 30;
  const chartRight = 280;
  const chartTop = 12;
  const chartBottom = 80;
  const maxPos = Math.max(20, ...results.map(r => r.position));
  const spacing = (chartRight - chartLeft) / Math.max(results.length - 1, 1);

  const linePoints = results.map((r, i) => {
    const x = chartLeft + i * spacing;
    const y = chartTop + (r.position / maxPos) * (chartBottom - chartTop);
    return `${x},${y}`;
  }).join(' ');

  const lastPos = results[results.length - 1]?.position ?? 10;
  const lastY = chartTop + (lastPos / maxPos) * (chartBottom - chartTop);
  const lastX = chartLeft + (results.length - 1) * spacing;

  return (
    <svg viewBox="0 0 300 100" className="w-full" style={{ maxHeight: 130 }}>
      <polyline points={linePoints} fill="none" stroke={COLORS.blue} strokeWidth={2} />
      <circle cx={lastX} cy={lastY} r={4} fill={COLORS.blue} />
      {Array.from({ length: 4 }, (_, i) => {
        const yVal = chartTop + (i / 3) * (chartBottom - chartTop);
        const label = Math.round((i / 3) * maxPos);
        return (
          <g key={i}>
            <line x1={chartLeft} y1={yVal} x2={chartRight} y2={yVal} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={chartLeft - 4} y={yVal + 3} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>
              {label}
            </text>
          </g>
        );
      })}
      <text x={chartLeft} y={93} fill={COLORS.dimText} fontSize={7} textAnchor={"start" as "start"}>GW1</text>
      <text x={chartRight} y={93} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>GW{results.length}</text>
      <text x={chartRight - 2} y={lastY - 8} fill={COLORS.blue} fontSize={8} fontWeight="bold" textAnchor={"end" as "end"}>
        {getOrdinal(lastPos)}
      </text>
    </svg>
  );
}

// ============================================================
// Tab 2 SVGs
// ============================================================

function PerformanceRadarSvg({ values, labels }: { values: number[]; labels: string[] }): React.JSX.Element {
  const cx = 150;
  const cy = 130;
  const maxR = 90;
  const sides = values.length;

  const pathData = buildRadarPath(cx, cy, values, 100, sides);
  const outerPoly = buildPolygonPoints(cx, cy, maxR, sides);

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map((level, idx) => {
    const pts = buildPolygonPoints(cx, cy, maxR * level, sides);
    return (
      <polygon key={idx} points={pts} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const axisLines = Array.from({ length: sides }, (_, i) => {
    const end = polarToCartesian(cx, cy, maxR, (360 / sides) * i - 90);
    return (
      <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const labelElements = labels.map((label, i) => {
    const pos = polarToCartesian(cx, cy, maxR + 18, (360 / sides) * i - 90);
    return (
      <text key={i} x={pos.x} y={pos.y} fill={COLORS.mutedText} fontSize={9} textAnchor={"middle" as "middle"}>
        {label}
      </text>
    );
  });

  const valueDots = values.map((v, i) => {
    const r = (v / 100) * maxR * 0.75;
    const p = polarToCartesian(cx, cy, r, (360 / sides) * i - 90);
    return (
      <g key={i}>
        <circle cx={p.x} cy={p.y} r={3} fill={COLORS.blue} />
        <text x={p.x} y={p.y - 6} fill={COLORS.secondaryText} fontSize={8} textAnchor={"middle" as "middle"}>
          {v}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="0 0 300 260" className="w-full" style={{ maxHeight: 260 }}>
      {gridPolygons}
      {axisLines}
      <polygon points={outerPoly} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
      <path d={pathData} fill="rgba(59,130,246,0.2)" stroke={COLORS.blue} strokeWidth={2} />
      {valueDots}
      {labelElements}
    </svg>
  );
}

function RatingTrendSvg({ data }: { data: { month: string; avgRating: number }[] }): React.JSX.Element {
  const chartLeft = 30;
  const chartRight = 275;
  const chartTop = 15;
  const chartBottom = 80;
  const minR = 5.0;
  const maxR = 10.0;
  const range = maxR - minR;
  const barW = (chartRight - chartLeft) / data.length;

  const linePoints = data.map((d, i) => {
    const x = chartLeft + i * barW + barW / 2;
    const y = chartBottom - ((d.avgRating - minR) / range) * (chartBottom - chartTop);
    return `${x},${y}`;
  }).join(' ');

  const refLineY = chartBottom - ((7.0 - minR) / range) * (chartBottom - chartTop);

  return (
    <svg viewBox="0 0 300 100" className="w-full" style={{ maxHeight: 130 }}>
      <line x1={chartLeft} y1={refLineY} x2={chartRight} y2={refLineY} stroke={COLORS.amber} strokeWidth={1} strokeDasharray="4,3" />
      <text x={chartRight + 2} y={refLineY + 3} fill={COLORS.amber} fontSize={7} textAnchor={"start" as "start"}>7.0</text>
      <polyline points={linePoints} fill="none" stroke={COLORS.blue} strokeWidth={2} />
      {data.map((d, i) => {
        const x = chartLeft + i * barW + barW / 2;
        const y = chartBottom - ((d.avgRating - minR) / range) * (chartBottom - chartTop);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={COLORS.blue} />
            <text x={x} y={93} fill={COLORS.dimText} fontSize={7} textAnchor={"middle" as "middle"}>
              {d.month}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const val = minR + (i / 4) * range;
        const yVal = chartBottom - (i / 4) * (chartBottom - chartTop);
        return (
          <g key={i}>
            <line x1={chartLeft} y1={yVal} x2={chartRight} y2={yVal} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={chartLeft - 4} y={yVal + 3} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>
              {val.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GoalAssistDonutSvg({ goals, assists, keyPasses }: { goals: number; assists: number; keyPasses: number }): React.JSX.Element {
  const cx = 150;
  const cy = 120;
  const outerR = 80;
  const innerR = 50;

  const total = goals + assists + keyPasses;

  const segments = [
    { label: 'Goals', value: goals, color: COLORS.emerald },
    { label: 'Assists', value: assists, color: COLORS.blue },
    { label: 'Key Passes', value: keyPasses, color: COLORS.amber },
  ].reduce<{ seg: { label: string; value: number; color: string }; startAngle: number; endAngle: number; pct: number }[]>(
    (acc, item) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
      const pct = total > 0 ? item.value / total : 0;
      const arcSpan = pct * 360;
      return [
        ...acc,
        {
          seg: { label: item.label, value: item.value, color: item.color },
          startAngle: prevEnd,
          endAngle: prevEnd + arcSpan,
          pct,
        },
      ];
    },
    []
  );

  return (
    <svg viewBox="0 0 300 240" className="w-full" style={{ maxHeight: 240 }}>
      {segments.map((arc, i) => {
        if (arc.pct === 0) return null;
        const pathD = buildDonutArcPath(cx, cy, outerR, innerR, arc.startAngle, arc.endAngle);
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const labelPos = polarToCartesian(cx, cy, outerR + 16, midAngle);
        return (
          <g key={i}>
            <path d={pathD} fill={arc.seg.color} />
            <text x={labelPos.x} y={labelPos.y} fill={COLORS.mutedText} fontSize={8} textAnchor={"middle" as "middle"}>
              {arc.seg.label}
            </text>
            <text x={labelPos.x} y={labelPos.y + 11} fill={COLORS.secondaryText} fontSize={9} fontWeight="bold" textAnchor={"middle" as "middle"}>
              {arc.seg.value}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy - 4} fill={COLORS.primaryText} fontSize={16} fontWeight="bold" textAnchor={"middle" as "middle"}>
        {total}
      </text>
      <text x={cx} y={cy + 10} fill={COLORS.mutedText} fontSize={8} textAnchor={"middle" as "middle"}>
        Total
      </text>
    </svg>
  );
}

// ============================================================
// Tab 3 SVGs
// ============================================================

function TeamStrengthRadarSvg({ values, labels }: { values: number[]; labels: string[] }): React.JSX.Element {
  const cx = 150;
  const cy = 130;
  const maxR = 90;
  const sides = values.length;

  const pathData = buildRadarPath(cx, cy, values, 100, sides);
  const outerPoly = buildPolygonPoints(cx, cy, maxR, sides);

  const gridPolygons = [0.25, 0.5, 0.75, 1.0].map((level, idx) => {
    const pts = buildPolygonPoints(cx, cy, maxR * level, sides);
    return (
      <polygon key={idx} points={pts} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const axisLines = Array.from({ length: sides }, (_, i) => {
    const end = polarToCartesian(cx, cy, maxR, (360 / sides) * i - 90);
    return (
      <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const labelElements = labels.map((label, i) => {
    const pos = polarToCartesian(cx, cy, maxR + 18, (360 / sides) * i - 90);
    return (
      <text key={i} x={pos.x} y={pos.y} fill={COLORS.mutedText} fontSize={9} textAnchor={"middle" as "middle"}>
        {label}
      </text>
    );
  });

  const valueDots = values.map((v, i) => {
    const r = (v / 100) * maxR * 0.75;
    const p = polarToCartesian(cx, cy, r, (360 / sides) * i - 90);
    return (
      <g key={i}>
        <circle cx={p.x} cy={p.y} r={3} fill={COLORS.purple} />
        <text x={p.x} y={p.y - 6} fill={COLORS.secondaryText} fontSize={8} textAnchor={"middle" as "middle"}>
          {v}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="0 0 300 260" className="w-full" style={{ maxHeight: 260 }}>
      {gridPolygons}
      {axisLines}
      <polygon points={outerPoly} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
      <path d={pathData} fill="rgba(139,92,246,0.2)" stroke={COLORS.purple} strokeWidth={2} />
      {valueDots}
      {labelElements}
    </svg>
  );
}

function SquadContributionBarsSvg({ data }: { data: { label: string; value: number; color: string }[] }): React.JSX.Element {
  const chartLeft = 80;
  const chartRight = 270;
  const barH = 22;
  const gap = 10;
  const totalH = data.length * (barH + gap);
  const startY = 15;

  return (
    <svg viewBox="0 0 300 200" className="w-full" style={{ maxHeight: 200 }}>
      {data.map((item, i) => {
        const y = startY + i * (barH + gap);
        const barWidth = (item.value / 100) * (chartRight - chartLeft);
        return (
          <g key={i}>
            <text x={chartLeft - 6} y={y + barH / 2 + 3} fill={COLORS.mutedText} fontSize={8} textAnchor={"end" as "end"}>
              {item.label}
            </text>
            <rect x={chartLeft} y={y} width={chartRight - chartLeft} height={barH} fill={COLORS.innerBg} rx={3} />
            <rect x={chartLeft} y={y} width={barWidth} height={barH} fill={item.color} rx={3} />
            <text x={chartLeft + barWidth + 6} y={y + barH / 2 + 3} fill={COLORS.secondaryText} fontSize={9} fontWeight="bold" textAnchor={"start" as "start"}>
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TeamGoalsDonutSvg({ season }: { season: number }): React.JSX.Element {
  const cx = 150;
  const cy = 120;
  const outerR = 80;
  const innerR = 50;

  const rawSegments = [
    { label: 'Open Play', value: Math.round(seededValue(season, 1, 30, 50)) },
    { label: 'Corners', value: Math.round(seededValue(season, 2, 8, 18)) },
    { label: 'Free Kicks', value: Math.round(seededValue(season, 3, 5, 12)) },
    { label: 'Penalties', value: Math.round(seededValue(season, 4, 4, 10)) },
    { label: 'Counter', value: Math.round(seededValue(season, 5, 5, 15)) },
  ];

  const total = rawSegments.reduce((s, seg) => s + seg.value, 0);
  const segColors = [COLORS.emerald, COLORS.blue, COLORS.amber, COLORS.red, COLORS.cyan];

  const segments = rawSegments.reduce<{
    seg: { label: string; value: number; color: string };
    startAngle: number;
    endAngle: number;
  }[]>((acc, item, idx) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const pct = total > 0 ? item.value / total : 0;
    return [
      ...acc,
      {
        seg: { label: item.label, value: item.value, color: segColors[idx] },
        startAngle: prevEnd,
        endAngle: prevEnd + pct * 360,
      },
    ];
  }, []);

  return (
    <svg viewBox="0 0 300 240" className="w-full" style={{ maxHeight: 240 }}>
      {segments.map((arc, i) => {
        if (arc.endAngle - arc.startAngle === 0) return null;
        const pathD = buildDonutArcPath(cx, cy, outerR, innerR, arc.startAngle, arc.endAngle);
        const midAngle = (arc.startAngle + arc.endAngle) / 2;
        const labelPos = polarToCartesian(cx, cy, outerR + 16, midAngle);
        return (
          <g key={i}>
            <path d={pathD} fill={arc.seg.color} />
            <text x={labelPos.x} y={labelPos.y} fill={COLORS.mutedText} fontSize={7} textAnchor={"middle" as "middle"}>
              {arc.seg.label}
            </text>
            <text x={labelPos.x} y={labelPos.y + 10} fill={COLORS.secondaryText} fontSize={9} fontWeight="bold" textAnchor={"middle" as "middle"}>
              {arc.seg.value}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy - 4} fill={COLORS.primaryText} fontSize={16} fontWeight="bold" textAnchor={"middle" as "middle"}>
        {total}
      </text>
      <text x={cx} y={cy + 10} fill={COLORS.mutedText} fontSize={8} textAnchor={"middle" as "middle"}>
        Team Goals
      </text>
    </svg>
  );
}

// ============================================================
// Tab 4 SVGs
// ============================================================

function HighlightScatterSvg({ data }: { data: { week: number; rating: number; result: 'W' | 'D' | 'L' }[] }): React.JSX.Element {
  const chartLeft = 35;
  const chartRight = 280;
  const chartTop = 15;
  const chartBottom = 85;
  const maxWeek = Math.max(38, ...data.map(d => d.week));
  const colorMap: Record<string, string> = { W: COLORS.emerald, D: COLORS.amber, L: COLORS.red };

  return (
    <svg viewBox="0 0 300 105" className="w-full" style={{ maxHeight: 135 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const val = 5 + (i / 4) * 5;
        const yVal = chartBottom - (i / 4) * (chartBottom - chartTop);
        return (
          <g key={i}>
            <line x1={chartLeft} y1={yVal} x2={chartRight} y2={yVal} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={chartLeft - 4} y={yVal + 3} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>
              {val.toFixed(0)}
            </text>
          </g>
        );
      })}
      <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke={COLORS.border} strokeWidth={1} />
      <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke={COLORS.border} strokeWidth={1} />
      {data.map((d, i) => {
        const x = chartLeft + ((d.week - 1) / maxWeek) * (chartRight - chartLeft);
        const y = chartBottom - ((d.rating - 5) / 5) * (chartBottom - chartTop);
        return (
          <circle key={i} cx={x} cy={y} r={4} fill={colorMap[d.result]} fillOpacity={0.85} />
        );
      })}
      <text x={chartLeft} y={98} fill={COLORS.dimText} fontSize={7} textAnchor={"start" as "start"}>GW1</text>
      <text x={chartRight} y={98} fill={COLORS.dimText} fontSize={7} textAnchor={"end" as "end"}>GW{maxWeek}</text>
      <text x={150} y={98} fill={COLORS.dimText} fontSize={7} textAnchor={"middle" as "middle"}>Matchweek</text>
      <circle cx={220} cy={5} r={3} fill={COLORS.emerald} />
      <text x={226} y={8} fill={COLORS.mutedText} fontSize={6.5} textAnchor={"start" as "start"}>W</text>
      <circle cx={243} cy={5} r={3} fill={COLORS.amber} />
      <text x={249} y={8} fill={COLORS.mutedText} fontSize={6.5} textAnchor={"start" as "start"}>D</text>
      <circle cx={263} cy={5} r={3} fill={COLORS.red} />
      <text x={269} y={8} fill={COLORS.mutedText} fontSize={6.5} textAnchor={"start" as "start"}>L</text>
    </svg>
  );
}

function ImprovementRadarSvg({ values, labels }: { values: number[]; labels: string[] }): React.JSX.Element {
  const cx = 150;
  const cy = 130;
  const maxR = 90;
  const sides = values.length;

  const pathData = buildRadarPath(cx, cy, values, 100, sides);
  const outerPoly = buildPolygonPoints(cx, cy, maxR, sides);

  const gridPolygons = [0.25, 0.5, 0.75, 1.0].map((level, idx) => {
    const pts = buildPolygonPoints(cx, cy, maxR * level, sides);
    return (
      <polygon key={idx} points={pts} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const axisLines = Array.from({ length: sides }, (_, i) => {
    const end = polarToCartesian(cx, cy, maxR, (360 / sides) * i - 90);
    return (
      <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={COLORS.border} strokeWidth={0.5} />
    );
  });

  const labelElements = labels.map((label, i) => {
    const pos = polarToCartesian(cx, cy, maxR + 18, (360 / sides) * i - 90);
    return (
      <text key={i} x={pos.x} y={pos.y} fill={COLORS.mutedText} fontSize={9} textAnchor={"middle" as "middle"}>
        {label}
      </text>
    );
  });

  const valueDots = values.map((v, i) => {
    const r = (v / 100) * maxR * 0.75;
    const p = polarToCartesian(cx, cy, r, (360 / sides) * i - 90);
    return (
      <g key={i}>
        <circle cx={p.x} cy={p.y} r={3} fill={COLORS.amber} />
        <text x={p.x} y={p.y - 6} fill={COLORS.secondaryText} fontSize={8} textAnchor={"middle" as "middle"}>
          {v}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="0 0 300 260" className="w-full" style={{ maxHeight: 260 }}>
      {gridPolygons}
      {axisLines}
      <polygon points={outerPoly} fill="none" stroke={COLORS.border} strokeWidth={0.5} />
      <path d={pathData} fill="rgba(245,158,11,0.2)" stroke={COLORS.amber} strokeWidth={2} />
      {valueDots}
      {labelElements}
    </svg>
  );
}

function ProjectionBarsSvg({ data }: { data: { label: string; current: number; projected: number; color: string }[] }): React.JSX.Element {
  const chartLeft = 85;
  const chartRight = 275;
  const barH = 16;
  const gap = 16;
  const startY = 20;

  return (
    <svg viewBox="0 0 300 190" className="w-full" style={{ maxHeight: 190 }}>
      {data.map((item, i) => {
        const y = startY + i * (barH * 2 + gap);
        const currentW = (item.current / 100) * (chartRight - chartLeft);
        const projectedW = (item.projected / 100) * (chartRight - chartLeft);
        return (
          <g key={i}>
            <text x={chartLeft - 6} y={y + barH / 2 + 3} fill={COLORS.mutedText} fontSize={7.5} textAnchor={"end" as "end"}>
              {item.label}
            </text>
            <rect x={chartLeft} y={y} width={chartRight - chartLeft} height={barH} fill={COLORS.innerBg} rx={2} />
            <rect x={chartLeft} y={y} width={currentW} height={barH} fill={COLORS.dimText} rx={2} />
            <text x={chartLeft + currentW + 4} y={y + barH / 2 + 3} fill={COLORS.dimText} fontSize={7.5} textAnchor={"start" as "start"}>
              {item.current}
            </text>
            <rect x={chartLeft} y={y + barH + 2} width={chartRight - chartLeft} height={barH} fill={COLORS.innerBg} rx={2} />
            <rect x={chartLeft} y={y + barH + 2} width={projectedW} height={barH} fill={item.color} rx={2} />
            <text x={chartLeft + projectedW + 4} y={y + barH * 2 + 5} fill={COLORS.secondaryText} fontSize={7.5} fontWeight="bold" textAnchor={"start" as "start"}>
              {item.projected}
            </text>
          </g>
        );
      })}
      <text x={200} y={12} fill={COLORS.dimText} fontSize={7} textAnchor={"start" as "start"}>Current vs Projected</text>
    </svg>
  );
}

// ============================================================
// Sub-components: Cards
// ============================================================

function SeasonSummaryCard({ stats }: {
  stats: { wins: number; draws: number; losses: number; points: number; position: number; goalsFor: number; goalsAgainst: number; totalTeams: number };
}): React.JSX.Element {
  const { wins, draws, losses, points, position, goalsFor, goalsAgainst, totalTeams } = stats;
  const gd = goalsFor - goalsAgainst;

  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4" style={{ color: COLORS.emerald }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Season Record</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-black" style={{ color: COLORS.primaryText }}>{getOrdinal(position)}</p>
          <p className="text-xs" style={{ color: COLORS.mutedText }}>of {totalTeams} teams</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: COLORS.emerald }}>{points}</p>
          <p className="text-xs" style={{ color: COLORS.mutedText }}>Points</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'W', value: wins, color: COLORS.emerald },
          { label: 'D', value: draws, color: COLORS.amber },
          { label: 'L', value: losses, color: COLORS.red },
          { label: 'GD', value: gd > 0 ? `+${gd}` : `${gd}`, color: gd >= 0 ? COLORS.blue : COLORS.red },
        ].map((item, i) => (
          <div key={i} className="rounded-md p-2 text-center" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[10px]" style={{ color: COLORS.dimText }}>{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <span className="text-xs" style={{ color: COLORS.mutedText }}>Goals</span>
        <span className="text-xs font-bold">
          <span style={{ color: COLORS.emerald }}>{goalsFor}</span>
          <span style={{ color: COLORS.dimText }}> - </span>
          <span style={{ color: COLORS.red }}>{goalsAgainst}</span>
        </span>
      </div>
    </div>
  );
}

function KeyMomentCard({ index, icon, title, description }: {
  index: number;
  icon: string;
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border p-3 flex items-start gap-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="w-8 h-8 rounded-md flex items-center justify-center text-base shrink-0" style={{ backgroundColor: COLORS.innerBg }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.innerBg, color: COLORS.dimText }}>
            #{index + 1}
          </span>
          <p className="text-xs font-bold truncate" style={{ color: COLORS.primaryText }}>{title}</p>
        </div>
        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: COLORS.mutedText }}>{description}</p>
      </div>
    </div>
  );
}

function SeasonGradeCard({ grade, color, bgColor }: { grade: string; color: string; bgColor: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border p-4 flex flex-col items-center" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <span className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.mutedText }}>Season Grade</span>
      <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: bgColor, border: `2px solid ${color}40` }}>
        <span className="text-3xl font-black" style={{ color }}>{grade}</span>
      </div>
      <span className="text-xs" style={{ color: COLORS.mutedText }}>Overall Assessment</span>
    </div>
  );
}

function StatCard({ label, value, subValue, color, icon: Icon }: {
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: COLORS.mutedText }}>{label}</span>
      </div>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      {subValue && <p className="text-[10px] mt-0.5" style={{ color: COLORS.dimText }}>{subValue}</p>}
    </div>
  );
}

function MatchHighlightCard({ title, score, description, rating, isBest }: {
  title: string;
  score: string;
  description: string;
  rating: number;
  isBest: boolean;
}): React.JSX.Element {
  const accentColor = isBest ? COLORS.emerald : COLORS.red;
  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: `${accentColor}30` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isBest ? <Star className="h-4 w-4" style={{ color: COLORS.emerald }} /> : <Flag className="h-4 w-4" style={{ color: COLORS.red }} />}
          <span className="text-xs font-bold" style={{ color: accentColor }}>{title}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${accentColor}15` }}>
          <span className="text-sm font-black" style={{ color: accentColor }}>{rating.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-lg font-black mb-1" style={{ color: COLORS.primaryText }}>{score}</p>
      <p className="text-[11px]" style={{ color: COLORS.mutedText }}>{description}</p>
    </div>
  );
}

// ============================================================
// Tab Content Components
// ============================================================

function TabHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5" style={{ color: COLORS.blue }} />
      <h2 className="text-base font-black uppercase tracking-wider" style={{ color: COLORS.primaryText }}>{title}</h2>
    </div>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }): React.JSX.Element {
  const tabIcons: Record<TabId, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    overview: BarChart3,
    personal: Target,
    team: Users,
    highlights: Flame,
  };

  return (
    <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ backgroundColor: COLORS.innerBg }}>
      {TAB_IDS.map((tab) => {
        const Icon = tabIcons[tab];
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-colors"
            style={{
              backgroundColor: isActive ? COLORS.cardBg : 'transparent',
              color: isActive ? COLORS.primaryText : COLORS.mutedText,
              border: isActive ? `1px solid ${COLORS.border}` : '1px solid transparent',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}

function SeasonOverviewTab({ season, playerStats, matchResults, monthlyData, clubName }: {
  season: number;
  playerStats: { goals: number; assists: number; appearances: number; averageRating: number };
  matchResults: MatchResultRow[];
  monthlyData: { month: string; goalsFor: number; goalsAgainst: number; avgRating: number }[];
  clubName: string;
}): React.JSX.Element {
  const wins = matchResults.reduce((s, m) => s + (m.result === 'W' ? 1 : 0), 0);
  const draws = matchResults.reduce((s, m) => s + (m.result === 'D' ? 1 : 0), 0);
  const losses = matchResults.reduce((s, m) => s + (m.result === 'L' ? 1 : 0), 0);
  const points = wins * 3 + draws;
  const goalsFor = matchResults.reduce((s, m) => s + m.goalsFor, 0);
  const goalsAgainst = matchResults.reduce((s, m) => s + m.goalsAgainst, 0);
  const finalPosition = matchResults[matchResults.length - 1]?.position ?? 10;
  const totalTeams = 18;

  const seasonGrade = getSeasonGrade(playerStats.averageRating, playerStats.goals, playerStats.assists, playerStats.appearances, finalPosition);

  const keyMoments = [
    { icon: '\u26BD', title: 'Opening Day Victory', description: `Started the season with a strong performance for ${clubName}` },
    { icon: '\uD83C\uDFC6', title: 'Winning Streak', description: 'Put together a run of 5 consecutive victories in the league' },
    { icon: '\u2B50', title: 'Player of the Month', description: 'Outstanding performances earned monthly recognition' },
    { icon: '\uD83C\uDFC5', title: 'Derby Day Triumph', description: 'Delivered in the big local derby match with a key contribution' },
    { icon: '\uD83D\uDCAA', title: 'Century of Appearances', description: 'Reached a major career appearance milestone this season' },
    { icon: '\uD83D\uDC51', title: 'Comeback Kings', description: 'Overcame a 2-goal deficit to win a crucial league fixture' },
    { icon: '\uD83C\uDF89', title: 'Clean Sheet Run', description: 'Defensive solidity led to 4 consecutive clean sheets' },
  ];

  const winRate = matchResults.length > 0 ? ((wins / matchResults.length) * 100).toFixed(1) : '0.0';
  const avgGoalsPerGame = matchResults.length > 0 ? (goalsFor / matchResults.length).toFixed(2) : '0.00';
  const bestStreak = matchResults.reduce(
    (acc, m) => {
      if (m.result === 'W') {
        return { current: acc.current + 1, best: Math.max(acc.best, acc.current + 1) };
      }
      return { current: 0, best: acc.best };
    },
    { current: 0, best: 0 }
  ).best;
  const worstStreak = matchResults.reduce(
    (acc, m) => {
      if (m.result === 'L') {
        return { current: acc.current + 1, worst: Math.max(acc.worst, acc.current + 1) };
      }
      return { current: 0, worst: acc.worst };
    },
    { current: 0, worst: 0 }
  ).worst;
  const highestScoring = matchResults.reduce(
    (best, m) => (m.goalsFor + m.goalsAgainst) > (best.goalsFor + best.goalsAgainst) ? m : best,
    matchResults[0]
  );

  return (
    <div className="space-y-4">
      <TabHeader title="Season Overview" icon={BarChart3} />

      {/* Season Summary + Grade row */}
      <div className="grid grid-cols-2 gap-3">
        <SeasonSummaryCard stats={{ wins, draws, losses, points, position: finalPosition, goalsFor, goalsAgainst, totalTeams }} />
        <SeasonGradeCard grade={seasonGrade.grade} color={seasonGrade.color} bgColor={seasonGrade.bgColor} />
      </div>

      {/* Key Moments */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.mutedText }}>Key Moments</h3>
        <div className="space-y-2">
          {keyMoments.map((km, i) => (
            <KeyMomentCard key={i} index={i} icon={km.icon} title={km.title} description={km.description} />
          ))}
        </div>
      </div>

      {/* Season in Numbers */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-4 w-4" style={{ color: COLORS.amber }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Season in Numbers</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.emerald }}>{winRate}%</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Win Rate</p>
          </div>
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.blue }}>{avgGoalsPerGame}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Goals/Game</p>
          </div>
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.emerald }}>{bestStreak}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Best Streak</p>
          </div>
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.red }}>{worstStreak}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Worst Run</p>
          </div>
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.purple }}>{highestScoring ? `${highestScoring.goalsFor}-${highestScoring.goalsAgainst}` : '-'}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Highest Score</p>
          </div>
          <div className="text-center p-2 rounded-md" style={{ backgroundColor: COLORS.innerBg }}>
            <p className="text-lg font-black" style={{ color: COLORS.cyan }}>{matchResults.length}</p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>Matches</p>
          </div>
        </div>
      </div>

      {/* SVG: Season Results Timeline */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Results Timeline</span>
        <div className="mt-2">
          <SeasonResultsTimelineSvg results={matchResults} />
        </div>
      </div>

      {/* SVG: Goals Area Chart */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Goals Scored vs Conceded</span>
        <div className="mt-2">
          <GoalsAreaChartSvg data={monthlyData} />
        </div>
      </div>

      {/* SVG: Position Trajectory */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>League Position Trajectory</span>
        <div className="mt-2">
          <PositionTrajectorySvg results={matchResults} />
        </div>
      </div>
    </div>
  );
}

function PersonalPerformanceTab({ season, playerStats, playerName, monthlyData }: {
  season: number;
  playerStats: { goals: number; assists: number; appearances: number; averageRating: number; cleanSheets: number; manOfTheMatch: number; yellowCards: number; redCards: number; injuries: number };
  playerName: string;
  monthlyData: { month: string; goalsFor: number; goalsAgainst: number; avgRating: number }[];
}): React.JSX.Element {
  const attrs = { pace: 78, shooting: 82, passing: 75, defending: 60, physical: 70 };

  const prevSeasonStats = {
    goals: Math.max(0, playerStats.goals - Math.round(seededValue(season, 10, 2, 8))),
    assists: Math.max(0, playerStats.assists - Math.round(seededValue(season, 11, 1, 5))),
    avgRating: parseFloat(Math.max(5.0, playerStats.averageRating - seededValue(season, 12, 0.2, 1.0)).toFixed(1)),
    appearances: Math.max(0, playerStats.appearances - Math.round(seededValue(season, 13, 3, 10))),
  };

  const performanceHighlights = [
    { icon: '\uD83C\uDFC5', title: 'Hat-Trick Masterclass', description: 'Scored 3 goals in a single match performance' },
    { icon: '\uD83D\uDCA1', title: 'Assist King', description: 'Provided multiple assists in key fixtures' },
    { icon: '\uD83D\uDEE1\uFE0F', title: 'Defensive Solidity', description: 'Contributed to multiple clean sheet performances' },
    { icon: '\uD83C\uDF1F', title: 'Match Winner', description: 'Scored the deciding goal in several tight matches' },
    { icon: '\uD83D\uDCAA', title: 'Iron Man Streak', description: 'Started consecutive matches without injury' },
  ];

  const radarValues = [playerStats.goals * 4, playerStats.assists * 5, attrs.pace, attrs.passing, attrs.defending, attrs.physical].map(v => Math.min(99, v));

  return (
    <div className="space-y-4">
      <TabHeader title="Personal Performance" icon={Target} />

      {/* Player Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Goals" value={playerStats.goals} subValue={`${(playerStats.goals / Math.max(1, playerStats.appearances)).toFixed(2)}/game`} color={COLORS.emerald} icon={Target} />
        <StatCard label="Assists" value={playerStats.assists} subValue={`${(playerStats.assists / Math.max(1, playerStats.appearances)).toFixed(2)}/game`} color={COLORS.blue} icon={Zap} />
        <StatCard label="Appearances" value={playerStats.appearances} color={COLORS.primaryText} icon={Users} />
        <StatCard label="Avg Rating" value={playerStats.averageRating > 0 ? playerStats.averageRating.toFixed(1) : '-'} subValue={playerStats.averageRating >= 7.0 ? 'Excellent' : playerStats.averageRating >= 6.0 ? 'Good' : 'Needs Work'} color={playerStats.averageRating >= 7.0 ? COLORS.emerald : COLORS.amber} icon={Star} />
        <StatCard label="Clean Sheets" value={playerStats.cleanSheets} color={COLORS.cyan} icon={Shield} />
        <StatCard label="Man of Match" value={playerStats.manOfTheMatch} color={COLORS.amber} icon={Crown} />
      </div>

      {/* Performance Highlights */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.mutedText }}>Performance Highlights</h3>
        <div className="space-y-2">
          {performanceHighlights.map((ph, i) => (
            <KeyMomentCard key={i} index={i} icon={ph.icon} title={ph.title} description={ph.description} />
          ))}
        </div>
      </div>

      {/* Previous Season Comparison */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.mutedText }}>vs Previous Season</h3>
        <div className="space-y-2">
          {[
            { label: 'Goals', current: playerStats.goals, prev: prevSeasonStats.goals, color: COLORS.emerald },
            { label: 'Assists', current: playerStats.assists, prev: prevSeasonStats.assists, color: COLORS.blue },
            { label: 'Avg Rating', current: playerStats.averageRating, prev: prevSeasonStats.avgRating, color: COLORS.amber },
            { label: 'Appearances', current: playerStats.appearances, prev: prevSeasonStats.appearances, color: COLORS.primaryText },
          ].map((stat, i) => {
            const diff = stat.current - stat.prev;
            const isUp = diff > 0;
            return (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.secondaryText }}>{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: COLORS.dimText }}>{stat.prev}</span>
                  <ArrowRight className="h-3 w-3" style={{ color: COLORS.dimText }} />
                  <span className="text-xs font-bold" style={{ color: stat.color }}>{stat.current}</span>
                  <span className="text-[10px] font-bold" style={{ color: isUp ? COLORS.emerald : COLORS.red }}>
                    {isUp ? '+' : ''}{typeof diff === 'number' ? (Number.isInteger(diff) ? diff : diff.toFixed(1)) : diff}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SVG: Performance Hex Radar */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Performance Radar</span>
        <div className="mt-2">
          <PerformanceRadarSvg values={radarValues} labels={['Goals', 'Assists', 'Pace', 'Passing', 'Defending', 'Physical']} />
        </div>
      </div>

      {/* SVG: Monthly Rating Trend */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Monthly Rating Trend</span>
        <div className="mt-2">
          <RatingTrendSvg data={monthlyData} />
        </div>
      </div>

      {/* Form Breakdown */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4" style={{ color: COLORS.cyan }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Form Breakdown</span>
        </div>
        <div className="space-y-2">
          {monthlyData.map((md, i) => {
            const barColor = md.avgRating >= 7.5 ? COLORS.emerald : md.avgRating >= 6.5 ? COLORS.amber : COLORS.red;
            const barWidth = Math.max(4, (md.avgRating / 10) * 100);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] w-8 shrink-0" style={{ color: COLORS.dimText }}>{md.month}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.innerBg }}>
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="text-[10px] w-8 text-right font-bold shrink-0" style={{ color: barColor }}>{md.avgRating.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <span className="text-[10px]" style={{ color: COLORS.mutedText }}>Season Average</span>
          <span className="text-xs font-black" style={{ color: playerStats.averageRating >= 7.0 ? COLORS.emerald : COLORS.amber }}>{playerStats.averageRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Disciplinary Record */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4" style={{ color: COLORS.amber }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Disciplinary Record</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
              <span className="text-sm font-black" style={{ color: COLORS.amber }}>{playerStats.yellowCards}</span>
            </div>
            <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: COLORS.dimText }}>Yellows</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
              <span className="text-sm font-black" style={{ color: COLORS.red }}>{playerStats.redCards}</span>
            </div>
            <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: COLORS.dimText }}>Reds</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(6,182,212,0.15)' }}>
              <span className="text-sm font-black" style={{ color: COLORS.cyan }}>{playerStats.injuries}</span>
            </div>
            <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: COLORS.dimText }}>Injuries</p>
          </div>
        </div>
      </div>

      {/* SVG: Goal/Assist Distribution Donut */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Goal/Assist Distribution</span>
        <div className="mt-2">
          <GoalAssistDonutSvg goals={playerStats.goals} assists={playerStats.assists} keyPasses={Math.round(playerStats.assists * 1.5)} />
        </div>
      </div>
    </div>
  );
}

function TeamAnalysisTab({ season, clubName, formation }: {
  season: number;
  clubName: string;
  formation: string;
}): React.JSX.Element {
  const teamPerformers = [
    { name: 'M. Fernandez', position: 'CM', rating: 8.2 },
    { name: 'J. Okoro', position: 'ST', rating: 7.9 },
    { name: 'L. Silva', position: 'CB', rating: 7.7 },
    { name: 'A. Petrov', position: 'LW', rating: 7.5 },
    { name: 'K. Yamamoto', position: 'CDM', rating: 7.4 },
  ];

  const chemistryScore = Math.round(seededValue(season, 30, 65, 92));
  const teamStats = [
    { label: 'Possession', value: Math.round(seededValue(season, 31, 45, 62)), color: COLORS.blue, icon: Activity },
    { label: 'Pass Accuracy', value: Math.round(seededValue(season, 32, 72, 88)), color: COLORS.emerald, icon: Zap },
    { label: 'Tackle Success', value: Math.round(seededValue(season, 33, 55, 78)), color: COLORS.amber, icon: Shield },
    { label: 'Aerial Duels', value: Math.round(seededValue(season, 34, 42, 68)), color: COLORS.purple, icon: Swords },
  ];

  const radarValues = [
    Math.round(seededValue(season, 40, 60, 90)),
    Math.round(seededValue(season, 41, 55, 85)),
    Math.round(seededValue(season, 42, 60, 88)),
    Math.round(seededValue(season, 43, 40, 75)),
    Math.round(seededValue(season, 44, 50, 80)),
  ];

  const squadBars = [
    { label: 'Goalkeepers', value: Math.round(seededValue(season, 50, 55, 80)), color: COLORS.amber },
    { label: 'Defenders', value: Math.round(seededValue(season, 51, 60, 88)), color: COLORS.blue },
    { label: 'Midfielders', value: Math.round(seededValue(season, 52, 58, 85)), color: COLORS.emerald },
    { label: 'Forwards', value: Math.round(seededValue(season, 53, 55, 90)), color: COLORS.red },
    { label: 'Substitutes', value: Math.round(seededValue(season, 54, 40, 70)), color: COLORS.cyan },
    { label: 'Youth', value: Math.round(seededValue(season, 55, 30, 65)), color: COLORS.purple },
  ];

  return (
    <div className="space-y-4">
      <TabHeader title="Team Analysis" icon={Users} />

      {/* Formation Summary */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Formation</span>
            <p className="text-xl font-black mt-1" style={{ color: COLORS.primaryText }}>{formation || '4-3-3'}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Chemistry</span>
            <p className="text-xl font-black mt-1" style={{ color: chemistryScore >= 75 ? COLORS.emerald : COLORS.amber }}>{chemistryScore}/100</p>
          </div>
        </div>
      </div>

      {/* Top 5 Performers */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.mutedText }}>Top Performers</h3>
        <div className="space-y-1.5">
          {teamPerformers.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-md p-2.5" style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-5 text-center" style={{ color: i === 0 ? COLORS.amber : COLORS.dimText }}>#{i + 1}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: COLORS.primaryText }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: COLORS.mutedText }}>{p.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${COLORS.blue}15` }}>
                <span className="text-xs font-bold" style={{ color: COLORS.blue }}>{p.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        {teamStats.map((ts, i) => (
          <StatCard key={i} label={ts.label} value={`${ts.value}%`} color={ts.color} icon={ts.icon} />
        ))}
      </div>

      {/* Set Piece Efficiency */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Swords className="h-4 w-4" style={{ color: COLORS.amber }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Set Piece Efficiency</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Corners', value: Math.round(seededValue(season, 35, 18, 35)), color: COLORS.emerald },
            { label: 'Free Kicks', value: Math.round(seededValue(season, 36, 10, 22)), color: COLORS.blue },
            { label: 'Penalties', value: Math.round(seededValue(season, 37, 60, 88)), color: COLORS.amber },
          ].map((sp, i) => (
            <div key={i} className="text-center">
              <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: COLORS.innerBg }}>
                <div
                  className="h-full rounded-lg"
                  style={{ width: `${sp.value}%`, backgroundColor: sp.color }}
                />
              </div>
              <p className="text-xs font-bold" style={{ color: sp.color }}>{sp.value}%</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.dimText }}>{sp.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SVG: Team Strength Radar */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Team Strength Radar</span>
        <div className="mt-2">
          <TeamStrengthRadarSvg values={radarValues} labels={['Attack', 'Midfield', 'Defense', 'Set Piece', 'Depth']} />
        </div>
      </div>

      {/* SVG: Squad Contribution Bars */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Squad Contribution</span>
        <div className="mt-2">
          <SquadContributionBarsSvg data={squadBars} />
        </div>
      </div>

      {/* SVG: Team Goals by Source Donut */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Goals by Source</span>
        <div className="mt-2">
          <TeamGoalsDonutSvg season={season} />
        </div>
      </div>

      {/* Team Goals Conceded Analysis */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4" style={{ color: COLORS.red }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Defensive Summary</span>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Clean Sheets', value: Math.round(seededValue(season, 38, 5, 14)), max: 20, color: COLORS.emerald },
            { label: 'Goals Conceded', value: Math.round(seededValue(season, 39, 25, 50)), max: 60, color: COLORS.red },
            { label: 'Shots Faced/Game', value: parseFloat(seededValue(season, 39, 8, 16).toFixed(1)), max: 20, color: COLORS.amber },
          ].map((ds, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: COLORS.secondaryText }}>{ds.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.innerBg }}>
                  <div
                    className="h-full rounded-lg"
                    style={{ width: `${Math.min(100, (typeof ds.value === 'number' && !Number.isNaN(ds.value) ? (Number.isInteger(ds.value) ? ds.value : ds.value) : 0) / ds.max * 100)}%`, backgroundColor: ds.color }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: ds.color }}>{ds.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HighlightsOutlookTab({ season, matchResults, playerName, playerStats }: {
  season: number;
  matchResults: MatchResultRow[];
  playerName: string;
  playerStats: { goals: number; assists: number; appearances: number; averageRating: number; cleanSheets: number; manOfTheMatch: number; yellowCards: number; redCards: number; injuries: number };
}): React.JSX.Element {
  const bestMatch = matchResults.reduce((best, m) => m.rating > best.rating ? m : best, matchResults[0]);
  const worstMatch = matchResults.reduce((worst, m) => m.rating < worst.rating ? m : worst, matchResults[0]);

  const topPerformances = matchResults
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map((m, i) => ({
      matchweek: m.week,
      rating: m.rating,
      result: m.result,
      gf: m.goalsFor,
      ga: m.goalsAgainst,
      description: i === 0 ? 'Dominant display' : i === 1 ? 'Influential performance' : 'Consistent contribution',
    }));

  const transferRecap = [
    { type: 'In', name: 'R. Santos', position: 'RB', fee: '\u20AC8M', status: 'Success' },
    { type: 'In', name: 'D. Kovac', position: 'CM', fee: '\u20AC12M', status: 'Success' },
    { type: 'Out', name: 'T. Williams', position: 'LW', fee: '\u20AC6M', status: 'N/A' },
    { type: 'Loan In', name: 'Y. Tanaka', position: 'ST', fee: '\u20AC2M', status: 'Moderate' },
  ];

  const scatterData = matchResults.filter((_, i) => i % 3 === 0).slice(0, 12).map(m => ({
    week: m.week,
    rating: m.rating,
    result: m.result,
  }));

  const improvementValues = [
    Math.round(seededValue(season, 60, 45, 78)),
    Math.round(seededValue(season, 61, 50, 80)),
    Math.round(seededValue(season, 62, 55, 85)),
    Math.round(seededValue(season, 63, 48, 75)),
    Math.round(seededValue(season, 64, 60, 88)),
  ];

  const projectionData = [
    { label: 'Finishing', current: Math.round(seededValue(season, 70, 55, 75)), projected: Math.round(seededValue(season, 70, 65, 85)), color: COLORS.emerald },
    { label: 'Crossing', current: Math.round(seededValue(season, 71, 50, 70)), projected: Math.round(seededValue(season, 71, 60, 82)), color: COLORS.blue },
    { label: 'Tackling', current: Math.round(seededValue(season, 72, 48, 72)), projected: Math.round(seededValue(season, 72, 58, 80)), color: COLORS.amber },
    { label: 'Positioning', current: Math.round(seededValue(season, 73, 52, 76)), projected: Math.round(seededValue(season, 73, 62, 84)), color: COLORS.purple },
    { label: 'Stamina', current: Math.round(seededValue(season, 74, 58, 80)), projected: Math.round(seededValue(season, 74, 68, 88)), color: COLORS.cyan },
  ];

  const seasonAwards = [
    { title: 'Golden Boot Contender', icon: '\uD83D\uDC5F', earned: playerStats.goals >= 15, stat: `${playerStats.goals} goals` },
    { title: 'Playmaker Award', icon: '\uD83C\uDFAF', earned: playerStats.assists >= 10, stat: `${playerStats.assists} assists` },
    { title: 'Iron Man', icon: '\uD83D\uDCAA', earned: playerStats.appearances >= 30, stat: `${playerStats.appearances} apps` },
    { title: 'Consistent Star', icon: '\u2B50', earned: playerStats.averageRating >= 7.0, stat: `${playerStats.averageRating.toFixed(1)} avg` },
  ];

  const seasonMilestones = [
    { milestone: `Scored ${playerStats.goals} goals`, achieved: playerStats.goals >= 10, color: COLORS.emerald },
    { milestone: `Made ${playerStats.appearances} appearances`, achieved: playerStats.appearances >= 20, color: COLORS.blue },
    { milestone: `Kept ${playerStats.cleanSheets} clean sheets`, achieved: playerStats.cleanSheets >= 3, color: COLORS.cyan },
    { milestone: 'Zero red cards', achieved: playerStats.redCards === 0, color: COLORS.amber },
    { milestone: `${playerStats.manOfTheMatch} Man of Match awards`, achieved: playerStats.manOfTheMatch >= 3, color: COLORS.purple },
  ];

  const achievedCount = seasonMilestones.reduce((s, m) => s + (m.achieved ? 1 : 0), 0);

  return (
    <div className="space-y-4">
      <TabHeader title="Highlights & Outlook" icon={Flame} />

      {/* Best & Worst Match */}
      <div className="grid grid-cols-2 gap-3">
        <MatchHighlightCard
          title="Best Match"
          score={bestMatch ? `${bestMatch.goalsFor}-${bestMatch.goalsAgainst}` : '0-0'}
          description={`GW${bestMatch?.week ?? '-'} - Outstanding individual performance`}
          rating={bestMatch?.rating ?? 7.0}
          isBest
        />
        <MatchHighlightCard
          title="Worst Match"
          score={worstMatch ? `${worstMatch.goalsFor}-${worstMatch.goalsAgainst}` : '0-0'}
          description={`GW${worstMatch?.week ?? '-'} - Difficult day on the pitch`}
          rating={worstMatch?.rating ?? 5.0}
          isBest={false}
        />
      </div>

      {/* Top 3 Individual Performances */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.mutedText }}>Top 3 Performances</h3>
        <div className="space-y-2">
          {topPerformances.map((tp, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-black" style={{ backgroundColor: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(148,163,184,0.15)' : 'rgba(205,127,50,0.15)', color: i === 0 ? COLORS.emerald : i === 1 ? '#94A3B8' : '#CD7F32' }}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: COLORS.primaryText }}>GW{tp.matchweek} vs Opponent</p>
                  <p className="text-[10px]" style={{ color: COLORS.mutedText }}>{tp.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[9px]" style={{ backgroundColor: `${tp.result === 'W' ? COLORS.emerald : tp.result === 'D' ? COLORS.amber : COLORS.red}20`, color: tp.result === 'W' ? COLORS.emerald : tp.result === 'D' ? COLORS.amber : COLORS.red, border: 'none' }}>
                  {tp.gf}-{tp.ga}
                </Badge>
                <span className="text-sm font-black" style={{ color: COLORS.blue }}>{tp.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Window Recap */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="h-4 w-4" style={{ color: COLORS.purple }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Transfer Window Recap</span>
        </div>
        <div className="space-y-2">
          {transferRecap.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < transferRecap.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: t.type === 'In' || t.type === 'Loan In' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: t.type === 'In' || t.type === 'Loan In' ? COLORS.emerald : COLORS.red, border: 'none' }}>
                  {t.type}
                </Badge>
                <div>
                  <p className="text-xs font-bold" style={{ color: COLORS.primaryText }}>{t.name}</p>
                  <p className="text-[10px]" style={{ color: COLORS.mutedText }}>{t.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: COLORS.secondaryText }}>{t.fee}</p>
                <p className="text-[10px]" style={{ color: COLORS.dimText }}>{t.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SVG: Season Highlight Scatter Plot */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Season Highlight Scatter</span>
        <div className="mt-2">
          <HighlightScatterSvg data={scatterData} />
        </div>
      </div>

      {/* SVG: Improvement Areas Radar */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Improvement Areas</span>
        <div className="mt-2">
          <ImprovementRadarSvg values={improvementValues} labels={['Finishing', 'Crossing', 'Tackling', 'Positioning', 'Stamina']} />
        </div>
      </div>

      {/* Season Awards */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4" style={{ color: COLORS.amber }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Season Awards</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {seasonAwards.map((sa, i) => (
            <div
              key={i}
              className="rounded-md p-2.5 flex items-center gap-2"
              style={{
                backgroundColor: sa.earned ? 'rgba(251,191,36,0.08)' : COLORS.innerBg,
                border: `1px solid ${sa.earned ? 'rgba(251,191,36,0.25)' : COLORS.border}`,
                opacity: sa.earned ? 1 : 0.5,
              }}
            >
              <span className="text-lg">{sa.icon}</span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: COLORS.primaryText }}>{sa.title}</p>
                <p className="text-[9px]" style={{ color: sa.earned ? COLORS.amber : COLORS.dimText }}>{sa.earned ? sa.stat : 'Not achieved'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Season Milestones Tracker */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" style={{ color: COLORS.cyan }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Season Milestones</span>
          </div>
          <Badge className="text-[9px]" style={{ backgroundColor: `${COLORS.cyan}15`, color: COLORS.cyan, border: 'none' }}>
            {achievedCount}/{seasonMilestones.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {seasonMilestones.map((ms, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < seasonMilestones.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: ms.achieved ? `${ms.color}20` : COLORS.innerBg }}
                >
                  {ms.achieved ? (
                    <TrendingUp className="h-3 w-3" style={{ color: ms.color }} />
                  ) : (
                    <TrendingDown className="h-3 w-3" style={{ color: COLORS.dimText }} />
                  )}
                </div>
                <span className="text-xs" style={{ color: ms.achieved ? COLORS.secondaryText : COLORS.dimText }}>{ms.milestone}</span>
              </div>
              <Badge className="text-[8px]" style={{ backgroundColor: ms.achieved ? `${ms.color}15` : COLORS.innerBg, color: ms.achieved ? ms.color : COLORS.dimText, border: 'none' }}>
                {ms.achieved ? 'Done' : 'Missed'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* SVG: Next Season Projection Bars */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.mutedText }}>Next Season Projections</span>
        <div className="mt-2">
          <ProjectionBarsSvg data={projectionData} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SeasonReviewEnhanced(): React.JSX.Element {
  const { gameState, setScreen } = useGameStore();
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');

  if (!gameState) return <div style={{ backgroundColor: COLORS.bg }} />;

  const playerName = gameState.player?.name ?? 'Player';
  const clubName = gameState.currentClub?.name ?? 'Club';
  const season = gameState.currentSeason ?? 1;
  const formation = gameState.currentClub?.formation ?? '4-3-3';
  const playerStats = gameState.player?.seasonStats ?? {
    appearances: 0, starts: 0, minutesPlayed: 0, goals: 0, assists: 0,
    cleanSheets: 0, yellowCards: 0, redCards: 0, averageRating: 0,
    manOfTheMatch: 0, injuries: 0,
  };

  const recentResults = gameState.recentResults ?? [];
  const playerClubId = gameState.currentClub?.id ?? '';
  const fixtures = gameState.upcomingFixtures ?? [];

  const matchResults = deriveMatchResults(season, recentResults, playerClubId, fixtures);
  const monthlyData = deriveMonthlyData(season, matchResults);

  const wins = matchResults.reduce((s, m) => s + (m.result === 'W' ? 1 : 0), 0);
  const goals = matchResults.reduce((s, m) => s + m.goalsFor, 0);
  const position = matchResults[matchResults.length - 1]?.position ?? 10;
  const seasonGrade = getSeasonGrade(playerStats.averageRating, playerStats.goals, playerStats.assists, playerStats.appearances, position);

  function handleBack(): void {
    setScreen('dashboard');
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0 rounded-lg"
            style={{ color: COLORS.mutedText }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider" style={{ color: COLORS.primaryText }}>
              Season Review
            </h1>
            <p className="text-[10px]" style={{ color: COLORS.mutedText }}>
              {clubName} — Season {season} — {playerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-md" style={{ backgroundColor: seasonGrade.bgColor }}>
            <span className="text-xs font-black" style={{ color: seasonGrade.color }}>
              {seasonGrade.grade}
            </span>
          </div>
          <Badge className="text-[9px]" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: COLORS.emerald, border: 'none' }}>
            {wins}W
          </Badge>
          <Badge className="text-[9px]" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: COLORS.blue, border: 'none' }}>
            {goals}G
          </Badge>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-4 pt-3 pb-1">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-6 pt-2">
        {activeTab === 'overview' && (
          <SeasonOverviewTab
            season={season}
            playerStats={playerStats}
            matchResults={matchResults}
            monthlyData={monthlyData}
            clubName={clubName}
          />
        )}
        {activeTab === 'personal' && (
          <PersonalPerformanceTab
            season={season}
            playerStats={playerStats}
            playerName={playerName}
            monthlyData={monthlyData}
          />
        )}
        {activeTab === 'team' && (
          <TeamAnalysisTab
            season={season}
            clubName={clubName}
            formation={formation}
          />
        )}
        {activeTab === 'highlights' && (
          <HighlightsOutlookTab
            season={season}
            matchResults={matchResults}
            playerName={playerName}
            playerStats={playerStats}
          />
        )}
      </div>
    </motion.div>
  );
}
