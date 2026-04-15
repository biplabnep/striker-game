'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Web3 Color Tokens
// OLED Black + Electric Orange + Neon Lime + Cyan Blue
// ============================================================
const C = {
  black: '#000000',
  orange: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  muted: '#666666',
  text: '#c9d1d9',
  dim: '#888888',
  border: '#21262d',
  grid: '#1a1a2e',
} as const;

const FONT = "'Monaspace Neon', 'Space Grotesk', monospace";

// ============================================================
// Seeded Random — deterministic pseudo-random from seed
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

// ============================================================
// Currency Formatter — short display for large values
// ============================================================
function fmtShort(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return m >= 10 ? `€${m.toFixed(1)}M` : `€${m.toFixed(2)}M`;
  }
  if (v >= 1_000) {
    return `€${(v / 1_000).toFixed(1)}K`;
  }
  return `€${v.toFixed(0)}`;
}

// ============================================================
// Donut Arc Computation — uses .reduce(), no let, no transform
// Segments are accumulated via reduce to compute cumulative
// angles without any mutable let variable.
// ============================================================
interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutArc extends DonutSegment {
  pct: number;
  d: string;
  idx: number;
}

function computeDonutArcs(
  segments: DonutSegment[],
  cx: number,
  cy: number,
  r: number,
  innerR: number
): DonutArc[] {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Accumulate angles via reduce — avoids let reassignment
  const withAngles = segments.reduce(
    (acc, seg, i) => {
      const startAngle =
        i === 0 ? -Math.PI / 2 : acc[acc.length - 1].endAngle;
      const pct = seg.value / total;
      const sweep = pct * Math.PI * 2;
      const endAngle = startAngle + sweep;

      if (pct < 0.001) return acc;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const d = [
        `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');

      return [...acc, { ...seg, pct, d, idx: i, endAngle }];
    },
    [] as Array<DonutSegment & { pct: number; d: string; idx: number; endAngle: number }>
  );

  return withAngles;
}

// ============================================================
// Ring Arc Computation — no transform, starts at 12 o'clock
// Computes an SVG arc path starting from the top center going
// clockwise without needing CSS/SVG transform: rotate().
// ============================================================
function ringArc(
  cx: number,
  cy: number,
  r: number,
  pct: number
): { d: string; ex: number; ey: number } {
  const cl = Math.min(1, Math.max(0, pct));
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + cl * 2 * Math.PI;
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const large = cl > 0.5 ? 1 : 0;
  const d = `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  return { d, ex, ey };
}

// ============================================================
// Gauge Arc Computation — semi-circular, no transform
// Draws a half-circle arc from left (PI) to right (2*PI).
// The value arc fills proportionally from left to right.
// ============================================================
function gaugeArc(
  cx: number,
  cy: number,
  r: number,
  pct: number
): { bgD: string; valD: string; vx: number; vy: number } {
  const cl = Math.min(1, Math.max(0, pct));
  const startAngle = Math.PI;
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const fx = cx + r * Math.cos(2 * Math.PI);
  const fy = cy + r * Math.sin(2 * Math.PI);
  const bgD = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${fx} ${fy}`;

  const valueAngle = startAngle + cl * Math.PI;
  const vx = cx + r * Math.cos(valueAngle);
  const vy = cy + r * Math.sin(valueAngle);
  const valLarge = cl > 0.5 ? 1 : 0;
  const valD = `M ${sx} ${sy} A ${r} ${r} 0 ${valLarge} 1 ${vx} ${vy}`;

  return { bgD, valD, vx, vy };
}

// ============================================================
// Radar Grid Computation — no let, no transform
// Generates polygon grid rings, axis lines, data polygon,
// data dots, and label positions for a radar/spider chart.
// ============================================================
interface RadarAxis {
  label: string;
  value: number;
}

function radarData(
  axes: RadarAxis[],
  cx: number,
  cy: number,
  maxR: number
) {
  const n = axes.length;
  const step = (2 * Math.PI) / n;

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1].map((rp) => {
    const rr = maxR * rp;
    const pts = axes
      .map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
      })
      .join(' ');
    return { pts };
  });

  // Axis lines from center to each vertex
  const lines = axes.map((_, i) => {
    const a = -Math.PI / 2 + i * step;
    return { x2: cx + maxR * Math.cos(a), y2: cy + maxR * Math.sin(a) };
  });

  // Data polygon — filled shape connecting data points
  const poly = axes
    .map((ax, i) => {
      const a = -Math.PI / 2 + i * step;
      const rr = (ax.value / 100) * maxR;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    })
    .join(' ');

  // Data dot positions
  const dots = axes.map((ax, i) => {
    const a = -Math.PI / 2 + i * step;
    const rr = (ax.value / 100) * maxR;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  });

  // Label positions — offset beyond the max radius
  const labels = axes.map((ax, i) => {
    const a = -Math.PI / 2 + i * step;
    return {
      x: cx + (maxR + 16) * Math.cos(a),
      y: cy + (maxR + 16) * Math.sin(a),
      label: ax.label,
    };
  });

  return { rings, lines, poly, dots, labels };
}

// ============================================================
// Line Chart Coordinate Computation — no let, no transform
// Converts a series of {season, value} data points into SVG
// polyline points, area path, and coordinate arrays.
// ============================================================
function lineCoords(
  data: { [key: string]: number }[],
  w: number,
  h: number,
  pad: { l: number; r: number; t: number; b: number }
) {
  if (data.length < 2) return null;

  const maxV = Math.max(...data.map((d) => d.value), 1);
  const minV = Math.min(...data.map((d) => d.value), 0);
  const range = maxV - minV || 1;
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;
  const xStep = pw / Math.max(data.length - 1, 1);

  const coords = data.map((d, i) => ({
    x: pad.l + i * xStep,
    y: pad.t + ph - ((d.value - minV) / range) * ph,
  }));

  const lineStr = coords.map((c) => `${c.x},${c.y}`).join(' ');

  const areaD = [
    coords
      .map((c, i) =>
        i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`
      )
      .join(' '),
    `L ${coords[coords.length - 1].x},${pad.t + ph}`,
    `L ${coords[0].x},${pad.t + ph}`,
    'Z',
  ].join(' ');

  return { coords, lineStr, areaD, maxV, minV, ph, pad };
}

// ============================================================
// Shared style constants — avoid repetition
// ============================================================
const headingStyle = {
  fontSize: '11px',
  color: C.dim,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  marginBottom: '8px',
  fontFamily: FONT,
  fontWeight: 600,
};

const cardStyle = {
  backgroundColor: C.bgCard,
  borderRadius: '8px',
  padding: '16px',
  border: `1px solid ${C.border}`,
};

const smallCardStyle = {
  backgroundColor: C.bgCard,
  borderRadius: '6px',
  padding: '10px',
  border: `1px solid ${C.border}`,
};

const labelStyle = {
  fontSize: '9px',
  color: C.dim,
  margin: '0',
  fontFamily: FONT,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

// ============================================================
// SVG 1: IncomeSourceDonut
// 5-segment donut chart showing income breakdown via .reduce()
// Segments: Salary / Bonuses / Endorsements / Image Rights / Prizes
// Primary accent: #00E5FF
// ============================================================
function IncomeSourceDonut({
  salary,
  bonuses,
  endorsements,
  imageRights,
  prizes,
  season,
}: {
  salary: number;
  bonuses: number;
  endorsements: number;
  imageRights: number;
  prizes: number;
  season: number;
}) {
  const segments: DonutSegment[] = [
    { value: salary, color: C.cyan, label: 'Salary' },
    { value: bonuses, color: C.orange, label: 'Bonuses' },
    { value: endorsements, color: C.lime, label: 'Endorsements' },
    { value: imageRights, color: C.muted, label: 'Image Rights' },
    { value: prizes, color: C.dim, label: 'Prizes' },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const arcs = computeDonutArcs(segments, 80, 80, 55, 32);

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Income Sources — S{season}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <svg
          viewBox="0 0 160 160"
          style={{ width: '128px', height: '128px', flexShrink: 0 }}
        >
          {/* Background ring */}
          <circle
            cx={80}
            cy={80}
            r={44}
            fill="none"
            stroke={C.border}
            strokeWidth="24"
          />
          {/* Donut segments — rendered from reduce-computed arcs */}
          {arcs.map((arc) => (
            <path
              key={`income-donut-${arc.idx}`}
              d={arc.d}
              fill={arc.color}
              fillOpacity={0.85}
            />
          ))}
          {/* Center total text */}
          <text
            x={80}
            y={74}
            fill={C.cyan}
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily={FONT}
          >
            {fmtShort(total)}
          </text>
          <text
            x={80}
            y={90}
            fill={C.dim}
            fontSize="8"
            textAnchor="middle"
            fontFamily={FONT}
          >
            total income
          </text>
        </svg>
        {/* Legend with percentage breakdown */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flex: 1,
          }}
        >
          {segments.map((seg, i) => {
            const pctVal =
              total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
            return (
              <div
                key={`income-legend-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    backgroundColor: seg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: C.dim,
                    flex: 1,
                    fontFamily: FONT,
                  }}
                >
                  {seg.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: C.text,
                    fontFamily: FONT,
                  }}
                >
                  {pctVal}%
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: C.muted,
                    fontFamily: FONT,
                    minWidth: '48px',
                    textAlign: 'right' as const,
                  }}
                >
                  {fmtShort(seg.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SVG 2: IncomeTrendLine
// 8-point line chart showing monthly income trend
// Stroke color: #CCFF00 (Neon Lime)
// ============================================================
function IncomeTrendLine({
  data,
}: {
  data: { month: number; value: number }[];
}) {
  const chart = lineCoords(data, 300, 200, {
    l: 40,
    r: 15,
    t: 10,
    b: 28,
  });

  // Fallback for insufficient data
  if (!chart) {
    return (
      <section style={{ width: '100%' }}>
        <p style={headingStyle}>Monthly Income Trend</p>
        <div
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: C.muted,
              fontFamily: FONT,
            }}
          >
            Need 2+ months of data
          </p>
        </div>
      </section>
    );
  }

  const { coords, lineStr, maxV, minV, pad } = chart;
  const ph = 200 - pad.t - pad.b;

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Monthly Income Trend</p>
      <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto' }}>
        {/* Horizontal grid lines at 25/50/75% */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={`income-grid-${pct}`}
            x1={pad.l}
            y1={pad.t + ph * (1 - pct)}
            x2={285}
            y2={pad.t + ph * (1 - pct)}
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Income trend line */}
        <polyline
          points={lineStr}
          fill="none"
          stroke={C.lime}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {coords.map((c, i) => (
          <circle
            key={`income-dot-${i}`}
            cx={c.x}
            cy={c.y}
            r="3"
            fill={C.bgDark}
            stroke={C.lime}
            strokeWidth="1.5"
          />
        ))}
        {/* Y-axis range labels */}
        <text
          x={pad.l - 4}
          y={pad.t + 4}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          {fmtShort(maxV)}
        </text>
        <text
          x={pad.l - 4}
          y={pad.t + ph + 3}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          {fmtShort(minV)}
        </text>
        {/* X-axis month labels */}
        {data.map((d, i) => (
          <text
            key={`income-x-${i}`}
            x={coords[i].x}
            y={194}
            fill={i === data.length - 1 ? C.lime : C.dim}
            fontSize="7"
            textAnchor="middle"
            fontFamily={FONT}
          >
            M{d.month}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 3: ContractValueGauge
// Semi-circular gauge (0-100) showing current contract value
// as a percentage of the estimated market maximum.
// Stroke color: #FF5500 (Electric Orange)
// ============================================================
function ContractValueGauge({
  contractValue,
  marketMax,
  weeklyWage,
}: {
  contractValue: number;
  marketMax: number;
  weeklyWage: number;
}) {
  const pct =
    marketMax > 0
      ? Math.min(100, (contractValue / marketMax) * 100)
      : 0;

  const { bgD, valD, vx, vy } = gaugeArc(150, 110, 85, pct / 100);

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Contract Value vs Market Max</p>
      <svg viewBox="0 0 300 160" style={{ width: '100%', height: 'auto' }}>
        {/* Background arc (full semi-circle) */}
        <path
          d={bgD}
          fill="none"
          stroke={C.border}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc (proportional fill) */}
        <path
          d={valD}
          fill="none"
          stroke={C.orange}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Needle indicator dot */}
        <circle cx={vx} cy={vy} r="6" fill={C.orange} />
        <circle cx={vx} cy={vy} r="3" fill={C.bgDark} />
        {/* Center percentage display */}
        <text
          x={150}
          y={105}
          fill={C.orange}
          fontSize="22"
          textAnchor="middle"
          fontWeight="bold"
          fontFamily={FONT}
        >
          {pct.toFixed(0)}%
        </text>
        <text
          x={150}
          y={120}
          fill={C.dim}
          fontSize="8"
          textAnchor="middle"
          fontFamily={FONT}
        >
          of market maximum
        </text>
        {/* Scale endpoints */}
        <text
          x={57}
          y={115}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          0%
        </text>
        <text
          x={243}
          y={115}
          fill={C.dim}
          fontSize="7"
          textAnchor="start"
          fontFamily={FONT}
        >
          100%
        </text>
        {/* Sub-info: annual value and weekly wage */}
        <text
          x={150}
          y={148}
          fill={C.muted}
          fontSize="8"
          textAnchor="middle"
          fontFamily={FONT}
        >
          Annual: {fmtShort(contractValue)} · Wage: {fmtShort(weeklyWage)}/wk
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 4: ExpenseCategoryBars
// 5 horizontal bars showing expense breakdown
// Categories: Housing / Lifestyle / Agent Fees / Tax / Savings
// Fill color: #FF5500 (Electric Orange)
// ============================================================
function ExpenseCategoryBars({
  housing,
  lifestyle,
  agent,
  tax,
  savings,
  totalIncome,
}: {
  housing: number;
  lifestyle: number;
  agent: number;
  tax: number;
  savings: number;
  totalIncome: number;
}) {
  const categories = [
    { label: 'Housing', value: housing, color: C.orange },
    { label: 'Lifestyle', value: lifestyle, color: C.orange },
    { label: 'Agent Fees', value: agent, color: C.dim },
    { label: 'Tax', value: tax, color: C.muted },
    { label: 'Savings', value: savings, color: C.lime },
  ];

  const maxVal = Math.max(...categories.map((c) => c.value), 1);
  const barH = 16;
  const barGap = 10;
  const labelW = 70;
  const chartW = 300;
  const barAreaW = chartW - labelW - 50;

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Expense Breakdown</p>
      <svg viewBox="0 0 300 170" style={{ width: '100%', height: 'auto' }}>
        {categories.map((cat, i) => {
          const y = 8 + i * (barH + barGap);
          const barW = (cat.value / maxVal) * barAreaW;
          const pctOfIncome =
            totalIncome > 0
              ? ((cat.value / totalIncome) * 100).toFixed(0)
              : '0';
          return (
            <g key={`expense-bar-${i}`}>
              {/* Category label */}
              <text
                x={labelW - 4}
                y={y + barH / 2 + 3}
                fill={C.dim}
                fontSize="9"
                textAnchor="end"
                fontFamily={FONT}
              >
                {cat.label}
              </text>
              {/* Background bar track */}
              <rect
                x={labelW}
                y={y}
                width={barAreaW}
                height={barH}
                fill={C.border}
                rx="2"
              />
              {/* Filled bar */}
              <rect
                x={labelW}
                y={y}
                width={Math.max(2, barW)}
                height={barH}
                fill={cat.color}
                fillOpacity={0.75}
                rx="2"
              />
              {/* Value text */}
              <text
                x={labelW + Math.max(2, barW) + 4}
                y={y + barH / 2 + 3}
                fill={C.text}
                fontSize="8"
                textAnchor="start"
                fontFamily={FONT}
              >
                {fmtShort(cat.value)}
              </text>
              {/* Percentage of total income */}
              <text
                x={chartW - 4}
                y={y + barH / 2 + 3}
                fill={C.dim}
                fontSize="8"
                textAnchor="end"
                fontFamily={FONT}
              >
                {pctOfIncome}%
              </text>
            </g>
          );
        })}
        {/* Total separator and value */}
        <line
          x1={labelW}
          y1={138}
          x2={chartW - 4}
          y2={138}
          stroke={C.border}
          strokeWidth="0.5"
        />
        <text
          x={labelW - 4}
          y={150}
          fill={C.text}
          fontSize="9"
          textAnchor="end"
          fontFamily={FONT}
          fontWeight="bold"
        >
          TOTAL
        </text>
        <text
          x={chartW - 4}
          y={150}
          fill={C.orange}
          fontSize="9"
          textAnchor="end"
          fontFamily={FONT}
          fontWeight="bold"
        >
          {fmtShort(categories.reduce((s, c) => s + c.value, 0))}
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 5: SpendingTrendArea
// 8-point area chart showing monthly spending trend
// Fill: #00E5FF at 20% opacity, Stroke: #00E5FF
// ============================================================
function SpendingTrendArea({
  data,
}: {
  data: { month: number; value: number }[];
}) {
  const chart = lineCoords(data, 300, 200, {
    l: 40,
    r: 15,
    t: 10,
    b: 28,
  });

  if (!chart) {
    return (
      <section style={{ width: '100%' }}>
        <p style={headingStyle}>Spending Trend</p>
        <div
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: C.muted,
              fontFamily: FONT,
            }}
          >
            Need 2+ months of data
          </p>
        </div>
      </section>
    );
  }

  const { coords, lineStr, areaD, maxV, minV, pad } = chart;
  const ph = 200 - pad.t - pad.b;

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Spending Trend</p>
      <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={`spend-grid-${pct}`}
            x1={pad.l}
            y1={pad.t + ph * (1 - pct)}
            x2={285}
            y2={pad.t + ph * (1 - pct)}
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Area fill at 20% opacity */}
        <path d={areaD} fill={C.cyan} fillOpacity={0.2} />
        {/* Spending line */}
        <polyline
          points={lineStr}
          fill="none"
          stroke={C.cyan}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {coords.map((c, i) => (
          <circle
            key={`spend-dot-${i}`}
            cx={c.x}
            cy={c.y}
            r="3"
            fill={C.bgDark}
            stroke={C.cyan}
            strokeWidth="1.5"
          />
        ))}
        {/* Y-axis labels */}
        <text
          x={pad.l - 4}
          y={pad.t + 4}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          {fmtShort(maxV)}
        </text>
        <text
          x={pad.l - 4}
          y={pad.t + ph + 3}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          {fmtShort(minV)}
        </text>
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`spend-x-${i}`}
            x={coords[i].x}
            y={194}
            fill={i === data.length - 1 ? C.cyan : C.dim}
            fontSize="7"
            textAnchor="middle"
            fontFamily={FONT}
          >
            M{d.month}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 6: SavingsRateRing
// Circular ring (0-100) showing savings rate as a percentage
// of total income. Uses arc path from 12 o'clock clockwise.
// Stroke color: #CCFF00 (Neon Lime)
// ============================================================
function SavingsRateRing({ rate }: { rate: number }) {
  const clampedRate = Math.min(100, Math.max(0, Math.round(rate)));
  const { d: arcD, ex, ey } = ringArc(100, 100, 78, clampedRate / 100);

  const description =
    clampedRate >= 30
      ? 'Strong savings discipline'
      : clampedRate >= 15
        ? 'Moderate savings rate'
        : 'Consider increasing savings';

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Savings Rate</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <svg
          viewBox="0 0 200 200"
          style={{ width: '140px', height: '140px', flexShrink: 0 }}
        >
          {/* Background ring */}
          <circle
            cx={100}
            cy={100}
            r={78}
            fill="none"
            stroke={C.border}
            strokeWidth="10"
          />
          {/* Value arc */}
          <path
            d={arcD}
            fill="none"
            stroke={C.lime}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* End indicator dot */}
          <circle cx={ex} cy={ey} r="5" fill={C.lime} />
          {/* Center percentage */}
          <text
            x={100}
            y={94}
            fill={C.lime}
            fontSize="24"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily={FONT}
          >
            {clampedRate}%
          </text>
          <text
            x={100}
            y={112}
            fill={C.dim}
            fontSize="9"
            textAnchor="middle"
            fontFamily={FONT}
          >
            of income saved
          </text>
        </svg>
        {/* Description panel */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: '10px',
              color: C.dim,
              marginBottom: '6px',
              fontFamily: FONT,
            }}
          >
            {description}
          </p>
          <p
            style={{
              fontSize: '9px',
              color: C.muted,
              fontFamily: FONT,
              lineHeight: '1.5',
            }}
          >
            Financial advisors recommend saving at least 20-30% of gross
            income for long-term wealth building and post-career security.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SVG 7: InvestmentPortfolioDonut
// 4-segment donut showing portfolio allocation via .reduce()
// Segments: Property / Stocks / Business / Venture
// Primary accent: #FF5500 (Electric Orange)
// ============================================================
function InvestmentPortfolioDonut({
  propertyVal,
  stocksVal,
  businessVal,
  ventureVal,
}: {
  propertyVal: number;
  stocksVal: number;
  businessVal: number;
  ventureVal: number;
}) {
  const segments: DonutSegment[] = [
    { value: propertyVal, color: C.orange, label: 'Property' },
    { value: stocksVal, color: C.cyan, label: 'Stocks' },
    { value: businessVal, color: C.lime, label: 'Business' },
    { value: ventureVal, color: C.muted, label: 'Venture' },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const arcs = computeDonutArcs(segments, 80, 80, 55, 32);

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Portfolio Allocation</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <svg
          viewBox="0 0 160 160"
          style={{ width: '128px', height: '128px', flexShrink: 0 }}
        >
          <circle
            cx={80}
            cy={80}
            r={44}
            fill="none"
            stroke={C.border}
            strokeWidth="24"
          />
          {arcs.map((arc) => (
            <path
              key={`portfolio-donut-${arc.idx}`}
              d={arc.d}
              fill={arc.color}
              fillOpacity={0.85}
            />
          ))}
          <text
            x={80}
            y={74}
            fill={C.orange}
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily={FONT}
          >
            {fmtShort(total)}
          </text>
          <text
            x={80}
            y={90}
            fill={C.dim}
            fontSize="8"
            textAnchor="middle"
            fontFamily={FONT}
          >
            invested
          </text>
        </svg>
        {/* Legend with allocation percentages */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
          }}
        >
          {segments.map((seg, i) => {
            const pctVal =
              total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
            return (
              <div
                key={`portfolio-legend-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: seg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    color: C.text,
                    flex: 1,
                    fontFamily: FONT,
                    fontWeight: 'bold',
                  }}
                >
                  {seg.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: seg.color,
                    fontFamily: FONT,
                  }}
                >
                  {pctVal}%
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: C.dim,
                    fontFamily: FONT,
                    minWidth: '52px',
                    textAlign: 'right' as const,
                  }}
                >
                  {fmtShort(seg.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SVG 8: InvestmentReturnRadar
// 5-axis radar chart showing ROI by investment category
// Axes: Property / Stocks / Business / Venture / Overall
// Stroke color: #00E5FF (Cyan Blue)
// ============================================================
function InvestmentReturnRadar({
  propertyROI,
  stocksROI,
  businessROI,
  ventureROI,
  overallROI,
}: {
  propertyROI: number;
  stocksROI: number;
  businessROI: number;
  ventureROI: number;
  overallROI: number;
}) {
  const axes: RadarAxis[] = [
    { label: 'Property', value: propertyROI },
    { label: 'Stocks', value: stocksROI },
    { label: 'Business', value: businessROI },
    { label: 'Venture', value: ventureROI },
    { label: 'Overall', value: overallROI },
  ];

  const { rings, lines, poly, dots, labels } = radarData(
    axes,
    150,
    110,
    72
  );

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>ROI by Category</p>
      <svg viewBox="0 0 300 240" style={{ width: '100%', height: 'auto' }}>
        {/* Grid rings at 25/50/75/100% */}
        {rings.map((r, i) => (
          <polygon
            key={`roi-ring-${i}`}
            points={r.pts}
            fill="none"
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Axis lines */}
        {lines.map((l, i) => (
          <line
            key={`roi-axis-${i}`}
            x1={150}
            y1={110}
            x2={l.x2}
            y2={l.y2}
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={poly}
          fill={C.cyan}
          fillOpacity={0.12}
          stroke={C.cyan}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Data dots */}
        {dots.map((d, i) => (
          <circle
            key={`roi-dot-${i}`}
            cx={d.x}
            cy={d.y}
            r="3"
            fill={C.cyan}
          />
        ))}
        {/* Axis labels */}
        {labels.map((p, i) => (
          <text
            key={`roi-label-${i}`}
            x={p.x}
            y={p.y}
            fill={C.dim}
            fontSize="9"
            textAnchor="middle"
            fontFamily={FONT}
            dominantBaseline="central"
          >
            {p.label}
          </text>
        ))}
        {/* Subtitle */}
        <text
          x={150}
          y={232}
          fill={C.muted}
          fontSize="7"
          textAnchor="middle"
          fontFamily={FONT}
        >
          Returns indexed 0-100 based on market benchmarks
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 9: FinancialAdvisorRatingRing
// Circular ring (0-100) showing financial advisor trust score
// Derived from player.agentQuality in game state.
// Stroke color: #CCFF00 (Neon Lime)
// ============================================================
function FinancialAdvisorRatingRing({
  score,
  agentName,
}: {
  score: number;
  agentName: string;
}) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const { d: arcD, ex, ey } = ringArc(100, 100, 78, clampedScore / 100);

  const ratingLabel =
    clampedScore >= 80
      ? 'Elite'
      : clampedScore >= 60
        ? 'Trusted'
        : clampedScore >= 40
          ? 'Adequate'
          : clampedScore >= 20
            ? 'Risky'
            : 'Unproven';

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Financial Advisor Rating</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <svg
          viewBox="0 0 200 200"
          style={{ width: '140px', height: '140px', flexShrink: 0 }}
        >
          {/* Background ring */}
          <circle
            cx={100}
            cy={100}
            r={78}
            fill="none"
            stroke={C.border}
            strokeWidth="10"
          />
          {/* Value arc */}
          <path
            d={arcD}
            fill="none"
            stroke={C.lime}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* End indicator dot */}
          <circle cx={ex} cy={ey} r="5" fill={C.lime} />
          {/* Center score */}
          <text
            x={100}
            y={90}
            fill={C.lime}
            fontSize="24"
            textAnchor="middle"
            fontWeight="bold"
            fontFamily={FONT}
          >
            {clampedScore}
          </text>
          <text
            x={100}
            y={108}
            fill={C.text}
            fontSize="10"
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight="bold"
          >
            {ratingLabel}
          </text>
          <text
            x={100}
            y={122}
            fill={C.dim}
            fontSize="8"
            textAnchor="middle"
            fontFamily={FONT}
          >
            trust score
          </text>
        </svg>
        {/* Agent info panel */}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: '11px',
              color: C.text,
              marginBottom: '4px',
              fontFamily: FONT,
              fontWeight: 'bold',
            }}
          >
            {agentName}
          </p>
          <p
            style={{
              fontSize: '10px',
              color: C.dim,
              marginBottom: '8px',
              fontFamily: FONT,
            }}
          >
            Agent quality directly impacts deal negotiations and financial
            planning outcomes.
          </p>
          {/* Visual trust level bars */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold) => (
              <div
                key={`advisor-bar-${threshold}`}
                style={{
                  width: '24px',
                  height: '6px',
                  backgroundColor:
                    clampedScore / 100 >= threshold ? C.lime : C.border,
                  borderRadius: '1px',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SVG 10: NetWorthProgressionLine
// 8-point line chart showing net worth growth over career seasons
// Includes a subtle area fill and latest value annotation.
// Stroke color: #CCFF00 (Neon Lime)
// ============================================================
function NetWorthProgressionLine({
  data,
}: {
  data: { season: number; value: number }[];
}) {
  const chart = lineCoords(data, 300, 200, {
    l: 45,
    r: 15,
    t: 10,
    b: 28,
  });

  if (!chart) {
    return (
      <section style={{ width: '100%' }}>
        <p style={headingStyle}>Net Worth Progression</p>
        <div
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: C.muted,
              fontFamily: FONT,
            }}
          >
            Need 2+ seasons of data
          </p>
        </div>
      </section>
    );
  }

  const { coords, lineStr, areaD, maxV, pad } = chart;
  const ph = 200 - pad.t - pad.b;
  const lastIdx = data.length - 1;

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Net Worth Progression</p>
      <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={`nw-grid-${pct}`}
            x1={pad.l}
            y1={pad.t + ph * (1 - pct)}
            x2={285}
            y2={pad.t + ph * (1 - pct)}
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Subtle area fill */}
        <path d={areaD} fill={C.lime} fillOpacity={0.06} />
        {/* Net worth line */}
        <polyline
          points={lineStr}
          fill="none"
          stroke={C.lime}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {coords.map((c, i) => (
          <circle
            key={`nw-dot-${i}`}
            cx={c.x}
            cy={c.y}
            r="3"
            fill={C.bgDark}
            stroke={C.lime}
            strokeWidth="1.5"
          />
        ))}
        {/* Y-axis label (max value) */}
        <text
          x={pad.l - 4}
          y={pad.t + 4}
          fill={C.dim}
          fontSize="7"
          textAnchor="end"
          fontFamily={FONT}
        >
          {fmtShort(maxV)}
        </text>
        {/* X-axis season labels */}
        {data.map((d, i) => (
          <text
            key={`nw-x-${i}`}
            x={coords[i].x}
            y={194}
            fill={i === lastIdx ? C.lime : C.dim}
            fontSize="7"
            textAnchor="middle"
            fontFamily={FONT}
          >
            S{d.season}
          </text>
        ))}
        {/* Latest value annotation */}
        <text
          x={coords[lastIdx].x}
          y={coords[lastIdx].y - 8}
          fill={C.lime}
          fontSize="8"
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight="bold"
        >
          {fmtShort(data[lastIdx].value)}
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 11: WealthComparisonBars
// 5 horizontal bars comparing net worth against benchmarks:
// You / League Avg / Top Earner / Club Legend / All-Time
// Fill color: #FF5500 (Electric Orange)
// ============================================================
function WealthComparisonBars({
  playerNW,
  leagueAvgNW,
  topEarnerNW,
  clubLegendNW,
  allTimeNW,
}: {
  playerNW: number;
  leagueAvgNW: number;
  topEarnerNW: number;
  clubLegendNW: number;
  allTimeNW: number;
}) {
  const comparisons = [
    { label: 'You', value: playerNW, color: C.orange, isPlayer: true },
    {
      label: 'League Avg',
      value: leagueAvgNW,
      color: C.muted,
      isPlayer: false,
    },
    {
      label: 'Top Earner',
      value: topEarnerNW,
      color: C.dim,
      isPlayer: false,
    },
    {
      label: 'Club Legend',
      value: clubLegendNW,
      color: C.muted,
      isPlayer: false,
    },
    {
      label: 'All-Time',
      value: allTimeNW,
      color: C.dim,
      isPlayer: false,
    },
  ];

  const maxVal = Math.max(...comparisons.map((c) => c.value), 1);
  const barH = 18;
  const barGap = 12;
  const labelW = 80;
  const chartW = 300;
  const barAreaW = chartW - labelW - 60;

  const percentile =
    maxVal > 0
      ? Math.min(100, Math.round((playerNW / topEarnerNW) * 100))
      : 0;

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Wealth Comparison</p>
      <svg viewBox="0 0 300 190" style={{ width: '100%', height: 'auto' }}>
        {comparisons.map((comp, i) => {
          const y = 6 + i * (barH + barGap);
          const barW = (comp.value / maxVal) * barAreaW;
          return (
            <g key={`wealth-bar-${i}`}>
              {/* Label */}
              <text
                x={labelW - 4}
                y={y + barH / 2 + 3}
                fill={comp.isPlayer ? C.orange : C.dim}
                fontSize="9"
                textAnchor="end"
                fontFamily={FONT}
                fontWeight={comp.isPlayer ? 'bold' : 'normal'}
              >
                {comp.label}
              </text>
              {/* Background bar */}
              <rect
                x={labelW}
                y={y}
                width={barAreaW}
                height={barH}
                fill={C.border}
                rx="2"
              />
              {/* Value bar */}
              <rect
                x={labelW}
                y={y}
                width={Math.max(2, barW)}
                height={barH}
                fill={comp.color}
                fillOpacity={comp.isPlayer ? 0.85 : 0.5}
                rx="2"
              />
              {/* Value text */}
              <text
                x={labelW + Math.max(2, barW) + 4}
                y={y + barH / 2 + 3}
                fill={comp.isPlayer ? C.text : C.dim}
                fontSize="8"
                textAnchor="start"
                fontFamily={FONT}
                fontWeight={comp.isPlayer ? 'bold' : 'normal'}
              >
                {fmtShort(comp.value)}
              </text>
            </g>
          );
        })}
        {/* Percentile annotation */}
        <text
          x={150}
          y={184}
          fill={C.dim}
          fontSize="8"
          textAnchor="middle"
          fontFamily={FONT}
        >
          You are at {percentile}% of the top earner&apos;s net worth
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 12: FinancialHealthRadar
// 5-axis radar chart showing composite financial health scores
// Axes: Income Stability / Debt Ratio / Savings / Growth / Lifestyle
// Stroke color: #00E5FF (Cyan Blue)
// ============================================================
function FinancialHealthRadar({
  incomeStability,
  debtRatio,
  savingsScore,
  growthScore,
  lifestyleBalance,
}: {
  incomeStability: number;
  debtRatio: number;
  savingsScore: number;
  growthScore: number;
  lifestyleBalance: number;
}) {
  const axes: RadarAxis[] = [
    { label: 'Income', value: incomeStability },
    { label: 'Debt Ratio', value: debtRatio },
    { label: 'Savings', value: savingsScore },
    { label: 'Growth', value: growthScore },
    { label: 'Lifestyle', value: lifestyleBalance },
  ];

  const { rings, lines, poly, dots, labels } = radarData(
    axes,
    150,
    110,
    72
  );

  // Overall composite score via .reduce()
  const overall = Math.round(
    axes.reduce((sum, a) => sum + a.value, 0) / axes.length
  );

  return (
    <section style={{ width: '100%' }}>
      <p style={headingStyle}>Financial Health — Overall: {overall}/100</p>
      <svg viewBox="0 0 300 240" style={{ width: '100%', height: 'auto' }}>
        {/* Grid rings */}
        {rings.map((r, i) => (
          <polygon
            key={`health-ring-${i}`}
            points={r.pts}
            fill="none"
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Axis lines */}
        {lines.map((l, i) => (
          <line
            key={`health-axis-${i}`}
            x1={150}
            y1={110}
            x2={l.x2}
            y2={l.y2}
            stroke={C.grid}
            strokeWidth="0.5"
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={poly}
          fill={C.cyan}
          fillOpacity={0.12}
          stroke={C.cyan}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Data dots with per-axis value annotations */}
        {dots.map((d, i) => (
          <g key={`health-dot-${i}`}>
            <circle cx={d.x} cy={d.y} r="3" fill={C.cyan} />
            <text
              x={d.x}
              y={d.y - 8}
              fill={C.cyan}
              fontSize="7"
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight="bold"
            >
              {axes[i].value}
            </text>
          </g>
        ))}
        {/* Axis labels */}
        {labels.map((p, i) => (
          <text
            key={`health-label-${i}`}
            x={p.x}
            y={p.y}
            fill={C.dim}
            fontSize="9"
            textAnchor="middle"
            fontFamily={FONT}
            dominantBaseline="central"
          >
            {p.label}
          </text>
        ))}
        {/* Overall score in center */}
        <text
          x={150}
          y={110}
          fill={C.text}
          fontSize="16"
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight="bold"
          dominantBaseline="central"
        >
          {overall}
        </text>
        {/* Subtitle */}
        <text
          x={150}
          y={232}
          fill={C.muted}
          fontSize="7"
          textAnchor="middle"
          fontFamily={FONT}
        >
          Composite score across 5 financial health dimensions
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// Tab Definitions — 4 tabs with icons
// ============================================================
const tabs = [
  { id: 'income' as const, label: 'Income', icon: '💰' },
  { id: 'expenses' as const, label: 'Expenses', icon: '💳' },
  { id: 'investments' as const, label: 'Investments', icon: '📊' },
  { id: 'net_worth' as const, label: 'Net Worth', icon: '🏆' },
];

// ============================================================
// Main Component: PersonalFinancesEnhanced
// 4-tab enhanced personal finances dashboard with 12 SVGs
// All data derived from gameState via useGameStore
// ============================================================
export default function PersonalFinancesEnhanced() {
  const gameState = useGameStore((state) => state.gameState);
  const [activeTab, setActiveTab] = useState<
    'income' | 'expenses' | 'investments' | 'net_worth'
  >('income');

  // ----------------------------------------------------------
  // Early return — all hooks are above this line
  // No hooks appear after this conditional return
  // ----------------------------------------------------------
  if (!gameState || !gameState.player || !gameState.player.contract) {
    return null;
  }

  // ----------------------------------------------------------
  // Destructure game state — safe after null check
  // ----------------------------------------------------------
  const player = gameState.player;
  const contract = player.contract;
  const clubName = gameState.currentClub?.name ?? 'Unknown Club';
  const currentSeason = gameState.currentSeason ?? 1;
  const currentWeek = gameState.currentWeek ?? 1;
  const seasons = gameState.seasons ?? [];
  const seasonStats = player.seasonStats;
  const careerStats = player.careerStats;

  // ----------------------------------------------------------
  // Base seed — deterministic from player/season/week
  // ----------------------------------------------------------
  const baseSeed =
    (player.name?.length ?? 5) * 137 + currentSeason * 31 + currentWeek * 7;

  // ----------------------------------------------------------
  // Core Financial Values — derived from contract + stats
  // ----------------------------------------------------------
  const weeklyWage = contract.weeklyWage;
  const annualSalary = weeklyWage * 52;
  const weeksPlayed = Math.max(0, currentWeek - 1);

  // Performance bonuses — accumulated from goals/assists/clean sheets
  const goalsBonusRate = contract.performanceBonuses?.goalsBonus ?? 0;
  const assistBonusRate = contract.performanceBonuses?.assistBonus ?? 0;
  const cleanSheetBonusRate =
    contract.performanceBonuses?.cleanSheetBonus ?? 0;
  const goalsEarned = seasonStats?.goals ?? 0;
  const assistsEarned = seasonStats?.assists ?? 0;
  const cleanSheetsEarned = seasonStats?.cleanSheets ?? 0;
  const totalBonusEarned =
    goalsEarned * goalsBonusRate +
    assistsEarned * assistBonusRate +
    cleanSheetsEarned * cleanSheetBonusRate;

  // Endorsement and image rights — derived from reputation + market value
  const endorsementIncome = Math.round(
    (player.marketValue * 0.05 * (player.reputation / 100)) *
      seededRange(baseSeed + 10, 0.8, 1.2)
  );
  const imageRightsIncome = Math.round(
    (player.marketValue * 0.02 * (player.overall / 100)) *
      seededRange(baseSeed + 11, 0.7, 1.3)
  );

  // Prize money — derived from career trophy count
  const trophyCount = careerStats?.trophies?.length ?? 0;
  const prizeIncome = Math.round(
    trophyCount * 500000 * seededRange(baseSeed + 12, 0.5, 1.5)
  );

  // Salary earned so far this season
  const salaryEarned = weeklyWage * weeksPlayed;

  // Total season income — sum of all income sources
  const totalSeasonIncome =
    salaryEarned +
    totalBonusEarned +
    endorsementIncome +
    imageRightsIncome +
    prizeIncome;

  // ----------------------------------------------------------
  // Monthly Income Trend (8 data points)
  // Each month derived from annual salary + variable bonuses
  // ----------------------------------------------------------
  const monthlyIncomeData = Array.from({ length: 8 }, (_, i) => {
    const ms = baseSeed + 100 + i * 17;
    const monthBase = annualSalary / 12;
    const monthBonus = seededRange(ms, 0, totalBonusEarned * 0.15);
    const monthEndorse = seededRange(
      ms + 1,
      endorsementIncome * 0.06,
      endorsementIncome * 0.1
    );
    const variance = seededRange(ms + 2, 0.85, 1.15);
    return {
      month: i + 1,
      value: Math.round((monthBase + monthBonus + monthEndorse) * variance),
    };
  });

  // ----------------------------------------------------------
  // Contract Value vs Market Maximum
  // ----------------------------------------------------------
  const contractTotalValue =
    annualSalary * (contract.yearsRemaining ?? 3) +
    (contract.signingBonus ?? 0);
  const marketMax =
    player.marketValue * 8 * seededRange(baseSeed + 50, 1.5, 3.0);

  // ----------------------------------------------------------
  // Expense Categories — derived from income proportions
  // ----------------------------------------------------------
  const housingExpense = Math.round(
    annualSalary * 0.15 * seededRange(baseSeed + 20, 0.8, 1.2)
  );
  const lifestyleExpense = Math.round(
    annualSalary * 0.12 * seededRange(baseSeed + 21, 0.7, 1.3)
  );
  const agentFee = Math.round(
    totalSeasonIncome * ((player.agentQuality ?? 30) / 1000)
  );
  const taxExpense = Math.round(totalSeasonIncome * 0.37);
  const grossExpenses =
    housingExpense + lifestyleExpense + agentFee + taxExpense;
  const savingsAmount = Math.max(0, totalSeasonIncome - grossExpenses);
  const savingsRate =
    totalSeasonIncome > 0
      ? Math.min(100, Math.round((savingsAmount / totalSeasonIncome) * 100))
      : 0;

  // ----------------------------------------------------------
  // Monthly Spending Trend (8 data points)
  // ----------------------------------------------------------
  const monthlySpendingData = Array.from({ length: 8 }, (_, i) => {
    const ms = baseSeed + 200 + i * 23;
    const base = (housingExpense + lifestyleExpense) / 12;
    const taxPortion = taxExpense / 12;
    const variance = seededRange(ms, 0.7, 1.3);
    const extraSpend = seededRange(ms + 1, 0, annualSalary * 0.02);
    return {
      month: i + 1,
      value: Math.round((base + taxPortion + extraSpend) * variance),
    };
  });

  // ----------------------------------------------------------
  // Investment Portfolio — derived from career earnings estimate
  // Allocation: Property / Stocks / Business / Venture
  // ----------------------------------------------------------
  const careerEarningsEstimate = seasons.reduce(
    (sum, s) =>
      sum +
      s.playerStats.goals * 10000 +
      s.playerStats.assists * 5000,
    totalSeasonIncome
  );
  const totalInvestable = Math.round(careerEarningsEstimate * 0.35);
  const propertyVal = Math.round(
    totalInvestable * seededRange(baseSeed + 30, 0.35, 0.45)
  );
  const stocksVal = Math.round(
    totalInvestable * seededRange(baseSeed + 31, 0.20, 0.30)
  );
  const businessVal = Math.round(
    totalInvestable * seededRange(baseSeed + 32, 0.15, 0.25)
  );
  const ventureVal = Math.max(
    0,
    totalInvestable - propertyVal - stocksVal - businessVal
  );

  // ----------------------------------------------------------
  // Investment ROI Scores (0-100 scale, seeded + player-derived)
  // ----------------------------------------------------------
  const propertyROI = Math.min(
    100,
    Math.round(seededRange(baseSeed + 40, 20, 80) + player.age * 0.5)
  );
  const stocksROI = Math.min(
    100,
    Math.round(
      seededRange(baseSeed + 41, 15, 75) + (player.overall - 50) * 0.3
    )
  );
  const businessROI = Math.min(
    100,
    Math.round(
      seededRange(baseSeed + 42, 10, 70) + player.reputation * 0.2
    )
  );
  const ventureROI = Math.min(
    100,
    Math.round(
      seededRange(baseSeed + 43, 5, 60) + (player.potential - 60) * 0.2
    )
  );
  const overallROI = Math.min(
    100,
    Math.round((propertyROI + stocksROI + businessROI + ventureROI) / 4)
  );

  // ----------------------------------------------------------
  // Financial Advisor Rating — from agentQuality
  // ----------------------------------------------------------
  const agentQualityBase = player.agentQuality ?? 30;
  const advisorScore = Math.min(
    100,
    Math.round(
      agentQualityBase * 1.2 + seededRange(baseSeed + 60, 0, 15)
    )
  );
  const agentName =
    agentQualityBase >= 60
      ? 'Marcus Sterling'
      : agentQualityBase >= 40
        ? 'David Miller'
        : 'Junior Agent';

  // ----------------------------------------------------------
  // Net Worth Progression (8 data points over career)
  // ----------------------------------------------------------
  const seasonsPlayed = careerStats?.seasonsPlayed ?? 0;
  const nwDataPoints = Math.max(2, Math.min(8, seasonsPlayed + 1));
  const netWorthData = Array.from({ length: nwDataPoints }, (_, i) => {
    const ms = baseSeed + 300 + i * 41;
    const growthFactor = 1 + i * 0.12 * seededRange(ms, 0.8, 1.2);
    const baseNW = annualSalary * 0.5;
    const seasonNW = Math.round(
      baseNW * growthFactor +
        seededRange(ms + 1, 0, player.marketValue * 0.05) * i
    );
    return {
      season: Math.max(1, currentSeason - nwDataPoints + 1 + i),
      value: seasonNW,
    };
  });

  // ----------------------------------------------------------
  // Wealth Comparison — seeded benchmark values
  // ----------------------------------------------------------
  const playerNetWorth =
    netWorthData[netWorthData.length - 1]?.value ?? 0;
  const leagueAvgNW = Math.round(
    playerNetWorth * seededRange(baseSeed + 70, 0.3, 0.6)
  );
  const topEarnerNW = Math.round(
    playerNetWorth * seededRange(baseSeed + 71, 2.0, 5.0)
  );
  const clubLegendNW = Math.round(
    playerNetWorth * seededRange(baseSeed + 72, 1.5, 3.5)
  );
  const allTimeNW = Math.round(
    playerNetWorth * seededRange(baseSeed + 73, 4.0, 8.0)
  );

  // ----------------------------------------------------------
  // Financial Health Scores (derived from multiple factors)
  // ----------------------------------------------------------
  const incomeStabilityScore = Math.min(
    100,
    Math.round(
      (contract.yearsRemaining ?? 1) * 15 +
        (player.reputation / 100) * 40 +
        seededRange(baseSeed + 80, 10, 30)
    )
  );
  const debtRatioScore = Math.min(
    100,
    Math.round(
      100 -
        (taxExpense / Math.max(1, totalSeasonIncome)) * 50 +
        seededRange(baseSeed + 81, 5, 25)
    )
  );
  const savingsHealthScore = Math.min(
    100,
    Math.round(savingsRate * 1.2 + seededRange(baseSeed + 82, 0, 15))
  );
  const growthHealthScore = Math.min(
    100,
    Math.round(
      overallROI * 0.6 +
        ((player.potential - player.overall) / 10) * 5 +
        seededRange(baseSeed + 83, 5, 20)
    )
  );
  const lifestyleBalanceScore = Math.min(
    100,
    Math.round(
      100 -
        (lifestyleExpense / Math.max(1, annualSalary)) * 100 +
        seededRange(baseSeed + 84, 5, 20)
    )
  );

  // ----------------------------------------------------------
  // Summary Cards Helper — reusable mini stat cards
  // ----------------------------------------------------------
  const summaryCards = (
    items: { label: string; value: string; color: string }[]
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}
    >
      {items.map((card) => (
        <div key={card.label} style={smallCardStyle}>
          <p style={labelStyle}>{card.label}</p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: card.color,
              margin: '4px 0 0',
              fontFamily: FONT,
            }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );

  // ----------------------------------------------------------
  // Render — Tab-based layout with 4 tabs, 3 SVGs each
  // ----------------------------------------------------------
  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '640px',
        margin: '0 auto',
        fontFamily: FONT,
        backgroundColor: C.bgDark,
        minHeight: '100vh',
      }}
    >
      {/* =========================================
          HEADER
          ========================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: C.text,
              margin: 0,
              fontFamily: FONT,
            }}
          >
            💰 Personal Finances
          </h1>
          <p
            style={{
              fontSize: '11px',
              color: C.dim,
              margin: '2px 0 0',
              fontFamily: FONT,
            }}
          >
            {player.name} · {clubName} · Season {currentSeason} · Week{' '}
            {currentWeek}
          </p>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 85, 0, 0.15)',
            border: `1px solid ${C.orange}`,
            fontSize: '10px',
            color: C.orange,
            fontFamily: FONT,
            fontWeight: 'bold',
          }}
        >
          {fmtShort(totalSeasonIncome)}
        </div>
      </div>

      {/* =========================================
          TAB BAR
          ========================================= */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '20px',
          backgroundColor: C.bgCard,
          borderRadius: '8px',
          padding: '4px',
          border: `1px solid ${C.border}`,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor:
                activeTab === tab.id
                  ? 'rgba(255, 85, 0, 0.15)'
                  : 'transparent',
              color: activeTab === tab.id ? C.orange : C.dim,
              fontSize: '11px',
              fontFamily: FONT,
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: activeTab === tab.id ? 1 : 0.7,
              transition: 'opacity 0.2s ease',
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =========================================
          TAB: INCOME (SVGs 1-3)
          ========================================= */}
      {activeTab === 'income' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {summaryCards([
            {
              label: 'Weekly Wage',
              value: fmtShort(weeklyWage) + '/wk',
              color: C.cyan,
            },
            {
              label: 'Annual Salary',
              value: fmtShort(annualSalary),
              color: C.lime,
            },
            {
              label: 'Season Total',
              value: fmtShort(totalSeasonIncome),
              color: C.orange,
            },
          ])}

          {/* SVG 1: IncomeSourceDonut */}
          <div style={cardStyle}>
            <IncomeSourceDonut
              salary={salaryEarned}
              bonuses={totalBonusEarned}
              endorsements={endorsementIncome}
              imageRights={imageRightsIncome}
              prizes={prizeIncome}
              season={currentSeason}
            />
          </div>

          {/* SVG 2: IncomeTrendLine */}
          <div style={cardStyle}>
            <IncomeTrendLine data={monthlyIncomeData} />
          </div>

          {/* SVG 3: ContractValueGauge */}
          <div style={cardStyle}>
            <ContractValueGauge
              contractValue={contractTotalValue}
              marketMax={marketMax}
              weeklyWage={weeklyWage}
            />
          </div>
        </div>
      )}

      {/* =========================================
          TAB: EXPENSES (SVGs 4-6)
          ========================================= */}
      {activeTab === 'expenses' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {summaryCards([
            {
              label: 'Total Expenses',
              value: fmtShort(grossExpenses),
              color: C.orange,
            },
            {
              label: 'Savings',
              value: fmtShort(savingsAmount),
              color: C.lime,
            },
            {
              label: 'Savings Rate',
              value: `${savingsRate}%`,
              color: savingsRate >= 20 ? C.cyan : C.orange,
            },
          ])}

          {/* SVG 4: ExpenseCategoryBars */}
          <div style={cardStyle}>
            <ExpenseCategoryBars
              housing={housingExpense}
              lifestyle={lifestyleExpense}
              agent={agentFee}
              tax={taxExpense}
              savings={savingsAmount}
              totalIncome={totalSeasonIncome}
            />
          </div>

          {/* SVG 5: SpendingTrendArea */}
          <div style={cardStyle}>
            <SpendingTrendArea data={monthlySpendingData} />
          </div>

          {/* SVG 6: SavingsRateRing */}
          <div style={cardStyle}>
            <SavingsRateRing rate={savingsRate} />
          </div>
        </div>
      )}

      {/* =========================================
          TAB: INVESTMENTS (SVGs 7-9)
          ========================================= */}
      {activeTab === 'investments' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {summaryCards([
            {
              label: 'Total Invested',
              value: fmtShort(totalInvestable),
              color: C.orange,
            },
            {
              label: 'Overall ROI',
              value: `${overallROI}/100`,
              color: C.cyan,
            },
            {
              label: 'Advisor Score',
              value: `${advisorScore}/100`,
              color: C.lime,
            },
          ])}

          {/* SVG 7: InvestmentPortfolioDonut */}
          <div style={cardStyle}>
            <InvestmentPortfolioDonut
              propertyVal={propertyVal}
              stocksVal={stocksVal}
              businessVal={businessVal}
              ventureVal={ventureVal}
            />
          </div>

          {/* SVG 8: InvestmentReturnRadar */}
          <div style={cardStyle}>
            <InvestmentReturnRadar
              propertyROI={propertyROI}
              stocksROI={stocksROI}
              businessROI={businessROI}
              ventureROI={ventureROI}
              overallROI={overallROI}
            />
          </div>

          {/* SVG 9: FinancialAdvisorRatingRing */}
          <div style={cardStyle}>
            <FinancialAdvisorRatingRing
              score={advisorScore}
              agentName={agentName}
            />
          </div>
        </div>
      )}

      {/* =========================================
          TAB: NET WORTH (SVGs 10-12)
          ========================================= */}
      {activeTab === 'net_worth' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {summaryCards([
            {
              label: 'Net Worth',
              value: fmtShort(playerNetWorth),
              color: C.lime,
            },
            {
              label: 'League Avg',
              value: fmtShort(leagueAvgNW),
              color: C.dim,
            },
            {
              label: 'Top Earner',
              value: fmtShort(topEarnerNW),
              color: C.orange,
            },
          ])}

          {/* SVG 10: NetWorthProgressionLine */}
          <div style={cardStyle}>
            <NetWorthProgressionLine data={netWorthData} />
          </div>

          {/* SVG 11: WealthComparisonBars */}
          <div style={cardStyle}>
            <WealthComparisonBars
              playerNW={playerNetWorth}
              leagueAvgNW={leagueAvgNW}
              topEarnerNW={topEarnerNW}
              clubLegendNW={clubLegendNW}
              allTimeNW={allTimeNW}
            />
          </div>

          {/* SVG 12: FinancialHealthRadar */}
          <div style={cardStyle}>
            <FinancialHealthRadar
              incomeStability={incomeStabilityScore}
              debtRatio={debtRatioScore}
              savingsScore={savingsHealthScore}
              growthScore={growthHealthScore}
              lifestyleBalance={lifestyleBalanceScore}
            />
          </div>

          {/* Financial Snapshot Footer */}
          <div
            style={{
              ...cardStyle,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap' as const,
              gap: '8px',
            }}
          >
            <div>
              <p style={labelStyle}>Financial Snapshot</p>
              <p
                style={{
                  fontSize: '9px',
                  color: C.muted,
                  margin: '2px 0 0',
                  fontFamily: FONT,
                }}
              >
                Career Est: {fmtShort(careerEarningsEstimate)} · MV:{' '}
                {fmtShort(player.marketValue)} · Contract:{' '}
                {contract.yearsRemaining ?? 0}yr remaining
              </p>
            </div>
            <span
              style={{
                fontSize: '9px',
                color: C.dim,
                fontFamily: FONT,
              }}
            >
              {clubName}
            </span>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile navigation */}
      <div style={{ height: '80px' }} />
    </div>
  );
}
