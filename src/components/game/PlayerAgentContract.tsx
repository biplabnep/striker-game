'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Briefcase,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Shield,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Target,
  Award,
  Trophy,
  Calendar,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Users,
  Building2,
  Zap,
  MessageSquare,
  Scale,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Eye,
  Gavel,
  Package,
  Tag,
  CircleDot,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Constants & Static Data
// ============================================================

const AGENT_PROFILE = {
  name: 'Marcus Webb',
  agency: 'Webb Sports Management',
  experienceYears: 15,
  clientsManaged: 47,
  successRate: 89,
  stats: {
    negotiation: 92,
    marketKnowledge: 88,
    playerRelations: 95,
    legalExpertise: 82,
  },
  trustLevel: 5,
  fee: {
    transferFee: 5,
    signingBonus: 10,
  },
  phone: '+44 7700 448 210',
  email: 'm.webb@webbsports.com',
};

const ADVICE_MESSAGES = [
  {
    id: 1,
    message: 'The club is willing to increase your wage by 15%',
    timestamp: '2 hours ago',
    category: 'Contract' as const,
    read: false,
  },
  {
    id: 2,
    message: "I've received interest from 3 clubs regarding your availability",
    timestamp: '1 day ago',
    category: 'Transfer' as const,
    read: false,
  },
  {
    id: 3,
    message: 'Your release clause is below market value — consider renegotiating',
    timestamp: '2 days ago',
    category: 'Contract' as const,
    read: true,
  },
  {
    id: 4,
    message: 'The new sponsor deal could increase your image rights revenue',
    timestamp: '3 days ago',
    category: 'Sponsor' as const,
    read: true,
  },
  {
    id: 5,
    message: 'You have 18 months remaining — ideal time for extension talks',
    timestamp: '5 days ago',
    category: 'Legal' as const,
    read: true,
  },
  {
    id: 6,
    message: 'I recommend including a performance-based wage increase clause',
    timestamp: '1 week ago',
    category: 'Contract' as const,
    read: true,
  },
];

const CONTRACT_HISTORY = [
  {
    id: 1,
    type: 'Youth Contract',
    age: 16,
    club: 'Academy',
    wage: 500,
    startDate: '2018',
    endDate: '2020',
    agent: 'Youth Liaison Office',
    improvement: '—',
  },
  {
    id: 2,
    type: 'First Professional',
    age: 18,
    club: 'FC Northbrook',
    wage: 5000,
    startDate: '2020',
    endDate: '2022',
    agent: 'Junior Sports Agency',
    improvement: '+900%',
  },
  {
    id: 3,
    type: 'Improved Deal',
    age: 20,
    club: 'FC Northbrook',
    wage: 25000,
    startDate: '2022',
    endDate: '2024',
    agent: 'Marcus Webb',
    improvement: '+400%',
  },
  {
    id: 4,
    type: 'Current',
    age: 22,
    club: 'Striker City FC',
    wage: 80000,
    startDate: '2024',
    endDate: '2027',
    agent: 'Marcus Webb',
    improvement: '+220%',
  },
];

const ENDORSEMENTS = [
  {
    id: 1,
    brand: 'Nike',
    type: 'Boot Sponsor',
    annualValue: 200000,
    yearsRemaining: 3,
    totalYears: 5,
    hasPerformanceClause: true,
  },
  {
    id: 2,
    brand: 'Tag Heuer',
    type: 'Watch Brand',
    annualValue: 150000,
    yearsRemaining: 2,
    totalYears: 4,
    hasPerformanceClause: false,
  },
  {
    id: 3,
    brand: 'Red Bull',
    type: 'Energy Drink',
    annualValue: 75000,
    yearsRemaining: 1,
    totalYears: 3,
    hasPerformanceClause: true,
  },
  {
    id: 4,
    brand: 'EA Sports',
    type: 'Gaming Brand',
    annualValue: 100000,
    yearsRemaining: 2,
    totalYears: 3,
    hasPerformanceClause: true,
  },
];

