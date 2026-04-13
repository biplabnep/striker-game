'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getClubById, CUP_NAMES, CUP_MATCH_WEEKS } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, XCircle, Crown, Swords, ChevronRight, Calendar, Users,
  CheckCircle2, Target, BarChart3, TrendingUp, MapPin, MinusCircle,
  Eye, Flame, Star, Zap, Home, Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Fixture, MatchResult } from '@/lib/game/types';

// ─── Round name helper ─────────────────────────────────────────────────
function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  return `Round ${round}`;
}

function getRoundAbbrev(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'F';
  if (round === totalRounds - 1) return 'SF';
  if (round === totalRounds - 2) return 'QF';
  return `R${round}`;
}

// ─── Match result type for timeline ─────────────────────────────────────
interface CupRunMatch {
  round: number;
  roundName: string;
  opponent: string;
  opponentLogo: string;
  playerScore: number;
  opponentScore: number;
  result: 'W' | 'D' | 'L';
  isHome: boolean;
  playerGoals: number;
  playerAssists: number;
  playerRating: number;
  isKeyMoment: boolean;
  matchDate: string;
}

// ─── SVG bracket types ──────────────────────────────────────────────────
interface BracketMatch {
  fixture: Fixture;
  homeClub: { id: string; shortName: string; logo: string };
  awayClub: { id: string; shortName: string; logo: string };
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  isPlayerMatch: boolean;
  winnerId: string | null;
  roundIdx: number;
  matchIdx: number;
}

interface BracketRound {
  roundNum: number;
  name: string;
  abbrev: string;
  matches: BracketMatch[];
}

// ─── SVG Trophy Icon Component ──────────────────────────────────────────
function TrophyIcon({ size = 48, color = '#d97706' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8h20v2c0 4-2 7-5 9l1 5H18l1-5c-3-2-5-5-5-9V8z" fill={color} opacity="0.9"/>
      <path d="M14 10H8c0 6 3 10 8 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 10h6c0 6-3 10-8 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <rect x="18" y="24" width="12" height="4" rx="1" fill={color} opacity="0.7"/>
      <rect x="16" y="28" width="16" height="3" rx="1" fill={color} opacity="0.5"/>
      <rect x="14" y="31" width="20" height="4" rx="2" fill={color} opacity="0.8"/>
      {/* Star */}
      <path d="M24 4l1.5 3H29l-2.5 2 1 3L24 10l-3.5 2 1-3L19 7h3.5L24 4z" fill="#fbbf24" opacity="0.9"/>
    </svg>
  );
}

// ─── Mini Trophy for bracket winner ─────────────────────────────────────
function MiniTrophyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6h12v1.5c0 3-1.5 5-3.5 6.5l.7 3h-6.4l.7-3C11.5 12.5 10 10.5 10 7.5V6z" fill="#fbbf24"/>
      <path d="M10 7.5H6c0 4 2 7 6 8.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M22 7.5h4c0 4-2 7-6 8.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="17" width="8" height="2.5" rx="0.5" fill="#d97706"/>
      <rect x="10.5" y="19.5" width="11" height="2" rx="1" fill="#92400e"/>
      <rect x="9.5" y="21.5" width="13" height="3" rx="1.5" fill="#fbbf24"/>
      <path d="M16 2.5l1 2h2.2l-1.8 1.3.7 2.2L16 6.7l-2.1 1.3.7-2.2-1.8-1.3h2.2L16 2.5z" fill="#fef3c7"/>
    </svg>
  );
}

