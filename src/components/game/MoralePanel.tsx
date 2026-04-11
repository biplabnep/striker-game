'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayerMindset, MoraleFactor } from '@/lib/game/types';
import {
  Heart, Brain, Zap, Shield, TrendingUp, TrendingDown,
  Minus, Activity, Smile, Meh, Frown, Flame, Target,
  Sword, Scale, ShieldCheck, ArrowUp, ArrowDown,
} from 'lucide-react';

// ============================================================
// Mindset Configuration
// ============================================================

const MINDSET_CONFIG: Record<PlayerMindset, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  effects: { label: string; value: string; positive: boolean }[];
}> = {
  aggressive: {
    label: 'Aggressive',
    description: 'Play with intensity and take risks. Higher ceiling, lower floor.',
    icon: <Sword className="h-5 w-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    effects: [
      { label: 'Goal Threat', value: '+15%', positive: true },
      { label: 'Rating Volatility', value: '+20%', positive: false },
      { label: 'Injury Risk', value: '+5%', positive: false },
      { label: 'Teammate Link-up', value: '-5%', positive: false },
    ],
  },
  balanced: {
    label: 'Balanced',
    description: 'Steady and reliable. Consistent performances, no extreme swings.',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    effects: [
      { label: 'Consistency', value: 'Standard', positive: true },
      { label: 'Rating Volatility', value: 'Normal', positive: true },
      { label: 'Team Play', value: 'Standard', positive: true },
      { label: 'Risk', value: 'None', positive: true },
    ],
  },
  conservative: {
    label: 'Conservative',
    description: 'Play it safe. Lower risk, more team contribution, steady ratings.',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    effects: [
      { label: 'Team Play', value: '+10%', positive: true },
      { label: 'Rating Floor', value: '+0.3', positive: true },
      { label: 'Goal Threat', value: '-10%', positive: false },
      { label: 'Injury Risk', value: '-5%', positive: true },
    ],
  },
};

// ============================================================
// Helper Functions
// ============================================================

function getMoraleLevel(morale: number): { label: string; icon: React.ReactNode; color: string } {
  if (morale >= 80) return { label: 'On Cloud Nine', icon: <Smile className="h-5 w-5" />, color: 'text-emerald-400' };
  if (morale >= 65) return { label: 'Positive', icon: <Smile className="h-5 w-5" />, color: 'text-green-400' };
  if (morale >= 50) return { label: 'Neutral', icon: <Meh className="h-5 w-5" />, color: 'text-amber-400' };
  if (morale >= 35) return { label: 'Low', icon: <Frown className="h-5 w-5" />, color: 'text-orange-400' };
  return { label: 'Rock Bottom', icon: <Frown className="h-5 w-5" />, color: 'text-red-400' };
}

function getMoraleBarColor(morale: number): string {
  if (morale >= 80) return 'bg-emerald-500';
  if (morale >= 65) return 'bg-green-500';
  if (morale >= 50) return 'bg-amber-500';
  if (morale >= 35) return 'bg-orange-500';
  return 'bg-red-500';
}

function getFactorCategoryIcon(category: MoraleFactor['category']): React.ReactNode {
  switch (category) {
    case 'match': return <Target className="h-3.5 w-3.5" />;
    case 'personal': return <Heart className="h-3.5 w-3.5" />;
    case 'team': return <Shield className="h-3.5 w-3.5" />;
    case 'contract': return <Activity className="h-3.5 w-3.5" />;
    case 'social': return <Brain className="h-3.5 w-3.5" />;
  }
}

function getFactorCategoryLabel(category: MoraleFactor['category']): string {
  switch (category) {
    case 'match': return 'Match';
    case 'personal': return 'Personal';
    case 'team': return 'Team';
    case 'contract': return 'Contract';
    case 'social': return 'Social';
  }
}

// ============================================================
// Computed Morale Factors (derived from game state)
// ============================================================

