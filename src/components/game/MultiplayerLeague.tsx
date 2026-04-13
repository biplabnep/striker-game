'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Users, Trophy, TrendingUp, TrendingDown, Minus,
  Calendar, Shield, Target, Star, Medal, Crown,
  MessageSquare, Send, Settings, LogOut, PlusCircle,
  Clock, Zap, Award, ChevronRight, Swords, Activity,
  BarChart3, Lock, Eye, Flag, UserPlus,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================
const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const CARD_BG_ALT = 'bg-[#21262d]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';
const EMERALD = '#34d399';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const BLUE = '#3b82f6';

// ============================================================
// Deterministic Helpers
// ============================================================
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ============================================================
// Type Definitions
// ============================================================
interface LeaguePlayer {
  id: string;
  playerName: string;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  pointsChange: number;
  isPlayer: boolean;
}

interface LeagueFixture {
  id: string;
  homePlayer: string;
  awayPlayer: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  gameweek: number;
  played: boolean;
  competition: string;
  goalScorers: string[];
  isPlayerHome: boolean;
  isPlayerAway: boolean;
}

interface AllTimeEntry {
  rank: number;
  playerName: string;
  teamLogo: string;
  titlesWon: number;
  runnerUp: number;
  totalPoints: number;
  winRate: number;
  earnings: number;
  isPlayer: boolean;
  isChampion: boolean;
}

interface SeasonStatLeader {
  category: string;
  icon: React.ReactNode;
  playerName: string;
  value: string;
  teamBadge: string;
}

interface LeagueChatMessage {
  id: string;
  playerName: string;
  avatar: string;
  message: string;
  timestamp: string;
  isSystem: boolean;
}

type LeagueStatus = 'In Progress' | 'Registration Open' | 'Completed';
type FixtureTab = 'my_fixtures' | 'all_fixtures' | 'results';

// ============================================================
// Deterministic Data Generators
// ============================================================

const PLAYER_NAMES: string[] = [
  'Marcus Sterling', 'Carlos Vega', 'Lukas Müller', 'Antoine Dubois',
  'Kenji Tanaka', 'Rafael Santos', 'Erik Johansson', 'Omar Farouk',
  'Diego Morales', 'Patrick O\'Brien', 'Yusuf Demir', 'Alejandro Ruiz',
];

const TEAM_NAMES: string[] = [
  'Phoenix Rising', 'Thunder Wolves', 'Shadow Strikers', 'Golden Eagles',
  'Iron Warriors', 'Crystal Palace FC', 'Northern Lights', 'Storm Breakers',
  'Dark Knights', 'Royal Falcons', 'Cosmic United', 'Blazing Comets',
];

const TEAM_LOGOS: string[] = [
  '🔥', '🐺', '⚡', '🦅', '🛡️', '💎', '🌌', '🌊', '🗡️', '👑', '🌠', '☄️',
];

function generateLeaguePlayers(playerName: string, playerTeam: string, playerLogo: string): LeaguePlayer[] {
  const players: LeaguePlayer[] = [];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const isPlayer = i === 0;
    const seed = i * 17 + 3;
    const name = isPlayer ? playerName : PLAYER_NAMES[i];
    const team = isPlayer ? playerTeam : TEAM_NAMES[i];
    const logo = isPlayer ? playerLogo : TEAM_LOGOS[i];

    const baseWins = isPlayer ? 7 : Math.floor(seededRandom(seed) * 12) + 2;
    const baseDraws = Math.floor(seededRandom(seed + 1) * 5);
    const baseLosses = Math.floor(seededRandom(seed + 2) * 10);
    const gf = baseWins * 2 + baseDraws + Math.floor(seededRandom(seed + 3) * 8);
    const ga = baseLosses * 2 + baseDraws + Math.floor(seededRandom(seed + 4) * 6);

    const formSeed = seed + 50;
    const form: ('W' | 'D' | 'L')[] = [];
    for (let f = 0; f < 5; f++) {
      const roll = seededRandom(formSeed + f);
      form.push(roll < 0.45 ? 'W' : roll < 0.7 ? 'D' : 'L');
    }

    players.push({
      id: `lp-${i}`,
      playerName: name,
      teamName: team,
      teamLogo: logo,
      played: baseWins + baseDraws + baseLosses,
      won: baseWins,
      drawn: baseDraws,
      lost: baseLosses,
      goalsFor: gf,
      goalsAgainst: ga,
      points: baseWins * 3 + baseDraws,
      form,
      pointsChange: Math.floor(seededRandom(seed + 10) * 7) - 3,
      isPlayer,
    });
  }

  return players.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

