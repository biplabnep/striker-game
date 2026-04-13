'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { randomBetween, randomFloatBetween, randomChoice, clamp } from '@/lib/game/gameUtils';
import type { Club, MatchEvent, MatchEventType, MatchResult } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio, Clock, Trophy, Gauge, SkipForward, ChevronRight,
  Star, Zap, Activity, Target, TrendingUp, BarChart3,
  Play, Pause, Crown, Footprints, Eye, ArrowLeft,
  Flame, MessageSquare, Shield
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type MatchPhase = 'pre_match' | 'live' | 'half_time' | 'full_time';
type SimSpeed = 1 | 2 | 5;

interface LiveStat {
  homePossession: number;
  homeShots: number;
  homeShotsOnTarget: number;
  homePasses: number;
  homeTackles: number;
  homeFouls: number;
  homeCorners: number;
  awayPossession: number;
  awayShots: number;
  awayShotsOnTarget: number;
  awayPasses: number;
  awayTackles: number;
  awayFouls: number;
  awayCorners: number;
}

interface CommentaryLine {
  minute: number;
  text: string;
  type: 'goal' | 'chance' | 'tactical' | 'injury' | 'halftime' | 'general' | 'card' | 'substitution' | 'save';
}

interface PlayerPerformance {
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  passesCompleted: number;
  passesAttempted: number;
  tackles: number;
  distanceKm: number;
}

// ============================================================
// Seeded random number generator
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ============================================================
// Commentary generators
// ============================================================
const GOAL_COMMENTARY = [
  "{name} finds the back of the net! What a finish!",
  "GOAL! {name} with a superb strike! The crowd erupts!",
  "It's in! {name} scores — clinical finishing from the {team} player!",
  "{name} makes no mistake! A brilliant goal for {team}!",
  "And it's a goal! {name} delivers when it matters most!",
];

const CHANCE_MISSED = [
  "{name} fires wide! That was a golden opportunity.",
  "Just over the bar from {name}! So close to breaking the deadlock.",
  "{name} can't quite get the angle right — the shot goes agonizingly wide.",
  "Saved! The goalkeeper denies {name} with a superb stop.",
  "{name} heads it just wide of the post. Nearly!",
];

const TACTICAL_COMMENTARY = [
  "{team} are dominating possession in the midfield area.",
  "A tactical shift from {team} — they're pressing higher up the pitch now.",
  "Good passing sequences from {team} as they look to unlock the defense.",
  "{team} have settled into a solid defensive shape here.",
  "The tempo has picked up in the last few minutes.",
  "Both sides are battling hard in midfield — end-to-end stuff.",
  "{team} are looking dangerous on the counter-attack.",
  "A well-worked set-piece routine from {team} comes to nothing.",
];

const INJURY_COMMENTARY = [
  "{name} is down and receiving treatment. The medical staff are on the pitch.",
  "Concerns for {name} here — looks like a painful knock.",
  "A brief stoppage as {name} gets some attention from the physio.",
];

const CARD_COMMENTARY = [
  "Yellow card for {name}. The referee has had enough of that.",
  "{name} goes into the book. A reckless challenge.",
  "The referee shows a yellow to {name} for persistent fouling.",
];

const SUB_COMMENTARY = [
  "A substitution for {team}. {name} comes off to applause.",
  "Tactical change: {name} is replaced for {team}.",
  "{team} make a change — {name} enters the fray.",
];

const SAVE_COMMENTARY = [
  "What a save! The goalkeeper pulls off a stunning stop!",
  "Denied! A brilliant reflex save keeps the score level.",
  "The keeper is equal to it — fingertip save!",
];

const HALFTIME_COMMENTARY = [
  "The referee blows for half-time. An intriguing first half comes to a close.",
  "Half-time. Both teams will have plenty to discuss in the dressing room.",
  "And that's the break. The managers will be looking for improvements in the second half.",
];

const GENERAL_COMMENTARY = [
  "The match is being played at a good tempo here.",
  "Both teams showing attacking intent in the early stages.",
  "The atmosphere inside the stadium is electric tonight.",
  "Solid defending from both sides so far in this contest.",
  "A well-contested match developing here.",
  "The pitch is in excellent condition, ideal for passing football.",
  "Both sets of fans are in full voice, creating a fantastic atmosphere.",
];

function getCommentaryText(
  type: CommentaryLine['type'],
  playerName: string,
  teamName: string
): string {
  const pool = {
    goal: GOAL_COMMENTARY,
    chance: CHANCE_MISSED,
    tactical: TACTICAL_COMMENTARY,
    injury: INJURY_COMMENTARY,
    card: CARD_COMMENTARY,
    substitution: SUB_COMMENTARY,
    save: SAVE_COMMENTARY,
    halftime: HALFTIME_COMMENTARY,
    general: GENERAL_COMMENTARY,
  };
  const templates = pool[type] || pool.general;
  return randomChoice(templates).replace('{name}', playerName).replace('{team}', teamName);
}

// ============================================================
// Mock player name generator for lineups
// ============================================================
const MOCK_FIRST = [
  'James', 'Marcus', 'Oliver', 'Ethan', 'Lucas', 'Daniel', 'Harry', 'Jack',
  'Mohamed', 'Rafael', 'Pedro', 'Carlos', 'Liam', 'Noah', 'Owen', 'Mason',
  'Ryan', 'Alex', 'Theo', 'Kai', 'Ben', 'Sam', 'Max', 'Leo', 'Finn',
];
const MOCK_LAST = [
  'Williams', 'Johnson', 'Martinez', 'Silva', 'Muller', 'Brown', 'Davis',
  'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Garcia', 'Robinson', 'Clark',
  'Rodriguez', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright',
  'Lopez', 'Hill', 'Scott', 'Adams', 'Baker', 'Nelson', 'Carter',
];

function generateMockName(rng: () => number): string {
  return `${MOCK_FIRST[Math.floor(rng() * MOCK_FIRST.length)]} ${MOCK_LAST[Math.floor(rng() * MOCK_LAST.length)]}`;
}

// ============================================================
// Formation display positions (normalized 0-1 coordinates)
// ============================================================
const FORMATIONS: Record<string, { pos: string; x: number; y: number }[]> = {
  '4-3-3': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'CM', x: 0.25, y: 0.52 },
    { pos: 'CM', x: 0.5, y: 0.48 }, { pos: 'CM', x: 0.75, y: 0.52 }, { pos: 'LW', x: 0.15, y: 0.22 },
    { pos: 'ST', x: 0.5, y: 0.18 }, { pos: 'RW', x: 0.85, y: 0.22 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'LM', x: 0.12, y: 0.5 },
    { pos: 'CM', x: 0.37, y: 0.52 }, { pos: 'CM', x: 0.63, y: 0.52 }, { pos: 'RM', x: 0.88, y: 0.5 },
    { pos: 'ST', x: 0.38, y: 0.2 }, { pos: 'ST', x: 0.62, y: 0.2 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'CB', x: 0.25, y: 0.77 }, { pos: 'CB', x: 0.5, y: 0.8 },
    { pos: 'CB', x: 0.75, y: 0.77 }, { pos: 'LM', x: 0.08, y: 0.5 }, { pos: 'CM', x: 0.32, y: 0.5 },
    { pos: 'CDM', x: 0.5, y: 0.6 }, { pos: 'CM', x: 0.68, y: 0.5 }, { pos: 'RM', x: 0.92, y: 0.5 },
    { pos: 'ST', x: 0.38, y: 0.2 }, { pos: 'ST', x: 0.62, y: 0.2 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'CDM', x: 0.37, y: 0.56 },
    { pos: 'CDM', x: 0.63, y: 0.56 }, { pos: 'LW', x: 0.18, y: 0.35 }, { pos: 'CAM', x: 0.5, y: 0.38 },
    { pos: 'RW', x: 0.82, y: 0.35 }, { pos: 'ST', x: 0.5, y: 0.18 },
  ],
};

