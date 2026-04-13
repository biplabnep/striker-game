'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { CLUBS, getClubsByLeague, LEAGUES } from '@/lib/game/clubsData';
import { randomBetween, randomChoice, clamp } from '@/lib/game/gameUtils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Swords,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  Flag,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  AlertTriangle,
  Calendar,
  BarChart3,
  Star,
  Heart,
  MapPin,
} from 'lucide-react';

// ============================================================
// Rival System Types
// ============================================================

interface RivalMatch {
  season: number;
  week: number;
  homeScore: number;
  awayScore: number;
  playerGoals: number;
  playerRating: number;
  competition: string;
}

interface Rival {
  id: string;
  type: 'club' | 'player' | 'national';
  name: string;
  logo: string;
  intensity: number;
  headToHead: { wins: number; draws: number; losses: number };
  lastMeeting: string;
  keyMoments: string[];
  matchHistory: RivalMatch[];
  seasonPerformance: string;
  country: string;
  position?: string;
  age?: number;
  overall?: number;
}

type RivalFilter = 'all' | 'club' | 'player' | 'national';
type RivalSort = 'intensity' | 'recent' | 'h2h';

// ============================================================
// Classic Derby Definitions
// ============================================================

const CLASSIC_DERBIES: Record<string, string[]> = {
  arsenal: ['tottenham'],
  tottenham: ['arsenal'],
  liverpool: ['man_united', 'everton'],
  man_united: ['liverpool', 'man_city'],
  man_city: ['man_united'],
  chelsea: ['arsenal', 'tottenham'],
  everton: ['liverpool'],
  real_madrid: ['barcelona', 'atletico_madrid'],
  barcelona: ['real_madrid', 'espanyol'],
  atletico_madrid: ['real_madrid'],
  inter_milan: ['ac_milan', 'juventus'],
  ac_milan: ['inter_milan', 'juventus'],
  juventus: ['inter_milan', 'ac_milan', 'napoli'],
  napoli: ['juventus', 'roma'],
  roma: ['lazio', 'napoli'],
  lazio: ['roma'],
  bayern_munich: ['dortmund'],
  dortmund: ['bayern_munich', 'schalke'],
  psg: ['marseille'],
  marseille: ['psg', 'lyon'],
  lyon: ['marseille', 'saint_etienne'],
};

// ============================================================
// Procedural Rival Name Generator
// ============================================================

const PLAYER_FIRST_NAMES = [
  'Marco', 'Lucas', 'Erik', 'Julian', 'Rafael', 'Yusuf', 'Kai', 'Matteo',
  'Thiago', 'Sergio', 'Alejandro', 'Niklas', 'Dominik', 'Patrick', 'Hugo',
  'Antoine', 'Victor', 'Federico', 'Stefan', 'Liam', 'Dani', 'Ousmane',
  'Andre', 'Carlos', 'Fabian', 'Moritz', 'Joel', 'Nathan', 'Ruben',
];

const PLAYER_LAST_NAMES = [
  'Mueller', 'Silva', 'Costa', 'Hernandez', 'Schmidt', 'Rossi', 'Laurent',
  'Bergmann', 'Fernandez', 'Jensen', 'Petrov', 'Kowalski', 'Dubois',
  'Larsson', 'Torres', 'Weber', 'Muller', 'Santos', 'Moreau', 'Nielsen',
  'Volkov', 'Papadopoulos', 'Kolarov', 'Johansson', 'Fischer', 'Lindberg',
];

const PLAYER_POSITIONS = ['ST', 'CAM', 'CM', 'CDM', 'LW', 'RW', 'CB', 'RB', 'LB'];

const NATIONAL_RIVALS: Record<string, string[]> = {
  England: ['France', 'Germany', 'Argentina', 'Netherlands', 'Spain'],
  Spain: ['Portugal', 'France', 'Germany', 'Italy', 'Netherlands'],
  Germany: ['Netherlands', 'France', 'England', 'Italy', 'Argentina'],
  France: ['Germany', 'Spain', 'England', 'Italy', 'Brazil'],
  Italy: ['Germany', 'Spain', 'France', 'England', 'Netherlands'],
  Netherlands: ['Germany', 'Spain', 'Argentina', 'England', 'France'],
  Argentina: ['Brazil', 'Germany', 'Uruguay', 'France', 'Netherlands'],
  Brazil: ['Argentina', 'France', 'Germany', 'Italy', 'Spain'],
  Portugal: ['Spain', 'France', 'Germany', 'Brazil', 'England'],
};

