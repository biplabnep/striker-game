'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  ArrowRight,
  Plus,
  Check,
  Clock,
  Activity,
  Zap,
  Shield,
  Swords,
  BarChart3,
  ChevronLeft,
  Users,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Position } from '@/lib/game/types';
import { getClubsByLeague } from '@/lib/game/clubsData';

// ============================================================
// Design tokens (Uncodixify compliant — no transforms, no gradients)
// ============================================================

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
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
// Seeded random for deterministic match simulation
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
// Animation variants (opacity-only per Uncodixify)
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

const livePulse = {
  animate: {
    opacity: [1, 0.3, 1],
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' as const },
  },
};

// ============================================================
// Types & Constants
// ============================================================

type FormationKey = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '4-5-1';

const ALL_FORMATIONS: FormationKey[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1'];

interface FormationSlot {
  pos: Position;
  x: number;
  y: number;
}

const FORMATION_SLOTS: Record<FormationKey, FormationSlot[]> = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'CM', x: 30, y: 52 }, { pos: 'CM', x: 50, y: 48 },
    { pos: 'CM', x: 70, y: 52 },
    { pos: 'LW', x: 18, y: 25 }, { pos: 'ST', x: 50, y: 18 },
    { pos: 'RW', x: 82, y: 25 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'LM', x: 15, y: 48 }, { pos: 'CM', x: 38, y: 50 },
    { pos: 'CM', x: 62, y: 50 }, { pos: 'RM', x: 85, y: 48 },
    { pos: 'ST', x: 38, y: 20 }, { pos: 'ST', x: 62, y: 20 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'CDM', x: 38, y: 58 }, { pos: 'CDM', x: 62, y: 58 },
    { pos: 'LW', x: 20, y: 38 }, { pos: 'CAM', x: 50, y: 40 },
    { pos: 'RW', x: 80, y: 38 },
    { pos: 'ST', x: 50, y: 18 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'CB', x: 25, y: 75 }, { pos: 'CB', x: 50, y: 77 },
    { pos: 'CB', x: 75, y: 75 },
    { pos: 'LM', x: 10, y: 50 }, { pos: 'CM', x: 32, y: 52 },
    { pos: 'CDM', x: 50, y: 55 }, { pos: 'CM', x: 68, y: 52 },
    { pos: 'RM', x: 90, y: 50 },
    { pos: 'ST', x: 38, y: 20 }, { pos: 'ST', x: 62, y: 20 },
  ],
  '4-5-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 }, { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 }, { pos: 'RB', x: 85, y: 72 },
    { pos: 'LM', x: 12, y: 45 }, { pos: 'CM', x: 32, y: 50 },
    { pos: 'CAM', x: 50, y: 42 }, { pos: 'CM', x: 68, y: 50 },
    { pos: 'RM', x: 88, y: 45 },
    { pos: 'ST', x: 50, y: 18 },
  ],
};

type TacticKey = 'attack_more' | 'defend_deeper' | 'counter_attack' | 'keep_possession';

interface TacticOption {
  key: TacticKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TACTICS: TacticOption[] = [
  { key: 'attack_more', label: 'Attack More', description: 'Push forward aggressively', icon: <Zap className="size-4" /> },
  { key: 'defend_deeper', label: 'Defend Deeper', description: 'Solidify the back line', icon: <Shield className="size-4" /> },
  { key: 'counter_attack', label: 'Counter Attack', description: 'Quick transitions on turnover', icon: <Swords className="size-4" /> },
  { key: 'keep_possession', label: 'Keep Possession', description: 'Control tempo with the ball', icon: <Activity className="size-4" /> },
];

const FIRST_NAMES = [
  'Marcus', 'James', 'Oliver', 'Carlos', 'Luis', 'Serge', 'Antonio',
  'Thiago', 'Mohamed', 'Kevin', 'Virgil', 'Bruno', 'Paul', 'Raheem',
  'Jadon', 'Phil', 'Bukayo', 'Declan', 'Jude', 'Florian', 'Gabriel',
  'Rafael', 'Pierre', 'Ousmane', 'Robert', 'Achraf', 'Federico',
  'Martin', 'Trent', 'Reece', 'Ben', 'John', 'Kyle', 'Kieran',
];

const LAST_NAMES = [
  'Rashford', 'Walker', 'Smith', 'Silva', 'Diaz', 'Gnabry', 'Rudiger',
  'Henderson', 'Salah', 'De Bruyne', 'Van Dijk', 'Fernandes', 'Pogba',
  'Sterling', 'Sancho', 'Foden', 'Saka', 'Rice', 'Bellingham', 'Wirtz',
  'Jesus', 'Leao', 'Emery', 'Dembele', 'Lewandowski', 'Hakimi', 'Chiesa',
  'Martinez', 'Neuer', 'Navas', 'Lloris', 'Laporte', 'Dias', 'Konate',
];

const FLAGS = ['🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇪🇸', '🇫🇷', '🇩🇪', '🇧🇷', '🇵🇹', '🇳🇱', '🇦🇷', '🇮🇹', '🇧🇪'];

// ============================================================
// Match State & Player Generation
// ============================================================

interface SimPlayer {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  fitness: number;
  minutesPlayed: number;
  status: 'active' | 'subbed_off' | 'injured';
}

interface SubSlot {
  id: number;
  playerOut: SimPlayer | null;
  playerIn: SimPlayer | null;
  completed: boolean;
}

interface SimMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  competition: string;
  isHome: boolean;
  possession: number;
  shots: number;
  opponentShots: number;
  keyEvents: string[];
}

