'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  Activity,
  Thermometer,
  Brain,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
  AlertTriangle,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  Shield,
  Sparkles,
  Flame,
  Snowflake,
  Dumbbell,
  MessageSquare,
  Info,
  ChevronRight,
  Leaf,
  Moon,
  Sun,
  Target,
  Waves,
  Timer,
} from 'lucide-react';

// ============================================================
// Animation variants — opacity only per Uncodixify 4 Design Bans
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
// Mock Data — Current Injury
// ============================================================
interface CurrentInjury {
  name: string;
  type: 'muscle' | 'ligament' | 'bone' | 'concussion';
  severity: 'minor' | 'moderate' | 'severe';
  bodyPart: string;
  bodyRegionKey: string;
  weeksTotal: number;
  weeksRemaining: number;
  recoveryPercent: number;
  fitnessScore: number;
  staffConfidence: number;
}

const mockInjury: CurrentInjury = {
  name: 'Hamstring Strain',
  type: 'muscle',
  severity: 'moderate',
  bodyPart: 'Left Hamstring',
  bodyRegionKey: 'hamstring_left',
  weeksTotal: 5,
  weeksRemaining: 3,
  recoveryPercent: 40,
  fitnessScore: 52,
  staffConfidence: 78,
};

// ============================================================
// Mock Data — Rehab Activities
// ============================================================
interface RehabActivity {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: string;
  recoveryBoost: number;
  category: string;
  description: string;
  color: string;
}

const mockActivities: RehabActivity[] = [
  {
    id: 'physiotherapy',
    name: 'Physiotherapy Session',
    icon: <Heart className="h-5 w-5" />,
    duration: '30 min',
    recoveryBoost: 8,
    category: 'Strength Recovery',
    description: 'Guided strengthening exercises targeting the injured area under professional supervision.',
    color: '#10b981',
  },
  {
    id: 'pool_recovery',
    name: 'Pool Recovery',
    icon: <Waves className="h-5 w-5" />,
    duration: '45 min',
    recoveryBoost: 6,
    category: 'Low-Impact Conditioning',
    description: 'Aquatic therapy sessions to maintain fitness without stressing the injury.',
    color: '#3b82f6',
  },
  {
    id: 'stretching',
    name: 'Stretching Routine',
    icon: <Activity className="h-5 w-5" />,
    duration: '20 min',
    recoveryBoost: 5,
    category: 'Flexibility',
    description: 'Targeted stretches to improve range of motion and prevent scar tissue buildup.',
    color: '#f59e0b',
  },
  {
    id: 'ice_heat',
    name: 'Ice / Heat Treatment',
    icon: <Thermometer className="h-5 w-5" />,
    duration: '25 min',
    recoveryBoost: 4,
    category: 'Pain Management',
    description: 'Alternating cold and hot therapy to reduce inflammation and promote blood flow.',
    color: '#06b6d4',
  },
  {
    id: 'massage',
    name: 'Massage Therapy',
    icon: <Sparkles className="h-5 w-5" />,
    duration: '40 min',
    recoveryBoost: 7,
    category: 'Muscle Recovery',
    description: 'Deep tissue massage to release tension, improve circulation, and accelerate healing.',
    color: '#8b5cf6',
  },
  {
    id: 'mental',
    name: 'Mental Conditioning',
    icon: <Brain className="h-5 w-5" />,
    duration: '20 min',
    recoveryBoost: 3,
    category: 'Psychological Readiness',
    description: 'Visualization exercises and mental resilience training to prepare for return to play.',
    color: '#ec4899',
  },
];

// ============================================================
// Mock Data — Recovery Timeline Phases
// ============================================================
interface RecoveryPhase {
  id: string;
  name: string;
  duration: string;
  requiredActivities: string[];
  status: 'completed' | 'in_progress' | 'locked';
  description: string;
  milestone: string;
}

const mockPhases: RecoveryPhase[] = [
  {
    id: 'phase_1',
    name: 'Acute Care',
    duration: 'Week 1',
    requiredActivities: ['Ice / Heat Treatment', 'Rest & Recovery'],
    status: 'completed',
    description: 'Initial rest period with medical treatment to reduce inflammation and pain.',
    milestone: 'Pain subsided — mobility improved',
  },
  {
    id: 'phase_2',
    name: 'Rehabilitation',
    duration: 'Week 2–3',
    requiredActivities: ['Physiotherapy', 'Stretching', 'Pool Recovery'],
    status: 'in_progress',
    description: 'Progressive exercises to rebuild strength and range of motion.',
    milestone: 'Full range of motion restored',
  },
  {
    id: 'phase_3',
    name: 'Reconditioning',
    duration: 'Week 4',
    requiredActivities: ['Strength Training', 'Running Program', 'Ball Work'],
    status: 'locked',
    description: 'Return to training with gradually increasing intensity.',
    milestone: 'Fitness score above 80%',
  },
  {
    id: 'phase_4',
    name: 'Return to Play',
    duration: 'Week 5+',
    requiredActivities: ['Match Simulation', 'Tactical Work', 'Full Training'],
    status: 'locked',
    description: 'Full training participation and match readiness assessment.',
    milestone: 'Medical clearance granted',
  },
];

