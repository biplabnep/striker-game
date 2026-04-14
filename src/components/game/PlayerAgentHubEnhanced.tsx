'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Briefcase, User, TrendingUp, DollarSign,
  Star, BarChart3, Activity, Zap, Target, Shield,
  Award, Clock, FileText, Handshake, Globe, Calendar,
  ChevronRight, Check, AlertCircle, Heart
} from 'lucide-react';

// ============================================================
// SVG Helper Functions — Rule 9: extract .map().join() from points
// ============================================================

function buildPointsString(pts: { x: number; y: number }[]): string {
  return pts.map(p => `${p.x},${p.y}`).join(' ');
}

function buildAreaPath(pts: { x: number; y: number }[], baseY: number): string {
  const lineSegments = pts.map(p => `L ${p.x},${p.y}`).join(' ');
  return `M ${pts[0].x},${baseY} ${lineSegments} L ${pts[pts.length - 1].x},${baseY} Z`;
}

function buildLinePath(pts: { x: number; y: number }[]): string {
  const lineSegments = pts.map(p => `L ${p.x},${p.y}`).join(' ');
  return `M ${pts[0].x},${pts[0].y} ${lineSegments}`;
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  const angleDiff = endAngleDeg - startAngleDeg;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;
  const sweepFlag = angleDiff > 0 ? 1 : 0;
  return `M ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2},${y2}`;
}

// ============================================================
// Format Helpers
// ============================================================

