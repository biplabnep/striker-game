'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Crown, Star, Trophy, TrendingUp, Users, Globe, Award,
  Heart, Zap, Shield, BookOpen, Flame, Calendar, Target, Gem,
} from 'lucide-react';

/* ================================================================
   Seeded PRNG — deterministic pseudo-random for stable visuals
   ================================================================ */

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(playerName: string, week: number, extra: string = ''): number {
  const seed = hashSeed(`${playerName}-clpe-w${week}-${extra}`);
  return mulberry32(seed)();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

/* ================================================================
   Animation helpers
   ================================================================ */

const D = 0.04;
const A = { duration: 0.18, ease: 'easeOut' as const };

/* ================================================================
   Design tokens
   ================================================================ */

const C = {
  orange: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  gray: '#666666',
  bgDeep: '#0d1117',
  bgCard: '#161b22',
  bgBar: '#21262d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#484f58',
  border: '#30363d',
} as const;

/* ================================================================
   SVG Sub-Component 1: LegacyScoreRing
   Circular ring showing legacy score 0-100
   ================================================================ */

function LegacyScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(1, (size / 2) - 12);
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Legacy score: ${Math.round(clamped)}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.bgBar} strokeWidth="8" />
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke={C.orange} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={C.textPrimary} fontSize="28" fontWeight="900">
        {Math.round(clamped)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textSecondary} fontSize="10" fontWeight="600">
        LEGACY
      </text>
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 2: CareerPhaseTimeline
   8-node horizontal timeline (Youth → Reserve → First Team → Star →
   Captain → Legend → Hall of Fame → Icon)
   ================================================================ */

const CAREER_PHASES = [
  'Youth', 'Reserve', 'First Team', 'Star',
  'Captain', 'Legend', 'Hall of Fame', 'Icon',
];

