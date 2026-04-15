'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute, PlayerAttributes } from '@/lib/game/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Target,
  Handshake,
  Star,
  Trophy,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Flame,
  Award,
  Zap,
  Clock,
  Crosshair,
  CircleDot,
  Shield,
  Medal,
  Crown,
  Hash,
  Footprints,
  Wind,
  Swords,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────
const ANIM = { duration: 0.18, ease: 'easeOut' as const };

const ATTR_KEYS: CoreAttribute[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical',
];

const ATTR_LABELS: Record<CoreAttribute, string> = {
  pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
  dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical',
};

const ATTR_ICONS: Record<CoreAttribute, React.ReactNode> = {
  pace: <Wind className="h-3 w-3" />,
  shooting: <Target className="h-3 w-3" />,
  passing: <Swords className="h-3 w-3" />,
  dribbling: <Zap className="h-3 w-3" />,
  defending: <Shield className="h-3 w-3" />,
  physical: <Footprints className="h-3 w-3" />,
};

const GOAL_BUCKETS = [
  { label: "0-15'", range: [0, 15] },
  { label: "16-30'", range: [16, 30] },
  { label: "31-45'", range: [31, 45] },
  { label: "46-60'", range: [46, 60] },
  { label: "61-75'", range: [61, 75] },
  { label: "76-90'", range: [76, 90] },
];

// Position-aware weight for goal timing (ST favors early & late)
function getGoalBucketWeights(position: string): number[] {
  if (position === 'ST') return [8, 22, 15, 10, 15, 30];
  if (position === 'LW' || position === 'RW') return [12, 18, 18, 14, 20, 18];
  if (position === 'CAM') return [10, 15, 20, 18, 22, 15];
  if (position === 'CM') return [12, 16, 20, 20, 18, 14];
  return [10, 16, 18, 18, 18, 20];
}

// ── Helpers ────────────────────────────────────────────────
function getRatingColor(rating: number): string {
  if (rating >= 7.5) return '#22c55e';
  if (rating >= 6.0) return '#f59e0b';
  return '#ef4444';
}

