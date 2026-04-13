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
  ShoppingCart,
  Ticket,
  Hash,
  Percent,
  UserCheck,
  Calendar,
  Award,
  Volume2,
  Clock,
  Crown,
  Shield,
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

interface FanRegion {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface LoyaltyTier {
  name: string;
  threshold: number;
  color: string;
  bgColor: string;
  rewards: string[];
}

interface AtmosphereFactor {
  name: string;
  value: number;
  color: string;
}

interface HistoricalAtmosphere {
  opponent: string;
  competition: string;
  rating: number;
  sparkline: number[];
}

interface FanEvent {
  name: string;
  date: string;
  location: string;
  capacity: number;
  registered: number;
  players: string[];
  status: 'open' | 'limited' | 'full';
}

interface PastEvent {
  name: string;
  attendance: number;
  rating: number;
  description: string;
}

interface ChantData {
  text: string;
  occasion: string;
  popularity: number;
}

interface ClubTradition {
  name: string;
  description: string;
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

function generateSocialPosts(playerName: string, week: number, season: number, form: number, goals: number, reputation: number): SocialPost[] {
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
  const { overall: playerOverall, form, potential, reputation, age, careerStats } = player;

  const performanceScore = Math.min(100, (playerOverall / 99) * 40 + (form / 10) * 30 + (careerStats.totalGoals / 50) * 30);
  const imageScore = Math.min(100, reputation * 0.7 + (form > 7 ? 20 : form > 5 ? 10 : 0) + (age < 25 ? 15 : 5));
  const consistencyScore = Math.min(100, form * 10 + (careerStats.totalAppearances > 30 ? 20 : careerStats.totalAppearances * 0.7));
  const potentialScore = Math.min(100, ((potential - playerOverall + 10) / 20) * 50 + (age < 23 ? 30 : age < 27 ? 20 : 10));
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
// Fan Community Hub Data Generator
// ============================================================
function generateFanCommunityData(playerName: string, week: number, reputation: number, overall: number): {
  fanClubMembers: number;
  socialFollowers: number;
  globalRanking: number;
  regions: FanRegion[];
  monthlyGrowth: number[];
  fanOfMonth: { name: string; location: string; dedication: string; yearsActive: number };
} {
  const totalBase = 1000 + reputation * 500 + overall * 200;
  const fanClubMembers = Math.round(totalBase * 0.15 + seededInt(playerName, week, 'fcm', 100, 2000));
  const socialFollowers = Math.round(totalBase * 0.6 + seededInt(playerName, week, 'sf', 500, 5000));
  const globalRanking = Math.max(1, 200 - reputation * 5 - overall * 2 - seededInt(playerName, week, 'gr', 0, 50));

  const regionBase = [
    { name: 'Home City', mult: 0.42, color: '#34d399' },
    { name: 'National', mult: 0.24, color: '#3b82f6' },
    { name: 'Europe', mult: 0.15, color: '#f59e0b' },
    { name: 'Americas', mult: 0.08, color: '#ef4444' },
    { name: 'Asia', mult: 0.06, color: '#a78bfa' },
    { name: 'Rest of World', mult: 0.05, color: '#8b949e' },
  ];
  const jitter = regionBase.map((r, i) => r.mult + (seededInt(playerName, week, `rj${i}`, 0, 6) - 3) / 100);
  const totalJitter = jitter.reduce((s, v) => s + v, 0);
  const regions: FanRegion[] = regionBase.map((r, i) => {
    const pct = Math.round((jitter[i] / totalJitter) * 100);
    return {
      name: r.name,
      count: Math.round(totalBase * (pct / 100)) + seededInt(playerName, week, `rc${i}`, 50, 500),
      percentage: pct,
      color: r.color,
    };
  });

  const monthlyGrowth: number[] = [];
  let prevG = totalBase * 0.4;
  for (let i = 0; i < 12; i++) {
    prevG = Math.max(100, prevG + seededInt(playerName, week - 11 + i, `mg${i}`, -80, 300));
    monthlyGrowth.push(Math.floor(prevG));
  }

  const fanNames = ['Marco Rossi', 'Sarah Chen', 'James Wilson', 'Yuki Tanaka', 'Carlos Mendez', 'Emma Anderson', 'Ahmed Hassan', 'Liam O\'Brien'];
  const locations = ['Milan, Italy', 'London, UK', 'Buenos Aires, Argentina', 'Tokyo, Japan', 'Munich, Germany', 'Sao Paulo, Brazil', 'Lagos, Nigeria', 'Sydney, Australia'];
  const dedications = [
    'Attended every home match for 8 years straight',
    'Travels 500km round trip for every home game',
    'Runs the largest unofficial fan podcast',
    'Founded the youth supporters academy',
    'Organizes charity events in the club\'s name',
    'Maintains the club\'s historical archive',
    'Created the fan art murals around the stadium',
    'Volunteers at the club\'s community outreach program',
  ];
  const foIdx = seededInt(playerName, week, 'fom', 0, fanNames.length - 1);

  return {
    fanClubMembers,
    socialFollowers,
    globalRanking,
    regions,
    monthlyGrowth,
    fanOfMonth: {
      name: fanNames[foIdx],
      location: locations[foIdx],
      dedication: dedications[foIdx],
      yearsActive: seededInt(playerName, week, 'foya', 3, 25),
    },
  };
}

// ============================================================
// Fan Loyalty Program Data Generator
// ============================================================
function generateLoyaltyData(playerName: string, week: number, reputation: number, overall: number): {
  currentPoints: number;
  weeklyEarningRate: number;
  currentTierIndex: number;
  tierProgress: number;
  tiers: LoyaltyTier[];
} {
  const tiers: LoyaltyTier[] = [
    {
      name: 'Bronze',
      threshold: 0,
      color: '#cd7f32',
      bgColor: 'bg-amber-700/15',
      rewards: ['5% merch discount', 'Birthday message from team', 'Early newsletter access', 'Fan forum badge'],
    },
    {
      name: 'Silver',
      threshold: 1000,
      color: '#8b949e',
      bgColor: 'bg-slate-500/15',
      rewards: ['10% merch discount', 'Early ticket access (24h)', 'Exclusive digital content', 'Monthly fan quiz entry'],
    },
    {
      name: 'Gold',
      threshold: 5000,
      color: '#f59e0b',
      bgColor: 'bg-amber-500/15',
      rewards: ['20% merch discount', 'Priority ticket access', 'Meet & greet lottery entry', 'Signed memorabilia draw'],
    },
    {
      name: 'Platinum',
      threshold: 15000,
      color: '#a78bfa',
      bgColor: 'bg-violet-500/15',
      rewards: ['30% merch discount', 'VIP match experience', 'Stadium tour with player', 'Personal thank-you video'],
    },
  ];

  const earnedPoints = reputation * 150 + overall * 80 + week * seededInt(playerName, week, 'ler', 20, 60);
  const currentPoints = Math.max(100, earnedPoints);
  const weeklyEarningRate = Math.round(reputation * 3 + overall * 1.5 + seededInt(playerName, week, 'wpe', 10, 50));

  let currentTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (currentPoints >= tiers[i].threshold) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];
  const tierProgress = nextTier
    ? Math.round(((currentPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100)
    : 100;

  return { currentPoints, weeklyEarningRate, currentTierIndex, tierProgress: Math.min(100, tierProgress), tiers };
}

// ============================================================
// Matchday Atmosphere Data Generator
// ============================================================
function generateAtmosphereData(playerName: string, week: number, reputation: number, form: number): {
  predictedAtmosphere: number;
  factors: AtmosphereFactor[];
  historical: HistoricalAtmosphere[];
  tifosi: { description: string; flagColors: string[] };
} {
  const rivals = ['United', 'City', 'Arsenal', 'Chelsea', 'Liverpool', 'Bayern', 'Barcelona', 'Juventus', 'PSG', 'Dortmund'];
  const competitions = ['League', 'Cup', 'Champions League', 'Europa League'];

  const predictedAtmosphere = Math.min(100, Math.max(15, Math.round(
    form * 8 + reputation * 1.5 + seededInt(playerName, week, 'pa', 5, 30)
  )));

  const factors: AtmosphereFactor[] = [
    { name: 'Rivalry Level', value: seededInt(playerName, week, 'frl', 30, 95), color: '#ef4444' },
    { name: 'Competition Importance', value: seededInt(playerName, week, 'fci', 40, 100), color: '#f59e0b' },
    { name: 'Match Time', value: seededInt(playerName, week, 'fmt', 50, 90), color: '#3b82f6' },
    { name: 'Recent Form', value: Math.round(form * 10), color: '#34d399' },
    { name: 'Ticket Demand', value: seededInt(playerName, week, 'ftd', 40, 100), color: '#a78bfa' },
  ];

  const historical: HistoricalAtmosphere[] = [];
  for (let i = 0; i < 5; i++) {
    const baseRating = seededInt(playerName, week - i - 1, `hr${i}`, 40, 95);
    const sparkline: number[] = [];
    for (let j = 0; j < 6; j++) {
      sparkline.push(seededInt(playerName, week - i - 1, `hs${i}${j}`, 20, 95));
    }
    sparkline[5] = baseRating;
    historical.push({
      opponent: rivals[seededInt(playerName, week - i - 1, `ho${i}`, 0, rivals.length - 1)],
      competition: competitions[seededInt(playerName, week - i - 1, `hc${i}`, 0, competitions.length - 1)],
      rating: baseRating,
      sparkline,
    });
  }

  const tifosiDescriptions = [
    'Full stadium tifo display with player portraits and club crest, spanning three stands',
    'Coordinated card display creating a giant team flag, with drummers in the kop stand',
    'Choreographed pyrotechnic display with two giant banners reading "Until the End"',
    'Mosaic display of the club motto across the entire stadium, synchronized chanting',
    'Giant player silhouette flags in the curva, smoke display in team colors',
  ];
  const tifosiIdx = seededInt(playerName, week, 'tif', 0, tifosiDescriptions.length - 1);
  const flagColorSets = [
    ['#ef4444', '#ffffff', '#34d399'],
    ['#f59e0b', '#21262d', '#f59e0b'],
    ['#3b82f6', '#ffffff', '#3b82f6'],
    ['#ef4444', '#21262d', '#a78bfa'],
    ['#34d399', '#ffffff', '#ef4444'],
  ];

  return {
    predictedAtmosphere,
    factors,
    historical,
    tifosi: {
      description: tifosiDescriptions[tifosiIdx],
      flagColors: flagColorSets[tifosiIdx],
    },
  };
}

// ============================================================
// Fan Interaction Events Data Generator
// ============================================================
function generateFanEvents(playerName: string, week: number, reputation: number): {
  upcoming: FanEvent[];
  past: PastEvent[];
} {
  const playerNames = [
    `${playerName}`,
    'Team Captain',
    'Head Coach',
    'Academy Director',
  ];
  const events: FanEvent[] = [
    {
      name: 'Open Training Session',
      date: `Week ${week + 1}, Saturday`,
      location: 'Main Training Ground',
      capacity: 500 + reputation * 20,
      registered: Math.round((500 + reputation * 20) * (0.4 + seededInt(playerName, week, 'er1', 0, 50) / 100)),
      players: [playerName, playerNames[1]],
      status: 'open',
    },
    {
      name: 'Fan Meet & Greet',
      date: `Week ${week + 2}, Wednesday`,
      location: 'Club Store Downtown',
      capacity: 200,
      registered: Math.round(200 * (0.6 + seededInt(playerName, week, 'er2', 0, 40) / 100)),
      players: [playerName],
      status: 'limited',
    },
    {
      name: 'Charity Match',
      date: `Week ${week + 3}, Sunday`,
      location: 'Academy Stadium',
      capacity: 2000 + reputation * 50,
      registered: Math.round((2000 + reputation * 50) * (0.7 + seededInt(playerName, week, 'er3', 0, 30) / 100)),
      players: [playerName, playerNames[1], playerNames[2]],
      status: 'limited',
    },
    {
      name: 'Stadium Tour',
      date: `Week ${week + 1}, Friday`,
      location: 'Main Stadium',
      capacity: 80,
      registered: Math.round(80 * (0.8 + seededInt(playerName, week, 'er4', 0, 20) / 100)),
      players: [],
      status: 'full',
    },
  ];

  const pastDescriptions = [
    `${playerName} signed autographs for over 200 fans and posed for photos.`,
    'The youth academy showcase drew record attendance with families enjoying the day.',
    'Fans got an exclusive behind-the-scenes look at the training facilities.',
  ];
  const past: PastEvent[] = [
    {
      name: 'Season Kickoff Event',
      attendance: 800 + reputation * 30 + seededInt(playerName, week, 'pa1', 50, 500),
      rating: seededInt(playerName, week, 'pr1', 70, 98),
      description: pastDescriptions[0],
    },
    {
      name: 'Academy Open Day',
      attendance: 400 + reputation * 10 + seededInt(playerName, week, 'pa2', 30, 300),
      rating: seededInt(playerName, week, 'pr2', 65, 95),
      description: pastDescriptions[1],
    },
    {
      name: 'Training Ground Visit',
      attendance: 150 + reputation * 5 + seededInt(playerName, week, 'pa3', 20, 100),
      rating: seededInt(playerName, week, 'pr3', 75, 99),
      description: pastDescriptions[2],
    },
  ];

  return { upcoming: events, past };
}

// ============================================================
// Supporter Chants & Culture Data Generator
// ============================================================
function generateChantsData(playerName: string, week: number): {
  chants: ChantData[];
  traditions: ClubTradition[];
  mottos: string[];
} {
  const chants: ChantData[] = [
    {
      text: `Oh, ${playerName}, ${playerName}! We\'re gonna sing your name! From the terraces we rise, You\'ll bring us glory and fame!`,
      occasion: 'Goal',
      popularity: seededInt(playerName, week, 'cp0', 70, 98),
    },
    {
      text: `We are the boys from the stands, Loudest in all the lands! Singing for the red and white, We\'ll support you day and night!`,
      occasion: 'Pre-match',
      popularity: seededInt(playerName, week, 'cp1', 60, 90),
    },
    {
      text: `One ${playerName}! There\'s only one ${playerName}! Walking along, singing a song, Walking in a ${playerName} wonderland!`,
      occasion: 'Anytime',
      popularity: seededInt(playerName, week, 'cp2', 75, 99),
    },
    {
      text: `Allez, allez, allez! Allez, allez, allez! We are the champions, the kings of the pitch! Allez, allez!`,
      occasion: 'Pre-match',
      popularity: seededInt(playerName, week, 'cp3', 50, 85),
    },
    {
      text: `When the whistle blows and the game begins, We\'ll be right here through the wins and the pins! Stand up, stand up for the boys!`,
      occasion: 'Halftime',
      popularity: seededInt(playerName, week, 'cp4', 55, 88),
    },
    {
      text: `Glory, glory, ${playerName}! Glory, glory, ${playerName}! Glory, glory, ${playerName}! And the boys go marching on!`,
      occasion: 'Goal',
      popularity: seededInt(playerName, week, 'cp5', 65, 95),
    },
  ];

  const traditions: ClubTradition[] = [
    {
      name: 'The Walk of Heroes',
      description: 'Before every home match, fans line the player entrance route. Players walk through a corridor of supporters, touching the outstretched hands of the faithful.',
    },
    {
      name: 'The 12th Minute Roar',
      description: 'At exactly 12 minutes into every home game, the entire stadium rises to its feet for a coordinated roar, symbolizing that the fans are the 12th player.',
    },
    {
      name: 'The scarf ceremony',
      description: 'New fan club members receive an official club scarf in a pre-match ceremony, where they pledge their loyalty to the club alongside existing members.',
    },
  ];

  const mottos: string[] = [
    'Through thick and thin, we\'ll always sing!',
    'Born to support, sworn to stand!',
    'More than a club, more than a game!',
    'The pride of the city, the heart of the fans!',
  ];

  return { chants, traditions, mottos };
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
// NEW: Supporter Base Donut Chart (SVG)
// ============================================================
function SupporterDonutChart({ demographics, totalFans }: { demographics: { local: number; national: number; international: number }; totalFans: number }) {
  const home = demographics.local;
  const away = Math.round(demographics.national * 0.4);
  const intl = demographics.international;
  const casual = 100 - home - away - intl;
  const segments = [
    { label: 'Home', value: home, color: '#10b981' },
    { label: 'Away', value: away, color: '#38bdf8' },
    { label: 'International', value: intl, color: '#f59e0b' },
    { label: 'Casual', value: Math.max(0, casual), color: '#a855f7' },
  ];

  const cx = 40, cy = 40, r = 28, strokeWidth = 10;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const len = (seg.value / 100) * circumference;
    const dashArray = `${len} ${circumference - len}`;
    const dashOffset = -offset;
    offset += len;
    return { ...seg, dashArray, dashOffset };
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={strokeWidth}
            strokeDasharray={arc.dashArray} strokeDashoffset={arc.dashOffset} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[#c9d1d9]" fontSize="11" fontWeight="bold">{formatNumber(totalFans)}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" className="fill-[#8b949e]" fontSize="6">fans</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {segments.map(seg => (
          <span key={seg.label} className="flex items-center gap-1 text-[10px] text-[#8b949e]">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
            {seg.label} {seg.value}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// NEW: Engagement Trend Line Chart (SVG)
// ============================================================
function EngagementTrendChart({ data }: { data: number[] }) {
  const w = 280, h = 80, px = 30, py = 8, pw = w - px - 6, ph = h - py - 16;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * pw;
    const y = py + ph - ((v - min) / range) * ph;
    return `${x},${y}`;
  });
  const polyStr = pts.join(' ');
  const areaStr = `${pts[0]} ${pts.map(p => p.split(',')[0]).slice(1).join(' ')} ${pts[pts.length - 1]} ${px + pw},${py + ph} ${px},${py + ph}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.33, 0.66, 1].map((f, i) => {
        const y = py + ph - f * ph;
        const val = Math.round(min + f * range);
        return (
          <g key={i}>
            <line x1={px} y1={y} x2={px + pw} y2={y} stroke="#30363d" strokeWidth="0.5" />
            <text x={px - 4} y={y + 3} textAnchor="end" className="fill-[#8b949e]" fontSize="6">{val}</text>
          </g>
        );
      })}
      {/* Filled area */}
      <polygon points={areaStr} fill="#10b981" opacity="0.15" />
      {/* Line */}
      <polyline points={polyStr} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((v, i) => {
        const x = px + (i / (data.length - 1)) * pw;
        const y = py + ph - ((v - min) / range) * ph;
        return <circle key={i} cx={x} cy={y} r="2" fill="#10b981" />;
      })}
      {/* X-axis labels */}
      {data.map((_, i) => {
        const x = px + (i / (data.length - 1)) * pw;
        return <text key={i} x={x} y={h - 2} textAnchor="middle" className="fill-[#484f58]" fontSize="6">W{i + 1}</text>;
      })}
    </svg>
  );
}

// ============================================================
// NEW: Social Media Reach Card
// ============================================================
function SocialMediaReachCard({ profiles, playerName, week }: { profiles: SocialProfile[]; playerName: string; week: number }) {
  const totalFollowers = profiles.reduce((s, p) => s + p.followers, 0);
  const prevTotal = Math.max(100, totalFollowers - seededInt(playerName, week, 'st', 200, 2000));
  const trend = totalFollowers >= prevTotal ? 'up' : 'down';
  const trendPct = Math.round(Math.abs((totalFollowers - prevTotal) / prevTotal) * 100);
  const mentions = seededInt(playerName, week, 'sm', 50, 5000);
  const hashtagPop = seededInt(playerName, week, 'hp', 30, 95);
  const twPct = Math.round((profiles[0]?.followers ?? 0) / totalFollowers * 100);
  const igPct = Math.round((profiles[1]?.followers ?? 0) / totalFollowers * 100);
  const ttPct = 100 - twPct - igPct;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">Social Reach</p>
          <p className="text-xl font-bold text-[#c9d1d9] mt-0.5">{formatNumber(totalFollowers)}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trendPct}%
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Hash className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-[#8b949e]">Hashtag Popularity</span>
            <span className="text-[10px] font-bold text-amber-400">{hashtagPop}%</span>
          </div>
          <div className="h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
            <div className="h-full rounded-sm bg-amber-500" style={{ width: `${hashtagPop}%` }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        <span className="text-[11px] text-[#c9d1d9]">{formatNumber(mentions)} mentions this week</span>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] text-[#8b949e] font-medium">Platform Breakdown</p>
        {[{ label: 'Twitter', pct: twPct, color: 'bg-sky-500' }, { label: 'Instagram', pct: igPct, color: 'bg-pink-500' }, { label: 'TikTok', pct: Math.max(0, ttPct), color: 'bg-violet-500' }].map(p => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="text-[9px] text-[#8b949e] w-16">{p.label}</span>
            <div className="flex-1 h-2 bg-slate-700/50 rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm ${p.color}`} style={{ width: `${p.pct}%` }} />
            </div>
            <span className="text-[9px] text-[#c9d1d9] w-7 text-right">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// NEW: Terrace Chatter Section
// ============================================================
function TerraceChatter({ playerName, week, form, mood }: { playerName: string; week: number; form: number; mood: FanMood }) {
  const chatterPool = {
    ecstatic: [
      `We are going to win the league this season! ${playerName} is unreal!`,
      `Best atmosphere I've ever experienced at the ground. Incredible times!`,
      `${playerName} >> every other player in the league. Not even close.`,
      `The future is ours! With ${playerName} leading the charge, anything is possible!`,
    ],
    happy: [
      `Good run of form lately. ${playerName} looking sharp every match.`,
      `Top half finish looking likely. ${playerName} making the difference.`,
      `European football next season? With ${playerName}, why not!`,
      `Love watching this team play. ${playerName} brings something special.`,
    ],
    neutral: [
      `Decent season so far. Could go either way from here.`,
      `${playerName} needs to find consistency. Flashes of brilliance but too many quiet games.`,
      `Mid-table is fine for now, but we want more. Push on, lads!`,
      `The gaffer needs to sort out the tactics. ${playerName} can only do so much alone.`,
    ],
    frustrated: [
      `This is getting worrying. ${playerName} has gone off the boil recently.`,
      `How many points dropped from winning positions?! Unacceptable.`,
      `We need reinforcements in January. ${playerName} can't carry this team forever.`,
      `The board needs to back the manager. This squad isn't good enough.`,
    ],
    angry: [
      `RELEGATION BATTLE?! How has it come to this?!`,
      `${playerName} is wasted in this team. Honestly feel sorry for the lad.`,
      `Sack the manager! Sack the board! Disgrace of a season!`,
      `I've supported this club for 30 years and this is rock bottom. Disgraceful.`,
    ],
  };

  const pool = chatterPool[mood] ?? chatterPool.neutral;
  const selected = pool.slice(0, 3).map((text, i) => {
    const nIdx = seededInt(playerName, week, `tc${i}`, 0, 7);
    const names = ['TerraceLegend', 'COYS_88', 'NorthStandArmy', 'MatchDayDave', 'FaithfulFan', 'UltraVoice', 'StandUpIfYou', 'GroveEndCrew'];
    const avatars = ['\u26bd', '\ud83c\udfc6', '\ud83d\udd25', '\u2b50', '\ud83c\udfc8', '\ud83e\udd47', '\ud83d\udc63', '\ud83d\ude4c'];
    return { name: names[nIdx], text, avatar: avatars[nIdx] };
  });

  const moodColors: Record<FanMood, string> = {
    ecstatic: 'border-emerald-500/20',
    happy: 'border-emerald-500/10',
    neutral: 'border-[#30363d]',
    frustrated: 'border-orange-500/20',
    angry: 'border-red-500/20',
  };

  return (
    <div className="space-y-2">
      {selected.map((c, i) => (
        <div key={i} className={`flex gap-2.5 p-2.5 rounded-lg bg-[#161b22] border ${moodColors[mood]}`}>
          <div className="w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center text-xs shrink-0">{c.avatar}</div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-emerald-400">{c.name}</span>
            <p className="text-[11px] text-[#8b949e] leading-relaxed mt-0.5">{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// NEW: Merchandise Sales Card
// ============================================================
function MerchandiseSalesCard({ playerName, reputation, week }: { playerName: string; reputation: number; week: number }) {
  const jerseySales = Math.max(50, reputation * 30 + seededInt(playerName, week, 'js', 100, 2000));
  const seasonTickets = Math.max(500, reputation * 80 + seededInt(playerName, week, 'st', 200, 5000));
  const fillRate = Math.min(98, Math.max(55, reputation * 2 + seededInt(playerName, week, 'fr', 50, 85)));
  const capacity = 60000;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs text-[#8b949e] font-semibold">Merchandise & Tickets</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">\ud83d\udc63</span>
            <span className="text-[10px] text-[#8b949e]">Jersey Sales</span>
          </div>
          <span className="text-sm font-bold text-[#c9d1d9]">{formatNumber(jerseySales)}</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Ticket className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#8b949e]">Season Tickets</span>
          </div>
          <span className="text-sm font-bold text-[#c9d1d9]">{formatNumber(seasonTickets)}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#8b949e]">Stadium Fill Rate</span>
          <span className={`text-[10px] font-bold ${fillRate >= 90 ? 'text-emerald-400' : fillRate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>{fillRate}%</span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-sm overflow-hidden">
          <div className={`h-full rounded-sm ${fillRate >= 90 ? 'bg-emerald-500' : fillRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${fillRate}%` }} />
        </div>
        <span className="text-[9px] text-[#484f58]">{formatNumber(Math.round(capacity * fillRate / 100))} / {formatNumber(capacity)}</span>
      </div>
    </div>
  );
}

// ============================================================
// NEW: Fan Community Hub Sub-Component
// ============================================================
function FanCommunityHub({ data, totalFans }: { data: ReturnType<typeof generateFanCommunityData>; totalFans: number }) {
  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Fan Club Members', value: formatNumber(data.fanClubMembers), icon: <Shield className="h-3.5 w-3.5" />, color: 'text-[#34d399]' },
          { label: 'Social Followers', value: formatNumber(data.socialFollowers), icon: <Globe className="h-3.5 w-3.5" />, color: 'text-[#3b82f6]' },
          { label: 'Total Fans', value: formatNumber(totalFans), icon: <Users className="h-3.5 w-3.5" />, color: 'text-[#f59e0b]' },
          { label: 'Global Ranking', value: `#${data.globalRanking}`, icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-[#a78bfa]' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-[9px] text-[#8b949e]">{stat.label}</span>
            </div>
            <p className="text-sm font-bold text-[#c9d1d9]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Regional Demographics */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#3b82f6]" /> Fan Regions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {data.regions.map(region => (
            <div key={region.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#c9d1d9]">{region.name}</span>
                <span className="text-[10px] text-[#8b949e]">{region.percentage}% &middot; {formatNumber(region.count)}</span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${region.percentage}%`, backgroundColor: region.color }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Growth Line Chart (SVG) */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#34d399]" /> Fan Growth (12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {(() => {
            const chartW = 280, chartH = 80, cpx = 35, cpy = 10, cpw = chartW - cpx - 8, cph = chartH - cpy - 18;
            const maxV = Math.max(...data.monthlyGrowth, 1);
            const minV = Math.min(...data.monthlyGrowth, 0);
            const range = maxV - minV || 1;
            const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const pts = data.monthlyGrowth.map((v, i) => {
              const x = cpx + (i / (data.monthlyGrowth.length - 1)) * cpw;
              const y = cpy + cph - ((v - minV) / range) * cph;
              return `${x},${y}`;
            });
            const polyStr = pts.join(' ');
            const areaStr = `${pts[0]} ${data.monthlyGrowth.slice(1).map((_, i) => {
              const x = cpx + ((i + 1) / (data.monthlyGrowth.length - 1)) * cpw;
              return `${x},`;
            }).join(' ')} ${cpx + cpw},${cpy + cph} ${cpx},${cpy + cph}`;

            return (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
                {[0, 0.5, 1].map((f, i) => {
                  const y = cpy + cph - f * cph;
                  const val = Math.round(minV + f * range);
                  return (
                    <g key={i}>
                      <line x1={cpx} y1={y} x2={cpx + cpw} y2={y} stroke="#30363d" strokeWidth="0.5" />
                      <text x={cpx - 4} y={y + 3} textAnchor="end" className="fill-[#8b949e]" fontSize="6">{formatNumber(val)}</text>
                    </g>
                  );
                })}
                <polygon points={areaStr} fill="#34d399" opacity="0.12" />
                <polyline points={polyStr} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
                {data.monthlyGrowth.map((v, i) => {
                  const x = cpx + (i / (data.monthlyGrowth.length - 1)) * cpw;
                  const y = cpy + cph - ((v - minV) / range) * cph;
                  return <circle key={i} cx={x} cy={y} r="2" fill="#34d399" />;
                })}
                {data.monthlyGrowth.map((_, i) => {
                  const x = cpx + (i / (data.monthlyGrowth.length - 1)) * cpw;
                  return <text key={i} x={x} y={chartH - 2} textAnchor="middle" className="fill-[#484f58]" fontSize="6">{monthLabels[i]}</text>;
                })}
              </svg>
            );
          })()}
        </CardContent>
      </Card>

      {/* Fan of the Month */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-[#f59e0b]" /> Fan of the Month
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center text-xl text-[#f59e0b]">
              <Star />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#c9d1d9]">{data.fanOfMonth.name}</p>
              <p className="text-[10px] text-[#8b949e] flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> {data.fanOfMonth.location} &middot; {data.fanOfMonth.yearsActive} years
              </p>
              <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{data.fanOfMonth.dedication}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// NEW: Fan Loyalty Program Sub-Component
// ============================================================
function FanLoyaltyProgram({ data }: { data: ReturnType<typeof generateLoyaltyData> }) {
  const currentTier = data.tiers[data.currentTierIndex];
  const nextTier = data.tiers[data.currentTierIndex + 1];

  return (
    <div className="space-y-3">
      {/* Current Tier + Points */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-lg ${currentTier.bgColor} flex items-center justify-center`} style={{ border: `2px solid ${currentTier.color}` }}>
              <Award className="h-6 w-6" style={{ color: currentTier.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#c9d1d9]">{currentTier.name} Tier</p>
                {nextTier && (
                  <span className="text-[9px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded-sm">
                    {data.tierProgress}% to {nextTier.name}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">{formatNumber(data.currentPoints)} <span className="text-[10px] text-[#8b949e] font-normal">pts</span></p>
              <div className="mt-1 h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: currentTier.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${data.tierProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-[9px] text-[#484f58] mt-1">+{data.weeklyEarningRate} pts/week earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Tier Rewards */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: currentTier.color }} /> {currentTier.name} Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {currentTier.rewards.map((reward, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: currentTier.color }} />
              <span className="text-[11px] text-[#c9d1d9]">{reward}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tier Benefits Comparison Table */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-[#3b82f6]" /> Tier Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[#30363d]">
                  <th className="text-left py-1.5 text-[#8b949e] font-medium pr-2">Tier</th>
                  {data.tiers.map(t => (
                    <th key={t.name} className="text-center py-1.5 font-medium px-1" style={{ color: t.color }}>{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#21262d]">
                  <td className="py-1.5 text-[#8b949e]">Min Pts</td>
                  {data.tiers.map(t => (
                    <td key={t.name} className="text-center py-1.5 text-[#c9d1d9]">{formatNumber(t.threshold)}</td>
                  ))}
                </tr>
                <tr className="border-b border-[#21262d]">
                  <td className="py-1.5 text-[#8b949e]">Merch</td>
                  {data.tiers.map(t => (
                    <td key={t.name} className="text-center py-1.5 text-[#c9d1d9]">{t.rewards[0]}</td>
                  ))}
                </tr>
                <tr className="border-b border-[#21262d]">
                  <td className="py-1.5 text-[#8b949e]">Access</td>
                  {data.tiers.map(t => (
                    <td key={t.name} className="text-center py-1.5 text-[#c9d1d9]">{t.rewards[1]}</td>
                  ))}
                </tr>
                <tr className="border-b border-[#21262d]">
                  <td className="py-1.5 text-[#8b949e]">Special</td>
                  {data.tiers.map(t => (
                    <td key={t.name} className="text-center py-1.5 text-[#c9d1d9]">{t.rewards[2]}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-[#8b949e]">Exclusive</td>
                  {data.tiers.map(t => (
                    <td key={t.name} className="text-center py-1.5 text-[#c9d1d9]">{t.rewards[3]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// NEW: Matchday Atmosphere Sub-Component
// ============================================================
function MatchdayAtmosphere({ data }: { data: ReturnType<typeof generateAtmosphereData> }) {
  return (
    <div className="space-y-3">
      {/* Atmosphere Prediction Gauge */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4">
          <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider mb-3">Next Match Atmosphere</p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background arc */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#30363d" strokeWidth="8"
                  strokeDasharray={`${Math.PI * 40} ${Math.PI * 80}`} strokeLinecap="butt"
                  strokeDashoffset="0" />
                {/* Value arc */}
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={data.predictedAtmosphere >= 80 ? '#34d399' : data.predictedAtmosphere >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(data.predictedAtmosphere / 100) * Math.PI * 40} ${Math.PI * 80}`}
                  strokeLinecap="butt"
                  strokeDashoffset="0" />
                <text x="50" y="46" textAnchor="middle" className="fill-[#c9d1d9]" fontSize="18" fontWeight="bold">
                  {data.predictedAtmosphere}
                </text>
                <text x="50" y="58" textAnchor="middle" className="fill-[#8b949e]" fontSize="7">/ 100</text>
              </svg>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${data.predictedAtmosphere >= 80 ? 'text-[#34d399]' : data.predictedAtmosphere >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                {data.predictedAtmosphere >= 80 ? 'Electric!' : data.predictedAtmosphere >= 60 ? 'Lively' : data.predictedAtmosphere >= 40 ? 'Moderate' : 'Quiet'}
              </p>
              <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">
                {data.predictedAtmosphere >= 80 ? 'Expect a packed stadium with deafening noise. The atmosphere will be incredible.' : data.predictedAtmosphere >= 60 ? 'Good turnout expected. Fans will be vocal and create a strong atmosphere.' : 'Standard matchday atmosphere. Some sections may be quieter than usual.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atmosphere Factors */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-[#f59e0b]" /> Atmosphere Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {data.factors.map(factor => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#c9d1d9]">{factor.name}</span>
                <span className="text-[10px] font-bold" style={{ color: factor.color }}>{factor.value}%</span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm" style={{ width: `${factor.value}%`, backgroundColor: factor.color }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Historical Atmosphere Ratings */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#a78bfa]" /> Last 5 Home Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {data.historical.map((match, idx) => {
            const sparkMax = Math.max(...match.sparkline, 1);
            const sparkMin = Math.min(...match.sparkline, 0);
            const sparkRange = sparkMax - sparkMin || 1;
            const sparkPts = match.sparkline.map((v, si) => {
              const sx = 3 + (si / (match.sparkline.length - 1)) * 44;
              const sy = 16 - ((v - sparkMin) / sparkRange) * 14;
              return `${sx},${sy}`;
            });
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#c9d1d9] truncate">{match.opponent}</p>
                  <p className="text-[9px] text-[#484f58]">{match.competition}</p>
                </div>
                <svg viewBox="0 0 50 20" className="w-12 h-5 shrink-0">
                  <polyline points={sparkPts.join(' ')} fill="none" stroke="#a78bfa" strokeWidth="1" strokeLinejoin="round" />
                </svg>
                <span className={`text-xs font-bold w-7 text-right ${match.rating >= 75 ? 'text-[#34d399]' : match.rating >= 55 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                  {match.rating}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Tifosi / Choreography Preview */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[#ef4444]" /> Tifosi Choreography Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex gap-2 mb-2">
            {data.tifosi.flagColors.map((color, i) => (
              <div key={i} className="flex-1 h-6 rounded-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">{data.tifosi.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// NEW: Fan Interaction Events Sub-Component
// ============================================================
function FanInteractionEvents({ data }: { data: ReturnType<typeof generateFanEvents> }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'Open', color: 'text-[#34d399]', bg: 'bg-[#34d399]/15' },
    limited: { label: 'Limited', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/15' },
    full: { label: 'Full', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/15' },
  };

  return (
    <div className="space-y-3">
      {/* Upcoming Events */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#3b82f6]" /> Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {data.upcoming.map((event, idx) => {
            const cfg = statusConfig[event.status];
            const fillPct = Math.round((event.registered / event.capacity) * 100);
            return (
              <motion.div
                key={event.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#21262d] rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{event.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-medium ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#8b949e]">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {event.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {event.location}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8b949e]">{formatNumber(event.registered)} / {formatNumber(event.capacity)}</span>
                    <span className="text-[9px] text-[#8b949e]">{fillPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${fillPct >= 90 ? 'bg-[#ef4444]' : fillPct >= 70 ? 'bg-[#f59e0b]' : 'bg-[#34d399]'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
                {event.players.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-2.5 w-2.5 text-[#3b82f6]" />
                    <span className="text-[9px] text-[#8b949e]">{event.players.join(', ')}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Past Event Highlights */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" /> Past Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {data.past.map((event, idx) => (
            <motion.div
              key={event.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#21262d] rounded-lg p-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#30363d] flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5 text-[#8b949e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#c9d1d9]">{event.name}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 text-[#f59e0b]" />
                      <span className="text-[10px] font-bold text-[#f59e0b]">{event.rating}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{event.description}</p>
                  <p className="text-[9px] text-[#484f58] mt-1">{formatNumber(event.attendance)} attended</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// NEW: Supporter Chants & Culture Sub-Component
// ============================================================
function SupporterChants({ data }: { data: ReturnType<typeof generateChantsData> }) {
  const occasionColors: Record<string, string> = {
    Goal: 'bg-[#34d399]/15 text-[#34d399]',
    'Pre-match': 'bg-[#3b82f6]/15 text-[#3b82f6]',
    Halftime: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    Anytime: 'bg-[#a78bfa]/15 text-[#a78bfa]',
  };

  return (
    <div className="space-y-3">
      {/* Chant Cards */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-[#ef4444]" /> Supporter Chants
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {data.chants.map((chant, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-[#21262d] rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-medium ${occasionColors[chant.occasion] || 'bg-[#8b949e]/15 text-[#8b949e]'}`}>
                  {chant.occasion}
                </span>
                <span className="text-[9px] text-[#8b949e]">{chant.popularity}% popularity</span>
              </div>
              <p className="text-[11px] text-[#c9d1d9] leading-relaxed italic">{chant.text}</p>
              <div className="h-1 bg-slate-700/50 rounded-sm overflow-hidden">
                <div className="h-full rounded-sm bg-[#ef4444]" style={{ width: `${chant.popularity}%` }} />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Club Traditions */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#a78bfa]" /> Club Traditions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {data.traditions.map((tradition, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-[11px] font-semibold text-[#c9d1d9]">{tradition.name}</p>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{tradition.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fan Mottos */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#f59e0b]" /> Fan Mottos & Slogans
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {data.mottos.map((motto, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#21262d] rounded-lg p-2.5">
                <span className="text-[#f59e0b] text-sm">&ldquo;</span>
                <p className="text-[11px] text-[#c9d1d9] italic">{motto}</p>
                <span className="text-[#f59e0b] text-sm ml-auto">&rdquo;</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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

  const player = gameState?.player;
  const week = gameState?.currentWeek ?? 1;
  const season = gameState?.currentSeason ?? 1;
  const playerReputation = player?.reputation ?? 5;

  // Stable initial values computed via useMemo (only runs once per player/week change)
  const initialEndorsements = useMemo(() => {
    if (!player) return [];
    return generateEndorsements(player.name, player.overall, playerReputation, week);
  }, [player, playerReputation, week]);

  const initialPosts = useMemo(() => {
    if (!player) return [];
    return generateSocialPosts(player.name, week, season, player.form, player.seasonStats.goals, playerReputation);
  }, [player, playerReputation, week, season]);

  // Use initial values if state hasn't been modified by user actions
  const currentEndorsements = endorsements.length > 0 ? endorsements : initialEndorsements;
  const currentPosts = posts.length > 0 ? posts : initialPosts;

  // Computed data
  const fanData = useMemo(() => {
    if (!player) return null;
    return generateFanData(player.name, week, season, player.overall, player.form, playerReputation, player.seasonStats.goals);
  }, [player, playerReputation, week, season]);

  const fanComments = useMemo(() => {
    if (!player || !fanData) return [];
    return generateFanComments(player.name, week, player.form, fanData.mood);
  }, [player, playerReputation, week, season, fanData]);

  const socialProfiles = useMemo(() => {
    if (!player) return [];
    return generateSocialProfiles(player.name, player.overall, playerReputation, week);
  }, [player, playerReputation, week]);

  const brandScore = useMemo(() => {
    if (!player) return null;
    return calculateBrandScore(player);
  }, [player]);

  const communityData = useMemo(() => {
    if (!player) return null;
    return generateFanCommunityData(player.name, week, playerReputation, player.overall);
  }, [player, playerReputation, week]);

  const loyaltyData = useMemo(() => {
    if (!player) return null;
    return generateLoyaltyData(player.name, week, playerReputation, player.overall);
  }, [player, playerReputation, week]);

  const atmosphereData = useMemo(() => {
    if (!player) return null;
    return generateAtmosphereData(player.name, week, playerReputation, player.form);
  }, [player, playerReputation, week]);

  const eventsData = useMemo(() => {
    if (!player) return null;
    return generateFanEvents(player.name, week, playerReputation);
  }, [player, playerReputation, week]);

  const chantsData = useMemo(() => {
    if (!player) return null;
    return generateChantsData(player.name, week);
  }, [player, week]);

  const activeEndorsements = useMemo(() => currentEndorsements.filter(e => e.accepted), [currentEndorsements]);
  const totalWeeklyEndorsementIncome = useMemo(() => activeEndorsements.reduce((sum, e) => sum + e.weeklyAmount, 0), [activeEndorsements]);
  const totalMonthlyEndorsementIncome = Math.round(totalWeeklyEndorsementIncome * 4.3);

  const handleAcceptEndorsement = (id: string) => {
    setEndorsements(currentEndorsements.map(e => e.id === id ? { ...e, accepted: true } : e));
  };
  const handleRejectEndorsement = (id: string) => {
    setEndorsements(currentEndorsements.map(e => e.id === id ? { ...e, rejected: true } : e));
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
    setPosts([newPost, ...currentPosts].slice(0, 10));
  };

  if (!gameState || !player || !fanData || !brandScore || !communityData || !loyaltyData || !atmosphereData || !eventsData || !chantsData) return null;

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
            <TabsTrigger value="community" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400">
              <Heart className="h-3 w-3 mr-1" /> Hub
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-amber-400">
              <Award className="h-3 w-3 mr-1" /> Loyalty
            </TabsTrigger>
            <TabsTrigger value="matchday" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-rose-400">
              <Volume2 className="h-3 w-3 mr-1" /> Match
            </TabsTrigger>
            <TabsTrigger value="chants" className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-[#a78bfa]">
              <Volume2 className="h-3 w-3 mr-1" /> Chants
            </TabsTrigger>
          </TabsList>

          {/* ====== TAB 1: FAN BASE ====== */}
          <TabsContent value="fans" className="mt-3 space-y-3">
            {/* Fan Mood Emoji Display — at the very top after header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-16 h-16 rounded-xl ${(() => {
                      if (fanData.moodScore >= 80) return 'bg-emerald-500/15';
                      if (fanData.moodScore >= 60) return 'bg-green-500/15';
                      if (fanData.moodScore >= 40) return 'bg-amber-500/15';
                      if (fanData.moodScore >= 20) return 'bg-orange-500/15';
                      return 'bg-red-500/15';
                    })()} flex items-center justify-center`}>
                      <motion.span
                        className="text-[48px] leading-none"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {(() => {
                          if (fanData.moodScore >= 80) return '\ud83e\udd73';
                          if (fanData.moodScore >= 60) return '\ud83d\ude0a';
                          if (fanData.moodScore >= 40) return '\ud83d\ude10';
                          if (fanData.moodScore >= 20) return '\ud83d\ude15';
                          return '\ud83d\ude21';
                        })()}
                      </motion.span>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${(() => {
                        if (fanData.moodScore >= 80) return 'text-emerald-400';
                        if (fanData.moodScore >= 60) return 'text-green-400';
                        if (fanData.moodScore >= 40) return 'text-amber-400';
                        if (fanData.moodScore >= 20) return 'text-orange-400';
                        return 'text-red-400';
                      })()}`}>{fanData.moodScore}% Fan Satisfaction</p>
                      <p className="text-[10px] text-[#484f58]">{(() => {
                        if (fanData.moodScore >= 80) return 'Title chase — fans are ecstatic!';
                        if (fanData.moodScore >= 60) return 'Good form — fans are happy!';
                        if (fanData.moodScore >= 40) return 'Mid-table — fans are neutral.';
                        if (fanData.moodScore >= 20) return 'Bad form — fans are concerned.';
                        return 'Relegation battle — fans are furious!';
                      })()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fan Count */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
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

            {/* Supporter Base Distribution Donut Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.17 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Supporter Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <SupporterDonutChart demographics={fanData.demographics} totalFans={fanData.totalFans} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Fan Engagement Trend */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.19 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Engagement Trend (Last 8 Weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <EngagementTrendChart data={fanData.growthHistory.slice(-8)} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Terrace Chatter */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.21 }}>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400" /> Terrace Chatter
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <TerraceChatter playerName={player.name} week={week} form={player.form} mood={fanData.mood} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Merchandise Sales */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.22 }}>
              <MerchandiseSalesCard playerName={player.name} reputation={playerReputation} week={week} />
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

            {/* Social Media Reach */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }}>
              <SocialMediaReachCard profiles={socialProfiles} playerName={player.name} week={week} />
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
                  {currentPosts.map((p, i) => <SocialPostCard key={p.id} post={p} index={i} />)}
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
                  {currentEndorsements.map(e => (
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

          {/* ====== TAB 5: FAN COMMUNITY HUB ====== */}
          <TabsContent value="community" className="mt-3 space-y-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <FanCommunityHub data={communityData} totalFans={fanData.totalFans} />
            </motion.div>
          </TabsContent>

          {/* ====== TAB 6: FAN LOYALTY PROGRAM ====== */}
          <TabsContent value="loyalty" className="mt-3 space-y-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <FanLoyaltyProgram data={loyaltyData} />
            </motion.div>
          </TabsContent>

          {/* ====== TAB 7: MATCHDAY ATMOSPHERE + FAN EVENTS ====== */}
          <TabsContent value="matchday" className="mt-3 space-y-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <MatchdayAtmosphere data={atmosphereData} />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <FanInteractionEvents data={eventsData} />
            </motion.div>
          </TabsContent>

          {/* ====== TAB 8: SUPPORTER CHANTS & CULTURE ====== */}
          <TabsContent value="chants" className="mt-3 space-y-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <SupporterChants data={chantsData} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
