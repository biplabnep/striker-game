'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Handshake,
  ArrowRightLeft,
  FileText,
  MessageSquare,
  Crown,
  Shield,
  Heart,
  BarChart3,
  Target,
  Zap,
  ChevronRight,
  Briefcase,
  Landmark,
} from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

interface BoardMember {
  name: string;
  role: string;
  avatarSeed: number;
}

interface ContractOffer {
  weeklyWage: number;
  yearsLength: number;
  signingBonus: number;
  releaseClause: boolean;
  releaseClauseAmount: number;
}

interface NegotiationState {
  phase: 'idle' | 'requested' | 'counter_offer' | 'accepted' | 'rejected';
  playerOffer: ContractOffer;
  boardOffer: ContractOffer | null;
}

interface TransferRequest {
  position: string;
  maxBudget: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TransferActivity {
  playerName: string;
  type: 'in' | 'out';
  fee: number;
  fromTo: string;
  week: number;
}

interface BoardMeeting {
  id: string;
  date: string;
  topics: string[];
  decisions: string[];
  rating: 'positive' | 'neutral' | 'negative';
  chairmanQuote: string;
}

interface InvestmentProposal {
  id: string;
  name: string;
  description: string;
  cost: number;
  benefit: string;
  approvalChance: number;
  status: 'approved' | 'pending' | 'rejected';
  icon: React.ReactNode;
  color: string;
}

interface ObjectiveItem {
  title: string;
  target: string;
  current: number;
  max: number;
  status: 'on_track' | 'at_risk' | 'failing';
  consequence: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================================
// Deterministic Helpers
// ============================================================

function seededChoice<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function seededNum(min: number, max: number, seed: number): number {
  const range = max - min;
  return min + (Math.abs(seed * 2654435761) % 1000000) % (range + 1);
}

// ============================================================
// Constants
// ============================================================

const CHAIRMEN_NAMES: string[] = [
  'Sir Richard Ashton', 'Eduardo Valverde', 'Hans Müller',
  'Jean-Pierre Dubois', 'Kenji Tanaka', 'Ahmed Al-Rashid',
  'Patrick O\'Brien', 'Marcus Van Der Berg', 'Carlos Mendoza',
  'Dmitri Volkov',
];

const BOARD_MEMBER_NAMES: string[] = [
  'David Chen', 'Maria Torres', 'James Walker', 'Sofia Andersson',
  'Raj Patel', 'Emma Blackwell', 'Luca Romano', 'Nina Kowalski',
  'Oliver Grant', 'Yuki Tanaka',
];

const BOARD_MEMBER_ROLES: string[] = [
  'Finance Director', 'Sporting Director', 'Chief Operating Officer',
  'Commercial Director', 'Head of Scouting', 'Legal Counsel',
];

const MEETING_TOPICS_POOL: string[] = [
  'League performance review',
  'Transfer budget allocation',
  'Youth academy progress report',
  'Stadium expansion plans',
  'Sponsorship renewal negotiations',
  'Player contract renewals',
  'Fan engagement strategies',
  'European qualification outlook',
  'Training ground modernization',
  'Financial sustainability plan',
  'Wage bill analysis',
  'Squad depth assessment',
  'Media relations strategy',
  'Community outreach update',
  'Performance bonus distribution',
];

const MEETING_DECISIONS_POOL: string[] = [
  'Approved additional scouting budget of €2M',
  'Extended manager contract by 2 years',
  'Agreed to sell naming rights to training ground',
  'Rejected request for new stadium expansion',
  'Approved signing of 2 new first-team players',
  'Increased youth academy funding by 15%',
  'Delayed wage restructuring until next season',
  'Sanctioned pre-season tour to Asia',
  'Accepted shirt sponsorship deal worth €8M/year',
  'Ordered review of medical department staffing',
];

const CHAIRMAN_QUOTES_POOL: string[] = [
  'We need to see consistent results before committing more funds.',
  'The club\'s future is bright, but we must be financially responsible.',
  'I believe in this squad. Let\'s give them the support they need.',
  'Our fans deserve better. We must push for silverware this season.',
  'Financial stability is non-negotiable. Performance will follow investment.',
  'The board stands united behind the manager and the players.',
  'We\'re building something special here. Patience is key.',
  'Results on the pitch will dictate our spending power.',
];

const WISHLIST_POSITIONS: string[] = [
  'Central Defender', 'Left Winger', 'Striker', 'Defensive Midfielder',
  'Right Back', 'Goalkeeper', 'Central Midfielder', 'Attacking Midfielder',
];

const TRANSFER_ACTIVITY_POOL: TransferActivity[] = [
  { playerName: 'M. Rashford', type: 'out', fromTo: 'to Arsenal', fee: 45_000_000, week: 5 },
  { playerName: 'V. Osimhen', type: 'in', fromTo: 'from Napoli', fee: 75_000_000, week: 8 },
  { playerName: 'L. Hernandez', type: 'out', fromTo: 'to Bayern', fee: 30_000_000, week: 12 },
  { playerName: 'J. Palacios', type: 'in', fromTo: 'from Leverkusen', fee: 40_000_000, week: 3 },
  { playerName: 'A. Trossard', type: 'out', fromTo: 'to Newcastle', fee: 25_000_000, week: 1 },
];

// ============================================================
// Sub-Components
// ============================================================

function ProgressBar({
  value,
  max,
  color = '#34d399',
  height = 8,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-[#21262d] rounded-sm overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full rounded-sm"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

function StarRating({ level, maxLevel = 5, size = 12 }: { level: number; maxLevel?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLevel }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < level ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}
        />
      ))}
    </div>
  );
}

