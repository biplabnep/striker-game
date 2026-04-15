'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Color & Font Tokens
// ============================================================
const COLORS = {
  oledBlack: '#000000',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  mutedGray: '#666666',
  midGray: '#888888',
  textPrimary: '#c9d1d9',
  textMuted: '#484f58',
  borderDark: '#21262d',
  borderMid: '#30363d',
} as const;

const FONT_FAMILY = "'Monaspace Neon', 'Space Grotesk', monospace";

// ============================================================
// Tab Definitions
// ============================================================
const tabs = [
  { id: 'training_facilities', label: 'Facilities', icon: '🏢' },
  { id: 'drill_library', label: 'Drills', icon: '📋' },
  { id: 'fitness_center', label: 'Fitness', icon: '💪' },
  { id: 'recovery_zone', label: 'Recovery', icon: '🧘' },
] as const;

type TabId = typeof tabs[number]['id'];

// ============================================================
// Helper: Polar to Cartesian for radar / ring charts
// ============================================================
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// ============================================================
// SVG 1: FacilityQualityRadar — 5-axis radar
// ============================================================
function FacilityQualityRadar({ facilityLevels }: { facilityLevels: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 105;
  const maxR = 80;
  const axisCount = facilityLevels.length;
  const angleStep = 360 / axisCount;

  const gridRings = [20, 40, 60, 80];

  const radarPoints = facilityLevels
    .map((item, i) => {
      const angle = i * angleStep - 90;
      const r = (item.value / 100) * maxR;
      const point = polarToCartesian(cx, cy, r, angle);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.cyanBlue, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Facility Quality Radar
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Grid rings */}
        {gridRings.map((ring, i) => {
          const ringPoints = facilityLevels
            .map((_, j) => {
              const angle = j * angleStep - 90;
              const pt = polarToCartesian(cx, cy, ring, angle);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={`ring-${i}`}
              points={ringPoints}
              fill="none"
              stroke={COLORS.borderMid}
              strokeWidth={0.5}
              opacity={0.4}
            />
          );
        })}
        {/* Axis lines */}
        {facilityLevels.map((_, i) => {
          const angle = i * angleStep - 90;
          const pt = polarToCartesian(cx, cy, maxR, angle);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke={COLORS.borderMid}
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={radarPoints}
          fill={`${COLORS.cyanBlue}15`}
          stroke={COLORS.cyanBlue}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data points */}
        {facilityLevels.map((item, i) => {
          const angle = i * angleStep - 90;
          const r = (item.value / 100) * maxR;
          const pt = polarToCartesian(cx, cy, r, angle);
          return (
            <circle
              key={`point-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={COLORS.cyanBlue}
            />
          );
        })}
        {/* Labels */}
        {facilityLevels.map((item, i) => {
          const angle = i * angleStep - 90;
          const labelPt = polarToCartesian(cx, cy, maxR + 18, angle);
          return (
            <text
              key={`label-${i}`}
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={COLORS.textPrimary}
              style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
            >
              {item.label} {item.value}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 2: FacilityUpgradeProgressBars — 5 horizontal bars
// ============================================================
function FacilityUpgradeProgressBars({ upgrades }: { upgrades: { label: string; current: number; target: number }[] }) {
  const barHeight = 18;
  const barGap = 8;
  const labelWidth = 80;
  const barStartX = labelWidth + 8;
  const barMaxWidth = 300 - barStartX - 50;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.electricOrange, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Facility Upgrade Progress
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {upgrades.map((item, i) => {
          const y = 10 + i * (barHeight + barGap);
          const pct = Math.min(100, Math.round((item.current / Math.max(1, item.target)) * 100));
          const fillWidth = (pct / 100) * barMaxWidth;
          return (
            <g key={`bar-${i}`}>
              <text
                x={4}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
              >
                {item.label}
              </text>
              {/* Background bar */}
              <rect
                x={barStartX}
                y={y}
                width={barMaxWidth}
                height={barHeight}
                fill={COLORS.borderDark}
                rx={2}
                ry={2}
              />
              {/* Fill bar */}
              <rect
                x={barStartX}
                y={y}
                width={fillWidth}
                height={barHeight}
                fill={COLORS.electricOrange}
                rx={2}
                ry={2}
                opacity={0.85}
              />
              {/* Percentage text */}
              <text
                x={barStartX + barMaxWidth + 6}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 3: TrainingCapacityDonut — 4-segment donut via .reduce()
// ============================================================
function TrainingCapacityDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const cx = 150;
  const cy = 100;
  const outerR = 70;
  const innerR = 40;

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcData = segments.reduce<{ startAngle: number; endAngle: number; color: string; label: string; value: number }[]>(
    (acc, seg, idx) => {
      const prevAngle = idx === 0 ? 0 : acc[idx - 1].endAngle;
      const sweep = total > 0 ? (seg.value / total) * 360 : 0;
      return [
        ...acc,
        {
          startAngle: prevAngle,
          endAngle: prevAngle + sweep,
          color: seg.color,
          label: seg.label,
          value: seg.value,
        },
      ];
    },
    []
  );

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.neonLime, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Training Capacity Allocation
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {arcData.map((arc, i) => {
          if (arc.endAngle - arc.startAngle < 0.5) return null;
          const outerPath = describeArc(cx, cy, outerR, arc.startAngle, arc.endAngle);
          const innerPath = describeArc(cx, cy, innerR, arc.endAngle, arc.startAngle);
          return (
            <path
              key={`arc-${i}`}
              d={`${outerPath} L ${polarToCartesian(cx, cy, innerR, arc.endAngle).x} ${polarToCartesian(cx, cy, innerR, arc.endAngle).y} ${innerPath} Z`}
              fill={arc.color}
              opacity={0.75}
              stroke={COLORS.oledBlack}
              strokeWidth={2}
            />
          );
        })}
        {/* Center label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.textPrimary}
          style={{ fontFamily: FONT_FAMILY, fontSize: '14px', fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '9px' }}
        >
          Total Slots
        </text>
        {/* Legend */}
        {segments.map((seg, i) => {
          const lx = 10;
          const ly = 180 - (segments.length - 1 - i) * 14;
          return (
            <g key={`legend-${i}`}>
              <rect
                x={lx}
                y={ly - 4}
                width={8}
                height={8}
                fill={seg.color}
                rx={1}
                ry={1}
              />
              <text
                x={lx + 12}
                y={ly + 2}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '9px' }}
              >
                {seg.label}: {seg.value}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 4: DrillEffectivenessArea — 8-point area chart
// ============================================================
function DrillEffectivenessArea({ data }: { data: { label: string; value: number }[] }) {
  const chartLeft = 40;
  const chartRight = 280;
  const chartTop = 15;
  const chartBottom = 160;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const stepX = chartWidth / Math.max(1, data.length - 1);

  const points = data.map((item, i) => ({
    x: chartLeft + i * stepX,
    y: chartBottom - (item.value / 100) * chartHeight,
  }));

  const areaPath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const closedArea = `${areaPath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.electricOrange, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Drill Effectiveness Over Time
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val, i) => {
          const y = chartBottom - (val / 100) * chartHeight;
          return (
            <g key={`grid-${i}`}>
              <line
                x1={chartLeft}
                y1={y}
                x2={chartRight}
                y2={y}
                stroke={COLORS.borderMid}
                strokeWidth={0.5}
                opacity={0.3}
              />
              <text
                x={chartLeft - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill={COLORS.midGray}
                style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
              >
                {val}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path
          d={closedArea}
          fill={COLORS.electricOrange}
          opacity={0.2}
        />
        {/* Stroke line */}
        <path
          d={areaPath}
          fill="none"
          stroke={COLORS.electricOrange}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data points */}
        {points.map((pt, i) => (
          <circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={COLORS.electricOrange}
          />
        ))}
        {/* X-axis labels */}
        {data.map((item, i) => {
          const x = chartLeft + i * stepX;
          return (
            <text
              key={`xlabel-${i}`}
              x={x}
              y={chartBottom + 14}
              textAnchor="middle"
              fill={COLORS.midGray}
              style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 5: SkillFocusRadar — 5-axis radar
// ============================================================
function SkillFocusRadar({ skills }: { skills: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 105;
  const maxR = 75;
  const axisCount = skills.length;
  const angleStep = 360 / axisCount;

  const gridRings = [25, 50, 75];

  const radarPoints = skills
    .map((item, i) => {
      const angle = i * angleStep - 90;
      const r = (item.value / 100) * maxR;
      const point = polarToCartesian(cx, cy, r, angle);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.cyanBlue, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Skill Focus Balance
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Grid rings */}
        {gridRings.map((ring, i) => {
          const ringPoints = skills
            .map((_, j) => {
              const angle = j * angleStep - 90;
              const pt = polarToCartesian(cx, cy, ring, angle);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={`grid-${i}`}
              points={ringPoints}
              fill="none"
              stroke={COLORS.borderMid}
              strokeWidth={0.5}
              opacity={0.35}
            />
          );
        })}
        {/* Axis lines */}
        {skills.map((_, i) => {
          const angle = i * angleStep - 90;
          const pt = polarToCartesian(cx, cy, maxR, angle);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke={COLORS.borderMid}
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={radarPoints}
          fill={`${COLORS.cyanBlue}12`}
          stroke={COLORS.cyanBlue}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data points */}
        {skills.map((item, i) => {
          const angle = i * angleStep - 90;
          const r = (item.value / 100) * maxR;
          const pt = polarToCartesian(cx, cy, r, angle);
          return (
            <circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill={COLORS.cyanBlue}
            />
          );
        })}
        {/* Labels */}
        {skills.map((item, i) => {
          const angle = i * angleStep - 90;
          const labelPt = polarToCartesian(cx, cy, maxR + 20, angle);
          return (
            <text
              key={`lbl-${i}`}
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={COLORS.textPrimary}
              style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
            >
              {item.label} {item.value}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 6: DrillCompletionRing — Circular ring 0-100
// ============================================================
function DrillCompletionRing({ value }: { value: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 60;
  const strokeWidth = 12;
  const clampedValue = Math.min(100, Math.max(0, value));

  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.neonLime, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Drill Completion Rate
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={COLORS.borderDark}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={COLORS.neonLime}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.9}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.textPrimary}
          style={{ fontFamily: FONT_FAMILY, fontSize: '22px', fontWeight: 700 }}
        >
          {clampedValue}%
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '9px' }}
        >
          Completed
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 7: FitnessLevelBars — 5 horizontal bars
// ============================================================
function FitnessLevelBars({ metrics }: { metrics: { label: string; value: number }[] }) {
  const barHeight = 20;
  const barGap = 10;
  const labelWidth = 72;
  const barStartX = labelWidth + 8;
  const barMaxWidth = 300 - barStartX - 48;

  const getBarColor = (value: number): string => {
    if (value >= 75) return COLORS.cyanBlue;
    if (value >= 50) return COLORS.neonLime;
    if (value >= 30) return COLORS.electricOrange;
    return '#FF3333';
  };

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.cyanBlue, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Fitness Level Metrics
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {metrics.map((item, i) => {
          const y = 8 + i * (barHeight + barGap);
          const fillWidth = (item.value / 100) * barMaxWidth;
          const barColor = getBarColor(item.value);
          return (
            <g key={`fit-bar-${i}`}>
              <text
                x={4}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
              >
                {item.label}
              </text>
              {/* Background bar */}
              <rect
                x={barStartX}
                y={y}
                width={barMaxWidth}
                height={barHeight}
                fill={COLORS.borderDark}
                rx={2}
                ry={2}
              />
              {/* Fill bar */}
              <rect
                x={barStartX}
                y={y}
                width={fillWidth}
                height={barHeight}
                fill={barColor}
                rx={2}
                ry={2}
                opacity={0.85}
              />
              {/* Value text */}
              <text
                x={barStartX + barMaxWidth + 6}
                y={y + barHeight / 2}
                dominantBaseline="middle"
                fill={barColor}
                style={{ fontFamily: FONT_FAMILY, fontSize: '11px', fontWeight: 700 }}
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 8: FitnessTrendLine — 8-point line chart
// ============================================================
function FitnessTrendLine({ data }: { data: { week: string; value: number }[] }) {
  const chartLeft = 35;
  const chartRight = 285;
  const chartTop = 15;
  const chartBottom = 155;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const stepX = chartWidth / Math.max(1, data.length - 1);

  const points = data.map((item, i) => ({
    x: chartLeft + i * stepX,
    y: chartBottom - (item.value / 100) * chartHeight,
  }));

  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.electricOrange, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Fitness Trend (Weekly)
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Grid */}
        {[0, 25, 50, 75, 100].map((val, i) => {
          const y = chartBottom - (val / 100) * chartHeight;
          return (
            <g key={`tgrid-${i}`}>
              <line
                x1={chartLeft}
                y1={y}
                x2={chartRight}
                y2={y}
                stroke={COLORS.borderMid}
                strokeWidth={0.5}
                opacity={0.3}
              />
              <text
                x={chartLeft - 5}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill={COLORS.midGray}
                style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
              >
                {val}
              </text>
            </g>
          );
        })}
        {/* Area */}
        <path
          d={areaPath}
          fill={COLORS.electricOrange}
          opacity={0.12}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={COLORS.electricOrange}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Points */}
        {points.map((pt, i) => (
          <circle
            key={`tpoint-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={COLORS.electricOrange}
          />
        ))}
        {/* X labels */}
        {data.map((item, i) => {
          const x = chartLeft + i * stepX;
          return (
            <text
              key={`txlbl-${i}`}
              x={x}
              y={chartBottom + 14}
              textAnchor="middle"
              fill={COLORS.midGray}
              style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
            >
              {item.week}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 9: InjuryRiskGauge — Semi-circular gauge 0-100
// ============================================================
function InjuryRiskGauge({ value }: { value: number }) {
  const cx = 150;
  const cy = 150;
  const radius = 90;
  const strokeWidth = 14;
  const clampedValue = Math.min(100, Math.max(0, value));

  // Semi-circle: 180 degrees from left to right
  const circumference = Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  const getGaugeColor = (val: number): string => {
    if (val >= 70) return '#FF3333';
    if (val >= 45) return COLORS.electricOrange;
    return COLORS.neonLime;
  };

  const gaugeColor = getGaugeColor(clampedValue);

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.neonLime, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Injury Risk Gauge
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Background track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={COLORS.borderDark}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.9}
        />
        {/* Center value */}
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={gaugeColor}
          style={{ fontFamily: FONT_FAMILY, fontSize: '24px', fontWeight: 700 }}
        >
          {clampedValue}
        </text>
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '9px' }}
        >
          Risk Level
        </text>
        {/* Scale labels */}
        <text
          x={cx - radius - 4}
          y={cy + 14}
          textAnchor="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
        >
          0
        </text>
        <text
          x={cx + radius + 4}
          y={cy + 14}
          textAnchor="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
        >
          100
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 10: RecoveryProtocolTimeline — 8-node horizontal timeline
// ============================================================
function RecoveryProtocolTimeline({ sessions }: { sessions: { label: string; status: 'completed' | 'active' | 'upcoming' }[] }) {
  const nodeY = 80;
  const nodeR = 10;
  const startX = 25;
  const endX = 275;
  const totalWidth = endX - startX;
  const step = totalWidth / Math.max(1, sessions.length - 1);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return COLORS.cyanBlue;
      case 'active': return COLORS.neonLime;
      case 'upcoming': return COLORS.mutedGray;
      default: return COLORS.mutedGray;
    }
  };

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.cyanBlue, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Recovery Protocol Timeline
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Horizontal connector line */}
        <line
          x1={startX}
          y1={nodeY}
          x2={endX}
          y2={nodeY}
          stroke={COLORS.borderMid}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Nodes */}
        {sessions.map((session, i) => {
          const x = startX + i * step;
          const color = getStatusColor(session.status);
          const isActive = session.status === 'active';
          return (
            <g key={`rnode-${i}`}>
              {/* Glow ring for active */}
              {isActive && (
                <circle
                  cx={x}
                  cy={nodeY}
                  r={nodeR + 4}
                  fill="none"
                  stroke={COLORS.neonLime}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}
              <circle
                cx={x}
                cy={nodeY}
                r={nodeR}
                fill={COLORS.bgDark}
                stroke={color}
                strokeWidth={2}
              />
              {/* Checkmark or number for completed */}
              {session.status === 'completed' && (
                <line
                  x1={x - 4}
                  y1={nodeY}
                  x2={x - 1}
                  y2={nodeY + 3}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {session.status === 'completed' && (
                <line
                  x1={x - 1}
                  y1={nodeY + 3}
                  x2={x + 4}
                  y2={nodeY - 4}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {session.status === 'active' && (
                <circle
                  cx={x}
                  cy={nodeY}
                  r={4}
                  fill={color}
                />
              )}
              {session.status === 'upcoming' && (
                <text
                  x={x}
                  y={nodeY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
                >
                  {i + 1}
                </text>
              )}
              {/* Label below */}
              <text
                x={x}
                y={nodeY + nodeR + 14}
                textAnchor="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
              >
                {session.label}
              </text>
              {/* Status label */}
              <text
                x={x}
                y={nodeY + nodeR + 24}
                textAnchor="middle"
                fill={color}
                style={{ fontFamily: FONT_FAMILY, fontSize: '7px' }}
              >
                {session.status}
              </text>
            </g>
          );
        })}
        {/* Legend at bottom */}
        {(['completed', 'active', 'upcoming'] as const).map((status, i) => {
          const lx = 30 + i * 90;
          const ly = 185;
          const color = getStatusColor(status);
          return (
            <g key={`rlegend-${i}`}>
              <circle
                cx={lx}
                cy={ly}
                r={4}
                fill={COLORS.bgDark}
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={lx + 8}
                y={ly + 1}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
              >
                {status}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 11: RecoveryEffectivenessDonut — 5-segment donut via .reduce()
// ============================================================
function RecoveryEffectivenessDonut({ segments }: { segments: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 95;
  const outerR = 65;
  const innerR = 35;

  const segmentColors = [COLORS.electricOrange, COLORS.cyanBlue, COLORS.neonLime, COLORS.midGray, COLORS.electricOrange];

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcData = segments.reduce<{ startAngle: number; endAngle: number; color: string; label: string; value: number; idx: number }[]>(
    (acc, seg, idx) => {
      const prevAngle = idx === 0 ? 0 : acc[idx - 1].endAngle;
      const sweep = total > 0 ? (seg.value / total) * 360 : 0;
      return [
        ...acc,
        {
          startAngle: prevAngle,
          endAngle: prevAngle + sweep,
          color: segmentColors[idx % segmentColors.length],
          label: seg.label,
          value: seg.value,
          idx,
        },
      ];
    },
    []
  );

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.electricOrange, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Recovery Effectiveness
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {arcData.map((arc, i) => {
          if (arc.endAngle - arc.startAngle < 0.5) return null;
          const outerPath = describeArc(cx, cy, outerR, arc.startAngle, arc.endAngle);
          const innerPath = describeArc(cx, cy, innerR, arc.endAngle, arc.startAngle);
          const outerEnd = polarToCartesian(cx, cy, outerR, arc.endAngle);
          const innerEnd = polarToCartesian(cx, cy, innerR, arc.endAngle);
          const innerStart = polarToCartesian(cx, cy, innerR, arc.startAngle);
          return (
            <path
              key={`recarc-${i}`}
              d={`${outerPath} L ${innerEnd.x} ${innerEnd.y} ${innerPath} L ${innerStart.x} ${innerStart.y} Z`}
              fill={arc.color}
              opacity={0.7}
              stroke={COLORS.oledBlack}
              strokeWidth={2}
            />
          );
        })}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.textPrimary}
          style={{ fontFamily: FONT_FAMILY, fontSize: '14px', fontWeight: 700 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
        >
          Total Score
        </text>
        {/* Legend */}
        {segments.map((seg, i) => {
          const cols = 3;
          const row = Math.floor(i / cols);
          const col = i % cols;
          const lx = 15 + col * 95;
          const ly = 175 + row * 14;
          return (
            <g key={`reclegend-${i}`}>
              <rect
                x={lx}
                y={ly - 4}
                width={8}
                height={8}
                fill={segmentColors[i % segmentColors.length]}
                rx={1}
                ry={1}
              />
              <text
                x={lx + 12}
                y={ly + 2}
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                style={{ fontFamily: FONT_FAMILY, fontSize: '8px' }}
              >
                {seg.label}: {seg.value}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 12: OverallWellnessRing — Circular ring 0-100
// ============================================================
function OverallWellnessRing({ value }: { value: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 60;
  const strokeWidth = 14;
  const clampedValue = Math.min(100, Math.max(0, value));

  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  const getWellnessColor = (val: number): string => {
    if (val >= 70) return COLORS.neonLime;
    if (val >= 40) return COLORS.cyanBlue;
    return COLORS.electricOrange;
  };

  const wellnessColor = getWellnessColor(clampedValue);

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, color: COLORS.neonLime, fontSize: '13px', fontWeight: 700, marginBottom: 8 }}
      >
        Overall Wellness Score
      </h3>
      <svg viewBox="0 0 300 200" style={{ width: '100%', background: COLORS.bgDark }}>
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={COLORS.borderDark}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={wellnessColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.9}
        />
        {/* Center value */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.textPrimary}
          style={{ fontFamily: FONT_FAMILY, fontSize: '24px', fontWeight: 700 }}
        >
          {clampedValue}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.midGray}
          style={{ fontFamily: FONT_FAMILY, fontSize: '9px' }}
        >
          Wellness
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75].map((marker, i) => {
          const angle = (marker / 100) * 360 - 90;
          const innerPt = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 4, angle);
          const outerPt = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 1, angle);
          return (
            <line
              key={`wmark-${i}`}
              x1={innerPt.x}
              y1={innerPt.y}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke={COLORS.borderMid}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// Main Component: TrainingGroundEnhanced
// ============================================================
export default function TrainingGroundEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabId>('training_facilities');

  // ============================================================
  // Early return guard — no gameState
  // ============================================================
  if (!gameState) {
    return (
      <div
        style={{
          fontFamily: FONT_FAMILY,
          color: COLORS.textMuted,
          textAlign: 'center',
          padding: '40px 16px',
          background: COLORS.bgDark,
          minHeight: '100vh',
        }}
      >
        No game state loaded.
      </div>
    );
  }

  const { player, currentClub, trainingHistory, trainingAvailable } = gameState;
  const clubName = currentClub?.name ?? 'Unknown Club';
  const fitness = player.fitness;
  const morale = player.morale;
  const facilitiesLevel = currentClub.facilities ?? 50;

  // ============================================================
  // Tab 1 Data: Training Facilities
  // ============================================================
  const facilityQualityData = [
    { label: 'Pitches', value: Math.min(100, facilitiesLevel + 5) },
    { label: 'Gym', value: Math.min(100, facilitiesLevel - 3) },
    { label: 'Recovery', value: Math.min(100, Math.round(facilitiesLevel * 0.8)) },
    { label: 'Tech', value: Math.min(100, Math.round(facilitiesLevel * 0.7 + 10)) },
    { label: 'Classroom', value: Math.min(100, Math.round(facilitiesLevel * 0.6 + 15)) },
  ];

  const facilityUpgradeData = [
    { label: 'Main Pitch', current: Math.round(facilitiesLevel * 0.4), target: 100 },
    { label: 'Gym Hall', current: Math.round(facilitiesLevel * 0.35), target: 100 },
    { label: 'Recovery Suite', current: Math.round(facilitiesLevel * 0.3), target: 100 },
    { label: 'Video Analysis', current: Math.round(facilitiesLevel * 0.25), target: 100 },
    { label: 'Classroom', current: Math.round(facilitiesLevel * 0.2), target: 100 },
  ];

  const trainingCapacitySegments = [
    { label: 'Senior', value: Math.max(1, Math.round((1 - trainingAvailable / 3) * 18)), color: '#FF5500' },
    { label: 'U21', value: Math.max(1, Math.round(facilitiesLevel * 0.12)), color: '#00E5FF' },
    { label: 'U18', value: Math.max(1, Math.round(facilitiesLevel * 0.1)), color: '#CCFF00' },
    { label: 'Rehab', value: Math.max(1, Math.round(100 - fitness) / 8), color: '#888888' },
  ];

  // ============================================================
  // Tab 2 Data: Drill Library
  // ============================================================
  const drillTypes = ['Shooting', 'Passing', 'Dribbling', 'Defending', 'Tackling', 'Crossing', 'Set Piece', 'Pressing'];

  const drillEffectivenessData = drillTypes.map((label, i) => ({
    label,
    value: Math.min(100, Math.max(10, Math.round(
      (trainingHistory.length > 0
        ? trainingHistory.reduce((sum, s) => sum + s.intensity, 0) / trainingHistory.length
        : 40) + i * 3 + Math.sin(i * 1.2) * 10
    ))),
  }));

  const skillFocusData = [
    { label: 'Technical', value: Math.min(100, Math.max(10, player.attributes.passing + player.attributes.dribbling) / 2) },
    { label: 'Tactical', value: Math.min(100, Math.max(10, 45 + trainingHistory.filter(s => s.type === 'tactical').length * 8)) },
    { label: 'Physical', value: Math.min(100, Math.max(10, (player.attributes.pace + player.attributes.physical) / 2)) },
    { label: 'Mental', value: Math.min(100, Math.max(10, morale)) },
    { label: 'Set Pieces', value: Math.min(100, Math.max(10, 30 + trainingHistory.filter(s => s.type === 'attacking').length * 5)) },
  ];

  const totalDrills = Math.max(1, trainingHistory.length);
  const completedDrills = trainingHistory.filter(s => s.type !== 'recovery').length;
  const drillCompletionValue = Math.round((completedDrills / totalDrills) * 100);

  // ============================================================
  // Tab 3 Data: Fitness Center
  // ============================================================
  const fitnessMetrics = [
    { label: 'Speed', value: Math.min(100, Math.max(5, player.attributes.pace)) },
    { label: 'Strength', value: Math.min(100, Math.max(5, player.attributes.physical)) },
    { label: 'Stamina', value: Math.min(100, Math.max(5, fitness)) },
    { label: 'Agility', value: Math.min(100, Math.max(5, Math.round((player.attributes.pace + player.attributes.dribbling) / 2 * 0.9))) },
    { label: 'Flexibility', value: Math.min(100, Math.max(5, Math.round(fitness * 0.7 + 20))) },
  ];

  const weekLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const fitnessTrendData = weekLabels.map((week, i) => ({
    week,
    value: Math.min(100, Math.max(15, Math.round(fitness - 15 + i * 4 + Math.sin(i * 0.8) * 8))),
  }));

  const injuryRiskValue = Math.min(100, Math.max(0, Math.round(100 - fitness * 0.6 - morale * 0.3)));

  // ============================================================
  // Tab 4 Data: Recovery Zone
  // ============================================================
  const recoverySessionLabels = ['Ice Bath', 'Massage', 'Stretch', 'Cryo', 'Nutrition', 'Sleep', 'Hydro', 'Meditate'];
  const recoveryStatuses = ['completed' as const, 'completed' as const, 'completed' as const, 'active' as const, 'upcoming' as const, 'upcoming' as const, 'upcoming' as const, 'upcoming' as const];

  const recoveryTimelineData = recoverySessionLabels.map((label, i) => ({
    label,
    status: recoveryStatuses[i],
  }));

  const recoveryEffectivenessSegments = [
    { label: 'Ice Bath', value: Math.max(1, Math.round(fitness * 0.2)) },
    { label: 'Massage', value: Math.max(1, Math.round(morale * 0.15)) },
    { label: 'Cryo', value: Math.max(1, Math.round(facilitiesLevel * 0.08)) },
    { label: 'Nutrition', value: Math.max(1, Math.round(fitness * 0.18)) },
    { label: 'Sleep', value: Math.max(1, Math.round(morale * 0.25)) },
  ];

  const overallWellnessValue = Math.round((fitness * 0.5 + morale * 0.3 + (100 - injuryRiskValue) * 0.2));

  // ============================================================
  // Tab content rendering
  // ============================================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'training_facilities':
        return (
          <div style={{ opacity: 1 }}>
            <FacilityQualityRadar facilityLevels={facilityQualityData} />
            <FacilityUpgradeProgressBars upgrades={facilityUpgradeData} />
            <TrainingCapacityDonut segments={trainingCapacitySegments} />
          </div>
        );
      case 'drill_library':
        return (
          <div style={{ opacity: 1 }}>
            <DrillEffectivenessArea data={drillEffectivenessData} />
            <SkillFocusRadar skills={skillFocusData} />
            <DrillCompletionRing value={drillCompletionValue} />
          </div>
        );
      case 'fitness_center':
        return (
          <div style={{ opacity: 1 }}>
            <FitnessLevelBars metrics={fitnessMetrics} />
            <FitnessTrendLine data={fitnessTrendData} />
            <InjuryRiskGauge value={injuryRiskValue} />
          </div>
        );
      case 'recovery_zone':
        return (
          <div style={{ opacity: 1 }}>
            <RecoveryProtocolTimeline sessions={recoveryTimelineData} />
            <RecoveryEffectivenessDonut segments={recoveryEffectivenessSegments} />
            <OverallWellnessRing value={overallWellnessValue} />
          </div>
        );
      default:
        return null;
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        background: COLORS.bgDark,
        color: COLORS.textPrimary,
        minHeight: '100vh',
        paddingBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: `1px solid ${COLORS.borderDark}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Training Ground
            </h1>
            <p
              style={{
                fontSize: '11px',
                color: COLORS.midGray,
                margin: '4px 0 0',
              }}
            >
              {clubName} — Enhanced Facilities
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Fitness badge */}
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: fitness >= 60 ? `${COLORS.neonLime}15` : `${COLORS.electricOrange}15`,
                border: `1px solid ${fitness >= 60 ? `${COLORS.neonLime}30` : `${COLORS.electricOrange}30`}`,
                fontSize: '11px',
                fontWeight: 700,
                color: fitness >= 60 ? COLORS.neonLime : COLORS.electricOrange,
              }}
            >
              FIT {fitness}%
            </div>
            {/* Sessions badge */}
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: `${COLORS.cyanBlue}15`,
                border: `1px solid ${COLORS.cyanBlue}30`,
                fontSize: '11px',
                fontWeight: 700,
                color: COLORS.cyanBlue,
              }}
            >
              {3 - trainingAvailable}/3 Done
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${COLORS.borderDark}`,
          background: COLORS.bgCard,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: isActive ? COLORS.bgDark : 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${COLORS.electricOrange}` : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'none',
                outline: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: 1,
                  marginBottom: 4,
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {tab.icon}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? COLORS.electricOrange : COLORS.midGray,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {renderTabContent()}
      </div>

      {/* Footer info */}
      <div
        style={{
          padding: '8px 16px 16px',
          borderTop: `1px solid ${COLORS.borderDark}`,
        }}
      >
        <p
          style={{
            fontSize: '9px',
            color: COLORS.textMuted,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Training Ground Enhanced — Web3 Dashboard
        </p>
      </div>
    </div>
  );
}
