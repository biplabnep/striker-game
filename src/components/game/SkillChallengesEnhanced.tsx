'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Zap, Star, Timer, Award,
  Flame, TrendingUp, Dumbbell, Shield, Crosshair,
  BarChart3, ChevronRight, Info,
} from 'lucide-react';

/* ============================================================
   Seeded PRNG
   ============================================================ */

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
  const seed = hashSeed(`${playerName}-sce-w${week}-${extra}`);
  return mulberry32(seed)();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

/* ============================================================
   SVG Helpers
   ============================================================ */

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeDonutSegment(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  const diff = endAngle - startAngle;
  if (diff < 0.5) return '';
  if (diff >= 359.99) {
    const oStart = polarToCartesian(cx, cy, outerR, 0);
    const iStart = polarToCartesian(cx, cy, innerR, 0.01);
    return [
      `M ${oStart.x} ${oStart.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${oStart.x - 0.01} ${oStart.y}`,
      `L ${iStart.x} ${iStart.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${iStart.x + 0.01} ${iStart.y} Z`,
    ].join(' ');
  }
  const oA = polarToCartesian(cx, cy, outerR, endAngle);
  const oB = polarToCartesian(cx, cy, outerR, startAngle);
  const iA = polarToCartesian(cx, cy, innerR, startAngle);
  const iB = polarToCartesian(cx, cy, innerR, endAngle);
  const large = diff <= 180 ? '0' : '1';
  return [
    `M ${oA.x} ${oA.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${oB.x} ${oB.y}`,
    `L ${iA.x} ${iA.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${iB.x} ${iB.y} Z`,
  ].join(' ');
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/* ============================================================
   Shared Types
   ============================================================ */

interface AttrBundle {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

/* ============================================================
   SVG Card Wrapper
   ============================================================ */

function SvgCard({ title, icon, children, delay = 0 }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-semibold text-[#c9d1d9] tracking-wide uppercase">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

/* ============================================================
   Stat Pill Component
   ============================================================ */

function StatPill({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-[#21262d] rounded-lg px-3 py-2.5 flex items-center gap-2">
      <div className="text-[#484f58]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#484f58] leading-tight">{label}</p>
        <p className="text-sm font-bold leading-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Section Header Component
   ============================================================ */

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-xs font-semibold text-[#c9d1d9] tracking-wide uppercase">{title}</span>
    </div>
  );
}

/* ============================================================
   Progress Row Component
   ============================================================ */

function ProgressRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#c9d1d9] truncate">{label}</span>
          <span className="text-[10px] text-[#8b949e] shrink-0 ml-2">{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[#484f58] shrink-0" />
    </div>
  );
}

/* ============================================================
   SVG 1: ChallengeCategoryDonut (Tab 1 - Challenges)
   5-segment donut: Shooting/Passing/Dribbling/Defending/Physical
   Colors: #FF5500, #CCFF00, #00E5FF, #666, #FF5500
   ============================================================ */

function ChallengeCategoryDonut({ playerName, week, attrs }: {
  playerName: string;
  week: number;
  attrs: { shooting: number; passing: number; dribbling: number; defending: number; physical: number };
}) {
  const segments = useMemo(() => {
    const cats = [
      { label: 'Shooting', value: attrs.shooting, color: '#FF5500' },
      { label: 'Passing', value: attrs.passing, color: '#CCFF00' },
      { label: 'Dribbling', value: attrs.dribbling, color: '#00E5FF' },
      { label: 'Defending', value: attrs.defending, color: '#666666' },
      { label: 'Physical', value: attrs.physical, color: '#FF5500' },
    ];
    const total = cats.reduce((s, c) => s + c.value, 0);
    if (total === 0) return cats.map(c => ({ ...c, pct: 0, startAngle: 0, endAngle: 0 }));
    const GAP = 2;
    const usableAngle = 360 - GAP * cats.length;
    let angle = -90;
    return cats.map(c => {
      const pct = c.value / total;
      const sweep = usableAngle * pct;
      const startA = angle + 90;
      const endA = startA + sweep;
      angle += sweep + GAP;
      return { ...c, pct, startAngle: startA, endAngle: endA };
    });
  }, [attrs]);

  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 52;

  return (
    <svg viewBox="0 0 200 210" className="w-full">
      {/* Donut segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={describeDonutSegment(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
          fill={seg.color}
          opacity={0.85}
        />
      ))}
      {/* Inner ring border */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#161b22" strokeWidth="1" />
      {/* Center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#c9d1d9" fontSize="20" fontWeight="800">
        {seededInt(playerName, week, 'total-chal', 12, 48)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="600">
        Total
      </text>
      <text x={cx} y={cy + 19} textAnchor="middle" fill="#484f58" fontSize="7">
        Challenges
      </text>
      {/* Legend - top row */}
      {segments.map((seg, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const lx = 10 + col * 64;
        const ly = 195 + row * 14;
        return (
          <g key={`leg-${i}`}>
            <rect x={lx} y={ly} width="8" height="8" rx="2" fill={seg.color} />
            <text x={lx + 12} y={ly + 7} fill="#8b949e" fontSize="7">{seg.label}</text>
            <text x={lx + 48} y={ly + 7} fill="#c9d1d9" fontSize="7" fontWeight="600">{seg.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 2: ChallengeDifficultyBars (Tab 1 - Challenges)
   5 horizontal bars: Bronze/Silver/Gold/Platinum/Diamond
   Color: #FF5500
   ============================================================ */

function ChallengeDifficultyBars({ playerName, week, overall }: {
  playerName: string;
  week: number;
  overall: number;
}) {
  const bars = useMemo(() => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const bases = [88, 72, 55, 38, 20];
    return tiers.map((label, i) => {
      const raw = (overall - 20) / 80 * 0.6 + bases[i] / 100;
      const noise = seededRandom(playerName, week, `diff-${label}`) * 0.2;
      const val = clamp01(raw + noise - 0.1);
      return { label, value: Math.round(val * 100) };
    });
  }, [playerName, week, overall]);

  const barH = 22;
  const gap = 12;
  const maxW = 200;
  const svgH = bars.length * (barH + gap) - gap + 4;

  return (
    <svg viewBox={`0 0 280 ${svgH}`} className="w-full">
      {bars.map((bar, i) => {
        const y = i * (barH + gap) + 2;
        const fillW = Math.max(4, (bar.value / 100) * maxW);
        const tierColor = bar.value >= 80 ? '#CCFF00' : bar.value >= 60 ? '#FF5500' : '#666666';
        return (
          <g key={i}>
            {/* Label */}
            <text x="2" y={y + barH / 2 + 1} fill="#8b949e" fontSize="10" fontWeight="600">{bar.label}</text>
            {/* Background bar */}
            <rect x="68" y={y + 2} width={maxW} height={barH - 4} rx="4" fill="#21262d" />
            {/* Fill bar */}
            <rect x="68" y={y + 2} width={fillW} height={barH - 4} rx="4" fill="#FF5500" opacity={0.85} />
            {/* Value */}
            <text x={68 + maxW + 8} y={y + barH / 2 + 1} fill={tierColor} fontSize="11" fontWeight="700">
              {bar.value}%
            </text>
            {/* Tier indicator dot */}
            <circle cx={68 + fillW - 6} cy={y + barH / 2} r="3" fill={tierColor} opacity="0.9" />
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 3: ActiveChallengeTimeline (Tab 1 - Challenges)
   8-node horizontal timeline showing challenge progress
   Color: #00E5FF
   ============================================================ */

function ActiveChallengeTimeline({ playerName, week }: {
  playerName: string;
  week: number;
}) {
  const nodes = useMemo(() => {
    const labels = ['Sprint', 'Accuracy', 'Endurance', 'Agility', 'Power', 'Composure', 'Streak', 'Boss'];
    return labels.map((label, i) => {
      const completed = seededRandom(playerName, week, `tl-${i}`) < 0.62;
      const score = completed ? seededInt(playerName, week, `tl-s-${i}`, 60, 100) : 0;
      const tier = seededInt(playerName, week, `tl-t-${i}`, 1, 3);
      return { label, completed, score, tier };
    });
  }, [playerName, week]);

  const completedCount = nodes.reduce((s, n) => s + (n.completed ? 1 : 0), 0);
  const nodeR = 11;
  const spacing = 34;
  const startX = 22;
  const lineY = 42;

  return (
    <svg viewBox="0 0 280 100" className="w-full">
      {/* Background track */}
      <line x1={startX} y1={lineY} x2={startX + spacing * (nodes.length - 1)} y2={lineY}
        stroke="#21262d" strokeWidth="4" strokeLinecap="round" />
      {/* Completed segments */}
      {nodes.map((node, i) => {
        const cx = startX + i * spacing;
        return (
          <g key={i}>
            {node.completed && (
              <line x1={cx} y1={lineY} x2={cx + spacing} y2={lineY}
                stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
            )}
          </g>
        );
      })}
      {/* Nodes */}
      {nodes.map((node, i) => {
        const cx = startX + i * spacing;
        const tierColors = ['#666666', '#00E5FF', '#CCFF00', '#FF5500'];
        return (
          <g key={i}>
            {/* Outer glow */}
            {node.completed && (
              <circle cx={cx} cy={lineY} r={nodeR + 3} fill={tierColors[node.tier]} opacity="0.15" />
            )}
            {/* Node circle */}
            <circle cx={cx} cy={lineY} r={nodeR} fill={node.completed ? '#0d1117' : '#161b22'}
              stroke={node.completed ? '#00E5FF' : '#30363d'} strokeWidth="2" />
            {/* Inner fill */}
            {node.completed && (
              <circle cx={cx} cy={lineY} r={nodeR - 4} fill="#00E5FF" opacity="0.3" />
            )}
            {/* Check or lock */}
            {node.completed ? (
              <text x={cx} y={lineY + 4} textAnchor="middle" fill="#00E5FF" fontSize="12" fontWeight="700">&#10003;</text>
            ) : (
              <text x={cx} y={lineY + 4} textAnchor="middle" fill="#484f58" fontSize="9" fontWeight="600">&#9679;</text>
            )}
            {/* Label */}
            <text x={cx} y={lineY + 28} textAnchor="middle"
              fill={node.completed ? '#c9d1d9' : '#484f58'} fontSize="7" fontWeight="500">
              {node.label}
            </text>
            {/* Score badge */}
            {node.score > 0 && (
              <g>
                <rect x={cx - 12} y={lineY - 24} width="24" height="12" rx="3" fill="#00E5FF" opacity="0.15" />
                <text x={cx} y={lineY - 15} textAnchor="middle" fill="#00E5FF" fontSize="8" fontWeight="700">
                  {node.score}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* Progress indicator */}
      <text x={280 - 2} y={14} textAnchor="end" fill="#484f58" fontSize="8">
        {completedCount}/{nodes.length}
      </text>
    </svg>
  );
}

/* ============================================================
   SVG 4: SkillScoreRadar (Tab 2 - Rankings)
   5-axis radar: Technical/Physical/Mental/Tactical/Creative
   Color: #CCFF00
   ============================================================ */

function SkillScoreRadar({ attrs, playerName, week }: {
  attrs: AttrBundle;
  playerName: string;
  week: number;
}) {
  const axes = useMemo(() => {
    const defs = [
      { label: 'Technical', get: () => (attrs.shooting + attrs.passing + attrs.dribbling) / 3 },
      { label: 'Physical', get: () => (attrs.pace + attrs.physical) / 2 },
      { label: 'Mental', get: () => seededInt(playerName, week, 'mental', 30, 90) },
      { label: 'Tactical', get: () => seededInt(playerName, week, 'tactical', 25, 85) },
      { label: 'Creative', get: () => (attrs.dribbling + attrs.passing) / 2 + seededRandom(playerName, week, 'creative') * 15 },
    ];
    return defs.map(d => ({ label: d.label, value: clamp01(d.get() / 100) }));
  }, [attrs, playerName, week]);

  const cx = 100;
  const cy = 105;
  const maxR = 72;
  const n = axes.length;
  const angleStep = 360 / n;
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = axes.map((a, i) => {
    const angle = i * angleStep - 90;
    const r = maxR * a.value;
    return polarToCartesian(cx, cy, r, angle);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const avgScore = Math.round(axes.reduce((s, a) => s + a.value * 100, 0) / n);

  return (
    <svg viewBox="0 0 200 200" className="w-full">
      {/* Grid pentagons */}
      {gridLevels.map((level, li) => {
        const pts = axes.map((_, i) => {
          const p = polarToCartesian(cx, cy, maxR * level, i * angleStep - 90);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={li} points={pts} fill="none" stroke="#21262d" strokeWidth="0.8" />;
      })}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = polarToCartesian(cx, cy, maxR, i * angleStep - 90);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth="0.8" />;
      })}
      {/* Data polygon fill */}
      <path d={dataPath} fill="#CCFF00" opacity="0.15" />
      {/* Data polygon stroke */}
      <path d={dataPath} fill="none" stroke="#CCFF00" strokeWidth="2" opacity="0.9" />
      {/* Data point circles */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#0d1117" stroke="#CCFF00" strokeWidth="2" />
        </g>
      ))}
      {/* Axis labels + values */}
      {axes.map((a, i) => {
        const lp = polarToCartesian(cx, cy, maxR + 18, i * angleStep - 90);
        return (
          <g key={`lbl-${i}`}>
            <text x={lp.x} y={lp.y} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
              {a.label}
            </text>
            <text x={lp.x} y={lp.y + 9} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontWeight="700">
              {Math.round(a.value * 100)}
            </text>
          </g>
        );
      })}
      {/* Center score */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#CCFF00" fontSize="18" fontWeight="800">
        {avgScore}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#484f58" fontSize="7" fontWeight="500">
        SKILL SCORE
      </text>
    </svg>
  );
}

/* ============================================================
   SVG 5: GlobalRankingLine (Tab 2 - Rankings)
   8-point line chart showing ranking over 8 weeks
   Color: #00E5FF
   ============================================================ */

function GlobalRankingLine({ playerName, week }: {
  playerName: string;
  week: number;
}) {
  const points = useMemo(() => {
    const baseRank = seededInt(playerName, week, 'base-rank', 15, 80);
    return Array.from({ length: 8 }, (_, i) => {
      const drift = seededInt(playerName, week, `rank-w${i}`, -14, 14);
      return Math.max(1, Math.min(100, baseRank - i * 4 + drift));
    });
  }, [playerName, week]);

  const pad = { top: 24, right: 16, bottom: 30, left: 36 };
  const w = 280 - pad.left - pad.right;
  const h = 140 - pad.top - pad.bottom;
  const xStep = w / (points.length - 1);
  const minVal = 1;
  const maxVal = 100;

  const coords = points.map((p, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + (1 - (p - minVal) / (maxVal - minVal)) * h,
    val: p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <svg viewBox="0 0 280 170" className="w-full">
      {/* Horizontal grid lines */}
      {[1, 25, 50, 75, 100].map(v => {
        const y = pad.top + (1 - (v - minVal) / (maxVal - minVal)) * h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + w} y2={y} stroke="#21262d" strokeWidth="0.5" />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#484f58" fontSize="8">#{v}</text>
          </g>
        );
      })}
      {/* Vertical grid lines */}
      {coords.map((c, i) => (
        <line key={`vg-${i}`} x1={c.x} y1={pad.top} x2={c.x} y2={pad.top + h}
          stroke="#21262d" strokeWidth="0.3" />
      ))}
      {/* Area fill under line */}
      <path d={`${linePath} L ${coords[coords.length - 1].x} ${pad.top + h} L ${coords[0].x} ${pad.top + h} Z`}
        fill="#00E5FF" opacity="0.06" />
      {/* Main line */}
      <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points + labels */}
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4.5" fill="#0d1117" stroke="#00E5FF" strokeWidth="2" />
          <text x={c.x} y={c.y - 9} textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="700">
            #{c.val}
          </text>
          <text x={c.x} y={pad.top + h + 14} textAnchor="middle" fill="#484f58" fontSize="7">
            W{i + 1}
          </text>
        </g>
      ))}
      {/* Trend badge */}
      {coords.length >= 2 && (
        <g>
          <rect x={pad.left + w - 50} y={pad.top - 1} width="50" height="14" rx="3" fill="#00E5FF" opacity="0.1" />
          <text x={pad.left + w - 25} y={pad.top + 9} textAnchor="middle" fill="#00E5FF" fontSize="8" fontWeight="700">
            {coords[coords.length - 1].val < coords[0].val ? '▲' : '▼'} {Math.abs(coords[coords.length - 1].val - coords[0].val)}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ============================================================
   SVG 6: PointsDistributionBars (Tab 2 - Rankings)
   5 horizontal bars: Challenges/Daily/Weekly/Season/All-Time
   Colors: #FF5500, #CCFF00, #00E5FF, #666, #FF5500
   ============================================================ */

function PointsDistributionBars({ playerName, week }: {
  playerName: string;
  week: number;
}) {
  const bars = useMemo(() => {
    const defs = [
      { label: 'Challenges', color: '#FF5500', seed: 'pts-ch' },
      { label: 'Daily', color: '#CCFF00', seed: 'pts-da' },
      { label: 'Weekly', color: '#00E5FF', seed: 'pts-wk' },
      { label: 'Season', color: '#666666', seed: 'pts-sn' },
      { label: 'All-Time', color: '#FF5500', seed: 'pts-at' },
    ];
    return defs.map(d => ({
      label: d.label,
      color: d.color,
      value: seededInt(playerName, week, d.seed, 200, 5000),
    }));
  }, [playerName, week]);

  const maxVal = Math.max(1, bars.reduce((m, b) => Math.max(m, b.value), 0));
  const barH = 20;
  const gap = 12;
  const maxW = 150;
  const svgH = bars.length * (barH + gap) - gap + 10;

  return (
    <svg viewBox={`0 0 280 ${svgH}`} className="w-full">
      {bars.map((bar, i) => {
        const y = i * (barH + gap) + 5;
        const fillW = Math.max(4, (bar.value / maxVal) * maxW);
        return (
          <g key={i}>
            <text x="2" y={y + barH / 2 + 1} fill="#8b949e" fontSize="10" fontWeight="600">{bar.label}</text>
            <rect x="80" y={y + 2} width={maxW} height={barH - 4} rx="4" fill="#21262d" />
            <rect x="80" y={y + 2} width={fillW} height={barH - 4} rx="4" fill={bar.color} opacity={0.8} />
            {/* Highlight dot */}
            <circle cx={80 + fillW - 4} cy={y + barH / 2} r="2.5" fill={bar.color} />
            <text x={80 + maxW + 8} y={y + barH / 2 + 1} fill="#c9d1d9" fontSize="10" fontWeight="700">
              {bar.value.toLocaleString()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 7: PersonalBestRing (Tab 3 - Records)
   Circular ring showing records broken / total
   Color: #FF5500
   ============================================================ */

function PersonalBestRing({ playerName, week, careerSeasons }: {
  playerName: string;
  week: number;
  careerSeasons: number;
}) {
  const data = useMemo(() => {
    const totalPossible = Math.max(12, careerSeasons * 6 + 8);
    const broken = seededInt(playerName, week, 'records-broken', 3, Math.min(totalPossible, 28));
    return { total: totalPossible, broken, pct: broken / Math.max(1, totalPossible) };
  }, [playerName, week, careerSeasons]);

  const cx = 100;
  const cy = 105;
  const r = 72;
  const strokeW = 14;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * data.pct;
  const offset = -circumference / 4;

  return (
    <svg viewBox="0 0 200 210" className="w-full">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={strokeW} />
      {/* Filled arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF5500" strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Ring end dot */}
      {data.pct > 0.02 && (() => {
        const endAngle = data.pct * 360 - 90;
        const dot = polarToCartesian(cx, cy, r, endAngle);
        return <circle cx={dot.x} cy={dot.y} r="5" fill="#FF5500" />;
      })()}
      {/* Center text */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#FF5500" fontSize="30" fontWeight="800">
        {data.broken}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#8b949e" fontSize="10">
        of {data.total}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#484f58" fontSize="8" fontWeight="600">
        RECORDS BROKEN
      </text>
      {/* Completion percentage */}
      <text x={cx} y={cy + 34} textAnchor="middle" fill="#FF5500" fontSize="9" fontWeight="700">
        {Math.round(data.pct * 100)}% Complete
      </text>
    </svg>
  );
}

/* ============================================================
   SVG 8: RecordCategoryDonut (Tab 3 - Records)
   4-segment donut: Speed/Accuracy/Endurance/Streak
   Colors: #CCFF00, #00E5FF, #FF5500, #666
   ============================================================ */

function RecordCategoryDonut({ playerName, week, attrs }: {
  playerName: string;
  week: number;
  attrs: { pace: number; shooting: number; physical: number; dribbling: number };
}) {
  const segments = useMemo(() => {
    const cats = [
      { label: 'Speed', value: attrs.pace + seededInt(playerName, week, 'rec-spd', 5, 20), color: '#CCFF00' },
      { label: 'Accuracy', value: attrs.shooting + seededInt(playerName, week, 'rec-acc', 5, 15), color: '#00E5FF' },
      { label: 'Endurance', value: attrs.physical + seededInt(playerName, week, 'rec-end', 3, 18), color: '#FF5500' },
      { label: 'Streak', value: attrs.dribbling + seededInt(playerName, week, 'rec-str', 0, 25), color: '#666666' },
    ];
    const total = cats.reduce((s, c) => s + c.value, 0);
    if (total === 0) return cats.map(c => ({ ...c, pct: 0, startAngle: 0, endAngle: 0 }));
    const GAP = 3;
    const usable = 360 - GAP * cats.length;
    let angle = -90;
    return cats.map(c => {
      const pct = c.value / total;
      const sweep = usable * pct;
      const sa = angle + 90;
      const ea = sa + sweep;
      angle += sweep + GAP;
      return { ...c, pct, startAngle: sa, endAngle: ea };
    });
  }, [attrs, playerName, week]);

  const cx = 100;
  const cy = 100;
  const outerR = 78;
  const innerR = 50;

  return (
    <svg viewBox="0 0 200 210" className="w-full">
      {/* Donut segments */}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={describeDonutSegment(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
          fill={seg.color}
          opacity={0.8}
        />
      ))}
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#161b22" strokeWidth="1" />
      {/* Center */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="700">
        {Math.round(segments.reduce((s, seg) => s + seg.value, 0) / segments.length)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="500">AVG SCORE</text>
      {/* Legend */}
      {segments.map((seg, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const lx = 14 + col * 92;
        const ly = 190 + row * 14;
        return (
          <g key={`lg-${i}`}>
            <rect x={lx} y={ly} width="8" height="8" rx="2" fill={seg.color} />
            <text x={lx + 12} y={ly + 7} fill="#8b949e" fontSize="7">{seg.label}</text>
            <text x={lx + 58} y={ly + 7} fill="#c9d1d9" fontSize="7" fontWeight="700">{seg.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 9: RecordImprovementAreaChart (Tab 3 - Records)
   8-point area chart of improvement over 8 sessions
   Color: #00E5FF
   ============================================================ */

function RecordImprovementAreaChart({ playerName, week }: {
  playerName: string;
  week: number;
}) {
  const dataPoints = useMemo(() => {
    const base = seededInt(playerName, week, 'imp-base', 28, 50);
    return Array.from({ length: 8 }, (_, i) => {
      const gain = seededInt(playerName, week, `imp-s${i}`, 3, 15);
      const noise = seededRandom(playerName, week, `imp-n-${i}`) * 10 - 5;
      return Math.max(15, Math.min(100, base + i * gain * 0.8 + noise));
    });
  }, [playerName, week]);

  const pad = { top: 18, right: 16, bottom: 30, left: 34 };
  const w = 280 - pad.left - pad.right;
  const h = 120 - pad.top - pad.bottom;
  const xStep = w / (dataPoints.length - 1);

  const coords = dataPoints.map((v, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + (1 - v / 100) * h,
    val: Math.round(v),
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${pad.top + h} L ${coords[0].x} ${pad.top + h} Z`;
  const improvement = coords.length >= 2 ? coords[coords.length - 1].val - coords[0].val : 0;

  return (
    <svg viewBox="0 0 280 155" className="w-full">
      {/* Grid */}
      {[20, 40, 60, 80, 100].map(v => {
        const y = pad.top + (1 - v / 100) * h;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={pad.left + w} y2={y} stroke="#21262d" strokeWidth="0.5" />
            <text x={pad.left - 5} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
          </g>
        );
      })}
      {/* Vertical grid */}
      {coords.map((c, i) => (
        <line key={`vg-${i}`} x1={c.x} y1={pad.top} x2={c.x} y2={pad.top + h}
          stroke="#21262d" strokeWidth="0.3" />
      ))}
      {/* Area */}
      <path d={areaPath} fill="#00E5FF" opacity="0.1" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + session labels */}
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="#0d1117" stroke="#00E5FF" strokeWidth="2" />
          <text x={c.x} y={c.y - 8} textAnchor="middle" fill="#8b949e" fontSize="7">{c.val}</text>
          <text x={c.x} y={pad.top + h + 14} textAnchor="middle" fill="#484f58" fontSize="7">S{i + 1}</text>
        </g>
      ))}
      {/* Trend badge */}
      <g>
        <rect x={pad.left + w - 48} y={pad.top - 1} width="48" height="14" rx="3"
          fill={improvement > 0 ? '#00E5FF' : '#FF5500'} opacity="0.1" />
        <text x={pad.left + w - 24} y={pad.top + 9} textAnchor="middle"
          fill={improvement > 0 ? '#00E5FF' : '#FF5500'} fontSize="8" fontWeight="700">
          {improvement > 0 ? '+' : ''}{improvement}%
        </text>
      </g>
    </svg>
  );
}

/* ============================================================
   SVG 10: RewardUnlockRing (Tab 4 - Rewards)
   Circular ring showing rewards unlocked / total
   Color: #CCFF00
   ============================================================ */

function RewardUnlockRing({ totalAchievements, unlockedCount }: {
  totalAchievements: number;
  unlockedCount: number;
}) {
  const cx = 100;
  const cy = 105;
  const r = 72;
  const strokeW = 14;
  const circumference = 2 * Math.PI * r;
  const pct = totalAchievements > 0 ? unlockedCount / totalAchievements : 0;
  const filled = circumference * pct;
  const offset = -circumference / 4;

  return (
    <svg viewBox="0 0 200 210" className="w-full">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={strokeW} />
      {/* Filled arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#CCFF00" strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Ring end dot */}
      {pct > 0.02 && (() => {
        const endAngle = pct * 360 - 90;
        const dot = polarToCartesian(cx, cy, r, endAngle);
        return <circle cx={dot.x} cy={dot.y} r="5" fill="#CCFF00" />;
      })()}
      {/* Center text */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#CCFF00" fontSize="30" fontWeight="800">
        {unlockedCount}
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#8b949e" fontSize="10">
        of {totalAchievements}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#484f58" fontSize="8" fontWeight="600">
        REWARDS UNLOCKED
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" fill="#CCFF00" fontSize="9" fontWeight="700">
        {Math.round(pct * 100)}% Complete
      </text>
    </svg>
  );
}

/* ============================================================
   SVG 11: RewardRarityBars (Tab 4 - Rewards)
   4 horizontal bars: Common/Rare/Epic/Legendary
   Colors: #666, #00E5FF, #CCFF00, #FF5500
   ============================================================ */

function RewardRarityBars({ achievements }: {
  achievements: { rarity: string }[];
}) {
  const bars = useMemo(() => {
    const defs = [
      { label: 'Common', color: '#666666', rarity: 'common' },
      { label: 'Rare', color: '#00E5FF', rarity: 'rare' },
      { label: 'Epic', color: '#CCFF00', rarity: 'epic' },
      { label: 'Legendary', color: '#FF5500', rarity: 'legendary' },
    ];
    const counts = defs.reduce<Record<string, number>>((acc, d) => {
      acc[d.rarity] = achievements.filter(a => a.rarity === d.rarity).length;
      return acc;
    }, {});
    const maxVal = Math.max(1, ...Object.values(counts));
    return defs.map(d => ({
      label: d.label,
      color: d.color,
      count: counts[d.rarity] ?? 0,
      maxVal,
    }));
  }, [achievements]);

  const barH = 24;
  const gap = 14;
  const maxW = 150;
  const svgH = bars.length * (barH + gap) - gap + 12;

  return (
    <svg viewBox={`0 0 280 ${svgH}`} className="w-full">
      {bars.map((bar, i) => {
        const y = i * (barH + gap) + 6;
        const fillW = Math.max(4, (bar.count / bar.maxVal) * maxW);
        return (
          <g key={i}>
            {/* Color accent line */}
            <rect x="2" y={y + 2} width="3" height={barH - 4} rx="1.5" fill={bar.color} />
            <text x="12" y={y + barH / 2 + 1} fill="#8b949e" fontSize="10" fontWeight="600">{bar.label}</text>
            <rect x="80" y={y + 2} width={maxW} height={barH - 4} rx="4" fill="#21262d" />
            <rect x="80" y={y + 2} width={fillW} height={barH - 4} rx="4" fill={bar.color} opacity={0.8} />
            <circle cx={80 + fillW - 4} cy={y + barH / 2} r="2.5" fill={bar.color} />
            <text x={80 + maxW + 8} y={y + barH / 2 + 1} fill="#c9d1d9" fontSize="11" fontWeight="700">
              {bar.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   SVG 12: RewardCollectionScatter (Tab 4 - Rewards)
   8 scatter dots showing collection value vs rarity
   Colors: #00E5FF, #FF5500
   ============================================================ */

function RewardCollectionScatter({ playerName, week }: {
  playerName: string;
  week: number;
}) {
  const dots = useMemo(() => {
    const labels = ['Boot', 'Glove', 'Kit', 'Ball', 'Badge', 'Frame', 'Taunt', 'Ring'];
    return labels.map((label, i) => {
      const value = seededInt(playerName, week, `sc-val-${i}`, 10, 95);
      const rarity = seededInt(playerName, week, `sc-rar-${i}`, 1, 4);
      return { label, value, rarity };
    });
  }, [playerName, week]);

  const pad = { top: 18, right: 16, bottom: 34, left: 34 };
  const w = 280 - pad.left - pad.right;
  const h = 140 - pad.top - pad.bottom;
  const rarityColors = ['', '#666666', '#00E5FF', '#CCFF00', '#FF5500'];
  const rarityLabels = ['', 'Common', 'Rare', 'Epic', 'Legendary'];

  return (
    <svg viewBox="0 0 280 180" className="w-full">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => {
        const x = pad.left + (v / 100) * w;
        const y = pad.top + (1 - v / 100) * h;
        return (
          <g key={v}>
            <line x1={x} y1={pad.top} x2={x} y2={pad.top + h} stroke="#21262d" strokeWidth="0.5" />
            <line x1={pad.left} y1={y} x2={pad.left + w} y2={y} stroke="#21262d" strokeWidth="0.5" />
          </g>
        );
      })}
      {/* Axis labels */}
      <text x={pad.left + w / 2} y={pad.top + h + 28} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="500">
        Collection Value
      </text>
      <text x={8} y={pad.top + h / 2} textAnchor="middle" fill="#8b949e" fontSize="8"
        transform={`rotate(-90, ${8}, ${pad.top + h / 2})`}>
        Rarity Tier
      </text>
      {/* Scatter dots */}
      {dots.map((d, i) => {
        const x = pad.left + (d.value / 100) * w;
        const y = pad.top + (1 - d.rarity / 4) * h;
        return (
          <g key={i}>
            {/* Outer glow */}
            <circle cx={x} cy={y} r="10" fill={rarityColors[d.rarity]} opacity="0.12" />
            {/* Main dot */}
            <circle cx={x} cy={y} r="7" fill={rarityColors[d.rarity]} opacity="0.85" />
            {/* Index */}
            <text x={x} y={y + 3} textAnchor="middle" fill="#0d1117" fontSize="7" fontWeight="700">
              {i + 1}
            </text>
            {/* Label */}
            <text x={x} y={y - 12} textAnchor="middle" fill="#484f58" fontSize="6">{d.label}</text>
          </g>
        );
      })}
      {/* Legend */}
      {rarityLabels.slice(1).map((label, i) => (
        <g key={i}>
          <circle cx={pad.left + w - 72 + i * 20} cy={pad.top + h + 18} r="4" fill={rarityColors[i + 1]} />
          <text x={pad.left + w - 72 + i * 20} y={pad.top + h + 28} textAnchor="middle" fill="#484f58" fontSize="5">
            {label.charAt(0)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ============================================================
   Tab 1: Challenges
   ============================================================ */

function ChallengesTab({ playerName, week, attrs, overall }: {
  playerName: string;
  week: number;
  attrs: { shooting: number; passing: number; dribbling: number; defending: number; physical: number };
  overall: number;
}) {
  const totalChallenges = seededInt(playerName, week, 'tot-chal', 12, 48);
  const streakDays = seededInt(playerName, week, 'streak-days', 1, 21);
  const bestScore = seededInt(playerName, week, 'best-sc', 280, 500);
  const weeklyXp = seededInt(playerName, week, 'wk-xp', 800, 4200);

  const challengeItems = useMemo(() => [
    { name: 'Free Kick Mastery', attr: 'Shooting', seed: 'ach-0' },
    { name: 'Sprint Record Breaker', attr: 'Pace', seed: 'ach-1' },
    { name: 'Pass Accuracy Drill', attr: 'Passing', seed: 'ach-2' },
    { name: 'Dribble Slalom Pro', attr: 'Dribbling', seed: 'ach-3' },
    { name: 'Tackle Challenge', attr: 'Defending', seed: 'ach-4' },
    { name: 'Endurance Marathon', attr: 'Physical', seed: 'ach-5' },
  ], []);

  const dailyBonus = useMemo(() => {
    const claimed = seededRandom(playerName, week, 'daily-claimed') > 0.3;
    const bonusXp = seededInt(playerName, week, 'daily-bonus-xp', 50, 250);
    const bonusCoins = seededInt(playerName, week, 'daily-bonus-coins', 10, 100);
    return { claimed, bonusXp, bonusCoins };
  }, [playerName, week]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={<Target className="h-4 w-4" />} label="Completed" value={totalChallenges} color="#FF5500" />
        <StatPill icon={<Flame className="h-4 w-4" />} label="Streak" value={`${streakDays}d`} color="#00E5FF" />
        <StatPill icon={<Zap className="h-4 w-4" />} label="Best Score" value={bestScore} color="#CCFF00" />
      </div>

      {/* Weekly XP bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">Weekly XP</span>
          <span className="text-xs font-bold text-[#CCFF00]">{weeklyXp.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (weeklyXp / 5000) * 100)}%`, background: '#CCFF00' }} />
        </div>
        <p className="text-[9px] text-[#484f58] mt-1">{(5000 - weeklyXp > 0 ? (5000 - weeklyXp).toLocaleString() : '0')} XP to weekly cap</p>
      </div>

      {/* Donut */}
      <SvgCard title="Category Breakdown" icon={<Target className="h-4 w-4 text-[#FF5500]" />} delay={0.05}>
        <ChallengeCategoryDonut playerName={playerName} week={week} attrs={attrs} />
      </SvgCard>

      {/* Difficulty Bars */}
      <SvgCard title="Difficulty Completion" icon={<Zap className="h-4 w-4 text-[#FF5500]" />} delay={0.1}>
        <ChallengeDifficultyBars playerName={playerName} week={week} overall={overall} />
      </SvgCard>

      {/* Timeline */}
      <SvgCard title="Challenge Progress" icon={<Timer className="h-4 w-4 text-[#00E5FF]" />} delay={0.15}>
        <ActiveChallengeTimeline playerName={playerName} week={week} />
      </SvgCard>

      {/* Daily Bonus */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Flame className="h-4 w-4 text-[#FF5500]" />} title="Daily Bonus" />
        <div className={`flex items-center gap-3 p-3 rounded-sm ${dailyBonus.claimed ? 'bg-[#21262d]' : 'bg-[#FF5500] opacity-10'}`}>
          <div className="w-10 h-10 rounded-sm bg-[#21262d] flex items-center justify-center">
            <Award className="h-5 w-5 text-[#FF5500]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#c9d1d9] font-semibold">
              {dailyBonus.claimed ? 'Bonus Claimed!' : 'Claim Daily Bonus'}
            </p>
            <p className="text-[10px] text-[#8b949e]">
              +{dailyBonus.bonusXp} XP &middot; +{dailyBonus.bonusCoins} coins
            </p>
          </div>
          {dailyBonus.claimed ? (
            <span className="text-[10px] font-bold text-[#00E5FF]">DONE</span>
          ) : (
            <div className="px-3 py-1.5 rounded-sm bg-[#FF5500] text-[10px] font-bold text-[#0d1117]">
              CLAIM
            </div>
          )}
        </div>
      </div>

      {/* Challenge list */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2.5">
        <SectionHeader icon={<Crosshair className="h-4 w-4 text-[#FF5500]" />} title="Active Challenges" />
        {challengeItems.map((item, i) => {
          const pct = seededInt(playerName, week, item.seed, 10, 95);
          return (
            <ProgressRow key={i} label={`${item.name} (${item.attr})`} pct={pct} color="#FF5500" />
          );
        })}
      </div>

      {/* Challenge History */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Timer className="h-4 w-4 text-[#00E5FF]" />} title="Recent History" />
        <div className="space-y-1.5">
          {Array.from({ length: 5 }, (_, i) => {
            const challengeNames = ['Free Kick', 'Sprint', 'Accuracy', 'Agility', 'Power', 'Composure'];
            const scores = [340, 420, 280, 395, 460, 310];
            const name = challengeNames[seededInt(playerName, week, `hist-n-${i}`, 0, challengeNames.length - 1)];
            const score = scores[seededInt(playerName, week, `hist-s-${i}`, 0, scores.length - 1)];
            const rating = score >= 400 ? 'A' : score >= 300 ? 'B' : 'C';
            const ratingColor = score >= 400 ? '#CCFF00' : score >= 300 ? '#00E5FF' : '#FF5500';
            return (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-sm bg-[#21262d]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b949e]">{name}</span>
                  <span className="text-[8px] text-[#484f58]">{week - 4 + i}w ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c9d1d9] font-semibold">{score}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: ratingColor, background: `${ratingColor}15` }}>{rating}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Zap className="h-4 w-4 text-[#CCFF00]" />} title="Challenge Tips" />
        <div className="space-y-2">
          {[
            { tip: 'Higher attributes improve your accuracy and completion rate', icon: '🎯' },
            { tip: 'Maintain a daily streak for bonus XP multipliers', icon: '🔥' },
            { tip: 'Diamond challenges award 3x points but require 80+ rating', icon: '💎' },
            { tip: 'Completing all challenges in a tier unlocks the next tier', icon: '🏆' },
            { tip: 'Weekend challenges have double reward pools', icon: '⭐' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-sm mt-0.5 shrink-0">{item.icon}</span>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 2: Rankings
   ============================================================ */

function RankingsTab({ playerName, week, attrs }: {
  playerName: string;
  week: number;
  attrs: AttrBundle;
}) {
  const globalRank = seededInt(playerName, week, 'g-rank', 12, 500);
  const skillScore = Math.round(
    (attrs.shooting + attrs.passing + attrs.dribbling + attrs.defending + attrs.physical + attrs.pace) / 6,
  );
  const totalPoints = seededInt(playerName, week, 't-pts', 3000, 25000);
  const tier = globalRank <= 50 ? 'Elite' : globalRank <= 150 ? 'Master' : globalRank <= 300 ? 'Gold' : 'Silver';
  const tierColor: Record<string, string> = {
    Elite: '#FF5500', Master: '#CCFF00', Gold: '#00E5FF', Silver: '#666666',
  };

  const leaderboard = useMemo(() => {
    const entries = [
      { name: 'Marcus', score: 9820 },
      { name: 'Kai', score: 8750 },
      { name: playerName, score: seededInt(playerName, week, 'lb-self', 6000, 8000), isPlayer: true },
      { name: 'Lena', score: 7410 },
      { name: 'Sora', score: 6230 },
      { name: 'Ravi', score: 5110 },
      { name: 'Aisha', score: 4580 },
      { name: 'Tomás', score: 3920 },
    ];
    return entries.sort((a, b) => b.score - a.score);
  }, [playerName, week]);

  const weeklyBreakdown = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      label: `Week ${week - 3 + i}`,
      points: seededInt(playerName, week, `wb-${i}`, 400, 3200),
      rankChange: seededInt(playerName, week, `wb-rc-${i}`, -15, 20),
    }));
  }, [playerName, week]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={<Star className="h-4 w-4" />} label="Global Rank" value={`#${globalRank}`} color="#CCFF00" />
        <StatPill icon={<BarChart3 className="h-4 w-4" />} label="Skill Score" value={skillScore} color="#00E5FF" />
        <StatPill icon={<Trophy className="h-4 w-4" />} label="Total Points" value={totalPoints.toLocaleString()} color="#FF5500" />
      </div>

      {/* Attribute Breakdown Bars */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Dumbbell className="h-4 w-4 text-[#CCFF00]" />} title="Attribute Breakdown" />
        <div className="space-y-2.5">
          {[
            { label: 'Pace', value: attrs.pace, color: '#00E5FF' },
            { label: 'Shooting', value: attrs.shooting, color: '#FF5500' },
            { label: 'Passing', value: attrs.passing, color: '#CCFF00' },
            { label: 'Dribbling', value: attrs.dribbling, color: '#00E5FF' },
            { label: 'Defending', value: attrs.defending, color: '#666666' },
            { label: 'Physical', value: attrs.physical, color: '#FF5500' },
          ].map((attr, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#c9d1d9]">{attr.label}</span>
                <span className="text-[10px] font-semibold" style={{ color: attr.color }}>{attr.value}</span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${attr.value}%`, background: attr.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier badge */}
      <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2.5">
        <Shield className="h-4 w-4" style={{ color: tierColor[tier] }} />
        <span className="text-xs text-[#8b949e]">Current Tier:</span>
        <span className="text-xs font-bold" style={{ color: tierColor[tier] }}>{tier}</span>
        <div className="flex-1" />
        <span className="text-[10px] text-[#484f58]">Next: {tier === 'Elite' ? 'Max' : tier === 'Master' ? 'Elite' : tier === 'Gold' ? 'Master' : 'Gold'}</span>
      </div>

      {/* Radar */}
      <SvgCard title="Skill Radar" icon={<BarChart3 className="h-4 w-4 text-[#CCFF00]" />} delay={0.05}>
        <SkillScoreRadar attrs={attrs} playerName={playerName} week={week} />
      </SvgCard>

      {/* Ranking Line */}
      <SvgCard title="Ranking Trend" icon={<TrendingUp className="h-4 w-4 text-[#00E5FF]" />} delay={0.1}>
        <GlobalRankingLine playerName={playerName} week={week} />
      </SvgCard>

      {/* Points Distribution */}
      <SvgCard title="Points Distribution" icon={<Award className="h-4 w-4 text-[#FF5500]" />} delay={0.15}>
        <PointsDistributionBars playerName={playerName} week={week} />
      </SvgCard>

      {/* Weekly Breakdown */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<TrendingUp className="h-4 w-4 text-[#00E5FF]" />} title="Weekly Breakdown" />
        <div className="space-y-2">
          {weeklyBreakdown.map((wb, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-[#8b949e] w-16">{wb.label}</span>
              <span className="text-[#c9d1d9] font-semibold">{wb.points.toLocaleString()} pts</span>
              <span className={`font-semibold ${wb.rankChange > 0 ? 'text-[#00E5FF]' : wb.rankChange < 0 ? 'text-[#FF5500]' : 'text-[#484f58]'}`}>
                {wb.rankChange > 0 ? `+${wb.rankChange}` : wb.rankChange}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-1.5">
        <SectionHeader icon={<Trophy className="h-4 w-4 text-[#CCFF00]" />} title="Top Challengers" />
        {leaderboard.map((entry, i) => {
          const rankColors = ['#CCFF00', '#c9d1d9', '#FF5500', '#8b949e', '#8b949e', '#8b949e', '#8b949e', '#8b949e'];
          return (
            <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-sm ${entry.isPlayer ? 'bg-[#21262d]' : ''}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold w-5 text-center" style={{ color: rankColors[i] }}>
                  {i + 1}
                </span>
                <span className={`text-xs ${entry.isPlayer ? 'text-[#c9d1d9] font-bold' : 'text-[#8b949e]'}`}>
                  {entry.name}
                </span>
                {entry.isPlayer && (
                  <span className="text-[8px] bg-[#00E5FF] bg-opacity-15 text-[#00E5FF] px-1.5 py-0.5 rounded-sm font-semibold">
                    YOU
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold ${entry.isPlayer ? 'text-[#00E5FF]' : 'text-[#8b949e]'}`}>
                {entry.score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rank Stats Summary */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<BarChart3 className="h-4 w-4 text-[#00E5FF]" />} title="Rank Statistics" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Best Rank', value: `#${seededInt(playerName, week, 'stat-best', 1, 30)}`, color: '#CCFF00' },
            { label: 'Worst Rank', value: `#${seededInt(playerName, week, 'stat-worst', 200, 500)}`, color: '#FF5500' },
            { label: 'Avg Rank', value: `#${seededInt(playerName, week, 'stat-avg', 50, 200)}`, color: '#00E5FF' },
            { label: 'Weeks in Top 100', value: `${seededInt(playerName, week, 'stat-top', 2, 16)}w`, color: '#CCFF00' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#21262d] rounded-sm p-2.5">
              <p className="text-[9px] text-[#484f58] uppercase tracking-wide font-semibold">{stat.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 3: Records
   ============================================================ */

function RecordsTab({ playerName, week, attrs, careerSeasons }: {
  playerName: string;
  week: number;
  attrs: AttrBundle;
  careerSeasons: number;
}) {
  const bestTime = seededInt(playerName, week, 'best-time', 8, 45);
  const topStreak = seededInt(playerName, week, 'top-streak', 3, 28);
  const improvement = seededInt(playerName, week, 'impr-pct', 5, 42);
  const totalSessions = seededInt(playerName, week, 'tot-sess', 20, 180);
  const perfectRounds = seededInt(playerName, week, 'perf-rnd', 2, 18);

  const milestones = useMemo(() => [
    { text: 'Completed 25 challenges', done: true },
    { text: 'Reached Gold tier in Sprint', done: true },
    { text: 'Score 500+ in a single challenge', done: seededRandom(playerName, week, 'ms-3') > 0.4 },
    { text: 'Maintain a 14-day streak', done: seededRandom(playerName, week, 'ms-4') > 0.6 },
    { text: 'Earn 10,000 total challenge points', done: seededRandom(playerName, week, 'ms-5') > 0.5 },
    { text: 'Complete all difficulty tiers', done: seededRandom(playerName, week, 'ms-6') > 0.7 },
    { text: 'Set 5 personal bests in one season', done: seededRandom(playerName, week, 'ms-7') > 0.65 },
    { text: 'Finish Diamond difficulty challenge', done: seededRandom(playerName, week, 'ms-8') > 0.8 },
  ], [playerName, week]);

  const statComparison = useMemo(() => [
    { label: 'Speed', value: attrs.pace + seededInt(playerName, week, 'cmp-spd', 0, 10), best: 98, color: '#CCFF00' },
    { label: 'Accuracy', value: attrs.shooting + seededInt(playerName, week, 'cmp-acc', 0, 8), best: 95, color: '#00E5FF' },
    { label: 'Endurance', value: attrs.physical + seededInt(playerName, week, 'cmp-end', 0, 12), best: 92, color: '#FF5500' },
  ], [attrs, playerName, week]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={<Timer className="h-4 w-4" />} label="Best Time" value={`${bestTime}s`} color="#FF5500" />
        <StatPill icon={<Flame className="h-4 w-4" />} label="Top Streak" value={`${topStreak}d`} color="#CCFF00" />
        <StatPill icon={<TrendingUp className="h-4 w-4" />} label="Improved" value={`${improvement}%`} color="#00E5FF" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <p className="text-[10px] text-[#484f58] uppercase font-semibold tracking-wide">Total Sessions</p>
          <p className="text-lg font-bold text-[#c9d1d9]">{totalSessions}</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <p className="text-[10px] text-[#484f58] uppercase font-semibold tracking-wide">Perfect Rounds</p>
          <p className="text-lg font-bold text-[#CCFF00]">{perfectRounds}</p>
        </div>
      </div>

      {/* Personal Best Ring */}
      <SvgCard title="Personal Bests" icon={<Award className="h-4 w-4 text-[#FF5500]" />} delay={0.05}>
        <PersonalBestRing playerName={playerName} week={week} careerSeasons={careerSeasons} />
      </SvgCard>

      {/* Record Category Donut */}
      <SvgCard title="Record Categories" icon={<Shield className="h-4 w-4 text-[#CCFF00]" />} delay={0.1}>
        <RecordCategoryDonut
          playerName={playerName}
          week={week}
          attrs={{ pace: attrs.pace, shooting: attrs.shooting, physical: attrs.physical, dribbling: attrs.dribbling }}
        />
      </SvgCard>

      {/* Improvement Area Chart */}
      <SvgCard title="Improvement Trend" icon={<TrendingUp className="h-4 w-4 text-[#00E5FF]" />} delay={0.15}>
        <RecordImprovementAreaChart playerName={playerName} week={week} />
      </SvgCard>

      {/* Stat Comparison */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<BarChart3 className="h-4 w-4 text-[#FF5500]" />} title="Stat Comparison" />
        <div className="space-y-3">
          {statComparison.map((stat, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#c9d1d9]">{stat.label}</span>
                <span className="text-[10px] text-[#8b949e]">
                  {stat.value} / {stat.best}
                </span>
              </div>
              <div className="relative h-2 bg-[#21262d] rounded-sm overflow-hidden">
                <div className="h-full rounded-sm" style={{
                  width: `${Math.min(100, (stat.value / stat.best) * 100)}%`,
                  background: stat.color,
                }} />
                <div className="absolute top-0 h-full w-px" style={{
                  left: `${Math.min(100, (stat.value / stat.best) * 100)}%`,
                  background: stat.color,
                  opacity: 0.5,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
        <SectionHeader icon={<Star className="h-4 w-4 text-[#00E5FF]" />} title="Milestones" />
        <p className="text-[10px] text-[#484f58] mb-1">
          {milestones.reduce((s, m) => s + (m.done ? 1 : 0), 0)} of {milestones.length} achieved
        </p>
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 ${m.done ? 'bg-[#00E5FF]' : 'bg-[#21262d] border border-[#30363d]'}`}>
              {m.done && <span className="text-[8px] text-[#0d1117] font-bold">&#10003;</span>}
            </div>
            <span className={`text-xs ${m.done ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>{m.text}</span>
          </div>
        ))}
      </div>

      {/* Season Records */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Flame className="h-4 w-4 text-[#CCFF00]" />} title="Season Records" />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Challenges Done', value: seededInt(playerName, week, 'sr-done', 8, 48), color: '#FF5500' },
            { label: 'Avg Score', value: seededInt(playerName, week, 'sr-avg', 180, 420), color: '#00E5FF' },
            { label: 'Perfect Runs', value: seededInt(playerName, week, 'sr-perf', 0, 12), color: '#CCFF00' },
            { label: 'Diamond Clears', value: seededInt(playerName, week, 'sr-dia', 0, 5), color: '#FF5500' },
          ].map((rec, i) => (
            <div key={i} className="bg-[#21262d] rounded-sm p-3">
              <p className="text-[9px] text-[#484f58] uppercase tracking-wide font-semibold">{rec.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: rec.color }}>{rec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All-Time Records Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Timer className="h-4 w-4 text-[#FF5500]" />} title="All-Time Records" />
        <div className="space-y-2">
          {[
            { label: 'Fastest Sprint', value: `${seededInt(playerName, week, 'at-sprint', 6, 22)}s`, record: '5.2s' },
            { label: 'Most Accurate', value: `${seededInt(playerName, week, 'at-acc', 78, 99)}%`, record: '99%' },
            { label: 'Longest Streak', value: `${seededInt(playerName, week, 'at-streak', 5, 35)}d`, record: '42d' },
            { label: 'Highest Single Score', value: `${seededInt(playerName, week, 'at-hi', 380, 500)}`, record: '498' },
            { label: 'Most Perfect Rounds', value: `${seededInt(playerName, week, 'at-perf', 3, 24)}`, record: '31' },
            { label: 'Quickest Diamond Clear', value: `${seededInt(playerName, week, 'at-dia', 25, 90)}s`, record: '18s' },
          ].map((rec, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-sm bg-[#21262d]">
              <span className="text-[11px] text-[#8b949e]">{rec.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#c9d1d9] font-semibold">{rec.value}</span>
                <span className="text-[10px] text-[#484f58]">({rec.record})</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#484f58] mt-2">World record shown in parentheses</p>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 4: Rewards
   ============================================================ */

function RewardsTab({ playerName, week, achievements }: {
  playerName: string;
  week: number;
  achievements: { rarity: string; unlocked: boolean; name: string; icon: string }[];
}) {
  const unlockedCount = achievements.reduce((s, a) => s + (a.unlocked ? 1 : 0), 0);
  const totalAchievements = achievements.length;
  const collectionValue = seededInt(playerName, week, 'coll-val', 500, 15000);
  const nextRewardProgress = seededInt(playerName, week, 'nxt-rew', 20, 88);

  const rarityColor: Record<string, string> = {
    common: '#666666', rare: '#00E5FF', epic: '#CCFF00', legendary: '#FF5500',
  };

  const rewardShelf = useMemo(() => {
    const items = [
      { id: 'elite-boots', name: 'Elite Striker Boots', rarity: 'legendary' as const, icon: '👟', cost: 5000 },
      { id: 'gold-gloves', name: 'Golden Goalkeeper Gloves', rarity: 'epic' as const, icon: '🧤', cost: 3000 },
      { id: 'neon-kit', name: 'Neon Edition Kit', rarity: 'rare' as const, icon: '👕', cost: 1500 },
      { id: 'sig-ball', name: 'Signature Football', rarity: 'rare' as const, icon: '⚽', cost: 1200 },
      { id: 'iron-badge', name: 'Iron Wall Badge', rarity: 'common' as const, icon: '🏷️', cost: 400 },
      { id: 'cool-frame', name: 'Cool Profile Frame', rarity: 'epic' as const, icon: '🖼️', cost: 2800 },
    ];
    return items.map(item => ({
      ...item,
      owned: seededRandom(playerName, week, `own-${item.id}`) > 0.55,
      equipped: seededRandom(playerName, week, `eq-${item.id}`) > 0.85,
    }));
  }, [playerName, week]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill icon={<Award className="h-4 w-4" />} label="Unlocked" value={unlockedCount} color="#CCFF00" />
        <StatPill icon={<Trophy className="h-4 w-4" />} label="Collection" value={collectionValue.toLocaleString()} color="#FF5500" />
        <StatPill icon={<Flame className="h-4 w-4" />} label="Next Reward" value={`${nextRewardProgress}%`} color="#00E5FF" />
      </div>

      {/* Collection value bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">Collection Value</span>
          <span className="text-xs font-bold text-[#FF5500]">{collectionValue.toLocaleString()} coins</span>
        </div>
        <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (collectionValue / 15000) * 100)}%`, background: '#FF5500' }} />
        </div>
        <p className="text-[9px] text-[#484f58] mt-1">{(15000 - collectionValue > 0 ? (15000 - collectionValue).toLocaleString() : '0')} coins to max value</p>
      </div>

      {/* Reward Unlock Ring */}
      <SvgCard title="Unlock Progress" icon={<Award className="h-4 w-4 text-[#CCFF00]" />} delay={0.05}>
        <RewardUnlockRing totalAchievements={totalAchievements} unlockedCount={unlockedCount} />
      </SvgCard>

      {/* Reward Rarity Bars */}
      <SvgCard title="Rarity Breakdown" icon={<Star className="h-4 w-4 text-[#00E5FF]" />} delay={0.1}>
        <RewardRarityBars achievements={achievements} />
      </SvgCard>

      {/* Reward Collection Scatter */}
      <SvgCard title="Collection Map" icon={<Trophy className="h-4 w-4 text-[#FF5500]" />} delay={0.15}>
        <RewardCollectionScatter playerName={playerName} week={week} />
      </SvgCard>

      {/* Next reward progress */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Zap className="h-4 w-4 text-[#FF5500]" />} title="Reward Track" />
        <div className="space-y-3">
          {[
            { name: 'Elite Striker Badge', pct: nextRewardProgress, color: '#FF5500' },
            { name: 'Diamond Challenge Access', pct: Math.min(100, nextRewardProgress + 15), color: '#CCFF00' },
            { name: 'Legendary Reward Crate', pct: Math.min(100, nextRewardProgress - 10), color: '#00E5FF' },
          ].map((reward, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#c9d1d9]">{reward.name}</span>
                <span className="text-[10px] text-[#8b949e]">{reward.pct}%</span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${Math.max(0, reward.pct)}%`, background: reward.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent unlocks */}
        <div className="mt-4 pt-3 border-t border-[#30363d]">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Recent Unlocks</span>
          <div className="mt-2 space-y-1.5">
            {achievements.filter(a => a.unlocked).slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-sm">{a.icon}</span>
                <span className="text-xs text-[#c9d1d9] flex-1 truncate">{a.name}</span>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-sm"
                  style={{ color: rarityColor[a.rarity] ?? '#666', background: `${rarityColor[a.rarity] ?? '#666'}15` }}>
                  {a.rarity}
                </span>
              </div>
            ))}
            {achievements.filter(a => a.unlocked).length === 0 && (
              <p className="text-xs text-[#484f58]">No rewards unlocked yet. Complete challenges to earn rewards!</p>
            )}
          </div>
        </div>
      </div>

      {/* Reward Shelf */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Trophy className="h-4 w-4 text-[#CCFF00]" />} title="Reward Shelf" />
        <div className="grid grid-cols-2 gap-2">
          {rewardShelf.map((item, i) => (
            <div key={i} className={`p-2.5 rounded-sm border ${item.equipped ? 'border-[#CCFF00] bg-[#CCFF00] opacity-5' : item.owned ? 'border-[#30363d] bg-[#21262d]' : 'border-[#21262d] bg-[#161b22] opacity-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-semibold truncate ${item.owned ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                    {item.name}
                  </p>
                  <p className="text-[9px] font-semibold uppercase" style={{ color: rarityColor[item.rarity] }}>
                    {item.rarity}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#484f58]">{item.cost.toLocaleString()} coins</span>
                {item.equipped ? (
                  <span className="text-[8px] font-bold text-[#CCFF00] bg-[#CCFF00] bg-opacity-10 px-1.5 py-0.5 rounded-sm">EQUIPPED</span>
                ) : item.owned ? (
                  <span className="text-[8px] font-bold text-[#00E5FF] bg-[#00E5FF] bg-opacity-10 px-1.5 py-0.5 rounded-sm">OWNED</span>
                ) : (
                  <span className="text-[8px] font-bold text-[#8b949e]">LOCKED</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Rewards */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Star className="h-4 w-4 text-[#00E5FF]" />} title="Upcoming Rewards" />
        <div className="space-y-2">
          {[
            { name: 'Platinum Striker Badge', requirement: 'Reach top 50', rarity: 'epic', icon: '🏅', pct: nextRewardProgress },
            { name: 'Inferno Kit Skin', requirement: '10 Diamond clears', rarity: 'legendary', icon: '👕', pct: Math.max(0, nextRewardProgress - 25) },
            { name: 'Champion Taunt', requirement: 'Win 50 challenges', rarity: 'rare', icon: '🎭', pct: Math.min(100, nextRewardProgress + 10) },
          ].map((reward, i) => {
            const rColor = rarityColor[reward.rarity] ?? '#666';
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-sm bg-[#21262d]">
                <span className="text-lg shrink-0">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#c9d1d9] font-semibold truncate">{reward.name}</span>
                  </div>
                  <p className="text-[9px] text-[#484f58] mt-0.5">{reward.requirement}</p>
                  <div className="h-1 bg-[#161b22] rounded-sm overflow-hidden mt-1.5">
                    <div className="h-full rounded-sm" style={{ width: `${Math.max(0, reward.pct)}%`, background: rColor, opacity: 0.7 }} />
                  </div>
                </div>
                <span className="text-[9px] font-semibold uppercase" style={{ color: rColor }}>{reward.rarity}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loot Box Preview */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <SectionHeader icon={<Flame className="h-4 w-4 text-[#FF5500]" />} title="Loot Box Preview" />
        <div className="space-y-3">
          {[
            { name: 'Bronze Crate', cost: 200, items: ['XP Boost', 'Common Badge', '50 Coins'], color: '#666666' },
            { name: 'Silver Crate', cost: 500, items: ['XP Boost+', 'Rare Badge', '150 Coins', 'Avatar Frame'], color: '#8b949e' },
            { name: 'Gold Crate', cost: 1200, items: ['XP Boost++', 'Epic Badge', '500 Coins', 'Taunt', 'Kit Skin'], color: '#CCFF00' },
          ].map((crate, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-sm bg-[#21262d]">
              <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: `${crate.color}15`, border: `1px solid ${crate.color}30` }}>
                <Trophy className="h-5 w-5" style={{ color: crate.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c9d1d9] font-semibold">{crate.name}</span>
                  <span className="text-[9px] text-[#8b949e]">{crate.cost} coins</span>
                </div>
                <p className="text-[9px] text-[#484f58] mt-0.5 truncate">
                  {crate.items.join(' \u00b7 ')}
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-sm text-[9px] font-bold shrink-0" style={{
                background: crate.color,
                color: '#0d1117',
              }}>
                OPEN
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#484f58] mt-3">Rewards are randomly selected from the pool. Duplicate items grant bonus coins.</p>
      </div>
    </div>
  );
}

/* ============================================================
   Tab Definitions
   ============================================================ */

const TABS = [
  { id: 'challenges', label: 'Challenges', Icon: Target },
  { id: 'rankings', label: 'Rankings', Icon: Star },
  { id: 'records', label: 'Records', Icon: Award },
  { id: 'rewards', label: 'Rewards', Icon: Trophy },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ============================================================
   Main Export
   ============================================================ */

export default function SkillChallengesEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabId>('challenges');

  const player = gameState?.player ?? null;
  const clubName = gameState?.currentClub.name ?? '';

  const week = player ? gameState!.currentWeek : 1;
  const season = player ? gameState!.currentSeason : 1;
  const playerName = player?.name ?? 'Player';

  const attrs = useMemo((): AttrBundle => ({
    shooting: player?.attributes.shooting ?? 50,
    passing: player?.attributes.passing ?? 50,
    dribbling: player?.attributes.dribbling ?? 50,
    defending: player?.attributes.defending ?? 50,
    physical: player?.attributes.physical ?? 50,
    pace: player?.attributes.pace ?? 50,
  }), [player]);

  const overall = player?.overall ?? 50;
  const achievements = gameState?.achievements ?? [];
  const careerSeasons = player?.careerStats.seasonsPlayed ?? 0;

  if (!gameState || !player) return <></>;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-sm bg-[#FF5500] opacity-15 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-[#FF5500]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Skill Challenges</h1>
            <p className="text-[11px] text-[#8b949e]">
              {clubName} &mdash; Season {season}, Week {week}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-sm text-xs font-semibold transition-opacity ${
                isActive
                  ? 'bg-[#21262d] text-[#c9d1d9] shadow-sm'
                  : 'text-[#484f58] hover:text-[#8b949e]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'challenges' && (
            <ChallengesTab playerName={playerName} week={week} attrs={attrs} overall={overall} />
          )}
          {activeTab === 'rankings' && (
            <RankingsTab playerName={playerName} week={week} attrs={attrs} />
          )}
          {activeTab === 'records' && (
            <RecordsTab playerName={playerName} week={week} attrs={attrs} careerSeasons={careerSeasons} />
          )}
          {activeTab === 'rewards' && (
            <RewardsTab playerName={playerName} week={week} achievements={achievements} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="mt-6 bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <SectionHeader icon={<Info className="h-4 w-4 text-[#484f58]" />} title="About Skill Challenges" />
        <div className="space-y-2.5">
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            Skill Challenges are weekly tests that push your abilities to the limit.
            Complete challenges to earn XP, coins, and exclusive cosmetic rewards.
            Your attribute ratings directly affect challenge performance.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: '12 SVG Visualizations', icon: BarChart3 },
              { label: '4 Challenge Tabs', icon: Target },
              { label: 'Seeded Data', icon: Zap },
              { label: 'Progress Tracking', icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#21262d]">
                <item.icon className="h-3 w-3 text-[#00E5FF]" />
                <span className="text-[10px] text-[#8b949e] font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#484f58]">Data refreshes each game week</span>
              <span className="text-[#484f58]">v1.0</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