function computeMoraleFactors(gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>): MoraleFactor[] {
  const factors: MoraleFactor[] = [];
  const { player, currentClub, recentResults, currentWeek, currentSeason } = gameState;

  // Recent match results
  const last5 = recentResults.slice(0, 5);
  const wins = last5.filter(r => {
    const isHome = r.homeClub.id === currentClub.id;
    return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
  }).length;
  const losses = last5.filter(r => {
    const isHome = r.homeClub.id === currentClub.id;
    return isHome ? r.homeScore < r.awayScore : r.awayScore < r.homeScore;
  }).length;

  if (wins >= 3) {
    factors.push({ id: 'win_streak', label: 'Winning Run', impact: 15, category: 'match' });
  } else if (wins >= 2) {
    factors.push({ id: 'good_form', label: 'Good Recent Form', impact: 8, category: 'match' });
  }
  if (losses >= 3) {
    factors.push({ id: 'losing_streak', label: 'Losing Streak', impact: -20, category: 'match' });
  } else if (losses >= 2) {
    factors.push({ id: 'poor_form', label: 'Poor Recent Results', impact: -8, category: 'match' });
  }

  // Player personal performance
  const lastRating = last5[0]?.playerRating ?? 0;
  if (lastRating >= 8.0) {
    factors.push({ id: 'great_perf', label: 'Outstanding Performance', impact: 12, category: 'personal' });
  } else if (lastRating >= 7.0) {
    factors.push({ id: 'good_perf', label: 'Solid Performance', impact: 5, category: 'personal' });
  } else if (lastRating > 0 && lastRating < 5.5) {
    factors.push({ id: 'bad_perf', label: 'Poor Performance', impact: -10, category: 'personal' });
  }

  // Form
  if (player.form >= 8.0) {
    factors.push({ id: 'great_form', label: 'Excellent Form', impact: 10, category: 'personal' });
  } else if (player.form < 5.0) {
    factors.push({ id: 'bad_form', label: 'Struggling for Form', impact: -12, category: 'personal' });
  }

  // Injury
  if (player.injuryWeeks > 0) {
    factors.push({ id: 'injured', label: `Injured (${player.injuryWeeks}w out)`, impact: -15, category: 'personal' });
  }

  // Squad status
  if (player.squadStatus === 'starter') {
    factors.push({ id: 'starting', label: 'Starting XI', impact: 8, category: 'team' });
  } else if (player.squadStatus === 'bench') {
    factors.push({ id: 'benched', label: 'On the Bench', impact: -8, category: 'team' });
  } else if (player.squadStatus === 'prospect') {
    factors.push({ id: 'prospect', label: 'Academy Prospect', impact: -3, category: 'team' });
  }

  // Contract
  if (player.contract.yearsRemaining <= 1) {
    factors.push({ id: 'expiring', label: 'Contract Expiring Soon', impact: -5, category: 'contract' });
  }

  // Fitness
  if (player.fitness < 40) {
    factors.push({ id: 'low_fitness', label: 'Running on Empty', impact: -8, category: 'personal' });
  }

  // Reputation milestone
  if (player.reputation >= 80) {
    factors.push({ id: 'star_status', label: 'Star Status', impact: 5, category: 'social' });
  }

  return factors;
}

// ============================================================
// Main Component
// ============================================================