const DEFAULT_FORMATION = '4-3-3';

// ============================================================
// Formation SVG Component
// ============================================================
function FormationDisplay({
  formation,
  isHome,
  playerTeamSide,
  playerPosIdx,
}: {
  formation: string;
  isHome: boolean;
  playerTeamSide: 'home' | 'away' | null;
  playerPosIdx: number | null;
}) {
  const positions = FORMATIONS[formation] || FORMATIONS[DEFAULT_FORMATION];
  const isPlayerTeam = playerTeamSide === (isHome ? 'home' : 'away');
  const accentColor = isHome ? '#38bdf8' : '#fb7185';
  const dims = { w: 120, h: 140 };

  // Mirror Y for away team (flip pitch view)
  const transformY = (y: number) => (isHome ? y : 1 - y);

  return (
    <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full h-full">
      {/* Pitch background */}
      <rect x="0" y="0" width={dims.w} height={dims.h} fill="#0d1117" rx="4" />
      {/* Center line */}
      <line x1="0" y1={dims.h / 2} x2={dims.w} y2={dims.h / 2} stroke="#21262d" strokeWidth="0.5" />
      {/* Center circle */}
      <circle cx={dims.w / 2} cy={dims.h / 2} r="12" fill="none" stroke="#21262d" strokeWidth="0.4" />
      {/* Penalty areas */}
      <rect x="20" y={isHome ? dims.h - 25 : 0} width={dims.w - 40} height="25" fill="none" stroke="#21262d" strokeWidth="0.4" rx="2" />
      <rect x="35" y={isHome ? dims.h - 15 : 0} width={dims.w - 70} height="15" fill="none" stroke="#21262d" strokeWidth="0.4" rx="1" />
      {/* Formation label */}
      <text x={dims.w / 2} y="10" textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="monospace" fontWeight="bold">{formation}</text>

      {/* Player dots */}
      {positions.map((p, i) => {
        const px = p.x * dims.w;
        const py = transformY(p.y) * dims.h;
        const isPlayerDot = isPlayerTeam && playerPosIdx === i;
        return (
          <g key={i}>
            <circle
              cx={px}
              cy={py}
              r={isPlayerDot ? 5 : 3.5}
              fill={isPlayerDot ? '#fbbf24' : accentColor}
              opacity={isPlayerDot ? 1 : 0.85}
            />
            {isPlayerDot && (
              <circle cx={px} cy={py} r="7" fill="none" stroke="#fbbf24" strokeWidth="0.6" opacity="0.6" />
            )}
            <text
              x={px}
              y={py + (isPlayerDot ? 10 : 8.5)}
              textAnchor="middle"
              fill={isPlayerDot ? '#fbbf24' : '#8b949e'}
              fontSize={isPlayerDot ? '4.5' : '3.5'}
              fontFamily="monospace"
              fontWeight={isPlayerDot ? 'bold' : 'normal'}
            >
              {isPlayerDot ? 'YOU' : p.pos}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Momentum Bar SVG
// ============================================================
function MomentumBar({ homeMomentum, awayMomentum }: { homeMomentum: number; awayMomentum: number }) {
  const total = homeMomentum + awayMomentum;
  const homePct = total > 0 ? (homeMomentum / total) * 100 : 50;
  const awayPct = 100 - homePct;

  return (
    <svg viewBox="0 0 300 24" className="w-full" style={{ height: '24px' }}>
      <defs>
        <clipPath id="momLeft">
          <rect x="0" y="2" width={homePct * 1.5} height="20" rx="3" />
        </clipPath>
        <clipPath id="momRight">
          <rect x={300 - awayPct * 1.5} y="2" width={awayPct * 1.5} height="20" rx="3" />
        </clipPath>
      </defs>
      {/* Background */}
      <rect x="0" y="2" width="300" height="20" rx="3" fill="#21262d" />
      {/* Home bar (left aligned) */}
      <rect x="0" y="2" width={homePct * 1.5} height="20" fill="#38bdf8" opacity="0.8" clipPath="url(#momLeft)" />
      {/* Away bar (right aligned) */}
      <rect x={300 - awayPct * 1.5} y="2" width={awayPct * 1.5} height="20" fill="#fb7185" opacity="0.8" clipPath="url(#momRight)" />
      {/* Center divider */}
      <line x1="150" y1="2" x2="150" y2="22" stroke="#0d1117" strokeWidth="1.5" />
      {/* Labels */}
      <text x="12" y="16" fill="#c9d1d9" fontSize="8" fontFamily="monospace" fontWeight="bold">{Math.round(homePct)}%</text>
      <text x="288" y="16" fill="#c9d1d9" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">{Math.round(awayPct)}%</text>
    </svg>
  );
}

// ============================================================
// Stat comparison bar
// ============================================================
function StatBar({ home, away, label }: { home: number; away: number; label: string }) {
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-right font-mono font-bold text-[#c9d1d9]">{home}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="flex justify-between text-[8px] text-[#484f58] font-semibold uppercase tracking-wider">
          <span className={homePct >= 50 ? 'text-[#38bdf8]' : ''}>{label}</span>
        </div>
        <div className="flex h-1.5 rounded-sm overflow-hidden bg-[#21262d]">
          <div className="bg-[#38bdf8] rounded-l-sm" style={{ width: `${homePct}%` }} />
          <div className="bg-[#fb7185] rounded-r-sm" style={{ width: `${100 - homePct}%` }} />
        </div>
      </div>
      <span className="w-10 text-left font-mono font-bold text-[#c9d1d9]">{away}</span>
    </div>
  );
}

// ============================================================
// Match Event Timeline SVG
// ============================================================
function MatchEventTimeline({ events, currentMinute }: { events: MatchEvent[]; currentMinute: number }) {
  const w = 340;
  const h = 36;
  const padX = 20;
  const padY = 10;
  const trackW = w - padX * 2;

  const colorMap: Record<string, string> = {
    goal: '#34d399',
    yellow_card: '#fbbf24',
    red_card: '#ef4444',
    substitution: '#38bdf8',
  };

  const xForMinute = (min: number) => padX + (min / 90) * trackW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '36px' }}>
      <rect x={padX} y={h / 2 - 1} width={trackW} height="2" rx="1" fill="#21262d" />
      <rect x={padX} y={h / 2 - 1} width={((currentMinute / 90) * trackW)} height="2" rx="1" fill="#38bdf8" opacity="0.6" />
      <line x1={xForMinute(45)} y1={h / 2 - 5} x2={xForMinute(45)} y2={h / 2 + 5} stroke="#484f58" strokeWidth="0.5" />
      <text x={padX} y={h - 2} fill="#484f58" fontSize="6" fontFamily="monospace">0&apos;</text>
      <text x={padX + trackW} y={h - 2} fill="#484f58" fontSize="6" fontFamily="monospace" textAnchor="end">90&apos;</text>
      {events.map((e, i) => {
        const x = xForMinute(e.minute);
        const color = colorMap[e.type] || '#8b949e';
        return (
          <g key={`evt-${e.minute}-${e.type}-${i}`}>
            <circle cx={x} cy={h / 2} r="3" fill={color} />
            <circle cx={x} cy={h / 2} r="5" fill={color} opacity="0.25" />
          </g>
        );
      })}
      <circle cx={xForMinute(currentMinute)} cy={h / 2} r="2" fill="white" opacity="0.9" />
    </svg>
  );
}

// ============================================================
// Enhanced Center-Extended Stat Bar
// ============================================================
function EnhancedStatBar({ home, away, label }: { home: number; away: number; label: string }) {
  const maxVal = Math.max(home, away, 1);
  const homePct = (home / maxVal) * 40;
  const awayPct = (away / maxVal) * 40;

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-8 text-right font-mono font-bold text-[#c9d1d9]">{home}</span>
      <div className="flex-1 flex items-center">
        <div className="flex-1 flex justify-end">
          <div className="h-2 bg-[#38bdf8] rounded-l-sm" style={{ width: `${homePct}%`, opacity: homePct > 0 ? 0.8 : 0 }} />
        </div>
        <span className="w-14 text-center text-[8px] text-[#8b949e] font-semibold uppercase tracking-wider">{label}</span>
        <div className="flex-1">
          <div className="h-2 bg-[#fb7185] rounded-r-sm" style={{ width: `${awayPct}%`, opacity: awayPct > 0 ? 0.8 : 0 }} />
        </div>
      </div>
      <span className="w-8 text-left font-mono font-bold text-[#c9d1d9]">{away}</span>
    </div>
  );
}

// ============================================================
// Momentum Area Chart SVG
// ============================================================
function MomentumAreaChart({ history }: { history: { minute: number; home: number; away: number }[] }) {
  if (history.length < 2) return null;

  const w = 340;
  const h = 60;
  const padX = 10;
  const padY = 8;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;
  const midY = padY + trackH / 2;

  const points = history.map((d, i) => {
    const x = padX + (i / (history.length - 1)) * trackW;
    const diff = d.home - d.away;
    const normalizedY = midY - (diff / 80) * (trackH / 2);
    return { x, y: Math.max(padY, Math.min(padY + trackH, normalizedY)) };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${midY} L${points[0].x},${midY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '60px' }}>
      <rect x="0" y="0" width={w} height={h} rx="4" fill="#0d1117" />
      <line x1={padX} y1={midY} x2={padX + trackW} y2={midY} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
      <text x={padX + 2} y={padY + 4} fill="#38bdf8" fontSize="5" fontFamily="monospace" opacity="0.6">HOME</text>
      <text x={padX + 2} y={padY + trackH - 1} fill="#fb7185" fontSize="5" fontFamily="monospace" opacity="0.6">AWAY</text>
      <path d={areaPath} fill="#38bdf8" opacity="0.12" />
      <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="0.8" fill="#38bdf8" opacity="0.5" />
      ))}
    </svg>
  );
}

