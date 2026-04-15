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
// Web3 Color Constants
// ============================================================

const WEB3_ORANGE = '#FF5500';
const WEB3_LIME = '#CCFF00';
const WEB3_CYAN = '#00E5FF';
const WEB3_GRAY = '#666666';

// ============================================================
// SVG Helper Functions
// ============================================================

function buildRadarPoints(cx: number, cy: number, maxR: number, values: number[]): string {
  const count = values.length;
  const angleStep = (2 * Math.PI) / count;
  const offset = -Math.PI / 2;
  return values.reduce((pts: string[], v, i) => {
    const angle = offset + i * angleStep;
    const r = (v / 100) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return pts;
  }, []).join(' ');
}

function buildGridPolygon(cx: number, cy: number, maxR: number, sides: number): string {
  const angleStep = (2 * Math.PI) / sides;
  const offset = -Math.PI / 2;
  return Array.from({ length: sides }).reduce((pts: string[], _, i) => {
    const angle = offset + i * angleStep;
    const x = cx + maxR * Math.cos(angle);
    const y = cy + maxR * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return pts;
  }, []).join(' ');
}

function buildAreaPoints(data: number[], w: number, h: number, pad: number): string {
  const maxVal = Math.max(...data, 1);
  const stepX = (w - 2 * pad) / Math.max(data.length - 1, 1);
  const result: string[] = [`${pad},${h - pad}`];
  data.reduce((acc, v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / maxVal) * (h - 2 * pad);
    acc.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return acc;
  }, result);
  result.push(`${(pad + (data.length - 1) * stepX).toFixed(1)},${h - pad}`);
  return result.join(' ');
}

function buildLinePoints(data: number[], w: number, h: number, pad: number): string {
  const maxVal = Math.max(...data, 1);
  const stepX = (w - 2 * pad) / Math.max(data.length - 1, 1);
  return data.reduce((pts: string[], v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / maxVal) * (h - 2 * pad);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return pts;
  }, []).join(' ');
}

function buildArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s = toRad(startDeg - 90);
  const e = toRad(endDeg - 90);
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function buildGaugeArc(cx: number, cy: number, r: number, pct: number): string {
  const startDeg = 180;
  const endDeg = 180 + (pct / 100) * 180;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
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

  // Computed SVG visualization data (pure functions, no useMemo needed)
  const svgFitnessRadar = (() => {
    const starters = squadData.starters;
    const isGK = (p: string) => p === 'GK';
    const isDEF = (p: string) => ['CB', 'LB', 'RB'].includes(p);
    const isMID = (p: string) => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p);
    const isATT = (p: string) => ['ST', 'LW', 'RW'].includes(p);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
    return [
      avg(starters.filter(p => isGK(p.position)).map(p => p.fitness)),
      avg(starters.filter(p => isDEF(p.position)).map(p => p.fitness)),
      avg(starters.filter(p => isMID(p.position)).map(p => p.fitness)),
      avg(starters.filter(p => isATT(p.position)).map(p => p.fitness)),
      avg(starters.map(p => p.fitness)),
    ];
  })();

  const svgFitnessDonut = (() => {
    const counts = squadData.starters.reduce(
      (acc, p) => {
        if (p.fitness >= 80) acc.high++;
        else if (p.fitness >= 60) acc.med++;
        else acc.low++;
        return acc;
      },
      { high: 0, med: 0, low: 0 }
    );
    const total = counts.high + counts.med + counts.low;
    const items = [
      { count: counts.high, color: WEB3_CYAN, label: 'High' },
      { count: counts.med, color: WEB3_LIME, label: 'Med' },
      { count: counts.low, color: WEB3_ORANGE, label: 'Low' },
    ];
    const segments: { start: number; end: number; color: string; label: string; count: number }[] = [];
    let angle = 0;
    items.forEach(item => {
      if (item.count > 0) {
        const sweep = (item.count / total) * 360;
        segments.push({ start: angle, end: angle + sweep, color: item.color, label: item.label, count: item.count });
        angle += sweep;
      }
    });
    return { segments, total };
  })();

  const svgBenchStrength = (() => {
    const startersAvg = squadData.starters.reduce((s, p) => s + p.ovr, 0) / squadData.starters.length;
    return squadData.bench.slice(0, 5).map(p => ({
      name: p.name.split(' ').pop() ?? p.name,
      ovr: p.ovr,
      diff: p.ovr - startersAvg,
    }));
  })();

  const svgMatchMomentum = (() => {
    const seed = hashString(`${matchData.homeTeam}-${matchData.awayTeam}`);
    const rng = createSeededRandom(seed + 1);
    return Array.from({ length: 8 }).map(() => {
      const base = matchData.possession / 100;
      const variation = (rng() - 0.5) * 0.4;
      return Math.round(Math.max(20, Math.min(95, (base + variation) * 100)));
    });
  })();

  const svgPossessionTimeline = (() => {
    const seed = hashString(`poss-${matchData.homeTeam}`);
    const rng = createSeededRandom(seed + 7);
    return Array.from({ length: 10 }).map(() => {
      const base = matchData.possession;
      const drift = (rng() - 0.5) * 20;
      return Math.round(Math.max(25, Math.min(75, base + drift)));
    });
  })();

  const svgTacticScores = (() => {
    const teamScores: Record<TacticKey, number[]> = {
      attack_more: [85, 40, 60, 50, 70],
      defend_deeper: [35, 90, 70, 55, 45],
      counter_attack: [70, 65, 90, 45, 60],
      keep_possession: [55, 55, 40, 90, 75],
    };
    const opponentScores = teamScores[activeTactic].map(v => Math.max(30, 100 - v + 5));
    return { team: teamScores[activeTactic], opponent: opponentScores };
  })();

  const svgMatchControl = (() => {
    const myGoals = matchData.isHome ? matchData.homeScore : matchData.awayScore;
    const oppGoals = matchData.isHome ? matchData.awayScore : matchData.homeScore;
    const goalDiff = myGoals - oppGoals;
    const possBonus = matchData.possession - 50;
    const shotBonus = matchData.shots - matchData.opponentShots;
    return Math.round(Math.max(10, Math.min(95, 50 + goalDiff * 12 + possBonus * 0.5 + shotBonus * 3)));
  })();

  const svgFormationFamiliarity = (() => {
    const familiarity: Record<FormationKey, number> = {
      '4-3-3': 88, '4-4-2': 75, '4-2-3-1': 82, '3-5-2': 60, '4-5-1': 70,
    };
    return familiarity[formation];
  })();

  const svgSubImpact = (() => {
    const startersAvg = squadData.starters.reduce((s, p) => s + p.ovr, 0) / squadData.starters.length;
    return subSlots.map((slot, i) => {
      if (slot.completed && slot.playerIn && slot.playerOut) {
        return { impact: slot.playerIn.ovr - slot.playerOut.ovr, actual: true };
      }
      const benchIdx = Math.min(i, squadData.bench.length - 1);
      return { impact: squadData.bench[benchIdx].ovr - Math.round(startersAvg), actual: false };
    });
  })();

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

          {/* ============================================ */}
          {/* 9. SVG Squad Fitness Radar                   */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Squad Fitness Radar</SectionTitle>
              <div className="flex justify-center">
                <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
                  {[40, 60, 80, 100].map((scale, i) => (
                    <polygon
                      key={i}
                      points={buildGridPolygon(100, 100, (scale / 100) * 80, 5)}
                      fill="none"
                      stroke="#30363d"
                      strokeWidth="0.5"
                    />
                  ))}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
                    const ex = 100 + 80 * Math.cos(angle);
                    const ey = 100 + 80 * Math.sin(angle);
                    return <line key={i} x1={100} y1={100} x2={ex} y2={ey} stroke="#30363d" strokeWidth="0.5" />;
                  })}
                  <polygon
                    points={buildRadarPoints(100, 100, 80, svgFitnessRadar)}
                    fill={`${WEB3_LIME}20`}
                    stroke={WEB3_LIME}
                    strokeWidth="1.5"
                  />
                  {['GK', 'DEF', 'MID', 'ATT', 'ALL'].map((label, i) => {
                    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
                    const lx = 100 + 94 * Math.cos(angle);
                    const ly = 100 + 94 * Math.sin(angle);
                    return (
                      <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize="8">
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between mt-1 px-2">
                {['GK', 'DEF', 'MID', 'ATT', 'ALL'].map((l, i) => (
                  <span key={i} className="text-[8px] text-[#8b949e]">{Math.round(svgFitnessRadar[i])}%</span>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 10. SVG Substitution Impact Bars             */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Substitution Impact</SectionTitle>
              <div className="space-y-3">
                {svgSubImpact.map((sub, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">
                        Sub {i + 1} {sub.actual ? '(done)' : '(est.)'}
                      </span>
                      <span className={`text-[10px] font-semibold ${sub.impact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {sub.impact >= 0 ? '+' : ''}{sub.impact} OVR
                      </span>
                    </div>
                    <svg viewBox="0 0 200 12" className="w-full h-3" preserveAspectRatio="none">
                      <rect x="0" y="0" width="200" height="12" fill="#21262d" rx="2" />
                      {sub.impact >= 0 ? (
                        <rect
                          x="100"
                          y="1"
                          width={Math.min(sub.impact * 8, 96)}
                          height="10"
                          fill={WEB3_ORANGE}
                          opacity={sub.actual ? 1 : 0.4}
                          rx="1"
                        />
                      ) : (
                        <rect
                          x={100 + sub.impact * 8}
                          y="1"
                          width={Math.abs(sub.impact) * 8}
                          height="10"
                          fill={WEB3_ORANGE}
                          opacity={sub.actual ? 1 : 0.4}
                          rx="1"
                        />
                      )}
                      <line x1="100" y1="0" x2="100" y2="12" stroke="#484f58" strokeWidth="0.5" />
                    </svg>
                  </div>
                ))}
                <div className="pt-1 border-t border-[#30363d]">
                  <p className={`text-[9px] ${TEXT_SECONDARY}`}>
                    Positive = incoming OVR minus outgoing OVR
                  </p>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 11. SVG Formation Familiarity Ring           */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Formation Familiarity</SectionTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#21262d" strokeWidth="8"
                      strokeDasharray="0 251.3" transform="rotate(-90 50 50)" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={WEB3_CYAN}
                      strokeWidth="8"
                      strokeDasharray={`${(svgFormationFamiliarity / 100) * 251.3} 251.3`}
                      strokeLinecap="butt"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{svgFormationFamiliarity}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{formation}</span>
                  <span className={`text-[10px] block ${TEXT_SECONDARY}`}>
                    {svgFormationFamiliarity >= 80 ? 'Well drilled — players understand positioning' : svgFormationFamiliarity >= 65 ? 'Decent understanding — minor gaps' : 'Needs work — consider drills'}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {ALL_FORMATIONS.map((f) => (
                      <div
                        key={f}
                        className="h-1.5 flex-1 rounded-sm"
                        style={{ backgroundColor: f === formation ? WEB3_CYAN : '#30363d', opacity: f === formation ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {ALL_FORMATIONS.map((f) => (
                      <span key={f} className="text-[6px] text-[#484f58] flex-1 text-center">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 12. SVG Match Momentum Area Chart            */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Match Momentum</SectionTitle>
              <svg viewBox="0 0 200 80" className="w-full h-20">
                <polygon
                  points={buildAreaPoints(svgMatchMomentum, 200, 80, 10)}
                  fill={`${WEB3_ORANGE}30`}
                  stroke="none"
                />
                <polyline
                  points={buildLinePoints(svgMatchMomentum, 200, 80, 10)}
                  fill="none"
                  stroke={WEB3_ORANGE}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {svgMatchMomentum.map((v, i) => {
                  const maxVal = Math.max(...svgMatchMomentum, 1);
                  const stepX = (200 - 20) / Math.max(svgMatchMomentum.length - 1, 1);
                  const px = 10 + i * stepX;
                  const py = 80 - 10 - (v / maxVal) * 60;
                  return <circle key={i} cx={px} cy={py} r="2.5" fill={WEB3_ORANGE} />;
                })}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                  const stepX = (200 - 20) / 7;
                  const minute = Math.round((i / 7) * 90);
                  return (
                    <text key={i} x={10 + i * stepX} y="78" textAnchor="middle" fill="#8b949e" fontSize="7">
                      {minute}&apos;
                    </text>
                  );
                })}
              </svg>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#8b949e]">0&apos;</span>
                <span className="text-[9px] text-[#8b949e]">90&apos;</span>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 13. SVG Tactical Effectiveness Radar         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Tactical Effectiveness</SectionTitle>
              <div className="flex justify-center">
                <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
                  {[40, 60, 80, 100].map((scale, i) => (
                    <polygon
                      key={i}
                      points={buildGridPolygon(100, 100, (scale / 100) * 80, 5)}
                      fill="none"
                      stroke="#30363d"
                      strokeWidth="0.5"
                    />
                  ))}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
                    const ex = 100 + 80 * Math.cos(angle);
                    const ey = 100 + 80 * Math.sin(angle);
                    return <line key={i} x1={100} y1={100} x2={ex} y2={ey} stroke="#30363d" strokeWidth="0.5" />;
                  })}
                  <polygon
                    points={buildRadarPoints(100, 100, 80, svgTacticScores.team)}
                    fill={`${WEB3_LIME}20`}
                    stroke={WEB3_LIME}
                    strokeWidth="1.5"
                  />
                  {['ATK', 'DEF', 'CTR', 'POS', 'PRS'].map((label, i) => {
                    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
                    const lx = 100 + 94 * Math.cos(angle);
                    const ly = 100 + 94 * Math.sin(angle);
                    return (
                      <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize="7">
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between mt-1 px-2">
                {['ATK', 'DEF', 'CTR', 'POS', 'PRS'].map((l, i) => (
                  <span key={i} className="text-[8px] text-[#8b949e]">{svgTacticScores.team[i]}</span>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 14. SVG Player Fitness Distribution Donut    */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Fitness Distribution</SectionTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#21262d" strokeWidth="12" />
                    {svgFitnessDonut.segments.map((seg, i) => (
                      <path
                        key={i}
                        d={buildArcPath(50, 50, 40, seg.start, seg.end)}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeLinecap="butt"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{svgFitnessDonut.total}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {svgFitnessDonut.segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] text-[#c9d1d9] flex-1">{seg.label}</span>
                      <span className="text-[10px] font-semibold text-[#8b949e]">{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 15. SVG Possession Timeline Line             */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Possession Timeline</SectionTitle>
              <svg viewBox="0 0 200 80" className="w-full h-20">
                <line x1="10" y1="40" x2="190" y2="40" stroke="#30363d" strokeWidth="0.5" strokeDasharray="3 3" />
                <polyline
                  points={buildLinePoints(svgPossessionTimeline, 200, 80, 10)}
                  fill="none"
                  stroke={WEB3_CYAN}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {svgPossessionTimeline.map((v, i) => {
                  const stepX = (200 - 20) / Math.max(svgPossessionTimeline.length - 1, 1);
                  const px = 10 + i * stepX;
                  const py = 80 - 10 - ((v - 25) / 50) * 60;
                  return <circle key={i} cx={px} cy={py} r="2" fill={WEB3_CYAN} />;
                })}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                  const stepX = (200 - 20) / 9;
                  const minute = Math.round((i / 9) * 90);
                  return (
                    <text key={i} x={10 + i * stepX} y="78" textAnchor="middle" fill="#8b949e" fontSize="7">
                      {minute}&apos;
                    </text>
                  );
                })}
              </svg>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#8b949e]">25%</span>
                <span className="text-[9px] text-[#8b949e]">75%</span>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 16. SVG Bench Strength Bars                  */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Bench vs Starter OVR</SectionTitle>
              <div className="space-y-2">
                {svgBenchStrength.map((bench, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-[#8b949e] w-12 truncate shrink-0">{bench.name}</span>
                    <svg viewBox="0 0 140 10" className="flex-1 h-2.5" preserveAspectRatio="none">
                      <rect x="0" y="0" width="140" height="10" fill="#21262d" rx="2" />
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(4, ((bench.ovr / 100) * 140))}
                        height="10"
                        fill={WEB3_LIME}
                        opacity={bench.diff >= 0 ? 1 : 0.5}
                        rx="2"
                      />
                    </svg>
                    <span className={`text-[9px] font-semibold w-10 text-right shrink-0 ${bench.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {bench.ovr}
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t border-[#30363d] space-y-1">
                  <p className={`text-[9px] ${TEXT_SECONDARY}`}>
                    Compared to starters average OVR
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: WEB3_LIME }} />
                      <span className="text-[8px] text-[#8b949e]">Bench OVR</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-sm bg-[#21262d] border border-[#30363d]" />
                      <span className="text-[8px] text-[#8b949e]">Scale 0-100</span>
                    </div>
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 17. SVG Match Control Gauge                  */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Match Control</SectionTitle>
              <div className="flex justify-center">
                <svg viewBox="0 0 200 120" className="w-full max-w-[220px]">
                  {/* Background arc */}
                  <path d={buildGaugeArc(100, 100, 80, 100)} fill="none" stroke="#21262d" strokeWidth="10" />
                  {/* Danger zone indicator (low control) */}
                  <path d={buildGaugeArc(100, 100, 80, 30)} fill="none" stroke="#FF550020" strokeWidth="10" />
                  {/* Value arc */}
                  <path
                    d={buildGaugeArc(100, 100, 80, svgMatchControl)}
                    fill="none"
                    stroke={WEB3_ORANGE}
                    strokeWidth="10"
                    strokeLinecap="butt"
                  />
                  {/* Tick marks */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const angle = ((180 + (tick / 100) * 180) * Math.PI) / 180;
                    const innerR = 68;
                    const outerR = 72;
                    const x1 = 100 + innerR * Math.cos(angle);
                    const y1 = 100 + innerR * Math.sin(angle);
                    const x2 = 100 + outerR * Math.cos(angle);
                    const y2 = 100 + outerR * Math.sin(angle);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#484f58" strokeWidth="1" />;
                  })}
                  <text x="100" y="90" textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="bold">
                    {svgMatchControl}
                  </text>
                  <text x="100" y="105" textAnchor="middle" fill="#8b949e" fontSize="8">
                    control %
                  </text>
                  <text x="22" y="108" textAnchor="middle" fill="#666666" fontSize="7">0</text>
                  <text x="100" y="22" textAnchor="middle" fill="#666666" fontSize="7">50</text>
                  <text x="178" y="108" textAnchor="middle" fill="#666666" fontSize="7">100</text>
                </svg>
              </div>
              <p className={`text-[9px] ${TEXT_SECONDARY} text-center mt-1`}>
                {svgMatchControl >= 70 ? 'Dominating the match' : svgMatchControl >= 45 ? 'Evenly contested' : 'Struggling for control'}
              </p>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 18. SVG Sub Timing Recommendation Timeline   */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Optimal Sub Timing</SectionTitle>
              <svg viewBox="0 0 200 60" className="w-full h-16">
                {/* Timeline base line */}
                <line x1="20" y1="30" x2="180" y2="30" stroke="#30363d" strokeWidth="1" />
                {/* Timing nodes */}
                {[60, 70, 75, 80, 85, 88, 90, 93].map((minute, i) => {
                  const x = 20 + (i / 7) * 160;
                  const isOptimal = minute === 60 || minute === 70 || minute === 75 || minute === 80;
                  const isPast = matchData.minute >= minute;
                  return (
                    <g key={i}>
                      {isOptimal && (
                        <circle cx={x} cy={30} r="8" fill={WEB3_LIME} opacity={isPast ? 0.15 : 0.05} />
                      )}
                      <circle
                        cx={x}
                        cy={30}
                        r={isOptimal ? 5 : 3}
                        fill={isOptimal ? WEB3_LIME : WEB3_GRAY}
                        opacity={isPast ? 1 : 0.4}
                      />
                      <text x={x} y="55" textAnchor="middle" fill="#8b949e" fontSize="7">
                        {minute}&apos;
                      </text>
                      {isOptimal && (
                        <text x={x} y="14" textAnchor="middle" fill={WEB3_LIME} fontSize="6" opacity={isPast ? 1 : 0.5}>
                          {minute}&apos;
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Current minute indicator */}
                <line
                  x1={20 + (matchData.minute / 93) * 160}
                  y1="20"
                  x2={20 + (matchData.minute / 93) * 160}
                  y2="40"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                <text
                  x={20 + (matchData.minute / 93) * 160}
                  y="17"
                  textAnchor="middle"
                  fill="white"
                  fontSize="6"
                  opacity="0.6"
                >
                  NOW
                </text>
              </svg>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>
                  Current: {matchData.minute}&apos;
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: WEB3_LIME }} />
                    <span className="text-[8px] text-[#8b949e]">Optimal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: WEB3_GRAY }} />
                    <span className="text-[8px] text-[#8b949e]">Secondary</span>
                  </div>
                </div>
              </div>
              <p className={`text-[9px] ${TEXT_SECONDARY} mt-1`}>
                {completedSubs >= 3 ? 'All substitutions used' : matchData.minute < 60 ? 'Wait for the 60th minute mark' : 'Prime window for substitutions open'}
              </p>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 19. SVG Tactic Comparison Butterfly           */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Tactic Comparison</SectionTitle>
              <svg viewBox="0 0 200 100" className="w-full h-28">
                {/* Center divider */}
                <line x1="100" y1="10" x2="100" y2="90" stroke="#30363d" strokeWidth="0.5" />
                {/* Horizontal grid lines */}
                {[18, 33, 48, 63, 78].map((y, i) => (
                  <line key={i} x1="20" y1={y} x2="180" y2={y} stroke="#21262d" strokeWidth="0.3" />
                ))}
                {['ATK', 'DEF', 'CTR', 'POS', 'PRS'].map((label, i) => {
                  const y = 18 + i * 15;
                  return (
                    <g key={i}>
                      <text x="4" y={y + 3} fill="#8b949e" fontSize="7">{label}</text>
                      {/* Team bar (right) */}
                      <rect
                        x="100" y={y - 3}
                        width={(svgTacticScores.team[i] / 100) * 48}
                        height="6"
                        fill={WEB3_CYAN}
                        rx="1"
                      />
                      {/* Opponent bar (left) */}
                      <rect
                        x={100 - (svgTacticScores.opponent[i] / 100) * 48}
                        y={y - 3}
                        width={(svgTacticScores.opponent[i] / 100) * 48}
                        height="6"
                        fill={WEB3_ORANGE}
                        rx="1"
                      />
                      {/* Team score */}
                      <text x="150" y={y + 3} fill={WEB3_CYAN} fontSize="7">{svgTacticScores.team[i]}</text>
                      {/* Opponent score */}
                      <text x="48" y={y + 3} fill={WEB3_ORANGE} fontSize="7">{svgTacticScores.opponent[i]}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: WEB3_ORANGE }} />
                  <span className="text-[8px] text-[#8b949e]">Opponent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: WEB3_CYAN }} />
                  <span className="text-[8px] text-[#8b949e]">{gameState.currentClub.name}</span>
                </div>
              </div>
              <p className={`text-[9px] ${TEXT_SECONDARY} text-center mt-1`}>
                Based on current tactical setup: {TACTICS.find(t => t.key === activeTactic)?.label}
              </p>
            </InfoCard>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