export default function MoralePanel() {
  const gameState = useGameStore(s => s.gameState);
  const setMindset = useGameStore(s => s.setMindset);

  const moraleFactors = useMemo(() => {
    if (!gameState) return [];
    return computeMoraleFactors(gameState);
  }, [gameState]);

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const mindset = gameState.mindset ?? 'balanced';
  const moraleLevel = getMoraleLevel(player.morale);
  const currentConfig = MINDSET_CONFIG[mindset];

  const positiveFactors = moraleFactors.filter(f => f.impact > 0);
  const negativeFactors = moraleFactors.filter(f => f.impact < 0);
  const totalImpact = moraleFactors.reduce((sum, f) => sum + f.impact, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#21262d] flex items-center justify-center">
            <Heart className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Morale & Mindset</h1>
            <p className="text-xs text-[#8b949e]">{currentClub.name} • Season {gameState.currentSeason}</p>
          </div>
          <div className={`text-sm font-semibold ${moraleLevel.color}`}>
            {moraleLevel.label}
          </div>
        </div>

        {/* Morale Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
              {moraleLevel.icon}
              Morale
            </span>
            <span className="text-sm font-bold text-[#c9d1d9]">{player.morale}%</span>
          </div>
          <div className="h-3 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className={`h-full rounded-md ${getMoraleBarColor(player.morale)}`}
              initial={{ width: 0 }}
              animate={{ width: `${player.morale}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Net Impact Indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-[#8b949e]">Net morale influence this week</span>
          <div className={`flex items-center gap-1 text-xs font-medium ${
            totalImpact > 0 ? 'text-emerald-400' : totalImpact < 0 ? 'text-red-400' : 'text-[#8b949e]'
          }`}>
            {totalImpact > 0 ? <ArrowUp className="h-3 w-3" /> : totalImpact < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {totalImpact > 0 ? '+' : ''}{totalImpact}
          </div>
        </div>
      </motion.div>

      {/* Mindset Selection */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#8b949e]" />
          Match Mindset
        </h2>
        <p className="text-xs text-[#8b949e] mb-3">
          Choose your approach for upcoming matches. This affects your performance style.
        </p>

        <div className="space-y-2">
          {(Object.keys(MINDSET_CONFIG) as PlayerMindset[]).map((m) => {
            const config = MINDSET_CONFIG[m];
            const isSelected = mindset === m;
            return (
              <button
                key={m}
                onClick={() => setMindset(m)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor}`
                    : 'bg-[#21262d] border-[#30363d] hover:bg-[#2d333b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${isSelected ? config.bgColor : 'bg-[#0d1117]'} flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isSelected ? config.color : 'text-[#c9d1d9]'}`}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px]`}>
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">{config.description}</p>
                  </div>
                </div>

                {/* Effects */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 pt-2 border-t border-[#30363d]/50"
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      {config.effects.map((effect, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8b949e]">{effect.label}</span>
                          <span className={effect.positive ? 'text-emerald-400' : 'text-red-400'}>
                            {effect.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Positive Factors */}
      {positiveFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Positive Factors
          </h3>
          <div className="space-y-2">
            {positiveFactors.map((factor, i) => (
              <motion.div
                key={factor.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">{getFactorCategoryIcon(factor.category)}</span>
                  <span className="text-xs text-[#c9d1d9]">{factor.label}</span>
                  <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[9px]">
                    {getFactorCategoryLabel(factor.category)}
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-emerald-400">+{factor.impact}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Negative Factors */}
      {negativeFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Negative Factors
          </h3>
          <div className="space-y-2">
            {negativeFactors.map((factor, i) => (
              <motion.div
                key={factor.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-2 rounded-md bg-red-500/5 border border-red-500/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-400">{getFactorCategoryIcon(factor.category)}</span>
                  <span className="text-xs text-[#c9d1d9]">{factor.label}</span>
                  <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[9px]">
                    {getFactorCategoryLabel(factor.category)}
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-red-400">{factor.impact}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Morale Tips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#8b949e]" />
          How Morale Works
        </h3>
        <div className="space-y-2 text-xs text-[#8b949e]">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">+</span>
            <span>Win matches and perform well to boost morale</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">+</span>
            <span>Starting XI role and good form lift your spirits</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">-</span>
            <span>Losses, injuries, and bench roles decrease morale</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">*</span>
            <span>Low morale affects match rating (-0.5 at &lt;30)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">*</span>
            <span>High morale boosts match rating (+0.3 at &gt;80)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
