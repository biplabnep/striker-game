'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Bell,
  Camera,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  Users,
  CheckCircle2,
  X,
  Send,
  Eye,
  ChevronDown,
  Globe,
  Lock,
  UserCheck,
  Sparkles,
  Mail,
} from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

interface FeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  platform: PlatformType;
  timestamp: string;
  content: string;
  type: PostCategory;
  likes: number;
  comments: number;
  shares: number;
  bookmarked: boolean;
  hasImage: boolean;
  imageColor: string;
}

type PlatformType = 'FootballerGram' | 'Chirper' | 'FaceGoal' | 'TikTack';

type PostCategory = 'match' | 'transfer' | 'announcement' | 'personal' | 'team' | 'sponsor' | 'interview' | 'fan';

interface TrendingTopic {
  id: string;
  rank: number;
  topic: string;
  postCount: string;
  direction: 'up' | 'down' | 'stable';
  isPlayerRelated: boolean;
}

interface DMConversation {
  id: string;
  name: string;
  handle: string;
  lastMessage: string;
  unread: number;
  avatarColor: string;
}

interface TeamChatMessage {
  id: string;
  sender: string;
  message: string;
  time: string;
  avatarColor: string;
}

interface MediaRequest {
  id: string;
  journalist: string;
  outlet: string;
  topic: string;
  type: 'interview' | 'photoshoot' | 'podcast';
}

interface FanMail {
  id: string;
  fanName: string;
  location: string;
  message: string;
  sentiment: 'Positive' | 'Neutral' | 'Critical';
}

// ============================================================
// Constants
// ============================================================

const MOODS: { emoji: string; label: string }[] = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '🎯', label: 'Focused' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🎉', label: 'Celebrating' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '😴', label: 'Tired' },
];

const PRIVACY_OPTIONS: { label: string; icon: React.ReactNode }[] = [
  { label: 'Public', icon: <Globe className="h-3 w-3" /> },
  { label: 'Team Only', icon: <Lock className="h-3 w-3" /> },
  { label: 'Close Friends', icon: <UserCheck className="h-3 w-3" /> },
];

const POST_TYPE_COLORS: Record<PostCategory, string> = {
  match: '#34d399',
  transfer: '#f59e0b',
  announcement: '#3b82f6',
  personal: '#a78bfa',
  team: '#34d399',
  sponsor: '#f59e0b',
  interview: '#3b82f6',
  fan: '#a78bfa',
};

const PLATFORM_STYLES: Record<PlatformType, { color: string; bg: string; icon: string }> = {
  FootballerGram: { color: '#ef4444', bg: '#ef4444', icon: '📷' },
  Chirper: { color: '#3b82f6', bg: '#3b82f6', icon: '💬' },
  FaceGoal: { color: '#3b82f6', bg: '#3b82f6', icon: '🎬' },
  TikTack: { color: '#ef4444', bg: '#ef4444', icon: '🎵' },
};

// ============================================================
// Deterministic Data Generators
// ============================================================

