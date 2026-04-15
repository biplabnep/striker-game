'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getPlayerNationInfo } from '@/lib/game/internationalEngine';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Globe,
  Star,
  Target,
  Users,
  Calendar,
  MapPin,
  Shield,
  Swords,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Clock,
  Zap,
  Medal,
  BarChart3,
  Eye,
  Flag,
  Wind,
  Cloud,
  Sun,
  Activity,
  Lock,
  Heart,
  GitCompareArrows,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================
const DARK_BG = 'bg-[#0d1117]';
const CARD_BG = 'bg-[#161b22]';
const BORDER_COLOR = 'border-[#30363d]';
const TEXT_PRIMARY = 'text-[#c9d1d9]';
const TEXT_SECONDARY = 'text-[#8b949e]';

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
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getFifaRanking(nationName: string): number {
  return Math.abs(hashCode(nationName)) % 200 + 1;
}

function getTeamStyle(nationName: string): string {
  const styles = ['Attacking', 'Balanced', 'Defensive', 'Counter-Attack', 'Possession'];
  const idx = Math.abs(hashCode(nationName + '_style')) % styles.length;
  return styles[idx];
}

function getTeamQuality(nationName: string): number {
  return Math.abs(hashCode(nationName + '_quality')) % 40 + 60;
}

// ============================================================
// Tournament Data Generators
// ============================================================
interface TournamentTeam {
  name: string;
  flag: string;
  quality: number;
  ranking: number;
  style: string;
}

interface GroupMatch {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
}

interface GroupStanding {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  isPlayerTeam: boolean;
}

interface KnockoutMatch {
  id: string;
  round: string;
  home: string | null;
  away: string | null;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  homeIsPlayer: boolean;
  awayIsPlayer: boolean;
}

interface SquadPlayer {
  name: string;
  position: string;
  club: string;
  ovr: number;
  role: 'starter' | 'substitute';
  isPlayer: boolean;
}

interface TournamentHistoryEntry {
  tournament: string;
  year: number;
  result: string;
  resultIcon: string;
  goals: number;
  matches: number;
}

// National teams data
const EURO_TEAMS: TournamentTeam[] = [
  { name: 'France', flag: '🇫🇷', quality: 92, ranking: 2, style: 'Attacking' },
  { name: 'Germany', flag: '🇩🇪', quality: 88, ranking: 4, style: 'Balanced' },
  { name: 'Spain', flag: '🇪🇸', quality: 91, ranking: 3, style: 'Possession' },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', quality: 87, ranking: 5, style: 'Attacking' },
  { name: 'Portugal', flag: '🇵🇹', quality: 89, ranking: 6, style: 'Balanced' },
  { name: 'Italy', flag: '🇮🇹', quality: 86, ranking: 7, style: 'Defensive' },
  { name: 'Netherlands', flag: '🇳🇱', quality: 85, ranking: 8, style: 'Attacking' },
  { name: 'Belgium', flag: '🇧🇪', quality: 84, ranking: 9, style: 'Possession' },
  { name: 'Croatia', flag: '🇭🇷', quality: 82, ranking: 10, style: 'Balanced' },
  { name: 'Switzerland', flag: '🇨🇭', quality: 78, ranking: 14, style: 'Defensive' },
  { name: 'Denmark', flag: '🇩🇰', quality: 77, ranking: 15, style: 'Attacking' },
  { name: 'Austria', flag: '🇦🇹', quality: 75, ranking: 22, style: 'Balanced' },
  { name: 'Turkey', flag: '🇹🇷', quality: 74, ranking: 28, style: 'Attacking' },
  { name: 'Poland', flag: '🇵🇱', quality: 73, ranking: 26, style: 'Defensive' },
  { name: 'Sweden', flag: '🇸🇪', quality: 72, ranking: 23, style: 'Balanced' },
  { name: 'Serbia', flag: '🇷🇸', quality: 71, ranking: 29, style: 'Attacking' },
  { name: 'Ukraine', flag: '🇺🇦', quality: 70, ranking: 24, style: 'Counter-Attack' },
  { name: 'Czech Republic', flag: '🇨🇿', quality: 69, ranking: 31, style: 'Balanced' },
  { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', quality: 68, ranking: 35, style: 'Defensive' },
  { name: 'Hungary', flag: '🇭🇺', quality: 67, ranking: 32, style: 'Counter-Attack' },
  { name: 'Romania', flag: '🇷🇴', quality: 65, ranking: 40, style: 'Defensive' },
  { name: 'Slovakia', flag: '🇸🇰', quality: 64, ranking: 42, style: 'Balanced' },
  { name: 'Slovenia', flag: '🇸🇮', quality: 63, ranking: 52, style: 'Balanced' },
  { name: 'Albania', flag: '🇦🇱', quality: 62, ranking: 56, style: 'Defensive' },
];

const WORLD_CUP_TEAMS: TournamentTeam[] = [
  ...EURO_TEAMS.slice(0, 16),
  { name: 'Brazil', flag: '🇧🇷', quality: 93, ranking: 1, style: 'Attacking' },
  { name: 'Argentina', flag: '🇦🇷', quality: 94, ranking: 1, style: 'Balanced' },
  { name: 'Uruguay', flag: '🇺🇾', quality: 79, ranking: 11, style: 'Counter-Attack' },
  { name: 'Colombia', flag: '🇨🇴', quality: 78, ranking: 12, style: 'Attacking' },
  { name: 'Mexico', flag: '🇲🇽', quality: 76, ranking: 13, style: 'Balanced' },
  { name: 'USA', flag: '🇺🇸', quality: 75, ranking: 16, style: 'Attacking' },
  { name: 'Japan', flag: '🇯🇵', quality: 74, ranking: 18, style: 'Balanced' },
  { name: 'South Korea', flag: '🇰🇷', quality: 72, ranking: 20, style: 'Counter-Attack' },
  { name: 'Australia', flag: '🇦🇺', quality: 68, ranking: 27, style: 'Balanced' },
  { name: 'Morocco', flag: '🇲🇦', quality: 77, ranking: 11, style: 'Defensive' },
  { name: 'Senegal', flag: '🇸🇳', quality: 70, ranking: 17, style: 'Attacking' },
  { name: 'Nigeria', flag: '🇳🇬', quality: 69, ranking: 30, style: 'Attacking' },
  { name: 'Ghana', flag: '🇬🇭', quality: 66, ranking: 50, style: 'Attacking' },
  { name: 'Cameroon', flag: '🇨🇲', quality: 65, ranking: 45, style: 'Balanced' },
  { name: 'Ecuador', flag: '🇪🇨', quality: 67, ranking: 38, style: 'Balanced' },
  { name: 'Saudi Arabia', flag: '🇸🇦', quality: 64, ranking: 53, style: 'Defensive' },
];

// Generate deterministic group matches
function generateGroupMatches(teams: TournamentTeam[], seed: number): GroupMatch[] {
  const matches: GroupMatch[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const matchSeed = seed + hashCode(teams[i].name + teams[j].name);
      const homeGoals = Math.floor(seededRandom(matchSeed) * 4);
      const awayGoals = Math.floor(seededRandom(matchSeed + 1) * 4);
      matches.push({
        home: teams[i].name,
        away: teams[j].name,
        homeScore: homeGoals,
        awayScore: awayGoals,
        played: true,
      });
    }
  }
  return matches;
}

// Generate group standings from matches
function calculateGroupStandings(teams: TournamentTeam[], matches: GroupMatch[], playerNation: string): GroupStanding[] {
  const standings: GroupStanding[] = teams.map(t => ({
    team: t.name,
    flag: t.flag,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    isPlayerTeam: t.name === playerNation,
  }));

  for (const m of matches) {
    if (!m.played) continue;
    const homeEntry = standings.find(s => s.team === m.home);
    const awayEntry = standings.find(s => s.team === m.away);
    if (!homeEntry || !awayEntry) continue;

    homeEntry.played++;
    awayEntry.played++;
    homeEntry.goalsFor += m.homeScore;
    homeEntry.goalsAgainst += m.awayScore;
    awayEntry.goalsFor += m.awayScore;
    awayEntry.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      homeEntry.won++;
      homeEntry.points += 3;
      awayEntry.lost++;
    } else if (m.homeScore === m.awayScore) {
      homeEntry.drawn++;
      awayEntry.drawn++;
      homeEntry.points += 1;
      awayEntry.points += 1;
    } else {
      awayEntry.won++;
      awayEntry.points += 3;
      homeEntry.lost++;
    }
  }

  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

// Generate knockout bracket
function generateKnockoutBracket(
  qualifiedTeams: { name: string; flag: string; quality: number }[],
  playerNation: string,
  seed: number
): KnockoutMatch[] {
  const matches: KnockoutMatch[] = [];
  let currentTeams = [...qualifiedTeams];

  const rounds: { name: string; teamCount: number }[] = [];
  if (currentTeams.length === 16) {
    rounds.push({ name: 'Round of 16', teamCount: 16 });
    rounds.push({ name: 'Quarter-Finals', teamCount: 8 });
    rounds.push({ name: 'Semi-Finals', teamCount: 4 });
    rounds.push({ name: 'Final', teamCount: 2 });
  } else if (currentTeams.length === 8) {
    rounds.push({ name: 'Quarter-Finals', teamCount: 8 });
    rounds.push({ name: 'Semi-Finals', teamCount: 4 });
    rounds.push({ name: 'Final', teamCount: 2 });
  } else {
    rounds.push({ name: 'Semi-Finals', teamCount: 4 });
    rounds.push({ name: 'Final', teamCount: 2 });
  }

  let matchIdx = 0;
  for (const round of rounds) {
    const roundTeamCount = round.teamCount;
    const roundMatchCount = roundTeamCount / 2;

    for (let i = 0; i < roundMatchCount; i++) {
      const homeIdx = i * 2;
      const awayIdx = i * 2 + 1;
      const home = currentTeams[homeIdx] ?? null;
      const away = currentTeams[awayIdx] ?? null;

      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let played = false;

      if (home && away) {
        const matchSeed = seed + matchIdx * 7 + hashCode(home.name + away.name);
        const qualityDiff = home.quality - away.quality;
        const homeExpected = 1.3 + qualityDiff / 30;
        const awayExpected = 1.0 - qualityDiff / 30;
        homeScore = Math.floor(seededRandom(matchSeed) * Math.max(homeExpected, 0.5) * 2);
        awayScore = Math.floor(seededRandom(matchSeed + 1) * Math.max(awayExpected, 0.5) * 2);
        played = true;
      }

      matches.push({
        id: `ko-${round.name}-${i}`,
        round: round.name,
        home: home?.name ?? null,
        away: away?.name ?? null,
        homeFlag: home?.flag ?? '',
        awayFlag: away?.flag ?? '',
        homeScore,
        awayScore,
        played,
        homeIsPlayer: home?.name === playerNation,
        awayIsPlayer: away?.name === playerNation,
      });

      matchIdx++;
    }

    // Determine winners for next round
    const winners: { name: string; flag: string; quality: number }[] = [];
    for (let i = 0; i < roundMatchCount; i++) {
      const match = matches[matches.length - roundMatchCount + i];
      if (match.played && match.homeScore !== null && match.awayScore !== null && match.home && match.away) {
        const homeTeam = qualifiedTeams.find(t => t.name === match.home) ?? { name: match.home, flag: match.homeFlag, quality: 75 };
        const awayTeam = qualifiedTeams.find(t => t.name === match.away) ?? { name: match.away, flag: match.awayFlag, quality: 75 };
        if (match.homeScore > match.awayScore) {
          winners.push(homeTeam);
        } else if (match.awayScore > match.homeScore) {
          winners.push(awayTeam);
        } else {
          // Penalties (deterministic)
          const penSeed = seed + hashCode(match.home + match.away + 'pen');
          winners.push(seededRandom(penSeed) > 0.5 ? homeTeam : awayTeam);
        }
      }
    }
    currentTeams = winners;
  }

  return matches;
}

