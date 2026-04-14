'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute, PlayerAttributes } from '@/lib/game/types';
import {
  CheckCircle2,
  Lock,
  Star,
  TrendingUp,
  Target,
  Zap,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

interface JourneyPhase {
  id: string;
  label: string;
  ageRange: string;
  description: string;
  minAge: number;
  maxAge: number;
  icon: React.ReactNode;
}

interface MilestonePrediction {
  label: string;
  targetAge: number;
  icon: React.ReactNode;
  probability: 'High' | 'Medium' | 'Low';
  achieved: boolean;
}

interface LegendComparison {
  name: string;
  style: string;
  curve: number[];
  color: string;
}

const JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: 'youth_academy',
    label: 'Youth Academy',
    ageRange: 'Age 14-17',
    description: 'Develop your fundamentals',
    minAge: 14,
    maxAge: 17,
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'u21_reserve',
    label: 'U21 Reserve',
    ageRange: 'Age 17-20',
    description: 'Break into the first team',
    minAge: 17,
    maxAge: 20,
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: 'first_team',
    label: 'First Team',
    ageRange: 'Age 20-25',
    description: 'Establish yourself',
    minAge: 20,
    maxAge: 25,
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: 'prime_years',
    label: 'Prime Years',
    ageRange: 'Age 25-30',
    description: 'Peak performance',
    minAge: 25,
    maxAge: 30,
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: 'late_career',
    label: 'Late Career',
    ageRange: 'Age 30-34',
    description: 'Experience matters',
    minAge: 30,
    maxAge: 34,
    icon: <Award className="h-4 w-4" />,
  },
  {
    id: 'twilight',
    label: 'Twilight',
    ageRange: 'Age 34+',
    description: 'Final chapters',
    minAge: 34,
    maxAge: 40,
    icon: <Target className="h-4 w-4" />,
  },
];

// X-axis milestones for trajectory chart
const AGE_MILESTONES = [18, 21, 25, 28, 30, 33];

// Legendary career paths (rating values at each AGE_MILESTONES)
const LEGENDARY_CURVES: LegendComparison[] = [
  {
    name: 'Messi-style',
    style: 'dashed',
    curve: [82, 88, 93, 95, 94, 91],
    color: '#60A5FA',
  },
  {
    name: 'Ronaldo-style',
    style: 'dashed',
    curve: [78, 86, 92, 94, 93, 90],
    color: '#FBBF24',
  },
  {
    name: 'Neymar-style',
    style: 'dashed',
    curve: [80, 87, 90, 91, 88, 84],
    color: '#A78BFA',
  },
];

// ============================================================
// Helper Functions
// ============================================================

function getPhaseStatus(
  age: number,
  phase: JourneyPhase
): 'completed' | 'current' | 'future' {
  if (age > phase.maxAge) return 'completed';
  if (age >= phase.minAge) return 'current';
  return 'future';
}

function generatePlayerTrajectory(
  currentAge: number,
  currentOvr: number,
  potential: number
): number[] {
  // Generate expected rating at each AGE_MILESTONES based on potential
  return AGE_MILESTONES.map((milestoneAge) => {
    if (milestoneAge <= currentAge) {
      // Past or current: interpolate based on age
      if (milestoneAge === currentAge) return currentOvr;
      // Past milestones: estimate backwards
      const ageDiff = currentAge - milestoneAge;
      return Math.max(40, Math.round(currentOvr - ageDiff * 1.5));
    }
    // Future milestones: growth curve toward potential
    const yearsToPeak = Math.max(1, 26 - currentAge);
    const yearsFromNow = milestoneAge - currentAge;
    const growthRate = (potential - currentOvr) / yearsToPeak;
    let rating = currentOvr + growthRate * yearsFromNow;
    // Decline after peak age (~29)
    if (milestoneAge > 29) {
      const decline = (milestoneAge - 29) * 1.2;
      rating = Math.max(40, potential - decline);
    }
    return Math.min(potential, Math.max(40, Math.round(rating)));
  });
}

