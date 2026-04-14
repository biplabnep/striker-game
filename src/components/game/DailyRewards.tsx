'use client';
/* eslint-disable react-hooks/static-components */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Flame, Lock, Check, Clock, Star, Zap, Package, Coins, Trophy, Calendar, Gift, ChevronRight } from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

type RewardStatus = 'claimed' | 'available' | 'locked';

interface WeeklyReward {
  day: number;
  label: string;
  rewardName: string;
  rewardAmount: string;
  icon: 'coins' | 'energy' | 'xp' | 'mystery' | 'legendary';
  status: RewardStatus;
}

interface MonthlyDay {
  day: number;
  rewardType: 'coins' | 'energy' | 'xp' | 'mystery' | 'premium' | 'milestone';
  status: RewardStatus;
  isPremium: boolean;
  isMilestone: boolean;
}

interface StreakMilestone {
  days: number;
  reward: string;
  rewardDescription: string;
  status: 'unlocked' | 'next' | 'locked';
  progress: number;
}

interface RewardCategory {
  id: string;
  name: string;
  icon: 'coins' | 'energy' | 'xp' | 'mystery' | 'exclusive';
  balance: number;
  maxBalance: number;
  available: number;
  earned: number;
  actionLabel: string;
}

interface AchievementReward {
  id: string;
  name: string;
  description: string;
  rewardName: string;
  rewardAmount: string;
  current: number;
  target: number;
  unlocked: boolean;
  claimed: boolean;
}

interface RewardHistoryEntry {
  id: string;
  date: string;
  rewardName: string;
  type: 'coins' | 'energy' | 'xp' | 'mystery' | 'legendary' | 'exclusive';
  amount: string;
  source: 'Daily' | 'Streak' | 'Achievement' | 'Event';
  value: number;
}

// ============================================================
// Deterministic Seeded Random
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ============================================================
// Colors
// ============================================================

const COLORS = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  borderDefault: '#30363d',
  textMuted: '#8b949e',
  accentGreen: '#34d399',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',
  accentBlue: '#3b82f6',
  accentPurple: '#a78bfa',
};

const TYPE_COLORS: Record<string, string> = {
  coins: COLORS.accentAmber,
  energy: COLORS.accentGreen,
  xp: COLORS.accentBlue,
  mystery: COLORS.accentPurple,
  legendary: COLORS.accentAmber,
  exclusive: COLORS.accentRed,
  premium: '#ec4899',
};

const SOURCE_COLORS: Record<string, string> = {
  Daily: COLORS.accentGreen,
  Streak: COLORS.accentAmber,
  Achievement: COLORS.accentBlue,
  Event: COLORS.accentPurple,
};

// ============================================================
// Main Component
// ============================================================