// ============================================================
// Mock Data — Body Condition Map
// ============================================================
interface BodyRegion {
  key: string;
  label: string;
  risk: 'none' | 'low' | 'medium' | 'high';
  injuries: string[];
  advice: string;
}

const mockBodyRegions: BodyRegion[] = [
  { key: 'head', label: 'Head', risk: 'low', injuries: [], advice: 'No recent head injuries. Wear proper headgear during training.' },
  { key: 'shoulder_left', label: 'Left Shoulder', risk: 'low', injuries: [], advice: 'Good range of motion. Continue shoulder stability exercises.' },
  { key: 'shoulder_right', label: 'Right Shoulder', risk: 'low', injuries: [], advice: 'No issues detected. Maintain regular conditioning.' },
  { key: 'back', label: 'Back / Torso', risk: 'medium', injuries: ['Back Spasm (S3)'], advice: 'Previous history of spasms. Core strengthening recommended.' },
  { key: 'groin', label: 'Groin', risk: 'low', injuries: [], advice: 'Normal flexibility. Adductor stretches included in warm-up.' },
  { key: 'hamstring_left', label: 'Left Hamstring', risk: 'high', injuries: ['Hamstring Strain (Current)'], advice: 'Currently injured. Follow physiotherapy plan strictly.' },
  { key: 'hamstring_right', label: 'Right Hamstring', risk: 'medium', injuries: ['Hamstring Strain (S2)'], advice: 'Previous strain history. High-risk area — monitor closely.' },
  { key: 'knee_left', label: 'Left Knee', risk: 'low', injuries: [], advice: 'Stable joint. Maintain quad and hamstring balance.' },
  { key: 'knee_right', label: 'Right Knee', risk: 'low', injuries: [], advice: 'No issues. Continue regular strengthening.' },
  { key: 'ankle_left', label: 'Left Ankle', risk: 'low', injuries: [], advice: 'Good stability. Proprioception exercises beneficial.' },
  { key: 'ankle_right', label: 'Right Ankle', risk: 'medium', injuries: ['Ankle Sprain (S1)'], advice: 'Previous sprain. Balance board exercises recommended.' },
  { key: 'foot', label: 'Feet', risk: 'low', injuries: [], advice: 'Normal condition. Ensure proper footwear for training.' },
];

// Body region SVG positions for the silhouette
const bodyRegionPositions: Record<string, { x: number; y: number }> = {
  head: { x: 50, y: 6 },
  shoulder_left: { x: 17, y: 52 },
  shoulder_right: { x: 83, y: 52 },
  back: { x: 50, y: 68 },
  groin: { x: 50, y: 97 },
  hamstring_left: { x: 37, y: 122 },
  hamstring_right: { x: 63, y: 122 },
  knee_left: { x: 37, y: 150 },
  knee_right: { x: 63, y: 150 },
  ankle_left: { x: 37, y: 180 },
  ankle_right: { x: 63, y: 180 },
  foot: { x: 50, y: 194 },
};

// ============================================================
// Mock Data — Medical Staff
// ============================================================
interface MedicalStaff {
  id: string;
  name: string;
  role: string;
  experience: string;
  specialization: string;
  color: string;
  initials: string;
  advice: string;
}

const mockStaff: MedicalStaff[] = [
  {
    id: 'physio',
    name: 'Dr. James Sullivan',
    role: 'Head Physiotherapist',
    experience: '14 years',
    specialization: 'Musculoskeletal Rehab',
    color: '#10b981',
    initials: 'JS',
    advice: 'Your hamstring is responding well to treatment. Focus on eccentric strengthening this week. Avoid any sprinting until clearance. Pool sessions are excellent for maintaining cardio fitness without strain.',
  },
  {
    id: 'doctor',
    name: 'Dr. Elena Petrova',
    role: 'Team Doctor',
    experience: '18 years',
    specialization: 'Sports Medicine',
    color: '#3b82f6',
    initials: 'EP',
    advice: 'The MRI scans show good tissue healing progress. Keep inflammation levels down with ice therapy after each session. Your recovery timeline remains on track — estimated 3 weeks to full fitness.',
  },
  {
    id: 'psychologist',
    name: 'Dr. Marcus Williams',
    role: 'Sports Psychologist',
    experience: '10 years',
    specialization: 'Mental Resilience',
    color: '#8b5cf6',
    initials: 'MW',
    advice: 'Injury periods can be mentally challenging. Maintain your match-day visualization routine daily. Stay connected with teammates. Your mental readiness score is improving — keep up the positive mindset work.',
  },
  {
    id: 'nutritionist',
    name: 'Sarah Chen',
    role: 'Sports Nutritionist',
    experience: '8 years',
    specialization: 'Recovery Nutrition',
    color: '#f59e0b',
    initials: 'SC',
    advice: 'Increase protein intake to 2.2g per kg bodyweight to support tissue repair. Add omega-3 rich foods for anti-inflammatory benefits. Stay hydrated with at least 3 liters of water daily during recovery.',
  },
];

// ============================================================
// Mock Data — Injury History
// ============================================================
interface InjuryRecord {
  id: string;
  date: string;
  name: string;
  daysOut: number;
  quality: 'Excellent' | 'Good' | 'Poor';
  recurrence: boolean;
}

