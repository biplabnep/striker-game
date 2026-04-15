'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  MessageCircle, Heart, Share2, Users, TrendingUp, Star,
  Camera, Video, Link2, Send, Bell, Award, DollarSign,
  Eye, ThumbsUp, AtSign, Hash, Bookmark, Clock, Zap,
  ChevronRight, Sparkles, Globe, Shield, BarChart3
} from 'lucide-react';

// ============================================================
// Seeded random helpers — deterministic from season/week
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

// ============================================================
// Formatting helpers
// ============================================================
function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtCurrency(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `€${m.toFixed(1)}M` : `€${m.toFixed(2)}M`;
  }
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}K`;
  return `€${value.toFixed(0)}`;
}

// ============================================================
// Type definitions
// ============================================================
interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  type: 'photo' | 'video' | 'text' | 'link';
  platform: string;
}

interface DMConversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  category: 'fan' | 'brand' | 'player' | 'club';
}

interface DMMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

interface MessageRequest {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  type: 'fan' | 'brand' | 'player';
}

interface PlatformCard {
  name: string;
  followers: number;
  color: string;
  handle: string;
}

interface BrandDeal {
  id: string;
  brand: string;
  logo: string;
  value: number;
  period: string;
  status: 'active' | 'pending';
  category: string;
}

interface BrandOffer {
  id: string;
  brand: string;
  logo: string;
  value: number;
  period: string;
  description: string;
}

interface TrendingTopic {
  tag: string;
  posts: number;
  category: string;
}

// ============================================================
// Data generators (deterministic from seed)
// ============================================================
function generateFeedPosts(seed: number, playerName: string, clubName: string): FeedPost[] {
  const posts: FeedPost[] = [
    {
      id: `post-${seed}-0`,
      author: playerName,
      avatar: playerName[0],
      handle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      content: `Incredible win at the stadium today! The atmosphere was unreal. Proud to wear the shirt for ${clubName}. Let's keep this momentum going! #MatchDay #Blessed`,
      timestamp: '2h ago',
      likes: seededInt(seed + 1, 2000, 25000),
      comments: seededInt(seed + 2, 100, 800),
      shares: seededInt(seed + 3, 50, 500),
      isLiked: false,
      isBookmarked: false,
      type: 'photo',
      platform: 'Instagram',
    },
    {
      id: `post-${seed}-1`,
      author: 'Sky Sports',
      avatar: 'S',
      handle: '@SkySports',
      content: `BREAKING: ${playerName} has been named in the Team of the Week after a stunning performance. What a player! #TOTW #PremierLeague`,
      timestamp: '4h ago',
      likes: seededInt(seed + 4, 5000, 40000),
      comments: seededInt(seed + 5, 300, 2000),
      shares: seededInt(seed + 6, 200, 1500),
      isLiked: true,
      isBookmarked: false,
      type: 'text',
      platform: 'Twitter',
    },
    {
      id: `post-${seed}-2`,
      author: 'ESPN FC',
      avatar: 'E',
      handle: '@ESPNFC',
      content: `Watch ${playerName}'s brilliant solo goal that left the defenders standing. Pure class from the ${clubName} star! Goal of the Season contender?`,
      timestamp: '6h ago',
      likes: seededInt(seed + 7, 10000, 80000),
      comments: seededInt(seed + 8, 500, 3000),
      shares: seededInt(seed + 9, 1000, 5000),
      isLiked: true,
      isBookmarked: true,
      type: 'video',
      platform: 'Twitter',
    },
    {
      id: `post-${seed}-3`,
      author: playerName,
      avatar: playerName[0],
      handle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      content: `New training gear from Nike just dropped. Feeling fresh ahead of tomorrow's big match. Who's ready? #Nike #TrainingDay`,
      timestamp: '8h ago',
      likes: seededInt(seed + 10, 3000, 15000),
      comments: seededInt(seed + 11, 80, 400),
      shares: seededInt(seed + 12, 30, 200),
      isLiked: false,
      isBookmarked: false,
      type: 'photo',
      platform: 'Instagram',
    },
    {
      id: `post-${seed}-4`,
      author: 'Football Daily',
      avatar: 'F',
      handle: '@FootballDaily',
      content: `Rumor: Top European clubs are monitoring ${playerName} closely. The ${clubName} academy product continues to impress scouts across Europe. Transfer scoop coming soon?`,
      timestamp: '12h ago',
      likes: seededInt(seed + 13, 8000, 50000),
      comments: seededInt(seed + 14, 600, 4000),
      shares: seededInt(seed + 15, 500, 3000),
      isLiked: false,
      isBookmarked: true,
      type: 'link',
      platform: 'Twitter',
    },
    {
      id: `post-${seed}-5`,
      author: 'BBC Sport',
      avatar: 'B',
      handle: '@BBCSport',
      content: `We sat down with ${playerName} to discuss their incredible journey from the academy to the first team. A must-read interview about dreams, dedication, and football.`,
      timestamp: '1d ago',
      likes: seededInt(seed + 16, 4000, 30000),
      comments: seededInt(seed + 17, 200, 1500),
      shares: seededInt(seed + 18, 100, 800),
      isLiked: false,
      isBookmarked: false,
      type: 'link',
      platform: 'Twitter',
    },
    {
      id: `post-${seed}-6`,
      author: playerName,
      avatar: playerName[0],
      handle: `@${playerName.toLowerCase().replace(/\s/g, '')}`,
      content: `Gym session done. Recovery is just as important as training. Ice bath, protein shake, and early night. The grind never stops. #AthleteLife #Dedication`,
      timestamp: '1d ago',
      likes: seededInt(seed + 19, 1500, 10000),
      comments: seededInt(seed + 20, 60, 300),
      shares: seededInt(seed + 21, 20, 150),
      isLiked: false,
      isBookmarked: false,
      type: 'photo',
      platform: 'TikTok',
    },
    {
      id: `post-${seed}-7`,
      author: 'The Athletic',
      avatar: 'T',
      handle: '@TheAthletic',
      content: `Analysis: Why ${playerName} could be the breakout star of this season. Tactical breakdown of their role in the ${clubName} system.`,
      timestamp: '2d ago',
      likes: seededInt(seed + 22, 6000, 35000),
      comments: seededInt(seed + 23, 400, 2500),
      shares: seededInt(seed + 24, 300, 2000),
      isLiked: true,
      isBookmarked: false,
      type: 'link',
      platform: 'Twitter',
    },
  ];
  return posts;
}

function generateTrendingTopics(seed: number, playerName: string): TrendingTopic[] {
  return [
    { tag: `#${playerName.split(' ')[1]}Goal`, posts: seededInt(seed + 50, 5000, 20000), category: 'Player' },
    { tag: '#MatchDay', posts: seededInt(seed + 51, 15000, 50000), category: 'General' },
    { tag: '#TransferWindow', posts: seededInt(seed + 52, 8000, 30000), category: 'Transfer' },
    { tag: '#PremierLeague', posts: seededInt(seed + 53, 20000, 80000), category: 'League' },
  ];
}

function generateConversations(seed: number, playerName: string): DMConversation[] {
  return [
    {
      id: `dm-${seed}-0`,
      name: 'Marcus Sterling',
      avatar: 'M',
      lastMessage: 'Great game yesterday mate! We should train together sometime.',
      timestamp: '10m ago',
      unread: 3,
      online: true,
      category: 'player',
    },
    {
      id: `dm-${seed}-1`,
      name: 'Nike Football',
      avatar: 'N',
      lastMessage: `We'd love to discuss a potential partnership. Can we schedule a call?`,
      timestamp: '1h ago',
      unread: 1,
      online: false,
      category: 'brand',
    },
    {
      id: `dm-${seed}-2`,
      name: 'Sarah Mitchell',
      avatar: 'S',
      lastMessage: `You're my favourite player! Will you do a meet and greet soon?`,
      timestamp: '3h ago',
      unread: 0,
      online: false,
      category: 'fan',
    },
    {
      id: `dm-${seed}-3`,
      name: `${playerName.split(' ')[0]}'s Agent`,
      avatar: 'A',
      lastMessage: `I've reviewed the new contract terms. Let's discuss the bonus structure.`,
      timestamp: '5h ago',
      unread: 2,
      online: true,
      category: 'club',
    },
    {
      id: `dm-${seed}-4`,
      name: 'Jamie Rodriguez',
      avatar: 'J',
      lastMessage: 'That volley was insane! How long did you practice that move?',
      timestamp: '1d ago',
      unread: 0,
      online: false,
      category: 'player',
    },
    {
      id: `dm-${seed}-5`,
      name: 'Adidas Football',
      avatar: 'A',
      lastMessage: 'We have an exciting opportunity. When are you available for a meeting?',
      timestamp: '2d ago',
      unread: 0,
      online: false,
      category: 'brand',
    },
  ];
}

