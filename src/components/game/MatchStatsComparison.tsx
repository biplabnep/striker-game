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
  Activity,
  Swords,
  Crown,
  Flame,
  LayoutGrid,
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

// --- Momentum & extended mock-data generators ---
function generateMomentumCurve(seed: number): number[] {
  const rand = seededRandom(seed + 42);
  const points: number[] = [];
  let v = (rand() - 0.5) * 12;
  for (let m = 0; m <= 90; m++) {
    v += (rand() - 0.48) * 7;
    v *= 0.97;
    v = Math.max(-50, Math.min(50, v));
    points.push(v);
  }
  return points;
}

function generateMomentumEvents(seed: number, homeGoals: number, awayGoals: number) {
  const rand = seededRandom(seed + 99);
  const ev: { minute: number; type: 'goal' | 'yellow' | 'red' | 'sub' }[] = [];
  const totalGoals = homeGoals + awayGoals;
  for (let i = 0; i < totalGoals; i++) ev.push({ minute: 3 + Math.floor(rand() * 85), type: 'goal' });
  const yc = 2 + Math.floor(rand() * 4);
  for (let i = 0; i < yc; i++) ev.push({ minute: 2 + Math.floor(rand() * 87), type: 'yellow' });
  if (rand() > 0.7) ev.push({ minute: 30 + Math.floor(rand() * 50), type: 'red' });
  const sc = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < sc; i++) ev.push({ minute: 45 + Math.floor(rand() * 46), type: 'sub' });
  return ev.sort((a, b) => a.minute - b.minute);
}

function generatePlayerBattle(seed: number) {
  const rand = seededRandom(seed + 1234);
  const mk = (name: string, pos: string) => ({
    name,
    position: pos,
    rating: +(6.2 + rand() * 2.8).toFixed(1),
    passing: Math.floor(73 + rand() * 22),
    tackles: Math.floor(1 + rand() * 6),
    shots: Math.floor(rand() * 5),
    distance: +(8.5 + rand() * 4.5).toFixed(1),
  });
  return { home: mk('M. Armstrong', 'CM'), away: mk('K. Müller', 'CAM') };
}

function generateSetPieces(seed: number) {
  const rand = seededRandom(seed + 5678);
  const sp = (minT: number, maxT: number, maxG: number, maxD: number) => ({
    total: minT + Math.floor(rand() * (maxT - minT + 1)),
    successRate: Math.floor(25 + rand() * 45),
    goals: Math.floor(rand() * (maxG + 1)),
    dangerous: 1 + Math.floor(rand() * maxD),
  });
  return {
    corners: { home: sp(3, 8, 2, 4), away: sp(2, 7, 1, 3) },
    freeKicks: { home: sp(5, 12, 1, 3), away: sp(4, 10, 1, 3) },
    throwIns: { home: sp(8, 18, 0, 2), away: sp(7, 16, 0, 2) },
    penalties: { home: sp(0, 2, 2, 2), away: sp(0, 1, 1, 1) },
  };
}