const PENDING_DEALS = [
  {
    id: 101,
    brand: 'Adidas',
    type: 'Apparel',
    annualValue: 250000,
    years: 4,
    performanceClause: true,
  },
  {
    id: 102,
    brand: 'Rolex',
    type: 'Luxury Watches',
    annualValue: 180000,
    years: 3,
    performanceClause: false,
  },
];

const MARKET_COMPARISON = [
  { name: 'Victor Reyes', club: 'Madrid United', wage: 120000, contractLength: 4, releaseClause: 85 },
  { name: 'James Okoro', club: 'London Rangers', wage: 110000, contractLength: 3, releaseClause: 75 },
  { name: 'Liam Harper', club: 'Striker City FC', wage: 80000, contractLength: 3, releaseClause: 60, isPlayer: true },
  { name: 'Tomas Silva', club: 'Paris Olympique', wage: 95000, contractLength: 3, releaseClause: 70 },
  { name: 'Andre Müller', club: 'Bayern FC', wage: 105000, contractLength: 5, releaseClause: 80 },
];

const LEGAL_CLAUSES = [
  {
    name: 'Release Clause',
    explanation:
      'A pre-agreed fee that allows you to leave the club if another team pays the specified amount. This gives you freedom but the club can set it high to deter interest.',
    inContract: true,
  },
  {
    name: 'Loyalty Bonus',
    explanation:
      'An additional payment made to you if you remain at the club for a specified duration. Typically paid annually after reaching a tenure milestone.',
    inContract: true,
  },
  {
    name: 'Performance Bonus',
    explanation:
      'Extra payments triggered by individual achievements such as scoring goals, providing assists, or maintaining a high match rating threshold.',
    inContract: true,
  },
  {
    name: 'Image Rights',
    explanation:
      'A percentage of revenue generated from the commercial use of your name, likeness, or personal brand in advertising, merchandise, and media.',
    inContract: false,
  },
  {
    name: 'Buyout Clause',
    explanation:
      'Similar to a release clause but applies specifically in the context of a unilateral termination initiated by the player, common in certain jurisdictions.',
    inContract: false,
  },
];

