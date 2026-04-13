'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  Shield,
  Award,
  ChevronRight,
  Play,
  Users,
  BarChart3,
  Flame,
  Heart,
  Footprints,
  CircleDot,
  Calendar,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SeasonPlayerStats,
  MatchResult,
  LeagueStanding,
} from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

interface TimelinePhase {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  events: string[];
  form: { wins: number; draws: number; losses: number };
}

interface BestMoment {
  id: string;
  type: string;
  typeColor: string;
  title: string;
  description: string;
  matchContext: string;
  minute?: number;
}

interface StatComparisonRow {
  label: string;
  current: number;
  previous: number;
  suffix: string;
}

interface SeasonRating {
  overall: number;
  grade: string;
  attacking: number;
  defensive: number;
  consistency: number;
  bigGame: number;
  improvement: number;
}

interface MonthlyPerformance {
  month: string;
  goals: number;
  assists: number;
}

// ============================================================
// Seeded random utilities (deterministic)
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickFromSeeded<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededBetween(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ============================================================
// SVG Icon components (inline, no transforms)
// ============================================================

function ClapboardSVG({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="20" height="14" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <path d="M2 6l4-4h16l-4 4" stroke={color} strokeWidth="2" fill="none" />
      <line x1="6" y1="6" x2="10" y2="2" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="6" x2="14" y2="2" stroke={color} strokeWidth="1.5" />
      <line x1="14" y1="6" x2="18" y2="2" stroke={color} strokeWidth="1.5" />
      <line x1="2" y1="11" x2="22" y2="11" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function TrophySVG({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8h32v4c0 8-6 14-16 14S16 20 16 12V8z" fill={color} opacity="0.85" />
      <path d="M16 12H8c0 8 4 12 8 14M48 12h8c0 8-4 12-8 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="28" y="26" width="8" height="8" rx="1" fill={color} opacity="0.7" />
      <rect x="22" y="34" width="20" height="6" rx="2" fill={color} opacity="0.9" />
      <rect x="18" y="40" width="28" height="4" rx="2" fill={color} opacity="0.6" />
    </svg>
  );
}

function StarSVG({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

// ============================================================
// Helper functions
// ============================================================

function getGrade(rating: number): string {
  if (rating >= 9.5) return 'A+';
  if (rating >= 9.0) return 'A';
  if (rating >= 8.5) return 'A-';
  if (rating >= 8.0) return 'B+';
  if (rating >= 7.5) return 'B';
  if (rating >= 7.0) return 'B-';
  if (rating >= 6.5) return 'C+';
  if (rating >= 6.0) return 'C';
  if (rating >= 5.5) return 'C-';
  if (rating >= 5.0) return 'D+';
  if (rating >= 4.0) return 'D';
  return 'F';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getNarrativeSubtitle(
  position: number,
  goals: number,
  assists: number,
  rating: number,
  trophies: number
): string {
  if (position === 1 && trophies > 0) return 'A Season of Glory';
  if (position <= 4) return 'Challenging at the Top';
  if (position <= 8) return 'Building Something Special';
  if (position <= 14) return 'A Season of Growth';
  if (position <= 18) return 'Fighting Until the End';
  return 'A Season of Resilience';
}

// ============================================================
// Animation variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

// ============================================================
// Background pattern component (no gradients)
// ============================================================

function DarkPatternBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.025]">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-sm bg-white"
            style={{
              width: (i % 3 === 0) ? 2 : 1,
              height: 1,
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ============================================================
// SVG Bar Chart component for monthly stats
// ============================================================

function MiniBarChart({ data, maxValue }: { data: MonthlyPerformance[]; maxValue: number }) {
  const barWidth = 16;
  const gap = 4;
  const totalWidth = data.length * (barWidth + gap) - gap;
  const chartHeight = 80;

  return (
    <svg width={Math.max(totalWidth, 100)} height={chartHeight} viewBox={`0 0 ${totalWidth} ${chartHeight}`}>
      {data.map((d, i) => {
        const x = i * (barWidth + gap);
        const goalsH = maxValue > 0 ? (d.goals / maxValue) * (chartHeight - 10) : 0;
        const assistsH = maxValue > 0 ? (d.assists / maxValue) * (chartHeight - 10) : 0;
        return (
          <g key={d.month}>
            {/* Goals bar */}
            <rect x={x} y={chartHeight - goalsH - 10} width={barWidth / 2 - 1} height={goalsH} fill="#34d399" rx="1" />
            {/* Assists bar */}
            <rect x={x + barWidth / 2 + 1} y={chartHeight - assistsH - 10} width={barWidth / 2 - 1} height={assistsH} fill="#3b82f6" rx="1" />
            {/* Month label */}
            <text x={x + barWidth / 2} y={chartHeight - 1} textAnchor="middle" fill="#8b949e" fontSize="6" fontFamily="monospace">
              {d.month.slice(0, 1)}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={0} y={0} width={6} height={6} fill="#34d399" rx="1" />
      <text x={8} y={5} fill="#8b949e" fontSize="5">Goals</text>
      <rect x={30} y={0} width={6} height={6} fill="#3b82f6" rx="1" />
      <text x={38} y={5} fill="#8b949e" fontSize="5">Assists</text>
    </svg>
  );
}

// ============================================================
// SVG Line chart for career trajectory
// ============================================================

function CareerTrajectoryChart({ seasons }: { seasons: { number: number; avgRating: number; overall: number }[] }) {
  if (seasons.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-[#484f58]">
        Need at least 2 seasons for trajectory
      </div>
    );
  }

  const width = 280;
  const height = 80;
  const padding = 20;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const ratings = seasons.map(s => s.avgRating);
  const maxR = Math.max(...ratings, 7);
  const minR = Math.min(...ratings, 5);

  const points = seasons.map((s, i) => ({
    x: padding + (seasons.length > 1 ? (i / (seasons.length - 1)) * plotW : plotW / 2),
    y: padding + plotH - ((s.avgRating - minR) / (maxR - minR + 0.1)) * plotH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac, i) => (
        <line key={i} x1={padding} y1={padding + plotH * frac} x2={width - padding} y2={padding + plotH * frac} stroke="#21262d" strokeWidth="0.5" />
      ))}
      {/* Line */}
      <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#34d399" />
          <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#8b949e" fontSize="5" fontFamily="monospace">
            {ratings[i].toFixed(1)}
          </text>
          <text x={p.x} y={height - 2} textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="monospace">
            S{seasons[i].number}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// Progress bar component
// ============================================================

function RatingBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-sm" style={{ backgroundColor: '#21262d' }}>
      <div
        className="h-2 rounded-sm"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ============================================================
// Section divider
// ============================================================

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-px flex-1" style={{ backgroundColor: '#21262d' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#484f58' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: '#21262d' }} />
    </div>
  );
}

// ============================================================
// 1. SEASON COVER PAGE
// ============================================================

function SeasonCoverPage({
  seasonNumber,
  year,
  clubName,
  clubLogo,
  player,
  stats,
  position,
  points,
  wins,
  draws,
  losses,
  goalsFor,
  goalsAgainst,
  trophyCount,
}: {
  seasonNumber: number;
  year: number;
  clubName: string;
  clubLogo: string;
  player: { name: string; overall: number; age: number; position: string };
  stats: SeasonPlayerStats;
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  trophyCount: number;
}) {
  const rating = stats.averageRating > 0 ? stats.averageRating : 5;
  const normalizedRating = Math.min(10, Math.max(1, rating));
  const grade = getGrade(normalizedRating);
  const starCount = Math.round(normalizedRating);

  const narrative = getNarrativeSubtitle(position, stats.goals, stats.assists, normalizedRating, trophyCount);

  return (
    <div className="relative overflow-hidden">
      <DarkPatternBackground />
      <div className="relative px-4 pt-10 pb-8 text-center">
        {/* Season label */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Badge
            className="text-[10px] px-3 py-1 font-bold tracking-widest"
            style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <ClapboardSVG color="#34d399" />
            <span className="ml-1.5">SEASON REVIEW</span>
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-3xl font-black tracking-tight text-white mt-4"
        >
          Season {year}
        </motion.h1>

        {/* Narrative subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="text-sm italic mt-1"
          style={{ color: '#f59e0b' }}
        >
          &ldquo;{narrative}&rdquo;
        </motion.p>

        {/* Club badge + name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="mt-6 flex flex-col items-center gap-2"
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: '#21262d', border: '2px solid #30363d' }}
          >
            {clubLogo}
          </div>
          <p className="text-sm font-semibold text-[#c9d1d9]">{clubName}</p>
        </motion.div>

        {/* Season summary card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.55 }}
          className="mt-6 mx-auto max-w-xs rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
        >
          {/* Position row */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #21262d' }}>
            <span className="text-xs text-[#8b949e]">League Position</span>
            <span className="text-lg font-black text-white">{getOrdinal(position)}</span>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: '#21262d' }}>
            {[
              { label: 'PTS', value: points, color: '#34d399' },
              { label: 'W', value: wins, color: '#34d399' },
              { label: 'D', value: draws, color: '#f59e0b' },
              { label: 'L', value: losses, color: '#ef4444' },
            ].map((s) => (
              <div key={s.label} className="py-3 text-center" style={{ borderColor: '#21262d' }}>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Goals row */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid #21262d' }}>
            <span className="text-xs text-[#8b949e]">Goals</span>
            <span className="text-sm font-bold text-white">{goalsFor} / {goalsAgainst}</span>
          </div>
        </motion.div>

        {/* Season highlight stat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.65 }}
          className="mt-4 flex items-center justify-center gap-3 flex-wrap"
        >
          <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ backgroundColor: '#21262d', color: '#c9d1d9' }}>
            {stats.goals} goals
          </span>
          <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ backgroundColor: '#21262d', color: '#c9d1d9' }}>
            {stats.assists} assists
          </span>
          {trophyCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {trophyCount} trophy{trophyCount > 1 ? 'ies' : 'y'}
            </span>
          )}
        </motion.div>

        {/* Season rating */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.75 }}
          className="mt-5 mx-auto max-w-xs rounded-xl p-4 border"
          style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">Season Rating</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarSVG key={i} color={i < starCount ? '#f59e0b' : '#30363d'} size={14} />
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black" style={{ color: normalizedRating >= 7 ? '#34d399' : normalizedRating >= 5 ? '#f59e0b' : '#ef4444' }}>
                {normalizedRating.toFixed(1)}
              </p>
              <p className="text-xs font-bold" style={{ color: normalizedRating >= 7 ? '#34d399' : normalizedRating >= 5 ? '#f59e0b' : '#ef4444' }}>
                {grade}
              </p>
            </div>
          </div>
          {/* Player info */}
          <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid #21262d' }}>
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              {player.overall}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[#e6edf3]">{player.name}</p>
              <p className="text-[10px] text-[#8b949e]">{player.position} &middot; Age {player.age}</p>
            </div>
          </div>
        </motion.div>

        {/* Decorative stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          className="mt-4 flex items-center justify-center gap-4"
        >
          <StarSVG color="#f59e0b" size={8} />
          <StarSVG color="#f59e0b" size={12} />
          <StarSVG color="#ffd700" size={10} />
          <StarSVG color="#f59e0b" size={12} />
          <StarSVG color="#f59e0b" size={8} />
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// 2. SEASON JOURNEY TIMELINE
// ============================================================

function generateTimeline(
  seasonNumber: number,
  stats: SeasonPlayerStats,
  results: MatchResult[],
  position: number,
  playerGoals: number,
  playerAssists: number,
  playerRating: number,
  clubName: string,
  currentClubId: string
): TimelinePhase[] {
  const rng = seededRandom(seasonNumber * 31337 + 42);
  const totalMatches = results.length;
  const phaseSize = Math.ceil(totalMatches / 5);

  const phaseMatches = (start: number, end: number): MatchResult[] =>
    results.slice(start, Math.min(end, results.length));

  const isPlayerHome = (m: MatchResult): boolean => m.homeClub.id === currentClubId;

  const formFromMatches = (matches: MatchResult[]): { wins: number; draws: number; losses: number } => {
    let w = 0; let d = 0; let l = 0;
    matches.forEach(m => {
      const playerScore = isPlayerHome(m) ? m.homeScore : m.awayScore;
      const oppScore = isPlayerHome(m) ? m.awayScore : m.homeScore;
      if (playerScore > oppScore) w++;
      else if (playerScore === oppScore) d++;
      else l++;
    });
    return { wins: w, draws: d, losses: l };
  };

  const phases: TimelinePhase[] = [];

  // Pre-Season
  const preSeasonEvents: string[] = [
    `Joined training camp ahead of ${clubName}'s new campaign`,
    `Worked on fitness and tactical understanding`,
    seededBetween(1, 3, rng) > 1 ? 'New signing boosted squad morale' : 'Squad largely unchanged from last season',
    'Pre-season friendlies showed promising signs',
  ];
  phases.push({
    id: 'pre-season',
    label: 'Pre-Season',
    sublabel: 'Preparation',
    icon: <Footprints className="w-4 h-4 text-[#8b949e]" />,
    events: preSeasonEvents,
    form: { wins: seededBetween(1, 2, rng), draws: 0, losses: seededBetween(0, 1, rng) },
  });

  // Aug-Oct
  const earlyMatches = phaseMatches(0, phaseSize);
  const earlyForm = formFromMatches(earlyMatches);
  const earlyGoals = earlyMatches.reduce((s, m) => s + m.playerGoals, 0);
  phases.push({
    id: 'early',
    label: 'August – October',
    sublabel: 'Early Season',
    icon: <Zap className="w-4 h-4 text-[#34d399]" />,
    events: [
      `Scored ${earlyGoals} goal${earlyGoals !== 1 ? 's' : ''} in the opening months`,
      earlyForm.wins >= 4 ? 'Strong start to the season' : earlyForm.wins >= 2 ? 'Mixed early season form' : 'Difficult start to the campaign',
      `Made ${Math.min(earlyMatches.length, stats.starts)} start${stats.starts !== 1 ? 's' : ''} in the first ${earlyMatches.length} matches`,
      earlyMatches.length > 0 ? `Debut season momentum building through matchday ${Math.min(phaseSize, totalMatches)}` : 'Finding rhythm in the new season',
    ],
    form: earlyForm,
  });

  // Nov-Dec
  const midMatches = phaseMatches(phaseSize, phaseSize * 2);
  const midForm = formFromMatches(midMatches);
  const midGoals = midMatches.reduce((s, m) => s + m.playerGoals, 0);
  phases.push({
    id: 'mid',
    label: 'November – December',
    sublabel: 'Mid-Season',
    icon: <Shield className="w-4 h-4 text-[#f59e0b]" />,
    events: [
      midForm.wins > midForm.losses ? 'Impressive mid-season form' : midForm.wins === midForm.losses ? 'Inconsistent mid-season period' : 'Mid-season struggles tested resolve',
      `Added ${midGoals} goal${midGoals !== 1 ? 's' : ''} before the winter break`,
      'Cup competition added to the fixture list',
      rng() > 0.5 ? 'Picked up a minor knock but returned quickly' : 'Maintained fitness throughout the busy period',
    ],
    form: midForm,
  });

  // Jan-Feb
  const janMatches = phaseMatches(phaseSize * 2, phaseSize * 3);
  const janForm = formFromMatches(janMatches);
  phases.push({
    id: 'second-half',
    label: 'January – February',
    sublabel: 'Second Half Start',
    icon: <Play className="w-4 h-4 text-[#3b82f6]" />,
    events: [
      janForm.wins >= 3 ? 'Strong return after the break' : 'Second half kicked off steadily',
      'Cup run continued with important results',
      rng() > 0.6 ? 'Transfer window brought new teammates' : 'Squad stayed intact through January',
      'Building momentum for the run-in',
    ],
    form: janForm,
  });

  // Mar-Apr
  const marMatches = phaseMatches(phaseSize * 3, phaseSize * 4);
  const marForm = formFromMatches(marMatches);
  phases.push({
    id: 'run-in',
    label: 'March – April',
    sublabel: 'The Run-In',
    icon: <Flame className="w-4 h-4 text-[#ef4444]" />,
    events: [
      position <= 4 ? 'Title race intensifies with crucial wins' : position <= 14 ? 'Pushing for a strong league finish' : 'Relegation battle demanded every effort',
      marForm.wins >= 4 ? 'Brilliant run-in form' : marForm.wins >= 2 ? 'Consistent performances when it mattered' : 'Results mixed during the critical period',
      'Every point counted towards the final position',
      `Career-high confidence heading into the finale`,
    ],
    form: marForm,
  });

  // May
  const mayMatches = results.slice(phaseSize * 4);
  const mayForm = formFromMatches(mayMatches);
  phases.push({
    id: 'finale',
    label: 'May',
    sublabel: 'Season Finale',
    icon: <Trophy className="w-4 h-4 text-[#f59e0b]" />,
    events: [
      `Finished the season in ${getOrdinal(position)} place`,
      `Ended the campaign with ${playerGoals} goals and ${playerAssists} assists`,
      position <= 3 ? 'Secured a top-three finish' : position <= 8 ? 'Achieved a mid-table finish' : 'Survived a tough season',
      'Ready to reflect and prepare for next season',
    ],
    form: mayForm,
  });

  return phases;
}

function SeasonJourneyTimeline({ phases }: { phases: TimelinePhase[] }) {
  return (
    <div className="px-4 pb-4">
      <div className="space-y-0">
        {phases.map((phase, idx) => {
          const total = phase.form.wins + phase.form.draws + phase.form.losses;
          const wPct = total > 0 ? (phase.form.wins / total) * 100 : 0;
          const dPct = total > 0 ? (phase.form.draws / total) * 100 : 0;
          const lPct = total > 0 ? (phase.form.losses / total) * 100 : 0;

          return (
            <motion.div
              key={phase.id}
              variants={itemVariants}
              className="relative flex gap-3"
            >
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center" style={{ width: 32 }}>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#21262d', border: '1px solid #30363d' }}
                >
                  {phase.icon}
                </div>
                {idx < phases.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ backgroundColor: '#21262d' }} />
                )}
              </div>

              {/* Content card */}
              <div
                className="flex-1 rounded-lg border p-3 mb-3"
                style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-xs font-bold text-[#e6edf3]">{phase.label}</p>
                    <p className="text-[9px] text-[#484f58] uppercase tracking-wider">{phase.sublabel}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold">
                    <span style={{ color: '#34d399' }}>{phase.form.wins}W</span>
                    <span style={{ color: '#f59e0b' }}>{phase.form.draws}D</span>
                    <span style={{ color: '#ef4444' }}>{phase.form.losses}L</span>
                  </div>
                </div>
                {/* Form bar */}
                <div className="w-full h-1.5 rounded-sm flex overflow-hidden mb-2" style={{ backgroundColor: '#21262d' }}>
                  {wPct > 0 && <div style={{ width: `${wPct}%`, backgroundColor: '#34d399' }} />}
                  {dPct > 0 && <div style={{ width: `${dPct}%`, backgroundColor: '#f59e0b' }} />}
                  {lPct > 0 && <div style={{ width: `${lPct}%`, backgroundColor: '#ef4444' }} />}
                </div>
                {/* Events */}
                <ul className="space-y-1">
                  {phase.events.map((evt, ei) => (
                    <li key={ei} className="flex items-start gap-1.5">
                      <CircleDot className="w-2.5 h-2.5 mt-0.5 shrink-0" style={{ color: '#484f58' }} />
                      <span className="text-[11px] text-[#8b949e] leading-snug">{evt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3. BEST MOMENTS GALLERY
// ============================================================

function generateBestMoments(
  seasonNumber: number,
  stats: SeasonPlayerStats,
  results: MatchResult[],
  playerName: string,
  clubName: string,
  currentClubId: string
): BestMoment[] {
  const rng = seededRandom(seasonNumber * 76543 + 21);

  const isPlayerHome = (m: MatchResult): boolean => m.homeClub.id === currentClubId;
  const goalResults = results.filter(r => r.playerGoals > 0);
  const assistResults = results.filter(r => r.playerAssists > 0);
  const bestRated = results.length > 0 ? [...results].sort((a, b) => b.playerRating - a.playerRating)[0] : null;

  const opponentNames = ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United', 'Tottenham', 'Juventus', 'AC Milan', 'Bayern', 'Dortmund', 'PSG', 'Barcelona', 'Real Madrid', 'Atletico', 'Inter'];
  const getOpponent = (): string => pickFromSeeded(opponentNames, rng);

  const goalDescriptions = [
    'A stunning long-range strike into the top corner',
    'A perfectly timed run and composed finish',
    'A powerful header from a corner kick',
    'A solo run weaving through three defenders',
    'A deft chip over the advancing goalkeeper',
    'A volley from outside the box that left everyone stunned',
  ];

  const assistDescriptions = [
    'A defence-splitting through ball that opened up the entire defence',
    'A perfectly weighted cross met with a bullet header',
    'A clever backheel that unlocked a stubborn defence',
    'A pinpoint long ball from deep that led to a counter-attack goal',
    'A mazy dribble and pull-back to the edge of the box',
  ];

  const moments: BestMoment[] = [];

  // Best Goal
  if (goalResults.length > 0) {
    const bestGoalMatch = goalResults[seededBetween(0, goalResults.length - 1, rng)];
    const opp = isPlayerHome(bestGoalMatch) ? bestGoalMatch.awayClub.name : bestGoalMatch.homeClub.name;
    moments.push({
      id: 'best_goal',
      type: 'Best Goal',
      typeColor: '#34d399',
      title: pickFromSeeded(goalDescriptions, rng),
      description: `Matchday ${bestGoalMatch.week}`,
      matchContext: `${opp} (Home: ${bestGoalMatch.homeScore} - ${bestGoalMatch.awayScore} Away)`,
      minute: seededBetween(15, 89, rng),
    });
  } else {
    moments.push({
      id: 'best_goal',
      type: 'Best Goal',
      typeColor: '#34d399',
      title: pickFromSeeded(goalDescriptions, rng),
      description: 'A moment of individual brilliance',
      matchContext: `${clubName} vs ${getOpponent()}`,
      minute: seededBetween(20, 80, rng),
    });
  }

  // Best Assist
  if (assistResults.length > 0) {
    const bestAssistMatch = assistResults[seededBetween(0, assistResults.length - 1, rng)];
    const opp = isPlayerHome(bestAssistMatch) ? bestAssistMatch.awayClub.name : bestAssistMatch.homeClub.name;
    moments.push({
      id: 'best_assist',
      type: 'Best Assist',
      typeColor: '#3b82f6',
      title: pickFromSeeded(assistDescriptions, rng),
      description: 'Creativity at its finest',
      matchContext: `${opp} (Home: ${bestAssistMatch.homeScore} - ${bestAssistMatch.awayScore} Away)`,
      minute: seededBetween(10, 75, rng),
    });
  } else {
    moments.push({
      id: 'best_assist',
      type: 'Best Assist',
      typeColor: '#3b82f6',
      title: pickFromSeeded(assistDescriptions, rng),
      description: 'A moment of pure vision',
      matchContext: `${clubName} vs ${getOpponent()}`,
      minute: seededBetween(25, 70, rng),
    });
  }

  // Best Match Performance
  if (bestRated) {
    const opp = isPlayerHome(bestRated) ? bestRated.awayClub.name : bestRated.homeClub.name;
    moments.push({
      id: 'best_performance',
      type: 'Best Performance',
      typeColor: '#f59e0b',
      title: `Rating ${bestRated.playerRating.toFixed(1)} against ${opp}`,
      description: `${bestRated.playerGoals} goals, ${bestRated.playerAssists} assists, ${bestRated.playerMinutesPlayed} minutes played`,
      matchContext: `${opp} (Home: ${bestRated.homeScore} - ${bestRated.awayScore} Away)`,
    });
  } else {
    moments.push({
      id: 'best_performance',
      type: 'Best Performance',
      typeColor: '#f59e0b',
      title: `Standout display vs ${getOpponent()}`,
      description: `Rating ${seededBetween(75, 95, rng) / 10}`,
      matchContext: `${clubName} vs ${getOpponent()}`,
    });
  }

  // Best Comeback
  const comebackScore = seededBetween(1, 2, rng);
  moments.push({
    id: 'best_comeback',
    type: 'Best Comeback',
    typeColor: '#ef4444',
    title: `Came from ${comebackScore} down to win`,
    description: 'Never-say-die attitude inspired the whole team',
    matchContext: `${clubName} vs ${getOpponent()}`,
    minute: seededBetween(60, 90, rng),
  });

  // Most Important Win
  moments.push({
    id: 'important_win',
    type: 'Crucial Victory',
    typeColor: '#34d399',
    title: `Decisive win in the ${seededBetween(20, 35, rng)}th matchweek`,
    description: 'Three points that changed the shape of the season',
    matchContext: `${clubName} vs ${getOpponent()}`,
  });

  // Best Defensive Action
  const defensiveActions = [
    'A last-ditch tackle that saved a certain goal',
    'An interception that launched a counter-attack',
    'A crucial block from point-blank range',
    'A perfectly timed sliding challenge on the edge of the box',
    'A recovery run that stopped a dangerous breakaway',
  ];
  moments.push({
    id: 'defensive',
    type: 'Defensive Heroics',
    typeColor: '#3b82f6',
    title: pickFromSeeded(defensiveActions, rng),
    description: 'A moment that kept the clean sheet intact',
    matchContext: `${clubName} vs ${getOpponent()}`,
    minute: seededBetween(30, 85, rng),
  });

  return moments;
}

function BestMomentsGallery({ moments }: { moments: BestMoment[] }) {
  return (
    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {moments.map((moment) => (
        <motion.div
          key={moment.id}
          variants={itemVariants}
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
        >
          {/* SVG placeholder image */}
          <div
            className="h-24 flex items-center justify-center relative"
            style={{ backgroundColor: '#0d1117' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke={moment.typeColor} strokeWidth="1.5" opacity="0.3" />
              <path d="M8 12l3 3 5-6" stroke={moment.typeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            {/* Type badge */}
            <div
              className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{ backgroundColor: `${moment.typeColor}20`, color: moment.typeColor, border: `1px solid ${moment.typeColor}30` }}
            >
              {moment.type}
            </div>
            {moment.minute != null && (
              <div
                className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#8b949e' }}
              >
                {moment.minute}&apos;
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs font-bold text-[#e6edf3] leading-snug">{moment.title}</p>
            <p className="text-[10px] text-[#8b949e] mt-1">{moment.description}</p>
            <p className="text-[9px] text-[#484f58] mt-1.5">{moment.matchContext}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// 4. PLAYER OF THE SEASON AWARD
// ============================================================

function PlayerOfTheSeasonAward({
  player,
  stats,
  position,
  seasonNumber,
  clubName,
}: {
  player: { name: string; overall: number; position: string; age: string | number; marketValue: number };
  stats: SeasonPlayerStats;
  position: number;
  seasonNumber: number;
  clubName: string;
}) {
  const rng = seededRandom(seasonNumber * 99991 + 77);

  const fanVote = seededBetween(15, 68, rng);
  const squadRank = position <= 3 ? seededBetween(1, 3, rng) : position <= 8 ? seededBetween(3, 8, rng) : seededBetween(5, 15, rng);

  const quotes = [
    'A season that will be remembered for years to come. Every touch mattered.',
    'Consistency was the hallmark — showing up week in, week out with determination.',
    'When the team needed a hero, this player answered the call time and again.',
    'Statistics tell only half the story. The leadership and drive were immeasurable.',
    'From the first whistle to the last, a campaign of pure commitment and quality.',
  ];
  const quote = pickFromSeeded(quotes, rng);

  const statGrid: { label: string; value: string | number; color: string }[] = [
    { label: 'Appearances', value: stats.appearances, color: '#8b949e' },
    { label: 'Starts', value: stats.starts, color: '#8b949e' },
    { label: 'Minutes', value: stats.minutesPlayed, color: '#8b949e' },
    { label: 'Goals', value: stats.goals, color: '#34d399' },
    { label: 'Assists', value: stats.assists, color: '#3b82f6' },
    { label: 'Avg Rating', value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-', color: '#f59e0b' },
    { label: 'MotM', value: stats.manOfTheMatch, color: '#f59e0b' },
    { label: 'Yellow Cards', value: stats.yellowCards, color: '#f59e0b' },
    { label: 'Red Cards', value: stats.redCards, color: '#ef4444' },
    { label: 'Clean Sheets', value: stats.cleanSheets, color: '#34d399' },
    { label: 'Goals/90', value: stats.minutesPlayed > 0 ? ((stats.goals / stats.minutesPlayed) * 90).toFixed(1) : '0', color: '#34d399' },
    { label: 'Assists/90', value: stats.minutesPlayed > 0 ? ((stats.assists / stats.minutesPlayed) * 90).toFixed(1) : '0', color: '#3b82f6' },
  ];

  return (
    <div className="px-4 pb-4">
      <motion.div
        variants={itemVariants}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        {/* Award header */}
        <div className="p-5 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.06)' }}>
          <TrophySVG color="#f59e0b" />
          <h3 className="text-lg font-black text-white mt-2">Player of the Season</h3>
          <p className="text-xs text-[#8b949e] mt-0.5">{clubName} &middot; Season {seasonNumber}</p>
        </div>

        {/* Player info */}
        <div className="px-4 pt-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
            style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399', border: '2px solid rgba(52,211,153,0.25)' }}
          >
            {player.overall}
          </div>
          <div>
            <p className="text-base font-bold text-[#e6edf3]">{player.name}</p>
            <p className="text-xs text-[#8b949e]">{player.position} &middot; Age {player.age}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-px mt-4" style={{ backgroundColor: '#21262d' }}>
          {statGrid.map((s) => (
            <div key={s.label} className="p-2.5 text-center" style={{ backgroundColor: '#161b22' }}>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[8px] text-[#484f58] uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Squad rank + Fan vote */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-2">
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
          >
            <p className="text-2xl font-black" style={{ color: squadRank <= 3 ? '#34d399' : '#f59e0b' }}>
              #{squadRank}
            </p>
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mt-0.5">Squad Rank</p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
          >
            <p className="text-2xl font-black" style={{ color: fanVote > 40 ? '#34d399' : '#f59e0b' }}>
              {fanVote}%
            </p>
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wider mt-0.5">Fan Vote</p>
          </div>
        </div>

        {/* Quote */}
        <div className="px-4 pt-2 pb-4">
          <div
            className="rounded-lg px-3 py-2.5"
            style={{ backgroundColor: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
          >
            <p className="text-[11px] italic text-[#8b949e] leading-relaxed">&ldquo;{quote}&rdquo;</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// 5. SEASON STATISTICS DEEP DIVE
// ============================================================

function SeasonStatisticsDeepDive({
  seasonNumber,
  stats,
  results,
  playerGoals,
  playerAssists,
  playerName,
}: {
  seasonNumber: number;
  stats: SeasonPlayerStats;
  results: MatchResult[];
  playerGoals: number;
  playerAssists: number;
  playerName: string;
}) {
  const rng = seededRandom(seasonNumber * 55577 + 33);

  // Monthly performance
  const months: MonthlyPerformance[] = [
    { month: 'Aug', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 6)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 6)), rng) },
    { month: 'Sep', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 5)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 5)), rng) },
    { month: 'Oct', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 5)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 5)), rng) },
    { month: 'Nov', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 6)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 6)), rng) },
    { month: 'Dec', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 6)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 6)), rng) },
    { month: 'Jan', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 7)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 7)), rng) },
    { month: 'Feb', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 7)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 7)), rng) },
    { month: 'Mar', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 8)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 8)), rng) },
    { month: 'Apr', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 8)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 8)), rng) },
    { month: 'May', goals: seededBetween(0, Math.max(1, Math.floor(playerGoals / 9)), rng), assists: seededBetween(0, Math.max(1, Math.floor(playerAssists / 9)), rng) },
  ];

  // Adjust to match totals
  const totalGeneratedGoals = months.reduce((s, m) => s + m.goals, 0);
  const totalGeneratedAssists = months.reduce((s, m) => s + m.assists, 0);
  if (totalGeneratedGoals > 0) {
    const diff = playerGoals - totalGeneratedGoals;
    if (diff !== 0) months[Math.min(8, months.length - 1)].goals = Math.max(0, months[Math.min(8, months.length - 1)].goals + diff);
  }
  if (totalGeneratedAssists > 0) {
    const diff = playerAssists - totalGeneratedAssists;
    if (diff !== 0) months[Math.min(7, months.length - 1)].assists = Math.max(0, months[Math.min(7, months.length - 1)].assists + diff);
  }

  const maxMonthly = Math.max(...months.map(m => Math.max(m.goals, m.assists)), 1);

  // Personal records
  const bestRated = results.length > 0 ? Math.max(...results.map(r => r.playerRating)) : 0;
  const scoringStreak = seededBetween(1, Math.min(playerGoals, 5), rng);
  const highestPasses = seededBetween(20, 65, rng);
  const longestStreak: Record<string, number> = {
    'Longest Scoring Streak': scoringStreak,
    'Highest Match Rating': bestRated > 0 ? bestRated : seededBetween(65, 92, rng) / 10,
    'Most Passes in a Game': highestPasses,
    'Most Dribbles': seededBetween(2, 8, rng),
    'Most Tackles': seededBetween(1, 6, rng),
    'Longest Unbeaten Run': seededBetween(3, 12, rng),
  };

  // Club records comparison
  const clubRecords: Record<string, number> = {
    'Club Season Goals Record': Math.max(playerGoals + seededBetween(2, 10, rng), 15),
    'Club Season Assists Record': Math.max(playerAssists + seededBetween(2, 8, rng), 12),
    'Club Highest Rating': Math.max(bestRated + 0.3, 8.5),
    'Club Appearances Record': Math.max(stats.appearances + seededBetween(2, 8, rng), 38),
  };

  // Season awards
  const monthNames = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];
  const potmMonths = playerGoals >= 3 ? [pickFromSeeded(monthNames, rng)] : [];
  const totwCount = stats.averageRating >= 7.0 ? seededBetween(2, 8, rng) : stats.averageRating >= 6.5 ? seededBetween(1, 4, rng) : seededBetween(0, 2, rng);

  return (
    <div className="px-4 pb-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full h-10 rounded-lg p-1" style={{ backgroundColor: '#21262d' }}>
          <TabsTrigger
            value="overview"
            className="text-xs font-semibold rounded-md h-8 data-[state=active]:bg-[#30363d] data-[state=active]:text-white text-[#8b949e]"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="text-xs font-semibold rounded-md h-8 data-[state=active]:bg-[#30363d] data-[state=active]:text-white text-[#8b949e]"
          >
            Records
          </TabsTrigger>
          <TabsTrigger
            value="awards"
            className="text-xs font-semibold rounded-md h-8 data-[state=active]:bg-[#30363d] data-[state=active]:text-white text-[#8b949e]"
          >
            Awards
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          {/* Monthly bar chart */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <p className="text-xs font-bold text-[#c9d1d9] mb-3">Monthly Goals &amp; Assists</p>
            <div className="overflow-x-auto">
              <MiniBarChart data={months} maxValue={maxMonthly} />
            </div>
          </div>

          {/* League position timeline */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <p className="text-xs font-bold text-[#c9d1d9] mb-3">Cumulative Points Trend</p>
            <svg width="100%" height="60" viewBox="0 0 260 60" preserveAspectRatio="none">
              {Array.from({ length: 10 }).map((_, i) => {
                const x = (i / 9) * 250 + 5;
                const pts = seededBetween(3, 12, rng);
                const h = (pts / 12) * 45;
                return (
                  <g key={i}>
                    <rect x={x - 8} y={50 - h} width={16} height={h} fill="#34d399" rx="2" opacity="0.6" />
                    <text x={x} y={59} textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="monospace">
                      {months[i]?.month.slice(0, 1) ?? ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="mt-3 space-y-3">
          {/* Personal records */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #21262d' }}>
              <p className="text-xs font-bold text-[#c9d1d9]">Personal Records</p>
            </div>
            <div className="divide-y" style={{ borderColor: '#21262d' }}>
              {Object.entries(longestStreak).map(([label, value]) => (
                <div key={label} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#8b949e]">{label}</span>
                  <span className="text-xs font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Club records comparison */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #21262d' }}>
              <p className="text-xs font-bold text-[#c9d1d9]">vs Club Records</p>
            </div>
            <div className="divide-y" style={{ borderColor: '#21262d' }}>
              {Object.entries(clubRecords).map(([label, value]) => (
                <div key={label} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#8b949e]">{label}</span>
                  <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="mt-3 space-y-3">
          {/* Player of the Month */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #21262d' }}>
              <p className="text-xs font-bold text-[#c9d1d9]">Player of the Month</p>
            </div>
            {potmMonths.length > 0 ? (
              <div className="divide-y" style={{ borderColor: '#21262d' }}>
                {potmMonths.map((m) => (
                  <div key={m} className="px-4 py-2.5 flex items-center gap-2">
                    <Medal className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    <span className="text-xs font-semibold text-[#e6edf3]">{m} PotM</span>
                    <Badge className="ml-auto text-[8px] px-1.5 py-0.5 font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                      WON
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-[11px] text-[#484f58]">
                No Player of the Month awards this season
              </div>
            )}
          </div>

          {/* Team of the Week */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <p className="text-xs font-bold text-[#c9d1d9] mb-2">Team of the Week Appearances</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black" style={{ color: totwCount >= 5 ? '#34d399' : totwCount >= 2 ? '#f59e0b' : '#8b949e' }}>
                {totwCount}
              </p>
              <div className="flex-1">
                <RatingBar value={totwCount} max={10} color={totwCount >= 5 ? '#34d399' : '#f59e0b'} />
              </div>
            </div>
          </div>

          {/* Season accolades summary */}
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: '#161b22', borderColor: '#21262d' }}
          >
            <p className="text-xs font-bold text-[#c9d1d9] mb-2">Season Accolades</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Total Awards</span>
                <span className="font-bold text-white">{potmMonths.length + totwCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">PotM Awards</span>
                <span className="font-bold" style={{ color: '#f59e0b' }}>{potmMonths.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">TotW Selections</span>
                <span className="font-bold" style={{ color: '#3b82f6' }}>{totwCount}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// 6. SEASON VERDICT
// ============================================================

function SeasonVerdict({
  seasonNumber,
  stats,
  position,
  results,
  playerName,
  clubName,
}: {
  seasonNumber: number;
  stats: SeasonPlayerStats;
  position: number;
  results: MatchResult[];
  playerName: string;
  clubName: string;
}) {
  const rng = seededRandom(seasonNumber * 12345 + 99);

  const attackingRating = Math.min(10, stats.goals > 15 ? 8 + (stats.goals - 15) * 0.1 : 4 + stats.goals * 0.3);
  const defensiveRating = Math.min(10, stats.cleanSheets > 10 ? 7 + (stats.cleanSheets - 10) * 0.15 : 3 + stats.cleanSheets * 0.4);
  const avgRating = stats.averageRating;
  const consistencyRating = Math.min(10, avgRating >= 7.5 ? 8 + (avgRating - 7.5) * 2 : 3 + avgRating * 0.7);
  const bigGameWins = seededBetween(1, Math.floor(stats.appearances * 0.15), rng);
  const bigGameRating = Math.min(10, 4 + bigGameWins * 0.8);
  const improvementRating = seededBetween(4, 9, rng);

  const rating: SeasonRating = {
    overall: ((attackingRating + defensiveRating + consistencyRating + bigGameRating + improvementRating) / 5),
    grade: '',
    attacking: attackingRating,
    defensive: defensiveRating,
    consistency: consistencyRating,
    bigGame: bigGameRating,
    improvement: improvementRating,
  };
  rating.overall = Math.round(rating.overall * 10) / 10;
  rating.grade = getGrade(rating.overall);

  const breakdownItems = [
    { label: 'Attacking Performance', value: rating.attacking, color: '#34d399' },
    { label: 'Defensive Contribution', value: rating.defensive, color: '#3b82f6' },
    { label: 'Consistency', value: rating.consistency, color: '#f59e0b' },
    { label: 'Big Game Performance', value: rating.bigGame, color: '#ef4444' },
    { label: 'Improvement', value: rating.improvement, color: '#a855f7' },
  ];

  // Summary paragraph
  const summaries = [
    `A ${rating.overall >= 7 ? 'strong' : 'decent'} season for ${playerName} at ${clubName}. With ${stats.goals} goals and ${stats.assists} assists across ${stats.appearances} appearances, there were moments of real quality. The challenge now is to build on this foundation and push for even greater heights next season.`,
    `${playerName}'s season at ${clubName} was defined by ${rating.overall >= 7 ? 'consistent excellence' : 'steady development'}. Finishing in ${getOrdinal(position)} and contributing ${stats.goals + stats.assists} goal involvements shows the impact made. There is clear potential for further growth in the coming campaign.`,
    `At ${clubName}, ${playerName} produced a ${rating.overall >= 7 ? 'campaign to remember' : 'solid season of learning'}. With an average rating of ${avgRating > 0 ? avgRating.toFixed(1) : 'N/A'} across ${stats.appearances} matches, the season provided valuable experience. The next step is to turn promise into consistent output.`,
  ];
  const summary = pickFromSeeded(summaries, rng);

  const nextSeasonTargets = [
    `Score ${stats.goals + seededBetween(3, 8, rng)} goals next season`,
    `Push for ${Math.max(1, position - seededBetween(1, 3, rng))}${position <= 3 ? ' or better' : ''}`,
    'Improve defensive contribution',
    `Maintain average rating above ${(avgRating > 0 ? avgRating : 6.5).toFixed(1)}`,
  ];

  return (
    <div className="px-4 pb-4">
      <motion.div
        variants={itemVariants}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        {/* Overall grade */}
        <div className="p-5 text-center" style={{ backgroundColor: 'rgba(52,211,153,0.04)' }}>
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-1">Overall Season Grade</p>
          <p className="text-4xl font-black" style={{ color: rating.overall >= 7 ? '#34d399' : rating.overall >= 5 ? '#f59e0b' : '#ef4444' }}>
            {rating.grade}
          </p>
          <p className="text-sm font-semibold text-white mt-1">{rating.overall.toFixed(1)} / 10</p>
        </div>

        {/* Breakdown */}
        <div className="px-4 py-3 space-y-3">
          {breakdownItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#8b949e]">{item.label}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.value.toFixed(1)}</span>
              </div>
              <RatingBar value={item.value} max={10} color={item.color} />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">{summary}</p>
        </div>

        {/* Next Season Preview */}
        <div className="px-4 pb-4">
          <div
            className="rounded-lg border p-3"
            style={{ backgroundColor: '#0d1117', borderColor: '#21262d' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
              <p className="text-xs font-bold text-[#c9d1d9]">Next Season Preview</p>
            </div>
            <ul className="space-y-1">
              {nextSeasonTargets.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#484f58' }} />
                  <span className="text-[10px] text-[#8b949e]">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Share/Save buttons (visual only) */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}
          >
            <ShareSVG color="#8b949e" />
            Share
          </button>
          <button
            className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}
          >
            <SaveSVG color="#8b949e" />
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ShareSVG({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SaveSVG({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

// ============================================================
// 7. SEASON COMPARISON
// ============================================================

function SeasonComparison({
  currentStats,
  previousStats,
  seasons,
}: {
  currentStats: SeasonPlayerStats;
  previousStats: SeasonPlayerStats | null;
  seasons: { number: number; avgRating: number; overall: number }[];
}) {
  const comparisons: StatComparisonRow[] = [
    { label: 'Appearances', current: currentStats.appearances, previous: previousStats?.appearances ?? 0, suffix: '' },
    { label: 'Goals', current: currentStats.goals, previous: previousStats?.goals ?? 0, suffix: '' },
    { label: 'Assists', current: currentStats.assists, previous: previousStats?.assists ?? 0, suffix: '' },
    { label: 'Minutes Played', current: currentStats.minutesPlayed, previous: previousStats?.minutesPlayed ?? 0, suffix: '' },
    { label: 'Avg Rating', current: currentStats.averageRating, previous: previousStats?.averageRating ?? 0, suffix: '' },
    { label: 'Starts', current: currentStats.starts, previous: previousStats?.starts ?? 0, suffix: '' },
    { label: 'Man of the Match', current: currentStats.manOfTheMatch, previous: previousStats?.manOfTheMatch ?? 0, suffix: '' },
    { label: 'Clean Sheets', current: currentStats.cleanSheets, previous: previousStats?.cleanSheets ?? 0, suffix: '' },
    { label: 'Yellow Cards', current: currentStats.yellowCards, previous: previousStats?.yellowCards ?? 0, suffix: '' },
    { label: 'Red Cards', current: currentStats.redCards, previous: previousStats?.redCards ?? 0, suffix: '' },
    { label: 'Goals + Assists', current: currentStats.goals + currentStats.assists, previous: (previousStats?.goals ?? 0) + (previousStats?.assists ?? 0), suffix: '' },
    { label: 'Goals/90', current: currentStats.minutesPlayed > 0 ? ((currentStats.goals / currentStats.minutesPlayed) * 90) : 0, previous: (previousStats?.minutesPlayed ?? 0) > 0 ? (((previousStats?.goals ?? 0) / (previousStats?.minutesPlayed ?? 1)) * 90) : 0, suffix: '' },
  ];

  const improvedCount = comparisons.filter(c => c.current > c.previous).length;
  const declinedCount = comparisons.filter(c => c.current < c.previous).length;
  const overallVerdict = improvedCount > declinedCount ? 'Improved' as const : declinedCount > improvedCount ? 'Declined' as const : 'Maintained' as const;

  const trajectoryData = seasons.map(s => ({
    number: s.number,
    avgRating: s.avgRating,
    overall: s.overall,
  }));

  return (
    <div className="px-4 pb-4">
      <motion.div
        variants={itemVariants}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        {/* Verdict badge */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #21262d' }}>
          <p className="text-xs font-bold text-[#c9d1d9]">Season vs Season Comparison</p>
          <Badge
            className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider"
            style={{
              backgroundColor: overallVerdict === 'Improved' ? 'rgba(52,211,153,0.15)' : overallVerdict === 'Declined' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: overallVerdict === 'Improved' ? '#34d399' : overallVerdict === 'Declined' ? '#ef4444' : '#f59e0b',
              border: `1px solid ${overallVerdict === 'Improved' ? 'rgba(52,211,153,0.25)' : overallVerdict === 'Declined' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            {overallVerdict === 'Improved' && <TrendingUp className="w-3 h-3 mr-1" />}
            {overallVerdict === 'Declined' && <TrendingDown className="w-3 h-3 mr-1" />}
            {overallVerdict === 'Maintained' && <Minus className="w-3 h-3 mr-1" />}
            {overallVerdict}
          </Badge>
        </div>

        {/* Stat comparison rows */}
        <div className="divide-y" style={{ borderColor: '#21262d' }}>
          {comparisons.map((row) => {
            const diff = row.current - row.previous;
            const isImproved = diff > 0;
            const isDeclined = diff < 0;
            const displayCurrent = row.suffix ? `${row.current.toFixed(1)}${row.suffix}` : row.current;
            const displayPrevious = row.suffix ? `${row.previous.toFixed(1)}${row.suffix}` : row.previous;

            return (
              <div key={row.label} className="px-4 py-2.5 flex items-center">
                <span className="text-[11px] text-[#8b949e] flex-1">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#484f58] w-12 text-right">{displayPrevious}</span>
                  <div className="w-4 flex items-center justify-center">
                    {isImproved && <TrendingUp className="w-3 h-3" style={{ color: '#34d399' }} />}
                    {isDeclined && <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />}
                    {!isImproved && !isDeclined && <Minus className="w-3 h-3" style={{ color: '#484f58' }} />}
                  </div>
                  <span className="text-xs font-bold w-12 text-right" style={{ color: isImproved ? '#34d399' : isDeclined ? '#ef4444' : '#8b949e' }}>
                    {displayCurrent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Career trajectory */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #21262d' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />
            <p className="text-xs font-bold text-[#c9d1d9]">Career Trajectory</p>
          </div>
          <div className="overflow-x-auto">
            <CareerTrajectoryChart seasons={trajectoryData} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SeasonReviewDocumentary() {
  const { gameState, setScreen } = useGameStore();
  const [activeSection, setActiveSection] = useState(0);

  const data = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, currentSeason, year, seasons, leagueTable, recentResults } = gameState;
    const stats = player.seasonStats;
    const currentSeasonData = seasons.find(s => s.number === currentSeason);
    const previousSeasonData = seasons.length >= 2 ? seasons[seasons.length - 2] : null;

    // Find club standing
    const clubStanding = leagueTable.find(s => s.clubId === currentClub.id);
    const position = clubStanding ? (() => {
      const sorted = [...leagueTable].sort((a, b) => b.points - a.points);
      return sorted.findIndex(s => s.clubId === currentClub.id) + 1;
    })() : 12;

    const points = clubStanding?.points ?? 0;
    const wins = clubStanding?.won ?? 0;
    const draws = clubStanding?.drawn ?? 0;
    const losses = clubStanding?.lost ?? 0;
    const goalsFor = clubStanding?.goalsFor ?? 0;
    const goalsAgainst = clubStanding?.goalsAgainst ?? 0;
    const trophyCount = player.careerStats.trophies.filter(t => t.season === currentSeason).length;

    // Timeline
    const timeline = generateTimeline(
      currentSeason, stats, recentResults, position,
      stats.goals, stats.assists, stats.averageRating, currentClub.name,
      currentClub.id
    );

    // Best moments
    const bestMoments = generateBestMoments(
      currentSeason, stats, recentResults, player.name, currentClub.name,
      currentClub.id
    );

    // Career trajectory data
    const trajectorySeasons = seasons.map(s => ({
      number: s.number,
      avgRating: s.playerStats.averageRating,
      overall: 0, // not stored in season history, use 0 placeholder
    }));

    return {
      seasonNumber: currentSeason,
      year,
      clubName: currentClub.name,
      clubLogo: currentClub.logo,
      player,
      stats,
      position,
      points,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      trophyCount,
      timeline,
      bestMoments,
      currentSeasonData,
      previousSeasonData,
      trajectorySeasons,
      recentResults,
    };
  }, [gameState]);

  if (!gameState || !data) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-sm text-[#484f58]">No season data available</p>
      </div>
    );
  }

  const sections = [
    { id: 'cover', label: 'Cover' },
    { id: 'timeline', label: 'Journey' },
    { id: 'moments', label: 'Moments' },
    { id: 'award', label: 'Award' },
    { id: 'stats', label: 'Stats' },
    { id: 'verdict', label: 'Verdict' },
    { id: 'comparison', label: 'Compare' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* ============================================ */}
      {/* Floating section nav */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-20 px-3 py-2 flex items-center gap-2 overflow-x-auto"
        style={{ backgroundColor: 'rgba(13,17,23,0.92)', borderBottom: '1px solid #21262d' }}
      >
        <button
          onClick={() => setScreen('dashboard')}
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: '#21262d', border: '1px solid #30363d' }}
        >
          <ArrowLeft className="w-4 h-4 text-[#8b949e]" />
        </button>
        <div className="flex items-center gap-1 overflow-x-auto">
          {sections.map((sec, i) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(i)}
              className="shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: activeSection === i ? 'rgba(52,211,153,0.12)' : 'transparent',
                color: activeSection === i ? '#34d399' : '#484f58',
                border: activeSection === i ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent',
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* 1. Cover Page */}
      {/* ============================================ */}
      <div id="section-cover">
        <SeasonCoverPage
          seasonNumber={data.seasonNumber}
          year={data.year}
          clubName={data.clubName}
          clubLogo={data.clubLogo}
          player={data.player}
          stats={data.stats}
          position={data.position}
          points={data.points}
          wins={data.wins}
          draws={data.draws}
          losses={data.losses}
          goalsFor={data.goalsFor}
          goalsAgainst={data.goalsAgainst}
          trophyCount={data.trophyCount}
        />
      </div>

      <SectionDivider label="Season Journey" />

      {/* ============================================ */}
      {/* 2. Journey Timeline */}
      {/* ============================================ */}
      <div id="section-timeline">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SeasonJourneyTimeline phases={data.timeline} />
        </motion.div>
      </div>

      <SectionDivider label="Best Moments" />

      {/* ============================================ */}
      {/* 3. Best Moments Gallery */}
      {/* ============================================ */}
      <div id="section-moments">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <BestMomentsGallery moments={data.bestMoments} />
        </motion.div>
      </div>

      <SectionDivider label="Player of the Season" />

      {/* ============================================ */}
      {/* 4. Player of the Season Award */}
      {/* ============================================ */}
      <div id="section-award">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <PlayerOfTheSeasonAward
            player={data.player}
            stats={data.stats}
            position={data.position}
            seasonNumber={data.seasonNumber}
            clubName={data.clubName}
          />
        </motion.div>
      </div>

      <SectionDivider label="Deep Dive" />

      {/* ============================================ */}
      {/* 5. Season Statistics Deep Dive */}
      {/* ============================================ */}
      <div id="section-stats">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SeasonStatisticsDeepDive
            seasonNumber={data.seasonNumber}
            stats={data.stats}
            results={data.recentResults}
            playerGoals={data.stats.goals}
            playerAssists={data.stats.assists}
            playerName={data.player.name}
          />
        </motion.div>
      </div>

      <SectionDivider label="Season Verdict" />

      {/* ============================================ */}
      {/* 6. Season Verdict */}
      {/* ============================================ */}
      <div id="section-verdict">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SeasonVerdict
            seasonNumber={data.seasonNumber}
            stats={data.stats}
            position={data.position}
            results={data.recentResults}
            playerName={data.player.name}
            clubName={data.clubName}
          />
        </motion.div>
      </div>

      <SectionDivider label="Season Comparison" />

      {/* ============================================ */}
      {/* 7. Season Comparison */}
      {/* ============================================ */}
      <div id="section-comparison">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SeasonComparison
            currentStats={data.stats}
            previousStats={data.previousSeasonData?.playerStats ?? null}
            seasons={data.trajectorySeasons}
          />
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* Back to Dashboard button */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.8 }}
        className="px-4 pb-10 pt-4"
      >
        <Button
          onClick={() => setScreen('dashboard')}
          className="w-full h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#34d399',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#10b981';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#34d399';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Decorative footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center justify-center gap-2 px-4 pb-6"
      >
        <div className="h-px flex-1" style={{ backgroundColor: '#21262d' }} />
        <StarSVG color="#f59e0b" size={6} />
        <StarSVG color="#ffd700" size={10} />
        <StarSVG color="#f59e0b" size={6} />
        <div className="h-px flex-1" style={{ backgroundColor: '#21262d' }} />
      </motion.div>
    </div>
  );
}
