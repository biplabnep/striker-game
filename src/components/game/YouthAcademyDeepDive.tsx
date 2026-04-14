'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Baby, GraduationCap, Star, BarChart3, TrendingUp,
  Zap, Target, Users, Award, Clock, Shield, Heart,
  ChevronRight, Dumbbell, BookOpen
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────

const ANIM_DURATION = 0.2;

const ACADEMY_RATING = 78;

const FACILITIES = [
  { id: 'fac-1', name: 'Training Pitches', level: 4, maxLevel: 5, icon: <Dumbbell className="h-4 w-4 text-emerald-400" />, status: 'Active' },
  { id: 'fac-2', name: 'Gymnasium', level: 3, maxLevel: 5, icon: <Heart className="h-4 w-4 text-red-400" />, status: 'Active' },
  { id: 'fac-3', name: 'Recovery Center', level: 3, maxLevel: 5, icon: <Shield className="h-4 w-4 text-blue-400" />, status: 'Upgrading' },
  { id: 'fac-4', name: 'Classrooms', level: 2, maxLevel: 5, icon: <BookOpen className="h-4 w-4 text-amber-400" />, status: 'Active' },
  { id: 'fac-5', name: 'Dormitories', level: 4, maxLevel: 5, icon: <Users className="h-4 w-4 text-purple-400" />, status: 'Active' },
  { id: 'fac-6', name: 'Scouting Hub', level: 2, maxLevel: 5, icon: <Target className="h-4 w-4 text-cyan-400" />, status: 'Needs Upgrade' },
];

const YOUTH_PLAYERS = [
  { id: 'yp-1', name: 'Marcus Silva', age: 17, position: 'CM', overall: 68, potential: 88, nationality: 'Brazil' },
  { id: 'yp-2', name: 'Liam Carter', age: 18, position: 'ST', overall: 72, potential: 85, nationality: 'England' },
  { id: 'yp-3', name: 'Kai Yamamoto', age: 16, position: 'LW', overall: 61, potential: 91, nationality: 'Japan' },
  { id: 'yp-4', name: 'Enzo Fernandez', age: 19, position: 'CB', overall: 74, potential: 82, nationality: 'Argentina' },
  { id: 'yp-5', name: 'Jasper Müller', age: 17, position: 'CAM', overall: 65, potential: 87, nationality: 'Germany' },
  { id: 'yp-6', name: 'Omar Diallo', age: 16, position: 'RB', overall: 58, potential: 84, nationality: 'Senegal' },
  { id: 'yp-7', name: 'Lucas Dubois', age: 18, position: 'CDM', overall: 70, potential: 80, nationality: 'France' },
  { id: 'yp-8', name: 'Aiden Park', age: 15, position: 'GK', overall: 55, potential: 86, nationality: 'South Korea' },
];

const SQUAD_RADAR_AXES = ['Technical', 'Physical', 'Mental', 'Tactical', 'Speed', 'Creativity'];
const SQUAD_RADAR_VALUES = [78, 72, 68, 65, 80, 74];

const TRAINING_PROGRAMS = [
  { id: 'tp-1', name: 'Individual Skills', focus: '1v1', duration: '60 min', intensity: 85, coach: 'Coach Rivera', enrolled: 6, effectiveness: 92 },
  { id: 'tp-2', name: 'Group Tactics', focus: 'Team Play', duration: '90 min', intensity: 70, coach: 'Coach Nielsen', enrolled: 8, effectiveness: 88 },
  { id: 'tp-3', name: 'Positional Play', focus: 'Position', duration: '75 min', intensity: 75, coach: 'Coach Tanaka', enrolled: 5, effectiveness: 85 },
  { id: 'tp-4', name: 'Set Pieces', focus: 'Corners/FK', duration: '45 min', intensity: 60, coach: 'Coach Brooks', enrolled: 4, effectiveness: 78 },
  { id: 'tp-5', name: 'Match Simulation', focus: '11v11', duration: '90 min', intensity: 90, coach: 'Coach Rivera', enrolled: 8, effectiveness: 95 },
];

const COACHING_STAFF = [
  { id: 'cs-1', name: 'Carlos Rivera', role: 'Head Youth Coach', specialty: 'Attacking', rating: 88, yearsExp: 12 },
  { id: 'cs-2', name: 'Erik Nielsen', role: 'Tactical Coach', specialty: 'Defensive', rating: 82, yearsExp: 8 },
  { id: 'cs-3', name: 'Hiroshi Tanaka', role: 'Technical Coach', specialty: 'Dribbling', rating: 79, yearsExp: 6 },
  { id: 'cs-4', name: 'David Brooks', role: 'Set Piece Coach', specialty: 'Set Pieces', rating: 75, yearsExp: 5 },
];

const WEEKLY_SCHEDULE = [
  { id: 'ws-1', day: 'Monday', sessions: ['Individual Skills', 'Gym Session'], hours: 3 },
  { id: 'ws-2', day: 'Tuesday', sessions: ['Group Tactics', 'Positional Play'], hours: 3.5 },
  { id: 'ws-3', day: 'Wednesday', sessions: ['Match Simulation', 'Recovery'], hours: 4 },
  { id: 'ws-4', day: 'Thursday', sessions: ['Set Pieces', 'Individual Skills'], hours: 2.5 },
  { id: 'ws-5', day: 'Friday', sessions: ['Match Preparation', 'Light Training'], hours: 2 },
];

const SKILL_TREND_WEEKS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
const TECHNICAL_TREND = [62, 64, 63, 67, 69, 72];
const PHYSICAL_TREND = [58, 59, 61, 60, 63, 65];
const MENTAL_TREND = [55, 56, 55, 58, 59, 61];

const DEV_PLAYERS = [
  { id: 'dp-1', name: 'Marcus Silva', position: 'CM', beforeOvr: 62, afterOvr: 68, growthRate: 6, monthsTrained: 8 },
  { id: 'dp-2', name: 'Liam Carter', position: 'ST', beforeOvr: 66, afterOvr: 72, growthRate: 6, monthsTrained: 10 },
  { id: 'dp-3', name: 'Kai Yamamoto', position: 'LW', beforeOvr: 55, afterOvr: 61, growthRate: 5.5, monthsTrained: 6 },
  { id: 'dp-4', name: 'Enzo Fernandez', position: 'CB', beforeOvr: 69, afterOvr: 74, growthRate: 5, monthsTrained: 12 },
  { id: 'dp-5', name: 'Jasper Müller', position: 'CAM', beforeOvr: 59, afterOvr: 65, growthRate: 5.5, monthsTrained: 7 },
  { id: 'dp-6', name: 'Omar Diallo', position: 'RB', beforeOvr: 52, afterOvr: 58, growthRate: 5, monthsTrained: 5 },
];

const ATTR_GROWTH = [
  { id: 'ag-1', label: 'PAC', before: 65, after: 73, color: '#f59e0b' },
  { id: 'ag-2', label: 'SHO', before: 58, after: 64, color: '#ef4444' },
  { id: 'ag-3', label: 'PAS', before: 60, after: 68, color: '#06b6d4' },
  { id: 'ag-4', label: 'DRI', before: 63, after: 70, color: '#22c55e' },
  { id: 'ag-5', label: 'DEF', before: 55, after: 61, color: '#3b82f6' },
  { id: 'ag-6', label: 'PHY', before: 60, after: 66, color: '#a855f7' },
];

const SCATTER_DATA = [
  { id: 'sd-1', age: 15, growth: 4.2 },
  { id: 'sd-2', age: 16, growth: 5.8 },
  { id: 'sd-3', age: 16, growth: 7.1 },
  { id: 'sd-4', age: 17, growth: 6.0 },
  { id: 'sd-5', age: 17, growth: 5.5 },
  { id: 'sd-6', age: 18, growth: 6.0 },
  { id: 'sd-7', age: 18, growth: 5.0 },
  { id: 'sd-8', age: 19, growth: 4.5 },
  { id: 'sd-9', age: 19, growth: 3.8 },
  { id: 'sd-10', age: 20, growth: 3.2 },
];

const SCOUTED_TARGETS = [
  { id: 'st-1', name: 'Pedro Santos', age: 15, position: 'ST', potential: 89, region: 'South America', club: 'Fluminense Youth', report: 'Exceptional pace and finishing', status: 'Watching' },
  { id: 'st-2', name: 'Hugo Larsson', age: 16, position: 'CM', potential: 86, region: 'Europe', club: 'IFK Goteborg', report: 'Outstanding vision and passing', status: 'Trial Offered' },
  { id: 'st-3', name: 'Amadou Keita', age: 14, position: 'CB', potential: 88, region: 'Africa', club: 'Dakar Academy', report: 'Strong aerial presence, reads play well', status: 'Identified' },
  { id: 'st-4', name: 'Ryu Watanabe', age: 16, position: 'LW', potential: 85, region: 'Asia', club: 'Tokyo FC Youth', report: 'Quick feet, excellent dribbler', status: 'Watching' },
  { id: 'st-5', name: 'Santiago Reyes', age: 15, position: 'CAM', potential: 87, region: 'South America', club: 'River Plate Youth', report: 'Creative playmaker, high football IQ', status: 'Trial Invited' },
  { id: 'st-6', name: 'Ethan James', age: 17, position: 'RB', potential: 83, region: 'North America', club: 'LA Galaxy Academy', report: 'Athletic, strong overlapping runs', status: 'Identified' },
];

