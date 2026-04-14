'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Zap,
  Shield,
  Target,
  Star,
  Users,
  Dumbbell,
  ChevronRight,
  Lock,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Flame,
  Swords,
  Trophy,
  BarChart3,
  Briefcase,
  Eye,
  LineChart,
  Heart,
  CircleDot,
  Crosshair,
} from 'lucide-react';

// ============================================================
// Constants & Types
// ============================================================

const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';

type PhilosophyKey = 'total_football' | 'gegenpressing' | 'catenaccio' | 'route_one';
type TrainingFocus = 'attack' | 'defense' | 'set_pieces' | 'fitness' | 'tactics';
type TrainingIntensity = 'low' | 'medium' | 'high';
type FormationKey = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
type MentalityKey = 'attacking' | 'balanced' | 'defensive';

interface CoachingBadge {
  id: string;
  name: string;
  level: number;
  requirement: string;
  seasonsRequired: number;
  icon: string;
}

const COACHING_BADGES: CoachingBadge[] = [
  { id: 'youth_c', name: 'Youth C License', level: 1, requirement: 'Start coaching career', seasonsRequired: 0, icon: '🟢' },
  { id: 'uefa_b', name: 'UEFA B License', level: 2, requirement: '2 seasons coaching', seasonsRequired: 2, icon: '🔵' },
  { id: 'uefa_a', name: 'UEFA A License', level: 3, requirement: '4 seasons coaching', seasonsRequired: 4, icon: '🟡' },
  { id: 'uefa_pro', name: 'UEFA Pro License', level: 4, requirement: '6 seasons coaching', seasonsRequired: 6, icon: '🔴' },
  { id: 'elite', name: 'Elite Coach', level: 5, requirement: '10 seasons + 3 trophies', seasonsRequired: 10, icon: '⭐' },
  { id: 'legendary', name: 'Legendary Manager', level: 6, requirement: '15 seasons + 5 trophies', seasonsRequired: 15, icon: '👑' },
];

const PHILOSOPHIES: Record<PhilosophyKey, {
  name: string;
  description: string;
  formation: FormationKey;
  icon: React.ReactNode;
  principles: string[];
  suitabilityPositions: string[];
}> = {
  total_football: {
    name: 'Total Football',
    description: 'Fluid possession-based system emphasizing spatial awareness and positional interchange.',
    formation: '4-3-3',
    icon: <Brain className="h-5 w-5 text-emerald-400" />,
    principles: ['High possession (60%+)', 'Positional rotation', 'Short passing triangles'],
    suitabilityPositions: ['CM', 'CAM', 'LW', 'RW'],
  },
  gegenpressing: {
    name: 'Gegenpressing',
    description: 'Aggressive high-press system that wins the ball back immediately after losing it.',
    formation: '4-2-3-1',
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    principles: ['Immediate ball recovery', 'High defensive line', 'Counter-attacking transitions'],
    suitabilityPositions: ['CM', 'ST', 'LW', 'RW'],
  },
  catenaccio: {
    name: 'Catenaccio',
    description: 'Deep defensive block with disciplined shape and lethal counter-attacks.',
    formation: '3-5-2',
    icon: <Shield className="h-5 w-5 text-red-400" />,
    principles: ['Compact defensive shape', 'Sitting deep in own half', 'Rapid counter-attacks'],
    suitabilityPositions: ['CB', 'CDM', 'CM'],
  },
  route_one: {
    name: 'Route One',
    description: 'Direct attacking approach using long balls and physical presence to bypass midfield.',
    formation: '4-4-2',
    icon: <Target className="h-5 w-5 text-cyan-400" />,
    principles: ['Aerial dominance', 'Long ball distribution', 'Second ball recovery'],
    suitabilityPositions: ['ST', 'CB', 'CF'],
  },
};

const FORMATION_POSITIONS: Record<FormationKey, { x: number; y: number; pos: string }[]> = {
  '4-3-3': [
    { x: 50, y: 10, pos: 'GK' },
    { x: 18, y: 30, pos: 'LB' }, { x: 38, y: 32, pos: 'CB' }, { x: 62, y: 32, pos: 'CB' }, { x: 82, y: 30, pos: 'RB' },
    { x: 28, y: 52, pos: 'CM' }, { x: 50, y: 48, pos: 'CM' }, { x: 72, y: 52, pos: 'CM' },
    { x: 18, y: 76, pos: 'LW' }, { x: 50, y: 82, pos: 'ST' }, { x: 82, y: 76, pos: 'RW' },
  ],
  '4-2-3-1': [
    { x: 50, y: 10, pos: 'GK' },
    { x: 18, y: 30, pos: 'LB' }, { x: 38, y: 32, pos: 'CB' }, { x: 62, y: 32, pos: 'CB' }, { x: 82, y: 30, pos: 'RB' },
    { x: 35, y: 50, pos: 'CDM' }, { x: 65, y: 50, pos: 'CDM' },
    { x: 18, y: 68, pos: 'LW' }, { x: 50, y: 64, pos: 'CAM' }, { x: 82, y: 68, pos: 'RW' },
    { x: 50, y: 84, pos: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 10, pos: 'GK' },
    { x: 25, y: 30, pos: 'CB' }, { x: 50, y: 28, pos: 'CB' }, { x: 75, y: 30, pos: 'CB' },
    { x: 12, y: 52, pos: 'LM' }, { x: 32, y: 54, pos: 'CM' }, { x: 50, y: 50, pos: 'CDM' }, { x: 68, y: 54, pos: 'CM' }, { x: 88, y: 52, pos: 'RM' },
    { x: 35, y: 78, pos: 'ST' }, { x: 65, y: 78, pos: 'ST' },
  ],
  '4-4-2': [
    { x: 50, y: 10, pos: 'GK' },
    { x: 18, y: 30, pos: 'LB' }, { x: 38, y: 32, pos: 'CB' }, { x: 62, y: 32, pos: 'CB' }, { x: 82, y: 30, pos: 'RB' },
    { x: 18, y: 54, pos: 'LM' }, { x: 38, y: 56, pos: 'CM' }, { x: 62, y: 56, pos: 'CM' }, { x: 82, y: 54, pos: 'RM' },
    { x: 35, y: 80, pos: 'ST' }, { x: 65, y: 80, pos: 'ST' },
  ],
};

