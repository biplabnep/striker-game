'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  BarChart3,
  ShieldOff,
  Target,
  ClipboardCheck,
  MapPin,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  CloudLightning,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  AlertTriangle,
  Zap,
  Brain,
  Heart,
  Dumbbell,
  CheckCircle2,
  Circle,
  FileText,
  Eye,
  Star,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  PenLine,
  Scale,
  Lightbulb,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Position } from '@/lib/game/types';

// ============================================================
// Constants & Helpers
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

const WEATHER_LIST = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Stormy'] as const;
type WeatherType = (typeof WEATHER_LIST)[number];

function deriveWeather(currentWeek: number, currentSeason: number): WeatherType {
  const index = (currentWeek * 7 + currentSeason * 31) % 5;
  return WEATHER_LIST[index];
}

function getWeatherIcon(weather: WeatherType) {
  switch (weather) {
    case 'Sunny': return <Sun className="size-4 text-amber-400" />;
    case 'Cloudy': return <Cloud className="size-4 text-slate-400" />;
    case 'Rainy': return <CloudRain className="size-4 text-blue-400" />;
    case 'Windy': return <Wind className="size-4 text-cyan-400" />;
    case 'Stormy': return <CloudLightning className="size-4 text-purple-400" />;
  }
}

function deriveFormation(reputation: number): string {
  if (reputation >= 75) return '4-3-3';
  if (reputation >= 45) return '4-4-2';
  return '3-5-2';
}

function deriveTacticalStyle(position: number): 'Attacking' | 'Balanced' | 'Defensive' {
  if (position <= 6) return 'Attacking';
  if (position <= 14) return 'Balanced';
  return 'Defensive';
}

function deriveStadiumCapacity(clubName: string): number {
  const hash = clubName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 40000 + (hash % 40001);
}

function generateFormGuide(
  won: number,
  drawn: number,
  lost: number,
  played: number
): ('W' | 'D' | 'L')[] {
  if (played === 0) return [];
  const total = played;
  const results: ('W' | 'D' | 'L')[] = [];
  let w = won;
  let d = drawn;
  let l = lost;
  for (let i = 0; i < total && i < 5; i++) {
    if (w > 0) { results.push('W'); w--; }
    else if (d > 0) { results.push('D'); d--; }
    else if (l > 0) { results.push('L'); l--; }
  }
  return results;
}

function generateFakeHeadToHead(homeTeam: string, awayTeam: string): string {
  const hash = (homeTeam + awayTeam).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const homeWins = hash % 3;
  const draws = (hash % 2) + 1;
  const awayWins = 5 - homeWins - draws;
  return `Won ${homeWins}, Drew ${draws}, Lost ${Math.max(awayWins, 0)}`;
}

function getOpponentStrengths(style: 'Attacking' | 'Balanced' | 'Defensive'): string[] {
  switch (style) {
    case 'Attacking':
      return [
        'High pressing intensity forces turnovers in advanced areas',
        'Wide forwards create overloads on the flanks',
        'Quick transitions from defense to attack',
        'Strong finishing from inside the penalty box',
      ];
    case 'Balanced':
      return [
        'Well-organized midfield controls possession tempo',
        'Flexible formation adapts to in-game situations',
        'Strong set-piece routines both offensively and defensively',
        'Disciplined defensive shape limits opposition chances',
      ];
    case 'Defensive':
      return [
        'Compact low block is difficult to break down',
        'Excellent aerial dominance from set pieces',
        'Counter-attacking threat on transitions',
        'Experienced defenders read the game well',
      ];
  }
}

function getOpponentWeaknesses(style: 'Attacking' | 'Balanced' | 'Defensive'): string[] {
  switch (style) {
    case 'Attacking':
      return [
        'High defensive line vulnerable to balls over the top',
        'Fullbacks push high leaving space behind for counters',
        'Susceptible to quick transitions when possession is lost',
        'Midfield can be overran when pressing is bypassed',
      ];
    case 'Balanced':
      return [
        'Lack of standout individual quality in attack',
        'Predictable patterns in possession build-up',
        'Vulnerable when pressed high in their own third',
        'Struggles against teams with superior midfield control',
      ];
    case 'Defensive':
      return [
        'Limited goal threat when chasing the game',
        'Struggle to maintain possession under sustained pressure',
        'Fullbacks offer minimal attacking output',
        'Slow to react when conceding first',
      ];
  }
}

function getFormationWeaknesses(formation: string): string[] {
  switch (formation) {
    case '4-3-3':
      return [
        'Only one defensive midfielder leaves center exposed',
        'Wingers may drift inside leaving flanks unprotected',
        'Fullbacks forced to cover wide areas alone',
      ];
    case '4-4-2':
      return [
        'Flat midfield can be outnumbered against a diamond or 3-man midfield',
        'Two strikers may crowd each other against a deep block',
        'Limited creative passing options through the middle',
      ];
    case '3-5-2':
      return [
        'Wingbacks can be caught out of position on transitions',
        'Three center backs can be redundant against a single striker',
        'Vulnerable down the channels between wingbacks and center backs',
      ];
    default:
      return ['Unknown formation weaknesses'];
  }
}

function getPositionRoleInstructions(position: Position): string[] {
  switch (position) {
    case 'ST':
      return [
        'Stay central and look to exploit gaps between center backs',
        'Make runs across the near post at corner kicks',
        'Press the opposition center backs when they have the ball',
        'Hold up play to bring midfielders into attacking positions',
        'Be ready for second-ball situations inside the box',
      ];
    case 'LW':
    case 'RW':
      return [
        'Stay wide to stretch the opposition defense',
        'Cut inside on your stronger foot to create shooting angles',
        'Track back to help the fullback defensively',
        'Deliver early crosses when the fullback is overlapping',
        'Look for one-two passes around the edge of the box',
      ];
    case 'CAM':
      return [
        'Find space between the opposition lines to receive the ball',
        'Look for through balls to the striker and wingers',
        'Support the striker with late runs into the box',
        'Shoot from distance when the defense drops deep',
        'Dictate the tempo of attacking play in the final third',
      ];
    case 'CM':
      return [
        'Control possession and distribute the ball efficiently',
        'Provide cover for the defense when the team attacks',
        'Make late runs into the box for cut-back passes',
        'Switch play to exploit the weak side of the opposition',
        'Communicate with teammates to maintain team shape',
      ];
    case 'CDM':
      return [
        'Sit in front of the center backs and protect the defensive line',
        'Break up opposition attacks with timely interceptions',
        'Distribute the ball quickly to start counter-attacks',
        'Cover for overlapping fullbacks when they push forward',
        'Organize the midfield line and communicate positioning',
      ];
    case 'CB':
      return [
        'Maintain a compact defensive line with your center back partner',
        'Win aerial duels and clear danger from set pieces',
        'Play out from the back when under no pressure',
        'Step out to intercept passes into the opposition striker',
        'Communicate with the fullbacks and goalkeeper constantly',
      ];
    case 'LB':
    case 'RB':
      return [
        'Provide width in attack while balancing defensive duties',
        'Overlap the winger to deliver crosses into the box',
        'Track the opposition winger and prevent crosses',
        'Tuck inside when the ball is on the opposite side',
        'Be ready for quick throw-in and set-piece routines',
      ];
    case 'GK':
      return [
        'Command the penalty area on crosses and set pieces',
        'Distribute the ball quickly to start counter-attacks',
        'Communicate with the back four to maintain the defensive line',
        'Stay calm and position yourself for one-on-one situations',
        'Study the opposition strikers for penalty tendencies',
      ];
    default:
      return ['Follow the team tactical plan and maintain position discipline'];
  }
}

