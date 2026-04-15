'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Radio,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Star,
  Target,
  DollarSign,
  Zap,
  Shield,
  Users,
  Eye,
  BarChart3,
  Activity,
  GitCompare,
  Crosshair,
  Timer,
  Trophy,
} from 'lucide-react';

// ============================================================
// Design Tokens
// ============================================================
const COLORS = {
  primary: '#FF5500',
  accent: '#CCFF00',
  cyan: '#00E5FF',
  muted: '#666666',
  bg: '#0d1117',
  card: '#161b22',
  text: '#c9d1d9',
  secondary: '#8b949e',
  border: '#30363d',
} as const;

// ============================================================
// Seeded Random Utilities
// ============================================================
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================
// SVG Helper 1: HourlyActivityBars
// ============================================================
function HourlyActivityBars({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const hours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  const barColors = [COLORS.primary, COLORS.accent, COLORS.cyan, COLORS.muted, COLORS.primary, COLORS.accent];
  const values = hours.map(() => 20 + rand() * 80);
  const maxVal = Math.max(...values);

  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`grid-${i}`} x1="40" y1={20 + i * 30} x2="270" y2={20 + i * 30}
          stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {/* Y-axis labels */}
      {[0, 1, 2, 3, 4].map((i) => (
        <text key={`ylabel-${i}`} x="35" y={24 + i * 30} fill={COLORS.secondary}
          fontSize="8" textAnchor="end">{Math.round(maxVal - i * (maxVal / 4))}</text>
      ))}
      {/* Bars */}
      {values.map((val, i) => {
        const barHeight = (val / maxVal) * 120;
        const x = 48 + i * 38;
        const y = 140 - barHeight;
        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={y} width="24" height={barHeight} fill={barColors[i]} opacity="0.85" rx="2" />
            <text x={x + 12} y={y - 4} fill={COLORS.text} fontSize="7" textAnchor="middle">
              {Math.round(val)}
            </text>
            <text x={x + 12} y={154} fill={COLORS.secondary} fontSize="7" textAnchor="middle">
              {hours[i]}
            </text>
          </g>
        );
      })}
      <text x="140" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Hourly Transfer Activity
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 2: TransferTypeDonut
// ============================================================
function TransferTypeDonut({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const types = [
    { label: 'Loan', color: COLORS.accent },
    { label: 'Permanent', color: COLORS.primary },
    { label: 'Swap', color: COLORS.cyan },
    { label: 'Free', color: COLORS.muted },
  ];
  const rawValues = types.map(() => 5 + rand() * 40);
  const total = rawValues.reduce((a, b) => a + b, 0);

  // Build arc paths
  const cx = 100;
  const cy = 80;
  const outerR = 60;
  const innerR = 35;
  const segments = rawValues.reduce<{ startAngle: number; endAngle: number; color: string; label: string; pct: string }[]>((acc, val, i) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
    const sweep = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    acc.push({
      startAngle,
      endAngle,
      color: types[i].color,
      label: types[i].label,
      pct: Math.round((val / total) * 100) + '%',
    });
    return acc;
  }, []);

  const describeArc = (startA: number, endA: number, oR: number, iR: number) => {
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    const ox1 = cx + oR * Math.cos(startA);
    const oy1 = cy + oR * Math.sin(startA);
    const ox2 = cx + oR * Math.cos(endA);
    const oy2 = cy + oR * Math.sin(endA);
    const ix1 = cx + iR * Math.cos(endA);
    const iy1 = cy + iR * Math.sin(endA);
    const ix2 = cx + iR * Math.cos(startA);
    const iy2 = cy + iR * Math.sin(startA);
    return `M ${ox1} ${oy1} A ${oR} ${oR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${iR} ${iR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  };

  return (
    <svg viewBox="0 0 200 160" className="w-full h-auto">
      {segments.map((seg, i) => (
        <path key={`seg-${i}`} d={describeArc(seg.startAngle, seg.endAngle, outerR, innerR)}
          fill={seg.color} opacity="0.8" />
      ))}
      <text x={cx} y={cy - 4} fill={COLORS.text} fontSize="12" textAnchor="middle" fontWeight="bold">
        {Math.round(total)}
      </text>
      <text x={cx} y={cy + 10} fill={COLORS.secondary} fontSize="8" textAnchor="middle">
        Total Deals
      </text>
      {/* Legend */}
      {segments.map((seg, i) => (
        <g key={`legend-${i}`}>
          <rect x="140" y={16 + i * 20} width="8" height="8" fill={seg.color} rx="1" />
          <text x="152" y={23 + i * 20} fill={COLORS.secondary} fontSize="8">{seg.label}</text>
          <text x="190" y={23 + i * 20} fill={COLORS.text} fontSize="8" textAnchor="end">{seg.pct}</text>
        </g>
      ))}
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Transfer Types
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 3: ClubSpendingRadar
// ============================================================
function ClubSpendingRadar({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const axes = ['Defense', 'Midfield', 'Attack', 'Youth', 'Sales'];
  const values = axes.map(() => 0.2 + rand() * 0.8);
  const cx = 100;
  const cy = 95;
  const maxR = 65;
  const count = axes.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + maxR * value * Math.cos(angle),
      y: cy + maxR * value * Math.sin(angle),
    };
  };

  const polygonPoints = values.map((v, i) => {
    const p = getPoint(i, v);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 200 170" className="w-full h-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={`ring-${ring}`}
          points={Array.from({ length: count }, (_, i) => {
            const p = getPoint(i, ring);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none" stroke={COLORS.border} strokeWidth="0.5" />
      ))}
      {/* Axis lines and labels */}
      {axes.map((label, i) => {
        const p = getPoint(i, 1);
        return (
          <g key={`axis-${i}`}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={p.x + (p.x - cx) * 0.2} y={p.y + (p.y - cy) * 0.2}
              fill={COLORS.secondary} fontSize="7" textAnchor="middle">{label}</text>
          </g>
        );
      })}
      {/* Data polygon */}
      <polygon points={polygonPoints} fill={COLORS.cyan} fillOpacity="0.2"
        stroke={COLORS.cyan} strokeWidth="1.5" />
      {/* Data points */}
      {values.map((v, i) => {
        const p = getPoint(i, v);
        return <circle key={`pt-${i}`} cx={p.x} cy={p.y} r="3" fill={COLORS.cyan} />;
      })}
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Club Spending Radar
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 4: TargetPriorityBars
// ============================================================
function TargetPriorityBars({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const positions = ['CB', 'CM', 'ST', 'LW', 'GK'];
  const barColors = [COLORS.primary, COLORS.accent, COLORS.cyan, COLORS.muted, COLORS.primary];
  const needs = positions.map(() => 30 + rand() * 70);
  const maxNeed = 100;

  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto">
      {/* Threshold line */}
      <line x1="40" y1="30" x2="265" y2="30" stroke={COLORS.muted} strokeWidth="0.5" strokeDasharray="4,4" />
      <text x="268" y="33" fill={COLORS.muted} fontSize="7">High</text>
      {/* Bars */}
      {positions.map((pos, i) => {
        const barWidth = (needs[i] / maxNeed) * 210;
        const y = 28 + i * 24;
        return (
          <g key={`tbar-${i}`}>
            <text x="35" y={y + 12} fill={COLORS.secondary} fontSize="8" textAnchor="end">{pos}</text>
            <rect x="40" y={y + 2} width={barWidth} height="16" fill={barColors[i]} opacity="0.8" rx="2" />
            <text x={45 + barWidth} y={y + 14} fill={COLORS.text} fontSize="7">
              {Math.round(needs[i])}%
            </text>
          </g>
        );
      })}
      <text x="140" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Target Priority by Position
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 5: NegotiationProgressGauge
// ============================================================
function NegotiationProgressGauge({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const progress = 15 + rand() * 80;
  const cx = 100;
  const cy = 95;
  const r = 60;

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const progressAngle = startAngle + (progress / 100) * Math.PI;

  const arcPath = (sA: number, eA: number) => {
    const x1 = cx + r * Math.cos(sA);
    const y1 = cy + r * Math.sin(sA);
    const x2 = cx + r * Math.cos(eA);
    const y2 = cy + r * Math.sin(eA);
    const largeArc = eA - sA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      {/* Background arc */}
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round" />
      {/* Progress arc */}
      <path d={arcPath(startAngle, progressAngle)} fill="none" stroke={COLORS.accent} strokeWidth="10" strokeLinecap="round" opacity="0.85" />
      {/* Center text */}
      <text x={cx} y={cy - 5} fill={COLORS.accent} fontSize="22" textAnchor="middle" fontWeight="bold">
        {Math.round(progress)}%
      </text>
      <text x={cx} y={cy + 12} fill={COLORS.secondary} fontSize="9" textAnchor="middle">
        Negotiation Progress
      </text>
      {/* Scale labels */}
      <text x="35" y={cy + 5} fill={COLORS.muted} fontSize="7" textAnchor="middle">0</text>
      <text x={cx} y="30" fill={COLORS.muted} fontSize="7" textAnchor="middle">50</text>
      <text x="165" y={cy + 5} fill={COLORS.muted} fontSize="7" textAnchor="middle">100</text>
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Deal Progress
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 6: BudgetAllocationDonut
// ============================================================
function BudgetAllocationDonut({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const categories = [
    { label: 'Transfers', color: COLORS.primary },
    { label: 'Wages', color: COLORS.accent },
    { label: 'Agent', color: COLORS.cyan },
    { label: 'Contingency', color: COLORS.muted },
  ];
  const rawValues = categories.map(() => 10 + rand() * 60);
  const total = rawValues.reduce((a, b) => a + b, 0);

  const cx = 80;
  const cy = 85;
  const outerR = 55;
  const innerR = 30;

  const segments = rawValues.reduce<{ startAngle: number; endAngle: number; color: string; label: string; pct: string }[]>((acc, val, i) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
    const sweep = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    acc.push({ startAngle, endAngle, color: categories[i].color, label: categories[i].label, pct: Math.round((val / total) * 100) + '%' });
    return acc;
  }, []);

  const describeArc = (startA: number, endA: number, oR: number, iR: number) => {
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    const ox1 = cx + oR * Math.cos(startA);
    const oy1 = cy + oR * Math.sin(startA);
    const ox2 = cx + oR * Math.cos(endA);
    const oy2 = cy + oR * Math.sin(endA);
    const ix1 = cx + iR * Math.cos(endA);
    const iy1 = cy + iR * Math.sin(endA);
    const ix2 = cx + iR * Math.cos(startA);
    const iy2 = cy + iR * Math.sin(startA);
    return `M ${ox1} ${oy1} A ${oR} ${oR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${iR} ${iR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  };

  return (
    <svg viewBox="0 0 200 160" className="w-full h-auto">
      {segments.map((seg, i) => (
        <path key={`bseg-${i}`} d={describeArc(seg.startAngle, seg.endAngle, outerR, innerR)}
          fill={seg.color} opacity="0.8" />
      ))}
      <text x={cx} y={cy - 2} fill={COLORS.text} fontSize="11" textAnchor="middle" fontWeight="bold">
        €{Math.round(total)}M
      </text>
      <text x={cx} y={cy + 10} fill={COLORS.secondary} fontSize="7" textAnchor="middle">Budget</text>
      {/* Legend */}
      {segments.map((seg, i) => (
        <g key={`bleg-${i}`}>
          <rect x="135" y={20 + i * 22} width="8" height="8" fill={seg.color} rx="1" />
          <text x="147" y={27 + i * 22} fill={COLORS.secondary} fontSize="7">{seg.label}</text>
          <text x="195" y={27 + i * 22} fill={COLORS.text} fontSize="7" textAnchor="end">{seg.pct}</text>
        </g>
      ))}
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Budget Allocation
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 7: RivalActivityTimeline
// ============================================================
function RivalActivityTimeline({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const impactColors = [COLORS.primary, COLORS.accent, COLORS.cyan];
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    label: `${17 + i}:00`,
    impact: Math.floor(rand() * 3),
    deals: Math.floor(rand() * 5) + 1,
  }));

  return (
    <svg viewBox="0 0 300 120" className="w-full h-auto">
      {/* Horizontal line */}
      <line x1="20" y1="60" x2="280" y2="60" stroke={COLORS.border} strokeWidth="1" />
      {/* Nodes */}
      {nodes.map((node, i) => {
        const x = 30 + i * 32;
        const color = impactColors[node.impact];
        const offsetY = node.impact === 0 ? 0 : node.impact === 1 ? -15 : 15;
        return (
          <g key={`rnode-${i}`}>
            <circle cx={x} cy="60" r="5" fill={color} opacity="0.85" />
            <circle cx={x} cy="60" r="2.5" fill={COLORS.card} />
            <line x1={x} y1="60" x2={x} y2={60 + offsetY} stroke={color} strokeWidth="1" opacity="0.5" />
            <rect x={x - 12} y={60 + offsetY - 8} width="24" height="16" fill={COLORS.card}
              stroke={color} strokeWidth="0.5" rx="2" />
            <text x={x} y={60 + offsetY + 3} fill={color} fontSize="7" textAnchor="middle">{node.deals}</text>
            <text x={x} y="90" fill={COLORS.secondary} fontSize="6" textAnchor="middle">{node.label}</text>
          </g>
        );
      })}
      {/* Legend */}
      <circle cx="80" cy="108" r="3" fill={COLORS.primary} />
      <text x="86" y="111" fill={COLORS.secondary} fontSize="6">High</text>
      <circle cx="130" cy="108" r="3" fill={COLORS.accent} />
      <text x="136" y="111" fill={COLORS.secondary} fontSize="6">Medium</text>
      <circle cx="190" cy="108" r="3" fill={COLORS.cyan} />
      <text x="196" y="111" fill={COLORS.secondary} fontSize="6">Low</text>
      <text x="150" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Rival Activity Timeline
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 8: MarketValueTrendArea
// ============================================================
function MarketValueTrendArea({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const points = Array.from({ length: 8 }, () => 20 + rand() * 80);
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((v, i) => ({
    x: 30 + i * 33,
    y: 120 - ((v - minVal) / range) * 80 - 10,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} 120 L ${coords[0].x} 120 Z`;

  return (
    <svg viewBox="0 0 290 150" className="w-full h-auto">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`agrid-${i}`} x1="30" y1={20 + i * 25} x2="275" y2={20 + i * 25}
          stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={COLORS.cyan} fillOpacity="0.2" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={COLORS.cyan} strokeWidth="2" />
      {/* Points */}
      {coords.map((c, i) => (
        <g key={`apoint-${i}`}>
          <circle cx={c.x} cy={c.y} r="3" fill={COLORS.cyan} />
          <circle cx={c.x} cy={c.y} r="1.5" fill={COLORS.card} />
          <text x={c.x} y="135" fill={COLORS.secondary} fontSize="6" textAnchor="middle">
            W{i + 1}
          </text>
        </g>
      ))}
      <text x="150" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Market Value Trend
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 9: LeagueSpendingBars
// ============================================================
function LeagueSpendingBars({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const clubs = ['Man City', 'Arsenal', 'Chelsea', 'Liverpool', 'Man Utd'];
  const barColors = [COLORS.primary, COLORS.accent, COLORS.cyan, COLORS.muted, COLORS.accent];
  const spending = clubs.map(() => 40 + rand() * 160);
  const maxSpend = Math.max(...spending);

  return (
    <svg viewBox="0 0 280 160" className="w-full h-auto">
      {/* Bars */}
      {clubs.map((club, i) => {
        const barWidth = (spending[i] / maxSpend) * 160;
        const y = 20 + i * 26;
        return (
          <g key={`lbar-${i}`}>
            <text x="75" y={y + 12} fill={COLORS.secondary} fontSize="7" textAnchor="end">{club}</text>
            <rect x="80" y={y + 2} width={barWidth} height="16" fill={barColors[i]} opacity="0.8" rx="2" />
            <text x={85 + barWidth} y={y + 14} fill={COLORS.text} fontSize="7">
              €{Math.round(spending[i])}M
            </text>
          </g>
        );
      })}
      <text x="140" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        League Spending
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 10: DeadlinePressureGauge
// ============================================================
function DeadlinePressureGauge({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const pressure = 40 + rand() * 55;
  const cx = 100;
  const cy = 95;
  const r = 60;

  const startAngle = Math.PI;
  const progressAngle = startAngle + (pressure / 100) * Math.PI;

  const arcPath = (sA: number, eA: number) => {
    const x1 = cx + r * Math.cos(sA);
    const y1 = cy + r * Math.sin(sA);
    const x2 = cx + r * Math.cos(eA);
    const y2 = cy + r * Math.sin(eA);
    const largeArc = eA - sA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + (pressure / 100) * Math.PI;
  const needleX = cx + (r - 12) * Math.cos(needleAngle);
  const needleY = cy + (r - 12) * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      {/* Background arc */}
      <path d={arcPath(startAngle, 2 * Math.PI)} fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round" />
      {/* Pressure arc */}
      <path d={arcPath(startAngle, progressAngle)} fill="none" stroke={COLORS.primary} strokeWidth="10" strokeLinecap="round" opacity="0.85" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={COLORS.text} strokeWidth="2" />
      <circle cx={cx} cy={cy} r="5" fill={COLORS.card} stroke={COLORS.text} strokeWidth="1.5" />
      {/* Labels */}
      <text x={cx} y={cy - 10} fill={COLORS.primary} fontSize="18" textAnchor="middle" fontWeight="bold">
        {Math.round(pressure)}%
      </text>
      <text x={cx} y={cy + 8} fill={COLORS.secondary} fontSize="8" textAnchor="middle">
        Deadline Pressure
      </text>
      <text x="30" y={cy + 5} fill={COLORS.accent} fontSize="7" textAnchor="middle">Low</text>
      <text x={cx} y="30" fill={COLORS.primary} fontSize="7" textAnchor="middle">High</text>
      <text x="170" y={cy + 5} fill={COLORS.primary} fontSize="7" textAnchor="middle">Max</text>
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Pressure Index
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 11: SquadImpactRadar
// ============================================================
function SquadImpactRadar({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const axes = ['Starting XI', 'Depth', 'Avg Age', 'Chemistry', 'Balance'];
  const values = axes.map(() => 0.3 + rand() * 0.7);
  const cx = 100;
  const cy = 95;
  const maxR = 60;
  const count = axes.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + maxR * value * Math.cos(angle),
      y: cy + maxR * value * Math.sin(angle),
    };
  };

  const polygonPoints = values.map((v, i) => {
    const p = getPoint(i, v);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 200 170" className="w-full h-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={`sring-${ring}`}
          points={Array.from({ length: count }, (_, i) => {
            const p = getPoint(i, ring);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none" stroke={COLORS.border} strokeWidth="0.5" />
      ))}
      {/* Axis lines and labels */}
      {axes.map((label, i) => {
        const p = getPoint(i, 1);
        const labelOffset = 14;
        return (
          <g key={`saxis-${i}`}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={cx + (p.x - cx) * 1.22} y={cy + (p.y - cy) * 1.22 + labelOffset * 0.3}
              fill={COLORS.secondary} fontSize="6.5" textAnchor="middle">{label}</text>
          </g>
        );
      })}
      {/* Data polygon */}
      <polygon points={polygonPoints} fill={COLORS.accent} fillOpacity="0.2"
        stroke={COLORS.accent} strokeWidth="1.5" />
      {/* Data points */}
      {values.map((v, i) => {
        const p = getPoint(i, v);
        return <circle key={`spt-${i}`} cx={p.x} cy={p.y} r="3" fill={COLORS.accent} />;
      })}
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Squad Impact Analysis
      </text>
    </svg>
  );
}

// ============================================================
// SVG Helper 12: WindowOverallRing
// ============================================================
function WindowOverallRing({ seed }: { seed: number }) {
  const rand = seededRandom(seed);
  const satisfaction = 30 + rand() * 65;
  const cx = 100;
  const cy = 90;
  const r = 55;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - satisfaction / 100);

  return (
    <svg viewBox="0 0 200 170" className="w-full h-auto">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.border} strokeWidth="8" />
      {/* Progress ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.cyan} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round" opacity="0.85"
        style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }} />
      {/* Center text */}
      <text x={cx} y={cy - 5} fill={COLORS.cyan} fontSize="24" textAnchor="middle" fontWeight="bold">
        {Math.round(satisfaction)}
      </text>
      <text x={cx} y={cy + 12} fill={COLORS.secondary} fontSize="9" textAnchor="middle">
        / 100
      </text>
      <text x={cx} y={cy + 28} fill={COLORS.secondary} fontSize="8" textAnchor="middle">
        Satisfaction Score
      </text>
      {/* Rating label */}
      <text x={cx} y={cy + 42}
        fill={satisfaction >= 80 ? COLORS.accent : satisfaction >= 60 ? COLORS.cyan : satisfaction >= 40 ? COLORS.primary : '#ff3333'}
        fontSize="9" textAnchor="middle" fontWeight="bold"
      >
        {satisfaction >= 80 ? 'Excellent' : satisfaction >= 60 ? 'Good' : satisfaction >= 40 ? 'Average' : 'Poor'}
      </text>
      <text x="100" y="12" fill={COLORS.text} fontSize="9" textAnchor="middle" fontWeight="bold">
        Window Overall Rating
      </text>
    </svg>
  );
}

// ============================================================
// Seeded Data Generators (IIFE pattern, no useMemo)
// ============================================================
function generateTransferFeed(seed: number) {
  const rand = seededRandom(seed);
  const clubNames = ['AS Monaco', 'Bayern Munich', 'Chelsea FC', 'Arsenal FC', 'Real Sociedad',
    'Aston Villa', 'Tottenham', 'Liverpool FC', 'RB Leipzig', 'Man City', 'West Ham',
    'Newcastle', 'FC Barcelona', 'Paris SG', 'Atalanta', 'Juventus', 'Benfica', 'Napoli'];
  const playerNames = ['Youssouf Fofana', 'Cole Palmer', 'Pau Torres', 'Mikel Oyarzabal',
    'Destiny Udogie', 'Curtis Jones', 'Xavi Simons', 'Jarrod Bowen', 'Raphinha',
    'Teun Koopmeiners', 'Joao Neves', 'Victor Osimhen', 'Lamine Yamal', 'Florian Wirtz',
    'Jamal Musiala', 'Declan Rice', 'Bukayo Saka', 'Erling Haaland'];
  const types = ['completed', 'medical', 'rumor', 'loan', 'outgoing', 'breaking'] as const;
  const statusMap = {
    completed: { label: 'Confirmed', color: COLORS.accent },
    medical: { label: 'Pending', color: COLORS.cyan },
    rumor: { label: 'Rumor', color: '#ffcc00' },
    loan: { label: 'Confirmed', color: COLORS.accent },
    outgoing: { label: 'Confirmed', color: COLORS.accent },
    breaking: { label: 'Breaking', color: COLORS.primary },
  };
  const iconMap: Record<string, string> = {
    completed: '✅', medical: '🏥', rumor: '📢', loan: '🔄', outgoing: '📤', breaking: '🚨',
  };
  const positions = ['CB', 'CM', 'ST', 'LW', 'GK', 'CAM', 'CDM', 'RB', 'RW', 'AM'];

  return Array.from({ length: 14 }, (_, i) => {
    const type = types[Math.floor(rand() * types.length)];
    const fromIdx = Math.floor(rand() * clubNames.length);
    const toIdx = (fromIdx + 1 + Math.floor(rand() * (clubNames.length - 1))) % clubNames.length;
    const hour = 8 + Math.floor(rand() * 14);
    const minute = Math.floor(rand() * 60);
    return {
      id: `enh-evt-${i}`,
      type,
      timestamp: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      icon: iconMap[type],
      fromClub: clubNames[fromIdx],
      toClub: clubNames[toIdx],
      playerName: playerNames[Math.floor(rand() * playerNames.length)],
      position: positions[Math.floor(rand() * positions.length)],
      fee: type === 'loan' ? 'Loan' : `€${Math.floor(10 + rand() * 90)}M`,
      description: `${positions[Math.floor(rand() * positions.length)]} ${type === 'loan' ? 'joins on season-long loan' : type === 'rumor' ? 'subject of late bid' : 'completes transfer'}`,
      status: statusMap[type].label,
      statusColor: statusMap[type].color,
    };
  }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function generateTargets(seed: number) {
  const rand = seededRandom(seed);
  const names = ['Martin Zubimendi', 'Ivan Toney', 'Jules Kounde', 'Kai Havertz', 'Marcus Rashford',
    'Joao Cancelo', 'Ruben Neves', 'Moussa Diaby', 'Rafael Leao', 'Dusan Vlahovic',
    'Nathan Ake', 'Youri Tielemans', 'Ollie Watkins', 'Gabriel Jesus', 'Leroy Sane'];
  const positions = ['CB', 'CM', 'ST', 'LW', 'GK', 'CAM', 'CDM', 'RB', 'RW', 'AM'];
  const clubs = ['Real Sociedad', 'Brentford', 'Barcelona', 'Arsenal', 'Man Utd', 'Bayern Munich',
    'Wolves', 'Aston Villa', 'AC Milan', 'Juventus', 'Man City', 'Leicester', 'Tottenham', 'Arsenal', 'Bayern Munich'];

  return Array.from({ length: 8 }, (_, i) => {
    const askPrice = Math.floor(20 + rand() * 80);
    const ourOffer = Math.floor(askPrice * (0.6 + rand() * 0.35));
    return {
      id: `target-${i}`,
      playerName: names[i % names.length],
      position: positions[Math.floor(rand() * positions.length)],
      club: clubs[i % clubs.length],
      age: 20 + Math.floor(rand() * 12),
      rating: 70 + Math.floor(rand() * 25),
      askPrice,
      ourOffer,
      negotiationProgress: 10 + Math.floor(rand() * 75),
      priority: ['High', 'Medium', 'Low'][Math.floor(rand() * 3)] as string,
      agentAdvice: ['Strongly pursue', 'Monitor situation', 'Consider alternatives', 'Act fast'][Math.floor(rand() * 4)],
    };
  });
}

function generateRivalMoves(seed: number) {
  const rand = seededRandom(seed);
  const clubs = ['Man City', 'Arsenal', 'Chelsea', 'Liverpool', 'Man Utd', 'Tottenham', 'Newcastle', 'Aston Villa'];
  const actions = ['Signed', 'Bid for', 'Loan deal', 'Released', 'In talks for', 'Medical scheduled'];
  const playerNames = ['Declan Rice', 'Moises Caicedo', 'Raphael Varane', 'Alexis Mac Allister',
    'Dominik Szoboszlai', 'Mudryk', 'Gyokeres', 'Isak', 'Guimaraes', 'Ferland Mendy'];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `rival-${i}`,
    club: clubs[i % clubs.length],
    action: actions[Math.floor(rand() * actions.length)],
    playerName: playerNames[Math.floor(rand() * playerNames.length)],
    fee: `€${Math.floor(15 + rand() * 85)}M`,
    impact: ['High', 'Medium', 'Low'][Math.floor(rand() * 3)] as string,
    hour: 8 + Math.floor(rand() * 14),
    confirmed: rand() > 0.35,
  }));
}

function generateDramaEvents(seed: number) {
  const rand = seededRandom(seed);
  const titles = [
    'Medical Completed at Last Minute',
    'Paperwork Delay Threatens Deal',
    'Player Rejects Move at Airport',
    'Emergency Board Meeting Called',
    'Fax Machine Breaks at HQ',
    'Three-Way Transfer Collapses',
    'Agent Spotted at Training Ground',
    'Club Increases Bid by 40%',
    'Loan Recall Triggered',
    'Deadline Extension Requested',
  ];
  const impacts = [
    'Could affect your starting position',
    'New signing may take your spot',
    'Squad depth improves significantly',
    'Tactical shift expected',
    'Budget impact on future windows',
  ];

  return Array.from({ length: 6 }, (_, i) => ({
    id: `drama-enh-${i}`,
    time: `${9 + i * 2}:${String(Math.floor(rand() * 60)).padStart(2, '0')} ${i < 4 ? 'AM' : 'PM'}`,
    title: titles[i % titles.length],
    description: `Late-breaking development in the ongoing saga. ${impacts[Math.floor(rand() * impacts.length)]}.`,
    impact: impacts[Math.floor(rand() * impacts.length)],
    severity: ['Low', 'Medium', 'High', 'Critical'][Math.floor(rand() * 4)] as string,
  }));
}

// ============================================================
// Main Component
// ============================================================
export default function TransferDeadlineDayEnhanced() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState('live-ticker');
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 42, seconds: 17 });

  const clubName = gameState?.currentClub.name ?? 'FC Elite';

  const dataSeed = hashString(clubName);

  // Generate all data via IIFEs (no useMemo)
  const transferFeed = (() => generateTransferFeed(dataSeed))();
  const targets = (() => generateTargets(dataSeed + 1))();
  const rivalMoves = (() => generateRivalMoves(dataSeed + 2))();
  const dramaEvents = (() => generateDramaEvents(dataSeed + 3))();

  const filteredFeed = (() => {
    if (feedFilter === 'all') return transferFeed;
    return transferFeed.filter((e) => e.type === feedFilter);
  })();

  const toggleTarget = useCallback((id: string) => {
    setExpandedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Countdown timer via useEffect
  useEffect(() => {
    const totalSeconds = countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
    if (totalSeconds <= 0) return;
    const timer = setTimeout(() => {
      const remaining = totalSeconds - 1;
      setCountdown({
        hours: Math.floor(remaining / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown.hours, countdown.minutes, countdown.seconds]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const totalSeconds = countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
  const isUrgent = totalSeconds < 3600;

  // Stats
  const totalDeals = (() => transferFeed.filter((e) => e.status === 'Confirmed').length)();
  const totalSpentStr = (() => {
    const spent = transferFeed
      .filter((e) => e.status === 'Confirmed' && e.fee !== 'Loan')
      .reduce((sum, e) => sum + parseInt(e.fee.replace(/[^0-9]/g, '') || '0', 10), 0);
    return `€${spent}M`;
  })();
  const totalReceivedStr = (() => {
    const received = transferFeed
      .filter((e) => e.status === 'Confirmed' && e.type === 'outgoing')
      .reduce((sum, e) => sum + parseInt(e.fee.replace(/[^0-9]/g, '') || '0', 10), 0);
    return `€${received}M`;
  })();

  const feedTypeCounts = (() => {
    const allTypes = ['completed', 'medical', 'rumor', 'loan', 'outgoing', 'breaking'] as const;
    return allTypes.reduce<Record<string, number>>((acc, t) => {
      acc[t] = transferFeed.filter((e) => e.type === t).length;
      return acc;
    }, {});
  })();

  return (
    <div className="space-y-4 p-4" style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      {/* ============================================================
          Header: Club Name & Status Banner
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `3px solid ${isUrgent ? COLORS.primary : COLORS.accent}`,
        }}
        className="p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" style={{ color: isUrgent ? COLORS.primary : COLORS.accent }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.text }}>
              Transfer Deadline Day
            </span>
          </div>
          <Badge
            style={{
              color: isUrgent ? COLORS.primary : COLORS.accent,
              borderColor: isUrgent ? COLORS.primary : COLORS.accent,
              backgroundColor: 'transparent',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {isUrgent ? 'CLOSING' : 'OPEN'}
          </Badge>
        </div>

        {/* Club Name */}
        <p className="text-lg font-bold mb-3" style={{ color: '#ffffff' }}>
          {clubName}
        </p>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[
            { value: pad(countdown.hours), label: 'HRS' },
            { value: ':', label: '' },
            { value: pad(countdown.minutes), label: 'MIN' },
            { value: ':', label: '' },
            { value: pad(countdown.seconds), label: 'SEC' },
          ].map((item, i) => (
            <div key={`cd-${i}`} className="flex items-center gap-1">
              {item.label ? (
                <div className="flex flex-col items-center">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: isUrgent ? COLORS.primary : '#ffffff' }}
                  >
                    {item.value}
                  </span>
                  <span className="text-[8px] font-semibold tracking-widest uppercase" style={{ color: COLORS.secondary }}>
                    {item.label}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold" style={{ color: COLORS.border }}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, value: String(totalDeals), label: 'Deals', color: COLORS.accent },
            { icon: <TrendingUp className="h-3.5 w-3.5" />, value: totalSpentStr, label: 'Spent', color: COLORS.primary },
            { icon: <TrendingDown className="h-3.5 w-3.5" />, value: totalReceivedStr, label: 'Received', color: COLORS.accent },
          ].map((stat, i) => (
            <div
              key={`stat-${i}`}
              className="p-2 text-center"
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-sm font-bold" style={{ color: '#ffffff' }}>{stat.value}</p>
              <p className="text-[8px] font-medium" style={{ color: COLORS.secondary }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ============================================================
          Tab Navigation
          ============================================================ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="w-full flex"
          style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          {[
            { value: 'live-ticker', label: 'Live Ticker', icon: <Radio className="h-3.5 w-3.5" /> },
            { value: 'targets', label: 'Targets', icon: <Target className="h-3.5 w-3.5" /> },
            { value: 'market-watch', label: 'Market Watch', icon: <Eye className="h-3.5 w-3.5" /> },
            { value: 'deadline-analysis', label: 'Analysis', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 gap-1.5 text-[11px] font-semibold"
              style={{
                color: activeTab === tab.value ? COLORS.text : COLORS.secondary,
                backgroundColor: activeTab === tab.value ? COLORS.bg : 'transparent',
                border: activeTab === tab.value ? `1px solid ${COLORS.border}` : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 4px',
              }}
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ============================================================
            Tab 1: Live Ticker
            ============================================================ */}
        <TabsContent value="live-ticker" className="space-y-4 mt-4">
          {/* Filter Buttons */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All', count: transferFeed.length },
              { key: 'completed', label: 'Confirmed', count: feedTypeCounts.completed || 0 },
              { key: 'rumor', label: 'Rumors', count: feedTypeCounts.rumor || 0 },
              { key: 'loan', label: 'Loans', count: feedTypeCounts.loan || 0 },
              { key: 'outgoing', label: 'Outgoings', count: feedTypeCounts.outgoing || 0 },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFeedFilter(f.key)}
                className="flex-shrink-0 px-3 py-1.5 text-[10px] font-semibold border transition-colors"
                style={{
                  backgroundColor: feedFilter === f.key ? COLORS.card : COLORS.card,
                  color: feedFilter === f.key ? COLORS.accent : COLORS.secondary,
                  borderColor: feedFilter === f.key ? COLORS.accent : COLORS.border,
                }}
              >
                {f.label}
                <span className="ml-1 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Transfer Feed */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredFeed.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="p-3"
                style={{
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <span className="text-lg">{event.icon}</span>
                    <span className="text-[9px] font-mono" style={{ color: COLORS.secondary }}>
                      {event.timestamp}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: COLORS.text }}>
                        {event.playerName}
                      </span>
                      <Badge
                        className="text-[9px] px-1.5 py-0 border"
                        style={{
                          color: event.statusColor,
                          borderColor: event.statusColor,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {event.status}
                      </Badge>
                      <Badge
                        className="text-[9px] px-1.5 py-0 border"
                        style={{
                          color: COLORS.secondary,
                          borderColor: COLORS.border,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {event.position}
                      </Badge>
                    </div>
                    <p className="text-[10px] mb-1.5" style={{ color: COLORS.secondary }}>
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: COLORS.secondary }}>
                        <span>{event.fromClub}</span>
                        <span style={{ color: COLORS.border }}>→</span>
                        <span>{event.toClub}</span>
                      </div>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: event.fee === 'Loan' ? COLORS.cyan : COLORS.accent }}
                      >
                        {event.fee}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* SVG Section: 3 Charts */}
          <div className="grid grid-cols-1 gap-3">
            {/* Hourly Activity Bars */}
            <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4" style={{ color: COLORS.primary }} />
                <span className="text-xs font-bold" style={{ color: COLORS.text }}>Hourly Activity</span>
              </div>
              <HourlyActivityBars seed={dataSeed} />
            </div>

            {/* Transfer Type Donut + Club Spending Radar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <GitCompare className="h-4 w-4" style={{ color: COLORS.accent }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>Types</span>
                </div>
                <TransferTypeDonut seed={dataSeed + 10} />
              </div>
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" style={{ color: COLORS.cyan }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>Spending</span>
                </div>
                <ClubSpendingRadar seed={dataSeed + 20} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================
            Tab 2: Targets
            ============================================================ */}
        <TabsContent value="targets" className="space-y-4 mt-4">
          {/* Priority Bars */}
          <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="h-4 w-4" style={{ color: COLORS.primary }} />
              <span className="text-xs font-bold" style={{ color: COLORS.text }}>Position Needs</span>
            </div>
            <TargetPriorityBars seed={dataSeed + 30} />
          </div>

          {/* Target List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: COLORS.accent }} />
                <span className="text-sm font-bold" style={{ color: COLORS.text }}>Transfer Targets</span>
              </div>
              <Badge
                className="text-[10px] border px-2"
                style={{
                  color: COLORS.accent,
                  borderColor: COLORS.accent,
                  backgroundColor: 'transparent',
                }}
              >
                {targets.length} targets
              </Badge>
            </div>

            {targets.map((target, idx) => {
              const isExpanded = expandedTargets.has(target.id);
              const offerPct = Math.round((target.ourOffer / target.askPrice) * 100);
              return (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  className="p-3"
                  style={{
                    backgroundColor: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: COLORS.text }}>
                        {target.playerName}
                      </span>
                      <Badge
                        className="text-[9px] px-1.5 py-0 border"
                        style={{
                          color: target.priority === 'High' ? COLORS.primary : target.priority === 'Medium' ? COLORS.accent : COLORS.secondary,
                          borderColor: target.priority === 'High' ? COLORS.primary : target.priority === 'Medium' ? COLORS.accent : COLORS.border,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {target.priority}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleTarget(target.id)}
                      className="text-[10px] px-2 py-1 border"
                      style={{
                        color: COLORS.secondary,
                        borderColor: COLORS.border,
                        backgroundColor: 'transparent',
                      }}
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  </div>

                  {/* Quick Info */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: COLORS.secondary }}>
                    <span>{target.position}</span>
                    <span>{target.club}</span>
                    <span>Age {target.age}</span>
                    <span>OVR {target.rating}</span>
                  </div>

                  {/* Negotiation Progress Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span style={{ color: COLORS.secondary }}>Negotiation</span>
                      <span style={{ color: COLORS.accent }}>{target.negotiationProgress}%</span>
                    </div>
                    <div className="h-2" style={{ backgroundColor: COLORS.bg }}>
                      <div
                        className="h-full"
                        style={{
                          width: `${target.negotiationProgress}%`,
                          backgroundColor: target.negotiationProgress > 70 ? COLORS.accent : target.negotiationProgress > 40 ? COLORS.cyan : COLORS.primary,
                        }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 pt-2"
                      style={{ borderTop: `1px solid ${COLORS.border}` }}
                    >
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span style={{ color: COLORS.secondary }}>Ask: </span>
                          <span style={{ color: COLORS.primary }}>€{target.askPrice}M</span>
                        </div>
                        <div>
                          <span style={{ color: COLORS.secondary }}>Offer: </span>
                          <span style={{ color: COLORS.accent }}>€{target.ourOffer}M</span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px]">
                        <span style={{ color: COLORS.secondary }}>Gap: </span>
                        <span style={{ color: offerPct >= 90 ? COLORS.accent : COLORS.primary }}>
                          {offerPct}% of asking price (€{target.askPrice - target.ourOffer}M gap)
                        </span>
                      </div>
                      <p className="mt-1.5 text-[9px]" style={{ color: COLORS.secondary }}>
                        Agent: {target.agentAdvice}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Negotiation Gauge + Budget Donut */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4" style={{ color: COLORS.accent }} />
                <span className="text-xs font-bold" style={{ color: COLORS.text }}>Deal Progress</span>
              </div>
              <NegotiationProgressGauge seed={dataSeed + 40} />
            </div>
            <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" style={{ color: COLORS.primary }} />
                <span className="text-xs font-bold" style={{ color: COLORS.text }}>Budget</span>
              </div>
              <BudgetAllocationDonut seed={dataSeed + 50} />
            </div>
          </div>
        </TabsContent>

        {/* ============================================================
            Tab 3: Market Watch
            ============================================================ */}
        <TabsContent value="market-watch" className="space-y-4 mt-4">
          {/* Rival Moves List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: COLORS.cyan }} />
                <span className="text-sm font-bold" style={{ color: COLORS.text }}>Rival Activity</span>
              </div>
              <Badge
                className="text-[10px] border px-2"
                style={{
                  color: COLORS.cyan,
                  borderColor: COLORS.cyan,
                  backgroundColor: 'transparent',
                }}
              >
                {rivalMoves.length} moves
              </Badge>
            </div>

            {rivalMoves.map((move, idx) => (
              <motion.div
                key={move.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="p-3"
                style={{
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: COLORS.text }}>{move.club}</span>
                      <Badge
                        className="text-[9px] px-1.5 py-0 border"
                        style={{
                          color: move.impact === 'High' ? COLORS.primary : move.impact === 'Medium' ? COLORS.accent : COLORS.cyan,
                          borderColor: move.impact === 'High' ? COLORS.primary : move.impact === 'Medium' ? COLORS.accent : COLORS.cyan,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {move.impact}
                      </Badge>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: COLORS.secondary }}>
                      {move.action} {move.playerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold" style={{ color: move.confirmed ? COLORS.accent : '#ffcc00' }}>
                      {move.fee}
                    </span>
                    <div className="text-[9px]" style={{ color: COLORS.secondary }}>
                      {String(move.hour).padStart(2, '0')}:00
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* SVG Charts */}
          <div className="space-y-3">
            {/* Rival Activity Timeline */}
            <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4" style={{ color: COLORS.primary }} />
                <span className="text-xs font-bold" style={{ color: COLORS.text }}>Activity Timeline</span>
              </div>
              <RivalActivityTimeline seed={dataSeed + 60} />
            </div>

            {/* Market Value Trend + League Spending */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" style={{ color: COLORS.cyan }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>Value Trend</span>
                </div>
                <MarketValueTrendArea seed={dataSeed + 70} />
              </div>
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4" style={{ color: COLORS.accent }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>League Spend</span>
                </div>
                <LeagueSpendingBars seed={dataSeed + 80} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================
            Tab 4: Deadline Analysis
            ============================================================ */}
        <TabsContent value="deadline-analysis" className="space-y-4 mt-4">
          {/* Drama Events Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: COLORS.primary }} />
                <span className="text-sm font-bold" style={{ color: COLORS.text }}>Drama Moments</span>
              </div>
              <Badge
                className="text-[10px] border px-2"
                style={{
                  color: COLORS.primary,
                  borderColor: COLORS.primary,
                  backgroundColor: 'transparent',
                }}
              >
                {dramaEvents.length} events
              </Badge>
            </div>

            <div className="relative space-y-2">
              {/* Vertical line */}
              <div
                className="absolute"
                style={{
                  left: '18px',
                  top: '16px',
                  bottom: '16px',
                  width: '1px',
                  backgroundColor: COLORS.border,
                }}
              />

              {dramaEvents.map((drama, idx) => {
                const severityColor = drama.severity === 'Critical' ? COLORS.primary : drama.severity === 'High' ? COLORS.accent : drama.severity === 'Medium' ? COLORS.cyan : COLORS.secondary;
                return (
                  <motion.div
                    key={drama.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="relative flex gap-3"
                  >
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          border: `1px solid ${severityColor}`,
                          backgroundColor: idx === dramaEvents.length - 1 ? `${COLORS.primary}20` : `${severityColor}15`,
                          borderRadius: '6px',
                        }}
                      >
                        {idx === dramaEvents.length - 1 ? (
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ color: severityColor }}
                          >
                            <Zap className="h-4 w-4" />
                          </motion.span>
                        ) : (
                          <span className="text-sm" style={{ color: severityColor }}>
                            {idx < dramaEvents.length - 2 ? '✓' : '!'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 p-3"
                      style={{
                        backgroundColor: COLORS.card,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono" style={{ color: COLORS.secondary }}>
                          {drama.time}
                        </span>
                        {idx === dramaEvents.length - 1 && (
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-[9px] font-semibold"
                            style={{ color: COLORS.primary }}
                          >
                            HAPPENING NOW
                          </motion.span>
                        )}
                        {idx < dramaEvents.length - 1 && (
                          <span className="text-[9px] font-medium" style={{ color: COLORS.accent }}>
                            Happened
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold mb-1" style={{ color: COLORS.text }}>
                        {drama.title}
                      </p>
                      <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: COLORS.secondary }}>
                        {drama.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px]" style={{ color: severityColor }}>
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">{drama.impact}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SVG Charts */}
          <div className="space-y-3">
            {/* Deadline Pressure Gauge */}
            <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4" style={{ color: COLORS.primary }} />
                <span className="text-xs font-bold" style={{ color: COLORS.text }}>Pressure Index</span>
              </div>
              <DeadlinePressureGauge seed={dataSeed + 90} />
            </div>

            {/* Squad Impact + Window Ring */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" style={{ color: COLORS.accent }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>Squad Impact</span>
                </div>
                <SquadImpactRadar seed={dataSeed + 100} />
              </div>
              <div className="p-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4" style={{ color: COLORS.cyan }} />
                  <span className="text-xs font-bold" style={{ color: COLORS.text }}>Overall Rating</span>
                </div>
                <WindowOverallRing seed={dataSeed + 110} />
              </div>
            </div>
          </div>

          {/* Final Summary Card */}
          <div
            className="p-4"
            style={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${COLORS.primary}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4" style={{ color: COLORS.accent }} />
              <span className="text-sm font-bold" style={{ color: COLORS.text }}>Window Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              {[
                { label: 'Deals Completed', value: String(totalDeals), color: COLORS.accent },
                { label: 'Total Investment', value: totalSpentStr, color: COLORS.primary },
                { label: 'Squad Size Impact', value: `+${(() => {
                  const signed = transferFeed.filter((e) => e.type !== 'outgoing' && e.status === 'Confirmed').length;
                  const outgoing = transferFeed.filter((e) => e.type === 'outgoing' && e.status === 'Confirmed').length;
                  return signed - outgoing;
                })()}`, color: COLORS.cyan },
                { label: 'Remaining Budget', value: `€${(() => {
                  const totalBudget = 150;
                  const spent = transferFeed
                    .filter((e) => e.status === 'Confirmed' && e.fee !== 'Loan')
                    .reduce((sum, e) => sum + parseInt(e.fee.replace(/[^0-9]/g, '') || '0', 10), 0);
                  return Math.max(0, totalBudget - spent);
                })()}M`, color: COLORS.accent },
              ].map((item, i) => (
                <div key={`summary-${i}`}>
                  <span style={{ color: COLORS.secondary }}>{item.label}: </span>
                  <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed" style={{ color: COLORS.secondary }}>
              {(() => {
                if (totalDeals >= 5) return `A productive window for ${clubName}. Multiple reinforcements should strengthen the squad for the challenges ahead. The board is satisfied with the business conducted.`;
                if (totalDeals >= 2) return `${clubName} had a moderate window. Some areas of the squad were addressed but key targets remain unfulfilled. The January window may prove crucial.`;
                return `A quiet window for ${clubName}. Minimal activity leaves questions about the club's ambition. Fans may express frustration at the lack of investment.`;
              })()}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