const TRIAL_INVITATIONS = [
  { id: 'ti-1', player: 'Hugo Larsson', position: 'CM', from: 'IFK Goteborg', startDate: 'Jan 15', duration: '2 weeks', status: 'Accepted' },
  { id: 'ti-2', player: 'Santiago Reyes', position: 'CAM', from: 'River Plate Youth', startDate: 'Feb 1', duration: '1 week', status: 'Pending' },
  { id: 'ti-3', player: 'Amadou Keita', position: 'CB', from: 'Dakar Academy', startDate: 'Feb 10', duration: '3 weeks', status: 'Offer Sent' },
  { id: 'ti-4', player: 'Pedro Santos', position: 'ST', from: 'Fluminense Youth', startDate: 'Mar 1', duration: '2 weeks', status: 'Under Review' },
];

const RECRUITMENT_BUDGET = {
  total: 2500000,
  spent: 1450000,
  reserved: 400000,
  available: 650000,
};

const SCOUTING_COVERAGE = [
  { region: 'Europe', coverage: 85 },
  { region: 'S. America', coverage: 72 },
  { region: 'Africa', coverage: 45 },
  { region: 'Asia', coverage: 38 },
  { region: 'N. America', coverage: 55 },
];

const YOUTH_SPENDING = [
  { id: 'ys-1', season: '2020/21', amount: 1.2 },
  { id: 'ys-2', season: '2021/22', amount: 0.8 },
  { id: 'ys-3', season: '2022/23', amount: 1.5 },
  { id: 'ys-4', season: '2023/24', amount: 2.1 },
  { id: 'ys-5', season: '2024/25', amount: 1.45 },
];

const FUNNEL_STAGES = [
  { id: 'fn-1', label: 'Identified', count: 48, color: '#6b7280' },
  { id: 'fn-2', label: 'Watched', count: 24, color: '#3b82f6' },
  { id: 'fn-3', label: 'Trial', count: 12, color: '#f59e0b' },
  { id: 'fn-4', label: 'Offer', count: 6, color: '#a855f7' },
  { id: 'fn-5', label: 'Signed', count: 3, color: '#22c55e' },
];

const PROMOTION_PIPELINE = [
  { stage: 'Academy', count: 8, color: '#3b82f6' },
  { stage: 'U21', count: 3, color: '#f59e0b' },
  { stage: 'First Team', count: 1, color: '#22c55e' },
];

// ── Helpers ────────────────────────────────────────────────

