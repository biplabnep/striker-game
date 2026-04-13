'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Swords,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Users,
  AlertTriangle,
  Zap,
  ChevronRight,
  Trophy,
  Calendar,
  Home,
  Plane,
  Dumbbell,
  Brain,
  Heart,
  Lightbulb,
  Activity,
  Eye,
  Percent,
  MessageSquare,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { generatePlayerName } from '@/lib/game/playerData';

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
const RED_TEXT = 'text-red-400';
const RED_BG = 'bg-red-500/15';
const RED_BORDER = 'border-red-500/30';
const AMBER_TEXT = 'text-amber-400';
const AMBER_BG = 'bg-amber-500/15';
const AMBER_BORDER = 'border-amber-500/30';
const BLUE_TEXT = 'text-blue-400';
const BLUE_BG = 'bg-blue-500/15';
const BLUE_BORDER = 'border-blue-500/30';
const PURPLE_TEXT = 'text-purple-400';
const PURPLE_BG = 'bg-purple-500/15';
const PURPLE_BORDER = 'border-purple-500/30';

// ============================================================
// Opacity-only animation variants (no transforms)
// ============================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ============================================================
// Helpers & generators
// ============================================================

function getPositionSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

function deriveFormationFromPosition(position: number): string {
  if (position <= 4) return '4-3-3';
  if (position <= 8) return '4-2-3-1';
  if (position <= 12) return '4-4-2';
  if (position <= 16) return '3-5-2';
  return '5-3-2';
}

function derivePlayingStyle(position: number): string {
  if (position <= 5) return 'Attacking';
  if (position <= 14) return 'Balanced';
  return 'Defensive';
}

function generateFormGuide(
  won: number,
  drawn: number,
  lost: number,
  played: number
): ('W' | 'D' | 'L')[] {
  if (played === 0) return [];
  const results: ('W' | 'D' | 'L')[] = [];
  let w = won;
  let d = drawn;
  let l = lost;
  // Simulate recent form — most recent results first
  const total = Math.min(played, 5);
  for (let i = 0; i < total; i++) {
    const rand = Math.random();
    if (rand < won / played && w > 0) {
      results.push('W');
      w--;
    } else if (rand < (won + drawn) / played && d > 0) {
      results.push('D');
      d--;
    } else if (l > 0) {
      results.push('L');
      l--;
    } else if (d > 0) {
      results.push('D');
      d--;
    } else {
      results.push('W');
      w--;
    }
  }
  return results;
}

function generateTopScorer(clubName: string, position: number): { name: string; goals: number } {
  const { firstName, lastName } = generatePlayerName('English');
  const baseGoals = position <= 5 ? 16 : position <= 10 ? 10 : position <= 15 ? 6 : 3;
  const goals = Math.max(1, baseGoals + Math.floor(Math.random() * 5));
  return { name: `${firstName} ${lastName}`, goals };
}

function deriveCleanSheets(played: number, position: number): number {
  if (played === 0) return 0;
  const rate = position <= 4 ? 0.45 : position <= 10 ? 0.3 : 0.18;
  return Math.round(played * rate);
}

function generateH2HRecord(
  playerClubName: string,
  opponentClubName: string
): { wins: number; draws: number; losses: number; lastResult: string; lastScore: string } {
  const hash = (playerClubName + opponentClubName).split('').reduce(
    (acc, c) => acc + c.charCodeAt(0), 0
  );
  const wins = hash % 4;
  const draws = (hash % 3) + 1;
  const losses = Math.max(0, 6 - wins - draws);
  const homeGoals = 1 + (hash % 3);
  const awayGoals = (hash % 3);
  const winner = homeGoals > awayGoals ? 'W' : homeGoals === awayGoals ? 'D' : 'L';
  return {
    wins,
    draws,
    losses,
    lastResult: winner,
    lastScore: `${homeGoals}-${awayGoals}`,
  };
}