function formatMoney(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatWage(value: number): string {
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K/wk`;
  return `€${value}/wk`;
}

// ============================================================
// Static Data Constants — Plain variables (Rule 5: no useMemo)
// ============================================================

const AGENT_PROFILE = {
  name: 'Marco Silva',
  agency: 'Silva Sports Group',
  rating: 94,
  fee: 8,
  experienceYears: 18,
  clients: 52,
  stats: {
    negotiation: 94,
    marketKnowledge: 91,
    clientRelations: 96,
    legalExpertise: 88,
  },
};

const PRIORITY_TASKS = [
  { id: 't1', label: 'Review contract renewal offer', urgency: 'high', daysLeft: 3 },
  { id: 't2', label: 'Schedule meeting with club director', urgency: 'medium', daysLeft: 7 },
  { id: 't3', label: 'Evaluate new sponsor proposal', urgency: 'low', daysLeft: 14 },
];

const RECENT_ACTIVITY = [
  { id: 'a1', text: 'Negotiated 15% wage increase with board', time: '2 hours ago', type: 'success' },
  { id: 'a2', text: 'Scouted 3 potential destination clubs', time: '1 day ago', type: 'info' },
  { id: 'a3', text: 'Submitted image rights proposal', time: '2 days ago', type: 'info' },
  { id: 'a4', text: 'Reviewed performance bonus clauses', time: '3 days ago', type: 'success' },
  { id: 'a5', text: 'Contacted Nike for boot renewal', time: '5 days ago', type: 'info' },
];

const REVENUE_DATA = [
  { season: 1, amount: 120000 },
  { season: 2, amount: 185000 },
  { season: 3, amount: 240000 },
  { season: 4, amount: 310000 },
  { season: 5, amount: 385000 },
  { season: 6, amount: 460000 },
];

const PORTFOLIO_SEGMENTS = [
  { label: 'Your Contract', value: 420000, color: '#10b981' },
  { label: 'Transfers', value: 180000, color: '#38bdf8' },
  { label: 'Sponsors', value: 95000, color: '#fbbf24' },
  { label: 'Other', value: 35000, color: '#a855f7' },
];

const CONTRACT_HISTORY_ENTRIES = [
  { id: 'ch1', type: 'Youth Contract', age: 16, club: 'Academy', wage: 500, period: '2019-2021', agent: 'Youth Liaison' },
  { id: 'ch2', type: 'First Professional', age: 18, club: 'FC Northbrook', wage: 8000, period: '2021-2023', agent: 'Junior Agency' },
  { id: 'ch3', type: 'Improved Deal', age: 20, club: 'FC Northbrook', wage: 28000, period: '2023-2025', agent: 'Marco Silva' },
  { id: 'ch4', type: 'Big Move', age: 21, club: 'Striker City FC', wage: 75000, period: '2025-2028', agent: 'Marco Silva' },
  { id: 'ch5', type: 'Current', age: 22, club: 'Striker City FC', wage: 95000, period: '2026-2029', agent: 'Marco Silva' },
];

const CLAUSE_DATA = [
  { label: 'Release Clause', importance: 92, color: '#ef4444' },
  { label: 'Signing Bonus', importance: 85, color: '#10b981' },
  { label: 'Loyalty Bonus', importance: 68, color: '#38bdf8' },
  { label: 'Image Rights', importance: 74, color: '#fbbf24' },
  { label: 'Buyout Clause', importance: 88, color: '#a855f7' },
];

const COMPARISON_OFFERS = [
  { id: 'co1', club: 'Madrid United', wage: 130000, bonus: 5000000, years: 4, rating: 'Excellent' },
  { id: 'co2', club: 'London Rangers', wage: 110000, bonus: 3500000, years: 3, rating: 'Good' },
  { id: 'co3', club: 'Bayern FC', wage: 125000, bonus: 4500000, years: 5, rating: 'Excellent' },
];

const WAGE_PROGRESSION = [
  { age: 17, wage: 2000 },
  { age: 18, wage: 8000 },
  { age: 19, wage: 15000 },
  { age: 20, wage: 28000 },
  { age: 21, wage: 75000 },
];

const TRANSFER_STRATEGIES = [
  { id: 'ts1', label: 'Stay & Develop', desc: 'Remain at current club to reach full potential', risk: 'Low', icon: Shield, color: 'emerald' },
  { id: 'ts2', label: 'Loan Move', desc: 'Gain experience at a higher-level club temporarily', risk: 'Medium', icon: ArrowLeft, color: 'cyan' },
  { id: 'ts3', label: 'Permanent Transfer', desc: 'Secure a big-money move to a top club', risk: 'High', icon: Globe, color: 'amber' },
  { id: 'ts4', label: 'Free Transfer', desc: 'Wait for contract expiry and negotiate freely', risk: 'Medium', icon: Handshake, color: 'purple' },
];

const TARGET_CLUBS = [
  { id: 'tc1', name: 'Madrid United', league: 'La Liga', interest: 92, budget: '€120M' },
  { id: 'tc2', name: 'London Rangers', league: 'Premier League', interest: 85, budget: '€95M' },
  { id: 'tc3', name: 'Bayern FC', league: 'Bundesliga', interest: 78, budget: '€80M' },
  { id: 'tc4', name: 'Paris Olympique', league: 'Ligue 1', interest: 71, budget: '€110M' },
  { id: 'tc5', name: 'Milan United', league: 'Serie A', interest: 65, budget: '€60M' },
  { id: 'tc6', name: 'Porto Athletic', league: 'Primeira Liga', interest: 48, budget: '€35M' },
];

const MARKET_VALUE_MONTHS = [
  { month: 'Jan', value: 12.5 },
  { month: 'Feb', value: 13.2 },
  { month: 'Mar', value: 14.8 },
  { month: 'Apr', value: 14.1 },
  { month: 'May', value: 15.5 },
  { month: 'Jun', value: 16.2 },
  { month: 'Jul', value: 17.0 },
  { month: 'Aug', value: 18.5 },
  { month: 'Sep', value: 19.2 },
  { month: 'Oct', value: 20.1 },
  { month: 'Nov', value: 21.5 },
  { month: 'Dec', value: 22.8 },
];

const CAREER_TIMELINE = [
  { id: 'ct1', year: 2025, label: 'Breakout Season', desc: 'Become first-team regular', status: 'current' },
  { id: 'ct2', year: 2026, label: 'National Team', desc: 'Earn first international cap', status: 'upcoming' },
  { id: 'ct3', year: 2027, label: 'Champions League', desc: 'Debut in European competition', status: 'future' },
  { id: 'ct4', year: 2028, label: 'Big Transfer', desc: 'Move to a top-5 European league', status: 'future' },
  { id: 'ct5', year: 2030, label: 'Captain', desc: 'Become club captain', status: 'future' },
];

const MILESTONE_TARGETS = [
  { id: 'mt1', label: 'National Team Debut', current: 0, target: 1, color: '#ef4444' },
  { id: 'mt2', label: 'Champions League Goal', current: 0, target: 1, color: '#38bdf8' },
  { id: 'mt3', label: '100 Career Caps', current: 47, target: 100, color: '#fbbf24' },
  { id: 'mt4', label: 'Golden Boot Award', current: 0, target: 1, color: '#a855f7' },
];

const ALTERNATIVE_PATHS = [
  { id: 'ap1', title: 'Stay at Current Club', desc: 'Build legacy as a one-club legend. Focus on domestic titles and long-term loyalty.', suitability: 72 },
  { id: 'ap2', title: 'Multi-League Journey', desc: 'Experience different football cultures across 4-5 top European leagues.', suitability: 85 },
  { id: 'ap3', title: 'Early Retirement & Coaching', desc: 'Retire at 32 and transition into management with coaching badges.', suitability: 58 },
];

// ============================================================
// Outer Sub-Components (defined outside main, start uppercase)
// ============================================================

function StatBarRow({
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

function InnerCard({
  title,
  icon: IconComp,
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
        <IconComp className="h-4 w-4 text-emerald-400" />
        {title}
      </div>
      {children}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PlayerAgentHubEnhanced(): React.JSX.Element {
  // ---- ALL hooks before conditional returns (Rule 7) ----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  // Null-safe Zustand data access (Rule 14)
  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as Record<string, unknown>);
  const playerName = playerData?.name ?? 'Your Player';
  const teamName = (currentClub?.name as string) ?? 'Your Club';
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;

  // Derived data — plain variables (Rule 5: no useMemo on constants)
  const agent = AGENT_PROFILE;
  const contract = playerData?.contract ?? {
    weeklyWage: 95000,
    yearsRemaining: 3,
    signingBonus: 5000000,
    releaseClause: 65000000,
  };

  const renewalProbability = contract.yearsRemaining >= 3 ? 82 : contract.yearsRemaining >= 2 ? 65 : 35;

  const transferReadiness = useMemo(() => {
    const baseRating = playerData?.overall ?? 72;
    const ageFactor = playerData?.age ?? 21;
    const formBonus = (playerData?.form ?? 7.0) * 2;
    return Math.min(Math.round(baseRating * 0.6 + ageFactor * 0.8 + formBonus), 99);
  }, [playerData?.overall, playerData?.age, playerData?.form]);

  // Portfolio total via reduce (Rule 6: use reduce, not let accumulation)
  const portfolioTotal = PORTFOLIO_SEGMENTS.reduce(
    (runningTotal, seg) => runningTotal + seg.value,
    0
  );

  const handleBack = useCallback(() => {
    setScreen('dashboard');
  }, [setScreen]);

  // ---- Conditional return AFTER all hooks (Rule 7) ----
  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e]">No game state found.</p>
      </div>
    );
  }

  // ============================================================
  // Tab 1 — Agent Dashboard (camelCase render function, Rule 13)
  // ============================================================

  function agentDashboard(): React.JSX.Element {
    return (
      <div className="space-y-4">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Agent Rating</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{agent.rating}</p>
            <p className="text-[9px] text-[#484f58]">Elite Tier</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatMoney(portfolioTotal)}</p>
            <p className="text-[9px] text-[#484f58]">This Year</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Active Tasks</p>
            <p className="text-xl font-bold text-sky-400 mt-1">{PRIORITY_TASKS.length}</p>
            <p className="text-[9px] text-[#484f58]">Pending</p>
          </div>
        </div>

        {/* Agent Profile Card */}
        <InnerCard title="Agent Profile" icon={Briefcase}>
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                <circle cx="24" cy="12" r="6" fill="#8b949e" />
                <path d="M16 20 L24 18 L32 20 L34 38 L14 38 Z" fill="#30363d" stroke="#8b949e" strokeWidth="1.2" />
                <path d="M24 20 L22 28 L24 30 L26 28 L24 20Z" fill="#10b981" />
                <path d="M20 19 L24 22 L28 19" fill="none" stroke="#c9d1d9" strokeWidth="0.8" />
                <line x1="24" y1="22" x2="24" y2="30" stroke="#c9d1d9" strokeWidth="0.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#c9d1d9] text-base">{agent.name}</span>
                <Badge className="text-[10px] border border-amber-500/30 text-amber-400 bg-transparent">
                  Rating {agent.rating}
                </Badge>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">{agent.agency}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {agent.experienceYears} yrs
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {agent.clients} clients
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {agent.fee}% fee
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-2">
            <StatBarRow label="Negotiation" value={agent.stats.negotiation} color="bg-emerald-500" delay={0.05} />
            <StatBarRow label="Market Knowledge" value={agent.stats.marketKnowledge} color="bg-sky-500" delay={0.08} />
            <StatBarRow label="Client Relations" value={agent.stats.clientRelations} color="bg-amber-500" delay={0.11} />
            <StatBarRow label="Legal Expertise" value={agent.stats.legalExpertise} color="bg-purple-500" delay={0.14} />
          </div>
        </InnerCard>

        {/* Current Contract Summary */}
        <InnerCard title="Current Contract Summary" icon={FileText} delay={0.05}>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Club</p>
              <p className="text-sm font-bold text-[#c9d1d9] mt-0.5">{teamName}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Weekly Wage</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatWage(contract.weeklyWage)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Years Left</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">
                {contract.yearsRemaining} yr{contract.yearsRemaining !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Release Clause</p>
              <p className="text-sm font-bold text-[#c9d1d9] mt-0.5">
                {contract.releaseClause ? formatMoney(contract.releaseClause) : 'None'}
              </p>
            </div>
          </div>
        </InnerCard>

        {/* SVG Agent Skill Radar */}
        <InnerCard title="Agent Skill Radar" icon={Activity} delay={0.1}>
          <svg viewBox="0 0 300 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" className="text-[10px]" fill="#8b949e" fontSize="10">
              Agent Skill Assessment
            </text>
            {/* Grid rings */}
            {[
              { r: 30, opacity: 0.08 },
              { r: 60, opacity: 0.1 },
              { r: 90, opacity: 0.12 },
            ].map((ring, ringIdx) => (
              <circle
                key={ringIdx}
                cx="150"
                cy="120"
                r={ring.r}
                fill="none"
                stroke="#484f58"
                strokeDasharray="4 4"
                opacity={ring.opacity}
              />
            ))}
            {/* Axis lines for 4 directions */}
            {[
              { x: 150, y: 30 },
              { x: 240, y: 120 },
              { x: 150, y: 210 },
              { x: 60, y: 120 },
            ].map((pt, ptIdx) => (
              <line
                key={ptIdx}
                x1="150"
                y1="120"
                x2={pt.x}
                y2={pt.y}
                stroke="#484f58"
                strokeDasharray="4 4"
                opacity={0.15}
              />
            ))}
            {/* Axis labels */}
            <text x="150" y="24" textAnchor="middle" fill="#c9d1d9" fontSize="11">Negotiation</text>
            <text x="252" y="124" textAnchor="start" fill="#c9d1d9" fontSize="11">Market</text>
            <text x="150" y="224" textAnchor="middle" fill="#c9d1d9" fontSize="11">Relations</text>
            <text x="48" y="124" textAnchor="end" fill="#c9d1d9" fontSize="11">Legal</text>
            {/* Data polygon */}
            {(() => {
              const values = [agent.stats.negotiation, agent.stats.marketKnowledge, agent.stats.clientRelations, agent.stats.legalExpertise];
              const dataPoints = values.map((val, idx) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * idx) / 4;
                const factor = val / 100;
                return {
                  x: 150 + 90 * factor * Math.cos(angle),
                  y: 120 + 90 * factor * Math.sin(angle),
                };
              });
              const radarString = buildPointsString(dataPoints);
              return (
                <g>
                  <polygon
                    points={radarString}
                    fill="#10b981"
                    fillOpacity={0.15}
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  {dataPoints.map((dot, dotIdx) => (
                    <circle
                      key={dotIdx}
                      cx={dot.x}
                      cy={dot.y}
                      r="4"
                      fill="#10b981"
                      stroke="#0d1117"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG Agent Revenue Trend */}
        <InnerCard title="Agent Revenue Trend" icon={TrendingUp} delay={0.15}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-emerald-400">
              {formatMoney(REVENUE_DATA[REVENUE_DATA.length - 1].amount)}
            </span>
            <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              +21% YoY
            </Badge>
          </div>
          <svg viewBox="0 0 300 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[40, 80, 120].map((gy, gIdx) => (
              <line
                key={gIdx}
                x1="40"
                y1={gy}
                x2="280"
                y2={gy}
                stroke="#484f58"
                strokeDasharray="4 4"
                opacity={0.15}
              />
            ))}
            {/* Data area + line */}
            {(() => {
              const amounts = REVENUE_DATA.map(d => d.amount);
              const maxAmt = Math.max(...amounts);
              const minAmt = Math.min(...amounts);
              const range = maxAmt - minAmt || 1;
              const dataPoints = amounts.map((a, i) => ({
                x: 40 + (i / (amounts.length - 1)) * 240,
                y: 130 - ((a - minAmt) / range) * 100,
              }));
              const areaPathStr = buildAreaPath(dataPoints, 140);
              const linePathStr = buildLinePath(dataPoints);
              const pointsStr = buildPointsString(dataPoints);
              return (
                <g>
                  <path d={areaPathStr} fill="#10b981" fillOpacity={0.1} />
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {dataPoints.map((dp, dpIdx) => (
                    <circle key={dpIdx} cx={dp.x} cy={dp.y} r="3" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {/* Labels */}
                  {REVENUE_DATA.map((rd, lIdx) => {
                    const lx = 40 + (lIdx / (REVENUE_DATA.length - 1)) * 240;
                    return (
                      <text key={lIdx} x={lx} y="155" textAnchor="middle" fill="#8b949e" fontSize="10">
                        S{rd.season}
                      </text>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG Client Portfolio Donut */}
        <InnerCard title="Client Portfolio Breakdown" icon={BarChart3} delay={0.2}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Donut segments via stroke-dasharray */}
            {(() => {
              const cx = 120;
              const cy = 90;
              const outerR = 70;
              const innerR = 45;
              const circumference = 2 * Math.PI * outerR;
              // Use reduce to compute cumulative offsets (Rule 6: no let accumulation)
              const computedSegments = PORTFOLIO_SEGMENTS.reduce(
                (acc, seg) => {
                  const prevOffset = acc.length === 0 ? 0 : acc[acc.length - 1].nextOffset;
                  const fraction = seg.value / portfolioTotal;
                  const dashLen = fraction * circumference;
                  const gapLen = circumference - dashLen;
                  return [
                    ...acc,
                    {
                      ...seg,
                      dashLen,
                      gapLen,
                      rotation: prevOffset * 360 - 90,
                      nextOffset: prevOffset + fraction,
                    },
                  ];
                },
                [] as Array<{ label: string; value: number; color: string; dashLen: number; gapLen: number; rotation: number; nextOffset: number }>
              );
              return (
                <g>
                  {/* Outer donut ring — background */}
                  <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#21262d" strokeWidth={outerR - innerR} />
                  {/* Segments */}
                  {computedSegments.map((seg, sIdx) => (
                    <circle
                      key={sIdx}
                      cx={cx}
                      cy={cy}
                      r={outerR}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={outerR - innerR}
                      strokeDasharray={`${seg.dashLen} ${seg.gapLen}`}
                      transform={`rotate(${seg.rotation} ${cx} ${cy})`}
                      opacity={0.85}
                    />
                  ))}
                  {/* Center text */}
                  <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="13" fontWeight="bold">
                    {formatMoney(portfolioTotal)}
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="9">
                    Total Revenue
                  </text>
                  {/* Legend */}
                  {PORTFOLIO_SEGMENTS.map((seg, lgIdx) => {
                    const ly = 35 + lgIdx * 28;
                    return (
                      <g key={lgIdx}>
                        <rect x="210" y={ly - 8} width="12" height="12" rx="3" fill={seg.color} opacity={0.85} />
                        <text x="228" y={ly + 2} fill="#c9d1d9" fontSize="11">{seg.label}</text>
                        <text x="228" y={ly + 14} fill="#8b949e" fontSize="9">{formatMoney(seg.value)}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* Priority Tasks */}
        <InnerCard title="Priority Tasks" icon={Zap} delay={0.25}>
          <div className="space-y-2">
            {PRIORITY_TASKS.map((task, tIdx) => {
              const urgencyStyle =
                task.urgency === 'high'
                  ? 'text-red-400 border-red-500/30 bg-red-500/10'
                  : task.urgency === 'medium'
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-[#8b949e] border-[#30363d] bg-[#21262d]';
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.3 + tIdx * 0.04 }}
                  className="flex items-center gap-3 bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
                >
                  <AlertCircle className="h-4 w-4 text-[#8b949e] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#c9d1d9] truncate">{task.label}</p>
                    <p className="text-[10px] text-[#484f58]">{task.daysLeft} days remaining</p>
                  </div>
                  <Badge className={`text-[9px] border ${urgencyStyle}`}>{task.urgency}</Badge>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Recent Activity */}
        <InnerCard title="Recent Activity" icon={Activity} delay={0.3}>
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((act, aIdx) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.35 + aIdx * 0.03 }}
                className="flex items-start gap-2.5 text-xs"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-sm shrink-0 ${act.type === 'success' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[#c9d1d9] leading-relaxed">{act.text}</p>
                  <p className="text-[10px] text-[#484f58] mt-0.5">{act.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 2 — Contract Management (camelCase render function)
  // ============================================================

  function contractManagement(): React.JSX.Element {
    // Contract health assessment
    const contractHealth = contract.yearsRemaining >= 3
      ? { label: 'Secure', desc: 'Your contract is in excellent shape.', color: 'emerald' }
      : contract.yearsRemaining >= 2
        ? { label: 'Good', desc: 'Consider starting extension talks next season.', color: 'sky' }
        : contract.yearsRemaining >= 1
          ? { label: 'Expiring Soon', desc: 'Begin renewal negotiations immediately.', color: 'amber' }
          : { label: 'Critical', desc: 'Urgent — explore free transfer options.', color: 'red' };

    return (
      <div className="space-y-4">
        {/* Contract Health Overview */}
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${
          contractHealth.color === 'emerald'
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : contractHealth.color === 'sky'
              ? 'border-sky-500/30 bg-sky-500/10'
              : contractHealth.color === 'amber'
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-red-500/30 bg-red-500/10'
        }`}>
          <Shield className={`h-6 w-6 ${
            contractHealth.color === 'emerald'
              ? 'text-emerald-400'
              : contractHealth.color === 'sky'
                ? 'text-sky-400'
                : contractHealth.color === 'amber'
                  ? 'text-amber-400'
                  : 'text-red-400'
          }`} />
          <div>
            <p className={`text-sm font-bold ${
              contractHealth.color === 'emerald'
                ? 'text-emerald-400'
                : contractHealth.color === 'sky'
                  ? 'text-sky-400'
                  : contractHealth.color === 'amber'
                    ? 'text-amber-400'
                    : 'text-red-400'
            }`}>
              {contractHealth.label}
            </p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">{contractHealth.desc}</p>
          </div>
        </div>

        {/* Current Contract Details */}
        <InnerCard title="Contract Details" icon={FileText}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#c9d1d9]">{teamName}</p>
              <p className="text-[10px] text-[#8b949e]">Professional Contract</p>
            </div>
            <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Active
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Weekly Wage</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">{formatWage(contract.weeklyWage)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Expiry</p>
              <p className="text-base font-bold text-amber-400 mt-0.5">
                {2024 + (contract.yearsRemaining ?? 0)}
              </p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Signing Bonus</p>
              <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
                {contract.signingBonus ? formatMoney(contract.signingBonus) : 'N/A'}
              </p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Release Clause</p>
              <p className="text-base font-bold text-red-400 mt-0.5">
                {contract.releaseClause ? formatMoney(contract.releaseClause) : 'None'}
              </p>
            </div>
          </div>
        </InnerCard>

        {/* Contract History */}
        <InnerCard title="Contract History" icon={Clock} delay={0.05}>
          <div className="space-y-0">
            {CONTRACT_HISTORY_ENTRIES.map((entry, eIdx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.1 + eIdx * 0.04 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-sm border-2 shrink-0 ${
                      entry.type === 'Current'
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-[#21262d] border-[#484f58]'
                    }`}
                  />
                  {eIdx < CONTRACT_HISTORY_ENTRIES.length - 1 && (
                    <div className="w-px flex-1 bg-[#30363d] min-h-[8px]" />
                  )}
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${entry.type === 'Current' ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {entry.type}
                    </span>
                    <Badge className="text-[9px] border border-[#30363d] text-[#8b949e] bg-[#21262d]">
                      Age {entry.age}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">
                    {entry.club} · {entry.period}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-emerald-400 font-medium">{formatWage(entry.wage)}</span>
                    <span className="text-[10px] text-[#484f58]">Agent: {entry.agent}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </InnerCard>

        {/* Renewal Status */}
        <InnerCard title="Renewal Status" icon={Heart} delay={0.1}>
          <div className={`flex items-center gap-3 rounded-lg border p-3 ${
            renewalProbability >= 70
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : renewalProbability >= 40
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-red-500/30 bg-red-500/10'
          }`}>
            <Check className={`h-5 w-5 ${renewalProbability >= 70 ? 'text-emerald-400' : renewalProbability >= 40 ? 'text-amber-400' : 'text-red-400'}`} />
            <div>
              <p className={`text-sm font-bold ${renewalProbability >= 70 ? 'text-emerald-400' : renewalProbability >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {renewalProbability >= 70 ? 'Strong Renewal Outlook' : renewalProbability >= 40 ? 'Moderate Chances' : 'At Risk'}
              </p>
              <p className="text-[11px] text-[#8b949e] mt-0.5">
                {contract.yearsRemaining > 2
                  ? `${contract.yearsRemaining} years left — favorable negotiation window`
                  : `${contract.yearsRemaining} year${contract.yearsRemaining !== 1 ? 's' : ''} remaining — action needed`}
              </p>
            </div>
          </div>
        </InnerCard>

        {/* SVG Wage Progression Line Chart */}
        <InnerCard title="Wage Progression" icon={TrendingUp} delay={0.15}>
          <svg viewBox="0 0 300 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[30, 70, 110].map((gy, gIdx) => (
              <line
                key={gIdx}
                x1="40"
                y1={gy}
                x2="280"
                y2={gy}
                stroke="#484f58"
                strokeDasharray="4 4"
                opacity={0.15}
              />
            ))}
            {(() => {
              const wages = WAGE_PROGRESSION.map(w => w.wage);
              const maxW = Math.max(...wages);
              const minW = Math.min(...wages);
              const wageRange = maxW - minW || 1;
              const dataPoints = wages.map((w, i) => ({
                x: 40 + (i / (wages.length - 1)) * 240,
                y: 130 - ((w - minW) / wageRange) * 100,
              }));
              const areaPathStr = buildAreaPath(dataPoints, 140);
              const pointsStr = buildPointsString(dataPoints);
              return (
                <g>
                  <path d={areaPathStr} fill="#38bdf8" fillOpacity={0.1} />
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {dataPoints.map((dp, dpIdx) => (
                    <g key={dpIdx}>
                      <circle cx={dp.x} cy={dp.y} r="3.5" fill="#38bdf8" stroke="#0d1117" strokeWidth="1.5" />
                      <text x={dp.x} y={dp.y - 8} textAnchor="middle" fill="#38bdf8" fontSize="9">
                        {formatWage(wages[dpIdx])}
                      </text>
                    </g>
                  ))}
                  {WAGE_PROGRESSION.map((wp, lblIdx) => {
                    const lx = 40 + (lblIdx / (WAGE_PROGRESSION.length - 1)) * 240;
                    return (
                      <text key={lblIdx} x={lx} y="155" textAnchor="middle" fill="#8b949e" fontSize="10">
                        Age {wp.age}
                      </text>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG Contract Clause Bars */}
        <InnerCard title="Contract Clause Importance" icon={Award} delay={0.2}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const barMaxWidth = 180;
              const barHeight = 18;
              const startY = 15;
              const gap = 30;
              return CLAUSE_DATA.map((clause, cIdx) => {
                const barWidth = (clause.importance / 100) * barMaxWidth;
                const yPos = startY + cIdx * gap;
                return (
                  <g key={cIdx}>
                    <text x="10" y={yPos + 4} fill="#c9d1d9" fontSize="11">{clause.label}</text>
                    <rect x="120" y={yPos - 10} width={barMaxWidth} height={barHeight} rx="4" fill="#21262d" />
                    <motion.rect
                      x="120"
                      y={yPos - 10}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={clause.color}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.85 }}
                      transition={{ duration: 0.3, delay: 0.1 + cIdx * 0.08 }}
                    />
                    <text x={120 + barMaxWidth + 8} y={yPos + 4} fill="#c9d1d9" fontSize="11" fontWeight="bold">
                      {clause.importance}
                    </text>
                  </g>
                );
              });
            })()}
          </svg>
        </InnerCard>

        {/* SVG Renewal Probability Gauge */}
        <InnerCard title="Renewal Probability" icon={Target} delay={0.25}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const cx = 150;
              const cy = 150;
              const radius = 110;
              const startAngle = 180;
              const endAngle = 360;
              // Background arc
              const bgArc = describeArc(cx, cy, radius, startAngle, endAngle);
              // Value arc
              const valueAngle = startAngle + (renewalProbability / 100) * (endAngle - startAngle);
              const valueArc = describeArc(cx, cy, radius, startAngle, valueAngle);
              const gaugeColor = renewalProbability >= 70 ? '#10b981' : renewalProbability >= 40 ? '#fbbf24' : '#ef4444';
              return (
                <g>
                  {/* Background arc */}
                  <path d={bgArc} fill="none" stroke="#21262d" strokeWidth="18" strokeLinecap="round" />
                  {/* Value arc */}
                  <motion.path
                    d={valueArc}
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="18"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                  {/* Center text */}
                  <text x={cx} y={cy - 20} textAnchor="middle" fill={gaugeColor} fontSize="28" fontWeight="bold">
                    {renewalProbability}%
                  </text>
                  <text x={cx} y={cy} textAnchor="middle" fill="#8b949e" fontSize="11">
                    Renewal Likelihood
                  </text>
                  {/* Scale labels */}
                  <text x="40" y={cy - 8} textAnchor="middle" fill="#8b949e" fontSize="10">0</text>
                  <text x={cx} y="30" textAnchor="middle" fill="#8b949e" fontSize="10">50</text>
                  <text x="260" y={cy - 8} textAnchor="middle" fill="#8b949e" fontSize="10">100</text>
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* Contract Comparison Offers */}
        <InnerCard title="Comparison Offers" icon={BarChart3} delay={0.3}>
          <div className="space-y-2">
            {COMPARISON_OFFERS.map((offer, oIdx) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.35 + oIdx * 0.04 }}
                className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{offer.club}</span>
                  <Badge className={`text-[9px] border ${
                    offer.rating === 'Excellent'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  }`}>
                    {offer.rating}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-[#8b949e]">Wage</span>
                    <p className="text-xs font-medium text-emerald-400">{formatWage(offer.wage)}</p>
                  </div>
                  <div>
                    <span className="text-[#8b949e]">Bonus</span>
                    <p className="text-xs font-medium text-[#c9d1d9]">{formatMoney(offer.bonus)}</p>
                  </div>
                  <div>
                    <span className="text-[#8b949e]">Years</span>
                    <p className="text-xs font-medium text-[#c9d1d9]">{offer.years}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 3 — Transfer Strategy (camelCase render function)
  // ============================================================

  function transferStrategy(): React.JSX.Element {
    const windowOpen = currentWeek <= 12 || (currentWeek >= 25 && currentWeek <= 28);
    const weeksInWindow = windowOpen
      ? Math.max(0, currentWeek <= 12 ? 12 - currentWeek + 1 : 28 - currentWeek + 1)
      : 0;

    return (
      <div className="space-y-4">
        {/* Transfer Strategy Cards */}
        <InnerCard title="Transfer Strategy" icon={Handshake}>
          <div className="grid grid-cols-2 gap-2">
            {TRANSFER_STRATEGIES.map((strat, sIdx) => {
              const isSelected = selectedStrategy === strat.id;
              const IconComp = strat.icon;
              const borderColor = isSelected
                ? strat.color === 'emerald'
                  ? 'border-emerald-500/50'
                  : strat.color === 'cyan'
                    ? 'border-cyan-500/50'
                    : strat.color === 'amber'
                      ? 'border-amber-500/50'
                      : 'border-purple-500/50'
                : 'border-[#30363d]';
              return (
                <motion.button
                  key={strat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.05 + sIdx * 0.05 }}
                  onClick={() => setSelectedStrategy(isSelected ? null : strat.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${borderColor} bg-[#21262d] hover:bg-[#30363d]`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      strat.color === 'emerald'
                        ? 'bg-emerald-500/15'
                        : strat.color === 'cyan'
                          ? 'bg-cyan-500/15'
                          : strat.color === 'amber'
                            ? 'bg-amber-500/15'
                            : 'bg-purple-500/15'
                    }`}>
                      <IconComp className={`h-4 w-4 ${
                        strat.color === 'emerald'
                          ? 'text-emerald-400'
                          : strat.color === 'cyan'
                            ? 'text-cyan-400'
                            : strat.color === 'amber'
                              ? 'text-amber-400'
                              : 'text-purple-400'
                      }`} />
                    </div>
                    <Badge className={`text-[9px] border ${
                      strat.risk === 'Low'
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : strat.risk === 'Medium'
                          ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                          : 'border-red-500/30 text-red-400 bg-red-500/10'
                    }`}>
                      {strat.risk}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-[#c9d1d9]">{strat.label}</p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{strat.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </InnerCard>

        {/* Transfer Window Countdown */}
        <InnerCard title="Transfer Window" icon={Clock} delay={0.05}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              windowOpen
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[#21262d] border-[#30363d]'
            }`}>
              <Clock className={`h-6 w-6 ${windowOpen ? 'text-emerald-400' : 'text-[#8b949e]'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${windowOpen ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                {windowOpen ? 'Window Open' : 'Window Closed'}
              </p>
              <p className="text-xs text-[#8b949e]">
                {windowOpen
                  ? `${weeksInWindow} week${weeksInWindow !== 1 ? 's' : ''} remaining`
                  : `Week ${currentWeek} / 38`}
              </p>
            </div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3 space-y-2 mt-2">
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Season Progress</span>
              <span>Week {currentWeek} / 38</span>
            </div>
            <div className="h-2 bg-[#0d1117] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="h-full rounded-lg bg-emerald-500"
                style={{ width: `${(currentWeek / 38) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#484f58]">
              <span>Summer (Wk 1-12)</span>
              <span>Winter (Wk 25-28)</span>
            </div>
          </div>
        </InnerCard>

        {/* SVG Transfer Interest Bars */}
        <InnerCard title="Club Interest Levels" icon={BarChart3} delay={0.1}>
          <svg viewBox="0 0 300 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const barMaxW = 140;
              const barH = 16;
              const startY = 10;
              const gap = 34;
              return TARGET_CLUBS.map((club, bIdx) => {
                const barW = (club.interest / 100) * barMaxW;
                const yPos = startY + bIdx * gap;
                const barColor = club.interest >= 80 ? '#10b981' : club.interest >= 60 ? '#38bdf8' : '#fbbf24';
                return (
                  <g key={bIdx}>
                    <text x="5" y={yPos + 4} fill="#c9d1d9" fontSize="10" fontWeight="bold">{club.name}</text>
                    <text x="5" y={yPos + 15} fill="#8b949e" fontSize="9">{club.league}</text>
                    <rect x="130" y={yPos - 8} width={barMaxW} height={barH} rx="4" fill="#21262d" />
                    <motion.rect
                      x="130"
                      y={yPos - 8}
                      width={barW}
                      height={barH}
                      rx="4"
                      fill={barColor}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 0.3, delay: 0.05 + bIdx * 0.06 }}
                    />
                    <text x={130 + barMaxW + 6} y={yPos + 4} fill={barColor} fontSize="10" fontWeight="bold">
                      {club.interest}%
                    </text>
                  </g>
                );
              });
            })()}
          </svg>
        </InnerCard>

        {/* Target Clubs List */}
        <InnerCard title="Target Clubs" icon={Globe} delay={0.15}>
          <div className="space-y-2">
            {TARGET_CLUBS.map((club, cIdx) => {
              const interestColor =
                club.interest >= 80
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : club.interest >= 60
                    ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10';
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.2 + cIdx * 0.04 }}
                  className="flex items-center gap-3 bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-sm">
                    {String(cIdx + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#c9d1d9]">{club.name}</p>
                    <p className="text-[10px] text-[#8b949e]">{club.league} · Budget: {club.budget}</p>
                  </div>
                  <Badge className={`text-[9px] border ${interestColor}`}>
                    {club.interest}%
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-[#484f58]" />
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* SVG Market Value Trend */}
        <InnerCard title="Market Value Trend" icon={TrendingUp} delay={0.2}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-emerald-400">
              €{MARKET_VALUE_MONTHS[MARKET_VALUE_MONTHS.length - 1].value}M
            </span>
            <Badge className="text-[10px] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              +82.4% YTD
            </Badge>
          </div>
          <svg viewBox="0 0 300 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            {[40, 80, 120].map((gy, gIdx) => (
              <line key={gIdx} x1="30" y1={gy} x2="290" y2={gy} stroke="#484f58" strokeDasharray="4 4" opacity={0.15} />
            ))}
            {(() => {
              const values = MARKET_VALUE_MONTHS.map(m => m.value);
              const maxVal = Math.max(...values);
              const minVal = Math.min(...values);
              const valRange = maxVal - minVal || 1;
              const chartPoints = values.map((v, i) => ({
                x: 30 + (i / (values.length - 1)) * 260,
                y: 130 - ((v - minVal) / valRange) * 100,
              }));
              const areaPathStr = buildAreaPath(chartPoints, 140);
              const pointsStr = buildPointsString(chartPoints);
              return (
                <g>
                  <path d={areaPathStr} fill="#10b981" fillOpacity={0.1} />
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartPoints.map((cp, cpIdx) => (
                    <circle key={cpIdx} cx={cp.x} cy={cp.y} r="2.5" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {MARKET_VALUE_MONTHS.map((mv, mIdx) => {
                    const lx = 30 + (mIdx / (MARKET_VALUE_MONTHS.length - 1)) * 260;
                    return (
                      <text key={mIdx} x={lx} y="155" textAnchor="middle" fill="#8b949e" fontSize="8">
                        {mv.month}
                      </text>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG Transfer Readiness Ring */}
        <InnerCard title="Transfer Readiness" icon={Zap} delay={0.25}>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0" preserveAspectRatio="xMidYMid meet">
              {(() => {
                const cx = 60;
                const cy = 60;
                const radius = 48;
                const circumference = 2 * Math.PI * radius;
                const dashOffset = circumference - (transferReadiness / 100) * circumference;
                const ringColor = transferReadiness >= 75 ? '#10b981' : transferReadiness >= 50 ? '#fbbf24' : '#ef4444';
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth="8" />
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      transform={`rotate(-90 ${cx} ${cy})`}
                    />
                    <text x={cx} y={cy - 4} textAnchor="middle" fill={ringColor} fontSize="20" fontWeight="bold">
                      {transferReadiness}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">
                      / 100
                    </text>
                  </g>
                );
              })()}
            </svg>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-[#c9d1d9]">
                {transferReadiness >= 75 ? 'Ready for Transfer' : transferReadiness >= 50 ? 'Developing Well' : 'Needs Improvement'}
              </p>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                {transferReadiness >= 75
                  ? 'Your current form and rating make you an attractive prospect for top clubs. Your agent is actively negotiating.'
                  : 'Continue developing your skills and maintaining good form to increase your transfer readiness.'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-[#21262d] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[#8b949e]">Overall</p>
                  <p className="text-xs font-bold text-[#c9d1d9]">{playerData?.overall ?? 72}</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[#8b949e]">Form</p>
                  <p className="text-xs font-bold text-emerald-400">{(playerData?.form ?? 7.0).toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </InnerCard>

        {/* Transfer Tips */}
        <InnerCard title="Transfer Tips" icon={Zap} delay={0.3}>
          <div className="space-y-2.5">
            {[
              { tip: 'Your age makes you an attractive target for clubs seeking long-term investments. Leverage this in negotiations.' },
              { tip: 'Maintaining consistent form above 7.0 is the fastest way to attract top-tier scouts.' },
              { tip: 'Consider loan moves to leagues with higher visibility if you want to accelerate your transfer value.' },
              { tip: 'Your agent recommends waiting until the summer window for maximum leverage on any deal.' },
              { tip: 'Keep your social media presence positive — clubs evaluate player marketability as part of transfer decisions.' },
            ].map((item, tipIdx) => (
              <motion.div
                key={tipIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.35 + tipIdx * 0.04 }}
                className="flex items-start gap-2.5 text-xs text-[#c9d1d9] leading-relaxed"
              >
                <ChevronRight className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{item.tip}</span>
              </motion.div>
            ))}
          </div>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 4 — Career Planning (camelCase render function)
  // ============================================================

  function careerPlanning(): React.JSX.Element {
    return (
      <div className="space-y-4">
        {/* Career Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wide">Age</p>
            <p className="text-lg font-bold text-[#c9d1d9]">{playerData?.age ?? 21}</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wide">Overall</p>
            <p className="text-lg font-bold text-emerald-400">{playerData?.overall ?? 76}</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wide">Potential</p>
            <p className="text-lg font-bold text-sky-400">{playerData?.potential ?? 88}</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-[#8b949e] uppercase tracking-wide">Season</p>
            <p className="text-lg font-bold text-amber-400">{currentSeason}</p>
          </div>
        </div>

        {/* 5-Year Career Plan */}
        <InnerCard title="5-Year Career Plan" icon={Calendar}>
          <svg viewBox="0 0 300 120" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const nodePositions = CAREER_TIMELINE.map((_, idx) => ({
                x: 30 + (idx / (CAREER_TIMELINE.length - 1)) * 240,
                y: 50,
              }));
              // Connecting line
              const linePoints = buildPointsString(nodePositions);
              return (
                <g>
                  <line
                    x1={nodePositions[0].x}
                    y1={nodePositions[0].y}
                    x2={nodePositions[nodePositions.length - 1].x}
                    y2={nodePositions[nodePositions.length - 1].y}
                    stroke="#30363d"
                    strokeWidth="2"
                  />
                  {nodePositions.map((pos, nIdx) => {
                    const item = CAREER_TIMELINE[nIdx];
                    const nodeColor = item.status === 'current' ? '#10b981' : item.status === 'upcoming' ? '#38bdf8' : '#484f58';
                    return (
                      <g key={nIdx}>
                        <circle cx={pos.x} cy={pos.y} r="8" fill="#0d1117" stroke={nodeColor} strokeWidth="2" />
                        <circle cx={pos.x} cy={pos.y} r="4" fill={nodeColor} />
                        <text x={pos.x} y={pos.y - 16} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="bold">
                          {item.label}
                        </text>
                        <text x={pos.x} y={pos.y + 22} textAnchor="middle" fill="#8b949e" fontSize="9">
                          {item.year}
                        </text>
                        <text x={pos.x} y={pos.y + 34} textAnchor="middle" fill="#484f58" fontSize="8">
                          {item.desc}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG Career Path Timeline */}
        <InnerCard title="Career Trajectory" icon={TrendingUp} delay={0.05}>
          <svg viewBox="0 0 300 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const projectedValues = [72, 78, 83, 87, 90, 92];
              const currentValues = [72, 75, 79, 82, 85, 87];
              const maxV = 100;
              const projectedPoints = projectedValues.map((v, i) => ({
                x: 30 + (i / (projectedValues.length - 1)) * 250,
                y: 130 - (v / maxV) * 110,
              }));
              const currentPoints = currentValues.map((v, i) => ({
                x: 30 + (i / (currentValues.length - 1)) * 250,
                y: 130 - (v / maxV) * 110,
              }));
              const projStr = buildPointsString(projectedPoints);
              const currStr = buildPointsString(currentPoints);
              return (
                <g>
                  {/* Grid */}
                  {[30, 65, 100].map((gy, gIdx) => (
                    <line key={gIdx} x1="30" y1={gy} x2="280" y2={gy} stroke="#484f58" strokeDasharray="4 4" opacity={0.15} />
                  ))}
                  {/* Projected line */}
                  <polyline points={projStr} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
                  {/* Current line */}
                  <polyline points={currStr} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {projectedPoints.map((pp, ppIdx) => (
                    <circle key={`proj-${ppIdx}`} cx={pp.x} cy={pp.y} r="3" fill="#38bdf8" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {currentPoints.map((cp, cpIdx) => (
                    <circle key={`curr-${cpIdx}`} cx={cp.x} cy={cp.y} r="3" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {/* Legend */}
                  <line x1="40" y1="148" x2="60" y2="148" stroke="#10b981" strokeWidth="2" />
                  <text x="65" y="151" fill="#c9d1d9" fontSize="9">Current</text>
                  <line x1="120" y1="148" x2="140" y2="148" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="145" y="151" fill="#c9d1d9" fontSize="9">Projected</text>
                  {/* Year labels */}
                  {['Now', '+2yr', '+4yr', '+6yr', '+8yr', '+10yr'].map((yr, yIdx) => {
                    const lx = 30 + (yIdx / 5) * 250;
                    return (
                      <text key={yIdx} x={lx} y="22" textAnchor="middle" fill="#8b949e" fontSize="9">{yr}</text>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* Milestone Targets */}
        <InnerCard title="Career Milestones" icon={Award} delay={0.1}>
          <div className="space-y-3">
            {MILESTONE_TARGETS.map((ms, msIdx) => {
              const progressPct = ms.target > 1 ? Math.min((ms.current / ms.target) * 100, 100) : ms.current >= ms.target ? 100 : 0;
              const achieved = progressPct >= 100;
              return (
                <motion.div
                  key={ms.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.15 + msIdx * 0.04 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {achieved ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Target className="h-4 w-4 text-[#8b949e]" />
                      )}
                      <span className={`font-medium ${achieved ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                        {ms.label}
                      </span>
                    </div>
                    <span className="text-[#8b949e]">{ms.current}/{ms.target}</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.2 + msIdx * 0.06 }}
                      className="h-full rounded-lg"
                      style={{ width: `${progressPct}%`, backgroundColor: ms.color, opacity: 0.8 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* SVG Milestone Progress Bars */}
        <InnerCard title="Milestone Progress" icon={Star} delay={0.15}>
          <svg viewBox="0 0 300 140" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const barMaxW = 180;
              const barH = 20;
              const startY = 10;
              const gap = 30;
              return MILESTONE_TARGETS.map((ms, mIdx) => {
                const rawPct = ms.target > 1 ? (ms.current / ms.target) * 100 : ms.current >= ms.target ? 100 : 0;
                const barW = Math.min((rawPct / 100) * barMaxW, barMaxW);
                const yPos = startY + mIdx * gap;
                const achieved = rawPct >= 100;
                return (
                  <g key={mIdx}>
                    <text x="5" y={yPos + 5} fill="#c9d1d9" fontSize="10" fontWeight="bold">{ms.label}</text>
                    <rect x="130" y={yPos - 10} width={barMaxW} height={barH} rx="4" fill="#21262d" />
                    <motion.rect
                      x="130"
                      y={yPos - 10}
                      width={barW}
                      height={barH}
                      rx="4"
                      fill={ms.color}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: achieved ? 1 : 0.7 }}
                      transition={{ duration: 0.3, delay: 0.1 + mIdx * 0.08 }}
                    />
                    <text x={130 + barMaxW + 8} y={yPos + 5} fill={achieved ? '#10b981' : '#8b949e'} fontSize="10" fontWeight="bold">
                      {achieved ? 'Done' : `${rawPct.toFixed(0)}%`}
                    </text>
                  </g>
                );
              });
            })()}
          </svg>
        </InnerCard>

        {/* SVG Career Trajectory Radar — 6-axis */}
        <InnerCard title="Career Trajectory Radar" icon={Activity} delay={0.2}>
          <svg viewBox="0 0 300 240" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Projected vs Current
            </text>
            {(() => {
              const cx = 150;
              const cy = 130;
              const maxR = 85;
              const labels = ['Technical', 'Physical', 'Mental', 'Reputation', 'Financial', 'Legacy'];
              const projectedVals = [88, 82, 78, 85, 72, 65];
              const currentVals = [76, 80, 70, 62, 45, 35];

              const axisEndpoints = labels.map((_, idx) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * idx) / 6;
                return { x: cx + maxR * Math.cos(angle), y: cy + maxR * Math.sin(angle) };
              });

              const projectedPoints = projectedVals.map((val, idx) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * idx) / 6;
                const factor = val / 100;
                return { x: cx + maxR * factor * Math.cos(angle), y: cy + maxR * factor * Math.sin(angle) };
              });

              const currentPoints = currentVals.map((val, idx) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * idx) / 6;
                const factor = val / 100;
                return { x: cx + maxR * factor * Math.cos(angle), y: cy + maxR * factor * Math.sin(angle) };
              });

              const projectedString = buildPointsString(projectedPoints);
              const currentString = buildPointsString(currentPoints);

              return (
                <g>
                  {/* Grid rings */}
                  {[30, 55, maxR].map((ringR, rrIdx) => (
                    <circle
                      key={rrIdx}
                      cx={cx}
                      cy={cy}
                      r={ringR}
                      fill="none"
                      stroke="#484f58"
                      strokeDasharray="4 4"
                      opacity={0.12}
                    />
                  ))}
                  {/* Axis lines */}
                  {axisEndpoints.map((ep, epIdx) => (
                    <line
                      key={epIdx}
                      x1={cx}
                      y1={cy}
                      x2={ep.x}
                      y2={ep.y}
                      stroke="#484f58"
                      strokeDasharray="4 4"
                      opacity={0.15}
                    />
                  ))}
                  {/* Projected polygon */}
                  <polygon points={projectedString} fill="#38bdf8" fillOpacity={0.1} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
                  {/* Current polygon */}
                  <polygon points={currentString} fill="#10b981" fillOpacity={0.15} stroke="#10b981" strokeWidth="2" />
                  {/* Data dots — projected */}
                  {projectedPoints.map((pp, ppIdx) => (
                    <circle key={`pp-${ppIdx}`} cx={pp.x} cy={pp.y} r="3" fill="#38bdf8" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {/* Data dots — current */}
                  {currentPoints.map((cp, cpIdx) => (
                    <circle key={`cp-${cpIdx}`} cx={cp.x} cy={cp.y} r="3.5" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {/* Labels */}
                  {labels.map((lbl, lblIdx) => {
                    const angle = -Math.PI / 2 + (2 * Math.PI * lblIdx) / 6;
                    const lx = cx + (maxR + 18) * Math.cos(angle);
                    const ly = cy + (maxR + 18) * Math.sin(angle);
                    const anchor = lblIdx === 0 ? 'middle' : lblIdx === 3 ? 'middle' : lblIdx < 3 ? 'start' : 'end';
                    return (
                      <text key={lblIdx} x={lx} y={ly + 4} textAnchor={anchor} fill="#c9d1d9" fontSize="10" fontWeight="bold">
                        {lbl}
                      </text>
                    );
                  })}
                  {/* Legend */}
                  <line x1="100" y1="228" x2="120" y2="228" stroke="#10b981" strokeWidth="2" />
                  <text x="125" y="231" fill="#c9d1d9" fontSize="9">Current</text>
                  <line x1="180" y1="228" x2="200" y2="228" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="205" y="231" fill="#c9d1d9" fontSize="9">Projected</text>
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* Alternative Career Paths */}
        <InnerCard title="Alternative Career Paths" icon={Globe} delay={0.25}>
          <div className="space-y-2">
            {ALTERNATIVE_PATHS.map((path, pIdx) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.3 + pIdx * 0.04 }}
                className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{path.title}</span>
                  <Badge className={`text-[9px] border ${
                    path.suitability >= 75
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : path.suitability >= 50
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        : 'border-red-500/30 text-red-400 bg-red-500/10'
                  }`}>
                    {path.suitability}% match
                  </Badge>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">{path.desc}</p>
                <div className="mt-2 h-1.5 bg-[#0d1117] rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.35 + pIdx * 0.05 }}
                    className="h-full rounded-lg bg-emerald-500"
                    style={{ width: `${path.suitability}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </InnerCard>

        {/* Retirement Planning Basics */}
        <InnerCard title="Retirement Planning" icon={Clock} delay={0.3}>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Current Age</p>
              <p className="text-lg font-bold text-[#c9d1d9] mt-0.5">{playerData?.age ?? 21}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Est. Retirement</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{(playerData?.age ?? 21) + 14}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Years Left</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">14</p>
            </div>
            <div className="bg-[#21262d] rounded-lg p-3">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Career Earnings</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">€24.5M</p>
            </div>
          </div>
          <div className="mt-3 bg-[#21262d] rounded-lg p-3 space-y-1.5 border border-[#30363d]">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Agent Advice</span>
            </div>
            <p className="text-xs text-[#c9d1d9] leading-relaxed">
              Start planning for post-career opportunities now. Consider investing in coaching badges,
              media training, or business ventures during your playing years to ensure a smooth transition.
            </p>
          </div>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Main Return JSX
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#c9d1d9]">Player Agent Hub</h1>
            <p className="text-[10px] text-[#8b949e]">
              Managed by {agent.name} · {playerName}
            </p>
          </div>
          <Badge className="text-[10px] border border-amber-500/30 text-amber-400 bg-transparent">
            <Star className="h-3 w-3 mr-1" />
            {agent.rating}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full bg-[#161b22] border border-[#30363d] rounded-lg h-auto p-1">
            <TabsTrigger
              value="dashboard"
              className="text-[10px] py-2 px-1 rounded-lg data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e] data-[state=active]:shadow-none"
            >
              <Briefcase className="h-3 w-3 mr-1" />
              Agent
            </TabsTrigger>
            <TabsTrigger
              value="contract"
              className="text-[10px] py-2 px-1 rounded-lg data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e] data-[state=active]:shadow-none"
            >
              <FileText className="h-3 w-3 mr-1" />
              Contract
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="text-[10px] py-2 px-1 rounded-lg data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e] data-[state=active]:shadow-none"
            >
              <Globe className="h-3 w-3 mr-1" />
              Transfer
            </TabsTrigger>
            <TabsTrigger
              value="career"
              className="text-[10px] py-2 px-1 rounded-lg data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-[#8b949e] data-[state=active]:shadow-none"
            >
              <Target className="h-3 w-3 mr-1" />
              Career
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            {agentDashboard()}
          </TabsContent>

          <TabsContent value="contract" className="mt-4">
            {contractManagement()}
          </TabsContent>

          <TabsContent value="transfer" className="mt-4">
            {transferStrategy()}
          </TabsContent>

          <TabsContent value="career" className="mt-4">
            {careerPlanning()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