function generateConversationMessages(seed: number, playerName: string): DMMessage[] {
  return [
    { id: `msg-${seed}-0`, sender: 'Marcus Sterling', content: `Hey ${playerName.split(' ')[0]}! How's preseason going?`, timestamp: '2:30 PM', isMe: false },
    { id: `msg-${seed}-1`, sender: 'Me', content: `Hey Marcus! Going well, been putting in extra work on finishing. You?`, timestamp: '2:35 PM', isMe: true },
    { id: `msg-${seed}-2`, sender: 'Marcus Sterling', content: 'Same here. The new gaffer has us doing double sessions. Tough but worth it.', timestamp: '2:38 PM', isMe: false },
    { id: `msg-${seed}-3`, sender: 'Me', content: 'I bet! Our fitness coach is pushing us hard too. Looking forward to the season opener.', timestamp: '2:42 PM', isMe: true },
    { id: `msg-${seed}-4`, sender: 'Marcus Sterling', content: 'Great game yesterday mate! We should train together sometime.', timestamp: '3:15 PM', isMe: false },
  ];
}

function generateMessageRequests(seed: number): MessageRequest[] {
  return [
    { id: `req-${seed}-0`, name: 'SuperFan_99', avatar: 'F', preview: `I've followed your career since the academy days!`, type: 'fan' },
    { id: `req-${seed}-1`, name: 'Red Bull Marketing', avatar: 'R', preview: 'Exclusive content partnership opportunity for our new campaign.', type: 'brand' },
    { id: `req-${seed}-2`, name: 'Alex Chen', avatar: 'C', preview: 'Fellow player here! Would love to connect and chat about training.', type: 'player' },
  ];
}

function generatePlatformCards(seed: number, reputation: number): PlatformCard[] {
  const mult = reputation / 50;
  return [
    { name: 'Twitter', followers: Math.round(80000 * mult * seededRange(seed + 100, 0.6, 1.8)), color: '#1DA1F2', handle: `@player_official` },
    { name: 'Instagram', followers: Math.round(150000 * mult * seededRange(seed + 101, 0.7, 1.5)), color: '#E1306C', handle: '@player' },
    { name: 'TikTok', followers: Math.round(300000 * mult * seededRange(seed + 102, 0.5, 2.0)), color: '#00F2EA', handle: '@player_tiktok' },
    { name: 'YouTube', followers: Math.round(40000 * mult * seededRange(seed + 103, 0.4, 1.6)), color: '#FF0000', handle: 'Player Official' },
    { name: 'Facebook', followers: Math.round(60000 * mult * seededRange(seed + 104, 0.5, 1.3)), color: '#1877F2', handle: 'Player Official' },
  ];
}

function generateBrandDeals(seed: number, reputation: number): BrandDeal[] {
  const base = reputation >= 70 ? 3000000 : reputation >= 40 ? 1500000 : 500000;
  return [
    { id: `deal-${seed}-0`, brand: 'Nike', logo: 'N', value: Math.round(base * seededRange(seed + 200, 0.8, 1.5)), period: '2024-2026', status: 'active', category: 'Sportswear' },
    { id: `deal-${seed}-1`, brand: 'Red Bull', logo: 'R', value: Math.round(base * 0.6 * seededRange(seed + 201, 0.7, 1.3)), period: '2024-2025', status: 'active', category: 'Energy Drink' },
    { id: `deal-${seed}-2`, brand: 'Rolex', logo: 'R', value: Math.round(base * 0.4 * seededRange(seed + 202, 0.6, 1.4)), period: '2025-2027', status: 'active', category: 'Luxury' },
    { id: `deal-${seed}-3`, brand: 'EA Sports', logo: 'E', value: Math.round(base * 0.3 * seededRange(seed + 203, 0.8, 1.2)), period: '2024-2025', status: 'active', category: 'Gaming' },
  ];
}

function generateBrandOffers(seed: number, reputation: number): BrandOffer[] {
  const base = reputation >= 70 ? 4000000 : reputation >= 40 ? 2000000 : 800000;
  return [
    { id: `offer-${seed}-0`, brand: 'Adidas', logo: 'A', value: Math.round(base * seededRange(seed + 300, 0.9, 1.4)), period: '2025-2027', description: 'Exclusive boot sponsorship deal with content creation requirements.' },
    { id: `offer-${seed}-1`, brand: 'Pepsi', logo: 'P', value: Math.round(base * 0.5 * seededRange(seed + 301, 0.7, 1.3)), period: '2025-2026', description: 'Social media campaign and TV commercial appearance.' },
  ];
}

