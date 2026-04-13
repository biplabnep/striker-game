'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  X,
  Trophy,
  Calendar,
  TrendingDown,
  Lightbulb,
  Shield,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Position } from '@/lib/game/types';
import { getClubById, getClubsByLeague } from '@/lib/game/clubsData';

// ============================================================
// Design tokens (Uncodixify compliant)
// ============================================================

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const PANEL_BG = 'bg-[#1c2333]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';
const EMERALD = 'text-emerald-400';
const EMERALD_BG = 'bg-emerald-500/15';
const EMERALD_BORDER = 'border-emerald-500/30';
const AMBER_TEXT = 'text-amber-400';
const AMBER_BG = 'bg-amber-500/15';
const AMBER_BORDER = 'border-amber-500/30';
const RED_TEXT = 'text-red-400';
const RED_BG = 'bg-red-500/15';
const RED_BORDER = 'border-red-500/30';

// ============================================================
// Animation variants (opacity-only, no transforms)
// ============================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

// ============================================================
// Seeded random for deterministic data
// ============================================================

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================
// Types & Interfaces
// ============================================================

interface SquadPlayer {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  fitness: number;       // 0-100
  form: number;          // 1-10
  consecutiveGames: number;
  injuryHistoryCount: number;
  isStarter: boolean;    // based on fitness + form
  isUser: boolean;
}

interface RotationSuggestion {
  id: string;
  restPlayer: SquadPlayer;
  bringInPlayer: SquadPlayer;
  reason: string;
  applied: boolean;
}

interface UpcomingFixture {
  competition: 'league' | 'cup' | 'continental';
  opponent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weekOffset: number;
}

// ============================================================
// Constants
// ============================================================

const FIRST_NAMES = [
  'Marcus', 'James', 'Oliver', 'Carlos', 'Luis', 'Serge', 'Antonio',
  'Thiago', 'Mohamed', 'Kevin', 'Virgil', 'Bruno', 'Paul', 'Raheem',
  'Jadon', 'Phil', 'Bukayo', 'Declan', 'Jude', 'Florian', 'Gabriel',
  'Rafael', 'Pierre', 'Ousmane', 'Robert', 'Achraf', 'Federico',
  'Milan', 'Ederson', 'Alisson', 'Manuel', 'Keylor', 'Hugo',
  'Aymeric', 'Ruben', 'Ibrahima', 'Nathan', 'Levi', 'Aaron',
  'Martin', 'Trent', 'Reece', 'Ben', 'John', 'Kyle', 'Kieran',
];

const LAST_NAMES = [
  'Rashford', 'Walker', 'Smith', 'Silva', 'Diaz', 'Gnabry', 'Rudiger',
  'Henderson', 'Salah', 'De Bruyne', 'Van Dijk', 'Fernandes', 'Pogba',
  'Sterling', 'Sancho', 'Foden', 'Saka', 'Rice', 'Bellingham', 'Wirtz',
  'Jesus', 'Leao', 'Emery', 'Dembele', 'Lewandowski', 'Hakimi', 'Chiesa',
  'Martinez', 'Neuer', 'Navas', 'Lloris',
  'Laporte', 'Dias', 'Konate', 'Ake', 'Colwill', 'Cresswell',
  'Odegaard', 'Alexander-Arnold', 'James', 'White', 'Stones',
];

const SQUAD_POSITIONS: Position[] = [
  'GK', 'GK',
  'CB', 'CB', 'CB', 'LB', 'RB',
  'CDM', 'CM', 'CM', 'CAM',
  'LW', 'RW', 'ST', 'ST', 'CF',
  'CM', 'CB', 'RB', 'LM', 'ST',
];

const COMPETITION_ICONS: Record<string, { icon: string; label: string }> = {
  league: { icon: '🏟️', label: 'League' },
  cup: { icon: '🏆', label: 'Cup' },
  continental: { icon: '🌍', label: 'Europe' },
};

// ============================================================
// Deterministic squad generation
// ============================================================