function getQualityBadge(avg: number): { label: string; cls: string } {
  if (avg >= 8.0) return { label: 'Elite', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (avg >= 7.0) return { label: 'Good', cls: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/25' };
  if (avg >= 6.0) return { label: 'Average', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
  return { label: 'Poor', cls: 'bg-red-500/10 text-red-400 border-red-500/25' };
}

function formatValue(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(decimals)}`;
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function SvgSparkline({ values, color = '#10b981', height = 40, width = 260 }: {
  values: number[]; color?: string; height?: number; width?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 8) - 4}`).join(' ');
  return (
    <svg width={width} height={height} className="block">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
      {values.map((v, i) => {
        const cx = i * step;
        const cy = height - ((v - min) / range) * (height - 8) - 4;
        return <circle key={i} cx={cx} cy={cy} r={3} fill={color} />;
      })}
    </svg>
  );
}

function HBar({ value, max, color = '#10b981', label }: {
  value: number; max: number; color?: string; label?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-[10px] text-[#8b949e] w-16 shrink-0 text-right">{label}</span>}
      <div className="flex-1 h-3 bg-[#21262d] rounded-sm overflow-hidden">
        <motion.div
          className="h-full rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${pct}%` }}
          transition={{ ...ANIM, width: { ...ANIM, duration: 0.25 } }}
        />
      </div>
      <span className="text-[10px] text-[#c9d1d9] tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label, color = 'text-emerald-400', delay = 0 }: {
  icon: React.ReactNode; value: string | number; label: string; color?: string; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay }}
    >
      <span className={color}>{icon}</span>
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-[#8b949e]">{label}</span>
    </motion.div>
  );
}

function SectionCard({ title, icon, children, delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-xs text-[#c9d1d9] font-semibold">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ── SVG Helpers ──────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// ── SVG Visualization Components ──────────────────────────

// 1. GoalsAssistsRatioDonut — 2-segment donut
function GoalsAssistsRatioDonut({ goals, assists }: { goals: number; assists: number }) {
  const cx = 60, cy = 60, r = 40;
  const total = goals + assists || 1;
  const goalAngle = (goals / total) * 360;
  const assistAngle = (assists / total) * 360;
  return (
    <svg width={120} height={120} className="block mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={12} />
      {goalAngle > 0 && (
        <path d={describeArc(cx, cy, r, 0, Math.min(goalAngle, 359.9))} fill="none" stroke="#FF5500" strokeWidth={12} strokeLinecap="round" />
      )}
      {assistAngle > 0 && (
        <path d={describeArc(cx, cy, r, goalAngle, Math.min(goalAngle + assistAngle, 359.9))} fill="none" stroke="#00E5FF" strokeWidth={12} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={16} fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize={8}>G+A</text>
    </svg>
  );
}

// 2. CareerProgressionAreaChart — area chart from season goals
function CareerProgressionAreaChart({ seasonData }: { seasonData: { season: number; goals: number }[] }) {
  const w = 260, h = 80, pad = 4;
  const sliced = seasonData.slice(-8);
  if (sliced.length < 2) return null;
  const max = Math.max(...sliced.map((s) => s.goals), 1);
  const step = w / (sliced.length - 1);
  const pts = sliced.map((s, i) => `${i * step},${h - pad - (s.goals / max) * (h - pad * 2)}`);
  const areaPath = `M 0,${h} ${pts.join(' L ')} L ${w},${h} Z`;
  const linePath = `M ${pts.join(' L ')}`;
  return (
    <svg width={w} height={h} className="block">
      <path d={areaPath} fill="#CCFF00" fillOpacity={0.15} />
      <path d={linePath} fill="none" stroke="#CCFF00" strokeWidth={2} strokeLinejoin="round" />
      {sliced.map((s, i) => {
        const cx = i * step;
        const cy = h - pad - (s.goals / max) * (h - pad * 2);
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#CCFF00" />;
      })}
    </svg>
  );
}

// 3. AttributeDevelopmentRadar — 6-axis radar
function AttributeDevelopmentRadar({ attrs }: { attrs: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number } }) {
  const cx = 70, cy = 70, maxR = 50;
  const labels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  const values = [attrs.pace, attrs.shooting, attrs.passing, attrs.dribbling, attrs.defending, attrs.physical];
  const n = labels.length;
  const radarPoints = values.map((v, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    const rv = (v / 100) * maxR;
    return `${cx + rv * Math.cos(rad)},${cy + rv * Math.sin(rad)}`;
  });
  const radarStr = radarPoints.join(' ');
  const gridScales = [0.33, 0.66, 1.0];
  const gridStrings = gridScales.map((scale) => {
    return labels.map((_, i) => {
      const angle = (360 / n) * i - 90;
      const rad = (angle * Math.PI) / 180;
      const gr = scale * maxR;
      return `${cx + gr * Math.cos(rad)},${cy + gr * Math.sin(rad)}`;
    }).join(' ');
  });
  const axisEnds = labels.map((_, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    return { x: cx + maxR * Math.cos(rad), y: cy + maxR * Math.sin(rad) };
  });
  const labelPos = labels.map((_, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    return { x: cx + (maxR + 12) * Math.cos(rad), y: cy + (maxR + 12) * Math.sin(rad) };
  });
  return (
    <svg width={140} height={140} className="block mx-auto">
      {gridStrings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth={0.5} />
      ))}
      {axisEnds.map((ep, i) => (
        <line key={i} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#30363d" strokeWidth={0.5} />
      ))}
      <polygon points={radarStr} fill="#FF5500" fillOpacity={0.2} stroke="#FF5500" strokeWidth={1.5} />
      {values.map((v, i) => {
        const angle = (360 / n) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const rv = (v / 100) * maxR;
        return <circle key={i} cx={cx + rv * Math.cos(rad)} cy={cy + rv * Math.sin(rad)} r={2.5} fill="#FF5500" />;
      })}
      {labelPos.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={7}>{labels[i]}</text>
      ))}
    </svg>
  );
}

// 4. RatingConsistencyRing — circular ring for consistency
function RatingConsistencyRing({ score }: { score: number }) {
  const cx = 60, cy = 60, r = 42;
  const angle = (Math.min(100, Math.max(0, score)) / 100) * 360;
  return (
    <svg width={120} height={120} className="block mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={8} />
      {angle > 0 && (
        <path d={describeArc(cx, cy, r, 0, Math.min(angle, 359.9))} fill="none" stroke="#00E5FF" strokeWidth={8} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#00E5FF" fontSize={20} fontWeight="bold">{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={8}>Consistency</text>
    </svg>
  );
}

// 5. GoalsByCompetitionDonut — 3-segment donut
function GoalsByCompetitionDonut({ leagueGoals, cupGoals, continentalGoals }: { leagueGoals: number; cupGoals: number; continentalGoals: number }) {
  const cx = 60, cy = 60, r = 38;
  const segments = [
    { value: leagueGoals, color: '#CCFF00' },
    { value: cupGoals, color: '#FF5500' },
    { value: continentalGoals, color: '#00E5FF' },
  ];
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
  let accumulated = 0;
  const arcPaths = segments.reduce<Array<{ d: string; color: string }>>((acc, seg) => {
    const angle = (seg.value / total) * 360;
    if (angle > 0) {
      acc.push({ d: describeArc(cx, cy, r, accumulated, accumulated + Math.min(angle, 359.9)), color: seg.color });
    }
    accumulated += angle;
    return acc;
  }, []);
  return (
    <svg width={120} height={120} className="block mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={10} />
      {arcPaths.map((arc, i) => (
        <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={10} />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={14} fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize={7}>Goals</text>
    </svg>
  );
}

// 6. SeasonGoalsComparisonBars — horizontal bars comparing goals per season
function SeasonGoalsComparisonBars({ seasonData }: { seasonData: { season: number; goals: number }[] }) {
  const w = 240, h = 160;
  const sliced = seasonData.slice(-8);
  if (sliced.length === 0) return null;
  const max = Math.max(...sliced.map((s) => s.goals), 1);
  const barH = Math.max(8, Math.min(16, (h - 10) / sliced.length - 4));
  return (
    <svg width={w} height={h} className="block">
      {sliced.map((s, i) => {
        const y = 4 + i * (barH + 4);
        const barW = (s.goals / max) * (w - 50);
        const isTop = s.goals === max;
        return (
          <g key={i}>
            <text x={2} y={y + barH / 2} dominantBaseline="central" fill="#8b949e" fontSize={8}>S{s.season}</text>
            <rect x={32} y={y} width={barW} height={barH} fill={isTop ? '#FF5500' : '#666'} rx={2} />
            <text x={36 + barW} y={y + barH / 2} dominantBaseline="central" fill="#c9d1d9" fontSize={8}>{s.goals}</text>
          </g>
        );
      })}
    </svg>
  );
}

// 7. MilestoneProgressRing — circular ring for milestone completion
function MilestoneProgressRing({ milestones }: { milestones: { current: number; target: number }[] }) {
  const cx = 60, cy = 60, r = 42;
  const completed = milestones.reduce((sum, m) => sum + (m.current >= m.target ? 1 : 0), 0);
  const total = milestones.length || 1;
  const angle = (completed / total) * 360;
  return (
    <svg width={120} height={120} className="block mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={8} />
      {angle > 0 && (
        <path d={describeArc(cx, cy, r, 0, Math.min(angle, 359.9))} fill="none" stroke="#CCFF00" strokeWidth={8} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#CCFF00" fontSize={18} fontWeight="bold">{completed}/{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={7}>Milestones</text>
    </svg>
  );
}

// 8. HatTrickTimeline — 8-node horizontal timeline of W/D/L results
function HatTrickTimeline({ results, currentClubName }: { results: { homeClub: { name: string }; awayClub: { name: string }; homeScore: number; awayScore: number }[]; currentClubName: string }) {
  const sliced = results.slice(-8);
  if (sliced.length === 0) return null;
  const w = 260, h = 50;
  const step = sliced.length > 1 ? w / (sliced.length - 1) : w;
  const midY = h / 2;
  const nodes = sliced.map((r, i) => {
    const isHome = r.homeClub.name === currentClubName;
    const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    const drawn = r.homeScore === r.awayScore;
    const result = drawn ? 'D' as const : won ? 'W' as const : 'L' as const;
    return { x: i * step, result };
  });
  return (
    <svg width={w} height={h} className="block">
      <line x1={0} y1={midY} x2={w} y2={midY} stroke="#30363d" strokeWidth={2} />
      {nodes.map((nd, i) => {
        const color = nd.result === 'W' ? '#00E5FF' : nd.result === 'D' ? '#CCFF00' : '#FF5500';
        return (
          <g key={i}>
            <circle cx={nd.x} cy={midY} r={8} fill="#161b22" stroke={color} strokeWidth={2} />
            <text x={nd.x} y={midY + 1} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={7} fontWeight="bold">{nd.result}</text>
          </g>
        );
      })}
    </svg>
  );
}

// 9. CareerValueTrendLine — 8-point line chart from mvData
function CareerValueTrendLine({ values }: { values: number[] }) {
  const w = 260, h = 60, pad = 4;
  const sliced = values.slice(-8);
  if (sliced.length < 2) return null;
  const max = Math.max(...sliced);
  const min = Math.min(...sliced);
  const range = max - min || 1;
  const step = w / (sliced.length - 1);
  const pts = sliced.map((v, i) => `${i * step},${h - pad - ((v - min) / range) * (h - pad * 2)}`);
  const linePath = `M ${pts.join(' L ')}`;
  return (
    <svg width={w} height={h} className="block">
      <path d={linePath} fill="none" stroke="#FF5500" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {sliced.map((v, i) => {
        const cx = i * step;
        const cy = h - pad - ((v - min) / range) * (h - pad * 2);
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#FF5500" />;
      })}
    </svg>
  );
}

// 10. PositionStatsRadar — 5-axis radar from career stats
function PositionStatsRadar({ goals, assists, rating, apps, motm }: { goals: number; assists: number; rating: number; apps: number; motm: number }) {
  const cx = 70, cy = 70, maxR = 50;
  const labels = ['Goals', 'Assists', 'Rating', 'Apps', 'MOTM'];
  const maxVals = [50, 30, 10, 80, 15];
  const raw = [goals, assists, rating, apps, motm];
  const values = raw.map((v, i) => Math.min(1, v / maxVals[i]));
  const n = labels.length;
  const radarPoints = values.map((v, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    const rv = v * maxR;
    return `${cx + rv * Math.cos(rad)},${cy + rv * Math.sin(rad)}`;
  });
  const radarStr = radarPoints.join(' ');
  const gridScales = [0.33, 0.66, 1.0];
  const gridStrings = gridScales.map((scale) => {
    return labels.map((_, i) => {
      const angle = (360 / n) * i - 90;
      const rad = (angle * Math.PI) / 180;
      const gr = scale * maxR;
      return `${cx + gr * Math.cos(rad)},${cy + gr * Math.sin(rad)}`;
    }).join(' ');
  });
  const axisEnds = labels.map((_, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    return { x: cx + maxR * Math.cos(rad), y: cy + maxR * Math.sin(rad) };
  });
  const labelPos = labels.map((_, i) => {
    const angle = (360 / n) * i - 90;
    const rad = (angle * Math.PI) / 180;
    return { x: cx + (maxR + 14) * Math.cos(rad), y: cy + (maxR + 14) * Math.sin(rad) };
  });
  return (
    <svg width={140} height={140} className="block mx-auto">
      {gridStrings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth={0.5} />
      ))}
      {axisEnds.map((ep, i) => (
        <line key={i} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#30363d" strokeWidth={0.5} />
      ))}
      <polygon points={radarStr} fill="#CCFF00" fillOpacity={0.2} stroke="#CCFF00" strokeWidth={1.5} />
      {values.map((v, i) => {
        const angle = (360 / n) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const rv = v * maxR;
        return <circle key={i} cx={cx + rv * Math.cos(rad)} cy={cy + rv * Math.sin(rad)} r={2.5} fill="#CCFF00" />;
      })}
      {labelPos.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={6}>{labels[i]}</text>
      ))}
    </svg>
  );
}

// 11. ScoringFormAreaChart — 8-point area chart from recent goal form
function ScoringFormAreaChart({ recentGoals }: { recentGoals: number[] }) {
  const w = 260, h = 70, pad = 4;
  const data = recentGoals.slice(-8);
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - pad - (v / max) * (h - pad * 2)}`);
  const areaPath = `M 0,${h} ${pts.join(' L ')} L ${w},${h} Z`;
  const linePath = `M ${pts.join(' L ')}`;
  return (
    <svg width={w} height={h} className="block">
      <path d={areaPath} fill="#00E5FF" fillOpacity={0.15} />
      <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth={2} strokeLinejoin="round" />
      {data.map((v, i) => {
        const cx = i * step;
        const cy = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#00E5FF" />;
      })}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function CareerStatistics() {
  const gameState = useGameStore((s) => s.gameState);

  // ── Derived data (before early return) ──────────────────
  const data = useMemo(() => {
    if (!gameState) return null;
    const { player, seasons, recentResults, currentSeason } = gameState;
    const career = player.careerStats;
    const season = player.seasonStats;
    const apps = career.totalAppearances || season.appearances || 1;
    const goals = career.totalGoals || season.goals;
    const assists = career.totalAssists || season.assists;
    const trophies = career.trophies ?? [];

    // Per-game ratios
    const goalsPerGame = goals / apps;
    const assistsPerGame = assists / apps;

    // Starting attributes (simulate from seasons data or use a reduced estimate)
    const startingAttrs: PlayerAttributes = seasons.length > 0
      ? { pace: 55, shooting: 50, passing: 48, dribbling: 52, defending: 35, physical: 45 }
      : { pace: player.attributes.pace - 8, shooting: player.attributes.shooting - 8, passing: player.attributes.passing - 8, dribbling: player.attributes.dribbling - 8, defending: player.attributes.defending - 8, physical: player.attributes.physical - 8 };

    // Goal timing heatmap (generated from position-aware weights)
    const weights = getGoalBucketWeights(player.position);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const goalBuckets = weights.map((w) => Math.round((w / totalWeight) * goals));

    // Recent goal matches
    const recentGoalMatches = recentResults.filter((r) => r.playerGoals > 0).slice(0, 5);
    const recentAssistMatches = recentResults.filter((r) => r.playerAssists > 0).slice(0, 5);

    // Scoring streak (consecutive matches with goals from most recent)
    let scoringStreak = 0;
    for (const r of recentResults) {
      if (r.playerGoals > 0) scoringStreak++;
      else break;
    }

    // Hat-trick count
    const hatTricks = recentResults.filter((r) => r.playerGoals >= 3).length +
      seasons.reduce((sum, s) => sum + (s.playerStats.goals >= 3 ? 1 : 0), 0);

    // Goals by competition
    const leagueGoals = recentResults.filter((r) => r.competition === 'league').reduce((s, r) => s + r.playerGoals, 0) +
      seasons.reduce((s, se) => s + se.playerStats.goals, 0);
    const cupGoals = recentResults.filter((r) => r.competition === 'cup').reduce((s, r) => s + r.playerGoals, 0);
    const continentalGoals = recentResults.filter((r) => r.competition === 'continental').reduce((s, r) => s + r.playerGoals, 0);

    // Assist types (fixed distribution)
    const assistTypes = [
      { label: 'Through Ball', pct: 35, color: '#10b981' },
      { label: 'Cross', pct: 25, color: '#06b6d4' },
      { label: 'Short Pass', pct: 30, color: '#f59e0b' },
      { label: 'Set Piece', pct: 10, color: '#a855f7' },
    ];

    // Key passes per game (derived from assists)
    const keyPassesPerGame = assists > 0 ? assists / apps * 3.2 : 0;

    // Ratings
    const recentRatings = recentResults.slice(0, 10).map((r) => r.playerRating).filter((r) => r > 0);
    const allRatings = recentResults.map((r) => r.playerRating).filter((r) => r > 0);
    const careerAvg = allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : season.averageRating || 0;
    const quality = getQualityBadge(careerAvg);

    // Rating distribution (1-10 brackets)
    const ratingDist = Array(10).fill(0);
    allRatings.forEach((r) => {
      const bucket = Math.min(9, Math.max(0, Math.floor(r) - 1));
      ratingDist[bucket]++;
    });
    const maxDistBucket = Math.max(...ratingDist, 1);

    // Man of the Match (rating >= 8.5)
    const motmCount = allRatings.filter((r) => r >= 8.5).length;

    // Consistency score
    const stdDev = standardDeviation(allRatings.length > 0 ? allRatings : [6.5]);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 25)));

    // Records
    const highestRating = allRatings.length > 0 ? Math.max(...allRatings) : 0;
    const mostGoalsMatch = recentResults.length > 0 ? Math.max(...recentResults.map((r) => r.playerGoals)) : 0;
    const mostAssistsMatch = recentResults.length > 0 ? Math.max(...recentResults.map((r) => r.playerAssists)) : 0;
    let unbeatenRun = 0, maxUnbeaten = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerRating >= 6.0) { unbeatenRun++; maxUnbeaten = Math.max(maxUnbeaten, unbeatenRun); }
      else unbeatenRun = 0;
    }
    let winStreak = 0, maxWinStreak = 0;
    for (const r of [...recentResults].reverse()) {
      const isHome = r.homeClub.name === gameState.currentClub.name;
      const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
      if (won) { winStreak++; maxWinStreak = Math.max(maxWinStreak, winStreak); }
      else winStreak = 0;
    }
    const cleanSheets = career.totalCleanSheets || season.cleanSheets;

    // Season records
    const bestLeaguePos = seasons.length > 0 ? Math.min(...seasons.map((s) => s.leaguePosition)) : 0;
    const mostGoalsSeason = seasons.length > 0 ? Math.max(...seasons.map((s) => s.playerStats.goals), season.goals) : season.goals;
    const bestRatingSeason = seasons.length > 0
      ? Math.max(...seasons.map((s) => s.playerStats.averageRating), season.averageRating)
      : season.averageRating;

    // Milestones
    const milestones = [
      { label: '50 Appearances', current: Math.min(apps, 50), target: 50, icon: <Hash className="h-3 w-3" /> },
      { label: '100 Appearances', current: Math.min(apps, 100), target: 100, icon: <Hash className="h-3 w-3" /> },
      { label: '50 Goals', current: Math.min(goals, 50), target: 50, icon: <Target className="h-3 w-3" /> },
      { label: '100 Goals', current: Math.min(goals, 100), target: 100, icon: <Target className="h-3 w-3" /> },
      { label: 'First Hat-trick', current: Math.min(hatTricks, 1), target: 1, icon: <Flame className="h-3 w-3" /> },
      { label: '10 Clean Sheets', current: Math.min(cleanSheets, 10), target: 10, icon: <Shield className="h-3 w-3" /> },
    ];

    // Market value sparkline (generate 5 data points from seasons)
    const mvData = seasons.length >= 2
      ? seasons.slice(-5).map((_, i) => player.marketValue * (0.5 + i * 0.15))
      : [player.marketValue * 0.4, player.marketValue * 0.55, player.marketValue * 0.7, player.marketValue * 0.85, player.marketValue];

    // Season awards (derived from position)
    const seasonAwardsList = seasons.map((s) => {
      if (s.leaguePosition === 1) return { season: s.number, award: 'League Winner', icon: <Crown className="h-3 w-3 text-amber-400" /> };
      if (s.leaguePosition === 2) return { season: s.number, award: 'Runner Up', icon: <Medal className="h-3 w-3 text-slate-300" /> };
      return null;
    }).filter(Boolean) as { season: number; award: string; icon: React.ReactNode }[];

    return {
      player, seasons, recentResults, currentSeason,
      career, season,
      apps, goals, assists, trophies,
      goalsPerGame, assistsPerGame,
      startingAttrs,
      goalBuckets,
      recentGoalMatches, recentAssistMatches,
      scoringStreak, hatTricks,
      leagueGoals, cupGoals, continentalGoals,
      assistTypes, keyPassesPerGame,
      recentRatings, allRatings,
      careerAvg, quality,
      ratingDist, maxDistBucket,
      motmCount, consistencyScore,
      highestRating, mostGoalsMatch, mostAssistsMatch,
      maxUnbeaten, maxWinStreak, cleanSheets,
      bestLeaguePos, mostGoalsSeason, bestRatingSeason,
      milestones, mvData, seasonAwardsList,
    };
  }, [gameState]);

  if (!gameState || !data) return null;
  const {
    player, seasons, recentResults, currentSeason,
    apps, goals, assists, trophies,
    goalsPerGame, assistsPerGame,
    startingAttrs,
    goalBuckets,
    recentGoalMatches, recentAssistMatches,
    scoringStreak, hatTricks,
    leagueGoals, cupGoals, continentalGoals,
    assistTypes, keyPassesPerGame,
    recentRatings, careerAvg, quality,
    ratingDist, maxDistBucket,
    motmCount, consistencyScore,
    highestRating, mostGoalsMatch, mostAssistsMatch,
    maxUnbeaten, maxWinStreak, cleanSheets,
    bestLeaguePos, mostGoalsSeason, bestRatingSeason,
    milestones, mvData, seasonAwardsList,
  } = data;

  // ── Position in league table ────────────────────────────
  const currentPos = gameState.leagueTable.findIndex(
    (e) => e.clubId === gameState.currentClub.id
  ) + 1;

  // Season stats for charts (include current)
  const allSeasonStats = [
    ...seasons.map((s) => ({ season: s.number, goals: s.playerStats.goals, assists: s.playerStats.assists, apps: s.playerStats.appearances, rating: s.playerStats.averageRating, pos: s.leaguePosition })),
    { season: currentSeason, goals: player.seasonStats.goals, assists: player.seasonStats.assists, apps: player.seasonStats.appearances, rating: player.seasonStats.averageRating, pos: currentPos || 0 },
  ];
  const maxGoalsSeason = Math.max(...allSeasonStats.map((s) => s.goals), 1);
  const maxAssistsSeason = Math.max(...allSeasonStats.map((s) => s.assists), 1);

  // Recent goals for scoring form chart
  const recentGoals = recentResults.slice(-8).map(r => r.playerGoals);

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
        >
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Career Statistics</h1>
          <Badge variant="outline" className="ml-auto text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            Season {currentSeason}
          </Badge>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] h-10 p-1 overflow-x-auto">
            <TabsTrigger value="overview" className="flex-1 text-[10px] sm:text-xs">Overview</TabsTrigger>
            <TabsTrigger value="goals" className="flex-1 text-[10px] sm:text-xs">Goals</TabsTrigger>
            <TabsTrigger value="assists" className="flex-1 text-[10px] sm:text-xs">Assists</TabsTrigger>
            <TabsTrigger value="ratings" className="flex-1 text-[10px] sm:text-xs">Ratings</TabsTrigger>
            <TabsTrigger value="records" className="flex-1 text-[10px] sm:text-xs">Records</TabsTrigger>
            <TabsTrigger value="seasons" className="flex-1 text-[10px] sm:text-xs">Seasons</TabsTrigger>
          </TabsList>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 1: OVERVIEW ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="overview" className="space-y-3 mt-3">
            {/* Summary cards 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Calendar className="h-4 w-4" />} value={apps} label="Appearances" color="text-sky-400" delay={0.02} />
              <StatCard icon={<Target className="h-4 w-4" />} value={goals} label="Goals" color="text-emerald-400" delay={0.04} />
              <StatCard icon={<Handshake className="h-4 w-4" />} value={assists} label="Assists" color="text-cyan-400" delay={0.06} />
              <StatCard icon={<Trophy className="h-4 w-4" />} value={trophies.length} label="Trophies" color="text-amber-400" delay={0.08} />
            </div>

            <SectionCard title="Goals vs Assists" icon={<Target className="h-3.5 w-3.5" />} delay={0.09}>
              <div className="flex justify-center items-center gap-4">
                <GoalsAssistsRatioDonut goals={goals} assists={assists} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#FF5500' }} /><span className="text-[10px] text-[#c9d1d9]">{goals} Goals</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#00E5FF' }} /><span className="text-[10px] text-[#c9d1d9]">{assists} Assists</span></div>
                </div>
              </div>
            </SectionCard>

            {/* Per-game ratios */}
            <SectionCard title="Per-Game Ratios" icon={<Crosshair className="h-3.5 w-3.5" />} delay={0.1}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b949e]">Goals / Game</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">{goalsPerGame.toFixed(2)}</span>
                    <Badge variant="outline" className="text-[9px] text-[#8b949e] border-[#30363d]">
                      Elite: 0.65
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full rounded-sm bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${Math.min(100, (goalsPerGame / 0.65) * 100)}%` }}
                    transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b949e]">Assists / Game</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-cyan-400 tabular-nums">{assistsPerGame.toFixed(2)}</span>
                    <Badge variant="outline" className="text-[9px] text-[#8b949e] border-[#30363d]">
                      Elite: 0.40
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full rounded-sm bg-cyan-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${Math.min(100, (assistsPerGame / 0.40) * 100)}%` }}
                    transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Season-by-season progress table */}
            <SectionCard title="Season-by-Season" icon={<Calendar className="h-3.5 w-3.5" />} delay={0.12}>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-[#8b949e] border-b border-[#30363d]">
                      <th className="py-1.5 text-left pl-1">#</th>
                      <th className="py-1.5 text-left">Pos</th>
                      <th className="py-1.5 text-center">Apps</th>
                      <th className="py-1.5 text-center">G</th>
                      <th className="py-1.5 text-center">A</th>
                      <th className="py-1.5 text-center">Avg</th>
                      <th className="py-1.5 text-right pr-1">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSeasonStats.map((s, i) => {
                      const prevGoals = i > 0 ? allSeasonStats[i - 1].goals : 0;
                      const trend = s.goals > prevGoals ? 'up' : s.goals < prevGoals ? 'down' : 'same';
                      return (
                        <motion.tr
                          key={s.season}
                          className="border-b border-[#30363d]/50 last:border-0 text-[#c9d1d9]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ ...ANIM, delay: 0.14 + i * 0.03 }}
                        >
                          <td className="py-2 pl-1 font-semibold">{s.season}</td>
                          <td className="py-2">{s.pos > 0 ? ordinal(s.pos) : '-'}</td>
                          <td className="py-2 text-center tabular-nums">{s.apps}</td>
                          <td className="py-2 text-center tabular-nums text-emerald-400 font-semibold">{s.goals}</td>
                          <td className="py-2 text-center tabular-nums text-cyan-400">{s.assists}</td>
                          <td className="py-2 text-center tabular-nums">{s.rating > 0 ? s.rating.toFixed(1) : '-'}</td>
                          <td className="py-2 text-right pr-1">
                            {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400 inline" />}
                            {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-400 inline" />}
                            {trend === 'same' && <Minus className="h-3 w-3 text-[#484f58] inline" />}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Career Progression" icon={<TrendingUp className="h-3.5 w-3.5" />} delay={0.13}>
              <CareerProgressionAreaChart seasonData={allSeasonStats} />
              <p className="text-[9px] text-[#484f58] mt-1 text-center">Goals per season</p>
            </SectionCard>

            {/* Attribute evolution */}
            <SectionCard title="Attribute Evolution" icon={<TrendingUp className="h-3.5 w-3.5" />} delay={0.14}>
              <div className="space-y-2.5">
                {ATTR_KEYS.map((attr, i) => {
                  const current = player.attributes[attr];
                  const starting = startingAttrs[attr];
                  const diff = current - starting;
                  return (
                    <motion.div
                      key={attr}
                      className="flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.16 + i * 0.02 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#8b949e]">{ATTR_ICONS[attr]}</span>
                        <span className="text-xs text-[#c9d1d9] w-20">{ATTR_LABELS[attr]}</span>
                        <span className="text-[10px] text-[#484f58] tabular-nums">{starting}</span>
                        <span className="text-[10px] text-[#484f58]">→</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">{current}</span>
                      </div>
                      <span className={`text-[10px] font-bold tabular-nums ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-[#484f58]'}`}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Attribute Radar" icon={<Crosshair className="h-3.5 w-3.5" />} delay={0.145}>
              <AttributeDevelopmentRadar attrs={player.attributes} />
            </SectionCard>

            <SectionCard title="Position Stats" icon={<Star className="h-3.5 w-3.5" />} delay={0.155}>
              <PositionStatsRadar goals={goals} assists={assists} rating={careerAvg} apps={apps} motm={motmCount} />
            </SectionCard>

            {/* Market value sparkline */}
            <SectionCard title="Market Value" icon={<Trophy className="h-3.5 w-3.5" />} delay={0.16}>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{formatValue(player.marketValue)}</p>
                <div className="mt-2 flex justify-center">
                  <SvgSparkline values={mvData} color="#f59e0b" height={40} width={260} />
                </div>
                <p className="text-[9px] text-[#484f58] mt-1">Last {mvData.length} seasons</p>
              </div>
            </SectionCard>

            <SectionCard title="Value Trend" icon={<TrendingUp className="h-3.5 w-3.5" />} delay={0.17}>
              <CareerValueTrendLine values={mvData} />
              <p className="text-[9px] text-[#484f58] mt-1 text-center">Market value trend</p>
            </SectionCard>
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 2: GOALS ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="goals" className="space-y-3 mt-3">
            {/* Career total with target */}
            <SectionCard title="Career Goals" icon={<Target className="h-3.5 w-3.5" />} delay={0.02}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-400 tabular-nums">{goals}</span>
                  <p className="text-[10px] text-[#8b949e] mt-1">from {apps} appearances</p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs">
                  Next: {goals < 50 ? 50 : goals < 100 ? 100 : goals < 200 ? 200 : goals + 25}
                </Badge>
              </div>
            </SectionCard>

            <SectionCard title="Scoring Form" icon={<Flame className="h-3.5 w-3.5" />} delay={0.03}>
              <ScoringFormAreaChart recentGoals={recentGoals} />
              <p className="text-[9px] text-[#484f58] mt-1 text-center">Recent goal form (last 8 matches)</p>
            </SectionCard>

            {/* Goals per season bar chart */}
            <SectionCard title="Goals by Season" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.04}>
              <div className="space-y-2">
                {allSeasonStats.map((s, i) => (
                  <HBar key={s.season} value={s.goals} max={maxGoalsSeason} color="#10b981" label={`S${s.season}`} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Season Goals Comparison" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.05}>
              <SeasonGoalsComparisonBars seasonData={allSeasonStats} />
            </SectionCard>

            {/* Goal timing heatmap */}
            <SectionCard title="Goal Timing" icon={<Clock className="h-3.5 w-3.5" />} delay={0.06}>
              <div className="grid grid-cols-3 gap-2">
                {GOAL_BUCKETS.map((b, i) => (
                  <motion.div
                    key={b.label}
                    className="text-center p-2 rounded-md border border-[#30363d]"
                    style={{ backgroundColor: `rgba(16,185,129,${0.05 + (goalBuckets[i] / Math.max(...goalBuckets, 1)) * 0.35})` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...ANIM, delay: 0.08 + i * 0.02 }}
                  >
                    <p className="text-[10px] text-[#8b949e]">{b.label}</p>
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">{goalBuckets[i]}</p>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* Scoring streaks */}
            <SectionCard title="Scoring Streaks" icon={<Flame className="h-3.5 w-3.5" />} delay={0.08}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] text-center">
                  <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-orange-400 tabular-nums">{scoringStreak}</p>
                  <p className="text-[10px] text-[#8b949e]">Current Streak</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] text-center">
                  <Crown className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-amber-400 tabular-nums">{hatTricks}</p>
                  <p className="text-[10px] text-[#8b949e]">Hat-tricks</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Recent Results" icon={<Calendar className="h-3.5 w-3.5" />} delay={0.09}>
              <HatTrickTimeline results={recentResults} currentClubName={gameState.currentClub.name} />
              <div className="flex justify-center gap-4 mt-1">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#00E5FF' }} /><span className="text-[9px] text-[#8b949e]">Win</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#CCFF00' }} /><span className="text-[9px] text-[#8b949e]">Draw</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: '#FF5500' }} /><span className="text-[9px] text-[#8b949e]">Loss</span></div>
              </div>
            </SectionCard>

            {/* Goals by competition */}
            <SectionCard title="Goals by Competition" icon={<Trophy className="h-3.5 w-3.5" />} delay={0.1}>
              <div className="space-y-2">
                <HBar value={leagueGoals} max={Math.max(leagueGoals, cupGoals, continentalGoals, 1)} color="#10b981" label="League" />
                <HBar value={cupGoals} max={Math.max(leagueGoals, cupGoals, continentalGoals, 1)} color="#06b6d4" label="Cup" />
                <HBar value={continentalGoals} max={Math.max(leagueGoals, cupGoals, continentalGoals, 1)} color="#a855f7" label="Continental" />
              </div>
            </SectionCard>

            <SectionCard title="Competition Breakdown" icon={<Trophy className="h-3.5 w-3.5" />} delay={0.105}>
              <div className="flex justify-center items-center gap-4">
                <GoalsByCompetitionDonut leagueGoals={leagueGoals} cupGoals={cupGoals} continentalGoals={continentalGoals} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#CCFF00' }} /><span className="text-[10px] text-[#c9d1d9]">{leagueGoals} League</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#FF5500' }} /><span className="text-[10px] text-[#c9d1d9]">{cupGoals} Cup</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#00E5FF' }} /><span className="text-[10px] text-[#c9d1d9]">{continentalGoals} Continental</span></div>
                </div>
              </div>
            </SectionCard>

            {/* Recent goal matches */}
            {recentGoalMatches.length > 0 && (
              <SectionCard title="Recent Goal Matches" icon={<CircleDot className="h-3.5 w-3.5" />} delay={0.12}>
                <div className="space-y-2">
                  {recentGoalMatches.map((r, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between bg-[#21262d] rounded-md p-2.5 border border-[#30363d]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.14 + i * 0.03 }}
                    >
                      <div>
                        <p className="text-xs text-[#c9d1d9] font-medium">{r.homeClub.shortName} vs {r.awayClub.shortName}</p>
                        <p className="text-[9px] text-[#484f58]">{r.competition} · {r.playerMinutesPlayed}&apos;min</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400">{r.playerGoals}G</span>
                        <p className="text-[9px] text-[#8b949e] tabular-nums">{r.playerRating.toFixed(1)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 3: ASSISTS ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="assists" className="space-y-3 mt-3">
            {/* Career assists total */}
            <SectionCard title="Career Assists" icon={<Handshake className="h-3.5 w-3.5" />} delay={0.02}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-cyan-400 tabular-nums">{assists}</span>
                  <p className="text-[10px] text-[#8b949e] mt-1">{assistsPerGame.toFixed(2)} per game</p>
                </div>
                <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs">
                  {assistsPerGame >= 0.3 ? 'Creative' : assistsPerGame >= 0.15 ? 'Contributing' : 'Developing'}
                </Badge>
              </div>
            </SectionCard>

            {/* Assists per season bar chart */}
            <SectionCard title="Assists by Season" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.04}>
              <div className="space-y-2">
                {allSeasonStats.map((s) => (
                  <HBar key={s.season} value={s.assists} max={maxAssistsSeason} color="#06b6d4" label={`S${s.season}`} />
                ))}
              </div>
            </SectionCard>

            {/* Assist types distribution */}
            <SectionCard title="Assist Types" icon={<Swords className="h-3.5 w-3.5" />} delay={0.06}>
              <div className="space-y-3">
                {assistTypes.map((at) => (
                  <div key={at.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#c9d1d9]">{at.label}</span>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: at.color }}>{at.pct}%</span>
                    </div>
                    <div className="h-2.5 bg-[#21262d] rounded-sm overflow-hidden">
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: at.color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, width: `${at.pct}%` }}
                        transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Key passes per game */}
            <SectionCard title="Key Passes" icon={<Crosshair className="h-3.5 w-3.5" />} delay={0.08}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8b949e]">Key Passes / Game</span>
                  <span className="text-sm font-bold text-cyan-400 tabular-nums">{keyPassesPerGame.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full rounded-sm bg-cyan-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${Math.min(100, (keyPassesPerGame / 2.5) * 100)}%` }}
                    transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                  />
                </div>
                <p className="text-[9px] text-[#484f58]">Benchmark: 2.5 / game = Creative</p>
              </div>
            </SectionCard>

            {/* Recent assist matches */}
            {recentAssistMatches.length > 0 && (
              <SectionCard title="Recent Assist Matches" icon={<Handshake className="h-3.5 w-3.5" />} delay={0.1}>
                <div className="space-y-2">
                  {recentAssistMatches.map((r, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between bg-[#21262d] rounded-md p-2.5 border border-[#30363d]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.12 + i * 0.03 }}
                    >
                      <div>
                        <p className="text-xs text-[#c9d1d9] font-medium">{r.homeClub.shortName} vs {r.awayClub.shortName}</p>
                        <p className="text-[9px] text-[#484f58]">{r.competition}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-cyan-400">{r.playerAssists}A</span>
                        <p className="text-[9px] text-[#8b949e] tabular-nums">{r.playerRating.toFixed(1)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 4: RATINGS ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="ratings" className="space-y-3 mt-3">
            {/* Career average with quality badge */}
            <SectionCard title="Career Average Rating" icon={<Star className="h-3.5 w-3.5" />} delay={0.02}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black tabular-nums" style={{ color: getRatingColor(careerAvg) }}>
                  {careerAvg > 0 ? careerAvg.toFixed(1) : 'N/A'}
                </span>
                <Badge className={quality.cls}>{quality.label}</Badge>
              </div>
            </SectionCard>

            {/* Last 10 match ratings vertical bar chart */}
            {recentRatings.length > 0 && (
              <SectionCard title="Last 10 Match Ratings" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.04}>
                <div className="flex items-end gap-1.5 h-36">
                  {recentRatings.map((r, i) => {
                    const heightPct = Math.max(5, ((r - 3) / 8) * 100);
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ ...ANIM, delay: 0.06 + i * 0.02 }}
                      >
                        <span className="text-[8px] text-[#8b949e] tabular-nums">{r.toFixed(1)}</span>
                        <div className="w-full rounded-t-sm" style={{ height: `${heightPct}%`, backgroundColor: getRatingColor(r) }} />
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-[#484f58]">
                  <span>Latest</span>
                  <span>10th</span>
                </div>
              </SectionCard>
            )}

            {/* Rating distribution */}
            <SectionCard title="Rating Distribution" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.06}>
              <div className="space-y-1.5">
                {ratingDist.map((count, i) => {
                  const label = `${i + 1}.0`;
                  const color = i + 1 >= 8 ? '#22c55e' : i + 1 >= 6 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8b949e] w-6 text-right tabular-nums">{label}</span>
                      <div className="flex-1 h-2.5 bg-[#21262d] rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${(count / maxDistBucket) * 100}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[10px] text-[#c9d1d9] tabular-nums w-4">{count}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Man of the Match & Consistency */}
            <SectionCard title="Performance Metrics" icon={<Award className="h-3.5 w-3.5" />} delay={0.08}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] text-center">
                  <Award className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-emerald-400 tabular-nums">{motmCount}</p>
                  <p className="text-[10px] text-[#8b949e]">Man of Match</p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Rating ≥ 8.5</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] text-center">
                  <Shield className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-xl font-bold tabular-nums" style={{ color: consistencyScore >= 75 ? '#22c55e' : consistencyScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {consistencyScore}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">Consistency</p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">{consistencyScore >= 75 ? 'Very Consistent' : consistencyScore >= 50 ? 'Inconsistent' : 'Volatile'}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Consistency Ring" icon={<Award className="h-3.5 w-3.5" />} delay={0.09}>
              <div className="flex justify-center">
                <RatingConsistencyRing score={consistencyScore} />
              </div>
            </SectionCard>
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 5: RECORDS ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="records" className="space-y-3 mt-3">
            {/* Personal records */}
            <SectionCard title="Personal Records" icon={<Award className="h-3.5 w-3.5" />} delay={0.02}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Highest Rating', value: highestRating > 0 ? highestRating.toFixed(1) : '-', icon: <Star className="h-3 w-3 text-emerald-400" /> },
                  { label: 'Most Goals/Match', value: mostGoalsMatch.toString(), icon: <Target className="h-3 w-3 text-emerald-400" /> },
                  { label: 'Most Assists/Match', value: mostAssistsMatch.toString(), icon: <Handshake className="h-3 w-3 text-cyan-400" /> },
                  { label: 'Unbeaten Run', value: maxUnbeaten.toString(), icon: <Shield className="h-3 w-3 text-amber-400" /> },
                  { label: 'Winning Run', value: maxWinStreak.toString(), icon: <TrendingUp className="h-3 w-3 text-emerald-400" /> },
                  { label: 'Clean Sheets', value: cleanSheets.toString(), icon: <Shield className="h-3 w-3 text-sky-400" /> },
                ].map((rec, i) => (
                  <motion.div
                    key={rec.label}
                    className="bg-[#21262d] rounded-md p-2.5 border border-[#30363d] flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...ANIM, delay: 0.04 + i * 0.02 }}
                  >
                    {rec.icon}
                    <div>
                      <p className="text-xs font-bold text-[#c9d1d9] tabular-nums">{rec.value}</p>
                      <p className="text-[9px] text-[#8b949e]">{rec.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* Season records */}
            <SectionCard title="Season Records" icon={<Calendar className="h-3.5 w-3.5" />} delay={0.06}>
              <div className="space-y-2.5">
                {[
                  { label: 'Best League Position', value: bestLeaguePos > 0 ? ordinal(bestLeaguePos) : '-', color: 'text-emerald-400' },
                  { label: 'Most Goals in Season', value: mostGoalsSeason.toString(), color: 'text-amber-400' },
                  { label: 'Best Season Rating', value: bestRatingSeason > 0 ? bestRatingSeason.toFixed(1) : '-', color: 'text-cyan-400' },
                ].map((rec, i) => (
                  <motion.div
                    key={rec.label}
                    className="flex items-center justify-between bg-[#21262d] rounded-md p-2.5 border border-[#30363d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...ANIM, delay: 0.08 + i * 0.03 }}
                  >
                    <span className="text-xs text-[#8b949e]">{rec.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${rec.color}`}>{rec.value}</span>
                  </motion.div>
                ))}
              </div>
            </SectionCard>

            {/* Milestones progress */}
            <SectionCard title="Milestones" icon={<Medal className="h-3.5 w-3.5" />} delay={0.1}>
              <div className="space-y-3">
                {milestones.map((m, i) => {
                  const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                  const achieved = pct >= 100;
                  return (
                    <motion.div
                      key={m.label}
                      className="space-y-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.12 + i * 0.03 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8b949e]">{m.icon}</span>
                          <span className="text-xs text-[#c9d1d9]">{m.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#8b949e] tabular-nums">{m.current}/{m.target}</span>
                          {achieved && <Award className="h-3 w-3 text-emerald-400" />}
                        </div>
                      </div>
                      <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full rounded-sm"
                          style={{ backgroundColor: achieved ? '#22c55e' : '#10b981' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, width: `${pct}%` }}
                          transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Milestone Ring" icon={<Medal className="h-3.5 w-3.5" />} delay={0.115}>
              <div className="flex justify-center">
                <MilestoneProgressRing milestones={milestones} />
              </div>
            </SectionCard>
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━ TAB 6: SEASONS ━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="seasons" className="space-y-3 mt-3">
            {/* Trophy cabinet */}
            {(trophies.length > 0 || seasonAwardsList.length > 0) && (
              <SectionCard title="Trophy Cabinet" icon={<Crown className="h-3.5 w-3.5" />} delay={0.02}>
                <div className="space-y-2">
                  {trophies.map((t, i) => (
                    <motion.div
                      key={`${t.name}-${t.season}`}
                      className="flex items-center gap-3 bg-[#21262d] rounded-md p-2.5 border border-amber-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.04 + i * 0.03 }}
                    >
                      <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-300 truncate">{t.name}</p>
                        <p className="text-[9px] text-[#8b949e]">Season {t.season}</p>
                      </div>
                    </motion.div>
                  ))}
                  {seasonAwardsList.map((a, i) => (
                    <motion.div
                      key={`award-${a.season}`}
                      className="flex items-center gap-3 bg-[#21262d] rounded-md p-2.5 border border-[#30363d]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.06 + i * 0.03 }}
                    >
                      {a.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#c9d1d9] truncate">{a.award}</p>
                        <p className="text-[9px] text-[#8b949e]">Season {a.season}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Season comparison cards */}
            {allSeasonStats.map((s, i) => {
              const prev = i > 0 ? allSeasonStats[i - 1] : null;
              const goalDiff = prev ? s.goals - prev.goals : 0;
              const assistDiff = prev ? s.assists - prev.assists : 0;
              const ratingDiff = prev ? s.rating - prev.rating : 0;
              const award = seasonAwardsList.find((a) => a.season === s.season);

              return (
                <motion.div
                  key={s.season}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...ANIM, delay: 0.08 + i * 0.04 }}
                >
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-[#c9d1d9]">Season {s.season}</span>
                      {s.pos > 0 && (
                        <Badge variant="outline" className="text-[9px] text-[#8b949e] border-[#30363d]">
                          {ordinal(s.pos)}
                        </Badge>
                      )}
                    </div>
                    {award && (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px]">
                        {award.award}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-emerald-400 tabular-nums">{s.goals}</p>
                        <p className="text-[9px] text-[#8b949e]">Goals</p>
                        {prev && goalDiff !== 0 && (
                          <span className={`text-[9px] font-bold ${goalDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {goalDiff > 0 ? <ArrowUpRight className="h-2.5 w-2.5 inline" /> : <ArrowDownRight className="h-2.5 w-2.5 inline" />}
                            {Math.abs(goalDiff)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-cyan-400 tabular-nums">{s.assists}</p>
                        <p className="text-[9px] text-[#8b949e]">Assists</p>
                        {prev && assistDiff !== 0 && (
                          <span className={`text-[9px] font-bold ${assistDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {assistDiff > 0 ? <ArrowUpRight className="h-2.5 w-2.5 inline" /> : <ArrowDownRight className="h-2.5 w-2.5 inline" />}
                            {Math.abs(assistDiff)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-sky-400 tabular-nums">{s.apps}</p>
                        <p className="text-[9px] text-[#8b949e]">Apps</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums" style={{ color: s.rating > 0 ? getRatingColor(s.rating) : '#484f58' }}>
                          {s.rating > 0 ? s.rating.toFixed(1) : '-'}
                        </p>
                        <p className="text-[9px] text-[#8b949e]">Avg</p>
                        {prev && ratingDiff !== 0 && (
                          <span className={`text-[9px] font-bold ${ratingDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {ratingDiff > 0 ? <ArrowUpRight className="h-2.5 w-2.5 inline" /> : <ArrowDownRight className="h-2.5 w-2.5 inline" />}
                            {Math.abs(ratingDiff).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty state if no seasons */}
            {allSeasonStats.length === 0 && (
              <motion.div
                className="text-center py-12 text-[#8b949e]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={ANIM}
              >
                <Calendar className="h-8 w-8 mx-auto mb-2 text-[#30363d]" />
                <p className="text-sm">No season data yet</p>
                <p className="text-xs text-[#484f58] mt-1">Complete your first season to see statistics</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