function generateFixtures(
  playerIdx: number,
  players: LeaguePlayer[],
  currentGameweek: number,
  totalGameweeks: number,
): LeagueFixture[] {
  const fixtures: LeagueFixture[] = [];
  let fixtureId = 0;

  for (let gw = Math.max(1, currentGameweek - 2); gw <= Math.min(totalGameweeks, currentGameweek + 3); gw++) {
    const matchesPerGw = Math.floor(players.length / 2);
    for (let m = 0; m < matchesPerGw; m++) {
      const homeSeed = gw * 13 + m * 7 + 1;
      const homeIdx = Math.floor(seededRandom(homeSeed) * players.length);
      let awayIdx = Math.floor(seededRandom(homeSeed + 1) * (players.length - 1));
      if (awayIdx >= homeIdx) awayIdx++;
      if (awayIdx >= players.length) awayIdx = (homeIdx + 1) % players.length;

      const home = players[homeIdx];
      const away = players[awayIdx];
      const isPlayed = gw < currentGameweek;
      const seed = gw * 31 + m * 17;

      fixtures.push({
        id: `fix-${fixtureId++}`,
        homePlayer: home.playerName,
        awayPlayer: away.playerName,
        homeTeam: home.teamName,
        awayTeam: away.teamName,
        homeLogo: home.teamLogo,
        awayLogo: away.teamLogo,
        homeScore: isPlayed ? Math.floor(seededRandom(seed) * 4) : null,
        awayScore: isPlayed ? Math.floor(seededRandom(seed + 1) * 3) : null,
        date: `GW ${gw}`,
        gameweek: gw,
        played: isPlayed,
        competition: 'League',
        goalScorers: isPlayed
          ? [`${home.playerName.split(' ')[1]} ${seededRandom(seed + 2) > 0.5 ? Math.floor(seededRandom(seed + 3) * 45 + 1) + "'" : ''}`.trim()]
          : [],
        isPlayerHome: home.isPlayer,
        isPlayerAway: away.isPlayer,
      });
    }
  }

  return fixtures;
}

function generateAllTimeLeaderboard(playerName: string, playerLogo: string): AllTimeEntry[] {
  const entries: AllTimeEntry[] = [];
  const totalEntries = 10;
  let playerInserted = false;

  for (let i = 0; i < totalEntries; i++) {
    const seed = i * 23 + 7;
    const isPlayer = !playerInserted && i === 2;
    if (isPlayer) playerInserted = true;

    entries.push({
      rank: i + 1,
      playerName: isPlayer ? playerName : PLAYER_NAMES[i < 2 ? i : i],
      teamLogo: isPlayer ? playerLogo : TEAM_LOGOS[i],
      titlesWon: isPlayer ? 2 : Math.floor(seededRandom(seed) * 5),
      runnerUp: isPlayer ? 1 : Math.floor(seededRandom(seed + 1) * 4),
      totalPoints: isPlayer ? 847 : Math.floor(seededRandom(seed + 2) * 1200) + 200,
      winRate: isPlayer ? 62 : Math.floor(seededRandom(seed + 3) * 40) + 35,
      earnings: isPlayer ? 12500 : Math.floor(seededRandom(seed + 4) * 25000) + 2000,
      isPlayer,
      isChampion: (isPlayer ? 2 : Math.floor(seededRandom(seed) * 5)) > 0,
    });
  }

  if (!playerInserted) {
    entries[3] = {
      ...entries[3],
      playerName,
      teamLogo: playerLogo,
      isPlayer: true,
      titlesWon: 1,
      runnerUp: 2,
      totalPoints: 623,
      winRate: 54,
      earnings: 8200,
      isChampion: true,
    };
  }

  return entries.sort((a, b) => b.totalPoints - a.totalPoints).map((e, idx) => ({ ...e, rank: idx + 1 }));
}