function generateFeedPosts(playerName: string, clubName: string): FeedPost[] {
  return [
    {
      id: 'fp-1',
      authorName: playerName,
      authorHandle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      platform: 'FootballerGram',
      timestamp: '2m ago',
      content: 'Match day feeling! Ready to give everything for the badge. Let\'s get those three points! ⚽🔥',
      type: 'match',
      likes: 2847,
      comments: 183,
      shares: 92,
      bookmarked: false,
      hasImage: true,
      imageColor: '#34d399',
    },
    {
      id: 'fp-2',
      authorName: `${clubName} Official`,
      authorHandle: `@${clubName.toLowerCase().replace(/\s/g, '')}FC`,
      platform: 'Chirper',
      timestamp: '15m ago',
      content: `⚽ TEAM NEWS: Starting XI confirmed for today's match! ${playerName} leads the line as we look to extend our winning streak.`,
      type: 'announcement',
      likes: 5231,
      comments: 412,
      shares: 287,
      bookmarked: false,
      hasImage: false,
      imageColor: '#3b82f6',
    },
    {
      id: 'fp-3',
      authorName: 'Transfer Insider',
      authorHandle: '@TransferWatchHQ',
      platform: 'Chirper',
      timestamp: '1h ago',
      content: `📰 BREAKING: Multiple clubs monitoring ${playerName}'s situation. Sources close to the player suggest a decision will be made before the window closes.`,
      type: 'transfer',
      likes: 8934,
      comments: 1247,
      shares: 892,
      bookmarked: false,
      hasImage: false,
      imageColor: '#f59e0b',
    },
    {
      id: 'fp-4',
      authorName: playerName,
      authorHandle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      platform: 'TikTack',
      timestamp: '3h ago',
      content: 'Behind the scenes at training today 💪 The grind never stops. New skills incoming this season!',
      type: 'personal',
      likes: 12453,
      comments: 834,
      shares: 456,
      bookmarked: false,
      hasImage: true,
      imageColor: '#a78bfa',
    },
    {
      id: 'fp-5',
      authorName: 'Fan Zone',
      authorHandle: '@DieHardFans',
      platform: 'Chirper',
      timestamp: '4h ago',
      content: `${playerName} has been absolutely sensational this season. Best player in the league right now? The numbers don't lie! 📊⭐`,
      type: 'fan',
      likes: 6721,
      comments: 523,
      shares: 189,
      bookmarked: false,
      hasImage: false,
      imageColor: '#a78bfa',
    },
    {
      id: 'fp-6',
      authorName: 'GoalKing Sports',
      authorHandle: '@GoalKingMedia',
      platform: 'FaceGoal',
      timestamp: '5h ago',
      content: `🎬 EXCLUSIVE: We sat down with ${playerName} to discuss the season so far, ambitions, and what drives him. Full interview out this Friday!`,
      type: 'interview',
      likes: 3456,
      comments: 267,
      shares: 134,
      bookmarked: false,
      hasImage: true,
      imageColor: '#3b82f6',
    },
    {
      id: 'fp-7',
      authorName: 'Elite Sports Wear',
      authorHandle: '@EliteSportswear',
      platform: 'FootballerGram',
      timestamp: '6h ago',
      content: `🌟 Proud to announce our continued partnership with ${playerName}! New collection dropping next month — inspired by his journey to the top.`,
      type: 'sponsor',
      likes: 4523,
      comments: 198,
      shares: 67,
      bookmarked: false,
      hasImage: true,
      imageColor: '#f59e0b',
    },
    {
      id: 'fp-8',
      authorName: playerName,
      authorHandle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      platform: 'Chirper',
      timestamp: '8h ago',
      content: 'Celebration time! 🎉🥳 What a win. The boys were incredible today. Special mention to the fans — you were our 12th player!',
      type: 'match',
      likes: 8932,
      comments: 643,
      shares: 321,
      bookmarked: false,
      hasImage: false,
      imageColor: '#34d399',
    },
    {
      id: 'fp-9',
      authorName: 'Team Mates Daily',
      authorHandle: '@TeamMatesHQ',
      platform: 'Chirper',
      timestamp: '10h ago',
      content: `${clubName} dressing room atmosphere is at an all-time high. Sources say ${playerName} has taken on a leadership role among the squad.`,
      type: 'team',
      likes: 3214,
      comments: 189,
      shares: 94,
      bookmarked: false,
      hasImage: false,
      imageColor: '#34d399',
    },
    {
      id: 'fp-10',
      authorName: playerName,
      authorHandle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      platform: 'FootballerGram',
      timestamp: '12h ago',
      content: 'Early morning gym session done ✅ Discipline is the bridge between goals and accomplishment. Another day, another step closer.',
      type: 'personal',
      likes: 15678,
      comments: 923,
      shares: 567,
      bookmarked: false,
      hasImage: true,
      imageColor: '#a78bfa',
    },
    {
      id: 'fp-11',
      authorName: 'Transfer Talk Live',
      authorHandle: '@TransferTalkDaily',
      platform: 'Chirper',
      timestamp: '1d ago',
      content: `📊 ${playerName}'s market value has risen 40% this season. Clubs from three different leagues are reportedly preparing bids. Full analysis on our website.`,
      type: 'transfer',
      likes: 11234,
      comments: 1567,
      shares: 789,
      bookmarked: false,
      hasImage: false,
      imageColor: '#f59e0b',
    },
    {
      id: 'fp-12',
      authorName: 'Fan Cam TV',
      authorHandle: '@FanCamTV',
      platform: 'TikTack',
      timestamp: '1d ago',
      content: `${playerName} noticed a young fan in the crowd after the match and went over to give them his shirt. This is why we love the game ❤️⚽`,
      type: 'fan',
      likes: 45231,
      comments: 3421,
      shares: 2345,
      bookmarked: false,
      hasImage: true,
      imageColor: '#a78bfa',
    },
  ];
}

function generateTrendingTopics(playerName: string, leagueName: string): TrendingTopic[] {
  return [
    { id: 'tt-1', rank: 1, topic: '#MatchDay', postCount: '24.5K', direction: 'up', isPlayerRelated: false },
    { id: 'tt-2', rank: 2, topic: `#${playerName.replace(/\s/g, '')}Goals`, postCount: '18.2K', direction: 'up', isPlayerRelated: true },
    { id: 'tt-3', rank: 3, topic: '#TransferWindow', postCount: '15.7K', direction: 'stable', isPlayerRelated: false },
    { id: 'tt-4', rank: 4, topic: '#GoalOfTheSeason', postCount: '12.3K', direction: 'up', isPlayerRelated: true },
    { id: 'tt-5', rank: 5, topic: `#${playerName.replace(/\s/g, '')}ToStay`, postCount: '9.8K', direction: 'down', isPlayerRelated: true },
    { id: 'tt-6', rank: 6, topic: '#TeamSpirit', postCount: '7.4K', direction: 'up', isPlayerRelated: false },
    { id: 'tt-7', rank: 7, topic: `#${leagueName.replace(/\s/g, '')}2024`, postCount: '6.1K', direction: 'stable', isPlayerRelated: false },
    { id: 'tt-8', rank: 8, topic: '#FootballerOfTheYear', postCount: '5.3K', direction: 'up', isPlayerRelated: true },
  ];
}

