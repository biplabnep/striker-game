'use client';

import { useState } from 'react';
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
// Animation variants (opacity only per Uncodixify directive)
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
  concussion: {
    label: 'Concussion',
    color: '#a855f7',
    bg: '#a855f715',
    border: 'border-purple-500/30',
    icon: <Brain className="h-4 w-4" />,
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
// Body region mapping for SVG silhouette
// ============================================================
const bodyRegionPositions: Record<string, { x: number; y: number; label: string }> = {
  head: { x: 50, y: 6, label: 'Head' },
  shoulder_left: { x: 17, y: 52, label: 'L. Shoulder' },
  shoulder_right: { x: 83, y: 52, label: 'R. Shoulder' },
  back: { x: 50, y: 68, label: 'Back / Torso' },
  groin: { x: 50, y: 97, label: 'Groin' },
  hamstring_left: { x: 37, y: 122, label: 'L. Hamstring' },
  hamstring_right: { x: 63, y: 122, label: 'R. Hamstring' },
  knee_left: { x: 37, y: 150, label: 'L. Knee' },
  knee_right: { x: 63, y: 150, label: 'R. Knee' },
  ankle_left: { x: 37, y: 180, label: 'L. Ankle' },
  ankle_right: { x: 63, y: 180, label: 'R. Ankle' },
  foot: { x: 50, y: 194, label: 'Foot' },
  general: { x: 50, y: 55, label: 'General' },
};

function getBodyRegion(injuryName: string): string {
  const n = injuryName.toLowerCase();
  if (n.includes('head') || n.includes('concussion')) return 'head';
  if (n.includes('shoulder')) return 'shoulder_left';
  if (n.includes('back') || n.includes('spasm') || n.includes('rib')) return 'back';
  if (n.includes('groin')) return 'groin';
  if (n.includes('hamstring')) return 'hamstring_left';
  if (n.includes('thigh')) return 'hamstring_right';
  if (n.includes('calf')) return 'ankle_left';
  if (n.includes('knee') || n.includes('acl') || n.includes('mcl') || n.includes('cartilage')) return 'knee_left';
  if (n.includes('ankle')) return 'ankle_left';
  if (n.includes('metatarsal')) return 'foot';
  if (n.includes('fracture') || n.includes('stress')) return 'knee_right';
  if (n.includes('viral') || n.includes('flu') || n.includes('food') || n.includes('illness')) return 'general';
  return 'general';
}

// ============================================================
// Risk segments config
// ============================================================
const riskSegments = [
  { label: 'Low', color: '#10b981' },
  { label: 'Medium', color: '#f59e0b' },
  { label: 'High', color: '#ef4444' },
  { label: 'Critical', color: '#dc2626' },
];

// ============================================================
// Medical staff data
// ============================================================
interface StaffMember {
  name: string;
  role: string;
  icon: React.ReactNode;
  quality: number;
  color: string;
}

function generateMedicalStaff(facilities: number, tier: number): StaffMember[] {
  const base = Math.min(95, Math.round(facilities * 0.65 + (6 - tier) * 7));
  return [
    { name: 'Dr. James Sullivan', role: 'Head Physician', icon: <Stethoscope className="h-3.5 w-3.5" />, quality: Math.min(99, base + 5), color: '#8b5cf6' },
    { name: 'Sarah Chen', role: 'Lead Physio', icon: <Activity className="h-3.5 w-3.5" />, quality: Math.min(99, base), color: '#10b981' },
    { name: 'Marcus Williams', role: 'Therapist', icon: <Dumbbell className="h-3.5 w-3.5" />, quality: Math.max(25, base - 8), color: '#f59e0b' },
    { name: 'Dr. Elena Petrova', role: 'Sport Scientist', icon: <FileBarChart className="h-3.5 w-3.5" />, quality: Math.max(25, base - 3), color: '#06b6d4' },
  ];
}

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

  const fitnessTrend = getFitnessTrend(trainingHistory, player.fitness);
  const consecutiveMatches = getConsecutiveMatches(recentResults);
  const riskLevel = calculateRiskLevel(player, currentInjury, recentResults, consecutiveMatches);
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

      {/* Body Silhouette Diagram */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.04 }}>
        <BodySilhouetteDiagram
          careerInjuries={careerInjuries}
          currentInjury={currentInjury}
        />
      </motion.div>

      {/* Fitness Monitoring Panel */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.08 }}>
        <FitnessPanel
          fitness={player.fitness}
          fitnessTrend={fitnessTrend}
          riskLevel={riskLevel}
          isInjured={!!currentInjury}
        />
      </motion.div>

      {/* Injury Prevention Tips */}
      {preventionTips.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.12 }}>
          <PreventionTips tips={preventionTips} />
        </motion.div>
      )}

      {/* Medical Staff & Treatment */}
      <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.16 }}>
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
// 1. Body Silhouette Diagram
// ============================================================
interface BodyMarker {
  region: string;
  x: number;
  y: number;
  label: string;
  injuries: Injury[];
  hasActive: boolean;
  color: string;
}

