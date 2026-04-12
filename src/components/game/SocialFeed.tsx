'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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

/** Sentiment gauge — horizontal bar with gradient */
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

/** Mock interaction buttons */
function InteractionButtons({ type, engagement, onLike }: { type: PostType; engagement: number; onLike: () => void }) {
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike();
  };

  return (
    <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[#30363d]">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] gap-1 hover:bg-rose-500/10"
        onClick={handleLike}
      >
        <motion.div
          animate={liked ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.2 }}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500 text-rose-500' : 'text-[#8b949e]'}`} />
        </motion.div>
        <span className={liked ? 'text-rose-400' : 'text-[#8b949e]'}>
          {liked ? Math.floor(engagement * 2.3) + 1 : Math.floor(engagement * 2.3)}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] gap-1 hover:bg-sky-500/10"
        onClick={() => setShared(!shared)}
      >
        <Share2 className={`h-3.5 w-3.5 ${shared ? 'text-sky-400' : 'text-[#8b949e]'}`} />
        <span className={shared ? 'text-sky-400' : 'text-[#8b949e]'}>
          {shared ? Math.floor(engagement * 0.8) + 1 : Math.floor(engagement * 0.8)}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] gap-1 hover:bg-slate-500/10"
      >
        <Reply className="h-3.5 w-3.5 text-[#8b949e]" />
        <span className="text-[#8b949e]">{Math.floor(engagement * 0.4)}</span>
      </Button>
    </div>
  );
}

/** Fan Post Card — casual, rounded, warm tones */
function FanPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.fan;

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
            </div>
            <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
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
          <InteractionButtons type="fan" engagement={post.engagement} onLike={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Media Post Card — professional, newspaper style */
function MediaPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.media;

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
              <CheckCircle2 className="h-3 w-3 text-sky-400" />
            </div>
            <span className="text-[10px] text-[#8b949e] italic">{formatTimestamp(post.week, post.season)}</span>
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
          <InteractionButtons type="media" engagement={post.engagement} onLike={() => {}} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Official Post Card — club style, verified, formal */
function OfficialPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.official;

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
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
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
              <Badge className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 border">
                AGENT
              </Badge>
            </div>
            <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
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

/** Pundit Post Card — opinion style, speech bubble, rating stars */
function PunditPostCard({ post }: { post: SocialPost }) {
  const config = POST_TYPE_CONFIG.pundit;

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
              <StarRating count={getStarsForSentiment(post.sentiment)} />
            </div>
            <span className="text-[10px] text-[#8b949e]">{formatTimestamp(post.week, post.season)}</span>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 border ${getSentimentBg(post.sentiment)}`}>
            <span className="mr-0.5">{getSentimentEmoji(post.sentiment)}</span>
            <span className={getSentimentColor(post.sentiment)}>{getSentimentLabel(post.sentiment)}</span>
          </Badge>
        </div>
        <CardContent className="p-3 pt-2.5">
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
  const cardMap: Record<PostType, React.FC<{ post: SocialPost }>> = {
    fan: FanPostCard,
    media: MediaPostCard,
    official: OfficialPostCard,
    agent: AgentPostCard,
    pundit: PunditPostCard,
  };

  const CardComponent = cardMap[post.type];

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
      <CardComponent post={post} />
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
                  <div className="space-y-3">
                    {filteredPosts.map((post, index) => (
                      <PostCard key={post.id} post={post} index={index} />
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