function CareerPhaseTimeline({ currentPhase, playerName, week }: {
  currentPhase: number;
  playerName: string;
  week: number;
}) {
  const nodeCount = CAREER_PHASES.length;
  const svgW = 320;
  const svgH = 80;
  const padX = 16;
  const spacing = (svgW - padX * 2) / (nodeCount - 1);
  const nodeY = 32;

  const nodes = CAREER_PHASES.map((label, i) => {
    const x = padX + i * spacing;
    const isActive = i <= currentPhase;
    const isCurrent = i === currentPhase;
    const dotR = isCurrent ? 7 : 5;

    return { x, y: nodeY, label, isActive, isCurrent, dotR, i };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} aria-label="Career phase timeline">
      {/* connector line */}
      <line
        x1={padX} y1={nodeY} x2={svgW - padX} y2={nodeY}
        stroke={C.bgBar} strokeWidth="2"
      />
      {nodes.map((n) => (
        <g key={n.i}>
          <circle
            cx={n.x} cy={n.y} r={n.dotR}
            fill={n.isActive ? C.cyan : C.bgBar}
            stroke={n.isCurrent ? C.cyan : 'none'}
            strokeWidth={n.isCurrent ? 2 : 0}
          />
          <text
            x={n.x} y={n.y + 20}
            textAnchor="middle" fill={n.isActive ? C.textPrimary : C.textMuted}
            fontSize="7" fontWeight="600"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 3: LegacyBreakdownDonut
   5-segment donut: Goals / Assists / Appearances / Trophies / Records
   ================================================================ */

function LegacyBreakdownDonut({ segments, playerName, week }: {
  segments: { label: string; value: number; color: string }[];
  playerName: string;
  week: number;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = Math.max(1, size / 2 - 8);
  const innerR = Math.max(1, outerR - 20);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; path: string; pct: number }>>((acc, seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const cumSum = acc.reduce((s, a) => s + a.pct, 0);
    const startAngle = cumSum * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumSum + pct) * 2 * Math.PI - Math.PI / 2;
    const largeArc = pct > 0.5 ? 1 : 0;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);

    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);

    const path = pct > 0
      ? `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`
      : '';

    return [...acc, { ...seg, path, pct }];
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Legacy breakdown">
      {arcs.map((arc, i) => (
        <g key={i}>
          {arc.path && <path d={arc.path} fill={arc.color} opacity={0.9} />}
        </g>
      ))}
      <text x={cx} y={cy - 2} textAnchor="middle" fill={C.textPrimary} fontSize="14" fontWeight="800">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={C.textSecondary} fontSize="8" fontWeight="600">
        TOTAL PTS
      </text>
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 4: TrophyCabinetRadar
   5-axis radar: League / Cup / Super Cup / Continental / International
   ================================================================ */

function TrophyCabinetRadar({ values }: { values: number[] }) {
  const svgW = 200;
  const svgH = 200;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const maxR = Math.max(1, 72);
  const axes = 5;
  const angleStep = (2 * Math.PI) / axes;
  const startAngle = -Math.PI / 2;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const points = values.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const r = Math.max(0, Math.min(1, val / 100)) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const pointString = points.map((p) => `${p.x},${p.y}`).join(' ');

  const labels = ['League', 'Cup', 'Super Cup', 'Continental', 'Intl'];

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} aria-label="Trophy cabinet radar">
      {gridLevels.map((level, gi) => {
        const gridR = Math.max(1, level * maxR);
        const gridPoints = Array.from({ length: axes }, (_, i) => {
          const angle = startAngle + i * angleStep;
          return `${cx + gridR * Math.cos(angle)},${cy + gridR * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={gi} points={gridPoints} fill="none" stroke={C.bgBar} strokeWidth="1" />;
      })}
      {/* axis lines */}
      {Array.from({ length: axes }, (_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke={C.bgBar} strokeWidth="1"
          />
        );
      })}
      {/* data polygon */}
      {pointString && <polygon points={pointString} fill={C.lime} fillOpacity="0.15" stroke={C.lime} strokeWidth="1.5" />}
      {/* data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.lime} />
      ))}
      {/* labels */}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = maxR + 14;
        return (
          <text
            key={i}
            x={cx + labelR * Math.cos(angle)}
            y={cy + labelR * Math.sin(angle) + 3}
            textAnchor="middle" fill={C.textSecondary} fontSize="8" fontWeight="600"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 5: RecordComparisonBars
   5 horizontal bars comparing player vs club all-time
   ================================================================ */

function RecordComparisonBars({ records, playerName, week }: {
  records: { label: string; player: number; clubRecord: number }[];
  playerName: string;
  week: number;
}) {
  const svgW = 300;
  const barH = 14;
  const gap = 10;
  const labelW = 80;
  const barAreaW = svgW - labelW - 40;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${records.length * (barH * 2 + gap)}`} aria-label="Record comparison">
      {records.map((rec, i) => {
        const baseY = i * (barH * 2 + gap);
        const maxVal = Math.max(rec.player, rec.clubRecord, 1);
        const playerW = Math.max(0, (rec.player / maxVal) * barAreaW);
        const clubW = Math.max(0, (rec.clubRecord / maxVal) * barAreaW);

        return (
          <g key={i}>
            <text x={0} y={baseY + barH} fill={C.textSecondary} fontSize="9" fontWeight="600" dominantBaseline="middle">
              {rec.label}
            </text>
            {/* player bar */}
            <rect x={labelW} y={baseY} width={playerW} height={barH} rx="2" fill={C.orange} opacity="0.9" />
            <text x={labelW + playerW + 4} y={baseY + barH} fill={C.textPrimary} fontSize="8" dominantBaseline="middle">
              {rec.player}
            </text>
            {/* club record bar */}
            <rect x={labelW} y={baseY + barH + 3} width={clubW} height={barH} rx="2" fill={C.bgBar} opacity="0.9" />
            <text x={labelW + clubW + 4} y={baseY + barH * 2 + 3} fill={C.textMuted} fontSize="8" dominantBaseline="middle">
              {rec.clubRecord}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 6: AchievementMilestoneRing
   Circular ring showing milestones unlocked / total
   ================================================================ */

function AchievementMilestoneRing({ unlocked, total }: { unlocked: number; total: number }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(1, (size / 2) - 12);
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? unlocked / total : 0;
  const dashOffset = circumference - pct * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Milestones: ${unlocked}/${total}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.bgBar} strokeWidth="8" />
      <circle
        cx={cx} cy={cy} r={radius} fill="none"
        stroke={C.cyan} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={C.textPrimary} fontSize="22" fontWeight="900">
        {unlocked}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={C.textSecondary} fontSize="9" fontWeight="600">
        of {total}
      </text>
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 7: FanConnectionGauge
   Semi-circular gauge 0-100
   ================================================================ */

function FanConnectionGauge({ value, size = 200 }: { value: number; size?: number }) {
  const cx = size / 2;
  const cy = size - 20;
  const radius = Math.max(1, size / 2 - 24);
  const clamped = Math.min(100, Math.max(0, value));

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const sweepAngle = endAngle - startAngle;
  const valueAngle = startAngle + (clamped / 100) * sweepAngle;

  const arcPath = (start: number, end: number, r: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = (end - start) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const bgArc = arcPath(startAngle, endAngle, radius);
  const valueArc = arcPath(startAngle, valueAngle, radius);

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size - 20}`} aria-label={`Fan connection: ${Math.round(clamped)}`}>
      <path d={bgArc} fill="none" stroke={C.bgBar} strokeWidth="12" strokeLinecap="round" />
      <path d={valueArc} fill="none" stroke={C.lime} strokeWidth="12" strokeLinecap="round" />
      <text x={cx} y={cy - 20} textAnchor="middle" fill={C.textPrimary} fontSize="24" fontWeight="900">
        {Math.round(clamped)}
      </text>
      <text x={cx} y={cy - 4} textAnchor="middle" fill={C.textSecondary} fontSize="9" fontWeight="600">
        FAN CONNECTION
      </text>
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 8: MediaPresenceBars
   4 horizontal bars: Social Media / Press / TV / Interviews
   ================================================================ */

function MediaPresenceBars({ values, colors, labels }: {
  values: number[];
  colors: string[];
  labels: string[];
}) {
  const svgW = 300;
  const barH = 16;
  const gap = 14;
  const labelW = 88;
  const barAreaW = svgW - labelW - 44;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${values.length * (barH + gap)}`} aria-label="Media presence">
      {values.map((val, i) => {
        const baseY = i * (barH + gap);
        const barW = Math.max(0, (val / 100) * barAreaW);
        return (
          <g key={i}>
            <text x={0} y={baseY + barH - 2} fill={C.textSecondary} fontSize="9" fontWeight="600" dominantBaseline="middle">
              {labels[i]}
            </text>
            <rect x={labelW} y={baseY} width={barW} height={barH} rx="3" fill={colors[i]} opacity="0.85" />
            <text x={labelW + barW + 6} y={baseY + barH - 2} fill={C.textPrimary} fontSize="9" fontWeight="700" dominantBaseline="middle">
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 9: ClubImpactRadar
   5-axis radar: Goals / Leadership / Morale / Revenue / Youth Dev
   ================================================================ */

function ClubImpactRadar({ values }: { values: number[] }) {
  const svgW = 200;
  const svgH = 200;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const maxR = Math.max(1, 68);
  const axes = 5;
  const angleStep = (2 * Math.PI) / axes;
  const startAngle = -Math.PI / 2;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const points = values.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const r = Math.max(0, Math.min(1, val / 100)) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const pointString = points.map((p) => `${p.x},${p.y}`).join(' ');
  const labels = ['Goals', 'Leadership', 'Morale', 'Revenue', 'Youth'];

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} aria-label="Club impact radar">
      {gridLevels.map((level, gi) => {
        const gridR = Math.max(1, level * maxR);
        const gridPoints = Array.from({ length: axes }, (_, i) => {
          const angle = startAngle + i * angleStep;
          return `${cx + gridR * Math.cos(angle)},${cy + gridR * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={gi} points={gridPoints} fill="none" stroke={C.bgBar} strokeWidth="1" />;
      })}
      {Array.from({ length: axes }, (_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke={C.bgBar} strokeWidth="1"
          />
        );
      })}
      {pointString && <polygon points={pointString} fill={C.orange} fillOpacity="0.15" stroke={C.orange} strokeWidth="1.5" />}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.orange} />
      ))}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = maxR + 14;
        return (
          <text
            key={i}
            x={cx + labelR * Math.cos(angle)}
            y={cy + labelR * Math.sin(angle) + 3}
            textAnchor="middle" fill={C.textSecondary} fontSize="8" fontWeight="600"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 10: HallOfFameProbabilityGauge
   Semi-circular gauge 0-100%
   ================================================================ */

function HallOfFameProbabilityGauge({ probability }: { probability: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size - 20;
  const radius = Math.max(1, size / 2 - 24);
  const clamped = Math.min(100, Math.max(0, probability));

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const sweepAngle = endAngle - startAngle;
  const valueAngle = startAngle + (clamped / 100) * sweepAngle;

  const arcPath = (start: number, end: number, r: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = (end - start) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const bgArc = arcPath(startAngle, endAngle, radius);
  const valueArc = arcPath(startAngle, valueAngle, radius);

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size - 20}`} aria-label={`HoF probability: ${Math.round(clamped)}%`}>
      <path d={bgArc} fill="none" stroke={C.bgBar} strokeWidth="12" strokeLinecap="round" />
      <path d={valueArc} fill="none" stroke={C.lime} strokeWidth="12" strokeLinecap="round" />
      <text x={cx} y={cy - 20} textAnchor="middle" fill={C.textPrimary} fontSize="22" fontWeight="900">
        {Math.round(clamped)}%
      </text>
      <text x={cx} y={cy - 4} textAnchor="middle" fill={C.textSecondary} fontSize="8" fontWeight="600">
        HALL OF FAME ODDS
      </text>
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 11: PostCareerOptionsBars
   5 horizontal bars: Management / Punditry / Coaching / Ambassador / Ownership
   ================================================================ */

function PostCareerOptionsBars({ values, colors, labels }: {
  values: number[];
  colors: string[];
  labels: string[];
}) {
  const svgW = 300;
  const barH = 16;
  const gap = 14;
  const labelW = 88;
  const barAreaW = svgW - labelW - 44;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${values.length * (barH + gap)}`} aria-label="Post-career options">
      {values.map((val, i) => {
        const baseY = i * (barH + gap);
        const barW = Math.max(0, (val / 100) * barAreaW);
        return (
          <g key={i}>
            <text x={0} y={baseY + barH - 2} fill={C.textSecondary} fontSize="9" fontWeight="600" dominantBaseline="middle">
              {labels[i]}
            </text>
            <rect x={labelW} y={baseY} width={barW} height={barH} rx="3" fill={colors[i]} opacity="0.85" />
            <text x={labelW + barW + 6} y={baseY + barH - 2} fill={C.textPrimary} fontSize="9" fontWeight="700" dominantBaseline="middle">
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ================================================================
   SVG Sub-Component 12: LegacyProjectionLine
   8-point line chart: projected legacy over next 8 seasons
   ================================================================ */

function LegacyProjectionLine({ data }: { data: number[] }) {
  const svgW = 320;
  const svgH = 120;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 20;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = Math.max(maxVal - minVal, 1);

  const points = data.map((val, i) => {
    const x = padL + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = padT + plotH - ((val - minVal) / range) * plotH;
    return `${x},${y}`;
  });

  const gridLines = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} aria-label="Legacy projection">
      {gridLines.map((pct, gi) => {
        const y = padT + plotH - pct * plotH;
        const val = Math.round(minVal + pct * range);
        return (
          <g key={gi}>
            <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={C.bgBar} strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fill={C.textMuted} fontSize="7">{val}</text>
          </g>
        );
      })}
      {points.length > 1 && (
        <polyline points={points.join(' ')} fill="none" stroke={C.cyan} strokeWidth="2" strokeLinejoin="round" />
      )}
      {data.map((val, i) => {
        const x = padL + (i / Math.max(data.length - 1, 1)) * plotW;
        const y = padT + plotH - ((val - minVal) / range) * plotH;
        return <circle key={i} cx={x} cy={y} r="3" fill={C.cyan} />;
      })}
      {data.map((_, i) => {
        const x = padL + (i / Math.max(data.length - 1, 1)) * plotW;
        return (
          <text key={i} x={x} y={svgH - 4} textAnchor="middle" fill={C.textMuted} fontSize="7">
            S{i + 1}
          </text>
        );
      })}
    </svg>
  );
}

/* ================================================================
   Tab 1: Overview — Legacy score, career summary
   ================================================================ */

function OverviewTab({
  playerName, currentSeason, currentWeek, goals, assists, appearances,
  trophies, reputation, totalSeasons,
}: {
  playerName: string;
  currentSeason: number;
  currentWeek: number;
  goals: number;
  assists: number;
  appearances: number;
  trophies: number;
  reputation: number;
  totalSeasons: number;
}) {
  const legacyScore = useMemo(() => {
    const raw = goals * 2 + assists * 1.5 + appearances * 0.1 + trophies * 8 + reputation * 0.3 + totalSeasons * 3;
    return Math.min(100, Math.max(0, raw));
  }, [goals, assists, appearances, trophies, reputation, totalSeasons]);

  const careerPhase = useMemo(() => {
    if (totalSeasons <= 1) return 0;
    if (totalSeasons <= 2) return 1;
    if (totalSeasons <= 4) return 2;
    if (totalSeasons <= 6 && reputation >= 40) return 3;
    if (totalSeasons <= 8 && reputation >= 55) return 4;
    if (trophies >= 3 && reputation >= 65) return 5;
    if (trophies >= 6 && reputation >= 80) return 6;
    return 7;
  }, [totalSeasons, reputation, trophies]);

  const donutSegments = useMemo(() => [
    { label: 'Goals', value: goals * 2, color: C.orange },
    { label: 'Assists', value: assists * 1.5, color: C.lime },
    { label: 'Apps', value: appearances * 0.1, color: C.cyan },
    { label: 'Trophies', value: trophies * 8, color: C.gray },
    { label: 'Rep', value: reputation * 0.3, color: C.orange },
  ], [goals, assists, appearances, trophies, reputation]);

  const summaryStats = useMemo(() => [
    { icon: <Target className="h-4 w-4" />, value: goals, label: 'Goals', color: 'text-[#FF5500]' },
    { icon: <Zap className="h-4 w-4" />, value: assists, label: 'Assists', color: 'text-[#CCFF00]' },
    { icon: <Calendar className="h-4 w-4" />, value: appearances, label: 'Appearances', color: 'text-[#00E5FF]' },
    { icon: <Trophy className="h-4 w-4" />, value: trophies, label: 'Trophies', color: 'text-[#FF5500]' },
    { icon: <Star className="h-4 w-4" />, value: reputation, label: 'Reputation', color: 'text-[#CCFF00]' },
    { icon: <Flame className="h-4 w-4" />, value: totalSeasons, label: 'Seasons', color: 'text-[#00E5FF]' },
  ], [goals, assists, appearances, trophies, reputation, totalSeasons]);

  const efficiencyStats = useMemo(() => ({
    goalsPerGame: appearances > 0 ? (goals / appearances) : 0,
    assistsPerGame: appearances > 0 ? (assists / appearances) : 0,
    goalsPerSeason: totalSeasons > 0 ? goals / totalSeasons : 0,
    assistsPerSeason: totalSeasons > 0 ? assists / totalSeasons : 0,
  }), [goals, assists, appearances, totalSeasons]);

  const reputationTier = useMemo(() => {
    if (reputation >= 85) return { name: 'World Class', color: '#FF5500' };
    if (reputation >= 70) return { name: 'International', color: '#CCFF00' };
    if (reputation >= 55) return { name: 'National', color: '#00E5FF' };
    if (reputation >= 35) return { name: 'Regional', color: '#c9d1d9' };
    return { name: 'Local', color: '#666666' };
  }, [reputation]);

  return (
    <div className="space-y-4">
      {/* Legacy Score Ring */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}
      >
        <div className="flex items-center gap-2 self-start">
          <Crown className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Legacy Score</h3>
        </div>
        <LegacyScoreRing score={legacyScore} />
      </motion.div>

      {/* Career Phase Timeline */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Career Phase</h3>
        </div>
        <CareerPhaseTimeline currentPhase={careerPhase} playerName={playerName} week={currentWeek} />
        <p className="text-center text-xs text-[#8b949e] mt-2">
          Current: <span className="text-[#00E5FF] font-bold">{CAREER_PHASES[careerPhase]}</span>
        </p>
      </motion.div>

      {/* Career Summary Grid */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}
      >
        <div className="grid grid-cols-2 gap-3">
          {summaryStats.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-[#21262d] rounded-lg">
              <span className={item.color}>{item.icon}</span>
              <div>
                <p className={`text-base font-bold tabular-nums ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-[#8b949e]">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Efficiency Stats */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Efficiency Metrics</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Goals/Game', value: efficiencyStats.goalsPerGame.toFixed(2), color: 'text-[#FF5500]' },
            { label: 'Assists/Game', value: efficiencyStats.assistsPerGame.toFixed(2), color: 'text-[#CCFF00]' },
            { label: 'Goals/Season', value: efficiencyStats.goalsPerSeason.toFixed(1), color: 'text-[#00E5FF]' },
            { label: 'Assists/Season', value: efficiencyStats.assistsPerSeason.toFixed(1), color: 'text-[#c9d1d9]' },
          ].map((item, i) => (
            <div key={i} className="p-2 bg-[#21262d] rounded-lg text-center">
              <p className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-[9px] text-[#8b949e]">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reputation Tier Card */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Reputation Tier</h3>
        </div>
        <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: reputationTier.color + '20', color: reputationTier.color }}
          >
            {reputation}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: reputationTier.color }}>{reputationTier.name}</p>
            <p className="text-[10px] text-[#8b949e]">
              {reputation >= 85 ? 'Recognised worldwide as one of the greats' : reputation >= 70 ? 'Known across multiple countries' : reputation >= 55 ? 'Household name domestically' : reputation >= 35 ? 'Well-known in your region' : 'Building your name locally'}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full rounded-sm"
            style={{ backgroundColor: reputationTier.color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${reputation}%` }}
            transition={{ ...A, width: { duration: 0.5, ease: 'easeOut' as const } }}
          />
        </div>
      </motion.div>

      {/* Legacy Breakdown Donut */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}
      >
        <div className="flex items-center gap-2 self-start">
          <Gem className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Legacy Breakdown</h3>
        </div>
        <LegacyBreakdownDonut segments={donutSegments} playerName={playerName} week={currentWeek} />
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {donutSegments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-[9px] text-[#8b949e]">{seg.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Legacy Tier Badge */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 6 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Legacy Tier</h3>
        </div>
        {(() => {
          const tiers = [
            { name: 'Local Hero', min: 0, color: '#666666', icon: <Shield className="h-5 w-5" /> },
            { name: 'Rising Star', min: 20, color: '#c9d1d9', icon: <Star className="h-5 w-5" /> },
            { name: 'Club Legend', min: 40, color: '#00E5FF', icon: <Heart className="h-5 w-5" /> },
            { name: 'National Hero', min: 60, color: '#CCFF00', icon: <Award className="h-5 w-5" /> },
            { name: 'Global Icon', min: 80, color: '#FF5500', icon: <Crown className="h-5 w-5" /> },
          ];
          const currentTier = [...tiers].reverse().find(t => legacyScore >= t.min) ?? tiers[0];
          const nextTier = tiers.find(t => t.min > legacyScore);
          const progressToNext = nextTier
            ? ((legacyScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100
            : 100;
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: currentTier.color + '10', borderColor: currentTier.color + '30' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentTier.color + '20' }}>
                  <span style={{ color: currentTier.color }}>{currentTier.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: currentTier.color }}>{currentTier.name}</p>
                  <p className="text-[10px] text-[#8b949e]">Legacy Score: {Math.round(legacyScore)}/100</p>
                </div>
              </div>
              {nextTier && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b949e]">Progress to {nextTier.name}</span>
                    <span className="text-[10px] text-[#8b949e] tabular-nums">{Math.round(progressToNext)}%</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      style={{ backgroundColor: currentTier.color }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, width: `${Math.min(100, progressToNext)}%` }}
                      transition={{ ...A, width: { duration: 0.5, ease: 'easeOut' as const } }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-2">
                {tiers.map((tier, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tier.color + (legacyScore >= tier.min ? '20' : '05') }}>
                      <span style={{ color: legacyScore >= tier.min ? tier.color : '#484f58' }}>{tier.icon}</span>
                    </div>
                    <span className={`text-[7px] font-bold text-center leading-tight ${legacyScore >= tier.min ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                      {tier.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* Season-by-Season Performance Snapshot */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 7 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Season Snapshot</h3>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Array.from({ length: Math.min(totalSeasons, 6) }, (_, i) => {
            const sGoals = seededInt(playerName, currentWeek, `snap-g-${i}`, 0, Math.max(goals, 5));
            const sAssists = seededInt(playerName, currentWeek, `snap-a-${i}`, 0, Math.max(assists, 3));
            const sApps = seededInt(playerName, currentWeek, `snap-app-${i}`, 5, Math.max(appearances, 20));
            const sRating = (5 + seededRandom(playerName, currentWeek, `snap-r-${i}`) * 4).toFixed(1);
            return (
              <div key={i} className="flex items-center gap-2 p-2 bg-[#21262d] rounded-lg">
                <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center bg-[#00E5FF]/10">
                  <span className="text-xs font-bold text-[#00E5FF]">S{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#FF5500] font-bold tabular-nums">{sGoals}G</span>
                    <span className="text-[10px] text-[#CCFF00] font-bold tabular-nums">{sAssists}A</span>
                    <span className="text-[10px] text-[#8b949e] tabular-nums">{sApps}Apps</span>
                  </div>
                  <p className="text-[9px] text-[#484f58]">Avg Rating: {sRating}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Tab 2: Achievements — Trophies, records, milestones
   ================================================================ */

function AchievementsTab({
  playerName, currentSeason, currentWeek, goals, assists, appearances,
  trophies, achievements, reputation, totalSeasons,
}: {
  playerName: string;
  currentSeason: number;
  currentWeek: number;
  goals: number;
  assists: number;
  appearances: number;
  trophies: number;
  achievements: { id: string; unlocked: boolean }[];
  reputation: number;
  totalSeasons: number;
}) {
  const radarValues = useMemo(() => [
    seededInt(playerName, currentWeek, 'league-trophies', 0, Math.min(trophies * 15, 100)),
    seededInt(playerName, currentWeek, 'cup-trophies', 0, Math.min(trophies * 10, 100)),
    seededInt(playerName, currentWeek, 'super-cup', 0, Math.min(trophies * 5, 100)),
    seededInt(playerName, currentWeek, 'continental', 0, Math.min(reputation * 0.8, 100)),
    seededInt(playerName, currentWeek, 'international', 0, Math.min(reputation * 0.6, 100)),
  ], [playerName, currentWeek, trophies, reputation]);

  const records = useMemo(() => [
    { label: 'Goals', player: goals, clubRecord: seededInt(playerName, currentWeek, 'club-goals', goals + 20, goals + 200) },
    { label: 'Assists', player: assists, clubRecord: seededInt(playerName, currentWeek, 'club-assists', assists + 15, assists + 150) },
    { label: 'Appearances', player: appearances, clubRecord: seededInt(playerName, currentWeek, 'club-apps', appearances + 30, appearances + 400) },
    { label: 'Clean Sheets', player: Math.floor(goals * 0.08), clubRecord: seededInt(playerName, currentWeek, 'club-cs', 20, 180) },
    { label: 'MoM Awards', player: Math.floor(appearances * 0.05), clubRecord: seededInt(playerName, currentWeek, 'club-mom', 10, 80) },
  ], [playerName, currentWeek, goals, assists, appearances]);

  const totalMilestones = achievements.length;
  const unlockedMilestones = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Trophy Cabinet Radar */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}
      >
        <div className="flex items-center gap-2 self-start mb-3">
          <Trophy className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Trophy Cabinet</h3>
        </div>
        <TrophyCabinetRadar values={radarValues} />
        <div className="flex justify-center gap-4 mt-3">
          {['League', 'Cup', 'Super Cup', 'Continental', 'Intl'].map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-sm bg-[#CCFF00]" />
              <span className="text-[9px] text-[#8b949e]">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Record Comparison Bars */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Records vs Club All-Time</h3>
        </div>
        <RecordComparisonBars records={records} playerName={playerName} week={currentWeek} />
        <div className="flex gap-3 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-[#FF5500]" />
            <span className="text-[9px] text-[#8b949e]">You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-[#21262d]" />
            <span className="text-[9px] text-[#8b949e]">Club Record</span>
          </div>
        </div>
      </motion.div>

      {/* Achievement Milestone Ring */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}
      >
        <div className="flex items-center gap-2 self-start">
          <Star className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Milestones</h3>
        </div>
        <AchievementMilestoneRing unlocked={unlockedMilestones} total={totalMilestones} />
        <p className="text-xs text-[#8b949e] text-center">
          <span className="text-[#00E5FF] font-bold">{unlockedMilestones}</span> of {totalMilestones} milestones unlocked
        </p>
      </motion.div>

      {/* Recent Trophy History */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Gem className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Trophy History</h3>
        </div>
        {trophies > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from({ length: Math.min(trophies, 8) }, (_, i) => {
              const trophyNames = ['League Title', 'Domestic Cup', 'Super Cup', 'Continental Trophy', 'Youth Cup', 'Community Shield'];
              const tName = trophyNames[seededInt(playerName, currentWeek, `trophy-${i}`, 0, trophyNames.length - 1)];
              const tSeason = seededInt(playerName, currentWeek, `trophy-s-${i}`, 1, Math.max(currentSeason, 1));
              return (
                <div key={i} className="flex items-center gap-3 p-2 bg-[#21262d] rounded-lg">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#CCFF00]/15">
                    <Trophy className="h-4 w-4 text-[#CCFF00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#c9d1d9]">{tName}</p>
                    <p className="text-[9px] text-[#8b949e]">Season {tSeason}</p>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] font-bold" style={{ borderRadius: 3 }}>
                    WON
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="h-8 w-8 text-[#484f58] mx-auto mb-2" />
            <p className="text-xs text-[#8b949e]">No trophies yet. Keep pushing!</p>
          </div>
        )}
      </motion.div>

      {/* Achievement Categories Breakdown */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Achievement Progress</h3>
        </div>
        <div className="space-y-2">
          {['career', 'match', 'training', 'social', 'transfer'].map((cat, i) => {
            const catMilestones = achievements.filter(a => {
              const catMap: Record<string, string[]> = {
                career: ['first_match', 'debut_season', 'wonderkid', 'world_class', 'loyal_servant'],
                match: ['first_goal', 'hat_trick', 'top_scorer', 'comeback_king'],
                training: ['training_dedication'],
                social: ['social_media_star'],
                transfer: ['transfer_record'],
              };
              return (catMap[cat] ?? []).includes(a.id);
            });
            const catUnlocked = catMilestones.filter(a => a.unlocked).length;
            const catTotal = catMilestones.length;
            const catPct = catTotal > 0 ? (catUnlocked / catTotal) * 100 : 0;
            const catColors = ['text-[#FF5500]', 'text-[#CCFF00]', 'text-[#00E5FF]', 'text-[#c9d1d9]', 'text-[#666666]'];
            const catLabels = ['Career', 'Match', 'Training', 'Social', 'Transfer'];
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-[10px] font-bold w-16 ${catColors[i]}`}>{catLabels[i]}</span>
                <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full rounded-sm"
                    style={{ backgroundColor: C[cat === 'career' ? 'orange' : cat === 'match' ? 'lime' : cat === 'training' ? 'cyan' : 'gray'] }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${catPct}%` }}
                    transition={{ ...A, width: { duration: 0.4, ease: 'easeOut' as const }, delay: D * 4 + i * D }}
                  />
                </div>
                <span className="text-[10px] text-[#8b949e] tabular-nums w-10 text-right">{catUnlocked}/{catTotal}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Tab 3: Influence — Impact on club, fans, football
   ================================================================ */

function InfluenceTab({
  playerName, currentSeason, currentWeek, goals, assists, appearances,
  reputation, morale, totalSeasons, currentClubName,
}: {
  playerName: string;
  currentSeason: number;
  currentWeek: number;
  goals: number;
  assists: number;
  appearances: number;
  reputation: number;
  morale: number;
  totalSeasons: number;
  currentClubName: string;
}) {
  const fanConnection = useMemo(() => {
    const base = Math.min(100, reputation * 0.6 + morale * 0.3 + totalSeasons * 2);
    const seeded = seededRandom(playerName, currentWeek, 'fan-conn') * 10;
    return Math.min(100, Math.max(0, Math.round(base + seeded - 5)));
  }, [playerName, currentWeek, reputation, morale, totalSeasons]);

  const mediaValues = useMemo(() => [
    seededInt(playerName, currentWeek, 'social-media', 10, Math.min(reputation * 1.2, 100)),
    seededInt(playerName, currentWeek, 'press', 5, Math.min(reputation * 0.9, 100)),
    seededInt(playerName, currentWeek, 'tv', 5, Math.min(reputation * 0.7, 100)),
    seededInt(playerName, currentWeek, 'interviews', 10, Math.min(reputation * 0.5 + totalSeasons * 3, 100)),
  ], [playerName, currentWeek, reputation, totalSeasons]);

  const mediaColors = [C.orange, C.lime, C.cyan, C.gray];
  const mediaLabels = ['Social Media', 'Press', 'TV', 'Interviews'];

  const impactValues = useMemo(() => [
    Math.min(100, goals * 1.2 + seededInt(playerName, currentWeek, 'impact-goals', 5, 30)),
    Math.min(100, reputation * 0.5 + seededInt(playerName, currentWeek, 'impact-lead', 10, 40)),
    Math.min(100, morale * 0.8 + seededInt(playerName, currentWeek, 'impact-morale', 10, 30)),
    Math.min(100, appearances * 0.05 + seededInt(playerName, currentWeek, 'impact-rev', 5, 30)),
    Math.min(100, totalSeasons * 4 + seededInt(playerName, currentWeek, 'impact-youth', 5, 20)),
  ], [playerName, currentWeek, goals, reputation, morale, appearances, totalSeasons]);

  return (
    <div className="space-y-4">
      {/* Fan Connection Gauge */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}
      >
        <div className="flex items-center gap-2 self-start mb-2">
          <Heart className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Fan Connection</h3>
        </div>
        <FanConnectionGauge value={fanConnection} />
        <div className="flex justify-between w-full mt-2 px-4">
          <span className="text-[9px] text-[#484f58]">0</span>
          <span className="text-[9px] text-[#484f58]">100</span>
        </div>
      </motion.div>

      {/* Media Presence Bars */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Media Presence</h3>
        </div>
        <MediaPresenceBars values={mediaValues} colors={mediaColors} labels={mediaLabels} />
        <div className="flex flex-wrap gap-2 mt-3">
          {mediaLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: mediaColors[i] }} />
              <span className="text-[9px] text-[#8b949e]">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Club Impact Radar */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}
      >
        <div className="flex items-center gap-2 self-start mb-3">
          <Shield className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Impact on {currentClubName}</h3>
        </div>
        <ClubImpactRadar values={impactValues} />
        <div className="flex justify-center gap-3 mt-3">
          {['Goals', 'Leadership', 'Morale', 'Revenue', 'Youth'].map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-sm bg-[#FF5500]" />
              <span className="text-[9px] text-[#8b949e]">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fan Sentiment Breakdown */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Fan Sentiment</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Adoration', value: seededInt(playerName, currentWeek, 'f-ador', 20, Math.min(fanConnection + 10, 100)), color: '#FF5500' },
            { label: 'Respect', value: seededInt(playerName, currentWeek, 'f-resp', 15, Math.min(reputation + 5, 100)), color: '#CCFF00' },
            { label: 'Expectation', value: seededInt(playerName, currentWeek, 'f-expe', 10, Math.min(reputation * 0.8, 100)), color: '#00E5FF' },
            { label: 'Trust', value: seededInt(playerName, currentWeek, 'f-trust', 15, Math.min(morale * 0.9, 100)), color: '#c9d1d9' },
          ].map((item, i) => (
            <div key={i} className="p-2 bg-[#21262d] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#8b949e]">{item.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: item.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${item.value}%` }}
                  transition={{ ...A, width: { duration: 0.4, ease: 'easeOut' as const }, delay: D * 3 + i * D }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Global Reach Summary */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Global Reach</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Social Followers', value: seededInt(playerName, currentWeek, 'soc-fol', 1, 50) >= 40 ? '10M+' : seededInt(playerName, currentWeek, 'soc-fol', 1, 50) >= 25 ? '1M+' : '100K+', color: 'text-[#FF5500]' },
            { label: 'Countries', value: seededInt(playerName, currentWeek, 'countries', 3, Math.min(20 + reputation * 0.3, 80)), color: 'text-[#CCFF00]' },
            { label: 'Press Mentions', value: seededInt(playerName, currentWeek, 'press-ment', 10, Math.min(500 + reputation * 20, 5000)), color: 'text-[#00E5FF]' },
          ].map((item, i) => (
            <div key={i} className="text-center p-2 bg-[#21262d] rounded-lg">
              <p className={`text-xs font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-[8px] text-[#8b949e]">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Tab 4: Future — Post-career potential, Hall of Fame odds
   ================================================================ */

function FutureTab({
  playerName, currentSeason, currentWeek, goals, assists, appearances,
  trophies, reputation, morale, totalSeasons,
}: {
  playerName: string;
  currentSeason: number;
  currentWeek: number;
  goals: number;
  assists: number;
  appearances: number;
  trophies: number;
  reputation: number;
  morale: number;
  totalSeasons: number;
}) {
  const hofProbability = useMemo(() => {
    const base = reputation * 0.4 + trophies * 5 + totalSeasons * 2 + goals * 0.3;
    const seeded = seededRandom(playerName, currentWeek, 'hof-prob') * 15;
    return Math.min(100, Math.max(0, Math.round(base + seeded - 10)));
  }, [playerName, currentWeek, reputation, trophies, totalSeasons, goals]);

  const careerOptions = useMemo(() => [
    seededInt(playerName, currentWeek, 'mgmt', 15, Math.min(reputation * 0.7 + totalSeasons * 3, 100)),
    seededInt(playerName, currentWeek, 'pundit', 20, Math.min(reputation * 0.8 + goals * 0.5, 100)),
    seededInt(playerName, currentWeek, 'coach', 10, Math.min(reputation * 0.6 + assists * 0.5 + totalSeasons * 2, 100)),
    seededInt(playerName, currentWeek, 'ambassador', 25, Math.min(reputation * 0.5 + morale * 0.3 + trophies * 3, 100)),
    seededInt(playerName, currentWeek, 'ownership', 5, Math.min(appearances * 0.02 + trophies * 4, 100)),
  ], [playerName, currentWeek, reputation, totalSeasons, goals, assists, morale, trophies, appearances]);

  const careerColors = [C.orange, C.lime, C.cyan, C.gray, C.orange];
  const careerLabels = ['Management', 'Punditry', 'Coaching', 'Ambassador', 'Ownership'];

  const projectionData = useMemo(() => {
    const base = goals * 2 + assists * 1.5 + trophies * 8 + reputation * 0.3 + totalSeasons * 3;
    return Array.from({ length: 8 }, (_, i) => {
      const seasonOffset = i + 1;
      const growth = seededRandom(playerName, currentWeek + seasonOffset, `proj-${i}`) * 12;
      const decay = i > 4 ? seededRandom(playerName, currentWeek + seasonOffset, `decay-${i}`) * 5 : 0;
      return Math.max(0, Math.round(base + growth * seasonOffset - decay));
    });
  }, [playerName, currentWeek, goals, assists, trophies, reputation, totalSeasons]);

  return (
    <div className="space-y-4">
      {/* Hall of Fame Probability Gauge */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col items-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}
      >
        <div className="flex items-center gap-2 self-start mb-2">
          <Crown className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Hall of Fame Probability</h3>
        </div>
        <HallOfFameProbabilityGauge probability={hofProbability} />
        <div className="flex justify-between w-full mt-2 px-4">
          <span className="text-[9px] text-[#484f58]">0%</span>
          <span className="text-[9px] text-[#484f58]">100%</span>
        </div>
        <p className="text-xs text-[#8b949e] text-center mt-1">
          {hofProbability >= 70 ? (
            <span className="text-[#CCFF00] font-bold">Strong contender</span>
          ) : hofProbability >= 40 ? (
            <span className="text-[#c9d1d9]">Possible with sustained performance</span>
          ) : (
            <span className="text-[#8b949e]">Keep building your legacy</span>
          )}
        </p>
      </motion.div>

      {/* Post-Career Options Bars */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Post-Career Readiness</h3>
        </div>
        <PostCareerOptionsBars values={careerOptions} colors={careerColors} labels={careerLabels} />
        <div className="flex flex-wrap gap-2 mt-3">
          {careerLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: careerColors[i] }} />
              <span className="text-[9px] text-[#8b949e]">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Legacy Projection Line */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Legacy Projection</h3>
          <span className="text-[10px] text-[#8b949e] ml-auto">Next 8 seasons</span>
        </div>
        <LegacyProjectionLine data={projectionData} />
      </motion.div>

      {/* Post-Career Best Fit Card */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Best Post-Career Fit</h3>
        </div>
        {(() => {
          const best = careerOptions.reduce((b, val, i) => val > b.val ? { val, i } : b, { val: 0, i: 0 });
          return (
            <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: careerColors[best.i] + '20' }}>
                <span style={{ color: careerColors[best.i] }}>
                  {best.i === 0 ? <Shield className="h-5 w-5" /> : best.i === 1 ? <Globe className="h-5 w-5" /> : best.i === 2 ? <Target className="h-5 w-5" /> : best.i === 3 ? <Heart className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#c9d1d9]">{careerLabels[best.i]}</p>
                <p className="text-[10px] text-[#8b949e]">
                  Readiness score: <span className="font-bold" style={{ color: careerColors[best.i] }}>{best.val}/100</span>
                </p>
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* Career Longevity Estimate */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Career Longevity</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(() => {
            const peakEnd = seededInt(playerName, currentWeek, 'peak-end', 28, 34);
            const retireAge = seededInt(playerName, currentWeek, 'retire-age', 33, 38);
            const remainingSeasons = Math.max(0, retireAge - 14 - totalSeasons);
            return [
              { label: 'Peak Until', value: `Age ${peakEnd}`, color: 'text-[#FF5500]' },
              { label: 'Retire Age', value: `Age ${retireAge}`, color: 'text-[#CCFF00]' },
              { label: 'Seasons Left', value: remainingSeasons, color: 'text-[#00E5FF]' },
            ];
          })().map((item, i) => (
            <div key={i} className="text-center p-2 bg-[#21262d] rounded-lg">
              <p className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-[8px] text-[#8b949e]">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Legacy Comparison to Legends */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-[#CCFF00]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Legend Comparison</h3>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Club All-Time Great', legacy: seededInt(playerName, currentWeek, 'legend-club', 60, 95) },
            { name: 'National Icon', legacy: seededInt(playerName, currentWeek, 'legend-nat', 50, 90) },
            { name: 'World Legend', legacy: seededInt(playerName, currentWeek, 'legend-world', 40, 85) },
          ].map((legend, i) => {
            const currentLegacy = Math.round(hofProbability);
            const diff = currentLegacy - legend.legacy;
            const isAhead = diff > 0;
            return (
              <div key={i} className="flex items-center gap-3 p-2 bg-[#21262d] rounded-lg">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#CCFF00]/15">
                  <Crown className="h-4 w-4 text-[#CCFF00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#c9d1d9]">{legend.name}</p>
                  <p className="text-[9px] text-[#8b949e]">Legacy Score: {legend.legacy}</p>
                </div>
                <span className={`text-xs font-bold ${isAhead ? 'text-[#CCFF00]' : 'text-[#FF5500]'}`}>
                  {isAhead ? '+' : ''}{diff}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recommended Focus Areas */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 6 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[#FF5500]" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Recommended Focus</h3>
        </div>
        <div className="space-y-2">
          {(() => {
            const tips: { icon: React.ReactNode; text: string; color: string }[] = [];
            if (goals < 10) tips.push({ icon: <Target className="h-3.5 w-3.5" />, text: 'Score more goals to boost your legacy', color: 'text-[#FF5500]' });
            if (trophies === 0) tips.push({ icon: <Trophy className="h-3.5 w-3.5" />, text: 'Win your first trophy to make history', color: 'text-[#CCFF00]' });
            if (reputation < 50) tips.push({ icon: <Star className="h-3.5 w-3.5" />, text: 'Build your reputation through consistent performances', color: 'text-[#00E5FF]' });
            if (totalSeasons < 3) tips.push({ icon: <Calendar className="h-3.5 w-3.5" />, text: 'Longevity is key - stay at your club', color: 'text-[#c9d1d9]' });
            if (tips.length === 0) tips.push({ icon: <Flame className="h-3.5 w-3.5" />, text: 'You are on track for a legendary career!', color: 'text-[#CCFF00]' });
            return tips;
          })().map((tip, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-[#21262d] rounded-lg">
              <span className={tip.color}>{tip.icon}</span>
              <p className="text-xs text-[#8b949e]">{tip.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Main Export — CareerLegacyProfileEnhanced
   ================================================================ */

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Crown className="h-3.5 w-3.5" /> },
  { id: 'achievements', label: 'Achievements', icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: 'influence', label: 'Influence', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'future', label: 'Future', icon: <Flame className="h-3.5 w-3.5" /> },
] as const;

export default function CareerLegacyProfileEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'influence' | 'future'>('overview');

  const derivedData = useMemo(() => {
    if (!gameState) return null;
    const { player, currentSeason, currentWeek, achievements } = gameState;
    const currentClubName = gameState.currentClub.name ?? 'Unknown';

    return {
      playerName: player.name,
      currentSeason,
      currentWeek,
      goals: player.careerStats.totalGoals,
      assists: player.careerStats.totalAssists,
      appearances: player.careerStats.totalAppearances,
      trophies: (player.careerStats.trophies ?? []).length,
      achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
      reputation: player.reputation,
      morale: player.morale,
      totalSeasons: player.careerStats.seasonsPlayed ?? currentSeason,
      currentClubName,
    };
  }, [gameState]);

  if (!gameState || !derivedData) return <></>;

  const {
    playerName, currentSeason, currentWeek, goals, assists, appearances,
    trophies, achievements, reputation, morale, totalSeasons, currentClubName,
  } = derivedData;

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FF5500]/15">
              <Crown className="h-5 w-5 text-[#FF5500]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-[#c9d1d9] truncate">{playerName}</h1>
              <p className="text-xs text-[#8b949e]">
                {currentClubName} · Season {currentSeason} · Week {currentWeek}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-[#21262d] rounded-lg border border-[#30363d]">
              <Star className="h-3 w-3 text-[#FF5500]" />
              <span className="text-xs font-bold text-[#c9d1d9] tabular-nums">{reputation}</span>
            </div>
          </div>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#30363d]">
            {[
              { label: 'Goals', value: goals, color: 'text-[#FF5500]' },
              { label: 'Assists', value: assists, color: 'text-[#CCFF00]' },
              { label: 'Apps', value: appearances, color: 'text-[#00E5FF]' },
              { label: 'Trophies', value: trophies, color: 'text-[#FF5500]' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[8px] text-[#8b949e]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1 gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'achievements' | 'influence' | 'future')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#21262d] text-[#c9d1d9]'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={A}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              playerName={playerName}
              currentSeason={currentSeason}
              currentWeek={currentWeek}
              goals={goals}
              assists={assists}
              appearances={appearances}
              trophies={trophies}
              reputation={reputation}
              totalSeasons={totalSeasons}
            />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab
              playerName={playerName}
              currentSeason={currentSeason}
              currentWeek={currentWeek}
              goals={goals}
              assists={assists}
              appearances={appearances}
              trophies={trophies}
              achievements={achievements}
              reputation={reputation}
              totalSeasons={totalSeasons}
            />
          )}
          {activeTab === 'influence' && (
            <InfluenceTab
              playerName={playerName}
              currentSeason={currentSeason}
              currentWeek={currentWeek}
              goals={goals}
              assists={assists}
              appearances={appearances}
              reputation={reputation}
              morale={morale}
              totalSeasons={totalSeasons}
              currentClubName={currentClubName}
            />
          )}
          {activeTab === 'future' && (
            <FutureTab
              playerName={playerName}
              currentSeason={currentSeason}
              currentWeek={currentWeek}
              goals={goals}
              assists={assists}
              appearances={appearances}
              trophies={trophies}
              reputation={reputation}
              morale={morale}
              totalSeasons={totalSeasons}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