const KEY_MOMENT_TEMPLATES_CLUB = [
  'Last-minute winner in a {competition} match',
  'Red card in a heated derby encounter',
  'Controversial penalty decision swung the game',
  '{result} in front of a packed stadium',
  'Equalized in the 89th minute to deny victory',
  'Player scored a brace in a dominant performance',
  'Physical confrontation led to bookings for both sides',
  'Cup upset knocked the rival out of the competition',
];

const KEY_MOMENT_TEMPLATES_PLAYER = [
  'Shoulder-to-shoulder battle all match long',
  'Both scored in the same game — headline duel',
  'Fouled each other in a heated midfield battle',
  'Competed for the same individual award this season',
  'Clashed in the penalty area during a set piece',
  'Public comments sparked a war of words in the media',
  'Both named in Team of the Week after facing each other',
];

const KEY_MOMENT_TEMPLATES_NATIONAL = [
  'Met in a crucial World Cup qualifier',
  'Faced off in a major tournament group stage',
  'National team coach praised the opponent before the match',
  'Physical battle in a friendly that turned heated',
  'Met in continental championship knockout round',
  'Both nations competing for top spot in qualifying group',
];

// ============================================================
// Seeded Random Generator (for consistency)
// ============================================================

function createSeededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
}

// ============================================================
// Rival Generation Helpers
// ============================================================

function generateClubRivals(
  clubId: string,
  league: string,
  season: number,
  week: number,
  seed: string,
): Rival[] {
  const rng = createSeededRandom(`${seed}-club-${clubId}`);
  const leagueClubs = getClubsByLeague(league).filter((c) => c.id !== clubId);
  const rivals: Rival[] = [];

  // Add classic derbies first
  const derbyIds = CLASSIC_DERBIES[clubId] ?? [];
  for (const dId of derbyIds) {
    const dClub = leagueClubs.find((c) => c.id === dId);
    if (!dClub) continue;

    const intensity = 70 + Math.floor(rng() * 30);
    const wins = Math.floor(rng() * 6);
    const losses = Math.floor(rng() * 6);
    const draws = Math.floor(rng() * 4);

    rivals.push({
      id: `rival-club-${dClub.id}`,
      type: 'club',
      name: dClub.name,
      logo: dClub.logo,
      intensity,
      headToHead: { wins, draws, losses },
      lastMeeting: `S${Math.max(1, season - 1)} — ${wins > losses ? 'Won' : losses > wins ? 'Lost' : 'Drew'} 2-1`,
      keyMoments: [
        `Derby rivalry with ${dClub.name} dates back decades`,
        `Last encounter was a fiercely contested match`,
        `Fans consider this the biggest game of the season`,
      ],
      matchHistory: generateMatchHistory(rng, 3 + Math.floor(rng() * 5), season, week),
      seasonPerformance: `${dClub.shortName} — ${70 + Math.floor(rng() * 25)} pts (est.)`,
      country: dClub.country,
    });
  }

  // Fill remaining with procedural league rivals
  const remaining = leagueClubs.filter((c) => !derbyIds.includes(c.id));
  const needed = Math.max(0, 5 - rivals.length);
  const shuffled = [...remaining].sort(() => rng() - 0.5);
  for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
    const c = shuffled[i];
    const intensity = 20 + Math.floor(rng() * 55);
    const wins = Math.floor(rng() * 5);
    const losses = Math.floor(rng() * 5);
    const draws = Math.floor(rng() * 3);

    rivals.push({
      id: `rival-club-${c.id}`,
      type: 'club',
      name: c.name,
      logo: c.logo,
      intensity,
      headToHead: { wins, draws, losses },
      lastMeeting: `S${Math.max(1, season - 1)} — ${rng() > 0.5 ? 'Won' : rng() > 0.3 ? 'Lost' : 'Drew'} ${1 + Math.floor(rng() * 2)}-${Math.floor(rng() * 2)}`,
      keyMoments: [
        generateKeyMoment(rng, 'club'),
        generateKeyMoment(rng, 'club'),
      ],
      matchHistory: generateMatchHistory(rng, 2 + Math.floor(rng() * 4), season, week),
      seasonPerformance: `${c.shortName} — ${50 + Math.floor(rng() * 40)} pts (est.)`,
      country: c.country,
    });
  }

  return rivals;
}

