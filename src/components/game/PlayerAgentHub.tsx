'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getLeagueById, ENRICHED_CLUBS } from '@/lib/game/clubsData';
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
  Flag,
  Calendar,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Users,
  Building2,
  Globe,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// Helper Functions
// ============================================================

/** Replace underscores with spaces, title-case each word */
function formatLeagueName(league: string): string {
  return league
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Calculate projected retirement age based on overall and position */
function calculateRetirementAge(player: {
  overall: number;
  position: string;
}): number {
  const base = 33 + Math.floor(player.overall / 30);
  const gkBonus = player.position === 'GK' ? 2 : 0;
  return base + gkBonus;
}

/** Format a number with K/M/B suffixes */
function formatCurrency(value: number, unit?: string): string {
  if (unit === 'M') {
    if (value >= 100) return `€${value.toFixed(0)}M`;
    if (value >= 10) return `€${value.toFixed(1)}M`;
    return `€${value.toFixed(2)}M`;
  }
  if (unit === 'K') {
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}M/wk`;
    if (value >= 100) return `€${value.toFixed(0)}K/wk`;
    if (value >= 10) return `€${value.toFixed(1)}K/wk`;
    return `€${value.toFixed(2)}K/wk`;
  }
  // Auto-detect unit
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}K`;
  return `€${value.toFixed(0)}`;
}

// ============================================================
// Reusable Stat Bar
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
        <span className="text-[#c9d1d9] font-medium">{value}{max === 100 ? '/100' : `/${max}`}</span>
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

// ============================================================
// Section Card Wrapper
// ============================================================

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

// ============================================================
// Tab 1 — Agent Profile
// ============================================================

function AgentProfileTab({ agentQuality }: { agentQuality: number }) {
  const agentName = 'David Silva';
  const agencyName = 'Elite Sports Management';
  const experienceYears = 12 + Math.floor(agentQuality / 15);
  const clientCount = 8 + Math.floor(agentQuality / 8);

  const negotiationSkill = Math.min(45 + agentQuality, 99);
  const transferSuccessRate = Math.min(40 + Math.floor(agentQuality * 0.55), 98);
  const clientSatisfaction = Math.min(50 + Math.floor(agentQuality * 0.45), 97);
  const relationshipScore = Math.min(30 + Math.floor(agentQuality * 0.6), 95);

  const specializations = useMemo(() => {
    const list = ['Contract Expert'];
    if (agentQuality >= 40) list.push('Transfer Specialist');
    if (agentQuality >= 60) list.push('Image Consultant');
    if (agentQuality >= 80) list.push('Global Network');
    return list;
  }, [agentQuality]);

  const agentTier = useMemo(() => {
    if (agentQuality >= 80) return { label: 'Super Agent', color: 'text-amber-400', border: 'border-amber-500/30' };
    if (agentQuality >= 60) return { label: 'Top Agent', color: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (agentQuality >= 40) return { label: 'Good Agent', color: 'text-cyan-400', border: 'border-cyan-500/30' };
    if (agentQuality >= 20) return { label: 'Average Agent', color: 'text-[#8b949e]', border: 'border-[#30363d]' };
    return { label: 'Rookie Agent', color: 'text-red-400', border: 'border-red-500/30' };
  }, [agentQuality]);

  return (
    <div className="space-y-4">
      {/* Agent Identity Card */}
      <SectionCard title="Your Agent" icon={Briefcase}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-[#8b949e]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#c9d1d9] text-base">{agentName}</span>
              <Badge
                className={`text-[10px] border ${agentTier.border} ${agentTier.color} bg-transparent`}
              >
                {agentTier.label}
              </Badge>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">{agencyName}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {experienceYears} yrs exp
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {clientCount} clients
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-[#30363d]" />

        {/* Agent Stats */}
        <div className="space-y-3">
          <StatBar
            label="Negotiation Skill"
            value={negotiationSkill}
            color={
              negotiationSkill >= 80
                ? 'bg-emerald-500'
                : negotiationSkill >= 60
                  ? 'bg-cyan-500'
                  : 'bg-amber-500'
            }
            delay={0.05}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">Transfer Success Rate</span>
            <span className="text-emerald-400 font-semibold">{transferSuccessRate}%</span>
          </div>
          <StatBar
            label="Client Satisfaction"
            value={clientSatisfaction}
            color={
              clientSatisfaction >= 80
                ? 'bg-emerald-500'
                : clientSatisfaction >= 60
                  ? 'bg-cyan-500'
                  : 'bg-amber-500'
            }
            delay={0.1}
          />
        </div>

        <Separator className="bg-[#30363d]" />

        {/* Specializations */}
        <div className="space-y-1.5">
          <span className="text-xs text-[#8b949e]">Specializations</span>
          <div className="flex flex-wrap gap-1.5">
            {specializations.map((spec) => (
              <Badge
                key={spec}
                className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                <Star className="h-2.5 w-2.5 mr-1" />
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="bg-[#30363d]" />

        {/* Contact Info */}
        <div className="space-y-2">
          <span className="text-xs text-[#8b949e]">Contact Information</span>
          <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
            <Phone className="h-3.5 w-3.5 text-[#8b949e]" />
            <span>+44 7700 900{String(agentQuality).padStart(3, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
            <Mail className="h-3.5 w-3.5 text-[#8b949e]" />
            <span>d.silva@elitesportsmgmt.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
            <MessageSquare className="h-3.5 w-3.5 text-[#8b949e]" />
            <span>Available Mon-Fri 9AM-6PM</span>
          </div>
        </div>
      </SectionCard>

      {/* Relationship Meter */}
      <SectionCard title="Agent Relationship" icon={Heart} delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Trust Level</span>
            <span
              className={`text-xs font-semibold ${
                relationshipScore >= 80
                  ? 'text-emerald-400'
                  : relationshipScore >= 60
                    ? 'text-cyan-400'
                    : 'text-amber-400'
              }`}
            >
              {relationshipScore >= 80
                ? 'Excellent'
                : relationshipScore >= 60
                  ? 'Good'
                  : relationshipScore >= 40
                    ? 'Developing'
                    : 'Building'}
            </span>
          </div>
          <div className="h-3 bg-[#21262d] rounded-lg overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="h-full rounded-lg bg-emerald-500"
              style={{ width: `${relationshipScore}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8b949e]">
            {relationshipScore >= 80
              ? 'Your agent is fully invested in your career and will go above and beyond in negotiations.'
              : relationshipScore >= 60
                ? 'A strong bond is forming. Your agent will work diligently for favorable deals.'
                : relationshipScore >= 40
                  ? 'Still early in your professional relationship. Deliver strong performances to build trust.'
                  : 'A fresh partnership. Consistency on the pitch will strengthen this bond over time.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#8b949e]">Deals Closed</p>
            <p className="text-sm font-bold text-[#c9d1d9]">{3 + Math.floor(agentQuality / 20)}</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#8b949e]">Years Together</p>
            <p className="text-sm font-bold text-[#c9d1d9]">{Math.max(1, Math.floor(agentQuality / 18))}</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#8b949e]">Bonus Earned</p>
            <p className="text-sm font-bold text-emerald-400">{Math.floor(agentQuality * 0.8)}K</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 2 — Contract Advice
// ============================================================

function ContractAdviceTab({
  player,
  club,
}: {
  player: {
    contract: {
      weeklyWage: number;
      yearsRemaining: number;
      releaseClause?: number;
      signingBonus?: number;
      performanceBonuses?: {
        goalsBonus?: number;
        assistBonus?: number;
        cleanSheetBonus?: number;
      };
    };
    marketValue: number;
    overall: number;
    age: number;
    position: string;
  };
  club: { league: string; name: string };
}) {
  const { contract, marketValue } = player;
  const leagueData = getLeagueById(club.league);
  const leagueName = leagueData?.name ?? formatLeagueName(club.league);

  // Wage analysis: derive league average from market value
  const leagueAvgWage =
    club.league === 'premier_league'
      ? 120
      : club.league === 'la_liga'
        ? 95
        : club.league === 'serie_a'
          ? 80
          : club.league === 'bundesliga'
            ? 75
            : club.league === 'ligue_1'
              ? 70
              : Math.max(50, Math.round(marketValue * 0.001));
  const wageRatio = leagueAvgWage > 0 ? contract.weeklyWage / leagueAvgWage : 1;
  const wageStatus =
    wageRatio >= 1.5
      ? { label: 'Above Average', color: 'text-emerald-400', desc: 'You earn significantly more than the league average' }
      : wageRatio >= 1.0
        ? { label: 'Fair Market', color: 'text-cyan-400', desc: 'Your wage aligns well with the market' }
        : wageRatio >= 0.7
          ? { label: 'Below Average', color: 'text-amber-400', desc: 'Consider renegotiating for a better deal' }
          : { label: 'Underpaid', color: 'text-red-400', desc: 'Your agent should push for a substantial raise' };

  // Contract health
  const years = contract.yearsRemaining;
  const contractHealth =
    years > 3
      ? { label: 'Secure', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle }
      : years >= 1
        ? { label: 'Expiring', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle }
        : { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle };

  // Extension recommendation
  const extensionAdvice = useMemo(() => {
    if (years <= 1)
      return 'Your contract is running out fast. Negotiate an extension immediately or explore free transfer options. Clubs may lowball your wage due to desperation to secure you.';
    if (years <= 2)
      return 'With two years or fewer remaining, you have some leverage but time is ticking. Start extension talks before the final year when clubs have the advantage.';
    if (years <= 3)
      return 'Your contract is in a comfortable window. Use strong performances this season to negotiate improved terms next year.';
    return 'You have excellent contract security. Focus on your development and let your value grow before your next negotiation window.';
  }, [years]);

  // Performance bonuses - only show if values > 0
  const bonuses = contract.performanceBonuses;
  const hasBonuses =
    bonuses &&
    ((bonuses.goalsBonus && bonuses.goalsBonus > 0) ||
      (bonuses.assistBonus && bonuses.assistBonus > 0) ||
      (bonuses.cleanSheetBonus && bonuses.cleanSheetBonus > 0));

  // Market value trend sparkline - 5 fake data points
  const trendData = useMemo(() => {
    const base = marketValue;
    return [
      base * 0.82,
      base * 0.88,
      base * 0.78,
      base * 0.91,
      base,
    ];
  }, [marketValue]);

  const trendMin = Math.min(...trendData);
  const trendMax = Math.max(...trendData);
  const trendRange = trendMax - trendMin || 1;

  const sparklineW = 220;
  const sparklineH = 48;
  const padX = 6;
  const padY = 6;

  const sparkPoints = trendData.map((v, i) => ({
    x: padX + (i / (trendData.length - 1)) * (sparklineW - padX * 2),
    y: padY + (1 - (v - trendMin) / trendRange) * (sparklineH - padY * 2),
  }));
  const polyline = sparkPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${sparkPoints[0].x},${sparklineH} L ${sparkPoints.map((p) => `${p.x},${p.y}`).join(' L ')} L ${sparkPoints[sparkPoints.length - 1].x},${sparklineH} Z`;
  const trendUp = trendData[trendData.length - 1] >= trendData[0];

  const HealthIcon = contractHealth.icon;

  return (
    <div className="space-y-4">
      {/* Current Contract */}
      <SectionCard title="Current Contract" icon={FileText}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#c9d1d9]">{club.name}</p>
            <p className="text-[10px] text-[#8b949e]">{leagueName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Weekly Wage</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {formatCurrency(contract.weeklyWage, 'K')}
            </p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Years Remaining</p>
            <p className={`text-lg font-bold mt-0.5 ${contractHealth.color}`}>
              {years} yr{years !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Release Clause</p>
            <p className="text-lg font-bold text-amber-400 mt-0.5">
              {contract.releaseClause
                ? formatCurrency(contract.releaseClause, 'M')
                : 'None'}
            </p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Signing Bonus</p>
            <p className="text-lg font-bold text-[#c9d1d9] mt-0.5">
              {contract.signingBonus
                ? formatCurrency(contract.signingBonus, 'K')
                : 'N/A'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Contract Health */}
      <SectionCard title="Contract Health" icon={Shield} delay={0.05}>
        <div
          className={`flex items-center gap-3 rounded-lg border ${contractHealth.border} ${contractHealth.bg} p-3`}
        >
          <HealthIcon className={`h-5 w-5 ${contractHealth.color}`} />
          <div>
            <p className={`text-sm font-bold ${contractHealth.color}`}>
              {contractHealth.label}
            </p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              {years > 3
                ? `${years} years remaining — no immediate action needed`
                : years >= 1
                  ? `${years} year${years > 1 ? 's' : ''} left — begin renewal discussions`
                  : `${years} year left — urgent negotiations required`}
            </p>
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            Extension Recommendation
          </p>
          <p className="text-xs text-[#c9d1d9] leading-relaxed">{extensionAdvice}</p>
        </div>
      </SectionCard>

      {/* Wage Analysis */}
      <SectionCard title="Wage Analysis" icon={DollarSign} delay={0.1}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">Your Wage</span>
            <span className="text-[#c9d1d9] font-semibold">
              {formatCurrency(contract.weeklyWage, 'K')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">{leagueName} Average</span>
            <span className="text-[#c9d1d9]">
              {formatCurrency(leagueAvgWage, 'K')}
            </span>
          </div>
          <Separator className="bg-[#30363d]" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8b949e]">Wage Status</span>
            <span className={`font-semibold ${wageStatus.color}`}>
              {wageStatus.label}
            </span>
          </div>
          <p className="text-[10px] text-[#8b949e]">{wageStatus.desc}</p>
        </div>

        {/* Comparison bars */}
        <div className="space-y-2 mt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#8b949e]">Your Wage</span>
              <span className="text-[#c9d1d9]">{(wageRatio * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                className="h-full rounded-lg bg-emerald-500"
                style={{ width: `${Math.min(wageRatio * 50, 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#8b949e]">League Avg</span>
              <span className="text-[#8b949e]">50%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="h-full rounded-lg bg-[#484f58]"
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Performance Bonuses (only shown if values > 0) */}
      {hasBonuses && bonuses && (
        <SectionCard title="Performance Bonuses" icon={Zap} delay={0.15}>
          <div className="grid grid-cols-1 gap-2">
            {bonuses.goalsBonus && bonuses.goalsBonus > 0 && (
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-[#c9d1d9]">Goals Bonus</p>
                    <p className="text-[10px] text-[#8b949e]">Per goal scored</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(bonuses.goalsBonus, 'K')}
                </span>
              </div>
            )}
            {bonuses.assistBonus && bonuses.assistBonus > 0 && (
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-medium text-[#c9d1d9]">Assist Bonus</p>
                    <p className="text-[10px] text-[#8b949e]">Per assist provided</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-cyan-400">
                  {formatCurrency(bonuses.assistBonus, 'K')}
                </span>
              </div>
            )}
            {bonuses.cleanSheetBonus && bonuses.cleanSheetBonus > 0 && (
              <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-[#c9d1d9]">Clean Sheet Bonus</p>
                    <p className="text-[10px] text-[#8b949e]">Per clean sheet kept</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {formatCurrency(bonuses.cleanSheetBonus, 'K')}
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Market Value Trend */}
      <SectionCard title="Market Value Trend" icon={BarChart3} delay={0.2}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-emerald-400">
            {formatCurrency(marketValue, 'M')}
          </span>
          <Badge
            className={`text-[10px] border ${
              trendUp
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-red-400 border-red-500/30 bg-red-500/10'
            }`}
          >
            <TrendingUp className={`h-2.5 w-2.5 mr-1 ${trendUp ? '' : 'rotate-180'}`} />
            {trendUp ? 'Rising' : 'Declining'}
          </Badge>
        </div>
        <svg
          viewBox={`0 0 ${sparklineW} ${sparklineH}`}
          className="w-full h-12"
          preserveAspectRatio="none"
        >
          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={trendUp ? '#10b981' : '#ef4444'}
            fillOpacity={0.08}
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: 0.08 }}
            transition={{ duration: 0.2 }}
          />
          {/* Line */}
          <motion.polyline
            points={polyline}
            fill="none"
            stroke={trendUp ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          />
          {/* End dot */}
          <motion.circle
            cx={sparkPoints[sparkPoints.length - 1].x}
            cy={sparkPoints[sparkPoints.length - 1].y}
            r={2.5}
            fill={trendUp ? '#10b981' : '#ef4444'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.15 }}
          />
        </svg>
        <div className="flex items-center justify-between text-[10px] text-[#484f58] mt-1">
          <span>Season {1}</span>
          <span>Season 5 (projected)</span>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 3 — Transfer Talk
// ============================================================

function TransferTalkTab({
  player,
  currentWeek,
  currentClubId,
}: {
  player: {
    overall: number;
    age: number;
    position: string;
    marketValue: number;
    form: number;
  };
  currentWeek: number;
  currentClubId: string;
}) {
  // Generate interested clubs from available clubs data
  const interestedClubs = useMemo(() => {
    const otherClubs = ENRICHED_CLUBS.filter(
      (c) => c.id !== currentClubId && c.reputation >= 55
    );
    // Shuffle deterministically based on overall
    const shuffled = [...otherClubs].sort((a, b) => {
      const scoreA = (a.reputation + a.budget / 1_000_000) * 0.3 + (100 - a.squadQuality) * 0.7;
      const scoreB = (b.reputation + b.budget / 1_000_000) * 0.3 + (100 - b.squadQuality) * 0.7;
      return scoreB - scoreA;
    });
    return shuffled.slice(0, Math.min(4, shuffled.length)).map((club, idx) => {
      const interestLevel =
        idx === 0 ? 'High' : idx <= 1 ? 'High' : idx <= 2 ? 'Medium' : 'Low';
      const positionNeeds = club.needsPositions.includes(player.position as never);
      const reasons: string[] = [];
      if (positionNeeds) reasons.push(`Need a ${player.position}`);
      if (club.squadQuality < player.overall - 5) reasons.push('Seeking upgrades');
      if (club.budget > player.marketValue * 1_000_000 * 1.5) reasons.push('Financial backing');
      if (reasons.length === 0) reasons.push('Scouting talent');
      return {
        name: club.name,
        league: club.league,
        budget: club.budget,
        reputation: club.reputation,
        logo: club.logo,
        interestLevel,
        reason: reasons[0],
      };
    });
  }, [player, currentClubId]);

  // Transfer window countdown
  const weeksRemaining = Math.max(0, 38 - currentWeek);
  const windowOpen = currentWeek <= 12 || (currentWeek >= 25 && currentWeek <= 28);

  // Transfer tips
  const transferTips = useMemo(() => {
    const tips: string[] = [];
    if (player.age <= 21) tips.push('Your young age is a major asset — top clubs pay premiums for wonderkids with high potential.');
    if (player.age >= 22 && player.age <= 28) tips.push('You are in your prime years. This is the best time to secure a big-money move to a top club.');
    if (player.age > 30) tips.push('At your age, clubs will offer shorter contracts. Consider a move to a league with less physical intensity.');
    if (player.overall >= 80) tips.push('Your high rating makes you a target for elite clubs. Leverage this in negotiations for better wages and guaranteed playing time.');
    if (player.overall >= 70 && player.overall < 80) tips.push('Consistent performances can push your OVR above 80, dramatically increasing your transfer value.');
    if (player.form >= 7.0) tips.push('Your current form is attracting scouts. Maintain this level through the transfer window.');
    if (player.form < 6.0) tips.push('Low form could reduce transfer interest. Focus on training and match performances to rebuild your stock.');
    if (!windowOpen) tips.push('The transfer window is currently closed. Use this time to improve your value for the next window.');
    return tips;
  }, [player, windowOpen]);

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Medium':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-[#8b949e] border-[#30363d] bg-[#21262d]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Transfer Window Countdown */}
      <SectionCard title="Transfer Window" icon={Clock}>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              windowOpen
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#21262d] border-[#30363d]'
            }`}
          >
            <Clock
              className={`h-6 w-6 ${windowOpen ? 'text-emerald-400' : 'text-[#8b949e]'}`}
            />
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-bold ${
                windowOpen ? 'text-emerald-400' : 'text-[#c9d1d9]'
              }`}
            >
              {windowOpen ? 'Window Open' : 'Window Closed'}
            </p>
            <p className="text-xs text-[#8b949e]">
              {windowOpen
                ? `${Math.max(0, currentWeek <= 12 ? 12 - currentWeek + 1 : 28 - currentWeek + 1)} weeks remaining`
                : `${weeksRemaining} weeks until end of season`}
            </p>
          </div>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>Season Progress</span>
            <span>
              Week {currentWeek} / 38
            </span>
          </div>
          <div className="h-2 bg-[#0d1117] rounded-lg overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="h-full rounded-lg bg-emerald-500"
              style={{ width: `${(currentWeek / 38) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#484f58]">
            <span>Summer (Wk 1-12)</span>
            <span>Winter (Wk 25-28)</span>
          </div>
        </div>
      </SectionCard>

      {/* Interested Clubs */}
      <SectionCard
        title={`Interested Clubs (${interestedClubs.length})`}
        icon={Building2}
        delay={0.05}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {interestedClubs.map((club, idx) => (
            <motion.div
              key={club.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 + idx * 0.04 }}
              className="bg-[#21262d] rounded-xl p-3 border border-[#30363d] space-y-2"
            >
              {/* Club header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-lg">
                  {club.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c9d1d9] truncate">
                    {club.name}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">
                    {formatLeagueName(club.league)}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] border ${getInterestColor(club.interestLevel)}`}
                >
                  {club.interestLevel}
                </Badge>
              </div>

              {/* Club details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-[10px]">
                  <span className="text-[#8b949e]">Budget</span>
                  <p className="text-xs font-medium text-[#c9d1d9]">
                    {formatCurrency(club.budget)}
                  </p>
                </div>
                <div className="text-[10px]">
                  <span className="text-[#8b949e]">Reputation</span>
                  <p className="text-xs font-medium text-[#c9d1d9]">
                    {club.reputation}/100
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="flex items-start gap-1.5 text-[10px] text-[#8b949e]">
                <Lightbulb className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <span>{club.reason}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Transfer Tips */}
      <SectionCard title="Transfer Tips" icon={Lightbulb} delay={0.15}>
        <div className="space-y-2.5">
          {transferTips.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.2 + idx * 0.04 }}
              className="flex items-start gap-2.5 text-xs text-[#c9d1d9] leading-relaxed"
            >
              <ArrowRight className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 4 — Career Plan
// ============================================================

function CareerPlanTab({
  player,
  currentSeason,
}: {
  player: {
    overall: number;
    potential: number;
    age: number;
    position: string;
    seasonStats: {
      goals: number;
      assists: number;
      cleanSheets: number;
      appearances: number;
    };
    careerStats: {
      totalGoals: number;
      totalAssists: number;
      trophies: { name: string; season: number }[];
    };
    form: number;
  };
  currentSeason: number;
}) {
  const retirementAge = calculateRetirementAge(player);

  // Short-term goals
  const shortTermGoals = useMemo(() => {
    const goals: { icon: React.ComponentType<{ className?: string }>; title: string; current: number; target: number; color: string }[] = [];
    const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
    const isDefender = ['CB', 'LB', 'RB', 'CDM'].includes(player.position);
    const isGK = player.position === 'GK';

    // OVR goal
    const ovrTarget = Math.min(player.overall + 5, player.potential);
    goals.push({
      icon: BarChart3,
      title: `Reach ${ovrTarget} OVR`,
      current: player.overall,
      target: ovrTarget,
      color: 'bg-emerald-500',
    });

    // Position-specific goal
    if (isAttacker) {
      const goalTarget = Math.max(10, player.seasonStats.goals + 5);
      goals.push({
        icon: Target,
        title: `Score ${goalTarget} Goals`,
        current: player.seasonStats.goals,
        target: goalTarget,
        color: 'bg-amber-500',
      });
      goals.push({
        icon: ArrowRight,
        title: `${Math.max(5, player.seasonStats.assists + 3)} Assists`,
        current: player.seasonStats.assists,
        target: Math.max(5, player.seasonStats.assists + 3),
        color: 'bg-cyan-500',
      });
    } else if (isGK) {
      goals.push({
        icon: Shield,
        title: `${Math.max(8, player.seasonStats.cleanSheets + 4)} Clean Sheets`,
        current: player.seasonStats.cleanSheets,
        target: Math.max(8, player.seasonStats.cleanSheets + 4),
        color: 'bg-amber-500',
      });
    } else {
      goals.push({
        icon: Target,
        title: `${Math.max(3, player.seasonStats.goals + 2)} Goals`,
        current: player.seasonStats.goals,
        target: Math.max(3, player.seasonStats.goals + 2),
        color: 'bg-amber-500',
      });
      goals.push({
        icon: ArrowRight,
        title: `${Math.max(5, player.seasonStats.assists + 3)} Assists`,
        current: player.seasonStats.assists,
        target: Math.max(5, player.seasonStats.assists + 3),
        color: 'bg-cyan-500',
      });
    }

    // Appearances goal
    goals.push({
      icon: Calendar,
      title: `Make ${Math.min(38, Math.max(20, player.seasonStats.appearances + 10))} Appearances`,
      current: player.seasonStats.appearances,
      target: Math.min(38, Math.max(20, player.seasonStats.appearances + 10)),
      color: 'bg-purple-500',
    });

    return goals;
  }, [player]);

  // Long-term ambitions
  const longTermAmbitions = useMemo(() => {
    const ambitions = [
      {
        icon: Shield,
        title: 'Become Club Captain',
        description:
          'Lead the team and earn the armband through consistent performances and leadership.',
        locked: player.age < 22 || player.overall < 75,
      },
      {
        icon: Trophy,
        title: 'Win League Title',
        description:
          'Lift the domestic league trophy with your club.',
        locked: false,
      },
      {
        icon: Globe,
        title: 'Earn International Callup',
        description:
          'Represent your country on the international stage.',
        locked: player.overall < 70,
      },
      {
        icon: Award,
        title: 'Win Continental Trophy',
        description:
          'Compete and win in the Champions League or Europa League.',
        locked: player.overall < 78,
      },
      {
        icon: Flag,
        title: `Retire at Age ${retirementAge}`,
        description: `Project your career to end around age ${retirementAge} based on your position and overall rating.`,
        locked: false,
      },
    ];
    return ambitions;
  }, [player, retirementAge]);

  // OVR Projection
  const projectedAge25 = Math.min(
    player.overall + Math.max(0, 25 - player.age) * Math.min(3, (player.potential - player.overall) / Math.max(1, 25 - player.age) + 0.5),
    player.potential
  );
  const projectedPeak = player.potential;
  const peakAge = player.age <= 25 ? 25 + Math.floor(Math.random() * 3) : player.age + 1;

  // SVG Bar Chart for OVR Projection
  const chartBars = [
    { label: `Current (Age ${player.age})`, value: player.overall, color: '#10b981' },
    { label: `Age 25`, value: Math.round(projectedAge25), color: '#06b6d4' },
    { label: `Peak (Age ${peakAge})`, value: projectedPeak, color: '#f59e0b' },
  ];
  const chartMax = 99;
  const chartW = 300;
  const chartH = 140;
  const barW = 50;
  const gap = (chartW - barW * chartBars.length) / (chartBars.length + 1);

  return (
    <div className="space-y-4">
      {/* Short-Term Goals */}
      <SectionCard title="Short-Term Goals (Next Season)" icon={Target}>
        <div className="space-y-3">
          {shortTermGoals.map((goal, idx) => {
            const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            const GoalIcon = goal.icon;
            return (
              <motion.div
                key={goal.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <GoalIcon className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                  <span className="text-xs font-medium text-[#c9d1d9]">
                    {goal.title}
                  </span>
                  <span className="text-[10px] text-[#8b949e] ml-auto">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 + idx * 0.04 }}
                    className={`h-full rounded-lg ${goal.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* OVR Projection Chart */}
      <SectionCard title="OVR Projection" icon={BarChart3} delay={0.1}>
        <div className="flex items-center justify-center">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full max-w-xs"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Y-axis gridlines */}
            {[0, 25, 50, 75].map((val) => {
              const y = chartH - 16 - (val / chartMax) * (chartH - 36);
              return (
                <g key={val}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartW}
                    y2={y}
                    stroke="#30363d"
                    strokeWidth={0.5}
                    strokeDasharray="4 2"
                  />
                  <text
                    x={2}
                    y={y - 3}
                    fill="#484f58"
                    fontSize={8}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {chartBars.map((bar, idx) => {
              const x = gap + idx * (barW + gap);
              const barH = (bar.value / chartMax) * (chartH - 36);
              const y = chartH - 16 - barH;

              return (
                <g key={bar.label}>
                  <motion.rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={bar.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    transition={{ duration: 0.2, delay: 0.15 + idx * 0.08 }}
                  />
                  {/* Value label */}
                  <motion.text
                    x={x + barW / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill="#c9d1d9"
                    fontSize={11}
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0.2 + idx * 0.08 }}
                  >
                    {bar.value}
                  </motion.text>
                  {/* X-axis label */}
                  <text
                    x={x + barW / 2}
                    y={chartH - 2}
                    textAnchor="middle"
                    fill="#8b949e"
                    fontSize={7}
                  >
                    {bar.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-4 mt-1">
          {chartBars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-1.5 text-[10px]">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: bar.color }}
              />
              <span className="text-[#8b949e]">{bar.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Long-Term Ambitions */}
      <SectionCard title="Long-Term Ambitions" icon={Trophy} delay={0.15}>
        <div className="space-y-3">
          {longTermAmbitions.map((ambition, idx) => {
            const AmbIcon = ambition.icon;
            return (
              <motion.div
                key={ambition.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.2 + idx * 0.04 }}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  ambition.locked
                    ? 'border-[#30363d] bg-[#21262d]/50 opacity-60'
                    : 'border-emerald-500/30 bg-emerald-500/5'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    ambition.locked
                      ? 'border-[#30363d] bg-[#21262d]'
                      : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}
                >
                  <AmbIcon
                    className={`h-4 w-4 ${
                      ambition.locked ? 'text-[#484f58]' : 'text-emerald-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-semibold ${
                        ambition.locked ? 'text-[#8b949e]' : 'text-[#c9d1d9]'
                      }`}
                    >
                      {ambition.title}
                    </p>
                    {ambition.locked && (
                      <Badge className="text-[8px] border-[#30363d] text-[#484f58] bg-[#21262d] px-1 py-0">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">
                    {ambition.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* Retirement Overview */}
      <SectionCard title="Retirement Outlook" icon={Flag} delay={0.25}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <span className="text-xl font-bold text-[#c9d1d9]">{retirementAge}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#c9d1d9]">
              Projected Retirement Age
            </p>
            <p className="text-xs text-[#8b949e] mt-0.5">
              {player.position === 'GK'
                ? 'Goalkeepers typically enjoy longer careers due to reduced physical demands.'
                : 'Based on your position and current overall rating.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Years Left</p>
            <p className="text-lg font-bold text-emerald-400">
              {Math.max(0, retirementAge - player.age)}
            </p>
            <p className="text-[9px] text-[#484f58]">estimated seasons</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Career Stage</p>
            <p className="text-lg font-bold text-[#c9d1d9]">
              {player.age <= 21
                ? 'Rising'
                : player.age <= 28
                  ? 'Prime'
                  : player.age <= 33
                    ? 'Veteran'
                    : 'Twilight'}
            </p>
            <p className="text-[9px] text-[#484f58]">current phase</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Career Goals</p>
            <p className="text-lg font-bold text-amber-400">
              {player.careerStats.totalGoals}
            </p>
            <p className="text-[9px] text-[#484f58]">total scored</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Trophies</p>
            <p className="text-lg font-bold text-amber-400">
              {player.careerStats.trophies.length}
            </p>
            <p className="text-[9px] text-[#484f58]">won so far</p>
          </div>
        </div>

        <div className="bg-[#21262d] rounded-lg p-3 mt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-[#c9d1d9]">Agent Advice</span>
          </div>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            {player.age <= 20
              ? 'Focus on rapid development. Training and first-team minutes are your priority over money. Your potential is your biggest asset.'
              : player.age <= 25
                ? 'You are entering your peak years. Prioritize playing time and exposure at the highest level possible. A big move now could define your career.'
                : player.age <= 30
                  ? 'Secure the best financial deal you can while maintaining peak performance. Consider squad role carefully — being a key player matters more than sitting on a bench at a bigger club.'
                  : 'Consider your legacy. A move to a new challenge or a final chapter at a club where you can be a leader could cap off a distinguished career.'}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Main Component — PlayerAgentHub
// ============================================================

export default function PlayerAgentHub() {
  const gameState = useGameStore((state) => state.gameState);
  const player = gameState?.player;
  const club = gameState?.currentClub;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;

  if (!gameState || !player || !club) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <p className="text-[#8b949e] text-sm">No active career found. Start a new game to access the Agent Hub.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-lg mx-auto px-4 pb-20">
        {/* Page Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-6 pb-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-[#c9d1d9]">Player Agent Hub</h1>
            <Badge className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              <Briefcase className="h-2.5 w-2.5 mr-1" />
              Agent Lvl {Math.floor(player.agentQuality / 10)}
            </Badge>
          </div>
          <p className="text-xs text-[#8b949e]">
            Manage your agent, contracts, transfers, and career planning.
          </p>
        </motion.header>

        {/* Tabs */}
        <Tabs defaultValue="agent-profile" className="space-y-4">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-xl h-10 p-1">
            <TabsTrigger
              value="agent-profile"
              className="flex-1 text-xs data-[state=active]:text-emerald-400 data-[state=active]:border-b-emerald-500 data-[state=active]:bg-[#0d1117] data-[state=active]:border-b-2"
            >
              <User className="h-3.5 w-3.5 mr-1" />
              Agent
            </TabsTrigger>
            <TabsTrigger
              value="contract-advice"
              className="flex-1 text-xs data-[state=active]:text-emerald-400 data-[state=active]:border-b-emerald-500 data-[state=active]:bg-[#0d1117] data-[state=active]:border-b-2"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Contract
            </TabsTrigger>
            <TabsTrigger
              value="transfer-talk"
              className="flex-1 text-xs data-[state=active]:text-emerald-400 data-[state=active]:border-b-emerald-500 data-[state=active]:bg-[#0d1117] data-[state=active]:border-b-2"
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1" />
              Transfers
            </TabsTrigger>
            <TabsTrigger
              value="career-plan"
              className="flex-1 text-xs data-[state=active]:text-emerald-400 data-[state=active]:border-b-emerald-500 data-[state=active]:bg-[#0d1117] data-[state=active]:border-b-2"
            >
              <Target className="h-3.5 w-3.5 mr-1" />
              Career
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent-profile">
            <AgentProfileTab agentQuality={player.agentQuality} />
          </TabsContent>

          <TabsContent value="contract-advice">
            <ContractAdviceTab player={player} club={club} />
          </TabsContent>

          <TabsContent value="transfer-talk">
            <TransferTalkTab
              player={player}
              currentWeek={currentWeek}
              currentClubId={club.id}
            />
          </TabsContent>

          <TabsContent value="career-plan">
            <CareerPlanTab
              player={player}
              currentSeason={currentSeason}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
