'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Radio,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Star,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink,
  Ban,
  Trophy,
  Users,
  DollarSign,
  Zap,
  Send,
  ThumbsUp,
  Repeat,
  UserPlus,
  UserMinus,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Types & Interfaces
// ============================================================

type TransferEventType = 'completed' | 'medical' | 'rumor' | 'loan' | 'outgoing' | 'breaking';
type FeedFilter = 'all' | 'confirmed' | 'rumors' | 'loans' | 'outgoings';
type WindowStatus = 'open' | 'closing' | 'closed';
type DramaCardStatus = 'locked' | 'active' | 'completed';

interface TransferEvent {
  id: string;
  type: TransferEventType;
  timestamp: string;
  icon: string;
  fromClub: string;
  fromBadge: string;
  toClub: string;
  toBadge: string;
  playerName: string;
  fee: string;
  description: string;
  status: 'Confirmed' | 'Pending' | 'Rumor' | 'Breaking';
  statusColor: string;
}

interface DramaMoment {
  id: string;
  time: string;
  title: string;
  description: string;
  impact: string;
  status: DramaCardStatus;
  icon: string;
}

interface FanTweet {
  id: string;
  username: string;
  clubBadge: string;
  message: string;
  likes: number;
  retweets: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  avatar: string;
}

interface TransferOfferCard {
  id: string;
  fromClub: string;
  clubBadge: string;
  wage: string;
  contract: string;
  agentAdvice: string;
  adviceType: 'accept' | 'reject' | 'negotiate';
  expiresIn: string;
}

interface LoanOfferCard {
  id: string;
  fromClub: string;
  clubBadge: string;
  duration: string;
  recallClause: string;
  guaranteedMinutes: boolean;
}

// ============================================================
// Mock Data
// ============================================================