function generateDMConversations(): DMConversation[] {
  return [
    { id: 'dm-1', name: 'Marcus Sterling', handle: '@Sterling10', lastMessage: 'Great game yesterday! Want to grab coffee?', unread: 2, avatarColor: '#34d399' },
    { id: 'dm-2', name: 'Coach Williams', handle: '@CoachWilliams', lastMessage: 'Training schedule updated for next week.', unread: 1, avatarColor: '#3b82f6' },
    { id: 'dm-3', name: 'Elena Rodriguez', handle: '@ElenaSports', lastMessage: 'Interview confirmed for Friday at 3pm.', unread: 0, avatarColor: '#a78bfa' },
    { id: 'dm-4', name: 'David Chen', handle: '@DaveChenAgent', lastMessage: 'New sponsor deal proposal — review when free.', unread: 3, avatarColor: '#f59e0b' },
    { id: 'dm-5', name: 'Sophie Taylor', handle: '@SophieTPhotos', lastMessage: 'Photos from last shoot are ready!', unread: 0, avatarColor: '#ef4444' },
  ];
}

function generateTeamChatMessages(): TeamChatMessage[] {
  return [
    { id: 'tc-1', sender: 'Coach Williams', message: 'Great session today lads. Keep the intensity up for Saturday.', time: '10:30 AM', avatarColor: '#3b82f6' },
    { id: 'tc-2', sender: 'Marcus Sterling', message: 'Who\'s up for extra shooting practice tomorrow?', time: '10:32 AM', avatarColor: '#34d399' },
    { id: 'tc-3', sender: 'You', message: 'Count me in! Need to work on my left foot.', time: '10:35 AM', avatarColor: '#a78bfa' },
    { id: 'tc-4', sender: 'Jake Morrison', message: 'The new tactics are clicking. I can feel it.', time: '10:38 AM', avatarColor: '#f59e0b' },
    { id: 'tc-5', sender: 'Tom Bradley', message: 'Pizza night at my place after the win? 🍕', time: '10:40 AM', avatarColor: '#ef4444' },
    { id: 'tc-6', sender: 'You', message: 'Only if we win! No jinxing it 😂', time: '10:42 AM', avatarColor: '#a78bfa' },
  ];
}

function generateMediaRequests(): MediaRequest[] {
  return [
    { id: 'mr-1', journalist: 'Sarah Mitchell', outlet: 'Sky Sports', topic: 'Season review & future ambitions', type: 'interview' },
    { id: 'mr-2', journalist: 'James Cooper', outlet: 'GQ Magazine', topic: 'Fashion & lifestyle photoshoot', type: 'photoshoot' },
    { id: 'mr-3', journalist: 'Alex Rivera', outlet: 'The Football Podcast', topic: 'Behind the scenes of matchday', type: 'podcast' },
  ];
}

function generateFanMails(): FanMail[] {
  return [
    { id: 'fm-1', fanName: 'Oliver Grant', location: 'London, UK', message: 'You inspired me to start playing football again after my injury. Thank you for being my hero!', sentiment: 'Positive' },
    { id: 'fm-2', fanName: 'Maria Santos', location: 'Madrid, Spain', message: 'Please don\'t leave the club! We need you. You\'re the heart of the team.', sentiment: 'Positive' },
    { id: 'fm-3', fanName: 'Thomas Weber', location: 'Berlin, Germany', message: 'Your performance against City was world-class. The whole stadium was chanting your name.', sentiment: 'Positive' },
    { id: 'fm-4', fanName: 'Hannah Clarke', location: 'Dublin, Ireland', message: 'Good season so far but I think you could be more clinical in front of goal. Keep working!', sentiment: 'Critical' },
    { id: 'fm-5', fanName: 'Raj Patel', location: 'Mumbai, India', message: 'Watched every game this season from here. You make us proud every single time you step on the pitch.', sentiment: 'Positive' },
  ];
}

// ============================================================
// Helper Functions
// ============================================================

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function getSentimentBadgeStyles(sentiment: FanMail['sentiment']): { color: string; bg: string } {
  switch (sentiment) {
    case 'Positive': return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' };
    case 'Neutral': return { color: '#8b949e', bg: 'rgba(139,148,158,0.15)' };
    case 'Critical': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  }
}

// ============================================================
// Sub-Components
// ============================================================

/** Platform badge component */
function PlatformBadge({ platform }: { platform: PlatformType }) {
  const style = PLATFORM_STYLES[platform];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
      style={{ color: style.color, backgroundColor: `${style.color}20` }}
    >
      <span>{style.icon}</span>
      {platform}
    </span>
  );
}

