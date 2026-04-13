'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Position, POSITION_GROUPS } from '@/lib/game/types';
import { NATIONALITIES, POSITIONS, generatePlayerName } from '@/lib/game/playerData';
import { ENRICHED_CLUBS, LEAGUES } from '@/lib/game/clubsData';
import { getOverallColor } from '@/lib/game/gameUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Shield,
  Rocket,
  Dices,
  Search,
  Check,
  ChevronDown,
  Star,
  Zap,
  Swords,
  Timer,
  TrendingDown,
} from 'lucide-react';

// -----------------------------------------------------------
// Position descriptions & key attributes for detail cards
// -----------------------------------------------------------
const POSITION_DETAILS: Record<
  Position,
  { description: string; keyAttrs: { label: string; value: string }[] }
> = {
  GK: {
    description: 'Command the penalty area, make crucial saves, and organize your defense.',
    keyAttrs: [
      { label: 'Reflexes', value: '92' },
      { label: 'Handling', value: '87' },
      { label: 'Positioning', value: '85' },
    ],
  },
  CB: {
    description: 'Anchor the backline with strong tackling, aerial dominance, and positioning.',
    keyAttrs: [
      { label: 'Defending', value: '88' },
      { label: 'Physical', value: '84' },
      { label: 'Heading', value: '82' },
    ],
  },
  LB: {
    description: 'Patrol the left flank, overlap in attack, and track back defensively.',
    keyAttrs: [
      { label: 'Pace', value: '82' },
      { label: 'Defending', value: '78' },
      { label: 'Crossing', value: '74' },
    ],
  },
  RB: {
    description: 'Patrol the right flank, overlap in attack, and track back defensively.',
    keyAttrs: [
      { label: 'Pace', value: '82' },
      { label: 'Defending', value: '78' },
      { label: 'Crossing', value: '74' },
    ],
  },
  CDM: {
    description: 'Shield the defense, break up opposition play, and distribute efficiently.',
    keyAttrs: [
      { label: 'Defending', value: '84' },
      { label: 'Passing', value: '80' },
      { label: 'Physical', value: '82' },
    ],
  },
  CM: {
    description: 'Control the tempo of the game with passing, vision, and work rate.',
    keyAttrs: [
      { label: 'Passing', value: '84' },
      { label: 'Dribbling', value: '78' },
      { label: 'Stamina', value: '80' },
    ],
  },
  CAM: {
    description: 'Unlock defenses with creativity, through balls, and close-range finishing.',
    keyAttrs: [
      { label: 'Passing', value: '86' },
      { label: 'Dribbling', value: '84' },
      { label: 'Vision', value: '88' },
    ],
  },
  LW: {
    description: 'Beat defenders with pace and skill, deliver crosses, and cut inside to shoot.',
    keyAttrs: [
      { label: 'Pace', value: '88' },
      { label: 'Dribbling', value: '86' },
      { label: 'Crossing', value: '78' },
    ],
  },
  RW: {
    description: 'Beat defenders with pace and skill, deliver crosses, and cut inside to shoot.',
    keyAttrs: [
      { label: 'Pace', value: '88' },
      { label: 'Dribbling', value: '86' },
      { label: 'Crossing', value: '78' },
    ],
  },
  ST: {
    description: 'Lead the attack, find space in the box, and finish clinical chances.',
    keyAttrs: [
      { label: 'Shooting', value: '88' },
      { label: 'Pace', value: '82' },
      { label: 'Finishing', value: '86' },
    ],
  },
};

// -----------------------------------------------------------
// Group icons mapping
// -----------------------------------------------------------
const GROUP_ICONS: Record<string, React.ReactNode> = {
  Goalkeeper: <Timer className="h-3.5 w-3.5" />,
  Defence: <Shield className="h-3.5 w-3.5" />,
  Midfield: <Target className="h-3.5 w-3.5" />,
  Attack: <Zap className="h-3.5 w-3.5" />,
};

