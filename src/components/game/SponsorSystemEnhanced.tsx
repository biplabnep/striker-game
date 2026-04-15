'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Seeded random helpers — deterministic from season/week
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

// ============================================================
// Currency formatters
// ============================================================
function fmtCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `\u20AC${m.toFixed(1)}M` : `\u20AC${m.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `\u20AC${(value / 1_000).toFixed(1)}K`;
  }
  return `\u20AC${value.toFixed(0)}`;
}

// ============================================================
// SVG geometry helpers
// ============================================================
function polarToCart(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function buildPolygonPoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

function buildPolylinePoints(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${x},${y}`).join(' ');
}

// Stroke-based arc path (no transforms needed)
function buildArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${start[0]} ${start[1]}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end[0]} ${end[1]}`,
  ].join(' ');
}

function buildDonutArc(
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  const outerStart = polarToCart(cx, cy, outerR, startAngle);
  const outerEnd = polarToCart(cx, cy, outerR, endAngle);
  const innerEnd = polarToCart(cx, cy, innerR, endAngle);
  const innerStart = polarToCart(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart[0]} ${outerStart[1]}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]}`,
    `L ${innerEnd[0]} ${innerEnd[1]}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]}`,
    'Z',
  ].join(' ');
}

function computeDonutArcs(
  cx: number, cy: number, outerR: number, innerR: number,
  segments: { label: string; count: number; color: string }[]
): Array<{ path: string; label: string; pct: number; color: string; midAngle: number }> {
  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;
  return segments.reduce<Array<{
    path: string; label: string; pct: number; color: string; midAngle: number;
  }>>((acc, seg, idx) => {
    const startAngle = idx === 0
      ? -90
      : acc.reduce((s, a) => s + (a.pct / 100) * 360, -90);
    const segAngle = (seg.count / total) * 360;
    const endAngle = startAngle + segAngle;
    const midAngle = startAngle + segAngle / 2;
    const path = buildDonutArc(cx, cy, outerR, innerR, startAngle, endAngle);
    return [...acc, {
      path, label: seg.label,
      pct: Math.round((seg.count / total) * 100),
      color: seg.color, midAngle,
    }];
  }, []);
}

// ============================================================
// Sponsor data types
// ============================================================
interface SponsorDeal {
  id: string;
  brand: string;
  category: string;
  tier: string;
  annualValue: number;
  contractYears: number;
  yearsRemaining: number;
  totalValue: number;
  color: string;
}

interface NegotiationDeal {
  id: string;
  brand: string;
  category: string;
  annualValue: number;
  marketRate: number;
  contractYears: number;
  progress: number;
  color: string;
}

interface SponsorTarget {
  id: string;
  brand: string;
  category: string;
  attractiveness: number;
  color: string;
}

// ============================================================
// Data generators (deterministic from game state)
// ============================================================
function generateActiveSponsors(seed: number, reputation: number): SponsorDeal[] {
  const brandData = [
    { brand: 'Nike', category: 'Sportswear', color: '#FF5500' },
    { brand: 'Red Bull', category: 'Energy Drink', color: '#CCFF00' },
    { brand: 'Rolex', category: 'Watch', color: '#00E5FF' },
    { brand: 'Adidas', category: 'Sportswear', color: '#666666' },
    { brand: 'Apple', category: 'Tech', color: '#888888' },
  ];

  const count = reputation >= 70 ? 5 : reputation >= 40 ? 3 : reputation >= 20 ? 2 : 1;

  return brandData.slice(0, count).map((bd, i) => {
    const years = seededInt(seed + i * 17, 2, 4);
    const yearsRemaining = seededInt(seed + i * 31, 1, years);
    const baseValue = seededInt(seed + i * 53, 300000, 4000000) * (reputation / 50);
    const annualValue = Math.round(baseValue * seededRange(seed + i * 71, 0.8, 1.4));

    return {
      id: `sponsor-enh-${i}`,
      brand: bd.brand,
      category: bd.category,
      tier: reputation >= 70 ? 'Platinum' : reputation >= 50 ? 'Gold' : 'Silver',
      annualValue,
      contractYears: years,
      yearsRemaining,
      totalValue: annualValue * years,
      color: bd.color,
    };
  });
}

function generateNegotiations(seed: number, reputation: number): NegotiationDeal[] {
  const deals = [
    { brand: 'Puma', category: 'Sportswear', color: '#CCFF00' },
    { brand: 'Monster Energy', category: 'Energy', color: '#FF5500' },
    { brand: 'Omega', category: 'Watch', color: '#00E5FF' },
    { brand: 'BMW', category: 'Automotive', color: '#666666' },
    { brand: 'Coca-Cola', category: 'Beverage', color: '#888888' },
  ];

  return deals.map((d, i) => {
    const s = seed + i * 97;
    const baseValue = Math.round(seededRange(s + 1, 500000, 3000000) * (reputation / 50));
    const annualValue = Math.round(baseValue * seededRange(s + 2, 0.7, 1.3));
    const marketRate = Math.round(annualValue * seededRange(s + 3, 0.6, 1.5));

    return {
      id: `nego-${i}`,
      brand: d.brand,
      category: d.category,
      annualValue,
      marketRate,
      contractYears: seededInt(s + 4, 2, 5),
      progress: Math.round(seededRange(s + 5, 10, 95)),
      color: d.color,
    };
  });
}

function generateSponsorTargets(seed: number, reputation: number): SponsorTarget[] {
  const targets = [
    { brand: 'Gatorade', category: 'Beverage', color: '#00E5FF' },
    { brand: 'Samsung', category: 'Tech', color: '#CCFF00' },
    { brand: 'Mercedes', category: 'Automotive', color: '#FF5500' },
    { brand: 'Umbro', category: 'Sportswear', color: '#888888' },
    { brand: 'Pepsi', category: 'Beverage', color: '#666666' },
  ];

  return targets.map((t, i) => ({
    id: `target-${i}`,
    brand: t.brand,
    category: t.category,
    attractiveness: Math.round(seededRange(seed + i * 41, 20, 100) * (reputation / 50)),
    color: t.color,
  }));
}

// ============================================================
// Web3 Color Tokens
// ============================================================
const W3 = {
  oledBlack: '#000000',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  mutedGray: '#666666',
  dimGray: '#888888',
  textPrimary: '#c9d1d9',
  textMuted: '#8b949e',
  border: '#30363d',
};

const FONT_FAMILY = "'Monaspace Neon', 'Space Grotesk', monospace";

// ============================================================
// Tab definitions
// ============================================================
const tabs = [
  { id: 'current_sponsors', label: 'Current Sponsors', icon: '\uD83D\uDCBC' },
  { id: 'negotiations', label: 'Negotiations', icon: '\uD83E\uDD1D' },
  { id: 'market_value', label: 'Market Value', icon: '\uD83D\uDCC8' },
  { id: 'sponsor_targets', label: 'Targets', icon: '\uD83C\uDFAF' },
] as const;

