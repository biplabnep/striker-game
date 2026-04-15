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
  Activity,
  AlertTriangle,
  Award,
  Heart,
  Zap,
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
// New section helpers (chemistry, fitness, opponent)
// ============================================================

function getChemistryColor(value: number): string {
  if (value >= 75) return '#34d399'; // emerald-400
  if (value >= 50) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

function getChemistryColorClass(value: number): string {
  if (value >= 75) return 'text-emerald-400';
  if (value >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getChemistryBgClass(value: number): string {
  if (value >= 75) return 'bg-emerald-500/15';
  if (value >= 50) return 'bg-amber-500/15';
  return 'bg-red-500/15';
}

function generateFitness(playerId: string, seed: number): number {
  const rng = createSeededRandom(hashString(playerId + 'fitness') + seed);
  return Math.round(48 + rng() * 52); // 48-100
}

function getFitnessColor(fitness: number): string {
  if (fitness > 85) return 'bg-emerald-500';
  if (fitness >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getFitnessTextColor(fitness: number): string {
  if (fitness > 85) return 'text-emerald-400';
  if (fitness >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getFatigueLevel(fitness: number): string {
  if (fitness > 85) return 'Low';
  if (fitness >= 60) return 'Medium';
  return 'High';
}

function getFatigueColor(fatigue: string): string {
  if (fatigue === 'Low') return 'text-emerald-400';
  if (fatigue === 'Medium') return 'text-amber-400';
  return 'text-red-400';
}

function getDifficultyInfo(teamOvr: number, opponentOvr: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const diff = opponentOvr - teamOvr;
  if (diff <= -8) return { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
  if (diff <= -3) return { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
  if (diff <= 3) return { label: 'Hard', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' };
  return { label: 'Extreme', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' };
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
  const [setPieceOffsets, setSetPieceOffsets] = useState<Record<string, number>>({});

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

  // Team Chemistry data (Section A)
  const chemistryData = useMemo(() => {
    if (!teamData || !teamStats) return null;
    const starters = teamData.starters;
    const seed = hashString(starters.map(p => p.id).join('') + 'chem');

    // Understanding: based on average age (veteran teams gel better)
    const avgAge = starters.reduce((s, p) => s + p.age, 0) / starters.length;
    const understanding = Math.min(100, Math.max(30, Math.round(avgAge * 2.4 + 25)));

    // Communication: based on nationality diversity
    const nationalities = new Set(starters.map(p => p.nationality.name));
    const natCount = nationalities.size;
    const communication = natCount <= 3 ? 88 : natCount <= 5 ? 74 : natCount <= 7 ? 60 : 44;

    // Formation Fit: based on OVR spread and average form
    const ovrStd = Math.sqrt(
      starters.reduce((s, p) => s + Math.pow(p.ovr - teamStats.avgOvr, 2), 0) / starters.length
    );
    const formationFit = Math.min(100, Math.max(35, Math.round(85 - ovrStd * 1.8 + (teamStats.bestForm.form - 5) * 2)));

    // Morale: based on average form
    const avgForm = starters.reduce((s, p) => s + p.form, 0) / starters.length;
    const morale = Math.round(avgForm * 10.5);

    // Experience: based on average age
    const experience = Math.min(100, Math.max(30, Math.round(avgAge * 2.6 + 22)));

    const overall = Math.round((understanding + communication + formationFit + morale + experience) / 5);

    return {
      factors: [
        { name: 'Understanding', value: understanding },
        { name: 'Communication', value: communication },
        { name: 'Formation Fit', value: formationFit },
        { name: 'Morale', value: morale },
        { name: 'Experience', value: experience },
      ],
      overall: Math.min(100, Math.max(0, overall)),
    };
  }, [teamData, teamStats]);

  // Opponent data (Section B)
  const opponentData = useMemo(() => {
    if (!gameState || !teamStats) return null;
    const seed = hashString(gameState.currentClub.name + 'opponent_v2');
    const rng = createSeededRandom(seed);

    const opponentNames = [
      'FC Dynamo', 'Athletic United', 'Red Star FC', 'Sporting Club',
      'City Rangers', 'Blue Wolves', 'Golden Eagles', 'Phoenix FC',
      'Royal Madrid', 'Inter Milan', 'Bayern Nord', 'Ajax Town',
    ];
    const opponentName = opponentNames[Math.floor(rng() * opponentNames.length)];

    const formations: FormationKey[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1'];
    const oppFormation = formations[Math.floor(rng() * formations.length)];
    const oppPositions = FORMATION_POSITIONS[oppFormation];

    const oppPlayers = oppPositions.map((pos) => {
      const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      const ovr = Math.round(teamStats.avgOvr + (rng() - 0.4) * 18);
      return {
        name: `${firstName} ${lastName}`,
        position: pos.pos,
        ovr: Math.max(55, Math.min(93, ovr)),
        x: pos.x,
        y: pos.y,
      };
    });

    const avgOvr = Math.round(oppPlayers.reduce((s, p) => s + p.ovr, 0) / oppPlayers.length);
    const playStyles = ['Possession', 'Counter', 'High Press', 'Direct', 'Balanced'];
    const playStyle = playStyles[Math.floor(rng() * playStyles.length)];
    const avgForm = Math.round((5 + rng() * 4.5) * 10) / 10;
    const dangerPlayers = [...oppPlayers].sort((a, b) => b.ovr - a.ovr).slice(0, 3);

    return {
      name: opponentName,
      formation: oppFormation,
      players: oppPlayers,
      avgOvr,
      avgForm,
      playStyle,
      dangerPlayers,
    };
  }, [gameState, teamStats]);

  // Fitness data (Section C)
  const fitnessData = useMemo(() => {
    if (!teamData || !gameState) return null;
    const seed = hashString(gameState.currentClub.name + gameState.player.name + 'fitness_v2');

    return teamData.starters.map((player) => {
      const fitness = generateFitness(player.id, seed);
      return {
        id: player.id,
        name: player.name,
        nameShort: player.name.split(' ').pop() || player.name,
        position: player.position,
        ovr: player.ovr,
        isUser: player.isUser,
        fitness,
        fatigue: getFatigueLevel(fitness),
        isRisk: fitness < 65,
      };
    });
  }, [teamData, gameState]);

  // Set piece data (Section D)
  const setPieceData = useMemo(() => {
    if (!teamData) return null;
    const starters = teamData.starters;

    // Corner Taker: wingers and attacking mids, sorted by OVR
    const cornerEligible = starters
      .filter(p => ['LW', 'RW', 'LM', 'RM', 'CAM'].includes(p.position))
      .sort((a, b) => b.ovr - a.ovr);

    // Free Kick Taker: attacking players sorted by OVR
    const freeKickEligible = starters
      .filter(p => ['LW', 'RW', 'ST', 'CAM', 'CM', 'CF'].includes(p.position))
      .sort((a, b) => b.ovr - a.ovr);

    // Penalty Taker: forwards sorted by OVR
    const penaltyEligible = starters
      .filter(p => ['ST', 'CF', 'CAM', 'LW', 'RW'].includes(p.position))
      .sort((a, b) => b.ovr - a.ovr);

    // Captain: from current captainId
    const captainPlayer = starters.find(p => p.id === captainId) || starters[0];

    return {
      roles: [
        { id: 'corner', label: 'Corner Taker', eligible: cornerEligible, attribute: 'Crossing' },
        { id: 'freekick', label: 'Free Kick Taker', eligible: freeKickEligible, attribute: 'FK Accuracy' },
        { id: 'penalty', label: 'Penalty Taker', eligible: penaltyEligible, attribute: 'Penalties' },
        { id: 'captain', label: 'Captain', eligible: [captainPlayer], attribute: 'Leadership' },
      ],
    };
  }, [teamData, captainId]);

  const handleCaptainSet = useCallback((playerId: string) => {
    setCaptainId(playerId);
  }, []);

  const handleViewBriefing = useCallback(() => {
    setScreen('tactical_briefing');
  }, [setScreen]);

  const cycleSetPiece = useCallback((roleId: string, eligibleCount: number) => {
    setSetPieceOffsets(prev => ({
      ...prev,
      [roleId]: ((prev[roleId] || 0) + 1) % eligibleCount,
    }));
  }, []);

  // ============================================================
  // Computed data for SVG visualizations
  // ============================================================

  // OVR Distribution (for horizontal bar chart)
  const ovrDistribution = useMemo(() => {
    if (!teamData) return [];
    return teamData.starters.reduce<{ label: string; count: number; color: string }[]>(
      (dist, p) => {
        const idx = p.ovr >= 90 ? 0 : p.ovr >= 85 ? 1 : p.ovr >= 80 ? 2 : p.ovr >= 75 ? 3 : 4;
        dist[idx].count += 1;
        return dist;
      },
      [
        { label: '90+', count: 0, color: '#34d399' },
        { label: '85-89', count: 0, color: '#3b82f6' },
        { label: '80-84', count: 0, color: '#fbbf24' },
        { label: '75-79', count: 0, color: '#f97316' },
        { label: '<75', count: 0, color: '#f87171' },
      ],
    );
  }, [teamData]);

  // Positional Balance (for hex radar)
  const positionalBalance = useMemo(() => {
    if (!teamData) return [];
    const starters = teamData.starters;
    const DEF_POS = ['CB', 'LB', 'RB'];
    const MID_POS = ['CM', 'CDM', 'CAM', 'LM', 'RM'];
    const FWD_POS = ['ST', 'CF', 'LW', 'RW'];
    const defCount = starters.filter(p => DEF_POS.includes(p.position)).length;
    const midCount = starters.filter(p => MID_POS.includes(p.position)).length;
    const fwdCount = starters.filter(p => FWD_POS.includes(p.position)).length;
    const gkCount = starters.filter(p => p.position === 'GK').length;
    const lCount = starters.filter(p => ['LB', 'LM', 'LW'].includes(p.position)).length;
    const rCount = starters.filter(p => ['RB', 'RM', 'RW'].includes(p.position)).length;
    return [
      { label: 'GK', value: gkCount, max: 1 },
      { label: 'DEF', value: defCount, max: 5 },
      { label: 'MID', value: midCount, max: 5 },
      { label: 'FWD', value: fwdCount, max: 4 },
      { label: 'L', value: lCount, max: 3 },
      { label: 'R', value: rCount, max: 3 },
    ];
  }, [teamData]);

  // Fitness Distribution (for donut chart)
  const fitnessDistribution = useMemo(() => {
    if (!fitnessData) return [];
    return fitnessData.reduce<{ label: string; count: number; color: string }[]>(
      (dist, p) => {
        if (p.fitness > 85) dist[0].count += 1;
        else if (p.fitness >= 60) dist[1].count += 1;
        else dist[2].count += 1;
        return dist;
      },
      [
        { label: 'High Fitness', count: 0, color: '#34d399' },
        { label: 'Medium', count: 0, color: '#fbbf24' },
        { label: 'Low Risk', count: 0, color: '#f87171' },
      ],
    );
  }, [fitnessData]);

  // Best defenders for danger player comparison
  const bestDefenders = useMemo(() => {
    if (!teamData) return [];
    return [...teamData.starters]
      .filter(p => ['CB', 'LB', 'RB', 'CDM', 'CM'].includes(p.position))
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 3);
  }, [teamData]);

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

  // Derived values for new sections (after null guard, all useMemo results are non-null)
  const difficulty = getDifficultyInfo(teamStats.avgOvr, opponentData!.avgOvr);
  const avgFitness = Math.round(fitnessData!.reduce((s, p) => s + p.fitness, 0) / fitnessData!.length);
  const riskCount = fitnessData!.filter(p => p.isRisk).length;

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
          {/* SVG #5: Formation Comparison Bars             */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-400" />
                <SectionTitle>Formation Effectiveness</SectionTitle>
              </div>
              <svg viewBox="0 0 280 150" style={{ width: '100%', maxWidth: 280 }}>
                {ALL_FORMATIONS.map((f, i) => {
                  const eff = Number(getFormationStrength(f, teamStats.avgOvr));
                  const maxEff = 100;
                  const barWidth = Math.max(4, (eff / maxEff) * 180);
                  const isActive = formation === f;
                  const barColor = isActive ? '#34d399' : '#30363d';
                  const textColor = isActive ? '#34d399' : '#8b949e';
                  return (
                    <g key={f}>
                      <text x="48" y={22 + i * 26} textAnchor="end" fill={textColor} fontSize="10" fontWeight={isActive ? '700' : '500'}>
                        {f}
                      </text>
                      <rect x="52" y={14 + i * 26} width={180} height="14" rx="4" fill="#21262d" />
                      <rect x="52" y={14 + i * 26} width={barWidth} height="14" rx="4" fill={barColor} />
                      <text x={56 + barWidth} y={24 + i * 26} fill={textColor} fontSize="9" fontWeight="600">
                        {eff}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </InfoCard>
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
          {/* SVG #3: Team OVR Distribution Bars           */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-400" />
                <SectionTitle>OVR Distribution</SectionTitle>
              </div>
              <svg viewBox="0 0 280 145" style={{ width: '100%', maxWidth: 280 }}>
                {ovrDistribution.map((bucket, i) => {
                  const maxCount = 11;
                  const barW = Math.max(4, (bucket.count / maxCount) * 180);
                  return (
                    <g key={bucket.label}>
                      <text x="48" y={20 + i * 26} textAnchor="end" fill="#8b949e" fontSize="10" fontWeight="500">
                        {bucket.label}
                      </text>
                      <rect x="52" y={12 + i * 26} width={180} height="14" rx="4" fill="#21262d" />
                      <rect x="52" y={12 + i * 26} width={barW} height="14" rx="4" fill={bucket.color} />
                      <text x={56 + barW} y={22 + i * 26} fill={bucket.color} fontSize="9" fontWeight="600">
                        {bucket.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* SVG #4: Positional Balance Hex Radar          */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-2">
              <SectionTitle>Positional Balance</SectionTitle>
              {(() => {
                const cx = 140;
                const cy = 85;
                const r = 60;
                const axes = positionalBalance.length;
                const axisAngles = positionalBalance.map((_, i) => ((2 * Math.PI) / axes) * i - Math.PI / 2);
                const gridLevels = [0.33, 0.66, 1.0];
                const dataPoints = positionalBalance.map((d, i) => {
                  const a = axisAngles[i];
                  const v = d.max > 0 ? d.value / d.max : 0;
                  return `${cx + r * v * Math.cos(a)},${cy + r * v * Math.sin(a)}`;
                }).join(' ');
                return (
                  <svg viewBox="0 0 280 180" style={{ width: '100%', maxWidth: 280 }}>
                    {/* Grid hexagons */}
                    {gridLevels.map((level, li) => {
                      const pts = axisAngles.map(a =>
                        `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`
                      ).join(' ');
                      return (
                        <polygon
                          key={`grid-${li}`}
                          points={pts}
                          fill="none"
                          stroke="#30363d"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {/* Axis lines */}
                    {axisAngles.map((a, i) => (
                      <line
                        key={`axis-${i}`}
                        x1={cx} y1={cy}
                        x2={cx + r * Math.cos(a)}
                        y2={cy + r * Math.sin(a)}
                        stroke="#30363d"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Data polygon */}
                    <polygon
                      points={dataPoints}
                      fill="#34d399"
                      fillOpacity="0.15"
                      stroke="#34d399"
                      strokeWidth="2"
                    />
                    {/* Data points + labels */}
                    {positionalBalance.map((d, i) => {
                      const a = axisAngles[i];
                      const v = d.max > 0 ? d.value / d.max : 0;
                      const px = cx + r * v * Math.cos(a);
                      const py = cy + r * v * Math.sin(a);
                      const lx = cx + (r + 18) * Math.cos(a);
                      const ly = cy + (r + 18) * Math.sin(a);
                      return (
                        <g key={d.label}>
                          <circle cx={px} cy={py} r="3" fill="#34d399" />
                          <text
                            x={lx}
                            y={ly + 3}
                            textAnchor="middle"
                            fill="#8b949e"
                            fontSize="9"
                            fontWeight="600"
                          >
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* A. Team Chemistry Visualizer                 */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-emerald-400" />
                <SectionTitle>Team Chemistry</SectionTitle>
              </div>

              {/* SVG Circular Chemistry Diagram */}
              <div className="flex justify-center py-1">
                <svg viewBox="0 0 200 200" className="w-44 h-44">
                  {/* Background ring - full segments */}
                  {chemistryData!.factors.map((_, i) => {
                    const CIRC = 2 * Math.PI * 70;
                    const segLen = CIRC / 5;
                    return (
                      <circle
                        key={`bg-${i}`}
                        cx="100" cy="100" r="70"
                        fill="none"
                        stroke="#21262d"
                        strokeWidth="14"
                        strokeDasharray={`${segLen - 4} ${CIRC - segLen + 4}`}
                        strokeDashoffset={CIRC / 4 + i * segLen + 2}
                      />
                    );
                  })}

                  {/* Filled arc segments */}
                  {chemistryData!.factors.map((factor, i) => {
                    const CIRC = 2 * Math.PI * 70;
                    const segLen = CIRC / 5;
                    const filled = Math.max(1, (factor.value / 100) * (segLen - 8));
                    return (
                      <circle
                        key={`fill-${i}`}
                        cx="100" cy="100" r="70"
                        fill="none"
                        stroke={getChemistryColor(factor.value)}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${filled} ${CIRC - filled}`}
                        strokeDashoffset={CIRC / 4 + i * segLen + 4}
                      />
                    );
                  })}

                  {/* Center score */}
                  <circle cx="100" cy="100" r="52" fill="#161b22" />
                  <text
                    x="100" y="92"
                    textAnchor="middle"
                    fill={getChemistryColor(chemistryData!.overall)}
                    fontSize="32"
                    fontWeight="bold"
                  >
                    {chemistryData!.overall}
                  </text>
                  <text x="100" y="112" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">
                    Chemistry
                  </text>
                </svg>
              </div>

              {/* Factor legend */}
              <div className="grid grid-cols-2 gap-1.5">
                {chemistryData!.factors.map((factor) => (
                  <div
                    key={factor.name}
                    className="flex items-center justify-between px-2.5 py-2 bg-[#21262d] rounded-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: getChemistryColor(factor.value) }}
                      />
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>{factor.name}</span>
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getChemistryColor(factor.value) }}
                    >
                      {factor.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* SVG #1: Chemistry Radar */}
              {(() => {
                const cx = 100;
                const cy = 100;
                const r = 70;
                const numAxes = 5;
                const axisAngles = Array.from({ length: numAxes }, (_, i) =>
                  ((2 * Math.PI) / numAxes) * i - Math.PI / 2
                );
                const gridLevels = [0.25, 0.5, 0.75, 1.0];
                const factors = chemistryData!.factors;
                const dataPoints = factors.map((f, i) => {
                  const a = axisAngles[i];
                  const v = f.value / 100;
                  return `${cx + r * v * Math.cos(a)},${cy + r * v * Math.sin(a)}`;
                }).join(' ');
                return (
                  <div className="flex justify-center py-1">
                    <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 200 }}>
                      {/* Grid pentagons */}
                      {gridLevels.map((level, li) => {
                        const pts = axisAngles.map(a =>
                          `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`
                        ).join(' ');
                        return (
                          <polygon
                            key={`chem-grid-${li}`}
                            points={pts}
                            fill="none"
                            stroke="#30363d"
                            strokeWidth="1"
                          />
                        );
                      })}
                      {/* Axis lines */}
                      {axisAngles.map((a, i) => (
                        <line
                          key={`chem-axis-${i}`}
                          x1={cx} y1={cy}
                          x2={cx + r * Math.cos(a)}
                          y2={cy + r * Math.sin(a)}
                          stroke="#30363d"
                          strokeWidth="1"
                        />
                      ))}
                      {/* Data polygon */}
                      <polygon
                        points={dataPoints}
                        fill="#34d399"
                        fillOpacity="0.12"
                        stroke="#34d399"
                        strokeWidth="2"
                      />
                      {/* Data points + labels */}
                      {factors.map((f, i) => {
                        const a = axisAngles[i];
                        const v = f.value / 100;
                        const px = cx + r * v * Math.cos(a);
                        const py = cy + r * v * Math.sin(a);
                        const lx = cx + (r + 16) * Math.cos(a);
                        const ly = cy + (r + 16) * Math.sin(a);
                        return (
                          <g key={`chem-pt-${i}`}>
                            <circle cx={px} cy={py} r="3" fill={getChemistryColor(f.value)} />
                            <text
                              x={lx}
                              y={ly + 3}
                              textAnchor="middle"
                              fill="#8b949e"
                              fontSize="8"
                              fontWeight="600"
                            >
                              {f.name.slice(0, 4)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}

              {/* SVG #2: Chemistry Overall Ring */}
              <div className="flex justify-center py-1">
                <svg viewBox="0 0 120 120" style={{ width: 100 }}>
                  {(() => {
                    const circ = 2 * Math.PI * 45;
                    const pct = chemistryData!.overall / 100;
                    const dashLen = pct * circ;
                    const ringColor = getChemistryColor(chemistryData!.overall);
                    return (
                      <>
                        <circle cx="60" cy="60" r="45" fill="none" stroke="#21262d" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="45"
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${dashLen} ${circ - dashLen}`}
                          strokeDashoffset={circ / 4}
                        />
                        <text x="60" y="56" textAnchor="middle" fill={ringColor} fontSize="22" fontWeight="bold">
                          {chemistryData!.overall}
                        </text>
                        <text x="60" y="72" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">
                          Overall
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Description */}
              <p className={`text-[10px] ${TEXT_SECONDARY} text-center`}>
                {chemistryData!.overall >= 75
                  ? 'Excellent team chemistry — players are well-synced and understand each other intuitively.'
                  : chemistryData!.overall >= 50
                    ? 'Good chemistry overall. Some areas need work for peak performance on the pitch.'
                    : 'Team chemistry needs attention. Consider training sessions to build better cohesion.'}
              </p>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* B. Opponent Formation Preview                */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="size-4 text-emerald-400" />
                  <SectionTitle>Next Opponent</SectionTitle>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${difficulty.bg} ${difficulty.color} ${difficulty.border}`}>
                  {difficulty.label}
                </span>
              </div>

              {/* Opponent name & formation */}
              <div className="flex items-center justify-between p-2.5 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${RED_BG} border ${RED_BORDER}`}>
                    <Shield className="size-3.5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{opponentData!.name}</div>
                    <div className={`text-[9px] ${TEXT_SECONDARY}`}>Matchday Opponent</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${TEXT_SECONDARY}`}>{opponentData!.formation}</span>
              </div>

              {/* Mini pitch with opponent players */}
              <div className="relative w-full aspect-[3/4] max-w-[180px] mx-auto">
                <div className="absolute inset-0 bg-[#1a3a2a] rounded-md border border-[#2a5a3a] overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
                    {/* Simplified pitch lines */}
                    <rect x="8" y="8" width="284" height="384" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <line x1="8" y1="200" x2="292" y2="200" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <circle cx="150" cy="200" r="32" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,0.18)" />
                    <rect x="65" y="8" width="170" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <rect x="65" y="342" width="170" height="50" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <rect x="110" y="8" width="80" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                    <rect x="110" y="372" width="80" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  </svg>
                  {/* Opponent player dots */}
                  {opponentData!.players.map((p, i) => (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-5 h-5 rounded-md bg-red-500/25 border border-red-500/35 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-red-300">{p.ovr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG #6: Opponent Formation Pitch (tactical view) */}
              <div className="flex justify-center py-1">
                <svg viewBox="0 0 200 260" style={{ width: '100%', maxWidth: 180 }}>
                  {/* Pitch background */}
                  <rect x="0" y="0" width="200" height="260" rx="8" fill="#1a3a2a" />
                  {/* Pitch lines */}
                  <rect x="8" y="8" width="184" height="244" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <line x1="8" y1="130" x2="192" y2="130" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <circle cx="100" cy="130" r="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <circle cx="100" cy="130" r="2" fill="rgba(255,255,255,0.2)" />
                  <rect x="40" y="8" width="120" height="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <rect x="40" y="212" width="120" height="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  {/* Formation label */}
                  <text x="100" y="254" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">
                    {opponentData!.formation}
                  </text>
                  {/* Player dots */}
                  {opponentData!.players.map((p, i) => (
                    <g key={`opp-pitch-${i}`}>
                      <circle
                        cx={p.x * 1.8}
                        cy={p.y * 2.4}
                        r="10"
                        fill="#f87171"
                        fillOpacity="0.2"
                        stroke="#f87171"
                        strokeOpacity="0.5"
                        strokeWidth="1"
                      />
                      <text
                        x={p.x * 1.8}
                        y={p.y * 2.4 + 3.5}
                        textAnchor="middle"
                        fill="#fca5a5"
                        fontSize="8"
                        fontWeight="700"
                      >
                        {p.ovr}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* 3 key opponent stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-[#21262d] rounded-md">
                  <div className={`text-[9px] uppercase ${TEXT_SECONDARY}`}>Avg OVR</div>
                  <div className="text-sm font-bold text-white tabular-nums">{opponentData!.avgOvr}</div>
                </div>
                <div className="text-center p-2 bg-[#21262d] rounded-md">
                  <div className={`text-[9px] uppercase ${TEXT_SECONDARY}`}>Form</div>
                  <div className="text-sm font-bold text-amber-400 tabular-nums">{opponentData!.avgForm}/10</div>
                </div>
                <div className="text-center p-2 bg-[#21262d] rounded-md">
                  <div className={`text-[9px] uppercase ${TEXT_SECONDARY}`}>Style</div>
                  <div className="text-[11px] font-bold text-[#c9d1d9]">{opponentData!.playStyle}</div>
                </div>
              </div>

              {/* SVG #7: Match Difficulty Gauge */}
              <div className="flex justify-center py-1">
                <svg viewBox="0 0 280 140" style={{ width: '100%', maxWidth: 280 }}>
                  {(() => {
                    const gaugeCx = 140;
                    const gaugeCy = 105;
                    const gaugeR = 80;
                    // Semicircular gauge from left (180°) to right (0°)
                    const zones = [
                      { label: 'Easy', startAngle: 180, endAngle: 225, color: '#34d399' },
                      { label: 'Medium', startAngle: 225, endAngle: 270, color: '#fbbf24' },
                      { label: 'Hard', startAngle: 270, endAngle: 315, color: '#f97316' },
                      { label: 'Extreme', startAngle: 315, endAngle: 360, color: '#f87171' },
                    ];
                    const diff = opponentData!.avgOvr - teamStats.avgOvr;
                    const needleAngle = diff <= -8 ? 195 : diff <= -3 ? 247 : diff <= 3 ? 292 : 340;
                    const needleRad = (needleAngle * Math.PI) / 180;
                    const nx = gaugeCx + (gaugeR - 12) * Math.cos(needleRad);
                    const ny = gaugeCy - (gaugeR - 12) * Math.sin(needleRad);
                    return (
                      <>
                        {/* Background arc */}
                        <path
                          d={`M ${gaugeCx - gaugeR} ${gaugeCy} A ${gaugeR} ${gaugeR} 0 0 1 ${gaugeCx + gaugeR} ${gaugeCy}`}
                          fill="none"
                          stroke="#21262d"
                          strokeWidth="18"
                          strokeLinecap="round"
                        />
                        {/* Zone arcs */}
                        {zones.map(zone => {
                          const startRad = (zone.startAngle * Math.PI) / 180;
                          const endRad = (zone.endAngle * Math.PI) / 180;
                          const x1 = gaugeCx + gaugeR * Math.cos(startRad);
                          const y1 = gaugeCy - gaugeR * Math.sin(startRad);
                          const x2 = gaugeCx + gaugeR * Math.cos(endRad);
                          const y2 = gaugeCy - gaugeR * Math.sin(endRad);
                          const largeArc = zone.endAngle - zone.startAngle > 180 ? 1 : 0;
                          return (
                            <path
                              key={zone.label}
                              d={`M ${x1} ${y1} A ${gaugeR} ${gaugeR} 0 ${largeArc} 1 ${x2} ${y2}`}
                              fill="none"
                              stroke={zone.color}
                              strokeWidth="18"
                              strokeLinecap="butt"
                              opacity="0.6"
                            />
                          );
                        })}
                        {/* Needle */}
                        <line
                          x1={gaugeCx} y1={gaugeCy}
                          x2={nx} y2={ny}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx={gaugeCx} cy={gaugeCy} r="5" fill="#161b22" stroke="#ffffff" strokeWidth="2" />
                        {/* Labels */}
                        <text x={gaugeCx - gaugeR} y={gaugeCy + 16} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="600">Easy</text>
                        <text x={gaugeCx} y={gaugeCy - gaugeR - 6} textAnchor="middle" fill="#f97316" fontSize="8" fontWeight="600">Hard</text>
                        <text x={gaugeCx + gaugeR} y={gaugeCy + 16} textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="600">Extreme</text>
                        {/* Difficulty label */}
                        <text x={gaugeCx} y={gaugeCy + 30} textAnchor="middle" fill={difficulty.color} fontSize="14" fontWeight="bold">
                          {difficulty.label}
                        </text>
                        <text x={gaugeCx} y={gaugeCy + 42} textAnchor="middle" fill="#8b949e" fontSize="9">
                          {teamStats.avgOvr} vs {opponentData!.avgOvr} OVR
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Danger Players */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-amber-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
                    Danger Players
                  </span>
                </div>
                {opponentData!.dangerPlayers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-[#21262d] rounded-md">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                        i === 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : i === 1
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d]'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white">{p.name}</span>
                        <span className={`text-[9px] ${TEXT_SECONDARY} ml-1.5`}>{p.position}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-400 tabular-nums">{p.ovr}</span>
                  </div>
                ))}
              </div>

              {/* SVG #8: Danger Player vs Best Defenders Comparison */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield className="size-3 text-emerald-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
                    Key Matchups
                  </span>
                </div>
                <svg viewBox="0 0 280 90" style={{ width: '100%', maxWidth: 280 }}>
                  {opponentData!.dangerPlayers.map((dp, i) => {
                    const defender = bestDefenders[i];
                    const defenderOvr = defender ? defender.ovr : 0;
                    const maxBar = 100;
                    const oppBarW = Math.max(4, (dp.ovr / maxBar) * 100);
                    const defBarW = Math.max(4, (defenderOvr / maxBar) * 100);
                    const yPos = 12 + i * 26;
                    return (
                      <g key={`matchup-${i}`}>
                        {/* Opponent bar (right-aligned, goes left) */}
                        <text x="52" y={yPos + 9} textAnchor="end" fill="#f87171" fontSize="8" fontWeight="600">
                          {dp.name.split(' ').pop()}
                        </text>
                        <rect x="54" y={yPos} width={100} height="12" rx="3" fill="#21262d" />
                        <rect x={54 + 100 - oppBarW} y={yPos} width={oppBarW} height="12" rx="3" fill="#f87171" fillOpacity="0.7" />
                        <text x={52 + 100 - oppBarW} y={yPos + 9} textAnchor="end" fill="#fca5a5" fontSize="7" fontWeight="700">
                          {dp.ovr}
                        </text>
                        {/* VS label */}
                        <text x="155" y={yPos + 9} textAnchor="middle" fill="#484f58" fontSize="7" fontWeight="700">
                          VS
                        </text>
                        {/* Defender bar */}
                        <rect x="164" y={yPos} width={100} height="12" rx="3" fill="#21262d" />
                        <rect x="164" y={yPos} width={defBarW} height="12" rx="3" fill="#34d399" fillOpacity="0.7" />
                        <text x={168 + defBarW} y={yPos + 9} fill="#6ee7b7" fontSize="7" fontWeight="700">
                          {defenderOvr || '-'}
                        </text>
                        <text x="266" y={yPos + 9} textAnchor="start" fill="#34d399" fontSize="8" fontWeight="600">
                          {defender ? defender.name.split(' ').pop() : '---'}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* C. Player Fitness & Fatigue Panel            */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-emerald-400" />
                  <SectionTitle>Player Fitness</SectionTitle>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] rounded-md">
                  <span className={`text-[9px] ${TEXT_SECONDARY}`}>Team Avg</span>
                  <span className={`text-xs font-bold tabular-nums ${getFitnessTextColor(avgFitness)}`}>
                    {avgFitness}%
                  </span>
                </div>
              </div>

              {/* Player fitness list */}
              <div className="space-y-1 max-h-80 overflow-y-auto overscroll-contain pr-1">
                {fitnessData!.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-lg space-y-1.5 ${
                      player.isUser
                        ? `${EMERALD_BG} border ${EMERALD_BORDER}`
                        : 'bg-[#21262d] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[10px] font-bold tabular-nums w-5 text-center shrink-0 ${
                          player.isUser ? EMERALD : 'text-[#484f58]'
                        }`}>
                          {player.ovr}
                        </span>
                        <span className={`text-xs font-semibold truncate ${
                          player.isUser ? 'text-emerald-300' : 'text-white'
                        }`}>
                          {player.nameShort}
                        </span>
                        <span className={`text-[9px] ${TEXT_SECONDARY} shrink-0`}>{player.position}</span>
                        {player.isRisk && (
                          <span className="flex items-center gap-0.5 text-[8px] font-bold text-red-400 shrink-0">
                            <AlertTriangle className="size-2.5" />
                            Risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-medium ${getFatigueColor(player.fatigue)}`}>
                          {player.fatigue}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${getFitnessTextColor(player.fitness)}`}>
                          {player.fitness}%
                        </span>
                      </div>
                    </div>
                    {/* Fitness bar */}
                    <div className="w-full h-1.5 bg-[#0d1117] rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${getFitnessColor(player.fitness)}`}
                        style={{ width: `${player.fitness}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG #9: Fitness Distribution Donut */}
              <div className="flex justify-center py-2">
                <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 200 }}>
                  {(() => {
                    const cx = 70;
                    const cy = 60;
                    const outerR = 45;
                    const innerR = 28;
                    const total = fitnessDistribution.reduce((s, seg) => s + seg.count, 0) || 1;
                    const segments = fitnessDistribution.reduce<Array<{ label: string; count: number; color: string; startAngle: number; endAngle: number; angle: number }>>(
                      (acc, seg) => {
                        const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
                        const angle = (seg.count / total) * 2 * Math.PI;
                        acc.push({ ...seg, startAngle: prevEnd, endAngle: prevEnd + angle, angle });
                        return acc;
                      },
                      [],
                    );
                    return (
                      <>
                        {/* Donut segments */}
                        {segments.map(seg => {
                          if (seg.count === 0) return null;
                          const x1o = cx + outerR * Math.cos(seg.startAngle);
                          const y1o = cy + outerR * Math.sin(seg.startAngle);
                          const x2o = cx + outerR * Math.cos(seg.endAngle);
                          const y2o = cy + outerR * Math.sin(seg.endAngle);
                          const x1i = cx + innerR * Math.cos(seg.endAngle);
                          const y1i = cy + innerR * Math.sin(seg.endAngle);
                          const x2i = cx + innerR * Math.cos(seg.startAngle);
                          const y2i = cy + innerR * Math.sin(seg.startAngle);
                          const largeArc = seg.angle > Math.PI ? 1 : 0;
                          return (
                            <path
                              key={seg.label}
                              d={`M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`}
                              fill={seg.color}
                              fillOpacity="0.75"
                            />
                          );
                        })}
                        {/* Center label */}
                        <circle cx={cx} cy={cy} r={innerR - 2} fill="#161b22" />
                        <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">
                          {avgFitness}%
                        </text>
                        <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7">Avg Fit</text>
                        {/* Legend */}
                        {segments.map((seg, li) => (
                          <g key={`legend-${seg.label}`}>
                            <rect x="140" y={20 + li * 28} width="10" height="10" rx="2" fill={seg.color} />
                            <text x="155" y={29 + li * 28} fill="#c9d1d9" fontSize="9" fontWeight="500">{seg.label}</text>
                            <text x="195" y={29 + li * 28} textAnchor="end" fill={seg.color} fontSize="9" fontWeight="700">{seg.count}</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Rotation recommendation */}
              <div className={`p-3 rounded-lg border ${
                riskCount > 0
                  ? `${AMBER_BG} ${AMBER_BORDER}`
                  : `${EMERALD_BG} ${EMERALD_BORDER}`
              }`}>
                <div className="flex items-start gap-2">
                  {riskCount > 0 ? (
                    <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <Heart className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  )}
                  <p className={`text-[10px] leading-relaxed ${
                    riskCount > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {riskCount > 2
                      ? `Warning: ${riskCount} players are at risk of injury. Strong rotation recommended for the next match.`
                      : riskCount > 0
                        ? `${riskCount} player${riskCount > 1 ? 's are' : ' is'} at risk of injury. Consider rotating ${riskCount > 1 ? 'them' : 'this player'} to avoid fatigue-related issues.`
                        : 'All players are in great shape. The squad is ready for the match with no rotation needed.'}
                  </p>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* D. Set Piece Assignments                     */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-emerald-400" />
                <SectionTitle>Set Piece Assignments</SectionTitle>
              </div>

              <div className="space-y-2">
                {setPieceData!.roles.map((role) => {
                  const idx = setPieceOffsets[role.id] || 0;
                  const assigned = role.eligible[idx] || role.eligible[0];
                  if (!assigned) return null;
                  const isCaptain = role.id === 'captain';
                  const canChange = !isCaptain && role.eligible.length > 1;

                  return (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                          isCaptain
                            ? `${AMBER_BG} border ${AMBER_BORDER}`
                            : `${EMERALD_BG} border ${EMERALD_BORDER}`
                        }`}>
                          {isCaptain ? (
                            <Crown className="size-4 text-amber-400" />
                          ) : role.id === 'corner' ? (
                            <Target className="size-4 text-emerald-400" />
                          ) : role.id === 'freekick' ? (
                            <Target className="size-4 text-emerald-400" />
                          ) : (
                            <Flag className="size-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[9px] uppercase tracking-wider ${TEXT_SECONDARY}`}>
                            {role.label}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold text-white truncate`}>
                              {assigned.name}
                            </span>
                            <span className={`text-[9px] ${TEXT_SECONDARY} shrink-0`}>
                              OVR {assigned.ovr}
                            </span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${getChemistryBgClass(assigned.ovr - 50)} ${getChemistryColorClass(assigned.ovr - 50)} shrink-0`}>
                              {role.attribute}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canChange && (
                        <button
                          onClick={() => cycleSetPiece(role.id, role.eligible.length)}
                          className="text-[9px] px-2.5 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors shrink-0 font-medium"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SVG #10: Set Piece Assignment Grid */}
              <div className="grid grid-cols-2 gap-2">
                {setPieceData!.roles.map((role) => {
                  const rIdx = setPieceOffsets[role.id] || 0;
                  const assigned = role.eligible[rIdx] || role.eligible[0];
                  if (!assigned) return null;
                  const roleColors: Record<string, string> = {
                    corner: '#34d399',
                    freekick: '#3b82f6',
                    penalty: '#fbbf24',
                    captain: '#f97316',
                  };
                  const color = roleColors[role.id] ?? '#8b949e';
                  return (
                    <svg key={`sp-grid-${role.id}`} viewBox="0 0 130 60" style={{ width: '100%' }}>
                      <rect x="0" y="0" width="130" height="60" rx="6" fill="#21262d" />
                      <rect x="0" y="0" width="130" height="60" rx="6" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
                      <text x="65" y="14" textAnchor="middle" fill={color} fontSize="8" fontWeight="700">
                        {role.label.toUpperCase()}
                      </text>
                      <text x="65" y="30" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                        {assigned.name.split(' ').pop()}
                      </text>
                      <text x="65" y="44" textAnchor="middle" fill="#8b949e" fontSize="8">
                        {role.attribute} · OVR {assigned.ovr}
                      </text>
                      <text x="65" y="56" textAnchor="middle" fill={color} fontSize="7" fontWeight="700">
                        {assigned.position}
                      </text>
                    </svg>
                  );
                })}
              </div>

              <p className={`text-[10px] ${TEXT_SECONDARY}`}>
                Tap "Change" to cycle through eligible players for each set piece role. Captain is set from the Starting XI panel.
              </p>
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

              {/* SVG #11: Team Strength vs Opponent */}
              {(() => {
                const teamOvr = teamStats.avgOvr;
                const oppOvr = opponentData!.avgOvr;
                // Derive stats deterministically from OVR and team data
                const seed = hashString(gameState!.currentClub.name + 'strength_cmp');
                const srng = createSeededRandom(seed);
                const teamSpeed = Math.round(teamOvr * 0.88 + (srng() - 0.5) * 4);
                const teamShooting = Math.round(teamOvr * 0.92 + (srng() - 0.5) * 4);
                const teamDefense = Math.round(teamOvr * 0.90 + (srng() - 0.5) * 4);
                const oppSpeed = Math.round(oppOvr * 0.88 + (srng() - 0.5) * 4);
                const oppShooting = Math.round(oppOvr * 0.92 + (srng() - 0.5) * 4);
                const oppDefense = Math.round(oppOvr * 0.90 + (srng() - 0.5) * 4);
                const statCategories = [
                  { label: 'OVR', team: teamOvr, opp: oppOvr },
                  { label: 'SPD', team: teamSpeed, opp: oppSpeed },
                  { label: 'SHT', team: teamShooting, opp: oppShooting },
                  { label: 'DEF', team: teamDefense, opp: oppDefense },
                ];
                const maxStat = 100;
                return (
                  <svg viewBox="0 0 280 110" style={{ width: '100%', maxWidth: 280 }}>
                    {/* Header */}
                    <text x="80" y="12" textAnchor="end" fill="#34d399" fontSize="9" fontWeight="700">YOUR TEAM</text>
                    <text x="140" y="12" textAnchor="middle" fill="#484f58" fontSize="8">VS</text>
                    <text x="200" y="12" textAnchor="start" fill="#f87171" fontSize="9" fontWeight="700">OPPONENT</text>
                    {/* Stat rows */}
                    {statCategories.map((cat, i) => {
                      const y = 28 + i * 22;
                      const teamBarW = Math.max(4, (cat.team / maxStat) * 58);
                      const oppBarW = Math.max(4, (cat.opp / maxStat) * 58);
                      return (
                        <g key={cat.label}>
                          {/* Stat label */}
                          <text x="140" y={y + 9} textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="600">{cat.label}</text>
                          {/* Team bar (grows from center-left) */}
                          <rect x={78 - teamBarW} y={y} width={teamBarW} height="14" rx="3" fill="#34d399" fillOpacity="0.6" />
                          <text x={76 - teamBarW} y={y + 10} textAnchor="end" fill="#6ee7b7" fontSize="8" fontWeight="700">{cat.team}</text>
                          {/* Opponent bar (grows from center-right) */}
                          <rect x="142" y={y} width={oppBarW} height="14" rx="3" fill="#f87171" fillOpacity="0.6" />
                          <text x={146 + oppBarW} y={y + 10} fill="#fca5a5" fontSize="8" fontWeight="700">{cat.opp}</text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

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