function buildRadarPoints(cx: number, cy: number, r: number, values: number[]): string {
  const n = values.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return values
    .map((val, i) => {
      const angle = startAngle + i * angleStep;
      const normalized = val / 100;
      const x = cx + r * normalized * Math.cos(angle);
      const y = cy + r * normalized * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildRadarGridPoints(cx: number, cy: number, r: number, levels: number, sides: number): string[] {
  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2;
  return Array.from({ length: levels }, (_, li) => {
    const levelR = r * ((li + 1) / levels);
    return Array.from({ length: sides }, (_, si) => {
      const angle = startAngle + si * angleStep;
      const x = cx + levelR * Math.cos(angle);
      const y = cy + levelR * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });
}

function buildDonutArcPath(cx: number, cy: number, r: number, startPct: number, endPct: number): string {
  const startAngle = 2 * Math.PI * startPct - Math.PI / 2;
  const endAngle = 2 * Math.PI * endPct - Math.PI / 2;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = (endPct - startPct) > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

function buildGaugeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function buildAreaPoints(xValues: number[], yValues: number[], baseY: number): string {
  const linePoints = xValues.map((x, i) => `${x},${yValues[i]}`).join(' ');
  return `${xValues[0]},${baseY} ${linePoints} ${xValues[xValues.length - 1]},${baseY}`;
}

function buildPolylinePoints(xValues: number[], yValues: number[]): string {
  return xValues.map((x, i) => `${x},${yValues[i]}`).join(' ');
}

function getPositionColor(position: string): string {
  if (position === 'GK') return 'text-amber-400';
  if (['CB', 'LB', 'RB', 'CDM'].includes(position)) return 'text-blue-400';
  if (['CM', 'CAM'].includes(position)) return 'text-emerald-400';
  return 'text-red-400';
}

function getOverallColor(ovr: number): string {
  if (ovr >= 80) return 'text-emerald-400';
  if (ovr >= 70) return 'text-lime-400';
  if (ovr >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getPotentialLabel(pot: number): string {
  if (pot >= 90) return 'World Class';
  if (pot >= 82) return 'High';
  if (pot >= 75) return 'Medium';
  return 'Low';
}

function getPotentialBadgeColor(pot: number): string {
  if (pot >= 90) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  if (pot >= 82) return 'bg-lime-500/15 border-lime-500/30 text-lime-400';
  if (pot >= 75) return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  return 'bg-red-500/15 border-red-500/30 text-red-400';
}

function getScoutingStatusColor(status: string): string {
  if (status === 'Trial Offered' || status === 'Trial Invited') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  if (status === 'Watching') return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
  if (status === 'Offer Sent') return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
  return 'bg-slate-500/15 border-slate-500/30 text-[#8b949e]';
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
  return `£${amount}`;
}

// ── SVG Sub-Components ────────────────────────────────────

function youthSquadHexRadar(): React.JSX.Element {
  const cx = 100;
  const cy = 95;
  const r = 70;
  const sides = 6;
  const gridLevels = 4;
  const gridPoints = buildRadarGridPoints(cx, cy, r, gridLevels, sides);
  const dataPoints = buildRadarPoints(cx, cy, r, SQUAD_RADAR_VALUES);

  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2;
  const labelPositions = SQUAD_RADAR_AXES.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    return { label: SQUAD_RADAR_AXES[i], x: lx, y: ly };
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto block">
      {gridPoints.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth={0.5} opacity={0.2} />
      ))}
      {labelPositions.map((lp, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#30363d" strokeWidth={0.5} opacity={0.2} />
        );
      })}
      <polygon points={dataPoints} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={1.5} />
      {SQUAD_RADAR_VALUES.map((val, i) => {
        const angle = startAngle + i * angleStep;
        const normalized = val / 100;
        const dotX = cx + r * normalized * Math.cos(angle);
        const dotY = cy + r * normalized * Math.sin(angle);
        return <circle key={`dot-${i}`} cx={dotX} cy={dotY} r={3} fill="#10b981" />;
      })}
      {labelPositions.map((lp, i) => (
        <text key={`lbl-${i}`} x={lp.x} y={lp.y + 4} textAnchor="middle" fill="#8b949e" fontSize={10} fontWeight={600}>
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

function potentialDistributionDonut(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;

  const segments = YOUTH_PLAYERS.reduce((acc, player) => {
    const label = getPotentialLabel(player.potential);
    const found = acc.find(s => s.label === label);
    if (found) {
      found.count += 1;
    } else {
      acc.push({ label, count: 1, color: player.potential >= 90 ? '#22c55e' : player.potential >= 82 ? '#84cc16' : player.potential >= 75 ? '#f59e0b' : '#ef4444' });
    }
    return acc;
  }, [] as { label: string; count: number; color: string }[]);

  const total = YOUTH_PLAYERS.length;
  const sortedSegments = segments.sort((a, b) => b.count - a.count);

  const arcPaths = sortedSegments.reduce((acc, seg, idx) => {
    const prevEnd = idx === 0 ? 0 : acc[idx - 1].endPct;
    const startPct = prevEnd;
    const endPct = startPct + seg.count / total;
    acc.push({ seg, startPct, endPct, path: buildDonutArcPath(cx, cy, r, startPct, endPct) });
    return acc;
  }, [] as { seg: typeof sortedSegments[number]; startPct: number; endPct: number; path: string }[]);

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto block">
      {arcPaths.map((arc) => (
        <path key={arc.seg.label} d={arc.path} fill={arc.seg.color} opacity={0.8} />
      ))}
      <circle cx={cx} cy={cy} r={35} fill="#161b22" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={18} fontWeight={700}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={10}>
        Players
      </text>
      {arcPaths.map((arc, i) => {
        const midPct = (arc.startPct + arc.endPct) / 2;
        const midAngle = 2 * Math.PI * midPct - Math.PI / 2;
        const labelR = r + 22;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        return (
          <text key={`donut-lbl-${i}`} x={lx} y={ly + 3} textAnchor="middle" fill="#8b949e" fontSize={9} fontWeight={600}>
            {arc.seg.label} ({arc.seg.count})
          </text>
        );
      })}
    </svg>
  );
}

function ageGroupBars(): React.JSX.Element {
  const ageGroups = [
    { label: 'U15', count: 2 },
    { label: 'U17', count: 3 },
    { label: 'U19', count: 2 },
    { label: 'U21', count: 1 },
    { label: 'U23', count: 0 },
  ];
  const maxCount = Math.max(...ageGroups.map(a => a.count), 1);
  const barWidth = 32;
  const gap = 16;
  const chartHeight = 100;
  const totalWidth = ageGroups.length * barWidth + (ageGroups.length - 1) * gap;

  return (
    <svg width={Math.max(totalWidth, 200)} height="150" viewBox={`0 0 ${Math.max(totalWidth, 200)} 150`} className="mx-auto block">
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = 20 + chartHeight * (1 - pct);
        return (
          <line key={`grid-${pct}`} x1={0} y1={y} x2={Math.max(totalWidth, 200)} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.2} />
        );
      })}
      {ageGroups.map((group, i) => {
        const x = i * (barWidth + gap);
        const barH = Math.max(2, (group.count / maxCount) * chartHeight);
        const y = 20 + chartHeight - barH;
        return (
          <g key={group.label}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill="#10b981" opacity={0.8} />
            <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill="#c9d1d9" fontSize={12} fontWeight={700}>
              {group.count}
            </text>
            <text x={x + barWidth / 2} y={135} textAnchor="middle" fill="#8b949e" fontSize={12} fontWeight={600}>
              {group.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function trainingIntensityGauge(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const intensity = 76;

  const bgArc = buildGaugeArc(cx, cy, r, 180, 0);
  const valueAngle = 180 - (intensity / 100) * 180;
  const valueArc = buildGaugeArc(cx, cy, r, 180, valueAngle);

  const needleAngleRad = ((180 - intensity * 1.8) * Math.PI) / 180;
  const needleX = cx + (r - 15) * Math.cos(needleAngleRad);
  const needleY = cy + (r - 15) * Math.sin(needleAngleRad);

  const gaugeColor = intensity >= 80 ? '#ef4444' : intensity >= 60 ? '#f59e0b' : '#22c55e';

  return (
    <svg width="200" height="120" viewBox="0 0 200 120" className="mx-auto block">
      <path d={bgArc} fill="none" stroke="#30363d" strokeWidth={12} strokeLinecap="round" />
      <path d={valueArc} fill="none" stroke={gaugeColor} strokeWidth={12} strokeLinecap="round" opacity={0.8} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#c9d1d9" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#c9d1d9" />
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#c9d1d9" fontSize={20} fontWeight={700}>
        {intensity}%
      </text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill="#8b949e" fontSize={12}>
        Avg Intensity
      </text>
      <text x={20} y={cy + 15} textAnchor="middle" fill="#8b949e" fontSize={10}>0</text>
      <text x={180} y={cy + 15} textAnchor="middle" fill="#8b949e" fontSize={10}>100</text>
    </svg>
  );
}

function skillDevelopmentTrend(): React.JSX.Element {
  const chartW = 320;
  const chartH = 160;
  const padL = 36;
  const padR = 10;
  const padT = 10;
  const padB = 24;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const allVals = [...TECHNICAL_TREND, ...PHYSICAL_TREND, ...MENTAL_TREND];
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const valRange = maxVal - minVal || 1;

  const xPositions = SKILL_TREND_WEEKS.map((_, i) => padL + (i / (SKILL_TREND_WEEKS.length - 1)) * plotW);
  const techYPositions = TECHNICAL_TREND.map(v => padT + plotH * (1 - (v - minVal) / valRange));
  const physYPositions = PHYSICAL_TREND.map(v => padT + plotH * (1 - (v - minVal) / valRange));
  const mentYPositions = MENTAL_TREND.map(v => padT + plotH * (1 - (v - minVal) / valRange));

  const techArea = buildAreaPoints(xPositions, techYPositions, padT + plotH);
  const physArea = buildAreaPoints(xPositions, physYPositions, padT + plotH);
  const mentArea = buildAreaPoints(xPositions, mentYPositions, padT + plotH);

  const techLine = buildPolylinePoints(xPositions, techYPositions);
  const physLine = buildPolylinePoints(xPositions, physYPositions);
  const mentLine = buildPolylinePoints(xPositions, mentYPositions);

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="block">
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={`grid-${pct}`} x1={padL} y1={padT + plotH * (1 - pct)} x2={chartW - padR} y2={padT + plotH * (1 - pct)} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.2} />
      ))}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <text key={`xlbl-${i}`} x={xPositions[i]} y={chartH - 4} textAnchor="middle" fill="#8b949e" fontSize={10}>{SKILL_TREND_WEEKS[i]}</text>
      ))}
      {[0, 0.5, 1].map(pct => {
        const val = minVal + pct * valRange;
        return (
          <text key={`ylbl-${pct}`} x={padL - 4} y={padT + plotH * (1 - pct) + 4} textAnchor="end" fill="#8b949e" fontSize={10}>{Math.round(val)}</text>
        );
      })}
      <polygon points={techArea} fill="rgba(16,185,129,0.08)" />
      <polygon points={physArea} fill="rgba(59,130,246,0.08)" />
      <polygon points={mentArea} fill="rgba(168,85,247,0.08)" />
      <polyline points={techLine} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={physLine} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={mentLine} fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {xPositions.map((x, i) => (
        <g key={`dots-${i}`}>
          <circle cx={x} cy={techYPositions[i]} r={3} fill="#10b981" />
          <circle cx={x} cy={physYPositions[i]} r={3} fill="#3b82f6" />
          <circle cx={x} cy={mentYPositions[i]} r={3} fill="#a855f7" />
        </g>
      ))}
      <circle cx={chartW - padR - 85} cy={padT} r={3} fill="#10b981" />
      <text x={chartW - padR - 78} y={padT + 3} fill="#8b949e" fontSize={10}>Technical</text>
      <circle cx={chartW - padR - 30} cy={padT} r={3} fill="#3b82f6" />
      <text x={chartW - padR - 23} y={padT + 3} fill="#8b949e" fontSize={10}>Physical</text>
      <circle cx={chartW - padR - 95} cy={padT + 14} r={3} fill="#a855f7" />
      <text x={chartW - padR - 88} y={padT + 17} fill="#8b949e" fontSize={10}>Mental</text>
    </svg>
  );
}

function programEffectivenessBars(): React.JSX.Element {
  const barHeight = 20;
  const gap = 10;
  const labelWidth = 100;
  const chartWidth = 300;
  const maxEff = Math.max(...TRAINING_PROGRAMS.map(p => p.effectiveness), 1);

  return (
    <svg width="100%" viewBox={`0 0 ${chartWidth + labelWidth} ${TRAINING_PROGRAMS.length * (barHeight + gap)}`} className="block">
      {TRAINING_PROGRAMS.map((prog, i) => {
        const y = i * (barHeight + gap);
        const barW = Math.max(2, (prog.effectiveness / maxEff) * chartWidth);
        const barColor = prog.effectiveness >= 90 ? '#22c55e' : prog.effectiveness >= 82 ? '#84cc16' : prog.effectiveness >= 75 ? '#f59e0b' : '#ef4444';
        return (
          <g key={prog.id}>
            <text x={labelWidth - 5} y={y + barHeight / 2 + 4} textAnchor="end" fill="#8b949e" fontSize={11}>{prog.name}</text>
            <rect x={labelWidth} y={y} width={chartWidth} height={barHeight} rx={3} fill="#21262d" />
            <rect x={labelWidth} y={y} width={barW} height={barHeight} rx={3} fill={barColor} opacity={0.8} />
            <text x={labelWidth + barW + 6} y={y + barHeight / 2 + 4} fill="#c9d1d9" fontSize={11} fontWeight={600}>{prog.effectiveness}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function developmentRateScatter(): React.JSX.Element {
  const chartW = 280;
  const chartH = 160;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 24;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const minAge = Math.min(...SCATTER_DATA.map(d => d.age));
  const maxAge = Math.max(...SCATTER_DATA.map(d => d.age));
  const minGrowth = Math.min(...SCATTER_DATA.map(d => d.growth));
  const maxGrowth = Math.max(...SCATTER_DATA.map(d => d.growth));
  const ageRange = maxAge - minAge || 1;
  const growthRange = maxGrowth - minGrowth || 1;

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="block">
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={`grid-${pct}`} x1={padL} y1={padT + plotH * (1 - pct)} x2={chartW - padR} y2={padT + plotH * (1 - pct)} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.2} />
      ))}
      {[15, 16, 17, 18, 19, 20].map(age => {
        const x = padL + ((age - minAge) / ageRange) * plotW;
        return (
          <line key={`vgrid-${age}`} x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.1} />
        );
      })}
      <text x={padL - 4} y={padT + 4} textAnchor="end" fill="#8b949e" fontSize={10}>{maxGrowth.toFixed(1)}</text>
      <text x={padL - 4} y={padT + plotH} textAnchor="end" fill="#8b949e" fontSize={10}>{minGrowth.toFixed(1)}</text>
      <text x={padL + plotW} y={chartH - 4} textAnchor="end" fill="#8b949e" fontSize={10}>{maxAge}</text>
      <text x={padL} y={chartH - 4} textAnchor="start" fill="#8b949e" fontSize={10}>{minAge}</text>
      <text x={chartW / 2} y={chartH - 4} textAnchor="middle" fill="#484f58" fontSize={9}>Age</text>
      {SCATTER_DATA.map((point) => {
        const x = padL + ((point.age - minAge) / ageRange) * plotW;
        const y = padT + plotH * (1 - (point.growth - minGrowth) / growthRange);
        const dotColor = point.growth >= 6 ? '#22c55e' : point.growth >= 5 ? '#f59e0b' : '#ef4444';
        return <circle key={point.id} cx={x} cy={y} r={5} fill={dotColor} opacity={0.8} />;
      })}
      <text x={padL - 4} y={padT + plotH / 2} textAnchor="end" fill="#484f58" fontSize={9} transform={`rotate(-90 ${padL - 4} ${padT + plotH / 2})`}>Growth/yr</text>
    </svg>
  );
}

function attributeGrowthBars(): React.JSX.Element {
  const barHeight = 22;
  const gap = 8;
  const labelWidth = 36;
  const chartWidth = 220;
  const maxAttr = Math.max(...ATTR_GROWTH.map(a => Math.max(a.before, a.after)), 1);

  return (
    <svg width="100%" viewBox={`0 0 ${chartWidth + labelWidth + 50} ${ATTR_GROWTH.length * (barHeight + gap)}`} className="block">
      {ATTR_GROWTH.map((attr, i) => {
        const y = i * (barHeight + gap);
        const beforeW = Math.max(2, (attr.before / maxAttr) * chartWidth);
        const afterW = Math.max(2, (attr.after / maxAttr) * chartWidth);
        return (
          <g key={attr.id}>
            <text x={labelWidth - 5} y={y + barHeight / 2 + 4} textAnchor="end" fill="#c9d1d9" fontSize={12} fontWeight={700}>{attr.label}</text>
            <rect x={labelWidth} y={y} width={chartWidth} height={barHeight / 2 - 1} rx={2} fill="#21262d" />
            <rect x={labelWidth} y={y} width={beforeW} height={barHeight / 2 - 1} rx={2} fill={attr.color} opacity={0.4} />
            <rect x={labelWidth} y={y + barHeight / 2} width={chartWidth} height={barHeight / 2 - 1} rx={2} fill="#21262d" />
            <rect x={labelWidth} y={y + barHeight / 2} width={afterW} height={barHeight / 2 - 1} rx={2} fill={attr.color} opacity={0.8} />
            <text x={labelWidth + chartWidth + 6} y={y + barHeight / 2 - 2} fill="#8b949e" fontSize={9}>{attr.before}</text>
            <text x={labelWidth + chartWidth + 6} y={y + barHeight - 1} fill="#c9d1d9" fontSize={9} fontWeight={600}>{attr.after}</text>
          </g>
        );
      })}
    </svg>
  );
}

function promotionPipelineRing(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 55;

  const totalPlayers = PROMOTION_PIPELINE.reduce((sum, stage) => sum + stage.count, 0) || 1;

  const arcs = PROMOTION_PIPELINE.reduce<{ stage: string; count: number; color: string; startPct: number; endPct: number; path: string; lx: number; ly: number }[]>((acc, stage, idx) => {
    const pct = stage.count / totalPlayers;
    const startPct = idx === 0 ? 0 : acc[idx - 1].endPct;
    const endPct = startPct + pct;
    const startAngle = 2 * Math.PI * startPct - Math.PI / 2;
    const endAngle = 2 * Math.PI * endPct - Math.PI / 2;
    const midAngle = (startAngle + endAngle) / 2;

    const outerX1 = cx + outerR * Math.cos(startAngle);
    const outerY1 = cy + outerR * Math.sin(startAngle);
    const outerX2 = cx + outerR * Math.cos(endAngle);
    const outerY2 = cy + outerR * Math.sin(endAngle);
    const innerX1 = cx + innerR * Math.cos(endAngle);
    const innerY1 = cy + innerR * Math.sin(endAngle);
    const innerX2 = cx + innerR * Math.cos(startAngle);
    const innerY2 = cy + innerR * Math.sin(startAngle);
    const largeArc = pct > 0.5 ? 1 : 0;

    const labelR = (outerR + innerR) / 2;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    acc.push({
      stage: stage.stage,
      count: stage.count,
      color: stage.color,
      path: `M ${outerX1.toFixed(1)} ${outerY1.toFixed(1)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerX2.toFixed(1)} ${outerY2.toFixed(1)} L ${innerX1.toFixed(1)} ${innerY1.toFixed(1)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerX2.toFixed(1)} ${innerY2.toFixed(1)} Z`,
      lx, ly,
      startPct,
      endPct,
    });
    return acc;
  }, []);

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto block">
      {arcs.map((arc) => (
        <path key={arc.stage} d={arc.path} fill={arc.color} opacity={0.8} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={18} fontWeight={700}>
        {totalPlayers}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={10}>
        Total
      </text>
      {arcs.map((arc) => (
        <g key={`ring-lbl-${arc.stage}`}>
          <text x={arc.lx} y={arc.ly - 2} textAnchor="middle" fill="white" fontSize={10} fontWeight={700}>{arc.count}</text>
          <text x={arc.lx} y={arc.ly + 10} textAnchor="middle" fill="white" fontSize={8} opacity={0.9}>{arc.stage}</text>
        </g>
      ))}
    </svg>
  );
}

function scoutingCoverageRadar(): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 65;
  const sides = 5;
  const gridLevels = 4;
  const gridPoints = buildRadarGridPoints(cx, cy, r, gridLevels, sides);
  const coverageValues = SCOUTING_COVERAGE.map(s => s.coverage);
  const dataPoints = buildRadarPoints(cx, cy, r, coverageValues);

  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto block">
      {gridPoints.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth={0.5} opacity={0.2} />
      ))}
      {SCOUTING_COVERAGE.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#30363d" strokeWidth={0.5} opacity={0.2} />
        );
      })}
      <polygon points={dataPoints} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={1.5} />
      {SCOUTING_COVERAGE.map((region, i) => {
        const angle = startAngle + i * angleStep;
        const normalized = region.coverage / 100;
        const dotX = cx + r * normalized * Math.cos(angle);
        const dotY = cy + r * normalized * Math.sin(angle);
        const lblX = cx + (r + 20) * Math.cos(angle);
        const lblY = cy + (r + 20) * Math.sin(angle);
        return (
          <g key={region.region}>
            <circle cx={dotX} cy={dotY} r={3} fill="#3b82f6" />
            <text x={lblX} y={lblY + 3} textAnchor="middle" fill="#8b949e" fontSize={10} fontWeight={600}>{region.region}</text>
          </g>
        );
      })}
    </svg>
  );
}

