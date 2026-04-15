'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { getMatchRatingLabel, getOverallColor, formatCurrency } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play, ArrowRight, Clock, Trophy, Star, Crown,
  Target, Shield, Zap, Heart, TrendingUp, Activity,
  ChevronRight, Swords, Flame, Footprints, FastForward,
  SkipForward, Gauge, Radio, BarChart3, Eye, Home
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchEvent, MatchEventType, MatchResult } from '@/lib/game/types';
import PressConference from '@/components/game/PressConference';
import WeatherSystem from '@/components/game/WeatherSystem';
import MatchStatsPopup from '@/components/game/MatchStatsPopup';
import TacticalSetup from '@/components/game/TacticalSetup';

// -----------------------------------------------------------
// Event icon & color mapping
// -----------------------------------------------------------
function getEventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal': return '⚽';
    case 'own_goal': return '⚽';
    case 'assist': return '🅰️';
    case 'yellow_card': return '🟨';
    case 'red_card': return '🟥';
    case 'second_yellow': return '🟨🟥';
    case 'substitution': return '🔄';
    case 'injury': return '🏥';
    case 'chance': return '💫';
    case 'save': return '🧤';
    case 'penalty_won': return '🎯';
    case 'penalty_missed': return '❌';
    case 'corner': return '🚩';
    case 'free_kick': return '📐';
    case 'weather': return '\u{1F324}\uFE0F';
    default: return '📌';
  }
}

function getEventColor(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'text-emerald-400';
    case 'own_goal': return 'text-red-400';
    case 'assist': return 'text-sky-400';
    case 'yellow_card': return 'text-yellow-400';
    case 'red_card': return 'text-red-500';
    case 'second_yellow': return 'text-orange-400';
    case 'substitution': return 'text-cyan-400';
    case 'injury': return 'text-rose-400';
    case 'chance': return 'text-blue-400';
    case 'save': return 'text-amber-300';
    case 'penalty_won': return 'text-emerald-300';
    case 'penalty_missed': return 'text-red-300';
    case 'corner': return 'text-[#8b949e]';
    case 'free_kick': return 'text-[#8b949e]';
    case 'weather': return 'text-amber-400';
    default: return 'text-[#8b949e]';
  }
}

function getEventBg(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'own_goal': return 'bg-red-500/10 border-red-500/30';
    case 'assist': return 'bg-sky-500/10 border-sky-500/30';
    case 'yellow_card': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'red_card': return 'bg-red-500/15 border-red-500/40';
    case 'second_yellow': return 'bg-orange-500/10 border-orange-500/30';
    case 'substitution': return 'bg-cyan-500/10 border-cyan-500/30';
    case 'injury': return 'bg-rose-500/10 border-rose-500/30';
    case 'chance': return 'bg-blue-500/10 border-blue-500/30';
    case 'save': return 'bg-amber-500/10 border-amber-500/30';
    case 'penalty_won': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'penalty_missed': return 'bg-red-500/10 border-red-500/30';
    case 'corner': return 'bg-slate-500/10 border-slate-500/30';
    case 'free_kick': return 'bg-slate-500/10 border-slate-500/30';
    case 'weather': return 'bg-amber-500/10 border-amber-500/30';
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
}

function getEventDotColor(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'bg-emerald-400';
    case 'own_goal': return 'bg-red-400';
    case 'assist': return 'bg-sky-400';
    case 'yellow_card': return 'bg-yellow-400';
    case 'red_card': return 'bg-red-500';
    case 'second_yellow': return 'bg-orange-400';
    case 'substitution': return 'bg-cyan-400';
    case 'injury': return 'bg-rose-400';
    case 'chance': return 'bg-blue-400';
    case 'save': return 'bg-amber-300';
    case 'penalty_won': return 'bg-emerald-300';
    case 'penalty_missed': return 'bg-red-300';
    case 'weather': return 'bg-amber-400';
    default: return 'bg-slate-400';
  }
}

function getEventLabel(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'Goal';
    case 'own_goal': return 'Own Goal';
    case 'assist': return 'Assist';
    case 'yellow_card': return 'Yellow Card';
    case 'red_card': return 'Red Card';
    case 'second_yellow': return '2nd Yellow → Red';
    case 'substitution': return 'Substitution';
    case 'injury': return 'Injury';
    case 'chance': return 'Chance';
    case 'save': return 'Save';
    case 'penalty_won': return 'Penalty Won';
    case 'penalty_missed': return 'Penalty Missed';
    case 'corner': return 'Corner';
    case 'free_kick': return 'Free Kick';
    case 'weather': return 'Weather';
    default: return type;
  }
}

// -----------------------------------------------------------
// Simulated match stats helper
// -----------------------------------------------------------
function simulateMatchStats(homeQuality: number, awayQuality: number, homeScore: number, awayScore: number) {
  const qualityDiff = homeQuality - awayQuality;
  const homePossession = Math.round(50 + qualityDiff * 0.3 + (Math.random() * 10 - 5));
  const homeShots = Math.max(3, Math.round(12 + qualityDiff * 0.15 + homeScore * 2 + (Math.random() * 6 - 3)));
  const awayShots = Math.max(3, Math.round(12 - qualityDiff * 0.15 + awayScore * 2 + (Math.random() * 6 - 3)));
  const homeShotsOnTarget = Math.min(homeShots, Math.max(1, Math.round(homeScore + 1 + Math.random() * 3)));
  const awayShotsOnTarget = Math.min(awayShots, Math.max(1, Math.round(awayScore + 1 + Math.random() * 3)));
  const homeCorners = Math.max(1, Math.round(4 + qualityDiff * 0.1 + (Math.random() * 4 - 2)));
  const awayCorners = Math.max(1, Math.round(4 - qualityDiff * 0.1 + (Math.random() * 4 - 2)));
  const homeFouls = Math.max(5, Math.round(12 - qualityDiff * 0.05 + (Math.random() * 4 - 2)));
  const awayFouls = Math.max(5, Math.round(12 + qualityDiff * 0.05 + (Math.random() * 4 - 2)));
  const homePassAcc = Math.round(78 + qualityDiff * 0.1 + (Math.random() * 6 - 3));
  const awayPassAcc = Math.round(78 - qualityDiff * 0.1 + (Math.random() * 6 - 3));
  const homeTackles = Math.max(5, Math.round(18 + qualityDiff * 0.1 + (Math.random() * 6 - 3)));
  const awayTackles = Math.max(5, Math.round(18 - qualityDiff * 0.1 + (Math.random() * 6 - 3)));
  const homePasses = Math.max(200, Math.round(450 + qualityDiff * 5 + (Math.random() * 60 - 30)));
  const awayPasses = Math.max(200, Math.round(450 - qualityDiff * 5 + (Math.random() * 60 - 30)));

  return {
    homePossession: Math.max(25, Math.min(75, homePossession)),
    awayPossession: 0,
    homeShots,
    awayShots,
    homeShotsOnTarget: Math.min(homeShotsOnTarget, homeShots),
    awayShotsOnTarget: Math.min(awayShotsOnTarget, awayShots),
    homeCorners,
    awayCorners,
    homeFouls,
    awayFouls,
    homePassAcc: Math.min(95, Math.max(60, homePassAcc)),
    awayPassAcc: Math.min(95, Math.max(60, awayPassAcc)),
    homeTackles,
    awayTackles,
    homePasses,
    awayPasses,
  };
}

// -----------------------------------------------------------
// Match grade helper
// -----------------------------------------------------------
function getMatchGrade(rating: number): { grade: string; color: string } {
  if (rating >= 9.0) return { grade: 'A+', color: 'text-emerald-300' };
  if (rating >= 8.0) return { grade: 'A', color: 'text-emerald-400' };
  if (rating >= 7.0) return { grade: 'B', color: 'text-sky-400' };
  if (rating >= 6.0) return { grade: 'C', color: 'text-amber-400' };
  if (rating >= 5.0) return { grade: 'D', color: 'text-orange-400' };
  return { grade: 'F', color: 'text-red-400' };
}

// -----------------------------------------------------------
// Win probability calculator
// -----------------------------------------------------------
function calculateWinProbability(ourQuality: number, theirQuality: number, isHome: boolean): { win: number; draw: number; loss: number } {
  const homeAdvantage = isHome ? 5 : -5;
  const diff = ourQuality + homeAdvantage - theirQuality;
  const winBase = 35 + diff * 0.7;
  const drawBase = 26 - Math.abs(diff) * 0.2;
  const lossBase = 100 - winBase - drawBase;
  return {
    win: Math.max(5, Math.min(85, Math.round(winBase))),
    draw: Math.max(10, Math.min(40, Math.round(drawBase))),
    loss: Math.max(5, Math.min(85, Math.round(lossBase))),
  };
}

// -----------------------------------------------------------
// Deterministic pseudo-random from seed
// -----------------------------------------------------------
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// -----------------------------------------------------------
// Formation layout helper for tactical board
// -----------------------------------------------------------
function getFormationLayout(
  formation: string,
  startY: number,
  endY: number,
  pitchWidth: number
): Array<{ x: number; y: number }> {
  const lines = formation.split('-').map(Number);
  const positions: Array<{ x: number; y: number }> = [];
  positions.push({ x: pitchWidth / 2, y: startY });
  const totalLines = lines.length;
  const lineSpacing = totalLines > 0 ? (endY - startY) / (totalLines + 1) : 0;
  for (let i = 0; i < totalLines; i++) {
    const y = startY + (i + 1) * lineSpacing;
    const count = lines[i];
    const padding = pitchWidth * 0.12;
    const availableWidth = pitchWidth - 2 * padding;
    for (let j = 0; j < count; j++) {
      const x = count === 1 ? pitchWidth / 2 : padding + (j / (count - 1)) * availableWidth;
      positions.push({ x, y });
    }
  }
  return positions;
}

