'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Shield,
  Star,
  AlertTriangle,
  DollarSign,
  ChevronRight,
  BarChart3,
  Award,
  Lock,
  CheckCircle2,
  Clock,
  CircleDot,
  Swords,
  MapPin,
  Home,
  ChevronDown,
  Briefcase,
  Zap,
  Heart,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Static / Mock Data
// ---------------------------------------------------------------------------

const MANAGER = {
  name: 'You',
  age: 38,
  nationality: '🇬🇧',
  rating: 76,
  type: 'Tactician' as const,
  stats: {
    tactics: 82,
    manManagement: 71,
    transferAcumen: 68,
    youthDevelopment: 74,
  },
  club: 'Greenfield United',
  league: 'Premier Division',
  seasonsAtClub: 2,
  contractExpiry: '2027',
  winRate: 58,
  totalMatchesManaged: 142,
  totalTrophies: 1,
  preferredFormation: '4-3-3',
};

type ManagerType = 'Tactician' | 'Motivator' | 'Developer';

type FormationKey = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2';

interface FormationMeta {
  label: string;
  desc: string;
  strength: string;
  weakness: string;
}

const FORMATIONS: Record<FormationKey, FormationMeta> = {
  '4-4-2': {
    label: '4-4-2',
    desc: 'Classic two-striker setup with balanced width from wingers and a strong central midfield pairing.',
    strength: 'Strong in the air, excellent crossing options',
    weakness: 'Can be overrun in central midfield against 3-man midfields',
  },
  '4-3-3': {
    label: '4-3-3',
    desc: 'Wide front three with a single striker providing natural width and pressing from the flanks.',
    strength: 'Natural width, great for counter-attacks',
    weakness: 'Lone striker can be isolated against deep defences',
  },
  '3-5-2': {
    label: '3-5-2',
    desc: 'Three centre-backs with wing-backs providing width. Two strikers for central pressure.',
    strength: 'Dominant central defence, strong attacking pairing',
    weakness: 'Wing-backs can be exposed on the counter',
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    desc: 'Double pivot anchors midfield. Number 10 supports a lone striker with creative freedom.',
    strength: 'Balanced in all phases, creative number 10 role',
    weakness: 'Requires a high-quality playmaker to be effective',
  },
  '3-4-3': {
    label: '3-4-3',
    desc: 'Attacking trident up front with a compact diamond midfield behind three center-backs.',
    strength: 'Extremely attacking, multiple goalscoring threats',
    weakness: 'Vulnerable to counter-attacks, high defensive risk',
  },
  '5-3-2': {
    label: '5-3-2',
    desc: 'Ultra-defensive with wing-backs. Three center-backs and a compact midfield block.',
    strength: 'Very solid defensively, difficult to break down',
    weakness: 'Lacks creative spark and attacking penetration',
  },
};

type PosMap = Record<string, [number, number]>;

const FORMATION_POSITIONS: Record<FormationKey, PosMap> = {
  '4-4-2': {
    GK: [50, 90], LB: [15, 70], CB: [37, 73], CB2: [63, 73], RB: [85, 70],
    LM: [15, 48], CM: [37, 50], CM2: [63, 50], RM: [85, 48],
    ST: [37, 22], ST2: [63, 22],
  },
  '4-3-3': {
    GK: [50, 90], LB: [12, 68], CB: [37, 73], CB2: [63, 73], RB: [88, 68],
    CM: [30, 48], CM2: [50, 45], CM3: [70, 48],
    LW: [15, 22], ST: [50, 18], RW: [85, 22],
  },
  '3-5-2': {
    GK: [50, 90], CB: [25, 73], CB2: [50, 75], CB3: [75, 73],
    LWB: [10, 50], CM: [35, 50], CM2: [50, 45], CM3: [65, 50], RWB: [90, 50],
    ST: [37, 22], ST2: [63, 22],
  },
  '4-2-3-1': {
    GK: [50, 90], LB: [12, 70], CB: [37, 73], CB2: [63, 73], RB: [88, 70],
    CDM: [37, 52], CDM2: [63, 52],
    LW: [15, 33], CAM: [50, 30], RW: [85, 33],
    ST: [50, 18],
  },
  '3-4-3': {
    GK: [50, 90], CB: [25, 73], CB2: [50, 75], CB3: [75, 73],
    CM: [30, 50], CM2: [50, 48], CM3: [70, 50], CM4: [50, 38],
    LW: [15, 20], ST: [50, 15], RW: [85, 20],
  },
  '5-3-2': {
    GK: [50, 90], LWB: [10, 65], CB: [28, 73], CB2: [50, 76], CB3: [72, 73], RWB: [90, 65],
    CM: [30, 48], CM2: [50, 45], CM3: [70, 48],
    ST: [37, 22], ST2: [63, 22],
  },
};

interface SquadPlayer {
  name: string;
  pos: string;
  ovr: number;
  age: number;
  form: ('W' | 'D' | 'L')[];
  morale: number;
  fitness: number;
}

const STARTING_XI: SquadPlayer[] = [
  { name: 'Martinez', pos: 'GK', ovr: 82, age: 26, form: ['W', 'W', 'D', 'W', 'L'], morale: 78, fitness: 92 },
  { name: 'Silva', pos: 'CB', ovr: 80, age: 29, form: ['W', 'D', 'W', 'W', 'D'], morale: 81, fitness: 88 },
  { name: 'Dias', pos: 'CB', ovr: 81, age: 27, form: ['W', 'W', 'W', 'D', 'W'], morale: 85, fitness: 95 },
  { name: 'Walker', pos: 'RB', ovr: 78, age: 30, form: ['D', 'W', 'L', 'W', 'W'], morale: 72, fitness: 84 },
  { name: 'Shaw', pos: 'LB', ovr: 77, age: 28, form: ['W', 'L', 'W', 'W', 'D'], morale: 74, fitness: 90 },
  { name: 'Rodri', pos: 'CDM', ovr: 84, age: 27, form: ['W', 'W', 'W', 'W', 'W'], morale: 90, fitness: 91 },
  { name: 'De Bruyne', pos: 'CM', ovr: 86, age: 32, form: ['W', 'D', 'W', 'L', 'W'], morale: 82, fitness: 85 },
  { name: 'Bellingham', pos: 'CM', ovr: 83, age: 21, form: ['D', 'W', 'W', 'W', 'W'], morale: 88, fitness: 96 },
  { name: 'Salah', pos: 'RW', ovr: 85, age: 31, form: ['W', 'W', 'D', 'W', 'W'], morale: 86, fitness: 89 },
  { name: 'Saka', pos: 'LW', ovr: 82, age: 22, form: ['L', 'W', 'W', 'D', 'W'], morale: 79, fitness: 93 },
  { name: 'Haaland', pos: 'ST', ovr: 89, age: 23, form: ['W', 'W', 'W', 'W', 'W'], morale: 92, fitness: 97 },
];

