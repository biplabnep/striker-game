'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, BarChart3, TrendingUp, Zap, Target, Shield, Eye, Brain,
  Radio, Cpu, ArrowRight, ChevronRight, Clock, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// SVG: Match Momentum Gauge
// ============================================================
function MomentumGauge({ value }: { value: number }) {
  const r = 38;
  const cx = 50;
  const cy = 50;
  const startAngle = Math.PI;
  const endAngle = startAngle + (value / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = value > 50 ? 1 : 0;
  const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  const color = value >= 60 ? '#CCFF00' : value >= 35 ? '#FF5500' : '#ff3333';
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#222222" strokeWidth={6} strokeLinecap="round" />
      <motion.path d={pathD} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[14px] font-bold" fill={color} fontFamily="monospace">{value}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[6px]" fill="#666666" fontFamily="monospace">MOMENTUM</text>
    </svg>
  );
}

// ============================================================
// SVG: Event Type Distribution Donut
// ============================================================
function EventTypeDonut() {
  const RAW = [
    { label: 'Goals', count: 18, color: '#CCFF00' },
    { label: 'Shots', count: 35, color: '#FF5500' },
    { label: 'Fouls', count: 22, color: '#ff3333' },
    { label: 'Saves', count: 15, color: '#00E5FF' },
    { label: 'Cards', count: 10, color: '#666666' },
  ];
  const arcs = RAW.reduce<{ seg: typeof RAW[0]; startPct: number; endPct: number; path: string }[]>((acc, seg, i) => {
    const total = RAW.reduce((s, d) => s + d.count, 0);
    const startPct = i === 0 ? 0 : acc[i - 1].endPct;
    const endPct = startPct + (seg.count / total);
    const startAngle = startPct * 2 * Math.PI - Math.PI / 2;
    const endAngle = endPct * 2 * Math.PI - Math.PI / 2;
    const cx = 50; const cy = 50; const r = 35;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    acc.push({ seg, startPct, endPct, path });
    return acc;
  }, []);
  return (
    <svg viewBox="0 0 100 100" className="w-full h-36">
      {arcs.map((arc, i) => (
        <motion.path key={i} d={arc.path} fill={arc.seg.color} opacity={0.8} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: i * 0.08 }} />
      ))}
      <circle cx={50} cy={50} r={22} fill="#000000" />
      <text x={50} y={48} textAnchor="middle" className="text-[7px]" fill="#CCFF00" fontFamily="monospace" fontWeight="bold">5 TYPES</text>
      <text x={50} y={57} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">EVENTS</text>
    </svg>
  );
}

// ============================================================
// SVG: Timeline Scatter
// ============================================================
function TimelineScatter() {
  const events = [
    { time: 5, impact: 40, type: 'shot' }, { time: 12, impact: 80, type: 'goal' },
    { time: 22, impact: 30, type: 'foul' }, { time: 31, impact: 70, type: 'shot' },
    { time: 38, impact: 90, type: 'goal' }, { time: 45, impact: 25, type: 'foul' },
    { time: 55, impact: 60, type: 'shot' }, { time: 63, impact: 85, type: 'goal' },
    { time: 72, impact: 35, type: 'save' }, { time: 78, impact: 50, type: 'shot' },
    { time: 85, impact: 75, type: 'goal' }, { time: 90, impact: 45, type: 'foul' },
  ];
  const colorMap: Record<string, string> = { goal: '#CCFF00', shot: '#FF5500', foul: '#ff3333', save: '#00E5FF' };
  const toX = (t: number) => 8 + (t / 95) * 84;
  const toY = (imp: number) => 78 - (imp / 100) * 68;
  return (
    <svg viewBox="0 0 100 85" className="w-full h-28">
      <line x1={8} y1={78} x2={92} y2={78} stroke="#222222" strokeWidth={0.5} />
      {[0, 30, 60, 90].map(m => (
        <g key={m}>
          <line x1={toX(m)} y1={10} x2={toX(m)} y2={78} stroke="#1a1a1a" strokeWidth={0.3} />
          <text x={toX(m)} y={84} textAnchor="middle" className="text-[4px]" fill="#666666" fontFamily="monospace">{m}&apos;</text>
        </g>
      ))}
      {events.map((e, i) => (
        <motion.circle key={i} cx={toX(e.time)} cy={toY(e.impact)} r={2.5} fill={colorMap[e.type] ?? '#666666'} initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: i * 0.05 }} />
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Performance Hex Radar
// ============================================================
function PerformanceRadar() {
  const axes = ['Speed', 'Strength', 'Technique', 'Tactical', 'Stamina', 'Mental'];
  const values = [78, 65, 82, 70, 74, 68];
  const cx = 50; const cy = 50; const r = 38;
  const points = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    const val = values[i] / 100;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
  });
  const gridLines = [0.25, 0.5, 0.75, 1].map(scale =>
    axes.map((_, i) => {
      const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
      return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
    }).join(' ')
  );
  const dataPath = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      {gridLines.map((gl, i) => <polygon key={i} points={gl} fill="none" stroke="#222222" strokeWidth={0.3} />)}
      {axes.map((a, i) => {
        const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <g key={a}>
            <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#222222" strokeWidth={0.3} />
            <text x={cx + (r + 8) * Math.cos(angle)} y={cy + (r + 8) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="text-[4px]" fill="#666666" fontFamily="monospace">{a}</text>
          </g>
        );
      })}
      <motion.polygon points={dataPath} fill="#CCFF00" fillOpacity={0.12} stroke="#CCFF00" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#CCFF00" />)}
    </svg>
  );
}