// -----------------------------------------------------------
// Difficulty configuration
// -----------------------------------------------------------
const DIFFICULTY_CONFIG = {
  easy: {
    icon: <Star className="h-6 w-6" />,
    color: 'emerald',
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-600/15',
    textActive: 'text-emerald-300',
    description: 'Higher potential, favorable outcomes, relaxed board expectations.',
    badge: 'Recommended for beginners',
  },
  normal: {
    icon: <Swords className="h-6 w-6" />,
    color: 'amber',
    borderActive: 'border-amber-500',
    bgActive: 'bg-amber-600/15',
    textActive: 'text-amber-300',
    description: 'Balanced experience with realistic progression and standard challenges.',
    badge: 'The authentic experience',
  },
  hard: {
    icon: <TrendingDown className="h-6 w-6" />,
    color: 'red',
    borderActive: 'border-red-500',
    bgActive: 'bg-red-600/15',
    textActive: 'text-red-300',
    description: 'Lower potential, tougher opposition, demanding board expectations.',
    badge: 'For experienced players',
  },
} as const;

// -----------------------------------------------------------
// Step definitions
// -----------------------------------------------------------
const STEPS = [
  { label: 'Profile', icon: <span className="text-sm leading-none">⚽</span> },
  { label: 'Position', icon: <Target className="h-4 w-4" /> },
  { label: 'Club', icon: <Shield className="h-4 w-4" /> },
  { label: 'Start', icon: <Rocket className="h-4 w-4" /> },
];

