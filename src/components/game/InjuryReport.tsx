'use client';

import { useGameStore } from '@/store/gameStore';
import { Injury, InjuryType, InjuryCategory } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity, Heart, AlertTriangle, Clock, Calendar,
  Shield, Zap, Bone, Brain, Thermometer,
  TrendingUp, History, ArrowRight, Stethoscope,
  Dumbbell, BedDouble, Users, FileBarChart, CheckCircle2,
  Info, AlertOctagon, Timer, BarChart3, Scissors, Leaf,
} from 'lucide-react';

// ============================================================
// Animation variants (opacity only)
// ============================================================
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerChild = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// ============================================================
// Severity & Category config
// ============================================================
const severityConfig: Record<InjuryType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  minor: {
    label: 'Minor',
    color: '#f59e0b',
    bg: '#f59e0b15',
    border: 'border-amber-500/30',
    icon: <Zap className="h-4 w-4" />,
  },
  moderate: {
    label: 'Moderate',
    color: '#f97316',
    bg: '#f9731615',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  severe: {
    label: 'Severe',
    color: '#ef4444',
    bg: '#ef444415',
    border: 'border-red-500/30',
    icon: <Shield className="h-4 w-4" />,
  },
  career_threatening: {
    label: 'Career-Threatening',
    color: '#dc2626',
    bg: '#dc262615',
    border: 'border-red-600/40',
    icon: <AlertOctagon className="h-4 w-4" />,
  },
};

const categoryConfig: Record<InjuryCategory, { icon: React.ReactNode; color: string }> = {
  muscle: { icon: <Activity className="h-3.5 w-3.5" />, color: '#f59e0b' },
  ligament: { icon: <Bone className="h-3.5 w-3.5" />, color: '#ef4444' },
  bone: { icon: <Shield className="h-3.5 w-3.5" />, color: '#8b5cf6' },
  concussion: { icon: <Brain className="h-3.5 w-3.5" />, color: '#06b6d4' },
  illness: { icon: <Thermometer className="h-3.5 w-3.5" />, color: '#ec4899' },
};

// Injury descriptions
const injuryDescriptions: Record<string, string> = {
  'Hamstring Strain': 'Tear in the hamstring muscles at the back of the thigh. Common in sprinting and sudden acceleration.',
  'Calf Pull': 'Strain to the calf muscle group. Often occurs during explosive movements.',
  'Groin Pull': 'Strain to the adductor muscles on the inner thigh. Common when changing direction sharply.',
  'Thigh Strain': 'Muscle fibre damage in the quadriceps. Typically caused by overstretching or overload.',
  'Back Spasm': 'Sudden involuntary contraction of back muscles. Can be triggered by poor posture or fatigue.',
  'ACL Tear': 'Tear to the anterior cruciate ligament in the knee. Often requires surgery and long rehabilitation.',
  'MCL Sprain': 'Sprain to the medial collateral ligament on the inner knee. Recovery varies by grade.',
  'Ankle Ligament': 'Damage to the ligaments surrounding the ankle joint. Common from tackles or awkward landings.',
  'Knee Cartilage': 'Damage to the meniscus cartilage in the knee. May require arthroscopic surgery.',
  'Shoulder Dislocation': 'The shoulder ball pops out of its socket. Risk of recurrent dislocations.',
  'Fractured Metatarsal': 'Break in one of the long foot bones. Common from impact or stress.',
  'Broken Rib': 'Fracture of one or more ribs. Painful but usually heals with rest.',
  'Hairline Fracture': 'Small crack in a bone, often from repetitive stress. Requires rest to heal.',
  'Stress Fracture': 'Tiny crack from repeated impact. Common in lower limbs of athletes.',
  'Mild Concussion': 'Temporary disruption of brain function after head impact. Requires careful monitoring.',
  'Head Injury': 'Impact to the head causing bruising or cuts. Requires neurological assessment.',
  'Viral Infection': 'Viral illness causing fatigue, fever, and body aches. Rest and hydration recommended.',
  'Flu': 'Influenza infection with fever, muscle aches, and respiratory symptoms.',
  'Food Poisoning': 'Illness from contaminated food causing nausea, vomiting, and dehydration.',
};

