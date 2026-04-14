'use client';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { GraduationCap, BookOpen, Users, ClipboardList, Target, TrendingUp, Award, Calendar, Star, ChevronRight, Briefcase, Shield, Swords, Lightbulb, MessageSquare, BarChart3, CheckCircle2 } from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

type TabId = 'pathway' | 'philosophy' | 'youth' | 'ambitions';

interface CoachingLicense {
  id: string;
  name: string;
  level: number;
  requirements: string[];
  matchesRequired: number;
  coursesRequired: number;
  yearsRequired: number;
  description: string;
}

interface TacticalPhilosophy {
  id: string;
  name: string;
  description: string;
  formations: string[];
  principles: string[];
  effectiveness: number;
  attackScore: number;
  defenceScore: number;
  controlScore: number;
  pressScore: number;
}

interface YouthMentee {
  id: string;
  name: string;
  age: number;
  position: string;
  currentRating: number;
  potentialRating: number;
  developmentProgress: number;
  weeklyImprovement: number;
}

interface TrainingDrill {
  id: string;
  name: string;
  day: string;
  time: string;
  duration: string;
  focus: string;
  intensity: number;
}

interface DevelopmentFocus {
  id: string;
  attribute: string;
  priority: 'high' | 'medium' | 'low';
  currentLevel: number;
  targetLevel: number;
}

interface CareerGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  category: string;
  icon: string;
}

interface JobOpportunity {
  id: string;
  clubName: string;
  league: string;
  reputation: number;
  requirement: string;
  salary: string;
  status: 'available' | 'interview' | 'offered' | 'rejected';
}

interface CareerStage {
  id: string;
  label: string;
  season: number;
  description: string;
}

// ============================================================
// Constants
// ============================================================

const COACHING_LICENSES: CoachingLicense[] = [
  {
    id: 'youth_c',
    name: 'Youth C License',
    level: 1,
    requirements: ['Basic football knowledge', '18+ years old'],
    matchesRequired: 0,
    coursesRequired: 1,
    yearsRequired: 0,
    description: 'Entry-level coaching certification for grassroots football',
  },
  {
    id: 'youth_b',
    name: 'Youth B License',
    level: 2,
    requirements: ['Youth C License', '20+ years old', 'Coaching experience'],
    matchesRequired: 10,
    coursesRequired: 3,
    yearsRequired: 1,
    description: 'Advanced youth development and player mentoring certification',
  },
  {
    id: 'senior_c',
    name: 'Senior C License',
    level: 3,
    requirements: ['Youth B License', '25+ years old', 'Club coaching role'],
    matchesRequired: 50,
    coursesRequired: 5,
    yearsRequired: 2,
    description: 'Professional-level certification for senior team coaching',
  },
  {
    id: 'senior_b',
    name: 'Senior B License',
    level: 4,
    requirements: ['Senior C License', '28+ years old', 'Managerial experience'],
    matchesRequired: 150,
    coursesRequired: 8,
    yearsRequired: 4,
    description: 'Advanced senior management certification with tactical specialization',
  },
  {
    id: 'pro_license',
    name: 'Pro License',
    level: 5,
    requirements: ['Senior B License', '30+ years old', 'Top-flight experience'],
    matchesRequired: 300,
    coursesRequired: 12,
    yearsRequired: 6,
    description: 'Professional coaching license valid for top-tier club management',
  },
  {
    id: 'uefa_pro',
    name: 'UEFA Pro License',
    level: 6,
    requirements: ['Pro License', '35+ years old', 'Champions League experience'],
    matchesRequired: 500,
    coursesRequired: 18,
    yearsRequired: 10,
    description: 'The highest coaching certification in European football',
  },
];

const TACTICAL_PHILOSOPHIES: TacticalPhilosophy[] = [
  {
    id: 'possession',
    name: 'Possession Football',
    description: 'Control the game through ball retention, quick passing, and positional play. Dominate midfield and create chances through patient build-up.',
    formations: ['4-3-3', '4-2-3-1', '3-4-3'],
    principles: ['Short passing combinations', 'Positional structure', 'Ball retention under pressure', 'Progressive carries'],
    effectiveness: 82,
    attackScore: 88,
    defenceScore: 70,
    controlScore: 92,
    pressScore: 65,
  },
  {
    id: 'counter_attack',
    name: 'Counter-Attack',
    description: 'Absorb pressure defensively and strike quickly on transitions. Exploit space behind the opposition with pace and direct attacking.',
    formations: ['4-4-2', '5-3-2', '4-5-1'],
    principles: ['Deep defensive block', 'Quick transitions', 'Direct vertical passes', 'Exploiting width'],
    effectiveness: 78,
    attackScore: 80,
    defenceScore: 85,
    controlScore: 55,
    pressScore: 72,
  },
  {
    id: 'high_press',
    name: 'High Press',
    description: 'Intense pressing from the front to win the ball high up the pitch. Force mistakes and create scoring opportunities through aggressive defending.',
    formations: ['4-2-3-1', '4-3-3', '3-4-1-2'],
    principles: ['Immediate press on ball loss', 'High defensive line', 'Compact mid-block', 'Aggressive tackling'],
    effectiveness: 85,
    attackScore: 90,
    defenceScore: 72,
    controlScore: 75,
    pressScore: 95,
  },
  {
    id: 'defensive_solid',
    name: 'Defensive Solid',
    description: 'Prioritise defensive organisation and team shape. Concede few goals and win games through set pieces and counter-attacks.',
    formations: ['5-4-1', '4-1-4-1', '3-5-2'],
    principles: ['Organised low block', 'Defensive discipline', 'Set piece excellence', 'Minimal risks'],
    effectiveness: 74,
    attackScore: 62,
    defenceScore: 95,
    controlScore: 58,
    pressScore: 45,
  },
];

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'pathway', label: 'Coaching Pathway', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'philosophy', label: 'Tactical Philosophy', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'youth', label: 'Youth Development', icon: <Users className="w-4 h-4" /> },
  { id: 'ambitions', label: 'Managerial Ambitions', icon: <Target className="w-4 h-4" /> },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============================================================
// SVG Helper Functions
// ============================================================

function buildHexRadarPoints(
  values: number[],
  maxVal: number,
  cx: number,
  cy: number,
  radius: number,
  sides: number
): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const r = (values[i] / maxVal) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function buildHexGridPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rings: number
): string[] {
  const result: string[] = [];
  for (let ring = 1; ring <= rings; ring++) {
    const r = (radius * ring) / rings;
    const pts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    result.push(pts.join(' '));
  }
  return result;
}

