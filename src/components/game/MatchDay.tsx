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
  SkipForward, Gauge, Radio
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchEvent, MatchEventType, MatchResult } from '@/lib/game/types';
import PressConference from '@/components/game/PressConference';

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
  };
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
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
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
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
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
      .filter(e => ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'chance', 'save', 'penalty_won', 'penalty_missed'].includes(e.type))
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
                    className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-full"
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
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-4 px-4 pb-3">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {lastResult.homeClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">{homeName}</span>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center gap-1 min-w-[90px]">
                <motion.div
                  key={`${liveScore.home}-${liveScore.away}`}
                  animate={goalFlash ? {
                    scale: [1, 1.15, 1],
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
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
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
                animate={{ scale: [1, 1.2, 1] }}
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
                  animate={{ scale: [1, 1.05, 1] }}
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
    const isMotm = lastResult.playerRating >= 8.0;
    const ratingColor = lastResult.playerRating >= 7 ? '#10b981' : lastResult.playerRating >= 6 ? '#f59e0b' : '#ef4444';

    const homeName = lastResult.homeClub.shortName || lastResult.homeClub.name.slice(0, 3);
    const awayName = lastResult.awayClub.shortName || lastResult.awayClub.name.slice(0, 3);

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Result Header Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
            <div className={`h-2 ${won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500'}`} />
            <CardContent className="p-5 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-sm font-bold mb-4 tracking-wider ${won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400'}`}
              >
                {won ? '🏆 VICTORY!' : drew ? '🤝 DRAW' : '💪 DEFEAT'}
              </motion.p>

              {/* Score Display */}
              <div className="flex items-center justify-center gap-5 mb-4">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <span className="text-3xl">{lastResult.homeClub.logo}</span>
                  <span className="text-xs text-[#c9d1d9] font-medium">{homeName}</span>
                  <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400">HOME</Badge>
                </div>
                <div className="text-5xl font-black text-white tracking-wider">
                  {lastResult.homeScore} <span className="text-[#484f58]">-</span> {lastResult.awayScore}
                </div>
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <span className="text-3xl">{lastResult.awayClub.logo}</span>
                  <span className="text-xs text-[#c9d1d9] font-medium">{awayName}</span>
                  <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-400">AWAY</Badge>
                </div>
              </div>

              {/* Competition & Week */}
              <p className="text-[10px] text-[#8b949e]">
                {lastResult.competition === 'league' ? 'League' : lastResult.competition} • Week {lastResult.week} • Season {lastResult.season}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Performance Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Card className={`bg-[#161b22] border-[#30363d] overflow-hidden ${isMotm ? 'ring-1 ring-amber-500/30' : ''}`}>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-[#8b949e]  mb-3">Your Performance</p>

              {/* MOTM Badge */}
              {isMotm && (
                <div className="mb-3">
                  <MOTMBadge />
                </div>
              )}

              {/* Rating */}
              <motion.div
                animate={isMotm ? {
                  textShadow: [
                    '0 0 8px rgba(251,191,36,0.3)',
                    '0 0 20px rgba(251,191,36,0.6)',
                    '0 0 8px rgba(251,191,36,0.3)',
                  ],
                } : {}}
                transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-6xl font-black"
                style={{ color: isMotm ? '#fbbf24' : ratingColor }}
              >
                {lastResult.playerRating.toFixed(1)}
              </motion.div>
              <p className="text-sm text-[#8b949e] mt-1">{getMatchRatingLabel(lastResult.playerRating)}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#30363d]">
                {[
                  { value: lastResult.playerGoals, label: 'Goals', icon: <Target className="w-3 h-3 text-emerald-400" /> },
                  { value: lastResult.playerAssists, label: 'Assists', icon: <Zap className="w-3 h-3 text-sky-400" /> },
                  { value: `${lastResult.playerMinutesPlayed}'`, label: 'Minutes', icon: <Clock className="w-3 h-3 text-[#8b949e]" /> },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#21262d] rounded-lg py-2 px-1">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      {stat.icon}
                      <span className="text-lg font-bold text-white">{stat.value}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
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
                <StatBar
                  homeValue={matchStats.homePossession}
                  awayValue={100 - matchStats.homePossession}
                  homeLabel={`${matchStats.homePossession}%`}
                  awayLabel={`${100 - matchStats.homePossession}%`}
                  title="Possession"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                <StatBar
                  homeValue={matchStats.homeShots}
                  awayValue={matchStats.awayShots}
                  homeLabel={String(matchStats.homeShots)}
                  awayLabel={String(matchStats.awayShots)}
                  title="Shots"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                <StatBar
                  homeValue={matchStats.homeShotsOnTarget}
                  awayValue={matchStats.awayShotsOnTarget}
                  homeLabel={String(matchStats.homeShotsOnTarget)}
                  awayLabel={String(matchStats.awayShotsOnTarget)}
                  title="Shots on Target"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                <StatBar
                  homeValue={matchStats.homeCorners}
                  awayValue={matchStats.awayCorners}
                  homeLabel={String(matchStats.homeCorners)}
                  awayLabel={String(matchStats.awayCorners)}
                  title="Corners"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                <StatBar
                  homeValue={matchStats.homeFouls}
                  awayValue={matchStats.awayFouls}
                  homeLabel={String(matchStats.homeFouls)}
                  awayLabel={String(matchStats.awayFouls)}
                  title="Fouls"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
                <StatBar
                  homeValue={matchStats.homePassAcc}
                  awayValue={matchStats.awayPassAcc}
                  homeLabel={`${matchStats.homePassAcc}%`}
                  awayLabel={`${matchStats.awayPassAcc}%`}
                  title="Pass Accuracy"
                  homeClubbName={homeName}
                  awayClubName={awayName}
                />
              </CardContent>
            </Card>
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

        {/* Press Conference Button */}
        {lastResult.playerMinutesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={() => setShowPressConference(true)}
              variant="outline"
              className="w-full h-12 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg font-semibold gap-2"
            >
              <span className="text-lg">🎙️</span>
              Press Conference
            </Button>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button onClick={() => { setShowResult(false); setScreen('dashboard'); }} className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-semibold">
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Press Conference Modal */}
        <PressConference
          open={showPressConference}
          onClose={() => setShowPressConference(false)}
          matchResult={lastResult}
        />
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
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
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
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${currentClub.primaryColor}20`, border: `2px solid ${currentClub.primaryColor}40` }}
                    >
                      {currentClub.logo}
                    </div>
                    <span className="font-semibold text-sm text-white text-center leading-tight">{currentClub.shortName || currentClub.name}</span>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{currentClub.squadQuality} OVR</Badge>
                    <Badge variant="outline" className="text-[9px] border-slate-600">{currentClub.formation}</Badge>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-[#8b949e] font-black text-xl"
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
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${opponent.primaryColor}20`, border: `2px solid ${opponent.primaryColor}40` }}
                    >
                      {opponent.logo}
                    </div>
                    <span className="font-semibold text-sm text-white text-center leading-tight">{opponent.shortName || opponent.name}</span>
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
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : player.form >= 5
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #ef4444, #f87171)',
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
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : player.morale >= 40
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #ef4444, #f87171)',
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="space-y-3"
          >
            <Button
              onClick={handlePlayMatch}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              <Play className="mr-2 h-5 w-5" />
              Play Match
            </Button>
            <Button
              onClick={handleSimulate}
              variant="outline"
              className="w-full h-10 border-[#30363d] text-[#8b949e] rounded-lg text-sm"
            >
              <FastForward className="mr-2 h-4 w-4" />
              Quick Simulate
            </Button>
          </motion.div>
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