// Generate national squad
function generateSquad(playerNation: string, playerFlag: string, playerName: string, playerPos: string, seed: number): SquadPlayer[] {
  const positions = ['GK', 'GK', 'GK', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'RB', 'RB',
    'CDM', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'LM', 'RM',
    'LW', 'RW', 'ST', 'ST', 'CF'];

  const firstNames = ['Marco', 'Lucas', 'Rafael', 'Antonio', 'Matteo', 'Julian', 'Felix', 'Leon', 'Oscar', 'Viktor',
    'Erik', 'Thomas', 'Carlos', 'David', 'Paulo', 'Henrik', 'Stefan', 'Nicolas', 'Adrien', 'Yusuf',
    'Alejandro', 'Emil', 'Patrick', 'Roberto', 'James', 'Ryan', 'Daniel', 'Luis', 'Fabian', 'Ivan'];

  const lastNames = ['Silva', 'Müller', 'Garcia', 'Fernandez', 'Rossi', 'Johansson', 'Dubois', 'Kowalski',
    'Torres', 'Peterson', 'Laurent', 'Schmidt', 'Berger', 'Hoffman', 'Andersen', 'Nielsen',
    'Costa', 'Moreno', 'Santos', 'Novak', 'Larsen', 'Berg', 'Eriksen', 'Holm'];

  const clubs = ['Arsenal', 'Chelsea', 'Real Madrid', 'Bayern Munich', 'Barcelona', 'PSG', 'Inter Milan',
    'Juventus', 'Liverpool', 'Man City', 'Dortmund', 'Atletico', 'Tottenham', 'Napoli', 'Roma',
    'Ajax', 'Benfica', 'Porto', 'Villarreal', 'Sevilla'];

  const squad: SquadPlayer[] = [];

  // Insert player in correct position slot
  let playerInserted = false;
  for (let i = 0; i < 23; i++) {
    const pos = positions[i] || 'CM';
    const role = i < 11 ? 'starter' as const : 'substitute' as const;

    if (!playerInserted && pos === playerPos && role === 'starter') {
      squad.push({
        name: playerName,
        position: pos,
        club: 'Current Club',
        ovr: 78 + Math.floor(seededRandom(seed + i * 3) * 15),
        role: 'starter',
        isPlayer: true,
      });
      playerInserted = true;
      continue;
    }

    if (!playerInserted && i === 11) {
      squad.push({
        name: playerName,
        position: playerPos,
        club: 'Current Club',
        ovr: 78 + Math.floor(seededRandom(seed + 99) * 15),
        role: 'substitute',
        isPlayer: true,
      });
      playerInserted = true;
      continue;
    }

    const fn = firstNames[Math.floor(seededRandom(seed + i * 5) * firstNames.length)];
    const ln = lastNames[Math.floor(seededRandom(seed + i * 7 + 1) * lastNames.length)];
    squad.push({
      name: `${fn} ${ln}`,
      position: pos,
      club: clubs[Math.floor(seededRandom(seed + i * 11 + 3) * clubs.length)],
      ovr: 70 + Math.floor(seededRandom(seed + i * 13 + 5) * 20),
      role,
      isPlayer: false,
    });
  }

  if (!playerInserted) {
    squad[22] = {
      name: playerName,
      position: playerPos,
      club: 'Current Club',
      ovr: 80,
      role: 'substitute',
      isPlayer: true,
    };
  }

  return squad;
}

// Generate tournament history
function generateTournamentHistory(caps: number, goals: number, nationName: string): TournamentHistoryEntry[] {
  if (caps < 3) return [];
  const history: TournamentHistoryEntry[] = [];

  const euroYears = [2020, 2024, 2028, 2032];
  const wcYears = [2022, 2026, 2030, 2034];
  const allTournaments: { name: string; year: number }[] = [];

  for (const y of euroYears) allTournaments.push({ name: 'European Championship', year: y });
  for (const y of wcYears) allTournaments.push({ name: 'World Cup', year: y });
  allTournaments.sort((a, b) => a.year - b.year);

  const results = ['Group Stage', 'Quarter-Final', 'Semi-Final', 'Runner-Up', 'Winner'];
  const icons = ['📋', '⚡', '🏅', '🥈', '🏆'];

  const numEntries = Math.min(Math.floor(caps / 5) + (goals > 3 ? 1 : 0), allTournaments.length);
  const startIdx = Math.max(0, allTournaments.length - numEntries);

  for (let i = startIdx; i < allTournaments.length; i++) {
    const t = allTournaments[i];
    const seed = hashCode(nationName + t.year);
    const resultIdx = Math.min(
      Math.floor(seededRandom(seed) * 2 + (caps / 30)),
      results.length - 1
    );
    history.push({
      tournament: t.name,
      year: t.year,
      result: results[resultIdx],
      resultIcon: icons[resultIdx],
      goals: Math.floor(seededRandom(seed + 1) * (goals + 2)),
      matches: 3 + Math.floor(seededRandom(seed + 2) * 5),
    });
  }

  return history;
}

// Generate qualification data
function generateQualificationData(caps: number, nationName: string, season: number) {
  const groupTeams = [
    { name: nationName, flag: '🏴', points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
  ];
  const opponents = ['Wales', 'Georgia', 'Armenia', 'Latvia'];
  const oppFlags = ['🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇬🇪', '🇦🇲', '🇱🇻'];

  for (let i = 0; i < opponents.length; i++) {
    groupTeams.push({ name: opponents[i], flag: oppFlags[i], points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 });
  }

  // Simulate 6 matchdays
  for (let md = 0; md < 6; md++) {
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const seed = hashCode(nationName + md + i + j + season);
        const homeGoals = Math.floor(seededRandom(seed) * 4);
        const awayGoals = Math.floor(seededRandom(seed + 1) * 3);

        groupTeams[i].played++;
        groupTeams[j].played++;
        groupTeams[i].gf += homeGoals;
        groupTeams[i].ga += awayGoals;
        groupTeams[j].gf += awayGoals;
        groupTeams[j].ga += homeGoals;

        if (homeGoals > awayGoals) {
          groupTeams[i].won++;
          groupTeams[i].points += 3;
          groupTeams[j].lost++;
        } else if (homeGoals === awayGoals) {
          groupTeams[i].drawn++;
          groupTeams[j].drawn++;
          groupTeams[i].points += 1;
          groupTeams[j].points += 1;
        } else {
          groupTeams[j].won++;
          groupTeams[j].points += 3;
          groupTeams[i].lost++;
        }
      }
    }
  }

  groupTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    return gdB - gdA;
  });

  const playerTeam = groupTeams[0];
  const totalPossible = 6 * 3;
  const qualProb = Math.min(95, Math.max(20, Math.round((playerTeam.points / totalPossible) * 100 + caps * 0.5)));
  const isQualified = playerTeam.points >= 18 || caps >= 20;

  return { groupTeams, isQualified, qualProb, remainingFixtures: 0 };
}

// ============================================================
// Rating Color Helper
// ============================================================
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-green-400';
  if (rating >= 6.0) return 'text-amber-400';
  return 'text-red-400';
}

