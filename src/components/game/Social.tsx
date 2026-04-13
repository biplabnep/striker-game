'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { SocialPost } from '@/lib/game/types';

// ============================================================
// Types & Helpers
// ============================================================

type PostType = SocialPost['type'];

/** Maps post type → timeline accent color class */
const TIMELINE_ACCENT: Record<PostType, string> = {
  official: 'border-l-emerald-500',
  media: 'border-l-sky-400',
  agent: 'border-l-amber-400',
  pundit: 'border-l-purple-400',
  fan: 'border-l-rose-400',
};

const TIMELINE_DOT_COLOR: Record<PostType, string> = {
  official: 'bg-emerald-400',
  media: 'bg-sky-400',
  agent: 'bg-amber-400',
  pundit: 'bg-purple-400',
  fan: 'bg-rose-400',
};

const TIMELINE_LABEL_COLOR: Record<PostType, string> = {
  official: 'text-emerald-400',
  media: 'text-sky-400',
  agent: 'text-amber-400',
  pundit: 'text-purple-400',
  fan: 'text-rose-400',
};

const TIMELINE_AVATAR_BG: Record<PostType, string> = {
  official: 'bg-emerald-500/20 text-emerald-400',
  media: 'bg-sky-500/20 text-sky-400',
  agent: 'bg-amber-500/20 text-amber-400',
  pundit: 'bg-purple-500/20 text-purple-400',
  fan: 'bg-rose-500/20 text-rose-400',
};

