'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Web3 Color Tokens
// ============================================================
const COLORS = {
  oledBlack: '#000000',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  mutedGray: '#666666',
  textPrimary: '#c9d1d9',
  textMuted: '#888888',
  border: '#1a1a1a',
} as const;

const FONT_FAMILY = "'Monaspace Neon', 'Space Grotesk', monospace";

// ============================================================
// Tab definition
// ============================================================
const tabs = [
  { id: 'prospects', label: 'Prospects', icon: '青少年' },
  { id: 'development', label: 'Development', icon: '📈' },
  { id: 'scouting', label: 'Scouting', icon: '🔍' },
  { id: 'graduates', label: 'Graduates', icon: '🎓' },
] as const;

type TabId = (typeof tabs)[number]['id'];

// ============================================================
// Radar chart builder helpers
// ============================================================
function buildRadarPoints(
  cx: number,
  cy: number,
  r: number,
  values: number[],
  n: number,
): string {
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return values
    .map((val, i) => {
      const angle = startAngle + i * angleStep;
      const clamped = Math.max(0, Math.min(100, val)) / 100;
      const x = cx + r * clamped * Math.cos(angle);
      const y = cy + r * clamped * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildRadarGridPoints(
  cx: number,
  cy: number,
  r: number,
  level: number,
  n: number,
): string {
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return Array.from({ length: n }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const x = cx + r * level * Math.cos(angle);
    const y = cy + r * level * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function getRadarLabelPosition(
  cx: number,
  cy: number,
  r: number,
  index: number,
  n: number,
): { x: number; y: number } {
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  const angle = startAngle + index * angleStep;
  return {
    x: cx + (r + 18) * Math.cos(angle),
    y: cy + (r + 18) * Math.sin(angle),
  };
}

// ============================================================
// SVG 1: ProspectPotentialRadar — 5-axis radar
// ============================================================
function ProspectPotentialRadar({ values }: { values: number[] }) {
  const cx = 150;
  const cy = 110;
  const r = 70;
  const n = 5;
  const labels = ['Pace', 'Shooting', 'Passing', 'Defending', 'Physical'];
  const strokeColor = COLORS.cyanBlue;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Prospect Potential Radar
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <polygon
            key={`grid-${level}`}
            points={buildRadarGridPoints(cx, cy, r, level, n)}
            fill="none"
            stroke={COLORS.mutedGray}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke={COLORS.mutedGray}
              strokeWidth={0.5}
              opacity={0.4}
              strokeLinecap="round"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={buildRadarPoints(cx, cy, r, values, n)}
          fill={`${strokeColor}11`}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Data dots + labels */}
        {values.map((val, i) => {
          const pos = getRadarLabelPosition(cx, cy, r, i, n);
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          const clamped = Math.max(0, Math.min(100, val)) / 100;
          const dotX = cx + r * clamped * Math.cos(angle);
          const dotY = cy + r * clamped * Math.sin(angle);
          return (
            <g key={`label-${i}`}>
              <circle
                cx={dotX}
                cy={dotY}
                r={3}
                fill={strokeColor}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={600}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {labels[i]}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill={strokeColor}
                fontSize={9}
                fontWeight={700}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 2: YouthPoolDonut — 4-segment donut via .reduce()
// ============================================================
function YouthPoolDonut({ segments }: { segments: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 100;
  const outerR = 65;
  const innerR = 40;
  const strokeColor = COLORS.electricOrange;
  const segmentColors = [COLORS.electricOrange, COLORS.cyanBlue, COLORS.neonLime, COLORS.mutedGray];

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const gaps = segments.reduce<{ start: number; end: number; color: string }[]>((acc, seg, i) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const start = acc.length > 0 ? acc[acc.length - 1].end : -90;
    const end = start + fraction * 360;
    acc.push({ start, end, color: segmentColors[i] });
    return acc;
  }, []);

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = x + radius * Math.cos(start);
    const y1 = y + radius * Math.sin(start);
    const x2 = x + radius * Math.cos(end);
    const y2 = y + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Youth Pool Distribution
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Donut segments */}
        {gaps.map((seg, i) => {
          if (seg.end - seg.start < 0.5) return null;
          const outerPath = describeArc(cx, cy, outerR, seg.start, seg.end);
          const innerPath = describeArc(cx, cy, innerR, seg.end, seg.start);
          const x1o = cx + outerR * Math.cos((seg.end * Math.PI) / 180);
          const y1o = cy + outerR * Math.sin((seg.end * Math.PI) / 180);
          const x2i = cx + innerR * Math.cos((seg.end * Math.PI) / 180);
          const y2i = cy + innerR * Math.sin((seg.end * Math.PI) / 180);
          const d = `${outerPath} L ${x1o} ${y1o} L ${x2i} ${y2i} ${innerPath} Z`;
          return (
            <path
              key={`seg-${i}`}
              d={d}
              fill={seg.color}
              opacity={0.7}
            />
          );
        })}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={COLORS.textPrimary}
          fontSize={16}
          fontWeight={700}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill={COLORS.mutedGray}
          fontSize={9}
          style={{ fontFamily: FONT_FAMILY }}
        >
          Total Players
        </text>
        {/* Legend */}
        {segments.map((seg, i) => (
          <g key={`legend-${i}`}>
            <rect
              x={210}
              y={40 + i * 22}
              width={10}
              height={10}
              fill={segmentColors[i]}
              opacity={0.8}
            />
            <text
              x={225}
              y={49}
              fill={COLORS.textPrimary}
              fontSize={10}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {seg.label}
            </text>
            <text
              x={275}
              y={49}
              textAnchor="end"
              fill={COLORS.mutedGray}
              fontSize={10}
              fontWeight={600}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {seg.value}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 3: StarProspectGauge — Semi-circular gauge 0-100
// ============================================================
function StarProspectGauge({ value }: { value: number }) {
  const cx = 150;
  const cy = 155;
  const r = 100;
  const strokeColor = COLORS.neonLime;
  const clamped = Math.max(0, Math.min(100, value));

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const valueAngle = startAngle + (clamped / 100) * Math.PI;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(valueAngle);
  const y2 = cy + r * Math.sin(valueAngle);
  const xEnd = cx + r * Math.cos(endAngle);
  const yEnd = cy + r * Math.sin(endAngle);

  const bgPath = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${xEnd} ${yEnd}`;
  const valuePath = clamped > 0
    ? `M ${x1} ${y1} A ${r} ${r} 0 ${clamped > 50 ? 1 : 0} 1 ${x2} ${y2}`
    : '';

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Top Prospect Rating
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke={COLORS.mutedGray}
          strokeWidth={12}
          opacity={0.25}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {valuePath && (
          <path
            d={valuePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (tick / 100) * Math.PI;
          const tx1 = cx + (r - 18) * Math.cos(angle);
          const ty1 = cy + (r - 18) * Math.sin(angle);
          const tx2 = cx + (r - 10) * Math.cos(angle);
          const ty2 = cy + (r - 10) * Math.sin(angle);
          return (
            <line
              key={`tick-${tick}`}
              x1={tx1}
              y1={ty1}
              x2={tx2}
              y2={ty2}
              stroke={COLORS.mutedGray}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}
        {/* Tick labels */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (tick / 100) * Math.PI;
          const lx = cx + (r - 28) * Math.cos(angle);
          const ly = cy + (r - 28) * Math.sin(angle);
          return (
            <text
              key={`tick-label-${tick}`}
              x={lx}
              y={ly + 3}
              textAnchor="middle"
              fill={COLORS.mutedGray}
              fontSize={8}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {tick}
            </text>
          );
        })}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill={strokeColor}
          fontSize={28}
          fontWeight={700}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {Math.round(clamped)}
        </text>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={9}
          style={{ fontFamily: FONT_FAMILY }}
        >
          Overall Rating
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 4: TrainingProgressArea — 8-point area chart
// ============================================================
function TrainingProgressArea({ data }: { data: number[] }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = 260;
  const chartH = 130;
  const n = data.length;
  const fillColor = COLORS.electricOrange;
  const strokeColor = COLORS.electricOrange;

  const points = data.map((val, i) => ({
    x: padding.left + (i / Math.max(1, n - 1)) * chartW,
    y: padding.top + chartH - (val / 100) * chartH,
  }));

  const areaPath = points.reduce<string>((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const closedAreaPath = `${areaPath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Training Progress
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((line) => {
          const y = padding.top + chartH - (line / 100) * chartH;
          return (
            <g key={`hline-${line}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke={COLORS.mutedGray}
                strokeWidth={0.5}
                opacity={0.3}
              />
              <text
                x={padding.left - 5}
                y={y + 3}
                textAnchor="end"
                fill={COLORS.mutedGray}
                fontSize={8}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {line}
              </text>
            </g>
          );
        })}
        {/* X-axis labels */}
        {data.map((_, i) => {
          const x = padding.left + (i / Math.max(1, n - 1)) * chartW;
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={padding.top + chartH + 15}
              textAnchor="middle"
              fill={COLORS.mutedGray}
              fontSize={8}
              style={{ fontFamily: FONT_FAMILY }}
            >
              W{i + 1}
            </text>
          );
        })}
        {/* Area fill */}
        <path
          d={closedAreaPath}
          fill={fillColor}
          opacity={0.2}
        />
        {/* Line stroke */}
        <path
          d={areaPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data dots */}
        {points.map((pt, i) => (
          <circle
            key={`dot-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={strokeColor}
          />
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 5: DevelopmentPathRadar — 5-axis radar
// ============================================================
function DevelopmentPathRadar({ values }: { values: number[] }) {
  const cx = 150;
  const cy = 110;
  const r = 70;
  const n = 5;
  const labels = ['Technical', 'Tactical', 'Physical', 'Mental', 'Experience'];
  const strokeColor = COLORS.cyanBlue;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Development Path
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <polygon
            key={`dgrid-${level}`}
            points={buildRadarGridPoints(cx, cy, r, level, n)}
            fill="none"
            stroke={COLORS.mutedGray}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          return (
            <line
              key={`daxis-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke={COLORS.mutedGray}
              strokeWidth={0.5}
              opacity={0.4}
              strokeLinecap="round"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={buildRadarPoints(cx, cy, r, values, n)}
          fill={`${strokeColor}11`}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Data dots + labels */}
        {values.map((val, i) => {
          const pos = getRadarLabelPosition(cx, cy, r, i, n);
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          const clamped = Math.max(0, Math.min(100, val)) / 100;
          const dotX = cx + r * clamped * Math.cos(angle);
          const dotY = cy + r * clamped * Math.sin(angle);
          return (
            <g key={`dlabel-${i}`}>
              <circle
                cx={dotX}
                cy={dotY}
                r={3}
                fill={strokeColor}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                fontSize={9}
                fontWeight={600}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {labels[i]}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill={strokeColor}
                fontSize={9}
                fontWeight={700}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 6: SatisfactionRing — Circular ring 0-100
// ============================================================
function SatisfactionRing({ value }: { value: number }) {
  const cx = 150;
  const cy = 100;
  const r = 70;
  const strokeW = 14;
  const strokeColor = COLORS.neonLime;
  const clamped = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * r;
  const filled = (clamped / 100) * circumference;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Youth Satisfaction
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={COLORS.mutedGray}
          strokeWidth={strokeW}
          opacity={0.2}
        />
        {/* Value ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          strokeDashoffset={circumference / 4}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={strokeColor}
          fontSize={28}
          fontWeight={700}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {Math.round(clamped)}%
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={9}
          style={{ fontFamily: FONT_FAMILY }}
        >
          Satisfaction
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75].map((mark) => {
          const angle = -Math.PI / 2 + (mark / 100) * 2 * Math.PI;
          const mx = cx + (r + strokeW / 2 + 8) * Math.cos(angle);
          const my = cy + (r + strokeW / 2 + 8) * Math.sin(angle);
          return (
            <text
              key={`mark-${mark}`}
              x={mx}
              y={my + 3}
              textAnchor="middle"
              fill={COLORS.mutedGray}
              fontSize={7}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {mark}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 7: ScoutingNetworkRadar — 5-axis radar
// ============================================================
function ScoutingNetworkRadar({ values }: { values: number[] }) {
  const cx = 150;
  const cy = 110;
  const r = 70;
  const n = 5;
  const labels = ['Domestic', 'EU', 'S. America', 'Africa', 'Asia'];
  const strokeColor = COLORS.electricOrange;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Scouting Network Coverage
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((level) => (
          <polygon
            key={`sgrid-${level}`}
            points={buildRadarGridPoints(cx, cy, r, level, n)}
            fill="none"
            stroke={COLORS.mutedGray}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          return (
            <line
              key={`saxis-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke={COLORS.mutedGray}
              strokeWidth={0.5}
              opacity={0.4}
              strokeLinecap="round"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={buildRadarPoints(cx, cy, r, values, n)}
          fill={`${strokeColor}11`}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Data dots + labels */}
        {values.map((val, i) => {
          const pos = getRadarLabelPosition(cx, cy, r, i, n);
          const angleStep = (2 * Math.PI) / n;
          const startAngle = -Math.PI / 2;
          const angle = startAngle + i * angleStep;
          const clamped = Math.max(0, Math.min(100, val)) / 100;
          const dotX = cx + r * clamped * Math.cos(angle);
          const dotY = cy + r * clamped * Math.sin(angle);
          return (
            <g key={`slabel-${i}`}>
              <circle
                cx={dotX}
                cy={dotY}
                r={3}
                fill={strokeColor}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={COLORS.textPrimary}
                fontSize={9}
                fontWeight={600}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {labels[i]}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill={strokeColor}
                fontSize={9}
                fontWeight={700}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {Math.round(val)}%
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 8: ScoutReportBars — 5 horizontal bars
// ============================================================
function ScoutReportBars({ values }: { values: { label: string; value: number }[] }) {
  const fillColor = COLORS.cyanBlue;
  const barHeight = 20;
  const barGap = 8;
  const startY = 22;
  const maxBarW = 180;
  const labelX = 95;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Scout Quality Report
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {values.map((item, i) => {
          const barW = Math.max(0, (item.value / 100)) * maxBarW;
          const y = startY + i * (barHeight + barGap);
          return (
            <g key={`bar-${i}`}>
              {/* Label */}
              <text
                x={labelX}
                y={y + barHeight / 2 + 3}
                textAnchor="end"
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={600}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {item.label}
              </text>
              {/* Background bar */}
              <rect
                x={labelX + 8}
                y={y + 2}
                width={maxBarW}
                height={barHeight - 4}
                fill={COLORS.mutedGray}
                opacity={0.15}
              />
              {/* Value bar */}
              <rect
                x={labelX + 8}
                y={y + 2}
                width={barW}
                height={barHeight - 4}
                fill={fillColor}
                opacity={0.7}
              />
              {/* Value text */}
              <text
                x={labelX + maxBarW + 18}
                y={y + barHeight / 2 + 3}
                textAnchor="end"
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={700}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {Math.round(item.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 9: RecruitmentPipelineDonut — 5-segment donut via .reduce()
// ============================================================
function RecruitmentPipelineDonut({ segments }: { segments: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 100;
  const outerR = 65;
  const innerR = 40;
  const strokeColor = COLORS.neonLime;
  const segmentColors = [COLORS.neonLime, COLORS.electricOrange, COLORS.cyanBlue, COLORS.mutedGray, '#444444'];

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const arcs = segments.reduce<{ start: number; end: number; color: string }[]>((acc, seg, i) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const start = acc.length > 0 ? acc[acc.length - 1].end : -90;
    const end = start + fraction * 360;
    acc.push({ start, end, color: segmentColors[i] });
    return acc;
  }, []);

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = x + radius * Math.cos(start);
    const y1 = y + radius * Math.sin(start);
    const x2 = x + radius * Math.cos(end);
    const y2 = y + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Recruitment Pipeline
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Donut segments */}
        {arcs.map((arc, i) => {
          if (arc.end - arc.start < 0.5) return null;
          const outerPath = describeArc(cx, cy, outerR, arc.start, arc.end);
          const innerPath = describeArc(cx, cy, innerR, arc.end, arc.start);
          const x1o = cx + outerR * Math.cos((arc.end * Math.PI) / 180);
          const y1o = cy + outerR * Math.sin((arc.end * Math.PI) / 180);
          const x2i = cx + innerR * Math.cos((arc.end * Math.PI) / 180);
          const y2i = cy + innerR * Math.sin((arc.end * Math.PI) / 180);
          const d = `${outerPath} L ${x1o} ${y1o} L ${x2i} ${y2i} ${innerPath} Z`;
          return (
            <path
              key={`rseg-${i}`}
              d={d}
              fill={arc.color}
              opacity={0.7}
            />
          );
        })}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={COLORS.textPrimary}
          fontSize={16}
          fontWeight={700}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill={COLORS.mutedGray}
          fontSize={9}
          style={{ fontFamily: FONT_FAMILY }}
        >
          Pipeline
        </text>
        {/* Legend */}
        {segments.map((seg, i) => (
          <g key={`rlegend-${i}`}>
            <rect
              x={200}
              y={30 + i * 20}
              width={10}
              height={10}
              fill={segmentColors[i]}
              opacity={0.8}
            />
            <text
              x={215}
              y={39}
              fill={COLORS.textPrimary}
              fontSize={9}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {seg.label}
            </text>
            <text
              x={270}
              y={39}
              textAnchor="end"
              fill={COLORS.mutedGray}
              fontSize={9}
              fontWeight={600}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {seg.value}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 10: GraduationRateLine — 8-point line chart
// ============================================================
function GraduationRateLine({ data }: { data: number[] }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = 235;
  const chartH = 130;
  const n = data.length;
  const strokeColor = COLORS.cyanBlue;

  const points = data.map((val, i) => ({
    x: padding.left + (i / Math.max(1, n - 1)) * chartW,
    y: padding.top + chartH - (val / 100) * chartH,
  }));

  const linePath = points.reduce<string>((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    return `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Graduation Rate by Season
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((line) => {
          const y = padding.top + chartH - (line / 100) * chartH;
          return (
            <g key={`ghline-${line}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke={COLORS.mutedGray}
                strokeWidth={0.5}
                opacity={0.3}
              />
              <text
                x={padding.left - 5}
                y={y + 3}
                textAnchor="end"
                fill={COLORS.mutedGray}
                fontSize={8}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {line}%
              </text>
            </g>
          );
        })}
        {/* X-axis labels */}
        {data.map((_, i) => {
          const x = padding.left + (i / Math.max(1, n - 1)) * chartW;
          return (
            <text
              key={`gx-label-${i}`}
              x={x}
              y={padding.top + chartH + 15}
              textAnchor="middle"
              fill={COLORS.mutedGray}
              fontSize={8}
              style={{ fontFamily: FONT_FAMILY }}
            >
              S{i + 1}
            </text>
          );
        })}
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data dots */}
        {points.map((pt, i) => (
          <g key={`gdot-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={COLORS.oledBlack}
              stroke={strokeColor}
              strokeWidth={2}
            />
            <text
              x={pt.x}
              y={pt.y - 8}
              textAnchor="middle"
              fill={COLORS.textPrimary}
              fontSize={8}
              fontWeight={600}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {Math.round(data[i])}%
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 11: GraduateSuccessBars — 5 horizontal bars
// ============================================================
function GraduateSuccessBars({ values }: { values: { label: string; value: number }[] }) {
  const fillColor = COLORS.electricOrange;
  const barHeight = 20;
  const barGap = 8;
  const startY = 22;
  const maxBarW = 180;
  const labelX = 100;

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Graduate Outcomes
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {values.map((item, i) => {
          const barW = Math.max(0, (item.value / 100)) * maxBarW;
          const y = startY + i * (barHeight + barGap);
          return (
            <g key={`gbar-${i}`}>
              {/* Label */}
              <text
                x={labelX}
                y={y + barHeight / 2 + 3}
                textAnchor="end"
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={600}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {item.label}
              </text>
              {/* Background bar */}
              <rect
                x={labelX + 8}
                y={y + 2}
                width={maxBarW}
                height={barHeight - 4}
                fill={COLORS.mutedGray}
                opacity={0.15}
              />
              {/* Value bar */}
              <rect
                x={labelX + 8}
                y={y + 2}
                width={barW}
                height={barHeight - 4}
                fill={fillColor}
                opacity={0.7}
              />
              {/* Value text */}
              <text
                x={labelX + maxBarW + 18}
                y={y + barHeight / 2 + 3}
                textAnchor="end"
                fill={COLORS.textPrimary}
                fontSize={10}
                fontWeight={700}
                style={{ fontFamily: FONT_FAMILY }}
              >
                {Math.round(item.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 12: AcademyReputationRing — Circular ring 0-100
// ============================================================
function AcademyReputationRing({ value }: { value: number }) {
  const cx = 150;
  const cy = 100;
  const r = 70;
  const strokeW = 14;
  const strokeColor = COLORS.neonLime;
  const clamped = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * r;
  const filled = (clamped / 100) * circumference;

  const reputationLabel =
    clamped >= 85 ? 'World Class' :
    clamped >= 70 ? 'Excellent' :
    clamped >= 50 ? 'Good' :
    clamped >= 30 ? 'Average' :
    'Developing';

  return (
    <section className="bg-[#111111] border border-[#1a1a1a] p-4" style={{ fontFamily: FONT_FAMILY }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
        Academy Reputation
      </h3>
      <svg viewBox="0 0 300 200" className="w-full select-none">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={COLORS.mutedGray}
          strokeWidth={strokeW}
          opacity={0.2}
        />
        {/* Value ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          strokeDashoffset={circumference / 4}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill={strokeColor}
          fontSize={28}
          fontWeight={700}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {Math.round(clamped)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={9}
          style={{ fontFamily: FONT_FAMILY }}
        >
          {reputationLabel}
        </text>
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fill={COLORS.mutedGray}
          fontSize={7}
          style={{ fontFamily: FONT_FAMILY }}
        >
          out of 100
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75].map((mark) => {
          const angle = -Math.PI / 2 + (mark / 100) * 2 * Math.PI;
          const mx = cx + (r + strokeW / 2 + 8) * Math.cos(angle);
          const my = cy + (r + strokeW / 2 + 8) * Math.sin(angle);
          return (
            <text
              key={`rmark-${mark}`}
              x={mx}
              y={my + 3}
              textAnchor="middle"
              fill={COLORS.mutedGray}
              fontSize={7}
              style={{ fontFamily: FONT_FAMILY }}
            >
              {mark}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// Derived data helpers using .reduce()
// ============================================================

function deriveProspectRadarValues(youthTeams: { players: { overall: number; potential: number; attributes?: { pace?: number; shooting?: number; passing?: number; defending?: number; physical?: number } }[] }[]): number[] {
  const allPlayers = youthTeams.reduce<Array<{ overall: number; potential: number; attributes?: { pace?: number; shooting?: number; passing?: number; defending?: number; physical?: number } }>>(
    (acc, team) => [...acc, ...team.players],
    [],
  );
  const sorted = [...allPlayers].sort((a, b) => b.potential - a.potential);
  const top = sorted[0];
  if (!top) return [40, 35, 38, 30, 42];
  return [
    top.attributes?.pace ?? top.overall * 0.4,
    top.attributes?.shooting ?? top.overall * 0.35,
    top.attributes?.passing ?? top.overall * 0.38,
    top.attributes?.defending ?? top.overall * 0.3,
    top.attributes?.physical ?? top.overall * 0.42,
  ];
}

function deriveYouthPoolSegments(youthTeams: { category: string; players: unknown[] }[]): { label: string; value: number }[] {
  const counts = youthTeams.reduce<Record<string, number>>((acc, team) => {
    acc[team.category] = (acc[team.category] ?? 0) + team.players.length;
    return acc;
  }, {});
  return [
    { label: 'U18', value: counts['u18'] ?? 0 },
    { label: 'U21', value: counts['u21'] ?? 0 },
    { label: 'U23', value: counts['u23'] ?? 0 },
    { label: 'Loaned', value: counts['loaned'] ?? 0 },
  ];
}

function deriveTopProspectRating(youthTeams: { players: { overall: number; potential: number }[] }[]): number {
  const best = youthTeams.reduce<{ overall: number; potential: number } | null>(
    (acc, team) => {
      const teamBest = team.players.reduce<{ overall: number; potential: number } | null>(
        (innerAcc, p) => {
          if (!innerAcc || p.potential > innerAcc.potential) return p;
          return innerAcc;
        },
        null,
      );
      if (!teamBest) return acc;
      if (!acc || teamBest.potential > acc.potential) return teamBest;
      return acc;
    },
    null,
  );
  return best?.overall ?? 0;
}

function deriveTrainingProgress(youthTeams: { players: { overall: number }[] }[]): number[] {
  const avgOverall = youthTeams.reduce<number>((acc, team) => {
    const teamAvg = team.players.length > 0
      ? team.players.reduce((s, p) => s + p.overall, 0) / team.players.length
      : 0;
    return acc + teamAvg;
  }, 0);
  const base = Math.round(avgOverall / Math.max(1, youthTeams.length));
  return Array.from({ length: 8 }, (_, i) =>
    Math.min(100, base + Math.round((i * 3.5) + Math.sin(i * 1.2) * 4)),
  );
}

function deriveDevelopmentValues(youthTeams: { players: { overall: number; potential: number; age: number }[] }[]): number[] {
  const players = youthTeams.reduce<Array<{ overall: number; potential: number; age: number }>>(
    (acc, team) => [...acc, ...team.players],
    [],
  );
  const avgOvr = players.length > 0 ? players.reduce((s, p) => s + p.overall, 0) / players.length : 0;
  const avgPot = players.length > 0 ? players.reduce((s, p) => s + p.potential, 0) / players.length : 0;
  const avgAge = players.length > 0 ? players.reduce((s, p) => s + p.age, 0) / players.length : 0;
  const techGap = avgPot - avgOvr;
  return [
    Math.min(100, avgOvr + 5),
    Math.min(100, avgOvr + 2),
    Math.min(100, avgOvr * 0.9 + 10),
    Math.min(100, avgOvr * 0.85 + 15),
    Math.min(100, (24 - avgAge) * 4 + 20),
  ];
}

function deriveSatisfaction(youthTeams: { players: { morale: number }[] }[]): number {
  const totalMorale = youthTeams.reduce<number>((acc, team) => {
    return acc + team.players.reduce((s, p) => s + (p.morale ?? 60), 0);
  }, 0);
  const totalPlayers = youthTeams.reduce<number>((acc, team) => acc + team.players.length, 0);
  return totalPlayers > 0 ? Math.round(totalMorale / totalPlayers) : 50;
}

function deriveScoutingCoverage(gameState: { currentClub?: { id: string } }): number[] {
  const clubId = gameState.currentClub?.id ?? 'default';
  const seed = clubId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return [
    Math.min(100, 55 + (seed % 35)),
    Math.min(100, 30 + ((seed * 3) % 45)),
    Math.min(100, 15 + ((seed * 7) % 40)),
    Math.min(100, 10 + ((seed * 11) % 35)),
    Math.min(100, 8 + ((seed * 13) % 30)),
  ];
}

function deriveScoutQuality(gameState: { currentClub?: { id: string } }): { label: string; value: number }[] {
  const clubId = gameState.currentClub?.id ?? 'default';
  const seed = clubId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return [
    { label: 'Accuracy', value: Math.min(100, 50 + (seed % 40)) },
    { label: 'Coverage', value: Math.min(100, 35 + ((seed * 2) % 50)) },
    { label: 'Speed', value: Math.min(100, 40 + ((seed * 3) % 45)) },
    { label: 'Cost', value: Math.min(100, 30 + ((seed * 5) % 55)) },
    { label: 'Recommend.', value: Math.min(100, 45 + ((seed * 7) % 42)) },
  ];
}

function deriveRecruitmentPipeline(gameState: { currentClub?: { id: string } }): { label: string; value: number }[] {
  const clubId = gameState.currentClub?.id ?? 'default';
  const seed = clubId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return [
    { label: 'Trial', value: 2 + (seed % 4) },
    { label: 'Offered', value: 1 + (seed % 3) },
    { label: 'Negotiating', value: (seed % 2) },
    { label: 'Signed', value: 3 + (seed % 5) },
    { label: 'Rejected', value: (seed % 3) },
  ];
}

function deriveGraduationRate(gameState: { currentSeason: number }): number[] {
  const season = gameState.currentSeason;
  return Array.from({ length: 8 }, (_, i) => {
    const s = season - 7 + i;
    if (s <= 0) return 0;
    const seed = s * 17;
    return Math.min(100, Math.max(10, 30 + (seed % 55)));
  });
}

function deriveGraduateOutcomes(gameState: { currentClub?: { id: string } }): { label: string; value: number }[] {
  const clubId = gameState.currentClub?.id ?? 'default';
  const seed = clubId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return [
    { label: 'First Team', value: Math.min(100, 20 + (seed % 40)) },
    { label: 'Regular', value: Math.min(100, 15 + ((seed * 2) % 45)) },
    { label: 'Sold', value: Math.min(100, 10 + ((seed * 3) % 30)) },
    { label: 'International', value: Math.min(100, 5 + ((seed * 5) % 20)) },
    { label: 'Retained', value: Math.min(100, 25 + ((seed * 7) % 50)) },
  ];
}

function deriveAcademyReputation(youthTeams: { players: { overall: number; potential: number }[] }[]): number {
  const avgPotential = youthTeams.reduce<number>((acc, team) => {
    const teamAvg = team.players.length > 0
      ? team.players.reduce((s, p) => s + p.potential, 0) / team.players.length
      : 0;
    return acc + teamAvg;
  }, 0);
  const normalized = youthTeams.length > 0 ? avgPotential / youthTeams.length : 0;
  return Math.min(100, Math.round(normalized * 1.1));
}

// ============================================================
// Stats summary card
// ============================================================
function StatsSummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-[#111111] border border-[#1a1a1a]" style={{ fontFamily: FONT_FAMILY }}>
      <span className="text-xs" style={{ color: COLORS.textMuted }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function YouthAcademyEnhanced() {
  const [activeTab, setActiveTab] = useState<TabId>('prospects');

  const gameState = useGameStore(s => s.gameState);

  if (!gameState) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.bgDark, color: COLORS.textPrimary }}
      >
        <span className="text-lg">No game state available</span>
      </div>
    );
  }

  const clubName = gameState.currentClub?.name ?? 'Unknown Club';
  const youthTeams = (gameState.youthTeams ?? []) as unknown as {
    category: string;
    clubId: string;
    players: {
      overall: number;
      potential: number;
      age: number;
      morale: number;
      attributes: { pace?: number; shooting?: number; passing?: number; defending?: number; physical?: number };
    }[];
  }[];

  const myTeams = youthTeams.filter(t => t.clubId === (gameState.currentClub?.id ?? ''));
  const allPlayers = myTeams.reduce(
    (acc, t) => [...acc, ...t.players],
    [] as typeof myTeams[number]['players'],
  );
  const totalYouth = allPlayers.length;
  const avgOvr = totalYouth > 0
    ? Math.round(allPlayers.reduce((s, p) => s + p.overall, 0) / totalYouth)
    : 0;
  const avgPot = totalYouth > 0
    ? Math.round(allPlayers.reduce((s, p) => s + p.potential, 0) / totalYouth)
    : 0;
  const wonderkidCount = allPlayers.filter(p => p.potential >= 85).length;

  // ---- Derived data for each tab ----

  // Tab 1: Prospects
  const prospectRadarValues = deriveProspectRadarValues(myTeams);
  const youthPoolSegments = deriveYouthPoolSegments(myTeams);
  const topProspectRating = deriveTopProspectRating(myTeams);

  // Tab 2: Development
  const trainingProgressData = deriveTrainingProgress(myTeams);
  const developmentValues = deriveDevelopmentValues(myTeams);
  const satisfactionValue = deriveSatisfaction(myTeams);

  // Tab 3: Scouting
  const scoutingCoverage = deriveScoutingCoverage(gameState);
  const scoutQualityData = deriveScoutQuality(gameState);
  const recruitmentPipeline = deriveRecruitmentPipeline(gameState);

  // Tab 4: Graduates
  const graduationRateData = deriveGraduationRate(gameState);
  const graduateOutcomes = deriveGraduateOutcomes(gameState);
  const academyReputation = deriveAcademyReputation(myTeams);

  return (
    <div
      className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto"
      style={{
        fontFamily: FONT_FAMILY,
        backgroundColor: COLORS.bgDark,
        color: COLORS.textPrimary,
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: COLORS.neonLime }}
        >
          Youth Academy
        </h1>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          {clubName} — Enhanced Analytics Dashboard
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatsSummaryRow label="Total Youth" value={totalYouth} color={COLORS.cyanBlue} />
        <StatsSummaryRow label="Avg Overall" value={avgOvr} color={COLORS.electricOrange} />
        <StatsSummaryRow label="Avg Potential" value={avgPot} color={COLORS.neonLime} />
        <StatsSummaryRow label="Wonderkids" value={wonderkidCount} color="#FF5500" />
      </div>

      {/* Tab navigation */}
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-sm font-semibold border whitespace-nowrap transition-opacity"
              style={{
                fontFamily: FONT_FAMILY,
                backgroundColor: isActive ? COLORS.bgCard : 'transparent',
                borderColor: isActive ? COLORS.electricOrange : COLORS.border,
                color: isActive ? COLORS.electricOrange : COLORS.textMuted,
                opacity: isActive ? 1 : 0.7,
              }}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab panels — opacity transition only */}
      <div
        style={{
          opacity: 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        {/* ---- Tab 1: Prospects ---- */}
        {activeTab === 'prospects' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.electricOrange }}>
                Prospects Overview
              </h2>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                Analyze your top youth talent and squad distribution across age groups.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProspectPotentialRadar values={prospectRadarValues} />
              <YouthPoolDonut segments={youthPoolSegments} />
              <StarProspectGauge value={topProspectRating} />
            </div>
            {/* Prospect list summary */}
            <div className="mt-6 bg-[#111111] border border-[#1a1a1a] p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
                Top Prospects by Potential
              </h3>
              <div className="space-y-2">
                {[...allPlayers]
                  .sort((a, b) => b.potential - a.potential)
                  .slice(0, 5)
                  .map((p, i) => (
                    <div
                      key={`prospect-row-${i}-${p.overall}`}
                      className="flex items-center justify-between py-1.5 px-3 border-b border-[#1a1a1a]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold" style={{ color: COLORS.mutedGray }}>
                          #{i + 1}
                        </span>
                        <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                          {p.age}y
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>
                          OVR {p.overall}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: p.potential >= 85
                              ? COLORS.neonLime
                              : p.potential >= 75
                              ? COLORS.electricOrange
                              : COLORS.cyanBlue,
                          }}
                        >
                          POT {p.potential}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- Tab 2: Development ---- */}
        {activeTab === 'development' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.cyanBlue }}>
                Development Center
              </h2>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                Track training progress, development pathways, and youth player satisfaction.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TrainingProgressArea data={trainingProgressData} />
              <DevelopmentPathRadar values={developmentValues} />
              <SatisfactionRing value={satisfactionValue} />
            </div>
            {/* Training breakdown */}
            <div className="mt-6 bg-[#111111] border border-[#1a1a1a] p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
                Training Week Insights
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center py-3 bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-lg font-bold" style={{ color: COLORS.electricOrange }}>
                    {trainingProgressData[trainingProgressData.length - 1] ?? 0}
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Current Level</div>
                </div>
                <div className="text-center py-3 bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-lg font-bold" style={{ color: COLORS.neonLime }}>
                    +{trainingProgressData.length > 1
                      ? Math.round(trainingProgressData[trainingProgressData.length - 1] - trainingProgressData[0])
                      : 0}
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Growth (8w)</div>
                </div>
                <div className="text-center py-3 bg-[#0a0a0a] border border-[#1a1a1a]">
                  <div className="text-lg font-bold" style={{ color: COLORS.cyanBlue }}>
                    {satisfactionValue}%
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- Tab 3: Scouting ---- */}
        {activeTab === 'scouting' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.electricOrange }}>
                Scouting Network
              </h2>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                Monitor global scouting coverage, scout quality metrics, and recruitment pipeline.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ScoutingNetworkRadar values={scoutingCoverage} />
              <ScoutReportBars values={scoutQualityData} />
              <RecruitmentPipelineDonut segments={recruitmentPipeline} />
            </div>
            {/* Scouting summary */}
            <div className="mt-6 bg-[#111111] border border-[#1a1a1a] p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
                Regional Scouting Summary
              </h3>
              <div className="space-y-2">
                {['Domestic', 'EU', 'South America', 'Africa', 'Asia'].map((region, i) => (
                  <div
                    key={`scout-summary-${region}`}
                    className="flex items-center justify-between py-1.5 px-3 border-b border-[#1a1a1a]"
                  >
                    <span className="text-sm" style={{ color: COLORS.textPrimary }}>{region}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2"
                        style={{
                          width: `${scoutingCoverage[i] * 1.2}px`,
                          maxWidth: '120px',
                          backgroundColor: COLORS.electricOrange,
                          opacity: 0.6,
                        }}
                      />
                      <span className="text-xs font-bold" style={{ color: COLORS.electricOrange }}>
                        {Math.round(scoutingCoverage[i])}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- Tab 4: Graduates ---- */}
        {activeTab === 'graduates' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold" style={{ color: COLORS.neonLime }}>
                Graduates & Alumni
              </h2>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                Review graduation rates, career outcomes, and the academy&apos;s reputation score.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GraduationRateLine data={graduationRateData} />
              <GraduateSuccessBars values={graduateOutcomes} />
              <AcademyReputationRing value={academyReputation} />
            </div>
            {/* Graduation stats summary */}
            <div className="mt-6 bg-[#111111] border border-[#1a1a1a] p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
                Academy Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Latest Rate',
                    value: `${graduationRateData[graduationRateData.length - 1]}%`,
                    color: COLORS.cyanBlue,
                  },
                  {
                    label: 'Peak Rate',
                    value: `${Math.max(...graduationRateData)}%`,
                    color: COLORS.neonLime,
                  },
                  {
                    label: 'First Team %',
                    value: `${Math.round(graduateOutcomes[0].value)}%`,
                    color: COLORS.electricOrange,
                  },
                  {
                    label: 'Reputation',
                    value: `${academyReputation}/100`,
                    color: COLORS.neonLime,
                  },
                ].map((metric) => (
                  <div key={`metric-${metric.label}`} className="text-center py-3 bg-[#0a0a0a] border border-[#1a1a1a]">
                    <div className="text-lg font-bold" style={{ color: metric.color }}>
                      {metric.value}
                    </div>
                    <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 pt-4 border-t border-[#1a1a1a] text-center">
        <p className="text-xs" style={{ color: COLORS.mutedGray }}>
          Youth Academy Enhanced — {clubName} — Season {gameState.currentSeason}
        </p>
      </footer>
    </div>
  );
}
