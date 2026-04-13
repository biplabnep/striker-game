'use client';

import { useGameStore } from '@/store/gameStore';
import { getMatchRatingLabel } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Zap, ChevronLeft, ChevronRight, Target, Clock, Star, Crown,
  TrendingUp, TrendingDown, Minus, Award, Trophy, Flame, Shield,
  Footprints, ArrowUpCircle, ArrowDownCircle, BarChart3, Activity,
  X, Sparkles, CircleDot, CircleOff
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchResult, MatchEvent, MatchEventType } from '@/lib/game/types';

// ─── Event helpers ────────────────────────────────────────────
function getEventIcon(type: MatchEventType): string {
  const map: Record<MatchEventType, string> = {
    goal: '⚽', own_goal: '⚽', assist: '🅰️', yellow_card: '🟨',
    red_card: '🟥', second_yellow: '🟨🟥', substitution: '🔄',
    injury: '🏥', chance: '💫', save: '🧤', penalty_won: '🎯',
    penalty_missed: '❌', corner: '🚩', free_kick: '📐',
  };
  return map[type] || '📌';
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
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
}

function getEventLabel(type: MatchEventType): string {
  const map: Record<MatchEventType, string> = {
    goal: 'Goal', own_goal: 'Own Goal', assist: 'Assist',
    yellow_card: 'Yellow Card', red_card: 'Red Card',
    second_yellow: '2nd Yellow → Red', substitution: 'Substitution',
    injury: 'Injury', chance: 'Chance', save: 'Save',
    penalty_won: 'Penalty Won', penalty_missed: 'Penalty Missed',
    corner: 'Corner', free_kick: 'Free Kick',
  };
  return map[type] || type;
}

// ─── Rating badge color ───────────────────────────────────────
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (rating >= 7.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (rating >= 6.0) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  return 'bg-red-500/20 text-red-300 border-red-500/40';
}

function getRatingTextColor(rating: number): string {
  if (rating >= 8.0) return 'text-amber-300';
  if (rating >= 7.0) return 'text-emerald-400';
  if (rating >= 6.0) return 'text-yellow-400';
  return 'text-red-400';
}

// ─── Simulate match stats (seeded by club quality) ───────────
function simulateMatchStats(
  homeQuality: number, awayQuality: number,
  homeScore: number, awayScore: number,
  seed: number
) {
  const s = seed;
  const qualityDiff = homeQuality - awayQuality;
  const rng = (i: number) => (((s * 9301 + i * 49297 + 233280) % 233280) / 233280) - 0.5;

  const homePossession = Math.round(50 + qualityDiff * 0.3 + rng(1) * 10);
  const homeShots = Math.max(3, Math.round(12 + qualityDiff * 0.15 + homeScore * 2 + rng(2) * 6));
  const awayShots = Math.max(3, Math.round(12 - qualityDiff * 0.15 + awayScore * 2 + rng(3) * 6));
  const homeOnTarget = Math.min(homeShots, Math.max(1, Math.round(homeScore + 1 + rng(4) * 3)));
  const awayOnTarget = Math.min(awayShots, Math.max(1, Math.round(awayScore + 1 + rng(5) * 3)));
  const homeCorners = Math.max(1, Math.round(4 + qualityDiff * 0.1 + rng(6) * 4));
  const awayCorners = Math.max(1, Math.round(4 - qualityDiff * 0.1 + rng(7) * 4));

  return {
    homePossession: Math.max(25, Math.min(75, homePossession)),
    homeShots, awayShots,
    homeOnTarget, awayOnTarget,
    homeCorners, awayCorners,
  };
}

