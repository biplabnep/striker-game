'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  TrendingUp,
  Newspaper,
  Users,
  Mic,
  Heart,
  Share2,
  Reply,
  CheckCircle2,
  Briefcase,
  Star,
  Quote,
  Flame,
  ShieldCheck,
  Eye,
  Bookmark,
  Image,
  BarChart3,
  MapPin,
  UserPlus,
  Trophy,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SocialPost, Storyline } from '@/lib/game/types';

// ============================================================
// Constants & Helpers
// ============================================================

type PostType = SocialPost['type'];

const POST_TYPE_CONFIG: Record<PostType, {
  emoji: string;
  label: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  headerBg: string;
}> = {
  fan: {
    emoji: '⚽',
    label: 'Fan',
    accentColor: 'text-rose-400',
    bgColor: 'bg-rose-500/5',
    borderColor: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20',
    headerBg: 'bg-rose-500/10',
  },
  media: {
    emoji: '📰',
    label: 'Media',
    accentColor: 'text-sky-400',
    bgColor: 'bg-sky-500/5',
    borderColor: 'border-sky-500/20',
    iconBg: 'bg-sky-500/20',
    headerBg: 'bg-sky-500/10',
  },
  official: {
    emoji: '🏟️',
    label: 'Official',
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    headerBg: 'bg-emerald-500/10',
  },
  agent: {
    emoji: '💼',
    label: 'Agent',
    accentColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
    headerBg: 'bg-amber-500/10',
  },
  pundit: {
    emoji: '🎙️',
    label: 'Pundit',
    accentColor: 'text-violet-400',
    bgColor: 'bg-violet-500/5',
    borderColor: 'border-violet-500/20',
    iconBg: 'bg-violet-500/20',
    headerBg: 'bg-violet-500/10',
  },
};

function getSentimentEmoji(s: number): string {
  if (s >= 40) return '😊';
  if (s >= 10) return '🙂';
  if (s >= -10) return '😐';
  if (s >= -40) return '😟';
  return '😤';
}

function getSentimentLabel(s: number): string {
  if (s >= 40) return 'Very Positive';
  if (s >= 10) return 'Positive';
  if (s >= -10) return 'Neutral';
  if (s >= -40) return 'Negative';
  return 'Very Negative';
}

function getSentimentColor(s: number): string {
  if (s >= 40) return 'text-emerald-400';
  if (s >= 10) return 'text-green-400';
  if (s >= -10) return 'text-[#8b949e]';
  if (s >= -40) return 'text-orange-400';
  return 'text-red-400';
}

function getSentimentBg(s: number): string {
  if (s >= 40) return 'bg-emerald-500/15 border-emerald-500/30';
  if (s >= 10) return 'bg-green-500/15 border-green-500/30';
  if (s >= -10) return 'bg-slate-500/15 border-slate-500/30';
  if (s >= -40) return 'bg-orange-500/15 border-orange-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

function getEngagementColor(e: number): string {
  if (e >= 80) return 'bg-rose-500';
  if (e >= 60) return 'bg-amber-500';
  if (e >= 40) return 'bg-sky-500';
  if (e >= 20) return 'bg-slate-500';
  return 'bg-slate-700';
}

function formatTimestamp(week: number, season: number): string {
  return `Week ${week}, Season ${season}`;
}

function getTimeAgoLabel(week: number, season: number, currentWeek: number, currentSeason: number): string {
  const seasonDiff = currentSeason - season;
  if (seasonDiff > 0) return seasonDiff === 1 ? 'Last season' : `${seasonDiff} seasons ago`;
  const weekDiff = currentWeek - week;
  if (weekDiff <= 0) return 'Now';
  if (weekDiff === 1) return '1w ago';
  if (weekDiff < 4) return `${weekDiff}w ago`;
  if (weekDiff < 8) return '1mo ago';
  return `${Math.floor(weekDiff / 4)}mo ago`;
}

const TRENDING_THRESHOLD = 75;

/** Small trending badge shown on high-engagement posts */
function TrendingBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded">
      <Flame className="h-2.5 w-2.5" />
      Trending
    </span>
  );
}