// ============================================================
// Mini SVG Component: Engagement Rate Ring
// ============================================================
function EngagementRateRing({ rate, size = 100 }: { rate: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const center = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }} xmlns="http://www.w3.org/2000/svg">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - 4} textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
        {rate}%
      </text>
      <text x={center} y={center + 10} textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="sans-serif">
        Engagement
      </text>
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Post Activity Area Chart (7 days)
// ============================================================
function PostActivityChart({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const width = 280;
  const height = 120;
  const padX = 30;
  const padY = 10;
  const chartW = width - padX - 10;
  const chartH = height - padY * 2 - 10;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const areaPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={padY + chartH} x2={width - 10} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{maxVal}</text>
      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0</text>
      <path d={areaPath} fill="#10b981" fillOpacity="0.15" />
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#10b981" strokeWidth="2" />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return <text key={i} x={x} y={height - 2} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{label}</text>;
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Content Type Donut (4 segments)
// ============================================================
function ContentTypeDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const size = 100;
  const center = size / 2;
  const radius = 35;
  const strokeWidth = 14;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; arcLength: number; offset: number; circumference: number }>>((result, seg) => {
    const pct = seg.value / total;
    const circumference = 2 * Math.PI * radius;
    const gap = 3;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + r.value / total, 0);
    const offset = circumference * cumulative - circumference * 0.25;
    return [...result, { ...seg, arcLength, offset, circumference }];
  }, []);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }} xmlns="http://www.w3.org/2000/svg">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.arcLength} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text x={center} y={center} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="sans-serif">
        Content
      </text>
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Follower Growth Line Chart (4 weeks)
// ============================================================
function FollowerGrowthChart({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const width = 280;
  const height = 100;
  const padX = 35;
  const padY = 10;
  const chartW = width - padX - 10;
  const chartH = height - padY * 2 - 12;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={padY + chartH} x2={width - 10} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{fmtNumber(maxVal)}</text>
      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0</text>
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#3b82f6" strokeWidth="2" />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return <text key={i} x={x} y={height - 2} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{label}</text>;
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Message Volume Bars (6 days)
// ============================================================
function MessageVolumeBars({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const width = 280;
  const height = 100;
  const barW = 28;
  const padX = 30;
  const chartH = height - 30;
  const gap = (width - padX - 10 - data.length * barW) / (data.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={10} x2={padX} y2={chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={chartH} x2={width - 10} y2={chartH} stroke="#21262d" strokeWidth="0.5" />
      {data.map((v, i) => {
        const barH = (v / maxVal) * (chartH - 20);
        const x = padX + i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="#8b5cf6" rx="3" />
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{labels[i]}</text>
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontFamily="sans-serif">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Response Time Gauge (semi-circular)
// ============================================================
function ResponseTimeGauge({ minutes }: { minutes: number }) {
  const width = 160;
  const height = 90;
  const cx = width / 2;
  const cy = height - 15;
  const radius = 55;
  const strokeWidth = 10;

  const maxMinutes = 120;
  const pct = Math.min(minutes / maxMinutes, 1);
  const circumference = Math.PI * radius;
  const filled = circumference * pct;

  const color = minutes < 15 ? '#10b981' : minutes < 30 ? '#f59e0b' : '#ef4444';
  const label = minutes < 15 ? 'Fast' : minutes < 30 ? 'Average' : 'Slow';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
        {minutes}m
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="9" fontWeight="bold" fontFamily="sans-serif">
        {label}
      </text>
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Conversation Categories Donut (4 segments)
// ============================================================
function ConversationCategoriesDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const size = 100;
  const center = size / 2;
  const radius = 35;
  const strokeWidth = 14;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; arcLength: number; offset: number; circumference: number }>>((result, seg) => {
    const pct = seg.value / total;
    const circumference = 2 * Math.PI * radius;
    const gap = 3;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + r.value / total, 0);
    const offset = circumference * cumulative - circumference * 0.25;
    return [...result, { ...seg, arcLength, offset, circumference }];
  }, []);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }} xmlns="http://www.w3.org/2000/svg">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.arcLength} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text x={center} y={center} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="sans-serif">
        DMs
      </text>
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Unread Messages Timeline (7 days)
// ============================================================
function UnreadTimeline({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const width = 280;
  const height = 80;
  const dotR = 8;
  const padX = 20;
  const padY = 25;
  const chartW = width - padX * 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#21262d" strokeWidth="1" />
      {data.map((v, i) => {
        const x = padX + (i / (data.length - 1)) * chartW;
        const intensity = v / maxVal;
        const fillColor = intensity > 0.7 ? '#ef4444' : intensity > 0.3 ? '#f59e0b' : '#30363d';
        const r = dotR * (0.4 + intensity * 0.6);
        return (
          <g key={i}>
            <circle cx={x} cy={padY} r={r} fill={fillColor} fillOpacity={0.3 + intensity * 0.5} />
            <circle cx={x} cy={padY} r={3} fill={v > 0 ? fillColor : '#21262d'} />
            <text x={x} y={padY + 20} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{labels[i]}</text>
            {v > 0 && <text x={x} y={padY - r - 4} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontFamily="sans-serif">{v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Platform Distribution Donut (5 segments)
// ============================================================
function PlatformDistributionDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const size = 100;
  const center = size / 2;
  const radius = 35;
  const strokeWidth = 14;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; arcLength: number; offset: number; circumference: number }>>((result, seg) => {
    const pct = seg.value / total;
    const circumference = 2 * Math.PI * radius;
    const gap = 2;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + r.value / total, 0);
    const offset = circumference * cumulative - circumference * 0.25;
    return [...result, { ...seg, arcLength, offset, circumference }];
  }, []);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }} xmlns="http://www.w3.org/2000/svg">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.arcLength} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text x={center} y={center} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="sans-serif">
        Platforms
      </text>
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Reach vs Engagement Scatter
// ============================================================
function ReachEngagementScatter({ points }: { points: { x: number; y: number; label: string; color: string }[] }) {
  const width = 280;
  const height = 120;
  const padX = 35;
  const padY = 15;
  const chartW = width - padX - 15;
  const chartH = height - padY * 2 - 15;
  const maxX = Math.max(...points.map(p => p.x), 1);
  const maxY = Math.max(...points.map(p => p.y), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{maxY}%</text>
      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0%</text>
      <text x={padX + chartW} y={padY + chartH + 10} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{fmtNumber(maxX)}</text>
      {points.map((p, i) => {
        const px = padX + (p.x / maxX) * chartW;
        const py = padY + chartH - (p.y / maxY) * chartH;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="5" fill={p.color} fillOpacity="0.3" stroke={p.color} strokeWidth="1.5" />
            <text x={px + 8} y={py + 3} fill="#c9d1d9" fontSize="6" fontFamily="sans-serif">{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Content Performance Bars (5 bars)
// ============================================================
function ContentPerformanceBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 280;
  const height = 130;
  const padX = 55;
  const barH = 14;
  const gap = 10;
  const chartW = width - padX - 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      {data.map((d, i) => {
        const y = 10 + i * (barH + gap);
        const barWidth = (d.value / maxVal) * chartW;
        return (
          <g key={i}>
            <text x={padX - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="sans-serif">{d.label}</text>
            <rect x={padX} y={y} width={chartW} height={barH} fill="#21262d" rx="3" />
            <rect x={padX} y={y} width={barWidth} height={barH} fill={d.color} rx="3" />
            <text x={padX + barWidth + 4} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="8" fontFamily="sans-serif">{d.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Influence Trend Area Chart (6 months)
// ============================================================
function InfluenceTrendChart({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = 100;
  const width = 280;
  const height = 110;
  const padX = 30;
  const padY = 10;
  const chartW = width - padX - 10;
  const chartH = height - padY * 2 - 12;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const areaPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={padY + chartH} x2={width - 10} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">100</text>
      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0</text>
      <path d={areaPath} fill="#f59e0b" fillOpacity="0.12" />
      <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#f59e0b" strokeWidth="2" />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return <text key={i} x={x} y={height - 2} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{label}</text>;
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Sponsorship Revenue Bars
// ============================================================
function SponsorshipRevenueBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 280;
  const height = 120;
  const padX = 10;
  const barH = 18;
  const gap = 10;
  const chartW = width - padX * 2 - 60;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      {data.map((d, i) => {
        const y = 5 + i * (barH + gap);
        const barWidth = (d.value / maxVal) * chartW;
        return (
          <g key={i}>
            <text x={padX} y={y + barH / 2 + 3} fill="#8b949e" fontSize="8" fontFamily="sans-serif">{d.label}</text>
            <rect x={60} y={y} width={chartW} height={barH} fill="#21262d" rx="3" />
            <rect x={60} y={y} width={barWidth} height={barH} fill={d.color} rx="3" />
            <text x={60 + barWidth + 4} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="8" fontWeight="bold" fontFamily="sans-serif">{fmtCurrency(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Brand Fit Radar (5 axes hexagonal)
// ============================================================
function BrandFitRadar({ axes }: { axes: { label: string; value: number }[] }) {
  const size = 140;
  const center = size / 2;
  const maxR = 50;
  const count = axes.length;

  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  // Background hexagons at 25%, 50%, 75%, 100%
  const bgLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = axes.map((ax, i) => getPoint(i, (ax.value / 100) * maxR));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }} xmlns="http://www.w3.org/2000/svg">
      {bgLevels.map((level, li) => {
        const pts = Array.from({ length: count }, (_, i) => getPoint(i, maxR * level));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={li} d={path} fill="none" stroke="#21262d" strokeWidth="0.5" />;
      })}
      {axes.map((_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth="0.5" />;
      })}
      <path d={dataPath} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
      ))}
      {axes.map((ax, i) => {
        const labelP = getPoint(i, maxR + 12);
        return <text key={i} x={labelP.x} y={labelP.y} textAnchor="middle" fill="#8b949e" fontSize="6" fontFamily="sans-serif">{ax.label}</text>;
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Earnings Trend Line Chart (6 months)
// ============================================================
function EarningsTrendChart({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const width = 280;
  const height = 110;
  const padX = 35;
  const padY = 10;
  const chartW = width - padX - 10;
  const chartH = height - padY * 2 - 12;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <line x1={padX} y1={padY + chartH} x2={width - 10} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{fmtCurrency(maxVal)}</text>
      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">€0</text>
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#10b981" strokeWidth="2" />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return <text key={i} x={x} y={height - 2} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">{label}</text>;
      })}
    </svg>
  );
}

// ============================================================
// Mini SVG Component: Contract Timeline
// ============================================================
function ContractTimeline({ deals }: { deals: { brand: string; start: string; end: string; color: string; active: boolean }[] }) {
  const width = 280;
  const height = 80;
  const padX = 10;
  const padY = 30;
  const chartW = width - padX * 2;
  const rowH = 16;
  const gap = 6;

  // Normalize time positions
  const allMonths = deals.flatMap(d => {
    const parseM = (s: string) => { const parts = s.split('-'); return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10); };
    return [parseM(d.start), parseM(d.end)];
  });
  const minM = Math.min(...allMonths);
  const maxM = Math.max(...allMonths);
  const rangeM = maxM - minM || 1;

  const parseM = (s: string) => { const parts = s.split('-'); return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10); };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padY} x2={padX + chartW} y2={padY} stroke="#21262d" strokeWidth="1" />
      <text x={padX} y={padY - 5} fill="#484f58" fontSize="7" fontFamily="sans-serif">Timeline</text>
      {deals.map((d, i) => {
        const startM = parseM(d.start);
        const endM = parseM(d.end);
        const x1 = padX + ((startM - minM) / rangeM) * chartW;
        const x2 = padX + ((endM - minM) / rangeM) * chartW;
        const y = padY + 5 + i * (rowH + gap);
        const barW = Math.max(x2 - x1, 4);
        return (
          <g key={i}>
            <text x={padX} y={y + rowH - 2} fill="#8b949e" fontSize="7" fontFamily="sans-serif">{d.brand}</text>
            <rect x={x1} y={y} width={barW} height={rowH - 2} fill={d.active ? d.color : '#30363d'} rx="3" fillOpacity={d.active ? 0.7 : 0.4} />
            <text x={x2 + 4} y={y + rowH - 2} fill="#484f58" fontSize="6" fontFamily="sans-serif">{d.end}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG Path Helpers for Data Visualizations
// ============================================================
function buildHexPoints(cx: number, cy: number, radius: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
}

function buildRadarDataPoints(cx: number, cy: number, maxRadius: number, sides: number, values: number[]): string {
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const r = (v / 100) * maxRadius;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

function buildSemiArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function buildAreaPath(points: { x: number; y: number }[], baseY: number): string {
  const linePart = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return `${linePart} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
}

// ============================================================
// Inline SVG Donut Helpers (rendered inside parent <svg>)
// ============================================================
interface DonutSegment { label: string; value: number; color: string }

function ContentMixDonutInline({ segments }: { segments: DonutSegment[] }) {
  const cx = 90;
  const cy = 65;
  const radius = 38;
  const strokeWidth = 12;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<Array<{ color: string; arcLength: number; offset: number; circumference: number }>>((result, seg) => {
    const circumference = 2 * Math.PI * radius;
    const pct = seg.value / total;
    const gap = 3;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + r.arcLength / circumference, 0);
    const offset = circumference * (cumulative + pct / 2) - circumference * 0.25;
    return [...result, { color: seg.color, arcLength, offset, circumference }];
  }, []);

  return (
    <>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${Math.max(arc.arcLength, 0)} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="sans-serif">Mix</text>
    </>
  );
}

function AudienceDemographicsDonutInline({ segments }: { segments: DonutSegment[] }) {
  const cx = 90;
  const cy = 60;
  const radius = 35;
  const strokeWidth = 12;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<Array<{ color: string; arcLength: number; offset: number; circumference: number }>>((result, seg) => {
    const circumference = 2 * Math.PI * radius;
    const pct = seg.value / total;
    const gap = 2;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + r.arcLength / circumference, 0);
    const offset = circumference * (cumulative + pct / 2) - circumference * 0.25;
    return [...result, { color: seg.color, arcLength, offset, circumference }];
  }, []);

  return (
    <>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${Math.max(arc.arcLength, 0)} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="7" fontFamily="sans-serif">Fans</text>
    </>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function SocialMediaHub(): React.JSX.Element {
  const gameState = useGameStore(state => state.gameState);
  const player = gameState?.player ?? {} as import('@/lib/game/types').Player;
  const club = gameState?.currentClub ?? {} as import('@/lib/game/types').Club;

  const [activeTab, setActiveTab] = useState(0);
  const [feedFilter, setFeedFilter] = useState(0);
  const [composerText, setComposerText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [acceptedOffers, setAcceptedOffers] = useState<Set<string>>(new Set());
  const [declinedOffers, setDeclinedOffers] = useState<Set<string>>(new Set());

  // Deterministic seed
  const baseSeed = useMemo(() => {
    const name = player?.name ?? 'Unknown';
    return name.length * 137 + (gameState?.currentSeason ?? 1) * 31 + (gameState?.currentWeek ?? 1) * 7;
  }, [player?.name, gameState?.currentSeason, gameState?.currentWeek]);

  const playerName = useMemo(() => player?.name ?? 'Your Player', [player?.name]);
  const clubName = useMemo(() => club?.name ?? 'FC', [club?.name]);
  const reputation = useMemo(() => player?.reputation ?? 10, [player?.reputation]);

  // ============================================================
  // Tab 1: Feed & Posts data
  // ============================================================
  const feedPosts = useMemo(
    () => generateFeedPosts(baseSeed, playerName, clubName),
    [baseSeed, playerName, clubName]
  );

  const trendingTopics = useMemo(
    () => generateTrendingTopics(baseSeed, playerName),
    [baseSeed, playerName]
  );

  const engagementRate = useMemo(
    () => seededInt(baseSeed + 60, 30, 85),
    [baseSeed]
  );

  const postActivityData = useMemo(
    () => Array.from({ length: 7 }, (_, i) => seededInt(baseSeed + 70 + i, 1, 12)),
    [baseSeed]
  );

  const postActivityLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const contentTypes = useMemo(
    () => [
      { label: 'Photos', value: seededInt(baseSeed + 80, 25, 45), color: '#10b981' },
      { label: 'Videos', value: seededInt(baseSeed + 81, 15, 30), color: '#3b82f6' },
      { label: 'Text', value: seededInt(baseSeed + 82, 10, 25), color: '#f59e0b' },
      { label: 'Links', value: seededInt(baseSeed + 83, 5, 20), color: '#8b5cf6' },
    ],
    [baseSeed]
  );

  const followerGrowthData = useMemo(
    () => Array.from({ length: 4 }, (_, i) => seededInt(baseSeed + 90 + i, 500, 5000)),
    [baseSeed]
  );
  const followerGrowthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  // ============================================================
  // Tab 2: Messages & DMs data
  // ============================================================
  const conversations = useMemo(
    () => generateConversations(baseSeed, playerName),
    [baseSeed, playerName]
  );

  const conversationMessages = useMemo(
    () => generateConversationMessages(baseSeed, playerName),
    [baseSeed, playerName]
  );

  const messageRequests = useMemo(
    () => generateMessageRequests(baseSeed),
    [baseSeed]
  );

  const messageVolumeData = useMemo(
    () => Array.from({ length: 6 }, (_, i) => seededInt(baseSeed + 110 + i, 3, 25)),
    [baseSeed]
  );
  const messageVolumeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const avgResponseTime = useMemo(
    () => seededInt(baseSeed + 120, 8, 75),
    [baseSeed]
  );

  const convCategories = useMemo(
    () => [
      { label: 'Fans', value: seededInt(baseSeed + 130, 20, 50), color: '#3b82f6' },
      { label: 'Brands', value: seededInt(baseSeed + 131, 5, 20), color: '#10b981' },
      { label: 'Players', value: seededInt(baseSeed + 132, 8, 25), color: '#f59e0b' },
      { label: 'Club', value: seededInt(baseSeed + 133, 3, 15), color: '#8b5cf6' },
    ],
    [baseSeed]
  );

  const unreadTimelineData = useMemo(
    () => Array.from({ length: 7 }, (_, i) => seededInt(baseSeed + 140 + i, 0, 12)),
    [baseSeed]
  );
  const unreadTimelineLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ============================================================
  // Tab 3: Analytics & Influence data
  // ============================================================
  const influenceScore = useMemo(
    () => Math.min(100, Math.round(reputation * 0.7 + seededInt(baseSeed + 200, 10, 30))),
    [baseSeed, reputation]
  );

  const platforms = useMemo(
    () => generatePlatformCards(baseSeed, reputation),
    [baseSeed, reputation]
  );

  const weeklyReach = useMemo(
    () => seededInt(baseSeed + 210, 50000, 2000000),
    [baseSeed]
  );
  const weeklyImpressions = useMemo(
    () => seededInt(baseSeed + 211, 200000, 8000000),
    [baseSeed]
  );
  const weeklyEngagements = useMemo(
    () => seededInt(baseSeed + 212, 5000, 200000),
    [baseSeed]
  );

  const topLikedPosts = useMemo(
    () => [...feedPosts].sort((a, b) => b.likes - a.likes).slice(0, 5),
    [feedPosts]
  );

  const platformDonutSegments = useMemo(
    () => platforms.map(p => ({ label: p.name, value: p.followers, color: p.color })),
    [platforms]
  );

  const scatterPoints = useMemo(
    () => platforms.map(p => ({
      x: p.followers,
      y: seededRange(baseSeed + 220 + platforms.indexOf(p), 1.5, 8.0),
      label: p.name,
      color: p.color,
    })),
    [baseSeed, platforms]
  );

  const contentPerformance = useMemo(
    () => [
      { label: 'Photos', value: seededInt(baseSeed + 230, 40, 90), color: '#10b981' },
      { label: 'Videos', value: seededInt(baseSeed + 231, 35, 85), color: '#3b82f6' },
      { label: 'Stories', value: seededInt(baseSeed + 232, 50, 95), color: '#f59e0b' },
      { label: 'Reels', value: seededInt(baseSeed + 233, 30, 80), color: '#ef4444' },
      { label: 'Text', value: seededInt(baseSeed + 234, 20, 60), color: '#8b5cf6' },
    ],
    [baseSeed]
  );

  const influenceTrendData = useMemo(
    () => Array.from({ length: 6 }, (_, i) => Math.min(100, Math.max(10, influenceScore - 25 + seededInt(baseSeed + 240 + i, 5, 55)))),
    [baseSeed, influenceScore]
  );
  const influenceTrendLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // ============================================================
  // Tab 4: Brand Deals data
  // ============================================================
  const brandDeals = useMemo(
    () => generateBrandDeals(baseSeed, reputation),
    [baseSeed, reputation]
  );

  const brandOffers = useMemo(
    () => generateBrandOffers(baseSeed, reputation),
    [baseSeed, reputation]
  );

  const totalEarnings = useMemo(
    () => brandDeals.reduce((sum, d) => sum + d.value, 0),
    [brandDeals]
  );

  const brandCompatibility = useMemo(
    () => Math.min(100, Math.round(reputation * 0.5 + seededInt(baseSeed + 300, 20, 50))),
    [baseSeed, reputation]
  );

  const sponsorshipRevenueData = useMemo(
    () => brandDeals.map(d => ({ label: d.brand, value: d.value, color: d.category === 'Sportswear' ? '#f97316' : d.category === 'Energy Drink' ? '#ef4444' : d.category === 'Luxury' ? '#a8a29e' : '#3b82f6' })),
    [brandDeals]
  );

  const brandFitAxes = useMemo(
    () => [
      { label: 'Values', value: seededInt(baseSeed + 310, 50, 95) },
      { label: 'Audience', value: seededInt(baseSeed + 311, 40, 90) },
      { label: 'Quality', value: seededInt(baseSeed + 312, 55, 98) },
      { label: 'Timing', value: seededInt(baseSeed + 313, 35, 85) },
      { label: 'Exclusivity', value: seededInt(baseSeed + 314, 30, 80) },
    ],
    [baseSeed]
  );

  const earningsTrendData = useMemo(
    () => Array.from({ length: 6 }, (_, i) => Math.round(totalEarnings / 6 * seededRange(baseSeed + 320 + i, 0.3, 1.5))),
    [baseSeed, totalEarnings]
  );
  const earningsTrendLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const contractTimelineDeals = useMemo(
    () => brandDeals.map(d => ({
      brand: d.brand,
      start: d.period.split('-')[0] + '-01',
      end: d.period.split('-')[1] + '-12',
      color: d.category === 'Sportswear' ? '#f97316' : d.category === 'Energy Drink' ? '#ef4444' : d.category === 'Luxury' ? '#a8a29e' : '#3b82f6',
      active: true,
    })),
    [brandDeals]
  );

  // ============================================================
  // Data for 11 New SVG Visualizations
  // ============================================================

  // 1. EngagementRadar — 5 axes (Likes/Comments/Shares/Saves/Views)
  const engagementRadarValues = useMemo(
    () => [
      seededInt(baseSeed + 400, 40, 95),
      seededInt(baseSeed + 401, 30, 85),
      seededInt(baseSeed + 402, 20, 75),
      seededInt(baseSeed + 403, 25, 80),
      seededInt(baseSeed + 404, 50, 98),
    ],
    [baseSeed]
  );

  // 2. PlatformReachBars — 5 bars (Instagram/Twitter/TikTok/YouTube/Twitch followers)
  const platformReachData = useMemo(
    () => [
      { label: 'Instagram', value: Math.round(150000 * (reputation / 50) * seededRange(baseSeed + 410, 0.7, 1.5)) },
      { label: 'Twitter', value: Math.round(80000 * (reputation / 50) * seededRange(baseSeed + 411, 0.6, 1.8)) },
      { label: 'TikTok', value: Math.round(300000 * (reputation / 50) * seededRange(baseSeed + 412, 0.5, 2.0)) },
      { label: 'YouTube', value: Math.round(40000 * (reputation / 50) * seededRange(baseSeed + 413, 0.4, 1.6)) },
      { label: 'Twitch', value: Math.round(25000 * (reputation / 50) * seededRange(baseSeed + 414, 0.3, 1.4)) },
    ],
    [baseSeed, reputation]
  );

  // 3. ContentMixDonut — 4 segments (Photos/Videos/Text/Stories)
  const contentMixSegments = useMemo(
    () => {
      const raw = [
        { label: 'Photos', value: seededInt(baseSeed + 420, 20, 50) },
        { label: 'Videos', value: seededInt(baseSeed + 421, 15, 35) },
        { label: 'Text', value: seededInt(baseSeed + 422, 10, 25) },
        { label: 'Stories', value: seededInt(baseSeed + 423, 8, 30) },
      ];
      const colors = ['#CCFF00', '#FF5500', '#00E5FF', '#CCFF00'];
      return raw.reduce<Array<{ label: string; value: number; color: string }>>((acc, item, idx) => {
        acc.push({ label: item.label, value: item.value, color: colors[idx] });
        return acc;
      }, []);
    },
    [baseSeed]
  );

  // 4. AudienceDemographicsDonut — 5 segments (Local/National/International/Youth/Adult)
  const audienceDemographicsSegments = useMemo(
    () => {
      const raw = [
        { label: 'Local', value: seededInt(baseSeed + 430, 15, 35) },
        { label: 'National', value: seededInt(baseSeed + 431, 20, 40) },
        { label: 'International', value: seededInt(baseSeed + 432, 10, 30) },
        { label: 'Youth', value: seededInt(baseSeed + 433, 25, 50) },
        { label: 'Adult', value: seededInt(baseSeed + 434, 20, 45) },
      ];
      const colors = ['#FF5500', '#CCFF00', '#00E5FF', '#FF5500', '#CCFF00'];
      return raw.reduce<Array<{ label: string; value: number; color: string }>>((acc, item, idx) => {
        acc.push({ label: item.label, value: item.value, color: colors[idx] });
        return acc;
      }, []);
    },
    [baseSeed]
  );

  // 5. InfluenceScoreGauge — 0-100
  const influenceScoreGauge = useMemo(
    () => Math.min(100, Math.round(reputation * 0.65 + seededInt(baseSeed + 440, 10, 35))),
    [baseSeed, reputation]
  );

  // 6. BrandValueGauge — 0-100
  const brandValueGauge = useMemo(
    () => Math.min(100, Math.round(reputation * 0.5 + seededInt(baseSeed + 441, 15, 40))),
    [baseSeed, reputation]
  );

  // 7. FollowerGrowthLine — 8-week follower growth
  const followerGrowth8Week = useMemo(
    () => Array.from({ length: 8 }, (_, i) => seededInt(baseSeed + 450 + i, 1000, 25000)),
    [baseSeed]
  );

  // 8. EngagementRateLine — 8-week engagement rate
  const engagementRate8Week = useMemo(
    () => Array.from({ length: 8 }, (_, i) => seededRange(baseSeed + 460 + i, 2.0, 12.0)),
    [baseSeed]
  );

  // 9. PostPerformanceArea — 8-post performance
  const postPerformance8 = useMemo(
    () => Array.from({ length: 8 }, (_, i) => seededInt(baseSeed + 470 + i, 500, 15000)),
    [baseSeed]
  );

  // 10. ViralMomentTimeline — 8 viral moments
  const viralMoments = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      label: `W${i + 1}`,
      intensity: seededInt(baseSeed + 480 + i, 10, 100),
      caption: ['Goal', 'Assist', 'Red Card', 'Transfer Rumor', 'Interview', 'Hat-trick', 'Injury', 'Comeback'][i],
    })),
    [baseSeed]
  );

  // 11. SponsorAppealRing — 0-100
  const sponsorAppealScore = useMemo(
    () => Math.min(100, Math.round(reputation * 0.6 + seededInt(baseSeed + 490, 15, 40))),
    [baseSeed, reputation]
  );

  // ============================================================
  // Handlers
  // ============================================================
  const toggleLike = useCallback((postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const handlePost = useCallback(() => {
    if (composerText.trim()) {
      setComposerText('');
    }
  }, [composerText]);

  const handleAcceptOffer = useCallback((offerId: string) => {
    setAcceptedOffers(prev => new Set(prev).add(offerId));
  }, []);

  const handleDeclineOffer = useCallback((offerId: string) => {
    setDeclinedOffers(prev => new Set(prev).add(offerId));
  }, []);

  // Filter labels
  const filterLabels = ['All', 'Trending', 'My Posts', 'Mentions'];

  // Tab configuration
  const tabs = [
    { label: 'Feed', icon: MessageCircle },
    { label: 'Messages', icon: Send },
    { label: 'Analytics', icon: TrendingUp },
    { label: 'Deals', icon: DollarSign },
  ];

  // Early return if no game state
  if (!gameState || !player || !club) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <p className="text-sm text-[#8b949e]">Start a career to access Social Media Hub.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* =========================================
          HEADER
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center">
            <Globe className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Social Media Hub</h1>
            <p className="text-[10px] text-[#8b949e]">Season {gameState.currentSeason} · Week {gameState.currentWeek}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center relative">
            <Bell className="h-3.5 w-3.5 text-[#8b949e]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-lg bg-red-500 border border-[#0d1117] flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">3</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* =========================================
          TAB BAR
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-[#21262d]"
      >
        {tabs.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 px-2 text-[10px] font-medium rounded-lg flex items-center justify-center gap-1 transition-colors ${
                activeTab === i
                  ? 'bg-[#21262d] text-emerald-400'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* =========================================
          TAB CONTENT
          ========================================= */}
      <AnimatePresence mode="wait">
        {/* =========================================
            TAB 0: Feed & Posts
            ========================================= */}
        {activeTab === 0 && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Post Composer */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-emerald-400">{playerName[0]}</span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Share something with your fans..."
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 text-xs text-[#c9d1d9] placeholder-[#484f58] resize-none focus:outline-none focus:border-emerald-800/50 transition-colors"
                    rows={2}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"><Camera className="h-3.5 w-3.5 text-[#8b949e]" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"><Video className="h-3.5 w-3.5 text-[#8b949e]" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"><Link2 className="h-3.5 w-3.5 text-[#8b949e]" /></button>
                    </div>
                    <button
                      onClick={handlePost}
                      disabled={!composerText.trim()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-emerald-500"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1">
              {filterLabels.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setFeedFilter(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                    feedFilter === i
                      ? 'bg-[#21262d] border-[#30363d] text-emerald-400'
                      : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Trending Topics */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Trending Now</h3>
              </div>
              <div className="space-y-1.5">
                {trendingTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[#21262d] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#484f58] w-4">{i + 1}</span>
                      <span className="text-xs text-emerald-400 font-medium">{topic.tag}</span>
                      <span className="text-[9px] text-[#484f58]">· {topic.category}</span>
                    </div>
                    <span className="text-[9px] text-[#8b949e]">{fmtNumber(topic.posts)} posts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Rate Ring */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Engagement Rate</h3>
              <div className="flex items-center gap-4">
                <EngagementRateRing rate={engagementRate} />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8b949e]">Likes</span>
                    <span className="text-[10px] text-[#c9d1d9] font-bold">{fmtNumber(feedPosts.reduce((s, p) => s + p.likes, 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8b949e]">Comments</span>
                    <span className="text-[10px] text-[#c9d1d9] font-bold">{fmtNumber(feedPosts.reduce((s, p) => s + p.comments, 0))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8b949e]">Shares</span>
                    <span className="text-[10px] text-[#c9d1d9] font-bold">{fmtNumber(feedPosts.reduce((s, p) => s + p.shares, 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Posts */}
            <AnimatePresence>
              {feedPosts.map((post, index) => {
                const isLiked = likedPosts.has(post.id) || post.isLiked;
                const isBookmarked = bookmarkedPosts.has(post.id) || post.isBookmarked;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#8b949e]">{post.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#c9d1d9] truncate">{post.author}</span>
                          <span className="text-[9px] text-[#484f58] truncate">{post.handle}</span>
                        </div>
                        <span className="text-[9px] text-[#484f58]">{post.timestamp} · {post.platform}</span>
                      </div>
                      {post.type === 'video' && <Video className="h-3 w-3 text-red-400 flex-shrink-0" />}
                      {post.type === 'photo' && <Camera className="h-3 w-3 text-sky-400 flex-shrink-0" />}
                      {post.type === 'link' && <Link2 className="h-3 w-3 text-blue-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[#c9d1d9] leading-relaxed mb-2.5">{post.content}</p>
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 group transition-colors">
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? 'text-red-400 fill-red-400' : 'text-[#8b949e] group-hover:text-red-400'}`} />
                        <span className={`text-[10px] ${isLiked ? 'text-red-400' : 'text-[#8b949e]'}`}>{fmtNumber(isLiked ? post.likes + 1 : post.likes)}</span>
                      </button>
                      <button className="flex items-center gap-1 group transition-colors">
                        <MessageCircle className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-sky-400" />
                        <span className="text-[10px] text-[#8b949e]">{fmtNumber(post.comments)}</span>
                      </button>
                      <button className="flex items-center gap-1 group transition-colors">
                        <Share2 className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-emerald-400" />
                        <span className="text-[10px] text-[#8b949e]">{fmtNumber(post.shares)}</span>
                      </button>
                      <button onClick={() => toggleBookmark(post.id)} className="ml-auto transition-colors">
                        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-[#8b949e] hover:text-amber-400'}`} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Post Activity Area Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Post Activity (7 Days)</h3>
              </div>
              <PostActivityChart data={postActivityData} labels={postActivityLabels} />
            </div>

            {/* Content Type Donut */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Content Mix</h3>
              <div className="flex items-center gap-4">
                <ContentTypeDonut segments={contentTypes} />
                <div className="space-y-1.5 flex-1">
                  {contentTypes.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] text-[#8b949e] flex-1">{seg.label}</span>
                      <span className="text-[10px] text-[#c9d1d9] font-medium">{seg.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Follower Growth Line Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  <h3 className="text-xs font-bold text-[#c9d1d9]">Follower Growth</h3>
                </div>
                <span className="text-[9px] text-emerald-400 font-medium">+{fmtNumber(followerGrowthData[followerGrowthData.length - 1] - followerGrowthData[0])} this month</span>
              </div>
              <FollowerGrowthChart data={followerGrowthData} labels={followerGrowthLabels} />
            </div>
          </motion.div>
        )}

        {/* =========================================
            TAB 1: Messages & DMs
            ========================================= */}
        {activeTab === 1 && (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {selectedConversation ? (
              /* Message Detail View */
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ChevronRight className="h-3 w-3 rotate-180" />
                  Back to conversations
                </button>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#21262d]">
                    <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                      <span className="text-sm font-bold text-[#8b949e]">{conversations.find(c => c.id === selectedConversation)?.avatar ?? 'U'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-[#c9d1d9]">{conversations.find(c => c.id === selectedConversation)?.name ?? 'Unknown'}</h3>
                      <span className="text-[9px] text-emerald-400">Online</span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {conversationMessages.map((msg, i) => (
                      <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          msg.isMe
                            ? 'bg-emerald-900/30 border border-emerald-800/30'
                            : 'bg-[#21262d] border border-[#30363d]'
                        }`}>
                          {!msg.isMe && <p className="text-[8px] text-[#8b949e] mb-0.5">{msg.sender}</p>}
                          <p className="text-[11px] text-[#c9d1d9]">{msg.content}</p>
                          <p className="text-[8px] text-[#484f58] mt-0.5">{msg.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-800/50"
                    />
                    <button className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center hover:bg-emerald-500 transition-colors">
                      <Send className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Conversation List */
              <>
                {/* Message Requests */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-amber-400" />
                      <h3 className="text-xs font-bold text-[#c9d1d9]">Message Requests</h3>
                    </div>
                    <span className="text-[9px] text-amber-400 font-medium">{messageRequests.length} pending</span>
                  </div>
                  <div className="space-y-2">
                    {messageRequests.map((req, i) => (
                      <div key={req.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
                        <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#8b949e]">{req.avatar}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#c9d1d9] truncate">{req.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-medium ${
                              req.type === 'fan' ? 'bg-blue-950/50 text-blue-400' : req.type === 'brand' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-amber-950/50 text-amber-400'
                            }`}>{req.type}</span>
                          </div>
                          <p className="text-[10px] text-[#8b949e] truncate">{req.preview}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button className="px-2 py-1 rounded-lg bg-emerald-600 text-[9px] text-white font-medium hover:bg-emerald-500 transition-colors">Accept</button>
                          <button className="px-2 py-1 rounded-lg bg-[#21262d] text-[9px] text-[#8b949e] font-medium hover:bg-[#30363d] transition-colors">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversations */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-[#21262d]">
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Conversations</h3>
                  </div>
                  {conversations.map((conv, i) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className="w-full flex items-center gap-2.5 p-3 hover:bg-[#21262d] transition-colors border-b border-[#21262d] last:border-0 text-left"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#8b949e]">{conv.avatar}</span>
                        </div>
                        {conv.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-sm bg-emerald-400 border-2 border-[#161b22]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#c9d1d9] truncate">{conv.name}</span>
                          <span className="text-[9px] text-[#484f58] flex-shrink-0">{conv.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-[#8b949e] truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] text-white font-bold">{conv.unread}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Message Volume Bars */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-3.5 w-3.5 text-purple-400" />
                    <h3 className="text-xs font-bold text-[#c9d1d9]">Message Volume</h3>
                  </div>
                  <MessageVolumeBars data={messageVolumeData} labels={messageVolumeLabels} />
                </div>

                {/* Response Time Gauge */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Avg Response Time</h3>
                  <div className="flex items-center justify-center">
                    <ResponseTimeGauge minutes={avgResponseTime} />
                  </div>
                </div>

                {/* Conversation Categories Donut */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Conversation Categories</h3>
                  <div className="flex items-center gap-4">
                    <ConversationCategoriesDonut segments={convCategories} />
                    <div className="space-y-1.5 flex-1">
                      {convCategories.map((seg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-[10px] text-[#8b949e] flex-1">{seg.label}</span>
                          <span className="text-[10px] text-[#c9d1d9] font-medium">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Unread Messages Timeline */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Unread Distribution</h3>
                  <UnreadTimeline data={unreadTimelineData} labels={unreadTimelineLabels} />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* =========================================
            TAB 2: Analytics & Influence
            ========================================= */}
        {activeTab === 2 && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Influence Score */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Star className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-[#c9d1d9]">Influence Score</h3>
              </div>
              <div className="text-4xl font-black text-emerald-400 mb-1">{influenceScore}</div>
              <p className="text-[10px] text-[#8b949e]">Based on followers, engagement, and reach</p>
              <div className="mt-3 h-2 bg-[#21262d] rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg bg-emerald-500 transition-all duration-500"
                  style={{ width: `${influenceScore}%` }}
                />
              </div>
            </div>

            {/* Platform Cards */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-3">Platform Followers</h3>
              <div className="space-y-2">
                {platforms.map((plat, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${plat.color}22`, border: `1px solid ${plat.color}44` }}>
                      <Globe className="h-3.5 w-3.5" style={{ color: plat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#c9d1d9]">{plat.name}</span>
                        <span className="text-[10px] text-[#8b949e]">{fmtNumber(plat.followers)}</span>
                      </div>
                      <span className="text-[9px] text-[#484f58]">{plat.handle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                <Eye className="h-4 w-4 text-sky-400 mx-auto mb-1" />
                <p className="text-[9px] text-[#8b949e] mb-0.5">Reach</p>
                <p className="text-xs font-bold text-sky-400">{fmtNumber(weeklyReach)}</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                <ThumbsUp className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <p className="text-[9px] text-[#8b949e] mb-0.5">Impressions</p>
                <p className="text-xs font-bold text-amber-400">{fmtNumber(weeklyImpressions)}</p>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                <Heart className="h-4 w-4 text-red-400 mx-auto mb-1" />
                <p className="text-[9px] text-[#8b949e] mb-0.5">Engagements</p>
                <p className="text-xs font-bold text-red-400">{fmtNumber(weeklyEngagements)}</p>
              </div>
            </div>

            {/* Top 5 Most Liked Posts */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Top Posts by Likes</h3>
              </div>
              <div className="space-y-2">
                {topLikedPosts.map((post, i) => (
                  <div key={post.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
                    <div className="w-5 h-5 rounded-md bg-amber-950/50 border border-amber-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className={`text-[9px] font-bold ${i === 0 ? 'text-amber-400' : 'text-[#8b949e]'}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#c9d1d9] line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Heart className="h-2.5 w-2.5 text-red-400" />
                        <span className="text-[9px] text-red-400 font-medium">{fmtNumber(post.likes)}</span>
                        <span className="text-[8px] text-[#484f58]">· {post.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Distribution Donut */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Platform Distribution</h3>
              <div className="flex items-center gap-4">
                <PlatformDistributionDonut segments={platformDonutSegments} />
                <div className="space-y-1.5 flex-1">
                  {platformDonutSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] text-[#8b949e] flex-1">{seg.label}</span>
                      <span className="text-[10px] text-[#c9d1d9] font-medium">{fmtNumber(seg.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reach vs Engagement Scatter */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Reach vs Engagement Rate</h3>
              <ReachEngagementScatter points={scatterPoints} />
            </div>

            {/* Content Performance Bars */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Content Performance</h3>
              <ContentPerformanceBars data={contentPerformance} />
            </div>

            {/* Influence Trend Area Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Influence Trend (6 Months)</h3>
              <InfluenceTrendChart data={influenceTrendData} labels={influenceTrendLabels} />
            </div>
          </motion.div>
        )}

        {/* =========================================
            TAB 3: Brand Deals
            ========================================= */}
        {activeTab === 3 && (
          <motion.div
            key="deals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <DollarSign className="h-4 w-4 text-emerald-400 mb-1" />
                <p className="text-[9px] text-[#8b949e] mb-0.5">Total Earnings</p>
                <p className="text-sm font-bold text-emerald-400">{fmtCurrency(totalEarnings)}</p>
                <span className="text-[8px] text-[#484f58]">from social media</span>
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <Shield className="h-4 w-4 text-sky-400 mb-1" />
                <p className="text-[9px] text-[#8b949e] mb-0.5">Brand Compatibility</p>
                <p className="text-sm font-bold text-sky-400">{brandCompatibility}%</p>
                <span className="text-[8px] text-[#484f58]">match score</span>
              </div>
            </div>

            {/* Active Deals */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Active Sponsorships</h3>
                <span className="text-[9px] text-emerald-400 font-medium ml-auto">{brandDeals.length} active</span>
              </div>
              <div className="space-y-2">
                {brandDeals.map((deal, i) => (
                  <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-400">{deal.logo}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c9d1d9]">{deal.brand}</span>
                        <span className="text-[9px] text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-950/50">Active</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#8b949e]">{deal.category}</span>
                        <span className="text-[#30363d]">·</span>
                        <span className="text-[10px] text-[#8b949e]">{deal.period}</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-400 mt-1">{fmtCurrency(deal.value)}/yr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Offers */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <AtSign className="h-3.5 w-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Pending Offers</h3>
                <span className="text-[9px] text-amber-400 font-medium ml-auto">{brandOffers.filter(o => !acceptedOffers.has(o.id) && !declinedOffers.has(o.id)).length} pending</span>
              </div>
              <div className="space-y-2">
                {brandOffers.map((offer) => {
                  const isAccepted = acceptedOffers.has(offer.id);
                  const isDeclined = declinedOffers.has(offer.id);
                  if (isAccepted || isDeclined) return null;
                  return (
                    <div key={offer.id} className="p-3 rounded-lg bg-[#0d1117] border border-amber-800/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-800/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-amber-400">{offer.logo}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-[#c9d1d9]">{offer.brand}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#8b949e]">{offer.period}</span>
                            <span className="text-[#30363d]">·</span>
                            <span className="text-[10px] text-emerald-400 font-medium">{fmtCurrency(offer.value)}/yr</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#8b949e] mb-2">{offer.description}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-[10px] text-white font-medium hover:bg-emerald-500 transition-colors"
                        >
                          Accept Deal
                        </button>
                        <button
                          onClick={() => handleDeclineOffer(offer.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#21262d] text-[10px] text-[#8b949e] font-medium hover:bg-[#30363d] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
                {brandOffers.every(o => acceptedOffers.has(o.id) || declinedOffers.has(o.id)) && (
                  <div className="p-4 text-center">
                    <p className="text-[10px] text-[#8b949e]">No pending offers. Check back later!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsorship Revenue Bars */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Revenue by Brand</h3>
              <SponsorshipRevenueBars data={sponsorshipRevenueData} />
            </div>

            {/* Brand Fit Radar */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Brand Fit Radar</h3>
              <div className="flex items-center gap-4">
                <BrandFitRadar axes={brandFitAxes} />
                <div className="space-y-1.5 flex-1">
                  {brandFitAxes.map((ax, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">{ax.label}</span>
                      <span className="text-[10px] text-[#c9d1d9] font-medium">{ax.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Earnings Trend Line Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Earnings Trend (6 Months)</h3>
              </div>
              <EarningsTrendChart data={earningsTrendData} labels={earningsTrendLabels} />
            </div>

            {/* Contract Timeline */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
              <h3 className="text-xs font-bold text-[#c9d1d9] mb-2">Contract Timeline</h3>
              <ContractTimeline deals={contractTimelineDeals} />
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* 11 NEW SVG DATA VISUALIZATION SECTIONS                       */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-4"
        >
          <h2 className="text-sm font-bold text-[#c9d1d9] mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#FF5500]" />
            Social Analytics Deep Dive
          </h2>

          {/* Row 1: EngagementRadar + PlatformReachBars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">

            {/* 1. EngagementRadar — Radar Chart (5-axis) — Stroke #FF5500 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-[#FF5500]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Engagement Radar</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 200 }} xmlns="http://www.w3.org/2000/svg">
                {/* Background hex rings at 25/50/75/100% */}
                {[25, 50, 75, 100].map((pct, li) => (
                  <polygon
                    key={li}
                    points={buildHexPoints(100, 100, (pct / 100) * 75, 5)}
                    fill="none"
                    stroke="#21262d"
                    strokeWidth="0.5"
                  />
                ))}
                {/* Axis lines */}
                {Array.from({ length: 5 }, (_, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  return (
                    <line
                      key={i}
                      x1={100}
                      y1={100}
                      x2={100 + 75 * Math.cos(angle)}
                      y2={100 + 75 * Math.sin(angle)}
                      stroke="#21262d"
                      strokeWidth="0.5"
                    />
                  );
                })}
                {/* Data polygon */}
                <polygon
                  points={buildRadarDataPoints(100, 100, 75, 5, engagementRadarValues)}
                  fill="#FF5500"
                  fillOpacity="0.15"
                  stroke="#FF5500"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {engagementRadarValues.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const r = (engagementRadarValues[i] / 100) * 75;
                  return (
                    <circle
                      key={i}
                      cx={100 + r * Math.cos(angle)}
                      cy={100 + r * Math.sin(angle)}
                      r="3"
                      fill="#FF5500"
                    />
                  );
                })}
                {/* Axis labels */}
                {['Likes', 'Comments', 'Shares', 'Saves', 'Views'].map((label, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const lx = 100 + 88 * Math.cos(angle);
                  const ly = 100 + 88 * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#8b949e"
                      fontSize="8"
                      fontFamily="sans-serif"
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2">
                {['Likes', 'Comments', 'Shares', 'Saves', 'Views'].map((label, i) => (
                  <span key={label} className="text-[10px] text-[#8b949e]">
                    {label}: <span className="text-[#FF5500] font-bold">{engagementRadarValues[i]}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 2. PlatformReachBars — Horizontal Bar Chart (5 bars) — Fill #00E5FF */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-[#00E5FF]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Platform Reach</h3>
              </div>
              <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                {platformReachData.map((item, i) => {
                  const maxVal = Math.max(...platformReachData.map(d => d.value), 1);
                  const y = 8 + i * 36;
                  const barW = (item.value / maxVal) * 180;
                  return (
                    <g key={i}>
                      <text x={0} y={y + 12} fill="#8b949e" fontSize="9" fontFamily="sans-serif">{item.label}</text>
                      <rect x={65} y={y} width={180} height={22} fill="#21262d" rx="4" />
                      <rect x={65} y={y} width={barW} height={22} fill="#00E5FF" fillOpacity="0.85" rx="4" />
                      <text x={65 + barW + 5} y={y + 15} fill="#c9d1d9" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                        {fmtNumber(item.value)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Row 2: ContentMixDonut + AudienceDemographicsDonut + InfluenceScoreGauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">

            {/* 3. ContentMixDonut — Donut Chart (4 segments) — Stroke #CCFF00 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-3.5 w-3.5 text-[#CCFF00]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Content Mix</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
                <ContentMixDonutInline segments={contentMixSegments} />
                {/* Legend below */}
                {contentMixSegments.map((seg, i) => (
                  <g key={i}>
                    <circle cx={20} cy={140 + i * 14} r="4" fill={seg.color} />
                    <text x={28} y={143 + i * 14} fill="#8b949e" fontSize="8" fontFamily="sans-serif">{seg.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 4. AudienceDemographicsDonut — Donut Chart (5 segments) — Stroke #FF5500 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3.5 w-3.5 text-[#FF5500]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Audience Demographics</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
                <AudienceDemographicsDonutInline segments={audienceDemographicsSegments} />
                {audienceDemographicsSegments.map((seg, i) => (
                  <g key={i}>
                    <circle cx={20} cy={140 + i * 13} r="4" fill={seg.color} />
                    <text x={28} y={143 + i * 13} fill="#8b949e" fontSize="8" fontFamily="sans-serif">{seg.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* 5. InfluenceScoreGauge — Semi-circular Gauge (0-100) — Stroke #00E5FF */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-3.5 w-3.5 text-[#00E5FF]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Influence Score</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
                {/* Background arc */}
                <path
                  d={buildSemiArcPath(100, 120, 70, Math.PI, 2 * Math.PI)}
                  fill="none"
                  stroke="#21262d"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Filled arc */}
                <path
                  d={buildSemiArcPath(100, 120, 70, Math.PI, Math.PI + (influenceScoreGauge / 100) * Math.PI)}
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <text x={100} y={110} textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="bold" fontFamily="sans-serif">
                  {influenceScoreGauge}
                </text>
                <text x={100} y={128} textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="sans-serif">
                  out of 100
                </text>
              </svg>
            </div>
          </div>

          {/* Row 3: BrandValueGauge + SponsorAppealRing + FollowerGrowthLine */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">

            {/* 6. BrandValueGauge — Semi-circular Gauge (0-100) — Stroke #CCFF00 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-3.5 w-3.5 text-[#CCFF00]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Brand Value</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
                <path
                  d={buildSemiArcPath(100, 120, 70, Math.PI, 2 * Math.PI)}
                  fill="none"
                  stroke="#21262d"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d={buildSemiArcPath(100, 120, 70, Math.PI, Math.PI + (brandValueGauge / 100) * Math.PI)}
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <text x={100} y={110} textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="bold" fontFamily="sans-serif">
                  {brandValueGauge}
                </text>
                <text x={100} y={128} textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="sans-serif">
                  brand index
                </text>
              </svg>
            </div>

            {/* 7. FollowerGrowthLine — Line Chart (8 data points) — Stroke #FF5500 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#FF5500]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Follower Growth (8 Weeks)</h3>
              </div>
              <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                {(() => {
                  const maxVal = Math.max(...followerGrowth8Week, 1);
                  const padX = 35;
                  const padY = 15;
                  const chartW = 260;
                  const chartH = 150;
                  const pts = followerGrowth8Week.map((v, i) => ({
                    x: padX + (i / (followerGrowth8Week.length - 1)) * chartW,
                    y: padY + chartH - (v / maxVal) * chartH,
                  }));
                  return (
                    <>
                      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
                      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
                      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{fmtNumber(maxVal)}</text>
                      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0</text>
                      <path d={buildLinePath(pts)} fill="none" stroke="#FF5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#FF5500" strokeWidth="2" />
                      ))}
                      {pts.map((p, i) => (
                        <text key={`l${i}`} x={p.x} y={padY + chartH + 14} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">W{i + 1}</text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* 11. SponsorAppealRing — Circular Ring (0-100) — Stroke #FF5500 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-3.5 w-3.5 text-[#FF5500]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Sponsor Appeal</h3>
              </div>
              <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 160 }} xmlns="http://www.w3.org/2000/svg">
                {(() => {
                  const strokeWidth = 12;
                  const radius = 65;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (sponsorAppealScore / 100) * circumference;
                  return (
                    <>
                      <circle cx={100} cy={100} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
                      <circle
                        cx={100}
                        cy={100}
                        r={radius}
                        fill="none"
                        stroke="#FF5500"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                      <text x={100} y={95} textAnchor="middle" fill="#c9d1d9" fontSize="26" fontWeight="bold" fontFamily="sans-serif">
                        {sponsorAppealScore}
                      </text>
                      <text x={100} y={112} textAnchor="middle" fill="#8b949e" fontSize="9" fontFamily="sans-serif">
                        appeal score
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Row 4: EngagementRateLine + PostPerformanceArea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">

            {/* 8. EngagementRateLine — Line Chart (8 data points) — Stroke #00E5FF */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-3.5 w-3.5 text-[#00E5FF]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Engagement Rate (8 Weeks)</h3>
              </div>
              <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                {(() => {
                  const maxVal = Math.max(...engagementRate8Week, 1);
                  const padX = 35;
                  const padY = 15;
                  const chartW = 260;
                  const chartH = 150;
                  const pts = engagementRate8Week.map((v, i) => ({
                    x: padX + (i / (engagementRate8Week.length - 1)) * chartW,
                    y: padY + chartH - (v / maxVal) * chartH,
                  }));
                  return (
                    <>
                      <line x1={padX} y1={padY} x2={padX} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
                      <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" />
                      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{maxVal.toFixed(1)}%</text>
                      <text x={padX - 4} y={padY + chartH + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0%</text>
                      <path d={buildLinePath(pts)} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#00E5FF" strokeWidth="2" />
                      ))}
                      {pts.map((p, i) => (
                        <text key={`l${i}`} x={p.x} y={padY + chartH + 14} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">W{i + 1}</text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* 9. PostPerformanceArea — Area Chart (8 data points) — Fill #CCFF00 at 20% */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-3.5 w-3.5 text-[#CCFF00]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Post Performance (Last 8)</h3>
              </div>
              <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                {(() => {
                  const maxVal = Math.max(...postPerformance8, 1);
                  const padX = 35;
                  const padY = 15;
                  const chartW = 260;
                  const chartH = 150;
                  const baseY = padY + chartH;
                  const pts = postPerformance8.map((v, i) => ({
                    x: padX + (i / (postPerformance8.length - 1)) * chartW,
                    y: padY + chartH - (v / maxVal) * chartH,
                  }));
                  return (
                    <>
                      <line x1={padX} y1={padY} x2={padX} y2={baseY} stroke="#21262d" strokeWidth="0.5" />
                      <line x1={padX} y1={baseY} x2={padX + chartW} y2={baseY} stroke="#21262d" strokeWidth="0.5" />
                      <text x={padX - 4} y={padY + 4} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">{fmtNumber(maxVal)}</text>
                      <text x={padX - 4} y={baseY + 2} textAnchor="end" fill="#484f58" fontSize="7" fontFamily="sans-serif">0</text>
                      <path d={buildAreaPath(pts, baseY)} fill="#CCFF00" fillOpacity="0.2" />
                      <path d={buildLinePath(pts)} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0d1117" stroke="#CCFF00" strokeWidth="2" />
                      ))}
                      {pts.map((p, i) => (
                        <text key={`l${i}`} x={p.x} y={baseY + 14} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="sans-serif">P{i + 1}</text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Row 5: ViralMomentTimeline */}
          <div className="mb-3">

            {/* 10. ViralMomentTimeline — Timeline (8 nodes) — Stroke #00E5FF */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-[#00E5FF]" />
                <h3 className="text-xs font-bold text-[#c9d1d9]">Viral Moments Timeline</h3>
              </div>
              <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                {(() => {
                  const padX = 25;
                  const cy = 60;
                  const chartW = 250;
                  const maxIntensity = 100;
                  return (
                    <>
                      {/* Base line */}
                      <line x1={padX} y1={cy} x2={padX + chartW} y2={cy} stroke="#21262d" strokeWidth="1.5" />
                      {viralMoments.map((moment, i) => {
                        const x = padX + (i / (viralMoments.length - 1)) * chartW;
                        const intensity = moment.intensity / maxIntensity;
                        const nodeR = 6 + intensity * 8;
                        return (
                          <g key={i}>
                            {/* Outer glow ring */}
                            <circle cx={x} cy={cy} r={nodeR} fill="#00E5FF" fillOpacity={0.08 + intensity * 0.15} />
                            {/* Node circle */}
                            <circle cx={x} cy={cy} r={4} fill={intensity > 0.7 ? '#00E5FF' : '#30363d'} stroke="#00E5FF" strokeWidth="1.5" />
                            {/* Vertical connector */}
                            <line x1={x} y1={cy + nodeR + 2} x2={x} y2={cy + nodeR + 16} stroke="#30363d" strokeWidth="0.5" />
                            {/* Week label */}
                            <text x={x} y={cy + nodeR + 26} textAnchor="middle" fill="#484f58" fontSize="8" fontFamily="sans-serif">{moment.label}</text>
                            {/* Caption */}
                            <text x={x} y={cy + nodeR + 38} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontFamily="sans-serif">{moment.caption}</text>
                            {/* Intensity label */}
                            <text x={x} y={cy - nodeR - 6} textAnchor="middle" fill="#00E5FF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">{moment.intensity}%</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
