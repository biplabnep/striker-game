'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Handshake,
  BarChart3,
  Target,
  Users,
  History,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Scale,
  Briefcase,
  Award,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// Seeded Random — deterministic pseudo-random data
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
// SVG #1: SalaryComparisonBars — 4 horizontal bars
// ============================================================
function SalaryComparisonBars({
  mySalary,
  teamAvg,
  leagueAvg,
  topEarner,
}: {
  mySalary: number;
  teamAvg: number;
  leagueAvg: number;
  topEarner: number;
}) {
  const maxVal = Math.max(mySalary, teamAvg, leagueAvg, topEarner, 1);
  const bars = [
    { label: 'My Salary', value: mySalary, color: '#FF5500' },
    { label: 'Team Avg', value: teamAvg, color: '#CCFF00' },
    { label: 'League Avg', value: leagueAvg, color: '#00E5FF' },
    { label: 'Top Earner', value: topEarner, color: '#666666' },
  ];
  const barHeight = 18;
  const labelWidth = 80;
  const chartWidth = 200;
  const pad = 12;
  const totalH = bars.length * (barHeight + 12) + pad * 2;

  return (
    <svg viewBox={`0 0 ${labelWidth + chartWidth + 60} ${totalH}`} style={{ width: '100%' }}>
      {bars.map((bar, i) => {
        const y = pad + i * (barHeight + 12);
        const barW = Math.max(2, (bar.value / maxVal) * chartWidth);
        return (
          <g key={i}>
            <text
              x={0}
              y={y + barHeight / 2 + 4}
              fill="#8b949e"
              fontSize={10}
              textAnchor="start"
            >
              {bar.label}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={chartWidth}
              height={barHeight}
              fill="#21262d"
              rx={3}
            />
            <rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              fill={bar.color}
              rx={3}
            />
            <text
              x={labelWidth + chartWidth + 6}
              y={y + barHeight / 2 + 4}
              fill="#c9d1d9"
              fontSize={9}
              textAnchor="start"
            >
              {formatCurrency(bar.value, 'K')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #2: ContractSecurityGauge — semi-circular gauge (0-100)
// ============================================================
function ContractSecurityGauge({ value, label }: { value: number; label: string }) {
  const cx = 80;
  const cy = 72;
  const radius = 55;
  const clampedValue = Math.max(0, Math.min(100, value));
  const angleFraction = clampedValue / 100;
  const totalAngle = Math.PI;
  const filledAngle = totalAngle * angleFraction;

  const arcX = (angle: number) => cx + radius * Math.cos(Math.PI - angle);
  const arcY = (angle: number) => cy - radius * Math.sin(Math.PI - angle);

  const pathD =
    clampedValue > 0
      ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${arcX(filledAngle)} ${arcY(filledAngle)}`
      : '';

  const determineColor = () => {
    if (clampedValue >= 70) return '#CCFF00';
    if (clampedValue >= 40) return '#FF5500';
    return '#666666';
  };
  const strokeColor = determineColor();

  return (
    <svg viewBox="0 0 160 90" style={{ width: '100%' }}>
      {/* Background track */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#21262d"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}
      {/* Center value */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#c9d1d9" fontSize={20} fontWeight="bold">
        {clampedValue}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#8b949e" fontSize={9}>
        {label}
      </text>
      {/* Min/Max labels */}
      <text x={cx - radius + 4} y={cy + 14} textAnchor="start" fill="#666666" fontSize={7}>
        0
      </text>
      <text x={cx + radius - 4} y={cy + 14} textAnchor="end" fill="#666666" fontSize={7}>
        100
      </text>
    </svg>
  );
}

// ============================================================
// SVG #3: BonusBreakdownDonut — 3-segment donut
// ============================================================
function BonusBreakdownDonut({
  signing,
  goal,
  appearance,
}: {
  signing: number;
  goal: number;
  appearance: number;
}) {
  const cx = 60;
  const cy = 60;
  const outerR = 48;
  const innerR = 28;
  const segments = [
    { label: 'Signing', value: signing, color: '#FF5500' },
    { label: 'Goal', value: goal, color: '#CCFF00' },
    { label: 'Appearance', value: appearance, color: '#00E5FF' },
  ];
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  const donutPaths = segments.reduce<{ accAngle: number; paths: Array<{ key: number; d: string; color: string }> }>(
    (acc, seg, idx) => {
      const segAngle = (seg.value / total) * Math.PI * 2;
      const startAngle = acc.accAngle;
      const endAngle = acc.accAngle + segAngle;
      const x1o = cx + outerR * Math.cos(startAngle);
      const y1o = cy + outerR * Math.sin(startAngle);
      const x2o = cx + outerR * Math.cos(endAngle);
      const y2o = cy + outerR * Math.sin(endAngle);
      const x1i = cx + innerR * Math.cos(endAngle);
      const y1i = cy + innerR * Math.sin(endAngle);
      const x2i = cx + innerR * Math.cos(startAngle);
      const y2i = cy + innerR * Math.sin(startAngle);
      const large = segAngle > Math.PI ? 1 : 0;
      const path = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`;
      return { accAngle: endAngle, paths: [...acc.paths, { key: idx, d: path, color: seg.color }] };
    },
    { accAngle: -Math.PI / 2, paths: [] }
  );

  return (
    <svg viewBox="0 0 120 120" style={{ width: '100%', maxWidth: 120 }}>
      {donutPaths.paths.map((p) => (
        <path key={p.key} d={p.d} fill={p.color} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={10} fontWeight="bold">
        Bonuses
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize={7}>
        {formatCurrency(total, 'K')}
      </text>
    </svg>
  );
}

// ============================================================
// SVG #4: NegotiationPowerRadar — 5-axis radar
// ============================================================
function NegotiationPowerRadar({
  performance,
  marketValue,
  loyalty,
  agentSkill,
  leverage,
}: {
  performance: number;
  marketValue: number;
  loyalty: number;
  agentSkill: number;
  leverage: number;
}) {
  const cx = 100;
  const cy = 90;
  const maxR = 65;
  const axes = [
    { label: 'Performance', value: performance },
    { label: 'Market Value', value: marketValue },
    { label: 'Loyalty', value: loyalty },
    { label: 'Agent Skill', value: agentSkill },
    { label: 'Leverage', value: leverage },
  ];
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;
  const startOffset = -Math.PI / 2;

  const getPoint = (axisIdx: number, fraction: number) => ({
    x: cx + maxR * fraction * Math.cos(startOffset + axisIdx * angleStep),
    y: cy + maxR * fraction * Math.sin(startOffset + axisIdx * angleStep),
  });

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 200 190" style={{ width: '100%' }}>
      {/* Grid rings */}
      {gridRings.map((ring, ri) => {
        const pts = axes
          .map((_, ai) => {
            const p = getPoint(ai, ring);
            return `${p.x},${p.y}`;
          })
          .join(' ');
        return (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="#21262d"
            strokeWidth={1}
          />
        );
      })}
      {/* Axis lines */}
      {axes.map((_, ai) => {
        const p = getPoint(ai, 1);
        return (
          <line
            key={ai}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#21262d"
            strokeWidth={1}
          />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={axes
          .map((axis, ai) => {
            const p = getPoint(ai, axis.value / 100);
            return `${p.x},${p.y}`;
          })
          .join(' ')}
        fill="#FF5500"
        fillOpacity={0.15}
        stroke="#FF5500"
        strokeWidth={2}
      />
      {/* Data points */}
      {axes.map((axis, ai) => {
        const p = getPoint(ai, axis.value / 100);
        return (
          <circle key={ai} cx={p.x} cy={p.y} r={3} fill="#FF5500" />
        );
      })}
      {/* Axis labels */}
      {axes.map((axis, ai) => {
        const labelR = maxR + 16;
        const lx = cx + labelR * Math.cos(startOffset + ai * angleStep);
        const ly = cy + labelR * Math.sin(startOffset + ai * angleStep);
        return (
          <text
            key={ai}
            x={lx}
            y={ly}
            textAnchor="middle"
            fill="#8b949e"
            fontSize={8}
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #5: OfferComparisonButterfly — butterfly chart
// ============================================================
function OfferComparisonButterfly({
  current,
  offered,
  labels,
}: {
  current: number[];
  offered: number[];
  labels: string[];
}) {
  const chartW = 100;
  const totalW = chartW * 2 + 40;
  const rowH = 28;
  const padY = 16;
  const maxVal = Math.max(...current, ...offered, 1);
  const centerLineX = chartW + 20;

  return (
    <svg viewBox={`0 0 ${totalW} ${labels.length * rowH + padY * 2}`} style={{ width: '100%' }}>
      {/* Center line */}
      <line
        x1={centerLineX}
        y1={padY}
        x2={centerLineX}
        y2={labels.length * rowH + padY}
        stroke="#30363d"
        strokeWidth={1}
      />
      {labels.map((label, i) => {
        const y = padY + i * rowH;
        const currW = Math.max(1, (current[i] / maxVal) * (chartW - 4));
        const offW = Math.max(1, (offered[i] / maxVal) * (chartW - 4));
        return (
          <g key={i}>
            {/* Current bar (extends left from center) */}
            <rect
              x={centerLineX - 2 - currW}
              y={y + 4}
              width={currW}
              height={16}
              fill="#CCFF00"
              rx={2}
            />
            {/* Offered bar (extends right from center) */}
            <rect
              x={centerLineX + 2}
              y={y + 4}
              width={offW}
              height={16}
              fill="#00E5FF"
              rx={2}
            />
            {/* Label */}
            <text
              x={centerLineX}
              y={y - 2}
              textAnchor="middle"
              fill="#8b949e"
              fontSize={8}
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={10} y={padY + labels.length * rowH + 2} width={8} height={8} fill="#CCFF00" rx={1} />
      <text x={22} y={padY + labels.length * rowH + 9} fill="#8b949e" fontSize={7}>Current</text>
      <rect x={totalW - 60} y={padY + labels.length * rowH + 2} width={8} height={8} fill="#00E5FF" rx={1} />
      <text x={totalW - 48} y={padY + labels.length * rowH + 9} fill="#8b949e" fontSize={7}>Offered</text>
    </svg>
  );
}

// ============================================================
// SVG #6: AgentRecommendationBars — 4 horizontal bars
// ============================================================
function AgentRecommendationBars({
  salary,
  bonus,
  duration,
  releaseClause,
}: {
  salary: number;
  bonus: number;
  duration: number;
  releaseClause: number;
}) {
  const bars = [
    { label: 'Salary', value: salary, color: '#FF5500' },
    { label: 'Bonus', value: bonus, color: '#CCFF00' },
    { label: 'Duration', value: duration, color: '#00E5FF' },
    { label: 'Release Clause', value: releaseClause, color: '#666666' },
  ];
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const barH = 16;
  const padX = 8;
  const labelW = 90;
  const barAreaW = 140;
  const gapY = 10;

  return (
    <svg viewBox={`0 0 ${padX + labelW + barAreaW + 50} ${padX * 2 + bars.length * (barH + gapY)}`} style={{ width: '100%' }}>
      {bars.map((bar, i) => {
        const y = padX + i * (barH + gapY);
        const w = Math.max(2, (bar.value / maxVal) * barAreaW);
        return (
          <g key={i}>
            <text x={padX} y={y + barH / 2 + 3} fill="#8b949e" fontSize={9}>
              {bar.label}
            </text>
            <rect
              x={padX + labelW}
              y={y}
              width={barAreaW}
              height={barH}
              fill="#21262d"
              rx={3}
            />
            <rect
              x={padX + labelW}
              y={y}
              width={w}
              height={barH}
              fill={bar.color}
              rx={3}
            />
            <text
              x={padX + labelW + barAreaW + 6}
              y={y + barH / 2 + 3}
              fill="#c9d1d9"
              fontSize={9}
            >
              {bar.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #7: MarketValueTrendArea — 8-point area chart
// ============================================================
function MarketValueTrendArea({ values, seasonLabels }: { values: number[]; seasonLabels: string[] }) {
  const padX = 10;
  const padY = 10;
  const chartW = 220;
  const chartH = 100;
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = Math.max(maxVal - minVal, 1);

  const xStep = chartW / (values.length - 1);
  const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;
  const toX = (i: number) => padX + i * xStep;

  const linePoints = values
    .map((v, i) => `${toX(i)},${toY(v)}`)
    .join(' ');
  const areaPoints = `${toX(0)},${padY + chartH} ${linePoints} ${toX(values.length - 1)},${padY + chartH}`;

  return (
    <svg viewBox={`0 0 ${chartW + padX * 2} ${chartH + padY + 20}`} style={{ width: '100%' }}>
      {/* Grid lines */}
      {[0, 1, 2, 3].map((gi) => (
        <line
          key={gi}
          x1={padX}
          y1={padY + (chartH / 3) * gi}
          x2={padX + chartW}
          y2={padY + (chartH / 3) * gi}
          stroke="#21262d"
          strokeWidth={1}
        />
      ))}
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill="#00E5FF"
        fillOpacity={0.2}
      />
      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#00E5FF"
        strokeWidth={2}
      />
      {/* Data points */}
      {values.map((v, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(v)}
          r={3}
          fill="#00E5FF"
        />
      ))}
      {/* Labels */}
      {seasonLabels.map((lbl, i) => (
        <text
          key={i}
          x={toX(i)}
          y={padY + chartH + 14}
          textAnchor="middle"
          fill="#8b949e"
          fontSize={8}
        >
          {lbl}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG #8: PeerSalaryScatter — 8 scatter dots
// ============================================================
function PeerSalaryScatter({
  peers,
  playerX,
  playerY,
}: {
  peers: Array<{ x: number; y: number; name: string }>;
  playerX: number;
  playerY: number;
}) {
  const padX = 30;
  const padY = 10;
  const chartW = 190;
  const chartH = 110;
  const allPoints = [...peers, { x: playerX, y: playerY, name: 'You' }];
  const maxX = Math.max(...allPoints.map((p) => p.x), 1);
  const maxY = Math.max(...allPoints.map((p) => p.y), 1);
  const toSx = (v: number) => padX + (v / maxX) * chartW;
  const toSy = (v: number) => padY + chartH - (v / maxY) * chartH;

  return (
    <svg viewBox={`0 0 ${padX + chartW + 10} ${padY + chartH + 30}`} style={{ width: '100%' }}>
      {/* Axes */}
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#30363d" strokeWidth={1} />
      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#30363d" strokeWidth={1} />
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={padX}
          y1={padY + chartH * (1 - g)}
          x2={padX + chartW}
          y2={padY + chartH * (1 - g)}
          stroke="#21262d"
          strokeWidth={0.5}
          strokeDasharray="3,3"
        />
      ))}
      {/* Peer dots */}
      {peers.map((p, i) => (
        <circle
          key={i}
          cx={toSx(p.x)}
          cy={toSy(p.y)}
          r={4}
          fill="#FF5500"
          fillOpacity={0.6}
        />
      ))}
      {/* Player dot */}
      <circle cx={toSx(playerX)} cy={toSy(playerY)} r={6} fill="#FF5500" stroke="#c9d1d9" strokeWidth={2} />
      {/* Axis labels */}
      <text x={padX + chartW / 2} y={padY + chartH + 24} textAnchor="middle" fill="#8b949e" fontSize={8}>
        Experience (years)
      </text>
      <text x={6} y={padY + chartH / 2} textAnchor="middle" fill="#8b949e" fontSize={8} transform={`rotate(-90, 6, ${padY + chartH / 2})`}>
        Salary (K/week)
      </text>
    </svg>
  );
}

// ============================================================
// SVG #9: DemandVsSupplyRadar — 5-axis radar
// ============================================================
function DemandVsSupplyRadar({
  positionDemand,
  ageFactor,
  form,
  market,
  competition,
}: {
  positionDemand: number;
  ageFactor: number;
  form: number;
  market: number;
  competition: number;
}) {
  const cx = 100;
  const cy = 90;
  const maxR = 65;
  const axes = [
    { label: 'Position Demand', value: positionDemand },
    { label: 'Age Factor', value: ageFactor },
    { label: 'Form', value: form },
    { label: 'Market', value: market },
    { label: 'Competition', value: competition },
  ];
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;
  const startOffset = -Math.PI / 2;

  const getPoint = (axisIdx: number, fraction: number) => ({
    x: cx + maxR * fraction * Math.cos(startOffset + axisIdx * angleStep),
    y: cy + maxR * fraction * Math.sin(startOffset + axisIdx * angleStep),
  });

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 200 190" style={{ width: '100%' }}>
      {/* Grid rings */}
      {gridRings.map((ring, ri) => {
        const pts = axes
          .map((_, ai) => {
            const p = getPoint(ai, ring);
            return `${p.x},${p.y}`;
          })
          .join(' ');
        return (
          <polygon key={ri} points={pts} fill="none" stroke="#21262d" strokeWidth={1} />
        );
      })}
      {/* Axis lines */}
      {axes.map((_, ai) => {
        const p = getPoint(ai, 1);
        return (
          <line key={ai} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth={1} />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={axes
          .map((axis, ai) => {
            const p = getPoint(ai, axis.value / 100);
            return `${p.x},${p.y}`;
          })
          .join(' ')}
        fill="#CCFF00"
        fillOpacity={0.15}
        stroke="#CCFF00"
        strokeWidth={2}
      />
      {/* Data points */}
      {axes.map((axis, ai) => {
        const p = getPoint(ai, axis.value / 100);
        return <circle key={ai} cx={p.x} cy={p.y} r={3} fill="#CCFF00" />;
      })}
      {/* Axis labels */}
      {axes.map((axis, ai) => {
        const labelR = maxR + 16;
        const lx = cx + labelR * Math.cos(startOffset + ai * angleStep);
        const ly = cy + labelR * Math.sin(startOffset + ai * angleStep);
        return (
          <text key={ai} x={lx} y={ly} textAnchor="middle" fill="#8b949e" fontSize={8}>
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #10: ContractHistoryTimeline — 6-node horizontal timeline
// ============================================================
function ContractHistoryTimeline({
  contracts,
}: {
  contracts: Array<{ year: string; value: number; club: string }>;
}) {
  const padX = 30;
  const padY = 30;
  const nodeSpacing = 56;
  const totalW = padX * 2 + (contracts.length - 1) * nodeSpacing;
  const totalH = 90;
  const lineY = padY;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: '100%' }}>
      {/* Main line */}
      <line
        x1={padX}
        y1={lineY}
        x2={padX + (contracts.length - 1) * nodeSpacing}
        y2={lineY}
        stroke="#00E5FF"
        strokeWidth={2}
      />
      {/* Nodes */}
      {contracts.map((c, i) => {
        const nx = padX + i * nodeSpacing;
        return (
          <g key={i}>
            <circle cx={nx} cy={lineY} r={6} fill="#0d1117" stroke="#00E5FF" strokeWidth={2} />
            <circle cx={nx} cy={lineY} r={3} fill="#00E5FF" />
            <text x={nx} y={lineY - 14} textAnchor="middle" fill="#c9d1d9" fontSize={8} fontWeight="bold">
              {c.year}
            </text>
            <text x={nx} y={lineY + 20} textAnchor="middle" fill="#8b949e" fontSize={7}>
              {c.club}
            </text>
            <text x={nx} y={lineY + 32} textAnchor="middle" fill="#00E5FF" fontSize={8}>
              {formatCurrency(c.value, 'K')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG #11: NegotiationSuccessRateRing — circular ring
// ============================================================
function NegotiationSuccessRateRing({
  successful,
  total,
}: {
  successful: number;
  total: number;
}) {
  const cx = 70;
  const cy = 70;
  const radius = 50;
  const strokeWidth = 10;
  const pct = total > 0 ? successful / total : 0;
  const circumference = Math.PI * 2 * radius;
  const filledLength = circumference * pct;

  return (
    <svg viewBox="0 0 140 140" style={{ width: '100%', maxWidth: 140 }}>
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
      />
      {/* Filled ring */}
      {pct > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#FF5500"
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          strokeLinecap="round"
          strokeDashoffset={-circumference * 0.25}
        />
      )}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={22} fontWeight="bold">
        {total > 0 ? Math.round(pct * 100) : 0}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={9}>
        {successful}/{total} deals
      </text>
    </svg>
  );
}

// ============================================================
// SVG #12: EarningsGrowthLine — 8-point line chart
// ============================================================
function EarningsGrowthLine({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const padX = 10;
  const padY = 10;
  const chartW = 220;
  const chartH = 100;
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = Math.max(maxVal - minVal, 1);

  const xStep = chartW / (values.length - 1);
  const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;
  const toX = (i: number) => padX + i * xStep;

  const linePoints = values
    .map((v, i) => `${toX(i)},${toY(v)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${chartW + padX * 2} ${chartH + padY + 20}`} style={{ width: '100%' }}>
      {/* Grid */}
      {[0, 1, 2, 3].map((gi) => (
        <line
          key={gi}
          x1={padX}
          y1={padY + (chartH / 3) * gi}
          x2={padX + chartW}
          y2={padY + (chartH / 3) * gi}
          stroke="#21262d"
          strokeWidth={1}
        />
      ))}
      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#CCFF00"
        strokeWidth={2}
      />
      {/* Data points */}
      {values.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill="#CCFF00" />
      ))}
      {/* Labels */}
      {labels.map((lbl, i) => (
        <text
          key={i}
          x={toX(i)}
          y={padY + chartH + 14}
          textAnchor="middle"
          fill="#8b949e"
          fontSize={8}
        >
          {lbl}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function ContractNegotiationEnhanced() {
  const gameState = useGameStore((state) => state.gameState);

  const [activeTab, setActiveTab] = useState('current');
  const [negotiationRound, setNegotiationRound] = useState(0);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [agentAdviceDismissed, setAgentAdviceDismissed] = useState(false);

  const handleStartNegotiation = useCallback(() => {
    setNegotiationRound(1);
    setShowCounterOffer(false);
  }, []);

  const handleSubmitCounter = useCallback(() => {
    setNegotiationRound((prev) => Math.min(prev + 1, 3));
    setShowCounterOffer(false);
  }, []);

  const handleDismissAdvice = useCallback(() => {
    setAgentAdviceDismissed(true);
  }, []);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#8b949e] text-sm">No active game state found.</p>
      </div>
    );
  }

  const player = gameState.player;
  const clubName = gameState.currentClub.name ?? 'FC Elite';
  const league = gameState.currentClub.league ?? 'Premier League';
  const contract = player.contract;
  const weeklyWage = contract.weeklyWage ?? 50;
  const yearsRemaining = contract.yearsRemaining ?? 3;
  const signingBonus = contract.signingBonus ?? 0;
  const releaseClause = contract.releaseClause ?? 0;
  const marketValue = player.marketValue ?? 10;
  const overall = player.overall ?? 65;
  const reputation = player.reputation ?? 50;
  const agentQuality = player.agentQuality ?? 50;
  const age = player.age ?? 22;
  const form = player.form ?? 6.0;
  const position = player.position ?? 'CM';
  const currentSeason = gameState.currentSeason ?? 1;
  const finances = gameState.currentClub.finances ?? 50;

  // Derived deterministic data using seeded random
  const seed = hashString(player.name + clubName + String(currentSeason));
  const rng = seededRandom(seed);

  const teamAvgSalary = Math.round(weeklyWage * (0.6 + rng() * 0.6));
  const leagueAvgSalary = Math.round(weeklyWage * (0.5 + rng() * 0.7));
  const topEarnerSalary = Math.round(weeklyWage * (1.5 + rng() * 1.0));
  const contractSecurity = Math.round(Math.min(100, (yearsRemaining / 5) * 100 + (player.squadStatus === 'starter' ? 15 : 0)));
  const goalBonus = Math.round(weeklyWage * (0.3 + rng() * 1.0));
  const appearanceBonus = Math.round(weeklyWage * (0.1 + rng() * 0.3));

  const negotiationPerformance = Math.round(Math.min(100, form * 10 + (overall > 80 ? 10 : 0)));
  const negotiationMarketVal = Math.round(Math.min(100, 30 + (marketValue / 5)));
  const negotiationLoyalty = Math.round(30 + rng() * 50);
  const negotiationAgentSkill = agentQuality;
  const negotiationLeverage = Math.round(
    Math.min(100, 20 + (reputation * 0.3) + (yearsRemaining <= 1 ? -15 : yearsRemaining <= 2 ? 5 : 10))
  );

  const offeredSalary = Math.round(weeklyWage * (1.05 + rng() * 0.3));
  const offeredBonus = Math.round(signingBonus * (0.8 + rng() * 0.5));
  const offeredDuration = yearsRemaining + 1;
  const offeredRelease = Math.round(releaseClause * (1.1 + rng() * 0.4));

  const currentMetrics = [weeklyWage, signingBonus, yearsRemaining * 20, releaseClause / 10, form * 10];
  const offeredMetrics = [offeredSalary, offeredBonus, offeredDuration * 20, offeredRelease / 10, form * 12];

  const agentPrioritySalary = Math.round(30 + rng() * 40);
  const agentPriorityBonus = Math.round(20 + rng() * 30);
  const agentPriorityDuration = Math.round(40 + rng() * 30);
  const agentPriorityRelease = Math.round(15 + rng() * 25);

  const marketValuesOverSeasons = (() => {
    const base = marketValue;
    return Array.from({ length: 8 }, (_, i) =>
      Math.round(base * (0.5 + i * 0.12 + (rng() - 0.5) * 0.15) * 10) / 10
    );
  })();

  const seasonLabels = (() =>
    Array.from({ length: 8 }, (_, i) => `S${currentSeason - 6 + i}`)
  )();

  const peerPlayers = (() =>
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.round((3 + rng() * 14) * 10) / 10,
      y: Math.round(weeklyWage * (0.4 + rng() * 1.2)),
      name: `Peer ${i + 1}`,
    }))
  )();

  const demandPosition = Math.round(40 + rng() * 50);
  const demandAge = Math.max(0, Math.round(100 - (age - 18) * 6));
  const demandForm = Math.round(form * 10);
  const demandMarket = Math.round(30 + rng() * 50);
  const demandCompetition = Math.round(20 + rng() * 60);

  const contractHistory = (() => {
    const clubs = ['Academy', 'U18', 'Reserves', clubName, clubName, clubName];
    return Array.from({ length: 6 }, (_, i) => ({
      year: `${currentSeason - 5 + i}`,
      value: Math.round(weeklyWage * (0.2 + i * 0.18 + rng() * 0.1)),
      club: clubs[i],
    }));
  })();

  const negotiationSuccessful = Math.round(3 + rng() * 6);
  const negotiationTotal = Math.round(negotiationSuccessful + 1 + rng() * 4);

  const earningsGrowthValues = (() => {
    const base = weeklyWage;
    return Array.from({ length: 8 }, (_, i) =>
      Math.round(base * (0.4 + i * 0.15 + (rng() - 0.3) * 0.1) * 10) / 10
    );
  })();
  const earningsLabels = Array.from({ length: 8 }, (_, i) => `Y${i + 1}`);

  // Card styling constants
  const cardBg = '#161b22';
  const borderColor = '#30363d';
  const textPrimary = '#c9d1d9';
  const textSecondary = '#8b949e';

  const getYearsBadgeBg = (years: number) => {
    if (years <= 1) return 'bg-[#FF5500]';
    if (years <= 2) return 'bg-[#CCFF00] text-[#0d1117]';
    return 'bg-[#00E5FF] text-[#0d1117]';
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-['Space_Grotesk']">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, backgroundColor: '#1a1f2b', borderRadius: 10 }}
          >
            <FileText className="h-5 w-5" style={{ color: '#FF5500' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>
              Contract Negotiation
            </h2>
            <p className="text-xs" style={{ color: textSecondary }}>
              {clubName} — {league}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="px-4 pb-4">
        <div
          className="grid grid-cols-3 gap-2"
        >
          {[
            { icon: DollarSign, label: 'Weekly Wage', value: formatCurrency(weeklyWage, 'K'), color: '#FF5500' },
            { icon: Clock, label: 'Years Left', value: `${yearsRemaining}yr`, color: yearsRemaining <= 1 ? '#FF5500' : '#CCFF00' },
            { icon: TrendingUp, label: 'Market Value', value: formatCurrency(marketValue, 'M'), color: '#00E5FF' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
              }}
            >
              <stat.icon className="h-4 w-4 mb-1" style={{ color: stat.color }} />
              <p className="text-[10px]" style={{ color: textSecondary }}>
                {stat.label}
              </p>
              <p className="text-sm font-bold" style={{ color: textPrimary }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="w-full grid grid-cols-4"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              height: 40,
            }}
          >
            {[
              { value: 'current', label: 'Current' },
              { value: 'negotiation', label: 'Negotiate' },
              { value: 'market', label: 'Market' },
              { value: 'history', label: 'History' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs font-medium data-[state=active]:bg-[#FF5500] data-[state=active]:text-white data-[state=active]:shadow-none rounded-lg"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ========== TAB 1: Current Contract ========== */}
          <TabsContent value="current">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              {/* Contract Details Card */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Contract Details
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, label: 'Weekly Wage', value: formatCurrency(weeklyWage, 'K'), color: '#FF5500' },
                    {
                      icon: Clock,
                      label: 'Years Remaining',
                      value: (
                        <Badge className={`${getYearsBadgeBg(yearsRemaining)} text-xs px-2 py-0.5`}>
                          {yearsRemaining} year{yearsRemaining !== 1 ? 's' : ''}
                        </Badge>
                      ),
                      color: '#CCFF00',
                    },
                    { icon: DollarSign, label: 'Signing Bonus', value: formatCurrency(signingBonus, 'K'), color: '#00E5FF' },
                    ...(releaseClause > 0
                      ? [{ icon: AlertTriangle, label: 'Release Clause', value: formatCurrency(releaseClause, 'M'), color: '#666666' }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2" style={{ color: textSecondary }}>
                        <row.icon className="h-3.5 w-3.5" style={{ color: row.color }} />
                        {row.label}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG 1: Salary Comparison Bars */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Salary Comparison
                </h3>
                <SalaryComparisonBars
                  mySalary={weeklyWage}
                  teamAvg={teamAvgSalary}
                  leagueAvg={leagueAvgSalary}
                  topEarner={topEarnerSalary}
                />
              </div>

              {/* SVG 2: Contract Security Gauge */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Contract Security
                </h3>
                <ContractSecurityGauge value={contractSecurity} label="Security" />
              </div>

              {/* SVG 3: Bonus Breakdown Donut */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Bonus Breakdown
                </h3>
                <div className="flex items-center gap-4">
                  <BonusBreakdownDonut
                    signing={signingBonus}
                    goal={goalBonus}
                    appearance={appearanceBonus}
                  />
                  <div className="space-y-2">
                    {[
                      { label: 'Signing', value: signingBonus, color: '#FF5500' },
                      { label: 'Goal', value: goalBonus, color: '#CCFF00' },
                      { label: 'Appearance', value: appearanceBonus, color: '#00E5FF' },
                    ].map((seg) => (
                      <div key={seg.label} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5"
                          style={{ backgroundColor: seg.color, borderRadius: 3 }}
                        />
                        <span className="text-[10px]" style={{ color: textSecondary }}>
                          {seg.label}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: textPrimary }}>
                          {formatCurrency(seg.value, 'K')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expiring Warning */}
              {yearsRemaining <= 1 && (
                <div
                  className="p-3 flex items-start gap-2"
                  style={{
                    backgroundColor: '#2a1215',
                    border: '1px solid #5c2128',
                    borderRadius: 10,
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#FF5500' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#FF5500' }}>
                      Contract Expiring!
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                      Your contract expires at the end of this season. Negotiate now.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigate to Negotiate */}
              <button
                onClick={() => setActiveTab('negotiation')}
                className="w-full py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#FF5500',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Handshake className="h-4 w-4" />
                Start Negotiation
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          </TabsContent>

          {/* ========== TAB 2: Negotiation ========== */}
          <TabsContent value="negotiation">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              {/* Negotiation Status */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
                    Negotiation Status
                  </h3>
                  <Badge className="bg-[#FF5500] text-white text-[10px] px-2 py-0.5">
                    Round {negotiationRound || '—'}
                  </Badge>
                </div>
                {negotiationRound === 0 ? (
                  <div className="text-center py-4">
                    <Scale className="h-8 w-8 mx-auto mb-2" style={{ color: '#CCFF00' }} />
                    <p className="text-sm mb-3" style={{ color: textPrimary }}>
                      Ready to negotiate your new contract with {clubName}
                    </p>
                    <button
                      onClick={handleStartNegotiation}
                      className="px-6 py-2 text-sm font-semibold text-white"
                      style={{
                        backgroundColor: '#FF5500',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Begin Negotiations
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Current offer summary */}
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <span className="text-sm" style={{ color: textSecondary }}>Offered Wage</span>
                      <span className="text-sm font-bold" style={{ color: '#CCFF00' }}>
                        {formatCurrency(offeredSalary, 'K')}
                        <ArrowUpRight className="inline h-3 w-3 ml-1" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <span className="text-sm" style={{ color: textSecondary }}>Duration</span>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>
                        {offeredDuration} years
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <span className="text-sm" style={{ color: textSecondary }}>Signing Bonus</span>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>
                        {formatCurrency(offeredBonus, 'K')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm" style={{ color: textSecondary }}>Release Clause</span>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>
                        {formatCurrency(offeredRelease, 'M')}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        className="flex-1 py-2 text-xs font-semibold"
                        style={{
                          backgroundColor: '#1a3a1a',
                          color: '#CCFF00',
                          borderRadius: 8,
                          border: '1px solid #2d5a2d',
                          cursor: 'pointer',
                        }}
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => setShowCounterOffer(true)}
                        className="flex-1 py-2 text-xs font-semibold"
                        style={{
                          backgroundColor: '#2a2010',
                          color: '#FF5500',
                          borderRadius: 8,
                          border: '1px solid #4a3520',
                          cursor: 'pointer',
                        }}
                      >
                        Counter Offer
                      </button>
                    </div>
                    {showCounterOffer && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 mt-2"
                        style={{
                          backgroundColor: '#1a1f2b',
                          border: `1px solid ${borderColor}`,
                          borderRadius: 8,
                        }}
                      >
                        <p className="text-xs mb-2" style={{ color: textSecondary }}>
                          Your agent suggests countering with higher terms based on your performance.
                        </p>
                        <button
                          onClick={handleSubmitCounter}
                          className="w-full py-2 text-xs font-semibold text-white"
                          style={{
                            backgroundColor: '#FF5500',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Submit Counter Offer (Round {negotiationRound + 1})
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* SVG 4: Negotiation Power Radar */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Negotiation Power
                </h3>
                <NegotiationPowerRadar
                  performance={negotiationPerformance}
                  marketValue={negotiationMarketVal}
                  loyalty={negotiationLoyalty}
                  agentSkill={negotiationAgentSkill}
                  leverage={negotiationLeverage}
                />
              </div>

              {/* SVG 5: Offer Comparison Butterfly */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Offer Comparison
                </h3>
                <OfferComparisonButterfly
                  current={currentMetrics}
                  offered={offeredMetrics}
                  labels={['Wage', 'Bonus', 'Duration', 'Release', 'Form']}
                />
              </div>

              {/* SVG 6: Agent Recommendation Bars */}
              {!agentAdviceDismissed ? (
                <div
                  className="p-4"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 10,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
                      <MessageSquare className="inline h-3 w-3 mr-1" style={{ color: '#FF5500' }} />
                      Agent Priorities
                    </h3>
                    <button
                      onClick={handleDismissAdvice}
                      className="text-[10px]"
                      style={{ color: textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                  <AgentRecommendationBars
                    salary={agentPrioritySalary}
                    bonus={agentPriorityBonus}
                    duration={agentPriorityDuration}
                    releaseClause={agentPriorityRelease}
                  />
                </div>
              ) : null}
            </motion.div>
          </TabsContent>

          {/* ========== TAB 3: Market Analysis ========== */}
          <TabsContent value="market">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              {/* Market Overview */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  <BarChart3 className="inline h-3 w-3 mr-1" style={{ color: '#00E5FF' }} />
                  Market Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Your Value', value: formatCurrency(marketValue, 'M'), icon: TrendingUp, color: '#00E5FF' },
                    { label: 'Position', value: position, icon: Target, color: '#FF5500' },
                    { label: 'Overall', value: `${overall}`, icon: Award, color: '#CCFF00' },
                    { label: 'Reputation', value: `${reputation}/100`, icon: Users, color: '#666666' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-2.5"
                      style={{
                        backgroundColor: '#1a1f2b',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5 mb-1" style={{ color: item.color }} />
                      <p className="text-[10px]" style={{ color: textSecondary }}>{item.label}</p>
                      <p className="text-sm font-bold" style={{ color: textPrimary }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG 7: Market Value Trend Area */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Market Value Trend
                </h3>
                <MarketValueTrendArea values={marketValuesOverSeasons} seasonLabels={seasonLabels} />
              </div>

              {/* SVG 8: Peer Salary Scatter */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Peer Salary Comparison
                </h3>
                <PeerSalaryScatter
                  peers={peerPlayers}
                  playerX={age - 16}
                  playerY={weeklyWage}
                />
                <p className="text-[10px] mt-2" style={{ color: textSecondary }}>
                  <span style={{ color: '#FF5500' }}>●</span> Peer players &nbsp;
                  <span style={{ color: '#FF5500' }}>◉</span> You
                </p>
              </div>

              {/* SVG 9: Demand vs Supply Radar */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Demand vs Supply
                </h3>
                <DemandVsSupplyRadar
                  positionDemand={demandPosition}
                  ageFactor={demandAge}
                  form={demandForm}
                  market={demandMarket}
                  competition={demandCompetition}
                />
              </div>

              {/* Market Insight */}
              <div
                className="p-3 flex items-start gap-2"
                style={{
                  backgroundColor: '#0f2027',
                  border: '1px solid #1a3a3a',
                  borderRadius: 10,
                }}
              >
                <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#00E5FF' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#00E5FF' }}>
                    Market Insight
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: textSecondary }}>
                    Your position ({position}) is in {demandPosition > 60 ? 'high' : 'moderate'} demand.
                    {demandAge > 60
                      ? ' Your age is favorable for long-term contracts.'
                      : ' Consider shorter deals to maximize earnings.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ========== TAB 4: History ========== */}
          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 mt-4"
            >
              {/* SVG 10: Contract History Timeline */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  <History className="inline h-3 w-3 mr-1" style={{ color: '#00E5FF' }} />
                  Contract History
                </h3>
                <ContractHistoryTimeline contracts={contractHistory} />
              </div>

              {/* SVG 11: Negotiation Success Rate Ring */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Negotiation Track Record
                </h3>
                <div className="flex items-center gap-4">
                  <NegotiationSuccessRateRing
                    successful={negotiationSuccessful}
                    total={negotiationTotal}
                  />
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px]" style={{ color: textSecondary }}>Successful</p>
                      <p className="text-lg font-bold" style={{ color: '#FF5500' }}>{negotiationSuccessful}</p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: textSecondary }}>Failed</p>
                      <p className="text-lg font-bold" style={{ color: '#666666' }}>
                        {negotiationTotal - negotiationSuccessful}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: textSecondary }}>Total Deals</p>
                      <p className="text-lg font-bold" style={{ color: textPrimary }}>{negotiationTotal}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SVG 12: Earnings Growth Line */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Earnings Growth
                </h3>
                <EarningsGrowthLine values={earningsGrowthValues} labels={earningsLabels} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px]" style={{ color: textSecondary }}>
                    First: {formatCurrency(earningsGrowthValues[0], 'K')}/wk
                  </span>
                  <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#CCFF00' }}>
                    <ArrowUpRight className="h-3 w-3" />
                    Latest: {formatCurrency(earningsGrowthValues[earningsGrowthValues.length - 1], 'K')}/wk
                  </span>
                </div>
              </div>

              {/* Career Financial Summary */}
              <div
                className="p-4"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  <Briefcase className="inline h-3 w-3 mr-1" style={{ color: '#FF5500' }} />
                  Career Financial Summary
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: 'Career Earnings',
                      value: formatCurrency(
                        earningsGrowthValues.reduce((sum, v) => sum + v * 52, 0),
                        'M'
                      ),
                      color: '#CCFF00',
                    },
                    {
                      label: 'Total Bonuses Earned',
                      value: formatCurrency(
                        contractHistory.reduce((sum, c) => sum + c.value * 0.15, 0),
                        'K'
                      ),
                      color: '#00E5FF',
                    },
                    {
                      label: 'Clubs Represented',
                      value: `${(() => {
                        const unique = new Set(contractHistory.map((c) => c.club));
                        return unique.size;
                      })()}`,
                      color: '#FF5500',
                    },
                    {
                      label: 'Avg Wage Growth/Year',
                      value: (() => {
                        const first = earningsGrowthValues[0] || 1;
                        const last = earningsGrowthValues[earningsGrowthValues.length - 1] || first;
                        const growth = ((last - first) / first) * 100 / Math.max(earningsGrowthValues.length - 1, 1);
                        return `${growth.toFixed(1)}%`;
                      })(),
                      color: '#666666',
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: `1px solid ${borderColor}` }}
                    >
                      <span className="text-xs" style={{ color: textSecondary }}>
                        {row.label}
                      </span>
                      <span className="text-xs font-bold" style={{ color: row.color }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract Milestone */}
              <div
                className="p-3 flex items-start gap-2"
                style={{
                  backgroundColor: '#1a1f0a',
                  border: '1px solid #2a3a15',
                  borderRadius: 10,
                }}
              >
                <Zap className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#CCFF00' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#CCFF00' }}>
                    Contract Milestone
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: textSecondary }}>
                    {yearsRemaining >= 3
                      ? `You have strong contract security with ${yearsRemaining} years remaining.`
                      : yearsRemaining >= 2
                        ? 'Your contract is stable but consider renewing to lock in better terms.'
                        : 'Your contract is expiring soon. Priority: secure a new deal immediately.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
