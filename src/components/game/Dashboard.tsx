'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getOverallColor, getFormLabel, getMoraleLabel, formatCurrency, getSeasonWeekDescription, getMatchRatingLabel, getPositionColor, getPositionCategory } from '@/lib/game/gameUtils';
import { NATIONALITIES } from '@/lib/game/playerData';
import { getClubById, LEAGUES, getLeagueById, getSeasonMatchdays, CUP_NAMES, CUP_MATCH_WEEKS } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, TrendingUp, TrendingDown, Zap, Heart, Activity, Trophy,
  ArrowRight, ArrowRightLeft, Bell, Star, Swords, Table, ChevronRight, Flame,
  ArrowUp, ArrowDown, Minus, Target, Goal, CircleDot, FileText, UserCircle,
  Dumbbell, BarChart3, Shield, MapPin, Clock, Users, Sparkles,
  GraduationCap, ArrowUpCircle, Crosshair, History, Wallet, Handshake, Mic,
  CheckCircle, Flag, ListChecks, Briefcase, Eye, ClipboardCheck, Medal, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklySummary from '@/components/game/WeeklySummary';
import SeasonEndSummary from '@/components/game/SeasonEndSummary';
import ContractNegotiation from '@/components/game/ContractNegotiation';
import SeasonTrainingFocusModal from '@/components/game/SeasonTrainingFocusModal';
import SeasonPreview from '@/components/game/SeasonPreview';
import { PlayerAttributes, Achievement, SquadStatus, SeasonPlayerStats, LeagueStanding, MatchResult, PlayerTeamLevel, SeasonTrainingFocusArea } from '@/lib/game/types';

// Track season previews already shown (persists across Dashboard remounts)
const shownSeasonPreviews = new Set<number>();

// Season end data type for the modal
interface SeasonEndData {
  seasonNumber: number;
  leaguePosition: number;
  totalTeams: number;
  playerStats: SeasonPlayerStats;
  achievements: Achievement[];
  previousOverall: number;
  currentOverall: number;
  previousMarketValue: number;
  currentMarketValue: number;
  attributeChanges: Partial<PlayerAttributes>;
  contractYearsRemaining: number;
  squadStatus: SquadStatus;
  finalLeagueTable: LeagueStanding[];
}

// Helper: get rating color
function getRatingColor(rating: number): string {
  if (rating >= 7.5) return '#22c55e';
  if (rating >= 6.0) return '#f59e0b';
  return '#ef4444';
}