function generateSeasonStats(): SeasonStatLeader[] {
  const stats: SeasonStatLeader[] = [
    {
      category: 'Top Scorer',
      icon: <Target className="h-3.5 w-3.5" style={{ color: RED }} />,
      playerName: 'Marcus Sterling',
      value: '18 goals',
      teamBadge: '🔥',
    },
    {
      category: 'Most Assists',
      icon: <Activity className="h-3.5 w-3.5" style={{ color: BLUE }} />,
      playerName: 'Carlos Vega',
      value: '12 assists',
      teamBadge: '🐺',
    },
    {
      category: 'Best Defense',
      icon: <Shield className="h-3.5 w-3.5" style={{ color: EMERALD }} />,
      playerName: 'Lukas Müller',
      value: '8 GA in 14',
      teamBadge: '⚡',
    },
    {
      category: 'Most Clean Sheets',
      icon: <Lock className="h-3.5 w-3.5" style={{ color: AMBER }} />,
      playerName: 'Erik Johansson',
      value: '9 clean sheets',
      teamBadge: '🌊',
    },
    {
      category: 'Highest Rating',
      icon: <Star className="h-3.5 w-3.5" style={{ color: AMBER }} />,
      playerName: 'Kenji Tanaka',
      value: '8.4 avg',
      teamBadge: '🌌',
    },
    {
      category: 'Most MOTM',
      icon: <Award className="h-3.5 w-3.5" style={{ color: '#c084fc' }} />,
      playerName: 'Rafael Santos',
      value: '6 MOTM',
      teamBadge: '🛡️',
    },
  ];

  return stats;
}

function generateChatMessages(): LeagueChatMessage[] {
  return [
    {
      id: 'msg-1',
      playerName: 'System',
      avatar: '📢',
      message: 'Welcome to the Elite Striker League Season 4! Gameweek 14 begins now.',
      timestamp: '2h ago',
      isSystem: true,
    },
    {
      id: 'msg-2',
      playerName: 'Marcus Sterling',
      avatar: '🔥',
      message: 'GG everyone, tough match last gameweek. That 90th minute equaliser was brutal!',
      timestamp: '1h ago',
      isSystem: false,
    },
    {
      id: 'msg-3',
      playerName: 'Carlos Vega',
      avatar: '🐺',
      message: 'Anyone up for a friendly before the next league match? Need some practice.',
      timestamp: '55m ago',
      isSystem: false,
    },
    {
      id: 'msg-4',
      playerName: 'Lukas Müller',
      avatar: '⚡',
      message: 'The top 3 is so tight right now. 4 points between 1st and 3rd!',
      timestamp: '40m ago',
      isSystem: false,
    },
    {
      id: 'msg-5',
      playerName: 'Antoine Dubois',
      avatar: '💎',
      message: 'My striker is on fire this season. 8 goals in the last 5 matches!',
      timestamp: '30m ago',
      isSystem: false,
    },
    {
      id: 'msg-6',
      playerName: 'System',
      avatar: '🏆',
      message: 'Reminder: Registration for Season 5 closes in 3 days. Invite your friends!',
      timestamp: '15m ago',
      isSystem: false,
    },
    {
      id: 'msg-7',
      playerName: 'Rafael Santos',
      avatar: '🛡️',
      message: 'Who wants to trade? I have a 85-rated CAM looking for a solid CB.',
      timestamp: '8m ago',
      isSystem: false,
    },
    {
      id: 'msg-8',
      playerName: 'Omar Farouk',
      avatar: '🗡️',
      message: 'That penalty call in GW 12 was a joke. VAR needs sorting out.',
      timestamp: '3m ago',
      isSystem: false,
    },
  ];
}

// ============================================================
// Inline SVG Icons
// ============================================================
function TrophySVG({ color = '#fbbf24' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 2h8v3a6 6 0 01-4 5.67A6 6 0 018 5V2z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="1.5" />
      <path d="M12 10.67V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 15h6v2H9z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 2H5c0 3 1.5 4.5 3 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 2h3c0 3-1.5 4.5-3 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChestSVG({ color = '#c0c0c0' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="10" rx="2" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="1.5" />
      <path d="M8 10V8a4 4 0 018 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1" fill={color} />
    </svg>
  );
}