function generateSquad(
  clubName: string,
  userName: string,
  userPosition: Position,
  userOvr: number,
  season: number,
  week: number,
): SquadPlayer[] {
  const baseSeed = hashString(clubName + userName + season.toString() + week.toString());
  const rng = createSeededRandom(baseSeed);

  const players: SquadPlayer[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < SQUAD_POSITIONS.length; i++) {
    const pos = SQUAD_POSITIONS[i];

    let name: string;
    let isUser = false;

    if (i === 0 && userPosition === 'GK') {
      name = userName;
      isUser = true;
    } else {
      // Find a position slot matching the user
      const userSlotIdx = SQUAD_POSITIONS.findIndex((p) => p === userPosition);
      if (i === (userSlotIdx === -1 ? 2 : userSlotIdx + 1)) {
        name = userName;
        isUser = true;
      } else {
        let firstName: string;
        let lastName: string;
        do {
          firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
          lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        } while (usedNames.has(`${firstName} ${lastName}`));
        usedNames.add(`${firstName} ${lastName}`);
        name = `${firstName} ${lastName}`;
      }
    }

    // OVR: starters 70-95, bench 55-78
    const isBenchSlot = i >= 14;
    const ovrBase = isBenchSlot ? userOvr - 8 : userOvr;
    const ovr = Math.max(50, Math.min(95, Math.round(ovrBase + (rng() - 0.5) * (isBenchSlot ? 16 : 20))));

    // Fitness: varies 40-98, seeded by index
    const fitnessBase = 85 - (i * 3.2) + (rng() * 40 - 20);
    const fitness = Math.max(35, Math.min(99, Math.round(fitnessBase + (season - 1) * 2 + week * 0.5)));

    // Form: 3-9
    const form = Math.max(3, Math.min(9, Math.round(6 + (rng() - 0.5) * 6)));

    // Consecutive games: 1-8
    const consecutiveGames = Math.max(1, Math.min(8, Math.round(fitness < 70 ? 3 + rng() * 5 : 1 + rng() * 3)));

    // Injury history
    const injuryHistoryCount = Math.max(0, Math.min(5, Math.round((1 - fitness / 100) * 4 + rng() * 2)));

    players.push({
      id: isUser ? 'user' : `squad-${i}`,
      name,
      position: pos,
      ovr,
      fitness,
      form,
      consecutiveGames,
      injuryHistoryCount,
      isStarter: !isBenchSlot && fitness >= 55,
      isUser,
    });
  }

  // Determine starters: top 11 by fitness*0.5 + form*5 + ovr*0.1
  const scored = players.map((p) => ({
    ...p,
    score: p.fitness * 0.5 + p.form * 5 + p.ovr * 0.1,
  }));
  scored.sort((a, b) => b.score - a.score);

  const starterIds = new Set(scored.slice(0, 11).map((p) => p.id));

  return players.map((p) => ({
    ...p,
    isStarter: starterIds.has(p.id),
  }));
}

// ============================================================
// Rotation suggestion generator
// ============================================================