/** Verified checkmark for official/club accounts */
function VerifiedBadge({ type }: { type: PostType }) {
  const colorMap: Record<PostType, string> = {
    official: 'text-emerald-400',
    media: 'text-sky-400',
    agent: 'text-amber-400',
    pundit: 'text-violet-400',
    fan: 'text-[#484f58]',
  };
  return (
    <span className={`inline-flex items-center ${colorMap[type]}`} title="Verified account">
      <CheckCircle2 className="h-3 w-3 fill-current" />
    </span>
  );
}

function getPhaseDescription(story: Storyline): string {
  const phase = story.currentPhase;
  const total = story.totalPhases;
  const ratio = phase / total;

  if (ratio <= 0.25) return 'Story is just beginning to unfold...';
  if (ratio <= 0.5) return 'Narrative is developing and gaining traction.';
  if (ratio <= 0.75) return 'This story is at its peak — all eyes are watching.';
  return 'The story is reaching its conclusion.';
}

function getMediaNarrative(story: Storyline): string {
  const s = story.sentiment;
  if (s >= 40) return 'The media is praising your performance.';
  if (s >= 10) return 'The media is cautiously optimistic about you.';
  if (s >= -10) return 'The media has mixed feelings about you.';
  if (s >= -40) return 'The media is critical of your recent form.';
  return 'The media is harshly scrutinizing you.';
}

function getStarsForSentiment(s: number): number {
  if (s >= 60) return 5;
  if (s >= 30) return 4;
  if (s >= 0) return 3;
  if (s >= -30) return 2;
  return 1;
}

// ============================================================
// Sub-Components
// ============================================================

/** Engagement bar with percentage */
function EngagementBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getEngagementColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-[#8b949e] w-8 text-right">{value}%</span>
    </div>
  );
}

/** Sentiment gauge — horizontal bar */
function SentimentGauge({ value }: { value: number }) {
  // Normalize -100..100 to 0..100
  const normalized = ((value + 100) / 200) * 100;

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-amber-500/30" />
      <div className="relative -mt-2 h-2">
        <motion.div
          className="absolute top-0 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-900 shadow-md"
          style={{ left: `calc(${normalized}% - 5px)` }}
          initial={{ left: '50%' }}
          animate={{ left: `calc(${normalized}% - 5px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        />
      </div>
    </div>
  );
}

/** Star rating for pundit posts */
function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= count ? 'text-amber-400 fill-amber-400' : 'text-[#484f58]'}`}
        />
      ))}
    </div>
  );
}

