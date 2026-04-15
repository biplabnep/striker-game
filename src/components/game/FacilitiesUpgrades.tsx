'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Dumbbell,
  GraduationCap,
  Heart,
  Building,
  Star,
  ChevronDown,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Banknote,
  Zap,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface FacilityCategory {
  id: 'training_ground' | 'youth_academy' | 'medical_center' | 'stadium';
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  levelDescriptions: string[];
  effectLabels: string[];
  currentLevel: number;
  rawValue: number;
}

interface UpgradeHistoryEntry {
  facilityName: string;
  oldLevel: number;
  newLevel: number;
  cost: number;
  season: number;
}

// ============================================================
// Constants
// ============================================================

const MAX_LEVEL = 5;

const LEVEL_DESCRIPTIONS: Record<string, string[]> = {
  training_ground: [
    'Basic training pitches with minimal equipment. Players train on standard grass surfaces.',
    'Improved training area with gym access. Standard recovery facilities available.',
    'Modern training complex with advanced gym. Video analysis suite for match prep.',
    'State-of-the-art facility with sports science lab. Altitude training chamber installed.',
    'World-class training center with AI-driven analytics. Hydrotherapy and cryotherapy suites.',
  ],
  youth_academy: [
    'Basic youth setup with limited scouting network. Local recruitment only.',
    'Dedicated youth coaches and regional scouting. Structured development pathways.',
    'National scouting network with scholarship programs. Specialized coaching staff.',
    'International scouting reach with elite youth leagues. Boarding facilities for prospects.',
    'Globe-spanning scouting network. Cutting-edge youth development methodology.',
  ],
  medical_center: [
    'Basic physio room with limited staff. Standard injury treatment protocols.',
    'Dedicated medical team with injury prevention programs. Hydrotherapy pool added.',
    'Advanced medical imaging and specialist consultants. Recovery timelines improved.',
    'Sports science integration with real-time monitoring. Regen chambers available.',
    'Elite medical center with biomechanics lab. Same-day return protocols for minor issues.',
  ],
  stadium: [
    'Modest ground with basic amenities. Limited corporate hospitality facilities.',
    'Renovated stands with improved concourses. Small VIP lounge available.',
    'Modern stadium with expanded capacity. Multiple corporate boxes and fan zones.',
    'Large-capacity arena with premium facilities. World-class media center installed.',
    'Iconic venue with retractable roof. Elite matchday experience and maximum revenue.',
  ],
};

const EFFECT_LABELS: Record<string, string[]> = {
  training_ground: [
    'Training speed +0%, Injury recovery +0%',
    'Training speed +5%, Injury recovery +5%',
    'Training speed +10%, Injury recovery +10%',
    'Training speed +15%, Injury recovery +15%',
    'Training speed +20%, Injury recovery +25%',
  ],
  youth_academy: [
    'Youth potential +0, Scouting range: Local',
    'Youth potential +2, Scouting range: Regional',
    'Youth potential +4, Scouting range: National',
    'Youth potential +6, Scouting range: International',
    'Youth potential +8, Scouting range: Global',
  ],
  medical_center: [
    'Injury recovery +0%, Injury prevention +0%',
    'Injury recovery +5%, Injury prevention +5%',
    'Injury recovery +10%, Injury prevention +10%',
    'Injury recovery +18%, Injury prevention +15%',
    'Injury recovery +25%, Injury prevention +20%',
  ],
  stadium: [
    'Match revenue +0%, Fan satisfaction +0%, Capacity: Base',
    'Match revenue +5%, Fan satisfaction +5%, Capacity: +5,000',
    'Match revenue +12%, Fan satisfaction +10%, Capacity: +12,000',
    'Match revenue +20%, Fan satisfaction +15%, Capacity: +20,000',
    'Match revenue +30%, Fan satisfaction +25%, Capacity: +30,000',
  ],
};

const FACILITY_COLORS: Record<string, string> = {
  training_ground: '#22c55e',
  youth_academy: '#f59e0b',
  medical_center: '#ef4444',
  stadium: '#3b82f6',
};

