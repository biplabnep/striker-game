'use client';

import { useState, useMemo } from 'react';
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
// SVG Trophy component
// ============================================================

function TrophySVG({ color }: { color: string }) {
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

function StarSVG({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

// ============================================================
// SVG Medal component
// ============================================================

function MedalSVG({ color }: { color: string }) {
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
// Main Component
// ============================================================

export default function SeasonAwards() {
  const { gameState, setScreen } = useGameStore();
  const [revealedIndex, setRevealedIndex] = useState(-1);

  const awards = useMemo(() => {
    if (!gameState) return [];
    const { player, currentClub, currentSeason, leagueTable } = gameState;
    return generateSeasonAwards(
      player.name,
      player.age,
      player.overall,
      player.seasonStats.goals,
      player.seasonStats.assists,
      player.seasonStats.appearances,
      player.seasonStats.averageRating,
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

  if (!gameState) return null;

  const { player, currentClub, currentSeason } = gameState;
  const leagueInfo = getLeagueById(currentClub.league);

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
                {player.seasonStats.goals} Goals &middot; {player.seasonStats.assists} Assists
              </span>
              <span>
                {player.seasonStats.appearances} Apps &middot; {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'} Avg
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