const mockInjuryHistory: InjuryRecord[] = [
  { id: 'inj_current', date: '2024-11-15', name: 'Hamstring Strain', daysOut: 35, quality: 'Good', recurrence: true },
  { id: 'inj_5', date: '2024-08-02', name: 'Back Spasm', daysOut: 10, quality: 'Excellent', recurrence: false },
  { id: 'inj_4', date: '2024-04-18', name: 'Hamstring Strain', daysOut: 21, quality: 'Good', recurrence: true },
  { id: 'inj_3', date: '2023-12-05', name: 'Ankle Sprain', daysOut: 14, quality: 'Excellent', recurrence: false },
  { id: 'inj_2', date: '2023-09-22', name: 'Calf Strain', daysOut: 18, quality: 'Poor', recurrence: false },
  { id: 'inj_1', date: '2023-05-10', name: 'Thigh Contusion', daysOut: 7, quality: 'Good', recurrence: false },
];

// ============================================================
// Mock Data — Prevention Tips
// ============================================================
interface PreventionTip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const mockPreventionTips: PreventionTip[] = [
  {
    id: 'warmup',
    icon: <Flame className="h-4 w-4" />,
    title: 'Warm-Up Routines',
    description: 'Always complete a 15-minute dynamic warm-up before training. Focus on hip mobility and hamstring activation exercises to reduce strain risk.',
    color: '#f59e0b',
  },
  {
    id: 'cooldown',
    icon: <Snowflake className="h-4 w-4" />,
    title: 'Cool-Down Stretches',
    description: 'Spend 10 minutes on static stretching after every session. Hold each stretch for 30 seconds, focusing on hamstrings, quads, and hip flexors.',
    color: '#06b6d4',
  },
  {
    id: 'nutrition',
    icon: <Leaf className="h-4 w-4" />,
    title: 'Proper Nutrition',
    description: 'Maintain a balanced diet rich in protein, calcium, and omega-3 fatty acids. Proper nutrition supports tissue repair and reduces injury recovery time.',
    color: '#10b981',
  },
  {
    id: 'rest',
    icon: <Moon className="h-4 w-4" />,
    title: 'Adequate Rest',
    description: 'Ensure 8-9 hours of quality sleep each night. Sleep is critical for muscle recovery, hormone regulation, and overall physical readiness.',
    color: '#8b5cf6',
  },
  {
    id: 'strength',
    icon: <Dumbbell className="h-4 w-4" />,
    title: 'Strength Training',
    description: 'Include eccentric hamstring exercises like Nordic curls in your weekly routine. Strong muscles absorb impact and protect joints during matches.',
    color: '#ef4444',
  },
  {
    id: 'flexibility',
    icon: <Activity className="h-4 w-4" />,
    title: 'Flexibility Work',
    description: 'Practice yoga or dedicated stretching sessions 2-3 times per week. Improved flexibility significantly reduces the risk of muscle strains and tears.',
    color: '#3b82f6',
  },
];

// ============================================================
// Mock Data — Recovery Stats
// ============================================================
const mockRecoveryStats = {
  totalInjuries: 6,
  totalDaysLost: 105,
  mostCommonType: 'Muscle Strain',
  averageRecoveryTime: '17.5 days',
  thisSeasonInjuries: 2,
  lastSeasonInjuries: 3,
  thisSeasonDaysLost: 45,
  lastSeasonDaysLost: 39,
  fitnessTrend: [78, 72, 65, 58, 52, 55, 60, 64],
  weekLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
};

// ============================================================
// Utility — Risk color mapping
// ============================================================
function getRiskColor(risk: 'none' | 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#30363d';
  }
}

function getRiskBgColor(risk: 'none' | 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'high': return '#ef444418';
    case 'medium': return '#f59e0b18';
    case 'low': return '#10b98118';
    default: return '#30363d12';
  }
}

function getQualityColor(quality: 'Excellent' | 'Good' | 'Poor'): string {
  switch (quality) {
    case 'Excellent': return '#10b981';
    case 'Good': return '#f59e0b';
    case 'Poor': return '#ef4444';
    default: return '#8b949e';
  }
}

function getSeverityConfig(severity: 'minor' | 'moderate' | 'severe') {
  switch (severity) {
    case 'minor': return { label: 'Minor', color: '#10b981', bg: '#10b98118', border: 'border-emerald-500/30' };
    case 'moderate': return { label: 'Moderate', color: '#f59e0b', bg: '#f59e0b18', border: 'border-amber-500/30' };
    case 'severe': return { label: 'Severe', color: '#ef4444', bg: '#ef444418', border: 'border-red-500/30' };
  }
}

function getTypeBadgeColor(type: 'muscle' | 'ligament' | 'bone' | 'concussion') {
  switch (type) {
    case 'muscle': return { color: '#f59e0b', icon: <Activity className="h-3 w-3" /> };
    case 'ligament': return { color: '#ef4444', icon: <Shield className="h-3 w-3" /> };
    case 'bone': return { color: '#8b5cf6', icon: <Zap className="h-3 w-3" /> };
    case 'concussion': return { color: '#06b6d4', icon: <Brain className="h-3 w-3" /> };
  }
}

