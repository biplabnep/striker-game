'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency, getOverallColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Calendar, TrendingUp, Award, Shield, Star,
  ChevronRight, Zap, Flame, Crown, FileText, Clock, Lock,
  BarChart3, Activity, Medal, CircleDollarSign, AlertTriangle,
  CheckCircle2, Circle, Gem, Sparkles
} from 'lucide-react';

// -----------------------------------------------------------
// Animated Number Counter
// -----------------------------------------------------------
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <>{display}</>;
}

// -----------------------------------------------------------
// Rarity config
// -----------------------------------------------------------
const RARITY_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; label: string }> = {
  common: { color: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700/60', glow: '', label: 'Common' },
  rare: { color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/50', glow: 'shadow-blue-500/20', label: 'Rare' },
  epic: { color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/50', glow: 'shadow-purple-500/20', label: 'Epic' },
  legendary: { color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/50', glow: 'shadow-amber-500/20', label: 'Legendary' },
};

// -----------------------------------------------------------
// Category config
// -----------------------------------------------------------
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'All', icon: <Sparkles className="h-3 w-3" />, color: 'text-slate-400' },
  career: { label: 'Career', icon: <Calendar className="h-3 w-3" />, color: 'text-emerald-400' },
  match: { label: 'Match', icon: <Target className="h-3 w-3" />, color: 'text-red-400' },
  training: { label: 'Training', icon: <Activity className="h-3 w-3" />, color: 'text-blue-400' },
  transfer: { label: 'Transfer', icon: <CircleDollarSign className="h-3 w-3" />, color: 'text-amber-400' },
  social: { label: 'Social', icon: <Zap className="h-3 w-3" />, color: 'text-purple-400' },
};

// -----------------------------------------------------------
// League position color
// -----------------------------------------------------------
function getPositionColor(pos: number): string {
  if (pos === 1) return '#FFD700'; // gold
  if (pos <= 4) return '#10B981'; // emerald
  if (pos <= 6) return '#06B6D4'; // cyan
  return '#64748B'; // slate
}

function getPositionBg(pos: number): string {
  if (pos === 1) return 'bg-amber-500/20 text-amber-300';
  if (pos <= 4) return 'bg-emerald-500/20 text-emerald-300';
  if (pos <= 6) return 'bg-cyan-500/20 text-cyan-300';
  return 'bg-slate-700/50 text-slate-400';
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// -----------------------------------------------------------
// Contract status
// -----------------------------------------------------------
function getContractStatus(yearsRemaining: number): { label: string; color: string; icon: React.ReactNode } {
  if (yearsRemaining <= 0) return { label: 'Expired', color: 'text-red-400', icon: <AlertTriangle className="h-4 w-4 text-red-400" /> };
  if (yearsRemaining === 1) return { label: 'Expiring Soon', color: 'text-amber-400', icon: <Clock className="h-4 w-4 text-amber-400" /> };
  return { label: 'Secure', color: 'text-emerald-400', icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> };
}

// ============================================================
// Main CareerHub Component
// ============================================================
export default function CareerHub() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const [achievementFilter, setAchievementFilter] = useState('all');

  // Computed values
  const seasons = useMemo(() => gameState?.seasons ?? [], [gameState]);
  const achievements = useMemo(() => gameState?.achievements ?? [], [gameState]);
  const player = useMemo(() => gameState?.player, [gameState]);
  const currentClub = useMemo(() => gameState?.currentClub, [gameState]);
  const careerStats = useMemo(() => player?.careerStats, [player]);

  const filteredAchievements = useMemo(() => {
    if (achievementFilter === 'all') return achievements;
    return achievements.filter(a => a.category === achievementFilter);
  }, [achievements, achievementFilter]);

  const unlockedCount = useMemo(() => achievements.filter(a => a.unlocked).length, [achievements]);

  // Records computed from season history
  const records = useMemo(() => {
    if (seasons.length === 0) return null;
    let mostGoals = { value: 0, season: 0 };
    let bestRating = { value: 0, season: 0 };
    let mostAssists = { value: 0, season: 0 };
    let mostApps = { value: 0, season: 0 };
    let bestLeaguePos = { value: 99, season: 0 };

    for (const s of seasons) {
      if (s.playerStats.goals > mostGoals.value) mostGoals = { value: s.playerStats.goals, season: s.number };
      if (s.playerStats.averageRating > bestRating.value) bestRating = { value: s.playerStats.averageRating, season: s.number };
      if (s.playerStats.assists > mostAssists.value) mostAssists = { value: s.playerStats.assists, season: s.number };
      if (s.playerStats.appearances > mostApps.value) mostApps = { value: s.playerStats.appearances, season: s.number };
      if (s.leaguePosition < bestLeaguePos.value) bestLeaguePos = { value: s.leaguePosition, season: s.number };
    }

    return { mostGoals, bestRating, mostAssists, mostApps, bestLeaguePos };
  }, [seasons]);

  if (!gameState || !player || !currentClub || !careerStats) return null;

  const { currentSeason } = gameState;
  const contract = player.contract;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">

      {/* =========================================
          HERO SECTION - Player Overview
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

          <CardContent className="relative p-5">
            <div className="flex items-center gap-4 mb-5">
              {/* Overall Badge */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="relative"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 backdrop-blur-sm"
                  style={{
                    borderColor: getOverallColor(player.overall),
                    color: getOverallColor(player.overall),
                    background: `linear-gradient(135deg, ${getOverallColor(player.overall)}15, ${getOverallColor(player.overall)}05)`,
                  }}
                >
                  {player.overall}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-md px-1 py-0.5 text-[8px] text-slate-400">
                  OVR
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-white truncate">{player.name}</h3>
                <p className="text-sm text-slate-400">{player.nationality} · {player.position}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{currentClub.logo}</span>
                  <span className="text-xs text-slate-300 truncate">{currentClub.name}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500">Age {player.age}</span>
                </div>
              </div>

              {/* Potential Arrow */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <TrendingUp className="h-3 w-3 text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-emerald-400">{player.potential}</span>
                <span className="text-[8px] text-slate-500">POT</span>
              </motion.div>
            </div>

            {/* Animated Stat Counters */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Goals', value: careerStats.totalGoals, color: 'text-emerald-400' },
                { label: 'Assists', value: careerStats.totalAssists, color: 'text-blue-400' },
                { label: 'Apps', value: careerStats.totalAppearances, color: 'text-amber-400' },
                { label: 'Seasons', value: careerStats.seasonsPlayed, color: 'text-slate-300' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-center bg-slate-800/40 backdrop-blur-sm rounded-lg p-2 border border-slate-700/30"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          CONTRACT INFORMATION CARD
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800/60 overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <FileText className="h-3 w-3" /> Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {/* Club & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentClub.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{currentClub.name}</p>
                    <p className="text-[10px] text-slate-500">{currentClub.league}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {getContractStatus(contract.yearsRemaining).icon}
                  <span className={`text-xs font-medium ${getContractStatus(contract.yearsRemaining).color}`}>
                    {getContractStatus(contract.yearsRemaining).label}
                  </span>
                </div>
              </div>

              {/* Contract Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-500 mb-0.5">Weekly Wage</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(contract.weeklyWage, 'K')}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-500 mb-0.5">Years Remaining</p>
                  <p className={`text-sm font-bold ${contract.yearsRemaining <= 1 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {contract.yearsRemaining} {contract.yearsRemaining === 1 ? 'year' : 'years'}
                  </p>
                </div>
                {contract.releaseClause != null && contract.releaseClause > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-0.5">Release Clause</p>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(contract.releaseClause, 'M')}</p>
                  </div>
                )}
                {contract.signingBonus != null && contract.signingBonus > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-0.5">Signing Bonus</p>
                    <p className="text-sm font-bold text-blue-400">{formatCurrency(contract.signingBonus, 'M')}</p>
                  </div>
                )}
              </div>

              {/* Performance Bonuses */}
              {contract.performanceBonuses && Object.keys(contract.performanceBonuses).some(
                k => contract.performanceBonuses![k as keyof typeof contract.performanceBonuses] != null &&
                     contract.performanceBonuses![k as keyof typeof contract.performanceBonuses]! > 0
              ) && (
                <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 uppercase mb-1.5">Performance Bonuses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {contract.performanceBonuses.goalsBonus != null && contract.performanceBonuses.goalsBonus > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-950/30 border-emerald-800/40 text-emerald-400">
                        <Target className="h-2.5 w-2.5 mr-1" /> Goals: {formatCurrency(contract.performanceBonuses.goalsBonus, 'K')}
                      </Badge>
                    )}
                    {contract.performanceBonuses.assistBonus != null && contract.performanceBonuses.assistBonus > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-blue-950/30 border-blue-800/40 text-blue-400">
                        <Zap className="h-2.5 w-2.5 mr-1" /> Assists: {formatCurrency(contract.performanceBonuses.assistBonus, 'K')}
                      </Badge>
                    )}
                    {contract.performanceBonuses.cleanSheetBonus != null && contract.performanceBonuses.cleanSheetBonus > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-purple-950/30 border-purple-800/40 text-purple-400">
                        <Shield className="h-2.5 w-2.5 mr-1" /> Clean Sheets: {formatCurrency(contract.performanceBonuses.cleanSheetBonus, 'K')}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Contract Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500">Contract Duration</span>
                  <span className="text-[10px] text-slate-400">{contract.yearsRemaining} yr(s) left</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, (contract.yearsRemaining / 5) * 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${
                      contract.yearsRemaining <= 1 ? 'bg-gradient-to-r from-red-500 to-amber-500' :
                      contract.yearsRemaining <= 2 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          CAREER TIMELINE
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Career Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {seasons.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No completed seasons yet</p>
                <p className="text-xs text-slate-700">Your career timeline will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-600/40 via-slate-700/40 to-slate-800/20" />

                <div className="space-y-0">
                  {seasons.map((s, i) => {
                    const posColor = getPositionColor(s.leaguePosition);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="relative flex items-start gap-3 pb-4 last:pb-0"
                      >
                        {/* Timeline Node */}
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          <div
                            className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center"
                            style={{
                              borderColor: posColor,
                              background: s.leaguePosition === 1 ? `${posColor}30` : 'rgba(15,23,42,0.8)',
                            }}
                          >
                            {s.leaguePosition === 1 ? (
                              <Crown className="h-2 w-2" style={{ color: posColor }} />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: posColor }} />
                            )}
                          </div>
                        </div>

                        {/* Season Card */}
                        <div className="flex-1 bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200">S{s.number}</span>
                              <span className="text-[10px] text-slate-500">{s.year}</span>
                            </div>
                            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${getPositionBg(s.leaguePosition)}`}>
                              {getOrdinal(s.leaguePosition)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Target className="h-2.5 w-2.5 text-emerald-500" /> {s.playerStats.goals}G
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5 text-blue-500" /> {s.playerStats.assists}A
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Activity className="h-2.5 w-2.5 text-amber-500" /> {s.playerStats.averageRating > 0 ? s.playerStats.averageRating.toFixed(1) : '-'}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" /> {s.playerStats.appearances} apps
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          CAREER STATS DEEP DIVE
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <BarChart3 className="h-3 w-3" /> Stats Deep Dive
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-4">
            {/* Goals Per Season Bar Chart */}
            {seasons.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-2">Goals Per Season</p>
                <div className="flex items-end gap-1.5 h-20">
                  {seasons.map((s, i) => {
                    const maxGoals = Math.max(...seasons.map(ss => ss.playerStats.goals), 1);
                    const heightPct = (s.playerStats.goals / maxGoals) * 100;
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                      >
                        <span className="text-[9px] text-slate-400 mb-0.5">{s.playerStats.goals}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(4, heightPct)}%` }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease: 'easeOut' }}
                          className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px]"
                        />
                        <span className="text-[8px] text-slate-600 mt-0.5">S{s.number}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rating Progression Sparkline */}
            {seasons.length > 1 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-2">Rating Progression</p>
                <div className="h-12 relative">
                  <svg viewBox="0 0 300 50" className="w-full h-full" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((y, idx) => (
                      <line key={idx} x1="0" y1={y * 50} x2="300" y2={y * 50} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                    ))}

                    {/* Rating line */}
                    {(() => {
                      const ratings = seasons.map(s => s.playerStats.averageRating || 0).filter(r => r > 0);
                      if (ratings.length < 2) return null;
                      const minR = Math.min(...ratings) - 0.5;
                      const maxR = Math.max(...ratings) + 0.5;
                      const range = maxR - minR || 1;
                      const points = ratings.map((r, i) => {
                        const x = (i / (ratings.length - 1)) * 280 + 10;
                        const y = 45 - ((r - minR) / range) * 40;
                        return `${x},${y}`;
                      }).join(' ');

                      // Fill area
                      const fillPoints = `10,45 ${points} ${(ratings.length - 1) / (ratings.length - 1) * 280 + 10},45`;

                      return (
                        <g>
                          <motion.path
                            d={`M ${fillPoints} Z`}
                            fill="url(#ratingGrad)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            transition={{ duration: 1, delay: 0.6 }}
                          />
                          <motion.polyline
                            points={points}
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.6 }}
                          />
                          {/* Dots */}
                          {ratings.map((r, i) => {
                            const x = (i / (ratings.length - 1)) * 280 + 10;
                            const y = 45 - ((r - minR) / range) * 40;
                            return (
                              <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2.5"
                                fill="#0F172A"
                                stroke="#10B981"
                                strokeWidth="1.5"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1 + i * 0.1 }}
                              />
                            );
                          })}
                          <defs>
                            <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </g>
                      );
                    })()}
                  </svg>
                  {/* Season labels */}
                  <div className="flex justify-between mt-0.5 px-1">
                    {seasons.filter(s => s.playerStats.averageRating > 0).map((s, i) => (
                      <span key={i} className="text-[8px] text-slate-600">S{s.number}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trophy Cabinet */}
            {careerStats.trophies.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-2">Trophy Cabinet</p>
                <div className="flex flex-wrap gap-2">
                  {careerStats.trophies.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                      className="flex items-center gap-1.5 bg-amber-950/30 border border-amber-800/40 rounded-lg px-2.5 py-1.5"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <div>
                        <p className="text-[11px] font-semibold text-amber-300">{t.name}</p>
                        <p className="text-[9px] text-amber-500/60">Season {t.season}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Records */}
            {records && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-2">Career Records</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: <Target className="h-3 w-3 text-emerald-400" />, label: 'Most Goals', value: records.mostGoals.value, season: records.mostGoals.season, color: 'text-emerald-400' },
                    { icon: <Zap className="h-3 w-3 text-blue-400" />, label: 'Most Assists', value: records.mostAssists.value, season: records.mostAssists.season, color: 'text-blue-400' },
                    { icon: <Star className="h-3 w-3 text-amber-400" />, label: 'Best Rating', value: records.bestRating.value > 0 ? records.bestRating.value.toFixed(1) : '-', season: records.bestRating.season, color: 'text-amber-400' },
                    { icon: <Calendar className="h-3 w-3 text-slate-400" />, label: 'Most Apps', value: records.mostApps.value, season: records.mostApps.season, color: 'text-slate-300' },
                  ].map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {rec.icon}
                        <span className="text-[9px] text-slate-500">{rec.label}</span>
                      </div>
                      <p className={`text-sm font-bold ${rec.color}`}>{rec.value}</p>
                      <p className="text-[8px] text-slate-600">Season {rec.season}</p>
                    </motion.div>
                  ))}
                </div>
                {/* Best League Position */}
                {records.bestLeaguePos.value < 99 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-1.5 bg-slate-800/40 rounded-lg p-2 border border-slate-700/30 flex items-center gap-2"
                  >
                    <Medal className="h-4 w-4" style={{ color: getPositionColor(records.bestLeaguePos.value) }} />
                    <div>
                      <p className="text-[9px] text-slate-500">Best League Finish</p>
                      <p className="text-sm font-bold" style={{ color: getPositionColor(records.bestLeaguePos.value) }}>
                        {getOrdinal(records.bestLeaguePos.value)}
                      </p>
                    </div>
                    <span className="ml-auto text-[9px] text-slate-600">Season {records.bestLeaguePos.season}</span>
                  </motion.div>
                )}
              </div>
            )}

            {seasons.length === 0 && (
              <div className="text-center py-4">
                <BarChart3 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Complete a season to unlock deep stats</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          ENHANCED ACHIEVEMENTS
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
                <Award className="h-3 w-3" /> Achievements
              </CardTitle>
              <span className="text-[10px] text-slate-500">
                <span className="text-emerald-400 font-semibold">{unlockedCount}</span> / {achievements.length}
              </span>
            </div>
            {/* Achievement Progress Bar */}
            <div className="mt-2">
              <Progress
                value={achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}
                className="h-1.5 bg-slate-800"
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {/* Category Filter Tabs */}
            <Tabs value={achievementFilter} onValueChange={setAchievementFilter} className="w-full">
              <TabsList className="w-full h-7 bg-slate-800/60 p-0.5 mb-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="h-6 text-[10px] px-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                  >
                    <span className="mr-0.5">{config.icon}</span>
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={achievementFilter} className="mt-0">
                <div className="grid grid-cols-1 gap-2">
                  <AnimatePresence mode="popLayout">
                    {filteredAchievements.map((a, i) => {
                      const rarity = RARITY_CONFIG[a.rarity] || RARITY_CONFIG.common;
                      return (
                        <motion.div
                          key={a.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                          className={`relative flex items-center gap-3 p-2.5 rounded-lg border ${
                            a.unlocked
                              ? `${rarity.bg} ${rarity.border} ${rarity.glow ? `shadow-lg ${rarity.glow}` : ''}`
                              : 'bg-slate-800/30 border-slate-800/50'
                          } transition-all hover:scale-[1.01]`}
                        >
                          {/* Glow effect for unlocked */}
                          {a.unlocked && a.rarity === 'legendary' && (
                            <motion.div
                              className="absolute inset-0 rounded-lg"
                              animate={{
                                boxShadow: [
                                  '0 0 0px rgba(245,158,11,0)',
                                  '0 0 12px rgba(245,158,11,0.3)',
                                  '0 0 0px rgba(245,158,11,0)',
                                ],
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          {a.unlocked && a.rarity === 'epic' && (
                            <motion.div
                              className="absolute inset-0 rounded-lg"
                              animate={{
                                boxShadow: [
                                  '0 0 0px rgba(168,85,247,0)',
                                  '0 0 8px rgba(168,85,247,0.25)',
                                  '0 0 0px rgba(168,85,247,0)',
                                ],
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}

                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                            a.unlocked ? 'bg-slate-800/60' : 'bg-slate-800/30'
                          }`}>
                            {a.unlocked ? a.icon : <Lock className="h-4 w-4 text-slate-600" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-xs font-semibold truncate ${a.unlocked ? rarity.color : 'text-slate-600'}`}>
                                {a.name}
                              </p>
                              {/* Rarity Badge */}
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 ${rarity.bg} ${rarity.color} border-0`}>
                                {a.rarity === 'legendary' && <Gem className="h-2 w-2 mr-0.5" />}
                                {rarity.label}
                              </Badge>
                            </div>
                            <p className={`text-[10px] truncate ${a.unlocked ? 'text-slate-400' : 'text-slate-700'}`}>
                              {a.description}
                            </p>
                            {/* Unlocked Season */}
                            {a.unlocked && a.unlockedSeason != null && (
                              <p className="text-[9px] text-slate-600 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                Unlocked in Season {a.unlockedSeason}
                              </p>
                            )}
                          </div>

                          {/* Unlocked indicator */}
                          {a.unlocked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.2 }}
                            >
                              <Sparkles className={`h-4 w-4 ${rarity.color}`} />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-4">
                    <Award className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No achievements in this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          CURRENT SEASON SNAPSHOT
          ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <Flame className="h-3 w-3" /> Current Season · S{currentSeason}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-emerald-400">{player.seasonStats.goals}</p>
                <p className="text-[9px] text-slate-500">Goals</p>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-blue-400">{player.seasonStats.assists}</p>
                <p className="text-[9px] text-slate-500">Assists</p>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-amber-400">
                  {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}
                </p>
                <p className="text-[9px] text-slate-500">Avg Rating</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-300">{player.seasonStats.appearances}</p>
                <p className="text-[8px] text-slate-600">Apps</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-300">{player.seasonStats.starts}</p>
                <p className="text-[8px] text-slate-600">Starts</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-yellow-500">{player.seasonStats.yellowCards}</p>
                <p className="text-[8px] text-slate-600">Yellows</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-red-400">{player.seasonStats.redCards}</p>
                <p className="text-[8px] text-slate-600">Reds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          ANALYTICS LINK
          ========================================= */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={() => setScreen('analytics')}
        className="w-full bg-slate-900/80 backdrop-blur-sm border border-slate-800/60 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 hover:border-emerald-800/40 transition-all group"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-200">View Full Analytics</span>
            <p className="text-[10px] text-slate-500">Radar charts, attributes & form breakdown</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
      </motion.button>
    </div>
  );
}
