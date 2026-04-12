'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  PlusCircle,
  BarChart3,
  Flame,
  Megaphone,
  Globe,
  MapPin,
  Camera,
  Music,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// Seeded PRNG (Mulberry32)
// ============================================================
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(playerName: string, week: number, extra: string = ''): number {
  const seed = hashSeed(`${playerName}-w${week}-${extra}`);
  const rng = mulberry32(seed);
  return rng();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

// ============================================================
// Types & Interfaces
// ============================================================
type FanMood = 'ecstatic' | 'happy' | 'neutral' | 'frustrated' | 'angry';

interface FanData {
  totalFans: number;
  growthHistory: number[];
  demographics: { local: number; national: number; international: number };
  mood: FanMood;
  moodScore: number;
}

interface SocialProfile {
  platform: string;
  icon: React.ReactNode;
  handle: string;
  followers: number;
  color: string;
}

interface SocialPost {
  id: string;
  platform: string;
  text: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface SponsorOffer {
  id: string;
  brand: string;
  category: string;
  icon: string;
  weeklyAmount: number;
  requirements: string;
  duration: number;
  accepted: boolean;
  rejected: boolean;
}

interface BrandCategory {
  name: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}

interface BrandScoreData {
  overall: number;
  categories: BrandCategory[];
  avgPlayerScore: number;
  tips: string[];
}

// ============================================================
// Data Generation Helpers
// ============================================================
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatMoney(n: number): string {
  return `\u20AC${n.toLocaleString()}`;
}

function getMoodConfig(mood: FanMood) {
  const map: Record<FanMood, { emoji: string; label: string; color: string; bg: string }> = {
    ecstatic: { emoji: '\ud83d\ude00', label: 'Ecstatic', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    happy: { emoji: '\ud83d\ude0a', label: 'Happy', color: 'text-green-400', bg: 'bg-green-500/15' },
    neutral: { emoji: '\ud83d\ude10', label: 'Neutral', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    frustrated: { emoji: '\ud83d\ude1f', label: 'Frustrated', color: 'text-orange-400', bg: 'bg-orange-500/15' },
    angry: { emoji: '\ud83d\ude21', label: 'Angry', color: 'text-red-400', bg: 'bg-red-500/15' },
  };
  return map[mood];
}

function getMoodFromScore(score: number): FanMood {
  if (score >= 80) return 'ecstatic';
  if (score >= 60) return 'happy';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'frustrated';
  return 'angry';
}

// ============================================================
// Fan Data Generator
// ============================================================
function generateFanData(playerName: string, week: number, season: number, overall: number, form: number, reputation: number, goals: number): FanData {
  const recentWins = seededInt(playerName, week, 'rw', 0, 5);
  const recentLosses = seededInt(playerName, week, 'rl', 0, 4);
  const baseFans = 1000 + reputation * 500 + overall * 200 + goals * 150;
  const totalFans = Math.max(baseFans, 500) + week * seededInt(playerName, week, 'fg', 20, 80);

  const growthHistory: number[] = [];
  let prevFans = totalFans * 0.6;
  for (let i = 0; i < 10; i++) {
    const growth = seededInt(playerName, week - 9 + i, 'gh', -50, 200) + (form > 7 ? 30 : 0);
    prevFans = Math.max(100, prevFans + growth);
    growthHistory.push(Math.floor(prevFans));
  }
  growthHistory[9] = totalFans;

  const localBase = seededInt(playerName, week, 'loc', 55, 68);
  const natBase = seededInt(playerName, week, 'nat', 18, 30);
  const intlBase = 100 - localBase - natBase;

  const avgRating = form;
  const recentGoalBonus = goals * 3;
  const moodScore = Math.min(100, Math.max(0, avgRating * 8 + recentWins * 6 - recentLosses * 8 + recentGoalBonus + 15));
  const mood = getMoodFromScore(moodScore);

  return {
    totalFans,
    growthHistory,
    demographics: { local: localBase, national: Math.max(10, natBase), international: Math.max(5, intlBase) },
    mood,
    moodScore: Math.round(moodScore),
  };
}

function generateFanComments(playerName: string, week: number, form: number, mood: FanMood): { name: string; text: string; avatar: string; time: string }[] {
  const positive = [
    `${playerName} is absolutely unreal this season! Best player we\u2019ve seen in years!`,
    `Just got my ${playerName} jersey. Walking proud today!`,
    `That goal last match was INSANE. What a talent we have!`,
    `${playerName} deserves to be player of the season, no debate.`,
    `The future is bright with ${playerName} leading the line!`,
  ];
  const neutral = [
    `${playerName} had a decent game. Room for improvement though.`,
    `Can we get more consistency from ${playerName}? Flashes of brilliance but gaps too.`,
    `I think ${playerName} is developing well. Just needs to stay patient.`,
    `Not the best performance, but ${playerName} will bounce back.`,
    `The potential is there. ${playerName} just needs more game time.`,
  ];
  const negative = [
    `${playerName} really needs to step up. This isn\u2019t good enough.`,
    `Getting worried about ${playerName}\u2019s form lately...`,
    `Is ${playerName} overhyped? Starting to think so.`,
    `We need the old ${playerName} back. This version is frustrating to watch.`,
  ];

  const pool = mood === 'ecstatic' || mood === 'happy' ? positive
    : mood === 'angry' || mood === 'frustrated' ? negative
    : [...positive, ...neutral];

  const names = ['Jake_FC', 'Liam94', 'SarahSupports', 'TrueFan_UK', 'Ollie_10', 'EmmaGol', 'DevotedDave', 'GoalGetter22'];
  const avatars = ['\u26bd', '\ud83c\udfc6', '\u2b50', '\ud83d\udd25', '\ud83c\udfc8', '\ud83e\udd47', '\u26bd', '\ud83c\udfc1'];
  const times = ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago'];

  const comments: { name: string; text: string; avatar: string; time: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = seededInt(playerName, week, `fc${i}`, 0, pool.length - 1);
    const nIdx = seededInt(playerName, week, `fn${i}`, 0, names.length - 1);
    comments.push({
      name: names[nIdx],
      text: pool[idx],
      avatar: avatars[nIdx],
      time: times[i],
    });
  }
  return comments;
}

// ============================================================
// Social Media Data Generator
// ============================================================
function generateSocialProfiles(playerName: string, overall: number, reputation: number, week: number): SocialProfile[] {
  const firstName = playerName.split(' ')[0];
  const lastName = playerName.split(' ').pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'player';
  const baseFollowers = reputation * 800 + overall * 500 + week * 50;
  return [
    {
      platform: 'X (Twitter)',
      icon: <Megaphone className="h-4 w-4" />,
      handle: `@${lastName}_official`,
      followers: Math.max(500, baseFollowers + seededInt(playerName, week, 'tw', 100, 2000)),
      color: 'text-sky-400',
    },
    {
      platform: 'Instagram',
      icon: <Camera className="h-4 w-4" />,
      handle: `@${firstName}.${lastName}`,
      followers: Math.max(800, baseFollowers * 1.5 + seededInt(playerName, week, 'ig', 200, 3000)),
      color: 'text-pink-400',
    },
    {
      platform: 'TikTok',
      icon: <Music className="h-4 w-4" />,
      handle: `@${lastName}.fc`,
      followers: Math.max(200, baseFollowers * 0.8 + seededInt(playerName, week, 'tt', 50, 1500)),
      color: 'text-violet-400',
    },
  ];
}

function generateSocialPosts(playerName: string, week: number, season: number, form: number, goals: number): SocialPost[] {
  const posts: SocialPost[] = [];
  const templates = [
    { text: `Matchday ready \ud83d\udcaa Let\u2019s get the 3 points today! ${week}th matchday of the season.`, platform: 'X (Twitter)' },
    { text: `Great win today! The boys were incredible. Proud of the team effort. On to the next one! \u26bd`, platform: 'Instagram' },
    { text: `Grinding in training \ud83d\udaaa Working on the details. Every session counts towards matchday.`, platform: 'TikTok' },
    { text: `Another week, another opportunity to prove myself. The hard work never stops. \ud83d\ude80`, platform: 'X (Twitter)' },
    { text: `Behind the scenes of a typical matchday. From breakfast to the final whistle. \u26bd\ud83c\udfa8`, platform: 'Instagram' },
  ];

  if (form >= 7.5) {
    templates.push({ text: `Form is unreal right now. Feeling confident and the results show it. Keep believing! \ud83d\ude4c`, platform: 'TikTok' });
  }
  if (goals > 0) {
    templates.push({ text: `That feeling when it hits the back of the net \ud83d\udd25 ${goals} goal${goals > 1 ? 's' : ''} this season and counting!`, platform: 'Instagram' });
  }

  for (let i = 0; i < Math.min(5, templates.length); i++) {
    const t = templates[i];
    const engagement = seededInt(playerName, week, `pe${i}`, 15, 95);
    const baseLikes = engagement * (reputation > 30 ? 50 : 10);
    posts.push({
      id: `sp-${week}-${i}`,
      platform: t.platform,
      text: t.text,
      timestamp: `${i + 1}d ago`,
      likes: seededInt(playerName, week, `pl${i}`, Math.floor(baseLikes * 0.5), Math.floor(baseLikes * 2)),
      comments: seededInt(playerName, week, `pc${i}`, Math.floor(baseLikes * 0.05), Math.floor(baseLikes * 0.3)),
      shares: seededInt(playerName, week, `ps${i}`, Math.floor(baseLikes * 0.02), Math.floor(baseLikes * 0.15)),
      engagementRate: engagement,
    });
  }
  return posts;
}

const NEW_POST_TEMPLATES = [
  'Just finished an incredible training session. The improvements are showing! 💪',
  'Life as a professional footballer. Every day is a new challenge and I love it. ⚽',
  'Thank you to all the fans for the incredible support! You push me to be better every single day. ❤️',
  'New boots, new energy. Ready for whatever comes next this season! ⚡',
  'Recovery day. Ice bath, good food, rest. The grind never stops. 🧊',
  'Matchday vibes. Nothing beats the feeling of walking out onto the pitch. 🏟️',
  'Behind the scenes: gym session with the team. Pushing each other to new limits. 🏋️',
  'Season so far: lessons learned, memories made, hungry for more. The best is yet to come! 🔥',
];

// ============================================================
// Endorsements Generator
// ============================================================
function generateEndorsements(playerName: string, overall: number, reputation: number, week: number): SponsorOffer[] {
  const marketability = overall * 0.5 + reputation * 0.5;
  const sponsors = [
    { brand: 'Nike Football', category: 'Sportswear', icon: '\ud83d\udc63', baseAmount: 3000 },
    { brand: 'Adidas', category: 'Sportswear', icon: '\u26bd', baseAmount: 2500 },
    { brand: 'Red Bull', category: 'Energy', icon: '\ud83e\uddca', baseAmount: 2000 },
    { brand: 'Puma', category: 'Sportswear', icon: '\ud83d\udee3\ufe0f', baseAmount: 1800 },
    { brand: 'Head & Shoulders', category: 'Grooming', icon: '\ud83d\udc87', baseAmount: 800 },
    { brand: 'EA Sports FC', category: 'Gaming', icon: '\ud83c\udfae', baseAmount: 2200 },
    { brand: 'Gatorade', category: 'Sports Drink', icon: '\ud83e\uddcb', baseAmount: 1200 },
    { brand: 'Beats by Dre', category: 'Audio', icon: '\ud83c\udfa7', baseAmount: 1500 },
  ];

  const selected: SponsorOffer[] = [];
  const available = Math.min(5, Math.max(3, Math.floor(marketability / 15)));

  for (let i = 0; i < available && i < sponsors.length; i++) {
    const s = sponsors[seededInt(playerName, week, `sp${i}`, 0, sponsors.length - 1)];
    const mult = 0.5 + (marketability / 100) * 1.5;
    const durations = [12, 24, 52];
    const reqs = ['Post 2x/month', 'Wear brand at events', 'Appear in 1 ad campaign', 'Use hashtag in posts', 'Attend brand event quarterly'];
    selected.push({
      id: `end-${i}`,
      brand: s.brand,
      category: s.category,
      icon: s.icon,
      weeklyAmount: Math.floor(s.baseAmount * mult),
      requirements: reqs[seededInt(playerName, week, `sr${i}`, 0, reqs.length - 1)],
      duration: durations[seededInt(playerName, week, `sd${i}`, 0, durations.length - 1)],
      accepted: false,
      rejected: false,
    });
  }
  return selected;
}

// ============================================================
// Brand Score Calculator
// ============================================================
function calculateBrandScore(player: { overall: number; form: number; potential: number; reputation: number; age: number; careerStats: { totalGoals: number; totalAppearances: number } }): BrandScoreData {
  const { overall, form, potential, reputation, age, careerStats } = player;

  const performanceScore = Math.min(100, (overall / 99) * 40 + (form / 10) * 30 + (careerStats.totalGoals / 50) * 30);
  const imageScore = Math.min(100, reputation * 0.7 + (form > 7 ? 20 : form > 5 ? 10 : 0) + (age < 25 ? 15 : 5));
  const consistencyScore = Math.min(100, form * 10 + (careerStats.totalAppearances > 30 ? 20 : careerStats.totalAppearances * 0.7));
  const potentialScore = Math.min(100, ((potential - overall + 10) / 20) * 50 + (age < 23 ? 30 : age < 27 ? 20 : 10));
  const ageScore = age <= 22 ? 95 : age <= 25 ? 85 : age <= 28 ? 70 : age <= 31 ? 50 : 30;

  const overall = Math.round(performanceScore * 0.3 + imageScore * 0.25 + consistencyScore * 0.2 + potentialScore * 0.15 + ageScore * 0.1);

  const categories: BrandCategory[] = [
    { name: 'Performance', score: Math.round(performanceScore), icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
    { name: 'Image', score: Math.round(imageScore), icon: <Star className="h-3.5 w-3.5" />, color: 'text-amber-400' },
    { name: 'Consistency', score: Math.round(consistencyScore), icon: <Target className="h-3.5 w-3.5" />, color: 'text-sky-400' },
    { name: 'Potential', score: Math.round(potentialScore), icon: <Sparkles className="h-3.5 w-3.5" />, color: 'text-violet-400' },
    { name: 'Age Factor', score: Math.round(ageScore), icon: <Zap className="h-3.5 w-3.5" />, color: 'text-orange-400' },
  ];

  const avgPlayerScore = Math.max(20, 55 + Math.round((overall - 65) * 0.3));

  const tips: string[] = [];
  if (performanceScore < 60) tips.push('Improve your match ratings and goal contributions to boost your performance score.');
  if (imageScore < 60) tips.push('Build your reputation through consistent performances and positive media interactions.');
  if (consistencyScore < 60) tips.push('Maintain steady form week over week. Avoid big dips in match ratings.');
  if (potentialScore < 60) tips.push('Focus on training to close the gap between your current and potential ability.');
  if (ageScore < 60) tips.push('Age factor is declining. Compensate with leadership and experience-based brand building.');
  if (tips.length === 0) tips.push('Your brand is in excellent shape! Keep performing at this elite level.');

  return { overall: Math.min(99, Math.max(1, overall)), categories, avgPlayerScore, tips };
}

// ============================================================
// Sub-Components
// ============================================================

/** Mini bar chart for fan growth */
function FanGrowthChart({ history }: { history: number[] }) {
  const max = Math.max(...history, 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {history.map((val, i) => {
        const pct = Math.max(8, (val / max) * 100);
        const isLast = i === history.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[8px] text-[#8b949e]">{formatNumber(val)}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '52px' }}>
              <motion.div
                className={`w-full max-w-[20px] ${isLast ? 'bg-emerald-500' : 'bg-[#30363d]'} rounded-sm`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, height: `${pct}%` }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[7px] text-[#484f58]">W{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Demographics bar */
function DemographicsBar({ local, national, international }: { local: number; national: number; international: number }) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-sm overflow-hidden h-3">
        <motion.div
          className="bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${local}%` }}
          transition={{ duration: 0.4 }}
          style={{ width: `${local}%` }}
        />
        <motion.div
          className="bg-amber-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${national}%` }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ width: `${national}%` }}
        />
        <motion.div
          className="bg-sky-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${international}%` }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: `${international}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[10px] text-[#8b949e]"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Local {local}%</span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8b949e]"><span className="w-2 h-2 rounded-sm bg-amber-500" /> National {national}%</span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8b949e]"><span className="w-2 h-2 rounded-sm bg-sky-500" /> International {international}%</span>
      </div>
    </div>
  );
}

/** Fan mood display */
function FanMoodDisplay({ mood, score }: { mood: FanMood; score: number }) {
  const cfg = getMoodConfig(mood);
  const direction = score >= 60 ? <TrendingUp className="h-3.5 w-3.5" /> : score >= 40 ? <Minus className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg ${cfg.bg} flex items-center justify-center text-2xl`}>{cfg.emoji}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          <span className={`${cfg.color}`}>{direction}</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
          <motion.div
            className={`h-full rounded-sm ${mood === 'ecstatic' || mood === 'happy' ? 'bg-emerald-500' : mood === 'neutral' ? 'bg-amber-500' : 'bg-red-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${score}%` }}
            transition={{ duration: 0.5 }}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <span className={`text-lg font-bold ${cfg.color}`}>{score}</span>
    </div>
  );
}

/** Fan comment card */
function FanComment({ comment, index }: { comment: { name: string; text: string; avatar: string; time: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
      className="flex gap-2.5 p-2.5 rounded-lg hover:bg-[#21262d] transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-sm shrink-0">{comment.avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#c9d1d9]">{comment.name}</span>
          <span className="text-[10px] text-[#484f58]">{comment.time}</span>
        </div>
        <p className="text-[11px] text-[#8b949e] leading-relaxed mt-0.5">{comment.text}</p>
      </div>
    </motion.div>
  );
}

/** Social profile card */
function SocialProfileCard({ profile }: { profile: SocialProfile }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
      <div className={`w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center ${profile.color}`}>{profile.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#c9d1d9]">{profile.platform}</p>
        <p className="text-[10px] text-[#8b949e]">{profile.handle}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-[#c9d1d9]">{formatNumber(profile.followers)}</p>
        <p className="text-[9px] text-[#484f58]">followers</p>
      </div>
    </div>
  );
}

/** Social post card */
function SocialPostCard({ post, index }: { post: SocialPost; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-sky-400">{post.platform}</span>
          <span className="text-[10px] text-[#484f58]">{post.timestamp}</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">{post.text}</p>
        <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-[#21262d]">
          <span className="flex items-center gap-1 text-[10px] text-[#8b949e]"><Heart className="h-3 w-3 text-rose-400" /> {formatNumber(post.likes)}</span>
          <span className="flex items-center gap-1 text-[10px] text-[#8b949e]"><MessageCircle className="h-3 w-3 text-sky-400" /> {formatNumber(post.comments)}</span>
          <span className="flex items-center gap-1 text-[10px] text-[#8b949e]"><Share2 className="h-3 w-3 text-emerald-400" /> {formatNumber(post.shares)}</span>
          <span className="ml-auto text-[10px] font-medium text-amber-400">{post.engagementRate}%</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Sponsorship offer card */
function SponsorshipCard({ offer, onAccept, onReject }: { offer: SponsorOffer; onAccept: () => void; onReject: () => void }) {
  if (offer.accepted) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-lg">{offer.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#c9d1d9]">{offer.brand}</span>
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          </div>
          <p className="text-[10px] text-[#8b949e]">{offer.category} &middot; {offer.duration} weeks &middot; {formatMoney(offer.weeklyAmount)}/wk</p>
        </div>
      </div>
    );
  }
  if (offer.rejected) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 opacity-60">
        <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-lg">{offer.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#c9d1d9] line-through">{offer.brand}</span>
            <XCircle className="h-3 w-3 text-red-400" />
          </div>
          <p className="text-[10px] text-[#8b949e]">Declined</p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-lg">{offer.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#c9d1d9]">{offer.brand}</p>
            <p className="text-[10px] text-[#8b949e]">{offer.category}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-400">{formatMoney(offer.weeklyAmount)}</p>
            <p className="text-[9px] text-[#484f58]">/week</p>
          </div>
        </div>
        <div className="space-y-1 mb-2.5">
          <p className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-medium">Duration:</span> {offer.duration} weeks ({Math.round(offer.duration / 4.3)} months)</p>
          <p className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-medium">Requires:</span> {offer.requirements}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAccept}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px] border-[#30363d] text-[#8b949e] hover:bg-[#21262d]" onClick={onReject}>
            <XCircle className="h-3 w-3 mr-1" /> Decline
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/** Brand score category row */
function BrandCategoryRow({ cat, avg }: { cat: BrandCategory; avg: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center ${cat.color}`}>{cat.icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#c9d1d9] font-medium">{cat.name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#484f58]">avg {avg}</span>
            <span className={`text-[11px] font-bold ${cat.score >= avg ? 'text-emerald-400' : 'text-red-400'}`}>
              {cat.score}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-sm overflow-hidden relative">
          <motion.div
            className={`absolute top-0 h-full rounded-sm ${cat.score >= avg ? 'bg-emerald-500' : 'bg-red-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, width: `${cat.score}%` }}
            transition={{ duration: 0.4 }}
            style={{ width: `${cat.score}%` }}
          />
          <div className="absolute top-0 h-full w-px bg-amber-500/50" style={{ left: `${avg}%` }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function FanEngagement() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState('fans');
  const [endorsements, setEndorsements] = useState<SponsorOffer[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [initialised, setInitialised] = useState(false);

  const player = gameState?.player;
  const week = gameState?.currentWeek ?? 1;
  const season = gameState?.currentSeason ?? 1;

  // Initialize endorsements and posts once
  useMemo(() => {
    if (!player || initialised) return;
    setEndorsements(generateEndorsements(player.name, player.overall, player.reputation, week));
    setPosts(generateSocialPosts(player.name, week, season, player.form, player.seasonStats.goals));
    setInitialised(true);
  }, [player, week, initialised]);

  // Computed data
  const fanData = useMemo(() => {
    if (!player) return null;
    return generateFanData(player.name, week, season, player.overall, player.form, player.reputation, player.seasonStats.goals);
  }, [player, week, season]);

  const fanComments = useMemo(() => {
    if (!player || !fanData) return [];
    return generateFanComments(player.name, week, player.form, fanData.mood);
  }, [player, week, fanData]);

  const socialProfiles = useMemo(() => {
    if (!player) return [];
    return generateSocialProfiles(player.name, player.overall, player.reputation, week);
  }, [player, week]);

  const brandScore = useMemo(() => {
    if (!player) return null;
    return calculateBrandScore(player);
  }, [player]);

  const activeEndorsements = useMemo(() => endorsements.filter(e => e.accepted), [endorsements]);
  const totalWeeklyEndorsementIncome = useMemo(() => activeEndorsements.reduce((sum, e) => sum + e.weeklyAmount, 0), [activeEndorsements]);
  const totalMonthlyEndorsementIncome = Math.round(totalWeeklyEndorsementIncome * 4.3);

  const handleAcceptEndorsement = (id: string) => {
    setEndorsements(prev => prev.map(e => e.id === id ? { ...e, accepted: true } : e));
  };
  const handleRejectEndorsement = (id: string) => {
    setEndorsements(prev => prev.map(e => e.id === id ? { ...e, rejected: true } : e));
  };
  const handleNewPost = () => {
    if (!player) return;
    const template = NEW_POST_TEMPLATES[seededInt(player.name, Date.now(), 'np', 0, NEW_POST_TEMPLATES.length - 1)];
    const platforms = ['X (Twitter)', 'Instagram', 'TikTok'];
    const newPost: SocialPost = {
      id: `custom-${Date.now()}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      text: template,
      timestamp: 'Just now',
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 50) + 10,
      shares: Math.floor(Math.random() * 30) + 5,
      engagementRate: Math.floor(Math.random() * 40) + 20,
    };
    setPosts(prev => [newPost, ...prev].slice(0, 10));
  };

  if (!gameState || !player || !fanData || !brandScore) return null;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-[#c9d1d9]">Fan Engagement</h2>
        </div>
        <p className="text-xs text-[#8b949e]">
          Manage your brand, fans, and social presence
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full bg-[#21262d] h-9 p-0.5">
            <TabsTrigger value="fans" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400">
              <Users className="h-3 w-3 mr-1" /> Fans
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-sky-400">
              <Globe className="h-3 w-3 mr-1" /> Social
            </TabsTrigger>
            <TabsTrigger value="endorsements" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-amber-400">
              <Megaphone className="h-3 w-3 mr-1" /> Deals
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-violet-400">
              <Star className="h-3 w-3 mr-1" /> Brand
            </TabsTrigger>
          </TabsList>

          {/* ====== TAB 1: FAN BASE ====== */}
          <TabsContent value="fans" className="mt-3 space-y-3">
            {/* Fan Count */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Total Fans</p>
                      <p className="text-2xl font-bold text-[#c9d1d9] mt-0.5">{formatNumber(fanData.totalFans)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fan Growth Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Fan Growth (Last 10 Weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <FanGrowthChart history={fanData.growthHistory} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Demographics */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" /> Fan Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <DemographicsBar {...fanData.demographics} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Fan Mood */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.15 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-400" /> Fan Mood
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <FanMoodDisplay mood={fanData.mood} score={fanData.moodScore} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Fan Comments */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-amber-400" /> Fan Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2 max-h-72 overflow-y-auto">
                  <div className="divide-y divide-[#21262d]">
                    {fanComments.map((c, i) => <FanComment key={i} comment={c} index={i} />)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ====== TAB 2: SOCIAL MEDIA ====== */}
          <TabsContent value="social" className="mt-3 space-y-3">
            {/* Social Profiles */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-sky-400" /> Your Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {socialProfiles.map((p, i) => (
                    <motion.div key={p.platform} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <SocialProfileCard profile={p} />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* New Post Button */}
            <Button className="w-full h-9 bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5" onClick={handleNewPost}>
              <PlusCircle className="h-3.5 w-3.5" /> Create New Post
            </Button>

            {/* Posts Timeline */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" /> Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 max-h-96 overflow-y-auto space-y-2">
                  {posts.map((p, i) => <SocialPostCard key={p.id} post={p} index={i} />)}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ====== TAB 3: ENDORSEMENTS ====== */}
          <TabsContent value="endorsements" className="mt-3 space-y-3">
            {/* Income Summary */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Endorsement Income</p>
                      <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatMoney(totalWeeklyEndorsementIncome)}<span className="text-xs text-[#8b949e] font-normal">/wk</span></p>
                      <p className="text-[10px] text-[#8b949e] mt-0.5">{formatMoney(totalMonthlyEndorsementIncome)}/month &middot; {activeEndorsements.length} active deal{activeEndorsements.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Available Offers */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Sponsorship Offers
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2 max-h-96 overflow-y-auto">
                  {endorsements.map(e => (
                    <SponsorshipCard
                      key={e.id}
                      offer={e}
                      onAccept={() => handleAcceptEndorsement(e.id)}
                      onReject={() => handleRejectEndorsement(e.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ====== TAB 4: BRAND SCORE ====== */}
          <TabsContent value="brand" className="mt-3 space-y-3">
            {/* Overall Brand Score */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-violet-400">{brandScore.overall}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Marketability Score</p>
                    <p className="text-sm font-semibold text-[#c9d1d9] mt-0.5">
                      {brandScore.overall >= 80 ? 'Elite Level' : brandScore.overall >= 60 ? 'Rising Star' : brandScore.overall >= 40 ? 'Developing' : 'Early Stage'}
                    </p>
                    <div className="mt-2 h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
                      <motion.div
                        className="h-full rounded-sm bg-violet-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, width: `${brandScore.overall}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ width: `${brandScore.overall}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-sky-400" /> Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  {brandScore.categories.map(cat => (
                    <BrandCategoryRow key={cat.name} cat={cat} avg={brandScore.avgPlayerScore} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Comparison */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400" /> Position Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-[#8b949e]">You</p>
                      <p className="text-lg font-bold text-emerald-400">{brandScore.overall}</p>
                    </div>
                    <div className="text-xs text-[#484f58]">vs</div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-[#8b949e]">Avg {player.position}</p>
                      <p className="text-lg font-bold text-amber-400">{brandScore.avgPlayerScore}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    {brandScore.overall >= brandScore.avgPlayerScore ? (
                      <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
                        <TrendingUp className="h-3 w-3 mr-1" /> Above average
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/15">
                        <TrendingDown className="h-3 w-3 mr-1" /> Below average
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.15 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Tips to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <ul className="space-y-2">
                    {brandScore.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-[11px] text-[#8b949e] leading-relaxed">
                        <span className="text-emerald-400 shrink-0 mt-0.5">&#8226;</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