function getKeyPlayerToWatch(
  clubName: string,
  formation: string
): { name: string; position: string; rating: number } {
  const { firstName, lastName } = generatePlayerName('English');
  const positions = ['ST', 'CAM', 'CM', 'CB', 'GK', 'LW', 'RW', 'CDM'];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const rating = 72 + Math.floor(Math.random() * 18);
  return { name: `${firstName} ${lastName}`, position: pos, rating };
}

function getWeaknessToExploit(style: string, formation: string): string {
  const weaknesses: Record<string, string[]> = {
    Attacking: [
      'High defensive line vulnerable to balls over the top',
      'Fullbacks push high leaving space behind on the counter',
      'Susceptible when possession is lost in midfield',
    ],
    Balanced: [
      'Lack of pace in central defence',
      'Predictable patterns in possession build-up',
      'Struggles when pressed aggressively in their own third',
    ],
    Defensive: [
      'Limited goal threat — struggle to chase the game',
      'Slow transitions from defense to attack',
      'Fullbacks offer minimal attacking overlap',
    ],
  };
  const pool = weaknesses[style] || weaknesses['Balanced'];
  return pool[Math.floor(Math.floor(Math.random() * pool.length))];
}

function getDangerAreas(style: string): string[] {
  switch (style) {
    case 'Attacking':
      return [
        'Wide areas — dangerous crossing from wingers',
        'Set pieces in the box — strong aerial threat',
        'Transition moments — rapid counter-pressing',
      ];
    case 'Balanced':
      return [
        'Central midfield — good ball retention and control',
        'Set pieces — well-drilled routines on both sides',
        'Second ball recoveries in the middle third',
      ];
    case 'Defensive':
      return [
        'Counter-attacks — quick transitions into your half',
        'Set pieces defensively — strong aerial dominance',
        'Low block — compact and difficult to break down',
      ];
    default:
      return ['Unknown danger areas'];
  }
}

function computePredictions(
  playerQuality: number,
  opponentQuality: number,
  isHome: boolean,
  playerMorale: number,
  playerFitness: number
): {
  winPct: number;
  drawPct: number;
  lossPct: number;
  predictedScore: string;
  confidence: 'High' | 'Medium' | 'Low';
} {
  let advantage = (playerQuality - opponentQuality) * 0.4;
  if (isHome) advantage += 8;
  advantage += (playerMorale - 50) * 0.15;
  advantage += (playerFitness - 70) * 0.1;

  // Normalize to probabilities
  let winPct = Math.round(45 + advantage * 0.6);
  let drawPct = 25;
  let lossPct = 100 - winPct - drawPct;

  winPct = Math.max(10, Math.min(75, winPct));
  lossPct = Math.max(10, Math.min(60, lossPct));
  drawPct = 100 - winPct - lossPct;

  // Predicted score
  const homeExpGoals = isHome
    ? 1.2 + (playerQuality - opponentQuality) * 0.02
    : 0.9 + (playerQuality - opponentQuality) * 0.015;
  const awayExpGoals = isHome
    ? 0.8 - (playerQuality - opponentQuality) * 0.01
    : 1.1 - (playerQuality - opponentQuality) * 0.015;

  const homeGoals = Math.max(0, Math.round(homeExpGoals + (Math.random() - 0.5) * 0.6));
  const awayGoals = Math.max(0, Math.round(awayExpGoals + (Math.random() - 0.5) * 0.6));
  const predictedScore = `${homeGoals}-${awayGoals}`;

  const confidence =
    Math.abs(winPct - lossPct) > 25 ? 'High' :
    Math.abs(winPct - lossPct) > 12 ? 'Medium' : 'Low';

  return { winPct, drawPct, lossPct, predictedScore, confidence };
}

function getTrainingRecommendation(
  opponentStyle: string,
  playerFitness: number,
  playerPosition: string
): string {
  if (playerFitness < 50) return 'Recovery & light conditioning — prioritize rest';
  if (opponentStyle === 'Defensive') return 'Set-piece drills & crossing accuracy';
  if (opponentStyle === 'Attacking') return 'Defensive shape & counter-attacking transitions';
  return 'Possession retention & midfield pressing drills';
}

