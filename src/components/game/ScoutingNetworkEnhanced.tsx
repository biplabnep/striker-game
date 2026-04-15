'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  Binoculars,
  Globe,
  MapPin,
  Star,
  TrendingUp,
  BarChart3,
  Users,
  Filter,
  ArrowRight,
  AlertTriangle,
  Target,
  Brain,
  Crosshair,
  Compass,
  Lightbulb,
  FileText,
  Database,
} from 'lucide-react';

// ============================================================
// Color palette & SVG helper functions
// ============================================================

const COLORS = {
  bg0: '#0a0a0a',
  bg1: '#111111',
  bg2: '#1a1a1a',
  accent: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  border: '#222222',
  textMuted: '#666666',
  textMid: '#999999',
  textBright: '#e8e8e8',
} as const;

function ratingColor(rating: number): string {
  if (rating >= 85) return COLORS.lime;
  if (rating >= 75) return COLORS.cyan;
  if (rating >= 65) return COLORS.accent;
  return COLORS.textMuted;
}

function positionGroupColor(pos: string): string {
  if (pos === 'GK') return '#FF5500';
  if (pos === 'DEF') return '#00E5FF';
  if (pos === 'MID') return '#CCFF00';
  if (pos === 'FWD') return '#FF5500';
  return COLORS.textMuted;
}

/** Helper: build an SVG points string from coordinate pairs */
function buildPoints(coords: Array<{ x: number; y: number }>): string {
  return coords.map((c) => `${c.x},${c.y}`).join(' ');
}

/** Helper: build SVG arc for donut segments */
function buildArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ============================================================
// SVG 1: Position Distribution Donut
// ============================================================

