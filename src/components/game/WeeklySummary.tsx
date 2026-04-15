'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import {
  X, Trophy, Swords, Dumbbell, Bell, TrendingUp, TrendingDown,
  Minus, Zap, ArrowUp, ArrowDown, BarChart3, Activity, Heart,
  Target, Star, Medal, Calendar, Wallet, Coins, Lightbulb, ArrowRight, Sparkles,
  PieChart, Gauge, Flame, Brain, Flag, LineChart, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeeklySummaryProps {
  onClose: () => void;
}

// Helper: get stat color class based on value thresholds
function getStatBarColor(value: number, thresholds: [number, number]): string {
  const [good, ok] = thresholds;
  if (value >= good) return 'bg-emerald-500';
  if (value >= ok) return 'bg-amber-500';
  return 'bg-red-500';
}

// Helper: get stat accent border color
function getStatAccentColor(value: number, thresholds: [number, number]): string {
  const [good, ok] = thresholds;
  if (value >= good) return 'border-l-emerald-500';
  if (value >= ok) return 'border-l-amber-500';
  return 'border-l-red-500';
}

// Helper: get league position ordinal suffix
function getOrdinalSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

// Helper: format league position with ordinal
function formatPosition(pos: number): string {
  return `${pos}${getOrdinalSuffix(pos)}`;
}