function generateMatchState(
  clubId: string,
  clubName: string,
  season: number,
  week: number,
  playerOvr: number,
): SimMatch {
  const rng = createSeededRandom(hashString(`${clubId}-${season}-${week}`));

  // Pick a random opponent from the same league
  const leagueClubs = getClubsByLeague(
    clubId === 'arsenal' ? 'premier_league' : 'premier_league'
  ).filter(c => c.id !== clubId);
  const opponent = leagueClubs.length > 0
    ? leagueClubs[Math.floor(rng() * leagueClubs.length)]
    : null;

  const opponentRep = opponent?.reputation ?? 70;
  const opponentName = opponent?.name ?? 'Unknown FC';

  const isHome = rng() > 0.5;
  const homeTeam = isHome ? clubName : opponentName;
  const awayTeam = isHome ? opponentName : clubName;

  const homeStr = isHome ? playerOvr + 3 : opponentRep;
  const awayStr = isHome ? opponentRep : playerOvr + 3;

  const homeGoals = Math.floor(rng() * 3) + (homeStr > awayStr ? 1 : 0);
  const awayGoals = Math.floor(rng() * 2) + (awayStr > homeStr ? 1 : 0);

  const minute = Math.floor(rng() * 35) + 45; // 45-79'

  const competitions = ['Premier League', 'Champions League', 'FA Cup'];
  const competition = week % 10 === 0
    ? 'FA Cup'
    : competitions[Math.floor(rng() * 2)];

  const events: string[] = [];
  if (homeGoals > 0) events.push(`${homeGoals} goal${homeGoals > 1 ? 's' : ''} scored`);
  if (awayGoals > 0) events.push(`${awayGoals} goal${awayGoals > 1 ? 's' : ''} conceded`);

  return {
    homeTeam,
    awayTeam,
    homeScore: homeGoals,
    awayScore: awayGoals,
    minute,
    competition,
    isHome,
    possession: Math.round(45 + rng() * 15),
    shots: Math.floor(rng() * 8) + 3,
    opponentShots: Math.floor(rng() * 6) + 2,
    keyEvents: events,
  };
}