function getRelativeTime(week: number, season: number, currentWeek: number, currentSeason: number): string {
  const seasonDiff = currentSeason - season;
  if (seasonDiff > 0) return seasonDiff === 1 ? 'Last season' : `${seasonDiff} seasons ago`;
  const weekDiff = currentWeek - week;
  if (weekDiff <= 0) return 'Now';
  if (weekDiff === 1) return '1w ago';
  if (weekDiff < 4) return `${weekDiff}w ago`;
  if (weekDiff < 8) return '1mo ago';
  return `${Math.floor(weekDiff / 4)}mo ago`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ============================================================
// 1. Social Feed Timeline
// ============================================================

/** Small SVG icons for Like / Comment / Share */
function LikeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4.5 4 3 5.5 3c1 0 1.8.5 2.5 1.5C8.7 3.5 9.5 3 10.5 3 12 3 13.5 4.5 13.5 6.5 13.5 10.5 8 14 8 14z" fill="currentColor" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TimelinePostCard({
  post,
  index,
  currentWeek,
  currentSeason,
}: {
  post: SocialPost;
  index: number;
  currentWeek: number;
  currentSeason: number;
}) {
  const [liked, setLiked] = useState(false);
  const likes = Math.floor(post.engagement * 2.3) + (liked ? 1 : 0);
  const comments = Math.floor(post.engagement * 0.6);
  const shares = Math.floor(post.engagement * 0.3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="relative pl-7"
    >
      {/* Vertical line */}
      <div className="absolute left-[9px] top-6 bottom-0 w-px bg-[#21262d]" />

      {/* Dot on timeline */}
      <div className={`absolute left-[5px] top-5 w-[9px] h-[9px] rounded-full ${TIMELINE_DOT_COLOR[post.type]} ring-2 ring-[#0d1117]`} />

      {/* Post card */}
      <div className={`bg-[#161b22] border border-[#21262d] ${TIMELINE_ACCENT[post.type]} border-l-2 rounded-lg overflow-hidden`}>
        {/* Header row */}
        <div className="flex items-center gap-2.5 px-3 pt-3 pb-1">
          {/* 24px avatar circle */}
          <div className={`w-6 h-6 rounded-full ${TIMELINE_AVATAR_BG[post.type]} flex items-center justify-center text-[10px] font-bold shrink-0`}>
            {post.source.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#c9d1d9] truncate">{post.source}</span>
              <span className={`text-[9px] font-medium ${TIMELINE_LABEL_COLOR[post.type]}`}>
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </span>
            </div>
            <span className="text-[10px] text-[#484f58]">
              {getRelativeTime(post.week, post.season, currentWeek, currentSeason)}
            </span>
          </div>
          {/* Engagement badge */}
          <span className="text-[9px] font-medium text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {post.engagement}% reach
          </span>
        </div>

        {/* Content */}
        <p className="text-[13px] text-[#c9d1d9] leading-relaxed px-3 pb-2.5">{post.content}</p>

        {/* Interaction row */}
        <div className="flex items-center gap-3 px-3 pb-2.5 pt-1 border-t border-[#21262d]/60">
          <button
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-1 group"
          >
            <LikeIcon className={`w-3.5 h-3.5 transition-colors ${liked ? 'text-rose-400' : 'text-[#484f58] group-hover:text-[#8b949e]'}`} />
            <span className={`text-[10px] transition-colors ${liked ? 'text-rose-400' : 'text-[#484f58]'}`}>
              {formatNumber(likes)}
            </span>
          </button>
          <div className="flex items-center gap-1">
            <CommentIcon className="w-3.5 h-3.5 text-[#484f58]" />
            <span className="text-[10px] text-[#484f58]">{formatNumber(comments)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShareIcon className="w-3.5 h-3.5 text-[#484f58]" />
            <span className="text-[10px] text-[#484f58]">{formatNumber(shares)}</span>
          </div>
          {/* Sentiment indicator */}
          <div className="ml-auto">
            <span className={`text-[10px] font-medium ${post.sentiment >= 10 ? 'text-emerald-400' : post.sentiment >= -10 ? 'text-[#8b949e]' : 'text-red-400'}`}>
              {post.sentiment > 0 ? '+' : ''}{post.sentiment}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 2. Follower Growth Chart (SVG)
// ============================================================

function FollowerGrowthChart({ reputation, postCount }: { reputation: number; postCount: number }) {
  // Derive 10 data points from reputation & postCount
  const baseFollowers = Math.max(100, reputation * reputation * 12 + postCount * 45);
  const dataPoints = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const growth = baseFollowers * (0.3 + 0.7 * Math.pow(i / 9, 1.4));
      points.push(Math.round(growth + (Math.sin(i * 1.7) * baseFollowers * 0.04)));
    }
    return points;
  }, [baseFollowers]);

  const width = 320;
  const height = 80;
  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...dataPoints);
  const minVal = Math.min(...dataPoints);
  const range = maxVal - minVal || 1;

  // Compute SVG path
  const svgPoints = dataPoints.map((v, i) => ({
    x: padding.left + (i / (dataPoints.length - 1)) * chartW,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
  }));

  const linePath = svgPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Closed area path
  const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${svgPoints[0].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = (padding.top + chartH * ratio).toFixed(1);
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#21262d"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="#58a6ff" fillOpacity="0.12" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {svgPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={i === svgPoints.length - 1 ? 3 : 1.5}
            fill={i === svgPoints.length - 1 ? '#58a6ff' : '#161b22'}
            stroke="#58a6ff"
            strokeWidth="1"
          />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="flex items-center justify-between mt-1 px-0.5">
        {dataPoints.map((v, i) => (
          <span key={i} className="text-[8px] text-[#484f58] tabular-nums">
            {i % 3 === 0 || i === dataPoints.length - 1 ? formatNumber(v) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. Social Influence Score Meter
// ============================================================

interface InfluenceSegment {
  label: string;
  pct: number;
  color: string;
  textColor: string;
}

const INFLUENCE_SEGMENTS: InfluenceSegment[] = [
  { label: 'Low', pct: 25, color: 'bg-slate-600', textColor: 'text-[#8b949e]' },
  { label: 'Medium', pct: 50, color: 'bg-sky-500', textColor: 'text-sky-400' },
  { label: 'High', pct: 75, color: 'bg-amber-500', textColor: 'text-amber-400' },
  { label: 'Iconic', pct: 100, color: 'bg-rose-500', textColor: 'text-rose-400' },
];

function getInfluenceLevel(score: number): { label: string; color: string; textColor: string } {
  if (score >= 75) return { label: 'Iconic', color: 'bg-rose-500', textColor: 'text-rose-400' };
  if (score >= 50) return { label: 'High', color: 'bg-amber-500', textColor: 'text-amber-400' };
  if (score >= 25) return { label: 'Medium', color: 'bg-sky-500', textColor: 'text-sky-400' };
  return { label: 'Low', color: 'bg-slate-600', textColor: 'text-[#8b949e]' };
}

function SocialInfluenceMeter({ reputation, postCount }: { reputation: number; postCount: number }) {
  // Score 0-100 based on reputation and engagement
  const score = Math.min(100, Math.max(0, Math.round(
    (reputation / 20) * 60 + Math.min(postCount, 50) * 0.8
  )));
  const level = getInfluenceLevel(score);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Influence Score</span>
        <span className={`text-xs font-bold ${level.textColor}`}>
          {level.label} ({score})
        </span>
      </div>

      {/* Segmented bar */}
      <div className="relative flex items-center gap-0.5 h-3 rounded-lg overflow-hidden bg-[#0d1117]">
        {INFLUENCE_SEGMENTS.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} opacity-25`}
            style={{ flex: `${seg.pct - (INFLUENCE_SEGMENTS.find(s => s.label === seg.label && INFLUENCE_SEGMENTS.indexOf(s) > 0)?.pct ?? 0)}` }}
          />
        ))}
        {/* Active fill overlay */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 rounded-lg"
          style={{
            background: score >= 75 ? '#f43f5e' : score >= 50 ? '#f59e0b' : score >= 25 ? '#0ea5e9' : '#475569',
            opacity: 0.7,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Pointer */}
        <motion.div
          className="absolute top-[-1px] bottom-[-1px] w-1 bg-white rounded-sm"
          style={{ left: `calc(${score}% - 2px)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Segment labels */}
      <div className="flex items-center justify-between">
        {INFLUENCE_SEGMENTS.map((seg) => {
          const isActive = score >= seg.pct - 25 && score <= seg.pct;
          const isReached = score >= seg.pct;
          return (
            <div key={seg.label} className="flex flex-col items-center gap-0.5">
              <span className={`text-[9px] font-medium transition-opacity ${isReached ? seg.textColor : 'text-[#30363d]'}`}>
                {seg.label}
              </span>
              <div className={`w-1 h-1 rounded-full ${isReached ? seg.color : 'bg-[#30363d]'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 4. Platform Cards
// ============================================================

interface PlatformData {
  name: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  followerCount: (rep: number, posts: number) => number;
  postMultiplier: number;
  engagementMultiplier: number;
}

const PLATFORMS: PlatformData[] = [
  {
    name: 'Instagram',
    color: 'border-l-pink-500',
    textColor: 'text-pink-400',
    bgColor: 'bg-[#161b22]',
    borderColor: 'border-pink-500/20',
    iconBg: 'bg-pink-500/15',
    followerCount: (rep, posts) => Math.max(200, rep * rep * 15 + posts * 52),
    postMultiplier: 1.4,
    engagementMultiplier: 4.2,
  },
  {
    name: 'Twitter',
    color: 'border-l-sky-500',
    textColor: 'text-sky-400',
    bgColor: 'bg-[#161b22]',
    borderColor: 'border-sky-500/20',
    iconBg: 'bg-sky-500/15',
    followerCount: (rep, posts) => Math.max(150, rep * rep * 10 + posts * 38),
    postMultiplier: 2.1,
    engagementMultiplier: 3.0,
  },
  {
    name: 'TikTok',
    color: 'border-l-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-[#161b22]',
    borderColor: 'border-purple-500/20',
    iconBg: 'bg-purple-500/15',
    followerCount: (rep, posts) => Math.max(80, rep * rep * 8 + posts * 25),
    postMultiplier: 0.6,
    engagementMultiplier: 6.8,
  },
];

/** Instagram SVG icon */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Twitter / X SVG icon */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** TikTok SVG icon */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.32 8.32 0 004.76 1.49V7.09a4.85 4.85 0 01-1-.4z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  TikTok: TikTokIcon,
};

function PlatformCard({ platform, reputation, postCount }: { platform: PlatformData; reputation: number; postCount: number }) {
  const followers = platform.followerCount(reputation, postCount);
  const posts = Math.max(1, Math.round(postCount * platform.postMultiplier));
  const engagementRate = Math.min(12, (3 + reputation * 0.15) * (platform.engagementMultiplier / 4.2)).toFixed(1);

  const IconComponent = PLATFORM_ICONS[platform.name];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${platform.bgColor} ${platform.borderColor} ${platform.color} border border-[#21262d] border-l-[3px] rounded-lg p-3 space-y-2.5`}
    >
      {/* Platform header */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${platform.iconBg} flex items-center justify-center ${platform.textColor}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <span className={`text-xs font-semibold ${platform.textColor}`}>{platform.name}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-[#c9d1d9] leading-none">{formatNumber(followers)}</p>
          <p className="text-[8px] text-[#484f58] leading-none">Followers</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-[#c9d1d9] leading-none">{posts}</p>
          <p className="text-[8px] text-[#484f58] leading-none">Posts</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-[#c9d1d9] leading-none">{engagementRate}%</p>
          <p className="text-[8px] text-[#484f58] leading-none">Engage</p>
        </div>
      </div>

      {/* Mini bar */}
      <div className="h-1 bg-[#0d1117] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${platform.textColor.replace('text-', 'bg-')}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, followers / 200)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ opacity: 0.7 }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================
// 5. Trending Topics
// ============================================================

const TRENDING_TOPICS = [
  { tag: '#TransferWindow', heat: 'hot' as const },
  { tag: '#MatchDay', heat: 'hot' as const },
  { tag: '#PlayerOfTheWeek', heat: 'warm' as const },
  { tag: '#GoalOfTheSeason', heat: 'hot' as const },
  { tag: '#FootballLife', heat: 'warm' as const },
  { tag: '#ChampionLeague', heat: 'hot' as const },
  { tag: '#TacticalMasterclass', heat: 'warm' as const },
  { tag: '#DerbyDay', heat: 'normal' as const },
  { tag: '#YouthTalent', heat: 'normal' as const },
  { tag: '#SigningConfirmed', heat: 'warm' as const },
  { tag: '#PremierLeague', heat: 'hot' as const },
  { tag: '#CareerHighlight', heat: 'normal' as const },
];

function getHeatStyle(heat: 'hot' | 'warm' | 'normal') {
  switch (heat) {
    case 'hot':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'warm':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    default:
      return 'bg-[#21262d] text-[#8b949e] border-[#30363d]';
  }
}

function TrendingTopics() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Trending Topics</span>
        <div className="flex-1 h-px bg-[#21262d]" />
      </div>
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {TRENDING_TOPICS.map((topic) => (
          <span
            key={topic.tag}
            className={`inline-flex items-center shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-default hover:opacity-80 transition-opacity ${getHeatStyle(topic.heat)}`}
          >
            {topic.tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Social() {
  const gameState = useGameStore(state => state.gameState);
  const [activeView, setActiveView] = useState<'timeline' | 'analytics'>('timeline');

  const socialFeed = gameState?.socialFeed ?? [];
  const player = gameState?.player;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;
  const reputation = player?.reputation ?? 5;

  const filteredPosts = useMemo(() => socialFeed.slice(0, 15), [socialFeed]);

  if (!gameState) return null;

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
            <h2 className="text-xl font-bold text-[#c9d1d9]">Social Hub</h2>
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
              {socialFeed.length} posts
            </Badge>
          </div>
          <span className={`text-xs font-medium ${avgSentiment >= 10 ? 'text-emerald-400' : avgSentiment >= -10 ? 'text-[#8b949e]' : 'text-red-400'}`}>
            {avgSentiment > 0 ? '+' : ''}{avgSentiment} sentiment
          </span>
        </div>
        <p className="text-xs text-[#8b949e]">
          Your social presence as <span className="text-[#c9d1d9] font-medium">{player?.name || 'Unknown'}</span>
        </p>
      </motion.div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-0.5">
        <button
          onClick={() => setActiveView('timeline')}
          className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-opacity ${
            activeView === 'timeline' ? 'bg-slate-700 text-[#c9d1d9]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-opacity ${
            activeView === 'analytics' ? 'bg-slate-700 text-[#c9d1d9]' : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Analytics
        </button>
      </div>

      {activeView === 'timeline' && (
        <>
          {/* Trending Topics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <TrendingTopics />
          </motion.div>

          {/* Social Feed Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="space-y-0"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Feed Timeline</span>
              <div className="flex-1 h-px bg-[#21262d]" />
            </div>
            {filteredPosts.length === 0 ? (
              <Card className="bg-[#161b22]/50 border-[#30363d]">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-[#8b949e]">
                    No posts yet. Play matches to generate social media reactions!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post, index) => (
                  <TimelinePostCard
                    key={post.id}
                    post={post}
                    index={index}
                    currentWeek={currentWeek}
                    currentSeason={currentSeason}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeView === 'analytics' && (
        <>
          {/* Social Influence Score */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Card className="bg-[#161b22] border border-[#21262d] rounded-lg">
              <CardContent className="p-4">
                <SocialInfluenceMeter reputation={reputation} postCount={socialFeed.length} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Follower Growth Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Card className="bg-[#161b22] border border-[#21262d] rounded-lg">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Follower Growth</span>
                  <span className="text-[10px] text-sky-400 font-medium">
                    {formatNumber(Math.max(100, reputation * reputation * 12 + socialFeed.length * 45))} total
                  </span>
                </div>
                <FollowerGrowthChart reputation={reputation} postCount={socialFeed.length} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Platform Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Platforms</span>
              <div className="flex-1 h-px bg-[#21262d]" />
            </div>
            <div className="space-y-2">
              {PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform.name}
                  platform={platform}
                  reputation={reputation}
                  postCount={socialFeed.length}
                />
              ))}
            </div>
          </motion.div>

          {/* Trending Topics (in analytics too) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <TrendingTopics />
          </motion.div>
        </>
      )}
    </div>
  );
}