const FACILITY_NAMES: Record<string, string> = {
  training_ground: 'Training Ground',
  youth_academy: 'Youth Academy',
  medical_center: 'Medical Center',
  stadium: 'Stadium',
};

const BOARD_RESPONSES_POSITIVE = [
  'The board has reviewed your request and approved additional investment for facility improvements.',
  'After careful consideration, the directors have allocated extra funds to upgrade the infrastructure.',
  'The board recognizes the importance of top-tier facilities. Your request has been granted.',
  'Impressed by your vision, the board has agreed to release additional investment capital.',
];
const BOARD_RESPONSES_NEGATIVE = [
  'The board has declined the request at this time, citing other financial priorities.',
  'Unfortunately, the directors feel current facilities are adequate for the club\'s needs.',
  'The board cannot approve additional spending on facilities given the current financial outlook.',
  'Your proposal was reviewed but rejected. The board suggests focusing resources on player recruitment.',
];

// ============================================================
// Helpers
// ============================================================

function valueToLevel(value: number): number {
  return Math.max(1, Math.min(MAX_LEVEL, Math.ceil(value / 20)));
}

function getUpgradeCost(currentLevel: number): number {
  return currentLevel * 5_000_000;
}

function formatCost(cost: number): string {
  if (cost >= 1_000_000) return `€${cost / 1_000_000}M`;
  if (cost >= 1_000) return `€${cost / 1_000}K`;
  return `€${cost}`;
}

function getOverallScore(levels: number[]): number {
  return Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 20);
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function seededChoice<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function generateDeterministicHistory(
  facilitiesValue: number,
  youthValue: number,
  financesValue: number,
  reputation: number,
  currentSeason: number
): UpgradeHistoryEntry[] {
  const history: UpgradeHistoryEntry[] = [];
  const facilitiesLevel = valueToLevel(facilitiesValue);
  const youthLevel = valueToLevel(youthValue);
  const medicalLevel = valueToLevel(financesValue);
  const stadiumLevel = Math.max(1, Math.min(MAX_LEVEL, Math.ceil(reputation / 20)));

  const facilityEntries: { name: string; level: number; id: string }[] = [
    { name: 'Training Ground', level: facilitiesLevel, id: 'training_ground' },
    { name: 'Youth Academy', level: youthLevel, id: 'youth_academy' },
    { name: 'Medical Center', level: medicalLevel, id: 'medical_center' },
    { name: 'Stadium', level: stadiumLevel, id: 'stadium' },
  ];

  const seasonsBack = Math.min(currentSeason - 1, 6);

  for (let i = 0; i < seasonsBack; i++) {
    const entry = facilityEntries[i % facilityEntries.length];
    if (entry.level > 1) {
      const seasonOfUpgrade = currentSeason - seasonsBack + i;
      history.push({
        facilityName: entry.name,
        oldLevel: entry.level - 1,
        newLevel: entry.level,
        cost: (entry.level - 1) * 5_000_000,
        season: seasonOfUpgrade,
      });
    }
  }

  return history.reverse().slice(0, 5);
}

function getBoardWillingness(reputation: number, finances: number, currentSeason: number, currentWeek: number): number {
  let willingness = 30;
  willingness += Math.floor(reputation / 5);
  willingness += Math.floor(finances / 8);
  willingness += Math.min(currentSeason * 5, 25);
  // Deterministic variation based on week
  willingness += ((currentWeek * 7) % 15) - 7;
  return Math.max(5, Math.min(95, willingness));
}

// ============================================================
// SVG Progress Ring Component
// ============================================================

function ProgressRing({
  score,
  size = 72,
  strokeWidth = 5,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
        style={{ strokeDashoffset: offset }}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={18}
        fontWeight="bold"
        fontFamily="system-ui"
      >
        {score}
      </text>
    </svg>
  );
}

// ============================================================
// Star Rating Component
// ============================================================

function StarRating({
  level,
  maxLevel = 5,
  size = 14,
}: {
  level: number;
  maxLevel?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLevel }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < level ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}
        />
      ))}
    </div>
  );
}

// ============================================================
// Facility Comparison Bar Chart (SVG)
// ============================================================