// ============================================================
// SVG: Stat Comparison Bars (1st vs 2nd half)
// ============================================================
function StatComparisonBars() {
  const stats = [
    { label: 'Passes', first: 72, second: 65 },
    { label: 'Shots', first: 8, second: 5 },
    { label: 'Duels', first: 45, second: 38 },
    { label: 'Tackles', first: 18, second: 22 },
    { label: 'Chances', first: 6, second: 4 },
  ];
  return (
    <svg viewBox="0 0 100 60" className="w-full h-32">
      {stats.map((s, i) => {
        const y = 4 + i * 11;
        const maxVal = 100;
        return (
          <g key={i}>
            <text x={2} y={y + 3} className="text-[3.5px]" fill="#666666" fontFamily="monospace">{s.label}</text>
            <rect x={22} y={y} width={Math.max(1, (s.first / maxVal) * 35)} height={3.5} fill="#FF5500" rx={0.5} opacity={0.8} />
            <rect x={60} y={y} width={Math.max(1, (s.second / maxVal) * 35)} height={3.5} fill="#00E5FF" rx={0.5} opacity={0.8} />
            <text x={58} y={y + 3} className="text-[3px]" fill="#FF5500" fontFamily="monospace" textAnchor="end">{s.first}</text>
            <text x={97} y={y + 3} className="text-[3px]" fill="#00E5FF" fontFamily="monospace" textAnchor="end">{s.second}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Intensity Heatmap Grid
// ============================================================
function IntensityHeatmap() {
  const grid = [
    [3, 5, 7, 8, 6], [4, 6, 9, 7, 5], [6, 8, 10, 9, 7],
    [5, 7, 8, 6, 4], [2, 4, 6, 5, 3],
  ];
  const getColor = (v: number) => {
    if (v >= 8) return '#CCFF00';
    if (v >= 6) return '#FF5500';
    if (v >= 4) return '#1a1a1a';
    return '#111111';
  };
  const getOpacity = (v: number) => 0.3 + (v / 10) * 0.7;
  return (
    <svg viewBox="0 0 100 70" className="w-full h-28">
      {grid.map((row, ri) => row.map((val, ci) => (
        <rect key={`${ri}-${ci}`} x={5 + ci * 18} y={5 + ri * 13} width={16} height={11} rx={1.5} fill={getColor(val)} opacity={getOpacity(val)} />
      )))}
      <text x={50} y={68} textAnchor="middle" className="text-[4px]" fill="#666666" fontFamily="monospace">PITCH ZONES</text>
    </svg>
  );
}

// ============================================================
// SVG: Sprint Distribution Line
// ============================================================
function SprintLine() {
  const data = [4, 6, 8, 5, 7, 3];
  const labels = ['0-15', '15-30', '30-45', '45-60', '60-75', '75-90'];
  const maxVal = 10;
  const points = data.map((v, i) => ({
    x: 10 + (i / (data.length - 1)) * 80,
    y: 40 - (v / maxVal) * 30,
  }));
  const linePath = points.map(p => `${p.x},${p.y}`).join(' L ');
  const areaPath = `M ${points[0].x},40 L ${linePath} L ${points[points.length - 1].x},40 Z`;
  return (
    <svg viewBox="0 0 100 50" className="w-full h-24">
      <path d={areaPath} fill="#FF5500" fillOpacity={0.1} />
      <motion.path d={`M ${linePath}`} fill="none" stroke="#FF5500" strokeWidth={1.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={1.5} fill="#FF5500" />
          <text x={p.x} y={48} textAnchor="middle" className="text-[3px]" fill="#666666" fontFamily="monospace">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Pressing Intensity Gauge
// ============================================================
function PressingGauge({ value }: { value: number }) {
  const r = 38;
  const cx = 50; const cy = 50;
  const startAngle = Math.PI;
  const endAngle = startAngle + (value / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = value > 50 ? 1 : 0;
  const color = value >= 70 ? '#FF5500' : value >= 40 ? '#CCFF00' : '#00E5FF';
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#222222" strokeWidth={6} strokeLinecap="round" />
      <motion.path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[14px] font-bold" fill={color} fontFamily="monospace">{value}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">PRESSING</text>
    </svg>
  );
}

// ============================================================
// SVG: Pass Network Mini
// ============================================================
function PassNetwork() {
  const nodes = [
    { x: 50, y: 85, label: 'GK' }, { x: 20, y: 65, label: 'LB' },
    { x: 40, y: 60, label: 'CB' }, { x: 60, y: 60, label: 'CB' },
    { x: 80, y: 65, label: 'RB' }, { x: 50, y: 40, label: 'CM' },
  ];
  const connections = [
    { from: 0, to: 2, thickness: 1.5 }, { from: 0, to: 3, thickness: 1 },
    { from: 2, to: 5, thickness: 2 }, { from: 3, to: 5, thickness: 2.5 },
    { from: 1, to: 2, thickness: 1.5 }, { from: 4, to: 3, thickness: 1 },
    { from: 5, to: 1, thickness: 1 }, { from: 5, to: 4, thickness: 1.5 },
  ];
  return (
    <svg viewBox="0 0 100 95" className="w-full h-40">
      <rect x={5} y={5} width={90} height={85} fill="none" stroke="#222222" strokeWidth={0.5} rx={2} />
      <line x1={5} y1={48} x2={95} y2={48} stroke="#1a1a1a" strokeWidth={0.3} />
      <line x1={5} y1={28} x2={95} y2={28} stroke="#1a1a1a" strokeWidth={0.3} />
      {connections.map((c, i) => (
        <line key={i} x1={nodes[c.from].x} y1={nodes[c.from].y} x2={nodes[c.to].x} y2={nodes[c.to].y} stroke="#FF5500" strokeWidth={c.thickness * 0.5} opacity={0.5} />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={4} fill="#0a0a0a" stroke="#CCFF00" strokeWidth={1} />
          <text x={n.x} y={n.y + 1.5} textAnchor="middle" className="text-[3px] font-bold" fill="#CCFF00" fontFamily="monospace">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Zone Control Donut
// ============================================================
function ZoneControlDonut() {
  const RAW = [
    { label: 'Defense', count: 30, color: '#00E5FF' },
    { label: 'Midfield', count: 35, color: '#FF5500' },
    { label: 'Attack', count: 25, color: '#CCFF00' },
    { label: 'Wings', count: 10, color: '#666666' },
  ];
  const arcs = RAW.reduce<{ seg: typeof RAW[0]; startPct: number; endPct: number; path: string }[]>((acc, seg, i) => {
    const total = RAW.reduce((s, d) => s + d.count, 0);
    const startPct = i === 0 ? 0 : acc[i - 1].endPct;
    const endPct = startPct + (seg.count / total);
    const startAngle = startPct * 2 * Math.PI - Math.PI / 2;
    const endAngle = endPct * 2 * Math.PI - Math.PI / 2;
    const cx = 50; const cy = 50; const r = 35;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endPct - startPct > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    acc.push({ seg, startPct, endPct, path });
    return acc;
  }, []);
  return (
    <svg viewBox="0 0 100 100" className="w-full h-36">
      {arcs.map((arc, i) => (
        <motion.path key={i} d={arc.path} fill={arc.seg.color} opacity={0.75} initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: i * 0.1 }} />
      ))}
      <circle cx={50} cy={50} r={22} fill="#000000" />
      <text x={50} y={48} textAnchor="middle" className="text-[6px] font-bold" fill="#00E5FF" fontFamily="monospace">ZONE</text>
      <text x={50} y={57} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">CONTROL</text>
    </svg>
  );
}

// ============================================================
// SVG: Formation Shape Radar
// ============================================================
function FormationRadar() {
  const axes = ['Width', 'Depth', 'Compact', 'Press', 'Transition'];
  const values = [75, 60, 70, 65, 80];
  const cx = 50; const cy = 50; const r = 38;
  const points = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    const val = values[i] / 100;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
  });
  const gridLines = [0.25, 0.5, 0.75, 1].map(scale =>
    axes.map((_, i) => {
      const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
      return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
    }).join(' ')
  );
  const dataPath = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      {gridLines.map((gl, i) => <polygon key={i} points={gl} fill="none" stroke="#222222" strokeWidth={0.3} />)}
      {axes.map((a, i) => {
        const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <g key={a}>
            <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#222222" strokeWidth={0.3} />
            <text x={cx + (r + 8) * Math.cos(angle)} y={cy + (r + 8) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="text-[4px]" fill="#666666" fontFamily="monospace">{a}</text>
          </g>
        );
      })}
      <motion.polygon points={dataPath} fill="#00E5FF" fillOpacity={0.12} stroke="#00E5FF" strokeWidth={1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#00E5FF" />)}
    </svg>
  );
}

// ============================================================
// SVG: Win Probability Gauge
// ============================================================
function WinProbGauge({ value }: { value: number }) {
  const r = 38;
  const cx = 50; const cy = 50;
  const startAngle = Math.PI;
  const endAngle = startAngle + (value / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = value > 50 ? 1 : 0;
  const color = value >= 50 ? '#CCFF00' : '#FF5500';
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#222222" strokeWidth={6} strokeLinecap="round" />
      <motion.path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[14px] font-bold" fill={color} fontFamily="monospace">{value}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">WIN PROB</text>
    </svg>
  );
}

// ============================================================
// SVG: Predicted Score Distribution
// ============================================================
function ScoreDistribution() {
  const scores = [
    { label: '0-0', pct: 8 }, { label: '1-0', pct: 22 }, { label: '0-1', pct: 15 },
    { label: '1-1', pct: 25 }, { label: '2-1', pct: 18 }, { label: '2-0', pct: 12 },
  ];
  const maxPct = 30;
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      {scores.map((s, i) => {
        const x = 8 + i * 15;
        const barH = (s.pct / maxPct) * 35;
        return (
          <g key={i}>
            <rect x={x} y={40 - barH} width={11} height={barH} fill={i % 2 === 0 ? '#CCFF00' : '#FF5500'} opacity={0.7} rx={1} />
            <text x={x + 5.5} y={48} textAnchor="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">{s.label}</text>
            <text x={x + 5.5} y={38 - barH} textAnchor="middle" className="text-[3px] font-bold" fill="#CCFF00" fontFamily="monospace">{s.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Momentum Forecast Line
// ============================================================
function MomentumForecast() {
  const actual = [45, 52, 48, 60, 55, 68, 62, 70];
  const predicted = [70, 65, 58, 50, 45, 42, 40, 38];
  const maxVal = 100;
  const toX = (i: number) => 8 + (i / 7) * 84;
  const toY = (v: number) => 42 - (v / maxVal) * 35;
  const actualPts = actual.map((v, i) => `${toX(i)},${toY(v)}`).join(' L ');
  const predictedPts = predicted.map((v, i) => `${toX(i)},${toY(v)}`).join(' L ');
  return (
    <svg viewBox="0 0 100 50" className="w-full h-24">
      <motion.path d={`M ${actualPts}`} fill="none" stroke="#CCFF00" strokeWidth={1.2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={`M ${predictedPts}`} fill="none" stroke="#00E5FF" strokeWidth={1} strokeLinecap="round" strokeDasharray="3 2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
      <text x={50} y={48} textAnchor="middle" className="text-[4px]" fill="#666666" fontFamily="monospace">ACTUAL → PREDICTED</text>
    </svg>
  );
}

// ============================================================
// SVG: Key Player Impact Scatter
// ============================================================
function PlayerImpactScatter() {
  const players = [
    { name: 'ST', involv: 85, impact: 78 }, { name: 'CAM', involv: 72, impact: 65 },
    { name: 'LW', involv: 68, impact: 55 }, { name: 'CM', involv: 80, impact: 48 },
    { name: 'RB', involv: 55, impact: 35 }, { name: 'CB', involv: 45, impact: 30 },
    { name: 'GK', involv: 30, impact: 42 }, { name: 'RW', involv: 60, impact: 50 },
  ];
  return (
    <svg viewBox="0 0 100 60" className="w-full h-28">
      <line x1={8} y1={55} x2={92} y2={55} stroke="#222222" strokeWidth={0.3} />
      <line x1={8} y1={5} x2={8} y2={55} stroke="#222222" strokeWidth={0.3} />
      <text x={50} y={60} textAnchor="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">INVOLVEMENT → IMPACT</text>
      {players.map((p, i) => {
        const x = 12 + (p.involv / 100) * 76;
        const y = 50 - (p.impact / 100) * 42;
        const color = p.impact >= 60 ? '#CCFF00' : p.impact >= 40 ? '#FF5500' : '#666666';
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={color} opacity={0.8} />
            <text x={x} y={y - 4} textAnchor="middle" className="text-[3px] font-bold" fill={color} fontFamily="monospace">{p.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab Definitions
// ============================================================
const TABS = [
  { id: 'live', label: 'Live Feed', icon: Radio },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'tactical', label: 'Tactical', icon: Shield },
  { id: 'predictive', label: 'Predictive', icon: Brain },
] as const;

type TabId = typeof TABS[number]['id'];

// ============================================================
// Live Match Events Data
// ============================================================
const LIVE_EVENTS = [
  { time: '12:30', type: 'goal', desc: 'Goal! Clinical finish from inside the box', player: 'You', color: '#CCFF00' },
  { time: '18:45', type: 'shot', desc: 'Shot saved — low drive from 20 yards', player: 'You', color: '#FF5500' },
  { time: '23:10', type: 'foul', desc: 'Foul committed — reckless challenge', player: 'Teammate', color: '#ff3333' },
  { time: '31:22', type: 'save', desc: 'Brilliant save from point-blank range', player: 'GK', color: '#00E5FF' },
  { time: '38:55', type: 'card', desc: 'Yellow card — dissent', player: 'Opponent', color: '#ff3333' },
  { time: '44:10', type: 'shot', desc: 'Shot blocked — powerful effort', player: 'You', color: '#FF5500' },
];

// ============================================================
// Performance Stats Data
// ============================================================
const PERF_STATS = [
  { label: 'DISTANCE', value: '9.8', unit: 'km', delta: '+0.3' },
  { label: 'PASSES', value: '42', unit: '', delta: '+5' },
  { label: 'SHOTS', value: '4', unit: '', delta: '+1' },
  { label: 'DUELS WON', value: '67', unit: '%', delta: '+8%' },
  { label: 'TOUCHES', value: '68', unit: '', delta: '+12' },
  { label: 'SPRINTS', value: '18', unit: '', delta: '-2' },
];

// ============================================================
// Main Component
// ============================================================
export default function MatchDataStreamEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const [isLive, setIsLive] = useState(true);

  if (!gameState) return <></>;

  const player = gameState.player;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#FF5500]" />
          <h2 className="text-lg font-bold font-grotesk text-text-bright">Match Data Stream</h2>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono font-semibold transition-all ${
            isLive ? 'border-[#FF5500] text-[#FF5500] bg-[#FF5500]/10' : 'border-[#222222] text-[#666666] bg-[#0a0a0a]'
          }`}
        >
          {isLive ? <><span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />LIVE</> : <><Pause className="h-3 w-3" />PAUSED</>}
        </button>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#222222] rounded-lg p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
                activeTab === tab.id ? 'bg-[#FF5500] text-[#000000]' : 'text-[#666666] hover:text-[#999999]'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Live Status Bar */}
            <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">Live Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-[#666666]" />
                  <span className="text-sm font-mono font-bold text-[#CCFF00]">45:22</span>
                </div>
              </div>
            </div>

            {/* Momentum Gauge */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Match Momentum</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <MomentumGauge value={67} />
              </CardContent>
            </Card>

            {/* Event Feed */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Event Stream</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2 space-y-1.5">
                {LIVE_EVENTS.map((evt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-md bg-[#111111] border border-[#1a1a1a]"
                  >
                    <div className="w-1 h-full min-h-[24px] rounded-full" style={{ backgroundColor: evt.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-[#CCFF00]">{evt.time}</span>
                        <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: evt.color }}>{evt.type}</span>
                      </div>
                      <p className="text-[10px] text-[#999999] mt-0.5">{evt.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Event Donut & Timeline Scatter */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="web3-card">
                <CardContent className="p-2">
                  <EventTypeDonut />
                </CardContent>
              </Card>
              <Card className="web3-card">
                <CardContent className="p-2">
                  <TimelineScatter />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div key="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Performance Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PERF_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-2 hover:border-[#FF5500] transition-colors"
                >
                  <div className="web3-label">{stat.label}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="web3-stat-value text-lg">{stat.value}</span>
                    <span className="text-[8px] text-[#666666] font-mono">{stat.unit}</span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold ${stat.delta.startsWith('+') ? 'text-[#CCFF00]' : 'text-[#ff3333]'}`}>
                    {stat.delta}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Performance Radar */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Performance Matrix</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <PerformanceRadar />
              </CardContent>
            </Card>

            {/* Comparison Bars + Heatmap */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">1H vs 2H</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <StatComparisonBars />
                </CardContent>
              </Card>
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Intensity</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <IntensityHeatmap />
                </CardContent>
              </Card>
            </div>

            {/* Sprint Line */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Sprint Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <SprintLine />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'tactical' && (
          <motion.div key="tactical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Tactical Insights */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Target, title: 'Pressing', value: 'HIGH', color: '#FF5500' },
                { icon: Zap, title: 'Tempo', value: 'FAST', color: '#CCFF00' },
                { icon: Shield, title: 'Line Height', value: 'HIGH', color: '#00E5FF' },
                { icon: Eye, title: 'Width', value: 'WIDE', color: '#FF5500' },
              ].map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 hover:border-[#FF5500] transition-colors"
                  >
                    <Icon className="h-4 w-4 mb-1.5" style={{ color: insight.color }} />
                    <div className="web3-label">{insight.title}</div>
                    <div className="text-sm font-mono font-bold mt-0.5" style={{ color: insight.color }}>{insight.value}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Formation Text Display */}
            <Card className="web3-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="web3-label">Your Formation</span>
                  <span className="web3-label">Opponent</span>
                </div>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold text-[#CCFF00]">4-3-3</div>
                    <div className="text-[8px] text-[#666666] font-mono">ATTACKING</div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#666666]">VS</div>
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold text-[#FF5500]">4-4-2</div>
                    <div className="text-[8px] text-[#666666] font-mono">BALANCED</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pressing Gauge */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Pressing Intensity</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <PressingGauge value={72} />
              </CardContent>
            </Card>

            {/* Pass Network + Zone Control */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Pass Network</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <PassNetwork />
                </CardContent>
              </Card>
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Zone Control</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ZoneControlDonut />
                </CardContent>
              </Card>
            </div>

            {/* Formation Radar */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Formation Shape</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <FormationRadar />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'predictive' && (
          <motion.div key="predictive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Prediction Cards */}
            <div className="space-y-2">
              {[
                { icon: TrendingUp, title: 'Win Probability', value: '62%', confidence: 78, color: '#CCFF00' },
                { icon: Target, title: 'Next Scorer', value: 'YOU', confidence: 45, color: '#FF5500' },
                { icon: Cpu, title: 'Rating Forecast', value: '7.4', confidence: 82, color: '#00E5FF' },
              ].map((pred, i) => {
                const Icon = pred.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 hover:border-[#FF5500] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: pred.color }} />
                        <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">{pred.title}</span>
                      </div>
                      <span className="text-lg font-mono font-bold" style={{ color: pred.color }}>{pred.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-[#666666]">Confidence</span>
                      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: pred.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pred.confidence}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                        />
                      </div>
                      <span className="text-[8px] font-mono font-bold" style={{ color: pred.color }}>{pred.confidence}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Win Probability Gauge */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Win Probability Engine</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <WinProbGauge value={62} />
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Score Predictions</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <ScoreDistribution />
              </CardContent>
            </Card>

            {/* Momentum Forecast */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Momentum Forecast</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <MomentumForecast />
              </CardContent>
            </Card>

            {/* Key Player Impact */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Key Player Impact</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <PlayerImpactScatter />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Quick Nav */}
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#222222] flex items-center justify-center">
              <span className="text-sm font-mono font-bold text-[#CCFF00]">{player.overall}</span>
            </div>
            <div>
              <div className="text-xs font-grotesk font-semibold text-text-bright">{player.name}</div>
              <div className="text-[9px] font-mono text-[#666666]">{player.position} • {gameState.currentClub.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="text-[9px] font-mono bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              FORM {player.form.toFixed(1)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
