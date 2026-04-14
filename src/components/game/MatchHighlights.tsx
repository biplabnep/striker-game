'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { MatchResult, MatchEvent, MatchEventType } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Film,
  CircleDot,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  AlertTriangle,
  Star,
  BarChart3,
  Activity,
} from 'lucide-react';

// ── Animation Constants ─────────────────────────────────────
const ANIM = { duration: 0.18, ease: 'easeOut' as const };
const SECTION_DELAY = 0.05;
const ITEM_DELAY = 0.03;

// ── Rating Color Helpers ────────────────────────────────────
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return '#22c55e';
  if (rating >= 7.0) return '#10b981';
  if (rating >= 6.0) return '#f59e0b';
  if (rating >= 5.0) return '#f97316';
  return '#ef4444';
}

function getRatingTextClass(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-emerald-500';
  if (rating >= 6.0) return 'text-amber-400';
  if (rating >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

function getRatingBg(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500/15 border-emerald-500/30';
  if (rating >= 7.0) return 'bg-emerald-600/10 border-emerald-600/25';
  if (rating >= 6.0) return 'bg-amber-500/10 border-amber-500/25';
  if (rating >= 5.0) return 'bg-orange-500/10 border-orange-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function getQualityBadge(avg: number): { label: string; cls: string } {
  if (avg >= 8.0) return { label: 'Elite', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (avg >= 7.5) return { label: 'Great', cls: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/25' };
  if (avg >= 6.0) return { label: 'Average', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
  return { label: 'Poor', cls: 'bg-red-500/10 text-red-400 border-red-500/25' };
}

// ── Result Helpers ──────────────────────────────────────────
function getResultInfo(match: MatchResult, playerClubId: string) {
  const isHome = match.homeClub.id === playerClubId;
  const playerScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;
  const opponent = isHome ? match.awayClub : match.homeClub;
  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;
  return { isHome, playerScore, opponentScore, opponent, won, drew, lost: !won && !drew };
}

function getResultBadge(result: { won: boolean; drew: boolean; lost: boolean }) {
  if (result.won) return { letter: 'W', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (result.drew) return { letter: 'D', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  return { letter: 'L', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
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
    case 'save': return 'text-amber-400';
    case 'chance': return 'text-emerald-300';
    case 'penalty_won': return 'text-sky-300';
    case 'penalty_missed': return 'text-red-300';
    case 'corner': return 'text-slate-300';
    case 'free_kick': return 'text-slate-300';
    default: return 'text-[#8b949e]';
  }
}

function getEventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal': return '\u26BD';
    case 'own_goal': return '\u26BD';
    case 'assist': return '\uD83D\uDC63';
    case 'yellow_card': return '\uD83D\uDFE8';
    case 'red_card': return '\uD83D\uDFE5';
    case 'second_yellow': return '\uD83D\uDFE8\uD83D\uDFE5';
    case 'substitution': return '\uD83D\uDD04';
    case 'injury': return '\uD83C\uDFE5';
    case 'save': return '\uD83E\uDD11';
    case 'chance': return '\u2756';
    case 'penalty_won': return '\u26BD';
    case 'penalty_missed': return '\u274C';
    case 'corner': return '\uD83D\uDFA3';
    case 'free_kick': return '\u26BD';
    default: return '\uD83D\uDCCC';
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
    case 'save': return 'Save';
    case 'chance': return 'Chance';
    case 'penalty_won': return 'Penalty Won';
    case 'penalty_missed': return 'Penalty Missed';
    case 'corner': return 'Corner';
    case 'free_kick': return 'Free Kick';
    default: return type;
  }
}

function getCompetitionLabel(competition: string): string {
  if (competition === 'league') return 'League';
  if (competition === 'cup') return 'Cup';
  return competition.charAt(0).toUpperCase() + competition.slice(1).replace(/_/g, ' ');
}

// ── Section Wrapper ─────────────────────────────────────────
function Section({
  title,
  icon,
  badge,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-xs text-[#c9d1d9] font-semibold">{title}</span>
        {badge && (
          <Badge variant="outline" className="ml-auto text-[9px] border-[#30363d] text-[#8b949e]">
            {badge}
          </Badge>
        )}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ── SVG Sparkline ───────────────────────────────────────────
function RatingSparkline({ ratings }: { ratings: number[] }) {
  if (ratings.length < 2) return null;

  const width = 300;
  const height = 60;
  const padY = 6;
  const padX = 4;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // Use fixed 0-10 scale
  const yMin = 0;
  const yMax = 10;
  const yRange = yMax - yMin || 1;

  const points = ratings.map((v, i) => {
    const x = padX + (i / (ratings.length - 1)) * chartW;
    const y = padY + chartH - ((v - yMin) / yRange) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padY} L${points[0].x},${height - padY} Z`;

  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const lineColor = avg >= 7.5 ? '#22c55e' : avg >= 6.0 ? '#f59e0b' : '#ef4444';
  const fillOpacity = 0.08;

  // Grid lines at 5, 7.5
  const gridLine5 = padY + chartH - ((5 - yMin) / yRange) * chartH;
  const gridLine75 = padY + chartH - ((7.5 - yMin) / yRange) * chartH;

  return (
    <motion.div
      className="w-full overflow-x-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay: 0.25 }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ minWidth: width }}>
        {/* Grid lines */}
        <line x1={padX} y1={gridLine5} x2={width - padX} y2={gridLine5} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" />
        <line x1={padX} y1={gridLine75} x2={width - padX} y2={gridLine75} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3 3" />
        <text x={padX - 2} y={gridLine5 + 3} fontSize="6" fill="#484f58" textAnchor="end">5.0</text>
        <text x={padX - 2} y={gridLine75 + 3} fontSize="6" fill="#484f58" textAnchor="end">7.5</text>

        {/* Fill area */}
        <motion.path
          d={areaPath}
          fill={lineColor}
          fillOpacity={fillOpacity}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: 0.3 }}
        />

        {/* Line */}
        <motion.polyline
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: 0.28 }}
        />

        {/* Dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill={lineColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ANIM, delay: 0.3 + i * 0.015 }}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[9px] text-[#484f58]">Oldest</span>
        <span className="text-[9px] text-[#8b949e] font-medium" style={{ color: lineColor }}>
          Avg: {avg.toFixed(1)}
        </span>
        <span className="text-[9px] text-[#484f58]">Newest</span>
      </div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function MatchHighlights() {
  const gameState = useGameStore((s) => s.gameState);

  // ── Computed Data ─────────────────────────────────────────
  const stats = useMemo(() => {
    if (!gameState) return null;
    const { recentResults, currentClub } = gameState;

    if (recentResults.length === 0) {
      return {
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        bestAvg: { label: 'N/A', cls: 'bg-[#21262d] text-[#484f58] border-[#30363d]' },
        latestMatch: null,
        allGoals: [] as { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[],
        allAssists: [] as { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[],
        allCards: [] as { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[],
        ratingHistory: [] as number[],
        bestMatch: null as MatchResult | null,
        worstMatch: null as MatchResult | null,
      };
    }

    const totalMatches = recentResults.length;
    const totalGoals = recentResults.reduce((s, r) => s + r.playerGoals, 0);
    const totalAssists = recentResults.reduce((s, r) => s + r.playerAssists, 0);

    const ratings = recentResults.map((r) => r.playerRating).filter((r) => r > 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const bestAvg = avgRating > 0 ? getQualityBadge(avgRating) : { label: 'N/A', cls: 'bg-[#21262d] text-[#484f58] border-[#30363d]' };

    // Latest match
    const latestMatch = recentResults[0];

    // Collect all player goal events
    const allGoals: { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[] = [];
    const allAssists: { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[] = [];
    const allCards: { match: MatchResult; event: MatchEvent; result: ReturnType<typeof getResultInfo> }[] = [];

    for (const match of recentResults) {
      const result = getResultInfo(match, currentClub.id);
      for (const event of match.events) {
        if (event.type === 'goal') {
          allGoals.push({ match, event, result });
        }
        if (event.type === 'assist') {
          allAssists.push({ match, event, result });
        }
        if (event.type === 'yellow_card' || event.type === 'red_card' || event.type === 'second_yellow') {
          allCards.push({ match, event, result });
        }
      }
    }

    // Rating history (last 15, oldest to newest)
    const ratingHistory = recentResults
      .slice(0, 15)
      .map((r) => r.playerRating)
      .filter((r) => r > 0)
      .reverse();

    // Best & worst match by rating
    const ratedMatches = recentResults.filter((r) => r.playerRating > 0);
    let bestMatch: MatchResult | null = null;
    let worstMatch: MatchResult | null = null;

    if (ratedMatches.length > 0) {
      bestMatch = ratedMatches.reduce((a, b) => (a.playerRating >= b.playerRating ? a : b));
      worstMatch = ratedMatches.reduce((a, b) => (a.playerRating <= b.playerRating ? a : b));
    }

    // Key events for latest match
    let latestKeyEvents: MatchEvent[] = [];
    if (recentResults.length > 0) {
      const lm = recentResults[0];
      const significantTypes: MatchEventType[] = [
        'goal', 'own_goal', 'assist', 'yellow_card', 'red_card',
        'second_yellow', 'substitution', 'injury', 'save', 'chance',
        'penalty_won', 'penalty_missed',
      ];
      latestKeyEvents = lm.events
        .filter((e) => significantTypes.includes(e.type))
        .sort((a, b) => a.minute - b.minute);
    }

    return {
      totalMatches,
      totalGoals,
      totalAssists,
      bestAvg,
      latestMatch,
      allGoals,
      allAssists,
      allCards,
      ratingHistory,
      bestMatch,
      worstMatch,
      latestKeyEvents,
    };
  }, [gameState]);

  // ── Early Returns ─────────────────────────────────────────
  if (!gameState || !stats) return null;

  const playerClubId = gameState.currentClub.id;

  // ── Empty State ───────────────────────────────────────────
  if (gameState.recentResults.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <Film className="w-12 h-12 text-[#484f58] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#c9d1d9] mb-2">No Highlights Yet</h2>
            <p className="text-sm text-[#8b949e]">
              Play some matches to see your highlight reel with goals, assists, cards, and key stats.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const {
    totalMatches,
    totalGoals,
    totalAssists,
    bestAvg,
    latestMatch,
    allGoals,
    allAssists,
    allCards,
    ratingHistory,
    bestMatch,
    worstMatch,
    latestKeyEvents,
  } = stats;

  // ── Latest match details ──────────────────────────────────
  const latestResult = latestMatch ? getResultInfo(latestMatch, playerClubId) : null;
  const latestBadge = latestResult ? getResultBadge(latestResult) : null;



  // Section index tracker for staggered delays
  let sectionIdx = 0;
  const nextSectionDelay = () => SECTION_DELAY + sectionIdx++ * SECTION_DELAY;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3 pb-20">

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 1: Header */}
      {/* ═══════════════════════════════════════════════════ */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
      >
        <Film className="h-5 w-5 text-emerald-400" />
        <h1 className="text-lg font-bold text-[#c9d1d9]">Match Highlights</h1>
        <Badge variant="outline" className="ml-auto text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          {totalMatches} matches
        </Badge>
      </motion.div>

      {/* Summary stats row */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.05 }}
      >
        <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1">
          <span className="text-emerald-400"><Target className="h-4 w-4" /></span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">{totalGoals}</span>
          <span className="text-[10px] text-[#8b949e]">Goals</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1">
          <span className="text-sky-400"><Zap className="h-4 w-4" /></span>
          <span className="text-xl font-bold text-sky-400 tabular-nums">{totalAssists}</span>
          <span className="text-[10px] text-[#8b949e]">Assists</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1">
          <span className="text-amber-400"><Star className="h-4 w-4" /></span>
          <Badge className={`text-[10px] px-2 py-0.5 border ${bestAvg.cls}`}>
            {bestAvg.label}
          </Badge>
          <span className="text-[10px] text-[#8b949e]">Avg Rating</span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 2: Latest Match Highlight (Featured) */}
      {/* ═══════════════════════════════════════════════════ */}
      {latestMatch && latestResult && latestBadge && (
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: nextSectionDelay() }}
        >
          {/* Top color bar */}
          <div className={`h-1.5 ${latestResult.won ? 'bg-emerald-500' : latestResult.drew ? 'bg-amber-500' : 'bg-red-500'}`} />

          <div className="p-5">
            {/* Competition + Week badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                {getCompetitionLabel(latestMatch.competition)}
              </Badge>
              <span className="text-[10px] text-[#8b949e]">Week {latestMatch.week} &middot; S{latestMatch.season}</span>
            </div>

            {/* Score display */}
            <div className="flex items-center justify-center gap-5 mb-4">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {latestMatch.homeClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {latestMatch.homeClub.shortName || latestMatch.homeClub.name.slice(0, 3)}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className="text-4xl font-black text-white tracking-wider">
                  {latestMatch.homeScore} <span className="text-[#484f58]">-</span> {latestMatch.awayScore}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {latestMatch.awayClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {latestMatch.awayClub.shortName || latestMatch.awayClub.name.slice(0, 3)}
                </span>
              </div>
            </div>

            {/* Result badge */}
            <div className="flex justify-center mb-4">
              <Badge className={`text-sm font-bold px-4 py-1 border ${latestBadge.color}`}>
                {latestResult.won ? '\uD83C\uDFC6 VICTORY' : latestResult.drew ? '\uD83E\uDD1D DRAW' : '\uD83D\uDCAA DEFEAT'}
              </Badge>
            </div>

            {/* Player contribution */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚽</span>
                  <span className="text-xs text-[#8b949e]">Goals</span>
                </div>
                <span className={`text-sm font-bold ${latestMatch.playerGoals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                  {latestMatch.playerGoals}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👟</span>
                  <span className="text-xs text-[#8b949e]">Assists</span>
                </div>
                <span className={`text-sm font-bold ${latestMatch.playerAssists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>
                  {latestMatch.playerAssists}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e]">Minutes</span>
                </div>
                <span className={`text-sm font-bold ${latestMatch.playerMinutesPlayed >= 90 ? 'text-emerald-400' : latestMatch.playerMinutesPlayed > 0 ? 'text-amber-400' : 'text-[#484f58]'}`}>
                  {latestMatch.playerMinutesPlayed}&apos;
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e]">Rating</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${getRatingTextClass(latestMatch.playerRating)}`}>
                  {latestMatch.playerRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Player Rating Display */}
            <div className="flex items-center justify-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getRatingBg(latestMatch.playerRating)}`}>
                <Award className="w-4 h-4" style={{ color: getRatingColor(latestMatch.playerRating) }} />
                <span className="text-xs text-[#8b949e]">Player Rating:</span>
                <span
                  className="text-lg font-black tabular-nums"
                  style={{ color: getRatingColor(latestMatch.playerRating) }}
                >
                  {latestMatch.playerRating.toFixed(1)}
                </span>
                <span className="text-xs text-[#8b949e]">/10</span>
              </div>
            </div>

            {/* Key Events Timeline */}
            {latestKeyEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#30363d]">
                <p className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Key Moments
                </p>
                <div className="space-y-2">
                  {latestKeyEvents.map((event, i) => {
                    const isLast = i === latestKeyEvents.length - 1;
                    const colorClass = getEventColor(event.type);
                    const icon = getEventIcon(event.type);
                    const label = getEventLabel(event.type);

                    return (
                      <motion.div
                        key={`${event.minute}-${event.type}-${i}`}
                        className="flex gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...ANIM, delay: 0.2 + i * ITEM_DELAY }}
                      >
                        <div className="flex flex-col items-center w-8 shrink-0">
                          <span className="text-[10px] font-mono text-[#8b949e] font-bold">
                            {event.minute}&apos;
                          </span>
                          {!isLast && <div className="w-px flex-1 bg-[#30363d] mt-1" />}
                        </div>
                        <div className="flex-1 flex items-center gap-2 bg-[#21262d] rounded-lg border border-[#30363d] px-3 py-1.5">
                          <span className="text-sm leading-none">{icon}</span>
                          <span className={`text-[11px] font-semibold ${colorClass}`}>{label}</span>
                          {(event.playerName || event.detail) && (
                            <span className="text-[10px] text-[#8b949e]">
                              {event.playerName && (
                                <span className="text-[#c9d1d9] font-medium">{event.playerName}</span>
                              )}
                              {event.playerName && event.detail && (
                                <span className="text-[#484f58] mx-1">&mdash;</span>
                              )}
                              {event.detail && (
                                <span>{event.detail}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 3: Goals Reel */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        title="Goals Reel"
        icon={<CircleDot className="h-3.5 w-3.5" />}
        badge={`${allGoals.length} goal${allGoals.length !== 1 ? 's' : ''}`}
        delay={nextSectionDelay()}
      >
        {allGoals.length === 0 ? (
          <div className="text-center py-4">
            <CircleDot className="w-8 h-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-sm text-[#8b949e]">No goals scored yet. Get on the scoreboard!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allGoals.map((item, i) => {
              const { match, event, result } = item;
              const badge = getResultBadge(result);
              return (
                <motion.div
                  key={`goal-${match.week}-${event.minute}-${i}`}
                  className="bg-[#21262d] rounded-lg border border-[#30363d] border-l-2 border-l-emerald-500 p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...ANIM, delay: 0.15 + i * ITEM_DELAY }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Match info */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-[#c9d1d9] font-medium truncate">
                          vs {result.opponent.shortName || result.opponent.name.slice(0, 12)}
                        </span>
                        <span className="text-[10px] text-[#8b949e] tabular-nums">
                          {match.homeScore}-{match.awayScore}
                        </span>
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 border font-bold shrink-0 ${badge.color}`}>
                          {badge.letter}
                        </Badge>
                      </div>

                      {/* Goal detail */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0 h-5">
                          ⚽ {event.minute}&apos;
                        </Badge>
                        {event.detail && (
                          <span className="text-[10px] text-[#8b949e] truncate">{event.detail}</span>
                        )}
                      </div>

                      {/* Competition + Season */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[8px] border-[#30363d] text-[#484f58] px-1.5 py-0 h-3.5">
                          {getCompetitionLabel(match.competition)}
                        </Badge>
                        <span className="text-[8px] text-[#484f58]">
                          Scored in S{match.season} Wk{match.week}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 4: Assist Reel */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        title="Assist Reel"
        icon={<Zap className="h-3.5 w-3.5" />}
        badge={`${allAssists.length} assist${allAssists.length !== 1 ? 's' : ''}`}
        delay={nextSectionDelay()}
      >
        {allAssists.length === 0 ? (
          <div className="text-center py-4">
            <Zap className="w-8 h-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-sm text-[#8b949e]">No assists recorded yet. Create some chances!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allAssists.map((item, i) => {
              const { match, event, result } = item;
              const badge = getResultBadge(result);
              return (
                <motion.div
                  key={`assist-${match.week}-${event.minute}-${i}`}
                  className="bg-[#21262d] rounded-lg border border-[#30363d] border-l-2 border-l-amber-500 p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...ANIM, delay: 0.2 + i * ITEM_DELAY }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Match info */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-[#c9d1d9] font-medium truncate">
                          vs {result.opponent.shortName || result.opponent.name.slice(0, 12)}
                        </span>
                        <span className="text-[10px] text-[#8b949e] tabular-nums">
                          {match.homeScore}-{match.awayScore}
                        </span>
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 border font-bold shrink-0 ${badge.color}`}>
                          {badge.letter}
                        </Badge>
                      </div>

                      {/* Assist detail */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-2 py-0 h-5">
                          👟 {event.minute}&apos;
                        </Badge>
                        {event.detail && (
                          <span className="text-[10px] text-[#8b949e] truncate">{event.detail}</span>
                        )}
                      </div>

                      {/* Competition + Season */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[8px] border-[#30363d] text-[#484f58] px-1.5 py-0 h-3.5">
                          {getCompetitionLabel(match.competition)}
                        </Badge>
                        <span className="text-[8px] text-[#484f58]">
                          Assist in S{match.season} Wk{match.week}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 5: Card Timeline */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        title="Card Timeline"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        badge={`${allCards.length} card${allCards.length !== 1 ? 's' : ''}`}
        delay={nextSectionDelay()}
      >
        {allCards.length === 0 ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-sm text-[#8b949e]">Clean record! No cards received.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {allCards.map((item, i) => {
              const { match, event, result } = item;
              const isYellow = event.type === 'yellow_card';
              const isRed = event.type === 'red_card' || event.type === 'second_yellow';
              const cardColor = isRed
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              const cardIcon = isRed ? '🟥' : '🟨';
              const cardLabel = event.type === 'second_yellow' ? '2nd Yellow → Red' : event.type === 'red_card' ? 'Red Card' : 'Yellow Card';

              return (
                <motion.div
                  key={`card-${match.week}-${event.minute}-${i}`}
                  className="bg-[#21262d] rounded-lg border border-[#30363d] p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...ANIM, delay: 0.25 + i * ITEM_DELAY }}
                >
                  <div className="flex items-center gap-3">
                    {/* Card type badge */}
                    <Badge className={`text-[10px] px-2 py-0.5 h-5 border font-bold shrink-0 ${cardColor}`}>
                      {cardIcon} {event.minute}&apos;
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${isRed ? 'text-red-400' : 'text-amber-400'}`}>
                        {cardLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#8b949e] truncate">
                          vs {result.opponent.shortName || result.opponent.name.slice(0, 12)}
                        </span>
                        <span className="text-[9px] text-[#484f58] tabular-nums">
                          {match.homeScore}-{match.awayScore}
                        </span>
                      </div>
                    </div>

                    {/* Competition badge */}
                    <Badge variant="outline" className="text-[8px] border-[#30363d] text-[#484f58] px-1.5 py-0 h-3.5 shrink-0">
                      {getCompetitionLabel(match.competition)} Wk{match.week}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 6: Rating History Graph */}
      {/* ═══════════════════════════════════════════════════ */}
      {ratingHistory.length >= 2 && (
        <Section
          title="Rating History"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          badge={`${ratingHistory.length} matches`}
          delay={nextSectionDelay()}
        >
          <RatingSparkline ratings={ratingHistory} />
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SECTION 7: Best & Worst Performances */}
      {/* ═══════════════════════════════════════════════════ */}
      {bestMatch && worstMatch && bestMatch !== worstMatch && (
        <motion.div
          className="grid grid-cols-1 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: nextSectionDelay() }}
        >
          {/* Best Match */}
          <div className="bg-[#161b22] border border-emerald-500/25 rounded-lg overflow-hidden">
            <div className="h-1.5 bg-emerald-500" />
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-bold">Best Performance</span>
            </div>
            <div className="p-4">
              <MatchPerformanceCard match={bestMatch} playerClubId={playerClubId} isBest />
            </div>
          </div>

          {/* Worst Match */}
          <div className="bg-[#161b22] border border-red-500/25 rounded-lg overflow-hidden">
            <div className="h-1.5 bg-red-500" />
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-bold">Worst Performance</span>
            </div>
            <div className="p-4">
              <MatchPerformanceCard match={worstMatch} playerClubId={playerClubId} isBest={false} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Single match case (only one match played) */}
      {bestMatch && worstMatch && bestMatch === worstMatch && (
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: nextSectionDelay() }}
        >
          <div className={`h-1.5 ${bestMatch.playerRating >= 6.0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-[#c9d1d9] font-bold">Match Performance</span>
          </div>
          <div className="p-4">
            <MatchPerformanceCard match={bestMatch} playerClubId={playerClubId} isBest={bestMatch.playerRating >= 6.0} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Match Performance Card (Best/Worst detail) ─────────────
function MatchPerformanceCard({
  match,
  playerClubId,
  isBest,
}: {
  match: MatchResult;
  playerClubId: string;
  isBest: boolean;
}) {
  const result = getResultInfo(match, playerClubId);
  const badge = getResultBadge(result);

  return (
    <div className="space-y-3">
      {/* Score + Opponent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-[#21262d] border border-[#30363d]">
            {result.opponent.logo}
          </div>
          <div>
            <p className="text-xs text-[#c9d1d9] font-semibold">
              vs {result.opponent.shortName || result.opponent.name.slice(0, 12)}
            </p>
            <p className="text-[10px] text-[#8b949e]">
              {getCompetitionLabel(match.competition)} &middot; Wk {match.week} &middot; S{match.season}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white tabular-nums">
            {match.homeScore}-{match.awayScore}
          </div>
          <Badge className={`text-[9px] px-1.5 py-0 h-4 border font-bold ${badge.color}`}>
            {badge.letter}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#21262d] rounded-md p-2 border border-[#30363d] text-center">
          <p className={`text-lg font-bold tabular-nums ${match.playerGoals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
            ⚽ {match.playerGoals}
          </p>
          <p className="text-[8px] text-[#8b949e]">Goals</p>
        </div>
        <div className="bg-[#21262d] rounded-md p-2 border border-[#30363d] text-center">
          <p className={`text-lg font-bold tabular-nums ${match.playerAssists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>
            👟 {match.playerAssists}
          </p>
          <p className="text-[8px] text-[#8b949e]">Assists</p>
        </div>
        <div className="bg-[#21262d] rounded-md p-2 border border-[#30363d] text-center">
          <p className={`text-lg font-bold tabular-nums ${match.playerMinutesPlayed >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {match.playerMinutesPlayed}&apos;
          </p>
          <p className="text-[8px] text-[#8b949e]">Minutes</p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-center">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getRatingBg(match.playerRating)}`}>
          <Award className="w-4 h-4" style={{ color: getRatingColor(match.playerRating) }} />
          <span
            className="text-xl font-black tabular-nums"
            style={{ color: getRatingColor(match.playerRating) }}
          >
            {match.playerRating.toFixed(1)}
          </span>
          <span className="text-xs text-[#8b949e]">/10</span>
        </div>
      </div>
    </div>
  );
}