function generateSquad(
  clubId: string,
  userName: string,
  userPosition: Position,
  userOvr: number,
  formation: FormationKey,
): { starters: SimPlayer[]; bench: SimPlayer[] } {
  const rng = createSeededRandom(hashString(clubId + userName + 'subs'));

  const slots = FORMATION_SLOTS[formation];
  const starters: SimPlayer[] = [];
  const usedIds = new Set<string>();

  // Place user player in the best matching slot
  let userSlotIdx = 0;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].pos === userPosition) { userSlotIdx = i; break; }
  }

  for (let i = 0; i < 11; i++) {
    if (i === userSlotIdx) {
      starters.push({
        id: 'user',
        name: userName,
        position: userPosition,
        ovr: userOvr,
        fitness: 78 + Math.floor(rng() * 15),
        minutesPlayed: 67 + Math.floor(rng() * 13),
        status: 'active',
      });
      usedIds.add('user');
      continue;
    }

    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const id = `s${i}-${firstName}`;

    starters.push({
      id,
      name: `${firstName} ${lastName}`,
      position: slots[i].pos,
      ovr: Math.max(58, Math.min(92, userOvr + Math.floor((rng() - 0.5) * 18))),
      fitness: 65 + Math.floor(rng() * 30),
      minutesPlayed: 67 + Math.floor(rng() * 13),
      status: 'active',
    });
    usedIds.add(id);
  }

  // One player might be subbed off
  const subbedIdx = Math.floor(rng() * 11);
  if (subbedIdx !== userSlotIdx) {
    starters[subbedIdx].status = 'subbed_off';
    starters[subbedIdx].minutesPlayed = 45 + Math.floor(rng() * 20);
  }

  // One player might be injured
  const injuredIdx = Math.floor(rng() * 11);
  if (injuredIdx !== userSlotIdx && injuredIdx !== subbedIdx) {
    starters[injuredIdx].status = 'injured';
    starters[injuredIdx].minutesPlayed = 20 + Math.floor(rng() * 30);
  }

  // Generate 7 bench players
  const benchPositions: Position[] = ['GK', 'CB', 'CM', 'ST', 'LW', 'RB', 'CDM'];
  const bench: SimPlayer[] = [];
  for (let i = 0; i < 7; i++) {
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    bench.push({
      id: `b${i}-${firstName}`,
      name: `${firstName} ${lastName}`,
      position: benchPositions[i % benchPositions.length],
      ovr: Math.max(52, userOvr + Math.floor((rng() - 0.5) * 22) - 2),
      fitness: 80 + Math.floor(rng() * 18),
      minutesPlayed: 0,
      status: 'active',
    });
  }

  return { starters, bench };
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

function StatusIndicator({ status }: { status: SimPlayer['status'] }) {
  if (status === 'active') return <span className="text-emerald-400 text-xs">✅</span>;
  if (status === 'subbed_off') return <span className="text-blue-400 text-xs">🔵</span>;
  return <span className="text-red-400 text-xs">🔴</span>;
}

function PlayerStatusBadge({ status }: { status: SimPlayer['status'] }) {
  if (status === 'active') return null;
  const config = {
    subbed_off: { label: 'SUBBED', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    injured: { label: 'INJURED', bg: RED_BG, text: RED_TEXT, border: RED_BORDER },
  };
  const c = config[status];
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>
      {c.label}
    </span>
  );
}

function StatBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] ${TEXT_SECONDARY}`}>{label}</span>
        <span className={`text-[10px] font-semibold ${color}`}>{value}</span>
      </div>
      <div className="w-full h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
        <motion.div
          className={`h-full rounded-sm ${color === EMERALD ? 'bg-emerald-500' : color === RED_TEXT ? 'bg-red-500' : 'bg-amber-500'}`}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: `${pct}%`, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TacticalSubstitutions() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [activeTactic, setActiveTactic] = useState<TacticKey>('keep_possession');
  const [subSlots, setSubSlots] = useState<SubSlot[]>([
    { id: 0, playerOut: null, playerIn: null, completed: false },
    { id: 1, playerOut: null, playerIn: null, completed: false },
    { id: 2, playerOut: null, playerIn: null, completed: false },
  ]);
  const [selectingSubSlot, setSelectingSubSlot] = useState<number | null>(null);

  // Generate deterministic match data
  const matchData = useMemo(() => {
    if (!gameState) return null;
    return generateMatchState(
      gameState.currentClub.id,
      gameState.currentClub.name,
      gameState.currentSeason,
      gameState.currentWeek,
      gameState.player.overall,
    );
  }, [gameState]);

  // Generate deterministic squad data
  const squadData = useMemo(() => {
    if (!gameState) return null;
    return generateSquad(
      gameState.currentClub.id,
      gameState.player.name,
      gameState.player.position,
      gameState.player.overall,
      formation,
    );
  }, [gameState, formation]);

  const completedSubs = subSlots.filter(s => s.completed).length;

  const handleSelectPlayerOut = useCallback((slotIdx: number) => {
    if (subSlots[slotIdx].completed) return;
    setSelectingSubSlot(slotIdx);
  }, [subSlots]);

  const handleConfirmSubOut = useCallback((player: SimPlayer, slotIdx: number) => {
    setSubSlots(prev => prev.map((s, i) =>
      i === slotIdx ? { ...s, playerOut: player } : s
    ));
    setSelectingSubSlot(null);
  }, []);

  const handleConfirmSubIn = useCallback((benchPlayer: SimPlayer, slotIdx: number) => {
    setSubSlots(prev => prev.map((s, i) =>
      i === slotIdx
        ? { ...s, playerIn: benchPlayer, completed: true }
        : s
    ));
  }, []);

  const handleUndoSub = useCallback((slotIdx: number) => {
    setSubSlots(prev => prev.map((s, i) =>
      i === slotIdx ? { id: s.id, playerOut: null, playerIn: null, completed: false } : s
    ));
  }, []);

  // No game state fallback
  if (!gameState || !matchData || !squadData) {
    return (
      <div className={`${DARK_BG} min-h-screen`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-8 text-center`}>
            <ArrowRightLeft className="size-10 mx-auto mb-3 text-[#8b949e] opacity-40" />
            <h2 className="text-lg font-semibold text-white mb-2">No Match Active</h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              Start a career to access tactical substitutions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const slots = FORMATION_SLOTS[formation];
  const isWinning = matchData.isHome
    ? matchData.homeScore > matchData.awayScore
    : matchData.awayScore > matchData.homeScore;
  const isLosing = matchData.isHome
    ? matchData.homeScore < matchData.awayScore
    : matchData.awayScore < matchData.homeScore;

  return (
    <div className={`${DARK_BG} min-h-screen`}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        {/* ============================================ */}
        {/* Page Header                                  */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <button
            onClick={() => setScreen('match_day')}
            className="p-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <ArrowRightLeft className="size-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">Tactical Substitutions</h1>
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ============================================ */}
          {/* 1. Match Context Header                       */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              {/* Score & LIVE indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-400" />
                  <span className={`text-[10px] font-semibold uppercase ${TEXT_SECONDARY}`}>
                    {matchData.competition}
                  </span>
                </div>
                <motion.div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/30"
                  variants={livePulse}
                  animate="animate"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
                </motion.div>
              </div>

              {/* Score display */}
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{matchData.homeTeam}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black tabular-nums ${isWinning ? EMERALD : isLosing ? RED_TEXT : 'text-white'}`}>
                      {matchData.homeScore}
                    </span>
                    <span className={`text-lg font-light text-[#484f58]`}>-</span>
                    <span className={`text-2xl font-black tabular-nums ${isWinning ? EMERALD : isLosing ? RED_TEXT : 'text-white'}`}>
                      {matchData.awayScore}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">{matchData.awayTeam}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Clock className="size-3 text-[#8b949e]" />
                  <span className={`text-xs font-semibold ${TEXT_SECONDARY}`}>
                    {matchData.minute}&apos;
                  </span>
                  <span className={`text-[10px] ${TEXT_SECONDARY}`}>
                    &middot; {isWinning ? 'Winning' : isLosing ? 'Losing' : 'Drawing'}
                  </span>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 2. Starting XI Formation Grid                 */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-emerald-400" />
              <SectionTitle>Starting XI</SectionTitle>
            </div>
            <InfoCard className="p-2">
              <div className="relative w-full aspect-[3/4] max-w-sm mx-auto bg-[#1a5c2a] rounded-lg border border-[#2a7a3a] overflow-hidden">
                {/* Pitch markings */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
                  <rect x="8" y="8" width="284" height="384" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <line x1="8" y1="200" x2="292" y2="200" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="150" cy="200" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.3)" />
                  <rect x="60" y="8" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <rect x="105" y="8" width="90" height="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <rect x="60" y="332" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <rect x="105" y="367" width="90" height="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                </svg>

                {/* Player nodes */}
                {squadData.starters.map((player, idx) => {
                  const slot = slots[idx];
                  const isUser = player.id === 'user';
                  return (
                    <div
                      key={player.id}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className={`flex flex-col items-center px-1.5 py-1 rounded-md border ${
                        isUser
                          ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                          : player.status === 'injured'
                            ? `${RED_BG} ${RED_BORDER} border`
                            : 'bg-[#0d1117]/80 border-[#30363d]/60'
                      }`}>
                        <span className={`text-[9px] font-bold leading-none ${
                          isUser ? 'text-emerald-300' : 'text-[#c9d1d9]'
                        }`}>
                          {player.ovr}
                        </span>
                        <span className={`text-[7px] font-semibold leading-none ${
                          isUser ? 'text-emerald-400' : 'text-[#8b949e]'
                        }`}>
                          {player.position}
                        </span>
                      </div>
                      <span className={`text-[8px] font-medium mt-0.5 truncate max-w-[48px] text-center leading-tight ${
                        isUser ? 'text-emerald-300' : 'text-[#8b949e]'
                      }`}>
                        {player.name.split(' ').pop()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 3. Starting XI Player List                    */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Players on Pitch</SectionTitle>
              <div className="space-y-1">
                {squadData.starters.map((player) => {
                  const isUser = player.id === 'user';
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isUser
                          ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                          : 'bg-[#0d1117]/40 border-transparent'
                      }`}
                    >
                      <StatusIndicator status={player.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${isUser ? 'text-emerald-300' : 'text-white'}`}>
                            {player.name}
                          </span>
                          <PlayerStatusBadge status={player.status} />
                          {isUser && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`}>
                              YOU
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] ${TEXT_SECONDARY}`}>
                          {player.position} &middot; OVR {player.ovr}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[10px] font-medium ${TEXT_SECONDARY}`}>
                          <Timer className="size-2.5 inline mr-0.5" />
                          {player.minutesPlayed}&apos;
                        </span>
                        <span className={`text-[9px] ${
                          player.fitness >= 80 ? EMERALD : player.fitness >= 60 ? 'text-amber-400' : RED_TEXT
                        }`}>
                          {player.fitness}% fit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 4. Substitutions Panel                        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>Substitutions</SectionTitle>
                <span className={`text-[10px] font-semibold ${TEXT_SECONDARY}`}>
                  {completedSubs}/3 used
                </span>
              </div>

              <div className="space-y-2">
                {subSlots.map((slot, idx) => (
                  <div key={slot.id}>
                    {slot.completed ? (
                      /* Completed substitution */
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="size-4 text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-red-400 line-through">
                              {slot.playerOut?.name}
                            </span>
                            <ArrowRight className="size-3 text-[#484f58]" />
                            <span className="text-xs font-semibold text-emerald-400">
                              {slot.playerIn?.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8b949e]">
                            {slot.playerOut?.position} → {slot.playerIn?.position} &middot; {matchData.minute}&apos;
                          </span>
                        </div>
                        <button
                          onClick={() => handleUndoSub(idx)}
                          className="text-[9px] px-2 py-1 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-white hover:border-[#484f58] transition-colors shrink-0"
                        >
                          Undo
                        </button>
                      </div>
                    ) : slot.playerOut && !slot.playerIn ? (
                      /* Player selected OUT, awaiting IN selection */
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <ArrowRightLeft className="size-4 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-amber-400">
                            OUT: {slot.playerOut.name}
                          </span>
                          <span className={`text-[10px] block ${TEXT_SECONDARY}`}>
                            Select a bench player to bring on
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                          Pick IN
                        </span>
                      </div>
                    ) : (
                      /* Empty slot */
                      <button
                        onClick={() => handleSelectPlayerOut(idx)}
                        disabled={completedSubs >= 3}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed transition-colors ${
                          completedSubs >= 3
                            ? 'border-[#21262d] text-[#30363d] cursor-not-allowed'
                            : 'border-[#30363d] text-[#8b949e] hover:border-emerald-500/40 hover:text-emerald-400'
                        }`}
                      >
                        <Plus className="size-4" />
                        <span className="text-xs font-semibold">Make Substitution {idx + 1}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Player OUT selection picker */}
              <AnimatePresence>
                {selectingSubSlot !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 pt-2 border-t border-[#30363d]"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="size-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">Select player to sub OFF</span>
                      <button
                        onClick={() => setSelectingSubSlot(null)}
                        className="ml-auto text-[10px] text-[#8b949e] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto overscroll-contain">
                      {squadData.starters
                        .filter(p => p.status === 'active' && p.id !== 'user')
                        .map((player) => (
                          <button
                            key={player.id}
                            onClick={() => handleConfirmSubOut(player, selectingSubSlot)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#0d1117]/60 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <span className={`text-[10px] ${TEXT_SECONDARY}`}>{player.position}</span>
                            <span className="text-xs font-semibold text-white flex-1 truncate">{player.name}</span>
                            <span className={`text-xs font-bold ${player.ovr >= 80 ? EMERALD : TEXT_SECONDARY}`}>{player.ovr}</span>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 5. Bench / Reserves                           */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Bench / Reserves</SectionTitle>
              <div className="space-y-1">
                {squadData.bench.map((benchPlayer, bIdx) => {
                  const needsInPlayer = subSlots.some(
                    s => s.playerOut && !s.playerIn && !s.completed
                  );
                  const awaitingSlot = subSlots.find(
                    s => s.playerOut && !s.playerIn && !s.completed
                  );

                  return (
                    <div
                      key={benchPlayer.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        awaitingSlot
                          ? 'bg-[#0d1117]/60 border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer'
                          : 'bg-[#0d1117]/40 border-transparent'
                      }`}
                      onClick={() => {
                        if (awaitingSlot) {
                          handleConfirmSubIn(benchPlayer, awaitingSlot.id);
                        }
                      }}
                    >
                      {/* SUB badge */}
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#21262d] text-[#484f58] border border-[#30363d] shrink-0">
                        SUB
                      </span>

                      {/* Name & position */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold text-[#c9d1d9] truncate block`}>
                          {benchPlayer.name}
                        </span>
                        <span className={`text-[10px] ${TEXT_SECONDARY}`}>
                          {benchPlayer.position}
                        </span>
                      </div>

                      {/* Fitness bar */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] ${
                          benchPlayer.fitness >= 80 ? EMERALD : benchPlayer.fitness >= 60 ? 'text-amber-400' : RED_TEXT
                        }`}>
                          {benchPlayer.fitness}%
                        </span>
                      </div>

                      {/* OVR */}
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${TEXT_SECONDARY}`}>
                        {benchPlayer.ovr}
                      </span>
                    </div>
                  );
                })}
              </div>
              {subSlots.some(s => s.playerOut && !s.playerIn && !s.completed) && (
                <p className={`text-[10px] text-emerald-400 mt-2 text-center`}>
                  Tap a bench player to bring them on
                </p>
              )}
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 6. Tactical Instructions                      */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <SectionTitle>Tactical Instructions</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {TACTICS.map((tactic) => {
                  const isActive = activeTactic === tactic.key;
                  return (
                    <button
                      key={tactic.key}
                      onClick={() => setActiveTactic(tactic.key)}
                      className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border transition-colors text-left ${
                        isActive
                          ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                          : 'bg-[#0d1117]/60 border-[#30363d] hover:border-[#484f58]'
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 ${isActive ? EMERALD : TEXT_SECONDARY}`}>
                        {tactic.icon}
                        <span className={`text-xs font-semibold ${isActive ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                          {tactic.label}
                        </span>
                      </div>
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>
                        {tactic.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 7. Formation Quick Switch                     */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-emerald-400" />
              <SectionTitle>Formation</SectionTitle>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {ALL_FORMATIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormation(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors whitespace-nowrap ${
                    formation === f
                      ? `${EMERALD_BG} ${EMERALD_BORDER} border ${EMERALD}`
                      : `bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58]`
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ============================================ */}
          {/* 8. Match Stats Mini Bar                       */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-400" />
                <SectionTitle>Match Stats</SectionTitle>
              </div>

              {/* Possession */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold ${matchData.possession >= 50 ? EMERALD : TEXT_SECONDARY}`}>
                    {matchData.possession}%
                  </span>
                  <span className={`text-[10px] font-medium ${TEXT_SECONDARY}`}>Possession</span>
                  <span className={`text-[10px] font-semibold ${100 - matchData.possession > matchData.possession ? EMERALD : TEXT_SECONDARY}`}>
                    {100 - matchData.possession}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden flex">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-l-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${matchData.possession}%` }}
                    transition={{ duration: 0.8 }}
                  />
                  <div className="flex-1 h-full bg-[#484f58]" />
                </div>
              </div>

              {/* Shots */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-semibold ${matchData.shots > matchData.opponentShots ? EMERALD : TEXT_SECONDARY}`}>
                    {matchData.shots}
                  </span>
                  <span className={`text-[10px] font-medium ${TEXT_SECONDARY}`}>Shots</span>
                  <span className={`text-[10px] font-semibold ${matchData.opponentShots > matchData.shots ? RED_TEXT : TEXT_SECONDARY}`}>
                    {matchData.opponentShots}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden flex">
                  <motion.div
                    className="h-full bg-blue-500 rounded-l-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (matchData.shots / (matchData.shots + matchData.opponentShots)) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                  <div className="flex-1 h-full bg-[#484f58]" />
                </div>
              </div>

              {/* Key Events */}
              <div className="pt-1 border-t border-[#30363d]">
                <span className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider block mb-2`}>
                  Key Events
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchData.keyEvents.map((evt, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-1 rounded-md ${
                        evt.includes('scored')
                          ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
                          : `${RED_BG} ${RED_TEXT} border ${RED_BORDER}`
                      }`}
                    >
                      {evt}
                    </span>
                  ))}
                  <span className={`text-[10px] px-2 py-1 rounded-md bg-[#21262d] text-[#8b949e] border border-[#30363d]`}>
                    {completedSubs} substitution{completedSubs !== 1 ? 's' : ''} made
                  </span>
                </div>
              </div>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
