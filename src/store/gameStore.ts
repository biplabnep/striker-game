// ============================================================
// Elite Striker - Game Store (Zustand 5)
// Central state management orchestrating all game actions
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  GameScreen,
  GameNotification,
  Player,
  Position,
  Club,
  MatchResult,
  MatchEvent,
  WeatherCondition,
  WeatherType,
  Fixture,
  LeagueStanding,
  TrainingSession,
  SaveSlot,
  TransferOffer,
  LoanOffer,
  PlayerAttributes,
  Achievement,
  SquadStatus,
  SeasonObjectivesSet,
  SeasonAward,
  YouthTeam,
  YouthLeagueStanding,
  YouthFixture,
  YouthMatchResult,
  YouthPlayer,
  Relationship,
  TeamDynamics,
  InternationalFixture,
  InternationalCareer,
  PlayerMindset,
  MoraleFactor,
  PlayerTeamLevel,
  SeasonTrainingFocus,
  SeasonTrainingFocusArea,
  Injury,
  InjuryType,
  InjuryCategory,
} from '@/lib/game/types';

// Engine imports
import { simulateMatch } from '@/lib/game/matchEngine';
import {
  applyWeeklyProgression,
  calculateOverall,
  applySeasonProgression,
  determineSquadStatusUpdate,
  updateForm,
  calculateFocusBonusMultiplier,
  FOCUS_AREA_ATTRIBUTES,
} from '@/lib/game/progressionEngine';
import { generateRandomEvent, resolveEventChoice } from '@/lib/game/randomEvents';
import {
  isTransferWindow,
  generateTransferOffers,
  generateLoanOffers,
  executeTransfer,
  executeLoan,
} from '@/lib/game/transferEngine';
import {
  processMediaReaction,
  generateSocialPost,
  generateNewStoryline,
  updateStorylines,
} from '@/lib/game/socialEngine';
import {
  getClubById,
  getClubsByLeague,
  ENRICHED_CLUBS,
  LEAGUES,
  getSeasonMatchdays,
  CUP_NAMES,
  CUP_MATCH_WEEKS,
} from '@/lib/game/clubsData';
import {
  generatePlayerName,
  generateInitialAttributes,
} from '@/lib/game/playerData';
import {
  generateId,
  calculateMarketValue,
  calculateWage,
  randomBetween,
  clamp,
  formatCurrency,
} from '@/lib/game/gameUtils';
import {
  generateSeasonObjectives,
  updateObjectivesProgress,
  generateSeasonAwards,
  calculateObjectiveBonus,
} from '@/lib/game/objectivesEngine';
import {
  generateAllYouthTeams,
  generateYouthLeagueFixtures,
  generateYouthCupFixtures,
  generateYouthLeagueTable,
  simulateYouthMatch,
  updateYouthLeagueTable,
  applyYouthWeeklyProgression,
  generateYouthIntake,
  promoteYouthPlayerToU21,
  promoteYouthPlayerToFirstTeam,
  ageUpYouthPlayers,
} from '@/lib/game/youthAcademy';
import {
  generateInitialRelationships,
  updateRelationshipsAfterMatch,
  updateRelationshipsWeekly,
  calculateTeamDynamics,
  getDefaultTeamDynamics,
  generateNewRelationshipsOnTransfer,
  getRelationshipLevel,
} from '@/lib/game/relationshipsEngine';
import {
  determineContinentalQualification,
  selectContinentalClubs,
  generateContinentalGroupFixtures,
  updateContinentalStandings,
  simulateContinentalMatch,
  getQualifiedFromGroups,
  generateKnockoutFixtures,
  CONTINENTAL_GROUP_MATCH_WEEKS,
  CONTINENTAL_KO_MATCH_WEEKS,
  getContinentalName,
  getStageName,
} from '@/lib/game/continentalEngine';
import {
  shouldCallUp,
  isInternationalBreakWeek,
  processInternationalMatch,
  updateInternationalCareer,
  getCallUpReputationBoost,
  getInternationalMoraleChange,
  getInternationalFatigueCost,
  generateSeasonInternationalFixtures,
  getMatchTypeLabel,
} from '@/lib/game/internationalEngine';

// ============================================================
// Retirement probability calculation
// ============================================================
export function calculateRetirementProbability(
  age: number,
  fitness: number,
  totalInjuries: number,
  hasCareerThreateningInjury: boolean,
  morale: number
): number {
  if (age <= 32) return 0;
  // Base: 5% at 33, +8% per year
  const base = 5 + (age - 33) * 8;
  let probability = age >= 38 ? 45 : Math.min(base, 45);
  // Modifiers
  if (fitness < 50) probability += 10;
  if (totalInjuries > 10) probability += 8;
  if (hasCareerThreateningInjury) probability += 15;
  if (morale > 80) probability -= 5;
  if (morale < 30) probability += 8;
  return Math.max(0, Math.min(100, Math.round(probability)));
}

// Persistence
import {
  saveGame as persistSaveGame,
  loadGame as persistLoadGame,
  deleteSave as persistDeleteSave,
} from '@/services/persistenceService';

// ============================================================
// Store Types
// ============================================================

interface MatchAnimationState {
  isPlaying: boolean;
  events: MatchEvent[];
  currentMinute: number;
}

interface GameStoreState {
  // Core state
  gameState: GameState | null;
  screen: GameScreen;
  notifications: GameNotification[];
  isProcessing: boolean;
  matchAnimation: MatchAnimationState;

  // Scheduled training for the current week
  scheduledTraining: TrainingSession | null;
}

interface GameStoreActions {
  // Career Management
  startNewCareer: (config: {
    name: string;
    nationality: string;
    position: Position;
    clubId: string;
    difficulty: 'easy' | 'normal' | 'hard';
  }) => void;
  loadCareer: (saveSlot: SaveSlot) => void;
  deleteCareer: (saveSlotId: string) => void;

  // Game Loop
  advanceWeek: () => void;
  advanceMonth: () => void;
  simulateSeason: () => void;
  playNextMatch: () => void;

  // Match
  simulateMatchInternal: () => MatchResult | null;

  // Training
  scheduleTraining: (session: TrainingSession) => void;
  completeTraining: () => void;

  // Events
  resolveEvent: (eventId: string, choiceId: string) => void;

  // Transfers
  acceptTransfer: (offerId: string) => void;
  rejectTransfer: (offerId: string) => void;
  acceptLoan: (offerId: string) => void;
  rejectLoan: (offerId: string) => void;

  // Contract Negotiation
  negotiateContract: (offer: {
    weeklyWage: number;
    yearsRemaining: number;
    signingBonus: number;
    performanceBonuses?: {
      goalsBonus?: number;
      assistBonus?: number;
      cleanSheetBonus?: number;
    };
    releaseClause?: number;
  }) => void;

  // Navigation
  setScreen: (screen: GameScreen) => void;
  addNotification: (
    notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Youth Academy
  promoteYouthPlayer: (playerId: string, target: 'u21' | 'first_team') => void;
  setYouthTrainingFocus: (playerId: string, focus: keyof PlayerAttributes) => void;
  generateNewYouthIntake: () => void;

  // Relationships
  promoteRelationshipLevel: (relationshipId: string) => void;

  // Mindset
  setMindset: (mindset: PlayerMindset) => void;

  // Weather
  setWeatherPreparation: (preparation: 'standard' | 'adapt' | 'ignore') => void;

  // Season Training Focus
  setSeasonTrainingFocus: (area: SeasonTrainingFocusArea) => void;

  // Player Team Level
  promoteToU21: () => void;
  promoteToSenior: () => void;

  // Save/Load
  saveGame: (slotName: string) => void;
  loadGame: (slotId: string) => void;
}

export type GameStore = GameStoreState & GameStoreActions;

// ============================================================
// Helper: Create a notification with auto-generated fields
// ============================================================
function createNotification(
  input: Omit<GameNotification, 'id' | 'timestamp' | 'read'>
): GameNotification {
  return {
    ...input,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };
}

// ============================================================
// Helper: Generate weather condition for a given season/week
// ============================================================
const WEATHER_TYPES: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'windy', 'snowy', 'foggy', 'hot', 'stormy'];

const WEATHER_ENGINE_MODIFIERS_MAP: Record<WeatherType, { stat: string; modifier: number; label: string }[]> = {
  sunny:  [],
  cloudy: [],
  rainy:  [
    { stat: 'pace', modifier: -10, label: 'Pace' },
    { stat: 'shooting', modifier: -15, label: 'Shooting' },
    { stat: 'passing', modifier: -10, label: 'Passing' },
  ],
  windy: [
    { stat: 'shooting', modifier: -10, label: 'Shooting' },
    { stat: 'passing', modifier: -15, label: 'Passing' },
  ],
  snowy: [
    { stat: 'pace', modifier: -20, label: 'Pace' },
    { stat: 'shooting', modifier: -15, label: 'Shooting' },
    { stat: 'physical', modifier: -10, label: 'Physical' },
  ],
  hot: [
    { stat: 'pace', modifier: -10, label: 'Pace' },
    { stat: 'physical', modifier: -15, label: 'Physical' },
    { stat: 'fatigue', modifier: 20, label: 'Fatigue' },
  ],
  stormy: [
    { stat: 'pace', modifier: -15, label: 'Pace' },
    { stat: 'shooting', modifier: -20, label: 'Shooting' },
    { stat: 'passing', modifier: -15, label: 'Passing' },
    { stat: 'physical', modifier: -10, label: 'Physical' },
    { stat: 'fatigue', modifier: 20, label: 'Fatigue' },
  ],
  foggy: [
    { stat: 'passing', modifier: -10, label: 'Passing' },
    { stat: 'shooting', modifier: -5, label: 'Shooting' },
  ],
};

const WEATHER_NAMES: Record<WeatherType, string> = {
  sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rainy', windy: 'Windy',
  snowy: 'Snowy', foggy: 'Foggy', hot: 'Hot', stormy: 'Stormy',
};

const WEATHER_SEVERITIES: Record<WeatherType, WeatherCondition['severity']> = {
  sunny: 'none', cloudy: 'none', rainy: 'mild', windy: 'mild',
  snowy: 'moderate', foggy: 'moderate', hot: 'mild', stormy: 'severe',
};

function generateWeatherCondition(season: number, week: number): WeatherCondition {
  const idx = (season * 13 + week * 7) % WEATHER_TYPES.length;
  const type = WEATHER_TYPES[idx];
  return {
    type,
    name: WEATHER_NAMES[type],
    severity: WEATHER_SEVERITIES[type],
    modifiers: WEATHER_ENGINE_MODIFIERS_MAP[type],
  };
}

// ============================================================
// Helper: Generate cup fixtures (single-elimination knockout)
// All teams enter round 1. Each round halves the teams.
// Cup match weeks are at weeks 4, 8, 12, 16, 20, 24, 28, 32, 36
// ============================================================
function generateCupFixtures(leagueId: string, season: number): Fixture[] {
  const clubs = getClubsByLeague(leagueId);
  const fixtures: Fixture[] = [];

  if (clubs.length < 2) return fixtures;

  // Shuffle clubs for random draw
  const shuffled = [...clubs].sort(() => Math.random() - 0.5);
  const clubIds = shuffled.map((c) => c.id);
  const n = clubIds.length;

  // Calculate rounds needed
  // With 20 teams: R1(20→10), R2(10→5+3 byes=8), R3(8→4), R4(4→2), R5(2→1 final)
  // With 18 teams: R1(18→9+7 byes=16), R2(16→8), R3(8→4), R4(4→2), R5(2→1 final)
  const rounds: string[][] = [];

  // Determine how many rounds we need
  let teamsInRound = n;
  let roundIndex = 0;

  // Start with all teams
  let currentTeams = [...clubIds];

  while (currentTeams.length > 1 && roundIndex < CUP_MATCH_WEEKS.length) {
    const nextRound: string[] = [];
    const matchCount = Math.floor(currentTeams.length / 2);

    for (let i = 0; i < matchCount; i++) {
      const homeId = currentTeams[i];
      const awayId = currentTeams[currentTeams.length - 1 - i];

      fixtures.push({
        id: generateId(),
        homeClubId: homeId,
        awayClubId: awayId,
        date: `Season ${season}, Cup Round ${roundIndex + 1}`,
        matchday: roundIndex + 1, // cup round number
        competition: 'cup',
        season,
        played: false,
      });

      // For now, mark winners as the first team in each pair
      // Actual winners will be determined when matches are simulated
      // We just need to generate first round fixtures
      nextRound.push(homeId); // placeholder
    }

    // If odd number of teams, the middle team gets a bye
    if (currentTeams.length % 2 === 1) {
      const byeTeam = currentTeams[matchCount];
      nextRound.push(byeTeam);
    }

    currentTeams = nextRound;
    roundIndex++;
  }

  return fixtures;
}

// ============================================================
// Helper: Get the cup round name
// ============================================================
function getCupRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  if (round === 1) return 'Round 1';
  return `Round ${round}`;
}

