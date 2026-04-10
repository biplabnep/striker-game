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
} from '@/lib/game/types';

// Engine imports
import { simulateMatch } from '@/lib/game/matchEngine';
import {
  applyWeeklyProgression,
  calculateOverall,
  applySeasonProgression,
  determineSquadStatusUpdate,
  updateForm,
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
} from '@/lib/game/gameUtils';
import {
  generateSeasonObjectives,
  updateObjectivesProgress,
  generateSeasonAwards,
  calculateObjectiveBonus,
} from '@/lib/game/objectivesEngine';

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
          message: `Welcome to ${club.name}! Your journey as a ${config.position} begins in the youth academy.`,
          actionRequired: false,
        });
      },

      loadCareer: (saveSlot) => {
        set({
          gameState: saveSlot.gameState,
          screen: 'dashboard' as GameScreen,
          notifications: [],
          scheduledTraining: null,
          matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
        });

        get().addNotification({
          type: 'career',
          title: 'Career Loaded',
          message: `Welcome back! ${saveSlot.gameState.player.name} at ${saveSlot.gameState.currentClub.name}`,
          actionRequired: false,
        });
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

        // 1. Increment week
        state.currentWeek += 1;
        const week = state.currentWeek;
        const season = state.currentSeason;

        // 2. Check if there's a fixture this week → simulate match
        const fixture = findFixtureForWeek(
          upcomingFixtures,
          currentClub.id,
          week
        );

        let matchResult: MatchResult | null = null;

        if (fixture) {
          const isHome = fixture.homeClubId === currentClub.id;
          const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId;
          const opponent = getClubById(opponentId);

          if (opponent) {
            const homeClub = isHome ? currentClub : opponent;
            const awayClub = isHome ? opponent : currentClub;

            // Simulate the player's match
            matchResult = simulateMatch(homeClub, awayClub, player, 'league', isHome ? 'home' : 'away');
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

            // Check for match injury
            const injuryEvent = matchResult.events.find(
              (e) => e.type === 'injury' && e.playerId === player.id
            );
            if (injuryEvent) {
              const weeksOut = randomBetween(1, 6);
              player.injuryWeeks = weeksOut;
              player.injuryHistory = [
                ...player.injuryHistory,
                {
                  type: 'Match Injury',
                  weekOccured: week,
                  seasonOccured: season,
                  weeksOut,
                },
              ];
              get().addNotification({
                type: 'match',
                title: 'Injury!',
                message: `You've been injured and will be out for ${weeksOut} weeks.`,
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

        // 2b. Cup match processing (on cup weeks)
        const isCupWeek = CUP_MATCH_WEEKS.includes(week);
        if (isCupWeek && !cupEliminated && cupFixtures.length > 0) {
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
                const cupMatchResult = simulateMatch(cupHomeClub, cupAwayClub, player, 'cup', isCupHome ? 'home' : 'away');
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

        // 3. Apply weekly progression
        const trainingSessions = scheduledTraining ? [scheduledTraining] : [];
        const progressionUpdates = applyWeeklyProgression(player, trainingSessions);

        if (trainingSessions.length > 0) {
          trainingHistory = [...trainingHistory, ...trainingSessions];
          trainingAvailable = Math.max(0, trainingAvailable - 1);
        }

        player = applyPlayerUpdates(player, progressionUpdates);

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

          // Update squad status
          player.squadStatus = determineSquadStatusUpdate(player, currentClub);

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

        return simulateMatch(homeClub, awayClub, gameState.player, 'league', isHome ? 'home' : 'away');
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
    }
  )
);