function generateSuggestions(
  squad: SquadPlayer[],
): RotationSuggestion[] {
  const starters = squad.filter((p) => p.isStarter).sort((a, b) => a.fitness - b.fitness);
  const bench = squad.filter((p) => !p.isStarter && !p.isUser).sort((a, b) => b.fitness - a.fitness);
  const suggestions: RotationSuggestion[] = [];

  // Suggestion 1: Lowest fitness starter swap
  if (starters.length > 0 && bench.length > 0) {
    const tiredStarter = starters[0];
    if (tiredStarter.fitness < 75) {
      // Find a bench player with same-ish position group
      const positionGroup = getPositionGroup(tiredStarter.position);
      const replacement = bench.find((b) => getPositionGroup(b.position) === positionGroup) || bench[0];
      suggestions.push({
        id: 'sug-1',
        restPlayer: tiredStarter,
        bringInPlayer: replacement,
        reason: `${tiredStarter.name} has ${tiredStarter.fitness}% fitness after ${tiredStarter.consecutiveGames} consecutive games. ${replacement.name} is fresh at ${replacement.fitness}%.`,
        applied: false,
      });
    }
  }

  // Suggestion 2: High consecutive games risk
  const highGames = starters.filter((s) => s.consecutiveGames >= 5 && s.fitness < 70);
  if (highGames.length > 0 && bench.length > 0) {
    const risky = highGames[0];
    const positionGroup = getPositionGroup(risky.position);
    const replacement = bench.find((b) => getPositionGroup(b.position) === positionGroup && b.fitness > 75) || bench[0];
    if (replacement && !suggestions.some((s) => s.restPlayer.id === risky.id)) {
      suggestions.push({
        id: 'sug-2',
        restPlayer: risky,
        bringInPlayer: replacement,
        reason: `${risky.name} has played ${risky.consecutiveGames} games in a row with ${risky.fitness}% fitness. High injury risk. ${replacement.name} (${replacement.ovr} OVR) is a solid alternative.`,
        applied: false,
      });
    }
  }

  // Suggestion 3: Tactical freshness rotation
  if (starters.length > 2 && bench.length > 0) {
    const midFitStarter = starters[Math.min(2, starters.length - 1)];
    if (midFitStarter && midFitStarter.fitness < 80 && !suggestions.some((s) => s.restPlayer.id === midFitStarter.id)) {
      const freshBench = bench.find((b) => b.fitness >= 80);
      if (freshBench) {
        suggestions.push({
          id: 'sug-3',
          restPlayer: midFitStarter,
          bringInPlayer: freshBench,
          reason: `Rotate ${midFitStarter.name} (${midFitStarter.fitness}%) to keep squad fresh for upcoming fixtures. ${freshBench.name} has had good rest at ${freshBench.fitness}%.`,
          applied: false,
        });
      }
    }
  }

  return suggestions;
}

// ============================================================
// Upcoming fixtures generator (deterministic)
// ============================================================

function generateUpcomingFixtures(
  clubId: string,
  league: string,
  season: number,
  week: number,
  clubOvr: number,
): UpcomingFixture[] {
  const seed = hashString(clubId + season.toString() + week.toString());
  const rng = createSeededRandom(seed);
  const clubs = getClubsByLeague(league);

  const fixtures: UpcomingFixture[] = [];
  const competitions: ('league' | 'cup' | 'continental')[] = ['league', 'cup', 'league', 'continental', 'league', 'cup', 'league', 'continental'];

  for (let i = 0; i < 8; i++) {
    const opp = clubs[Math.floor(rng() * clubs.length)];
    if (!opp || opp.id === clubId) continue;
    const ovrDiff = opp.squadQuality - clubOvr;
    const difficulty: 'easy' | 'medium' | 'hard' = ovrDiff < -8 ? 'easy' : ovrDiff > 8 ? 'hard' : 'medium';
    fixtures.push({
      competition: competitions[i % competitions.length],
      opponent: opp.shortName || opp.name,
      difficulty,
      weekOffset: i + 1,
    });
  }

  return fixtures;
}

// ============================================================
// Helpers
// ============================================================

function getPositionGroup(pos: Position): string {
  switch (pos) {
    case 'GK': return 'GK';
    case 'CB': case 'LB': case 'RB': return 'DEF';
    case 'CDM': case 'CM': case 'CAM': case 'LM': case 'RM': return 'MID';
    case 'LW': case 'RW': case 'ST': case 'CF': return 'FWD';
    default: return 'MID';
  }
}

function getPositionColor(pos: Position): { bg: string; text: string; border: string } {
  const group = getPositionGroup(pos);
  switch (group) {
    case 'GK': return { bg: AMBER_BG, text: AMBER_TEXT, border: AMBER_BORDER };
    case 'DEF': return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'MID': return { bg: EMERALD_BG, text: EMERALD, border: EMERALD_BORDER };
    case 'FWD': return { bg: RED_BG, text: RED_TEXT, border: RED_BORDER };
    default: return { bg: EMERALD_BG, text: EMERALD, border: EMERALD_BORDER };
  }
}