// ============================================================
// Commentary Event Icon (inline SVG)
// ============================================================
function CommentaryEventIcon({ type }: { type: CommentaryLine['type'] }) {
  const size = 14;
  switch (type) {
    case 'goal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" fill="#34d399" opacity="0.2" />
          <circle cx="12" cy="12" r="6" fill="none" stroke="#34d399" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'card':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <rect x="6" y="4" width="12" height="16" rx="2" fill="#fbbf24" opacity="0.3" />
          <rect x="7" y="5" width="10" height="14" rx="1.5" fill="#fbbf24" opacity="0.7" />
        </svg>
      );
    case 'substitution':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <path d="M7 16l-4-4 4-4M17 8l4 4-4 4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case 'save':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="6" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" />
          <path d="M9 12l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'halftime':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <rect x="4" y="8" width="16" height="8" rx="2" fill="#fbbf24" opacity="0.2" />
          <rect x="10" y="10" width="4" height="4" rx="1" fill="#fbbf24" opacity="0.6" />
        </svg>
      );
    case 'chance':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="8" fill="none" stroke="#fb923c" strokeWidth="1" opacity="0.3" />
          <path d="M12 6v6l4 2" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="3" fill="#484f58" />
        </svg>
      );
  }
}

// ============================================================
// Player Rating Card
// ============================================================
function PlayerRatingCard({
  name, position, rating, goals, assists, isHome
}: {
  name: string; position: string; rating: number; goals: number; assists: number; isHome: boolean;
}) {
  const ratingColor = rating >= 8 ? 'text-emerald-400 bg-emerald-500/15' :
    rating >= 7 ? 'text-sky-400 bg-sky-500/15' :
    rating >= 6 ? 'text-[#c9d1d9] bg-[#21262d]' :
    'text-orange-400 bg-orange-500/15';
  const accent = isHome ? '#38bdf8' : '#fb7185';

  return (
    <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-2.5 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#21262d] border border-[#30363d]">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" fill={accent} opacity="0.7" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={accent} opacity="0.5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#c9d1d9] font-bold truncate">{name}</p>
        <div className="flex items-center gap-1.5 text-[9px] text-[#8b949e]">
          <span>{position}</span>
          {goals > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-400">
              <svg width="8" height="8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {goals}
            </span>
          )}
          {assists > 0 && (
            <span className="flex items-center gap-0.5 text-sky-400">
              <svg width="8" height="8" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {assists}
            </span>
          )}
        </div>
      </div>
      <div className={`rounded-lg px-2 py-1 text-center ${ratingColor}`}>
        <span className="text-xs font-black">{rating.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MatchDayLive() {
  const gameState = useGameStore(state => state.gameState);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const setScreen = useGameStore(state => state.setScreen);

  // Phase management
  const [phase, setPhase] = useState<MatchPhase>('pre_match');
  const [matchMinute, setMatchMinute] = useState(0);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [isPaused, setIsPaused] = useState(false);

  // Match data
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [commentary, setCommentary] = useState<CommentaryLine[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStat>({
    homePossession: 50, homeShots: 0, homeShotsOnTarget: 0, homePasses: 0,
    homeTackles: 0, homeFouls: 0, homeCorners: 0,
    awayPossession: 50, awayShots: 0, awayShotsOnTarget: 0, awayPasses: 0,
    awayTackles: 0, awayFouls: 0, awayCorners: 0,
  });
  const [homeMomentum, setHomeMomentum] = useState(50);
  const [awayMomentum, setAwayMomentum] = useState(50);
  const [momentumHistory, setMomentumHistory] = useState<{ minute: number; home: number; away: number }[]>([{ minute: 0, home: 50, away: 50 }]);
  const [playerPerformance, setPlayerPerformance] = useState<PlayerPerformance>({
    rating: 6.0, minutesPlayed: 0, goals: 0, assists: 0, shots: 0,
    passesCompleted: 0, passesAttempted: 0, tackles: 0, distanceKm: 0,
  });

  // Match metadata
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [playerTeamSide, setPlayerTeamSide] = useState<'home' | 'away'>('home');
  const [playerPositionIndex, setPlayerPositionIndex] = useState<number | null>(null);
  const [lineups, setLineups] = useState<{ home: string[]; away: string[] }>({ home: [], away: [] });
  const [motmName, setMotmName] = useState('');

  // Refs
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentaryRef = useRef<HTMLDivElement>(null);
  const rngRef = useRef<() => number>(() => Math.random());
  const matchResultRef = useRef<MatchResult | null>(null);
  const goalFlashRef = useRef({ home: 0, away: 0 });
  const [goalFlash, setGoalFlash] = useState(false);

  // Derived
  const competition = 'Premier League';
  const venue = homeClub ? `${homeClub.name} Stadium` : 'Stadium';
  const weatherIcons = ['\u2600\uFE0F', '\u{1F324}\uFE0F', '\u{1F327}\uFE0F', '\u26C5'];
  const weatherIcon = weatherIcons[matchMinute % weatherIcons.length] || weatherIcons[0];

  /* eslint-disable react-hooks/set-state-in-effect */
  // Initialize match when entering pre-match
  useEffect(() => {
    if (!gameState) return;
    const { player, currentClub, upcomingFixtures } = gameState;
    const playerTeamLevel = gameState.playerTeamLevel ?? 'senior';
    const isAtYouth = playerTeamLevel === 'u18' || playerTeamLevel === 'u21';

    if (isAtYouth) {
      setScreen('dashboard');
      return;
    }

    const nextFixture = upcomingFixtures.find(
      f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );
    if (!nextFixture) {
      setScreen('dashboard');
      return;
    }

    const isHome = nextFixture.homeClubId === currentClub.id;
    const hClub = getClubById(nextFixture.homeClubId);
    const aClub = getClubById(nextFixture.awayClubId);
    if (!hClub || !aClub) return;

    setHomeClub(hClub);
    setAwayClub(aClub);
    setPlayerTeamSide(isHome ? 'home' : 'away');

    // Generate seed
    const seed = (player.overall * 137 + currentClub.quality * 53 + gameState.currentWeek * 7) | 0;
    rngRef.current = seededRandom(seed);

    // Generate lineups
    const rng = rngRef.current;
    const hFormation = hClub.formation || '4-3-3';
    const aFormation = aClub.formation || '4-3-3';
    const hPositions = FORMATIONS[hFormation] || FORMATIONS[DEFAULT_FORMATION];
    const aPositions = FORMATIONS[aFormation] || FORMATIONS[DEFAULT_FORMATION];

    // Determine player position index
    const playerPos = player.position;
    const targetPositions = isHome ? hPositions : aPositions;
    let pIdx = targetPositions.findIndex(p => p.pos === playerPos);
    if (pIdx === -1) pIdx = targetPositions.findIndex(p => p.pos === 'ST' || p.pos === 'CM');
    if (pIdx === -1) pIdx = 2; // default CB
    setPlayerPositionIndex(pIdx);

    const hNames: string[] = [];
    const aNames: string[] = [];
    for (let i = 0; i < 11; i++) {
      hNames.push(i === pIdx && isHome ? player.name : generateMockName(rng));
      aNames.push(i === pIdx && !isHome ? player.name : generateMockName(rng));
    }
    setLineups({ home: hNames, away: aNames });
  }, [gameState, setScreen]);

  // Auto-scroll commentary
  useEffect(() => {
    if (commentaryRef.current) {
      commentaryRef.current.scrollTop = commentaryRef.current.scrollHeight;
    }
  }, [commentary.length]);

  // Goal flash detection
  useEffect(() => {
    const prev = goalFlashRef.current;
    if (homeScore !== prev.home || awayScore !== prev.away) {
      goalFlashRef.current = { home: homeScore, away: awayScore };
      const showTimer = setTimeout(() => setGoalFlash(true), 0);
      const hideTimer = setTimeout(() => setGoalFlash(false), 900);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, [homeScore, awayScore]);

  // Half-time / Full-time transition
  useEffect(() => {
    if (phase === 'live' && matchMinute === 45 && homeMomentum + awayMomentum > 0) {
      setCommentary(prev => [...prev, {
        minute: 45,
        text: getCommentaryText('halftime', '', ''),
        type: 'halftime',
      }]);
      setPhase('half_time');
      setIsPaused(true);
    }
  }, [matchMinute, phase, homeMomentum, awayMomentum, playerTeamSide, homeClub, awayClub]);

  // Simulation tick — generates events per minute
  const simulateMinute = useCallback((minute: number) => {
    const rng = rngRef.current;
    if (!homeClub || !awayClub || !gameState) return;

    const hQ = homeClub.quality;
    const aQ = awayClub.quality;
    const qDiff = hQ - aQ;
    const isPlayerMinute = minute <= 90 && playerPerformance.minutesPlayed >= 0;

    // Update player minutes
    setPlayerPerformance(prev => ({
      ...prev,
      minutesPlayed: minute,
      distanceKm: parseFloat((minute * randomFloatBetween(0.09, 0.13)).toFixed(1)),
    }));

    // Update momentum with random drift
    const homeDrift = randomFloatBetween(-3, 3) + qDiff * 0.1;
    const awayDrift = randomFloatBetween(-3, 3) - qDiff * 0.1;
    setHomeMomentum(prev => clamp(prev + homeDrift, 10, 90));
    setAwayMomentum(prev => clamp(prev + awayDrift, 10, 90));
    setMomentumHistory(prev => {
      const lastH = prev.length > 0 ? prev[prev.length - 1].home : 50;
      const lastA = prev.length > 0 ? prev[prev.length - 1].away : 50;
      return [...prev, { minute, home: clamp(lastH + homeDrift, 10, 90), away: clamp(lastA + awayDrift, 10, 90) }];
    });

    // Update stats gradually
    setLiveStats(prev => {
      const hPoss = clamp(50 + qDiff * 0.3 + randomFloatBetween(-1, 1), 25, 75);
      return {
        ...prev,
        homePossession: Math.round(hPoss),
        awayPossession: Math.round(100 - hPoss),
        homePasses: prev.homePasses + Math.round(randomBetween(3, 7)),
        awayPasses: prev.awayPasses + Math.round(randomBetween(3, 7)),
        homeTackles: prev.homeTackles + (rng() < 0.3 ? 1 : 0),
        awayTackles: prev.awayTackles + (rng() < 0.3 ? 1 : 0),
        homeFouls: prev.homeFouls + (rng() < 0.12 ? 1 : 0),
        awayFouls: prev.awayFouls + (rng() < 0.12 ? 1 : 0),
        homeCorners: prev.homeCorners + (rng() < 0.06 ? 1 : 0),
        awayCorners: prev.awayCorners + (rng() < 0.06 ? 1 : 0),
      };
    });

    // Passes for player
    setPlayerPerformance(prev => {
      const attempted = prev.passesAttempted + randomBetween(1, 4);
      const completed = prev.passesCompleted + randomBetween(1, Math.min(attempted, 3));
      return { ...prev, passesAttempted: attempted, passesCompleted: completed };
    });

    // ---- Event generation ----
    const roll = rng();

    if (roll < 0.04) {
      // Goal chance (4% per minute)
      const isHomeGoal = rng() < (0.5 + qDiff * 0.005);
      const scoringTeam = isHomeGoal ? 'home' : 'away';
      const scoringNames = isHomeGoal ? lineups.home : lineups.away;
      const scorerIdx = randomBetween(0, scoringNames.length - 1);
      const scorer = scoringNames[scorerIdx];
      const isPlayerGoal = (isHomeGoal && playerTeamSide === 'home' && scorerIdx === playerPositionIndex)
        || (!isHomeGoal && playerTeamSide === 'away' && scorerIdx === playerPositionIndex);

      if (isHomeGoal) {
        setHomeScore(prev => prev + 1);
      } else {
        setAwayScore(prev => prev + 1);
      }

      // Shots update
      setLiveStats(prev => isHomeGoal
        ? { ...prev, homeShots: prev.homeShots + 1, homeShotsOnTarget: prev.homeShotsOnTarget + 1 }
        : { ...prev, awayShots: prev.awayShots + 1, awayShotsOnTarget: prev.awayShotsOnTarget + 1 }
      );

      const newEvent: MatchEvent = {
        minute,
        type: 'goal',
        team: scoringTeam as 'home' | 'away',
        playerName: scorer,
        playerId: isPlayerGoal ? gameState.player.id : undefined,
        detail: `${scorer} scores!`,
      };
      setMatchEvents(prev => [...prev, newEvent]);

      const teamLabel = isHomeGoal
        ? (homeClub?.shortName || 'Home')
        : (awayClub?.shortName || 'Away');
      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('goal', scorer, teamLabel),
        type: 'goal',
      }]);

      // Update player performance
      if (isPlayerGoal) {
        setPlayerPerformance(prev => ({
          ...prev,
          goals: prev.goals + 1,
          rating: clamp(prev.rating + 0.5, 4, 10),
        }));
      }

    } else if (roll < 0.08) {
      // Shot off target / saved (4%)
      const isHomeShot = rng() < 0.5;
      const shootingNames = isHomeShot ? lineups.home : lineups.away;
      const shooter = shootingNames[randomBetween(0, shootingNames.length - 1)];
      const isOnTarget = rng() < 0.4;
      const isPlayerShot = (isHomeShot && playerTeamSide === 'home')
        || (!isHomeShot && playerTeamSide === 'away');

      setLiveStats(prev => isHomeShot
        ? { ...prev, homeShots: prev.homeShots + 1, ...(isOnTarget ? { homeShotsOnTarget: prev.homeShotsOnTarget + 1 } : {}) }
        : { ...prev, awayShots: prev.awayShots + 1, ...(isOnTarget ? { awayShotsOnTarget: prev.awayShotsOnTarget + 1 } : {}) }
      );

      if (isPlayerShot) {
        setPlayerPerformance(prev => ({
          ...prev,
          shots: prev.shots + 1,
          rating: isOnTarget ? clamp(prev.rating + 0.05, 4, 10) : prev.rating,
        }));
      }

      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('chance', shooter, isHomeShot ? (homeClub?.shortName || 'Home') : (awayClub?.shortName || 'Away')),
        type: 'chance',
      }]);

    } else if (roll < 0.095) {
      // Yellow card (1.5%)
      const isHomeCard = rng() < 0.5;
      const cardNames = isHomeCard ? lineups.home : lineups.away;
      const cardPlayer = cardNames[randomBetween(0, cardNames.length - 1)];

      setMatchEvents(prev => [...prev, {
        minute,
        type: 'yellow_card',
        team: (isHomeCard ? 'home' : 'away') as 'home' | 'away',
        playerName: cardPlayer,
      }]);

      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('card', cardPlayer, ''),
        type: 'card',
      }]);

    } else if (roll < 0.098) {
      // Substitution (0.3%)
      const isHomeSub = rng() < 0.5;
      const subNames = isHomeSub ? lineups.home : lineups.away;
      const subPlayer = subNames[randomBetween(1, subNames.length - 1)];

      setMatchEvents(prev => [...prev, {
        minute,
        type: 'substitution',
        team: (isHomeSub ? 'home' : 'away') as 'home' | 'away',
        playerName: subPlayer,
        detail: 'Tactical substitution',
      }]);

      const teamLabel = isHomeSub
        ? (homeClub?.shortName || 'Home')
        : (awayClub?.shortName || 'Away');
      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('substitution', subPlayer, teamLabel),
        type: 'substitution',
      }]);

    } else if (roll < 0.13) {
      // Tactical commentary (3.2%)
      const isHomeTeam = rng() < 0.5;
      const teamLabel = isHomeTeam
        ? (homeClub?.shortName || 'Home')
        : (awayClub?.shortName || 'Away');
      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('tactical', '', teamLabel),
        type: 'tactical',
      }]);
    } else if (roll < 0.14) {
      // Save commentary (1%)
      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('save', 'keeper', ''),
        type: 'save',
      }]);
    }

    // General commentary every ~8 minutes
    if (minute % 8 === 0 && minute > 0) {
      const teamLabel = playerTeamSide === 'home'
        ? (homeClub?.shortName || 'Home')
        : (awayClub?.shortName || 'Away');
      setCommentary(prev => [...prev, {
        minute,
        text: getCommentaryText('general', '', teamLabel),
        type: 'general',
      }]);
    }
  }, [homeClub, awayClub, gameState, lineups, playerPositionIndex, playerPerformance.minutesPlayed, playerTeamSide]);

  // Main simulation timer
  useEffect(() => {
    if (phase !== 'live' || isPaused) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    const intervalMs = simSpeed === 1 ? 1200 : simSpeed === 2 ? 600 : 240;

    simIntervalRef.current = setInterval(() => {
      setMatchMinute(prev => {
        const next = prev + 1;
        if (next >= 90) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          // Small delay before showing full time
          setTimeout(() => setPhase('full_time'), 500);
          return 90;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [phase, isPaused, simSpeed]);

  // Simulate each minute as matchMinute changes
  useEffect(() => {
    if (phase === 'live' && matchMinute > 0 && matchMinute <= 90) {
      simulateMinute(matchMinute);
    }
  }, [matchMinute, phase, simulateMinute]);

  // Handle match start from pre-match
  const handleStartMatch = () => {
    // Run the actual match simulation in the game store
    advanceWeek();
    const latest = useGameStore.getState().gameState?.recentResults[0];
    if (latest) {
      matchResultRef.current = latest;
      // Set final scores from the actual result (used for full-time display)
      const isPHome = playerTeamSide === 'home';
      // We keep our own live simulation scores; the store result is for persistence
    }
    setPhase('live');
    setMatchMinute(0);
    setIsPaused(false);
  };

  // Resume from half-time
  const handleResumeFromHalfTime = () => {
    setIsPaused(false);
    setPhase('live');
  };

  // Skip to end
  const handleSkipToEnd = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    // Rapidly simulate remaining minutes
    for (let m = matchMinute + 1; m <= 90; m++) {
      simulateMinute(m);
    }
    setMatchMinute(90);
    setTimeout(() => setPhase('full_time'), 500);
  };

  // Post-match actions
  const handleContinue = () => setScreen('dashboard');
  const handleViewAnalysis = () => setScreen('post_match_analysis');
  const handleViewHighlights = () => setScreen('match_highlights');

  // Compute match grade
  const matchGrade = useMemo(() => {
    const r = playerPerformance.rating;
    if (r >= 9.0) return { grade: 'S', color: 'text-amber-300' };
    if (r >= 8.0) return { grade: 'A', color: 'text-emerald-400' };
    if (r >= 7.0) return { grade: 'B', color: 'text-sky-400' };
    if (r >= 6.0) return { grade: 'C', color: 'text-amber-400' };
    if (r >= 5.0) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
  }, [playerPerformance.rating]);

  // MOTM computation
  useEffect(() => {
    if (phase === 'full_time') {
      const goalScorers = matchEvents.filter(e => e.type === 'goal');
      if (goalScorers.length > 0) {
        setMotmName(goalScorers[0].playerName || 'Unknown');
      } else {
        setMotmName(lineups.home[randomBetween(0, 5)] || 'Unknown');
      }
    }
  }, [phase, matchEvents, lineups]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Toggle pause
  const togglePause = () => setIsPaused(prev => !prev);

  // Cycle speed
  const cycleSpeed = () => {
    setSimSpeed(prev => prev === 1 ? 2 : prev === 2 ? 5 : 1);
  };

  // Determine match result
  const matchResultLabel = useMemo(() => {
    if (homeScore > awayScore) {
      const playerWon = (playerTeamSide === 'home');
      return playerWon ? 'WIN' : 'LOSS';
    }
    if (awayScore > homeScore) {
      const playerWon = (playerTeamSide === 'away');
      return playerWon ? 'WIN' : 'LOSS';
    }
    return 'DRAW';
  }, [homeScore, awayScore, playerTeamSide]);

  const matchResultColor = matchResultLabel === 'WIN' ? 'text-emerald-400' : matchResultLabel === 'LOSS' ? 'text-red-400' : 'text-amber-400';

  // League positions (mock based on quality)
  const homeLeaguePos = Math.max(1, Math.round(20 - (homeClub?.quality ?? 50) / 5));
  const awayLeaguePos = Math.max(1, Math.round(20 - (awayClub?.quality ?? 50) / 5));

  if (!gameState || !homeClub || !awayClub) return null;

  const hFormation = homeClub.formation || '4-3-3';
  const aFormation = awayClub.formation || '4-3-3';
  const playerTeamLabel = playerTeamSide === 'home' ? homeClub.shortName || homeClub.name : awayClub.shortName || awayClub.name;
  const opponentLabel = playerTeamSide === 'home' ? awayClub.shortName || awayClub.name : homeClub.shortName || homeClub.name;

  // ============================================================
  // PRE-MATCH BUILDUP
  // ============================================================
  if (phase === 'pre_match') {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  <Trophy className="w-3 h-3 mr-1" />
                  {competition}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[#8b949e] text-[10px]">
                <span>{venue}</span>
                <span className="text-lg">{weatherIcon}</span>
              </div>
            </div>

            {/* VS Graphic */}
            <div className="flex items-center justify-center gap-5 px-4 py-5">
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {homeClub.logo}
                </div>
                <span className="text-sm text-[#c9d1d9] font-bold text-center">{homeClub.shortName || homeClub.name}</span>
                <Badge variant="outline" className="text-[9px] border-[#38bdf8]/40 text-[#38bdf8]">HOME</Badge>
              </div>
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-3xl font-black text-[#484f58] tracking-widest"
                >
                  VS
                </motion.div>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {awayClub.logo}
                </div>
                <span className="text-sm text-[#c9d1d9] font-bold text-center">{awayClub.shortName || awayClub.name}</span>
                <Badge variant="outline" className="text-[9px] border-[#fb7185]/40 text-[#fb7185]">AWAY</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Formation display */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-2">
              <p className="text-[10px] text-[#8b949e] font-semibold mb-1 text-center">{hFormation}</p>
              <div className="h-32">
                <FormationDisplay formation={hFormation} isHome={true} playerTeamSide={playerTeamSide} playerPosIdx={playerPositionIndex} />
              </div>
            </div>
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-2">
              <p className="text-[10px] text-[#8b949e] font-semibold mb-1 text-center">{aFormation}</p>
              <div className="h-32">
                <FormationDisplay formation={aFormation} isHome={false} playerTeamSide={playerTeamSide} playerPosIdx={playerPositionIndex} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key player highlight */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <div className="bg-[#161b22] rounded-lg border border-[#fbbf24]/30 overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">
                  YOU
                </Badge>
                <span className="text-xs text-[#c9d1d9] font-semibold">{gameState.player.name}</span>
                <span className="text-[10px] text-[#8b949e]">{gameState.player.position}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-[#8b949e]">
                <span>OVR <strong className="text-[#c9d1d9]">{gameState.player.overall}</strong></span>
                <span>Form <strong className="text-emerald-400">{gameState.player.form.toFixed(1)}</strong></span>
                <span>Fitness <strong className="text-sky-400">{gameState.player.fitness}%</strong></span>
                <span>Morale <strong className="text-amber-400">{gameState.player.morale}%</strong></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pre-match stats comparison */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.15 }}>
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4 space-y-3">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase">Pre-Match Comparison</p>
            <StatBar label="League Pos" home={homeLeaguePos} away={awayLeaguePos} />
            <StatBar label="Squad Q" home={homeClub.quality} away={awayClub.quality} />
            <StatBar label="Form" home={randomBetween(5, 9)} away={randomBetween(5, 9)} />
            <StatBar label="Goals/Match" home={Math.round(homeClub.quality / 20 * 10) / 10} away={Math.round(awayClub.quality / 20 * 10) / 10} />
          </div>
        </motion.div>

        {/* Start Match Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2 }}>
          <Button
            onClick={handleStartMatch}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wider rounded-lg gap-2"
          >
            <Play className="w-4 h-4" />
            KICK OFF
          </Button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // LIVE MATCH
  // ============================================================
  if (phase === 'live' || phase === 'half_time') {
    const half = matchMinute <= 45 ? 1 : 2;
    const visibleEvents = matchEvents.filter(e => e.minute <= matchMinute);
    const playerTeamName = playerTeamSide === 'home' ? (homeClub.shortName || homeClub.name) : (awayClub.shortName || awayClub.name);
    const passCompletion = playerPerformance.passesAttempted > 0
      ? Math.round((playerPerformance.passesCompleted / playerPerformance.passesAttempted) * 100)
      : 0;

    return (
      <div className="p-4 max-w-lg mx-auto space-y-3">
        {/* Live Scoreboard */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            {/* LIVE badge bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                {!isPaused && phase === 'live' && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.15, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-lg"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black text-red-400 tracking-wider">LIVE</span>
                  </motion.div>
                )}
                {isPaused && phase === 'live' && (
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider">PAUSED</span>
                )}
                {phase === 'half_time' && (
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider">HALF TIME</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e] h-5">
                  {competition}
                </Badge>
                <span className="text-[10px] text-[#8b949e]">S{gameState.currentSeason} Wk {gameState.currentWeek}</span>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-4 px-4 py-4">
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {homeClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-bold text-center">{homeClub.shortName || homeClub.name}</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[90px]">
                <motion.div
                  key={`${homeScore}-${awayScore}`}
                  animate={goalFlash ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="text-4xl font-black text-white tracking-wider"
                >
                  {homeScore} <span className="text-[#484f58]">-</span> {awayScore}
                </motion.div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="text-sm font-mono font-bold text-emerald-400">{matchMinute}&apos;</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {awayClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-bold text-center">{awayClub.shortName || awayClub.name}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#8b949e] font-mono">0&apos;</span>
                <div className="flex-1 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10" />
                  <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${half === 1 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                      style={{ width: `${(matchMinute / 90) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-[#8b949e] font-mono">90&apos;</span>
              </div>
              <div className="flex justify-between mt-0.5 px-0">
                <span className={`text-[8px] font-bold ${half === 1 ? 'text-emerald-400' : 'text-[#484f58]'}`}>1ST</span>
                <span className={`text-[8px] font-bold ${half === 2 ? 'text-cyan-400' : 'text-[#484f58]'}`}>2ND</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goal Flash */}
        <AnimatePresence>
          {goalFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 text-center"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" className="mx-auto mb-1">
                <circle cx="12" cy="12" r="10" fill="#34d399" opacity="0.3" />
                <circle cx="12" cy="12" r="6" fill="none" stroke="#34d399" strokeWidth="1.5" />
                <path d="M12 8v8M8 12h8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-black text-emerald-400 tracking-wider">GOAL!</p>
              <p className="text-xl font-black text-white">{homeScore} - {awayScore}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Event Timeline */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3">
          <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Match Timeline
          </p>
          <MatchEventTimeline events={visibleEvents} currentMinute={matchMinute} />
          <div className="flex items-center justify-center gap-3 mt-1.5 text-[8px] text-[#484f58]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Goal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Card</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Red</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400 inline-block" /> Sub</span>
          </div>
        </div>

        {/* Half-time card */}
        <AnimatePresence>
          {phase === 'half_time' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center space-y-2"
            >
              <p className="text-sm font-bold text-amber-400 tracking-wider">⏸️ HALF TIME</p>
              <p className="text-2xl font-black text-white">{homeScore} - {awayScore}</p>
              <p className="text-[10px] text-[#8b949e]">
                Possession: {liveStats.homePossession}% - {liveStats.awayPossession}%
                {' · '}Shots: {liveStats.homeShots} - {liveStats.awayShots}
              </p>
              <Button
                onClick={handleResumeFromHalfTime}
                className="mt-2 h-9 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider rounded-lg"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                START 2ND HALF
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Running stats + momentum */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Live Stats
            </span>
          </div>
          <StatBar label="Possession" home={liveStats.homePossession} away={liveStats.awayPossession} />
          <StatBar label="Shots" home={liveStats.homeShots} away={liveStats.awayShots} />
          <StatBar label="On Target" home={liveStats.homeShotsOnTarget} away={liveStats.awayShotsOnTarget} />
          <StatBar label="Passes" home={liveStats.homePasses} away={liveStats.awayPasses} />
          <StatBar label="Tackles" home={liveStats.homeTackles} away={liveStats.awayTackles} />
          <StatBar label="Fouls" home={liveStats.homeFouls} away={liveStats.awayFouls} />
          <StatBar label="Corners" home={liveStats.homeCorners} away={liveStats.awayCorners} />

          {/* Momentum */}
          <div className="pt-1 border-t border-[#21262d]">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <Flame className="w-3 h-3" /> Momentum
            </p>
            <MomentumBar homeMomentum={homeMomentum} awayMomentum={awayMomentum} />
          </div>
        </div>

        {/* Enhanced Stats Comparison */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3 space-y-2.5">
          <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Head to Head
          </p>
          <div className="flex items-center justify-between text-[8px] text-[#484f58] font-bold uppercase tracking-wider">
            <span className="text-[#38bdf8]">{homeClub.shortName || homeClub.name}</span>
            <span className="text-[#fb7185]">{awayClub.shortName || awayClub.name}</span>
          </div>
          <EnhancedStatBar label="Possession" home={liveStats.homePossession} away={liveStats.awayPossession} />
          <EnhancedStatBar label="Shots" home={liveStats.homeShots} away={liveStats.awayShots} />
          <EnhancedStatBar label="On Target" home={liveStats.homeShotsOnTarget} away={liveStats.awayShotsOnTarget} />
          <EnhancedStatBar label="Corners" home={liveStats.homeCorners} away={liveStats.awayCorners} />
          <EnhancedStatBar label="Fouls" home={liveStats.homeFouls} away={liveStats.awayFouls} />
          <EnhancedStatBar label="Passes" home={liveStats.homePasses} away={liveStats.awayPasses} />
        </div>

        {/* Momentum Area Chart */}
        {momentumHistory.length > 2 && (
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3 space-y-1">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Match Momentum Flow
            </p>
            <MomentumAreaChart history={momentumHistory} />
          </div>
        )}

        {/* Player Performance Panel */}
        <div className="bg-[#161b22] rounded-lg border border-[#fbbf24]/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">YOU</Badge>
              <span className="text-xs text-[#c9d1d9] font-semibold">{gameState.player.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg font-black ${matchGrade.color}`}>{matchGrade.grade}</span>
              <span className="text-sm font-bold text-[#c9d1d9]">{playerPerformance.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Min</p>
              <p className="text-xs font-bold text-[#c9d1d9]">{playerPerformance.minutesPlayed}&apos;</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Goals</p>
              <p className={`text-xs font-bold ${playerPerformance.goals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{playerPerformance.goals}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Shots</p>
              <p className="text-xs font-bold text-[#c9d1d9]">{playerPerformance.shots}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Dist</p>
              <p className="text-xs font-bold text-[#c9d1d9]">{playerPerformance.distanceKm}km</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Assists</p>
              <p className={`text-xs font-bold ${playerPerformance.assists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>{playerPerformance.assists}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Pass %</p>
              <p className="text-xs font-bold text-[#c9d1d9]">{passCompletion}%</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Tackles</p>
              <p className="text-xs font-bold text-[#c9d1d9]">{playerPerformance.tackles}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-1.5">
              <p className="text-[8px] text-[#484f58] uppercase">Grade</p>
              <p className={`text-xs font-black ${matchGrade.color}`}>{matchGrade.grade}</p>
            </div>
          </div>
        </div>

        {/* Match Commentary */}
        <div className="bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-[#30363d]">
            <span className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Commentary
            </span>
          </div>
          <div
            ref={commentaryRef}
            className="px-3 py-2 max-h-48 overflow-y-auto space-y-1.5"
          >
            {commentary.length === 0 && (
              <p className="text-[#484f58] text-xs text-center py-4">Kick off approaching...</p>
            )}
            {commentary.map((c, i) => {
              return (
                <motion.div
                  key={`${c.minute}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-2 items-start px-2 py-1 rounded ${
                    c.type === 'goal' ? 'bg-emerald-500/5 border-l-2 border-emerald-500' :
                    c.type === 'halftime' ? 'bg-amber-500/5 border-l-2 border-amber-500' :
                    c.type === 'card' ? 'bg-amber-500/5 border-l-2 border-amber-500/50' :
                    ''
                  }`}
                >
                  <span className="text-[9px] font-mono text-[#484f58] pt-0.5 min-w-[24px] text-right shrink-0">
                    {c.minute}&apos;
                  </span>
                  <CommentaryEventIcon type={c.type} />
                  <p className={`text-[11px] leading-snug ${
                    c.type === 'goal' ? 'text-emerald-300 font-semibold' :
                    c.type === 'halftime' ? 'text-amber-300 font-semibold' :
                    c.type === 'card' ? 'text-amber-200' :
                    c.type === 'save' ? 'text-purple-300' :
                    'text-[#c9d1d9]'
                  }`}>
                    {c.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Event timeline (last 5 events) */}
        {visibleEvents.length > 0 && (
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Events
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {visibleEvents.slice(-6).map((e, i) => {
                const evtColorMap: Record<string, string> = {
                  goal: '#34d399', own_goal: '#34d399', assist: '#38bdf8', yellow_card: '#fbbf24',
                  red_card: '#ef4444', second_yellow: '#ef4444', substitution: '#38bdf8', injury: '#fb923c',
                  chance: '#fb923c', save: '#a78bfa', penalty_won: '#34d399', penalty_missed: '#ef4444',
                  corner: '#8b949e', free_kick: '#8b949e', weather: '#8b949e',
                };
                const dotColor = evtColorMap[e.type] || '#8b949e';
                const isPlayerEvt = e.playerId === gameState.player.id;
                return (
                  <div key={`${e.minute}-${e.type}-${i}`} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${isPlayerEvt ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[#161b22]'}`}>
                    <span className="text-[9px] font-mono text-[#484f58] min-w-[20px]">{e.minute}&apos;</span>
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: dotColor }} />
                    <span className="text-[#c9d1d9] truncate flex-1">{e.playerName || e.detail || e.type}</span>
                    {isPlayerEvt && <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30 h-3">YOU</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        {phase === 'live' && (
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePause}
              variant="outline"
              className="flex-1 h-9 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-1.5"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={cycleSpeed}
              variant="outline"
              className="flex-1 h-9 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-1.5"
            >
              <Gauge className="w-3.5 h-3.5" />
              {simSpeed}x Speed
            </Button>
            <Button
              onClick={handleSkipToEnd}
              variant="outline"
              className="flex-1 h-9 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // FULL-TIME SCREEN
  // ============================================================
  if (phase === 'full_time') {
    const passCompletion = playerPerformance.passesAttempted > 0
      ? Math.round((playerPerformance.passesCompleted / playerPerformance.passesAttempted) * 100)
      : 0;

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Full Time Result Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <div className={`bg-[#161b22] rounded-lg border overflow-hidden ${
            matchResultLabel === 'WIN' ? 'border-emerald-500/50' :
            matchResultLabel === 'LOSS' ? 'border-red-500/50' : 'border-amber-500/50'
          }`}>
            <div className={`h-1.5 ${
              matchResultLabel === 'WIN' ? 'bg-emerald-500' :
              matchResultLabel === 'LOSS' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <div className="p-5 text-center space-y-4">
              <p className="text-[10px] font-bold text-[#8b949e] tracking-widest uppercase">Full Time</p>
              <p className={`text-3xl font-black tracking-widest ${matchResultColor}`}>{matchResultLabel}</p>

              {/* Final Score */}
              <div className="flex items-center justify-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                    {homeClub.logo}
                  </div>
                  <span className="text-sm text-[#c9d1d9] font-bold">{homeClub.shortName || homeClub.name}</span>
                </div>
                <div className="text-5xl font-black text-white tracking-wider">
                  {homeScore} <span className="text-[#484f58]">-</span> {awayScore}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                    {awayClub.logo}
                  </div>
                  <span className="text-sm text-[#c9d1d9] font-bold">{awayClub.shortName || awayClub.name}</span>
                </div>
              </div>

              <p className="text-[10px] text-[#8b949e]">{competition} · Season {gameState.currentSeason} · Week {gameState.currentWeek}</p>
            </div>
          </div>
        </motion.div>

        {/* MOTM */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase">Man of the Match</p>
              <p className="text-sm text-[#c9d1d9] font-bold">{motmName}</p>
            </div>
            <Star className="w-5 h-5 text-amber-400 fill-current shrink-0" />
          </div>
        </motion.div>

        {/* Player Rating Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.15 }}>
          <div className="bg-[#161b22] rounded-lg border border-[#fbbf24]/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">YOU</Badge>
                <span className="text-sm text-[#c9d1d9] font-semibold">{gameState.player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${matchGrade.color}`}>{matchGrade.grade}</span>
                <span className="text-lg font-bold text-[#c9d1d9]">{playerPerformance.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Minutes</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{playerPerformance.minutesPlayed}&apos;</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Goals</p>
                <p className={`text-sm font-bold ${playerPerformance.goals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{playerPerformance.goals}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Assists</p>
                <p className={`text-sm font-bold ${playerPerformance.assists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>{playerPerformance.assists}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Shots</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{playerPerformance.shots}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Pass %</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{passCompletion}%</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Tackles</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{playerPerformance.tackles}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Distance</p>
                <p className="text-sm font-bold text-[#c9d1d9]">{playerPerformance.distanceKm}km</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <p className="text-[8px] text-[#484f58] uppercase">Grade</p>
                <p className={`text-sm font-black ${matchGrade.color}`}>{matchGrade.grade}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final Match Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2 }}>
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4 space-y-3">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Final Match Stats
            </p>
            <div className="flex items-center justify-between text-[8px] text-[#484f58] font-bold uppercase tracking-wider">
              <span className="text-[#38bdf8]">{homeClub.shortName || homeClub.name}</span>
              <span className="text-[#fb7185]">{awayClub.shortName || awayClub.name}</span>
            </div>
            <EnhancedStatBar label="Possession" home={liveStats.homePossession} away={liveStats.awayPossession} />
            <EnhancedStatBar label="Shots" home={liveStats.homeShots} away={liveStats.awayShots} />
            <EnhancedStatBar label="On Target" home={liveStats.homeShotsOnTarget} away={liveStats.awayShotsOnTarget} />
            <EnhancedStatBar label="Corners" home={liveStats.homeCorners} away={liveStats.awayCorners} />
            <EnhancedStatBar label="Fouls" home={liveStats.homeFouls} away={liveStats.awayFouls} />
            <EnhancedStatBar label="Passes" home={liveStats.homePasses} away={liveStats.awayPasses} />
          </div>
        </motion.div>

        {/* Match Momentum Flow */}
        {momentumHistory.length > 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.22 }}>
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3 space-y-1">
              <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Match Momentum Flow
              </p>
              <MomentumAreaChart history={momentumHistory} />
            </div>
          </motion.div>
        )}

        {/* Match Event Timeline */}
        {matchEvents.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.23 }}>
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3">
              <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Match Timeline
              </p>
              <MatchEventTimeline events={matchEvents} currentMinute={90} />
              <div className="flex items-center justify-center gap-3 mt-1.5 text-[8px] text-[#484f58]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Goal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Card</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Red</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-400 inline-block" /> Sub</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Rated Players */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.24 }}>
          <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-3 space-y-2">
            <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <Star className="w-3 h-3" /> Top Rated Players
            </p>
            <p className="text-[8px] text-[#38bdf8] font-bold uppercase tracking-wider">{homeClub.shortName || homeClub.name}</p>
            <div className="space-y-1.5">
              {(() => {
                const hPositions = FORMATIONS[hFormation] || FORMATIONS[DEFAULT_FORMATION];
                const hGoals: Record<number, number> = {};
                matchEvents.forEach(e => {
                  if (e.type === 'goal' && e.team === 'home') {
                    const idx = lineups.home.indexOf(e.playerName || '');
                    if (idx >= 0) hGoals[idx] = (hGoals[idx] || 0) + 1;
                  }
                });
                const hPlayers = hPositions.map((p, i) => ({
                  name: lineups.home[i] || `Player ${i + 1}`,
                  pos: p.pos,
                  rating: clamp(6.0 + (hGoals[i] || 0) * 0.9 + (Math.sin(i * 2.7 + 1.3) * 0.5 + 0.5) * 1.2, 4.5, 9.8),
                  goals: hGoals[i] || 0,
                  assists: 0,
                }));
                hPlayers.sort((a, b) => b.rating - a.rating);
                return hPlayers.slice(0, 3).map((p, i) => (
                  <PlayerRatingCard key={`h-${i}`} name={p.name} position={p.pos} rating={p.rating} goals={p.goals} assists={p.assists} isHome={true} />
                ));
              })()}
            </div>
            <p className="text-[8px] text-[#fb7185] font-bold uppercase tracking-wider pt-1 border-t border-[#21262d]">{awayClub.shortName || awayClub.name}</p>
            <div className="space-y-1.5">
              {(() => {
                const aPositions = FORMATIONS[aFormation] || FORMATIONS[DEFAULT_FORMATION];
                const aGoals: Record<number, number> = {};
                matchEvents.forEach(e => {
                  if (e.type === 'goal' && e.team === 'away') {
                    const idx = lineups.away.indexOf(e.playerName || '');
                    if (idx >= 0) aGoals[idx] = (aGoals[idx] || 0) + 1;
                  }
                });
                const aPlayers = aPositions.map((p, i) => ({
                  name: lineups.away[i] || `Player ${i + 1}`,
                  pos: p.pos,
                  rating: clamp(6.0 + (aGoals[i] || 0) * 0.9 + (Math.sin(i * 3.1 + 2.7) * 0.5 + 0.5) * 1.2, 4.5, 9.8),
                  goals: aGoals[i] || 0,
                  assists: 0,
                }));
                aPlayers.sort((a, b) => b.rating - a.rating);
                return aPlayers.slice(0, 3).map((p, i) => (
                  <PlayerRatingCard key={`a-${i}`} name={p.name} position={p.pos} rating={p.rating} goals={p.goals} assists={p.assists} isHome={false} />
                ));
              })()}
            </div>
          </div>
        </motion.div>

        {/* Key Events Summary */}
        {matchEvents.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.25 }}>
            <div className="bg-[#0d1117] rounded-lg border border-[#30363d] p-4">
              <p className="text-[10px] text-[#8b949e] font-semibold tracking-wider uppercase mb-2">Key Events</p>
              <div className="space-y-1.5">
                {matchEvents.filter(e => ['goal', 'yellow_card', 'red_card', 'substitution'].includes(e.type)).map((e, i) => {
                  const evtColorMap: Record<string, string> = { goal: '#34d399', yellow_card: '#fbbf24', red_card: '#ef4444', substitution: '#38bdf8' };
                  const dotColor = evtColorMap[e.type] || '#8b949e';
                  const isPlayerEvt = e.playerId === gameState.player.id;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-[#161b22] rounded px-2 py-1.5">
                      <span className="text-[9px] font-mono text-[#484f58] min-w-[24px] text-right">{e.minute}&apos;</span>
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="text-[#c9d1d9] truncate flex-1">{e.playerName || ''}</span>
                      {e.team && (
                        <Badge variant="outline" className={`text-[8px] h-3.5 px-1 py-0 font-bold ${e.team === 'home' ? 'border-[#38bdf8]/40 text-[#38bdf8]' : 'border-[#fb7185]/40 text-[#fb7185]'}`}>
                          {e.team === 'home' ? (homeClub.shortName || 'Home') : (awayClub.shortName || 'Away')}
                        </Badge>
                      )}
                      {isPlayerEvt && <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30 h-3">YOU</Badge>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Post-Match Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.3 }} className="space-y-2">
          <Button
            onClick={handleViewAnalysis}
            variant="outline"
            className="w-full h-10 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Full Analysis
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
          <Button
            onClick={handleViewHighlights}
            variant="outline"
            className="w-full h-10 border-[#30363d] text-[#c9d1d9] rounded-lg text-xs gap-2"
          >
            <Eye className="w-4 h-4" />
            View Highlights
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider rounded-lg gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}
