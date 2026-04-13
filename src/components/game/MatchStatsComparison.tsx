'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Home,
  MapPin,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Flag,
  CircleDot,
  Square,
  ArrowRightLeft,
  Star,
  Award,
  User,
  ChevronLeft,
  Crosshair,
  Footprints,
  TriangleAlert,
} from 'lucide-react';
import type { MatchResult, MatchEvent } from '@/lib/game/types';

// --- Seed-based pseudo-random for consistent simulated stats ---
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface ComparisonStat {
  label: string;
  homeValue: number;
  awayValue: number;
  max: number;
  unit?: string;
  isPercentage?: boolean;
}

function generateComparisonStats(result: MatchResult): ComparisonStat[] {
  // Create a seed from match data for deterministic but varied stats
  const seed = result.homeScore * 100 + result.awayScore * 10 + result.week * 1000 + result.season;
  const rand = seededRandom(seed);

  // Determine which side the player is on for weighting
  const playerGoals = result.playerGoals;
  const playerAssists = result.playerAssists;
  const playerRating = result.playerRating;

  const homeWon = result.homeScore > result.awayScore;
  const awayWon = result.awayScore > result.homeScore;
  const isDraw = result.homeScore === result.awayScore;

  // Possession: 40-60 range
  const homePossession = Math.floor(42 + rand() * 16);
  const awayPossession = 100 - homePossession;

  // Shots: correlated with goals
  const homeShots = result.homeScore + Math.floor(rand() * 8) + 3;
  const awayShots = result.awayScore + Math.floor(rand() * 8) + 3;

  // Shots on target: ~30-50% of total shots
  const homeOnTarget = Math.floor(homeShots * (0.3 + rand() * 0.2));
  const awayOnTarget = Math.floor(awayShots * (0.3 + rand() * 0.2));

  // Passes: 300-600 range
  const homePasses = Math.floor(350 + rand() * 250);
  const awayPasses = Math.floor(350 + rand() * 250);

  // Pass accuracy: 70-92%
  const homePassAcc = Math.floor(72 + rand() * 18);
  const awayPassAcc = Math.floor(72 + rand() * 18);

  // Tackles: 12-30
  const homeTackles = Math.floor(14 + rand() * 14);
  const awayTackles = Math.floor(14 + rand() * 14);

  // Corners: 2-10
  const homeCorners = Math.floor(3 + rand() * 6);
  const awayCorners = Math.floor(3 + rand() * 6);

  // Fouls: 8-20
  const homeFouls = Math.floor(9 + rand() * 9);
  const awayFouls = Math.floor(9 + rand() * 9);

  return [
    { label: 'Possession', homeValue: homePossession, awayValue: awayPossession, max: 100, isPercentage: true },
    { label: 'Shots', homeValue: homeShots, awayValue: awayShots, max: 20 },
    { label: 'Shots on Target', homeValue: homeOnTarget, awayValue: awayOnTarget, max: 12 },
    { label: 'Passes', homeValue: homePasses, awayValue: awayPasses, max: 700 },
    { label: 'Pass Accuracy', homeValue: homePassAcc, awayValue: awayPassAcc, max: 100, isPercentage: true },
    { label: 'Tackles', homeValue: homeTackles, awayValue: awayTackles, max: 30 },
    { label: 'Corners', homeValue: homeCorners, awayValue: awayCorners, max: 12 },
    { label: 'Fouls', homeValue: homeFouls, awayValue: awayFouls, max: 20 },
  ];
}

function generatePlayerStats(result: MatchResult) {
  const seed = result.playerRating * 100 + result.playerGoals * 50 + result.playerAssists * 30 + result.week;
  const rand = seededRandom(seed);

  const passAccuracy = Math.floor(65 + (result.playerRating / 10) * 25 + rand() * 8);
  const shotsOnTarget = result.playerGoals + Math.floor(rand() * 3);
  const tacklesWon = Math.floor(rand() * 5);
  const keyPasses = result.playerAssists + Math.floor(rand() * 3);
  const dribbles = Math.floor(rand() * 4);
  const interceptions = Math.floor(rand() * 3);

  return { passAccuracy, shotsOnTarget, tacklesWon, keyPasses, dribbles, interceptions };
}

