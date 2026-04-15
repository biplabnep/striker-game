'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid, Shield, Swords, Target, Zap, ChevronRight,
  ArrowRight, Cpu, Sliders, Move, Play, Users, Settings, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// SVG: Formation Compatibility Radar
// ============================================================
function FormationRadar({ values }: { values: number[] }) {
  const axes = ['Attack', 'Defense', 'Midfield', 'Width', 'Flexibility'];
  const cx = 50; const cy = 50; const r = 38;
  const points = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    const val = (values[i] ?? 50) / 100;
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
// SVG: Position Coverage Donut
// ============================================================
function PositionCoverageDonut() {
  const RAW = [
    { label: 'Forward', count: 25, color: '#CCFF00' },
    { label: 'Midfield', count: 35, color: '#FF5500' },
    { label: 'Defense', count: 25, color: '#00E5FF' },
    { label: 'GK', count: 5, color: '#666666' },
    { label: 'Wing', count: 10, color: '#ff3333' },
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
        <motion.path key={i} d={arc.path} fill={arc.seg.color} opacity={0.75} initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: i * 0.08 }} />
      ))}
      <circle cx={50} cy={50} r={22} fill="#000000" />
      <text x={50} y={47} textAnchor="middle" className="text-[6px] font-bold" fill="#CCFF00" fontFamily="monospace">11</text>
      <text x={50} y={55} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">POSITIONS</text>
    </svg>
  );
}

