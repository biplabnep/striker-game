'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRightLeft, Star, BarChart3, TrendingUp,
  Zap, Target, Shield, Users, Award, Clock, ChevronRight,
  Calendar, Globe, Flag, CheckCircle, AlertTriangle
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

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

// ============================================================
// Static Data Constants — Plain variables (Rule 5: no useMemo on constants)
// ============================================================

const TARGET_CLUBS = [
  {
    id: 'tc1',
    name: 'Brentford FC',
    league: 'Premier League',
    country: 'England',
    duration: 'Season Long',
    wageContribution: 85,
    playingTimeGuarantee: 78,
    rating: 82,
    coachRating: 79,
    developmentScore: 88,
    color: '#10b981',
  },
  {
    id: 'tc2',
    name: 'Real Betis',
    league: 'La Liga',
    country: 'Spain',
    duration: 'Season Long',
    wageContribution: 70,
    playingTimeGuarantee: 85,
    rating: 80,
    coachRating: 83,
    developmentScore: 90,
    color: '#38bdf8',
  },
  {
    id: 'tc3',
    name: 'Atalanta BC',
    league: 'Serie A',
    country: 'Italy',
    duration: 'Season Long',
    wageContribution: 75,
    playingTimeGuarantee: 72,
    rating: 81,
    coachRating: 90,
    developmentScore: 94,
    color: '#a855f7',
  },
  {
    id: 'tc4',
    name: 'RB Leipzig',
    league: 'Bundesliga',
    country: 'Germany',
    duration: 'Short Term',
    wageContribution: 60,
    playingTimeGuarantee: 68,
    rating: 78,
    coachRating: 85,
    developmentScore: 86,
    color: '#fbbf24',
  },
  {
    id: 'tc5',
    name: 'LOSC Lille',
    league: 'Ligue 1',
    country: 'France',
    duration: 'Season Long',
    wageContribution: 80,
    playingTimeGuarantee: 82,
    rating: 76,
    coachRating: 77,
    developmentScore: 82,
    color: '#f87171',
  },
  {
    id: 'tc6',
    name: 'Sporting CP',
    league: 'Primeira Liga',
    country: 'Portugal',
    duration: 'Season Long',
    wageContribution: 55,
    playingTimeGuarantee: 90,
    rating: 77,
    coachRating: 81,
    developmentScore: 85,
    color: '#fb923c',
  },
];

const ACTIVE_OFFERS = [
  {
    id: 'ao1',
    club: 'Brentford FC',
    league: 'Premier League',
    type: 'Season Long',
    wageSplit: '85/15',
    playingTime: '78% guaranteed',
    deadline: '7 days',
    status: 'Priority' as const,
    keyTerms: 'Sub appearance fee €5K, clean sheet bonus €3K',
  },
  {
    id: 'ao2',
    club: 'Real Betis',
    league: 'La Liga',
    type: 'Season Long',
    wageSplit: '70/30',
    playingTime: '85% guaranteed',
    deadline: '12 days',
    status: 'Active' as const,
    keyTerms: 'Buy option €12M, goal bonus €8K',
  },
  {
    id: 'ao3',
    club: 'Atalanta BC',
    league: 'Serie A',
    type: 'Season Long',
    wageSplit: '75/25',
    playingTime: '72% guaranteed',
    deadline: '5 days',
    status: 'Expiring' as const,
    keyTerms: 'Development bonus €10K, European games exposure',
  },
];

const LOAN_HISTORY = [
  {
    id: 'lh1',
    club: 'Swansea City',
    league: 'Championship',
    season: '2022/23',
    apps: 34,
    goals: 6,
    assists: 4,
    avgRating: 7.2,
    ovrChange: '+3',
    success: 'Excellent' as const,
  },
  {
    id: 'lh2',
    club: 'FC Utrecht',
    league: 'Eredivisie',
    season: '2023/24',
    apps: 28,
    goals: 3,
    assists: 7,
    avgRating: 6.9,
    ovrChange: '+2',
    success: 'Good' as const,
  },
  {
    id: 'lh3',
    club: 'Stade Reims',
    league: 'Ligue 1',
    season: '2023/24',
    apps: 18,
    goals: 1,
    assists: 2,
    avgRating: 6.4,
    ovrChange: '+1',
    success: 'Average' as const,
  },
  {
    id: 'lh4',
    club: 'Bristol City',
    league: 'Championship',
    season: '2021/22',
    apps: 22,
    goals: 2,
    assists: 3,
    avgRating: 6.7,
    ovrChange: '+2',
    success: 'Good' as const,
  },
];

const LOAN_PERFORMANCE_DATA = [
  { loan: 'Swansea', goals: 6, assists: 4, rating: 7.2 },
  { loan: 'Utrecht', goals: 3, assists: 7, rating: 6.9 },
  { loan: 'Reims', goals: 1, assists: 2, rating: 6.4 },
];

const OVR_PROGRESSION = [
  { period: 'Pre-Loan 1', ovr: 64 },
  { period: 'Bristol City', ovr: 66 },
  { period: 'Swansea', ovr: 69 },
  { period: 'Utrecht', ovr: 71 },
  { period: 'Reims', ovr: 72 },
];

const LOAN_CATEGORIES = [
  { label: 'Short-term', count: 34, color: '#38bdf8' },
  { label: 'Season-long', count: 52, color: '#10b981' },
  { label: 'Youth Dev', count: 28, color: '#fbbf24' },
  { label: 'Emergency', count: 15, color: '#f87171' },
  { label: 'Buy Option', count: 19, color: '#a855f7' },
];

const MARKET_ACTIVITY = [
  { season: '21/22', totalLoans: 112, completed: 98 },
  { season: '22/23', totalLoans: 134, completed: 118 },
  { season: '23/24', totalLoans: 148, completed: 127 },
  { season: '24/25', totalLoans: 131, completed: 89 },
];

const LEAGUE_POPULARITY = [
  { league: 'Premier League', value: 92 },
  { league: 'La Liga', value: 85 },
  { league: 'Serie A', value: 78 },
  { league: 'Bundesliga', value: 74 },
  { league: 'Ligue 1', value: 68 },
];

const STRATEGIES = [
  {
    id: 's1',
    name: 'Brentford Move',
    type: 'Steady Development',
    desc: 'Join a well-structured Premier League club with a proven track record of developing young talent through loans.',
    risk: 35,
    devBoost: 78,
    wageRetention: 85,
    playingTime: 78,
    recommended: true,
  },
  {
    id: 's2',
    name: 'Real Betis Move',
    type: 'Technical Growth',
    desc: 'Experience Spanish football philosophy with guaranteed playing time and a potential buy option.',
    risk: 45,
    devBoost: 82,
    wageRetention: 70,
    playingTime: 85,
    recommended: false,
  },
  {
    id: 's3',
    name: 'Atalanta Move',
    type: 'High-Intensity Coaching',
    desc: 'Train under one of Europe\'s best coaching setups. Intensive tactical environment with rapid development.',
    risk: 55,
    devBoost: 90,
    wageRetention: 75,
    playingTime: 72,
    recommended: false,
  },
  {
    id: 's4',
    name: 'Stay at Parent Club',
    type: 'Squad Rotation',
    desc: 'Remain with your current club fighting for first-team minutes in training and cup competitions.',
    risk: 20,
    devBoost: 45,
    wageRetention: 100,
    playingTime: 30,
    recommended: false,
  },
  {
    id: 's5',
    name: 'Sporting CP Move',
    type: 'European Exposure',
    desc: 'Portuguese league with Champions League group stage football. High visibility in front of European scouts.',
    risk: 40,
    devBoost: 72,
    wageRetention: 55,
    playingTime: 90,
    recommended: false,
  },
];

const STRATEGY_METRICS = [
  { strategy: 'Brentford', development: 78, experience: 82, visibility: 85, satisfaction: 80 },
  { strategy: 'Real Betis', development: 82, experience: 88, visibility: 75, satisfaction: 76 },
  { strategy: 'Atalanta', development: 90, experience: 94, visibility: 80, satisfaction: 84 },
];

