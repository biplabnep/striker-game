'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getMatchRatingLabel } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  MapPin,
  Calendar,
  Trophy,
  Target,
  Zap,
  Shield,
  Heart,
  Clock,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  MessageSquare,
  Star,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { MatchEvent, MatchEventType } from '@/lib/game/types';

// -----------------------------------------------------------
// Rating color helpers
// -----------------------------------------------------------
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return '#22c55e';
  if (rating >= 7.0) return '#10b981';
  if (rating >= 6.0) return '#f59e0b';
  if (rating >= 5.0) return '#f97316';
  return '#ef4444';
}

function getRatingBg(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500/15 border-emerald-500/30';
  if (rating >= 7.0) return 'bg-emerald-600/10 border-emerald-600/25';
  if (rating >= 6.0) return 'bg-amber-500/10 border-amber-500/25';
  if (rating >= 5.0) return 'bg-orange-500/10 border-orange-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function getRatingTextClass(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-emerald-500';
  if (rating >= 6.0) return 'text-amber-400';
  if (rating >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

// -----------------------------------------------------------
// Event icon & color mapping (reuse from MatchDay patterns)
// -----------------------------------------------------------
function getEventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal': return '\u26BD';
    case 'own_goal': return '\u26BD';
    case 'assist': return '\uD83C\uDDE1\uFE0F';
    case 'yellow_card': return '\uD83D\uDFE8';
    case 'red_card': return '\uD83D\uDFE5';
    case 'second_yellow': return '\uD83D\uDFE8\uD83D\uDFE5';
    case 'substitution': return '\uD83D\uDD04';
    case 'injury': return '\uD83C\uDFE5';
    default: return '\uD83D\uDCCC';
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
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
}

function getEventLabel(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'Goal';
    case 'own_goal': return 'Own Goal';
    case 'assist': return 'Assist';
    case 'yellow_card': return 'Yellow Card';
    case 'red_card': return 'Red Card';
    case 'second_yellow': return '2nd Yellow';
    case 'substitution': return 'Substitution';
    case 'injury': return 'Injury';
    default: return type;
  }
}

// -----------------------------------------------------------
// Performance breakdown calculator
// -----------------------------------------------------------
interface PerformanceBreakdown {
  attacking: number;   // 0-100
  creative: number;    // 0-100
  defensive: number;   // 0-100
  stamina: number;     // 0-100
}

function calculatePerformanceBreakdown(
  goals: number,
  assists: number,
  minutesPlayed: number,
  events: MatchEvent[],
  playerRating: number
): PerformanceBreakdown {
  // Attacking: based on goals and chance events
  const chanceEvents = events.filter(
    e => e.type === 'chance' || e.type === 'penalty_won'
  );
  const attacking = Math.min(100, goals * 25 + chanceEvents.length * 10 + Math.max(0, playerRating - 5) * 3);

  // Creative: based on assists, key passes, corners
  const creativeEvents = events.filter(
    e => e.type === 'assist' || e.type === 'corner' || e.type === 'free_kick'
  );
  const creative = Math.min(100, assists * 30 + creativeEvents.length * 8 + Math.max(0, playerRating - 5) * 3);

  // Defensive: based on tackles/interceptions (simulated from rating)
  const defensiveEvents = events.filter(
    e => e.type === 'save' || e.type === 'injury'
  );
  const defensive = Math.min(100, defensiveEvents.length * 5 + Math.max(0, playerRating - 4) * 5 + 15);

  // Stamina: based on minutes played percentage
  const staminaPct = Math.min(100, (minutesPlayed / 90) * 100);

  return {
    attacking: Math.max(5, attacking),
    creative: Math.max(5, creative),
    defensive: Math.max(5, defensive),
    stamina: Math.max(5, staminaPct),
  };
}

