'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { GameState, MatchResult, Trophy } from '@/lib/game/types';
import { motion } from 'framer-motion';
import {
  Trophy as TrophyIcon,
  Star,
  Crown,
  Shield,
  Target,
  Zap,
  Flame,
  TrendingUp,
  Calendar,
  Medal,
  Flag,
  Award,
  Globe,
  User,
  Footprints,
  Crosshair,
  Activity,
  Gem,
  Swords,
  ArrowUp,
  Eye,
  BarChart3,
  Timer,
  Hexagon,
  Radar,
  Users,
  GraduationCap,
  Mic,
  Briefcase,
  Handshake,
  Building2,
} from 'lucide-react';

/* ── Animation Constants ───────────────────────────────────── */
const D = 0.04;
const A = { duration: 0.18, ease: 'easeOut' as const };

/* ── Helpers ───────────────────────────────────────────────── */
function formatEur(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
}

function flag(nat: string): string {
  const m: Record<string, string> = {
    England: '\u{1D3ED}\u{200D}\u{1D3F7}\u{200D}\u{1D3EE}\u{200D}\u{1D3F9}', Spain: '\u{1F1EA}\u{1F1F8}', France: '\u{1F1EB}\u{1F1F7}', Germany: '\u{1F1E9}\u{1F1EA}',
    Italy: '\u{1F1EE}\u{1F1F9}', Brazil: '\u{1F1E7}\u{1F1F7}', Argentina: '\u{1F1E6}\u{1F1F7}', Portugal: '\u{1F1F5}\u{1F1F9}',
    Netherlands: '\u{1F1F3}\u{1F1F1}', Belgium: '\u{1F1E7}\u{1F1EA}', Croatia: '\u{1F1ED}\u{1F1F7}', Turkey: '\u{1F1F9}\u{1F1F7}',
  };
  return m[nat] ?? '\u{1F3F3}\u{FE0F}';
}

function attrColor(v: number): string {
  if (v >= 80) return '#22c55e';
  if (v >= 65) return '#3b82f6';
  if (v >= 40) return '#f59e0b';
  return '#ef4444';
}

function getArchetype(attrs: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number }): { name: string; desc: string } {
  const top = Object.entries(attrs).sort(([, a], [, b]) => b - a);
  const p1 = top[0][0];
  const p2 = top[1][0];
  const map: Record<string, string> = { pace: 'Speed', shooting: 'Finishing', passing: 'Vision', dribbling: 'Technique', defending: 'Steel', physical: 'Power' };
  const archetypes: Record<string, { name: string; desc: string }> = {
    'pace-dribbling': { name: 'Speed Merchant', desc: 'Lightning fast with the ball at feet' },
    'pace-shooting': { name: 'Counter Attacker', desc: 'Deadly on the break' },
    'shooting-physical': { name: 'Target Man', desc: 'Aerial threat and clinical finisher' },
    'shooting-dribbling': { name: 'Poacher', desc: 'Always in the right place' },
    'passing-dribbling': { name: 'Playmaker', desc: 'The creative heartbeat' },
    'passing-shooting': { name: 'Complete Forward', desc: 'Creates and scores' },
    'defending-physical': { name: 'Wall', desc: 'Impossible to get past' },
    'physical-pace': { name: 'Athlete', desc: 'Raw power and pace' },
    'dribbling-passing': { name: 'Magician', desc: 'Defenders beware' },
  };
  const key = `${p1}-${p2}`;
  const rev = `${p2}-${p1}`;
  return archetypes[key] || archetypes[rev] || { name: 'All-Rounder', desc: 'Balanced across all areas' };
}

/* ═══════════════════════════════════════════════════════════════
   SVG VISUALIZATION SUB-COMPONENTS (Web3 Gritty Futurism)
   ═══════════════════════════════════════════════════════════════ */

function CareerAgeProgressRing({ age, delay = 0 }: { age: number; delay?: number }) {
  const retirementAge = 35;
  const progress = Math.min(1, age / retirementAge);
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - progress * circ;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4" style={{ color: '#FF5500' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Career Age Progress</h3>
      </div>
      <div className="flex items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#21262d" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#FF5500"
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <text x="50" y="46" textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="900">{age}</text>
          <text x="50" y="60" textAnchor="middle" fill="#8b949e" fontSize="8">of {retirementAge}</text>
        </svg>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[9px] text-[#8b949e]">Years Remaining</p>
            <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">{Math.max(0, retirementAge - age)}</p>
          </div>
          <div>
            <p className="text-[9px] text-[#8b949e]">Career Phase</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: '#FF5500' }}>
              {age < 23 ? 'Rising' : age < 28 ? 'Prime' : age < 32 ? 'Veteran' : 'Twilight'}
            </p>
          </div>
          <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
            <div className="h-full rounded-sm" style={{ backgroundColor: '#FF5500', width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LegacyMetricDonut({
  goals, assists, trophies, records, appearances, delay = 0,
}: {
  goals: number; assists: number; trophies: number; records: number; appearances: number; delay?: number;
}) {
  const segments = [
    { label: 'Goals', value: goals, color: '#FF5500' },
    { label: 'Assists', value: assists, color: '#CCFF00' },
    { label: 'Trophies', value: trophies, color: '#00E5FF' },
    { label: 'Records', value: records, color: '#666666' },
    { label: 'Apps', value: Math.round(appearances / 10), color: '#FF5500' },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  const arcs = segments.reduce<{ acc: number; items: { label: string; value: number; color: string; startAngle: number; sweep: number }[] }>(
    (acc, seg) => {
      const sweep = (seg.value / total) * 360;
      const item = { ...seg, startAngle: acc.acc, sweep };
      return { acc: acc.acc + sweep, items: [...acc.items, item] };
    },
    { acc: -90, items: [] },
  );

  const polarToCart = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const cx = 50;
  const cy = 50;
  const outerR = 40;
  const innerR = 24;

  const pathData = arcs.items.map((arc) => {
    const startOuter = polarToCart(cx, cy, outerR, arc.startAngle);
    const endOuter = polarToCart(cx, cy, outerR, arc.startAngle + arc.sweep);
    const startInner = polarToCart(cx, cy, innerR, arc.startAngle + arc.sweep);
    const endInner = polarToCart(cx, cy, innerR, arc.startAngle);
    const large = arc.sweep > 180 ? 1 : 0;
    return `M ${startOuter.x} ${startOuter.y} A ${outerR} ${outerR} 0 ${large} 1 ${endOuter.x} ${endOuter.y} L ${startInner.x} ${startInner.y} A ${innerR} ${innerR} 0 ${large} 0 ${endInner.x} ${endInner.y} Z`;
  });

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="h-4 w-4" style={{ color: '#FF5500' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Legacy Metric Breakdown</h3>
      </div>
      <div className="flex items-center gap-4">
        <svg width="120" height="120" viewBox="0 0 100 100">
          {pathData.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill={arcs.items[i].color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ ...A, delay: delay + i * 0.04 }}
            />
          ))}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="#161b22" />
          <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="12" fontWeight="900">{total}</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fill="#8b949e" fontSize="6">TOTAL PTS</text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] text-[#8b949e]">{s.label}</span>
              </div>
              <span className="text-[9px] font-bold tabular-nums text-[#c9d1d9]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PieChart(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} />;
}

function SeasonPerformanceLine({
  data, delay = 0,
}: {
  data: number[]; delay?: number;
}) {
  const pad = { top: 15, right: 15, bottom: 25, left: 30 };
  const w = 320;
  const h = 120;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const count = data.length;

  const points = count > 0
    ? data.map((val, i) => {
        const x = pad.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
        const y = pad.top + plotH - (Math.min(10, Math.max(0, val)) / 10) * plotH;
        return `${x},${y}`;
      }).join(' ')
    : '';

  const gridVals = [2, 4, 6, 8, 10];

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" style={{ color: '#00E5FF' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Season Performance Rating</h3>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h * 2 }}>
        {gridVals.map((v) => {
          const gy = pad.top + plotH - (v / 10) * plotH;
          return (
            <g key={v}>
              <line x1={pad.left} y1={gy} x2={w - pad.right} y2={gy} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={pad.left - 5} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
            </g>
          );
        })}
        {points && (
          <motion.polyline
            points={points}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...A, delay: delay + 0.1 }}
          />
        )}
        {data.map((val, i) => {
          const x = pad.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
          const y = pad.top + plotH - (Math.min(10, Math.max(0, val)) / 10) * plotH;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#00E5FF" />
          );
        })}
        {data.map((val, i) => {
          const x = pad.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
          return (
            <text key={`lbl-${i}`} x={x} y={h - 5} textAnchor="middle" fill="#484f58" fontSize="6">
              S{i + 1}
            </text>
          );
        })}
      </svg>
    </motion.div>
  );
}