// Helper: Convert coordinate pairs to SVG points string (avoids nested .map().join())
function toSvgPoints(coords: [number, number][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ');
}

// Helper: Create SVG arc path for donut/ring segments
function arcSegmentPath(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
): string {
  if (Math.abs(endAngle - startAngle) < 0.01) return '';
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// Performance Ring SVG Component
function PerformanceRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const bgPath = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;

  const pct = Math.min(100, Math.max(0, score)) / 100;
  const angle = pct * 360;
  const endRad = ((angle - 90) * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy + radius * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;
  const fgPath = angle > 0
    ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
    : '';

  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : score >= 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
        {fgPath && (
          <motion.path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          />
        )}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" dominantBaseline="central"
          className="fill-white" fontSize="22" fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle" dominantBaseline="central"
          className="fill-[#8b949e]" fontSize="9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          WEEK SCORE
        </text>
      </svg>
      <span className="text-[10px] font-semibold" style={{ color }}>
        {score >= 75 ? 'Excellent Week' : score >= 50 ? 'Good Week' : score >= 25 ? 'Average Week' : 'Tough Week'}
      </span>
    </div>
  );
}

// ============================================================
// SVG 1: Season Progress Ring
// ============================================================
function SeasonProgressRing({ currentWeek, totalWeeks }: { currentWeek: number; totalWeeks: number }) {
  const size = 80;
  const strokeWidth = 6;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;

  const bgPath = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;

  const pct = Math.min(1, Math.max(0, currentWeek / totalWeeks));
  const angle = pct * 360;
  const endRad = ((angle - 90) * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy + radius * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;
  const fgPath = angle > 0
    ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
    : '';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <path d={bgPath} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
        {fgPath && (
          <motion.path
            d={fgPath}
            fill="none"
            stroke="#FF5500"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        )}
        <text
          x={cx} y={cy - 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#e8e8e8" fontSize="16" fontWeight="bold"
          fontFamily="monospace"
        >
          {currentWeek}
        </text>
        <text
          x={cx} y={cy + 12}
          textAnchor="middle" dominantBaseline="central"
          fill="#666666" fontSize="8"
          fontFamily="monospace"
        >
          / {totalWeeks}
        </text>
      </svg>
      <span className="text-[9px] font-semibold" style={{ color: '#FF5500' }}>
        {Math.round(pct * 100)}% COMPLETE
      </span>
    </div>
  );
}

// ============================================================
// SVG 2: Weekly Form Distribution Donut
// ============================================================
function WeeklyFormDonut({ wins, draws, losses, noMatch }: {
  wins: number; draws: number; losses: number; noMatch: number;
}) {
  const cx = 80;
  const cy = 55;
  const r = 30;
  const sw = 10;
  const total = wins + draws + losses + noMatch;

  const segments = [
    { label: 'W', value: wins, color: '#CCFF00' },
    { label: 'D', value: draws, color: '#00E5FF' },
    { label: 'L', value: losses, color: '#FF5500' },
    { label: '-', value: noMatch, color: '#333333' },
  ].filter(s => s.value > 0);

  const arcPaths = (() => {
    const result: { d: string; color: string }[] = [];
    let currentAngle = 0;
    segments.forEach(seg => {
      const segAngle = total > 0 ? (seg.value / total) * 360 : 0;
      if (segAngle > 0.1) {
        const innerR = r - sw;
        const outerR = r;
        const startRad = ((currentAngle - 90) * Math.PI) / 180;
        const endRad = ((currentAngle + segAngle - 90) * Math.PI) / 180;
        const x1o = cx + outerR * Math.cos(startRad);
        const y1o = cy + outerR * Math.sin(startRad);
        const x2o = cx + outerR * Math.cos(endRad);
        const y2o = cy + outerR * Math.sin(endRad);
        const x1i = cx + innerR * Math.cos(endRad);
        const y1i = cy + innerR * Math.sin(endRad);
        const x2i = cx + innerR * Math.cos(startRad);
        const y2i = cy + innerR * Math.sin(startRad);
        const large = segAngle > 180 ? 1 : 0;
        result.push({
          d: `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`,
          color: seg.color,
        });
      }
      currentAngle += segAngle;
    });
    return result;
  })();

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={160} height={100} viewBox="0 0 160 100" className="block">
        {arcPaths.map((arc, i) => (
          <motion.path
            key={i}
            d={arc.d}
            fill={arc.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
          />
        ))}
        <text
          x={cx} y={cy - 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#e8e8e8" fontSize="14" fontWeight="bold"
          fontFamily="monospace"
        >
          {total}
        </text>
        <text
          x={cx} y={cy + 10}
          textAnchor="middle" dominantBaseline="central"
          fill="#666666" fontSize="7"
          fontFamily="monospace"
        >
          MATCHES
        </text>
        {/* Legend */}
        {segments.map((seg, i) => {
          const lx = 8 + (i % 2) * 80;
          const ly = 88 + Math.floor(i / 2) * 10;
          return (
            <g key={`leg-${i}`}>
              <rect x={lx} y={ly} width={6} height={6} fill={seg.color} rx={1} />
              <text
                x={lx + 9} y={ly + 5}
                textAnchor="start" dominantBaseline="central"
                fill="#999999" fontSize="7"
                fontFamily="monospace"
              >
                {seg.label}: {seg.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 3: Match Performance Trend Area Chart
// ============================================================
function MatchPerformanceTrend({ ratings }: { ratings: number[] }) {
  const w = 160;
  const h = 100;
  const padX = 20;
  const padTop = 10;
  const padBot = 20;
  const minR = 3;
  const maxR = 10;

  const chartW = w - padX * 2;
  const chartH = h - padTop - padBot;

  const points = ratings.map((r, i) => ({
    x: padX + (ratings.length > 1 ? (i / (ratings.length - 1)) * chartW : chartW / 2),
    y: padTop + (1 - (Math.max(minR, Math.min(maxR, r)) - minR) / (maxR - minR)) * chartH,
  }));

  const linePath = (() => {
    return points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `, '');
  })();

  const areaPath = (() => {
    const baseY = padTop + chartH;
    const linePart = points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `, '');
    return `${linePart}L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`;
  })();

  const dotPoints = points.map(p => [p.x, p.y] as [number, number]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* Grid lines */}
      {[4, 5, 6, 7, 8, 9, 10].map(v => {
        const y = padTop + (1 - (v - minR) / (maxR - minR)) * chartH;
        return (
          <line
            key={`grid-${v}`}
            x1={padX} y1={y} x2={w - padX} y2={y}
            stroke="#1a1a1a" strokeWidth={0.5}
          />
        );
      })}
      {/* Y axis labels */}
      {[4, 6, 8, 10].map(v => {
        const y = padTop + (1 - (v - minR) / (maxR - minR)) * chartH;
        return (
          <text
            key={`yl-${v}`}
            x={padX - 4} y={y}
            textAnchor="end" dominantBaseline="central"
            fill="#666666" fontSize="7"
            fontFamily="monospace"
          >
            {v}
          </text>
        );
      })}
      {/* Area */}
      <motion.path
        d={areaPath}
        fill="#FF5500"
        fillOpacity={0.15}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#FF5500"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {/* Dots */}
      {dotPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]} cy={p[1]} r={2.5}
          fill={i === dotPoints.length - 1 ? '#CCFF00' : '#FF5500'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* X axis labels (match indices) */}
      {ratings.map((r, i) => {
        const x = padX + (ratings.length > 1 ? (i / (ratings.length - 1)) * chartW : chartW / 2);
        return (
          <text
            key={`xl-${i}`}
            x={x} y={h - 6}
            textAnchor="middle" dominantBaseline="central"
            fill="#666666" fontSize="7"
            fontFamily="monospace"
          >
            {r.toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 4: Attribute Change Radar (5-axis pentagon)
// ============================================================
function AttributeRadar({ pace, shooting, passing, physical, mental }: {
  pace: number; shooting: number; passing: number; physical: number; mental: number;
}) {
  const cx = 80;
  const cy = 52;
  const maxR = 34;
  const labels = ['PAC', 'SHT', 'PAS', 'PHY', 'MNT'];
  const values = [pace, shooting, passing, physical, mental];

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisAngles = values.map((_, i) => ((i * 72) - 90) * Math.PI / 180);

  const gridRings = gridLevels.map((level, li) => {
    const r = maxR * level;
    const pts = axisAngles.map(a => [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
    ] as [number, number]);
    return { level, pts, key: li };
  });

  const dataPolygon = axisAngles.map((a, i) => [
    cx + (values[i] / 100) * maxR * Math.cos(a),
    cy + (values[i] / 100) * maxR * Math.sin(a),
  ] as [number, number]);

  const axisEndPoints = axisAngles.map(a => [
    cx + maxR * Math.cos(a),
    cy + maxR * Math.sin(a),
  ] as [number, number]);

  return (
    <svg width={160} height={100} viewBox="0 0 160 100" className="block">
      {/* Grid rings */}
      {gridRings.map(ring => (
        <polygon
          key={ring.key}
          points={toSvgPoints(ring.pts)}
          fill="none"
          stroke={ring.level === 1 ? '#222222' : '#111111'}
          strokeWidth={0.5}
        />
      ))}
      {/* Axis lines */}
      {axisEndPoints.map((p, i) => (
        <line
          key={i}
          x1={cx} y1={cy} x2={p[0]} y2={p[1]}
          stroke="#222222" strokeWidth={0.5}
        />
      ))}
      {/* Data polygon */}
      <motion.polygon
        points={toSvgPoints(dataPolygon)}
        fill="#FF5500"
        fillOpacity={0.2}
        stroke="#FF5500"
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      {/* Data points */}
      {dataPolygon.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]} cy={p[1]} r={2.5}
          fill="#CCFF00"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const a = axisAngles[i];
        const lx = cx + (maxR + 12) * Math.cos(a);
        const ly = cy + (maxR + 12) * Math.sin(a);
        return (
          <text
            key={label}
            x={lx} y={ly}
            textAnchor="middle" dominantBaseline="central"
            fill="#999999" fontSize="7" fontWeight="bold"
            fontFamily="monospace"
          >
            {label}
          </text>
        );
      })}
      {/* Values */}
      {dataPolygon.map((p, i) => {
        const a = axisAngles[i];
        const vx = cx + (maxR + 20) * Math.cos(a);
        const vy = cy + (maxR + 20) * Math.sin(a);
        return (
          <text
            key={`v-${i}`}
            x={vx} y={vy}
            textAnchor="middle" dominantBaseline="central"
            fill="#e8e8e8" fontSize="7"
            fontFamily="monospace"
          >
            {values[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 5: Financial Breakdown Bars
// ============================================================
function FinancialBreakdown({ wage, matchBonus, endorsements, expenses, savings }: {
  wage: number; matchBonus: number; endorsements: number; expenses: number; savings: number;
}) {
  const items = [
    { label: 'WAGE', value: wage, color: '#00E5FF' },
    { label: 'BONUS', value: matchBonus, color: '#CCFF00' },
    { label: 'ENDOR', value: endorsements, color: '#FF5500' },
    { label: 'COSTS', value: expenses, color: '#FF3333' },
    { label: 'SAVE', value: savings, color: '#CCFF00' },
  ];

  const maxVal = Math.max(...items.map(it => it.value), 1);
  const barH = 12;
  const gap = 5;
  const labelW = 36;
  const valueW = 36;
  const barAreaW = 160 - labelW - valueW - 12;

  return (
    <svg width="100%" height={100} viewBox="0 0 160 100" className="block">
      {items.map((item, i) => {
        const y = 6 + i * (barH + gap);
        const barW = Math.max(2, (item.value / maxVal) * barAreaW);
        return (
          <g key={item.label}>
            <text
              x={4} y={y + barH / 2}
              textAnchor="start" dominantBaseline="central"
              fill="#999999" fontSize="7" fontWeight="bold"
              fontFamily="monospace"
            >
              {item.label}
            </text>
            {/* Background bar */}
            <rect
              x={labelW} y={y}
              width={barAreaW} height={barH}
              fill="#111111" rx={2}
            />
            {/* Value bar */}
            <motion.rect
              x={labelW} y={y}
              width={barW} height={barH}
              fill={item.color} rx={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            />
            <text
              x={160 - valueW} y={y + barH / 2}
              textAnchor="end" dominantBaseline="central"
              fill="#e8e8e8" fontSize="7"
              fontFamily="monospace"
            >
              {item.value.toFixed(1)}K
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 6: Training Intensity Gauge (semi-circular)
// ============================================================
function TrainingIntensityGauge({ intensity }: { intensity: number }) {
  const cx = 80;
  const cy = 72;
  const radius = 44;
  const sw = 8;
  const startAngle = 180;
  const endAngle = 0;

  // Background arc
  const bgArcPath = arcSegmentPath(cx, cy, radius, startAngle, endAngle);

  // Value arc
  const pct = Math.min(1, Math.max(0, intensity / 100));
  const valueAngle = startAngle - pct * 180;
  const fgArcPath = arcSegmentPath(cx, cy, radius, startAngle, valueAngle);

  const gaugeColor = intensity >= 90 ? '#FF5500' : intensity >= 60 ? '#00E5FF' : '#CCFF00';
  const gaugeLabel = intensity >= 90 ? 'HIGH' : intensity >= 60 ? 'MED' : 'LOW';

  return (
    <svg width={160} height={100} viewBox="0 0 160 100" className="block">
      {/* Background arc */}
      <path
        d={bgArcPath}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Value arc */}
      {fgArcPath && (
        <motion.path
          d={fgArcPath}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      )}
      {/* Center text */}
      <text
        x={cx} y={cy - 6}
        textAnchor="middle" dominantBaseline="central"
        fill="#e8e8e8" fontSize="20" fontWeight="bold"
        fontFamily="monospace"
      >
        {intensity}%
      </text>
      <text
        x={cx} y={cy + 10}
        textAnchor="middle" dominantBaseline="central"
        fill={gaugeColor} fontSize="9" fontWeight="bold"
        fontFamily="monospace"
      >
        {gaugeLabel}
      </text>
      {/* Scale labels */}
      <text x={cx - radius - 2} y={cy + 2} textAnchor="middle" dominantBaseline="central" fill="#666666" fontSize="7" fontFamily="monospace">0</text>
      <text x={cx} y={cy - radius - 4} textAnchor="middle" dominantBaseline="central" fill="#666666" fontSize="7" fontFamily="monospace">50</text>
      <text x={cx + radius + 2} y={cy + 2} textAnchor="middle" dominantBaseline="central" fill="#666666" fontSize="7" fontFamily="monospace">100</text>
    </svg>
  );
}

// ============================================================
// SVG 7: League Position Trajectory Line Chart
// ============================================================
function LeaguePositionTrajectory({ positions }: { positions: number[] }) {
  const w = 160;
  const h = 100;
  const padX = 20;
  const padTop = 8;
  const padBot = 16;

  const chartW = w - padX * 2;
  const chartH = h - padTop - padBot;

  const minPos = 1;
  const maxPos = Math.max(...positions, 5);

  const points = positions.map((pos, i) => ({
    x: padX + (positions.length > 1 ? (i / (positions.length - 1)) * chartW : chartW / 2),
    y: padTop + ((pos - minPos) / (maxPos - minPos)) * chartH,
  }));

  const linePath = (() => {
    return points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `, '');
  })();

  const dotCoords = points.map(p => [p.x, p.y] as [number, number]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* Grid lines (horizontal) */}
      {Array.from({ length: maxPos - minPos + 1 }, (_, i) => {
        const pos = maxPos - i;
        const y = padTop + ((pos - minPos) / (maxPos - minPos)) * chartH;
        return (
          <line
            key={`pg-${pos}`}
            x1={padX} y1={y} x2={w - padX} y2={y}
            stroke="#111111" strokeWidth={0.5}
          />
        );
      })}
      {/* Area under line (inverted - lower is better) */}
      <motion.path
        d={`${linePath}L ${points[points.length - 1].x.toFixed(1)} ${padTop + chartH} L ${points[0].x.toFixed(1)} ${padTop + chartH} Z`}
        fill="#00E5FF"
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#00E5FF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {/* Dots */}
      {dotCoords.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]} cy={p[1]} r={2.5}
          fill={i === dotCoords.length - 1 ? '#CCFF00' : '#00E5FF'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* Y axis labels (position numbers) */}
      {positions.map((pos, i) => {
        const x = padX + (positions.length > 1 ? (i / (positions.length - 1)) * chartW : chartW / 2);
        return (
          <text
            key={`plx-${i}`}
            x={x} y={h - 4}
            textAnchor="middle" dominantBaseline="central"
            fill="#666666" fontSize="7"
            fontFamily="monospace"
          >
            W{i + 1}
          </text>
        );
      })}
      {/* Current position label */}
      <text
        x={w - padX + 2} y={points[points.length - 1].y}
        textAnchor="start" dominantBaseline="central"
        fill="#CCFF00" fontSize="7" fontWeight="bold"
        fontFamily="monospace"
      >
        {positions[positions.length - 1]}th
      </text>
    </svg>
  );
}

// ============================================================
// SVG 8: Energy & Fitness Split Ring
// ============================================================
function EnergyFitnessSplitRing({ fitness }: { fitness: number }) {
  const cx = 80;
  const cy = 55;
  const r = 34;
  const sw = 9;
  const fatigue = 100 - fitness;

  const circumference = 2 * Math.PI * r;

  const fitnessArc = (() => {
    const angle = (fitness / 100) * 360;
    const endRad = ((angle - 90) * Math.PI) / 180;
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return angle > 0
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`
      : '';
  })();

  const fatigueArc = (() => {
    if (fatigue <= 0) return '';
    const startAngle = (fitness / 100) * 360;
    const endAngle = 360;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  })();

  return (
    <svg width={160} height={100} viewBox="0 0 160 100" className="block">
      {/* Background ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={sw}
      />
      {/* Fitness arc */}
      {fitnessArc && (
        <motion.path
          d={fitnessArc}
          fill="none"
          stroke="#CCFF00"
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        />
      )}
      {/* Fatigue arc */}
      {fatigueArc && (
        <motion.path
          d={fatigueArc}
          fill="none"
          stroke="#FF5500"
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        />
      )}
      {/* Center text */}
      <text
        x={cx} y={cy - 4}
        textAnchor="middle" dominantBaseline="central"
        fill="#e8e8e8" fontSize="16" fontWeight="bold"
        fontFamily="monospace"
      >
        {fitness}%
      </text>
      <text
        x={cx} y={cy + 10}
        textAnchor="middle" dominantBaseline="central"
        fill="#666666" fontSize="7"
        fontFamily="monospace"
      >
        FITNESS
      </text>
      {/* Legend */}
      <rect x={20} y={88} width={8} height={6} fill="#CCFF00" rx={1} />
      <text x={30} y={92} textAnchor="start" dominantBaseline="central" fill="#999999" fontSize="7" fontFamily="monospace">FIT {fitness}%</text>
      <rect x={88} y={88} width={8} height={6} fill="#FF5500" rx={1} />
      <text x={98} y={92} textAnchor="start" dominantBaseline="central" fill="#999999" fontSize="7" fontFamily="monospace">FAT {fatigue}%</text>
    </svg>
  );
}

// ============================================================
// SVG 9: Event Priority Bars
// ============================================================
function EventPriorityBars({ events }: { events: { type: string; count: number; color: string }[] }) {
  const maxCount = Math.max(...events.map(e => e.count), 1);
  const barH = 14;
  const gap = 4;
  const labelW = 50;
  const countW = 20;
  const barAreaW = 160 - labelW - countW - 12;

  const typeLabels: Record<string, string> = {
    TRANSFER_RUMOR: 'TRANSFER',
    MEDIA_INTERVIEW: 'MEDIA',
    PERSONAL_LIFE: 'PERSONAL',
    TEAM_CONFLICT: 'CONFLICT',
    MENTORSHIP: 'MENTOR',
    SPONSORSHIP: 'SPONSOR',
  };

  return (
    <svg width="100%" height={100} viewBox="0 0 160 100" className="block">
      {events.map((event, i) => {
        const y = 6 + i * (barH + gap);
        const barW = Math.max(2, (event.count / maxCount) * barAreaW);
        return (
          <g key={event.type}>
            <text
              x={4} y={y + barH / 2}
              textAnchor="start" dominantBaseline="central"
              fill="#999999" fontSize="7" fontWeight="bold"
              fontFamily="monospace"
            >
              {typeLabels[event.type] ?? event.type.slice(0, 8)}
            </text>
            <rect
              x={labelW} y={y}
              width={barAreaW} height={barH}
              fill="#111111" rx={2}
            />
            <motion.rect
              x={labelW} y={y}
              width={barW} height={barH}
              fill={event.color} rx={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            />
            <text
              x={160 - countW} y={y + barH / 2}
              textAnchor="end" dominantBaseline="central"
              fill="#e8e8e8" fontSize="7"
              fontFamily="monospace"
            >
              x{event.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: Weekly Goal Contribution Bars
// ============================================================
function WeeklyGoalContribution({ goals, assists, keyPasses }: {
  goals: number; assists: number; keyPasses: number;
}) {
  const items = [
    { label: 'GOALS', value: goals, color: '#CCFF00' },
    { label: 'ASSISTS', value: assists, color: '#00E5FF' },
    { label: 'KEY PS', value: keyPasses, color: '#FF5500' },
  ];

  const maxVal = Math.max(...items.map(it => it.value), 1);
  const barH = 16;
  const gap = 8;
  const labelW = 44;
  const valueW = 24;
  const barAreaW = 160 - labelW - valueW - 12;
  const startY = 8;

  return (
    <svg width={160} height={100} viewBox="0 0 160 100" className="block">
      {items.map((item, i) => {
        const y = startY + i * (barH + gap);
        const barW = Math.max(2, (item.value / maxVal) * barAreaW);
        return (
          <g key={item.label}>
            <text
              x={4} y={y + barH / 2}
              textAnchor="start" dominantBaseline="central"
              fill="#999999" fontSize="8" fontWeight="bold"
              fontFamily="monospace"
            >
              {item.label}
            </text>
            <rect
              x={labelW} y={y}
              width={barAreaW} height={barH}
              fill="#111111" rx={2}
            />
            <motion.rect
              x={labelW} y={y}
              width={barW} height={barH}
              fill={item.color} rx={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            />
            <text
              x={160 - valueW} y={y + barH / 2}
              textAnchor="end" dominantBaseline="central"
              fill="#e8e8e8" fontSize="10" fontWeight="bold"
              fontFamily="monospace"
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: Morale Trend Line
// ============================================================
function MoraleTrendLine({ moralePoints }: { moralePoints: number[] }) {
  const w = 160;
  const h = 100;
  const padX = 20;
  const padTop = 10;
  const padBot = 20;

  const chartW = w - padX * 2;
  const chartH = h - padTop - padBot;
  const minM = 0;
  const maxM = 100;

  const points = moralePoints.map((m, i) => ({
    x: padX + (moralePoints.length > 1 ? (i / (moralePoints.length - 1)) * chartW : chartW / 2),
    y: padTop + (1 - (Math.max(minM, Math.min(maxM, m)) - minM) / (maxM - minM)) * chartH,
  }));

  const linePath = (() => {
    return points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `, '');
  })();

  const areaPath = (() => {
    const baseY = padTop + chartH;
    const linePart = points.reduce((acc, p, i) => `${acc}${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `, '');
    return `${linePart}L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`;
  })();

  const dotCoords = points.map(p => [p.x, p.y] as [number, number]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* Grid lines */}
      {[25, 50, 75, 100].map(v => {
        const y = padTop + (1 - (v - minM) / (maxM - minM)) * chartH;
        return (
          <line
            key={`mg-${v}`}
            x1={padX} y1={y} x2={w - padX} y2={y}
            stroke="#1a1a1a" strokeWidth={0.5}
          />
        );
      })}
      {/* Y axis labels */}
      {[25, 50, 75].map(v => {
        const y = padTop + (1 - (v - minM) / (maxM - minM)) * chartH;
        return (
          <text
            key={`myl-${v}`}
            x={padX - 4} y={y}
            textAnchor="end" dominantBaseline="central"
            fill="#666666" fontSize="7"
            fontFamily="monospace"
          >
            {v}
          </text>
        );
      })}
      {/* Area */}
      <motion.path
        d={areaPath}
        fill="#CCFF00"
        fillOpacity={0.1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#CCFF00"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      {/* Dots */}
      {dotCoords.map((p, i) => (
        <motion.circle
          key={i}
          cx={p[0]} cy={p[1]} r={2.5}
          fill={i === dotCoords.length - 1 ? '#e8e8e8' : '#CCFF00'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* Current morale label */}
      <text
        x={w - padX + 2} y={points[points.length - 1].y}
        textAnchor="start" dominantBaseline="central"
        fill="#e8e8e8" fontSize="7" fontWeight="bold"
        fontFamily="monospace"
      >
        {moralePoints[moralePoints.length - 1]}
      </text>
    </svg>
  );
}

export default function WeeklySummary({ onClose }: WeeklySummaryProps) {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const notifications = useGameStore(state => state.notifications);

  // ── All useMemo hooks before early return ──

  const computed = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, recentResults, currentWeek, currentSeason, leagueTable, trainingHistory, activeEvents } = gameState;

    // Latest match result
    const latestMatch = recentResults.length > 0 ? recentResults[0] : null;

    // Previous match result for week-over-week comparison
    const previousMatch = recentResults.length > 1 ? recentResults[1] : null;

    // Match outcome
    const playerWon = latestMatch
      ? (latestMatch.homeClub.id === currentClub.id && latestMatch.homeScore > latestMatch.awayScore) ||
        (latestMatch.awayClub.id === currentClub.id && latestMatch.awayScore > latestMatch.homeScore)
      : false;
    const playerDrew = latestMatch ? latestMatch.homeScore === latestMatch.awayScore : false;
    const playerLost = latestMatch ? !playerWon && !playerDrew : false;

    // W/D/L result label
    const resultLabel = playerWon ? 'W' : playerDrew ? 'D' : 'L';
    const resultColor = playerWon
      ? 'bg-emerald-500 text-white'
      : playerDrew
        ? 'bg-amber-500 text-white'
        : 'bg-red-500 text-white';

    // Week-over-week trend indicators for Form, Morale, Fitness
    const formDelta = latestMatch && previousMatch
      ? +(latestMatch.playerRating - previousMatch.playerRating).toFixed(1)
      : null;

    const moraleDelta = latestMatch
      ? playerWon ? 2 : playerDrew ? 0 : -1
      : null;
    const fitnessDelta = latestMatch
      ? -(Math.min(latestMatch.playerMinutesPlayed, 90) / 30)
      : null;

    // League position context
    const clubStanding = leagueTable.find(s => s.clubId === currentClub.id);
    const currentPosition = clubStanding ? leagueTable.indexOf(clubStanding) + 1 : null;
    const topPoints = leagueTable.length > 0 ? Math.max(...leagueTable.map(s => s.points)) : 0;
    const pointsOffLead = clubStanding ? (topPoints - clubStanding.points) : 0;

    // Previous league position from seasons history
    let previousPosition: number | null = null;
    if (gameState.seasons.length > 0) {
      const prevSeason = gameState.seasons[gameState.seasons.length - 1];
      if (prevSeason && prevSeason.number === currentSeason) {
        previousPosition = null;
      }
    }

    // League name from club
    const leagueName = currentClub.league || 'League';

    // Training sessions from this week (use last 2 entries as recent)
    const recentTraining = trainingHistory.slice(-2);

    // Training gains summary
    const lastTraining = recentTraining.length > 0 ? recentTraining[recentTraining.length - 1] : null;

    // Training type labels and icons
    const trainingTypeLabels: Record<string, string> = {
      attacking: 'Attacking',
      defensive: 'Defensive',
      physical: 'Physical',
      technical: 'Technical',
      tactical: 'Tactical',
      recovery: 'Recovery',
    };

    const trainingTypeIcons: Record<string, string> = {
      attacking: '⚽',
      defensive: '🛡️',
      physical: '💪',
      technical: '🧠',
      tactical: '📋',
      recovery: '🩹',
    };

    // Intensity labels
    const intensityLabel = lastTraining
      ? lastTraining.intensity >= 90 ? 'High' : lastTraining.intensity >= 60 ? 'Medium' : 'Low'
      : null;

    const intensityColor = lastTraining
      ? lastTraining.intensity >= 90 ? 'text-red-400' : lastTraining.intensity >= 60 ? 'text-amber-400' : 'text-emerald-400'
      : null;

    // Week notifications
    const weekNotifications = notifications.slice(0, 5);

    // Form icon based on current form
    const formIcon = player.form >= 7 ? 'trending-up' : player.form >= 5 ? 'minus' : 'trending-down';

    // Performance Score (0-100)
    const performanceScore = latestMatch
      ? Math.round(Math.min(100,
          (latestMatch.playerRating / 10) * 40 +
          (player.form / 10) * 30 +
          (player.fitness / 100) * 15 +
          Math.min(15, (latestMatch.playerGoals * 3 + latestMatch.playerAssists * 2))
        ))
      : Math.round(Math.min(100, (player.form / 10) * 40 + (player.fitness / 100) * 30 + 20));

    // Attribute changes from training
    const attributeChanges: { attribute: string; change: number }[] = [];
    if (lastTraining && lastTraining.focusAttribute) {
      const baseGain = 0.5 + (lastTraining.intensity / 100) * 1.0;
      attributeChanges.push({ attribute: lastTraining.focusAttribute, change: +baseGain.toFixed(1) });
    }
    if (latestMatch && latestMatch.playerMinutesPlayed > 60 && latestMatch.playerRating >= 7.5) {
      const matchGain = +((latestMatch.playerRating - 7.0) * 0.5).toFixed(1);
      if (matchGain > 0) {
        attributeChanges.push({ attribute: 'Composure', change: matchGain });
      }
    }

    // Financial summary
    const weeklyWage = ((player.contract as any)?.weeklyWage ?? 15000) / 1000;
    const matchBonus = latestMatch
      ? ((playerWon ? 5000 : playerDrew ? 2000 : 0) + (latestMatch.playerGoals * 2500) + (latestMatch.playerAssists * 1500)) / 1000
      : 0;
    const weeklyExpenses = 1.8;

    // Week highlights
    const weekHighlights: { icon: string; label: string; value: string; colorClass: string }[] = [];
    if (latestMatch) {
      weekHighlights.push({
        icon: playerWon ? '\u{1F3C6}' : playerDrew ? '\u{1F91D}' : '\u{1F624}',
        label: 'Match Result',
        value: `${resultLabel} ${latestMatch.homeScore}-${latestMatch.awayScore}`,
        colorClass: playerWon ? 'border-emerald-500/20 bg-emerald-500/5' : playerDrew ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5',
      });
    }
    if (lastTraining) {
      weekHighlights.push({
        icon: trainingTypeIcons[lastTraining.type] || '\u{1F3CB}',
        label: 'Training',
        value: `${trainingTypeLabels[lastTraining.type] || lastTraining.type} (${intensityLabel})`,
        colorClass: 'border-sky-500/20 bg-sky-500/5',
      });
    }
    if (attributeChanges.length > 0) {
      weekHighlights.push({
        icon: '\u{1F4C8}',
        label: 'Attributes',
        value: `+${attributeChanges.length} improvement${attributeChanges.length > 1 ? 's' : ''}`,
        colorClass: 'border-emerald-500/20 bg-emerald-500/5',
      });
    }
    weekHighlights.push({
      icon: '\u{1F4B0}',
      label: 'Income',
      value: formatCurrency(weeklyWage + matchBonus, 'K'),
      colorClass: 'border-sky-500/20 bg-sky-500/5',
    });

    // ── Data for new SVG visualizations ──

    // Match Performance Trend: 8-point ratings (oldest to newest)
    const trendRatings = (() => {
      const real = recentResults.slice(0, 5).map(r => r.playerRating).reverse();
      const padLen = Math.max(0, 8 - real.length);
      const base = real.length > 0 ? real[0] : 6.0;
      const padded = Array.from({ length: padLen }, (_, i) =>
        +(Math.max(4, Math.min(10, base - (padLen - i) * 0.12))).toFixed(1)
      );
      return [...padded, ...real];
    })();

    // Weekly Form Distribution (last 8 matches)
    const formDist = recentResults.slice(0, 8).reduce(
      (acc, r) => {
        const isHome = r.homeClub.id === currentClub.id;
        const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
        const lost = isHome ? r.awayScore > r.homeScore : r.homeScore > r.awayScore;
        if (won) return { ...acc, wins: acc.wins + 1 };
        if (lost) return { ...acc, losses: acc.losses + 1 };
        return { ...acc, draws: acc.draws + 1 };
      },
      { wins: 0, draws: 0, losses: 0 }
    );
    const noMatchCount = Math.max(0, 8 - recentResults.slice(0, 8).length);

    // Attribute levels for radar chart
    const radarAttrs = {
      pace: player.attributes.pace,
      shooting: player.attributes.shooting,
      passing: player.attributes.passing,
      physical: player.attributes.physical,
      mental: player.morale,
    };

    // Financial breakdown (in thousands)
    const finances = {
      wage: weeklyWage,
      matchBonus,
      endorsements: +(weeklyWage * 0.15).toFixed(1),
      expenses: weeklyExpenses,
      savings: +(weeklyWage * 0.3).toFixed(1),
    };

    // Training intensity
    const trainingIntensity = lastTraining?.intensity ?? 0;

    // Position trajectory (synthetic 8 weeks)
    const positionTrajectory = Array.from({ length: 8 }, (_, i) => {
      const base = currentPosition ?? 10;
      if (i === 7) return base;
      return Math.max(1, Math.min(20, base + Math.round(Math.sin(i * 0.9) * 2 + (i - 3) * 0.3)));
    });

    // Event priority data
    const eventTypeColors: Record<string, string> = {
      TRANSFER_RUMOR: '#00E5FF',
      MEDIA_INTERVIEW: '#FF5500',
      PERSONAL_LIFE: '#CCFF00',
      TEAM_CONFLICT: '#FF3333',
      MENTORSHIP: '#00E5FF',
      SPONSORSHIP: '#CCFF00',
    };
    const eventPriorityData = activeEvents.reduce(
      (acc, e) => {
        const existing = acc.find(a => a.type === e.type);
        if (existing) {
          return acc.map(a => a.type === e.type ? { ...a, count: a.count + 1 } : a);
        }
        return [...acc, { type: e.type, count: 1, color: eventTypeColors[e.type] ?? '#999999' }];
      },
      [] as { type: string; count: number; color: string }[]
    ).slice(0, 5);

    // Goal contribution from latest match
    const goalContribution = latestMatch
      ? {
          goals: latestMatch.playerGoals,
          assists: latestMatch.playerAssists,
          keyPasses: Math.max(0, latestMatch.playerAssists + Math.round(latestMatch.playerRating - 6)),
        }
      : { goals: 0, assists: 0, keyPasses: 0 };

    // Morale trend (6 points)
    const moraleTrend = (() => {
      const base = player.morale;
      const recent = recentResults.slice(-6);
      const result = recent.map((r, idx) => {
        const isHome = r.homeClub.id === currentClub.id;
        const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
        const lost = isHome ? r.awayScore > r.homeScore : r.homeScore > r.awayScore;
        const delta = won ? 3 : lost ? -2 : 0;
        return Math.max(10, Math.min(100, base + delta - (recent.length - 1 - idx) * 1.5));
      });
      const padLen = Math.max(0, 6 - result.length);
      const padded = Array.from({ length: padLen }, (_, i) =>
        Math.max(10, Math.min(100, base - (padLen - i) * 2))
      );
      return [...padded, ...result];
    })();

    return {
      player, currentClub, latestMatch, previousMatch,
      playerWon, playerDrew, playerLost,
      resultLabel, resultColor,
      formDelta, moraleDelta, fitnessDelta,
      currentPosition, topPoints, pointsOffLead,
      previousPosition, leagueName,
      recentTraining, lastTraining,
      trainingTypeLabels, trainingTypeIcons,
      intensityLabel, intensityColor,
      weekNotifications, formIcon,
      currentWeek, currentSeason,
      recentResults,
      performanceScore, attributeChanges, weeklyWage, matchBonus, weeklyExpenses, weekHighlights,
      // New SVG data
      trendRatings, formDist, noMatchCount, radarAttrs,
      finances, trainingIntensity, positionTrajectory,
      eventPriorityData, goalContribution, moraleTrend,
    };
  }, [gameState, notifications]);

  if (!gameState || !computed) return null;

  const {
    player, currentClub, latestMatch,
    playerWon, playerDrew, playerLost,
    resultLabel, resultColor,
    formDelta, moraleDelta, fitnessDelta,
    currentPosition, pointsOffLead, leagueName,
    lastTraining, trainingTypeLabels, trainingTypeIcons,
    intensityLabel, intensityColor,
    formIcon,
    currentWeek, currentSeason,
    performanceScore, attributeChanges, weeklyWage, matchBonus, weeklyExpenses, weekHighlights,
    // New SVG data
    trendRatings, formDist, noMatchCount, radarAttrs,
    finances, trainingIntensity, positionTrajectory,
    eventPriorityData, goalContribution, moraleTrend,
  } = computed;

  // Trend indicator component
  const TrendIndicator = ({ delta, format = (d: number) => (d > 0 ? `+${d}` : `${d}`) }: {
    delta: number | null;
    format?: (d: number) => string;
  }) => {
    if (delta === null) return null;
    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
          <ArrowUp className="h-3 w-3" />
          {format(delta)}
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-semibold">
          <ArrowDown className="h-3 w-3" />
          {format(delta)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-slate-500 text-xs">
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  };

  // Mini progress bar component
  const MiniProgressBar = ({ value, max = 100, thresholds }: { value: number; max?: number; thresholds: [number, number] }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${getStatBarColor(value, thresholds)} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#30363d] bg-[#161b22]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-md">
                    <span className="text-xs font-bold text-emerald-400">WK {currentWeek}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Weekly Report</h2>
                  <p className="text-xs text-[#8b949e]">Season {currentSeason}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-5 space-y-4">

            {/* ── Performance Score + Week Highlights ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex gap-4 items-start"
            >
              <PerformanceRing score={performanceScore} size={110} strokeWidth={7} />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-[#8b949e] font-semibold">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Week Highlights</span>
                </div>
                {weekHighlights.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${h.colorClass}`}
                  >
                    <span className="text-sm shrink-0">{h.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#8b949e] block">{h.label}</span>
                      <span className="text-xs font-medium text-[#c9d1d9] truncate block">{h.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── SVG: Season Progress Ring + Weekly Form Donut ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.06 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Flag className="h-3.5 w-3.5" />
                  <span>Season Progress</span>
                </div>
                <SeasonProgressRing currentWeek={currentWeek} totalWeeks={38} />
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Form Distribution</span>
                </div>
                <WeeklyFormDonut
                  wins={formDist.wins}
                  draws={formDist.draws}
                  losses={formDist.losses}
                  noMatch={noMatchCount}
                />
              </div>
            </motion.div>

            {/* ── Match Result Card ── */}
            {latestMatch ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <Swords className="h-3.5 w-3.5" />
                  <span>Match Result</span>
                </div>
                <div className={`rounded-lg border-l-4 p-4 ${
                  playerWon
                    ? 'bg-emerald-950/30 border-l-emerald-500 border border-emerald-800/30'
                    : playerDrew
                      ? 'bg-amber-950/30 border-l-amber-500 border border-amber-800/30'
                      : 'bg-red-950/30 border-l-red-500 border border-red-800/30'
                }`}>
                  {/* W/D/L badge + competition */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${resultColor}`}>
                      {resultLabel}
                    </span>
                    {latestMatch.competition && (
                      <span className="text-[10px] text-[#8b949e]">{latestMatch.competition}</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{latestMatch.homeClub.logo}</span>
                      <span className="text-sm font-semibold text-[#c9d1d9] truncate">
                        {latestMatch.homeClub.shortName || latestMatch.homeClub.name.slice(0, 3)}
                      </span>
                    </div>
                    <div className="text-xl font-black text-white px-3 shrink-0">
                      {latestMatch.homeScore} - {latestMatch.awayScore}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-[#c9d1d9] truncate">
                        {latestMatch.awayClub.shortName || latestMatch.awayClub.name.slice(0, 3)}
                      </span>
                      <span className="text-lg shrink-0">{latestMatch.awayClub.logo}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#30363d]">
                    <div className="text-center">
                      <div
                        className="text-2xl font-black"
                        style={{
                          color: latestMatch.playerRating >= 7
                            ? '#10b981'
                            : latestMatch.playerRating >= 6
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {latestMatch.playerRating.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-[#8b949e]">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-400">{latestMatch.playerGoals}</div>
                      <div className="text-[10px] text-[#8b949e]">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{latestMatch.playerAssists}</div>
                      <div className="text-[10px] text-[#8b949e]">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#c9d1d9]">
                        {latestMatch.playerMinutesPlayed}&apos;
                      </div>
                      <div className="text-[10px] text-[#8b949e]">Mins</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg border-l-4 border-l-slate-600"
              >
                <Swords className="h-5 w-5 text-[#484f58]" />
                <div>
                  <p className="text-sm text-[#8b949e]">No match this week</p>
                  <p className="text-xs text-[#484f58]">Training and rest week</p>
                </div>
              </motion.div>
            )}

            {/* ── SVG: Match Performance Trend Area Chart ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
              className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                <LineChart className="h-3.5 w-3.5" />
                <span>Rating Trend (Last 8)</span>
              </div>
              <MatchPerformanceTrend ratings={trendRatings} />
            </motion.div>

            {/* ── League Position Context ── */}
            {currentPosition !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`rounded-lg p-3 border-l-4 ${getStatAccentColor(
                  currentPosition <= 3 ? 10 - currentPosition : 0,
                  [7, 5]
                )} bg-[#21262d]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Medal className={`h-4 w-4 ${
                      currentPosition === 1
                        ? 'text-amber-400'
                        : currentPosition <= 4
                          ? 'text-emerald-400'
                          : currentPosition <= 8
                            ? 'text-blue-400'
                            : 'text-slate-400'
                    }`} />
                    <span className="text-sm text-[#c9d1d9]">
                      {currentPosition === 1
                        ? `You're ${formatPosition(currentPosition)} in ${leagueName}!`
                        : `${formatPosition(currentPosition)} in ${leagueName}`}
                    </span>
                  </div>
                  {currentPosition !== 1 && (
                    <span className="text-xs text-[#8b949e]">
                      {pointsOffLead === 0
                        ? 'Level on points'
                        : `${pointsOffLead} pt${pointsOffLead !== 1 ? 's' : ''} off the lead`}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SVG: League Position Trajectory + Weekly Goal Contribution ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Position Trajectory</span>
                </div>
                <LeaguePositionTrajectory positions={positionTrajectory} />
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Target className="h-3.5 w-3.5" />
                  <span>Goal Contribution</span>
                </div>
                <WeeklyGoalContribution
                  goals={goalContribution.goals}
                  assists={goalContribution.assists}
                  keyPasses={goalContribution.keyPasses}
                />
              </div>
            </motion.div>

            {/* ── Player Status with Trend Indicators ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Zap className="h-3.5 w-3.5" />
                <span>Player Status</span>
              </div>
              <div className="space-y-2">
                {/* Form */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.form, [7, 5])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {formIcon === 'trending-up' ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : formIcon === 'trending-down' ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      <span className="text-xs text-[#8b949e]">Form</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#c9d1d9]">{player.form.toFixed(1)}</span>
                      <TrendIndicator delta={formDelta} format={(d) => (d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1))} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.form} max={10} thresholds={[7, 5]} />
                </div>

                {/* Morale */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.morale, [70, 40])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs text-[#8b949e]">Morale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-400">{player.morale}</span>
                      <TrendIndicator delta={moraleDelta} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.morale} max={100} thresholds={[70, 40]} />
                </div>

                {/* Fitness */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.fitness, [70, 40])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-[#8b949e]">Fitness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-400">{player.fitness}</span>
                      <TrendIndicator delta={fitnessDelta} format={(d) => (d > 0 ? `+${d.toFixed(0)}` : d.toFixed(0))} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.fitness} max={100} thresholds={[70, 40]} />
                </div>
              </div>

              {/* Injury Status */}
              {player.injuryWeeks > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-950/30 border border-red-800/30 rounded-lg p-3 border-l-4 border-l-red-500 flex items-center gap-3"
                >
                  <span className="text-xl">🏥</span>
                  <div>
                    <p className="text-sm font-semibold text-red-300">Injured!</p>
                    <p className="text-xs text-red-400/70">
                      {player.injuryWeeks} week{player.injuryWeeks > 1 ? 's' : ''} remaining until recovery
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* ── SVG: Energy & Fitness Split Ring + Morale Trend Line ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.17 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Energy & Fitness</span>
                </div>
                <EnergyFitnessSplitRing fitness={player.fitness} />
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Brain className="h-3.5 w-3.5" />
                  <span>Morale Trend</span>
                </div>
                <MoraleTrendLine moralePoints={moraleTrend} />
              </div>
            </motion.div>

            {/* ── Training Summary ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Training</span>
              </div>

              {lastTraining ? (
                <div className="bg-[#21262d] rounded-lg p-3 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {trainingTypeIcons[lastTraining.type] || '🏋️'}
                      </span>
                      <span className="text-sm font-semibold text-[#c9d1d9]">
                        {trainingTypeLabels[lastTraining.type] || lastTraining.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {intensityLabel && (
                        <span className={`text-xs font-semibold ${intensityColor}`}>
                          {intensityLabel} ({lastTraining.intensity}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {lastTraining.focusAttribute && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-[#8b949e]">
                        Focus: <span className="text-emerald-400 font-medium">{lastTraining.focusAttribute}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#8b949e]">
                    <span>Training completed this week</span>
                    <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-[10px] px-1.5">
                      ✓ Done
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-[#21262d] rounded-lg p-3 border-l-4 border-l-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-[#484f58]" />
                      <span className="text-sm text-[#8b949e]">No training completed</span>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                      {gameState.trainingAvailable} left
                    </Badge>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── SVG: Training Intensity Gauge + Attribute Radar ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.21 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Training Intensity</span>
                </div>
                <TrainingIntensityGauge intensity={trainingIntensity} />
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]">
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Attribute Radar</span>
                </div>
                <AttributeRadar
                  pace={radarAttrs.pace}
                  shooting={radarAttrs.shooting}
                  passing={radarAttrs.passing}
                  physical={radarAttrs.physical}
                  mental={radarAttrs.mental}
                />
              </div>
            </motion.div>

            {/* ── Attribute Changes This Week ── */}
            {attributeChanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Attribute Changes</span>
                </div>
                <div className="space-y-1.5">
                  {attributeChanges.map((ac, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2.5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-sm text-[#c9d1d9]">{ac.attribute}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">+{ac.change}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Financial Summary ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.27 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Wallet className="h-3.5 w-3.5" />
                <span>Financial Summary</span>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                  </div>
                  <span className="text-sm font-bold text-sky-400">{formatCurrency(weeklyWage, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Match Bonus</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(matchBonus, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs text-[#8b949e]">Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-red-400">-{formatCurrency(weeklyExpenses, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-semibold text-[#c9d1d9]">Net Income</span>
                  <span className={`text-sm font-bold ${weeklyWage + matchBonus - weeklyExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(weeklyWage + matchBonus - weeklyExpenses, 'K')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── SVG: Financial Breakdown Bars ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Financial Breakdown</span>
              </div>
              <FinancialBreakdown
                wage={finances.wage}
                matchBonus={finances.matchBonus}
                endorsements={finances.endorsements}
                expenses={finances.expenses}
                savings={finances.savings}
              />
            </motion.div>

            {/* ── Active Events ── */}
            {gameState.activeEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Pending Events</span>
                  <Badge variant="outline" className="border-amber-700 text-amber-400 text-[10px] px-1.5">
                    {gameState.activeEvents.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {gameState.activeEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="bg-amber-950/20 border border-amber-800/20 rounded-lg p-3 border-l-4 border-l-amber-500"
                    >
                      <p className="text-sm font-semibold text-amber-300">{event.title}</p>
                      <p className="text-xs text-[#8b949e] mt-0.5 line-clamp-2">{event.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── SVG: Event Priority Bars ── */}
            {eventPriorityData.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.30 }}
                className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222222]"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold mb-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Event Priorities</span>
                </div>
                <EventPriorityBars events={eventPriorityData} />
              </motion.div>
            )}

            {/* ── Market Value ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#21262d] rounded-lg p-3 flex items-center justify-between border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-[#8b949e]">Market Value</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(player.marketValue, 'M')}
              </span>
            </motion.div>

            {/* ── Next Week Preview ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Next Week Preview</span>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 space-y-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Upcoming Match</span>
                  </div>
                  <p className="text-sm text-[#c9d1d9] font-medium pl-5">
                    {currentClub.shortName || currentClub.name} vs TBD — Week {currentWeek + 1}
                  </p>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Training Recommendation</span>
                  </div>
                  <p className="text-sm text-[#c9d1d9] pl-5">
                    {player.fitness < 50
                      ? 'Focus on recovery sessions to rebuild fitness'
                      : player.form < 6
                        ? 'Technical drills recommended to improve form'
                        : 'High-intensity tactical training available'
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Quick Action Buttons ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex gap-2"
            >
              <Button
                onClick={() => {
                  onClose();
                  setScreen('training');
                }}
                className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm gap-1.5"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                Train Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setScreen('analytics');
                }}
                className="flex-1 h-10 border-slate-700 text-[#c9d1d9] hover:bg-slate-800 hover:text-white font-semibold rounded-lg text-sm gap-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Stats
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#30363d] bg-[#161b22]">
            <Button
              onClick={onClose}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg"
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