const MOCK_TRANSFER_EVENTS: TransferEvent[] = [
  {
    id: 'evt-1',
    type: 'completed',
    timestamp: '08:15',
    icon: '✅',
    fromClub: 'AS Monaco',
    fromBadge: '🔴⚪',
    toClub: 'Bayern Munich',
    toBadge: '🔴',
    playerName: 'Youssouf Fofana',
    fee: '€20M',
    description: 'Midfielder joins on a 4-year deal',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-2',
    type: 'rumor',
    timestamp: '08:45',
    icon: '📢',
    fromClub: 'Chelsea FC',
    fromBadge: '🔵',
    toClub: 'Man United',
    toBadge: '🔴',
    playerName: 'Cole Palmer',
    fee: '€80M',
    description: 'Chelsea reportedly table massive bid',
    status: 'Rumor',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'evt-3',
    type: 'completed',
    timestamp: '09:20',
    icon: '✅',
    fromClub: 'Villarreal CF',
    fromBadge: '🟡',
    toClub: 'Arsenal FC',
    toBadge: '🔴⚪',
    playerName: 'Pau Torres',
    fee: '€35M',
    description: 'Centre-back completes medical and signs',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-4',
    type: 'medical',
    timestamp: '10:05',
    icon: '🏥',
    fromClub: 'Real Sociedad',
    fromBadge: '🔵⚪',
    toClub: 'Aston Villa',
    toBadge: '🟣',
    playerName: 'Mikel Oyarzabal',
    fee: '€45M',
    description: 'Forward undergoing medical in Birmingham',
    status: 'Pending',
    statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'evt-5',
    type: 'outgoing',
    timestamp: '11:30',
    icon: '📤',
    fromClub: 'Tottenham',
    fromBadge: '⚪',
    toClub: 'AC Milan',
    toBadge: '🔴⚫',
    playerName: 'Destiny Udogie',
    fee: '€28M',
    description: 'Left-back set for Serie A switch',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-6',
    type: 'loan',
    timestamp: '12:15',
    icon: '🔄',
    fromClub: 'Liverpool FC',
    fromBadge: '🔴',
    toClub: 'Real Betis',
    toBadge: '💚',
    playerName: 'Curtis Jones',
    fee: 'Loan',
    description: 'Midfielder joins on season-long loan',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-7',
    type: 'completed',
    timestamp: '14:00',
    icon: '✅',
    fromClub: 'RB Leipzig',
    fromBadge: '🔴⚪',
    toClub: 'Man City',
    toBadge: '🔵',
    playerName: 'Xavi Simons',
    fee: '€60M',
    description: 'Dutch sensation signs 5-year contract',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-8',
    type: 'rumor',
    timestamp: '15:45',
    icon: '📢',
    fromClub: 'West Ham',
    fromBadge: '🟤⚫',
    toClub: 'Newcastle',
    toBadge: '⚫⚪',
    playerName: 'Jarrod Bowen',
    fee: '€40M',
    description: 'Magpies preparing late bid for winger',
    status: 'Rumor',
    statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'evt-9',
    type: 'breaking',
    timestamp: '17:30',
    icon: '🚨',
    fromClub: 'FC Barcelona',
    fromBadge: '🔵🔴',
    toClub: 'Paris SG',
    toBadge: '🔴🔵',
    playerName: 'Raphinha',
    fee: '€70M',
    description: 'BREAKING: Emergency loan deal agreed!',
    status: 'Breaking',
    statusColor: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    id: 'evt-10',
    type: 'completed',
    timestamp: '19:00',
    icon: '✅',
    fromClub: 'Atalanta',
    fromBadge: '🔵⚫',
    toClub: 'Juventus',
    toBadge: '⚪⚫',
    playerName: 'Teun Koopmeiners',
    fee: '€55M',
    description: 'Midfielder completes dramatic late move',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'evt-11',
    type: 'medical',
    timestamp: '20:30',
    icon: '🏥',
    fromClub: 'Benfica',
    fromBadge: '🔴⚪',
    toClub: 'Tottenham',
    toBadge: '⚪',
    playerName: 'João Neves',
    fee: '€50M',
    description: 'Teenager in final medical at Spurs lodge',
    status: 'Pending',
    statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'evt-12',
    type: 'breaking',
    timestamp: '22:50',
    icon: '🚨',
    fromClub: 'Napoli',
    fromBadge: '🔵',
    toClub: 'Chelsea FC',
    toBadge: '🔵',
    playerName: 'Victor Osimhen',
    fee: '€75M',
    description: 'FINAL DEAL: Striker signs after frantic paperwork!',
    status: 'Confirmed',
    statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
];

const MOCK_DRAMA_MOMENTS: DramaMoment[] = [
  {
    id: 'drama-1',
    time: '9:00 AM',
    title: 'Window Opens — Chaos Begins',
    description: 'The transfer window slams open and clubs across Europe scramble to finalize deals. Private jets are fuelled, agents are on speed dial, and fax machines at Premier League HQ are warming up.',
    impact: 'Speculation mounts — your name surfaces in 3 rumors',
    status: 'completed',
    icon: '🌅',
  },
  {
    id: 'drama-2',
    time: '11:30 AM',
    title: 'Medicals Scheduled for 3 Players',
    description: 'Breaking news that three major medicals have been scheduled simultaneously in London, Manchester, and Madrid. Fans gather outside training grounds hoping for glimpses.',
    impact: 'Your agent confirms interest from 2 clubs',
    status: 'completed',
    icon: '🏥',
  },
  {
    id: 'drama-3',
    time: '2:00 PM',
    title: 'Club Confirms €50M Bid Received',
    description: 'Your current club confirms they have received a formal €50 million bid for your services. The board calls an emergency meeting to discuss the offer.',
    impact: 'Transfer speculation intensifies around you',
    status: 'completed',
    icon: '💰',
  },
  {
    id: 'drama-4',
    time: '5:00 PM',
    title: 'Paperwork Delays Threaten Deal',
    description: 'Reports emerge that a major deal is in jeopardy due to international paperwork delays. Lawyers work frantically across three time zones to beat the deadline.',
    impact: 'One of your offers may fall through',
    status: 'active',
    icon: '📝',
  },
  {
    id: 'drama-5',
    time: '8:00 PM',
    title: 'Last-Minute Scramble for Signatures',
    description: 'The final hours descend into pure chaos. Players are reportedly rushing to training grounds in taxis, agents sprint through airport terminals, and club secretaries work overtime.',
    impact: 'Your decision deadline is approaching fast',
    status: 'locked',
    icon: '🏃',
  },
  {
    id: 'drama-6',
    time: '10:55 PM',
    title: 'FINAL DEAL CONFIRMED!',
    description: 'In the dying minutes, one of the biggest deals of the window is completed. The confirmation lights up social media as fans react to the stunning last-minute transfer.',
    impact: 'The window closes — your future is decided',
    status: 'locked',
    icon: '🏆',
  },
];

const MOCK_FAN_TWEETS: FanTweet[] = [
  {
    id: 'tweet-1',
    username: '@TrueBlueFan92',
    clubBadge: '🔵',
    message: 'WE GOT HIM! Best signing in years! The lads are going to smash it this season! 🎉🔥',
    likes: 4231,
    retweets: 892,
    sentiment: 'positive',
    avatar: '😎',
  },
  {
    id: 'tweet-2',
    username: '@AngryGlory88',
    clubBadge: '🔴',
    message: 'Absolute shambles from the board. We needed a striker and we sign ANOTHER midfielder. Fire the sporting director! 😡',
    likes: 2103,
    retweets: 456,
    sentiment: 'negative',
    avatar: '😤',
  },
  {
    id: 'tweet-3',
    username: '@NeutralObserver_UK',
    clubBadge: '⚪',
    message: 'Interesting deadline day overall. Some good business done but the lack of defensive reinforcements across the league is worrying.',
    likes: 876,
    retweets: 234,
    sentiment: 'neutral',
    avatar: '🤔',
  },
  {
    id: 'tweet-4',
    username: '@YouthAcademyScout',
    clubBadge: '🟢',
    message: 'Really excited about the young players coming through. The future is bright even if today was quiet on the first-team front 👏',
    likes: 1543,
    retweets: 321,
    sentiment: 'positive',
    avatar: '⭐',
  },
  {
    id: 'tweet-5',
    username: '@SeasonTicketHolder',
    clubBadge: '🟡',
    message: 'Another window, another disappointment. Same problems, same lack of ambition from the owners. Starting to lose faith tbh.',
    likes: 3210,
    retweets: 678,
    sentiment: 'negative',
    avatar: '😞',
  },
  {
    id: 'tweet-6',
    username: '@DeadlineDayDave',
    clubBadge: '🟣',
    message: 'What a WINDOW! 🤯 The last 3 hours were absolutely insane. Best deadline day I can remember in years!',
    likes: 8901,
    retweets: 2345,
    sentiment: 'positive',
    avatar: '🎉',
  },
];

const MOCK_TRANSFER_OFFERS: TransferOfferCard[] = [
  {
    id: 'offer-1',
    fromClub: 'Bayern Munich',
    clubBadge: '🔴',
    wage: '€120K/week',
    contract: '4 years',
    agentAdvice: 'Excellent opportunity — Champions League football guaranteed and a significant wage increase. I strongly recommend accepting.',
    adviceType: 'accept',
    expiresIn: '2h 15m',
  },
  {
    id: 'offer-2',
    fromClub: 'Aston Villa',
    clubBadge: '🟣',
    wage: '€95K/week',
    contract: '3 years',
    agentAdvice: 'Good project under the new manager, but wage is below market rate. Negotiate for better terms before deciding.',
    adviceType: 'negotiate',
    expiresIn: '4h 30m',
  },
  {
    id: 'offer-3',
    fromClub: 'Real Betis',
    clubBadge: '💚',
    wage: '€70K/week',
    contract: '2 years',
    agentAdvice: 'La Liga experience would be great, but the contract length and wage are insufficient. I recommend rejecting this one.',
    adviceType: 'reject',
    expiresIn: '1h 45m',
  },
];

const MOCK_LOAN_OFFERS: LoanOfferCard[] = [
  {
    id: 'loan-1',
    fromClub: 'Real Sociedad',
    clubBadge: '🔵⚪',
    duration: '6 months',
    recallClause: 'Yes — January window',
    guaranteedMinutes: true,
  },
  {
    id: 'loan-2',
    fromClub: 'Wolves',
    clubBadge: '🟠⚫',
    duration: 'Full season',
    recallClause: 'No recall clause',
    guaranteedMinutes: false,
  },
];

const MEDIA_HEADLINES = [
  { title: 'Transfer Deadline Day: All the completed deals', source: 'BBC Sport' },
  { title: 'The winners and losers of deadline day', source: 'The Athletic' },
  { title: 'Breaking: Last-minute swoops shake up the league', source: 'Sky Sports' },
];

const INCOMING_TRANSFERS = [
  { name: 'Xavi Simons', position: 'CAM', from: 'RB Leipzig', fee: '€60M', status: 'Completed', statusColor: 'bg-emerald-500/10 text-emerald-400' },
  { name: 'Pau Torres', position: 'CB', from: 'Villarreal', fee: '€35M', status: 'Completed', statusColor: 'bg-emerald-500/10 text-emerald-400' },
  { name: 'João Neves', position: 'CDM', from: 'Benfica', fee: '€50M', status: 'Medical', statusColor: 'bg-amber-500/10 text-amber-400' },
  { name: 'Mikel Oyarzabal', position: 'LW', from: 'Real Sociedad', fee: '€45M', status: 'Pending', statusColor: 'bg-blue-500/10 text-blue-400' },
];

const OUTGOING_TRANSFERS = [
  { name: 'Nelson Semedo', position: 'RB', to: 'Galatasaray', fee: '€8M', status: 'Completed', statusColor: 'bg-emerald-500/10 text-emerald-400' },
  { name: 'Fabio Vieira', position: 'CM', to: 'Porto', fee: '€20M', status: 'Completed', statusColor: 'bg-emerald-500/10 text-emerald-400' },
  { name: 'Reiss Nelson', position: 'RW', to: 'Crystal Palace', fee: '€15M', status: 'Pending', statusColor: 'bg-blue-500/10 text-blue-400' },
];

// ============================================================
// Section 1: Deadline Countdown Header
// ============================================================

function DeadlineCountdownHeader({
  dealsToday,
  totalSpent,
  totalReceived,
  windowStatus,
}: {
  dealsToday: number;
  totalSpent: string;
  totalReceived: string;
  windowStatus: WindowStatus;
}) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Simulate a countdown: start from a fixed deadline point
    const totalSeconds = windowStatus === 'closed' ? 0 : 3 * 3600 + 42 * 60 + 17;
    let remaining = totalSeconds;

    /* eslint-disable react-hooks/set-state-in-effect */
    setCountdown({
      hours: Math.floor(remaining / 3600),
      minutes: Math.floor((remaining % 3600) / 60),
      seconds: remaining % 60,
    });
    /* eslint-enable react-hooks/set-state-in-effect */

    if (windowStatus === 'closed') return;

    const interval = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      setCountdown({
        hours: Math.floor(remaining / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [windowStatus]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const statusConfig = {
    open: { label: 'OPEN', color: 'text-emerald-400', borderColor: 'border-emerald-500', pulseColor: 'bg-emerald-500' },
    closing: { label: 'CLOSING SOON', color: 'text-red-400', borderColor: 'border-red-500', pulseColor: 'bg-red-500' },
    closed: { label: 'CLOSED', color: 'text-[#8b949e]', borderColor: 'border-[#30363d]', pulseColor: 'bg-[#30363d]' },
  };

  const config = statusConfig[windowStatus];

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Banner */}
      <div className={`relative bg-[#161b22] border ${config.borderColor} border-l-[3px] overflow-hidden`}>
        {/* Pulsing border effect */}
        <AnimatePresence>
          {windowStatus !== 'closed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute top-0 left-0 w-[3px] ${config.pulseColor}`}
              style={{ height: '100%' }}
            />
          )}
        </AnimatePresence>

        <div className="p-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${config.color}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#c9d1d9]">
                Transfer Deadline Day
              </span>
            </div>
            <Badge className={`${config.color} border ${config.borderColor} bg-transparent text-[10px] font-bold`}>
              {windowStatus === 'closed' ? '🔒' : '🟢'} {config.label}
            </Badge>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[
              { value: pad(countdown.hours), label: 'HRS' },
              { value: ':', label: '' },
              { value: pad(countdown.minutes), label: 'MIN' },
              { value: ':', label: '' },
              { value: pad(countdown.seconds), label: 'SEC' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.label ? (
                  <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold tabular-nums ${windowStatus === 'closed' ? 'text-[#484f58]' : 'text-white'}`}>
                      {item.value}
                    </span>
                    <span className="text-[8px] font-semibold tracking-widest text-[#484f58] uppercase">{item.label}</span>
                  </div>
                ) : (
                  <span className={`text-2xl font-bold ${windowStatus === 'closed' ? 'text-[#30363d]' : 'text-[#30363d]'}`}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Date & Window Closes Notice */}
          <div className="text-center mb-3">
            <p className="text-[10px] text-[#8b949e]">{currentDate}</p>
            {windowStatus !== 'closed' && (
              <p className="text-[10px] text-[#484f58] mt-0.5">
                <Clock className="inline h-3 w-3 mr-1" />
                Window closes at 23:00
              </p>
            )}
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, value: String(dealsToday), label: 'Deals Today', color: 'text-emerald-400' },
              { icon: <ArrowUpRight className="h-3.5 w-3.5" />, value: totalSpent, label: 'Total Spent', color: 'text-red-400' },
              { icon: <ArrowDownRight className="h-3.5 w-3.5" />, value: totalReceived, label: 'Total Received', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[#0d1117] border border-[#30363d] p-2 text-center"
              >
                <div className={`flex items-center justify-center gap-1 ${stat.color} mb-0.5`}>
                  {stat.icon}
                </div>
                <p className="text-sm font-bold text-white">{stat.value}</p>
                <p className="text-[8px] text-[#8b949e] font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 2: Live Transfer Feed
// ============================================================

function LiveTransferFeed() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [visibleEvents, setVisibleEvents] = useState<number>(1);
  const feedRef = useRef<HTMLDivElement>(null);

  const filters: { key: FeedFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: MOCK_TRANSFER_EVENTS.length },
    { key: 'confirmed', label: 'Confirmed', count: MOCK_TRANSFER_EVENTS.filter(e => e.status === 'Confirmed').length },
    { key: 'rumors', label: 'Rumors', count: MOCK_TRANSFER_EVENTS.filter(e => e.status === 'Rumor').length },
    { key: 'loans', label: 'Loans', count: MOCK_TRANSFER_EVENTS.filter(e => e.type === 'loan').length },
    { key: 'outgoings', label: 'Outgoings', count: MOCK_TRANSFER_EVENTS.filter(e => e.type === 'outgoing').length },
  ];

  const filteredEvents = MOCK_TRANSFER_EVENTS.filter(event => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'confirmed') return event.status === 'Confirmed';
    if (activeFilter === 'rumors') return event.status === 'Rumor';
    if (activeFilter === 'loans') return event.type === 'loan';
    if (activeFilter === 'outgoings') return event.type === 'outgoing';
    return true;
  });

  // Simulate events appearing one by one
  useEffect(() => {
    if (visibleEvents >= filteredEvents.length) return;
    const timer = setTimeout(() => {
      setVisibleEvents(prev => Math.min(prev + 1, filteredEvents.length));
    }, 2000);
    return () => clearTimeout(timer);
  }, [visibleEvents, filteredEvents.length]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleEvents]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Live Transfer Feed</h3>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-red-500 inline-block"
          />
        </div>
        <span className="text-[10px] text-[#8b949e]">{filteredEvents.length} events</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map(filter => (
          <button
            key={filter.key}
            onClick={() => {
              setActiveFilter(filter.key);
              setVisibleEvents(1);
            }}
            className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-semibold border transition-colors ${
              activeFilter === filter.key
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            {filter.label}
            <span className="ml-1 text-[9px] opacity-60">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div ref={feedRef} className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filteredEvents.slice(0, visibleEvents).map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              className="bg-[#161b22] border border-[#30363d] p-3"
            >
              <div className="flex items-start gap-3">
                {/* Icon & Timestamp */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-lg">{event.icon}</span>
                  <span className="text-[9px] text-[#484f58] font-mono">{event.timestamp}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#c9d1d9]">{event.playerName}</span>
                    <Badge className={`text-[9px] border ${event.statusColor} px-1.5 py-0`}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mb-1.5">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span>{event.fromBadge}</span>
                      <span className="text-[#484f58]">→</span>
                      <span>{event.toBadge}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${event.status === 'Confirmed' ? 'text-emerald-400' : event.status === 'Rumor' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {event.fee}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {visibleEvents < filteredEvents.length && (
          <div className="flex items-center justify-center py-2">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-2 text-[10px] text-[#484f58]"
            >
              <Radio className="h-3 w-3" />
              More deals incoming...
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 3: Your Transfer Activity
// ============================================================

function YourTransferActivity() {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const getAdviceColor = (type: string) => {
    switch (type) {
      case 'accept': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'reject': return 'border-red-500/30 bg-red-500/5';
      case 'negotiate': return 'border-amber-500/30 bg-amber-500/5';
      default: return 'border-[#30363d] bg-[#161b22]';
    }
  };

  const getAdviceIcon = (type: string) => {
    switch (type) {
      case 'accept': return <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />;
      case 'reject': return <Ban className="h-3.5 w-3.5 text-red-400" />;
      case 'negotiate': return <MessageSquare className="h-3.5 w-3.5 text-amber-400" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Your Transfer Activity</h3>
        </div>
        <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {MOCK_TRANSFER_OFFERS.length} offers
        </Badge>
      </div>

      {/* Transfer Offers */}
      <div className="space-y-2">
        {MOCK_TRANSFER_OFFERS.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-[#161b22] border border-[#30363d] p-3 space-y-2.5"
          >
            {/* Club & Expiry */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{offer.clubBadge}</span>
                <div>
                  <p className="text-xs font-bold text-[#c9d1d9]">{offer.fromClub}</p>
                  <p className="text-[10px] text-[#8b949e]">{offer.wage} • {offer.contract}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-red-400">
                <Clock className="h-3 w-3" />
                <span>{offer.expiresIn}</span>
              </div>
            </div>

            {/* Agent Advice */}
            <div className={`border p-2 ${getAdviceColor(offer.adviceType)}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {getAdviceIcon(offer.adviceType)}
                <span className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wide">Agent Advice</span>
              </div>
              <p className="text-[10px] text-[#c9d1d9] leading-relaxed">{offer.agentAdvice}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 bg-emerald-700 hover:bg-emerald-600 text-[10px] font-semibold"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] text-[10px]"
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Negotiate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 border-red-500/30 text-red-400 hover:text-red-300 text-[10px]"
              >
                <Ban className="mr-1 h-3 w-3" />
                Reject
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Make Transfer Request Button */}
      <Button className="w-full h-9 bg-amber-700 hover:bg-amber-600 text-[11px] font-semibold">
        <Send className="mr-1.5 h-3.5 w-3.5" />
        Make Transfer Request
      </Button>

      {/* Loan Offers Section */}
      <div className="border-t border-[#21262d] pt-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Repeat className="h-3.5 w-3.5 text-blue-400" />
          <h4 className="text-xs font-bold text-[#c9d1d9]">Loan Options</h4>
        </div>

        <div className="space-y-2">
          {MOCK_LOAN_OFFERS.map((loan) => (
            <div
              key={loan.id}
              className="bg-[#161b22] border border-[#30363d] p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{loan.clubBadge}</span>
                <div>
                  <p className="text-xs font-semibold text-[#c9d1d9]">{loan.fromClub}</p>
                  <p className="text-[10px] text-[#8b949e]">
                    {loan.duration} • Recall: {loan.recallClause}
                  </p>
                  {loan.guaranteedMinutes && (
                    <span className="text-[9px] text-emerald-400 font-medium">✓ Guaranteed minutes</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-blue-500/30 text-blue-400 hover:text-blue-300 text-[10px]"
              >
                Accept Loan
              </Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 4: Deadline Day Drama Events
// ============================================================

function DeadlineDayDrama() {
  const [unlockedDramas, setUnlockedDramas] = useState<number>(4);

  useEffect(() => {
    if (unlockedDramas >= MOCK_DRAMA_MOMENTS.length) return;

    const timer = setTimeout(() => {
      setUnlockedDramas(prev => Math.min(prev + 1, MOCK_DRAMA_MOMENTS.length));
    }, 15000);

    return () => clearTimeout(timer);
  }, [unlockedDramas]);

  const getDramaStatusDisplay = (index: number, drama: DramaMoment) => {
    if (index < unlockedDramas) return drama.status === 'completed' ? 'completed' : 'active';
    return 'locked';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Deadline Day Drama</h3>
        </div>
        <span className="text-[10px] text-[#8b949e]">
          {unlockedDramas}/{MOCK_DRAMA_MOMENTS.length} events
        </span>
      </div>

      {/* Timeline */}
      <div className="relative space-y-2">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-[#21262d]" />

        {MOCK_DRAMA_MOMENTS.map((drama, idx) => {
          const status = getDramaStatusDisplay(idx, drama);
          const isLocked = status === 'locked';
          const isLatest = idx === unlockedDramas - 1;

          return (
            <motion.div
              key={drama.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLocked ? 0.4 : 1 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="relative flex gap-3"
            >
              {/* Timeline Dot */}
              <div className="flex-shrink-0 relative z-10">
                <div
                  className={`w-9 h-9 flex items-center justify-center border ${
                    isLocked
                      ? 'border-[#30363d] bg-[#0d1117]'
                      : isLatest
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : status === 'completed'
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-blue-500/30 bg-blue-500/10'
                  }`}
                >
                  {isLocked ? (
                    <span className="text-sm text-[#484f58]">🔒</span>
                  ) : (
                    <span className="text-sm">{drama.icon}</span>
                  )}
                </div>
              </div>

              {/* Content Card */}
              <div
                className={`flex-1 p-3 ${
                  isLocked
                    ? 'bg-[#161b22]/40 border border-[#30363d]/40'
                    : 'bg-[#161b22] border border-[#30363d]'
                }`}
              >
                {!isLocked && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-[#484f58]">{drama.time}</span>
                      {isLatest && (
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-[9px] text-amber-400 font-semibold"
                        >
                          HAPPENING NOW
                        </motion.span>
                      )}
                      {status === 'completed' && (
                        <span className="text-[9px] text-emerald-400 font-medium">✓ Happened</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#c9d1d9] mb-1">{drama.title}</p>
                    <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{drama.description}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">{drama.impact}</span>
                    </div>
                  </>
                )}
                {isLocked && (
                  <div className="py-1.5">
                    <span className="text-[10px] text-[#484f58]">Unlock at {drama.time}...</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 5: Transfer Budget Tracker
// ============================================================

function TransferBudgetTracker() {
  const initialBudget = 150;
  const spent = 190;
  const wageBudgetUsed = 78;
  const emergencyAvailable = true;

  const remaining = Math.max(0, initialBudget - spent);
  const spentPct = Math.min(100, (spent / initialBudget) * 100);

  const getFinancialHealth = () => {
    if (remaining > 50) return { label: 'Excellent', color: 'text-emerald-400', icon: '✅' };
    if (remaining > 20) return { label: 'Good', color: 'text-emerald-400', icon: '👍' };
    if (remaining > 0) return { label: 'Tight', color: 'text-amber-400', icon: '⚠️' };
    return { label: 'Over Budget', color: 'text-red-400', icon: '🔴' };
  };

  const health = getFinancialHealth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-[#c9d1d9]">Budget Tracker</h3>
      </div>

      {/* Main Budget Card */}
      <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-4">
        {/* Budget Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">Transfer Budget</span>
            <span className={`text-[10px] font-bold ${health.color}`}>{health.icon} {health.label}</span>
          </div>

          <div className="h-3 bg-[#21262d] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full ${spentPct > 100 ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#8b949e]">€{spent}M spent</span>
            <span className="text-[#484f58]">of €{initialBudget}M</span>
          </div>
        </div>

        {/* Budget Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase mb-0.5">Remaining</p>
            <p className={`text-sm font-bold ${remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              €{remaining}M
            </p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase mb-0.5">Wage Util.</p>
            <p className="text-sm font-bold text-amber-400">{wageBudgetUsed}%</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase mb-0.5">Overdraft</p>
            <p className="text-sm font-bold text-red-400">€{spent > initialBudget ? spent - initialBudget : 0}M</p>
          </div>
        </div>

        {/* Comparison */}
        <div className="border-t border-[#21262d] pt-3">
          <p className="text-[10px] text-[#8b949e] mb-2 font-semibold uppercase tracking-wide">Budget vs. Window Start</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">Start of Window</span>
                <span className="text-[#c9d1d9]">€{initialBudget}M</span>
              </div>
              <div className="h-2 bg-[#21262d] overflow-hidden">
                <div className="h-full w-full bg-[#484f58]" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-[#8b949e]">Now</span>
                <span className="text-red-400">€{remaining}M</span>
              </div>
              <div className="h-2 bg-[#21262d] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, (remaining / initialBudget) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${remaining > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Budget */}
        <div className="border-t border-[#21262d] pt-3">
          {emergencyAvailable ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-[#8b949e]">Emergency Budget Request</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-amber-500/30 text-amber-400 hover:text-amber-300 text-[10px]"
              >
                Request €25M
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-red-400">
              <Ban className="h-3.5 w-3.5" />
              Emergency budget already used this window
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 6: Club Transfer Summary
// ============================================================

function ClubTransferSummary() {
  const totalSpent = 190;
  const totalReceived = 43;
  const netSpend = totalSpent - totalReceived;
  const squadStart = 25;
  const squadNow = 27;
  const squadChange = squadNow - squadStart;

  const getWindowGrade = () => {
    const net = Math.abs(netSpend);
    const signings = INCOMING_TRANSFERS.filter(t => t.status === 'Completed').length;
    if (net < 50 && signings >= 3) return { grade: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (net < 100 && signings >= 2) return { grade: 'B+', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (signings >= 2) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (signings >= 1) return { grade: 'C+', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { grade: 'C', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  };

  const windowGrade = getWindowGrade();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Club Transfer Summary</h3>
        </div>
        <div className={`px-2.5 py-0.5 border ${windowGrade.bg} ${windowGrade.color} text-sm font-black`}>
          {windowGrade.grade}
        </div>
      </div>

      {/* Incomings */}
      <div className="bg-[#161b22] border border-[#30363d] overflow-hidden">
        <div className="px-4 py-2 border-b border-[#21262d] flex items-center gap-2">
          <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide">Incomings</span>
          <span className="text-[10px] text-emerald-400 font-bold ml-auto">{INCOMING_TRANSFERS.length} players</span>
        </div>
        <div className="divide-y divide-[#21262d]">
          {INCOMING_TRANSFERS.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-2.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#21262d] flex items-center justify-center text-[10px] font-bold text-[#c9d1d9] border border-[#30363d]">
                  {player.position}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#c9d1d9]">{player.name}</p>
                  <p className="text-[9px] text-[#8b949e]">from {player.from}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <Badge className={`text-[9px] border ${player.statusColor} px-1.5 py-0`}>
                  {player.status}
                </Badge>
                <span className="text-xs font-bold text-emerald-400">{player.fee}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Outgoings */}
      <div className="bg-[#161b22] border border-[#30363d] overflow-hidden">
        <div className="px-4 py-2 border-b border-[#21262d] flex items-center gap-2">
          <UserMinus className="h-3.5 w-3.5 text-red-400" />
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide">Outgoings</span>
          <span className="text-[10px] text-red-400 font-bold ml-auto">{OUTGOING_TRANSFERS.length} players</span>
        </div>
        <div className="divide-y divide-[#21262d]">
          {OUTGOING_TRANSFERS.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 + 0.2 }}
              className="px-4 py-2.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#21262d] flex items-center justify-center text-[10px] font-bold text-[#c9d1d9] border border-[#30363d]">
                  {player.position}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#c9d1d9]">{player.name}</p>
                  <p className="text-[9px] text-[#8b949e]">to {player.to}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <Badge className={`text-[9px] border ${player.statusColor} px-1.5 py-0`}>
                  {player.status}
                </Badge>
                <span className="text-xs font-bold text-red-400">{player.fee}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Net Spend & Squad Size */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] p-3 text-center">
          <p className="text-[9px] text-[#8b949e] uppercase mb-0.5">Net Spend</p>
          <p className={`text-lg font-bold ${netSpend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {netSpend > 0 ? '+' : '-'}€{Math.abs(netSpend)}M
          </p>
          <p className="text-[9px] text-[#484f58] mt-0.5">
            €{totalSpent}M in — €{totalReceived}M out
          </p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-3 text-center">
          <p className="text-[9px] text-[#8b949e] uppercase mb-0.5">Squad Size</p>
          <p className="text-lg font-bold text-emerald-400">
            {squadStart} → {squadNow}
          </p>
          <p className="text-[9px] text-emerald-400 mt-0.5">
            +{squadChange} player{squadChange !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 7: Social Media Reaction
// ============================================================

function SocialMediaReaction() {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const getSentimentBorder = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-l-emerald-500';
      case 'negative': return 'border-l-red-500';
      default: return 'border-l-[#484f58]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.45 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-bold text-[#c9d1d9]">Fan Reactions</h3>
      </div>

      {/* Sentiment Bar */}
      <div className="bg-[#161b22] border border-[#30363d] p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e] font-semibold uppercase tracking-wide">Fan Sentiment</span>
          <span className="text-emerald-400 font-medium">Mostly Positive</span>
        </div>
        <div className="flex h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '60%' }}
            transition={{ duration: 0.5 }}
            className="bg-emerald-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '25%' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-amber-500"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '15%' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-red-500"
          />
        </div>
        <div className="flex justify-between text-[9px] text-[#8b949e]">
          <span>😊 60% Positive</span>
          <span>😐 25% Neutral</span>
          <span>😞 15% Negative</span>
        </div>
      </div>

      {/* Fan Tweets */}
      <div className="space-y-2">
        {MOCK_FAN_TWEETS.map((tweet, i) => (
          <motion.div
            key={tweet.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`bg-[#161b22] border border-[#30363d] border-l-[3px] ${getSentimentBorder(tweet.sentiment)} p-3`}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#21262d] flex items-center justify-center text-sm border border-[#30363d]">
                  {tweet.avatar}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{tweet.username}</span>
                  <span className="text-xs">{tweet.clubBadge}</span>
                  {getSentimentIcon(tweet.sentiment)}
                </div>
                <p className="text-[11px] text-[#c9d1d9] leading-relaxed mb-2">{tweet.message}</p>
                <div className="flex items-center gap-4 text-[9px] text-[#484f58]">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {tweet.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    {tweet.retweets.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    Share
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Media Coverage */}
      <div className="border-t border-[#21262d] pt-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide">Media Coverage</span>
        </div>
        <div className="space-y-1.5">
          {MEDIA_HEADLINES.map((headline, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#161b22] border border-[#30363d] p-2 hover:border-[#484f58] transition-colors"
            >
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-[10px] text-[#c9d1d9] truncate">{headline.title}</p>
                <p className="text-[9px] text-[#484f58]">{headline.source}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-[#484f58] flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Section 8: Post-Deadline Summary
// ============================================================

function PostDeadlineSummary({ windowClosed }: { windowClosed: boolean }) {
  if (!windowClosed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      {/* Window Closed Banner */}
      <div className="bg-[#161b22] border-2 border-red-500/30 p-4 text-center">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Ban className="h-8 w-8 text-red-400 mx-auto mb-2" />
        </motion.div>
        <h3 className="text-lg font-black text-red-400 uppercase tracking-wider">Window Closed</h3>
        <p className="text-[10px] text-[#8b949e] mt-1">The summer transfer window has officially closed</p>
      </div>

      {/* Final Summary */}
      <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-3">
        <h4 className="text-xs font-bold text-[#c9d1d9] uppercase tracking-wide">Final Summary</h4>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase">Deals Done</p>
            <p className="text-lg font-bold text-emerald-400">7</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase">Money Spent</p>
            <p className="text-lg font-bold text-red-400">€190M</p>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase">Received</p>
            <p className="text-lg font-bold text-emerald-400">€43M</p>
          </div>
        </div>

        <div className="border-t border-[#21262d] pt-3 space-y-2">
          {/* Best Signing */}
          <div className="flex items-center gap-2">
            <span className="text-sm">🌟</span>
            <div>
              <p className="text-[9px] text-[#8b949e] uppercase">Best Signing</p>
              <p className="text-xs font-bold text-emerald-400">Xavi Simons — €60M from RB Leipzig</p>
            </div>
          </div>

          {/* Biggest Disappointment */}
          <div className="flex items-center gap-2">
            <span className="text-sm">😔</span>
            <div>
              <p className="text-[9px] text-[#8b949e] uppercase">Biggest Disappointment</p>
              <p className="text-xs font-bold text-red-400">Failed to sign a backup striker</p>
            </div>
          </div>

          {/* Squad Changes */}
          <div className="flex items-center gap-2">
            <span className="text-sm">👥</span>
            <div>
              <p className="text-[9px] text-[#8b949e] uppercase">Squad Changes</p>
              <p className="text-xs font-semibold text-[#c9d1d9]">25 → 27 players (+2 net)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Window Teaser */}
      <div className="bg-[#161b22] border border-[#30363d] p-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-[#8b949e] uppercase">Next Window Opens</p>
          <p className="text-sm font-bold text-[#c9d1d9]">January 1st</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
          <Clock className="h-3.5 w-3.5" />
          <span>92 days away</span>
        </div>
      </div>

      {/* Review Button */}
      <Button className="w-full h-10 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold">
        <FileText className="mr-2 h-4 w-4" />
        Review My Window
      </Button>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TransferDeadlineDay() {
  const gameState = useGameStore(state => state.gameState);
  const [windowStatus, setWindowStatus] = useState<WindowStatus>('open');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Simulate window status change
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setWindowStatus('closing');
    }, 45000);

    const timer2 = setTimeout(() => {
      setWindowStatus('closed');
    }, 90000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Computed values for the header
  const dealsToday = 12;
  const totalSpent = '€190M';
  const totalReceived = '€43M';

  if (!gameState) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Flame className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#c9d1d9] tracking-tight">Transfer Deadline Day</h1>
            <p className="text-[10px] text-[#8b949e]">The final hours of the transfer window</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-[10px] font-bold border ${
            windowStatus === 'open'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : windowStatus === 'closing'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
          }`}>
            {windowStatus === 'open' && '🟢'}{windowStatus === 'closing' && '⚠️'}{windowStatus === 'closed' && '🔒'}{' '}
            {windowStatus === 'open' ? 'Live' : windowStatus === 'closing' ? 'Closing' : 'Closed'}
          </Badge>
        </div>
      </motion.div>

      {/* Section 1: Deadline Countdown Header */}
      <DeadlineCountdownHeader
        dealsToday={dealsToday}
        totalSpent={totalSpent}
        totalReceived={totalReceived}
        windowStatus={windowStatus}
      />

      {/* Post-Deadline Summary (shown when window is closed) */}
      {windowStatus === 'closed' && <PostDeadlineSummary windowClosed />}

      {/* Section 2: Live Transfer Feed */}
      <div className="border-t border-[#21262d] pt-4">
        <LiveTransferFeed />
      </div>

      {/* Section 3: Your Transfer Activity */}
      <div className="border-t border-[#21262d] pt-4">
        <YourTransferActivity />
      </div>

      {/* Section 4: Deadline Day Drama */}
      <div className="border-t border-[#21262d] pt-4">
        <DeadlineDayDrama />
      </div>

      {/* Section 5: Budget Tracker */}
      <div className="border-t border-[#21262d] pt-4">
        <TransferBudgetTracker />
      </div>

      {/* Section 6: Club Transfer Summary */}
      <div className="border-t border-[#21262d] pt-4">
        <ClubTransferSummary />
      </div>

      {/* Section 7: Social Media Reaction */}
      <div className="border-t border-[#21262d] pt-4">
        <SocialMediaReaction />
      </div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}