// -----------------------------------------------------------
// Timeline Event Component (used in result screen)
// -----------------------------------------------------------
function TimelineEvent({
  event,
  index,
  isLast,
  isPlayerEvent,
  homeClubName,
  awayClubName,
}: {
  event: MatchEvent;
  index: number;
  isLast: boolean;
  isPlayerEvent: boolean;
  homeClubName: string;
  awayClubName: string;
}) {
  const icon = getEventIcon(event.type);
  const colorClass = getEventColor(event.type);
  const bgClass = getEventBg(event.type);
  const dotColor = getEventDotColor(event.type);
  const label = getEventLabel(event.type);
  const teamLabel = event.team === 'home' ? homeClubName : event.team === 'away' ? awayClubName : '';
  const teamBadge = event.team === 'home' ? 'HOME' : event.team === 'away' ? 'AWAY' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex gap-3 relative"
    >
      <div className="flex flex-col items-center w-10 shrink-0">
        <span className="text-xs font-mono text-[#8b949e] font-bold">{event.minute}&apos;</span>
        <div className="flex-1 flex flex-col items-center mt-1">
          <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-slate-900 shrink-0 z-10`} />
          {!isLast && <div className="w-0.5 flex-1 bg-slate-700/60 mt-0.5" />}
        </div>
      </div>
      <div className={`flex-1 mb-2 ml-1 rounded-lg border px-3 py-2 ${bgClass} ${isPlayerEvent ? 'ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
          {teamBadge && (
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 font-bold ${event.team === 'home' ? 'border-sky-500/40 text-sky-400' : 'border-rose-500/40 text-rose-400'}`}>
              {teamBadge}
            </Badge>
          )}
          {isPlayerEvent && (
            <Badge className="text-[9px] px-1 py-0 h-4 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">
              YOU
            </Badge>
          )}
        </div>
        {(event.playerName || event.detail) && (
          <p className="text-xs text-[#c9d1d9] mt-0.5 leading-snug">
            {event.playerName && <span className="text-[#c9d1d9] font-medium">{event.playerName}</span>}
            {event.playerName && event.detail && <span className="text-[#8b949e]"> — </span>}
            {event.detail && <span className="text-[#8b949e]">{event.detail}</span>}
          </p>
        )}
        {teamLabel && !event.playerName && (
          <p className="text-[10px] text-[#8b949e] mt-0.5">{teamLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Live Event Card (used in simulation screen)
// -----------------------------------------------------------
function LiveEventCard({
  event,
  index,
  isPlayerEvent,
  homeClubName,
  awayClubName,
  playerFirstName,
}: {
  event: MatchEvent;
  index: number;
  isPlayerEvent: boolean;
  homeClubName: string;
  awayClubName: string;
  playerFirstName: string;
}) {
  const icon = getEventIcon(event.type);
  const colorClass = getEventColor(event.type);
  const bgClass = getEventBg(event.type);
  const label = getEventLabel(event.type);
  const isGoal = event.type === 'goal' || event.type === 'own_goal';
  const teamBadge = event.team === 'home' ? 'HOME' : event.team === 'away' ? 'AWAY' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative rounded-lg border px-3 py-2.5 ${bgClass} ${
        isPlayerEvent
          ? 'ring-2 ring-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.2)]'
          : ''
      } ${isGoal ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''}`}
    >
      {/* Minute badge */}
      <div className="flex items-start gap-2.5">
        <div className="shrink-0">
          <span className="text-[10px] font-mono font-bold text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {event.minute}&apos;
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">{icon}</span>
            <span className={`text-xs font-bold ${colorClass}`}>{label}</span>
            {teamBadge && (
              <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 font-bold ${event.team === 'home' ? 'border-sky-500/40 text-sky-400' : 'border-rose-500/40 text-rose-400'}`}>
                {teamBadge}
              </Badge>
            )}
            {isPlayerEvent && (
              <Badge className="text-[8px] px-1.5 py-0 h-4 bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold">
                ⭐ {playerFirstName}
              </Badge>
            )}
          </div>
          {(event.playerName || event.detail) && (
            <p className="text-[11px] text-[#c9d1d9] mt-0.5 leading-snug">
              {event.playerName && <span className="text-[#c9d1d9] font-medium">{event.playerName}</span>}
              {event.playerName && event.detail && <span className="text-[#8b949e]"> — </span>}
              {event.detail && <span className="text-[#8b949e]">{event.detail}</span>}
            </p>
          )}
        </div>
      </div>
      {/* Goal celebration pulse */}
      {isGoal && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none"
        />
      )}
    </motion.div>
  );
}

// -----------------------------------------------------------
// MOTM Badge Component
// -----------------------------------------------------------
function MOTMBadge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
      className="flex flex-col items-center gap-1"
    >
      <motion.div
        animate={{
          filter: [
            'drop-shadow(0 0 4px rgba(251,191,36,0.4))',
            'drop-shadow(0 0 12px rgba(251,191,36,0.7))',
            'drop-shadow(0 0 4px rgba(251,191,36,0.4))',
          ],
        }}
        transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="flex items-center gap-1 bg-amber-500 text-slate-900 px-3 py-1 rounded-md font-bold text-xs tracking-wider">
          <Crown className="w-3.5 h-3.5" />
          MOTM
          <Star className="w-3 h-3 fill-current" />
        </div>
      </motion.div>
      <span className="text-[10px] text-amber-300/80 font-semibold tracking-wide">MAN OF THE MATCH</span>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Speed options
// -----------------------------------------------------------
type SimSpeed = 1 | 2 | 4;
const SPEED_INTERVALS: Record<SimSpeed, number> = {
  1: 150,
  2: 75,
  4: 37,
};

// -----------------------------------------------------------
// SVG Helper Functions (avoid .map().join() in JSX attributes)
// -----------------------------------------------------------
function svgRadarPath(values: number[], cx: number, cy: number, maxR: number): string {
  const n = values.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  const coords = values.map((v, i) => {
    const a = start + i * step;
    const r = (v / 100) * maxR;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') + ' Z';
}

function svgHexGridPaths(cx: number, cy: number, maxR: number, levels: number, sides: number): string[] {
  const step = (2 * Math.PI) / sides;
  const start = -Math.PI / 2;
  const paths: string[] = [];
  for (let l = 1; l <= levels; l++) {
    const r = (l / levels) * maxR;
    const pts = Array.from({ length: sides }, (_, i) => {
      const a = start + i * step;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    paths.push(pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z');
  }
  for (let i = 0; i < sides; i++) {
    const a = start + i * step;
    paths.push(`M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${(cx + maxR * Math.cos(a)).toFixed(1)} ${(cy + maxR * Math.sin(a)).toFixed(1)}`);
  }
  return paths;
}

function svgGaugeArc(cx: number, cy: number, radius: number, pct: number): string {
  const startA = Math.PI;
  const endA = Math.PI - pct * Math.PI;
  const x1 = cx + radius * Math.cos(startA);
  const y1 = cy + radius * Math.sin(startA);
  const x2 = cx + radius * Math.cos(endA);
  const y2 = cy + radius * Math.sin(endA);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${pct > 0.5 ? 1 : 0} 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function svgPieSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

function svgMomentumLine(data: number[], baseY: number, startX: number, stepX: number, scaleY: number): string {
  return data.map((v, i) => {
    const x = startX + i * stepX;
    const y = baseY - v * scaleY;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function svgMomentumArea(data: number[], baseY: number, startX: number, stepX: number, scaleY: number, above: boolean): string {
  if (data.length === 0) return '';
  const pts = data.map((v, i) => {
    const x = startX + i * stepX;
    const val = above ? Math.max(0, v) : Math.min(0, v);
    const y = baseY - val * scaleY;
    return { x, y };
  });
  const lastX = pts[pts.length - 1].x;
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    + ` L ${lastX.toFixed(1)} ${baseY} L ${startX.toFixed(1)} ${baseY} Z`;
}

// -----------------------------------------------------------
// Web3 "Gritty Futurism" SVG Visualization Components
// -----------------------------------------------------------

const W3_FONT = "'Monaspace Neon', 'Space Grotesk', monospace";

function svgDonutArc(cx: number, cy: number, r: number, ir: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const ix1 = cx + ir * Math.cos(endAngle);
  const iy1 = cy + ir * Math.sin(endAngle);
  const ix2 = cx + ir * Math.cos(startAngle);
  const iy2 = cy + ir * Math.sin(startAngle);
  const large = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${ir} ${ir} 0 ${large} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z`;
}

function svgRingArc(cx: number, cy: number, radius: number, pct: number): string {
  const clamped = Math.max(0.001, Math.min(0.999, pct));
  const startA = -Math.PI / 2;
  const endA = startA + clamped * 2 * Math.PI;
  const x1 = cx + radius * Math.cos(startA);
  const y1 = cy + radius * Math.sin(startA);
  const x2 = cx + radius * Math.cos(endA);
  const y2 = cy + radius * Math.sin(endA);
  const large = clamped > 0.5 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// 1. PreMatchReadinessGauge — Semi-circular gauge (0-100) showing player readiness
function PreMatchReadinessGauge({ readiness }: { readiness: number }) {
  const pct = Math.max(0, Math.min(1, readiness / 100));
  const bgArc = svgGaugeArc(150, 170, 100, 1);
  const fillArc = svgGaugeArc(150, 170, 100, pct);
  const tier = pct >= 0.8 ? 'OPTIMAL' : pct >= 0.6 ? 'READY' : pct >= 0.4 ? 'MODERATE' : 'RISK';
  return (
    <div className="bg-[#0a0a0a] border border-[#CCFF00]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Readiness Gauge</p>
      <svg viewBox="0 0 300 200" className="w-full">
        <path d={bgArc} fill="none" stroke="#333333" strokeWidth="12" strokeLinecap="round" />
        <path d={fillArc} fill="none" stroke="#CCFF00" strokeWidth="12" strokeLinecap="round" />
        <text x="150" y="148" fill="#c9d1d9" fontSize="36" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{readiness}</text>
        <text x="150" y="168" fill="#888888" fontSize="10" textAnchor="middle" fontFamily={W3_FONT}>/ 100</text>
        <text x="150" y="195" fill="#CCFF00" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{tier}</text>
      </svg>
    </div>
  );
}

// 2. OpponentAnalysisRadar — 5-axis radar chart (Attack/Defense/Set Piece/Counter/Possession)
function OpponentAnalysisRadar({ values, labels }: { values: number[]; labels: string[] }) {
  const cx = 150;
  const cy = 100;
  const maxR = 65;
  const n = values.length;
  const gridPaths = svgHexGridPaths(cx, cy, maxR, 4, n);
  const radarPath = svgRadarPath(values, cx, cy, maxR);
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return (
    <div className="bg-[#0a0a0a] border border-[#FF5500]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Opponent Analysis</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {gridPaths.map((p, i) => (
          <path key={`og-${i}`} d={p} fill="none" stroke="#333333" strokeWidth={i < 4 ? 0.5 : 0.3} />
        ))}
        <path d={radarPath} fill="#FF5500" fillOpacity="0.15" stroke="#FF5500" strokeWidth="1.5" />
        {labels.map((label, i) => {
          const a = startAngle + i * angleStep;
          const lx = cx + (maxR + 16) * Math.cos(a);
          const ly = cy + (maxR + 16) * Math.sin(a);
          return <text key={`ol-${i}`} x={lx} y={ly + 3} fill="#888888" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{label}</text>;
        })}
        {values.map((v, i) => {
          const a = startAngle + i * angleStep;
          const dx = cx + (v / 100) * maxR * Math.cos(a);
          const dy = cy + (v / 100) * maxR * Math.sin(a);
          return <circle key={`od-${i}`} cx={dx} cy={dy} r="2.5" fill="#FF5500" />;
        })}
      </svg>
    </div>
  );
}

// 3. FormComparisonBars — 5 horizontal bars comparing home vs away team form
function FormComparisonBars({ homeStats, awayStats, labels, homeName, awayName }: {
  homeStats: number[]; awayStats: number[]; labels: string[]; homeName: string; awayName: string;
}) {
  const maxVal = [...homeStats, ...awayStats].reduce((m, v) => Math.max(m, v), 1);
  const barMaxW = 80;
  const barH = 14;
  const gap = 32;
  return (
    <div className="bg-[#0a0a0a] border border-[#00E5FF]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Form Comparison</p>
      <svg viewBox="0 0 300 200" className="w-full">
        <text x="10" y="14" fill="#00E5FF" fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{homeName}</text>
        <text x="170" y="14" fill="#FF5500" fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{awayName}</text>
        {labels.map((label, i) => {
          const y = 26 + i * gap;
          const hW = Math.max(3, (homeStats[i] / maxVal) * barMaxW);
          const aW = Math.max(3, (awayStats[i] / maxVal) * barMaxW);
          return (
            <g key={`fb-${i}`}>
              <text x="2" y={y + 10} fill="#888888" fontSize="7" fontFamily={W3_FONT}>{label}</text>
              <rect key={`fh-${i}`} x="28" y={y} width={hW} height={barH} fill="#00E5FF" fillOpacity="0.25" />
              <text key={`ft-${i}`} x={32 + hW} y={y + 10} fill="#00E5FF" fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{homeStats[i]}</text>
              <rect key={`ah-${i}`} x="150" y={y} width={aW} height={barH} fill="#FF5500" fillOpacity="0.25" />
              <text key={`at-${i}`} x={154 + aW} y={y + 10} fill="#FF5500" fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{awayStats[i]}</text>
            </g>
          );
        })}
        <text x="150" y="192" fill="#666666" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>LAST 5 MATCH FORM</text>
      </svg>
    </div>
  );
}

// 4. MatchExpectationDonut — 4-segment donut showing expected result probabilities via .reduce()
function MatchExpectationDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = 150;
  const cy = 105;
  const r = 60;
  const ir = 32;
  const offset = -Math.PI / 2;
  const arcs = segments.reduce((acc, seg) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].endAngle : offset;
    const angle = total > 0 ? (seg.value / total) * 2 * Math.PI : 0;
    const endAngle = prev + angle;
    acc.push({ ...seg, startAngle: prev, endAngle, midAngle: prev + angle / 2 });
    return acc;
  }, [] as Array<{ label: string; value: number; color: string; startAngle: number; endAngle: number; midAngle: number }>);
  return (
    <div className="bg-[#0a0a0a] border border-[#00E5FF]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Match Expectation</p>
      <svg viewBox="0 0 300 200" className="w-full">
        <circle cx={cx} cy={cy} r={r} fill="#111111" />
        <circle cx={cx} cy={cy} r={ir} fill="#0a0a0a" />
        {arcs.map((arc) => (
          <path key={`da-${arc.label}`} d={svgDonutArc(cx, cy, r, ir, arc.startAngle, arc.endAngle)} fill={arc.color} fillOpacity="0.35" stroke="#0a0a0a" strokeWidth="2" />
        ))}
        <text x={cx} y={cy - 3} fill="#c9d1d9" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{total}%</text>
        <text x={cx} y={cy + 10} fill="#888888" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>PROBABILITY</text>
        {arcs.map((arc) => {
          const lx = cx + (r + 20) * Math.cos(arc.midAngle);
          const ly = cy + (r + 20) * Math.sin(arc.midAngle);
          return <text key={`dl-${arc.label}`} x={lx} y={ly + 3} fill={arc.color} fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{arc.label} {Math.round(arc.value)}%</text>;
        })}
      </svg>
    </div>
  );
}

// 5. HistoricalH2HTimeline — 8-node horizontal timeline showing head-to-head results
function HistoricalH2HTimeline({ results }: { results: Array<{ week: number; homeScore: number; awayScore: number; isPlayerHome: boolean }> }) {
  const n = results.length;
  const startX = 25;
  const endX = 275;
  const stepX = n > 1 ? (endX - startX) / (n - 1) : 0;
  const y = 90;
  return (
    <div className="bg-[#0a0a0a] border border-[#FF5500]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>H2H Timeline</p>
      <svg viewBox="0 0 300 200" className="w-full">
        <line x1={startX - 5} y1={y} x2={endX + 5} y2={y} stroke="#333333" strokeWidth="2" strokeLinecap="round" />
        {results.map((r, i) => {
          const x = startX + i * stepX;
          const pg = r.isPlayerHome ? r.homeScore : r.awayScore;
          const og = r.isPlayerHome ? r.awayScore : r.homeScore;
          const result = pg > og ? 'W' : pg < og ? 'L' : 'D';
          const color = result === 'W' ? '#CCFF00' : result === 'L' ? '#FF5500' : '#888888';
          return (
            <g key={`hn-${i}`}>
              <circle cx={x} cy={y} r="9" fill="#0a0a0a" stroke={color} strokeWidth="2" />
              <text x={x} y={y + 3} fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{result}</text>
              <text x={x} y={y - 16} fill="#c9d1d9" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>{r.homeScore}-{r.awayScore}</text>
              <text x={x} y={y + 24} fill="#888888" fontSize="5" textAnchor="middle" fontFamily={W3_FONT}>Wk{r.week}</text>
            </g>
          );
        })}
        <text x="150" y="140" fill="#666666" fontSize="7" textAnchor="middle" fontFamily={W3_FONT}>HEAD-TO-HEAD HISTORY</text>
      </svg>
    </div>
  );
}

// 6. KeyPlayerMatchupRadar — 5-axis radar comparing your key stats vs direct opponent
function KeyPlayerMatchupRadar({ playerVals, oppVals, labels }: { playerVals: number[]; oppVals: number[]; labels: string[] }) {
  const cx = 150;
  const cy = 100;
  const maxR = 65;
  const n = playerVals.length;
  const gridPaths = svgHexGridPaths(cx, cy, maxR, 4, n);
  const pPath = svgRadarPath(playerVals, cx, cy, maxR);
  const oPath = svgRadarPath(oppVals, cx, cy, maxR);
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  return (
    <div className="bg-[#0a0a0a] border border-[#CCFF00]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Key Player Matchup</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {gridPaths.map((p, i) => (
          <path key={`kg-${i}`} d={p} fill="none" stroke="#333333" strokeWidth={i < 4 ? 0.5 : 0.3} />
        ))}
        <path d={oPath} fill="#FF5500" fillOpacity="0.1" stroke="#FF5500" strokeWidth="1" strokeDasharray="3,2" />
        <path d={pPath} fill="#CCFF00" fillOpacity="0.15" stroke="#CCFF00" strokeWidth="1.5" />
        {labels.map((label, i) => {
          const a = start + i * step;
          const lx = cx + (maxR + 16) * Math.cos(a);
          const ly = cy + (maxR + 16) * Math.sin(a);
          return <text key={`kl-${i}`} x={lx} y={ly + 3} fill="#888888" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{label}</text>;
        })}
        <line x1="210" y1="14" x2="226" y2="14" stroke="#CCFF00" strokeWidth="1.5" />
        <text x="230" y="17" fill="#CCFF00" fontSize="6" fontFamily={W3_FONT}>YOU</text>
        <line x1="254" y1="14" x2="270" y2="14" stroke="#FF5500" strokeWidth="1" strokeDasharray="3,2" />
        <text x="274" y="17" fill="#FF5500" fontSize="6" fontFamily={W3_FONT}>OPP</text>
      </svg>
    </div>
  );
}

// 7. MatchDayWeatherImpact — 5 horizontal bars showing weather impact on match aspects
function MatchDayWeatherImpact({ impacts, labels }: { impacts: number[]; labels: string[] }) {
  const maxVal = Math.abs(impacts.reduce((m, v) => Math.max(m, Math.abs(v)), 1));
  const barMaxW = 140;
  const barH = 14;
  const gap = 30;
  return (
    <div className="bg-[#0a0a0a] border border-[#FF5500]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Weather Impact</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {labels.map((label, i) => {
          const y = 16 + i * gap;
          const w = Math.max(4, (Math.abs(impacts[i]) / maxVal) * barMaxW);
          const color = impacts[i] < 0 ? '#FF5500' : '#CCFF00';
          return (
            <g key={`wi-${i}`}>
              <text x="2" y={y + 10} fill="#888888" fontSize="7" fontFamily={W3_FONT}>{label}</text>
              <rect key={`wb-${i}`} x="70" y={y} width={w} height={barH} fill={color} fillOpacity="0.25" />
              <text key={`wt-${i}`} x={74 + w} y={y + 10} fill={color} fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{impacts[i] > 0 ? '+' : ''}{impacts[i]}%</text>
            </g>
          );
        })}
        <text x="150" y="190" fill="#666666" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>WEATHER EFFECT ON MATCH ASPECTS</text>
      </svg>
    </div>
  );
}