// ============================================================
// Helper: Generate initial league table
// ============================================================
function generateLeagueTable(leagueId: string, playerClubId: string): LeagueStanding[] {
  const clubs = getClubsByLeague(leagueId);
  // Shuffle for initial positions
  const shuffled = [...clubs].sort(() => Math.random() - 0.5);

  return shuffled.map((club) => ({
    clubId: club.id,
    clubName: club.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

// ============================================================
// Helper: Generate season fixtures (round-robin, circle method)
// For N teams: (N-1) rounds in first half, (N-1) in second half
// Each round has N/2 matches. Total matchdays = (N-1)*2.
// ============================================================
function generateFixtures(leagueId: string, season: number): Fixture[] {
  const clubs = getClubsByLeague(leagueId);
  const fixtures: Fixture[] = [];

  if (clubs.length < 2) return fixtures;

  const clubIds = clubs.map((c) => c.id);
  const n = clubIds.length;
  const totalRounds = n - 1; // rounds per half-season
  const matchesPerRound = Math.floor(n / 2);

  // Circle method: fix team 0, rotate the rest
  // teams[0] is fixed, teams[1..n-1] rotate
  const teams = [...clubIds];

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = match === 0 ? 0 : ((round + match) % (n - 1)) + 1;
      const awayIdx = ((round + (n - 1) - match) % (n - 1)) + 1;

      const homeTeam = match === 0 ? teams[0] : teams[homeIdx];
      const awayTeam = teams[awayIdx];

      // First half: home/away as scheduled
      fixtures.push({
        id: generateId(),
        homeClubId: homeTeam,
        awayClubId: awayTeam,
        date: `Season ${season}, Week ${round + 1}`,
        matchday: round + 1,
        competition: 'league',
        season,
        played: false,
      });

      // Second half: reverse home/away
      fixtures.push({
        id: generateId(),
        homeClubId: awayTeam,
        awayClubId: homeTeam,
        date: `Season ${season}, Week ${totalRounds + round + 1}`,
        matchday: totalRounds + round + 1,
        competition: 'league',
        season,
        played: false,
      });
    }
  }

  return fixtures;
}

// ============================================================
// Helper: Update league table after a match
// ============================================================
function updateLeagueTable(
  table: LeagueStanding[],
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number
): LeagueStanding[] {
  const updated = table.map((entry) => ({ ...entry }));

  const homeEntry = updated.find((e) => e.clubId === homeClubId);
  const awayEntry = updated.find((e) => e.clubId === awayClubId);

  if (homeEntry) {
    homeEntry.played += 1;
    homeEntry.goalsFor += homeScore;
    homeEntry.goalsAgainst += awayScore;
    if (homeScore > awayScore) {
      homeEntry.won += 1;
      homeEntry.points += 3;
    } else if (homeScore === awayScore) {
      homeEntry.drawn += 1;
      homeEntry.points += 1;
    } else {
      homeEntry.lost += 1;
    }
  }

  if (awayEntry) {
    awayEntry.played += 1;
    awayEntry.goalsFor += awayScore;
    awayEntry.goalsAgainst += homeScore;
    if (awayScore > homeScore) {
      awayEntry.won += 1;
      awayEntry.points += 3;
    } else if (awayScore === homeScore) {
      awayEntry.drawn += 1;
      awayEntry.points += 1;
    } else {
      awayEntry.lost += 1;
    }
  }

  return updated;
}

// ============================================================
// Helper: Sort league table
// ============================================================
function sortLeagueTable(table: LeagueStanding[]): LeagueStanding[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  });
}

// ============================================================
// Helper: Generate initial achievements
// ============================================================
function generateInitialAchievements(): Achievement[] {
  return [
    { id: 'first_match', name: 'First Steps', description: 'Play your first professional match', icon: '⚽', unlocked: false, category: 'career', rarity: 'common' },
    { id: 'first_goal', name: 'Off the Mark', description: 'Score your first professional goal', icon: '🥅', unlocked: false, category: 'match', rarity: 'common' },
    { id: 'hat_trick', name: 'Hat-Trick Hero', description: 'Score 3 goals in a single match', icon: '🎩', unlocked: false, category: 'match', rarity: 'rare' },
    { id: 'debut_season', name: 'Full Season', description: 'Complete your first full season', icon: '📅', unlocked: false, category: 'career', rarity: 'common' },
    { id: 'wonderkid', name: 'Wonderkid', description: 'Reach 80+ overall before age 20', icon: '⭐', unlocked: false, category: 'career', rarity: 'epic' },
    { id: 'world_class', name: 'World Class', description: 'Reach 90+ overall', icon: '🏆', unlocked: false, category: 'career', rarity: 'legendary' },
    { id: 'transfer_record', name: 'Big Money Move', description: 'Be transferred for €50M+', icon: '💰', unlocked: false, category: 'transfer', rarity: 'rare' },
    { id: 'loyal_servant', name: 'One Club Player', description: 'Stay at the same club for 10+ seasons', icon: '❤️', unlocked: false, category: 'career', rarity: 'epic' },
    { id: 'top_scorer', name: 'Golden Boot', description: 'Finish as league top scorer', icon: '👟', unlocked: false, category: 'match', rarity: 'rare' },
    { id: 'training_dedication', name: 'Gym Rat', description: 'Complete 50 training sessions', icon: '🏋️', unlocked: false, category: 'training', rarity: 'common' },
    { id: 'social_media_star', name: 'Viral Sensation', description: 'Reach 95+ engagement on a social post', icon: '📱', unlocked: false, category: 'social', rarity: 'rare' },
    { id: 'comeback_king', name: 'Comeback King', description: 'Win after being 2+ goals down', icon: '👑', unlocked: false, category: 'match', rarity: 'epic' },
  ];
}

// ============================================================
// Helper: Determine player's fixture for the current week
// ============================================================
function findFixtureForWeek(
  fixtures: Fixture[],
  playerClubId: string,
  week: number
): Fixture | null {
  // Each matchday corresponds to a week
  // We map week 1-seasonLength to matchday 1-seasonLength
  const matchday = week;
  return (
    fixtures.find(
      (f) =>
        f.matchday === matchday &&
        !f.played &&
        (f.homeClubId === playerClubId || f.awayClubId === playerClubId)
    ) ?? null
  );
}

// ============================================================
// Helper: Simulate a match between two clubs for the league table
// (non-player matches)
// ============================================================
function simulateNPCTableMatch(
  homeClub: Club,
  awayClub: Club
): { homeScore: number; awayScore: number } {
  const homeStrength = homeClub.quality + randomBetween(-8, 8) + 3; // home advantage
  const awayStrength = awayClub.quality + randomBetween(-8, 8);

  const homeExpected = Math.max(0, (homeStrength - awayStrength) / 25 + 1.3);
  const awayExpected = Math.max(0, (awayStrength - homeStrength) / 25 + 1.0);

  // Poisson-like goals
  const homeGoals = poissonRandom(homeExpected);
  const awayGoals = poissonRandom(awayExpected);

  return { homeScore: homeGoals, awayScore: awayGoals };
}

function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ============================================================
// Helper: Apply player updates to game state
// ============================================================
function applyPlayerUpdates(
  player: Player,
  updates: Partial<Player>
): Player {
  return { ...player, ...updates };
}

// ============================================================
// Injury System: Names, risk calculation, generation
// ============================================================
const INJURY_NAMES_BY_CATEGORY: Record<InjuryCategory, string[]> = {
  muscle: ['Hamstring Strain', 'Calf Pull', 'Groin Pull', 'Thigh Strain', 'Back Spasm'],
  ligament: ['ACL Tear', 'MCL Sprain', 'Ankle Ligament', 'Knee Cartilage', 'Shoulder Dislocation'],
  bone: ['Fractured Metatarsal', 'Broken Rib', 'Hairline Fracture', 'Stress Fracture'],
  concussion: ['Mild Concussion', 'Head Injury'],
  illness: ['Viral Infection', 'Flu', 'Food Poisoning'],
};

function generateInjury(
  player: Player,
  week: number,
  season: number,
  difficulty: 'easy' | 'normal' | 'hard',
  highIntensityTraining: boolean
): Injury | null {
  // Base risk per match: ~5%
  let riskPercent = 5;

  // Modifiers
  if (highIntensityTraining) riskPercent += 3;
  if (player.fitness < 20) riskPercent += 5; // fatigue > 80% means fitness < 20
  if (player.age > 30) riskPercent += 3;
  // Previous injury this season increases risk
  if (player.injuryHistory.some(rec => rec.seasonOccured === season)) riskPercent += 2;
  if (difficulty === 'hard') riskPercent += 4;

  // Roll for injury
  if (Math.random() * 100 > riskPercent) return null;

  // Determine injury severity
  const roll = Math.random() * 100;
  let injuryType: InjuryType;
  let weeksOut: number;

  if (roll < 60) {
    // Minor: 60%
    injuryType = 'minor';
    weeksOut = Math.floor(Math.random() * 3) + 1; // 1-3 weeks
  } else if (roll < 85) {
    // Moderate: 25%
    injuryType = 'moderate';
    weeksOut = Math.floor(Math.random() * 5) + 4; // 4-8 weeks
  } else if (roll < 97) {
    // Severe: 12%
    injuryType = 'severe';
    weeksOut = Math.floor(Math.random() * 13) + 12; // 12-24 weeks (~3-6 months)
  } else {
    // Career threatening: 3%
    injuryType = 'career_threatening';
    weeksOut = Math.floor(Math.random() * 17) + 32; // 32-48 weeks (~8-12 months)
  }

  // Pick category based on severity
  const categoryRoll = Math.random();
  let category: InjuryCategory;
  if (categoryRoll < 0.08 && injuryType === 'minor') {
    category = 'concussion';
  } else if (categoryRoll < 0.10) {
    category = 'illness';
  } else if (categoryRoll < 0.35) {
    category = 'bone';
  } else if (categoryRoll < 0.55) {
    category = 'ligament';
  } else {
    category = 'muscle';
  }

  // Severe/career_threatening more likely to be ligament or bone
  if (injuryType === 'severe' || injuryType === 'career_threatening') {
    if (categoryRoll < 0.5) category = 'ligament';
    else if (categoryRoll < 0.8) category = 'bone';
    // else keep whatever was assigned
  }

  const names = INJURY_NAMES_BY_CATEGORY[category];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    id: generateId(),
    type: injuryType,
    category,
    name,
    weekSustained: week,
    seasonSustained: season,
    weeksOut,
    weeksRemaining: weeksOut,
    matchMissed: false,
  };
}

// ============================================================
// Helper: Migrate old GameState objects to include new fields
// Ensures backward compatibility when loading old saves
// ============================================================
function migrateGameState(gs: GameState | null): GameState | null {
  if (!gs) return null;
  return {
    ...gs,
    // Cup fields (added in earlier iteration)
    cupFixtures: gs.cupFixtures ?? [],
    cupRound: gs.cupRound ?? 1,
    cupEliminated: gs.cupEliminated ?? false,
    // Youth Academy fields
    youthTeams: gs.youthTeams ?? [],
    youthLeagueTables: gs.youthLeagueTables ?? [],
    youthFixtures: gs.youthFixtures ?? [],
    youthCupFixtures: gs.youthCupFixtures ?? [],
    youthCupRound: gs.youthCupRound ?? 1,
    youthCupEliminated: gs.youthCupEliminated ?? false,
    youthMatchResults: gs.youthMatchResults ?? [],
    youthLeagueMatchWeek: gs.youthLeagueMatchWeek ?? 1,
    // Relationships & Team Dynamics
    relationships: gs.relationships ?? [],
    teamDynamics: gs.teamDynamics ?? getDefaultTeamDynamics(),
    // Continental Competitions
    continentalFixtures: gs.continentalFixtures ?? [],
    continentalGroupStandings: gs.continentalGroupStandings ?? [],
    continentalQualified: gs.continentalQualified ?? false,
    continentalCompetition: gs.continentalCompetition ?? null,
    continentalKnockoutRound: gs.continentalKnockoutRound ?? 0,
    continentalEliminated: gs.continentalEliminated ?? false,
    // International Duty
    internationalFixtures: gs.internationalFixtures ?? [],
    internationalCareer: gs.internationalCareer ?? {
      caps: 0, goals: 0, assists: 0, averageRating: 0, tournaments: [],
      lastCallUpSeason: 0, lastCallUpWeek: 0,
    },
    internationalCalledUp: gs.internationalCalledUp ?? false,
    internationalOnBreak: gs.internationalOnBreak ?? false,
    // Player Team Level - migrate existing saves to senior
    playerTeamLevel: gs.playerTeamLevel ?? (gs.player.age <= 17 ? 'u18' : gs.player.age <= 20 ? 'u21' : 'senior'),
    // Season Training Focus
    seasonTrainingFocus: gs.seasonTrainingFocus ?? null,
    // Mindset & Morale
    mindset: gs.mindset ?? 'balanced',
    moraleFactors: gs.moraleFactors ?? [],
    // Season awards
    seasonAwards: gs.seasonAwards ?? [],
    // Game mode / difficulty
    gameMode: gs.gameMode ?? 'career',
    difficulty: gs.difficulty ?? 'normal',
    // Injury System
    injuries: gs.injuries ?? [],
    currentInjury: gs.currentInjury ?? null,
    // Weather System
    currentWeather: gs.currentWeather ?? null,
    weatherPreparation: gs.weatherPreparation ?? 'standard',
    // Retirement
    retirementPending: gs.retirementPending ?? false,
    retirementRiskPushed: gs.retirementRiskPushed ?? false,
  };
}

