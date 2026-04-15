'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getClubById, getClubsByLeague, getLeagueById } from '@/lib/game/clubsData';
import { getOverallColor } from '@/lib/game/gameUtils';
import {
  Trophy,
  Medal,
  Star,
  Crown,
  Award,
  Target,
  Flame,
  Users,
  ArrowLeft,
  Sparkles,
  Zap,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============================================================
// Types
// ============================================================

interface AwardEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  winnerName: string;
  winnerClub: string;
  winnerStats: string;
  isPlayer: boolean;
  color: string;
  accentBg: string;
  icon: React.ReactNode;
}

// ============================================================
// Seeded random (deterministic based on season number)
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickFromSeeded<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededBetween(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ============================================================
// Procedural name generation for competitors
// ============================================================

const FIRST_NAMES = [
  'Lukas', 'Marco', 'Rafael', 'Erik', 'Julian', 'Mateo', 'Felix',
  'Sergio', 'André', 'Victor', 'Pierre', 'Antoine', 'Kai', 'Emil',
  'Jamal', 'Pedro', 'Lorenzo', 'Nicolas', 'Hugo', 'Alessandro',
  'Carlos', 'Thiago', 'Diogo', 'Frenkie', 'Jude', 'Phil', 'Bukayo',
];

const LAST_NAMES = [
  'Mueller', 'Rodriguez', 'Silva', 'Fernandez', 'Hernandez',
  'Lambert', 'Dubois', 'Schmidt', 'Johansson', 'Petrov',
  'Torres', 'Garcia', 'Bergmann', 'Andersen', 'Volkov',
  'Sanchez', 'Moreau', 'Eriksson', 'Weber', 'Rossi',
  'Costa', 'Martins', 'Ivanov', 'Park', 'Okafor',
];

function generateCompetitorName(rng: () => number): string {
  return `${pickFromSeeded(FIRST_NAMES, rng)} ${pickFromSeeded(LAST_NAMES, rng)}`;
}

// ============================================================
// SVG helper functions
// ============================================================

function donutSegmentPath(
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  if (endAngle - startAngle < 0.01) return '';
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + outerR * Math.cos(startRad);
  const y1 = cy + outerR * Math.sin(startRad);
  const x2 = cx + outerR * Math.cos(endRad);
  const y2 = cy + outerR * Math.sin(endRad);
  const x3 = cx + innerR * Math.cos(endRad);
  const y3 = cy + innerR * Math.sin(endRad);
  const x4 = cx + innerR * Math.cos(startRad);
  const y4 = cy + innerR * Math.sin(startRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

function gaugeArcPath(cx: number, cy: number, r: number, value: number): string {
  if (value < 0.5) return '';
  const angle = Math.PI * (1 + value / 100);
  const x2 = cx + r * Math.cos(angle);
  const y2 = cy + r * Math.sin(angle);
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

function buildPolygonPoints(
  cx: number, cy: number, values: number[], maxR: number,
): string {
  return values.reduce((acc, val, i) => {
    const angle = (i * 2 * Math.PI / values.length) - Math.PI / 2;
    const r = (val / 100) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return i === 0 ? `${x},${y}` : `${acc} ${x},${y}`;
  }, '');
}

function buildGridPolygon(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }).reduce<string>((acc, _, i) => {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return i === 0 ? `${x},${y}` : `${acc} ${x},${y}`;
  }, '');
}

// ============================================================
// SVG Trophy component
// ============================================================

function TrophySVG({ color }: { color: string }): React.JSX.Element {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8h32v4c0 8-6 14-16 14S16 20 16 12V8z" fill={color} opacity="0.85" />
      <path d="M16 12H8c0 8 4 12 8 14M48 12h8c0 8-4 12-8 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="28" y="26" width="8" height="8" rx="1" fill={color} opacity="0.7" />
      <rect x="22" y="34" width="20" height="6" rx="2" fill={color} opacity="0.9" />
      <rect x="18" y="40" width="28" height="4" rx="2" fill={color} opacity="0.6" />
    </svg>
  );
}

// ============================================================
// SVG Star decoration
// ============================================================

function StarSVG({ color, size = 14 }: { color: string; size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

// ============================================================
// SVG Medal component
// ============================================================

function MedalSVG({ color }: { color: string }): React.JSX.Element {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 8l10 14L42 8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="38" r="16" fill={color} opacity="0.8" />
      <circle cx="32" cy="38" r="10" fill="#161b22" />
      <StarSVG color={color} size={12} />
    </svg>
  );
}

// ============================================================
// Helper: Get ordinal suffix
// ============================================================

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============================================================
// Helper: Generate awards based on game state
// ============================================================

function generateSeasonAwards(
  playerName: string,
  playerAge: number,
  playerOverall: number,
  playerGoals: number,
  playerAssists: number,
  playerApps: number,
  playerRating: number,
  playerClubId: string,
  playerClubName: string,
  seasonNumber: number,
  leagueId: string,
  leagueTable: { clubId: string; clubName: string; points: number }[],
): AwardEntry[] {
  const rng = seededRandom(seasonNumber * 7919 + 104729);
  const leagueClubs = getClubsByLeague(leagueId).filter(c => c.id !== playerClubId);
  const leagueInfo = getLeagueById(leagueId);

  const awards: AwardEntry[] = [];

  // ----- Golden Boot -----
  const goldenBootCompetitorGoals = Math.max(playerGoals + seededBetween(0, 12, rng), seededBetween(15, 36, rng));
  const goldenBootCompetitorClub = pickFromSeeded(leagueClubs, rng);
  const goldenBootCompetitorName = generateCompetitorName(rng);
  const playerWinsGoldenBoot = playerGoals >= goldenBootCompetitorGoals && playerGoals > 0;

  awards.push({
    id: 'golden_boot',
    name: 'Golden Boot',
    category: 'Top Scorer Award',
    description: playerWinsGoldenBoot
      ? 'An exceptional season of finishing. Goals from everywhere on the pitch.'
      : 'Awarded to the league\'s most prolific goal scorer this season.',
    winnerName: playerWinsGoldenBoot ? playerName : goldenBootCompetitorName,
    winnerClub: playerWinsGoldenBoot ? playerClubName : goldenBootCompetitorClub?.name ?? 'Unknown',
    winnerStats: playerWinsGoldenBoot
      ? `${playerGoals} Goals / ${playerApps} Apps`
      : `${goldenBootCompetitorGoals} Goals / ${seededBetween(28, 38, rng)} Apps`,
    isPlayer: playerWinsGoldenBoot,
    color: playerWinsGoldenBoot ? '#10B981' : '#F59E0B',
    accentBg: playerWinsGoldenBoot ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
    icon: <TrophySVG color={playerWinsGoldenBoot ? '#10B981' : '#F59E0B'} />,
  });

  // ----- Player of the Season -----
  const potSCompetitorRating = Math.min(10, Math.max(playerRating + (rng() > 0.5 ? seededBetween(1, 8, rng) * 0.1 : -seededBetween(1, 5, rng) * 0.1), 6.5));
  const potSCompetitorClub = pickFromSeeded(leagueClubs, rng);
  const potSCompetitorName = generateCompetitorName(rng);
  const playerWinsPotS = playerRating >= potSCompetitorRating && playerApps >= 20;

  awards.push({
    id: 'player_of_season',
    name: 'Player of the Season',
    category: 'Best Overall Performer',
    description: playerWinsPotS
      ? 'Consistently outstanding performances throughout the campaign. A true difference-maker.'
      : 'The most influential player in the league this season, as voted by peers and pundits.',
    winnerName: playerWinsPotS ? playerName : potSCompetitorName,
    winnerClub: playerWinsPotS ? playerClubName : potSCompetitorClub?.name ?? 'Unknown',
    winnerStats: playerWinsPotS
      ? `Avg Rating ${playerRating.toFixed(1)} / ${playerApps} Apps`
      : `Avg Rating ${potSCompetitorRating.toFixed(1)} / ${seededBetween(30, 38, rng)} Apps`,
    isPlayer: playerWinsPotS,
    color: playerWinsPotS ? '#10B981' : '#8B5CF6',
    accentBg: playerWinsPotS ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
    icon: <MedalSVG color={playerWinsPotS ? '#10B981' : '#8B5CF6'} />,
  });

  // ----- Young Player of the Year -----
  const youngPlayerQualifies = playerAge < 21;
  const ypCompetitorName = generateCompetitorName(rng);
  const ypCompetitorClub = pickFromSeeded(leagueClubs, rng);
  const ypCompetitorAge = seededBetween(18, 20, rng);
  const ypCompetitorRating = seededBetween(68, 88, rng);
  const playerWinsYP = youngPlayerQualifies && playerOverall >= ypCompetitorRating;

  awards.push({
    id: 'young_player',
    name: 'Young Player of the Year',
    category: 'Best U21 Player',
    description: playerWinsYP
      ? `At just ${playerAge} years old, a remarkable breakthrough campaign. The future is now.`
      : `Outstanding potential realised at just ${ypCompetitorAge}. A star in the making.`,
    winnerName: playerWinsYP ? playerName : ypCompetitorName,
    winnerClub: playerWinsYP ? playerClubName : ypCompetitorClub?.name ?? 'Unknown',
    winnerStats: playerWinsYP
      ? `Age ${playerAge} / OVR ${playerOverall}`
      : `Age ${ypCompetitorAge} / OVR ${ypCompetitorRating}`,
    isPlayer: playerWinsYP,
    color: playerWinsYP ? '#10B981' : '#3B82F6',
    accentBg: playerWinsYP ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
    icon: <StarSVG color={playerWinsYP ? '#10B981' : '#3B82F6'} size={20} />,
  });

  // ----- Goal of the Season -----
  const goalDescriptions = [
    'A stunning 30-yard volley into the top corner',
    'An audacious solo run from the halfway line, beating four defenders',
    'A perfectly executed bicycle kick from the edge of the box',
    'A curling free kick over the wall in stoppage time',
    'A breathtaking rabona finish from an impossible angle',
    'A powerful header from 12 yards out, thumping into the net',
    'A delicate chip over the keeper after a one-two',
    'A long-range rocket that swerved into the top bin',
  ];
  const goalOfSeason = pickFromSeeded(goalDescriptions, rng);
  const playerScoredGoalOfSeason = playerGoals >= 5 && rng() > 0.35;
  const gotCompetitorName = generateCompetitorName(rng);
  const gotCompetitorClub = pickFromSeeded(leagueClubs, rng);
  const gotMatchweek = seededBetween(3, 36, rng);

  awards.push({
    id: 'goal_of_season',
    name: 'Goal of the Season',
    category: 'Best Individual Goal',
    description: goalOfSeason,
    winnerName: playerScoredGoalOfSeason ? playerName : gotCompetitorName,
    winnerClub: playerScoredGoalOfSeason ? playerClubName : gotCompetitorClub?.name ?? 'Unknown',
    winnerStats: `Matchweek ${gotMatchweek}`,
    isPlayer: playerScoredGoalOfSeason,
    color: playerScoredGoalOfSeason ? '#10B981' : '#F97316',
    accentBg: playerScoredGoalOfSeason ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
    icon: <Flame className="w-5 h-5" style={{ color: playerScoredGoalOfSeason ? '#10B981' : '#F97316' }} />,
  });

  // ----- Team of the Season -----
  const sortedTable = [...leagueTable].sort((a, b) => b.points - a.points);
  const teamOfSeasonClub = sortedTable[0];
  const teamOfSeasonPoints = teamOfSeasonClub?.points ?? 0;
  const playerClubInTable = sortedTable.find(c => c.clubId === playerClubId);
  const playerWinsTeam = !!(playerClubInTable && playerClubInTable.clubId === teamOfSeasonClub?.clubId);
  const teamClubData = getClubById(teamOfSeasonClub?.clubId ?? '');

  awards.push({
    id: 'team_of_season',
    name: 'Team of the Season',
    category: 'League Champions',
    description: playerWinsTeam
      ? 'An incredible collective effort. Every player contributed to this historic title win.'
      : `Dominant performances week in, week out. ${teamOfSeasonPoints} points — a campaign for the ages.`,
    winnerName: playerWinsTeam ? playerClubName : (teamClubData?.name ?? teamOfSeasonClub?.clubName ?? 'Unknown'),
    winnerClub: leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League',
    winnerStats: `${teamOfSeasonPoints} Points`,
    isPlayer: playerWinsTeam,
    color: playerWinsTeam ? '#10B981' : '#F59E0B',
    accentBg: playerWinsTeam ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
    icon: <Users className="w-5 h-5" style={{ color: playerWinsTeam ? '#10B981' : '#F59E0B' }} />,
  });

  // ----- Manager of the Season -----
  const managerNames = [
    'Carlos Ancelotti', 'Ralf Rangnick', 'Diego Simeone',
    'Thomas Tuchel', 'Mikel Arteta', 'Jurgen Klopp',
    'Pep Guardiola', 'Antonio Conte', 'Xavi Hernandez',
    'Mauricio Pochettino', 'Erik ten Hag', 'Ole Gunnar Solskjaer',
  ];
  const managerOfSeasonName = pickFromSeeded(managerNames, rng);
  const managerClub = sortedTable[0];
  const managerClubData = getClubById(managerClub?.clubId ?? '');
  const playerClubIsChampion = playerClubInTable && playerClubInTable.clubId === managerClub?.clubId;

  awards.push({
    id: 'manager_of_season',
    name: 'Manager of the Season',
    category: 'Best Manager',
    description: playerClubIsChampion
      ? `Tactical genius behind the title triumph. Masterclass in man-management.`
      : `Exceptional tactical awareness and leadership throughout the campaign.`,
    winnerName: managerOfSeasonName,
    winnerClub: managerClubData?.name ?? 'Unknown',
    winnerStats: `${managerClub?.points ?? 0} Points / ${leagueInfo?.name ?? 'League'}`,
    isPlayer: false,
    color: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.1)',
    icon: <Crown className="w-5 h-5" style={{ color: '#F59E0B' }} />,
  });

  return awards;
}

// ============================================================
// Animation variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ============================================================
// SVG text anchor constants (type assertions)
// ============================================================

const ANCHOR_START = "start" as "start" | "middle" | "end";
const ANCHOR_MIDDLE = "middle" as "start" | "middle" | "end";
const ANCHOR_END = "end" as "start" | "middle" | "end";

// ============================================================
// Section card wrapper
// ============================================================

function SectionCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-[#30363d] overflow-hidden" style={{ backgroundColor: '#161b22' }}>
      <div
        className="px-4 py-3 flex items-center gap-2 border-b border-[#30363d]/60"
        style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
      >
        {icon}
        <span className="text-xs font-bold text-[#c9d1d9] uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ============================================================
// SVG Visualization Components
// ============================================================

// ----- 1. Awards Won Progress Ring -----
function AwardsWonProgressRing({ won, total }: { won: number; total: number }): React.JSX.Element {
  const pct = total > 0 ? won / total : 0;
  const radius = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const ringColor = pct >= 0.5 ? '#10B981' : pct > 0 ? '#F59E0B' : '#484f58';

  return (
    <SectionCard title="Awards Won" icon={<Trophy className="w-4 h-4 text-amber-400" />}>
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 120 120" className="w-32 h-32">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth="8" />
          <circle
            cx={cx} cy={cy} r={radius} fill="none"
            stroke={ringColor} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 4} textAnchor={ANCHOR_MIDDLE} fill="#e6edf3" fontSize="28" fontWeight="900">
            {won}
          </text>
          <text x={cx} y={cy + 16} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="10">
            of {total}
          </text>
        </svg>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: ringColor }} />
          <p className="text-[11px] text-[#8b949e]">{Math.round(pct * 100)}% completion rate</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ----- 2. Award Category Distribution Donut -----
function AwardCategoryDonut({ segments }: {
  segments: { label: string; count: number; color: string }[];
}): React.JSX.Element {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const cx = 80;
  const cy = 70;
  const outerR = 50;
  const innerR = 32;

  const arcData = segments.reduce<{ d: string; color: string; label: string; count: number; endAngle: number }[]>(
    (acc, seg) => {
      if (seg.count <= 0) return acc;
      const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
      const span = (seg.count / total) * 360;
      const endAngle = startAngle + span;
      const clampedEnd = endAngle >= 360 ? 359.9 : endAngle;
      const d = donutSegmentPath(cx, cy, outerR, innerR, startAngle, clampedEnd);
      return [...acc, { d, color: seg.color, label: seg.label, count: seg.count, endAngle }];
    },
    [],
  );

  return (
    <SectionCard title="Category Breakdown" icon={<Target className="w-4 h-4 text-blue-400" />}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 160 140" className="w-36 h-32 shrink-0">
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#21262d" strokeWidth={outerR - innerR} />
          ) : (
            arcData.map((arc, i) => (
              <path key={i} d={arc.d} fill={arc.color} fillOpacity="0.8" />
            ))
          )}
          {total > 0 && (
            <text x={cx} y={cy - 4} textAnchor={ANCHOR_MIDDLE} fill="#e6edf3" fontSize="20" fontWeight="900">
              {total}
            </text>
          )}
          {total > 0 && (
            <text x={cx} y={cy + 12} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="8">
              total
            </text>
          )}
        </svg>
        <div className="flex flex-col gap-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-[#c9d1d9] whitespace-nowrap">{seg.label}</span>
              <span className="text-[10px] text-[#8b949e] font-semibold">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ----- 3. Historical Awards Trend (Area Chart) -----
function HistoricalAwardsTrend({ data }: {
  data: { season: number; awards: number }[];
}): React.JSX.Element {
  const maxVal = Math.max(1, ...data.map(d => d.awards));
  const w = 300;
  const h = 140;
  const pL = 30;
  const pR = 10;
  const pT = 12;
  const pB = 24;
  const plotW = w - pL - pR;
  const plotH = h - pT - pB;
  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const xPos = (i: number) => pL + i * xStep;
  const yPos = (v: number) => pT + plotH - (v / maxVal) * plotH;

  const areaPath = data.reduce((acc, pt, i) => {
    const x = xPos(i);
    const y = yPos(pt.awards);
    if (i === 0) return `M ${x} ${pT + plotH} L ${x} ${y}`;
    return `${acc} L ${x} ${y}`;
  }, '') + ` L ${xPos(data.length - 1)} ${pT + plotH} Z`;

  const linePath = data.reduce((acc, pt, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${xPos(i)} ${yPos(pt.awards)}`;
  }, '');

  return (
    <SectionCard title="Career Awards Trend" icon={<Flame className="w-4 h-4 text-orange-400" />}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = pT + plotH - frac * plotH;
          return (
            <line key={i} x1={pL} y1={y} x2={pL + plotW} y2={y} stroke="#21262d" strokeWidth="0.5" />
          );
        })}
        <path d={areaPath} fill="#10B981" fillOpacity="0.15" />
        <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((pt, i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={yPos(pt.awards)} r="3" fill="#161b22" stroke="#10B981" strokeWidth="1.5" />
            <text x={xPos(i)} y={h - 6} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="7">
              S{pt.season}
            </text>
            <text x={xPos(i)} y={yPos(pt.awards) - 8} textAnchor={ANCHOR_MIDDLE} fill="#c9d1d9" fontSize="8" fontWeight="bold">
              {pt.awards}
            </text>
          </g>
        ))}
      </svg>
    </SectionCard>
  );
}

// ----- 4. Award Competitiveness Gauge -----
function AwardCompetitivenessGauge({ score }: { score: number }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, score));
  const cx = 100;
  const cy = 90;
  const r = 60;
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const valPath = gaugeArcPath(cx, cy, r, clamped);
  const gaugeColor = clamped >= 70 ? '#10B981' : clamped >= 40 ? '#F59E0B' : '#EF4444';
  const label = clamped >= 70 ? 'Highly Competitive' : clamped >= 40 ? 'Moderate Race' : 'One-Sided';

  return (
    <SectionCard title="Competitiveness" icon={<Zap className="w-4 h-4 text-amber-400" />}>
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
          <path d={bgPath} fill="none" stroke="#21262d" strokeWidth="10" strokeLinecap="round" />
          <path d={valPath} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const angle = Math.PI * (1 + tick / 100);
            const tx = cx + (r + 10) * Math.cos(angle);
            const ty = cy + (r + 10) * Math.sin(angle);
            return (
              <text key={i} x={tx} y={ty + 3} textAnchor={ANCHOR_MIDDLE} fill="#484f58" fontSize="8">
                {tick}
              </text>
            );
          })}
          <text x={cx} y={cy - 8} textAnchor={ANCHOR_MIDDLE} fill="#e6edf3" fontSize="22" fontWeight="900">
            {clamped}
          </text>
          <text x={cx} y={cy + 10} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="9">
            / 100
          </text>
        </svg>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: gaugeColor }} />
          <p className="text-[11px] font-semibold" style={{ color: gaugeColor }}>{label}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ----- 5. Season Performance vs Awards Bars -----
function SeasonPerformanceBars({ bars }: {
  bars: { label: string; value: number; threshold: number; color: string }[];
}): React.JSX.Element {
  const maxVal = Math.max(1, ...bars.map(b => Math.max(b.value, b.threshold)));
  const barH = 16;
  const gap = 22;
  const labelW = 72;
  const barAreaW = 180;
  const svgW = labelW + barAreaW + 10;
  const svgH = bars.length * gap + 8;

  return (
    <SectionCard title="Performance vs Thresholds" icon={<Award className="w-4 h-4 text-emerald-400" />}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        {bars.map((bar, i) => {
          const y = i * gap + 2;
          const valW = Math.max(0, (bar.value / maxVal) * barAreaW);
          const threshX = labelW + (bar.threshold / maxVal) * barAreaW;
          return (
            <g key={i}>
              <text x={0} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill="#c9d1d9" fontSize="9">
                {bar.label}
              </text>
              {/* Background bar */}
              <rect x={labelW} y={y} width={barAreaW} height={barH} rx="3" fill="#21262d" />
              {/* Value bar */}
              <rect x={labelW} y={y} width={valW} height={barH} rx="3" fill={bar.color} fillOpacity="0.8" />
              {/* Threshold marker */}
              <line x1={threshX} y1={y - 2} x2={threshX} y2={y + barH + 2} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Value text */}
              <text x={labelW + barAreaW + 6} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill="#8b949e" fontSize="8">
                {bar.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: '#10B981' }} />
          <span className="text-[9px] text-[#8b949e]">Your stats</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0 border-t border-dashed border-amber-500" />
          <span className="text-[9px] text-[#8b949e]">Award threshold</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ----- 6. Award Points Leaderboard -----
function AwardPointsLeaderboard({ entries }: {
  entries: { name: string; points: number; isPlayer: boolean }[];
}): React.JSX.Element {
  const maxPoints = Math.max(1, ...entries.map(e => e.points));
  const barH = 14;
  const gap = 24;
  const nameW = 90;
  const barAreaW = 150;
  const svgW = nameW + barAreaW + 36;
  const svgH = entries.length * gap + 8;

  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);

  return (
    <SectionCard title="Award Points Leaderboard" icon={<Users className="w-4 h-4 text-blue-400" />}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        {sortedEntries.map((entry, i) => {
          const y = i * gap + 2;
          const barW = Math.max(0, (entry.points / maxPoints) * barAreaW);
          const barColor = entry.isPlayer ? '#10B981' : '#3B82F6';
          const textColor = entry.isPlayer ? '#e6edf3' : '#c9d1d9';
          return (
            <g key={i}>
              <text x={0} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill={textColor} fontSize="9" fontWeight={entry.isPlayer ? 'bold' : 'normal'}>
                {i + 1}. {entry.name.length > 14 ? entry.name.slice(0, 13) + '\u2026' : entry.name}
              </text>
              <rect x={nameW} y={y} width={barAreaW} height={barH} rx="3" fill="#21262d" />
              <rect x={nameW} y={y} width={barW} height={barH} rx="3" fill={barColor} fillOpacity={entry.isPlayer ? 0.9 : 0.5} />
              <text x={nameW + barAreaW + 6} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill="#8b949e" fontSize="8">
                {entry.points}
              </text>
            </g>
          );
        })}
      </svg>
    </SectionCard>
  );
}

// ----- 7. Nomination Streak Timeline -----
function NominationStreakTimeline({ streaks }: {
  streaks: { season: number; status: 'won' | 'nominated' | 'missed' }[];
}): React.JSX.Element {
  const dotR = 8;
  const gap = 48;
  const svgW = (streaks.length - 1) * gap + 40;
  const svgH = 64;
  const startX = 20;
  const cy = 26;

  const statusColor = (status: string) => {
    if (status === 'won') return '#10B981';
    if (status === 'nominated') return '#F59E0B';
    return '#484f58';
  };

  return (
    <SectionCard title="Nomination Streak" icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        {/* Connecting line */}
        <line x1={startX} y1={cy} x2={startX + (streaks.length - 1) * gap} y2={cy} stroke="#21262d" strokeWidth="2" />
        {streaks.map((streak, i) => {
          const x = startX + i * gap;
          const color = statusColor(streak.status);
          return (
            <g key={i}>
              <circle cx={x} cy={cy} r={dotR} fill={color} fillOpacity={streak.status === 'missed' ? 0.3 : 0.8} stroke={color} strokeWidth="1.5" />
              {streak.status === 'won' && (
                <text x={x} y={cy + 1} textAnchor={ANCHOR_MIDDLE} fill="#0d1117" fontSize="8" fontWeight="900">
                  W
                </text>
              )}
              {streak.status === 'nominated' && (
                <text x={x} y={cy + 1} textAnchor={ANCHOR_MIDDLE} fill="#0d1117" fontSize="8" fontWeight="900">
                  N
                </text>
              )}
              {streak.status === 'missed' && (
                <text x={x} y={cy + 1} textAnchor={ANCHOR_MIDDLE} fill="#484f58" fontSize="8" fontWeight="900">
                  M
                </text>
              )}
              <text x={x} y={cy + dotR + 14} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="8">
                S{streak.season}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#10B981' }} />
          <span className="text-[9px] text-[#8b949e]">Won</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-[9px] text-[#8b949e]">Nominated</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#484f58' }} />
          <span className="text-[9px] text-[#8b949e]">Missed</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ----- 8. Player Award Radar -----
function PlayerAwardRadar({ axes }: {
  axes: { label: string; value: number }[];
}): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const maxR = 70;
  const sides = axes.length;
  const gridLevels = [20, 40, 60, 80, 100];

  const dataPoints = buildPolygonPoints(cx, cy, axes.map(a => a.value), maxR);

  return (
    <SectionCard title="Player Performance Radar" icon={<Star className="w-4 h-4 text-purple-400" />}>
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 200 200" className="w-44 h-44">
          {/* Grid pentagons */}
          {gridLevels.map((pct, i) => (
            <polygon
              key={i}
              points={buildGridPolygon(cx, cy, (pct / 100) * maxR, sides)}
              fill="none" stroke="#21262d" strokeWidth="0.5"
            />
          ))}
          {/* Axis lines */}
          {Array.from({ length: sides }).map((_, i) => {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const ex = cx + maxR * Math.cos(angle);
            const ey = cy + maxR * Math.sin(angle);
            return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#21262d" strokeWidth="0.5" />;
          })}
          {/* Data polygon */}
          <polygon points={dataPoints} fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
          {/* Data points */}
          {axes.map((axis, i) => {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const r = (axis.value / 100) * maxR;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            return <circle key={i} cx={px} cy={py} r="3" fill="#10B981" />;
          })}
          {/* Labels */}
          {axes.map((axis, i) => {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const lx = cx + (maxR + 16) * Math.cos(angle);
            const ly = cy + (maxR + 16) * Math.sin(angle);
            const anchor = Math.abs(Math.cos(angle)) < 0.15
              ? ANCHOR_MIDDLE
              : Math.cos(angle) > 0
                ? ANCHOR_START
                : ANCHOR_END;
            return (
              <text key={i} x={lx} y={ly + 3} textAnchor={anchor} fill="#8b949e" fontSize="9">
                {axis.label}
              </text>
            );
          })}
        </svg>
        <p className="text-[10px] text-[#8b949e]">
          Avg: {Math.round(axes.reduce((s, a) => s + a.value, 0) / axes.length)}/100
        </p>
      </div>
    </SectionCard>
  );
}

// ----- 9. Career Awards Projection -----
function CareerAwardsProjection({ data, playerName }: {
  data: { season: number; awards: number }[];
  playerName: string;
}): React.JSX.Element {
  const maxVal = Math.max(1, ...data.map(d => d.awards));
  const w = 300;
  const h = 140;
  const pL = 35;
  const pR = 10;
  const pT = 12;
  const pB = 24;
  const plotW = w - pL - pR;
  const plotH = h - pT - pB;
  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const xPos = (i: number) => pL + i * xStep;
  const yPos = (v: number) => pT + plotH - (v / maxVal) * plotH;

  const actualPath = data.slice(0, 2).reduce((acc, pt, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${xPos(i)} ${yPos(pt.awards)}`;
  }, '');

  const projectedPath = data.slice(1).reduce((acc, pt, idx) => {
    const i = idx + 1;
    const cmd = idx === 0 ? 'M' : 'L';
    return `${acc} ${cmd} ${xPos(i)} ${yPos(pt.awards)}`;
  }, '');

  return (
    <SectionCard title="Career Projection" icon={<Crown className="w-4 h-4 text-amber-400" />}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = pT + plotH - frac * plotH;
          return (
            <line key={i} x1={pL} y1={y} x2={pL + plotW} y2={y} stroke="#21262d" strokeWidth="0.5" />
          );
        })}
        <path d={actualPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d={projectedPath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 3" strokeOpacity="0.5" />
        {data.map((pt, i) => {
          const x = xPos(i);
          const y = yPos(pt.awards);
          const isActual = i <= 1;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={isActual ? 4 : 3} fill={isActual ? '#10B981' : '#161b22'} stroke="#10B981" strokeWidth={isActual ? 0 : 1.5} />
              <text x={x} y={h - 6} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="7">
                S{pt.season}
              </text>
              <text x={x} y={y - 9} textAnchor={ANCHOR_MIDDLE} fill="#c9d1d9" fontSize="8" fontWeight="bold">
                {pt.awards}
              </text>
            </g>
          );
        })}
        {/* Y axis label */}
        <text x={pL - 4} y={pT + 4} textAnchor={ANCHOR_END} fill="#484f58" fontSize="7">
          {maxVal}
        </text>
        <text x={pL - 4} y={pT + plotH + 4} textAnchor={ANCHOR_END} fill="#484f58" fontSize="7">
          0
        </text>
      </svg>
      <p className="text-[10px] text-[#8b949e] mt-1 text-center">
        {playerName}&apos;s projected award trajectory
      </p>
    </SectionCard>
  );
}

