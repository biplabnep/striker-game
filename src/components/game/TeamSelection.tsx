'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Crown,
  Shield,
  Swords,
  ChevronDown,
  ArrowUpDown,
  Star,
  Target,
  BarChart3,
  Sparkles,
  ClipboardList,
  Briefcase,
  ArrowRight,
  Flag,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Position } from '@/lib/game/types';

// ============================================================
// Design tokens (Uncodixify compliant)
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
// Animation variants (opacity-only, no transforms)
// ============================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ============================================================
// Formation types & position data
// ============================================================

type FormationKey = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '4-5-1';

const ALL_FORMATIONS: FormationKey[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1'];

// Each position defined as % from top-left of the pitch (x%, y%)
interface PitchPosition {
  pos: Position;
  x: number;
  y: number;
}

const FORMATION_POSITIONS: Record<FormationKey, PitchPosition[]> = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 },
    { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 },
    { pos: 'RB', x: 85, y: 72 },
    { pos: 'CM', x: 30, y: 52 },
    { pos: 'CM', x: 50, y: 48 },
    { pos: 'CM', x: 70, y: 52 },
    { pos: 'LW', x: 18, y: 25 },
    { pos: 'ST', x: 50, y: 18 },
    { pos: 'RW', x: 82, y: 25 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 },
    { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 },
    { pos: 'RB', x: 85, y: 72 },
    { pos: 'LM', x: 15, y: 48 },
    { pos: 'CM', x: 38, y: 50 },
    { pos: 'CM', x: 62, y: 50 },
    { pos: 'RM', x: 85, y: 48 },
    { pos: 'ST', x: 38, y: 20 },
    { pos: 'ST', x: 62, y: 20 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 },
    { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 },
    { pos: 'RB', x: 85, y: 72 },
    { pos: 'CDM', x: 38, y: 58 },
    { pos: 'CDM', x: 62, y: 58 },
    { pos: 'LW', x: 20, y: 38 },
    { pos: 'CAM', x: 50, y: 40 },
    { pos: 'RW', x: 80, y: 38 },
    { pos: 'ST', x: 50, y: 18 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'CB', x: 25, y: 75 },
    { pos: 'CB', x: 50, y: 77 },
    { pos: 'CB', x: 75, y: 75 },
    { pos: 'LM', x: 10, y: 50 },
    { pos: 'CM', x: 32, y: 52 },
    { pos: 'CDM', x: 50, y: 55 },
    { pos: 'CM', x: 68, y: 52 },
    { pos: 'RM', x: 90, y: 50 },
    { pos: 'ST', x: 38, y: 20 },
    { pos: 'ST', x: 62, y: 20 },
  ],
  '4-5-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'LB', x: 15, y: 72 },
    { pos: 'CB', x: 38, y: 75 },
    { pos: 'CB', x: 62, y: 75 },
    { pos: 'RB', x: 85, y: 72 },
    { pos: 'LM', x: 12, y: 45 },
    { pos: 'CM', x: 32, y: 50 },
    { pos: 'CAM', x: 50, y: 42 },
    { pos: 'CM', x: 68, y: 50 },
    { pos: 'RM', x: 88, y: 45 },
    { pos: 'ST', x: 50, y: 18 },
  ],
};

// ============================================================
// Player name pools (for deterministic generation)
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
  'Skirunar', 'Martinez', 'Alisson', 'Neuer', 'Navas', 'Lloris',
  'Laporte', 'Dias', 'Konate', 'Ake', 'Colwill', 'Cresswell',
  'Odegaard', 'Alexander-Arnold', 'James', 'White', 'Stones', 'Walker',
  'Tierney',
];

const NATIONALITIES: { name: string; flag: string }[] = [
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
];

const MATCH_STRATEGIES = ['Attacking', 'Balanced', 'Defensive', 'Counter-Attack'] as const;
type MatchStrategy = (typeof MATCH_STRATEGIES)[number];

