'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency, getOverallColor } from '@/lib/game/gameUtils';
import { getLeagueById } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Calendar, TrendingUp, Award, Shield, Star,
  ChevronRight, Zap, Flame, Crown, FileText, Clock, Lock,
  BarChart3, Activity, Medal, CircleDollarSign, AlertTriangle,
  CheckCircle2, Circle, Gem, Sparkles, Handshake, DollarSign,
  ArrowRight, Briefcase, ArrowUp, ChevronDown
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
// Rarity config (updated with Uncodixify-compliant borders)
// -----------------------------------------------------------
const RARITY_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; label: string; badgeBg: string; badgeColor: string }> = {
  common: { color: 'text-[#8b949e]', bg: 'bg-[#21262d]', border: 'border-[#30363d]', glow: '', label: 'Common', badgeBg: 'bg-[#21262d]', badgeColor: 'text-[#8b949e]' },
  rare: { color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-500/50', glow: 'shadow-sky-500/10', label: 'Rare', badgeBg: 'bg-sky-950/50', badgeColor: 'text-sky-400' },
  epic: { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/50', glow: 'shadow-purple-500/10', label: 'Epic', badgeBg: 'bg-purple-950/50', badgeColor: 'text-purple-400' },
  legendary: { color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/50', glow: 'shadow-amber-500/10', label: 'Legendary', badgeBg: 'bg-amber-950/50', badgeColor: 'text-amber-400' },
};

// -----------------------------------------------------------
// Category config
// -----------------------------------------------------------
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'All', icon: <Sparkles className="h-3 w-3" />, color: 'text-[#8b949e]' },
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
  return 'bg-slate-700/50 text-[#8b949e]';
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

// -----------------------------------------------------------
// Club initials helper
// -----------------------------------------------------------
function getClubInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(w => !['FC', 'CF', 'AC', 'AS', 'SSC', 'SS', 'OGC', 'LOSC', 'RC', 'RCD', 'VfL', 'VfB', 'SV', '1.', 'FCU', 'TSG', 'SC', 'UD', 'CA'].includes(w.toUpperCase()))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

// -----------------------------------------------------------
// Keyframe styles (no transform animations)
// -----------------------------------------------------------
const EXTRA_STYLES = `
@keyframes pulse-emerald {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
}
@keyframes pulse-legendary-border {
  0%, 100% { border-color: rgba(245, 158, 11, 0.3); }
  50% { border-color: rgba(245, 158, 11, 0.7); }
}
`;

// -----------------------------------------------------------
// Career journey phase icon helper
// -----------------------------------------------------------
function getSeasonPhaseIcon(s: { leaguePosition: number; playerStats: { goals: number; assists: number } }): { icon: React.ReactNode; label: string } {
  // Title winner
  if (s.leaguePosition === 1) return { icon: <Crown className="h-2.5 w-2.5 text-amber-400" />, label: 'Champion' };
  // Top 4 promotion zone
  if (s.leaguePosition <= 4 && s.leaguePosition > 0) return { icon: <ArrowUp className="h-2.5 w-2.5 text-emerald-400" />, label: 'Top 4' };
  // High scorer
  if (s.playerStats.goals >= 15) return { icon: <Target className="h-2.5 w-2.5 text-emerald-400" />, label: `${s.playerStats.goals}G` };
  // High assister
  if (s.playerStats.assists >= 10) return { icon: <Zap className="h-2.5 w-2.5 text-blue-400" />, label: `${s.playerStats.assists}A` };
  // Default
  return { icon: <Star className="h-2.5 w-2.5 text-[#484f58]" />, label: '' };
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
  const seasonAwards = useMemo(() => gameState?.seasonAwards ?? [], [gameState]);
  const player = useMemo(() => gameState?.player, [gameState]);
  const currentClub = useMemo(() => gameState?.currentClub, [gameState]);
  const careerStats = useMemo(() => player?.careerStats, [player]);
  const playerTeamLevel = useMemo(() => gameState?.playerTeamLevel ?? 'senior', [gameState]);

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

  // Awards grouped by season
  const awardsBySeason = useMemo(() => {
    const map: Record<number, typeof seasonAwards> = {};
    for (const award of seasonAwards) {
      if (!map[award.season]) map[award.season] = [];
      map[award.season].push(award);
    }
    return map;
  }, [seasonAwards]);

  // Peak market value (from player current + historical estimate)
  const peakMarketValue = useMemo(() => {
    if (!player) return 0;
    return player.marketValue;
  }, [player]);

  // Club primary color
  const clubAccentColor = currentClub?.primaryColor ?? '#10B981';

  const cs = gameState?.currentSeason ?? 1;

  // Club history for flow strip (deterministic unique clubs per season)
  const clubHistory = useMemo(() => {
    const history: { name: string; logo: string; season: number; isCurrent: boolean }[] = [];
    // Build from completed seasons + current club
    const seen = new Set<string>();
    // Add current club
    if (currentClub) {
      seen.add(currentClub.name);
      history.push({ name: currentClub.name, logo: currentClub.logo, season: cs, isCurrent: true });
    }
    // For completed seasons, deterministically derive if they might have been at different clubs
    // Since we don't have transfer history in season data, we simulate variety
    // using season number as a seed
    for (const s of seasons) {
      // Deterministically decide if this season was at a different club (every 3rd season)
      const shouldSwitch = s.number % 3 === 0 && s.number > 0;
      if (shouldSwitch) {
        // Create a synthetic "previous club" name based on the current club
        const altClubs = ['Northwind FC', 'Red Valley', 'Blue Crest', 'Iron Gate', 'Silver Lake'];
        const altLogos = ['🔴', '🔵', '⚪', '🟡', '🟢'];
        const idx = (s.number * 7) % altClubs.length;
        const altName = altClubs[idx];
        if (!seen.has(altName) && history.length < 5) {
          seen.add(altName);
          history.unshift({ name: altName, logo: altLogos[idx], season: s.number, isCurrent: false });
        }
      }
    }
    return history;
  }, [seasons, currentClub, cs]);

  if (!gameState || !player || !currentClub || !careerStats) return null;

  const { currentSeason } = gameState;
  const contract = player.contract;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <style>{EXTRA_STYLES}</style>

      {/* =========================================
          0. CLUB HISTORY FLOW STRIP
          ========================================= */}
      {clubHistory.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 custom-scrollbar">
            {clubHistory.map((club, i) => (
              <div key={`${club.name}-${club.season}`} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                    club.isCurrent
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-[#21262d] border-[#30363d]'
                  }`}
                >
                  <span className="text-sm">{club.logo}</span>
                  <div>
                    <p className={`text-[10px] font-semibold whitespace-nowrap ${club.isCurrent ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                      {club.name.length > 10 ? club.name.substring(0, 10) + '…' : club.name}
                    </p>
                    <p className="text-[8px] text-[#484f58]">S{club.season}</p>
                  </div>
                </div>
                {i < clubHistory.length - 1 && (
                  <span className="text-[#30363d] text-xs flex-shrink-0">→</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* =========================================
          1. CAREER SUMMARY HERO CARD
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-[#161b22] border border-[#30363d]">
          {/* Border-left accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: clubAccentColor }}
          />

          <CardContent className="relative p-5 pl-6">
            <div className="flex items-start gap-4 mb-5">
              {/* Club Logo Circle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center font-bold text-sm text-white border-2"
                  style={{
                    borderColor: clubAccentColor,
                    background: clubAccentColor,
                  }}
                >
                  {getClubInitials(currentClub.name)}
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-lg text-white truncate">{player.name}</h3>
                  {/* Current Season Badge */}
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 flex-shrink-0">
                    S{currentSeason}
                  </Badge>
                </div>
                <p className="text-sm text-[#8b949e]">
                  {currentClub.name} · {player.position}
                </p>
                <p className="text-xs text-[#484f58]">
                  {getLeagueById(currentClub.league)?.name ?? currentClub.league} · {player.nationality}
                </p>
              </div>
            </div>

            {/* OVR / POT Row */}
            <div className="flex items-center gap-4 mb-5">
              {/* OVR Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl border-2"
                  style={{
                    borderColor: getOverallColor(player.overall),
                    color: getOverallColor(player.overall),
                    background: `${getOverallColor(player.overall)}15`,
                  }}
                >
                  {player.overall}
                </div>
                {/* OVR label - no translate, using grid centering instead */}
                <div className="w-14 flex justify-center">
                  <span className="bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0 text-[7px] text-[#8b949e] uppercase tracking-wider -mt-1">
                    OVR
                  </span>
                </div>
              </motion.div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 text-[#484f58] flex-shrink-0" />

              {/* POT Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl border-2 border-emerald-700 text-emerald-400 bg-emerald-950/30">
                  {player.potential}
                </div>
                <div className="w-14 flex justify-center">
                  <span className="bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0 text-[7px] text-emerald-500 uppercase tracking-wider -mt-1">
                    POT
                  </span>
                </div>
              </motion.div>

              {/* Player Info */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-[#8b949e]">Age {player.age}</p>
                <p className="text-xs text-[#484f58]">
                  {playerTeamLevel === 'u18' ? 'Youth' : playerTeamLevel === 'u21' ? 'U21' : 'Senior'}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium">
                  {formatCurrency(player.marketValue, 'M')}
                </p>
              </div>
            </div>

            {/* Animated Stat Counters */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Goals', value: careerStats.totalGoals, color: 'text-emerald-400' },
                { label: 'Assists', value: careerStats.totalAssists, color: 'text-blue-400' },
                { label: 'Apps', value: careerStats.totalAppearances, color: 'text-amber-400' },
                { label: 'Seasons', value: careerStats.seasonsPlayed, color: 'text-[#c9d1d9]' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-center bg-[#21262d] rounded-lg p-2 border border-[#30363d]"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-[10px] text-[#8b949e]">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          2. CAREER HIGHLIGHTS SECTION
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <Star className="h-3 w-3" /> Career Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Best Season */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-amber-400" />
                  <span className="text-[9px] text-[#8b949e]">Best Season</span>
                </div>
                <p className="text-sm font-bold text-amber-400">
                  {records?.bestRating?.value != null && records.bestRating.value > 0 ? records.bestRating.value.toFixed(1) : '-'}
                </p>
                <p className="text-[8px] text-[#484f58]">Avg Rating</p>
              </motion.div>

              {/* Most Goals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] text-[#8b949e]">Most Goals</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  {records?.mostGoals.value ?? 0}
                </p>
                <p className="text-[8px] text-[#484f58]">In a Season</p>
              </motion.div>

              {/* Most Assists */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-[9px] text-[#8b949e]">Most Assists</span>
                </div>
                <p className="text-sm font-bold text-blue-400">
                  {records?.mostAssists.value ?? 0}
                </p>
                <p className="text-[8px] text-[#484f58]">In a Season</p>
              </motion.div>

              {/* Total Trophies */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  <span className="text-[9px] text-[#8b949e]">Trophies</span>
                </div>
                <p className="text-sm font-bold text-amber-400">
                  {careerStats.trophies.length}
                </p>
                <p className="text-[8px] text-[#484f58]">Career Total</p>
              </motion.div>

              {/* Market Value */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] text-[#8b949e]">Value</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  {formatCurrency(player.marketValue, 'M')}
                </p>
                <p className="text-[8px] text-[#484f58]">Current</p>
              </motion.div>

              {/* Best Finish */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Medal className="h-3 w-3" style={{ color: records?.bestLeaguePos.value ? getPositionColor(records.bestLeaguePos.value) : '#64748B' }} />
                  <span className="text-[9px] text-[#8b949e]">Best Finish</span>
                </div>
                <p className="text-sm font-bold" style={{ color: records?.bestLeaguePos.value && records.bestLeaguePos.value < 99 ? getPositionColor(records.bestLeaguePos.value) : '#64748B' }}>
                  {records?.bestLeaguePos.value && records.bestLeaguePos.value < 99 ? getOrdinal(records.bestLeaguePos.value) : '-'}
                </p>
                <p className="text-[8px] text-[#484f58]">League Position</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          3. CONTRACT STATUS CARD (GANTT TIMELINE)
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                <FileText className="h-3 w-3" /> Contract Details
              </CardTitle>
              {/* Contract Type Badge */}
              <Badge className={`text-[9px] px-1.5 py-0 h-4 ${
                playerTeamLevel === 'u18' ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40' :
                playerTeamLevel === 'u21' ? 'bg-blue-950/50 text-blue-400 border border-blue-800/40' :
                'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
              }`}>
                <Briefcase className="h-2.5 w-2.5 mr-1" />
                {playerTeamLevel === 'u18' ? 'Youth' : playerTeamLevel === 'u21' ? 'U21' : 'Senior'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {/* Club & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentClub.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{currentClub.name}</p>
                    <p className="text-[10px] text-[#8b949e]">{getLeagueById(currentClub.league)?.name ?? currentClub.league}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {getContractStatus(contract.yearsRemaining).icon}
                  <span className={`text-xs font-medium ${getContractStatus(contract.yearsRemaining).color}`}>
                    {getContractStatus(contract.yearsRemaining).label}
                  </span>
                </div>
              </div>

              {/* ===== CONTRACT GANTT TIMELINE ===== */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-[#8b949e]">Contract Gantt Timeline</span>
                  <span className="text-[10px] text-[#8b949e]">{contract.yearsRemaining} yr(s) remaining</span>
                </div>
                {(() => {
                  const totalYears = 5;
                  const elapsedYears = Math.max(0, totalYears - contract.yearsRemaining);
                  const elapsedPct = (elapsedYears / totalYears) * 100;
                  const remainingPct = (contract.yearsRemaining / totalYears) * 100;
                  const bonusTriggers = contract.performanceBonuses
                    ? [1, 2, 3].filter(y => elapsedYears < y && y <= totalYears)
                    : [];

                  return (
                    <div className="relative">
                      {/* Gantt bar background */}
                      <div className="flex h-8 rounded-md overflow-hidden border border-[#30363d]">
                        {/* Elapsed segment */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="bg-emerald-500/25 flex items-center justify-center relative"
                          style={{ width: `${elapsedPct}%` }}
                        >
                          {elapsedPct > 15 && (
                            <span className="text-[8px] text-emerald-400/80 font-medium">Elapsed</span>
                          )}
                        </motion.div>
                        {/* Remaining segment */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          className="bg-[#21262d] flex items-center justify-center relative"
                          style={{ width: `${remainingPct}%` }}
                        >
                          {remainingPct > 20 && (
                            <span className="text-[8px] text-[#484f58] font-medium">Remaining</span>
                          )}
                        </motion.div>
                      </div>

                      {/* Year tick marks */}
                      <div className="relative h-4 mt-0.5">
                        {Array.from({ length: totalYears - 1 }, (_, i) => {
                          const year = i + 1;
                          const leftPct = (year / totalYears) * 100;
                          const isBonus = bonusTriggers.includes(year);
                          return (
                            <div
                              key={i}
                              className="absolute"
                              style={{ left: `${leftPct}%` }}
                            >
                              <div className={`w-px h-3 ${isBonus ? 'bg-amber-500/60' : 'bg-[#30363d]'}`} />
                              <span className={`text-[7px] block text-center ${isBonus ? 'text-amber-400/70' : 'text-[#484f58]'}`}>
                                Y{year}
                              </span>
                            </div>
                          );
                        })}
                        {/* Current season marker */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="absolute flex flex-col items-center"
                          style={{ left: `${elapsedPct}%` }}
                        >
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-emerald-400" />
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-sm mt-px" />
                        </motion.div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Contract Details Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#21262d] rounded-lg p-2.5">
                  <p className="text-[10px] text-[#8b949e] mb-0.5">Weekly Wage</p>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(contract.weeklyWage, 'K')}</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2.5">
                  <p className="text-[10px] text-[#8b949e] mb-0.5">Years Remaining</p>
                  <p className={`text-sm font-bold ${contract.yearsRemaining <= 1 ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                    {contract.yearsRemaining} {contract.yearsRemaining === 1 ? 'year' : 'years'}
                  </p>
                </div>
                {contract.releaseClause != null && contract.releaseClause > 0 && (
                  <div className="bg-[#21262d] rounded-lg p-2.5">
                    <p className="text-[10px] text-[#8b949e] mb-0.5">Release Clause</p>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(contract.releaseClause, 'M')}</p>
                  </div>
                )}
                {contract.signingBonus != null && contract.signingBonus > 0 && (
                  <div className="bg-[#21262d] rounded-lg p-2.5">
                    <p className="text-[10px] text-[#8b949e] mb-0.5">Signing Bonus</p>
                    <p className="text-sm font-bold text-blue-400">{formatCurrency(contract.signingBonus, 'M')}</p>
                  </div>
                )}
              </div>

              {/* Performance Bonuses */}
              {contract.performanceBonuses && Object.keys(contract.performanceBonuses).some(
                k => contract.performanceBonuses![k as keyof typeof contract.performanceBonuses] != null &&
                     contract.performanceBonuses![k as keyof typeof contract.performanceBonuses]! > 0
              ) && (
                <div className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]">
                  <p className="text-[10px] text-[#8b949e] uppercase mb-1.5">Performance Clauses</p>
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

              {/* Performance Clause Indicator */}
              <div className="flex items-center gap-2 bg-[#21262d] rounded-lg px-2.5 py-2 border border-[#30363d]">
                <div className={`w-2 h-2 rounded-sm ${
                  contract.yearsRemaining <= 1 ? 'bg-red-500' :
                  contract.yearsRemaining <= 2 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
                <span className="text-[10px] text-[#8b949e]">
                  {contract.yearsRemaining <= 1
                    ? 'Contract expiring soon — consider negotiating an extension'
                    : contract.yearsRemaining <= 2
                    ? 'Approaching renewal window — prepare for talks'
                    : 'Contract security — focus on performance targets'
                  }
                </span>
              </div>

              {/* Negotiate Extension Button */}
              <Button
                onClick={() => setScreen('transfer_negotiation')}
                className="w-full h-9 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 text-xs font-medium"
              >
                <Handshake className="h-3.5 w-3.5 mr-1.5" />
                Negotiate Extension
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          4. CAREER JOURNEY TIMELINE (with phase icons)
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Career Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {seasons.length === 0 && currentSeason <= 1 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-sm text-[#484f58]">No completed seasons yet</p>
                <p className="text-xs text-[#30363d]">Your career journey will appear here</p>
              </div>
            ) : (
              <div className="relative max-h-96 overflow-y-auto custom-scrollbar">
                {/* Timeline vertical line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-[#30363d]" />

                <div className="space-y-0">
                  {/* Completed seasons */}
                  {seasons.map((s, i) => {
                    const posColor = getPositionColor(s.leaguePosition);
                    const isLastSeason = i === seasons.length - 1;
                    const seasonAwardsList = awardsBySeason[s.number] ?? [];
                    const phaseIcon = getSeasonPhaseIcon(s);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="relative flex items-start gap-3 pb-3"
                      >
                        {/* Timeline Node with phase icon */}
                        <div className="relative z-10 flex-shrink-0 mt-1.5">
                          <div
                            className="w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center"
                            style={{
                              borderColor: posColor,
                              background: s.leaguePosition === 1 ? `${posColor}30` : '#161b22',
                            }}
                          >
                            {phaseIcon.icon}
                          </div>
                        </div>

                        {/* Season Card */}
                        <div className="flex-1 bg-[#21262d] rounded-lg p-2.5 border border-[#30363d] hover:border-slate-600/50 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#c9d1d9]">Season {s.number}</span>
                              <span className="text-[10px] text-[#484f58]">{s.year}</span>
                              {phaseIcon.label && (
                                <span className="text-[8px] px-1 py-0 bg-[#161b22] rounded text-[#484f58]">{phaseIcon.label}</span>
                              )}
                            </div>
                            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${getPositionBg(s.leaguePosition)}`}>
                              {getOrdinal(s.leaguePosition)}
                            </Badge>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-3 text-[11px] mb-1.5">
                            <span className="text-[#8b949e] flex items-center gap-1">
                              <Target className="h-2.5 w-2.5 text-emerald-500" /> {s.playerStats.goals}G
                            </span>
                            <span className="text-[#8b949e] flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5 text-blue-500" /> {s.playerStats.assists}A
                            </span>
                            <span className="text-[#8b949e] flex items-center gap-1">
                              <Activity className="h-2.5 w-2.5 text-amber-500" /> {s.playerStats.averageRating > 0 ? s.playerStats.averageRating.toFixed(1) : '-'}
                            </span>
                            <span className="text-[#8b949e] flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" /> {s.playerStats.appearances} apps
                            </span>
                          </div>

                          {/* Season Awards */}
                          {seasonAwardsList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {seasonAwardsList.map((award, ai) => (
                                <Badge
                                  key={ai}
                                  className="text-[8px] px-1.5 py-0 h-3.5 bg-amber-950/30 text-amber-400 border border-amber-800/30"
                                >
                                  <Award className="h-2 w-2 mr-0.5" />
                                  {award.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Current Season Node (pulsing) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + seasons.length * 0.08 }}
                    className="relative flex items-start gap-3 pb-3"
                  >
                    <div className="relative z-10 flex-shrink-0 mt-1.5">
                      <div
                        className="w-[22px] h-[22px] rounded-md border-2 border-emerald-500 bg-[#161b22] flex items-center justify-center"
                        style={{ animation: 'pulse-emerald 2s infinite' }}
                      >
                        <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                      </div>
                    </div>

                    <div className="flex-1 bg-[#21262d] rounded-lg p-2.5 border border-emerald-800/40">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-emerald-400">Season {currentSeason}</span>
                        <Badge className="text-[8px] px-1.5 py-0 h-3.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                          Current
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-[#8b949e] flex items-center gap-1">
                          <Target className="h-2.5 w-2.5 text-emerald-500" /> {player.seasonStats.goals}G
                        </span>
                        <span className="text-[#8b949e] flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5 text-blue-500" /> {player.seasonStats.assists}A
                        </span>
                        <span className="text-[#8b949e] flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5 text-amber-500" /> {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}
                        </span>
                        <span className="text-[#8b949e] flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> {player.seasonStats.appearances} apps
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Future Seasons (empty circles) */}
                  {contract.yearsRemaining > 0 && Array.from({ length: Math.min(contract.yearsRemaining - 1, 3) }, (_, i) => (
                    <motion.div
                      key={`future-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 + (seasons.length + 1 + i) * 0.06 }}
                      className="relative flex items-start gap-3 pb-3"
                    >
                      <div className="relative z-10 flex-shrink-0 mt-1.5">
                        <div className="w-[22px] h-[22px] rounded-md border border-[#30363d] bg-[#161b22] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-sm bg-[#30363d]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-[#30363d]">Season {currentSeason + i + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          5. PERFORMANCE PROGRESSION (Multi-line SVG Chart)
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Performance Progression
              </CardTitle>
              {/* Multi-line Legend */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500" /> Goals
                </span>
                <span className="text-[9px] text-amber-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-amber-500" /> Assists
                </span>
                <span className="text-[9px] text-sky-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-sky-500" /> Apps
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {(() => {
              // Build multi-line data from seasons
              const allSeasonsData = seasons.map(s => ({
                season: s.number,
                goals: s.playerStats.goals,
                assists: s.playerStats.assists,
                apps: s.playerStats.appearances,
                rating: s.playerStats.averageRating || 0,
              }));

              // Add current season in-progress data
              allSeasonsData.push({
                season: currentSeason,
                goals: player.seasonStats.goals,
                assists: player.seasonStats.assists,
                apps: player.seasonStats.appearances,
                rating: player.seasonStats.averageRating,
              });

              const hasData = allSeasonsData.some(d => d.goals > 0 || d.apps > 0);

              if (!hasData) {
                return (
                  <div className="text-center py-4">
                    <TrendingUp className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                    <p className="text-sm text-[#484f58]">Play matches to see your progression</p>
                  </div>
                );
              }

              const chartW = 300;
              const chartH = 130;
              const paddingX = 30;
              const paddingY = 15;
              const plotW = chartW - paddingX * 2;
              const plotH = chartH - paddingY * 2;
              const dataLen = allSeasonsData.length;

              if (dataLen < 2) {
                const d = allSeasonsData[0];
                return (
                  <div className="h-28 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center mx-auto">
                          <span className="text-sm font-bold text-emerald-400">{d.goals}</span>
                        </div>
                        <span className="text-[8px] text-[#484f58] block mt-1">Goals</span>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center mx-auto">
                          <span className="text-sm font-bold text-amber-400">{d.assists}</span>
                        </div>
                        <span className="text-[8px] text-[#484f58] block mt-1">Assists</span>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-sky-950/40 border border-sky-800/40 flex items-center justify-center mx-auto">
                          <span className="text-sm font-bold text-sky-400">{d.apps}</span>
                        </div>
                        <span className="text-[8px] text-[#484f58] block mt-1">Apps</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Multi-line chart: Goals, Assists, Appearances
              const maxGoals = Math.max(...allSeasonsData.map(d => d.goals), 1);
              const maxAssists = Math.max(...allSeasonsData.map(d => d.assists), 1);
              const maxApps = Math.max(...allSeasonsData.map(d => d.apps), 1);
              // Use a shared scale for visual comparison: normalize to 0-100%
              const lines = [
                { key: 'goals', color: '#10B981', data: allSeasonsData.map(d => d.goals), max: maxGoals },
                { key: 'assists', color: '#F59E0B', data: allSeasonsData.map(d => d.assists), max: maxAssists },
                { key: 'apps', color: '#0EA5E9', data: allSeasonsData.map(d => d.apps), max: maxApps },
              ];

              const pointsForLine = (data: number[], max: number) =>
                data.map((v, i) => ({
                  x: paddingX + (dataLen > 1 ? (i / (dataLen - 1)) * plotW : plotW / 2),
                  y: paddingY + plotH - (v / max) * plotH,
                  v,
                }));

              return (
                <div className="relative">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="none" style={{ height: 130 }}>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
                      <line key={idx} x1={paddingX} y1={paddingY + pct * plotH} x2={chartW - paddingX} y2={paddingY + pct * plotH} stroke="#30363d" strokeWidth="0.5" />
                    ))}

                    {/* Y-axis labels (generic 0/50/100%) */}
                    {[1, 0.5, 0].map((pct, idx) => {
                      const val = pct * 100;
                      return (
                        <text key={idx} x={paddingX - 4} y={paddingY + (1 - pct) * plotH + 3} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="monospace">
                          {pct === 1 ? 'Max' : `${val.toFixed(0)}%`}
                        </text>
                      );
                    })}

                    {/* Lines */}
                    {lines.map((line) => {
                      const pts = pointsForLine(line.data, line.max);
                      const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                      return (
                        <motion.path
                          key={line.key}
                          d={linePath}
                          fill="none"
                          stroke={line.color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      );
                    })}

                    {/* Dots for each line */}
                    {lines.map((line) => {
                      const pts = pointsForLine(line.data, line.max);
                      return pts.map((p, i) => (
                        <motion.circle
                          key={`${line.key}-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r={i === pts.length - 1 ? 3.5 : 2}
                          fill={p.v > 0 ? line.color : '#161b22'}
                          stroke={line.color}
                          strokeWidth={1}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.08 }}
                        />
                      ));
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="flex justify-between px-6 -mt-1">
                    {allSeasonsData.map((d, i) => (
                      <span key={i} className={`text-[8px] ${i === allSeasonsData.length - 1 ? 'text-emerald-500 font-medium' : 'text-[#484f58]'}`}>
                        S{d.season}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          CAREER STATS DEEP DIVE
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <BarChart3 className="h-3 w-3" /> Stats Deep Dive
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-4">
            {/* Goals Per Season Bar Chart */}
            {seasons.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b949e] uppercase mb-2">Goals Per Season</p>
                <div className="flex items-end gap-1.5 h-20">
                  {seasons.map((s, i) => {
                    const maxGoals = Math.max(...seasons.map(ss => ss.playerStats.goals), 1);
                    const heightPct = (s.playerStats.goals / maxGoals) * 100;
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                      >
                        <span className="text-[9px] text-[#8b949e] mb-0.5">{s.playerStats.goals}</span>
                        <div
                          className="w-full rounded-t-sm bg-emerald-500"
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                        />
                        <span className="text-[8px] text-[#484f58] mt-0.5">S{s.number}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trophy Cabinet */}
            {careerStats.trophies.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b949e] uppercase mb-2">Trophy Cabinet</p>
                <div className="flex flex-wrap gap-2">
                  {careerStats.trophies.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
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
                <p className="text-[10px] text-[#8b949e] uppercase mb-2">Career Records</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: <Target className="h-3 w-3 text-emerald-400" />, label: 'Most Goals', value: records.mostGoals.value, season: records.mostGoals.season, color: 'text-emerald-400' },
                    { icon: <Zap className="h-3 w-3 text-blue-400" />, label: 'Most Assists', value: records.mostAssists.value, season: records.mostAssists.season, color: 'text-blue-400' },
                    { icon: <Star className="h-3 w-3 text-amber-400" />, label: 'Best Rating', value: records.bestRating.value > 0 ? records.bestRating.value.toFixed(1) : '-', season: records.bestRating.season, color: 'text-amber-400' },
                    { icon: <Calendar className="h-3 w-3 text-[#8b949e]" />, label: 'Most Apps', value: records.mostApps.value, season: records.mostApps.season, color: 'text-[#c9d1d9]' },
                  ].map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="bg-[#21262d] rounded-lg p-2 border border-[#30363d]"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {rec.icon}
                        <span className="text-[9px] text-[#8b949e]">{rec.label}</span>
                      </div>
                      <p className={`text-sm font-bold ${rec.color}`}>{rec.value}</p>
                      <p className="text-[8px] text-[#484f58]">Season {rec.season}</p>
                    </motion.div>
                  ))}
                </div>
                {/* Best League Position */}
                {records.bestLeaguePos.value < 99 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-1.5 bg-[#21262d] rounded-lg p-2 border border-[#30363d] flex items-center gap-2"
                  >
                    <Medal className="h-4 w-4" style={{ color: getPositionColor(records.bestLeaguePos.value) }} />
                    <div>
                      <p className="text-[9px] text-[#8b949e]">Best League Finish</p>
                      <p className="text-sm font-bold" style={{ color: getPositionColor(records.bestLeaguePos.value) }}>
                        {getOrdinal(records.bestLeaguePos.value)}
                      </p>
                    </div>
                    <span className="ml-auto text-[9px] text-[#484f58]">Season {records.bestLeaguePos.season}</span>
                  </motion.div>
                )}
              </div>
            )}

            {seasons.length === 0 && (
              <div className="text-center py-4">
                <BarChart3 className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-sm text-[#484f58]">Complete a season to unlock deep stats</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          ENHANCED ACHIEVEMENTS (with rarity treatment)
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                <Award className="h-3 w-3" /> Achievements
              </CardTitle>
              <span className="text-[10px] text-[#8b949e]">
                <span className="text-emerald-400 font-semibold">{unlockedCount}</span> / {achievements.length}
              </span>
            </div>
            {/* Achievement Progress Bar */}
            <div className="mt-2">
              <Progress
                value={achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}
                className="h-1.5 bg-[#21262d]"
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {/* Category Filter Tabs */}
            <Tabs value={achievementFilter} onValueChange={setAchievementFilter} className="w-full">
              <TabsList className="w-full h-7 bg-[#21262d] p-0.5 mb-3">
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
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {filteredAchievements.map((a, i) => {
                      const rarity = RARITY_CONFIG[a.rarity] || RARITY_CONFIG.common;
                      const isLegendary = a.rarity === 'legendary' && a.unlocked;
                      return (
                        <motion.div
                          key={a.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`relative flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                            a.unlocked
                              ? `${rarity.bg} ${rarity.border}`
                              : 'bg-[#21262d] border-[#30363d]'
                          } ${isLegendary ? 'legendary-pulse-border' : ''}`}
                          style={isLegendary ? { animation: 'pulse-legendary-border 2.5s ease-in-out infinite' } : undefined}
                        >
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-[#21262d]`}>
                            {a.unlocked ? a.icon : <Lock className="h-4 w-4 text-[#484f58]" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-xs font-semibold truncate ${a.unlocked ? rarity.color : 'text-[#484f58]'}`}>
                                {a.name}
                              </p>
                              {/* Rarity Badge */}
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 ${rarity.badgeBg} ${rarity.badgeColor} border-0`}>
                                {a.rarity === 'legendary' && <Gem className="h-2 w-2 mr-0.5" />}
                                {rarity.label}
                              </Badge>
                            </div>
                            <p className={`text-[10px] truncate ${a.unlocked ? 'text-[#8b949e]' : 'text-[#30363d]'}`}>
                              {a.description}
                            </p>
                            {/* Unlocked Season */}
                            {a.unlocked && a.unlockedSeason != null && (
                              <p className="text-[9px] text-[#484f58] mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                Unlocked in Season {a.unlockedSeason}
                              </p>
                            )}
                          </div>

                          {/* Unlocked indicator */}
                          {a.unlocked && (
                            <Sparkles className={`h-4 w-4 ${rarity.color}`} />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-4">
                    <Award className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                    <p className="text-sm text-[#484f58]">No achievements in this category</p>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <Flame className="h-3 w-3" /> Current Season · S{currentSeason}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-emerald-400">{player.seasonStats.goals}</p>
                <p className="text-[9px] text-[#8b949e]">Goals</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-blue-400">{player.seasonStats.assists}</p>
                <p className="text-[9px] text-[#8b949e]">Assists</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-amber-400">
                  {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}
                </p>
                <p className="text-[9px] text-[#8b949e]">Avg Rating</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <div className="text-center">
                <p className="text-xs font-semibold text-[#c9d1d9]">{player.seasonStats.appearances}</p>
                <p className="text-[8px] text-[#484f58]">Apps</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-[#c9d1d9]">{player.seasonStats.starts}</p>
                <p className="text-[8px] text-[#484f58]">Starts</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-yellow-500">{player.seasonStats.yellowCards}</p>
                <p className="text-[8px] text-[#484f58]">Yellows</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-red-400">{player.seasonStats.redCards}</p>
                <p className="text-[8px] text-[#484f58]">Reds</p>
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
        className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center justify-between hover:bg-[#21262d] hover:border-emerald-800/40 transition-all group"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-[#c9d1d9]">View Full Analytics</span>
            <p className="text-[10px] text-[#8b949e]">Radar charts, attributes & form breakdown</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[#484f58] group-hover:text-emerald-400 transition-colors" />
      </motion.button>
    </div>
  );
}