// ─── Compute player performance stats (simulated from rating) ─
function computePlayerPerformance(
  rating: number, minutes: number, goals: number, assists: number
) {
  const seed = Math.round(rating * 100) + minutes;
  const rng = (i: number) => (((seed * 9301 + i * 49297 + 233280) % 233280) / 233280);
  const minsRatio = minutes / 90;

  const passAcc = Math.round(70 + rating * 2.5 + (rng(1) - 0.5) * 8);
  const passes = Math.round((30 + rating * 5 + rng(2) * 15) * minsRatio);
  const keyPasses = Math.round((1 + assists * 1.5 + rng(3) * 2) * minsRatio);
  const tackles = Math.round((1 + rating * 0.3 + rng(4) * 2) * minsRatio);
  const shots = Math.round((1 + goals * 1.2 + rng(5) * 2) * minsRatio);
  const shotsOnTarget = Math.round(shots * (0.3 + rng(6) * 0.3));
  const dribbles = Math.round((1 + rating * 0.2 + rng(7) * 2) * minsRatio);
  const interceptions = Math.round((0.5 + rng(8) * 2) * minsRatio);

  return {
    passAccuracy: Math.max(55, Math.min(97, passAcc)),
    totalPasses: passes,
    keyPasses,
    tackles,
    shots,
    shotsOnTarget,
    dribbles,
    interceptions,
  };
}

// ─── Rating factors breakdown ─────────────────────────────────
function computeRatingFactors(
  rating: number, goals: number, assists: number,
  minutes: number, events: MatchEvent[], playerId: string
) {
  const playerEvents = events.filter(e => e.playerId === playerId);
  const goalsScored = playerEvents.filter(e => e.type === 'goal').length || goals;
  const assistsMade = playerEvents.filter(e => e.type === 'assist').length || assists;
  const yellowCards = playerEvents.filter(e => e.type === 'yellow_card' || e.type === 'second_yellow').length;

  const factors: { label: string; icon: string; impact: number }[] = [];

  // Goals contribution
  if (goalsScored > 0) {
    factors.push({ label: 'Goals Scored', icon: '⚽', impact: goalsScored * 0.8 });
  }
  // Assists contribution
  if (assistsMade > 0) {
    factors.push({ label: 'Assists', icon: '🅰️', impact: assistsMade * 0.6 });
  }
  // Yellow cards penalty
  if (yellowCards > 0) {
    factors.push({ label: 'Discipline', icon: '🟨', impact: -yellowCards * 0.4 });
  }
  // Minutes contribution
  if (minutes >= 90) {
    factors.push({ label: 'Full Match', icon: '🕐', impact: 0.3 });
  } else if (minutes >= 45) {
    factors.push({ label: 'Second Half', icon: '🕐', impact: 0.1 });
  } else {
    factors.push({ label: 'Cameo', icon: '🕐', impact: -0.2 });
  }
  // Base rating factor
  factors.push({ label: 'Overall Play', icon: '📊', impact: 0 });
  // Form factor
  const formBonus = rating >= 7.0 ? 0.5 : rating >= 6.0 ? 0 : -0.5;
  factors.push({ label: 'Match Impact', icon: '💥', impact: formBonus });

  return factors;
}

// ─── Key Moment type ──────────────────────────────────────────
interface KeyMoment {
  id: string;
  title: string;
  description: string;
  icon: string;
  matchIndex: number;
  color: string;
}