function ClubImpactRadar({
  metrics, delay = 0,
}: {
  metrics: { label: string; value: number }[]; delay?: number;
}) {
  const cx = 80;
  const cy = 80;
  const maxR = 60;
  const count = metrics.length;
  const angleStep = (2 * Math.PI) / count;

  const polarToXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  });

  const dataPoints = metrics.map((m, i) => {
    const angle = i * angleStep;
    const r = (m.value / 100) * maxR;
    return polarToXY(angle, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLevels = [25, 50, 75, 100];

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Radar className="h-4 w-4" style={{ color: '#CCFF00' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Club Impact Radar</h3>
      </div>
      <svg viewBox="0 0 160 160" className="w-full mx-auto" style={{ maxWidth: 200 }}>
        {gridLevels.map((level) => {
          const r = (level / 100) * maxR;
          const pts = Array.from({ length: count }, (_, i) => {
            const p = polarToXY(i * angleStep, r);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="#21262d" strokeWidth="0.5" />;
        })}
        {metrics.map((_, i) => {
          const p = polarToXY(i * angleStep, maxR);
          return <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth="0.5" />;
        })}
        <motion.polygon
          points={dataPath}
          fill="rgba(204,255,0,0.1)"
          stroke="#CCFF00"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...A, delay: delay + 0.1 }}
        />
        {dataPoints.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#CCFF00" />
        ))}
        {metrics.map((m, i) => {
          const labelPos = polarToXY(i * angleStep, maxR + 14);
          return (
            <text key={`label-${i}`} x={labelPos.x} y={labelPos.y} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
              {m.label}
            </text>
          );
        })}
      </svg>
      <div className="grid grid-cols-5 gap-1 mt-2">
        {metrics.map((m, i) => (
          <div key={i} className="text-center">
            <p className="text-[8px] text-[#8b949e]">{m.label}</p>
            <p className="text-[9px] font-bold tabular-nums" style={{ color: '#CCFF00' }}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FanConnectionGauge({ value, delay = 0 }: { value: number; delay?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 180;

  const polarToXY = (deg: number, r: number) => ({
    x: 80 + r * Math.cos((deg - 180) * Math.PI / 180),
    y: 90 + r * Math.sin((deg - 180) * Math.PI / 180),
  });

  const arcStart = polarToXY(0, 55);
  const arcEnd = polarToXY(angle, 55);
  const largeArc = angle > 90 ? 1 : 0;

  const arcPath = angle > 0.5
    ? `M ${arcStart.x} ${arcStart.y} A 55 55 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`
    : '';

  const labelMap: Record<string, string> = {
    low: 'Casual',
    mid: 'Popular',
    high: 'Fan Favourite',
    max: 'Club Icon',
  };
  const tier = clamped < 25 ? labelMap.low : clamped < 50 ? labelMap.mid : clamped < 75 ? labelMap.high : labelMap.max;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4" style={{ color: '#FF5500' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Fan Connection</h3>
      </div>
      <svg viewBox="0 0 160 110" className="w-full mx-auto" style={{ maxWidth: 220 }}>
        <line x1="25" y1="90" x2="135" y2="90" stroke="#21262d" strokeWidth="6" strokeLinecap="round" />
        {arcPath && (
          <motion.path
            d={arcPath}
            fill="none"
            stroke="#FF5500"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...A, delay: delay + 0.1 }}
          />
        )}
        <text x="80" y="85" textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="900">{clamped}</text>
        <text x="80" y="100" textAnchor="middle" fill="#8b949e" fontSize="7">{tier}</text>
        <text x="20" y="106" textAnchor="start" fill="#484f58" fontSize="6">0</text>
        <text x="140" y="106" textAnchor="end" fill="#484f58" fontSize="6">100</text>
      </svg>
    </motion.div>
  );
}

function InternationalRecordBars({
  caps, goals, assists, cleanSheets, delay = 0,
}: {
  caps: number; goals: number; assists: number; cleanSheets: number; delay?: number;
}) {
  const maxVal = Math.max(caps, goals, assists, cleanSheets, 1);
  const bars = [
    { label: 'Caps', value: caps, color: '#CCFF00' },
    { label: 'Goals', value: goals, color: '#CCFF00' },
    { label: 'Assists', value: assists, color: '#CCFF00' },
    { label: 'Clean Sheets', value: cleanSheets, color: '#CCFF00' },
  ];

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4" style={{ color: '#CCFF00' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">International Record</h3>
      </div>
      <div className="space-y-3">
        {bars.map((bar, i) => {
          const pct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#8b949e]">{bar.label}</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: bar.color }}>{bar.value}</span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: bar.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${Math.max(2, pct)}%` }}
                  transition={{ ...A, width: { duration: 0.4, ease: 'easeOut' as const }, delay: delay + i * 0.04 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function CareerHighlightTimeline({
  highlights, delay = 0,
}: {
  highlights: { season: number; label: string }[]; delay?: number;
}) {
  const count = highlights.length;
  const totalWidth = 300;
  const nodeSpacing = count > 1 ? totalWidth / (count - 1) : 0;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4" style={{ color: '#00E5FF' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Career Highlight Timeline</h3>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 340 80`} className="w-full" style={{ minWidth: 340 }}>
          {count > 1 && (
            <line
              x1={20}
              y1="25"
              x2={20 + totalWidth}
              y2="25"
              stroke="#21262d"
              strokeWidth="2"
            />
          )}
          {highlights.map((h, i) => {
            const x = count > 1 ? 20 + i * nodeSpacing : 170;
            return (
              <g key={i}>
                <motion.circle
                  cx={x} cy="25" r="6"
                  fill="#0d1117"
                  stroke="#00E5FF"
                  strokeWidth="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...A, delay: delay + i * 0.04 }}
                />
                <circle cx={x} cy="25" r="2" fill="#00E5FF" />
                <text x={x} y="42" textAnchor="middle" fill="#8b949e" fontSize="6" fontWeight="600">
                  S{h.season}
                </text>
                <text x={x} y="52" textAnchor="middle" fill="#c9d1d9" fontSize="5.5" fontWeight="700">
                  {h.label.length > 12 ? h.label.slice(0, 11) + '..' : h.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}

function HallOfFameReadinessRadar({
  metrics, delay = 0,
}: {
  metrics: { label: string; value: number }[]; delay?: number;
}) {
  const cx = 80;
  const cy = 80;
  const maxR = 60;
  const count = metrics.length;
  const angleStep = (2 * Math.PI) / count;

  const polarToXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  });

  const dataPoints = metrics.map((m, i) => {
    const angle = i * angleStep;
    const r = (m.value / 100) * maxR;
    return polarToXY(angle, r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLevels = [25, 50, 75, 100];

  const avgScore = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length)
    : 0;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hexagon className="h-4 w-4" style={{ color: '#FF5500' }} />
          <h3 className="text-xs font-bold text-[#c9d1d9]">Hall of Fame Readiness</h3>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: '#FF5500' }}>{avgScore}%</span>
      </div>
      <svg viewBox="0 0 160 160" className="w-full mx-auto" style={{ maxWidth: 200 }}>
        {gridLevels.map((level) => {
          const r = (level / 100) * maxR;
          const pts = Array.from({ length: count }, (_, i) => {
            const p = polarToXY(i * angleStep, r);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={pts} fill="none" stroke="#21262d" strokeWidth="0.5" />;
        })}
        {metrics.map((_, i) => {
          const p = polarToXY(i * angleStep, maxR);
          return <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth="0.5" />;
        })}
        <motion.polygon
          points={dataPath}
          fill="rgba(255,85,0,0.1)"
          stroke="#FF5500"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...A, delay: delay + 0.1 }}
        />
        {dataPoints.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#FF5500" />
        ))}
        {metrics.map((m, i) => {
          const labelPos = polarToXY(i * angleStep, maxR + 14);
          return (
            <text key={`label-${i}`} x={labelPos.x} y={labelPos.y} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
              {m.label}
            </text>
          );
        })}
      </svg>
      <div className="grid grid-cols-5 gap-1 mt-2">
        {metrics.map((m, i) => (
          <div key={i} className="text-center">
            <p className="text-[8px] text-[#8b949e]">{m.label}</p>
            <p className="text-[9px] font-bold tabular-nums" style={{ color: '#FF5500' }}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PostCareerPotentialBars({
  values, delay = 0,
}: {
  values: { label: string; value: number; color: string }[]; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="h-4 w-4" style={{ color: '#FF5500' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Post-Career Potential</h3>
      </div>
      <div className="space-y-3">
        {values.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#8b949e]">{item.label}</span>
              <span className="text-[9px] font-bold tabular-nums" style={{ color: item.color }}>{item.value}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm"
                style={{ backgroundColor: item.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, width: `${Math.max(2, item.value)}%` }}
                transition={{ ...A, width: { duration: 0.4, ease: 'easeOut' as const }, delay: delay + i * 0.04 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function LegacyTrendAreaChart({
  data, delay = 0,
}: {
  data: number[]; delay?: number;
}) {
  const pad = { top: 15, right: 15, bottom: 25, left: 35 };
  const w = 320;
  const h = 130;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const count = data.length;
  const maxVal = Math.max(...data, 1);

  const xyPoints = count > 0
    ? data.map((val, i) => {
        const x = pad.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
        const y = pad.top + plotH - (val / maxVal) * plotH;
        return { x, y };
      })
    : [];

  const linePoints = xyPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = count > 0
    ? `${pad.left},${pad.top + plotH} ${linePoints} ${pad.left + plotW},${pad.top + plotH}`
    : '';

  const gridVals = count > 0
    ? [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal]
    : [];

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4" style={{ color: '#CCFF00' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Legacy Score Trajectory</h3>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h * 2 }}>
        {gridVals.map((v, i) => {
          const gy = pad.top + plotH - (v / maxVal) * plotH;
          return (
            <g key={i}>
              <line x1={pad.left} y1={gy} x2={w - pad.right} y2={gy} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={pad.left - 5} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
            </g>
          );
        })}
        {areaPoints && (
          <motion.polygon
            points={areaPoints}
            fill="rgba(204,255,0,0.08)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...A, delay: delay + 0.05 }}
          />
        )}
        {linePoints && (
          <motion.polyline
            points={linePoints}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...A, delay: delay + 0.1 }}
          />
        )}
        {xyPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#CCFF00" />
        ))}
        {data.map((_, i) => {
          const x = pad.left + (count === 1 ? plotW / 2 : (i / (count - 1)) * plotW);
          return (
            <text key={`lbl-${i}`} x={x} y={h - 5} textAnchor="middle" fill="#484f58" fontSize="6">
              S{i + 1}
            </text>
          );
        })}
      </svg>
    </motion.div>
  );
}

function PeerComparisonButterfly({
  playerMetrics, legends, delay = 0,
}: {
  playerMetrics: number[];
  legends: { name: string; metrics: number[] }[];
  delay?: number;
}) {
  const labelNames = ['Goals', 'Assists', 'Trophies', 'Longevity', 'Records'];
  const count = labelNames.length;
  const maxVal = Math.max(...playerMetrics, ...legends.flatMap((l) => l.metrics), 1);
  const barH = 14;
  const barGap = 6;
  const labelW = 60;
  const scaleW = 100;
  const totalH = count * (barH + barGap) + 20;
  const midX = labelW + scaleW + 10;
  const legendW = scaleW;

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4" style={{ color: '#00E5FF' }} />
        <h3 className="text-xs font-bold text-[#c9d1d9]">Peer Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${midX + legendW + 40} ${totalH + 30}`} className="w-full" style={{ minWidth: 400 }}>
          {labelNames.map((name, i) => {
            const y = 10 + i * (barH + barGap);
            const playerW = (playerMetrics[i] / maxVal) * scaleW;

            const avgLegendVal = legends.length > 0
              ? legends.reduce((s, l) => s + l.metrics[i], 0) / legends.length
              : 0;
            const legendWVal = (avgLegendVal / maxVal) * legendW;

            return (
              <g key={i}>
                <text x={labelW - 5} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="7" fontWeight="600">
                  {name}
                </text>
                <rect x={labelW} y={y} width={scaleW} height={barH} fill="#21262d" rx="2" />
                <motion.rect
                  x={labelW + scaleW - playerW}
                  y={y}
                  width={playerW}
                  height={barH}
                  fill="#00E5FF"
                  rx="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ ...A, delay: delay + i * 0.04 }}
                />
                <text x={labelW + scaleW + 4} y={y + barH / 2 + 3} fill="#484f58" fontSize="6">|</text>
                <rect x={midX + 10} y={y} width={legendW} height={barH} fill="#21262d" rx="2" />
                <motion.rect
                  x={midX + 10}
                  y={y}
                  width={legendWVal}
                  height={barH}
                  fill="#484f58"
                  rx="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ ...A, delay: delay + 0.2 + i * 0.04 }}
                />
                <text x={labelW + scaleW - playerW - 3} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="7" fontWeight="700">
                  {playerMetrics[i]}
                </text>
              </g>
            );
          })}
          <text x={labelW + scaleW / 2} y={totalH + 12} textAnchor="middle" fill="#00E5FF" fontSize="7" fontWeight="700">
            YOU
          </text>
          <text x={midX + 10 + legendW / 2} y={totalH + 12} textAnchor="middle" fill="#484f58" fontSize="7" fontWeight="700">
            AVG LEGENDS
          </text>
        </svg>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {legends.slice(0, 5).map((l, i) => (
          <span key={i} className="text-[8px] px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] text-[#8b949e]" style={{ borderRadius: 4 }}>
            {l.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Legacy Sub-Components ────────────────────────────────── */
function StatBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const color = attrColor(value);
  return (
    <motion.div className="space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8b949e] font-medium">{label}</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${Math.max(2, value)}%` }}
          transition={{ ...A, width: { duration: 0.4, ease: 'easeOut' as const }, delay }}
        />
      </div>
    </motion.div>
  );
}

function TierBadge({ tier, score }: { tier: string; score: number }) {
  const cfg: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    'Local Hero': { color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', icon: <Shield className="h-4 w-4" /> },
    'Rising Star': { color: '#c0c0c0', bg: 'rgba(192,192,192,0.12)', icon: <Star className="h-4 w-4" /> },
    'Club Legend': { color: '#ffd700', bg: 'rgba(255,215,0,0.12)', icon: <Crown className="h-4 w-4" /> },
    'National Hero': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: <Flag className="h-4 w-4" /> },
    'Global Icon': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Globe className="h-4 w-4" /> },
  };
  const c = cfg[tier] || cfg['Local Hero'];
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: c.bg, borderColor: c.color + '40' }}>
      <span style={{ color: c.color }}>{c.icon}</span>
      <div>
        <p className="text-xs font-bold" style={{ color: c.color }}>{tier}</p>
        <p className="text-[9px] text-[#8b949e]">Legacy Score: {score}</p>
      </div>
    </div>
  );
}

function HighlightCard({ icon, title, detail, season, delay = 0 }: { icon: React.ReactNode; title: string; detail: string; season?: number; delay?: number }) {
  return (
    <motion.div
      className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg border border-[#30363d]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
        <span className="text-emerald-400">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#c9d1d9]">{title}</p>
        <p className="text-[10px] text-[#8b949e] truncate">{detail}</p>
        {season && <p className="text-[9px] text-[#484f58]">Season {season}</p>}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function CareerLegacyProfile() {
  const gameState = useGameStore((s) => s.gameState);

  const computed = useMemo(() => {
    if (!gameState) return null;
    const { player, currentSeason, seasons, recentResults, achievements, internationalCareer, currentClub } = gameState;

    /* ── Career Value ── */
    const totalSeasons = Math.max(1, player.careerStats.seasonsPlayed || currentSeason);
    const careerEarnings = player.contract.weeklyWage * 52 * totalSeasons;

    /* ── Best Match ── */
    const played = recentResults.filter((r) => r.playerRating > 0);
    const bestMatch = played.length > 0
      ? played.reduce((b, r) => r.playerRating > b.playerRating ? r : b)
      : null;

    /* ── Stats Averages ── */
    const ca = player.careerStats;
    const goalsPerGame = ca.totalAppearances > 0 ? (ca.totalGoals / ca.totalAppearances) : 0;
    const assistsPerGame = ca.totalAppearances > 0 ? (ca.totalAssists / ca.totalAppearances) : 0;
    const avgRating = played.length > 0 ? played.reduce((s, r) => s + r.playerRating, 0) / played.length : 0;

    /* ── Archetype ── */
    const archetype = getArchetype(player.attributes);

    /* ── Trophy Count ── */
    const trophyCount = player.careerStats.trophies?.length ?? 0;

    /* ── International ── */
    const caps = internationalCareer.caps;

    /* ── Legacy Score ── */
    const legacyScore = ca.totalGoals * 5 + ca.totalAssists * 3 + trophyCount * 100 + achievements.filter(a => a.unlocked).length * 25 + totalSeasons * 50 + caps * 20 + (bestMatch ? bestMatch.playerRating * 30 : 0);
    let tierName = 'Local Hero';
    let nextTierName: string | null = 'Rising Star';
    let nextTierMin = 500;
    if (legacyScore >= 3000) { tierName = 'Global Icon'; nextTierName = null; nextTierMin = 0; }
    else if (legacyScore >= 2000) { tierName = 'National Hero'; nextTierName = 'Global Icon'; nextTierMin = 3000; }
    else if (legacyScore >= 1000) { tierName = 'Club Legend'; nextTierName = 'National Hero'; nextTierMin = 2000; }
    else if (legacyScore >= 500) { tierName = 'Rising Star'; nextTierName = 'Club Legend'; nextTierMin = 1000; }

    const tiers = [
      { name: 'Local Hero', min: 0, max: 500 },
      { name: 'Rising Star', min: 500, max: 1000 },
      { name: 'Club Legend', min: 1000, max: 2000 },
      { name: 'National Hero', min: 2000, max: 3000 },
      { name: 'Global Icon', min: 3000, max: 5000 },
    ];

    /* ── Season Arc Data ── */
    const seasonArc = [
      ...seasons.map(s => ({
        season: s.number,
        club: currentClub.name,
        position: s.leaguePosition,
        goals: s.playerStats.goals,
        assists: s.playerStats.assists,
        avgRating: s.playerStats.averageRating,
        isCurrent: false,
      })),
      {
        season: currentSeason,
        club: currentClub.name,
        position: gameState.leagueTable.findIndex(e => e.clubId === currentClub.id) + 1,
        goals: player.seasonStats.goals,
        assists: player.seasonStats.assists,
        avgRating: player.seasonStats.averageRating,
        isCurrent: true,
      },
    ];

    /* ── Best Season ── */
    const bestSeasonGoals = seasonArc.reduce((b, s) => s.goals > b.goals ? s : b, seasonArc[0]);

    /* ── Career Highlights ── */
    const highlights: { icon: React.ReactNode; title: string; detail: string; season?: number }[] = [];

    const firstGoal = recentResults.find(r => r.playerGoals > 0);
    if (firstGoal) {
      highlights.push({ icon: <Target className="h-3.5 w-3.5" />, title: 'First Career Goal', detail: `${firstGoal.homeClub.name} ${firstGoal.homeScore}-${firstGoal.awayScore} ${firstGoal.awayClub.name}`, season: firstGoal.season });
    }

    if (bestMatch) {
      highlights.push({ icon: <Star className="h-3.5 w-3.5" />, title: 'Best Match Rating', detail: `Rated ${bestMatch.playerRating.toFixed(1)} vs ${bestMatch.awayClub.name}`, season: bestMatch.season });
    }

    const mostGoals = recentResults.reduce((b, r) => r.playerGoals > b.playerGoals ? r : b, recentResults[0]);
    if (mostGoals && mostGoals.playerGoals >= 2) {
      highlights.push({ icon: <Flame className="h-3.5 w-3.5" />, title: `${mostGoals.playerGoals} Goals in One Match`, detail: `vs ${mostGoals.awayClub.name}`, season: mostGoals.season });
    }

    const firstTrophy = player.careerStats.trophies?.[0];
    if (firstTrophy) {
      highlights.push({ icon: <TrophyIcon className="h-3.5 w-3.5" />, title: 'First Trophy', detail: `${firstTrophy.name}`, season: firstTrophy.season });
    }

    if (caps > 0) {
      highlights.push({ icon: <Flag className="h-3.5 w-3.5" />, title: 'International Debut', detail: `${caps} cap${caps !== 1 ? 's' : ''} for ${player.nationality}`, season: internationalCareer.lastCallUpSeason || undefined });
    }

    /* ── DNA Comparison ── */
    const archetypes = [
      { name: 'Poacher', weights: { shooting: 30, pace: 20, physical: 15, dribbling: 15, passing: 10, defending: 10 } },
      { name: 'Target Man', weights: { physical: 30, shooting: 25, heading: 15, pace: 10, passing: 10, defending: 10 } },
      { name: 'Winger', weights: { pace: 30, dribbling: 25, crossing: 15, shooting: 10, passing: 10, defending: 10 } },
      { name: 'Playmaker', weights: { passing: 30, vision: 20, dribbling: 15, shooting: 10, pace: 10, defending: 15 } },
      { name: 'Box-to-Box', weights: { stamina: 25, passing: 20, physical: 20, defending: 15, shooting: 10, pace: 10 } },
      { name: 'Sweeper Keeper', weights: { positioning: 25, reflexes: 25, passing: 15, diving: 15, handling: 10, pace: 10 } },
    ];

    let bestMatchArch = 'All-Rounder';
    let bestMatchPct = 0;
    for (const arch of archetypes) {
      const score = Object.entries(arch.weights).reduce((s, [k, w]) => {
        const attrVal = (player.attributes as unknown as Record<string, number>)[k] ?? 50;
        return s + (attrVal * w / 100);
      }, 0);
      const pct = Math.round(score);
      if (pct > bestMatchPct) { bestMatchPct = pct; bestMatchArch = arch.name; }
    }

    /* ── Rating Trend (SVG chart data) ── */
    const ratingData = played.slice(0, 20).reverse().map(r => r.playerRating);

    /* ── SVG Data Derivations ── */

    const seasonPerfData = seasonArc.map(s => s.avgRating > 0 ? s.avgRating : 5).slice(-8);
    while (seasonPerfData.length < 2) seasonPerfData.push(5);

    const clubImpactMetrics = [
      { label: 'Goals', value: Math.min(100, (ca.totalGoals / Math.max(1, totalSeasons)) * 8) },
      { label: 'Leader', value: Math.min(100, player.overall * 0.9 + player.attributes.physical * 0.1) },
      { label: 'Morale', value: Math.min(100, player.morale) },
      { label: 'Revenue', value: Math.min(100, (player.marketValue / 100_000_000) * 50 + totalSeasons * 5) },
      { label: 'Youth', value: Math.min(100, player.age < 25 ? 60 + (25 - player.age) * 3 : 30) },
    ].map(m => ({ ...m, value: Math.round(m.value) }));

    const fanConnection = Math.min(100, Math.round(
      (player.reputation * 0.4) + (avgRating > 0 ? avgRating * 5 : 0) + (trophyCount * 8) + (totalSeasons * 3)
    ));

    const hofMetrics = [
      { label: 'Stats', value: Math.min(100, Math.round((ca.totalGoals * 2 + ca.totalAssists) / Math.max(1, totalSeasons) * 3)) },
      { label: 'Trophies', value: Math.min(100, trophyCount * 15) },
      { label: 'Longev', value: Math.min(100, totalSeasons * 8) },
      { label: 'Impact', value: Math.min(100, Math.round(player.overall * 0.8 + player.reputation * 0.2)) },
      { label: 'Records', value: Math.min(100, Math.round(legacyScore / 50)) },
    ].map(m => ({ ...m, value: Math.round(m.value) }));

    const postCareerValues = [
      { label: 'Management', value: Math.min(100, Math.round(player.overall * 0.5 + player.attributes.passing * 0.2 + player.morale * 0.3)), color: '#FF5500' },
      { label: 'Punditry', value: Math.min(100, Math.round(player.overall * 0.3 + player.attributes.passing * 0.3 + player.reputation * 0.4)), color: '#CCFF00' },
      { label: 'Coaching', value: Math.min(100, Math.round(player.overall * 0.4 + player.attributes.physical * 0.3 + totalSeasons * 1.5)), color: '#00E5FF' },
      { label: 'Ambassador', value: Math.min(100, Math.round(player.reputation * 0.5 + caps * 5 + player.overall * 0.2)), color: '#666666' },
      { label: 'Ownership', value: Math.min(100, Math.round(careerEarnings / 5_000_000 + player.overall * 0.2)), color: '#FF5500' },
    ].map(m => ({ ...m, value: Math.round(m.value) }));

    const legacyTrendData = seasonArc.map((s, i) => {
      const seasonScore = s.goals * 5 + s.assists * 3 + 50 * (i + 1);
      return Math.round(seasonScore);
    });
    if (legacyTrendData.length < 2) {
      legacyTrendData.push(legacyTrendData[0] ?? 100, (legacyTrendData[0] ?? 100) + 120);
    }

    const careerTimelineHighlights = [
      { season: 1, label: 'Debut' },
      ...highlights.filter(h => h.season != null).slice(0, 3).map(h => ({
        season: h.season ?? 1,
        label: h.title.length > 14 ? h.title.slice(0, 13) + '..' : h.title,
      })),
      { season: currentSeason, label: 'Current' },
    ].reduce<{ items: { season: number; label: string }[]; seen: Set<number> }>((acc, h) => {
      if (!acc.seen.has(h.season) && acc.items.length < 8) {
        return { items: [...acc.items, h], seen: new Set([...acc.seen, h.season]) };
      }
      return acc;
    }, { items: [], seen: new Set<number>() }).items;

    const peerLegends = [
      { name: 'Messi', metrics: [73, 30, 35, 19, 90] },
      { name: 'Ronaldo', metrics: [70, 25, 30, 20, 88] },
      { name: 'Zidane', metrics: [50, 40, 25, 17, 85] },
      { name: 'Henry', metrics: [60, 35, 20, 16, 82] },
      { name: 'Iniesta', metrics: [35, 50, 28, 17, 80] },
    ];
    const playerPeerMetrics = [
      Math.min(70, Math.round(ca.totalGoals / Math.max(1, totalSeasons) * 3)),
      Math.min(50, Math.round(ca.totalAssists / Math.max(1, totalSeasons) * 4)),
      Math.min(35, trophyCount * 5),
      Math.min(20, totalSeasons),
      Math.min(90, Math.round(legacyScore / 60)),
    ];

    return {
      player, currentClub, currentSeason,
      careerEarnings, bestMatch, goalsPerGame, assistsPerGame, avgRating,
      archetype, trophyCount, caps, totalSeasons,
      legacyScore, tierName, nextTierName, nextTierMin, tiers,
      seasonArc, bestSeasonGoals, highlights,
      bestMatchArch, bestMatchPct, ratingData,
      traitCount: player.traits.length,
      topTraits: player.traits.slice(0, 3),
      seasonPerfData,
      clubImpactMetrics,
      fanConnection,
      hofMetrics,
      postCareerValues,
      legacyTrendData,
      careerTimelineHighlights,
      peerLegends,
      playerPeerMetrics,
    };
  }, [gameState]);

  if (!gameState || !computed) return <></>;

  const {
    player, currentClub, currentSeason,
    careerEarnings, bestMatch, goalsPerGame, assistsPerGame, avgRating,
    archetype, trophyCount, caps, totalSeasons,
    legacyScore, tierName, nextTierName, nextTierMin, tiers,
    seasonArc, bestSeasonGoals, highlights,
    bestMatchArch, bestMatchPct, ratingData,
    traitCount, topTraits,
    seasonPerfData,
    clubImpactMetrics,
    fanConnection,
    hofMetrics,
    postCareerValues,
    legacyTrendData,
    careerTimelineHighlights,
    peerLegends,
    playerPeerMetrics,
  } = computed;

  const ovr = player.overall;
  const ovrPct = Math.max(0, Math.min(100, ((ovr - 40) / 60) * 100));
  const ovrCirc = 2 * Math.PI * 34;
  const ovrDash = ovrCirc - (ovrPct / 100) * ovrCirc;

  const currentTierInfo = tiers.find(t => t.name === tierName);
  const tierProgress = currentTierInfo
    ? Math.min(100, ((legacyScore - currentTierInfo.min) / (currentTierInfo.max - currentTierInfo.min)) * 100)
    : 100;

  const chartW = 320;
  const chartH = 100;
  const chartPad = { top: 10, right: 10, bottom: 20, left: 30 };
  const plotW = chartW - chartPad.left - chartPad.right;
  const plotH = chartH - chartPad.top - chartPad.bottom;

  const points = ratingData.length > 1
    ? ratingData.map((r, i) => {
        const x = chartPad.left + (i / (ratingData.length - 1)) * plotW;
        const y = chartPad.top + plotH - ((Math.min(10, Math.max(4, r)) - 4) / 6) * plotH;
        return `${x},${y}`;
      }).join(' ')
    : '';

  const svgDelayBase = D * 16;

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-5">

        {/* ═══ 1. PLAYER IDENTITY CARD ═══ */}
        <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <div className="flex items-start gap-4">
            {/* OVR Badge */}
            <div className="relative shrink-0">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="34" fill="none" stroke="#21262d" strokeWidth="4" />
                <circle cx="38" cy="38" r="34" fill="none" stroke={attrColor(ovr)} strokeWidth="4"
                  strokeDasharray={ovrCirc} strokeDashoffset={ovrDash}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black tabular-nums" style={{ color: attrColor(ovr) }}>{ovr}</span>
                <span className="text-[8px] font-bold text-[#8b949e] -mt-0.5">OVR</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 text-white" style={{ backgroundColor: currentClub.primaryColor || '#30363d', borderRadius: 4 }}>
                  YOU
                </span>
                <h1 className="text-base font-bold text-[#c9d1d9] truncate">{player.name}</h1>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm">{flag(player.nationality)}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 text-white" style={{ backgroundColor: '#21262d', borderRadius: 4 }}>{player.position}</span>
                <span className="text-[10px] text-[#8b949e]">Age {player.age}</span>
                <span className="text-[10px] text-[#8b949e]">{currentClub.name}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ borderRadius: 4 }}>
                  <TrendingUp className="h-2.5 w-2.5" />
                  POT {player.potential}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] text-[#8b949e]" style={{ borderRadius: 4 }}>
                  {player.preferredFoot === 'left' ? 'L' : player.preferredFoot === 'right' ? 'R' : 'B'} Foot
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400" style={{ borderRadius: 4 }}>
                  {player.squadStatus.replace('_', ' ')}
                </span>
              </div>

              {caps > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400" style={{ borderRadius: 4 }}>
                  <Flag className="h-2.5 w-2.5" /> {caps} cap{caps !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ SVG #1: CAREER AGE PROGRESS RING ═══ */}
        <CareerAgeProgressRing age={player.age} delay={svgDelayBase} />

        {/* ═══ 2. CAREER SUMMARY DASHBOARD ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
            <Award className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Career Summary</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Gem className="h-4 w-4" />, value: formatEur(careerEarnings), label: 'Career Earnings', color: 'text-amber-400' },
              { icon: <TrophyIcon className="h-4 w-4" />, value: trophyCount, label: 'Trophies Won', color: 'text-emerald-400' },
              { icon: <Star className="h-4 w-4" />, value: bestMatch ? bestMatch.playerRating.toFixed(1) : '-', label: 'Best Rating', color: 'text-emerald-400' },
              { icon: <Flag className="h-4 w-4" />, value: caps, label: 'Int. Caps', color: 'text-violet-400' },
            ].map((item, i) => (
              <motion.div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D + i * D }}>
                <span className={item.color}>{item.icon}</span>
                <span className={`text-base font-bold tabular-nums ${item.color}`}>{item.value}</span>
                <span className="text-[10px] text-[#8b949e] text-center">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ SVG #2: LEGACY METRIC DONUT ═══ */}
        <LegacyMetricDonut
          goals={player.careerStats.totalGoals}
          assists={player.careerStats.totalAssists}
          trophies={trophyCount}
          records={gameState.achievements.filter(a => a.unlocked).length}
          appearances={player.careerStats.totalAppearances}
          delay={svgDelayBase + D}
        />

        {/* ═══ 3. PLAYING STYLE DNA ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
            <Zap className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Playing Style DNA</h2>
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
            {/* Archetype badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                  <Crosshair className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#c9d1d9]">{archetype.name}</p>
                  <p className="text-[9px] text-[#8b949e]">{archetype.desc}</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-[#21262d] border border-[#30363d] text-[#8b949e]" style={{ borderRadius: 4 }}>
                {traitCount} trait{traitCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Top Traits */}
            {topTraits.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {topTraits.map(t => (
                  <span key={t} className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium" style={{ borderRadius: 4 }}>
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Attribute Bars */}
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map((attr, i) => (
                <StatBar key={attr} label={attr.charAt(0).toUpperCase() + attr.slice(1)} value={player.attributes[attr]} delay={D * 4 + i * D} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ SVG #3: SEASON PERFORMANCE LINE ═══ */}
        <SeasonPerformanceLine data={seasonPerfData} delay={svgDelayBase + D * 2} />

        {/* ═══ 4. SEASON-BY-SEASON CAREER ARC ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Career Arc</h2>
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
            {seasonArc.map((s, i) => {
              const isBest = s.season === bestSeasonGoals.season && bestSeasonGoals.goals > 0;
              return (
                <motion.div key={s.season} className="relative flex items-start gap-3 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 + i * D }}>
                  {/* Timeline */}
                  <div className="absolute left-[11px] top-3 bottom-0 w-px bg-[#30363d]" />
                  <div className="relative z-10 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 bg-[#0d1117]"
                    style={{ borderColor: s.isCurrent ? '#22c55e' : isBest ? '#ffd700' : '#30363d' }}>
                    {s.isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {isBest && !s.isCurrent && <TrophyIcon className="h-2.5 w-2.5 text-amber-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#c9d1d9]">Season {s.season}</p>
                      {s.isCurrent && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold" style={{ borderRadius: 3 }}>CURRENT</span>
                      )}
                      {isBest && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold" style={{ borderRadius: 3 }}>BEST</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e]">{s.club} · Pos #{s.position || '-'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-emerald-400 font-bold">{s.goals}G</span>
                      <span className="text-[10px] text-cyan-400">{s.assists}A</span>
                      <span className="text-[10px] text-[#8b949e]">{s.avgRating > 0 ? s.avgRating.toFixed(1) : '-'} avg</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ═══ SVG #4: CLUB IMPACT RADAR ═══ */}
        <ClubImpactRadar metrics={clubImpactMetrics} delay={svgDelayBase + D * 3} />

        {/* ═══ 5. LEGACY SCORE ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 8 }}>
            <Crown className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Legacy Score</h2>
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 8 }}>
            {/* Score & Tier */}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#c9d1d9] tabular-nums">{Math.round(legacyScore).toLocaleString()}</span>
              <TierBadge tier={tierName} score={Math.round(legacyScore)} />
            </div>

            {/* Progress bar to next tier */}
            {nextTierName && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b949e]">{tierName}</span>
                  <span className="text-[10px] text-[#8b949e]">{nextTierName} ({nextTierMin.toLocaleString()})</span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full rounded-sm bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${tierProgress}%` }}
                    transition={{ ...A, width: { duration: 0.5, ease: 'easeOut' as const } }}
                  />
                </div>
                <p className="text-[9px] text-[#484f58] text-right mt-0.5">{(nextTierMin - legacyScore).toFixed(0)} points to next tier</p>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]">
              {[
                { label: 'Goals', value: player.careerStats.totalGoals * 5, icon: <Target className="h-3 w-3" />, color: 'text-emerald-400' },
                { label: 'Assists', value: player.careerStats.totalAssists * 3, icon: <Swords className="h-3 w-3" />, color: 'text-cyan-400' },
                { label: 'Trophies', value: trophyCount * 100, icon: <TrophyIcon className="h-3 w-3" />, color: 'text-amber-400' },
                { label: 'Achievements', value: gameState.achievements.filter(a => a.unlocked).length * 25, icon: <Medal className="h-3 w-3" />, color: 'text-violet-400' },
                { label: 'Longevity', value: totalSeasons * 50, icon: <Calendar className="h-3 w-3" />, color: 'text-sky-400' },
                { label: 'International', value: caps * 20, icon: <Flag className="h-3 w-3" />, color: 'text-blue-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-2 bg-[#21262d] rounded-lg">
                  <span className={item.color}>{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#8b949e]">{item.label}</p>
                    <p className={`text-xs font-bold tabular-nums ${item.color}`}>+{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ SVG #5: FAN CONNECTION GAUGE ═══ */}
        <FanConnectionGauge value={fanConnection} delay={svgDelayBase + D * 4} />

        {/* ═══ 6. CAREER HIGHLIGHTS ═══ */}
        {highlights.length > 0 && (
          <section>
            <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 10 }}>
              <Flame className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-[#c9d1d9]">Career Highlights</h2>
            </motion.div>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <HighlightCard key={h.title} icon={h.icon} title={h.title} detail={h.detail} season={h.season} delay={D * 10 + i * D} />
              ))}
            </div>
          </section>
        )}

        {/* ═══ SVG #6: INTERNATIONAL RECORD BARS ═══ */}
        {caps > 0 && (
          <InternationalRecordBars
            caps={caps}
            goals={gameState.internationalCareer.goals}
            assists={gameState.internationalCareer.assists}
            cleanSheets={player.careerStats.totalCleanSheets}
            delay={svgDelayBase + D * 5}
          />
        )}

        {/* ═══ 7. FOOTBALLER DNA COMPARISON ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 12 }}>
            <User className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Style Comparison</h2>
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 12 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                <span className="text-emerald-400"><Crosshair className="h-5 w-5" /></span>
              </div>
              <div>
                <p className="text-[10px] text-[#8b949e]">Your style is closest to:</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{bestMatchArch}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-xl font-black text-emerald-400 tabular-nums">{bestMatchPct}%</span>
                <p className="text-[9px] text-[#484f58]">match</p>
              </div>
            </div>

            {/* Match bar */}
            <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden mb-4">
              <motion.div className="h-full rounded-sm bg-emerald-500" initial={{ opacity: 0 }} animate={{ opacity: 1, width: `${bestMatchPct}%` }} transition={{ ...A, width: { duration: 0.5, ease: 'easeOut' as const } }} />
            </div>

            {/* Other archetypes */}
            <div className="space-y-1.5">
              {['Poacher', 'Target Man', 'Winger', 'Playmaker', 'Box-to-Box'].filter(a => a !== bestMatchArch).slice(0, 3).map((name, i) => (
                <div key={name} className="flex items-center justify-between py-1">
                  <span className="text-[10px] text-[#8b949e]">{name}</span>
                  <span className="text-[10px] text-[#484f58] tabular-nums">{Math.max(0, bestMatchPct - 10 - i * 8 + Math.round(Math.random() * 5))}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ SVG #7: CAREER HIGHLIGHT TIMELINE ═══ */}
        {careerTimelineHighlights.length > 1 && (
          <CareerHighlightTimeline highlights={careerTimelineHighlights} delay={svgDelayBase + D * 6} />
        )}

        {/* ═══ 8. RATING TREND CHART ═══ */}
        {ratingData.length > 1 && (
          <section>
            <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 14 }}>
              <Activity className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-[#c9d1d9]">Rating Trend</h2>
              <span className="text-[10px] text-[#8b949e] ml-auto">Avg {avgRating.toFixed(1)}</span>
            </motion.div>
            <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 14 }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: chartH * 2 }}>
                {/* Grid lines */}
                {[6, 7, 8].map(val => {
                  const y = chartPad.top + plotH - ((val - 4) / 6) * plotH;
                  return <g key={val}>
                    <line x1={chartPad.left} y1={y} x2={chartW - chartPad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
                    <text x={chartPad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{val}</text>
                  </g>;
                })}
                {/* Data line */}
                {points && <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />}
                {/* Data points */}
                {ratingData.map((r, i) => {
                  const x = ratingData.length > 1 ? chartPad.left + (i / (ratingData.length - 1)) * plotW : chartPad.left;
                  const y = chartPad.top + plotH - ((Math.min(10, Math.max(4, r)) - 4) / 6) * plotH;
                  const color = r >= 7.5 ? '#22c55e' : r >= 6 ? '#f59e0b' : '#ef4444';
                  return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
                })}
                {/* Axis labels */}
                {ratingData.length > 1 && <>
                  <text x={chartPad.left} y={chartH - 2} fill="#484f58" fontSize="6">1</text>
                  <text x={chartW - chartPad.right - 4} y={chartH - 2} fill="#484f58" fontSize="6" textAnchor="end">{ratingData.length}</text>
                </>}
              </svg>
            </motion.div>
          </section>
        )}

        {/* ═══ SVG #8: HALL OF FAME READINESS RADAR ═══ */}
        <HallOfFameReadinessRadar metrics={hofMetrics} delay={svgDelayBase + D * 7} />

        {/* ═══ 9. CAREER STATS DEEP DIVE ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 15 }}>
            <Footprints className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Career Deep Dive</h2>
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Goals/Game', value: goalsPerGame.toFixed(2), color: 'text-emerald-400' },
                { label: 'Assists/Game', value: assistsPerGame.toFixed(2), color: 'text-cyan-400' },
                { label: 'Avg Rating', value: avgRating.toFixed(1), color: avgRating >= 7 ? 'text-emerald-400' : avgRating >= 6 ? 'text-amber-400' : 'text-red-400' },
                { label: 'Total Goals', value: player.careerStats.totalGoals, color: 'text-emerald-400' },
                { label: 'Total Assists', value: player.careerStats.totalAssists, color: 'text-cyan-400' },
                { label: 'Appearances', value: player.careerStats.totalAppearances, color: 'text-sky-400' },
              ].map((item, i) => (
                <motion.div key={item.label} className="text-center p-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 15 + i * D }}>
                  <p className={`text-base font-bold tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="text-[9px] text-[#8b949e]">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ SVG #9: POST-CAREER POTENTIAL BARS ═══ */}
        <PostCareerPotentialBars values={postCareerValues} delay={svgDelayBase + D * 8} />

        {/* ═══ SVG #10: LEGACY TREND AREA CHART ═══ */}
        <LegacyTrendAreaChart data={legacyTrendData} delay={svgDelayBase + D * 9} />

        {/* ═══ SVG #11: PEER COMPARISON BUTTERFLY ═══ */}
        <PeerComparisonButterfly playerMetrics={playerPeerMetrics} legends={peerLegends} delay={svgDelayBase + D * 10} />

      </div>
    </div>
  );
}