// ============================================================
// SVG: Formation Strength Bars
// ============================================================
function FormationStrengthBars() {
  const attrs = [
    { label: 'Attack', value: 85 }, { label: 'Defense', value: 65 },
    { label: 'Midfield', value: 78 }, { label: 'Width', value: 70 },
    { label: 'Flexibility', value: 60 },
  ];
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      {attrs.map((a, i) => {
        const y = 3 + i * 10;
        const barW = (a.value / 100) * 65;
        return (
          <g key={i}>
            <text x={2} y={y + 4} className="text-[3.5px]" fill="#666666" fontFamily="monospace">{a.label.toUpperCase()}</text>
            <rect x={28} y={y} width={65} height={5} fill="#1a1a1a" rx={0.5} />
            <motion.rect x={28} y={y} width={barW} height={5} fill="#FF5500" rx={0.5} opacity={0.85} initial={{ width: 0 }} animate={{ width: barW }} transition={{ duration: 0.5, delay: i * 0.08 }} />
            <text x={96} y={y + 4} className="text-[3px] font-bold" fill="#CCFF00" fontFamily="monospace" textAnchor="end">{a.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Player Position Fit Scatter
// ============================================================
function PositionFitScatter() {
  const players = [
    { pos: 'ST', fit: 92, rating: 85 }, { pos: 'LW', fit: 78, rating: 79 },
    { pos: 'RW', fit: 72, rating: 77 }, { pos: 'CAM', fit: 88, rating: 82 },
    { pos: 'CM', fit: 65, rating: 74 }, { pos: 'CDM', fit: 55, rating: 71 },
    { pos: 'LB', fit: 80, rating: 76 }, { pos: 'CB', fit: 48, rating: 68 },
    { pos: 'RB', fit: 76, rating: 75 }, { pos: 'GK', fit: 45, rating: 72 },
  ];
  const toX = (fit: number) => 10 + (fit / 100) * 80;
  const toY = (rat: number) => 45 - ((rat - 60) / 30) * 38;
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <line x1={10} y1={45} x2={90} y2={45} stroke="#222222" strokeWidth={0.3} />
      <line x1={10} y1={7} x2={10} y2={45} stroke="#222222" strokeWidth={0.3} />
      <text x={50} y={52} textAnchor="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">FORMATION FIT →</text>
      {players.map((p, i) => {
        const x = toX(p.fit); const y = toY(p.rating);
        const color = p.fit >= 75 ? '#CCFF00' : p.fit >= 55 ? '#FF5500' : '#666666';
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2.5} fill={color} opacity={0.8} />
            <text x={x} y={y - 3.5} textAnchor="middle" className="text-[3px] font-bold" fill={color} fontFamily="monospace">{p.pos}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Tactical Advantage Gauge
// ============================================================
function TacticalAdvantageGauge({ value }: { value: number }) {
  const r = 38;
  const cx = 50; const cy = 50;
  const startAngle = Math.PI;
  const endAngle = startAngle + (value / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = value > 50 ? 1 : 0;
  const color = value >= 55 ? '#CCFF00' : value >= 40 ? '#FF5500' : '#ff3333';
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#222222" strokeWidth={6} strokeLinecap="round" />
      <motion.path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[14px] font-bold" fill={color} fontFamily="monospace">{value}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">TACTICAL EDGE</text>
    </svg>
  );
}

// ============================================================
// SVG: Style Comparison Dual Radar
// ============================================================
function StyleComparisonRadar() {
  const axes = ['Possession', 'Press', 'Counter', 'Width', 'Tempo', 'Direct'];
  const teamVals = [80, 65, 55, 75, 70, 45];
  const oppVals = [60, 75, 70, 50, 55, 80];
  const cx = 50; const cy = 50; const r = 38;
  const teamPts = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * (teamVals[i] / 100) * Math.cos(angle), y: cy + r * (teamVals[i] / 100) * Math.sin(angle) };
  });
  const oppPts = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * (oppVals[i] / 100) * Math.cos(angle), y: cy + r * (oppVals[i] / 100) * Math.sin(angle) };
  });
  const gridLines = [0.25, 0.5, 0.75, 1].map(scale =>
    axes.map((_, i) => {
      const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
      return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
    }).join(' ')
  );
  const teamPath = teamPts.map(p => `${p.x},${p.y}`).join(' ');
  const oppPath = oppPts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-44">
      {gridLines.map((gl, i) => <polygon key={i} points={gl} fill="none" stroke="#222222" strokeWidth={0.3} />)}
      {axes.map((a, i) => {
        const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <g key={a}>
            <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#222222" strokeWidth={0.3} />
            <text x={cx + (r + 9) * Math.cos(angle)} y={cy + (r + 9) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">{a}</text>
          </g>
        );
      })}
      <motion.polygon points={oppPath} fill="#00E5FF" fillOpacity={0.08} stroke="#00E5FF" strokeWidth={0.8} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <motion.polygon points={teamPath} fill="#FF5500" fillOpacity={0.08} stroke="#FF5500" strokeWidth={0.8} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
    </svg>
  );
}

// ============================================================
// SVG: Key Matchup Bars
// ============================================================
function KeyMatchupBars() {
  const matchups = [
    { label: 'Midfield', team: 72, opp: 65 },
    { label: 'Wings', team: 68, opp: 78 },
    { label: 'Set Pieces', team: 60, opp: 55 },
    { label: 'Counter', team: 55, opp: 70 },
    { label: 'Press', team: 75, opp: 60 },
  ];
  return (
    <svg viewBox="0 0 100 65" className="w-full h-32">
      {matchups.map((m, i) => {
        const y = 5 + i * 12;
        const teamW = (m.team / 100) * 38;
        const oppW = (m.opp / 100) * 38;
        return (
          <g key={i}>
            <text x={50} y={y + 2} textAnchor="middle" className="text-[3px] font-bold" fill="#666666" fontFamily="monospace">{m.label.toUpperCase()}</text>
            <rect x={2} y={y + 4} width={38} height={4} fill="#1a1a1a" rx={0.5} />
            <motion.rect x={40 - teamW} y={y + 4} width={teamW} height={4} fill="#CCFF00" rx={0.5} opacity={0.8} initial={{ width: 0 }} animate={{ width: teamW }} transition={{ delay: i * 0.08 }} />
            <rect x={60} y={y + 4} width={38} height={4} fill="#1a1a1a" rx={0.5} />
            <motion.rect x={60} y={y + 4} width={oppW} height={4} fill="#FF5500" rx={0.5} opacity={0.8} initial={{ width: 0 }} animate={{ width: oppW }} transition={{ delay: i * 0.08 + 0.1 }} />
            <text x={40 - teamW - 1} y={y + 8} className="text-[3px] font-bold" fill="#CCFF00" fontFamily="monospace" textAnchor="end">{m.team}</text>
            <text x={60 + oppW + 1} y={y + 8} className="text-[3px] font-bold" fill="#FF5500" fontFamily="monospace">{m.opp}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Formation vs Formation Diagram
// ============================================================
function FormationVsDiagram() {
  const teamNodes = [
    { x: 30, y: 85, label: 'GK' }, { x: 15, y: 65, label: 'LB' },
    { x: 25, y: 60, label: 'CB' }, { x: 35, y: 60, label: 'CB' },
    { x: 45, y: 65, label: 'RB' }, { x: 20, y: 42, label: 'CM' },
    { x: 30, y: 38, label: 'CM' }, { x: 40, y: 42, label: 'CM' },
    { x: 18, y: 20, label: 'LW' }, { x: 30, y: 15, label: 'ST' }, { x: 42, y: 20, label: 'RW' },
  ];
  const oppNodes = [
    { x: 70, y: 85, label: 'GK' }, { x: 58, y: 65, label: 'LB' },
    { x: 68, y: 60, label: 'CB' }, { x: 78, y: 60, label: 'CB' },
    { x: 88, y: 65, label: 'RB' }, { x: 63, y: 42, label: 'LM' },
    { x: 73, y: 38, label: 'CM' }, { x: 83, y: 42, label: 'RM' },
    { x: 68, y: 20, label: 'ST' }, { x: 82, y: 20, label: 'ST' },
  ];
  return (
    <svg viewBox="0 0 100 95" className="w-full h-44">
      <rect x={5} y={3} width={43} height={85} fill="none" stroke="#222222" strokeWidth={0.5} rx={2} />
      <rect x={52} y={3} width={43} height={85} fill="none" stroke="#222222" strokeWidth={0.5} rx={2} />
      <line x1={5} y1={45} x2={48} y2={45} stroke="#1a1a1a" strokeWidth={0.3} />
      <line x1={52} y1={45} x2={95} y2={45} stroke="#1a1a1a" strokeWidth={0.3} />
      <text x={27} y={95} textAnchor="middle" className="text-[5px] font-bold" fill="#CCFF00" fontFamily="monospace">4-3-3</text>
      <text x={73} y={95} textAnchor="middle" className="text-[5px] font-bold" fill="#FF5500" fontFamily="monospace">4-4-2</text>
      {teamNodes.map((n, i) => (
        <g key={`t${i}`}>
          <circle cx={n.x} cy={n.y} r={3} fill="#0a0a0a" stroke="#CCFF00" strokeWidth={0.8} />
          <text x={n.x} y={n.y + 1.2} textAnchor="middle" className="text-[2.5px] font-bold" fill="#CCFF00" fontFamily="monospace">{n.label}</text>
        </g>
      ))}
      {oppNodes.map((n, i) => (
        <g key={`o${i}`}>
          <circle cx={n.x} cy={n.y} r={3} fill="#0a0a0a" stroke="#FF5500" strokeWidth={0.8} />
          <text x={n.x} y={n.y + 1.2} textAnchor="middle" className="text-[2.5px] font-bold" fill="#FF5500" fontFamily="monospace">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Set Piece Success Donut
// ============================================================
function SetPieceDonut() {
  const RAW = [
    { label: 'Corners', count: 35, color: '#CCFF00' },
    { label: 'Free Kicks', count: 25, color: '#FF5500' },
    { label: 'Penalties', count: 20, color: '#00E5FF' },
    { label: 'Throw-ins', count: 20, color: '#666666' },
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
      <text x={50} y={47} textAnchor="middle" className="text-[6px] font-bold" fill="#CCFF00" fontFamily="monospace">72%</text>
      <text x={50} y={55} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">SUCCESS</text>
    </svg>
  );
}

// ============================================================
// SVG: Set Piece Variant Bars
// ============================================================
function SetPieceVariantBars() {
  const variants = [
    { label: 'Near Post', value: 82 }, { label: 'Far Post', value: 65 },
    { label: 'Short', value: 45 }, { label: 'Edge Box', value: 38 },
    { label: 'Direct', value: 70 },
  ];
  return (
    <svg viewBox="0 0 100 50" className="w-full h-24">
      {variants.map((v, i) => {
        const y = 3 + i * 9;
        const barW = (v.value / 100) * 60;
        return (
          <g key={i}>
            <text x={2} y={y + 3} className="text-[3px]" fill="#666666" fontFamily="monospace">{v.label.toUpperCase()}</text>
            <rect x={28} y={y} width={60} height={4} fill="#1a1a1a" rx={0.5} />
            <motion.rect x={28} y={y} width={barW} height={4} fill="#00E5FF" rx={0.5} opacity={0.8} initial={{ width: 0 }} animate={{ width: barW }} transition={{ delay: i * 0.08 }} />
            <text x={92} y={y + 3} className="text-[3px] font-bold" fill="#CCFF00" fontFamily="monospace" textAnchor="end">{v.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Delivery Zone Scatter
// ============================================================
function DeliveryZoneScatter() {
  const zones = [
    { x: 25, y: 30, size: 3 }, { x: 35, y: 25, size: 4 },
    { x: 45, y: 20, size: 3.5 }, { x: 55, y: 22, size: 2.5 },
    { x: 65, y: 28, size: 3 }, { x: 40, y: 35, size: 2 },
    { x: 50, y: 15, size: 4.5 }, { x: 30, y: 18, size: 2 },
  ];
  return (
    <svg viewBox="0 0 100 60" className="w-full h-28">
      <rect x={5} y={5} width={90} height={48} fill="none" stroke="#222222" strokeWidth={0.5} rx={1} />
      <line x1={5} y1={29} x2={95} y2={29} stroke="#1a1a1a" strokeWidth={0.3} />
      <rect x={25} y={5} width={50} height={15} fill="none" stroke="#1a1a1a" strokeWidth={0.3} rx={0.5} />
      {zones.map((z, i) => (
        <motion.circle key={i} cx={z.x} cy={z.y} r={z.size} fill="#FF5500" opacity={0.6} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: i * 0.06 }} />
      ))}
      <text x={50} y={58} textAnchor="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">DELIVERY ZONES</text>
    </svg>
  );
}

// ============================================================
// SVG: Conversion Rate Trend
// ============================================================
function ConversionTrend() {
  const data = [22, 28, 25, 32, 30, 35, 28, 38];
  const labels = ['W1', 'W3', 'W5', 'W7', 'W9', 'W11', 'W13', 'W15'];
  const maxVal = 50;
  const points = data.map((v, i) => ({
    x: 8 + (i / (data.length - 1)) * 84,
    y: 40 - (v / maxVal) * 32,
  }));
  const linePath = points.map(p => `${p.x},${p.y}`).join(' L ');
  const areaPath = `M ${points[0].x},40 L ${linePath} L ${points[points.length - 1].x},40 Z`;
  return (
    <svg viewBox="0 0 100 50" className="w-full h-24">
      <path d={areaPath} fill="#CCFF00" fillOpacity={0.08} />
      <motion.path d={`M ${linePath}`} fill="none" stroke="#CCFF00" strokeWidth={1.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={1.5} fill="#CCFF00" />
          <text x={p.x} y={48} textAnchor="middle" className="text-[3px]" fill="#666666" fontFamily="monospace">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Adjustment Impact Gauge
// ============================================================
function AdjustmentGauge({ value }: { value: number }) {
  const r = 38;
  const cx = 50; const cy = 50;
  const startAngle = Math.PI;
  const endAngle = startAngle + (value / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = value > 50 ? 1 : 0;
  const color = value >= 65 ? '#CCFF00' : value >= 40 ? '#FF5500' : '#666666';
  return (
    <svg viewBox="0 0 100 55" className="w-full h-28">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="#222222" strokeWidth={6} strokeLinecap="round" />
      <motion.path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[14px] font-bold" fill={color} fontFamily="monospace">{value}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[5px]" fill="#666666" fontFamily="monospace">IMPACT</text>
    </svg>
  );
}

// ============================================================
// SVG: Pressing Intensity Timeline
// ============================================================
function PressingTimeline() {
  const points = [45, 60, 72, 55, 68, 50, 65, 58];
  const labels = ['0&apos;', '15&apos;', '30&apos;', '45&apos;', '60&apos;', '75&apos;', '90&apos;', 'FT'];
  return (
    <svg viewBox="0 0 100 45" className="w-full h-24">
      <line x1={8} y1={38} x2={92} y2={38} stroke="#222222" strokeWidth={0.3} />
      {points.map((v, i) => {
        const x = 12 + (i / 7) * 76;
        const y = 35 - (v / 100) * 28;
        const color = v >= 65 ? '#FF5500' : v >= 45 ? '#CCFF00' : '#666666';
        return (
          <g key={i}>
            <motion.circle cx={x} cy={y} r={2.5} fill={color} opacity={0.85} initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: i * 0.06 }} />
            <text x={x} y={44} textAnchor="middle" className="text-[3px]" fill="#666666" fontFamily="monospace">{i * 15 || 'FT'}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Formation Flexibility Radar
// ============================================================
function FlexibilityRadar() {
  const axes = ['Adapt', 'Press', 'Counter', 'Control', 'Risk'];
  const values = [75, 68, 55, 72, 42];
  const cx = 50; const cy = 50; const r = 38;
  const points = axes.map((_, i) => {
    const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * (values[i] / 100) * Math.cos(angle), y: cy + r * (values[i] / 100) * Math.sin(angle) };
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
// SVG: Risk vs Reward Scatter
// ============================================================
function RiskRewardScatter() {
  const options = [
    { label: 'High Press', risk: 70, reward: 80 }, { label: 'Counter', risk: 40, reward: 65 },
    { label: 'Wide Play', risk: 50, reward: 55 }, { label: 'Direct', risk: 60, reward: 75 },
    { label: 'Possession', risk: 25, reward: 45 }, { label: 'Long Ball', risk: 65, reward: 50 },
  ];
  const toX = (risk: number) => 10 + (risk / 100) * 80;
  const toY = (rew: number) => 48 - (rew / 100) * 40;
  return (
    <svg viewBox="0 0 100 58" className="w-full h-28">
      <line x1={10} y1={48} x2={90} y2={48} stroke="#222222" strokeWidth={0.3} />
      <line x1={10} y1={8} x2={10} y2={48} stroke="#222222" strokeWidth={0.3} />
      <text x={50} y={56} textAnchor="middle" className="text-[3.5px]" fill="#666666" fontFamily="monospace">RISK → REWARD</text>
      {options.map((o, i) => {
        const x = toX(o.risk); const y = toY(o.reward);
        const color = o.reward >= 65 && o.risk <= 55 ? '#CCFF00' : o.reward >= 60 ? '#FF5500' : '#666666';
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={color} opacity={0.7} />
            <text x={x} y={y - 4} textAnchor="middle" className="text-[3px] font-bold" fill={color} fontFamily="monospace">{o.label}</text>
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
  { id: 'formation', label: 'Formation', icon: LayoutGrid },
  { id: 'matchup', label: 'Matchup', icon: Swords },
  { id: 'setpiece', label: 'Set Pieces', icon: Target },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
] as const;

type TabId = typeof TABS[number]['id'];

// ============================================================
// Formation Data
// ============================================================
const FORMATIONS = [
  { name: '4-3-3', style: 'Attacking', values: [85, 60, 78, 75, 70] },
  { name: '4-4-2', style: 'Balanced', values: [70, 75, 72, 65, 80] },
  { name: '3-5-2', style: 'Versatile', values: [75, 65, 80, 85, 65] },
  { name: '4-2-3-1', style: 'Defensive', values: [60, 85, 68, 55, 75] },
  { name: '3-4-3', style: 'Aggressive', values: [90, 55, 70, 80, 60] },
];

// ============================================================
// Set Piece Types
// ============================================================
const SET_PIECES = [
  { type: 'Corners', success: 72, variants: 5, icon: Target },
  { type: 'Free Kicks', success: 28, variants: 3, icon: Zap },
  { type: 'Penalties', success: 85, variants: 2, icon: Star },
  { type: 'Throw-ins', success: 45, variants: 4, icon: Move },
];

// ============================================================
// In-Game Adjustments
// ============================================================
const ADJUSTMENTS = [
  { label: 'Pressing', value: 72, icon: Shield, color: '#FF5500' },
  { label: 'Tempo', value: 65, icon: Zap, color: '#CCFF00' },
  { label: 'Width', value: 80, icon: LayoutGrid, color: '#00E5FF' },
  { label: 'Line Height', value: 55, icon: Users, color: '#FF5500' },
  { label: 'Sub Timing', value: 48, icon: Settings, color: '#666666' },
];

// ============================================================
// Main Component
// ============================================================
export default function TacticalBoardEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const [activeTab, setActiveTab] = useState<TabId>('formation');
  const [selectedFormation, setSelectedFormation] = useState(0);

  if (!gameState) return <></>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-[#FF5500]" />
          <h2 className="text-lg font-bold font-grotesk text-text-bright">Tactical Board</h2>
        </div>
        <Badge className="text-[9px] font-mono bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
          <Cpu className="h-2.5 w-2.5 mr-0.5" />
          WAR ROOM
        </Badge>
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
        {activeTab === 'formation' && (
          <motion.div key="formation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Formation Cards */}
            <div className="space-y-1.5">
              {FORMATIONS.map((f, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedFormation(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedFormation === i
                      ? 'bg-[#FF5500]/10 border-[#FF5500]'
                      : 'bg-[#0a0a0a] border-[#222222] hover:border-[#FF5500]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono font-bold text-text-bright">{f.name}</span>
                      <span className="ml-2 text-[9px] font-mono uppercase tracking-wider" style={{ color: f.style === 'Attacking' ? '#CCFF00' : f.style === 'Defensive' ? '#00E5FF' : '#FF5500' }}>{f.style}</span>
                    </div>
                    {selectedFormation === i && <ChevronRight className="h-4 w-4 text-[#FF5500]" />}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Formation Radar */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">
                  {FORMATIONS[selectedFormation].name} Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <FormationRadar values={FORMATIONS[selectedFormation].values} />
              </CardContent>
            </Card>

            {/* Position Coverage + Strength Bars */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Coverage</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <PositionCoverageDonut />
                </CardContent>
              </Card>
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Strength</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <FormationStrengthBars />
                </CardContent>
              </Card>
            </div>

            {/* Position Fit Scatter */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Player Position Fit</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <PositionFitScatter />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'matchup' && (
          <motion.div key="matchup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Tactical Advantage Gauge */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Tactical Advantage</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <TacticalAdvantageGauge value={58} />
              </CardContent>
            </Card>

            {/* Key Matchup Areas */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Swords, title: 'Midfield', status: 'Advantage', color: '#CCFF00' },
                { icon: Zap, title: 'Counter', status: 'Disadvantage', color: '#ff3333' },
                { icon: Target, title: 'Set Pieces', status: 'Even', color: '#FF5500' },
                { icon: Shield, title: 'Press', status: 'Advantage', color: '#CCFF00' },
              ].map((area, i) => {
                const Icon = area.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 hover:border-[#FF5500] transition-colors"
                  >
                    <Icon className="h-4 w-4 mb-1" style={{ color: area.color }} />
                    <div className="web3-label">{area.title}</div>
                    <div className="text-xs font-mono font-bold mt-0.5" style={{ color: area.color }}>{area.status}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Style Comparison Radar */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Style Comparison</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <StyleComparisonRadar />
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="flex items-center gap-1"><span className="w-2 h-1 bg-[#FF5500]" /> <span className="text-[8px] font-mono text-[#666666]">YOUR TEAM</span></div>
                  <div className="flex items-center gap-1"><span className="w-2 h-1 bg-[#00E5FF]" /> <span className="text-[8px] font-mono text-[#666666]">OPPONENT</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Key Matchup Bars */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Key Matchups</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <KeyMatchupBars />
              </CardContent>
            </Card>

            {/* Formation vs Formation */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Formation Battle</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <FormationVsDiagram />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'setpiece' && (
          <motion.div key="setpiece" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Set Piece Type Cards */}
            <div className="grid grid-cols-2 gap-2">
              {SET_PIECES.map((sp, i) => {
                const Icon = sp.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 hover:border-[#FF5500] transition-colors"
                  >
                    <Icon className="h-4 w-4 mb-1.5 text-[#FF5500]" />
                    <div className="web3-label">{sp.type}</div>
                    <div className="text-lg font-mono font-bold text-[#CCFF00]">{sp.success}%</div>
                    <div className="text-[8px] font-mono text-[#666666]">{sp.variants} variants</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Success Donut */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Success Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <SetPieceDonut />
              </CardContent>
            </Card>

            {/* Variant Bars */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Corner Variants</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <SetPieceVariantBars />
              </CardContent>
            </Card>

            {/* Delivery Zones + Conversion Trend */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Delivery</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <DeliveryZoneScatter />
                </CardContent>
              </Card>
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[8px] font-mono text-[#666666] uppercase">Conversion</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ConversionTrend />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'adjust' && (
          <motion.div key="adjust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Adjustment Cards */}
            <div className="space-y-2">
              {ADJUSTMENTS.map((adj, i) => {
                const Icon = adj.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 hover:border-[#FF5500] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: adj.color }} />
                        <span className="text-xs font-mono font-semibold text-text-bright">{adj.label}</span>
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color: adj.color }}>{adj.value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: adj.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${adj.value}%` }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Impact Gauge */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Adjustment Impact</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <AdjustmentGauge value={68} />
              </CardContent>
            </Card>

            {/* Pressing Timeline */}
            <Card className="web3-card">
              <CardHeader className="pb-1 pt-2 px-3">
                <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Pressing Changes</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-2">
                <PressingTimeline />
              </CardContent>
            </Card>

            {/* Flexibility Radar + Risk/Reward */}
            <div className="grid grid-cols-1 gap-2">
              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Formation Flexibility</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <FlexibilityRadar />
                </CardContent>
              </Card>

              <Card className="web3-card">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-widest">Risk vs Reward</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <RiskRewardScatter />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
