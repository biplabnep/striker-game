'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { YouthPlayer, YouthCategory, YouthLeagueStanding, PlayerAttributes, Position, CoreAttribute } from '@/lib/game/types';
import { getPotentialRange, getPotentialStars } from '@/lib/game/youthAcademy';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Users, Trophy, TrendingUp, ArrowUp,
  ChevronDown, ChevronRight, Star, Target, Dumbbell,
  Filter, ArrowUpRight, Zap, Shield, Swords, Wind,
  BarChart3, Table, Award, Baby, Crown,
  Building2, UserCheck, Search, Crosshair, Activity,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================
// Helper components and utilities
// ============================================================

const POSITION_GROUPS: Record<string, { positions: Position[]; icon: React.ReactNode; color: string }> = {
  Goalkeeper: { positions: ['GK'], icon: <Shield className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  Defence: { positions: ['CB', 'LB', 'RB'], icon: <Shield className="h-3.5 w-3.5" />, color: 'text-blue-400' },
  Midfield: { positions: ['CDM', 'CM', 'CAM'], icon: <Zap className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
  Attack: { positions: ['LW', 'RW', 'ST'], icon: <Swords className="h-3.5 w-3.5" />, color: 'text-red-400' },
};

const POSITION_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  GK: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400' },
  CB: { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-400' },
  LB: { bg: 'bg-sky-500/20 border-sky-500/40', text: 'text-sky-400' },
  RB: { bg: 'bg-sky-500/20 border-sky-500/40', text: 'text-sky-400' },
  CDM: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400' },
  CM: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400' },
  CAM: { bg: 'bg-teal-500/20 border-teal-500/40', text: 'text-teal-400' },
  LW: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
  RW: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
  ST: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-400' },
  LM: { bg: 'bg-lime-500/20 border-lime-500/40', text: 'text-lime-400' },
  RM: { bg: 'bg-lime-500/20 border-lime-500/40', text: 'text-lime-400' },
  CF: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-400' },
};

const ATTR_LABELS: Record<CoreAttribute, { label: string; short: string; icon: React.ReactNode }> = {
  pace: { label: 'Pace', short: 'PAC', icon: <Wind className="h-3 w-3" /> },
  shooting: { label: 'Shooting', short: 'SHO', icon: <Target className="h-3 w-3" /> },
  passing: { label: 'Passing', short: 'PAS', icon: <TrendingUp className="h-3 w-3" /> },
  dribbling: { label: 'Dribbling', short: 'DRI', icon: <Dumbbell className="h-3 w-3" /> },
  defending: { label: 'Defending', short: 'DEF', icon: <Shield className="h-3 w-3" /> },
  physical: { label: 'Physical', short: 'PHY', icon: <BarChart3 className="h-3 w-3" /> },
};

// Position coordinates for formation mini-diagram (120x80 viewBox)
const PITCH_POSITION_MAP: Record<string, { x: number; y: number }> = {
  GK: { x: 60, y: 70 },
  CB: { x: 30, y: 55 }, CB2: { x: 60, y: 55 }, CB3: { x: 90, y: 55 },
  LB: { x: 12, y: 35 }, RB: { x: 108, y: 35 },
  CDM: { x: 60, y: 40 },
  CM: { x: 40, y: 25 }, CM2: { x: 80, y: 25 },
  CAM: { x: 60, y: 15 },
  LW: { x: 15, y: 10 }, RW: { x: 105, y: 10 },
  ST: { x: 60, y: 5 },
  LM: { x: 20, y: 30 }, RM: { x: 100, y: 30 },
  CF: { x: 60, y: 8 },
};

function getAttrColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 55) return 'bg-lime-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getOverallColor(ovr: number): string {
  if (ovr >= 70) return 'text-emerald-400';
  if (ovr >= 60) return 'text-lime-400';
  if (ovr >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getPotentialBorderColor(pot: number): string {
  if (pot >= 90) return 'border-l-emerald-500';
  if (pot >= 85) return 'border-l-lime-500';
  if (pot >= 80) return 'border-l-amber-400';
  if (pot >= 70) return 'border-l-orange-500';
  return 'border-l-red-500';
}

function getFormColor(form: number): string {
  if (form >= 8) return 'bg-emerald-400';
  if (form >= 6) return 'bg-lime-400';
  if (form >= 4) return 'bg-amber-400';
  return 'bg-red-400';
}

function getPromotionBadge(status: YouthPlayer['promotionStatus']): { label: string; color: string; bg: string } {
  switch (status) {
    case 'ready': return { label: 'Promotion Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    case 'overdue': return { label: 'Overdue', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    default: return { label: 'Developing', color: 'text-[#8b949e]', bg: 'bg-slate-500/15 border-slate-500/30' };
  }
}

function getTrainingFocusLabel(focus: keyof PlayerAttributes | undefined): string {
  if (!focus) return '';
  const labels: Record<string, string> = {
    pace: 'Pace',
    shooting: 'Shooting',
    passing: 'Passing',
    dribbling: 'Dribbling',
    defending: 'Defending',
    physical: 'Physical',
    diving: 'Diving',
    handling: 'Handling',
    positioning: 'Positioning',
    reflexes: 'Reflexes',
  };
  return labels[focus] ?? focus;
}

// ============================================================
// Mini Radar helpers (60×60)
// ============================================================
function buildMiniRadarPoints(
  attrs: PlayerAttributes,
  cx: number,
  cy: number,
  r: number,
  keys: (keyof PlayerAttributes)[],
): string {
  const n = keys.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return keys
    .map((key, i) => {
      const angle = startAngle + i * angleStep;
      const val = (attrs[key] ?? 0) / 100;
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildMiniRadarPotential(
  player: YouthPlayer,
  cx: number,
  cy: number,
  r: number,
  keys: (keyof PlayerAttributes)[],
): string {
  const n = keys.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  const gap = Math.max(0, Math.floor((player.potential - player.overall) / n));
  return keys
    .map((key, i) => {
      const angle = startAngle + i * angleStep;
      const val = Math.min(1, ((player.attributes[key] ?? 0) + gap) / 100);
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

// ============================================================
// Academy Quality Radar (3-axis SVG radar)
// ============================================================
function AcademyQualityRadar({
  facilities,
  coaching,
  recruitment,
}: {
  facilities: number;
  coaching: number;
  recruitment: number;
}) {
  const cx = 60;
  const cy = 58;
  const r = 42;
  const values = [facilities, coaching, recruitment];
  const labels = ['Fac', 'Coach', 'Recruit'];
  const n = 3;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function getAxisPoint(i: number, val: number): { x: number; y: number } {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + r * (val / 100) * Math.cos(angle),
      y: cy + r * (val / 100) * Math.sin(angle),
    };
  }

  const axisEndPoints = values.map((v, i) => getAxisPoint(i, v));

  return (
    <svg width={120} height={116} viewBox="0 0 120 116" className="select-none">
      {/* Grid rings */}
      {[0.33, 0.66, 1.0].map(level => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const angle = startAngle + i * angleStep;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="#30363d"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}
      {/* Axis lines */}
      {axisEndPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#30363d" strokeWidth={0.5} opacity={0.6} />
      ))}
      {/* Data polygon */}
      <polygon
        points={axisEndPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(16, 185, 129, 0.15)"
        stroke="#10b981"
        strokeWidth={1.5}
      />
      {/* Dots + labels */}
      {axisEndPoints.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={3} fill="#10b981" stroke="#064e3b" strokeWidth={0.8} />
          <text
            x={cx + (r + 14) * Math.cos(startAngle + i * angleStep)}
            y={cy + (r + 14) * Math.sin(startAngle + i * angleStep)}
            textAnchor="middle"
            className="fill-[#8b949e]"
            fontSize={8}
            fontWeight={600}
          >
            {labels[i]}
          </text>
          <text
            x={cx + (r + 14) * Math.cos(startAngle + i * angleStep)}
            y={cy + (r + 14) * Math.sin(startAngle + i * angleStep) + 9}
            textAnchor="middle"
            fill="#c9d1d9"
            fontSize={9}
            fontWeight={700}
          >
            {values[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Formation Mini-Diagram
// ============================================================
function FormationMiniDiagram({ players }: { players: YouthPlayer[] }) {
  // Deduplicate by position, take highest-rated for each
  const posMap = new Map<string, YouthPlayer>();
  for (const p of players) {
    const existing = posMap.get(p.position);
    if (!existing || p.overall > existing.overall) posMap.set(p.position, p);
  }

  const dots = Array.from(posMap.entries()).map(([pos, p]) => ({
    pos,
    x: (PITCH_POSITION_MAP[pos]?.x ?? 60),
    y: (PITCH_POSITION_MAP[pos]?.y ?? 40),
    potential: p.potential,
    overall: p.overall,
    color: (POSITION_COLOR_MAP[pos]?.text ?? 'text-slate-400').replace('text-', ''),
  }));

  return (
    <svg width={120} height={80} viewBox="0 0 120 80" className="select-none">
      {/* Pitch outline */}
      <rect x={1} y={1} width={118} height={78} rx={2} fill="none" stroke="#30363d" strokeWidth={1} opacity={0.6} />
      {/* Center line */}
      <line x1={1} y1={40} x2={119} y2={40} stroke="#30363d" strokeWidth={0.5} opacity={0.4} />
      {/* Center circle */}
      <circle cx={60} cy={40} r={8} fill="none" stroke="#30363d" strokeWidth={0.5} opacity={0.3} />
      {/* Penalty areas */}
      <rect x={30} y={60} width={60} height={19} fill="none" stroke="#30363d" strokeWidth={0.5} opacity={0.4} />
      {/* Player dots */}
      {dots.map((d, i) => (
        <g key={`${d.pos}-${i}`}>
          <circle cx={d.x} cy={d.y} r={3} fill={d.color} opacity={0.8} />
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Academy Rating Card
// ============================================================

function AcademyRatingCard({
  facilities,
  coaching,
  recruitment,
  overall,
}: {
  facilities: number;
  coaching: number;
  recruitment: number;
  overall: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-[#c9d1d9]">Academy Rating</span>
        </div>
        <span className={`text-lg font-bold ${getOverallColor(overall)}`}>{overall}<span className="text-xs text-[#8b949e] font-normal">/100</span></span>
      </div>
      <div className="flex items-center justify-center">
        <AcademyQualityRadar facilities={facilities} coaching={coaching} recruitment={recruitment} />
      </div>
    </motion.div>
  );
}

// ============================================================
// Potential Progress Bar with Milestones
// ============================================================
function PotentialProgressBar({ overall, potential }: { overall: number; potential: number }) {
  // Milestone markers at specific OVR thresholds mapped to bar percentage
  const milestones = [
    { ovr: 60, label: 'Youth Ready', color: '#8b949e' },
    { ovr: 70, label: 'U21 Ready', color: '#f59e0b' },
    { ovr: 80, label: 'First Team', color: '#22c55e' },
  ];
  // Map overall/potential to 0–100 range for display
  const minOvr = 30;
  const maxOvr = Math.max(overall, potential, 90);
  const range = maxOvr - minOvr;
  const overallPct = range > 0 ? ((overall - minOvr) / range) * 100 : 0;
  const potentialPct = range > 0 ? ((potential - minOvr) / range) * 100 : 100;
  const barColor = overall >= 80 ? 'bg-emerald-500' : overall >= 70 ? 'bg-lime-500' : overall >= 60 ? 'bg-amber-500' : 'bg-red-400';

  // Triangle indicator point at current OVR
  const triX = `${overallPct}%`;

  return (
    <div className="relative w-full">
      <div className="relative w-full h-3 bg-[#21262d] rounded-lg overflow-hidden">
        {/* Full potential track */}
        <div className="absolute inset-0 bg-[#30363d]/40 rounded-lg" style={{ width: `${potentialPct}%` }} />
        {/* Progress fill up to current OVR */}
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-lg ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${overallPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Milestone markers */}
        {milestones.map((m) => {
          const pct = range > 0 ? ((m.ovr - minOvr) / range) * 100 : 0;
          if (pct < 0 || pct > 100) return null;
          return (
            <div
              key={m.label}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${pct}%` }}
            >
              <div className="w-px h-full bg-[#8b949e]/40" />
            </div>
          );
        })}
      </div>
      {/* Triangle indicator at current OVR */}
      <svg className="absolute -top-1 pointer-events-none" style={{ left: triX, marginLeft: '-4px' }} width="8" height="5" viewBox="0 0 8 5">
        <polygon points="4,0 0,5 8,5" fill={overall >= 80 ? '#22c55e' : overall >= 70 ? '#84cc16' : overall >= 60 ? '#f59e0b' : '#ef4444'} />
      </svg>
      {/* Milestone labels below bar */}
      <div className="relative flex justify-between mt-1 px-0">
        {milestones.map((m) => {
          const pct = range > 0 ? ((m.ovr - minOvr) / range) * 100 : 0;
          if (pct < 0 || pct > 100) return null;
          return (
            <div key={m.label} className="absolute flex flex-col items-center" style={{ left: `${pct}%`, marginLeft: '-20px', width: '40px' }}>
              <span className="text-[6px] text-[#484f58] font-medium whitespace-nowrap">{m.label}</span>
              <span className="text-[6px] text-[#30363d]">({m.ovr})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Mini Potential Radar (64×64, 4-axis: PAC, SHO, PAS, PHY)
// ============================================================
function MiniPotentialRadar({ player }: { player: YouthPlayer }) {
  const radarKeys = ['pace', 'shooting', 'passing', 'physical'] as (keyof PlayerAttributes)[];
  const cx = 32;
  const cy = 32;
  const r = 24;
  const n = 4;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const buildPoints = (attrs: PlayerAttributes, radR: number): string => {
    return radarKeys
      .map((key, i) => {
        const angle = startAngle + i * angleStep;
        const val = (attrs[key] ?? 0) / 100;
        const x = cx + radR * val * Math.cos(angle);
        const y = cy + radR * val * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Estimate potential per attribute
  const gap = Math.max(0, Math.floor((player.potential - player.overall) / n));
  const potentialAttrs = { ...player.attributes };
  radarKeys.forEach((key) => {
    (potentialAttrs as Record<string, number>)[key] = Math.min(100, (player.attributes[key] ?? 0) + gap);
  });

  const axisLabels = ['PAC', 'SHO', 'PAS', 'PHY'];

  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="select-none">
      {/* Grid rings */}
      {[0.33, 0.66, 1.0].map(level => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const angle = startAngle + i * angleStep;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="#30363d"
          strokeWidth={0.3}
          opacity={0.4}
        />
      ))}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="#30363d"
            strokeWidth={0.3}
            opacity={0.3}
          />
        );
      })}
      {/* Potential polygon (dashed overlay) */}
      <polygon
        points={buildPoints(potentialAttrs, r)}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={0.8}
        strokeDasharray="2 2"
        opacity={0.5}
      />
      {/* Current attribute polygon */}
      <polygon
        points={buildPoints(player.attributes, r)}
        fill="rgba(16, 185, 129, 0.15)"
        stroke="#10b981"
        strokeWidth={1}
      />
      {/* Axis labels */}
      {Array.from({ length: n }, (_, i) => {
        const angle = startAngle + i * angleStep;
        const lx = cx + (r + 9) * Math.cos(angle);
        const ly = cy + (r + 9) * Math.sin(angle);
        return (
          <text
            key={i}
            x={lx}
            y={ly + 3}
            textAnchor="middle"
            className="fill-[#484f58]"
            fontSize={6}
            fontWeight={600}
          >
            {axisLabels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Youth Player Card
// ============================================================

function YouthPlayerCard({
  player,
  onPromote,
  onSetFocus,
  expanded,
  onToggle,
}: {
  player: YouthPlayer;
  onPromote: (target: 'u21' | 'first_team') => void;
  onSetFocus: (focus: keyof PlayerAttributes) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const potentialInfo = getPotentialRange(player.potential);
  const promoBadge = getPromotionBadge(player.promotionStatus);
  const posColor = POSITION_COLOR_MAP[player.position] ?? { bg: 'bg-slate-500/20 border-slate-500/40', text: 'text-slate-400' };
  const isWonderkid = player.potential >= 85;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden border-l-2 ${getPotentialBorderColor(player.potential)}`}
    >
      {/* Header row */}
      <div
        className="relative flex items-center gap-2 p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={onToggle}
      >
        {/* Position badge top-left */}
        <div className={`absolute top-2 left-2 text-[10px] font-bold ${posColor.text} ${posColor.bg} border px-1.5 py-0.5 rounded leading-tight z-10`}>
          {player.position}
        </div>

        {/* OVR badge top-right */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`text-sm font-black tabular-nums ${getOverallColor(player.overall)} bg-[#1c2333] border border-[#30363d] px-1.5 py-0.5 rounded-lg leading-tight`}>
            {player.overall}
          </span>
        </div>

        {/* Spacer for top badges */}
        <div className="w-16" />

        {/* Name + Wonderkid badge */}
        <div className="flex-1 min-w-0 ml-0">
          <div className="text-sm font-medium text-white truncate">{player.name}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] ${potentialInfo.color}`}>{potentialInfo.label}</span>
            {isWonderkid && (
              <span className="flex items-center gap-1">
                <motion.span
                  className="inline-block w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                </motion.span>
                <span className="text-[10px] text-amber-400 font-semibold">Wonderkid</span>
              </span>
            )}
          </div>
          {/* Training focus indicator */}
          {player.trainingFocus && (
            <div className="flex items-center gap-1 mt-0.5">
              <Crosshair className="h-2.5 w-2.5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-medium">
                Training: {getTrainingFocusLabel(player.trainingFocus)}
              </span>
            </div>
          )}
        </div>

        {/* Expand chevron — opacity only */}
        <div className="shrink-0 ml-1">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-emerald-400" />
            : <ChevronRight className="h-4 w-4 text-[#484f58]" />
          }
        </div>
      </div>

      {/* Potential milestone progress bar */}
      <div className="px-3 pb-1.5">
        <PotentialProgressBar overall={player.overall} potential={player.potential} />
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] text-[#484f58]">{player.overall} OVR</span>
          <span className="text-[9px] text-[#8b949e] font-medium">{player.potential} POT</span>
        </div>
      </div>

      {/* Season stats mini row — visible in collapsed state */}
      <div className="flex items-center gap-3 px-3 pb-2 text-[10px]">
        <div className="flex items-center gap-0.5">
          <Activity className="h-2.5 w-2.5 text-[#484f58]" />
          <span className="text-[#8b949e]">Apps</span>
          <span className="text-[#c9d1d9] font-medium">{player.seasonStats.appearances}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Target className="h-2.5 w-2.5 text-[#484f58]" />
          <span className="text-[#8b949e]">Goals</span>
          <span className="text-[#c9d1d9] font-medium">{player.seasonStats.goals}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <TrendingUp className="h-2.5 w-2.5 text-[#484f58]" />
          <span className="text-[#8b949e]">Ast</span>
          <span className="text-[#c9d1d9] font-medium">{player.seasonStats.assists}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5 text-[#484f58]" />
          <span className="text-[#8b949e]">Rtg</span>
          <span className="text-[#c9d1d9] font-medium">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</span>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#30363d] space-y-3">
              {/* Mini Radar + Attributes side by side */}
              <div className="flex gap-3">
                {/* Mini Potential Radar */}
                <div className="shrink-0">
                  <div className="text-[9px] text-[#8b949e] mb-1 text-center">Potential Radar</div>
                  <MiniPotentialRadar player={player} />
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[7px] text-emerald-400">■ Current</span>
                    <span className="text-[7px] text-amber-400">--- Potential</span>
                  </div>
                </div>

                {/* Attributes */}
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(player.attributes) as (keyof PlayerAttributes)[]).map((key) => {
                      const rawVal = player.attributes[key];
                      const val = rawVal !== undefined ? Math.round(rawVal) : 0;
                      const attrInfo = ATTR_LABELS[key as CoreAttribute];
                      const isFocus = player.trainingFocus === key;
                      return (
                        <div
                          key={key}
                          className={`relative flex items-center gap-1 p-1 rounded-lg cursor-pointer transition-colors ${
                            isFocus ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#21262d] hover:bg-[#1c2333]'
                          }`}
                          onClick={() => onSetFocus(key)}
                        >
                          <span className="text-[#8b949e]">{attrInfo.icon}</span>
                          <span className="text-[9px] text-[#8b949e] w-5">{attrInfo.short}</span>
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-lg overflow-hidden">
                            <motion.div
                              className={`h-full rounded-lg ${getAttrColor(val)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                          <span className={`text-[10px] font-semibold min-w-[18px] text-right ${isFocus ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-emerald-400" />
                  <span className="text-[#8b949e]">Apps:</span>
                  <span className="text-white font-medium">{player.seasonStats.appearances}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-red-400" />
                  <span className="text-[#8b949e]">Goals:</span>
                  <span className="text-white font-medium">{player.seasonStats.goals}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-[#8b949e]">Assists:</span>
                  <span className="text-white font-medium">{player.seasonStats.assists}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="text-[#8b949e]">Avg:</span>
                  <span className="text-white font-medium">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</span>
                </div>
              </div>

              {/* Fitness & Morale bars */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b949e]">Fitness</span>
                    <span className="text-[10px] text-[#8b949e]">{player.fitness}%</span>
                  </div>
                  <Progress value={player.fitness} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b949e]">Morale</span>
                    <span className="text-[10px] text-[#8b949e]">{player.morale}%</span>
                  </div>
                  <Progress value={player.morale} className="h-1.5" />
                </div>
              </div>

              {/* Potential stars */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e]">Potential:</span>
                <span className="text-sm">{getPotentialStars(player.potential)}</span>
                <span className={`text-[10px] ${potentialInfo.color}`}>({potentialInfo.label})</span>
              </div>

              {/* Training focus hint */}
              <div className="text-[10px] text-[#8b949e] italic">
                Tap an attribute to set training focus
              </div>

              {/* Right side info */}
              <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                {/* Age + Category chip */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#8b949e]">{player.age}y</span>
                  <span className={`text-[9px] font-semibold px-1 py-px rounded ${
                    player.category === 'u18'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  }`}>
                    {player.category === 'u18' ? 'U18' : 'U21'}
                  </span>
                </div>

                {/* Form indicator */}
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-sm ${getFormColor(player.form)}`} />
                  <span className="text-[10px] text-[#8b949e]">{player.form}/10</span>
                </div>

                {/* Status badge */}
                <div className={`text-[9px] font-medium px-1.5 py-px rounded border ${promoBadge.bg} ${promoBadge.color}`}>
                  {promoBadge.label}
                </div>
              </div>

              {/* Promotion buttons */}
              <div className="flex gap-2">
                {player.category === 'u18' && player.promotionStatus !== 'developing' && (
                  <button
                    onClick={() => onPromote('u21')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Promote to U21
                  </button>
                )}
                {player.promotionStatus !== 'developing' && (
                  <button
                    onClick={() => onPromote('first_team')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Promote to First Team
                  </button>
                )}
                {player.promotionStatus === 'developing' && (
                  <div className="flex-1 text-center text-[10px] text-[#484f58] py-1.5">
                    Still developing — keep training!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Youth League Table Component (Enhanced)
// ============================================================

function getPositionChangeIndicator(clubId: string, currentPos: number): { symbol: string; color: string } {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) {
    const char = clubId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const val = Math.abs(hash);
  if (val % 3 === 0) return { symbol: '\u25B2', color: 'text-emerald-400' };
  if (val % 3 === 1) return { symbol: '\u25BC', color: 'text-red-400' };
  return { symbol: '\u2014', color: 'text-[#484f58]' };
}

function YouthLeagueTableView({
  standings,
  clubId,
  title,
  emoji,
}: {
  standings: YouthLeagueStanding[];
  clubId: string;
  title: string;
  emoji: string;
}) {
  const sorted = useMemo(() =>
    [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGD = a.goalsFor - a.goalsAgainst;
      const bGD = b.goalsFor - b.goalsAgainst;
      if (bGD !== aGD) return bGD - aGD;
      return b.goalsFor - a.goalsFor;
    }),
    [standings]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#21262d] text-[#8b949e]">
              <th className="py-2 px-1 text-center w-6">#</th>
              <th className="py-2 px-1 text-center w-5"></th>
              <th className="py-2 px-2 text-left">Team</th>
              <th className="py-2 px-1 text-center w-7">P</th>
              <th className="py-2 px-1 text-center w-7">W</th>
              <th className="py-2 px-1 text-center w-7">D</th>
              <th className="py-2 px-1 text-center w-7">L</th>
              <th className="py-2 px-1 text-center w-8">GF</th>
              <th className="py-2 px-1 text-center w-8">GA</th>
              <th className="py-2 px-1 text-center w-10">GD</th>
              <th className="py-2 px-1 text-center w-10 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const isPlayer = team.clubId === clubId;
              const gd = team.goalsFor - team.goalsAgainst;
              const posChange = getPositionChangeIndicator(team.clubId, idx);
              const isTop3 = idx < 3;
              const isFirst = idx === 0;
              const borderColor = idx === 0 ? 'border-l-amber-500' : idx === 1 ? 'border-l-slate-400' : idx === 2 ? 'border-l-orange-600' : 'border-l-transparent';

              return (
                <tr
                  key={team.clubId}
                  className={`border-t border-[#30363d] ${isPlayer ? 'bg-emerald-500/10' : 'hover:bg-[#21262d]'} border-l-2 ${borderColor}`}
                >
                  <td className={`py-1.5 px-1 text-center ${isTop3 ? 'text-white font-bold' : 'text-[#8b949e]'}`}>
                    {idx + 1}
                  </td>
                  <td className={`py-1.5 px-1 text-center text-[10px] ${posChange.color}`}>
                    {posChange.symbol}
                  </td>
                  <td className={`py-1.5 px-2 font-medium ${isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                    {team.clubName}
                  </td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.played}</td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.won}</td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.drawn}</td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.lost}</td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.goalsFor}</td>
                  <td className="py-1.5 px-1 text-center text-[#8b949e]">{team.goalsAgainst}</td>
                  <td className={`py-1.5 px-1 text-center font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                  <td className={`py-1.5 px-1 text-center ${isFirst ? 'text-lg font-black text-white' : 'font-bold text-white'}`}>
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Main Youth Academy Component
// ============================================================

export default function YouthAcademy() {
  const gameState = useGameStore(s => s.gameState);
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer);
  const setYouthTrainingFocus = useGameStore(s => s.setYouthTrainingFocus);
  const generateNewYouthIntake = useGameStore(s => s.generateNewYouthIntake);

  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('squad');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  if (!gameState) return null;

  const { currentClub } = gameState;
  const youthTeams = gameState.youthTeams ?? [];
  const youthLeagueTables = gameState.youthLeagueTables ?? [];
  const youthMatchResults = gameState.youthMatchResults ?? [];
  const u18Team = youthTeams.find(t => t.clubId === currentClub.id && t.category === 'u18');
  const u21Team = youthTeams.find(t => t.clubId === currentClub.id && t.category === 'u21');
  const u18Standings = youthLeagueTables.filter(s => s.category === 'u18');
  const u21Standings = youthLeagueTables.filter(s => s.category === 'u21');

  // Filter players
  const getFilteredPlayers = (players: YouthPlayer[]) => {
    if (positionFilter === 'all') return players;
    const groupPositions = POSITION_GROUPS[positionFilter]?.positions ?? [];
    return players.filter(p => groupPositions.includes(p.position));
  };

  const u18Players = getFilteredPlayers(u18Team?.players ?? []);
  const u21Players = getFilteredPlayers(u21Team?.players ?? []);

  // All youth players for header stats
  const allYouthPlayers = [...(u18Team?.players ?? []), ...(u21Team?.players ?? [])];

  // Stats summary
  const readyCount = allYouthPlayers.filter(p => p.promotionStatus === 'ready').length;
  const overdueCount = allYouthPlayers.filter(p => p.promotionStatus === 'overdue').length;
  const wonderkidCount = allYouthPlayers.filter(p => p.traits.includes('wonderkid')).length;
  const totalPlayers = allYouthPlayers.length;
  const avgOverallAll = totalPlayers > 0
    ? Math.round(allYouthPlayers.reduce((s, p) => s + p.overall, 0) / totalPlayers) : 0;
  const avgOverallU18 = u18Team?.players.length ?
    Math.round(u18Team.players.reduce((s, p) => s + p.overall, 0) / u18Team.players.length) : 0;
  const avgOverallU21 = u21Team?.players.length ?
    Math.round(u21Team.players.reduce((s, p) => s + p.overall, 0) / u21Team.players.length) : 0;

  // Scout data
  const scoutCost = currentClub.tier <= 2 ? '£100K' : currentClub.tier <= 3 ? '£75K' : '£50K';
  const maxScoutsPerSeason = 3;
  const playersJoinedThisSeason = allYouthPlayers.filter(p => p.joinedSeason === gameState.currentSeason).length;
  const scoutsRemaining = Math.max(0, maxScoutsPerSeason - playersJoinedThisSeason);

  const latestIntakePlayers = allYouthPlayers
    .filter(p => p.joinedSeason === gameState.currentSeason)
    .sort((a, b) => b.potential - a.potential);
  const lastScoutSummary = latestIntakePlayers.length > 0
    ? `${latestIntakePlayers.length} scouted — Best: ${latestIntakePlayers[0].name} (${latestIntakePlayers[0].overall} OVR)`
    : 'No scouts used this season';

  const facilitiesRating = Math.round(currentClub.facilities * 0.85 + currentClub.youthDevelopment * 0.15);
  const coachingRating = Math.round(currentClub.youthDevelopment * 0.75 + currentClub.quality * 0.25);
  const recruitmentRating = Math.round(currentClub.youthDevelopment * 0.6 + (currentClub.reputation ?? 50) * 0.4);

  const recentYouthResults = youthMatchResults
    .filter(r => r.homeClubId === currentClub.id || r.awayClubId === currentClub.id)
    .slice(-5)
    .reverse();

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
      {/* Header with Enhanced Badge Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Youth Academy</h1>
            <p className="text-xs text-[#8b949e]">{currentClub.name}</p>
          </div>
        </div>

        {/* Enhanced Badge Row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-1.5">
            <Users className="h-3.5 w-3.5 text-[#c9d1d9]" />
            <span className="text-xs font-semibold text-white">{totalPlayers}</span>
            <span className="text-[10px] text-[#8b949e]">Players</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-lime-400" />
            <span className={`text-xs font-semibold ${getOverallColor(avgOverallAll)}`}>{avgOverallAll}</span>
            <span className="text-[10px] text-[#8b949e]">Avg</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{readyCount}</span>
            <span className="text-[10px] text-emerald-400/70">Ready</span>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-semibold text-amber-400">{overdueCount}</span>
              <span className="text-[10px] text-amber-400/70">Overdue</span>
            </div>
          )}
          {wonderkidCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{wonderkidCount}</span>
              <span className="text-[10px] text-amber-400/70">WK</span>
            </div>
          )}
        </div>

        {/* Average overall per team */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-[#21262d] rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">U18 Avg OVR</div>
              <div className={`text-xs font-semibold ${getOverallColor(avgOverallU18)}`}>{avgOverallU18} <span className="text-[#8b949e] font-normal">({u18Team?.players.length ?? 0})</span></div>
            </div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Crown className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">U21 Avg OVR</div>
              <div className={`text-xs font-semibold ${getOverallColor(avgOverallU21)}`}>{avgOverallU21} <span className="text-[#8b949e] font-normal">({u21Team?.players.length ?? 0})</span></div>
            </div>
          </div>
        </div>

        {/* Youth dev quality bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#8b949e]">Academy Quality</span>
            <span className="text-[10px] text-emerald-400">{currentClub.youthDevelopment}%</span>
          </div>
          <Progress value={currentClub.youthDevelopment} className="h-2" />
        </div>
      </motion.div>

      {/* Enhanced Scout Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Search className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#c9d1d9]">Youth Scouting</div>
              <div className="text-[10px] text-[#8b949e]">Discover new talent for the academy</div>
            </div>
          </div>
          <button
            onClick={generateNewYouthIntake}
            disabled={scoutsRemaining <= 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              scoutsRemaining > 0
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-slate-500/10 border border-slate-500/20 text-[#484f58] cursor-not-allowed'
            }`}
          >
            <Baby className="h-3.5 w-3.5" />
            Scout
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-[#8b949e]">Cost:</span>
            <span className="text-amber-400 font-medium">{scoutCost}</span>
            <span className="text-[#484f58]">/scout</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#8b949e]">Remaining:</span>
            <span className={`font-medium ${scoutsRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {scoutsRemaining}/{maxScoutsPerSeason}
            </span>
          </div>
        </div>
        <div className="bg-[#21262d] rounded-lg px-2.5 py-1.5 text-[10px] text-[#8b949e]">
          <span className="text-[#484f58]">Last result:</span> {lastScoutSummary}
        </div>
      </motion.div>

      {/* Academy Rating Card */}
      <AcademyRatingCard
        facilities={Math.min(100, facilitiesRating)}
        coaching={Math.min(100, coachingRating)}
        recruitment={Math.min(100, recruitmentRating)}
        overall={currentClub.youthDevelopment}
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-[#161b22] border border-[#30363d]">
          <TabsTrigger value="squad" className="flex-1 text-xs">
            <Users className="h-3.5 w-3.5 mr-1" /> Squad
          </TabsTrigger>
          <TabsTrigger value="league" className="flex-1 text-xs">
            <Table className="h-3.5 w-3.5 mr-1" /> League
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1 text-xs">
            <Trophy className="h-3.5 w-3.5 mr-1" /> Results
          </TabsTrigger>
        </TabsList>

        {/* Squad Tab */}
        <TabsContent value="squad" className="space-y-3 mt-3">
          {/* Position filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setPositionFilter('all')}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                positionFilter === 'all' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              All
            </button>
            {Object.entries(POSITION_GROUPS).map(([group, config]) => (
              <button
                key={group}
                onClick={() => setPositionFilter(group)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  positionFilter === group ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {config.icon} {group}
              </button>
            ))}
          </div>

          {/* Formation Mini-Diagram */}
          {allYouthPlayers.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold text-[#8b949e]">Position Distribution</span>
                <span className="text-[9px] text-[#484f58]">{allYouthPlayers.length} players</span>
              </div>
              <div className="flex justify-center">
                <FormationMiniDiagram players={allYouthPlayers} />
              </div>
            </div>
          )}

          {/* U18 Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                U18 Squad
              </Badge>
              <span className="text-[10px] text-[#8b949e]">{u18Players.length} players</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {u18Players
                  .sort((a, b) => b.overall - a.overall)
                  .map(player => (
                    <YouthPlayerCard
                      key={player.id}
                      player={player}
                      onPromote={(target) => promoteYouthPlayer(player.id, target)}
                      onSetFocus={(focus) => setYouthTrainingFocus(player.id, focus)}
                      expanded={expandedPlayer === player.id}
                      onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                    />
                  ))}
              </AnimatePresence>
              {u18Players.length === 0 && (
                <div className="text-center py-6 text-[#484f58] text-xs">
                  No U18 players matching filter
                </div>
              )}
            </div>
          </div>

          {/* U21 Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                U21 Squad
              </Badge>
              <span className="text-[10px] text-[#8b949e]">{u21Players.length} players</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {u21Players
                  .sort((a, b) => b.overall - a.overall)
                  .map(player => (
                    <YouthPlayerCard
                      key={player.id}
                      player={player}
                      onPromote={(target) => promoteYouthPlayer(player.id, target)}
                      onSetFocus={(focus) => setYouthTrainingFocus(player.id, focus)}
                      expanded={expandedPlayer === player.id}
                      onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                    />
                  ))}
              </AnimatePresence>
              {u21Players.length === 0 && (
                <div className="text-center py-6 text-[#484f58] text-xs">
                  No U21 players matching filter
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* League Tab */}
        <TabsContent value="league" className="space-y-4 mt-3">
          {u18Standings.length > 0 && (
            <YouthLeagueTableView
              standings={u18Standings}
              clubId={currentClub.id}
              title="U18 League"
              emoji="🛡"
            />
          )}
          {u21Standings.length > 0 && (
            <YouthLeagueTableView
              standings={u21Standings}
              clubId={currentClub.id}
              title="U21 League"
              emoji="🏆"
            />
          )}
          {(u18Standings.length === 0 && u21Standings.length === 0) && (
            <div className="text-center py-8 text-[#484f58] text-xs">
              No league data available
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-2 mt-3">
          {recentYouthResults.length > 0 ? (
            recentYouthResults.map((result, i) => {
              const isHome = result.homeClubId === currentClub.id;
              const opponentClubId = isHome ? result.awayClubId : result.homeClubId;
              const opponentName = opponentClubId ? `Club ${opponentClubId.slice(-3).toUpperCase()}` : 'Unknown';
              const homeGoals = result.homeScore;
              const awayGoals = result.awayScore;
              const teamGoals = isHome ? homeGoals : awayGoals;
              const oppGoals = isHome ? awayGoals : homeGoals;
              const resultLabel = teamGoals > oppGoals ? 'W' : teamGoals < oppGoals ? 'L' : 'D';
              const resultColor = resultLabel === 'W'
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : resultLabel === 'L'
                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                : 'text-[#8b949e] border-slate-500/30 bg-slate-500/10';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${resultColor}`}>
                        {isHome ? 'H' : 'A'}
                      </span>
                      <span className="text-xs text-[#c9d1d9] font-medium truncate">{opponentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#c9d1d9] tabular-nums">{teamGoals}</span>
                      <span className="text-[#30363d]">-</span>
                      <span className="text-xs font-bold text-[#8b949e] tabular-nums">{oppGoals}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-[#484f58] text-xs">
              No recent results
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