const TRAINING_OPTIONS: { key: TrainingFocus; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'attack', label: 'Attack', color: 'text-red-400', icon: <Crosshair className="h-4 w-4" /> },
  { key: 'defense', label: 'Defense', color: 'text-blue-400', icon: <Shield className="h-4 w-4" /> },
  { key: 'set_pieces', label: 'Set Pieces', color: 'text-amber-400', icon: <Star className="h-4 w-4" /> },
  { key: 'fitness', label: 'Fitness', color: 'text-emerald-400', icon: <Dumbbell className="h-4 w-4" /> },
  { key: 'tactics', label: 'Tactics', color: 'text-purple-400', icon: <Brain className="h-4 w-4" /> },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StaffMember {
  id: string;
  role: string;
  name: string;
  quality: number;
  specialization: string;
  impactArea: string;
  hireCost: number;
}

const STAFF_MEMBERS: StaffMember[] = [
  { id: 'asst', role: 'Assistant Manager', name: 'Carlos Vega', quality: 3, specialization: 'Tactical Analysis', impactArea: 'Team cohesion', hireCost: 12000 },
  { id: 'fitness', role: 'Fitness Coach', name: 'Emma Richter', quality: 2, specialization: 'Injury Prevention', impactArea: 'Player fitness', hireCost: 8000 },
  { id: 'gk', role: 'Goalkeeping Coach', name: 'Marco Bellini', quality: 4, specialization: 'Shot Stopping', impactArea: 'GK performance', hireCost: 10000 },
  { id: 'scout', role: 'Chief Scout', name: 'David Okafor', quality: 3, specialization: 'Youth Identification', impactArea: 'Transfer targets', hireCost: 15000 },
  { id: 'analyst', role: 'Data Analyst', name: 'Yuki Tanaka', quality: 2, specialization: 'xG Modeling', impactArea: 'Set piece quality', hireCost: 9000 },
];

// ============================================================
// Helpers
// ============================================================

function getCoachLevel(seasonsPlayed: number): number {
  if (seasonsPlayed >= 12) return 5;
  if (seasonsPlayed >= 8) return 4;
  if (seasonsPlayed >= 5) return 3;
  if (seasonsPlayed >= 2) return 2;
  return 1;
}

function getCoachXPProgress(seasonsPlayed: number): number {
  const level = getCoachLevel(seasonsPlayed);
  const thresholds = [0, 2, 5, 8, 12];
  const prevThreshold = thresholds[level - 1] ?? 0;
  const nextThreshold = thresholds[level] ?? 15;
  const range = nextThreshold - prevThreshold;
  if (range <= 0) return 100;
  return Math.min(100, Math.round(((seasonsPlayed - prevThreshold) / range) * 100));
}

function getSuitability(playerPosition: string, philosophyKey: PhilosophyKey): number {
  const phil = PHILOSOPHIES[philosophyKey];
  if (phil.suitabilityPositions.includes(playerPosition)) return 90 + Math.floor(Math.random() * 10);
  const positionGroup: Record<string, string[]> = {
    attack: ['ST', 'CF', 'LW', 'RW'],
    midfield: ['CM', 'CAM', 'CDM', 'LM', 'RM'],
    defence: ['CB', 'LB', 'RB'],
    goalkeeper: ['GK'],
  };
  for (const [, positions] of Object.entries(positionGroup)) {
    if (positions.includes(playerPosition) && phil.suitabilityPositions.some(p => positions.includes(p))) {
      return 55 + Math.floor(Math.random() * 20);
    }
  }
  return 25 + Math.floor(Math.random() * 20);
}

function getBadgeStatus(seasonsPlayed: number, trophies: number, badge: CoachingBadge): 'completed' | 'in_progress' | 'locked' {
  if (badge.level === 1) return 'completed';
  if (badge.id === 'elite' || badge.id === 'legendary') {
    const trophyReq = badge.id === 'elite' ? 3 : 5;
    if (seasonsPlayed >= badge.seasonsRequired && trophies >= trophyReq) return 'completed';
    if (seasonsPlayed >= badge.seasonsRequired - 2) return 'in_progress';
    return 'locked';
  }
  if (seasonsPlayed >= badge.seasonsRequired) return 'completed';
  if (seasonsPlayed >= badge.seasonsRequired - 2) return 'in_progress';
  return 'locked';
}

function getBadgeProgress(seasonsPlayed: number, trophies: number, badge: CoachingBadge): number {
  if (badge.level === 1) return 100;
  if (badge.id === 'elite' || badge.id === 'legendary') {
    const trophyReq = badge.id === 'elite' ? 3 : 5;
    const seasonProg = Math.min(1, seasonsPlayed / badge.seasonsRequired);
    const trophyProg = Math.min(1, trophies / trophyReq);
    return Math.round((seasonProg + trophyProg) / 2 * 100);
  }
  if (seasonsPlayed >= badge.seasonsRequired) return 100;
  return Math.round((seasonsPlayed / badge.seasonsRequired) * 100);
}

function generateSquadPlayers(): { name: string; pos: string; ovr: number; form: number; isCaptain: boolean }[] {
  const starters = [
    { name: 'Martinez', pos: 'GK', ovr: 78, form: 7.2, isCaptain: false },
    { name: 'Silva', pos: 'CB', ovr: 82, form: 7.8, isCaptain: true },
    { name: 'Santos', pos: 'CB', ovr: 79, form: 6.9, isCaptain: false },
    { name: 'Alves', pos: 'LB', ovr: 76, form: 7.1, isCaptain: false },
    { name: 'Carvajal', pos: 'RB', ovr: 77, form: 7.4, isCaptain: false },
    { name: 'Fernandes', pos: 'CM', ovr: 84, form: 8.1, isCaptain: false },
    { name: 'Rodriguez', pos: 'CDM', ovr: 80, form: 7.3, isCaptain: false },
    { name: 'Müller', pos: 'CAM', ovr: 81, form: 7.6, isCaptain: false },
    { name: 'Neymar Jr', pos: 'LW', ovr: 86, form: 8.4, isCaptain: false },
    { name: 'Haaland', pos: 'ST', ovr: 88, form: 8.9, isCaptain: false },
    { name: 'Salah', pos: 'RW', ovr: 85, form: 8.0, isCaptain: false },
  ];
  const subs = [
    { name: 'Donnarumma', pos: 'GK', ovr: 80, form: 6.8, isCaptain: false },
    { name: 'Kouyate', pos: 'CB', ovr: 74, form: 6.5, isCaptain: false },
    { name: 'James', pos: 'CM', ovr: 75, form: 7.0, isCaptain: false },
    { name: 'Griezmann', pos: 'ST', ovr: 82, form: 7.7, isCaptain: false },
    { name: 'Pedri', pos: 'CM', ovr: 79, form: 7.5, isCaptain: false },
    { name: 'Davies', pos: 'LB', ovr: 77, form: 7.2, isCaptain: false },
    { name: 'Felix', pos: 'CAM', ovr: 80, form: 6.9, isCaptain: false },
  ];
  return [...starters, ...subs];
}