function getRestRecommendation(fitness: number, morale: number): string {
  if (fitness < 40) return 'Full rest recommended — fitness critically low';
  if (fitness < 60) return 'Light training only — save energy for matchday';
  if (morale < 40) return 'Team bonding activities to lift spirits';
  return 'Standard preparation — you are in good condition';
}

function getTacticalApproach(
  isHome: boolean,
  opponentStyle: string,
  qualityGap: number
): string {
  if (isHome && qualityGap > 5) return 'Push high, dominate possession, and press aggressively';
  if (isHome && qualityGap > -5) return 'Control tempo, use width, and exploit set pieces';
  if (!isHome && qualityGap < -5) return 'Sit deep, stay compact, and counter with pace';
  if (!isHome && qualityGap < 0) return 'Absorb pressure and look for transition opportunities';
  if (opponentStyle === 'Attacking') return 'Exploit space behind their high line with direct passes';
  return 'Balanced approach — match their intensity and wait for openings';
}

function getMoraleTip(morale: number): string {
  if (morale >= 80) return 'Confidence is high — channel it into positive aggression on the pitch';
  if (morale >= 60) return 'Good spirits — a strong performance here can build momentum';
  if (morale >= 40) return 'Morale is shaky — focus on individual tasks and let results follow';
  return 'Team morale is low — stay professional, lead by example in training';
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

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const styles =
    result === 'W'
      ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
      : result === 'D'
        ? `${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER}`
        : `${RED_BG} ${RED_TEXT} border ${RED_BORDER}`;

  return (
    <span
      className={`inline-flex items-center justify-center size-7 rounded text-xs font-bold ${styles}`}
    >
      {result}
    </span>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-xs font-medium ${TEXT_PRIMARY}`}>{label}</span>
        </div>
        <span className={`text-xs font-mono font-bold ${color}`}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-[#21262d] rounded overflow-hidden">
        <div
          className={`h-full ${color === EMERALD ? 'bg-emerald-500' : color === RED_TEXT ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceIndicator({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const config =
    level === 'High'
      ? { color: EMERALD, bg: EMERALD_BG, border: EMERALD_BORDER, bars: 3 }
      : level === 'Medium'
        ? { color: AMBER_TEXT, bg: AMBER_BG, border: AMBER_BORDER, bars: 2 }
        : { color: RED_TEXT, bg: RED_BG, border: RED_BORDER, bars: 1 };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-5 rounded-sm ${i <= config.bars ? (config.color === EMERALD ? 'bg-emerald-500' : config.color === AMBER_TEXT ? 'bg-amber-500' : 'bg-red-500') : 'bg-[#21262d]'}`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${config.color} ${config.bg} px-2 py-0.5 rounded border ${config.border}`}>
        {level} Confidence
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PreMatchScoutReport() {
  const gameState = useGameStore((s) => s.gameState);

  const data = useMemo(() => {
    if (!gameState) return null;

    const {
      player,
      currentClub,
      currentWeek,
      currentSeason,
      leagueTable,
      upcomingFixtures,
      cupFixtures,
      recentResults,
    } = gameState;

    // Find next fixture (league or cup)
    const nextLeagueFixture = upcomingFixtures.find(
      (f) =>
        !f.played &&
        (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
        f.competition === 'league'
    );

    const nextCupFixture = cupFixtures?.find(
      (f) =>
        !f.played &&
        (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
        !cupFixtures.slice(0, cupFixtures.indexOf(f)).some((prev) =>
          !prev.played && (prev.homeClubId === currentClub.id || prev.awayClubId === currentClub.id)
        )
    );

    // Prefer cup if it's this week's match, otherwise league
    const nextFixture = nextLeagueFixture || nextCupFixture;

    if (!nextFixture) return { fixture: null };

    const isHome = nextFixture.homeClubId === currentClub.id;
    const homeClub = getClubById(nextFixture.homeClubId);
    const awayClub = getClubById(nextFixture.awayClubId);

    if (!homeClub || !awayClub) return { fixture: null };

    const opponent = isHome ? awayClub : homeClub;
    const competition =
      nextFixture.competition === 'league'
        ? 'League'
        : nextFixture.competition === 'cup'
          ? 'Cup'
          : nextFixture.competition;

    // League position
    const sortedTable = [...leagueTable].sort(
      (a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
    );
    const opponentPosition = sortedTable.findIndex((e) => e.clubId === opponent.id) + 1;
    const playerPosition = sortedTable.findIndex((e) => e.clubId === currentClub.id) + 1;
    const opponentStanding = leagueTable.find((e) => e.clubId === opponent.id);

    // Form guide
    const formGuide = opponentStanding
      ? generateFormGuide(opponentStanding.won, opponentStanding.drawn, opponentStanding.lost, opponentStanding.played)
      : [];

    // Goals stats
    const goalsFor = opponentStanding?.goalsFor ?? 0;
    const goalsAgainst = opponentStanding?.goalsAgainst ?? 0;
    const cleanSheets = deriveCleanSheets(opponentStanding?.played ?? 0, opponentPosition);

    // Top scorer
    const topScorer = generateTopScorer(opponent.name, opponentPosition);

    // Head to Head
    const h2h = generateH2HRecord(currentClub.name, opponent.name);

    // Tactical analysis
    const formation = deriveFormationFromPosition(opponentPosition);
    const playingStyle = derivePlayingStyle(opponentPosition);
    const keyPlayer = getKeyPlayerToWatch(opponent.name, formation);
    const weakness = getWeaknessToExploit(playingStyle, formation);
    const dangerAreas = getDangerAreas(playingStyle);

    // Predictions
    const predictions = computePredictions(
      currentClub.quality,
      opponent.quality,
      isHome,
      player.morale,
      player.fitness
    );

    // Preparation recommendations
    const trainingFocus = getTrainingRecommendation(playingStyle, player.fitness, player.position);
    const restRecommendation = getRestRecommendation(player.fitness, player.morale);
    const tacticalApproach = getTacticalApproach(isHome, playingStyle, currentClub.quality - opponent.quality);
    const moraleTip = getMoraleTip(player.morale);

    const qualityGap = currentClub.quality - opponent.quality;

    return {
      fixture: nextFixture,
      isHome,
      opponent,
      homeClub,
      awayClub,
      competition,
      opponentPosition,
      playerPosition,
      opponentStanding,
      formGuide,
      goalsFor,
      goalsAgainst,
      cleanSheets,
      topScorer,
      h2h,
      formation,
      playingStyle,
      keyPlayer,
      weakness,
      dangerAreas,
      predictions,
      trainingFocus,
      restRecommendation,
      tacticalApproach,
      moraleTip,
      qualityGap,
    };
  }, [gameState]);

  if (!data || !data.fixture) {
    return (
      <div className={`${DARK_BG} min-h-screen`}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-8 text-center`}>
            <Shield className="size-10 mx-auto mb-3 text-[#8b949e] opacity-40" />
            <h2 className={`text-lg font-semibold text-white mb-2`}>No Upcoming Match</h2>
            <p className={`text-sm ${TEXT_SECONDARY}`}>
              There are no fixtures currently scheduled. Check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    isHome,
    opponent,
    homeClub,
    awayClub,
    competition,
    opponentPosition,
    formGuide,
    goalsFor,
    goalsAgainst,
    cleanSheets,
    topScorer,
    h2h,
    formation,
    playingStyle,
    keyPlayer,
    weakness,
    dangerAreas,
    predictions,
    trainingFocus,
    restRecommendation,
    tacticalApproach,
    moraleTip,
    qualityGap,
  } = data;

  const { currentWeek, currentSeason } = gameState;

  return (
    <div className={`${DARK_BG} min-h-screen`}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <Eye className="size-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            Pre-Match Scout Report
          </h1>
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ============================================ */}
          {/* 1. Next Match Header                         */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              {/* Competition badge */}
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`}>
                  <Trophy className="size-3" />
                  {competition}
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium ${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER}`}>
                  <Calendar className="size-3" />
                  Week {currentWeek}
                </div>
              </div>

              {/* Club logos & names */}
              <div className="flex items-center justify-between gap-2">
                {/* Home club */}
                <div className="text-center flex-1">
                  <div className="text-3xl mb-1">{homeClub.logo}</div>
                  <div className={`text-xs font-bold text-white truncate`}>{homeClub.shortName}</div>
                </div>

                {/* VS / Venue */}
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-sm font-bold ${TEXT_SECONDARY}`}>VS</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isHome
                        ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
                        : `${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER}`
                    }`}
                  >
                    {isHome ? (
                      <>
                        <Home className="size-2.5" />
                        HOME
                      </>
                    ) : (
                      <>
                        <Plane className="size-2.5" />
                        AWAY
                      </>
                    )}
                  </span>
                </div>

                {/* Away club */}
                <div className="text-center flex-1">
                  <div className="text-3xl mb-1">{awayClub.logo}</div>
                  <div className={`text-xs font-bold text-white truncate`}>{awayClub.shortName}</div>
                </div>
              </div>

              {/* Full names */}
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <div className={`text-sm font-semibold text-white`}>{homeClub.name}</div>
                </div>
                <div className={`w-12`} />
                <div className="flex-1">
                  <div className={`text-sm font-semibold text-white`}>{awayClub.name}</div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 2. Opponent Analysis Card                     */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              <SectionTitle>Opponent Analysis</SectionTitle>

              {/* Position & badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center size-12 rounded-lg ${
                    opponentPosition <= 4
                      ? EMERALD_BG
                      : opponentPosition <= 10
                        ? BLUE_BG
                        : opponentPosition <= 16
                          ? AMBER_BG
                          : RED_BG
                  }`}>
                    <span className={`text-lg font-bold ${
                      opponentPosition <= 4
                        ? EMERALD
                        : opponentPosition <= 10
                          ? BLUE_TEXT
                          : opponentPosition <= 16
                            ? AMBER_TEXT
                            : RED_TEXT
                    }`}>
                      {opponentPosition}
                    </span>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold text-white`}>{opponent.name}</div>
                    <div className={`text-xs ${TEXT_SECONDARY}`}>
                      {opponentPosition}{getPositionSuffix(opponentPosition)} in the league
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${TEXT_SECONDARY}`}>Squad OVR</div>
                  <div className="text-lg font-bold text-white">{opponent.quality}</div>
                </div>
              </div>

              {/* Form guide */}
              <div>
                <div className={`text-xs ${TEXT_SECONDARY} mb-2`}>Recent Form (Last 5)</div>
                <div className="flex items-center gap-1">
                  {formGuide.length > 0 ? (
                    formGuide.map((r, i) => <FormBadge key={i} result={r} />)
                  ) : (
                    <span className={`text-xs ${TEXT_SECONDARY}`}>No results yet</span>
                  )}
                  {formGuide.length < 5 && Array.from({ length: 5 - formGuide.length }).map((_, i) => (
                    <span key={`empty-${i}`} className="inline-flex items-center justify-center size-7 rounded bg-[#21262d] text-xs font-bold text-[#8b949e]">-</span>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Goals For</div>
                  <div className={`text-lg font-bold text-white`}>{goalsFor}</div>
                </div>
                <div className="text-center p-2 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Goals Against</div>
                  <div className={`text-lg font-bold text-white`}>{goalsAgainst}</div>
                </div>
                <div className="text-center p-2 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Clean Sheets</div>
                  <div className={`text-lg font-bold text-white`}>{cleanSheets}</div>
                </div>
              </div>

              {/* Top scorer */}
              <div className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-amber-400" />
                  <div>
                    <div className={`text-xs ${TEXT_SECONDARY}`}>Top Scorer</div>
                    <div className={`text-sm font-semibold text-white`}>{topScorer.name}</div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${EMERALD}`}>
                  {topScorer.goals}
                  <span className={`text-xs ${TEXT_SECONDARY} ml-0.5`}>goals</span>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 3. Head-to-Head Record                        */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-3">
              <SectionTitle>Head-to-Head Record</SectionTitle>

              {/* W/D/L summary */}
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center p-2 rounded-lg bg-[#21262d]">
                  <div className={`text-lg font-bold ${EMERALD}`}>{h2h.wins}</div>
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Wins</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-[#21262d]">
                  <div className={`text-lg font-bold ${AMBER_TEXT}`}>{h2h.draws}</div>
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Draws</div>
                </div>
                <div className="flex-1 text-center p-2 rounded-lg bg-[#21262d]">
                  <div className={`text-lg font-bold ${RED_TEXT}`}>{h2h.losses}</div>
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Losses</div>
                </div>
              </div>

              {/* Win percentage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${TEXT_SECONDARY}`}>Win Percentage</span>
                  <span className={`text-xs font-mono font-bold ${EMERALD}`}>
                    {Math.round((h2h.wins / Math.max(1, h2h.wins + h2h.draws + h2h.losses)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#21262d] rounded overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(h2h.wins / Math.max(1, h2h.wins + h2h.draws + h2h.losses)) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(h2h.draws / Math.max(1, h2h.wins + h2h.draws + h2h.losses)) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(h2h.losses / Math.max(1, h2h.wins + h2h.draws + h2h.losses)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className={`text-[10px] ${EMERALD}`}>W</span>
                  <span className={`text-[10px] ${AMBER_TEXT}`}>D</span>
                  <span className={`text-[10px] ${RED_TEXT}`}>L</span>
                </div>
              </div>

              {/* Last meeting */}
              <div className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2">
                  <Swords className="size-4 text-blue-400" />
                  <div>
                    <div className={`text-xs ${TEXT_SECONDARY}`}>Last Meeting</div>
                    <div className={`text-sm font-semibold text-white`}>
                      {h2h.lastResult === 'W' ? 'Won' : h2h.lastResult === 'D' ? 'Drew' : 'Lost'} {h2h.lastScore}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-bold ${
                  h2h.lastResult === 'W'
                    ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
                    : h2h.lastResult === 'D'
                      ? `${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER}`
                      : `${RED_BG} ${RED_TEXT} border ${RED_BORDER}`
                }`}>
                  {h2h.lastResult}
                </span>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 4. Tactical Analysis                          */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              <SectionTitle>Tactical Analysis</SectionTitle>

              {/* Formation & style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Formation</div>
                  <div className={`text-xl font-bold text-white`}>{formation}</div>
                </div>
                <div className="text-center p-3 bg-[#21262d] rounded-lg">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY} mb-1`}>Playing Style</div>
                  <div className={`text-sm font-bold ${
                    playingStyle === 'Attacking'
                      ? EMERALD
                      : playingStyle === 'Balanced'
                        ? AMBER_TEXT
                        : RED_TEXT
                  }`}>
                    {playingStyle}
                  </div>
                </div>
              </div>

              {/* Key player to watch */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="size-3.5 text-amber-400" />
                  <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Key Player to Watch</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg">
                  <div>
                    <div className={`text-sm font-semibold text-white`}>{keyPlayer.name}</div>
                    <div className={`text-xs ${TEXT_SECONDARY}`}>{keyPlayer.position} · OVR {keyPlayer.rating}</div>
                  </div>
                  <div className={`flex items-center justify-center size-10 rounded-lg ${AMBER_BG} border ${AMBER_BORDER}`}>
                    <span className={`text-sm font-bold ${AMBER_TEXT}`}>{keyPlayer.rating}</span>
                  </div>
                </div>
              </div>

              {/* Weakness to exploit */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-red-400" />
                  <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Weakness to Exploit</span>
                </div>
                <div className={`p-3 ${RED_BG} border ${RED_BORDER} rounded-lg`}>
                  <p className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{weakness}</p>
                </div>
              </div>

              {/* Danger areas */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3.5 text-amber-400" />
                  <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Danger Areas</span>
                </div>
                <ul className="space-y-2">
                  {dangerAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="size-3 text-amber-400 mt-0.5 shrink-0" />
                      <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 5. Match Predictions                          */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              <SectionTitle>Match Predictions</SectionTitle>

              {/* Win / Draw / Loss bars */}
              <div className="space-y-3">
                <ProbabilityBar
                  label="Win"
                  value={predictions.winPct}
                  color={EMERALD}
                  icon={<TrendingUp className="size-3 text-emerald-400" />}
                />
                <ProbabilityBar
                  label="Draw"
                  value={predictions.drawPct}
                  color={AMBER_TEXT}
                  icon={<Activity className="size-3 text-amber-400" />}
                />
                <ProbabilityBar
                  label="Loss"
                  value={predictions.lossPct}
                  color={RED_TEXT}
                  icon={<TrendingDown className="size-3 text-red-400" />}
                />
              </div>

              {/* Predicted score */}
              <div className="flex items-center justify-between p-4 bg-[#21262d] rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-blue-400" />
                  <div>
                    <div className={`text-xs ${TEXT_SECONDARY}`}>Predicted Score</div>
                    <div className={`text-xl font-bold text-white`}>{predictions.predictedScore}</div>
                  </div>
                </div>
                <ConfidenceIndicator level={predictions.confidence} />
              </div>

              {/* Quality comparison */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Your Team</div>
                  <div className={`text-lg font-bold text-white`}>{gameState.currentClub.quality}</div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {qualityGap > 0 ? (
                    <TrendingUp className="size-3.5 text-emerald-400" />
                  ) : qualityGap < 0 ? (
                    <TrendingDown className="size-3.5 text-red-400" />
                  ) : (
                    <Activity className="size-3.5 text-amber-400" />
                  )}
                  <span className={`text-xs font-mono ${
                    qualityGap > 0 ? EMERALD : qualityGap < 0 ? RED_TEXT : AMBER_TEXT
                  }`}>
                    {qualityGap > 0 ? '+' : ''}{qualityGap}
                  </span>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>{opponent.shortName}</div>
                  <div className={`text-lg font-bold text-white`}>{opponent.quality}</div>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* 6. Preparation Recommendations                */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <InfoCard className="space-y-4">
              <SectionTitle>Preparation Recommendations</SectionTitle>

              {/* Training focus */}
              <div className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg">
                <div className={`flex items-center justify-center size-8 rounded-lg ${BLUE_BG} border ${BLUE_BORDER} shrink-0`}>
                  <Dumbbell className="size-4 text-blue-400" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Suggested Training Focus</div>
                  <p className={`text-xs leading-relaxed ${TEXT_SECONDARY} mt-1`}>{trainingFocus}</p>
                </div>
              </div>

              {/* Rest recommendation */}
              <div className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg">
                <div className={`flex items-center justify-center size-8 rounded-lg ${PURPLE_BG} border ${PURPLE_BORDER} shrink-0`}>
                  <Heart className="size-4 text-purple-400" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Rest Recommendation</div>
                  <p className={`text-xs leading-relaxed ${TEXT_SECONDARY} mt-1`}>{restRecommendation}</p>
                </div>
              </div>

              {/* Tactical approach */}
              <div className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg">
                <div className={`flex items-center justify-center size-8 rounded-lg ${EMERALD_BG} border ${EMERALD_BORDER} shrink-0`}>
                  <Brain className="size-4 text-emerald-400" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Tactical Approach</div>
                  <p className={`text-xs leading-relaxed ${TEXT_SECONDARY} mt-1`}>{tacticalApproach}</p>
                </div>
              </div>

              {/* Morale tip */}
              <div className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg">
                <div className={`flex items-center justify-center size-8 rounded-lg ${AMBER_BG} border ${AMBER_BORDER} shrink-0`}>
                  <Lightbulb className="size-4 text-amber-400" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Morale Boost Tip</div>
                  <p className={`text-xs leading-relaxed ${TEXT_SECONDARY} mt-1`}>{moraleTip}</p>
                </div>
              </div>
            </InfoCard>
          </motion.div>

          {/* ============================================ */}
          {/* Footer note                                   */}
          {/* ============================================ */}
          <motion.div variants={staggerChild}>
            <div className={`text-center py-2`}>
              <p className={`text-[10px] ${TEXT_SECONDARY}`}>
                <MessageSquare className="size-3 inline mr-1" />
                Scout data is generated from available match statistics and may not reflect real-time changes.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