function generatePlayerRivals(
  clubId: string,
  league: string,
  season: number,
  week: number,
  seed: string,
  playerOverall: number,
): Rival[] {
  const rng = createSeededRandom(`${seed}-player-${clubId}`);
  const leagueClubs = getClubsByLeague(league).filter((c) => c.id !== clubId);
  const count = 2 + Math.floor(rng() * 2);
  const rivals: Rival[] = [];

  for (let i = 0; i < count; i++) {
    const club = leagueClubs[Math.floor(rng() * leagueClubs.length)];
    const firstName = PLAYER_FIRST_NAMES[Math.floor(rng() * PLAYER_FIRST_NAMES.length)];
    const lastName = PLAYER_LAST_NAMES[Math.floor(rng() * PLAYER_LAST_NAMES.length)];
    const position = PLAYER_POSITIONS[Math.floor(rng() * PLAYER_POSITIONS.length)];
    const age = 20 + Math.floor(rng() * 14);
    const overall = clamp(playerOverall + Math.floor(rng() * 10) - 5, 55, 95);

    rivals.push({
      id: `rival-player-${i}`,
      type: 'player',
      name: `${firstName} ${lastName}`,
      logo: '👤',
      intensity: 25 + Math.floor(rng() * 50),
      headToHead: {
        wins: Math.floor(rng() * 4),
        draws: Math.floor(rng() * 3),
        losses: Math.floor(rng() * 4),
      },
      lastMeeting: `S${Math.max(1, season - 1)} — ${rng() > 0.5 ? 'Outperformed' : 'Outplayed by'} ${firstName}`,
      keyMoments: [
        generateKeyMoment(rng, 'player'),
        generateKeyMoment(rng, 'player'),
      ],
      matchHistory: generateMatchHistory(rng, 2 + Math.floor(rng() * 3), season, week),
      seasonPerformance: `${overall} OVR — ${5 + Math.floor(rng() * 12)} goals`,
      country: club.country,
      position,
      age,
      overall,
    });
  }

  return rivals;
}

function generateNationalRivals(
  nationality: string,
  season: number,
  week: number,
  seed: string,
): Rival[] {
  const rng = createSeededRandom(`${seed}-national-${nationality}`);
  const opponents = NATIONAL_RIVALS[nationality] ?? ['France', 'Germany', 'Spain', 'Brazil', 'Argentina'];
  const count = 1 + Math.floor(rng() * 2);
  const rivals: Rival[] = [];

  const flags: Record<string, string> = {
    England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Spain: '🇪🇸', Germany: '🇩🇪', France: '🇫🇷',
    Italy: '🇮🇹', Netherlands: '🇳🇱', Argentina: '🇦🇷', Brazil: '🇧🇷',
    Portugal: '🇵🇹',
  };

  for (let i = 0; i < Math.min(count, opponents.length); i++) {
    const nation = opponents[Math.floor(rng() * opponents.length)];
    const intensity = 30 + Math.floor(rng() * 45);
    const wins = Math.floor(rng() * 3);
    const losses = Math.floor(rng() * 3);
    const draws = Math.floor(rng() * 2);

    rivals.push({
      id: `rival-national-${nation}`,
      type: 'national',
      name: nation,
      logo: flags[nation] ?? '🏳️',
      intensity,
      headToHead: { wins, draws, losses },
      lastMeeting: `International friendly — ${rng() > 0.5 ? 'Won' : 'Lost'} 1-0`,
      keyMoments: [
        generateKeyMoment(rng, 'national'),
      ],
      matchHistory: generateMatchHistory(rng, 1 + Math.floor(rng() * 2), season, week),
      seasonPerformance: 'Competitive in qualifying group',
      country: nation,
    });
  }

  return rivals;
}