// ============================================================
// Main Component
// ============================================================
export default function InjuryRecovery() {
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [activityProgress, setActivityProgress] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string | null>(null);
  const [readTips, setReadTips] = useState<Set<string>>(new Set());
  const [recoveryBoosted, setRecoveryBoosted] = useState<number | null>(null);
  const [injury, setInjury] = useState<CurrentInjury>(mockInjury);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dailyLimit = 3;
  const completedToday = completedActivities.size;
  const canDoMore = completedToday < dailyLimit;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle starting an activity
  const startActivity = useCallback((activityId: string) => {
    if (!canDoMore || completedActivities.has(activityId) || activeActivity) return;
    setActiveActivity(activityId);
    setActivityProgress(0);
  }, [canDoMore, completedActivities, activeActivity]);

  // Simulate activity progress
  useEffect(() => {
    if (!activeActivity) return;

    intervalRef.current = setInterval(() => {
      setActivityProgress(prev => {
        const next = prev + 2;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Activity complete
          const activity = mockActivities.find(a => a.id === activeActivity);
          const boost = activity?.recoveryBoost ?? 5;
          setTimeout(() => {
            setCompletedActivities(prevSet => new Set([...prevSet, activeActivity]));
            setActiveActivity(null);
            setActivityProgress(0);
            setRecoveryBoosted(boost);
            setInjury(prev => ({
              ...prev,
              recoveryPercent: Math.min(100, prev.recoveryPercent + boost),
              fitnessScore: Math.min(100, prev.fitnessScore + Math.round(boost * 0.8)),
            }));
            setTimeout(() => setRecoveryBoosted(null), 3000);
          }, 300);
          return 100;
        }
        return next;
      });
    }, 60);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeActivity]);

  const sevConfig = getSeverityConfig(injury.severity);
  const typeBadge = getTypeBadgeColor(injury.type);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <motion.div className="flex items-center gap-2" {...fadeIn}>
        <Stethoscope className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-[#c9d1d9]">Injury Recovery Hub</h2>
        <span className="text-xs text-[#484f58] ml-auto">Rehab Center</span>
      </motion.div>

      {/* Recovery Boost Toast */}
      <AnimatePresence>
        {recoveryBoosted !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 right-4 max-w-sm mx-auto z-50"
            style={{ marginLeft: '-50%' }}
          >
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-300 font-medium">+{recoveryBoosted}% recovery gained!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1: Recovery Dashboard Header */}
      <RecoveryDashboardHeader
        injury={injury}
        sevConfig={sevConfig}
        typeBadge={typeBadge}
      />

      {/* Section 2: Rehabilitation Activities */}
      <RehabilitationActivities
        activities={mockActivities}
        completedActivities={completedActivities}
        activeActivity={activeActivity}
        activityProgress={activityProgress}
        canDoMore={canDoMore}
        completedToday={completedToday}
        dailyLimit={dailyLimit}
        startActivity={startActivity}
      />

      {/* Section 3: Recovery Timeline */}
      <RecoveryTimeline phases={mockPhases} />

      {/* Section 4: Body Condition Map */}
      <BodyConditionMap
        regions={mockBodyRegions}
        selectedRegion={selectedBodyRegion}
        onSelectRegion={setSelectedBodyRegion}
        injuredRegion={injury.bodyRegionKey}
      />

      {/* Section 5: Medical Staff Panel */}
      <MedicalStaffPanel
        staff={mockStaff}
        selectedStaff={selectedStaff}
        onSelectStaff={setSelectedStaff}
      />

      {/* Section 6: Injury History Log */}
      <InjuryHistoryLog injuries={mockInjuryHistory} />

      {/* Section 7: Prevention Tips */}
      <PreventionTipsPanel
        tips={mockPreventionTips}
        readTips={readTips}
        onToggleRead={(id) => {
          setReadTips(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        }}
      />

      {/* Section 8: Recovery Stats Dashboard */}
      <RecoveryStatsDashboard stats={mockRecoveryStats} />
    </div>
  );
}

// ============================================================
// Section 1: Recovery Dashboard Header (~100 lines)
// ============================================================
function RecoveryDashboardHeader({
  injury,
  sevConfig,
  typeBadge,
}: {
  injury: CurrentInjury;
  sevConfig: ReturnType<typeof getSeverityConfig>;
  typeBadge: ReturnType<typeof getTypeBadgeColor>;
}) {
  // SVG Progress Ring
  const ringSize = 80;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (injury.recoveryPercent / 100) * ringCircumference;

  const fitnessColor = injury.fitnessScore >= 75 ? '#10b981' : injury.fitnessScore >= 50 ? '#f59e0b' : '#ef4444';
  const confidenceColor = injury.staffConfidence >= 70 ? '#10b981' : injury.staffConfidence >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div {...fadeIn}>
      <Card className={`bg-[#161b22] ${sevConfig.border} border`}>
        <CardContent className="p-4 space-y-3">
          {/* Top row: Injury info + progress ring */}
          <div className="flex items-start gap-4">
            {/* Left: Injury details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: sevConfig.bg, color: sevConfig.color }}
                >
                  {typeBadge.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#c9d1d9] truncate">{injury.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-flex items-center gap-1 h-4 px-1.5 text-[9px] rounded font-medium"
                      style={{ backgroundColor: sevConfig.bg, color: sevConfig.color }}
                    >
                      {sevConfig.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 h-4 px-1.5 text-[9px] rounded font-medium capitalize"
                      style={{ backgroundColor: `${typeBadge.color}18`, color: typeBadge.color }}
                    >
                      {injury.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body part */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
                <Activity className="h-3 w-3" />
                <span>{injury.bodyPart}</span>
              </div>

              {/* Days remaining */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-amber-300 font-medium">{injury.weeksRemaining} weeks remaining</span>
                <span className="text-[#484f58]">of {injury.weeksTotal} total</span>
              </div>
            </div>

            {/* Right: SVG Progress Ring */}
            <div className="shrink-0 relative" style={{ width: ringSize, height: ringSize }}>
              <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="w-full h-full">
                <g transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="#21262d"
                  strokeWidth={ringStroke}
                />
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={sevConfig.color}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference, opacity: 0 }}
                  animate={{ strokeDashoffset: ringOffset, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold" style={{ color: sevConfig.color }}>
                  {Math.round(injury.recoveryPercent)}%
                </span>
                <span className="text-[8px] text-[#484f58]">Recovered</span>
              </div>
            </div>
          </div>

          {/* Fitness Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#8b949e]">Overall Fitness</span>
              <span className="text-xs font-semibold" style={{ color: fitnessColor }}>{injury.fitnessScore}/100</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-700"
                style={{ width: `${injury.fitnessScore}%`, backgroundColor: fitnessColor }}
              />
            </div>
          </div>

          {/* Medical Staff Confidence */}
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[11px] text-[#8b949e]">Staff Confidence</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const filled = i < Math.round(injury.staffConfidence / 20);
                  return (
                    <div
                      key={i}
                      className="w-3 h-1.5 rounded-sm"
                      style={{
                        backgroundColor: filled ? confidenceColor : '#21262d',
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-medium ml-1" style={{ color: confidenceColor }}>
                {injury.staffConfidence}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 2: Rehabilitation Activities (~250 lines)
// ============================================================
function RehabilitationActivities({
  activities,
  completedActivities,
  activeActivity,
  activityProgress,
  canDoMore,
  completedToday,
  dailyLimit,
  startActivity,
}: {
  activities: RehabActivity[];
  completedActivities: Set<string>;
  activeActivity: string | null;
  activityProgress: number;
  canDoMore: boolean;
  completedToday: number;
  dailyLimit: number;
  startActivity: (id: string) => void;
}) {
  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.04 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Rehabilitation Activities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: canDoMore ? '#10b98118' : '#ef444418',
                  color: canDoMore ? '#10b981' : '#ef4444',
                }}
              >
                {completedToday}/{dailyLimit} today
              </span>
            </div>
          </div>

          {/* Daily limit warning */}
          {!canDoMore && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-300">Daily limit reached. Come back tomorrow for more activities.</span>
            </div>
          )}

          {/* Activity grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {activities.map((activity, idx) => {
              const isCompleted = completedActivities.has(activity.id);
              const isActive = activeActivity === activity.id;
              const isDisabled = !canDoMore || isCompleted || !!activeActivity;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.05 }}
                >
                  <div
                    className={`
                      relative rounded-lg border p-3 space-y-2 transition-all
                      ${isCompleted
                        ? 'bg-[#21262d]/50 border-[#30363d]/50'
                        : isActive
                          ? 'bg-[#161b22] border-emerald-500/40'
                          : isDisabled
                            ? 'bg-[#161b22] border-[#30363d]/50 opacity-60'
                            : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
                      }
                    `}
                  >
                    {/* Completion checkmark overlay */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    )}

                    {/* Active spinner indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Icon + Name */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isCompleted ? '#21262d' : `${activity.color}15`,
                          color: isCompleted ? '#484f58' : activity.color,
                        }}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : activity.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold truncate ${isCompleted ? 'text-[#484f58]' : 'text-[#c9d1d9]'}`}>
                          {activity.name}
                        </p>
                        <p className="text-[9px] text-[#484f58] truncate">{activity.category}</p>
                      </div>
                    </div>

                    {/* Duration + Boost */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="flex items-center gap-0.5 text-[#8b949e]">
                        <Clock className="h-2.5 w-2.5" />
                        {activity.duration}
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <TrendingUp className="h-2.5 w-2.5" />
                        +{activity.recoveryBoost}%
                      </span>
                    </div>

                    {/* Progress bar during active activity */}
                    {isActive && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                          <motion.div
                            className="h-full rounded-md"
                            style={{ backgroundColor: activity.color }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${activityProgress}%` }}
                            transition={{ duration: 0.05 }}
                          />
                        </div>
                        <p className="text-[9px] text-center" style={{ color: activity.color }}>
                          {activityProgress < 100 ? 'In progress...' : 'Complete!'}
                        </p>
                      </div>
                    )}

                    {/* Start button */}
                    {!isCompleted && !isActive && (
                      <button
                        onClick={() => startActivity(activity.id)}
                        disabled={isDisabled}
                        className={`
                          w-full py-1.5 rounded-md text-[10px] font-medium transition-all
                          ${isDisabled
                            ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/30'
                          }
                        `}
                      >
                        Start
                      </button>
                    )}

                    {/* Completed label */}
                    {isCompleted && (
                      <div className="text-center py-1">
                        <span className="text-[10px] text-emerald-400/60 font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Description for active activity */}
          <AnimatePresence mode="wait">
            {activeActivity && (
              <motion.div
                key={activeActivity}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2.5 rounded-lg bg-[#1c2333] border border-[#30363d]"
              >
                {(() => {
                  const act = activities.find(a => a.id === activeActivity);
                  if (!act) return null;
                  return (
                    <p className="text-[11px] text-[#8b949e] leading-relaxed">
                      <span className="font-medium text-[#c9d1d9]">{act.name}:</span> {act.description}
                    </p>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 3: Recovery Timeline (~150 lines)
// ============================================================
function RecoveryTimeline({ phases }: { phases: RecoveryPhase[] }) {
  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.08 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8b949e]" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Recovery Timeline</span>
          </div>

          {/* Vertical timeline */}
          <div className="relative ml-4">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#30363d]" />

            <div className="space-y-0">
              {phases.map((phase, idx) => {
                const isCompleted = phase.status === 'completed';
                const isInProgress = phase.status === 'in_progress';
                const isLocked = phase.status === 'locked';

                const dotColor = isCompleted ? '#10b981' : isInProgress ? '#10b981' : '#30363d';
                const borderColor = isCompleted ? 'border-emerald-500/20' : isInProgress ? 'border-emerald-500/30' : 'border-[#21262d]';
                const bgColor = isCompleted ? '#10b98108' : isInProgress ? '#10b98110' : '#21262d50';

                return (
                  <div key={phase.id} className="relative pl-6 pb-4 last:pb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5">
                      <div className="w-[15px] h-[15px] rounded-sm flex items-center justify-center" style={{ backgroundColor: '#161b22', border: `2px solid ${dotColor}` }}>
                        {isCompleted && <CheckCircle2 className="h-2 w-2 text-emerald-400" />}
                        {isInProgress && (
                          <motion.div
                            className="w-1.5 h-1.5 rounded-sm bg-emerald-400"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                        {isLocked && <X className="h-2 w-2 text-[#30363d]" />}
                      </div>
                    </div>

                    {/* Phase content */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: idx * 0.05 }}
                      className={`rounded-lg border p-3 space-y-1.5 ${borderColor}`}
                      style={{ backgroundColor: bgColor }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-semibold ${isLocked ? 'text-[#484f58]' : 'text-[#c9d1d9]'}`}>
                            Phase {idx + 1}: {phase.name}
                          </p>
                        </div>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: isCompleted ? '#10b98118' : isInProgress ? '#10b98118' : '#21262d',
                            color: isCompleted ? '#10b981' : isInProgress ? '#10b981' : '#484f58',
                          }}
                        >
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Locked'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8b949e]">{phase.description}</p>

                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Clock className="h-2.5 w-2.5 text-[#484f58]" />
                        <span className="text-[#8b949e]">{phase.duration}</span>
                      </div>

                      {/* Required activities */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {phase.requiredActivities.map((act, actIdx) => (
                          <span
                            key={actIdx}
                            className="text-[9px] px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: isLocked ? '#21262d' : '#30363d',
                              backgroundColor: isLocked ? 'transparent' : '#21262d',
                              color: isLocked ? '#30363d' : '#8b949e',
                            }}
                          >
                            {act}
                          </span>
                        ))}
                      </div>

                      {/* Milestone */}
                      {isCompleted && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">{phase.milestone}</span>
                        </div>
                      )}
                      {isInProgress && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <ArrowRight className="h-3 w-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Next: {phase.milestone}</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 4: Body Condition Map (~120 lines)
// ============================================================
function BodyConditionMap({
  regions,
  selectedRegion,
  onSelectRegion,
  injuredRegion,
}: {
  regions: BodyRegion[];
  selectedRegion: string | null;
  onSelectRegion: (key: string | null) => void;
  injuredRegion: string;
}) {
  const selectedData = regions.find(r => r.key === selectedRegion);

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.12 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Body Condition Map</span>
            </div>
            {/* Risk legend */}
            <div className="flex items-center gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <div key={level} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: getRiskColor(level) }} />
                  <span className="text-[8px] text-[#484f58] capitalize">{level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Body silhouette + markers */}
          <div className="flex justify-center">
            <svg viewBox="0 0 100 200" className="w-36 h-auto">
              {/* Body outline */}
              <circle cx="50" cy="18" r="14" fill="none" stroke="#30363d" strokeWidth="1.5" />
              <line x1="50" y1="32" x2="50" y2="40" stroke="#30363d" strokeWidth="1.5" />
              <rect x="30" y="40" width="40" height="58" rx="4" fill="none" stroke="#30363d" strokeWidth="1.5" />
              <rect x="14" y="42" width="14" height="44" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
              <rect x="72" y="42" width="14" height="44" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
              <rect x="32" y="98" width="16" height="92" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />
              <rect x="52" y="98" width="16" height="92" rx="6" fill="none" stroke="#30363d" strokeWidth="1.5" />

              {/* Region markers */}
              {regions.map(region => {
                const pos = bodyRegionPositions[region.key];
                if (!pos || region.risk === 'none') return null;
                const color = getRiskColor(region.risk);
                const isInjured = region.key === injuredRegion;
                const isSelected = region.key === selectedRegion;

                return (
                  <g key={region.key}>
                    {/* Pulsing ring for injured region */}
                    {isInjured && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r="9"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="10"
                        fill="none"
                        stroke="#58a6ff"
                        strokeWidth="1"
                      />
                    )}
                    {/* Dot */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isInjured ? 5 : 3.5}
                      fill={color}
                      fillOpacity={isInjured ? 1 : 0.6}
                      stroke="#0d1117"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onClick={() => onSelectRegion(selectedRegion === region.key ? null : region.key)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected region info card */}
          <AnimatePresence mode="wait">
            {selectedData && (
              <motion.div
                key={selectedData.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg border border-[#30363d] bg-[#1c2333] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#c9d1d9]">{selectedData.label}</p>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-medium capitalize"
                    style={{ backgroundColor: getRiskBgColor(selectedData.risk), color: getRiskColor(selectedData.risk) }}
                  >
                    {selectedData.risk} risk
                  </span>
                </div>
                {selectedData.injuries.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#484f58]">Injury history:</span>
                    {selectedData.injuries.map((inj, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-sm bg-red-400" />
                        <span className="text-[10px] text-[#8b949e]">{inj}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[#8b949e] leading-relaxed">{selectedData.advice}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          {!selectedRegion && (
            <p className="text-[10px] text-center text-[#484f58]">Tap a body region to view details</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 5: Medical Staff Panel (~120 lines)
// ============================================================
function MedicalStaffPanel({
  staff,
  selectedStaff,
  onSelectStaff,
}: {
  staff: MedicalStaff[];
  selectedStaff: string | null;
  onSelectStaff: (id: string | null) => void;
}) {
  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.16 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#8b949e]" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Medical Staff</span>
          </div>

          {/* Staff cards */}
          <div className="space-y-2">
            {staff.map((member, idx) => {
              const isSelected = selectedStaff === member.id;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.04 }}
                  className={`rounded-lg border p-3 transition-all ${
                    isSelected ? 'border-emerald-500/30 bg-[#1c2333]' : 'border-[#30363d] bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar circle */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ backgroundColor: `${member.color}18`, color: member.color }}
                    >
                      {member.initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#c9d1d9] truncate">{member.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ backgroundColor: `${member.color}15`, color: member.color }}
                        >
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#484f58]">
                        <span>{member.experience} exp.</span>
                        <span className="w-px h-2.5 bg-[#30363d]" />
                        <span>{member.specialization}</span>
                      </div>
                    </div>

                    {/* Consult button */}
                    <button
                      onClick={() => onSelectStaff(isSelected ? null : member.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d]'
                      }`}
                    >
                      {isSelected ? 'Close' : 'Consult'}
                    </button>
                  </div>

                  {/* Consult advice */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 pt-3 border-t border-[#30363d]"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-[#8b949e] leading-relaxed">{member.advice}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 6: Injury History Log (~100 lines)
// ============================================================
function InjuryHistoryLog({ injuries }: { injuries: InjuryRecord[] }) {
  const totalDays = injuries.reduce((sum, i) => sum + i.daysOut, 0);
  const recurrenceCount = injuries.filter(i => i.recurrence).length;

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.2 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Injury History</span>
            </div>
            <span className="text-[10px] text-[#484f58]">{totalDays} total days lost</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[#1c2333] border border-[#30363d]">
              <p className="text-sm font-bold text-[#c9d1d9]">{injuries.length}</p>
              <p className="text-[9px] text-[#484f58]">Total Injuries</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#1c2333] border border-[#30363d]">
              <p className="text-sm font-bold text-[#c9d1d9]">{totalDays}</p>
              <p className="text-[9px] text-[#484f58]">Days Lost</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#1c2333] border border-[#30363d]">
              <p className={`text-sm font-bold ${recurrenceCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {recurrenceCount}
              </p>
              <p className="text-[9px] text-[#484f58]">Recurrences</p>
            </div>
          </div>

          {/* Injury prone indicator */}
          {recurrenceCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-300">
                Injury-prone pattern detected — {recurrenceCount} recurring injury{recurrenceCount > 1 ? 'ies' : 'y'} found. Focus on prevention.
              </span>
            </div>
          )}

          {/* Injury list */}
          <div className="space-y-1.5">
            {injuries.map((inj, idx) => (
              <motion.div
                key={inj.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12, delay: idx * 0.03 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#1c2333] border border-[#30363d]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-medium text-[#c9d1d9] truncate">{inj.name}</p>
                    {inj.recurrence && (
                      <span className="shrink-0 text-[8px] px-1 py-px rounded bg-red-500/15 text-red-400 font-medium">Recurring</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#484f58]">
                    <span>{inj.date}</span>
                    <span className="w-px h-2.5 bg-[#30363d]" />
                    <span>{inj.daysOut} days</span>
                  </div>
                </div>
                <span
                  className="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: `${getQualityColor(inj.quality)}18`, color: getQualityColor(inj.quality) }}
                >
                  {inj.quality}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 7: Prevention Tips (~100 lines)
// ============================================================
function PreventionTipsPanel({
  tips,
  readTips,
  onToggleRead,
}: {
  tips: PreventionTip[];
  readTips: Set<string>;
  onToggleRead: (id: string) => void;
}) {
  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.24 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Prevention Tips</span>
            </div>
            <span className="text-[10px] text-[#484f58]">
              {readTips.size}/{tips.length} read
            </span>
          </div>

          {/* Tips grid */}
          <div className="grid grid-cols-2 gap-2">
            {tips.map((tip, idx) => {
              const isRead = readTips.has(tip.id);
              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isRead ? 0.5 : 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.04 }}
                  className="rounded-lg border border-[#30363d] bg-[#161b22] p-3 space-y-2"
                >
                  {/* Icon + title */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tip.color}15`, color: tip.color }}
                    >
                      {tip.icon}
                    </div>
                    <p className="text-[11px] font-semibold text-[#c9d1d9]">{tip.title}</p>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-[#8b949e] leading-relaxed">{tip.description}</p>

                  {/* Mark as read toggle */}
                  <button
                    onClick={() => onToggleRead(tip.id)}
                    className={`w-full py-1 rounded-md text-[9px] font-medium transition-all ${
                      isRead
                        ? 'bg-[#21262d] text-[#484f58]'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isRead ? (
                      <span className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Read
                      </span>
                    ) : (
                      'Mark as Read'
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Section 8: Recovery Stats Dashboard (~80 lines)
// ============================================================
function RecoveryStatsDashboard({ stats }: { stats: typeof mockRecoveryStats }) {
  const chartW = 260;
  const chartH = 60;
  const padX = 8;
  const padY = 6;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const trendPoints = stats.fitnessTrend.map((val, i) => ({
    x: padX + (i / (stats.fitnessTrend.length - 1)) * plotW,
    y: padY + plotH - (val / 100) * plotH,
    val,
  }));

  const polylinePoints = trendPoints.map(p => `${p.x},${p.y}`).join(' ');
  const fillAreaPoints = `${padX},${chartH - padY} ${polylinePoints} ${chartW - padX},${chartH - padY}`;

  // Season comparison bar widths
  const maxDays = Math.max(stats.thisSeasonDaysLost, stats.lastSeasonDaysLost, 1);
  const thisSeasonBarWidth = (stats.thisSeasonDaysLost / maxDays) * 100;
  const lastSeasonBarWidth = (stats.lastSeasonDaysLost / maxDays) * 100;

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.2, delay: 0.28 }}>
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#8b949e]" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Recovery Stats</span>
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-[#1c2333] border border-[#30363d] space-y-1">
              <p className="text-[10px] text-[#484f58]">Total Injuries</p>
              <p className="text-lg font-bold text-[#c9d1d9]">{stats.totalInjuries}</p>
              <p className="text-[9px] text-[#484f58]">{stats.totalDaysLost} days lost</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#1c2333] border border-[#30363d] space-y-1">
              <p className="text-[10px] text-[#484f58]">Most Common Type</p>
              <p className="text-lg font-bold text-amber-400 leading-tight">{stats.mostCommonType}</p>
              <p className="text-[9px] text-[#484f58]">Avg recovery: {stats.averageRecoveryTime}</p>
            </div>
          </div>

          {/* Season comparison */}
          <div className="space-y-2">
            <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">Season Comparison</p>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e] w-12 shrink-0">This S.</span>
                <div className="flex-1 h-3 bg-[#21262d] rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{ width: `${thisSeasonBarWidth}%`, backgroundColor: '#ef4444' }}
                  />
                </div>
                <span className="text-[10px] text-[#c9d1d9] w-16 text-right">{stats.thisSeasonInjuries} inj / {stats.thisSeasonDaysLost}d</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e] w-12 shrink-0">Last S.</span>
                <div className="flex-1 h-3 bg-[#21262d] rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{ width: `${lastSeasonBarWidth}%`, backgroundColor: '#8b949e' }}
                  />
                </div>
                <span className="text-[10px] text-[#c9d1d9] w-16 text-right">{stats.lastSeasonInjuries} inj / {stats.lastSeasonDaysLost}d</span>
              </div>
            </div>
          </div>

          {/* Fitness trend line chart */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">Fitness Trend</p>
              <span className="text-[10px] text-emerald-400 font-medium">
                {stats.fitnessTrend[stats.fitnessTrend.length - 1]}% current
              </span>
            </div>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
              {/* Filled area */}
              <polygon
                points={fillAreaPoints}
                fill="#10b981"
                fillOpacity="0.06"
              />
              {/* Line */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Data points */}
              {trendPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill={p.val >= 70 ? '#10b981' : p.val >= 50 ? '#f59e0b' : '#ef4444'}
                  stroke="#161b22"
                  strokeWidth="1.5"
                />
              ))}
              {/* Week labels */}
              {stats.weekLabels.map((label, i) => {
                const x = padX + (i / (stats.weekLabels.length - 1)) * plotW;
                return (
                  <text
                    key={label}
                    x={x}
                    y={chartH - 1}
                    textAnchor="middle"
                    fill="#484f58"
                    fontSize="7"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