function ShieldSVG({ color = '#cd7f32' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const color = result === 'W' ? EMERALD : result === 'D' ? AMBER : RED;
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-[9px] font-bold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {result}
    </span>
  );
}

function PointsChangeArrow({ change }: { change: number }) {
  if (change === 0) return <Minus className="h-3 w-3 text-[#484f58]" />;
  if (change > 0) return <TrendingUp className="h-3 w-3" style={{ color: EMERALD }} />;
  return <TrendingDown className="h-3 w-3" style={{ color: RED }} />;
}

function HallOfChampionsBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold" style={{ backgroundColor: '#fbbf2415', color: '#fbbf24' }}>
      <Crown className="h-3 w-3" />
      HALL
    </span>
  );
}

// ============================================================
// Section 1: League Hub Header
// ============================================================
function LeagueHubHeader({
  playerName,
  teamName,
  playerPosition,
  playerPoints,
  matchesPlayed,
  totalPlayers,
  status,
  season,
  gameweek,
}: {
  playerName: string;
  teamName: string;
  playerPosition: number;
  playerPoints: number;
  matchesPlayed: number;
  totalPlayers: number;
  status: LeagueStatus;
  season: number;
  gameweek: number;
}) {
  const statusColor = status === 'In Progress' ? EMERALD : status === 'Registration Open' ? AMBER : '#8b949e';
  const statusBg = status === 'In Progress' ? `${EMERALD}15` : status === 'Registration Open' ? `${AMBER}15` : '#8b949e15';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" style={{ color: EMERALD }} />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Multiplayer League</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ backgroundColor: `${EMERALD}20`, color: EMERALD }}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite Friends
        </button>
      </div>

      {/* League Info Card */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4" style={{ color: AMBER }} />
            <span className="text-sm font-semibold text-[#c9d1d9]">Elite Striker Premier</span>
          </div>
          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold" style={{ backgroundColor: statusBg, color: statusColor }}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
          <span className="flex items-center gap-1"><Flag className="h-3 w-3" /> Season {season}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Gameweek {gameweek}/28</span>
          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" style={{ color: AMBER }} /> {teamName}</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Players', value: `${totalPlayers}`, icon: <Users className="h-4 w-4 text-[#8b949e]" /> },
          { label: 'Your Position', value: `${playerPosition}${playerPosition === 1 ? 'st' : playerPosition === 2 ? 'nd' : playerPosition === 3 ? 'rd' : 'th'}`, icon: <BarChart3 className="h-4 w-4" style={{ color: EMERALD }} /> },
          { label: 'Points', value: `${playerPoints}`, icon: <Zap className="h-4 w-4" style={{ color: AMBER }} /> },
          { label: 'Matches', value: `${matchesPlayed}`, icon: <Swords className="h-4 w-4" style={{ color: BLUE }} /> },
        ].map((stat) => (
          <div key={stat.label} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-2.5 flex flex-col items-center gap-1`}>
            {stat.icon}
            <span className="text-sm font-bold text-[#c9d1d9]">{stat.value}</span>
            <span className="text-[9px] text-[#484f58] text-center leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 2: League Standings Table
// ============================================================
function LeagueStandingsTable({ players }: { players: LeaguePlayer[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4" style={{ color: AMBER }} />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">League Standings</h2>
      </div>

      {/* Table */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg overflow-hidden`}>
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[9px] font-semibold text-[#484f58] uppercase tracking-wider border-b border-[#30363d]" style={{ backgroundColor: '#0d1117' }}>
          <span className="col-span-1">#</span>
          <span className="col-span-3">Player</span>
          <span className="col-span-1 text-center">P</span>
          <span className="col-span-1 text-center">W</span>
          <span className="col-span-1 text-center">D</span>
          <span className="col-span-1 text-center">L</span>
          <span className="col-span-1 text-center">GD</span>
          <span className="col-span-1 text-center">Pts</span>
          <span className="col-span-2 text-center">Form</span>
        </div>

        {/* Player Rows */}
        {players.map((player, idx) => {
          const gd = player.goalsFor - player.goalsAgainst;
          const rank = idx + 1;
          const isRelegationZone = rank >= players.length - 1;
          const isTopThree = rank <= 3;

          const rankIcon = rank === 1 ? <TrophySVG /> : rank === 2 ? <ChestSVG /> : rank === 3 ? <ShieldSVG /> : null;
          const rowBorderColor = player.isPlayer
            ? `border-l-2 border-l-[${EMERALD}]`
            : isRelegationZone
              ? 'border-l-2 border-l-[#ef4444]'
              : '';
          const rowBgColor = player.isPlayer
            ? '#34d39908'
            : isRelegationZone
              ? '#ef444408'
              : '';

          return (
            <div
              key={player.id}
              className={`grid grid-cols-12 gap-1 px-3 py-2.5 items-center text-xs transition-colors ${rowBorderColor}`}
              style={{ backgroundColor: idx % 2 === 0 ? rowBgColor : 'transparent' }}
            >
              {/* Rank */}
              <span className="col-span-1 flex items-center gap-1">
                {rankIcon || <span className="text-[#8b949e] font-semibold text-[11px]">{rank}</span>}
              </span>

              {/* Player Name & Team */}
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm flex-shrink-0">{player.teamLogo}</span>
                  <div className="min-w-0">
                    <span className={`text-[11px] font-semibold truncate block ${player.isPlayer ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                      {player.playerName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-[#484f58] truncate block">{player.teamName}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <span className="col-span-1 text-center text-[11px] text-[#8b949e]">{player.played}</span>
              <span className="col-span-1 text-center text-[11px] font-semibold" style={{ color: EMERALD }}>{player.won}</span>
              <span className="col-span-1 text-center text-[11px] text-[#8b949e]">{player.drawn}</span>
              <span className="col-span-1 text-center text-[11px]" style={{ color: RED }}>{player.lost}</span>
              <span className={`col-span-1 text-center text-[11px] font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                {gd > 0 ? `+${gd}` : gd}
              </span>

              {/* Points & Change */}
              <div className="col-span-1 flex flex-col items-center">
                <span className="text-[12px] font-bold text-[#c9d1d9]">{player.points}</span>
                <PointsChangeArrow change={player.pointsChange} />
              </div>

              {/* Form */}
              <div className="col-span-2 flex items-center justify-end gap-0.5">
                {player.form.map((f, fi) => (
                  <FormDot key={fi} result={f} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 px-3 py-2 border-t border-[#30363d] text-[9px] text-[#484f58]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: EMERALD }} /> Win</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: AMBER }} /> Draw</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: RED }} /> Loss</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-red-400/40" /> Relegation</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 3: League Fixtures
// ============================================================
function LeagueFixtures({ fixtures, activeTab, setActiveTab }: { fixtures: LeagueFixture[]; activeTab: FixtureTab; setActiveTab: (t: FixtureTab) => void }) {
  const myFixtures = useMemo(
    () => fixtures.filter(f => (f.isPlayerHome || f.isPlayerAway) && !f.played),
    [fixtures],
  );
  const allFixtures = useMemo(
    () => fixtures.filter(f => !f.played),
    [fixtures],
  );
  const results = useMemo(
    () => fixtures.filter(f => f.played),
    [fixtures],
  );

  const fixtureTabs: { value: FixtureTab; label: string }[] = [
    { value: 'my_fixtures', label: `My Fixtures (${myFixtures.length})` },
    { value: 'all_fixtures', label: `All Fixtures (${allFixtures.length})` },
    { value: 'results', label: `Results (${results.length})` },
  ];

  const displayFixtures = activeTab === 'my_fixtures' ? myFixtures : activeTab === 'all_fixtures' ? allFixtures : results;

  const renderMatchCard = (fixture: LeagueFixture) => {
    const isPlayerMatch = fixture.isPlayerHome || fixture.isPlayerAway;
    return (
      <div
        key={fixture.id}
        className={`${CARD_BG} border rounded-lg p-3 transition-colors ${isPlayerMatch ? 'border-emerald-500/30' : BORDER_COLOR}`}
        style={{ backgroundColor: isPlayerMatch ? '#34d39908' : '#161b22' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-[#484f58]" />
            <span className="text-[10px] text-[#8b949e] font-medium">{fixture.date}</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">
            {fixture.competition}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          {/* Home */}
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${fixture.isPlayerHome ? '' : 'flex-row-reverse text-right'}`}>
            <span className="text-lg flex-shrink-0">{fixture.homeLogo}</span>
            <div className="min-w-0">
              <span className={`text-[11px] font-semibold truncate block ${fixture.isPlayerHome ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                {fixture.homePlayer.split(' ')[0]}
              </span>
              <span className="text-[9px] text-[#484f58] truncate block">{fixture.isPlayerHome ? 'HOME' : ''}</span>
            </div>
          </div>

          {/* Score / VS */}
          <div className="flex items-center gap-2 mx-2 flex-shrink-0">
            {fixture.played ? (
              <>
                <span className={`text-lg font-bold ${fixture.homeScore !== null && fixture.awayScore !== null && fixture.homeScore > fixture.awayScore && fixture.isPlayerHome ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                  {fixture.homeScore}
                </span>
                <span className="text-[10px] text-[#484f58]">-</span>
                <span className={`text-lg font-bold ${fixture.homeScore !== null && fixture.awayScore !== null && fixture.awayScore > fixture.homeScore && fixture.isPlayerAway ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                  {fixture.awayScore}
                </span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-[#484f58] px-2 py-0.5 rounded-sm border border-[#30363d]">VS</span>
            )}
          </div>

          {/* Away */}
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${fixture.isPlayerAway ? 'flex-row-reverse text-right' : ''}`}>
            <span className="text-lg flex-shrink-0">{fixture.awayLogo}</span>
            <div className="min-w-0">
              <span className={`text-[11px] font-semibold truncate block ${fixture.isPlayerAway ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                {fixture.awayPlayer.split(' ')[0]}
              </span>
              <span className="text-[9px] text-[#484f58] truncate block">{fixture.isPlayerAway ? 'AWAY' : ''}</span>
            </div>
          </div>
        </div>

        {/* Goal Scorers */}
        {fixture.played && fixture.goalScorers.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#21262d]">
            <span className="text-[9px] text-[#484f58]">⚽ {fixture.goalScorers.filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" style={{ color: BLUE }} />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">Fixtures & Results</h2>
      </div>

      {/* Fixture Tabs */}
      <div className="flex gap-1.5">
        {fixtureTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
              activeTab === tab.value
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : `${BORDER_COLOR} text-[#8b949e] hover:text-[#c9d1d9]`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fixture List */}
      <div className="space-y-2">
        {displayFixtures.length > 0 ? (
          displayFixtures.slice(0, 6).map(renderMatchCard)
        ) : (
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 flex flex-col items-center justify-center text-center`}>
            <Clock className="h-8 w-8 text-[#30363d] mb-2" />
            <span className="text-xs text-[#8b949e]">No fixtures available</span>
            <span className="text-[10px] text-[#484f58] mt-1">Check back for upcoming matches</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 4: League Leaderboard
// ============================================================
function LeagueLeaderboard({ entries }: { entries: AllTimeEntry[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4" style={{ color: AMBER }} />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">All-Time Leaderboard</h2>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">
          Top 10
        </Badge>
      </div>

      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.rank}
            className={`${CARD_BG} border rounded-lg p-3 transition-colors ${entry.isPlayer ? 'border-emerald-500/30' : BORDER_COLOR}`}
            style={{ backgroundColor: entry.isPlayer ? '#34d39908' : '#161b22' }}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex flex-col items-center">
                {entry.rank <= 3 ? (
                  <span className="text-lg">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-[#8b949e]">{entry.rank}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm flex-shrink-0">{entry.teamLogo}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold truncate ${entry.isPlayer ? 'text-[#34d399]' : TEXT_PRIMARY}`}>
                        {entry.playerName}
                      </span>
                      {entry.isChampion && <HallOfChampionsBadge />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#484f58]">{entry.titlesWon} titles</span>
                      <span className="text-[9px] text-[#484f58]">{entry.runnerUp} RU</span>
                      <span className="text-[9px] text-[#484f58]">{entry.winRate}% WR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points & Earnings */}
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-bold text-[#c9d1d9]">{entry.totalPoints.toLocaleString()}</span>
                <span className="text-[9px] font-medium" style={{ color: AMBER }}>€{(entry.earnings / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 5: League Statistics
// ============================================================
function LeagueStatistics({ stats }: { stats: SeasonStatLeader[] }) {
  const leagueAvgStats = [
    { label: 'Goals/Game', value: '2.8' },
    { label: 'Cards/Game', value: '3.1' },
    { label: 'Avg Rating', value: '6.7' },
    { label: 'Possession', value: '50%' },
  ];

  const predictions = [
    { award: 'MVP', player: 'Marcus Sterling', logo: '🔥', probability: 72 },
    { award: 'Golden Boot', player: 'Kenji Tanaka', logo: '🌌', probability: 65 },
    { award: 'Best GK', player: 'Erik Johansson', logo: '🌊', probability: 58 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" style={{ color: '#c084fc' }} />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">Season Statistics</h2>
      </div>

      {/* Stat Leaders Grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(stat => (
          <div key={stat.category} className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3`}>
            <div className="flex items-center gap-1.5 mb-2">
              {stat.icon}
              <span className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider">{stat.category}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm flex-shrink-0">{stat.teamBadge}</span>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-[#c9d1d9] truncate block">{stat.playerName}</span>
                <span className="text-[10px] font-bold text-emerald-400">{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* League Average Stats */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4`}>
        <h3 className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-3">League Averages</h3>
        <div className="grid grid-cols-4 gap-3">
          {leagueAvgStats.map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-[#c9d1d9]">{stat.value}</span>
              <span className="text-[9px] text-[#484f58] text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Season Awards Predictions */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 space-y-3`}>
        <h3 className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Season Awards Predictions</h3>
        {predictions.map(pred => (
          <div key={pred.award} className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm">{pred.logo}</span>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[#c9d1d9]">{pred.award}</span>
                <span className="block text-[11px] text-[#8b949e] truncate">{pred.player}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 h-1.5 rounded-sm bg-[#21262d]">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{ width: `${pred.probability}%`, backgroundColor: EMERALD }}
                />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: EMERALD }}>{pred.probability}%</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 6: League Settings & Chat
// ============================================================
function LeagueSettingsChat({
  chatMessages,
}: {
  chatMessages: LeagueChatMessage[];
}) {
  const [chatInput, setChatInput] = useState('');

  const leagueSettings = [
    { label: 'Match Format', value: '5 min' },
    { label: 'Difficulty', value: 'Normal' },
    { label: 'Starting Budget', value: '€50M' },
    { label: 'Squad Size', value: '23 players' },
    { label: 'Draft Type', value: 'Snake Draft' },
  ];

  const draftInfo = [
    { label: 'Draft Order', value: 'Random (serpentine)' },
    { label: 'Draft Date', value: 'Completed — Jan 15' },
    { label: 'Your Pick', value: '#3 overall' },
    { label: 'Players Drafted', value: '230 / 230' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" style={{ color: '#8b949e' }} />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">Settings & Chat</h2>
      </div>

      {/* League Settings */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 space-y-3`}>
        <h3 className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">League Settings</h3>
        <div className="grid grid-cols-2 gap-2">
          {leagueSettings.map(setting => (
            <div key={setting.label} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: '#0d1117' }}>
              <span className="text-[10px] text-[#8b949e]">{setting.label}</span>
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{setting.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Draft Info */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-4 space-y-3`}>
        <h3 className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Draft Information</h3>
        <div className="grid grid-cols-2 gap-2">
          {draftInfo.map(info => (
            <div key={info.label} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: '#0d1117' }}>
              <span className="text-[10px] text-[#8b949e]">{info.label}</span>
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{info.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* League Chat */}
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg overflow-hidden`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d]">
          <MessageSquare className="h-4 w-4" style={{ color: BLUE }} />
          <h3 className="text-xs font-semibold text-[#c9d1d9]">League Chat</h3>
          <span className="text-[9px] text-[#484f58] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#21262d' }}>
            {chatMessages.filter(m => !m.isSystem).length} online
          </span>
        </div>

        {/* Messages */}
        <div className="max-h-64 overflow-y-auto p-3 space-y-2.5">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`${msg.isSystem ? 'text-center' : ''}`}>
              {msg.isSystem ? (
                <div className="py-1 px-3 rounded-sm inline-block" style={{ backgroundColor: '#21262d' }}>
                  <span className="text-[10px] text-[#8b949e]">{msg.message}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0 mt-0.5">{msg.avatar}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#c9d1d9]">{msg.playerName.split(' ')[0]}</span>
                      <span className="text-[8px] text-[#484f58]">{msg.timestamp}</span>
                    </div>
                    <span className="text-[11px] text-[#8b949e] leading-relaxed">{msg.message}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="border-t border-[#30363d] p-2 flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50"
          />
          <button className="flex items-center justify-center w-8 h-8 rounded-md transition-colors" style={{ backgroundColor: `${EMERALD}20` }}>
            <Send className="h-3.5 w-3.5" style={{ color: EMERALD }} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold transition-colors hover:bg-red-500/10">
          <LogOut className="h-3.5 w-3.5" />
          Leave League
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-xs font-semibold transition-colors" style={{ backgroundColor: `${EMERALD}cc` }}>
          <PlusCircle className="h-3.5 w-3.5" />
          Create New League
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MultiplayerLeague() {
  const gameState = useGameStore(state => state.gameState);
  const [fixtureTab, setFixtureTab] = useState<FixtureTab>('my_fixtures');

  const playerName = gameState?.player?.name ?? 'You';
  const playerTeam = gameState?.currentClub?.shortName ?? 'Your Team';
  const playerLogo = gameState?.currentClub?.logo ?? '⚽';

  const leaguePlayers = useMemo(
    () => generateLeaguePlayers(playerName, playerTeam, playerLogo),
    [playerName, playerTeam, playerLogo],
  );

  const playerEntry = leaguePlayers.find(p => p.isPlayer);
  const playerPosition = playerEntry ? leaguePlayers.indexOf(playerEntry) + 1 : 1;
  const playerPoints = playerEntry?.points ?? 0;
  const matchesPlayed = playerEntry?.played ?? 0;
  const currentGameweek = 14;
  const totalGameweeks = 28;
  const totalPlayers = leaguePlayers.length;
  const season = 4;
  const status: LeagueStatus = 'In Progress';

  const fixtures = useMemo(
    () => generateFixtures(0, leaguePlayers, currentGameweek, totalGameweeks),
    [leaguePlayers, currentGameweek, totalGameweeks],
  );

  const allTimeLeaderboard = useMemo(
    () => generateAllTimeLeaderboard(playerName, playerLogo),
    [playerName, playerLogo],
  );

  const seasonStats = useMemo(() => generateSeasonStats(), []);
  const chatMessages = useMemo(() => generateChatMessages(), []);

  return (
    <div className="max-w-lg mx-auto px-3 py-4 space-y-5">
      {/* Header */}
      <LeagueHubHeader
        playerName={playerName}
        teamName={playerTeam}
        playerPosition={playerPosition}
        playerPoints={playerPoints}
        matchesPlayed={matchesPlayed}
        totalPlayers={totalPlayers}
        status={status}
        season={season}
        gameweek={currentGameweek}
      />

      {/* Main Tabs */}
      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="w-full flex bg-[#161b22] border border-[#30363d] rounded-lg h-9 p-0.5">
          <TabsTrigger
            value="standings"
            className="flex-1 rounded-md text-[11px] font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-[#8b949e] h-7 transition-colors"
          >
            <Trophy className="h-3 w-3 mr-1" />
            Standings
          </TabsTrigger>
          <TabsTrigger
            value="fixtures"
            className="flex-1 rounded-md text-[11px] font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-[#8b949e] h-7 transition-colors"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Fixtures
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="flex-1 rounded-md text-[11px] font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-[#8b949e] h-7 transition-colors"
          >
            <Crown className="h-3 w-3 mr-1" />
            All-Time
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex-1 rounded-md text-[11px] font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-[#8b949e] h-7 transition-colors"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 rounded-md text-[11px] font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-[#8b949e] h-7 transition-colors"
          >
            <Settings className="h-3 w-3 mr-1" />
            More
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-4">
          <LeagueStandingsTable players={leaguePlayers} />
        </TabsContent>

        <TabsContent value="fixtures" className="mt-4">
          <LeagueFixtures fixtures={fixtures} activeTab={fixtureTab} setActiveTab={setFixtureTab} />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <LeagueLeaderboard entries={allTimeLeaderboard} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <LeagueStatistics stats={seasonStats} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <LeagueSettingsChat chatMessages={chatMessages} />
        </TabsContent>
      </Tabs>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