function generateKeyMoments(results: MatchResult[], playerId: string, seasonStats: { manOfTheMatch: number; goals: number; assists: number }): KeyMoment[] {
  if (results.length === 0) return [];
  const moments: KeyMoment[] = [];

  for (let i = 0; i < results.length; i++) {
    const m = results[i];

    // First goal of season
    if (m.playerGoals > 0) {
      const earlierGoals = results.slice(i + 1).some(r => r.playerGoals > 0);
      if (!earlierGoals) {
        moments.push({
          id: `first-goal-${i}`,
          title: 'First Goal of Season',
          description: `Scored in ${m.competition} match vs ${m.homeClub.id === m.awayClub.id ? 'Opponent' : ''}`,
          icon: '⚽',
          matchIndex: i,
          color: 'bg-emerald-500/15 border-emerald-500/30',
        });
      }
    }

    // Hat-trick
    if (m.playerGoals >= 3) {
      moments.push({
        id: `hat-trick-${i}`,
        title: 'Hat-Trick Hero',
        description: `${m.playerGoals} goals vs ${m.awayClub.shortName || m.awayClub.name.slice(0, 3)}`,
        icon: '🎩',
        matchIndex: i,
        color: 'bg-amber-500/15 border-amber-500/30',
      });
    }

    // Man of the Match
    if (m.playerRating >= 8.0) {
      moments.push({
        id: `motm-${i}`,
        title: 'Man of the Match',
        description: `Rating ${m.playerRating.toFixed(1)} — ${m.playerGoals}G ${m.playerAssists}A`,
        icon: '👑',
        matchIndex: i,
        color: 'bg-amber-500/15 border-amber-500/30',
      });
    }

    // Best rating
    if (i === 0 && results.length > 0) {
      const allRatings = results.map(r => r.playerRating);
      const bestRating = Math.max(...allRatings);
      if (m.playerRating === bestRating && bestRating >= 7.5) {
        moments.push({
          id: `best-rating-${i}`,
          title: 'Season Best Rating',
          description: `${bestRating.toFixed(1)} rating in recent matches`,
          icon: '⭐',
          matchIndex: i,
          color: 'bg-sky-500/15 border-sky-500/30',
        });
      }
    }
  }

  // Career milestones from season stats
  if (seasonStats.goals === 1) {
    moments.push({
      id: 'milestone-first-goal',
      title: 'Career First Goal',
      description: 'Opened your goalscoring account this season',
      icon: '🌟',
      matchIndex: 0,
      color: 'bg-emerald-500/15 border-emerald-500/30',
    });
  }

  if (seasonStats.manOfTheMatch >= 1) {
    moments.push({
      id: 'milestone-motm',
      title: 'First MOTM Award',
      description: `Earned ${seasonStats.manOfTheMatch} Man of the Match award${seasonStats.manOfTheMatch > 1 ? 's' : ''}`,
      icon: '🏆',
      matchIndex: 0,
      color: 'bg-amber-500/15 border-amber-500/30',
    });
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return moments.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

// ─── Stat bar component ───────────────────────────────────────
function StatBar({ label, value, max, icon }: { label: string; value: number; max: number; icon: React.ReactNode }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#8b949e] flex items-center gap-1">{icon} {label}</span>
        <span className="text-[#c9d1d9] font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Comparison bar ───────────────────────────────────────────
function ComparisonBar({
  homeLabel, awayLabel, homeValue, awayValue,
}: {
  homeLabel: string; awayLabel: string; homeValue: number; awayValue: number;
}) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? Math.round((homeValue / total) * 100) : 50;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#c9d1d9] font-semibold w-10 text-right">{homeValue}</span>
        <span className="text-[#8b949e] text-center flex-1">{homeLabel}</span>
        <span className="text-[#c9d1d9] font-semibold w-10 text-left">{awayValue}</span>
      </div>
      <div className="flex h-1.5 gap-0.5">
        <div className="bg-emerald-500/80 rounded-sm overflow-hidden" style={{ width: `${homePct}%` }} />
        <div className="bg-[#8b949e]/40 rounded-sm overflow-hidden flex-1" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

// ─── Form dot ─────────────────────────────────────────────────
function FormDot({ result, clubId }: { result: MatchResult; clubId: string }) {
  const won = (result.homeClub.id === clubId && result.homeScore > result.awayScore) ||
              (result.awayClub.id === clubId && result.awayScore > result.homeScore);
  const drew = result.homeScore === result.awayScore;
  if (won) return <div className="w-3 h-3 bg-emerald-500 rounded-sm" title="W" />;
  if (drew) return <div className="w-3 h-3 bg-amber-500 rounded-sm" title="D" />;
  return <div className="w-3 h-3 bg-red-500 rounded-sm" title="L" />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MatchHighlightsEnhanced() {
  const gameState = useGameStore(state => state.gameState);

  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'season' | 'moments'>('matches');

  const recentResults = gameState?.recentResults ?? [];
  const player = gameState?.player;
  const currentClub = gameState?.currentClub;

  // Season stats
  const seasonStats = player?.seasonStats ?? {
    appearances: 0, starts: 0, minutesPlayed: 0, goals: 0,
    assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0,
    averageRating: 0, manOfTheMatch: 0, injuries: 0,
  };

  // Season data from history
  const seasons = gameState?.seasons ?? [];

  // Best/worst performance this season (from recentResults)
  const bestPerformance = useMemo(() => {
    if (recentResults.length === 0) return null;
    return recentResults.reduce((best, r) => r.playerRating > (best?.playerRating ?? 0) ? r : best, recentResults[0]);
  }, [recentResults]);

  const worstPerformance = useMemo(() => {
    if (recentResults.length === 0) return null;
    return recentResults.reduce((worst, r) => r.playerRating < (worst?.playerRating ?? 10) ? r : worst, recentResults[0]);
  }, [recentResults]);

  // Key moments
  const keyMoments = useMemo(() => {
    if (!player) return [];
    return generateKeyMoments(recentResults, player.id, seasonStats);
  }, [recentResults, player, seasonStats]);

  // Selected match data
  const selectedMatch = selectedMatchIndex !== null ? recentResults[selectedMatchIndex] : null;

  // Player performance for selected match
  const playerPerf = useMemo(() => {
    if (!selectedMatch) return null;
    return computePlayerPerformance(
      selectedMatch.playerRating,
      selectedMatch.playerMinutesPlayed,
      selectedMatch.playerGoals,
      selectedMatch.playerAssists,
    );
  }, [selectedMatch]);

  // Rating factors for selected match
  const ratingFactors = useMemo(() => {
    if (!selectedMatch || !player) return [];
    return computeRatingFactors(
      selectedMatch.playerRating,
      selectedMatch.playerGoals,
      selectedMatch.playerAssists,
      selectedMatch.playerMinutesPlayed,
      selectedMatch.events,
      player.id,
    );
  }, [selectedMatch, player]);

  // Match stats for selected match
  const matchStatsData = useMemo(() => {
    if (!selectedMatch) return null;
    return simulateMatchStats(
      selectedMatch.homeClub.squadQuality,
      selectedMatch.awayClub.squadQuality,
      selectedMatch.homeScore,
      selectedMatch.awayScore,
      selectedMatch.week * 1000 + selectedMatch.season,
    );
  }, [selectedMatch]);

  if (!gameState || !player || !currentClub) return null;

  // ─── Empty state ───────────────────────────────────────────
  if (recentResults.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Match Highlights</h1>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <Activity className="w-10 h-10 text-[#484f58] mx-auto mb-3" />
          <p className="text-sm text-[#8b949e]">No matches played yet</p>
          <p className="text-xs text-[#484f58] mt-1">Play your first match to see highlights here</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MATCH DETAIL VIEW
  // ═══════════════════════════════════════════════════════════
  if (selectedMatch) {
    const opponent = selectedMatch.homeClub.id === currentClub.id
      ? selectedMatch.awayClub
      : selectedMatch.homeClub;
    const isHome = selectedMatch.homeClub.id === currentClub.id;
    const won = isHome
      ? selectedMatch.homeScore > selectedMatch.awayScore
      : selectedMatch.awayScore > selectedMatch.homeScore;
    const drew = selectedMatch.homeScore === selectedMatch.awayScore;
    const significantEvents = selectedMatch.events
      .filter(e => ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'chance', 'save', 'penalty_won', 'penalty_missed'].includes(e.type))
      .sort((a, b) => a.minute - b.minute);

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Back button & header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMatchIndex(null)}
            className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#c9d1d9]">Match Detail</h2>
          </div>
          <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] h-5">
            Wk {selectedMatch.week}
          </Badge>
        </div>

        {/* Scoreboard */}
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <div className={`h-1.5 ${won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500'}`} />
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <span className="text-2xl">{selectedMatch.homeClub.logo}</span>
                <span className="text-[11px] text-[#c9d1d9] font-semibold leading-tight text-center">
                  {selectedMatch.homeClub.shortName || selectedMatch.homeClub.name.slice(0, 3)}
                </span>
                {selectedMatch.homeClub.id === currentClub.id && (
                  <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">YOU</Badge>
                )}
              </div>
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-3xl font-black text-white tracking-wider">
                  {selectedMatch.homeScore} <span className="text-[#484f58]">-</span> {selectedMatch.awayScore}
                </span>
                <Badge variant="outline" className="text-[9px] mt-1 border-[#30363d] text-[#8b949e] h-4">
                  {selectedMatch.competition === 'league' ? 'League' : selectedMatch.competition}
                </Badge>
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <span className="text-2xl">{selectedMatch.awayClub.logo}</span>
                <span className="text-[11px] text-[#c9d1d9] font-semibold leading-tight text-center">
                  {selectedMatch.awayClub.shortName || selectedMatch.awayClub.name.slice(0, 3)}
                </span>
                {selectedMatch.awayClub.id === currentClub.id && (
                  <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">YOU</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Rating Badge */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center border ${getRatingColor(selectedMatch.playerRating)}`}>
                <span className="text-xl font-black">{selectedMatch.playerRating.toFixed(1)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#c9d1d9]">{getMatchRatingLabel(selectedMatch.playerRating)}</p>
                <p className="text-[11px] text-[#8b949e] mt-0.5">
                  {selectedMatch.playerStarted ? 'Started' : 'Substitute'} • {selectedMatch.playerMinutesPlayed}&apos; played
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  {selectedMatch.playerGoals > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <Target className="w-3 h-3" /> {selectedMatch.playerGoals} {selectedMatch.playerGoals === 1 ? 'Goal' : 'Goals'}
                    </span>
                  )}
                  {selectedMatch.playerAssists > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-sky-400 font-semibold">
                      <Zap className="w-3 h-3" /> {selectedMatch.playerAssists} {selectedMatch.playerAssists === 1 ? 'Assist' : 'Assists'}
                    </span>
                  )}
                  {selectedMatch.playerGoals === 0 && selectedMatch.playerAssists === 0 && (
                    <span className="text-[11px] text-[#8b949e]">No goal contributions</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Events Timeline */}
        {significantEvents.length > 0 && (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Match Events
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="max-h-64 overflow-y-auto pr-1 space-y-0">
                {significantEvents.map((event, i) => {
                  const isPlayerEvent = event.playerId === player.id;
                  const homeName = selectedMatch.homeClub.shortName || selectedMatch.homeClub.name.slice(0, 3);
                  const awayName = selectedMatch.awayClub.shortName || selectedMatch.awayClub.name.slice(0, 3);
                  const teamLabel = event.team === 'home' ? homeName : event.team === 'away' ? awayName : '';
                  const teamBadge = event.team === 'home' ? 'HOME' : event.team === 'away' ? 'AWAY' : '';

                  return (
                    <motion.div
                      key={`${event.minute}-${event.type}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      className="flex gap-2.5 mb-1.5"
                    >
                      <div className="flex flex-col items-center w-9 shrink-0">
                        <span className="text-[10px] font-mono text-[#8b949e] font-bold">{event.minute}&apos;</span>
                        <div className={`w-2 h-2 rounded-sm mt-1 shrink-0 ${
                          event.type === 'goal' ? 'bg-emerald-400' :
                          event.type === 'yellow_card' ? 'bg-yellow-400' :
                          event.type === 'red_card' ? 'bg-red-500' :
                          'bg-slate-500'
                        }`} />
                      </div>
                      <div className={`flex-1 rounded-md border px-2.5 py-1.5 ${getEventBg(event.type)} ${isPlayerEvent ? 'ring-1 ring-amber-400/40' : ''}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm leading-none">{getEventIcon(event.type)}</span>
                          <span className={`text-[10px] font-bold ${getEventColor(event.type)}`}>{getEventLabel(event.type)}</span>
                          {teamBadge && (
                            <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 font-bold ${event.team === 'home' ? 'border-sky-500/40 text-sky-400' : 'border-rose-500/40 text-rose-400'}`}>
                              {teamBadge}
                            </Badge>
                          )}
                          {isPlayerEvent && (
                            <Badge className="text-[8px] px-1 py-0 h-3 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">YOU</Badge>
                          )}
                        </div>
                        {(event.playerName || event.detail) && (
                          <p className="text-[10px] text-[#c9d1d9] mt-0.5 leading-snug">
                            {event.playerName && <span className="font-medium">{event.playerName}</span>}
                            {event.playerName && event.detail && <span className="text-[#8b949e]"> — </span>}
                            {event.detail && <span className="text-[#8b949e]">{event.detail}</span>}
                          </p>
                        )}
                        {teamLabel && !event.playerName && (
                          <p className="text-[9px] text-[#8b949e] mt-0.5">{teamLabel}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Performance Breakdown */}
        {playerPerf && (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              <StatBar label="Pass Accuracy" value={playerPerf.passAccuracy} max={100} icon={<span className="text-[10px]">🎯</span>} />
              <StatBar label="Total Passes" value={playerPerf.totalPasses} max={100} icon={<span className="text-[10px]">🦶</span>} />
              <StatBar label="Key Passes" value={playerPerf.keyPasses} max={10} icon={<span className="text-[10px]">🔑</span>} />
              <StatBar label="Tackles" value={playerPerf.tackles} max={10} icon={<span className="text-[10px]">🛡️</span>} />
              <StatBar label="Shots" value={playerPerf.shots} max={10} icon={<span className="text-[10px]">⚡</span>} />
              <StatBar label="Shots on Target" value={playerPerf.shotsOnTarget} max={10} icon={<span className="text-[10px]">🎯</span>} />
              <StatBar label="Dribbles" value={playerPerf.dribbles} max={10} icon={<span className="text-[10px]">💨</span>} />
              <StatBar label="Interceptions" value={playerPerf.interceptions} max={10} icon={<span className="text-[10px]">✋</span>} />
            </CardContent>
          </Card>
        )}

        {/* Rating Factors */}
        {ratingFactors.length > 0 && (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Rating Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {ratingFactors.map((factor, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-[#21262d]/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{factor.icon}</span>
                      <span className="text-[11px] text-[#c9d1d9]">{factor.label}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${factor.impact > 0 ? 'text-emerald-400' : factor.impact < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact > 0 ? `+${(factor.impact * 100).toFixed(0)}%` : factor.impact < 0 ? `${(factor.impact * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Stats Comparison */}
        {matchStatsData && (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" /> Match Stats
                </CardTitle>
              </div>
              {/* Team labels */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-[#c9d1d9] font-semibold">
                  {selectedMatch.homeClub.shortName || selectedMatch.homeClub.name.slice(0, 3)}
                </span>
                <span className="text-[9px] text-[#c9d1d9] font-semibold">
                  {selectedMatch.awayClub.shortName || selectedMatch.awayClub.name.slice(0, 3)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <ComparisonBar
                homeLabel="Possession"
                awayLabel=""
                homeValue={matchStatsData.homePossession}
                awayValue={100 - matchStatsData.homePossession}
              />
              <ComparisonBar
                homeLabel="Shots"
                awayLabel=""
                homeValue={matchStatsData.homeShots}
                awayValue={matchStatsData.awayShots}
              />
              <ComparisonBar
                homeLabel="Shots on Target"
                awayLabel=""
                homeValue={matchStatsData.homeOnTarget}
                awayValue={matchStatsData.awayOnTarget}
              />
              <ComparisonBar
                homeLabel="Corners"
                awayLabel=""
                homeValue={matchStatsData.homeCorners}
                awayValue={matchStatsData.awayCorners}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN LIST VIEW
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-emerald-400" />
        <h1 className="text-lg font-bold text-[#c9d1d9]">Match Highlights</h1>
        <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-sm ml-auto">
          {recentResults.length} match{recentResults.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
        {([
          { key: 'matches', label: 'Matches' },
          { key: 'season', label: 'Season' },
          { key: 'moments', label: 'Key Moments' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── MATCHES TAB ────────────────────────────────────── */}
        {activeTab === 'matches' && (
          <motion.div
            key="matches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {recentResults.map((match, idx) => {
              const opponent = match.homeClub.id === currentClub.id ? match.awayClub : match.homeClub;
              const isHome = match.homeClub.id === currentClub.id;
              const won = isHome
                ? match.homeScore > match.awayScore
                : match.awayScore > match.homeScore;
              const drew = match.homeScore === match.awayScore;
              const playerScored = match.playerGoals > 0;
              const playerAssisted = match.playerAssists > 0;

              return (
                <motion.button
                  key={`${match.season}-${match.week}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03, duration: 0.12 }}
                  onClick={() => setSelectedMatchIndex(idx)}
                  className="w-full text-left bg-[#161b22] border border-[#30363d] rounded-lg p-3 hover:border-[#484f58] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Opponent badge */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-[#21262d] border border-[#30363d] shrink-0">
                      {opponent.logo}
                    </div>

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-[#c9d1d9] truncate">{opponent.shortName || opponent.name.slice(0, 3)}</span>
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 font-bold shrink-0 ${
                          match.competition === 'league' ? 'border-[#30363d] text-[#8b949e]' :
                          match.competition === 'cup' ? 'border-amber-500/30 text-amber-400' :
                          'border-emerald-500/30 text-emerald-400'
                        }`}>
                          {match.competition === 'league' ? 'L' : match.competition === 'cup' ? 'C' : 'E'}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 font-bold shrink-0 ${
                          isHome ? 'border-sky-500/30 text-sky-400' : 'border-rose-500/30 text-rose-400'
                        }`}>
                          {isHome ? 'H' : 'A'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {/* Score */}
                        <span className={`text-sm font-black ${won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400'}`}>
                          {match.homeScore}-{match.awayScore}
                        </span>

                        {/* Goal/Assist indicators */}
                        {playerScored && (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold">
                            <Target className="w-2.5 h-2.5" />{match.playerGoals}
                          </span>
                        )}
                        {playerAssisted && (
                          <span className="flex items-center gap-0.5 text-[9px] text-sky-400 font-bold">
                            <Zap className="w-2.5 h-2.5" />{match.playerAssists}
                          </span>
                        )}

                        <span className="text-[9px] text-[#484f58] ml-auto">
                          Wk {match.week} • {match.playerMinutesPlayed}&apos;
                        </span>
                      </div>
                    </div>

                    {/* Rating badge */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${getRatingColor(match.playerRating)}`}>
                      <span className="text-xs font-black">{match.playerRating.toFixed(1)}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ─── SEASON TAB ─────────────────────────────────────── */}
        {activeTab === 'season' && (
          <motion.div
            key="season"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Season stats grid */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" /> Season Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: seasonStats.appearances, label: 'Apps', icon: <Footprints className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                    { value: seasonStats.goals, label: 'Goals', icon: <Target className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                    { value: seasonStats.assists, label: 'Assists', icon: <Zap className="w-3 h-3 text-sky-400" />, color: 'text-sky-400' },
                    { value: seasonStats.averageRating > 0 ? seasonStats.averageRating.toFixed(1) : '—', label: 'Avg Rating', icon: <Star className="w-3 h-3 text-amber-400" />, color: seasonStats.averageRating >= 7 ? 'text-emerald-400' : seasonStats.averageRating >= 6 ? 'text-amber-400' : 'text-[#8b949e]' },
                    { value: seasonStats.cleanSheets, label: 'Clean Sheets', icon: <Shield className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                    { value: seasonStats.manOfTheMatch, label: 'MOTM', icon: <Crown className="w-3 h-3 text-amber-400" />, color: 'text-amber-400' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#21262d] rounded-lg py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        {stat.icon}
                        <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
                      </div>
                      <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Additional row */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-[#21262d] rounded-lg py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-[#8b949e]" />
                      <span className="text-base font-bold text-[#c9d1d9]">{seasonStats.minutesPlayed}</span>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">Minutes</p>
                  </div>
                  <div className="bg-[#21262d] rounded-lg py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-[10px]">🟨</span>
                      <span className="text-base font-bold text-yellow-400">{seasonStats.yellowCards}</span>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">Yellows</p>
                  </div>
                  <div className="bg-[#21262d] rounded-lg py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-[10px]">🟥</span>
                      <span className="text-base font-bold text-red-400">{seasonStats.redCards}</span>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">Reds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form indicator */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Flame className="w-3 h-3" /> Recent Form
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {recentResults.slice(0, 5).map((r, i) => (
                      <FormDot key={i} result={r} clubId={currentClub.id} />
                    ))}
                    {recentResults.length < 5 && Array.from({ length: 5 - recentResults.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-3 h-3 bg-[#21262d] rounded-sm border border-[#30363d]" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8b949e]">Last {Math.min(5, recentResults.length)} matches</span>
                </div>
              </CardContent>
            </Card>

            {/* Best / Worst performance */}
            <div className="grid grid-cols-2 gap-2">
              {bestPerformance && (
                <Card className="bg-[#161b22] border-emerald-500/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">Best</span>
                    </div>
                    <span className={`text-2xl font-black ${getRatingTextColor(bestPerformance.playerRating)}`}>
                      {bestPerformance.playerRating.toFixed(1)}
                    </span>
                    <p className="text-[9px] text-[#8b949e] mt-1 truncate">
                      vs {bestPerformance.homeClub.id === currentClub.id ? bestPerformance.awayClub.shortName : bestPerformance.homeClub.shortName}
                    </p>
                    <p className="text-[9px] text-[#484f58]">
                      {bestPerformance.playerGoals}G {bestPerformance.playerAssists}A
                    </p>
                  </CardContent>
                </Card>
              )}
              {worstPerformance && (
                <Card className="bg-[#161b22] border-red-500/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] font-bold text-red-400">Worst</span>
                    </div>
                    <span className={`text-2xl font-black ${getRatingTextColor(worstPerformance.playerRating)}`}>
                      {worstPerformance.playerRating.toFixed(1)}
                    </span>
                    <p className="text-[9px] text-[#8b949e] mt-1 truncate">
                      vs {worstPerformance.homeClub.id === currentClub.id ? worstPerformance.awayClub.shortName : worstPerformance.homeClub.shortName}
                    </p>
                    <p className="text-[9px] text-[#484f58]">
                      {worstPerformance.playerGoals}G {worstPerformance.playerAssists}A
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Season history */}
            {seasons.length > 0 && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Trophy className="w-3 h-3" /> Season History
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {[...seasons].reverse().map(s => (
                      <div key={s.number} className="flex items-center justify-between py-1.5 px-2 bg-[#21262d] rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#c9d1d9] font-semibold">S{s.number}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[#8b949e]">
                          <span>{s.playerStats.appearances} apps</span>
                          <span className="text-emerald-400">{s.playerStats.goals}G</span>
                          <span className="text-sky-400">{s.playerStats.assists}A</span>
                          <span className="text-amber-400">{s.playerStats.averageRating > 0 ? s.playerStats.averageRating.toFixed(1) : '—'}</span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-[#30363d] text-[#8b949e]">
                            #{s.leaguePosition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ─── KEY MOMENTS TAB ────────────────────────────────── */}
        {activeTab === 'moments' && (
          <motion.div
            key="moments"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {keyMoments.length === 0 ? (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-8 h-8 text-[#484f58] mx-auto mb-2" />
                  <p className="text-sm text-[#8b949e]">No key moments yet</p>
                  <p className="text-xs text-[#484f58] mt-1">Score goals and earn awards to unlock highlights</p>
                </CardContent>
              </Card>
            ) : (
              keyMoments.map((moment, idx) => (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04, duration: 0.15 }}
                  className={`rounded-lg border p-3 ${moment.color}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{moment.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#c9d1d9]">{moment.title}</h3>
                      <p className="text-[11px] text-[#8b949e] mt-0.5">{moment.description}</p>
                    </div>
                    {moment.matchIndex < recentResults.length && (
                      <button
                        onClick={() => setSelectedMatchIndex(moment.matchIndex)}
                        className="text-[10px] text-emerald-400 font-semibold hover:text-emerald-300 shrink-0"
                      >
                        View →
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
