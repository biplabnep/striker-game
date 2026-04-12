'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import { isTransferWindow } from '@/lib/game/transferEngine';
import { getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  Plane,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  Users,
  Timer,
  Award,
  Star,
  Briefcase,
  ChevronUp,
  Zap,
  BarChart3,
  Calendar,
  Lock,
  Unlock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContractNegotiation from '@/components/game/ContractNegotiation';

// ============================================================
// Animated Number Counter
// ============================================================
function AnimatedNumber({ value, formatFn }: { value: number; formatFn: (v: number) => string }) {
  const [displayed, setDisplayed] = useState(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = displayed;
    const end = value;
    const diff = end - start;
    if (Math.abs(diff) < 0.001) {
      setTimeout(() => setDisplayed(end), 0);
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span>{formatFn(displayed)}</span>;
}

// ============================================================
// Transfer Window Timeline
// ============================================================
function TransferWindowTimeline({ currentWeek, leagueId }: { currentWeek: number; leagueId: string }) {
  const totalWeeks = getSeasonMatchdays(leagueId);
  const windows = [
    { start: 1, end: 12, label: 'Summer Window', color: 'emerald' },
    { start: 25, end: 28, label: 'Winter Window', color: 'cyan' },
  ];

  const getWeekPosition = (week: number) => (week / totalWeeks) * 100;

  const getWindowForWeek = (week: number) => {
    for (const w of windows) {
      if (week >= w.start && week <= w.end) return w;
    }
    return null;
  };

  const currentWindow = getWindowForWeek(currentWeek);
  const nextWindow = windows.find(w => w.start > currentWeek);

  return (
    <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          Transfer Window Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Timeline Bar */}
        <div className="relative h-8 rounded-lg bg-[#21262d] overflow-hidden">
          {/* Window regions */}
          {windows.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.2 }}
              className={`absolute top-0 h-full ${
                w.color === 'emerald' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
              }`}
              style={{
                left: `${getWeekPosition(w.start)}%`,
                width: `${getWeekPosition(w.end) - getWeekPosition(w.start)}%`,
                transformOrigin: 'left',
              }}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 ${
                w.color === 'emerald' ? 'bg-emerald-500/60' : 'bg-cyan-500/60'
              }`} />
              <span className={`absolute top-1 left-1 text-[8px] font-bold ${
                w.color === 'emerald' ? 'text-emerald-400' : 'text-cyan-400'
              }`}>
                {w.label}
              </span>
              <span className="absolute bottom-0.5 right-1 text-[7px] text-[#8b949e]">
                Wk {w.start}-{w.end}
              </span>
            </motion.div>
          ))}

          {/* Current Week Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ left: `${getWeekPosition(Math.min(currentWeek, totalWeeks))}%` }}
          >
            <div className="w-0.5 h-full bg-amber-400/80" />
            <div className="absolute -top-0.5 w-2 h-2 rounded-full bg-amber-400 shadow shadow-amber-400/50" />
          </motion.div>

          {/* Week labels */}
          <div className="absolute bottom-0 inset-x-0 flex justify-between px-1">
            <span className="text-[7px] text-[#484f58]">Wk 1</span>
            <span className="text-[7px] text-[#484f58]">Wk {totalWeeks}</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge className={`text-[10px] ${currentWindow ? (currentWindow.color === 'emerald' ? 'bg-emerald-700' : 'bg-cyan-700') : 'bg-slate-700'}`}>
            {currentWindow ? (
              <><span className="mr-1 animate-pulse">🟢</span> {currentWindow.label} Open</>
            ) : (
              <>🔴 Window Closed</>
            )}
          </Badge>
          <span className="text-[10px] text-[#8b949e]">
            Week {currentWeek} of {totalWeeks}
          </span>
        </div>

        {/* Next window countdown */}
        {!currentWindow && nextWindow && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Timer className="h-3 w-3 text-[#8b949e]" />
            Next window in {nextWindow.start - currentWeek} weeks
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Club Comparison Card
// ============================================================
function ClubComparisonCard({
  currentClub,
  offerClub,
  currentRole,
  offeredRole,
}: {
  currentClub: { name: string; quality: number; league: string; logo: string; reputation: number; shortName: string };
  offerClub: { name: string; quality: number; league: string; logo: string; reputation: number; shortName: string };
  currentRole: string;
  offeredRole: string;
}) {
  const formatLeague = (l: string) => getLeagueById(l)?.name ?? l.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'starter': return 'Starter';
      case 'rotation': return 'Rotation';
      case 'bench': return 'Bench';
      case 'prospect': return 'Prospect';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'starter': return 'text-emerald-400';
      case 'rotation': return 'text-amber-400';
      case 'bench': return 'text-red-400';
      case 'prospect': return 'text-blue-400';
      default: return 'text-[#8b949e]';
    }
  };

  const getPlayingTime = (role: string) => {
    switch (role) {
      case 'starter': return { pct: 85, label: 'High' };
      case 'rotation': return { pct: 50, label: 'Moderate' };
      case 'bench': return { pct: 20, label: 'Low' };
      case 'prospect': return { pct: 15, label: 'Very Low' };
      default: return { pct: 30, label: 'Unknown' };
    }
  };

  const currentTime = getPlayingTime(currentRole);
  const offeredTime = getPlayingTime(offeredRole);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <div className="text-[10px] text-[#8b949e]  flex items-center gap-1.5">
        <Shield className="h-3 w-3" />
        Club Comparison
      </div>

      {/* Quality Comparison Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e]">Squad Quality</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8b949e] w-12 truncate">{currentClub.shortName}</span>
            <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentClub.quality}%` }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="h-full bg-emerald-500/70 rounded-full"
              />
            </div>
            <span className="text-[10px] text-[#8b949e] w-6 text-right">{currentClub.quality}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8b949e] w-12 truncate">{offerClub.shortName}</span>
            <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${offerClub.quality}%` }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="h-full bg-cyan-500/70 rounded-full"
              />
            </div>
            <span className="text-[10px] text-[#8b949e] w-6 text-right">{offerClub.quality}</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="text-[9px] text-[#484f58]" />
        <div className="text-[9px] text-emerald-500 font-medium">{currentClub.shortName}</div>
        <div className="text-[9px] text-cyan-500 font-medium">{offerClub.shortName}</div>

        {/* League */}
        <div className="text-[9px] text-[#484f58] text-left">League</div>
        <div className="text-[9px] text-[#c9d1d9]">{formatLeague(currentClub.league)}</div>
        <div className="text-[9px] text-[#c9d1d9]">{formatLeague(offerClub.league)}</div>

        {/* Reputation */}
        <div className="text-[9px] text-[#484f58] text-left">Reputation</div>
        <div className="text-[9px] text-[#c9d1d9]">{currentClub.reputation}</div>
        <div className={`text-[9px] font-medium ${offerClub.reputation > currentClub.reputation ? 'text-cyan-400' : offerClub.reputation < currentClub.reputation ? 'text-red-400' : 'text-[#c9d1d9]'}`}>
          {offerClub.reputation > currentClub.reputation && <ChevronUp className="inline h-2.5 w-2.5" />}
          {offerClub.reputation}
        </div>

        {/* Squad Role */}
        <div className="text-[9px] text-[#484f58] text-left">Role</div>
        <div className={`text-[9px] font-medium ${getRoleColor(currentRole)}`}>{getRoleLabel(currentRole)}</div>
        <div className={`text-[9px] font-medium ${getRoleColor(offeredRole)}`}>{getRoleLabel(offeredRole)}</div>
      </div>

      {/* Playing Time Likelihood */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-[#8b949e]">Playing Time Likelihood</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-0.5">
            <div className="flex justify-between text-[9px]">
              <span className="text-emerald-500">{currentClub.shortName}</span>
              <span className="text-[#8b949e]">{currentTime.label}</span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentTime.pct}%` }}
                transition={{ duration: 0.2, delay: 0.3 }}
                className="h-full bg-emerald-500/60 rounded-full"
              />
            </div>
          </div>
          <ArrowRight className="h-3 w-3 text-[#484f58] shrink-0" />
          <div className="flex-1 space-y-0.5">
            <div className="flex justify-between text-[9px]">
              <span className="text-cyan-500">{offerClub.shortName}</span>
              <span className="text-[#8b949e]">{offeredTime.label}</span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${offeredTime.pct}%` }}
                transition={{ duration: 0.2, delay: 0.4 }}
                className={`h-full rounded-full ${offeredTime.pct >= currentTime.pct ? 'bg-cyan-500/60' : 'bg-red-500/40'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Market Value Sparkline
// ============================================================
function MarketValueSparkline({ player, recentResults }: { player: { marketValue: number; overall: number; age: number; potential: number; reputation: number }; recentResults: { playerRating: number }[] }) {
  // Derive approximate value history from recent results ratings
  const dataPoints = useMemo(() => {
    const current = player.marketValue;
    const points: number[] = [current];

    // Work backwards from recent results to approximate historical values
    const ratings = recentResults.slice(0, 10).map(r => r.playerRating).reverse();
    for (let i = ratings.length - 1; i >= 0; i--) {
      const rating = ratings[i];
      // Approximate previous value: lower ratings = lower historical value
      const factor = 1 - (7.0 - rating) * 0.03; // each rating point below 7 = ~3% lower
      const prevVal = points[0] * Math.max(0.85, factor);
      points.unshift(Math.round(prevVal * 100) / 100);
    }

    // Keep only last 10
    return points.slice(-10);
  }, [player.marketValue, recentResults]);

  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal || 1;

  const svgW = 200;
  const svgH = 40;
  const padX = 4;
  const padY = 4;

  const points = dataPoints.map((v, i) => ({
    x: dataPoints.length <= 1 ? svgW / 2 : padX + (i / (dataPoints.length - 1)) * (svgW - padX * 2),
    y: padY + (1 - (v - minVal) / range) * (svgH - padY * 2),
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},${svgH} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${svgH} Z`;

  const isUp = dataPoints[dataPoints.length - 1] >= dataPoints[0];
  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-10" preserveAspectRatio="none">
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={color}
        fillOpacity={0.08}
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: 0.08 }}
        transition={{ duration: 0.2 }}
      />
      {/* Line */}
      <motion.polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      />
      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
      />
    </svg>
  );
}

// ============================================================
// Agent Quality Card
// ============================================================
function AgentQualityCard({ agentQuality, reputation }: { agentQuality: number; reputation: number }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const agentTier = useMemo(() => {
    if (agentQuality >= 80) return { label: 'Super Agent', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Crown };
    if (agentQuality >= 60) return { label: 'Top Agent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Star };
    if (agentQuality >= 40) return { label: 'Good Agent', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Briefcase };
    if (agentQuality >= 20) return { label: 'Average Agent', color: 'text-[#8b949e]', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Users };
    return { label: 'Rookie Agent', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Users };
  }, [agentQuality]);

  const commission = useMemo(() => {
    // Higher quality agents take higher commission
    return Math.round(5 + agentQuality * 0.08);
  }, [agentQuality]);

  const dealQuality = useMemo(() => {
    // Approximate recent deal quality from agent quality
    if (agentQuality >= 70) return 'Excellent deals';
    if (agentQuality >= 50) return 'Good deals';
    if (agentQuality >= 30) return 'Fair deals';
    return 'Basic deals';
  }, [agentQuality]);

  const canUpgrade = reputation >= 40 && agentQuality < 90;
  const upgradeCost = Math.round(agentQuality * 0.5 + 10);

  const TierIcon = agentTier.icon;

  return (
    <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5" />
          Your Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Agent Rating */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${agentTier.bg} border ${agentTier.border} flex items-center justify-center`}>
            <TierIcon className={`h-5 w-5 ${agentTier.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${agentTier.color}`}>{agentTier.label}</span>
              <Badge className="bg-[#21262d] text-[9px] text-[#8b949e] border-[#30363d]">
                Lvl {Math.floor(agentQuality / 10)}
              </Badge>
            </div>
            <div className="mt-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agentQuality}%` }}
                transition={{ duration: 0.2 }}
                className={`h-full rounded-full ${
                  agentQuality >= 70 ? 'bg-amber-500' :
                  agentQuality >= 50 ? 'bg-emerald-500' :
                  agentQuality >= 30 ? 'bg-blue-500' : 'bg-slate-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2">
            <span className="text-[9px] text-[#8b949e] uppercase">Commission</span>
            <p className="text-xs font-semibold text-white">{commission}%</p>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2">
            <span className="text-[9px] text-[#8b949e] uppercase">Deal Quality</span>
            <p className="text-xs font-semibold text-[#c9d1d9]">{dealQuality}</p>
          </div>
        </div>

        {/* Agent Upgrade */}
        {canUpgrade && (
          <div className="pt-2 border-t border-[#30363d]">
            <AnimatePresence mode="wait">
              {!showUpgrade ? (
                <motion.button
                  key="upgrade-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowUpgrade(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-700/40 transition-colors"
                >
                  <Unlock className="h-3 w-3" />
                  Upgrade Agent Available
                  <ChevronUp className="h-3 w-3" />
                </motion.button>
              ) : (
                <motion.div
                  key="upgrade-detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400">Agent Upgrade</span>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">
                      Hire a better agent to improve transfer negotiations and contract offers.
                      Cost: <span className="text-amber-400 font-medium">{upgradeCost} reputation pts</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 bg-emerald-700 hover:bg-emerald-600 text-[10px]">
                      <Zap className="mr-1 h-3 w-3" /> Upgrade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 border-[#30363d] text-[#8b949e] text-[10px]"
                      onClick={() => setShowUpgrade(false)}
                    >
                      Later
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!canUpgrade && agentQuality >= 90 && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
            <Lock className="h-3 w-3" />
            Max agent tier reached
          </div>
        )}

        {!canUpgrade && reputation < 40 && agentQuality < 90 && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Lock className="h-3 w-3" />
            Need 40+ reputation to upgrade
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Placeholder Crown icon for agent tier
function Crown(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

// ============================================================
// Confirmation Button
// ============================================================
function ConfirmButton({
  onConfirm,
  variant,
  children,
  confirmLabel,
}: {
  onConfirm: () => void;
  variant: 'accept' | 'reject';
  children: React.ReactNode;
  confirmLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = useCallback(() => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 2500);
    }
  }, [confirming, onConfirm]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isAccept = variant === 'accept';

  return (
    <motion.div className="flex-1">
      <Button
        onClick={handleClick}
        size="sm"
        className={`w-full text-xs h-8 transition-all duration-200 ${
          confirming
            ? isAccept
              ? 'bg-emerald-500 hover:bg-emerald-400 ring-2 ring-emerald-400/50 shadow shadow-emerald-500/20'
              : 'bg-red-500 hover:bg-red-400 ring-2 ring-red-400/50 shadow shadow-red-500/20'
            : isAccept
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'border-[#30363d] text-[#8b949e]'
        } ${!confirming && !isAccept ? 'border' : ''}`}
        variant={!confirming && !isAccept ? 'outline' : undefined}
      >
        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.span
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {isAccept ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {confirmLabel}
            </motion.span>
          ) : (
            <motion.span
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

// ============================================================
// Main TransferHub Component
// ============================================================
export default function TransferHub() {
  const gameState = useGameStore(state => state.gameState);
  const acceptTransfer = useGameStore(state => state.acceptTransfer);
  const rejectTransfer = useGameStore(state => state.rejectTransfer);
  const acceptLoan = useGameStore(state => state.acceptLoan);
  const rejectLoan = useGameStore(state => state.rejectLoan);

  const [showContractNegotiation, setShowContractNegotiation] = useState(false);

  const player = gameState?.player;
  const currentClub = gameState?.currentClub;
  const transferOffers = gameState?.transferOffers ?? [];
  const loanOffers = gameState?.loanOffers ?? [];
  const currentWeek = gameState?.currentWeek ?? 1;

  const transferWindow = isTransferWindow(currentWeek);
  const canNegotiate = player ? player.contract.yearsRemaining <= 2 : false;

  // Contract visualization
  const contractYears = player?.contract.yearsRemaining ?? 0;
  const maxContractYears = 5;
  const contractPct = (contractYears / maxContractYears) * 100;

  const getContractColor = (years: number) => {
    if (years <= 1) return { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' };
    if (years <= 2) return { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  };

  const contractColors = getContractColor(contractYears);

  if (!gameState || !player || !currentClub) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold">Transfer Hub</h2>
        <Badge className={`text-[10px] ${transferWindow ? 'bg-emerald-600' : 'bg-slate-700'}`}>
          {transferWindow ? '🟢 Window Open' : '🔴 Window Closed'}
        </Badge>
      </motion.div>

      {/* Transfer Window Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <TransferWindowTimeline currentWeek={currentWeek} leagueId={currentClub.league} />
      </motion.div>

      {/* Current Contract Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Current Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {/* Club & Wage */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentClub.logo}</span>
                <div>
                  <p className="font-semibold text-sm">{currentClub.name}</p>
                  <p className="text-[10px] text-[#8b949e]">{getLeagueById(currentClub.league)?.name ?? currentClub.league.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-400">
                  <AnimatedNumber value={player.contract.weeklyWage} formatFn={(v) => formatCurrency(v, 'K')} />
                </p>
                <p className="text-[10px] text-[#8b949e]">per week</p>
              </div>
            </div>

            {/* Contract Status Bar */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b949e]">Contract Duration</span>
                <span className={`text-xs font-semibold ${contractColors.text}`}>
                  {contractYears} year{contractYears !== 1 ? 's' : ''} remaining
                </span>
              </div>
              <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${contractPct}%` }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${contractColors.bar}`}
                />
              </div>
              <div className="flex justify-between text-[8px] text-[#484f58]">
                <span>Expiring</span>
                <span>5 years</span>
              </div>
            </div>

            {/* Release Clause */}
            {player.contract.releaseClause && (
              <div className="mb-3 pt-2 border-t border-[#30363d] flex items-center justify-between">
                <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Release Clause
                </span>
                <span className="text-xs text-amber-400 font-medium">
                  <AnimatedNumber value={player.contract.releaseClause} formatFn={(v) => formatCurrency(v, 'M')} />
                </span>
              </div>
            )}

            {/* Signing Bonus */}
            {player.contract.signingBonus ? (
              <div className="mb-3 pt-2 border-t border-[#30363d] flex items-center justify-between">
                <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Award className="h-3 w-3" /> Signing Bonus
                </span>
                <span className="text-xs text-white font-medium">
                  <AnimatedNumber value={player.contract.signingBonus} formatFn={(v) => formatCurrency(v, 'K')} />
                </span>
              </div>
            ) : null}

            {/* Negotiate Contract Button */}
            {canNegotiate && (
              <div className="pt-2 border-t border-[#30363d]">
                <Button
                  onClick={() => setShowContractNegotiation(true)}
                  size="sm"
                  className={`w-full h-9 font-semibold text-xs ${
                    contractYears <= 1
                      ? 'bg-red-700 hover:bg-red-600'
                      : 'bg-amber-700 hover:bg-amber-600'
                  } text-white`}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  {contractYears <= 1 ? 'Contract Expiring! Negotiate Now' : 'Negotiate Contract'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Value Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Market Value
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-400">
                  <AnimatedNumber value={player.marketValue} formatFn={(v) => formatCurrency(v, 'M')} />
                </span>
              </div>
            </div>
            {/* Sparkline */}
            <MarketValueSparkline player={player} recentResults={gameState.recentResults} />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-[#484f58]">Recent trend</span>
              <span className="text-[9px] text-[#8b949e]">
                OVR {player.overall} • Age {player.age}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Quality Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AgentQualityCard agentQuality={player.agentQuality} reputation={player.reputation} />
      </motion.div>

      {/* Transfer Offers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-semibold text-[#8b949e] mb-2 flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Offers ({transferOffers.length})
        </h3>
        {transferOffers.length === 0 ? (
          <Card className="bg-[#161b22]/50 border-[#30363d]">
            <CardContent className="p-4 text-center text-sm text-[#484f58]">
              No transfer offers available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {transferOffers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card
                    className="bg-[#161b22]  border-[#30363d] overflow-hidden relative"
                  >
                    {/* Club gradient background overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        background: `linear-gradient(135deg, ${offer.fromClub.primaryColor} 0%, transparent 60%)`,
                      }}
                    />

                    <CardContent className="p-4 relative z-10">
                      {/* Club Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-xl border border-[#30363d]">
                          {offer.fromClub.logo}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{offer.fromClub.name}</p>
                          <p className="text-[10px] text-[#8b949e]">
                            {offer.fromClub.league.replace(/_/g, ' ')} • {offer.squadRole.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400 text-sm">
                            <AnimatedNumber value={offer.fee} formatFn={(v) => formatCurrency(v, 'M')} />
                          </p>
                          <p className="text-[9px] text-[#8b949e]">Transfer Fee</p>
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-[#21262d] rounded-lg p-2">
                          <span className="text-[#8b949e] text-[10px]">Wage</span>
                          <p className="font-semibold text-white text-xs">
                            <AnimatedNumber value={offer.contractOffer.weeklyWage} formatFn={(v) => formatCurrency(v, 'K')} />
                          </p>
                        </div>
                        <div className="bg-[#21262d] rounded-lg p-2">
                          <span className="text-[#8b949e] text-[10px]">Contract</span>
                          <p className="font-semibold text-white text-xs">{offer.contractOffer.yearsRemaining} years</p>
                        </div>
                        {offer.contractOffer.signingBonus ? (
                          <div className="bg-[#21262d] rounded-lg p-2">
                            <span className="text-[#8b949e] text-[10px]">Signing Bonus</span>
                            <p className="font-semibold text-white text-xs">
                              <AnimatedNumber value={offer.contractOffer.signingBonus} formatFn={(v) => formatCurrency(v, 'K')} />
                            </p>
                          </div>
                        ) : null}
                        {offer.contractOffer.releaseClause ? (
                          <div className="bg-[#21262d] rounded-lg p-2">
                            <span className="text-[#8b949e] text-[10px]">Release Clause</span>
                            <p className="font-semibold text-amber-400 text-xs">
                              <AnimatedNumber value={offer.contractOffer.releaseClause} formatFn={(v) => formatCurrency(v, 'M')} />
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Club Comparison */}
                      <ClubComparisonCard
                        currentClub={currentClub}
                        offerClub={offer.fromClub}
                        currentRole={player.squadStatus}
                        offeredRole={offer.squadRole}
                      />

                      {/* Accept/Reject Buttons */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#30363d]">
                        <ConfirmButton
                          variant="accept"
                          onConfirm={() => acceptTransfer(offer.id)}
                          confirmLabel="Confirm"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Accept
                        </ConfirmButton>
                        <ConfirmButton
                          variant="reject"
                          onConfirm={() => rejectTransfer(offer.id)}
                          confirmLabel="Confirm"
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </ConfirmButton>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Loan Offers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold text-[#8b949e] mb-2 flex items-center gap-2">
          <Plane className="h-4 w-4" />
          Loan Offers ({loanOffers.length})
        </h3>
        {loanOffers.length === 0 ? (
          <Card className="bg-[#161b22]/50 border-[#30363d]">
            <CardContent className="p-4 text-center text-sm text-[#484f58]">
              No loan offers available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {loanOffers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden relative">
                    {/* Club gradient background overlay */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        background: `linear-gradient(135deg, ${offer.fromClub.primaryColor} 0%, transparent 60%)`,
                      }}
                    />

                    <CardContent className="p-4 relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center text-xl border border-[#30363d]">
                          {offer.fromClub.logo}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{offer.fromClub.name}</p>
                          <p className="text-[10px] text-[#8b949e]">
                            {offer.fromClub.league.replace(/_/g, ' ')}
                          </p>
                        </div>
                        {offer.guaranteedMinutes && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                          >
                            <Badge className="bg-emerald-600/80 text-white text-[9px] flex items-center gap-1 shadow shadow-emerald-500/20">
                              <Timer className="h-2.5 w-2.5" />
                              Guaranteed Minutes
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      {/* Loan details */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-[#21262d] rounded-lg p-2">
                          <span className="text-[#8b949e] text-[10px]">Duration</span>
                          <p className="font-semibold text-white text-xs">{offer.durationWeeks} weeks</p>
                        </div>
                        <div className="bg-[#21262d] rounded-lg p-2">
                          <span className="text-[#8b949e] text-[10px]">Wage Paid</span>
                          <p className="font-semibold text-white text-xs">{offer.wageContribution}%</p>
                        </div>
                      </div>

                      {/* Playing time indicator for loans */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8b949e]">Playing Time Estimate</span>
                          <span className={`font-medium ${offer.guaranteedMinutes ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {offer.guaranteedMinutes ? 'High (Guaranteed)' : 'Moderate'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${offer.guaranteedMinutes ? 75 : 40}%` }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                            className={`h-full rounded-full ${offer.guaranteedMinutes ? 'bg-emerald-500/60' : 'bg-amber-500/50'}`}
                          />
                        </div>
                      </div>

                      {/* Accept/Reject Buttons */}
                      <div className="flex gap-2">
                        <ConfirmButton
                          variant="accept"
                          onConfirm={() => acceptLoan(offer.id)}
                          confirmLabel="Confirm"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Accept Loan
                        </ConfirmButton>
                        <ConfirmButton
                          variant="reject"
                          onConfirm={() => rejectLoan(offer.id)}
                          confirmLabel="Confirm"
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </ConfirmButton>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Contract Negotiation Dialog */}
      <ContractNegotiation
        open={showContractNegotiation}
        onClose={() => setShowContractNegotiation(false)}
      />
    </div>
  );
}