function generateRatingBreakdown(rating: number) {
  // Distribute rating into factors
  const base = 6.0;
  const bonus = rating - base;
  const rand = seededRandom(Math.floor(rating * 137));

  const attacking = Math.min(bonus * 0.35, 2.0);
  const defending = Math.min(bonus * 0.2, 1.0);
  const passing = Math.min(bonus * 0.25, 1.5);
  const discipline = -(rand() * 0.3);

  const factors = [
    { label: 'Attacking Contribution', value: +(attacking).toFixed(2), icon: <Crosshair className="h-3.5 w-3.5" />, positive: attacking > 0 },
    { label: 'Defending & Tracking', value: +(defending).toFixed(2), icon: <Shield className="h-3.5 w-3.5" />, positive: defending > 0 },
    { label: 'Passing & Creativity', value: +(passing).toFixed(2), icon: <Footprints className="h-3.5 w-3.5" />, positive: passing > 0 },
    { label: 'Discipline', value: +discipline.toFixed(2), icon: <TriangleAlert className="h-3.5 w-3.5" />, positive: discipline >= 0 },
    { label: 'Base Rating', value: +base.toFixed(1), icon: <Star className="h-3.5 w-3.5" />, positive: true },
  ];

  return factors;
}

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-emerald-300';
  if (rating >= 6.0) return 'text-yellow-400';
  if (rating >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

function getRatingBg(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500/15 border-emerald-500/30';
  if (rating >= 7.0) return 'bg-emerald-500/10 border-emerald-500/20';
  if (rating >= 6.0) return 'bg-yellow-500/10 border-yellow-500/20';
  if (rating >= 5.0) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getResultColor(homeScore: number, awayScore: number, isPlayerHome: boolean): string {
  if (homeScore === awayScore) return 'text-yellow-400';
  if (isPlayerHome) return homeScore > awayScore ? 'text-emerald-400' : 'text-red-400';
  return awayScore > homeScore ? 'text-emerald-400' : 'text-red-400';
}

function getResultLabel(homeScore: number, awayScore: number, isPlayerHome: boolean): string {
  if (homeScore === awayScore) return 'DRAW';
  if (isPlayerHome) return homeScore > awayScore ? 'WIN' : 'LOSS';
  return awayScore > homeScore ? 'WIN' : 'LOSS';
}

function eventIcon(type: MatchEvent['type']) {
  switch (type) {
    case 'goal':
    case 'own_goal':
      return <CircleDot className="h-3.5 w-3.5 text-emerald-400" />;
    case 'yellow_card':
      return <Square className="h-3.5 w-3.5 text-yellow-400" />;
    case 'red_card':
    case 'second_yellow':
      return <Square className="h-3.5 w-3.5 text-red-400" />;
    case 'substitution':
      return <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />;
    case 'injury':
      return <Flag className="h-3.5 w-3.5 text-orange-400" />;
    case 'save':
      return <Shield className="h-3.5 w-3.5 text-cyan-400" />;
    default:
      return <CircleDot className="h-3.5 w-3.5 text-[#8b949e]" />;
  }
}

function eventLabel(type: MatchEvent['type']): string {
  switch (type) {
    case 'goal': return 'Goal';
    case 'own_goal': return 'Own Goal';
    case 'yellow_card': return 'Yellow Card';
    case 'red_card': return 'Red Card';
    case 'second_yellow': return 'Second Yellow';
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

// --- Fade-in animation variant (opacity only) ---
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

// --- Stat Bar Component ---
function StatBar({ stat, index }: { stat: ComparisonStat; index: number }) {
  const homePercent = Math.min((stat.homeValue / stat.max) * 100, 100);
  const awayPercent = Math.min((stat.awayValue / stat.max) * 100, 100);
  const homeDominates = stat.homeValue > stat.awayValue;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex items-center gap-2 py-1.5"
    >
      {/* Home value */}
      <div className="flex-1 flex justify-end">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homePercent}%` }}
          transition={{ duration: 0.6, delay: index * 0.04 + 0.1 }}
          className={`h-5 rounded-sm flex items-center justify-end px-2 ${
            homeDominates ? 'bg-emerald-500/25' : 'bg-[#21262d]'
          }`}
        >
          <span className="text-[10px] font-semibold text-[#c9d1d9] whitespace-nowrap">
            {stat.isPercentage ? `${stat.homeValue}%` : stat.homeValue}
            {stat.unit || ''}
          </span>
        </motion.div>
      </div>

      {/* Label */}
      <div className="w-20 text-center flex-shrink-0">
        <span className="text-[9px] font-medium text-[#8b949e] uppercase tracking-wide">
          {stat.label}
        </span>
      </div>

      {/* Away value */}
      <div className="flex-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayPercent}%` }}
          transition={{ duration: 0.6, delay: index * 0.04 + 0.1 }}
          className={`h-5 rounded-sm flex items-center px-2 ${
            !homeDominates ? 'bg-blue-500/25' : 'bg-[#21262d]'
          }`}
        >
          <span className="text-[10px] font-semibold text-[#c9d1d9] whitespace-nowrap">
            {stat.isPercentage ? `${stat.awayValue}%` : stat.awayValue}
            {stat.unit || ''}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- Player Event Indicator (in timeline) ---
function isPlayerEvent(event: MatchEvent, playerTeam: 'home' | 'away'): boolean {
  return event.team === playerTeam && !!event.playerName;
}

// --- Main Component ---
export default function MatchStatsComparison() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const recentResults = gameState?.recentResults ?? [];
  const currentClub = gameState?.currentClub;
  const player = gameState?.player;

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Select the most recent match by default
  const selectedMatch: MatchResult | null = recentResults[selectedIndex] ?? null;

  // Determine if player is home or away
  const isPlayerHome = selectedMatch
    ? selectedMatch.homeClub.id === currentClub?.id
    : false;
  const playerTeam: 'home' | 'away' = isPlayerHome ? 'home' : 'away';

  // Generate simulated comparison stats
  const comparisonStats = useMemo(
    () => (selectedMatch ? generateComparisonStats(selectedMatch) : []),
    [selectedMatch]
  );

  // Generate player stats
  const playerStats = useMemo(
    () => (selectedMatch ? generatePlayerStats(selectedMatch) : null),
    [selectedMatch]
  );

  // Generate rating breakdown
  const ratingBreakdown = useMemo(
    () => (selectedMatch ? generateRatingBreakdown(selectedMatch.playerRating) : []),
    [selectedMatch]
  );

  // --- Empty State ---
  if (recentResults.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-20 min-h-[80vh] flex flex-col items-center justify-center">
        <motion.div {...fadeIn} className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-[#484f58]" />
          </div>
          <h2 className="text-lg font-bold text-[#c9d1d9]">No Matches Played Yet</h2>
          <p className="text-sm text-[#8b949e] max-w-xs">
            Play your first match to see detailed head-to-head statistics and performance analysis.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!selectedMatch) return null;

  const resultColor = getResultColor(selectedMatch.homeScore, selectedMatch.awayScore, isPlayerHome);
  const resultLabel = getResultLabel(selectedMatch.homeScore, selectedMatch.awayScore, isPlayerHome);
  const matchDate = `Season ${selectedMatch.season} — Week ${selectedMatch.week}`;

  // Filter events for timeline (key events only)
  const timelineEvents = selectedMatch.events.filter(e =>
    ['goal', 'own_goal', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'save'].includes(e.type)
  );

  // Player events for highlighting
  const playerEventSet = new Set(
    selectedMatch.events
      .filter(e => isPlayerEvent(e, playerTeam))
      .map(e => `${e.type}-${e.minute}-${e.team}`)
  );

  function isHighlighted(event: MatchEvent): boolean {
    return playerEventSet.has(`${event.type}-${event.minute}-${event.team}`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 pt-4 pb-3"
      >
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-bold text-[#c9d1d9] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          Match Stats Comparison
        </h1>
      </motion.div>

      {/* Match Selector Tabs */}
      {recentResults.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-1 scrollbar-hide">
          {recentResults.map((r, i) => {
            const hScore = r.homeScore;
            const aScore = r.awayScore;
            const isHome = r.homeClub.id === currentClub?.id;
            const isActive = i === selectedIndex;
            const rColor = getResultColor(hScore, aScore, isHome);
            const shortLabel = `${r.homeClub.shortName} ${hScore}-${aScore} ${r.awayClub.shortName}`;

            return (
              <button
                key={`match-tab-${i}`}
                onClick={() => setSelectedIndex(i)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58]'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================ */}
      {/* 1. MATCH HEADER                              */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
      >
        {/* Competition & Date Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            {selectedMatch.competition}
          </span>
          <span className="text-[10px] text-[#8b949e]">{matchDate}</span>
        </div>

        {/* Home vs Away */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-2xl">{selectedMatch.homeClub.logo}</span>
            <span className={`text-xs font-semibold truncate max-w-[100px] ${isPlayerHome ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
              {selectedMatch.homeClub.name}
            </span>
            {isPlayerHome && (
              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Home className="h-2.5 w-2.5" /> YOUR TEAM
              </span>
            )}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 px-4">
            <span className={`text-3xl font-black tracking-tight ${resultColor}`}>
              {selectedMatch.homeScore} — {selectedMatch.awayScore}
            </span>
            <span className={`text-[9px] font-bold ${resultColor} bg-[#21262d] px-2 py-0.5 rounded`}>
              {resultLabel}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-2xl">{selectedMatch.awayClub.logo}</span>
            <span className={`text-xs font-semibold truncate max-w-[100px] ${!isPlayerHome ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
              {selectedMatch.awayClub.name}
            </span>
            {!isPlayerHome && (
              <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" /> AWAY
              </span>
            )}
          </div>
        </div>

        {/* Venue */}
        <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center justify-center gap-1.5">
          <MapPin className="h-3 w-3 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">
            {isPlayerHome ? 'Home' : 'Away'} — {selectedMatch.homeClub.name}
          </span>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* 2. PERFORMANCE RATINGS PANEL                 */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 gap-2 mb-3"
      >
        {/* Home Rating */}
        <div className={`border rounded-lg p-3 ${isPlayerHome ? getRatingBg(selectedMatch.playerRating) : 'bg-[#161b22] border-[#30363d]'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">{selectedMatch.homeClub.logo}</span>
            <span className="text-[10px] font-semibold text-[#8b949e] truncate">
              {selectedMatch.homeClub.shortName}
            </span>
          </div>
          {isPlayerHome ? (
            <div>
              <span className={`text-2xl font-black ${getRatingColor(selectedMatch.playerRating)}`}>
                {selectedMatch.playerRating.toFixed(1)}
              </span>
              <p className="text-[9px] text-emerald-400 mt-0.5">Your Rating</p>
            </div>
          ) : (
            <div>
              <span className="text-2xl font-black text-[#8b949e]">—</span>
              <p className="text-[9px] text-[#484f58] mt-0.5">Opponent</p>
            </div>
          )}
        </div>

        {/* Away Rating */}
        <div className={`border rounded-lg p-3 ${!isPlayerHome ? getRatingBg(selectedMatch.playerRating) : 'bg-[#161b22] border-[#30363d]'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">{selectedMatch.awayClub.logo}</span>
            <span className="text-[10px] font-semibold text-[#8b949e] truncate">
              {selectedMatch.awayClub.shortName}
            </span>
          </div>
          {!isPlayerHome ? (
            <div>
              <span className={`text-2xl font-black ${getRatingColor(selectedMatch.playerRating)}`}>
                {selectedMatch.playerRating.toFixed(1)}
              </span>
              <p className="text-[9px] text-emerald-400 mt-0.5">Your Rating</p>
            </div>
          ) : (
            <div>
              <span className="text-2xl font-black text-[#8b949e]">—</span>
              <p className="text-[9px] text-[#484f58] mt-0.5">Opponent</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* 3. STAT COMPARISON BARS                     */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-[#c9d1d9]">Head-to-Head Stats</h2>
        </div>

        {/* Team Labels */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 text-right">
            <span className="text-[9px] font-semibold text-emerald-400">
              {isPlayerHome ? 'You' : selectedMatch.homeClub.shortName}
            </span>
          </div>
          <div className="w-20" />
          <div className="flex-1">
            <span className="text-[9px] font-semibold text-blue-400">
              {!isPlayerHome ? 'You' : selectedMatch.awayClub.shortName}
            </span>
          </div>
        </div>

        {/* Stat Bars */}
        <div className="space-y-0.5">
          {comparisonStats.map((stat, i) => (
            <StatBar key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* 4. PLAYER PERFORMANCE CARD                   */}
      {/* ============================================ */}
      {playerStats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-[#c9d1d9]">Your Performance</h2>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${getRatingBg(selectedMatch.playerRating)}`}>
              <Star className="h-3 w-3" style={{ color: selectedMatch.playerRating >= 7 ? '#34d399' : selectedMatch.playerRating >= 6 ? '#facc15' : '#f97316' }} />
              <span className={`text-xs font-bold ${getRatingColor(selectedMatch.playerRating)}`}>
                {selectedMatch.playerRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Minutes & Position info */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#30363d]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-[10px] text-[#8b949e]">
                {selectedMatch.playerStarted ? 'Started' : 'Sub'} — {selectedMatch.playerMinutesPlayed}&apos; min
              </span>
            </div>
            <span className="text-[10px] text-[#484f58]">|</span>
            <span className="text-[10px] text-[#8b949e]">{player?.position ?? '—'}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Crosshair className="h-3.5 w-3.5" />, label: 'Goals', value: selectedMatch.playerGoals, highlight: selectedMatch.playerGoals > 0 },
              { icon: <Footprints className="h-3.5 w-3.5" />, label: 'Assists', value: selectedMatch.playerAssists, highlight: selectedMatch.playerAssists > 0 },
              { icon: <Target className="h-3.5 w-3.5" />, label: 'Shots on Tgt', value: playerStats.shotsOnTarget, highlight: playerStats.shotsOnTarget >= 2 },
              { icon: <Zap className="h-3.5 w-3.5" />, label: 'Pass Acc.', value: `${playerStats.passAccuracy}%`, highlight: playerStats.passAccuracy >= 85 },
              { icon: <Shield className="h-3.5 w-3.5" />, label: 'Tackles Won', value: playerStats.tacklesWon, highlight: playerStats.tacklesWon >= 3 },
              { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Key Passes', value: playerStats.keyPasses, highlight: playerStats.keyPasses >= 2 },
            ].map(item => (
              <div
                key={item.label}
                className={`bg-[#0d1117] border rounded-lg p-2 flex flex-col items-center gap-1 ${
                  item.highlight ? 'border-emerald-500/30' : 'border-[#30363d]'
                }`}
              >
                <div className="text-[#8b949e]">{item.icon}</div>
                <span className={`text-base font-bold ${item.highlight ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                  {item.value}
                </span>
                <span className="text-[8px] text-[#484f58] font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* 5. MATCH EVENTS TIMELINE                     */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-[#c9d1d9]">Match Events</h2>
        </div>

        {timelineEvents.length === 0 ? (
          <p className="text-[10px] text-[#484f58] text-center py-4">No key events recorded for this match.</p>
        ) : (
          <div className="space-y-0">
            {timelineEvents.map((event, i) => {
              const highlighted = isHighlighted(event);
              return (
                <motion.div
                  key={`${event.type}-${event.minute}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`flex items-start gap-2.5 py-2 border-b last:border-b-0 ${
                    highlighted ? 'border-l-2 border-l-emerald-500 pl-2' : 'border-b-[#21262d]'
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">{eventIcon(event.type)}</div>

                  {/* Minute */}
                  <span className="text-[10px] font-bold text-[#8b949e] w-8 flex-shrink-0">
                    {event.minute}&apos;
                  </span>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[#c9d1d9]">
                        {event.playerName || 'Unknown'}
                      </span>
                      <span className="text-[9px] text-[#484f58]">•</span>
                      <span className="text-[9px] text-[#8b949e]">{eventLabel(event.type)}</span>
                    </div>
                    {event.detail && (
                      <p className="text-[9px] text-[#484f58] mt-0.5 truncate">{event.detail}</p>
                    )}
                  </div>

                  {/* Team indicator */}
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    event.team === 'home'
                      ? 'bg-[#21262d] text-[#8b949e]'
                      : event.team === 'away'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-[#21262d] text-[#8b949e]'
                  }`}>
                    {event.team === 'home' ? selectedMatch.homeClub.shortName : event.team === 'away' ? selectedMatch.awayClub.shortName : '—'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ============================================ */}
      {/* 6. MATCH RATING BREAKDOWN                    */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-[#c9d1d9]">Rating Breakdown</h2>
          <span className={`ml-auto text-sm font-black ${getRatingColor(selectedMatch.playerRating)}`}>
            {selectedMatch.playerRating.toFixed(1)}
          </span>
        </div>

        <div className="space-y-2">
          {ratingBreakdown.map((factor, i) => (
            <motion.div
              key={factor.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 bg-[#21262d] rounded flex items-center justify-center flex-shrink-0 text-[#8b949e]">
                {factor.icon}
              </div>
              <span className="flex-1 text-[10px] text-[#c9d1d9] font-medium">{factor.label}</span>
              <span className={`text-xs font-bold ${factor.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {factor.value > 0 ? '+' : ''}{factor.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