// ============================================================
// Helper Functions
// ============================================================

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatWage(value: number): string {
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K/wk`;
  return `€${value}/wk`;
}

function getCategoryStyle(category: string): string {
  switch (category) {
    case 'Contract':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'Transfer':
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    case 'Sponsor':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Legal':
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    default:
      return 'text-[#8b949e] border-[#30363d] bg-[#21262d]';
  }
}

// ============================================================
// Reusable Sub-Components
// ============================================================

function StatBar({
  label,
  value,
  max = 100,
  color = 'bg-emerald-500',
  delay = 0,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  delay?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#8b949e]">{label}</span>
        <span className="text-[#c9d1d9] font-medium">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay }}
          className={`h-full rounded-lg ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#c9d1d9]">
        <Icon className="h-4 w-4 text-emerald-400" />
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Section 1 — Agent Profile Card
// ============================================================

function AgentProfileCard() {
  const agent = AGENT_PROFILE;
  return (
    <SectionCard title="Agent Profile" icon={User}>
      <div className="flex items-start gap-3">
        {/* SVG Avatar — Suit figure */}
        <div className="w-14 h-14 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 48 48"
            className="h-10 w-10"
            fill="none"
          >
            {/* Head */}
            <circle cx="24" cy="12" r="6" fill="#8b949e" />
            {/* Suit body */}
            <path
              d="M16 20 L24 18 L32 20 L34 38 L14 38 Z"
              fill="#30363d"
              stroke="#8b949e"
              strokeWidth="1.2"
            />
            {/* Tie */}
            <path d="M24 20 L22 28 L24 30 L26 28 L24 20Z" fill="#10b981" />
            {/* Collar */}
            <path
              d="M20 19 L24 22 L28 19"
              fill="none"
              stroke="#c9d1d9"
              strokeWidth="0.8"
            />
            {/* Shirt line */}
            <line x1="24" y1="22" x2="24" y2="30" stroke="#c9d1d9" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#c9d1d9] text-base">{agent.name}</span>
            <Badge className="text-[10px] border border-amber-500/30 text-amber-400 bg-transparent">
              Super Agent
            </Badge>
          </div>
          <p className="text-xs text-[#8b949e] mt-0.5">{agent.agency}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {agent.experienceYears} yrs
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {agent.clientsManaged} clients
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {agent.successRate}%
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-[#30363d]" />

      {/* Stat Bars */}
      <div className="space-y-3">
        <StatBar label="Negotiation" value={agent.stats.negotiation} color="bg-emerald-500" delay={0.05} />
        <StatBar label="Market Knowledge" value={agent.stats.marketKnowledge} color="bg-cyan-500" delay={0.08} />
        <StatBar label="Player Relations" value={agent.stats.playerRelations} color="bg-amber-500" delay={0.11} />
        <StatBar label="Legal Expertise" value={agent.stats.legalExpertise} color="bg-purple-500" delay={0.14} />
      </div>

      <Separator className="bg-[#30363d]" />

      {/* Trust Level */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">Trust Level</span>
        <StarRating count={agent.trustLevel} />
      </div>

      {/* Agent Fee */}
      <div className="bg-[#21262d] rounded-lg p-3 space-y-1.5">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold">Agent Fee Structure</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Transfer Fee</span>
          <span className="text-[#c9d1d9] font-medium">{agent.fee.transferFee}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Signing Bonus</span>
          <span className="text-[#c9d1d9] font-medium">{agent.fee.signingBonus}%</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold">Contact</p>
        <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
          <Phone className="h-3.5 w-3.5 text-[#8b949e]" />
          <span>{agent.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
          <Mail className="h-3.5 w-3.5 text-[#8b949e]" />
          <span>{agent.email}</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 2 — Current Contract Overview
// ============================================================

function CurrentContractOverview() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const contract = player.contract;
  const totalYears = contract.yearsRemaining + 2;
  const elapsedYears = totalYears - contract.yearsRemaining;
  const remainingPct = (contract.yearsRemaining / totalYears) * 100;

  const leagueAvgWage = 60000;
  const leagueAvgSigning = 2000000;
  const leagueAvgRelease = 50000000;

  return (
    <SectionCard title="Current Contract" icon={FileText} delay={0.05}>
      {/* Club identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-lg">
          {currentClub.logo}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#c9d1d9]">{currentClub.name}</p>
          <p className="text-[10px] text-[#8b949e]">
            Professional Contract · {elapsedYears > 0 ? `Signed ${elapsedYears} yr${elapsedYears > 1 ? 's' : ''} ago` : 'Recently signed'}
          </p>
        </div>
        <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          Active
        </Badge>
      </div>

      <Separator className="bg-[#30363d]" />

      {/* Key Terms Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Weekly Wage</p>
          <p className="text-base font-bold text-emerald-400 mt-0.5">{formatWage(contract.weeklyWage)}</p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">
            League avg: {formatWage(leagueAvgWage)}
          </p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Signing Bonus</p>
          <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
            {contract.signingBonus ? formatCurrency(contract.signingBonus) : 'N/A'}
          </p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">
            League avg: {formatCurrency(leagueAvgSigning)}
          </p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Release Clause</p>
          <p className="text-base font-bold text-amber-400 mt-0.5">
            {contract.releaseClause ? formatCurrency(contract.releaseClause) : 'None'}
          </p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">
            League avg: {formatCurrency(leagueAvgRelease)}
          </p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Goal Bonus</p>
          <p className="text-base font-bold text-cyan-400 mt-0.5">
            {contract.performanceBonuses?.goalsBonus
              ? formatCurrency(contract.performanceBonuses.goalsBonus)
              : 'N/A'}
          </p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">Per goal scored</p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Assist Bonus</p>
          <p className="text-base font-bold text-purple-400 mt-0.5">
            {contract.performanceBonuses?.assistBonus
              ? formatCurrency(contract.performanceBonuses.assistBonus)
              : 'N/A'}
          </p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">Per assist made</p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Loyalty Bonus</p>
          <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
            {formatCurrency(500000)}
          </p>
          <p className="text-[10px] text-[#8b949e] mt-0.5">Annual</p>
        </div>
      </div>

      {/* Contract length progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Contract Duration</span>
          <span className="text-[#c9d1d9] font-medium">
            {contract.yearsRemaining} yr{contract.yearsRemaining !== 1 ? 's' : ''} remaining
          </span>
        </div>
        <div className="h-3 bg-[#21262d] rounded-lg overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="h-full rounded-lg bg-emerald-500"
            style={{ width: `${remainingPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#484f58]">
          <span>2024</span>
          <span>2027</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          Renegotiate
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#21262d] text-[#c9d1d9] border border-[#30363d] text-xs font-semibold hover:border-emerald-500/30 transition-colors">
          <FileText className="h-3.5 w-3.5" />
          Request Extension
        </button>
      </div>

      {/* Contract vs League Average */}
      <div className="space-y-2">
        <p className="text-xs text-[#8b949e] font-semibold">Your Deal vs League Average</p>
        <ComparisonRow label="Wage" yours={contract.weeklyWage} league={leagueAvgWage} unit="K" prefix="€" suffix="/wk" />
        <ComparisonRow label="Signing Bonus" yours={contract.signingBonus ?? 0} league={leagueAvgSigning} unit="M" prefix="€" />
        <ComparisonRow label="Release Clause" yours={contract.releaseClause ?? 0} league={leagueAvgRelease} unit="M" prefix="€" />
      </div>
    </SectionCard>
  );
}

function ComparisonRow({
  label,
  yours,
  league,
  unit,
  prefix = '€',
  suffix = '',
}: {
  label: string;
  yours: number;
  league: number;
  unit: string;
  prefix?: string;
  suffix?: string;
}) {
  const diff = yours > 0 ? ((yours - league) / league) * 100 : -100;
  const isHigher = diff > 0;
  const isEq = Math.abs(diff) < 5;

  const fmt = (v: number) => {
    const val = unit === 'M' ? v / 1_000_000 : unit === 'K' ? v / 1_000 : v;
    return `${prefix}${val >= 1 ? val.toFixed(0) : val.toFixed(1)}${unit}${suffix}`;
  };

  return (
    <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2">
      <span className="text-xs text-[#8b949e]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[#c9d1d9]">{fmt(yours)}</span>
        <span className="text-[10px] text-[#484f58]">vs</span>
        <span className="text-xs text-[#8b949e]">{fmt(league)}</span>
        {isEq ? (
          <Minus className="h-3 w-3 text-[#8b949e]" />
        ) : isHigher ? (
          <ArrowUpRight className="h-3 w-3 text-emerald-400" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-red-400" />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Section 3 — Contract Negotiation Simulator
// ============================================================

interface NegotiationTerm {
  id: string;
  label: string;
  currentValue: string;
  currentNum: number;
  yourDemand: string;
  yourDemandNum: number;
  clubOffer: string;
  clubOfferNum: number;
  unit: string;
}

function ContractNegotiationSimulator() {
  const [round, setRound] = useState(1);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);

  const terms: NegotiationTerm[] = useMemo(
    () => [
      {
        id: 'wage',
        label: 'Weekly Wage',
        currentValue: formatWage(80000),
        currentNum: 80000,
        yourDemand: formatWage(95000),
        yourDemandNum: 95000,
        clubOffer: formatWage(88000),
        clubOfferNum: 88000,
        unit: '/wk',
      },
      {
        id: 'signing_bonus',
        label: 'Signing Bonus',
        currentValue: formatCurrency(3000000),
        currentNum: 3000000,
        yourDemand: formatCurrency(5000000),
        yourDemandNum: 5000000,
        clubOffer: formatCurrency(3800000),
        clubOfferNum: 3800000,
        unit: '',
      },
      {
        id: 'length',
        label: 'Contract Length',
        currentValue: '3 years',
        currentNum: 3,
        yourDemand: '4 years',
        yourDemandNum: 4,
        clubOffer: '3 years',
        clubOfferNum: 3,
        unit: 'years',
      },
      {
        id: 'release_clause',
        label: 'Release Clause',
        currentValue: formatCurrency(60000000),
        currentNum: 60000000,
        yourDemand: formatCurrency(45000000),
        yourDemandNum: 45000000,
        clubOffer: formatCurrency(55000000),
        clubOfferNum: 55000000,
        unit: '',
      },
      {
        id: 'loyalty_bonus',
        label: 'Loyalty Bonus',
        currentValue: formatCurrency(500000),
        currentNum: 500000,
        yourDemand: formatCurrency(800000),
        yourDemandNum: 800000,
        clubOffer: formatCurrency(600000),
        clubOfferNum: 600000,
        unit: '/yr',
      },
      {
        id: 'goal_bonus',
        label: 'Goal Bonus',
        currentValue: formatCurrency(5000),
        currentNum: 5000,
        yourDemand: formatCurrency(8000),
        yourDemandNum: 8000,
        clubOffer: formatCurrency(6000),
        clubOfferNum: 6000,
        unit: '/goal',
      },
      {
        id: 'appearance_bonus',
        label: 'Appearance Bonus',
        currentValue: formatCurrency(3000),
        currentNum: 3000,
        yourDemand: formatCurrency(5000),
        yourDemandNum: 5000,
        clubOffer: formatCurrency(3500),
        clubOfferNum: 3500,
        unit: '/match',
      },
      {
        id: 'image_rights',
        label: 'Image Rights',
        currentValue: '0%',
        currentNum: 0,
        yourDemand: '15%',
        yourDemandNum: 15,
        clubOffer: '10%',
        clubOfferNum: 10,
        unit: '%',
      },
    ],
    []
  );

  const leverageScore = 72;

  return (
    <SectionCard title="Contract Negotiation" icon={Scale} delay={0.1}>
      {/* Round & Leverage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Round {round}/3
          </Badge>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((r) => (
              <CircleDot
                key={r}
                className={`h-2.5 w-2.5 ${r <= round ? 'text-emerald-400 fill-emerald-400' : 'text-[#30363d]'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-[#8b949e]">
            Leverage: <span className="text-amber-400 font-semibold">{leverageScore}/100</span>
          </span>
        </div>
      </div>

      {/* Leverage bar */}
      <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full rounded-lg bg-amber-500"
          style={{ width: `${leverageScore}%` }}
        />
      </div>

      {/* Negotiation Terms Table */}
      <div className="space-y-1.5">
        {terms.map((term, idx) => {
          const diff =
            term.id === 'release_clause'
              ? term.clubOfferNum < term.yourDemandNum
                ? 'favorable'
                : 'unfavorable'
              : term.clubOfferNum >= term.yourDemandNum
                ? 'favorable'
                : term.clubOfferNum >= term.currentNum
                  ? 'partial'
                  : 'unfavorable';

          const isExpanded = activeTermId === term.id;

          return (
            <motion.div
              key={term.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 + idx * 0.03 }}
            >
              <button
                onClick={() => setActiveTermId(isExpanded ? null : term.id)}
                className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                  isExpanded
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#c9d1d9]">{term.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b949e]">{term.clubOffer}</span>
                    {diff === 'favorable' ? (
                      <ThumbsUp className="h-3 w-3 text-emerald-400" />
                    ) : diff === 'unfavorable' ? (
                      <ThumbsDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <Minus className="h-3 w-3 text-amber-400" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-[#8b949e]" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-[#8b949e]" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-[#8b949e]">Current</p>
                        <p className="text-xs font-medium text-[#c9d1d9]">{term.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b949e]">Your Demand</p>
                        <p className="text-xs font-medium text-emerald-400">{term.yourDemand}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b949e]">Club Offer</p>
                        <p className="text-xs font-medium text-amber-400">{term.clubOffer}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">Difference</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          diff === 'favorable'
                            ? 'text-emerald-400'
                            : diff === 'unfavorable'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        }`}
                      >
                        {diff === 'favorable'
                          ? '✓ At or above demand'
                          : diff === 'unfavorable'
                            ? '✗ Below current value'
                            : '~ Partial improvement'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-colors">
          <ThumbsUp className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          onClick={() => setRound((r) => Math.min(r + 1, 3))}
          className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Negotiate
        </button>
        <button className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/25 transition-colors">
          <ThumbsDown className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>

      {/* Agent Recommendation */}
      <div className="bg-[#21262d] rounded-lg p-3 space-y-1.5 border border-emerald-500/10">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">Agent Recommendation</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">
          I recommend accepting. The club has met most of our demands for wage and bonuses.
          The release clause is slightly higher than ideal but within acceptable range. Your
          leverage is strong — pushing further risks losing goodwill with the board.
        </p>
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 4 — Agent Advice Feed
// ============================================================

function AgentAdviceFeed() {
  const [messages, setMessages] = useState(ADVICE_MESSAGES);

  const toggleRead = (id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: !m.read } : m))
    );
  };

  const markAllRead = () => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <SectionCard title="Agent Advice" icon={MessageSquare} delay={0.15}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.2 + idx * 0.03 }}
            className={`rounded-lg border p-3 transition-colors ${
              msg.read
                ? 'bg-[#21262d]/60 border-[#30363d]/60'
                : 'bg-[#21262d] border-[#30363d]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[9px] border ${getCategoryStyle(msg.category)}`}>
                    {msg.category}
                  </Badge>
                  {!msg.read && (
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-sm shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#c9d1d9] leading-relaxed">{msg.message}</p>
                <p className="text-[10px] text-[#484f58] mt-1">{msg.timestamp}</p>
              </div>
              <button
                onClick={() => toggleRead(msg.id)}
                className="shrink-0 p-1 rounded-md hover:bg-[#30363d] transition-colors text-[#8b949e] hover:text-[#c9d1d9]"
                title={msg.read ? 'Mark as unread' : 'Mark as read'}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 5 — Contract History
// ============================================================

function ContractHistory() {
  const chartW = 300;
  const chartH = 100;
  const padX = 30;
  const padY = 10;

  const wages = CONTRACT_HISTORY.map((c) => c.wage);
  const maxWage = Math.max(...wages);
  const minWage = Math.min(...wages);
  const wageRange = maxWage - minWage || 1;

  const points = wages.map((w, i) => ({
    x: padX + (i / (wages.length - 1)) * (chartW - padX * 2),
    y: padY + (1 - (w - minWage) / wageRange) * (chartH - padY * 2),
  }));

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},${chartH} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${chartH} Z`;

  return (
    <SectionCard title="Contract History" icon={Clock} delay={0.2}>
      {/* Career Earnings Chart */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold mb-2">
          Career Wage Progression
        </p>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-24" preserveAspectRatio="none">
          <motion.path
            d={areaPath}
            fill="#10b981"
            fillOpacity={0.08}
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: 0.08 }}
            transition={{ duration: 0.2 }}
          />
          <motion.polyline
            points={linePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="#10b981"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            />
          ))}
        </svg>
        <div className="flex justify-between text-[10px] text-[#484f58] mt-1">
          {CONTRACT_HISTORY.map((c) => (
            <span key={c.id}>Age {c.age}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {CONTRACT_HISTORY.map((contract, idx) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.25 + idx * 0.04 }}
            className="flex gap-3"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-sm border-2 shrink-0 ${
                  contract.type === 'Current'
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-[#21262d] border-[#484f58]'
                }`}
              />
              {idx < CONTRACT_HISTORY.length - 1 && (
                <div className="w-px flex-1 bg-[#30363d] min-h-[8px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-3 ${idx === CONTRACT_HISTORY.length - 1 ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold ${
                    contract.type === 'Current' ? 'text-emerald-400' : 'text-[#c9d1d9]'
                  }`}
                >
                  {contract.type}
                </span>
                <Badge
                  className={`text-[9px] border ${
                    contract.type === 'Current'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-[#30363d] text-[#8b949e] bg-[#21262d]'
                  }`}
                >
                  Age {contract.age}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-[#8b949e]">
                  {contract.club} · {contract.startDate}–{contract.endDate}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs">
                <span className="text-emerald-400 font-medium">{formatWage(contract.wage)}</span>
                {contract.improvement !== '—' && (
                  <span className="text-[#8b949e]">
                    <ArrowUpRight className="h-3 w-3 inline text-emerald-400 mr-0.5" />
                    {contract.improvement} vs prev
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#484f58] mt-0.5">Agent: {contract.agent}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 6 — Endorsement Deals
// ============================================================

function EndorsementDeals() {
  const totalAnnual = ENDORSEMENTS.reduce((sum, e) => sum + e.annualValue, 0);

  return (
    <SectionCard title="Endorsement Deals" icon={Tag} delay={0.25}>
      {/* Total income */}
      <div className="bg-[#21262d] rounded-lg p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold">
            Total Annual Endorsement Income
          </p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(totalAnnual)}/yr</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Active deals */}
      <div className="space-y-2">
        <p className="text-xs text-[#8b949e] font-semibold">Active Contracts</p>
        {ENDORSEMENTS.map((deal, idx) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.3 + idx * 0.04 }}
            className="bg-[#21262d] rounded-lg border border-[#30363d] p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#8b949e]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#c9d1d9]">{deal.brand}</p>
                  <p className="text-[10px] text-[#8b949e]">{deal.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-400">{formatCurrency(deal.annualValue)}/yr</p>
                <p className="text-[10px] text-[#8b949e]">{deal.yearsRemaining} yr{deal.yearsRemaining !== 1 ? 's' : ''} left</p>
              </div>
            </div>
            {/* Duration bar */}
            <div className="h-1 bg-[#0d1117] rounded-sm overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.35 + idx * 0.04 }}
                className="h-full rounded-sm bg-emerald-500"
                style={{ width: `${(deal.yearsRemaining / deal.totalYears) * 100}%` }}
              />
            </div>
            {deal.hasPerformanceClause && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400">
                <Zap className="h-3 w-3" />
                Performance clause active
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pending deals */}
      <div className="space-y-2">
        <p className="text-xs text-[#8b949e] font-semibold">New Deal Opportunities</p>
        {PENDING_DEALS.map((deal, idx) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.5 + idx * 0.04 }}
            className="bg-[#21262d] rounded-lg border border-amber-500/20 border-dashed p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#c9d1d9]">{deal.brand}</p>
                <p className="text-[10px] text-[#8b949e]">{deal.type} · {deal.years} years</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">{formatCurrency(deal.annualValue)}/yr</span>
                {deal.performanceClause && (
                  <Zap className="h-3 w-3 text-amber-400" />
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 text-[10px] py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/25 transition-colors">
                Accept
              </button>
              <button className="flex-1 text-[10px] py-1.5 rounded-lg bg-[#30363d] text-[#8b949e] border border-[#484f58] font-semibold hover:text-[#c9d1d9] transition-colors">
                Decline
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 7 — Contract Comparison Market
// ============================================================

function ContractComparisonMarket() {
  const sorted = [...MARKET_COMPARISON].sort((a, b) => b.wage - a.wage);
  const playerEntry = sorted.find((p) => p.isPlayer);
  const playerRank = sorted.findIndex((p) => p.isPlayer) + 1;
  const marketPositionPct = Math.round(((sorted.length - playerRank + 1) / sorted.length) * 100);

  return (
    <SectionCard title="Market Comparison" icon={BarChart3} delay={0.3}>
      {/* Market Position Indicator */}
      <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-400">
            Top {100 - marketPositionPct}% earners at your position
          </p>
          <p className="text-[10px] text-[#8b949e]">
            Ranked #{playerRank} of {sorted.length} comparable players
          </p>
        </div>
      </div>

      {/* Bargaining Power */}
      <div className="bg-[#21262d] rounded-lg p-3 space-y-1.5">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold">Bargaining Power Analysis</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Age Advantage</span>
          <span className="text-emerald-400">Strong — Prime years</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Position Scarcity</span>
          <span className="text-amber-400">Moderate</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Contract Leverage</span>
          <span className="text-emerald-400">Good — 3 years left</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Market Demand</span>
          <span className="text-emerald-400">High — 3 clubs interested</span>
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-1.5">
        <p className="text-xs text-[#8b949e] font-semibold">Similar Players</p>
        {sorted.map((player, idx) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.35 + idx * 0.04 }}
            className={`rounded-lg border p-2.5 flex items-center gap-3 ${
              player.isPlayer
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-[#21262d] border-[#30363d]'
            }`}
          >
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-xs font-semibold truncate ${player.isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                  {player.name}
                </p>
                {player.isPlayer && (
                  <Badge className="text-[8px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    YOU
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-[#8b949e] truncate">{player.club}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-[#c9d1d9]">{formatWage(player.wage)}</p>
              <p className="text-[10px] text-[#8b949e]">
                {player.contractLength}yr · {formatCurrency(player.releaseClause * 1_000_000)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// Section 8 — Legal & Fine Print
// ============================================================

function LegalFinePrint() {
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  return (
    <SectionCard title="Legal & Fine Print" icon={Gavel} delay={0.35}>
      <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">
        Understanding your contract clauses is crucial. Here are the key clauses and what they mean for your career.
      </p>

      <div className="space-y-1.5">
        {LEGAL_CLAUSES.map((clause, idx) => {
          const isExpanded = expandedClause === clause.name;
          return (
            <motion.div
              key={clause.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.4 + idx * 0.03 }}
            >
              <button
                onClick={() => setExpandedClause(isExpanded ? null : clause.name)}
                className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                  isExpanded
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-[#8b949e]" />
                    <span className="text-xs font-medium text-[#c9d1d9]">{clause.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {clause.inContract ? (
                      <Badge className="text-[9px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        In Contract
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] border border-[#30363d] text-[#8b949e] bg-[#0d1117]">
                        Not Included
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-[#8b949e]" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-[#8b949e]" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-3"
                  >
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">{clause.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Full Legal Document button */}
      <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#21262d] text-[#8b949e] border border-[#30363d] text-xs font-medium hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors">
        <FileText className="h-3.5 w-3.5" />
        Full Legal Document
      </button>
    </SectionCard>
  );
}

// ============================================================
// Main Component — PlayerAgentContract
// ============================================================

export default function PlayerAgentContract() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { value: 'profile', label: 'Agent', icon: User },
    { value: 'contract', label: 'Contract', icon: FileText },
    { value: 'negotiate', label: 'Negotiate', icon: Scale },
    { value: 'advice', label: 'Advice', icon: MessageSquare },
    { value: 'history', label: 'History', icon: Clock },
    { value: 'endorsements', label: 'Sponsors', icon: Tag },
    { value: 'market', label: 'Market', icon: BarChart3 },
    { value: 'legal', label: 'Legal', icon: Gavel },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-6 pb-24 max-w-lg mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Player Agent Contract</h1>
            <p className="text-xs text-[#8b949e]">Manage negotiations, deals & endorsements</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-1 flex gap-0.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none shrink-0"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 space-y-4">
          <TabsContent value="profile">
            <AgentProfileCard />
          </TabsContent>

          <TabsContent value="contract">
            <CurrentContractOverview />
          </TabsContent>

          <TabsContent value="negotiate">
            <ContractNegotiationSimulator />
          </TabsContent>

          <TabsContent value="advice">
            <AgentAdviceFeed />
          </TabsContent>

          <TabsContent value="history">
            <ContractHistory />
          </TabsContent>

          <TabsContent value="endorsements">
            <EndorsementDeals />
          </TabsContent>

          <TabsContent value="market">
            <ContractComparisonMarket />
          </TabsContent>

          <TabsContent value="legal">
            <LegalFinePrint />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