function generateMilestones(
  age: number,
  ovr: number,
  potential: number,
  form: number,
  careerStats: { totalAppearances: number; totalGoals: number }
): MilestonePrediction[] {
  return [
    {
      label: 'First Team Debut',
      targetAge: 17,
      icon: <Star className="h-3.5 w-3.5" />,
      probability:
        age >= 17
          ? 'High'
          : ovr >= 60 && age >= 15
            ? 'High'
            : ovr >= 50
              ? 'Medium'
              : 'Low',
      achieved: careerStats.totalAppearances > 0,
    },
    {
      label: 'International Call-up',
      targetAge: 21,
      icon: <Award className="h-3.5 w-3.5" />,
      probability:
        ovr >= 80
          ? 'High'
          : ovr >= 70
            ? 'Medium'
            : 'Low',
      achieved: false,
    },
    {
      label: 'Peak Rating',
      targetAge: 26,
      icon: <Flame className="h-3.5 w-3.5" />,
      probability:
        potential >= 85
          ? 'High'
          : potential >= 75
            ? 'Medium'
            : 'Low',
      achieved: ovr >= potential - 2,
    },
    {
      label: 'World Class (90+)',
      targetAge: 24,
      icon: <Zap className="h-3.5 w-3.5" />,
      probability:
        potential >= 90 && ovr >= 80
          ? 'High'
          : potential >= 88
            ? 'Medium'
            : 'Low',
      achieved: ovr >= 90,
    },
  ];
}

function getWeakestAttribute(
  attributes: PlayerAttributes
): { name: CoreAttribute; value: number } {
  const core: CoreAttribute[] = [
    'pace',
    'shooting',
    'passing',
    'dribbling',
    'defending',
    'physical',
  ];
  let weakest: CoreAttribute = 'defending';
  let minVal = 100;
  for (const attr of core) {
    if (attributes[attr] < minVal) {
      minVal = attributes[attr];
      weakest = attr;
    }
  }
  return { name: weakest, value: minVal };
}

function formatAttrName(attr: string): string {
  return attr.charAt(0).toUpperCase() + attr.slice(1);
}

function getProbabilityColor(prob: 'High' | 'Medium' | 'Low'): string {
  switch (prob) {
    case 'High':
      return 'text-emerald-400';
    case 'Medium':
      return 'text-amber-400';
    case 'Low':
      return 'text-rose-400';
  }
}

function getProbabilityBg(prob: 'High' | 'Medium' | 'Low'): string {
  switch (prob) {
    case 'High':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'Medium':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'Low':
      return 'bg-rose-500/10 border-rose-500/20';
  }
}

function getDevSpeedRating(age: number, ovr: number, potential: number): string {
  if (age <= 18 && ovr >= potential - 15) return 'Fast Track';
  if (age <= 20 && ovr >= potential - 10) return 'Above Average';
  if (ovr >= potential - 20) return 'On Track';
  if (ovr >= potential - 30) return 'Steady';
  return 'Needs Focus';
}

// ============================================================
// SVG Chart Component
// ============================================================

