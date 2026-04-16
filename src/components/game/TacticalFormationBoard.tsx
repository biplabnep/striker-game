'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePinch, useDrag } from '@use-gesture/react';
import {
  LayoutGrid,
  Swords,
  Shield,
  Target,
  Star,
  ChevronRight,
  Users,
  X,
  ArrowRight,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Position } from '@/lib/game/types';
import { getClubById } from '@/lib/game/clubsData';

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
const RED_TEXT = 'text-red-400';
const RED_BG = 'bg-red-500/15';
const SKY_TEXT = 'text-sky-400';
const SKY_BG = 'bg-sky-500/15';

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

type FormationKey = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2' | '4-1-4-1';

const ALL_FORMATIONS: FormationKey[] = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2', '4-1-4-1'];

interface PitchPosition {
  pos: Position;
  x: number; // % from left
  y: number; // % from top
}

const FORMATION_POSITIONS: Record<FormationKey, PitchPosition[]> = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'LB', x: 14, y: 70 },
    { pos: 'CB', x: 37, y: 73 },
    { pos: 'CB', x: 63, y: 73 },
    { pos: 'RB', x: 86, y: 70 },
    { pos: 'CM', x: 28, y: 50 },
    { pos: 'CM', x: 50, y: 46 },
    { pos: 'CM', x: 72, y: 50 },
    { pos: 'LW', x: 16, y: 24 },
    { pos: 'ST', x: 50, y: 17 },
    { pos: 'RW', x: 84, y: 24 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'LB', x: 14, y: 70 },
    { pos: 'CB', x: 37, y: 73 },
    { pos: 'CB', x: 63, y: 73 },
    { pos: 'RB', x: 86, y: 70 },
    { pos: 'LM', x: 14, y: 47 },
    { pos: 'CM', x: 37, y: 49 },
    { pos: 'CM', x: 63, y: 49 },
    { pos: 'RM', x: 86, y: 47 },
    { pos: 'ST', x: 37, y: 19 },
    { pos: 'ST', x: 63, y: 19 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'LB', x: 14, y: 70 },
    { pos: 'CB', x: 37, y: 73 },
    { pos: 'CB', x: 63, y: 73 },
    { pos: 'RB', x: 86, y: 70 },
    { pos: 'CDM', x: 37, y: 57 },
    { pos: 'CDM', x: 63, y: 57 },
    { pos: 'LW', x: 18, y: 37 },
    { pos: 'CAM', x: 50, y: 39 },
    { pos: 'RW', x: 82, y: 37 },
    { pos: 'ST', x: 50, y: 17 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'CB', x: 25, y: 73 },
    { pos: 'CB', x: 50, y: 75 },
    { pos: 'CB', x: 75, y: 73 },
    { pos: 'LM', x: 10, y: 48 },
    { pos: 'CM', x: 32, y: 50 },
    { pos: 'CDM', x: 50, y: 53 },
    { pos: 'CM', x: 68, y: 50 },
    { pos: 'RM', x: 90, y: 48 },
    { pos: 'ST', x: 37, y: 19 },
    { pos: 'ST', x: 63, y: 19 },
  ],
  '5-3-2': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'LB', x: 8, y: 62 },
    { pos: 'CB', x: 28, y: 73 },
    { pos: 'CB', x: 50, y: 75 },
    { pos: 'CB', x: 72, y: 73 },
    { pos: 'RB', x: 92, y: 62 },
    { pos: 'CM', x: 30, y: 48 },
    { pos: 'CM', x: 50, y: 44 },
    { pos: 'CM', x: 70, y: 48 },
    { pos: 'ST', x: 37, y: 19 },
    { pos: 'ST', x: 63, y: 19 },
  ],
  '4-1-4-1': [
    { pos: 'GK', x: 50, y: 88 },
    { pos: 'LB', x: 14, y: 70 },
    { pos: 'CB', x: 37, y: 73 },
    { pos: 'CB', x: 63, y: 73 },
    { pos: 'RB', x: 86, y: 70 },
    { pos: 'CDM', x: 50, y: 58 },
    { pos: 'LM', x: 12, y: 40 },
    { pos: 'CM', x: 32, y: 43 },
    { pos: 'CM', x: 68, y: 43 },
    { pos: 'RM', x: 88, y: 40 },
    { pos: 'ST', x: 50, y: 17 },
  ],
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
// Player data generation
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
  'Skirunar', 'Martinez', 'Neuer', 'Navas', 'Lloris',
  'Laporte', 'Dias', 'Konate', 'Ake', 'Colwill', 'Cresswell',
  'Odegaard', 'Alexander-Arnold', 'James', 'White', 'Stones',
];