export default function DailyRewards() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [claimedToday, setClaimedToday] = useState(false);
  const [claimedAchievements, setClaimedAchievements] = useState<Set<string>>(new Set());
  const [expandedStreak, setExpandedStreak] = useState<number | null>(null);

  // ============================================================
  // Deterministic seed from game state
  // ============================================================
  const seed = useMemo(() => {
    if (!gameState) return 42;
    return gameState.player.overall * 100 + gameState.player.age * 7 + gameState.currentWeek * 3 + gameState.currentSeason * 13;
  }, [gameState]);

  // ============================================================
  // Core derived values
  // ============================================================
  const currentStreak = useMemo(() => {
    if (!gameState) return 0;
    const rng = seededRandom(seed + 1);
    const base = Math.min(gameState.currentWeek, 30);
    return base + Math.floor(rng() * 5);
  }, [gameState, seed]);

  const streakRecord = useMemo(() => {
    if (!gameState) return 0;
    const rng = seededRandom(seed + 2);
    return currentStreak + Math.floor(rng() * 15) + 5;
  }, [gameState, seed, currentStreak]);

  const monthlyClaimed = useMemo(() => {
    if (!gameState) return 0;
    const rng = seededRandom(seed + 3);
    return Math.min(gameState.currentWeek, 30) + Math.floor(rng() * 3);
  }, [gameState, seed]);

  const nextRewardHours = useMemo(() => {
    if (!gameState) return 0;
    return 24 - ((gameState.currentWeek * 7 + gameState.currentSeason * 3) % 24);
  }, [gameState]);

  const currentDayOfWeek = useMemo(() => {
    if (!gameState) return 1;
    return ((gameState.currentWeek % 7) + 1);
  }, [gameState]);

  const streakMultiplier = useMemo(() => {
    if (currentStreak >= 60) return 3;
    if (currentStreak >= 30) return 2.5;
    if (currentStreak >= 14) return 2;
    if (currentStreak >= 7) return 1.5;
    return 1;
  }, [currentStreak]);

  const multiplierColor = useMemo(() => {
    if (streakMultiplier >= 3) return COLORS.accentAmber;
    if (streakMultiplier >= 2.5) return COLORS.accentPurple;
    if (streakMultiplier >= 2) return COLORS.accentBlue;
    if (streakMultiplier >= 1.5) return COLORS.accentGreen;
    return COLORS.textMuted;
  }, [streakMultiplier]);

  const streakFreezes = useMemo(() => {
    const rng = seededRandom(seed + 4);
    return Math.floor(rng() * 3);
  }, [seed]);

  // ============================================================
  // 7-Day Login Calendar
  // ============================================================
  const weeklyRewards: WeeklyReward[] = useMemo(() => {
    const rewards: Omit<WeeklyReward, 'status'>[] = [
      { day: 1, label: 'Mon', rewardName: '100 Coins', rewardAmount: '100', icon: 'coins' },
      { day: 2, label: 'Tue', rewardName: 'Energy Refill', rewardAmount: 'Full', icon: 'energy' },
      { day: 3, label: 'Wed', rewardName: '200 Coins', rewardAmount: '200', icon: 'coins' },
      { day: 4, label: 'Thu', rewardName: 'XP Boost', rewardAmount: '1.5x 3h', icon: 'xp' },
      { day: 5, label: 'Fri', rewardName: '300 Coins', rewardAmount: '300', icon: 'coins' },
      { day: 6, label: 'Sat', rewardName: 'Mystery Item', rewardAmount: '1 item', icon: 'mystery' },
      { day: 7, label: 'Sun', rewardName: 'Legendary Pack', rewardAmount: '1 pack', icon: 'legendary' },
    ];
    return rewards.map(r => {
      let status: RewardStatus = 'locked';
      if (r.day < currentDayOfWeek) status = 'claimed';
      else if (r.day === currentDayOfWeek) status = claimedToday ? 'claimed' : 'available';
      return { ...r, status };
    });
  }, [currentDayOfWeek, claimedToday]);

  const weeklyProgress = useMemo(() => {
    return Math.round(((currentDayOfWeek - 1) / 7) * 100);
  }, [currentDayOfWeek]);

  // ============================================================
  // 30-Day Monthly Calendar
  // ============================================================
  const monthlyDays: MonthlyDay[] = useMemo(() => {
    const rng = seededRandom(seed + 10);
    const days: MonthlyDay[] = [];
    const milestones = new Set([7, 14, 21, 30]);

    const rewardTypes: Array<MonthlyDay['rewardType']> = ['coins', 'energy', 'xp', 'mystery', 'premium'];

    for (let d = 1; d <= 30; d++) {
      const isPremium = d % 5 === 0;
      const isMilestone = milestones.has(d);
      const rewardType = isMilestone ? 'milestone' : isPremium ? 'premium' : rewardTypes[Math.floor(rng() * 4)];
      let status: RewardStatus = 'locked';
      if (d <= monthlyClaimed) status = 'claimed';
      else if (d === monthlyClaimed + 1) status = 'available';
      days.push({ day: d, rewardType, status, isPremium, isMilestone });
    }
    return days;
  }, [seed, monthlyClaimed]);

  const monthlyCompletion = useMemo(() => {
    return Math.round((monthlyClaimed / 30) * 100);
  }, [monthlyClaimed]);

  // ============================================================
  // Streak Rewards Ladder
  // ============================================================
  const streakMilestones: StreakMilestone[] = useMemo(() => {
    const milestones: Array<{ days: number; reward: string; rewardDescription: string }> = [
      { days: 3, reward: '500 Coins', rewardDescription: 'Early bird bonus' },
      { days: 7, reward: 'Energy Pack', rewardDescription: 'Full energy refill + 2 boosts' },
      { days: 14, reward: '1,500 Coins', rewardDescription: 'Two-week dedication' },
      { days: 21, reward: 'XP Pack', rewardDescription: '3x XP boost for 24h' },
      { days: 30, reward: 'Legendary Item', rewardDescription: 'Monthly streak legend' },
      { days: 60, reward: '5,000 Coins', rewardDescription: 'Two-month warrior' },
      { days: 90, reward: 'Exclusive Kit', rewardDescription: 'Season veteran reward' },
      { days: 180, reward: 'Trophy Pack', rewardDescription: 'Half-year dedication' },
      { days: 365, reward: 'Hall of Fame Entry', rewardDescription: 'One year legend' },
    ];

    let nextFound = false;
    return milestones.map(m => {
      let status: StreakMilestone['status'] = 'locked';
      const progress = Math.min(100, Math.round((currentStreak / m.days) * 100));
      if (currentStreak >= m.days) {
        status = 'unlocked';
      } else if (!nextFound) {
        status = 'next';
        nextFound = true;
      }
      return { ...m, status, progress };
    });
  }, [currentStreak]);

  // ============================================================
  // Reward Categories
  // ============================================================
  const rewardCategories: RewardCategory[] = useMemo(() => {
    const rng = seededRandom(seed + 20);
    return [
      {
        id: 'coins', name: 'Coins', icon: 'coins',
        balance: 2400 + (gameState?.player.careerStats.totalGoals ?? 0) * 100,
        maxBalance: 10000, available: 500 + Math.floor(rng() * 500),
        earned: 3200 + Math.floor(rng() * 800), actionLabel: 'Spend',
      },
      {
        id: 'energy', name: 'Energy', icon: 'energy',
        balance: Math.floor(rng() * 100),
        maxBalance: 100, available: 0,
        earned: 75, actionLabel: 'Refill',
      },
      {
        id: 'xp', name: 'XP Boosts', icon: 'xp',
        balance: 3 + Math.floor(rng() * 5),
        maxBalance: 20, available: 2 + Math.floor(rng() * 3),
        earned: 15, actionLabel: 'Use',
      },
      {
        id: 'mystery', name: 'Mystery Items', icon: 'mystery',
        balance: 12 + Math.floor(rng() * 10),
        maxBalance: 50, available: 3 + Math.floor(rng() * 5),
        earned: 28, actionLabel: 'Open',
      },
      {
        id: 'exclusive', name: 'Exclusive Items', icon: 'exclusive',
        balance: 2 + Math.floor(rng() * 3),
        maxBalance: 15, available: 1,
        earned: 5, actionLabel: 'Collect',
      },
    ];
  }, [gameState, seed]);

  // ============================================================
  // Achievement Rewards
  // ============================================================
  const achievementRewards: AchievementReward[] = useMemo(() => {
    const rng = seededRandom(seed + 30);
    const goals = gameState?.player.careerStats.totalGoals || 0;
    const appearances = gameState?.player.careerStats.totalAppearances || 0;
    const trophies = gameState?.player.careerStats.trophies.length || 0;

    return [
      {
        id: 'first_login', name: 'First Login', description: 'Log in for the first time',
        rewardName: '100 Coins', rewardAmount: '100',
        current: 1, target: 1, unlocked: true,
        claimed: claimedAchievements.has('first_login'),
      },
      {
        id: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7-day login streak',
        rewardName: 'Energy Pack', rewardAmount: '1 pack',
        current: Math.min(currentStreak, 7), target: 7, unlocked: currentStreak >= 7,
        claimed: claimedAchievements.has('week_warrior'),
      },
      {
        id: 'monthly_master', name: 'Monthly Master', description: 'Maintain a 30-day login streak',
        rewardName: 'Legendary Item', rewardAmount: '1 item',
        current: Math.min(currentStreak, 30), target: 30, unlocked: currentStreak >= 30,
        claimed: claimedAchievements.has('monthly_master'),
      },
      {
        id: 'social_butterfly', name: 'Social Butterfly', description: 'Make 10 social posts',
        rewardName: 'XP Boost', rewardAmount: '2x 6h',
        current: Math.min(Math.floor(rng() * 12), 10), target: 10,
        unlocked: false, claimed: claimedAchievements.has('social_butterfly'),
      },
      {
        id: 'match_winner', name: 'Match Winner', description: 'Win 5 matches',
        rewardName: 'Coin Bonus', rewardAmount: '500',
        current: Math.min(goals, 5), target: 5,
        unlocked: goals >= 5, claimed: claimedAchievements.has('match_winner'),
      },
      {
        id: 'trophy_hunter', name: 'Trophy Hunter', description: 'Win 1 trophy',
        rewardName: 'Exclusive Kit', rewardAmount: '1 kit',
        current: trophies, target: 1,
        unlocked: trophies >= 1, claimed: claimedAchievements.has('trophy_hunter'),
      },
    ];
  }, [gameState, seed, currentStreak, claimedAchievements]);

  // ============================================================
  // Reward History
  // ============================================================
  const rewardHistory: RewardHistoryEntry[] = useMemo(() => {
    const rng = seededRandom(seed + 40);
    const history: RewardHistoryEntry[] = [];
    const rewardNames: Array<{ name: string; type: RewardHistoryEntry['type']; source: RewardHistoryEntry['source']; value: number }> = [
      { name: '100 Coins', type: 'coins', source: 'Daily', value: 100 },
      { name: 'Energy Refill', type: 'energy', source: 'Daily', value: 50 },
      { name: '200 Coins', type: 'coins', source: 'Daily', value: 200 },
      { name: 'XP Boost 1.5x', type: 'xp', source: 'Daily', value: 150 },
      { name: '300 Coins', type: 'coins', source: 'Daily', value: 300 },
      { name: 'Mystery Item', type: 'mystery', source: 'Daily', value: 250 },
      { name: '500 Coins', type: 'coins', source: 'Streak', value: 500 },
      { name: 'Energy Pack', type: 'energy', source: 'Streak', value: 300 },
      { name: 'First Login Reward', type: 'coins', source: 'Achievement', value: 100 },
      { name: '1500 Coins', type: 'coins', source: 'Streak', value: 1500 },
      { name: 'Legendary Pack', type: 'legendary', source: 'Daily', value: 1000 },
      { name: 'Exclusive Kit', type: 'exclusive', source: 'Event', value: 2000 },
      { name: 'Premium Day Bonus', type: 'coins', source: 'Daily', value: 400 },
      { name: 'Weekly Streak Reward', type: 'coins', source: 'Streak', value: 250 },
      { name: 'Milestone Day 14', type: 'mystery', source: 'Streak', value: 500 },
    ];

    const week = gameState?.currentWeek ?? 1;
    const season = gameState?.currentSeason ?? 1;

    for (let i = 0; i < 15; i++) {
      const entry = rewardNames[i % rewardNames.length];
      history.push({
        id: `history-${i}`,
        date: `S${season} W${Math.max(1, week - i)}`,
        rewardName: entry.name,
        type: entry.type,
        amount: entry.value.toLocaleString(),
        source: entry.source,
        value: entry.value,
      });
    }
    return history;
  }, [gameState, seed]);

  const totalMonthlyValue = useMemo(() => {
    return rewardHistory.reduce((sum, h) => sum + h.value, 0);
  }, [rewardHistory]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleClaimToday = () => {
    setClaimedToday(true);
  };

  const handleClaimAchievement = (id: string) => {
    setClaimedAchievements(prev => new Set([...prev, id]));
  };

  // ============================================================
  // SVG Helpers
  // ============================================================
  function GiftBoxSVG({ color, size = 32 }: { color: string; size?: number }) {
    return (
      <svg viewBox="0 0 32 32" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <rect x="4" y="12" width="24" height="16" rx="2" fill={color} opacity={0.25} />
        <rect x="4" y="12" width="24" height="16" rx="2" stroke={color} strokeWidth="1.5" />
        <rect x="14" y="8" width="4" height="20" rx="1" fill={color} opacity={0.4} />
        <rect x="14" y="8" width="4" height="20" rx="1" stroke={color} strokeWidth="1" opacity={0.6} />
        <path d="M4 14 Q16 8 28 14" stroke={color} strokeWidth="1.5" fill="none" opacity={0.6} />
        <ellipse cx="12" cy="11" rx="4" ry="3" fill={color} opacity={0.3} />
        <ellipse cx="20" cy="11" rx="4" ry="3" fill={color} opacity={0.3} />
      </svg>
    );
  }

  function FlameIconSVG({ color, size = 20 }: { color: string; size?: number }) {
    return (
      <svg viewBox="0 0 24 24" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <path d="M12 2c0 0-4 6-4 10a4 4 0 008 0c0-4-4-10-4-10z" fill={color} opacity={0.6} />
        <path d="M12 2c0 0-4 6-4 10a4 4 0 008 0c0-4-4-10-4-10z" stroke={color} strokeWidth="1.5" />
        <path d="M12 14c0 0-2 2-2 4a2 2 0 004 0c0-2-2-4-2-4z" fill={color} opacity={0.8} />
      </svg>
    );
  }

  function StarIconSVG({ color, size = 16 }: { color: string; size?: number }) {
    return (
      <svg viewBox="0 0 20 20" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <polygon points="10,1 12.5,7 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7" fill={color} opacity={0.3} />
        <polygon points="10,1 12.5,7 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7" stroke={color} strokeWidth="1" />
      </svg>
    );
  }

  function CoinIconSVG({ size = 16 }: { size?: number }) {
    return (
      <svg viewBox="0 0 20 20" className="flex-shrink-0" style={{ width: size, height: size }}>
        <circle cx="10" cy="10" r="9" fill={COLORS.accentAmber} opacity={0.25} />
        <circle cx="10" cy="10" r="7" fill={COLORS.accentAmber} opacity={0.5} />
        <circle cx="10" cy="10" r="7" stroke={COLORS.accentAmber} strokeWidth="1" />
        <text x="10" y="13.5" textAnchor="middle" fontSize="9" fill={COLORS.accentAmber} fontWeight="bold">C</text>
      </svg>
    );
  }

  function LightningIconSVG({ color, size = 16 }: { color: string; size?: number }) {
    return (
      <svg viewBox="0 0 20 20" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <polygon points="11,1 5,11 9,11 7,19 15,8 11,8" fill={color} opacity={0.5} />
        <polygon points="11,1 5,11 9,11 7,19 15,8 11,8" stroke={color} strokeWidth="1" />
      </svg>
    );
  }

  function MysteryIconSVG({ size = 16 }: { size?: number }) {
    return (
      <svg viewBox="0 0 20 20" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <rect x="3" y="5" width="14" height="12" rx="2" fill={COLORS.accentPurple} opacity={0.2} />
        <rect x="3" y="5" width="14" height="12" rx="2" stroke={COLORS.accentPurple} strokeWidth="1" />
        <circle cx="10" cy="11" r="3" stroke={COLORS.accentPurple} strokeWidth="1.2" />
        <text x="10" y="13.5" textAnchor="middle" fontSize="8" fill={COLORS.accentPurple} fontWeight="bold">?</text>
      </svg>
    );
  }

  function ExclusiveIconSVG({ size = 16 }: { size?: number }) {
    return (
      <svg viewBox="0 0 20 20" className="flex-shrink-0" style={{ width: size, height: size }} fill="none">
        <polygon points="10,1 12.5,7 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7" fill={COLORS.accentRed} opacity={0.3} />
        <polygon points="10,1 12.5,7 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7" stroke={COLORS.accentRed} strokeWidth="1" />
      </svg>
    );
  }

  function RewardIconByType({ type, size = 16 }: { type: string; size?: number }) {
    switch (type) {
      case 'coins': return <CoinIconSVG size={size} />;
      case 'energy': return <LightningIconSVG color={COLORS.accentGreen} size={size} />;
      case 'xp': return <LightningIconSVG color={COLORS.accentBlue} size={size} />;
      case 'mystery': return <MysteryIconSVG size={size} />;
      case 'legendary': return <StarIconSVG color={COLORS.accentAmber} size={size} />;
      case 'exclusive': return <ExclusiveIconSVG size={size} />;
      case 'premium': return <StarIconSVG color="#ec4899" size={size} />;
      case 'milestone': return <StarIconSVG color={COLORS.accentAmber} size={size} />;
      default: return <CoinIconSVG size={size} />;
    }
  }

  function RewardIconByCategory({ icon, size = 20 }: { icon: string; size?: number }) {
    switch (icon) {
      case 'coins': return <CoinIconSVG size={size} />;
      case 'energy': return <LightningIconSVG color={COLORS.accentGreen} size={size} />;
      case 'xp': return <LightningIconSVG color={COLORS.accentBlue} size={size} />;
      case 'mystery': return <MysteryIconSVG size={size} />;
      case 'exclusive': return <ExclusiveIconSVG size={size} />;
      default: return <CoinIconSVG size={size} />;
    }
  }

  // ============================================================
  // Progress Bar Component
  // ============================================================
  function ProgressBar({ value, color, bgColor }: { value: number; color: string; bgColor?: string }) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div className="w-full h-1.5 rounded-sm overflow-hidden" style={{ backgroundColor: bgColor || COLORS.bgTertiary }}>
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    );
  }

  // ============================================================
  // Status Badge
  // ============================================================
  function StatusBadge({ status }: { status: RewardStatus }) {
    switch (status) {
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <Check className="h-3 w-3" /> Claimed
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <Gift className="h-3 w-3" /> Available
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded-md">
            <Lock className="h-3 w-3" /> Locked
          </span>
        );
    }
  }

  // ============================================================
  // Render: Early return
  // ============================================================
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No game state available</p>
      </div>
    );
  }

  // ============================================================
  // Render: Header Section
  // ============================================================
  function RewardsHubHeader() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.accentAmber}18` }}>
              <Gift className="h-4 w-4" style={{ color: COLORS.accentAmber }} />
            </div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Daily Rewards</h1>
          </div>
          <Badge className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${COLORS.accentAmber}18`, color: COLORS.accentAmber, border: `1px solid ${COLORS.accentAmber}30` }}>
            Season {gameState?.currentSeason}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Current Streak */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FlameIconSVG color={COLORS.accentRed} size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Current Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: COLORS.accentRed }}>{currentStreak}</span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>days</span>
            </div>
          </div>

          {/* Streak Record */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="h-4 w-4" style={{ color: COLORS.accentAmber }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Best Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: COLORS.accentAmber }}>{streakRecord}</span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>days</span>
            </div>
          </div>

          {/* Next Reward Timer */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-4 w-4" style={{ color: COLORS.accentBlue }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Next Reward</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: COLORS.accentBlue }}>{nextRewardHours}</span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>hrs</span>
            </div>
          </div>

          {/* Monthly Claimed */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-4 w-4" style={{ color: COLORS.accentGreen }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Monthly</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: COLORS.accentGreen }}>{monthlyClaimed}</span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>/30</span>
            </div>
          </div>
        </div>

        {/* Multiplier + Freeze Row */}
        <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${multiplierColor}18` }}>
              <Zap className="h-3.5 w-3.5" style={{ color: multiplierColor }} />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Multiplier</span>
              <span className="text-sm font-bold ml-1.5" style={{ color: multiplierColor }}>{streakMultiplier}x</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streakFreezes > 0 && (
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" style={{ color: COLORS.accentPurple }} />
                <span className="text-[10px] font-bold" style={{ color: COLORS.accentPurple }}>{streakFreezes} Freeze{streakFreezes > 1 ? 's' : ''}</span>
              </div>
            )}
            <ProgressBar value={(currentStreak / 60) * 100} color={multiplierColor} />
          </div>
        </div>

        {/* Claim Today Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={handleClaimToday}
          disabled={claimedToday}
          className={`w-full py-3.5 rounded-lg text-sm font-bold transition-colors ${
            claimedToday
              ? 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
              : 'text-[#0d1117] cursor-pointer'
          }`}
          style={!claimedToday ? { backgroundColor: COLORS.accentGreen } : {}}
        >
          {claimedToday ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Today&apos;s Reward Claimed
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Gift className="h-4 w-4" /> Claim Today&apos;s Reward
            </span>
          )}
        </motion.button>
      </motion.div>
    );
  }

  // ============================================================
  // Render: 7-Day Login Calendar
  // ============================================================
  function WeeklyCalendarSection() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#c9d1d9]">Weekly Login Calendar</h2>
          <span className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
            Day {currentDayOfWeek}/7
          </span>
        </div>

        {/* Weekly Progress Bar */}
        <ProgressBar value={weeklyProgress} color={COLORS.accentGreen} />

        {/* 7-Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weeklyRewards.map((day) => {
            const isCurrent = day.day === currentDayOfWeek && !claimedToday;
            const isSpecial = day.day === 7;
            const statusColor = day.status === 'claimed' ? COLORS.accentGreen : day.status === 'available' ? COLORS.accentAmber : COLORS.textMuted;
            const borderColor = isCurrent ? `${COLORS.accentAmber}60` : isSpecial ? `${COLORS.accentAmber}30` : COLORS.bgTertiary;
            const bgColor = day.status === 'claimed' ? `${COLORS.accentGreen}08` : isCurrent ? `${COLORS.accentAmber}08` : COLORS.bgSecondary;

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: day.day * 0.04 }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                  isCurrent ? 'border-2' : 'border'
                }`}
                style={{ backgroundColor: bgColor, borderColor }}
              >
                {/* Day Label */}
                <span className="text-[10px] font-bold" style={{ color: isCurrent ? COLORS.accentAmber : COLORS.textMuted }}>
                  {day.label}
                </span>

                {/* Gift Box Icon */}
                <div className="relative">
                  <GiftBoxSVG
                    color={statusColor}
                    size={isSpecial ? 28 : 24}
                  />
                  {day.status === 'claimed' && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-md flex items-center justify-center" style={{ backgroundColor: COLORS.accentGreen }}>
                      <Check className="h-2.5 w-2.5 text-[#0d1117]" />
                    </div>
                  )}
                  {day.status === 'available' && (
                    <motion.div
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: COLORS.accentAmber }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      <Gift className="h-2.5 w-2.5 text-[#0d1117]" />
                    </motion.div>
                  )}
                </div>

                {/* Reward Name */}
                <span className="text-[9px] font-medium text-center leading-tight" style={{ color: statusColor }}>
                  {day.rewardName}
                </span>

                {/* Status indicator dot */}
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Weekly Reward Details */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            {weeklyRewards.map((day) => (
              <div key={day.day} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TYPE_COLORS[day.icon] }} />
                <span className="text-[10px] text-[#c9d1d9] truncate">{day.day}. {day.rewardName}</span>
                <StatusBadge status={day.status} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================================
  // Render: 30-Day Monthly Calendar
  // ============================================================
  function MonthlyCalendarSection() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#c9d1d9]">Monthly Calendar</h2>
          <span className="text-[10px] font-bold" style={{ color: COLORS.accentGreen }}>
            {monthlyCompletion}% Complete
          </span>
        </div>

        <ProgressBar value={monthlyCompletion} color={COLORS.accentGreen} />

        {/* 6x5 Grid */}
        <div className="grid grid-cols-6 gap-1">
          {monthlyDays.map((dayData) => {
            const isCurrent = dayData.day === monthlyClaimed + 1;
            const typeColor = TYPE_COLORS[dayData.rewardType] || COLORS.textMuted;
            const borderColor = dayData.isMilestone ? `${COLORS.accentAmber}50` : dayData.isPremium ? '#ec489950' : dayData.status === 'claimed' ? `${COLORS.accentGreen}30` : COLORS.bgTertiary;
            const bgColor = dayData.status === 'claimed' ? `${COLORS.accentGreen}08` : isCurrent ? `${COLORS.accentAmber}08` : COLORS.bgSecondary;

            return (
              <motion.div
                key={dayData.day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: dayData.day * 0.015 }}
                className={`relative flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-md border ${isCurrent ? 'border-2' : ''} ${dayData.isMilestone ? 'border' : ''}`}
                style={{ backgroundColor: bgColor, borderColor, minHeight: 52 }}
              >
                {/* Day number */}
                <span
                  className="text-[10px] font-bold"
                  style={{ color: dayData.status === 'claimed' ? COLORS.accentGreen : isCurrent ? COLORS.accentAmber : COLORS.textMuted }}
                >
                  {dayData.day}
                </span>

                {/* Type icon */}
                <RewardIconByType type={dayData.rewardType} size={14} />

                {/* Status indicator */}
                {dayData.status === 'claimed' && (
                  <Check className="h-2.5 w-2.5" style={{ color: COLORS.accentGreen }} />
                )}
                {dayData.status === 'available' && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.accentAmber }}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                  />
                )}
                {dayData.status === 'locked' && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.bgTertiary }} />
                )}

                {/* Premium marker */}
                {dayData.isPremium && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-sm" style={{ backgroundColor: '#ec4899' }} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Monthly Milestones Legend */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
            Monthly Milestones
          </span>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {[
              { day: 7, reward: '500 Coins' },
              { day: 14, reward: 'Energy Pack' },
              { day: 21, reward: 'XP Boost 2x' },
              { day: 30, reward: 'Legendary Box' },
            ].map(m => {
              const achieved = monthlyClaimed >= m.day;
              return (
                <div key={m.day} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: achieved ? `${COLORS.accentGreen}20` : COLORS.bgTertiary }}>
                    {achieved ? (
                      <Check className="h-3 w-3" style={{ color: COLORS.accentGreen }} />
                    ) : (
                      <Lock className="h-3 w-3" style={{ color: COLORS.textMuted }} />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#c9d1d9]">Day {m.day}</span>
                    <span className="text-[10px] ml-1" style={{ color: COLORS.textMuted }}>{m.reward}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================================
  // Render: Streak Rewards Ladder
  // ============================================================
  function StreakRewardsLadder() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        {/* Current Multiplier Display */}
        <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${multiplierColor}18` }}>
              <Zap className="h-5 w-5" style={{ color: multiplierColor }} />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Current Multiplier</span>
              <div className="text-lg font-bold" style={{ color: multiplierColor }}>{streakMultiplier}x</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium" style={{ color: COLORS.textMuted }}>Streak</span>
            <div className="flex items-baseline gap-1">
              <FlameIconSVG color={COLORS.accentRed} size={16} />
              <span className="text-lg font-bold" style={{ color: COLORS.accentRed }}>{currentStreak}</span>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>days</span>
            </div>
          </div>
        </div>

        {/* Multiplier Tiers */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Multiplier Tiers</span>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { label: '1x', range: '0-6', active: currentStreak < 7, color: COLORS.textMuted },
              { label: '1.5x', range: '7-13', active: currentStreak >= 7 && currentStreak < 14, color: COLORS.accentGreen },
              { label: '2x', range: '14-29', active: currentStreak >= 14 && currentStreak < 30, color: COLORS.accentBlue },
              { label: '2.5x', range: '30-59', active: currentStreak >= 30 && currentStreak < 60, color: COLORS.accentPurple },
              { label: '3x', range: '60+', active: currentStreak >= 60, color: COLORS.accentAmber },
            ].map(tier => (
              <div
                key={tier.label}
                className="flex flex-col items-center gap-1 p-1.5 rounded-md border"
                style={{
                  borderColor: tier.active ? `${tier.color}40` : COLORS.bgTertiary,
                  backgroundColor: tier.active ? `${tier.color}08` : 'transparent',
                }}
              >
                <span className="text-xs font-bold" style={{ color: tier.active ? tier.color : COLORS.textMuted }}>{tier.label}</span>
                <span className="text-[8px]" style={{ color: COLORS.textMuted }}>{tier.range}d</span>
              </div>
            ))}
          </div>
        </div>

        {/* Freeze Counter */}
        {streakFreezes > 0 && (
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5">
            <Lock className="h-4 w-4" style={{ color: COLORS.accentPurple }} />
            <span className="text-xs font-medium text-[#c9d1d9]">Streak Freezes Available</span>
            <div className="ml-auto flex items-center gap-1">
              {Array.from({ length: streakFreezes }, (_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${COLORS.accentPurple}40`, border: `1px solid ${COLORS.accentPurple}` }} />
              ))}
            </div>
          </div>
        )}

        {/* Streak Milestones List */}
        <div className="space-y-1.5">
          {streakMilestones.map((milestone, idx) => {
            const isExpanded = expandedStreak === milestone.days;
            const statusIcon = milestone.status === 'unlocked' ? (
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${COLORS.accentGreen}20` }}>
                <Check className="h-3.5 w-3.5" style={{ color: COLORS.accentGreen }} />
              </div>
            ) : milestone.status === 'next' ? (
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${COLORS.accentAmber}20` }}>
                <FlameIconSVG color={COLORS.accentAmber} size={14} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: COLORS.bgTertiary }}>
                <Lock className="h-3.5 w-3.5" style={{ color: COLORS.textMuted }} />
              </div>
            );

            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <button
                  onClick={() => setExpandedStreak(isExpanded ? null : milestone.days)}
                  className="w-full flex items-center gap-2.5 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 transition-colors hover:border-[#484f58] text-left"
                >
                  {statusIcon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#c9d1d9]">{milestone.days} Days</span>
                      <span className="text-[10px] font-medium" style={{ color: COLORS.textMuted }}>- {milestone.reward}</span>
                    </div>
                    {isExpanded && (
                      <span className="text-[10px] mt-0.5 block" style={{ color: COLORS.textMuted }}>
                        {milestone.rewardDescription}
                      </span>
                    )}
                    {!isExpanded && (
                      <div className="mt-1">
                        <ProgressBar
                          value={milestone.progress}
                          color={
                            milestone.status === 'unlocked' ? COLORS.accentGreen
                            : milestone.status === 'next' ? COLORS.accentAmber
                            : COLORS.bgTertiary
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {milestone.status === 'unlocked' && (
                      <span className="text-[9px] font-bold" style={{ color: COLORS.accentGreen }}>UNLOCKED</span>
                    )}
                    {milestone.status === 'next' && (
                      <span className="text-[9px] font-bold" style={{ color: COLORS.accentAmber }}>{milestone.progress}%</span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: COLORS.textMuted }} />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ============================================================
  // Render: Reward Categories
  // ============================================================
  function RewardCategoriesSection() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <h2 className="text-sm font-bold text-[#c9d1d9]">Reward Inventory</h2>

        {rewardCategories.map((category, idx) => {
          const typeColor = TYPE_COLORS[category.id] || COLORS.textMuted;
          const progressPercent = Math.round((category.balance / category.maxBalance) * 100);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeColor}15` }}>
                  <RewardIconByCategory icon={category.icon} size={22} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[#c9d1d9]">{category.name}</span>
                    <span className="text-xs font-bold" style={{ color: typeColor }}>
                      {category.balance.toLocaleString()}
                    </span>
                  </div>

                  {/* Balance bar */}
                  <ProgressBar value={progressPercent} color={typeColor} bgColor={COLORS.bgTertiary} />

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                      Earned: <span className="font-semibold text-[#c9d1d9]">{category.earned.toLocaleString()}</span>
                    </span>
                    {category.available > 0 && (
                      <span className="text-[10px]" style={{ color: typeColor }}>
                        +{category.available} available
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: `${typeColor}15`,
                    color: typeColor,
                    border: `1px solid ${typeColor}30`,
                  }}
                >
                  {category.actionLabel}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // ============================================================
  // Render: Achievement Rewards
  // ============================================================
  function AchievementRewardsSection() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#c9d1d9]">Achievement Rewards</h2>
          <span className="text-[10px] font-bold" style={{ color: COLORS.accentGreen }}>
            {achievementRewards.filter(a => a.unlocked).length}/{achievementRewards.length} Unlocked
          </span>
        </div>

        {achievementRewards.map((achievement, idx) => {
          const progressPercent = Math.min(100, Math.round((achievement.current / achievement.target) * 100));
          const isClaimable = achievement.unlocked && !achievement.claimed;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
              style={{
                borderColor: isClaimable ? `${COLORS.accentGreen}40` : undefined,
              }}
            >
              <div className="flex items-start gap-2.5">
                {/* Status icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{
                  backgroundColor: achievement.claimed ? `${COLORS.accentGreen}15` : achievement.unlocked ? `${COLORS.accentAmber}15` : COLORS.bgTertiary,
                }}>
                  {achievement.claimed ? (
                    <Check className="h-4 w-4" style={{ color: COLORS.accentGreen }} />
                  ) : achievement.unlocked ? (
                    <Star className="h-4 w-4" style={{ color: COLORS.accentAmber }} />
                  ) : (
                    <Lock className="h-4 w-4" style={{ color: COLORS.textMuted }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#c9d1d9]">{achievement.name}</span>
                    {isClaimable && (
                      <motion.span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                        style={{ backgroundColor: `${COLORS.accentGreen}15`, color: COLORS.accentGreen }}
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                      >
                        CLAIM
                      </motion.span>
                    )}
                  </div>
                  <span className="text-[10px] block mb-1" style={{ color: COLORS.textMuted }}>
                    {achievement.description}
                  </span>

                  {/* Progress bar */}
                  <ProgressBar
                    value={progressPercent}
                    color={achievement.unlocked ? COLORS.accentGreen : COLORS.accentBlue}
                  />

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                      {achievement.current}/{achievement.target}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: COLORS.accentAmber }}>
                      {achievement.rewardName}
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                {isClaimable && (
                  <button
                    onClick={() => handleClaimAchievement(achievement.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold text-[#0d1117] transition-colors cursor-pointer"
                    style={{ backgroundColor: COLORS.accentGreen }}
                  >
                    Claim
                  </button>
                )}
                {achievement.claimed && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-md" style={{ color: COLORS.accentGreen, backgroundColor: `${COLORS.accentGreen}08` }}>
                    Done
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // ============================================================
  // Render: Reward History
  // ============================================================
  function RewardHistorySection() {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#c9d1d9]">Reward History</h2>
          <div className="flex items-center gap-1.5">
            <CoinIconSVG size={12} />
            <span className="text-xs font-bold" style={{ color: COLORS.accentAmber }}>
              {totalMonthlyValue.toLocaleString()} total
            </span>
          </div>
        </div>

        <div className="space-y-1 max-h-[480px] overflow-y-auto">
          {rewardHistory.map((entry, idx) => {
            const sourceColor = SOURCE_COLORS[entry.source] || COLORS.textMuted;
            const typeColor = TYPE_COLORS[entry.type] || COLORS.textMuted;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
                className="flex items-center gap-2.5 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5"
              >
                {/* Type Icon */}
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeColor}12` }}>
                  <RewardIconByType type={entry.type} size={14} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#c9d1d9] truncate">{entry.rewardName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{entry.date}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm" style={{ color: sourceColor, backgroundColor: `${sourceColor}12` }}>
                      {entry.source}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <span className="text-xs font-bold flex-shrink-0" style={{ color: typeColor }}>
                  {entry.amount}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Monthly Total Footer */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
            Total Value This Month
          </span>
          <div className="flex items-center gap-1.5">
            <CoinIconSVG size={14} />
            <span className="text-sm font-bold" style={{ color: COLORS.accentAmber }}>
              {totalMonthlyValue.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }



  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="px-3 pt-4 pb-8 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <RewardsHubHeader />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#161b22] border border-[#30363d] rounded-lg h-auto p-0.5 w-full">
          <TabsTrigger
            value="weekly"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Gift className="h-3.5 w-3.5 mr-1" />
            Weekly
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Monthly
          </TabsTrigger>
          <TabsTrigger
            value="streak"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Flame className="h-3.5 w-3.5 mr-1" />
            Streak
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Package className="h-3.5 w-3.5 mr-1" />
            Items
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Trophy className="h-3.5 w-3.5 mr-1" />
            Achieve
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 py-2 px-2 rounded-md text-[10px] font-bold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none transition-all"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyCalendarSection />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyCalendarSection />
        </TabsContent>

        <TabsContent value="streak">
          <StreakRewardsLadder />
        </TabsContent>

        <TabsContent value="inventory">
          <RewardCategoriesSection />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementRewardsSection />
        </TabsContent>

        <TabsContent value="history">
          <RewardHistorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