function generateMatchHistory(
  rng: () => number,
  count: number,
  currentSeason: number,
  currentWeek: number,
): RivalMatch[] {
  const competitions = ['League', 'Cup', 'Continental'];
  const history: RivalMatch[] = [];

  for (let i = 0; i < count; i++) {
    const s = Math.max(1, currentSeason - count + i);
    const w = 5 + Math.floor(rng() * 30);
    history.push({
      season: s,
      week: Math.min(w, 38),
      homeScore: Math.floor(rng() * 4),
      awayScore: Math.floor(rng() * 4),
      playerGoals: Math.floor(rng() * 3),
      playerRating: 5 + Math.floor(rng() * 4) + rng() > 0.5 ? 0.5 : 0,
      competition: competitions[Math.floor(rng() * competitions.length)],
    });
  }

  return history.sort((a, b) => b.season - a.season || b.week - a.week);
}

function generateKeyMoment(rng: () => number, type: string): string {
  const templates =
    type === 'club'
      ? KEY_MOMENT_TEMPLATES_CLUB
      : type === 'player'
        ? KEY_MOMENT_TEMPLATES_PLAYER
        : KEY_MOMENT_TEMPLATES_NATIONAL;

  let text = templates[Math.floor(rng() * templates.length)];
  text = text.replace('{competition}', 'League');
  const results = ['Dramatic 3-2 victory', 'Hard-fought 0-0 draw', 'Comfortable 2-0 win', 'Disappointing 1-3 defeat'];
  text = text.replace('{result}', results[Math.floor(rng() * results.length)]);
  return text;
}

// ============================================================
// Helper Functions
// ============================================================

function getIntensityColor(intensity: number): string {
  if (intensity >= 75) return 'text-red-400';
  if (intensity >= 45) return 'text-amber-400';
  return 'text-emerald-400';
}

function getIntensityBg(intensity: number): string {
  if (intensity >= 75) return 'bg-red-500';
  if (intensity >= 45) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getIntensityLabel(intensity: number): string {
  if (intensity >= 85) return 'Legendary';
  if (intensity >= 75) return 'Fierce';
  if (intensity >= 60) return 'Heated';
  if (intensity >= 45) return 'Growing';
  if (intensity >= 30) return 'Moderate';
  return 'Mild';
}

function getTypeBadgeColor(type: 'club' | 'player' | 'national'): string {
  switch (type) {
    case 'club':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'player':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    case 'national':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  }
}

function getTypeLabel(type: 'club' | 'player' | 'national'): string {
  switch (type) {
    case 'club': return 'Club';
    case 'player': return 'Player';
    case 'national': return 'National';
  }
}

function getTypeIcon(type: 'club' | 'player' | 'national') {
  switch (type) {
    case 'club':
      return <MapPin className="h-3 w-3" />;
    case 'player':
      return <Users className="h-3 w-3" />;
    case 'national':
      return <Flag className="h-3 w-3" />;
  }
}

// ============================================================
// VS SVG Graphic
// ============================================================

function VsGraphic({ leftLogo, rightLogo, leftName, rightName }: {
  leftLogo: string;
  rightLogo: string;
  leftName: string;
  rightName: string;
}) {
  return (
    <div className="relative flex items-center justify-between py-3">
      {/* Left side */}
      <div className="flex flex-col items-center gap-1 flex-1 text-right pr-4">
        <span className="text-3xl">{leftLogo}</span>
        <span className="text-sm font-bold text-[#c9d1d9] truncate max-w-[120px]">{leftName}</span>
      </div>

      {/* VS SVG */}
      <div className="relative shrink-0 mx-2">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer circle */}
          <circle cx="28" cy="28" r="27" stroke="#EF4444" strokeWidth="2" opacity="0.4" />
          {/* Inner ring */}
          <circle cx="28" cy="28" r="22" stroke="#EF4444" strokeWidth="1" opacity="0.2" />
          {/* VS Text */}
          <text x="28" y="34" textAnchor="middle" fill="#EF4444" fontSize="18" fontWeight="bold" fontFamily="system-ui">
            VS
          </text>
        </svg>
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="27" stroke="#EF4444" strokeWidth="2" opacity="0.6" />
          </svg>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center gap-1 flex-1 text-left pl-4">
        <span className="text-3xl">{rightLogo}</span>
        <span className="text-sm font-bold text-[#c9d1d9] truncate max-w-[120px]">{rightName}</span>
      </div>
    </div>
  );
}

// ============================================================
// Biggest Rival Highlight Card
// ============================================================