function getPositionSetPieceRole(position: Position): { attacking: string[]; defending: string[] } {
  switch (position) {
    case 'ST':
      return {
        attacking: [
          'Position yourself between the two center backs at corners',
          'Attack the near post for flick-ons and rebounds',
          'Take penalties if you are the designated taker',
        ],
        defending: [
          'Press the opposition goalkeeper on short corners',
          'Stay forward as an outlet for counter-attacks',
        ],
      };
    case 'CB':
      return {
        attacking: [
          'Attack the far post at corner kicks',
          'Be the primary aerial threat from free kicks in the box',
          'Stay up for attacking free kicks near the opposition box',
        ],
        defending: [
          'Mark the opposition tallest player at set pieces',
          'Organize the zonal marking system',
          'Clear the ball from danger areas decisively',
        ],
      };
    case 'GK':
      return {
        attacking: [
          'Stay in goal during attacking set pieces',
          'Be ready to sweep up any counter-attacks',
        ],
        defending: [
          'Command the six-yard box on crosses',
          'Position yourself on the correct side for free kicks',
          'Communicate with defenders about incoming runners',
        ],
      };
    default:
      return {
        attacking: [
          'Position yourself on the edge of the box for rebounds',
          'Be ready for quick short-corner routines',
        ],
        defending: [
          'Mark your designated opponent man-to-man',
          'Hold the defensive line to catch attackers offside',
        ],
      };
  }
}

function getContextTips(
  morale: number,
  fitness: number,
  form: number,
  isHome: boolean,
  weather: WeatherType
): string[] {
  const tips: string[] = [];

  if (morale >= 80) {
    tips.push('High morale: Channel confidence into positive aggression on the pitch.');
  } else if (morale >= 50) {
    tips.push('Moderate morale: Stay focused on your individual tasks and let results build confidence.');
  } else {
    tips.push('Low morale: Focus on the basics — work rate, positioning, and team shape will earn results.');
  }

  if (fitness >= 80) {
    tips.push('Peak fitness: You can sustain high-intensity pressing for the full 90 minutes.');
  } else if (fitness >= 60) {
    tips.push('Good fitness: Manage your energy in the first half to stay effective late in the game.');
  } else if (fitness >= 40) {
    tips.push('Moderate fitness: Be selective with your pressing triggers and conserve energy when possible.');
  } else {
    tips.push('Low fitness: Focus on positional play rather than physical intensity. Let the ball do the work.');
  }

  if (form >= 8.0) {
    tips.push('Excellent form: Trust your instincts and look to influence the game in the final third.');
  } else if (form >= 6.5) {
    tips.push('Good form: Maintain consistency and look to build on recent performances.');
  } else if (form >= 5.0) {
    tips.push('Average form: Focus on simple, effective plays to rebuild your match rhythm.');
  } else {
    tips.push('Poor form: Keep your head up — one good moment can turn everything around.');
  }

  if (isHome) {
    tips.push('Home advantage: Use the familiar surroundings to dictate tempo early in the match.');
  } else {
    tips.push('Away fixture: Stay compact early, absorb pressure, and look to hit them on the break.');
  }

  switch (weather) {
    case 'Rainy':
      tips.push('Wet conditions: Keep the ball on the ground — aerial play will be unpredictable.');
      break;
    case 'Windy':
      tips.push('Windy conditions: Low passes and shots along the ground will be more effective.');
      break;
    case 'Stormy':
      tips.push('Storm conditions: Expect a physical battle. Win the second balls and stay composed.');
      break;
    case 'Sunny':
      tips.push('Perfect conditions: This is your chance to play your natural game with confidence.');
      break;
    case 'Cloudy':
      tips.push('Overcast conditions: Ideal playing weather — stay focused and execute the game plan.');
      break;
  }

  return tips;
}

function getFormationPositions(formation: string): { x: number; y: number; label: string }[] {
  switch (formation) {
    case '4-3-3':
      return [
        { x: 0.5, y: 0.05, label: 'GK' },
        { x: 0.2, y: 0.22, label: 'LB' },
        { x: 0.4, y: 0.2, label: 'CB' },
        { x: 0.6, y: 0.2, label: 'CB' },
        { x: 0.8, y: 0.22, label: 'RB' },
        { x: 0.3, y: 0.42, label: 'CM' },
        { x: 0.5, y: 0.38, label: 'CDM' },
        { x: 0.7, y: 0.42, label: 'CM' },
        { x: 0.15, y: 0.65, label: 'LW' },
        { x: 0.5, y: 0.7, label: 'ST' },
        { x: 0.85, y: 0.65, label: 'RW' },
      ];
    case '4-4-2':
      return [
        { x: 0.5, y: 0.05, label: 'GK' },
        { x: 0.2, y: 0.22, label: 'LB' },
        { x: 0.4, y: 0.2, label: 'CB' },
        { x: 0.6, y: 0.2, label: 'CB' },
        { x: 0.8, y: 0.22, label: 'RB' },
        { x: 0.2, y: 0.42, label: 'LM' },
        { x: 0.4, y: 0.4, label: 'CM' },
        { x: 0.6, y: 0.4, label: 'CM' },
        { x: 0.8, y: 0.42, label: 'RM' },
        { x: 0.38, y: 0.7, label: 'ST' },
        { x: 0.62, y: 0.7, label: 'ST' },
      ];
    case '3-5-2':
      return [
        { x: 0.5, y: 0.05, label: 'GK' },
        { x: 0.3, y: 0.2, label: 'CB' },
        { x: 0.5, y: 0.18, label: 'CB' },
        { x: 0.7, y: 0.2, label: 'CB' },
        { x: 0.12, y: 0.4, label: 'LWB' },
        { x: 0.35, y: 0.38, label: 'CM' },
        { x: 0.5, y: 0.42, label: 'CDM' },
        { x: 0.65, y: 0.38, label: 'CM' },
        { x: 0.88, y: 0.4, label: 'RWB' },
        { x: 0.38, y: 0.7, label: 'ST' },
        { x: 0.62, y: 0.7, label: 'ST' },
      ];
    default:
      return [];
  }
}

// ============================================================
// Opacity-only animation variants
// ============================================================

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const fadeInSlow = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

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

function FormResultBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const styles =
    result === 'W'
      ? `${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`
      : result === 'D'
        ? `${AMBER_BG} ${AMBER_TEXT} border ${AMBER_BORDER}`
        : `${RED_BG} ${RED_TEXT} border ${RED_BORDER}`;

  return (
    <span
      className={`inline-flex items-center justify-center size-6 rounded text-xs font-bold ${styles}`}
    >
      {result}
    </span>
  );
}

function AttributeBar({
  label,
  playerValue,
  opponentValue,
}: {
  label: string;
  playerValue: number;
  opponentValue: number;
}) {
  const playerWins = playerValue >= opponentValue;
  const diff = Math.abs(playerValue - opponentValue);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs ${TEXT_PRIMARY}`}>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${playerWins ? EMERALD : RED_TEXT}`}>
            {playerValue}
          </span>
          <span className={`text-xs ${TEXT_SECONDARY}`}>vs</span>
          <span className={`text-xs font-mono ${!playerWins ? EMERALD : RED_TEXT}`}>
            {opponentValue}
          </span>
          {playerWins ? (
            <ArrowUpRight className="size-3 text-emerald-400" />
          ) : (
            <ArrowDownRight className="size-3 text-red-400" />
          )}
        </div>
      </div>
      <div className="h-1.5 w-full bg-[#21262d] rounded overflow-hidden">
        <div className="flex h-full">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${playerValue}%` }}
          />
          <div
            className="bg-[#21262d] h-full min-w-[2px]"
            style={{ width: `${Math.max(diff, 2)}%` }}
          />
          <div
            className="bg-red-500/60 h-full"
            style={{ width: `${opponentValue}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 1 — Next Match
// ============================================================