function PositionDonutChart() {
  const rawPositions = [
    'GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'CF',
    'CB', 'CM', 'GK', 'RW', 'ST', 'LW', 'CB', 'CAM', 'CDM', 'RB',
  ];

  const segments = ['GK', 'DEF', 'MID', 'FWD', 'UTIL'].reduce<Array<{ label: string; count: number; color: string }>>(
    (acc, pos) => {
      const count = rawPositions.reduce((n, p) => {
        if (pos === 'GK') return n + (p === 'GK' ? 1 : 0);
        if (pos === 'DEF') return n + (['CB', 'LB', 'RB'].includes(p) ? 1 : 0);
        if (pos === 'MID') return n + (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p) ? 1 : 0);
        if (pos === 'FWD') return n + (['LW', 'RW', 'ST', 'CF'].includes(p) ? 1 : 0);
        return n;
      }, 0);
      const colorMap: Record<string, string> = {
        GK: '#FF5500',
        DEF: '#00E5FF',
        MID: '#CCFF00',
        FWD: '#FF5500',
        UTIL: '#666666',
      };
      return [...acc, { label: pos, count, color: colorMap[pos] }];
    },
    [],
  );

  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const cx = 100;
  const cy = 100;
  const radius = 60;
  const innerRadius = 35;

  const arcs = segments.reduce<Array<{ path: string; color: string; label: string; pct: number; midAngle: number }>>(
    (acc, seg) => {
      if (seg.count === 0) return acc;
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].midAngle : -Math.PI / 2;
      const angle = (seg.count / total) * 2 * Math.PI;
      const startAngle = prevEnd;
      const endAngle = prevEnd + angle;
      const midAngle = endAngle;

      const outerStart = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
      const outerEnd = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
      const innerStart = { x: cx + innerRadius * Math.cos(endAngle), y: cy + innerRadius * Math.sin(endAngle) };
      const innerEnd = { x: cx + innerRadius * Math.cos(startAngle), y: cy + innerRadius * Math.sin(startAngle) };
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${outerStart.x} ${outerStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;

      return [...acc, { path, color: seg.color, label: seg.label, pct: Math.round((seg.count / total) * 100), midAngle }];
    },
    [],
  );

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ fontFamily: 'monospace' }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.path} fill={arc.color} opacity={0.8} stroke={COLORS.bg0} strokeWidth={2} />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={COLORS.textBright} fontSize={18} fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>players</text>
      {arcs.map((arc, i) => {
        const labelR = radius + 18;
        const lx = cx + labelR * Math.cos(arc.midAngle - (arcs[i] ? (arcs[i].pct / total) * Math.PI : 0));
        const ly = cy + labelR * Math.sin(arc.midAngle - (arcs[i] ? (arcs[i].pct / total) * Math.PI : 0));
        return (
          <g key={`leg-${i}`}>
            <circle cx={lx - 8} cy={ly} r={3} fill={arc.color} />
            <text x={lx - 3} y={ly + 3} textAnchor="start" fill={COLORS.textMid} fontSize={10}>{arc.label} {arc.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 2: Scout Rating Bars
// ============================================================

function ScoutRatingBars() {
  const scouts = [
    { name: 'C. Mendez', rating: 82 },
    { name: 'H. Weber', rating: 74 },
    { name: 'R. Costa', rating: 91 },
    { name: 'J. Mitchell', rating: 68 },
    { name: 'K. Tanaka', rating: 79 },
    { name: 'L. Dupont', rating: 85 },
  ];

  const barHeight = 18;
  const gap = 12;
  const barMaxWidth = 120;
  const startX = 80;
  const startY = 10;

  const avgRating = scouts.reduce((s, sc) => s + sc.rating, 0) / scouts.length;
  const avgBarW = (avgRating / 100) * barMaxWidth;
  const maxRating = Math.max(...scouts.map((s) => s.rating));
  const minRating = Math.min(...scouts.map((s) => s.rating));

  return (
    <svg viewBox="0 0 250 180" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={125} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">SCOUT RATINGS</text>
      {/* Average line */}
      <line x1={startX + avgBarW} y1={startY + 16} x2={startX + avgBarW} y2={startY + 16 + scouts.length * (barHeight + gap)} stroke={COLORS.lime} strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
      <text x={startX + avgBarW} y={startY + 16 + scouts.length * (barHeight + gap) + 12} textAnchor="middle" fill={COLORS.lime} fontSize={9} opacity={0.7}>avg {Math.round(avgRating)}</text>
      {/* Max/Min indicators */}
      <text x={startX + barMaxWidth + 30} y={startY + 32} textAnchor="start" fill={COLORS.lime} fontSize={8}>Max: {maxRating}</text>
      <text x={startX + barMaxWidth + 30} y={startY + 44} textAnchor="start" fill={COLORS.accent} fontSize={8}>Min: {minRating}</text>
      {scouts.map((scout, i) => {
        const y = startY + 20 + i * (barHeight + gap);
        const barW = (scout.rating / 100) * barMaxWidth;
        return (
          <g key={i}>
            <text x={startX - 8} y={y + barHeight / 2 + 4} textAnchor="end" fill={COLORS.textBright} fontSize={11}>{scout.name}</text>
            <rect x={startX} y={y} width={barMaxWidth} height={barHeight} rx={2} fill={COLORS.bg2} />
            <rect x={startX} y={y} width={barW} height={barHeight} rx={2} fill={ratingColor(scout.rating)} opacity={0.85} />
            <text x={startX + barMaxWidth + 8} y={y + barHeight / 2 + 4} textAnchor="start" fill={COLORS.textBright} fontSize={12} fontWeight="bold">{scout.rating}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 3: Scout Availability Timeline
// ============================================================

function ScoutAvailabilityTimeline() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const scouts = [
    { name: 'Mendez', status: [1, 1, 0, 1, 1, 0, 1, 1] },
    { name: 'Weber', status: [1, 0, 1, 1, 0, 1, 1, 0] },
    { name: 'Costa', status: [0, 1, 1, 1, 1, 1, 0, 1] },
    { name: 'Mitchell', status: [1, 1, 1, 0, 1, 1, 1, 1] },
    { name: 'Tanaka', status: [1, 0, 0, 1, 1, 1, 1, 0] },
    { name: 'Dupont', status: [0, 1, 1, 1, 0, 0, 1, 1] },
    { name: 'Andersen', status: [1, 1, 0, 0, 1, 1, 1, 1] },
    { name: 'Park', status: [1, 0, 1, 1, 1, 0, 0, 1] },
  ];

  const dotR = 7;
  const spacingX = 50;
  const spacingY = 22;
  const startX = 65;
  const startY = 30;

  return (
    <svg viewBox="0 0 500 240" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={250} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">SCOUT AVAILABILITY TIMELINE</text>
      {months.map((month, i) => (
        <text key={i} x={startX + i * spacingX} y={startY - 6} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>{month}</text>
      ))}
      {scouts.map((scout, si) => {
        const y = startY + si * spacingY;
        return (
          <g key={si}>
            <text x={startX - 8} y={y + 4} textAnchor="end" fill={COLORS.textBright} fontSize={10}>{scout.name}</text>
            {scout.status.map((status, mi) => (
              <circle key={mi} cx={startX + mi * spacingX} cy={y} r={dotR} fill={status ? COLORS.lime : '#333333'} opacity={status ? 0.9 : 0.4} />
            ))}
          </g>
        );
      })}
      <g>
        <circle cx={startX + months.length * spacingX + 20} cy={startY} r={6} fill={COLORS.lime} opacity={0.9} />
        <text x={startX + months.length * spacingX + 32} y={startY + 3} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>Available</text>
        <circle cx={startX + months.length * spacingX + 20} cy={startY + 18} r={6} fill="#333333" opacity={0.4} />
        <text x={startX + months.length * spacingX + 32} y={startY + 21} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>Busy</text>
      </g>
    </svg>
  );
}

// ============================================================
// SVG 4: Target Value Bars
// ============================================================

function TargetValueBars() {
  const players = [
    { name: 'V. Osimhen', currentValue: 65, estimatedCost: 85 },
    { name: 'P. Fofana', currentValue: 42, estimatedCost: 55 },
    { name: 'J. Veiga', currentValue: 28, estimatedCost: 40 },
    { name: 'L. Colyn', currentValue: 18, estimatedCost: 30 },
    { name: 'A. Diao', currentValue: 12, estimatedCost: 22 },
  ];

  const maxVal = 100;
  const barHeight = 14;
  const gap = 8;
  const startY = 30;
  const barMaxWidth = 200;
  const startX = 90;

  return (
    <svg viewBox="0 0 380 180" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={190} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">VALUE vs ESTIMATED COST (€M)</text>
      {players.map((player, i) => {
        const y = startY + i * (barHeight * 2 + gap + 4);
        const currentW = (player.currentValue / maxVal) * barMaxWidth;
        const costW = (player.estimatedCost / maxVal) * barMaxWidth;
        return (
          <g key={i}>
            <text x={startX - 8} y={y + barHeight + 4} textAnchor="end" fill={COLORS.textBright} fontSize={10}>{player.name}</text>
            <rect x={startX} y={y} width={barMaxWidth} height={barHeight} rx={2} fill={COLORS.bg2} />
            <rect x={startX} y={y} width={currentW} height={barHeight} rx={2} fill={COLORS.cyan} opacity={0.7} />
            <text x={startX + currentW + 4} y={y + barHeight - 2} textAnchor="start" fill={COLORS.textBright} fontSize={9}>{player.currentValue}M</text>
            <rect x={startX} y={y + barHeight + 2} width={barMaxWidth} height={barHeight} rx={2} fill={COLORS.bg2} />
            <rect x={startX} y={y + barHeight + 2} width={costW} height={barHeight} rx={2} fill={COLORS.accent} opacity={0.7} />
            <text x={startX + costW + 4} y={y + barHeight * 2} textAnchor="start" fill={COLORS.textBright} fontSize={9}>{player.estimatedCost}M</text>
          </g>
        );
      })}
      <g>
        <rect x={startX + barMaxWidth + 60} y={startY} width={10} height={10} rx={2} fill={COLORS.cyan} opacity={0.7} />
        <text x={startX + barMaxWidth + 75} y={startY + 9} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>Current</text>
        <rect x={startX + barMaxWidth + 60} y={startY + 14} width={10} height={10} rx={2} fill={COLORS.accent} opacity={0.7} />
        <text x={startX + barMaxWidth + 75} y={startY + 23} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>Cost</text>
      </g>
    </svg>
  );
}

// ============================================================
// SVG 5: Transfer Probability Ring
// ============================================================

function TransferProbabilityRing() {
  const probability = 72;
  const cx = 100;
  const cy = 110;
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const filled = (probability / 100) * circumference;
  const successTargets = 2;
  const failedTargets = 1;
  const pendingTargets = 2;

  const targetBreakdown = [
    { label: 'Completed', count: successTargets, color: COLORS.lime },
    { label: 'Pending', count: pendingTargets, color: COLORS.cyan },
    { label: 'Failed', count: failedTargets, color: COLORS.accent },
  ];

  return (
    <svg viewBox="0 0 200 210" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={cx} y={22} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">TRANSFER PROBABILITY</text>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={COLORS.bg2} strokeWidth={strokeWidth} />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="butt"
        opacity={0.85}
      />
      {/* Probability tier markers */}
      {[25, 50, 75].map((tier) => {
        const tierAngle = -Math.PI / 2 + (tier / 100) * 2 * Math.PI;
        const tierX = cx + (radius + strokeWidth + 4) * Math.cos(tierAngle);
        const tierY = cy + (radius + strokeWidth + 4) * Math.sin(tierAngle);
        return (
          <g key={tier}>
            <circle cx={tierX} cy={tierY} r={2} fill={COLORS.border} />
            <text x={tierX + (tierX > cx ? 6 : -6)} y={tierY + 3} textAnchor={tierX > cx ? 'start' : 'end'} fill={COLORS.textMuted} fontSize={8}>{tier}%</text>
          </g>
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={COLORS.textBright} fontSize={36} fontWeight="bold">{probability}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.textMuted} fontSize={11}>success rate</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={COLORS.textMid} fontSize={9}>Based on 5 active targets</text>
      {(() => {
        const angle = -Math.PI / 2 + (probability / 100) * 2 * Math.PI;
        const endX = cx + radius * Math.cos(angle);
        const endY = cy + radius * Math.sin(angle);
        return (
          <g>
            <circle cx={endX} cy={endY} r={5} fill={COLORS.accent} />
            <text x={endX + (endX > cx ? 10 : -10)} y={endY + 4} textAnchor={endX > cx ? 'start' : 'end'} fill={COLORS.textBright} fontSize={9}>Target</text>
          </g>
        );
      })()}
      {/* Legend */}
      <g>
        <circle cx={30} cy={cy + radius + 20} r={4} fill={COLORS.lime} opacity={0.8} />
        <text x={38} y={cy + radius + 23} textAnchor="start" fill={COLORS.textMuted} fontSize={8}>{'High (>70%)'}</text>
        <circle cx={30} cy={cy + radius + 34} r={4} fill={COLORS.cyan} opacity={0.8} />
        <text x={38} y={cy + radius + 37} textAnchor="start" fill={COLORS.textMuted} fontSize={8}>Medium (50-70%)</text>
        <circle cx={30} cy={cy + radius + 48} r={4} fill={COLORS.accent} opacity={0.8} />
        <text x={38} y={cy + radius + 51} textAnchor="start" fill={COLORS.textMuted} fontSize={8}>{'Low (<50%)'}</text>
      </g>
      {/* Target breakdown */}
      {targetBreakdown.map((item, i) => {
        const bx = 120;
        const by = cy + radius + 16 + i * 14;
        return (
          <g key={item.label}>
            <rect x={bx} y={by - 4} width={8} height={8} rx={1} fill={item.color} opacity={0.8} />
            <text x={bx + 12} y={by + 3} textAnchor="start" fill={COLORS.textMuted} fontSize={8}>{item.label}: {item.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 6: Position Needs Radar (5-axis)
// ============================================================

function PositionNeedsRadar() {
  const axes = ['GK', 'DEF', 'MID', 'FWD', 'DEPTH'];
  const values = [30, 85, 70, 90, 55];
  const cx = 120;
  const cy = 120;
  const maxR = 80;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map((level) => {
    const coords = Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return { x: cx + maxR * level * Math.cos(angle), y: cy + maxR * level * Math.sin(angle) };
    });
    return buildPoints(coords);
  });

  const dataCoords = values.map((val, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + maxR * (val / 100) * Math.cos(angle), y: cy + maxR * (val / 100) * Math.sin(angle) };
  });
  const dataPointsStr = buildPoints(dataCoords);

  const labelCoords = axes.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + (maxR + 20) * Math.cos(angle), y: cy + (maxR + 20) * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 240 250" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={cx} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">POSITION NEEDS</text>
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={COLORS.border} strokeWidth={1} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const endX = cx + maxR * Math.cos(angle);
        const endY = cy + maxR * Math.sin(angle);
        return <line key={i} x1={cx} y1={cy} x2={endX} y2={endY} stroke={COLORS.border} strokeWidth={1} />;
      })}
      <polygon points={dataPointsStr} fill="rgba(255,85,0,0.15)" stroke={COLORS.accent} strokeWidth={2} />
      {dataCoords.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={4} fill={COLORS.accent} />
          <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill={COLORS.textBright} fontSize={10} fontWeight="bold">{values[i]}</text>
        </g>
      ))}
      {axes.map((label, i) => (
        <text key={i} x={labelCoords[i].x} y={labelCoords[i].y + 4} textAnchor="middle" fill={COLORS.textMid} fontSize={11}>{label}</text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 7: Report Quality Gauge (semi-circular 0-100)
// ============================================================

function ReportQualityGauge() {
  const score = 76;
  const cx = 120;
  const cy = 130;
  const radius = 80;
  const strokeWidth = 16;

  const totalArc = Math.PI;
  const filledArc = (score / 100) * totalArc;

  const bgStart = { x: cx - radius, y: cy };
  const bgPath = buildArc(cx, cy, radius, Math.PI, 2 * Math.PI);

  const valueEnd = { x: cx + radius * Math.cos(Math.PI + filledArc), y: cy + radius * Math.sin(Math.PI + filledArc) };
  const valuePath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 0 1 ${valueEnd.x} ${valueEnd.y}`;

  const needleAngle = Math.PI + filledArc;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  const qualityZones = [
    { label: 'Poor', start: 0, end: 25, color: COLORS.accent },
    { label: 'Fair', start: 25, end: 50, color: '#FF8800' },
    { label: 'Good', start: 50, end: 75, color: COLORS.cyan },
    { label: 'Great', start: 75, end: 90, color: COLORS.lime },
    { label: 'Elite', start: 90, end: 100, color: '#00FF88' },
  ];

  const avgReports = 6;
  const highQualityReports = 3;
  const lowQualityReports = 1;

  return (
    <svg viewBox="0 0 240 170" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={cx} y={20} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">REPORT QUALITY</text>
      <path d={bgPath} fill="none" stroke={COLORS.bg2} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d={valuePath} fill="none" stroke={COLORS.cyan} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.85} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={COLORS.textBright} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={COLORS.bg1} stroke={COLORS.textBright} strokeWidth={2} />
      <text x={cx} y={cy + 30} textAnchor="middle" fill={COLORS.textBright} fontSize={28} fontWeight="bold">{score}</text>
      <text x={cx - radius} y={cy + 16} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>0</text>
      <text x={cx + radius} y={cy + 16} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>100</text>
      {/* Quality zone markers */}
      {qualityZones.map((zone) => {
        const angle = Math.PI + (zone.end / 100) * Math.PI;
        const markerX = cx + (radius + 6) * Math.cos(angle);
        const markerY = cy + (radius + 6) * Math.sin(angle);
        return (
          <g key={zone.label}>
            <line x1={cx + radius * Math.cos(angle)} y1={cy + radius * Math.sin(angle)} x2={markerX} y2={markerY} stroke={COLORS.border} strokeWidth={1} />
          </g>
        );
      })}
      {/* Zone labels */}
      {qualityZones.map((zone, i) => {
        const midAngle = Math.PI + ((zone.start + zone.end) / 2 / 100) * Math.PI;
        const labelX = cx + (radius + 16) * Math.cos(midAngle);
        const labelY = cy + (radius + 16) * Math.sin(midAngle);
        return (
          <text key={`zone-${i}`} x={labelX} y={labelY} textAnchor="middle" fill={zone.color} fontSize={7} opacity={0.8}>{zone.label}</text>
        );
      })}
      {/* Stats row */}
      <text x={cx} y={cy + 46} textAnchor="middle" fill={COLORS.textMuted} fontSize={9}>{avgReports} reports avg / {highQualityReports} high quality / {lowQualityReports} low quality</text>
    </svg>
  );
}

// ============================================================
// SVG 8: Scouting Coverage Area Chart (8 regions, 6 months)
// ============================================================

function ScoutingCoverageAreaChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const regions = [
    { name: 'England', data: [12, 18, 22, 15, 20, 25] },
    { name: 'Spain', data: [8, 14, 16, 12, 18, 20] },
    { name: 'Germany', data: [6, 10, 14, 11, 15, 18] },
    { name: 'France', data: [10, 12, 15, 9, 13, 16] },
    { name: 'Italy', data: [7, 11, 13, 10, 14, 17] },
    { name: 'Brazil', data: [14, 20, 25, 18, 22, 28] },
    { name: 'Argentina', data: [5, 8, 12, 9, 11, 15] },
    { name: 'Nigeria', data: [3, 6, 8, 5, 7, 10] },
  ];

  const allValues = regions.reduce<Array<number>>((acc, r) => [...acc, ...r.data], []);
  const maxVal = Math.max(...allValues);
  const chartW = 350;
  const chartH = 120;
  const padLeft = 60;
  const padTop = 35;
  const padBottom = 30;
  const regionColors = [COLORS.accent, COLORS.cyan, COLORS.lime, '#FF8800', '#00BFFF', '#88FF00', '#FF3366', '#AA66FF'];

  const gridLines = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 480 230" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={240} y={20} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">SCOUTING COVERAGE BY REGION</text>
      {gridLines.map((level, i) => {
        const y = padTop + chartH - level * chartH;
        const val = Math.round(maxVal * level);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke={COLORS.border} strokeWidth={1} />
            <text x={padLeft - 6} y={y + 4} textAnchor="end" fill={COLORS.textMuted} fontSize={9}>{val}</text>
          </g>
        );
      })}
      {months.map((month, i) => {
        const x = padLeft + (i / (months.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={padTop + chartH + 16} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>{month}</text>
        );
      })}
      {regions.map((region, ri) => {
        const points = region.data.map((val, i) => ({
          x: padLeft + (i / (region.data.length - 1)) * chartW,
          y: padTop + chartH - (val / maxVal) * chartH,
        }));
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
        const color = regionColors[ri % regionColors.length];
        return (
          <g key={ri}>
            <path d={areaPath} fill={color} opacity={0.08} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
            {points.map((p, pi) => (
              <circle key={pi} cx={p.x} cy={p.y} r={2.5} fill={color} opacity={0.8} />
            ))}
          </g>
        );
      })}
      {regions.map((region, ri) => {
        const color = regionColors[ri % regionColors.length];
        const ly = padTop + chartH + 24 + ri * 13;
        return (
          <g key={`leg-${ri}`}>
            <circle cx={padLeft} cy={ly} r={3} fill={color} opacity={0.8} />
            <text x={padLeft + 8} y={ly + 3} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>{region.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 9: Player Comparison Bars (3 metrics x 5 players)
// ============================================================

function PlayerComparisonBars() {
  const players = [
    { name: 'Osimhen', pace: 91, shooting: 85, passing: 72 },
    { name: 'Fofana', pace: 78, shooting: 70, passing: 80 },
    { name: 'Veiga', pace: 82, shooting: 65, passing: 88 },
    { name: 'Colyn', pace: 74, shooting: 60, passing: 75 },
    { name: 'Diao', pace: 88, shooting: 58, passing: 68 },
  ];
  const metrics = [
    { key: 'pace' as const, label: 'PACE', color: COLORS.accent },
    { key: 'shooting' as const, label: 'SHT', color: COLORS.cyan },
    { key: 'passing' as const, label: 'PAS', color: COLORS.lime },
  ];

  const barH = 10;
  const groupGap = 16;
  const metricGap = 3;
  const labelW = 60;
  const barMaxW = 160;
  const startX = 65;
  const startY = 30;

  return (
    <svg viewBox="0 0 320 260" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={160} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">PLAYER COMPARISON</text>
      {metrics.map((metric) => (
        <g key={metric.key}>
          <rect x={startX + barMaxW + 8} y={startY + metrics.indexOf(metric) * (barH + metricGap)} width={8} height={8} rx={1} fill={metric.color} />
          <text x={startX + barMaxW + 20} y={startY + metrics.indexOf(metric) * (barH + metricGap) + 8} textAnchor="start" fill={COLORS.textMuted} fontSize={9}>{metric.label}</text>
        </g>
      ))}
      {players.map((player, pi) => {
        const baseY = startY + pi * (3 * (barH + metricGap) + groupGap);
        return (
          <g key={pi}>
            <text x={startX - 8} y={baseY + barH + 6} textAnchor="end" fill={COLORS.textBright} fontSize={10}>{player.name}</text>
            {metrics.map((metric, mi) => {
              const y = baseY + mi * (barH + metricGap);
              const val = player[metric.key];
              const w = (val / 100) * barMaxW;
              return (
                <g key={mi}>
                  <rect x={startX} y={y} width={barMaxW} height={barH} rx={2} fill={COLORS.bg2} />
                  <rect x={startX} y={y} width={w} height={barH} rx={2} fill={metric.color} opacity={0.8} />
                  <text x={startX + w + 4} y={y + barH - 1} textAnchor="start" fill={COLORS.textBright} fontSize={9}>{val}</text>
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
// SVG 10: Global Talent Map Bars (6 regions/leagues)
// ============================================================

function GlobalTalentMapBars() {
  const regions = [
    { name: 'Premier League', talent: 142, color: COLORS.accent },
    { name: 'La Liga', talent: 118, color: COLORS.cyan },
    { name: 'Serie A', talent: 105, color: COLORS.lime },
    { name: 'Bundesliga', talent: 89, color: '#FF8800' },
    { name: 'Ligue 1', talent: 95, color: '#00BFFF' },
    { name: 'Brasileirao', talent: 76, color: '#88FF00' },
  ];

  const maxVal = Math.max(...regions.map((r) => r.talent));
  const barH = 22;
  const gap = 12;
  const startY = 30;
  const labelW = 100;
  const barMaxW = 200;
  const startX = 110;

  return (
    <svg viewBox="0 0 380 220" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={190} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">GLOBAL TALENT DISTRIBUTION</text>
      {regions.map((region, i) => {
        const y = startY + i * (barH + gap);
        const w = (region.talent / maxVal) * barMaxW;
        return (
          <g key={i}>
            <text x={startX - 8} y={y + barH / 2 + 4} textAnchor="end" fill={COLORS.textBright} fontSize={10}>{region.name}</text>
            <rect x={startX} y={y} width={barMaxW} height={barH} rx={3} fill={COLORS.bg2} />
            <rect x={startX} y={y} width={w} height={barH} rx={3} fill={region.color} opacity={0.8} />
            <text x={startX + w + 6} y={y + barH / 2 + 4} textAnchor="start" fill={COLORS.textBright} fontSize={12} fontWeight="bold">{region.talent}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: Scout Network Radar (5-axis)
// ============================================================

function ScoutNetworkRadar() {
  const axes = ['Speed', 'Coverage', 'Accuracy', 'Depth', 'Network'];
  const values = [78, 85, 72, 64, 91];
  const cx = 110;
  const cy = 110;
  const maxR = 75;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map((level) => {
    const coords = Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return { x: cx + maxR * level * Math.cos(angle), y: cy + maxR * level * Math.sin(angle) };
    });
    return buildPoints(coords);
  });

  const dataCoords = values.map((val, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + maxR * (val / 100) * Math.cos(angle), y: cy + maxR * (val / 100) * Math.sin(angle) };
  });
  const dataPointsStr = buildPoints(dataCoords);

  const labelCoords = axes.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + (maxR + 18) * Math.cos(angle), y: cy + (maxR + 18) * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 220 230" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={cx} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">SCOUT NETWORK</text>
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={COLORS.border} strokeWidth={1} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke={COLORS.border} strokeWidth={1} />
        );
      })}
      <polygon points={dataPointsStr} fill="rgba(0,229,255,0.15)" stroke={COLORS.cyan} strokeWidth={2} />
      {dataCoords.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={4} fill={COLORS.cyan} />
          <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill={COLORS.textBright} fontSize={10} fontWeight="bold">{values[i]}</text>
        </g>
      ))}
      {axes.map((label, i) => (
        <text key={i} x={labelCoords[i].x} y={labelCoords[i].y + 4} textAnchor="middle" fill={COLORS.textMid} fontSize={11}>{label}</text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 12: Budget Allocation Donut (5 segments via .reduce())
// ============================================================

function BudgetAllocationDonut() {
  const rawItems = [
    { label: 'Travel', value: 350000 },
    { label: 'Salaries', value: 280000 },
    { label: 'Database', value: 150000 },
    { label: 'Equipment', value: 120000 },
    { label: 'Operations', value: 100000 },
  ];

  const total = rawItems.reduce((s, item) => s + item.value, 0);
  const cx = 100;
  const cy = 100;
  const radius = 65;
  const innerRadius = 40;
  const segmentColors = [COLORS.accent, COLORS.cyan, COLORS.lime, '#FF8800', '#AA66FF'];

  const arcs = rawItems.reduce<Array<{ path: string; color: string; label: string; pct: number; midAngle: number }>>(
    (acc, item, idx) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].midAngle : -Math.PI / 2;
      const angle = (item.value / total) * 2 * Math.PI;
      const startAngle = prevEnd;
      const endAngle = prevEnd + angle;
      const midAngle = startAngle + angle / 2;

      const outerStart = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
      const outerEnd = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
      const innerStart = { x: cx + innerRadius * Math.cos(endAngle), y: cy + innerRadius * Math.sin(endAngle) };
      const innerEnd = { x: cx + innerRadius * Math.cos(startAngle), y: cy + innerRadius * Math.sin(startAngle) };
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${outerStart.x} ${outerStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;

      return [...acc, { path, color: segmentColors[idx % segmentColors.length], label: item.label, pct: Math.round((item.value / total) * 100), midAngle }];
    },
    [],
  );

  const formatK = (val: number) => `${Math.round(val / 1000)}K`;

  return (
    <svg viewBox="0 0 200 210" className="w-full" style={{ fontFamily: 'monospace' }}>
      <text x={cx} y={18} textAnchor="middle" fill={COLORS.textMid} fontSize={12} fontWeight="bold">BUDGET ALLOCATION</text>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.path} fill={arc.color} opacity={0.8} stroke={COLORS.bg0} strokeWidth={2} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={COLORS.textBright} fontSize={14} fontWeight="bold">{formatK(total / 1000)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>total</text>
      {arcs.map((arc, i) => {
        const labelR = radius + 16;
        const lx = cx + labelR * Math.cos(arc.midAngle);
        const ly = cy + labelR * Math.sin(arc.midAngle);
        return (
          <g key={`leg-${i}`}>
            <circle cx={lx - 8} cy={ly} r={3} fill={arc.color} />
            <text x={lx - 3} y={ly + 3} textAnchor="start" fill={COLORS.textMid} fontSize={9}>{arc.label} {arc.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ScoutingNetworkEnhanced() {
  const { gameState, setScreen } = useGameStore();
  const [activeTab, setActiveTab] = useState(0);

  // All hooks before any conditional return
  if (!gameState) {
    return <></>;
  }

  const clubName = gameState.currentClub.name;
  const season = gameState.currentSeason;
  const week = gameState.currentWeek;

  // ---- Synthetic Data ----

  const scoutPool = [
    { id: 1, name: 'Carlos Mendez', age: 21, position: 'CM', rating: 78, potential: 88, nationality: 'Spain', reports: 14, accuracy: 82, specialization: 'Youth Development', region: 'Iberian Peninsula', availability: 'Available', salary: '€4.2K/wk', experience: 3 },
    { id: 2, name: 'Hans Weber', age: 34, position: 'CB', rating: 74, potential: 74, nationality: 'Germany', reports: 22, accuracy: 90, specialization: 'Defensive Analysis', region: 'Central Europe', availability: 'On Assignment', salary: '€5.8K/wk', experience: 12 },
    { id: 3, name: 'Rafael Costa', age: 28, position: 'RW', rating: 91, potential: 91, nationality: 'Brazil', reports: 31, accuracy: 95, specialization: 'Forward Scouts', region: 'South America', availability: 'On Assignment', salary: '€7.5K/wk', experience: 8 },
    { id: 4, name: 'James Mitchell', age: 42, position: 'ST', rating: 68, potential: 68, nationality: 'England', reports: 18, accuracy: 75, specialization: 'General Scouting', region: 'Africa', availability: 'Available', salary: '€3.8K/wk', experience: 18 },
    { id: 5, name: 'Kenji Tanaka', age: 26, position: 'GK', rating: 79, potential: 79, nationality: 'Japan', reports: 9, accuracy: 84, specialization: 'Goalkeeper Analysis', region: 'East Asia', availability: 'On Assignment', salary: '€4.5K/wk', experience: 5 },
    { id: 6, name: 'Lucas Dupont', age: 30, position: 'CAM', rating: 85, potential: 85, nationality: 'France', reports: 26, accuracy: 88, specialization: 'Technical Assessment', region: 'Western Europe', availability: 'Available', salary: '€6.2K/wk', experience: 9 },
  ];

  const scoutPoolStats = [
    { label: 'Avg Rating', value: '79.2', color: COLORS.cyan },
    { label: 'Total Reports', value: '120', color: COLORS.lime },
    { label: 'Avg Accuracy', value: '85.7%', color: COLORS.accent },
    { label: 'Available', value: '3/6', color: COLORS.textBright },
  ];

  const transferTargets = [
    { id: 1, name: 'Victor Osimhen', age: 25, position: 'ST', rating: 88, potential: 90, currentValue: 65, estimatedCost: 85, probability: 42, league: 'Serie A', currentClub: 'Napoli', contractExpiry: '2026', wageDemand: '€120K/wk', scoutVerdict: 'World-class finisher but high price tag. Negotiation may be difficult.' },
    { id: 2, name: 'Pape Fofana', age: 22, position: 'CDM', rating: 78, potential: 86, currentValue: 42, estimatedCost: 55, probability: 68, league: 'Bundesliga', currentClub: 'RB Leipzig', contractExpiry: '2027', wageDemand: '€65K/wk', scoutVerdict: 'Excellent potential. Strong in build-up play and ball recovery.' },
    { id: 3, name: 'Joao Veiga', age: 20, position: 'CM', rating: 75, potential: 88, currentValue: 28, estimatedCost: 40, probability: 55, league: 'La Liga', currentClub: 'Celta Vigo', contractExpiry: '2028', wageDemand: '€45K/wk', scoutVerdict: 'Creative midfielder with outstanding vision. Worth the investment.' },
    { id: 4, name: 'Leny Colyn', age: 18, position: 'CB', rating: 70, potential: 85, currentValue: 18, estimatedCost: 30, probability: 72, league: 'Ligue 1', currentClub: 'Club Brugge', contractExpiry: '2027', wageDemand: '€30K/wk', scoutVerdict: 'Ball-playing defender. Good composure but lacks physical dominance.' },
    { id: 5, name: 'Amadou Diao', age: 19, position: 'LW', rating: 72, potential: 84, currentValue: 12, estimatedCost: 22, probability: 78, league: 'Brasileirao', currentClub: 'Flamengo', contractExpiry: '2029', wageDemand: '€35K/wk', scoutVerdict: 'Exciting dribbler with rapid acceleration. Raw but high ceiling.' },
  ];

  const transferBudgetSummary = {
    total: 120,
    spent: 45,
    remaining: 75,
    wagesBudget: 800,
    wagesSpent: 520,
  };

  const scoutingReports = [
    { id: 1, scoutName: 'R. Costa', playerName: 'Victor Osimhen', date: '2024-11-15', quality: 92, strengths: ['Pace', 'Finishing', 'Aerial'], weaknesses: ['First Touch', 'Dribbling'], recommendation: 'Sign', notes: 'Elite striker with world-class movement. Strong in transition. Would be an immediate starter.', matchesWatched: 12, keyStats: { pace: 91, shooting: 85, physical: 88, technique: 72, mental: 80 } },
    { id: 2, scoutName: 'H. Weber', playerName: 'Pape Fofana', date: '2024-11-12', quality: 76, strengths: ['Tackling', 'Positioning', 'Passing'], weaknesses: ['Pace', 'Shooting'], recommendation: 'Monitor', notes: 'Solid defensive midfielder. Good reading of the game. May need time to adapt.', matchesWatched: 8, keyStats: { pace: 72, shooting: 65, physical: 78, technique: 74, mental: 76 } },
    { id: 3, scoutName: 'C. Mendez', playerName: 'Joao Veiga', date: '2024-11-08', quality: 84, strengths: ['Vision', 'Passing', 'Technique'], weaknesses: ['Strength', 'Defending'], recommendation: 'Sign', notes: 'Creative playmaker with exceptional range of passing. Perfect fit for possession-based system.', matchesWatched: 10, keyStats: { pace: 78, shooting: 68, physical: 62, technique: 88, mental: 82 } },
    { id: 4, scoutName: 'J. Mitchell', playerName: 'Leny Colyn', date: '2024-11-05', quality: 68, strengths: ['Composure', ' anticipation', 'Distribution'], weaknesses: ['Experience', 'Aerial'], recommendation: 'Monitor', notes: 'Young defender with high potential. Needs more game time to develop consistency.', matchesWatched: 6, keyStats: { pace: 68, shooting: 35, physical: 65, technique: 72, mental: 70 } },
  ];

  const reportSummaryStats = [
    { label: 'Reports This Month', value: 18, color: COLORS.cyan },
    { label: 'Avg Quality Score', value: 80, color: COLORS.lime },
    { label: 'Scouts Deployed', value: 5, color: COLORS.accent },
    { label: 'Matches Covered', value: 36, color: COLORS.textBright },
  ];

  const networkStats = [
    { label: 'Active Scouts', value: 8, icon: Users },
    { label: 'Players Scouted', value: 247, icon: Search },
    { label: 'Reports Filed', value: 142, icon: FileText },
    { label: 'Regions Covered', value: 12, icon: Globe },
  ];

  const recentActivity = [
    { id: 1, type: 'report', text: 'R. Costa filed report on V. Osimhen', time: '2h ago', status: 'new' },
    { id: 2, type: 'assignment', text: 'K. Tanaka assigned to Japan U20 tournament', time: '5h ago', status: 'active' },
    { id: 3, type: 'discovery', text: 'H. Weber discovered 3 new talents in Bundesliga', time: '1d ago', status: 'new' },
    { id: 4, type: 'report', text: 'L. Dupont filed report on L. Colyn', time: '2d ago', status: 'reviewed' },
    { id: 5, type: 'assignment', text: 'C. Mendez deployed to La Liga match coverage', time: '3d ago', status: 'completed' },
    { id: 6, type: 'discovery', text: 'J. Mitchell identified prospect in Nigeria', time: '4d ago', status: 'new' },
  ];

  const trendingProspects = [
    { id: 1, name: 'Endrick', position: 'ST', age: 17, league: 'Brasileirao', rating: 72, trend: 'up' },
    { id: 2, name: 'Warren Zaire-Emery', position: 'CM', age: 18, league: 'Ligue 1', rating: 76, trend: 'up' },
    { id: 3, name: 'Lamine Yamal', position: 'RW', age: 17, league: 'La Liga', rating: 78, trend: 'up' },
    { id: 4, name: 'Koba Koindredi', position: 'CM', age: 18, league: 'Ligue 1', rating: 71, trend: 'stable' },
    { id: 5, name: 'Arda Guler', position: 'CAM', age: 19, league: 'La Liga', rating: 74, trend: 'up' },
    { id: 6, name: 'Savinho', position: 'LW', age: 19, league: 'Brasileirao', rating: 73, trend: 'up' },
  ];

  const scoutAssignments = [
    { scoutName: 'R. Costa', region: 'South America', target: 'Endrick (ST)', deadline: '2024-12-01', progress: 75 },
    { scoutName: 'H. Weber', region: 'Central Europe', target: 'Multiple targets', deadline: '2024-11-28', progress: 45 },
    { scoutName: 'C. Mendez', region: 'Iberian Peninsula', target: 'L. Yamal (RW)', deadline: '2024-12-05', progress: 60 },
    { scoutName: 'K. Tanaka', region: 'East Asia', target: 'Japan U20 Tournament', deadline: '2024-12-10', progress: 30 },
  ];

  const negotiationHistory = [
    { id: 1, player: 'M. Thuram', from: 'Borussia M.Gladbach', to: clubName, fee: '€28M', status: 'Completed', date: 'Jun 2024' },
    { id: 2, player: 'A. Tchouameni', from: 'AS Monaco', to: clubName, fee: '€80M', status: 'Failed', date: 'Jul 2023' },
    { id: 3, player: 'J. Veiga', from: 'Celta Vigo', to: clubName, fee: '€35M', status: 'In Progress', date: 'Nov 2024' },
    { id: 4, player: 'L. Colyn', from: 'Club Brugge', to: clubName, fee: '€22M', status: 'In Progress', date: 'Nov 2024' },
  ];

  // ---- Tab definitions ----

  const tabs = [
    { label: 'Scout Pool', icon: Binoculars },
    { label: 'Transfer Targets', icon: Target },
    { label: 'Scouting Reports', icon: Eye },
    { label: 'Network Intel', icon: Brain },
  ];

  // ---- Animation variants (opacity only) ----

  const fadeVariant = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // ---- Render ----

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg0 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3" style={{ backgroundColor: COLORS.bg1, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setScreen('dashboard')} className="text-[#999999] hover:text-[#e8e8e8]">
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: COLORS.textBright }}>Scouting Network</h1>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>{clubName}</p>
            </div>
          </div>
          <Badge className="text-xs px-2 py-0.5" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>
            Season {gameState.currentSeason}
          </Badge>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[60px] z-10 px-4" style={{ backgroundColor: COLORS.bg1, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex gap-1 max-w-4xl mx-auto overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-opacity"
              style={{
                color: activeTab === i ? COLORS.accent : COLORS.textMuted,
                borderBottom: activeTab === i ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div key="tab-scout-pool" variants={fadeVariant} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold" style={{ color: COLORS.textBright }}>
                    <Binoculars className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Scout Pool
                  </h2>
                  <Badge className="text-xs" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMid, border: `1px solid ${COLORS.border}` }}>
                    {scoutPool.length} scouts
                  </Badge>
                </div>

                {/* Scout Pool Summary Stats */}
                <div className="grid grid-cols-4 gap-2">
                  {scoutPoolStats.map((stat) => (
                    <Card key={stat.label} className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                      <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{stat.label}</p>
                    </Card>
                  ))}
                </div>

                {/* Scout Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scoutPool.map((scout) => {
                    const availColor = scout.availability === 'Available' ? COLORS.lime : COLORS.cyan;
                    return (
                      <Card key={scout.id} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold" style={{ backgroundColor: COLORS.bg2, color: COLORS.accent }}>
                            {scout.name.split(' ').map((n) => n.charAt(0)).join('')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate" style={{ color: COLORS.textBright }}>{scout.name}</p>
                              <Badge className="text-xs px-1.5 py-0 flex-shrink-0" style={{ backgroundColor: COLORS.bg2, color: availColor, border: `1px solid ${COLORS.border}` }}>
                                {scout.availability}
                              </Badge>
                            </div>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>{scout.nationality} / {scout.region}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-2 flex-wrap">
                          <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>{scout.position}</Badge>
                          <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.lime, border: `1px solid ${COLORS.border}` }}>Age {scout.age}</Badge>
                          <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMid, border: `1px solid ${COLORS.border}` }}>{scout.experience}yr exp</Badge>
                        </div>
                        <p className="text-xs mb-1" style={{ color: COLORS.textMid }}>Specialization: <span style={{ color: COLORS.textBright }}>{scout.specialization}</span></p>
                        <div className="flex justify-between text-xs mb-1" style={{ color: COLORS.textMuted }}>
                          <span>Rating: <span style={{ color: ratingColor(scout.rating) }}>{scout.rating}</span></span>
                          <span>Pot: <span style={{ color: COLORS.textBright }}>{scout.potential}</span></span>
                          <span>Reports: {scout.reports}</span>
                          <span>{scout.salary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>Accuracy</span>
                          <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg2 }}>
                            <div className="h-full rounded-sm" style={{ width: `${scout.accuracy}%`, backgroundColor: COLORS.cyan, opacity: 0.8 }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: COLORS.cyan }}>{scout.accuracy}%</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* SVG: Position Distribution Donut */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Compass className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Position Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PositionDonutChart />
                  </CardContent>
                </Card>

                {/* SVG: Scout Rating Bars */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <BarChart3 className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Scout Ratings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScoutRatingBars />
                  </CardContent>
                </Card>

                {/* SVG: Scout Availability Timeline */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <MapPin className="inline h-4 w-4 mr-2" style={{ color: COLORS.lime }} />
                      Scout Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScoutAvailabilityTimeline />
                  </CardContent>
                </Card>

                {/* Recent Scout Activity */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Lightbulb className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {recentActivity.map((activity) => {
                        const statusColor = activity.status === 'new' ? COLORS.lime : activity.status === 'active' ? COLORS.cyan : COLORS.textMid;
                        return (
                          <div key={activity.id} className="flex items-start gap-3 p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColor }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs" style={{ color: COLORS.textBright }}>{activity.text}</p>
                              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{activity.time}</p>
                            </div>
                            <Badge className="text-xs px-1.5 py-0 flex-shrink-0" style={{ backgroundColor: COLORS.bg0, color: statusColor, border: `1px solid ${COLORS.border}` }}>
                              {activity.type}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Scout Assignment Cards */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                    <Compass className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                    Active Assignments
                  </h3>
                </div>
                <div className="space-y-3">
                  {scoutAssignments.map((assignment) => (
                    <Card key={assignment.scoutName} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>{assignment.scoutName}</p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>{assignment.region}</p>
                        </div>
                        <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>
                          Due {assignment.deadline}
                        </Badge>
                      </div>
                      <p className="text-xs mb-2" style={{ color: COLORS.textMid }}>Target: {assignment.target}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg2 }}>
                          <div className="h-full rounded-sm" style={{ width: `${assignment.progress}%`, backgroundColor: COLORS.lime, opacity: 0.8 }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: COLORS.lime }}>{assignment.progress}%</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div key="tab-transfer-targets" variants={fadeVariant} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold" style={{ color: COLORS.textBright }}>
                    <Target className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Transfer Targets
                  </h2>
                  <Badge className="text-xs" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMid, border: `1px solid ${COLORS.border}` }}>
                    {transferTargets.length} targets
                  </Badge>
                </div>

                {/* Transfer Budget Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>€{transferBudgetSummary.total}M</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Total Budget</p>
                  </Card>
                  <Card className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-sm font-bold" style={{ color: COLORS.accent }}>€{transferBudgetSummary.spent}M</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Spent</p>
                  </Card>
                  <Card className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-sm font-bold" style={{ color: COLORS.lime }}>€{transferBudgetSummary.remaining}M</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Remaining</p>
                  </Card>
                  <Card className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-sm font-bold" style={{ color: COLORS.cyan }}>€{transferBudgetSummary.wagesSpent}K</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Wages/wk</p>
                  </Card>
                </div>

                {/* Target Player Cards */}
                <div className="space-y-3">
                  {transferTargets.map((target) => (
                    <Card key={target.id} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md flex items-center justify-center text-lg font-bold" style={{ backgroundColor: COLORS.bg2, color: COLORS.accent }}>
                            {target.position}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>{target.name}</p>
                            <div className="flex gap-2 mt-0.5">
                              <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>
                                {target.position}
                              </Badge>
                              <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
                                {target.league}
                              </Badge>
                              <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>
                                {target.currentClub}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Age {target.age}</p>
                          <p className="text-sm font-bold" style={{ color: ratingColor(target.rating) }}>{target.rating}</p>
                          <p className="text-xs" style={{ color: COLORS.lime }}>POT {target.potential}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs" style={{ color: COLORS.textMuted }}>
                          Value: <span style={{ color: COLORS.cyan }}>€{target.currentValue}M</span>
                          <span className="mx-1">/</span>
                          Cost: <span style={{ color: COLORS.accent }}>€{target.estimatedCost}M</span>
                        </div>
                        <Badge className="text-xs px-1.5 py-0" style={{
                          backgroundColor: target.probability > 70 ? 'rgba(204,255,0,0.15)' : target.probability > 50 ? 'rgba(0,229,255,0.15)' : 'rgba(255,85,0,0.15)',
                          color: target.probability > 70 ? COLORS.lime : target.probability > 50 ? COLORS.cyan : COLORS.accent,
                          border: `1px solid ${COLORS.border}`,
                        }}>
                          {target.probability}% chance
                        </Badge>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-xs" style={{ color: COLORS.textMuted }}>
                        <span>Contract: {target.contractExpiry}</span>
                        <span>Wage demand: <span style={{ color: COLORS.textBright }}>{target.wageDemand}</span></span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: COLORS.textMid }}>{target.scoutVerdict}</p>
                    </Card>
                  ))}
                </div>

                {/* SVG: Target Value Bars */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <TrendingUp className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Target Value Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TargetValueBars />
                  </CardContent>
                </Card>

                {/* SVG: Transfer Probability Ring */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Crosshair className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Overall Transfer Probability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TransferProbabilityRing />
                  </CardContent>
                </Card>

                {/* SVG: Position Needs Radar */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Filter className="inline h-4 w-4 mr-2" style={{ color: COLORS.lime }} />
                      Position Needs Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PositionNeedsRadar />
                  </CardContent>
                </Card>

                {/* Negotiation History */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                    <ArrowRight className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Negotiation History
                  </h3>
                </div>
                <div className="space-y-2">
                  {negotiationHistory.map((neg) => {
                    const statusColor = neg.status === 'Completed' ? COLORS.lime : neg.status === 'Failed' ? COLORS.accent : COLORS.cyan;
                    return (
                      <Card key={neg.id} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate" style={{ color: COLORS.textBright }}>{neg.player}</p>
                              <span className="text-xs" style={{ color: COLORS.textMuted }}>{neg.date}</span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: COLORS.textMid }}>{neg.from} to {neg.to}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>{neg.fee}</p>
                            <Badge className="text-xs px-1.5 py-0 mt-0.5" style={{ backgroundColor: COLORS.bg2, color: statusColor, border: `1px solid ${COLORS.border}` }}>
                              {neg.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Transfer Budget Overview */}
                <Card className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" style={{ color: COLORS.cyan }} />
                    <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>Transfer Budget</p>
                  </div>
                  <div className="flex justify-between text-xs mb-2" style={{ color: COLORS.textMuted }}>
                    <span>Total Budget: <span style={{ color: COLORS.textBright }}>€120M</span></span>
                    <span>Spent: <span style={{ color: COLORS.accent }}>€45M</span></span>
                    <span>Remaining: <span style={{ color: COLORS.lime }}>€75M</span></span>
                  </div>
                  <div className="h-2 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg2 }}>
                    <div className="h-full rounded-sm" style={{ width: '37.5%', backgroundColor: COLORS.accent, opacity: 0.8 }} />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: COLORS.textMuted }}>37.5% utilized</p>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div key="tab-scouting-reports" variants={fadeVariant} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold" style={{ color: COLORS.textBright }}>
                    <Eye className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Scouting Reports
                  </h2>
                  <Badge className="text-xs" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMid, border: `1px solid ${COLORS.border}` }}>
                    {scoutingReports.length} reports
                  </Badge>
                </div>

                {/* Report Summary Stats */}
                <div className="grid grid-cols-4 gap-2">
                  {reportSummaryStats.map((stat) => (
                    <Card key={stat.label} className="p-2 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                      <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{stat.label}</p>
                    </Card>
                  ))}
                </div>

                {/* Report Cards */}
                <div className="space-y-3">
                  {scoutingReports.map((report) => {
                    const recColor = report.recommendation === 'Sign' ? COLORS.lime : report.recommendation === 'Monitor' ? COLORS.cyan : COLORS.accent;
                    return (
                      <Card key={report.id} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>{report.playerName}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>By {report.scoutName} / {report.date} / {report.matchesWatched} matches</p>
                          </div>
                          <Badge className="text-xs px-2 py-0.5 font-bold" style={{ backgroundColor: 'rgba(255,85,0,0.15)', color: recColor, border: `1px solid ${recColor}` }}>
                            {report.recommendation}
                          </Badge>
                        </div>
                        <p className="text-xs mb-2" style={{ color: COLORS.textMid }}>{report.notes}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {report.strengths.map((s, si) => (
                            <Badge key={`s-${si}`} className="text-xs px-1.5 py-0" style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: COLORS.lime, border: `1px solid ${COLORS.border}` }}>
                              + {s}
                            </Badge>
                          ))}
                          {report.weaknesses.map((w, wi) => (
                            <Badge key={`w-${wi}`} className="text-xs px-1.5 py-0" style={{ backgroundColor: 'rgba(255,85,0,0.1)', color: COLORS.accent, border: `1px solid ${COLORS.border}` }}>
                              - {w}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>Quality:</span>
                          <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg2 }}>
                            <div className="h-full rounded-sm" style={{ width: `${report.quality}%`, backgroundColor: ratingColor(report.quality), opacity: 0.8 }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: ratingColor(report.quality) }}>{report.quality}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {Object.entries(report.keyStats).map(([key, val]) => (
                            <div key={key} className="text-center p-1 rounded-sm" style={{ backgroundColor: COLORS.bg2 }}>
                              <p className="text-xs font-bold" style={{ color: ratingColor(val as number) }}>{val as number}</p>
                              <p className="text-xs" style={{ color: COLORS.textMuted, fontSize: 9 }}>{key.charAt(0).toUpperCase() + key.slice(1, 4)}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* SVG: Report Quality Gauge */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Star className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Average Report Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ReportQualityGauge />
                  </CardContent>
                </Card>

                {/* SVG: Scouting Coverage Area Chart */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Globe className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Scouting Coverage by Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScoutingCoverageAreaChart />
                  </CardContent>
                </Card>

                {/* SVG: Player Comparison Bars */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <BarChart3 className="inline h-4 w-4 mr-2" style={{ color: COLORS.lime }} />
                      Target Player Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PlayerComparisonBars />
                  </CardContent>
                </Card>

                {/* Report Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-xl font-bold" style={{ color: COLORS.lime }}>3</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Recommended to Sign</p>
                  </Card>
                  <Card className="p-3 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-xl font-bold" style={{ color: COLORS.cyan }}>1</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Monitor</p>
                  </Card>
                  <Card className="p-3 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <p className="text-xl font-bold" style={{ color: COLORS.accent }}>0</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Avoid</p>
                  </Card>
                </div>

                {/* Historical Reports Summary */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <FileText className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Historical Report Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {[
                        { month: 'November 2024', total: 18, signed: 4, monitored: 8, rejected: 6 },
                        { month: 'October 2024', total: 22, signed: 6, monitored: 10, rejected: 6 },
                        { month: 'September 2024', total: 15, signed: 3, monitored: 7, rejected: 5 },
                        { month: 'August 2024', total: 28, signed: 8, monitored: 12, rejected: 8 },
                      ].map((summary) => (
                        <div key={summary.month} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                          <p className="text-xs font-bold" style={{ color: COLORS.textBright }}>{summary.month}</p>
                          <div className="flex gap-3 text-xs">
                            <span style={{ color: COLORS.textMid }}>Total: <span style={{ color: COLORS.textBright }}>{summary.total}</span></span>
                            <span style={{ color: COLORS.lime }}>Signed: {summary.signed}</span>
                            <span style={{ color: COLORS.cyan }}>Mon: {summary.monitored}</span>
                            <span style={{ color: COLORS.accent }}>Rej: {summary.rejected}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Scout Performance by Region */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <MapPin className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Scout Performance by Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {[
                        { region: 'South America', scouts: 1, reports: 31, accuracy: 95, discoveries: 12 },
                        { region: 'Western Europe', scouts: 3, reports: 58, accuracy: 85, discoveries: 8 },
                        { region: 'Central Europe', scouts: 1, reports: 22, accuracy: 90, discoveries: 5 },
                        { region: 'East Asia', scouts: 1, reports: 9, accuracy: 84, discoveries: 3 },
                        { region: 'Africa', scouts: 1, reports: 18, accuracy: 75, discoveries: 6 },
                        { region: 'Eastern Europe', scouts: 1, reports: 4, accuracy: 70, discoveries: 2 },
                      ].map((regionStat) => (
                        <div key={regionStat.region} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold" style={{ color: COLORS.textBright }}>{regionStat.region}</p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>{regionStat.scouts} scout{regionStat.scouts !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex gap-3 text-xs flex-shrink-0 ml-2">
                            <span style={{ color: COLORS.textMid }}>Rpt: {regionStat.reports}</span>
                            <span style={{ color: COLORS.lime }}>Acc: {regionStat.accuracy}%</span>
                            <span style={{ color: COLORS.cyan }}>Found: {regionStat.discoveries}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div key="tab-network-intel" variants={fadeVariant} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold" style={{ color: COLORS.textBright }}>
                    <Brain className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Network Intelligence
                  </h2>
                  <Badge className="text-xs" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>
                    <Lightbulb className="inline h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>

                {/* Global Stats Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {networkStats.map((stat) => (
                    <Card key={stat.label} className="p-3 text-center" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                      <stat.icon className="h-6 w-6 mx-auto mb-1" style={{ color: COLORS.accent }} />
                      <p className="text-xl font-bold" style={{ color: COLORS.textBright }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{stat.label}</p>
                    </Card>
                  ))}
                </div>

                {/* Additional insight cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" style={{ color: COLORS.lime }} />
                      <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>Top Discovery</p>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textMid }}>Best find this season: Joao Veiga (CM, 75 OVR, 88 POT)</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.lime, border: `1px solid ${COLORS.border}` }}>High Potential</Badge>
                      <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>Recommended</Badge>
                    </div>
                  </Card>
                  <Card className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" style={{ color: COLORS.accent }} />
                      <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>Budget Alert</p>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textMid }}>Scouting budget at 78% utilization. Consider reallocating funds before the winter window.</p>
                    <div className="mt-2 h-1.5 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg2 }}>
                      <div className="h-full rounded-sm" style={{ width: '78%', backgroundColor: COLORS.accent, opacity: 0.8 }} />
                    </div>
                  </Card>
                  <Card className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4" style={{ color: COLORS.cyan }} />
                      <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>Database Coverage</p>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textMid }}>Player database contains 1,247 profiles across 38 leagues. 312 profiles updated this month.</p>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: COLORS.textMuted }}>
                      <span style={{ color: COLORS.lime }}>312 updated</span>
                      <span style={{ color: COLORS.textBright }}>1,247 total</span>
                    </div>
                  </Card>
                  <Card className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" style={{ color: COLORS.lime }} />
                      <p className="text-sm font-bold" style={{ color: COLORS.textBright }}>Scout Performance</p>
                    </div>
                    <p className="text-xs" style={{ color: COLORS.textMid }}>Average scout rating: 79/100. R. Costa leading with 91 rating and 31 reports filed.</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.lime, border: `1px solid ${COLORS.border}` }}>+12% vs last season</Badge>
                    </div>
                  </Card>
                </div>

                {/* SVG: Global Talent Map Bars */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Globe className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Global Talent Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <GlobalTalentMapBars />
                  </CardContent>
                </Card>

                {/* SVG: Scout Network Radar */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Crosshair className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Scout Network Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScoutNetworkRadar />
                  </CardContent>
                </Card>

                {/* SVG: Budget Allocation Donut */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Database className="inline h-4 w-4 mr-2" style={{ color: COLORS.lime }} />
                      Budget Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <BudgetAllocationDonut />
                  </CardContent>
                </Card>

                {/* Trending Prospects */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                    <TrendingUp className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                    Trending Prospects
                  </h3>
                  <Badge className="text-xs" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMid, border: `1px solid ${COLORS.border}` }}>
                    {trendingProspects.length} players
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {trendingProspects.map((prospect) => {
                    const trendColor = prospect.trend === 'up' ? COLORS.lime : COLORS.textMid;
                    const trendIcon = prospect.trend === 'up' ? String.fromCharCode(9650) : String.fromCharCode(9644);
                    return (
                      <Card key={prospect.id} className="p-3" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold truncate" style={{ color: COLORS.textBright }}>{prospect.name}</p>
                          <span style={{ color: trendColor, fontSize: 12 }}>{trendIcon}</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.cyan, border: `1px solid ${COLORS.border}` }}>{prospect.position}</Badge>
                          <Badge className="text-xs px-1.5 py-0" style={{ backgroundColor: COLORS.bg2, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Age {prospect.age}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>{prospect.league}</span>
                          <span className="text-sm font-bold" style={{ color: ratingColor(prospect.rating) }}>{prospect.rating}</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Scout Assignments Summary in Intel Tab */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Compass className="inline h-4 w-4 mr-2" style={{ color: COLORS.accent }} />
                      Active Scout Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      {scoutAssignments.map((assignment) => {
                        const progressColor = assignment.progress >= 70 ? COLORS.lime : assignment.progress >= 40 ? COLORS.cyan : COLORS.accent;
                        return (
                          <div key={assignment.scoutName} className="p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold" style={{ color: COLORS.textBright }}>{assignment.scoutName}</p>
                              <span className="text-xs" style={{ color: COLORS.textMuted }}>{assignment.region}</span>
                            </div>
                            <p className="text-xs mb-1" style={{ color: COLORS.textMid }}>Target: {assignment.target}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ backgroundColor: COLORS.bg0 }}>
                                <div className="h-full rounded-sm" style={{ width: `${assignment.progress}%`, backgroundColor: progressColor }} />
                              </div>
                              <span className="text-xs" style={{ color: progressColor }}>{assignment.progress}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Network Recommendations */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <Lightbulb className="inline h-4 w-4 mr-2" style={{ color: COLORS.lime }} />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {[
                        { priority: 'HIGH', text: 'Deploy additional scout to South America. R. Costa is overloaded with assignments.', color: COLORS.accent },
                        { priority: 'MED', text: 'Expand coverage in Eastern Europe. Current scouting depth is insufficient at 64%.', color: COLORS.cyan },
                        { priority: 'LOW', text: 'Consider reassigning J. Mitchell from Africa to support C. Mendez in Iberian Peninsula.', color: COLORS.lime },
                        { priority: 'HIGH', text: '3 high-potential targets have not been scouted in 30+ days. Immediate review recommended.', color: COLORS.accent },
                      ].map((rec, ri) => (
                        <div key={ri} className="flex items-start gap-2 p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                          <Badge className="text-xs px-1.5 py-0 flex-shrink-0 mt-0.5" style={{ backgroundColor: COLORS.bg0, color: rec.color, border: `1px solid ${COLORS.border}` }}>
                            {rec.priority}
                          </Badge>
                          <p className="text-xs" style={{ color: COLORS.textMid }}>{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Comparison */}
                <Card className="p-4" style={{ backgroundColor: COLORS.bg1, borderColor: COLORS.border }}>
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-sm font-bold" style={{ color: COLORS.textBright }}>
                      <BarChart3 className="inline h-4 w-4 mr-2" style={{ color: COLORS.cyan }} />
                      Month-over-Month Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2">
                      {[
                        { metric: 'Players Scouted', current: 47, previous: 38, unit: '' },
                        { metric: 'Reports Filed', current: 18, previous: 22, unit: '' },
                        { metric: 'Discoveries', current: 12, previous: 8, unit: '' },
                        { metric: 'Avg Accuracy', current: 82, previous: 78, unit: '%' },
                        { metric: 'Budget Spent', current: 85, previous: 72, unit: 'K' },
                      ].map((item) => {
                        const diff = item.current - item.previous;
                        const diffColor = diff > 0 ? COLORS.lime : diff < 0 ? COLORS.accent : COLORS.textMuted;
                        const diffSign = diff > 0 ? '+' : '';
                        return (
                          <div key={item.metric} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: COLORS.bg2 }}>
                            <p className="text-xs" style={{ color: COLORS.textBright }}>{item.metric}</p>
                            <div className="flex items-center gap-3 text-xs">
                              <span style={{ color: COLORS.textBright }}>{item.current}{item.unit}</span>
                              <span style={{ color: COLORS.textMuted }}>(prev: {item.previous}{item.unit})</span>
                              <span style={{ color: diffColor }}>{diffSign}{diff}{item.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-4 py-2" style={{ backgroundColor: COLORS.bg1, borderTop: `1px solid ${COLORS.border}` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.textMuted }}>
            <span><Users className="inline h-3 w-3 mr-1" style={{ color: COLORS.cyan }} />8 scouts active</span>
            <span><FileText className="inline h-3 w-3 mr-1" style={{ color: COLORS.lime }} />142 reports</span>
            <span><Globe className="inline h-3 w-3 mr-1" style={{ color: COLORS.accent }} />12 regions</span>
          </div>
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            S{season} W{week} / <span style={{ color: COLORS.textBright }}>{clubName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