function TrajectoryChart({
  playerCurve,
  currentAge,
  potential,
  currentOvr,
}: {
  playerCurve: number[];
  currentAge: number;
  potential: number;
  currentOvr: number;
}) {
  const chartW = 320;
  const chartH = 180;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;
  const minRating = 40;
  const maxRating = 99;

  const toX = (i: number) => padLeft + (i / (AGE_MILESTONES.length - 1)) * plotW;
  const toY = (rating: number) =>
    padTop + plotH - ((rating - minRating) / (maxRating - minRating)) * plotH;

  // Build polyline points
  const pointsToPath = (data: number[]) =>
    data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Find the peak marker (apex of expected trajectory)
  let peakIndex = 0;
  let peakVal = 0;
  for (let i = 0; i < playerCurve.length; i++) {
    if (playerCurve[i] > peakVal) {
      peakVal = playerCurve[i];
      peakIndex = i;
    }
  }

  // Current age position on chart
  const currentIndex = AGE_MILESTONES.findIndex((a) => a >= currentAge);
  const displayIndex =
    currentIndex === -1 ? AGE_MILESTONES.length - 1 : currentIndex;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
      <h3 className="text-xs font-semibold text-[#c9d1d9] mb-2">
        Potential Trajectory
      </h3>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid lines and labels */}
        {[40, 55, 70, 85, 99].map((rating) => {
          const y = toY(rating);
          return (
            <g key={rating}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + plotW}
                y2={y}
                stroke="#21262d"
                strokeWidth={0.5}
              />
              <text
                x={padLeft - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-[#484f58] text-[7px]"
              >
                {rating}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {AGE_MILESTONES.map((age, i) => (
          <text
            key={age}
            x={toX(i)}
            y={chartH - 6}
            textAnchor="middle"
            className="fill-[#484f58] text-[7px]"
          >
            {age}
          </text>
        ))}

        {/* X-axis label "Age" */}
        <text
          x={padLeft + plotW / 2}
          y={chartH - 0.5}
          textAnchor="middle"
          className="fill-[#30363d] text-[6px]"
        >
          Age
        </text>

        {/* Legend comparison curves */}
        {LEGENDARY_CURVES.map((legend) => (
          <polyline
            key={legend.name}
            points={pointsToPath(legend.curve)}
            fill="none"
            stroke={legend.color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        ))}

        {/* Potential dashed line (horizontal) */}
        <line
          x1={padLeft}
          y1={toY(potential)}
          x2={padLeft + plotW}
          y2={toY(potential)}
          stroke="#22C55E"
          strokeWidth={0.75}
          strokeDasharray="6 4"
          opacity={0.4}
        />

        {/* Player expected trajectory (dashed) */}
        <polyline
          points={pointsToPath(playerCurve)}
          fill="none"
          stroke="#10B981"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          opacity={0.6}
        />

        {/* Player current actual curve (solid) — only up to current age */}
        {currentIndex > 0 && (
          <polyline
            points={playerCurve
              .slice(0, currentIndex + 1)
              .map((v, i) => `${toX(i)},${toY(v)}`)
              .join(' ')}
            fill="none"
            stroke="#10B981"
            strokeWidth={2}
          />
        )}

        {/* Current position dot with glow */}
        <circle
          cx={toX(displayIndex)}
          cy={toY(currentOvr)}
          r={6}
          fill="#10B981"
          opacity={0.2}
        />
        <circle
          cx={toX(displayIndex)}
          cy={toY(currentOvr)}
          r={3.5}
          fill="#10B981"
          opacity={0.5}
        />
        <circle
          cx={toX(displayIndex)}
          cy={toY(currentOvr)}
          r={2}
          fill="#10B981"
        />

        {/* Peak marker */}
        {peakIndex !== displayIndex && (
          <g>
            <circle
              cx={toX(peakIndex)}
              cy={toY(peakVal)}
              r={3}
              fill="none"
              stroke="#FBBF24"
              strokeWidth={1}
              opacity={0.6}
            />
            <text
              x={toX(peakIndex)}
              y={toY(peakVal) - 8}
              textAnchor="middle"
              className="fill-[#FBBF24] text-[7px] font-semibold"
            >
              {peakVal}
            </text>
          </g>
        )}

        {/* "Your Peak" label at apex */}
        <text
          x={toX(peakIndex)}
          y={toY(peakVal) - 15}
          textAnchor="middle"
          className="fill-[#FBBF24] text-[6px] font-medium"
          opacity={0.8}
        >
          Your Peak: {peakVal}
        </text>

        {/* Current OVR label */}
        <text
          x={toX(displayIndex)}
          y={toY(currentOvr) + 12}
          textAnchor="middle"
          className="fill-[#10B981] text-[7px] font-semibold"
        >
          {currentOvr}
        </text>
      </svg>

      {/* Chart legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-[9px] text-[#8b949e]">You</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block opacity-50" style={{ borderTop: '1px dashed #10B981' }} />
          <span className="text-[9px] text-[#8b949e]">Projected</span>
        </div>
        {LEGENDARY_CURVES.map((legend) => (
          <div key={legend.name} className="flex items-center gap-1">
            <span
              className="w-3 h-0.5 inline-block"
              style={{
                borderTop: `1px dashed ${legend.color}`,
                opacity: 0.6,
              }}
            />
            <span className="text-[9px] text-[#8b949e]">{legend.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PotentialJourney() {
  const gameState = useGameStore((s) => s.gameState);

  const player = gameState?.player;
  const season = gameState?.currentSeason;

  const {
    phaseStatuses,
    playerCurve,
    milestones,
    weakest,
    devSpeed,
    yearsToPeak,
    percentileRank,
  } = useMemo(() => {
    if (!player) {
      return {
        phaseStatuses: JOURNEY_PHASES.map(() => 'future' as const),
        playerCurve: [50, 55, 60, 65, 63, 58],
        milestones: [] as MilestonePrediction[],
        weakest: { name: 'pace' as CoreAttribute, value: 50 },
        devSpeed: 'On Track',
        yearsToPeak: 10,
        percentileRank: 50,
      };
    }

    const age = player.age;
    const ovr = player.overall;
    const pot = player.potential;

    const phases = JOURNEY_PHASES.map((phase) =>
      getPhaseStatus(age, phase)
    );
    const curve = generatePlayerTrajectory(age, ovr, pot);
    const predictedMilestones = generateMilestones(
      age,
      ovr,
      pot,
      player.form,
      player.careerStats
    );
    const weakestAttr = getWeakestAttribute(player.attributes);
    const speed = getDevSpeedRating(age, ovr, pot);
    const peakAge = Math.max(1, 26 - age);
    const rank = Math.min(
      99,
      Math.max(
        10,
        Math.round(
          40 + (ovr / pot) * 30 + (age <= 20 ? 15 : 0) + player.form * 0.5
        )
      )
    );

    return {
      phaseStatuses: phases,
      playerCurve: curve,
      milestones: predictedMilestones,
      weakest: weakestAttr,
      devSpeed: speed,
      yearsToPeak: peakAge,
      percentileRank: rank,
    };
  }, [player]);

  if (!player || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#484f58] text-sm">
        No career data available.
      </div>
    );
  }

  const age = player.age;
  const ovr = player.overall;
  const pot = player.potential;

  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: i * 0.08, duration: 0.35 },
    }),
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-bold text-[#c9d1d9] tracking-tight">
          Potential Journey
        </h1>
        <p className="text-xs text-[#8b949e] mt-0.5">
          Your development roadmap from youth to retirement
        </p>
      </motion.div>

      {/* ---- Section 1: Stats Summary ---- */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
          Stats Summary
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <StatBlock label="Age" value={String(age)} />
          <StatBlock
            label="OVR"
            value={String(ovr)}
            valueColor={
              ovr >= 80
                ? 'text-emerald-400'
                : ovr >= 65
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }
          />
          <StatBlock
            label="POT"
            value={String(pot)}
            valueColor="text-emerald-400"
          />
          <StatBlock
            label="Form"
            value={player.form.toFixed(1)}
            valueColor={
              player.form >= 7
                ? 'text-emerald-400'
                : player.form >= 6
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#21262d]">
          <StatBlock
            label="Years to Peak"
            value={`~${yearsToPeak}`}
          />
          <StatBlock
            label="Dev Speed"
            value={devSpeed}
            valueColor={
              devSpeed === 'Fast Track' || devSpeed === 'Above Average'
                ? 'text-emerald-400'
                : devSpeed === 'On Track'
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }
          />
        </div>
      </motion.div>

      {/* ---- Section 2: Journey Timeline ---- */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
          Career Phases
        </h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#30363d]" />

          <div className="space-y-3">
            {JOURNEY_PHASES.map((phase, idx) => {
              const status = phaseStatuses[idx];
              return (
                <motion.div
                  key={phase.id}
                  custom={idx + 2}
                  initial="hidden"
                  animate="visible"
                  variants={fadeVariant}
                  className="relative flex items-start gap-3"
                >
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center rounded-lg border ${
                      status === 'current'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-[#0d1117] border-[#30363d] text-[#484f58]'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : status === 'current' ? (
                      <Star className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          status === 'current'
                            ? 'text-emerald-400'
                            : status === 'completed'
                              ? 'text-[#c9d1d9]'
                              : 'text-[#484f58]'
                        }`}
                      >
                        {phase.label}
                      </span>
                      <span className="text-[9px] text-[#484f58]">
                        {phase.ageRange}
                      </span>
                      {status === 'current' && (
                        <span className="text-[8px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-px rounded-sm">
                          Current
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        status === 'current'
                          ? 'text-[#8b949e]'
                          : 'text-[#484f58]'
                      }`}
                    >
                      {phase.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ---- Section 3: Potential Trajectory Chart ---- */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
      >
        <TrajectoryChart
          playerCurve={playerCurve}
          currentAge={age}
          potential={pot}
          currentOvr={ovr}
        />
      </motion.div>

      {/* ---- Section 4: Career Milestone Predictions ---- */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
          Milestone Predictions
        </h2>
        <div className="space-y-2">
          {milestones.map((m, idx) => (
            <motion.div
              key={m.label}
              custom={idx + 5}
              initial="hidden"
              animate="visible"
              variants={fadeVariant}
              className={`flex items-center gap-3 p-2.5 rounded-lg border ${getProbabilityBg(m.probability)}`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg ${
                  m.achieved
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#0d1117] text-[#8b949e]'
                }`}
              >
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-semibold ${
                      m.achieved ? 'text-emerald-400' : 'text-[#c9d1d9]'
                    }`}
                  >
                    {m.label}
                  </span>
                  {m.achieved && (
                    <span className="text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-px rounded-sm">
                      Done
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-[#8b949e]">
                  Target: Age {m.targetAge}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`text-[10px] font-semibold ${getProbabilityColor(m.probability)}`}
                >
                  {m.probability}
                </span>
                {!m.achieved && (
                  <ChevronRight className="h-3 w-3 text-[#484f58]" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ---- Section 5: Compared to Legends ---- */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
          Compared to Legends
        </h2>
        <p className="text-[10px] text-[#8b949e] mb-3">
          How your trajectory stacks up against the greats at the same age
        </p>

        <div className="space-y-2">
          {LEGENDARY_CURVES.map((legend) => {
            const legendIdx = AGE_MILESTONES.findIndex(
              (a) => a >= age
            );
            const displayIdx =
              legendIdx === -1 ? AGE_MILESTONES.length - 1 : legendIdx;
            const legendRating = legend.curve[displayIdx];
            const diff = ovr - legendRating;
            return (
              <div
                key={legend.name}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: legend.color, opacity: 0.7 }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-[#c9d1d9]">
                    {legend.name}
                  </span>
                  <span className="text-[9px] text-[#484f58] ml-2">
                    OVR at your age: {legendRating}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {diff >= 0 ? '+' : ''}
                  {diff}
                </span>
              </div>
            );
          })}
        </div>

        {/* Percentile comparison */}
        <div className="mt-3 pt-3 border-t border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#8b949e]">
                  Ahead of players at this age
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  {percentileRank}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  style={{ width: `${percentileRank}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Section 6: Development Tips ---- */}
      <motion.div
        custom={7}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
          Development Tips
        </h2>

        {/* Weakest attribute */}
        <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
              Weakest Area
            </span>
          </div>
          <p className="text-[11px] text-[#c9d1d9]">
            Focus on:{' '}
            <span className="font-semibold text-rose-400">
              {formatAttrName(weakest.name)}
            </span>
          </p>
          <p className="text-[9px] text-[#8b949e] mt-0.5">
            Current: {weakest.value} — Potential gain: +3 with dedicated
            training
          </p>
        </div>

        {/* Personalized tips based on age and attributes */}
        <div className="space-y-2">
          <TipCard
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            title="Training Focus"
            description={
              age <= 20
                ? `Prioritize ${formatAttrName(weakest.name)} and technical attributes to accelerate growth.`
                : age <= 28
                  ? `Balance physical maintenance with ${formatAttrName(weakest.name)} refinement.`
                  : `Focus on game intelligence and maintaining key attributes.`
            }
          />
          <TipCard
            icon={<Zap className="h-3.5 w-3.5 text-amber-400" />}
            title="Season Goal"
            description={
              pot - ovr > 10
                ? `Close the ${pot - ovr}-point gap to your potential this season.`
                : pot - ovr > 5
                  ? `Push to reach your ${pot} potential — you're getting close!`
                  : `Maintain your current level and avoid injuries.`
            }
          />
          <TipCard
            icon={<Star className="h-3.5 w-3.5 text-[#60A5FA]" />}
            title="Match Strategy"
            description={
              player.form >= 7
                ? 'Great form! Push for consistent high ratings to boost reputation.'
                : player.form >= 6
                  ? 'Decent form — focus on match ratings to unlock international recognition.'
                  : 'Work on training intensity and recovery to improve your match performances.'
            }
          />
        </div>
      </motion.div>

      {/* ---- Footer note ---- */}
      <motion.div
        custom={8}
        initial="hidden"
        animate="visible"
        variants={fadeVariant}
        className="text-center pt-2 pb-4"
      >
        <p className="text-[9px] text-[#484f58]">
          Predictions are based on current trajectory and can change based on
          training, form, and match performance.
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StatBlock({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-[#484f58] uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-bold ${
          valueColor || 'text-[#c9d1d9]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TipCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-semibold text-[#c9d1d9]">
          {title}
        </span>
        <p className="text-[9px] text-[#8b949e] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