function getFitnessColor(fitness: number): string {
  if (fitness >= 80) return 'bg-emerald-500';
  if (fitness >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy': return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    case 'medium': return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    case 'hard': return 'bg-red-500/15 border-red-500/30 text-red-400';
  }
}

function getFormDotColor(result: 'W' | 'D' | 'L'): string {
  switch (result) {
    case 'W': return 'bg-emerald-500';
    case 'D': return 'bg-amber-500';
    case 'L': return 'bg-red-500';
  }
}

// Deterministic form dots from player seed
function getFormDots(seed: number): ('W' | 'D' | 'L')[] {
  const rng = createSeededRandom(seed);
  const results: ('W' | 'D' | 'L')[] = [];
  for (let i = 0; i < 3; i++) {
    const r = rng();
    results.push(r < 0.45 ? 'W' : r < 0.75 ? 'D' : 'L');
  }
  return results;
}

// ============================================================
// Sub-components
// ============================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY} mb-3`}>
      {children}
    </h3>
  );
}

function InfoCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// Player Detail Modal
// ============================================================

function PlayerDetailModal({
  player,
  formDots,
  onClose,
}: {
  player: SquadPlayer;
  formDots: ('W' | 'D' | 'L')[];
  onClose: () => void;
}) {
  const posColor = getPositionColor(player.position);
  const fitnessColor = player.fitness >= 80 ? EMERALD : player.fitness >= 60 ? AMBER_TEXT : RED_TEXT;
  const fitnessBg = player.fitness >= 80 ? EMERALD_BG : player.fitness >= 60 ? AMBER_BG : RED_BG;

  const recommendedAction = player.fitness >= 75
    ? { label: 'Start', color: EMERALD, bg: EMERALD_BG, border: EMERALD_BORDER }
    : player.fitness >= 55
      ? { label: 'Substitute', color: AMBER_TEXT, bg: AMBER_BG, border: AMBER_BORDER }
      : { label: 'Rest', color: RED_TEXT, bg: RED_BG, border: RED_BORDER };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative w-full max-w-lg mx-4 mb-20 rounded-lg border p-4 space-y-4"
          style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#21262d] transition-colors"
            style={{ color: '#8b949e' }}
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-lg border ${posColor.border}`}
              style={{ width: 44, height: 44, backgroundColor: 'rgba(16,185,129,0.1)' }}
            >
              <span className={`text-sm font-bold ${posColor.text}`}>{player.position}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{player.name}</span>
                {player.isUser && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER} shrink-0`}>
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${TEXT_SECONDARY}`}>{player.position}</span>
                <span className="text-xs font-bold text-white">OVR {player.ovr}</span>
              </div>
            </div>
          </div>

          {/* Fitness bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${TEXT_PRIMARY}`}>Fitness</span>
              <span className={`text-xs font-bold tabular-nums ${fitnessColor}`}>{player.fitness}%</span>
            </div>
            <div className="h-2.5 w-full bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                className={`h-full rounded-lg ${getFitnessColor(player.fitness)}`}
                initial={{ width: 0 }}
                animate={{ width: `${player.fitness}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Form: last 3 matches */}
          <div className="space-y-2">
            <span className={`text-xs font-medium ${TEXT_PRIMARY}`}>Last 3 Matches</span>
            <div className="flex items-center gap-2">
              {formDots.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-center rounded-lg ${getFormDotColor(result)} bg-opacity-20 border`}
                  style={{ width: 32, height: 32 }}
                >
                  <span className="text-[10px] font-bold text-white">{result}</span>
                </div>
              ))}
              <span className={`text-xs ${TEXT_SECONDARY} ml-2`}>Form: {player.form}/10</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2.5 rounded-lg bg-[#0d1117]">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Games</div>
              <div className="text-base font-bold text-white">{player.consecutiveGames}</div>
              <div className={`text-[9px] ${TEXT_SECONDARY}`}>in a row</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-[#0d1117]">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Injuries</div>
              <div className="text-base font-bold text-white">{player.injuryHistoryCount}</div>
              <div className={`text-[9px] ${TEXT_SECONDARY}`}>career</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-[#0d1117]">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Status</div>
              <div className={`text-sm font-bold ${player.isStarter ? EMERALD : AMBER_TEXT}`}>
                {player.isStarter ? 'Starter' : 'Rotation'}
              </div>
            </div>
          </div>

          {/* Recommended action */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${recommendedAction.border}`}>
            <div className="flex items-center gap-2">
              <Lightbulb className={`size-4 ${recommendedAction.color}`} />
              <div>
                <div className={`text-[10px] ${TEXT_SECONDARY}`}>Recommended</div>
                <div className={`text-xs font-semibold ${recommendedAction.color}`}>
                  {recommendedAction.label}
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-1 rounded-lg border ${recommendedAction.color} ${recommendedAction.bg} ${recommendedAction.border}`}>
              {player.fitness >= 75 ? 'Fit' : player.fitness >= 55 ? 'Caution' : 'At Risk'}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SquadRotationPlanner() {
  const gameState = useGameStore((s) => s.gameState);

  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Generate squad data deterministically
  const squad = useMemo(() => {
    if (!gameState) return [];
    return generateSquad(
      gameState.currentClub.name,
      gameState.player.name,
      gameState.player.position,
      gameState.player.overall,
      gameState.currentSeason,
      gameState.currentWeek,
    );
  }, [gameState]);

  // Sorted by fitness (lowest first)
  const sortedByFitness = useMemo(() => {
    return [...squad].sort((a, b) => a.fitness - b.fitness);
  }, [squad]);

  const starters = useMemo(() => sortedByFitness.filter((p) => p.isStarter), [sortedByFitness]);
  const rotationPlayers = useMemo(() => sortedByFitness.filter((p) => !p.isStarter), [sortedByFitness]);

  // At-risk players
  const atRiskPlayers = useMemo(() => squad.filter((p) => p.fitness < 60), [squad]);

  // Rotation suggestions
  const suggestions = useMemo(() => generateSuggestions(squad), [squad]);

  // Next match info
  const nextMatch = useMemo(() => {
    if (!gameState) return null;
    const fixture = gameState.upcomingFixtures.find(
      (f) =>
        !f.played &&
        (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id) &&
        f.competition === 'league',
    );
    if (!fixture) return null;
    const isHome = fixture.homeClubId === gameState.currentClub.id;
    const oppId = isHome ? fixture.awayClubId : fixture.homeClubId;
    const oppClub = getClubById(oppId);
    return {
      opponent: oppClub?.shortName || oppClub?.name || 'TBD',
      competition: fixture.competition,
      home: isHome,
    };
  }, [gameState]);

  // Upcoming fixtures
  const upcomingFixtures = useMemo(() => {
    if (!gameState) return [];
    return generateUpcomingFixtures(
      gameState.currentClub.id,
      gameState.currentClub.league,
      gameState.currentSeason,
      gameState.currentWeek,
      gameState.currentClub.squadQuality,
    );
  }, [gameState]);

  const handleApplySuggestion = useCallback((sugId: string) => {
    setAppliedSuggestions((prev) => new Set(prev).add(sugId));
  }, []);

  // Form dots cache
  const formDotsMap = useMemo(() => {
    const map = new Map<string, ('W' | 'D' | 'L')[]>();
    squad.forEach((p) => {
      map.set(p.id, getFormDots(hashString(p.id + p.name)));
    });
    return map;
  }, [squad]);

  // No game state fallback
  if (!gameState) {
    return (
      <div className={DARK_BG}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-8 text-center`}>
            <RotateCcw className="size-10 mx-auto mb-3 text-[#8b949e] opacity-40" />
            <h2 className="text-lg font-semibold text-white mb-2">No Career Data</h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              Start a career to view the squad rotation planner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={DARK_BG}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <RotateCcw className="size-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">Squad Rotation</h1>
          {nextMatch && (
            <div className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg ${EMERALD_BG} border ${EMERALD_BORDER}`}>
              <span className="text-[9px] font-bold text-emerald-400">
                {nextMatch.home ? 'vs' : '@'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400">{nextMatch.opponent}</span>
              <span className="text-[9px] text-emerald-400/60">
                {nextMatch.competition === 'league' ? '🏟️' : '🏆'}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ============================================ */}
          {/* 1. Squad Fitness Overview (SVG Chart)        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Squad Fitness</SectionTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${RED_BG} text-red-400`}>
                    &lt;60%
                  </span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${AMBER_BG} text-amber-400`}>
                    60-80%
                  </span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${EMERALD_BG} text-emerald-400`}>
                    &gt;80%
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <svg viewBox="0 0 400 480" className="w-full min-w-[320px]" style={{ maxHeight: 480 }}>
                  {/* 70% threshold dashed line */}
                  <line
                    x1="95"
                    y1="8"
                    x2="95"
                    y2="472"
                    stroke="rgba(245,158,11,0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                  <text x="95" y="6" textAnchor="middle" fill="rgba(245,158,11,0.6)" fontSize="8" fontWeight="600">
                    70%
                  </text>

                  {sortedByFitness.map((player, idx) => {
                    const barWidth = (player.fitness / 100) * 260;
                    const yPos = idx * 23 + 16;
                    const barColor = player.fitness >= 80 ? '#10b981' : player.fitness >= 60 ? '#f59e0b' : '#ef4444';

                    return (
                      <g key={player.id} onClick={() => setSelectedPlayer(player)} style={{ cursor: 'pointer' }}>
                        {/* Name */}
                        <text
                          x="2"
                          y={yPos + 4}
                          fill={player.isUser ? '#34d399' : '#c9d1d9'}
                          fontSize="9"
                          fontWeight={player.isUser ? 700 : 400}
                          className="select-none"
                        >
                          {player.name.length > 14 ? player.name.slice(0, 13) + '..' : player.name}
                        </text>

                        {/* Position badge */}
                        <rect x="85" y={yPos - 7} width="22" height="12" rx="3" fill="rgba(255,255,255,0.06)" />
                        <text x="96" y={yPos + 3} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
                          {player.position}
                        </text>

                        {/* Fitness bar */}
                        <rect x="112" y={yPos - 6} width="260" height="10" rx="3" fill="#21262d" />
                        <rect x="112" y={yPos - 6} width={barWidth} height="10" rx="3" fill={barColor} />

                        {/* Fitness % */}
                        <text x="378" y={yPos + 3} textAnchor="end" fill={player.fitness >= 80 ? '#34d399' : player.fitness >= 60 ? '#f59e0b' : '#f87171'} fontSize="9" fontWeight="700">
                          {player.fitness}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 2. Starting XI vs Rotation Candidates        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <div className="grid grid-cols-2 gap-3">
              {/* Starting XI */}
              <InfoCard className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
                    Starting XI
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto overscroll-contain">
                  {starters.map((player) => {
                    const posColor = getPositionColor(player.position);
                    const dots = formDotsMap.get(player.id) || ['W', 'D', 'L'];
                    return (
                      <motion.div
                        key={player.id}
                        variants={staggerChild}
                        onClick={() => setSelectedPlayer(player)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                          player.isUser
                            ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                            : 'bg-[#0d1117]/60 border-transparent hover:bg-[#21262d] hover:border-[#30363d]'
                        }`}
                      >
                        {/* Position badge */}
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${posColor.bg} ${posColor.text} ${posColor.border}`}
                        >
                          {player.position}
                        </span>
                        {/* Name + fitness */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-semibold truncate ${player.isUser ? 'text-emerald-300' : 'text-white'}`}>
                            {player.name.split(' ').pop()}
                          </div>
                          <div className="h-1 w-full bg-[#21262d] rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full ${getFitnessColor(player.fitness)}`}
                              style={{ width: `${player.fitness}%` }}
                            />
                          </div>
                        </div>
                        {/* Form dots */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {dots.map((d, di) => (
                            <span key={di} className={`w-1.5 h-1.5 rounded-sm ${getFormDotColor(d)}`} />
                          ))}
                        </div>
                        {/* Green check */}
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              </InfoCard>

              {/* Rotation Options */}
              <InfoCard className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowRightLeft className="size-3.5 text-amber-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
                    Rotation Options
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto overscroll-contain">
                  {rotationPlayers.map((player) => {
                    const posColor = getPositionColor(player.position);
                    const dots = formDotsMap.get(player.id) || ['W', 'D', 'L'];
                    return (
                      <motion.div
                        key={player.id}
                        variants={staggerChild}
                        onClick={() => setSelectedPlayer(player)}
                        className="flex items-center gap-1.5 p-2 rounded-lg border border-transparent bg-[#0d1117]/40 hover:bg-[#21262d] hover:border-[#30363d] transition-colors cursor-pointer"
                      >
                        {/* Position badge */}
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${posColor.bg} ${posColor.text} ${posColor.border}`}
                        >
                          {player.position}
                        </span>
                        {/* Name + fitness */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-semibold truncate ${TEXT_PRIMARY}`}>
                            {player.name.split(' ').pop()}
                          </div>
                          <div className="h-1 w-full bg-[#21262d] rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full ${getFitnessColor(player.fitness)}`}
                              style={{ width: `${player.fitness}%` }}
                            />
                          </div>
                        </div>
                        {/* Form dots */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {dots.map((d, di) => (
                            <span key={di} className={`w-1.5 h-1.5 rounded-sm ${getFormDotColor(d)}`} />
                          ))}
                        </div>
                        {/* Amber swap icon */}
                        <ArrowRightLeft className="size-3 text-amber-500/60 shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              </InfoCard>
            </div>
          </motion.div>

          {/* ============================================ */}
          {/* 3. Fatigue Risk Alerts                        */}
          {/* ============================================ */}
          {atRiskPlayers.length > 0 && (
            <motion.div variants={staggerChild}>
              <InfoCard className={`${RED_BORDER} border`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="size-4 text-red-400" />
                  <SectionTitle>Fatigue Risk Alerts</SectionTitle>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RED_BG} ${RED_TEXT} border ${RED_BORDER} ml-auto`}>
                    {atRiskPlayers.length} at risk
                  </span>
                </div>

                <div className={`text-xs ${RED_TEXT} mb-3 font-medium`}>
                  {atRiskPlayers.length === 1
                    ? '1 player is at risk of injury'
                    : `${atRiskPlayers.length} players are at risk of injury`}
                </div>

                <div className="space-y-2">
                  {atRiskPlayers.slice(0, 4).map((player) => {
                    const posColor = getPositionColor(player.position);
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${RED_BORDER} ${RED_BG}`}
                      >
                        <div className={`flex items-center justify-center rounded-lg border ${posColor.border}`} style={{ width: 36, height: 36, backgroundColor: 'rgba(239,68,68,0.08)' }}>
                          <span className={`text-[10px] font-bold ${posColor.text}`}>{player.position}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">{player.name}</span>
                            <span className={`text-[10px] font-bold ${RED_TEXT}`}>{player.fitness}%</span>
                          </div>
                          <div className={`text-[10px] ${TEXT_SECONDARY} mt-0.5`}>
                            Consider resting — {player.consecutiveGames} consecutive games, {player.injuryHistoryCount} career injuries
                          </div>
                        </div>
                        <ChevronRight className="size-3 text-[#484f58] shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </InfoCard>
            </motion.div>
          )}

          {/* ============================================ */}
          {/* 4. Weekly Schedule Mini-Timeline               */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="size-3.5 text-emerald-400" />
                <SectionTitle>Upcoming Fixtures</SectionTitle>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {upcomingFixtures.map((fixture, idx) => {
                  const comp = COMPETITION_ICONS[fixture.competition] || COMPETITION_ICONS.league;
                  const diffColor = getDifficultyColor(fixture.difficulty);
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border ${diffColor} min-w-[72px]`}
                    >
                      <span className="text-sm">{comp.icon}</span>
                      <span className={`text-[9px] font-medium ${TEXT_SECONDARY}`}>{comp.label}</span>
                      <span className="text-[10px] font-bold text-white text-center leading-tight">
                        {fixture.opponent}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider`}>
                        {fixture.difficulty}
                      </span>
                      <span className={`text-[8px] ${TEXT_SECONDARY}`}>W{gameState.currentWeek + fixture.weekOffset}</span>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 5. Rotation Suggestions                       */}
          {/* ============================================ */}
          {suggestions.length > 0 && (
            <motion.div variants={staggerChild}>
              <InfoCard className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-3.5 text-emerald-400" />
                  <SectionTitle>Rotation Suggestions</SectionTitle>
                </div>

                {suggestions.map((suggestion) => {
                  const isApplied = appliedSuggestions.has(suggestion.id);
                  return (
                    <motion.div
                      key={suggestion.id}
                      variants={staggerChild}
                      className={`p-3 rounded-lg border space-y-2.5 ${
                        isApplied
                          ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                          : 'bg-[#0d1117]/60 border-[#30363d]'
                      }`}
                    >
                      {/* Swap line */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <TrendingDown className="size-3 text-red-400 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">{suggestion.restPlayer.name}</span>
                          <span className={`text-[9px] font-bold ${suggestion.restPlayer.fitness < 60 ? RED_TEXT : AMBER_TEXT}`}>
                            {suggestion.restPlayer.fitness}%
                          </span>
                        </div>
                        <ArrowRightLeft className="size-3 text-amber-400 shrink-0" />
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className={`text-[9px] font-bold ${suggestion.bringInPlayer.fitness >= 80 ? EMERALD : AMBER_TEXT}`}>
                            {suggestion.bringInPlayer.fitness}%
                          </span>
                          <span className="text-xs font-semibold text-white truncate">{suggestion.bringInPlayer.name}</span>
                          <Shield className="size-3 text-emerald-400 shrink-0" />
                        </div>
                      </div>

                      {/* Reasoning */}
                      <p className={`text-[10px] ${TEXT_SECONDARY} leading-relaxed`}>
                        {suggestion.reason}
                      </p>

                      {/* Apply button */}
                      {!isApplied && (
                        <button
                          onClick={() => handleApplySuggestion(suggestion.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${EMERALD_BG} ${EMERALD} ${EMERALD_BORDER} hover:bg-emerald-500/25`}
                        >
                          <CheckCircle2 className="size-3" />
                          Apply Rotation
                        </button>
                      )}
                      {isApplied && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`}>
                          <CheckCircle2 className="size-3" />
                          Rotation Applied
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </InfoCard>
            </motion.div>
          )}

          {/* ============================================ */}
          {/* 6. Squad Summary Stats                         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Squad Summary</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2.5 rounded-lg bg-[#21262d]">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Avg Fitness</div>
                  <div className={`text-lg font-bold ${squad.length > 0 ? (Math.round(squad.reduce((s, p) => s + p.fitness, 0) / squad.length) >= 75 ? EMERALD : AMBER_TEXT) : TEXT_SECONDARY}`}>
                    {squad.length > 0 ? Math.round(squad.reduce((s, p) => s + p.fitness, 0) / squad.length) : 0}%
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-[#21262d]">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Avg Form</div>
                  <div className={`text-lg font-bold ${squad.length > 0 ? (Math.round(squad.reduce((s, p) => s + p.form, 0) / squad.length) >= 7 ? EMERALD : TEXT_PRIMARY) : TEXT_SECONDARY}`}>
                    {squad.length > 0 ? (squad.reduce((s, p) => s + p.form, 0) / squad.length).toFixed(1) : '0.0'}
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-[#21262d]">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>At Risk</div>
                  <div className={`text-lg font-bold ${atRiskPlayers.length > 0 ? RED_TEXT : EMERALD}`}>
                    {atRiskPlayers.length}
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          formDots={formDotsMap.get(selectedPlayer.id) || ['W', 'D', 'L']}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