type TabId = typeof tabs[number]['id'];

// ============================================================
// SVG 1: SponsorRevenueDonut (Tab 1)
// 5-segment donut — Kit/Training Ground/Stadium/Individual/Performance
// ============================================================
function SponsorRevenueDonut({ sponsors }: { sponsors: SponsorDeal[] }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 48;

  const segments = [
    { label: 'Kit', count: sponsors.reduce((s, sp) => s + sp.annualValue * 0.3, 0), color: W3.cyanBlue },
    { label: 'Training Ground', count: sponsors.reduce((s, sp) => s + sp.annualValue * 0.2, 0), color: W3.electricOrange },
    { label: 'Stadium', count: sponsors.reduce((s, sp) => s + sp.annualValue * 0.15, 0), color: W3.neonLime },
    { label: 'Individual', count: sponsors.reduce((s, sp) => s + sp.annualValue * 0.2, 0), color: W3.dimGray },
    { label: 'Performance', count: sponsors.reduce((s, sp) => s + sp.annualValue * 0.15, 0), color: W3.mutedGray },
  ];

  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const arcs = computeDonutArcs(cx, cy, outerR, innerR, segments);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Revenue Split by Type
      </h3>
      <svg viewBox="0 0 200 200" className="w-full" style={{ maxWidth: 180, margin: '0 auto', display: 'block' }}>
        {arcs.map((arc, i) => (
          <path
            key={`revenue-donut-${i}`}
            d={arc.path}
            fill={arc.color}
            fillOpacity={0.8}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={W3.textPrimary} fontSize="14" fontWeight="bold"
          style={{ fontFamily: FONT_FAMILY }}>
          {fmtCurrencyShort(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>
          total / yr
        </text>
        {arcs.map((arc, i) => {
          const labelPos = polarToCart(cx, cy, outerR + 14, arc.midAngle);
          const anchor = arc.midAngle > 90 && arc.midAngle < 270 ? 'end' : 'start';
          return (
            <text
              key={`revenue-label-${i}`}
              x={labelPos[0]}
              y={labelPos[1]}
              textAnchor={anchor}
              fill={W3.textMuted}
              fontSize="8"
              style={{ fontFamily: FONT_FAMILY }}
            >
              {arc.label} {arc.pct}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 2: ContractDurationBars (Tab 1)
// 5 horizontal bars showing remaining contract duration
// ============================================================
function ContractDurationBars({ sponsors }: { sponsors: SponsorDeal[] }): React.JSX.Element {
  const maxYears = 4;

  const bars = sponsors.slice(0, 5).map((sp, i) => ({
    label: sp.brand,
    years: sp.yearsRemaining,
    maxYears: sp.contractYears,
    color: i % 2 === 0 ? W3.electricOrange : W3.cyanBlue,
  }));

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Contract Duration Remaining
      </h3>
      <svg viewBox="0 0 300 140" className="w-full">
        {bars.map((bar, i) => {
          const barWidth = (bar.years / maxYears) * 180;
          const y = 8 + i * 26;
          const bgWidth = (bar.maxYears / maxYears) * 180;
          return (
            <g key={`duration-bar-${i}`}>
              <rect x={80} y={y} width={bgWidth} height={16} rx={2}
                fill={W3.border} fillOpacity={0.4} />
              <rect x={80} y={y} width={barWidth} height={16} rx={2}
                fill={bar.color} fillOpacity={0.85} />
              <text x={75} y={y + 12} textAnchor="end" fill={W3.textMuted} fontSize="9"
                style={{ fontFamily: FONT_FAMILY }}>
                {bar.label}
              </text>
              <text x={85 + barWidth} y={y + 12} textAnchor="start" fill={W3.textPrimary} fontSize="9"
                style={{ fontFamily: FONT_FAMILY }}>
                {bar.years}yr
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 3: SponsorSatisfactionRadar (Tab 1)
// 5-axis radar — Brand Exposure/Performance/Compliance/Engagement/Renewal
// ============================================================
function SponsorSatisfactionRadar({ sponsors, seed }: { sponsors: SponsorDeal[]; seed: number }): React.JSX.Element {
  const cx = 150;
  const cy = 105;
  const r = 75;
  const axes = ['Brand Exposure', 'Performance', 'Compliance', 'Engagement', 'Renewal'];
  const axisCount = axes.length;
  const angles = axes.map((_, i) => (i / axisCount) * 360 - 90);

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  const avgValue = sponsors.reduce((s, sp) => s + sp.annualValue, 0) / (sponsors.length || 1);
  const satisfactionValues = [
    Math.min(100, Math.round((sponsors.length / 5) * 100 + seededRange(seed + 1, 10, 25))),
    Math.min(100, Math.round(seededRange(seed + 2, 40, 90) * (avgValue / 2000000))),
    Math.min(100, Math.round(seededRange(seed + 3, 60, 95))),
    Math.min(100, Math.round(seededRange(seed + 4, 30, 85))),
    Math.min(100, Math.round(sponsors.reduce((s, sp) => s + sp.yearsRemaining, 0) / (sponsors.length || 1) * 25)),
  ];

  const dataPoints = satisfactionValues.map((v, i) =>
    polarToCart(cx, cy, (v / 100) * r, angles[i])
  );
  const dataPolyStr = buildPolygonPoints(dataPoints);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Sponsor Satisfaction Index
      </h3>
      <svg viewBox="0 0 300 210" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={`sat-grid-${i}`} points={pts} fill="none"
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={`sat-axis-${i}`} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]}
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        <polygon
          points={dataPolyStr}
          fill={W3.neonLime}
          fillOpacity={0.15}
          stroke={W3.neonLime}
          strokeWidth={1.5}
        />
        {dataPoints.map((pt, i) => (
          <circle key={`sat-dot-${i}`} cx={pt[0]} cy={pt[1]} r={3}
            fill={W3.neonLime} />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 18, angles[i]);
          return (
            <text key={`sat-label-${i}`}
              x={labelPt[0]} y={labelPt[1]}
              textAnchor="middle" fill={W3.textMuted} fontSize="8"
              style={{ fontFamily: FONT_FAMILY }}>
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 4: NegotiationProgressGauge (Tab 2)
// Semi-circular gauge (0-100) showing negotiation progress
// ============================================================
function NegotiationProgressGauge({ progress }: { progress: number }): React.JSX.Element {
  const cx = 150;
  const cy = 140;
  const r = 90;
  const startAngle = 180;
  const endAngle = 360;
  const progressAngle = startAngle + (progress / 100) * (endAngle - startAngle);

  const arcPath = buildDonutArc(cx, cy, r, r - 16, startAngle, progressAngle);
  const bgPath = buildDonutArc(cx, cy, r, r - 16, startAngle, endAngle);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Negotiation Progress
      </h3>
      <svg viewBox="0 0 300 180" className="w-full">
        <path d={bgPath} fill={W3.border} fillOpacity={0.3} />
        <path d={arcPath} fill={W3.cyanBlue} fillOpacity={0.85} />
        <text x={cx} y={cy - 20} textAnchor="middle" fill={W3.cyanBlue} fontSize="28" fontWeight="bold"
          style={{ fontFamily: FONT_FAMILY }}>
          {progress}%
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" fill={W3.textMuted} fontSize="10"
          style={{ fontFamily: FONT_FAMILY }}>
          complete
        </text>
        {/* Scale labels */}
        <text x={cx - r - 8} y={cy + 8} textAnchor="end" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>0</text>
        <text x={cx + r + 8} y={cy + 8} textAnchor="start" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>100</text>
        <text x={cx} y={cy - r + 28} textAnchor="middle" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>50</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG 5: DealValueComparisonBars (Tab 2)
// 5 horizontal bars comparing current offer vs market rate
// ============================================================
function DealValueComparisonBars({ negotiations }: { negotiations: NegotiationDeal[] }): React.JSX.Element {
  const maxVal = negotiations.reduce((m, n) =>
    Math.max(m, n.annualValue, n.marketRate), 1
  );

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Offer vs Market Rate
      </h3>
      <svg viewBox="0 0 300 180" className="w-full">
        {negotiations.slice(0, 5).map((deal, i) => {
          const offerW = (deal.annualValue / maxVal) * 140;
          const marketW = (deal.marketRate / maxVal) * 140;
          const y = 6 + i * 34;

          return (
            <g key={`deal-compare-${i}`}>
              <text x={75} y={y + 10} textAnchor="end" fill={W3.textMuted} fontSize="8"
                style={{ fontFamily: FONT_FAMILY }}>
                {deal.brand}
              </text>
              {/* Market rate bar */}
              <rect x={80} y={y} width={marketW} height={10} rx={2}
                fill={W3.border} fillOpacity={0.5} />
              {/* Offer bar */}
              <rect x={80} y={y + 13} width={offerW} height={10} rx={2}
                fill={W3.neonLime} fillOpacity={0.85} />
              <text x={85 + offerW} y={y + 22} textAnchor="start" fill={W3.textPrimary} fontSize="7"
                style={{ fontFamily: FONT_FAMILY }}>
                {fmtCurrencyShort(deal.annualValue)}
              </text>
              <text x={85 + marketW} y={y + 9} textAnchor="start" fill={W3.mutedGray} fontSize="7"
                style={{ fontFamily: FONT_FAMILY }}>
                {fmtCurrencyShort(deal.marketRate)}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <rect x={80} y={178} width={8} height={6} rx={1} fill={W3.border} fillOpacity={0.5} />
        <text x={92} y={184} fill={W3.mutedGray} fontSize="7" style={{ fontFamily: FONT_FAMILY }}>Market</text>
        <rect x={130} y={178} width={8} height={6} rx={1} fill={W3.neonLime} fillOpacity={0.85} />
        <text x={142} y={184} fill={W3.neonLime} fontSize="7" style={{ fontFamily: FONT_FAMILY }}>Offer</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG 6: AgentNegotiationTimeline (Tab 2)
// 8-node horizontal timeline showing negotiation milestones
// ============================================================
function AgentNegotiationTimeline({ seed }: { seed: number }): React.JSX.Element {
  const milestones = [
    'Initial Contact', 'Scouting Report', 'First Meeting', 'Term Sheet',
    'Counter Offer', 'Legal Review', 'Final Terms', 'Signing',
  ];

  const completedUpTo = seededInt(seed + 777, 2, 7);
  const nodeSpacing = 36;
  const startX = 18;
  const lineY = 50;

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Negotiation Timeline
      </h3>
      <svg viewBox="0 0 300 120" className="w-full">
        {/* Base line */}
        <line x1={startX} y1={lineY} x2={startX + (milestones.length - 1) * nodeSpacing}
          y2={lineY} stroke={W3.border} strokeWidth={2} />
        {/* Completed line */}
        <line x1={startX} y1={lineY}
          x2={startX + completedUpTo * nodeSpacing}
          y2={lineY} stroke={W3.electricOrange} strokeWidth={2} />
        {/* Nodes */}
        {milestones.map((milestone, i) => {
          const x = startX + i * nodeSpacing;
          const isCompleted = i <= completedUpTo;
          const isCurrent = i === completedUpTo + 1;
          const nodeColor = isCompleted ? W3.electricOrange
            : isCurrent ? W3.neonLime : W3.border;

          return (
            <g key={`timeline-node-${i}`}>
              <circle cx={x} cy={lineY} r={isCurrent ? 6 : 4}
                fill={nodeColor} fillOpacity={isCompleted || isCurrent ? 1 : 0.4} />
              <text x={x} y={lineY + 18} textAnchor="middle"
                fill={isCompleted ? W3.textPrimary : W3.textMuted}
                fontSize="7" style={{ fontFamily: FONT_FAMILY }}>
                {milestone.length > 10 ? milestone.slice(0, 9) + '.' : milestone}
              </text>
              <text x={x} y={lineY - 12} textAnchor="middle"
                fill={isCompleted ? W3.electricOrange : W3.mutedGray}
                fontSize="7" style={{ fontFamily: FONT_FAMILY }}>
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 7: MarketValueTrendArea (Tab 3)
// 8-point area chart showing player market value trajectory
// ============================================================
function MarketValueTrendArea({ marketValue, seed, seasonsPlayed }: {
  marketValue: number; seed: number; seasonsPlayed: number;
}): React.JSX.Element {
  const padX = 35;
  const padTop = 20;
  const chartW = 280;
  const chartH = 130;

  const values = Array.from({ length: 8 }, (_, i) => {
    const factor = seededRange(seed + 800 + i, 0.15, 1.2);
    return Math.round(marketValue * factor);
  });

  const maxVal = Math.max(...values, 1);
  const xScale = (i: number) => padX + (i / (values.length - 1)) * (chartW - padX * 2);
  const yScale = (v: number) => padTop + chartH - (v / maxVal) * chartH;

  const linePoints = values.map((v, i) => [xScale(i), yScale(v)] as [number, number]);
  const pointsStr = buildPolylinePoints(linePoints);

  const areaPoints = [
    [xScale(0), padTop + chartH] as [number, number],
    ...linePoints,
    [xScale(values.length - 1), padTop + chartH] as [number, number],
  ];
  const areaStr = buildPolygonPoints(areaPoints);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Market Value Trend
      </h3>
      <svg viewBox="0 0 300 180" className="w-full">
        {/* Grid lines */}
        <line x1={padX} y1={padTop} x2={chartW} y2={padTop}
          stroke={W3.border} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH / 2} x2={chartW} y2={padTop + chartH / 2}
          stroke={W3.border} strokeWidth={0.3} strokeDasharray="4,4" />
        <line x1={padX} y1={padTop + chartH} x2={chartW} y2={padTop + chartH}
          stroke={W3.border} strokeWidth={0.5} />
        {/* Axis labels */}
        <text x={padX - 4} y={padTop + 4} textAnchor="end" fill={W3.mutedGray} fontSize="7"
          style={{ fontFamily: FONT_FAMILY }}>
          {fmtCurrencyShort(maxVal)}
        </text>
        <text x={padX - 4} y={padTop + chartH + 4} textAnchor="end" fill={W3.mutedGray} fontSize="7"
          style={{ fontFamily: FONT_FAMILY }}>0</text>
        {/* Area fill */}
        <polygon points={areaStr} fill={W3.electricOrange} fillOpacity={0.2} />
        {/* Line */}
        <polyline points={pointsStr} fill="none" stroke={W3.electricOrange}
          strokeWidth={2} strokeLinejoin="round" />
        {/* Data points */}
        {values.map((v, i) => (
          <g key={`mv-point-${i}`}>
            <circle cx={xScale(i)} cy={yScale(v)} r={3}
              fill={W3.electricOrange} />
            {i % 2 === 0 && (
              <text x={xScale(i)} y={yScale(v) - 8} textAnchor="middle"
                fill={W3.textPrimary} fontSize="7"
                style={{ fontFamily: FONT_FAMILY }}>
                {fmtCurrencyShort(v)}
              </text>
            )}
            <text x={xScale(i)} y={padTop + chartH + 14} textAnchor="middle"
              fill={W3.textMuted} fontSize="7"
              style={{ fontFamily: FONT_FAMILY }}>
              S{i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 8: BrandStrengthRadar (Tab 3)
// 5-axis radar — Social Media/Fan Base/International/Trophies/Media
// ============================================================
function BrandStrengthRadar({ reputation, trophies, seed }: {
  reputation: number; trophies: { name: string; season: number }[]; seed: number;
}): React.JSX.Element {
  const cx = 150;
  const cy = 105;
  const r = 75;
  const axes = ['Social Media', 'Fan Base', 'International', 'Trophy Cabinet', 'Media Presence'];
  const axisCount = axes.length;
  const angles = axes.map((_, i) => (i / axisCount) * 360 - 90);

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  const values = [
    Math.min(100, Math.round(reputation * 0.9 + seededRange(seed + 1, 5, 20))),
    Math.min(100, Math.round(reputation * 0.85 + seededRange(seed + 2, 5, 15))),
    Math.min(100, Math.round(reputation * 0.7 + seededRange(seed + 3, 10, 30))),
    Math.min(100, Math.round((trophies.length / 10) * 100 + seededRange(seed + 4, 5, 25))),
    Math.min(100, Math.round(reputation * 0.8 + seededRange(seed + 5, 5, 20))),
  ];

  const dataPoints = values.map((v, i) =>
    polarToCart(cx, cy, (v / 100) * r, angles[i])
  );
  const dataPolyStr = buildPolygonPoints(dataPoints);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Brand Strength Analysis
      </h3>
      <svg viewBox="0 0 300 210" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={`brand-grid-${i}`} points={pts} fill="none"
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={`brand-axis-${i}`} x1={cx} y1={cy}
            x2={pt[0]} y2={pt[1]}
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        <polygon
          points={dataPolyStr}
          fill={W3.cyanBlue}
          fillOpacity={0.15}
          stroke={W3.cyanBlue}
          strokeWidth={1.5}
        />
        {dataPoints.map((pt, i) => (
          <circle key={`brand-dot-${i}`} cx={pt[0]} cy={pt[1]} r={3}
            fill={W3.cyanBlue} />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 18, angles[i]);
          return (
            <text key={`brand-label-${i}`}
              x={labelPt[0]} y={labelPt[1]}
              textAnchor="middle" fill={W3.textMuted} fontSize="8"
              style={{ fontFamily: FONT_FAMILY }}>
              {label}
            </text>
          );
        })}
        {/* Score labels */}
        {values.map((v, i) => (
          <text key={`brand-score-${i}`}
            x={dataPoints[i][0]} y={dataPoints[i][1] - 8}
            textAnchor="middle" fill={W3.cyanBlue} fontSize="7"
            style={{ fontFamily: FONT_FAMILY }}>
            {v}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 9: ValueDriversDonut (Tab 3)
// 4-segment donut — Performance/Age/Marketability/Potential
// ============================================================
function ValueDriversDonut({ overall, age, potential, reputation }: {
  overall: number; age: number; potential: number; reputation: number;
}): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 48;

  const performanceScore = overall * 0.4;
  const ageScore = Math.max(0, (30 - age)) * 2;
  const marketScore = reputation * 0.3;
  const potentialScore = (potential - overall) * 0.5;

  const segments = [
    { label: 'Performance', count: Math.round(performanceScore * 100), color: W3.electricOrange },
    { label: 'Age', count: Math.round(ageScore * 100), color: W3.cyanBlue },
    { label: 'Marketability', count: Math.round(marketScore * 100), color: W3.neonLime },
    { label: 'Potential', count: Math.round(Math.max(0, potentialScore) * 100), color: W3.mutedGray },
  ];

  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;
  const arcs = computeDonutArcs(cx, cy, outerR, innerR, segments);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Value Drivers
      </h3>
      <svg viewBox="0 0 200 200" className="w-full" style={{ maxWidth: 180, margin: '0 auto', display: 'block' }}>
        {arcs.map((arc, i) => (
          <path key={`value-donut-${i}`} d={arc.path} fill={arc.color} fillOpacity={0.8} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={W3.textPrimary} fontSize="16" fontWeight="bold"
          style={{ fontFamily: FONT_FAMILY }}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>
          composite
        </text>
        {arcs.map((arc, i) => {
          const labelPos = polarToCart(cx, cy, outerR + 14, arc.midAngle);
          const anchor = arc.midAngle > 90 && arc.midAngle < 270 ? 'end' : 'start';
          return (
            <text key={`value-donut-label-${i}`}
              x={labelPos[0]} y={labelPos[1]}
              textAnchor={anchor} fill={W3.textMuted} fontSize="8"
              style={{ fontFamily: FONT_FAMILY }}>
              {arc.label} {arc.pct}%
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-3 mt-1">
        {arcs.map((arc, i) => (
          <div key={`value-donut-legend-${i}`} className="flex items-center gap-1">
            <div className="w-2 h-2" style={{ backgroundColor: arc.color }} />
            <span className="text-[9px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
              {arc.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SVG 10: TargetSponsorPriorityBars (Tab 4)
// 5 horizontal bars showing attractiveness to top 5 targets
// ============================================================
function TargetSponsorPriorityBars({ targets }: { targets: SponsorTarget[] }): React.JSX.Element {
  const maxAttr = targets.reduce((m, t) => Math.max(m, t.attractiveness), 1);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Target Sponsor Attractiveness
      </h3>
      <svg viewBox="0 0 300 160" className="w-full">
        {targets.map((target, i) => {
          const barWidth = (target.attractiveness / maxAttr) * 170;
          const y = 6 + i * 30;
          const color = i === 0 ? W3.cyanBlue
            : i === 1 ? W3.electricOrange
            : i === 2 ? W3.neonLime
            : W3.mutedGray;

          return (
            <g key={`target-bar-${i}`}>
              <text x={75} y={y + 12} textAnchor="end" fill={W3.textMuted} fontSize="9"
                style={{ fontFamily: FONT_FAMILY }}>
                {target.brand}
              </text>
              <rect x={80} y={y} width={barWidth} height={18} rx={2}
                fill={color} fillOpacity={0.85} />
              <text x={85 + barWidth} y={y + 13} textAnchor="start" fill={W3.textPrimary} fontSize="9"
                style={{ fontFamily: FONT_FAMILY }}>
                {target.attractiveness}%
              </text>
              <text x={85 + barWidth} y={y + 24} textAnchor="start" fill={W3.mutedGray} fontSize="7"
                style={{ fontFamily: FONT_FAMILY }}>
                {target.category}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 11: CategoryFitRadar (Tab 4)
// 5-axis radar — Sportswear/Tech/Food & Beverage/Automotive/Fashion
// ============================================================
function CategoryFitRadar({ sponsors, seed }: { sponsors: SponsorDeal[]; seed: number }): React.JSX.Element {
  const cx = 150;
  const cy = 105;
  const r = 75;
  const axes = ['Sportswear', 'Tech', 'Food & Bev', 'Automotive', 'Fashion'];
  const axisCount = axes.length;
  const angles = axes.map((_, i) => (i / axisCount) * 360 - 90);

  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridRings.map(ringR => {
    const pts = angles.map(a => polarToCart(cx, cy, r * ringR, a));
    return buildPolygonPoints(pts);
  });

  const axisEndpoints = angles.map(a => polarToCart(cx, cy, r, a));

  const existingCategories = sponsors.reduce<Record<string, number>>((acc, sp) => {
    const cat = sp.category === 'Sportswear' ? 'Sportswear'
      : sp.category === 'Tech' ? 'Tech'
      : sp.category === 'Beverage' || sp.category === 'Energy Drink' ? 'Food & Bev'
      : sp.category === 'Automotive' ? 'Automotive'
      : 'Fashion';
    acc[cat] = (acc[cat] ?? 0) + sp.annualValue;
    return acc;
  }, {});

  const totalRev = Object.values(existingCategories).reduce((s, v) => s + v, 0) || 1;

  const values = axes.map((axis, i) => {
    const match = axis === 'Food & Bev'
      ? existingCategories['Food & Bev'] ?? 0
      : existingCategories[axis] ?? 0;
    const baseFit = (match / totalRev) * 100;
    return Math.min(100, Math.round(baseFit + seededRange(seed + i * 11, 5, 30)));
  });

  const dataPoints = values.map((v, i) =>
    polarToCart(cx, cy, (v / 100) * r, angles[i])
  );
  const dataPolyStr = buildPolygonPoints(dataPoints);

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Category Fit Analysis
      </h3>
      <svg viewBox="0 0 300 210" className="w-full">
        {gridPaths.map((pts, i) => (
          <polygon key={`catfit-grid-${i}`} points={pts} fill="none"
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        {axisEndpoints.map((pt, i) => (
          <line key={`catfit-axis-${i}`} x1={cx} y1={cy}
            x2={pt[0]} y2={pt[1]}
            stroke={W3.border} strokeWidth={0.5} />
        ))}
        <polygon
          points={dataPolyStr}
          fill={W3.electricOrange}
          fillOpacity={0.15}
          stroke={W3.electricOrange}
          strokeWidth={1.5}
        />
        {dataPoints.map((pt, i) => (
          <circle key={`catfit-dot-${i}`} cx={pt[0]} cy={pt[1]} r={3}
            fill={W3.electricOrange} />
        ))}
        {axes.map((label, i) => {
          const labelPt = polarToCart(cx, cy, r + 18, angles[i]);
          return (
            <text key={`catfit-label-${i}`}
              x={labelPt[0]} y={labelPt[1]}
              textAnchor="middle" fill={W3.textMuted} fontSize="8"
              style={{ fontFamily: FONT_FAMILY }}>
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG 12: SponsorPipelineRing (Tab 4)
// Circular ring (0-100) showing overall pipeline health
// ============================================================
function SponsorPipelineRing({ sponsors, negotiations, targets }: {
  sponsors: SponsorDeal[];
  negotiations: NegotiationDeal[];
  targets: SponsorTarget[];
}): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const sponsorHealth = Math.min(100, sponsors.length * 20);
  const negotiationHealth = Math.round(
    negotiations.reduce((s, n) => s + n.progress, 0) / (negotiations.length || 1)
  );
  const targetHealth = Math.round(
    targets.reduce((s, t) => s + t.attractiveness, 0) / (targets.length || 1)
  );
  const overallScore = Math.min(100, Math.round(
    sponsorHealth * 0.4 + negotiationHealth * 0.3 + targetHealth * 0.3
  ));

  const progress = overallScore / 100;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const ringColor = overallScore >= 70 ? W3.neonLime
    : overallScore >= 40 ? W3.electricOrange : '#888888';

  const statusLabel = overallScore >= 70 ? 'Strong'
    : overallScore >= 40 ? 'Developing' : 'Needs Work';

  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3">
      <h3 className="text-xs font-bold mb-2 text-center" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
        Pipeline Health
      </h3>
      <svg viewBox="0 0 200 200" className="w-full" style={{ maxWidth: 180, margin: '0 auto', display: 'block' }}>
        {/* Background ring arc */}
        <path d={buildArcPath(cx, cy, r, -90, 270)} fill="none"
          stroke={W3.border} strokeWidth={8} />
        {/* Progress ring arc — starts from 12 o'clock, no transform needed */}
        {overallScore > 0 && (
          <path
            d={buildArcPath(cx, cy, r, -90, -90 + (overallScore / 100) * 360)}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={ringColor} fontSize="28" fontWeight="bold"
          style={{ fontFamily: FONT_FAMILY }}>
          {overallScore}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={W3.textMuted} fontSize="9"
          style={{ fontFamily: FONT_FAMILY }}>
          out of 100
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill={ringColor} fontSize="10" fontWeight="bold"
          style={{ fontFamily: FONT_FAMILY }}>
          {statusLabel}
        </text>
      </svg>
      {/* Breakdown */}
      <div className="flex justify-center gap-4 mt-2">
        <div className="text-center">
          <p className="text-[10px] font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
            {sponsorHealth}
          </p>
          <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
            Active ({sponsors.length})
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold" style={{ color: W3.electricOrange, fontFamily: FONT_FAMILY }}>
            {negotiationHealth}
          </p>
          <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
            Deals ({negotiations.length})
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold" style={{ color: W3.neonLime, fontFamily: FONT_FAMILY }}>
            {targetHealth}
          </p>
          <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
            Targets ({targets.length})
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Summary stat card component
// ============================================================
function StatCard({ label, value, subtext, color }: {
  label: string; value: string; subtext: string; color: string;
}): React.JSX.Element {
  return (
    <div style={{ backgroundColor: W3.bgCard, border: `1px solid ${W3.border}` }}
      className="p-3 flex-1 min-w-0">
      <p className="text-[9px] mb-1" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color, fontFamily: FONT_FAMILY }}>
        {value}
      </p>
      <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>
        {subtext}
      </p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SponsorSystemEnhanced(): React.JSX.Element | null {
  const gameState = useGameStore(state => state.gameState);
  const acceptSponsorOffer = useGameStore(state => state.acceptSponsorOffer);
  const rejectSponsorOffer = useGameStore(state => state.rejectSponsorOffer);
  const renewSponsorContract = useGameStore(state => state.renewSponsorContract);
  const terminateSponsorContract = useGameStore(state => state.terminateSponsorContract);
  const updateSponsorDeliverables = useGameStore(state => state.updateSponsorDeliverables);
  const trackSponsorBonuses = useGameStore(state => state.trackSponsorBonuses);
  const generateSponsorOffers = useGameStore(state => state.generateSponsorOffers);
  
  const [activeTab, setActiveTab] = useState<TabId>('current_sponsors');

  if (!gameState) return null;

  const player = gameState.player;
  const clubName = gameState.currentClub?.name ?? 'Unknown Club';
  const currentSeason = gameState.currentSeason ?? 1;
  const currentWeek = gameState.currentWeek ?? 1;
  const seasonsPlayed = gameState.seasons.length ?? 0;

  // Use real game state data
  const activeSponsors = gameState.activeSponsors || [];
  const sponsorOffers = gameState.sponsorOffers || [];
  const sponsorshipRevenue = gameState.sponsorshipRevenue || 0;

  // Derive seed deterministically for mock data fallback
  const baseSeed = player.name.length * 137 + currentSeason * 31 + currentWeek * 7;

  // Generate mock data only if no real data exists
  const mockActiveSponsors = activeSponsors.length > 0 ? activeSponsors : generateActiveSponsors(baseSeed, player.reputation ?? 10);
  const mockNegotiations = sponsorOffers.length > 0 ? sponsorOffers.map(offer => ({
    id: offer.id,
    company: offer.company.name,
    tier: offer.company.tier.charAt(0).toUpperCase() + offer.company.tier.slice(1),
    type: offer.type,
    value: offer.weeklyPayment * offer.duration,
    progress: 50,
    status: 'negotiating' as const,
  })) : generateNegotiations(baseSeed + 100, player.reputation ?? 10);
  const sponsorTargets = generateSponsorTargets(baseSeed + 200, player.reputation ?? 10);

  // Derived stats via reduce
  const totalAnnualIncome = mockActiveSponsors.reduce((sum: number, s: any) => sum + (s.annualValue || s.weeklyPayment * 52 || 0), 0);
  const totalContractValue = mockActiveSponsors.reduce((sum: number, s: any) => sum + (s.totalValue || s.weeklyPayment * (s.endWeek - s.startWeek) || 0), 0);
  const avgNegotiationProgress = Math.round(
    mockNegotiations.reduce((sum: number, n: any) => sum + (n.progress || 50), 0) / (mockNegotiations.length || 1)
  );
  const avgTargetAttractiveness = Math.round(
    sponsorTargets.reduce((sum: number, t: any) => sum + t.attractiveness, 0) / (sponsorTargets.length || 1)
  );
  const sponsorTierSummary = mockActiveSponsors.reduce<Record<string, number>>((acc, s: any) => {
    const tier = s.tier || 'Bronze';
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});
  const topTier = sponsorTierSummary['Platinum'] ? 'Platinum'
    : sponsorTierSummary['Gold'] ? 'Gold'
    : sponsorTierSummary['Silver'] ? 'Silver' : 'Bronze';
  const trophies = player.careerStats.trophies ?? [];

  const handleAcceptOffer = (offerId: string) => {
    acceptSponsorOffer(offerId);
  };

  const handleRejectOffer = (offerId: string) => {
    rejectSponsorOffer(offerId);
  };

  const handleRenewContract = (contractId: string) => {
    renewSponsorContract(contractId);
  };

  const handleTerminateContract = (contractId: string) => {
    terminateSponsorContract(contractId);
  };

  const handleUpdateDeliverable = (contractId: string, deliverable: 'socialMediaPosts' | 'publicAppearances' | 'interviews') => {
    updateSponsorDeliverables(contractId, deliverable);
  };

  const handleGenerateOffers = () => {
    generateSponsorOffers();
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20"
      style={{ backgroundColor: W3.bgDark, fontFamily: FONT_FAMILY }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center"
            style={{
              backgroundColor: `${W3.electricOrange}22`,
              border: `1px solid ${W3.electricOrange}44`,
            }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke={W3.electricOrange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
              Sponsor Hub
            </h1>
            <p className="text-[10px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
              {clubName} &middot; Season {currentSeason} &middot; Week {currentWeek}
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 h-7 flex items-center gap-1"
          style={{
            backgroundColor: `${W3.neonLime}15`,
            border: `1px solid ${W3.neonLime}33`,
            color: W3.neonLime,
            fontFamily: FONT_FAMILY,
          }}>
          <span className="text-[9px] font-bold">{topTier}</span>
        </div>
      </div>

      {/* ── STATS DASHBOARD ── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Annual Income"
          value={fmtCurrencyShort(totalAnnualIncome)}
          subtext={`${mockActiveSponsors.length} active deals`}
          color={W3.cyanBlue}
        />
        <StatCard
          label="Total Value"
          value={fmtCurrencyShort(totalContractValue)}
          subtext="all contracts"
          color={W3.electricOrange}
        />
        <StatCard
          label="Reputation"
          value={`${player.reputation ?? 0}`}
          subtext="sponsor rating"
          color={W3.neonLime}
        />
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 p-1" style={{
        backgroundColor: W3.oledBlack,
        border: `1px solid ${W3.border}`,
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2 px-2 text-[10px] font-medium"
            style={{
              fontFamily: FONT_FAMILY,
              backgroundColor: activeTab === t.id ? W3.bgCard : 'transparent',
              color: activeTab === t.id ? W3.electricOrange : W3.textMuted,
              border: activeTab === t.id ? `1px solid ${W3.electricOrange}33` : '1px solid transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB 1: CURRENT SPONSORS
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'current_sponsors' && (
        <div className="space-y-3">
          {/* Portfolio Summary Strip */}
          <div className="grid grid-cols-4 gap-2">
            {activeSponsors.reduce<Array<{ label: string; value: string; color: string }>>((acc, sp, i) => {
              if (i < 4) {
                acc.push({
                  label: sp.brand,
                  value: fmtCurrencyShort(sp.annualValue) + '/yr',
                  color: sp.color,
                });
              }
              return acc;
            }, []).map((item, i) => (
              <div key={`portfolio-strip-${i}`} className="p-2 text-center"
                style={{
                  backgroundColor: W3.bgCard,
                  border: `1px solid ${W3.border}`,
                }}>
                <p className="text-[10px] font-bold" style={{
                  color: item.color,
                  fontFamily: FONT_FAMILY,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.label}
                </p>
                <p className="text-[8px]" style={{
                  color: W3.textMuted,
                  fontFamily: FONT_FAMILY,
                }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Active Sponsor List */}
          {activeSponsors.length === 0 ? (
            <div className="p-8 text-center" style={{
              backgroundColor: W3.bgCard,
              border: `1px solid ${W3.border}`,
            }}>
              <svg className="w-10 h-10 mx-auto mb-3" viewBox="0 0 24 24" fill="none"
                stroke={W3.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="text-xs" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                No Active Sponsorships
              </p>
              <p className="text-[10px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>
                Build reputation to attract sponsors
              </p>
            </div>
          ) : (
            activeSponsors.map((sponsor, index) => {
              const progressPct = ((sponsor.contractYears - sponsor.yearsRemaining) / sponsor.contractYears) * 100;
              return (
                <div key={sponsor.id} style={{
                  backgroundColor: W3.bgCard,
                  border: `1px solid ${W3.border}`,
                }} className="p-3">
                  {/* Top row */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center"
                      style={{
                        backgroundColor: `${sponsor.color}22`,
                        border: `1px solid ${sponsor.color}44`,
                      }}>
                      <span className="text-xs font-bold" style={{ color: sponsor.color }}>
                        {sponsor.brand[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
                          {sponsor.brand}
                        </h3>
                        <span className="text-[8px] font-bold px-2 py-0.5"
                          style={{
                            backgroundColor: `${sponsor.color}22`,
                            color: sponsor.color,
                            border: `1px solid ${sponsor.color}33`,
                          }}>
                          {sponsor.tier}
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                        {sponsor.category} &middot; {sponsor.contractYears}-yr deal
                      </p>
                    </div>
                  </div>

                  {/* Duration bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>
                        Contract Progress
                      </span>
                      <span className="text-[9px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                        {sponsor.yearsRemaining}yr remaining
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden" style={{ backgroundColor: W3.border }}>
                      <div className="h-full" style={{
                        width: `${progressPct}%`,
                        backgroundColor: sponsor.color,
                      }} />
                    </div>
                  </div>

                  {/* Value row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2" style={{
                      backgroundColor: W3.bgDark,
                      border: `1px solid ${W3.border}`,
                    }}>
                      <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>
                        Annual
                      </p>
                      <p className="text-xs font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
                        {fmtCurrencyShort(sponsor.annualValue)}
                      </p>
                    </div>
                    <div className="p-2" style={{
                      backgroundColor: W3.bgDark,
                      border: `1px solid ${W3.border}`,
                    }}>
                      <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>
                        Total
                      </p>
                      <p className="text-xs font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
                        {fmtCurrencyShort(sponsor.totalValue)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* SVG 1: SponsorRevenueDonut */}
          <SponsorRevenueDonut sponsors={activeSponsors} />

          {/* SVG 2: ContractDurationBars */}
          <ContractDurationBars sponsors={activeSponsors} />

          {/* SVG 3: SponsorSatisfactionRadar */}
          <SponsorSatisfactionRadar sponsors={activeSponsors} seed={baseSeed} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 2: NEGOTIATIONS
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'negotiations' && (
        <div className="space-y-3">
          {/* Negotiation Insights Banner */}
          <div className="p-3" style={{
            backgroundColor: W3.bgCard,
            border: `1px solid ${W3.electricOrange}33`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke={W3.electricOrange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h3 className="text-xs font-bold" style={{ color: W3.electricOrange, fontFamily: FONT_FAMILY }}>
                Negotiation Insights
              </h3>
            </div>
            <p className="text-[10px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
              You have {negotiations.length} active negotiations with an average
              progress of {avgNegotiationProgress}%. Focus on closing deals
              with the highest market rate potential.
            </p>
          </div>

          {/* Negotiations summary */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Active Deals"
              value={`${negotiations.length}`}
              subtext="in progress"
              color={W3.electricOrange}
            />
            <StatCard
              label="Avg Progress"
              value={`${avgNegotiationProgress}%`}
              subtext="across all deals"
              color={W3.cyanBlue}
            />
          </div>

          {/* Negotiation cards */}
          {negotiations.map((nego) => (
            <div key={nego.id} style={{
              backgroundColor: W3.bgCard,
              border: `1px solid ${W3.border}`,
            }} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center"
                    style={{
                      backgroundColor: `${nego.color}22`,
                      border: `1px solid ${nego.color}33`,
                    }}>
                    <span className="text-[10px] font-bold" style={{ color: nego.color }}>
                      {nego.brand[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
                      {nego.brand}
                    </h3>
                    <p className="text-[9px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                      {nego.category}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
                  {nego.progress}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 overflow-hidden mb-2" style={{ backgroundColor: W3.border }}>
                <div className="h-full" style={{
                  width: `${nego.progress}%`,
                  backgroundColor: nego.color,
                }} />
              </div>
              <div className="flex justify-between text-[9px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                <span>Offer: {fmtCurrencyShort(nego.annualValue)}/yr</span>
                <span>Market: {fmtCurrencyShort(nego.marketRate)}/yr</span>
              </div>
            </div>
          ))}

          {/* SVG 4: NegotiationProgressGauge */}
          <NegotiationProgressGauge progress={avgNegotiationProgress} />

          {/* SVG 5: DealValueComparisonBars */}
          <DealValueComparisonBars negotiations={negotiations} />

          {/* SVG 6: AgentNegotiationTimeline */}
          <AgentNegotiationTimeline seed={baseSeed} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 3: MARKET VALUE
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'market_value' && (
        <div className="space-y-3">
          {/* Market Position Card */}
          <div className="p-3" style={{
            backgroundColor: W3.bgCard,
            border: `1px solid ${W3.border}`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke={W3.cyanBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <h3 className="text-xs font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
                Market Position
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: W3.electricOrange, fontFamily: FONT_FAMILY }}>
                  {fmtCurrencyShort(player.marketValue ?? 0)}
                </p>
                <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                  Current Value
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: W3.neonLime, fontFamily: FONT_FAMILY }}>
                  +{Math.round(seededRange(baseSeed + 600, 3, 28))}%
                </p>
                <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                  YoY Growth
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
                  S{currentSeason}
                </p>
                <p className="text-[8px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                  Peak Season
                </p>
              </div>
            </div>
          </div>

          {/* Market value summary */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Market Value"
              value={fmtCurrencyShort(player.marketValue ?? 0)}
              subtext="current estimate"
              color={W3.electricOrange}
            />
            <StatCard
              label="Overall"
              value={`${player.overall ?? 0}`}
              subtext={`potential ${player.potential ?? 0}`}
              color={W3.cyanBlue}
            />
            <StatCard
              label="Age"
              value={`${player.age ?? 0}`}
              subtext={`${player.nationality ?? ''}`}
              color={W3.neonLime}
            />
          </div>

          {/* Player value breakdown card */}
          <div style={{
            backgroundColor: W3.bgCard,
            border: `1px solid ${W3.border}`,
          }} className="p-3">
            <h3 className="text-xs font-bold mb-2" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
              Value Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2" style={{ backgroundColor: W3.bgDark, border: `1px solid ${W3.border}` }}>
                <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>Performance Score</p>
                <p className="text-sm font-bold" style={{ color: W3.electricOrange, fontFamily: FONT_FAMILY }}>
                  {player.overall ?? 0} OVR
                </p>
              </div>
              <div className="p-2" style={{ backgroundColor: W3.bgDark, border: `1px solid ${W3.border}` }}>
                <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>Reputation</p>
                <p className="text-sm font-bold" style={{ color: W3.cyanBlue, fontFamily: FONT_FAMILY }}>
                  {player.reputation ?? 0}/100
                </p>
              </div>
              <div className="p-2" style={{ backgroundColor: W3.bgDark, border: `1px solid ${W3.border}` }}>
                <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>Career Goals</p>
                <p className="text-sm font-bold" style={{ color: W3.neonLime, fontFamily: FONT_FAMILY }}>
                  {player.careerStats.totalGoals ?? 0}
                </p>
              </div>
              <div className="p-2" style={{ backgroundColor: W3.bgDark, border: `1px solid ${W3.border}` }}>
                <p className="text-[8px]" style={{ color: W3.mutedGray, fontFamily: FONT_FAMILY }}>Trophies</p>
                <p className="text-sm font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
                  {trophies.length}
                </p>
              </div>
            </div>
          </div>

          {/* SVG 7: MarketValueTrendArea */}
          <MarketValueTrendArea
            marketValue={player.marketValue ?? 0}
            seed={baseSeed}
            seasonsPlayed={seasonsPlayed}
          />

          {/* SVG 8: BrandStrengthRadar */}
          <BrandStrengthRadar
            reputation={player.reputation ?? 0}
            trophies={trophies}
            seed={baseSeed}
          />

          {/* SVG 9: ValueDriversDonut */}
          <ValueDriversDonut
            overall={player.overall ?? 0}
            age={player.age ?? 20}
            potential={player.potential ?? 50}
            reputation={player.reputation ?? 0}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 4: SPONSOR TARGETS
          ════════════════════════════════════════════════════════ */}
      {activeTab === 'sponsor_targets' && (
        <div className="space-y-3">
          {/* Outreach Strategy Banner */}
          <div className="p-3" style={{
            backgroundColor: W3.bgCard,
            border: `1px solid ${W3.neonLime}33`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                stroke={W3.neonLime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <h3 className="text-xs font-bold" style={{ color: W3.neonLime, fontFamily: FONT_FAMILY }}>
                Outreach Strategy
              </h3>
            </div>
            <p className="text-[10px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
              {sponsorTargets.length} target brands identified with an average
              attractiveness score of {avgTargetAttractiveness}%. Prioritize
              Sportswear and Tech categories for maximum revenue potential.
            </p>
          </div>

          {/* Targets summary */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Target Brands"
              value={`${sponsorTargets.length}`}
              subtext="identified"
              color={W3.cyanBlue}
            />
            <StatCard
              label="Avg Fit Score"
              value={`${avgTargetAttractiveness}%`}
              subtext="attractiveness"
              color={W3.neonLime}
            />
          </div>

          {/* Target cards */}
          {sponsorTargets.map((target) => (
            <div key={target.id} style={{
              backgroundColor: W3.bgCard,
              border: `1px solid ${W3.border}`,
            }} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center"
                    style={{
                      backgroundColor: `${target.color}22`,
                      border: `1px solid ${target.color}33`,
                    }}>
                    <span className="text-[10px] font-bold" style={{ color: target.color }}>
                      {target.brand[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: W3.textPrimary, fontFamily: FONT_FAMILY }}>
                      {target.brand}
                    </h3>
                    <p className="text-[9px]" style={{ color: W3.textMuted, fontFamily: FONT_FAMILY }}>
                      {target.category}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: target.color, fontFamily: FONT_FAMILY }}>
                  {target.attractiveness}%
                </span>
              </div>
              {/* Attractiveness bar */}
              <div className="h-2 overflow-hidden" style={{ backgroundColor: W3.border }}>
                <div className="h-full" style={{
                  width: `${target.attractiveness}%`,
                  backgroundColor: target.color,
                }} />
              </div>
            </div>
          ))}

          {/* SVG 10: TargetSponsorPriorityBars */}
          <TargetSponsorPriorityBars targets={sponsorTargets} />

          {/* SVG 11: CategoryFitRadar */}
          <CategoryFitRadar sponsors={activeSponsors} seed={baseSeed} />

          {/* SVG 12: SponsorPipelineRing */}
          <SponsorPipelineRing
            sponsors={activeSponsors}
            negotiations={negotiations}
            targets={sponsorTargets}
          />
        </div>
      )}
    </div>
  );
}