const BENCH_PLAYERS: SquadPlayer[] = [
  { name: 'Foden', pos: 'CAM', ovr: 81, age: 23, form: ['W', 'W', 'D', 'W', 'W'], morale: 80, fitness: 88 },
  { name: 'Laporte', pos: 'CB', ovr: 79, age: 29, form: ['D', 'D', 'W', 'L', 'W'], morale: 70, fitness: 82 },
  { name: 'Grealish', pos: 'LW', ovr: 78, age: 28, form: ['L', 'D', 'W', 'W', 'D'], morale: 68, fitness: 86 },
  { name: 'Ederson', pos: 'GK', ovr: 80, age: 29, form: ['W', 'W', 'W', 'D', 'W'], morale: 75, fitness: 90 },
  { name: 'Palmer', pos: 'RW', ovr: 77, age: 21, form: ['W', 'D', 'D', 'W', 'L'], morale: 73, fitness: 85 },
];

const TACTICAL_STYLES = [
  { label: 'Attacking', attack: 70, desc: 'High pressing, direct forward play, width from fullbacks' },
  { label: 'Balanced', attack: 50, desc: 'Structured approach, controlled build-up, adaptable shape' },
  { label: 'Defensive', attack: 30, desc: 'Deep block, compact midfield, counter-attacking outlet' },
  { label: 'Counter-Attack', attack: 40, desc: 'Sit deep, absorb pressure, quick transitions forward' },
  { label: 'Possession', attack: 60, desc: 'Short passing, patient build-up, dominate the ball' },
] as const;

const RECENT_TRANSFERS_IN = [
  { name: 'T. Partey', from: 'Arsenal', fee: '£12M', pos: 'CDM', ovr: 79 },
  { name: 'M. Rice', from: 'West Ham', fee: '£28M', pos: 'CM', ovr: 81 },
  { name: 'L. Digne', from: 'Everton', fee: '£8M', pos: 'LB', ovr: 77 },
];

const RECENT_TRANSFERS_OUT = [
  { name: 'J. Lingard', to: 'Nottingham', fee: '£4M', pos: 'AM' },
  { name: 'A. Tuanzebe', to: 'Villarreal', fee: '£2M', pos: 'CB' },
];

const TRANSFER_TARGETS = [
  { name: 'J. Mbappé', pos: 'ST', ovr: 91, price: '£85M', club: 'PSG', status: 'Available' },
  { name: 'P. Fofana', pos: 'CM', ovr: 79, price: '£18M', club: 'Monaco', status: 'Scouted' },
  { name: 'J. Gvardiol', pos: 'CB', ovr: 82, price: '£35M', club: 'Leipzig', status: 'Negotiating' },
];

const BOARD_OBJECTIVES = [
  { label: 'Finish in Top 4', current: '2nd (23 matches played)', progress: 75, target: 100, status: 'on-track' as const },
  { label: 'Reach Cup Quarter Finals', current: 'Round of 16 draw', progress: 50, target: 100, status: 'on-track' as const },
  { label: 'Promote 2 Academy Players', current: '1 promoted', progress: 50, target: 100, status: 'in-progress' as const },
  { label: 'Stay within wage budget', current: 'Under budget by £250k/wk', progress: 100, target: 100, status: 'completed' as const },
];

const ACHIEVEMENTS = [
  { name: 'Tactical Genius', desc: 'Win using 5+ different formations in a single season', current: 3, target: 5, unlocked: false, points: 150 },
  { name: 'Youth Promoter', desc: 'Promote 10 academy players to the first team', current: 7, target: 10, unlocked: false, points: 200 },
  { name: 'Transfer Master', desc: 'Complete 50 transfer dealings across all windows', current: 34, target: 50, unlocked: false, points: 100 },
  { name: 'Cup Winner', desc: 'Win a domestic cup competition', current: 1, target: 1, unlocked: true, points: 300 },
  { name: 'Undefeated Season', desc: 'Go a full league season unbeaten', current: 0, target: 1, unlocked: false, points: 500 },
  { name: 'Club Legend', desc: 'Manage a single club for 10+ seasons', current: 2, target: 10, unlocked: false, points: 250 },
];

const LEAGUE_TABLE = [
  { pos: 1, team: 'Redfield City', played: 23, w: 16, d: 3, l: 4, gf: 48, ga: 20, gd: '+28', pts: 51 },
  { pos: 2, team: 'Greenfield United', played: 23, w: 14, d: 5, l: 4, gf: 42, ga: 18, gd: '+24', pts: 47 },
  { pos: 3, team: 'Bluewater FC', played: 23, w: 13, d: 6, l: 4, gf: 39, ga: 22, gd: '+17', pts: 45 },
  { pos: 4, team: 'Goldstone Town', played: 23, w: 12, d: 7, l: 4, gf: 37, ga: 24, gd: '+13', pts: 43 },
  { pos: 5, team: 'Silvermoor Athletic', played: 23, w: 11, d: 7, l: 5, gf: 34, ga: 23, gd: '+11', pts: 40 },
  { pos: 6, team: 'Blackridge Rovers', played: 23, w: 10, d: 8, l: 5, gf: 32, ga: 22, gd: '+10', pts: 38 },
];

const SEASON_FORM: ('W' | 'D' | 'L')[] = ['W', 'W', 'D', 'W', 'L', 'W'];

const POSITION_TREND = [5, 4, 3, 2, 3, 2, 2, 3, 2, 2];

