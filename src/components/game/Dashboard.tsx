'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getOverallColor, getFormLabel, getMoraleLabel, formatCurrency, getSeasonWeekDescription, getMatchRatingLabel, getPositionColor } from '@/lib/game/gameUtils';
import { NATIONALITIES } from '@/lib/game/playerData';
import { getClubById, LEAGUES, getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, TrendingUp, TrendingDown, Zap, Heart, Activity, Trophy,
  ArrowRight, Bell, Star, Swords, Table, ChevronRight, Flame,
  ArrowUp, ArrowDown, Minus, Target, Goal, CircleDot, FileText, UserCircle,
  Dumbbell, BarChart3, Shield, MapPin, Clock, Users, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklySummary from '@/components/game/WeeklySummary';
import SeasonEndSummary from '@/components/game/SeasonEndSummary';
import ContractNegotiation from '@/components/game/ContractNegotiation';
import { PlayerAttributes, Achievement, SquadStatus, SeasonPlayerStats, LeagueStanding, MatchResult } from '@/lib/game/types';

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
  return 'text-slate-400';
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
          const diff = gameState.player.attributes[key] - prevAttrs[key];
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
    if (!gameState) return [];
    return gameState.recentResults
      .slice(0, 10)
      .map(r => r.playerRating)
      .reverse();
  }, [gameState]);

  // Streak calculations
  const streakInfo = useMemo(() => {
    if (!gameState || gameState.recentResults.length === 0) return null;

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

  if (!gameState) return null;

  const { player, currentClub, currentWeek, currentSeason, recentResults, upcomingFixtures, activeEvents, leagueTable, trainingAvailable, seasons } = gameState;
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

  // SVG progress ring calculations
  const ringRadius = 58;
  const ringStroke = 8;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (seasonProgress / 100) * ringCircumference;

  return (
    <>
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header with notification bell */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setScreen('settings')}
          className="relative p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Player Profile Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${currentClub.primaryColor}, transparent)` }} />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-4">
            {/* Overall Rating */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-2" style={{ borderColor: overallColor, color: overallColor }}>
                {player.overall}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">OVR</span>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{player.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{nationInfo?.flag}</span>
                <Badge variant="outline" className="text-xs font-bold" style={{ color: posColor, borderColor: posColor }}>{player.position}</Badge>
                <span className="text-xs">Age {player.age}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base">{currentClub.logo}</span>
                <span className="text-sm text-slate-300">{currentClub.name}</span>
                <Badge variant="outline" className="text-[10px] border-slate-600 capitalize">{player.squadStatus.replace('_', ' ')}</Badge>
              </div>
            </div>

            {/* Potential */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border border-slate-600 text-slate-400">
                {player.potential}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">POT</span>
            </div>
          </div>

          {/* Enhanced Player Status Indicators */}
          <div className="grid grid-cols-3 gap-3 mt-4">
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
          </div>

          {/* Player Form Trend Graph */}
          {formTrendData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Match Rating Trend</span>
                {formTrendData.length > 0 && (
                  <span className="text-[10px] text-slate-500">
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
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                        style={{ color }}
                      >
                        {rating.toFixed(1)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-slate-600">Oldest</span>
                <span className="text-[8px] text-slate-600">Recent</span>
              </div>
            </div>
          )}

          {/* Streak Indicator */}
          {streakInfo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className={`mt-3 px-3 py-2 rounded-lg flex items-center gap-2 border ${
                streakInfo.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                streakInfo.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                streakInfo.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
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

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-4 gap-2">
        <QuickActionButton
          icon={<Dumbbell className="h-4 w-4" />}
          label="Train"
          description="Improve skills"
          onClick={() => setScreen('training')}
          accentColor="emerald"
        />
        <QuickActionButton
          icon={<Swords className="h-4 w-4" />}
          label="Match"
          description="Play next"
          onClick={() => setScreen('match_day')}
          accentColor="amber"
        />
        <QuickActionButton
          icon={<BarChart3 className="h-4 w-4" />}
          label="Stats"
          description="Analytics"
          onClick={() => setScreen('analytics')}
          accentColor="blue"
        />
        <QuickActionButton
          icon={<UserCircle className="h-4 w-4" />}
          label="Profile"
          description="View details"
          onClick={() => setScreen('player_profile')}
          accentColor="purple"
        />
      </div>

      {/* Season Info Bar + Progress Ring */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140">
                {/* Background track */}
                <circle
                  cx="70" cy="70" r={ringRadius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={ringStroke}
                />
                {/* Progress arc */}
                <motion.circle
                  cx="70" cy="70" r={ringRadius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                {/* Week markers - show at key intervals */}
                {Array.from({ length: 9 }, (_, i) => Math.round((i / 8) * seasonMatchdays) || 1).map(week => {
                  const angle = ((week / seasonMatchdays) * 360 - 90) * (Math.PI / 180);
                  const markerRadius = ringRadius + 13;
                  const x = 70 + markerRadius * Math.cos(angle);
                  const y = 70 + markerRadius * Math.sin(angle);
                  const isCurrentWeek = week === currentWeek;
                  return (
                    <g key={week}>
                      {isCurrentWeek && (
                        <circle cx={x} cy={y} r="5" fill="#10b981" opacity="0.3">
                          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        cx={x} cy={y}
                        r={isCurrentWeek ? 3 : 1.5}
                        fill={isCurrentWeek ? '#10b981' : week <= currentWeek ? '#475569' : '#1e293b'}
                      />
                      {(week === 1 || week === Math.round(seasonMatchdays / 2) || week === seasonMatchdays) && (
                        <text
                          x={70 + (markerRadius + 9) * Math.cos(angle)}
                          y={70 + (markerRadius + 9) * Math.sin(angle)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={week <= currentWeek ? '#94a3b8' : '#334155'}
                          fontSize="7"
                          fontWeight={isCurrentWeek ? 'bold' : 'normal'}
                        >
                          {week}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-emerald-400">{seasonProgress}%</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Complete</span>
              </div>
            </div>

            {/* Season info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Season {currentSeason} &bull; Week {currentWeek}/{seasonMatchdays}</span>
              </div>
              <p className="text-[10px] text-slate-500">{getSeasonWeekDescription(currentWeek)}</p>
              {pendingEvents > 0 && (
                <Badge className="bg-amber-600 text-white text-[10px] px-1.5">
                  {pendingEvents} event{pendingEvents > 1 ? 's' : ''}
                </Badge>
              )}
              {/* Contract Expiring Alert */}
              {player.contract.yearsRemaining <= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border ${
                    player.contract.yearsRemaining <= 1
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
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
          </div>
        </CardContent>
      </Card>

      {/* League Table Quick Link Card */}
      <Card
        className="bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-colors"
        onClick={() => setScreen('league_table')}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                <Table className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League Table'}
                </p>
                <p className="text-sm font-semibold">
                  <span className="text-emerald-400">{leaguePos}{posSuffix}</span>
                  <span className="text-slate-400"> in the league</span>
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      {/* Match Day Countdown Card */}
      {nextOpponent && nextFixture && winProbability && (
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-emerald-900/30 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${currentClub.primaryColor}, ${nextOpponent.primaryColor})` }} />
          <CardHeader className="pb-2 pt-3 px-4 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Next Match</CardTitle>
              <div className="flex items-center gap-1.5">
                {/* Competition Badge */}
                <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                  {nextFixture.competition === 'league' ? '🏆 League' :
                   nextFixture.competition === 'cup' ? '🏆 Cup' :
                   nextFixture.competition === 'continental' ? '🌍 Continental' : '🤝 Friendly'}
                </Badge>
                {/* Home/Away Badge */}
                <Badge className={`text-[10px] font-bold ${
                  isHome ? 'bg-emerald-600/80 text-white' : 'bg-slate-600/80 text-white'
                }`}>
                  {isHome ? 'HOME' : 'AWAY'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 relative">
            {/* Team logos with pulsing VS */}
            <div className="flex items-center justify-between mb-4">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-3xl">
                  {isHome ? currentClub.logo : nextOpponent.logo}
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[80px] text-center">
                  {isHome ? currentClub.shortName : nextOpponent.shortName}
                </span>
                <span className="text-[9px] text-slate-500">{isHome ? currentClub.formation : nextOpponent.formation}</span>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center mx-2">
                <motion.div
                  className="text-lg font-black text-emerald-400/80"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  VS
                </motion.div>
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-600 to-transparent mt-1" />
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-3xl">
                  {isHome ? nextOpponent.logo : currentClub.logo}
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[80px] text-center">
                  {isHome ? nextOpponent.shortName : currentClub.shortName}
                </span>
                <span className="text-[9px] text-slate-500">{isHome ? nextOpponent.formation : currentClub.formation}</span>
              </div>
            </div>

            {/* Formation comparison mini */}
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">{isHome ? currentClub.tacticalStyle : nextOpponent.tacticalStyle}</span>
              </div>
              <MapPin className="h-3 w-3 text-slate-600" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">{isHome ? nextOpponent.tacticalStyle : currentClub.tacticalStyle}</span>
                <Shield className="h-3 w-3 text-slate-500" />
              </div>
            </div>

            {/* Win probability mini bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-semibold">{winProbability.win}%</span>
                <span className="text-slate-500">Win Probability</span>
                <span className="text-slate-400">{100 - winProbability.win - winProbability.draw}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
                <motion.div
                  className="bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${winProbability.win}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                />
                <motion.div
                  className="bg-slate-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${winProbability.draw}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                  className="bg-red-500/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - winProbability.win - winProbability.draw}%` }}
                  transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-slate-600">
                <span>Win</span>
                <span>Draw</span>
                <span>Loss</span>
              </div>
            </div>

            {/* Week info */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-slate-800/50">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] text-slate-500">Week {nextFixture.matchday} &bull; Season {nextFixture.season}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advance Week + Match Day Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleAdvanceWeek}
          className="h-14 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:shadow-emerald-800/40"
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
          className="h-14 border-amber-700/50 bg-gradient-to-r from-amber-900/20 to-amber-800/10 text-amber-300 hover:from-amber-900/30 hover:to-amber-800/20 font-semibold rounded-xl transition-all"
        >
          <Swords className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm leading-tight">Match Day</span>
            <span className="text-[9px] opacity-70 font-normal">Play next match</span>
          </div>
        </Button>
      </div>

      {/* Season Stats Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Season Stats</CardTitle>
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
              <p className="text-[10px] text-slate-500">Goals</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{player.seasonStats.assists}</p>
              <p className="text-[10px] text-slate-500">Assists</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{player.seasonStats.appearances}</p>
              <p className="text-[10px] text-slate-500">Apps</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-300">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</p>
              <p className="text-[10px] text-slate-500">Avg Rating</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">Market Value</span>
            <span className="text-sm font-semibold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">Weekly Wage</span>
            <span className="text-sm text-slate-300">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Comparison */}
      {statsComparison && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">vs Last Season</CardTitle>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
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
                    <span className="text-xs text-slate-400 w-20">{stat.label}</span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-xs text-slate-600">{prevVal}</span>
                      <span className="text-slate-700">&rarr;</span>
                      <span className={`text-sm font-bold ${
                        isPositive ? 'text-emerald-400' :
                        isNegative ? 'text-red-400' :
                        'text-slate-300'
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
                        <Minus className="h-2.5 w-2.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Recent Results */}
      {recentResults.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {recentResults.slice(0, 5).map((result, i) => {
              const resultType = getPlayerMatchResult(result);
              const opponentClub = result.homeClub.id === currentClub.id ? result.awayClub : result.homeClub;
              const playerScore = result.homeClub.id === currentClub.id ? result.homeScore : result.awayScore;
              const opponentScore = result.homeClub.id === currentClub.id ? result.awayScore : result.homeScore;

              // Background gradient based on result
              const bgGradient = resultType === 'W'
                ? 'from-emerald-950/30 to-slate-800/50 border-emerald-900/20'
                : resultType === 'D'
                ? 'from-amber-950/20 to-slate-800/50 border-amber-900/15'
                : 'from-red-950/20 to-slate-800/50 border-red-900/15';

              // Rating circle size
              const ratingColor = getRatingColor(result.playerRating);

              return (
                <motion.div
                  key={`${result.week}-${result.season}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className={`rounded-lg bg-gradient-to-r ${bgGradient} border p-2.5 hover:bg-slate-800/70 transition-colors relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Result badge + Opponent info + Quality */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge className={`text-[10px] px-1.5 font-bold shrink-0 ${
                        resultType === 'W' ? 'bg-emerald-600 text-white' :
                        resultType === 'D' ? 'bg-amber-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {resultType}
                      </Badge>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-300 truncate">
                            {opponentClub.shortName || opponentClub.name.slice(0, 3)}
                          </span>
                          {/* Opponent quality badge */}
                          <span className={`text-[8px] font-semibold ${getQualityColor(opponentClub.quality)}`}>
                            {getQualityLabel(opponentClub.quality)}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {playerScore}-{opponentScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <span>Wk {result.week}</span>
                          <span>&bull;</span>
                          <span>S{result.season}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Goals/Assists + Rating circle */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Goals/Assists indicators */}
                      <div className="flex items-center gap-1.5">
                        {result.playerGoals > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.06 + 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex items-center text-[10px] text-emerald-400 font-semibold"
                          >
                            <Goal className="h-3 w-3 mr-0.5" />
                            {result.playerGoals}
                          </motion.span>
                        )}
                        {result.playerAssists > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.06 + 0.3, type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex items-center text-[10px] text-blue-400 font-semibold"
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
          className="w-full h-12 border-amber-700 text-amber-300 hover:bg-amber-900/30 font-semibold rounded-xl"
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
          className="w-full h-10 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {trainingAvailable} Training Session{trainingAvailable > 1 ? 's' : ''} Available
        </Button>
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

  // Gradient colors based on status
  const gradientFrom = statusColor === 'emerald' ? '#047857' :
                       statusColor === 'amber' ? '#92400e' :
                       statusColor === 'orange' ? '#9a3412' :
                       '#991b1b';
  const gradientTo = statusColor === 'emerald' ? '#34d399' :
                     statusColor === 'amber' ? '#fbbf24' :
                     statusColor === 'orange' ? '#fb923c' :
                     '#f87171';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-slate-400">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        {/* Trend arrow */}
        {trend === 'up' && (
          <motion.div initial={{ y: 3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />
          </motion.div>
        )}
        {trend === 'down' && (
          <motion.div initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            <ArrowDown className="h-2.5 w-2.5 text-red-400" />
          </motion.div>
        )}
      </div>
      {/* Color-coded segmented bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
        {/* Zone indicators (background) */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-red-900/30" style={{ width: '35%' }} />
          <div className="h-full bg-amber-900/20" style={{ width: '25%' }} />
          <div className="h-full bg-emerald-900/20" style={{ width: '40%' }} />
        </div>
        {/* Animated gradient fill */}
        <motion.div
          className="h-full rounded-full relative z-10"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
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
// Quick Action Button Component
// ==========================================
function QuickActionButton({
  icon, label, description, onClick, accentColor
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  accentColor: 'emerald' | 'amber' | 'blue' | 'purple';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-900/30 text-emerald-400 group-hover:bg-emerald-800/40',
    amber: 'bg-amber-900/30 text-amber-400 group-hover:bg-amber-800/40',
    blue: 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-800/40',
    purple: 'bg-purple-900/30 text-purple-400 group-hover:bg-purple-800/40',
  };

  const borderClasses = {
    emerald: 'border-emerald-900/30 hover:border-emerald-700/40',
    amber: 'border-amber-900/30 hover:border-amber-700/40',
    blue: 'border-blue-900/30 hover:border-blue-700/40',
    purple: 'border-purple-900/30 hover:border-purple-700/40',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-slate-900/80 ${borderClasses[accentColor]} transition-colors`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${colorClasses[accentColor]}`}>
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-slate-200">{label}</span>
      <span className="text-[8px] text-slate-500 leading-tight text-center">{description}</span>
    </motion.button>
  );
}
