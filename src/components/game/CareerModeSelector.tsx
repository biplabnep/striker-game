'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Swords,
  GraduationCap,
  Briefcase,
  Sparkles,
  Globe,
  Compass,
  Play,
  Plus,
  FolderOpen,
  ChevronRight,
  Check,
  X,
  Clock,
  Trophy,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Flag,
  BarChart3,
  Settings,
  Star,
  ArrowRight,
  Lock,
  Activity,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type CareerModeId = 'player_career' | 'coach_career' | 'fantasy_draft' | 'international';
type ModeStatus = 'active' | 'available' | 'locked';
type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'legendary';

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

interface CareerModeConfig {
  id: CareerModeId;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockRequirement: string;
  status: ModeStatus;
  recommended: boolean;
  accentColor: string;
  bgColor: string;
}

interface FeatureComparison {
  feature: string;
  playerCareer: boolean;
  coachCareer: boolean;
  fantasyDraft: boolean;
  international: boolean;
}

interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  season: number;
  mode: CareerModeId;
  icon: React.ReactNode;
  color: string;
}

interface RecentSave {
  id: string;
  name: string;
  savedAt: string;
  screen: string;
  season: number;
  week: number;
}

// ============================================================
// Constants
// ============================================================

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { level: 'easy', label: 'Easy', description: 'Relaxed progression, forgiving matches, more transfer offers', color: '#34d399', bgColor: 'bg-[#34d399]/10' },
  { level: 'normal', label: 'Normal', description: 'Balanced challenge, realistic progression', color: '#60a5fa', bgColor: 'bg-[#60a5fa]/10' },
  { level: 'hard', label: 'Hard', description: 'Tough matches, slower growth, fewer opportunities', color: '#f59e0b', bgColor: 'bg-[#f59e0b]/10' },
  { level: 'legendary', label: 'Legendary', description: 'Maximum difficulty, prove you are the best', color: '#ef4444', bgColor: 'bg-[#ef4444]/10' },
];

const MODE_ACCENT_COLORS: Record<CareerModeId, string> = {
  player_career: '#34d399',
  coach_career: '#60a5fa',
  fantasy_draft: '#a78bfa',
  international: '#f472b6',
};

const MODE_BG_COLORS: Record<CareerModeId, string> = {
  player_career: 'bg-[#34d399]/5',
  coach_career: 'bg-[#60a5fa]/5',
  fantasy_draft: 'bg-[#a78bfa]/5',
  international: 'bg-[#f472b6]/5',
};

const FEATURE_COMPARISONS: FeatureComparison[] = [
  { feature: 'Play Matches', playerCareer: true, coachCareer: false, fantasyDraft: false, international: true },
  { feature: 'Manage Squad', playerCareer: false, coachCareer: true, fantasyDraft: true, international: false },
  { feature: 'Tactics', playerCareer: false, coachCareer: true, fantasyDraft: true, international: false },
  { feature: 'Transfers', playerCareer: true, coachCareer: true, fantasyDraft: true, international: false },
  { feature: 'Training', playerCareer: true, coachCareer: true, fantasyDraft: false, international: true },
  { feature: 'Youth Academy', playerCareer: true, coachCareer: true, fantasyDraft: false, international: false },
  { feature: 'Draft System', playerCareer: false, coachCareer: false, fantasyDraft: true, international: false },
  { feature: 'International Duty', playerCareer: true, coachCareer: false, fantasyDraft: false, international: true },
  { feature: 'Tournaments', playerCareer: false, coachCareer: true, fantasyDraft: true, international: true },
  { feature: 'Board Expectations', playerCareer: false, coachCareer: true, fantasyDraft: false, international: false },
];