const OPPONENT_ANALYSIS = {
  team: 'Bluewater FC',
  formation: '4-2-3-1',
  ovr: 79,
  style: 'Possession-based, patient build-up',
  strengths: [
    'Strong midfield control with 77% average pass accuracy',
    'Dangerous on set pieces — 8 goals from dead balls this season',
    'Quick transitions from defence to attack',
  ],
  weaknesses: [
    'Left side vulnerable to overlaps',
    'Slow defensive transitions — exposed on counters',
    'Weak at defending set pieces — conceded 12 from dead balls',
    'Goalkeeper poor distribution under pressure',
  ],
  keyPlayer: 'M. Ødegaard (CAM, OVR 84) — 8 goals, 11 assists',
};

const TEAM_TALK_OPTIONS = [
  {
    label: 'Motivational',
    quote: 'Go out there and express yourselves. We believe in you!',
    morale: '+8',
    attacking: '+5',
    risk: 'low',
    desc: 'Boosts morale significantly, slightly increases attacking intent',
  },
  {
    label: 'Cautious',
    quote: 'Stay organized and patient. Wait for the right moment.',
    morale: '+3',
    attacking: '-5',
    risk: 'low',
    desc: 'Small morale boost, increases defensive stability',
  },
  {
    label: 'Aggressive',
    quote: 'Press them high from the start! No mercy!',
    morale: '+5',
    attacking: '+10',
    risk: 'high',
    desc: 'Large attacking boost but risk of early fatigue and cards',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressRing({ value, size = 100, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        className="fill-emerald-400 text-xl font-bold"
        style={{ fontSize: size * 0.22 }}
      >
        {value}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 10}
        textAnchor="middle"
        className="fill-[#8b949e]"
        style={{ fontSize: size * 0.1 }}
      >
        OVR
      </text>
    </svg>
  );
}

function StatBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color || (pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-emerald-500/80' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500');

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#8b949e]">{label}</span>
        <span className="text-[#c9d1d9] font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
        <motion.div
          className={`h-full ${barColor} rounded-md`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function Card({ title, icon, children, badge }: { title: string; icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">{icon}</span>
          <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Section({ id, active, label, icon, children }: { id: string; active: boolean; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.div
          key={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400">{icon}</span>
            <h2 className="text-base font-bold text-[#c9d1d9]">{label}</h2>
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 text-center">
      <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
        result === 'W' ? 'bg-emerald-500' : result === 'D' ? 'bg-amber-500' : 'bg-red-500'
      }`}
    />
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold ${
        result === 'W'
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : result === 'D'
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      {result}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  const moodText = value >= 80 ? 'Very Confident' : value >= 60 ? 'Confident' : value >= 40 ? 'Cautious' : value >= 20 ? 'Concerned' : 'Very Concerned';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#21262d" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(value / 100) * 97.4} 97.4`}
            strokeDashoffset="24.35"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#c9d1d9]">
          {value}%
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${value >= 70 ? 'text-emerald-400' : value >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
          {moodText}
        </p>
        <div className="h-2 bg-[#21262d] rounded-md overflow-hidden mt-1.5">
          <motion.div
            className="h-full rounded-md"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
      </div>
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function SliderControl({ label, value, onChange, lowLabel, highLabel }: { label: string; value: number; onChange: (v: number) => void; lowLabel?: string; highLabel?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#8b949e]">{label}</span>
        <span className="text-[#c9d1d9] font-semibold">{value}/100</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[10px] text-[#484f58]">
          <span>{lowLabel || 'Low'}</span>
          <span>{highLabel || 'High'}</span>
        </div>
      )}
    </div>
  );
}

function SetPieceDropdown({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const players = STARTING_XI.map(p => p.name);

  return (
    <div className="relative">
      <p className="text-[10px] uppercase text-[#8b949e] tracking-wide mb-1">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-xs text-[#c9d1d9] hover:border-emerald-500/20 transition-colors"
      >
        <span className="flex items-center gap-2">
          <CircleDot className="h-3 w-3 text-emerald-400" />
          {value}
        </span>
        <ChevronDown className={`h-3 w-3 text-[#8b949e] transition-opacity ${open ? 'opacity-100' : 'opacity-60'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute z-10 mt-1 w-full bg-[#161b22] border border-[#30363d] rounded-md shadow-lg overflow-hidden"
          >
            {players.map(name => (
              <button
                key={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  name === value
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-[#c9d1d9] hover:bg-[#21262d]'
                }`}
              >
                {name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type TabKey =
  | 'profile'
  | 'squad'
  | 'tactics'
  | 'transfers'
  | 'board'
  | 'matchday'
  | 'season'
  | 'achievements';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <UserCog className="h-4 w-4" /> },
  { key: 'squad', label: 'Squad', icon: <Users className="h-4 w-4" /> },
  { key: 'tactics', label: 'Tactics', icon: <Target className="h-4 w-4" /> },
  { key: 'transfers', label: 'Transfers', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'board', label: 'Board', icon: <Trophy className="h-4 w-4" /> },
  { key: 'matchday', label: 'Match', icon: <Swords className="h-4 w-4" /> },
  { key: 'season', label: 'Season', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'achievements', label: 'Awards', icon: <Award className="h-4 w-4" /> },
];

export default function ManagerCareer() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [tacticalStyle, setTacticalStyle] = useState(1);
  const [pressing, setPressing] = useState(65);
  const [defLine, setDefLine] = useState(50);
  const [tempo, setTempo] = useState(60);
  const [cornerTaker, setCornerTaker] = useState('Saka');
  const [fkTaker, setFkTaker] = useState('De Bruyne');
  const [penTaker, setPenTaker] = useState('Haaland');
  const [teamTalk, setTeamTalk] = useState<number | null>(null);

  const benchOvr = 78;
  const injuryCount = 2;
  const suspensionCount = 1;
  const squadSize = 25;
  const avgOvr = 81;
  const transferBudget = 42000000;
  const wageBill = 1850000;
  const wageBudget = 2100000;
  const boardConfidence = 72;
  const transferWindowOpen = true;
  const transferWindowDaysLeft = 14;

  const formationDesc = FORMATIONS[formation]?.desc ?? '';

  // -----------------------------------------------------------------------
  // 1. Manager Profile Header
  // -----------------------------------------------------------------------
  const renderProfile = () => (
    <Section id="profile" active={activeTab === 'profile'} label="Manager Profile" icon={<UserCog className="h-5 w-5" />}>
      <Card title="Manager Info" icon={<UserCog className="h-4 w-4" />}>
        <div className="flex items-start gap-4">
          {/* SVG Manager Avatar */}
          <div className="flex-shrink-0">
            <svg width="84" height="84" viewBox="0 0 84 84" className="block">
              <rect width="84" height="84" rx="12" fill="#21262d" />
              <rect x="2" y="2" width="80" height="80" rx="11" fill="none" stroke="#30363d" strokeWidth="1" />
              {/* Head */}
              <circle cx="42" cy="28" r="10" fill="#30363d" />
              {/* Hair */}
              <path d="M32 24 Q37 15 42 17 Q47 15 52 24" fill="#1a1a2e" />
              {/* Ears */}
              <circle cx="32" cy="30" r="2" fill="#30363d" />
              <circle cx="52" cy="30" r="2" fill="#30363d" />
              {/* Eyes */}
              <circle cx="38" cy="27" r="1" fill="#c9d1d9" />
              <circle cx="46" cy="27" r="1" fill="#c9d1d9" />
              {/* Mouth */}
              <line x1="39" y1="32" x2="45" y2="32" stroke="#8b949e" strokeWidth="0.5" />
              {/* Suit jacket */}
              <path d="M28 42 L42 38 L56 42 L54 70 L30 70 Z" fill="#1a1a2e" />
              {/* Suit lapels */}
              <path d="M36 38 L42 44 L42 38" fill="#252540" />
              <path d="M48 38 L42 44 L42 38" fill="#252540" />
              {/* Tie */}
              <polygon points="42,38 39,54 42,57 45,54" fill="#10b981" />
              {/* Shirt collar */}
              <path d="M36 38 L42 43 L48 38" fill="none" stroke="#c9d1d9" strokeWidth="1" />
              {/* Pocket square */}
              <rect x="44" y="48" width="4" height="3" rx="0.5" fill="#10b981" opacity="0.5" />
            </svg>
          </div>

          {/* Info + Rating Ring */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#c9d1d9] truncate">{MANAGER.name}</h2>
                <p className="text-xs text-[#8b949e]">
                  {MANAGER.nationality} Age {MANAGER.age} &middot; {MANAGER.club}
                </p>
                <p className="text-xs text-[#8b949e]">{MANAGER.league}</p>
              </div>
              <ProgressRing value={MANAGER.rating} size={72} stroke={5} />
            </div>

            {/* Manager type badge */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                MANAGER.type === 'Tactician' ? 'bg-emerald-500/20 text-emerald-400' :
                MANAGER.type === 'Motivator' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <Star className="h-3 w-3" />
                {MANAGER.type}
              </span>
              <span className="text-[10px] text-[#8b949e]">{MANAGER.seasonsAtClub} season{MANAGER.seasonsAtClub > 1 ? 's' : ''} at club</span>
              <span className="text-[10px] text-[#484f58]">|</span>
              <span className="text-[10px] text-[#8b949e]">Contract until {MANAGER.contractExpiry}</span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox label="Win Rate" value={`${MANAGER.winRate}%`} color="text-emerald-400" />
          <StatBox label="Matches" value={MANAGER.totalMatchesManaged} color="text-[#c9d1d9]" />
          <StatBox label="Trophies" value={MANAGER.totalTrophies} color="text-amber-400" />
        </div>

        {/* Stat bars */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <StatBar label="Tactics" value={MANAGER.stats.tactics} />
          <StatBar label="Man Management" value={MANAGER.stats.manManagement} />
          <StatBar label="Transfer Acumen" value={MANAGER.stats.transferAcumen} />
          <StatBar label="Youth Development" value={MANAGER.stats.youthDevelopment} />
        </div>
      </Card>
    </Section>
  );

  // -----------------------------------------------------------------------
  // 2. Squad Management Overview
  // -----------------------------------------------------------------------
  const renderSquad = () => (
    <Section id="squad" active={activeTab === 'squad'} label="Squad Management" icon={<Users className="h-5 w-5" />}>
      <Card title="Squad Overview" icon={<Users className="h-4 w-4" />}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
            <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Squad Size</p>
            <p className="text-lg font-bold text-[#c9d1d9]">{squadSize}</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
            <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Avg OVR</p>
            <p className="text-lg font-bold text-emerald-400">{avgOvr}</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2">
            <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Bench OVR</p>
            <p className="text-lg font-bold text-[#c9d1d9]">{benchOvr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-400">
            <AlertTriangle className="h-3 w-3" /> {injuryCount} Injuries
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-400">
            <Clock className="h-3 w-3" /> {suspensionCount} Suspended
          </span>
        </div>

        {/* Bench quality */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#8b949e]">Bench Strength</span>
            <span className="text-amber-400 font-semibold">Good</span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${benchOvr}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </Card>

      {/* Formation selector */}
      <Card title="Formation" icon={<Target className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(Object.keys(FORMATIONS) as FormationKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                formation === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:border-emerald-500/20 hover:text-[#c9d1d9]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8b949e] leading-relaxed">{formationDesc}</p>
        {formation && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-1.5">
              <p className="text-[10px] text-emerald-400 font-semibold">Strength</p>
              <p className="text-[11px] text-[#8b949e]">{FORMATIONS[formation].strength}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-1.5">
              <p className="text-[10px] text-red-400 font-semibold">Weakness</p>
              <p className="text-[11px] text-[#8b949e]">{FORMATIONS[formation].weakness}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Starting XI */}
      <Card title="Starting XI" icon={<Shield className="h-4 w-4" />} badge={<span className="text-[10px] text-[#8b949e]">11 players</span>}>
        <div className="space-y-1.5">
          {STARTING_XI.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold text-[#8b949e] w-8 text-right">{p.pos}</span>
                <div className="min-w-0">
                  <span className="text-sm text-[#c9d1d9] font-medium truncate block">{p.name}</span>
                  <span className="text-[10px] text-[#484f58]">Age {p.age}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  {p.form.map((r, j) => (
                    <FormDot key={j} result={r} />
                  ))}
                </div>
                <span className={`text-sm font-bold min-w-[28px] text-right ${
                  p.ovr >= 85 ? 'text-emerald-400' : p.ovr >= 80 ? 'text-[#c9d1d9]' : 'text-amber-400'
                }`}>
                  {p.ovr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bench */}
      <Card title="Substitutes" icon={<Users className="h-4 w-4" />} badge={<span className="text-[10px] text-[#8b949e]">5 players</span>}>
        <div className="space-y-1.5">
          {BENCH_PLAYERS.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold text-[#484f58] w-8 text-right">{p.pos}</span>
                <span className="text-xs text-[#8b949e] font-medium truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  {p.form.map((r, j) => (
                    <FormDot key={j} result={r} />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#8b949e] min-w-[28px] text-right">{p.ovr}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );

  // -----------------------------------------------------------------------
  // 3. Tactical Board
  // -----------------------------------------------------------------------
  const renderTactics = () => {
    const positions = FORMATION_POSITIONS[formation];
    const positionKeys = Object.keys(positions) as string[];

    /* eslint-disable react-hooks/rules-of-hooks */
    const lineGroups = useMemo(() => {
      const lines: [number, number][][] = [];
      const keyed = positionKeys.map((k) => ({ key: k, x: positions[k][0], y: positions[k][1] }));

      const yGroups: typeof keyed[] = [];
      keyed.forEach(p => {
        let placed = false;
        for (const g of yGroups) {
          if (Math.abs(g[0].y - p.y) < 8) {
            g.push(p);
            g.sort((a, b) => a.x - b.x);
            placed = true;
            break;
          }
        }
        if (!placed) yGroups.push([p]);
      });
      yGroups.sort((a, b) => a[0].y - b[0].y);

      yGroups.forEach(g => {
        if (g.length >= 2) {
          lines.push(g.map(p => [p.x, p.y]));
        }
      });
      return lines;
    }, [formation]);
    /* eslint-enable react-hooks/rules-of-hooks */

    return (
      <Section id="tactics" active={activeTab === 'tactics'} label="Tactical Board" icon={<Target className="h-5 w-5" />}>
        <Card title="Pitch View" icon={<Target className="h-4 w-4" />}>
          <svg viewBox="0 0 100 100" className="w-full rounded-md border border-[#30363d] bg-emerald-950/40" preserveAspectRatio="xMidYMid meet">
            {/* Pitch outline */}
            <rect x="2" y="2" width="96" height="96" fill="none" stroke="#10b981" strokeWidth="0.3" rx="1" />
            {/* Halfway line */}
            <line x1="50" y1="2" x2="50" y2="98" stroke="#10b981" strokeWidth="0.2" />
            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="#10b981" strokeWidth="0.2" />
            <circle cx="50" cy="50" r="0.8" fill="#10b981" />
            {/* Penalty areas */}
            <rect x="20" y="2" width="60" height="14" fill="none" stroke="#10b981" strokeWidth="0.2" />
            <rect x="20" y="84" width="60" height="14" fill="none" stroke="#10b981" strokeWidth="0.2" />
            {/* Goal areas */}
            <rect x="34" y="2" width="32" height="5" fill="none" stroke="#10b981" strokeWidth="0.2" />
            <rect x="34" y="93" width="32" height="5" fill="none" stroke="#10b981" strokeWidth="0.2" />
            {/* Penalty spots */}
            <circle cx="50" cy="11" r="0.5" fill="#10b981" />
            <circle cx="50" cy="89" r="0.5" fill="#10b981" />
            {/* Corner arcs */}
            <path d="M2,5 A3,3 0 0,1 5,2" fill="none" stroke="#10b981" strokeWidth="0.15" />
            <path d="M98,5 A3,3 0 0,0 95,2" fill="none" stroke="#10b981" strokeWidth="0.15" />
            <path d="M2,95 A3,3 0 0,0 5,98" fill="none" stroke="#10b981" strokeWidth="0.15" />
            <path d="M98,95 A3,3 0 0,1 95,98" fill="none" stroke="#10b981" strokeWidth="0.15" />

            {/* Formation lines */}
            {lineGroups.map((line, li) => (
              <polyline
                key={li}
                points={line.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="0.4"
                strokeOpacity="0.5"
              />
            ))}

            {/* Player markers */}
            {positionKeys.map((role, i) => {
              const [cx, cy] = positions[role];
              return (
                <g key={`${role}-${i}`}>
                  <circle cx={cx} cy={cy} r="4.5" fill="#10b981" opacity="0.85" />
                  <circle cx={cx} cy={cy} r="4.5" fill="none" stroke="white" strokeWidth="0.3" />
                  <text
                    x={cx}
                    y={cy + 1.3}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: '3.5', fontWeight: 'bold' }}
                  >
                    {i + 1}
                  </text>
                  <text
                    x={cx}
                    y={cy - 6.5}
                    textAnchor="middle"
                    className="fill-[#c9d1d9]"
                    style={{ fontSize: '2.8' }}
                  >
                    {role}
                  </text>
                </g>
              );
            })}
          </svg>
        </Card>

        {/* Tactical style */}
        <Card title="Tactical Style" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2 mb-4">
            {TACTICAL_STYLES.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setTacticalStyle(i)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tacticalStyle === i
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* Style description */}
          <p className="text-xs text-[#8b949e] mb-3 italic">{TACTICAL_STYLES[tacticalStyle].desc}</p>
          {/* Attack/Defend bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Defensive</span>
              <span>{TACTICAL_STYLES[tacticalStyle].attack}% Attacking</span>
              <span>Attacking</span>
            </div>
            <div className="relative h-3 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-md"
                initial={{ width: 0 }}
                animate={{ width: `${TACTICAL_STYLES[tacticalStyle].attack}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </Card>

        {/* Playing style modifiers */}
        <Card title="Playing Style" icon={<SlidersIcon />}>
          <div className="space-y-5">
            <SliderControl label="Pressing Intensity" value={pressing} onChange={setPressing} lowLabel="Low Block" highLabel="High Press" />
            <SliderControl label="Defensive Line" value={defLine} onChange={setDefLine} lowLabel="Deep" highLabel="High" />
            <SliderControl label="Tempo" value={tempo} onChange={setTempo} lowLabel="Slow" highLabel="Fast" />
          </div>
        </Card>

        {/* Set piece takers */}
        <Card title="Set Piece Takers" icon={<CircleDot className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SetPieceDropdown label="Corners" value={cornerTaker} onChange={setCornerTaker} />
            <SetPieceDropdown label="Free Kicks" value={fkTaker} onChange={setFkTaker} />
            <SetPieceDropdown label="Penalties" value={penTaker} onChange={setPenTaker} />
          </div>
        </Card>
      </Section>
    );
  };

  // -----------------------------------------------------------------------
  // 4. Transfer Activity
  // -----------------------------------------------------------------------
  const renderTransfers = () => (
    <Section id="transfers" active={activeTab === 'transfers'} label="Transfer Activity" icon={<DollarSign className="h-5 w-5" />}>
      <Card
        title="Transfer Budget"
        icon={<DollarSign className="h-4 w-4" />}
        badge={
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
            transferWindowOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {transferWindowOpen ? `Open (${transferWindowDaysLeft}d left)` : 'Closed'}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-center">
            <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Budget Remaining</p>
            <p className="text-xl font-bold text-emerald-400">£{(transferBudget / 1e6).toFixed(0)}M</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-center">
            <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Wage Bill</p>
            <p className="text-sm font-bold text-[#c9d1d9]">£{(wageBill / 1e3).toFixed(0)}k/wk</p>
            <p className="text-[10px] text-[#8b949e]">Budget: £{(wageBudget / 1e3).toFixed(0)}k/wk</p>
          </div>
        </div>
        {/* Wage budget utilization bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-[#8b949e]">Wage Utilization</span>
            <span className="text-emerald-400 font-semibold">{Math.round((wageBill / wageBudget) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${(wageBill / wageBudget) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </Card>

      <Card title="Recent Signings" icon={<ChevronRight className="h-4 w-4 text-emerald-400" />} badge={<span className="text-[10px] text-[#8b949e]">3 in</span>}>
        <div className="space-y-2">
          {RECENT_TRANSFERS_IN.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#c9d1d9]">{t.name}</p>
                <p className="text-[10px] text-[#8b949e]">{t.pos} &middot; OVR {t.ovr} &middot; From {t.from}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex-shrink-0 ml-2">{t.fee}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Recent Outgoings" icon={<ChevronRight className="h-4 w-4 text-red-400" />} badge={<span className="text-[10px] text-[#8b949e]">2 out</span>}>
        <div className="space-y-2">
          {RECENT_TRANSFERS_OUT.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#c9d1d9]">{t.name}</p>
                <p className="text-[10px] text-[#8b949e]">{t.pos} &middot; To {t.to}</p>
              </div>
              <span className="text-xs font-bold text-amber-400 flex-shrink-0 ml-2">{t.fee}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Scout Targets" icon={<Target className="h-4 w-4" />} badge={<span className="text-[10px] text-[#8b949e]">3 targets</span>}>
        <div className="space-y-2">
          {TRANSFER_TARGETS.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#c9d1d9]">{t.name}</p>
                <p className="text-[10px] text-[#8b949e]">{t.pos} &middot; OVR {t.ovr} &middot; {t.club}</p>
                <p className="text-[10px] text-emerald-400">{t.price}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                  t.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' :
                  t.status === 'Negotiating' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-[#21262d] text-[#8b949e]'
                }`}>
                  {t.status}
                </span>
                <button className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 transition-colors">
                  {t.status === 'Negotiating' ? 'Continue' : 'Enquire'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );

  // -----------------------------------------------------------------------
  // 5. Board Expectations
  // -----------------------------------------------------------------------
  const renderBoard = () => (
    <Section id="board" active={activeTab === 'board'} label="Board Expectations" icon={<Trophy className="h-5 w-5" />}>
      <Card title="Season Objectives" icon={<Target className="h-4 w-4" />}>
        <div className="space-y-3">
          {BOARD_OBJECTIVES.map((obj, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#c9d1d9] font-medium">{obj.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  obj.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  obj.status === 'on-track' ? 'bg-emerald-500/10 text-emerald-400/70' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {obj.status === 'completed' ? 'Done' : obj.status === 'on-track' ? 'On Track' : 'In Progress'}
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e]">{obj.current}</p>
              <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
                <motion.div
                  className={`h-full rounded-md ${
                    obj.progress >= 100 ? 'bg-emerald-500' : obj.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${obj.progress}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </div>
              <p className="text-[10px] text-[#484f58]">{obj.progress}% complete</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Board Confidence" icon={<TrendingUp className="h-4 w-4" />}>
        <ConfidenceMeter value={boardConfidence} />
        <p className="text-xs text-[#8b949e] mt-2">
          The board is pleased with recent results. They expect a strong finish to the season to secure a Champions League qualification spot. Maintaining consistency in the next 5 matches is critical.
        </p>
      </Card>

      {/* Board mood */}
      <Card title="Board Mood" icon={<Briefcase className="h-4 w-4" />}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
            <Heart className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#c9d1d9]">Relationship with Chairman</p>
              <p className="text-[10px] text-emerald-400">Good — Regular communication maintained</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
            <Eye className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#c9d1d9]">Sponsor Expectations</p>
              <p className="text-[10px] text-amber-400">Moderate — Top 4 finish required for bonus triggers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md">
            <MessageSquare className="h-4 w-4 text-[#8b949e] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#c9d1d9]">Fan Sentiment</p>
              <p className="text-[10px] text-[#8b949e]">Positive — 78% approval rating in latest survey</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg text-sm font-semibold text-emerald-400 hover:border-emerald-500/40 transition-colors">
          <DollarSign className="h-4 w-4" />
          Request Budget
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg text-sm font-semibold text-emerald-400 hover:border-emerald-500/40 transition-colors">
          <Star className="h-4 w-4" />
          Facility Upgrade
        </button>
      </div>
    </Section>
  );

  // -----------------------------------------------------------------------
  // 6. Match Day Preparation
  // -----------------------------------------------------------------------
  const renderMatchday = () => (
    <Section id="matchday" active={activeTab === 'matchday'} label="Match Day" icon={<Swords className="h-5 w-5" />}>
      <Card title="Next Match" icon={<Swords className="h-4 w-4" />}>
        <div className="flex items-center gap-4 p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
          <div className="flex flex-col items-center gap-1 px-3">
            <Home className="h-6 w-6 text-emerald-400" />
            <span className="text-[10px] uppercase text-[#8b949e] tracking-wide">Home</span>
          </div>
          <div className="flex-1 text-center min-w-0">
            <p className="text-base font-bold text-[#c9d1d9]">Greenfield United vs {OPPONENT_ANALYSIS.team}</p>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400">League</span>
              <span className="text-[10px] text-[#8b949e]">Matchday 24</span>
              <span className="text-[10px] text-[#8b949e]">Sat, 15 Mar</span>
            </div>
          </div>
          <div className="text-center px-3 flex-shrink-0">
            <p className="text-xs text-[#8b949e]">Kick-off</p>
            <p className="text-sm font-bold text-[#c9d1d9]">15:00</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-400">Key player Rodri returning from injury — available for selection</p>
        </div>
      </Card>

      {/* Opposition analysis */}
      <Card title="Opposition Analysis" icon={<AlertTriangle className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox label="Opponent" value={OPPONENT_ANALYSIS.team} color="text-[#c9d1d9]" />
          <StatBox label="Formation" value={OPPONENT_ANALYSIS.formation} color="text-[#8b949e]" />
        </div>
        <p className="text-xs text-[#8b949e] mb-2 italic">{OPPONENT_ANALYSIS.style}</p>

        <div className="space-y-2 mb-3">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Strengths</p>
          {OPPONENT_ANALYSIS.strengths.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <ThumbsUp className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-[#c9d1d9]">{w}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Weaknesses to Exploit</p>
          {OPPONENT_ANALYSIS.weaknesses.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <ThumbsDown className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-[#c9d1d9]">{w}</span>
            </div>
          ))}
        </div>

        <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <p className="text-[10px] font-bold text-amber-400">Key Player</p>
          <p className="text-xs text-[#c9d1d9]">{OPPONENT_ANALYSIS.keyPlayer}</p>
        </div>
      </Card>

      {/* Team talk */}
      <Card title="Team Talk" icon={<MessageSquare className="h-4 w-4" />}>
        <p className="text-xs text-[#8b949e] mb-3">Choose your pre-match team talk to influence morale and mentality:</p>
        <div className="space-y-2">
          {TEAM_TALK_OPTIONS.map((opt, i) => (
            <button
              key={i}
              onClick={() => setTeamTalk(i)}
              className={`w-full text-left px-3 py-3 rounded-md border transition-colors ${
                teamTalk === i
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-[#0d1117] border-[#30363d] hover:border-emerald-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${teamTalk === i ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                  {opt.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${
                    opt.morale.startsWith('+') && parseInt(opt.morale) >= 5 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    Morale {opt.morale}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    opt.risk === 'low' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {opt.risk} risk
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#8b949e] mt-1 italic">&ldquo;{opt.quote}&rdquo;</p>
              <p className="text-[10px] text-[#484f58] mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Predicted morale effects */}
      {teamTalk !== null && (
        <Card title="Predicted Effects" icon={<Zap className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-md px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Morale Change</p>
              <p className="text-lg font-bold text-emerald-400">{TEAM_TALK_OPTIONS[teamTalk].morale}</p>
            </div>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-md px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Attacking Intent</p>
              <p className={`text-lg font-bold ${parseInt(TEAM_TALK_OPTIONS[teamTalk].attacking) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {TEAM_TALK_OPTIONS[teamTalk].attacking}
              </p>
            </div>
          </div>
        </Card>
      )}
    </Section>
  );

  // -----------------------------------------------------------------------
  // 7. Season Progress Dashboard
  // -----------------------------------------------------------------------
  const renderSeason = () => {
    const wins = 14;
    const draws = 5;
    const losses = 4;
    const gf = 42;
    const ga = 18;
    const cleanSheets = 10;

    return (
      <Section id="season" active={activeTab === 'season'} label="Season Progress" icon={<BarChart3 className="h-5 w-5" />}>
        {/* League position */}
        <Card title="Current Position" icon={<Trophy className="h-4 w-4" />} badge={<span className="text-lg font-bold text-emerald-400">2nd</span>}>
          <div className="grid grid-cols-4 gap-2">
            <StatBox label="Played" value={23} color="text-[#c9d1d9]" />
            <StatBox label="Won" value={wins} color="text-emerald-400" />
            <StatBox label="Drawn" value={draws} color="text-amber-400" />
            <StatBox label="Lost" value={losses} color="text-red-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <StatBox label="Goals For" value={gf} color="text-emerald-400" />
            <StatBox label="Goals Against" value={ga} color="text-red-400" />
            <StatBox label="Clean Sheets" value={cleanSheets} color="text-[#c9d1d9]" />
          </div>
        </Card>

        {/* Mini league table */}
        <Card title="League Table (Top 6)" icon={<BarChart3 className="h-4 w-4" />}>
          {/* Table header */}
          <div className="flex items-center px-3 py-1.5 text-[10px] font-bold text-[#484f58] uppercase tracking-wider">
            <span className="w-6">Pos</span>
            <span className="flex-1">Team</span>
            <span className="w-5 text-center">P</span>
            <span className="w-5 text-center hidden sm:block">W</span>
            <span className="w-5 text-center hidden sm:block">D</span>
            <span className="w-5 text-center hidden sm:block">L</span>
            <span className="w-8 text-center">GD</span>
            <span className="w-8 text-center">Pts</span>
          </div>
          <div className="space-y-1">
            {LEAGUE_TABLE.map(row => (
              <div
                key={row.pos}
                className={`flex items-center px-3 py-2 rounded-md text-xs ${
                  row.team === 'Greenfield United'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-[#0d1117] border border-transparent'
                }`}
              >
                <span className={`w-6 font-bold ${row.pos <= 4 ? 'text-emerald-400' : 'text-[#8b949e]'}`}>{row.pos}</span>
                <span className={`flex-1 font-medium truncate ${row.team === 'Greenfield United' ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                  {row.team}
                </span>
                <span className="w-5 text-center text-[#8b949e]">{row.played}</span>
                <span className="w-5 text-center text-emerald-400 hidden sm:block">{row.w}</span>
                <span className="w-5 text-center text-amber-400 hidden sm:block">{row.d}</span>
                <span className="w-5 text-center text-red-400 hidden sm:block">{row.l}</span>
                <span className="w-8 text-center text-[#8b949e]">{row.gd}</span>
                <span className="w-8 text-center font-bold text-[#c9d1d9]">{row.pts}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent form */}
        <Card title="Recent Form (Last 6)" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="flex items-center gap-2">
            {SEASON_FORM.map((r, i) => (
              <FormBadge key={i} result={r} />
            ))}
          </div>
          <p className="text-xs text-[#8b949e] mt-2">4 wins, 1 draw, 1 loss — 79% win rate in last 6 matches</p>
        </Card>

        {/* Top scorer / assister */}
        <div className="grid grid-cols-2 gap-3">
          <Card title="Top Scorer" icon={<Star className="h-4 w-4" />}>
            <p className="text-sm font-bold text-emerald-400">Haaland</p>
            <p className="text-xs text-[#8b949e]">18 goals in 23 appearances</p>
            <div className="mt-2 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div className="h-full bg-emerald-500 rounded-md" initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 0.5 }} />
            </div>
          </Card>
          <Card title="Top Assists" icon={<Star className="h-4 w-4" />}>
            <p className="text-sm font-bold text-emerald-400">De Bruyne</p>
            <p className="text-xs text-[#8b949e]">12 assists in 21 appearances</p>
            <div className="mt-2 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div className="h-full bg-amber-500 rounded-md" initial={{ width: 0 }} animate={{ width: '57%' }} transition={{ duration: 0.5 }} />
            </div>
          </Card>
        </div>

        {/* Position trend line chart */}
        <Card title="League Position Trend" icon={<TrendingUp className="h-4 w-4" />}>
          <svg viewBox="0 0 200 65" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[1, 2, 3, 4, 5, 6].map(v => {
              const y = ((v - 1) / 5) * 55 + 5;
              return (
                <g key={v}>
                  <line x1="20" y1={y} x2="195" y2={y} stroke="#21262d" strokeWidth="0.4" />
                  <text x="15" y={y + 2} className="fill-[#484f58]" style={{ fontSize: '4.5', textAnchor: 'end' }}>{v}</text>
                </g>
              );
            })}

            {/* Trend line */}
            <polyline
              points={POSITION_TREND.map((pos, i) => {
                const x = 25 + (i / (POSITION_TREND.length - 1)) * 170;
                const y = ((pos - 1) / 5) * 55 + 5;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data dots */}
            {POSITION_TREND.map((pos, i) => {
              const x = 25 + (i / (POSITION_TREND.length - 1)) * 170;
              const y = ((pos - 1) / 5) * 55 + 5;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="2" fill="#10b981" />
                  <text x={x} y={y - 4} className="fill-[#8b949e]" style={{ fontSize: '3.8', textAnchor: 'middle' }}>{pos}</text>
                </g>
              );
            })}

            {/* Axis labels */}
            <text x="25" y="63" className="fill-[#484f58]" style={{ fontSize: '4' }}>MD15</text>
            <text x="195" y="63" className="fill-[#484f58]" style={{ fontSize: '4', textAnchor: 'end' }}>MD24</text>
            <text x="3" y="8" className="fill-[#484f58]" style={{ fontSize: '3.5' }}>POS</text>
          </svg>
          <p className="text-[10px] text-[#8b949e] mt-1">Held 2nd position for 4 of last 10 matchdays — consistent performance</p>
        </Card>
      </Section>
    );
  };

  // -----------------------------------------------------------------------
  // 8. Manager Achievements
  // -----------------------------------------------------------------------
  const renderAchievements = () => {
    const totalPoints = ACHIEVEMENTS.reduce((sum, a) => sum + (a.unlocked ? a.points : Math.round((a.current / a.target) * a.points)), 0);
    const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
    const maxPossiblePoints = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);

    return (
      <Section id="achievements" active={activeTab === 'achievements'} label="Manager Achievements" icon={<Award className="h-5 w-5" />}>
        {/* Summary */}
        <Card title="Achievement Summary" icon={<Award className="h-4 w-4" />}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Unlocked</p>
              <p className="text-xl font-bold text-emerald-400">{unlockedCount}/{ACHIEVEMENTS.length}</p>
            </div>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">In Progress</p>
              <p className="text-xl font-bold text-amber-400">{ACHIEVEMENTS.filter(a => !a.unlocked && a.current > 0).length}</p>
            </div>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-center">
              <p className="text-[10px] uppercase text-[#8b949e] tracking-wide">Total Points</p>
              <p className="text-lg font-bold text-[#c9d1d9]">{totalPoints}</p>
              <p className="text-[9px] text-[#484f58]">of {maxPossiblePoints}</p>
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Overall Progress</span>
              <span>{Math.round((totalPoints / maxPossiblePoints) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-md"
                initial={{ width: 0 }}
                animate={{ width: `${(totalPoints / maxPossiblePoints) * 100}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </div>
        </Card>

        {/* Achievement cards */}
        <div className="space-y-3">
          {ACHIEVEMENTS.map((ach, i) => {
            const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));
            return (
              <div
                key={i}
                className={`bg-[#161b22] border rounded-lg p-4 ${
                  ach.unlocked ? 'border-emerald-500/30' : 'border-[#30363d]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {ach.unlocked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : ach.current > 0 ? (
                      <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="h-5 w-5 text-[#484f58] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold ${ach.unlocked ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                        {ach.name}
                      </h4>
                      <p className="text-[11px] text-[#8b949e]">{ach.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      ach.unlocked ? 'bg-emerald-500/20 text-emerald-400' :
                      ach.current > 0 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-[#21262d] text-[#484f58]'
                    }`}>
                      {ach.unlocked ? 'Unlocked' : ach.current > 0 ? 'In Progress' : 'Locked'}
                    </span>
                    <span className="text-[10px] text-[#484f58]">{ach.points} pts</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#8b949e]">
                    <span>{ach.current}/{ach.target}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                    <motion.div
                      className={`h-full rounded-md ${ach.unlocked ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    );
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3"
      >
        <UserCog className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-lg font-bold text-[#c9d1d9]">Manager Career Mode</h1>
          <p className="text-xs text-[#8b949e]">{MANAGER.club} &middot; {MANAGER.league} &middot; Season 2</p>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center gap-1.5 pb-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-emerald-500/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'squad' && renderSquad()}
          {activeTab === 'tactics' && renderTactics()}
          {activeTab === 'transfers' && renderTransfers()}
          {activeTab === 'board' && renderBoard()}
          {activeTab === 'matchday' && renderMatchday()}
          {activeTab === 'season' && renderSeason()}
          {activeTab === 'achievements' && renderAchievements()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