// -----------------------------------------------------------
// Coach feedback generator
// -----------------------------------------------------------
interface CoachFeedback {
  level: 'excellent' | 'good' | 'average' | 'poor';
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function generateCoachFeedback(
  rating: number,
  goals: number,
  assists: number,
  minutes: number
): CoachFeedback {
  if (rating >= 8.0) {
    const exceptional = rating >= 8.5;
    const goalMention = goals > 0
      ? goals >= 2 ? `Scoring ${goals} goal${goals > 1 ? 's' : ''} was outstanding. ` : `Getting on the scoresheet was key. `
      : '';
    const assistMention = assists > 0
      ? `Your ${assists} assist${assists > 1 ? 's were' : ' was'} crucial. ` : '';
    return {
      level: 'excellent',
      title: exceptional ? 'Phenomenal Display' : 'Outstanding Performance',
      message: `The manager is thrilled with your contribution. ${goalMention}${assistMention}Your rating of ${rating.toFixed(1)} reflects a near-perfect performance. Keep this up and bigger things will come.`,
      icon: <Star className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    };
  }

  if (rating >= 7.0) {
    const goalMention = goals > 0 ? `Your goal${goals > 1 ? 's' : ''} made the difference. ` : '';
    const assistMention = assists > 0 ? `Great vision on the assist. ` : '';
    return {
      level: 'good',
      title: 'Strong Showing',
      message: `A solid performance from you today. ${goalMention}${assistMention}The coaching staff noted your work rate and positioning. You're showing real consistency.`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-600/10 border-emerald-600/25',
    };
  }

  if (rating >= 6.0) {
    const concerns: string[] = [];
    if (minutes < 60) concerns.push('you were subbed early');
    if (goals === 0 && assists === 0) concerns.push('no direct goal contributions');
    if (rating < 6.5) concerns.push('a below-average rating');

    const concernText = concerns.length > 0
      ? `The staff noted ${concerns.join(' and ')}. `
      : '';
    return {
      level: 'average',
      title: 'Room for Improvement',
      message: `An okay performance, but we know you can do better. ${concernText}Focus on your positioning and decision-making in training this week. You have the quality.`,
      icon: <Minus className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/25',
    };
  }

  const harshNotes: string[] = [];
  if (minutes === 0) harshNotes.push('You didn\'t see any game time');
  else if (minutes < 30) harshNotes.push('Very limited minutes on the pitch');
  if (rating < 5.0) harshNotes.push('This was a difficult match for you');

  return {
    level: 'poor',
    title: 'Tough Day',
    message: `Not your best performance. ${harshNotes.join('. ')}. Every player has these days — what matters is how you respond. Hit the training ground with purpose this week.`,
    icon: <TrendingDown className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/25',
  };
}

// -----------------------------------------------------------
// Stat bar component
// -----------------------------------------------------------
function StatBar({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className="text-xs text-[#c9d1d9] font-medium">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums text-[#c9d1d9]">{value}%</span>
      </div>
      <div className="h-2.5 bg-[#21262d] rounded-lg overflow-hidden">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color === 'text-emerald-400' ? '#10b981' : color === 'text-sky-400' ? '#38bdf8' : color === 'text-amber-400' ? '#f59e0b' : '#f87171' }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.1, duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Mini bar chart for rating history
// -----------------------------------------------------------
function MiniRatingBar({ rating, index }: { rating: number; index: number }) {
  const height = ((rating - 3) / (11 - 3)) * 100;
  const color = getRatingColor(rating);
  const delay = 0.4 + index * 0.06;

  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <span className="text-[8px] tabular-nums text-[#8b949e]">
        {rating.toFixed(1)}
      </span>
      <motion.div
        className="w-full rounded-t-sm"
        style={{ backgroundColor: color }}
        initial={{ height: 0 }}
        animate={{ height: `${Math.max(height, 8)}%` }}
        transition={{ delay: delay + 0.05, duration: 0.3, ease: 'easeOut' }}
      />
      <span className="text-[8px] text-[#484f58]">
        {index === 0 ? 'Now' : `-${index}`}
      </span>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function PostMatchAnalysis() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const match = gameState?.recentResults?.[0] ?? null;

  // Derived data (computed before early return)
  const performance = useMemo(() => {
    if (!match) return null;
    return calculatePerformanceBreakdown(
      match.playerGoals,
      match.playerAssists,
      match.playerMinutesPlayed,
      match.events,
      match.playerRating
    );
  }, [match]);

  const coachFeedback = useMemo(() => {
    if (!match) return null;
    return generateCoachFeedback(
      match.playerRating,
      match.playerGoals,
      match.playerAssists,
      match.playerMinutesPlayed
    );
  }, [match]);

  const last5Ratings = useMemo(() => {
    if (!gameState) return [];
    return gameState.recentResults.slice(0, 5).map(r => r.playerRating).filter(r => r > 0);
  }, [gameState]);

  const significantEvents = useMemo(() => {
    if (!match) return [];
    return match.events
      .filter(e => ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'chance', 'save', 'penalty_won', 'penalty_missed', 'corner', 'free_kick'].includes(e.type))
      .sort((a, b) => a.minute - b.minute);
  }, [match]);

  const ratingTrend = useMemo(() => {
    if (last5Ratings.length < 3) return null;
    const recent = last5Ratings.slice(0, 2);
    const older = last5Ratings.slice(2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg - olderAvg > 0.3) return 'up' as const;
    if (olderAvg - recentAvg > 0.3) return 'down' as const;
    return 'stable' as const;
  }, [last5Ratings]);

  // ---- Empty State ----
  if (!gameState) return null;

  if (!match) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-[#484f58] mx-auto mb-4" />
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-2">No Match Analysis</h2>
              <p className="text-sm text-[#8b949e] mb-6">
                Play a match to see your post-match analysis with detailed performance breakdowns and coaching feedback.
              </p>
              <Button
                onClick={() => setScreen('match_day')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Play a Match
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ---- Match Data ----
  const isPlayerHome = match.homeClub.id === gameState.currentClub.id;
  const playerClub = isPlayerHome ? match.homeClub : match.awayClub;
  const opponentClub = isPlayerHome ? match.awayClub : match.homeClub;
  const playerScore = isPlayerHome ? match.homeScore : match.awayScore;
  const opponentScore = isPlayerHome ? match.awayScore : match.homeScore;

  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;
  const resultLabel = won ? 'VICTORY' : drew ? 'DRAW' : 'DEFEAT';
  const resultColor = won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400';
  const resultBg = won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500';
  const resultEmoji = won ? '\uD83C\uDFC6' : drew ? '\uD83E\uDD1D' : '\uD83D\uDCAA';

  const competitionLabel = match.competition === 'league'
    ? 'League Match'
    : match.competition.charAt(0).toUpperCase() + match.competition.slice(1).replace('_', ' ');

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          Post-Match Analysis
        </h2>
        <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
          Week {match.week} &middot; S{match.season}
        </Badge>
      </motion.div>

      {/* ============================================= */}
      {/* 1. Match Overview Card */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <div className={`h-1.5 ${resultBg}`} />
          <CardContent className="p-5">
            {/* Result label */}
            <div className="text-center mb-4">
              <p className={`text-sm font-bold tracking-wider ${resultColor}`}>
                {resultEmoji} {resultLabel}
              </p>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-5 mb-4">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {playerClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {playerClub.shortName || playerClub.name.slice(0, 3)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    isPlayerHome
                      ? 'border-sky-500/30 text-sky-400'
                      : 'border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isPlayerHome ? 'HOME' : 'AWAY'}
                </Badge>
              </div>

              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className="text-4xl font-black text-white tracking-wider">
                  {playerScore} <span className="text-[#484f58]">-</span> {opponentScore}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {opponentClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {opponentClub.shortName || opponentClub.name.slice(0, 3)}
                </span>
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                  OPPONENT
                </Badge>
              </div>
            </div>

            {/* Competition & Date info */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#8b949e]">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>{competitionLabel}</span>
              </div>
              <span className="text-[#30363d]">&bull;</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Season {match.season}, Week {match.week}</span>
              </div>
              <span className="text-[#30363d]">&bull;</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{isPlayerHome ? 'Home' : 'Away'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 2. Player Performance */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-5">
              {/* Rating circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center ${getRatingBg(match.playerRating)}`}
                >
                  <span
                    className="text-3xl font-black tabular-nums leading-none"
                    style={{ color: getRatingColor(match.playerRating) }}
                  >
                    {match.playerRating.toFixed(1)}
                  </span>
                  <span className={`text-[8px] font-semibold mt-0.5 ${getRatingTextClass(match.playerRating)}`}>
                    {getMatchRatingLabel(match.playerRating)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Goals</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerGoals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                    {match.playerGoals}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Assists</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerAssists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>
                    {match.playerAssists}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
                    <span className="text-xs text-[#8b949e]">Minutes</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerMinutesPlayed >= 90 ? 'text-emerald-400' : match.playerMinutesPlayed > 0 ? 'text-amber-400' : 'text-[#484f58]'}`}>
                    {match.playerMinutesPlayed}&apos;
                  </span>
                </div>
              </div>
            </div>

            {/* Sub status */}
            {!match.playerStarted && match.playerMinutesPlayed > 0 && (
              <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                <p className="text-[10px] text-cyan-400 font-medium">
                  Subbed on in the {match.playerMinutesPlayed <= 45 ? '1st' : '2nd'} half
                </p>
              </div>
            )}
            {match.playerMinutesPlayed === 0 && (
              <div className="mt-3 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2">
                <p className="text-[10px] text-[#8b949e] font-medium">
                  Unused substitute
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 3. Performance Breakdown */}
      {/* ============================================= */}
      {performance && match.playerMinutesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-emerald-400" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <StatBar
                label="Attacking"
                value={performance.attacking}
                icon={<Target className="w-3.5 h-3.5 text-emerald-400" />}
                color="text-emerald-400"
                delay={0.2}
              />
              <StatBar
                label="Creative"
                value={performance.creative}
                icon={<Zap className="w-3.5 h-3.5 text-sky-400" />}
                color="text-sky-400"
                delay={0.25}
              />
              <StatBar
                label="Defensive"
                value={performance.defensive}
                icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}
                color="text-amber-400"
                delay={0.3}
              />
              <StatBar
                label="Stamina"
                value={performance.stamina}
                icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                color="text-rose-400"
                delay={0.35}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 4. Match Events Timeline */}
      {/* ============================================= */}
      {significantEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Match Events Timeline
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                  {significantEvents.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {significantEvents.map((event, i) => {
                  const isPlayerEvent = event.playerId === gameState.player.id;
                  const isGoalEvent = event.type === 'goal' || event.type === 'own_goal';
                  const icon = getEventIcon(event.type);
                  const colorClass = getEventColor(event.type);
                  const bgClass = getEventBg(event.type);
                  const label = getEventLabel(event.type);
                  const isLast = i === significantEvents.length - 1;
                  const teamLabel = event.team === 'home' ? match.homeClub.shortName : event.team === 'away' ? match.awayClub.shortName : '';

                  return (
                    <motion.div
                      key={`${event.minute}-${event.type}-${i}`}
                      className="flex gap-3 relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.15 }}
                    >
                      <div className="flex flex-col items-center w-10 shrink-0">
                        <span className="text-[10px] font-mono text-[#8b949e] font-bold">
                          {event.minute}&apos;
                        </span>
                        <div className="flex-1 flex flex-col items-center mt-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-sm shrink-0 z-10 ${
                              isGoalEvent ? 'bg-emerald-400' : isPlayerEvent ? 'bg-amber-400' : 'bg-[#484f58]'
                            }`}
                          />
                          {!isLast && <div className="w-px flex-1 bg-[#30363d] mt-0.5" />}
                        </div>
                      </div>
                      <div
                        className={`flex-1 mb-2 ml-1 rounded-lg border px-3 py-2 ${bgClass} ${
                          isPlayerEvent ? 'ring-1 ring-amber-400/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">{icon}</span>
                          <span className={`text-[11px] font-semibold ${colorClass}`}>{label}</span>
                          {isPlayerEvent && (
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">
                              YOU
                            </Badge>
                          )}
                          {isGoalEvent && (
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold">
                              {match.homeScore} - {match.awayScore}
                            </Badge>
                          )}
                        </div>
                        {(event.playerName || event.detail) && (
                          <p className="text-[10px] text-[#c9d1d9] mt-0.5 leading-snug">
                            {event.playerName && (
                              <span className="text-[#c9d1d9] font-medium">{event.playerName}</span>
                            )}
                            {event.playerName && event.detail && (
                              <span className="text-[#8b949e]"> &mdash; </span>
                            )}
                            {event.detail && (
                              <span className="text-[#8b949e]">{event.detail}</span>
                            )}
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
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 5. Rating History */}
      {/* ============================================= */}
      {last5Ratings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-emerald-400" />
                  Rating History
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {ratingTrend === 'up' && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                      Improving
                    </Badge>
                  )}
                  {ratingTrend === 'down' && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px]">
                      <TrendingDown className="w-2.5 h-2.5 mr-1" />
                      Declining
                    </Badge>
                  )}
                  {ratingTrend === 'stable' && (
                    <Badge className="bg-slate-500/15 text-[#8b949e] border-slate-500/25 text-[10px]">
                      <Minus className="w-2.5 h-2.5 mr-1" />
                      Stable
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Mini bar chart */}
              <div className="flex items-end gap-1.5 h-24 mb-2">
                {last5Ratings.map((rating, i) => (
                  <MiniRatingBar key={i} rating={rating} index={i} />
                ))}
              </div>

              {/* Best/Worst summary */}
              {last5Ratings.length >= 2 && (
                <div className="flex gap-3 justify-center pt-2 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">Best:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(Math.max(...last5Ratings)) }}
                    >
                      {Math.max(...last5Ratings).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] text-[#8b949e]">Worst:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(Math.min(...last5Ratings)) }}
                    >
                      {Math.min(...last5Ratings).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-[#8b949e]" />
                    <span className="text-[10px] text-[#8b949e]">Avg:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(last5Ratings.reduce((a, b) => a + b, 0) / last5Ratings.length) }}
                    >
                      {(last5Ratings.reduce((a, b) => a + b, 0) / last5Ratings.length).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 6. Coach Feedback */}
      {/* ============================================= */}
      {coachFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        >
          <Card className={`border ${coachFeedback.bgColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${coachFeedback.color} bg-[#21262d]`}>
                  {coachFeedback.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className={`w-3.5 h-3.5 ${coachFeedback.color}`} />
                    <span className={`text-xs font-bold ${coachFeedback.color}`}>
                      Coach&apos;s Feedback
                    </span>
                    <Badge
                      className={`text-[8px] px-1.5 py-0 h-4 border-0 font-bold ${
                        coachFeedback.level === 'excellent'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : coachFeedback.level === 'good'
                          ? 'bg-emerald-600/15 text-emerald-500'
                          : coachFeedback.level === 'average'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {coachFeedback.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className={`text-sm font-bold ${coachFeedback.color} mb-1`}>
                    {coachFeedback.title}
                  </p>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    {coachFeedback.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 7. Action Buttons */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.2 }}
        className="space-y-2"
      >
        <Button
          onClick={() => setScreen('dashboard')}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue to Dashboard
        </Button>
        <Button
          onClick={() => setScreen('analytics')}
          variant="outline"
          className="w-full h-10 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          View Full Analytics
        </Button>
      </motion.div>
    </div>
  );
}
