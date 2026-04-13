'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Coins,
  FileText, Clock, Target, Zap, Shield, Award, ArrowRight,
  Info, Lightbulb, Handshake, Building2, PiggyBank, BarChart3,
  ChevronRight, AlertTriangle, CheckCircle2, CircleDollarSign,
  Sparkles, Banknote
} from 'lucide-react';

// ============================================================
// Seeded random helper — deterministic from season/week
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

// ============================================================
// Format large currency values for display
// ============================================================
function fmtCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `€${m.toFixed(1)}M` : `€${m.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(1)}K`;
  }
  return `€${value.toFixed(0)}`;
}

// ============================================================
// Main Component
// ============================================================
export default function PersonalFinances() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const player = useMemo(() => gameState?.player, [gameState]);
  const currentClub = useMemo(() => gameState?.currentClub, [gameState]);
  const seasons = useMemo(() => gameState?.seasons ?? [], [gameState]);
  const currentSeason = useMemo(() => gameState?.currentSeason ?? 1, [gameState]);
  const currentWeek = useMemo(() => gameState?.currentWeek ?? 1, [gameState]);
  const careerStats = useMemo(() => player?.careerStats, [player]);
  const seasonStats = useMemo(() => player?.seasonStats, [player]);
  const contract = useMemo(() => player?.contract, [player]);

  // ----------------------------------------------------------
  // Derived financial data — seeded/deterministic
  // ----------------------------------------------------------
  const financialData = useMemo(() => {
    if (!player || !contract) return null;

    const baseSeed = player.name.length * 137 + currentSeason * 31 + currentWeek * 7;

    // --- Current season income ---
    const weeklyWage = contract.weeklyWage;
    const annualWage = weeklyWage * 52;
    const weeksPlayed = currentWeek - 1;
    const seasonBaseSalary = weeklyWage * weeksPlayed;

    // Performance bonuses earned this season
    const goalsBonus = contract.performanceBonuses?.goalsBonus ?? 0;
    const assistBonus = contract.performanceBonuses?.assistBonus ?? 0;
    const cleanSheetBonus = contract.performanceBonuses?.cleanSheetBonus ?? 0;
    const seasonPerformanceBonus =
      (seasonStats?.goals ?? 0) * goalsBonus +
      (seasonStats?.assists ?? 0) * assistBonus +
      (seasonStats?.cleanSheets ?? 0) * cleanSheetBonus;

    // Signing bonus (apportioned over contract length)
    const signingBonus = contract.signingBonus ?? 0;
    const totalYears = contract.yearsRemaining + (currentSeason > 1 ? currentSeason - 1 : 0);
    const signingBonusPerSeason = totalYears > 0 ? signingBonus / Math.max(totalYears, 1) : 0;

    // Sponsorship income (derived from market value & reputation)
    const sponsorshipBase = (player.marketValue * 0.05) * (player.reputation / 100);
    const seasonSponsorship = Math.round(sponsorshipBase * seededRange(baseSeed + 1, 0.8, 1.3));

    // Current season total
    const currentSeasonEarnings = seasonBaseSalary + seasonPerformanceBonus + signingBonusPerSeason + seasonSponsorship;

    // --- Historical season earnings (seeded) ---
    const historicalEarnings = seasons.map((s, i) => {
      const sSeed = baseSeed + (i + 1) * 53;
      const histWage = seededRange(sSeed, weeklyWage * 0.4, weeklyWage * 1.5);
      const histBonus = s.playerStats.goals * goalsBonus * seededRange(sSeed + 1, 0.5, 1.2) +
                        s.playerStats.assists * assistBonus * seededRange(sSeed + 2, 0.5, 1.2);
      const histSigning = signingBonusPerSeason * (i === 0 ? 1 : seededRange(sSeed + 3, 0, 0.5));
      const histSponsorship = Math.round(sponsorshipBase * seededRange(sSeed + 4, 0.5, 1.2) * (0.6 + i * 0.1));
      const histTotal = Math.round(histWage * 52 + histBonus + histSigning + histSponsorship);

      return {
        season: s.number,
        year: s.year,
        leaguePosition: s.leaguePosition,
        goals: s.playerStats.goals,
        assists: s.playerStats.assists,
        wage: Math.round(histWage * 52),
        bonus: Math.round(histBonus),
        signing: Math.round(histSigning),
        sponsorship: histSponsorship,
        total: histTotal,
      };
    });

    // --- Total career earnings ---
    const historicalTotal = historicalEarnings.reduce((sum, e) => sum + e.total, 0);
    const totalCareerEarnings = historicalTotal + currentSeasonEarnings;

    // --- Market value trend data ---
    const mvHistory: { season: number; value: number }[] = [];
    const seasonsPlayed = careerStats?.seasonsPlayed ?? 0;
    const startAge = player.age - seasonsPlayed;
    for (let i = 0; i <= Math.max(currentSeason, seasonsPlayed); i++) {
      const mvSeed = baseSeed + i * 77;
      const ageFactor = 1 - Math.max(0, (startAge + i - 27) * 0.03);
      const growthFactor = 1 + i * 0.08 * seededRange(mvSeed + 1, 0.5, 1.5);
      const noise = seededRange(mvSeed + 2, -0.15, 0.15);
      const mv = Math.max(0.5, player.marketValue * ageFactor * growthFactor * (1 + noise));
      mvHistory.push({ season: i, value: Math.round(mv * 100) / 100 });
    }

    // --- Contract history (seeded) ---
    const contractHistory: { season: number; club: string; wage: number; years: number; bonus: number }[] = [];
    if (seasons.length > 0 || currentSeason > 1) {
      // Initial contract
      contractHistory.push({
        season: 1,
        club: currentClub?.name ?? 'Academy',
        wage: Math.round(weeklyWage * 0.5),
        years: 3,
        bonus: Math.round(seededRange(baseSeed + 100, 50000, 200000)),
      });
      // Additional contracts based on seasons
      if (seasons.length >= 2 || currentSeason >= 3) {
        contractHistory.push({
          season: 3,
          club: currentClub?.name ?? 'First Team',
          wage: Math.round(weeklyWage * 0.85),
          years: 4,
          bonus: Math.round(seededRange(baseSeed + 200, 300000, 800000)),
        });
      }
      if (seasons.length >= 4 || currentSeason >= 5) {
        contractHistory.push({
          season: 5,
          club: currentClub?.name ?? 'Senior',
          wage: weeklyWage,
          years: contract.yearsRemaining + (currentSeason - 5),
          bonus: signingBonus,
        });
      }
    }

    // --- Financial projections ---
    const projectedNextSeason = Math.round(annualWage * seededRange(baseSeed + 300, 0.95, 1.15) +
      seasonSponsorship * 1.1 +
      signingBonusPerSeason);
    const projected3Year = projectedNextSeason * 3;

    // --- Financial health ---
    const netWorth = totalCareerEarnings + player.marketValue * 0.1;
    const financialHealth = contract.yearsRemaining >= 3 ? 'excellent' :
                            contract.yearsRemaining >= 1 ? 'stable' : 'caution';

    return {
      weeklyWage,
      annualWage,
      seasonBaseSalary,
      seasonPerformanceBonus,
      signingBonusPerSeason,
      seasonSponsorship,
      currentSeasonEarnings,
      historicalEarnings,
      totalCareerEarnings,
      netWorth,
      mvHistory,
      contractHistory,
      projectedNextSeason,
      projected3Year,
      financialHealth,
      goalsBonus,
      assistBonus,
      cleanSheetBonus,
    };
  }, [player, contract, seasonStats, seasons, currentSeason, currentWeek, currentClub, careerStats]);

  // ----------------------------------------------------------
  // Season earnings chart data
  // ----------------------------------------------------------
  const chartData = useMemo(() => {
    if (!financialData) return { bars: [], maxVal: 0 };
    const allSeasons = [
      ...financialData.historicalEarnings.map(e => ({
        season: e.season,
        wage: e.wage,
        bonus: e.bonus,
        total: e.total,
      })),
      {
        season: currentSeason,
        wage: financialData.seasonBaseSalary,
        bonus: financialData.seasonPerformanceBonus,
        total: financialData.currentSeasonEarnings,
        isCurrent: true,
      },
    ];
    const maxVal = Math.max(...allSeasons.map(d => d.total), 1);
    return { bars: allSeasons, maxVal };
  }, [financialData, currentSeason]);

  // ----------------------------------------------------------
  // Market value sparkline data
  // ----------------------------------------------------------
  const sparklineData = useMemo(() => {
    if (!financialData) return { points: [], maxVal: 0, minVal: 0 };
    const pts = financialData.mvHistory;
    const maxVal = Math.max(...pts.map(p => p.value));
    const minVal = Math.min(...pts.map(p => p.value));
    return { points: pts, maxVal, minVal };
  }, [financialData]);

  // ----------------------------------------------------------
  // Financial tips
  // ----------------------------------------------------------
  const financialTips = useMemo(() => {
    if (!player || !contract || !financialData) return [];
    const tips: { icon: React.ReactNode; text: string; type: 'tip' | 'warning' | 'success' }[] = [];

    if (contract.yearsRemaining <= 1) {
      tips.push({
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />,
        text: 'Your contract is expiring soon. Negotiate an extension to secure your income and avoid entering free agency.',
        type: 'warning',
      });
    }

    if (player.overall >= 80 && contract.weeklyWage < 100) {
      tips.push({
        icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />,
        text: `With an OVR of ${player.overall}, you may be underpaid. Consider negotiating a wage increase.`,
        type: 'tip',
      });
    }

    if (financialData.seasonPerformanceBonus > financialData.seasonBaseSalary * 0.3) {
      tips.push({
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />,
        text: 'Your performance bonuses are a significant income source. Keep up the great form!',
        type: 'success',
      });
    }

    if (player.reputation >= 60) {
      tips.push({
        icon: <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />,
        text: 'High reputation opens doors to premium sponsorships. Your marketability is strong.',
        type: 'tip',
      });
    }

    if (player.age > 30) {
      tips.push({
        icon: <PiggyBank className="h-3.5 w-3.5 text-[#8b949e] flex-shrink-0" />,
        text: 'Consider long-term financial planning as your career enters its later stages.',
        type: 'tip',
      });
    }

    if (tips.length === 0) {
      tips.push({
        icon: <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />,
        text: 'Focus on developing your skills and reputation to increase your market value and earning potential.',
        type: 'tip',
      });
    }

    return tips;
  }, [player, contract, financialData]);

  if (!gameState || !player || !contract || !financialData || !careerStats) return null;

  const fd = financialData;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* =========================================
          1. HEADER
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center">
            <Wallet className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Personal Finances</h1>
            <p className="text-[10px] text-[#8b949e]">Season {currentSeason} · Week {currentWeek}</p>
          </div>
        </div>
        <Badge className="text-[9px] px-2 py-0.5 h-5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
          <DollarSign className="h-2.5 w-2.5 mr-1" />
          Active
        </Badge>
      </motion.div>

      {/* =========================================
          2. NET WORTH OVERVIEW CARD
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d] overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
          <CardContent className="relative p-4 pl-5">
            {/* Net Worth Title */}
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium">Net Worth</span>
            </div>

            {/* Big Net Worth Number */}
            <p className="text-2xl font-black text-emerald-400 mb-4">
              {fmtCurrencyShort(fd.netWorth)}
            </p>

            {/* 2x2 Grid of key metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] text-[#8b949e]">Career Earnings</span>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9]">{fmtCurrencyShort(fd.totalCareerEarnings)}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Coins className="h-3 w-3 text-amber-400" />
                  <span className="text-[9px] text-[#8b949e]">Weekly Wage</span>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9]">{formatCurrency(fd.weeklyWage, 'K')}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3 w-3 text-cyan-400" />
                  <span className="text-[9px] text-[#8b949e]">Market Value</span>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9]">{formatCurrency(player.marketValue, 'M')}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3 w-3 text-[#8b949e]" />
                  <span className="text-[9px] text-[#8b949e]">Contract Expiry</span>
                </div>
                <p className={`text-sm font-bold ${contract.yearsRemaining <= 1 ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                  S{currentSeason + contract.yearsRemaining} · {contract.yearsRemaining}yr left
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          3. INCOME BREAKDOWN
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <BarChart3 className="h-3 w-3" /> Income Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Base Salary */}
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-[9px] text-[#8b949e]">Base Salary</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">{fmtCurrencyShort(fd.annualWage)}</p>
                <p className="text-[8px] text-[#484f58]">per year</p>
              </div>

              {/* Performance Bonuses */}
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-sm bg-amber-500" />
                  <span className="text-[9px] text-[#8b949e]">Bonuses</span>
                </div>
                <p className="text-sm font-bold text-amber-400">{fmtCurrencyShort(fd.seasonPerformanceBonus)}</p>
                <p className="text-[8px] text-[#484f58]">this season</p>
              </div>

              {/* Signing Bonus */}
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-sm bg-cyan-400" />
                  <span className="text-[9px] text-[#8b949e]">Signing Bonus</span>
                </div>
                <p className="text-sm font-bold text-cyan-400">{fmtCurrencyShort(fd.signingBonusPerSeason)}</p>
                <p className="text-[8px] text-[#484f58]">per season</p>
              </div>

              {/* Sponsorship */}
              <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-sm bg-purple-400" />
                  <span className="text-[9px] text-[#8b949e]">Sponsorship</span>
                </div>
                <p className="text-sm font-bold text-purple-400">{fmtCurrencyShort(fd.seasonSponsorship)}</p>
                <p className="text-[8px] text-[#484f58]">annual estimate</p>
              </div>
            </div>

            {/* Current Season Total */}
            <div className="mt-3 bg-emerald-950/30 rounded-lg p-3 border border-emerald-800/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">Current Season Earnings</span>
                <span className="text-sm font-bold text-emerald-400">{fmtCurrencyShort(fd.currentSeasonEarnings)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-sm"
                    style={{ width: `${Math.min(100, (currentWeek / 38) * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] text-[#484f58]">{currentWeek}/38 wks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          4. SEASON EARNINGS BAR CHART
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                <BarChart3 className="h-3 w-3" /> Season Earnings
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[8px] text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500" /> Wage
                </span>
                <span className="flex items-center gap-1 text-[8px] text-amber-400">
                  <div className="w-1.5 h-1.5 rounded-sm bg-amber-500" /> Bonus
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {chartData.bars.length === 0 ? (
              <div className="text-center py-6">
                <BarChart3 className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#484f58]">Earnings data will appear after your first completed season</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chartData.bars.map((bar, i) => {
                  const wageWidth = chartData.maxVal > 0 ? (bar.wage / chartData.maxVal) * 100 : 0;
                  const bonusWidth = chartData.maxVal > 0 ? (bar.bonus / chartData.maxVal) * 100 : 0;
                  const isCurrent = 'isCurrent' in bar && bar.isCurrent;

                  return (
                    <motion.div
                      key={bar.season}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className={`flex items-center gap-2 ${isCurrent ? 'bg-emerald-950/20 rounded-md px-2 py-1.5 -mx-2' : 'px-2 py-0.5'}`}
                    >
                      <span className={`text-[10px] font-medium w-14 flex-shrink-0 ${isCurrent ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                        S{bar.season}
                      </span>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="h-3 bg-[#21262d] rounded-sm overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${wageWidth}%` }}
                            transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }}
                            className="h-full bg-emerald-500/70 rounded-sm"
                          />
                        </div>
                        {bar.bonus > 0 && (
                          <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bonusWidth}%` }}
                              transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                              className="h-full bg-amber-500/70 rounded-sm"
                            />
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold w-16 text-right flex-shrink-0 ${isCurrent ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                        {fmtCurrencyShort(bar.total)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          5. CONTRACT DETAILS CARD
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <FileText className="h-3 w-3" /> Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Current Contract */}
            <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentClub?.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{currentClub?.name}</p>
                    <p className="text-[9px] text-[#8b949e]">Current Contract</p>
                  </div>
                </div>
                <Badge className={`text-[8px] px-1.5 py-0 h-4 ${
                  contract.yearsRemaining <= 1 ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' :
                  'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                }`}>
                  {contract.yearsRemaining <= 1 ? 'Expiring' : 'Active'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[9px] text-[#484f58]">Wage</p>
                  <p className="text-xs font-bold text-emerald-400">{formatCurrency(contract.weeklyWage, 'K')}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#484f58]">Duration</p>
                  <p className="text-xs font-bold text-[#c9d1d9]">{contract.yearsRemaining} year{contract.yearsRemaining !== 1 ? 's' : ''}</p>
                </div>
                {contract.releaseClause != null && contract.releaseClause > 0 && (
                  <div>
                    <p className="text-[9px] text-[#484f58]">Release Clause</p>
                    <p className="text-xs font-bold text-amber-400">{formatCurrency(contract.releaseClause, 'M')}</p>
                  </div>
                )}
                {contract.signingBonus != null && contract.signingBonus > 0 && (
                  <div>
                    <p className="text-[9px] text-[#484f58]">Signing Bonus</p>
                    <p className="text-xs font-bold text-cyan-400">{formatCurrency(contract.signingBonus, 'M')}</p>
                  </div>
                )}
              </div>

              {/* Bonus Clauses */}
              {(fd.goalsBonus > 0 || fd.assistBonus > 0 || fd.cleanSheetBonus > 0) && (
                <div className="flex flex-wrap gap-1">
                  {fd.goalsBonus > 0 && (
                    <Badge variant="outline" className="text-[8px] bg-emerald-950/20 border-emerald-800/30 text-emerald-400 px-1.5 py-0">
                      <Target className="h-2 w-2 mr-0.5" /> {formatCurrency(fd.goalsBonus, 'K')}/goal
                    </Badge>
                  )}
                  {fd.assistBonus > 0 && (
                    <Badge variant="outline" className="text-[8px] bg-amber-950/20 border-amber-800/30 text-amber-400 px-1.5 py-0">
                      <Zap className="h-2 w-2 mr-0.5" /> {formatCurrency(fd.assistBonus, 'K')}/assist
                    </Badge>
                  )}
                  {fd.cleanSheetBonus > 0 && (
                    <Badge variant="outline" className="text-[8px] bg-purple-950/20 border-purple-800/30 text-purple-400 px-1.5 py-0">
                      <Shield className="h-2 w-2 mr-0.5" /> {formatCurrency(fd.cleanSheetBonus, 'K')}/CS
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Contract History */}
            {fd.contractHistory.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-2">Contract History</p>
                <div className="space-y-1.5">
                  {fd.contractHistory.map((ch, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#0d1117] rounded-lg px-3 py-2 border border-[#21262d]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-sm bg-[#30363d]" />
                        <div>
                          <p className="text-[10px] font-medium text-[#c9d1d9]">{ch.club}</p>
                          <p className="text-[8px] text-[#484f58]">Season {ch.season} · {ch.years}yr deal</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-400">{formatCurrency(ch.wage, 'K')}</p>
                        {ch.bonus > 0 && (
                          <p className="text-[8px] text-amber-400">+{fmtCurrencyShort(ch.bonus)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiate Button */}
            <Button
              onClick={() => setScreen('transfer_negotiation')}
              className="w-full h-9 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 text-xs font-medium"
            >
              <Handshake className="h-3.5 w-3.5 mr-1.5" />
              Negotiate Contract
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          6. MARKET VALUE TREND SPARKLINE
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Market Value Trend
              </CardTitle>
              <span className="text-xs font-bold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {sparklineData.points.length < 2 ? (
              <div className="text-center py-4">
                <TrendingUp className="h-6 w-6 text-[#30363d] mx-auto mb-1" />
                <p className="text-[10px] text-[#484f58]">Trend data requires multiple seasons</p>
              </div>
            ) : (
              <div>
                <svg
                  viewBox="0 0 300 100"
                  className="w-full h-auto"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Background grid lines */}
                  {[25, 50, 75].map(pct => (
                    <line
                      key={pct}
                      x1="30"
                      y1={pct * 0.8 + 5}
                      x2="290"
                      y2={pct * 0.8 + 5}
                      stroke="#21262d"
                      strokeWidth="0.5"
                    />
                  ))}

                  {/* Area fill under the line */}
                  {(() => {
                    const range = sparklineData.maxVal - sparklineData.minVal || 1;
                    const pts = sparklineData.points;
                    const xStep = (260) / Math.max(pts.length - 1, 1);

                    const linePoints = pts.map((p, i) => {
                      const x = 30 + i * xStep;
                      const normalized = (p.value - sparklineData.minVal) / range;
                      const y = 80 - normalized * 70;
                      return `${x},${y}`;
                    });

                    const areaPath = `M ${linePoints[0]} ` +
                      linePoints.slice(1).map(p => `L ${p}`).join(' ') +
                      ` L ${30 + (pts.length - 1) * xStep},85 L 30,85 Z`;

                    return (
                      <motion.path
                        d={areaPath}
                        fill="rgba(16,185,129,0.08)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      />
                    );
                  })()}

                  {/* Line */}
                  {(() => {
                    const range = sparklineData.maxVal - sparklineData.minVal || 1;
                    const pts = sparklineData.points;
                    const xStep = 260 / Math.max(pts.length - 1, 1);

                    const linePoints = pts.map((p, i) => {
                      const x = 30 + i * xStep;
                      const normalized = (p.value - sparklineData.minVal) / range;
                      const y = 80 - normalized * 70;
                      return `${x},${y}`;
                    });

                    return (
                      <motion.polyline
                        points={linePoints.join(' ')}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                      />
                    );
                  })()}

                  {/* Current value dot */}
                  {(() => {
                    const range = sparklineData.maxVal - sparklineData.minVal || 1;
                    const pts = sparklineData.points;
                    const lastPt = pts[pts.length - 1];
                    const xStep = 260 / Math.max(pts.length - 1, 1);
                    const x = 30 + (pts.length - 1) * xStep;
                    const normalized = (lastPt.value - sparklineData.minVal) / range;
                    const y = 80 - normalized * 70;
                    return (
                      <g>
                        <circle cx={x} cy={y} r="4" fill="#0d1117" stroke="#10B981" strokeWidth="2" />
                        <circle cx={x} cy={y} r="1.5" fill="#10B981" />
                      </g>
                    );
                  })()}

                  {/* Min/Max labels */}
                  <text x="293" y="10" fill="#484f58" fontSize="7" textAnchor="end">
                    {fmtCurrencyShort(sparklineData.maxVal)}
                  </text>
                  <text x="293" y="85" fill="#484f58" fontSize="7" textAnchor="end">
                    {fmtCurrencyShort(sparklineData.minVal)}
                  </text>

                  {/* Season labels on x-axis */}
                  {sparklineData.points.length <= 8
                    ? sparklineData.points.map((p, i) => {
                        const xStep = 260 / Math.max(sparklineData.points.length - 1, 1);
                        const x = 30 + i * xStep;
                        return (
                          <text
                            key={i}
                            x={x}
                            y="96"
                            fill={i === sparklineData.points.length - 1 ? '#10B981' : '#484f58'}
                            fontSize="6"
                            textAnchor="middle"
                          >
                            S{p.season}
                          </text>
                        );
                      })
                    : sparklineData.points
                        .filter((_, i) => i % Math.ceil(sparklineData.points.length / 6) === 0 || i === sparklineData.points.length - 1)
                        .map((p, i) => {
                          const idx = sparklineData.points.indexOf(p);
                          const xStep = 260 / Math.max(sparklineData.points.length - 1, 1);
                          const x = 30 + idx * xStep;
                          return (
                            <text
                              key={i}
                              x={x}
                              y="96"
                              fill={idx === sparklineData.points.length - 1 ? '#10B981' : '#484f58'}
                              fontSize="6"
                              textAnchor="middle"
                            >
                              S{p.season}
                            </text>
                          );
                        })
                  }
                </svg>

                {/* Key Events */}
                {sparklineData.points.length >= 3 && (
                  <div className="mt-2 space-y-1">
                    {sparklineData.points.length >= 2 && (() => {
                      const last = sparklineData.points[sparklineData.points.length - 1];
                      const prev = sparklineData.points[sparklineData.points.length - 2];
                      const change = last.value - prev.value;
                      const pctChange = prev.value > 0 ? ((change / prev.value) * 100) : 0;
                      return (
                        <div className="flex items-center gap-1.5 text-[9px]">
                          {change >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          )}
                          <span className={change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {change >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                          </span>
                          <span className="text-[#484f58]">vs last season</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          7. FINANCIAL PROJECTIONS
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <Building2 className="h-3 w-3" /> Financial Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2.5 border border-[#30363d]">
                <div>
                  <p className="text-xs font-medium text-[#c9d1d9]">Projected Next Season</p>
                  <p className="text-[9px] text-[#484f58]">Based on current trajectory</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{fmtCurrencyShort(fd.projectedNextSeason)}</span>
              </div>
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2.5 border border-[#30363d]">
                <div>
                  <p className="text-xs font-medium text-[#c9d1d9]">3-Year Projection</p>
                  <p className="text-[9px] text-[#484f58]">Estimated cumulative</p>
                </div>
                <span className="text-sm font-bold text-cyan-400">{fmtCurrencyShort(fd.projected3Year)}</span>
              </div>
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2.5 border border-[#30363d]">
                <div>
                  <p className="text-xs font-medium text-[#c9d1d9]">Financial Health</p>
                  <p className="text-[9px] text-[#484f58]">Overall assessment</p>
                </div>
                <Badge className={`text-[8px] px-2 py-0.5 h-4 ${
                  fd.financialHealth === 'excellent' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' :
                  fd.financialHealth === 'stable' ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40' :
                  'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                }`}>
                  {fd.financialHealth === 'excellent' ? 'Excellent' : fd.financialHealth === 'stable' ? 'Stable' : 'Caution'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* =========================================
          8. FINANCIAL TIPS
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#161b22] border border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <Lightbulb className="h-3 w-3 text-amber-400" /> Financial Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {financialTips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.06 }}
                  className={`flex items-start gap-2.5 rounded-lg p-2.5 border ${
                    tip.type === 'warning' ? 'bg-amber-950/20 border-amber-800/30' :
                    tip.type === 'success' ? 'bg-emerald-950/20 border-emerald-800/30' :
                    'bg-[#21262d] border-[#30363d]'
                  }`}
                >
                  {tip.icon}
                  <p className={`text-[11px] leading-relaxed ${
                    tip.type === 'warning' ? 'text-amber-300' :
                    tip.type === 'success' ? 'text-emerald-300' :
                    'text-[#8b949e]'
                  }`}>
                    {tip.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
