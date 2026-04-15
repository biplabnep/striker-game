'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Volume2, Users, Music, Star, BarChart3, Activity, Zap, Heart,
  Trophy, Shield, Sparkles, Clock, TrendingUp, Award, Target,
  ChevronRight, Gauge, Flame, Megaphone, Radio, Building2,
  UtensilsCrossed, Car, Globe,
} from 'lucide-react';

// ============================================================
// SVG Helper Functions
// ============================================================

function buildHexPoints(cx: number, cy: number, radius: number, sides: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildRadarDataPoints(cx: number, cy: number, maxRadius: number, sides: number, values: number[]): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const r = (values[i] / 100) * maxRadius;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildSemiArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
  const end = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function buildAreaPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const lineParts = points.map((p) => `${p.x},${p.y}`).join(' ');
  return `M ${lineParts} L ${points[points.length - 1].x},${baseY} L ${points[0].x},${baseY} Z`;
}

function buildDonutArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const outerStart = { x: cx + outerR * Math.cos(startAngle), y: cy + outerR * Math.sin(startAngle) };
  const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
  const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
  const innerEnd = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

// ============================================================
// Types & Constants
// ============================================================

interface DonutSegment { label: string; value: number; color: string; }
interface RadarItem { name: string; value: number; }
interface TimelineNode { label: string; intensity: number; }
interface MatchDataPoint { label: string; value: number; }
interface BarItem { name: string; value: number; }

const DONUT_COLORS = ['#FF5500', '#CCFF00', '#00E5FF', '#8b949e'];

const ATMOSPHERE_RADAR_DATA: RadarItem[] = [
  { name: 'Noise', value: 88 }, { name: 'Crowd Passion', value: 92 },
  { name: 'Chant Coord.', value: 78 }, { name: 'Visual Effects', value: 85 },
  { name: 'Energy', value: 90 },
];
const CROWD_NOISE_BARS: BarItem[] = [
  { name: 'Pre-match', value: 55 }, { name: 'Kick-off', value: 88 },
  { name: 'Goal Celebr.', value: 100 }, { name: 'Tension Peaks', value: 76 },
  { name: 'Half-time', value: 42 },
];
const ATMOSPHERE_RATING_VALUE = 84;
const CHANT_POPULARITY_RAW = [
  { name: 'Club Anthem', amount: 35 }, { name: 'Player Chants', amount: 28 },
  { name: 'Spontaneous', amount: 22 }, { name: 'Away Support', amount: 15 },
];
const CHANT_ORIGIN_TIMELINE: TimelineNode[] = [
  { label: '1960s', intensity: 45 }, { label: '1975', intensity: 62 },
  { label: '1985', intensity: 70 }, { label: '1992', intensity: 78 },
  { label: '1999', intensity: 85 }, { label: '2008', intensity: 80 },
  { label: '2016', intensity: 88 }, { label: '2024', intensity: 92 },
];
const CHANT_PARTICIPATION_MATCHES: MatchDataPoint[] = [
  { label: 'M1', value: 72 }, { label: 'M2', value: 68 }, { label: 'M3', value: 85 },
  { label: 'M4', value: 90 }, { label: 'M5', value: 78 }, { label: 'M6', value: 95 },
  { label: 'M7', value: 88 }, { label: 'M8', value: 82 },
];
const SOUND_SYSTEM_RADAR_DATA: RadarItem[] = [
  { name: 'PA System', value: 82 }, { name: 'Coverage', value: 75 },
  { name: 'Bass', value: 68 }, { name: 'Acoustics', value: 90 },
  { name: 'Reliability', value: 95 },
];
const FACILITY_UPGRADE_BARS: BarItem[] = [
  { name: 'Seating', value: 88 }, { name: 'Lighting', value: 72 },
  { name: 'Scoreboard', value: 95 }, { name: 'Sound Sys.', value: 65 },
  { name: 'Pyrotech.', value: 40 },
];
const FACILITY_INVESTMENT_VALUE = 73;
const FAN_SATISFACTION_MATCHES: MatchDataPoint[] = [
  { label: 'M1', value: 78 }, { label: 'M2', value: 72 }, { label: 'M3', value: 85 },
  { label: 'M4', value: 91 }, { label: 'M5', value: 88 }, { label: 'M6', value: 94 },
  { label: 'M7', value: 82 }, { label: 'M8', value: 86 },
];
const MATCHDAY_REVENUE_RAW = [
  { name: 'Tickets', amount: 45 }, { name: 'Merchandise', amount: 20 },
  { name: 'Food & Bev', amount: 25 }, { name: 'Parking', amount: 10 },
];
const EXPERIENCE_SCORE_VALUE = 79;
const ATMOSPHERE_HISTORY: MatchDataPoint[] = [
  { label: 'W1', value: 76 }, { label: 'W2', value: 81 }, { label: 'W3', value: 79 },
  { label: 'W4', value: 88 }, { label: 'W5', value: 92 }, { label: 'W6', value: 85 },
  { label: 'W7', value: 90 }, { label: 'W8', value: 84 },
];
const WEATHER_IMPACT_DATA = [
  { condition: 'Sunny', impact: 82, attendance: 96, color: '#CCFF00' },
  { condition: 'Cloudy', impact: 78, attendance: 94, color: '#00E5FF' },
  { condition: 'Rainy', impact: 88, attendance: 88, color: '#00E5FF' },
  { condition: 'Windy', impact: 65, attendance: 90, color: '#FF5500' },
  { condition: 'Snowy', impact: 94, attendance: 72, color: '#8b949e' },
];
const FAN_DEMOGRAPHICS_RAW = [
  { name: 'Home Season', amount: 62 }, { name: 'Away Season', amount: 14 },
  { name: 'Cup Matches', amount: 16 }, { name: 'Friendlies', amount: 8 },
];
const SEASONAL_ATMOSPHERE = [
  { season: '20/21', home: 78, away: 62 }, { season: '21/22', home: 82, away: 65 },
  { season: '22/23', home: 85, away: 68 }, { season: '23/24', home: 88, away: 72 },
  { season: '24/25', home: ATMOSPHERE_RATING_VALUE, away: 75 },
];