const LONG_TERM_OVR = [
  { season: 'Current', withLoan: 72, withoutLoan: 72 },
  { season: 'Year 1', withLoan: 76, withoutLoan: 73 },
  { season: 'Year 2', withLoan: 80, withoutLoan: 74 },
  { season: 'Year 3', withLoan: 83, withoutLoan: 75 },
  { season: 'Year 4', withLoan: 85, withoutLoan: 76 },
];

const MARKET_HOTSPOTS = [
  { region: 'London', loans: 28, trend: 'up' as const },
  { region: 'Rhine-Ruhr', loans: 22, trend: 'up' as const },
  { region: 'Lombardy', loans: 19, trend: 'stable' as const },
  { region: 'Andalusia', loans: 16, trend: 'up' as const },
  { region: 'Île-de-France', loans: 14, trend: 'down' as const },
];

// ============================================================
// Outer Sub-Components (Rule 13: defined outside main, uppercase)
// ============================================================

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

function StatMiniCard({
  label,
  value,
  subtext,
  valueColor = 'text-emerald-400',
}: {
  label: string;
  value: string;
  subtext: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-center">
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${valueColor} mt-1`}>{value}</p>
      <p className="text-[9px] text-[#484f58]">{subtext}</p>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function LoanSystemEnhanced(): React.JSX.Element {
  // ---- ALL hooks before conditional returns (Rule 7) ----
  const [activeTab, setActiveTab] = useState('available');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const playerName = playerData?.name ?? 'Your Player';

  // Derived data
  const totalApps = LOAN_HISTORY.reduce((acc, entry) => acc + entry.apps, 0);
  const totalGoals = LOAN_HISTORY.reduce((acc, entry) => acc + entry.goals, 0);
  const totalAssists = LOAN_HISTORY.reduce((acc, entry) => acc + entry.assists, 0);
  const avgRating = totalApps > 0
    ? Math.round((LOAN_HISTORY.reduce((acc, entry) => acc + entry.avgRating, 0) / LOAN_HISTORY.length) * 10) / 10
    : 0;

  // Category total via reduce (Rule 6: no let accumulation)
  const categoryTotal = LOAN_CATEGORIES.reduce((runningTotal, cat) => runningTotal + cat.count, 0);

  // Memoized satisfaction score for the ring chart
  const satisfactionPct = useMemo(() => {
    const scores = LOAN_HISTORY.map(h => h.avgRating * 10 + h.apps * 0.5);
    const rawScore = scores.reduce((a, b) => a + b, 0) / (LOAN_HISTORY.length * 100);
    return Math.min(Math.round(rawScore * 100) / 100, 0.99);
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    setScreen('dashboard');
  }, [setScreen]);

  const handleSelectClub = useCallback((clubId: string) => {
    setSelectedClub(prev => prev === clubId ? null : clubId);
  }, []);

  const handleToggleHistory = useCallback((historyId: string) => {
    setExpandedHistory(prev => prev === historyId ? null : historyId);
  }, []);

  // ---- Conditional return AFTER all hooks (Rule 7) ----
  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e]">No game state found.</p>
      </div>
    );
  }

  // ============================================================
  // Tab 1 — Available Loans (camelCase render function, Rule 13)
  // ============================================================

  function availableLoans(): React.JSX.Element {
    return (
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatMiniCard label="Target Clubs" value="6" subtext="Scouted" valueColor="text-emerald-400" />
          <StatMiniCard label="Active Offers" value={ACTIVE_OFFERS.length.toString()} subtext="On the table" valueColor="text-sky-400" />
          <StatMiniCard label="Best Fit" value="Atalanta" subtext="Dev score 94" valueColor="text-amber-400" />
        </div>

        {/* Target Clubs Grid */}
        <InnerCard title="Loan Target Clubs" icon={Target}>
          <div className="space-y-2">
            {TARGET_CLUBS.map((club, clubIdx) => {
              const isSelected = selectedClub === club.id;
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: clubIdx * 0.04 }}
                  onClick={() => handleSelectClub(club.id)}
                  className={`bg-[#0d1117] border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-[#21262d] hover:border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-6 rounded-sm"
                        style={{ backgroundColor: club.color }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#c9d1d9]">{club.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-[#8b949e] flex items-center gap-0.5">
                            <Globe className="h-2.5 w-2.5" />
                            {club.league}
                          </span>
                          <span className="text-[9px] text-[#484f58]">·</span>
                          <span className="text-[9px] text-[#8b949e] flex items-center gap-0.5">
                            <Flag className="h-2.5 w-2.5" />
                            {club.country}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[8px] px-1.5 py-0 border border-[#30363d] bg-[#21262d] text-[#8b949e]">
                        {club.duration}
                      </Badge>
                      <ChevronRight className={`h-3.5 w-3.5 transition-opacity ${isSelected ? 'text-emerald-400 opacity-100' : 'text-[#484f58] opacity-50'}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 pt-2 border-t border-[#21262d] grid grid-cols-3 gap-2"
                      >
                        <div className="text-center">
                          <p className="text-[9px] text-[#484f58]">Wage Cover</p>
                          <p className="text-xs font-bold text-emerald-400">{club.wageContribution}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-[#484f58]">Play Time</p>
                          <p className="text-xs font-bold text-sky-400">{club.playingTimeGuarantee}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-[#484f58]">Dev Score</p>
                          <p className="text-xs font-bold text-amber-400">{club.developmentScore}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Active Loan Offers */}
        <InnerCard title="Active Loan Offers" icon={ArrowRightLeft} delay={0.05}>
          <div className="space-y-2">
            {ACTIVE_OFFERS.map((offer, offerIdx) => {
              const statusStyle = offer.status === 'Priority'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : offer.status === 'Active'
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.08 + offerIdx * 0.04 }}
                  className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#c9d1d9]">{offer.club}</p>
                      <p className="text-[9px] text-[#8b949e]">{offer.league} · {offer.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-[8px] px-1.5 py-0 border ${statusStyle}`}>
                        {offer.status}
                      </Badge>
                      <Badge className="text-[8px] px-1.5 py-0 border border-[#30363d] bg-[#21262d] text-amber-400">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {offer.deadline}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-[#8b949e]">Wage Split: <span className="text-emerald-400 font-medium">{offer.wageSplit}</span></span>
                    <span className="text-[#8b949e]">Play Time: <span className="text-sky-400 font-medium">{offer.playingTime}</span></span>
                  </div>
                  <p className="text-[9px] text-[#484f58] border-t border-[#21262d] pt-1.5">{offer.keyTerms}</p>
                  <Button className="w-full h-7 text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-lg">
                    Negotiate Terms
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Loan Suitability Analysis */}
        <InnerCard title="Loan Suitability Analysis" icon={BarChart3} delay={0.1}>
          <div className="bg-[#21262d] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold text-[#c9d1d9]">AI Recommendation</span>
            </div>
            <p className="text-[10px] text-[#8b949e] leading-relaxed">
              Based on your playing style, age, and development trajectory, <span className="text-emerald-400 font-medium">Atalanta BC</span> offers the best combination of high-intensity coaching (score: 90) and rapid development potential (score: 94). The competitive environment in Serie A will accelerate your tactical understanding.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-emerald-500/20">
              <p className="text-[9px] text-[#484f58]">Best for Development</p>
              <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">Atalanta BC</p>
              <p className="text-[9px] text-[#8b949e]">Dev score: 94/100</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-sky-500/20">
              <p className="text-[9px] text-[#484f58]">Best for Play Time</p>
              <p className="text-[11px] font-semibold text-sky-400 mt-0.5">Sporting CP</p>
              <p className="text-[9px] text-[#8b949e]">Guarantee: 90%</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-amber-500/20">
              <p className="text-[9px] text-[#484f58]">Best for Wage</p>
              <p className="text-[11px] font-semibold text-amber-400 mt-0.5">Brentford FC</p>
              <p className="text-[9px] text-[#8b949e]">85% wage covered</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-purple-500/20">
              <p className="text-[9px] text-[#484f58]">Best for Exposure</p>
              <p className="text-[11px] font-semibold text-purple-400 mt-0.5">Real Betis</p>
              <p className="text-[9px] text-[#8b949e]">Buy option €12M</p>
            </div>
          </div>
        </InnerCard>

        {/* SVG: Loan Suitability Radar (5-axis) */}
        <InnerCard title="Loan Suitability Radar" icon={Star} delay={0.15}>
          <svg viewBox="0 0 300 260" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="16" textAnchor="middle" fill="#8b949e" fontSize="10">
              Multi-Axis Suitability Analysis
            </text>
            {/* Grid rings */}
            {[25, 50, 75, 100].map((ringPct, ringIdx) => {
              const r = (ringPct / 100) * 90;
              return (
                <polygon
                  key={ringIdx}
                  points={buildPointsString(
                    [0, 72, 144, 216, 288].map(angle => polarToCartesian(150, 130, r, angle - 90))
                  )}
                  fill="none"
                  stroke="#30363d"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Axis lines */}
            {[0, 72, 144, 216, 288].map((angle, axisIdx) => {
              const endpoint = polarToCartesian(150, 130, 100, angle - 90);
              return (
                <line
                  key={axisIdx}
                  x1="150"
                  y1="130"
                  x2={endpoint.x}
                  y2={endpoint.y}
                  stroke="#30363d"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Axis labels */}
            {[
              { label: 'Playing Time', angle: 0 },
              { label: 'Level', angle: 72 },
              { label: 'Wage', angle: 144 },
              { label: 'Location', angle: 216 },
              { label: 'Duration', angle: 288 },
            ].map(axis => {
              const labelPos = polarToCartesian(150, 130, 115, axis.angle - 90);
              return (
                <text
                  key={axis.label}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  fill="#c9d1d9"
                  fontSize="10"
                >
                  {axis.label}
                </text>
              );
            })}
            {/* Data polygon — Best club (Atalanta) */}
            {(() => {
              const atalantaValues = [72, 81, 75, 78, 100];
              const brentfordValues = [78, 82, 85, 88, 100];
              const atalantaPoints = atalantaValues.map((val, idx) =>
                polarToCartesian(150, 130, (val / 100) * 90, [0, 72, 144, 216, 288][idx] - 90)
              );
              const brentfordPoints = brentfordValues.map((val, idx) =>
                polarToCartesian(150, 130, (val / 100) * 90, [0, 72, 144, 216, 288][idx] - 90)
              );
              const atalantaStr = buildPointsString(atalantaPoints);
              const brentfordStr = buildPointsString(brentfordPoints);
              return (
                <g>
                  <polygon points={brentfordStr} fill="#38bdf8" fillOpacity={0.08} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
                  <polygon points={atalantaStr} fill="#a855f7" fillOpacity={0.12} stroke="#a855f7" strokeWidth="2" />
                  {atalantaPoints.map((dot, dotIdx) => (
                    <circle key={dotIdx} cx={dot.x} cy={dot.y} r="3" fill="#a855f7" stroke="#0d1117" strokeWidth="1.5" />
                  ))}
                  {brentfordPoints.map((dot, dotIdx) => (
                    <circle key={`b-${dotIdx}`} cx={dot.x} cy={dot.y} r="2.5" fill="#38bdf8" stroke="#0d1117" strokeWidth="1" />
                  ))}
                </g>
              );
            })()}
            {/* Legend */}
            <rect x="40" y="244" width="10" height="10" rx="2" fill="#a855f7" />
            <text x="55" y="253" fill="#c9d1d9" fontSize="9">Atalanta (Recommended)</text>
            <rect x="175" y="244" width="10" height="10" rx="2" fill="#38bdf8" />
            <text x="190" y="253" fill="#c9d1d9" fontSize="9">Brentford (Alternative)</text>
          </svg>
        </InnerCard>

        {/* SVG: Target Club Rating Bars (6 clubs) */}
        <InnerCard title="Target Club Ratings" icon={Award} delay={0.2}>
          <div className="space-y-2">
            {TARGET_CLUBS.map((club, barIdx) => (
              <div key={club.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#c9d1d9]">{club.name}</span>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{club.rating}/100</span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.25 + barIdx * 0.05 }}
                    className="h-full rounded-lg"
                    style={{ width: `${club.rating}%`, backgroundColor: club.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] text-[#484f58]">
                  <span>Coach: {club.coachRating}</span>
                  <span>Dev: {club.developmentScore}</span>
                </div>
              </div>
            ))}
          </div>
        </InnerCard>

        {/* SVG: Wage Contribution Comparison Bars (6 clubs) */}
        <InnerCard title="Wage Contribution Comparison" icon={TrendingUp} delay={0.25}>
          <svg viewBox="0 0 300 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Wage Contribution % Covered by Loan Club
            </text>
            {(() => {
              const barWidth = 32;
              const gap = 16;
              const startX = 30;
              const chartHeight = 160;
              const baseY = 190;
              return (
                <g>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((pct, gridIdx) => {
                    const y = baseY - (pct / 100) * chartHeight;
                    return (
                      <g key={gridIdx}>
                        <line x1={startX - 4} y1={y} x2={startX + TARGET_CLUBS.length * (barWidth + gap)} y2={y} stroke="#30363d" strokeWidth="0.5" />
                        <text x={startX - 8} y={y + 3} textAnchor="end" fill="#484f58" fontSize="8">{pct}%</text>
                      </g>
                    );
                  })}
                  {/* Bars */}
                  {TARGET_CLUBS.map((club, bIdx) => {
                    const barH = (club.wageContribution / 100) * chartHeight;
                    const x = startX + bIdx * (barWidth + gap);
                    return (
                      <g key={club.id}>
                        <rect
                          x={x}
                          y={baseY - barH}
                          width={barWidth}
                          height={barH}
                          rx="3"
                          fill={club.color}
                          opacity={0.8}
                        />
                        <text x={x + barWidth / 2} y={baseY - barH - 4} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="bold">
                          {club.wageContribution}%
                        </text>
                        <text x={x + barWidth / 2} y={baseY + 12} textAnchor="middle" fill="#8b949e" fontSize="7" transform={`rotate(-30 ${x + barWidth / 2} ${baseY + 12})`}>
                          {club.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 2 — Loan History (camelCase render function)
  // ============================================================

  function loanHistory(): React.JSX.Element {
    const successColors: Record<string, string> = {
      Excellent: 'text-emerald-400',
      Good: 'text-sky-400',
      Average: 'text-amber-400',
      Poor: 'text-red-400',
    };

    return (
      <div className="space-y-4">
        {/* Performance Summary */}
        <div className="grid grid-cols-4 gap-2">
          <StatMiniCard label="Total Apps" value={totalApps.toString()} subtext="Across all loans" valueColor="text-emerald-400" />
          <StatMiniCard label="Goals" value={totalGoals.toString()} subtext="Loan goals" valueColor="text-sky-400" />
          <StatMiniCard label="Assists" value={totalAssists.toString()} subtext="Loan assists" valueColor="text-amber-400" />
          <StatMiniCard label="Avg Rating" value={avgRating.toFixed(1)} subtext="Per match" valueColor="text-purple-400" />
        </div>

        {/* Previous Loan Entries */}
        <InnerCard title="Previous Loans" icon={Clock}>
          <div className="space-y-2">
            {LOAN_HISTORY.map((loan, loanIdx) => {
              const isExpanded = expandedHistory === loan.id;
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: loanIdx * 0.04 }}
                  className="bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => handleToggleHistory(loan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-8 rounded-sm ${
                          loan.success === 'Excellent' ? 'bg-emerald-500' :
                          loan.success === 'Good' ? 'bg-sky-500' :
                          loan.success === 'Average' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-xs font-semibold text-[#c9d1d9]">{loan.club}</p>
                          <p className="text-[9px] text-[#8b949e]">{loan.league} · {loan.season}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold ${successColors[loan.success] ?? 'text-[#8b949e]'}`}>
                          {loan.success}
                        </span>
                        <Badge className="text-[8px] px-1.5 py-0 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                          {loan.ovrChange} OVR
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { label: 'Apps', val: loan.apps.toString() },
                        { label: 'Goals', val: loan.goals.toString() },
                        { label: 'Assists', val: loan.assists.toString() },
                        { label: 'Rating', val: loan.avgRating.toFixed(1) },
                      ].map(stat => (
                        <div key={stat.label} className="text-center bg-[#161b22] rounded-md py-1.5">
                          <p className="text-[8px] text-[#484f58]">{stat.label}</p>
                          <p className="text-[10px] font-bold text-[#c9d1d9]">{stat.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-t border-[#21262d] p-3 bg-[#0d1117]"
                      >
                        <p className="text-[10px] text-[#8b949e] leading-relaxed">
                          {loan.success === 'Excellent'
                            ? `Outstanding loan at ${loan.club}. Made ${loan.apps} appearances with ${loan.goals} goals and ${loan.assists} assists. Strong relationship with coaching staff led to a +${loan.ovrChange.replace('+', '')} overall rating improvement.`
                            : loan.success === 'Good'
                              ? `Solid loan spell at ${loan.club}. Contributed ${loan.goals} goals and ${loan.assists} assists in ${loan.apps} matches. Gained valuable first-team experience and improved by ${loan.ovrChange.replace('+', '')} OVR points.`
                              : `Decent experience at ${loan.club} with ${loan.apps} appearances. Limited game time impact but still managed to improve overall rating by ${loan.ovrChange.replace('+', '')}.`}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Loan Performance Summary */}
        <InnerCard title="Performance Summary" icon={BarChart3} delay={0.05}>
          <div className="space-y-3">
            <div className="bg-[#21262d] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#c9d1d9]">Overall Loan Trajectory</span>
                <Badge className="text-[8px] px-1.5 py-0 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  Improving
                </Badge>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">
                {playerName} has completed {LOAN_HISTORY.length} loan spells across 3 different countries. The Swansea City loan was the most productive, yielding the highest goal return and average match rating. Progressive improvement in tactical awareness and physical development noted across all spells.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
                <p className="text-[9px] text-[#484f58]">Best Loan</p>
                <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">Swansea City</p>
                <p className="text-[9px] text-[#8b949e]">Rating: 7.2 · +3 OVR</p>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-2.5 border border-[#21262d]">
                <p className="text-[9px] text-[#484f58]">Most Productive</p>
                <p className="text-[11px] font-semibold text-sky-400 mt-0.5">FC Utrecht</p>
                <p className="text-[9px] text-[#8b949e]">10 goal contributions</p>
              </div>
            </div>
          </div>
        </InnerCard>

        {/* Return-to-Club Analysis */}
        <InnerCard title="Return-to-Club Analysis" icon={Shield} delay={0.1}>
          <div className="space-y-2">
            {[
              { label: 'First-Team Readiness', value: 78, color: '#10b981' },
              { label: 'Tactical Familiarity', value: 62, color: '#38bdf8' },
              { label: 'Physical Condition', value: 85, color: '#a855f7' },
              { label: 'Squad Integration', value: 70, color: '#fbbf24' },
            ].map(metric => (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#c9d1d9]">{metric.label}</span>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{metric.value}%</span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg"
                    style={{ width: `${metric.value}%`, backgroundColor: metric.color, opacity: 0.8 }}
                  />
                </div>
              </div>
            ))}
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-emerald-500/20 mt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">Ready for Integration</span>
              </div>
              <p className="text-[9px] text-[#8b949e] mt-1">
                Based on loan performance data, {playerName} is well-positioned to compete for a starting role upon return. Focus on improving tactical familiarity during pre-season.
              </p>
            </div>
          </div>
        </InnerCard>

        {/* SVG: Loan Performance Area Chart (3 loans × 3 metrics) */}
        <InnerCard title="Loan Performance Breakdown" icon={BarChart3} delay={0.15}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Goals · Assists · Rating (×10) per Loan
            </text>
            {/* Grid */}
            {[30, 65, 100].map((gy, gIdx) => (
              <line key={gIdx} x1="50" y1={gy} x2="280" y2={gy} stroke="#30363d" strokeWidth="0.5" />
            ))}
            {/* Y-axis labels */}
            <text x="45" y="33" textAnchor="end" fill="#484f58" fontSize="8">12</text>
            <text x="45" y="68" textAnchor="end" fill="#484f58" fontSize="8">8</text>
            <text x="45" y="103" textAnchor="end" fill="#484f58" fontSize="8">4</text>
            <text x="45" y="138" textAnchor="end" fill="#484f58" fontSize="8">0</text>
            {(() => {
              const maxValue = 12;
              const chartLeft = 55;
              const chartRight = 270;
              const chartTop = 28;
              const chartBottom = 135;
              const chartH = chartBottom - chartTop;
              const chartW = chartRight - chartLeft;

              const goalsPoints = LOAN_PERFORMANCE_DATA.map((d, i) => ({
                x: chartLeft + (i / (LOAN_PERFORMANCE_DATA.length - 1)) * chartW,
                y: chartBottom - (d.goals / maxValue) * chartH,
              }));
              const assistsPoints = LOAN_PERFORMANCE_DATA.map((d, i) => ({
                x: chartLeft + (i / (LOAN_PERFORMANCE_DATA.length - 1)) * chartW,
                y: chartBottom - (d.assists / maxValue) * chartH,
              }));
              const ratingPoints = LOAN_PERFORMANCE_DATA.map((d, i) => ({
                x: chartLeft + (i / (LOAN_PERFORMANCE_DATA.length - 1)) * chartW,
                y: chartBottom - ((d.rating * 10) / maxValue) * chartH,
              }));

              const goalsArea = buildAreaPath(goalsPoints, chartBottom);
              const assistsArea = buildAreaPath(assistsPoints, chartBottom);
              const ratingArea = buildAreaPath(ratingPoints, chartBottom);
              const goalsStr = buildPointsString(goalsPoints);
              const assistsStr = buildPointsString(assistsPoints);
              const ratingStr = buildPointsString(ratingPoints);

              return (
                <g>
                  <path d={goalsArea} fill="#10b981" fillOpacity={0.1} />
                  <polyline points={goalsStr} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {goalsPoints.map((pt, pi) => (
                    <circle key={`g-${pi}`} cx={pt.x} cy={pt.y} r="3" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                  ))}

                  <path d={assistsArea} fill="#38bdf8" fillOpacity={0.1} />
                  <polyline points={assistsStr} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {assistsPoints.map((pt, pi) => (
                    <circle key={`a-${pi}`} cx={pt.x} cy={pt.y} r="3" fill="#38bdf8" stroke="#0d1117" strokeWidth="1.5" />
                  ))}

                  <path d={ratingArea} fill="#a855f7" fillOpacity={0.1} />
                  <polyline points={ratingStr} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
                  {ratingPoints.map((pt, pi) => (
                    <circle key={`r-${pi}`} cx={pt.x} cy={pt.y} r="3" fill="#a855f7" stroke="#0d1117" strokeWidth="1.5" />
                  ))}

                  {/* X-axis labels */}
                  {LOAN_PERFORMANCE_DATA.map((d, li) => {
                    const lx = chartLeft + (li / (LOAN_PERFORMANCE_DATA.length - 1)) * chartW;
                    return (
                      <text key={li} x={lx} y="150" textAnchor="middle" fill="#8b949e" fontSize="9">{d.loan}</text>
                    );
                  })}

                  {/* Legend */}
                  <rect x="70" y="160" width="10" height="8" rx="2" fill="#10b981" />
                  <text x="84" y="167" fill="#c9d1d9" fontSize="8">Goals</text>
                  <rect x="120" y="160" width="10" height="8" rx="2" fill="#38bdf8" />
                  <text x="134" y="167" fill="#c9d1d9" fontSize="8">Assists</text>
                  <rect x="175" y="160" width="10" height="8" rx="2" fill="#a855f7" />
                  <text x="189" y="167" fill="#c9d1d9" fontSize="8">Rating (×10)</text>
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG: Development During Loans Line Chart (OVR progression) */}
        <InnerCard title="OVR Development Progression" icon={TrendingUp} delay={0.2}>
          <svg viewBox="0 0 300 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Overall Rating Growth Across Loan Periods
            </text>
            {/* Grid lines */}
            {[30, 60, 90, 120].map((gy, gIdx) => (
              <line key={gIdx} x1="40" y1={gy} x2="280" y2={gy} stroke="#30363d" strokeWidth="0.5" />
            ))}
            {(() => {
              const ovrs = OVR_PROGRESSION.map(d => d.ovr);
              const maxOvr = Math.max(...ovrs);
              const minOvr = Math.min(...ovrs);
              const ovrRange = maxOvr - minOvr || 1;
              const dataPoints = ovrs.map((o, i) => ({
                x: 40 + (i / (ovrs.length - 1)) * 240,
                y: 120 - ((o - minOvr) / ovrRange) * 90,
              }));
              const areaPathStr = buildAreaPath(dataPoints, 130);
              const pointsStr = buildPointsString(dataPoints);

              return (
                <g>
                  <path d={areaPathStr} fill="#10b981" fillOpacity={0.1} />
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {dataPoints.map((dp, dpIdx) => (
                    <g key={dpIdx}>
                      <circle cx={dp.x} cy={dp.y} r="4" fill="#10b981" stroke="#0d1117" strokeWidth="2" />
                      <text x={dp.x} y={dp.y - 8} textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">
                        {ovrs[dpIdx]}
                      </text>
                    </g>
                  ))}
                  {/* X-axis labels */}
                  {OVR_PROGRESSION.map((item, lblIdx) => {
                    const lx = 40 + (lblIdx / (OVR_PROGRESSION.length - 1)) * 240;
                    return (
                      <text key={lblIdx} x={lx} y="145" textAnchor="middle" fill="#8b949e" fontSize="8">
                        {item.period.length > 8 ? item.period.substring(0, 8) + '..' : item.period}
                      </text>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG: Loan Satisfaction Ring */}
        <InnerCard title="Loan Experience Satisfaction" icon={Star} delay={0.25}>
          <svg viewBox="0 0 300 200" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const cx = 150;
              const cy = 100;
              const outerR = 75;
              const innerR = 55;
              const strokeWidth = outerR - innerR;
              const midR = (outerR + innerR) / 2;
              const circumference = 2 * Math.PI * midR;
              const loanSatPct = satisfactionPct;
              const satisfactionArc = satisfactionPct * circumference;
              const gapArc = circumference - satisfactionArc;

              return (
                <g>
                  {/* Background ring */}
                  <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
                  {/* Satisfaction arc */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={midR}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${satisfactionArc} ${gapArc}`}
                    strokeLinecap="butt"
                    opacity={0.85}
                  />
                  {/* Inner circle bg */}
                  <circle cx={cx} cy={cy} r={innerR - 2} fill="#0d1117" />
                  {/* Center text */}
                  <text x={cx} y={cy - 8} textAnchor="middle" fill="#10b981" fontSize="28" fontWeight="bold">
                    {Math.round(satisfactionPct * 100)}%
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="10">
                    Satisfaction
                  </text>
                  <text x={cx} y={cy + 22} textAnchor="middle" fill="#484f58" fontSize="8">
                    Based on {LOAN_HISTORY.length} loans
                  </text>
                  {/* Legend items */}
                  {[
                    { label: 'Playing Time', pct: 85, color: '#10b981' },
                    { label: 'Development', pct: 82, color: '#38bdf8' },
                    { label: 'Culture Fit', pct: 71, color: '#a855f7' },
                    { label: 'Competition', pct: 90, color: '#fbbf24' },
                  ].map((item, itemIdx) => {
                    const ly = 170 + itemIdx * 0;
                    const lx = 50 + itemIdx * 62;
                    return (
                      <g key={item.label}>
                        <circle cx={lx} cy={ly} r="4" fill={item.color} opacity={0.7} />
                        <text x={lx + 8} y={ly + 3} fill="#8b949e" fontSize="8">{item.label}</text>
                        <text x={lx + 8} y={ly + 12} fill="#c9d1d9" fontSize="8" fontWeight="bold">{item.pct}%</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 3 — Loan Market Analysis (camelCase render function)
  // ============================================================

  function loanMarketAnalysis(): React.JSX.Element {
    return (
      <div className="space-y-4">
        {/* Market Trends Header */}
        <div className="grid grid-cols-3 gap-2">
          <StatMiniCard label="Active Loans" value="148" subtext="This season" valueColor="text-emerald-400" />
          <StatMiniCard label="Completion Rate" value="86%" subtext="Fulfilled loans" valueColor="text-sky-400" />
          <StatMiniCard label="Avg Duration" value="8.2 mo" subtext="Season long avg" valueColor="text-amber-400" />
        </div>

        {/* Loan Categories */}
        <InnerCard title="Loan Categories" icon={Users}>
          <div className="space-y-2">
            {LOAN_CATEGORIES.map((cat, catIdx) => {
              const catPct = categoryTotal > 0 ? (cat.count / categoryTotal) * 100 : 0;
              return (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: catIdx * 0.04 }}
                  className="flex items-center gap-3 bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5"
                >
                  <div
                    className="w-3 h-8 rounded-sm"
                    style={{ backgroundColor: cat.color, opacity: 0.8 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[#c9d1d9]">{cat.label}</span>
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 + catIdx * 0.05 }}
                        className="h-full rounded-lg"
                        style={{ width: `${catPct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-[#484f58] w-8 text-right">{Math.round(catPct)}%</span>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Market Hotspots */}
        <InnerCard title="Market Hotspots" icon={Globe} delay={0.05}>
          <div className="grid grid-cols-2 gap-2">
            {MARKET_HOTSPOTS.map((spot, spotIdx) => (
              <motion.div
                key={spot.region}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.08 + spotIdx * 0.04 }}
                className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#c9d1d9]">{spot.region}</span>
                  <span className={`text-[8px] flex items-center gap-0.5 ${
                    spot.trend === 'up' ? 'text-emerald-400' :
                    spot.trend === 'down' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    <TrendingUp className="h-2.5 w-2.5" />
                    {spot.trend}
                  </span>
                </div>
                <p className="text-lg font-bold text-emerald-400 mt-1">{spot.loans}</p>
                <p className="text-[9px] text-[#484f58]">Active loans</p>
              </motion.div>
            ))}
          </div>
        </InnerCard>

        {/* Market Insights */}
        <InnerCard title="Market Trends" icon={TrendingUp} delay={0.1}>
          <div className="space-y-2">
            {[
              { insight: 'Premier League clubs are increasingly using loans for youth development rather than short-term fixes.', type: 'Trend' },
              { insight: 'Buy-option loans have increased 23% year-over-year, indicating clubs want future security.', type: 'Growth' },
              { insight: 'Emergency loans remain steady at ~10% of total market activity.', type: 'Stable' },
              { insight: 'Average loan duration has increased from 6.8 to 8.2 months over 3 seasons.', type: 'Trend' },
            ].map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-start gap-2 bg-[#21262d] rounded-lg p-2.5">
                <Badge className={`text-[7px] px-1.5 py-0 shrink-0 mt-0.5 ${
                  item.type === 'Trend' ? 'border-sky-500/25 bg-sky-500/10 text-sky-400' :
                  item.type === 'Growth' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' :
                  'border-amber-500/25 bg-amber-500/10 text-amber-400'
                }`}>
                  {item.type}
                </Badge>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">{item.insight}</p>
              </div>
            ))}
          </div>
        </InnerCard>

        {/* SVG: Loan Type Distribution Donut (5 segments via .reduce()) */}
        <InnerCard title="Loan Type Distribution" icon={BarChart3} delay={0.15}>
          <svg viewBox="0 0 300 200" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const cx = 120;
              const cy = 100;
              const outerR = 70;
              const innerR = 45;
              const midR = (outerR + innerR) / 2;
              const ringWidth = outerR - innerR;
              const circumference = 2 * Math.PI * midR;

              // Use reduce to compute segments (Rule 6)
              const computedSegments = LOAN_CATEGORIES.reduce(
                (acc, cat) => {
                  const prevOffset = acc.length === 0 ? 0 : acc[acc.length - 1].nextOffset;
                  const fraction = cat.count / categoryTotal;
                  const dashLen = fraction * circumference;
                  const gapLen = circumference - dashLen;
                  return [
                    ...acc,
                    {
                      label: cat.label,
                      count: cat.count,
                      color: cat.color,
                      dashLen,
                      gapLen,
                      rotation: prevOffset * 360 - 90,
                      pct: Math.round(fraction * 100),
                      nextOffset: prevOffset + fraction,
                    },
                  ];
                },
                [] as Array<{ label: string; count: number; color: string; dashLen: number; gapLen: number; rotation: number; pct: number; nextOffset: number }>
              );

              return (
                <g>
                  <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#21262d" strokeWidth={ringWidth} />
                  {computedSegments.map((seg, sIdx) => (
                    <circle
                      key={sIdx}
                      cx={cx}
                      cy={cy}
                      r={midR}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={ringWidth}
                      strokeDasharray={`${seg.dashLen} ${seg.gapLen}`}
                      transform={`rotate(${seg.rotation} ${cx} ${cy})`}
                      opacity={0.85}
                    />
                  ))}
                  <circle cx={cx} cy={cy} r={innerR - 2} fill="#0d1117" />
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">{categoryTotal}</text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="9">Total Loans</text>

                  {/* Legend */}
                  {computedSegments.map((seg, lgIdx) => {
                    const ly = 50 + lgIdx * 28;
                    return (
                      <g key={lgIdx}>
                        <rect x="210" y={ly - 8} width="12" height="12" rx="3" fill={seg.color} opacity={0.85} />
                        <text x="228" y={ly + 2} fill="#c9d1d9" fontSize="10">{seg.label}</text>
                        <text x="228" y={ly + 13} fill="#8b949e" fontSize="8">{seg.count} ({seg.pct}%)</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG: Loan Market Activity Bars (4 seasons) */}
        <InnerCard title="Loan Market Activity" icon={TrendingUp} delay={0.2}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Total vs Completed Loans by Season
            </text>
            {(() => {
              const maxVal = Math.max(...MARKET_ACTIVITY.map(d => Math.max(d.totalLoans, d.completed)));
              const chartH = 120;
              const baseY = 150;
              const barWidth = 24;
              const groupGap = 40;
              const startX = 45;

              return (
                <g>
                  {/* Grid */}
                  {[30, 60, 90, 120].map((gy, gIdx) => {
                    const y = baseY - gy;
                    return (
                      <g key={gIdx}>
                        <line x1={startX - 4} y1={y} x2={startX + MARKET_ACTIVITY.length * groupGap} y2={y} stroke="#30363d" strokeWidth="0.5" />
                        <text x={startX - 8} y={y + 3} textAnchor="end" fill="#484f58" fontSize="8">
                          {Math.round((gy / chartH) * maxVal)}
                        </text>
                      </g>
                    );
                  })}

                  {MARKET_ACTIVITY.map((season, sIdx) => {
                    const groupX = startX + sIdx * groupGap;
                    const totalH = (season.totalLoans / maxVal) * chartH;
                    const completedH = (season.completed / maxVal) * chartH;

                    return (
                      <g key={season.season}>
                        <rect x={groupX} y={baseY - totalH} width={barWidth} height={totalH} rx="3" fill="#38bdf8" opacity={0.4} />
                        <rect x={groupX + barWidth + 2} y={baseY - completedH} width={barWidth} height={completedH} rx="3" fill="#10b981" opacity={0.8} />
                        <text x={groupX + barWidth / 2} y={baseY - totalH - 3} textAnchor="middle" fill="#38bdf8" fontSize="8">{season.totalLoans}</text>
                        <text x={groupX + barWidth + 2 + barWidth / 2} y={baseY - completedH - 3} textAnchor="middle" fill="#10b981" fontSize="8">{season.completed}</text>
                        <text x={groupX + barWidth + 1} y={baseY + 12} textAnchor="middle" fill="#8b949e" fontSize="8">{season.season}</text>
                      </g>
                    );
                  })}

                  {/* Legend */}
                  <rect x="90" y="172" width="10" height="8" rx="2" fill="#38bdf8" opacity={0.4} />
                  <text x="104" y="179" fill="#c9d1d9" fontSize="8">Total</text>
                  <rect x="150" y="172" width="10" height="8" rx="2" fill="#10b981" opacity={0.8} />
                  <text x="164" y="179" fill="#c9d1d9" fontSize="8">Completed</text>
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG: League Popularity for Loans Radar (5-axis) */}
        <InnerCard title="League Popularity for Loans" icon={Globe} delay={0.25}>
          <svg viewBox="0 0 300 260" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="16" textAnchor="middle" fill="#8b949e" fontSize="10">
              Loan Activity by League
            </text>
            {/* Grid pentagons */}
            {[25, 50, 75, 100].map((pct, ringIdx) => {
              const r = (pct / 100) * 85;
              const angles = [0, 72, 144, 216, 288];
              const ringPoints = angles.map(a => polarToCartesian(150, 130, r, a - 90));
              return (
                <polygon
                  key={ringIdx}
                  points={buildPointsString(ringPoints)}
                  fill="none"
                  stroke="#30363d"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Axis lines */}
            {[0, 72, 144, 216, 288].map((angle, axIdx) => {
              const endPt = polarToCartesian(150, 130, 95, angle - 90);
              return (
                <line key={axIdx} x1="150" y1="130" x2={endPt.x} y2={endPt.y} stroke="#30363d" strokeWidth="0.5" />
              );
            })}
            {/* Labels */}
            {LEAGUE_POPULARITY.map((league, lIdx) => {
              const angle = [0, 72, 144, 216, 288][lIdx];
              const labelPos = polarToCartesian(150, 130, 110, angle - 90);
              return (
                <text key={league.league} x={labelPos.x} y={labelPos.y} textAnchor="middle" fill="#c9d1d9" fontSize="9">
                  {league.league.length > 12 ? league.league.substring(0, 12) : league.league}
                </text>
              );
            })}
            {/* Data polygon */}
            {(() => {
              const dataPoints = LEAGUE_POPULARITY.map((league, idx) =>
                polarToCartesian(150, 130, (league.value / 100) * 85, [0, 72, 144, 216, 288][idx] - 90)
              );
              const dataStr = buildPointsString(dataPoints);
              return (
                <g>
                  <polygon points={dataStr} fill="#10b981" fillOpacity={0.15} stroke="#10b981" strokeWidth="2" />
                  {dataPoints.map((pt, ptIdx) => (
                    <g key={ptIdx}>
                      <circle cx={pt.x} cy={pt.y} r="3.5" fill="#10b981" stroke="#0d1117" strokeWidth="1.5" />
                      <text x={pt.x + 7} y={pt.y - 3} fill="#10b981" fontSize="8" fontWeight="bold">
                        {LEAGUE_POPULARITY[ptIdx].value}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </InnerCard>
      </div>
    );
  }

  // ============================================================
  // Tab 4 — Loan Strategy (camelCase render function)
  // ============================================================

  function loanStrategy(): React.JSX.Element {
    const recommended = STRATEGIES.find(s => s.recommended);

    return (
      <div className="space-y-4">
        {/* Strategy Overview */}
        <div className="grid grid-cols-3 gap-2">
          <StatMiniCard label="Strategies" value="5" subtext="Analyzed" valueColor="text-emerald-400" />
          <StatMiniCard label="Best Option" value="Atalanta" subtext="Dev: +90%" valueColor="text-sky-400" />
          <StatMiniCard label="Safest Bet" value="Stay" subtext="Risk: 20%" valueColor="text-amber-400" />
        </div>

        {/* Recommended Strategies */}
        <InnerCard title="Recommended Loan Strategies" icon={Target}>
          <div className="space-y-2">
            {STRATEGIES.map((strat, stratIdx) => {
              const riskLevel = strat.risk <= 25 ? 'Low' : strat.risk <= 50 ? 'Medium' : 'High';
              const riskColor = strat.risk <= 25 ? 'text-emerald-400' : strat.risk <= 50 ? 'text-amber-400' : 'text-red-400';
              return (
                <motion.div
                  key={strat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: stratIdx * 0.04 }}
                  className={`bg-[#0d1117] border rounded-lg p-3 ${
                    strat.recommended ? 'border-emerald-500/30' : 'border-[#21262d]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {strat.recommended && (
                        <Badge className="text-[7px] px-1.5 py-0 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                          <Star className="h-2.5 w-2.5 mr-0.5" />
                          Top Pick
                        </Badge>
                      )}
                      <div>
                        <p className={`text-xs font-semibold ${strat.recommended ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                          {strat.name}
                        </p>
                        <p className="text-[9px] text-[#8b949e]">{strat.type}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold ${riskColor}`}>
                      Risk: {riskLevel}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#8b949e] mt-2 leading-relaxed">{strat.desc}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#21262d]">
                    <div className="text-center">
                      <p className="text-[8px] text-[#484f58]">Dev Boost</p>
                      <p className="text-[10px] font-bold text-emerald-400">+{strat.devBoost}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-[#484f58]">Wage Keep</p>
                      <p className="text-[10px] font-bold text-sky-400">{strat.wageRetention}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-[#484f58]">Play Time</p>
                      <p className="text-[10px] font-bold text-amber-400">{strat.playingTime}%</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </InnerCard>

        {/* Risk Assessment */}
        <InnerCard title="Risk Assessment" icon={AlertTriangle} delay={0.05}>
          <div className="space-y-2">
            {STRATEGIES.slice(0, 3).map((strat, riskIdx) => {
              const riskPct = strat.risk;
              const riskColor = riskPct <= 25 ? '#10b981' : riskPct <= 50 ? '#fbbf24' : '#f87171';
              return (
                <div key={strat.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#c9d1d9]">{strat.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: riskColor }}>{riskPct}%</span>
                  </div>
                  <div className="h-2.5 bg-[#21262d] rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + riskIdx * 0.05 }}
                      className="h-full rounded-lg"
                      style={{ width: `${riskPct}%`, backgroundColor: riskColor }}
                    />
                  </div>
                  <p className="text-[8px] text-[#484f58]">
                    {riskPct <= 25 ? 'Minimal risk of disrupted development' :
                     riskPct <= 50 ? 'Moderate challenge — significant growth potential' :
                     'High pressure environment — may affect confidence'}
                  </p>
                </div>
              );
            })}
          </div>
        </InnerCard>

        {/* Agent Recommendation */}
        <InnerCard title="Agent Recommendation" icon={Users} delay={0.1}>
          <div className="bg-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-400">Recommended: {recommended?.name ?? 'N/A'}</p>
                <p className="text-[9px] text-[#8b949e]">Based on career trajectory analysis</p>
              </div>
            </div>
            <p className="text-[10px] text-[#8b949e] leading-relaxed">
              After evaluating all available options, our recommendation for {playerName} is to pursue the <span className="text-emerald-400 font-medium">{recommended?.name ?? '—'}</span> move. This option provides the optimal balance of development opportunity (dev boost: +{recommended?.devBoost ?? 0}%), competitive environment, and manageable risk level ({recommended?.risk ?? 0}%). The coaching setup at {recommended?.name ?? 'the club'} has a proven track record with similar player profiles, and the {recommended?.playingTime ?? 0}% playing time guarantee ensures regular match exposure.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-emerald-500/20">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[9px] font-semibold text-emerald-400">Key Strength</span>
              </div>
              <p className="text-[9px] text-[#8b949e] mt-1">High-intensity coaching environment with structured development pathway</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-2.5 border border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[9px] font-semibold text-amber-400">Consideration</span>
              </div>
              <p className="text-[9px] text-[#8b949e] mt-1">Playing time guarantee is lower than alternatives — competition for places</p>
            </div>
          </div>
        </InnerCard>

        {/* SVG: Risk vs Reward Scatter (x=risk, y=devBoost, 5 strategy options) */}
        <InnerCard title="Risk vs Reward Analysis" icon={Target} delay={0.15}>
          <svg viewBox="0 0 300 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Risk Level vs Development Boost
            </text>
            {/* Axes */}
            <line x1="50" y1="190" x2="280" y2="190" stroke="#484f58" strokeWidth="1" />
            <line x1="50" y1="30" x2="50" y2="190" stroke="#484f58" strokeWidth="1" />
            {/* Axis labels */}
            <text x="165" y="208" textAnchor="middle" fill="#8b949e" fontSize="9">Risk Level</text>
            <text x="20" y="110" textAnchor="middle" fill="#8b949e" fontSize="9" transform="rotate(-90 20 110)">Dev Boost</text>
            {/* Grid */}
            {[0, 25, 50, 75, 100].map((val, gIdx) => {
              const x = 50 + (val / 100) * 220;
              const y = 190 - (val / 100) * 150;
              return (
                <g key={gIdx}>
                  <line x1={x} y1="30" x2={x} y2="190" stroke="#30363d" strokeWidth="0.3" />
                  <line x1="50" y1={y} x2="280" y2={y} stroke="#30363d" strokeWidth="0.3" />
                  <text x={x} y="200" textAnchor="middle" fill="#484f58" fontSize="7">{val}</text>
                  <text x="45" y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{val}</text>
                </g>
              );
            })}
            {/* Data points */}
            {STRATEGIES.map((strat, sIdx) => {
              const px = 50 + (strat.risk / 100) * 220;
              const py = 190 - (strat.devBoost / 100) * 150;
              const dotColor = strat.recommended ? '#10b981' : strat.risk <= 25 ? '#38bdf8' : strat.risk <= 50 ? '#fbbf24' : '#f87171';
              const dotR = strat.recommended ? 8 : 6;
              return (
                <g key={strat.id}>
                  <circle cx={px} cy={py} r={dotR + 4} fill={dotColor} opacity={0.15} />
                  <circle cx={px} cy={py} r={dotR} fill={dotColor} stroke="#0d1117" strokeWidth="2" />
                  <text x={px + dotR + 4} y={py - 2} fill="#c9d1d9" fontSize="8" fontWeight={strat.recommended ? 'bold' : 'normal'}>
                    {strat.name.split(' ')[0]}
                  </text>
                  {strat.recommended && (
                    <text x={px + dotR + 4} y={py + 8} fill="#10b981" fontSize="7">★ Best</text>
                  )}
                </g>
              );
            })}
          </svg>
        </InnerCard>

        {/* SVG: Strategy Effectiveness Bars (3 strategies × 4 metrics) */}
        <InnerCard title="Strategy Effectiveness Comparison" icon={BarChart3} delay={0.2}>
          <svg viewBox="0 0 300 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Top 3 Strategies — Multi-Metric Comparison
            </text>
            {(() => {
              const metrics = ['development', 'experience', 'visibility', 'satisfaction'] as const;
              const metricLabels = ['Development', 'Experience', 'Visibility', 'Satisfaction'];
              const colors = ['#10b981', '#38bdf8', '#a855f7', '#fbbf24'];
              const strategyColors = ['#a855f7', '#38bdf8', '#10b981'];
              const groupWidth = 75;
              const barWidth = 14;
              const startX = 30;
              const chartBottom = 195;
              const chartTop = 30;
              const chartH = chartBottom - chartTop;

              return (
                <g>
                  {/* Grid */}
                  {[0, 25, 50, 75, 100].map((pct, gIdx) => {
                    const y = chartBottom - (pct / 100) * chartH;
                    return (
                      <g key={gIdx}>
                        <line x1={startX} y1={y} x2={startX + STRATEGY_METRICS.length * groupWidth + 10} y2={y} stroke="#30363d" strokeWidth="0.3" />
                        <text x={startX - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{pct}</text>
                      </g>
                    );
                  })}

                  {STRATEGY_METRICS.map((strat, sIdx) => {
                    const groupX = startX + sIdx * groupWidth + 10;
                    return (
                      <g key={strat.strategy}>
                        {metrics.map((metric, mIdx) => {
                          const val = strat[metric];
                          const barH = (val / 100) * chartH;
                          const bx = groupX + mIdx * (barWidth + 2);
                          return (
                            <rect
                              key={mIdx}
                              x={bx}
                              y={chartBottom - barH}
                              width={barWidth}
                              height={barH}
                              rx="2"
                              fill={colors[mIdx]}
                              opacity={0.8}
                            />
                          );
                        })}
                        <text x={groupX + (metrics.length * (barWidth + 2)) / 2 - 1} y={chartBottom + 12} textAnchor="middle" fill="#8b949e" fontSize="8">
                          {strat.strategy}
                        </text>
                      </g>
                    );
                  })}

                  {/* Legend */}
                  {metricLabels.map((label, lIdx) => (
                    <g key={label}>
                      <rect x={30 + lIdx * 68} y={208} width="10" height="8" rx="2" fill={colors[lIdx]} opacity={0.8} />
                      <text x={44 + lIdx * 68} y="215" fill="#c9d1d9" fontSize="7">{label}</text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* SVG: Long-term Impact Area Chart (projected OVR with/without loan) */}
        <InnerCard title="Long-term Impact Projection" icon={TrendingUp} delay={0.25}>
          <svg viewBox="0 0 300 180" className="w-full" preserveAspectRatio="xMidYMid meet">
            <text x="150" y="14" textAnchor="middle" fill="#8b949e" fontSize="10">
              Projected OVR Growth: With Loan vs Without Loan
            </text>
            {/* Grid */}
            {[30, 60, 90, 120].map((gy, gIdx) => (
              <line key={gIdx} x1="40" y1={gy} x2="280" y2={gy} stroke="#30363d" strokeWidth="0.5" />
            ))}
            {(() => {
              const allOvrs = LONG_TERM_OVR.flatMap(d => [d.withLoan, d.withoutLoan]);
              const maxOvrVal = Math.max(...allOvrs);
              const minOvrVal = Math.min(...allOvrs);
              const ovrValRange = maxOvrVal - minOvrVal || 1;

              const withLoanPoints = LONG_TERM_OVR.map((d, i) => ({
                x: 40 + (i / (LONG_TERM_OVR.length - 1)) * 240,
                y: 130 - ((d.withLoan - minOvrVal) / ovrValRange) * 100,
              }));
              const withoutLoanPoints = LONG_TERM_OVR.map((d, i) => ({
                x: 40 + (i / (LONG_TERM_OVR.length - 1)) * 240,
                y: 130 - ((d.withoutLoan - minOvrVal) / ovrValRange) * 100,
              }));

              const withLoanArea = buildAreaPath(withLoanPoints, 140);
              const withoutLoanArea = buildAreaPath(withoutLoanPoints, 140);
              const withLoanStr = buildPointsString(withLoanPoints);
              const withoutLoanStr = buildPointsString(withoutLoanPoints);

              return (
                <g>
                  {/* With Loan area + line */}
                  <path d={withLoanArea} fill="#10b981" fillOpacity={0.1} />
                  <polyline points={withLoanStr} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {withLoanPoints.map((pt, pi) => (
                    <g key={`wl-${pi}`}>
                      <circle cx={pt.x} cy={pt.y} r="4" fill="#10b981" stroke="#0d1117" strokeWidth="2" />
                      <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">{LONG_TERM_OVR[pi].withLoan}</text>
                    </g>
                  ))}

                  {/* Without Loan area + line */}
                  <path d={withoutLoanArea} fill="#f87171" fillOpacity={0.08} />
                  <polyline points={withoutLoanStr} fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
                  {withoutLoanPoints.map((pt, pi) => (
                    <g key={`wol-${pi}`}>
                      <circle cx={pt.x} cy={pt.y} r="3" fill="#f87171" stroke="#0d1117" strokeWidth="1.5" />
                      <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#f87171" fontSize="8">{LONG_TERM_OVR[pi].withoutLoan}</text>
                    </g>
                  ))}

                  {/* X-axis labels */}
                  {LONG_TERM_OVR.map((d, lIdx) => {
                    const lx = 40 + (lIdx / (LONG_TERM_OVR.length - 1)) * 240;
                    return (
                      <text key={lIdx} x={lx} y="152" textAnchor="middle" fill="#8b949e" fontSize="9">{d.season}</text>
                    );
                  })}

                  {/* Difference annotation */}
                  {(() => {
                    const lastWithLoan = LONG_TERM_OVR[LONG_TERM_OVR.length - 1].withLoan;
                    const lastWithoutLoan = LONG_TERM_OVR[LONG_TERM_OVR.length - 1].withoutLoan;
                    const diff = lastWithLoan - lastWithoutLoan;
                    return (
                      <g>
                        <rect x="195" y="156" width="80" height="20" rx="4" fill="#10b981" fillOpacity={0.15} stroke="#10b981" strokeWidth="0.5" />
                        <text x="235" y="169" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">+{diff} OVR gain</text>
                      </g>
                    );
                  })()}

                  {/* Legend */}
                  <rect x="80" y="170" width="10" height="8" rx="2" fill="#10b981" />
                  <text x="94" y="177" fill="#c9d1d9" fontSize="8">With Loan</text>
                  <rect x="160" y="170" width="10" height="8" rx="2" fill="#f87171" />
                  <text x="174" y="177" fill="#c9d1d9" fontSize="8">Without Loan</text>
                </g>
              );
            })()}
          </svg>
        </InnerCard>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-10 text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-lg"
            onClick={() => setActiveTab('available')}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
            View Available Loans
          </Button>
          <Button
            className="h-10 text-xs bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] rounded-lg"
            onClick={handleBack}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117]/95 border-b border-[#21262d] px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] rounded-lg"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#c9d1d9]">Loan System Enhanced</h1>
            <p className="text-[10px] text-[#484f58]">{playerName} · Loan Management Center</p>
          </div>
          <Badge className="text-[9px] px-2 py-0.5 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
            <Shield className="h-2.5 w-2.5 mr-0.5" />
            Active
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#161b22] border border-[#21262d] rounded-lg h-auto p-1">
            {[
              { value: 'available', label: 'Available Loans', icon: ArrowRightLeft },
              { value: 'history', label: 'Loan History', icon: Clock },
              { value: 'market', label: 'Market Analysis', icon: BarChart3 },
              { value: 'strategy', label: 'Loan Strategy', icon: Target },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-1 text-[10px] data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400 rounded-md"
              >
                <tab.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="available">{availableLoans()}</TabsContent>
          <TabsContent value="history">{loanHistory()}</TabsContent>
          <TabsContent value="market">{loanMarketAnalysis()}</TabsContent>
          <TabsContent value="strategy">{loanStrategy()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