function BoardAvatar({ seed, size = 28 }: { seed: number; size?: number }) {
  const colors = ['#34d399', '#f59e0b', '#3b82f6', '#ef4444', '#a78bfa'];
  const color = colors[Math.abs(seed) % colors.length];
  const initial = BOARD_MEMBER_NAMES[Math.abs(seed) % BOARD_MEMBER_NAMES.length][0];

  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="14" fill={color} opacity={0.15} />
      <circle cx="14" cy="14" r="14" fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
      <text
        x="14"
        y="14"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="11"
        fontWeight="bold"
        fontFamily="system-ui"
      >
        {initial}
      </text>
    </svg>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d]">
        {icon}
        <h3 className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: 'on_track' | 'at_risk' | 'failing' }) {
  const config = {
    on_track: { label: 'On Track', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    at_risk: { label: 'At Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    failing: { label: 'Failing', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };
  const c = config[status];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function MeetingRatingBadge({ rating }: { rating: 'positive' | 'neutral' | 'negative' }) {
  const config = {
    positive: { label: 'Positive', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    neutral: { label: 'Neutral', color: '#8b949e', bg: 'rgba(139,148,158,0.1)' },
    negative: { label: 'Negative', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };
  const c = config[rating];
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

function formatWage(weeklyWage: number): string {
  return formatCurrency(weeklyWage * 52);
}

// ============================================================
// Main Component
// ============================================================

export default function BoardRoom() {
  const gameState = useGameStore(state => state.gameState);
  const [negotiation, setNegotiation] = useState<NegotiationState>({
    phase: 'idle',
    playerOffer: { weeklyWage: 0, yearsLength: 2, signingBonus: 0, releaseClause: false, releaseClauseAmount: 0 },
    boardOffer: null,
  });
  const [wageSlider, setWageSlider] = useState(0);
  const [contractYears, setContractYears] = useState(2);
  const [signingBonusSlider, setSigningBonusSlider] = useState(0);
  const [releaseClauseEnabled, setReleaseClauseEnabled] = useState(false);
  const [transferRequest, setTransferRequest] = useState<TransferRequest>({
    position: '',
    maxBudget: 0,
    priority: 'medium',
  });
  const [proposalAmounts, setProposalAmounts] = useState<Record<string, number>>({});
  const [submittedProposalIds, setSubmittedProposalIds] = useState<Set<string>>(new Set());

  const club = gameState?.currentClub;
  const player = gameState?.player;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const teamDynamics = gameState?.teamDynamics;

  // ---- Derived / Deterministic Data ----

  const chairman = useMemo(() => {
    const seed = (club?.id ?? 'default').charCodeAt(0) + (club?.id ?? 'default').length * 7;
    return seededChoice(CHAIRMEN_NAMES, seed);
  }, [club?.id]);

  const boardMembers: BoardMember[] = useMemo(() => {
    const baseSeed = (club?.id ?? 'default').charCodeAt(0);
    return Array.from({ length: 4 }, (_, i) => ({
      name: seededChoice(BOARD_MEMBER_NAMES, baseSeed + i * 13),
      role: seededChoice(BOARD_MEMBER_ROLES, baseSeed + i * 7 + 3),
      avatarSeed: baseSeed + i * 19,
    }));
  }, [club?.id]);

  const boardConfidence = useMemo((): number => {
    if (!player || !club) return 50;
    const formFactor = (player.form ?? 6) / 10;
    const repFactor = player.reputation / 100;
    const seasonGoals = player.seasonStats?.goals ?? 0;
    const seasonApps = player.seasonStats?.appearances ?? 1;
    const goalFactor = Math.min(seasonGoals / Math.max(seasonApps * 0.5, 1), 1);
    const moraleFactor = player.morale / 100;
    const raw = (formFactor * 25 + repFactor * 20 + goalFactor * 25 + moraleFactor * 20 + (club.finances ?? 50) / 100 * 10);
    return Math.round(Math.min(100, Math.max(5, raw)));
  }, [player, club]);

  const lastMeetingDate = useMemo(() => {
    const weeksAgo = currentWeek > 8 ? (currentWeek % 8) : 8;
    return `Season ${currentSeason}, Week ${Math.max(1, currentWeek - weeksAgo)}`;
  }, [currentSeason, currentWeek]);

  const nextMeetingIn = useMemo(() => {
    const nextWeek = 8 - (currentWeek % 8);
    return currentWeek % 8 === 0 ? 0 : nextWeek;
  }, [currentWeek]);

  // ---- Contract Data ----

  const currentContract = useMemo(() => {
    if (!player) return { weeklyWage: 50000, yearsRemaining: 3, signingBonus: 0, releaseClause: 50000000, performanceBonuses: {} };
    return player.contract;
  }, [player]);

  const currentWage = currentContract.weeklyWage;

  const boardCounterOffer = useMemo((): ContractOffer => {
    const performance = boardConfidence;
    const wageMultiplier = performance > 70 ? 1.3 : performance > 40 ? 1.1 : 0.95;
    return {
      weeklyWage: Math.round(currentWage * wageMultiplier),
      yearsLength: Math.min(4, contractYears - 1 > 0 ? contractYears - 1 : 2),
      signingBonus: Math.round(signingBonusSlider * 0.6),
      releaseClause: releaseClauseEnabled && performance > 60,
      releaseClauseAmount: Math.round(currentWage * 52 * 3 * (performance / 100)),
    };
  }, [currentWage, boardConfidence, contractYears, releaseClauseEnabled, signingBonusSlider]);

  // ---- Expectations Data ----

  const objectives: ObjectiveItem[] = useMemo(() => {
    const clubRep = club?.reputation ?? 50;
    const leaguePos = gameState?.leagueTable ? (() => {
      const sorted = [...gameState.leagueTable].sort((a, b) => b.points - a.points);
      const idx = sorted.findIndex(e => e.clubId === club?.id);
      return idx + 1;
    })() : 10;
    const targetPos = clubRep > 70 ? 4 : clubRep > 40 ? 8 : 14;
    const posStatus = leaguePos <= targetPos ? 'on_track' as const : leaguePos <= targetPos + 3 ? 'at_risk' as const : 'failing' as const;
    const stats = player?.seasonStats;

    return [
      {
        title: 'League Position',
        target: `Finish top ${targetPos === 4 ? '4' : targetPos === 8 ? 'half' : '17'}`,
        current: targetPos === 4 ? 4 - Math.min(leaguePos - 1, 4) + 1 : targetPos === 8 ? 10 - Math.min(leaguePos - 1, 10) + 1 : 20 - Math.min(leaguePos - 1, 20) + 1,
        max: targetPos === 4 ? 4 : targetPos === 8 ? 10 : 17,
        status: posStatus,
        consequence: posStatus === 'failing' ? 'Manager faces dismissal review' : posStatus === 'at_risk' ? 'Reduced transfer budget next window' : 'Enhanced budget + performance bonuses',
        icon: <TrendingUp className="h-3.5 w-3.5" style={{ color: posStatus === 'on_track' ? '#34d399' : posStatus === 'at_risk' ? '#f59e0b' : '#ef4444' }} />,
        color: posStatus === 'on_track' ? '#34d399' : posStatus === 'at_risk' ? '#f59e0b' : '#ef4444',
      },
      {
        title: 'Minimum Cup Round',
        target: targetPos <= 4 ? 'Semi-Final' : 'Quarter-Final',
        current: gameState?.cupEliminated ? 0 : Math.min(currentWeek / 12, 1) * 4,
        max: targetPos <= 4 ? 4 : 3,
        status: (currentWeek < 20 ? 'on_track' as const : (gameState?.cupEliminated ? 'failing' as const : 'on_track' as const)),
        consequence: 'Failure may affect board confidence rating',
        icon: <Crown className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />,
        color: '#f59e0b',
      },
      {
        title: 'Goal Contribution',
        target: `${targetPos <= 4 ? '15' : '10'} goals + assists`,
        current: (stats?.goals ?? 0) + (stats?.assists ?? 0),
        max: targetPos <= 4 ? 15 : 10,
        status: ((stats?.goals ?? 0) + (stats?.assists ?? 0)) / (targetPos <= 4 ? 15 : 10) > 0.6 ? 'on_track' as const : ((stats?.goals ?? 0) + (stats?.assists ?? 0)) / (targetPos <= 4 ? 15 : 10) > 0.3 ? 'at_risk' as const : 'failing' as const,
        consequence: 'Underperformance may trigger contract renegotiation',
        icon: <Target className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} />,
        color: '#3b82f6',
      },
      {
        title: 'Average Rating',
        target: `${targetPos <= 4 ? '7.2' : '6.8'}+ match rating`,
        current: (stats?.averageRating ?? 6.5) * 10,
        max: targetPos <= 4 ? 72 : 68,
        status: (stats?.averageRating ?? 6.5) >= (targetPos <= 4 ? 7.0 : 6.6) ? 'on_track' as const : (stats?.averageRating ?? 6.5) >= 6.2 ? 'at_risk' as const : 'failing' as const,
        consequence: 'Sustained low ratings affect starting position',
        icon: <Star className="h-3.5 w-3.5" style={{ color: '#a78bfa' }} />,
        color: '#a78bfa',
      },
    ];
  }, [club, player, gameState, currentWeek]);

  const overallSatisfaction = useMemo(() => {
    const onTrack = objectives.filter(o => o.status === 'on_track').length;
    return Math.round((onTrack / Math.max(objectives.length, 1)) * 100);
  }, [objectives]);

  // ---- Transfer Data ----

  const transferBudget = useMemo(() => club?.budget ?? 15_000_000, [club]);
  const totalBudget = useMemo(() => transferBudget * 1.8, [transferBudget]);

  const wishlist: string[] = useMemo(() => {
    const seed = (club?.id ?? '').charCodeAt(0) + currentSeason * 3;
    const positions = [...WISHLIST_POSITIONS];
    const result: string[] = [];
    for (let i = 0; i < 4; i++) {
      result.push(seededChoice(positions, seed + i * 7));
    }
    return [...new Set(result)];
  }, [club?.id, currentSeason]);

  const recentTransfers: TransferActivity[] = useMemo(() => {
    return TRANSFER_ACTIVITY_POOL.map((t, i) => ({
      ...t,
      week: Math.max(1, currentWeek - 3 - i),
    }));
  }, [currentWeek]);

  const interestedClubs: string[] = useMemo(() => {
    const pool = ['Juventus', 'AC Milan', 'Atletico Madrid', 'Tottenham', 'Dortmund', 'Roma', 'Lyon'];
    const seed = (player?.id ?? '').charCodeAt(0) + currentSeason;
    return Array.from({ length: 3 }, (_, i) => seededChoice(pool, seed + i * 11));
  }, [player?.id, currentSeason]);

  // ---- Board Meeting History ----

  const boardMeetings: BoardMeeting[] = useMemo(() => {
    const meetings: BoardMeeting[] = [];
    const numMeetings = Math.min(Math.ceil(currentSeason * 1.5 + currentWeek / 8), 6);

    for (let i = 0; i < numMeetings; i++) {
      const week = Math.max(1, (numMeetings - i) * 8);
      const seed = currentSeason * 100 + week * 3 + (club?.id ?? '').charCodeAt(0);
      const topicsCount = seededNum(3, 4, seed + 1);
      const topics: string[] = [];
      for (let t = 0; t < topicsCount; t++) {
        topics.push(seededChoice(MEETING_TOPICS_POOL, seed + 10 + t * 5));
      }
      const decisionsCount = seededNum(1, 3, seed + 50);
      const decisions: string[] = [];
      for (let d = 0; d < decisionsCount; d++) {
        decisions.push(seededChoice(MEETING_DECISIONS_POOL, seed + 70 + d * 9));
      }
      const ratingVal = seededNum(0, 100, seed + 200);
      const rating = ratingVal > 65 ? 'positive' as const : ratingVal > 30 ? 'neutral' as const : 'negative' as const;

      meetings.push({
        id: `meeting-${i}`,
        date: `Season ${currentSeason}, Week ${week}`,
        topics,
        decisions,
        rating,
        chairmanQuote: seededChoice(CHAIRMAN_QUOTES_POOL, seed + 300),
      });
    }

    return meetings.slice(0, 6);
  }, [currentSeason, currentWeek, club?.id]);

  // ---- Investment Proposals ----

  const proposals: InvestmentProposal[] = useMemo(() => {
    const seed = (club?.id ?? '').charCodeAt(0) + currentSeason;
    const rawProposals: Omit<InvestmentProposal, 'approvalChance' | 'status'>[] = [
      {
        id: 'training-upgrade',
        name: 'Training Ground Upgrade',
        description: 'Modernize training facilities with advanced sports science equipment, video analysis suite, and recovery center.',
        cost: 12_000_000,
        benefit: 'Training speed +15%, Injury recovery +20%',
        icon: <Zap className="h-5 w-5" style={{ color: '#34d399' }} />,
        color: '#34d399',
      },
      {
        id: 'youth-expansion',
        name: 'Youth Academy Expansion',
        description: 'Expand scouting network internationally, upgrade youth facilities, and recruit elite coaching staff.',
        cost: 8_000_000,
        benefit: 'Youth potential +6, Scouting range: International',
        icon: <Briefcase className="h-5 w-5" style={{ color: '#f59e0b' }} />,
        color: '#f59e0b',
      },
      {
        id: 'stadium-renovation',
        name: 'Stadium Renovation',
        description: 'Renovate stands, improve fan zones, add corporate hospitality boxes, and enhance matchday experience.',
        cost: 25_000_000,
        benefit: 'Match revenue +20%, Fan satisfaction +15%',
        icon: <Landmark className="h-5 w-5" style={{ color: '#3b82f6' }} />,
        color: '#3b82f6',
      },
      {
        id: 'data-analytics',
        name: 'Data Analytics Department',
        description: 'Establish a dedicated data analytics team for match analysis, player recruitment, and performance optimization.',
        cost: 4_000_000,
        benefit: 'Scouting accuracy +25%, Tactical insights +20%',
        icon: <BarChart3 className="h-5 w-5" style={{ color: '#a78bfa' }} />,
        color: '#a78bfa',
      },
    ];

    return rawProposals.map((p, i) => {
      const pSeed = seed + i * 17;
      const chance = seededNum(30, 85, pSeed);
      const isSubmitted = submittedProposalIds.has(p.id);
      const status = isSubmitted
        ? (chance > 50 ? 'approved' as const : 'rejected' as const)
        : 'pending' as const;
      return { ...p, approvalChance: chance, status };
    });
  }, [club?.id, currentSeason, submittedProposalIds]);

  // ---- Player Power ----

  const playerInfluence = useMemo((): number => {
    if (!player) return 1;
    const base = Math.min(5, Math.max(1, Math.floor(player.reputation / 20)));
    const seasonsAtClub = currentSeason;
    const seasonBonus = Math.min(1, Math.floor(seasonsAtClub / 3));
    return Math.min(5, base + seasonBonus);
  }, [player, currentSeason]);

  const fanSupport = useMemo((): number => {
    const repFactor = (player?.reputation ?? 30) / 100 * 60;
    const formFactor = ((player?.form ?? 6) / 10) * 25;
    const moraleFactor = ((player?.morale ?? 50) / 100) * 15;
    return Math.round(Math.min(100, repFactor + formFactor + moraleFactor));
  }, [player]);

  const mediaInfluence = useMemo((): number => {
    const repBase = (player?.reputation ?? 30) / 100 * 50;
    const traitBonus = (player?.traits ?? []).some(t => t === 'media_darling' || t === 'fan_favorite') ? 20 : 0;
    return Math.round(Math.min(100, repBase + traitBonus + 15));
  }, [player]);

  const squadInfluence = useMemo((): number => {
    return teamDynamics?.playerInfluence ?? 30;
  }, [teamDynamics]);

  // ---- Handlers ----

  const handleRequestContract = () => {
    setNegotiation({
      phase: 'requested',
      playerOffer: {
        weeklyWage: Math.round(currentWage * (1 + wageSlider / 100)),
        yearsLength: contractYears,
        signingBonus: signingBonusSlider * 1_000_000,
        releaseClause: releaseClauseEnabled,
        releaseClauseAmount: releaseClauseEnabled ? Math.round(currentWage * 52 * contractYears * 2) : 0,
      },
      boardOffer: null,
    });
  };

  const handleGetCounterOffer = () => {
    setNegotiation(prev => ({
      ...prev,
      phase: 'counter_offer',
      boardOffer: boardCounterOffer,
    }));
  };

  const handleAcceptOffer = () => {
    setNegotiation(prev => ({ ...prev, phase: 'accepted' }));
  };

  const handleRejectOffer = () => {
    setNegotiation(prev => ({ ...prev, phase: 'rejected' }));
  };

  const handleResetNegotiation = () => {
    setNegotiation({
      phase: 'idle',
      playerOffer: { weeklyWage: 0, yearsLength: 2, signingBonus: 0, releaseClause: false, releaseClauseAmount: 0 },
      boardOffer: null,
    });
    setWageSlider(0);
    setContractYears(2);
    setSigningBonusSlider(0);
    setReleaseClauseEnabled(false);
  };

  const handleSubmitTransferRequest = () => {
    setTransferRequest({ position: '', maxBudget: 0, priority: 'medium' });
  };

  const handleSubmitProposal = (proposalId: string) => {
    setSubmittedProposalIds(prev => new Set(prev).add(proposalId));
  };

  if (!gameState || !club || !player) return null;

  const leaguePosition = (() => {
    const sorted = [...gameState.leagueTable].sort((a, b) => b.points - a.points);
    return sorted.findIndex(e => e.clubId === club.id) + 1;
  })();

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* ---- 1. Board Room Header ---- */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center border border-[#30363d]">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[#c9d1d9]">Board Room</h1>
              <p className="text-xs text-[#8b949e]">Manage your relationship with the board</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] shrink-0">
              {club.logo} {club.shortName}
            </Badge>
          </div>

          {/* Club Info Row */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
            <span className="text-xl">{club.logo}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#c9d1d9] truncate">{club.name}</p>
              <p className="text-[10px] text-[#8b949e]">Chairman: {chairman}</p>
            </div>
          </div>

          {/* Board Members Row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8b949e] shrink-0">Board:</span>
            <div className="flex items-center gap-1.5">
              {boardMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center" title={`${member.name} — ${member.role}`}>
                  <BoardAvatar seed={member.avatarSeed} />
                </div>
              ))}
            </div>
          </div>

          {/* Board Confidence Meter */}
          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Board Confidence</span>
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: boardConfidence > 70 ? '#34d399' : boardConfidence > 40 ? '#f59e0b' : '#ef4444' }}
              >
                {boardConfidence}%
              </span>
            </div>
            <ProgressBar
              value={boardConfidence}
              max={100}
              color={boardConfidence > 70 ? '#34d399' : boardConfidence > 40 ? '#f59e0b' : '#ef4444'}
              height={6}
            />
          </div>

          {/* Meeting Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 text-[#8b949e]" />
                <span className="text-[10px] text-[#8b949e]">Last Meeting</span>
              </div>
              <p className="text-xs font-medium text-[#c9d1d9]">{lastMeetingDate}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#21262d]">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 text-[#f59e0b]" />
                <span className="text-[10px] text-[#8b949e]">Next Meeting</span>
              </div>
              <p className="text-xs font-medium text-[#c9d1d9]">
                {nextMeetingIn === 0 ? 'This week' : `In ${nextMeetingIn} weeks`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tabbed Content ---- */}
      <Tabs defaultValue="contract" className="w-full">
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg h-auto p-1">
          <TabsTrigger value="contract" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Contract
          </TabsTrigger>
          <TabsTrigger value="expectations" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Objectives
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Budget
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            History
          </TabsTrigger>
          <TabsTrigger value="investment" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Invest
          </TabsTrigger>
          <TabsTrigger value="power" className="flex-1 text-[10px] py-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            Influence
          </TabsTrigger>
        </TabsList>

        {/* ---- 2. Contract Negotiation Panel ---- */}
        <TabsContent value="contract" className="mt-3 space-y-3">
          {/* Current Contract Display */}
          <SectionCard title="Current Contract" icon={<FileText className="h-4 w-4 text-[#8b949e]" />}>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Weekly Wage</span>
                <p className="text-sm font-bold text-[#c9d1d9]">{formatCurrency(currentWage)}/wk</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Years Remaining</span>
                <p className="text-sm font-bold text-[#c9d1d9]">{currentContract.yearsRemaining} years</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Signing Bonus</span>
                <p className="text-sm font-bold text-[#c9d1d9]">{formatCurrency(currentContract.signingBonus ?? 0)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Release Clause</span>
                <p className="text-sm font-bold text-[#c9d1d9]">{currentContract.releaseClause ? formatCurrency(currentContract.releaseClause) : 'None'}</p>
              </div>
            </div>

            {currentContract.performanceBonuses && (
              <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Performance Bonuses</span>
                <div className="flex flex-wrap gap-3 mt-1">
                  {currentContract.performanceBonuses.goalsBonus ? (
                    <span className="text-[10px] text-emerald-400">{formatCurrency(currentContract.performanceBonuses.goalsBonus)}/goal</span>
                  ) : null}
                  {currentContract.performanceBonuses.assistBonus ? (
                    <span className="text-[10px] text-blue-400">{formatCurrency(currentContract.performanceBonuses.assistBonus)}/assist</span>
                  ) : null}
                  {currentContract.performanceBonuses.cleanSheetBonus ? (
                    <span className="text-[10px] text-amber-400">{formatCurrency(currentContract.performanceBonuses.cleanSheetBonus)}/CS</span>
                  ) : null}
                  {!currentContract.performanceBonuses.goalsBonus && !currentContract.performanceBonuses.assistBonus && !currentContract.performanceBonuses.cleanSheetBonus && (
                    <span className="text-[10px] text-[#8b949e]">No performance bonuses set</span>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Negotiation Panel */}
          <SectionCard title="Contract Negotiation" icon={<Handshake className="h-4 w-4 text-emerald-400" />}>
            {negotiation.phase === 'idle' && (
              <div className="space-y-3">
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Submit your contract demands to the board. The board&apos;s response will depend on your performance and club finances.
                </p>

                {/* Wage Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Wage Increase</span>
                    <span className="text-xs font-bold text-[#c9d1d9]">+{wageSlider}% ({formatCurrency(Math.round(currentWage * (1 + wageSlider / 100)))}/wk)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={wageSlider}
                    onChange={(e) => setWageSlider(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#484f58] mt-0.5">
                    <span>Current</span>
                    <span>2x Current</span>
                    <span>3x Current</span>
                  </div>
                </div>

                {/* Contract Length */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Contract Length</span>
                    <span className="text-xs font-bold text-[#c9d1d9]">{contractYears} years</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(y => (
                      <button
                        key={y}
                        onClick={() => setContractYears(y)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          contractYears === y
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#21262d] text-[#8b949e] border border-transparent hover:border-[#30363d]'
                        }`}
                      >
                        {y}y
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signing Bonus */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Signing Bonus</span>
                    <span className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(signingBonusSlider * 1_000_000)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={signingBonusSlider}
                    onChange={(e) => setSigningBonusSlider(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#484f58] mt-0.5">
                    <span>€0</span>
                    <span>€10M</span>
                    <span>€20M</span>
                  </div>
                </div>

                {/* Release Clause Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                  <div>
                    <span className="text-xs text-[#c9d1d9]">Release Clause</span>
                    <p className="text-[10px] text-[#8b949e]">Include a buy-out clause in your contract</p>
                  </div>
                  <button
                    onClick={() => setReleaseClauseEnabled(!releaseClauseEnabled)}
                    className={`w-10 h-5 rounded-md transition-all relative ${
                      releaseClauseEnabled ? 'bg-emerald-500/30 border border-emerald-500/40' : 'bg-[#21262d] border border-[#30363d]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-sm transition-all ${
                        releaseClauseEnabled
                          ? 'left-5 bg-emerald-400'
                          : 'left-0.5 bg-[#8b949e]'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleRequestContract}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  Submit Contract Request
                </button>
              </div>
            )}

            {negotiation.phase === 'requested' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Request Under Review</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e]">
                    The board is reviewing your demands. Click below to receive their counter-offer.
                  </p>
                </div>
                <button
                  onClick={handleGetCounterOffer}
                  className="w-full py-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold border border-[#30363d] transition-all"
                >
                  Receive Board Counter-Offer
                </button>
              </div>
            )}

            {negotiation.phase === 'counter_offer' && negotiation.boardOffer && (
              <div className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">Counter-Offer Received</Badge>
                </div>

                {/* Comparison Table */}
                <div className="overflow-hidden rounded-lg border border-[#30363d]">
                  <div className="grid grid-cols-3 text-[9px] font-semibold uppercase tracking-wider bg-[#21262d]">
                    <div className="px-3 py-2 text-[#8b949e]">Term</div>
                    <div className="px-3 py-2 text-[#c9d1d9]">Your Request</div>
                    <div className="px-3 py-2 text-emerald-400">Board Offer</div>
                  </div>
                  {[
                    { label: 'Wage', yours: formatCurrency(negotiation.playerOffer.weeklyWage) + '/wk', theirs: formatCurrency(negotiation.boardOffer.weeklyWage) + '/wk' },
                    { label: 'Length', yours: `${negotiation.playerOffer.yearsLength} years`, theirs: `${negotiation.boardOffer.yearsLength} years` },
                    { label: 'Bonus', yours: formatCurrency(negotiation.playerOffer.signingBonus), theirs: formatCurrency(negotiation.boardOffer.signingBonus) },
                    { label: 'Release Clause', yours: negotiation.playerOffer.releaseClause ? 'Yes' : 'No', theirs: negotiation.boardOffer.releaseClause ? 'Yes' : 'No' },
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-3 text-xs border-t border-[#30363d]/50">
                      <div className="px-3 py-2 text-[#8b949e]">{row.label}</div>
                      <div className="px-3 py-2 text-[#c9d1d9]">{row.yours}</div>
                      <div className="px-3 py-2 text-emerald-400 font-medium">{row.theirs}</div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-[#8b949e] italic">
                  &ldquo;{seededChoice(CHAIRMAN_QUOTES_POOL, boardConfidence + currentWeek)}&rdquo; — {chairman}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAcceptOffer}
                    className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                  >
                    <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={handleRejectOffer}
                    className="py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-500/20 transition-all"
                  >
                    <XCircle className="h-3.5 w-3.5 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {negotiation.phase === 'accepted' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Contract Accepted!</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e]">
                    Congratulations! You&apos;ve agreed to new terms with {club.name}. The contract will be finalized shortly.
                  </p>
                </div>
                <button
                  onClick={handleResetNegotiation}
                  className="w-full py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-xs font-medium border border-[#30363d] transition-all"
                >
                  Start New Negotiation
                </button>
              </div>
            )}

            {negotiation.phase === 'rejected' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-semibold text-red-400">Negotiation Failed</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e]">
                    The board could not agree to your terms. You can try again with revised demands.
                  </p>
                </div>
                <button
                  onClick={handleResetNegotiation}
                  className="w-full py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-xs font-medium border border-[#30363d] transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ---- 3. Club Expectations Dashboard ---- */}
        <TabsContent value="expectations" className="mt-3 space-y-3">
          {/* Overall Satisfaction */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#8b949e]" />
                <span className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider">Overall Board Satisfaction</span>
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: overallSatisfaction > 70 ? '#34d399' : overallSatisfaction > 40 ? '#f59e0b' : '#ef4444' }}
              >
                {overallSatisfaction}%
              </span>
            </div>
            <ProgressBar
              value={overallSatisfaction}
              max={100}
              color={overallSatisfaction > 70 ? '#34d399' : overallSatisfaction > 40 ? '#f59e0b' : '#ef4444'}
              height={10}
            />
            <div className="flex items-center justify-between mt-1.5 text-[9px] text-[#484f58]">
              <span>{objectives.filter(o => o.status === 'on_track').length}/{objectives.length} objectives on track</span>
              <span>Season {currentSeason}</span>
            </div>
          </div>

          {/* League Position Indicator */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[#8b949e]" />
              <span className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider">League Position</span>
            </div>
            <div className="relative">
              <svg viewBox="0 0 280 24" className="w-full">
                <rect x="0" y="0" width="280" height="24" rx="4" fill="#21262d" />
                {[1, 5, 10, 15, 20].map(pos => {
                  const x = ((pos - 1) / 19) * 260 + 10;
                  return (
                    <g key={pos}>
                      <line x1={x} y1="0" x2={x} y2="24" stroke="#0d1117" strokeWidth="1" />
                      <text x={x} y="18" textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="system-ui">{pos}</text>
                    </g>
                  );
                })}
                {/* Target Zone */}
                {(() => {
                  const targetPos = (club?.reputation ?? 50) > 70 ? 4 : (club?.reputation ?? 50) > 40 ? 8 : 14;
                  const targetX = ((targetPos - 1) / 19) * 260 + 10;
                  const width = Math.max(20, (targetPos / 19) * 260);
                  return (
                    <rect
                      x={10}
                      y="0"
                      width={width}
                      height="24"
                      rx="4"
                      fill="#34d399"
                      opacity={0.1}
                    />
                  );
                })()}
                {/* Current Position Marker */}
                {(() => {
                  const markerX = ((Math.min(leaguePosition, 20) - 1) / 19) * 260 + 10;
                  return (
                    <circle cx={markerX} cy="6" r="4" fill={leaguePosition <= 8 ? '#34d399' : leaguePosition <= 14 ? '#f59e0b' : '#ef4444'} />
                  );
                })()}
              </svg>
              <div className="flex items-center justify-between text-[9px] text-[#8b949e] mt-1">
                <span>1st</span>
                <span className="font-semibold" style={{ color: leaguePosition <= 8 ? '#34d399' : leaguePosition <= 14 ? '#f59e0b' : '#ef4444' }}>
                  Current: {leaguePosition}th
                </span>
                <span>20th</span>
              </div>
            </div>
          </div>

          {/* Individual Objectives */}
          {objectives.map((obj) => (
            <div key={obj.title} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {obj.icon}
                  <span className="text-xs font-semibold text-[#c9d1d9]">{obj.title}</span>
                </div>
                <StatusBadge status={obj.status} />
              </div>
              <p className="text-[10px] text-[#8b949e]">Target: {obj.target}</p>
              <ProgressBar value={obj.current} max={obj.max} color={obj.color} height={6} />
              <p className="text-[9px] text-[#484f58] italic">
                {obj.consequence}
              </p>
            </div>
          ))}
        </TabsContent>

        {/* ---- 4. Transfer Budget & Requests ---- */}
        <TabsContent value="transfers" className="mt-3 space-y-3">
          {/* Budget Display */}
          <SectionCard title="Transfer Budget" icon={<ArrowRightLeft className="h-4 w-4 text-[#8b949e]" />}>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Available Budget</span>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(transferBudget)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                <span className="text-[10px] text-[#8b949e]">Total Allocated</span>
                <p className="text-lg font-bold text-[#c9d1d9]">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
            <ProgressBar value={transferBudget} max={totalBudget} color="#34d399" height={8} />
            <p className="text-[10px] text-[#8b949e] text-right">{Math.round((transferBudget / totalBudget) * 100)}% remaining</p>
          </SectionCard>

          {/* Request Signing Form */}
          <SectionCard title="Request New Signing" icon={<Users className="h-4 w-4 text-amber-400" />}>
            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wider block mb-1">Position Needed</span>
                <select
                  value={transferRequest.position}
                  onChange={(e) => setTransferRequest(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select position...</option>
                  {WISHLIST_POSITIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Max Budget</span>
                  <span className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(transferRequest.maxBudget)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={transferBudget}
                  step={500_000}
                  value={transferRequest.maxBudget}
                  onChange={(e) => setTransferRequest(prev => ({ ...prev, maxBudget: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wider block mb-1">Priority Level</span>
                <div className="grid grid-cols-4 gap-1">
                  {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setTransferRequest(prev => ({ ...prev, priority: level }))}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                        transferRequest.priority === level
                          ? level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : level === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : level === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                          : 'bg-[#21262d] text-[#8b949e] border border-transparent hover:border-[#30363d]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmitTransferRequest}
                disabled={!transferRequest.position}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  transferRequest.position
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                }`}
              >
                Submit Request to Board
              </button>
            </div>
          </SectionCard>

          {/* Transfer Wishlist */}
          <SectionCard title="Transfer Wishlist" icon={<Target className="h-4 w-4 text-blue-400" />}>
            <div className="space-y-1.5">
              {wishlist.map((pos, i) => {
                const priorities = ['low', 'medium', 'high', 'critical'] as const;
                const pColors = { low: '#8b949e', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
                const priority = priorities[i % priorities.length];
                return (
                  <div key={pos} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-[#30363d]" />
                      <span className="text-xs text-[#c9d1d9]">{pos}</span>
                    </div>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ color: pColors[priority], backgroundColor: `${pColors[priority]}15` }}
                    >
                      {priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Recent Transfer Activity */}
          <SectionCard title="Recent Transfer Activity" icon={<Clock className="h-4 w-4 text-[#8b949e]" />}>
            <div className="space-y-1.5">
              {recentTransfers.map((t, i) => (
                <div key={`${t.playerName}-${i}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    t.type === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {t.type === 'in' ? 'IN' : 'OUT'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#c9d1d9]">{t.playerName}</p>
                    <p className="text-[10px] text-[#8b949e]">{t.fromTo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(t.fee)}</p>
                    <p className="text-[9px] text-[#484f58]">Wk {t.week}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Sell Player / Market Value */}
          <SectionCard title="Player Market Value" icon={<Briefcase className="h-4 w-4 text-amber-400" />}>
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#c9d1d9]">{player.name}</span>
                <span className="text-lg font-bold text-emerald-400">{formatCurrency(player.marketValue)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Interested Clubs</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {interestedClubs.map(clubName => (
                    <Badge key={clubName} variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                      {clubName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ---- 5. Board Meeting History ---- */}
        <TabsContent value="meetings" className="mt-3 space-y-3">
          {boardMeetings.map((meeting, idx) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
            >
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8b949e]" />
                    <span className="text-xs font-semibold text-[#c9d1d9]">{meeting.date}</span>
                  </div>
                  <MeetingRatingBadge rating={meeting.rating} />
                </div>

                {/* Topics */}
                <div>
                  <span className="text-[10px] text-[#8b949e] uppercase tracking-wider block mb-1">Topics Discussed</span>
                  <ul className="space-y-0.5">
                    {meeting.topics.map((topic, ti) => (
                      <li key={ti} className="flex items-start gap-1.5 text-[10px] text-[#c9d1d9]">
                        <ChevronRight className="h-3 w-3 text-[#30363d] mt-0.5 shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Decisions */}
                {meeting.decisions.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider block mb-1">Key Decisions</span>
                    <ul className="space-y-0.5">
                      {meeting.decisions.map((decision, di) => (
                        <li key={di} className="flex items-start gap-1.5 text-[10px] text-[#c9d1d9]">
                          {decision.startsWith('Approved') || decision.startsWith('Extended') || decision.startsWith('Agreed') || decision.startsWith('Increased') || decision.startsWith('Sanctioned') || decision.startsWith('Accepted') ? (
                            <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                          )}
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chairman Quote */}
                <div className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MessageSquare className="h-3 w-3 text-amber-400" />
                    <span className="text-[9px] text-[#8b949e] font-medium">{chairman}</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] italic leading-relaxed">
                    &ldquo;{meeting.chairmanQuote}&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* ---- 6. Facility Investment Proposals ---- */}
        <TabsContent value="investment" className="mt-3 space-y-3">
          {proposals.map((proposal) => {
            const submitted = submittedProposalIds.has(proposal.id);
            const currentAmount = proposalAmounts[proposal.id] ?? 0;
            const isApproved = submitted && proposal.approvalChance > 50;
            const isRejected = submitted && proposal.approvalChance <= 50;

            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center border"
                        style={{ backgroundColor: `${proposal.color}15`, borderColor: `${proposal.color}30` }}
                      >
                        {proposal.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#c9d1d9]">{proposal.name}</h4>
                        <p className="text-[10px] text-[#8b949e]">Cost: {formatCurrency(proposal.cost)}</p>
                      </div>
                    </div>
                    <Badge
                      className={`text-[9px] font-semibold ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isRejected
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                    </Badge>
                  </div>

                  <p className="text-[10px] text-[#8b949e] leading-relaxed">{proposal.description}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                      <span className="text-[9px] text-[#8b949e] block">Expected Benefit</span>
                      <span className="text-[10px] text-emerald-400 font-medium">{proposal.benefit}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                      <span className="text-[9px] text-[#8b949e] block">Board Approval Chance</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold" style={{ color: proposal.approvalChance > 60 ? '#34d399' : proposal.approvalChance > 35 ? '#f59e0b' : '#ef4444' }}>
                          {proposal.approvalChance}%
                        </span>
                        <ProgressBar value={proposal.approvalChance} max={100} color={proposal.approvalChance > 60 ? '#34d399' : proposal.approvalChance > 35 ? '#f59e0b' : '#ef4444'} height={4} />
                      </div>
                    </div>
                  </div>

                  {!submitted && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Investment Amount</span>
                        <span className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(currentAmount)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={proposal.cost}
                        step={500_000}
                        value={currentAmount}
                        onChange={(e) => setProposalAmounts(prev => ({ ...prev, [proposal.id]: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <button
                        onClick={() => handleSubmitProposal(proposal.id)}
                        disabled={currentAmount === 0}
                        className={`w-full mt-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                          currentAmount > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                        }`}
                      >
                        Submit Proposal
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </TabsContent>

        {/* ---- 7. Player Power & Influence ---- */}
        <TabsContent value="power" className="mt-3 space-y-3">
          {/* Player Influence Rating */}
          <SectionCard title="Player Influence" icon={<Crown className="h-4 w-4 text-amber-400" />}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-[#c9d1d9]">{playerInfluence}</span>
                <StarRating level={playerInfluence} maxLevel={5} size={14} />
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  {playerInfluence >= 4
                    ? 'You are a key figure at the club. Your opinion carries significant weight in board decisions.'
                    : playerInfluence >= 3
                    ? 'You have established yourself as an important player. The board values your input.'
                    : playerInfluence >= 2
                    ? 'You are a developing talent. Your influence is growing but still limited.'
                    : 'You are still establishing yourself at the club. Focus on performances to build influence.'}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Influence Metrics */}
          <SectionCard title="Influence Breakdown" icon={<BarChart3 className="h-4 w-4 text-[#8b949e]" />}>
            <div className="space-y-3">
              {/* Fan Support */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-[10px] text-[#8b949e]">Fan Support</span>
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9]">{fanSupport}%</span>
                </div>
                <ProgressBar value={fanSupport} max={100} color="#ef4444" height={6} />
              </div>

              {/* Media Influence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] text-[#8b949e]">Media Influence</span>
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9]">{mediaInfluence}%</span>
                </div>
                <ProgressBar value={mediaInfluence} max={100} color="#3b82f6" height={6} />
              </div>

              {/* Squad Influence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">Squad Influence</span>
                  </div>
                  <span className="text-xs font-bold text-[#c9d1d9]">{squadInfluence}%</span>
                </div>
                <ProgressBar value={squadInfluence} max={100} color="#34d399" height={6} />
              </div>

              <p className="text-[9px] text-[#484f58] italic">
                Higher squad influence gives you more say in transfer targets and tactical preferences.
              </p>
            </div>
          </SectionCard>

          {/* Power Actions */}
          <SectionCard title="Power Actions" icon={<Zap className="h-4 w-4 text-amber-400" />}>
            <div className="space-y-2">
              <button
                className="w-full p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-[#c9d1d9] block">Request Captaincy</span>
                    <span className="text-[9px] text-[#8b949e]">
                      {playerInfluence >= 3 ? 'You have enough influence to make this request' : 'Build more influence first (need 3+)'}
                    </span>
                  </div>
                </div>
                <Badge className={`text-[9px] ${playerInfluence >= 3 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[#21262d] text-[#484f58] border-[#30363d]'}`}>
                  {playerInfluence >= 3 ? 'Available' : 'Locked'}
                </Badge>
              </button>

              <button
                className="w-full p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between hover:border-red-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-[#c9d1d9] block">Demand Transfer</span>
                    <span className="text-[9px] text-[#8b949e]">
                      Express your desire to leave the club. This will upset the board.
                    </span>
                  </div>
                </div>
                <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                  High Risk
                </Badge>
              </button>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-400 leading-relaxed">
                  <span className="font-semibold">Warning:</span> Power actions have lasting consequences on your relationship with the board and team.
                  Use them wisely.
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