function getRatingBgClass(rating: number): string {
  if (rating >= 7.5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (rating >= 6.0) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

// Helper: status label for form/morale/fitness
function getStatusLabel(value: number, type: 'form' | 'morale' | 'fitness'): string {
  if (type === 'form') {
    if (value >= 8) return 'Excellent';
    if (value >= 6) return 'Good';
    if (value >= 4) return 'Poor';
    return 'Critical';
  }
  // morale & fitness (0-100)
  if (value >= 80) return 'Excellent';
  if (value >= 60) return 'Good';
  if (value >= 35) return 'Poor';
  return 'Critical';
}

function getStatusColor(value: number, type: 'form' | 'morale' | 'fitness'): string {
  if (type === 'form') {
    if (value >= 8) return 'emerald';
    if (value >= 6) return 'amber';
    if (value >= 4) return 'orange';
    return 'red';
  }
  if (value >= 80) return 'emerald';
  if (value >= 60) return 'amber';
  if (value >= 35) return 'orange';
  return 'red';
}

// Helper: quality badge label
function getQualityLabel(quality: number): string {
  if (quality >= 85) return 'Elite';
  if (quality >= 70) return 'Strong';
  if (quality >= 55) return 'Average';
  return 'Weak';
}

function getQualityColor(quality: number): string {
  if (quality >= 85) return 'text-purple-400';
  if (quality >= 70) return 'text-emerald-400';
  if (quality >= 55) return 'text-amber-400';
  return 'text-[#8b949e]';
}

export default function Dashboard() {
  const gameState = useGameStore(state => state.gameState);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const setScreen = useGameStore(state => state.setScreen);
  const notifications = useGameStore(state => state.notifications);

  const [showSummary, setShowSummary] = useState(false);
  const [showSeasonEnd, setShowSeasonEnd] = useState(false);
  const [seasonEndData, setSeasonEndData] = useState<SeasonEndData | null>(null);
  const [showContractNegotiation, setShowContractNegotiation] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showSeasonPreview, setShowSeasonPreview] = useState(false);

  // Ref to track if season preview has been shown this session
  const seasonPreviewRef = useRef(false); // kept for training focus logic

  // Refs to track previous values for season-end detection
  const prevSeasonsLengthRef = useRef(0);
  const prevOverallRef = useRef(0);
  const prevMarketValueRef = useRef(0);
  const prevAttributesRef = useRef<PlayerAttributes | null>(null);
  const prevLeagueTableRef = useRef<LeagueStanding[]>([]);

  // Track previous form/morale/fitness for trend arrows (use state to satisfy React Compiler)
  const [prevForm, setPrevForm] = useState(gameState?.player.form ?? 6);
  const [prevMorale, setPrevMorale] = useState(gameState?.player.morale ?? 70);
  const [prevFitness, setPrevFitness] = useState(gameState?.player.fitness ?? 85);

  const handleAdvanceWeek = () => {
    if (gameState) {
      setPrevForm(gameState.player.form);
      setPrevMorale(gameState.player.morale);
      setPrevFitness(gameState.player.fitness);
    }
    advanceWeek();
    setShowSummary(true);
  };

  // Detect season transitions and show Season End Summary
  useEffect(() => {
    if (!gameState) return;

    const currentSeasonsLength = gameState.seasons.length;

    if (currentSeasonsLength > prevSeasonsLengthRef.current && prevSeasonsLengthRef.current > 0) {
      const lastSeason = gameState.seasons[gameState.seasons.length - 1];
      const prevAttrs = prevAttributesRef.current;
      const attrChanges: Partial<PlayerAttributes> = {};

      if (prevAttrs) {
        for (const key of Object.keys(gameState.player.attributes) as (keyof PlayerAttributes)[]) {
          const diff = (gameState.player.attributes[key] ?? 0) - (prevAttrs[key] ?? 0);
          if (Math.abs(diff) > 0.3) {
            attrChanges[key] = Math.round(diff * 10) / 10;
          }
        }
      }

      const seasonAchievements = gameState.achievements.filter(
        (a) => a.unlocked && a.unlockedSeason === lastSeason.number
      );

      setSeasonEndData({
        seasonNumber: lastSeason.number,
        leaguePosition: lastSeason.leaguePosition,
        totalTeams: prevLeagueTableRef.current.length || gameState.leagueTable.length,
        playerStats: lastSeason.playerStats,
        achievements: seasonAchievements,
        previousOverall: prevOverallRef.current,
        currentOverall: gameState.player.overall,
        previousMarketValue: prevMarketValueRef.current,
        currentMarketValue: gameState.player.marketValue,
        attributeChanges: attrChanges,
        contractYearsRemaining: gameState.player.contract.yearsRemaining,
        squadStatus: gameState.player.squadStatus,
        finalLeagueTable: prevLeagueTableRef.current.length > 0
          ? prevLeagueTableRef.current
          : gameState.leagueTable,
      });
      setShowSeasonEnd(true);
      setShowSummary(false);
    }

    prevSeasonsLengthRef.current = currentSeasonsLength;
    prevOverallRef.current = gameState.player.overall;
    prevMarketValueRef.current = gameState.player.marketValue;
    prevAttributesRef.current = { ...gameState.player.attributes };
    prevLeagueTableRef.current = [...gameState.leagueTable];
  }, [gameState]);

  // ===== COMPUTED VALUES (before early return) =====

  // Recent ratings for form trend graph (last 10, reversed to chronological)
  const formTrendData = useMemo(() => {
    if (!gameState?.recentResults) return [];
    return gameState.recentResults
      .slice(0, 10)
      .map(r => r.playerRating)
      .reverse();
  }, [gameState?.recentResults]);

  // Streak calculations
  const streakInfo = useMemo(() => {
    if (!gameState?.recentResults || gameState.recentResults.length === 0) return null;

    const results = gameState.recentResults;
    const clubId = gameState.currentClub.id;

    let scoringStreak = 0;
    for (const r of results) {
      if (r.playerGoals > 0) scoringStreak++;
      else break;
    }

    let goalDrought = 0;
    for (const r of results) {
      if (r.playerGoals === 0 && r.playerMinutesPlayed > 0) goalDrought++;
      else break;
    }

    let assistStreak = 0;
    for (const r of results) {
      if (r.playerAssists > 0) assistStreak++;
      else break;
    }

    let winStreak = 0;
    for (const r of results) {
      const won = (r.homeClub.id === clubId && r.homeScore > r.awayScore) ||
                  (r.awayClub.id === clubId && r.awayScore > r.homeScore);
      if (won) winStreak++;
      else break;
    }

    let lossStreak = 0;
    for (const r of results) {
      const lost = (r.homeClub.id === clubId && r.homeScore < r.awayScore) ||
                   (r.awayClub.id === clubId && r.awayScore < r.homeScore);
      if (lost) lossStreak++;
      else break;
    }

    let highRatingStreak = 0;
    for (const r of results) {
      if (r.playerRating >= 7.0) highRatingStreak++;
      else break;
    }

    const streaks: { type: string; count: number; emoji: string; label: string; color: string }[] = [];

    if (scoringStreak >= 2) streaks.push({ type: 'scoring', count: scoringStreak, emoji: '⚽', label: `${scoringStreak}-game scoring streak!`, color: 'emerald' });
    if (assistStreak >= 2) streaks.push({ type: 'assist', count: assistStreak, emoji: '🎯', label: `${assistStreak}-game assist streak!`, color: 'blue' });
    if (winStreak >= 2) streaks.push({ type: 'win', count: winStreak, emoji: '🔥', label: `${winStreak}-game win streak!`, color: 'emerald' });
    if (highRatingStreak >= 2) streaks.push({ type: 'rating', count: highRatingStreak, emoji: '⭐', label: `${highRatingStreak} games rated 7.0+!`, color: 'amber' });
    if (goalDrought >= 2) streaks.push({ type: 'drought', count: goalDrought, emoji: '⚠️', label: `${goalDrought} games without a goal`, color: 'red' });
    if (lossStreak >= 2) streaks.push({ type: 'loss', count: lossStreak, emoji: '📉', label: `${lossStreak}-game losing streak`, color: 'red' });

    streaks.sort((a, b) => {
      const aWeight = (a.type === 'drought' || a.type === 'loss') ? a.count * 1.5 : a.count;
      const bWeight = (b.type === 'drought' || b.type === 'loss') ? b.count * 1.5 : b.count;
      return bWeight - aWeight;
    });

    return streaks.length > 0 ? streaks[0] : null;
  }, [gameState]);

  // Quick stats comparison with previous season
  const statsComparison = useMemo(() => {
    if (!gameState || gameState.seasons.length === 0) return null;

    const prevSeason = gameState.seasons[gameState.seasons.length - 1];
    const curr = gameState.player.seasonStats;
    const prev = prevSeason.playerStats;

    if (curr.appearances < 3) return null;

    const comparisons: { label: string; current: number; previous: number; format: 'number' | 'decimal' }[] = [
      { label: 'Goals', current: curr.goals, previous: prev.goals, format: 'number' },
      { label: 'Assists', current: curr.assists, previous: prev.assists, format: 'number' },
      { label: 'Avg Rating', current: curr.averageRating, previous: prev.averageRating, format: 'decimal' },
      { label: 'Apps', current: curr.appearances, previous: prev.appearances, format: 'number' },
    ];

    return comparisons;
  }, [gameState]);

  // Win probability calculation for next fixture
  const winProbability = useMemo(() => {
    if (!gameState || !gameState.upcomingFixtures) return null;
    const nextFixture = gameState.upcomingFixtures.find(
      f => !f.played && (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id)
    );
    if (!nextFixture) return null;

    const isHome = nextFixture.homeClubId === gameState.currentClub.id;
    const opponentId = isHome ? nextFixture.awayClubId : nextFixture.homeClubId;
    const opponent = getClubById(opponentId);
    if (!opponent) return null;

    const clubQuality = gameState.currentClub.quality;
    const oppQuality = opponent.quality;
    const homeBonus = isHome ? 5 : -5;
    const formBonus = (gameState.player.form - 5) * 1.5;

    let prob = 35 + ((clubQuality - oppQuality) * 0.5) + homeBonus + formBonus;
    prob = Math.max(10, Math.min(85, Math.round(prob)));

    return { win: prob, draw: Math.round(Math.max(10, 25 - Math.abs(clubQuality - oppQuality) * 0.2)), opponent };
  }, [gameState]);

// Track training focus already shown (persists across Dashboard remounts)
const shownTrainingFocusSeasons = new Set<number>();

  // Auto-show training focus modal effect (only once per season start, persists across remounts)
  useEffect(() => {
    if (!gameState) return;
    if (!gameState.seasonTrainingFocus && gameState.currentWeek <= 2) {
      if (!shownTrainingFocusSeasons.has(gameState.currentSeason)) {
        shownTrainingFocusSeasons.add(gameState.currentSeason);
        setShowFocusModal(true);
      }
    }
  }, [gameState?.currentSeason, gameState?.seasonTrainingFocus, gameState?.currentWeek]);

  // Auto-show season preview when week === 1 (only once per season, persists across remounts)
  useEffect(() => {
    if (!gameState) return;
    const seasonKey = gameState.currentSeason;
    if (gameState.currentWeek === 1 && !shownSeasonPreviews.has(seasonKey)) {
      shownSeasonPreviews.add(seasonKey);
      setTimeout(() => setShowSeasonPreview(true), 300);
    }
    if (gameState.currentWeek > 1) {
      // Allow preview to show again for a new season if we haven't seen it yet
      if (!shownSeasonPreviews.has(seasonKey)) {
        shownSeasonPreviews.add(seasonKey);
      }
    }
  }, [gameState?.currentWeek, gameState?.currentSeason, gameState]);

  // ===== COMPUTED VALUES (before early return) =====
  const recentResultsSafe = gameState?.recentResults ?? [];
  const leagueTableSafe = gameState?.leagueTable ?? [];
  const leaguePosSafe = (gameState as any)?.leaguePos ?? (gameState?.leagueTable?.findIndex((e: any) => e.clubId === gameState?.currentClub?.id) ?? 0) + 1;
  const currentClubIdSafe = gameState?.currentClub?.id ?? '';

  // Sparkline data (last 5 matches reversed to chronological)
  const sparklineData = useMemo(() => {
    const last5 = recentResultsSafe.slice(0, 5).reverse();
    return {
      goals: last5.map((r: any) => r.playerGoals ?? 0),
      assists: last5.map((r: any) => r.playerAssists ?? 0),
      ratings: last5.map((r: any) => r.playerRating ?? 6.0),
    };
  }, [recentResultsSafe]);

  // Form dots (last 5 results) for next match card
  const formDots = recentResultsSafe.slice(0, 5).map((r: any) => {
    if (!gameState?.currentClub?.id) return 'D';
    const won = (r.homeClub?.id === gameState.currentClub.id && r.homeScore > r.awayScore) ||
                (r.awayClub?.id === gameState.currentClub.id && r.awayScore > r.homeScore);
    const drew = r.homeScore === r.awayScore;
    return won ? 'W' : drew ? 'D' : 'L';
  });

  // Club standing mini-table (5 rows centered on player's club)
  const standingsMini = useMemo(() => {
    if (leagueTableSafe.length === 0) return [];
    const pos = Math.max(0, leaguePosSafe - 1);
    const start = Math.max(0, Math.min(pos - 2, leagueTableSafe.length - 5));
    const end = Math.min(leagueTableSafe.length, start + 5);
    return leagueTableSafe.slice(start, end).map((entry: any, i: number) => ({
      ...entry,
      position: start + i + 1,
      gd: (entry.goalsFor ?? 0) - (entry.goalsAgainst ?? 0),
      isPlayer: entry.clubId === currentClubIdSafe,
    }));
  }, [leagueTableSafe, leaguePosSafe, currentClubIdSafe]);

  // ===== NEW SECTION COMPUTED VALUES (before early return) =====

  // Dynamic greeting based on game week (deterministic)
  const dynamicGreeting = useMemo(() => {
    if (!gameState) return { greeting: 'Welcome Back', period: '' };
    const weekInDay = ((gameState.currentWeek * 7) % 24);
    let greeting: string;
    let period: string;
    if (weekInDay < 6) { greeting = 'Good Morning'; period = 'dawn'; }
    else if (weekInDay < 12) { greeting = 'Good Afternoon'; period = 'midday'; }
    else if (weekInDay < 18) { greeting = 'Good Evening'; period = 'dusk'; }
    else { greeting = 'Good Night'; period = 'night'; }
    return { greeting, period };
  }, [gameState?.currentWeek]);

  // OVR trend from seasons
  const ovrTrend = useMemo(() => {
    if (!gameState || gameState.seasons.length === 0) return 'stable' as const;
    const prevSeason = gameState.seasons[gameState.seasons.length - 1];
    // Estimate previous OVR from stats
    const prevOvrEstimate = gameState.player.overall - Math.round(
      (gameState.player.seasonStats.averageRating - 6.5) * 0.5
    );
    if (gameState.player.overall > prevOvrEstimate) return 'up' as const;
    if (gameState.player.overall < prevOvrEstimate) return 'down' as const;
    return 'stable' as const;
  }, [gameState]);

  // Recent activity feed entries (deterministic from game state)
  const activityFeed = useMemo(() => {
    if (!gameState) return [];
    const feed: { id: string; type: 'match' | 'training' | 'achievement' | 'transfer' | 'contract' | 'media'; color: string; icon: string; title: string; subtitle: string; week: number }[] = [];

    // Match results
    const recentMatches = gameState.recentResults.slice(0, 4);
    for (const r of recentMatches) {
      const opponent = r.homeClub.id === gameState.currentClub.id ? r.awayClub : r.homeClub;
      const playerScore = r.homeClub.id === gameState.currentClub.id ? r.homeScore : r.awayScore;
      const oppScore = r.homeClub.id === gameState.currentClub.id ? r.awayScore : r.homeScore;
      const won = playerScore > oppScore;
      const drew = playerScore === oppScore;
      feed.push({
        id: `match-${r.week}-${r.season}`,
        type: 'match',
        color: won ? '#34d399' : drew ? '#f59e0b' : '#ef4444',
        icon: won ? 'W' : drew ? 'D' : 'L',
        title: `${playerScore}-${oppScore} vs ${opponent.shortName}`,
        subtitle: r.playerGoals > 0 ? `${r.playerGoals}G${r.playerAssists > 0 ? ` ${r.playerAssists}A` : ''} | ${r.playerRating.toFixed(1)}` : `Rating ${r.playerRating.toFixed(1)}`,
        week: r.week,
      });
    }

    // Recent achievements
    const recentAchievements = gameState.achievements
      .filter(a => a.unlocked && a.unlockedSeason === gameState.currentSeason)
      .slice(-2);
    for (const a of recentAchievements) {
      feed.push({
        id: `achievement-${a.id}`,
        type: 'achievement',
        color: '#a78bfa',
        icon: '★',
        title: a.name,
        subtitle: a.description,
        week: gameState.currentWeek,
      });
    }

    // Training history
    const recentTraining = gameState.trainingHistory.slice(-2);
    for (const t of recentTraining) {
      feed.push({
        id: `training-${t.type}-${t.completedAt}`,
        type: 'training',
        color: '#34d399',
        icon: '💪',
        title: `Training: ${t.type}`,
        subtitle: `${t.focusAttribute ?? 'Fitness'} improved`,
        week: gameState.currentWeek,
      });
    }

    // Transfer offers
    if (gameState.transferOffers.length > 0) {
      const offer = gameState.transferOffers[0];
      feed.push({
        id: `transfer-${offer.id}`,
        type: 'transfer',
        color: '#3b82f6',
        icon: '🔄',
        title: `Transfer Interest: ${offer.fromClub.shortName}`,
        subtitle: `${formatCurrency(offer.fee, 'M')} fee`,
        week: gameState.currentWeek,
      });
    }

    return feed.slice(0, 8);
  }, [gameState]);

  // Weekly goals (from seasonObjectives or generated)
  const weeklyGoals = useMemo(() => {
    if (!gameState) return [];
    // Try to use actual season objectives
    const currentObjectives = gameState.seasonObjectives?.find(
      o => o.season === gameState.currentSeason
    );
    if (currentObjectives?.objectives && currentObjectives.objectives.length > 0) {
      return currentObjectives.objectives.slice(0, 4).map(obj => ({
        id: obj.id,
        label: obj.title,
        icon: obj.icon ?? '🎯',
        current: obj.current,
        target: obj.target,
        reward: obj.reward,
        completed: obj.status === 'completed',
      }));
    }
    // Fallback: generate deterministic weekly goals
    const seasonGoals = gameState.player.seasonStats.goals;
    const seasonAssists = gameState.player.seasonStats.assists;
    const avgRating = gameState.player.seasonStats.averageRating;
    const weeklyGoalsList: { id: string; label: string; icon: string; current: number; target: number; reward: number; completed: boolean }[] = [
      {
        id: 'score-next-match',
        label: 'Score in next match',
        icon: '⚽',
        current: recentResultsSafe.length > 0 && recentResultsSafe[0].playerGoals > 0 ? 1 : 0,
        target: 1,
        reward: 50,
        completed: recentResultsSafe.length > 0 && recentResultsSafe[0].playerGoals > 0,
      },
      {
        id: 'complete-training',
        label: 'Complete 2 training sessions',
        icon: '🏋️',
        current: Math.min(2, 3 - gameState.trainingAvailable),
        target: 2,
        reward: 30,
        completed: gameState.trainingAvailable <= 1,
      },
      {
        id: 'maintain-rating',
        label: 'Maintain rating above 7.0',
        icon: '⭐',
        current: Math.min(10, Math.round(avgRating * 10) / 10),
        target: 7.0,
        reward: 75,
        completed: avgRating >= 7.0,
      },
      {
        id: 'team-meeting',
        label: 'Attend team meeting',
        icon: '🤝',
        current: gameState.currentWeek % 4 === 0 ? 1 : 0,
        target: 1,
        reward: 20,
        completed: gameState.currentWeek % 4 === 0,
      },
    ];
    return weeklyGoalsList;
  }, [gameState, recentResultsSafe]);

  // Weekly goals progress percentage
  const weeklyGoalsProgress = useMemo(() => {
    if (weeklyGoals.length === 0) return 0;
    const completedCount = weeklyGoals.filter(g => g.completed).length;
    return Math.round((completedCount / weeklyGoals.length) * 100);
  }, [weeklyGoals]);

  // Upcoming fixtures for the strip (next 5)
  const upcomingFixturesStrip = useMemo(() => {
    if (!gameState) return [];
    return gameState.upcomingFixtures
      .filter(f => !f.played && (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id))
      .slice(0, 5)
      .map(f => {
        const isHomeGame = f.homeClubId === gameState.currentClub.id;
        const oppId = isHomeGame ? f.awayClubId : f.homeClubId;
        const opp = getClubById(oppId);
        return {
          ...f,
          isHome: isHomeGame,
          opponent: opp,
          difficulty: opp ? (opp.quality >= 75 ? 'hard' : opp.quality >= 50 ? 'medium' : 'easy') : 'medium',
        };
      });
  }, [gameState]);

  // Financial snapshot data
  const financialSnapshot = useMemo(() => {
    if (!gameState) return null;
    const weeklyWage = gameState.player.contract.weeklyWage;
    const contractYears = gameState.player.contract.yearsRemaining;
    const totalContractValue = weeklyWage * 52 * contractYears;
    const totalCareerEarnings = weeklyWage * 52 * (gameState.currentSeason + (gameState.currentWeek / 38));
    const sponsorshipCount = gameState.achievements.filter(a => a.unlocked && a.category === 'career').length;
    const bonusEarnings = sponsorshipCount * 5000;
    return {
      weeklyWage,
      totalCareerEarnings: Math.round(totalCareerEarnings),
      sponsorshipCount,
      contractValueRemaining: Math.round(totalContractValue),
      bonusEarnings,
    };
  }, [gameState]);

  if (!gameState) return null;

  const { player, currentClub, currentWeek, currentSeason, recentResults = [], upcomingFixtures = [], activeEvents = [], leagueTable = [], trainingAvailable = 0, seasons = [], currentInjury } = gameState;
  const playerTeamLevel = gameState.playerTeamLevel;
  const seasonTrainingFocus = gameState.seasonTrainingFocus;
  const nationInfo = NATIONALITIES.find(n => n.name === player.nationality);
  const overallColor = getOverallColor(player.overall);
  const posColor = getPositionColor(player.position);

  // Find next fixture
  const nextFixture = upcomingFixtures.find(f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id));
  const nextOpponent = nextFixture ? getClubById(nextFixture.homeClubId === currentClub.id ? nextFixture.awayClubId : nextFixture.homeClubId) : null;
  const isHome = nextFixture?.homeClubId === currentClub.id;

  // League position
  const leaguePos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
  const leagueInfo = getLeagueById(currentClub.league);

  // Unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingEvents = activeEvents.length;

  // Season progress
  const seasonMatchdays = getSeasonMatchdays(currentClub.league);
  const seasonProgress = Math.min(100, Math.round((currentWeek / seasonMatchdays) * 100));
  const posSuffix = leaguePos === 1 ? 'st' : leaguePos === 2 ? 'nd' : leaguePos === 3 ? 'rd' : 'th';

  // Trend indicators
  const formTrend = player.form > prevForm ? 'up' : player.form < prevForm ? 'down' : 'stable';
  const moraleTrend = player.morale > prevMorale ? 'up' : player.morale < prevMorale ? 'down' : 'stable';
  const fitnessTrend = player.fitness > prevFitness ? 'up' : player.fitness < prevFitness ? 'down' : 'stable';

  // Helper: determine match result for player
  const getPlayerMatchResult = (result: MatchResult) => {
    const won = (result.homeClub.id === currentClub.id && result.homeScore > result.awayScore) ||
                (result.awayClub.id === currentClub.id && result.awayScore > result.homeScore);
    const drew = result.homeScore === result.awayScore;
    return won ? 'W' : drew ? 'D' : 'L';
  };

  // Previous season league position for comparison
  const prevLeaguePosition = seasons.length > 0 ? seasons[seasons.length - 1].leaguePosition : null;

  return (
    <>
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header with notification bell */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setScreen('settings')}
          className="relative p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <Bell className="h-5 w-5 text-[#8b949e]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Compact Season Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] text-[#484f58] uppercase tracking-widest font-semibold">Season {currentSeason} Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-[#c9d1d9]">{currentWeek}</span>
            <span className="text-[9px] text-[#8b949e]">/ {seasonMatchdays}</span>
          </div>
        </div>
        <div className="relative">
          <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
            <motion.div
              className="h-full rounded-lg bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${seasonProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {/* Phase marker lines */}
          <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
            <div className="absolute top-2 left-[25%] w-px h-2 bg-[#484f58]/30" />
            <div className="absolute top-2 left-[50%] w-px h-2 bg-[#484f58]/30" />
            <div className="absolute top-2 left-[75%] w-px h-2 bg-[#484f58]/30" />
          </div>
          <div className="flex justify-between mt-1.5">
            {['Start', 'Mid-season', 'Final stretch', 'End'].map((label) => (
              <span key={label} className="text-[6px] text-[#484f58] uppercase tracking-wider">{label}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Section Header: Player */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Player</span>
        <div className="flex-1 border-t border-[#21262d]" />
      </div>

      {/* Player Profile Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden border-l-[3px] border-l-emerald-500">

        <CardContent className="p-4 relative">
          <div className="flex items-center gap-4">
            {/* Overall Rating with animated glow */}
            <div className="flex flex-col items-center relative">
              {/* Animated glow effect behind OVR */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{
                  boxShadow: player.overall >= 70
                    ? '0 0 20px 4px rgba(34,197,94,0.35), 0 0 40px 8px rgba(34,197,94,0.15)'
                    : player.overall >= 50
                    ? '0 0 20px 4px rgba(245,158,11,0.35), 0 0 40px 8px rgba(245,158,11,0.15)'
                    : '0 0 20px 4px rgba(239,68,68,0.35), 0 0 40px 8px rgba(239,68,68,0.15)',
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="w-[68px] h-[68px] rounded-3xl flex items-center justify-center font-black text-4xl border-2 relative z-10" style={{ borderColor: overallColor, color: overallColor }}>
                {player.overall}
              </div>
              <span className="text-[10px] text-[#8b949e] mt-1.5 font-semibold uppercase tracking-wider">OVR</span>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg truncate">{player.name}</h2>
                {/* Youth Team Badge */}
                {playerTeamLevel === 'u18' && (
                  <Badge className="text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 px-1.5 py-0 h-5 shrink-0">
                    <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                    U18
                  </Badge>
                )}
                {playerTeamLevel === 'u21' && (
                  <Badge className="text-[9px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0 h-5 shrink-0">
                    <GraduationCap className="h-2.5 w-2.5 mr-0.5" />
                    U21
                  </Badge>
                )}
              </div>
              {/* Form indicator bar under name */}
              <div className="mt-1.5 h-[3px] w-24 rounded-full overflow-hidden bg-[#21262d]">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.form / 10) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    background: player.form >= 7 ? '#22c55e' : player.form >= 5 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8b949e] mt-1.5">
                <span>{nationInfo?.flag}</span>
                <Badge className="text-xs font-bold gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {/* Field position indicator icon */}
                  <PositionIcon position={player.position} size={10} />
                  {player.position}
                </Badge>
                <span className="text-xs">Age {player.age}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base">{currentClub.logo}</span>
                <span className="text-sm text-[#c9d1d9]">{currentClub.name}</span>
                <Badge variant="outline" className="text-[10px] border-[#30363d] capitalize">{player.squadStatus.replace('_', ' ')}</Badge>
              </div>
              {/* Season Training Focus Indicator */}
              {seasonTrainingFocus ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs">🎯</span>
                  <span className="text-xs font-medium text-emerald-400 capitalize">{seasonTrainingFocus.area} Focus</span>
                  <span className="text-[10px] text-[#8b949e]">({seasonTrainingFocus.bonusMultiplier}x)</span>
                </div>
              ) : currentWeek <= 2 ? (
                <button
                  onClick={() => setShowFocusModal(true)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Crosshair className="h-3 w-3" />
                  Set Training Focus
                </button>
              ) : null}
            </div>

            {/* Potential */}
            <div className="flex flex-col items-center">
              <div className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center font-bold text-lg border-2 text-[#c9d1d9]" style={{ borderColor: overallColor + '40' }}>
                {player.potential}
              </div>
              <span className="text-[10px] text-[#8b949e] mt-1.5 font-semibold uppercase tracking-wider">POT</span>
            </div>
          </div>

          {/* Enhanced Player Status Indicators */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#21262d]">
            <EnhancedStatBar
              icon={<Activity className="h-3 w-3" />}
              label="Form"
              value={player.form}
              max={10}
              type="form"
              trend={formTrend}
            />
            <EnhancedStatBar
              icon={<Heart className="h-3 w-3" />}
              label="Morale"
              value={player.morale}
              max={100}
              type="morale"
              trend={moraleTrend}
            />
            <EnhancedStatBar
              icon={<Zap className="h-3 w-3" />}
              label="Fitness"
              value={player.fitness}
              max={100}
              type="fitness"
              trend={fitnessTrend}
            />

            {/* Active Injury Indicator */}
            {currentInjury && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="mt-2 flex items-center gap-2 p-2 rounded-md bg-red-500/8 border border-red-500/20 cursor-pointer"
                onClick={() => useGameStore.getState().setScreen('injury_report')}
              >
                <Activity className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-red-300">{currentInjury.name}</span>
                  <span className="text-[10px] text-red-400/60 ml-1">• {currentInjury.weeksRemaining}wk left</span>
                </div>
                <span className="text-[10px] text-[#484f58]">View →</span>
              </motion.div>
            )}
          </div>

          {/* Player Form Trend Graph */}
          {formTrendData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#8b949e] font-medium">Match Rating Trend</span>
                {formTrendData.length > 0 && (
                  <span className="text-[10px] text-[#8b949e]">
                    Last {formTrendData.length} games
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 h-12">
                {formTrendData.map((rating, i) => {
                  const barHeight = Math.max(15, ((rating - 3) / 7) * 100);
                  const color = getRatingColor(rating);
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 relative group cursor-default"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${barHeight}%`, opacity: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                    >
                      <div
                        className="w-full rounded-sm transition-all hover:opacity-100 opacity-80"
                        style={{
                          height: '100%',
                          backgroundColor: color,
                          minHeight: '4px',
                        }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#21262d] text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                        style={{ color }}
                      >
                        {rating.toFixed(1)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-[#484f58]">Oldest</span>
                <span className="text-[8px] text-[#484f58]">Recent</span>
              </div>
            </div>
          )}

          {/* Streak Indicator */}
          {streakInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.15 }}
              className={`mt-3 px-3 py-2 rounded-lg flex items-center gap-2 border ${
                streakInfo.color === 'emerald' ? 'bg-emerald-500/8 border-emerald-500/20' :
                streakInfo.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                streakInfo.color === 'amber' ? 'bg-amber-500/8 border-amber-500/15' :
                'bg-red-500/10 border-red-500/20'
              }`}
            >
              <span className="text-sm">{streakInfo.emoji}</span>
              <span className={`text-xs font-semibold ${
                streakInfo.color === 'emerald' ? 'text-emerald-400' :
                streakInfo.color === 'blue' ? 'text-blue-400' :
                streakInfo.color === 'amber' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {streakInfo.label}
              </span>
              {streakInfo.count >= 3 && (
                <Flame className={`h-3.5 w-3.5 ${
                  streakInfo.color === 'emerald' ? 'text-emerald-400' :
                  streakInfo.color === 'amber' ? 'text-amber-400' :
                  'text-red-400'
                }`} />
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Attribute Radar Mini-Chart Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <AttributeRadarChart attributes={player.attributes} />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Key Attributes</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map((key) => {
                  const val = player.attributes[key] ?? 50;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[9px] text-[#8b949e] uppercase tracking-wider">{key.slice(0, 3)}</span>
                      <span className={`text-[10px] font-bold ${
                        val >= 75 ? 'text-emerald-400' :
                        val >= 60 ? 'text-amber-400' :
                        val >= 45 ? 'text-orange-400' : 'text-red-400'
                      }`}>{Math.round(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Youth Promotion Status */}
      {(playerTeamLevel === 'u18' || playerTeamLevel === 'u21') && (
        <PromotionStatusCard
          playerTeamLevel={playerTeamLevel}
          playerAge={player.age}
          playerOverall={player.overall}
          onPromoteU21={useGameStore.getState().promoteToU21}
          onPromoteSenior={useGameStore.getState().promoteToSenior}
        />
      )}

      {/* Quick Actions Row — pill buttons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setScreen('training')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Train Now
        </button>
        <button
          onClick={() => setScreen('league_table')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium hover:bg-[#30363d] transition-colors"
        >
          <Table className="h-3.5 w-3.5" />
          View Table
        </button>
        <button
          onClick={() => setScreen('transfers')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium hover:bg-[#30363d] transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Check Transfers
        </button>
        <button
          onClick={() => setScreen('press_conference')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium hover:bg-[#30363d] transition-colors"
        >
          <Mic className="h-3.5 w-3.5" />
          Press Conference
        </button>
      </div>

      {/* Financial Overview Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Financial Overview</CardTitle>
          <Wallet className="h-3.5 w-3.5 text-[#8b949e]" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
              <span className="text-[9px] text-[#484f58] font-medium">Market Value</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
              <Wallet className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
              <span className="text-[9px] text-[#484f58] font-medium">Weekly Wage</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400">{player.contract.yearsRemaining}yr</span>
              <span className="text-[9px] text-[#484f58] font-medium">Contract Left</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Header: Quick Actions */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Quick Actions</span>
        <div className="flex-1 border-t border-[#21262d]" />
      </div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-4 gap-3">
        <QuickActionButton
          icon={<Dumbbell className="h-5 w-5" />}
          label="Train"
          description="Improve skills"
          onClick={() => setScreen('training')}
          accentColor="emerald"
        />
        <QuickActionButton
          icon={<Swords className="h-5 w-5" />}
          label="Match"
          description="Play next"
          onClick={() => setScreen('match_day')}
          accentColor="amber"
        />
        <QuickActionButton
          icon={<BarChart3 className="h-5 w-5" />}
          label="Stats"
          description="Analytics"
          onClick={() => setScreen('analytics')}
          accentColor="cyan"
        />
        <QuickActionButton
          icon={<UserCircle className="h-5 w-5" />}
          label="Profile"
          description="View details"
          onClick={() => setScreen('player_profile')}
          accentColor="purple"
        />
      </div>

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Season Progress Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <div className="relative">
          {/* Subtle background accent */}
          <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />
          <CardContent className="p-4 relative z-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-[#8b949e]">Season {currentSeason}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-[#c9d1d9]">{currentWeek}</span>
                <span className="text-xs text-[#8b949e]">/ {seasonMatchdays}</span>
              </div>
            </div>

            {/* Phase label */}
            <div className="mb-2">
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                {getSeasonWeekDescription(currentWeek, seasonMatchdays)}
              </span>
            </div>

            {/* Horizontal progress bar with phase segments */}
            <div className="relative mb-2">
              {/* Phase background segments */}
              <div className="flex h-3 rounded-md overflow-hidden bg-[#21262d]">
                {/* Pre-Season (0-10%) */}
                <div className={`${seasonProgress > 0 ? (seasonProgress <= 10 ? 'bg-emerald-600/40' : 'bg-emerald-600/20') : ''}`} style={{ width: '10%' }} />
                {/* Early Season (10-26%) */}
                <div className={`${seasonProgress > 10 ? (seasonProgress <= 26 ? 'bg-emerald-500/40' : 'bg-emerald-500/20') : ''}`} style={{ width: '16%' }} />
                {/* Mid Season (26-52%) */}
                <div className={`${seasonProgress > 26 ? (seasonProgress <= 52 ? 'bg-emerald-400/40' : 'bg-emerald-400/20') : ''}`} style={{ width: '26%' }} />
                {/* Late Season (52-78%) */}
                <div className={`${seasonProgress > 52 ? (seasonProgress <= 78 ? 'bg-amber-500/40' : 'bg-amber-500/20') : ''}`} style={{ width: '26%' }} />
                {/* Final Run (78-100%) */}
                <div className={`${seasonProgress > 78 ? 'bg-red-500/40' : ''}`} style={{ width: '22%' }} />
              </div>
              {/* Actual progress overlay */}
              <motion.div
                className="absolute top-0 left-0 h-3 rounded-md bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${seasonProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {/* Current week marker */}
              <motion.div
                className="absolute top-0 h-3 w-0.5 bg-white z-10"
                initial={{ left: 0 }}
                animate={{ left: `${seasonProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Phase labels row */}
            <div className="flex text-[7px] text-[#484f58] font-medium uppercase tracking-wider mb-3">
              <span className="flex-1">Pre</span>
              <span className="flex-[1.6]">Early</span>
              <span className="flex-[2.6]">Mid</span>
              <span className="flex-[2.6]">Late</span>
              <span className="flex-[2.2]">Final</span>
            </div>

            {/* Season info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#8b949e]">
                <span className="text-xs">{getSeasonWeekDescription(currentWeek, seasonMatchdays)} &bull; {seasonProgress}% complete</span>
              </div>
              {pendingEvents > 0 && (
                <Badge className="bg-amber-600 text-white text-[10px] px-1.5">
                  {pendingEvents} event{pendingEvents > 1 ? 's' : ''}
                </Badge>
              )}
              {/* Contract Expiring Alert */}
              {player.contract.yearsRemaining <= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border ${
                    player.contract.yearsRemaining <= 1
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-amber-500/8 border-amber-500/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className={`h-3 w-3 ${
                      player.contract.yearsRemaining <= 1 ? 'text-red-400' : 'text-amber-400'
                    }`} />
                    <span className={`text-[10px] font-semibold ${
                      player.contract.yearsRemaining <= 1 ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {player.contract.yearsRemaining <= 1 ? 'Contract expiring!' : 'Contract running low'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowContractNegotiation(true)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                      player.contract.yearsRemaining <= 1
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    Renegotiate
                  </button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Cup Status Card */}
      <Card className="bg-[#161b22] border-[#30363d] cursor-pointer hover:bg-[#21262d] transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                {(() => {
                  const cupData = CUP_NAMES[currentClub.league];
                  const cupName = cupData?.name ?? 'Domestic Cup';
                  const cupEmoji = cupData?.emoji ?? '🏆';
                  const cupRoundVal = gameState.cupRound ?? 1;
                  const cupElim = gameState.cupEliminated ?? false;
                  const cupFixts = gameState.cupFixtures ?? [];
                  const maxCupRound = cupFixts.length > 0 ? Math.max(...cupFixts.map(f => f.matchday)) : 1;
                  const isCupWinner = !cupElim && cupRoundVal > maxCupRound;

                  const nextCupMatch = cupFixts.find(
                    f => f.matchday === cupRoundVal && !f.played &&
                         (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
                  );
                  const cupOpponentId = nextCupMatch
                    ? (nextCupMatch.homeClubId === currentClub.id ? nextCupMatch.awayClubId : nextCupMatch.homeClubId)
                    : null;
                  const cupOpponent = cupOpponentId ? getClubById(cupOpponentId) : null;

                  function getRoundLabel(round: number, total: number): string {
                    if (round === total) return 'Final';
                    if (round === total - 1) return 'Semi-Final';
                    if (round === total - 2) return 'Quarter-Final';
                    return `Round ${round}`;
                  }

                  if (isCupWinner) {
                    return (
                      <div>
                        <p className="text-xs text-[#8b949e]">{cupEmoji} {cupName}</p>
                        <p className="text-sm font-semibold">
                          <span className="text-amber-400">Winner! 🏆</span>
                        </p>
                      </div>
                    );
                  }
                  if (cupElim) {
                    return (
                      <div>
                        <p className="text-xs text-[#8b949e]">{cupEmoji} {cupName}</p>
                        <p className="text-sm font-semibold">
                          <span className="text-red-400">Eliminated</span>
                          <span className="text-[#8b949e]"> in {getRoundLabel(Math.max(1, cupRoundVal - 1), maxCupRound)}</span>
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <p className="text-xs text-[#8b949e]">{cupEmoji} {cupName}</p>
                      <p className="text-sm font-semibold">
                        <span className="text-amber-400">{getRoundLabel(cupRoundVal, maxCupRound)}</span>
                        <span className="text-[#8b949e]"> in cup</span>
                      </p>
                      {cupOpponent && nextCupMatch && (
                        <p className="text-[10px] text-[#8b949e] mt-0.5">
                          Next: vs {cupOpponent.shortName} (Wk {CUP_MATCH_WEEKS[cupRoundVal - 1] ?? cupRoundVal * 4})
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* League Table Quick Link Card */}
      <Card
        className="bg-[#161b22] border-[#30363d] cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={() => setScreen('league_table')}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center">
                <Table className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[#8b949e]">
                  {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League Table'}
                </p>
                <p className="text-sm font-semibold">
                  <span className="text-emerald-400">{leaguePos}{posSuffix}</span>
                  <span className="text-[#8b949e]"> in the league</span>
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#484f58]" />
          </div>
        </CardContent>
      </Card>

      {/* Club Standing Mini-Table */}
      {standingsMini.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">League Standings</CardTitle>
            <button
              onClick={() => setScreen('league_table')}
              className="flex items-center gap-0.5 text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Full table <ChevronRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-0 px-2 pb-1 border-b border-[#21262d]">
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold">#</span>
              <span className="col-span-4 text-[7px] text-[#484f58] font-semibold">Club</span>
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold text-center">P</span>
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold text-center">W</span>
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold text-center">D</span>
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold text-center">L</span>
              <span className="col-span-1 text-[7px] text-[#484f58] font-semibold text-center">GD</span>
              <span className="col-span-2 text-[7px] text-[#484f58] font-semibold text-right">Pts</span>
            </div>
            {/* Table rows */}
            {standingsMini.map((row) => (
              <div
                key={row.clubId}
                className={`grid grid-cols-12 gap-0 px-2 py-1.5 text-[10px] rounded-sm ${
                  row.isPlayer ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'hover:bg-[#21262d]'
                }`}
              >
                <span className={`col-span-1 font-bold ${row.isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{row.position}</span>
                <span className={`col-span-4 truncate ${row.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>{row.clubName}</span>
                <span className="col-span-1 text-[#8b949e] text-center">{row.played}</span>
                <span className="col-span-1 text-emerald-400/70 text-center">{row.won}</span>
                <span className="col-span-1 text-amber-400/70 text-center">{row.drawn}</span>
                <span className="col-span-1 text-red-400/70 text-center">{row.lost}</span>
                <span className={`col-span-1 text-center font-medium ${row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>{row.gd > 0 ? '+' : ''}{row.gd}</span>
                <span className={`col-span-2 text-right font-bold ${row.isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{row.points}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Match Day Countdown Card */}
      {nextOpponent && nextFixture && winProbability && (
        <Card className={`bg-[#161b22] border-[#30363d] overflow-hidden border-l-[3px] ${isHome ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>

          <CardHeader className="pb-2 pt-3 px-4 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Next Match</CardTitle>
              <div className="flex items-center gap-1.5">
                {/* Match Day indicator */}
                <Badge className={`text-[9px] font-bold ${isHome ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                  {isHome ? '🏠 HOME' : '✈️ AWAY'}
                </Badge>
                {/* Competition Badge */}
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                  {nextFixture.competition === 'league' ? '🏆 League' :
                   nextFixture.competition === 'cup' ? '🏆 Cup' :
                   nextFixture.competition === 'continental' ? '🌍 Continental' : '🤝 Friendly'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 relative">
            {/* Team logos with pulsing VS */}
            <div className="flex items-center justify-between mb-3">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-3xl">{isHome ? currentClub.logo : nextOpponent.logo}</span>
                <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[80px] text-center">
                  {isHome ? currentClub.shortName : nextOpponent.shortName}
                </span>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center mx-2">
                <div className="text-lg font-black text-emerald-400/80">VS</div>
                <div className="w-px h-4 bg-[#30363d] mt-1" />
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-3xl">{isHome ? nextOpponent.logo : currentClub.logo}</span>
                <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[80px] text-center">
                  {isHome ? nextOpponent.shortName : currentClub.shortName}
                </span>
              </div>
            </div>

            {/* Formation Dots Visualization */}
            <div className="flex items-center justify-between mb-3 px-1">
              <FormationDots formation={isHome ? currentClub.formation : nextOpponent.formation} color="#10b981" />
              <FormationDots formation={isHome ? nextOpponent.formation : currentClub.formation} color="#f59e0b" flip />
            </div>

            {/* Win probability mini bar chart */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-400">{winProbability.win}%</span>
                  <span className="text-[#8b949e]">Win</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#8b949e]">Draw</span>
                  <span className="font-bold text-[#8b949e]">{winProbability.draw}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#8b949e]">Loss</span>
                  <span className="font-bold text-red-400">{100 - winProbability.win - winProbability.draw}%</span>
                </div>
              </div>
              {/* Stacked horizontal bar chart */}
              <div className="space-y-1">
                {/* Win bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-[#484f58] w-7">W</span>
                  <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${winProbability.win}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {/* Draw bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-[#484f58] w-7">D</span>
                  <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full bg-slate-500 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${winProbability.draw}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {/* Loss bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-[#484f58] w-7">L</span>
                  <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500/70 rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - winProbability.win - winProbability.draw}%` }}
                      transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Meeting */}
            {(() => {
              const prevMeeting = recentResults.find(r =>
                (r.homeClub.id === currentClub.id && r.awayClub.id === nextOpponent.id) ||
                (r.homeClub.id === nextOpponent.id && r.awayClub.id === currentClub.id)
              );
              if (!prevMeeting) return null;
              const prevPlayerScore = prevMeeting.homeClub.id === currentClub.id ? prevMeeting.homeScore : prevMeeting.awayScore;
              const prevOppScore = prevMeeting.homeClub.id === currentClub.id ? prevMeeting.awayScore : prevMeeting.homeScore;
              const prevResult = prevPlayerScore > prevOppScore ? 'W' : prevPlayerScore < prevOppScore ? 'L' : 'D';
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.2 }}
                  className="flex items-center justify-between mb-3 px-2 py-1.5 rounded-md bg-[#21262d] border border-[#30363d]"
                >
                  <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3 text-[#8b949e]" />
                    <span className="text-[10px] text-[#8b949e]">Previous Meeting</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[9px] px-1 font-bold ${
                      prevResult === 'W' ? 'bg-emerald-600 text-white' :
                      prevResult === 'D' ? 'bg-amber-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {prevResult}
                    </Badge>
                    <span className="text-[10px] font-semibold text-[#c9d1d9]">{prevPlayerScore}-{prevOppScore}</span>
                    <span className="text-[8px] text-[#484f58]">Wk {prevMeeting.week}</span>
                  </div>
                </motion.div>
              );
            })()}

            {/* Form indicator (last 5 results) */}
            {formDots.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[9px] text-[#8b949e] uppercase tracking-wider font-medium">Form</span>
                <div className="flex items-center gap-1">
                  {formDots.map((result, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold text-white ${
                        result === 'W' ? 'bg-emerald-500' :
                        result === 'D' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown display */}
            <div className="flex items-center justify-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[#21262d] border border-[#30363d]">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-[#8b949e]">
                {nextFixture.matchday <= currentWeek ? 'Match this week!' :
                 nextFixture.matchday === currentWeek + 1 ? 'Next week' :
                 `In ${nextFixture.matchday - currentWeek} weeks`}
              </span>
              <span className="text-[10px] text-[#484f58]">&bull; Week {nextFixture.matchday}</span>
            </div>

            {/* Week info */}
            <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-[#30363d]">
              <Clock className="h-3 w-3 text-[#8b949e]" />
              <span className="text-[10px] text-[#8b949e]">Week {nextFixture.matchday} &bull; Season {nextFixture.season}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Header: Advance */ }
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Advance</span>
        <div className="flex-1 border-t border-[#21262d]" />
      </div>

      {/* Advance Week + Match Day Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleAdvanceWeek}
          className="h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
        >
          <ArrowRight className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm leading-tight">Advance Week</span>
            <span className="text-[9px] opacity-70 font-normal">Week {currentWeek} &rarr; {currentWeek + 1}</span>
          </div>
        </Button>
        <Button
          onClick={() => setScreen('match_day')}
          variant="outline"
          className="h-14 border-[#30363d] bg-[#21262d] text-amber-300 hover:bg-[#30363d] font-semibold rounded-lg transition-all"
        >
          <Swords className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm leading-tight">Match Day</span>
            <span className="text-[9px] opacity-70 font-normal">Play next match</span>
          </div>
        </Button>
      </div>

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Season Stats Summary */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Season Stats</CardTitle>
          <button
            onClick={() => setScreen('league_table')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Trophy className="h-3 w-3" />
            <span>{leaguePos}{posSuffix}</span>
            <span className="text-emerald-600">&rarr;</span>
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{player.seasonStats.goals}</p>
              <p className="text-[10px] text-[#8b949e]">Goals</p>
              {sparklineData.goals.length >= 2 && (
                <div className="flex justify-center mt-1">
                  <SparklineChart data={sparklineData.goals} color="#10b981" width={80} height={24} />
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-cyan-400">{player.seasonStats.assists}</p>
              <p className="text-[10px] text-[#8b949e]">Assists</p>
              {sparklineData.assists.length >= 2 && (
                <div className="flex justify-center mt-1">
                  <SparklineChart data={sparklineData.assists} color="#38bdf8" width={80} height={24} />
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{player.seasonStats.appearances}</p>
              <p className="text-[10px] text-[#8b949e]">Apps</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#c9d1d9]">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</p>
              <p className="text-[10px] text-[#8b949e]">Avg Rating</p>
              {sparklineData.ratings.length >= 2 && (
                <div className="flex justify-center mt-1">
                  <SparklineChart data={sparklineData.ratings} color="#f59e0b" width={80} height={24} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#30363d]">
            <span className="text-xs text-[#8b949e]">Market Value</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
              {/* Market value trend arrow */}
              {(() => {
                const seasonStartValue = seasons.length > 0
                  ? player.marketValue - (player.marketValue * (currentWeek / seasonMatchdays) * 0.05)
                  : player.marketValue;
                const valueDiff = player.marketValue - seasonStartValue;
                const pctChange = seasonStartValue > 0 ? (valueDiff / seasonStartValue) * 100 : 0;
                if (Math.abs(pctChange) < 1) {
                  return <Minus className="h-3 w-3 text-[#484f58]" />;
                }
                if (pctChange > 0) {
                  return (
                    <span className="flex items-center text-[10px] text-emerald-400 font-semibold">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      +{pctChange.toFixed(0)}%
                    </span>
                  );
                }
                return (
                  <span className="flex items-center text-[10px] text-red-400 font-semibold">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {pctChange.toFixed(0)}%
                  </span>
                );
              })()}
            </div>
          </div>
          {/* Market value sparkline */}
          {(() => {
            // Generate sparkline data points from recent results (simulated value trend)
            const sparkData = recentResults.slice(0, 8).reverse().map((_, idx) => {
              const progress = idx / 7;
              const baseValue = player.marketValue * 0.9;
              const growthValue = player.marketValue;
              const noise = Math.sin(idx * 1.5) * player.marketValue * 0.02;
              return baseValue + (growthValue - baseValue) * progress + noise;
            });
            if (sparkData.length < 2) return null;
            const minVal = Math.min(...sparkData);
            const maxVal = Math.max(...sparkData);
            const range = maxVal - minVal || 1;
            const w = 120;
            const h = 20;
            const points = sparkData.map((v, i) => {
              const x = (i / (sparkData.length - 1)) * w;
              const y = h - ((v - minVal) / range) * (h - 4) - 2;
              return `${x},${y}`;
            }).join(' ');
            const isUp = sparkData[sparkData.length - 1] >= sparkData[0];
            return (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[#8b949e]">Value Trend</span>
                <svg width={w} height={h} className="overflow-visible">
                  <polyline
                    points={points}
                    fill="none"
                    stroke={isUp ? '#10b981' : '#ef4444'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* Fill area under the line */}
                  <polygon
                    points={`0,${h} ${points} ${w},${h}`}
                    fill={isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
                  />
                </svg>
              </div>
            );
          })()}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#8b949e]">Weekly Wage</span>
            <span className="text-sm text-[#c9d1d9]">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Comparison */}
      {statsComparison && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-xs text-[#8b949e]">vs Last Season</CardTitle>
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
              Season {seasons[seasons.length - 1]?.number ?? '?'}
            </Badge>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {statsComparison.map((stat) => {
                const diff = stat.current - stat.previous;
                const isPositive = diff > 0;
                const isNegative = diff < 0;
                const currVal = stat.format === 'decimal' ? stat.current.toFixed(1) : stat.current;
                const prevVal = stat.format === 'decimal' ? stat.previous.toFixed(1) : stat.previous;

                return (
                  <div key={stat.label} className="flex items-center justify-between py-1">
                    <span className="text-xs text-[#8b949e] w-20">{stat.label}</span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-xs text-[#484f58]">{prevVal}</span>
                      <span className="text-[#30363d]">&rarr;</span>
                      <span className={`text-sm font-bold ${
                        isPositive ? 'text-emerald-400' :
                        isNegative ? 'text-red-400' :
                        'text-[#c9d1d9]'
                      }`}>
                        {currVal}
                      </span>
                      {diff !== 0 && (
                        <span className={`flex items-center text-[10px] font-semibold ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isPositive ? (
                            <ArrowUp className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {stat.format === 'decimal' ? Math.abs(diff).toFixed(1) : Math.abs(diff)}
                        </span>
                      )}
                      {diff === 0 && (
                        <Minus className="h-2.5 w-2.5 text-[#484f58]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Enhanced Recent Results */}
      {recentResults.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Recent Form</CardTitle>
            {/* Streak indicator in header */}
            {streakInfo && (
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                streakInfo.color === 'emerald' ? 'text-emerald-400' :
                streakInfo.color === 'amber' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {streakInfo.emoji} {streakInfo.label}
              </span>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {recentResults.slice(0, 5).map((result, i) => {
              const resultType = getPlayerMatchResult(result);
              const opponentClub = result.homeClub.id === currentClub.id ? result.awayClub : result.homeClub;
              const playerScore = result.homeClub.id === currentClub.id ? result.homeScore : result.awayScore;
              const opponentScore = result.homeClub.id === currentClub.id ? result.awayScore : result.homeScore;

              // Border + left accent based on result
              const borderClass = resultType === 'W' ? 'border-emerald-500/20'
                : resultType === 'D' ? 'border-[#30363d]'
                : 'border-red-500/15';
              const borderLeftClass = resultType === 'W' ? 'border-l-emerald-500'
                : resultType === 'D' ? 'border-l-amber-500'
                : 'border-l-red-500';

              // Rating circle size
              const ratingColor = getRatingColor(result.playerRating);

              // Match type badge
              const matchType = result.competition === 'league' ? 'League' :
                               result.competition === 'cup' ? 'Cup' :
                               result.competition === 'continental' ? 'Continental' : 'Friendly';
              const matchTypeStyle = result.competition === 'league' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    result.competition === 'cup' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    result.competition === 'continental' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                    'bg-[#21262d] text-[#8b949e] border-[#30363d]';

              return (
                <motion.div
                  key={`${result.week}-${result.season}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className={`rounded-lg bg-[#161b22] border ${borderClass} border-l-[3px] ${borderLeftClass} p-2.5 hover:bg-[#21262d] transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Result badge + Opponent info + Quality */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge className={`text-[11px] px-2 py-0.5 font-bold shrink-0 ${
                        resultType === 'W' ? 'bg-emerald-600 text-white' :
                        resultType === 'D' ? 'bg-amber-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {resultType}
                      </Badge>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#c9d1d9] truncate">
                            {opponentClub.shortName || opponentClub.name.slice(0, 3)}
                          </span>
                          {/* Opponent quality badge */}
                          <span className={`text-[8px] font-semibold ${getQualityColor(opponentClub.quality)}`}>
                            {getQualityLabel(opponentClub.quality)}
                          </span>
                          <span className="text-xs font-bold text-[#c9d1d9]">
                            {playerScore}-{opponentScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-[#8b949e]">
                          <span>Wk {result.week}</span>
                          <span>&bull;</span>
                          <span>S{result.season}</span>
                          {/* Match type badge */}
                          <Badge className={`text-[7px] px-1 py-0 border font-medium ${matchTypeStyle}`}>
                            {matchType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right: Goals/Assists + Rating circle */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Goals/Assists indicators */}
                      <div className="flex items-center gap-1.5">
                        {result.playerGoals > 0 && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.06 + 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex items-center text-[10px] text-emerald-400 font-semibold"
                          >
                            <Goal className="h-3 w-3 mr-0.5" />
                            {result.playerGoals}
                          </motion.span>
                        )}
                        {result.playerAssists > 0 && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.06 + 0.3, type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex items-center text-[10px] text-cyan-400 font-semibold"
                          >
                            <CircleDot className="h-3 w-3 mr-0.5" />
                            {result.playerAssists}
                          </motion.span>
                        )}
                      </div>
                      {/* Mini circular rating badge */}
                      <div className="relative w-9 h-9 flex-shrink-0">
                        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke={ratingColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 15}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - (result.playerRating - 1) / 9) }}
                            transition={{ delay: i * 0.06 + 0.1, duration: 0.6, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-bold" style={{ color: ratingColor }}>
                            {result.playerRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pending Events */}
      {activeEvents.length > 0 && (
        <Button
          onClick={() => setScreen('events')}
          variant="outline"
          className="w-full h-12 border-amber-700 text-amber-300 hover:bg-[#21262d] font-semibold rounded-lg"
        >
          <Bell className="mr-2 h-4 w-4" />
          {activeEvents.length} Pending Event{activeEvents.length > 1 ? 's' : ''}
        </Button>
      )}

      {/* Training Available */}
      {trainingAvailable > 0 && (
        <Button
          onClick={() => setScreen('training')}
          variant="outline"
          className="w-full h-10 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-sm"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {trainingAvailable} Training Session{trainingAvailable > 1 ? 's' : ''} Available
        </Button>
      )}

      {/* ===== SECTION 1: Dynamic Greeting & Player Status Card ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-[#8b949e]">{dynamicGreeting.greeting},</p>
            <p className="text-lg font-bold text-[#c9d1d9]">{player.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentClub.logo}</span>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#c9d1d9]">{currentClub.shortName}</p>
              <p className="text-[9px] text-[#8b949e]">Season {currentSeason} &bull; Week {currentWeek}</p>
            </div>
          </div>
        </div>

        {/* Player card row: Face SVG, OVR badge, Position */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
          {/* Face placeholder SVG */}
          <div className="w-14 h-14 rounded-xl bg-[#21262d] flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="12" r="6" fill="#8b949e" />
              <ellipse cx="16" cy="28" rx="10" ry="8" fill="#8b949e" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#c9d1d9] truncate">{player.name}</span>
              <Badge className="text-[9px] font-bold bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-1.5 py-0 h-5 shrink-0">
                {player.position}
              </Badge>
            </div>
            {/* OVR with trend arrow */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black" style={{ color: overallColor }}>{player.overall}</span>
              <span className="text-[9px] text-[#484f58] font-medium">OVR</span>
              {ovrTrend === 'up' && <ArrowUp className="h-3 w-3 text-emerald-400" />}
              {ovrTrend === 'down' && <ArrowDown className="h-3 w-3 text-red-400" />}
              {ovrTrend === 'stable' && <Minus className="h-3 w-3 text-[#484f58]" />}
            </div>
          </div>
        </div>

        {/* Status chips row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Injury chip */}
          {currentInjury ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-400">
              <Activity className="h-3 w-3" /> {currentInjury.name}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
              <Activity className="h-3 w-3" /> Fit
            </span>
          )}
          {/* Form indicator: last 5 matches dots */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#484f58] mr-0.5">Form:</span>
            {formDots.slice(0, 5).map((result, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold text-white ${
                  result === 'W' ? 'bg-emerald-500' : result === 'D' ? 'bg-amber-500' : 'bg-red-500'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
          {/* Morale emoji */}
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e]">
            {player.morale >= 80 ? '😊' : player.morale >= 60 ? '😐' : player.morale >= 35 ? '😟' : '😤'}
            {player.morale}
          </span>
        </div>

        {/* Quick stat bar with mini sparkline SVGs */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {([
            { label: 'Goals', value: player.seasonStats.goals, data: sparklineData.goals, color: '#10b981' },
            { label: 'Assists', value: player.seasonStats.assists, data: sparklineData.assists, color: '#38bdf8' },
            { label: 'Avg Rating', value: player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-', data: sparklineData.ratings, color: '#f59e0b' },
          ] as const).map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
              <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
              <span className="text-[9px] text-[#484f58] font-medium">{stat.label}</span>
              {stat.data.length >= 2 && (
                <svg width={60} height={16} className="mt-1 overflow-visible">
                  {(() => {
                    const pts = stat.data.map((v: number, i: number) => {
                      const x = (i / (stat.data.length - 1)) * 60;
                      const maxV = Math.max(...stat.data, 1);
                      const y = 14 - (v / maxV) * 12;
                      return `${x},${y}`;
                    }).join(' ');
                    return <polyline points={pts} fill="none" stroke={stat.color} strokeWidth="1.5" strokeLinejoin="round" />;
                  })()}
                </svg>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ===== SECTION 2: Quick Actions Grid (2x3) ===== */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Quick Actions</span>
        <div className="flex-1 border-t border-[#21262d]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Next Match */}
        <button
          onClick={() => setScreen('match_day')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-amber-500 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Swords className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Next Match</p>
            <p className="text-[10px] text-[#8b949e] truncate">
              {nextOpponent ? `vs ${nextOpponent.shortName}` : 'No fixture'}
            </p>
            {nextFixture && (
              <p className="text-[9px] text-[#484f58]">
                Week {nextFixture.matchday} &bull; {nextFixture.competition === 'league' ? 'League' : nextFixture.competition === 'cup' ? 'Cup' : 'Friendly'}
              </p>
            )}
          </div>
        </button>
        {/* Training */}
        <button
          onClick={() => setScreen('training')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-emerald-500 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Dumbbell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Training</p>
            <p className="text-[10px] text-[#8b949e]">
              {trainingAvailable} session{trainingAvailable !== 1 ? 's' : ''} available
            </p>
            <p className="text-[9px] text-[#484f58]">
              {seasonTrainingFocus ? `${seasonTrainingFocus.area} Focus` : 'Set focus area'}
            </p>
          </div>
        </button>
        {/* Transfers */}
        <button
          onClick={() => setScreen('transfers')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-blue-500 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-4 w-4 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Transfers</p>
            <p className="text-[10px] text-[#8b949e]">
              {gameState.transferOffers.length > 0 ? `${gameState.transferOffers.length} offer${gameState.transferOffers.length !== 1 ? 's' : ''} pending` : 'No offers'}
            </p>
            <p className="text-[9px] text-[#484f58]">Transfer window open</p>
          </div>
        </button>
        {/* Contract */}
        <button
          onClick={() => setShowContractNegotiation(true)}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-cyan-500 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Contract</p>
            <p className="text-[10px] text-[#8b949e]">
              {player.contract.yearsRemaining}yr &bull; {formatCurrency(player.contract.weeklyWage, 'K')}/wk
            </p>
            <p className={`text-[9px] ${player.contract.yearsRemaining <= 1 ? 'text-red-400' : 'text-[#484f58]'}`}>
              {player.contract.yearsRemaining <= 1 ? 'Expiring soon!' : `Expires S${currentSeason + player.contract.yearsRemaining}`}
            </p>
          </div>
        </button>
        {/* Squad */}
        <button
          onClick={() => setScreen('league_table')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-purple-500 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Squad</p>
            <p className="text-[10px] text-[#8b949e]">{currentClub.squadSize} players</p>
            <p className="text-[9px] text-[#484f58]">{currentClub.formation} &bull; {leaguePos}{posSuffix}</p>
          </div>
        </button>
        {/* Trophy Room */}
        <button
          onClick={() => setScreen('player_profile')}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d] border-l-[3px] border-l-amber-400 hover:bg-[#21262d] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#c9d1d9]">Trophy Room</p>
            <p className="text-[10px] text-[#8b949e]">
              {player.careerStats.trophies.length > 0 ? `${player.careerStats.trophies.length} trophy${player.careerStats.trophies.length !== 1 ? 's' : ''}` : 'No trophies yet'}
            </p>
            <p className="text-[9px] text-[#484f58]">
              {player.careerStats.trophies.length > 0 ? `Latest: ${player.careerStats.trophies[player.careerStats.trophies.length - 1].name}` : 'Keep pushing!'}
            </p>
          </div>
        </button>
      </div>

      {/* ===== SECTION 3: Recent Activity Feed ===== */}
      {activityFeed.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Recent Activity</CardTitle>
            <button
              onClick={() => setScreen('analytics')}
              className="flex items-center gap-0.5 text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-0">
              {activityFeed.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="flex items-start gap-3 py-2 border-l-2 pl-3"
                  style={{ borderColor: entry.color }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: entry.color + '30', color: entry.color }}
                  >
                    {entry.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#c9d1d9] truncate">{entry.title}</p>
                    <p className="text-[10px] text-[#8b949e] truncate">{entry.subtitle}</p>
                  </div>
                  <span className="text-[9px] text-[#484f58] shrink-0 mt-0.5">Wk {entry.week}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 4: Weekly Goals Tracker ===== */}
      {weeklyGoals.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Weekly Goals</CardTitle>
            </div>
            <span className="text-xs font-bold text-emerald-400">{weeklyGoalsProgress}%</span>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {/* Overall progress bar */}
            <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-lg bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${weeklyGoalsProgress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="space-y-2.5">
              {weeklyGoals.map((goal) => {
                const progressPct = goal.target > 0
                  ? Math.min(100, Math.round((Math.min(goal.current, goal.target) / goal.target) * 100))
                  : 0;
                const isCompleted = goal.completed;
                const barColor = isCompleted ? '#22c55e' : progressPct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={goal.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center text-sm shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <span>{goal.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-medium ${isCompleted ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                          {goal.label}
                        </span>
                        <span className="text-[9px] text-[#484f58]">+{goal.reward} XP</span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{ width: `${progressPct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <p className="text-[9px] text-[#484f58] mt-0.5">
                        {typeof goal.current === 'number' && goal.current % 1 !== 0 ? goal.current.toFixed(1) : goal.current}/{goal.target}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 5: Financial Snapshot Mini ===== */}
      {financialSnapshot && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Financial Snapshot</CardTitle>
            <Wallet className="h-3.5 w-3.5 text-[#8b949e]" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-4">
              {/* Donut chart SVG */}
              <div className="relative w-20 h-20 shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  {/* Wage segment */}
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.6} ${2 * Math.PI * 32 * 0.4}`}
                    strokeDashoffset="0"
                  />
                  {/* Sponsorship segment */}
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.25} ${2 * Math.PI * 32 * 0.75}`}
                    strokeDashoffset={`${-(2 * Math.PI * 32 * 0.6)}`}
                  />
                  {/* Bonuses segment */}
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.15} ${2 * Math.PI * 32 * 0.85}`}
                    strokeDashoffset={`${-(2 * Math.PI * 32 * 0.85)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{formatCurrency(financialSnapshot.weeklyWage, 'K')}</span>
                  <span className="text-[8px] text-[#484f58]">/week</span>
                </div>
              </div>
              {/* Stats list */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] text-[#8b949e]">Weekly Wage</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{formatCurrency(financialSnapshot.weeklyWage, 'K')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-cyan-500" />
                    <span className="text-[10px] text-[#8b949e]">Sponsorships</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{financialSnapshot.sponsorshipCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-amber-500" />
                    <span className="text-[10px] text-[#8b949e]">Career Earnings</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{formatCurrency(financialSnapshot.totalCareerEarnings, 'K')}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#21262d]">
                  <span className="text-[10px] text-[#8b949e]">Contract Value</span>
                  <span className="text-[10px] font-bold text-emerald-400">{formatCurrency(financialSnapshot.contractValueRemaining, 'K')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 6: Upcoming Fixtures Strip ===== */}
      {upcomingFixturesStrip.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Upcoming Fixtures</CardTitle>
            <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {upcomingFixturesStrip.map((fixture, idx) => {
                const diffColor = fixture.difficulty === 'hard' ? '#ef4444'
                  : fixture.difficulty === 'medium' ? '#f59e0b' : '#22c55e';
                const diffBg = fixture.difficulty === 'hard' ? 'bg-red-500/10 border-red-500/20'
                  : fixture.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
                return (
                  <motion.div
                    key={`${fixture.matchday}-${fixture.season}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.08, duration: 0.2 }}
                    className={`shrink-0 w-[130px] p-2.5 rounded-xl border ${diffBg} flex flex-col items-center gap-1.5`}
                  >
                    {/* Competition badge */}
                    <Badge className="text-[7px] px-1.5 py-0 border border-[#30363d] bg-[#21262d] text-[#8b949e] font-medium">
                      {fixture.competition === 'league' ? 'LG' : fixture.competition === 'cup' ? 'CU' : 'FR'}
                    </Badge>
                    {/* Opponent */}
                    <div className="text-center">
                      <span className="text-sm block">{fixture.opponent?.logo ?? '⚽'}</span>
                      <span className="text-[10px] font-semibold text-[#c9d1d9] truncate block max-w-[110px]">
                        {fixture.opponent?.shortName ?? 'TBD'}
                      </span>
                    </div>
                    {/* Home/Away + Date */}
                    <div className="flex items-center gap-1.5 text-[9px] text-[#8b949e]">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${
                        fixture.isHome ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}>
                        {fixture.isHome ? 'H' : 'A'}
                      </span>
                      <span>Wk {fixture.matchday}</span>
                    </div>
                    {/* Difficulty indicator */}
                    <div className="w-full h-0.5 rounded-sm mt-0.5" style={{ backgroundColor: diffColor, opacity: 0.5 }} />
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Weekly Summary Modal */}
    {showSummary && !showSeasonEnd && <WeeklySummary onClose={() => setShowSummary(false)} />}

    {/* Season End Summary Modal */}
    {showSeasonEnd && seasonEndData && (
      <SeasonEndSummary
        onClose={() => setShowSeasonEnd(false)}
        seasonData={seasonEndData}
      />
    )}

    {/* Contract Negotiation Modal */}
    <ContractNegotiation
      open={showContractNegotiation}
      onClose={() => setShowContractNegotiation(false)}
    />

    {/* Season Training Focus Modal */}
    <SeasonTrainingFocusModal
      open={showFocusModal}
      onClose={() => setShowFocusModal(false)}
    />

    {/* Season Preview Modal */}
    <SeasonPreview
      open={showSeasonPreview}
      onClose={() => setShowSeasonPreview(false)}
    />
    </>
  );
}

// ==========================================
// Enhanced Status Bar Component
// ==========================================
function EnhancedStatBar({
  icon, label, value, max, type, trend
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  type: 'form' | 'morale' | 'fitness';
  trend: 'up' | 'down' | 'stable';
}) {
  const pct = (value / max) * 100;
  const statusLabel = getStatusLabel(value, type);
  const statusColor = getStatusColor(value, type);

  // Solid status color
  const statusHexColor = statusColor === 'emerald' ? '#10b981' :
                         statusColor === 'amber' ? '#f59e0b' :
                         statusColor === 'orange' ? '#f97316' :
                         '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1 border-l-[3px] pl-2 rounded-sm" style={{ borderColor: statusHexColor }}>
      <div className="flex items-center gap-1 text-[#8b949e]">
        {icon}
        <span className="text-[10px]">{label}</span>
        {/* Trend arrow */}
        {trend === 'up' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
          </motion.div>
        )}
        {trend === 'down' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="h-2.5 w-2.5 text-red-400" />
          </motion.div>
        )}
      </div>
      {/* Color-coded segmented bar */}
      <div className="w-full h-2 bg-[#21262d] rounded-full overflow-hidden relative">
        {/* Zone indicators (background) */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-red-900/30" style={{ width: '35%' }} />
          <div className="h-full bg-amber-900/20" style={{ width: '25%' }} />
          <div className="h-full bg-emerald-900/20" style={{ width: '40%' }} />
        </div>
        {/* Animated fill */}
        <motion.div
          className="h-full rounded-full relative z-10"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: statusHexColor,
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-semibold text-${statusColor}-400`}>{value}{max === 10 ? '/10' : ''}</span>
        <span className={`text-[8px] font-medium text-${statusColor}-400/70`}>{statusLabel}</span>
      </div>
    </div>
  );
}

// ==========================================
// Promotion Status Card Component
// ==========================================
function PromotionStatusCard({
  playerTeamLevel,
  playerAge,
  playerOverall,
  onPromoteU21,
  onPromoteSenior,
}: {
  playerTeamLevel: PlayerTeamLevel;
  playerAge: number;
  playerOverall: number;
  onPromoteU21: () => void;
  onPromoteSenior: () => void;
}) {
  // Determine promotion criteria and eligibility
  const isU18 = playerTeamLevel === 'u18';
  const isU21 = playerTeamLevel === 'u21';

  // U18 → U21: Age 18+ or OVR 60+
  const canPromoteToU21 = isU18 && (playerAge >= 18 || playerOverall >= 60);
  // U21 → Senior: Age 21+ or OVR 70+
  const canPromoteToSenior = (isU18 || isU21) && (playerAge >= 21 || playerOverall >= 70);

  const currentLabel = isU18 ? 'U18 Academy' : isU21 ? 'U21 Reserve' : 'Senior';
  const nextLabel = isU18 ? 'U21 Reserve' : 'Senior';
  const ageReq = isU18 ? 18 : 21;
  const ovrReq = isU18 ? 60 : 70;

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#21262d] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-[#8b949e]">Team Level</p>
            <p className="text-sm font-semibold text-[#c9d1d9]">{currentLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#8b949e] mb-3">
          <span className="text-[#c9d1d9] font-medium">{currentLabel}</span>
          <ArrowRight className="h-3 w-3" />
          <span className="text-emerald-400 font-medium">{nextLabel}</span>
          <span className="text-[#484f58]">(Need: Age {ageReq}+ or OVR {ovrReq}+)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px]">
            <span className={`font-semibold ${playerAge >= ageReq ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
              Age: {playerAge} {playerAge >= ageReq ? '✓' : `(${ageReq} needed)`}
            </span>
            <span className={`font-semibold ${playerOverall >= ovrReq ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
              OVR: {playerOverall} {playerOverall >= ovrReq ? '✓' : `(${ovrReq} needed)`}
            </span>
          </div>
          {canPromoteToU21 && (
            <Button
              onClick={onPromoteU21}
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
            >
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Promote
            </Button>
          )}
          {canPromoteToSenior && isU21 && (
            <Button
              onClick={onPromoteSenior}
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
            >
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Promote
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Quick Action Button Component
// ==========================================
function QuickActionButton({
  icon, label, description, onClick, accentColor
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  accentColor: 'emerald' | 'amber' | 'cyan' | 'purple';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-950/20 text-emerald-400 group-hover:bg-emerald-900/30',
    amber: 'bg-amber-950/20 text-amber-400 group-hover:bg-amber-900/30',
    cyan: 'bg-cyan-950/20 text-cyan-400 group-hover:bg-cyan-900/30',
    purple: 'bg-purple-950/20 text-purple-400 group-hover:bg-purple-900/30',
  };

  const borderClasses = {
    emerald: 'border-[#30363d] hover:border-emerald-600/50',
    amber: 'border-[#30363d] hover:border-amber-600/50',
    cyan: 'border-[#30363d] hover:border-cyan-600/50',
    purple: 'border-[#30363d] hover:border-purple-600/50',
  };

  const iconBgClasses = {
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    cyan: 'bg-cyan-500/10',
    purple: 'bg-purple-500/10',
  };

  const accentBorderClasses = {
    emerald: 'border-l-[3px] border-l-emerald-500',
    amber: 'border-l-[3px] border-l-amber-500',
    cyan: 'border-l-[3px] border-l-cyan-500',
    purple: 'border-l-[3px] border-l-purple-500',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`group flex items-start gap-2.5 p-3 rounded-lg border ${colorClasses[accentColor]} ${borderClasses[accentColor]} ${accentBorderClasses[accentColor]} transition-all duration-150`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconBgClasses[accentColor]}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold text-[#c9d1d9]">{label}</span>
        <span className="text-[7px] text-[#8b949e] leading-tight">{description}</span>
      </div>
    </motion.button>
  );
}

// ==========================================
// Position Icon Component - field position indicator
// ==========================================
function PositionIcon({ position, size = 10 }: { position: string; size?: number }) {
  const category = getPositionCategory(position);
  // SVG mini field position indicator
  const positions: Record<string, { x: number; y: number }> = {
    'GK': { x: 50, y: 90 },
    'CB': { x: 50, y: 72 },
    'LB': { x: 20, y: 72 },
    'RB': { x: 80, y: 72 },
    'CDM': { x: 50, y: 55 },
    'CM': { x: 50, y: 45 },
    'CAM': { x: 50, y: 35 },
    'LM': { x: 20, y: 45 },
    'RM': { x: 80, y: 45 },
    'LW': { x: 20, y: 20 },
    'RW': { x: 80, y: 20 },
    'ST': { x: 50, y: 15 },
    'CF': { x: 50, y: 20 },
  };
  const pos = positions[position] ?? { x: 50, y: 50 };
  const colorMap: Record<string, string> = {
    goalkeeping: '#F59E0B',
    defence: '#3B82F6',
    midfield: '#22C55E',
    attack: '#EF4444',
  };
  const color = colorMap[category] ?? '#8b949e';

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" className="inline-block">
      {/* Mini field outline */}
      <rect x="5" y="5" width="90" height="120" fill="none" stroke="#30363d" strokeWidth="4" rx="2" />
      <line x1="5" y1="65" x2="95" y2="65" stroke="#30363d" strokeWidth="2" />
      <circle cx="50" cy="65" r="12" fill="none" stroke="#30363d" strokeWidth="2" />
      {/* Position dot */}
      <circle cx={pos.x} cy={pos.y} r="7" fill={color} opacity="0.9" />
    </svg>
  );
}

// ==========================================
// Formation Dots Visualization Component
// ==========================================
function FormationDots({ formation, color, flip = false }: { formation: string; color: string; flip?: boolean }) {
  // Parse formation like "4-3-3" into rows of players
  const rows = formation.split('-').map(Number);

  // Build positions for each player
  const positions: { x: number; y: number }[] = [];
  // GK
  positions.push({ x: 50, y: flip ? 10 : 90 });
  // Field players
  let currentY = flip ? 25 : 75;
  const yStep = flip ? 18 : -18;
  for (const count of rows) {
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 50 : (20 + (i * 60 / (count - 1)));
      positions.push({ x, y: currentY });
    }
    currentY += yStep;
  }

  return (
    <div className="flex flex-col items-center">
      <svg width="60" height="80" viewBox="0 0 100 100">
        {/* Mini pitch outline */}
        <rect x="5" y="2" width="90" height="96" fill="none" stroke="#30363d" strokeWidth="2" rx="1" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="#30363d" strokeWidth="1" opacity="0.5" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="#30363d" strokeWidth="1" opacity="0.5" />
        {/* Player dots */}
        {positions.map((pos, i) => (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r="5"
            fill={color}
            opacity={i === 0 ? 0.7 : 0.9}
          />
        ))}
      </svg>
      <span className="text-[8px] text-[#484f58] mt-0.5">{formation}</span>
    </div>
  );
}

// ==========================================
// Sparkline Chart Component
// ==========================================
function SparklineChart({ data, color, width = 120, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minVal) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });
  const pointsStr = pts.join(' ');
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - minVal) / range) * (height - 6) - 3;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polygon
        points={`0,${height} ${pointsStr} ${width},${height}`}
        fill={color + '12'}
      />
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}

// ==========================================
// Attribute Radar Mini-Chart Component
// ==========================================
function AttributeRadarChart({ attributes }: { attributes: PlayerAttributes }) {
  const attrKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
  const values = attrKeys.map(k => Math.min(99, Math.max(1, attributes[k] ?? 50)));
  const n = values.length;
  const cx = 40, cy = 40, r = 30;
  const angleStep = (2 * Math.PI) / n;
  const computePoints = (radius: number) => {
    return Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');
  };
  const dataPoints = values.map((v, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const rv = (v / 99) * r;
    return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`;
  }).join(' ');

  return (
    <motion.svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {[0.33, 0.66, 1].map(scale => (
        <polygon key={scale} points={computePoints(r * scale)} fill="none" stroke="#30363d" strokeWidth="0.5" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#30363d" strokeWidth="0.5" />
        );
      })}
      <polygon points={dataPoints} fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1" />
      {values.map((v, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const rv = (v / 99) * r;
        return (
          <circle key={i} cx={cx + rv * Math.cos(angle)} cy={cy + rv * Math.sin(angle)} r={1.5} fill="#10b981" />
        );
      })}
    </motion.svg>
  );
}