function NextMatchTab() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { player, currentWeek, currentSeason, currentClub, leagueTable, upcomingFixtures } = gameState;

  const nextFixture = upcomingFixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
      f.competition === 'league'
  );

  if (!nextFixture) {
    return (
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 text-center ${TEXT_SECONDARY}`}>
        <Swords className="size-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No upcoming league match found.</p>
      </div>
    );
  }

  const isHome = nextFixture.homeClubId === currentClub.id;
  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  if (!homeClub || !awayClub) return null;

  const opponent = isHome ? awayClub : homeClub;

  const sortedTable = [...leagueTable].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  const homePosition = sortedTable.findIndex((e) => e.clubId === homeClub.id) + 1;
  const awayPosition = sortedTable.findIndex((e) => e.clubId === awayClub.id) + 1;

  const homeStanding = leagueTable.find((e) => e.clubId === homeClub.id);
  const awayStanding = leagueTable.find((e) => e.clubId === awayClub.id);

  const homeForm = homeStanding ? generateFormGuide(homeStanding.won, homeStanding.drawn, homeStanding.lost, homeStanding.played) : [];
  const awayForm = awayStanding ? generateFormGuide(awayStanding.won, awayStanding.drawn, awayStanding.lost, awayStanding.played) : [];

  const h2h = generateFakeHeadToHead(homeClub.name, awayClub.name);
  const weather = deriveWeather(currentWeek, currentSeason);
  const capacity = deriveStadiumCapacity(homeClub.name);
  const competitionLabel = nextFixture.competition === 'league' ? 'League Match' : nextFixture.competition;

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Match Header */}
      <motion.div variants={staggerChild}>
        <InfoCard className="text-center space-y-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`}>
            <Trophy className="size-3" />
            {competitionLabel}
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight text-white">{homeClub.name}</div>
              {homeStanding && (
                <div className={`text-xs ${TEXT_SECONDARY} mt-1`}>
                  {homeStanding.won}W {homeStanding.drawn}D {homeStanding.lost}L · {homeStanding.points} pts
                </div>
              )}
            </div>
            <div className={`flex flex-col items-center`}>
              <span className={`text-lg font-bold ${TEXT_SECONDARY}`}>VS</span>
              <span
                className={`text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded ${
                  isHome ? `${EMERALD_BG} ${EMERALD}` : `${AMBER_BG} ${AMBER_TEXT}`
                }`}
              >
                {isHome ? 'HOME' : 'AWAY'}
              </span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight text-white">{awayClub.name}</div>
              {awayStanding && (
                <div className={`text-xs ${TEXT_SECONDARY} mt-1`}>
                  {awayStanding.won}W {awayStanding.drawn}D {awayStanding.lost}L · {awayStanding.points} pts
                </div>
              )}
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* League Position Comparison */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>League Positions</SectionTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center size-10 rounded-lg ${homePosition <= awayPosition ? EMERALD_BG : 'bg-[#21262d]'}`}>
                <span className={`text-lg font-bold ${homePosition <= awayPosition ? EMERALD : TEXT_SECONDARY}`}>{homePosition}</span>
              </div>
              <div>
                <div className={`text-sm font-medium ${TEXT_PRIMARY}`}>{homeClub.name}</div>
                {homeStanding && (
                  <div className={`text-xs ${TEXT_SECONDARY}`}>{homeStanding.played} played</div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
              {homePosition < awayPosition ? (
                <TrendingUp className="size-4 text-emerald-400" />
              ) : homePosition > awayPosition ? (
                <TrendingDown className="size-4 text-red-400" />
              ) : (
                <Minus className="size-4 text-amber-400" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-sm font-medium ${TEXT_PRIMARY}`}>{awayClub.name}</div>
                {awayStanding && (
                  <div className={`text-xs ${TEXT_SECONDARY}`}>{awayStanding.played} played</div>
                )}
              </div>
              <div className={`flex items-center justify-center size-10 rounded-lg ${awayPosition <= homePosition ? EMERALD_BG : 'bg-[#21262d]'}`}>
                <span className={`text-lg font-bold ${awayPosition <= homePosition ? EMERALD : TEXT_SECONDARY}`}>{awayPosition}</span>
              </div>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Form Guide */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Form Guide (Last 5)</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${TEXT_PRIMARY}`}>{homeClub.name}</span>
              <div className="flex items-center gap-1">
                {homeForm.length > 0 ? (
                  homeForm.map((r, i) => <FormResultBadge key={i} result={r} />)
                ) : (
                  <span className={`text-xs ${TEXT_SECONDARY}`}>No results yet</span>
                )}
              </div>
            </div>
            <div className={`h-px ${BORDER_COLOR} bg-[#30363d]`} />
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${TEXT_PRIMARY}`}>{awayClub.name}</span>
              <div className="flex items-center gap-1">
                {awayForm.length > 0 ? (
                  awayForm.map((r, i) => <FormResultBadge key={i} result={r} />)
                ) : (
                  <span className={`text-xs ${TEXT_SECONDARY}`}>No results yet</span>
                )}
              </div>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Head-to-Head */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Head-to-Head</SectionTitle>
          <p className={`text-sm ${TEXT_PRIMARY}`}>
            Last 5 meetings: <span className="font-semibold text-white">{h2h}</span>
          </p>
        </InfoCard>
      </motion.div>

      {/* Weather & Venue */}
      <motion.div variants={staggerChild}>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard>
            <SectionTitle>Weather</SectionTitle>
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather)}
              <span className={`text-sm font-medium ${TEXT_PRIMARY}`}>{weather}</span>
            </div>
          </InfoCard>
          <InfoCard>
            <SectionTitle>Venue</SectionTitle>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-medium ${TEXT_PRIMARY}`}>{homeClub.name} Stadium</span>
              </div>
              <span className={`text-xs ${TEXT_SECONDARY}`}>Capacity: {capacity.toLocaleString()}</span>
            </div>
          </InfoCard>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 2 — Analysis
// ============================================================