function youthTransferSpendingBars(): React.JSX.Element {
  const chartW = 280;
  const chartH = 140;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxAmount = Math.max(...YOUTH_SPENDING.map(s => s.amount), 0.1);
  const barW = Math.max(8, plotW / YOUTH_SPENDING.length - 10);

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="block">
      {[0, 0.5, 1].map(pct => {
        const y = padT + plotH * (1 - pct);
        const val = pct * maxAmount;
        return (
          <line key={`grid-${pct}`} x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.2} />
        );
      })}
      <text x={padL - 4} y={padT + 4} textAnchor="end" fill="#8b949e" fontSize={10}>{`£${maxAmount.toFixed(1)}M`}</text>
      <text x={padL - 4} y={padT + plotH / 2 + 4} textAnchor="end" fill="#8b949e" fontSize={10}>{`£${(maxAmount / 2).toFixed(1)}M`}</text>
      <text x={padL - 4} y={padT + plotH + 4} textAnchor="end" fill="#8b949e" fontSize={10}>£0</text>
      {YOUTH_SPENDING.map((season, i) => {
        const x = padL + (i / (YOUTH_SPENDING.length - 1)) * plotW;
        const barH = Math.max(2, (season.amount / maxAmount) * plotH);
        const y = padT + plotH - barH;
        const barColor = i === YOUTH_SPENDING.length - 1 ? '#f59e0b' : '#3b82f6';
        return (
          <g key={season.id}>
            <rect x={x - barW / 2} y={y} width={barW} height={barH} rx={3} fill={barColor} opacity={0.8} />
            <text x={x} y={chartH - 8} textAnchor="middle" fill="#8b949e" fontSize={10}>{season.season}</text>
            <text x={x} y={y - 5} textAnchor="middle" fill="#c9d1d9" fontSize={10} fontWeight={600}>{`£${season.amount}M`}</text>
          </g>
        );
      })}
    </svg>
  );
}

