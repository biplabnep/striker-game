'use client';

import { useMemo, useState } from 'react';
import { useGameStore, calculateRetirementProbability } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hourglass,
  Heart,
  Activity,
  AlertTriangle,
  TrendingDown,
  Shield,
  Trophy,
  Target,
  Calendar,
  Flame,
  Brain,
  Mic,
  Users,
  ChevronRight,
  X,
  Skull,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  evaluateRetirementReadiness,
  determineLegacyTier,
  generateRetirementPackage,
  determinePostRetirementPath,
  type RetirementReason,
  type PostRetirementPath,
} from '@/lib/game/legacyEngine';

// ── Animation Constants ─────────────────────────────────────
const D = 0.04;
const A = { duration: 0.18, ease: 'easeOut' as const };

// ── Helpers ─────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getRiskColor(prob: number): string {
  if (prob <= 15) return '#22c55e';
  if (prob <= 30) return '#f59e0b';
  return '#ef4444';
}

function getRiskLabel(prob: number): string {
  if (prob <= 15) return 'Low';
  if (prob <= 30) return 'Medium';
  return 'High';
}

function getRiskBg(prob: number): string {
  if (prob <= 15) return 'bg-emerald-500/10 border-emerald-500/20';
  if (prob <= 30) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

// ── SVG Semi-Circular Gauge ─────────────────────────────────
function RetirementGauge({ probability, age }: { probability: number; age: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size - 30;
  const radius = 80;
  const strokeWidth = 14;

  // Arc angles: -180deg (left) to 0deg (right) → π to 0
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = startAngle - endAngle; // π

  // Background arc path
  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle);
  // Filled arc path based on probability
  const filledEndAngle = startAngle - (probability / 100) * totalAngle;
  const fillPath = probability > 0
    ? describeArc(cx, cy, radius, startAngle, Math.max(endAngle, filledEndAngle))
    : '';

  // Needle angle
  const needleAngle = startAngle - (probability / 100) * totalAngle;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  // Age markers
  const ageMarkers = [
    { age: 32, prob: 0 },
    { age: 34, prob: 13 },
    { age: 36, prob: 29 },
    { age: 38, prob: 45 },
  ];

  const markerColor = getRiskColor(probability);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Filled arc */}
        {fillPath && (
          <motion.path
            d={fillPath}
            fill="none"
            stroke={markerColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...A, duration: 0.5 }}
          />
        )}
        {/* Age tick marks */}
        {ageMarkers.map((m) => {
          const tickAngle = startAngle - (m.prob / 100) * totalAngle;
          const innerR = radius + strokeWidth / 2 + 4;
          const outerR = radius + strokeWidth / 2 + 10;
          const x1 = cx + innerR * Math.cos(tickAngle);
          const y1 = cy + innerR * Math.sin(tickAngle);
          const x2 = cx + outerR * Math.cos(tickAngle);
          const y2 = cy + outerR * Math.sin(tickAngle);
          const labelR = radius + strokeWidth / 2 + 20;
          const lx = cx + labelR * Math.cos(tickAngle);
          const ly = cy + labelR * Math.sin(tickAngle);
          return (
            <g key={m.age}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#484f58" strokeWidth="1.5" />
              <text x={lx} y={ly + 3} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="600">
                {m.age}
              </text>
            </g>
          );
        })}
        {/* Needle circle base */}
        <circle cx={cx} cy={cy} r="6" fill="#161b22" stroke={markerColor} strokeWidth="2" />
        {/* Needle line */}
        <motion.line
          x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke={markerColor} strokeWidth="2.5" strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...A, duration: 0.5, delay: 0.1 }}
        />
        {/* Center text */}
        <text x={cx} y={cy - 25} textAnchor="middle" fill={markerColor} fontSize="28" fontWeight="900" className="tabular-nums">
          {probability}%
        </text>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">
          Retirement Risk
        </text>
      </svg>
      <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 border ${getRiskBg(probability)}`} style={{ borderRadius: 6 }}>
        <AlertTriangle className="h-3 w-3" style={{ color: markerColor }} />
        <span className="text-[10px] font-bold" style={{ color: markerColor }}>{getRiskLabel(probability)} Risk</span>
      </div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const sweep = endAngle > startAngle ? 0 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep} 1 ${x2} ${y2}`;
}