/** Avatar placeholder with initials */
function AvatarPlaceholder({ name, size = 8, color }: { name: string; size?: number; color: string }) {
  const initials = name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2);
  const sizeClass = size === 10 ? 'w-10 h-10 text-sm' : size === 12 ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs';
  return (
    <div
      className={`${sizeClass} rounded-lg flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

/** Notification bell with badge */
function NotificationBell({ count }: { count: number }) {
  return (
    <button className="relative p-2 rounded-lg bg-[#21262d] border border-[#30363d] hover:border-[#8b949e]/30 transition-colors">
      <Bell className="h-4 w-4 text-[#8b949e]" />
      {count > 0 && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#ef4444] text-white text-[9px] font-bold rounded flex items-center justify-center px-1"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </button>
  );
}

// ============================================================
// 1. Social Feed Header
// ============================================================

function SocialFeedHeader({
  playerName,
  reputation,
  totalPosts,
}: {
  playerName: string;
  reputation: number;
  totalPosts: number;
}) {
  const followers = Math.max(100, reputation * reputation * 12 + totalPosts * 45);
  const following = Math.floor(reputation * 0.8) + 45;
  const engagementRate = Math.min(99, Math.round(30 + reputation * 0.4 + totalPosts * 0.1));

  const stats: { label: string; value: string }[] = [
    { label: 'Followers', value: formatNumber(followers) },
    { label: 'Following', value: following.toString() },
    { label: 'Posts', value: totalPosts.toString() },
    { label: 'Engagement', value: `${engagementRate}%` },
  ];

  const platforms: PlatformType[] = ['FootballerGram', 'Chirper', 'FaceGoal', 'TikTack'];

  const unreadNotifications = 5;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#34d399]/15 border border-[#34d399]/30 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-[#34d399]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#c9d1d9]">Social Hub</h2>
            <p className="text-[10px] text-[#8b949e]">Manage your digital presence</p>
          </div>
        </div>
        <NotificationBell count={unreadNotifications} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#21262d] rounded-lg p-2 text-center"
          >
            <p className="text-xs font-bold text-[#c9d1d9] leading-none">{stat.value}</p>
            <p className="text-[9px] text-[#8b949e] mt-1 leading-none">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Platform Badges */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[#8b949e] font-semibold uppercase tracking-wider">Platforms</span>
        <div className="flex-1 h-px bg-[#21262d]" />
        <div className="flex items-center gap-1.5">
          {platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. Create Post Panel
// ============================================================

function CreatePostPanel({ playerName }: { playerName: string }) {
  const [draft, setDraft] = useState('');
  const [postType, setPostType] = useState<'text' | 'photo' | 'video' | 'poll'>('text');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(0);
  const [showMoods, setShowMoods] = useState(false);
  const [posted, setPosted] = useState(false);

  const maxChars = 280;
  const charCount = draft.length;
  const isNearLimit = charCount > maxChars * 0.85;
  const isOverLimit = charCount > maxChars;

  const postTypes: { key: 'text' | 'photo' | 'video' | 'poll'; label: string; icon: string }[] = [
    { key: 'text', label: 'Text', icon: '📝' },
    { key: 'photo', label: 'Photo', icon: '📷' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'poll', label: 'Poll', icon: '📊' },
  ];

  const handlePost = () => {
    if (draft.trim().length === 0 || isOverLimit) return;
    setPosted(true);
    setTimeout(() => {
      setPosted(false);
      setDraft('');
      setSelectedMood(null);
    }, 1500);
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#c9d1d9]">Create Post</span>
        <div className="flex-1 h-px bg-[#21262d]" />
      </div>

      {/* Text Area */}
      <div className="flex items-start gap-2.5">
        <AvatarPlaceholder name={playerName} size={8} color="#34d399" />
        <div className="flex-1 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[60px] max-h-[120px] text-sm bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-[#c9d1d9] placeholder-[#484f58] resize-none focus:outline-none focus:border-[#34d399]/50"
            maxLength={maxChars + 20}
          />
          {/* Mood tag */}
          {selectedMood && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]"
            >
              {MOODS.find(m => m.label === selectedMood)?.emoji} {selectedMood}
              <button onClick={() => setSelectedMood(null)} className="ml-1 hover:text-[#c9d1d9]">
                <X className="h-2.5 w-2.5" />
              </button>
            </motion.span>
          )}
        </div>
      </div>

      {/* Photo Upload Placeholder */}
      {postType === 'photo' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-dashed border-[#30363d] rounded-lg p-6 flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-lg bg-[#21262d] flex items-center justify-center">
            <Camera className="h-6 w-6 text-[#8b949e]" />
          </div>
          <p className="text-xs text-[#8b949e]">Tap to upload a photo</p>
          <p className="text-[10px] text-[#484f58]">JPG, PNG or GIF. Max 5MB</p>
        </motion.div>
      )}

      {/* Video Upload Placeholder */}
      {postType === 'video' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-dashed border-[#30363d] rounded-lg p-6 flex flex-col items-center gap-2"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#8b949e]">
            <rect width="48" height="48" rx="8" fill="#21262d" />
            <polygon points="20,14 34,24 20,34" fill="#8b949e" />
          </svg>
          <p className="text-xs text-[#8b949e]">Tap to upload a video</p>
          <p className="text-[10px] text-[#484f58]">MP4 or MOV. Max 30s</p>
        </motion.div>
      )}

      {/* Post Type Selector */}
      <div className="flex items-center gap-1.5">
        {postTypes.map((pt) => (
          <button
            key={pt.key}
            onClick={() => setPostType(pt.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
              postType === pt.key
                ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30'
                : 'bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <span>{pt.icon}</span>
            {pt.label}
          </button>
        ))}
      </div>

      {/* Mood Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMoods(!showMoods)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:border-[#484f58] transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          Mood
          <ChevronDown className={`h-3 w-3 transition-opacity ${showMoods ? 'opacity-100' : 'opacity-50'}`} />
        </button>
        <AnimatePresence>
          {showMoods && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => {
                    setSelectedMood(selectedMood === mood.label ? null : mood.label);
                    setShowMoods(false);
                  }}
                  title={mood.label}
                  className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${
                    selectedMood === mood.label
                      ? 'bg-[#34d399]/15 border border-[#34d399]/30'
                      : 'bg-[#21262d] border border-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  {mood.emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Row: Privacy, Counter, Post */}
      <div className="flex items-center justify-between pt-1">
        {/* Privacy Selector */}
        <div className="flex items-center gap-1">
          {PRIVACY_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => setPrivacy(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                privacy === i
                  ? 'bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30'
                  : 'bg-[#21262d] text-[#484f58] border border-transparent hover:text-[#8b949e]'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Character counter */}
          <span className={`text-[10px] tabular-nums ${
            isOverLimit ? 'text-[#ef4444] font-semibold' : isNearLimit ? 'text-[#f59e0b]' : 'text-[#484f58]'
          }`}>
            {charCount}/{maxChars}
          </span>

          {/* Post Button */}
          <motion.button
            whileTap={{ opacity: 0.7 }}
            onClick={handlePost}
            disabled={draft.trim().length === 0 || isOverLimit || posted}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              posted
                ? 'bg-[#34d399] text-white'
                : draft.trim().length === 0 || isOverLimit
                ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                : 'bg-[#34d399] text-white hover:bg-[#34d399]/80'
            }`}
          >
            {posted ? '✓ Posted!' : 'Post'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 3. Feed Timeline
// ============================================================

function FeedTimeline({ posts }: { posts: FeedPost[] }) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {posts.map((post, index) => {
        const isLiked = likedPosts.has(post.id);
        const borderColor = POST_TYPE_COLORS[post.type];

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.04, ease: 'easeOut' }}
            className="bg-[#161b22] border rounded-lg overflow-hidden"
            style={{ borderColor: `${borderColor}30` }}
          >
            {/* Top color bar */}
            <div className="h-0.5" style={{ backgroundColor: borderColor }} />

            {/* Header */}
            <div className="flex items-center gap-2.5 p-3 pb-2">
              <AvatarPlaceholder name={post.authorName} size={8} color={borderColor} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.authorName}</span>
                  {post.authorName.includes('Official') || post.authorName.includes('Insider') || post.authorName.includes('Sports') || post.authorName.includes('Talk') || post.authorName.includes('King') || post.authorName.includes('Elite') || post.authorName.includes('Zone') || post.authorName.includes('Cam') || post.authorName.includes('Mates') || post.authorName.includes('Daily') ? (
                    <CheckCircle2 className="h-3 w-3 text-[#34d399] fill-[#34d399]" />
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8b949e]">{post.authorHandle}</span>
                  <span className="text-[10px] text-[#484f58]">·</span>
                  <span className="text-[10px] text-[#484f58]">{post.timestamp}</span>
                </div>
              </div>
              <PlatformBadge platform={post.platform} />
            </div>

            {/* Content */}
            <div className="px-3 pb-2">
              <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
            </div>

            {/* Image Placeholder */}
            {post.hasImage && (
              <div className="px-3 pb-2">
                <div
                  className="w-full h-32 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${post.imageColor}10`, border: `1px solid ${post.imageColor}20` }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill={`${post.imageColor}15`} />
                    <rect x="8" y="8" width="24" height="24" rx="4" stroke={post.imageColor} strokeWidth="1.5" fill="none" />
                    <circle cx="16" cy="16" r="3" stroke={post.imageColor} strokeWidth="1.5" fill="none" />
                    <path d="M8 28L14 22L18 26L22 20L32 28" stroke={post.imageColor} strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </div>
            )}

            {/* Engagement Row */}
            <div className="flex items-center gap-1 px-3 py-2 border-t border-[#21262d]">
              <button
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[#21262d]"
              >
                <motion.span
                  animate={isLiked ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Heart
                    className="h-4 w-4 transition-colors"
                    style={{ color: isLiked ? '#ef4444' : '#8b949e', fill: isLiked ? '#ef4444' : 'none' }}
                  />
                </motion.span>
                <span className="text-[11px]" style={{ color: isLiked ? '#ef4444' : '#8b949e' }}>
                  {formatNumber(isLiked ? post.likes + 1 : post.likes)}
                </span>
              </button>

              <button className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[#21262d]">
                <MessageCircle className="h-4 w-4 text-[#8b949e]" />
                <span className="text-[11px] text-[#8b949e]">{formatNumber(post.comments)}</span>
              </button>

              <button className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[#21262d]">
                <Share2 className="h-4 w-4 text-[#8b949e]" />
                <span className="text-[11px] text-[#8b949e]">{formatNumber(post.shares)}</span>
              </button>

              <div className="flex-1" />

              <button className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[#21262d]">
                <Bookmark
                  className="h-4 w-4 text-[#8b949e]"
                  style={{ fill: post.bookmarked ? '#f59e0b' : 'none', color: post.bookmarked ? '#f59e0b' : '#8b949e' }}
                />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// 4. Trending Topics
// ============================================================

function TrendingTopicsSidebar({ topics, leagueName }: { topics: TrendingTopic[]; leagueName: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#34d399]" />
        <span className="text-sm font-semibold text-[#c9d1d9]">Trending</span>
        <div className="flex-1" />
        <Badge
          className="text-[9px] font-semibold px-1.5 py-0.5 border"
          style={{ color: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }}
        >
          {leagueName}
        </Badge>
      </div>

      <div className="space-y-2.5">
        {topics.map((topic) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: topic.rank * 0.05 }}
            className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors hover:bg-[#21262d] ${
              topic.isPlayerRelated ? 'border border-[#34d399]/10' : ''
            }`}
          >
            {/* Rank */}
            <span className="text-xs font-bold text-[#484f58] w-4 shrink-0 pt-0.5">
              {topic.rank}
            </span>

            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${
                topic.isPlayerRelated ? 'text-[#34d399]' : 'text-[#c9d1d9]'
              }`}>
                {topic.topic}
                {topic.isPlayerRelated && (
                  <Eye className="inline-block h-3 w-3 ml-1 text-[#34d399]" />
                )}
              </p>
              <p className="text-[10px] text-[#484f58]">{topic.postCount} posts</p>
            </div>

            {/* Direction Arrow */}
            {topic.direction === 'up' && (
              <ArrowUp className="h-3.5 w-3.5 text-[#34d399] shrink-0 mt-0.5" />
            )}
            {topic.direction === 'down' && (
              <TrendingDown className="h-3.5 w-3.5 text-[#ef4444] shrink-0 mt-0.5" />
            )}
            {topic.direction === 'stable' && (
              <div className="w-3.5 h-0.5 bg-[#8b949e] rounded shrink-0 mt-2" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 5. Direct Messages
// ============================================================

function DirectMessages({ playerName }: { playerName: string }) {
  const dmConversations = useMemo(() => generateDMConversations(), []);
  const teamChatMessages = useMemo(() => generateTeamChatMessages(), []);
  const mediaRequests = useMemo(() => generateMediaRequests(), []);
  const [chatInput, setChatInput] = useState('');
  const [handledRequests, setHandledRequests] = useState<Set<string>>(new Set());

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <Tabs defaultValue="messages">
        <div className="border-b border-[#30363d] px-3">
          <TabsList className="bg-[#0d1117] h-10 w-full grid grid-cols-3">
            <TabsTrigger value="messages" className="text-[11px] font-semibold data-[state=active]:bg-[#21262d] data-[state=active]:text-[#34d399]">
              Messages
            </TabsTrigger>
            <TabsTrigger value="team" className="text-[11px] font-semibold data-[state=active]:bg-[#21262d] data-[state=active]:text-[#34d399]">
              Team Chat
            </TabsTrigger>
            <TabsTrigger value="media" className="text-[11px] font-semibold data-[state=active]:bg-[#21262d] data-[state=active]:text-[#34d399]">
              Media
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Messages Tab */}
        <TabsContent value="messages" className="p-3 space-y-1.5">
          {dmConversations.map((dm) => (
            <button
              key={dm.id}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors hover:bg-[#21262d] text-left"
            >
              <div className="relative">
                <AvatarPlaceholder name={dm.name} size={10} color={dm.avatarColor} />
                {dm.unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#3b82f6] text-white text-[9px] font-bold rounded flex items-center justify-center px-1">
                    {dm.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate">{dm.name}</span>
                  <span className="text-[9px] text-[#484f58]">{dm.unread > 0 ? 'New' : ''}</span>
                </div>
                <p className="text-[11px] text-[#8b949e] truncate">{dm.lastMessage}</p>
              </div>
            </button>
          ))}
        </TabsContent>

        {/* Team Chat Tab */}
        <TabsContent value="team" className="flex flex-col" style={{ maxHeight: '320px' }}>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {teamChatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <AvatarPlaceholder name={msg.sender} size={6} color={msg.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#c9d1d9]">{msg.sender}</span>
                    <span className="text-[9px] text-[#484f58]">{msg.time}</span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-0.5">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t border-[#30363d] p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#34d399]/50"
              />
              <button className="w-8 h-8 rounded-lg bg-[#34d399]/15 border border-[#34d399]/30 flex items-center justify-center hover:bg-[#34d399]/25 transition-colors">
                <Send className="h-3.5 w-3.5 text-[#34d399]" />
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Media Requests Tab */}
        <TabsContent value="media" className="p-3 space-y-2.5">
          {mediaRequests.map((req) => {
            const isHandled = handledRequests.has(req.id);
            const typeIcon = req.type === 'interview' ? '🎤' : req.type === 'photoshoot' ? '📸' : '🎙️';

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className={`p-3 rounded-lg border transition-colors ${
                  isHandled ? 'bg-[#21262d]/50 border-[#30363d] opacity-60' : 'bg-[#0d1117] border-[#30363d]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">{typeIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#c9d1d9]">{req.journalist}</span>
                      <span className="text-[10px] text-[#484f58]">·</span>
                      <span className="text-[10px] text-[#8b949e]">{req.outlet}</span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">{req.topic}</p>
                    <Badge
                      className="mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 border"
                      style={{
                        color: req.type === 'interview' ? '#3b82f6' : req.type === 'photoshoot' ? '#a78bfa' : '#34d399',
                        backgroundColor: req.type === 'interview' ? 'rgba(59,130,246,0.1)' : req.type === 'photoshoot' ? 'rgba(167,139,250,0.1)' : 'rgba(52,211,153,0.1)',
                        borderColor: req.type === 'interview' ? 'rgba(59,130,246,0.3)' : req.type === 'photoshoot' ? 'rgba(167,139,250,0.3)' : 'rgba(52,211,153,0.3)',
                      }}
                    >
                      {req.type}
                    </Badge>

                    {!isHandled && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => setHandledRequests(prev => new Set(prev).add(req.id))}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[#34d399] text-white hover:bg-[#34d399]/80 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setHandledRequests(prev => new Set(prev).add(req.id))}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:border-[#484f58] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {isHandled && (
                      <p className="text-[10px] text-[#484f58] mt-2 italic">Request handled</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// 6. Player Profile Preview
// ============================================================

function PlayerProfilePreview({
  playerName,
  clubName,
  reputation,
  totalPosts,
  totalAppearances,
}: {
  playerName: string;
  clubName: string;
  reputation: number;
  totalPosts: number;
  totalAppearances: number;
}) {
  const followers = Math.max(100, reputation * reputation * 12 + totalPosts * 45);
  const following = Math.floor(reputation * 0.8) + 45;
  const isVerified = totalAppearances >= 50;

  const recentActivity: string[] = [
    'Match day post',
    'Training update',
    'Fan Q&A',
    'Sponsor post',
    'Goal celebration',
    'Team photo',
    'Charity event',
    'Press conference',
    'Gym session',
  ];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Cover Photo Placeholder */}
      <div className="h-20 relative" style={{ backgroundColor: '#21262d' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="80" fill="#21262d" />
          {/* Stadium silhouette pattern */}
          <path d="M0 60 Q50 30 100 50 Q150 20 200 45 Q250 25 300 50 Q350 30 400 55 L400 80 L0 80 Z" fill="#30363d" opacity="0.6" />
          <circle cx="200" cy="20" r="12" fill="#34d399" opacity="0.15" />
        </svg>
      </div>

      {/* Avatar + Info */}
      <div className="px-4 pb-4 -mt-8 relative">
        <div className="flex items-end gap-3 mb-3">
          <div className="w-16 h-16 rounded-lg border-4 border-[#161b22] flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ backgroundColor: '#34d399' }}>
            {playerName.split(' ').map(w => w.charAt(0)).join('').substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#c9d1d9] truncate">{playerName}</span>
              {isVerified && (
                <CheckCircle2 className="h-4 w-4 text-[#34d399] fill-[#34d399] shrink-0" />
              )}
            </div>
            <span className="text-xs text-[#8b949e]">
              @{playerName.toLowerCase().replace(/\s/g, '')}
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-[#c9d1d9] leading-relaxed mb-3">
          Professional footballer ⚽ | {clubName} | {isVerified ? 'Verified Player' : 'Rising Star'} | Living the dream on and off the pitch
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-[#21262d]">
            <p className="text-sm font-bold text-[#c9d1d9]">{totalPosts}</p>
            <p className="text-[9px] text-[#8b949e]">Posts</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#21262d]">
            <p className="text-sm font-bold text-[#c9d1d9]">{formatNumber(followers)}</p>
            <p className="text-[9px] text-[#8b949e]">Followers</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#21262d]">
            <p className="text-sm font-bold text-[#c9d1d9]">{following}</p>
            <p className="text-[9px] text-[#8b949e]">Following</p>
          </div>
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />
            <span className="text-[10px] font-semibold text-[#34d399]">Verified Player</span>
            <span className="text-[9px] text-[#8b949e] ml-auto">50+ appearances</span>
          </div>
        )}

        {/* Recent Activity Grid */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider">Recent Activity</span>
          <div className="grid grid-cols-3 gap-1.5">
            {recentActivity.map((activity, i) => {
              const colors = ['#34d399', '#3b82f6', '#a78bfa', '#f59e0b', '#ef4444'];
              const bgColor = colors[i % colors.length];
              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-[8px] font-medium text-[#8b949e] text-center p-1"
                  style={{ backgroundColor: `${bgColor}08`, border: `1px solid ${bgColor}15` }}
                >
                  {activity}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 7. Fan Mail Section
// ============================================================

function FanMailSection({ fanMails }: { fanMails: FanMail[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMails = expanded ? fanMails : fanMails.slice(0, 3);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-[#f59e0b]" />
        <span className="text-sm font-semibold text-[#c9d1d9]">Fan Mail</span>
        <Badge className="text-[9px] font-semibold px-1.5 py-0.5 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
          {fanMails.length} new
        </Badge>
        <div className="flex-1" />
      </div>

      <div className="space-y-2">
        {visibleMails.map((mail) => {
          const styles = getSentimentBadgeStyles(mail.sentiment);
          return (
            <motion.div
              key={mail.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AvatarPlaceholder name={mail.fanName} size={6} color="#8b949e" />
                  <div>
                    <span className="text-xs font-semibold text-[#c9d1d9]">{mail.fanName}</span>
                    <p className="text-[9px] text-[#484f58]">{mail.location}</p>
                  </div>
                </div>
                <Badge
                  className="text-[8px] font-semibold px-1.5 py-0.5 border"
                  style={{ color: styles.color, backgroundColor: styles.bg, borderColor: `${styles.color}30` }}
                >
                  {mail.sentiment}
                </Badge>
              </div>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">{mail.message}</p>
            </motion.div>
          );
        })}
      </div>

      {!expanded && fanMails.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2 rounded-lg text-[11px] font-semibold text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 hover:bg-[#34d399]/15 transition-colors"
        >
          Read All ({fanMails.length})
        </button>
      )}

      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full py-2 rounded-lg text-[11px] font-semibold text-[#8b949e] bg-[#21262d] border border-[#30363d] hover:border-[#484f58] transition-colors"
        >
          Show Less
        </button>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SocialMediaFeed() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<string>('feed');

  const playerName = gameState?.player.name ?? 'Your Player';
  const clubName = gameState?.currentClub.name ?? 'Your Club';
  const reputation = gameState?.player.reputation ?? 50;
  const totalPosts = gameState?.socialFeed.length ?? 12;
  const totalAppearances = gameState?.player.careerStats.totalAppearances ?? 0;
  const leagueName = gameState?.currentClub.league ?? 'Premier League';

  const feedPosts = useMemo(() => generateFeedPosts(playerName, clubName), [playerName, clubName]);
  const trendingTopics = useMemo(() => generateTrendingTopics(playerName, leagueName), [playerName, leagueName]);
  const fanMails = useMemo(() => generateFanMails(), []);

  return (
    <div className="max-w-lg mx-auto p-3 space-y-4 pb-8">
      {/* 1. Social Feed Header */}
      <SocialFeedHeader
        playerName={playerName}
        reputation={reputation}
        totalPosts={totalPosts}
      />

      {/* 2. Create Post Panel */}
      <CreatePostPanel playerName={playerName} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 bg-[#161b22] border border-[#30363d] h-10">
          <TabsTrigger
            value="feed"
            className="text-[11px] font-semibold data-[state=active]:bg-[#34d399]/15 data-[state=active]:text-[#34d399]"
          >
            Feed & Trending
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="text-[11px] font-semibold data-[state=active]:bg-[#34d399]/15 data-[state=active]:text-[#34d399]"
          >
            Messages & Profile
          </TabsTrigger>
        </TabsList>

        {/* Feed & Trending Tab */}
        <TabsContent value="feed" className="space-y-4 mt-4">
          {/* 3. Feed Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#c9d1d9]">Timeline</span>
              <Badge className="text-[9px] font-semibold px-1.5 py-0.5 bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                {feedPosts.length} posts
              </Badge>
              <div className="flex-1 h-px bg-[#21262d]" />
            </div>
            <FeedTimeline posts={feedPosts} />
          </div>

          {/* 4. Trending Topics */}
          <TrendingTopicsSidebar topics={trendingTopics} leagueName={leagueName} />

          {/* 7. Fan Mail Section */}
          <FanMailSection fanMails={fanMails} />
        </TabsContent>

        {/* Messages & Profile Tab */}
        <TabsContent value="social" className="space-y-4 mt-4">
          {/* 5. Direct Messages */}
          <DirectMessages playerName={playerName} />

          {/* 6. Player Profile Preview */}
          <PlayerProfilePreview
            playerName={playerName}
            clubName={clubName}
            reputation={reputation}
            totalPosts={totalPosts}
            totalAppearances={totalAppearances}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