const SORT_OPTIONS = ['By Position', 'By Rating', 'By Name'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

// ============================================================
// Generated player interface
// ============================================================

interface TeamPlayer {
  id: string;
  number: number;
  name: string;
  position: Position;
  ovr: number;
  age: number;
  form: number; // 1-10
  nationality: { name: string; flag: string };
  isUser: boolean;
  isCaptain: boolean;
  isStarter: boolean;
}

// ============================================================
// Deterministic team generation
// ============================================================

function generateTeam(
  clubName: string,
  userName: string,
  userPosition: Position,
  userOvr: number,
  userAge: number,
  userNationality: string,
  formation: FormationKey,
): { starters: TeamPlayer[]; subs: TeamPlayer[] } {
  const baseSeed = hashString(clubName + userName);
  const rng = createSeededRandom(baseSeed);
  const positions = FORMATION_POSITIONS[formation];

  // Find the best slot for the user's position
  const userSlotIndex = findBestSlotForPosition(positions, userPosition);

  // User player
  const userNationalityObj = NATIONALITIES.find(n => n.name === userNationality) || NATIONALITIES[0];
  const userPlayer: TeamPlayer = {
    id: 'user',
    number: 10,
    name: userName,
    position: userPosition,
    ovr: userOvr,
    age: userAge,
    form: 7,
    nationality: userNationalityObj,
    isUser: true,
    isCaptain: true,
    isStarter: true,
  };

  // Generate 10 other starters
  const starters: TeamPlayer[] = [];
  const usedNumbers = new Set([10]);

  for (let i = 0; i < 11; i++) {
    if (i === userSlotIndex) {
      starters.push(userPlayer);
      continue;
    }

    const pitchPos = positions[i];
    // Find a compatible position name from our Position type
    const compatPositions = getCompatiblePositions(pitchPos.pos);
    const selectedPos = compatPositions[Math.floor(rng() * compatPositions.length)];

    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

    let num = Math.floor(rng() * 30) + 1;
    while (usedNumbers.has(num)) num = Math.floor(rng() * 30) + 1;
    usedNumbers.add(num);

    const ovrVariance = Math.floor((rng() - 0.5) * 20);
    const ovr = Math.max(55, Math.min(95, userOvr + ovrVariance));

    const ageVariance = Math.floor((rng() - 0.5) * 10);
    const age = Math.max(17, Math.min(37, Math.round(userAge * 0.8 + ageVariance)));

    const formScore = Math.floor(rng() * 5) + 5; // 5-9

    const nat = NATIONALITIES[Math.floor(rng() * NATIONALITIES.length)];

    starters.push({
      id: `gen-${i}`,
      number: num,
      name: `${firstName} ${lastName}`,
      position: selectedPos,
      ovr,
      age,
      form: formScore,
      nationality: nat,
      isUser: false,
      isCaptain: false,
      isStarter: true,
    });
  }

  // Generate 7 substitutes
  const subs: TeamPlayer[] = [];
  const subPositions: Position[] = ['GK', 'CB', 'CM', 'ST', 'LW', 'RB', 'CDM'];

  for (let i = 0; i < 7; i++) {
    const subPos = subPositions[i % subPositions.length];
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

    let num = Math.floor(rng() * 30) + 1;
    while (usedNumbers.has(num)) num = Math.floor(rng() * 30) + 1;
    usedNumbers.add(num);

    const ovr = Math.max(50, userOvr + Math.floor((rng() - 0.5) * 24) - 3);
    const age = Math.max(17, Math.min(35, Math.round(userAge * 0.85 + Math.floor((rng() - 0.5) * 8))));
    const formScore = Math.floor(rng() * 6) + 3; // 3-8
    const nat = NATIONALITIES[Math.floor(rng() * NATIONALITIES.length)];

    subs.push({
      id: `sub-${i}`,
      number: num,
      name: `${firstName} ${lastName}`,
      position: subPos,
      ovr,
      age,
      form: formScore,
      nationality: nat,
      isUser: false,
      isCaptain: false,
      isStarter: false,
    });
  }

  return { starters, subs };
}

function findBestSlotForPosition(positions: PitchPosition[], userPos: Position): number {
  // Priority 1: exact match
  for (let i = 0; i < positions.length; i++) {
    if (positions[i].pos === userPos) return i;
  }
  // Priority 2: compatible
  const compat = getCompatiblePositions(userPos);
  for (const cp of compat) {
    for (let i = 0; i < positions.length; i++) {
      if (positions[i].pos === cp) return i;
    }
  }
  // Fallback: first non-GK slot
  for (let i = 0; i < positions.length; i++) {
    if (positions[i].pos !== 'GK') return i;
  }
  return 0;
}

function getCompatiblePositions(pos: Position): Position[] {
  switch (pos) {
    case 'GK': return ['GK'];
    case 'CB': return ['CB'];
    case 'LB': return ['LB', 'RB', 'LM'];
    case 'RB': return ['RB', 'LB', 'RM'];
    case 'CDM': return ['CDM', 'CM'];
    case 'CM': return ['CM', 'CDM', 'CAM'];
    case 'CAM': return ['CAM', 'CM', 'CF'];
    case 'LW': return ['LW', 'LM', 'RW', 'ST'];
    case 'RW': return ['RW', 'RM', 'LW', 'ST'];
    case 'LM': return ['LM', 'LB', 'LW'];
    case 'RM': return ['RM', 'RB', 'RW'];
    case 'ST': return ['ST', 'CF', 'CAM'];
    case 'CF': return ['CF', 'ST', 'CAM'];
    default: return [pos];
  }
}

function getPositionOrder(pos: Position): number {
  const order: Record<string, number> = {
    GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5, LM: 6, RM: 7,
    CAM: 8, LW: 9, RW: 10, CF: 11, ST: 12,
  };
  return order[pos] ?? 99;
}

function getFormColor(form: number): string {
  if (form >= 8) return 'bg-emerald-500';
  if (form >= 6) return 'bg-amber-500';
  if (form >= 4) return 'bg-orange-500';
  return 'bg-red-500';
}

function getFormationStrength(formation: FormationKey, avgOvr: number): string {
  const bonuses: Record<FormationKey, number> = {
    '4-3-3': 2, '4-4-2': 0, '4-2-3-1': 1, '3-5-2': 1, '4-5-1': -1,
  };
  return Math.round(avgOvr + (bonuses[formation] || 0)).toString();
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

// Football pitch SVG background with lines
function FootballPitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
      {/* Pitch background */}
      <div className="absolute inset-0 bg-[#1a5c2a] rounded-lg border border-[#2a7a3a] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
          {/* Outer border */}
          <rect x="8" y="8" width="284" height="384" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Half-way line */}
          <line x1="8" y1="200" x2="292" y2="200" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Center circle */}
          <circle cx="150" cy="200" r="40" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Center spot */}
          <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.35)" />
          {/* Top penalty area */}
          <rect x="60" y="8" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Top goal area */}
          <rect x="105" y="8" width="90" height="25" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Top penalty spot */}
          <circle cx="150" cy="53" r="2.5" fill="rgba(255,255,255,0.35)" />
          {/* Top penalty arc */}
          <path d="M 120 68 A 40 40 0 0 0 180 68" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Bottom penalty area */}
          <rect x="60" y="332" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Bottom goal area */}
          <rect x="105" y="367" width="90" height="25" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Bottom penalty spot */}
          <circle cx="150" cy="347" r="2.5" fill="rgba(255,255,255,0.35)" />
          {/* Bottom penalty arc */}
          <path d="M 120 332 A 40 40 0 0 1 180 332" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Corner arcs */}
          <path d="M 8 20 A 12 12 0 0 1 20 8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <path d="M 280 8 A 12 12 0 0 1 292 20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <path d="M 8 380 A 12 12 0 0 0 20 392" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <path d="M 280 392 A 12 12 0 0 0 292 380" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        </svg>

        {/* Player positions overlay */}
        {children}
      </div>
    </div>
  );
}

