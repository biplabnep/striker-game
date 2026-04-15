'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Heart,
  AlertTriangle,
  Shield,
  TrendingUp,
  Clock,
  Target,
  Stethoscope,
  Users,
  Award,
  Brain,
  Dumbbell,
  Leaf,
} from 'lucide-react';

// ============================================================
// Color Palette (Gritty Futurism Web3)
// ============================================================
const COLORS = {
  oledBlack: '#000000',
  bgPrimary: '#0d1117',
  bgCard: '#161b22',
  bgElevated: '#21262d',
  borderDefault: '#30363d',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#484f58',
} as const;

// ============================================================
// Animation Variants (opacity only — Uncodixify 4)
// ============================================================
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

const fadeInDelayed = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay },
});

// ============================================================
// Tab 1: Injury History — SVG 1: InjuryTypeDonut
// 4-segment donut chart (Muscle / Joint / Ligament / Bone)
// ============================================================
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function InjuryTypeDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const cx = 80;
  const cy = 60;
  const outerR = 48;
  const innerR = 30;
  const gapAngle = 0.04;

  const arcPaths = useMemo(() => {
    if (total === 0) return [];
    let startAngle = -Math.PI / 2;
    return segments
      .filter((s) => s.value > 0)
      .map((seg) => {
        const sweep = (seg.value / total) * (2 * Math.PI) - gapAngle;
        const sA = startAngle + gapAngle / 2;
        const eA = sA + Math.max(sweep, 0.01);
        startAngle += (seg.value / total) * (2 * Math.PI);

        const outerX1 = cx + outerR * Math.cos(sA);
        const outerY1 = cy + outerR * Math.sin(sA);
        const outerX2 = cx + outerR * Math.cos(eA);
        const outerY2 = cy + outerR * Math.sin(eA);
        const innerX1 = cx + innerR * Math.cos(eA);
        const innerY1 = cy + innerR * Math.sin(eA);
        const innerX2 = cx + innerR * Math.cos(sA);
        const innerY2 = cy + innerR * Math.sin(sA);

        const largeArc = sweep > Math.PI ? 1 : 0;
        const d = [
          `M ${outerX1} ${outerY1}`,
          `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
          `L ${innerX1} ${innerY1}`,
          `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerX2} ${innerY2}`,
          'Z',
        ].join(' ');
        return { ...seg, d };
      });
  }, [segments, total, cx, cy, outerR, innerR]);

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={(outerR + innerR) / 2}
        fill="none"
        stroke={COLORS.borderDefault}
        strokeWidth={outerR - innerR}
        opacity={0.3}
      />
      {/* Donut segments */}
      {arcPaths.map((arc, i) => (
        <motion.path
          key={arc.label}
          d={arc.d}
          fill={arc.color}
          opacity={0.85}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={COLORS.textPrimary} fontSize="14" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        TOTAL
      </text>
      {/* Legend on the right side */}
      {segments.map((seg, i) => {
        const lx = 165;
        const ly = 14 + i * 24;
        return (
          <g key={seg.label}>
            <rect x={lx} y={ly} width="8" height="8" rx="2" fill={seg.color} opacity={0.85} />
            <text x={lx + 14} y={ly + 8} fill={COLORS.textSecondary} fontSize="10">
              {seg.label}
            </text>
            <text x={lx + 120} y={ly + 8} fill={COLORS.textPrimary} fontSize="10" fontWeight="600" textAnchor="end">
              {seg.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 1: Injury History — SVG 2: InjuryFrequencyLine
// 8-season line chart showing injury frequency per season
// ============================================================
function InjuryFrequencyLine({ data }: { data: { season: number; count: number }[] }) {
  const padX = 40;
  const padY = 14;
  const chartW = 260;
  const chartH = 80;
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (d.count / maxVal) * chartH,
    val: d.count,
    season: d.season,
  }));

  const lineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr = `${padX},${padY + chartH} ${lineStr} ${padX + chartW},${padY + chartH}`;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const gy = padY + chartH - frac * chartH;
        return (
          <line
            key={frac}
            x1={padX}
            y1={gy}
            x2={padX + chartW}
            y2={gy}
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.4}
          />
        );
      })}
      {/* Y-axis labels */}
      {[0, 1].map((frac) => {
        const gy = padY + chartH - frac * chartH;
        const label = Math.round(frac * maxVal);
        return (
          <text key={frac} x={padX - 6} y={gy + 3} textAnchor="end" fill={COLORS.textMuted} fontSize="8">
            {label}
          </text>
        );
      })}
      {/* Area fill */}
      <motion.polygon
        points={areaStr}
        fill={COLORS.cyanBlue}
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.polyline
        points={lineStr}
        fill="none"
        stroke={COLORS.cyanBlue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={COLORS.bgCard}
          stroke={COLORS.cyanBlue}
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* X-axis season labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={padY + chartH + 14} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
          S{p.season}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// Tab 1: Injury History — SVG 3: RecoveryTimeGauge
// Semi-circular gauge showing average recovery days (0-100)
// ============================================================
function RecoveryTimeGauge({ value, label }: { value: number; label: string }) {
  const cx = 160;
  const cy = 100;
  const radius = 80;
  const strokeW = 14;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = Math.PI;

  const valueAngle = startAngle + (Math.min(value, 100) / 100) * totalAngle;
  const valueX = cx + radius * Math.cos(valueAngle);
  const valueY = cy - radius * Math.sin(valueAngle);

  // Background arc
  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const fgPath = describeArc(cx, cy, radius, startAngle, valueAngle);

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Background arc */}
      <path d={bgPath} fill="none" stroke={COLORS.borderDefault} strokeWidth={strokeW} strokeLinecap="round" opacity={0.4} />
      {/* Value arc */}
      <motion.path
        d={fgPath}
        fill="none"
        stroke={COLORS.neonLime}
        strokeWidth={strokeW}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      {/* Value text */}
      <text x={cx} y={cy - 16} textAnchor="middle" fill={COLORS.neonLime} fontSize="22" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy - 2} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        DAYS AVG
      </text>
      {/* Label */}
      <text x={cx} y={116} textAnchor="middle" fill={COLORS.textSecondary} fontSize="9">
        {label}
      </text>
      {/* Scale markers */}
      {[0, 25, 50, 75, 100].map((mark) => {
        const angle = startAngle + (mark / 100) * totalAngle;
        const mx = cx + (radius + 12) * Math.cos(angle);
        const my = cy - (radius + 12) * Math.sin(angle);
        return (
          <text key={mark} x={mx} y={my + 3} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
            {mark}
          </text>
        );
      })}
    </svg>
  );
}

// Helper: describe an SVG arc path
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy - r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy - r * Math.sin(endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const sweepFlag = sweep > 0 ? 0 : 1;
  if (Math.abs(sweep) < 0.01) {
    return `M ${sx} ${sy}`;
  }
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`;
}

// ============================================================
// Tab 2: Risk Assessment — SVG 4: InjuryRiskRadar
// 5-axis radar chart (Muscle / Joint / Fatigue / Age / History)
// ============================================================
function InjuryRiskRadar({ data }: { data: { axis: string; value: number }[] }) {
  const cx = 80;
  const cy = 60;
  const maxR = 46;
  const n = data.length;
  const step = (2 * Math.PI) / n;

  // Grid polygons at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * step;
    const r = (d.value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const dataStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Grid polygons */}
      {gridLevels.map((level, li) => {
        const pts = data.map((_, i) => {
          const angle = -Math.PI / 2 + i * step;
          const r = level * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.5 - li * 0.08}
          />
        );
      })}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = -Math.PI / 2 + i * step;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.4}
          />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        points={dataStr}
        fill={COLORS.electricOrange}
        fillOpacity={0.15}
        stroke={COLORS.electricOrange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={COLORS.electricOrange}
          stroke={COLORS.bgCard}
          strokeWidth="1.5"
        />
      ))}
      {/* Axis labels */}
      {data.map((d, i) => {
        const angle = -Math.PI / 2 + i * step;
        const labelR = maxR + 14;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text
            key={d.axis}
            x={lx}
            y={ly + 3}
            textAnchor="middle"
            fill={COLORS.textSecondary}
            fontSize="8"
          >
            {d.axis}
          </text>
        );
      })}
      {/* Legend on right side */}
      {data.map((d, i) => {
        const lx = 180;
        const ly = 12 + i * 20;
        return (
          <g key={d.axis}>
            <text x={lx} y={ly} fill={COLORS.textSecondary} fontSize="9">
              {d.axis}
            </text>
            <rect x={lx + 60} y={ly - 8} width={d.value * 0.8} height="10" rx="2" fill={COLORS.electricOrange} opacity={0.6} />
            <text x={lx + 60 + d.value * 0.8 + 6} y={ly} fill={COLORS.textPrimary} fontSize="9" fontWeight="600">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 2: Risk Assessment — SVG 5: VulnerabilityBars
// 5 horizontal bars (Knees / Ankles / Hamstrings / Shoulders / Back)
// ============================================================
function VulnerabilityBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const barH = 12;
  const gap = 6;
  const maxBarW = 140;
  const labelW = 78;
  const startX = labelW + 8;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {data.map((d, i) => {
        const y = 8 + i * (barH + gap);
        const barW = (d.value / 100) * maxBarW;
        return (
          <g key={d.label}>
            {/* Label */}
            <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill={COLORS.textSecondary} fontSize="10">
              {d.label}
            </text>
            {/* Background bar */}
            <rect x={startX} y={y} width={maxBarW} height={barH} rx="3" fill={COLORS.bgElevated} opacity={0.5} />
            {/* Value bar */}
            <motion.rect
              x={startX}
              y={y}
              width={barW}
              height={barH}
              rx="3"
              fill={d.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            />
            {/* Value text */}
            <text x={startX + barW + 6} y={y + barH / 2 + 3} fill={COLORS.textPrimary} fontSize="10" fontWeight="600">
              {d.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 2: Risk Assessment — SVG 6: FitnessImpactArea
// 8-match area chart showing fitness impact after matches
// ============================================================
function FitnessImpactArea({ data }: { data: { match: number; impact: number }[] }) {
  const padX = 36;
  const padY = 10;
  const chartW = 268;
  const chartH = 82;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (d.impact / 100) * chartH,
    val: d.impact,
    match: d.match,
  }));

  const lineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr = `${padX},${padY + chartH} ${lineStr} ${padX + chartW},${padY + chartH}`;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac) => {
        const gy = padY + chartH - frac * chartH;
        return (
          <line
            key={frac}
            x1={padX}
            y1={gy}
            x2={padX + chartW}
            y2={gy}
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.3}
          />
        );
      })}
      {/* Y-axis labels */}
      {[0, 50, 100].map((val) => {
        const gy = padY + chartH - (val / 100) * chartH;
        return (
          <text key={val} x={padX - 6} y={gy + 3} textAnchor="end" fill={COLORS.textMuted} fontSize="7">
            {val}%
          </text>
        );
      })}
      {/* Area fill */}
      <motion.polygon
        points={areaStr}
        fill={COLORS.neonLime}
        fillOpacity={0.2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.polyline
        points={lineStr}
        fill="none"
        stroke={COLORS.neonLime}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      />
      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={COLORS.neonLime}
          stroke={COLORS.bgCard}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
        />
      ))}
      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={padY + chartH + 14} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
          M{p.match}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// Tab 3: Prevention — SVG 7: PreventionScoreRing
// Circular ring (0-100) showing overall prevention score
// ============================================================
function PreventionScoreRing({ value, label }: { value: number; label: string }) {
  const cx = 80;
  const cy = 60;
  const radius = 44;
  const strokeW = 10;

  // Full circle background arc (top clockwise)
  const bgStart = Math.PI / 2;
  const bgEnd = Math.PI / 2 - 2 * Math.PI;
  const bgPath = describeCircleArc(cx, cy, radius, bgStart, bgEnd);

  // Value arc
  const clampedVal = Math.min(100, Math.max(0, value));
  const valEnd = Math.PI / 2 - (clampedVal / 100) * 2 * Math.PI;
  const valPath = clampedVal > 0 ? describeCircleArc(cx, cy, radius, bgStart, valEnd) : '';

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Background ring */}
      <path d={bgPath} fill="none" stroke={COLORS.borderDefault} strokeWidth={strokeW} strokeLinecap="round" opacity={0.35} />
      {/* Value ring */}
      {valPath && (
        <motion.path
          d={valPath}
          fill="none"
          stroke={COLORS.cyanBlue}
          strokeWidth={strokeW}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        />
      )}
      {/* Center value */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={COLORS.cyanBlue} fontSize="18" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        SCORE
      </text>
      {/* Right side details */}
      <text x={160} y={32} fill={COLORS.textSecondary} fontSize="10">Prevention</text>
      <text x={160} y={48} fill={COLORS.textMuted} fontSize="9">Overall Score</text>
      {/* Breakdown */}
      {[
        { l: 'Warmup Compliance', v: Math.min(100, value + 8) },
        { l: 'Rest Protocol', v: Math.min(100, value - 5) },
        { l: 'Load Management', v: Math.min(100, value + 2) },
        { l: 'Nutrition Plan', v: Math.min(100, value - 3) },
      ].map((item, i) => {
        const iy = 62 + i * 14;
        return (
          <g key={item.l}>
            <text x={160} y={iy} fill={COLORS.textMuted} fontSize="8">{item.l}</text>
            <rect x={268} y={iy - 8} width={Math.max(1, (item.v / 100) * 40)} height="8" rx="2" fill={COLORS.cyanBlue} opacity={0.5} />
            <text x={314} y={iy} textAnchor="end" fill={COLORS.textPrimary} fontSize="8">{Math.max(0, item.v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Helper: describe a circular arc path (SVG y-axis inverted)
function describeCircleArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy - r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy - r * Math.sin(endAngle);
  let sweep = startAngle - endAngle;
  if (sweep < 0) sweep += 2 * Math.PI;
  const largeArc = sweep > Math.PI ? 1 : 0;
  if (sweep < 0.01) return `M ${sx} ${sy}`;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

// ============================================================
// Tab 3: Prevention — SVG 8: TrainingLoadBars
// 5 vertical bars (Strength / Flexibility / Rest / Nutrition / Warmup)
// ============================================================
function TrainingLoadBars({ data }: { data: { label: string; value: number }[] }) {
  const barW = 36;
  const gap = 16;
  const totalW = data.length * barW + (data.length - 1) * gap;
  const startX = (320 - totalW) / 2;
  const maxBarH = 72;
  const baseY = 90;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Base line */}
      <line x1={startX - 10} y1={baseY} x2={startX + totalW + 10} y2={baseY} stroke={COLORS.borderDefault} strokeWidth="0.5" opacity={0.4} />
      {/* Bars */}
      {data.map((d, i) => {
        const x = startX + i * (barW + gap);
        const barH = (d.value / 100) * maxBarH;
        const y = baseY - barH;
        return (
          <g key={d.label}>
            {/* Background bar */}
            <rect x={x} y={baseY - maxBarH} width={barW} height={maxBarH} rx="3" fill={COLORS.bgElevated} opacity={0.3} />
            {/* Value bar */}
            <motion.rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="3"
              fill={COLORS.electricOrange}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            />
            {/* Value text */}
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={COLORS.electricOrange} fontSize="9" fontWeight="600">
              {d.value}
            </text>
            {/* Label */}
            <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" fill={COLORS.textSecondary} fontSize="8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 3: Prevention — SVG 9: RecoveryProtocolTimeline
// 8-node horizontal timeline (phases of recovery protocol)
// ============================================================
function RecoveryProtocolTimeline({ nodes }: { nodes: { label: string; status: 'done' | 'active' | 'pending' }[] }) {
  const padX = 20;
  const padY = 40;
  const nodeR = 10;
  const spacing = 38;
  const totalW = (nodes.length - 1) * spacing;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Connector line */}
      <line
        x1={padX + nodeR}
        y1={padY}
        x2={padX + totalW - nodeR}
        y2={padY}
        stroke={COLORS.borderDefault}
        strokeWidth="2"
        opacity={0.3}
      />
      {/* Nodes and labels */}
      {nodes.map((node, i) => {
        const x = padX + i * spacing;
        const fill =
          node.status === 'done'
            ? COLORS.neonLime
            : node.status === 'active'
              ? COLORS.electricOrange
              : COLORS.textMuted;
        const fillOp =
          node.status === 'done' ? 0.9 : node.status === 'active' ? 0.9 : 0.35;
        return (
          <g key={node.label}>
            {/* Node circle */}
            <circle cx={x} cy={padY} r={nodeR} fill={fill} fillOpacity={fillOp} stroke={COLORS.bgCard} strokeWidth="2.5" />
            {/* Step number */}
            <text
              x={x}
              y={padY + 3}
              textAnchor="middle"
              fill={COLORS.bgCard}
              fontSize="8"
              fontWeight="bold"
            >
              {i + 1}
            </text>
            {/* Label below */}
            <text x={x} y={padY + 24} textAnchor="middle" fill={COLORS.textSecondary} fontSize="7">
              {node.label}
            </text>
            {/* Status indicator */}
            <rect
              x={x - 8}
              y={padY + 28}
              width="16"
              height="3"
              rx="1.5"
              fill={fill}
              opacity={fillOp}
            />
          </g>
        );
      })}
      {/* Title text */}
      <text x={160} y={padY - 20} textAnchor="middle" fill={COLORS.textSecondary} fontSize="9">
        Recovery Protocol Phases
      </text>
      {/* Legend at bottom */}
      <g>
        <circle cx={80} cy={104} r="4" fill={COLORS.neonLime} opacity={0.9} />
        <text x={88} y={107} fill={COLORS.textMuted} fontSize="7">Done</text>
        <circle cx={140} cy={104} r="4" fill={COLORS.electricOrange} opacity={0.9} />
        <text x={148} y={107} fill={COLORS.textMuted} fontSize="7">Active</text>
        <circle cx={206} cy={104} r="4" fill={COLORS.textMuted} opacity={0.35} />
        <text x={214} y={107} fill={COLORS.textMuted} fontSize="7">Pending</text>
      </g>
    </svg>
  );
}

// ============================================================
// Tab 4: Medical Staff — SVG 10: StaffQualityRadar
// 5-axis radar (Physio / Doctor / Surgeon / Coach / Specialist)
// ============================================================
function StaffQualityRadar({ data }: { data: { axis: string; value: number }[] }) {
  const cx = 80;
  const cy = 60;
  const maxR = 46;
  const n = data.length;
  const step = (2 * Math.PI) / n;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * step;
    const r = (d.value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const dataStr = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Grid polygons */}
      {gridLevels.map((level, li) => {
        const pts = data.map((_, i) => {
          const angle = -Math.PI / 2 + i * step;
          const r = level * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.5 - li * 0.08}
          />
        );
      })}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = -Math.PI / 2 + i * step;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke={COLORS.borderDefault}
            strokeWidth="0.5"
            opacity={0.4}
          />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        points={dataStr}
        fill={COLORS.cyanBlue}
        fillOpacity={0.12}
        stroke={COLORS.cyanBlue}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={COLORS.cyanBlue}
          stroke={COLORS.bgCard}
          strokeWidth="1.5"
        />
      ))}
      {/* Axis labels */}
      {data.map((d, i) => {
        const angle = -Math.PI / 2 + i * step;
        const labelR = maxR + 14;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text
            key={d.axis}
            x={lx}
            y={ly + 3}
            textAnchor="middle"
            fill={COLORS.textSecondary}
            fontSize="8"
          >
            {d.axis}
          </text>
        );
      })}
      {/* Legend on right side */}
      {data.map((d, i) => {
        const lx = 175;
        const ly = 12 + i * 20;
        const barW = (d.value / 100) * 70;
        return (
          <g key={d.axis}>
            <text x={lx} y={ly} fill={COLORS.textSecondary} fontSize="9">
              {d.axis}
            </text>
            <rect x={lx + 62} y={ly - 8} width={barW} height="9" rx="2" fill={COLORS.cyanBlue} opacity={0.5} />
            <text x={lx + 62 + barW + 5} y={ly} fill={COLORS.textPrimary} fontSize="9" fontWeight="600">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 4: Medical Staff — SVG 11: TreatmentSuccessDonut
// 4-segment donut (Full / Partial / Ongoing / Failed) via .reduce()
// ============================================================
function TreatmentSuccessDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const cx = 80;
  const cy = 60;
  const outerR = 48;
  const innerR = 30;
  const gapAngle = 0.04;

  const arcPaths = useMemo(() => {
    if (total === 0) return [];
    let startAngle = -Math.PI / 2;
    return segments
      .filter((s) => s.value > 0)
      .map((seg) => {
        const sweep = (seg.value / total) * (2 * Math.PI) - gapAngle;
        const sA = startAngle + gapAngle / 2;
        const eA = sA + Math.max(sweep, 0.01);
        startAngle += (seg.value / total) * (2 * Math.PI);

        const outerX1 = cx + outerR * Math.cos(sA);
        const outerY1 = cy + outerR * Math.sin(sA);
        const outerX2 = cx + outerR * Math.cos(eA);
        const outerY2 = cy + outerR * Math.sin(eA);
        const innerX1 = cx + innerR * Math.cos(eA);
        const innerY1 = cy + innerR * Math.sin(eA);
        const innerX2 = cx + innerR * Math.cos(sA);
        const innerY2 = cy + innerR * Math.sin(sA);

        const largeArc = sweep > Math.PI ? 1 : 0;
        const d = [
          `M ${outerX1} ${outerY1}`,
          `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerX2} ${outerY2}`,
          `L ${innerX1} ${innerY1}`,
          `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerX2} ${innerY2}`,
          'Z',
        ].join(' ');
        return { ...seg, d };
      });
  }, [segments, total, cx, cy, outerR, innerR]);

  const successRate = total > 0
    ? Math.round(((segments.find((s) => s.label === 'Full')?.value ?? 0) / total) * 100)
    : 0;

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={(outerR + innerR) / 2}
        fill="none"
        stroke={COLORS.borderDefault}
        strokeWidth={outerR - innerR}
        opacity={0.3}
      />
      {/* Donut segments */}
      {arcPaths.map((arc, i) => (
        <motion.path
          key={arc.label}
          d={arc.d}
          fill={arc.color}
          opacity={0.85}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={COLORS.electricOrange} fontSize="14" fontWeight="bold">
        {successRate}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        SUCCESS
      </text>
      {/* Legend on right */}
      {segments.map((seg, i) => {
        const lx = 165;
        const ly = 14 + i * 24;
        return (
          <g key={seg.label}>
            <rect x={lx} y={ly} width="8" height="8" rx="2" fill={seg.color} opacity={0.85} />
            <text x={lx + 14} y={ly + 8} fill={COLORS.textSecondary} fontSize="10">
              {seg.label}
            </text>
            <text x={lx + 120} y={ly + 8} fill={COLORS.textPrimary} fontSize="10" fontWeight="600" textAnchor="end">
              {seg.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab 4: Medical Staff — SVG 12: FacilityRatingGauge
// Semi-circular gauge (0-100) for facility rating
// ============================================================
function FacilityRatingGauge({ value, label }: { value: number; label: string }) {
  const cx = 160;
  const cy = 100;
  const radius = 80;
  const strokeW = 14;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = Math.PI;

  const clampedValue = Math.min(100, Math.max(0, value));
  const valueAngle = startAngle + (clampedValue / 100) * totalAngle;

  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const fgPath = describeArc(cx, cy, radius, startAngle, valueAngle);

  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto">
      {/* Background arc */}
      <path d={bgPath} fill="none" stroke={COLORS.borderDefault} strokeWidth={strokeW} strokeLinecap="round" opacity={0.4} />
      {/* Value arc */}
      <motion.path
        d={fgPath}
        fill="none"
        stroke={COLORS.neonLime}
        strokeWidth={strokeW}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      {/* Value text */}
      <text x={cx} y={cy - 16} textAnchor="middle" fill={COLORS.neonLime} fontSize="22" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy - 2} textAnchor="middle" fill={COLORS.textMuted} fontSize="8">
        RATING
      </text>
      {/* Label */}
      <text x={cx} y={116} textAnchor="middle" fill={COLORS.textSecondary} fontSize="9">
        {label}
      </text>
      {/* Scale markers */}
      {[0, 25, 50, 75, 100].map((mark) => {
        const angle = startAngle + (mark / 100) * totalAngle;
        const mx = cx + (radius + 12) * Math.cos(angle);
        const my = cy - (radius + 12) * Math.sin(angle);
        return (
          <text key={mark} x={mx} y={my + 3} textAnchor="middle" fill={COLORS.textMuted} fontSize="7">
            {mark}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG Section Wrapper Card
// ============================================================
function SVGSectionCard({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div {...fadeInDelayed(delay)}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">{icon}</span>
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
              {title}
            </span>
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Stat Mini Box
// ============================================================
function StatMini({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
      <p className="text-[10px] text-[#484f58] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// Data generation helpers (all inline, no external deps)
// ============================================================

function generateInjuryTypeDonutData(
  injuries: { category: string }[]
): DonutSegment[] {
  const categoryMap: Record<string, string> = {
    muscle: 'Muscle',
    ligament: 'Ligament',
    bone: 'Bone',
    concussion: 'Head',
    illness: 'Illness',
  };
  const colorMap: Record<string, string> = {
    Muscle: '#FF5500',
    Ligament: '#00E5FF',
    Bone: '#CCFF00',
    Head: '#FF5500',
    Illness: '#CCFF00',
  };

  const counts = injuries.reduce<Record<string, number>>((acc, inj) => {
    const label = categoryMap[inj.category] || 'Other';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return ['Muscle', 'Ligament', 'Bone', 'Head'].map((label) => ({
    label,
    value: counts[label] || 0,
    color: colorMap[label],
  }));
}

function generateInjuryFrequencyData(
  injuries: { seasonSustained: number }[],
  currentSeason: number
): { season: number; count: number }[] {
  const seasons = Array.from({ length: 8 }, (_, i) => currentSeason - 7 + i);
  const counts = injuries.reduce<Record<string, number>>((acc, inj) => {
    acc[inj.seasonSustained] = (acc[inj.seasonSustained] || 0) + 1;
    return acc;
  }, {});
  return seasons.map((s) => ({
    season: s,
    count: counts[s] || 0,
  }));
}

function generateRiskRadarData(
  playerFitness: number,
  playerAge: number,
  injuryCount: number
): { axis: string; value: number }[] {
  const muscleRisk = Math.min(100, 20 + (100 - playerFitness) * 0.5 + injuryCount * 4);
  const jointRisk = Math.min(100, 15 + playerAge * 1.5 + injuryCount * 3);
  const fatigueRisk = Math.min(100, (100 - playerFitness) * 1.2 + 10);
  const ageRisk = Math.min(100, Math.max(0, (playerAge - 25) * 5));
  const historyRisk = Math.min(100, injuryCount * 12);

  return [
    { axis: 'Muscle', value: Math.round(muscleRisk) },
    { axis: 'Joint', value: Math.round(jointRisk) },
    { axis: 'Fatigue', value: Math.round(fatigueRisk) },
    { axis: 'Age', value: Math.round(ageRisk) },
    { axis: 'History', value: Math.round(historyRisk) },
  ];
}

function generateVulnerabilityData(
  injuries: { name: string }[],
  playerAge: number
): { label: string; value: number; color: string }[] {
  const regions: Record<string, number> = {
    Knees: 15,
    Ankles: 12,
    Hamstrings: 18,
    Shoulders: 8,
    Back: 10,
  };

  for (const inj of injuries) {
    const n = inj.name.toLowerCase();
    if (n.includes('knee') || n.includes('acl') || n.includes('mcl') || n.includes('cartilage')) regions.Knees += 12;
    if (n.includes('ankle')) regions.Ankles += 11;
    if (n.includes('hamstring')) regions.Hamstrings += 10;
    if (n.includes('shoulder')) regions.Shoulders += 9;
    if (n.includes('back') || n.includes('spasm')) regions.Back += 8;
  }

  if (playerAge > 30) {
    regions.Knees += 8;
    regions.Ankles += 5;
  }

  return Object.entries(regions).map(([label, raw]) => ({
    label,
    value: Math.min(100, Math.round(raw)),
    color: COLORS.cyanBlue,
  }));
}

function generateFitnessImpactData(): { match: number; impact: number }[] {
  return Array.from({ length: 8 }, (_, i) => ({
    match: i + 1,
    impact: Math.round(20 + Math.random() * 60 + (i < 3 ? 15 : 0)),
  }));
}

function generatePreventionScoreData(
  playerFitness: number,
  injuryCount: number
): number {
  const base = Math.min(100, Math.round(playerFitness * 0.7 + 20));
  const penalty = Math.min(30, injuryCount * 3);
  return Math.max(10, base - penalty);
}

function generateTrainingLoadData(
  playerFitness: number,
  currentInjuryWeeks: number
): { label: string; value: number }[] {
  const loadFactor = currentInjuryWeeks > 0 ? 0.4 : 1;
  return [
    { label: 'Strength', value: Math.round((playerFitness * 0.8 + 15) * loadFactor) },
    { label: 'Flex', value: Math.round((playerFitness * 0.6 + 30) * loadFactor) },
    { label: 'Rest', value: Math.round(100 - playerFitness * 0.5) },
    { label: 'Nutrition', value: Math.round(playerFitness * 0.5 + 40) },
    { label: 'Warmup', value: Math.round(playerFitness * 0.4 + 50) },
  ];
}

function generateRecoveryNodes(
  currentInjuryWeeksRemaining: number,
  totalWeeksOut: number
): { label: string; status: 'done' | 'active' | 'pending' }[] {
  const phases = [
    'Diagnosis',
    'Rest',
    'Treatment',
    'Rehab',
    'Strength',
    'Mobility',
    'Training',
    'Return',
  ];

  if (totalWeeksOut === 0) {
    return phases.map((label) => ({ label, status: 'pending' as const }));
  }

  const progress = 1 - currentInjuryWeeksRemaining / totalWeeksOut;
  const activeIndex = Math.min(7, Math.floor(progress * 8));

  return phases.map((label, i) => {
    if (i < activeIndex) return { label, status: 'done' as const };
    if (i === activeIndex) return { label, status: 'active' as const };
    return { label, status: 'pending' as const };
  });
}

function generateStaffRadarData(facilities: number, tier: number): { axis: string; value: number }[] {
  const base = Math.min(95, Math.round(facilities * 0.55 + (6 - tier) * 8 + 15));
  return [
    { axis: 'Physio', value: Math.min(99, base) },
    { axis: 'Doctor', value: Math.min(99, base + 3) },
    { axis: 'Surgeon', value: Math.max(20, base - 10) },
    { axis: 'Coach', value: Math.min(99, base + 5) },
    { axis: 'Specialist', value: Math.max(20, base - 5) },
  ];
}

function generateTreatmentSuccessData(
  injuries: { type: string; weeksRemaining?: number }[]
): DonutSegment[] {
  if (injuries.length === 0) {
    return [
      { label: 'Full', value: 0, color: '#00E5FF' },
      { label: 'Partial', value: 0, color: '#CCFF00' },
      { label: 'Ongoing', value: 0, color: '#FF5500' },
      { label: 'Failed', value: 0, color: '#FF3333' },
    ];
  }

  const counts = injuries.reduce<Record<string, number>>((acc, inj) => {
    if (inj.weeksRemaining !== undefined && inj.weeksRemaining > 0) {
      acc['Ongoing'] = (acc['Ongoing'] || 0) + 1;
    } else {
      // Deterministic categorization based on injury type
      if (inj.type === 'minor') acc['Full'] = (acc['Full'] || 0) + 1;
      else if (inj.type === 'moderate') acc['Partial'] = (acc['Partial'] || 0) + 1;
      else if (inj.type === 'severe') acc['Failed'] = (acc['Failed'] || 0) + 1;
      else acc['Full'] = (acc['Full'] || 0) + 1;
    }
    return acc;
  }, {});

  return [
    { label: 'Full', value: counts['Full'] || 0, color: '#00E5FF' },
    { label: 'Partial', value: counts['Partial'] || 0, color: '#CCFF00' },
    { label: 'Ongoing', value: counts['Ongoing'] || 0, color: '#FF5500' },
    { label: 'Failed', value: counts['Failed'] || 0, color: '#FF3333' },
  ];
}

function generateFacilityRating(facilities: number, tier: number): number {
  return Math.min(100, Math.round(facilities * 0.6 + (6 - tier) * 5 + 20));
}

// ============================================================
// Sub-Section: Insight Banner
// ============================================================
function InsightBanner({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <motion.div
      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#21262d]"
      style={{ backgroundColor: `${color}08` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#c9d1d9]">{title}</p>
        <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// Sub-Section: Color Legend
// ============================================================
function ColorLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-3 flex-wrap pt-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-[9px] text-[#484f58]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main Component: InjuryReportEnhanced
// ============================================================
export default function InjuryReportEnhanced() {
  const gameState = useGameStore((state) => state.gameState);

  // Early return if no game state
  if (!gameState) return null;

  const {
    player,
    currentInjury,
    injuries,
    currentSeason,
    currentWeek,
    currentClub,
  } = gameState;

  const [activeTab, setActiveTab] = useState('history');

  // ============================================================
  // Tab 1: Injury History data
  // ============================================================
  const injuryTypeDonutData = useMemo(
    () => generateInjuryTypeDonutData(injuries),
    [injuries]
  );

  const injuryFrequencyData = useMemo(
    () => generateInjuryFrequencyData(injuries, currentSeason),
    [injuries, currentSeason]
  );

  const avgRecoveryDays = useMemo(() => {
    if (injuries.length === 0) return 0;
    const totalDays = injuries.reduce((sum, i) => sum + i.weeksOut * 7, 0);
    return Math.round(totalDays / injuries.length);
  }, [injuries]);

  // ============================================================
  // Tab 2: Risk Assessment data
  // ============================================================
  const riskRadarData = useMemo(
    () =>
      generateRiskRadarData(player.fitness, player.age, injuries.length),
    [player.fitness, player.age, injuries.length]
  );

  const vulnerabilityData = useMemo(
    () => generateVulnerabilityData(injuries, player.age),
    [injuries, player.age]
  );

  const fitnessImpactData = useMemo(
    () => generateFitnessImpactData(),
    []
  );

  // ============================================================
  // Tab 3: Prevention data
  // ============================================================
  const preventionScore = useMemo(
    () => generatePreventionScoreData(player.fitness, injuries.length),
    [player.fitness, injuries.length]
  );

  const trainingLoadData = useMemo(
    () =>
      generateTrainingLoadData(
        player.fitness,
        currentInjury?.weeksRemaining ?? 0
      ),
    [player.fitness, currentInjury]
  );

  const recoveryNodes = useMemo(
    () =>
      generateRecoveryNodes(
        currentInjury?.weeksRemaining ?? 0,
        currentInjury?.weeksOut ?? 0
      ),
    [currentInjury]
  );

  // ============================================================
  // Tab 4: Medical Staff data
  // ============================================================
  const staffRadarData = useMemo(
    () => generateStaffRadarData(currentClub.facilities, currentClub.tier),
    [currentClub.facilities, currentClub.tier]
  );

  const treatmentSuccessData = useMemo(
    () => generateTreatmentSuccessData(injuries),
    [injuries]
  );

  const facilityRating = useMemo(
    () =>
      generateFacilityRating(currentClub.facilities, currentClub.tier),
    [currentClub.facilities, currentClub.tier]
  );

  // Derived summary values
  const totalInjuries = injuries.length;
  const seasonInjuries = injuries.filter(
    (i) => i.seasonSustained === currentSeason
  ).length;
  const totalWeeksOut = injuries.reduce((s, i) => s + i.weeksOut, 0);
  const isInjured = !!currentInjury;

  // Risk level label
  const riskLevel =
    injuries.length >= 8
      ? { label: 'Critical', color: '#FF3333' }
      : injuries.length >= 5
        ? { label: 'High', color: '#FF5500' }
        : injuries.length >= 3
          ? { label: 'Moderate', color: '#CCFF00' }
          : { label: 'Low', color: '#00E5FF' };

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-3">
      {/* Header */}
      <motion.div className="flex items-center gap-2" {...fadeIn}>
        <Activity className="h-5 w-5" style={{ color: COLORS.electricOrange }} />
        <h2 className="text-lg font-bold text-[#c9d1d9]">
          Injury Report Enhanced
        </h2>
        <span className="text-xs text-[#484f58] ml-auto">
          S{currentSeason} W{currentWeek}
        </span>
      </motion.div>

      {/* Quick Summary Bar */}
      <motion.div {...fadeInDelayed(0.05)}>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              <StatMini
                label="Total"
                value={totalInjuries.toString()}
                color={COLORS.electricOrange}
              />
              <StatMini
                label="Season"
                value={seasonInjuries.toString()}
                color={COLORS.cyanBlue}
              />
              <StatMini
                label="Weeks Out"
                value={totalWeeksOut.toString()}
                color={COLORS.neonLime}
              />
              <StatMini
                label="Risk"
                value={riskLevel.label}
                color={riskLevel.color}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Injury Status */}
      <motion.div {...fadeInDelayed(0.1)}>
        {isInjured ? (
          <Card className="bg-[#161b22] border-[#FF550030]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${COLORS.electricOrange}15`,
                    color: COLORS.electricOrange,
                  }}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: COLORS.electricOrange }}
                  >
                    {currentInjury.name}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">
                    {currentInjury.weeksRemaining} weeks remaining
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] border-[#FF550040]"
                  style={{ color: COLORS.electricOrange }}
                >
                  ACTIVE
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#161b22] border-[#00E5FF30]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${COLORS.cyanBlue}15`,
                    color: COLORS.cyanBlue,
                  }}
                >
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: COLORS.cyanBlue }}
                  >
                    Fully Fit
                  </p>
                  <p className="text-[10px] text-[#8b949e]">
                    No active injuries. Ready to play.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg h-auto p-1">
          <TabsTrigger
            value="history"
            className="flex-1 text-[10px] py-1.5 rounded-md data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] text-[#484f58]"
          >
            <Clock className="h-3 w-3 mr-1" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="flex-1 text-[10px] py-1.5 rounded-md data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] text-[#484f58]"
          >
            <Shield className="h-3 w-3 mr-1" />
            Risk
          </TabsTrigger>
          <TabsTrigger
            value="prevention"
            className="flex-1 text-[10px] py-1.5 rounded-md data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] text-[#484f58]"
          >
            <Target className="h-3 w-3 mr-1" />
            Prevention
          </TabsTrigger>
          <TabsTrigger
            value="medical"
            className="flex-1 text-[10px] py-1.5 rounded-md data-[state=active]:bg-[#21262d] data-[state=active]:text-[#c9d1d9] text-[#484f58]"
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Medical
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            Tab 1: Injury History
            ============================================================ */}
        <TabsContent value="history" className="space-y-3 mt-3">
          {/* SVG 1: InjuryTypeDonut */}
          <SVGSectionCard
            title="Injury Type Distribution"
            icon={<Activity className="h-3.5 w-3.5" />}
            delay={0.05}
          >
            <InjuryTypeDonut segments={injuryTypeDonutData} />
            <ColorLegend
              items={injuryTypeDonutData
                .filter((s) => s.value > 0)
                .map((s) => ({ label: s.label, color: s.color }))}
            />
          </SVGSectionCard>

          {/* SVG 2: InjuryFrequencyLine */}
          <SVGSectionCard
            title="Injury Frequency by Season"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            delay={0.1}
          >
            <InjuryFrequencyLine data={injuryFrequencyData} />
          </SVGSectionCard>

          {/* SVG 3: RecoveryTimeGauge */}
          <SVGSectionCard
            title="Average Recovery Time"
            icon={<Clock className="h-3.5 w-3.5" />}
            delay={0.15}
          >
            <RecoveryTimeGauge
              value={avgRecoveryDays}
              label="Average Days to Full Recovery"
            />
          </SVGSectionCard>

          {/* Insight */}
          <InsightBanner
            icon={<Brain className="h-3.5 w-3.5" />}
            title="Injury History Insight"
            text={
              totalInjuries === 0
                ? 'You have a clean injury record. Keep up good prevention habits to maintain durability.'
                : totalInjuries < 3
                  ? `With ${totalInjuries} career injuries, you're relatively durable. Focus on warmup routines to stay injury-free.`
                  : totalInjuries < 7
                    ? `${totalInjuries} injuries tracked. Consider increasing rest days and monitoring training load carefully.`
                    : `${totalInjuries} injuries is concerning. Prioritize recovery protocols and consult medical staff regularly.`
            }
            color={COLORS.electricOrange}
          />

        </TabsContent>

        {/* ============================================================
            Tab 2: Risk Assessment
            ============================================================ */}
        <TabsContent value="risk" className="space-y-3 mt-3">
          {/* SVG 4: InjuryRiskRadar */}
          <SVGSectionCard
            title="Injury Risk Radar"
            icon={<Shield className="h-3.5 w-3.5" />}
            delay={0.05}
          >
            <InjuryRiskRadar data={riskRadarData} />
          </SVGSectionCard>

          {/* SVG 5: VulnerabilityBars */}
          <SVGSectionCard
            title="Body Vulnerability Map"
            icon={<Target className="h-3.5 w-3.5" />}
            delay={0.1}
          >
            <VulnerabilityBars data={vulnerabilityData} />
          </SVGSectionCard>

          {/* SVG 6: FitnessImpactArea */}
          <SVGSectionCard
            title="Post-Match Fitness Impact"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            delay={0.15}
          >
            <FitnessImpactArea data={fitnessImpactData} />
          </SVGSectionCard>

          {/* Risk insight */}
          <InsightBanner
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="Risk Assessment Summary"
            text={
              riskLevel.label === 'Low'
                ? 'Low injury risk detected. Maintain current training load and recovery routines.'
                : riskLevel.label === 'Moderate'
                  ? 'Moderate risk level. Pay attention to fatigue indicators and consider extra recovery sessions.'
                  : riskLevel.label === 'High'
                    ? 'High injury risk. Reduce training intensity and prioritize rest. Medical monitoring recommended.'
                    : 'Critical risk level. Immediate action required. Reduce all high-intensity activities and seek specialist consultation.'
            }
            color={riskLevel.color}
          />

        </TabsContent>

        {/* ============================================================
            Tab 3: Prevention
            ============================================================ */}
        <TabsContent value="prevention" className="space-y-3 mt-3">
          {/* SVG 7: PreventionScoreRing */}
          <SVGSectionCard
            title="Overall Prevention Score"
            icon={<Award className="h-3.5 w-3.5" />}
            delay={0.05}
          >
            <PreventionScoreRing
              value={preventionScore}
              label="Prevention Effectiveness"
            />
          </SVGSectionCard>

          {/* SVG 8: TrainingLoadBars */}
          <SVGSectionCard
            title="Training Load Breakdown"
            icon={<Dumbbell className="h-3.5 w-3.5" />}
            delay={0.1}
          >
            <TrainingLoadBars data={trainingLoadData} />
          </SVGSectionCard>

          {/* SVG 9: RecoveryProtocolTimeline */}
          <SVGSectionCard
            title="Recovery Protocol Timeline"
            icon={<Clock className="h-3.5 w-3.5" />}
            delay={0.15}
          >
            <RecoveryProtocolTimeline nodes={recoveryNodes} />
          </SVGSectionCard>

          {/* Prevention insight */}
          <InsightBanner
            icon={<Leaf className="h-3.5 w-3.5" />}
            title="Prevention Recommendations"
            text={
              preventionScore >= 75
                ? 'Excellent prevention habits. Continue consistent warmup routines and adequate recovery between sessions.'
                : preventionScore >= 50
                  ? 'Good prevention score. Focus on improving warmup compliance and nutrition planning for better results.'
                  : 'Prevention score needs improvement. Implement structured warmup, recovery, and nutrition protocols immediately.'
            }
            color={COLORS.cyanBlue}
          />

        </TabsContent>

        {/* ============================================================
            Tab 4: Medical Staff
            ============================================================ */}
        <TabsContent value="medical" className="space-y-3 mt-3">
          {/* SVG 10: StaffQualityRadar */}
          <SVGSectionCard
            title="Medical Staff Quality"
            icon={<Users className="h-3.5 w-3.5" />}
            delay={0.05}
          >
            <StaffQualityRadar data={staffRadarData} />
          </SVGSectionCard>

          {/* SVG 11: TreatmentSuccessDonut */}
          <SVGSectionCard
            title="Treatment Success Rates"
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            delay={0.1}
          >
            <TreatmentSuccessDonut segments={treatmentSuccessData} />
            <ColorLegend
              items={treatmentSuccessData
                .filter((s) => s.value > 0)
                .map((s) => ({ label: s.label, color: s.color }))}
            />
          </SVGSectionCard>

          {/* SVG 12: FacilityRatingGauge */}
          <SVGSectionCard
            title="Medical Facility Rating"
            icon={<Award className="h-3.5 w-3.5" />}
            delay={0.15}
          >
            <FacilityRatingGauge
              value={facilityRating}
              label="Overall Facility Quality"
            />
          </SVGSectionCard>

        </TabsContent>
      </Tabs>
    </div>
  );
}
