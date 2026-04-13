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