function buildSemiCircleArc(
  cx: number,
  cy: number,
  radius: number,
  value: number,
  maxVal: number
): string {
  const startAngle = Math.PI;
  const endAngle = Math.PI + (value / maxVal) * Math.PI;
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArcFlag = value / maxVal > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${startX.toFixed(1)} ${startY.toFixed(1)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX.toFixed(1)} ${endY.toFixed(1)} Z`;
}

function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  strokeWidth: number,
  value: number,
  maxVal: number
): string {
  const ratio = Math.min(value / maxVal, 1);
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  const usable = circumference - gap;
  const dashLength = usable * ratio;
  return `${dashLength.toFixed(1)} ${circumference.toFixed(1)}`;
}

function buildSemiCircleBgPath(cx: number, cy: number, radius: number): string {
  const startX = cx + radius * Math.cos(Math.PI);
  const startY = cy + radius * Math.sin(Math.PI);
  const endX = cx + radius * Math.cos(0);
  const endY = cy + radius * Math.sin(0);
  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} A ${radius} ${radius} 0 0 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

function buildSemiCircleFgPath(
  cx: number,
  cy: number,
  radius: number,
  value: number,
  maxVal: number
): string {
  const ratio = Math.min(value / maxVal, 1);
  const endAngle = Math.PI + ratio * Math.PI;
  const startX = cx + radius * Math.cos(Math.PI);
  const startY = cy + radius * Math.sin(Math.PI);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArc = ratio > 0.5 ? 1 : 0;
  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

function buildScatterPositions(
  data: { x: number; y: number }[],
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  maxScale: number
): { px: number; py: number }[] {
  return data.map((d) => ({
    px: plotX + (d.x / maxScale) * plotW,
    py: plotY + plotH - (d.y / maxScale) * plotH,
  }));
}

// ============================================================
// Sub-components
// ============================================================

function LicenseStatusBadge({ status }: { status: 'completed' | 'in_progress' | 'locked' }) {
  if (status === 'completed') {
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 text-xs">In Progress</Badge>;
  }
  return <Badge className="bg-[#21262d] text-[#484f58] border-[#30363d] text-xs">Locked</Badge>;
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    low: 'bg-[#21262d] text-[#8b949e] border-[#30363d]',
  };
  return <Badge className={`${colors[priority]} text-xs`}>{priority}</Badge>;
}

function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    interview: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    offered: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
    rejected: 'bg-[#21262d] text-[#484f58] border-[#30363d]',
  };
  return <Badge className={`${config[status] ?? config.available} text-xs`}>{status}</Badge>;
}

// ============================================================
// Main Component
// ============================================================

export default function CoachCareer() {
  const [activeTab, setActiveTab] = useState<TabId>('pathway');

  const gameState = useGameStore((state) => state.gameState);

  // ---- Derived data (plain const, no useMemo on constants) ----
  const playerName = gameState?.player.name ?? 'Unknown Player';
  const playerAge = gameState?.player.age ?? 20;
  const playerOverall = gameState?.player.overall ?? 65;
  const playerReputation = gameState?.player.reputation ?? 10;
  const totalMatches = gameState?.player.careerStats.totalAppearances ?? 0;
  const seasonsPlayed = gameState?.player.careerStats.seasonsPlayed ?? 0;
  const trophies = gameState?.player.careerStats.trophies ?? [];
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentClub = gameState?.currentClub ?? null;
  const trainingHistory = gameState?.trainingHistory ?? [];
  const coursesCompleted = Math.min(Math.floor(trainingHistory.length / 10), 18);

  // ---- Coaching progression derived from career ----
  const coachingAge = Math.max(playerAge - 25, 0);
  const matchesManaged = Math.floor(totalMatches * 0.4);
  const yearsActive = Math.max(seasonsPlayed - 2, 0);
  const coachingXp = Math.min(
    matchesManaged * 2 + yearsActive * 15 + coursesCompleted * 5 + playerReputation * 0.5,
    500
  );

  const currentLicenseIndex = COACHING_LICENSES.reduce((acc, lic, idx) => {
    if (
      matchesManaged >= lic.matchesRequired &&
      coursesCompleted >= lic.coursesRequired &&
      yearsActive >= lic.yearsRequired &&
      coachingXp >= lic.level * 60
    ) {
      return idx;
    }
    return acc;
  }, -1);

  const licensesWithStatus = COACHING_LICENSES.map((lic, idx) => {
    if (idx <= currentLicenseIndex) {
      return { ...lic, status: 'completed' as const };
    }
    if (idx === currentLicenseIndex + 1) {
      const prevLic = COACHING_LICENSES[currentLicenseIndex];
      const prevReqs = prevLic ? prevLic.matchesRequired : 0;
      const nextReqs = lic.matchesRequired;
      const matchProgress = nextReqs > 0 ? Math.min(matchesManaged / nextReqs, 1) : 1;
      const courseProgress = lic.coursesRequired > 0 ? Math.min(coursesCompleted / lic.coursesRequired, 1) : 1;
      const yearProgress = lic.yearsRequired > 0 ? Math.min(yearsActive / lic.yearsRequired, 1) : 1;
      const overallProgress = Math.round(((matchProgress + courseProgress + yearProgress) / 3) * 100);
      return { ...lic, status: 'in_progress' as const, progress: overallProgress };
    }
    return { ...lic, status: 'locked' as const, progress: 0 };
  });

  const completedLicenses = licensesWithStatus.filter((l) => l.status === 'completed').length;
  const totalLicenses = COACHING_LICENSES.length;

  // ---- Coaching skills derived from player attributes ----
  const coachingSkills = {
    tactical: Math.min(Math.round((playerOverall * 0.3) + (playerReputation * 0.4) + (currentLicenseIndex * 8)), 99),
    manMgmt: Math.min(Math.round((playerOverall * 0.2) + (playerReputation * 0.5) + (seasonsPlayed * 2)), 99),
    motivation: Math.min(Math.round((playerOverall * 0.25) + (trophies.length * 5) + (playerReputation * 0.3)), 99),
    analysis: Math.min(Math.round((playerOverall * 0.35) + (trainingHistory.length * 0.2) + (currentLicenseIndex * 6)), 99),
    development: Math.min(Math.round((playerOverall * 0.2) + (currentLicenseIndex * 10) + (seasonsPlayed * 3)), 99),
    leadership: Math.min(Math.round((playerReputation * 0.6) + (trophies.length * 4) + (totalMatches * 0.05)), 99),
  };

  // ---- Synthetic youth players ----
  const youthMentees: YouthMentee[] = useMemo(() => {
    const names = [
      'Marcus Sterling', 'Joao Santos', 'Luca Rossi', 'Emil Johansson',
      'Kofi Mensah', 'Alejandro Vega',
    ];
    const positions = ['ST', 'CM', 'CB', 'LW', 'GK', 'CAM'];
    const seed = totalMatches + playerAge * 7 + currentSeason;
    return names.map((name, i) => {
      const baseRating = 55 + ((seed * (i + 3)) % 20);
      const potentialBase = 75 + ((seed * (i + 5)) % 20);
      const ageBase = 16 + (i % 4);
      return {
        id: `youth_${i}`,
        name,
        age: ageBase,
        position: positions[i],
        currentRating: Math.min(baseRating, 99),
        potentialRating: Math.min(Math.max(potentialBase, baseRating + 10), 99),
        developmentProgress: Math.min(((seed * (i + 2)) % 80) + 10, 100),
        weeklyImprovement: 0.3 + ((seed * (i + 1)) % 7) / 10,
      };
    });
  }, [totalMatches, playerAge, currentSeason]);

  // ---- Training schedule ----
  const trainingDrills: TrainingDrill[] = [
    { id: 'drill_1', name: 'Possession Circuits', day: 'Mon', time: '09:00', duration: '60 min', focus: 'Passing', intensity: 75 },
    { id: 'drill_2', name: 'Attacking Patterns', day: 'Tue', time: '10:00', duration: '75 min', focus: 'Attacking', intensity: 85 },
    { id: 'drill_3', name: 'Defensive Shape', day: 'Wed', time: '09:30', duration: '60 min', focus: 'Defending', intensity: 70 },
    { id: 'drill_4', name: 'Set Piece Routines', day: 'Thu', time: '10:00', duration: '45 min', focus: 'Set Pieces', intensity: 65 },
    { id: 'drill_5', name: 'Match Simulation', day: 'Fri', time: '14:00', duration: '90 min', focus: 'Tactical', intensity: 90 },
  ];

  // ---- Development focus areas ----
  const devFocusAreas: DevelopmentFocus[] = [
    { id: 'df_1', attribute: 'Technical', priority: 'high', currentLevel: 68, targetLevel: 85 },
    { id: 'df_2', attribute: 'Physical', priority: 'medium', currentLevel: 62, targetLevel: 80 },
    { id: 'df_3', attribute: 'Tactical', priority: 'high', currentLevel: 55, targetLevel: 78 },
    { id: 'df_4', attribute: 'Mental', priority: 'medium', currentLevel: 71, targetLevel: 88 },
    { id: 'df_5', attribute: 'Speed', priority: 'low', currentLevel: 74, targetLevel: 82 },
    { id: 'df_6', attribute: 'Aerial', priority: 'low', currentLevel: 48, targetLevel: 70 },
  ];

  // ---- Current tactical philosophy ----
  const currentPhilosophyIndex = useMemo(() => {
    const clubStyle = currentClub?.tacticalStyle ?? 'balanced';
    const map: Record<string, number> = {
      attacking: 0,
      'counter-attack': 1,
      pressing: 2,
      defensive: 3,
      balanced: 2,
      possession: 0,
    };
    return map[clubStyle] ?? 0;
  }, [currentClub?.tacticalStyle]);

  // ---- Formation preferences ----
  const formationPreferences = useMemo(() => {
    const base = TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].formations;
    const seed = totalMatches + currentSeason * 3;
    const allFormations = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2'];
    return allFormations.map((f) => ({
      formation: f,
      usage: base.includes(f)
        ? 25 + ((seed * allFormations.indexOf(f)) % 15)
        : 5 + ((seed * allFormations.indexOf(f)) % 10),
    }));
  }, [currentPhilosophyIndex, totalMatches, currentSeason]);

  // ---- Tactical flexibility score ----
  const tacticalFlexibility = Math.min(
    Math.round(
      Object.values(coachingSkills).reduce((sum, v) => sum + v, 0) / 6 * 0.6 +
      completedLicenses * 5 +
      currentSeason * 2
    ),
    100
  );

  // ---- Philosophy trend data ----
  const philosophyTrend = useMemo(() => {
    const seed = playerAge + totalMatches;
    return Array.from({ length: Math.min(currentSeason, 8) }, (_, i) => ({
      season: i + 1,
      possession: 40 + ((seed + i * 7) % 35),
      counterAttack: 30 + ((seed + i * 11) % 30),
      highPress: 35 + ((seed + i * 5) % 40),
      defensiveSolid: 25 + ((seed + i * 9) % 25),
    }));
  }, [playerAge, totalMatches, currentSeason]);

  // ---- Career goals ----
  const careerGoals: CareerGoal[] = useMemo(() => {
    const seed = currentSeason + trophies.length * 3;
    return [
      {
        id: 'goal_1',
        name: 'Win League Title',
        description: 'Guide your team to a league championship',
        targetValue: 1,
        currentValue: trophies.filter((t) => t.name.toLowerCase().includes('league') || t.name.toLowerCase().includes('premier')).length,
        category: 'trophy',
        icon: 'Trophy',
      },
      {
        id: 'goal_2',
        name: 'Win Champions League',
        description: 'Lift the most prestigious club trophy in Europe',
        targetValue: 1,
        currentValue: trophies.filter((t) => t.name.toLowerCase().includes('champions')).length,
        category: 'continental',
        icon: 'Cup',
      },
      {
        id: 'goal_3',
        name: 'Manage National Team',
        description: 'Take charge of a national side',
        targetValue: 1,
        currentValue: completedLicenses >= 5 ? 0 : 0,
        category: 'international',
        icon: 'Flag',
      },
      {
        id: 'goal_4',
        name: 'Club Legend Status',
        description: 'Earn legendary status at your current club',
        targetValue: 100,
        currentValue: Math.min(playerReputation + seasonsPlayed * 3, 100),
        category: 'legacy',
        icon: 'Star',
      },
      {
        id: 'goal_5',
        name: 'Hall of Fame',
        description: 'Be inducted into the football Hall of Fame',
        targetValue: 1000,
        currentValue: Math.min(totalMatches * 2 + trophies.length * 50 + playerReputation * 5, 1000),
        category: 'history',
        icon: 'Award',
      },
    ];
  }, [currentSeason, trophies, completedLicenses, playerReputation, seasonsPlayed, totalMatches]);

  // ---- Job opportunities ----
  const jobOpportunities: JobOpportunity[] = useMemo(() => {
    const seed = currentSeason * 7 + playerReputation;
    const clubs = [
      { name: 'Wolves', league: 'Premier League' },
      { name: 'Ajax', league: 'Eredivisie' },
      { name: 'Sporting CP', league: 'Primeira Liga' },
      { name: 'RB Salzburg', league: 'Bundesliga' },
    ];
    return clubs.map((club, i) => {
      const statuses: JobOpportunity['status'][] = ['available', 'interview', 'offered', 'rejected'];
      return {
        id: `job_${i}`,
        clubName: club.name,
        league: club.league,
        reputation: 50 + ((seed + i * 13) % 40),
        requirement: completedLicenses >= 3 ? 'Senior C License' : 'Senior B License',
        salary: `${1 + i + (seed % 3)}M/year`,
        status: statuses[i % 4],
      };
    });
  }, [currentSeason, playerReputation, completedLicenses]);

  // ---- Manager reputation score ----
  const managerReputation = Math.min(
    Math.round(
      playerReputation * 0.4 +
      completedLicenses * 6 +
      trophies.length * 5 +
      currentSeason * 1.5 +
      coachingXp * 0.02
    ),
    100
  );

  // ---- Career stages ----
  const careerStages: CareerStage[] = useMemo(() => {
    const base: CareerStage[] = [
      { id: 'stage_1', label: 'Player', season: 1, description: 'Active playing career begins' },
      { id: 'stage_2', label: 'Player-Coach', season: Math.max(playerAge - 5, currentSeason - 2), description: 'Taking first coaching badges' },
      { id: 'stage_3', label: 'Assistant', season: Math.max(playerAge - 3, currentSeason), description: 'Joining coaching staff' },
      { id: 'stage_4', label: 'Head Coach', season: Math.min(currentSeason + 3, playerAge + 2), description: 'First managerial appointment' },
      { id: 'stage_5', label: 'Manager', season: Math.min(currentSeason + 6, playerAge + 5), description: 'Established club manager' },
    ];
    return base;
  }, [playerAge, currentSeason]);

  // ---- Youth academy ranking ----
  const academyRanking = useMemo(() => {
    const seed = currentSeason + totalMatches;
    const metrics = [
      { name: 'Player Development', academy: 65 + (seed % 20), league: 58 },
      { name: 'Match Results', academy: 60 + (seed % 25), league: 55 },
      { name: 'Graduation Rate', academy: 70 + (seed % 15), league: 62 },
      { name: 'Facility Quality', academy: 55 + (seed % 20), league: 50 },
      { name: 'Scouting Network', academy: 58 + (seed % 18), league: 52 },
    ];
    return metrics;
  }, [currentSeason, totalMatches]);

  // ---- Ambition vs Reality data ----
  const ambitionData = useMemo(() => {
    return careerGoals.map((g) => ({
      goal: g.name,
      target: g.targetValue,
      achieved: Math.min(g.currentValue, g.targetValue),
    }));
  }, [careerGoals]);

  // ---- Null guard after all hooks ----
  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e]">No active career found. Start a new career to access coaching features.</p>
      </div>
    );
  }

  // ---- SVG data computations ----
  const radarValues = [
    coachingSkills.tactical,
    coachingSkills.manMgmt,
    coachingSkills.motivation,
    coachingSkills.analysis,
    coachingSkills.development,
    coachingSkills.leadership,
  ];

  const radarPoints = buildHexRadarPoints(radarValues, 100, 100, 100, 70, 6);
  const hexGrid = buildHexGridPoints(100, 100, 70, 6, 4);

  const ringDash = buildArcPath(80, 80, 60, 8, completedLicenses, totalLicenses);
  const ringPct = Math.round((completedLicenses / totalLicenses) * 100);

  const expBars = [
    { label: 'Matches Managed', current: matchesManaged, target: 500, color: '#10b981' },
    { label: 'Years Active', current: yearsActive, target: 10, color: '#f59e0b' },
    { label: 'Courses Completed', current: coursesCompleted, target: 18, color: '#60a5fa' },
  ];

  // Tactical philosophy SVG data
  const philRadarVals = TACTICAL_PHILOSOPHIES.map((p) => [p.attackScore, p.defenceScore, p.controlScore, p.pressScore]);
  const currentPhilRadar = buildHexRadarPoints(
    TACTICAL_PHILOSOPHIES[currentPhilosophyIndex]
      ? [TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].attackScore, TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].defenceScore, TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].controlScore, TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].pressScore]
      : [50, 50, 50, 50],
    100, 100, 100, 70, 4
  );

  const gaugeFg = buildSemiCircleFgPath(100, 105, 70, tacticalFlexibility, 100);
  const gaugeBg = buildSemiCircleBgPath(100, 105, 70);

  // Youth development SVG data
  const devRingDash = buildArcPath(80, 80, 60, 8,
    youthMentees.reduce((sum, y) => sum + y.developmentProgress, 0) / youthMentees.length,
    100
  );
  const overallDevScore = Math.round(youthMentees.reduce((sum, y) => sum + y.developmentProgress, 0) / youthMentees.length);

  // Manager ambitions SVG data
  const mgrGaugeFg = buildSemiCircleFgPath(100, 105, 70, managerReputation, 100);
  const mgrGaugeBg = buildSemiCircleBgPath(100, 105, 70);

  const scatterPoints = buildScatterPositions(
    ambitionData.map((d) => ({ x: d.target, y: d.achieved })),
    40, 20, 200, 160, 1000
  );

  // ============================================================
  // Tab: Coaching Pathway
  // ============================================================
  const renderPathwayTab = (): React.JSX.Element => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9]">Coaching Pathway</h2>
          <p className="text-sm text-[#8b949e] mt-1">Track your progress toward elite coaching qualifications</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          Level {Math.max(currentLicenseIndex + 1, 1)} / {totalLicenses}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Progress Timeline - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              License Progress Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 440" className="w-full">
              {COACHING_LICENSES.map((lic, idx) => {
                const isCompleted = idx <= currentLicenseIndex;
                const isCurrent = idx === currentLicenseIndex + 1;
                const y = 30 + idx * 70;
                const nodeColor = isCompleted ? '#10b981' : isCurrent ? '#60a5fa' : '#30363d';
                const lineColor = isCompleted ? '#10b981' : '#21262d';
                return (
                  <g key={lic.id}>
                    {idx < COACHING_LICENSES.length - 1 && (
                      <line x1="40" y1={y + 10} x2="40" y2={y + 60} stroke={lineColor} strokeWidth="2" />
                    )}
                    <circle cx="40" cy={y} r={isCompleted ? 10 : isCurrent ? 8 : 6} fill={nodeColor} />
                    {isCompleted && (
                      <path d="M 35 {y} L 39 {y + 4} L 47 {y - 4}" fill="none" stroke="#0d1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    <text x="60" y={y - 8} fill={isCompleted ? '#c9d1d9' : isCurrent ? '#60a5fa' : '#484f58'} fontSize="11" fontWeight="bold">{lic.name}</text>
                    <text x="60" y={y + 6} fill="#8b949e" fontSize="9">{lic.description}</text>
                    <text x="60" y={y + 20} fill={isCurrent ? '#60a5fa' : '#484f58'} fontSize="9">
                      {idx <= currentLicenseIndex ? 'Completed' : `${lic.matchesRequired} matches | ${lic.coursesRequired} courses`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Coaching Skill Hex Radar - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Coaching Skills Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 200 200" className="w-full max-w-[280px] mx-auto">
              {hexGrid.map((pts, i) => (
                <polygon key={`grid_${i}`} points={pts} fill="none" stroke="#21262d" strokeWidth="1" />
              ))}
              {/* Axis lines */}
              {Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x = 100 + 70 * Math.cos(angle);
                const y = 100 + 70 * Math.sin(angle);
                return <line key={`axis_${i}`} x1="100" y1="100" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Data polygon */}
              <polygon
                points={radarPoints}
                fill="#10b981"
                fillOpacity="0.2"
                stroke="#10b981"
                strokeWidth="2"
              />
              {/* Data points */}
              {radarValues.map((val, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const r = (val / 100) * 70;
                const x = 100 + r * Math.cos(angle);
                const y = 100 + r * Math.sin(angle);
                return <circle key={`pt_${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#10b981" />;
              })}
              {/* Labels */}
              {['Tactical', 'Man Mgmt', 'Motivation', 'Analysis', 'Develop', 'Leadership'].map((label, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const lx = 100 + 85 * Math.cos(angle);
                const ly = 100 + 85 * Math.sin(angle);
                return (
                  <text key={`lbl_${i}`} x={lx.toFixed(1)} y={ly.toFixed(1)} fill="#8b949e" fontSize="9" textAnchor="middle" dominantBaseline="middle">
                    {label}
                  </text>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* License Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {licensesWithStatus.map((lic) => (
          <Card
            key={lic.id}
            className={`bg-[#161b22] border-[#30363d] ${
              lic.status === 'in_progress' ? 'ring-1 ring-blue-400/40' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#c9d1d9]">{lic.name}</h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">Level {lic.level}</p>
                </div>
                <LicenseStatusBadge status={lic.status} />
              </div>
              <p className="text-xs text-[#8b949e] mb-3">{lic.description}</p>
              {lic.status === 'in_progress' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b949e]">Progress</span>
                    <span className="text-blue-400">{lic.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#21262d] rounded">
                    <div className="h-full bg-blue-400 rounded" style={{ width: `${lic.progress}%` }} />
                  </div>
                </div>
              )}
              {lic.status === 'completed' && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs mt-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Achieved</span>
                </div>
              )}
              {lic.status === 'locked' && (
                <div className="space-y-1 mt-2">
                  {lic.requirements.map((req, ri) => (
                    <p key={ri} className="text-xs text-[#484f58]">- {req}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row: Pathway Completion Ring + Required Experience Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathway Completion Ring - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Pathway Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <svg viewBox="0 0 160 160" className="w-40 h-40">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#21262d" strokeWidth="8" />
              <circle
                cx="80" cy="80" r="60" fill="none" stroke="#10b981" strokeWidth="8"
                strokeDasharray={ringDash}
                strokeLinecap="round"
                strokeDashoffset="-4"
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="74" textAnchor="middle" fill="#c9d1d9" fontSize="24" fontWeight="bold">{ringPct}%</text>
              <text x="80" y="92" textAnchor="middle" fill="#8b949e" fontSize="10">{completedLicenses} / {totalLicenses}</text>
            </svg>
            <p className="text-xs text-[#8b949e] mt-3 text-center">
              {ringPct >= 100
                ? 'All coaching licenses obtained!'
                : `Complete your current license to progress`}
            </p>
          </CardContent>
        </Card>

        {/* Required Experience Bars - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Required Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 160" className="w-full">
              {expBars.map((bar, i) => {
                const y = 20 + i * 50;
                const pct = Math.min(bar.current / bar.target, 1);
                const barWidth = 200 * pct;
                return (
                  <g key={`exp_${i}`}>
                    <text x="0" y={y} fill="#c9d1d9" fontSize="11" fontWeight="500">{bar.label}</text>
                    <text x="300" y={y} fill="#8b949e" fontSize="10" textAnchor="end">
                      {bar.current} / {bar.target}
                    </text>
                    <rect x="0" y={y + 8} width="300" height="12" rx="3" fill="#21262d" />
                    <rect x="0" y={y + 8} width={barWidth.toFixed(1)} height="12" rx="3" fill={bar.color} fillOpacity="0.8" />
                    <text x={Math.max(barWidth - 5, 30)} y={y + 17} fill="#0d1117" fontSize="8" fontWeight="bold" textAnchor="end">
                      {Math.round(pct * 100)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Coaching Profile Summary */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Coaching Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{completedLicenses}</p>
              <p className="text-xs text-[#8b949e] mt-1">Licenses Earned</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{coachingXp}</p>
              <p className="text-xs text-[#8b949e] mt-1">Coaching XP</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{matchesManaged}</p>
              <p className="text-xs text-[#8b949e] mt-1">Matches Managed</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#c9d1d9]">{coursesCompleted}</p>
              <p className="text-xs text-[#8b949e] mt-1">Courses Done</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Tab: Tactical Philosophy
  // ============================================================
  const renderPhilosophyTab = (): React.JSX.Element => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9]">Tactical Philosophy</h2>
          <p className="text-sm text-[#8b949e] mt-1">Define and refine your managerial approach</p>
        </div>
        <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
          {TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].name}
        </Badge>
      </div>

      {/* Philosophy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TACTICAL_PHILOSOPHIES.map((phil, idx) => {
          const isCurrent = idx === currentPhilosophyIndex;
          return (
            <Card
              key={phil.id}
              className={`bg-[#161b22] border-[#30363d] ${isCurrent ? 'ring-1 ring-emerald-400/40' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#c9d1d9]">{phil.name}</h3>
                  {isCurrent && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Active</Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400">{phil.effectiveness}/100</span>
                  </div>
                </div>
                <p className="text-xs text-[#8b949e] mb-3">{phil.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {phil.formations.map((f) => (
                    <Badge key={f} className="bg-[#21262d] text-[#c9d1d9] border-[#30363d] text-xs">{f}</Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  {phil.principles.map((p, pi) => (
                    <div key={pi} className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-[#8b949e]">{p}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Philosophy Comparison Radar - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Swords className="w-4 h-4 text-emerald-400" />
              Philosophy Comparison Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 200 200" className="w-full max-w-[280px] mx-auto">
              {/* Grid for 4 axes */}
              {buildHexGridPoints(100, 100, 70, 4, 4).map((pts, i) => (
                <polygon key={`pg_${i}`} points={pts} fill="none" stroke="#21262d" strokeWidth="1" />
              ))}
              {Array.from({ length: 4 }, (_, i) => {
                const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
                const x = 100 + 70 * Math.cos(angle);
                const y = 100 + 70 * Math.sin(angle);
                return <line key={`pa_${i}`} x1="100" y1="100" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Other philosophies (faded) */}
              {TACTICAL_PHILOSOPHIES.filter((_, i) => i !== currentPhilosophyIndex).map((p, oi) => {
                const vals = [p.attackScore, p.defenceScore, p.controlScore, p.pressScore];
                const pts = buildHexRadarPoints(vals, 100, 100, 100, 70, 4);
                return (
                  <polygon key={`phil_${oi}`} points={pts} fill="none" stroke="#484f58" strokeWidth="1" strokeDasharray="3,3" fillOpacity="0.05" />
                );
              })}
              {/* Current philosophy */}
              <polygon points={currentPhilRadar} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="2" />
              {/* Labels */}
              {['Attack', 'Defence', 'Control', 'Press'].map((label, i) => {
                const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
                const lx = 100 + 85 * Math.cos(angle);
                const ly = 100 + 85 * Math.sin(angle);
                return (
                  <text key={`plbl_${i}`} x={lx.toFixed(1)} y={ly.toFixed(1)} fill="#c9d1d9" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                    {label}
                  </text>
                );
              })}
            </svg>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-emerald-400" />
                <span className="text-xs text-[#8b949e]">Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-[#484f58]" style={{ borderTop: '1px dashed #484f58' }} />
                <span className="text-xs text-[#8b949e]">Others</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tactical Flexibility Gauge - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Tactical Flexibility
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <svg viewBox="0 0 200 130" className="w-full max-w-[280px]">
              <path d={gaugeBg} fill="none" stroke="#21262d" strokeWidth="12" strokeLinecap="round" />
              <path d={gaugeFg} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
              <text x="100" y="95" textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="bold">{tacticalFlexibility}</text>
              <text x="100" y="112" textAnchor="middle" fill="#8b949e" fontSize="10">out of 100</text>
            </svg>
            <p className="text-xs text-[#8b949e] mt-2 text-center">
              {tacticalFlexibility >= 80
                ? 'Highly flexible tactician'
                : tacticalFlexibility >= 60
                  ? 'Developing tactical range'
                  : 'Focus on a core philosophy'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formation Preference Bars - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Formation Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 200" className="w-full">
              {formationPreferences.map((fp, i) => {
                const y = 15 + i * 38;
                const maxUsage = Math.max(...formationPreferences.map((f) => f.usage));
                const barW = (fp.usage / maxUsage) * 200;
                return (
                  <g key={`form_${i}`}>
                    <text x="0" y={y + 5} fill="#c9d1d9" fontSize="12" fontWeight="500">{fp.formation}</text>
                    <text x="300" y={y + 5} fill="#8b949e" fontSize="10" textAnchor="end">{fp.usage}%</text>
                    <rect x="0" y={y + 12} width="300" height="14" rx="3" fill="#21262d" />
                    <rect x="0" y={y + 12} width={barW.toFixed(1)} height="14" rx="3" fill="#60a5fa" fillOpacity="0.7" />
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Philosophy Trend Line Chart - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Philosophy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 200" className="w-full">
              {/* Grid */}
              {Array.from({ length: 5 }, (_, i) => {
                const y = 20 + i * 36;
                return <line key={`tgrid_${i}`} x1="30" y1={y} x2="290" y2={y} stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Y axis labels */}
              {[100, 75, 50, 25, 0].map((val, i) => (
                <text key={`tylbl_${i}`} x="25" y={24 + i * 36} fill="#484f58" fontSize="8" textAnchor="end">{val}</text>
              ))}
              {/* Lines */}
              {['possession', 'counterAttack', 'highPress', 'defensiveSolid'].map((key, ki) => {
                const colors = ['#10b981', '#f59e0b', '#60a5fa', '#ef4444'];
                const data = philosophyTrend.map((d) => {
                  const val = (d as Record<string, number>)[key] ?? 50;
                  return val;
                });
                const linePts = data.map((v, di) => {
                  const x = 35 + (di / Math.max(data.length - 1, 1)) * 255;
                  const y = 164 - (v / 100) * 144;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                });
                return <polyline key={`tline_${ki}`} points={linePts.join(' ')} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
              })}
              {/* Season labels */}
              {philosophyTrend.map((d, i) => (
                <text key={`txlbl_${i}`} x={35 + (i / Math.max(philosophyTrend.length - 1, 1)) * 255} y="185" fill="#8b949e" fontSize="8" textAnchor="middle">S{d.season}</text>
              ))}
              {/* Legend */}
              {['Possession', 'Counter', 'High Press', 'Defensive'].map((lbl, li) => {
                const colors = ['#10b981', '#f59e0b', '#60a5fa', '#ef4444'];
                const lx = 35 + li * 70;
                return (
                  <g key={`tleg_${li}`}>
                    <line x1={lx} y1="8" x2={lx + 12} y2="8" stroke={colors[li]} strokeWidth="2" />
                    <text x={lx + 15} y="11" fill="#8b949e" fontSize="8">{lbl}</text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Tactical Analysis Summary */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Tactical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#c9d1d9]">Current Philosophy Strengths</h4>
              <div className="space-y-2">
                {[
                  { label: 'Attacking Output', value: TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].attackScore, color: '#10b981' },
                  { label: 'Defensive Solidity', value: TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].defenceScore, color: '#60a5fa' },
                  { label: 'Ball Control', value: TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].controlScore, color: '#f59e0b' },
                  { label: 'Pressing Intensity', value: TACTICAL_PHILOSOPHIES[currentPhilosophyIndex].pressScore, color: '#ef4444' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#8b949e] w-28">{stat.label}</span>
                    <div className="flex-1 h-2 bg-[#21262d] rounded">
                      <div className="h-full rounded" style={{ width: `${stat.value}%`, backgroundColor: stat.color }} />
                    </div>
                    <span className="text-xs text-[#c9d1d9] w-8 text-right">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#c9d1d9]">Coaching Skill Breakdown</h4>
              <div className="space-y-2">
                {[
                  { label: 'Tactical Awareness', value: coachingSkills.tactical },
                  { label: 'Man Management', value: coachingSkills.manMgmt },
                  { label: 'Player Motivation', value: coachingSkills.motivation },
                ].map((skill) => (
                  <div key={skill.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#8b949e] w-32">{skill.label}</span>
                    <div className="flex-1 h-2 bg-[#21262d] rounded">
                      <div className="h-full bg-emerald-400 rounded" style={{ width: `${skill.value}%` }} />
                    </div>
                    <span className="text-xs text-[#c9d1d9] w-8 text-right">{skill.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Tab: Youth Development
  // ============================================================
  const renderYouthTab = (): React.JSX.Element => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9]">Youth Development</h2>
          <p className="text-sm text-[#8b949e] mt-1">Mentor the next generation of talent</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {youthMentees.length} Players
        </Badge>
      </div>

      {/* Youth Player Potential Bars - SVG */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Youth Player Potential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 400 280" className="w-full">
            {youthMentees.map((youth, i) => {
              const y = 10 + i * 44;
              const currentW = (youth.currentRating / 99) * 180;
              const potentialW = (youth.potentialRating / 99) * 180;
              return (
                <g key={youth.id}>
                  <text x="0" y={y + 10} fill="#c9d1d9" fontSize="10" fontWeight="500">{youth.name}</text>
                  <text x="0" y={y + 22} fill="#8b949e" fontSize="8">{youth.position} | Age {youth.age} | +{youth.weeklyImprovement.toFixed(1)}/wk</text>
                  {/* Potential bar (background) */}
                  <rect x="150" y={y + 4} width={potentialW.toFixed(1)} height="10" rx="2" fill="#21262d" />
                  {/* Current bar */}
                  <rect x="150" y={y + 4} width={currentW.toFixed(1)} height="10" rx="2" fill="#10b981" fillOpacity="0.7" />
                  {/* Potential marker */}
                  <line x1={150 + potentialW} y1={y + 2} x2={150 + potentialW} y2={y + 18} stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Values */}
                  <text x={152 + currentW} y={y + 12} fill="#0d1117" fontSize="7" fontWeight="bold">{youth.currentRating}</text>
                  <text x={152 + potentialW} y={y + 12} fill="#f59e0b" fontSize="7" fontWeight="bold">{youth.potentialRating}</text>
                </g>
              );
            })}
            {/* Legend */}
            <rect x="150" y="272" width="12" height="6" rx="1" fill="#10b981" fillOpacity="0.7" />
            <text x="165" y="278" fill="#8b949e" fontSize="8">Current</text>
            <line x1="210" y1="272" x2="210" y2="278" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="215" y="278" fill="#8b949e" fontSize="8">Potential</text>
          </svg>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Development Progress Ring - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <svg viewBox="0 0 160 160" className="w-36 h-36">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#21262d" strokeWidth="8" />
              <circle
                cx="80" cy="80" r="60" fill="none" stroke="#60a5fa" strokeWidth="8"
                strokeDasharray={devRingDash}
                strokeLinecap="round"
                strokeDashoffset="-4"
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="74" textAnchor="middle" fill="#c9d1d9" fontSize="24" fontWeight="bold">{overallDevScore}%</text>
              <text x="80" y="92" textAnchor="middle" fill="#8b949e" fontSize="9">Overall Score</text>
            </svg>
          </CardContent>
        </Card>

        {/* Youth Academy Ranking Bars - SVG */}
        <Card className="bg-[#161b22] border-[#30363d] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Academy vs League Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 400 180" className="w-full">
              {academyRanking.map((metric, i) => {
                const y = 10 + i * 34;
                const maxVal = 100;
                const academyW = (metric.academy / maxVal) * 150;
                const leagueW = (metric.league / maxVal) * 150;
                return (
                  <g key={`rank_${i}`}>
                    <text x="0" y={y + 8} fill="#c9d1d9" fontSize="9">{metric.name}</text>
                    {/* Academy bar */}
                    <rect x="140" y={y + 2} width={academyW.toFixed(1)} height="10" rx="2" fill="#10b981" fillOpacity="0.7" />
                    <text x={144 + academyW} y={y + 10} fill="#8b949e" fontSize="8">{metric.academy}</text>
                    {/* League bar */}
                    <rect x="140" y={y + 15} width={leagueW.toFixed(1)} height="10" rx="2" fill="#484f58" fillOpacity="0.5" />
                    <text x={144 + leagueW} y={y + 23} fill="#8b949e" fontSize="8">{metric.league}</text>
                  </g>
                );
              })}
              {/* Legend */}
              <rect x="140" y="170" width="10" height="5" rx="1" fill="#10b981" fillOpacity="0.7" />
              <text x="154" y="175" fill="#8b949e" fontSize="8">Academy</text>
              <rect x="200" y="170" width="10" height="5" rx="1" fill="#484f58" fillOpacity="0.5" />
              <text x="214" y="175" fill="#8b949e" fontSize="8">League Avg</text>
            </svg>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Session Calendar - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Weekly Training Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 400 250" className="w-full">
              {/* Grid header */}
              {DAYS_OF_WEEK.map((day, i) => {
                const x = 15 + i * 55;
                return (
                  <text key={`day_${i}`} x={x} y="15" fill="#c9d1d9" fontSize="10" fontWeight="500" textAnchor="middle">{day}</text>
                );
              })}
              {/* Grid lines */}
              {DAYS_OF_WEEK.map((_, i) => {
                const x = 15 + i * 55;
                return <line key={`dgrid_${i}`} x1={x} y1="22" x2={x} y2="245" stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Sessions */}
              {trainingDrills.map((drill, di) => {
                const dayIdx = DAYS_OF_WEEK.indexOf(drill.day);
                const x = 15 + dayIdx * 55;
                const y = 35 + di * 42;
                const intensityColor = drill.intensity >= 80 ? '#ef4444' : drill.intensity >= 65 ? '#f59e0b' : '#10b981';
                return (
                  <g key={drill.id}>
                    <rect x={x - 22} y={y} width="44" height="36" rx="4" fill="#21262d" />
                    <rect x={x - 22} y={y} width="44" height="3" rx="1" fill={intensityColor} />
                    <text x={x} y={y + 15} fill="#c9d1d9" fontSize="7" textAnchor="middle">{drill.name}</text>
                    <text x={x} y={y + 26} fill="#8b949e" fontSize="7" textAnchor="middle">{drill.time}</text>
                  </g>
                );
              })}
              {/* Intensity Legend */}
              {[
                { color: '#10b981', label: 'Low' },
                { color: '#f59e0b', label: 'Med' },
                { color: '#ef4444', label: 'High' },
              ].map((item, li) => (
                <g key={`ileg_${li}`}>
                  <rect x={15 + li * 55} y="245" width="8" height="4" rx="1" fill={item.color} />
                  <text x={26 + li * 55} y="249" fill="#8b949e" fontSize="7">{item.label}</text>
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>

        {/* Development Focus Areas */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Development Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devFocusAreas.map((area) => {
                const progressPct = Math.round(((area.currentLevel - 40) / (area.targetLevel - 40)) * 100);
                const clampedPct = Math.min(Math.max(progressPct, 0), 100);
                return (
                  <div key={area.id} className="bg-[#0d1117] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#c9d1d9]">{area.attribute}</span>
                      <PriorityBadge priority={area.priority} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#21262d] rounded">
                        <div
                          className="h-full bg-emerald-400 rounded"
                          style={{ width: `${clampedPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#8b949e] w-16 text-right">
                        {area.currentLevel} / {area.targetLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Youth Mentee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {youthMentees.map((youth) => (
          <Card key={youth.id} className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#c9d1d9]">{youth.name}</h3>
                  <p className="text-xs text-[#8b949e]">
                    {youth.position} | Age {youth.age}
                  </p>
                </div>
                <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 text-xs">
                  {youth.currentRating}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#8b949e]">Potential:</span>
                <span className="text-xs text-amber-400 font-semibold">{youth.potentialRating}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8b949e]">Development</span>
                  <span className="text-emerald-400">{youth.developmentProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#21262d] rounded">
                  <div
                    className="h-full bg-emerald-400 rounded"
                    style={{ width: `${youth.developmentProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-[#8b949e] mt-2">
                Weekly improvement: +{youth.weeklyImprovement.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mentoring Activity Log */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Mentoring Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { player: youthMentees[0]?.name ?? 'Player', action: 'Completed advanced dribbling session', time: 'Today' },
              { player: youthMentees[1]?.name ?? 'Player', action: 'Reviewed match performance analysis', time: 'Yesterday' },
              { player: youthMentees[2]?.name ?? 'Player', action: 'Set new physical training targets', time: '2 days ago' },
              { player: youthMentees[3]?.name ?? 'Player', action: 'One-on-one tactical discussion', time: '3 days ago' },
            ].map((entry, ei) => (
              <div key={ei} className="flex items-start gap-3 bg-[#0d1117] rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#c9d1d9]">{entry.player} - {entry.action}</p>
                  <p className="text-xs text-[#484f58] mt-0.5">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Tab: Managerial Ambitions
  // ============================================================
  const renderAmbitionsTab = (): React.JSX.Element => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9]">Managerial Ambitions</h2>
          <p className="text-sm text-[#8b949e] mt-1">Track your career goals and managerial opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30">
            Rep: {managerReputation}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manager Reputation Gauge - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Manager Reputation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <svg viewBox="0 0 200 130" className="w-full max-w-[280px]">
              <path d={mgrGaugeBg} fill="none" stroke="#21262d" strokeWidth="12" strokeLinecap="round" />
              <path d={mgrGaugeFg} fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" />
              <text x="100" y="90" textAnchor="middle" fill="#c9d1d9" fontSize="32" fontWeight="bold">{managerReputation}</text>
              <text x="100" y="108" textAnchor="middle" fill="#8b949e" fontSize="10">/ 100</text>
            </svg>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30 text-xs">
                {managerReputation >= 80 ? 'World Class' : managerReputation >= 60 ? 'Established' : managerReputation >= 40 ? 'Developing' : 'Beginner'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Career Goals Progress Bars - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Career Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 200" className="w-full">
              {careerGoals.map((goal, i) => {
                const y = 5 + i * 38;
                const maxVal = Math.max(goal.targetValue, goal.currentValue, 1);
                const barW = Math.min((goal.currentValue / maxVal) * 200, 200);
                const isComplete = goal.currentValue >= goal.targetValue;
                const color = isComplete ? '#10b981' : '#60a5fa';
                return (
                  <g key={goal.id}>
                    <text x="0" y={y + 10} fill="#c9d1d9" fontSize="10" fontWeight="500">{goal.name}</text>
                    <text x="300" y={y + 10} fill="#8b949e" fontSize="8" textAnchor="end">
                      {goal.currentValue} / {goal.targetValue}
                    </text>
                    <rect x="0" y={y + 16} width="300" height="10" rx="3" fill="#21262d" />
                    <rect x="0" y={y + 16} width={barW.toFixed(1)} height="10" rx="3" fill={color} fillOpacity="0.8" />
                    {isComplete && (
                      <text x={Math.max(barW - 5, 20)} y={y + 24} fill="#0d1117" fontSize="7" fontWeight="bold" textAnchor="end">
                        Done
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Career Goals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {careerGoals.map((goal) => {
          const pct = goal.targetValue > 0 ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100) : 0;
          const isComplete = pct >= 100;
          return (
            <Card key={goal.id} className={`bg-[#161b22] border-[#30363d] ${isComplete ? 'ring-1 ring-emerald-400/30' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${isComplete ? 'bg-emerald-500/20' : 'bg-[#21262d]'}`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-[#484f58]" />
                    )}
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-[#c9d1d9] mb-1">{goal.name}</h3>
                <p className="text-xs text-[#8b949e] mb-2">{goal.description}</p>
                <div className="w-full h-1.5 bg-[#21262d] rounded">
                  <div
                    className={`h-full rounded ${isComplete ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-[#484f58] mt-1">{pct}% complete</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job Opportunities */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            Available Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {jobOpportunities.map((job) => (
              <div key={job.id} className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#c9d1d9]">{job.clubName}</h3>
                    <p className="text-xs text-[#8b949e]">{job.league}</p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Reputation</span>
                    <span className="text-xs text-[#c9d1d9]">{job.reputation}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Salary</span>
                    <span className="text-xs text-emerald-400">{job.salary}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Requires</span>
                    <span className="text-xs text-amber-400">{job.requirement}</span>
                  </div>
                </div>
                {job.status === 'available' && (
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs"
                  >
                    Apply
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambition vs Reality Scatter Plot - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Ambition vs Reality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 280 190" className="w-full">
              {/* Axes */}
              <line x1="40" y1="20" x2="40" y2="180" stroke="#30363d" strokeWidth="1" />
              <line x1="40" y1="180" x2="260" y2="180" stroke="#30363d" strokeWidth="1" />
              {/* Grid lines */}
              {Array.from({ length: 5 }, (_, i) => {
                const gy = 20 + i * 40;
                return <line key={`sgrid_${i}`} x1="40" y1={gy} x2="260" y2={gy} stroke="#21262d" strokeWidth="0.5" />;
              })}
              {/* Axis labels */}
              <text x="150" y="195" fill="#8b949e" fontSize="9" textAnchor="middle">Ambition (Target)</text>
              <text x="10" y="100" fill="#8b949e" fontSize="9" textAnchor="middle" transform="rotate(-90 10 100)">Achieved</text>
              {/* 45 degree line (perfect) */}
              <line x1="40" y1="180" x2="260" y2="20" stroke="#30363d" strokeWidth="1" strokeDasharray="4,4" />
              {/* Data points */}
              {scatterPoints.map((sp, i) => {
                const color = sp.py <= sp.px ? '#10b981' : '#ef4444';
                return (
                  <g key={`sp_${i}`}>
                    <circle cx={sp.px.toFixed(1)} cy={sp.py.toFixed(1)} r="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
                    <text x={sp.px.toFixed(1)} y={(sp.py - 10).toFixed(1)} fill="#8b949e" fontSize="7" textAnchor="middle">
                      {ambitionData[i].goal.split(' ').slice(0, 2).join(' ')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Manager Career Timeline - SVG */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Career Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 400 130" className="w-full">
              {/* Main timeline line */}
              <line x1="30" y1="50" x2="380" y2="50" stroke="#30363d" strokeWidth="2" />
              {/* Stage nodes */}
              {careerStages.map((stage, i) => {
                const x = 40 + i * 80;
                const isReached = currentSeason >= stage.season;
                const isCurrent = currentSeason >= stage.season && (i === careerStages.length - 1 || currentSeason < careerStages[i + 1]?.season);
                const nodeColor = isCurrent ? '#10b981' : isReached ? '#60a5fa' : '#484f58';
                return (
                  <g key={stage.id}>
                    <circle cx={x} cy="50" r={isCurrent ? 8 : 6} fill={nodeColor} />
                    {isCurrent && (
                      <circle cx={x} cy="50" r="12" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                    )}
                    <text x={x} y="35" fill={nodeColor} fontSize="9" textAnchor="middle" fontWeight="500">{stage.label}</text>
                    <text x={x} y="72" fill="#8b949e" fontSize="7" textAnchor="middle">S{stage.season}</text>
                    <text x={x} y="85" fill="#484f58" fontSize="7" textAnchor="middle">{stage.description}</text>
                  </g>
                );
              })}
              {/* Current position marker */}
              <text x="20" y="105" fill="#8b949e" fontSize="8">Current: Season {currentSeason}</text>
              {/* Progress indicator */}
              <rect x="30" y="115" width="350" height="6" rx="3" fill="#21262d" />
              {(() => {
                const progress = Math.min((currentSeason / (careerStages[careerStages.length - 1].season || 1)) * 350, 350);
                return <rect x="30" y="115" width={progress.toFixed(1)} height="6" rx="3" fill="#10b981" fillOpacity="0.6" />;
              })()}
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Manager Profile Summary */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#c9d1d9] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Manager Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{completedLicenses}</p>
              <p className="text-xs text-[#8b949e] mt-1">Licenses Earned</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{matchesManaged}</p>
              <p className="text-xs text-[#8b949e] mt-1">Matches Managed</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{trophies.length}</p>
              <p className="text-xs text-[#8b949e] mt-1">Trophies Won</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#c9d1d9]">{managerReputation}</p>
              <p className="text-xs text-[#8b949e] mt-1">Reputation Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // Render
  // ============================================================
  const tabContent: Record<TabId, () => React.JSX.Element> = {
    pathway: renderPathwayTab,
    philosophy: renderPhilosophyTab,
    youth: renderYouthTab,
    ambitions: renderAmbitionsTab,
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#c9d1d9] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Coaching Career
              </h1>
              <p className="text-sm text-[#8b949e] mt-1">
                {playerName} | Age {playerAge} | {currentClub?.name ?? 'Unknown Club'} | Season {currentSeason}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {completedLicenses > 0 ? COACHING_LICENSES[currentLicenseIndex]?.name ?? 'No License' : 'Getting Started'}
              </Badge>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-opacity ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] bg-[#21262d] border border-[#30363d]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