function generateHeatMap(seed: number) {
  const rand = seededRandom(seed + 4321);
  const mk = () => {
    const grid: number[][] = [];
    for (let r = 0; r < 4; r++) {
      grid[r] = [];
      for (let c = 0; c < 6; c++) grid[r][c] = Math.floor(rand() * 18);
    }
    return grid;
  };
  return { home: mk(), away: mk() };
}

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

  // --- Extended mock-data (new sections) ---
  const extSeed = selectedMatch
    ? selectedMatch.homeScore * 100 + selectedMatch.awayScore * 10 + selectedMatch.week * 1000 + selectedMatch.season
    : 0;

  const momentumData = useMemo(() => (selectedMatch ? generateMomentumCurve(extSeed) : []), [selectedMatch, extSeed]);
  const momentumEvents = useMemo(
    () => selectedMatch ? generateMomentumEvents(extSeed, selectedMatch.homeScore, selectedMatch.awayScore) : [],
    [selectedMatch, extSeed],
  );
  const momentumSvg = useMemo(() => {
    if (momentumData.length === 0) return null;
    const toX = (m: number) => 40 + (m / 90) * 460;
    const toY = (v: number) => 105 - (v / 50) * 90;
    const linePts = momentumData.map((v, m) => `${toX(m)},${toY(v)}`).join(' ');
    const abv: string[] = ['40,105'];
    const blw: string[] = ['40,105'];
    for (let m = 0; m <= 90; m++) {
      const x = toX(m);
      const y = toY(momentumData[m]);
      abv.push(`${x},${Math.min(y, 105)}`);
      blw.push(`${x},${Math.max(y, 105)}`);
    }
    abv.push('500,105');
    blw.push('500,105');
    return { linePts, aboveArea: abv.join(' '), belowArea: blw.join(' '), toX, toY };
  }, [momentumData]);

  const playerBattle = useMemo(() => (selectedMatch ? generatePlayerBattle(extSeed) : null), [selectedMatch, extSeed]);
  const setPieceData = useMemo(() => (selectedMatch ? generateSetPieces(extSeed) : null), [selectedMatch, extSeed]);
  const heatMapData = useMemo(() => (selectedMatch ? generateHeatMap(extSeed) : null), [selectedMatch, extSeed]);
  const heatMapCells = useMemo(() => {
    if (!heatMapData) return null;
    const cells: { r: number; c: number; h: number; a: number; total: number; dominant: 'home' | 'away'; opacity: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const h = heatMapData.home[r][c];
        const a = heatMapData.away[r][c];
        const total = h + a;
        cells.push({ r, c, h, a, total, dominant: h >= a ? 'home' : 'away', opacity: Math.min(total / 32, 0.7) });
      }
    }
    return cells;
  }, [heatMapData]);

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

      {/* ============================================ */}
      {/* 7. MATCH MOMENTUM FLOW                        */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-[#c9d1d9]">Match Momentum</h2>
          <span className="ml-auto text-[9px] text-[#484f58]">90 min</span>
        </div>

        {momentumSvg && (
          <svg viewBox="0 0 520 225" className="w-full" xmlns="http://www.w3.org/2000/svg">
            {/* Y-axis labels */}
            <text x="36" y="19" textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="monospace">+50</text>
            <text x="36" y="109" textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="monospace">0</text>
            <text x="36" y="199" textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="monospace">{'\u2212'}50</text>

            {/* Horizontal grid lines */}
            <line x1="40" y1="15" x2="500" y2="15" stroke="#21262d" strokeWidth="0.5" />
            <line x1="40" y1="60" x2="500" y2="60" stroke="#21262d" strokeWidth="0.3" strokeDasharray="2 4" />
            <line x1="40" y1="150" x2="500" y2="150" stroke="#21262d" strokeWidth="0.3" strokeDasharray="2 4" />
            <line x1="40" y1="195" x2="500" y2="195" stroke="#21262d" strokeWidth="0.5" />
            <line x1="40" y1="105" x2="500" y2="105" stroke="#30363d" strokeWidth="1" />

            {/* Half-time vertical line */}
            <line x1={momentumSvg.toX(45)} y1="12" x2={momentumSvg.toX(45)} y2="198" stroke="#484f58" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={momentumSvg.toX(45)} y="212" textAnchor="middle" fill="#484f58" fontSize="7">HT</text>

            {/* X-axis minute ticks */}
            {[0, 15, 30, 45, 60, 75, 90].map(m => {
              const x = momentumSvg.toX(m);
              return (
                <g key={`xtick-${m}`}>
                  <line x1={x} y1="195" x2={x} y2="199" stroke="#484f58" strokeWidth="0.5" />
                  <text x={x} y="212" textAnchor="middle" fill="#8b949e" fontSize="7">{m}&apos;</text>
                </g>
              );
            })}

            {/* Area fills — above center (home advantage) */}
            <polygon points={momentumSvg.aboveArea} fill="rgba(16,185,129,0.12)" />
            {/* Area fills — below center (away advantage) */}
            <polygon points={momentumSvg.belowArea} fill="rgba(59,130,246,0.12)" />

            {/* Momentum polyline */}
            <polyline
              points={momentumSvg.linePts}
              fill="none"
              stroke="#c9d1d9"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Event markers on the momentum line */}
            {momentumEvents.map((ev, i) => {
              const x = momentumSvg.toX(ev.minute);
              const val = momentumData[ev.minute] ?? 0;
              const y = momentumSvg.toY(val);
              if (ev.type === 'goal') {
                return <circle key={`me-${i}`} cx={x} cy={y} r="4" fill="#facc15" stroke="#0d1117" strokeWidth="1.2" />;
              }
              if (ev.type === 'yellow') {
                return <rect key={`me-${i}`} x={x - 3} y={y - 3} width="6" height="6" fill="#facc15" stroke="#0d1117" strokeWidth="0.8" rx="0.5" />;
              }
              if (ev.type === 'red') {
                return <rect key={`me-${i}`} x={x - 3} y={y - 3} width="6" height="6" fill="#ef4444" stroke="#0d1117" strokeWidth="0.8" rx="0.5" />;
              }
              if (ev.type === 'sub') {
                return <polygon key={`me-${i}`} points={`${x},${y - 4} ${x - 3.5},${y + 3} ${x + 3.5},${y + 3}`} fill="#8b949e" stroke="#0d1117" strokeWidth="0.8" />;
              }
              return null;
            })}
          </svg>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <div className="w-5 h-1.5 bg-emerald-500/25 rounded-sm" />
            <span className="text-[8px] text-[#8b949e]">{selectedMatch.homeClub.shortName}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-1.5 bg-blue-500/25 rounded-sm" />
            <span className="text-[8px] text-[#8b949e]">{selectedMatch.awayClub.shortName}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#facc15" /></svg>
            <span className="text-[8px] text-[#8b949e]">Goal</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="6" height="6" rx="0.5" fill="#facc15" /></svg>
            <span className="text-[8px] text-[#8b949e]">Card</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0.5 1,7.5 7,7.5" fill="#8b949e" /></svg>
            <span className="text-[8px] text-[#8b949e]">Sub</span>
          </div>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* 8. KEY PLAYER BATTLE BOX                      */}
      {/* ============================================ */}
      {playerBattle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <Swords className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-[#c9d1d9]">Key Player Battle</h2>
          </div>

          {/* Player cards side-by-side */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {([
              { player: playerBattle.home, team: 'home' as const, label: selectedMatch.homeClub.shortName },
              { player: playerBattle.away, team: 'away' as const, label: selectedMatch.awayClub.shortName },
            ]).map(({ player, team, label }) => {
              const homeWins = playerBattle.home.rating >= playerBattle.away.rating;
              const isWinner = (team === 'home' && homeWins) || (team === 'away' && !homeWins);
              return (
                <div key={team} className={`bg-[#0d1117] border rounded-lg p-3 ${isWinner ? 'border-emerald-500/30' : 'border-[#30363d]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-semibold text-[#484f58]">{label}</span>
                    {isWinner && (
                      <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <Crown className="h-2.5 w-2.5" /> WIN
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9] block">{player.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-[#8b949e]">{player.position}</span>
                    <span className="text-[9px] text-[#484f58]">&middot;</span>
                    <span className={`text-sm font-black ${isWinner ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {player.rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Head-to-head stat bars */}
          <div className="space-y-2.5">
            {([
              { label: 'Passing', homeVal: `${playerBattle.home.passing}%`, awayVal: `${playerBattle.away.passing}%`, homeNum: playerBattle.home.passing, awayNum: playerBattle.away.passing, max: 100 },
              { label: 'Tackles', homeVal: String(playerBattle.home.tackles), awayVal: String(playerBattle.away.tackles), homeNum: playerBattle.home.tackles, awayNum: playerBattle.away.tackles, max: 8 },
              { label: 'Shots', homeVal: String(playerBattle.home.shots), awayVal: String(playerBattle.away.shots), homeNum: playerBattle.home.shots, awayNum: playerBattle.away.shots, max: 6 },
              { label: 'Distance', homeVal: `${playerBattle.home.distance}km`, awayVal: `${playerBattle.away.distance}km`, homeNum: playerBattle.home.distance, awayNum: playerBattle.away.distance, max: 14 },
            ] as const).map(stat => {
              const homeBetter = stat.homeNum >= stat.awayNum;
              const homePct = Math.min((stat.homeNum / stat.max) * 100, 100);
              const awayPct = Math.min((stat.awayNum / stat.max) * 100, 100);
              return (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-semibold ${homeBetter ? 'text-emerald-400' : 'text-[#8b949e]'}`}>{stat.homeVal}</span>
                    <span className="text-[8px] text-[#484f58] font-medium">{stat.label}</span>
                    <span className={`text-[10px] font-semibold ${!homeBetter && stat.awayNum !== stat.homeNum ? 'text-emerald-400' : 'text-[#8b949e]'}`}>{stat.awayVal}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                      <div className={`h-full rounded-sm ${homeBetter ? 'bg-emerald-500/50' : 'bg-[#30363d]'}`} style={{ width: `${homePct}%` }} />
                    </div>
                    <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                      <div className={`h-full rounded-sm ${!homeBetter && stat.awayNum !== stat.homeNum ? 'bg-blue-500/50' : 'bg-[#30363d]'}`} style={{ width: `${awayPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* 9. SET PIECE EFFICIENCY BREAKDOWN             */}
      {/* ============================================ */}
      {setPieceData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-[#c9d1d9]">Set Piece Efficiency</h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([
              { label: 'Corners', data: setPieceData.corners },
              { label: 'Free Kicks', data: setPieceData.freeKicks },
              { label: 'Throw-ins', data: setPieceData.throwIns },
              { label: 'Penalties', data: setPieceData.penalties },
            ] as const).map(({ label, data }) => {
              const maxTotal = Math.max(data.home.total, data.away.total, 1);
              return (
                <div key={label} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5">
                  <span className="text-[9px] font-bold text-[#c9d1d9] block mb-1.5">{label}</span>

                  {/* Home team row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm" />
                      <span className="text-[8px] font-semibold text-emerald-400">{selectedMatch.homeClub.shortName}</span>
                    </div>
                    <span className="text-[9px] text-[#c9d1d9] font-semibold">{data.home.total}</span>
                  </div>
                  <div className="h-1 bg-[#21262d] rounded-sm mb-1 overflow-hidden">
                    <div className="h-full bg-emerald-500/40 rounded-sm" style={{ width: `${(data.home.total / maxTotal) * 100}%` }} />
                  </div>
                  <div className="flex gap-2 mb-2.5">
                    <span className="text-[7px] text-[#8b949e]">Acc {data.home.successRate}%</span>
                    <span className="text-[7px] text-[#8b949e]">Goals {data.home.goals}</span>
                    <span className="text-[7px] text-[#8b949e]">Danger {data.home.dangerous}</span>
                  </div>

                  {/* Away team row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />
                      <span className="text-[8px] font-semibold text-blue-400">{selectedMatch.awayClub.shortName}</span>
                    </div>
                    <span className="text-[9px] text-[#c9d1d9] font-semibold">{data.away.total}</span>
                  </div>
                  <div className="h-1 bg-[#21262d] rounded-sm overflow-hidden">
                    <div className="h-full bg-blue-500/40 rounded-sm" style={{ width: `${(data.away.total / maxTotal) * 100}%` }} />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[7px] text-[#8b949e]">Acc {data.away.successRate}%</span>
                    <span className="text-[7px] text-[#8b949e]">Goals {data.away.goals}</span>
                    <span className="text-[7px] text-[#8b949e]">Danger {data.away.dangerous}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* 10. MATCH HEAT MAP SUMMARY                    */}
      {/* ============================================ */}
      {heatMapCells && heatMapData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-[#c9d1d9]">Action Heat Map</h2>
          </div>

          <svg viewBox="0 0 390 270" className="w-full" xmlns="http://www.w3.org/2000/svg">
            {/* Pitch outline */}
            <rect x="15" y="15" width="360" height="240" fill="none" stroke="#30363d" strokeWidth="1.5" rx="2" />
            {/* Center line */}
            <line x1="195" y1="15" x2="195" y2="255" stroke="#30363d" strokeWidth="0.8" />
            {/* Center circle */}
            <circle cx="195" cy="135" r="30" fill="none" stroke="#30363d" strokeWidth="0.8" />
            {/* Center spot */}
            <circle cx="195" cy="135" r="2" fill="#30363d" />
            {/* Penalty areas */}
            <rect x="15" y="75" width="50" height="120" fill="none" stroke="#30363d" strokeWidth="0.8" />
            <rect x="325" y="75" width="50" height="120" fill="none" stroke="#30363d" strokeWidth="0.8" />
            {/* Goal areas */}
            <rect x="15" y="105" width="18" height="60" fill="none" stroke="#30363d" strokeWidth="0.6" />
            <rect x="357" y="105" width="18" height="60" fill="none" stroke="#30363d" strokeWidth="0.6" />
            {/* Penalty spots */}
            <circle cx="45" cy="135" r="1.5" fill="#30363d" />
            <circle cx="345" cy="135" r="1.5" fill="#30363d" />
            {/* Penalty arcs */}
            <path d="M 60,120 A 15,15 0 0,1 60,150" fill="none" stroke="#30363d" strokeWidth="0.6" />
            <path d="M 330,120 A 15,15 0 0,0 330,150" fill="none" stroke="#30363d" strokeWidth="0.6" />

            {/* Heatmap zone cells (6 cols × 4 rows, each 60×60 starting at 15,15) */}
            {heatMapCells.map(cell => {
              const x = 15 + cell.c * 60;
              const y = 15 + cell.r * 60;
              const fillColor = cell.dominant === 'home' ? 'rgba(16,185,129,' : 'rgba(59,130,246,';
              return (
                <g key={`hm-${cell.r}-${cell.c}`}>
                  <rect x={x + 1} y={y + 1} width="58" height="58" fill={`${fillColor}${cell.opacity})`} rx="1" />
                  <text x={x + 30} y={y + 33} textAnchor="middle" fill="#c9d1d9" fontSize="10" fontWeight="600" fontFamily="monospace">
                    {cell.total}
                  </text>
                  <text x={x + 30} y={y + 45} textAnchor="middle" fill="#8b949e" fontSize="6">
                    H{cell.h} A{cell.a}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2.5 justify-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500/40 rounded-sm" />
              <span className="text-[8px] text-[#8b949e]">{selectedMatch.homeClub.shortName} dominant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500/40 rounded-sm" />
              <span className="text-[8px] text-[#8b949e]">{selectedMatch.awayClub.shortName} dominant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="w-2.5 h-2.5 bg-emerald-500/8 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-500/20 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-500/40 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-emerald-500/60 rounded-sm" />
              </div>
              <span className="text-[8px] text-[#8b949e]">Low {'\u2192'} High</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