// ============================================================
// Shared: RadarChart (5-axis)
// ============================================================
function RadarChart({ values, strokeColor, fillColor }: { values: RadarItem[]; strokeColor: string; fillColor: string }): React.JSX.Element {
  const cx = 150; const cy = 115; const maxR = 80; const sides = 5;
  const clamped = values.slice(0, sides).map((v) => ({ ...v, value: Math.min(100, Math.max(0, v.value)) }));
  const gridPolygons = [0.25, 0.5, 0.75, 1.0].map((level) => buildHexPoints(cx, cy, maxR * level, sides));
  const dataPoints = buildRadarDataPoints(cx, cy, maxR, sides, clamped.map((v) => v.value));
  return (
    <svg viewBox="0 0 300 230" className="w-full">
      {gridPolygons.map((pts, i) => (<polygon key={`rg-${i}`} points={pts} fill="none" stroke="#30363d" strokeWidth={0.6} />))}
      {clamped.map((_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        return <line key={`ra-${i}`} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="#30363d" strokeWidth={0.5} />;
      })}
      <polygon points={dataPoints} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
      {clamped.map((v, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        const dx = cx + (v.value / 100) * maxR * Math.cos(angle);
        const dy = cy + (v.value / 100) * maxR * Math.sin(angle);
        const lx = cx + (maxR + 18) * Math.cos(angle);
        const ly = cy + (maxR + 18) * Math.sin(angle);
        return (
          <g key={`rl-${v.name}`}>
            <circle cx={dx} cy={dy} r={3} fill={strokeColor} />
            <text x={lx} y={ly} textAnchor="middle" fill="#8b949e" fontSize={8}>{v.name}</text>
            <text x={lx} y={ly + 11} textAnchor="middle" fill="#c9d1d9" fontSize={10} fontWeight={700}>{v.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Shared: HorizontalBarChart
// ============================================================
function HorizontalBarChart({ items, barColor }: { items: BarItem[]; barColor: string }): React.JSX.Element {
  const barH = 18; const gap = 10; const labelW = 105; const barMaxW = 145; const startY = 20;
  return (
    <svg viewBox="0 0 300 190" className="w-full">
      {items.slice(0, 5).map((item, i) => {
        const y = startY + i * (barH + gap);
        const clamped = Math.min(100, Math.max(0, item.value));
        const w = (clamped / 100) * barMaxW;
        return (
          <g key={`hbar-${item.name}-${i}`}>
            <text x={labelW - 5} y={y + barH / 2 + 4} textAnchor="end" fill="#8b949e" fontSize={9}>{item.name}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} fill="#21262d" rx={2} />
            <rect x={labelW} y={y} width={w} height={barH} fill={barColor} rx={2} />
            <text x={labelW + w + 6} y={y + barH / 2 + 4} fill="#c9d1d9" fontSize={9} fontWeight={600}>{clamped}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Shared: DonutChart via .reduce()
// ============================================================
function DonutChart({ rawData, centerLabel, centerValue }: { rawData: { name: string; amount: number }[]; centerLabel: string; centerValue: string }): React.JSX.Element {
  const cx = 150; const cy = 100; const outerR = 70; const innerR = 42; const gapAngle = 0.04;
  const segments: DonutSegment[] = rawData.reduce<DonutSegment[]>((acc, item) => {
    acc.push({ label: item.name, value: item.amount, color: DONUT_COLORS[acc.length % DONUT_COLORS.length] });
    return acc;
  }, []);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const arcs = segments.reduce<{ path: string; color: string; name: string; pct: number; labelX: number; labelY: number }[]>((acc, seg) => {
    const prevAngle = acc.length > 0
      ? Math.atan2(acc[acc.length - 1].labelY - cy, acc[acc.length - 1].labelX - cx) + gapAngle / 2
      : -Math.PI / 2;
    const span = (seg.value / total) * 2 * Math.PI - gapAngle;
    const endA = prevAngle + span;
    const midA = prevAngle + span / 2;
    acc.push({ path: buildDonutArc(cx, cy, outerR, innerR, prevAngle, endA), color: seg.color, name: seg.label, pct: Math.round((seg.value / total) * 100), labelX: cx + (outerR + 18) * Math.cos(midA), labelY: cy + (outerR + 18) * Math.sin(midA) });
    return acc;
  }, []);
  return (
    <svg viewBox="0 0 300 200" className="w-full">
      {arcs.map((arc, i) => (
        <g key={`darc-${i}`}>
          <path d={arc.path} fill={arc.color} />
          <text x={arc.labelX} y={arc.labelY} textAnchor="middle" fill="#c9d1d9" fontSize={9} fontWeight={600}>{arc.pct}%</text>
        </g>
      ))}
      <text x={cx} y={cy - 3} textAnchor="middle" fill="#c9d1d9" fontSize={12} fontWeight={700}>{centerValue}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize={8}>{centerLabel}</text>
      {arcs.map((arc, i) => (
        <g key={`dleg-${i}`}>
          <rect x={12} y={148 + i * 14} width={8} height={8} rx={1} fill={arc.color} />
          <text x={24} y={157 + i * 14} fill="#8b949e" fontSize={8}>{arc.name}</text>
        </g>
      ))}
      <text x={0} y={0} opacity={0}>{Math.round(circumference)}</text>
    </svg>
  );
}

// ============================================================
// Shared: SemiGauge (0-100)
// ============================================================
function SemiGauge({ value, strokeColor }: { value: number; strokeColor: string }): React.JSX.Element {
  const cx = 150; const cy = 140; const radius = 100;
  const clamped = Math.min(100, Math.max(0, value));
  const endAngle = Math.PI + (clamped / 100) * Math.PI;
  const bgArc = buildSemiArcPath(cx, cy, radius, Math.PI, Math.PI * 2);
  const fgArc = clamped > 0 ? buildSemiArcPath(cx, cy, radius, Math.PI, endAngle) : '';
  return (
    <svg viewBox="0 0 300 190" className="w-full">
      <path d={bgArc} fill="none" stroke="#30363d" strokeWidth={14} strokeLinecap="round" />
      {fgArc && <path d={fgArc} fill="none" stroke={strokeColor} strokeWidth={14} strokeLinecap="round" />}
      <text x={cx - 80} y={cy + 18} textAnchor="middle" fill="#8b949e" fontSize={9}>Low</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#8b949e" fontSize={9}>Mid</text>
      <text x={cx + 80} y={cy + 18} textAnchor="middle" fill="#8b949e" fontSize={9}>High</text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill={strokeColor} fontSize={22} fontWeight={800}>{clamped}</text>
      <text x={cx} y={cy + 56} textAnchor="middle" fill="#8b949e" fontSize={10}>/ 100</text>
    </svg>
  );
}

// ============================================================
// Shared: RingChart (full circle 0-100)
// ============================================================
function RingChart({ value, strokeColor, label }: { value: number; strokeColor: string; label: string }): React.JSX.Element {
  const cx = 150; const cy = 100; const r = 70; const sw = 10;
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * r;
  const filled = (clamped / 100) * circumference;
  const offset = circumference * 0.25;
  return (
    <svg viewBox="0 0 300 200" className="w-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#30363d" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeColor} strokeWidth={sw} strokeDasharray={`${filled} ${circumference - filled}`} strokeDashoffset={-offset} strokeLinecap="butt" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill={strokeColor} fontSize={28} fontWeight={800}>{clamped}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8b949e" fontSize={10}>/ 100</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#8b949e" fontSize={9}>{label}</text>
    </svg>
  );
}

// ============================================================
// Shared: HorizontalTimeline
// ============================================================
function HorizontalTimeline({ nodes, strokePrimary, strokeSecondary }: { nodes: TimelineNode[]; strokePrimary: string; strokeSecondary: string }): React.JSX.Element {
  const cy = 65; const left = 30; const right = 270; const totalW = right - left;
  const mapped = nodes.slice(0, 8).map((ev, i) => {
    const x = left + (i / Math.max(1, nodes.length - 1)) * totalW;
    const r = 4 + (Math.min(100, Math.max(0, ev.intensity)) / 100) * 8;
    const color = ev.intensity >= 80 ? strokePrimary : ev.intensity >= 50 ? strokeSecondary : '#666666';
    return { x, r, color, label: ev.label, intensity: ev.intensity };
  });
  return (
    <svg viewBox="0 0 300 130" className="w-full">
      <line x1={left} y1={cy} x2={right} y2={cy} stroke="#30363d" strokeWidth={2} />
      {mapped.map((n, i) => (
        <g key={`tl-${i}`}>
          <line x1={n.x} y1={cy - n.r} x2={n.x} y2={cy + n.r} stroke={n.color} strokeWidth={1} opacity={0.3} />
          <circle cx={n.x} cy={cy} r={n.r} fill={n.color} opacity={0.25} />
          <circle cx={n.x} cy={cy} r={4} fill={n.color} />
          <text x={n.x} y={cy - n.r - 8} textAnchor="middle" fill="#c9d1d9" fontSize={8} fontWeight={600}>{n.intensity}</text>
          <text x={n.x} y={cy + n.r + 16} textAnchor="middle" fill="#8b949e" fontSize={7}>{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Shared: LineChart with Area
// ============================================================
function LineChartWithArea({ data, strokeColor, areaOpacity, minV, maxV }: { data: MatchDataPoint[]; strokeColor: string; areaOpacity: number; minV: number; maxV: number }): React.JSX.Element {
  const left = 40; const right = 280; const top = 20; const bottom = 150;
  const w = right - left; const h = bottom - top; const range = maxV - minV;
  const pts = data.slice(0, 8).map((d, i) => ({
    x: left + (i / Math.max(1, data.length - 1)) * w,
    y: bottom - ((Math.min(maxV, Math.max(minV, d.value)) - minV) / range) * h,
  }));
  const linePath = buildLinePath(pts);
  const areaPath = buildAreaPath(pts, bottom);
  return (
    <svg viewBox="0 0 300 180" className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = bottom - frac * h;
        return (
          <g key={`lg-${i}`}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="4 3" />
            <text x={left - 5} y={y + 3} textAnchor="end" fill="#8b949e" fontSize={8}>{Math.round(minV + frac * range)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill={strokeColor} fillOpacity={areaOpacity} />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((pt, i) => (
        <g key={`lp-${i}`}>
          <circle cx={pt.x} cy={pt.y} r={3} fill={strokeColor} />
          <text x={pt.x} y={bottom + 14} textAnchor="middle" fill="#8b949e" fontSize={7}>{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Sub-component: VisualizationCard
// ============================================================
function VisualizationCard({ title, icon, children, delay = 0 }: { title: string; icon: React.JSX.Element; children: React.ReactNode; delay?: number }): React.JSX.Element {
  return (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.4 }}>{children}</motion.div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Sub-component: StatPill
// ============================================================
function StatPill({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.JSX.Element }): React.JSX.Element {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#8b949e] truncate">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: SectionHeader
// ============================================================
function SectionHeader({ icon, title, subtitle }: { icon: React.JSX.Element; title: string; subtitle: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
        <p className="text-[10px] text-[#8b949e]">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================
// SVG Wrapper Functions (12 SVGs across 4 tabs)
// ============================================================

function AtmosphereIntensityRadar(): React.JSX.Element {
  return <RadarChart values={ATMOSPHERE_RADAR_DATA} strokeColor="#FF5500" fillColor="#FF550020" />;
}
function CrowdNoiseLevelBars(): React.JSX.Element {
  return <HorizontalBarChart items={CROWD_NOISE_BARS} barColor="#00E5FF" />;
}
function AtmosphereRatingGauge(): React.JSX.Element {
  return <SemiGauge value={ATMOSPHERE_RATING_VALUE} strokeColor="#CCFF00" />;
}
function ChantPopularityDonut(): React.JSX.Element {
  return <DonutChart rawData={CHANT_POPULARITY_RAW} centerLabel="Total %" centerValue={String(CHANT_POPULARITY_RAW.reduce((s, d) => s + d.amount, 0))} />;
}
function ChantOriginTimelineViz(): React.JSX.Element {
  return <HorizontalTimeline nodes={CHANT_ORIGIN_TIMELINE} strokePrimary="#FF5500" strokeSecondary="#00E5FF" />;
}
function ChantParticipationLineViz(): React.JSX.Element {
  return <LineChartWithArea data={CHANT_PARTICIPATION_MATCHES} strokeColor="#CCFF00" areaOpacity={0.12} minV={0} maxV={100} />;
}
function SoundSystemQualityRadar(): React.JSX.Element {
  return <RadarChart values={SOUND_SYSTEM_RADAR_DATA} strokeColor="#00E5FF" fillColor="#00E5FF20" />;
}
function FacilityUpgradeBars(): React.JSX.Element {
  return <HorizontalBarChart items={FACILITY_UPGRADE_BARS} barColor="#FF5500" />;
}
function FacilityInvestmentRing(): React.JSX.Element {
  return <RingChart value={FACILITY_INVESTMENT_VALUE} strokeColor="#CCFF00" label="Investment" />;
}
function FanSatisfactionArea(): React.JSX.Element {
  return <LineChartWithArea data={FAN_SATISFACTION_MATCHES} strokeColor="#00E5FF" areaOpacity={0.2} minV={50} maxV={100} />;
}
function MatchdayRevenueDonut(): React.JSX.Element {
  return <DonutChart rawData={MATCHDAY_REVENUE_RAW} centerLabel="Revenue" centerValue={`€${MATCHDAY_REVENUE_RAW.reduce((s, d) => s + d.amount, 0)}M`} />;
}
function ExperienceScoreGauge(): React.JSX.Element {
  return <SemiGauge value={EXPERIENCE_SCORE_VALUE} strokeColor="#CCFF00" />;
}
function FanDemographicsDonut(): React.JSX.Element {
  return <DonutChart rawData={FAN_DEMOGRAPHICS_RAW} centerLabel="Total" centerValue={String(FAN_DEMOGRAPHICS_RAW.reduce((s, d) => s + d.amount, 0))} />;
}

// ============================================================
// Main Component: StadiumAtmosphereEnhanced
// ============================================================

export default function StadiumAtmosphereEnhanced() {
  const [activeTab, setActiveTab] = useState('atmosphere');
  const store = useGameStore();
  const clubName = store.gameState?.currentClub?.name ?? 'Unknown Club';

  const atmosphereStats = useMemo(() => [
    { label: 'Overall Rating', value: ATMOSPHERE_RATING_VALUE, color: '#FF5500', icon: <Activity className="h-4 w-4" style={{ color: '#FF5500' }} /> },
    { label: 'Peak Noise (dB)', value: 112, color: '#00E5FF', icon: <Volume2 className="h-4 w-4" style={{ color: '#00E5FF' }} /> },
    { label: 'Fan Engagement', value: 87, color: '#CCFF00', icon: <Users className="h-4 w-4" style={{ color: '#CCFF00' }} /> },
    { label: 'Chant Index', value: 91, color: '#FF5500', icon: <Megaphone className="h-4 w-4" style={{ color: '#FF5500' }} /> },
  ], []);

  const chantsStats = useMemo(() => [
    { label: 'Total Chants', value: 48, color: '#FF5500', icon: <Music className="h-4 w-4" style={{ color: '#FF5500' }} /> },
    { label: 'Avg. Popularity', value: 78, color: '#00E5FF', icon: <Radio className="h-4 w-4" style={{ color: '#00E5FF' }} /> },
    { label: 'Participation', value: 85, color: '#CCFF00', icon: <Users className="h-4 w-4" style={{ color: '#CCFF00' }} /> },
    { label: 'New This Season', value: 6, color: '#8b949e', icon: <Sparkles className="h-4 w-4" style={{ color: '#8b949e' }} /> },
  ], []);

  const facilitiesStats = useMemo(() => [
    { label: 'Sound Quality', value: 82, color: '#00E5FF', icon: <Volume2 className="h-4 w-4" style={{ color: '#00E5FF' }} /> },
    { label: 'Investment Level', value: FACILITY_INVESTMENT_VALUE, color: '#CCFF00', icon: <TrendingUp className="h-4 w-4" style={{ color: '#CCFF00' }} /> },
    { label: 'Last Upgrade', value: 3, color: '#FF5500', icon: <Clock className="h-4 w-4" style={{ color: '#FF5500' }} /> },
    { label: 'Pending Jobs', value: 2, color: '#8b949e', icon: <Gauge className="h-4 w-4" style={{ color: '#8b949e' }} /> },
  ], []);

  const experienceStats = useMemo(() => [
    { label: 'Experience Score', value: EXPERIENCE_SCORE_VALUE, color: '#CCFF00', icon: <Star className="h-4 w-4" style={{ color: '#CCFF00' }} /> },
    { label: 'Fan Satisfaction', value: 88, color: '#00E5FF', icon: <Heart className="h-4 w-4" style={{ color: '#00E5FF' }} /> },
    { label: 'Revenue Index', value: 74, color: '#FF5500', icon: <Trophy className="h-4 w-4" style={{ color: '#FF5500' }} /> },
    { label: 'Repeat Visitors', value: 92, color: '#CCFF00', icon: <Users className="h-4 w-4" style={{ color: '#CCFF00' }} /> },
  ], []);

  return (
    <div className="min-h-screen bg-black text-white p-4" style={{ fontFamily: "'Monaspace Neon', 'Space Grotesk', monospace" }}>
      <motion.header className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <Zap className="h-5 w-5 text-[#FF5500]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#c9d1d9] tracking-tight">Stadium Atmosphere</h1>
            <p className="text-xs text-[#8b949e]">Enhanced Analytics - {clubName}</p>
          </div>
        </div>
        <div className="h-px bg-[#30363d] mt-3" />
      </motion.header>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
        {atmosphereStats.map((stat) => (
          <StatPill key={stat.label} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0d1117] border border-[#30363d] w-full mb-4">
          <TabsTrigger value="atmosphere" className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-[#FF5500] text-[#8b949e] flex-1">
            <Activity className="h-3 w-3 mr-1" />Atmosphere
          </TabsTrigger>
          <TabsTrigger value="chants" className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-[#FF5500] text-[#8b949e] flex-1">
            <Music className="h-3 w-3 mr-1" />Chants
          </TabsTrigger>
          <TabsTrigger value="facilities" className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-[#FF5500] text-[#8b949e] flex-1">
            <Gauge className="h-3 w-3 mr-1" />Facilities
          </TabsTrigger>
          <TabsTrigger value="experience" className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-[#FF5500] text-[#8b949e] flex-1">
            <Star className="h-3 w-3 mr-1" />Matchday
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atmosphere">
          <AnimatePresence mode="wait">
            <motion.div key="atmosphere-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <SectionHeader icon={<Flame className="h-4 w-4 text-[#FF5500]" />} title="Atmosphere Analysis" subtitle="Real-time intensity metrics across match phases" />
              <div className="grid grid-cols-2 gap-3">
                {atmosphereStats.map((stat) => (<StatPill key={`atmo-${stat.label}`} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />))}
              </div>
              <VisualizationCard title="Atmosphere Intensity Radar" icon={<Zap className="h-3 w-3 text-[#FF5500]" />} delay={0.1}>
                <AtmosphereIntensityRadar />
              </VisualizationCard>
              <VisualizationCard title="Crowd Noise Levels" icon={<Volume2 className="h-3 w-3 text-[#00E5FF]" />} delay={0.2}>
                <CrowdNoiseLevelBars />
              </VisualizationCard>
              <VisualizationCard title="Atmosphere Rating" icon={<Award className="h-3 w-3 text-[#CCFF00]" />} delay={0.3}>
                <AtmosphereRatingGauge />
              </VisualizationCard>
              <VisualizationCard title="Atmosphere History" icon={<TrendingUp className="h-3 w-3 text-[#00E5FF]" />} delay={0.4}>
                <LineChartWithArea data={ATMOSPHERE_HISTORY} strokeColor="#00E5FF" areaOpacity={0.15} minV={60} maxV={100} />
              </VisualizationCard>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="chants">
          <AnimatePresence mode="wait">
            <motion.div key="chants-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <SectionHeader icon={<Music className="h-4 w-4 text-[#FF5500]" />} title="Chant Analysis" subtitle="Popularity, origins, and participation tracking" />
              <div className="grid grid-cols-2 gap-3">
                {chantsStats.map((stat) => (<StatPill key={`chant-${stat.label}`} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />))}
              </div>
              <VisualizationCard title="Chant Popularity" icon={<Megaphone className="h-3 w-3 text-[#FF5500]" />} delay={0.1}>
                <ChantPopularityDonut />
              </VisualizationCard>
              <VisualizationCard title="Chant Evolution Timeline" icon={<Clock className="h-3 w-3 text-[#00E5FF]" />} delay={0.2}>
                <ChantOriginTimelineViz />
              </VisualizationCard>
              <VisualizationCard title="Chant Participation Trend" icon={<Users className="h-3 w-3 text-[#CCFF00]" />} delay={0.3}>
                <ChantParticipationLineViz />
              </VisualizationCard>
              <VisualizationCard title="Fan Demographics" icon={<Globe className="h-3 w-3 text-[#00E5FF]" />} delay={0.4}>
                <FanDemographicsDonut />
              </VisualizationCard>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="facilities">
          <AnimatePresence mode="wait">
            <motion.div key="facilities-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <SectionHeader icon={<Building2 className="h-4 w-4 text-[#00E5FF]" />} title="Facilities and Infrastructure" subtitle="Sound systems, upgrades, and investment tracking" />
              <div className="grid grid-cols-2 gap-3">
                {facilitiesStats.map((stat) => (<StatPill key={`fac-${stat.label}`} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />))}
              </div>
              <VisualizationCard title="Sound System Quality" icon={<Volume2 className="h-3 w-3 text-[#00E5FF]" />} delay={0.1}>
                <SoundSystemQualityRadar />
              </VisualizationCard>
              <VisualizationCard title="Facility Upgrade Levels" icon={<Building2 className="h-3 w-3 text-[#FF5500]" />} delay={0.2}>
                <FacilityUpgradeBars />
              </VisualizationCard>
              <VisualizationCard title="Facility Investment" icon={<TrendingUp className="h-3 w-3 text-[#CCFF00]" />} delay={0.3}>
                <FacilityInvestmentRing />
              </VisualizationCard>
              <VisualizationCard title="Seasonal Comparison" icon={<BarChart3 className="h-3 w-3 text-[#8b949e]" />} delay={0.4}>
                <div className="space-y-3 px-2">
                  {SEASONAL_ATMOSPHERE.map((s) => {
                    const hc = s.home >= 85 ? '#CCFF00' : s.home >= 75 ? '#00E5FF' : '#FF5500';
                    const ac = s.away >= 70 ? '#CCFF00' : s.away >= 60 ? '#00E5FF' : '#FF5500';
                    return (
                      <div key={s.season} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#c9d1d9]">{s.season}</span>
                          <div className="flex gap-3">
                            <span className="text-[10px]" style={{ color: hc }}>Home: {s.home}</span>
                            <span className="text-[10px]" style={{ color: ac }}>Away: {s.away}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg" style={{ width: `${s.home}%`, backgroundColor: hc }} />
                          </div>
                          <div className="flex-1 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg" style={{ width: `${s.away}%`, backgroundColor: ac }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </VisualizationCard>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="experience">
          <AnimatePresence mode="wait">
            <motion.div key="experience-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <SectionHeader icon={<Star className="h-4 w-4 text-[#CCFF00]" />} title="Matchday Experience" subtitle="Fan satisfaction, revenue breakdown, and experience scores" />
              <div className="grid grid-cols-2 gap-3">
                {experienceStats.map((stat) => (<StatPill key={`exp-${stat.label}`} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />))}
              </div>
              <VisualizationCard title="Fan Satisfaction Trend (Last 8 Matches)" icon={<Heart className="h-3 w-3 text-[#00E5FF]" />} delay={0.1}>
                <FanSatisfactionArea />
                <div className="flex items-center justify-center gap-4 mt-2">
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#00E5FF]"><ChevronRight className="h-2 w-2 mr-0.5" />Avg: 85</Badge>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#CCFF00]"><TrendingUp className="h-2 w-2 mr-0.5" />+6.1%</Badge>
                </div>
              </VisualizationCard>
              <VisualizationCard title="Matchday Revenue Breakdown" icon={<Trophy className="h-3 w-3 text-[#FF5500]" />} delay={0.2}>
                <MatchdayRevenueDonut />
              </VisualizationCard>
              <VisualizationCard title="Overall Experience Score" icon={<Award className="h-3 w-3 text-[#CCFF00]" />} delay={0.3}>
                <ExperienceScoreGauge />
                <div className="flex items-center justify-center gap-4 mt-2">
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#CCFF00]">Top 12%</Badge>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">League Avg: 68</Badge>
                </div>
              </VisualizationCard>
              <VisualizationCard title="Weather Impact on Atmosphere" icon={<Shield className="h-3 w-3 text-[#00E5FF]" />} delay={0.4}>
                <div className="space-y-2.5 px-2">
                  {WEATHER_IMPACT_DATA.map((w) => (
                    <div key={w.condition} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#c9d1d9]">{w.condition}</span>
                        <span className="text-xs font-bold" style={{ color: w.color }}>{w.impact}%</span>
                      </div>
                      <div className="h-1 bg-[#21262d] rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg" style={{ width: `${w.impact}%`, backgroundColor: w.color }} />
                      </div>
                      <p className="text-[8px] text-[#8b949e] mt-1">Attendance: {w.attendance}%</p>
                    </div>
                  ))}
                </div>
              </VisualizationCard>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      <footer className="mt-8 pt-4 border-t border-[#30363d]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#8b949e]">Stadium Atmosphere Enhanced v2.0</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#FF5500]"><Activity className="h-2 w-2 mr-0.5" />Live</Badge>
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">Season {store.gameState?.currentSeason ?? 1}</Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