// ============================================================
// SVG Trophy Icon
// ============================================================
function TrophyIcon({ color = '#fbbf24', size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M14 8h20v4c0 6-4 10-10 12-6-2-10-6-10-12V8z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
      <path d="M24 24v6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M18 30h12v3H18z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M14 8h-4c0 4 2 6 4 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M34 8h4c0 4-2 6-4 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M20 33h8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M19 36h10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="24" cy="16" r="2" fill={color} fillOpacity={0.5} />
      <path d="M21 13l3 3 3-3" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ============================================================
// SVG Performance Line Chart
// ============================================================
function PerformanceLineChart({ ratings, width = 280, height = 80 }: { ratings: number[]; width?: number; height?: number }) {
  if (ratings.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-[#484f58] h-20">
        Not enough match data
      </div>
    );
  }

  const padding = { top: 10, bottom: 20, left: 24, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minRating = 4;
  const maxRating = 10;
  const range = maxRating - minRating;

  const points = ratings.map((r, i) => ({
    x: padding.left + (i / Math.max(ratings.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((r - minRating) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {/* Grid lines */}
      {[5, 6, 7, 8, 9].map(val => {
        const y = padding.top + chartH - ((val - minRating) / range) * chartH;
        return (
          <g key={val}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#21262d" strokeWidth={0.5} />
            <text x={padding.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize={7}>{val}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#perfGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#34d399" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#0d1117" stroke="#34d399" strokeWidth={1.5} />
      ))}

      <defs>
        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================================
// SVG Mini Pitch Diagram
// ============================================================
function MiniPitchDiagram({ formation = '4-3-3' }: { formation?: string }) {
  const positions: Record<string, { x: number; y: number; label: string }[]> = {
    '4-3-3': [
      { x: 50, y: 90, label: 'GK' },
      { x: 20, y: 72, label: 'LB' }, { x: 40, y: 74, label: 'CB' }, { x: 60, y: 74, label: 'CB' }, { x: 80, y: 72, label: 'RB' },
      { x: 30, y: 52, label: 'CM' }, { x: 50, y: 48, label: 'CDM' }, { x: 70, y: 52, label: 'CM' },
      { x: 22, y: 28, label: 'LW' }, { x: 50, y: 22, label: 'ST' }, { x: 78, y: 28, label: 'RW' },
    ],
    '4-4-2': [
      { x: 50, y: 90, label: 'GK' },
      { x: 20, y: 72, label: 'LB' }, { x: 40, y: 74, label: 'CB' }, { x: 60, y: 74, label: 'CB' }, { x: 80, y: 72, label: 'RB' },
      { x: 18, y: 50, label: 'LM' }, { x: 40, y: 52, label: 'CM' }, { x: 60, y: 52, label: 'CM' }, { x: 82, y: 50, label: 'RM' },
      { x: 38, y: 24, label: 'ST' }, { x: 62, y: 24, label: 'ST' },
    ],
  };

  const pos = positions[formation] || positions['4-3-3'];

  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: 180 }}>
      {/* Pitch background */}
      <rect x="0" y="0" width="100" height="100" rx="2" fill="#1a472a" />
      <rect x="1" y="1" width="98" height="98" rx="1" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />

      {/* Center line */}
      <line x1="1" y1="50" x2="99" y2="50" stroke="#2d6a4f" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="8" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />

      {/* Penalty areas */}
      <rect x="25" y="82" width="50" height="17" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />
      <rect x="35" y="90" width="30" height="9" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />
      <rect x="25" y="1" width="50" height="17" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />
      <rect x="35" y="1" width="30" height="9" fill="none" stroke="#2d6a4f" strokeWidth="0.5" />

      {/* Player dots */}
      {pos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#34d399" fillOpacity={0.8} stroke="#0d1117" strokeWidth="0.5" />
          <text x={p.x} y={p.y + 1} textAnchor="middle" fill="#0d1117" fontSize="3" fontWeight="bold">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG Bracket Visualization
// ============================================================
function TournamentBracketSVG({ matches, playerNation }: { matches: KnockoutMatch[]; playerNation: string }) {
  const rounds = ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'];
  const activeRounds = rounds.filter(r => matches.some(m => m.round === r));
  const roundWidth = 90;
  const matchSpacing = 56;
  const totalWidth = activeRounds.length * roundWidth + (activeRounds.length - 1) * 10;
  const totalHeight = 16 * matchSpacing;

  const roundMatches: Record<string, KnockoutMatch[]> = {};
  for (const m of matches) {
    if (!roundMatches[m.round]) roundMatches[m.round] = [];
    roundMatches[m.round].push(m);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalWidth + 40} ${totalHeight}`} className="w-full" style={{ maxHeight: 500, minWidth: 500 }}>
        <defs>
          <linearGradient id="bracketLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#30363d" />
            <stop offset="100%" stopColor="#30363d" />
          </linearGradient>
        </defs>

        {activeRounds.map((roundName, roundIdx) => {
          const roundMatchData = roundMatches[roundName] ?? [];
          const offsetX = 20 + roundIdx * (roundWidth + 10);
          const numMatches = roundMatchData.length;
          const verticalSpacing = totalHeight / (numMatches + 1);

          return (
            <g key={roundName}>
              {/* Round label */}
              <text x={offsetX + roundWidth / 2} y={14} textAnchor="middle" fill="#8b949e" fontSize={8} fontWeight="600">
                {roundName}
              </text>

              {roundMatchData.map((match, matchIdx) => {
                const y = verticalSpacing * (matchIdx + 1);
                const isPlayerMatch = match.homeIsPlayer || match.awayIsPlayer;
                const borderCol = isPlayerMatch ? '#34d399' : '#30363d';
                const bgCol = isPlayerMatch ? 'rgba(16,185,129,0.08)' : '#161b22';

                const nextRoundName = activeRounds[roundIdx + 1];
                const nextRoundMatches = nextRoundName ? (roundMatches[nextRoundName] ?? []) : [];
                const nextMatchIdx = Math.floor(matchIdx / 2);
                const nextMatch = nextRoundMatches[nextMatchIdx];

                // Draw connection lines to next round
                let lineEl: React.ReactNode = null;
                if (nextMatch && roundIdx < activeRounds.length - 1) {
                  const nextY = (totalHeight / (nextRoundMatches.length + 1)) * (nextMatchIdx + 1);
                  const nextX = 20 + (roundIdx + 1) * (roundWidth + 10);
                  const lineStartX = offsetX + roundWidth;

                  // Determine if this match feeds the home or away slot of the next match
                  const isTopFeed = matchIdx % 2 === 0;

                  // Winner indicator
                  const homeWon = match.played && match.homeScore !== null && match.awayScore !== null
                    ? match.homeScore > match.awayScore : null;
                  const awayWon = match.played && match.homeScore !== null && match.awayScore !== null
                    ? match.awayScore > match.homeScore : null;
                  const winner = homeWon ? match.home : awayWon ? match.away : null;

                  lineEl = (
                    <g key={`line-${match.id}`}>
                      <line
                        x1={lineStartX}
                        y1={y}
                        x2={lineStartX + 5}
                        y2={y}
                        stroke="#30363d"
                        strokeWidth={0.8}
                      />
                      <line
                        x1={lineStartX + 5}
                        y1={isTopFeed ? y : y}
                        x2={lineStartX + 5}
                        y2={nextY}
                        stroke="#30363d"
                        strokeWidth={0.8}
                      />
                      <line
                        x1={lineStartX + 5}
                        y1={nextY}
                        x2={nextX}
                        y2={nextY}
                        stroke="#30363d"
                        strokeWidth={0.8}
                      />
                    </g>
                  );
                }

                return (
                  <g key={match.id}>
                    {lineEl}
                    {/* Match box */}
                    <rect
                      x={offsetX}
                      y={y - 20}
                      width={roundWidth}
                      height={40}
                      rx={4}
                      fill={bgCol}
                      stroke={borderCol}
                      strokeWidth={isPlayerMatch ? 1.5 : 0.8}
                    />
                    {/* Home team */}
                    <text
                      x={offsetX + 6}
                      y={y - 5}
                      fill={match.homeIsPlayer ? '#34d399' : '#c9d1d9'}
                      fontSize={6.5}
                      fontWeight={match.homeIsPlayer ? '700' : '400'}
                    >
                      {match.home || 'TBD'}
                    </text>
                    {match.homeScore !== null && (
                      <text x={offsetX + roundWidth - 12} y={y - 5} textAnchor="end" fill="#c9d1d9" fontSize={7} fontWeight="700">
                        {match.homeScore}
                      </text>
                    )}
                    {/* Away team */}
                    <text
                      x={offsetX + 6}
                      y={y + 10}
                      fill={match.awayIsPlayer ? '#34d399' : '#c9d1d9'}
                      fontSize={6.5}
                      fontWeight={match.awayIsPlayer ? '700' : '400'}
                    >
                      {match.away || 'TBD'}
                    </text>
                    {match.awayScore !== null && (
                      <text x={offsetX + roundWidth - 12} y={y + 10} textAnchor="end" fill="#c9d1d9" fontSize={7} fontWeight="700">
                        {match.awayScore}
                      </text>
                    )}
                    {/* Score separator */}
                    {match.played && match.homeScore !== null && match.awayScore !== null && (
                      <text x={offsetX + roundWidth - 7} y={y + 4} textAnchor="middle" fill="#484f58" fontSize={5}>-</text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG Qualification Probability Meter
// ============================================================
function QualificationMeter({ probability }: { probability: number }) {
  const barWidth = 240;
  const barHeight = 14;
  const fillWidth = Math.max((probability / 100) * barWidth, 4);
  const color = probability >= 75 ? '#34d399' : probability >= 50 ? '#fbbf24' : '#f87171';

  return (
    <svg viewBox={`0 0 ${barWidth + 60} ${barHeight + 30}`} className="w-full" style={{ maxHeight: 50 }}>
      <text x={0} y={8} fill="#8b949e" fontSize={7}>Qualification Probability</text>
      <rect x={0} y={14} width={barWidth} height={barHeight} rx={3} fill="#21262d" stroke="#30363d" strokeWidth={0.5} />
      <rect x={0} y={14} width={fillWidth} height={barHeight} rx={3} fill={color} fillOpacity={0.7} />
      <text x={barWidth + 8} y={25} fill={color} fontSize={9} fontWeight="700">{probability}%</text>
    </svg>
  );
}

// ============================================================
// SVG Timeline for Tournament History
// ============================================================
function TournamentTimeline({ history }: { history: TournamentHistoryEntry[] }) {
  if (history.length === 0) return null;
  const width = 300;
  const height = history.length * 52 + 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 350 }}>
      {/* Vertical timeline line */}
      <line x1="30" y1="15" x2="30" y2={height - 10} stroke="#30363d" strokeWidth={1} />

      {history.map((entry, i) => {
        const y = 20 + i * 52;

        return (
          <g key={i}>
            {/* Timeline dot */}
            <circle cx="30" cy={y + 10} r="5" fill="#21262d" stroke="#30363d" strokeWidth={1} />
            <text x="30" y={y + 13} textAnchor="middle" fill="#c9d1d9" fontSize={6}>{entry.resultIcon}</text>

            {/* Content */}
            <text x="44" y={y + 6} fill="#c9d1d9" fontSize={8} fontWeight="600">{entry.tournament}</text>
            <text x="44" y={y + 16} fill="#8b949e" fontSize={7}>{entry.year} — {entry.result}</text>
            <text x="44" y={y + 26} fill="#484f58" fontSize={6.5}>{entry.matches} matches, {entry.goals} goals</text>

            {/* Connector */}
            <line x1="35" y1={y + 10} x2="42" y2={y + 10} stroke="#30363d" strokeWidth={0.5} />
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG Donut Chart for Team Overall Rating
// ============================================================
function TeamDonutChart({ rating, size = 80 }: { rating: number; size?: number }) {
  const radius = 32;
  const stroke = 6;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = Math.min(rating / 100, 1);
  const dashArray = `${fillPercent * circumference} ${circumference}`;
  const color = rating >= 85 ? '#34d399' : rating >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#21262d" strokeWidth={stroke} />
      <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={dashArray} strokeDashoffset={0} strokeLinecap="round" />
      <text x={center} y={center - 4} textAnchor="middle" fill={color} fontSize={18} fontWeight="700">{rating}</text>
      <text x={center} y={center + 10} textAnchor="middle" fill="#8b949e" fontSize={7}>OVR</text>
    </svg>
  );
}

// ============================================================
// SVG Points Progression Line Chart
// ============================================================
function PointsProgressionChart({ pointsPerDay, width = 280, height = 90 }: { pointsPerDay: number[]; width?: number; height?: number }) {
  if (pointsPerDay.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-[#484f58] h-[90px]">
        Not enough matchday data
      </div>
    );
  }

  const padding = { top: 14, bottom: 20, left: 28, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...pointsPerDay, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const pts = pointsPerDay.map((v, i) => ({
    x: padding.left + (i / Math.max(pointsPerDay.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${padding.top + chartH} L${pts[0].x},${padding.top + chartH} Z`;

  const gridValues = Array.from({ length: 4 }, (_, i) => Math.round(minVal + (range / 3) * i));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {gridValues.map(val => {
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return (
          <g key={val}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#21262d" strokeWidth={0.5} />
            <text x={padding.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize={7}>{val}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="#34d399" fillOpacity={0.12} />
      <path d={linePath} fill="none" stroke="#34d399" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} fill="#0d1117" stroke="#34d399" strokeWidth={1.5} />
          <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#8b949e" fontSize={6}>{pointsPerDay[i]}</text>
        </g>
      ))}
      {/* Matchday labels */}
      {pts.map((p, i) => (
        <text key={`md-${i}`} x={p.x} y={height - 4} textAnchor="middle" fill="#484f58" fontSize={6}>MD{i + 1}</text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG Goal Difference Trend Chart
// ============================================================
function GdTrendChart({ gdPerDay, width = 280, height = 80 }: { gdPerDay: number[]; width?: number; height?: number }) {
  if (gdPerDay.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-[#484f58] h-20">
        Not enough matchday data
      </div>
    );
  }

  const padding = { top: 10, bottom: 20, left: 28, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...gdPerDay, 0) + 1;
  const minVal = Math.min(...gdPerDay, 0) - 1;
  const range = maxVal - minVal || 1;

  const pts = gdPerDay.map((v, i) => ({
    x: padding.left + (i / Math.max(gdPerDay.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const zeroY = padding.top + chartH - ((0 - minVal) / range) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {/* Zero line */}
      <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="#30363d" strokeWidth={0.8} strokeDasharray="3,2" />
      <text x={padding.left - 4} y={zeroY + 3} textAnchor="end" fill="#8b949e" fontSize={6}>0</text>
      <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} fill="#0d1117" stroke={gdPerDay[i] >= 0 ? '#34d399' : '#ef4444'} strokeWidth={1.5} />
          <text x={p.x} y={p.y - 5} textAnchor="middle" fill={gdPerDay[i] >= 0 ? '#34d399' : '#ef4444'} fontSize={6}>{gdPerDay[i] > 0 ? `+${gdPerDay[i]}` : gdPerDay[i]}</text>
        </g>
      ))}
      {pts.map((p, i) => (
        <text key={`md-${i}`} x={p.x} y={height - 4} textAnchor="middle" fill="#484f58" fontSize={6}>MD{i + 1}</text>
      ))}
    </svg>
  );
}

// ============================================================
// Sub-section components
// ============================================================

// 1. Tournament Selection (~80 lines)
function TournamentSelection({ playerNation, currentSeason }: { playerNation: string; currentSeason: number }) {
  const baseYear = 2024;
  const euroYear = baseYear + (Math.floor((currentSeason - 1) / 4)) * 4;
  const wcYear = 2026 + (Math.floor((currentSeason - 1) / 4)) * 4;

  const tournaments = [
    {
      name: 'European Championship',
      shortName: 'EURO',
      year: euroYear,
      hostNations: 'Germany',
      teamCount: 24,
      qualified: true,
      color: '#34d399',
    },
    {
      name: 'World Cup',
      shortName: 'WC',
      year: wcYear,
      hostNations: 'USA, Canada, Mexico',
      teamCount: 32,
      qualified: currentSeason >= 3,
      color: '#fbbf24',
    },
  ];

  return (
    <div className="space-y-3">
      {tournaments.map(t => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <TrophyIcon color={t.color} size={40} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#c9d1d9]">{t.shortName} {t.year}</h3>
                <Badge className={`${t.qualified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'} border-0 text-[10px]`}>
                  {t.qualified ? 'Qualified' : 'Not Qualified'}
                </Badge>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">{t.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-[#484f58] flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {t.hostNations}
                </span>
                <span className="text-[10px] text-[#484f58] flex items-center gap-1">
                  <Users className="h-3 w-3" /> {t.teamCount} teams
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#484f58] flex-shrink-0" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 3. Group Stage Table (~100 lines)
function GroupStageTable({
  teamNames,
  groupLetter,
  playerNation,
  seed,
}: {
  teamNames: TournamentTeam[];
  groupLetter: string;
  playerNation: string;
  seed: number;
}) {
  const matches = generateGroupMatches(teamNames, seed);
  const standings = calculateGroupStandings(teamNames, matches, playerNation);

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-3 overflow-x-auto">
      <h4 className="text-xs font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
        <span className="text-emerald-400 font-bold">Group {groupLetter}</span>
      </h4>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-[#484f58]">
            <th className="text-left py-1 px-1">#</th>
            <th className="text-left py-1 px-1">Team</th>
            <th className="text-center py-1 px-0.5">P</th>
            <th className="text-center py-1 px-0.5">W</th>
            <th className="text-center py-1 px-0.5">D</th>
            <th className="text-center py-1 px-0.5">L</th>
            <th className="text-center py-1 px-0.5">GF</th>
            <th className="text-center py-1 px-0.5">GA</th>
            <th className="text-center py-1 px-0.5">GD</th>
            <th className="text-center py-1 px-0.5">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const gd = s.goalsFor - s.goalsAgainst;
            const isQualified = idx < 2;
            return (
              <tr
                key={s.team}
                className={`border-t border-[#21262d] ${s.isPlayerTeam ? 'bg-emerald-500/5' : ''}`}
              >
                <td className="py-1.5 px-1 text-[#484f58]">
                  {isQualified && <span className="text-emerald-400">&#9650;</span>}
                  {!isQualified && <span className="text-[#30363d]">&#9650;</span>}
                </td>
                <td className={`py-1.5 px-1 font-medium ${s.isPlayerTeam ? 'text-emerald-400' : TEXT_PRIMARY}`}>
                  <span className="mr-1">{s.flag}</span>
                  {s.team.length > 12 ? s.team.slice(0, 12) + '...' : s.team}
                </td>
                <td className="text-center py-1.5 px-0.5 text-[#8b949e]">{s.played}</td>
                <td className="text-center py-1.5 px-0.5 text-emerald-400">{s.won}</td>
                <td className="text-center py-1.5 px-0.5 text-amber-400">{s.drawn}</td>
                <td className="text-center py-1.5 px-0.5 text-red-400">{s.lost}</td>
                <td className="text-center py-1.5 px-0.5 text-[#8b949e]">{s.goalsFor}</td>
                <td className="text-center py-1.5 px-0.5 text-[#8b949e]">{s.goalsAgainst}</td>
                <td className="text-center py-1.5 px-0.5">{gd > 0 ? <span className="text-emerald-400">+{gd}</span> : gd === 0 ? <span className="text-[#8b949e]">0</span> : <span className="text-red-400">{gd}</span>}</td>
                <td className="text-center py-1.5 px-0.5 font-bold text-[#c9d1d9]">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-2 text-[9px] text-[#484f58]">
        <span className="flex items-center gap-1"><span className="text-emerald-400">&#9650;</span> Qualify for knockout stage</span>
      </div>
    </div>
  );
}

// 4. Player Tournament Stats (~100 lines)
function PlayerTournamentStats({ caps, goals, assists }: { caps: number; goals: number; assists: number }) {
  const avgRating = caps > 0 ? +(5.5 + (caps * 0.03) + (goals * 0.1)).toFixed(1) : 0;
  const minutes = caps * 75;
  const motm = Math.floor(goals * 0.4 + assists * 0.2);

  // Generate deterministic ratings per appearance
  const ratings = useMemo(() => {
    if (caps === 0) return [];
    const r: number[] = [];
    for (let i = 0; i < Math.min(caps, 10); i++) {
      const base = 5.5 + (caps * 0.03) + (goals * 0.1);
      r.push(+(base + (seededRandom(i * 7 + 42) - 0.5) * 2.5).toFixed(1));
    }
    return r;
  }, [caps, goals]);

  const stats = [
    { label: 'Appearances', value: caps, icon: <Users className="h-4 w-4" />, color: '#c9d1d9' },
    { label: 'Goals', value: goals, icon: <Target className="h-4 w-4" />, color: '#34d399' },
    { label: 'Assists', value: assists, icon: <TrendingUp className="h-4 w-4" />, color: '#22d3ee' },
    { label: 'Minutes', value: minutes, icon: <Clock className="h-4 w-4" />, color: '#fbbf24' },
  ];

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#8b949e]" />
        Tournament Statistics
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-[#21262d] rounded-lg p-3 border border-[#21262d]">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: s.color }}>{s.icon}</span>
              <span className="text-[10px] text-[#8b949e]">{s.label}</span>
            </div>
            <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#21262d] rounded-lg p-3 border border-[#21262d]">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] text-[#8b949e]">Average Rating</span>
          </div>
          <span className={`text-lg font-bold ${avgRating > 0 ? getRatingColor(avgRating) : 'text-[#484f58]'}`}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3 border border-[#21262d]">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-[10px] text-[#8b949e]">Man of the Match</span>
          </div>
          <span className="text-lg font-bold text-orange-400">{motm}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#30363d]">
        <span className="text-[10px] text-[#484f58] block mb-1">Match Ratings</span>
        <PerformanceLineChart ratings={ratings} />
      </div>
    </div>
  );
}

// 5. Squad Announcement (~80 lines)
function SquadAnnouncement({ squad }: { squad: SquadPlayer[] }) {
  const starters = squad.filter(p => p.role === 'starter');
  const substitutes = squad.filter(p => p.role === 'substitute');

  const renderPlayerRow = (p: SquadPlayer) => (
    <div
      key={p.name}
      className={`flex items-center gap-2 px-3 py-2 ${p.isPlayer ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-lg' : ''}`}
    >
      {p.isPlayer && <Star className="h-3 w-3 text-amber-400 flex-shrink-0" />}
      {!p.isPlayer && <div className="w-3 flex-shrink-0" />}
      <Badge className={`${p.role === 'starter' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-[#8b949e]'} border-0 text-[9px] px-1.5 h-4 flex-shrink-0`}>
        {p.position}
      </Badge>
      <span className={`text-xs font-medium flex-1 truncate ${p.isPlayer ? 'text-emerald-400' : TEXT_PRIMARY}`}>
        {p.name}
      </span>
      <span className="text-[10px] text-[#484f58] truncate max-w-[70px]">{p.club}</span>
      <span className={`text-xs font-bold flex-shrink-0 ${p.ovr >= 85 ? 'text-emerald-400' : p.ovr >= 78 ? 'text-amber-400' : TEXT_SECONDARY}`}>
        {p.ovr}
      </span>
    </div>
  );

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
        <Users className="h-4 w-4 text-[#8b949e]" />
        Squad Announcement
        <Badge className="ml-auto bg-[#21262d] text-[#8b949e] border-0 text-[10px]">23 Players</Badge>
      </h3>

      <div>
        <div className="flex items-center gap-2 mb-1 px-3">
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Starters (11)</span>
        </div>
        <div className="space-y-0.5">
          {starters.map(renderPlayerRow)}
        </div>
      </div>

      <div className="border-t border-[#30363d] pt-3">
        <div className="flex items-center gap-2 mb-1 px-3">
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide">Substitutes (12)</span>
        </div>
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          {substitutes.map(renderPlayerRow)}
        </div>
      </div>
    </div>
  );
}

// 6. Tournament History (~100 lines)
function TournamentHistory({ history }: { history: TournamentHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 text-center">
        <Trophy className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
        <p className="text-sm text-[#484f58]">No tournament history yet</p>
        <p className="text-[10px] text-[#30363d] mt-1">Qualify for international tournaments to see your history</p>
      </div>
    );
  }

  const bestResult = history.reduce((best, h) => {
    const order = ['Group Stage', 'Quarter-Final', 'Semi-Final', 'Runner-Up', 'Winner'];
    return order.indexOf(h.result) > order.indexOf(best.result) ? h : best;
  }, history[0]);

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Medal className="h-4 w-4 text-amber-400" />
          Tournament History
        </h3>
        <Badge className={`${bestResult.result === 'Winner' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-[#21262d] text-[#8b949e]'} border-0 text-[10px]`}>
          Best: {bestResult.result}
        </Badge>
      </div>

      <TournamentTimeline history={history} />

      {/* Grid summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#21262d] rounded-lg p-2.5">
          <span className="text-[10px] text-[#484f58] block">Tournaments</span>
          <span className="text-sm font-bold text-[#c9d1d9]">{history.length}</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-2.5">
          <span className="text-[10px] text-[#484f58] block">Total Goals</span>
          <span className="text-sm font-bold text-emerald-400">{history.reduce((sum, h) => sum + h.goals, 0)}</span>
        </div>
      </div>
    </div>
  );
}

// 7. Match Center (~120 lines)
function MatchCenter({ playerNation, playerFlag, seed }: { playerNation: string; playerFlag: string; seed: number }) {
  const opponentSeed = hashCode(playerNation + 'opponent');
  const opponentIdx = Math.abs(opponentSeed) % WORLD_CUP_TEAMS.length;
  const opponent = WORLD_CUP_TEAMS[opponentIdx];
  const filtered = WORLD_CUP_TEAMS.filter(t => t.name !== playerNation && t.name !== opponent.name);
  const opponent2 = filtered[Math.abs(hashCode(playerNation + 'opp2')) % filtered.length];

  const homeScore = Math.floor(seededRandom(seed + 100) * 3);
  const awayScore = Math.floor(seededRandom(seed + 101) * 3);
  const isHome = seededRandom(seed + 102) > 0.5;

  const home = isHome ? { name: playerNation, flag: playerFlag } : { name: opponent.name, flag: opponent.flag };
  const away = isHome ? { name: opponent.name, flag: opponent.flag } : { name: playerNation, flag: playerFlag };

  const venues = ['Olympiastadion, Berlin', 'Stade de France, Paris', 'Wembley, London', 'Santiago Bernabeu, Madrid', 'Lusail Stadium, Doha'];
  const venue = venues[Math.abs(hashCode(playerNation + 'venue')) % venues.length];

  const weathers = [
    { name: 'Clear Skies', icon: <Sun className="h-3 w-3" />, color: 'text-amber-400' },
    { name: 'Light Cloud', icon: <Cloud className="h-3 w-3" />, color: 'text-[#8b949e]' },
    { name: 'Windy', icon: <Wind className="h-3 w-3" />, color: 'text-cyan-400' },
  ];
  const weather = weathers[Math.abs(hashCode(playerNation + seed + 'weather')) % weathers.length];

  const stages = ['Group Stage - Matchday 2', 'Quarter-Final', 'Semi-Final'];
  const stage = stages[Math.min(Math.floor(seededRandom(seed + 200) * stages.length), stages.length - 1)];

  const formations = ['4-3-3', '4-4-2'];
  const formation = formations[Math.abs(hashCode(playerNation + 'form')) % formations.length];

  const tacticalNotes = [
    'High pressing from the first whistle expected to disrupt build-up play',
    'Counter-attacking approach with quick transitions through midfield',
    'Possession-based game plan focused on controlling the tempo',
    'Defensive solidity with compact midfield, looking to exploit set pieces',
  ];
  const tacticalNote = tacticalNotes[Math.abs(hashCode(playerNation + seed + 'tact')) % tacticalNotes.length];

  const lineup = generateSquad(playerNation, playerFlag, 'You', 'ST', seed);
  const startingXi = lineup.filter(p => p.role === 'starter').slice(0, 11);

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
        <Swords className="h-4 w-4 text-[#8b949e]" />
        Match Center
      </h3>

      {/* Score header */}
      <div className="bg-[#21262d] rounded-lg p-4 text-center">
        <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px] mb-3">{stage}</Badge>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{home.flag}</span>
            <span className={`text-sm font-semibold ${home.name === playerNation ? 'text-emerald-400' : TEXT_PRIMARY}`}>
              {home.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-[#c9d1d9]">{homeScore}</span>
            <span className="text-xs text-[#484f58]">-</span>
            <span className="text-2xl font-bold text-[#c9d1d9]">{awayScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${away.name === playerNation ? 'text-emerald-400' : TEXT_PRIMARY}`}>
              {away.name}
            </span>
            <span className="text-xl">{away.flag}</span>
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#21262d] rounded-lg p-2">
          <MapPin className="h-3 w-3 text-[#484f58] mx-auto mb-1" />
          <span className="text-[9px] text-[#484f58] block">{venue}</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-2">
          <div className={`${weather.color} flex justify-center mb-1`}>{weather.icon}</div>
          <span className="text-[9px] text-[#484f58] block">{weather.name}</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-2">
          <Shield className="h-3 w-3 text-[#484f58] mx-auto mb-1" />
          <span className="text-[9px] text-[#484f58] block">{formation}</span>
        </div>
      </div>

      {/* Pitch diagram */}
      <MiniPitchDiagram formation={formation} />

      {/* Starting XI */}
      <div className="pt-2 border-t border-[#30363d]">
        <span className="text-[10px] text-[#484f58] block mb-1.5">Starting XI</span>
        <div className="grid grid-cols-2 gap-1">
          {startingXi.map(p => (
            <div key={p.name} className={`text-[10px] px-2 py-1 rounded ${p.isPlayer ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#21262d] text-[#8b949e]'}`}>
              <span className="font-medium">{p.position}</span> {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Tactical note */}
      <div className="bg-[#21262d] rounded-lg p-3 border-l-2 border-emerald-500/30">
        <div className="flex items-center gap-1 mb-1">
          <Zap className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] font-semibold text-[#c9d1d9]">Tactical Note</span>
        </div>
        <p className="text-[10px] text-[#8b949e] leading-relaxed">{tacticalNote}</p>
      </div>
    </div>
  );
}

// 8. National Team Profile (~80 lines)
function NationalTeamProfile({ nationName, nationFlag, caps, goals }: { nationName: string; nationFlag: string; caps: number; goals: number }) {
  const ranking = getFifaRanking(nationName);
  const style = getTeamStyle(nationName);
  const quality = getTeamQuality(nationName);

  const keyPlayers = useMemo(() => {
    const names = ['Marcus Fernandez', 'Lukas Weber', 'Antonio Rossi', 'Julian Dubois', 'Erik Johansson'];
    return names.slice(0, 4).map((name, i) => ({
      name,
      position: ['ST', 'CM', 'CB', 'GK', 'LW'][i],
      rating: 78 + Math.floor(seededRandom(hashCode(nationName + name)) * 15),
    }));
  }, [nationName]);

  const historicalResults = ['Winner (2004)', 'Semi-Final (2016)', 'Quarter-Final (2020)'];
  const historicalIdx = Math.abs(hashCode(nationName + 'hist')) % historicalResults.length;

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{nationFlag}</span>
        <div>
          <h3 className="text-base font-bold text-[#c9d1d9]">{nationName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px] flex items-center gap-1">
              <Medal className="h-3 w-3" /> #{ranking}
            </Badge>
            <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">{style}</Badge>
          </div>
        </div>
      </div>

      {/* Team quality bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#484f58]">Team Quality</span>
          <span className="text-[10px] font-bold text-[#c9d1d9]">{quality}/100</span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <div className="h-full rounded-sm" style={{ width: `${quality}%`, backgroundColor: quality >= 85 ? '#34d399' : quality >= 70 ? '#fbbf24' : '#f87171' }} />
        </div>
      </div>

      {/* Key players */}
      <div>
        <span className="text-[10px] text-[#484f58] block mb-1.5">Key Players</span>
        <div className="space-y-1">
          {keyPlayers.map(p => (
            <div key={p.name} className="flex items-center justify-between bg-[#21262d] rounded px-3 py-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#30363d] text-[#8b949e] border-0 text-[9px] px-1.5 h-4">{p.position}</Badge>
                <span className="text-xs text-[#c9d1d9]">{p.name}</span>
              </div>
              <span className={`text-xs font-bold ${p.rating >= 88 ? 'text-emerald-400' : p.rating >= 82 ? 'text-amber-400' : TEXT_SECONDARY}`}>{p.rating}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical record */}
      <div className="bg-[#21262d] rounded-lg p-2.5">
        <span className="text-[10px] text-[#484f58] block">Best Tournament Result</span>
        <span className="text-xs font-semibold text-amber-400 mt-0.5 block">{historicalResults[historicalIdx]}</span>
      </div>
    </div>
  );
}

// 9. Road to Qualification (~80 lines)
function RoadToQualification({ caps, nationName, season }: { caps: number; nationName: string; season: number }) {
  const data = generateQualificationData(caps, nationName, season);

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
        <Flag className="h-4 w-4 text-emerald-400" />
        Road to Qualification
        <Badge className={`ml-auto ${data.isQualified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'} border-0 text-[10px]`}>
          {data.isQualified ? 'Qualified' : 'In Progress'}
        </Badge>
      </h3>

      <QualificationMeter probability={data.qualProb} />

      {/* Qualifying Group Table */}
      <div>
        <span className="text-[10px] text-[#484f58] block mb-1.5">Qualifying Group Standings</span>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-[#484f58]">
                <th className="text-left py-1 px-1">#</th>
                <th className="text-left py-1 px-1">Team</th>
                <th className="text-center py-1 px-0.5">P</th>
                <th className="text-center py-1 px-0.5">W</th>
                <th className="text-center py-1 px-0.5">D</th>
                <th className="text-center py-1 px-0.5">L</th>
                <th className="text-center py-1 px-0.5">GD</th>
                <th className="text-center py-1 px-0.5">Pts</th>
              </tr>
            </thead>
            <tbody>
              {data.groupTeams.map((t, idx) => {
                const gd = t.gf - t.ga;
                const isPlayer = idx === 0;
                return (
                  <tr key={t.name} className={`border-t border-[#21262d] ${isPlayer ? 'bg-emerald-500/5' : ''}`}>
                    <td className="py-1 px-1 text-[#484f58]">
                      {idx < 2 ? <span className="text-emerald-400">&#9650;</span> : <span className="text-[#30363d]">&#9650;</span>}
                    </td>
                    <td className={`py-1 px-1 ${isPlayer ? 'text-emerald-400 font-semibold' : TEXT_PRIMARY}`}>{t.flag} {t.name}</td>
                    <td className="text-center py-1 px-0.5 text-[#8b949e]">{t.played}</td>
                    <td className="text-center py-1 px-0.5 text-emerald-400">{t.won}</td>
                    <td className="text-center py-1 px-0.5 text-amber-400">{t.drawn}</td>
                    <td className="text-center py-1 px-0.5 text-red-400">{t.lost}</td>
                    <td className="text-center py-1 px-0.5">{gd > 0 ? <span className="text-emerald-400">+{gd}</span> : <span className="text-red-400">{gd}</span>}</td>
                    <td className="text-center py-1 px-0.5 font-bold text-[#c9d1d9]">{t.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points needed */}
      <div className="bg-[#21262d] rounded-lg p-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#484f58] block">Points Earned</span>
            <span className="text-sm font-bold text-emerald-400">{data.groupTeams[0]?.points ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#484f58] block">Max Possible</span>
            <span className="text-sm font-bold text-[#8b949e]">{(data.groupTeams[0]?.played ?? 0) * 3}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#484f58] block">Matches Left</span>
            <span className="text-sm font-bold text-[#8b949e]">{data.remainingFixtures}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 10. Squad Depth Chart (~200 lines)
// ============================================================
interface DepthSquadPlayer extends SquadPlayer {
  caps: number;
  fitness: number;
}

function SquadDepthChart({ squad, seed }: { squad: SquadPlayer[]; seed: number }) {
  const enrichedSquad: DepthSquadPlayer[] = useMemo(() => {
    return squad.map((p, i) => ({
      ...p,
      caps: p.role === 'starter' ? 15 + Math.floor(seededRandom(seed + i * 3) * 60) : Math.floor(seededRandom(seed + i * 7) * 30),
      fitness: 60 + Math.floor(seededRandom(seed + i * 11) * 40),
    }));
  }, [squad, seed]);

  const gkPlayers = enrichedSquad.filter(p => p.position === 'GK');
  const defPlayers = enrichedSquad.filter(p => ['CB', 'LB', 'RB'].includes(p.position));
  const midPlayers = enrichedSquad.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
  const fwdPlayers = enrichedSquad.filter(p => ['LW', 'RW', 'ST', 'CF'].includes(p.position));

  const starters = enrichedSquad.filter(p => p.role === 'starter');
  const substitutes = enrichedSquad.filter(p => p.role === 'substitute');
  const teamAvg = starters.length > 0 ? Math.round(starters.reduce((s, p) => s + p.ovr, 0) / starters.length) : 0;

  const positionGroups = [
    { label: 'GK', icon: <Lock className="h-3 w-3" />, players: gkPlayers, color: '#f59e0b' },
    { label: 'DEF', icon: <Shield className="h-3 w-3" />, players: defPlayers, color: '#34d399' },
    { label: 'MID', icon: <Activity className="h-3 w-3" />, players: midPlayers, color: '#22d3ee' },
    { label: 'FWD', icon: <Target className="h-3 w-3" />, players: fwdPlayers, color: '#ef4444' },
  ];

  const getFormationCompatibility = (): { formation: string; score: number } => {
    const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];
    const formationsCount: Record<string, number> = { '4-3-3': 0, '4-4-2': 0, '3-5-2': 0, '4-2-3-1': 0 };
    formationsCount['4-3-3'] = defPlayers.length >= 4 && fwdPlayers.length >= 3 && midPlayers.length >= 3 ? 3 : 1;
    formationsCount['4-4-2'] = defPlayers.length >= 4 && midPlayers.length >= 4 && fwdPlayers.length >= 2 ? 3 : 1;
    formationsCount['3-5-2'] = defPlayers.length >= 3 && midPlayers.length >= 5 && fwdPlayers.length >= 2 ? 3 : 0;
    formationsCount['4-2-3-1'] = defPlayers.length >= 4 && midPlayers.length >= 5 && fwdPlayers.length >= 1 ? 3 : 1;
    const best = Object.entries(formationsCount).sort((a, b) => b[1] - a[1])[0];
    return { formation: best[0], score: Math.min(best[1] / 3 * 100, 100) };
  };

  const compat = getFormationCompatibility();

  const renderPlayerRow = (p: DepthSquadPlayer) => (
    <div
      key={p.name + p.position}
      className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] ${p.isPlayer ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-lg' : ''}`}
    >
      {p.isPlayer && <Star className="h-2.5 w-2.5 text-amber-400 flex-shrink-0" />}
      {!p.isPlayer && <div className="w-2.5 flex-shrink-0" />}
      <Badge className={`${p.role === 'starter' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-[#8b949e]'} border-0 text-[8px] px-1 h-4 flex-shrink-0`}>
        {p.position}
      </Badge>
      <span className={`font-medium flex-1 truncate ${p.isPlayer ? 'text-emerald-400' : TEXT_PRIMARY}`}>
        {p.name}
      </span>
      <span className="text-[#484f58] truncate max-w-[55px] hidden sm:inline">{p.club}</span>
      <span className="text-[#484f58] w-6 text-center">{p.caps}</span>
      <span className={`font-bold w-5 text-center flex-shrink-0 ${p.ovr >= 85 ? 'text-emerald-400' : p.ovr >= 78 ? 'text-amber-400' : TEXT_SECONDARY}`}>
        {p.ovr}
      </span>
      <div className="w-10 h-1.5 bg-[#21262d] rounded-sm overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-sm"
          style={{
            width: `${p.fitness}%`,
            backgroundColor: p.fitness >= 85 ? '#34d399' : p.fitness >= 65 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Users className="h-4 w-4 text-[#8b949e]" />
          Squad Depth Chart
        </h3>
        <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[10px]">{squad.length} Players</Badge>
      </div>

      {/* Team OVR donut + summary */}
      <div className="flex items-center gap-4">
        <TeamDonutChart rating={teamAvg} size={76} />
        <div className="flex-1 space-y-1.5">
          <div className="text-[10px] text-[#484f58]">Starting XI Average</div>
          <div className="text-xs font-semibold text-[#c9d1d9]">{teamAvg} OVR</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#484f58]">Best Fit:</span>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">{compat.formation}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#484f58]">Compatibility:</span>
            <span className={`text-[10px] font-bold ${compat.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round(compat.score)}%</span>
          </div>
        </div>
      </div>

      {/* Position column headers */}
      <div className="flex items-center gap-1.5 px-2 text-[8px] text-[#484f58] uppercase tracking-wide">
        <div className="w-2.5" /><div className="w-7" />Pos<div className="flex-1" /><div className="w-[55px] hidden sm:block" />Caps<div className="w-5 text-center" />OVR<div className="w-10 text-center">Fit</div>
      </div>

      {/* Position groups */}
      {positionGroups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-1.5 mb-1 px-2">
            <span style={{ color: group.color }}>{group.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: group.color }}>
              {group.label} ({group.players.length})
            </span>
          </div>
          <div className="space-y-0.5">
            {group.players.map(renderPlayerRow)}
          </div>
        </div>
      ))}

      {/* Role legend */}
      <div className="border-t border-[#30363d] pt-2 flex items-center gap-3 text-[9px] text-[#484f58]">
        <span className="flex items-center gap-1"><Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[8px] px-1 h-3">XI</Badge> Starting</span>
        <span className="flex items-center gap-1"><Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[8px] px-1 h-3">SUB</Badge> Substitute</span>
        <span className="flex items-center gap-1"><Star className="h-2.5 w-2.5 text-amber-400" /> You</span>
      </div>
    </div>
  );
}

// ============================================================
// 11. Group Stage Analysis (~200 lines)
// ============================================================
function GroupAnalysis({
  teams,
  playerNation,
  seed,
  groupLetter,
}: {
  teams: TournamentTeam[];
  playerNation: string;
  seed: number;
  groupLetter: string;
}) {
  const matches = generateGroupMatches(teams, seed);
  const standings = calculateGroupStandings(teams, matches, playerNation);

  // Generate points progression per matchday
  const pointsProgression = useMemo(() => {
    const playerStanding = standings.find(s => s.isPlayerTeam);
    if (!playerStanding) return [0];

    // Simulate matchday-by-matchday accumulation
    const playerMatches = matches.filter(m => m.home === playerNation || m.away === playerNation);
    const pts: number[] = [0];
    for (const m of playerMatches) {
      const prev = pts[pts.length - 1] ?? 0;
      if (m.home === playerNation) {
        if (m.homeScore > m.awayScore) pts.push(prev + 3);
        else if (m.homeScore === m.awayScore) pts.push(prev + 1);
        else pts.push(prev);
      } else {
        if (m.awayScore > m.homeScore) pts.push(prev + 3);
        else if (m.awayScore === m.homeScore) pts.push(prev + 1);
        else pts.push(prev);
      }
    }
    return pts;
  }, [standings, matches, playerNation]);

  // GD trend per matchday
  const gdProgression = useMemo(() => {
    const playerMatches = matches.filter(m => m.home === playerNation || m.away === playerNation);
    const gd: number[] = [0];
    for (const m of playerMatches) {
      const prev = gd[gd.length - 1] ?? 0;
      if (m.home === playerNation) {
        gd.push(prev + m.homeScore - m.awayScore);
      } else {
        gd.push(prev + m.awayScore - m.homeScore);
      }
    }
    return gd;
  }, [matches, playerNation]);

  // Head-to-head against each opponent
  const h2hRecords = useMemo(() => {
    const opponents = teams.filter(t => t.name !== playerNation);
    return opponents.map(opp => {
      const h2hMatches = matches.filter(m =>
        (m.home === playerNation && m.away === opp.name) || (m.home === opp.name && m.away === playerNation)
      );
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let gf = 0;
      let ga = 0;
      for (const m of h2hMatches) {
        const isHome = m.home === playerNation;
        const myGoals = isHome ? m.homeScore : m.awayScore;
        const theirGoals = isHome ? m.awayScore : m.homeScore;
        gf += myGoals;
        ga += theirGoals;
        if (myGoals > theirGoals) wins++;
        else if (myGoals === theirGoals) draws++;
        else losses++;
      }
      return { name: opp.name, flag: opp.flag, wins, draws, losses, gf, ga };
    });
  }, [teams, matches, playerNation]);

  // Strength of schedule
  const avgOpponentRating = teams
    .filter(t => t.name !== playerNation)
    .reduce((s, t) => s + t.quality, 0) / Math.max(teams.filter(t => t.name !== playerNation).length, 1);

  const qualificationZone = (idx: number): string => {
    if (idx < 1) return 'qualified';
    if (idx === 1) return 'playoff';
    return 'eliminated';
  };

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#8b949e]" />
        Group {groupLetter} Analysis
      </h3>

      {/* Standings with zone color coding */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-[#484f58]">
              <th className="text-left py-1 px-1">#</th>
              <th className="text-left py-1 px-1">Team</th>
              <th className="text-center py-1 px-0.5">P</th>
              <th className="text-center py-1 px-0.5">W</th>
              <th className="text-center py-1 px-0.5">D</th>
              <th className="text-center py-1 px-0.5">L</th>
              <th className="text-center py-1 px-0.5">GD</th>
              <th className="text-center py-1 px-0.5">Pts</th>
              <th className="text-center py-1 px-0.5">Zone</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const gd = s.goalsFor - s.goalsAgainst;
              const zone = qualificationZone(idx);
              const zoneColor = zone === 'qualified' ? '#34d399' : zone === 'playoff' ? '#f59e0b' : '#ef4444';
              const zoneLabel = zone === 'qualified' ? '●' : zone === 'playoff' ? '◐' : '○';
              return (
                <tr key={s.team} className={`border-t border-[#21262d] ${s.isPlayerTeam ? 'bg-emerald-500/5' : ''}`}>
                  <td className="py-1.5 px-1 text-[#484f58]">{idx + 1}</td>
                  <td className={`py-1.5 px-1 font-medium ${s.isPlayerTeam ? 'text-emerald-400' : TEXT_PRIMARY}`}>
                    {s.flag} {s.team.length > 12 ? s.team.slice(0, 12) + '...' : s.team}
                  </td>
                  <td className="text-center py-1.5 px-0.5 text-[#8b949e]">{s.played}</td>
                  <td className="text-center py-1.5 px-0.5 text-emerald-400">{s.won}</td>
                  <td className="text-center py-1.5 px-0.5 text-amber-400">{s.drawn}</td>
                  <td className="text-center py-1.5 px-0.5 text-red-400">{s.lost}</td>
                  <td className="text-center py-1.5 px-0.5">{gd > 0 ? <span className="text-emerald-400">+{gd}</span> : <span className="text-red-400">{gd}</span>}</td>
                  <td className="text-center py-1.5 px-0.5 font-bold text-[#c9d1d9]">{s.points}</td>
                  <td className="text-center py-1.5 px-0.5" style={{ color: zoneColor }}>{zoneLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-3 text-[9px] text-[#484f58]">
        <span className="flex items-center gap-1"><span style={{ color: '#34d399' }}>●</span> Qualified</span>
        <span className="flex items-center gap-1"><span style={{ color: '#f59e0b' }}>◐</span> Playoff</span>
        <span className="flex items-center gap-1"><span style={{ color: '#ef4444' }}>○</span> Eliminated</span>
      </div>

      {/* Points Progression Chart */}
      <div>
        <span className="text-[10px] text-[#484f58] block mb-1">Points Progression</span>
        <PointsProgressionChart pointsPerDay={pointsProgression} />
      </div>

      {/* GD Trend */}
      <div>
        <span className="text-[10px] text-[#484f58] block mb-1">Goal Difference Trend</span>
        <GdTrendChart gdPerDay={gdProgression} />
      </div>

      {/* Head-to-Head Records */}
      <div>
        <span className="text-[10px] text-[#484f58] block mb-1.5">Head-to-Head Records</span>
        <div className="space-y-1">
          {h2hRecords.map(h => (
            <div key={h.name} className="flex items-center gap-2 bg-[#21262d] rounded-lg px-3 py-2 text-[10px]">
              <span className="text-sm">{h.flag}</span>
              <span className={`flex-1 font-medium ${TEXT_PRIMARY}`}>{h.name}</span>
              <span className="text-emerald-400 font-bold">{h.wins}W</span>
              <span className="text-amber-400 font-bold">{h.draws}D</span>
              <span className="text-red-400 font-bold">{h.losses}L</span>
              <span className="text-[#484f58]">{h.gf}-{h.ga}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strength of Schedule */}
      <div className="bg-[#21262d] rounded-lg p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#484f58] block">Strength of Schedule</span>
          <span className="text-xs font-semibold text-[#c9d1d9]">Avg Opponent Rating</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${avgOpponentRating >= 85 ? 'text-red-400' : avgOpponentRating >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {avgOpponentRating.toFixed(1)}
          </span>
          <span className="text-[9px] text-[#484f58] block">{avgOpponentRating >= 85 ? 'Very Hard' : avgOpponentRating >= 75 ? 'Moderate' : 'Favorable'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 12. Tournament Progress Dashboard (~150 lines)
// ============================================================
function TournamentProgress({
  caps,
  goals,
  assists,
  nationName,
  knockoutMatches,
  history,
}: {
  caps: number;
  goals: number;
  assists: number;
  nationName: string;
  knockoutMatches: KnockoutMatch[];
  history: TournamentHistoryEntry[];
}) {
  const totalGoalsScored = 2 + Math.floor(seededRandom(hashCode(nationName + 'gs')) * (caps + goals));
  const totalGoalsConceded = 1 + Math.floor(seededRandom(hashCode(nationName + 'gc')) * (caps + 2));
  const cleanSheets = Math.floor(seededRandom(hashCode(nationName + 'cs')) * caps * 0.3);
  const avgPossession = 45 + Math.floor(seededRandom(hashCode(nationName + 'pos')) * 15);
  const passAccuracy = 75 + Math.floor(seededRandom(hashCode(nationName + 'pa')) * 18);

  const playerMatches = knockoutMatches.filter(m => m.homeIsPlayer || m.awayIsPlayer);
  const furthestRound = playerMatches.length > 0 ? playerMatches[playerMatches.length - 1].round : 'N/A';

  const topScorer = useMemo(() => {
    const names = ['Marcus Silva', 'Lukas Weber', 'Antonio Rossi'];
    const name = names[Math.abs(hashCode(nationName + 'topscorer')) % names.length];
    const tournamentGoals = 2 + Math.floor(seededRandom(hashCode(nationName + 'topscorer')) * 5);
    return { name, goals: tournamentGoals };
  }, [nationName]);

  const topAssists = useMemo(() => {
    const names = ['Erik Johansson', 'Carlos Garcia', 'David Laurent'];
    const name = names[Math.abs(hashCode(nationName + 'topassists')) % names.length];
    const tournamentAssists = 1 + Math.floor(seededRandom(hashCode(nationName + 'topassists')) * 4);
    return { name, assists: tournamentAssists };
  }, [nationName]);

  const bestRating = useMemo(() => {
    const names = ['Felix Dubois', 'Stefan Berger', 'Julian Hoffman'];
    const name = names[Math.abs(hashCode(nationName + 'bestrating')) % names.length];
    const rating = +(7.0 + seededRandom(hashCode(nationName + 'bestrating')) * 2.0).toFixed(1);
    return { name, rating };
  }, [nationName]);

  const capsMilestones = [
    { target: 50, label: '50 Caps', current: caps },
    { target: 75, label: '75 Caps', current: caps },
    { target: 100, label: '100 Caps', current: caps },
  ];

  const tournamentGoalMilestones = [
    { target: 5, label: '5 Goals', current: goals },
    { target: 10, label: '10 Goals', current: goals },
    { target: 20, label: '20 Goals', current: goals },
  ];

  return (
    <div className="space-y-3">
      {/* Route to final */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Tournament Progress
        </h3>

        <TournamentBracketSVG matches={knockoutMatches} playerNation={nationName} />

        <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-[#484f58] block">Furthest Round</span>
          <span className="text-xs font-semibold text-emerald-400">{furthestRound}</span>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#8b949e]" />
          Tournament Statistics
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Goals Scored', value: totalGoalsScored, color: '#34d399' },
            { label: 'Goals Conceded', value: totalGoalsConceded, color: '#ef4444' },
            { label: 'Clean Sheets', value: cleanSheets, color: '#22d3ee' },
            { label: 'Avg Possession', value: `${avgPossession}%`, color: '#f59e0b' },
            { label: 'Pass Accuracy', value: `${passAccuracy}%`, color: '#34d399' },
            { label: 'Total Caps', value: caps, color: '#c9d1d9' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#21262d] rounded-lg p-2.5 border border-[#21262d]">
              <span className="text-[9px] text-[#484f58] block">{stat.label}</span>
              <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Performers */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          Key Performers
        </h3>
        <div className="space-y-1.5">
          {[
            { label: 'Top Scorer', name: topScorer.name, value: `${topScorer.goals} goals`, icon: <Target className="h-3 w-3 text-emerald-400" /> },
            { label: 'Most Assists', name: topAssists.name, value: `${topAssists.assists} assists`, icon: <TrendingUp className="h-3 w-3 text-cyan-400" /> },
            { label: 'Best Rating', name: bestRating.name, value: bestRating.rating.toFixed(1), icon: <Star className="h-3 w-3 text-amber-400" /> },
          ].map(performer => (
            <div key={performer.label} className="flex items-center gap-2 bg-[#21262d] rounded-lg px-3 py-2">
              {performer.icon}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] text-[#484f58] block">{performer.label}</span>
                <span className="text-xs text-[#c9d1d9] truncate block">{performer.name}</span>
              </div>
              <span className="text-xs font-bold text-[#c9d1d9]">{performer.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Tracker */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" />
          Milestone Tracker
        </h3>
        <div className="space-y-2">
          {[...capsMilestones, ...tournamentGoalMilestones].map(m => {
            const achieved = m.current >= m.target;
            const progress = Math.min(m.current / m.target * 100, 100);
            return (
              <div key={m.label} className="flex items-center gap-2">
                <span className={`text-[10px] font-medium w-20 ${achieved ? 'text-emerald-400' : TEXT_SECONDARY}`}>{m.label}</span>
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: achieved ? '#34d399' : '#30363d',
                    }}
                  />
                </div>
                <span className={`text-[9px] w-8 text-right ${achieved ? 'text-emerald-400' : TEXT_SECONDARY}`}>{m.current}/{m.target}</span>
                {achieved && <Heart className="h-3 w-3 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 13. Rival Nations Panel (~100 lines)
// ============================================================
interface RivalRecord {
  name: string;
  flag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  memorableMatch: string;
}

function RivalNations({ nationName, seed }: { nationName: string; seed: number }) {
  const rivals: RivalRecord[] = useMemo(() => {
    const rivalPool = WORLD_CUP_TEAMS.filter(t => t.name !== nationName);
    const selected = rivalPool.slice(0, 6);
    const memorableMatches = [
      'World Cup 2022 QF: 2-1 after extra time, late winner in 118th minute',
      'Euro 2020 Group: 3-3 thriller, hat-trick cancelled out by late equalizer',
      'WC Qualifier 2018: 1-0, defensive masterclass with 10 men for 60 minutes',
    ];
    return selected.map((r, i) => {
      const played = 5 + Math.floor(seededRandom(seed + i * 13) * 15);
      const wins = Math.floor(seededRandom(seed + i * 7) * (played * 0.5));
      const draws = Math.floor(seededRandom(seed + i * 11) * (played * 0.3));
      const losses = played - wins - draws;
      const gf = wins * 2 + draws + Math.floor(seededRandom(seed + i * 17) * draws);
      const ga = losses * 2 + draws + Math.floor(seededRandom(seed + i * 19) * draws);
      const memorable = memorableMatches[i % memorableMatches.length];
      return { name: r.name, flag: r.flag, played, wins, draws, losses, gf, ga, memorableMatch: memorable };
    }).sort((a, b) => b.played - a.played).slice(0, 3);
  }, [nationName, seed]);

  const upcomingOpponent = WORLD_CUP_TEAMS.filter(t => t.name !== nationName)[Math.abs(hashCode(nationName + 'upcoming')) % 5];

  return (
    <div className="space-y-3">
      {/* Top Rivals */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Swords className="h-4 w-4 text-red-400" />
          Rival Nations
        </h3>

        {rivals.map((rival, idx) => {
          const nationQuality = getTeamQuality(nationName);
          const rivalQuality = getTeamQuality(rival.name);
          const isFavoured = nationQuality > rivalQuality;
          return (
            <div key={rival.name} className="bg-[#21262d] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{rival.flag}</span>
                  <span className="text-xs font-semibold text-[#c9d1d9]">{rival.name}</span>
                  <Badge className="bg-[#30363d] text-[#8b949e] border-0 text-[8px]">
                    #{getFifaRanking(rival.name)}
                  </Badge>
                </div>
                <span className="text-[9px] text-[#484f58]">{rival.played} meetings</span>
              </div>

              {/* H2H record */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-emerald-400 font-bold">{rival.wins}W</span>
                  <span className="text-amber-400 font-bold">{rival.draws}D</span>
                  <span className="text-red-400 font-bold">{rival.losses}L</span>
                </div>
                <span className="text-[9px] text-[#484f58] mx-1">|</span>
                <span className="text-[10px] text-[#8b949e]">Goals: {rival.gf}-{rival.ga}</span>
              </div>

              {/* Comparison */}
              <div className="flex items-center gap-2 text-[9px] text-[#484f58]">
                <span className={isFavoured ? 'text-emerald-400 font-medium' : TEXT_SECONDARY}>You {nationQuality}</span>
                <span>vs</span>
                <span className={!isFavoured ? 'text-red-400 font-medium' : TEXT_SECONDARY}>{rival.name} {rivalQuality}</span>
              </div>

              {/* Memorable match */}
              {idx < 2 && (
                <div className="border-l-2 border-emerald-500/30 pl-2">
                  <span className="text-[9px] text-[#8b949e] block">{rival.memorableMatch}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Fixture */}
      {upcomingOpponent && (
        <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4">
          <h3 className="text-xs font-semibold text-[#c9d1d9] flex items-center gap-2 mb-2">
            <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
            Upcoming Fixture
          </h3>
          <div className="bg-[#21262d] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">&#127482;&#127480;</span>
              <span className="text-xs font-medium text-emerald-400">{nationName}</span>
            </div>
            <span className="text-[10px] text-[#484f58] font-bold">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#c9d1d9]">{upcomingOpponent.name}</span>
              <span className="text-sm">{upcomingOpponent.flag}</span>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-[#484f58] text-center">Friendly — Next International Break</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function InternationalTournament() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState('overview');

  const nationInfo = useMemo(() => {
    if (!gameState) return { name: '', flag: '🏳️' };
    return getPlayerNationInfo(gameState.player.nationality);
  }, [gameState]);

  // Generate all tournament data deterministically
  const tournamentData = useMemo(() => {
    if (!gameState) return null;

    const seed = hashCode(nationInfo.name + gameState.currentSeason);
    const ic = gameState.internationalCareer ?? { caps: 0, goals: 0, assists: 0, averageRating: 0, tournaments: [] };

    // Ensure player's nation is in the tournament
    const euroTeams = [...EURO_TEAMS];
    const playerInEuro = euroTeams.some(t => t.name === nationInfo.name);
    if (!playerInEuro) {
      euroTeams[0] = {
        name: nationInfo.name,
        flag: nationInfo.flag,
        quality: gameState.player.overall + 10,
        ranking: getFifaRanking(nationInfo.name),
        style: getTeamStyle(nationInfo.name),
      };
    }

    // Create 6 groups of 4 for Euro
    const euroGroups: { letter: string; teams: TournamentTeam[] }[] = [];
    for (let g = 0; g < 6; g++) {
      euroGroups.push({
        letter: String.fromCharCode(65 + g),
        teams: euroTeams.slice(g * 4, g * 4 + 4),
      });
    }

    // Create 8 groups of 4 for World Cup
    const wcTeams = [...WORLD_CUP_TEAMS];
    const playerInWC = wcTeams.some(t => t.name === nationInfo.name);
    if (!playerInWC) {
      wcTeams[0] = {
        name: nationInfo.name,
        flag: nationInfo.flag,
        quality: gameState.player.overall + 10,
        ranking: getFifaRanking(nationInfo.name),
        style: getTeamStyle(nationInfo.name),
      };
    }

    const wcGroups: { letter: string; teams: TournamentTeam[] }[] = [];
    for (let g = 0; g < 8; g++) {
      wcGroups.push({
        letter: String.fromCharCode(65 + g),
        teams: wcTeams.slice(g * 4, g * 4 + 4),
      });
    }

    // Qualified teams for knockout (top 2 from each group)
    const euroQualified = euroGroups.flatMap(g => {
      const standings = calculateGroupStandings(
        g.teams,
        generateGroupMatches(g.teams, seed + hashCode(g.letter)),
        nationInfo.name
      );
      return standings.slice(0, 2).map(s => ({
        name: s.team,
        flag: s.flag,
        quality: g.teams.find(t => t.name === s.team)?.quality ?? 75,
      }));
    });

    const wcQualified = wcGroups.flatMap(g => {
      const standings = calculateGroupStandings(
        g.teams,
        generateGroupMatches(g.teams, seed + hashCode(g.letter + 'wc')),
        nationInfo.name
      );
      return standings.slice(0, 2).map(s => ({
        name: s.team,
        flag: s.flag,
        quality: g.teams.find(t => t.name === s.team)?.quality ?? 75,
      }));
    });

    const euroBracket = generateKnockoutBracket(euroQualified, nationInfo.name, seed + 500);
    const wcBracket = generateKnockoutBracket(wcQualified, nationInfo.name, seed + 600);

    const squad = generateSquad(nationInfo.name, nationInfo.flag, gameState.player.name, gameState.player.position, seed + 300);
    const history = generateTournamentHistory(ic.caps, ic.goals, nationInfo.name);

    return {
      euroGroups,
      wcGroups,
      euroBracket,
      wcBracket,
      squad,
      history,
      seed,
      caps: ic.caps,
      goals: ic.goals,
      assists: ic.assists,
    };
  }, [gameState, nationInfo]);

  if (!gameState || !tournamentData) return null;

  const { player } = gameState;

  // Find the player's group for highlighting
  const playerEuroGroup = tournamentData.euroGroups.find(g =>
    g.teams.some(t => t.name === nationInfo.name)
  );
  const playerWCGroup = tournamentData.wcGroups.find(g =>
    g.teams.some(t => t.name === nationInfo.name)
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="p-2 bg-[#21262d] rounded-lg border border-[#30363d]">
          <Globe className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#c9d1d9]">International Tournament</h1>
          <p className="text-xs text-[#8b949e]">European Championship & World Cup</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg">
          <TabsTrigger value="overview" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="bracket" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Bracket
          </TabsTrigger>
          <TabsTrigger value="squad" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Squad
          </TabsTrigger>
          <TabsTrigger value="match" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Match
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Analysis
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Progress
          </TabsTrigger>
          <TabsTrigger value="rivals" className="text-xs flex-1 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Rivals
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Tournament Selection */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentSelection playerNation={nationInfo.name} currentSeason={gameState.currentSeason} />
          </motion.div>

          {/* National Team Profile */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <NationalTeamProfile
              nationName={nationInfo.name}
              nationFlag={nationInfo.flag}
              caps={tournamentData.caps}
              goals={tournamentData.goals}
            />
          </motion.div>

          {/* Euro Group (player's group) */}
          {playerEuroGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="mb-2 flex items-center gap-2">
                <TrophyIcon color="#34d399" size={20} />
                <span className="text-xs font-semibold text-[#c9d1d9]">European Championship — Group Stage</span>
              </div>
              <GroupStageTable
                teamNames={playerEuroGroup.teams}
                groupLetter={playerEuroGroup.letter}
                playerNation={nationInfo.name}
                seed={tournamentData.seed + hashCode(playerEuroGroup.letter)}
              />
            </motion.div>
          )}

          {/* World Cup Group (player's group) */}
          {playerWCGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
              <div className="mb-2 flex items-center gap-2">
                <TrophyIcon color="#fbbf24" size={20} />
                <span className="text-xs font-semibold text-[#c9d1d9]">World Cup — Group Stage</span>
              </div>
              <GroupStageTable
                teamNames={playerWCGroup.teams}
                groupLetter={playerWCGroup.letter}
                playerNation={nationInfo.name}
                seed={tournamentData.seed + hashCode(playerWCGroup.letter + 'wc')}
              />
            </motion.div>
          )}

          {/* Player Tournament Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <PlayerTournamentStats caps={tournamentData.caps} goals={tournamentData.goals} assists={tournamentData.assists} />
          </motion.div>

          {/* Tournament History */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            <TournamentHistory history={tournamentData.history} />
          </motion.div>

          {/* Road to Qualification */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <RoadToQualification caps={tournamentData.caps} nationName={nationInfo.name} season={gameState.currentSeason} />
          </motion.div>
        </TabsContent>

        {/* Bracket Tab */}
        <TabsContent value="bracket" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
                <TrophyIcon color="#34d399" size={18} />
                European Championship — Knockout Stage
              </h3>
              <TournamentBracketSVG matches={tournamentData.euroBracket} playerNation={nationInfo.name} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="border border-[#30363d] rounded-lg bg-[#161b22] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
                <TrophyIcon color="#fbbf24" size={18} />
                World Cup — Knockout Stage
              </h3>
              <TournamentBracketSVG matches={tournamentData.wcBracket} playerNation={nationInfo.name} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Squad Tab */}
        <TabsContent value="squad" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SquadAnnouncement squad={tournamentData.squad} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <NationalTeamProfile
              nationName={nationInfo.name}
              nationFlag={nationInfo.flag}
              caps={tournamentData.caps}
              goals={tournamentData.goals}
            />
          </motion.div>
        </TabsContent>

        {/* Match Tab */}
        <TabsContent value="match" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MatchCenter
              playerNation={nationInfo.name}
              playerFlag={nationInfo.flag}
              seed={tournamentData.seed}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <PlayerTournamentStats caps={tournamentData.caps} goals={tournamentData.goals} assists={tournamentData.assists} />
          </motion.div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="mt-4 space-y-4">
          {playerEuroGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GroupAnalysis
                teams={playerEuroGroup.teams}
                playerNation={nationInfo.name}
                seed={tournamentData.seed + hashCode(playerEuroGroup.letter)}
                groupLetter={playerEuroGroup.letter}
              />
            </motion.div>
          )}
          {playerWCGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <GroupAnalysis
                teams={playerWCGroup.teams}
                playerNation={nationInfo.name}
                seed={tournamentData.seed + hashCode(playerWCGroup.letter + 'wc')}
                groupLetter={playerWCGroup.letter}
              />
            </motion.div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TournamentProgress
              caps={tournamentData.caps}
              goals={tournamentData.goals}
              assists={tournamentData.assists}
              nationName={nationInfo.name}
              knockoutMatches={tournamentData.euroBracket}
              history={tournamentData.history}
            />
          </motion.div>
        </TabsContent>

        {/* Rivals Tab */}
        <TabsContent value="rivals" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RivalNations nationName={nationInfo.name} seed={tournamentData.seed} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <SquadDepthChart squad={tournamentData.squad} seed={tournamentData.seed + 300} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* SVG Data Visualization Sections */}
      {/* ============================================================ */}
      <div className="mt-6 space-y-3">
        <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider px-1">
          Analytics
        </h2>

        {/* 1. SVG Tournament Progress Ring */}
        {(() => {
          const roundNames = ['Group Stage', 'R16', 'QF', 'SF', 'Final', 'Winner'];
          const totalRounds = roundNames.length;
          const capsVal = tournamentData.caps ?? 0;
          const goalsVal = tournamentData.goals ?? 0;
          const historyLen = tournamentData.history.length;
          const reachedRound = Math.min(historyLen + Math.floor(goalsVal / 5), totalRounds);
          const progress = reachedRound / totalRounds;
          const ringRadius = 38;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const ringDash = `${progress * ringCircumference} ${ringCircumference}`;
          const roundLabel = roundNames[reachedRound - 1] ?? roundNames[0];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FF5500]/20 border border-[#FF5500]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Tournament Progress Ring</h3>
                </div>
                <span className="text-[9px] font-bold text-[#FF5500]">{roundLabel}</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="#21262d" strokeWidth="8"/>
                <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="#FF5500" strokeWidth="8"
                  strokeDasharray={ringDash} strokeDashoffset={ringCircumference * 0.25}
                  strokeLinecap="round"/>
                <text x="60" y="56" textAnchor="middle" fill="#FF5500" fontSize="20" fontWeight="700">{reachedRound}</text>
                <text x="60" y="72" textAnchor="middle" fill="#8b949e" fontSize="8">of {totalRounds} rounds</text>
                {roundNames.map((rn, i) => {
                  const dotX = 150 + (i / (totalRounds - 1)) * 140;
                  const filled = i < reachedRound;
                  return (
                    <g key={rn}>
                      <circle cx={dotX} cy="50" r="4" fill={filled ? '#FF5500' : '#21262d'} stroke={filled ? '#FF5500' : '#30363d'} strokeWidth="1"/>
                      <text x={dotX} y="70" textAnchor="middle" fill={filled ? '#c9d1d9' : '#484f58'} fontSize="7">{rn}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 2. SVG International Goals Donut */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'goals_donut');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const totalGoals = tournamentData.goals ?? 0;
          const segments = [
            { label: 'Group', value: Math.max(1, Math.floor(sr(baseSeed) * totalGoals + 2)), color: '#CCFF00' },
            { label: 'Knockout', value: Math.max(1, Math.floor(sr(baseSeed + 1) * totalGoals + 1)), color: '#00E5FF' },
            { label: 'Friendly', value: Math.max(1, Math.floor(sr(baseSeed + 2) * totalGoals + 3)), color: '#FF5500' },
            { label: 'Qualifiers', value: Math.max(1, Math.floor(sr(baseSeed + 3) * totalGoals + 4)), color: '#666666' },
          ];
          const segTotal = segments.reduce((a, s) => a + s.value, 0);
          let cumulative = 0;
          const donutR = 36;
          const donutC = 2 * Math.PI * donutR;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#CCFF00]/20 border border-[#CCFF00]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">International Goals Donut</h3>
                </div>
                <span className="text-[9px] font-bold text-[#CCFF00]">{segTotal} goals</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {segments.map((seg) => {
                  const pct = seg.value / segTotal;
                  const dashLen = pct * donutC;
                  const dashOff = donutC * 0.25 - cumulative * donutC;
                  cumulative += pct;
                  return (
                    <g key={seg.label}>
                      <circle cx="60" cy="60" r={donutR} fill="none" stroke={seg.color} strokeWidth="10"
                        strokeDasharray={`${dashLen} ${donutC - dashLen}`} strokeDashoffset={dashOff}/>
                    </g>
                  );
                })}
                <text x="60" y="57" textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="700">{segTotal}</text>
                <text x="60" y="70" textAnchor="middle" fill="#8b949e" fontSize="7">total</text>
                {segments.map((seg, i) => {
                  const ly = 30 + i * 22;
                  return (
                    <g key={seg.label + '-legend'}>
                      <rect x="160" y={ly - 5} width="10" height="10" rx="2" fill={seg.color}/>
                      <text x="176" y={ly + 4} fill="#c9d1d9" fontSize="8">{seg.label}: {seg.value}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 3. SVG National Team Rating Area Chart */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'rating_area');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const quality = getTeamQuality(nationInfo.name);
          const ratings = Array.from({ length: 8 }, (_, i) => {
            const base = quality - 8 + Math.floor(sr(baseSeed + i) * 16);
            return Math.max(40, Math.min(99, base));
          });
          const pad = { t: 10, b: 20, l: 30, r: 10 };
          const cW = 320 - pad.l - pad.r;
          const cH = 120 - pad.t - pad.b;
          const minR = 40;
          const maxR = 100;
          const range = maxR - minR;
          const pts = ratings.map((r, i) => ({
            x: pad.l + (i / 7) * cW,
            y: pad.t + cH - ((r - minR) / range) * cH,
          }));
          const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          const areaPath = `${linePath} L${pts[7].x},${pad.t + cH} L${pts[0].x},${pad.t + cH} Z`;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">National Team Rating Area</h3>
                </div>
                <span className="text-[9px] font-bold text-[#00E5FF]">FIFA Rating</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {[50, 60, 70, 80, 90].map(v => {
                  const y = pad.t + cH - ((v - minR) / range) * cH;
                  return (
                    <g key={v}>
                      <line x1={pad.l} y1={y} x2={320 - pad.r} y2={y} stroke="#21262d" strokeWidth="0.5"/>
                      <text x={pad.l - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
                    </g>
                  );
                })}
                <path d={areaPath} fill="#00E5FF" fillOpacity="0.1"/>
                <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="2.5" fill="#0d1117" stroke="#00E5FF" strokeWidth="1.5"/>
                    <text x={p.x} y={120 - 4} textAnchor="middle" fill="#484f58" fontSize="6">P{i + 1}</text>
                  </g>
                ))}
              </svg>
            </motion.div>
          );
        })()}

        {/* 4. SVG Caps Milestone Gauge */}
        {(() => {
          const capsVal = tournamentData.caps ?? 0;
          const milestone = 100;
          const pct = Math.min(capsVal / milestone, 1);
          const gaugeR = 44;
          const gaugeCx = 160;
          const gaugeCy = 100;
          const startAngle = Math.PI;
          const endAngle = 0;
          const fillAngle = startAngle + pct * (endAngle - startAngle);
          const arcPath = `M ${gaugeCx - gaugeR} ${gaugeCy} A ${gaugeR} ${gaugeR} 0 ${pct > 0.5 ? 1 : 0} 1 ${gaugeCx + Math.cos(fillAngle) * gaugeR} ${gaugeCy - Math.sin(fillAngle) * gaugeR}`;
          const bgArcPath = `M ${gaugeCx - gaugeR} ${gaugeCy} A ${gaugeR} ${gaugeR} 0 1 1 ${gaugeCx + gaugeR} ${gaugeCy}`;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#CCFF00]/20 border border-[#CCFF00]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Caps Milestone Gauge</h3>
                </div>
                <span className="text-[9px] font-bold text-[#CCFF00]">{capsVal}/100</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <path d={bgArcPath} fill="none" stroke="#21262d" strokeWidth="10" strokeLinecap="round"/>
                {pct > 0.01 && (
                  <path d={arcPath} fill="none" stroke="#CCFF00" strokeWidth="10" strokeLinecap="round"/>
                )}
                <text x={gaugeCx} y={gaugeCy - 10} textAnchor="middle" fill="#CCFF00" fontSize="22" fontWeight="700">{capsVal}</text>
                <text x={gaugeCx} y={gaugeCy + 6} textAnchor="middle" fill="#8b949e" fontSize="8">caps</text>
                <text x={gaugeCx - gaugeR - 5} y={gaugeCy + 14} textAnchor="middle" fill="#484f58" fontSize="7">0</text>
                <text x={gaugeCx + gaugeR + 5} y={gaugeCy + 14} textAnchor="middle" fill="#484f58" fontSize="7">100</text>
                <text x={gaugeCx} y={gaugeCy + 16} textAnchor="middle" fill={capsVal >= 100 ? '#CCFF00' : '#484f58'} fontSize="7">{capsVal >= 100 ? 'CENTURION!' : `${milestone - capsVal} to go`}</text>
              </svg>
            </motion.div>
          );
        })()}

        {/* 5. SVG International Trophies Bars */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'trophies');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const trophies = [
            { label: 'World Cup', count: Math.floor(sr(baseSeed) * 4) },
            { label: 'Continental', count: Math.floor(sr(baseSeed + 1) * 5) },
            { label: 'Confederation', count: Math.floor(sr(baseSeed + 2) * 3) },
            { label: 'Friendly Cup', count: Math.floor(sr(baseSeed + 3) * 6) },
          ];
          const maxCount = trophies.reduce((mx, t) => Math.max(mx, t.count), 1);
          const totalTrophies = trophies.reduce((a, t) => a + t.count, 0);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FF5500]/20 border border-[#FF5500]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zm12 0h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9zM6 9h12"/><path d="M6 9a6 6 0 0012 0"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">International Trophies</h3>
                </div>
                <span className="text-[9px] font-bold text-[#FF5500]">{totalTrophies} total</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {trophies.map((t, i) => {
                  const barW = maxCount > 0 ? (t.count / maxCount) * 200 : 4;
                  const barY = 16 + i * 26;
                  return (
                    <g key={t.label}>
                      <text x="90" y={barY + 10} textAnchor="end" fill="#c9d1d9" fontSize="8">{t.label}</text>
                      <rect x="96" y={barY} width="200" height="16" rx="3" fill="#21262d"/>
                      <rect x="96" y={barY} width={Math.max(barW, 4)} height="16" rx="3" fill="#FF5500" fillOpacity="0.8"/>
                      <text x={96 + Math.max(barW, 4) + 6} y={barY + 12} fill="#c9d1d9" fontSize="8" fontWeight="600">{t.count}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 6. SVG Tournament Match Results Timeline */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'match_timeline');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const results = Array.from({ length: 8 }, (_, i) => {
            const r = sr(baseSeed + i);
            return r < 0.5 ? 'W' : r < 0.75 ? 'D' : 'L';
          });
          const wCount = results.reduce((a, r) => a + (r === 'W' ? 1 : 0), 0);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Match Results Timeline</h3>
                </div>
                <span className="text-[9px] font-bold text-[#00E5FF]">{wCount}W / {results.length} matches</span>
              </div>
              <svg viewBox="0 0 320 80" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <line x1="30" y1="40" x2="290" y2="40" stroke="#30363d" strokeWidth="2"/>
                {results.map((r, i) => {
                  const cx = 40 + (i / 7) * 250;
                  const color = r === 'W' ? '#34d399' : r === 'D' ? '#fbbf24' : '#ef4444';
                  return (
                    <g key={i}>
                      <circle cx={cx} cy="40" r="10" fill="#161b22" stroke={color} strokeWidth="2"/>
                      <text x={cx} y="44" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">{r}</text>
                      <text x={cx} y="65" textAnchor="middle" fill="#484f58" fontSize="7">M{i + 1}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 7. SVG Player Contribution Radar */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'radar');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const axes = ['Goals', 'Assists', 'Minutes', 'Clean Sheets', 'MOTM'];
          const values = axes.map((_, i) => 0.3 + sr(baseSeed + i) * 0.7);
          const cx = 160;
          const cy = 60;
          const maxR = 42;
          const levels = [0.25, 0.5, 0.75, 1.0];
          const angleStep = (2 * Math.PI) / axes.length;
          const startAngle = -Math.PI / 2;
          const dataPoints = values.map((v, i) => ({
            x: cx + Math.cos(startAngle + i * angleStep) * maxR * v,
            y: cy + Math.sin(startAngle + i * angleStep) * maxR * v,
          }));
          const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Player Contribution Radar</h3>
                </div>
                <span className="text-[9px] font-bold text-[#00E5FF]">Int&apos;l Career</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {levels.map((lv) => (
                  <polygon key={lv}
                    points={axes.map((_, i) => {
                      const px = cx + Math.cos(startAngle + i * angleStep) * maxR * lv;
                      const py = cy + Math.sin(startAngle + i * angleStep) * maxR * lv;
                      return `${px},${py}`;
                    }).join(' ')}
                    fill="none" stroke="#21262d" strokeWidth="0.5"/>
                ))}
                {axes.map((_, i) => (
                  <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(startAngle + i * angleStep) * maxR} y2={cy + Math.sin(startAngle + i * angleStep) * maxR} stroke="#21262d" strokeWidth="0.5"/>
                ))}
                <path d={dataPath} fill="#00E5FF" fillOpacity="0.15" stroke="#00E5FF" strokeWidth="1.5"/>
                {dataPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#00E5FF" strokeWidth="1.5"/>
                  </g>
                ))}
                {axes.map((label, i) => {
                  const lx = cx + Math.cos(startAngle + i * angleStep) * (maxR + 14);
                  const ly = cy + Math.sin(startAngle + i * angleStep) * (maxR + 14);
                  return (
                    <text key={label} x={lx} y={ly + 3} textAnchor="middle" fill="#8b949e" fontSize="7">{label}</text>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 8. SVG Qualification Campaign Bars */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'qual_campaign');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const teamNames = [nationInfo.name, 'Wales', 'Georgia', 'Armenia', 'Latvia', 'Andorra'];
          const teamPoints = teamNames.map((_, i) => Math.floor(sr(baseSeed + i) * 18) + (i === 0 ? 8 : 0));
          const maxPts = teamPoints.reduce((mx, p) => Math.max(mx, p), 1);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#CCFF00]/20 border border-[#CCFF00]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Qualification Campaign</h3>
                </div>
                <span className="text-[9px] font-bold text-[#CCFF00]">Group Standings</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {teamNames.map((name, i) => {
                  const barW = maxPts > 0 ? (teamPoints[i] / maxPts) * 180 : 4;
                  const barY = 8 + i * 18;
                  const isPlayer = i === 0;
                  return (
                    <g key={name}>
                      <text x="78" y={barY + 10} textAnchor="end" fill={isPlayer ? '#CCFF00' : '#c9d1d9'} fontSize="8" fontWeight={isPlayer ? 700 : 400}>{name}</text>
                      <rect x="84" y={barY} width="180" height="13" rx="2" fill="#21262d"/>
                      <rect x="84" y={barY} width={Math.max(barW, 4)} height="13" rx="2" fill={isPlayer ? '#CCFF00' : '#30363d'} fillOpacity={isPlayer ? 0.8 : 0.5}/>
                      <text x={84 + Math.max(barW, 4) + 6} y={barY + 10} fill={isPlayer ? '#CCFF00' : '#c9d1d9'} fontSize="8" fontWeight="600">{teamPoints[i]}pts</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 9. SVG International Form Donut */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'form_donut');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const formSegments = [
            { label: 'Won', value: Math.floor(sr(baseSeed) * 5) + 2, color: '#CCFF00' },
            { label: 'Drawn', value: Math.floor(sr(baseSeed + 1) * 4) + 1, color: '#666666' },
            { label: 'Lost', value: Math.floor(sr(baseSeed + 2) * 3) + 1, color: '#FF5500' },
          ];
          const formTotal = formSegments.reduce((a, s) => a + s.value, 0);
          let fCumulative = 0;
          const fDonutR = 36;
          const fDonutC = 2 * Math.PI * fDonutR;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#CCFF00]/20 border border-[#CCFF00]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">International Form</h3>
                </div>
                <span className="text-[9px] font-bold text-[#CCFF00]">Last {formTotal}</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {formSegments.map((seg) => {
                  const pct = seg.value / formTotal;
                  const dashLen = pct * fDonutC;
                  const dashOff = fDonutC * 0.25 - fCumulative * fDonutC;
                  fCumulative += pct;
                  return (
                    <g key={seg.label}>
                      <circle cx="60" cy="60" r={fDonutR} fill="none" stroke={seg.color} strokeWidth="12"
                        strokeDasharray={`${dashLen} ${fDonutC - dashLen}`} strokeDashoffset={dashOff}/>
                    </g>
                  );
                })}
                <text x="60" y="57" textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="700">{formSegments[0].value}W</text>
                <text x="60" y="70" textAnchor="middle" fill="#8b949e" fontSize="7">{formSegments[1].value}D {formSegments[2].value}L</text>
                {formSegments.map((seg, i) => {
                  const ly = 30 + i * 24;
                  return (
                    <g key={seg.label + '-fl'}>
                      <rect x="160" y={ly - 6} width="12" height="12" rx="2" fill={seg.color}/>
                      <text x="180" y={ly + 4} fill="#c9d1d9" fontSize="9">{seg.label}: {seg.value}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

        {/* 10. SVG World Ranking Trend Line */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'ranking_trend');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const baseRank = getFifaRanking(nationInfo.name);
          const rankings = Array.from({ length: 8 }, (_, i) => {
            const variation = Math.floor(sr(baseSeed + i) * 30) - 15;
            return Math.max(1, baseRank + variation);
          });
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
          const pad = { t: 12, b: 20, l: 30, r: 10 };
          const cW = 320 - pad.l - pad.r;
          const cH = 120 - pad.t - pad.b;
          const minRank = Math.min(...rankings) - 2;
          const maxRank = Math.max(...rankings) + 2;
          const rankRange = maxRank - minRank || 1;
          const rankPts = rankings.map((r, i) => ({
            x: pad.l + (i / 7) * cW,
            y: pad.t + cH - ((r - minRank) / rankRange) * cH,
          }));
          const rankLinePath = rankPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FF5500]/20 border border-[#FF5500]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">World Ranking Trend</h3>
                </div>
                <span className="text-[9px] font-bold text-[#FF5500]">#{rankings[rankings.length - 1]}</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {[Math.floor(minRank), Math.floor((minRank + maxRank) / 2), Math.ceil(maxRank)].map(v => {
                  const y = pad.t + cH - ((v - minRank) / rankRange) * cH;
                  return (
                    <g key={v}>
                      <line x1={pad.l} y1={y} x2={320 - pad.r} y2={y} stroke="#21262d" strokeWidth="0.5"/>
                      <text x={pad.l - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">#{v}</text>
                    </g>
                  );
                })}
                <path d={rankLinePath} fill="none" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {rankPts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#FF5500" strokeWidth="1.5"/>
                    <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#c9d1d9" fontSize="6">#{rankings[i]}</text>
                    <text x={p.x} y={120 - 4} textAnchor="middle" fill="#484f58" fontSize="6">{months[i]}</text>
                  </g>
                ))}
              </svg>
            </motion.div>
          );
        })()}

        {/* 11. SVG National Team Comparison Butterfly */}
        {(() => {
          const baseSeed = hashCode(nationInfo.name + 'butterfly');
          const sr = (s: number) => { const x = Math.sin(s * 9301 + 49297); return x - Math.floor(x); };
          const metrics = ['Goals', 'Assists', 'Passes', 'Tackles', 'Aerial'];
          const playerStats = metrics.map((_, i) => 0.4 + sr(baseSeed + i) * 0.6);
          const avgStats = metrics.map((_, i) => 0.3 + sr(baseSeed + i + 20) * 0.5);
          const cx = 160;
          const halfW = 110;
          const barH = 10;
          const gap = 22;
          const startY = 10;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Team Comparison Butterfly</h3>
                </div>
                <span className="text-[9px] font-bold text-[#00E5FF]">Player vs Avg</span>
              </div>
              <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <line x1={cx} y1="5" x2={cx} y2="115" stroke="#30363d" strokeWidth="0.5"/>
                <text x={cx - halfW - 4} y="12" textAnchor="end" fill="#00E5FF" fontSize="7">YOU</text>
                <text x={cx + halfW + 4} y="12" textAnchor="start" fill="#666666" fontSize="7">AVG</text>
                {metrics.map((metric, i) => {
                  const y = startY + i * gap;
                  const pBarW = playerStats[i] * halfW;
                  const aBarW = avgStats[i] * halfW;
                  return (
                    <g key={metric}>
                      <rect x={cx - pBarW} y={y} width={pBarW} height={barH} rx="2" fill="#00E5FF" fillOpacity="0.7"/>
                      <rect x={cx} y={y} width={aBarW} height={barH} rx="2" fill="#666666" fillOpacity="0.5"/>
                      <text x={cx} y={y + barH + 4} textAnchor="middle" fill="#8b949e" fontSize="7">{metric}</text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          );
        })()}

      </div>
    </div>
  );
}
