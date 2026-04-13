'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { CLUBS, LEAGUES } from '@/lib/game/clubsData';
import { Position } from '@/lib/game/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Plus, RotateCcw, Star, Zap, Shield, Swords,
  TrendingUp, Undo2, Save, Shuffle, ArrowRightLeft,
  Search, Trophy, Flame, ChevronDown, ChevronUp,
  Activity, BarChart3, Heart, Target
} from 'lucide-react';

// ============================================================
// Constants & Types
// ============================================================

type DraftType = 'quick' | 'full' | 'fantasy_xi';
type LeagueFilter = 'all' | 'premier_league' | 'la_liga' | 'serie_a' | 'bundesliga' | 'ligue_1';
type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';
type SortOption = 'ovr_desc' | 'name_asc' | 'age_asc';

interface DraftPlayer {
  id: string;
  name: string;
  position: Position;
  overall: number;
  age: number;
  nationality: string;
  flag: string;
  clubName: string;
  clubShortName: string;
  clubLogo: string;
  league: string;
  cost: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
}

interface DraftPick {
  pickNumber: number;
  player: DraftPlayer;
  slotId: string;
  budgetSpent: number;
  timestamp: string;
}

interface FormationSlot {
  id: string;
  pos: Position;
  label: string;
  x: number;
  y: number;
}

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';

const POSITION_COLORS: Record<string, string> = {
  GK: '#FBBF24',
  CB: '#3B82F6', LB: '#3B82F6', RB: '#3B82F6',
  CDM: '#22C55E', CM: '#22C55E', CAM: '#22C55E', LM: '#22C55E', RM: '#22C55E',
  LW: '#EF4444', RW: '#EF4444', ST: '#EF4444', CF: '#EF4444',
};

const POSITION_BORDER_COLORS: Record<string, string> = {
  GK: 'border-l-yellow-400',
  CB: 'border-l-blue-400', LB: 'border-l-blue-400', RB: 'border-l-blue-400',
  CDM: 'border-l-green-400', CM: 'border-l-green-400', CAM: 'border-l-green-400', LM: 'border-l-green-400', RM: 'border-l-green-400',
  LW: 'border-l-red-400', RW: 'border-l-red-400', ST: 'border-l-red-400', CF: 'border-l-red-400',
};

const POSITION_CATEGORY: Record<string, PositionFilter> = {
  GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD', CF: 'FWD',
};

const FORMATION_SLOTS_433: FormationSlot[] = [
  { id: 'gk', pos: 'GK', label: 'GK', x: 50, y: 88 },
  { id: 'lb', pos: 'LB', label: 'LB', x: 12, y: 68 },
  { id: 'cb1', pos: 'CB', label: 'CB', x: 37, y: 64 },
  { id: 'cb2', pos: 'CB', label: 'CB', x: 63, y: 64 },
  { id: 'rb', pos: 'RB', label: 'RB', x: 88, y: 68 },
  { id: 'cdm', pos: 'CDM', label: 'CDM', x: 50, y: 48 },
  { id: 'cm1', pos: 'CM', label: 'CM', x: 25, y: 38 },
  { id: 'cm2', pos: 'CM', label: 'CM', x: 75, y: 38 },
  { id: 'lw', pos: 'LW', label: 'LW', x: 12, y: 18 },
  { id: 'st', pos: 'ST', label: 'ST', x: 50, y: 12 },
  { id: 'rw', pos: 'RW', label: 'RW', x: 88, y: 18 },
];

const BUDGET_BY_TYPE: Record<DraftType, number> = {
  quick: 500,
  full: 1000,
  fantasy_xi: 800,
};

const MAX_SLOTS_BY_TYPE: Record<DraftType, number> = {
  quick: 11,
  full: 23,
  fantasy_xi: 11,
};

const LEAGUE_OPTIONS: { value: LeagueFilter; label: string }[] = [
  { value: 'all', label: 'All Leagues' },
  { value: 'premier_league', label: 'Premier League' },
  { value: 'la_liga', label: 'La Liga' },
  { value: 'serie_a', label: 'Serie A' },
  { value: 'bundesliga', label: 'Bundesliga' },
  { value: 'ligue_1', label: 'Ligue 1' },
];