/** Mock interaction buttons with full engagement bar */
function InteractionButtons({
  type,
  engagement,
  onLike,
  showViews = false,
  threadDepth = 0,
}: {
  type: PostType;
  engagement: number;
  onLike: () => void;
  showViews?: boolean;
  threadDepth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike();
  };

  return (
    <div className="space-y-1.5 mt-2.5 pt-2.5 border-t border-[#30363d]">
      {/* Reply thread indicator */}
      {threadDepth > 0 && (
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(threadDepth, 3) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-sm bg-slate-600" />
            ))}
          </div>
          <span className="text-[10px] text-[#8b949e]">
            {threadDepth} {threadDepth === 1 ? 'reply' : 'replies'} in thread
          </span>
        </div>
      )}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 hover:bg-rose-500/10 rounded"
          onClick={handleLike}
        >
          <motion.div
            animate={liked ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart className={`h-3.5 w-3.5 transition-colors ${liked ? 'fill-rose-500 text-rose-500' : 'text-[#8b949e]'}`} />
          </motion.div>
          <span className={liked ? 'text-rose-400' : 'text-[#8b949e]'}>
            {liked ? Math.floor(engagement * 2.3) + 1 : Math.floor(engagement * 2.3)}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 hover:bg-sky-500/10 rounded"
          onClick={() => setShared(!shared)}
        >
          <Share2 className={`h-3.5 w-3.5 transition-colors ${shared ? 'text-sky-400' : 'text-[#8b949e]'}`} />
          <span className={shared ? 'text-sky-400' : 'text-[#8b949e]'}>
            {shared ? Math.floor(engagement * 0.8) + 1 : Math.floor(engagement * 0.8)}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 hover:bg-slate-500/10 rounded"
        >
          <Reply className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[#8b949e]">{Math.floor(engagement * 0.4)}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 hover:bg-amber-500/10 rounded"
          onClick={() => setBookmarked(!bookmarked)}
        >
          <Bookmark className={`h-3.5 w-3.5 transition-colors ${bookmarked ? 'fill-amber-400 text-amber-400' : 'text-[#8b949e]'}`} />
        </Button>
        {/* View count for media posts */}
        {showViews && (
          <div className="ml-auto flex items-center gap-1">
            <Eye className="h-3 w-3 text-[#484f58]" />
            <span className="text-[10px] text-[#484f58]">
              {(engagement * 127).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Fan Post Card — casual, rounded, warm tones */
function FanPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.fan;
  const isTrending = post.engagement >= TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center text-sm`}>
            {config.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <Users className="h-3 w-3 text-rose-400/60" />
              {isTrending && <TrendingBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
              <span className="text-[10px] text-[#484f58]">·</span>
              <span className="text-[10px] text-[#484f58]">{post.engagement}% engaged</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
          <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="h-3 w-3 text-rose-400" />
              <span className="text-[10px] text-[#8b949e]">Engagement</span>
            </div>
            <EngagementBar value={post.engagement} />
          </div>
          <InteractionButtons type="fan" engagement={post.engagement} onLike={() => {}} threadDepth={Math.floor(post.engagement / 25)} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Media Post Card — professional, newspaper style */
function MediaPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.media;
  const isTrending = post.engagement >= TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <Newspaper className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <VerifiedBadge type="media" />
              {isTrending && <TrendingBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e] italic">{formatTimestamp(post.week, post.season)}</span>
              <span className="text-[10px] text-[#484f58]">·</span>
              <span className="text-[10px] text-sky-400/60 flex items-center gap-0.5">
                <Eye className="h-2.5 w-2.5" />
                {(post.engagement * 127).toLocaleString()} views
              </span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
          <div className="relative pl-4">
            <Quote className="absolute left-0 top-0 h-4 w-4 text-sky-500/30" />
            <p className="text-sm text-[#c9d1d9] leading-relaxed italic">{post.content}</p>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3 w-3 text-sky-400" />
              <span className="text-[10px] text-[#8b949e]">Readership</span>
            </div>
            <EngagementBar value={post.engagement} />
          </div>
          <InteractionButtons type="media" engagement={post.engagement} onLike={() => {}} showViews />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Official Post Card — club style, verified, formal */
function OfficialPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.official;
  const isTrending = post.engagement >= TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        {/* Top accent bar */}
        <div className="h-1 bg-emerald-500" />
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center text-sm`}>
            {config.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#c9d1d9] truncate">{post.source}</span>
              <VerifiedBadge type="official" />
              {isTrending && <TrendingBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
              <span className="text-[10px] text-[#484f58]">·</span>
              <span className="text-[10px] text-emerald-400/60">Official Club Post</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
          <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-[#8b949e]">Reach</span>
            </div>
            <EngagementBar value={post.engagement} />
          </div>
          <InteractionButtons type="official" engagement={post.engagement} onLike={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Agent Post Card — business/contract style */
function AgentPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.agent;
  const isTrending = post.engagement >= TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <Briefcase className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <VerifiedBadge type="agent" />
              <Badge className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 border">
                AGENT
              </Badge>
              {isTrending && <TrendingBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
              <span className="text-[10px] text-[#484f58]">·</span>
              <span className="text-[10px] text-amber-400/60">Private Communication</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
          <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-[#8b949e]">Market Interest</span>
            </div>
            <EngagementBar value={post.engagement} />
          </div>
          <InteractionButtons type="agent" engagement={post.engagement} onLike={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Pundit Post Card — opinion style, speech bubble, rating stars, quote retweet */
function PunditPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.pundit;
  const isTrending = post.engagement >= TRENDING_THRESHOLD;

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <Mic className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <VerifiedBadge type="pundit" />
              <StarRating count={getStarsForSentiment(post.sentiment)} />
              {isTrending && <TrendingBadge />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
              <span className="text-[10px] text-[#484f58]">·</span>
              <span className="text-[10px] text-violet-400/60">Pundit Analysis</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
          {/* Quote retweet style */}
          <div className="flex items-center gap-1 mb-2">
            <Reply className="h-3 w-3 text-violet-400/50" />
            <span className="text-[10px] text-violet-400/60 font-medium">Expert Take</span>
          </div>
          {/* Speech bubble style */}
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg rounded-tl-sm p-2.5">
            <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-[#8b949e]">Hot Takes</span>
            </div>
            <EngagementBar value={post.engagement} />
          </div>
          <InteractionButtons type="pundit" engagement={post.engagement} onLike={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Renders the appropriate post card based on type */
function PostCard({ post, index }: { post: SocialPost; index: number }) {
  // Deterministically show poll for every 3rd fan post with high engagement
  const showPoll = post.type === 'fan' && post.engagement > 40 && (post.id.charCodeAt(post.id.length - 1) % 3 === 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        delay: index * 0.06,
        ease: 'easeOut',
      }}
    >
      {showPoll ? <PollPost post={post} /> : (
        <SpecificPostCard post={post} />
      )}
    </motion.div>
  );
}

/** Renders the specific typed post card */
function SpecificPostCard({ post }: { post: SocialPost }) {
  const cardMap: Record<PostType, React.FC<{ post: SocialPost }>> = {
    fan: FanPostCard,
    media: MediaPostCard,
    official: OfficialPostCard,
    agent: AgentPostCard,
    pundit: PunditPostCard,
  };

  const CardComponent = cardMap[post.type];
  return <CardComponent post={post} />;
}

// ============================================================
// Story Highlights Row
// ============================================================

const STORY_HIGHLIGHTS = [
  { id: 'your-story', label: 'Your Story', emoji: '📸', color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-400/50', active: true },
  { id: 'club-official', label: 'Club Official', emoji: '🏟️', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-400/50', active: true },
  { id: 'team-news', label: 'Team News', emoji: '📰', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-400/50', active: false },
  { id: 'transfer-rumors', label: 'Transfers', emoji: '💰', color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-400/50', active: true },
  { id: 'fan-zone', label: 'Fan Zone', emoji: '⚽', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-400/50', active: false },
] as const;

function StoryHighlightsRow() {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Stories</span>
        <div className="flex-1 h-px bg-[#21262d]" />
      </div>
      <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {STORY_HIGHLIGHTS.map((story) => (
          <button
            key={story.id}
            onClick={() => setSelectedStory(selectedStory === story.id ? null : story.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border-2 transition-colors ${
                selectedStory === story.id
                  ? `${story.bg} ${story.border}`
                  : story.active
                  ? `${story.bg} ${story.border} opacity-60`
                  : 'bg-[#21262d] border-[#30363d] opacity-40'
              }`}
            >
              {story.emoji}
            </div>
            <span className={`text-[9px] whitespace-nowrap transition-colors ${
              selectedStory === story.id ? story.color : 'text-[#8b949e]'
            }`}>
              {story.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Social Stats Dashboard
// ============================================================

function SocialStatsDashboard({
  playerName,
  postCount,
  avgSentiment,
  reputation,
}: {
  playerName: string;
  postCount: number;
  avgSentiment: number;
  reputation: number;
}) {
  // Derived stats
  const followers = Math.max(100, reputation * reputation * 12 + postCount * 45);
  const engagementRate = postCount > 0
    ? Math.min(99, Math.round(30 + avgSentiment * 0.4 + reputation * 0.3))
    : 0;
  const socialRanking = Math.max(1, 500 - reputation * 25 - Math.floor(postCount / 5) * 2);

  const stats = [
    {
      label: 'Followers',
      value: followers >= 1000000
        ? `${(followers / 1000000).toFixed(1)}M`
        : followers >= 1000
        ? `${(followers / 1000).toFixed(1)}K`
        : followers.toString(),
      icon: UserPlus,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Posts',
      value: postCount.toString(),
      icon: MessageSquare,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Engagement',
      value: `${engagementRate}%`,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Social Rank',
      value: `#${socialRanking}`,
      icon: Trophy,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Your Profile</span>
        <div className="flex-1 h-px bg-[#21262d]" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-lg p-2 text-center space-y-1`}
          >
            <stat.icon className={`h-4 w-4 ${stat.color} mx-auto`} />
            <p className="text-xs font-bold text-[#c9d1d9] leading-none">{stat.value}</p>
            <p className="text-[9px] text-[#8b949e] leading-none">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Create Post Section
// ============================================================

const MAX_POST_CHARS = 280;

function CreatePostSection({ playerName }: { playerName: string }) {
  const [draft, setDraft] = useState('');
  const charCount = draft.length;
  const isNearLimit = charCount > MAX_POST_CHARS * 0.85;
  const isOverLimit = charCount > MAX_POST_CHARS;

  const quickActions = [
    { icon: Image, label: 'Photo', color: 'text-sky-400 hover:bg-sky-500/10' },
    { icon: BarChart3, label: 'Poll', color: 'text-amber-400 hover:bg-amber-500/10' },
    { icon: MapPin, label: 'Location', color: 'text-rose-400 hover:bg-rose-500/10' },
  ];

  return (
    <Card className="bg-[#161b22] border border-[#30363d] overflow-hidden">
      <CardContent className="p-3 space-y-2.5">
        {/* Composer area */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
            {playerName?.charAt(0) ?? 'Y'}
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share your thoughts with fans..."
              className="min-h-[60px] max-h-[120px] text-sm bg-transparent border-none resize-none focus-visible:ring-0 placeholder:text-[#484f58] text-[#c9d1d9] p-0 leading-relaxed"
              style={{ boxShadow: 'none' }}
            />
            <div className="h-px bg-[#21262d]" />
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 rounded ${action.color}`}
                    title={action.label}
                  >
                    <action.icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {/* Character count */}
                <span className={`text-[10px] tabular-nums ${
                  isOverLimit ? 'text-red-400 font-semibold' : isNearLimit ? 'text-amber-400' : 'text-[#484f58]'
                }`}>
                  {charCount}/{MAX_POST_CHARS}
                </span>
                {/* Character bar */}
                <div className="w-12 h-1 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-colors ${
                      isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    animate={{ width: `${Math.min(100, (charCount / MAX_POST_CHARS) * 100)}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                {/* Post button */}
                <Button
                  size="sm"
                  className="h-7 px-3 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={draft.trim().length === 0 || isOverLimit}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Poll Post Component (for fan engagement)
// ============================================================

function PollPost({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.fan;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Deterministic "poll" options derived from post data
  const options = [
    { label: 'Great performance', votes: Math.floor(post.engagement * 4.5) },
    { label: 'Average showing', votes: Math.floor(post.engagement * 2.8) },
    { label: 'Needs improvement', votes: Math.floor(post.engagement * 1.2) },
  ];
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={`bg-[#161b22] ${config.borderColor} border overflow-hidden`}>
        <div className={`${config.headerBg} px-3 py-2 flex items-center gap-2`}>
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center text-sm`}>
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <Badge className="text-[8px] px-1 py-0 bg-rose-500/20 text-rose-400 border-rose-500/30 border">
                POLL
              </Badge>
            </div>
            <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
          </div>
        </div>
        <CardContent className="p-3 pt-2.5 space-y-3">
          <p className="text-sm text-[#c9d1d9] leading-relaxed">{post.content}</p>
          {/* Poll options */}
          <div className="space-y-2">
            {options.map((option, i) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isSelected = selectedOption === i;
              const showResults = selectedOption !== null;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full relative rounded-lg border overflow-hidden text-left transition-colors ${
                    isSelected
                      ? 'border-rose-500/40'
                      : showResults
                      ? 'border-[#30363d]'
                      : 'border-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  {/* Background bar */}
                  {showResults && (
                    <motion.div
                      className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-rose-500/15' : 'bg-slate-700/30'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-[12px] text-[#c9d1d9]">{option.label}</span>
                    {showResults && (
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-rose-400' : 'text-[#8b949e]'}`}>
                        {percentage}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-[#484f58]">{totalVotes.toLocaleString()} votes</span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Enhanced Storyline Card */
function StorylineCard({ story, index }: { story: Storyline; index: number }) {
  const phaseProgress = (story.currentPhase / story.totalPhases) * 100;
  const phaseDesc = getPhaseDescription(story);
  const mediaNarrative = getMediaNarrative(story);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      whileHover={{ opacity: 0.9 }}
    >
      <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-sm font-semibold text-[#c9d1d9] truncate">{story.title}</p>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">{story.description}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 border ${getSentimentBg(story.sentiment)}`}
          >
            <span className="mr-0.5">{getSentimentEmoji(story.sentiment)}</span>
            <span className={getSentimentColor(story.sentiment)}>
              {story.sentiment > 0 ? '+' : ''}{story.sentiment}
            </span>
          </Badge>
        </div>

        {/* Phase Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8b949e]  font-medium">Phase Progress</span>
            <span className="text-[10px] text-[#8b949e] font-medium">
              {story.currentPhase} / {story.totalPhases}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${phaseProgress}%` }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            {/* Phase dots */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: story.totalPhases }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < story.currentPhase
                      ? 'bg-amber-400'
                      : i === story.currentPhase
                      ? 'bg-amber-400/40 ring-1 ring-amber-400/60'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1 italic">{phaseDesc}</p>
        </div>

        {/* Sentiment Gauge */}
        <div>
          <span className="text-[10px] text-[#8b949e]  font-medium">Public Sentiment</span>
          <div className="mt-1.5">
            <SentimentGauge value={story.sentiment} />
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1.5 italic">{mediaNarrative}</p>
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {story.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-[#30363d] text-[#8b949e]"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Trending Post — compact view of most engaged post */
function TrendingPost({ post, rank }: { post: SocialPost; rank: number }) {
  const config = POST_TYPE_CONFIG[post.type];

  return (
    <motion.div
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#21262d] transition-colors"
      whileHover={{ opacity: 0.9 }}
    >
      <div className={`w-6 h-6 rounded-full ${config.iconBg} flex items-center justify-center text-[10px] font-bold ${config.accentColor}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#c9d1d9] truncate">{post.content}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-[#8b949e]">{post.source}</span>
          <span className="text-[9px] text-[#484f58]">•</span>
          <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
            <Flame className="h-2.5 w-2.5" /> {post.engagement}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SocialFeed() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<string>('all');

  const socialFeed = gameState?.socialFeed ?? [];
  const storylines = gameState?.storylines ?? [];
  const player = gameState?.player;

  // Filter posts by tab
  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return socialFeed.slice(0, 20);
    if (activeTab === 'media') return socialFeed.filter(p => p.type === 'media').slice(0, 20);
    if (activeTab === 'fan') return socialFeed.filter(p => p.type === 'fan').slice(0, 20);
    if (activeTab === 'official') return socialFeed.filter(p => p.type === 'official' || p.type === 'agent').slice(0, 20);
    return socialFeed.slice(0, 20);
  }, [socialFeed, activeTab]);

  // Active storylines
  const activeStorylines = storylines.filter(s => s.status === 'active');

  // Trending posts — top 3 by engagement
  const trendingPosts = useMemo(() => {
    return [...socialFeed]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3);
  }, [socialFeed]);

  // Post type counts
  const postCounts = useMemo(() => {
    return {
      all: socialFeed.length,
      media: socialFeed.filter(p => p.type === 'media').length,
      fan: socialFeed.filter(p => p.type === 'fan').length,
      official: socialFeed.filter(p => p.type === 'official' || p.type === 'agent').length,
    };
  }, [socialFeed]);

  if (!gameState) return null;

  // Overall sentiment across all posts
  const avgSentiment = socialFeed.length > 0
    ? Math.round(socialFeed.reduce((sum, p) => sum + p.sentiment, 0) / socialFeed.length)
    : 0;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#c9d1d9]">Social Feed</h2>
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
              {postCounts.all} posts
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{getSentimentEmoji(avgSentiment)}</span>
            <span className={`text-xs font-medium ${getSentimentColor(avgSentiment)}`}>
              {avgSentiment > 0 ? '+' : ''}{avgSentiment}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#8b949e]">
          How the world sees <span className="text-[#c9d1d9] font-medium">{player?.name || 'you'}</span>
        </p>
      </motion.div>

      {/* Social Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <SocialStatsDashboard
          playerName={player?.name ?? 'You'}
          postCount={socialFeed.length}
          avgSentiment={avgSentiment}
          reputation={player?.reputation ?? 5}
        />
      </motion.div>

      {/* Story Highlights Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.08 }}
      >
        <StoryHighlightsRow />
      </motion.div>

      {/* Create Post Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <CreatePostSection playerName={player?.name ?? 'You'} />
      </motion.div>

      {/* Trending Section */}
      {trendingPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="bg-[#161b22]/60 border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-rose-400" /> Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="divide-y divide-slate-800/40">
                {trendingPosts.map((post, i) => (
                  <TrendingPost key={post.id} post={post} rank={i + 1} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Storylines */}
      {activeStorylines.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Card className="bg-[#161b22]/60 border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> Active Storylines
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {activeStorylines.map((story, i) => (
                <StorylineCard key={story.id} story={story} index={i} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Feed Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#21262d] h-9 p-0.5">
            <TabsTrigger
              value="all"
              className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-[#c9d1d9]"
            >
              All
              {postCounts.all > 0 && (
                <span className="ml-1 text-[9px] text-[#8b949e]">({postCounts.all})</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-sky-400"
            >
              <Newspaper className="h-3 w-3" />
              Media
            </TabsTrigger>
            <TabsTrigger
              value="fan"
              className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-rose-400"
            >
              <Users className="h-3 w-3" />
              Fans
            </TabsTrigger>
            <TabsTrigger
              value="official"
              className="flex-1 text-[11px] data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400"
            >
              <ShieldCheck className="h-3 w-3" />
              Official
            </TabsTrigger>
          </TabsList>

          {/* All tabs share the same content area, just filtered differently */}
          <TabsContent value={activeTab} className="mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredPosts.length === 0 ? (
                  <Card className="bg-[#161b22]/50 border-[#30363d]">
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                      <p className="text-sm text-[#8b949e]">
                        {socialFeed.length === 0
                          ? 'No posts yet. Play matches to generate social media reactions!'
                          : 'No posts in this category yet.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-0 divide-y divide-[#21262d]/60">
                    {filteredPosts.map((post, index) => (
                      <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                        <PostCard post={post} index={index} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