function AnalysisTab() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { player, currentWeek, currentSeason, currentClub, leagueTable, upcomingFixtures } = gameState;

  const nextFixture = upcomingFixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
      f.competition === 'league'
  );

  if (!nextFixture) {
    return (
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 text-center ${TEXT_SECONDARY}`}>
        <BarChart3 className="size-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No upcoming match to analyze.</p>
      </div>
    );
  }

  const isHome = nextFixture.homeClubId === currentClub.id;
  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  if (!homeClub || !awayClub) return null;

  const opponent = isHome ? awayClub : homeClub;
  const oppFormation = deriveFormation(opponent.reputation);
  const sortedTable = [...leagueTable].sort((a, b) => b.points - a.points);
  const oppPosition = sortedTable.findIndex((e) => e.clubId === opponent.id) + 1;
  const oppStyle = deriveTacticalStyle(oppPosition);
  const oppStrengths = getOpponentStrengths(oppStyle);
  const oppSquadQuality = opponent.quality;
  const playerSquadQuality = currentClub.quality;

  const { attributes } = player;
  const oppAvgAttr = Math.round(oppSquadQuality * 0.85);

  const attrs: { label: string; player: number; opponent: number }[] = [
    { label: 'Pace', player: attributes.pace, opponent: oppAvgAttr + (oppStyle === 'Attacking' ? 5 : -3) },
    { label: 'Shooting', player: attributes.shooting, opponent: oppAvgAttr + (oppStyle === 'Attacking' ? 8 : 0) },
    { label: 'Passing', player: attributes.passing, opponent: oppAvgAttr + (oppStyle === 'Balanced' ? 5 : 0) },
    { label: 'Dribbling', player: attributes.dribbling, opponent: oppAvgAttr + (oppStyle === 'Attacking' ? 3 : -2) },
    { label: 'Defending', player: attributes.defending, opponent: oppAvgAttr + (oppStyle === 'Defensive' ? 10 : 2) },
    { label: 'Physical', player: attributes.physical, opponent: oppAvgAttr + 2 },
  ];

  const positionInstructions = getPositionRoleInstructions(player.position);

  const playerFormationMidfield = currentClub.formation || '4-4-2';
  const midfielBattle =
    playerFormationMidfield.includes('3') && oppFormation.includes('3')
      ? 'Even midfield battle — control possession to gain the edge'
      : playerFormationMidfield.includes('3') && !oppFormation.includes('3')
        ? 'Your team has a numerical midfield advantage — exploit it'
        : !playerFormationMidfield.includes('3') && oppFormation.includes('3')
          ? 'Opposition has extra midfielders — you may be overrun in the center'
          : 'Both teams field standard midfield numbers — individual quality will decide';

  const widthAnalysis =
    oppFormation === '4-3-3'
      ? 'Opposition uses wide forwards — your fullbacks must be disciplined'
      : oppFormation === '3-5-2'
        ? 'Opposition wingbacks provide width — exploit the space behind them'
        : 'Opposition uses a narrow 4-4-2 — stretch them by playing wide';

  const positionLabel = player.position === 'ST'
    ? `Your ${player.position} role vs their defensive line`
    : player.position === 'CM' || player.position === 'CDM' || player.position === 'CAM'
      ? `Your ${player.position} role vs their midfield unit`
      : player.position === 'CB'
        ? 'Your CB role vs their attacking threat'
        : player.position === 'GK'
          ? 'Your GK role vs their forwards'
          : `Your ${player.position} role vs their wide players`;

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Opponent Profile Card */}
      <motion.div variants={staggerChild}>
        <InfoCard className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold text-white`}>{opponent.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${EMERALD_BG} ${EMERALD} border ${EMERALD_BORDER}`}>
              {oppStyle}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Formation</div>
              <div className={`text-sm font-bold text-white`}>{oppFormation}</div>
            </div>
            <div className="text-center">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Squad OVR</div>
              <div className={`text-sm font-bold text-white`}>{oppSquadQuality}</div>
            </div>
            <div className="text-center">
              <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Position</div>
              <div className={`text-sm font-bold text-white`}>{oppPosition}{oppPosition === 1 ? 'st' : oppPosition === 2 ? 'nd' : oppPosition === 3 ? 'rd' : 'th'}</div>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Key Strengths */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Opponent Key Strengths</SectionTitle>
          <ul className="space-y-2">
            {oppStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <Zap className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{s}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </motion.div>

      {/* Formation Matchup Analysis */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Formation Matchup Analysis</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Midfield Battle</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{midfielBattle}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Width Analysis</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{widthAnalysis}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Swords className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold ${TEXT_PRIMARY}`}>Key Battles</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{positionLabel}</p>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Attribute Matchup Bars */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Attribute Matchup</SectionTitle>
          <div className="space-y-3">
            {attrs.map((a) => (
              <AttributeBar
                key={a.label}
                label={a.label}
                playerValue={a.player}
                opponentValue={a.opponent}
              />
            ))}
          </div>
          <p className={`text-[10px] mt-3 ${TEXT_SECONDARY}`}>
            <ArrowUpRight className="size-3 inline text-emerald-400" /> = Your advantage
            <ArrowDownRight className="size-3 inline text-red-400 ml-2" /> = Opponent advantage
          </p>
        </InfoCard>
      </motion.div>

      {/* Position-Specific Role Instructions */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Role Instructions ({player.position})</SectionTitle>
          <ul className="space-y-2">
            {positionInstructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="size-3 text-emerald-400 mt-0.5 shrink-0" />
                <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{inst}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 3 — Weaknesses
// ============================================================

function WeaknessesTab() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { currentClub, leagueTable, upcomingFixtures } = gameState;

  const nextFixture = upcomingFixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
      f.competition === 'league'
  );

  if (!nextFixture) {
    return (
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 text-center ${TEXT_SECONDARY}`}>
        <ShieldOff className="size-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No upcoming match to analyze.</p>
      </div>
    );
  }

  const isHome = nextFixture.homeClubId === currentClub.id;
  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  if (!homeClub || !awayClub) return null;

  const opponent = isHome ? awayClub : homeClub;
  const sortedTable = [...leagueTable].sort((a, b) => b.points - a.points);
  const oppPosition = sortedTable.findIndex((e) => e.clubId === opponent.id) + 1;
  const oppStyle = deriveTacticalStyle(oppPosition);
  const oppFormation = deriveFormation(opponent.reputation);
  const oppWeaknesses = getOpponentWeaknesses(oppStyle);
  const formationWeaknesses = getFormationWeaknesses(oppFormation);

  const oppSquadQuality = opponent.quality;
  const playerSquadQuality = currentClub.quality;
  const qualityGap = playerSquadQuality - oppSquadQuality;

  const qualityLabel =
    qualityGap >= 10
      ? { text: 'Significant advantage', color: EMERALD, icon: <TrendingUp className="size-3.5" /> }
      : qualityGap >= 3
        ? { text: 'Slight advantage', color: EMERALD, icon: <TrendingUp className="size-3.5" /> }
        : qualityGap <= -10
          ? { text: 'Significant disadvantage', color: RED_TEXT, icon: <TrendingDown className="size-3.5" /> }
          : qualityGap <= -3
            ? { text: 'Slight disadvantage', color: RED_TEXT, icon: <TrendingDown className="size-3.5" /> }
            : { text: 'Evenly matched', color: AMBER_TEXT, icon: <Minus className="size-3.5" /> };

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Tactical Weaknesses */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Tactical Weaknesses</SectionTitle>
          <ul className="space-y-2">
            {oppWeaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{w}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </motion.div>

      {/* Formation-Based Weaknesses */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Formation Weaknesses ({oppFormation})</SectionTitle>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${RED_BG} ${RED_TEXT} border ${RED_BORDER} mb-3`}>
            <ShieldOff className="size-3" />
            {oppFormation}
          </div>
          <ul className="space-y-2">
            {formationWeaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="size-3 text-amber-400 mt-0.5 shrink-0" />
                <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{w}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </motion.div>

      {/* Squad Quality Gap */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Squad Quality Comparison</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>Your Team</div>
                <div className={`text-xl font-bold text-white`}>{playerSquadQuality}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  {qualityLabel.icon}
                  <span className={`text-xs font-medium ${qualityLabel.color}`}>{qualityLabel.text}</span>
                </div>
                <div className={`text-xs ${TEXT_SECONDARY}`}>
                  {qualityGap > 0 ? '+' : ''}{qualityGap} difference
                </div>
              </div>
              <div className="text-center">
                <div className={`text-[10px] uppercase ${TEXT_SECONDARY}`}>{opponent.name}</div>
                <div className={`text-xl font-bold text-white`}>{oppSquadQuality}</div>
              </div>
            </div>
            <div className="h-2 w-full bg-[#21262d] rounded overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${playerSquadQuality}%` }}
                />
                <div className="bg-[#21262d] h-full min-w-[1px]" style={{ width: '1%' }} />
                <div
                  className="bg-red-500/50 h-full transition-all"
                  style={{ width: `${oppSquadQuality}%` }}
                />
              </div>
            </div>
            <p className={`text-[10px] ${TEXT_SECONDARY}`}>
              {qualityGap >= 5
                ? 'Your squad has a clear quality advantage. Exploit individual matchups.'
                : qualityGap <= -5
                  ? 'The opposition has superior squad quality. Focus on teamwork and discipline.'
                  : 'Teams are closely matched. Set pieces and individual moments will decide the game.'}
            </p>
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 4 — Set Pieces
// ============================================================

function SetPiecesTab() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { player, currentWeek, currentSeason, upcomingFixtures } = gameState;
  const attributes = player.attributes;

  const nextFixture = upcomingFixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id) &&
      f.competition === 'league'
  );

  if (!nextFixture) {
    return (
      <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-6 text-center ${TEXT_SECONDARY}`}>
        <Target className="size-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No upcoming match.</p>
      </div>
    );
  }

  const isHome = nextFixture.homeClubId === gameState.currentClub.id;
  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  if (!homeClub || !awayClub) return null;

  const opponent = isHome ? awayClub : homeClub;
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const isDefender = ['CB', 'LB', 'RB', 'CDM', 'GK'].includes(player.position);
  const hasGoodPassing = attributes.passing >= 70;
  const hasGoodShooting = attributes.shooting >= 70;

  const cornerAdvice = isAttacker
    ? 'Attack the near post with timing and aggression. Look for flick-ons and rebounds inside the six-yard box. Communicate with your fellow attackers to avoid crowding.'
    : isDefender
      ? 'Hold the defensive line and mark your designated opponent. Attack the ball decisively when it comes into your zone. Be the first to react on second balls.'
      : 'Position yourself on the edge of the box for cut-backs and long-range attempts. Be alert to quick short-corner routines. Support the attack from distance.';

  const freeKickAdvice = isAttacker && hasGoodShooting
    ? 'You are a shooting threat from free kicks in the 20-30 yard range. Work on your technique in training. Look for the wall gap and aim for the far corner.'
    : hasGoodPassing
      ? 'Use your passing range to deliver dangerous balls from wider free kicks. Mix between near-post crosses and far-post deliveries to keep the defense guessing.'
      : 'Position yourself for rebounds and secondary opportunities. Make runs across the front post to distract the goalkeeper. Be ready to pounce on any loose balls.';

  const penaltyAdvice = isAttacker
    ? 'As an attacker, you should be confident stepping up. Practice your run-up and placement. Stay calm and pick your spot — power is less important than accuracy.'
    : 'Position yourself on the edge of the box for the rebound. Attack any loose ball with conviction. Stay alert as goalkeepers often parry penalties back into play.';

  const throwInAdvice = player.position === 'LB' || player.position === 'RB'
    ? 'Long throw-ins are a potent weapon. Practice your technique to generate power and accuracy. Coordinate with your strikers for near-post runs.'
    : 'Use throw-ins as an opportunity to maintain possession. Make yourself available for short throws to keep the attacking move alive. Quick throw-ins can catch defenses off guard.';

  const defendingCornerAdvice = isDefender
    ? 'Organize the zonal marking system with your fellow defenders. Win the first contact on any aerial ball. Clear the ball high and wide rather than into dangerous central areas.'
    : 'Track back quickly and pick up your marking assignment. Block any shooting lanes from the edge of the box. Be ready to counter-attack if your team wins possession.';

  const defendingFreeKickAdvice = isDefender
    ? 'Set the wall quickly and communicate with the goalkeeper. Step out with the kick to close the shooting angle. Be first to any loose balls around the box.'
    : 'Stand on the goal line or edge of the wall if required. Monitor any opposition runners trying to get ahead of the wall. Be ready to sprint out for a counter-attack.';

  const positionRoles = getPositionSetPieceRole(player.position);

  const playerFormation = gameState.currentClub.formation || '4-4-2';
  const oppFormation = deriveFormation(opponent.reputation);
  const formationData = {
    playerFormation,
    oppFormation,
    playerPositions: getFormationPositions(playerFormation),
    oppPositions: getFormationPositions(oppFormation),
  };

  const oppSortedTable = [...gameState.leagueTable].sort((a, b) => b.points - a.points);
  const oppTablePos = oppSortedTable.findIndex((e) => e.clubId === opponent.id) + 1;
  const oppStyleMemo = deriveTacticalStyle(oppTablePos);

  const isForwardPos = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const isMidfieldPos = ['CM', 'CDM'].includes(player.position);
  const dangerZones: { level: 'critical' | 'high' | 'medium' | 'low' }[][] = [];
  for (let r = 0; r < 4; r++) {
    const rowCells: { level: 'critical' | 'high' | 'medium' | 'low' }[] = [];
    for (let c = 0; c < 6; c++) {
      const cd = Math.abs(c - 2.5);
      let level: 'critical' | 'high' | 'medium' | 'low';
      if (isForwardPos) {
        level = cd < 1.5 && r < 2 ? 'critical' : cd < 2 ? 'high' : r < 2 ? 'medium' : 'low';
      } else if (isMidfieldPos) {
        level = cd < 1.5 ? 'high' : cd < 2.5 ? 'medium' : 'low';
      } else {
        level = cd < 1 && r < 1 ? 'medium' : 'low';
      }
      rowCells.push({ level });
    }
    dangerZones.push(rowCells);
  }

  const tacticalNotes = [
    {
      time: 'Pre-Match Briefing',
      icon: <ClipboardCheck className="size-3.5" />,
      borderColor: 'border-l-emerald-500',
      content: `Focus on ${oppFormation} weaknesses. Exploit spaces between their lines during transitions.`,
    },
    {
      time: 'Set Piece Review',
      icon: <Target className="size-3.5" />,
      borderColor: 'border-l-amber-500',
      content: `${player.position}: Review marking assignments and attacking runs. Corners are a key opportunity today.`,
    },
    {
      time: 'Positional Scout',
      icon: <Eye className="size-3.5" />,
      borderColor: 'border-l-emerald-500',
      content: `Opposition ${oppStyleMemo} style — they will ${oppStyleMemo === 'Attacking' ? 'commit players forward aggressively' : oppStyleMemo === 'Defensive' ? 'sit deep and look to counter' : 'look to control possession in midfield'}.`,
    },
    {
      time: 'Fitness Advisory',
      icon: <Heart className="size-3.5" />,
      borderColor: player.fitness >= 70 ? 'border-l-emerald-500' : 'border-l-amber-500',
      content: player.fitness >= 70
        ? 'Fit to press for 90 minutes. Use energy wisely in the first half to stay effective late.'
        : 'Manage your intensity carefully. Pick your pressing moments and conserve energy where possible.',
    },
    {
      time: 'Half-Time Adjustment',
      icon: <Lightbulb className="size-3.5" />,
      borderColor: 'border-l-amber-500',
      content: 'If trailing, push fullbacks higher and commit extra bodies forward. If leading, compact the midfield and control tempo.',
    },
    {
      time: 'Mental Preparation',
      icon: <Brain className="size-3.5" />,
      borderColor: 'border-l-red-500',
      content: 'Stay composed under pressure. One moment of individual quality can change the entire game. Trust your training.',
    },
  ];

  const playerOvr = Math.round(
    (attributes.pace + attributes.shooting + attributes.passing + attributes.dribbling + attributes.defending + attributes.physical) / 6
  );
  const oppOvr = Math.round(opponent.quality * 0.85);
  const offBal = isAttacker ? 70 : isDefender ? 35 : 50;
  const qualityDiff = playerOvr - oppOvr;
  const winChance = Math.min(85, Math.max(15, Math.round(50 + qualityDiff * 1.5 + (isHome ? 5 : -5))));
  const keyBattle = player.position === 'ST'
    ? { p: 'ST', o: 'CB', ps: attributes.shooting, os: oppOvr + 5 }
    : player.position === 'CB'
      ? { p: 'CB', o: 'ST', ps: attributes.defending, os: oppOvr + 8 }
      : ['CM', 'CDM', 'CAM'].includes(player.position)
        ? { p: player.position, o: 'CM', ps: attributes.passing, os: oppOvr + 3 }
        : { p: player.position, o: 'LW', ps: attributes.pace, os: oppOvr + 5 };
  const strategySummary = { playerOvr, oppOvr, offBal, win: winChance, battle: keyBattle };

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Attacking Set Pieces */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Attacking Set Pieces</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold text-white`}>Corner Kicks</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{cornerAdvice}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="size-3.5 text-amber-400" />
                <span className={`text-xs font-semibold text-white`}>Free Kicks</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{freeKickAdvice}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold text-white`}>Penalties</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{penaltyAdvice}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <PenLine className="size-3.5 text-cyan-400" />
                <span className={`text-xs font-semibold text-white`}>Throw-ins</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{throwInAdvice}</p>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Defending Set Pieces */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Defending Set Pieces</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldOff className="size-3.5 text-red-400" />
                <span className={`text-xs font-semibold text-white`}>Defending Corners</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{defendingCornerAdvice}</p>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="size-3.5 text-amber-400" />
                <span className={`text-xs font-semibold text-white`}>Defending Free Kicks</span>
              </div>
              <p className={`text-xs leading-relaxed ${TEXT_SECONDARY}`}>{defendingFreeKickAdvice}</p>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Position-Specific Set Piece Role */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Your Set Piece Role ({player.position})</SectionTitle>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="size-3.5 text-emerald-400" />
                <span className={`text-xs font-semibold ${EMERALD}`}>Attacking Role</span>
              </div>
              <ul className="space-y-1.5">
                {positionRoles.attacking.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="size-3 text-emerald-400 mt-0.5 shrink-0" />
                    <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`h-px bg-[#21262d]`} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingDown className="size-3.5 text-red-400" />
                <span className={`text-xs font-semibold ${RED_TEXT}`}>Defending Role</span>
              </div>
              <ul className="space-y-1.5">
                {positionRoles.defending.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="size-3 text-red-400 mt-0.5 shrink-0" />
                    <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* =========================================================== */}
      {/* Section: Formation Pitch Overlay                                      */}
      {/* =========================================================== */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${TEXT_SECONDARY}`}>
              Formation Overview
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-emerald-500" />
                <span className={`text-[10px] ${TEXT_PRIMARY}`}>{formationData.playerFormation}</span>
              </div>
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>vs</span>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-red-500" />
                <span className={`text-[10px] ${TEXT_PRIMARY}`}>{formationData.oppFormation}</span>
              </div>
            </div>
          </div>
          <div className="relative w-full max-w-[260px] mx-auto" style={{ aspectRatio: '7/10' }}>
            <svg viewBox="0 0 280 400" className="w-full h-full" fill="none">
              {/* Pitch background */}
              <rect x="0" y="0" width="280" height="400" rx="4" fill="#1a3a2a" />
              {/* Pitch outline */}
              <rect x="10" y="10" width="260" height="380" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
              {/* Center line */}
              <line x1="10" y1="200" x2="270" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Center circle */}
              <circle cx="140" cy="200" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
              <circle cx="140" cy="200" r="3" fill="rgba(255,255,255,0.2)" />
              {/* Top penalty area */}
              <rect x="55" y="10" width="170" height="60" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
              <rect x="85" y="10" width="110" height="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              {/* Bottom penalty area */}
              <rect x="55" y="330" width="170" height="60" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
              <rect x="85" y="365" width="110" height="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              {/* Penalty spots */}
              <circle cx="140" cy="50" r="2" fill="rgba(255,255,255,0.3)" />
              <circle cx="140" cy="350" r="2" fill="rgba(255,255,255,0.3)" />
              {/* Corner arcs */}
              <path d="M 10 15 Q 15 10, 25 10" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              <path d="M 255 10 Q 270 10, 270 25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              <path d="M 10 385 Q 15 390, 25 390" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              <path d="M 255 390 Q 270 390, 270 375" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
              {/* Player positions (green — bottom half, our goal at bottom) */}
              {formationData.playerPositions.map((pos, i) => (
                <g key={`p-${i}`}>
                  <circle
                    cx={pos.x * 280}
                    cy={(1 - pos.y) * 400}
                    r="13"
                    fill="rgba(16,185,129,0.25)"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pos.x * 280}
                    y={(1 - pos.y) * 400 + 4}
                    textAnchor="middle"
                    fill="#10b981"
                    fontSize="8"
                    fontWeight="600"
                  >
                    {pos.label}
                  </text>
                </g>
              ))}
              {/* Opponent positions (red — top half, their goal at top) */}
              {formationData.oppPositions.map((pos, i) => (
                <g key={`o-${i}`}>
                  <circle
                    cx={pos.x * 280}
                    cy={pos.y * 400}
                    r="13"
                    fill="rgba(239,68,68,0.2)"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pos.x * 280}
                    y={pos.y * 400 + 4}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="8"
                    fontWeight="600"
                  >
                    {pos.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </InfoCard>
      </motion.div>

      {/* =========================================================== */}
      {/* Section: Set-Piece Routine Cards                                 */}
      {/* =========================================================== */}
      <motion.div variants={staggerChild}>
        <SectionTitle>Set-Piece Routines</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {/* Corner Attacking */}
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="size-4 text-emerald-400" />
                <span className={`text-[11px] font-semibold text-white`}>Corner (ATK)</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isAttacker ? `${EMERALD_BG} ${EMERALD}` : `${AMBER_BG} ${AMBER_TEXT}`}`}>
                {isAttacker ? 'Primary' : 'Secondary'}
              </span>
            </div>
            <svg viewBox="0 0 80 60" className="w-full h-14">
              <rect x="0" y="0" width="80" height="60" fill="#1a3a2a" rx="2" />
              <rect x="20" y="0" width="60" height="40" stroke="rgba(255,255,255,0.2)" fill="none" rx="1" />
              <rect x="30" y="0" width="40" height="15" stroke="rgba(255,255,255,0.15)" fill="none" rx="1" />
              <circle cx="78" cy="58" r="2" fill="#f59e0b" />
              <path d="M 76 56 Q 48 28, 34 14" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2" fill="none" />
              <circle cx="34" cy="17" r="4" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="1" />
              <circle cx="54" cy="24" r="4" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="1" />
              <circle cx="44" cy="34" r="4" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="1" />
            </svg>
            <p className={`text-[10px] leading-relaxed ${TEXT_SECONDARY}`}>
              {isAttacker
                ? 'Position between CBs, attack near post for flick-ons'
                : isDefender
                  ? 'Hold halfway line, cover counter-attacks'
                  : 'Edge of box for cut-backs and rebounds'}
            </p>
          </div>

          {/* Corner Defensive */}
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldOff className="size-4 text-red-400" />
                <span className={`text-[11px] font-semibold text-white`}>Corner (DEF)</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDefender ? `${RED_BG} ${RED_TEXT}` : 'bg-[#21262d] text-[#8b949e]'}`}>
                {isDefender ? 'Primary' : 'Auxiliary'}
              </span>
            </div>
            <svg viewBox="0 0 80 60" className="w-full h-14">
              <rect x="0" y="0" width="80" height="60" fill="#1a3a2a" rx="2" />
              <rect x="20" y="0" width="60" height="40" stroke="rgba(255,255,255,0.2)" fill="none" rx="1" />
              <rect x="30" y="0" width="40" height="15" stroke="rgba(255,255,255,0.15)" fill="none" rx="1" />
              <circle cx="78" cy="58" r="2" fill="#f59e0b" />
              <circle cx="34" cy="19" r="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1" />
              <circle cx="50" cy="14" r="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1" />
              <circle cx="60" cy="24" r="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1" />
              <circle cx="40" cy="9" r="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1" />
              <rect x="37" y="1" width="6" height="5" fill="rgba(239,68,68,0.5)" rx="1" />
            </svg>
            <p className={`text-[10px] leading-relaxed ${TEXT_SECONDARY}`}>
              {isDefender
                ? 'Mark tallest opponent, organize zonal marking system'
                : 'Track back quickly, block shooting lanes from edge'}
            </p>
          </div>

          {/* Free Kick Attacking */}
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-amber-400" />
                <span className={`text-[11px] font-semibold text-white`}>Free Kick (ATK)</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${(hasGoodShooting || hasGoodPassing) ? `${EMERALD_BG} ${EMERALD}` : `${AMBER_BG} ${AMBER_TEXT}`}`}>
                {(hasGoodShooting || hasGoodPassing) ? 'Primary' : 'Secondary'}
              </span>
            </div>
            <svg viewBox="0 0 80 60" className="w-full h-14">
              <rect x="0" y="0" width="80" height="60" fill="#1a3a2a" rx="2" />
              <rect x="20" y="0" width="60" height="40" stroke="rgba(255,255,255,0.2)" fill="none" rx="1" />
              <line x1="40" y1="30" x2="56" y2="30" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              <circle cx="30" cy="38" r="4" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="1" />
              <path d="M 31 37 L 56 5" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2" fill="none" />
              <rect x="30" y="0" width="20" height="3" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </svg>
            <p className={`text-[10px] leading-relaxed ${TEXT_SECONDARY}`}>
              {hasGoodShooting
                ? 'Line up over the wall, aim for far top corner'
                : hasGoodPassing
                  ? 'Deliver from wide areas into the box'
                  : 'Position for rebounds on the edge of the area'}
            </p>
          </div>

          {/* Free Kick Defensive */}
          <div className={`${CARD_BG} border ${BORDER_COLOR} rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-400" />
                <span className={`text-[11px] font-semibold text-white`}>Free Kick (DEF)</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDefender ? `${RED_BG} ${RED_TEXT}` : `${AMBER_BG} ${AMBER_TEXT}`}`}>
                {isDefender ? 'Primary' : 'Secondary'}
              </span>
            </div>
            <svg viewBox="0 0 80 60" className="w-full h-14">
              <rect x="0" y="0" width="80" height="60" fill="#1a3a2a" rx="2" />
              <rect x="20" y="0" width="60" height="40" stroke="rgba(255,255,255,0.2)" fill="none" rx="1" />
              <line x1="38" y1="28" x2="53" y2="28" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
              <rect x="37" y="6" width="6" height="5" fill="rgba(239,68,68,0.5)" rx="1" />
              <circle cx="45" cy="38" r="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1" />
              <line x1="25" y1="35" x2="70" y2="35" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
            <p className={`text-[10px] leading-relaxed ${TEXT_SECONDARY}`}>
              {isDefender
                ? 'Set wall quickly, step out on the kicker\'s run'
                : 'Stand on goal line or cover the wall gap'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* =========================================================== */}
      {/* Section: Danger Zone Heat Map                                      */}
      {/* =========================================================== */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Danger Zone Heat Map — Opponent Defensive Third</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-1">
              {dangerZones.map((row, ri) =>
                row.map((cell, ci) => {
                  const colorMap: Record<string, string> = {
                    critical: 'bg-red-500/40 border-red-500/30',
                    high: 'bg-red-500/20 border-red-500/15',
                    medium: 'bg-amber-500/20 border-amber-500/15',
                    low: 'bg-[#21262d] border-[#30363d]/50',
                  };
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`aspect-square border rounded-sm ${colorMap[cell.level]}`}
                    />
                  );
                })
              )}
            </div>
            {/* Axis labels */}
            <div className="flex items-center justify-between">
              <span className={`text-[9px] ${TEXT_SECONDARY}`}>← Wide</span>
              <span className={`text-[9px] ${TEXT_SECONDARY}`}>Central</span>
              <span className={`text-[9px] ${TEXT_SECONDARY}`}>Wide →</span>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-red-500/40 border border-red-500/30" />
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-red-500/20 border border-red-500/15" />
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-amber-500/20 border border-amber-500/15" />
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm bg-[#21262d] border border-[#30363d]/50" />
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>Low</span>
              </div>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* =========================================================== */}
      {/* Section: Tactical Notes Timeline                                   */}
      {/* =========================================================== */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Tactical Notes — Coaching Staff</SectionTitle>
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute left-0 top-1 bottom-1 w-px bg-[#30363d]" />
            <div className="space-y-4">
              {tacticalNotes.map((note, i) => {
                const iconColorMap: Record<string, string> = {
                  'border-l-emerald-500': 'bg-emerald-500/20 text-emerald-400',
                  'border-l-amber-500': 'bg-amber-500/20 text-amber-400',
                  'border-l-red-500': 'bg-red-500/20 text-red-400',
                };
                const iconColors = iconColorMap[note.borderColor] || 'bg-[#21262d] text-[#8b949e]';
                return (
                  <div key={i} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className={`absolute left-[-5px] top-0.5 size-2.5 rounded-sm border border-[#30363d] ${iconColors.split(' ')[0]}`} />
                    <div className={`border-l-2 ${note.borderColor} pl-3 py-1`}
                      style={{ marginLeft: '-4px' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={iconColors.split(' ')[1]}>{note.icon}</span>
                        <span className={`text-[10px] font-semibold ${TEXT_PRIMARY}`}>{note.time}</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${TEXT_SECONDARY}`}>{note.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* =========================================================== */}
      {/* Section: Match Strategy Summary                                   */}
      {/* =========================================================== */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Match Strategy Summary</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {/* Key Battle */}
            <div className="space-y-2">
              <div className={`text-[10px] uppercase font-semibold ${TEXT_SECONDARY}`}>Key Battle</div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold text-white`}>{strategySummary.battle.p}</span>
                <span className={`text-[9px] ${TEXT_SECONDARY}`}>vs</span>
                <span className={`text-[11px] font-bold text-white`}>{strategySummary.battle.o}</span>
              </div>
              <div className="h-1.5 w-full bg-[#21262d] rounded overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${strategySummary.battle.ps}%` }}
                  />
                  <div className="bg-[#21262d] h-full min-w-[1px]" style={{ width: '2%' }} />
                  <div
                    className="bg-red-500/60 h-full"
                    style={{ width: `${strategySummary.battle.os}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono ${strategySummary.battle.ps >= strategySummary.battle.os ? EMERALD : RED_TEXT}`}>
                  {strategySummary.battle.ps}
                </span>
                <span className={`text-[9px] font-mono ${strategySummary.battle.os > strategySummary.battle.ps ? EMERALD : RED_TEXT}`}>
                  {strategySummary.battle.os}
                </span>
              </div>
            </div>

            {/* Game Plan Balance */}
            <div className="space-y-2">
              <div className={`text-[10px] uppercase font-semibold ${TEXT_SECONDARY}`}>Game Plan</div>
              <div className="flex items-center justify-between text-[9px]">
                <span className={EMERALD}>ATK {strategySummary.offBal}%</span>
                <span className={RED_TEXT}>DEF {100 - strategySummary.offBal}%</span>
              </div>
              <div className="h-2 w-full bg-[#21262d] rounded overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${strategySummary.offBal}%` }}
                  />
                  <div
                    className="bg-red-500/60 h-full"
                    style={{ width: `${100 - strategySummary.offBal}%` }}
                  />
                </div>
              </div>
              <p className={`text-[9px] ${TEXT_SECONDARY}`}>
                {strategySummary.offBal >= 60
                  ? 'Attacking mindset — push high and create chances'
                  : strategySummary.offBal <= 40
                    ? 'Defensive solidity — compact shape, hit on breaks'
                    : 'Balanced approach — controlled tempo throughout'}
              </p>
            </div>

            {/* Win Probability Donut */}
            <div className="space-y-2">
              <div className={`text-[10px] uppercase font-semibold ${TEXT_SECONDARY}`}>Win Probability</div>
              <div className="flex justify-center">
                <svg viewBox="0 0 100 100" className="size-20">
                  {/* Background track */}
                  <circle
                    cx="50" cy="50" r="36"
                    fill="none"
                    stroke="#21262d"
                    strokeWidth="8"
                  />
                  {/* Win chance arc */}
                  <circle
                    cx="50" cy="50" r="36"
                    fill="none"
                    stroke={strategySummary.win >= 55 ? '#10b981' : strategySummary.win >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray={`${(strategySummary.win / 100) * 226.2} 226.2`}
                    strokeLinecap="butt"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Center text */}
                  <text
                    x="50" y="48"
                    textAnchor="middle"
                    fill="#c9d1d9"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    {strategySummary.win}%
                  </text>
                  <text
                    x="50" y="62"
                    textAnchor="middle"
                    fill="#8b949e"
                    fontSize="9"
                    fontWeight="600"
                  >
                    WIN
                  </text>
                </svg>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className={TEXT_SECONDARY}>You {strategySummary.playerOvr}</span>
                <span className={TEXT_SECONDARY}>Them {strategySummary.oppOvr}</span>
              </div>
            </div>
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Tab 5 — Match Plan
// ============================================================

const CHECKLIST_ITEMS = [
  { id: 'review_tactics', label: 'Review tactics', icon: <Eye className="size-3.5" /> },
  { id: 'check_fitness', label: 'Check fitness', icon: <Heart className="size-3.5" /> },
  { id: 'set_mindset', label: 'Set mindset', icon: <Brain className="size-3.5" /> },
  { id: 'review_opponents', label: 'Review opponents', icon: <BarChart3 className="size-3.5" /> },
  { id: 'mental_prep', label: 'Mental preparation', icon: <Dumbbell className="size-3.5" /> },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]['id'];

const MINDSET_OPTIONS = [
  {
    id: 'aggressive' as const,
    label: 'Aggressive',
    description: 'Push forward, high pressing, take risks',
    icon: <Zap className="size-4" />,
    color: RED_TEXT,
    bg: RED_BG,
    border: RED_BORDER,
  },
  {
    id: 'balanced' as const,
    label: 'Balanced',
    description: 'Measured approach, controlled tempo',
    icon: <Scale className="size-4" />,
    color: AMBER_TEXT,
    bg: AMBER_BG,
    border: AMBER_BORDER,
  },
  {
    id: 'conservative' as const,
    label: 'Conservative',
    description: 'Solid defense, absorb pressure',
    icon: <ShieldOff className="size-4" />,
    color: EMERALD,
    bg: EMERALD_BG,
    border: EMERALD_BORDER,
  },
] as const;

type MindsetType = 'aggressive' | 'balanced' | 'conservative';

function MatchPlanTab() {
  const gameState = useGameStore((s) => s.gameState);
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    review_tactics: true,
    check_fitness: false,
    set_mindset: false,
    review_opponents: false,
    mental_prep: false,
  });
  const [selectedMindset, setSelectedMindset] = useState<MindsetType>('balanced');
  const [notes, setNotes] = useState('');

  const toggleChecklist = useCallback((id: ChecklistKey) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!gameState) return null;

  const { player, currentWeek, currentSeason, upcomingFixtures } = gameState;

  const nextFixture = upcomingFixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id) &&
      f.competition === 'league'
  );

  const isHome = nextFixture ? nextFixture.homeClubId === gameState.currentClub.id : true;
  const weather = deriveWeather(currentWeek, currentSeason);

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const preparationRating = Math.min(
    100,
    Math.round(
      player.fitness / 30 +
        player.morale / 30 +
        player.form * 10 / 20 +
        (checkedCount / 5) * 20
    )
  );

  const ratingColor =
    preparationRating >= 75
      ? EMERALD
      : preparationRating >= 50
        ? AMBER_TEXT
        : RED_TEXT;

  const ratingLabel =
    preparationRating >= 90
      ? 'Excellent'
      : preparationRating >= 75
        ? 'Good'
        : preparationRating >= 50
          ? 'Adequate'
          : preparationRating >= 25
            ? 'Poor'
            : 'Critical';

  const contextTips = getContextTips(
    player.morale,
    player.fitness,
    player.form,
    isHome,
    weather
  );

  const gaugePercent = Math.min(preparationRating, 100);

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Pre-match Checklist */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Pre-Match Checklist ({checkedCount}/5)</SectionTitle>
          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item) => {
              const checked = checklist[item.id];
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleChecklist(item.id)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${TEXT_SECONDARY} group-hover:text-[#c9d1d9]`}>
                      {item.icon}
                    </span>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        checked ? `${TEXT_PRIMARY} line-through opacity-60` : TEXT_PRIMARY
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Mindset Selector */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Match Mindset</SectionTitle>
          <div className="space-y-2">
            {MINDSET_OPTIONS.map((opt) => {
              const isSelected = selectedMindset === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedMindset(opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-opacity text-left ${
                    isSelected
                      ? `${opt.bg} ${opt.border}`
                      : `border-[#21262d] bg-[#0d1117] opacity-70 hover:opacity-100`
                  }`}
                >
                  <div
                    className={`flex items-center justify-center size-5 rounded border ${
                      isSelected
                        ? `${opt.bg} ${opt.border} ${opt.color}`
                        : 'border-[#30363d] bg-[#161b22]'
                    }`}
                  >
                    {isSelected && <div className={`size-2 rounded-sm ${opt.color === EMERALD ? 'bg-emerald-400' : opt.color === AMBER_TEXT ? 'bg-amber-400' : 'bg-red-400'}`} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? opt.color : TEXT_SECONDARY}>{opt.icon}</span>
                    <div>
                      <div className={`text-xs font-semibold ${isSelected ? opt.color : TEXT_SECONDARY}`}>
                        {opt.label}
                      </div>
                      <div className={`text-[10px] ${TEXT_SECONDARY}`}>
                        {opt.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Preparation Rating */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Preparation Rating</SectionTitle>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${ratingColor}`}>{preparationRating}</span>
              <span className={`text-xs ${TEXT_SECONDARY}`}>/100</span>
            </div>
            <span className={`text-xs font-medium ${ratingColor}`}>{ratingLabel}</span>
          </div>
          <div className="h-2.5 w-full bg-[#21262d] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${gaugePercent}%`,
                backgroundColor:
                  gaugePercent >= 75 ? '#10b981' : gaugePercent >= 50 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center justify-between p-1.5 bg-[#0d1117] rounded">
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>Fitness</span>
              <span className={`text-[10px] font-mono ${TEXT_PRIMARY}`}>{Math.round(player.fitness / 30 * 100 / 3.33)}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-[#0d1117] rounded">
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>Morale</span>
              <span className={`text-[10px] font-mono ${TEXT_PRIMARY}`}>{Math.round(player.morale / 30 * 100 / 3.33)}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-[#0d1117] rounded">
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>Form</span>
              <span className={`text-[10px] font-mono ${TEXT_PRIMARY}`}>{Math.round(player.form * 10)}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-[#0d1117] rounded">
              <span className={`text-[10px] ${TEXT_SECONDARY}`}>Checklist</span>
              <span className={`text-[10px] font-mono ${TEXT_PRIMARY}`}>{checkedCount * 20}</span>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Pre-Match Notes */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Pre-Match Notes</SectionTitle>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 500) setNotes(e.target.value);
              }}
              placeholder="Write your pre-match notes, reminders, and key focus areas..."
              className="w-full h-24 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-[#c9d1d9] placeholder:text-[#484f58] resize-none focus:outline-none focus:border-emerald-500/50"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className={`size-3 ${TEXT_SECONDARY}`} />
                <span className={`text-[10px] ${TEXT_SECONDARY}`}>Notes are persisted for this session</span>
              </div>
              <span className={`text-[10px] ${notes.length >= 450 ? RED_TEXT : TEXT_SECONDARY}`}>
                {notes.length}/500
              </span>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Context-Aware Tips */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <SectionTitle>Context Tips</SectionTitle>
          <ul className="space-y-2">
            {contextTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb className={`size-3.5 mt-0.5 shrink-0 ${
                  tip.includes('High morale') || tip.includes('Peak fitness') || tip.includes('Excellent form') || tip.includes('Home advantage') || tip.includes('Perfect conditions')
                    ? 'text-emerald-400'
                    : tip.includes('Low morale') || tip.includes('Low fitness') || tip.includes('Poor form') || tip.includes('Away fixture') || tip.includes('Storm')
                      ? 'text-red-400'
                      : 'text-amber-400'
                }`} />
                <span className={`text-xs leading-relaxed ${TEXT_PRIMARY}`}>{tip}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TacticalBriefing() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState('next-match');

  if (!gameState) {
    return (
      <div className={`min-h-screen ${DARK_BG} flex items-center justify-center`}>
        <div className={`${TEXT_SECONDARY} text-sm`}>No active game session.</div>
      </div>
    );
  }

  const { currentWeek, currentSeason } = gameState;

  return (
    <div className={`min-h-screen ${DARK_BG} pb-20`}>
      {/* Header */}
      <motion.div
        className="sticky top-0 z-10 border-b border-[#30363d] bg-[#0d1117]/95 px-4 py-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center justify-center size-8 rounded-lg ${EMERALD_BG} ${EMERALD_BORDER} border`}>
              <Swords className="size-4 text-emerald-400" />
            </div>
            <div>
              <h1 className={`text-sm font-bold text-white tracking-tight`}>
                Tactical Briefing
              </h1>
              <p className={`text-[10px] ${TEXT_SECONDARY}`}>
                Season {currentSeason} · Week {currentWeek}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${CARD_BG} border ${BORDER_COLOR}`}>
            <Swords className="size-3 text-emerald-400" />
            <span className={`text-[10px] font-medium ${TEXT_PRIMARY}`}>Pre-Match</span>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-1 h-auto flex-wrap">
            <TabsTrigger
              value="next-match"
              className="flex-1 text-[10px] gap-1 py-2 rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
            >
              <Swords className="size-3" />
              Match
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="flex-1 text-[10px] gap-1 py-2 rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
            >
              <BarChart3 className="size-3" />
              Analysis
            </TabsTrigger>
            <TabsTrigger
              value="weaknesses"
              className="flex-1 text-[10px] gap-1 py-2 rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
            >
              <ShieldOff className="size-3" />
              Weaknesses
            </TabsTrigger>
            <TabsTrigger
              value="set-pieces"
              className="flex-1 text-[10px] gap-1 py-2 rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
            >
              <Target className="size-3" />
              Set Pieces
            </TabsTrigger>
            <TabsTrigger
              value="match-plan"
              className="flex-1 text-[10px] gap-1 py-2 rounded-md data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
            >
              <ClipboardCheck className="size-3" />
              Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {activeTab === 'next-match' && <NextMatchTab />}
                {activeTab === 'analysis' && <AnalysisTab />}
                {activeTab === 'weaknesses' && <WeaknessesTab />}
                {activeTab === 'set-pieces' && <SetPiecesTab />}
                {activeTab === 'match-plan' && <MatchPlanTab />}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
