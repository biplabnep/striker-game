'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { FOCUS_AREA_ATTRIBUTES, calculateFocusBonusMultiplier } from '@/lib/game/progressionEngine';
import { SeasonTrainingFocusArea, PlayerAttributes } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sword, Shield, Zap, Dumbbell, Brain,
  Check, X, Sparkles, TrendingUp, History, Lock,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

const ATTR_CATEGORIES: Record<string, 'physical' | 'technical' | 'mental'> = {
  pace: 'physical',
  physical: 'physical',
  shooting: 'technical',
  passing: 'technical',
  dribbling: 'technical',
  defending: 'mental',
};

const BAR_COLORS: Record<string, string> = {
  red: 'bg-red-500/30',
  blue: 'bg-blue-500/30',
  amber: 'bg-amber-500/30',
  emerald: 'bg-emerald-500/30',
  violet: 'bg-violet-500/30',
};

const WEEKS_PER_SEASON = 38;
const FOCUS_GROWTH_BASE = 0.08;

const WEB3 = {
  orange: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  gray: '#666',
  bg: '#0d1117',
  bgCard: '#161b22',
  bgRaised: '#21262d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  textMuted: '#484f58',
  border: '#30363d',
} as const;

const DONUT_COLORS = ['#FF5500', '#CCFF00', '#00E5FF', '#666', '#FF5500', '#CCFF00'];
const SIX_ATTRS: (keyof PlayerAttributes)[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const SIX_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

function getAgeMultiplier(age: number, category: 'physical' | 'technical' | 'mental'): number {
  if (age <= 16) return category === 'physical' ? 1.5 : category === 'technical' ? 1.8 : 1.6;
  if (age <= 19) return category === 'physical' ? 1.4 : category === 'technical' ? 1.6 : 1.5;
  if (age <= 21) return category === 'physical' ? 1.2 : category === 'technical' ? 1.3 : 1.3;
  if (age <= 23) return category === 'physical' ? 1.0 : category === 'technical' ? 1.1 : 1.2;
  if (age <= 26) return category === 'physical' ? 0.8 : category === 'technical' ? 0.9 : 1.0;
  if (age <= 29) return category === 'physical' ? 0.5 : category === 'technical' ? 0.7 : 0.9;
  if (age <= 31) return category === 'physical' ? 0.1 : category === 'technical' ? 0.4 : 0.6;
  if (age <= 33) return category === 'physical' ? -0.3 : category === 'technical' ? 0.1 : 0.3;
  if (age <= 35) return category === 'physical' ? -0.6 : category === 'technical' ? -0.2 : 0.1;
  if (age <= 37) return category === 'physical' ? -0.9 : category === 'technical' ? -0.5 : -0.2;
  return category === 'physical' ? -1.2 : category === 'technical' ? -0.8 : -0.4;
}

function getRecommendedFocus(position: string): SeasonTrainingFocusArea {
  if (['ST', 'CF', 'LW', 'RW'].includes(position)) return 'attacking';
  if (['CAM', 'CM', 'LM', 'RM'].includes(position)) return 'technical';
  if (['CDM', 'CB', 'LB', 'RB'].includes(position)) return 'tactical';
  return 'defensive';
}

function getMultiplierBadge(multiplier: number): string {
  if (multiplier >= 1.8) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
  if (multiplier >= 1.65) return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
  return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
}

function formatGains(gains: Record<string, number>): string {
  return Object.entries(gains)
    .filter(([, g]) => g > 0)
    .map(([attr, g]) => `+${g} ${attr.charAt(0).toUpperCase() + attr.slice(1)}`)
    .join(', ');
}

const FOCUS_AREAS: {
  area: SeasonTrainingFocusArea;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}[] = [
  {
    area: 'attacking',
    label: 'Attacking',
    icon: <Sword className="h-6 w-6" />,
    accentColor: 'red',
    accentBg: 'bg-red-500/10',
    accentBorder: 'border-red-500/25',
    accentText: 'text-red-400',
    description: 'Shooting & Dribbling',
  },
  {
    area: 'defensive',
    label: 'Defensive',
    icon: <Shield className="h-6 w-6" />,
    accentColor: 'blue',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/25',
    accentText: 'text-blue-400',
    description: 'Defending',
  },
  {
    area: 'physical',
    label: 'Physical',
    icon: <Zap className="h-6 w-6" />,
    accentColor: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/25',
    accentText: 'text-amber-400',
    description: 'Pace & Physical',
  },
  {
    area: 'technical',
    label: 'Technical',
    icon: <Dumbbell className="h-6 w-6" />,
    accentColor: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/25',
    accentText: 'text-emerald-400',
    description: 'Passing, Dribbling & Shooting',
  },
  {
    area: 'tactical',
    label: 'Tactical',
    icon: <Brain className="h-6 w-6" />,
    accentColor: 'violet',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/25',
    accentText: 'text-violet-400',
    description: 'Passing & Defending',
  },
];

interface SeasonTrainingFocusModalProps {
  open: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   SVG 1 — TrainingFocusDistributionDonut
   6-segment donut chart (PAC / SHO / PAS / DRI / DEF / PHY)
   ═══════════════════════════════════════════════════════════════ */

function TrainingFocusDistributionDonut({ attributes }: { attributes: PlayerAttributes }) {
  const cx = 80;
  const cy = 80;
  const outerR = 65;
  const innerR = 38;

  const segments = useMemo(() => {
    const values = SIX_ATTRS.map(a => attributes[a] ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    if (total === 0) return SIX_LABELS.map((label, i) => ({ startAngle: i * 60, pct: 1 / 6, label }));

    const items = values.map((val, i) => ({ val, i }));
    return items.reduce<{ startAngle: number; pct: number; label: string }[]>((acc, { val, i }) => {
      const pct = val / total;
      const prev = acc.length > 0 ? acc[acc.length - 1].startAngle + acc[acc.length - 1].pct * 360 : 0;
      return [...acc, { startAngle: prev, pct, label: SIX_LABELS[i] }];
    }, []);
  }, [attributes]);

  function arcPath(startDeg: number, endDeg: number, oR: number, iR: number): string {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const sx = cx + oR * Math.cos(toRad(startDeg - 90));
    const sy = cy + oR * Math.sin(toRad(startDeg - 90));
    const ex = cx + oR * Math.cos(toRad(endDeg - 90));
    const ey = cy + oR * Math.sin(toRad(endDeg - 90));
    const ix = cx + iR * Math.cos(toRad(endDeg - 90));
    const iy = cy + iR * Math.sin(toRad(endDeg - 90));
    const jx = cx + iR * Math.cos(toRad(startDeg - 90));
    const jy = cy + iR * Math.sin(toRad(startDeg - 90));
    return `M ${sx} ${sy} A ${oR} ${oR} 0 ${largeArc} 1 ${ex} ${ey} L ${ix} ${iy} A ${iR} ${iR} 0 ${largeArc} 0 ${jx} ${jy} Z`;
  }

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Focus Distribution</h4>
      <svg viewBox="0 0 160 160" className="w-full max-w-[160px] mx-auto">
        {segments.map((seg, i) => {
          const endAngle = seg.startAngle + seg.pct * 360;
          return (
            <path
              key={i}
              d={arcPath(seg.startAngle, endAngle, outerR, innerR)}
              fill={DONUT_COLORS[i]}
              opacity={0.85}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={WEB3.textPrimary} fontSize="11" fontWeight="bold">
          {SIX_ATTRS.reduce((s, a) => s + (attributes[a] ?? 0), 0)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill={WEB3.textMuted} fontSize="7">
          TOTAL
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
        {SIX_LABELS.map((l, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: DONUT_COLORS[i] }} />
            <span className="text-[10px] text-[#8b949e]">{l}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 2 — FocusEffectivenessBars
   6 horizontal bars showing effectiveness % per focus area
   ═══════════════════════════════════════════════════════════════ */

function FocusEffectivenessBars({
  areaMultipliers,
}: {
  areaMultipliers: Record<SeasonTrainingFocusArea, number>;
}) {
  const entries = useMemo(() => {
    return (Object.entries(areaMultipliers) as [SeasonTrainingFocusArea, number][]).reduce<{
      area: SeasonTrainingFocusArea;
      label: string;
      pct: number;
    }[]>((acc, [area, mul]) => {
      const config = FOCUS_AREAS.find(f => f.area === area);
      return [
        ...acc,
        { area, label: config?.label ?? area, pct: Math.round(((mul - 1.0) / 1.0) * 100) },
      ];
    }, []);
  }, [areaMultipliers]);

  const maxPct = entries.reduce((m, e) => Math.max(m, e.pct), 1);

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Focus Effectiveness</h4>
      <div className="space-y-2.5">
        {entries.map((e, i) => {
          const isHighest = e.pct === maxPct;
          const barColor = isHighest ? WEB3.orange : WEB3.lime;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8b949e]">{e.label}</span>
                <span className="text-[10px] font-semibold" style={{ color: barColor }}>
                  {e.pct}%
                </span>
              </div>
              <div className="h-2 bg-[#21262d] rounded overflow-hidden">
                <motion.div
                  className="h-full rounded"
                  style={{ backgroundColor: barColor, width: `${e.pct}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 3 — WeeklyTrainingLoadAreaChart
   8-point area chart of training load over 8 weeks
   ═══════════════════════════════════════════════════════════════ */

function WeeklyTrainingLoadAreaChart({
  currentWeek,
  fitness,
  form,
}: {
  currentWeek: number;
  fitness: number;
  form: number;
}) {
  const dataPoints = useMemo(() => {
    const startWeek = Math.max(1, currentWeek - 7);
    return Array.from({ length: 8 }, (_, i) => {
      const week = startWeek + i;
      const seed = (week * 17 + 3) % 100;
      const base = 30 + fitness * 0.4 + form * 2;
      const variance = (seed - 50) * 0.5;
      return { week, load: Math.max(10, Math.min(100, Math.round(base + variance))) };
    });
  }, [currentWeek, fitness, form]);

  const w = 200;
  const h = 80;
  const pad = { t: 8, r: 8, b: 20, l: 24 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const points = dataPoints.map((d, i) => ({
    x: pad.l + (i / 7) * plotW,
    y: pad.t + plotH - (d.load / 100) * plotH,
    load: d.load,
    week: d.week,
  }));

  const areaPath = points.reduce(
    (path, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      return `${path} L ${pt.x} ${pt.y}`;
    },
    '',
  );
  const closedPath = `${areaPath} L ${points[points.length - 1].x} ${pad.t + plotH} L ${points[0].x} ${pad.t + plotH} Z`;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Weekly Training Load</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = pad.t + plotH - (v / 100) * plotH;
          return (
            <line
              key={v}
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke={WEB3.border}
              strokeWidth="0.5"
            />
          );
        })}
        {/* Y-axis labels */}
        {[0, 50, 100].map(v => {
          const y = pad.t + plotH - (v / 100) * plotH;
          return (
            <text key={v} x={pad.l - 4} y={y + 3} textAnchor="end" fill={WEB3.textMuted} fontSize="6">
              {v}
            </text>
          );
        })}
        {/* Area fill */}
        <path d={closedPath} fill={WEB3.cyan} opacity={0.15} />
        {/* Area line */}
        <path d={areaPath} fill="none" stroke={WEB3.cyan} strokeWidth="1.5" opacity={0.9} />
        {/* Data dots */}
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill={WEB3.cyan} opacity={0.9} />
        ))}
        {/* X-axis labels */}
        {points.map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={h - 4}
            textAnchor="middle"
            fill={WEB3.textMuted}
            fontSize="5.5"
          >
            W{pt.week}
          </text>
        ))}
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 4 — AttributeGrowthRadar
   6-axis radar (PAC/SHO/PAS/DRI/DEF/PHY) showing projected growth
   ═══════════════════════════════════════════════════════════════ */

function AttributeGrowthRadar({
  attributes,
  projectedGains,
}: {
  attributes: PlayerAttributes;
  projectedGains: Record<SeasonTrainingFocusArea, Record<string, number>>;
}) {
  const cx = 80;
  const cy = 80;
  const maxR = 60;

  const currentValues = SIX_ATTRS.map(a => attributes[a] ?? 0);
  const projectedValues = SIX_ATTRS.map(attr => {
    const maxGain = (Object.values(projectedGains) as Record<string, number>[]).reduce(
      (best, gains) => {
        const g = gains[attr] ?? 0;
        return g > best ? g : best;
      },
      0,
    );
    return Math.min((attributes[attr] ?? 0) + maxGain, 99);
  });

  function polarToXY(index: number, value: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Growth Radar</h4>
      <svg viewBox="0 0 160 160" className="w-full max-w-[160px] mx-auto">
        {/* Grid hexagons */}
        {gridLevels.map((level, li) => {
          const pts = Array.from({ length: 6 }, (_, i) => {
            const p = polarToXY(i, level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={li} points={pts} fill="none" stroke={WEB3.border} strokeWidth="0.5" />;
        })}
        {/* Axis lines */}
        {SIX_ATTRS.map((_, i) => {
          const p = polarToXY(i, 100);
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={WEB3.border} strokeWidth="0.5" />
          );
        })}
        {/* Current values polygon */}
        <polygon
          points={currentValues.map((v, i) => {
            const p = polarToXY(i, v);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill={WEB3.lime}
          opacity={0.12}
          stroke={WEB3.lime}
          strokeWidth="1"
        />
        {/* Projected values polygon */}
        <polygon
          points={projectedValues.map((v, i) => {
            const p = polarToXY(i, v);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill={WEB3.lime}
          opacity={0.25}
          stroke={WEB3.lime}
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        {/* Current dots */}
        {currentValues.map((v, i) => {
          const p = polarToXY(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r="2" fill={WEB3.textPrimary} />;
        })}
        {/* Projected dots */}
        {projectedValues.map((v, i) => {
          const p = polarToXY(i, v);
          return <circle key={`p${i}`} cx={p.x} cy={p.y} r="2.5" fill={WEB3.lime} opacity={0.9} />;
        })}
        {/* Labels */}
        {SIX_LABELS.map((label, i) => {
          const p = polarToXY(i, 115);
          return (
            <text key={i} x={p.x} y={p.y + 3} textAnchor="middle" fill={WEB3.textSecondary} fontSize="7">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-center gap-4 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-white opacity-60" />
          <span className="text-[9px] text-[#8b949e]">Current</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: WEB3.lime }} />
          <span className="text-[9px] text-[#8b949e]">Projected</span>
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 5 — TrainingConsistencyRing
   Circular ring showing sessions completed / planned
   ═══════════════════════════════════════════════════════════════ */

function TrainingConsistencyRing({
  appearances,
  currentWeek,
}: {
  appearances: number;
  currentWeek: number;
}) {
  const cx = 60;
  const cy = 60;
  const r = 42;
  const strokeW = 7;

  const total = Math.max(currentWeek * 3, 1);
  const completed = Math.min(appearances * 2 + Math.floor(currentWeek * 0.8), total);
  const pct = completed / total;

  const circumference = 2 * Math.PI * r;
  const filledLength = pct * circumference;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Consistency</h4>
      <svg viewBox="0 0 120 120" className="w-full max-w-[120px] mx-auto">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={WEB3.bgRaised}
          strokeWidth={strokeW}
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={WEB3.orange}
          strokeWidth={strokeW}
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          strokeLinecap="butt"
          opacity={0.9}
        />
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={WEB3.textPrimary} fontSize="16" fontWeight="bold">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={WEB3.textMuted} fontSize="7">
          {completed}/{total}
        </text>
      </svg>
      <p className="text-[9px] text-[#8b949e] text-center mt-2">
        Sessions completed this season
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 6 — FatigueManagementGauge
   Semi-circular gauge (0-100) showing current fatigue level
   ═══════════════════════════════════════════════════════════════ */

function FatigueManagementGauge({ fitness }: { fitness: number }) {
  const fatigue = 100 - fitness;
  const cx = 80;
  const cy = 80;
  const r = 58;
  const strokeW = 10;

  function polarToXY(angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const startAngle = 180;
  const endAngle = 0;
  const totalArc = 180;

  const fatigueAngle = startAngle - (fatigue / 100) * totalArc;

  const startPt = polarToXY(startAngle);
  const endPt = polarToXY(endAngle);

  const bgArcPath = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 1 1 ${endPt.x} ${endPt.y}`;

  const midPt = polarToXY(fatigueAngle);
  const largeArc = fatigue > 50 ? 1 : 0;
  const fatigueArcPath = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 1 ${midPt.x} ${midPt.y}`;

  const gaugeColor = fatigue > 70 ? WEB3.orange : fatigue > 40 ? WEB3.lime : WEB3.cyan;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Fatigue Gauge</h4>
      <svg viewBox="0 0 160 100" className="w-full max-w-[160px] mx-auto">
        {/* Background arc */}
        <path d={bgArcPath} fill="none" stroke={WEB3.bgRaised} strokeWidth={strokeW} strokeLinecap="butt" />
        {/* Fatigue arc */}
        <path d={fatigueArcPath} fill="none" stroke={gaugeColor} strokeWidth={strokeW} strokeLinecap="butt" opacity={0.85} />
        {/* Center value */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={WEB3.textPrimary} fontSize="20" fontWeight="bold">
          {fatigue}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fill={gaugeColor} fontSize="8" fontWeight="600">
          {fatigue > 70 ? 'HIGH' : fatigue > 40 ? 'MODERATE' : 'LOW'}
        </text>
        {/* Scale labels */}
        <text x={startPt.x - 6} y={startPt.y + 14} textAnchor="middle" fill={WEB3.textMuted} fontSize="7">
          0
        </text>
        <text x={endPt.x + 6} y={endPt.y + 14} textAnchor="middle" fill={WEB3.textMuted} fontSize="7">
          100
        </text>
      </svg>
      <p className="text-[9px] text-[#8b949e] text-center mt-2">
        Fitness: {fitness}% — Manage workload to avoid injury
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 7 — DrillCompletionBars
   5 horizontal bars showing drill completion rates
   ═══════════════════════════════════════════════════════════════ */

function DrillCompletionBars({
  fitness,
  form,
  appearances,
}: {
  fitness: number;
  form: number;
  appearances: number;
}) {
  const drills = useMemo(() => {
    const base = [
      { name: 'Sprint Drills', seed: 11 },
      { name: 'Shooting Practice', seed: 23 },
      { name: 'Passing Circuits', seed: 37 },
      { name: 'Defensive Shape', seed: 49 },
      { name: 'Set Piece Routines', seed: 61 },
    ];
    return base.map(d => {
      const raw = (d.seed + fitness * 0.3 + form * 4 + appearances * 0.5) % 100;
      return { name: d.name, pct: Math.max(15, Math.min(98, Math.round(raw))) };
    });
  }, [fitness, form, appearances]);

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Drill Completion</h4>
      <div className="space-y-2.5">
        {drills.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#8b949e]">{d.name}</span>
              <span className="text-[10px] font-semibold" style={{ color: WEB3.cyan }}>
                {d.pct}%
              </span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded overflow-hidden">
              <motion.div
                className="h-full rounded"
                style={{ backgroundColor: WEB3.cyan, width: `${d.pct}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                transition={{ duration: 0.5, delay: 0.45 + i * 0.04 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 8 — SeasonProgressTimeline
   8-node horizontal timeline showing focus changes per month
   ═══════════════════════════════════════════════════════════════ */

function SeasonProgressTimeline({
  currentWeek,
  currentFocus,
}: {
  currentWeek: number;
  currentFocus: SeasonTrainingFocusArea | null;
}) {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const weekThresholds = [1, 5, 10, 14, 19, 24, 28, 33];

  const nodes = useMemo(() => {
    return months.reduce<{ label: string; weekStart: number; active: boolean; current: boolean }[]>((acc, m, i) => {
      const weekStart = weekThresholds[i] ?? 38;
      const active = currentWeek >= weekStart;
      const nextWeekStart = weekThresholds[i + 1] ?? 39;
      const current = currentWeek >= weekStart && currentWeek < nextWeekStart;
      return [...acc, { label: m, weekStart, active, current }];
    }, []);
  }, [currentWeek]);

  const activeIndex = nodes.reduce(
    (found, n, i) => (n.current ? i : found),
    Math.min(nodes.length - 1, Math.floor((currentWeek - 1) / 5)),
  );

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.45 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Season Timeline</h4>
      <svg viewBox="0 0 280 56" className="w-full">
        {/* Timeline line */}
        <line x1="20" y1="20" x2="260" y2="20" stroke={WEB3.border} strokeWidth="2" />
        {/* Active segment */}
        {activeIndex > 0 && (
          <line x1="20" y1="20" x2={20 + activeIndex * 34} y2="20" stroke={WEB3.orange} strokeWidth="2" />
        )}
        {/* Nodes */}
        {nodes.map((node, i) => {
          const x = 20 + i * 34;
          const isActive = node.active;
          const isCurrent = node.current;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={20}
                r={isCurrent ? 6 : isActive ? 4 : 3}
                fill={isCurrent ? WEB3.orange : isActive ? WEB3.orange : WEB3.border}
                opacity={isActive ? 0.9 : 0.4}
              />
              <text
                x={x}
                y={42}
                textAnchor="middle"
                fill={isCurrent ? WEB3.textPrimary : WEB3.textMuted}
                fontSize="6.5"
                fontWeight={isCurrent ? 'bold' : 'normal'}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      {currentFocus && (
        <p className="text-[9px] text-[#8b949e] text-center mt-1">
          Current focus: <span style={{ color: WEB3.orange }}>{currentFocus}</span> — Week {currentWeek}/38
        </p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 9 — FocusHistoryScatter
   8 scatter dots showing focus score vs performance over 8 sessions
   ═══════════════════════════════════════════════════════════════ */

function FocusHistoryScatter({
  form,
  averageRating,
}: {
  form: number;
  averageRating: number;
}) {
  const w = 200;
  const h = 100;
  const pad = { t: 10, r: 10, b: 18, l: 28 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const dots = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const seed = (i * 31 + 7) % 100;
      const focusScore = 30 + (seed * 0.6) + form * 1.5;
      const performance = 20 + (averageRating * 8) + ((seed * 0.3) - 15);
      return {
        x: pad.l + (Math.min(Math.max(focusScore, 0), 100) / 100) * plotW,
        y: pad.t + plotH - (Math.min(Math.max(performance, 0), 100) / 100) * plotH,
        isGood: performance > 50,
      };
    });
  }, [form, averageRating]);

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Focus vs Performance</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Grid */}
        {[0, 50, 100].map(v => {
          const y = pad.t + plotH - (v / 100) * plotH;
          const x = pad.l + (v / 100) * plotW;
          return (
            <g key={v}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke={WEB3.border} strokeWidth="0.4" />
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + plotH} stroke={WEB3.border} strokeWidth="0.4" />
            </g>
          );
        })}
        {/* Axis labels */}
        <text x={w / 2} y={h - 3} textAnchor="middle" fill={WEB3.textMuted} fontSize="6">Focus Score</text>
        <text x={6} y={pad.t + plotH / 2} textAnchor="middle" fill={WEB3.textMuted} fontSize="6"
          style={{ writingMode: 'vertical-rl' }}>Performance</text>
        {/* Scatter dots */}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r="3.5"
            fill={d.isGood ? WEB3.cyan : WEB3.orange}
            opacity={0.8}
          />
        ))}
      </svg>
      <div className="flex justify-center gap-4 mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: WEB3.cyan }} />
          <span className="text-[9px] text-[#8b949e]">Good</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: WEB3.orange }} />
          <span className="text-[9px] text-[#8b949e]">Below Avg</span>
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 10 — CoachRecommendationBars
   4 horizontal bars (Attack / Defense / Set Pieces / Fitness)
   ═══════════════════════════════════════════════════════════════ */

function CoachRecommendationBars({
  position,
  attributes,
}: {
  position: string;
  attributes: PlayerAttributes;
}) {
  const recs = useMemo(() => {
    const isForward = ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(position);
    const isDefender = ['CB', 'LB', 'RB', 'CDM'].includes(position);
    const isMidfielder = ['CM', 'LM', 'RM'].includes(position);

    const attackPriority = isForward ? 88 : isMidfielder ? 62 : isDefender ? 35 : 20;
    const defensePriority = isDefender ? 85 : isMidfielder ? 58 : isForward ? 30 : 15;
    const setPiecesPriority = (attributes.shooting ?? 50) > 70 ? 72 : (attributes.passing ?? 50) > 65 ? 65 : 40;
    const fitnessPriority = (attributes.physical ?? 50) < 60 ? 78 : (attributes.pace ?? 50) < 55 ? 70 : 45;

    return [
      { label: 'Attack', pct: attackPriority, color: WEB3.orange },
      { label: 'Defense', pct: defensePriority, color: WEB3.lime },
      { label: 'Set Pieces', pct: setPiecesPriority, color: WEB3.cyan },
      { label: 'Fitness', pct: fitnessPriority, color: WEB3.gray },
    ];
  }, [position, attributes]);

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.55 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Coach Recommendations</h4>
      <div className="space-y-3">
        {recs.map((r, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#c9d1d9] font-medium">{r.label}</span>
              <span className="text-[10px] font-bold" style={{ color: r.color }}>
                {r.pct}%
              </span>
            </div>
            <div className="h-2.5 bg-[#21262d] rounded overflow-hidden">
              <motion.div
                className="h-full rounded"
                style={{ backgroundColor: r.color, width: `${r.pct}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.06 }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#8b949e] mt-3">
        Based on your position ({position}) and current attribute levels
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG 11 — TrainingIntensityHeatmap
   6x4 grid (6 focus areas x 4 intensity levels)
   ═══════════════════════════════════════════════════════════════ */

function TrainingIntensityHeatmap({
  attributes,
  fitness,
  morale,
}: {
  attributes: PlayerAttributes;
  fitness: number;
  morale: number;
}) {
  const intensityLabels = ['Light', 'Medium', 'High', 'Max'];
  const areaLabels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  const grid = useMemo(() => {
    const attrValues = SIX_ATTRS.map(a => attributes[a] ?? 50);
    return attrValues.map((val, row) => {
      return intensityLabels.reduce<number[]>((acc, _, col) => {
        const intensityLevel = (col + 1) * 25;
        const suitability = Math.round(
          (val / 100) * 40 +
          (fitness / 100) * 25 +
          (morale / 100) * 15 +
          ((intensityLevel / 100) * (val > 60 ? 20 : -10)),
        );
        return [...acc, Math.max(0, Math.min(100, suitability))];
      }, []);
    });
  }, [attributes, fitness, morale]);

  function getCellColor(value: number): string {
    if (value >= 75) return WEB3.orange;
    if (value >= 50) return WEB3.lime;
    if (value >= 25) return WEB3.cyan;
    return WEB3.bgRaised;
  }

  const cellW = 36;
  const cellH = 22;
  const labelW = 30;
  const headerH = 16;
  const startX = labelW;
  const startY = headerH;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Intensity Heatmap</h4>
      <svg viewBox={`0 0 ${labelW + cellW * 4 + 10} ${headerH + cellH * 6 + 6}`} className="w-full">
        {/* Column headers */}
        {intensityLabels.map((label, col) => (
          <text
            key={col}
            x={startX + col * cellW + cellW / 2}
            y={headerH - 4}
            textAnchor="middle"
            fill={WEB3.textMuted}
            fontSize="6.5"
          >
            {label}
          </text>
        ))}
        {/* Rows */}
        {grid.map((row, ri) => (
          <g key={ri}>
            {/* Row label */}
            <text
              x={labelW - 4}
              y={startY + ri * cellH + cellH / 2 + 2.5}
              textAnchor="end"
              fill={WEB3.textSecondary}
              fontSize="7"
              fontWeight="600"
            >
              {areaLabels[ri]}
            </text>
            {/* Cells */}
            {row.map((val, ci) => (
              <g key={ci}>
                <rect
                  x={startX + ci * cellW + 1}
                  y={startY + ri * cellH + 1}
                  width={cellW - 2}
                  height={cellH - 2}
                  fill={getCellColor(val)}
                  opacity={0.75}
                />
                <text
                  x={startX + ci * cellW + cellW / 2}
                  y={startY + ri * cellH + cellH / 2 + 2.5}
                  textAnchor="middle"
                  fill={val >= 50 ? '#000' : WEB3.textMuted}
                  fontSize="6.5"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div className="flex justify-center gap-3 mt-2">
        {[
          { color: WEB3.bgRaised, label: 'Low' },
          { color: WEB3.cyan, label: 'Moderate' },
          { color: WEB3.lime, label: 'Good' },
          { color: WEB3.orange, label: 'Optimal' },
        ].map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] text-[#8b949e]">{item.label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function SeasonTrainingFocusModal({ open, onClose }: SeasonTrainingFocusModalProps) {
  const gameState = useGameStore(state => state.gameState);
  const setSeasonTrainingFocus = useGameStore(state => state.setSeasonTrainingFocus);

  const [selected, setSelected] = useState<SeasonTrainingFocusArea | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedFocus, setConfirmedFocus] = useState<{
    label: string;
    multiplier: number;
    attrs: string[];
    gains: Record<string, number>;
  } | null>(null);

  const [vizTab, setVizTab] = useState<'select' | 'analytics'>('select');

  const baseMultiplier = useMemo(() => {
    if (!gameState) return 1.5;
    return calculateFocusBonusMultiplier(gameState.player, gameState.player.seasonStats);
  }, [gameState]);

  const areaMultipliers = useMemo(() => {
    if (!gameState) return {} as Record<SeasonTrainingFocusArea, number>;
    const player = gameState.player;
    const result = {} as Record<SeasonTrainingFocusArea, number>;

    for (const area of Object.keys(FOCUS_AREA_ATTRIBUTES) as SeasonTrainingFocusArea[]) {
      const attrs = FOCUS_AREA_ATTRIBUTES[area];
      const avgAgeFactor = attrs.reduce((sum, attr) => {
        const cat = ATTR_CATEGORIES[attr] as 'physical' | 'technical' | 'mental';
        return sum + Math.max(getAgeMultiplier(player.age, cat), 0.2);
      }, 0) / attrs.length;

      const effective = baseMultiplier * (0.55 + (avgAgeFactor / 1.8) * 0.65);
      result[area] = Math.round(Math.max(1.3, Math.min(2.0, effective)) * 100) / 100;
    }

    return result;
  }, [gameState, baseMultiplier]);

  const projectedGains = useMemo(() => {
    if (!gameState) return {} as Record<SeasonTrainingFocusArea, Record<string, number>>;
    const player = gameState.player;
    const result = {} as Record<SeasonTrainingFocusArea, Record<string, number>>;

    for (const area of Object.keys(FOCUS_AREA_ATTRIBUTES) as SeasonTrainingFocusArea[]) {
      const gains: Record<string, number> = {};
      for (const attr of FOCUS_AREA_ATTRIBUTES[area]) {
        const cat = ATTR_CATEGORIES[attr] as 'physical' | 'technical' | 'mental';
        const ageMul = Math.max(getAgeMultiplier(player.age, cat), 0.2);
        const weeklyGain = FOCUS_GROWTH_BASE * baseMultiplier * ageMul;
        const seasonGain = weeklyGain * WEEKS_PER_SEASON;
        gains[attr] = Math.round(seasonGain);
      }
      result[area] = gains;
    }

    return result;
  }, [gameState, baseMultiplier]);

  const recommendedFocus = useMemo((): SeasonTrainingFocusArea | null => {
    if (!gameState) return null;
    return getRecommendedFocus(gameState.player.position);
  }, [gameState]);

  const focusHistory = useMemo(() => {
    if (!gameState) return null;
    const focus = gameState.seasonTrainingFocus;
    if (!focus || focus.setAtSeason >= gameState.currentSeason) return null;
    return {
      label: focus.area.charAt(0).toUpperCase() + focus.area.slice(1),
      multiplier: focus.bonusMultiplier,
    };
  }, [gameState]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelected(null);
        setShowConfirmation(false);
        setConfirmedFocus(null);
        setVizTab('select');
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    if (!showConfirmation) return;
    const timer = setTimeout(() => {
      setShowConfirmation(false);
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [showConfirmation, onClose]);

  const handleConfirm = () => {
    if (!selected || showConfirmation) return;

    setSeasonTrainingFocus(selected);

    const focusConfig = FOCUS_AREAS.find(f => f.area === selected);
    const gains = projectedGains[selected] ?? {};
    const attrs = FOCUS_AREA_ATTRIBUTES[selected];

    setConfirmedFocus({
      label: focusConfig?.label ?? selected,
      multiplier: areaMultipliers[selected] ?? baseMultiplier,
      attrs: attrs.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
      gains,
    });
    setShowConfirmation(true);
  };

  if (!gameState) return <></>;

  const { player } = gameState;
  const attributes = player.attributes;
  const clubName = gameState.currentClub.name;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70"
            onClick={showConfirmation ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-lg shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              onClick={showConfirmation ? undefined : onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#21262d] transition-all duration-150 z-10"
              style={{
                opacity: showConfirmation ? 0 : 1,
                pointerEvents: showConfirmation ? 'none' : 'auto',
              }}
            >
              <X className="h-4 w-4 text-[#8b949e]" />
            </button>

            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#c9d1d9]">
                    Set Your Season Training Focus
                  </h2>
                  <p className="text-sm text-[#8b949e] mt-1 leading-relaxed">
                    {clubName} — Focused attributes receive a{' '}
                    <span className="text-emerald-400 font-semibold">1.5x–2.0x</span>{' '}
                    growth bonus based on age, gametime, form, and potential.
                  </p>
                </div>
                {/* Tab switcher */}
                <div className="flex rounded-lg border border-[#30363d] overflow-hidden shrink-0">
                  <button
                    onClick={() => setVizTab('select')}
                    className={`px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      vizTab === 'select'
                        ? 'bg-[#FF5500] text-white'
                        : 'bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                  >
                    Select Focus
                  </button>
                  <button
                    onClick={() => setVizTab('analytics')}
                    className={`px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      vizTab === 'analytics'
                        ? 'bg-[#FF5500] text-white'
                        : 'bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                  >
                    Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ SELECT FOCUS TAB ═══ */}
            <AnimatePresence mode="wait">
              {vizTab === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Focus History Banner */}
                  <AnimatePresence>
                    {focusHistory && (
                      <motion.div
                        className="mx-5 mb-3 px-3.5 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center gap-2.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <History className="h-4 w-4 text-[#8b949e] shrink-0" />
                        <span className="text-xs text-[#8b949e]">
                          Last season:{' '}
                          <span className="text-[#c9d1d9] font-semibold">
                            {focusHistory.label} Focus
                          </span>
                          <span className="text-emerald-400 ml-1.5 font-medium">
                            ({focusHistory.multiplier.toFixed(2)}x bonus)
                          </span>
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Focus Area Cards */}
                  <div className="px-5 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {FOCUS_AREAS.map((focus, index) => {
                      const focusAttrs = FOCUS_AREA_ATTRIBUTES[focus.area];
                      const isSelected = selected === focus.area;
                      const isRecommended = recommendedFocus === focus.area;
                      const multiplier = areaMultipliers[focus.area] ?? baseMultiplier;
                      const gains = projectedGains[focus.area] ?? {};

                      return (
                        <motion.button
                          key={focus.area}
                          onClick={() => {
                            if (!showConfirmation) setSelected(focus.area);
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 relative ${
                            isSelected
                              ? 'bg-[#161b22] border-emerald-500/50 ring-1 ring-emerald-500/30'
                              : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${focus.accentBg} ${focus.accentText}`}
                            >
                              {focus.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-semibold text-[#c9d1d9]">
                                    {focus.label}
                                  </span>
                                  {isRecommended && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/12 text-amber-400 text-[10px] font-semibold rounded">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`px-2 py-0.5 text-xs font-bold rounded ${getMultiplierBadge(multiplier)}`}
                                  >
                                    {multiplier.toFixed(2)}x
                                  </span>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                      <Check className="h-4 w-4 text-emerald-400" />
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-[#8b949e] mt-0.5">{focus.description}</p>

                              <div className="mt-2 space-y-1.5">
                                {focusAttrs.map(attr => {
                                  const value = attributes[attr as keyof PlayerAttributes] ?? 0;
                                  const gain = gains[attr] ?? 0;
                                  const projected = Math.min(value + gain, 99);

                                  return (
                                    <div key={attr}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-[#8b949e] capitalize">
                                          {attr}
                                        </span>
                                        <span className="text-[10px]">
                                          <span className="text-[#8b949e]">{value}</span>
                                          <span className="text-[#484f58] mx-0.5">&rarr;</span>
                                          <span className="text-emerald-400 font-semibold">
                                            ~{projected}
                                          </span>
                                          {gain > 0 && (
                                            <span className="text-emerald-400/70 ml-0.5">
                                              (+{gain} est.)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="h-1 bg-[#21262d] rounded mt-0.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded ${BAR_COLORS[focus.accentColor]}`}
                                          style={{ width: `${Math.min(value ?? 0, 99)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Confirm Button */}
                  <div className="p-5 pt-3">
                    <Button
                      onClick={handleConfirm}
                      disabled={!selected || showConfirmation}
                      className={`w-full h-11 font-semibold rounded-lg transition-all duration-150 ${
                        selected && !showConfirmation
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                      }`}
                    >
                      {showConfirmation
                        ? 'Locking Focus\u2026'
                        : selected
                          ? `Confirm ${FOCUS_AREAS.find(f => f.area === selected)?.label} Focus`
                          : 'Select a Focus Area'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ═══ ANALYTICS TAB ═══ */}
              {vizTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-5 pb-5"
                >
                  {/* Row 1: Donut + Effectiveness + Radar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <TrainingFocusDistributionDonut attributes={attributes} />
                    <FocusEffectivenessBars areaMultipliers={areaMultipliers} />
                    <AttributeGrowthRadar attributes={attributes} projectedGains={projectedGains} />
                  </div>

                  {/* Row 2: Load Chart + Consistency + Fatigue Gauge */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <WeeklyTrainingLoadAreaChart
                      currentWeek={gameState.currentWeek}
                      fitness={player.fitness}
                      form={player.form}
                    />
                    <TrainingConsistencyRing
                      appearances={player.seasonStats.appearances}
                      currentWeek={gameState.currentWeek}
                    />
                    <FatigueManagementGauge fitness={player.fitness} />
                  </div>

                  {/* Row 3: Drill Bars + Timeline + Scatter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <DrillCompletionBars
                      fitness={player.fitness}
                      form={player.form}
                      appearances={player.seasonStats.appearances}
                    />
                    <SeasonProgressTimeline
                      currentWeek={gameState.currentWeek}
                      currentFocus={gameState.seasonTrainingFocus?.area ?? null}
                    />
                    <FocusHistoryScatter
                      form={player.form}
                      averageRating={player.seasonStats.averageRating}
                    />
                  </div>

                  {/* Row 4: Coach Recs + Heatmap */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CoachRecommendationBars
                      position={player.position}
                      attributes={attributes}
                    />
                    <TrainingIntensityHeatmap
                      attributes={attributes}
                      fitness={player.fitness}
                      morale={player.morale}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation Summary Overlay */}
            <AnimatePresence>
              {showConfirmation && confirmedFocus && (
                <motion.div
                  className="absolute inset-0 z-10 bg-[#0d1117]/95 rounded-lg flex flex-col items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-6 w-6 text-emerald-400" />
                    </div>

                    <h3 className="text-base font-bold text-[#c9d1d9]">
                      Training Focus Locked
                    </h3>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      {confirmedFocus.label}
                    </p>

                    <div className="mt-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded inline-block">
                      <span className="text-xs text-[#8b949e]">Bonus: </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {confirmedFocus.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-xs text-[#8b949e]">
                        {' '}on {confirmedFocus.attrs.join(' & ')}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-[#8b949e]">
                        Estimated season growth:{' '}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {formatGains(confirmedFocus.gains)}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