// ============================================================
// CareerSetup Component
// ============================================================
export default function CareerSetup() {
  const setScreen = useGameStore(state => state.setScreen);
  const startNewCareer = useGameStore(state => state.startNewCareer);

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position>('ST');
  const [clubId, setClubId] = useState('arsenal');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Step tracking
  const [activeStep, setActiveStep] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Search filters
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');

  // Collapsible leagues
  const selectedClubLeague = useMemo(
    () => ENRICHED_CLUBS.find(c => c.id === clubId)?.league,
    [clubId],
  );
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set([selectedClubLeague || 'premier_league']),
  );

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId);
      else next.add(leagueId);
      return next;
    });
  };

  // Random name generator
  const handleRandomName = useCallback(() => {
    const { firstName, lastName } = generatePlayerName(nationality);
    setName(`${firstName} ${lastName}`);
  }, [nationality]);

  // Filtered nationalities
  const filteredNationalities = useMemo(() => {
    if (!nationalitySearch.trim()) return NATIONALITIES;
    const q = nationalitySearch.toLowerCase();
    return NATIONALITIES.filter(n => n.name.toLowerCase().includes(q));
  }, [nationalitySearch]);

  // Currently selected nationality flag
  const selectedNationality = NATIONALITIES.find(n => n.name === nationality);

  // Filtered clubs per league
  const filteredClubsByLeague = useMemo(() => {
    const q = clubSearch.toLowerCase().trim();
    return LEAGUES.map(league => {
      let clubs = ENRICHED_CLUBS.filter(c => c.league === league.id);
      if (q) {
        clubs = clubs.filter(c => c.name.toLowerCase().includes(q));
      }
      return { league, clubs };
    }).filter(entry => entry.clubs.length > 0 || !q);
  }, [clubSearch]);

  const handleStart = () => {
    startNewCareer({ name, nationality, position, clubId, difficulty });
  };

  const selectedClub = ENRICHED_CLUBS.find(c => c.id === clubId);

  // Auto-advance step based on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveStep(idx);
          }
        });
      },
      { threshold: 0.4 },
    );

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Scroll to section when clicking a step
  const scrollToStep = (stepIndex: number) => {
    const ref = sectionRefs.current[stepIndex];
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Subtle dot grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='1' fill='%23c9d1d9'/%3E%3C/svg%3E")`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        {/* ---- Sticky Header ---- */}
        <div className="sticky top-0 z-20 bg-[#0d1117]/95 pt-4 pb-3">
          {/* Back + Title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScreen('main_menu')}
              className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#c9d1d9]">New Career</h1>
              <div className="h-0.5 w-16 rounded-sm bg-emerald-500 opacity-70" />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const isCompleted = i < activeStep;
              const isCurrent = i === activeStep;
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <button
                    onClick={() => scrollToStep(i)}
                    className="flex flex-col items-center gap-1 flex-1 min-w-0"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-[#161b22] border-[#30363d] text-[#484f58]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate ${
                        isCurrent ? 'text-emerald-400' : 'text-[#484f58]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 min-w-[8px]">
                      <div
                        className={`h-full rounded-sm transition-colors ${
                          i < activeStep ? 'bg-emerald-500' : 'bg-[#30363d]'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Step 1: Profile ---- */}
        <div ref={el => { sectionRefs.current[0] = el; }} className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Player Name
            </h2>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Leave blank for random name"
                className="flex-1 h-12 text-base bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
              <Button
                onClick={handleRandomName}
                variant="outline"
                className="h-12 w-12 p-0 border-[#30363d] bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-emerald-400 hover:border-emerald-500/50 rounded-lg shrink-0"
                title="Random name"
              >
                <Dices className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Nationality */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            {/* Selected nationality display */}
            {selectedNationality && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-[#21262d] rounded-lg">
                <span className="text-3xl">{selectedNationality.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#c9d1d9]">
                    {selectedNationality.name}
                  </span>
                  <span className="text-[10px] text-[#484f58]">Selected nationality</span>
                </div>
              </div>
            )}

            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Nationality
            </h2>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
              <Input
                value={nationalitySearch}
                onChange={e => setNationalitySearch(e.target.value)}
                placeholder="Search nationality..."
                className="pl-9 h-9 text-sm bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
            </div>

            {/* Nationality grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {filteredNationalities.map(n => (
                <button
                  key={n.name}
                  onClick={() => setNationality(n.name)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    nationality === n.name
                      ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  <span className="text-lg shrink-0">{n.flag}</span>
                  <span
                    className={`truncate ${
                      nationality === n.name ? 'text-emerald-300 font-medium' : 'text-[#c9d1d9]'
                    }`}
                  >
                    {n.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ---- Step 2: Position ---- */}
        <div ref={el => { sectionRefs.current[1] = el; }} className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-4">
              Position
            </h2>

            {Object.entries(POSITION_GROUPS).map(([group, posList]) => (
              <div key={group} className="mb-4 last:mb-0">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#484f58]">{GROUP_ICONS[group]}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#484f58]">
                    {group}
                  </span>
                </div>

                {/* Position buttons */}
                <div className="flex flex-wrap gap-2">
                  {posList.map(pos => {
                    const isSelected = position === pos;
                    const details = POSITION_DETAILS[pos];
                    const posInfo = POSITIONS[pos];
                    return (
                      <div key={pos} className="w-full">
                        <button
                          onClick={() => setPosition(pos)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                              : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : 'bg-[#30363d] text-[#8b949e]'
                            }`}
                          >
                            {pos}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? 'text-emerald-300' : 'text-[#c9d1d9]'
                              }`}
                            >
                              {posInfo.fullName}
                            </span>
                            <p className="text-[10px] text-[#484f58] truncate">
                              {details.description}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </button>

                        {/* Expanded detail card */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 ml-4 pl-4 border-l-2 border-emerald-500/40"
                            >
                              <div className="bg-[#0d1117] rounded-lg p-3">
                                <p className="text-xs text-[#8b949e] mb-2">{details.description}</p>
                                <div className="flex gap-2">
                                  {details.keyAttrs.map(attr => (
                                    <div
                                      key={attr.label}
                                      className="flex flex-col items-center bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5"
                                    >
                                      <span className="text-[10px] text-[#484f58]">
                                        {attr.label}
                                      </span>
                                      <span className="text-sm font-bold text-emerald-400">
                                        {attr.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ---- Step 3: Club ---- */}
        <div ref={el => { sectionRefs.current[2] = el; }} className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Starting Club
            </h2>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
              <Input
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                placeholder="Search clubs..."
                className="pl-9 h-9 text-sm bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              {filteredClubsByLeague.map(({ league, clubs }) => {
                const isExpanded = expandedLeagues.has(league.id);
                const isSelected = selectedClubLeague === league.id;
                return (
                  <div key={league.id} className="rounded-lg overflow-hidden">
                    {/* League header */}
                    <button
                      onClick={() => toggleLeague(league.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-emerald-900/20 border border-emerald-500/30'
                          : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{league.emoji}</span>
                        <span className="font-medium text-[#c9d1d9]">{league.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-[#30363d] text-[#484f58]"
                        >
                          {clubs.length}
                        </Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-[#484f58] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Club list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-2 gap-1.5 mt-1.5"
                        >
                          {clubs.map(club => {
                            const isClubSelected = clubId === club.id;
                            return (
                              <div key={club.id} className="w-full">
                                <button
                                  onClick={() => setClubId(club.id)}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-left w-full transition-colors ${
                                    isClubSelected
                                      ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                                      : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                                  }`}
                                >
                                  <span className="text-lg shrink-0">{club.logo}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#c9d1d9] truncate">
                                      {club.shortName}
                                    </p>
                                    <span
                                      className="text-[10px] font-bold"
                                      style={{ color: getOverallColor(club.squadQuality) }}
                                    >
                                      {club.squadQuality}
                                    </span>
                                  </div>
                                </button>

                                {/* Expanded club detail */}
                                <AnimatePresence>
                                  {isClubSelected && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mt-1.5 ml-2 pl-3 border-l-2 border-emerald-500/40 col-span-2"
                                    >
                                      <div className="bg-[#0d1117] rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xl">{club.logo}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#c9d1d9]">
                                              {club.name}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs text-[#484f58]">
                                                {league.emoji} {league.name}
                                              </span>
                                              <span className="text-[#30363d]">·</span>
                                              <span
                                                className="text-xs font-bold"
                                                style={{
                                                  color: getOverallColor(club.squadQuality),
                                                }}
                                              >
                                                OVR {club.squadQuality}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            {
                                              label: 'Formation',
                                              value: club.formation,
                                            },
                                            {
                                              label: 'Style',
                                              value: club.tacticalStyle,
                                            },
                                            {
                                              label: 'Youth',
                                              value: `${club.youthDevelopment}`,
                                            },
                                          ].map(stat => (
                                            <div
                                              key={stat.label}
                                              className="flex flex-col items-center bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5"
                                            >
                                              <span className="text-[9px] text-[#484f58] uppercase">
                                                {stat.label}
                                              </span>
                                              <span className="text-xs font-semibold text-[#c9d1d9]">
                                                {stat.value}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ---- Step 4: Difficulty + Launch ---- */}
        <div ref={el => { sectionRefs.current[3] = el; }} className="mt-6 space-y-4">
          {/* Difficulty */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Difficulty
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as const).map(d => {
                const config = DIFFICULTY_CONFIG[d];
                const isSelected = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors text-center ${
                      isSelected
                        ? `${config.bgActive} border ${config.borderActive} ring-1 ${config.borderActive}/30`
                        : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    <span className={isSelected ? 'text-emerald-400' : 'text-[#484f58]'}>
                      {config.icon}
                    </span>
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isSelected ? config.textActive : ''
                      }`}
                    >
                      {d}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        isSelected
                          ? `${config.borderActive} ${config.textActive} border-opacity-50`
                          : 'border-[#30363d] text-[#484f58]'
                      }`}
                    >
                      {config.badge}
                    </Badge>
                    <p className="text-[9px] text-[#484f58] leading-relaxed hidden sm:block">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Preview card */}
          {selectedClub && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-[#21262d] rounded-lg border border-[#30363d]">
                  <span className="text-3xl">{selectedClub.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-[#c9d1d9]">
                    {name || 'Random Name'}
                  </p>
                  <p className="text-[#8b949e] text-sm">
                    {selectedNationality?.flag} {nationality} · {position} ·{' '}
                    {selectedClub.name}
                  </p>
                  <p className="text-[#484f58] text-xs mt-0.5">
                    Academy Prospect · Age 14
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#484f58] shrink-0" />
              </div>
            </motion.div>
          )}

          {/* Start Career Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <Button
              onClick={handleStart}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Start Career
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