export default function CupBracket() {
  const gameState = useGameStore(state => state.gameState);

  // ─── Core cup info (existing, enhanced) ─────────────────────────────
  const cupInfo = useMemo(() => {
    if (!gameState) return null;

    const { cupFixtures, cupRound, cupEliminated, currentClub, currentWeek } = gameState;
    const cupData = CUP_NAMES[currentClub.league];
    if (!cupData) return null;

    // Calculate total rounds from fixtures
    const maxRound = cupFixtures.length > 0
      ? Math.max(...cupFixtures.map(f => f.matchday))
      : 1;

    // Group fixtures by round
    const rounds: { round: number; name: string; fixtures: Fixture[]; week: number }[] = [];
    for (let r = 1; r <= maxRound; r++) {
      const roundFixtures = cupFixtures.filter(f => f.matchday === r);
      const cupWeekIdx = r - 1;
      const week = cupWeekIdx < CUP_MATCH_WEEKS.length ? CUP_MATCH_WEEKS[cupWeekIdx] : r * 4;
      rounds.push({
        round: r,
        name: getRoundName(r, maxRound),
        fixtures: roundFixtures,
        week,
      });
    }

    // Find player's next cup match
    const playerNextCupMatch = cupFixtures.find(
      f => f.matchday === cupRound && !f.played &&
           (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );

    const nextCupOpponent = playerNextCupMatch
      ? getClubById(playerNextCupMatch.homeClubId === currentClub.id
          ? playerNextCupMatch.awayClubId
          : playerNextCupMatch.homeClubId)
      : null;

    // Check if player won the cup
    const isCupWinner = !cupEliminated && cupRound > maxRound;

    // Check if this is a cup week
    const isCupWeek = CUP_MATCH_WEEKS.includes(currentWeek);

    // Count remaining teams in current round
    const currentRoundFixtures = cupFixtures.filter(f => f.matchday === cupRound);
    const currentRoundPlayed = currentRoundFixtures.filter(f => f.played);

    return {
      cupName: cupData.name,
      cupEmoji: cupData.emoji,
      cupRound,
      maxRound,
      cupEliminated,
      isCupWinner,
      rounds,
      playerNextCupMatch,
      nextCupOpponent,
      isCupWeek,
      currentWeek,
      remainingTeams: currentRoundFixtures.length > 0 ? currentRoundFixtures.length * 2 : 0,
      currentRoundPlayed: currentRoundPlayed.length,
      currentRoundTotal: currentRoundFixtures.length,
      eliminatedRound: cupEliminated ? cupRound - 1 : null,
    };
  }, [gameState]);

  // ─── Cup run timeline — player's cup journey matches ────────────────
  const cupRunTimeline = useMemo((): CupRunMatch[] => {
    if (!gameState) return [];

    const playerClubId = gameState.currentClub.id;
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    return cupResults.map(result => {
      const isHome = result.homeClub.id === playerClubId;
      const opponent = isHome ? result.awayClub : result.homeClub;
      const playerScore = isHome ? result.homeScore : result.awayScore;
      const opponentScore = isHome ? result.awayScore : result.homeScore;

      let resultType: 'W' | 'D' | 'L';
      if (playerScore > opponentScore) resultType = 'W';
      else if (playerScore < opponentScore) resultType = 'L';
      else resultType = 'D';

      // Determine round from week
      const roundIdx = CUP_MATCH_WEEKS.findIndex(w => w === result.week);
      const round = roundIdx >= 0 ? roundIdx + 1 : 1;
      const maxRound = gameState.cupFixtures.length > 0
        ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
        : 1;

      return {
        round,
        roundName: getRoundName(round, maxRound),
        opponent: opponent.shortName,
        opponentLogo: opponent.logo,
        playerScore,
        opponentScore,
        result: resultType,
        isHome,
        playerGoals: result.playerGoals,
        playerAssists: result.playerAssists,
        playerRating: result.playerRating,
        isKeyMoment: result.playerGoals > 0 || result.playerAssists > 0,
        matchDate: `Season ${result.season}, Week ${result.week}`,
      };
    });
  }, [gameState]);

  // ─── Cup match score lookup (for non-player fixture scores) ─────────
  const cupMatchScoreLookup = useMemo(() => {
    if (!gameState) return new Map<string, { homeScore: number; awayScore: number }>();

    const lookup = new Map<string, { homeScore: number; awayScore: number }>();
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    for (const result of cupResults) {
      const key = `${result.homeClub.id}-${result.awayClub.id}`;
      lookup.set(key, {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
    }
    return lookup;
  }, [gameState]);

  // ─── Team form (last 3 W/D/L) for a club ────────────────────────────
  const teamFormLookup = useMemo(() => {
    if (!gameState) return new Map<string, ('W' | 'D' | 'L')[]>();

    const lookup = new Map<string, ('W' | 'D' | 'L')[]>();
    const allResults = gameState.recentResults;

    for (const result of allResults) {
      const homeId = result.homeClub.id;
      const awayId = result.awayClub.id;
      const homeWon = result.homeScore > result.awayScore;
      const draw = result.homeScore === result.awayScore;

      for (const [clubId, won] of [[homeId, homeWon], [awayId, !homeWon && !draw]] as [string, boolean][]) {
        if (!lookup.has(clubId)) lookup.set(clubId, []);
        const form = lookup.get(clubId)!;
        if (form.length < 3) {
          if (won) form.push('W');
          else if (draw) form.push('D');
          else form.push('L');
        }
      }
    }
    return lookup;
  }, [gameState]);

  // ─── Opponent scout data ─────────────────────────────────────────────
  const opponentScout = useMemo(() => {
    if (!cupInfo?.nextCupOpponent || !gameState) return null;

    const opponent = cupInfo.nextCupOpponent;
    const standing = gameState.leagueTable.find(s => s.clubId === opponent.id);

    const formDots: ('W' | 'D' | 'L')[] = [];
    if (standing) {
      const total = standing.won + standing.drawn + standing.lost;
      const wRatio = total > 0 ? standing.won / total : 0;
      const dRatio = total > 0 ? standing.drawn / total : 0;
      for (let i = 0; i < 5; i++) {
        const r = Math.random();
        if (r < wRatio) formDots.push('W');
        else if (r < wRatio + dRatio) formDots.push('D');
        else formDots.push('L');
      }
    }

    const avgGoalsScored = standing && standing.played > 0
      ? (standing.goalsFor / standing.played).toFixed(1)
      : '-';
    const avgGoalsConceded = standing && standing.played > 0
      ? (standing.goalsAgainst / standing.played).toFixed(1)
      : '-';

    return {
      club: opponent,
      position: standing ? standing.played > 0 ? standing.played : null : null,
      leaguePosition: standing
        ? gameState.leagueTable.findIndex(s => s.clubId === opponent.id) + 1
        : null,
      totalTeams: gameState.leagueTable.length,
      formDots,
      avgGoalsScored,
      avgGoalsConceded,
    };
  }, [cupInfo?.nextCupOpponent, gameState]);

  // ─── Cup statistics ──────────────────────────────────────────────────
  const cupStatistics = useMemo(() => {
    if (!gameState) return null;

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const cupGoals = cupResults.reduce((sum, r) => sum + r.playerGoals, 0);
    const cupAppearances = cupResults.length;
    const wins = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore > opponentScore;
    }).length;
    const winRate = cupAppearances > 0 ? Math.round((wins / cupAppearances) * 100) : 0;

    const playerClubId = gameState.currentClub.id;
    const playerCupFixtures = gameState.cupFixtures.filter(
      f => f.homeClubId === playerClubId || f.awayClubId === playerClubId
    );
    const maxRound = gameState.cupFixtures.length > 0
      ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
      : 1;

    const lastPlayedPlayerFixture = [...playerCupFixtures]
      .filter(f => f.played)
      .sort((a, b) => b.matchday - a.matchday)[0];

    const bestRun = lastPlayedPlayerFixture
      ? getRoundName(lastPlayedPlayerFixture.matchday, maxRound)
      : 'None yet';

    const losses = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore < opponentScore;
    }).length;
    const draws = cupAppearances - wins - losses;

    // MOTM count in cup
    const motmAwards = cupResults.filter(r => r.playerRating >= 8.0).length;

    // Best single-game rating
    const bestRating = cupResults.length > 0
      ? Math.max(...cupResults.map(r => r.playerRating))
      : 0;

    return {
      cupGoals,
      cupAppearances,
      wins,
      draws,
      losses,
      winRate,
      bestRun,
      cupAssists: cupResults.reduce((sum, r) => sum + r.playerAssists, 0),
      motmAwards,
      bestRating,
    };
  }, [gameState]);

  // ─── Historical cup performance (from seasons & trophies) ────────────
  const historicalPerformance = useMemo(() => {
    if (!gameState) return null;

    const cupTrophyNames = Object.values(CUP_NAMES).map(c => c.name);
    const careerTrophies = gameState.player.careerStats?.trophies || [];
    const cupTrophies = careerTrophies.filter(t =>
      cupTrophyNames.some(cn => cn === t.name)
    );

    const seasonHistory = gameState.seasons.map(s => ({
      season: s.number,
      year: s.year,
      bestRun: '-', // derived from current cup context if available
    }));

    return { cupTrophies, seasonHistory };
  }, [gameState]);

  // ─── Bracket tree data for SVG ───────────────────────────────────────
  const bracketData = useMemo((): { rounds: BracketRound[] } | null => {
    if (!cupInfo || !gameState) return null;

    const playerClubId = gameState.currentClub.id;
    const { rounds, maxRound } = cupInfo;

    const bracketRounds: BracketRound[] = rounds.map((rd, roundIdx) => {
      const matches: BracketMatch[] = rd.fixtures.map((fixture, matchIdx) => {
        const homeClub = getClubById(fixture.homeClubId);
        const awayClub = getClubById(fixture.awayClubId);

        const isPlayerMatch =
          fixture.homeClubId === playerClubId || fixture.awayClubId === playerClubId;

        // Score lookup
        const scoreKey = `${fixture.homeClubId}-${fixture.awayClubId}`;
        const scoreData = fixture.played ? cupMatchScoreLookup.get(scoreKey) : null;
        const reverseKey = `${fixture.awayClubId}-${fixture.homeClubId}`;
        const reverseScoreData = !scoreData && fixture.played
          ? cupMatchScoreLookup.get(reverseKey)
          : null;

        const finalScore = scoreData || (reverseScoreData ? {
          homeScore: reverseScoreData.awayScore,
          awayScore: reverseScoreData.homeScore,
        } : null);

        // Determine winner
        let winnerId: string | null = null;
        if (fixture.played && finalScore) {
          if (finalScore.homeScore > finalScore.awayScore) winnerId = fixture.homeClubId;
          else if (finalScore.awayScore > finalScore.homeScore) winnerId = fixture.awayClubId;
        }

        return {
          fixture,
          homeClub: homeClub ? { id: homeClub.id, shortName: homeClub.shortName, logo: homeClub.logo } : { id: fixture.homeClubId, shortName: 'TBD', logo: '❓' },
          awayClub: awayClub ? { id: awayClub.id, shortName: awayClub.shortName, logo: awayClub.logo } : { id: fixture.awayClubId, shortName: 'TBD', logo: '❓' },
          homeScore: finalScore ? finalScore.homeScore : null,
          awayScore: finalScore ? finalScore.awayScore : null,
          played: fixture.played,
          isPlayerMatch,
          winnerId,
          roundIdx,
          matchIdx,
        };
      });

      return {
        roundNum: rd.round,
        name: rd.name,
        abbrev: getRoundAbbrev(rd.round, maxRound),
        matches,
      };
    });

    return { rounds: bracketRounds };
  }, [cupInfo, gameState, cupMatchScoreLookup]);

  // ─── Early return ────────────────────────────────────────────────────
  if (!cupInfo || !gameState) return null;

  const { cupName, cupEmoji, cupRound, maxRound, cupEliminated, isCupWinner, rounds,
          playerNextCupMatch, nextCupOpponent, isCupWeek, currentWeek } = cupInfo;

  // Find the round where player was eliminated
  const eliminatedRoundNum = cupEliminated
    ? gameState.cupFixtures.filter(f =>
        f.played &&
        (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id)
      ).length
    : 0;

  // ─── Render helpers ──────────────────────────────────────────────────
  const getResultColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'text-emerald-400';
      case 'D': return 'text-amber-400';
      case 'L': return 'text-red-400';
    }
  };

  const getResultBg = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'D': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'L': return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
  };

  const getFormDotColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-400';
      case 'D': return 'bg-amber-400';
      case 'L': return 'bg-red-400';
    }
  };

  // ─── SVG Bracket tree rendering ──────────────────────────────────────
  const renderBracketTree = () => {
    if (!bracketData || bracketData.rounds.length === 0) return null;

    const { rounds: bRounds } = bracketData;
    const numRounds = bRounds.length;

    // SVG dimensions
    const matchBoxW = 130;
    const matchBoxH = 38;
    const roundGapX = 36;
    const baseSpacingY = 52;
    const padTop = 32;
    const padLeft = 8;
    const padRight = 60;

    // Calculate column X positions
    const colX = (r: number) => padLeft + r * (matchBoxW + roundGapX);

    // Calculate row Y positions
    const matchesR0 = bRounds[0]?.matches.length || 1;
    const rowY = (roundIdx: number, matchIdx: number): number => {
      if (roundIdx === 0) {
        return padTop + matchIdx * baseSpacingY;
      }
      const parentY1 = rowY(roundIdx - 1, matchIdx * 2);
      const parentY2 = rowY(roundIdx - 1, matchIdx * 2 + 1);
      return (parentY1 + parentY2) / 2;
    };

    // Handle odd first-round fixtures: for rounds beyond 0 where matchIdx * 2 + 1 exceeds available,
    // use the same match's Y
    const safeRowY = (roundIdx: number, matchIdx: number): number => {
      const matchesInPrevRound = bRounds[roundIdx - 1]?.matches.length || 0;
      if (roundIdx === 0) return padTop + matchIdx * baseSpacingY;

      const idx2 = matchIdx * 2;
      const idx3 = matchIdx * 2 + 1;

      if (idx2 < matchesInPrevRound && idx3 < matchesInPrevRound) {
        return (rowY(roundIdx - 1, idx2) + rowY(roundIdx - 1, idx3)) / 2;
      }
      if (idx2 < matchesInPrevRound) {
        return rowY(roundIdx - 1, idx2);
      }
      // Fallback: evenly space
      const totalMatches = bRounds[roundIdx]?.matches.length || 1;
      const totalHeight = (matchesR0 - 1) * baseSpacingY;
      const spacing = totalHeight / Math.max(totalMatches - 1, 1);
      return padTop + matchIdx * spacing;
    };

    const svgWidth = numRounds * matchBoxW + (numRounds - 1) * roundGapX + padLeft + padRight;
    const svgHeight = padTop * 2 + (matchesR0 - 1) * baseSpacingY + matchBoxH + 20;

    const playerClubId = gameState.currentClub.id;

    // Render a single match box
    const renderMatchBox = (match: BracketMatch, x: number, y: number, roundIdx: number) => {
      const boxHasPlayer = match.isPlayerMatch;
      const isPlayed = match.played;
      const isWinnerHome = match.winnerId === match.homeClub.id;
      const isWinnerAway = match.winnerId === match.awayClub.id;
      const isLastRound = roundIdx === numRounds - 1;

      // Box colors
      const boxFill = boxHasPlayer
        ? '#0d2818'
        : isPlayed
        ? '#161b22'
        : '#0d1117';
      const boxStroke = boxHasPlayer
        ? '#10b981'
        : isPlayed
        ? '#30363d'
        : '#21262d';

      return (
        <g key={`match-${match.fixture.id}-${roundIdx}`}>
          {/* Match box background */}
          <rect
            x={x}
            y={y}
            width={matchBoxW}
            height={matchBoxH}
            rx={4}
            fill={boxFill}
            stroke={boxStroke}
            strokeWidth={boxHasPlayer ? 1.5 : 1}
          />

          {/* Home team row */}
          <text
            x={x + 6}
            y={y + 14}
            fill={boxHasPlayer && match.homeClub.id === playerClubId ? '#6ee7b7' : isWinnerHome && isPlayed ? '#c9d1d9' : '#8b949e'}
            fontSize={10}
            fontWeight={boxHasPlayer && match.homeClub.id === playerClubId ? 600 : isWinnerHome && isPlayed ? 500 : 400}
            fontFamily="system-ui"
          >
            {match.homeClub.shortName.substring(0, 12)}
          </text>
          {isPlayed && match.homeScore !== null ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 14}
              fill={isWinnerHome ? '#6ee7b7' : '#8b949e'}
              fontSize={10}
              fontWeight={700}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {match.homeScore}
            </text>
          ) : !isPlayed ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 14}
              fill="#484f58"
              fontSize={8}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {isLastRound ? '—' : '—'}
            </text>
          ) : null}

          {/* Divider line */}
          <line
            x1={x + 4}
            y1={y + matchBoxH / 2}
            x2={x + matchBoxW - 4}
            y2={y + matchBoxH / 2}
            stroke="#30363d"
            strokeWidth={0.5}
          />

          {/* Away team row */}
          <text
            x={x + 6}
            y={y + 30}
            fill={boxHasPlayer && match.awayClub.id === playerClubId ? '#6ee7b7' : isWinnerAway && isPlayed ? '#c9d1d9' : '#8b949e'}
            fontSize={10}
            fontWeight={boxHasPlayer && match.awayClub.id === playerClubId ? 600 : isWinnerAway && isPlayed ? 500 : 400}
            fontFamily="system-ui"
          >
            {match.awayClub.shortName.substring(0, 12)}
          </text>
          {isPlayed && match.awayScore !== null ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 30}
              fill={isWinnerAway ? '#6ee7b7' : '#8b949e'}
              fontSize={10}
              fontWeight={700}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {match.awayScore}
            </text>
          ) : !isPlayed ? (
            <text
              x={x + matchBoxW - 10}
              y={y + 30}
              fill="#484f58"
              fontSize={8}
              textAnchor="end"
              fontFamily="system-ui"
            >
              {isLastRound ? '—' : '—'}
            </text>
          ) : null}

          {/* Player match indicator dot */}
          {boxHasPlayer && (
            <circle
              cx={x - 4}
              cy={y + matchBoxH / 2}
              r={3}
              fill="#10b981"
            />
          )}
        </g>
      );
    };

    // Render connector lines between rounds
    const renderConnectors = () => {
      const lines: React.ReactElement[] = [];

      for (let r = 0; r < numRounds - 1; r++) {
        const currentMatches = bRounds[r]?.matches || [];
        const nextMatches = bRounds[r + 1]?.matches || [];

        for (let m = 0; m < nextMatches.length; m++) {
          const feeder1Idx = m * 2;
          const feeder2Idx = m * 2 + 1;

          if (feeder1Idx >= currentMatches.length) continue;

          const feeder1Y = safeRowY(r, feeder1Idx) + matchBoxH / 2;
          const feeder2Y = feeder2Idx < currentMatches.length
            ? safeRowY(r, feeder2Idx) + matchBoxH / 2
            : feeder1Y;
          const nextMatchY = safeRowY(r + 1, m) + matchBoxH / 2;

          const feederRightX = colX(r) + matchBoxW;
          const nextLeftX = colX(r + 1);
          const midX = feederRightX + (roundGapX / 2);

          // Determine if the connection is "active" (both feeder matches played)
          const feeder1 = currentMatches[feeder1Idx];
          const feeder2 = feeder2Idx < currentMatches.length ? currentMatches[feeder2Idx] : null;
          const isPlayed = feeder1?.played && (feeder2 ? feeder2.played : true);

          const lineColor = isPlayed ? '#484f58' : '#21262d';

          lines.push(
            <path
              key={`conn-${r}-${m}`}
              d={`
                M ${feederRightX} ${feeder1Y}
                H ${midX}
                V ${feeder2Y}
                M ${feederRightX} ${feeder2Y}
                H ${midX}
                M ${midX} ${(feeder1Y + feeder2Y) / 2}
                H ${nextLeftX}
              `}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        }
      }

      return lines;
    };

    // Render round labels
    const renderRoundLabels = () => {
      return bRounds.map((rd, r) => (
        <g key={`label-${r}`}>
          <text
            x={colX(r) + matchBoxW / 2}
            y={16}
            fill="#8b949e"
            fontSize={9}
            fontWeight={600}
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {rd.name}
          </text>
        </g>
      ));
    };

    return (
      <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
          style={{ minWidth: svgWidth }}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#0d1117" rx={6} />

          {/* Round labels */}
          {renderRoundLabels()}

          {/* Connector lines */}
          {renderConnectors()}

          {/* Match boxes */}
          {bRounds.map((rd, r) =>
            rd.matches.map((match, m) =>
              renderMatchBox(match, colX(r), safeRowY(r, m), r)
            )
          )}

          {/* Trophy at the end if player won */}
          {isCupWinner && (
            <g>
              <rect
                x={colX(numRounds - 1) + matchBoxW + 12}
                y={safeRowY(numRounds - 1, 0) + matchBoxH / 2 - 20}
                width={36}
                height={40}
                rx={6}
                fill="#0d2818"
                stroke="#10b981"
                strokeWidth={1}
              />
              <text
                x={colX(numRounds - 1) + matchBoxW + 30}
                y={safeRowY(numRounds - 1, 0) + matchBoxH / 2 + 5}
                textAnchor="middle"
                fontSize={20}
              >
                🏆
              </text>
            </g>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* ─── Enhanced Cup Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-amber-900/30 overflow-hidden relative">
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-amber-900/30 border border-amber-700/30 flex items-center justify-center">
                  <TrophyIcon size={40} color="#d97706" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-amber-100 flex items-center gap-2">
                    {cupName}
                  </h2>
                  <p className="text-xs text-[#8b949e]">Domestic Cup Competition</p>
                </div>
              </div>

              {/* Status Badge — enhanced with matching colors */}
              {isCupWinner ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <Badge className="bg-amber-500 text-black font-bold px-3 py-1 text-xs border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    WINNER!
                  </Badge>
                </motion.div>
              ) : cupEliminated ? (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-3 py-1 text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  ELIMINATED
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-3 py-1 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* Round Progress Indicator — enhanced dots */}
            {!isCupWinner && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                  <span>Progress</span>
                  <span className="font-medium">
                    {cupEliminated
                      ? `Eliminated in ${getRoundName(eliminatedRoundNum, maxRound)}`
                      : `Round ${Math.min(cupRound, maxRound)} of ${maxRound}`
                    }
                  </span>
                </div>

                {/* Progress dots with enhanced styling */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: maxRound }, (_, i) => {
                    const roundNum = i + 1;
                    const isCompleted = roundNum < cupRound;
                    const isCurrent = roundNum === cupRound && !cupEliminated;

                    return (
                      <div key={roundNum} className="flex items-center gap-1.5 flex-1">
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <motion.div
                            className={`h-2.5 w-2.5 rounded-sm ${
                              isCompleted
                                ? 'bg-amber-400'
                                : isCurrent
                                ? 'bg-amber-400'
                                : 'bg-[#30363d]'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: isCompleted || isCurrent ? 1 : 0.4,
                            }}
                            transition={{ delay: i * 0.05 }}
                          />
                          {isCurrent && (
                            <motion.div
                              className="h-2.5 w-2.5 rounded-sm border border-amber-400/60 absolute"
                              animate={{ opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          {(roundNum === 1 || roundNum === maxRound ||
                            roundNum === maxRound - 1 || roundNum === maxRound - 2 ||
                            isCurrent) && (
                            <span className={`text-[7px] leading-none mt-1 ${
                              isCurrent ? 'text-amber-300 font-semibold' : 'text-[#484f58]'
                            }`}>
                              {roundNum === 1 ? 'R1' :
                               roundNum === maxRound ? 'F' :
                               roundNum === maxRound - 1 ? 'SF' :
                               roundNum === maxRound - 2 ? 'QF' :
                               `R${roundNum}`}
                            </span>
                          )}
                        </div>
                        {roundNum < maxRound && (
                          <div className={`h-0.5 w-full rounded-sm ${
                            isCompleted ? 'bg-amber-400/60' : 'bg-[#30363d]/60'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Winner progress bar */}
            {isCupWinner && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-amber-500/30 rounded-sm">
                  <motion.div
                    className="h-full bg-amber-400 rounded-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                </div>
                <span className="text-[9px] text-amber-300 font-semibold">Complete!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Cup Winner Celebration ─────────────────────────────────── */}
      {isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <Card className="bg-[#161b22] border-amber-500/40 overflow-hidden">
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <MiniTrophyIcon />
              </motion.div>
              <h3 className="text-xl font-black text-amber-300 mb-1 mt-2">Cup Winner!</h3>
              <p className="text-sm text-amber-200/70">
                You won the {cupName}! A historic achievement for {gameState.currentClub.name}!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge className="bg-amber-500/30 text-amber-200 border border-amber-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Trophy Added to Cabinet
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Eliminated Message ─────────────────────────────────────── */}
      {cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-red-950/20 border border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Eliminated in {getRoundName(eliminatedRoundNum, maxRound)}
                  </p>
                  <p className="text-xs text-red-400/70">
                    Your {cupName} run has ended this season
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── SVG Bracket Tree Diagram (NEW) ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                <Swords className="h-3.5 w-3.5 text-amber-500" />
                Tournament Bracket
              </CardTitle>
              <div className="flex items-center gap-2 text-[8px] text-[#484f58]">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-sm bg-emerald-400" />
                  <span>Your Club</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-sm bg-[#8b949e]" />
                  <span>Winner</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {renderBracketTree()}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Opponent Scout Card ────────────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && opponentScout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-sky-400" />
                  Opponent Scout
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Opponent header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xl">
                  {opponentScout.club.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#c9d1d9] truncate">
                    {opponentScout.club.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {opponentScout.leaguePosition && (
                      <span className="text-[10px] text-[#8b949e] flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {opponentScout.leaguePosition}{getOrdinalSuffix(opponentScout.leaguePosition)} in league
                      </span>
                    )}
                    <span className="text-[10px] text-[#484f58]">
                      Quality: {opponentScout.club.quality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {opponentScout.leaguePosition && (
                  <div className="bg-[#21262d] rounded-md p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase tracking-wider">League Pos</p>
                    <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
                      {opponentScout.leaguePosition}
                      <span className="text-[10px] text-[#484f58] font-normal">
                        /{opponentScout.totalTeams}
                      </span>
                    </p>
                  </div>
                )}

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Scored</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {opponentScout.avgGoalsScored}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Conceded</p>
                  <p className="text-base font-bold text-red-400 mt-0.5 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {opponentScout.avgGoalsConceded}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Season Form</p>
                  <div className="flex items-center gap-1 mt-1">
                    {opponentScout.formDots.slice(0, 5).map((dot, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-sm ${getFormDotColor(dot)}`}
                        title={dot === 'W' ? 'Win' : dot === 'D' ? 'Draw' : 'Loss'}
                      />
                    ))}
                    <span className="text-[9px] text-[#484f58] ml-1">est.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Next Cup Match (Enhanced) ──────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <Card className="bg-[#161b22] border-amber-900/20 overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e]">
                  Next Cup Match
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Home className="h-2 w-2 text-amber-500/60" />
                    <span className="text-[8px] text-[#484f58]">HOME</span>
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center mx-2">
                  <motion.div
                    className="text-sm font-black text-amber-400/80"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    VS
                  </motion.div>
                  <div className="w-px h-4 bg-[#30363d] mt-1" />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Plane className="h-2 w-2 text-sky-500/60" />
                    <span className="text-[8px] text-[#484f58]">AWAY</span>
                  </div>
                </div>
              </div>

              {/* Week info with home/away indicator */}
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-[#30363d]">
                <Calendar className="h-3 w-3 text-amber-500/60" />
                <span className="text-[10px] text-[#8b949e]">
                  {playerNextCupMatch.homeClubId === gameState.currentClub.id ? 'Home' : 'Away'} • Week {CUP_MATCH_WEEKS[cupRound - 1] ?? cupRound * 4} • {isCupWeek ? 'This week!' : 'Upcoming'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Enhanced Cup Run Timeline (Road to the Final) ───────────── */}
      {cupRunTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-500" />
                  Road to the Final
                </CardTitle>
                <span className="text-[9px] text-[#484f58]">
                  {cupRunTimeline.length} match{cupRunTimeline.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[#30363d]" />

                <div className="space-y-0">
                  {cupRunTimeline.map((match, idx) => {
                    const isLast = idx === cupRunTimeline.length - 1;
                    const isWinner = match.result === 'W';

                    return (
                      <motion.div
                        key={`${match.round}-${match.opponent}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + idx * 0.06 }}
                        className="relative flex items-start gap-3 py-2.5"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                          {isWinner ? (
                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                          ) : match.result === 'D' ? (
                            <MinusCircle className="h-7 w-7 text-amber-400" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-400" />
                          )}
                        </div>

                        {/* Enhanced match card */}
                        <div className={`flex-1 rounded-lg border p-2.5 min-w-0 ${
                          isWinner
                            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                            : match.result === 'D'
                            ? 'bg-amber-500/[0.06] border-amber-500/20'
                            : 'bg-red-500/[0.06] border-red-500/20'
                        }`}>
                          {/* Round + Result + Key Moment badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#8b949e] font-medium">
                                {match.roundName}
                              </span>
                              {/* Home/Away indicator */}
                              <span className={`text-[8px] px-1 py-0 rounded-sm ${
                                match.isHome
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-sky-500/15 text-sky-400'
                              }`}>
                                {match.isHome ? 'H' : 'A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Key Moment badge */}
                              {match.isKeyMoment && (
                                <span className="text-[7px] bg-emerald-500/20 text-emerald-300 px-1 py-0 rounded-sm font-bold flex items-center gap-0.5 border border-emerald-500/30">
                                  <Zap className="h-2 w-2" />
                                  KEY
                                </span>
                              )}
                              <Badge className={`text-[8px] px-1.5 py-0 h-4 border font-bold ${getResultBg(match.result)}`}>
                                {match.result}
                              </Badge>
                            </div>
                          </div>

                          {/* Opponent + Score */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{match.opponentLogo}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-[#c9d1d9] font-medium truncate">
                                {match.isHome ? 'vs' : '@'} {match.opponent}
                              </p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${getResultColor(match.result)}`}>
                              {match.playerScore} - {match.opponentScore}
                            </span>
                          </div>

                          {/* Form dots for both teams (last 3 results) */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-0.5">
                              <span className="text-[8px] text-[#484f58] mr-1">Form:</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 3 }, (_, fi) => {
                                  // Derive form from recent cup results before this match
                                  const prevResults = cupRunTimeline.slice(
                                    Math.max(0, idx - 3), idx
                                  );
                                  const formResult = prevResults[fi]?.result;
                                  return (
                                    <div
                                      key={fi}
                                      className={`h-1.5 w-1.5 rounded-sm ${
                                        formResult ? getFormDotColor(formResult) : 'bg-[#30363d]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Rating */}
                            {match.playerRating > 0 && (
                              <span className={`text-[9px] font-bold tabular-nums ${
                                match.playerRating >= 8.0
                                  ? 'text-emerald-400'
                                  : match.playerRating >= 7.0
                                  ? 'text-amber-300'
                                  : 'text-[#8b949e]'
                              }`}>
                                {match.playerRating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Player contribution */}
                          {(match.playerGoals > 0 || match.playerAssists > 0) && (
                            <div className="flex items-center gap-2 mt-1.5">
                              {match.playerGoals > 0 && (
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  ⚽ {match.playerGoals}
                                </span>
                              )}
                              {match.playerAssists > 0 && (
                                <span className="text-[9px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  🎯 {match.playerAssists}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Match date */}
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-2 w-2 text-[#484f58]" />
                            <span className="text-[8px] text-[#484f58]">{match.matchDate}</span>
                          </div>

                          {/* Progression indicator */}
                          {isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/60" />
                              <span className="text-[8px] text-emerald-500/60">Advanced</span>
                            </div>
                          )}
                          {!isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1">
                              <XCircle className="h-2.5 w-2.5 text-red-500/40" />
                              <span className="text-[8px] text-red-500/40">
                                {match.result === 'D' ? 'Eliminated (away goals / pens)' : 'Eliminated'}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Bracket Rounds (enhanced with scores & form) ────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Swords className="h-3.5 w-3.5 text-amber-500" />
              Round Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {rounds.map((roundData, idx) => {
                  const isCurrentRound = roundData.round === cupRound;
                  const isPastRound = roundData.round < cupRound;

                  const playerInRound = roundData.fixtures.find(
                    f => f.homeClubId === gameState.currentClub.id ||
                         f.awayClubId === gameState.currentClub.id
                  );

                  return (
                    <motion.div
                      key={roundData.round}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.06, duration: 0.2 }}
                      className={`rounded-lg border p-3 ${
                        isCurrentRound
                          ? 'bg-amber-500/10 border-amber-600/30'
                          : isPastRound
                          ? 'bg-[#21262d] border-[#30363d]'
                          : 'bg-[#21262d]/10 border-[#30363d]'
                      }`}
                    >
                      {/* Round header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">
                            {roundData.name}
                          </span>
                          {isCurrentRound && !cupEliminated && (
                            <motion.span
                              className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-sm font-semibold"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              CURRENT
                            </motion.span>
                          )}
                          {isPastRound && playerInRound && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-sm font-semibold">
                              PLAYED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                          <Users className="h-2.5 w-2.5" />
                          <span>{roundData.fixtures.length * 2} teams</span>
                        </div>
                      </div>

                      {/* Enhanced fixture list */}
                      <div className="space-y-1.5">
                        {roundData.fixtures.map(fixture => {
                          const homeClub = getClubById(fixture.homeClubId);
                          const awayClub = getClubById(fixture.awayClubId);
                          if (!homeClub || !awayClub) return null;

                          const isPlayerMatch =
                            fixture.homeClubId === gameState.currentClub.id ||
                            fixture.awayClubId === gameState.currentClub.id;

                          const scoreKey = `${fixture.homeClubId}-${fixture.awayClubId}`;
                          const scoreData = fixture.played ? cupMatchScoreLookup.get(scoreKey) : null;

                          const reverseKey = `${fixture.awayClubId}-${fixture.homeClubId}`;
                          const reverseScoreData = !scoreData && fixture.played
                            ? cupMatchScoreLookup.get(reverseKey)
                            : null;

                          const finalScore = scoreData || (reverseScoreData ? {
                            homeScore: reverseScoreData.awayScore,
                            awayScore: reverseScoreData.homeScore,
                          } : null);

                          // Check if player had a key moment in this fixture
                          const cupResult = fixture.played
                            ? gameState.recentResults.find(
                                r => r.competition === 'cup' &&
                                     ((r.homeClub.id === fixture.homeClubId && r.awayClub.id === fixture.awayClubId) ||
                                      (r.homeClub.id === fixture.awayClubId && r.awayClub.id === fixture.homeClubId))
                              )
                            : null;
                          const isKeyMoment = cupResult && (cupResult.playerGoals > 0 || cupResult.playerAssists > 0);

                          // Team form dots
                          const homeForm = teamFormLookup.get(fixture.homeClubId)?.slice(0, 3) || [];
                          const awayForm = teamFormLookup.get(fixture.awayClubId)?.slice(0, 3) || [];

                          // Determine winner for highlighting
                          const homeWon = finalScore && finalScore.homeScore > finalScore.awayScore;
                          const awayWon = finalScore && finalScore.awayScore > finalScore.homeScore;

                          return (
                            <div
                              key={fixture.id}
                              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                                isPlayerMatch
                                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                                  : 'bg-[#21262d]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-sm">{homeClub.logo}</span>
                                <span className={`truncate ${
                                  isPlayerMatch && fixture.homeClubId === gameState.currentClub.id
                                    ? 'text-emerald-300 font-semibold'
                                    : homeWon ? 'text-[#c9d1d9] font-medium'
                                    : fixture.played ? 'text-[#8b949e]'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {homeClub.shortName}
                                </span>
                                {/* Home team form dots */}
                                {fixture.played && homeForm.length > 0 && (
                                  <div className="flex items-center gap-px ml-1">
                                    {homeForm.map((dot, fi) => (
                                      <div
                                        key={fi}
                                        className={`h-1.5 w-1.5 rounded-sm ${getFormDotColor(dot)}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Score display */}
                              {fixture.played && finalScore ? (
                                <span className="text-[#c9d1d9] mx-2 text-[10px] font-bold tabular-nums bg-[#0d1117] px-1.5 py-0.5 rounded-sm border border-[#30363d]">
                                  {finalScore.homeScore} - {finalScore.awayScore}
                                </span>
                              ) : fixture.played ? (
                                <Badge className="ml-2 bg-slate-700/50 text-[#8b949e] text-[8px] px-1 py-0 h-4 border-0">
                                  Done
                                </Badge>
                              ) : (
                                <span className="text-[#484f58] mx-2 text-[9px]">vs</span>
                              )}

                              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                {/* Away team form dots */}
                                {fixture.played && awayForm.length > 0 && (
                                  <div className="flex items-center gap-px mr-1">
                                    {awayForm.map((dot, fi) => (
                                      <div
                                        key={fi}
                                        className={`h-1.5 w-1.5 rounded-sm ${getFormDotColor(dot)}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <span className={`truncate text-right ${
                                  isPlayerMatch && fixture.awayClubId === gameState.currentClub.id
                                    ? 'text-emerald-300 font-semibold'
                                    : awayWon ? 'text-[#c9d1d9] font-medium'
                                    : fixture.played ? 'text-[#8b949e]'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {awayClub.shortName}
                                </span>
                                <span className="text-sm">{awayClub.logo}</span>
                              </div>

                              {/* Key moment indicator for player matches */}
                              {isPlayerMatch && isKeyMoment && (
                                <Zap className="h-3 w-3 text-emerald-400 ml-1 flex-shrink-0" />
                              )}
                              {isPlayerMatch && !fixture.played && (
                                <ChevronRight className="h-3 w-3 text-emerald-400 ml-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Enhanced Cup Statistics ──────────────────────────────────── */}
      {cupStatistics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="space-y-4"
        >
          {/* Main stats grid */}
          <Card className="bg-[#161b22]/50 border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-amber-500" />
                Cup Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-400 tabular-nums">
                    {cupStatistics.cupGoals}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Goals</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-sky-400 tabular-nums">
                    {cupStatistics.cupAppearances}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Appearances</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400 tabular-nums">
                    {cupStatistics.winRate}%
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Win Rate</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-400 tabular-nums">
                    {cupStatistics.cupAssists}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Assists</p>
                </div>
              </div>

              {/* Best run + Best Rating */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#8b949e]">Best Run</p>
                    <p className="text-sm font-bold text-amber-300">{cupStatistics.bestRun}</p>
                  </div>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#8b949e]">Best Rating</p>
                    <p className="text-sm font-bold text-emerald-300">{cupStatistics.bestRating.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Top Performers section */}
              {cupStatistics.cupAppearances > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Top Performers</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Target className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-[8px] text-[#484f58]">Goals</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">{cupStatistics.cupGoals}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <TrendingUp className="h-2.5 w-2.5 text-sky-400" />
                        <span className="text-[8px] text-[#484f58]">Assists</span>
                      </div>
                      <p className="text-sm font-bold text-sky-400 tabular-nums">{cupStatistics.cupAssists}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Star className="h-2.5 w-2.5 text-amber-400" />
                        <span className="text-[8px] text-[#484f58]">MOTM</span>
                      </div>
                      <p className="text-sm font-bold text-amber-400 tabular-nums">{cupStatistics.motmAwards}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Win/Draw/Loss breakdown */}
              {cupStatistics.cupAppearances > 0 && (
                <div className="flex items-center justify-center gap-4 mb-3 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      W {cupStatistics.wins}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-amber-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      D {cupStatistics.draws}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-red-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      L {cupStatistics.losses}
                    </span>
                  </div>
                </div>
              )}

              {/* Historical Cup Performance */}
              {historicalPerformance && (
                <div className="pt-3 border-t border-[#30363d]">
                  <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Historical Performance</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {historicalPerformance.cupTrophies.length}
                      </p>
                      <p className="text-[9px] text-[#8b949e]">Career Cup Trophies</p>
                    </div>
                    <div className="w-px h-8 bg-[#30363d]" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-400">
                        {gameState.player.careerStats?.trophies?.length ?? 0}
                      </p>
                      <p className="text-[9px] text-[#8b949e]">Total Trophies</p>
                    </div>
                  </div>
                  {/* Trophy list */}
                  {historicalPerformance.cupTrophies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {historicalPerformance.cupTrophies.map((trophy, i) => (
                        <Badge
                          key={i}
                          className="bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[8px] px-1.5 py-0"
                        >
                          🏆 {trophy.name} (S{trophy.season})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cup info footnote */}
              <div className="mt-3 pt-2 border-t border-[#30363d]">
                <p className="text-[10px] text-[#484f58] text-center">
                  Cup matches occur every 4 weeks (Weeks {CUP_MATCH_WEEKS.slice(0, 4).join(', ')}...)
                  • Single elimination knockout format
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Utility: ordinal suffix ────────────────────────────────────────────
function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