function FacilityComparisonChart({ facilities }: { facilities: FacilityCategory[] }) {
  const chartWidth = 300;
  const chartHeight = 160;
  const barHeight = 20;
  const barGap = 16;
  const labelWidth = 80;
  const valueWidth = 40;
  const maxBarWidth = chartWidth - labelWidth - valueWidth - 10;
  const startY = 20;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
      {facilities.map((facility, i) => {
        const y = startY + i * (barHeight + barGap);
        const filledWidth = (facility.currentLevel / MAX_LEVEL) * maxBarWidth;
        const trackWidth = maxBarWidth;
        const color = FACILITY_COLORS[facility.id];

        return (
          <g key={facility.id}>
            {/* Label */}
            <text
              x={0}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill="#8b949e"
              fontSize="10"
              fontFamily="system-ui"
            >
              {facility.name}
            </text>
            {/* Track */}
            <rect
              x={labelWidth}
              y={y}
              width={trackWidth}
              height={barHeight}
              rx={4}
              fill="#21262d"
            />
            {/* Filled bar */}
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(filledWidth, 0)}
              height={barHeight}
              rx={4}
              fill={color}
              opacity={0.85}
            />
            {/* Level marks */}
            {[1, 2, 3, 4, 5].map((lv) => {
              const markX = labelWidth + (lv / MAX_LEVEL) * maxBarWidth;
              return (
                <line
                  key={lv}
                  x1={markX}
                  y1={y}
                  x2={markX}
                  y2={y + barHeight}
                  stroke="#0d1117"
                  strokeWidth={1}
                  opacity={0.4}
                />
              );
            })}
            {/* Value */}
            <text
              x={chartWidth - valueWidth + 5}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill="#c9d1d9"
              fontSize="11"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              Lv.{facility.currentLevel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function FacilitiesUpgrades() {
  const gameState = useGameStore(state => state.gameState);
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [upgradeHistory, setUpgradeHistory] = useState<UpgradeHistoryEntry[]>([]);
  const [boardRequestSubmitted, setBoardRequestSubmitted] = useState(false);
  const [boardResponse, setBoardResponse] = useState<{ approved: boolean; message: string } | null>(null);

  const club = gameState?.currentClub;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const clubReputation = club?.reputation ?? 50;
  const clubFinances = club?.finances ?? 50;
  const clubBudget = club?.budget ?? 10_000_000;

  // Derive facility levels from club data
  const facilityLevels = useMemo(() => ({
    training_ground: valueToLevel(club?.facilities ?? 60),
    youth_academy: valueToLevel(club?.youthDevelopment ?? 50),
    medical_center: valueToLevel(club?.finances ?? 50),
    stadium: Math.max(1, Math.min(MAX_LEVEL, Math.ceil((club?.reputation ?? 50) / 20))),
  }), [club?.facilities, club?.youthDevelopment, club?.finances, club?.reputation]);

  const facilities: FacilityCategory[] = useMemo(() => [
    {
      id: 'training_ground',
      name: 'Training Ground',
      icon: <Dumbbell className="h-5 w-5" style={{ color: FACILITY_COLORS.training_ground }} />,
      color: FACILITY_COLORS.training_ground,
      description: LEVEL_DESCRIPTIONS.training_ground[facilityLevels.training_ground - 1],
      levelDescriptions: LEVEL_DESCRIPTIONS.training_ground,
      effectLabels: EFFECT_LABELS.training_ground,
      currentLevel: facilityLevels.training_ground,
      rawValue: club?.facilities ?? 60,
    },
    {
      id: 'youth_academy',
      name: 'Youth Academy',
      icon: <GraduationCap className="h-5 w-5" style={{ color: FACILITY_COLORS.youth_academy }} />,
      color: FACILITY_COLORS.youth_academy,
      description: LEVEL_DESCRIPTIONS.youth_academy[facilityLevels.youth_academy - 1],
      levelDescriptions: LEVEL_DESCRIPTIONS.youth_academy,
      effectLabels: EFFECT_LABELS.youth_academy,
      currentLevel: facilityLevels.youth_academy,
      rawValue: club?.youthDevelopment ?? 50,
    },
    {
      id: 'medical_center',
      name: 'Medical Center',
      icon: <Heart className="h-5 w-5" style={{ color: FACILITY_COLORS.medical_center }} />,
      color: FACILITY_COLORS.medical_center,
      description: LEVEL_DESCRIPTIONS.medical_center[facilityLevels.medical_center - 1],
      levelDescriptions: LEVEL_DESCRIPTIONS.medical_center,
      effectLabels: EFFECT_LABELS.medical_center,
      currentLevel: facilityLevels.medical_center,
      rawValue: club?.finances ?? 50,
    },
    {
      id: 'stadium',
      name: 'Stadium',
      icon: <Building className="h-5 w-5" style={{ color: FACILITY_COLORS.stadium }} />,
      color: FACILITY_COLORS.stadium,
      description: LEVEL_DESCRIPTIONS.stadium[facilityLevels.stadium - 1],
      levelDescriptions: LEVEL_DESCRIPTIONS.stadium,
      effectLabels: EFFECT_LABELS.stadium,
      currentLevel: facilityLevels.stadium,
      rawValue: club?.reputation ?? 50,
    },
  ], [facilityLevels, club?.facilities, club?.youthDevelopment, club?.finances, club?.reputation]);

  const overallScore = useMemo(
    () => getOverallScore([facilityLevels.training_ground, facilityLevels.youth_academy, facilityLevels.medical_center, facilityLevels.stadium]),
    [facilityLevels]
  );

  const overallStars = useMemo(() => Math.round(overallScore / 20), [overallScore]);

  const boardBudget = useMemo(() => clubBudget * 0.3, [clubBudget]);

  const boardWillingness = useMemo(
    () => getBoardWillingness(clubReputation, clubFinances, currentSeason, currentWeek),
    [clubReputation, clubFinances, currentSeason, currentWeek]
  );

  // Generate deterministic upgrade history
  const initialHistory = useMemo(
    () => generateDeterministicHistory(
      club?.facilities ?? 60,
      club?.youthDevelopment ?? 50,
      club?.finances ?? 50,
      club?.reputation ?? 50,
      currentSeason
    ),
    [club?.facilities, club?.youthDevelopment, club?.finances, club?.reputation, currentSeason]
  );

  // Initialize history once
  const historyEntries = upgradeHistory.length > 0 ? [...upgradeHistory, ...initialHistory] : initialHistory;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleUpgrade = useCallback((facility: FacilityCategory) => {
    if (facility.currentLevel >= MAX_LEVEL) {
      showToast('This facility is already at maximum level!', 'error');
      return;
    }
    const cost = getUpgradeCost(facility.currentLevel);
    showToast(
      `${facility.name} upgraded to Level ${facility.currentLevel + 1} for ${formatCost(cost)}!`,
      'success'
    );
    setUpgradeHistory(prev => [
      {
        facilityName: facility.name,
        oldLevel: facility.currentLevel,
        newLevel: facility.currentLevel + 1,
        cost,
        season: currentSeason,
      },
      ...prev,
    ]);
  }, [currentSeason, showToast]);

  const handleBoardRequest = useCallback(() => {
    setBoardRequestSubmitted(true);
    const seed = currentSeason * 100 + currentWeek * 7 + clubReputation;
    const approved = boardWillingness > 55;
    const message = approved
      ? seededChoice(BOARD_RESPONSES_POSITIVE, seed)
      : seededChoice(BOARD_RESPONSES_NEGATIVE, seed);
    setBoardResponse({ approved, message });
    showToast(
      approved ? 'Board approved your investment request!' : 'Board declined the investment request.',
      approved ? 'success' : 'error'
    );
  }, [boardWillingness, currentSeason, currentWeek, clubReputation, showToast]);

  const toggleFacility = useCallback((id: string) => {
    setExpandedFacility(prev => (prev === id ? null : id));
  }, []);

  if (!gameState || !club) return null;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center border border-[#30363d]">
          <Building2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[#c9d1d9]">Facilities</h1>
          <p className="text-xs text-[#8b949e]">Manage and upgrade club infrastructure</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] shrink-0">
          {club.logo} {club.shortName}
        </Badge>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border text-sm font-semibold shadow ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-red-900/90 border-red-500/30 text-red-400'
                : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Facilities Rating Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="flex flex-col items-center gap-1.5">
              <ProgressRing score={overallScore} />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#8b949e]">Overall</span>
                <span className="text-xs font-bold" style={{ color: getScoreColor(overallScore) }}>
                  {overallScore}/100
                </span>
              </div>
            </div>

            {/* Stars & Info */}
            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">Facilities Rating</p>
                <StarRating level={overallStars} size={16} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#21262d]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Banknote className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">Board Budget</span>
                  </div>
                  <p className="text-sm font-bold text-[#c9d1d9]">{formatCost(boardBudget)}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#21262d]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-[#8b949e]">Board Mood</span>
                  </div>
                  <p className="text-sm font-bold text-[#c9d1d9]">{boardWillingness}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facility Category Cards */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">
          Facility Categories
        </h3>
        <div className="space-y-2">
          {facilities.map(facility => {
            const isExpanded = expandedFacility === facility.id;
            const isMaxed = facility.currentLevel >= MAX_LEVEL;
            const upgradeCost = getUpgradeCost(facility.currentLevel);
            const canAfford = boardBudget >= upgradeCost;
            const progressToNext = isMaxed ? 100 : ((facility.rawValue % 20) / 20) * 100;

            return (
              <Card key={facility.id} className="bg-[#161b22] border-[#30363d] overflow-hidden">
                <button
                  onClick={() => toggleFacility(facility.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${facility.color}15`,
                        borderColor: `${facility.color}30`,
                      }}
                    >
                      {facility.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#c9d1d9]">{facility.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-[#30363d] font-bold"
                            style={{ color: facility.color }}
                          >
                            Level {facility.currentLevel}
                          </Badge>
                          <ChevronDown
                            className={`h-4 w-4 text-[#8b949e] transition-opacity duration-200 ${
                              isExpanded ? 'opacity-100 rotate-180' : 'opacity-60'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating level={facility.currentLevel} size={10} />
                        <span className="text-[10px] text-[#8b949e]">{facility.description.substring(0, 50)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar to next level */}
                  {!isMaxed && (
                    <div className="mt-2.5 ml-13">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#8b949e]">Progress to Level {facility.currentLevel + 1}</span>
                        <span className="text-[9px] font-semibold" style={{ color: facility.color }}>
                          {Math.round(progressToNext)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full rounded-sm"
                          style={{ backgroundColor: facility.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressToNext}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  )}
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-[#30363d]"
                    >
                      <div className="p-3 space-y-3">
                        {/* Full description */}
                        <p className="text-xs text-[#8b949e] leading-relaxed">{facility.description}</p>

                        {/* Effects */}
                        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1.5">Current Effects</p>
                          <div className="space-y-1">
                            {facility.effectLabels[facility.currentLevel - 1].split(', ').map((effect, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3" style={{ color: facility.color }} />
                                <span className="text-xs text-[#c9d1d9]">{effect}</span>
                              </div>
                            ))}
                          </div>
                          {!isMaxed && (
                            <>
                              <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mt-2 mb-1.5">
                                    Next Level Effects
                                  </p>
                              <div className="space-y-1">
                                {facility.effectLabels[facility.currentLevel].split(', ').map((effect, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                    <span className="text-xs text-emerald-400">{effect}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Level breakdown */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">All Levels</p>
                          {[1, 2, 3, 4, 5].map(lv => (
                            <div
                              key={lv}
                              className={`flex items-center gap-2 p-1.5 rounded-lg ${
                                lv === facility.currentLevel
                                  ? 'bg-[#21262d] border border-[#30363d]'
                                  : 'bg-transparent'
                              }`}
                            >
                              <Star
                                size={10}
                                className={
                                  lv <= facility.currentLevel
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-[#30363d]'
                                }
                              />
                              <span
                                className={`text-[10px] ${
                                  lv === facility.currentLevel ? 'text-[#c9d1d9] font-medium' : 'text-[#484f58]'
                                }`}
                              >
                                Lv.{lv} — {facility.levelDescriptions[lv - 1].substring(0, 55)}
                              </span>
                              {lv === facility.currentLevel && (
                                <span className="text-[8px] text-emerald-400 font-bold ml-auto">CURRENT</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Upgrade button */}
                        {!isMaxed && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpgrade(facility);
                            }}
                            disabled={!canAfford}
                            className={`w-full rounded-lg font-semibold text-xs ${
                              canAfford
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-[#21262d] text-[#8b949e] cursor-not-allowed'
                            }`}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                            {canAfford
                              ? `Upgrade to Level ${facility.currentLevel + 1} — ${formatCost(upgradeCost)}`
                              : `Insufficient Budget — Need ${formatCost(upgradeCost)}`}
                          </Button>
                        )}
                        {isMaxed && (
                          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400">Maximum Level Reached</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Facility Comparison Chart */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Facility Comparison</h3>
          </div>
          <FacilityComparisonChart facilities={facilities} />

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#30363d]">
            {facilities.map(f => (
              <div key={f.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-[9px] text-[#8b949e]">{f.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade History */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Upgrade History</h3>
          </div>

          {historyEntries.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">No upgrades recorded yet.</p>
              <p className="text-[10px] text-[#484f58] mt-1">Start upgrading your facilities to see history here.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {historyEntries.map((entry, idx) => (
                <motion.div
                  key={`${entry.facilityName}-${entry.season}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c9d1d9] font-medium truncate">{entry.facilityName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#8b949e]">
                        Level {entry.oldLevel} → {entry.newLevel}
                      </span>
                      <span className="text-[10px] text-[#484f58]">|</span>
                      <span className="text-[10px] text-emerald-400 font-medium">{formatCost(entry.cost)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[#30363d] text-[#8b949e] shrink-0">
                    S{entry.season}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Request Section */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-[#c9d1d9]">Request Board Investment</h3>
          </div>

          <p className="text-xs text-[#8b949e] leading-relaxed">
            If your current board budget is insufficient, you can request additional investment for facility upgrades.
            The board&apos;s willingness depends on club reputation, finances, and recent results.
          </p>

          {/* Board willingness gauge */}
          <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Board Willingness</span>
              <span
                className={`text-xs font-bold ${
                  boardWillingness > 70 ? 'text-emerald-400' : boardWillingness > 40 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {boardWillingness}%
              </span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm"
                style={{
                  backgroundColor:
                    boardWillingness > 70 ? '#22c55e' : boardWillingness > 40 ? '#f59e0b' : '#ef4444',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${boardWillingness}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#484f58]">Reputation:</span>
                <span className="text-[9px] text-[#c9d1d9] font-medium">{clubReputation}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#484f58]">Finances:</span>
                <span className="text-[9px] text-[#c9d1d9] font-medium">{clubFinances}</span>
              </div>
            </div>
          </div>

          {/* Board response */}
          <AnimatePresence>
            {boardResponse && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-3 rounded-lg border ${
                  boardResponse.approved
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {boardResponse.approved ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        boardResponse.approved ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {boardResponse.approved ? 'Request Approved' : 'Request Declined'}
                    </p>
                    <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">
                      &ldquo;{boardResponse.message}&rdquo;
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Willingness indicators */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 mx-auto mb-1" />
              <p className="text-[9px] text-[#8b949e]">Below 40%</p>
              <p className="text-[9px] text-red-400 font-medium">Unlikely</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
              <p className="text-[9px] text-[#8b949e]">40-70%</p>
              <p className="text-[9px] text-amber-400 font-medium">Possible</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
              <p className="text-[9px] text-[#8b949e]">Above 70%</p>
              <p className="text-[9px] text-emerald-400 font-medium">Likely</p>
            </div>
          </div>

          <Button
            onClick={handleBoardRequest}
            disabled={boardRequestSubmitted}
            className={`w-full rounded-lg font-semibold text-xs ${
              boardRequestSubmitted
                ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {boardRequestSubmitted ? 'Request Submitted' : 'Submit Investment Request'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