// ============================================================
// Create the Zustand store
// ============================================================
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ---- Initial State ----
      gameState: null,
      screen: 'main_menu' as GameScreen,
      notifications: [],
      isProcessing: false,
      matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
      scheduledTraining: null,

      // ---- Career Management ----

      startNewCareer: (config) => {
        const club = getClubById(config.clubId);
        if (!club) {
          console.error('Invalid club ID:', config.clubId);
          return;
        }

        // Generate player
        const { firstName, lastName } = generatePlayerName(config.nationality);
        const playerName = config.name || `${firstName} ${lastName}`;

        // Generate potential based on difficulty
        const potentialBase: Record<string, number> = {
          easy: 92,
          normal: 85,
          hard: 78,
        };
        const potential = potentialBase[config.difficulty] + randomBetween(-3, 5);

        // Generate initial attributes for a 14-year-old
        const attributes = generateInitialAttributes(config.position, 14, potential);
        const overall = calculateOverall(attributes, config.position);
        const marketValue = calculateMarketValue(overall, 14, potential, 5);
        const weeklyWage = calculateWage(overall, club.tier, 5);

        const playerId = generateId();

        const player: Player = {
          id: playerId,
          name: playerName,
          age: 14,
          nationality: config.nationality,
          position: config.position,
          secondaryPositions: [],
          attributes,
          overall,
          potential: Math.min(potential, 99),
          fitness: 85,
          morale: 70,
          form: 6.0,
          reputation: 5,
          marketValue,
          squadStatus: 'prospect' as SquadStatus,
          contract: {
            weeklyWage,
            yearsRemaining: 3,
            signingBonus: 0,
            performanceBonuses: {},
          },
          injuryWeeks: 0,
          injuryHistory: [],
          seasonStats: {
            appearances: 0,
            starts: 0,
            minutesPlayed: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellowCards: 0,
            redCards: 0,
            averageRating: 0,
            manOfTheMatch: 0,
            injuries: 0,
          },
          careerStats: {
            totalAppearances: 0,
            totalGoals: 0,
            totalAssists: 0,
            totalCleanSheets: 0,
            trophies: [],
            seasonsPlayed: 0,
          },
          traits: [],
          agentQuality: randomBetween(20, 50),
          preferredFoot: Math.random() < 0.7 ? 'right' : Math.random() < 0.5 ? 'left' : 'both',
        };

        // Generate league table
        const leagueTable = generateLeagueTable(club.league, club.id);

        // Generate season fixtures
        const seasonNumber = 1;
        const upcomingFixtures = generateFixtures(club.league, seasonNumber);
        const cupFixtures = generateCupFixtures(club.league, seasonNumber);

        const currentYear = new Date().getFullYear();

        const gameState: GameState = {
          player,
          currentClub: club,
          currentSeason: seasonNumber,
          currentWeek: 1,
          year: currentYear,
          seasons: [],
          recentResults: [],
          upcomingFixtures,
          leagueTable,
          activeEvents: [],
          resolvedEvents: [],
          transferOffers: [],
          loanOffers: [],
          socialFeed: [],
          storylines: [],
          achievements: generateInitialAchievements(),
          trainingHistory: [],
          trainingAvailable: 3,
          availableClubs: ENRICHED_CLUBS,
          notifications: [],
          seasonObjectives: [generateSeasonObjectives(
            ENRICHED_CLUBS.find(c => c.id === config.clubId) ?? ENRICHED_CLUBS[0],
            player,
            seasonNumber,
            getSeasonMatchdays(ENRICHED_CLUBS.find(c => c.id === config.clubId)?.league ?? 'premier_league')
          )],
          seasonAwards: [],
          cupFixtures,
          cupRound: 1,
          cupEliminated: false,
          // Youth Academy
          youthTeams: generateAllYouthTeams(club.league, seasonNumber),
          youthLeagueTables: [
            ...generateYouthLeagueTable(club.league, 'u18'),
            ...generateYouthLeagueTable(club.league, 'u21'),
          ],
          youthFixtures: [
            ...generateYouthLeagueFixtures(club.league, 'u18', seasonNumber),
            ...generateYouthLeagueFixtures(club.league, 'u21', seasonNumber),
          ],
          youthCupFixtures: [
            ...generateYouthCupFixtures(club.league, 'u18', seasonNumber),
            ...generateYouthCupFixtures(club.league, 'u21', seasonNumber),
          ],
          youthCupRound: 1,
          youthCupEliminated: false,
          youthMatchResults: [],
          youthLeagueMatchWeek: 1,
          // Relationships & Team Dynamics
          relationships: generateInitialRelationships(club, player),
          teamDynamics: getDefaultTeamDynamics(),
          // Continental Competitions (not qualified initially - qualification happens at season end)
          continentalFixtures: [],
          continentalGroupStandings: [],
          continentalQualified: false,
          continentalCompetition: null,
          continentalKnockoutRound: 0,
          continentalEliminated: false,
          // Player Team Level - start at youth
          playerTeamLevel: 'u18' as PlayerTeamLevel,
          // Season Training Focus - will be set at season start
          seasonTrainingFocus: null,
          // International Duty
          internationalFixtures: [],
          internationalCareer: {
            caps: 0,
            goals: 0,
            assists: 0,
            averageRating: 0,
            tournaments: [],
            lastCallUpSeason: 0,
            lastCallUpWeek: 0,
          },
          internationalCalledUp: false,
          internationalOnBreak: false,
          // Injury System
          injuries: [],
          currentInjury: null,
          // Weather System
          currentWeather: generateWeatherCondition(1, 1),
          weatherPreparation: 'standard' as const,
          // Retirement
          retirementPending: false,
          retirementRiskPushed: false,
          // Mindset & Morale
          mindset: 'balanced' as PlayerMindset,
          moraleFactors: [],
          // Game Mode
          gameMode: 'career',
          difficulty: config.difficulty,
          createdAt: new Date().toISOString(),
          lastSaved: new Date().toISOString(),
          playTime: 0,
        };

        set({
          gameState,
          screen: 'dashboard' as GameScreen,
          notifications: [],
          scheduledTraining: null,
          matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
        });

        get().addNotification({
          type: 'career',
          title: 'Career Started!',
          message: `Welcome to ${club.name}! You've joined the U18 academy. Set your training focus and develop your skills!`,
          actionRequired: false,
        });
      },

      loadCareer: (saveSlot) => {
        const migratedGameState = migrateGameState(saveSlot.gameState);
        set({
          gameState: migratedGameState,
          screen: 'dashboard' as GameScreen,
          notifications: [],
          scheduledTraining: null,
          matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
        });

        if (migratedGameState) {
          get().addNotification({
            type: 'career',
            title: 'Career Loaded',
            message: `Welcome back! ${migratedGameState.player.name} at ${migratedGameState.currentClub.name}`,
            actionRequired: false,
          });
        }
      },

      deleteCareer: (saveSlotId) => {
        persistDeleteSave(saveSlotId);
        const current = get();
        if (current.gameState) {
          // If the deleted save was the active one, clear it
          set({ screen: 'main_menu' as GameScreen });
        }
      },

      // ---- Game Loop ----

      advanceWeek: () => {
        const { gameState, scheduledTraining, isProcessing } = get();
        if (!gameState || isProcessing) return;

        set({ isProcessing: true });

        let state = { ...gameState };
        let player = { ...state.player };
        let currentClub = { ...state.currentClub };
        let leagueTable = [...state.leagueTable];
        let recentResults = [...state.recentResults];
        let upcomingFixtures = [...state.upcomingFixtures];
        let activeEvents = [...state.activeEvents];
        let resolvedEvents = [...state.resolvedEvents];
        let transferOffers = [...state.transferOffers];
        let loanOffers = [...state.loanOffers];
        let socialFeed = [...state.socialFeed];
        let storylines = [...state.storylines];
        let seasonAwards = [...(state.seasonAwards ?? [])];
        let trainingHistory = [...state.trainingHistory];
        let trainingAvailable = state.trainingAvailable;
        let cupFixtures = [...(state.cupFixtures ?? [])];
        let cupRound = state.cupRound ?? 1;
        let cupEliminated = state.cupEliminated ?? false;
        // Youth Academy state
        let youthTeams = [...(state.youthTeams ?? [])];
        let youthLeagueTables = [...(state.youthLeagueTables ?? [])];
        let youthFixtures = [...(state.youthFixtures ?? [])];
        let youthCupFixtures = [...(state.youthCupFixtures ?? [])];
        let youthCupRound = state.youthCupRound ?? 1;
        let youthCupEliminated = state.youthCupEliminated ?? false;
        let youthMatchResults = [...(state.youthMatchResults ?? [])];
        let youthLeagueMatchWeek = state.youthLeagueMatchWeek ?? 1;
        let relationships = [...(state.relationships ?? [])];
        let teamDynamics = state.teamDynamics ?? getDefaultTeamDynamics();
        // Continental state
        let continentalFixtures = [...(state.continentalFixtures ?? [])];
        let continentalGroupStandings = [...(state.continentalGroupStandings ?? [])];
        let continentalQualified = state.continentalQualified ?? false;
        let continentalCompetition = state.continentalCompetition ?? null;
        let continentalKnockoutRound = state.continentalKnockoutRound ?? 0;
        let continentalEliminated = state.continentalEliminated ?? false;
        // International Duty state
        let internationalFixtures = [...(state.internationalFixtures ?? [])];
        let internationalCareer = state.internationalCareer ?? {
          caps: 0, goals: 0, assists: 0, averageRating: 0, tournaments: [],
          lastCallUpSeason: 0, lastCallUpWeek: 0,
        };
        let internationalCalledUp = state.internationalCalledUp ?? false;
        let internationalOnBreak = state.internationalOnBreak ?? false;
        // Player team level & season training focus
        let playerTeamLevel = state.playerTeamLevel ?? 'senior';
        let seasonTrainingFocus = state.seasonTrainingFocus ?? null;
        // Injury system
        let injuries = [...(state.injuries ?? [])];
        let currentInjury = state.currentInjury ?? null;
        // Weather system
        let currentWeather = state.currentWeather ?? null;
        const weatherPreparation = state.weatherPreparation ?? 'standard';

        // 1. Increment week
        state.currentWeek += 1;
        const week = state.currentWeek;
        const season = state.currentSeason;

        // 1a. Generate weather for the upcoming match
        currentWeather = generateWeatherCondition(season, week);

        // 1a. Decrement current injury weeksRemaining; heal if recovered
        if (currentInjury) {
          const updatedInjury = { ...currentInjury, weeksRemaining: currentInjury.weeksRemaining - 1 };
          if (updatedInjury.weeksRemaining <= 0) {
            // Injury healed!
            const healedInjury = { ...updatedInjury, weeksRemaining: 0 };
            injuries = injuries.map(inc => inc.id === healedInjury.id ? healedInjury : inc);
            currentInjury = null;
            player.injuryWeeks = 0;
            get().addNotification({
              type: 'career',
              title: 'Injury Recovered!',
              message: `You've recovered from your ${healedInjury.name} and are ready to play again!`,
              actionRequired: false,
            });
          } else {
            currentInjury = updatedInjury;
            injuries = injuries.map(inc => inc.id === updatedInjury.id ? updatedInjury : inc);
            player.injuryWeeks = updatedInjury.weeksRemaining;
          }
        }

        // 2. Match simulation - depends on player's team level
        // If player is at youth level, they play youth matches instead of senior
        const isAtYouthLevel = playerTeamLevel === 'u18' || playerTeamLevel === 'u21';
        const fixture = !isAtYouthLevel ? findFixtureForWeek(
          upcomingFixtures,
          currentClub.id,
          week
        ) : null;

        let matchResult: MatchResult | null = null;

        if (fixture) {
          const isHome = fixture.homeClubId === currentClub.id;
          const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId;
          const opponent = getClubById(opponentId);

          if (opponent) {
            const homeClub = isHome ? currentClub : opponent;
            const awayClub = isHome ? opponent : currentClub;

            // Simulate the player's match
            matchResult = simulateMatch(homeClub, awayClub, player, 'league', isHome ? 'home' : 'away', currentWeather, weatherPreparation);
            matchResult.week = week;
            matchResult.season = season;

            recentResults.unshift(matchResult);
            if (recentResults.length > 10) recentResults = recentResults.slice(0, 10);

            // Mark fixture as played
            const fixIdx = upcomingFixtures.findIndex((f) => f.id === fixture.id);
            if (fixIdx >= 0) {
              upcomingFixtures[fixIdx] = { ...upcomingFixtures[fixIdx], played: true };
            }

            // Update player season stats
            const stats = { ...player.seasonStats };
            if (matchResult.playerMinutesPlayed > 0) {
              stats.appearances += 1;
              if (matchResult.playerStarted) stats.starts += 1;
              stats.minutesPlayed += matchResult.playerMinutesPlayed;
              stats.goals += matchResult.playerGoals;
              stats.assists += matchResult.playerAssists;
              stats.averageRating =
                (stats.averageRating * (stats.appearances - 1) + matchResult.playerRating) /
                stats.appearances;
              stats.averageRating = Math.round(stats.averageRating * 10) / 10;
            }
            player.seasonStats = stats;

            // Update career stats
            const career = { ...player.careerStats };
            if (matchResult.playerMinutesPlayed > 0) {
              career.totalAppearances += 1;
              career.totalGoals += matchResult.playerGoals;
              career.totalAssists += matchResult.playerAssists;
            }
            player.careerStats = career;

            // Update form
            const recentRatings = recentResults
              .filter((r) => r.playerRating > 0)
              .map((r) => r.playerRating);
            player.form = updateForm(player, recentRatings);

            // Update league table for player's match
            const homeScore = matchResult.homeScore;
            const awayScore = matchResult.awayScore;
            leagueTable = updateLeagueTable(
              leagueTable,
              fixture.homeClubId,
              fixture.awayClubId,
              homeScore,
              awayScore
            );

            // Generate social posts from match
            const matchPosts = processMediaReaction(player, matchResult, currentClub.id);
            socialFeed = [...matchPosts, ...socialFeed].slice(0, 50);

            // Check for match injury — enhanced injury system
            const injuryEvent = matchResult.events.find(
              (e) => e.type === 'injury' && e.playerId === player.id
            );
            // Also use the risk-based injury system (can trigger even without match event)
            const hadHighIntensityTraining = scheduledTraining?.intensity === 90;
            const matchInjury = injuryEvent ? generateInjury(
              player, week, season, state.difficulty, hadHighIntensityTraining
            ) : null;
            const randomInjury = !injuryEvent && matchResult.playerMinutesPlayed > 0
              ? generateInjury(player, week, season, state.difficulty, hadHighIntensityTraining)
              : null;
            const newInjury = matchInjury ?? randomInjury;

            if (newInjury) {
              newInjury.matchMissed = true;
              currentInjury = newInjury;
              injuries = [...injuries, newInjury];
              player.injuryWeeks = newInjury.weeksOut;
              player.seasonStats.injuries += 1;
              player.injuryHistory = [
                ...player.injuryHistory,
                {
                  type: newInjury.name,
                  weekOccured: week,
                  seasonOccured: season,
                  weeksOut: newInjury.weeksOut,
                },
              ];
              const severityLabel = newInjury.type === 'career_threatening' ? 'CAREER-THREATENING' :
                newInjury.type === 'severe' ? 'SEVERE' :
                newInjury.type === 'moderate' ? 'Moderate' : 'Minor';
              get().addNotification({
                type: 'match',
                title: `${severityLabel} Injury!`,
                message: `${newInjury.name} — out for ${newInjury.weeksOut} weeks.`,
                actionRequired: false,
              });
            }

            // Check achievements
            const achievements = [...state.achievements];
            if (!achievements.find((a) => a.id === 'first_match')?.unlocked && matchResult.playerMinutesPlayed > 0) {
              const idx = achievements.findIndex((a) => a.id === 'first_match');
              if (idx >= 0) {
                achievements[idx] = { ...achievements[idx], unlocked: true, unlockedSeason: season };
                get().addNotification({ type: 'achievement', title: 'Achievement Unlocked!', message: 'First Steps - Play your first professional match', actionRequired: false });
              }
            }
            if (!achievements.find((a) => a.id === 'first_goal')?.unlocked && matchResult.playerGoals > 0) {
              const idx = achievements.findIndex((a) => a.id === 'first_goal');
              if (idx >= 0) {
                achievements[idx] = { ...achievements[idx], unlocked: true, unlockedSeason: season };
                get().addNotification({ type: 'achievement', title: 'Achievement Unlocked!', message: 'Off the Mark - Score your first professional goal', actionRequired: false });
              }
            }
            state.achievements = achievements;

            // Simulate other matches in the league for this matchday
            const otherFixtures = upcomingFixtures.filter(
              (f) => f.matchday === week && f.id !== fixture.id && !f.played
            );
            for (const otherFix of otherFixtures) {
              const homeTeam = getClubById(otherFix.homeClubId);
              const awayTeam = getClubById(otherFix.awayClubId);
              if (homeTeam && awayTeam) {
                const result = simulateNPCTableMatch(homeTeam, awayTeam);
                leagueTable = updateLeagueTable(
                  leagueTable,
                  otherFix.homeClubId,
                  otherFix.awayClubId,
                  result.homeScore,
                  result.awayScore
                );
                const fIdx = upcomingFixtures.findIndex((f) => f.id === otherFix.id);
                if (fIdx >= 0) {
                  upcomingFixtures[fIdx] = { ...upcomingFixtures[fIdx], played: true };
                }
              }
            }
          }
        }

        // 2a. When player is at youth level, simulate ALL senior matches as NPC matches
        // so the league table still updates correctly
        if (isAtYouthLevel) {
          const allFixturesThisWeek = upcomingFixtures.filter(
            (f) => f.matchday === week && !f.played
          );
          for (const fix of allFixturesThisWeek) {
            const homeTeam = getClubById(fix.homeClubId);
            const awayTeam = getClubById(fix.awayClubId);
            if (homeTeam && awayTeam) {
              const result = simulateNPCTableMatch(homeTeam, awayTeam);
              leagueTable = updateLeagueTable(
                leagueTable,
                fix.homeClubId,
                fix.awayClubId,
                result.homeScore,
                result.awayScore
              );
              const fIdx = upcomingFixtures.findIndex((f) => f.id === fix.id);
              if (fIdx >= 0) {
                upcomingFixtures[fIdx] = { ...upcomingFixtures[fIdx], played: true };
              }
            }
          }
        }

        // 2b. Cup match processing (on cup weeks) - only for senior players
        const isCupWeek = CUP_MATCH_WEEKS.includes(week);
        if (isCupWeek && !cupEliminated && cupFixtures.length > 0 && !isAtYouthLevel) {
          // Find unplayed cup fixtures for current round
          const currentCupRound = cupFixtures.filter(f => f.matchday === cupRound && !f.played);

          if (currentCupRound.length > 0) {
            // Check if player's team has a cup match this round
            const playerCupFixture = currentCupRound.find(
              f => f.homeClubId === currentClub.id || f.awayClubId === currentClub.id
            );

            if (playerCupFixture) {
              const isCupHome = playerCupFixture.homeClubId === currentClub.id;
              const cupOpponentId = isCupHome ? playerCupFixture.awayClubId : playerCupFixture.homeClubId;
              const cupOpponent = getClubById(cupOpponentId);

              if (cupOpponent) {
                const cupHomeClub = isCupHome ? currentClub : cupOpponent;
                const cupAwayClub = isCupHome ? cupOpponent : currentClub;

                // Simulate cup match (midweek)
                const cupMatchResult = simulateMatch(cupHomeClub, cupAwayClub, player, 'cup', isCupHome ? 'home' : 'away', currentWeather, weatherPreparation);
                cupMatchResult.week = week;
                cupMatchResult.season = season;
                cupMatchResult.competition = 'cup';

                recentResults.unshift(cupMatchResult);
                if (recentResults.length > 10) recentResults = recentResults.slice(0, 10);

                // Mark cup fixture as played
                const cupFixIdx = cupFixtures.findIndex(f => f.id === playerCupFixture.id);
                if (cupFixIdx >= 0) {
                  cupFixtures[cupFixIdx] = { ...cupFixtures[cupFixIdx], played: true };
                }

                // Update player stats from cup match
                const cupStats = { ...player.seasonStats };
                if (cupMatchResult.playerMinutesPlayed > 0) {
                  cupStats.appearances += 1;
                  if (cupMatchResult.playerStarted) cupStats.starts += 1;
                  cupStats.minutesPlayed += cupMatchResult.playerMinutesPlayed;
                  cupStats.goals += cupMatchResult.playerGoals;
                  cupStats.assists += cupMatchResult.playerAssists;
                  cupStats.averageRating =
                    (cupStats.averageRating * (cupStats.appearances - 1) + cupMatchResult.playerRating) /
                    cupStats.appearances;
                  cupStats.averageRating = Math.round(cupStats.averageRating * 10) / 10;
                }
                player.seasonStats = cupStats;

                // Update career stats
                const cupCareer = { ...player.careerStats };
                if (cupMatchResult.playerMinutesPlayed > 0) {
                  cupCareer.totalAppearances += 1;
                  cupCareer.totalGoals += cupMatchResult.playerGoals;
                  cupCareer.totalAssists += cupMatchResult.playerAssists;
                }
                player.careerStats = cupCareer;

                // Update form
                const cupRecentRatings = recentResults
                  .filter(r => r.playerRating > 0)
                  .map(r => r.playerRating);
                player.form = updateForm(player, cupRecentRatings);

                // Check if player's team lost → eliminated
                const playerWonCup = (isCupHome && cupMatchResult.homeScore > cupMatchResult.awayScore) ||
                                     (!isCupHome && cupMatchResult.awayScore > cupMatchResult.homeScore);
                const cupDraw = cupMatchResult.homeScore === cupMatchResult.awayScore;

                if (!playerWonCup && !cupDraw) {
                  // Player lost - eliminated from cup
                  cupEliminated = true;
                  get().addNotification({
                    type: 'match',
                    title: 'Cup Elimination! 💔',
                    message: `You've been knocked out of the ${CUP_NAMES[currentClub.league]?.name ?? 'Cup'} in Round ${cupRound}.`,
                    actionRequired: false,
                  });
                } else {
                  get().addNotification({
                    type: 'match',
                    title: cupDraw ? 'Cup Draw!' : 'Cup Advance! 🏆',
                    message: cupDraw
                      ? `${CUP_NAMES[currentClub.league]?.name ?? 'Cup'}: Drew ${cupMatchResult.homeScore}-${cupMatchResult.awayScore} vs ${cupOpponent.name}. You advance!`
                      : `${CUP_NAMES[currentClub.league]?.name ?? 'Cup'}: Won ${isCupHome ? cupMatchResult.homeScore : cupMatchResult.awayScore}-${isCupHome ? cupMatchResult.awayScore : cupMatchResult.homeScore} vs ${cupOpponent.name}!`,
                    actionRequired: false,
                  });
                }

                // Fitness drain from cup match
                if (cupMatchResult.playerMinutesPlayed > 0) {
                  const cupDrain = Math.round(cupMatchResult.playerMinutesPlayed / 6);
                  player.fitness = clamp(player.fitness - cupDrain, 0, 100);
                }

                // Morale from cup result
                if (cupMatchResult.playerRating >= 7.5) {
                  player.morale = clamp(player.morale + 3, 0, 100);
                } else if (cupMatchResult.playerRating < 5.0) {
                  player.morale = clamp(player.morale - 5, 0, 100);
                }

                // Check for cup match injury
                const cupInjuryEvent = cupMatchResult.events.find(
                  e => e.type === 'injury' && e.playerId === player.id
                );
                if (cupInjuryEvent) {
                  const weeksOut = randomBetween(1, 6);
                  player.injuryWeeks = weeksOut;
                  player.injuryHistory = [
                    ...player.injuryHistory,
                    {
                      type: 'Cup Match Injury',
                      weekOccured: week,
                      seasonOccured: season,
                      weeksOut,
                    },
                  ];
                }

                // Social media from cup match
                const cupPosts = processMediaReaction(player, cupMatchResult, currentClub.id);
                socialFeed = [...cupPosts, ...socialFeed].slice(0, 50);
              }
            }

            // Simulate other NPC cup matches for this round
            const otherCupFixtures = currentCupRound.filter(
              f => f.id !== playerCupFixture?.id && !f.played
            );
            for (const otherCupFix of otherCupFixtures) {
              const homeTeam = getClubById(otherCupFix.homeClubId);
              const awayTeam = getClubById(otherCupFix.awayClubId);
              if (homeTeam && awayTeam) {
                // Mark as played (NPC result doesn't need detailed tracking)
                const npcCupIdx = cupFixtures.findIndex(f => f.id === otherCupFix.id);
                if (npcCupIdx >= 0) {
                  cupFixtures[npcCupIdx] = { ...cupFixtures[npcCupIdx], played: true };
                }
              }
            }

            // Advance to next cup round if all current round matches are played
            const remainingInRound = cupFixtures.filter(f => f.matchday === cupRound && !f.played);
            if (remainingInRound.length === 0) {
              cupRound += 1;

              // Check if player won the final (no more rounds)
              const nextRoundFixtures = cupFixtures.filter(f => f.matchday === cupRound);
              if (nextRoundFixtures.length === 0 && !cupEliminated) {
                // Player won the cup!
                const cupName = CUP_NAMES[currentClub.league]?.name ?? 'Domestic Cup';
                player.careerStats.trophies = [
                  ...player.careerStats.trophies,
                  { name: cupName, season }
                ];

                // Big morale/reputation boost
                player.morale = clamp(player.morale + 15, 0, 100);
                player.reputation = clamp(player.reputation + 5, 0, 100);

                get().addNotification({
                  type: 'match',
                  title: '🏆 Cup Winner!',
                  message: `You've won the ${cupName}! What an achievement!`,
                  actionRequired: false,
                });
              }
            }
          }
        } else if (isCupWeek && cupEliminated) {
          // Still simulate NPC cup matches even if player is eliminated
          const currentCupRound = cupFixtures.filter(f => f.matchday === cupRound && !f.played);
          for (const otherCupFix of currentCupRound) {
            const npcCupIdx = cupFixtures.findIndex(f => f.id === otherCupFix.id);
            if (npcCupIdx >= 0) {
              cupFixtures[npcCupIdx] = { ...cupFixtures[npcCupIdx], played: true };
            }
          }
          const remainingInRound = cupFixtures.filter(f => f.matchday === cupRound && !f.played);
          if (remainingInRound.length === 0) {
            cupRound += 1;
          }
        }

        // 2c. Youth Academy: simulate youth league matches
        // Youth leagues play every week (same schedule as senior)
        // When player is at youth level, they participate in these matches
        const youthMatchday = youthLeagueMatchWeek;
        for (const category of ['u18', 'u21'] as const) {
          const isPlayerCategory = playerTeamLevel === category;
          const youthLeagueFixturesThisWeek = youthFixtures.filter(
            f => f.matchday === youthMatchday && f.category === category && !f.played
          );

          for (const yf of youthLeagueFixturesThisWeek) {
            const homeTeam = getClubById(yf.homeClubId);
            const awayTeam = getClubById(yf.awayClubId);
            const isPlayerClub = yf.homeClubId === currentClub.id || yf.awayClubId === currentClub.id;

            if (homeTeam && awayTeam) {
              let result;

              // If player is at this youth level and it's their club's match, simulate with player
              if (isPlayerCategory && isPlayerClub && player.injuryWeeks === 0) {
                const isHome = yf.homeClubId === currentClub.id;
                // Simulate youth match with player participating (using lower-quality match engine)
                result = simulateYouthMatch(homeTeam, awayTeam, category, 'youth_league');

                // Create a MatchResult for the player's participation
                const playerYouthMatch: MatchResult = {
                  homeClub: homeTeam,
                  awayClub: awayTeam,
                  homeScore: result.homeScore,
                  awayScore: result.awayScore,
                  events: [],
                  playerRating: Math.round((5 + Math.random() * 4) * 10) / 10, // 5-9 for youth
                  playerMinutesPlayed: Math.min(90, Math.max(45, Math.floor(Math.random() * 45 + 45))), // 45-90 min
                  playerStarted: true,
                  playerGoals: Math.random() < 0.25 ? 1 : 0, // Youth scoring rate
                  playerAssists: Math.random() < 0.2 ? 1 : 0,
                  competition: `youth_${category}`,
                  week,
                  season,
                };
                recentResults.unshift(playerYouthMatch);
                if (recentResults.length > 10) recentResults = recentResults.slice(0, 10);

                // Update player season stats from youth match
                const yStats = { ...player.seasonStats };
                if (playerYouthMatch.playerMinutesPlayed > 0) {
                  yStats.appearances += 1;
                  yStats.starts += 1;
                  yStats.minutesPlayed += playerYouthMatch.playerMinutesPlayed;
                  yStats.goals += playerYouthMatch.playerGoals;
                  yStats.assists += playerYouthMatch.playerAssists;
                  yStats.averageRating =
                    (yStats.averageRating * (yStats.appearances - 1) + playerYouthMatch.playerRating) /
                    yStats.appearances;
                  yStats.averageRating = Math.round(yStats.averageRating * 10) / 10;
                }
                player.seasonStats = yStats;

                // Update career stats
                const yCareer = { ...player.careerStats };
                if (playerYouthMatch.playerMinutesPlayed > 0) {
                  yCareer.totalAppearances += 1;
                  yCareer.totalGoals += playerYouthMatch.playerGoals;
                  yCareer.totalAssists += playerYouthMatch.playerAssists;
                }
                player.careerStats = yCareer;

                // Update form from youth match
                const yRecentRatings = recentResults.filter(r => r.playerRating > 0).map(r => r.playerRating);
                player.form = updateForm(player, yRecentRatings);

                // Youth match fitness drain (less than senior)
                player.fitness = clamp(player.fitness - Math.round(playerYouthMatch.playerMinutesPlayed / 8), 0, 100);

                // Morale from youth match
                if (playerYouthMatch.playerRating >= 7.5) {
                  player.morale = clamp(player.morale + 2, 0, 100);
                } else if (playerYouthMatch.playerRating < 5.0) {
                  player.morale = clamp(player.morale - 3, 0, 100);
                }

                matchResult = playerYouthMatch; // Set for weekly progression
              } else {
                result = simulateYouthMatch(homeTeam, awayTeam, category, 'youth_league');
              }

              if (!result) {
                result = simulateYouthMatch(homeTeam, awayTeam, category, 'youth_league');
              }

              // Update fixture
              const fixIdx = youthFixtures.findIndex(f => f.id === yf.id);
              if (fixIdx >= 0) {
                youthFixtures[fixIdx] = { ...youthFixtures[fixIdx], played: true, homeScore: result.homeScore, awayScore: result.awayScore };
              }
              // Update league table
              youthLeagueTables = updateYouthLeagueTable(youthLeagueTables, yf.homeClubId, yf.awayClubId, result.homeScore, result.awayScore);
              // Track results for player's club
              if (isPlayerClub) {
                youthMatchResults.push({
                  fixtureId: yf.id,
                  homeClubId: yf.homeClubId,
                  awayClubId: yf.awayClubId,
                  homeScore: result.homeScore,
                  awayScore: result.awayScore,
                  category,
                  competition: 'youth_league',
                  week,
                  season,
                });
              }
            }
          }

          // Youth cup matches on cup weeks
          if (CUP_MATCH_WEEKS.includes(week) && !youthCupEliminated) {
            const youthCupFixsThisRound = youthCupFixtures.filter(
              f => f.matchday === youthCupRound && f.category === category && !f.played
            );
            const playerYouthCupFix = youthCupFixsThisRound.find(
              f => f.homeClubId === currentClub.id || f.awayClubId === currentClub.id
            );
            if (playerYouthCupFix) {
              const homeTeam = getClubById(playerYouthCupFix.homeClubId);
              const awayTeam = getClubById(playerYouthCupFix.awayClubId);
              if (homeTeam && awayTeam) {
                const result = simulateYouthMatch(homeTeam, awayTeam, category, 'youth_cup');
                const fixIdx = youthCupFixtures.findIndex(f => f.id === playerYouthCupFix.id);
                if (fixIdx >= 0) {
                  youthCupFixtures[fixIdx] = { ...youthCupFixtures[fixIdx], played: true, homeScore: result.homeScore, awayScore: result.awayScore };
                }
                // Check elimination
                const isHome = playerYouthCupFix.homeClubId === currentClub.id;
                const playerWon = (isHome && result.homeScore > result.awayScore) || (!isHome && result.awayScore > result.homeScore);
                const isDraw = result.homeScore === result.awayScore;
                if (!playerWon && !isDraw) {
                  youthCupEliminated = true;
                }
              }
            }
            // Mark all other cup fixtures as played
            for (const otherFix of youthCupFixsThisRound) {
              const fixIdx = youthCupFixtures.findIndex(f => f.id === otherFix.id);
              if (fixIdx >= 0 && !youthCupFixtures[fixIdx].played) {
                const ht = getClubById(otherFix.homeClubId);
                const at = getClubById(otherFix.awayClubId);
                if (ht && at) {
                  const r = simulateYouthMatch(ht, at, category, 'youth_cup');
                  youthCupFixtures[fixIdx] = { ...youthCupFixtures[fixIdx], played: true, homeScore: r.homeScore, awayScore: r.awayScore };
                }
              }
            }
          }
        }
        // Advance youth league match week
        youthLeagueMatchWeek += 1;

        // Apply youth player progression weekly
        youthTeams = youthTeams.map(team => ({
          ...team,
          players: team.players.map(yp => {
            const progression = applyYouthWeeklyProgression(yp, currentClub.youthDevelopment);
            return { ...yp, ...progression };
          }),
        }));

        // 3. Apply weekly progression
        const trainingSessions = scheduledTraining ? [scheduledTraining] : [];
        const progressionUpdates = applyWeeklyProgression(player, trainingSessions, seasonTrainingFocus);

        if (trainingSessions.length > 0) {
          trainingHistory = [...trainingHistory, ...trainingSessions];
          trainingAvailable = Math.max(0, trainingAvailable - 1);
        }

        player = applyPlayerUpdates(player, progressionUpdates);

        // 2c. Continental competition match processing (only for senior players)
        if (continentalQualified && continentalCompetition && !continentalEliminated && continentalFixtures.length > 0 && !isAtYouthLevel) {
          const isContinentalGroupWeek = CONTINENTAL_GROUP_MATCH_WEEKS.includes(week);
          const isContinentalKOWeek = CONTINENTAL_KO_MATCH_WEEKS.includes(week);

          if (isContinentalGroupWeek && continentalKnockoutRound === 0) {
            // Group stage matchday
            const groupMatchday = CONTINENTAL_GROUP_MATCH_WEEKS.indexOf(week) + 1;
            const groupFixtures = continentalFixtures.filter(
              f => f.stage === 'group' && f.matchday === groupMatchday && !f.played
            );

            // Check if player's team has a group match
            const playerContinentalFixture = groupFixtures.find(
              f => f.homeClubId === currentClub.id || f.awayClubId === currentClub.id
            );

            if (playerContinentalFixture) {
              const isCHome = playerContinentalFixture.homeClubId === currentClub.id;
              const cOpponentId = isCHome ? playerContinentalFixture.awayClubId : playerContinentalFixture.homeClubId;
              const cOpponent = getClubById(cOpponentId);

              if (cOpponent) {
                const cHome = isCHome ? currentClub : cOpponent;
                const cAway = isCHome ? cOpponent : currentClub;
                const compName = getContinentalName(continentalCompetition);

                const cMatchResult = simulateMatch(cHome, cAway, player, 'continental', isCHome ? 'home' : 'away', currentWeather, weatherPreparation);
                cMatchResult.week = week;
                cMatchResult.season = season;
                cMatchResult.competition = continentalCompetition;

                recentResults.unshift(cMatchResult);
                if (recentResults.length > 10) recentResults = recentResults.slice(0, 10);

                // Mark fixture as played
                const cFixIdx = continentalFixtures.findIndex(f => f.id === playerContinentalFixture.id);
                if (cFixIdx >= 0) {
                  continentalFixtures[cFixIdx] = {
                    ...continentalFixtures[cFixIdx],
                    played: true,
                    homeScore: cMatchResult.homeScore,
                    awayScore: cMatchResult.awayScore,
                  };
                }

                // Update standings
                continentalGroupStandings = updateContinentalStandings(
                  continentalGroupStandings,
                  playerContinentalFixture.homeClubId,
                  playerContinentalFixture.awayClubId,
                  cMatchResult.homeScore,
                  cMatchResult.awayScore
                );

                // Update player stats
                const cStats = { ...player.seasonStats };
                if (cMatchResult.playerMinutesPlayed > 0) {
                  cStats.appearances += 1;
                  if (cMatchResult.playerStarted) cStats.starts += 1;
                  cStats.minutesPlayed += cMatchResult.playerMinutesPlayed;
                  cStats.goals += cMatchResult.playerGoals;
                  cStats.assists += cMatchResult.playerAssists;
                  cStats.averageRating = (cStats.averageRating * (cStats.appearances - 1) + cMatchResult.playerRating) / cStats.appearances;
                  cStats.averageRating = Math.round(cStats.averageRating * 10) / 10;
                }
                player.seasonStats = cStats;

                const cCareer = { ...player.careerStats };
                if (cMatchResult.playerMinutesPlayed > 0) {
                  cCareer.totalAppearances += 1;
                  cCareer.totalGoals += cMatchResult.playerGoals;
                  cCareer.totalAssists += cMatchResult.playerAssists;
                }
                player.careerStats = cCareer;

                // Update form
                const cRecentRatings = recentResults.filter(r => r.playerRating > 0).map(r => r.playerRating);
                player.form = updateForm(player, cRecentRatings);

                // Fitness drain
                if (cMatchResult.playerMinutesPlayed > 0) {
                  const cDrain = Math.round(cMatchResult.playerMinutesPlayed / 6);
                  player.fitness = clamp(player.fitness - cDrain, 0, 100);
                }

                // Morale from continental result
                if (cMatchResult.playerRating >= 7.5) {
                  player.morale = clamp(player.morale + 4, 0, 100);
                } else if (cMatchResult.playerRating < 5.0) {
                  player.morale = clamp(player.morale - 5, 0, 100);
                }

                // Social media
                const cPosts = processMediaReaction(player, cMatchResult, currentClub.id);
                socialFeed = [...cPosts, ...socialFeed].slice(0, 50);

                get().addNotification({
                  type: 'match',
                  title: `${compName.emoji} ${compName.name} Match!`,
                  message: `${cMatchResult.homeClub.shortName} ${cMatchResult.homeScore} - ${cMatchResult.awayScore} ${cMatchResult.awayClub.shortName} | Your rating: ${cMatchResult.playerRating.toFixed(1)}`,
                  actionRequired: false,
                });
              }
            }

            // Simulate other group matches
            const otherGroupFixtures = groupFixtures.filter(
              f => f.id !== playerContinentalFixture?.id && !f.played
            );
            for (const oFix of otherGroupFixtures) {
              const oHome = getClubById(oFix.homeClubId);
              const oAway = getClubById(oFix.awayClubId);
              if (oHome && oAway) {
                const oResult = simulateContinentalMatch(oHome, oAway);
                const oFixIdx = continentalFixtures.findIndex(f => f.id === oFix.id);
                if (oFixIdx >= 0) {
                  continentalFixtures[oFixIdx] = {
                    ...continentalFixtures[oFixIdx],
                    played: true,
                    homeScore: oResult.homeScore,
                    awayScore: oResult.awayScore,
                  };
                }
                continentalGroupStandings = updateContinentalStandings(
                  continentalGroupStandings,
                  oFix.homeClubId,
                  oFix.awayClubId,
                  oResult.homeScore,
                  oResult.awayScore
                );
              }
            }

            // Check if group stage is complete
            const unplayedGroup = continentalFixtures.filter(f => f.stage === 'group' && !f.played);
            if (unplayedGroup.length === 0) {
              // Generate knockout fixtures
              const qualified = getQualifiedFromGroups(continentalGroupStandings, continentalCompetition);
              if (qualified.length >= 16) {
                const koFixtures = generateKnockoutFixtures(qualified, continentalCompetition, 'round_of_16', season);
                continentalFixtures = [...continentalFixtures, ...koFixtures];
                continentalKnockoutRound = 1;

                // Check if player qualified
                if (!qualified.includes(currentClub.id)) {
                  continentalEliminated = true;
                  get().addNotification({
                    type: 'match',
                    title: `${getContinentalName(continentalCompetition).emoji} Eliminated!`,
                    message: `You failed to advance from the group stage of the ${getContinentalName(continentalCompetition).name}.`,
                    actionRequired: false,
                  });
                } else {
                  get().addNotification({
                    type: 'match',
                    title: `${getContinentalName(continentalCompetition).emoji} Knockout Stage!`,
                    message: `You've advanced to the Round of 16 in the ${getContinentalName(continentalCompetition).name}!`,
                    actionRequired: false,
                  });
                }
              }
            }
          } else if (isContinentalKOWeek && continentalKnockoutRound > 0) {
            // Knockout stage match
            const koStage = continentalKnockoutRound === 1 ? 'round_of_16' :
              continentalKnockoutRound === 2 ? 'quarter_final' :
              continentalKnockoutRound === 3 ? 'semi_final' : 'final';

            const koFixtures = continentalFixtures.filter(
              f => f.stage === koStage && !f.played
            );

            const playerKOFixture = koFixtures.find(
              f => f.homeClubId === currentClub.id || f.awayClubId === currentClub.id
            );

            if (playerKOFixture) {
              const isKHome = playerKOFixture.homeClubId === currentClub.id;
              const koOpponentId = isKHome ? playerKOFixture.awayClubId : playerKOFixture.homeClubId;
              const koOpponent = getClubById(koOpponentId);

              if (koOpponent) {
                const koHome = isKHome ? currentClub : koOpponent;
                const koAway = isKHome ? koOpponent : currentClub;
                const compName = getContinentalName(continentalCompetition);

                const koResult = simulateMatch(koHome, koAway, player, 'continental', isKHome ? 'home' : 'away', currentWeather, weatherPreparation);
                koResult.week = week;
                koResult.season = season;
                koResult.competition = continentalCompetition;

                recentResults.unshift(koResult);
                if (recentResults.length > 10) recentResults = recentResults.slice(0, 10);

                // Mark fixture
                const koFixIdx = continentalFixtures.findIndex(f => f.id === playerKOFixture.id);
                if (koFixIdx >= 0) {
                  continentalFixtures[koFixIdx] = {
                    ...continentalFixtures[koFixIdx],
                    played: true,
                    homeScore: koResult.homeScore,
                    awayScore: koResult.awayScore,
                  };
                }

                // Update player stats
                const koStats = { ...player.seasonStats };
                if (koResult.playerMinutesPlayed > 0) {
                  koStats.appearances += 1;
                  if (koResult.playerStarted) koStats.starts += 1;
                  koStats.minutesPlayed += koResult.playerMinutesPlayed;
                  koStats.goals += koResult.playerGoals;
                  koStats.assists += koResult.playerAssists;
                  koStats.averageRating = (koStats.averageRating * (koStats.appearances - 1) + koResult.playerRating) / koStats.appearances;
                  koStats.averageRating = Math.round(koStats.averageRating * 10) / 10;
                }
                player.seasonStats = koStats;

                const koCareer = { ...player.careerStats };
                if (koResult.playerMinutesPlayed > 0) {
                  koCareer.totalAppearances += 1;
                  koCareer.totalGoals += koResult.playerGoals;
                  koCareer.totalAssists += koResult.playerAssists;
                }
                player.careerStats = koCareer;

                // Form + fitness + morale
                const koRecentRatings = recentResults.filter(r => r.playerRating > 0).map(r => r.playerRating);
                player.form = updateForm(player, koRecentRatings);
                if (koResult.playerMinutesPlayed > 0) {
                  player.fitness = clamp(player.fitness - Math.round(koResult.playerMinutesPlayed / 6), 0, 100);
                }
                if (koResult.playerRating >= 7.5) player.morale = clamp(player.morale + 4, 0, 100);
                else if (koResult.playerRating < 5.0) player.morale = clamp(player.morale - 5, 0, 100);

                const koPosts = processMediaReaction(player, koResult, currentClub.id);
                socialFeed = [...koPosts, ...socialFeed].slice(0, 50);

                // Check result
                const playerWonKO = (isKHome && koResult.homeScore > koResult.awayScore) ||
                  (!isKHome && koResult.awayScore > koResult.homeScore);

                if (!playerWonKO) {
                  continentalEliminated = true;
                  get().addNotification({
                    type: 'match',
                    title: `${compName.emoji} Knocked Out!`,
                    message: `Eliminated from the ${compName.name} at the ${getStageName(koStage)}.`,
                    actionRequired: false,
                  });
                } else if (koStage === 'final') {
                  // Won the continental competition!
                  player.careerStats.trophies = [
                    ...player.careerStats.trophies,
                    { name: compName.name, season }
                  ];
                  player.morale = clamp(player.morale + 20, 0, 100);
                  player.reputation = clamp(player.reputation + 10, 0, 100);
                  continentalEliminated = true;

                  get().addNotification({
                    type: 'match',
                    title: `${compName.emoji} CHAMPIONS! 🏆`,
                    message: `You've won the ${compName.name}! A historic achievement!`,
                    actionRequired: false,
                  });
                } else {
                  get().addNotification({
                    type: 'match',
                    title: `${compName.emoji} Advance!`,
                    message: `Through to the next round of the ${compName.name}!`,
                    actionRequired: false,
                  });
                }
              }
            }

            // Simulate other KO matches
            const otherKOFixtures = koFixtures.filter(f => f.id !== playerKOFixture?.id && !f.played);
            const koWinners: string[] = [];
            for (const oKO of otherKOFixtures) {
              const oHome = getClubById(oKO.homeClubId);
              const oAway = getClubById(oKO.awayClubId);
              if (oHome && oAway) {
                const oResult = simulateContinentalMatch(oHome, oAway);
                const oIdx = continentalFixtures.findIndex(f => f.id === oKO.id);
                if (oIdx >= 0) {
                  continentalFixtures[oIdx] = {
                    ...continentalFixtures[oIdx],
                    played: true,
                    homeScore: oResult.homeScore,
                    awayScore: oResult.awayScore,
                  };
                }
                koWinners.push(oResult.homeScore >= oResult.awayScore ? oKO.homeClubId : oKO.awayClubId);
              }
            }

            // Check if all KO matches played → generate next round
            const unplayedKO = continentalFixtures.filter(f => f.stage === koStage && !f.played);
            if (unplayedKO.length === 0 && koWinners.length > 0) {
              // Add player's winner if they won
              if (playerKOFixture && !continentalEliminated) {
                koWinners.push(currentClub.id);
              }

              continentalKnockoutRound += 1;

              const nextStage = continentalKnockoutRound === 2 ? 'quarter_final' :
                continentalKnockoutRound === 3 ? 'semi_final' :
                continentalKnockoutRound === 4 ? 'final' : null;

              if (nextStage && koWinners.length >= 2) {
                const nextFixtures = generateKnockoutFixtures(koWinners, continentalCompetition, nextStage, season);
                continentalFixtures = [...continentalFixtures, ...nextFixtures];
              }
            }
          }
        }

        // 3b. International Duty processing
        internationalOnBreak = isInternationalBreakWeek(week, currentClub.league);
        if (internationalOnBreak) {
          // Check if player gets called up
          const callUp = shouldCallUp(player, season, week);

          if (callUp) {
            internationalCalledUp = true;

            // Find or generate a fixture for this break
            let existingFixture = internationalFixtures.find(
              f => f.week === week && f.season === season && !f.played
            );

            if (!existingFixture) {
              // Generate fixtures for this break
              const newFixtures = generateSeasonInternationalFixtures(
                player.nationality, season, currentClub.league
              );
              // Filter to just the current break week's fixtures
              const thisWeekFixtures = newFixtures.filter(f => Math.abs(f.week - week) <= 2);
              if (thisWeekFixtures.length > 0) {
                existingFixture = thisWeekFixtures[0];
                // Add all new fixtures if not already present
                for (const nf of newFixtures) {
                  if (!internationalFixtures.find(ef => ef.id === nf.id)) {
                    internationalFixtures.push(nf);
                  }
                }
              }
            }

            if (existingFixture) {
              // Process the international match
              existingFixture.playerCalledUp = true;
              const processedFixture = processInternationalMatch(existingFixture, player);

              // Update fixture in list
              const fixIdx = internationalFixtures.findIndex(f => f.id === existingFixture!.id);
              if (fixIdx >= 0) {
                internationalFixtures[fixIdx] = processedFixture;
              }

              // Update international career stats
              internationalCareer = updateInternationalCareer(internationalCareer, processedFixture);

              // Apply effects to player
              // Fatigue
              const fatigueCost = getInternationalFatigueCost(processedFixture);
              player.fitness = clamp(player.fitness - fatigueCost, 0, 100);

              // Morale
              const moraleChange = getInternationalMoraleChange(processedFixture);
              player.morale = clamp(player.morale + moraleChange, 0, 100);

              // Reputation boost
              const repBoost = getCallUpReputationBoost(processedFixture);
              player.reputation = clamp(player.reputation + repBoost, 0, 100);

              // Notification
              const matchTypeLabel = getMatchTypeLabel(processedFixture.matchType);
              const playerNation = player.nationality;
              const opponentNation = processedFixture.homeNation === playerNation
                ? processedFixture.awayNation
                : processedFixture.homeNation;

              get().addNotification({
                type: 'match',
                title: `🌐 International Duty!`,
                message: `Called up by ${playerNation}! ${processedFixture.homeFlag} ${processedFixture.homeNation} ${processedFixture.homeScore}-${processedFixture.awayScore} ${processedFixture.awayNation} ${processedFixture.awayFlag} (${matchTypeLabel}). Rating: ${processedFixture.playerRating?.toFixed(1) ?? 'N/A'}`,
                actionRequired: false,
              });
            }
          } else {
            internationalCalledUp = false;
          }
        } else {
          internationalCalledUp = false;
        }

        // 4. Check for random events
        const newEvent = generateRandomEvent(player, currentClub, season, week);
        if (newEvent) {
          activeEvents = [...activeEvents, newEvent];
          get().addNotification({
            type: 'event',
            title: newEvent.title,
            message: newEvent.description.substring(0, 100) + '...',
            actionRequired: true,
          });
        }

        // 5. Transfer/loan offers if in transfer window
        const window = isTransferWindow(week);
        if (window) {
          // Only generate offers occasionally to avoid spam
          if (Math.random() < 0.15) {
            const newOffers = generateTransferOffers(player, currentClub, state.availableClubs, season);
            for (const offer of newOffers) {
              offer.week = week;
            }
            transferOffers = [...transferOffers, ...newOffers];

            if (newOffers.length > 0) {
              get().addNotification({
                type: 'transfer',
                title: 'Transfer Offer!',
                message: `You've received ${newOffers.length} transfer offer(s).`,
                actionRequired: true,
              });
            }
          }

          if (Math.random() < 0.1) {
            const newLoans = generateLoanOffers(player, currentClub, state.availableClubs);
            for (const loan of newLoans) {
              loan.season = season;
              loan.week = week;
            }
            loanOffers = [...loanOffers, ...newLoans];
          }
        }

        // 6. Process social media posts
        const randomPost = Math.random() < 0.3;
        if (randomPost) {
          const eventType = ['goal', 'assist', 'transfer_rumor', 'injury', 'contract'][Math.floor(Math.random() * 5)];
          const post = {
            ...generateSocialPost(
              player,
              eventType,
              `Week ${week} of Season ${season}`
            ),
            week,
            season,
          };
          socialFeed = [post, ...socialFeed].slice(0, 50);
        }

        // 7. Update storylines
        const newStoryline = generateNewStoryline(player, currentClub);
        if (newStoryline) {
          newStoryline.startWeek = week;
          newStoryline.startSeason = season;
          storylines = [...storylines, newStoryline];
        }
        storylines = updateStorylines(storylines, player, week);

        // 8. Injury recovery
        if (player.injuryWeeks > 0) {
          player.injuryWeeks = Math.max(0, player.injuryWeeks - 1);
          if (player.injuryWeeks === 0) {
            get().addNotification({
              type: 'match',
              title: 'Injury Recovery',
              message: 'You\'ve recovered from your injury and are available for selection!',
              actionRequired: false,
            });
          }
        }

        // 9. Update league table (sort)
        leagueTable = sortLeagueTable(leagueTable);

        // 9b. Update season objectives progress
        let seasonObjectives = [...(state.seasonObjectives ?? [])];
        let currentObjSet = seasonObjectives.find(o => o.season === season);
        if (!currentObjSet) {
          // Auto-generate objectives for existing saves that don't have them
          const newObjSet = generateSeasonObjectives(
            currentClub, player, season, getSeasonMatchdays(currentClub.league)
          );
          seasonObjectives = [...seasonObjectives, newObjSet];
          currentObjSet = newObjSet;
        }
        {
          const totalMatchdays = getSeasonMatchdays(currentClub.league);
          const updatedObjSet = updateObjectivesProgress(
            currentObjSet, player, leagueTable, currentClub.id, week, totalMatchdays
          );
          seasonObjectives = seasonObjectives.map(o => o.season === season ? updatedObjSet : o);
        }

        // 10. Check for season end
        const seasonMatchdays = getSeasonMatchdays(currentClub.league);
        if (week >= seasonMatchdays) {
          // Advance season
          const seasonProgression = applySeasonProgression(player, player.seasonStats);
          player = applyPlayerUpdates(player, seasonProgression);

          // Age up
          player.age += 1;

          // Retirement check at season end (only for senior players age 33+)
          if (playerTeamLevel === 'senior' && player.age >= 33 && !state.retirementRiskPushed) {
            const careerThreatening = injuries.some(i => i.type === 'career_threatening');
            const retirementProb = calculateRetirementProbability(
              player.age,
              player.fitness,
              player.injuryHistory.length,
              careerThreatening,
              player.morale
            );
            // Deterministic roll based on age + season (same save = same result)
            const roll = ((player.age * 7 + state.currentSeason * 13 + player.injuryHistory.length * 3) % 100);
            if (roll < retirementProb) {
              state.retirementPending = true;
              get().addNotification({
                type: 'career',
                title: 'Retirement Looming',
                message: `Your body can't keep up anymore. The time has come to consider hanging up your boots.`,
                actionRequired: true,
              });
              get().setScreen('career_retirement');
            }
          }

          // Check for youth team promotion
          if (playerTeamLevel === 'u18' && (player.age >= 18 || player.overall >= 60)) {
            playerTeamLevel = 'u21';
            get().addNotification({
              type: 'career',
              title: 'Promoted to U21! ⬆️',
              message: `You've been promoted from the U18 to the U21 team! Keep developing!`,
              actionRequired: false,
            });
          } else if (playerTeamLevel === 'u21' && (player.age >= 19 || player.overall >= 68)) {
            playerTeamLevel = 'senior';
            player.squadStatus = 'prospect';
            get().addNotification({
              type: 'career',
              title: 'Promoted to Senior Team! 🎉',
              message: `You've been promoted to the senior squad! Your hard work in the academy paid off!`,
              actionRequired: false,
            });
          } else if (playerTeamLevel === 'u21' && player.age >= 21) {
            // Auto-promote at 21
            playerTeamLevel = 'senior';
            player.squadStatus = determineSquadStatusUpdate(player, currentClub);
            get().addNotification({
              type: 'career',
              title: 'Promoted to Senior Team! 🎉',
              message: `You've graduated from the U21 team to the senior squad!`,
              actionRequired: false,
            });
          }

          // Update squad status (for senior players)
          if (playerTeamLevel === 'senior') {
            player.squadStatus = determineSquadStatusUpdate(player, currentClub);
          }

          // Reset season training focus for new season (player must set again)
          seasonTrainingFocus = null;

          // Save season summary
          const seasonSummary = {
            number: state.currentSeason,
            year: state.year,
            leaguePosition: leagueTable.findIndex((e) => e.clubId === currentClub.id) + 1,
            playerStats: { ...player.seasonStats },
            achievements: state.achievements.filter((a) => a.unlocked && a.unlockedSeason === season).map((a) => a.id),
          };

          // Reset for new season
          state.currentSeason += 1;
          state.currentWeek = 0;
          state.year += 1;
          state.seasons = [...state.seasons, seasonSummary];

          // Reset player season stats
          player.seasonStats = {
            appearances: 0,
            starts: 0,
            minutesPlayed: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellowCards: 0,
            redCards: 0,
            averageRating: 0,
            manOfTheMatch: 0,
            injuries: 0,
          };
          player.careerStats.seasonsPlayed += 1;

          // Contract year decrease
          if (player.contract.yearsRemaining > 0) {
            player.contract = {
              ...player.contract,
              yearsRemaining: player.contract.yearsRemaining - 1,
            };
          }

          // Regenerate fixtures and league table
          upcomingFixtures = generateFixtures(currentClub.league, state.currentSeason);
          leagueTable = generateLeagueTable(currentClub.league, currentClub.id);
          trainingAvailable = 3;

          // Regenerate cup fixtures for new season
          cupFixtures = generateCupFixtures(currentClub.league, state.currentSeason);
          cupRound = 1;
          cupEliminated = false;

          // Check continental qualification based on league position
          const newLeaguePosition = leagueTable.findIndex((e) => e.clubId === currentClub.id) + 1;
          const continentalQual = determineContinentalQualification(newLeaguePosition, leagueTable);
          continentalQualified = continentalQual.qualified;
          continentalCompetition = continentalQual.competition;
          continentalEliminated = false;
          continentalKnockoutRound = 0;

          if (continentalQualified && continentalCompetition) {
            const compName = getContinentalName(continentalCompetition);
            // Select all clubs and generate group fixtures
            const { championsLeague, europaLeague } = selectContinentalClubs();
            const clubs = continentalCompetition === 'champions_league' ? championsLeague : europaLeague;
            // Ensure player's club is included
            if (!clubs.find(c => c.id === currentClub.id)) {
              clubs.push(currentClub);
            }
            const { fixtures: cFixtures, standings: cStandings } = generateContinentalGroupFixtures(
              clubs, continentalCompetition, state.currentSeason
            );
            continentalFixtures = cFixtures;
            continentalGroupStandings = cStandings;

            get().addNotification({
              type: 'career',
              title: `${compName.emoji} Qualified!`,
              message: `You've qualified for the ${compName.name}! European nights await!`,
              actionRequired: false,
            });
          } else {
            continentalFixtures = [];
            continentalGroupStandings = [];
          }

          // Reset international duty for new season
          internationalCalledUp = false;
          internationalOnBreak = false;

          // Generate new season objectives
          seasonObjectives = [...seasonObjectives, generateSeasonObjectives(
            currentClub, player, state.currentSeason, getSeasonMatchdays(currentClub.league)
          )];

          // Generate season awards for completed season
          seasonAwards = [...seasonAwards, ...generateSeasonAwards(
            season, player, currentClub, leagueTable, ENRICHED_CLUBS
          )];

          // Pay objective bonus
          const completedObjSet = seasonObjectives.find(o => o.season === season);
          if (completedObjSet && !completedObjSet.bonusPaid) {
            const bonus = calculateObjectiveBonus(completedObjSet);
            if (bonus > 0) {
              player.contract = {
                ...player.contract,
                signingBonus: (player.contract.signingBonus ?? 0) + bonus,
              };
              get().addNotification({
                type: 'contract',
                title: 'Objective Bonus! 🎉',
                message: `You earned €${(bonus / 1000).toFixed(0)}K in performance bonuses for completing season objectives!`,
                actionRequired: false,
              });
            }
            seasonObjectives = seasonObjectives.map(o =>
              o.season === season ? { ...o, bonusPaid: true } : o
            );
          }

          // Clear expired transfer/loan offers
          transferOffers = [];
          loanOffers = [];

          get().addNotification({
            type: 'career',
            title: 'Season Complete!',
            message: `Season ${season} is over. You finished ${seasonSummary.leaguePosition} in the league.`,
            actionRequired: false,
          });
        }

        // Update market value periodically
        if (week % 4 === 0) {
          player.marketValue = calculateMarketValue(
            player.overall,
            player.age,
            player.potential,
            player.reputation
          );
        }

        // Fitness drain from matches
        if (matchResult && matchResult.playerMinutesPlayed > 0) {
          const drain = Math.round(matchResult.playerMinutesPlayed / 6);
          player.fitness = clamp(player.fitness - drain, 0, 100);
        }

        // Morale from match result
        if (matchResult) {
          if (matchResult.playerRating >= 7.5) {
            player.morale = clamp(player.morale + 3, 0, 100);
          } else if (matchResult.playerRating < 5.0) {
            player.morale = clamp(player.morale - 5, 0, 100);
          }
        }

        // Training availability refresh every 4 weeks
        if (week % 4 === 0) {
          trainingAvailable = 3;
        }

        // Update overall
        player.overall = calculateOverall(player.attributes, player.position);

        // Update relationships after match
        if (matchResult) {
          relationships = updateRelationshipsAfterMatch(relationships, player, matchResult, currentClub.id);
        }

        // Weekly relationship drift
        const relUpdate = updateRelationshipsWeekly(relationships, player, teamDynamics);
        relationships = relUpdate.relationships;
        teamDynamics = relUpdate.teamDynamics;

        // Commit state
        set({
          gameState: {
            ...state,
            player,
            currentClub,
            leagueTable,
            recentResults,
            upcomingFixtures,
            activeEvents,
            resolvedEvents,
            transferOffers,
            loanOffers,
            socialFeed,
            storylines,
            trainingHistory,
            trainingAvailable,
            seasonObjectives,
            seasonAwards,
            cupFixtures,
            cupRound,
            cupEliminated,
            youthTeams,
            youthLeagueTables,
            youthFixtures,
            youthCupFixtures,
            youthCupRound,
            youthCupEliminated,
            youthMatchResults,
            youthLeagueMatchWeek,
            relationships,
            teamDynamics,
            continentalFixtures,
            continentalGroupStandings,
            continentalQualified,
            continentalCompetition,
            continentalKnockoutRound,
            continentalEliminated,
            internationalFixtures,
            internationalCareer,
            internationalCalledUp,
            internationalOnBreak,
            playerTeamLevel,
            seasonTrainingFocus,
            injuries,
            currentInjury,
            retirementPending: state.retirementPending,
            retirementRiskPushed: state.retirementRiskPushed,
            lastSaved: new Date().toISOString(),
          },
          scheduledTraining: null,
          isProcessing: false,
        });
      },

      advanceMonth: () => {
        const { isProcessing } = get();
        if (isProcessing) return;

        // Advance 4 weeks
        for (let i = 0; i < 4; i++) {
          get().advanceWeek();
        }
      },

      simulateSeason: () => {
        const { gameState, isProcessing } = get();
        if (!gameState || isProcessing) return;

        // Simulate remaining weeks in the season
        const seasonMatchdays = getSeasonMatchdays(gameState.currentClub.league);
        const remainingWeeks = seasonMatchdays - gameState.currentWeek;
        const weeksToSim = Math.min(remainingWeeks, seasonMatchdays);

        set({ isProcessing: true });

        // We advance week by week, but skip animations
        for (let i = 0; i < weeksToSim; i++) {
          get().advanceWeek();
        }

        set({ isProcessing: false });
      },

      playNextMatch: () => {
        const { gameState, isProcessing } = get();
        if (!gameState || isProcessing) return;

        const result = get().simulateMatchInternal();
        if (result) {
          set({
            matchAnimation: {
              isPlaying: true,
              events: result.events,
              currentMinute: 0,
            },
          });

          // Simulate the rest of the week
          get().advanceWeek();
        } else {
          // No match this week, just advance
          get().advanceWeek();
        }
      },

      // ---- Match ----

      simulateMatchInternal: () => {
        const { gameState } = get();
        if (!gameState) return null;

        const fixture = findFixtureForWeek(
          gameState.upcomingFixtures,
          gameState.currentClub.id,
          gameState.currentWeek
        );

        if (!fixture) return null;

        const isHome = fixture.homeClubId === gameState.currentClub.id;
        const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId;
        const opponent = getClubById(opponentId);

        if (!opponent) return null;

        const homeClub = isHome ? gameState.currentClub : opponent;
        const awayClub = isHome ? opponent : gameState.currentClub;

        return simulateMatch(homeClub, awayClub, gameState.player, 'league', isHome ? 'home' : 'away', gameState.currentWeather, gameState.weatherPreparation);
      },

      // ---- Training ----

      scheduleTraining: (session) => {
        const { gameState } = get();
        if (!gameState) return;

        if (gameState.trainingAvailable <= 0) {
          get().addNotification({
            type: 'training',
            title: 'No Training Available',
            message: 'You\'ve used all your training sessions for this period.',
            actionRequired: false,
          });
          return;
        }

        set({ scheduledTraining: session });
      },

      completeTraining: () => {
        // Training is completed as part of advanceWeek
        set({ scheduledTraining: null });
      },

      // ---- Events ----

      resolveEvent: (eventId, choiceId) => {
        const { gameState } = get();
        if (!gameState) return;

        const eventIndex = gameState.activeEvents.findIndex((e) => e.id === eventId);
        if (eventIndex < 0) return;

        const event = gameState.activeEvents[eventIndex];
        const { updatedPlayer, narrative } = resolveEventChoice(event, choiceId, gameState.player);

        // Move event to resolved
        const activeEvents = gameState.activeEvents.filter((e) => e.id !== eventId);
        const resolvedEvents = [...gameState.resolvedEvents, event];

        // Apply updates to player
        const player = applyPlayerUpdates(gameState.player, updatedPlayer);

        // Recalculate overall if attributes changed
        if (updatedPlayer.attributes) {
          player.overall = calculateOverall(player.attributes, player.position);
        }

        set({
          gameState: {
            ...gameState,
            player,
            activeEvents,
            resolvedEvents,
          },
        });

        get().addNotification({
          type: 'event',
          title: 'Event Resolved',
          message: narrative,
          actionRequired: false,
        });
      },

      // ---- Transfers ----

      acceptTransfer: (offerId) => {
        const { gameState } = get();
        if (!gameState) return;

        const offer = gameState.transferOffers.find((o) => o.id === offerId);
        if (!offer) return;

        const { updatedPlayer, newContract } = executeTransfer(
          gameState.player,
          gameState.currentClub,
          offer.fromClub,
          offer.fee
        );

        const player = applyPlayerUpdates(gameState.player, {
          ...updatedPlayer,
          contract: newContract,
        });

        // Recalculate overall if attributes changed
        if (updatedPlayer.attributes) {
          player.overall = calculateOverall(player.attributes, player.position);
        }

        // Clear transfer and loan offers
        const transferOffers = gameState.transferOffers.filter((o) => o.id !== offerId);
        const loanOffers: LoanOffer[] = [];

        // Generate new league table and fixtures for the new club
        const newClub = offer.fromClub;
        const leagueTable = generateLeagueTable(newClub.league, newClub.id);
        const upcomingFixtures = generateFixtures(newClub.league, gameState.currentSeason);
        const newCupFixtures = generateCupFixtures(newClub.league, gameState.currentSeason);

        // Update relationships on transfer
        const newRelationships = generateNewRelationshipsOnTransfer(
          gameState.relationships ?? [],
          newClub,
          player
        );

        set({
          gameState: {
            ...gameState,
            player,
            currentClub: newClub,
            transferOffers,
            loanOffers,
            leagueTable,
            upcomingFixtures,
            cupFixtures: newCupFixtures,
            cupRound: 1,
            cupEliminated: false,
            relationships: newRelationships,
            teamDynamics: calculateTeamDynamics(newRelationships, player, newClub),
          },
        });

        get().addNotification({
          type: 'transfer',
          title: 'Transfer Complete!',
          message: `You've joined ${newClub.name} for €${offer.fee.toLocaleString()}!`,
          actionRequired: false,
        });
      },

      rejectTransfer: (offerId) => {
        const { gameState } = get();
        if (!gameState) return;

        const transferOffers = gameState.transferOffers.filter((o) => o.id !== offerId);
        set({
          gameState: { ...gameState, transferOffers },
        });

        get().addNotification({
          type: 'transfer',
          title: 'Transfer Rejected',
          message: 'You\'ve rejected the transfer offer.',
          actionRequired: false,
        });
      },

      acceptLoan: (offerId) => {
        const { gameState } = get();
        if (!gameState) return;

        const offer = gameState.loanOffers.find((o) => o.id === offerId);
        if (!offer) return;

        const { updatedPlayer } = executeLoan(gameState.player, gameState.currentClub, offer.fromClub);

        const player = applyPlayerUpdates(gameState.player, updatedPlayer);

        const loanOffers = gameState.loanOffers.filter((o) => o.id !== offerId);
        const transferOffers: TransferOffer[] = [];

        // Move to the loan club's league temporarily
        const loanClub = offer.fromClub;
        const leagueTable = generateLeagueTable(loanClub.league, loanClub.id);
        const upcomingFixtures = generateFixtures(loanClub.league, gameState.currentSeason);
        const loanCupFixtures = generateCupFixtures(loanClub.league, gameState.currentSeason);

        set({
          gameState: {
            ...gameState,
            player,
            currentClub: loanClub,
            loanOffers,
            transferOffers,
            leagueTable,
            upcomingFixtures,
            cupFixtures: loanCupFixtures,
            cupRound: 1,
            cupEliminated: false,
          },
        });

        get().addNotification({
          type: 'transfer',
          title: 'Loan Move Complete!',
          message: `You've joined ${loanClub.name} on loan for ${offer.durationWeeks} weeks.`,
          actionRequired: false,
        });
      },

      rejectLoan: (offerId) => {
        const { gameState } = get();
        if (!gameState) return;

        const loanOffers = gameState.loanOffers.filter((o) => o.id !== offerId);
        set({
          gameState: { ...gameState, loanOffers },
        });

        get().addNotification({
          type: 'transfer',
          title: 'Loan Rejected',
          message: 'You\'ve rejected the loan offer.',
          actionRequired: false,
        });
      },

      // ---- Contract Negotiation ----

      negotiateContract: (offer) => {
        const { gameState } = get();
        if (!gameState) return;

        const player = { ...gameState.player };

        // Update contract fields
        player.contract = {
          ...player.contract,
          weeklyWage: offer.weeklyWage,
          yearsRemaining: offer.yearsRemaining,
          signingBonus: offer.signingBonus,
          performanceBonuses: offer.performanceBonuses ?? player.contract.performanceBonuses,
          releaseClause: offer.releaseClause ?? player.contract.releaseClause,
        };

        // Update market value based on new contract (better contract = higher market value)
        const wageBoost = Math.max(0, (offer.weeklyWage - gameState.player.contract.weeklyWage) / gameState.player.contract.weeklyWage);
        const newValue = calculateMarketValue(
          player.overall,
          player.age,
          player.potential,
          Math.min(100, player.reputation + Math.round(wageBoost * 5))
        );
        player.marketValue = newValue;

        // Small morale boost from successful contract negotiation
        player.morale = clamp(player.morale + 5, 0, 100);

        set({
          gameState: {
            ...gameState,
            player,
            lastSaved: new Date().toISOString(),
          },
        });

        get().addNotification({
          type: 'contract',
          title: 'Contract Signed!',
          message: `New contract: ${offer.yearsRemaining} year(s) at ${formatCurrency(offer.weeklyWage, 'K')} with ${formatCurrency(offer.signingBonus, 'K')} signing bonus.`,
          actionRequired: false,
        });
      },

      // ---- Navigation ----

      setScreen: (screen) => {
        set({ screen });
      },

      addNotification: (input) => {
        const notification = createNotification(input);
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // ---- Youth Academy ----

      promoteYouthPlayer: (playerId, target) => {
        const { gameState } = get();
        if (!gameState) return;

        const youthTeams = [...gameState.youthTeams];
        const playerTeam = youthTeams.find(t => t.players.some(p => p.id === playerId));
        if (!playerTeam) return;

        const playerIdx = playerTeam.players.findIndex(p => p.id === playerId);
        if (playerIdx < 0) return;
        const youthPlayer = playerTeam.players[playerIdx];

        if (target === 'u21') {
          // Promote from U18 to U21
          const promoted = promoteYouthPlayerToU21(youthPlayer);
          // Remove from U18 team
          playerTeam.players = playerTeam.players.filter(p => p.id !== playerId);
          // Add to U21 team
          const u21Team = youthTeams.find(t => t.clubId === playerTeam.clubId && t.category === 'u21');
          if (u21Team) {
            u21Team.players = [...u21Team.players, promoted];
          }

          get().addNotification({
            type: 'career',
            title: 'Youth Promotion! ⬆️',
            message: `${youthPlayer.name} has been promoted from U18 to U21!`,
            actionRequired: false,
          });
        } else if (target === 'first_team') {
          // Promote from youth to first team (remove from youth)
          const promotedData = promoteYouthPlayerToFirstTeam(youthPlayer);
          playerTeam.players = playerTeam.players.filter(p => p.id !== playerId);

          // Create a full first-team Player from the youth player data
          const newPlayer: Player = {
            id: generateId(),
            name: promotedData.name,
            age: promotedData.age,
            nationality: promotedData.nationality,
            position: promotedData.position,
            secondaryPositions: [],
            attributes: promotedData.attributes,
            overall: promotedData.overall,
            potential: promotedData.potential,
            fitness: 80,
            morale: 70,
            form: 6.0,
            reputation: 10,
            marketValue: calculateMarketValue(promotedData.overall, promotedData.age, promotedData.potential, 5),
            squadStatus: 'prospect' as SquadStatus,
            contract: {
              weeklyWage: calculateWage(promotedData.overall, gameState.currentClub.tier, 2),
              yearsRemaining: 3,
              signingBonus: 0,
              performanceBonuses: {},
            },
            injuryWeeks: 0,
            injuryHistory: [],
            seasonStats: {
              appearances: 0, starts: 0, minutesPlayed: 0, goals: 0, assists: 0,
              cleanSheets: 0, yellowCards: 0, redCards: 0, averageRating: 0, manOfTheMatch: 0, injuries: 0,
            },
            careerStats: {
              totalAppearances: 0, totalGoals: 0, totalAssists: 0, totalCleanSheets: 0, trophies: [], seasonsPlayed: 0,
            },
            traits: promotedData.traits.length > 0 ? promotedData.traits : ['quick_learner' as const],
            agentQuality: randomBetween(15, 35),
            preferredFoot: promotedData.preferredFoot,
          };

          // Store notification only (don't add to active roster as the player is the user)
          get().addNotification({
            type: 'career',
            title: 'Youth → First Team! 🌟',
            message: `${youthPlayer.name} (OVR ${promotedData.overall}) has been promoted to the first team!`,
            actionRequired: false,
          });

          void newPlayer; // suppress unused warning - stored in game history
        }

        set({
          gameState: { ...gameState, youthTeams },
        });
      },

      setYouthTrainingFocus: (playerId, focus) => {
        const { gameState } = get();
        if (!gameState) return;

        const youthTeams = gameState.youthTeams.map(team => ({
          ...team,
          players: team.players.map(p =>
            p.id === playerId ? { ...p, trainingFocus: focus } : p
          ),
        }));

        set({
          gameState: { ...gameState, youthTeams },
        });
      },

      generateNewYouthIntake: () => {
        const { gameState } = get();
        if (!gameState) return;

        const club = gameState.currentClub;
        const newPlayers = generateYouthIntake(club.id, gameState.currentSeason, club.youthDevelopment);

        const youthTeams = [...gameState.youthTeams];
        const u18Team = youthTeams.find(t => t.clubId === club.id && t.category === 'u18');
        if (u18Team) {
          u18Team.players = [...u18Team.players, ...newPlayers];
        }

        get().addNotification({
          type: 'career',
          title: 'New Youth Intake! 🎦',
          message: `${newPlayers.length} new players have joined the U18 academy!`,
          actionRequired: false,
        });

        set({
          gameState: { ...gameState, youthTeams },
        });
      },

      // ---- Relationships ----

      promoteRelationshipLevel: (relationshipId: string) => {
        const { gameState } = get();
        if (!gameState) return;

        const relationships = [...(gameState.relationships ?? [])];
        const relIdx = relationships.findIndex((r) => r.id === relationshipId);
        if (relIdx < 0) return;

        const rel = { ...relationships[relIdx], history: [...relationships[relIdx].history] };
        // Boost affinity by 5 (manual interaction)
        rel.affinity = clamp(rel.affinity + 5, 0, 100);
        rel.level = getRelationshipLevel(rel.affinity);
        rel.history.push('You spent time together');
        if (rel.history.length > 10) rel.history = rel.history.slice(-10);
        relationships[relIdx] = rel;

        // Recalculate team dynamics
        const teamDynamics = calculateTeamDynamics(relationships, gameState.player, gameState.currentClub);

        set({
          gameState: { ...gameState, relationships, teamDynamics },
        });
      },

      // ---- Mindset ----

      setMindset: (mindset: PlayerMindset) => {
        const { gameState } = get();
        if (!gameState) return;

        set({
          gameState: { ...gameState, mindset },
        });
      },

      // ---- Weather Preparation ----

      setWeatherPreparation: (preparation: 'standard' | 'adapt' | 'ignore') => {
        const { gameState } = get();
        if (!gameState) return;

        set({
          gameState: { ...gameState, weatherPreparation: preparation },
        });
      },

      // ---- Season Training Focus ----

      setSeasonTrainingFocus: (area: SeasonTrainingFocusArea) => {
        const { gameState } = get();
        if (!gameState) return;

        const focusAttributes = FOCUS_AREA_ATTRIBUTES[area];
        const bonusMultiplier = calculateFocusBonusMultiplier(gameState.player, gameState.player.seasonStats);

        const focus: SeasonTrainingFocus = {
          area,
          focusAttributes,
          bonusMultiplier,
          setAtSeason: gameState.currentSeason,
        };

        set({
          gameState: { ...gameState, seasonTrainingFocus: focus },
        });

        get().addNotification({
          type: 'training',
          title: 'Training Focus Set! 🎯',
          message: `Your seasonal training focus is now ${area}. Focused attributes get ${bonusMultiplier}x growth bonus!`,
          actionRequired: false,
        });
      },

      // ---- Player Team Level ----

      promoteToU21: () => {
        const { gameState } = get();
        if (!gameState || gameState.playerTeamLevel !== 'u18') return;

        set({
          gameState: { ...gameState, playerTeamLevel: 'u21' },
        });

        get().addNotification({
          type: 'career',
          title: 'Promoted to U21! ⬆️',
          message: 'You\'ve been promoted from the U18 to the U21 team!',
          actionRequired: false,
        });
      },

      promoteToSenior: () => {
        const { gameState } = get();
        if (!gameState || gameState.playerTeamLevel === 'senior') return;

        const updatedPlayer = { ...gameState.player };
        updatedPlayer.squadStatus = 'prospect';

        set({
          gameState: {
            ...gameState,
            playerTeamLevel: 'senior',
            player: updatedPlayer,
          },
        });

        get().addNotification({
          type: 'career',
          title: 'Promoted to Senior Team! 🎉',
          message: 'You\'ve been promoted to the senior squad! Your academy journey is complete!',
          actionRequired: false,
        });
      },

      // ---- Save/Load ----

      saveGame: (slotName) => {
        const { gameState } = get();
        if (!gameState) return;

        const slot: SaveSlot = {
          id: generateId(),
          name: slotName,
          gameState: {
            ...gameState,
            lastSaved: new Date().toISOString(),
          },
          savedAt: new Date().toISOString(),
          playTime: gameState.playTime,
        };

        persistSaveGame(slot);

        get().addNotification({
          type: 'career',
          title: 'Game Saved',
          message: `Your career has been saved as "${slotName}".`,
          actionRequired: false,
        });
      },

      loadGame: (slotId) => {
        const slot = persistLoadGame(slotId);
        if (slot) {
          get().loadCareer(slot);
        } else {
          get().addNotification({
            type: 'career',
            title: 'Load Failed',
            message: 'Could not load the save file. It may be corrupted or missing.',
            actionRequired: false,
          });
        }
      },
    }),
    {
      name: 'elite-striker-store',
      // Only persist the game state, not UI state
      partialize: (state) => ({
        gameState: state.gameState,
        screen: state.screen,
        scheduledTraining: state.scheduledTraining,
      }),
      // Merge persisted state with current, migrating old GameState objects
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<GameStoreState>) };
        if (merged.gameState) {
          merged.gameState = migrateGameState(merged.gameState);
        }
        return merged;
      },
    }
  )
);

// DEBUG: expose store to window for QA testing
if (typeof window !== 'undefined') { (window as any).__useGameStore = useGameStore; }