function BodySilhouetteDiagram({ careerInjuries, currentInjury }: {
  careerInjuries: Injury[];
  currentInjury: Injury | null;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Group injuries by body region
  const regionMap: Record<string, Injury[]> = {};
  const allInjuries = currentInjury
    ? [currentInjury, ...careerInjuries.filter(i => i.id !== currentInjury.id)]
    : careerInjuries;

  for (const injury of allInjuries) {
    const region = getBodyRegion(injury.name);
    if (!regionMap[region]) regionMap[region] = [];
    // Avoid duplicate entries
    if (!regionMap[region].find(i => i.id === injury.id)) {
      regionMap[region].push(injury);
    }
  }

  const markers: BodyMarker[] = Object.entries(regionMap).map(([region, injuries]) => {
    const pos = bodyRegionPositions[region] || bodyRegionPositions.general;
    const activeInRegion = injuries.find(i => currentInjury && i.id === currentInjury.id);
    const sevColor = activeInRegion
      ? severityConfig[activeInRegion.type].color
      : severityConfig[injuries[0].type].color;
    return {
      region,
      x: pos.x,
      y: pos.y,
      label: pos.label,
      injuries,
      hasActive: !!activeInRegion,
      color: sevColor,
    };
  });

  const selectedMarker = markers.find(m => m.region === selectedRegion);

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Body Map</span>
          {markers.length > 0 && (
            <span className="text-[10px] text-[#484f58] ml-auto">{markers.length} region{markers.length !== 1 ? 's' : ''} affected</span>
          )}
        </div>

        <div className="flex justify-center">
          <svg
            viewBox="0 0 100 200"
            className="w-32 h-auto"
            style={{ filter: 'drop-shadow(0 0 0 transparent)' }}
          >
            {/* Body outline — simple front-facing silhouette */}
            {/* Head */}
            <circle cx="50" cy="18" r="14" fill="none" stroke="#30363d" strokeWidth="1.5" />
            {/* Neck */}
            <line x1="50" y1="32" x2="50" y2="40" stroke="#30363d" strokeWidth="1.5" />
            {/* Torso */}
            <rect x="30" y="40" width="40" height="58" rx="4" fill="none" stroke="#30363d" strokeWidth="1.5" />
            {/* Left arm */}
            <rect x="14" y="42" width="14" height="44" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
            {/* Right arm */}
            <rect x="72" y="42" width="14" height="44" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
            {/* Left leg */}
            <rect x="32" y="98" width="16" height="92" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
            {/* Right leg */}
            <rect x="52" y="98" width="16" height="92" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />

            {/* Injury markers */}
            {markers.map((marker) => (
              <g key={marker.region}>
                {/* Active injury outer ring pulse */}
                {marker.hasActive && (
                  <motion.circle
                    cx={marker.x}
                    cy={marker.y}
                    r="9"
                    fill="none"
                    stroke={marker.color}
                    strokeWidth="1.5"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {/* Marker dot */}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={marker.hasActive ? 6 : 5}
                  fill={marker.color}
                  fillOpacity={marker.hasActive ? 1 : 0.45}
                  stroke="#0d1117"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => setSelectedRegion(selectedRegion === marker.region ? null : marker.region)}
                >
                  <title>{marker.injuries.map(i => `${i.name} (${i.weeksRemaining > 0 ? 'Active' : 'Healed'})`).join('\n')}</title>
                </circle>
                {/* Count badge if multiple injuries */}
                {marker.injuries.length > 1 && (
                  <circle
                    cx={marker.x + 5}
                    cy={marker.y - 5}
                    r="5"
                    fill="#1c2333"
                    stroke="#30363d"
                    strokeWidth="1"
                  />
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Selected marker detail */}
        <AnimatePresence mode="wait">
          {selectedMarker && (
            <motion.div
              key={selectedMarker.region}
              {...fadeIn}
              className="p-2.5 rounded-lg border border-[#30363d] bg-[#1c2333] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#c9d1d9]">{selectedMarker.label}</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: `${selectedMarker.color}15`, color: selectedMarker.color }}
                >
                  {selectedMarker.injuries.length} injur{selectedMarker.injuries.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              {selectedMarker.injuries.map((inj) => {
                const sev = severityConfig[inj.type];
                const isActive = currentInjury && inj.id === currentInjury.id;
                return (
                  <div key={inj.id} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-sm shrink-0"
                      style={{ backgroundColor: sev.color, opacity: isActive ? 1 : 0.5 }}
                    />
                    <span className="text-[11px] text-[#c9d1d9] flex-1 truncate">{inj.name}</span>
                    {isActive ? (
                      <span className="text-[9px] text-[#ef4444]">Active</span>
                    ) : (
                      <span className="text-[9px] text-emerald-400">Healed</span>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {markers.length > 0 && (
          <div className="flex items-center gap-3 justify-center pt-1">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-[9px] text-[#484f58]">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ef4444', opacity: 0.4 }} />
              <span className="text-[9px] text-[#484f58]">Healed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 2. Active Injury Card with Recovery Progress Ring
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

        {/* Recovery Progress Ring */}
        <div className="flex items-center gap-4">
          <RecoveryProgressRing progress={progress} color={
            progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color
          } />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b949e]">Recovery</span>
              <span className="text-sm font-bold" style={{ color: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color,
                }}
              />
            </div>
            <div className="text-[10px] text-[#484f58]">
              {weeksHealed} of {injury.weeksOut} weeks
              {injury.weeksRemaining > 0 && (
                <span className="text-[#8b949e]"> &middot; {injury.weeksRemaining} remaining</span>
              )}
            </div>
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

        {/* Ready to return */}
        {injury.weeksRemaining <= 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">Ready to return to action</span>
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
// 2a. Recovery Progress Ring (SVG circular progress)
// ============================================================
function RecoveryProgressRing({ progress, color }: { progress: number; color: string }) {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="shrink-0 relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ strokeDashoffset: offset, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-sm font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
}

// ============================================================
// 3. Fitness Monitoring Panel (with SVG Sparkline + Risk Bar)
// ============================================================
function FitnessPanel({ fitness, fitnessTrend, riskLevel, isInjured }: {
  fitness: number;
  fitnessTrend: number[];
  riskLevel: { level: string; color: string; index: number };
  isInjured: boolean;
}) {
  const fitnessColor = fitness >= 75 ? '#10b981' : fitness >= 50 ? '#f59e0b' : '#ef4444';

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
            <div
              className="h-full rounded-md transition-all duration-700"
              style={{ width: `${fitness}%`, backgroundColor: fitnessColor }}
            />
          </div>
        </div>

        {/* Fitness trend SVG sparkline */}
        <FitnessSparkline fitnessTrend={fitnessTrend} />

        {/* Risk Assessment Segmented Bar */}
        <RiskSegmentedBar riskLevel={riskLevel} isInjured={isInjured} />

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
// 3a. Fitness Trend SVG Sparkline
// ============================================================
function FitnessSparkline({ fitnessTrend }: { fitnessTrend: number[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const svgW = 220;
  const svgH = 56;
  const padX = 10;
  const padY = 8;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;

  const points = fitnessTrend.map((val, i) => ({
    x: padX + (i / (fitnessTrend.length - 1)) * chartW,
    y: padY + chartH - (val / 100) * chartH,
    val,
  }));

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = `0,${svgH} ${linePoints} ${svgW},${svgH}`;

  return (
    <div>
      <span className="text-[10px] text-[#484f58] uppercase tracking-wide">Last 5 Weeks</span>
      <div className="mt-1.5">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {/* Filled area under line */}
          <polygon
            points={fillPoints}
            fill="#10b981"
            fillOpacity="0.08"
          />
          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Data points */}
          {points.map((p, i) => {
            const c = p.val >= 75 ? '#10b981' : p.val >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === i ? 5 : 3}
                  fill={c}
                  stroke="#161b22"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />
                {/* Hover label */}
                {hoveredIdx === i && (
                  <g>
                    <rect
                      x={p.x - 14}
                      y={p.y - 20}
                      width="28"
                      height="14"
                      rx="3"
                      fill="#1c2333"
                      stroke="#30363d"
                      strokeWidth="0.5"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill={c}
                      fontSize="8"
                      fontWeight="bold"
                    >
                      {p.val}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[8px] text-[#484f58] mt-0.5">
        <span>5wk ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

// ============================================================
// 5. Risk Assessment Segmented Bar
// ============================================================
function RiskSegmentedBar({ riskLevel, isInjured }: {
  riskLevel: { level: string; color: string; index: number };
  isInjured: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] text-[#484f58] uppercase tracking-wide">Injury Risk</span>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 flex rounded-md overflow-hidden h-6">
          {riskSegments.map((seg, i) => {
            const isActive = !isInjured && i === riskLevel.index;
            return (
              <motion.div
                key={seg.label}
                className="flex-1 flex items-center justify-center relative"
                animate={{
                  opacity: isActive ? [0.6, 1, 0.6] : 0.15,
                }}
                transition={isActive
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
                }
                style={{ backgroundColor: seg.color }}
              >
                <span
                  className="text-[9px] font-semibold select-none"
                  style={{
                    color: isActive ? '#ffffff' : '#ffffff50',
                  }}
                >
                  {seg.label}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div
          className="shrink-0 text-[11px] font-semibold text-right min-w-[52px]"
          style={{ color: isInjured ? '#6b7280' : riskLevel.color }}
        >
          {isInjured ? 'Inactive' : riskLevel.level}
        </div>
      </div>
    </div>
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
// 6. Medical Staff & Treatment Panel (enhanced with cards)
// ============================================================
function MedicalStaffPanel({ facilities, tier, isInjured, fitness }: {
  facilities: number;
  tier: number;
  isInjured: boolean;
  fitness: number;
}) {
  const staff = generateMedicalStaff(facilities, tier);
  const physioRating = Math.min(100, Math.round(facilities * 0.6 + (6 - tier) * 8));

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
          <span className="text-[10px] text-[#484f58] ml-auto">Quality: {physioRating}/100</span>
        </div>

        {/* Staff cards grid */}
        <div className="grid grid-cols-2 gap-2">
          {staff.map((member) => (
            <motion.div
              key={member.role}
              className="p-2.5 rounded-lg bg-[#1c2333] border border-[#30363d] space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${member.color}12`, color: member.color }}
                >
                  {member.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#484f58] truncate">{member.role}</p>
                  <p className="text-[11px] font-medium text-[#c9d1d9] truncate">{member.name}</p>
                </div>
              </div>
              {/* Quality bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-[#484f58]">Quality</span>
                  <span className="text-[9px] font-medium" style={{ color: member.color }}>{member.quality}</span>
                </div>
                <div className="h-1 bg-[#0d1117] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{
                      width: `${member.quality}%`,
                      backgroundColor: member.quality >= 80 ? '#10b981' : member.quality >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Treatment options */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide">Treatment Options</span>
          {treatments.map((treatment) => (
            <div
              key={treatment.id}
              className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
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
// 4. Injury History Timeline (vertical timeline with severity coloring)
// ============================================================
function InjuryHistoryTimeline({ seasonInjuries, careerInjuries, currentSeason }: {
  seasonInjuries: Injury[];
  careerInjuries: Injury[];
  currentSeason: number;
}) {
  if (seasonInjuries.length === 0 && careerInjuries.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Season History Timeline */}
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
            <div className="max-h-72 overflow-y-auto">
              <VerticalTimeline injuries={seasonInjuries.slice().reverse()} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career History Timeline */}
      {careerInjuries.length > seasonInjuries.length && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Career History</span>
              <span className="text-[10px] text-[#484f58] ml-auto">{careerInjuries.length - seasonInjuries.length} past</span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              <VerticalTimeline
                injuries={careerInjuries.filter(i => i.seasonSustained !== currentSeason).slice().reverse()}
                dimmed
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VerticalTimeline({ injuries, dimmed }: { injuries: Injury[]; dimmed?: boolean }) {
  return (
    <div className="relative pl-5">
      {/* Continuous vertical line */}
      <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ backgroundColor: '#21262d' }} />

      {injuries.map((injury, idx) => {
        const sevConfig = severityConfig[injury.type];
        const isHealed = injury.weeksRemaining <= 0;
        const opacity = dimmed ? 0.6 : 1;

        return (
          <motion.div
            key={injury.id}
            className="relative mb-3 last:mb-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: idx * 0.03 }}
            style={{ opacity }}
          >
            {/* Severity-colored line segment */}
            <div
              className="absolute left-[4px] top-0 w-[3px] rounded-sm"
              style={{
                height: '100%',
                backgroundColor: sevConfig.color,
                opacity: 0.25,
              }}
            />

            {/* Timeline node */}
            <div
              className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-lg border-2"
              style={{
                borderColor: sevConfig.color,
                backgroundColor: '#161b22',
              }}
            />

            {/* Content card */}
            <div className="ml-3 p-2 rounded-lg bg-[#1c2333] border border-[#30363d]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${sevConfig.color}15`, color: sevConfig.color }}
                  >
                    {categoryConfig[injury.category].icon}
                  </div>
                  <span className="text-[11px] font-medium text-[#c9d1d9] truncate">{injury.name}</span>
                </div>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0"
                  style={{ backgroundColor: `${sevConfig.color}15`, color: sevConfig.color }}
                >
                  {sevConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-[#484f58]">W{injury.weekSustained}</span>
                <span className="text-[10px] text-[#484f58]">{injury.weeksOut}wk</span>
                {isHealed ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />Healed
                  </span>
                ) : (
                  <span className="text-[10px] text-[#f59e0b]">{injury.weeksRemaining}wk left</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
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
  const name = max[0];
  return name.length > 14 ? name.slice(0, 12) + '...' : name;
}

function getFitnessTrend(trainingHistory: { intensity: number; completedAt: number }[], currentFitness: number): number[] {
  const recent = trainingHistory.slice(-10);
  const base = Math.max(30, currentFitness - 15);
  const trend: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (i === 4) {
      trend.push(currentFitness);
    } else {
      const progress = (i + 1) / 5;
      const val = base + (currentFitness - base) * progress + (Math.sin(i * 2.1) * 5);
      trend.push(Math.round(Math.min(100, Math.max(10, val))));
    }
  }

  return trend;
}

function calculateRiskLevel(
  player: { fitness: number; age: number },
  currentInjury: Injury | null,
  recentResults: { playerMinutesPlayed: number }[],
  consecutiveMatches: number
): { level: string; color: string; index: number } {
  if (currentInjury) return { level: 'N/A', color: '#6b7280', index: -1 };

  let risk = 0;
  if (player.fitness < 30) risk += 3;
  else if (player.fitness < 50) risk += 2;
  else if (player.fitness < 70) risk += 1;

  if (player.age > 35) risk += 3;
  else if (player.age > 33) risk += 2;
  else if (player.age > 30) risk += 1;

  const heavyGames = recentResults.slice(0, 3).filter(r => r.playerMinutesPlayed > 70).length;
  if (heavyGames >= 3) risk += 3;
  else if (heavyGames >= 2) risk += 1;

  if (consecutiveMatches >= 5) risk += 2;
  else if (consecutiveMatches >= 3) risk += 1;

  if (risk >= 7) return { level: 'Critical', color: '#dc2626', index: 3 };
  if (risk >= 5) return { level: 'High', color: '#ef4444', index: 2 };
  if (risk >= 3) return { level: 'Medium', color: '#f59e0b', index: 1 };
  return { level: 'Low', color: '#10b981', index: 0 };
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