function recruitmentFunnel(): React.JSX.Element {
  const funnelW = 320;
  const funnelH = 140;
  const padT = 10;
  const stageH = (funnelH - padT) / FUNNEL_STAGES.length;
  const maxCount = FUNNEL_STAGES[0].count || 1;

  return (
    <svg width="100%" viewBox={`0 0 ${funnelW} ${funnelH}`} className="block">
      {FUNNEL_STAGES.map((stage, i) => {
        const widthPct = stage.count / maxCount;
        const centerX = funnelW / 2;
        const stageW = Math.max(20, widthPct * (funnelW - 40));
        const y = padT + i * stageH;
        const x = centerX - stageW / 2;
        return (
          <g key={stage.id}>
            <rect x={x} y={y + 2} width={stageW} height={stageH - 4} rx={4} fill={stage.color} opacity={0.7} />
            <text x={centerX} y={y + stageH / 2 + 1} textAnchor="middle" fill="white" fontSize={12} fontWeight={700}>
              {stage.label}
            </text>
            <text x={centerX + stageW / 2 + 8} y={y + stageH / 2 + 5} textAnchor="start" fill="#c9d1d9" fontSize={11} fontWeight={600}>
              {stage.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Sub-Components (inside main component convention) ─────

function headerSection(onBack: () => void, playerName: string): React.JSX.Element {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION }}
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="text-[#8b949e] hover:text-white hover:bg-[#21262d] shrink-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-[#c9d1d9] truncate">Youth Academy Deep Dive</h1>
        <p className="text-xs text-[#8b949e] truncate">{playerName}&apos;s Academy</p>
      </div>
      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shrink-0">
        <Star className="h-3 w-3 mr-1" />
        {ACADEMY_RATING}/100
      </Badge>
    </motion.div>
  );
}

function facilityCard(facility: typeof FACILITIES[number], delay: number): React.JSX.Element {
  return (
    <motion.div
      key={facility.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        {facility.icon}
        <span className="text-xs font-semibold text-[#c9d1d9] truncate">{facility.name}</span>
      </div>
      <div className="flex items-center gap-1 mb-1">
        {Array.from({ length: facility.maxLevel }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < facility.level ? 'bg-emerald-500' : 'bg-[#30363d]'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8b949e]">Level {facility.level}/{facility.maxLevel}</span>
        <span className={`text-[10px] ${facility.status === 'Active' ? 'text-emerald-400' : facility.status === 'Upgrading' ? 'text-amber-400' : 'text-red-400'}`}>
          {facility.status}
        </span>
      </div>
    </motion.div>
  );
}

function youthPlayerCard(player: typeof YOUTH_PLAYERS[number], delay: number): React.JSX.Element {
  const posColor = getPositionColor(player.position);
  const ovrColor = getOverallColor(player.overall);
  const potColor = getPotentialBadgeColor(player.potential);
  const isWonderkid = player.potential >= 87;

  return (
    <motion.div
      key={player.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${posColor}`}>{player.position}</span>
          <div>
            <p className="text-sm font-medium text-[#c9d1d9]">{player.name}</p>
            <p className="text-[10px] text-[#8b949e]">{player.nationality} &middot; Age {player.age}</p>
          </div>
        </div>
        {isWonderkid && (
          <Star className="h-4 w-4 text-amber-400 shrink-0" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#8b949e]">OVR</span>
          <p className={`text-lg font-black tabular-nums ${ovrColor}`}>{player.overall}</p>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-[#8b949e]">Growth</span>
          <p className="text-sm font-bold tabular-nums text-emerald-400">+{player.potential - player.overall}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#8b949e]">POT</span>
          <p className="text-lg font-black tabular-nums text-lime-400">{player.potential}</p>
        </div>
      </div>
      <div className="mt-2">
        <Badge className={`text-[9px] border ${potColor}`}>
          {getPotentialLabel(player.potential)}
        </Badge>
      </div>
    </motion.div>
  );
}

function trainingProgramCard(program: typeof TRAINING_PROGRAMS[number], delay: number): React.JSX.Element {
  const intensityColor = program.intensity >= 85 ? 'text-red-400' : program.intensity >= 70 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <motion.div
      key={program.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#c9d1d9]">{program.name}</h3>
        <Zap className={`h-3.5 w-3.5 ${intensityColor}`} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex items-center gap-1 text-[#8b949e]">
          <Target className="h-3 w-3" />
          <span>{program.focus}</span>
        </div>
        <div className="flex items-center gap-1 text-[#8b949e]">
          <Clock className="h-3 w-3" />
          <span>{program.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-[#8b949e]">
          <Users className="h-3 w-3" />
          <span>{program.enrolled} enrolled</span>
        </div>
        <div className={`font-semibold ${intensityColor}`}>
          {program.intensity}% intensity
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] text-[#8b949e]">Effectiveness</span>
          <span className="text-[9px] text-[#c9d1d9] font-semibold">{program.effectiveness}%</span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <div
            className="h-full rounded-sm bg-emerald-500"
            style={{ width: `${program.effectiveness}%` }}
          />
        </div>
      </div>
      <p className="text-[9px] text-[#484f58] mt-1.5">{program.coach}</p>
    </motion.div>
  );
}

function coachingStaffCard(staff: typeof COACHING_STAFF[number], delay: number): React.JSX.Element {
  return (
    <motion.div
      key={staff.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
          <GraduationCap className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#c9d1d9] truncate">{staff.name}</p>
          <p className="text-[10px] text-[#8b949e] truncate">{staff.role}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#8b949e]">{staff.specialty}</span>
        <span className="text-emerald-400 font-semibold">{staff.rating}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Clock className="h-2.5 w-2.5 text-[#484f58]" />
        <span className="text-[9px] text-[#484f58]">{staff.yearsExp} years experience</span>
      </div>
    </motion.div>
  );
}

function weeklyScheduleCard(day: typeof WEEKLY_SCHEDULE[number], index: number): React.JSX.Element {
  return (
    <motion.div
      key={day.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay: 0.03 * index }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-[#c9d1d9]">{day.day}</h3>
        <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          {day.hours}h
        </Badge>
      </div>
      {day.sessions.map((session, si) => (
        <div key={si} className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
          <div className="w-1 h-1 bg-emerald-500 rounded-sm shrink-0" />
          <span>{session}</span>
        </div>
      ))}
    </motion.div>
  );
}

function devPlayerCard(player: typeof DEV_PLAYERS[number], delay: number): React.JSX.Element {
  const growthColor = player.growthRate >= 6 ? 'text-emerald-400' : player.growthRate >= 5 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div
      key={player.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${getPositionColor(player.position)}`}>{player.position}</span>
          <div>
            <p className="text-sm font-medium text-[#c9d1d9]">{player.name}</p>
            <p className="text-[10px] text-[#8b949e]">{player.monthsTrained} months trained</p>
          </div>
        </div>
        <TrendingUp className={`h-4 w-4 ${growthColor}`} />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <span className="text-[9px] text-[#484f58] block">Before</span>
          <span className={`text-base font-bold tabular-nums ${getOverallColor(player.beforeOvr)}`}>{player.beforeOvr}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-[#484f58]" />
        <div className="text-center">
          <span className="text-[9px] text-[#484f58] block">After</span>
          <span className={`text-base font-bold tabular-nums ${getOverallColor(player.afterOvr)}`}>{player.afterOvr}</span>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <span className="text-[9px] text-[#484f58] block">Growth</span>
          <span className={`text-sm font-bold tabular-nums ${growthColor}`}>+{player.growthRate}</span>
        </div>
      </div>
    </motion.div>
  );
}

function scoutedTargetCard(target: typeof SCOUTED_TARGETS[number], delay: number): React.JSX.Element {
  return (
    <motion.div
      key={target.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${getPositionColor(target.position)}`}>{target.position}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#c9d1d9] truncate">{target.name}</p>
            <p className="text-[10px] text-[#8b949e]">{target.club} &middot; Age {target.age}</p>
          </div>
        </div>
        <span className="text-sm font-black text-lime-400 tabular-nums">{target.potential}</span>
      </div>
      <p className="text-[10px] text-[#8b949e] mb-2 line-clamp-2">{target.report}</p>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#484f58]">{target.region}</span>
        <Badge className={`text-[9px] border ${getScoutingStatusColor(target.status)}`}>
          {target.status}
        </Badge>
      </div>
    </motion.div>
  );
}

function trialInvitationCard(trial: typeof TRIAL_INVITATIONS[number], delay: number): React.JSX.Element {
  const statusColor = trial.status === 'Accepted' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : trial.status === 'Pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    : trial.status === 'Offer Sent' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
    : 'border-slate-500/30 bg-slate-500/10 text-[#8b949e]';

  return (
    <motion.div
      key={trial.id}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${getPositionColor(trial.position)}`}>{trial.position}</span>
          <p className="text-sm font-medium text-[#c9d1d9]">{trial.player}</p>
        </div>
        <Badge className={`text-[9px] border ${statusColor}`}>
          {trial.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px] text-[#8b949e]">
        <div className="flex items-center gap-1">
          <Users className="h-2.5 w-2.5" />
          <span>From: {trial.from}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          <span>{trial.duration}</span>
        </div>
      </div>
      <p className="text-[9px] text-[#484f58] mt-1">Starts: {trial.startDate}</p>
    </motion.div>
  );
}

function sectionTitle(title: string, icon: React.ReactNode, delay: number): React.JSX.Element {
  return (
    <motion.div
      className="flex items-center gap-2 mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIM_DURATION, delay }}
    >
      <span className="text-emerald-400">{icon}</span>
      <h2 className="text-sm font-semibold text-[#c9d1d9]">{title}</h2>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function YouthAcademyDeepDive() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as any);
  const playerName = playerData?.name ?? 'Your Player';

  const [activeTab, setActiveTab] = useState<string>('squad');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBack = useCallback(() => {
    setScreen('youth_academy');
  }, [setScreen]);

  const handleSelectPlayer = useCallback((id: string | null) => {
    setSelectedPlayerId(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const budgetPct = RECRUITMENT_BUDGET.total > 0
    ? (RECRUITMENT_BUDGET.spent / RECRUITMENT_BUDGET.total) * 100
    : 0;

  const promotionSuccessRate = PROMOTION_PIPELINE.length > 0
    ? Math.round((PROMOTION_PIPELINE[2].count / Math.max(1, PROMOTION_PIPELINE[0].count)) * 100)
    : 0;

  const avgTrainingEffectiveness = TRAINING_PROGRAMS.length > 0
    ? Math.round(TRAINING_PROGRAMS.reduce((sum, p) => sum + p.effectiveness, 0) / TRAINING_PROGRAMS.length)
    : 0;

  const avgGrowthRate = DEV_PLAYERS.length > 0
    ? parseFloat((DEV_PLAYERS.reduce((sum, p) => sum + p.growthRate, 0) / DEV_PLAYERS.length).toFixed(1))
    : 0;

  const totalFunnelConversion = FUNNEL_STAGES.length > 1
    ? FUNNEL_STAGES[0].count > 0
      ? Math.round((FUNNEL_STAGES[FUNNEL_STAGES.length - 1].count / FUNNEL_STAGES[0].count) * 100)
      : 0
    : 0;

  const youthSquadOverviewTab = useCallback((): React.JSX.Element => (
    <div className="space-y-4">
      {/* Academy Rating Banner */}
      <motion.div
        className="bg-[#161b22] border border-emerald-500/20 rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.02 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-[#c9d1d9]">Academy Rating</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">{ACADEMY_RATING}</span>
            <span className="text-xs text-[#8b949e]">/100</span>
          </div>
        </div>
        <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${ACADEMY_RATING}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="text-[#8b949e]">Category: <span className="text-emerald-400 font-semibold">Elite</span></span>
          <span className="text-[#8b949e]">Players: <span className="text-[#c9d1d9] font-semibold">{YOUTH_PLAYERS.length}</span></span>
          <span className="text-[#8b949e]">Avg Potential: <span className="text-lime-400 font-semibold">{Math.round(YOUTH_PLAYERS.reduce((sum, p) => sum + p.potential, 0) / YOUTH_PLAYERS.length)}</span></span>
        </div>
      </motion.div>

      {/* Facilities */}
      {sectionTitle('Facilities', <Baby className="h-4 w-4" />, 0.04)}
      <div className="grid grid-cols-2 gap-2">
        {FACILITIES.map((fac, i) => facilityCard(fac, 0.05 + i * 0.02))}
      </div>

      {/* Youth Squad Hex Radar */}
      {sectionTitle('Squad Ability Radar', <BarChart3 className="h-4 w-4" />, 0.18)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.19 }}
      >
        {youthSquadHexRadar()}
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
          {SQUAD_RADAR_AXES.map((axis, i) => (
            <span key={axis} className="text-[#8b949e]">
              {axis}: <span className="text-[#c9d1d9] font-semibold">{SQUAD_RADAR_VALUES[i]}</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* Potential Distribution Donut */}
      {sectionTitle('Potential Distribution', <Star className="h-4 w-4" />, 0.22)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.23 }}
      >
        {potentialDistributionDonut()}
      </motion.div>

      {/* Age Group Bars */}
      {sectionTitle('Age Group Distribution', <Users className="h-4 w-4" />, 0.26)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.27 }}
      >
        {ageGroupBars()}
      </motion.div>

      {/* Youth Player Cards */}
      {sectionTitle('Youth Squad', <GraduationCap className="h-4 w-4" />, 0.30)}
      <div className="space-y-2">
        {YOUTH_PLAYERS.map((player, i) => youthPlayerCard(player, 0.31 + i * 0.02))}
      </div>

      {/* Top Prospects Comparison */}
      {sectionTitle('Top Prospects Comparison', <TrendingUp className="h-4 w-4" />, 0.48)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.49 }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#21262d] text-[#8b949e]">
              <th className="py-2 px-2 text-left">Player</th>
              <th className="py-2 px-1 text-center">Age</th>
              <th className="py-2 px-1 text-center">Pos</th>
              <th className="py-2 px-1 text-center">OVR</th>
              <th className="py-2 px-1 text-center">POT</th>
              <th className="py-2 px-1 text-center">Gap</th>
            </tr>
          </thead>
          <tbody>
            {YOUTH_PLAYERS
              .slice()
              .sort((a, b) => b.potential - a.potential)
              .slice(0, 5)
              .map((player) => {
                const gap = player.potential - player.overall;
                return (
                  <tr key={player.id} className="border-t border-[#30363d]">
                    <td className="py-1.5 px-2 font-medium text-[#c9d1d9]">{player.name}</td>
                    <td className="py-1.5 px-1 text-center text-[#8b949e]">{player.age}</td>
                    <td className={`py-1.5 px-1 text-center font-bold ${getPositionColor(player.position)}`}>{player.position}</td>
                    <td className={`py-1.5 px-1 text-center font-bold ${getOverallColor(player.overall)}`}>{player.overall}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-lime-400">{player.potential}</td>
                    <td className="py-1.5 px-1 text-center text-emerald-400">+{gap}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </motion.div>

      {/* Academy History Timeline */}
      {sectionTitle('Academy Highlights', <Award className="h-4 w-4" />, 0.52)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.53 }}
      >
        {[
          { date: 'Oct 2024', event: 'Kai Yamamoto rated as top wonderkid', type: 'star' },
          { date: 'Sep 2024', event: 'Enzo Fernandez promoted to first team', type: 'trophy' },
          { date: 'Aug 2024', event: 'Academy rating increased to 78', type: 'trending' },
          { date: 'Jul 2024', event: '3 new youth signings completed', type: 'users' },
          { date: 'Jun 2024', event: 'U18 league title won', type: 'trophy' },
          { date: 'May 2024', event: 'Recovery Center upgrade started', type: 'trending' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm mt-1.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-[#484f58] block">{item.date}</span>
              <span className="text-xs text-[#c9d1d9]">{item.event}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  ), []);

  const trainingProgramsTab = useCallback((): React.JSX.Element => (
    <div className="space-y-4">
      {/* Training Programs */}
      {sectionTitle('Training Programs', <Dumbbell className="h-4 w-4" />, 0.02)}
      <div className="grid grid-cols-1 gap-2">
        {TRAINING_PROGRAMS.map((program, i) => trainingProgramCard(program, 0.03 + i * 0.02))}
      </div>

      {/* Coaching Staff */}
      {sectionTitle('Coaching Staff', <Users className="h-4 w-4" />, 0.14)}
      <div className="grid grid-cols-2 gap-2">
        {COACHING_STAFF.map((staff, i) => coachingStaffCard(staff, 0.15 + i * 0.02))}
      </div>

      {/* Weekly Training Schedule */}
      {sectionTitle('Weekly Schedule', <Clock className="h-4 w-4" />, 0.23)}
      <div className="space-y-2">
        {WEEKLY_SCHEDULE.map((day, i) => weeklyScheduleCard(day, i))}
      </div>

      {/* Training Intensity Gauge */}
      {sectionTitle('Training Intensity', <Zap className="h-4 w-4" />, 0.40)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.41 }}
      >
        {trainingIntensityGauge()}
      </motion.div>

      {/* Skill Development Trend */}
      {sectionTitle('Skill Development Trend', <TrendingUp className="h-4 w-4" />, 0.44)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.45 }}
      >
        {skillDevelopmentTrend()}
      </motion.div>

      {/* Program Effectiveness Bars */}
      {sectionTitle('Program Effectiveness', <Target className="h-4 w-4" />, 0.48)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.49 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#8b949e]">Average:</span>
          <span className="text-sm font-bold text-emerald-400">{avgTrainingEffectiveness}%</span>
        </div>
        {programEffectivenessBars()}
      </motion.div>

      {/* Weekly Training Load */}
      {sectionTitle('Weekly Training Load', <Heart className="h-4 w-4" />, 0.52)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.53 }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2.5">
            <span className="text-[9px] text-[#484f58] block">Total Hours</span>
            <span className="text-lg font-bold text-[#c9d1d9]">15h</span>
            <span className="text-[9px] text-emerald-400 ml-1">per week</span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5">
            <span className="text-[9px] text-[#484f58] block">Sessions</span>
            <span className="text-lg font-bold text-[#c9d1d9]">12</span>
            <span className="text-[9px] text-[#8b949e] ml-1">this week</span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5">
            <span className="text-[9px] text-[#484f58] block">Rest Days</span>
            <span className="text-lg font-bold text-amber-400">2</span>
            <span className="text-[9px] text-[#8b949e] ml-1">scheduled</span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5">
            <span className="text-[9px] text-[#484f58] block">Injury Risk</span>
            <span className="text-lg font-bold text-emerald-400">Low</span>
            <span className="text-[9px] text-[#8b949e] ml-1">balanced</span>
          </div>
        </div>
      </motion.div>

      {/* Injury Prevention */}
      {sectionTitle('Injury Prevention', <Shield className="h-4 w-4" />, 0.56)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.57 }}
      >
        {[
          { protocol: 'Pre-session warm-up', status: 'Active', adherence: 95 },
          { protocol: 'Post-session cool-down', status: 'Active', adherence: 88 },
          { protocol: 'Weekly physio assessment', status: 'Active', adherence: 100 },
          { protocol: 'Load monitoring system', status: 'Active', adherence: 92 },
          { protocol: 'Nutrition planning', status: 'Partial', adherence: 70 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-[#21262d] last:border-b-0">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-sm ${item.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-[#c9d1d9]">{item.protocol}</span>
            </div>
            <span className={`text-[10px] font-semibold ${item.adherence >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{item.adherence}%</span>
          </div>
        ))}
      </motion.div>
    </div>
  ), [avgTrainingEffectiveness]);

  const playerDevelopmentTab = useCallback((): React.JSX.Element => (
    <div className="space-y-4">
      {/* Development Summary */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.02 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#c9d1d9]">Development Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-center">
            <span className="text-[9px] text-[#484f58] block">Avg Growth</span>
            <span className="text-sm font-bold text-emerald-400">{avgGrowthRate}/yr</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] text-[#484f58] block">Top Improver</span>
            <span className="text-sm font-bold text-[#c9d1d9]">Marcus S.</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] text-[#484f58] block">Promoted</span>
            <span className="text-sm font-bold text-amber-400">4</span>
          </div>
        </div>
      </motion.div>

      {/* Player Development Cards */}
      {sectionTitle('Player Development', <GraduationCap className="h-4 w-4" />, 0.04)}
      <div className="space-y-2">
        {DEV_PLAYERS.map((player, i) => devPlayerCard(player, 0.05 + i * 0.02))}
      </div>

      {/* Training Drill Results */}
      {sectionTitle('Training Drill Results', <Dumbbell className="h-4 w-4" />, 0.18)}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
        {[
          { drill: 'Dribbling Course', result: 'Passed', rating: 8.2, participants: 6 },
          { drill: 'Shooting Accuracy', result: 'Passed', rating: 7.5, participants: 8 },
          { drill: 'Passing Precision', result: 'Needs Work', rating: 6.1, participants: 5 },
          { drill: 'Tactical Awareness', result: 'Passed', rating: 7.8, participants: 7 },
        ].map((drill, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#21262d] last:border-b-0">
            <div>
              <p className="text-xs font-medium text-[#c9d1d9]">{drill.drill}</p>
              <p className="text-[9px] text-[#8b949e]">{drill.participants} participants</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tabular-nums ${drill.rating >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>{drill.rating}</span>
              <Badge className={`text-[8px] border ${drill.result === 'Passed' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                {drill.result}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Promotion Tracker */}
      {sectionTitle('Promotion Tracker', <Award className="h-4 w-4" />, 0.24)}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#8b949e]">Academy → First Team Success Rate</span>
          <span className="text-sm font-bold text-emerald-400">{promotionSuccessRate}%</span>
        </div>
        {[
          { player: 'Enzo Fernandez', from: 'Academy', to: 'First Team', date: 'Sep 2024' },
          { player: 'Alex Morgan', from: 'U21', to: 'First Team', date: 'Aug 2024' },
          { player: 'Liam Carter', from: 'Academy', to: 'U21', date: 'Jul 2024' },
        ].map((promo, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#21262d] last:border-b-0">
            <ChevronRight className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="text-xs text-[#c9d1d9] flex-1">{promo.player}</span>
            <span className="text-[9px] text-[#484f58]">{promo.from} → {promo.to}</span>
            <span className="text-[9px] text-[#8b949e]">{promo.date}</span>
          </div>
        ))}
      </div>

      {/* Development Rate Scatter */}
      {sectionTitle('Development Rate by Age', <BarChart3 className="h-4 w-4" />, 0.30)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.31 }}
      >
        {developmentRateScatter()}
      </motion.div>

      {/* Attribute Growth Bars */}
      {sectionTitle('Attribute Growth (6 Months)', <TrendingUp className="h-4 w-4" />, 0.35)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.36 }}
      >
        {attributeGrowthBars()}
      </motion.div>

      {/* Promotion Pipeline Ring */}
      {sectionTitle('Promotion Pipeline', <GraduationCap className="h-4 w-4" />, 0.40)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.41 }}
      >
        {promotionPipelineRing()}
      </motion.div>

      {/* Recent Development Milestones */}
      {sectionTitle('Recent Milestones', <Star className="h-4 w-4" />, 0.44)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.45 }}
      >
        {[
          { player: 'Marcus Silva', milestone: 'Reached 68 OVR', icon: <TrendingUp className="h-3 w-3 text-emerald-400" /> },
          { player: 'Kai Yamamoto', milestone: 'Named in U17 national team', icon: <Award className="h-3 w-3 text-amber-400" /> },
          { player: 'Liam Carter', milestone: 'First team debut', icon: <GraduationCap className="h-3 w-3 text-blue-400" /> },
          { player: 'Enzo Fernandez', milestone: 'Completed 50 youth apps', icon: <Shield className="h-3 w-3 text-purple-400" /> },
          { player: 'Jasper Müller', milestone: 'Hat-trick in U18 cup', icon: <Target className="h-3 w-3 text-red-400" /> },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-[#21262d] last:border-b-0">
            {item.icon}
            <span className="text-xs font-medium text-[#c9d1d9] flex-1">{item.player}</span>
            <span className="text-[10px] text-[#8b949e]">{item.milestone}</span>
          </div>
        ))}
      </motion.div>

      {/* Personalized Training Focus */}
      {sectionTitle('Recommended Focus Areas', <Zap className="h-4 w-4" />, 0.48)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.49 }}
      >
        <div className="space-y-2">
          {[
            { player: 'Marcus Silva', focus: 'Passing accuracy under pressure', priority: 'High', reason: 'Key playmaker, needs precision' },
            { player: 'Kai Yamamoto', focus: 'Physical strength', priority: 'High', reason: 'Speed excellent but needs to hold off defenders' },
            { player: 'Liam Carter', focus: 'Off-the-ball movement', priority: 'Medium', reason: 'Finishing strong, improve positioning' },
            { player: 'Omar Diallo', focus: 'Defensive positioning', priority: 'High', reason: 'Athletic but raw in tactical awareness' },
          ].map((item, i) => (
            <div key={i} className="bg-[#21262d] rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#c9d1d9]">{item.player}</span>
                <Badge className={`text-[8px] border ${item.priority === 'High' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">{item.focus}</p>
              <p className="text-[9px] text-[#484f58] mt-0.5">{item.reason}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  ), [avgGrowthRate, promotionSuccessRate]);

  const scoutingRecruitmentTab = useCallback((): React.JSX.Element => (
    <div className="space-y-4">
      {/* Recruitment Budget */}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.02 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-[#c9d1d9]">Recruitment Budget</span>
        </div>
        <div className="h-3 bg-[#21262d] rounded-sm overflow-hidden mb-2">
          <div className="h-full bg-blue-500 rounded-sm" style={{ width: `${(RECRUITMENT_BUDGET.spent / RECRUITMENT_BUDGET.total) * 100}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          <div>
            <span className="text-[9px] text-[#484f58] block">Total</span>
            <span className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(RECRUITMENT_BUDGET.total)}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#484f58] block">Spent</span>
            <span className="text-xs font-bold text-red-400">{formatCurrency(RECRUITMENT_BUDGET.spent)}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#484f58] block">Reserved</span>
            <span className="text-xs font-bold text-amber-400">{formatCurrency(RECRUITMENT_BUDGET.reserved)}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#484f58] block">Available</span>
            <span className="text-xs font-bold text-emerald-400">{formatCurrency(RECRUITMENT_BUDGET.available)}</span>
          </div>
        </div>
      </motion.div>

      {/* Scouted Youth Targets */}
      {sectionTitle('Scouted Youth Targets', <BarChart3 className="h-4 w-4" />, 0.06)}
      <div className="space-y-2">
        {SCOUTED_TARGETS.map((target, i) => scoutedTargetCard(target, 0.07 + i * 0.02))}
      </div>

      {/* Trial Invitations */}
      {sectionTitle('Trial Invitations', <Users className="h-4 w-4" />, 0.20)}
      <div className="grid grid-cols-1 gap-2">
        {TRIAL_INVITATIONS.map((trial, i) => trialInvitationCard(trial, 0.21 + i * 0.02))}
      </div>

      {/* Scouting Coverage Radar */}
      {sectionTitle('Scouting Coverage', <Target className="h-4 w-4" />, 0.30)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.31 }}
      >
        {scoutingCoverageRadar()}
        <div className="flex items-center justify-center gap-4 mt-2">
          {SCOUTING_COVERAGE.map((region) => (
            <span key={region.region} className="text-[10px] text-[#8b949e]">
              {region.region}: <span className="text-[#c9d1d9] font-semibold">{region.coverage}%</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* Youth Transfer Spending Bars */}
      {sectionTitle('Youth Transfer Spending', <TrendingUp className="h-4 w-4" />, 0.36)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.37 }}
      >
        {youthTransferSpendingBars()}
      </motion.div>

      {/* Recruitment Funnel */}
      {sectionTitle('Recruitment Funnel', <Shield className="h-4 w-4" />, 0.42)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.43 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#8b949e]">Overall Conversion</span>
          <span className="text-xs font-bold text-emerald-400">{totalFunnelConversion}%</span>
        </div>
        {recruitmentFunnel()}
      </motion.div>

      {/* Regional Network Detail */}
      {sectionTitle('Regional Scouting Network', <BarChart3 className="h-4 w-4" />, 0.48)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.49 }}
      >
        {SCOUTING_COVERAGE.map((region, i) => {
          const barColor = region.coverage >= 75 ? 'bg-emerald-500' : region.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={region.region} className="flex items-center gap-2">
              <span className="text-xs text-[#c9d1d9] w-20 shrink-0">{region.region}</span>
              <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                <div className={`h-full rounded-sm ${barColor}`} style={{ width: `${region.coverage}%` }} />
              </div>
              <span className="text-xs font-bold text-[#8b949e] w-8 text-right">{region.coverage}%</span>
            </div>
          );
        })}
      </motion.div>

      {/* Upcoming Trial Dates */}
      {sectionTitle('Upcoming Trial Dates', <Clock className="h-4 w-4" />, 0.52)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.53 }}
      >
        <div className="space-y-2">
          {TRIAL_INVITATIONS.map((trial) => {
            const statusIcon = trial.status === 'Accepted'
              ? <Heart className="h-3 w-3 text-emerald-400" />
              : trial.status === 'Pending'
                ? <Clock className="h-3 w-3 text-amber-400" />
                : <Shield className="h-3 w-3 text-blue-400" />;
            return (
              <div key={trial.id} className="flex items-center gap-2 py-1.5 border-b border-[#21262d] last:border-b-0">
                {statusIcon}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#c9d1d9]">{trial.player}</p>
                  <p className="text-[9px] text-[#484f58]">{trial.from} &middot; {trial.duration}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#8b949e]">{trial.startDate}</p>
                  <Badge className={`text-[8px] border ${getScoutingStatusColor(trial.status)}`}>{trial.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Signed Players History */}
      {sectionTitle('Recent Signings', <Award className="h-4 w-4" />, 0.56)}
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: ANIM_DURATION, delay: 0.57 }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#21262d] text-[#8b949e]">
              <th className="py-2 px-2 text-left">Player</th>
              <th className="py-2 px-1 text-center">Age</th>
              <th className="py-2 px-1 text-center">From</th>
              <th className="py-2 px-1 text-center">Date</th>
              <th className="py-2 px-1 text-center">Cost</th>
            </tr>
          </thead>
          <tbody>
            {[
              { player: 'Enzo Fernandez', age: 16, from: 'Argentina', date: 'Jan 2024', cost: '£1.2M' },
              { player: 'Jasper Müller', age: 15, from: 'Germany', date: 'Jun 2024', cost: '£800K' },
              { player: 'Aiden Park', age: 14, from: 'S. Korea', date: 'Sep 2024', cost: '£150K' },
            ].map((signing, i) => (
              <tr key={i} className="border-t border-[#30363d]">
                <td className="py-1.5 px-2 font-medium text-[#c9d1d9]">{signing.player}</td>
                <td className="py-1.5 px-1 text-center text-[#8b949e]">{signing.age}</td>
                <td className="py-1.5 px-1 text-center text-[#8b949e]">{signing.from}</td>
                <td className="py-1.5 px-1 text-center text-[#8b949e]">{signing.date}</td>
                <td className="py-1.5 px-1 text-center text-emerald-400 font-semibold">{signing.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  ), [totalFunnelConversion]);

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20" ref={containerRef}>
      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* ══════════════════ HEADER ══════════════════ */}
        {headerSection(handleBack, playerName)}

        {/* ══════════════════ STATS SUMMARY BAR ══════════════════ */}
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: ANIM_DURATION, delay: 0.05 }}
        >
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="text-[9px] text-[#484f58] block">Players</span>
              <span className="text-sm font-bold text-[#c9d1d9]">{YOUTH_PLAYERS.length}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#484f58] block">Avg OVR</span>
              <span className="text-sm font-bold text-emerald-400">{Math.round(YOUTH_PLAYERS.reduce((sum, p) => sum + p.overall, 0) / YOUTH_PLAYERS.length)}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#484f58] block">Avg POT</span>
              <span className="text-sm font-bold text-lime-400">{Math.round(YOUTH_PLAYERS.reduce((sum, p) => sum + p.potential, 0) / YOUTH_PLAYERS.length)}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#484f58] block">Wonderkids</span>
              <span className="text-sm font-bold text-amber-400">{YOUTH_PLAYERS.filter(p => p.potential >= 87).length}</span>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════ TABS ══════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] h-10 p-1 overflow-x-auto">
            <TabsTrigger value="squad" className="flex-1 text-[10px] sm:text-xs">Squad</TabsTrigger>
            <TabsTrigger value="training" className="flex-1 text-[10px] sm:text-xs">Training</TabsTrigger>
            <TabsTrigger value="development" className="flex-1 text-[10px] sm:text-xs">Dev</TabsTrigger>
            <TabsTrigger value="scouting" className="flex-1 text-[10px] sm:text-xs">Scouting</TabsTrigger>
          </TabsList>

          {/* ══════════════════ TAB 1: YOUTH SQUAD OVERVIEW ══════════════════ */}
          <TabsContent value="squad" className="mt-3">
            {youthSquadOverviewTab()}
          </TabsContent>

          {/* ══════════════════ TAB 2: TRAINING PROGRAMS ══════════════════ */}
          <TabsContent value="training" className="mt-3">
            {trainingProgramsTab()}
          </TabsContent>

          {/* ══════════════════ TAB 3: PLAYER DEVELOPMENT ══════════════════ */}
          <TabsContent value="development" className="mt-3">
            {playerDevelopmentTab()}
          </TabsContent>

          {/* ══════════════════ TAB 4: SCOUTING & RECRUITMENT ══════════════════ */}
          <TabsContent value="scouting" className="mt-3">
            {scoutingRecruitmentTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