// ── Physical Condition Cards ────────────────────────────────
function ConditionCard({ icon, label, value, subtext, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; subtext: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[9px] text-[#484f58]">{subtext}</p>
    </motion.div>
  );
}

// ── Decline Chart (SVG) ────────────────────────────────────
function DeclineChart({
  currentAge,
  attributes,
}: {
  currentAge: number;
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
}) {
  const chartW = 320;
  const chartH = 160;
  const pad = { top: 12, right: 12, bottom: 24, left: 32 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const ages = Array.from({ length: Math.min(40 - currentAge + 1, 12) }, (_, i) => currentAge + i);

  // Decline rates based on progressionEngine
  const declineRates: Record<number, { physical: number; technical: number; mental: number }> = {
    30: { physical: 1.5, technical: 0.3, mental: 0 },
    31: { physical: 2.0, technical: 0.5, mental: 0 },
    32: { physical: 2.5, technical: 0.8, mental: 0.1 },
    33: { physical: 3.5, technical: 1.2, mental: 0.3 },
    34: { physical: 4.5, technical: 1.8, mental: 0.5 },
    35: { physical: 5.5, technical: 2.5, mental: 0.8 },
    36: { physical: 7.0, technical: 3.5, mental: 1.2 },
    37: { physical: 8.5, technical: 4.5, mental: 1.8 },
    38: { physical: 10, technical: 6, mental: 3 },
    39: { physical: 10, technical: 6, mental: 3 },
    40: { physical: 10, technical: 6, mental: 3 },
  };

  const physicalAttrs = ['pace', 'physical'] as const;
  const technicalAttrs = ['shooting', 'passing', 'dribbling'] as const;
  const mentalAttrs = ['defending'] as const;

  const avgPhysical = physicalAttrs.reduce((s, a) => s + attributes[a], 0) / physicalAttrs.length;
  const avgTechnical = technicalAttrs.reduce((s, a) => s + attributes[a], 0) / technicalAttrs.length;
  const avgMental = attributes.defending;

  function project(startAge: number, startVal: number, attrType: 'physical' | 'technical' | 'mental'): number[] {
    const vals = [startVal];
    let current = startVal;
    for (let age = startAge + 1; age <= 40; age++) {
      const rates = declineRates[age] || { physical: 10, technical: 6, mental: 3 };
      let decline = rates[attrType];
      if (attrType === 'physical') decline *= 0.9; // average of pace and physical
      if (attrType === 'technical') decline *= 0.6; // average of shooting, passing, dribbling
      if (attrType === 'mental') decline *= 0.8;
      current = Math.max(20, current - decline);
      vals.push(Math.round(current * 10) / 10);
    }
    return vals;
  }

  const physLine = project(currentAge, avgPhysical, 'physical');
  const techLine = project(currentAge, avgTechnical, 'technical');
  const mentalLine = project(currentAge, avgMental, 'mental');

  const maxAge = ages[ages.length - 1];
  const minVal = 20;
  const maxVal = 100;

  const toX = (i: number) => pad.left + (i / (ages.length - 1)) * plotW;
  const toY = (v: number) => pad.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const toPolyline = (data: number[]) =>
    data.slice(0, ages.length).map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Current age marker position
  const currentX = toX(0);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <h3 className="text-xs font-semibold text-[#c9d1d9] mb-3">Projected Attribute Decline</h3>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: chartH * 2 }}>
        {/* Grid lines */}
        {[30, 50, 70, 90].map((val) => {
          const y = toY(val);
          return (
            <g key={val}>
              <line x1={pad.left} y1={y} x2={chartW - pad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
              <text x={pad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{val}</text>
            </g>
          );
        })}
        {/* X-axis labels (every 2 years) */}
        {ages.filter((_, i) => i % 2 === 0).map((age, i) => {
          const idx = ages.indexOf(age);
          return (
            <text key={age} x={toX(idx)} y={chartH - 6} textAnchor="middle" fill="#484f58" fontSize="7">
              {age}
            </text>
          );
        })}
        <text x={pad.left + plotW / 2} y={chartH - 0.5} textAnchor="middle" fill="#30363d" fontSize="6">Age</text>

        {/* Physical line (red) */}
        <polyline points={toPolyline(physLine)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
        {/* Technical line (amber) */}
        <polyline points={toPolyline(techLine)} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
        {/* Mental line (emerald) */}
        <polyline points={toPolyline(mentalLine)} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />

        {/* Current age vertical marker */}
        <line x1={currentX} y1={pad.top} x2={currentX} y2={pad.top + plotH} stroke="#22c55e" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
        <text x={currentX} y={pad.top - 2} textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="600">NOW</text>

        {/* Starting dots */}
        <circle cx={toX(0)} cy={toY(avgPhysical)} r="3" fill="#ef4444" />
        <circle cx={toX(0)} cy={toY(avgTechnical)} r="3" fill="#f59e0b" />
        <circle cx={toX(0)} cy={toY(avgMental)} r="3" fill="#22c55e" />
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-500 inline-block" />
          <span className="text-[9px] text-[#8b949e]">Physical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500 inline-block" />
          <span className="text-[9px] text-[#8b949e]">Technical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-[9px] text-[#8b949e]">Mental</span>
        </div>
      </div>
    </div>
  );
}

// ── Post-Retirement Option Card ─────────────────────────────
function PostRetirementCard({ icon, title, description, delay = 0 }: {
  icon: React.ReactNode; title: string; description: string; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-start gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...A, delay }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#21262d] shrink-0">
        <span className="text-emerald-400">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#c9d1d9]">{title}</p>
        <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{description}</p>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[8px] px-2 py-0.5 bg-[#21262d] border border-[#30363d] text-[#484f58]" style={{ borderRadius: 4 }}>
            Coming Soon
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Retirement Decision Modal ───────────────────────────────
function RetirementModal({
  player,
  onAccept,
  onPushThrough,
}: {
  player: { name: string; age: number; careerStats: { totalAppearances: number; totalGoals: number; totalAssists: number; trophies: { name: string }[]; seasonsPlayed: number } };
  onAccept: () => void;
  onPushThrough: () => void;
}) {
  const cs = player.careerStats;
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...A, delay: 0.05 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
            <Skull className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#c9d1d9]">Time to Hang Up Your Boots?</h2>
            <p className="text-[10px] text-[#8b949e]">The end of an era approaches</p>
          </div>
          <button
            onClick={onAccept}
            className="ml-auto text-[#484f58] hover:text-[#8b949e] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Narrative */}
        <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
          <p className="text-[11px] text-[#8b949e] italic leading-relaxed">
            &quot;Your body can&apos;t keep up anymore. The legs are heavy, the recovery takes longer,
            and the young players are faster. But the heart still wants to play...&quot;
          </p>
        </div>

        {/* Career summary */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Goals', value: cs.totalGoals, color: 'text-emerald-400' },
            { label: 'Assists', value: cs.totalAssists, color: 'text-cyan-400' },
            { label: 'Appearances', value: cs.totalAppearances, color: 'text-sky-400' },
            { label: 'Trophies', value: cs.trophies.length, color: 'text-amber-400' },
            { label: 'Seasons', value: cs.seasonsPlayed, color: 'text-violet-400' },
            { label: 'Age', value: player.age, color: 'text-[#c9d1d9]' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2 bg-[#21262d] rounded-lg">
              <span className="text-[9px] text-[#484f58]">{item.label}</span>
              <span className={`text-xs font-bold tabular-nums ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/25 transition-colors"
          >
            Accept Retirement
          </button>
          <button
            onClick={onPushThrough}
            className="flex-1 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/25 transition-colors"
          >
            Push Through
          </button>
        </div>
        <p className="text-[8px] text-[#484f58] text-center">
          Pushing through: -15% fitness, +5% injury risk next season
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function CareerRetirement() {
  const gameState = useGameStore((s) => s.gameState);
  const evaluateRetirement = useGameStore((s) => s.evaluateRetirement);
  const initiateRetirementAction = useGameStore((s) => s.initiateRetirement);
  const completeRetirementAction = useGameStore((s) => s.completeRetirement);
  const setPostRetirementPathAction = useGameStore((s) => s.setPostRetirementPath);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RetirementReason>('age');
  const [retirementStep, setRetirementStep] = useState<'evaluate' | 'confirm' | 'complete'>('evaluate');

  const computed = useMemo(() => {
    if (!gameState) return null;
    const { player, achievements, recentResults } = gameState;

    // Total injuries
    const totalInjuries = player.injuryHistory.length;
    const hasCareerThreatening = gameState.injuries.some((i) => i.type === 'career_threatening');

    // Retirement probability
    const probability = calculateRetirementProbability(
      player.age,
      player.fitness,
      totalInjuries,
      hasCareerThreatening,
      player.morale,
    );

    // New retirement readiness evaluation
    const readiness = evaluateRetirement();

    // Legacy score calculation
    const legacyScore = Math.round(
      (player.careerStats?.goals || 0) * 0.3 +
      (player.careerStats?.appearances || 0) * 0.2 +
      (player.careerStats?.trophies?.length || 0) * 5 +
      (player.awards?.length || 0) * 3 +
      (player.internationalCareer?.caps || 0) * 0.5
    );
    const legacyTier = determineLegacyTier(Math.min(legacyScore, 100));

    // Estimated seasons remaining
    let seasonsRemaining = 99;
    if (player.age >= 33) {
      const baseSeasons = Math.max(0, 40 - player.age);
      const fitnessBonus = player.fitness > 70 ? 1 : player.fitness > 50 ? 0 : -1;
      const injuryPenalty = totalInjuries > 10 ? -1 : totalInjuries > 5 ? -0.5 : 0;
      seasonsRemaining = Math.max(0, Math.round(baseSeasons + fitnessBonus + injuryPenalty));
    }

    // Decline rate (attr loss per season)
    const declineRates: Record<number, number> = {
      30: 1.5, 31: 2.0, 32: 2.5, 33: 3.5, 34: 4.5,
      35: 5.5, 36: 7.0, 37: 8.5, 38: 10, 39: 10, 40: 10,
    };
    const declineRate = player.age >= 30 ? (declineRates[player.age] || 10) : 0;
    const declineLabel = declineRate <= 0 ? 'None' : declineRate <= 2 ? 'Gradual' : declineRate <= 5 ? 'Moderate' : 'Rapid';

    // Hall of Fame eligible: 100+ apps, 50+ goals, 5+ trophies, or 300+ games
    const cs = player.careerStats;
    const hofEligible =
      (cs.totalAppearances >= 100 && cs.totalGoals >= 50) ||
      cs.trophies.length >= 5 ||
      cs.totalAppearances >= 300;

    // Career highlights (top 5 moments)
    const highlights: { icon: React.ReactNode; title: string; detail: string }[] = [];
    const playedResults = recentResults.filter((r) => r.playerRating > 0);

    // Best match
    if (playedResults.length > 0) {
      const best = playedResults.reduce((b, r) => r.playerRating > b.playerRating ? r : b);
      highlights.push({
        icon: <Star className="h-3.5 w-3.5" />,
        title: 'Best Match Rating',
        detail: `${best.playerRating.toFixed(1)} vs ${best.awayClub.name}`,
      });
    }

    // Most goals in a match
    const mostGoalsMatch = playedResults.reduce((b, r) => r.playerGoals > b.playerGoals ? r : b, playedResults[0]);
    if (mostGoalsMatch && mostGoalsMatch.playerGoals >= 2) {
      highlights.push({
        icon: <Flame className="h-3.5 w-3.5" />,
        title: `${mostGoalsMatch.playerGoals} Goals in a Match`,
        detail: `vs ${mostGoalsMatch.awayClub.name}`,
      });
    }

    // First trophy
    const firstTrophy = cs.trophies[0];
    if (firstTrophy) {
      highlights.push({
        icon: <Trophy className="h-3.5 w-3.5" />,
        title: 'First Trophy',
        detail: firstTrophy.name,
      });
    }

    // Milestone appearances
    if (cs.totalAppearances >= 100) {
      highlights.push({
        icon: <Calendar className="h-3.5 w-3.5" />,
        title: '100+ Appearances',
        detail: `${cs.totalAppearances} career appearances`,
      });
    }

    // Milestone goals
    if (cs.totalGoals >= 50) {
      highlights.push({
        icon: <Target className="h-3.5 w-3.5" />,
        title: '50+ Career Goals',
        detail: `${cs.totalGoals} career goals`,
      });
    }

    // Fill remaining slots
    if (cs.totalAssists >= 30 && highlights.length < 5) {
      highlights.push({
        icon: <ChevronRight className="h-3.5 w-3.5" />,
        title: '30+ Assists',
        detail: `${cs.totalAssists} career assists`,
      });
    }

    const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
    if (unlockedAchievements >= 5 && highlights.length < 5) {
      highlights.push({
        icon: <Trophy className="h-3.5 w-3.5" />,
        title: `${unlockedAchievements} Achievements`,
        detail: 'Career milestones unlocked',
      });
    }

    return {
      probability,
      totalInjuries,
      hasCareerThreatening,
      seasonsRemaining,
      declineRate: declineLabel,
      hofEligible,
      highlights: highlights.slice(0, 5),
    };
  }, [gameState]);

  if (!gameState || !computed) return null;

  const { player } = gameState;
  const {
    probability,
    totalInjuries,
    hasCareerThreatening,
    seasonsRemaining,
    declineRate,
    hofEligible,
    highlights,
  } = computed;

  const cs = player.careerStats;

  // ── SVG Derived Data ────────────────────────────────────
  const seasonHistory = gameState.seasons.slice(-8);
  const yearsPlayed = Math.max(0, player.age - 18);
  const maxCareerYears = 22;

  const achievementsSegments = [
    { label: 'Trophies', value: cs.trophies.length, color: '#fbbf24' },
    { label: 'Goals', value: Math.min(cs.totalGoals, 100), color: '#22c55e' },
    { label: 'Caps', value: gameState.internationalCareer?.caps ?? 0, color: '#3b82f6' },
    { label: 'Assists', value: Math.min(cs.totalAssists, 80), color: '#06b6d4' },
    { label: 'Awards', value: gameState.achievements.reduce((cnt, ach) => cnt + (ach.unlocked ? 1 : 0), 0), color: '#a855f7' },
  ];
  const achievementsTotal = achievementsSegments.reduce((segSum, seg) => segSum + seg.value, 0);

  const peakRating = seasonHistory.reduce((peakVal, s) => Math.max(peakVal, s.playerStats.averageRating), 0);

  const goalsPerSeason = seasonHistory.map(s => s.playerStats.goals);
  const assistsPerSeason = seasonHistory.map(s => s.playerStats.assists);

  const careerValueMetrics = [
    { label: 'Market Value', player: Math.round(player.marketValue / 1e6), great: 100, color: '#22c55e' },
    { label: 'Wages (K/w)', player: Math.round(player.contract.weeklyWage / 1000), great: 200, color: '#3b82f6' },
    { label: 'Trophies', player: cs.trophies.length, great: 25, color: '#fbbf24' },
    { label: 'Int. Caps', player: gameState.internationalCareer?.caps ?? 0, great: 100, color: '#f97316' },
    { label: 'Goals', player: cs.totalGoals, great: 400, color: '#ef4444' },
  ];

  const readinessAxes = [
    { label: 'Physical', value: player.fitness, color: '#ef4444' },
    { label: 'Mental', value: player.morale, color: '#a855f7' },
    { label: 'Financial', value: Math.min(100, (player.marketValue / 50e6) * 100), color: '#22c55e' },
    { label: 'Social', value: player.reputation, color: '#3b82f6' },
    { label: 'Legacy', value: Math.min(100, player.overall), color: '#fbbf24' },
  ];

  const seasonRatings = seasonHistory.map(s => s.playerStats.averageRating);

  const postRetirementOptions = [
    { label: 'Management', score: Math.round(player.overall * 0.7 + player.morale * 0.3), color: '#a855f7' },
    { label: 'Punditry', score: Math.round(player.reputation * 0.8 + player.overall * 0.2), color: '#06b6d4' },
    { label: 'Coaching', score: Math.round(player.overall * 0.6 + player.fitness * 0.4), color: '#22c55e' },
    { label: 'Ambassador', score: Math.round(Math.min(100, player.reputation * 0.9 + cs.trophies.length * 2)), color: '#fbbf24' },
  ];

  const hofProbability = Math.min(99, Math.round([
    cs.totalAppearances >= 300 ? 30 : (cs.totalAppearances / 300) * 30,
    cs.totalGoals >= 100 ? 25 : (cs.totalGoals / 100) * 25,
    cs.trophies.length >= 5 ? 25 : (cs.trophies.length / 5) * 25,
    player.overall >= 85 ? 20 : (player.overall / 85) * 20,
  ].reduce((hofSum, val) => hofSum + val, 0)));

  const legacyMetrics = [
    { label: 'Goals', values: [
      { name: 'Player', value: cs.totalGoals, color: '#22c55e' },
      { name: 'Club Legend', value: Math.max(cs.totalGoals, Math.round(cs.totalGoals * 1.5)), color: '#fbbf24' },
      { name: 'All-Time Great', value: Math.max(cs.totalGoals, Math.round(cs.totalGoals * 2.5)), color: '#ef4444' },
    ]},
    { label: 'Assists', values: [
      { name: 'Player', value: cs.totalAssists, color: '#22c55e' },
      { name: 'Club Legend', value: Math.max(cs.totalAssists, Math.round(cs.totalAssists * 1.8)), color: '#fbbf24' },
      { name: 'All-Time Great', value: Math.max(cs.totalAssists, Math.round(cs.totalAssists * 3)), color: '#ef4444' },
    ]},
    { label: 'Trophies', values: [
      { name: 'Player', value: cs.trophies.length, color: '#22c55e' },
      { name: 'Club Legend', value: Math.max(cs.trophies.length, cs.trophies.length * 2), color: '#fbbf24' },
      { name: 'All-Time Great', value: Math.max(cs.trophies.length, cs.trophies.length * 4), color: '#ef4444' },
    ]},
    { label: 'Appearances', values: [
      { name: 'Player', value: cs.totalAppearances, color: '#22c55e' },
      { name: 'Club Legend', value: Math.max(cs.totalAppearances, Math.round(cs.totalAppearances * 1.3)), color: '#fbbf24' },
      { name: 'All-Time Great', value: Math.max(cs.totalAppearances, Math.round(cs.totalAppearances * 2)), color: '#ef4444' },
    ]},
    { label: 'Rating', values: [
      { name: 'Player', value: player.overall, color: '#22c55e' },
      { name: 'Club Legend', value: 88, color: '#fbbf24' },
      { name: 'All-Time Great', value: 95, color: '#ef4444' },
    ]},
  ];

  // SVG helper: convert [x,y] pairs to points string (rule 9)
  const svgPts = (pairs: [number, number][]): string =>
    pairs.map(([px, py]) => `${px},${py}`).join(' ');

  const handleAcceptRetirement = () => {
    initiateRetirementAction(selectedReason);
    completeRetirementAction();
    setShowModal(false);
    setRetirementStep('complete');
  };

  const handlePushThrough = () => {
    setShowModal(false);
    const state = gameState;
    if (state) {
      // Push through: reduce fitness, increase injury risk
      const updatedPlayer = {
        ...state.player,
        fitness: clamp(state.player.fitness - 15, 10, 100),
      };
      useGameStore.setState({
        gameState: {
          ...state,
          player: updatedPlayer,
          retirementPending: false,
          retirementRiskPushed: true,
        },
      });
      useGameStore.getState().addNotification({
        type: 'career',
        title: 'One More Season!',
        message: 'You push through the pain. Fitness drops but you still have something to give.',
        actionRequired: false,
      });
    }
  };

  const handlePostRetirementPath = (path: PostRetirementPath) => {
    setPostRetirementPathAction(path);
    setRetirementStep('complete');
  };

  const fitnessColor = player.fitness >= 70 ? '#22c55e' : player.fitness >= 50 ? '#f59e0b' : '#ef4444';
  const injuryColor = totalInjuries > 10 ? '#ef4444' : totalInjuries > 5 ? '#f59e0b' : '#22c55e';
  const seasonsColor = seasonsRemaining >= 4 ? '#22c55e' : seasonsRemaining >= 2 ? '#f59e0b' : '#ef4444';
  const declineColor = declineRate === 'None' ? '#22c55e' : declineRate === 'Gradual' ? '#22c55e' : declineRate === 'Moderate' ? '#f59e0b' : '#ef4444';

  // ── SVG Sub-Components (rule 13: camelCase, called as {fnName()}) ──

  // ── SVG 1: Career Length Ring ───────────────────────────
  function careerLengthRingSvg(): React.JSX.Element {
    const ringSize = 140;
    const cx = ringSize / 2;
    const cy = ringSize / 2;
    const radius = 54;
    const stroke = 10;
    const circumference = 2 * Math.PI * radius;
    const ratio = Math.min(1, yearsPlayed / maxCareerYears);
    const dashOffset = circumference * (1 - ratio);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Career Length</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4">
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="shrink-0">
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth={stroke} />
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#22c55e" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="900" className="tabular-nums">{yearsPlayed}</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">of {maxCareerYears} yrs</text>
            </svg>
            <div className="space-y-1.5 min-w-0">
              <div className="text-[10px] text-[#484f58]">Started at age 18</div>
              <div className="text-[10px] text-[#484f58]">Current: <span className="text-[#c9d1d9] font-bold">{player.age}</span></div>
              <div className="text-[10px] text-[#484f58]">Remaining: <span className="text-emerald-400 font-bold">{Math.max(0, maxCareerYears - yearsPlayed)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 2: Career Achievements Donut ────────────────────
  function achievementsDonutSvg(): React.JSX.Element {
    const donutSize = 160;
    const cx = donutSize / 2;
    const cy = donutSize / 2;
    const outerR = 58;
    const innerR = 38;
    const fullAngle = 2 * Math.PI;
    const startOffset = -Math.PI / 2;

    type DonutSeg = { label: string; value: number; color: string; startA: number; endA: number };

    const donutSegs = achievementsSegments.reduce<DonutSeg[]>((acc, seg, idx) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endA : startOffset;
      const segAngle = achievementsTotal > 0 ? (seg.value / achievementsTotal) * fullAngle : 0;
      return [...acc, { label: seg.label, value: seg.value, color: seg.color, startA: prevEnd, endA: prevEnd + segAngle }];
    }, []);

    const donutArc = (sA: number, eA: number, rO: number, rI: number): string => {
      const x1 = cx + rO * Math.cos(sA);
      const y1 = cy + rO * Math.sin(sA);
      const x2 = cx + rO * Math.cos(eA);
      const y2 = cy + rO * Math.sin(eA);
      const x3 = cx + rI * Math.cos(eA);
      const y3 = cy + rI * Math.sin(eA);
      const x4 = cx + rI * Math.cos(sA);
      const y4 = cy + rI * Math.sin(sA);
      const lg = (eA - sA) > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${rO} ${rO} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${rI} ${rI} 0 ${lg} 0 ${x4} ${y4} Z`;
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Achievements Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4">
            <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`} className="shrink-0">
              <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#21262d" strokeWidth={outerR - innerR} />
              {donutSegs.filter(ds => ds.endA > ds.startA).map((ds, i) => (
                <path key={i} d={donutArc(ds.startA, ds.endA, outerR, innerR)} fill={ds.color} opacity="0.85" />
              ))}
              <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="900" className="tabular-nums">{achievementsTotal}</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7">Total Score</text>
            </svg>
            <div className="space-y-1 min-w-0">
              {achievementsSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-[9px] text-[#8b949e]">{seg.label}</span>
                  <span className="text-[9px] text-[#c9d1d9] font-bold ml-auto tabular-nums">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 3: Peak Performance Gauge ──────────────────────
  function peakPerformanceGaugeSvg(): React.JSX.Element {
    const gaugeSize = 180;
    const cx = gaugeSize / 2;
    const cy = gaugeSize - 30;
    const radius = 70;
    const sw = 12;
    const startA = Math.PI;
    const endA = 0;
    const totalA = startA - endA;
    const bgP = describeArc(cx, cy, radius, startA, endA);
    const filledEndA = startA - (peakRating / 10) * totalA;
    const fillP = peakRating > 0 ? describeArc(cx, cy, radius, startA, Math.max(endA, filledEndA)) : '';
    const peakColor = peakRating >= 7.5 ? '#22c55e' : peakRating >= 6.0 ? '#f59e0b' : '#ef4444';

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Peak Season Rating</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex flex-col items-center">
          <svg width={gaugeSize} height={gaugeSize} viewBox={`0 0 ${gaugeSize} ${gaugeSize}`} className="overflow-visible">
            <path d={bgP} fill="none" stroke="#21262d" strokeWidth={sw} strokeLinecap="round" />
            {fillP && <path d={fillP} fill="none" stroke={peakColor} strokeWidth={sw} strokeLinecap="round" />}
            {[0, 4, 6, 8, 10].map((tick) => {
              const tAngle = startA - (tick / 10) * totalA;
              const ir = radius + sw / 2 + 4;
              const or = radius + sw / 2 + 8;
              const tx1 = cx + ir * Math.cos(tAngle);
              const ty1 = cy + ir * Math.sin(tAngle);
              const tx2 = cx + or * Math.cos(tAngle);
              const ty2 = cy + or * Math.sin(tAngle);
              return (
                <g key={tick}>
                  <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#484f58" strokeWidth="1" />
                  {tick % 2 === 0 && (
                    <text x={cx + (radius + sw / 2 + 16) * Math.cos(tAngle)} y={cy + (radius + sw / 2 + 16) * Math.sin(tAngle) + 3} textAnchor="middle" fill="#484f58" fontSize="7">{tick}</text>
                  )}
                </g>
              );
            })}
            <text x={cx} y={cy - 22} textAnchor="middle" fill={peakColor} fontSize="24" fontWeight="900" className="tabular-nums">{peakRating.toFixed(1)}</text>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#8b949e" fontSize="8">Peak Avg</text>
          </svg>
          <span className="text-[9px] mt-1 px-2 py-0.5 border" style={{ borderRadius: 4, borderColor: peakColor + '40', color: peakColor, backgroundColor: peakColor + '15' }}>
            {peakRating >= 8 ? 'World Class' : peakRating >= 7 ? 'Excellent' : peakRating >= 6 ? 'Good' : 'Developing'}
          </span>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 4: Goals per Season Area Chart ─────────────────
  function goalsPerSeasonAreaSvg(): React.JSX.Element {
    const cw = 300;
    const ch = 130;
    const pd = { t: 10, r: 10, b: 22, l: 28 };
    const pw = cw - pd.l - pd.r;
    const ph = ch - pd.t - pd.b;
    const maxG = Math.max(1, goalsPerSeason.reduce((mx, g) => Math.max(mx, g), 0));
    const n = goalsPerSeason.length;

    const tx = (i: number) => pd.l + (n > 1 ? (i / (n - 1)) * pw : pw / 2);
    const ty = (v: number) => pd.t + ph - (v / maxG) * ph;

    const dataPairs: [number, number][] = goalsPerSeason.map((g, i) => [tx(i), ty(g)]);
    const areaPairs: [number, number][] = [...dataPairs, [tx(n - 1), pd.t + ph], [tx(0), pd.t + ph]];
    const lineStr = svgPts(dataPairs);
    const areaStr = svgPts(areaPairs);
    const gridVals = [maxG * 0.25, maxG * 0.5, maxG * 0.75, maxG].map(v => Math.round(v));

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Goals per Season</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full">
            {gridVals.map((gv) => {
              const gy = ty(gv);
              return (
                <g key={gv}>
                  <line x1={pd.l} y1={gy} x2={cw - pd.r} y2={gy} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
                  <text x={pd.l - 3} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="6">{gv}</text>
                </g>
              );
            })}
            <polygon points={areaStr} fill="#22c55e" opacity="0.15" />
            <polyline points={lineStr} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />
            {dataPairs.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r="2.5" fill="#22c55e" opacity="0.9" />
            ))}
            {seasonHistory.map((s, i) => (
              <text key={i} x={tx(i)} y={ch - 6} textAnchor="middle" fill="#484f58" fontSize="6">S{s.number}</text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 5: Assists per Season Line Chart ───────────────
  function assistsPerSeasonLineSvg(): React.JSX.Element {
    const cw = 300;
    const ch = 130;
    const pd = { t: 10, r: 10, b: 22, l: 28 };
    const pw = cw - pd.l - pd.r;
    const ph = ch - pd.t - pd.b;
    const maxA = Math.max(1, assistsPerSeason.reduce((mx, a) => Math.max(mx, a), 0));
    const n = assistsPerSeason.length;

    const tx = (i: number) => pd.l + (n > 1 ? (i / (n - 1)) * pw : pw / 2);
    const ty = (v: number) => pd.t + ph - (v / maxA) * ph;

    const dataPairs: [number, number][] = assistsPerSeason.map((a, i) => [tx(i), ty(a)]);
    const lineStr = svgPts(dataPairs);
    const gridVals = [maxA * 0.25, maxA * 0.5, maxA * 0.75, maxA].map(v => Math.round(v));

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Assists per Season</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full">
            {gridVals.map((gv) => {
              const gy = ty(gv);
              return (
                <g key={gv}>
                  <line x1={pd.l} y1={gy} x2={cw - pd.r} y2={gy} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
                  <text x={pd.l - 3} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="6">{gv}</text>
                </g>
              );
            })}
            <polyline points={lineStr} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" />
            {dataPairs.map(([px, py], i) => (
              <g key={i}>
                <circle cx={px} cy={py} r="2.5" fill="#06b6d4" opacity="0.9" />
                <text x={px} y={py - 6} textAnchor="middle" fill="#06b6d4" fontSize="7" fontWeight="600">{assistsPerSeason[i]}</text>
              </g>
            ))}
            {seasonHistory.map((s, i) => (
              <text key={i} x={tx(i)} y={ch - 6} textAnchor="middle" fill="#484f58" fontSize="6">S{s.number}</text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 6: Career Value Bars ───────────────────────────
  function careerValueBarsSvg(): React.JSX.Element {
    const bw = 300;
    const bh = 150;
    const barH = 12;
    const gap = 22;
    const labelW = 60;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Career Value vs All-Time Greats</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${bw} ${bh}`} className="w-full">
            {careerValueMetrics.map((m, i) => {
              const y = 8 + i * gap;
              const maxBar = m.great;
              const pw = Math.min(((bw - labelW - 40) * m.player) / maxBar, bw - labelW - 40);
              const gw = bw - labelW - 40;
              return (
                <g key={i}>
                  <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="7">{m.label}</text>
                  <rect x={labelW} y={y} width={gw} height={barH} fill="#21262d" rx="2" />
                  <rect x={labelW} y={y} width={pw} height={barH} fill={m.color} opacity="0.8" rx="2" />
                  <text x={labelW + pw + 4} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="7" fontWeight="600">{m.player}</text>
                  <text x={labelW + gw + 4} y={y + barH / 2 + 3} fill="#484f58" fontSize="5">/ {m.great}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 7: Retirement Readiness Radar ──────────────────
  function retirementReadinessRadarSvg(): React.JSX.Element {
    const radarSize = 180;
    const cx = radarSize / 2;
    const cy = radarSize / 2;
    const maxR = 60;
    const axes = readinessAxes;
    const n = axes.length;
    const angleStep = (2 * Math.PI) / n;

    const toPt = (idx: number, val: number): [number, number] => {
      const angle = -Math.PI / 2 + idx * angleStep;
      const r = (val / 100) * maxR;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const gridRings = [25, 50, 75, 100];
    const gridPairs = gridRings.map(ringVal =>
      axes.reduce<[number, number][]>((acc, _, idx) => [...acc, toPt(idx, ringVal)], [])
    );
    const dataPairs = axes.reduce<[number, number][]>((acc, ax, idx) => [...acc, toPt(idx, ax.value)], []);
    const dataStr = svgPts(dataPairs);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Retirement Readiness</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex items-center gap-3">
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`} className="shrink-0">
            {gridPairs.map((gp, gi) => (
              <polygon key={gi} points={svgPts(gp)} fill="none" stroke="#21262d" strokeWidth="0.5" />
            ))}
            {axes.map((ax, ai) => {
              const edgePt = toPt(ai, 100);
              return (
                <g key={ai}>
                  <line x1={cx} y1={cy} x2={edgePt[0]} y2={edgePt[1]} stroke="#21262d" strokeWidth="0.5" />
                  <text x={edgePt[0] + (edgePt[0] > cx ? 8 : -8)} y={edgePt[1] + 3} textAnchor={edgePt[0] > cx ? 'start' : 'end'} fill="#8b949e" fontSize="6">{ax.label}</text>
                </g>
              );
            })}
            <polygon points={dataStr} fill="#22c55e" opacity="0.15" />
            <polyline points={dataStr} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />
            {dataPairs.map(([dpx, dpy], di) => (
              <circle key={di} cx={dpx} cy={dpy} r="3" fill={axes[di].color} />
            ))}
          </svg>
          <div className="space-y-1 min-w-0">
            {axes.map((ax, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 shrink-0" style={{ backgroundColor: ax.color }} />
                <span className="text-[9px] text-[#8b949e]">{ax.label}</span>
                <span className="text-[9px] text-[#c9d1d9] font-bold ml-auto tabular-nums">{Math.round(ax.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 8: Season Rating Trend ─────────────────────────
  function seasonRatingTrendSvg(): React.JSX.Element {
    const cw = 300;
    const ch = 130;
    const pd = { t: 10, r: 10, b: 22, l: 28 };
    const pw = cw - pd.l - pd.r;
    const ph = ch - pd.t - pd.b;
    const maxR = 10;
    const minR = 0;
    const n = seasonRatings.length;

    const tx = (i: number) => pd.l + (n > 1 ? (i / (n - 1)) * pw : pw / 2);
    const ty = (v: number) => pd.t + ph - ((v - minR) / (maxR - minR)) * ph;

    const dataPairs: [number, number][] = seasonRatings.map((r, i) => [tx(i), ty(r)]);
    const lineStr = svgPts(dataPairs);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Season Rating Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full">
            {[2, 4, 6, 8, 10].map((rv) => {
              const gy = ty(rv);
              return (
                <g key={rv}>
                  <line x1={pd.l} y1={gy} x2={cw - pd.r} y2={gy} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
                  <text x={pd.l - 3} y={gy + 3} textAnchor="end" fill="#484f58" fontSize="6">{rv}</text>
                </g>
              );
            })}
            {/* 7.0 reference line */}
            <line x1={pd.l} y1={ty(7)} x2={cw - pd.r} y2={ty(7)} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4,2" opacity="0.5" />
            <text x={cw - pd.r + 2} y={ty(7) + 3} fill="#f59e0b" fontSize="5" opacity="0.7">7.0</text>
            <polyline points={lineStr} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round" />
            {dataPairs.map(([rpx, rpy], i) => (
              <g key={i}>
                <circle cx={rpx} cy={rpy} r="2.5" fill={seasonRatings[i] >= 7 ? '#22c55e' : seasonRatings[i] >= 6 ? '#f59e0b' : '#ef4444'} />
                <text x={rpx} y={rpy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="6" fontWeight="600">{seasonRatings[i].toFixed(1)}</text>
              </g>
            ))}
            {seasonHistory.map((s, i) => (
              <text key={i} x={tx(i)} y={ch - 6} textAnchor="middle" fill="#484f58" fontSize="6">S{s.number}</text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 9: Post-Retirement Options Bars ────────────────
  function postRetirementBarsSvg(): React.JSX.Element {
    const bw = 300;
    const bh = 140;
    const barH = 16;
    const gap = 28;
    const labelW = 70;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Post-Retirement Suitability</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${bw} ${bh}`} className="w-full">
            {postRetirementOptions.map((opt, i) => {
              const y = 10 + i * gap;
              const maxW = bw - labelW - 36;
              const fillW = Math.min((maxW * Math.min(100, opt.score)) / 100, maxW);
              return (
                <g key={i}>
                  <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="8">{opt.label}</text>
                  <rect x={labelW} y={y} width={maxW} height={barH} fill="#21262d" rx="2" />
                  <rect x={labelW} y={y} width={fillW} height={barH} fill={opt.color} opacity="0.8" rx="2" />
                  <text x={labelW + fillW + 5} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="8" fontWeight="700">{opt.score}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 10: Hall of Fame Probability Ring ──────────────
  function hofProbabilityRingSvg(): React.JSX.Element {
    const ringSize = 140;
    const cx = ringSize / 2;
    const cy = ringSize / 2;
    const radius = 54;
    const stroke = 10;
    const circumference = 2 * Math.PI * radius;
    const ratio = hofProbability / 100;
    const dashOffset = circumference * (1 - ratio);
    const hofColor = hofProbability >= 70 ? '#fbbf24' : hofProbability >= 40 ? '#f59e0b' : '#ef4444';

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Hall of Fame Probability</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4">
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="shrink-0">
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth={stroke} />
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke={hofColor} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              <text x={cx} y={cy - 4} textAnchor="middle" fill={hofColor} fontSize="22" fontWeight="900" className="tabular-nums">{hofProbability}%</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8">HoF Chance</text>
            </svg>
            <div className="space-y-1.5 min-w-0">
              <div className="text-[10px] text-[#484f58]">Apps: <span className="text-[#c9d1d9] font-bold">{cs.totalAppearances}</span></div>
              <div className="text-[10px] text-[#484f58]">Goals: <span className="text-[#c9d1d9] font-bold">{cs.totalGoals}</span></div>
              <div className="text-[10px] text-[#484f58]">Trophies: <span className="text-[#c9d1d9] font-bold">{cs.trophies.length}</span></div>
              <div className="text-[10px] text-[#484f58]">Status: <span className="font-bold" style={{ color: hofColor }}>{hofEligible ? 'Eligible' : 'Not Yet'}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── SVG 11: Legacy Score Bars ──────────────────────────
  function legacyScoreBarsSvg(): React.JSX.Element {
    const lw = 300;
    const lh = 190;
    const groupH = 32;
    const labelW = 56;
    const barAreaW = lw - labelW - 16;
    const barH = 5;
    const barGap = 3;
    const legendItems = [
      { name: 'Player', color: '#22c55e' },
      { name: 'Club Legend', color: '#fbbf24' },
      { name: 'All-Time Great', color: '#ef4444' },
    ];

    // Compute max per metric
    const maxPerMetric = legacyMetrics.map(m =>
      m.values.reduce((mx, v) => Math.max(mx, v.value), 0)
    );

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Legacy Comparison</CardTitle>
            <div className="flex items-center gap-2">
              {legendItems.map((lg, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: lg.color }} />
                  <span className="text-[7px] text-[#484f58]">{lg.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${lw} ${lh}`} className="w-full">
            {legacyMetrics.map((m, mi) => {
              const yStart = 4 + mi * groupH;
              const maxVal = maxPerMetric[mi] || 1;
              return (
                <g key={mi}>
                  <text x={labelW - 4} y={yStart + groupH / 2 + 2} textAnchor="end" fill="#8b949e" fontSize="7">{m.label}</text>
                  {m.values.map((v, vi) => {
                    const bY = yStart + vi * (barH + barGap);
                    const bW = Math.max(1, (barAreaW * v.value) / maxVal);
                    return (
                      <g key={vi}>
                        <rect x={labelW} y={bY} width={barAreaW} height={barH} fill="#21262d" rx="1" />
                        <rect x={labelW} y={bY} width={bW} height={barH} fill={v.color} opacity="0.75" rx="1" />
                        <text x={labelW + bW + 3} y={bY + barH - 0.5} fill={v.color} fontSize="5.5" fontWeight="600">{v.value}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* ═══ 1. HEADER ═══ */}
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
              <Hourglass className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#c9d1d9]">Career Outlook</h1>
              <p className="text-[10px] text-[#8b949e]">Plan your future in the game</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 bg-[#21262d] border border-[#30363d] text-[#8b949e] font-bold" style={{ borderRadius: 4 }}>
              Age {player.age}
            </span>
            {gameState.retirementPending && (
              <button
                onClick={() => setShowModal(true)}
                className="text-[9px] px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400 font-bold animate-pulse"
                style={{ borderRadius: 4 }}
              >
                Decision Needed
              </button>
            )}
          </div>
        </motion.div>

        {/* ═══ 2. RETIREMENT RISK GAUGE ═══ */}
        <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
          <RetirementGauge probability={probability} age={player.age} />
          {player.age < 33 && (
            <p className="text-[9px] text-[#484f58] text-center mt-2">
              Retirement risk begins at age 33. You have {Math.max(0, 33 - player.age)} season{33 - player.age !== 1 ? 's' : ''} until the first check.
            </p>
          )}
        </motion.div>

        {/* ═══ 3. PHYSICAL CONDITION ASSESSMENT ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}>
            <Activity className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Physical Condition</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-2">
            <ConditionCard
              icon={<Heart className="h-4 w-4" />}
              label="Fitness Level"
              value={`${player.fitness}/100`}
              subtext={player.fitness >= 70 ? 'Good condition' : player.fitness >= 50 ? 'Declining' : 'Poor condition'}
              color={fitnessColor}
              delay={D * 3}
            />
            <ConditionCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Injury History"
              value={`${totalInjuries}`}
              subtext={hasCareerThreatening ? 'Career-threatening injury on record' : totalInjuries > 5 ? 'Injury-prone' : 'Relatively clean'}
              color={injuryColor}
              delay={D * 4}
            />
            <ConditionCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Decline Rate"
              value={declineRate}
              subtext={player.age < 30 ? 'No decline yet' : `${player.age >= 30 ? 'Active decline' : ''}`}
              color={declineColor}
              delay={D * 5}
            />
            <ConditionCard
              icon={<Calendar className="h-4 w-4" />}
              label="Est. Seasons Left"
              value={player.age < 33 ? 'Many' : String(seasonsRemaining)}
              subtext={player.age < 33 ? 'Retirement not yet a concern' : seasonsRemaining >= 3 ? 'Still time for glory' : 'Twilight years'}
              color={seasonsColor}
              delay={D * 6}
            />
          </div>
        </section>

        {/* ═══ 4. CAREER LEGACY PREVIEW ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 7 }}>
            <Trophy className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Career Legacy</h2>
            {hofEligible && (
              <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold" style={{ borderRadius: 4 }}>
                HOF Eligible
              </span>
            )}
          </motion.div>
          <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 7 }}>
            {/* Stats grid */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { value: cs.totalGoals, label: 'Goals', color: 'text-emerald-400' },
                { value: cs.totalAssists, label: 'Assists', color: 'text-cyan-400' },
                { value: cs.totalAppearances, label: 'Apps', color: 'text-sky-400' },
                { value: cs.trophies.length, label: 'Trophies', color: 'text-amber-400' },
                { value: cs.seasonsPlayed, label: 'Seasons', color: 'text-violet-400' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="text-[8px] text-[#484f58]">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Trophies list */}
            {cs.trophies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 pt-3 border-t border-[#30363d]">
                {cs.trophies.slice(0, 8).map((t, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ borderRadius: 4 }}>
                    {t.name}
                  </span>
                ))}
                {cs.trophies.length > 8 && (
                  <span className="text-[9px] px-2 py-0.5 bg-[#21262d] border border-[#30363d] text-[#484f58]" style={{ borderRadius: 4 }}>
                    +{cs.trophies.length - 8} more
                  </span>
                )}
              </div>
            )}

            {/* Career highlights timeline */}
            {highlights.length > 0 && (
              <div className="pt-3 border-t border-[#30363d]">
                <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Career Highlights</p>
                <div className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 shrink-0 mt-0.5">
                        <span className="text-emerald-400">{h.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#c9d1d9]">{h.title}</p>
                        <p className="text-[9px] text-[#8b949e] truncate">{h.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* ═══ 5. AGE DECLINE CHART ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 9 }}>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Decline Projections</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 9 }}>
            <DeclineChart currentAge={player.age} attributes={player.attributes} />
          </motion.div>
        </section>

        {/* ═══ 6. POST-RETIREMENT OPTIONS ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 11 }}>
            <Shield className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Post-Career Path</h2>
          </motion.div>
          <div className="space-y-2">
            <PostRetirementCard
              icon={<Activity className="h-5 w-5" />}
              title="Stay as Player"
              description="Continue playing as long as your body allows. Push through the decline and chase more glory."
              delay={D * 12}
            />
            <PostRetirementCard
              icon={<Brain className="h-5 w-5" />}
              title="Transition to Coaching"
              description="Use your experience to guide the next generation. Start your coaching badges and lead from the dugout."
              delay={D * 13}
            />
            <PostRetirementCard
              icon={<Mic className="h-5 w-5" />}
              title="Punditry Career"
              description="Share your insights with millions. Your playing career gives you credibility in the broadcast studio."
              delay={D * 14}
            />
            <PostRetirementCard
              icon={<Users className="h-5 w-5" />}
              title="Club Ambassador"
              description="Stay connected with the club you love. Represent the badge off the pitch at events and ceremonies."
              delay={D * 15}
            />
          </div>
        </section>

        {/* ═══ 7. Retirement modifier breakdown ═══ */}
        {player.age >= 30 && (
          <section>
            <motion.div className="flex items-center gap-2 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 16 }}>
              <AlertTriangle className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-[#c9d1d9]">Risk Factors</h2>
            </motion.div>
            <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 16 }}>
              {[
                { label: 'Age Factor', detail: player.age <= 32 ? '0% (below threshold)' : `Base: ${5 + (player.age - 33) * 8}%`, active: player.age > 32, color: player.age > 32 ? '#ef4444' : '#8b949e' },
                { label: 'Fitness', detail: player.fitness < 50 ? '+10% (low fitness)' : 'No modifier', active: player.fitness < 50, color: '#f59e0b' },
                { label: 'Injury History', detail: totalInjuries > 10 ? '+8% (injury-prone)' : 'No modifier', active: totalInjuries > 10, color: '#f59e0b' },
                { label: 'Career-Threatening', detail: hasCareerThreatening ? '+15% (serious injury)' : 'No modifier', active: hasCareerThreatening, color: '#ef4444' },
                { label: 'High Morale', detail: player.morale > 80 ? '-5% (motivated)' : 'No modifier', active: player.morale > 80, color: '#22c55e' },
                { label: 'Low Morale', detail: player.morale < 30 ? '+8% (unmotivated)' : 'No modifier', active: player.morale < 30, color: '#ef4444' },
              ].map((factor) => (
                <div key={factor.label} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: factor.active ? factor.color : '#30363d' }} />
                    <span className="text-[10px] text-[#8b949e]">{factor.label}</span>
                  </div>
                  <span className="text-[9px] font-medium" style={{ color: factor.active ? factor.color : '#484f58' }}>
                    {factor.detail}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#30363d] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#c9d1d9]">Total Probability</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: getRiskColor(probability) }}>
                  {probability}%
                </span>
              </div>
            </motion.div>
          </section>
        )}

        {/* ═══ 8. DATA VISUALIZATIONS ═══ */}
        <section>
          <motion.div className="flex items-center gap-2 mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 17 }}>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-[#c9d1d9]">Career Analytics</h2>
          </motion.div>
          <div className="space-y-3">
            {/* Row: Career Length Ring + Peak Performance Gauge */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 18 }}>
                {careerLengthRingSvg()}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 19 }}>
                {peakPerformanceGaugeSvg()}
              </motion.div>
            </div>

            {/* Achievements Donut */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 20 }}>
              {achievementsDonutSvg()}
            </motion.div>

            {/* Goals per Season + Assists per Season */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 21 }}>
                {goalsPerSeasonAreaSvg()}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 22 }}>
                {assistsPerSeasonLineSvg()}
              </motion.div>
            </div>

            {/* Season Rating Trend */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 23 }}>
              {seasonRatingTrendSvg()}
            </motion.div>

            {/* Career Value Bars */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 24 }}>
              {careerValueBarsSvg()}
            </motion.div>

            {/* Retirement Readiness Radar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 25 }}>
              {retirementReadinessRadarSvg()}
            </motion.div>

            {/* Post-Retirement Options Bars */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 26 }}>
              {postRetirementBarsSvg()}
            </motion.div>

            {/* HoF Probability Ring */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 27 }}>
              {hofProbabilityRingSvg()}
            </motion.div>

            {/* Legacy Score Bars */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 28 }}>
              {legacyScoreBarsSvg()}
            </motion.div>
          </div>
        </section>

        {/* Retirement Decision Modal */}
        <AnimatePresence>
          {showModal && (
            <RetirementModal
              player={{
                name: player.name,
                age: player.age,
                careerStats: cs,
              }}
              onAccept={handleAcceptRetirement}
              onPushThrough={handlePushThrough}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