// ============================================================
// Deterministic seeded random
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ============================================================
// Deterministic player name data
// ============================================================
const NAME_DATA: Record<string, { first: string[]; last: string[]; flag: string }> = {
  England: {
    flag: '\u{1D3F}\u{200D}\u{1D3F}\u{200D}\u{1D3F}\u{200D}\u{1D3F}',
    first: ['James', 'Harry', 'Jack', 'Oliver', 'Charlie', 'Thomas', 'George', 'Marcus', 'Ben', 'Luke', 'Aaron', 'Mason', 'Ryan', 'Joe', 'Callum', 'Ethan', 'Daniel', 'Alexander', 'William', 'Declan'],
    last: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Thompson', 'White', 'Hall', 'Green', 'Harris', 'Martin', 'Clarke', 'Cooper'],
  },
  Spain: {
    flag: '\u{1F1EA}\u{1F1F8}',
    first: ['Carlos', 'Diego', 'Fernando', 'Javier', 'Marc', 'Pedro', 'Sergio', 'Pablo', 'Miguel', 'Alejandro', 'Raul', 'Iker', 'Gerard', 'Santi', 'Dani', 'Jorge', 'Hugo', 'Ivan', 'Alvaro', 'Nico'],
    last: ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Herrera', 'Morales', 'Jimenez', 'Ruiz', 'Romero', 'Navarro', 'Molina', 'Ortiz', 'Castillo'],
  },
  Italy: {
    flag: '\u{1F1EE}\u{1F1F9}',
    first: ['Marco', 'Lorenzo', 'Andrea', 'Matteo', 'Federico', 'Luca', 'Stefano', 'Alessandro', 'Gianluigi', 'Riccardo', 'Davide', 'Niccolo', 'Simone', 'Antonio', 'Fabio', 'Emanuele', 'Filippo', 'Giuseppe', 'Tommaso', 'Giacomo'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri'],
  },
  Germany: {
    flag: '\u{1F1E9}\u{1F1EA}',
    first: ['Lukas', 'Leon', 'Maximilian', 'Jonas', 'Felix', 'Tim', 'Kai', 'Julian', 'Niklas', 'Florian', 'Marcel', 'Denis', 'Bastian', 'Manuel', 'Toni', 'Kevin', 'Sven', 'Mario', 'Thomas', 'Christoph'],
    last: ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Klein', 'Schroder', 'Neumann', 'Schwarz', 'Zimmermann', 'Kruger', 'Hartmann'],
  },
  France: {
    flag: '\u{1F1EB}\u{1F1F7}',
    first: ['Antoine', 'Kylian', 'Ousmane', 'Raphael', 'Hugo', 'Paul', 'Adrien', 'Corentin', 'Lucas', 'Theo', 'Olivier', 'Nabil', 'Moussa', 'Aurelien', 'Eduardo', 'Jules', 'Axel', 'Jean', 'Dayot', 'Ibrahima'],
    last: ['Martin', 'Bernard', 'Dubois', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Girard', 'Roux', 'Fournier', 'Morel', 'Blanc', 'Guerin'],
  },
};

const FALLBACK_NAME = {
  flag: '\u{1F30D}',
  first: ['Alex', 'Victor', 'Bruno', 'Rafael', 'David', 'Samuel', 'Gabriel', 'Lucas', 'Vinicius', 'Pedro'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Nascimento'],
};

// ============================================================
// Generate deterministic player pool from clubs
// ============================================================
function generatePlayerPool(): DraftPlayer[] {
  const players: DraftPlayer[] = [];
  const positions: Position[] = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'ST', 'CF', 'LM', 'RM'];
  let seedCounter = 0;

  const sortedClubs = [...CLUBS].sort((a, b) => b.reputation - a.reputation);
  const topClubs = sortedClubs.slice(0, 28);

  for (let ci = 0; ci < topClubs.length; ci++) {
    const club = topClubs[ci];
    const playersPerClub = club.reputation > 85 ? 3 : club.reputation > 70 ? 2 : 1;
    const nameData = NAME_DATA[club.country] || FALLBACK_NAME;

    for (let pi = 0; pi < playersPerClub; pi++) {
      seedCounter++;
      const r1 = seededRandom(seedCounter * 7 + ci);
      const r2 = seededRandom(seedCounter * 13 + pi);
      const r3 = seededRandom(seedCounter * 19 + ci * pi);
      const r4 = seededRandom(seedCounter * 23 + ci + pi);

      const posIdx = Math.floor(r1 * positions.length);
      const pos = positions[posIdx];
      const firstIdx = Math.floor(r2 * nameData.first.length);
      const lastIdx = Math.floor(r3 * nameData.last.length);
      const firstName = nameData.first[firstIdx];
      const lastName = nameData.last[lastIdx];

      const baseOvr = club.squadQuality || 70;
      const ovrVariance = Math.floor(r4 * 12) - 4;
      const overall = Math.max(55, Math.min(96, baseOvr + ovrVariance));
      const age = Math.floor(seededRandom(seedCounter * 31) * 14) + 19;
      const cost = Math.round((overall - 50) * 4.5 + seededRandom(seedCounter * 37) * 20);

      const posCat = POSITION_CATEGORY[pos] || 'MID';
      const attrBase = overall + Math.floor(seededRandom(seedCounter * 41) * 8) - 4;
      const getAttr = (s: number) => Math.max(40, Math.min(98, attrBase + Math.floor(seededRandom(seedCounter * s) * 16) - 8));

      players.push({
        id: `dp-${ci}-${pi}`,
        name: `${firstName} ${lastName}`,
        position: pos,
        overall,
        age,
        nationality: club.country,
        flag: nameData.flag,
        clubName: club.name,
        clubShortName: club.shortName,
        clubLogo: club.logo,
        league: club.league,
        cost: Math.max(10, cost),
        pace: posCat === 'FWD' ? getAttr(43) : posCat === 'DEF' ? getAttr(47) : getAttr(53),
        shooting: posCat === 'FWD' ? getAttr(59) : posCat === 'GK' ? 15 : getAttr(61),
        passing: posCat === 'MID' ? getAttr(67) : getAttr(71),
        defending: posCat === 'DEF' ? getAttr(73) : posCat === 'GK' ? 20 : getAttr(79),
        physical: getAttr(83),
      });
    }
  }

  return players;
}

// Pre-generate the player pool (deterministic, stable)
const PLAYER_POOL = generatePlayerPool();

// ============================================================
// OVR Color
// ============================================================
function getOvrColor(ovr: number): string {
  if (ovr >= 85) return 'text-yellow-400';
  if (ovr >= 75) return 'text-green-400';
  if (ovr >= 65) return 'text-[#c9d1d9]';
  return 'text-[#8b949e]';
}

function getOvrBg(ovr: number): string {
  if (ovr >= 85) return 'bg-yellow-400/10 border-yellow-400/30';
  if (ovr >= 75) return 'bg-green-400/10 border-green-400/30';
  if (ovr >= 65) return 'bg-[#21262d] border-[#30363d]';
  return 'bg-[#161b22] border-[#30363d]';
}

// ============================================================
// SVG Budget Bar Component
// ============================================================
function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const remaining = total - spent;
  const barWidth = 200;
  const fillWidth = (pct / 100) * barWidth;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs ${TEXT_SECONDARY}`}>Budget</span>
        <span className="text-xs font-semibold text-[#c9d1d9]">
          €{remaining}M / €{total}M
        </span>
      </div>
      <svg viewBox={`0 0 ${barWidth} 10`} className="w-full" style={{ maxWidth: barWidth }}>
        <rect x="0" y="0" width={barWidth} height="10" rx="3" fill="#21262d" />
        <rect x="0" y="0" width={fillWidth} height="10" rx="3" fill={pct > 90 ? '#EF4444' : pct > 70 ? '#FBBF24' : '#22C55E'} />
        {[25, 50, 75].map(v => (
          <line key={v} x1={(v / 100) * barWidth} y1="0" x2={(v / 100) * barWidth} y2="10" stroke="#30363d" strokeWidth="0.5" />
        ))}
      </svg>
      <span className={`text-[10px] ${pct > 90 ? 'text-red-400' : TEXT_SECONDARY}`}>
        {pct.toFixed(0)}% used
      </span>
    </div>
  );
}

// ============================================================
// SVG Chemistry Ring Chart
// ============================================================
function ChemistryRing({ score }: { score: number }) {
  const r = 32;
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#FBBF24' : '#EF4444';

  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="700">{score}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7">CHEM</text>
    </svg>
  );
}

// ============================================================
// SVG Star Rating
// ============================================================
function StarRating({ rating }: { rating: number }) {
  const stars = 5;
  const filled = Math.round(rating);

  return (
    <svg viewBox="0 0 120 24" className="w-30 h-6">
      {Array.from({ length: stars }).map((_, i) => (
        <path key={i} d={`M${i * 24 + 12},2 L${i * 24 + 14.5},9 L${i * 24 + 22},9 L${i * 24 + 16.5},14 L${i * 24 + 18.5},21 L${i * 24 + 12},17 L${i * 24 + 5.5},21 L${i * 24 + 7.5},14 L${i * 24 + 2},9 L${i * 24 + 9.5},9 Z`}
          fill={i < filled ? '#FBBF24' : '#30363d'} />
      ))}
    </svg>
  );
}

// ============================================================
// SVG Attribute Bar Chart
// ============================================================
function AttributeBarChart({ attributes, label }: { attributes: { label: string; value: number; color: string }[]; label?: string }) {
  const maxVal = 100;
  const barH = 14;
  const gap = 6;
  const labelW = 56;
  const valueW = 24;
  const barMaxW = 120;
  const totalH = attributes.length * (barH + gap) - gap;

  return (
    <svg viewBox={`0 0 ${labelW + barMaxW + valueW + 12} ${totalH + 20}`} className="w-full">
      {label && <text x={4} y={10} fill="#8b949e" fontSize="8" fontWeight="600">{label.toUpperCase()}</text>}
      {attributes.map((attr, i) => {
        const y = i * (barH + gap) + 18;
        const barW = (attr.value / maxVal) * barMaxW;
        return (
          <g key={attr.label}>
            <text x={4} y={y + barH - 3} fill="#8b949e" fontSize="8">{attr.label}</text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx="3" fill="#21262d" />
            <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill={attr.color} />
            <text x={labelW + barMaxW + 4} y={y + barH - 3} fill="#c9d1d9" fontSize="8" fontWeight="600">{attr.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG Grouped Bar Chart (Dream Team Comparison)
// ============================================================
function ComparisonBarChart({ yourTeam, opponent, labels }: {
  yourTeam: number[];
  opponent: number[];
  labels: string[];
}) {
  const maxVal = 100;
  const barH = 12;
  const gap = 8;
  const labelW = 40;
  const barMaxW = 55;
  const totalH = labels.length * (barH * 2 + gap * 2 + 4) - gap;

  return (
    <svg viewBox={`0 0 ${labelW + barMaxW * 2 + 40} ${totalH + 16}`} className="w-full">
      {/* Legend */}
      <rect x={labelW} y={2} width={8} height={8} rx="1" fill="#22C55E" />
      <text x={labelW + 12} y={9} fill="#8b949e" fontSize="7">Your Draft</text>
      <rect x={labelW + 60} y={2} width={8} height={8} rx="1" fill="#3B82F6" />
      <text x={labelW + 72} y={9} fill="#8b949e" fontSize="7">Real Team</text>
      {labels.map((lbl, i) => {
        const yBase = i * (barH * 2 + gap * 2 + 4) + 18;
        const yw = (yourTeam[i] / maxVal) * barMaxW;
        const yo = (opponent[i] / maxVal) * barMaxW;
        return (
          <g key={lbl}>
            <text x={2} y={yBase + barH - 1} fill="#c9d1d9" fontSize="8" fontWeight="500">{lbl}</text>
            <rect x={labelW} y={yBase} width={barMaxW} height={barH} rx="2" fill="#21262d" />
            <rect x={labelW} y={yBase} width={yw} height={barH} rx="2" fill="#22C55E" />
            <text x={labelW + barMaxW + 3} y={yBase + barH - 1} fill="#22C55E" fontSize="7">{yourTeam[i]}</text>
            <rect x={labelW} y={yBase + barH + 3} width={barMaxW} height={barH} rx="2" fill="#21262d" />
            <rect x={labelW} y={yBase + barH + 3} width={yo} height={barH} rx="2" fill="#3B82F6" />
            <text x={labelW + barMaxW + 3} y={yBase + barH * 2 + 2} fill="#3B82F6" fontSize="7">{opponent[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG Win Probability Donut
// ============================================================
function WinProbabilityDonut({ winPct }: { winPct: number }) {
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (winPct / 100) * circumference;
  const color = winPct >= 60 ? '#22C55E' : winPct >= 40 ? '#FBBF24' : '#EF4444';

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="700">{winPct}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7">WIN</text>
    </svg>
  );
}

// ============================================================
// Draft Setup Panel
// ============================================================
function DraftSetupPanel({
  draftType,
  setDraftType,
  leagueFilter,
  setLeagueFilter,
  budget,
  budgetSpent,
  onStart,
  onAutoFill,
  draftedCount,
}: {
  draftType: DraftType;
  setDraftType: (t: DraftType) => void;
  leagueFilter: LeagueFilter;
  setLeagueFilter: (f: LeagueFilter) => void;
  budget: number;
  budgetSpent: number;
  onStart: () => void;
  onAutoFill: () => void;
  draftedCount: number;
}) {
  const maxSlots = MAX_SLOTS_BY_TYPE[draftType];
  const gameState = useGameStore(s => s.gameState);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Draft Board Header SVG */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <svg viewBox="0 0 400 50" className="w-full">
          <rect x="0" y="0" width="400" height="50" rx="8" fill="#0d1117" />
          <text x="20" y="30" fill="#c9d1d9" fontSize="16" fontWeight="700">FANTASY DRAFT</text>
          <text x="20" y="44" fill="#8b949e" fontSize="9">Build your dream team</text>
          {/* Team logo area */}
          <circle cx="360" cy="25" r="18" fill="#21262d" stroke="#30363d" strokeWidth="1" />
          <text x="360" y="30" textAnchor="middle" fontSize="16">{gameState?.currentClub?.logo || '\u26BD'}</text>
          <text x="310" y="20" textAnchor="end" fill="#8b949e" fontSize="8">YOUR CLUB</text>
          <text x="310" y="33" textAnchor="end" fill="#c9d1d9" fontSize="10" fontWeight="600">
            {gameState?.currentClub?.shortName || 'CLB'}
          </text>
        </svg>
      </div>

      {/* Draft Type Selector */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 space-y-3`}>
        <h3 className={`text-sm font-semibold ${TEXT_PRIMARY}`}>Draft Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {([['quick', 'Quick Draft', '11 players'], ['full', 'Full Squad', '23 players'], ['fantasy_xi', 'Fantasy XI', 'Best XI']] as const).map(([key, label, desc]) => (
            <button
              key={key}
              onClick={() => setDraftType(key as DraftType)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                draftType === key
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : `${BORDER_COLOR} ${CARD_BG} hover:border-[#484f58]`
              }`}
            >
              <span className={`text-xs font-semibold ${draftType === key ? 'text-emerald-400' : TEXT_PRIMARY}`}>{label}</span>
              <span className={`block text-[10px] ${TEXT_SECONDARY} mt-0.5`}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <BudgetBar spent={budgetSpent} total={budget} />
        <div className="flex items-center gap-2 mt-3">
          <Users className="h-4 w-4 text-emerald-400" />
          <span className={`text-xs ${TEXT_PRIMARY}`}>
            {draftedCount}/{maxSlots} slots filled
          </span>
        </div>
      </div>

      {/* League Filter */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 space-y-2`}>
        <h3 className={`text-sm font-semibold ${TEXT_PRIMARY}`}>League Filter</h3>
        <div className="flex flex-wrap gap-1.5">
          {LEAGUE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLeagueFilter(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                leagueFilter === opt.value
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : `${BORDER_COLOR} ${TEXT_SECONDARY} hover:text-[#c9d1d9]`
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onStart}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
        >
          <Zap className="h-4 w-4" /> Start Draft
        </button>
        <button
          onClick={onAutoFill}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-sm font-medium transition-colors"
        >
          <Shuffle className="h-4 w-4" /> Auto-Fill
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Draft Board Grid
// ============================================================
function DraftBoardGrid({
  draftedSlots,
  onSlotClick,
}: {
  draftedSlots: Record<string, DraftPlayer>;
  onSlotClick: (slotId: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
      <h3 className={`text-sm font-semibold ${TEXT_PRIMARY} mb-3`}>Formation (4-3-3)</h3>
      <svg viewBox="0 0 200 210" className="w-full" style={{ maxWidth: 400 }}>
        {/* Pitch background */}
        <rect x="0" y="0" width="200" height="210" rx="8" fill="#0a2e1a" />
        {/* Pitch lines */}
        <rect x="10" y="10" width="180" height="190" rx="4" fill="none" stroke="#1a5c38" strokeWidth="1" />
        <line x1="100" y1="10" x2="100" y2="200" stroke="#1a5c38" strokeWidth="0.5" />
        <circle cx="100" cy="105" r="20" fill="none" stroke="#1a5c38" strokeWidth="0.5" />
        <rect x="10" y="70" width="30" height="70" fill="none" stroke="#1a5c38" strokeWidth="0.5" />
        <rect x="160" y="70" width="30" height="70" fill="none" stroke="#1a5c38" strokeWidth="0.5" />

        {FORMATION_SLOTS_433.map(slot => {
          const player = draftedSlots[slot.id];
          const posColor = POSITION_COLORS[slot.pos] || '#8b949e';

          if (player) {
            return (
              <g key={slot.id} className="cursor-pointer" onClick={() => onSlotClick(slot.id)}>
                <circle cx={slot.x * 2} cy={slot.y * 2.1} r="18" fill="#161b22" stroke={posColor} strokeWidth="2" />
                <text x={slot.x * 2} y={slot.y * 2.1 - 5} textAnchor="middle" fill="#c9d1d9" fontSize="6" fontWeight="700">{player.overall}</text>
                <text x={slot.x * 2} y={slot.y * 2.1 + 4} textAnchor="middle" fill="#c9d1d9" fontSize="5">{player.name.split(' ').pop()}</text>
                <text x={slot.x * 2} y={slot.y * 2.1 + 11} textAnchor="middle" fill="#8b949e" fontSize="4">{player.clubShortName}</text>
              </g>
            );
          }

          return (
            <g key={slot.id} className="cursor-pointer" onClick={() => onSlotClick(slot.id)}>
              <circle cx={slot.x * 2} cy={slot.y * 2.1} r="14" fill="none" stroke="#30363d" strokeWidth="1" strokeDasharray="3,3" />
              <text x={slot.x * 2} y={slot.y * 2.1 - 2} textAnchor="middle" fill="#484f58" fontSize="7" fontWeight="600">{slot.pos}</text>
              <text x={slot.x * 2} y={slot.y * 2.1 + 7} textAnchor="middle" fill="#30363d" fontSize="10">+</text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

// ============================================================
// Available Players Pool
// ============================================================
function AvailablePlayersPool({
  players,
  onDraft,
  draftedIds,
  positionFilter,
  setPositionFilter,
  sortOption,
  setSortOption,
  searchQuery,
  setSearchQuery,
}: {
  players: DraftPlayer[];
  onDraft: (p: DraftPlayer) => void;
  draftedIds: Set<string>;
  positionFilter: PositionFilter;
  setPositionFilter: (f: PositionFilter) => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const filtered = useMemo(() => {
    let list = players.filter(p => !draftedIds.has(p.id));
    if (positionFilter !== 'all') {
      list = list.filter(p => POSITION_CATEGORY[p.position] === positionFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.clubName.toLowerCase().includes(q));
    }
    if (sortOption === 'ovr_desc') list.sort((a, b) => b.overall - a.overall);
    else if (sortOption === 'name_asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === 'age_asc') list.sort((a, b) => a.age - b.age);
    return list;
  }, [players, draftedIds, positionFilter, sortOption, searchQuery]);

  const posFilters: { value: PositionFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'GK', label: 'GK' },
    { value: 'DEF', label: 'DEF' },
    { value: 'MID', label: 'MID' },
    { value: 'FWD', label: 'FWD' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value as SortOption)}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
        >
          <option value="ovr_desc">OVR ↓</option>
          <option value="name_asc">Name A-Z</option>
          <option value="age_asc">Age ↑</option>
        </select>
      </div>

      {/* Position filter tabs */}
      <div className="flex gap-1.5">
        {posFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setPositionFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
              positionFilter === f.value
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : `${BORDER_COLOR} ${TEXT_SECONDARY} hover:text-[#c9d1d9]`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Player count */}
      <div className={`text-[10px] ${TEXT_SECONDARY}`}>
        {filtered.length} players available
      </div>

      {/* Player list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map(player => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 flex items-center gap-3 border-l-4 ${POSITION_BORDER_COLORS[player.position] || 'border-l-gray-500'}`}
          >
            {/* OVR badge */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${getOvrBg(player.overall)}`}>
              <span className={`text-sm font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{player.flag}</span>
                <span className={`text-xs font-semibold ${TEXT_PRIMARY} truncate`}>{player.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${POSITION_COLORS[player.position]}20`, color: POSITION_COLORS[player.position] }}>
                  {player.position}
                </span>
                <span className={`text-[10px] ${TEXT_SECONDARY} truncate`}>{player.clubName}</span>
                <span className={`text-[10px] ${TEXT_SECONDARY}`}>Age {player.age}</span>
              </div>
            </div>
            {/* Cost & Draft button */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs font-semibold text-emerald-400">€{player.cost}M</span>
              <button
                onClick={() => onDraft(player)}
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Draft
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-[#484f58]">
            <Search className="h-6 w-6 mb-2" />
            <span className="text-xs">No players match your filters</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Draft Pick History
// ============================================================
function DraftPickHistory({ picks, budget }: { picks: DraftPick[]; budget: number }) {
  if (picks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 flex flex-col items-center justify-center text-center`}>
        <ClipboardIcon />
        <span className={`text-sm ${TEXT_SECONDARY} mt-2`}>No picks yet</span>
        <span className="text-xs text-[#484f58] mt-1">Start drafting to see your pick history</span>
      </motion.div>
    );
  }

  const bestValue = picks.reduce((best, p) => p.player.overall / p.player.cost > (best?.player.overall / best?.player.cost || 0) ? p : best, picks[0]);
  const biggestReach = picks.reduce((worst, p) => p.player.overall / p.player.cost < (worst?.player.overall / worst?.player.cost || Infinity) ? p : worst, picks[0]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Summary badges */}
      <div className="flex gap-2">
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg px-3 py-2 flex-1`}>
          <span className="text-[10px] text-emerald-400 font-semibold">Best Value</span>
          <span className={`block text-xs ${TEXT_PRIMARY} mt-0.5`}>{bestValue.player.name} ({bestValue.player.overall})</span>
        </div>
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg px-3 py-2 flex-1`}>
          <span className="text-[10px] text-red-400 font-semibold">Biggest Reach</span>
          <span className={`block text-xs ${TEXT_PRIMARY} mt-0.5`}>{biggestReach.player.name} ({biggestReach.player.overall})</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {picks.map(pick => (
          <div key={pick.pickNumber} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 flex items-center gap-3`}>
            <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${CARD_BG} border ${BORDER_COLOR}`}>
              <span className="text-[10px] font-bold text-[#8b949e]">#{pick.pickNumber}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${TEXT_PRIMARY} truncate`}>{pick.player.name}</span>
                <span className="text-[10px] font-medium px-1 py-0.5 rounded-sm" style={{ backgroundColor: `${POSITION_COLORS[pick.player.position]}20`, color: POSITION_COLORS[pick.player.position] }}>
                  {pick.player.position}
                </span>
              </div>
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>{pick.player.clubName} &middot; OVR {pick.player.overall}</span>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-xs font-semibold text-red-400">-€{pick.budgetSpent}M</span>
              <span className="text-[10px] text-[#484f58]">Round {pick.pickNumber}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Running budget */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3`}>
        <BudgetBar spent={picks[picks.length - 1].budgetSpent} total={budget} />
      </div>
    </motion.div>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#30363d]" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================
// Drafted Team Overview
// ============================================================
function DraftedTeamOverview({
  draftedSlots,
  picks,
  budgetSpent,
  budget,
}: {
  draftedSlots: Record<string, DraftPlayer>;
  picks: DraftPick[];
  budgetSpent: number;
  budget: number;
}) {
  const draftedPlayers = Object.values(draftedSlots);
  const teamOvr = draftedPlayers.length > 0 ? Math.round(draftedPlayers.reduce((s, p) => s + p.overall, 0) / draftedPlayers.length) : 0;

  const avgPace = draftedPlayers.length > 0 ? Math.round(draftedPlayers.reduce((s, p) => s + p.pace, 0) / draftedPlayers.length) : 0;
  const avgShooting = draftedPlayers.length > 0 ? Math.round(draftedPlayers.reduce((s, p) => s + p.shooting, 0) / draftedPlayers.length) : 0;
  const avgPassing = draftedPlayers.length > 0 ? Math.round(draftedPlayers.reduce((s, p) => s + p.passing, 0) / draftedPlayers.length) : 0;
  const avgDefending = draftedPlayers.length > 0 ? Math.round(draftedPlayers.reduce((s, p) => s + p.defending, 0) / draftedPlayers.length) : 0;

  const chemistry = Math.min(95, Math.max(30, Math.round(50 + draftedPlayers.length * 4 + (teamOvr - 70) * 0.5)));

  const teamType = avgDefending > 75 ? 'Defensive' : avgShooting > 75 ? 'Attacking' : 'Balanced';

  const formationBadge = draftedPlayers.length >= 11 ? '4-3-3 Ready' : draftedPlayers.length > 0 ? 'Building...' : 'Empty';

  if (draftedPlayers.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 flex flex-col items-center justify-center text-center`}>
        <Users className="h-8 w-8 text-[#30363d] mb-2" />
        <span className={`text-sm ${TEXT_SECONDARY}`}>No players drafted yet</span>
        <span className="text-xs text-[#484f58] mt-1">Draft players from the Pool tab</span>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Team OVR & Chemistry */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-[10px] uppercase tracking-wider ${TEXT_SECONDARY}`}>Team OVR</span>
            <div className={`text-3xl font-bold ${getOvrColor(teamOvr)} mt-1`}>{teamOvr}</div>
            <span className={`text-xs ${TEXT_SECONDARY} mt-0.5`}>{draftedPlayers.length} players drafted</span>
          </div>
          <ChemistryRing score={chemistry} />
        </div>
      </div>

      {/* Budget */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs ${TEXT_SECONDARY}`}>Budget Spent</span>
          <span className={`text-xs font-semibold ${budgetSpent > budget ? 'text-red-400' : 'text-emerald-400'}`}>
            €{budgetSpent}M / €{budget}M
          </span>
        </div>
        <BudgetBar spent={budgetSpent} total={budget} />
      </div>

      {/* Team Strengths */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-3`}>Team Strengths</h3>
        <AttributeBarChart
          attributes={[
            { label: 'Pace', value: avgPace, color: '#FBBF24' },
            { label: 'Shooting', value: avgShooting, color: '#EF4444' },
            { label: 'Passing', value: avgPassing, color: '#22C55E' },
            { label: 'Defending', value: avgDefending, color: '#3B82F6' },
          ]}
        />
      </div>

      {/* Team Type & Formation Badge */}
      <div className="flex gap-3">
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 flex-1`}>
          <span className={`text-[10px] uppercase tracking-wider ${TEXT_SECONDARY}`}>Team Type</span>
          <div className={`text-sm font-semibold ${TEXT_PRIMARY} mt-1 flex items-center gap-1.5`}>
            {teamType === 'Attacking' && <Swords className="h-3.5 w-3.5 text-red-400" />}
            {teamType === 'Defensive' && <Shield className="h-3.5 w-3.5 text-blue-400" />}
            {teamType === 'Balanced' && <Activity className="h-3.5 w-3.5 text-green-400" />}
            {teamType}
          </div>
        </div>
        <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 flex-1`}>
          <span className={`text-[10px] uppercase tracking-wider ${TEXT_SECONDARY}`}>Formation</span>
          <div className={`text-sm font-semibold mt-1 ${draftedPlayers.length >= 11 ? 'text-emerald-400' : TEXT_PRIMARY}`}>
            {formationBadge}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Team Rating Card
// ============================================================
function TeamRatingCard({ draftedSlots }: { draftedSlots: Record<string, DraftPlayer> }) {
  const draftedPlayers = Object.values(draftedSlots);
  if (draftedPlayers.length < 3) return null;

  const teamOvr = Math.round(draftedPlayers.reduce((s, p) => s + p.overall, 0) / draftedPlayers.length);
  const starRating = teamOvr >= 90 ? 5 : teamOvr >= 82 ? 4 : teamOvr >= 74 ? 3 : teamOvr >= 66 ? 2 : 1;

  const defPlayers = draftedPlayers.filter(p => ['CB', 'LB', 'RB'].includes(p.position));
  const midPlayers = draftedPlayers.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
  const fwdPlayers = draftedPlayers.filter(p => ['LW', 'RW', 'ST', 'CF'].includes(p.position));

  const defOvr = defPlayers.length > 0 ? Math.round(defPlayers.reduce((s, p) => s + p.overall, 0) / defPlayers.length) : 0;
  const midOvr = midPlayers.length > 0 ? Math.round(midPlayers.reduce((s, p) => s + p.overall, 0) / midPlayers.length) : 0;
  const fwdOvr = fwdPlayers.length > 0 ? Math.round(fwdPlayers.reduce((s, p) => s + p.overall, 0) / fwdPlayers.length) : 0;

  const avgStats = {
    pace: Math.round(draftedPlayers.reduce((s, p) => s + p.pace, 0) / draftedPlayers.length),
    shooting: Math.round(draftedPlayers.reduce((s, p) => s + p.shooting, 0) / draftedPlayers.length),
    passing: Math.round(draftedPlayers.reduce((s, p) => s + p.passing, 0) / draftedPlayers.length),
    defending: Math.round(draftedPlayers.reduce((s, p) => s + p.defending, 0) / draftedPlayers.length),
    physical: Math.round(draftedPlayers.reduce((s, p) => s + p.physical, 0) / draftedPlayers.length),
  };

  const leagueAvg = { pace: 70, shooting: 68, passing: 72, defending: 69, physical: 71 };
  const fanExcitement = Math.min(100, Math.round(teamOvr * 0.8 + (defPlayers.length >= 3 ? 10 : 0) + (fwdPlayers.length >= 2 ? 8 : 0)));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (midOvr >= 78) strengths.push('Strong Midfield');
  else if (midOvr > 0) weaknesses.push('Weak Midfield');
  if (defOvr >= 78) strengths.push('Solid Defense');
  else if (defOvr > 0) weaknesses.push('Weak Defense');
  if (fwdOvr >= 78) strengths.push('Lethal Attack');
  else if (fwdOvr > 0) weaknesses.push('Lacking Attack');
  if (avgStats.pace >= 80) strengths.push('Pacey Team');
  if (avgStats.physical >= 80) strengths.push('Physical Dominance');

  const teamType = defOvr > fwdOvr + 5 ? 'Defensive' : fwdOvr > defOvr + 5 ? 'Attacking' : 'Balanced';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Stars & Team Type */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-[10px] uppercase tracking-wider ${TEXT_SECONDARY}`}>Team Rating</span>
            <div className={`text-2xl font-bold ${getOvrColor(teamOvr)} mt-1`}>{teamOvr} OVR</div>
          </div>
          <StarRating rating={starRating} />
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-md ${
            teamType === 'Attacking' ? 'bg-red-400/10 text-red-400 border border-red-400/30' :
            teamType === 'Defensive' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30' :
            'bg-green-400/10 text-green-400 border border-green-400/30'
          }`}>
            {teamType}
          </span>
        </div>
      </div>

      {/* Strength & Weakness Analysis */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-2`}>Analysis</h3>
        <div className="space-y-1.5">
          {strengths.map(s => (
            <div key={s} className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">{s}</span>
            </div>
          ))}
          {weaknesses.map(w => (
            <div key={w} className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400">{w}</span>
            </div>
          ))}
          {strengths.length === 0 && weaknesses.length === 0 && (
            <span className={`text-xs ${TEXT_SECONDARY}`}>Draft more players for analysis</span>
          )}
        </div>
      </div>

      {/* Bar chart vs League Average */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-3`}>Your Team vs League Average</h3>
        <ComparisonBarChart
          yourTeam={[avgStats.pace, avgStats.shooting, avgStats.passing, avgStats.defending, avgStats.physical]}
          opponent={[leagueAvg.pace, leagueAvg.shooting, leagueAvg.passing, leagueAvg.defending, leagueAvg.physical]}
          labels={['PAC', 'SHO', 'PAS', 'DEF', 'PHY']}
        />
      </div>

      {/* Fan Excitement */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Fan Excitement</h3>
            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Based on team quality</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className={`h-4 w-4 ${fanExcitement >= 75 ? 'text-red-400' : 'text-[#8b949e]'}`} />
            <span className={`text-lg font-bold ${fanExcitement >= 75 ? 'text-red-400' : TEXT_PRIMARY}`}>{fanExcitement}</span>
          </div>
        </div>
        <svg viewBox="0 0 200 10" className="w-full mt-2">
          <rect x="0" y="0" width="200" height="10" rx="3" fill="#21262d" />
          <rect x="0" y="0" width={(fanExcitement / 100) * 200} height="10" rx="3" fill={fanExcitement >= 75 ? '#EF4444' : fanExcitement >= 50 ? '#FBBF24' : '#8b949e'} />
          {[25, 50, 75].map(v => (
            <line key={v} x1={(v / 100) * 200} y1="0" x2={(v / 100) * 200} y2="10" stroke="#30363d" strokeWidth="0.5" />
          ))}
        </svg>
      </div>
    </motion.div>
  );
}

// ============================================================
// Dream Team Comparison
// ============================================================
function DreamTeamComparison({ draftedSlots }: { draftedSlots: Record<string, DraftPlayer> }) {
  const draftedPlayers = Object.values(draftedSlots);
  const gameState = useGameStore(s => s.gameState);

  if (draftedPlayers.length < 5) return null;

  const yourPace = Math.round(draftedPlayers.reduce((s, p) => s + p.pace, 0) / draftedPlayers.length);
  const yourShoot = Math.round(draftedPlayers.reduce((s, p) => s + p.shooting, 0) / draftedPlayers.length);
  const yourPass = Math.round(draftedPlayers.reduce((s, p) => s + p.passing, 0) / draftedPlayers.length);
  const yourDef = Math.round(draftedPlayers.reduce((s, p) => s + p.defending, 0) / draftedPlayers.length);
  const yourPhy = Math.round(draftedPlayers.reduce((s, p) => s + p.physical, 0) / draftedPlayers.length);
  const yourOvr = Math.round(draftedPlayers.reduce((s, p) => s + p.overall, 0) / draftedPlayers.length);

  const clubQuality = gameState?.currentClub?.squadQuality || 75;
  const realPace = Math.min(95, clubQuality + 2);
  const realShoot = Math.min(95, clubQuality - 2);
  const realPass = Math.min(95, clubQuality + 3);
  const realDef = Math.min(95, clubQuality + 1);
  const realPhy = Math.min(95, clubQuality);

  const yourTotal = yourPace + yourShoot + yourPass + yourDef + yourPhy;
  const realTotal = realPace + realShoot + realPass + realDef + realPhy;
  const winPct = Math.max(5, Math.min(95, 50 + Math.round((yourTotal - realTotal) * 0.5)));

  const verdict = yourOvr > clubQuality + 5
    ? 'Your draft outclasses your real club!'
    : yourOvr > clubQuality - 3
      ? 'Competitive with your real club'
      : 'Your real club has the edge';

  const allStarPicks = FORMATION_SLOTS_433.map(slot => {
    const candidates = PLAYER_POOL.filter(p => POSITION_CATEGORY[p.position] === POSITION_CATEGORY[slot.pos] && !draftedPlayers.some(dp => dp.id === p.id));
    return candidates.sort((a, b) => b.overall - a.overall)[0];
  }).filter(Boolean);

  const allStarOvr = allStarPicks.length > 0 ? Math.round(allStarPicks.reduce((s, p) => s + p.overall, 0) / allStarPicks.length) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Verdict */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-1`}>Your Draft vs Real Team</h3>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${getOvrColor(yourOvr)}`}>{yourOvr}</span>
            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Draft OVR</span>
          </div>
          <span className={`text-xs ${TEXT_SECONDARY}`}>vs</span>
          <div className="flex flex-col items-center">
            <span className={`text-xl font-bold ${getOvrColor(clubQuality)}`}>{clubQuality}</span>
            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Real Club</span>
          </div>
        </div>
        <p className={`text-xs mt-3 ${yourOvr > clubQuality ? 'text-emerald-400' : TEXT_SECONDARY}`}>
          {verdict}
        </p>
      </div>

      {/* Grouped bar chart */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-3`}>Attribute Comparison</h3>
        <ComparisonBarChart
          yourTeam={[yourPace, yourShoot, yourPass, yourDef, yourPhy]}
          opponent={[realPace, realShoot, realPass, realDef, realPhy]}
          labels={['PAC', 'SHO', 'PAS', 'DEF', 'PHY']}
        />
      </div>

      {/* Win probability */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-3`}>Win Probability vs Real Club</h3>
        <div className="flex items-center justify-around">
          <WinProbabilityDonut winPct={winPct} />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <div>
                <span className={`text-xs ${TEXT_PRIMARY}`}>All-Star OVR</span>
                <span className={`block text-sm font-bold ${getOvrColor(allStarOvr)}`}>{allStarOvr}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <div>
                <span className={`text-xs ${TEXT_PRIMARY}`}>Your vs All-Star</span>
                <span className={`block text-sm font-bold ${yourOvr >= allStarOvr - 5 ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                  {yourOvr >= allStarOvr ? 'Competitive!' : `${allStarOvr - yourOvr} behind`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Trade / Transfer from Draft
// ============================================================
function TradeActions({
  draftedSlots,
  picks,
  budgetSpent,
  budget,
  onUndoLast,
  onReset,
  onSwapPlayer,
  onSave,
}: {
  draftedSlots: Record<string, DraftPlayer>;
  picks: DraftPick[];
  budgetSpent: number;
  budget: number;
  onUndoLast: () => void;
  onReset: () => void;
  onSwapPlayer: (slotId: string) => void;
  onSave: () => void;
}) {
  const [swapMode, setSwapMode] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className={`text-xs font-semibold ${TEXT_PRIMARY} mb-3`}>Draft Management</h3>

        <div className="space-y-2">
          {/* Swap Player */}
          <button
            onClick={() => setSwapMode(!swapMode)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              swapMode
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : `${BORDER_COLOR} ${CARD_BG} hover:bg-[#21262d] ${TEXT_PRIMARY}`
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            {swapMode ? 'Tap a slot to swap...' : 'Swap Player'}
          </button>

          {swapMode && (
            <div className="grid grid-cols-4 gap-1.5">
              {FORMATION_SLOTS_433.map(slot => {
                const player = draftedSlots[slot.id];
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (player) onSwapPlayer(slot.id);
                    }}
                    className={`p-2 rounded-md border text-center transition-colors ${
                      player ? `${BORDER_COLOR} hover:border-red-400/50 ${TEXT_PRIMARY}` : 'border-[#21262d] text-[#484f58] cursor-not-allowed'
                    }`}
                  >
                    <span className="text-[10px] font-semibold">{slot.pos}</span>
                    {player && <span className="block text-[8px] text-[#8b949e] truncate">{player.name.split(' ').pop()}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Undo last pick */}
          <button
            onClick={onUndoLast}
            disabled={picks.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="h-4 w-4" /> Undo Last Pick
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={picks.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-400/30 bg-red-400/5 hover:bg-red-400/10 text-red-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" /> Reset Entire Draft
          </button>

          {/* Save */}
          <button
            onClick={onSave}
            disabled={Object.keys(draftedSlots).length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" /> Confirm & Save Draft
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-lg font-bold text-emerald-400">{picks.length}</span>
            <span className={`block text-[10px] ${TEXT_SECONDARY}`}>Picks</span>
          </div>
          <div>
            <span className="text-lg font-bold text-red-400">€{budgetSpent}M</span>
            <span className={`block text-[10px] ${TEXT_SECONDARY}`}>Spent</span>
          </div>
          <div>
            <span className="text-lg font-bold text-yellow-400">€{budget - budgetSpent}M</span>
            <span className={`block text-[10px] ${TEXT_SECONDARY}`}>Remaining</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function FantasyDraft() {
  const [draftType, setDraftType] = useState<DraftType>('quick');
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('ovr_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftedSlots, setDraftedSlots] = useState<Record<string, DraftPlayer>>({});
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillStep, setAutoFillStep] = useState(0);
  const [savedMessage, setSavedMessage] = useState(false);

  const budget = BUDGET_BY_TYPE[draftType];
  const budgetSpent = picks.reduce((s, p) => s + p.player.cost, 0);
  const draftedIds = useMemo(() => new Set(Object.values(draftedSlots).map(p => p.id)), [draftedSlots]);

  const filteredPool = useMemo(() => {
    if (leagueFilter === 'all') return PLAYER_POOL;
    return PLAYER_POOL.filter(p => p.league === leagueFilter);
  }, [leagueFilter]);

  const availableBudget = budget - budgetSpent;

  // Get the next empty slot for auto-draft
  const getNextEmptySlot = useCallback((skipSlots: Set<string> = new Set()): FormationSlot | null => {
    for (const slot of FORMATION_SLOTS_433) {
      if (!draftedSlots[slot.id] && !skipSlots.has(slot.id)) {
        return slot;
      }
    }
    return null;
  }, [draftedSlots]);

  const draftPlayer = useCallback((player: DraftPlayer, slotId?: string) => {
    const targetSlot = slotId || getNextEmptySlot()?.id;
    if (!targetSlot || draftedIds.has(player.id)) return;

    const cost = player.cost;
    const newSpent = budgetSpent + cost;
    if (newSpent > budget) return;

    const newPick: DraftPick = {
      pickNumber: picks.length + 1,
      player,
      slotId: targetSlot,
      budgetSpent: newSpent,
      timestamp: `Round ${picks.length + 1}`,
    };

    setDraftedSlots(prev => ({ ...prev, [targetSlot]: player }));
    setPicks(prev => [...prev, newPick]);
  }, [budgetSpent, budget, draftedIds, getNextEmptySlot, picks]);

  const onUndoLast = useCallback(() => {
    if (picks.length === 0) return;
    const lastPick = picks[picks.length - 1];
    setDraftedSlots(prev => {
      const next = { ...prev };
      delete next[lastPick.slotId];
      return next;
    });
    setPicks(prev => prev.slice(0, -1));
  }, [picks]);

  const onReset = useCallback(() => {
    setDraftedSlots({});
    setPicks([]);
    setAutoFilling(false);
    setAutoFillStep(0);
  }, []);

  const onSwapPlayer = useCallback((slotId: string) => {
    const player = draftedSlots[slotId];
    if (!player) return;

    setDraftedSlots(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setPicks(prev => prev.filter(p => p.slotId !== slotId));
  }, [draftedSlots]);

  const onSave = useCallback(() => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }, []);

  // Auto-fill simulation
  const onAutoFill = useCallback(() => {
    if (autoFilling) return;
    setAutoFilling(true);
    setAutoFillStep(0);
  }, [autoFilling]);

  useEffect(() => {
    if (!autoFilling) return;

    const maxSlots = MAX_SLOTS_BY_TYPE[draftType];
    if (Object.keys(draftedSlots).length >= maxSlots || autoFillStep >= maxSlots) {
      setAutoFilling(false);
      return;
    }

    const slot = getNextEmptySlot();
    if (!slot) {
      setAutoFilling(false);
      return;
    }

    const category = POSITION_CATEGORY[slot.pos];
    const remaining = filteredPool.filter(p =>
      !draftedIds.has(p.id) &&
      POSITION_CATEGORY[p.position] === category
    );

    if (remaining.length === 0) {
      setAutoFilling(false);
      return;
    }

    const sorted = [...remaining].sort((a, b) => b.overall - a.overall);
    const best = sorted.find(p => {
      const newSpent = budgetSpent + p.cost;
      return newSpent <= budget;
    });

    if (best) {
      draftPlayer(best, slot.id);
      setAutoFillStep(prev => prev + 1);
    } else {
      setAutoFilling(false);
    }
  }, [autoFilling, autoFillStep, draftType, getNextEmptySlot, filteredPool, draftedIds, budget, budgetSpent, draftPlayer]);

  const handleSlotClick = useCallback((slotId: string) => {
    const existing = draftedSlots[slotId];
    if (existing) {
      onSwapPlayer(slotId);
    }
  }, [draftedSlots, onSwapPlayer]);

  const draftedCount = Object.keys(draftedSlots).length;

  return (
    <div className="max-w-lg mx-auto px-3 py-4 space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Users className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${TEXT_PRIMARY}`}>Fantasy Draft</h1>
          <p className={`text-xs ${TEXT_SECONDARY}`}>Build your dream team from Europe&apos;s top leagues</p>
        </div>
      </motion.div>

      {/* Saved message toast */}
      {savedMessage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
          <Save className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Draft saved successfully!</span>
        </motion.div>
      )}

      {/* Auto-fill indicator */}
      {autoFilling && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-3 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-sm animate-spin" />
          <span className="text-sm text-yellow-400 font-medium">Auto-filling team... ({autoFillStep} players)</span>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg h-9 p-1">
          <TabsTrigger value="setup" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Setup</TabsTrigger>
          <TabsTrigger value="board" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Board</TabsTrigger>
          <TabsTrigger value="pool" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Pool</TabsTrigger>
          <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Overview</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">History</TabsTrigger>
          <TabsTrigger value="rating" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Rating</TabsTrigger>
          <TabsTrigger value="compare" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Compare</TabsTrigger>
          <TabsTrigger value="manage" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e]">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <DraftSetupPanel
            draftType={draftType}
            setDraftType={setDraftType}
            leagueFilter={leagueFilter}
            setLeagueFilter={setLeagueFilter}
            budget={budget}
            budgetSpent={budgetSpent}
            onStart={() => {}}
            onAutoFill={onAutoFill}
            draftedCount={draftedCount}
          />
        </TabsContent>

        <TabsContent value="board">
          <DraftBoardGrid draftedSlots={draftedSlots} onSlotClick={handleSlotClick} />
          {/* Quick summary below board */}
          {draftedCount > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 mt-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${TEXT_SECONDARY}`}>Team OVR</span>
                <span className={`text-sm font-bold ${getOvrColor(Math.round(Object.values(draftedSlots).reduce((s, p) => s + p.overall, 0) / draftedCount))}`}>
                  {Math.round(Object.values(draftedSlots).reduce((s, p) => s + p.overall, 0) / draftedCount)}
                </span>
              </div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="pool">
          <AvailablePlayersPool
            players={filteredPool}
            onDraft={draftPlayer}
            draftedIds={draftedIds}
            positionFilter={positionFilter}
            setPositionFilter={setPositionFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </TabsContent>

        <TabsContent value="overview">
          <DraftedTeamOverview
            draftedSlots={draftedSlots}
            picks={picks}
            budgetSpent={budgetSpent}
            budget={budget}
          />
        </TabsContent>

        <TabsContent value="history">
          <DraftPickHistory picks={picks} budget={budget} />
        </TabsContent>

        <TabsContent value="rating">
          <TeamRatingCard draftedSlots={draftedSlots} />
        </TabsContent>

        <TabsContent value="compare">
          <DreamTeamComparison draftedSlots={draftedSlots} />
        </TabsContent>

        <TabsContent value="manage">
          <TradeActions
            draftedSlots={draftedSlots}
            picks={picks}
            budgetSpent={budgetSpent}
            budget={budget}
            onUndoLast={onUndoLast}
            onReset={onReset}
            onSwapPlayer={onSwapPlayer}
            onSave={onSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