// ----- 10. Award Rarity Classification Bars -----
function AwardRarityBars({ bars }: {
  bars: { label: string; count: number; color: string; desc: string }[];
}): React.JSX.Element {
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const barH = 18;
  const gap = 28;
  const labelW = 68;
  const barAreaW = 160;
  const svgW = labelW + barAreaW + 10;
  const svgH = bars.length * gap + 8;

  return (
    <SectionCard title="Award Rarity" icon={<Medal className="w-4 h-4 text-purple-400" />}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        {bars.map((bar, i) => {
          const y = i * gap + 2;
          const barW = Math.max(0, (bar.count / maxCount) * barAreaW);
          return (
            <g key={i}>
              <text x={0} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill="#c9d1d9" fontSize="9" fontWeight="bold">
                {bar.label}
              </text>
              <rect x={labelW} y={y} width={barAreaW} height={barH} rx="3" fill="#21262d" />
              <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill={bar.color} fillOpacity="0.75" />
              <text x={labelW + barW + 6} y={y + barH / 2 + 3} textAnchor={ANCHOR_START} fill="#8b949e" fontSize="8">
                {bar.count}
              </text>
              <text x={labelW + barAreaW + 6} y={y + barH / 2 + 3} textAnchor={ANCHOR_END} fill="#484f58" fontSize="7">
                {bar.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </SectionCard>
  );
}

// ----- 11. Awards Ceremony Countdown Ring -----
function AwardsCeremonyCountdownRing({ daysLeft }: { daysLeft: number }): React.JSX.Element {
  const totalDays = 30;
  const pct = Math.max(0, Math.min(1, daysLeft / totalDays));
  const radius = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const urgency = pct >= 0.8 ? '#EF4444' : pct >= 0.5 ? '#F59E0B' : '#10B981';
  const urgencyLabel = pct >= 0.8 ? 'Coming Soon!' : pct >= 0.5 ? 'Approaching' : 'Plenty of Time';

  return (
    <SectionCard title="Ceremony Countdown" icon={<Fingerprint className="w-4 h-4 text-blue-400" />}>
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 120 120" className="w-32 h-32">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth="6" />
          <circle
            cx={cx} cy={cy} r={radius} fill="none"
            stroke={urgency} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 2} textAnchor={ANCHOR_MIDDLE} fill="#e6edf3" fontSize="24" fontWeight="900">
            {daysLeft}
          </text>
          <text x={cx} y={cy + 14} textAnchor={ANCHOR_MIDDLE} fill="#8b949e" fontSize="9">
            days left
          </text>
        </svg>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: urgency }} />
          <p className="text-[11px] font-semibold" style={{ color: urgency }}>{urgencyLabel}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SeasonAwards(): React.JSX.Element {
  const { gameState, setScreen } = useGameStore();
  const [revealedIndex, setRevealedIndex] = useState(-1);

  const awards = useMemo(() => {
    if (!gameState || !gameState.player?.seasonStats) return [];
    const { player, currentClub, currentSeason, leagueTable } = gameState;
    const ss = player.seasonStats;
    return generateSeasonAwards(
      player.name,
      player.age,
      player.overall,
      ss.goals,
      ss.assists,
      ss.appearances,
      ss.averageRating,
      currentClub.id,
      currentClub.name,
      currentSeason,
      currentClub.league,
      leagueTable,
    );
  }, [gameState]);

  const playerAwardCount = useMemo(
    () => awards.filter(a => a.isPlayer).length,
    [awards],
  );

  const careerAwardCount = useMemo(() => {
    if (!gameState) return 0;
    const allSeasonAwards = gameState.seasonAwards ?? [];
    return allSeasonAwards.length;
  }, [gameState]);

  const motivationalMessage = useMemo(() => {
    if (playerAwardCount === 0) return { text: 'Keep pushing. Your time will come.', color: '#8b949e' };
    if (playerAwardCount === 1) return { text: 'A solid achievement. Build on this next season.', color: '#F59E0B' };
    if (playerAwardCount === 2) return { text: 'Excellent season! You\'re among the elite.', color: '#10B981' };
    if (playerAwardCount >= 3) return { text: 'Legendary campaign. Your name will be remembered.', color: '#FFD700' };
    return { text: 'A season to remember.', color: '#8b949e' };
  }, [playerAwardCount]);

  if (!gameState) return <></>;

  const { player, currentClub, currentSeason } = gameState;
  const leagueInfo = getLeagueById(currentClub.league);

  // ---- Derived data for SVG visualizations ----
  const categorySegments = [
    { label: 'Scorer', categories: ['Top Scorer Award'], color: '#10B981' },
    { label: 'Player', categories: ['Best Overall Performer', 'Best U21 Player'], color: '#3B82F6' },
    { label: 'Goal', categories: ['Best Individual Goal'], color: '#F97316' },
    { label: 'Team', categories: ['League Champions', 'Best Manager'], color: '#8B5CF6' },
  ].map(g => ({
    label: g.label,
    count: awards.reduce((s, a) => s + (g.categories.includes(a.category) ? 1 : 0), 0),
    color: g.color,
  }));

  const historicalData = Array.from({ length: 8 }, (_, i) => {
    const season = currentSeason - 7 + i;
    const isCurrent = i === 7;
    const baseAwards = careerAwardCount > 0
      ? Math.max(0, Math.floor((careerAwardCount * (i + 1)) / 8) + ((season * 13 + 7) % 3) - 1)
      : 0;
    return { season, awards: isCurrent ? playerAwardCount : baseAwards };
  });

  const competitivenessScore = awards.length > 0
    ? Math.min(100, Math.round((playerAwardCount / awards.length) * 70 + ((currentSeason * 17 + 11) % 30) + 10))
    : 50;

  const performanceBars = [
    { label: 'Goals', value: player.seasonStats?.goals ?? 0, threshold: 15, color: '#10B981' },
    { label: 'Assists', value: player.seasonStats?.assists ?? 0, threshold: 10, color: '#3B82F6' },
    { label: 'Rating', value: Math.round((player.seasonStats?.averageRating ?? 0) * 10), threshold: 70, color: '#F59E0B' },
    { label: 'Appearances', value: player.seasonStats?.appearances ?? 0, threshold: 30, color: '#8B5CF6' },
    { label: 'Clean Sheets', value: ((currentSeason * 7 + 5) % 8), threshold: 5, color: '#EF4444' },
  ];

  const playerScore = Math.floor(playerAwardCount * 25 + (player.seasonStats?.averageRating ?? 7) * 3);
  const competitorEntries = Array.from({ length: 7 }, (_, i) => {
    const rng = seededRandom(currentSeason * 1000 + i * 137);
    return { name: generateCompetitorName(rng), points: Math.floor(rng() * 60 + 20), isPlayer: false };
  });
  const leaderboardEntries = [...competitorEntries, { name: player.name ?? 'Player', points: playerScore, isPlayer: true }];

  const nominationStreak = Array.from({ length: 6 }, (_, i) => {
    const season = currentSeason - 5 + i;
    const isCurrent = i === 5;
    if (isCurrent) {
      return { season, status: (playerAwardCount > 0 ? 'won' : 'missed') as 'won' | 'nominated' | 'missed' };
    }
    const seed = season * 31 + 17;
    const mod = seed % 7;
    const status = mod < 2 ? 'won' as const : mod < 4 ? 'nominated' as const : 'missed' as const;
    return { season, status };
  });

  const radarAxes = [
    { label: 'Goals', value: Math.min(100, Math.round(((player.seasonStats?.goals ?? 0) / 25) * 100)) },
    { label: 'Assists', value: Math.min(100, Math.round(((player.seasonStats?.assists ?? 0) / 15) * 100)) },
    { label: 'Rating', value: Math.min(100, Math.round(((player.seasonStats?.averageRating ?? 0) / 10) * 100)) },
    { label: 'Consistency', value: Math.min(100, Math.round(((player.seasonStats?.appearances ?? 0) / 38) * 100)) },
    { label: 'Impact', value: Math.min(100, Math.round((((player.seasonStats?.goals ?? 0) + (player.seasonStats?.assists ?? 0)) / 30) * 100)) },
  ];

  const projectionData = Array.from({ length: 6 }, (_, i) => {
    const season = currentSeason + i;
    const base = careerAwardCount + playerAwardCount;
    const projected = i === 0
      ? base
      : base + Math.floor(((season - currentSeason) * (careerAwardCount + 1)) / 3) + ((season * 7 + 3) % 3);
    return { season, awards: projected };
  });

  const rarityBars = [
    { label: 'Common', color: '#64748b', desc: 'Frequent', predicate: (a: AwardEntry) => a.isPlayer },
    { label: 'Uncommon', color: '#3B82F6', desc: 'Competitive', predicate: (a: AwardEntry) => !a.isPlayer && (a.category.includes('Scorer') || a.category.includes('Overall')) },
    { label: 'Rare', color: '#8B5CF6', desc: 'Special', predicate: (a: AwardEntry) => !a.isPlayer && (a.category.includes('U21') || a.category.includes('Goal')) },
    { label: 'Legendary', color: '#F59E0B', desc: 'Elite', predicate: (a: AwardEntry) => !a.isPlayer && (a.category.includes('Champions') || a.category.includes('Manager')) },
  ].map(r => ({
    label: r.label,
    color: r.color,
    desc: r.desc,
    count: awards.reduce((s, a) => s + (r.predicate(a) ? 1 : 0), 0),
  }));

  const daysUntilCeremony = ((currentSeason * 37 + 13) % 28) + 3;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* ============================================ */}
      {/* Header Section */}
      {/* ============================================ */}
      <div className="relative overflow-hidden">
        {/* Decorative background dots */}
        <div className="absolute inset-0 opacity-[0.03]">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 2,
                height: 2,
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative px-4 pt-8 pb-6 text-center">
          {/* Crown icon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-lg mx-auto mb-4"
              style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-3xl font-black tracking-tight text-white"
          >
            SEASON AWARDS
          </motion.h1>

          {/* Season badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="mt-3"
          >
            <Badge
              className="text-xs px-3 py-1 font-semibold"
              style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Trophy className="w-3 h-3 mr-1.5" />
              Season {currentSeason} Awards
            </Badge>
          </motion.div>

          {/* League + Club subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="text-sm text-[#8b949e] mt-2"
          >
            {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League'} &middot; {currentClub.logo} {currentClub.name}
          </motion.p>

          {/* Decorative stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="mt-4 flex items-center justify-center gap-6"
          >
            <StarSVG color="#F59E0B" size={10} />
            <StarSVG color="#F59E0B" size={16} />
            <StarSVG color="#FFD700" size={12} />
            <StarSVG color="#F59E0B" size={16} />
            <StarSVG color="#F59E0B" size={10} />
          </motion.div>
        </div>
      </div>

      {/* ============================================ */}
      {/* Award Cards */}
      {/* ============================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 pb-4 space-y-3"
      >
        {awards.map((award, index) => {
          const isRevealed = revealedIndex >= index;
          const isPlayerWinner = award.isPlayer;

          return (
            <motion.div key={award.id} variants={itemVariants}>
              <div
                className="relative overflow-hidden rounded-lg border"
                style={{
                  backgroundColor: isRevealed ? (isPlayerWinner ? 'rgba(16,185,129,0.04)' : '#161b22') : '#161b22',
                  borderColor: isRevealed
                    ? (isPlayerWinner ? 'rgba(16,185,129,0.25)' : 'rgba(48,54,61,0.8)')
                    : 'rgba(48,54,61,0.6)',
                }}
                onClick={() => setRevealedIndex(prev => (prev === index ? -1 : index))}
              >
                {/* Winner highlight strip */}
                {isRevealed && isPlayerWinner && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: '#10B981' }}
                  />
                )}

                <div className="p-4">
                  {/* Top row: icon + award name + tap indicator */}
                  <div className="flex items-start gap-3">
                    {/* Award icon */}
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: award.accentBg }}
                    >
                      {award.icon}
                    </div>

                    {/* Award info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#c9d1d9]">{award.name}</h3>
                        <ChevronRight
                          className={`w-4 h-4 text-[#484f58] transition-opacity ${isRevealed ? 'opacity-100 text-amber-400' : 'opacity-50'}`}
                        />
                      </div>
                      <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-0.5">
                        {award.category}
                      </p>
                    </div>
                  </div>

                  {/* Revealed content */}
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-[#30363d]/60 space-y-2.5"
                    >
                      {/* Winner badge */}
                      <div className="flex items-center gap-2">
                        <Badge
                          className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: isPlayerWinner ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)',
                            color: isPlayerWinner ? '#10B981' : '#F59E0B',
                            border: `1px solid ${isPlayerWinner ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)'}`,
                          }}
                        >
                          <StarSVG color={isPlayerWinner ? '#10B981' : '#F59E0B'} size={8} />
                          <span className="ml-1">
                            {isPlayerWinner ? 'YOU WON' : 'WINNER'}
                          </span>
                        </Badge>
                      </div>

                      {/* Winner name + club */}
                      <div>
                        <p className="text-base font-bold" style={{ color: isPlayerWinner ? '#10B981' : '#e6edf3' }}>
                          {award.winnerName}
                        </p>
                        <p className="text-xs text-[#8b949e] mt-0.5">
                          {award.winnerClub}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#8b949e] leading-relaxed">
                        {award.description}
                      </p>

                      {/* Stats row */}
                      <div
                        className="rounded-md px-3 py-2 flex items-center gap-2"
                        style={{ backgroundColor: 'rgba(13,17,23,0.6)', border: '1px solid rgba(48,54,61,0.4)' }}
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: award.color }} />
                        <span className="text-xs font-semibold" style={{ color: award.color }}>
                          {award.winnerStats}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Unrevealed hint */}
                  {!isRevealed && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Tap to reveal winner</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ============================================ */}
      {/* SVG Data Visualizations */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="px-4 pb-4 space-y-4"
      >
        <AwardsWonProgressRing won={playerAwardCount} total={awards.length} />
        <AwardCategoryDonut segments={categorySegments} />
        <HistoricalAwardsTrend data={historicalData} />
        <AwardCompetitivenessGauge score={competitivenessScore} />
        <SeasonPerformanceBars bars={performanceBars} />
        <AwardPointsLeaderboard entries={leaderboardEntries} />
        <NominationStreakTimeline streaks={nominationStreak} />
        <PlayerAwardRadar axes={radarAxes} />
        <CareerAwardsProjection data={projectionData} playerName={player.name ?? 'Player'} />
        <AwardRarityBars bars={rarityBars} />
        <AwardsCeremonyCountdownRing daysLeft={daysUntilCeremony} />
      </motion.div>

      {/* ============================================ */}
      {/* Personal Awards Summary */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
        className="px-4 pb-4"
      >
        <div
          className="rounded-lg border border-[#30363d] overflow-hidden"
          style={{ backgroundColor: '#161b22' }}
        >
          {/* Section header */}
          <div
            className="px-4 py-3 flex items-center gap-2 border-b border-[#30363d]/60"
            style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-[#c9d1d9] uppercase tracking-wider">
              Your Award Summary
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Season awards */}
              <div
                className="rounded-md p-3 text-center"
                style={{ backgroundColor: 'rgba(13,17,23,0.6)', border: '1px solid rgba(48,54,61,0.4)' }}
              >
                <p className="text-2xl font-black" style={{ color: playerAwardCount > 0 ? '#10B981' : '#484f58' }}>
                  {playerAwardCount}
                </p>
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-0.5">
                  Season Awards
                </p>
              </div>

              {/* Career awards */}
              <div
                className="rounded-md p-3 text-center"
                style={{ backgroundColor: 'rgba(13,17,23,0.6)', border: '1px solid rgba(48,54,61,0.4)' }}
              >
                <p className="text-2xl font-black" style={{ color: careerAwardCount > 0 ? '#F59E0B' : '#484f58' }}>
                  {careerAwardCount}
                </p>
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-0.5">
                  Career Awards
                </p>
              </div>
            </div>

            {/* Season stats mini summary */}
            <div className="flex items-center justify-between text-xs text-[#8b949e] px-1">
              <span>
                {player.seasonStats?.goals ?? 0} Goals &middot; {player.seasonStats?.assists ?? 0} Assists
              </span>
              <span>
                {player.seasonStats?.appearances ?? 0} Apps &middot; {(player.seasonStats?.averageRating ?? 0) > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'} Avg
              </span>
            </div>

            {/* Motivational message */}
            <div
              className="rounded-md px-3 py-2.5 flex items-center gap-2"
              style={{
                backgroundColor: playerAwardCount > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(13,17,23,0.4)',
                border: `1px solid ${playerAwardCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(48,54,61,0.3)'}`,
              }}
            >
              {playerAwardCount > 0 ? (
                <StarSVG color={motivationalMessage.color} size={14} />
              ) : (
                <Fingerprint className="w-3.5 h-3.5 text-[#484f58]" />
              )}
              <p className="text-xs font-medium" style={{ color: motivationalMessage.color }}>
                {motivationalMessage.text}
              </p>
            </div>

            {/* Player info */}
            <div className="flex items-center gap-3 pt-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: `${getOverallColor(player.overall)}15`,
                  color: getOverallColor(player.overall),
                  border: `1px solid ${getOverallColor(player.overall)}30`,
                }}
              >
                {player.overall}
              </div>
              <div>
                <p className="text-sm font-bold text-[#e6edf3]">{player.name}</p>
                <p className="text-[10px] text-[#8b949e]">
                  {currentClub.logo} {currentClub.name} &middot; {player.position} &middot; Age {player.age}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* Decorative footer divider */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="flex items-center justify-center gap-2 px-4 pb-3"
      >
        <div className="h-px flex-1 bg-[#30363d]/40" />
        <StarSVG color="#F59E0B" size={8} />
        <StarSVG color="#FFD700" size={12} />
        <StarSVG color="#F59E0B" size={8} />
        <div className="h-px flex-1 bg-[#30363d]/40" />
      </motion.div>

      {/* ============================================ */}
      {/* Navigation Button */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.5 }}
        className="px-4 pb-8 pt-2"
      >
        <Button
          onClick={() => setScreen('dashboard')}
          className="w-full h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#10B981',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#10B981';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