// ============================================================
// Helper Components
// ============================================================

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-[#c9d1d9]">{title}</h2>
      {subtitle && <p className="text-xs text-[#8b949e] mt-1">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: ModeStatus }) {
  const config: Record<ModeStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/30' },
    available: { label: 'Available', className: 'bg-[#60a5fa]/15 text-[#60a5fa] border-[#60a5fa]/30' },
    locked: { label: 'Locked', className: 'bg-[#484f58]/30 text-[#8b949e] border-[#484f58]/50' },
  };
  const c = config[status];
  return (
    <Badge className={`${c.className} border text-[10px] px-2 py-0.5 rounded-lg`}>
      {status === 'locked' && <Lock className="h-2.5 w-2.5 mr-1" />}
      {c.label}
    </Badge>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 bg-[#21262d] rounded-lg px-3 py-2">
      <span className="text-[#8b949e]">{icon}</span>
      <div>
        <p className="text-[10px] text-[#8b949e] leading-tight">{label}</p>
        <p className="text-sm font-semibold text-[#c9d1d9] leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// Inline SVG Illustrations for each mode
// ============================================================

function PlayerCareerIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="12" fill="#34d399" opacity="0.1" />
      <circle cx="40" cy="28" r="10" fill="#34d399" opacity="0.3" />
      <path d="M24 60 C24 46, 32 40, 40 40 C48 40, 56 46, 56 60" fill="#34d399" opacity="0.3" />
      <path d="M20 56 L16 72" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 56 L64 72" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="26" r="2" fill="#34d399" />
      <path d="M36 34 Q40 38 44 34" stroke="#34d399" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function CoachCareerIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="12" fill="#60a5fa" opacity="0.1" />
      <circle cx="40" cy="28" r="10" fill="#60a5fa" opacity="0.3" />
      <path d="M24 60 C24 46, 32 40, 40 40 C48 40, 56 46, 56 60" fill="#60a5fa" opacity="0.3" />
      <rect x="28" y="50" width="24" height="14" rx="3" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5" />
      <path d="M32 57 L36 53 L40 57 L44 53 L48 57" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="26" r="2" fill="#60a5fa" />
    </svg>
  );
}

function FantasyDraftIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="12" fill="#a78bfa" opacity="0.1" />
      <path d="M20 58 L40 18 L60 58 Z" fill="#a78bfa" opacity="0.2" stroke="#a78bfa" strokeWidth="1.5" />
      <circle cx="40" cy="38" r="4" fill="#a78bfa" opacity="0.4" />
      <path d="M34 46 L40 38 L46 46" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M32 58 L40 48 L48 58" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="28" cy="24" r="2" fill="#a78bfa" opacity="0.3" />
      <circle cx="52" cy="24" r="2" fill="#a78bfa" opacity="0.3" />
      <circle cx="40" cy="16" r="2" fill="#a78bfa" opacity="0.3" />
    </svg>
  );
}

function InternationalIllustration() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <rect x="8" y="8" width="64" height="64" rx="12" fill="#f472b6" opacity="0.1" />
      <circle cx="40" cy="40" r="22" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity="0.3" />
      <ellipse cx="40" cy="40" rx="10" ry="22" stroke="#f472b6" strokeWidth="1" fill="none" opacity="0.25" />
      <line x1="18" y1="40" x2="62" y2="40" stroke="#f472b6" strokeWidth="1" opacity="0.25" />
      <line x1="20" y1="30" x2="60" y2="30" stroke="#f472b6" strokeWidth="0.75" opacity="0.2" />
      <line x1="20" y1="50" x2="60" y2="50" stroke="#f472b6" strokeWidth="0.75" opacity="0.2" />
      <path d="M26 20 L28 16 L30 20" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity="0.5" />
      <circle cx="40" cy="40" r="4" fill="#f472b6" opacity="0.3" />
    </svg>
  );
}

const MODE_ILLUSTRATIONS: Record<CareerModeId, () => React.ReactNode> = {
  player_career: PlayerCareerIllustration,
  coach_career: CoachCareerIllustration,
  fantasy_draft: FantasyDraftIllustration,
  international: InternationalIllustration,
};

// ============================================================
// Main Component
// ============================================================