function BiggestRivalCard({ rival, playerName, playerLogo }: {
  rival: Rival;
  playerName: string;
  playerLogo: string;
}) {
  const total = rival.headToHead.wins + rival.headToHead.draws + rival.headToHead.losses;
  const winRate = total > 0 ? Math.round((rival.headToHead.wins / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#161b22] border-2 border-red-500/30 rounded-lg p-5 mb-5"
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame className="h-5 w-5 text-red-400" />
        </motion.div>
        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Biggest Rival</span>
      </div>

      {/* VS Graphic */}
      <VsGraphic
        leftLogo={playerLogo}
        rightLogo={rival.logo}
        leftName={playerName}
        rightName={rival.name}
      />

      {/* Intensity & Stats Row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[10px]">
            <Flame className="h-3 w-3 mr-1" />
            {getIntensityLabel(rival.intensity)}
          </Badge>
          <Badge variant="outline" className={getTypeBadgeColor(rival.type)}>
            {getTypeIcon(rival.type)}
            <span className="ml-1">{getTypeLabel(rival.type)}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">{winRate}% win rate</span>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#8b949e]">Rivalry Intensity</span>
          <span className={`text-[10px] font-bold ${getIntensityColor(rival.intensity)}`}>
            {rival.intensity}/100
          </span>
        </div>
        <div className="h-2.5 bg-[#21262d] rounded-lg overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rival.intensity}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-lg ${getIntensityBg(rival.intensity)}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Rivalry Stats Overview
// ============================================================

function RivalryStatsOverview({ rivals }: { rivals: Rival[] }) {
  const totalRivals = rivals.length;
  const avgIntensity = totalRivals > 0
    ? Math.round(rivals.reduce((s, r) => s + r.intensity, 0) / totalRivals)
    : 0;

  const totalWins = rivals.reduce((s, r) => s + r.headToHead.wins, 0);
  const totalDraws = rivals.reduce((s, r) => s + r.headToHead.draws, 0);
  const totalLosses = rivals.reduce((s, r) => s + r.headToHead.losses, 0);
  const totalH2H = totalWins + totalDraws + totalLosses;
  const winRate = totalH2H > 0 ? Math.round((totalWins / totalH2H) * 100) : 0;

  const mostCommon = totalRivals > 0
    ? rivals.reduce((best, r) => {
        const matches = r.headToHead.wins + r.headToHead.draws + r.headToHead.losses;
        return matches > (best.matches || 0) ? { name: r.name, matches } : best;
      }, { name: '—', matches: 0 })
    : { name: '—', matches: 0 };

  const fierceCount = rivals.filter((r) => r.intensity >= 75).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="grid grid-cols-2 gap-2 mb-5"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Swords className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">Total Rivals</span>
        </div>
        <span className="text-xl font-bold text-[#c9d1d9]">{totalRivals}</span>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Flame className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">Avg Intensity</span>
        </div>
        <span className={`text-xl font-bold ${getIntensityColor(avgIntensity)}`}>{avgIntensity}</span>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">Win Rate vs Rivals</span>
        </div>
        <span className="text-xl font-bold text-emerald-400">{winRate}%</span>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">Fierce Rivalries</span>
        </div>
        <span className="text-xl font-bold text-red-400">{fierceCount}</span>
      </div>
      {/* Most common opponent - spans full width */}
      <div className="col-span-2 bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e]">Most Common Opponent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#c9d1d9]">{mostCommon.name}</span>
            <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">
              {mostCommon.matches} meetings
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Rival Card Component
// ============================================================

function RivalCard({ rival, index }: { rival: Rival; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const total = rival.headToHead.wins + rival.headToHead.draws + rival.headToHead.losses;
  const winRate = total > 0 ? Math.round((rival.headToHead.wins / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
    >
      {/* Main row */}
      <div
        className="p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Logo & name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 bg-[#21262d] rounded-lg flex items-center justify-center text-lg">
              {rival.logo}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white truncate">{rival.name}</span>
                {rival.position && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                    {rival.position}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getTypeBadgeColor(rival.type)}`}>
                  {getTypeIcon(rival.type)}
                  <span className="ml-0.5">{getTypeLabel(rival.type)}</span>
                </Badge>
                <span className={`text-[9px] font-bold ${getIntensityColor(rival.intensity)}`}>
                  {getIntensityLabel(rival.intensity)}
                </span>
              </div>
            </div>
          </div>

          {/* Intensity meter */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-bold ${getIntensityColor(rival.intensity)}`}>
              {rival.intensity}
            </span>
            <div className="w-14 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
              <div
                className={`h-full rounded-lg ${getIntensityBg(rival.intensity)}`}
                style={{ width: `${rival.intensity}%` }}
              />
            </div>
          </div>

          {/* H2H mini */}
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-emerald-400 font-bold">{rival.headToHead.wins}W</span>
              <span className="text-[#8b949e]">{rival.headToHead.draws}D</span>
              <span className="text-red-400 font-bold">{rival.headToHead.losses}L</span>
            </div>
          </div>

          {/* Expand icon */}
          <div className="shrink-0 text-[#8b949e]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Last meeting */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#8b949e]">
          <Clock className="h-3 w-3" />
          <span>{rival.lastMeeting}</span>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 pt-2 border-t border-[#30363d] space-y-3">
              {/* Full head-to-head */}
              <div>
                <span className="text-xs text-[#8b949e] mb-1.5 block flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Head-to-Head Record
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-emerald-400">{rival.headToHead.wins}</span>
                    <span className="block text-[9px] text-emerald-400/70">Wins</span>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-amber-400">{rival.headToHead.draws}</span>
                    <span className="block text-[9px] text-amber-400/70">Draws</span>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-red-400">{rival.headToHead.losses}</span>
                    <span className="block text-[9px] text-red-400/70">Losses</span>
                  </div>
                </div>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#8b949e]">Win Rate</span>
                    <span className="text-[10px] font-bold text-emerald-400">{winRate}%</span>
                  </div>
                  <Progress value={winRate} className="h-1.5" />
                </div>
              </div>

              {/* Rival info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">
                  <MapPin className="h-3 w-3 mr-1" /> {rival.country}
                </Badge>
                {rival.overall && (
                  <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">
                    <Star className="h-3 w-3 mr-1" /> {rival.overall} OVR
                  </Badge>
                )}
                {rival.age && (
                  <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">
                    <Calendar className="h-3 w-3 mr-1" /> Age {rival.age}
                  </Badge>
                )}
              </div>

              {/* Current season performance */}
              <div>
                <span className="text-xs text-[#8b949e] mb-1 block flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Current Season Performance
                </span>
                <p className="text-xs text-[#c9d1d9] bg-[#21262d] rounded-lg px-3 py-2">{rival.seasonPerformance}</p>
              </div>

              {/* Match History (last 5) */}
              {rival.matchHistory.length > 0 && (
                <div>
                  <span className="text-xs text-[#8b949e] mb-1.5 block flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Match History (Recent)
                  </span>
                  <div className="space-y-1">
                    {rival.matchHistory.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#21262d] rounded-lg px-2.5 py-1.5 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8b949e]">S{m.season} W{m.week}</span>
                          <Badge className="bg-[#161b22] text-[#8b949e] border-0 text-[9px] h-4 px-1">
                            {m.competition}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#c9d1d9] font-bold">{m.homeScore} - {m.awayScore}</span>
                          <span className="text-emerald-400">{m.playerGoals > 0 ? `${m.playerGoals}G` : ''}</span>
                          <span className={m.playerRating >= 7 ? 'text-emerald-400' : m.playerRating >= 6 ? 'text-amber-400' : 'text-red-400'}>
                            {m.playerRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Moments / Rivalry Timeline */}
              {rival.keyMoments.length > 0 && (
                <div>
                  <span className="text-xs text-[#8b949e] mb-1.5 block flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Rivalry Timeline
                  </span>
                  <div className="space-y-1.5">
                    {rival.keyMoments.map((moment, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                        <span className="text-[11px] text-[#c9d1d9] leading-tight">{moment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Main RivalSystem Component
// ============================================================

export default function RivalSystem() {
  const gameState = useGameStore((s) => s.gameState);
  const [filter, setFilter] = useState<RivalFilter>('all');
  const [sort, setSort] = useState<RivalSort>('intensity');

  const rivals = useMemo(() => {
    if (!gameState) return [];
    const { player, currentClub, currentSeason, currentWeek } = gameState;
    const seed = `${player.id}-${currentClub.id}-v2`;

    const clubRivals = generateClubRivals(currentClub.id, currentClub.league, currentSeason, currentWeek, seed);
    const playerRivals = generatePlayerRivals(currentClub.id, currentClub.league, currentSeason, currentWeek, seed, player.overall);
    const nationalRivals = generateNationalRivals(player.nationality, currentSeason, currentWeek, seed);

    return [...clubRivals, ...playerRivals, ...nationalRivals];
  }, [gameState]);

  const biggestRival = useMemo(() => {
    if (rivals.length === 0) return null;
    return rivals.reduce((best, r) => (r.intensity > best.intensity ? r : best), rivals[0]);
  }, [rivals]);

  const filteredAndSorted = useMemo(() => {
    let list = [...rivals];

    // Filter
    if (filter !== 'all') {
      list = list.filter((r) => r.type === filter);
    }

    // Sort
    if (sort === 'intensity') {
      list.sort((a, b) => b.intensity - a.intensity);
    } else if (sort === 'recent') {
      list.sort((a, b) => b.intensity - a.intensity);
    } else if (sort === 'h2h') {
      list.sort((a, b) => {
        const totalA = a.headToHead.wins + a.headToHead.draws + a.headToHead.losses;
        const totalB = b.headToHead.wins + b.headToHead.draws + b.headToHead.losses;
        return totalB - totalA;
      });
    }

    return list;
  }, [rivals, filter, sort]);

  const counts = useMemo(() => ({
    all: rivals.length,
    club: rivals.filter((r) => r.type === 'club').length,
    player: rivals.filter((r) => r.type === 'player').length,
    national: rivals.filter((r) => r.type === 'national').length,
  }), [rivals]);

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center text-[#8b949e]">
        <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No career data available</p>
      </div>
    );
  }

  const { player, currentClub, currentSeason, currentWeek } = gameState;

  const filterTabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'club' as const, label: 'Club' },
    { value: 'player' as const, label: 'Player' },
    { value: 'national' as const, label: 'National' },
  ];

  const sortOptions = [
    { value: 'intensity' as const, label: 'Intensity' },
    { value: 'recent' as const, label: 'Recent' },
    { value: 'h2h' as const, label: 'H2H Games' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 mb-5"
      >
        <div className="p-2 bg-red-500/15 rounded-lg border border-red-500/20">
          <Swords className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Rival System</h1>
          <p className="text-xs text-[#8b949e]">
            {currentClub.name} &middot; S{currentSeason} W{currentWeek}
          </p>
        </div>
      </motion.div>

      {/* Biggest Rival Highlight */}
      {biggestRival && (
        <BiggestRivalCard
          rival={biggestRival}
          playerName={player.name}
          playerLogo={currentClub.logo}
        />
      )}

      {/* Rivalry Stats Overview */}
      <RivalryStatsOverview rivals={rivals} />

      {/* Filters & Sort */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-4 space-y-2"
      >
        {/* Type filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as RivalFilter)}>
          <TabsList className="bg-[#161b22] border border-[#30363d] w-full h-auto p-1 flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400"
              >
                {tab.label}
                <span className="ml-1 text-[10px] opacity-60">
                  ({counts[tab.value]})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Sort buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8b949e] mr-1">Sort:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                sort === opt.value
                  ? 'bg-[#21262d] border-[#30363d] text-white font-medium'
                  : 'bg-transparent border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Rival List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredAndSorted.length > 0 ? (
            filteredAndSorted.map((rival, i) => (
              <RivalCard key={rival.id} rival={rival} index={i} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Swords className="h-12 w-12 mx-auto mb-3 text-[#484f58]" />
              <p className="text-[#8b949e] text-sm">No rivals found</p>
              <p className="text-[#8b949e] text-xs mt-1">Try a different filter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rivalry Dynamics Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-5 bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h3 className="text-xs font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          How Rivalries Form
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Heart className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
            <span className="text-[11px] text-[#8b949e] leading-tight">
              <strong className="text-[#c9d1d9]">Close Matches</strong> — 1-goal margins and late equalizers intensify rivalries
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span className="text-[11px] text-[#8b949e] leading-tight">
              <strong className="text-[#c9d1d9]">Cup Encounters</strong> — Knockout meetings forge new rivalries
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Flag className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
            <span className="text-[11px] text-[#8b949e] leading-tight">
              <strong className="text-[#c9d1d9]">International Duty</strong> — National team call-ups create international rivalries
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-[11px] text-[#8b949e] leading-tight">
              <strong className="text-[#c9d1d9]">Derbies</strong> — Historic local rivalries are tracked with extra intensity
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