// 8. PositionalBattleArea — 8-point area chart showing positional dominance across pitch zones
function PositionalBattleArea({ values, labels }: { values: number[]; labels: string[] }) {
  const n = values.length;
  const cx = 150;
  const cy = 105;
  const maxR = 70;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  const areaPath = values.reduce((path, v, i) => {
    const a = start + i * step;
    const r = (v / 100) * maxR;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    return path + `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }, '') + 'Z';
  return (
    <div className="bg-[#0a0a0a] border border-[#00E5FF]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Positional Battle</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {Array.from({ length: 4 }, (_, l) => {
          const r = ((l + 1) / 4) * maxR;
          const pts = Array.from({ length: n }, (_, i) => {
            const a = start + i * step;
            return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
          });
          const p = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') + ' Z';
          return <path key={`pg-${l}`} d={p} fill="none" stroke="#333333" strokeWidth="0.5" />;
        })}
        <path d={areaPath} fill="#00E5FF" fillOpacity="0.2" stroke="#00E5FF" strokeWidth="1.5" strokeLinejoin="round" />
        {values.map((v, i) => {
          const a = start + i * step;
          const r = (v / 100) * maxR;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          const lx = cx + (maxR + 18) * Math.cos(a);
          const ly = cy + (maxR + 18) * Math.sin(a);
          return (
            <g key={`pp-${i}`}>
              <circle key={`pd-${i}`} cx={x} cy={y} r="3" fill="#00E5FF" />
              <text key={`pl-${i}`} x={lx} y={ly + 3} fill="#888888" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 9. SetPieceThreatRing — Circular ring (0-100) measuring set piece threat level for both teams
function SetPieceThreatRing({ homeThreat, awayThreat, homeName, awayName }: {
  homeThreat: number; awayThreat: number; homeName: string; awayName: string;
}) {
  const homePct = Math.max(0.001, Math.min(0.999, homeThreat / 100));
  const awayPct = Math.max(0.001, Math.min(0.999, awayThreat / 100));
  const homeArc = svgRingArc(80, 100, 55, homePct);
  const awayArc = svgRingArc(220, 100, 55, awayPct);
  return (
    <div className="bg-[#0a0a0a] border border-[#CCFF00]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Set Piece Threat</p>
      <svg viewBox="0 0 300 200" className="w-full">
        <circle cx="80" cy="100" r="55" fill="none" stroke="#333333" strokeWidth="8" />
        <path d={homeArc} fill="none" stroke="#CCFF00" strokeWidth="8" strokeLinecap="round" />
        <text x="80" y="97" fill="#c9d1d9" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{homeThreat}</text>
        <text x="80" y="112" fill="#888888" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>/ 100</text>
        <text x="80" y="175" fill="#CCFF00" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{homeName}</text>
        <circle cx="220" cy="100" r="55" fill="none" stroke="#333333" strokeWidth="8" />
        <path d={awayArc} fill="none" stroke="#FF5500" strokeWidth="8" strokeLinecap="round" />
        <text x="220" y="97" fill="#c9d1d9" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{awayThreat}</text>
        <text x="220" y="112" fill="#888888" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>/ 100</text>
        <text x="220" y="175" fill="#FF5500" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily={W3_FONT}>{awayName}</text>
        <text x="150" y="195" fill="#666666" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>SET PIECE THREAT LEVEL</text>
      </svg>
    </div>
  );
}

// 10. SubstitutionReadinessBars — 5 horizontal bars showing bench player readiness levels
function SubstitutionReadinessBars({ players }: { players: { name: string; readiness: number; pos: string }[] }) {
  const barMaxW = 110;
  const barH = 14;
  const gap = 32;
  return (
    <div className="bg-[#0a0a0a] border border-[#FF5500]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Bench Readiness</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {players.map((p, i) => {
          const y = 14 + i * gap;
          const w = Math.max(4, (p.readiness / 100) * barMaxW);
          const color = p.readiness >= 80 ? '#CCFF00' : p.readiness >= 60 ? '#00E5FF' : p.readiness >= 40 ? '#888888' : '#FF5500';
          return (
            <g key={`sb-${i}`}>
              <text x="2" y={y + 10} fill="#888888" fontSize="7" fontFamily={W3_FONT}>{p.pos}</text>
              <text x="26" y={y + 10} fill="#c9d1d9" fontSize="7" fontFamily={W3_FONT}>{p.name}</text>
              <rect key={`sr-${i}`} x="90" y={y} width={w} height={barH} fill={color} fillOpacity="0.25" />
              <text key={`sv-${i}`} x={94 + w} y={y + 10} fill={color} fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{p.readiness}%</text>
            </g>
          );
        })}
        <text x="150" y="190" fill="#666666" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>SUBSTITUTION READINESS INDEX</text>
      </svg>
    </div>
  );
}

// 11. PostMatchRatingDistribution — 5 horizontal bars showing rating distribution via .reduce()
function PostMatchRatingDistribution({ ratings }: { ratings: number[] }) {
  const bins = ratings.reduce((acc, r) => {
    if (r >= 9) acc[0]++;
    else if (r >= 8) acc[1]++;
    else if (r >= 7) acc[2]++;
    else if (r >= 6) acc[3]++;
    else acc[4]++;
    return acc;
  }, [0, 0, 0, 0, 0] as number[]);
  const labels = ['9+', '8-9', '7-8', '6-7', '<6'];
  const colors = ['#CCFF00', '#00E5FF', '#FF5500', '#888888', '#666666'];
  const maxVal = bins.reduce((m, v) => Math.max(m, v), 1);
  const barMaxW = 120;
  const barH = 16;
  const gap = 30;
  return (
    <div className="bg-[#0a0a0a] border border-[#00E5FF]/20 p-3">
      <p className="text-[9px] text-[#888888] font-semibold mb-2 uppercase tracking-wider" style={{ fontFamily: W3_FONT }}>Rating Distribution</p>
      <svg viewBox="0 0 300 200" className="w-full">
        {labels.map((label, i) => {
          const y = 14 + i * gap;
          const w = Math.max(4, (bins[i] / maxVal) * barMaxW);
          return (
            <g key={`rd-${i}`}>
              <text x="2" y={y + 10} fill="#888888" fontSize="7" fontFamily={W3_FONT}>{label}</text>
              <rect key={`rb-${i}`} x="30" y={y} width={w} height={barH} fill={colors[i]} fillOpacity="0.25" />
              <text key={`rv-${i}`} x={34 + w} y={y + 10} fill={colors[i]} fontSize="7" fontWeight="bold" fontFamily={W3_FONT}>{bins[i]} players</text>
            </g>
          );
        })}
        <text x="150" y="190" fill="#666666" fontSize="6" textAnchor="middle" fontFamily={W3_FONT}>SQUAD RATING BREAKDOWN</text>
      </svg>
    </div>
  );
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function MatchDay() {
  const gameState = useGameStore(state => state.gameState);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const playNextMatch = useGameStore(state => state.playNextMatch);
  const setScreen = useGameStore(state => state.setScreen);

  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<MatchResult | null>(gameState?.recentResults[0] || null);
  const [showPressConference, setShowPressConference] = useState(false);
  const [pressConferenceType, setPressConferenceType] = useState<'pre-match' | 'post-match'>('pre-match');
  const [showStats, setShowStats] = useState(false);
  const [showTacticalSetup, setShowTacticalSetup] = useState(false);

  // Simulation states
  const [showSimulation, setShowSimulation] = useState(false);
  const [simMinute, setSimMinute] = useState(0);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simComplete, setSimComplete] = useState(false);
  const [showFullTime, setShowFullTime] = useState(false);
  const eventFeedRef = useRef<HTMLDivElement>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Memoize match stats for the result view (stable across re-renders)
  const matchStats = useMemo(() => {
    if (!lastResult) return null;
    return simulateMatchStats(
      lastResult.homeClub.squadQuality,
      lastResult.awayClub.squadQuality,
      lastResult.homeScore,
      lastResult.awayScore
    );
  }, [lastResult]);

  // Compute significant events from the result
  const significantEvents = useMemo(() => {
    if (!lastResult) return [];
    return lastResult.events
      .filter(e => ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'chance', 'save', 'penalty_won', 'penalty_missed', 'weather'].includes(e.type))
      .sort((a, b) => a.minute - b.minute);
  }, [lastResult]);

  // Events visible in simulation (up to current minute)
  const visibleSimEvents = useMemo(() => {
    return significantEvents.filter(e => e.minute <= simMinute);
  }, [significantEvents, simMinute]);

  // Track live score from visible events
  const liveScore = useMemo(() => {
    let home = 0;
    let away = 0;
    for (const e of visibleSimEvents) {
      if (e.type === 'goal') {
        if (e.team === 'home') home++;
        else if (e.team === 'away') away++;
      } else if (e.type === 'own_goal') {
        // Own goal counts for the other team
        if (e.team === 'home') away++;
        else if (e.team === 'away') home++;
      }
    }
    return { home, away };
  }, [visibleSimEvents]);

  // Momentum data for the match tracker (computed once from result)
  const momentumData = useMemo(() => {
    if (!lastResult) return [];
    const data: number[] = [];
    let runningMomentum = 0;
    for (let min = 0; min <= 90; min++) {
      for (const e of significantEvents) {
        if (e.minute === min) {
          if (e.type === 'goal' && e.team === 'home') runningMomentum += 15;
          if (e.type === 'goal' && e.team === 'away') runningMomentum -= 15;
          if (e.type === 'own_goal' && e.team === 'home') runningMomentum -= 15;
          if (e.type === 'own_goal' && e.team === 'away') runningMomentum += 15;
          if (e.type === 'red_card' && e.team === 'home') runningMomentum -= 18;
          if (e.type === 'red_card' && e.team === 'away') runningMomentum += 18;
          if (e.type === 'second_yellow' && e.team === 'home') runningMomentum -= 18;
          if (e.type === 'second_yellow' && e.team === 'away') runningMomentum += 18;
          if (e.type === 'yellow_card' && e.team === 'home') runningMomentum -= 4;
          if (e.type === 'yellow_card' && e.team === 'away') runningMomentum += 4;
          if (e.type === 'injury' && e.team === 'home') runningMomentum -= 6;
          if (e.type === 'injury' && e.team === 'away') runningMomentum += 6;
        }
      }
      const base = (lastResult.homeClub.squadQuality - lastResult.awayClub.squadQuality) * 0.3 + 8;
      runningMomentum = runningMomentum * 0.92 + base * 0.08;
      const noise = seededRandom(min * 17 + lastResult.week * 31 + lastResult.homeScore * 7 + lastResult.awayScore * 13) * 20 - 10;
      const val = Math.max(-50, Math.min(50, runningMomentum + noise));
      data.push(val);
    }
    return data;
  }, [lastResult, significantEvents]);

  // Half-time score summary
  const halfTimeScore = useMemo(() => {
    if (!lastResult) return null;
    let home = 0;
    let away = 0;
    for (const e of significantEvents) {
      if (e.minute > 45) break;
      if (e.type === 'goal') {
        if (e.team === 'home') home++;
        else if (e.team === 'away') away++;
      } else if (e.type === 'own_goal') {
        if (e.team === 'home') away++;
        else if (e.team === 'away') home++;
      }
    }
    return { home, away };
  }, [lastResult, significantEvents]);

  // Post-match media reaction quotes
  const postMatchQuotes = useMemo(() => {
    if (!lastResult) return [];
    const seed = lastResult.week * 100 + lastResult.homeScore * 10 + lastResult.awayScore * 7;
    const allQuotes: { source: string; text: string }[] = [
      { source: 'Sky Sports', text: 'A commanding performance that showcased their title credentials.' },
      { source: 'BBC Sport', text: 'The tactical battle was fascinating throughout the ninety minutes.' },
      { source: 'The Guardian', text: 'An entertaining encounter with plenty of goalmouth action.' },
      { source: 'ESPN FC', text: 'The midfield dominance was the key difference between the two sides.' },
      { source: 'Goal.com', text: 'A result that could have significant implications for the table.' },
      { source: 'The Athletic', text: 'Both managers will have plenty to discuss after this one.' },
      { source: 'Marca', text: 'The atmosphere inside the stadium was electric from the first whistle.' },
      { source: 'L\'Equipe', text: 'Individual brilliance made the difference in a tightly contested affair.' },
    ];
    const result: typeof allQuotes = [];
    const usedIndices = new Set<number>();
    for (let i = 0; i < 3 && result.length < 3; i++) {
      const idx = Math.floor(seededRandom(seed + i * 7) * allQuotes.length);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        result.push(allQuotes[idx]);
      }
    }
    return result;
  }, [lastResult]);

  // Previous score (for goal flash detection)
  const prevScoreRef = useRef({ home: 0, away: 0 });
  const [goalFlash, setGoalFlash] = useState(false);

  // Auto-scroll event feed
  useEffect(() => {
    if (eventFeedRef.current) {
      eventFeedRef.current.scrollTop = eventFeedRef.current.scrollHeight;
    }
  }, [visibleSimEvents.length]);

  // Goal flash effect
  useEffect(() => {
    if (liveScore.home !== prevScoreRef.current.home || liveScore.away !== prevScoreRef.current.away) {
      prevScoreRef.current = { home: liveScore.home, away: liveScore.away };
      const flashTimer = setTimeout(() => setGoalFlash(true), 0);
      const clearTimer = setTimeout(() => setGoalFlash(false), 800);
      return () => { clearTimeout(flashTimer); clearTimeout(clearTimer); };
    }
  }, [liveScore.home, liveScore.away]);

  // Simulation timer
  useEffect(() => {
    if (!showSimulation || simComplete) return;

    const interval = SPEED_INTERVALS[simSpeed];

    simIntervalRef.current = setInterval(() => {
      setSimMinute(prev => {
        const next = prev + 1;
        if (next >= 90) {
          // Simulation complete
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          setSimComplete(true);
          return 90;
        }
        return next;
      });
    }, interval);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [showSimulation, simSpeed, simComplete]);

  // Show Full Time overlay when simulation completes
  useEffect(() => {
    if (simComplete && !showFullTime) {
      const ftTimer = setTimeout(() => setShowFullTime(true), 0);
      return () => { clearTimeout(ftTimer); };
    }
  }, [simComplete, showFullTime]);

  // Transition from Full Time overlay to result screen
  useEffect(() => {
    if (showFullTime && simComplete) {
      const transitionTimer = setTimeout(() => {
        setShowSimulation(false);
        setShowFullTime(false);
        setShowResult(true);
      }, 2000);
      return () => { clearTimeout(transitionTimer); };
    }
  }, [showFullTime, simComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const handlePlayMatch = () => {
    advanceWeek();
    const latest = useGameStore.getState().gameState?.recentResults[0];
    if (latest) {
      setLastResult(latest);
      prevScoreRef.current = { home: 0, away: 0 };
      setSimMinute(0);
      setSimSpeed(1);
      setSimComplete(false);
      setShowFullTime(false);
      setGoalFlash(false);
      setShowSimulation(true);
    }
  };

  const handleSimulate = () => {
    playNextMatch();
    const latest = useGameStore.getState().gameState?.recentResults[0];
    if (latest) {
      setLastResult(latest);
      setShowResult(true);
    }
  };

  const handleSkipToEnd = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setSimMinute(90);
    setSimComplete(true);
  };

  const cycleSpeed = () => {
    setSimSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1) as SimSpeed);
  };

  // Pre-match analytics data (for Match Preview Analytics section)
  const preMatchAnalytics = useMemo(() => {
    if (!gameState) return null;
    const gs = gameState;
    const club = gs.currentClub;
    const fixture = gs.upcomingFixtures.find(f => !f.played && (f.homeClubId === club.id || f.awayClubId === club.id));
    if (!fixture) return null;
    const opp = getClubById(fixture.homeClubId === club.id ? fixture.awayClubId : fixture.homeClubId);
    if (!opp) return null;
    const home = fixture.homeClubId === club.id;

    // 1. H2H record (real or synthetic)
    const h2hMatches = gs.recentResults.filter(r =>
      (r.homeClub.id === club.id || r.awayClub.id === club.id) &&
      (r.homeClub.id === opp.id || r.awayClub.id === opp.id)
    );
    const h2hW = h2hMatches.filter(r => {
      const mg = r.homeClub.id === club.id ? r.homeScore : r.awayScore;
      const tg = r.homeClub.id === club.id ? r.awayScore : r.homeScore;
      return mg > tg;
    }).length;
    const h2hD = h2hMatches.filter(r => r.homeScore === r.awayScore).length;
    const h2hL = h2hMatches.length - h2hW - h2hD;
    const qd = club.squadQuality - opp.squadQuality;
    const h2h = h2hMatches.length > 0
      ? { wins: h2hW, draws: h2hD, losses: h2hL, total: h2hMatches.length }
      : { wins: Math.max(0, Math.round(3 + qd * 0.15)), draws: 2, losses: Math.max(0, Math.round(3 - qd * 0.15)), total: 0 };

    // 2. Win probability
    const wp = calculateWinProbability(club.squadQuality, opp.squadQuality, home);

    // 3. Radar comparison (synthetic star player stats)
    const hs = [0, 7, 11, 13, 17, 19].map(s => 60 + Math.round(seededRandom(club.squadQuality * s) * 35));
    hs[5] = Math.min(99, club.squadQuality);
    const as_ = [0, 7, 11, 13, 17, 19].map(s => 60 + Math.round(seededRandom(opp.squadQuality * s + 1) * 35));
    as_[5] = Math.min(99, opp.squadQuality);
    const radar = {
      home: { pace: hs[0], shooting: hs[1], passing: hs[2], defending: hs[3], physical: hs[4], overall: hs[5] },
      away: { pace: as_[0], shooting: as_[1], passing: as_[2], defending: as_[3], physical: as_[4], overall: as_[5] },
    };

    // 4. Recent form (5 results, padded with synthetic if needed)
    const getForm = (clubId: string): string[] => {
      const res = gs.recentResults.filter(r => r.homeClub.id === clubId || r.awayClub.id === clubId).slice(0, 5);
      const f = res.map(r => {
        const mg = r.homeClub.id === clubId ? r.homeScore : r.awayScore;
        const tg = r.homeClub.id === clubId ? r.awayScore : r.homeScore;
        return mg > tg ? 'W' : mg < tg ? 'L' : 'D';
      });
      while (f.length < 5) f.push(seededRandom(clubId.length * 100 + clubId.charCodeAt(0) * 10 + f.length) > 0.5 ? 'W' : 'D');
      return f;
    };

    // 5. Match importance (0-100 based on week and reputation gap)
    const imp = Math.min(100, Math.max(20, Math.round(30 + gs.currentWeek * 1.2 + Math.abs(club.reputation - opp.reputation) * 0.4)));

    // 6. Expected goals
    const hXG = Math.max(0.3, parseFloat((1.3 + qd * 0.025 + (home ? 0.3 : 0)).toFixed(1)));
    const aXG = Math.max(0.3, parseFloat((1.3 - qd * 0.025 + (home ? 0 : 0.3)).toFixed(1)));

    return { h2h, winProb: wp, radar, form: { home: getForm(club.id), away: getForm(opp.id) }, importance: imp, xG: { home: hXG, away: aXG }, clubName: club.shortName || club.name, oppName: opp.shortName || opp.name };
  }, [gameState]);

  // Post-match analysis data
  const postMatchAnalysis = useMemo(() => {
    if (!lastResult || !matchStats) return null;
    const seed = lastResult.week * 100 + lastResult.homeScore * 10 + lastResult.awayScore;

    // 10. Rating distribution (synthetic)
    const ratings = Array.from({ length: 18 }, (_, i) => 5.5 + seededRandom(seed + i * 3) * 4);
    const homeWon = lastResult.homeScore > lastResult.awayScore;
    ratings.forEach((r, i) => {
      if (homeWon && seededRandom(seed + i * 7 + 50) > 0.7) ratings[i] += 1;
      if (!homeWon && seededRandom(seed + i * 7 + 50) > 0.7) ratings[i] -= 0.5;
    });
    const bins = [0, 0, 0, 0];
    ratings.forEach(r => { if (r < 7) bins[0]++; else if (r < 8) bins[1]++; else if (r < 9) bins[2]++; else bins[3]++; });

    // 11. Passing network positions (synthetic)
    const homeNet = {
      positions: [{ x: 40, y: 100 }, { x: 100, y: 35 }, { x: 100, y: 165 }, { x: 170, y: 55 }, { x: 170, y: 145 }, { x: 230, y: 100 }],
      connections: [[0, 1], [0, 2], [0, 5], [1, 3], [2, 4], [3, 5], [4, 5], [1, 4], [3, 4]],
    };
    const awayNet = {
      positions: [{ x: 270, y: 100 }, { x: 330, y: 35 }, { x: 330, y: 165 }, { x: 400, y: 55 }, { x: 400, y: 145 }, { x: 460, y: 100 }],
      connections: [[0, 1], [0, 2], [0, 5], [1, 3], [2, 4], [3, 5], [4, 5], [1, 4], [3, 4]],
    };

    return {
      possession: matchStats.homePossession,
      shotData: {
        homeShots: matchStats.homeShots, awayShots: matchStats.awayShots,
        homeOnTarget: matchStats.homeShotsOnTarget, awayOnTarget: matchStats.awayShotsOnTarget,
        homeCorners: matchStats.homeCorners, awayCorners: matchStats.awayCorners,
        homeKeyPasses: Math.max(2, Math.round(matchStats.homeShotsOnTarget * 1.4 + seededRandom(seed + 200) * 3)),
        awayKeyPasses: Math.max(2, Math.round(matchStats.awayShotsOnTarget * 1.4 + seededRandom(seed + 201) * 3)),
      },
      ratingDist: bins,
      homeNet, awayNet,
    };
  }, [lastResult, matchStats]);

  if (!gameState) return null;

  const { player, currentClub, currentWeek, upcomingFixtures } = gameState;
  const currentWeather = gameState.currentWeather;
  const playerTeamLevel = gameState.playerTeamLevel ?? 'senior';
  const isAtYouthLevel = playerTeamLevel === 'u18' || playerTeamLevel === 'u21';
  const nextFixture = !isAtYouthLevel ? upcomingFixtures.find(f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)) : null;
  const opponent = nextFixture ? getClubById(nextFixture.homeClubId === currentClub.id ? nextFixture.awayClubId : nextFixture.homeClubId) : null;
  const isHome = nextFixture?.homeClubId === currentClub.id;

  // ============================================================
  // MATCH SIMULATION SCREEN
  // ============================================================
  if (showSimulation && lastResult) {
    const homeName = lastResult.homeClub.shortName || lastResult.homeClub.name.slice(0, 3);
    const awayName = lastResult.awayClub.shortName || lastResult.awayClub.name.slice(0, 3);
    const playerFirstName = player.name.split(' ').pop() || player.name;
    const half = simMinute <= 45 ? 1 : 2;
    const progressInHalf = half === 1
      ? (simMinute / 45) * 100
      : ((simMinute - 45) / 45) * 100;

    return (
      <div className="p-4 max-w-lg mx-auto space-y-3">
        {/* Live Scoreboard Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            {/* Top bar with LIVE badge */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                {!simComplete && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-lg"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                    <span className="text-[10px] font-black text-red-400 tracking-wider">LIVE</span>
                  </motion.div>
                )}
                {simComplete && (
                  <span className="text-[10px] font-bold text-[#8b949e] tracking-wider">FULL TIME</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[#8b949e]">
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e] h-5">
                  {lastResult.competition === 'league' ? 'League' : lastResult.competition}
                </Badge>
                <span className="text-[9px]">Wk {lastResult.week}</span>
                {currentWeather && currentWeather.severity !== 'none' && (
                  <span className="text-sm" title={currentWeather.name}>
                    {currentWeather.type === 'rainy' ? '🌧️' : currentWeather.type === 'snowy' ? '❄️' : currentWeather.type === 'stormy' ? '⛈️' : currentWeather.type === 'windy' ? '💨' : currentWeather.type === 'foggy' ? '🌫️' : currentWeather.type === 'hot' ? '🌡️' : '🌤️'}
                  </span>
                )}
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-4 px-4 pb-3">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {lastResult.homeClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">{homeName}</span>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-1 min-w-[90px]">
                <motion.div
                  key={`${liveScore.home}-${liveScore.away}`}
                  animate={goalFlash ? {
                    opacity: [0.5, 1, 0.5],
                  } : {}}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="text-4xl font-black text-white tracking-wider"
                >
                  {liveScore.home} <span className="text-[#484f58]">-</span> {liveScore.away}
                </motion.div>
                {/* Minute clock */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <motion.span
                    key={simMinute}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-mono font-bold text-emerald-400"
                  >
                    {simMinute}&apos;
                  </motion.span>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {lastResult.awayClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">{awayName}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#8b949e] font-mono">0&apos;</span>
                <div className="flex-1 relative">
                  {/* Half marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10" />
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        half === 1
                          ? 'bg-emerald-500'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${(simMinute / 90) * 100}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-[#8b949e] font-mono">90&apos;</span>
              </div>
              {/* Half indicators */}
              <div className="flex justify-between mt-1 px-0">
                <span className={`text-[8px] font-bold ${half === 1 ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                  1ST HALF
                </span>
                <span className={`text-[8px] font-bold ${half === 2 ? 'text-cyan-400' : 'text-[#484f58]'}`}>
                  2ND HALF
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goal Flash Overlay */}
        <AnimatePresence>
          {goalFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 text-center"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.2, repeat: 1 }}
                className="text-2xl"
              >
                ⚽
              </motion.div>
              <p className="text-sm font-black text-emerald-400 tracking-wider mt-1">GOAL!</p>
              <p className="text-lg font-black text-white">
                {liveScore.home} - {liveScore.away}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Half-time indicator */}
        <AnimatePresence>
          {simMinute >= 45 && simMinute <= 47 && !simComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-center"
            >
              <p className="text-xs font-bold text-amber-400 tracking-wider">⏸️ HALF TIME</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Feed */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e]  font-semibold flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Match Events
              </span>
              <span className="text-[9px] text-[#484f58] font-mono">
                {visibleSimEvents.length} / {significantEvents.length}
              </span>
            </div>
          </div>
          <div
            ref={eventFeedRef}
            className="px-3 py-2 max-h-64 overflow-y-auto scrollbar-thin space-y-2"
          >
            {visibleSimEvents.length === 0 && simMinute < 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <p className="text-[#484f58] text-xs">Kick off! The match has begun...</p>
              </motion.div>
            )}
            {visibleSimEvents.length === 0 && simMinute >= 5 && (
              <div className="text-center py-4">
                <p className="text-[#484f58] text-xs">Waiting for events...</p>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {visibleSimEvents.map((event, i) => (
                <LiveEventCard
                  key={`${event.minute}-${event.type}-${i}`}
                  event={event}
                  index={i}
                  isPlayerEvent={event.playerId === player.id}
                  homeClubName={homeName}
                  awayClubName={awayName}
                  playerFirstName={playerFirstName}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* In-Match Tactical Board Mini */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                <Footprints className="w-3 h-3" /> Tactical Board
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e] h-5">
                  {simMinute <= 45 ? '1ST HALF' : simMinute < 90 ? '2ND HALF' : 'FULL TIME'}
                </Badge>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {simMinute}&apos;{simComplete ? ' FT' : ''}
                </span>
              </div>
            </div>
            <div className="px-3 pb-3 relative">
              <svg viewBox="0 0 300 200" className="w-full rounded-lg border border-[#1a3320]">
                {/* Pitch background */}
                <rect x="0" y="0" width="300" height="200" fill="#0d2818" rx="4" />
                {/* Pitch markings */}
                <rect x="5" y="5" width="290" height="190" fill="none" stroke="#1a5c32" strokeWidth="0.7" rx="2" />
                <line x1="5" y1="100" x2="295" y2="100" stroke="#1a5c32" strokeWidth="0.5" />
                <circle cx="150" cy="100" r="22" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                <circle cx="150" cy="100" r="2" fill="#1a5c32" />
                {/* Penalty areas */}
                <rect x="5" y="5" width="55" height="45" fill="none" stroke="#1a5c32" strokeWidth="0.5" rx="1" />
                <rect x="5" y="150" width="55" height="45" fill="none" stroke="#1a5c32" strokeWidth="0.5" rx="1" />
                <rect x="5" y="20" width="18" height="16" fill="none" stroke="#1a5c32" strokeWidth="0.5" rx="1" />
                <rect x="5" y="164" width="18" height="16" fill="none" stroke="#1a5c32" strokeWidth="0.5" rx="1" />
                {/* Penalty arcs */}
                <path d="M 60 30 A 25 25 0 0 1 60 50" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                <path d="M 60 150 A 25 25 0 0 0 60 170" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                {/* Corner arcs */}
                <path d="M 5 10 A 5 5 0 0 1 10 5" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                <path d="M 290 5 A 5 5 0 0 1 295 10" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                <path d="M 5 190 A 5 5 0 0 0 10 195" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                <path d="M 290 195 A 5 5 0 0 0 295 190" fill="none" stroke="#1a5c32" strokeWidth="0.5" />
                {/* Away team positions (top half) */}
                {(() => {
                  const awayPositions = getFormationLayout(lastResult.awayClub.formation || '4-4-2', 18, 80, 300);
                  return awayPositions.map((pos, i) => (
                    <g key={`away-${i}`}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="#f59e0b"
                        fillOpacity="0.75"
                        stroke="#161b22"
                        strokeWidth="1.5"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 3}
                        textAnchor="middle"
                        fill="#161b22"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ));
                })()}
                {/* Home team positions (bottom half) */}
                {(() => {
                  const homePositions = getFormationLayout(lastResult.homeClub.formation || '4-3-3', 182, 120, 300);
                  return homePositions.map((pos, i) => (
                    <g key={`home-${i}`}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="#34d399"
                        fillOpacity="0.75"
                        stroke="#161b22"
                        strokeWidth="1.5"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 3}
                        textAnchor="middle"
                        fill="#161b22"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ));
                })()}
              </svg>
              {/* Score overlay */}
              <div className="absolute top-2 right-4 bg-black/75 px-2.5 py-1 rounded-lg border border-[#30363d]">
                <span className="text-sm font-black text-white tracking-wider">{liveScore.home} - {liveScore.away}</span>
              </div>
              {/* Team labels */}
              <div className="flex justify-between mt-1.5 px-1">
                <span className="text-[9px] font-semibold text-amber-400">{awayName}</span>
                <span className="text-[9px] font-semibold text-emerald-400">{homeName}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={cycleSpeed}
            variant="outline"
            className="flex-1 h-9 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-1.5"
            disabled={simComplete}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{simSpeed}x</span>
            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-slate-700 text-[#c9d1d9] border-0 ml-1">
              SPEED
            </Badge>
          </Button>
          <Button
            onClick={handleSkipToEnd}
            variant="outline"
            className="flex-1 h-9 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-1.5"
            disabled={simComplete}
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip to End
          </Button>
        </div>

        {/* Full Time Overlay */}
        <AnimatePresence>
          {showFullTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 "
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center max-w-xs mx-4"
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <p className="text-3xl font-black text-white tracking-wider">FULL TIME</p>
                </motion.div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <span className="text-2xl">{lastResult.homeClub.logo}</span>
                  <span className="text-3xl font-black text-white">
                    {liveScore.home} - {liveScore.away}
                  </span>
                  <span className="text-2xl">{lastResult.awayClub.logo}</span>
                </div>
                <p className="text-xs text-[#8b949e] mt-3">Loading match report...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================
  // MATCH RESULT SCREEN
  // ============================================================
  if (showResult && lastResult) {
    const won = (lastResult.homeClub.id === currentClub.id && lastResult.homeScore > lastResult.awayScore) ||
                (lastResult.awayClub.id === currentClub.id && lastResult.awayScore > lastResult.homeScore);
    const drew = lastResult.homeScore === lastResult.awayScore;
    const isMotm = lastResult.playerRating >= 8.5;
    const matchGrade = getMatchGrade(lastResult.playerRating);
    const ratingColor = lastResult.playerRating >= 9 ? '#6ee7b7' : lastResult.playerRating >= 8 ? '#10b981' : lastResult.playerRating >= 7 ? '#38bdf8' : lastResult.playerRating >= 6 ? '#f59e0b' : '#ef4444';
    const ratingBgColor = lastResult.playerRating >= 9 ? 'bg-emerald-300/15 border-emerald-300/40' : lastResult.playerRating >= 8 ? 'bg-emerald-500/15 border-emerald-500/40' : lastResult.playerRating >= 7 ? 'bg-sky-500/15 border-sky-500/40' : lastResult.playerRating >= 6 ? 'bg-amber-500/15 border-amber-500/40' : 'bg-red-500/15 border-red-500/40';

    const homeName = lastResult.homeClub.shortName || lastResult.homeClub.name.slice(0, 3);
    const awayName = lastResult.awayClub.shortName || lastResult.awayClub.name.slice(0, 3);
    const homeAbbr = lastResult.homeClub.name.slice(0, 2).toUpperCase();
    const awayAbbr = lastResult.awayClub.name.slice(0, 2).toUpperCase();
    const competitionLabel = lastResult.competition === 'league' ? 'League' : lastResult.competition === 'cup' ? 'Cup' : lastResult.competition;
    const competitionBadge = lastResult.competition === 'cup' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Enhanced Result Header Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className={`bg-[#161b22] border-[#30363d] overflow-hidden ${won ? 'border-l-[3px] border-l-emerald-500' : drew ? 'border-l-[3px] border-l-amber-500' : 'border-l-[3px] border-l-red-500'}`}>
            <div className={`h-1.5 ${won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500'}`} />
            <CardContent className="p-5">
              {/* Top row: Competition badge + Full Time */}
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${competitionBadge} font-semibold`}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {competitionLabel}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-600 text-slate-400 font-bold tracking-wider">
                  FULL TIME
                </Badge>
              </div>

              {/* Match Status: WIN/DRAW/LOSS */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className={`text-center text-2xl font-black mb-5 tracking-widest ${won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400'}`}
              >
                {won ? 'WIN' : drew ? 'DRAW' : 'LOSS'}
              </motion.p>

              {/* Score Display with larger team badges */}
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl bg-sky-500/10 border-2 border-sky-500/30 text-sky-400 font-black text-sm">
                    {homeAbbr}
                  </div>
                  <span className="text-sm text-[#c9d1d9] font-semibold text-center leading-tight">{homeName}</span>
                  <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400">HOME</Badge>
                </div>
                {/* Score */}
                <div className="flex flex-col items-center gap-1 min-w-[90px]">
                  <div className="text-6xl font-black text-white tracking-wider">
                    {lastResult.homeScore} <span className="text-[#484f58]">-</span> {lastResult.awayScore}
                  </div>
                </div>
                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 font-black text-sm">
                    {awayAbbr}
                  </div>
                  <span className="text-sm text-[#c9d1d9] font-semibold text-center leading-tight">{awayName}</span>
                  <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-400">AWAY</Badge>
                </div>
              </div>

              {/* Competition & Week */}
              <p className="text-center text-[10px] text-[#8b949e]">
                Week {lastResult.week} &bull; Season {lastResult.season}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Player Performance Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Card className={`bg-[#161b22] border-[#30363d] overflow-hidden ${isMotm ? 'ring-1 ring-amber-500/30' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-xs text-[#8b949e] font-medium">Your Performance</p>
                {isMotm && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5">
                    <Star className="w-3 h-3 mr-0.5" /> MAN OF THE MATCH
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-5">
                {/* Rating Circular Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 ${ratingBgColor}`}>
                    <span className="text-3xl font-black leading-none" style={{ color: ratingColor }}>
                      {lastResult.playerRating.toFixed(1)}
                    </span>
                    <span className={`text-xs font-bold mt-0.5 ${matchGrade.color}`}>{matchGrade.grade}</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] text-center mt-1.5">{getMatchRatingLabel(lastResult.playerRating)}</p>
                </div>

                {/* Stat Pills */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex-1">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-lg font-bold text-emerald-400">{lastResult.playerGoals}</span>
                      <span className="text-[10px] text-[#8b949e] ml-0.5">Goals</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-1.5 flex-1">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-lg font-bold text-sky-400">{lastResult.playerAssists}</span>
                      <span className="text-[10px] text-[#8b949e] ml-0.5">Assists</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 flex-1">
                      <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
                      <span className="text-lg font-bold text-white">{lastResult.playerMinutesPlayed}&apos;</span>
                      <span className="text-[10px] text-[#8b949e] ml-0.5">Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Timeline */}
        {significantEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Match Events
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {significantEvents.map((event, i) => (
                    <TimelineEvent
                      key={i}
                      event={event}
                      index={i}
                      isLast={i === significantEvents.length - 1}
                      isPlayerEvent={event.playerId === player.id}
                      homeClubName={homeName}
                      awayClubName={awayName}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Match Stats Summary */}
        {matchStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Match Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {/* Divider helper: every StatBar gets a border-b except last */}
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homePossession}
                  awayValue={100 - matchStats.homePossession}
                  homeLabel={`${matchStats.homePossession}%`}
                  awayLabel={`${100 - matchStats.homePossession}%`}
                  title="Possession"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homeShots}
                  awayValue={matchStats.awayShots}
                  homeLabel={String(matchStats.homeShots)}
                  awayLabel={String(matchStats.awayShots)}
                  title="Shots"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homePasses}
                  awayValue={matchStats.awayPasses}
                  homeLabel={String(matchStats.homePasses)}
                  awayLabel={String(matchStats.awayPasses)}
                  title="Passes"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homeTackles}
                  awayValue={matchStats.awayTackles}
                  homeLabel={String(matchStats.homeTackles)}
                  awayLabel={String(matchStats.awayTackles)}
                  title="Tackles"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homeShotsOnTarget}
                  awayValue={matchStats.awayShotsOnTarget}
                  homeLabel={String(matchStats.homeShotsOnTarget)}
                  awayLabel={String(matchStats.awayShotsOnTarget)}
                  title="Shots on Target"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homeCorners}
                  awayValue={matchStats.awayCorners}
                  homeLabel={String(matchStats.homeCorners)}
                  awayLabel={String(matchStats.awayCorners)}
                  title="Corners"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div className={"pb-3 border-b border-[#30363d]"}>
                <StatBar
                  homeValue={matchStats.homeFouls}
                  awayValue={matchStats.awayFouls}
                  homeLabel={String(matchStats.homeFouls)}
                  awayLabel={String(matchStats.awayFouls)}
                  title="Fouls"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
                <div>
                <StatBar
                  homeValue={matchStats.homePassAcc}
                  awayValue={matchStats.awayPassAcc}
                  homeLabel={`${matchStats.homePassAcc}%`}
                  awayLabel={`${matchStats.awayPassAcc}%`}
                  title="Pass Accuracy"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Match Momentum Tracker */}
        {momentumData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.2 }}
          >
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Match Momentum
                </span>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> {homeName}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> {awayName}
                  </span>
                </div>
              </div>
              <div className="px-3 pt-2 pb-1">
                <svg viewBox="0 0 920 120" className="w-full" style={{ height: '120px' }}>
                  {/* Background */}
                  <rect x="10" y="5" width="900" height="110" fill="#0d1117" rx="4" />
                  {/* Neutral line */}
                  <line x1="10" y1="60" x2="910" y2="60" stroke="#21262d" strokeWidth="0.5" />
                  {/* Half-time marker */}
                  <line x1="460" y1="8" x2="460" y2="112" stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
                  {/* Minute labels */}
                  <text x="14" y="118" fill="#484f58" fontSize="7" fontFamily="monospace">0&apos;</text>
                  <text x="452" y="118" fill="#484f58" fontSize="7" fontFamily="monospace">45&apos;</text>
                  <text x="895" y="118" fill="#484f58" fontSize="7" fontFamily="monospace">90&apos;</text>
                  {/* HOME / AWAY labels */}
                  <text x="912" y="14" fill="#34d399" fontSize="6" fontWeight="bold" fontFamily="monospace">H</text>
                  <text x="912" y="108" fill="#f59e0b" fontSize="6" fontWeight="bold" fontFamily="monospace">A</text>
                  {/* Momentum filled area */}
                  <defs>
                    <clipPath id="clip-top"><rect x="10" y="5" width="900" height="55" /></clipPath>
                    <clipPath id="clip-bottom"><rect x="10" y="60" width="900" height="55" /></clipPath>
                  </defs>
                  <path
                    d={momentumData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${10 + i * 10} ${60 - v}`).join(' ') + ' L 910 60 L 10 60 Z'}
                    fill="#34d399"
                    fillOpacity="0.12"
                    clipPath="url(#clip-top)"
                  />
                  <path
                    d={momentumData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${10 + i * 10} ${60 - v}`).join(' ') + ' L 910 60 L 10 60 Z'}
                    fill="#f59e0b"
                    fillOpacity="0.12"
                    clipPath="url(#clip-bottom)"
                  />
                  {/* Momentum line */}
                  <path
                    d={momentumData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${10 + i * 10} ${60 - v}`).join(' ')}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {/* Key event markers on timeline */}
                  {significantEvents.filter(e => ['goal', 'own_goal', 'red_card', 'second_yellow'].includes(e.type)).map((e, i) => {
                    const x = 10 + Math.min(e.minute, 90) * 10;
                    const y = 60 - (momentumData[Math.min(e.minute, 90)] ?? 0);
                    const dotColor = e.type === 'goal' || e.type === 'own_goal' ? '#34d399' : '#ef4444';
                    return (
                      <circle key={`momentum-evt-${i}`} cx={x} cy={Math.max(10, Math.min(110, y))} r="4" fill={dotColor} stroke="#0d1117" strokeWidth="1.5" />
                    );
                  })}
                </svg>
              </div>
              {/* Half-time score summary */}
              {halfTimeScore && (halfTimeScore.home > 0 || halfTimeScore.away > 0) && (
                <div className="px-4 py-2 border-t border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Half Time
                    </span>
                    <span className="text-xs font-bold text-white">
                      {halfTimeScore.home} - {halfTimeScore.away}
                    </span>
                  </div>
                </div>
              )}
              {/* Key moments list */}
              <div className="px-4 pb-3 space-y-1.5">
                {significantEvents.filter(e => ['goal', 'own_goal', 'red_card', 'second_yellow', 'yellow_card', 'penalty_won', 'penalty_missed'].includes(e.type)).map((e, i) => {
                  const icon = getEventIcon(e.type);
                  const color = getEventColor(e.type);
                  const teamLabel = e.team === 'home' ? homeName : e.team === 'away' ? awayName : '';
                  return (
                    <div key={`key-moment-${i}`} className="flex items-center gap-2 text-[10px]">
                      <span className="font-mono text-[#484f58] w-6 text-right shrink-0">{e.minute}&apos;</span>
                      <span className="text-sm leading-none">{icon}</span>
                      <span className={`font-semibold ${color}`}>{getEventLabel(e.type)}</span>
                      <span className="text-[#8b949e] truncate">{e.playerName ? e.playerName : teamLabel}{e.detail ? ` — ${e.detail}` : ''}</span>
                    </div>
                  );
                })}
                {significantEvents.filter(e => ['goal', 'own_goal', 'red_card', 'second_yellow', 'yellow_card', 'penalty_won', 'penalty_missed'].includes(e.type)).length === 0 && (
                  <p className="text-[10px] text-[#484f58] text-center py-1">No key moments recorded</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Season Stats After Match */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Season Stats After Match
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: player.seasonStats.appearances, label: 'Apps', color: 'text-white' },
                  { value: player.seasonStats.goals, label: 'Goals', color: 'text-emerald-400' },
                  { value: player.seasonStats.assists, label: 'Assists', color: 'text-sky-400' },
                  { value: player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '—', label: 'Avg Rating', color: player.seasonStats.averageRating >= 7 ? 'text-emerald-400' : player.seasonStats.averageRating >= 6 ? 'text-amber-400' : 'text-white' },
                ].map((stat, i) => (
                  <div key={i} className="text-center bg-[#21262d] rounded-lg py-2">
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { value: player.seasonStats.starts, label: 'Starts', color: 'text-white' },
                  { value: player.seasonStats.yellowCards, label: 'Yellow', color: 'text-yellow-400' },
                  { value: player.seasonStats.redCards, label: 'Red', color: 'text-red-400' },
                  { value: player.seasonStats.manOfTheMatch, label: 'MOTM', color: 'text-amber-400' },
                ].map((stat, i) => (
                  <div key={i} className="text-center bg-[#21262d] rounded-lg py-2">
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Post-Match Reaction Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.2 }}
        >
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                <Radio className="w-3 h-3" /> Post-Match Reactions
              </span>
            </div>
            <div className="px-4 py-3 space-y-3">
              {/* Star rating display */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 ${ratingBgColor}`}>
                    <span className="text-xl font-black leading-none" style={{ color: ratingColor }}>
                      {lastResult.playerRating.toFixed(1)}
                    </span>
                    <span className={`text-[9px] font-bold ${matchGrade.color}`}>{matchGrade.grade}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#8b949e] mb-1">Your Match Rating</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(lastResult.playerRating) ? 'text-amber-400 fill-amber-400' : i < lastResult.playerRating ? 'text-amber-400' : 'text-[#30363d]'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-[#484f58] mt-1">{getMatchRatingLabel(lastResult.playerRating)}</p>
                </div>
              </div>

              {/* Key match stats compact row */}
              {matchStats && (
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: 'Poss.', home: `${matchStats.homePossession}%`, away: `${100 - matchStats.homePossession}%` },
                    { label: 'Shots', home: String(matchStats.homeShots), away: String(matchStats.awayShots) },
                    { label: 'Passes', home: String(matchStats.homePasses), away: String(matchStats.awayPasses) },
                    { label: 'Tackles', home: String(matchStats.homeTackles), away: String(matchStats.awayTackles) },
                    { label: 'Fouls', home: String(matchStats.homeFouls), away: String(matchStats.awayFouls) },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#21262d] rounded-lg p-1.5 text-center">
                      <p className="text-[8px] text-[#484f58] mb-0.5">{stat.label}</p>
                      <p className="text-[10px] font-bold text-white leading-tight">
                        <span className={stat.home > stat.away ? 'text-emerald-400' : ''}>{stat.home}</span>
                      </p>
                      <p className="text-[10px] font-bold text-white leading-tight">
                        <span className={stat.away > stat.home ? 'text-amber-400' : ''}>{stat.away}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Media reaction quotes */}
              {postMatchQuotes.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#8b949e] mb-1.5 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Media Reaction
                  </p>
                  <div className="space-y-1.5">
                    {postMatchQuotes.map((quote, i) => (
                      <div key={i} className="bg-[#21262d] rounded-lg px-3 py-2 border-l-2 border-[#484f58]">
                        <p className="text-[10px] text-[#c9d1d9] italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                        <p className="text-[9px] text-[#484f58] mt-1">— {quote.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Man of the Match highlight card */}
              <div className={`rounded-lg p-3 border ${isMotm ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#21262d] border-[#30363d]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMotm ? 'bg-amber-500/20' : 'bg-[#30363d]'}`}>
                    <Crown className={`w-5 h-5 ${isMotm ? 'text-amber-400' : 'text-[#484f58]'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#c9d1d9]">
                      {isMotm ? player.name : `${lastResult.homeClub.shortName || lastResult.homeClub.name} Player`}
                    </p>
                    <p className="text-[10px] text-[#8b949e]">
                      {isMotm ? 'Your performance earned you Man of the Match!' : 'Star performer for the match.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${isMotm ? 'text-amber-400' : 'text-[#8b949e]'}`}>
                      {isMotm ? lastResult.playerRating.toFixed(1) : (7.5 + seededRandom(lastResult.week * 37) * 2).toFixed(1)}
                    </p>
                    <p className="text-[9px] text-[#484f58]">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Match Analysis - 5 SVG Visualizations */}
        {postMatchAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> Match Analysis
              </span>
            </div>
            <div className="p-4 space-y-4">

              {/* Row 1: Possession Pie + Shot Accuracy Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* 7. SVG Possession & Territory Pie */}
                <Card className="bg-[#21262d] border-[#30363d]">
                  <CardContent className="p-3">
                    <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Possession</p>
                    <svg viewBox="0 0 160 100" className="w-full">
                      {(() => {
                        const homePct = postMatchAnalysis.possession;
                        const awayPct = 100 - homePct;
                        const homeAngle = (homePct / 100) * 2 * Math.PI;
                        const awayAngle = (awayPct / 100) * 2 * Math.PI;
                        const startAngle = -Math.PI / 2;
                        const homeSlice = svgPieSlice(80, 50, 40, startAngle, startAngle + homeAngle);
                        const awaySlice = svgPieSlice(80, 50, 40, startAngle + homeAngle, startAngle + homeAngle + awayAngle);
                        const midHome = startAngle + homeAngle / 2;
                        const midAway = startAngle + homeAngle + awayAngle / 2;
                        const lxH = 80 + 26 * Math.cos(midHome);
                        const lyH = 50 + 26 * Math.sin(midHome);
                        const lxA = 80 + 26 * Math.cos(midAway);
                        const lyA = 50 + 26 * Math.sin(midAway);
                        return (
                          <>
                            <path d={homeSlice} fill="#10b981" fillOpacity="0.35" stroke="#0d1117" strokeWidth="2" />
                            <path d={awaySlice} fill="#ef4444" fillOpacity="0.25" stroke="#0d1117" strokeWidth="2" />
                            <circle cx="80" cy="50" r="16" fill="#21262d" />
                            <text x={lxH} y={lyH + 3} fill="#c9d1d9" fontSize="8" fontWeight="bold" textAnchor="middle">{homePct}%</text>
                            <text x={lxA} y={lyA + 3} fill="#c9d1d9" fontSize="8" fontWeight="bold" textAnchor="middle">{awayPct}%</text>
                            <text x="20" y="88" fill="#10b981" fontSize="7">HOME</text>
                            <text x="110" y="88" fill="#ef4444" fontSize="7">AWAY</text>
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>

                {/* 8. SVG Shot Accuracy Comparison */}
                <Card className="bg-[#21262d] border-[#30363d]">
                  <CardContent className="p-3">
                    <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Shots & Chances</p>
                    <svg viewBox="0 0 160 100" className="w-full">
                      {(() => {
                        const sd = postMatchAnalysis.shotData;
                        const maxVal = Math.max(sd.homeShots, sd.awayShots, sd.homeOnTarget, sd.awayOnTarget, sd.homeKeyPasses, sd.awayKeyPasses, sd.homeCorners, sd.awayCorners, 1);
                        const groups = [
                          { label: 'Shots', h: sd.homeShots, a: sd.awayShots },
                          { label: 'On Tgt', h: sd.homeOnTarget, a: sd.awayOnTarget },
                          { label: 'K. Pass', h: sd.homeKeyPasses, a: sd.awayKeyPasses },
                          { label: 'Corners', h: sd.homeCorners, a: sd.awayCorners },
                        ];
                        const barMaxW = 32;
                        const barH = 14;
                        return (
                          <>
                            {groups.map((g, i) => {
                              const hW = Math.max(2, (g.h / maxVal) * barMaxW);
                              const aW = Math.max(2, (g.a / maxVal) * barMaxW);
                              const y = 14 + i * 22;
                              return (
                                <g key={g.label}>
                                  <text x="2" y={y + 10} fill="#8b949e" fontSize="6">{g.label}</text>
                                  <rect x="36" y={y} width={hW} height={barH} fill="#10b981" fillOpacity="0.3" rx="2" />
                                  <text x={38 + hW} y={y + 10} fill="#10b981" fontSize="6" fontWeight="bold">{g.h}</text>
                                  <rect x="88" y={y} width={aW} height={barH} fill="#ef4444" fillOpacity="0.3" rx="2" />
                                  <text x={90 + aW} y={y + 10} fill="#ef4444" fontSize="6" fontWeight="bold">{g.a}</text>
                                </g>
                              );
                            })}
                            <text x="36" y="8" fill="#10b981" fontSize="5">H</text>
                            <text x="88" y="8" fill="#ef4444" fontSize="5">A</text>
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>
              </div>

              {/* 9. SVG Momentum Swing Chart */}
              <Card className="bg-[#21262d] border-[#30363d]">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">Momentum Swing</p>
                    <div className="flex items-center gap-2 text-[7px]">
                      <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Home</span>
                      <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Away</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 400 110" className="w-full">
                    {(() => {
                      const data = momentumData;
                      if (data.length === 0) return null;
                      const baseY = 55;
                      const startX = 10;
                      const stepX = (380) / Math.max(data.length - 1, 1);
                      const scaleY = 0.5;
                      const abovePath = svgMomentumArea(data, baseY, startX, stepX, scaleY, true);
                      const belowPath = svgMomentumArea(data, baseY, startX, stepX, scaleY, false);
                      const linePath = svgMomentumLine(data, baseY, startX, stepX, scaleY);
                      return (
                        <>
                          <rect x="5" y="5" width="390" height="100" fill="#0d1117" rx="4" />
                          <line x1="10" y1={baseY} x2="390" y2={baseY} stroke="#30363d" strokeWidth="0.5" />
                          <line x1="200" y1="8" x2="200" y2="102" stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" />
                          <path d={abovePath} fill="#10b981" fillOpacity="0.15" />
                          <path d={belowPath} fill="#ef4444" fillOpacity="0.15" />
                          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinejoin="round" />
                          <text x="12" y="106" fill="#484f58" fontSize="6" fontFamily="monospace">0&apos;</text>
                          <text x="192" y="106" fill="#484f58" fontSize="6" fontFamily="monospace">45&apos;</text>
                          <text x="375" y="106" fill="#484f58" fontSize="6" fontFamily="monospace">90&apos;</text>
                          <text x="395" y="12" fill="#10b981" fontSize="5" fontWeight="bold">H</text>
                          <text x="395" y="100" fill="#ef4444" fontSize="5" fontWeight="bold">A</text>
                        </>
                      );
                    })()}
                  </svg>
                </CardContent>
              </Card>

              {/* Row 2: Rating Distribution + Passing Network */}
              <div className="grid grid-cols-2 gap-3">
                {/* 10. SVG Match Rating Distribution */}
                <Card className="bg-[#21262d] border-[#30363d]">
                  <CardContent className="p-3">
                    <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Rating Distribution</p>
                    <svg viewBox="0 0 160 90" className="w-full">
                      {(() => {
                        const bins = postMatchAnalysis.ratingDist;
                        const maxVal = Math.max(...bins, 1);
                        const labels = ['6-7', '7-8', '8-9', '9+'];
                        const colors = ['#f59e0b', '#38bdf8', '#10b981', '#34d399'];
                        const barMaxH = 50;
                        const barW = 24;
                        return (
                          <>
                            {bins.map((val, i) => {
                              const h = Math.max(2, (val / maxVal) * barMaxH);
                              const x = 12 + i * 36;
                              return (
                                <g key={labels[i]}>
                                  <rect x={x} y={65 - h} width={barW} height={h} fill={colors[i]} fillOpacity="0.25" rx="2" />
                                  <rect x={x} y={65 - h} width={barW} height={h} fill="none" stroke={colors[i]} strokeWidth="0.6" rx="2" />
                                  <text x={x + barW / 2} y={62 - h} fill={colors[i]} fontSize="7" fontWeight="bold" textAnchor="middle">{val}</text>
                                  <text x={x + barW / 2} y="80" fill="#8b949e" fontSize="6" textAnchor="middle">{labels[i]}</text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>

                {/* 11. SVG Passing Network Mini Diagram */}
                <Card className="bg-[#21262d] border-[#30363d]">
                  <CardContent className="p-3">
                    <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Passing Network</p>
                    <svg viewBox="0 0 160 100" className="w-full">
                      {(() => {
                        const hn = postMatchAnalysis.homeNet;
                        const an = postMatchAnalysis.awayNet;
                        const scaleX = 160 / 500;
                        const scaleY = 100 / 200;
                        return (
                          <>
                            <rect x="1" y="1" width="158" height="98" fill="#0d1117" rx="3" />
                            <line x1="80" y1="2" x2="80" y2="98" stroke="#30363d" strokeWidth="0.5" strokeDasharray="2,2" />
                            {hn.connections.map((c, i) => {
                              const x1 = hn.positions[c[0]].x * scaleX;
                              const y1 = hn.positions[c[0]].y * scaleY;
                              const x2 = hn.positions[c[1]].x * scaleX;
                              const y2 = hn.positions[c[1]].y * scaleY;
                              return <line key={`hc-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.4" />;
                            })}
                            {an.connections.map((c, i) => {
                              const x1 = an.positions[c[0]].x * scaleX;
                              const y1 = an.positions[c[0]].y * scaleY;
                              const x2 = an.positions[c[1]].x * scaleX;
                              const y2 = an.positions[c[1]].y * scaleY;
                              return <line key={`ac-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />;
                            })}
                            {hn.positions.map((p, i) => (
                              <circle key={`hp-${i}`} cx={p.x * scaleX} cy={p.y * scaleY} r="3.5" fill="#10b981" fillOpacity="0.7" stroke="#0d1117" strokeWidth="1" />
                            ))}
                            {an.positions.map((p, i) => (
                              <circle key={`ap-${i}`} cx={p.x * scaleX} cy={p.y * scaleY} r="3.5" fill="#38bdf8" fillOpacity="0.7" stroke="#0d1117" strokeWidth="1" />
                            ))}
                            <text x="40" y="95" fill="#10b981" fontSize="5" fontWeight="bold" textAnchor="middle">HOME</text>
                            <text x="120" y="95" fill="#38bdf8" fontSize="5" fontWeight="bold" textAnchor="middle">AWAY</text>
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* Web3 Gritty Futurism: Post-Match Deep Analysis */}
        {postMatchAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="bg-[#111111] border border-[#00E5FF]/10 overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-[#00E5FF]/10">
              <p className="text-[10px] text-[#00E5FF] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: W3_FONT }}>
                ◆ Post-Match Deep Analysis
              </p>
              <p className="text-[8px] text-[#666666] mt-0.5" style={{ fontFamily: W3_FONT }}>Rating breakdown, bench readiness, and weather impact assessment via Web3 analytics.</p>
            </div>
            <div className="p-3 space-y-3">
              {(() => {
                const seed = lastResult.week * 100 + lastResult.homeScore * 10 + lastResult.awayScore;
                const syntheticRatings = Array.from({ length: 18 }, (_, i) => 5.5 + seededRandom(seed + i * 3) * 4);
                const benchPlayers = Array.from({ length: 5 }, (_, i) => ({
                  name: ['J. Silva', 'M. Kone', 'R. Tanaka', 'L. Berg', 'A. Osei'][i],
                  readiness: 50 + Math.round(seededRandom(gameState.currentWeek * 100 + i * 37) * 50),
                  pos: ['SUB', 'SUB', 'SUB', 'SUB', 'SUB'][i],
                }));
                const weatherLabels = ['Passing', 'Shooting', 'Running', 'Tactics', 'Set Pcs'];
                const weatherImpacts = currentWeather
                  ? Array.from({ length: 5 }, (_, i) => {
                      const severityVal = currentWeather.severity === 'none' ? 0 : currentWeather.severity === 'mild' ? -3 : currentWeather.severity === 'moderate' ? -7 : -12;
                      return severityVal + Math.round(seededRandom(gameState.currentWeek * 31 + i * 17) * 10 - 5);
                    })
                  : [0, 0, 0, 0, 0];
                return (
                  <>
                    <PostMatchRatingDistribution ratings={syntheticRatings} />
                    <div className="grid grid-cols-2 gap-3">
                      <SubstitutionReadinessBars players={benchPlayers} />
                      <MatchDayWeatherImpact impacts={weatherImpacts} labels={weatherLabels} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>
        )}

        {/* Post-Match Actions - Horizontal Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <p className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider">Post-Match Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setScreen('post_match_analysis')}
              variant="outline"
              className="h-11 border-[#30363d] bg-[#21262d] hover:bg-[#292e36] hover:border-emerald-500/30 text-[#c9d1d9] hover:text-emerald-400 rounded-lg text-xs font-semibold gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Full Analysis
            </Button>
            <Button
              onClick={() => { setPressConferenceType('post-match'); setShowPressConference(true); }}
              variant="outline"
              className="h-11 border-[#30363d] bg-[#21262d] hover:bg-[#292e36] hover:border-red-500/30 text-[#c9d1d9] hover:text-red-400 rounded-lg text-xs font-semibold gap-1.5"
            >
              <Radio className="w-4 h-4 text-red-400" />
              Press Conference
            </Button>
            <Button
              onClick={() => setScreen('match_highlights')}
              variant="outline"
              className="h-11 border-[#30363d] bg-[#21262d] hover:bg-[#292e36] hover:border-amber-500/30 text-[#c9d1d9] hover:text-amber-400 rounded-lg text-xs font-semibold gap-1.5"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              View Highlights
            </Button>
            <Button
              onClick={() => { setShowResult(false); setScreen('dashboard'); }}
              className="h-11 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold gap-1.5"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Press Conference Modal */}
        <PressConference
          type={pressConferenceType}
          open={showPressConference}
          onClose={() => setShowPressConference(false)}
          matchResult={pressConferenceType === 'post-match' ? lastResult : null}
          opponentName={lastResult.homeClub.id === currentClub.id ? lastResult.awayClub.shortName || lastResult.awayClub.name : lastResult.homeClub.shortName || lastResult.homeClub.name}
          playerForm={player.form}
          playerMorale={player.morale}
        />

        {/* Match Stats Popup */}
        <AnimatePresence>
          {showStats && (
            <MatchStatsPopup
              matchResult={lastResult}
              opponentClub={lastResult.homeClub.id === currentClub.id ? lastResult.awayClub : lastResult.homeClub}
              isHome={lastResult.homeClub.id === currentClub.id}
              onClose={() => setShowStats(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================
  // PRE-MATCH SCREEN
  // ============================================================
  const winProb = opponent ? calculateWinProbability(currentClub.squadQuality, opponent.squadQuality, isHome) : null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Swords className="w-5 h-5 text-emerald-400" />
        Match Day
      </h2>

      {/* Youth Team Match Banner */}
      {isAtYouthLevel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
            <div className={`h-1.5 ${playerTeamLevel === 'u18' ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  playerTeamLevel === 'u18' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                }`}>
                  {playerTeamLevel === 'u18' ? '👦' : '🧑'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#c9d1d9]">
                    {playerTeamLevel === 'u18' ? 'U18 Academy Match' : 'U21 Reserve Match'}
                  </h3>
                  <p className="text-xs text-[#8b949e]">
                    {currentClub.name} {playerTeamLevel.toUpperCase()} vs League Opponent
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  You&apos;re currently in the <span className={playerTeamLevel === 'u18' ? 'text-blue-400 font-semibold' : 'text-purple-400 font-semibold'}>{playerTeamLevel.toUpperCase()} team</span>.
                  Your match will be simulated as a youth league match when you advance the week.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
                  <span>⚽ Youth League</span>
                  <span>•</span>
                  <span>45-90 min played</span>
                  <span>•</span>
                  <span>Lower fatigue cost</span>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-[#484f58]">
                Promotion to {playerTeamLevel === 'u18' ? 'U21' : 'Senior'} requires: {playerTeamLevel === 'u18' ? 'Age 18+ or OVR 60+' : 'Age 19+ or OVR 68+'}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {opponent && nextFixture ? (
        <>
          {/* Dramatic Match Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden border-l-[3px] border-l-emerald-500">
              {/* Top color bars */}
              <div className="flex h-1.5">
                <div className="flex-1" style={{ backgroundColor: currentClub.primaryColor }} />
                <div className="flex-1" style={{ backgroundColor: opponent.primaryColor }} />
              </div>
              <CardContent className="p-5">
                {/* Teams Display */}
                <div className="flex items-center justify-center gap-4">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${currentClub.primaryColor}20`, border: `2px solid ${currentClub.primaryColor}40` }}
                    >
                      {currentClub.logo}
                    </div>
                    <span className="font-bold text-[15px] text-white text-center leading-tight">{currentClub.shortName || currentClub.name}</span>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{currentClub.squadQuality} OVR</Badge>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{currentClub.formation}</Badge>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-emerald-400 font-black text-2xl"
                    >
                      VS
                    </motion.div>
                    <Badge variant="outline" className="text-[10px] border-slate-600">
                      {isHome ? '🏠 HOME' : '✈️ AWAY'}
                    </Badge>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${opponent.primaryColor}20`, border: `2px solid ${opponent.primaryColor}40` }}
                    >
                      {opponent.logo}
                    </div>
                    <span className="font-bold text-[15px] text-white text-center leading-tight">{opponent.shortName || opponent.name}</span>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{opponent.squadQuality} OVR</Badge>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{opponent.formation}</Badge>
                  </div>
                </div>

                {/* Week info */}
                <div className="text-center mt-3">
                  <p className="text-[10px] text-[#8b949e]">Week {currentWeek} • Season {gameState.currentSeason}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Player Section: Form & Morale */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Key Player Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* Form Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Form
                    </span>
                    <span className="text-xs font-bold" style={{ color: player.form >= 7 ? '#10b981' : player.form >= 5 ? '#f59e0b' : '#ef4444' }}>
                      {player.form.toFixed(1)} / 10
                    </span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${player.form * 10}%` }}
                      transition={{ delay: 0.2, duration: 0.2, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: player.form >= 7
                          ? '#10b981'
                          : player.form >= 5
                          ? '#f59e0b'
                          : '#ef4444',
                      }}
                    />
                  </div>
                </div>

                {/* Morale Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Morale
                    </span>
                    <span className="text-xs font-bold" style={{ color: player.morale >= 70 ? '#10b981' : player.morale >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {player.morale}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${player.morale}%` }}
                      transition={{ delay: 0.3, duration: 0.2, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: player.morale >= 70
                          ? '#10b981'
                          : player.morale >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                      }}
                    />
                  </div>
                </div>

                {/* Fitness & Status */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]">
                  <div className="flex items-center gap-2 bg-[#21262d] rounded-lg px-3 py-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-400">{player.fitness}%</p>
                      <p className="text-[9px] text-[#8b949e]">Fitness</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#21262d] rounded-lg px-3 py-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-400 capitalize">{player.squadStatus.replace('_', ' ')}</p>
                      <p className="text-[9px] text-[#8b949e]">Squad Role</p>
                    </div>
                  </div>
                </div>

                {/* Injury Alert */}
                {player.injuryWeeks > 0 && (
                  <div className="mt-1 bg-red-900/30 border border-red-500/20 rounded-lg p-2.5 text-center">
                    <p className="text-red-400 text-xs font-medium">🏥 Injured — {player.injuryWeeks} week{player.injuryWeeks > 1 ? 's' : ''} remaining</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Win Probability */}
          {winProb && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.2 }}
            >
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Win Probability
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {/* Probability bar */}
                  <div className="flex h-6 rounded-lg overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winProb.win}%` }}
                      transition={{ delay: 0.4, duration: 0.2, ease: 'easeOut' }}
                      className="bg-emerald-500 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white">{winProb.win}%</span>
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winProb.draw}%` }}
                      transition={{ delay: 0.4, duration: 0.2, ease: 'easeOut' }}
                      className="bg-slate-500 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white">{winProb.draw}%</span>
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winProb.loss}%` }}
                      transition={{ delay: 0.4, duration: 0.2, ease: 'easeOut' }}
                      className="bg-red-500 flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white">{winProb.loss}%</span>
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8b949e]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Win
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Draw
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Loss
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tactical Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                  <Footprints className="w-3 h-3" /> Tactical Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#21262d] rounded-lg p-3 text-center">
                    <div
                      className="text-2xl font-black mb-1"
                      style={{ color: currentClub.primaryColor }}
                    >
                      {currentClub.formation}
                    </div>
                    <p className="text-[10px] text-[#8b949e]">{currentClub.shortName} Formation</p>
                    <p className="text-[9px] text-[#484f58] capitalize mt-0.5">{currentClub.tacticalStyle.replace('-', ' ')}</p>
                  </div>
                  <div className="bg-[#21262d] rounded-lg p-3 text-center">
                    <div
                      className="text-2xl font-black mb-1"
                      style={{ color: opponent.primaryColor }}
                    >
                      {opponent.formation}
                    </div>
                    <p className="text-[10px] text-[#8b949e]">{opponent.shortName} Formation</p>
                    <p className="text-[9px] text-[#484f58] capitalize mt-0.5">{opponent.tacticalStyle.replace('-', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pre-Match Buildup Panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.2 }}
          >
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
                <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                  <Flame className="w-3 h-3" /> Pre-Match Buildup
                </span>
              </div>
              <div className="px-4 py-3 space-y-3">
                {/* Pre-match stats comparison bars */}
                {(() => {
                  const recentMatches = gameState.recentResults.slice(0, 5);
                  const homeClubResults = recentMatches.filter(r =>
                    r.homeClub.id === currentClub.id || r.awayClub.id === currentClub.id
                  );
                  const opponentResults = recentMatches.filter(r =>
                    r.homeClub.id === opponent.id || r.awayClub.id === opponent.id
                  );
                  const homeGoalsScored = homeClubResults.length > 0
                    ? homeClubResults.reduce((sum, r) => sum + (r.homeClub.id === currentClub.id ? r.homeScore : r.awayScore), 0) / homeClubResults.length
                    : 1.2;
                  const oppGoalsScored = opponentResults.length > 0
                    ? opponentResults.reduce((sum, r) => sum + (r.homeClub.id === opponent.id ? r.homeScore : r.awayScore), 0) / opponentResults.length
                    : 1.0;
                  const homeWins = homeClubResults.filter(r => {
                    const myGoals = r.homeClub.id === currentClub.id ? r.homeScore : r.awayScore;
                    const theirGoals = r.homeClub.id === currentClub.id ? r.awayScore : r.homeScore;
                    return myGoals > theirGoals;
                  }).length;
                  const homeForm = homeClubResults.length > 0 ? (homeWins / homeClubResults.length) * 10 : 5;
                  const oppWins = opponentResults.filter(r => {
                    const myGoals = r.homeClub.id === opponent.id ? r.homeScore : r.awayScore;
                    const theirGoals = r.homeClub.id === opponent.id ? r.awayScore : r.homeScore;
                    return myGoals > theirGoals;
                  }).length;
                  const oppForm = opponentResults.length > 0 ? (oppWins / opponentResults.length) * 10 : 5;

                  const stats = [
                    { label: 'Goals/Match', home: homeGoalsScored.toFixed(1), away: oppGoalsScored.toFixed(1), homeNum: homeGoalsScored, awayNum: oppGoalsScored },
                    { label: 'Form', home: homeForm.toFixed(1), away: oppForm.toFixed(1), homeNum: homeForm, awayNum: oppForm },
                    { label: 'Squad OVR', home: String(currentClub.squadQuality), away: String(opponent.squadQuality), homeNum: currentClub.squadQuality, awayNum: opponent.squadQuality },
                    { label: 'Reputation', home: String(currentClub.reputation), away: String(opponent.reputation), homeNum: currentClub.reputation, awayNum: opponent.reputation },
                  ];

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-[#484f58]">
                        <span className="font-semibold text-emerald-400">{currentClub.shortName}</span>
                        <span className="uppercase tracking-wider text-[8px]">Season Averages</span>
                        <span className="font-semibold text-rose-400">{opponent.shortName}</span>
                      </div>
                      {stats.map((stat) => {
                        const total = stat.homeNum + stat.awayNum;
                        const homePercent = total > 0 ? (stat.homeNum / total) * 100 : 50;
                        return (
                          <div key={stat.label}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold w-10 text-right ${stat.homeNum >= stat.awayNum ? 'text-white' : 'text-[#8b949e]'}`}>{stat.home}</span>
                              <div className="flex-1 flex h-1.5 rounded-lg overflow-hidden bg-[#21262d]">
                                <div className="bg-emerald-500/60 h-full" style={{ width: `${homePercent}%` }} />
                                <div className="bg-rose-500/60 h-full flex-1" />
                              </div>
                              <span className={`text-[10px] font-bold w-10 ${stat.awayNum > stat.homeNum ? 'text-white' : 'text-[#8b949e]'}`}>{stat.away}</span>
                            </div>
                            <p className="text-[8px] text-[#484f58] text-center mt-0.5">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="border-t border-[#30363d]" />

                {/* Stadium atmosphere indicator */}
                {(() => {
                  const atmosSeed = gameState.currentSeason * 100 + currentWeek * 7 + currentClub.reputation;
                  const atmosScore = Math.max(0, Math.min(4, Math.floor(seededRandom(atmosSeed) * 5)));
                  const atmosLevels: { label: string; color: string; bgColor: string; barColor: string }[] = [
                    { label: 'Quiet', color: 'text-[#484f58]', bgColor: 'bg-[#21262d]', barColor: 'border-[#30363d] bg-[#161b22]' },
                    { label: 'Calm', color: 'text-sky-400', bgColor: 'bg-sky-500/20', barColor: 'border-sky-500/30 bg-sky-500/10' },
                    { label: 'Passionate', color: 'text-amber-400', bgColor: 'bg-amber-500/20', barColor: 'border-amber-500/30 bg-amber-500/10' },
                    { label: 'Loud', color: 'text-orange-400', bgColor: 'bg-orange-500/20', barColor: 'border-orange-500/30 bg-orange-500/10' },
                    { label: 'Electric', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', barColor: 'border-emerald-500/30 bg-emerald-500/10' },
                  ];
                  const currentAtmos = atmosLevels[atmosScore];
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏟️</span>
                        <div>
                          <p className="text-[10px] text-[#8b949e]">Stadium Atmosphere</p>
                          <p className={`text-xs font-bold ${currentAtmos.color}`}>{currentAtmos.label}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {atmosLevels.map((level, i) => (
                          <div
                            key={level.label}
                            className={`w-7 h-3 rounded-sm ${i <= atmosScore ? `${level.bgColor} border ${level.barColor.split(' ')[0]}` : 'bg-[#161b22] border border-[#21262d]'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Referee info card */}
                {(() => {
                  const refereeNames = ['M. Oliver', 'A. Taylor', 'C. Pawson', 'A. Marriner', 'M. Dean', 'P. Tierney', 'R. Jones', 'J. Moss', 'K. Friend', 'D. Coote', 'A. Madley', 'T. Robinson', 'S. Attwell', 'R. Bankes'];
                  const refSeed = gameState.currentSeason * 50 + currentWeek * 3;
                  const refIndex = Math.floor(seededRandom(refSeed) * refereeNames.length);
                  const refName = refereeNames[refIndex];
                  const refStrictness = 1 + Math.floor(seededRandom(refSeed + 1) * 5);
                  const refCardsPerGame = (2.5 + seededRandom(refSeed + 2) * 3).toFixed(1);
                  const strictnessEmojis = ['😊', '🙂', '😐', '😤', '🤬'];
                  return (
                    <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                      <div className="text-xl">👨‍⚖️</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#c9d1d9]">{refName}</p>
                        <p className="text-[10px] text-[#8b949e]">Referee</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#c9d1d9]">{strictnessEmojis[refStrictness - 1]} {refStrictness}/5</p>
                        <p className="text-[10px] text-[#8b949e]">{refCardsPerGame} cards/game</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Weather condition card with stat modifiers */}
                {currentWeather && (
                  <div className="bg-[#21262d] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">
                        {currentWeather.type === 'rainy' ? '🌧️' : currentWeather.type === 'snowy' ? '❄️' : currentWeather.type === 'stormy' ? '⛈️' : currentWeather.type === 'windy' ? '💨' : currentWeather.type === 'foggy' ? '🌫️' : currentWeather.type === 'hot' ? '🌡️' : currentWeather.type === 'cloudy' ? '☁️' : '☀️'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#c9d1d9]">{currentWeather.name}</p>
                        <p className="text-[10px] text-[#8b949e]">Severity: <span className={currentWeather.severity === 'none' ? 'text-[#484f58]' : currentWeather.severity === 'mild' ? 'text-sky-400' : currentWeather.severity === 'moderate' ? 'text-amber-400' : 'text-red-400'}>{currentWeather.severity}</span></p>
                      </div>
                    </div>
                    {currentWeather.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {currentWeather.modifiers.map((mod, i) => {
                          const isNeg = mod.modifier < 0;
                          const colorClass = isNeg ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                          return (
                            <div key={i} className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold border ${colorClass}`}>
                              {mod.label} {mod.modifier > 0 ? '+' : ''}{mod.modifier}%
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {currentWeather.modifiers.length === 0 && (
                      <p className="text-[10px] text-[#484f58]">No stat impact expected.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Web3 Gritty Futurism: Pre-Match Intelligence Visualizations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.33, duration: 0.3 }}
            className="space-y-3"
          >
            <div className="bg-[#111111] border border-[#FF5500]/10 overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#FF5500]/10">
                <p className="text-[10px] text-[#FF5500] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: W3_FONT }}>
                  ◆ Pre-Match Intelligence
                </p>
                <p className="text-[8px] text-[#666666] mt-0.5" style={{ fontFamily: W3_FONT }}>Web3-powered analysis of squad readiness, opponent threats, and recent form.</p>
              </div>
              <div className="p-3 space-y-3">
                {(() => {
                  const readiness = Math.round(
                    (player.form / 10) * 40 +
                    (player.morale / 100) * 35 +
                    seededRandom(gameState.currentWeek * 13 + gameState.currentSeason) * 25
                  );
                  const oppRadarLabels = ['ATK', 'DEF', 'SET', 'CTR', 'POS'];
                  const oppRadarValues = Array.from({ length: 5 }, (_, i) =>
                    55 + Math.round(seededRandom(opponent.squadQuality * (i + 7) * 3) * 40)
                  );
                  const formStats = gameState.recentResults.slice(0, 5).reduce(
                    (acc, r) => {
                      const isHome = r.homeClub.id === currentClub.id;
                      const isOpp = r.homeClub.id === opponent.id || r.awayClub.id === opponent.id;
                      if (isHome || r.awayClub.id === currentClub.id) {
                        const mg = isHome ? r.homeScore : r.awayScore;
                        const tg = isHome ? r.awayScore : r.homeScore;
                        if (mg > tg) acc.hW++;
                        if (mg === tg) acc.hD++;
                        if (mg < tg) acc.hL++;
                        acc.hGF += mg;
                        acc.hGA += tg;
                        acc.hCnt++;
                      }
                      if (isOpp) {
                        const isOH = r.homeClub.id === opponent.id;
                        const mg = isOH ? r.homeScore : r.awayScore;
                        const tg = isOH ? r.awayScore : r.homeScore;
                        if (mg > tg) acc.aW++;
                        if (mg === tg) acc.aD++;
                        if (mg < tg) acc.aL++;
                        acc.aGF += mg;
                        acc.aGA += tg;
                        acc.aCnt++;
                      }
                      return acc;
                    },
                    { hW: 0, hD: 0, hL: 0, hGF: 0, hGA: 0, hCnt: 0, aW: 0, aD: 0, aL: 0, aGF: 0, aGA: 0, aCnt: 0 }
                  );
                  const homeSP = 30 + Math.round(seededRandom(currentClub.squadQuality * 17) * 60);
                  const awaySP = 30 + Math.round(seededRandom(opponent.squadQuality * 19) * 60);
                  return (
                    <>
                      <PreMatchReadinessGauge readiness={readiness} />
                      <div className="grid grid-cols-2 gap-3">
                        <OpponentAnalysisRadar values={oppRadarValues} labels={oppRadarLabels} />
                        <FormComparisonBars
                          homeStats={[formStats.hW, formStats.hD, formStats.hL, formStats.hGF, formStats.hGA]}
                          awayStats={[formStats.aW, formStats.aD, formStats.aL, formStats.aGF, formStats.aGA]}
                          labels={['W', 'D', 'L', 'GF', 'GA']}
                          homeName={currentClub.shortName || currentClub.name}
                          awayName={opponent.shortName || opponent.name}
                        />
                      </div>
                      <SetPieceThreatRing
                        homeThreat={homeSP}
                        awayThreat={awaySP}
                        homeName={currentClub.shortName || currentClub.name}
                        awayName={opponent.shortName || opponent.name}
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>

          {/* Head-to-Head History */}
          {(() => {
            const h2hResults = gameState.recentResults.filter(r =>
              (r.homeClub.id === currentClub.id || r.awayClub.id === currentClub.id) &&
              (r.homeClub.id === opponent.id || r.awayClub.id === opponent.id)
            ).slice(0, 5);
            const h2hWins = h2hResults.filter(r => {
              const won = (r.homeClub.id === currentClub.id && r.homeScore > r.awayScore) ||
                          (r.awayClub.id === currentClub.id && r.awayScore > r.homeScore);
              return won;
            }).length;
            const h2hDraws = h2hResults.filter(r => r.homeScore === r.awayScore).length;
            const h2hLosses = h2hResults.length - h2hWins - h2hDraws;
            const h2hGoalsFor = h2hResults.reduce((sum, r) => {
              return sum + (r.homeClub.id === currentClub.id ? r.homeScore : r.awayScore);
            }, 0);
            const h2hGoalsAgainst = h2hResults.reduce((sum, r) => {
              return sum + (r.homeClub.id === currentClub.id ? r.awayScore : r.homeScore);
            }, 0);

            return h2hResults.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.2 }}
              >
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-1.5">
                      <Swords className="w-3 h-3" /> Head-to-Head
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {/* H2H Summary */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-black text-emerald-400">{h2hWins}</p>
                        <p className="text-[9px] text-emerald-400/70 font-medium">Wins</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-black text-amber-400">{h2hDraws}</p>
                        <p className="text-[9px] text-amber-400/70 font-medium">Draws</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-black text-red-400">{h2hLosses}</p>
                        <p className="text-[9px] text-red-400/70 font-medium">Losses</p>
                      </div>
                    </div>

                    {/* Goal summary */}
                    <div className="flex items-center justify-between text-[10px] mb-3 px-1">
                      <span className="text-[#8b949e]">Goals: <span className="text-emerald-400 font-bold">{h2hGoalsFor}</span> - <span className="text-red-400 font-bold">{h2hGoalsAgainst}</span></span>
                      <span className="text-[#8b949e]">{h2hResults.length} meeting{h2hResults.length > 1 ? 's' : ''}</span>
                    </div>

                    {/* Recent H2H Results */}
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {h2hResults.map((r, i) => {
                        const isPlayerHome = r.homeClub.id === currentClub.id;
                        const playerGoals = isPlayerHome ? r.homeScore : r.awayScore;
                        const oppGoals = isPlayerHome ? r.awayScore : r.homeScore;
                        const result = playerGoals > oppGoals ? 'W' : playerGoals < oppGoals ? 'L' : 'D';
                        const resultColor = result === 'W' ? 'bg-emerald-500' : result === 'D' ? 'bg-amber-500' : 'bg-red-500';

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className="flex items-center gap-2 bg-[#21262d] rounded-md px-2.5 py-1.5"
                          >
                            <span className={`w-5 h-5 rounded-full ${resultColor} flex items-center justify-center text-[9px] font-black text-white shrink-0`}>
                              {result}
                            </span>
                            <span className="text-[10px] text-[#8b949e] flex-1">
                              {isPlayerHome ? 'H' : 'A'} • {r.homeClub.shortName} {r.homeScore}-{r.awayScore} {r.awayClub.shortName}
                            </span>
                            {r.playerGoals > 0 && (
                              <span className="text-[9px] text-emerald-400 font-bold">⚽{r.playerGoals}</span>
                            )}
                            <span className="text-[9px] text-[#484f58]">Wk{r.week}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-[#161b22]/50 border border-[#30363d] rounded-lg p-3 text-center"
              >
                <p className="text-[10px] text-[#484f58]">No previous meetings with {opponent.shortName}</p>
              </motion.div>
            );
          })()}

          {/* Weather Conditions */}
          <WeatherSystem season={gameState.currentSeason} week={currentWeek} />

          {/* Match Preview Analytics - 6 SVG Visualizations */}
          {preMatchAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.36, duration: 0.3 }}
            className="space-y-3"
          >
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
                <span className="text-[10px] text-[#8b949e] font-semibold flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" /> Match Preview Analytics
                </span>
              </div>
              <div className="p-4 space-y-4">

                {/* Row 1: H2H Bars + Win Probability Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. SVG Head-to-Head Record Bars */}
                  <Card className="bg-[#21262d] border-[#30363d]">
                    <CardContent className="p-3">
                      <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">H2H Record</p>
                      <svg viewBox="0 0 160 90" className="w-full">
                        {(() => {
                          const maxVal = Math.max(preMatchAnalytics.h2h.wins, preMatchAnalytics.h2h.draws, preMatchAnalytics.h2h.losses, 1);
                          const bars: Array<{ label: string; val: number; color: string }> = [
                            { label: 'W', val: preMatchAnalytics.h2h.wins, color: '#10b981' },
                            { label: 'D', val: preMatchAnalytics.h2h.draws, color: '#f59e0b' },
                            { label: 'L', val: preMatchAnalytics.h2h.losses, color: '#ef4444' },
                          ];
                          return (
                            <>
                              {bars.map((b, i) => {
                                const barW = Math.max(2, (b.val / maxVal) * 120);
                                return (
                                  <g key={b.label}>
                                    <text x="8" y={22 + i * 25} fill="#8b949e" fontSize="8" fontWeight="bold">{b.label}</text>
                                    <rect x="24" y={13 + i * 25} width={barW} height="14" fill={b.color} fillOpacity="0.25" rx="3" />
                                    <rect x="24" y={13 + i * 25} width={barW} height="14" fill="none" stroke={b.color} strokeWidth="0.5" strokeOpacity="0.5" rx="3" />
                                    <text x={28 + barW} y={23 + i * 25} fill={b.color} fontSize="8" fontWeight="bold">{b.val}</text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </CardContent>
                  </Card>

                  {/* 2. SVG Win Probability Gauges */}
                  <Card className="bg-[#21262d] border-[#30363d]">
                    <CardContent className="p-3">
                      <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Win Probability</p>
                      <svg viewBox="0 0 160 90" className="w-full">
                        {(() => {
                          const homePct = preMatchAnalytics.winProb.win / 100;
                          const awayPct = preMatchAnalytics.winProb.loss / 100;
                          const bgArc = svgGaugeArc(40, 70, 35, 1);
                          const homeArc = svgGaugeArc(40, 70, 35, homePct);
                          const awayBgArc = svgGaugeArc(120, 70, 35, 1);
                          const awayArc = svgGaugeArc(120, 70, 35, awayPct);
                          return (
                            <>
                              <path d={bgArc} fill="none" stroke="#30363d" strokeWidth="6" strokeLinecap="round" />
                              <path d={homeArc} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                              <text x="40" y="58" fill="#c9d1d9" fontSize="10" fontWeight="bold" textAnchor="middle">{preMatchAnalytics.winProb.win}%</text>
                              <text x="40" y="82" fill="#10b981" fontSize="7" fontWeight="bold" textAnchor="middle">{preMatchAnalytics.clubName}</text>
                              <path d={awayBgArc} fill="none" stroke="#30363d" strokeWidth="6" strokeLinecap="round" />
                              <path d={awayArc} fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                              <text x="120" y="58" fill="#c9d1d9" fontSize="10" fontWeight="bold" textAnchor="middle">{preMatchAnalytics.winProb.loss}%</text>
                              <text x="120" y="82" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">{preMatchAnalytics.oppName}</text>
                            </>
                          );
                        })()}
                      </svg>
                    </CardContent>
                  </Card>
                </div>

                {/* 3. SVG Key Player Comparison Radar */}
                <Card className="bg-[#21262d] border-[#30363d]">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">Star Player Comparison</p>
                      <div className="flex items-center gap-2 text-[8px]">
                        <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> {preMatchAnalytics.clubName}</span>
                        <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" /> {preMatchAnalytics.oppName}</span>
                      </div>
                    </div>
                    <svg viewBox="0 0 300 180" className="w-full">
                      {(() => {
                        const cx = 150;
                        const cy = 95;
                        const maxR = 70;
                        const labels = ['PAC', 'SHO', 'PAS', 'DEF', 'PHY', 'OVR'];
                        const homeVals = [preMatchAnalytics.radar.home.pace, preMatchAnalytics.radar.home.shooting, preMatchAnalytics.radar.home.passing, preMatchAnalytics.radar.home.defending, preMatchAnalytics.radar.home.physical, preMatchAnalytics.radar.home.overall];
                        const awayVals = [preMatchAnalytics.radar.away.pace, preMatchAnalytics.radar.away.shooting, preMatchAnalytics.radar.away.passing, preMatchAnalytics.radar.away.defending, preMatchAnalytics.radar.away.physical, preMatchAnalytics.radar.away.overall];
                        const gridPaths = svgHexGridPaths(cx, cy, maxR, 4, 6);
                        const homePath = svgRadarPath(homeVals, cx, cy, maxR);
                        const awayPath = svgRadarPath(awayVals, cx, cy, maxR);
                        const angleStep = (2 * Math.PI) / 6;
                        const startAngle = -Math.PI / 2;
                        return (
                          <>
                            {gridPaths.map((p, i) => (
                              <path key={i} d={p} fill="none" stroke={i < 4 ? "#21262d" : "#30363d"} strokeWidth={i < 4 ? 0.5 : 0.3} />
                            ))}
                            <path d={homePath} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
                            <path d={awayPath} fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" />
                            {labels.map((label, i) => {
                              const a = startAngle + i * angleStep;
                              const lx = cx + (maxR + 14) * Math.cos(a);
                              const ly = cy + (maxR + 14) * Math.sin(a);
                              return <text key={label} x={lx} y={ly + 3} fill="#8b949e" fontSize="7" fontWeight="bold" textAnchor="middle">{label}</text>;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>

                {/* Row 2: Form Comparison + Importance Meter + xG */}
                <div className="grid grid-cols-3 gap-3">
                  {/* 4. SVG Recent Form Comparison */}
                  <Card className="bg-[#21262d] border-[#30363d]">
                    <CardContent className="p-3">
                      <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Recent Form</p>
                      <svg viewBox="0 0 120 70" className="w-full">
                        <text x="5" y="10" fill="#10b981" fontSize="7" fontWeight="bold">H</text>
                        <text x="5" y="40" fill="#ef4444" fontSize="7" fontWeight="bold">A</text>
                        {preMatchAnalytics.form.home.map((r, i) => {
                          const color = r === 'W' ? '#10b981' : r === 'D' ? '#f59e0b' : '#ef4444';
                          return <circle key={`hf-${i}`} cx={25 + i * 18} cy="8" r="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.7" />;
                        })}
                        {preMatchAnalytics.form.away.map((r, i) => {
                          const color = r === 'W' ? '#10b981' : r === 'D' ? '#f59e0b' : '#ef4444';
                          return <circle key={`af-${i}`} cx={25 + i * 18} cy="38" r="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.7" />;
                        })}
                        {preMatchAnalytics.form.home.map((r, i) => {
                          return <text key={`hft-${i}`} x={25 + i * 18} y="11" fill="#c9d1d9" fontSize="6" fontWeight="bold" textAnchor="middle">{r}</text>;
                        })}
                        {preMatchAnalytics.form.away.map((r, i) => {
                          return <text key={`aft-${i}`} x={25 + i * 18} y="41" fill="#c9d1d9" fontSize="6" fontWeight="bold" textAnchor="middle">{r}</text>;
                        })}
                        {[0, 1, 2, 3, 4].map(i => (
                          <text key={`mt-${i}`} x={25 + i * 18} y="65" fill="#484f58" fontSize="5" textAnchor="middle">{i + 1}</text>
                        ))}
                      </svg>
                    </CardContent>
                  </Card>

                  {/* 5. SVG Match Importance Meter */}
                  <Card className="bg-[#21262d] border-[#30363d]">
                    <CardContent className="p-3">
                      <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Importance</p>
                      <svg viewBox="0 0 120 70" className="w-full">
                        {(() => {
                          const pct = preMatchAnalytics.importance / 100;
                          const barH = Math.max(4, pct * 46);
                          const color = pct > 0.8 ? '#ef4444' : pct > 0.6 ? '#f59e0b' : '#10b981';
                          const label = pct > 0.8 ? 'CRITICAL' : pct > 0.6 ? 'HIGH' : pct > 0.4 ? 'MEDIUM' : 'LOW';
                          return (
                            <>
                              <rect x="20" y="8" width="36" height="48" fill="#0d1117" rx="4" stroke="#30363d" strokeWidth="0.5" />
                              <rect x="24" y={52 - barH} width="28" height={barH} fill={color} fillOpacity="0.3" rx="2" />
                              <rect x="24" y={52 - barH} width="28" height={barH} fill="none" stroke={color} strokeWidth="0.7" rx="2" />
                              <text x="38" y="6" fill="#c9d1d9" fontSize="8" fontWeight="bold" textAnchor="middle">{preMatchAnalytics.importance}</text>
                              <text x="72" y="28" fill={color} fontSize="7" fontWeight="bold">{label}</text>
                              <text x="72" y="40" fill="#484f58" fontSize="6">/ 100</text>
                              {[0, 1, 2, 3].map(i => (
                                <line key={i} x1="20" y1={20 + i * 12} x2="56" y2={20 + i * 12} stroke="#30363d" strokeWidth="0.3" />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </CardContent>
                  </Card>

                  {/* 6. SVG Expected Goals Projection */}
                  <Card className="bg-[#21262d] border-[#30363d]">
                    <CardContent className="p-3">
                      <p className="text-[9px] text-[#8b949e] font-semibold mb-2 uppercase tracking-wider">Expected Goals</p>
                      <svg viewBox="0 0 120 70" className="w-full">
                        {(() => {
                          const homeXG = preMatchAnalytics.xG.home;
                          const awayXG = preMatchAnalytics.xG.away;
                          const totalXG = homeXG + awayXG;
                          const maxVal = Math.max(homeXG, awayXG, totalXG, 0.5);
                          const barMaxH = 44;
                          const groups = [
                            { label: 'H', val: homeXG, color: '#10b981' },
                            { label: 'A', val: awayXG, color: '#ef4444' },
                            { label: 'T', val: totalXG, color: '#38bdf8' },
                          ];
                          return (
                            <>
                              {groups.map((g, i) => {
                                const h = Math.max(3, (g.val / maxVal) * barMaxH);
                                const x = 12 + i * 38;
                                return (
                                  <g key={g.label}>
                                    <rect x={x} y={55 - h} width="26" height={h} fill={g.color} fillOpacity="0.2" rx="3" />
                                    <rect x={x} y={55 - h} width="26" height={h} fill="none" stroke={g.color} strokeWidth="0.6" rx="3" />
                                    <text x={x + 13} y={52 - h} fill={g.color} fontSize="7" fontWeight="bold" textAnchor="middle">{g.val.toFixed(1)}</text>
                                    <text x={x + 13} y="65" fill="#8b949e" fontSize="7" fontWeight="bold" textAnchor="middle">{g.label}</text>
                                  </g>
                                );
                              })}
                              {[0, 1, 2, 3].map(i => (
                                <line key={i} x1="8" y1={18 + i * 11} x2="118" y2={18 + i * 11} stroke="#30363d" strokeWidth="0.3" />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
          )}

          {/* Web3 Gritty Futurism: Deep Match Intelligence */}
          {preMatchAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.3 }}
            className="space-y-3"
          >
            <div className="bg-[#111111] border border-[#00E5FF]/10 overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#00E5FF]/10">
                <p className="text-[10px] text-[#00E5FF] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: W3_FONT }}>
                  ◆ Deep Match Intelligence
                </p>
                <p className="text-[8px] text-[#666666] mt-0.5" style={{ fontFamily: W3_FONT }}>Probability modeling, historical trends, and positional analysis via Web3 data pipelines.</p>
              </div>
              <div className="p-3 space-y-3">
                {(() => {
                  const wp = preMatchAnalytics.winProb;
                  const donutSegs = [
                    { label: 'WIN', value: wp.win, color: '#CCFF00' },
                    { label: 'DRAW', value: Math.round(wp.draw * 0.6), color: '#00E5FF' },
                    { label: 'LOSS', value: wp.loss, color: '#FF5500' },
                    { label: 'ET', value: Math.round(wp.draw * 0.4), color: '#888888' },
                  ];
                  const h2hRaw = gameState.recentResults.filter(r =>
                    (r.homeClub.id === currentClub.id || r.awayClub.id === currentClub.id) &&
                    (r.homeClub.id === opponent.id || r.awayClub.id === opponent.id)
                  ).slice(0, 8);
                  const paddedH2H = Array.from({ length: 8 }, (_, i) => {
                    if (i < h2hRaw.length) {
                      const r = h2hRaw[i];
                      return { week: r.week, homeScore: r.homeScore, awayScore: r.awayScore, isPlayerHome: r.homeClub.id === currentClub.id };
                    }
                    const s = currentClub.squadQuality * (i + 1) * 7 + opponent.squadQuality * (i + 1) * 13;
                    return { week: gameState.currentWeek - (8 - i), homeScore: Math.round(seededRandom(s) * 3), awayScore: Math.round(seededRandom(s + 1) * 3), isPlayerHome: seededRandom(s + 2) > 0.5 };
                  });
                  const matchupLabels = ['PAC', 'SHO', 'PAS', 'DEF', 'PHY'];
                  const playerVals = [player.attributes.pace, player.attributes.shooting, player.attributes.passing, player.attributes.defending, player.attributes.physical];
                  const oppVals = Array.from({ length: 5 }, (_, i) =>
                    Math.max(30, Math.min(95, opponent.squadQuality - 10 + Math.round(seededRandom(opponent.squadQuality * (i + 3) * 11) * 20)))
                  );
                  const qd = currentClub.squadQuality - opponent.squadQuality;
                  const posLabels = ['LWB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST'];
                  const posValues = Array.from({ length: 8 }, (_, i) =>
                    Math.max(15, Math.min(95, Math.round(50 + qd * 0.3 + seededRandom(currentClub.squadQuality * (i + 1) * 7 + opponent.squadQuality * (i + 1) * 13) * 30 - 15)))
                  );
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <MatchExpectationDonut segments={donutSegs} />
                        <KeyPlayerMatchupRadar playerVals={playerVals} oppVals={oppVals} labels={matchupLabels} />
                      </div>
                      <HistoricalH2HTimeline results={paddedH2H} />
                      <PositionalBattleArea values={posValues} labels={posLabels} />
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
          )}

          {/* Tactical Setup Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.2 }}
          >
            <Button
              onClick={() => setShowTacticalSetup(true)}
              variant="outline"
              className="w-full h-11 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg font-semibold gap-2"
            >
              <Radio className="w-4 h-4" />
              Tactical Setup
            </Button>
          </motion.div>

          {/* Pre-Match Press Conference Button */}
          {opponent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.2 }}
            >
              <Button
                onClick={() => { setPressConferenceType('pre-match'); setShowPressConference(true); }}
                variant="outline"
                className="w-full h-11 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg font-semibold gap-2"
              >
                <span className="text-lg">🎙️</span>
                Pre-Match Press Conference
              </Button>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="space-y-3"
          >
            <Button
              onClick={handlePlayMatch}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-700 mr-2"><Play className="h-5 w-5" /></span>
              Play Match
            </Button>
            <Button
              onClick={handleSimulate}
              variant="outline"
              className="w-full h-10 border-[#30363d] text-[#8b949e] rounded-lg text-sm hover:bg-[#21262d] hover:text-[#c9d1d9] transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#21262d] mr-2"><FastForward className="h-4 w-4" /></span>
              Quick Simulate
            </Button>
          </motion.div>

          {/* Pre-Match Press Conference Modal */}
          {opponent && (
            <PressConference
              type="pre-match"
              open={showPressConference && pressConferenceType === 'pre-match'}
              onClose={() => setShowPressConference(false)}
              opponentName={opponent.shortName || opponent.name}
              playerForm={player.form}
              playerMorale={player.morale}
            />
          )}

          {/* Tactical Setup Modal */}
          <TacticalSetup
            isOpen={showTacticalSetup}
            onClose={() => setShowTacticalSetup(false)}
            playerPosition={player.position}
            playerAttributes={player.attributes}
          />
        </>
      ) : (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-[#484f58] mb-3" />
            <p className="text-[#8b949e]">No match this week</p>
            <p className="text-xs text-[#484f58] mt-1">Advance the week to continue</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => advanceWeek()} variant="outline" className="w-full border-[#30363d] text-[#c9d1d9] rounded-lg">
        <ArrowRight className="mr-2 h-4 w-4" />
        Advance Week (No Match)
      </Button>
    </div>
  );
}

// -----------------------------------------------------------
// Stat Bar Component for Match Stats
// -----------------------------------------------------------
function StatBar({
  homeValue,
  awayValue,
  homeLabel,
  awayLabel,
  title,
  homeClubbName,
  awayClubName,
}: {
  homeValue: number;
  awayValue: number;
  homeLabel: string;
  awayLabel: string;
  title: string;
  homeClubbName: string;
  awayClubName: string;
}) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;

  return (
    <div>
      <p className="text-[10px] text-[#8b949e] text-center mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold w-8 text-right ${homeValue > awayValue ? 'text-white' : 'text-[#8b949e]'}`}>{homeLabel}</span>
        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[#21262d]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${homePercent}%` }}
            transition={{ delay: 0.6, duration: 0.2 }}
            className="bg-sky-500/70 rounded-l-full"
            style={{ direction: 'rtl' }}
          />
          <div className="flex-1 bg-rose-500/70 rounded-r-full" />
        </div>
        <span className={`text-xs font-bold w-8 ${awayValue > homeValue ? 'text-white' : 'text-[#8b949e]'}`}>{awayLabel}</span>
      </div>
    </div>
  );
}