// ============================================================
// Main Component
// ============================================================
export default function InjuryReport() {
  const gameState = useGameStore(state => state.gameState);

  if (!gameState) return null;

  const { player, currentInjury, injuries, currentSeason, currentWeek, currentClub, recentResults, trainingHistory } = gameState;

  const seasonInjuries = injuries.filter(i => i.seasonSustained === currentSeason);
  const careerInjuries = injuries;
  const totalMatchesMissed = careerInjuries.reduce((sum, i) => sum + i.weeksOut, 0);

  // Fitness trend from training history (last 5 entries)
  const fitnessTrend = getFitnessTrend(trainingHistory, player.fitness);
  const riskLevel = calculateRiskLevel(player, currentInjury, recentResults);
  const consecutiveMatches = getConsecutiveMatches(recentResults);
  const preventionTips = getPreventionTips(player, consecutiveMatches, currentInjury);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-3">
      {/* Header */}
      <motion.div className="flex items-center gap-2" {...fadeIn}>
        <Activity className="h-5 w-5 text-red-400" />
        <h2 className="text-lg font-bold text-[#c9d1d9]">Injury Report</h2>
        <span className="text-xs text-[#484f58] ml-auto">S{currentSeason} W{currentWeek}</span>
      </motion.div>

      {/* Current Injury Card */}
      <AnimatePresence mode="wait">
        {currentInjury ? (
          <motion.div key="active-injury" {...fadeIn}>
            <ActiveInjuryCard injury={currentInjury} currentWeek={currentWeek} currentSeason={currentSeason} />
          </motion.div>
        ) : (
          <motion.div key="fit-status" {...fadeIn}>
            <Card className="bg-[#161b22] border-emerald-700/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Fully Fit</p>
                    <p className="text-xs text-[#8b949e]">No active injuries. Ready to play.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fitness Monitoring Panel */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.05 }}>
        <FitnessPanel
          fitness={player.fitness}
          fitnessTrend={fitnessTrend}
          riskLevel={riskLevel}
          isInjured={!!currentInjury}
        />
      </motion.div>

      {/* Injury Prevention Tips */}
      {preventionTips.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.1 }}>
          <PreventionTips tips={preventionTips} />
        </motion.div>
      )}

      {/* Medical Staff & Treatment */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.15 }}>
        <MedicalStaffPanel
          facilities={currentClub.facilities}
          tier={currentClub.tier}
          isInjured={!!currentInjury}
          fitness={player.fitness}
        />
      </motion.div>

      {/* Season Stats */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.2 }}>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Season Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Injuries" value={seasonInjuries.length.toString()} color="#ef4444" />
              <StatBox label="Weeks Out" value={seasonInjuries.reduce((s, i) => s + i.weeksOut, 0).toString()} color="#f59e0b" />
              <StatBox label="Common" value={getMostCommonCategory(seasonInjuries)} color="#8b5cf6" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Injury Statistics */}
      {careerInjuries.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.25 }}>
          <InjuryStatistics
            injuries={careerInjuries}
            totalDaysOut={totalMatchesMissed * 7}
          />
        </motion.div>
      )}

      {/* Injury History Timeline */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.3 }}>
        <InjuryHistoryTimeline
          seasonInjuries={seasonInjuries}
          careerInjuries={careerInjuries}
          currentSeason={currentSeason}
        />
      </motion.div>

      {/* Empty state */}
      {careerInjuries.length === 0 && !currentInjury && (
        <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.3 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
              <p className="text-sm text-[#8b949e]">No injuries recorded</p>
              <p className="text-xs text-[#484f58] mt-1">Stay fit and avoid high-intensity training when fatigued</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Active Injury Card
// ============================================================
function ActiveInjuryCard({ injury, currentWeek, currentSeason }: { injury: Injury; currentWeek: number; currentSeason: number }) {
  const config = severityConfig[injury.type];
  const catConfig = categoryConfig[injury.category];
  const progress = injury.weeksOut > 0 ? ((injury.weeksOut - injury.weeksRemaining) / injury.weeksOut) * 100 : 0;
  const weeksHealed = injury.weeksOut - injury.weeksRemaining;
  const returnWeek = currentWeek + injury.weeksRemaining;
  const returnSeason = returnWeek > 38 ? currentSeason + 1 : currentSeason;
  const displayReturnWeek = returnWeek > 38 ? returnWeek - 38 : returnWeek;
  const description = injuryDescriptions[injury.name] || 'An injury requiring medical attention and rehabilitation.';

  return (
    <Card className={`bg-[#161b22] ${config.border} border`}>
      <CardContent className="p-4 space-y-3">
        {/* Severity header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: config.color }}>
                {injury.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center gap-1 h-4 px-1.5 text-[9px] rounded font-medium"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                {config.label}
              </span>
              <div className="flex items-center gap-0.5" style={{ color: catConfig.color }}>
                {catConfig.icon}
                <span className="text-[10px] capitalize">{injury.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-[#8b949e] leading-relaxed">
          {description}
        </p>

        {/* Recovery progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Recovery Progress</span>
            <span className="text-xs font-medium" style={{ color: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              style={{ backgroundColor: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#484f58]">{weeksHealed} of {injury.weeksOut} weeks</span>
            <span className="text-[#8b949e]">
              {injury.weeksRemaining <= 0 ? (
                <span className="text-emerald-400">Ready to return</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {injury.weeksRemaining} week{injury.weeksRemaining !== 1 ? 's' : ''} remaining
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Expected return date */}
        {injury.weeksRemaining > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[#8b949e]">Expected return:</span>
            <span className="text-[#c9d1d9] font-medium">Season {returnSeason}, Week {displayReturnWeek}</span>
          </div>
        )}

        {/* Impact info */}
        <div className="pt-3 border-t border-[#30363d] flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-[#8b949e]">Cannot play matches</span>
          </div>
          {injury.weeksRemaining > 2 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-[#8b949e]">Training limited</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Fitness Monitoring Panel
// ============================================================
function FitnessPanel({ fitness, fitnessTrend, riskLevel, isInjured }: {
  fitness: number;
  fitnessTrend: number[];
  riskLevel: { level: string; color: string };
  isInjured: boolean;
}) {
  const fitnessColor = fitness >= 75 ? '#10b981' : fitness >= 50 ? '#f59e0b' : '#ef4444';
  const maxTrend = Math.max(...fitnessTrend, 1);

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Fitness Monitor</span>
        </div>

        {/* Current fitness bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#c9d1d9]">Current Fitness</span>
            <span className="text-sm font-bold" style={{ color: fitnessColor }}>{fitness}%</span>
          </div>
          <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${fitness}%` }}
              transition={{ duration: 0.5 }}
              style={{ backgroundColor: fitnessColor }}
            />
          </div>
        </div>

        {/* Fitness trend mini chart */}
        <div>
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide">Last 5 Weeks</span>
          <div className="flex items-end gap-1 mt-1.5 h-10">
            {fitnessTrend.map((val, idx) => {
              const h = Math.max((val / 100) * 40, 4);
              const c = val >= 75 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <motion.div
                  key={idx}
                  className="flex-1 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.05 }}
                  style={{ height: h, backgroundColor: c, minWidth: 0 }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-[#484f58] mt-0.5">
            <span>5wk</span>
            <span>Now</span>
          </div>
        </div>

        {/* Risk assessment */}
        <div className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: `${riskLevel.color}10` }}>
          <div className="flex items-center gap-1.5">
            {isInjured ? (
              <AlertOctagon className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
            ) : riskLevel.level === 'High' ? (
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: riskLevel.color }} />
            ) : (
              <Shield className="h-3.5 w-3.5" style={{ color: riskLevel.color }} />
            )}
            <span className="text-[11px] text-[#8b949e]">
              {isInjured ? 'Currently Injured' : 'Injury Risk'}
            </span>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: riskLevel.color }}>
            {isInjured ? 'Inactive' : `${riskLevel.level} Risk`}
          </span>
        </div>

        {/* Recommended action */}
        <div className="text-[10px] text-[#484f58]">
          {isInjured
            ? 'Focus on rehabilitation. Follow medical staff guidance for recovery.'
            : fitness < 40
              ? 'Urgent rest needed. Skip training sessions until fitness recovers.'
              : fitness < 60
                ? 'Consider light training only. Avoid high-intensity sessions.'
                : fitness < 80
                  ? 'Moderate training recommended. Monitor fatigue levels.'
                  : 'Peak condition. Full training and match participation available.'}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Injury Prevention Tips
// ============================================================
function PreventionTips({ tips }: { tips: { icon: React.ReactNode; title: string; description: string; color: string }[] }) {
  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Prevention Tips</span>
        </div>
        {tips.map((tip, idx) => (
          <motion.div
            key={idx}
            className="flex items-start gap-2.5 p-2 rounded-md"
            style={{ backgroundColor: `${tip.color}08` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: idx * 0.05 }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${tip.color}15`, color: tip.color }}
            >
              {tip.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#c9d1d9]">{tip.title}</p>
              <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{tip.description}</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Medical Staff & Treatment Panel
// ============================================================
function MedicalStaffPanel({ facilities, tier, isInjured, fitness }: {
  facilities: number;
  tier: number;
  isInjured: boolean;
  fitness: number;
}) {
  // Physio rating derived from club facilities and tier
  const physioRating = Math.min(100, Math.round(facilities * 0.6 + (6 - tier) * 8));
  const physioStars = physioRating >= 85 ? 5 : physioRating >= 70 ? 4 : physioRating >= 50 ? 3 : physioRating >= 30 ? 2 : 1;

  const treatments = [
    {
      id: 'rest',
      label: 'Rest',
      icon: <BedDouble className="h-4 w-4" />,
      description: 'Complete rest to allow natural healing',
      recoveryBonus: '+10% recovery',
      cost: 'Free',
      color: '#10b981',
      available: isInjured || fitness < 50,
    },
    {
      id: 'light_training',
      label: 'Light Training',
      icon: <Dumbbell className="h-4 w-4" />,
      description: 'Gentle exercises to maintain fitness',
      recoveryBonus: '+15% recovery',
      cost: 'Free',
      color: '#3b82f6',
      available: !isInjured && fitness < 80,
    },
    {
      id: 'physio',
      label: 'Physiotherapy',
      icon: <Stethoscope className="h-4 w-4" />,
      description: 'Professional treatment session',
      recoveryBonus: `+${20 + Math.round(physioRating / 10)}% recovery`,
      cost: `${Math.round(physioRating * 50)}$/wk`,
      color: '#8b5cf6',
      available: isInjured || fitness < 70,
    },
  ];

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Medical Staff</span>
        </div>

        {/* Physio rating */}
        <div className="flex items-center justify-between p-2 rounded-md bg-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#8b5cf615] flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#c9d1d9]">Physio Rating</p>
              <p className="text-[10px] text-[#484f58]">Based on club facilities</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="w-3 h-3"
                  fill={i < physioStars ? '#f59e0b' : '#21262d'}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-[#8b949e]">{physioRating}/100</span>
          </div>
        </div>

        {/* Treatment options */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide">Treatment Options</span>
          {treatments.map((treatment) => (
            <div
              key={treatment.id}
              className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d] opacity-100"
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${treatment.color}15`, color: treatment.color }}
              >
                {treatment.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[#c9d1d9]">{treatment.label}</span>
                  <span className="text-[9px] px-1 rounded" style={{ backgroundColor: `${treatment.color}15`, color: treatment.color }}>
                    {treatment.recoveryBonus}
                  </span>
                </div>
                <p className="text-[10px] text-[#484f58]">{treatment.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#8b949e]">{treatment.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Injury Statistics
// ============================================================
function InjuryStatistics({ injuries, totalDaysOut }: {
  injuries: Injury[];
  totalDaysOut: number;
}) {
  const totalInjuries = injuries.length;
  const avgRecovery = totalInjuries > 0 ? Math.round(injuries.reduce((s, i) => s + i.weeksOut, 0) / totalInjuries) : 0;
  const mostCommon = getMostCommonCategoryFull(injuries);
  const susceptibility = totalInjuries >= 8 ? 'Very High' : totalInjuries >= 5 ? 'High' : totalInjuries >= 3 ? 'Moderate' : totalInjuries >= 1 ? 'Low' : 'Minimal';
  const susceptibilityColor = totalInjuries >= 8 ? '#dc2626' : totalInjuries >= 5 ? '#ef4444' : totalInjuries >= 3 ? '#f59e0b' : '#10b981';

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Career Statistics</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Injuries" value={totalInjuries.toString()} color="#ef4444" />
          <StatBox label="Days Injured" value={totalDaysOut.toString()} color="#f59e0b" />
          <StatBox label="Avg Recovery" value={`${avgRecovery} wk`} color="#3b82f6" />
          <StatBox label="Most Common" value={mostCommon} color="#8b5cf6" />
        </div>

        {/* Susceptibility rating */}
        <div className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: `${susceptibilityColor}10` }}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: susceptibilityColor }} />
            <span className="text-[11px] text-[#8b949e]">Susceptibility</span>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: susceptibilityColor }}>
            {susceptibility}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Injury History Timeline
// ============================================================
function InjuryHistoryTimeline({ seasonInjuries, careerInjuries, currentSeason }: {
  seasonInjuries: Injury[];
  careerInjuries: Injury[];
  currentSeason: number;
}) {
  if (seasonInjuries.length === 0 && careerInjuries.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Season History */}
      {seasonInjuries.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
                Season {currentSeason} History
              </span>
              <span className="text-[10px] text-[#484f58] ml-auto">{seasonInjuries.length} record{seasonInjuries.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {seasonInjuries.slice().reverse().map((injury, idx) => (
                <motion.div
                  key={injury.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                >
                  {/* Category icon */}
                  <div
                    className="p-1.5 rounded-md shrink-0"
                    style={{
                      backgroundColor: `${categoryConfig[injury.category].color}15`,
                      color: categoryConfig[injury.category].color,
                    }}
                  >
                    {categoryConfig[injury.category].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-[#c9d1d9]">{injury.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="inline-block h-3.5 px-1 text-[8px] rounded leading-[14px]"
                        style={{
                          backgroundColor: `${severityConfig[injury.type].color}15`,
                          color: severityConfig[injury.type].color,
                        }}
                      >
                        {severityConfig[injury.type].label}
                      </span>
                      <span className="text-[10px] text-[#484f58]">{injury.weeksOut}wk total</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#484f58]">W{injury.weekSustained}</span>
                    {injury.weeksRemaining <= 0 && (
                      <div className="flex items-center gap-0.5 justify-end">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-[9px] text-emerald-400">Healed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career History */}
      {careerInjuries.length > seasonInjuries.length && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Career History</span>
              <span className="text-[10px] text-[#484f58] ml-auto">{careerInjuries.length - seasonInjuries.length} past</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {careerInjuries
                .filter(i => i.seasonSustained !== currentSeason)
                .slice()
                .reverse()
                .map((injury) => (
                  <div
                    key={injury.id}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                  >
                    <div
                      className="p-1.5 rounded-md shrink-0"
                      style={{
                        backgroundColor: `${categoryConfig[injury.category].color}10`,
                        color: `${categoryConfig[injury.category].color}90`,
                      }}
                    >
                      {categoryConfig[injury.category].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[#8b949e]">{injury.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#484f58]">
                          {severityConfig[injury.type].label} &middot; {injury.weeksOut}wk
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#484f58] shrink-0">
                      S{injury.seasonSustained} W{injury.weekSustained}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Stat Box
// ============================================================
function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-[#21262d]">
      <p className="text-base font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#484f58] mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function getMostCommonCategory(injuries: Injury[]): string {
  if (injuries.length === 0) return '—';
  const counts: Record<string, number> = {};
  for (const i of injuries) {
    counts[i.category] = (counts[i.category] ?? 0) + 1;
  }
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return max ? max[0].charAt(0).toUpperCase() + max[0].slice(1) : '—';
}

function getMostCommonCategoryFull(injuries: Injury[]): string {
  if (injuries.length === 0) return '—';
  const counts: Record<string, number> = {};
  for (const i of injuries) {
    const key = i.name;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!max) return '—';
  // Shorten name if too long
  const name = max[0];
  return name.length > 14 ? name.slice(0, 12) + '...' : name;
}

function getFitnessTrend(trainingHistory: { intensity: number; completedAt: number }[], currentFitness: number): number[] {
  // Build a synthetic 5-week trend: start from a baseline, trend toward current
  // In a real system, historical fitness snapshots would be stored
  const recent = trainingHistory.slice(-10);
  const base = Math.max(30, currentFitness - 15);
  const trend: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (i === 4) {
      trend.push(currentFitness);
    } else {
      // Simulate gradual approach with small noise
      const progress = (i + 1) / 5;
      const val = base + (currentFitness - base) * progress + (Math.sin(i * 2.1) * 5);
      trend.push(Math.round(Math.min(100, Math.max(10, val))));
    }
  }

  return trend;
}

function calculateRiskLevel(player: { fitness: number; age: number }, currentInjury: Injury | null, recentResults: { playerMinutesPlayed: number }[]): { level: string; color: string } {
  if (currentInjury) return { level: 'N/A', color: '#6b7280' };

  let risk = 0;
  if (player.fitness < 30) risk += 3;
  else if (player.fitness < 50) risk += 2;
  else if (player.fitness < 70) risk += 1;

  if (player.age > 33) risk += 2;
  else if (player.age > 30) risk += 1;

  // Recent heavy minutes
  const heavyGames = recentResults.slice(0, 3).filter(r => r.playerMinutesPlayed > 70).length;
  if (heavyGames >= 3) risk += 2;
  else if (heavyGames >= 2) risk += 1;

  if (risk >= 5) return { level: 'High', color: '#ef4444' };
  if (risk >= 3) return { level: 'Medium', color: '#f59e0b' };
  return { level: 'Low', color: '#10b981' };
}

function getConsecutiveMatches(recentResults: { playerMinutesPlayed: number }[]): number {
  let count = 0;
  for (const r of recentResults) {
    if (r.playerMinutesPlayed > 45) count++;
    else break;
  }
  return count;
}

function getPreventionTips(
  player: { fitness: number; age: number },
  consecutiveMatches: number,
  currentInjury: Injury | null
): { icon: React.ReactNode; title: string; description: string; color: string }[] {
  const tips: { icon: React.ReactNode; title: string; description: string; color: string }[] = [];

  if (currentInjury) {
    tips.push({
      icon: <Stethoscope className="h-4 w-4" />,
      title: 'Follow Rehab Protocol',
      description: 'Complete all prescribed rehabilitation exercises. Do not rush your return.',
      color: '#8b5cf6',
    });
    return tips;
  }

  if (player.fitness < 40) {
    tips.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      title: 'Reduce Training Intensity',
      description: 'Your fitness is critically low. Prioritise recovery over training to avoid serious injury.',
      color: '#ef4444',
    });
  } else if (player.fitness < 60) {
    tips.push({
      icon: <Dumbbell className="h-4 w-4" />,
      title: 'Moderate Training Only',
      description: 'Low fitness increases injury risk. Stick to light sessions until fitness recovers above 60%.',
      color: '#f59e0b',
    });
  }

  if (player.age > 30) {
    tips.push({
      icon: <Timer className="h-4 w-4" />,
      title: 'Extra Recovery Time',
      description: 'Players over 30 need more recovery between matches. Consider rotation to stay fresh.',
      color: '#06b6d4',
    });
  }

  if (consecutiveMatches >= 3) {
    tips.push({
      icon: <Users className="h-4 w-4" />,
      title: 'Consider Rotation',
      description: `You've played ${consecutiveMatches} consecutive matches. A rest day could prevent muscle fatigue.`,
      color: '#f97316',
    });
  }

  if (player.fitness >= 70 && player.age <= 28 && consecutiveMatches < 2) {
    tips.push({
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: 'Conditioning Looks Good',
      description: 'Your fitness levels are healthy. Keep up your current training regimen.',
      color: '#10b981',
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: <Leaf className="h-4 w-4" />,
      title: 'Maintain Good Habits',
      description: 'Stay hydrated, warm up properly, and listen to your body for any warning signs.',
      color: '#6b7280',
    });
  }

  return tips.slice(0, 3);
}
