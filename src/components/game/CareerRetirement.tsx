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
  const [showModal, setShowModal] = useState(false);

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

  const handleAcceptRetirement = () => {
    setShowModal(false);
    // Mark as pending (actual retirement flow not implemented yet)
    useGameStore.getState().addNotification({
      type: 'career',
      title: 'Retirement Accepted',
      message: 'Your legendary career has come to an end. The fans will never forget you.',
      actionRequired: false,
    });
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

  const fitnessColor = player.fitness >= 70 ? '#22c55e' : player.fitness >= 50 ? '#f59e0b' : '#ef4444';
  const injuryColor = totalInjuries > 10 ? '#ef4444' : totalInjuries > 5 ? '#f59e0b' : '#22c55e';
  const seasonsColor = seasonsRemaining >= 4 ? '#22c55e' : seasonsRemaining >= 2 ? '#f59e0b' : '#ef4444';
  const declineColor = declineRate === 'None' ? '#22c55e' : declineRate === 'Gradual' ? '#22c55e' : declineRate === 'Moderate' ? '#f59e0b' : '#ef4444';

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