interface FormationPlayer {
  id: string;
  number: number;
  name: string;
  position: Position;
  ovr: number;
  keyStats: [string, number, string, number]; // [stat1Label, stat1Val, stat2Label, stat2Val]
  isUser: boolean;
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

function getKeyStatsForPosition(pos: Position, rng: () => number): [string, number, string, number] {
  const r = () => Math.floor(rng() * 20) + 70;
  switch (pos) {
    case 'GK': return ['DIV', r(), 'REF', r()];
    case 'CB': return ['DEF', r(), 'PHY', r()];
    case 'LB': case 'RB': return ['PAC', r(), 'DEF', r()];
    case 'CDM': return ['DEF', r(), 'PAS', r()];
    case 'CM': return ['PAS', r(), 'DRI', r()];
    case 'CAM': return ['PAS', r(), 'SHO', r()];
    case 'LW': case 'RW': return ['PAC', r(), 'DRI', r()];
    case 'LM': case 'RM': return ['PAC', r(), 'PAS', r()];
    case 'ST': case 'CF': return ['SHO', r(), 'PHY', r()];
    default: return ['PAS', r(), 'SHO', r()];
  }
}

function generateFormationSquad(
  clubName: string,
  userName: string,
  userPosition: Position,
  userOvr: number,
  formation: FormationKey,
): FormationPlayer[] {
  const baseSeed = hashString(clubName + userName + formation);
  const rng = createSeededRandom(baseSeed);
  const positions = FORMATION_POSITIONS[formation];

  // Find best slot for user
  let userSlotIndex = 0;
  for (let i = 0; i < positions.length; i++) {
    if (positions[i].pos === userPosition) { userSlotIndex = i; break; }
  }
  if (positions[userSlotIndex]?.pos === 'GK' && userPosition !== 'GK') {
    userSlotIndex = positions.findIndex(p => p.pos !== 'GK') || 1;
  }

  const players: FormationPlayer[] = [];
  const usedNumbers = new Set([10]);

  for (let i = 0; i < 11; i++) {
    if (i === userSlotIndex) {
      const stats = getKeyStatsForPosition(userPosition, rng);
      players.push({
        id: 'user',
        number: 10,
        name: userName,
        position: userPosition,
        ovr: userOvr,
        keyStats: stats,
        isUser: true,
      });
      usedNumbers.add(10);
      continue;
    }

    const pitchPos = positions[i];
    const compatPositions = getCompatiblePositions(pitchPos.pos);
    const selectedPos = compatPositions[Math.floor(rng() * compatPositions.length)];

    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

    let num = Math.floor(rng() * 30) + 1;
    while (usedNumbers.has(num)) num = Math.floor(rng() * 30) + 1;
    usedNumbers.add(num);

    const ovr = Math.max(55, Math.min(95, userOvr + Math.floor((rng() - 0.5) * 20)));
    const stats = getKeyStatsForPosition(selectedPos, rng);

    players.push({
      id: `gen-${i}`,
      number: num,
      name: `${firstName} ${lastName}`,
      position: selectedPos,
      ovr,
      keyStats: stats,
      isUser: false,
    });
  }

  return players;
}

// ============================================================
// Position color helpers
// ============================================================

function getPositionColor(pos: Position): { bg: string; text: string; border: string } {
  const group = getCompatiblePositions(pos)[0];
  switch (group) {
    case 'GK': return { bg: AMBER_BG, text: AMBER_TEXT, border: 'border-amber-500/30' };
    case 'CB': case 'LB': case 'RB': return { bg: SKY_BG, text: SKY_TEXT, border: 'border-sky-500/30' };
    case 'CDM': case 'CM': case 'CAM': case 'LM': case 'RM':
      return { bg: EMERALD_BG, text: EMERALD, border: EMERALD_BORDER };
    case 'LW': case 'RW': case 'ST': case 'CF':
      return { bg: RED_BG, text: RED_TEXT, border: 'border-red-500/30' };
    default: return { bg: EMERALD_BG, text: EMERALD, border: EMERALD_BORDER };
  }
}

function getPositionGroup(pos: Position): string {
  switch (pos) {
    case 'GK': return 'GK';
    case 'CB': case 'LB': case 'RB': return 'DEF';
    case 'CDM': case 'CM': case 'CAM': case 'LM': case 'RM': return 'MID';
    case 'LW': case 'RW': case 'ST': case 'CF': return 'FWD';
    default: return 'MID';
  }
}

function getOvrColor(ovr: number): string {
  if (ovr >= 85) return EMERALD;
  if (ovr >= 75) return AMBER_TEXT;
  if (ovr >= 65) return TEXT_PRIMARY;
  return TEXT_SECONDARY;
}

// ============================================================
// Formation stats calculation
// ============================================================

function calculateFormationStats(players: FormationPlayer[]): {
  attack: number;
  midfield: number;
  defense: number;
} {
  let attackTotal = 0;
  let attackCount = 0;
  let midTotal = 0;
  let midCount = 0;
  let defTotal = 0;
  let defCount = 0;

  for (const p of players) {
    const group = getPositionGroup(p.position);
    switch (group) {
      case 'FWD': attackTotal += p.ovr; attackCount++; break;
      case 'MID': midTotal += p.ovr; midCount++; break;
      case 'DEF': defTotal += p.ovr; defCount++; break;
      case 'GK': defTotal += p.ovr * 0.5; defCount += 0.5; break;
    }
  }

  return {
    attack: attackCount > 0 ? Math.round(attackTotal / attackCount) : 0,
    midfield: midCount > 0 ? Math.round(midTotal / midCount) : 0,
    defense: defCount > 0 ? Math.round(defTotal / defCount) : 0,
  };
}

// ============================================================
// Opponent formation derivation
// ============================================================

function deriveOpponentFormation(reputation: number): FormationKey {
  if (reputation >= 85) return '4-3-3';
  if (reputation >= 70) return '4-2-3-1';
  if (reputation >= 55) return '4-4-2';
  return '5-3-2';
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

// Stats progress bar
function StatsBar({
  label,
  value,
  maxVal = 99,
  color = 'emerald',
}: {
  label: string;
  value: number;
  maxVal?: number;
  color?: 'emerald' | 'amber' | 'red' | 'sky';
}) {
  const pct = Math.round((value / maxVal) * 100);
  const barColor =
    color === 'emerald' ? 'bg-emerald-500' :
    color === 'amber' ? 'bg-amber-500' :
    color === 'red' ? 'bg-red-500' :
    'bg-sky-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${TEXT_PRIMARY}`}>{label}</span>
        <span className={`text-xs font-bold tabular-nums ${TEXT_PRIMARY}`}>{value}</span>
      </div>
      <div className="h-2 w-full bg-[#21262d] rounded-lg overflow-hidden">
        <motion.div
          className={`h-full ${barColor} rounded-lg`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// SVG Pitch component
// ============================================================

function PitchSVG({ children, mirrored }: { children: React.ReactNode; mirrored?: boolean }) {
  return (
    <div className={`relative w-full ${mirrored ? '' : ''}`} style={{ aspectRatio: '340 / 220' }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={mirrored ? '0 0 340 220' : '0 0 340 220'}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Pitch background */}
        <rect x="0" y="0" width="340" height="220" fill="#1a472a" rx="6" />

        {/* Outer border */}
        <rect
          x="6" y="6" width="328" height="208"
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"
        />

        {/* Halfway line */}
        <line x1="6" y1="110" x2="334" y2="110" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

        {/* Center circle */}
        <circle cx="170" cy="110" r="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="170" cy="110" r="2.5" fill="rgba(255,255,255,0.3)" />

        {/* Top penalty area */}
        <rect x="85" y="6" width="170" height="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Top goal area */}
        <rect x="125" y="6" width="90" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Top penalty spot */}
        <circle cx="170" cy="33" r="2" fill="rgba(255,255,255,0.3)" />
        {/* Top penalty arc */}
        <path d="M 148 44 A 28 28 0 0 0 192 44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

        {/* Bottom penalty area */}
        <rect x="85" y="176" width="170" height="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Bottom goal area */}
        <rect x="125" y="198" width="90" height="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        {/* Bottom penalty spot */}
        <circle cx="170" cy="187" r="2" fill="rgba(255,255,255,0.3)" />
        {/* Bottom penalty arc */}
        <path d="M 148 176 A 28 28 0 0 1 192 176" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

        {/* Corner arcs */}
        <path d="M 6 16 A 10 10 0 0 1 16 6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <path d="M 324 6 A 10 10 0 0 1 334 16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <path d="M 6 204 A 10 10 0 0 0 16 214" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <path d="M 324 214 A 10 10 0 0 0 334 204" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

        {/* Center line dash accents */}
        <line x1="6" y1="110" x2="20" y2="110" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <line x1="320" y1="110" x2="334" y2="110" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
      </svg>

      {/* Player positions overlay */}
      {children}
    </div>
  );
}

// Player dot on the pitch (SVG-based)
function PitchPlayerDot({
  player,
  x,
  y,
  isUser,
  selected,
  onClick,
}: {
  player: FormationPlayer;
  x: number;
  y: number;
  isUser: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const posColor = getPositionColor(player.position);

  return (
    <motion.div
      variants={staggerChild}
      className="absolute flex flex-col items-center cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      onClick={onClick}
    >
      {/* Position dot — 24px, so rounded-full is allowed */}
      <div
        className="relative"
        style={{ width: 28, height: 28 }}
      >
        {selected && (
          <div
            className="absolute inset-0 rounded-lg border-2 border-emerald-400"
            style={{
              boxShadow: '0 0 8px rgba(16,185,129,0.5)',
            }}
          />
        )}
        <div
          className="flex items-center justify-center rounded-lg border"
          style={{
            width: 28,
            height: 28,
            backgroundColor: isUser
              ? 'rgba(16,185,129,0.35)'
              : posColor.bg.replace('bg-', '').includes('sky')
                ? 'rgba(56,189,248,0.15)'
                : posColor.bg.replace('bg-', '').includes('amber')
                  ? 'rgba(245,158,11,0.15)'
                  : posColor.bg.replace('bg-', '').includes('red')
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(16,185,129,0.15)',
            borderColor: isUser
              ? 'rgba(16,185,129,0.6)'
              : posColor.border.replace('border-', '').includes('sky')
                ? 'rgba(56,189,248,0.3)'
                : posColor.border.replace('border-', '').includes('amber')
                  ? 'rgba(245,158,11,0.3)'
                  : posColor.border.replace('border-', '').includes('red')
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(16,185,129,0.3)',
            borderWidth: 1.5,
          }}
        >
          <span
            className="text-[10px] font-bold"
            style={{
              color: isUser ? '#34d399' : posColor.text.replace('text-', '').includes('sky') ? '#38bdf8' : posColor.text.replace('text-', '').includes('amber') ? '#f59e0b' : posColor.text.replace('text-', '').includes('red') ? '#f87171' : '#34d399',
            }}
          >
            {player.number}
          </span>
        </div>
      </div>

      {/* Name label */}
      <span
        className="text-[8px] font-medium mt-0.5 truncate max-w-[48px] text-center leading-tight"
        style={{
          color: isUser ? '#34d399' : '#8b949e',
        }}
      >
        {player.name.split(' ').pop()}
      </span>
    </motion.div>
  );
}

// ============================================================
// Player detail popup
// ============================================================

function PlayerDetailPopup({
  player,
  onClose,
}: {
  player: FormationPlayer;
  onClose: () => void;
}) {
  const posColor = getPositionColor(player.position);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative w-full max-w-lg mx-4 mb-20 rounded-lg border p-4"
          style={{
            backgroundColor: '#161b22',
            borderColor: '#30363d',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#21262d] transition-colors"
            style={{ color: '#8b949e' }}
          >
            <X className="size-4" />
          </button>

          {/* Player header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg border"
              style={{
                width: 40,
                height: 40,
                backgroundColor: player.isUser ? 'rgba(16,185,129,0.15)' : posColor.bg.includes('sky') ? 'rgba(56,189,248,0.15)' : posColor.bg.includes('amber') ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                borderColor: player.isUser ? 'rgba(16,185,129,0.3)' : posColor.border,
              }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  color: player.isUser ? '#34d399' : posColor.text.includes('sky') ? '#38bdf8' : posColor.text.includes('amber') ? '#f59e0b' : '#34d399',
                }}
              >
                {player.number}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{player.name}</span>
                {player.isUser && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0"
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.15)',
                      color: '#34d399',
                      borderColor: 'rgba(16,185,129,0.3)',
                    }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${TEXT_SECONDARY}`}>{player.position}</span>
                <span className={`text-xs font-bold ${getOvrColor(player.ovr)}`}>OVR {player.ovr}</span>
              </div>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>{player.keyStats[0]}</div>
              <div className="text-lg font-bold text-white">{player.keyStats[1]}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>{player.keyStats[2]}</div>
              <div className="text-lg font-bold text-white">{player.keyStats[3]}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TacticalFormationBoard() {
  const gameState = useGameStore((s) => s.gameState);

  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showOpponent, setShowOpponent] = useState(false);
  
  // Zoom and pan state for pinch-to-zoom
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate team data deterministically
  const squad = useMemo(() => {
    if (!gameState) return [];
    return generateFormationSquad(
      gameState.currentClub.name,
      gameState.player.name,
      gameState.player.position,
      gameState.player.overall,
      formation,
    );
  }, [gameState, formation]);

  // Formation stats
  const formationStats = useMemo(() => {
    return calculateFormationStats(squad);
  }, [squad]);

  // Opponent data
  const opponentData = useMemo(() => {
    if (!gameState) return null;

    const nextFixture = gameState.upcomingFixtures.find(
      (f) =>
        !f.played &&
        (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id) &&
        f.competition === 'league'
    );

    if (!nextFixture) return null;

    const isHome = nextFixture.homeClubId === gameState.currentClub.id;
    const opponentId = isHome ? nextFixture.awayClubId : nextFixture.homeClubId;
    const opponentClub = getClubById(opponentId);
    if (!opponentClub) return null;

    const oppFormation = deriveOpponentFormation(opponentClub.reputation);
    const oppSquad = generateFormationSquad(
      opponentClub.name,
      opponentClub.name,
      'ST',
      opponentClub.squadQuality,
      oppFormation,
    );

    return {
      club: opponentClub,
      formation: oppFormation,
      squad: oppSquad,
      stats: calculateFormationStats(oppSquad),
    };
  }, [gameState, formation]);

  // Selected player
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return squad.find((p) => p.id === selectedPlayerId) ?? null;
  }, [selectedPlayerId, squad]);

  // Positions for current formation
  const positions = FORMATION_POSITIONS[formation];

  const handlePlayerClick = useCallback((id: string) => {
    setSelectedPlayerId((prev) => (prev === id ? null : id));
  }, []);

  // Pinch-to-zoom handler
  const pinchHandler = usePinch(
    ({ origin, da: [d], memo }) => {
      if (!memo) memo = zoom;

      const newZoom = Math.min(Math.max(memo * (1 + d * 0.005), 0.5), 2);
      setZoom(newZoom);
      setIsZooming(true);

      // Show zoom indicator
      setShowZoomIndicator(true);
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      zoomIndicatorTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
        setIsZooming(false);
      }, 1500);
      
      return memo;
    },
    {
      threshold: 0,
      rubberband: true,
    }
  );

  // Drag handler for panning
  const dragHandler = useDrag(
    ({ active, movement: [mx, my], memo }) => {
      if (!active) return;
      
      if (!memo) {
        memo = { ...panOffset };
      }
      
      setPanOffset({ x: memo.x + mx, y: memo.y + my });
      return memo;
    },
    {
      filterTaps: true,
      threshold: 10,
      enabled: zoom !== 1, // Only enable drag when zoomed in
    }
  );

  // Reset zoom function
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setShowZoomIndicator(false);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
  }, []);

  // No game state fallback
  if (!gameState) {
    return (
      <div className={DARK_BG}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-8 text-center`}>
            <LayoutGrid className="size-10 mx-auto mb-3 text-[#8b949e] opacity-40" />
            <h2 className="text-lg font-semibold text-white mb-2">No Career Data</h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              Start a career to view the tactical formation board.
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
          <LayoutGrid className="size-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">Formation Board</h1>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-auto ${EMERALD_BG} ${EMERALD} ${EMERALD_BORDER}`}>
            S{gameState.currentSeason} W{gameState.currentWeek}
          </span>
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
              <span className={`text-xs font-bold ${TEXT_PRIMARY} ml-auto`}>
                {gameState.currentClub.name}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ALL_FORMATIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFormation(f); setSelectedPlayerId(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
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
          {/* 2. Pitch Diagram                              */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="p-2 relative overflow-hidden">
              {/* Zoom indicator overlay */}
              <AnimatePresence>
                {showZoomIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-2 right-2 z-10 bg-[#161b22]/90 backdrop-blur-sm border border-[#30363d] rounded-lg px-3 py-1.5 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">{zoom.toFixed(1)}x</span>
                      <div className="w-16 h-1 bg-[#30363d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-150"
                          style={{ width: `${((zoom - 0.5) / 1.5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset zoom button */}
              {(zoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleResetZoom}
                  className="absolute bottom-2 right-2 z-10 p-2 bg-[#161b22]/90 backdrop-blur-sm border border-[#30363d] rounded-lg hover:border-emerald-500/30 transition-colors shadow-lg"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                </motion.button>
              )}

              <motion.div
                key={formation}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                {...pinchHandler()}
                {...dragHandler()}
                className="cursor-grab active:cursor-grabbing touch-none"
                style={{ touchAction: 'none' }}
              >
                <motion.div
                  animate={{
                    scale: zoom,
                    x: panOffset.x,
                    y: panOffset.y,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ 
                    transformOrigin: 'center center',
                    willChange: 'transform',
                  }}
                >
                  <PitchSVG>
                    {squad.map((player, idx) => (
                      <PitchPlayerDot
                        key={`${formation}-${player.id}`}
                        player={player}
                        x={positions[idx]?.x ?? 50}
                        y={positions[idx]?.y ?? 50}
                        isUser={player.isUser}
                        selected={selectedPlayerId === player.id}
                        onClick={() => handlePlayerClick(player.id)}
                      />
                    ))}
                  </PitchSVG>
                </motion.div>
              </motion.div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-2">
                {[
                  { label: 'GK', color: 'rgba(245,158,11,0.8)' },
                  { label: 'DEF', color: 'rgba(56,189,248,0.8)' },
                  { label: 'MID', color: 'rgba(16,185,129,0.8)' },
                  { label: 'FWD', color: 'rgba(239,68,68,0.8)' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div
                      className="rounded-sm"
                      style={{ width: 8, height: 8, backgroundColor: item.color }}
                    />
                    <span className="text-[9px] font-medium text-[#8b949e]">{item.label}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 3. Formation Stats Panel                      */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Formation Ratings</SectionTitle>
              <div className="space-y-3">
                <StatsBar
                  label="Attack Strength"
                  value={formationStats.attack}
                  color="red"
                />
                <StatsBar
                  label="Midfield Control"
                  value={formationStats.midfield}
                  color="emerald"
                />
                <StatsBar
                  label="Defensive Solidity"
                  value={formationStats.defense}
                  color="sky"
                />
              </div>

              {/* Overall */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#30363d]">
                <span className={`text-xs font-medium ${TEXT_SECONDARY}`}>Overall Team Rating</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {squad.length > 0 ? Math.round(squad.reduce((s, p) => s + p.ovr, 0) / squad.length) : 0}
                  </span>
                  <Star className="size-3.5 text-amber-400" />
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 4. Player List                               */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard>
              <SectionTitle>Starting XI</SectionTitle>
              <div className="space-y-1.5 max-h-96 overflow-y-auto overscroll-contain">
                {squad.map((player) => {
                  const posColor = getPositionColor(player.position);
                  const isSelected = selectedPlayerId === player.id;

                  return (
                    <motion.div
                      key={player.id}
                      variants={staggerChild}
                      onClick={() => handlePlayerClick(player.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        player.isUser
                          ? `${EMERALD_BG} ${EMERALD_BORDER} border`
                          : isSelected
                            ? 'bg-[#1c2333] border-emerald-500/20'
                            : 'bg-[#0d1117]/60 border-transparent hover:bg-[#21262d] hover:border-[#30363d]'
                      }`}
                    >
                      {/* Number */}
                      <span
                        className="w-5 text-center text-xs font-bold shrink-0"
                        style={{ color: player.isUser ? '#34d399' : '#484f58' }}
                      >
                        {player.number}
                      </span>

                      {/* Position badge */}
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0"
                        style={{
                          backgroundColor: posColor.bg.includes('sky') ? 'rgba(56,189,248,0.15)' : posColor.bg.includes('amber') ? 'rgba(245,158,11,0.15)' : posColor.bg.includes('red') ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          color: posColor.text.includes('sky') ? '#38bdf8' : posColor.text.includes('amber') ? '#f59e0b' : posColor.text.includes('red') ? '#f87171' : '#34d399',
                          borderColor: posColor.border.includes('sky') ? 'rgba(56,189,248,0.3)' : posColor.border.includes('amber') ? 'rgba(245,158,11,0.3)' : posColor.border.includes('red') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
                        }}
                      >
                        {player.position}
                      </span>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${player.isUser ? 'text-emerald-300' : 'text-white'}`}>
                            {player.name}
                          </span>
                          {player.isUser && (
                            <span className="text-[8px] font-bold px-1 py-px rounded shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                              YOU
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Key stat 1 */}
                      <span className="text-[10px] text-[#8b949e] hidden sm:block w-10 text-right">
                        {player.keyStats[0]} <span className="text-white font-medium">{player.keyStats[1]}</span>
                      </span>

                      {/* Key stat 2 */}
                      <span className="text-[10px] text-[#8b949e] hidden sm:block w-10 text-right">
                        {player.keyStats[2]} <span className="text-white font-medium">{player.keyStats[3]}</span>
                      </span>

                      {/* OVR */}
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${getOvrColor(player.ovr)}`}>
                        {player.ovr}
                      </span>

                      {/* Chevron */}
                      <ChevronRight className="size-3 text-[#484f58] shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 5. Opponent Preview                          */}
          {/* ============================================ */}
          {opponentData && (
            <motion.div variants={staggerChild}>
              <InfoCard className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionTitle>Opponent Preview</SectionTitle>
                  <button
                    onClick={() => setShowOpponent(!showOpponent)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      showOpponent
                        ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
                        : 'bg-[#21262d] text-[#8b949e] border border-transparent hover:text-[#c9d1d9]'
                    }`}
                  >
                    {showOpponent ? 'Hide' : 'Show'}
                    <Swords className="size-3" />
                  </button>
                </div>

                {/* Opponent header */}
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                  <span className="text-xl">{opponentData.club.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{opponentData.club.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#8b949e]">Formation</span>
                      <span className="text-xs font-bold text-white">{opponentData.formation}</span>
                      <span className="text-[10px] text-[#8b949e] ml-2">OVR</span>
                      <span className={`text-xs font-bold ${getOvrColor(opponentData.club.squadQuality)}`}>
                        {opponentData.club.squadQuality}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-[#484f58]" />
                </div>

                {/* Opponent stats comparison */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                    <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>ATK</div>
                    <div className="text-sm font-bold text-white">
                      {formationStats.attack}
                      <span className="text-[10px] text-[#484f58] mx-0.5">vs</span>
                      <span className="text-red-400">{opponentData.stats.attack}</span>
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                    <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>MID</div>
                    <div className="text-sm font-bold text-white">
                      {formationStats.midfield}
                      <span className="text-[10px] text-[#484f58] mx-0.5">vs</span>
                      <span className="text-emerald-400">{opponentData.stats.midfield}</span>
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                    <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>DEF</div>
                    <div className="text-sm font-bold text-white">
                      {formationStats.defense}
                      <span className="text-[10px] text-[#484f58] mx-0.5">vs</span>
                      <span className="text-sky-400">{opponentData.stats.defense}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded opponent pitch view */}
                <AnimatePresence>
                  {showOpponent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
                          {opponentData.club.name} — {opponentData.formation}
                        </span>
                      </div>
                      <PitchSVG mirrored>
                        {opponentData.squad.map((player, idx) => {
                          const oppPositions = FORMATION_POSITIONS[opponentData.formation];
                          return (
                            <PitchPlayerDot
                              key={`opp-${player.id}`}
                              player={player}
                              x={oppPositions[idx]?.x ?? 50}
                              y={oppPositions[idx]?.y ?? 50}
                              isUser={false}
                              selected={false}
                              onClick={() => {}}
                            />
                          );
                        })}
                      </PitchSVG>
                    </motion.div>
                  )}
                </AnimatePresence>
              </InfoCard>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Player detail popup */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetailPopup
            player={selectedPlayer}
            onClose={() => setSelectedPlayerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