export default function CareerModeSelector() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const difficulty = useGameStore(state => state.gameState?.difficulty ?? 'normal');

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(difficulty as DifficultyLevel);
  const [expandedMode, setExpandedMode] = useState<CareerModeId | null>(null);

  // ---- Computed data from game state ----

  const careerSummary = useMemo(() => {
    if (!gameState) {
      return {
        clubName: 'No Career',
        season: 0,
        week: 0,
        overall: 0,
        position: 'ST' as string,
        playerName: 'Player',
        age: 0,
        trophies: 0,
        totalGoals: 0,
        totalAssists: 0,
      };
    }
    return {
      clubName: gameState.currentClub.name,
      season: gameState.currentSeason,
      week: gameState.currentWeek,
      overall: gameState.player.overall,
      position: gameState.player.position,
      playerName: gameState.player.name,
      age: gameState.player.age,
      trophies: gameState.player.careerStats.trophies.length,
      totalGoals: gameState.player.careerStats.totalGoals,
      totalAssists: gameState.player.careerStats.totalAssists,
    };
  }, [gameState]);

  const careerModes = useMemo<CareerModeConfig[]>(() => {
    const season = careerSummary.season;
    const hasCoachingUnlocks = season >= 3;

    const modes: CareerModeConfig[] = [
      {
        id: 'player_career',
        title: 'Player Career',
        description: 'Live the dream of becoming a football legend',
        icon: <Swords className="h-6 w-6" />,
        unlockRequirement: 'Always available',
        status: 'active',
        recommended: season <= 2,
        accentColor: MODE_ACCENT_COLORS.player_career,
        bgColor: MODE_BG_COLORS.player_career,
      },
      {
        id: 'coach_career',
        title: 'Coach Career',
        description: 'Build your legacy from the touchline',
        icon: <GraduationCap className="h-6 w-6" />,
        unlockRequirement: 'Available after Season 3',
        status: hasCoachingUnlocks ? 'available' : 'locked',
        recommended: season >= 3 && season < 5,
        accentColor: MODE_ACCENT_COLORS.coach_career,
        bgColor: MODE_BG_COLORS.coach_career,
      },
      {
        id: 'fantasy_draft',
        title: 'Fantasy Draft',
        description: 'Draft your dream squad from scratch',
        icon: <Sparkles className="h-6 w-6" />,
        unlockRequirement: 'Available after Season 2',
        status: season >= 2 ? 'available' : 'locked',
        recommended: false,
        accentColor: MODE_ACCENT_COLORS.fantasy_draft,
        bgColor: MODE_BG_COLORS.fantasy_draft,
      },
      {
        id: 'international',
        title: 'International',
        description: 'Represent your country on the world stage',
        icon: <Globe className="h-6 w-6" />,
        unlockRequirement: 'Requires national team call-up',
        status: (gameState?.internationalCareer.caps ?? 0) > 0 ? 'available' : 'locked',
        recommended: (gameState?.internationalCareer.caps ?? 0) > 0,
        accentColor: MODE_ACCENT_COLORS.international,
        bgColor: MODE_BG_COLORS.international,
      },
    ];
    return modes;
  }, [careerSummary.season, gameState]);

  const careerMilestones = useMemo<CareerMilestone[]>(() => {
    const milestones: CareerMilestone[] = [];

    if (!gameState) {
      return milestones;
    }

    // Player career milestones
    if (gameState.player.careerStats.totalGoals > 0) {
      milestones.push({
        id: 'first-goal',
        title: 'First Goal',
        description: 'Scored your first professional goal',
        season: 1,
        mode: 'player_career',
        icon: <Target className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.player_career,
      });
    }

    if (gameState.player.careerStats.totalGoals >= 10) {
      milestones.push({
        id: 'ten-goals',
        title: 'Double Digits',
        description: 'Reached 10 career goals',
        season: Math.min(careerSummary.season, 3),
        mode: 'player_career',
        icon: <Zap className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.player_career,
      });
    }

    if (gameState.player.careerStats.totalGoals >= 50) {
      milestones.push({
        id: 'fifty-goals',
        title: 'Half Century',
        description: 'Reached 50 career goals',
        season: Math.min(careerSummary.season, 6),
        mode: 'player_career',
        icon: <Trophy className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.player_career,
      });
    }

    if (gameState.player.careerStats.trophies.length > 0) {
      milestones.push({
        id: 'first-trophy',
        title: 'First Trophy',
        description: `Won the ${gameState.player.careerStats.trophies[0].name}`,
        season: gameState.player.careerStats.trophies[0].season,
        mode: 'player_career',
        icon: <Trophy className="h-4 w-4" />,
        color: '#f59e0b',
      });
    }

    if (gameState.player.overall >= 80) {
      milestones.push({
        id: 'world-class',
        title: 'World Class',
        description: 'Reached 80+ overall rating',
        season: Math.min(careerSummary.season, 5),
        mode: 'player_career',
        icon: <Star className="h-4 w-4" />,
        color: '#34d399',
      });
    }

    // International milestones
    if (gameState.internationalCareer.caps > 0) {
      milestones.push({
        id: 'first-cap',
        title: 'First International Cap',
        description: 'Made your international debut',
        season: gameState.internationalCareer.lastCallUpSeason || 2,
        mode: 'international',
        icon: <Flag className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.international,
      });
    }

    if (gameState.internationalCareer.goals >= 5) {
      milestones.push({
        id: 'five-intl-goals',
        title: 'International Scorer',
        description: 'Scored 5 international goals',
        season: Math.min(careerSummary.season, 4),
        mode: 'international',
        icon: <Target className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.international,
      });
    }

    // Coach milestones (if applicable)
    if (careerSummary.season >= 3) {
      milestones.push({
        id: 'coaching-unlock',
        title: 'Coaching Path Unlocked',
        description: 'Coach Career mode became available',
        season: 3,
        mode: 'coach_career',
        icon: <GraduationCap className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.coach_career,
      });
    }

    // Fantasy draft milestone
    if (careerSummary.season >= 2) {
      milestones.push({
        id: 'draft-unlock',
        title: 'Fantasy Draft Unlocked',
        description: 'Fantasy Draft mode became available',
        season: 2,
        mode: 'fantasy_draft',
        icon: <Sparkles className="h-4 w-4" />,
        color: MODE_ACCENT_COLORS.fantasy_draft,
      });
    }

    // Sort by season
    milestones.sort((a, b) => a.season - b.season);
    return milestones;
  }, [gameState, careerSummary.season]);

  const recentSaves = useMemo<RecentSave[]>(() => {
    const saves: RecentSave[] = [];

    if (!gameState) return saves;

    saves.push({
      id: 'auto-1',
      name: 'Auto Save',
      savedAt: gameState.lastSaved || new Date().toISOString(),
      screen: 'dashboard',
      season: gameState.currentSeason,
      week: gameState.currentWeek,
    });

    // Generate deterministic recent saves from game state
    if (gameState.currentSeason > 1) {
      saves.push({
        id: 'season-end-1',
        name: `Season ${gameState.currentSeason - 1} End`,
        savedAt: gameState.lastSaved || new Date().toISOString(),
        screen: 'career_hub',
        season: gameState.currentSeason - 1,
        week: 38,
      });
    }

    if (gameState.currentSeason > 2) {
      saves.push({
        id: 'mid-season-2',
        name: `Season ${gameState.currentSeason - 1} Mid`,
        savedAt: gameState.lastSaved || new Date().toISOString(),
        screen: 'dashboard',
        season: gameState.currentSeason - 1,
        week: 19,
      });
    }

    return saves.slice(0, 3);
  }, [gameState]);

  const gameSettings = useMemo(() => {
    const matchSpeedMap: Record<string, string> = { easy: 'Slow', normal: 'Normal', hard: 'Fast', legendary: 'Very Fast' };
    const seasonLength = gameState ? Math.round((gameState.upcomingFixtures.length) / 2) : 38;

    return {
      difficulty: gameState?.difficulty ?? 'normal',
      matchSpeed: matchSpeedMap[gameState?.difficulty ?? 'normal'] ?? 'Normal',
      seasonLength: seasonLength,
      weatherEffects: gameState?.weatherPreparation ?? 'standard',
      trainingFocus: gameState?.seasonTrainingFocus?.area ?? 'balanced',
    };
  }, [gameState]);

  // ---- Handlers ----

  const handleSelectMode = (mode: CareerModeConfig) => {
    if (mode.status === 'locked') return;

    const screenMap: Record<CareerModeId, string> = {
      player_career: 'dashboard',
      coach_career: 'coach_career',
      fantasy_draft: 'fantasy_draft',
      international: 'international_tournament',
    };

    setScreen(screenMap[mode.id] as typeof setScreen extends (s: infer S) => void ? S : never);
  };

  const handleContinueCareer = () => {
    setScreen('dashboard');
  };

  const handleNewCareer = () => {
    setScreen('career_setup');
  };

  const handleLoadSave = () => {
    setScreen('save_load');
  };

  // ---- Render ----

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ============================================================ */}
        {/* 1. HERO HEADER                                              */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Compass className="h-7 w-7 text-emerald-400" />
                  <h1 className="text-2xl font-bold text-[#c9d1d9]">Choose Your Path</h1>
                </div>
                <p className="text-sm text-[#8b949e] mb-4">
                  Select a career mode or continue where you left off. Each path offers a unique football experience.
                </p>

                {/* Career Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill
                    icon={<Shield className="h-4 w-4" />}
                    label="Current Club"
                    value={careerSummary.clubName}
                  />
                  <StatPill
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Season"
                    value={careerSummary.season}
                  />
                  <StatPill
                    icon={<Star className="h-4 w-4" />}
                    label="Overall"
                    value={careerSummary.overall}
                  />
                  <StatPill
                    icon={<Trophy className="h-4 w-4" />}
                    label="Trophies"
                    value={careerSummary.trophies}
                  />
                </div>
              </div>

              {/* Active Mode Badge */}
              <div className="ml-4 flex-shrink-0">
                <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#8b949e] mb-1">Active Mode</p>
                  <Badge className="bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 text-xs px-3 py-1 rounded-lg">
                    Player Career
                  </Badge>
                </div>
              </div>
            </div>

            {/* Player mini profile */}
            {gameState && (
              <div className="mt-4 pt-4 border-t border-[#21262d] flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#21262d] flex items-center justify-center">
                  <span className="text-lg">
                    {careerSummary.position === 'GK' ? '🧤' : '⚽'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c9d1d9] truncate">{careerSummary.playerName}</p>
                  <p className="text-xs text-[#8b949e]">
                    Age {careerSummary.age} · {careerSummary.position} · Season {careerSummary.season}, Week {careerSummary.week}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-[#34d399]" />
                    {careerSummary.totalGoals} goals
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-[#60a5fa]" />
                    {careerSummary.totalAssists} assists
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* 2. CAREER MODE CARDS                                        */}
        {/* ============================================================ */}
        <section>
          <SectionHeader
            title="Career Modes"
            subtitle="Choose your football journey — each mode offers a unique gameplay experience"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerModes.map((mode, index) => {
              const Illustration = MODE_ILLUSTRATIONS[mode.id];
              const isExpanded = expandedMode === mode.id;

              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.06 }}
                  className={`${mode.id === 'player_career' && mode.status === 'active' ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                >
                  <div
                    className={`relative bg-[#161b22] border rounded-2xl p-5 transition-all cursor-pointer h-full ${
                      isExpanded
                        ? 'border-[#30363d] shadow-lg'
                        : mode.status === 'active'
                        ? 'border-emerald-500/30'
                        : mode.status === 'available'
                        ? 'border-[#30363d] hover:border-[#484f58]'
                        : 'border-[#21262d] opacity-70'
                    }`}
                    onClick={() => setExpandedMode(isExpanded ? null : mode.id)}
                  >
                    {/* Recommended badge */}
                    {mode.recommended && (
                      <div className="absolute -top-2 right-4">
                        <Badge className="bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 text-[10px] px-2 py-0.5 rounded-lg">
                          Recommended
                        </Badge>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {Illustration()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-[#c9d1d9]">{mode.title}</h3>
                          <StatusBadge status={mode.status} />
                        </div>
                        <p className="text-xs text-[#8b949e]">{mode.description}</p>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <div
                      className={`transition-opacity duration-200 ${
                        isExpanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'
                      }`}
                      style={{ maxHeight: isExpanded ? '600px' : '0px' }}
                    >
                      <div className="pt-3 border-t border-[#21262d] space-y-3">
                        {/* Mode-specific content */}
                        {mode.id === 'player_career' && (
                          <PlayerCareerDetails
                            season={careerSummary.season}
                            totalGoals={careerSummary.totalGoals}
                            totalAssists={careerSummary.totalAssists}
                            trophies={careerSummary.trophies}
                            selectedDifficulty={selectedDifficulty}
                            onDifficultyChange={setSelectedDifficulty}
                          />
                        )}
                        {mode.id === 'coach_career' && (
                          <CoachCareerDetails
                            season={careerSummary.season}
                            isUnlocked={mode.status !== 'locked'}
                          />
                        )}
                        {mode.id === 'fantasy_draft' && (
                          <FantasyDraftDetails
                            season={careerSummary.season}
                            isUnlocked={mode.status !== 'locked'}
                            budget={gameState?.currentClub.budget ?? 0}
                          />
                        )}
                        {mode.id === 'international' && (
                          <InternationalModeDetails
                            isUnlocked={mode.status !== 'locked'}
                            caps={gameState?.internationalCareer.caps ?? 0}
                            goals={gameState?.internationalCareer.goals ?? 0}
                            tournaments={gameState?.internationalCareer.tournaments ?? []}
                            nationality={gameState?.player.nationality ?? ''}
                          />
                        )}

                        {/* Unlock requirement */}
                        {mode.status === 'locked' && (
                          <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-3 py-2">
                            <Lock className="h-3.5 w-3.5" />
                            <span>{mode.unlockRequirement}</span>
                          </div>
                        )}

                        {/* Select button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMode(mode);
                          }}
                          disabled={mode.status === 'locked'}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            mode.status === 'locked'
                              ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                              : 'bg-[#238636] hover:bg-[#2ea043] text-white'
                          }`}
                        >
                          {mode.status === 'active' ? (
                            <>
                              <Play className="h-4 w-4" />
                              Continue
                            </>
                          ) : mode.status === 'locked' ? (
                            <>
                              <Lock className="h-4 w-4" />
                              Locked
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4" />
                              Select
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    {!isExpanded && (
                      <div className="flex items-center justify-center mt-3 text-[#484f58]">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. MODE COMPARISON TABLE                                    */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <SectionHeader
            title="Mode Comparison"
            subtitle="Compare features across all career modes at a glance"
          />

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left text-xs font-semibold text-[#8b949e] px-4 py-3">Feature</th>
                    <th className="text-center text-xs font-semibold px-3 py-3" style={{ color: MODE_ACCENT_COLORS.player_career }}>Player</th>
                    <th className="text-center text-xs font-semibold px-3 py-3" style={{ color: MODE_ACCENT_COLORS.coach_career }}>Coach</th>
                    <th className="text-center text-xs font-semibold px-3 py-3" style={{ color: MODE_ACCENT_COLORS.fantasy_draft }}>Draft</th>
                    <th className="text-center text-xs font-semibold px-3 py-3" style={{ color: MODE_ACCENT_COLORS.international }}>Intl</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISONS.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={idx % 2 === 0 ? 'bg-[#0d1117]/30' : ''}
                    >
                      <td className="text-xs text-[#c9d1d9] px-4 py-2.5">{row.feature}</td>
                      <td className="text-center px-3 py-2.5">
                        {row.playerCareer ? (
                          <Check className="h-4 w-4 mx-auto" style={{ color: MODE_ACCENT_COLORS.player_career }} />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-[#484f58]" />
                        )}
                      </td>
                      <td className="text-center px-3 py-2.5">
                        {row.coachCareer ? (
                          <Check className="h-4 w-4 mx-auto" style={{ color: MODE_ACCENT_COLORS.coach_career }} />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-[#484f58]" />
                        )}
                      </td>
                      <td className="text-center px-3 py-2.5">
                        {row.fantasyDraft ? (
                          <Check className="h-4 w-4 mx-auto" style={{ color: MODE_ACCENT_COLORS.fantasy_draft }} />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-[#484f58]" />
                        )}
                      </td>
                      <td className="text-center px-3 py-2.5">
                        {row.international ? (
                          <Check className="h-4 w-4 mx-auto" style={{ color: MODE_ACCENT_COLORS.international }} />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-[#484f58]" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* 4. CAREER HIGHLIGHTS REEL                                   */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SectionHeader
            title="Career Highlights"
            subtitle={`Your football journey so far — ${careerMilestones.length} milestone${careerMilestones.length !== 1 ? 's' : ''} achieved`}
          />

          {careerMilestones.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center">
              <Clock className="h-8 w-8 text-[#484f58] mx-auto mb-3" />
              <p className="text-sm text-[#8b949e]">No milestones yet. Start playing to build your legacy!</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-3" style={{ minWidth: `${careerMilestones.length * 200}px` }}>
                {careerMilestones.map((milestone, idx) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="flex-shrink-0 w-[180px] bg-[#161b22] border border-[#30363d] rounded-xl p-3 relative"
                  >
                    {/* Mode color indicator */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                      style={{ backgroundColor: milestone.color }}
                    />

                    <div className="pl-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: milestone.color }}>{milestone.icon}</span>
                        <Badge
                          className="text-[9px] px-1.5 py-0 rounded-md border"
                          style={{
                            color: milestone.color,
                            borderColor: `${milestone.color}33`,
                            backgroundColor: `${milestone.color}15`,
                          }}
                        >
                          S{milestone.season}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-[#c9d1d9] mb-0.5 truncate">{milestone.title}</p>
                      <p className="text-[10px] text-[#8b949e] leading-snug">{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* ============================================================ */}
        {/* 5. QUICK START OPTIONS                                      */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <SectionHeader
            title="Quick Start"
            subtitle="Jump right back into the action"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleContinueCareer}
              className="flex items-center gap-3 bg-[#238636] hover:bg-[#2ea043] rounded-xl px-5 py-4 transition-all text-left"
            >
              <Play className="h-6 w-6 text-white flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Continue Career</p>
                <p className="text-xs text-[#c9d1d9]/70">Resume your current season</p>
              </div>
            </button>

            <button
              onClick={handleNewCareer}
              className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] hover:border-[#484f58] rounded-xl px-5 py-4 transition-all text-left"
            >
              <Plus className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#c9d1d9]">New Career</p>
                <p className="text-xs text-[#8b949e]">Start from scratch</p>
              </div>
            </button>

            <button
              onClick={handleLoadSave}
              className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] hover:border-[#484f58] rounded-xl px-5 py-4 transition-all text-left"
            >
              <FolderOpen className="h-6 w-6 text-[#60a5fa] flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#c9d1d9]">Load Save</p>
                <p className="text-xs text-[#8b949e]">Browse your saved games</p>
              </div>
            </button>
          </div>

          {/* Recent Saves */}
          {recentSaves.length > 0 && (
            <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#8b949e]" />
                <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide">Recent Saves</h3>
              </div>
              <div className="space-y-2">
                {recentSaves.map((save) => (
                  <button
                    key={save.id}
                    onClick={() => setScreen('save_load')}
                    className="w-full flex items-center justify-between bg-[#0d1117] hover:bg-[#21262d] rounded-lg px-4 py-3 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-[#c9d1d9]">{save.name}</p>
                        <p className="text-[10px] text-[#8b949e]">
                          Season {save.season}, Week {save.week} · {new Date(save.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* ============================================================ */}
        {/* 6. SETTINGS PREVIEW                                         */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <SectionHeader
            title="Current Settings"
            subtitle="Your active game configuration"
          />

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#21262d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="h-3.5 w-3.5 text-[#8b949e]" />
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Difficulty</p>
                </div>
                <p className="text-sm font-bold capitalize" style={{ color: DIFFICULTY_OPTIONS.find(d => d.level === gameSettings.difficulty)?.color ?? '#c9d1d9' }}>
                  {gameSettings.difficulty}
                </p>
              </div>

              <div className="bg-[#21262d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-[#8b949e]" />
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Match Speed</p>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9]">{gameSettings.matchSpeed}</p>
              </div>

              <div className="bg-[#21262d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Season Length</p>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9]">{gameSettings.seasonLength} matches</p>
              </div>

              <div className="bg-[#21262d] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Weather</p>
                </div>
                <p className="text-sm font-bold text-[#c9d1d9] capitalize">{gameSettings.weatherEffects}</p>
              </div>
            </div>

            <button
              onClick={() => setScreen('settings')}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] rounded-xl px-4 py-2.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-all"
            >
              <Settings className="h-3.5 w-3.5" />
              Open Full Settings
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

// ============================================================
// Mode Detail Sub-Components
// ============================================================

function PlayerCareerDetails({
  season,
  totalGoals,
  totalAssists,
  trophies,
  selectedDifficulty,
  onDifficultyChange,
}: {
  season: number;
  totalGoals: number;
  totalAssists: number;
  trophies: number;
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (d: DifficultyLevel) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Progress stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#21262d] rounded-lg px-3 py-2">
          <p className="text-[10px] text-[#8b949e]">Seasons</p>
          <p className="text-sm font-bold text-[#34d399]">{season}</p>
        </div>
        <div className="bg-[#21262d] rounded-lg px-3 py-2">
          <p className="text-[10px] text-[#8b949e]">Goals</p>
          <p className="text-sm font-bold text-[#34d399]">{totalGoals}</p>
        </div>
        <div className="bg-[#21262d] rounded-lg px-3 py-2">
          <p className="text-[10px] text-[#8b949e]">Assists</p>
          <p className="text-sm font-bold text-[#34d399]">{totalAssists}</p>
        </div>
        <div className="bg-[#21262d] rounded-lg px-3 py-2">
          <p className="text-[10px] text-[#8b949e]">Trophies</p>
          <p className="text-sm font-bold text-[#f59e0b]">{trophies}</p>
        </div>
      </div>

      {/* Difficulty selector */}
      <div>
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Difficulty</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              onClick={() => onDifficultyChange(opt.level)}
              className={`rounded-lg px-3 py-2 text-left transition-all border ${
                selectedDifficulty === opt.level
                  ? `${opt.bgColor} border-current`
                  : 'bg-[#21262d] border-[#21262d] hover:border-[#30363d]'
              }`}
              style={
                selectedDifficulty === opt.level
                  ? { color: opt.color, borderColor: `${opt.color}40` }
                  : undefined
              }
            >
              <p className="text-xs font-semibold" style={selectedDifficulty === opt.level ? { color: opt.color } : { color: '#c9d1d9' }}>
                {opt.label}
              </p>
              <p className="text-[9px] text-[#8b949e] leading-snug mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="flex items-center gap-2 bg-[#34d399]/5 border border-[#34d399]/20 rounded-lg px-3 py-2">
        <Star className="h-3.5 w-3.5 text-[#34d399]" />
        <p className="text-[10px] text-[#8b949e]">Recommended for <span className="text-[#34d399] font-semibold">new players</span></p>
      </div>
    </div>
  );
}

function CoachCareerDetails({ season, isUnlocked }: { season: number; isUnlocked: boolean }) {
  return (
    <div className="space-y-3">
      {isUnlocked ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Coaching Level</p>
              <p className="text-sm font-bold text-[#60a5fa]">{Math.min(Math.floor((season - 3) * 0.5) + 1, 5)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Seasons Managed</p>
              <p className="text-sm font-bold text-[#60a5fa]">{Math.max(season - 3, 0)}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Win Rate</p>
              <p className="text-sm font-bold text-[#60a5fa]">{Math.min(40 + season * 3, 72)}%</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Tactical Style</p>
              <p className="text-sm font-bold text-[#60a5fa]">Balanced</p>
            </div>
          </div>

          {/* Tactical Philosophy Preview */}
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Tactical Philosophy</p>
            <div className="space-y-2">
              {[
                { label: 'Attacking', value: 65 },
                { label: 'Possession', value: 55 },
                { label: 'Pressing', value: 70 },
                { label: 'Defensive', value: 45 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8b949e] w-20">{item.label}</span>
                  <div className="flex-1 h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: '#60a5fa',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8b949e] w-6 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#60a5fa]/5 border border-[#60a5fa]/20 rounded-lg px-3 py-2">
            <GraduationCap className="h-3.5 w-3.5 text-[#60a5fa]" />
            <p className="text-[10px] text-[#8b949e]">Unlocked at <span className="text-[#60a5fa] font-semibold">Season 3</span></p>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <Lock className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
          <p className="text-xs text-[#8b949e]">Available after Season 3</p>
          <p className="text-[10px] text-[#484f58] mt-1">
            {Math.max(3 - season, 0)} season{3 - season !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
}

function FantasyDraftDetails({ season, isUnlocked, budget }: { season: number; isUnlocked: boolean; budget: number }) {
  return (
    <div className="space-y-3">
      {isUnlocked ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Draft Budget</p>
              <p className="text-sm font-bold text-[#a78bfa]">€{(budget / 1_000_000).toFixed(0)}M</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Squad Value</p>
              <p className="text-sm font-bold text-[#a78bfa]">€{(budget * 1.5 / 1_000_000).toFixed(0)}M</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Squad Size</p>
              <p className="text-sm font-bold text-[#a78bfa]">25/25</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Avg. Rating</p>
              <p className="text-sm font-bold text-[#a78bfa]">78.4</p>
            </div>
          </div>

          {/* Budget Bar */}
          <div className="bg-[#21262d] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Budget Used</p>
              <p className="text-[10px] text-[#a78bfa] font-semibold">€{(budget * 0.65 / 1_000_000).toFixed(0)}M / €{(budget / 1_000_000).toFixed(0)}M</p>
            </div>
            <div className="h-2.5 bg-[#0d1117] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm bg-[#a78bfa] opacity-70"
                style={{ width: '65%' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#a78bfa]/5 border border-[#a78bfa]/20 rounded-lg px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-[#a78bfa]" />
            <p className="text-[10px] text-[#8b949e]">Build your <span className="text-[#a78bfa] font-semibold">dream squad</span> from scratch</p>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <Lock className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
          <p className="text-xs text-[#8b949e]">Available after Season 2</p>
          <p className="text-[10px] text-[#484f58] mt-1">
            {Math.max(2 - season, 0)} season{2 - season !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
}

function InternationalModeDetails({
  isUnlocked,
  caps,
  goals,
  tournaments,
  nationality,
}: {
  isUnlocked: boolean;
  caps: number;
  goals: number;
  tournaments: string[];
  nationality: string;
}) {
  return (
    <div className="space-y-3">
      {isUnlocked ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">National Team</p>
              <p className="text-sm font-bold text-[#f472b6]">{nationality}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Caps</p>
              <p className="text-sm font-bold text-[#f472b6]">{caps}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Intl. Goals</p>
              <p className="text-sm font-bold text-[#f472b6]">{goals}</p>
            </div>
            <div className="bg-[#21262d] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#8b949e]">Tournaments</p>
              <p className="text-sm font-bold text-[#f472b6]">{tournaments.length}</p>
            </div>
          </div>

          {/* Tournament History */}
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Tournament History</p>
            {tournaments.length > 0 ? (
              <div className="space-y-1.5">
                {tournaments.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-[#c9d1d9]">{t}</span>
                    <Trophy className="h-3.5 w-3.5 text-[#f59e0b]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#484f58]">No tournaments played yet</p>
            )}
          </div>

          {/* Qualification Status */}
          <div className="bg-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-2">Qualification Status</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[#34d399]" />
                <span className="text-[10px] text-[#c9d1d9]">World Cup</span>
              </div>
              <span className="text-[10px] text-[#8b949e]">In Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[#60a5fa]" />
                <span className="text-[10px] text-[#c9d1d9]">Continental</span>
              </div>
              <span className="text-[10px] text-[#8b949e]">Qualified</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#f472b6]/5 border border-[#f472b6]/20 rounded-lg px-3 py-2">
            <Flag className="h-3.5 w-3.5 text-[#f472b6]" />
            <p className="text-[10px] text-[#8b949e]">Represent <span className="text-[#f472b6] font-semibold">{nationality}</span> on the world stage</p>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <Lock className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
          <p className="text-xs text-[#8b949e]">Requires national team call-up</p>
          <p className="text-[10px] text-[#484f58] mt-1">
            Build your reputation to earn international recognition
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#484f58]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Reach 70+ reputation for call-up consideration</span>
          </div>
        </div>
      )}
    </div>
  );
}