function getPositionSuitability(form: number): { label: string; color: string } {
  if (form >= 7.5) return { label: 'Natural', color: 'text-emerald-400' };
  if (form >= 6.0) return { label: 'Learning', color: 'text-amber-400' };
  return { label: 'Out of Pos', color: 'text-red-400' };
}

// ============================================================
// Sub-Components
// ============================================================

function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
        />
      ))}
    </div>
  );
}

function BadgeShield({ badge, seasonsPlayed, trophies }: { badge: CoachingBadge; seasonsPlayed: number; trophies: number }) {
  const status = getBadgeStatus(seasonsPlayed, trophies, badge);
  const progress = getBadgeProgress(seasonsPlayed, trophies, badge);

  const statusColor = status === 'completed' ? 'border-emerald-500/40 bg-emerald-500/5' : status === 'in_progress' ? 'border-amber-500/40 bg-amber-500/5' : 'border-[#30363d] bg-[#21262d]/50';
  const statusIcon = status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : status === 'in_progress' ? <Clock className="h-4 w-4 text-amber-400" /> : <Lock className="h-4 w-4 text-[#484f58]" />;
  const progressColor = status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-amber-500' : 'bg-[#30363d]';

  return (
    <div className={`rounded-lg border p-3 ${statusColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#0d1117] flex items-center justify-center text-lg shrink-0 border border-[#30363d]">
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#c9d1d9] truncate">{badge.name}</span>
            {statusIcon}
          </div>
          <p className="text-[10px] text-[#8b949e] mt-0.5">{badge.requirement}</p>
          <div className="mt-1.5 h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
            <div className={`h-full rounded-sm transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[9px] text-[#484f58] mt-0.5">{progress}%</p>
        </div>
      </div>
    </div>
  );
}

function FormationDiagram({ formation, compact = false }: { formation: FormationKey; compact?: boolean }) {
  const positions = FORMATION_POSITIONS[formation];
  const svgSize = compact ? 120 : 200;

  return (
    <svg viewBox="0 0 100 100" width={svgSize} height={svgSize} className="shrink-0">
      {/* Pitch background */}
      <rect x="0" y="0" width="100" height="100" rx="4" fill="#0d1117" stroke="#30363d" strokeWidth="0.5" />
      {/* Center line */}
      <line x1="0" y1="50" x2="100" y2="50" stroke="#30363d" strokeWidth="0.3" strokeDasharray="2,1" />
      {/* Center circle */}
      <circle cx="50" cy="50" r="8" fill="none" stroke="#30363d" strokeWidth="0.3" />
      {/* Penalty areas */}
      <rect x="25" y="0" width="50" height="16" fill="none" stroke="#30363d" strokeWidth="0.3" />
      <rect x="25" y="84" width="50" height="16" fill="none" stroke="#30363d" strokeWidth="0.3" />
      {/* Player dots */}
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={compact ? 2.5 : 3.5} fill="#22c55e" opacity="0.85" />
          {compact ? null : (
            <text x={p.x} y={p.y + 1.2} textAnchor="middle" fontSize="3" fill="#0d1117" fontWeight="bold">
              {p.pos}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function MatchDayPitch({ formation }: { formation: FormationKey }) {
  const positions = FORMATION_POSITIONS[formation];

  return (
    <svg viewBox="0 0 200 280" width="100%" className="max-w-xs mx-auto">
      {/* Pitch */}
      <rect x="0" y="0" width="200" height="280" rx="6" fill="#0d1117" stroke="#30363d" strokeWidth="1" />
      {/* Grass stripes */}
      <rect x="0" y="0" width="200" height="40" fill="#111920" />
      <rect x="0" y="80" width="200" height="40" fill="#111920" />
      <rect x="0" y="160" width="200" height="40" fill="#111920" />
      <rect x="0" y="240" width="200" height="40" fill="#111920" />
      {/* Center line */}
      <line x1="0" y1="140" x2="200" y2="140" stroke="#30363d" strokeWidth="0.8" />
      {/* Center circle */}
      <circle cx="100" cy="140" r="25" fill="none" stroke="#30363d" strokeWidth="0.8" />
      <circle cx="100" cy="140" r="2" fill="#30363d" />
      {/* Penalty areas */}
      <rect x="50" y="0" width="100" height="45" fill="none" stroke="#30363d" strokeWidth="0.8" />
      <rect x="70" y="0" width="60" height="20" fill="none" stroke="#30363d" strokeWidth="0.5" />
      <rect x="50" y="235" width="100" height="45" fill="none" stroke="#30363d" strokeWidth="0.8" />
      <rect x="70" y="260" width="60" height="20" fill="none" stroke="#30363d" strokeWidth="0.5" />
      {/* Player positions */}
      {positions.map((p, i) => {
        const x = p.x * 2;
        const y = p.y * 2.8;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="10" fill="#22c55e" opacity="0.8" />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="7" fill="#0d1117" fontWeight="bold">
              {p.pos}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function WinRateDonut({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses;
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" width="140" height="140" className="mx-auto">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#30363d" strokeWidth="12" />
        <text x="60" y="56" textAnchor="middle" fontSize="18" fill="#c9d1d9" fontWeight="bold">0%</text>
        <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#8b949e">Win Rate</text>
      </svg>
    );
  }

  const winRate = Math.round((wins / total) * 100);
  const winAngle = (wins / total) * 360;
  const drawAngle = (draws / total) * 360;
  const lossAngle = (losses / total) * 360;
  const circumference = 2 * Math.PI * 45;
  const winLen = (winAngle / 360) * circumference;
  const drawLen = (drawAngle / 360) * circumference;
  const lossLen = (lossAngle / 360) * circumference;

  return (
    <svg viewBox="0 0 120 120" width="140" height="140" className="mx-auto">
      {/* Background ring */}
      <circle cx="60" cy="60" r="45" fill="none" stroke="#30363d" strokeWidth="12" />
      {/* Win segment (emerald) */}
      <circle cx="60" cy="60" r="45" fill="none" stroke="#22c55e" strokeWidth="12"
        strokeDasharray={`${winLen} ${circumference - winLen}`}
        strokeDashoffset="0" transform="rotate(-90 60 60)" strokeLinecap="butt" />
      {/* Draw segment (amber) */}
      <circle cx="60" cy="60" r="45" fill="none" stroke="#f59e0b" strokeWidth="12"
        strokeDasharray={`${drawLen} ${circumference - drawLen}`}
        strokeDashoffset={`${-winLen}`} transform="rotate(-90 60 60)" strokeLinecap="butt" />
      {/* Loss segment (red) */}
      <circle cx="60" cy="60" r="45" fill="none" stroke="#ef4444" strokeWidth="12"
        strokeDasharray={`${lossLen} ${circumference - lossLen}`}
        strokeDashoffset={`${-(winLen + drawLen)}`} transform="rotate(-90 60 60)" strokeLinecap="butt" />
      {/* Center text */}
      <text x="60" y="56" textAnchor="middle" fontSize="18" fill="#c9d1d9" fontWeight="bold">{winRate}%</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#8b949e">Win Rate</text>
    </svg>
  );
}

function ChemistryRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 22;
  const dashLen = (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 60 60" width="48" height="48">
      <circle cx="30" cy="30" r="22" fill="none" stroke="#30363d" strokeWidth="5" />
      <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
        strokeDashoffset="0" transform="rotate(-90 30 30)" strokeLinecap="round" />
      <text x="30" y="33" textAnchor="middle" fontSize="11" fill="#c9d1d9" fontWeight="bold">{score}</text>
    </svg>
  );
}

function GoalsComparisonBars({ goalsFor, goalsAgainst }: { goalsFor: number; goalsAgainst: number }) {
  const max = Math.max(goalsFor, goalsAgainst, 1);
  const gfWidth = Math.round((goalsFor / max) * 100);
  const gaWidth = Math.round((goalsAgainst / max) * 100);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-emerald-400 font-semibold">Goals For</span>
          <span className="text-xs font-bold text-emerald-400">{goalsFor}</span>
        </div>
        <div className="h-3 bg-[#0d1117] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${gfWidth}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-red-400 font-semibold">Goals Against</span>
          <span className="text-xs font-bold text-red-400">{goalsAgainst}</span>
        </div>
        <div className="h-3 bg-[#0d1117] rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-red-500 rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${gaWidth}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

function PositionTrendLine({ positions }: { positions: number[] }) {
  if (positions.length === 0) return null;
  const svgW = 240;
  const svgH = 80;
  const padding = 20;
  const maxPos = 20;
  const minPos = Math.max(1, ...positions);
  const range = maxPos - minPos || 1;

  const points = positions.map((pos, i) => {
    const x = padding + (i / Math.max(positions.length - 1, 1)) * (svgW - padding * 2);
    const y = padding + ((pos - minPos) / range) * (svgH - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const lastPoint = positions[positions.length - 1];
  const lastX = padding + ((positions.length - 1) / Math.max(positions.length - 1, 1)) * (svgW - padding * 2);
  const lastY = padding + ((lastPoint - minPos) / range) * (svgH - padding * 2);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" className="overflow-visible">
      {/* Grid lines */}
      {[1, 5, 10, 15, 20].map(pos => {
        const yPos = padding + ((pos - minPos) / range) * (svgH - padding * 2);
        if (yPos < padding || yPos > svgH - padding) return null;
        return (
          <g key={pos}>
            <line x1={padding} y1={yPos} x2={svgW - padding} y2={yPos} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={padding - 4} y={yPos + 3} textAnchor="end" fontSize="7" fill="#484f58">{pos}</text>
          </g>
        );
      })}
      {/* Trend line */}
      <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {positions.map((pos, i) => {
        const x = padding + (i / Math.max(positions.length - 1, 1)) * (svgW - padding * 2);
        const y = padding + ((pos - minPos) / range) * (svgH - padding * 2);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="2.5" fill={i === positions.length - 1 ? '#22c55e' : '#30363d'} stroke={i === positions.length - 1 ? '#22c55e' : '#484f58'} strokeWidth="0.5" />
          </g>
        );
      })}
      {/* Last position label */}
      <text x={lastX} y={lastY - 6} textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="bold">{lastPoint}th</text>
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function CoachCareerMode() {
  const gameState = useGameStore(state => state.gameState);

  const [activePhilosophy, setActivePhilosophy] = useState<PhilosophyKey>('total_football');
  const [dualCareer, setDualCareer] = useState(true);
  const [trainingPlan, setTrainingPlan] = useState<Record<number, TrainingFocus>>({
    0: 'tactics', 1: 'attack', 2: 'defense', 3: 'fitness', 4: 'tactics', 5: 'set_pieces', 6: 'fitness',
  });
  const [trainingIntensity, setTrainingIntensity] = useState<TrainingIntensity>('medium');
  const [squadTab, setSquadTab] = useState<'starters' | 'subs'>('starters');
  const [selectedFormation, setSelectedFormation] = useState<FormationKey>('4-3-3');
  const [selectedMentality, setSelectedMentality] = useState<MentalityKey>('balanced');
  const [instructions, setInstructions] = useState(['Press high from kickoff', 'Overlap on the left', 'Double-mark their #10']);
  const [squadPlayers, setSquadPlayers] = useState(() => generateSquadPlayers());
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const player = gameState?.player;
  const club = gameState?.currentClub;
  const seasons = gameState?.seasons ?? [];
  const currentSeason = gameState?.currentSeason ?? 1;

  // Derived data
  const seasonsPlayed = useMemo(() => player?.careerStats.seasonsPlayed ?? currentSeason, [player, currentSeason]);
  const trophies = useMemo(() => player?.careerStats.trophies?.length ?? 0, [player]);
  const coachLevel = useMemo(() => getCoachLevel(seasonsPlayed), [seasonsPlayed]);
  const coachXP = useMemo(() => getCoachXPProgress(seasonsPlayed), [seasonsPlayed]);
  const coachingYears = useMemo(() => Math.max(0, seasonsPlayed - 1), [seasonsPlayed]);

  const suitability = useMemo(() => {
    const pos = player?.position ?? 'CM';
    return getSuitability(pos, activePhilosophy);
  }, [player, activePhilosophy]);

  const balanceScore = useMemo(() => {
    const focusCount: Record<TrainingFocus, number> = { attack: 0, defense: 0, set_pieces: 0, fitness: 0, tactics: 0 };
    Object.values(trainingPlan).forEach(f => { focusCount[f]++; });
    const unique = Object.values(focusCount).filter(c => c > 0).length;
    return Math.round((unique / 5) * 100);
  }, [trainingPlan]);

  const moraleImpact = useMemo(() => {
    if (trainingIntensity === 'high') return { morale: -5, fitness: -10, label: 'Tiring', color: 'text-red-400' };
    if (trainingIntensity === 'medium') return { morale: 0, fitness: -5, label: 'Balanced', color: 'text-amber-400' };
    return { morale: 5, fitness: 0, label: 'Recovery', color: 'text-emerald-400' };
  }, [trainingIntensity]);

  const teamChemistry = useMemo(() => {
    const base = 65 + coachLevel * 5;
    return Math.min(99, base + (dualCareer ? 5 : -5));
  }, [coachLevel, dualCareer]);

  const starters = useMemo(() => squadPlayers.slice(0, 11), [squadPlayers]);
  const subs = useMemo(() => squadPlayers.slice(11), [squadPlayers]);
  const displaySquad = squadTab === 'starters' ? starters : subs;

  const leaguePositions = useMemo(() => seasons.map(s => s.leaguePosition).filter(p => p > 0), [seasons]);

  const coachingWins = useMemo(() => Math.round(seasonsPlayed * 14 * 0.48), [seasonsPlayed]);
  const coachingDraws = useMemo(() => Math.round(seasonsPlayed * 14 * 0.25), [seasonsPlayed]);
  const coachingLosses = useMemo(() => Math.round(seasonsPlayed * 14 * 0.27), [seasonsPlayed]);
  const gamesManaged = coachingWins + coachingDraws + coachingLosses;
  const coachingTrophies = useMemo(() => Math.min(trophies, Math.floor(seasonsPlayed / 3)), [trophies, seasonsPlayed]);
  const goalsFor = useMemo(() => coachingWins * 2 + coachingDraws, [coachingWins, coachingDraws]);
  const goalsAgainst = useMemo(() => coachingLosses * 2 + coachingDraws, [coachingLosses, coachingDraws]);

  const matchConfidence = useMemo(() => {
    let base = 50 + coachLevel * 6;
    if (selectedMentality === 'attacking') base += 5;
    if (selectedMentality === 'defensive') base -= 5;
    if (instructions.filter(i => i.trim()).length >= 3) base += 8;
    return Math.min(99, base);
  }, [coachLevel, selectedMentality, instructions]);

  const handleSetCaptain = useCallback((index: number) => {
    setSquadPlayers(prev => prev.map((p, i) => ({ ...p, isCaptain: i === index })));
  }, []);

  const handleDayFocus = useCallback((day: number, focus: TrainingFocus) => {
    setTrainingPlan(prev => ({ ...prev, [day]: focus }));
  }, []);

  if (!gameState || !player) {
    return (
      <div className={`p-4 max-w-lg mx-auto pb-20 ${DARK_BG} min-h-screen`}>
        <Card className={`${CARD_BG} ${BORDER_COLOR}`}>
          <CardContent className="p-6 text-center">
            <Briefcase className={`h-8 w-8 ${TEXT_SECONDARY} mx-auto mb-2`} />
            <p className={`text-sm ${TEXT_SECONDARY}`}>Start a career to unlock Coach Career Mode.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 max-w-lg mx-auto pb-20 ${DARK_BG} min-h-screen space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-lg font-bold ${TEXT_PRIMARY}`}>Coach Career</h1>
          <p className={`text-xs ${TEXT_SECONDARY}`}>Dual player-coach progression</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${TEXT_SECONDARY}`}>Dual Career</span>
          <button
            onClick={() => setDualCareer(prev => !prev)}
            className={`w-10 h-5 rounded-sm border transition-colors flex items-center px-0.5 ${
              dualCareer ? 'bg-emerald-500/20 border-emerald-500/40 justify-end' : 'bg-[#21262d] border-[#30363d] justify-start'
            }`}
          >
            <div className={`w-4 h-4 rounded-sm transition-colors ${dualCareer ? 'bg-emerald-400' : 'bg-[#484f58]'}`} />
          </button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`w-full ${CARD_BG} ${BORDER_COLOR} border grid grid-cols-4 gap-1 h-auto p-1`}>
          <TabsTrigger value="profile" className="text-[10px] py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">Profile</TabsTrigger>
          <TabsTrigger value="tactics" className="text-[10px] py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">Tactics</TabsTrigger>
          <TabsTrigger value="training" className="text-[10px] py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">Training</TabsTrigger>
          <TabsTrigger value="squad" className="text-[10px] py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">Squad</TabsTrigger>
        </TabsList>

        {/* ===================== PROFILE TAB ===================== */}
        <TabsContent value="profile" className="space-y-4 mt-3">
          {/* Coach Profile Header */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0 border border-[#30363d]">
                    <Briefcase className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`font-bold text-sm ${TEXT_PRIMARY}`}>{player.name}</h2>
                    <p className={`text-[10px] ${TEXT_SECONDARY} mt-0.5`}>
                      {player.position} &middot; Age {player.age} &middot; OVR {player.overall}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 h-4">
                        {player.squadStatus}
                      </Badge>
                      <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 h-4">
                        {club?.name ?? 'Free Agent'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Coach Stats Row */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-2 rounded-lg bg-[#21262d]">
                    <p className={`text-base font-bold ${TEXT_PRIMARY}`}>{coachLevel}</p>
                    <p className={`text-[9px] ${TEXT_SECONDARY}`}>Coach Level</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#21262d]">
                    <p className={`text-base font-bold text-amber-400`}>{coachingYears}</p>
                    <p className={`text-[9px] ${TEXT_SECONDARY}`}>Years Coaching</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#21262d]">
                    <p className={`text-base font-bold text-emerald-400`}>{trophies}</p>
                    <p className={`text-[9px] ${TEXT_SECONDARY}`}>Trophies</p>
                  </div>
                </div>

                {/* Coach Level Stars */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Coach Rating</span>
                  </div>
                  <StarRating count={coachLevel} />
                </div>

                {/* XP Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] ${TEXT_SECONDARY}`}>Level {coachLevel} XP</span>
                    <span className={`text-[10px] ${TEXT_SECONDARY}`}>{coachXP}%</span>
                  </div>
                  <Progress value={coachXP} className="h-2 bg-[#21262d]" />
                </div>

                {/* Career Stats Summary */}
                <div className="mt-3 pt-3 border-t border-[#30363d]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>Appearances</span>
                      <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{player.careerStats.totalAppearances}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>Goals</span>
                      <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{player.careerStats.totalGoals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>Assists</span>
                      <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{player.careerStats.totalAssists}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>Seasons</span>
                      <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{player.careerStats.seasonsPlayed}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Coaching Badges Tree */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Award className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Coaching Badges</h3>
            </div>
            <div className="space-y-2">
              {COACHING_BADGES.map((badge, idx) => (
                <div key={badge.id} className="relative">
                  {idx < COACHING_BADGES.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-4 bg-[#30363d]" />
                  )}
                  <BadgeShield badge={badge} seasonsPlayed={seasonsPlayed} trophies={trophies} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Staff Room */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Users className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Staff Room</h3>
            </div>
            <div className="space-y-2">
              {STAFF_MEMBERS.map(staff => {
                const isExpanded = expandedStaff === staff.id;
                return (
                  <Card key={staff.id} className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
                    <CardContent className="p-3">
                      <button className="w-full text-left" onClick={() => setExpandedStaff(isExpanded ? null : staff.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0 border border-[#30363d]">
                            <Briefcase className="h-4 w-4 text-[#8b949e]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold ${TEXT_PRIMARY} truncate`}>{staff.name}</span>
                              <ChevronRight className={`h-3.5 w-3.5 ${TEXT_SECONDARY} transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-50'}`} />
                            </div>
                            <p className={`text-[10px] ${TEXT_SECONDARY}`}>{staff.role}</p>
                            <StarRating count={staff.quality} max={5} />
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Specialization</span>
                            <span className={`text-xs ${TEXT_PRIMARY}`}>{staff.specialization}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Impact Area</span>
                            <span className={`text-xs ${TEXT_PRIMARY}`}>{staff.impactArea}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] ${TEXT_SECONDARY}`}>Quality</span>
                            <span className={`text-xs ${TEXT_PRIMARY}`}>{staff.quality}/5</span>
                          </div>
                          {/* Impact bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] ${TEXT_SECONDARY}`}>Team Impact</span>
                              <span className={`text-[10px] ${TEXT_SECONDARY}`}>{staff.quality * 18}%</span>
                            </div>
                            <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${staff.quality * 18}%` }} />
                            </div>
                          </div>
                          <button className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
                            Hire Upgrade &mdash; {(staff.hireCost / 1000).toFixed(0)}k/wk
                          </button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* ===================== TACTICS TAB ===================== */}
        <TabsContent value="tactics" className="space-y-4 mt-3">
          {/* Tactical Philosophy Panel */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Brain className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Tactical Philosophy</h3>
            </div>
            <div className="space-y-2">
              {(Object.entries(PHILOSOPHIES) as [PhilosophyKey, typeof PHILOSOPHIES[PhilosophyKey]][]).map(([key, phil]) => {
                const isActive = activePhilosophy === key;
                const suit = key === activePhilosophy ? suitability : getSuitability(player.position, key);
                return (
                  <Card
                    key={key}
                    className={`${CARD_BG} border overflow-hidden cursor-pointer transition-colors ${
                      isActive ? 'border-emerald-500/50' : `${BORDER_COLOR}`
                    }`}
                    onClick={() => setActivePhilosophy(key)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#21262d] border-[#30363d]'
                        }`}>
                          {phil.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>{phil.name}</span>
                            {isActive && (
                              <Badge className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 h-4 px-1.5">Active</Badge>
                            )}
                          </div>
                          <p className={`text-[10px] ${TEXT_SECONDARY} mt-0.5 leading-relaxed line-clamp-2`}>{phil.description}</p>
                          {/* Principles */}
                          <div className="mt-2 space-y-0.5">
                            {phil.principles.map((p, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <CircleDot className={`h-2 w-2 ${isActive ? 'text-emerald-400' : 'text-[#484f58]'}`} />
                                <span className={`text-[10px] ${isActive ? TEXT_PRIMARY : TEXT_SECONDARY}`}>{p}</span>
                              </div>
                            ))}
                          </div>
                          {/* Suitability */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#21262d]">
                            <span className={`text-[9px] ${TEXT_SECONDARY}`}>Position Suitability</span>
                            <span className={`text-xs font-bold ${suit >= 75 ? 'text-emerald-400' : suit >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {suit}%
                            </span>
                          </div>
                        </div>
                        <FormationDiagram formation={phil.formation} compact />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Match Day Strategy */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Swords className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Match Day Strategy</h3>
            </div>
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
              <CardContent className="p-4 space-y-4">
                {/* Formation Selector */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Formation</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'] as FormationKey[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedFormation(f)}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors border ${
                          selectedFormation === f
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : `bg-[#21262d] ${TEXT_SECONDARY} border-[#30363d] hover:border-[#484f58]`
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mentality Selector */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Mentality</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'attacking' as MentalityKey, label: 'Attacking', color: 'text-red-400' },
                      { key: 'balanced' as MentalityKey, label: 'Balanced', color: 'text-amber-400' },
                      { key: 'defensive' as MentalityKey, label: 'Defensive', color: 'text-blue-400' },
                    ]).map(m => (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMentality(m.key)}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors border ${
                          selectedMentality === m.key
                            ? `bg-emerald-500/15 ${m.color} border-emerald-500/30`
                            : `bg-[#21262d] ${TEXT_SECONDARY} border-[#30363d] hover:border-[#484f58]`
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Diagram */}
                <MatchDayPitch formation={selectedFormation} />

                {/* Key Instructions */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Key Instructions</p>
                  <div className="space-y-1.5">
                    {instructions.map((inst, i) => (
                      <input
                        key={i}
                        value={inst}
                        onChange={e => {
                          const newInst = [...instructions];
                          newInst[i] = e.target.value;
                          setInstructions(newInst);
                        }}
                        placeholder={`Instruction ${i + 1}...`}
                        className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    ))}
                  </div>
                </div>

                {/* Match Plan Confidence */}
                <div className="pt-3 border-t border-[#30363d]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${TEXT_PRIMARY} flex items-center gap-1.5`}>
                      <Eye className="h-3.5 w-3.5" />
                      Match Plan Confidence
                    </span>
                    <span className={`text-sm font-bold ${matchConfidence >= 75 ? 'text-emerald-400' : matchConfidence >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {matchConfidence}%
                    </span>
                  </div>
                  <Progress value={matchConfidence} className="h-2 bg-[#21262d]" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Coaching Stats Dashboard */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <BarChart3 className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Coaching Stats</h3>
            </div>
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
              <CardContent className="p-4 space-y-4">
                {/* Win Rate Donut */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-3`}>Win Rate</p>
                  <WinRateDonut wins={coachingWins} draws={coachingDraws} losses={coachingLosses} />
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>W {coachingWins}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-amber-500" />
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>D {coachingDraws}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm bg-red-500" />
                      <span className={`text-[10px] ${TEXT_SECONDARY}`}>L {coachingLosses}</span>
                    </div>
                  </div>
                </div>

                {/* League Position Trend */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>League Position Trend</p>
                  {leaguePositions.length > 0 ? (
                    <PositionTrendLine positions={leaguePositions} />
                  ) : (
                    <p className={`text-xs ${TEXT_SECONDARY} text-center py-4`}>No season data yet</p>
                  )}
                </div>

                {/* Goals Comparison */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Goals For / Against</p>
                  <GoalsComparisonBars goalsFor={goalsFor} goalsAgainst={goalsAgainst} />
                </div>

                {/* Counters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-[#21262d]">
                    <p className={`text-lg font-bold ${TEXT_PRIMARY}`}>{gamesManaged}</p>
                    <p className={`text-[9px] ${TEXT_SECONDARY}`}>Games Managed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[#21262d]">
                    <p className={`text-lg font-bold text-amber-400`}>{coachingTrophies}</p>
                    <p className={`text-[9px] ${TEXT_SECONDARY}`}>Trophies as Coach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ===================== TRAINING TAB ===================== */}
        <TabsContent value="training" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Dumbbell className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Training Regimen Designer</h3>
            </div>
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
              <CardContent className="p-4 space-y-4">
                {/* Intensity Selector */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Training Intensity</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'low' as TrainingIntensity, label: 'Low', icon: <Heart className="h-3.5 w-3.5" /> },
                      { key: 'medium' as TrainingIntensity, label: 'Medium', icon: <Flame className="h-3.5 w-3.5" /> },
                      { key: 'high' as TrainingIntensity, label: 'High', icon: <Zap className="h-3.5 w-3.5" /> },
                    ]).map(int => (
                      <button
                        key={int.key}
                        onClick={() => setTrainingIntensity(int.key)}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors border flex items-center justify-center gap-1.5 ${
                          trainingIntensity === int.key
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : `bg-[#21262d] ${TEXT_SECONDARY} border-[#30363d] hover:border-[#484f58]`
                        }`}
                      >
                        {int.icon}
                        {int.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Morale Impact */}
                <div className={`flex items-center justify-between p-2.5 rounded-lg bg-[#21262d] border border-[#30363d]`}>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5" />
                    <span className={`text-[10px] ${TEXT_SECONDARY}`}>Team Morale Impact</span>
                  </div>
                  <span className={`text-xs font-bold ${moraleImpact.color}`}>
                    {moraleImpact.label} ({moraleImpact.morale > 0 ? '+' : ''}{moraleImpact.morale})
                  </span>
                </div>

                {/* Weekly Training Plan */}
                <div>
                  <p className={`text-[10px] font-semibold ${TEXT_SECONDARY} uppercase tracking-wider mb-2`}>Weekly Plan</p>
                  <div className="space-y-1.5">
                    {DAY_LABELS.map((day, idx) => {
                      const currentFocus = trainingPlan[idx] ?? 'fitness';
                      const focusOption = TRAINING_OPTIONS.find(o => o.key === currentFocus);
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold ${TEXT_SECONDARY} w-8 shrink-0`}>{day}</span>
                          <div className="flex-1 flex gap-1">
                            {TRAINING_OPTIONS.map(opt => (
                              <button
                                key={opt.key}
                                onClick={() => handleDayFocus(idx, opt.key)}
                                className={`flex-1 py-1.5 rounded-md text-[9px] font-semibold transition-colors border ${
                                  currentFocus === opt.key
                                    ? `${opt.color} bg-[#0d1117] border-current`
                                    : 'bg-[#21262d] text-[#484f58] border-[#30363d] hover:border-[#484f58]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {focusOption && (
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${focusOption.color}`}>
                              {focusOption.icon}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Balance Score */}
                <div className={`p-3 rounded-lg bg-[#21262d] border border-[#30363d]`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${TEXT_PRIMARY} flex items-center gap-1.5`}>
                      <LineChart className="h-3.5 w-3.5" />
                      Balance Score
                    </span>
                    <span className={`text-xs font-bold ${balanceScore >= 80 ? 'text-emerald-400' : balanceScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {balanceScore}%
                    </span>
                  </div>
                  <Progress value={balanceScore} className="h-2 bg-[#0d1117]" />
                  <p className={`text-[9px] ${TEXT_SECONDARY} mt-1`}>
                    {balanceScore >= 80 ? 'Excellent variety! Your team will develop well-rounded skills.' :
                     balanceScore >= 60 ? 'Good mix. Consider adding more variety to training focus.' :
                     'Unbalanced schedule. Players may neglect key areas.'}
                  </p>
                </div>

                {/* Fitness Impact */}
                <div className={`p-3 rounded-lg bg-[#21262d] border border-[#30363d]`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${TEXT_PRIMARY} flex items-center gap-1.5`}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      Fitness Impact
                    </span>
                    <span className={`text-xs font-bold ${trainingIntensity === 'high' ? 'text-red-400' : trainingIntensity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {moraleImpact.fitness > 0 ? '+' : ''}{moraleImpact.fitness}%
                    </span>
                  </div>
                  <p className={`text-[9px] ${TEXT_SECONDARY} mt-1`}>
                    {trainingIntensity === 'high' ? 'High intensity increases injury risk. Monitor player fitness carefully.' :
                     trainingIntensity === 'medium' ? 'Standard intensity maintains current fitness levels.' :
                     'Low intensity helps recovery between matches.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ===================== SQUAD TAB ===================== */}
        <TabsContent value="squad" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Users className={`h-3.5 w-3.5 ${TEXT_SECONDARY}`} />
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>Squad Management</h3>
              </div>
              <div className="flex items-center gap-2">
                <ChemistryRing score={teamChemistry} />
                <span className={`text-[10px] ${TEXT_SECONDARY}`}>Chemistry</span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className={`flex gap-1 mb-3`}>
              <button
                onClick={() => setSquadTab('starters')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  squadTab === 'starters'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : `bg-[#21262d] ${TEXT_SECONDARY} border-[#30363d]`
                }`}
              >
                Starting XI
              </button>
              <button
                onClick={() => setSquadTab('subs')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  squadTab === 'subs'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : `bg-[#21262d] ${TEXT_SECONDARY} border-[#30363d]`
                }`}
              >
                Substitutes
              </button>
            </div>

            {/* Squad Grid */}
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden`}>
              <div className="grid grid-cols-12 gap-0">
                {/* Header */}
                <div className={`col-span-3 px-3 py-2 border-b border-[#30363d]`}>
                  <span className={`text-[9px] font-semibold ${TEXT_SECONDARY} uppercase`}>Player</span>
                </div>
                <div className={`col-span-2 px-2 py-2 border-b border-[#30363d] text-center`}>
                  <span className={`text-[9px] font-semibold ${TEXT_SECONDARY} uppercase`}>Pos</span>
                </div>
                <div className={`col-span-2 px-2 py-2 border-b border-[#30363d] text-center`}>
                  <span className={`text-[9px] font-semibold ${TEXT_SECONDARY} uppercase`}>OVR</span>
                </div>
                <div className={`col-span-2 px-2 py-2 border-b border-[#30363d] text-center`}>
                  <span className={`text-[9px] font-semibold ${TEXT_SECONDARY} uppercase`}>Form</span>
                </div>
                <div className={`col-span-3 px-2 py-2 border-b border-[#30363d] text-center`}>
                  <span className={`text-[9px] font-semibold ${TEXT_SECONDARY} uppercase`}>Fit</span>
                </div>

                {/* Players */}
                {displaySquad.map((p, idx) => {
                  const globalIdx = squadTab === 'starters' ? idx : idx + 11;
                  const posInfo = getPositionSuitability(p.form);
                  return (
                    <div
                      key={idx}
                      className={`contents ${
                        p.isCaptain ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {/* Player Name + Captain */}
                      <div className={`col-span-3 px-3 py-2.5 border-b border-[#21262d] flex items-center gap-1.5`}>
                        <button
                          onClick={() => handleSetCaptain(globalIdx)}
                          className="shrink-0"
                          title={p.isCaptain ? 'Remove captain' : 'Set as captain'}
                        >
                          <Star className={`h-3.5 w-3.5 ${p.isCaptain ? 'text-amber-400 fill-amber-400' : 'text-[#30363d] hover:text-amber-400/50'}`} />
                        </button>
                        <span className={`text-xs ${TEXT_PRIMARY} truncate ${p.isCaptain ? 'font-semibold' : ''}`}>
                          {p.name}
                        </span>
                      </div>
                      {/* Position */}
                      <div className={`col-span-2 px-2 py-2.5 border-b border-[#21262d] text-center`}>
                        <span className={`text-xs font-bold ${posInfo.color}`}>{p.pos}</span>
                      </div>
                      {/* OVR */}
                      <div className={`col-span-2 px-2 py-2.5 border-b border-[#21262d] text-center`}>
                        <span className={`text-xs font-bold ${p.ovr >= 80 ? 'text-emerald-400' : p.ovr >= 75 ? TEXT_PRIMARY : TEXT_SECONDARY}`}>
                          {p.ovr}
                        </span>
                      </div>
                      {/* Form */}
                      <div className={`col-span-2 px-2 py-2.5 border-b border-[#21262d] text-center`}>
                        <span className={`text-xs font-semibold ${p.form >= 7.5 ? 'text-emerald-400' : p.form >= 6.0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {p.form.toFixed(1)}
                        </span>
                      </div>
                      {/* Suitability */}
                      <div className={`col-span-3 px-2 py-2.5 border-b border-[#21262d] text-center`}>
                        <Badge className={`text-[8px] px-1.5 h-4 ${
                          posInfo.label === 'Natural' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          posInfo.label === 'Learning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {posInfo.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Best XI Suggestion */}
            <Card className={`${CARD_BG} ${BORDER_COLOR} border overflow-hidden mt-3`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Best XI Auto-Suggestion</span>
                  </div>
                  <button className={`text-[10px] text-emerald-400 font-semibold hover:underline`}>
                    Apply
                  </button>
                </div>
                <p className={`text-[10px] ${TEXT_SECONDARY} mt-1`}>
                  Based on form and OVR ratings. Best XI optimizes team chemistry and player suitability.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