// Player dot on the pitch
function PitchPlayer({
  player,
  x,
  y,
}: {
  player: TeamPlayer;
  x: number;
  y: number;
}) {
  const isUser = player.isUser;
  const isCaptain = player.isCaptain;

  return (
    <motion.div
      variants={staggerChild}
      className="absolute flex flex-col items-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Player card */}
      <div
        className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border transition-colors ${
          isUser
            ? `${EMERALD_BG} ${EMERALD_BORDER} border`
            : 'bg-[#0d1117]/80 border-[#30363d]/60'
        }`}
      >
        {/* Captain badge */}
        {isCaptain && (
          <Crown className={`size-3 mb-0.5 ${isUser ? 'text-emerald-300' : 'text-amber-400'}`} />
        )}
        {/* OVR badge */}
        <span
          className={`text-[10px] font-bold leading-none ${
            isUser
              ? 'text-emerald-300'
              : player.ovr >= 80
                ? 'text-amber-400'
                : 'text-[#c9d1d9]'
          }`}
        >
          {player.ovr}
        </span>
        {/* Position label */}
        <span
          className={`text-[8px] font-semibold leading-none ${
            isUser ? 'text-emerald-400' : 'text-[#8b949e]'
          }`}
        >
          {player.position}
        </span>
      </div>
      {/* Name below */}
      <span
        className={`text-[9px] font-medium mt-0.5 truncate max-w-[56px] text-center leading-tight ${
          isUser ? 'text-emerald-300' : 'text-[#8b949e]'
        }`}
      >
        {player.name.split(' ').pop()}
      </span>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TeamSelection() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [sortBy, setSortBy] = useState<SortOption>('By Position');
  const [strategy, setStrategy] = useState<MatchStrategy>('Balanced');
  const [captainId, setCaptainId] = useState<string>('user');

  // Generate team data deterministically
  const teamData = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub } = gameState;
    const userNat = player.nationality || 'England';

    return generateTeam(
      currentClub.name,
      player.name,
      player.position,
      player.overall,
      player.age,
      userNat,
      formation,
    );
  }, [gameState, formation]);

  // Sorted starters
  const sortedStarters = useMemo(() => {
    if (!teamData) return [];
    const sorted = [...teamData.starters];
    switch (sortBy) {
      case 'By Position':
        sorted.sort((a, b) => getPositionOrder(a.position) - getPositionOrder(b.position));
        break;
      case 'By Rating':
        sorted.sort((a, b) => b.ovr - a.ovr);
        break;
      case 'By Name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [teamData, sortBy]);

  // Team stats
  const teamStats = useMemo(() => {
    if (!teamData) return null;
    const all = teamData.starters;
    const avgOvr = Math.round(all.reduce((s, p) => s + p.ovr, 0) / all.length);
    const avgAge = Math.round(all.reduce((s, p) => s + p.age, 0) / all.length * 10) / 10;
    const bestPlayer = all.reduce((best, p) => p.ovr > best.ovr ? p : best, all[0]);
    const bestForm = all.reduce((best, p) => p.form > best.form ? p : best, all[0]);
    const formationStr = getFormationStrength(formation, avgOvr);

    return { avgOvr, avgAge, bestPlayer, bestForm, formationStrength: Number(formationStr) };
  }, [teamData, formation]);

  const handleCaptainSet = useCallback((playerId: string) => {
    setCaptainId(playerId);
  }, []);

  const handleViewBriefing = useCallback(() => {
    setScreen('tactical_briefing');
  }, [setScreen]);

  // No game state fallback
  if (!gameState || !teamData || !teamStats) {
    return (
      <div className={`${DARK_BG} min-h-screen`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-8 text-center`}>
            <Users className="size-10 mx-auto mb-3 text-[#8b949e] opacity-40" />
            <h2 className="text-lg font-semibold text-white mb-2">No Team Data</h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              Start a career to view team selection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formationPositions = FORMATION_POSITIONS[formation];

  // Merge captain state into displayed players
  const displayStarters = sortedStarters.map(p => ({
    ...p,
    isCaptain: p.id === captainId,
  }));

  return (
    <div className={`${DARK_BG} min-h-screen`}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <Users className="size-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">Team Selection</h1>
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ============================================ */}
          {/* 1. Formation Selector                        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-4 text-emerald-400" />
              <span className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
                Formation
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ALL_FORMATIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormation(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors whitespace-nowrap ${
                    formation === f
                      ? `${EMERALD_BG} ${EMERALD_BORDER} border text-emerald-400`
                      : `bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58]`
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ============================================ */}
          {/* 2. Formation Pitch Display                    */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="p-2">
              <motion.div
                key={formation}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <FootballPitch>
                  {teamData.starters.map((player, idx) => (
                    <PitchPlayer
                      key={`${formation}-${player.id}`}
                      player={{ ...player, isCaptain: player.id === captainId }}
                      x={formationPositions[idx]?.x ?? 50}
                      y={formationPositions[idx]?.y ?? 50}
                    />
                  ))}
                </FootballPitch>
              </motion.div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 3. Starting XI Panel                         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Starting XI</SectionTitle>
                <button
                  onClick={() => {
                    const idx = SORT_OPTIONS.indexOf(sortBy);
                    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER} transition-colors hover:bg-emerald-500/25`}
                >
                  <ArrowUpDown className="size-3" />
                  {sortBy}
                </button>
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto overscroll-contain">
                {displayStarters.map((player) => (
                  <motion.div
                    key={player.id}
                    variants={staggerChild}
                    onClick={() => handleCaptainSet(player.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      player.isUser
                        ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                        : 'bg-[#0d1117]/60 border-transparent hover:bg-[#21262d] hover:border-[#30363d]'
                    }`}
                  >
                    {/* Number */}
                    <span
                      className={`w-6 text-center text-xs font-bold shrink-0 ${
                        player.isUser ? EMERALD : 'text-[#484f58]'
                      }`}
                    >
                      {player.number}
                    </span>

                    {/* Form dot */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${getFormColor(player.form)}`}
                      title={`Form: ${player.form}/10`}
                    />

                    {/* Nationality flag */}
                    <span className="text-sm shrink-0">{player.nationality.flag}</span>

                    {/* Name & position */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold truncate ${player.isUser ? 'text-emerald-300' : 'text-white'}`}>
                          {player.name}
                        </span>
                        {player.isUser && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER} shrink-0`}>
                            YOU
                          </span>
                        )}
                        {player.isCaptain && !player.isUser && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER} shrink-0`}>
                            C
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>{player.position}</span>
                    </div>

                    {/* OVR rating */}
                    <span
                      className={`text-sm font-bold tabular-nums shrink-0 ${
                        player.ovr >= 85
                          ? EMERALD
                          : player.ovr >= 75
                            ? 'text-amber-400'
                            : player.ovr >= 65
                              ? 'text-[#c9d1d9]'
                              : TEXT_SECONDARY
                      }`}
                    >
                      {player.ovr}
                    </span>
                  </motion.div>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 4. Substitutes Bench                         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Substitutes</SectionTitle>

              <div className="space-y-1.5">
                {teamData.subs.map((sub) => (
                  <motion.div
                    key={sub.id}
                    variants={staggerChild}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0d1117]/40 border border-transparent"
                  >
                    {/* Number */}
                    <span className="w-6 text-center text-xs font-bold text-[#484f58] shrink-0">
                      {sub.number}
                    </span>

                    {/* SUB badge */}
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#21262d] text-[#484f58] border border-[#30363d] shrink-0">
                      SUB
                    </span>

                    {/* Nationality */}
                    <span className="text-sm shrink-0">{sub.nationality.flag}</span>

                    {/* Name & position */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-[#8b949e] truncate block">{sub.name}</span>
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>{sub.position}</span>
                    </div>

                    {/* OVR */}
                    <span className={`text-sm font-bold tabular-nums shrink-0 ${TEXT_SECONDARY}`}>
                      {sub.ovr}
                    </span>
                  </motion.div>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 5. Team Stats Summary                        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <SectionTitle>Team Stats</SectionTitle>

              <div className="grid grid-cols-3 gap-2">
                {/* Avg OVR */}
                <div className="text-center p-2.5 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Avg OVR</div>
                  <div className={`text-lg font-bold text-white`}>{teamStats.avgOvr}</div>
                </div>

                {/* Avg Age */}
                <div className="text-center p-2.5 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Avg Age</div>
                  <div className={`text-lg font-bold text-white`}>{teamStats.avgAge}</div>
                </div>

                {/* Formation Strength */}
                <div className="text-center p-2.5 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Strength</div>
                  <div className={`text-lg font-bold text-white`}>{teamStats.formationStrength}</div>
                </div>
              </div>

              {/* Key players */}
              <div className="space-y-2">
                {/* Highest OVR */}
                <div className="flex items-center justify-between p-2.5 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="size-3.5 text-amber-400" />
                    <div>
                      <div className={`text-[10px] ${TEXT_SECONDARY}`}>Highest Rated</div>
                      <div className={`text-xs font-semibold text-white`}>{teamStats.bestPlayer.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-amber-400">{teamStats.bestPlayer.ovr}</span>
                    <span className={`text-[10px] ${TEXT_SECONDARY}`}>{teamStats.bestPlayer.position}</span>
                  </div>
                </div>

                {/* Best Form */}
                <div className="flex items-center justify-between p-2.5 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-emerald-400" />
                    <div>
                      <div className={`text-[10px] ${TEXT_SECONDARY}`}>Best Form</div>
                      <div className={`text-xs font-semibold text-white`}>{teamStats.bestForm.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getFormColor(teamStats.bestForm.form)}`} />
                    <span className={`text-sm font-bold ${EMERALD}`}>
                      {teamStats.bestForm.form}/10
                    </span>
                  </div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 6. Match Preparation                         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              <SectionTitle>Match Preparation</SectionTitle>

              {/* Match Strategy */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Target className="size-3.5 text-emerald-400" />
                  <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Match Strategy</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {MATCH_STRATEGIES.map((s) => {
                    const isActive = strategy === s;
                    const strategyColors: Record<MatchStrategy, { bg: string; text: string; border: string }> = {
                      Attacking: { bg: EMERALD_BG, text: EMERALD, border: EMERALD_BORDER },
                      Balanced: { bg: AMBER_BG, text: AMBER_TEXT, border: AMBER_BORDER },
                      Defensive: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
                      'Counter-Attack': { bg: RED_BG, text: RED_TEXT, border: RED_BORDER },
                    };
                    const colors = strategyColors[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={`px-3 py-2 rounded-md text-[11px] font-semibold border transition-colors ${
                          isActive
                            ? `${colors.bg} ${colors.text} border ${colors.border}`
                            : 'bg-[#0d1117]/60 border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#c9d1d9]'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Captain */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Crown className="size-3.5 text-amber-400" />
                  <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Team Captain</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{gameState.player.nationality ? (NATIONALITIES.find(n => n.name === gameState.player.nationality)?.flag || '🏴󠁧󠁢󠁥󠁮󠁧󠁿') : '🏴󠁧󠁢󠁥󠁮󠁧󠁿'}</span>
                    <div>
                      <div className={`text-xs font-semibold text-white`}>
                        {displayStarters.find(p => p.id === captainId)?.name || 'Unknown'}
                      </div>
                      <div className={`text-[10px] ${TEXT_SECONDARY}`}>
                        {displayStarters.find(p => p.id === captainId)?.position || '-'} · OVR {displayStarters.find(p => p.id === captainId)?.ovr || '-'}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center justify-center size-8 rounded-lg ${AMBER_BG} border ${AMBER_BORDER}`}>
                    <Crown className="size-4 text-amber-400" />
                  </div>
                </div>
                <p className={`text-[10px] ${TEXT_SECONDARY}`}>
                  Tap any player in the Starting XI to set them as captain.
                </p>
              </div>

              {/* Pre-match briefing link */}
              <button
                onClick={handleViewBriefing}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-[#21262d] ${CARD_BG} ${BORDER_COLOR}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center size-8 rounded-lg ${EMERALD_BG} border ${EMERALD_BORDER}`}>
                    <ClipboardList className="size-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-semibold text-white`}>Pre-Match Briefing</div>
                    <div className={`text-[10px] ${TEXT_SECONDARY}`}>View tactical analysis & opponent info</div>
                  </div>
                </div>
                <ArrowRight className={`size-4 ${TEXT_SECONDARY}`} />
              </button>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
