// ============================================================
// Elite Striker - Core Game Type Definitions (Unified)
// ============================================================

// --- Positions ---
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export const POSITION_GROUPS: Record<string, Position[]> = {
  Goalkeeper: ['GK'],
  Defence: ['CB', 'LB', 'RB'],
  Midfield: ['CDM', 'CM', 'CAM'],
  Attack: ['LW', 'RW', 'ST'],
};

// --- Player Attributes (0-100 scale) ---
export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

// --- Playing Style ---
export interface PlayingStyle {
  attacking: number;   // 0-100
  possession: number;  // 0-100
  pressing: number;    // 0-100
  defensive: number;   // 0-100
}

// --- Club ---
export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  tier: number;          // 1-5
  reputation: number;    // 0-100
  quality: number;       // 0-100 average team strength
  budget: number;        // transfer budget in euros
  wageBudget: number;    // weekly wage budget
  squadSize: number;
  facilities: number;    // 0-100
  finances: number;      // 0-100
  tacticalStyle: string; // 'attacking'|'defensive'|'counter-attack'|'possession'
  formation: string;     // e.g. '4-3-3'
  squadQuality: number;  // 0-100
  youthDevelopment: number; // 0-100
  style: PlayingStyle;
  needsPositions: Position[];
  logo: string;          // emoji
  primaryColor: string;
  secondaryColor: string;
}

// --- Squad Status ---
export type SquadStatus = 'starter' | 'rotation' | 'bench' | 'prospect' | 'loan' | 'transfer_listed';

// --- Contract ---
export interface Contract {
  weeklyWage: number;
  releaseClause?: number;
  yearsRemaining: number;
  signingBonus?: number;
  performanceBonuses?: {
    goalsBonus?: number;
    assistBonus?: number;
    cleanSheetBonus?: number;
  };
}

// --- Injury ---
export interface InjuryRecord {
  type: string;
  weekOccured: number;
  seasonOccured: number;
  weeksOut: number;
}

// --- Player Trait ---
export type PlayerTrait =
  | 'speedster' | 'poacher' | 'playmaker' | 'tank' | 'aerial'
  | 'technical' | 'leader' | 'injury_prone' | 'late_bloomer'
  | 'wonderkid' | 'consistent' | 'volatile';

// --- Season Stats ---
export interface SeasonPlayerStats {
  appearances: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
  manOfTheMatch: number;
  injuries: number;
}

export interface CareerPlayerStats {
  totalAppearances: number;
  totalGoals: number;
  totalAssists: number;
  totalCleanSheets: number;
  trophies: Trophy[];
  seasonsPlayed: number;
}

export interface Trophy {
  name: string;
  season: number;
}

// --- Player ---
export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: Position;
  secondaryPositions: Position[];
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  fitness: number;       // 0-100
  morale: number;        // 0-100
  form: number;          // 0-10 rolling avg
  reputation: number;    // 0-100
  marketValue: number;   // in euros
  squadStatus: SquadStatus;
  contract: Contract;
  injuryWeeks: number;   // 0 = fit
  injuryHistory: InjuryRecord[];
  seasonStats: SeasonPlayerStats;
  careerStats: CareerPlayerStats;
  traits: PlayerTrait[];
  agentQuality: number;  // 0-100
  preferredFoot: 'left' | 'right' | 'both';
}

// --- Match Types ---
export interface MatchResult {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerRating: number;
  playerMinutesPlayed: number;
  playerStarted: boolean;
  playerGoals: number;
  playerAssists: number;
  competition: string;
  week: number;
  season: number;
}

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  team: 'home' | 'away' | 'neutral';
  playerName?: string;
  playerId?: string;
  detail?: string;
}

export type MatchEventType =
  | 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
  | 'second_yellow' | 'substitution' | 'injury' | 'chance'
  | 'save' | 'penalty_won' | 'penalty_missed' | 'corner' | 'free_kick';

export interface MatchState {
  homeScore: number;
  awayScore: number;
  homeMomentum: number;
  awayMomentum: number;
  events: MatchEvent[];
  playerInvolved: boolean;
  playerHasGoal: boolean;
  playerHasAssist: boolean;
  playerTeam: 'home' | 'away';
}

// --- Fixture ---
export interface Fixture {
  id: string;
  homeClubId: string;
  awayClubId: string;
  date: string;
  matchday: number;
  competition: 'league' | 'cup' | 'continental' | 'friendly';
  season: number;
  played: boolean;
}

// --- League ---
export interface LeagueStanding {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

// --- Training ---
export interface TrainingSession {
  type: TrainingType;
  intensity: number;        // 0-100
  focusAttribute?: keyof PlayerAttributes;
  completedAt: number;
}

export type TrainingType = 'attacking' | 'defensive' | 'physical' | 'technical' | 'tactical' | 'recovery';

// --- Random Events ---
export type EventType =
  | 'TRANSFER_RUMOR' | 'MEDIA_INTERVIEW' | 'PERSONAL_LIFE'
  | 'TEAM_CONFLICT' | 'MENTORSHIP' | 'SPONSORSHIP';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  choices: EventChoice[];
  week: number;
  season: number;
  expires: boolean;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffects;
}

export interface EventEffects {
  morale?: number;
  reputation?: number;
  fitness?: number;
  marketValue?: number;
  attributes?: Partial<PlayerAttributes>;
  form?: number;
  injuryWeeks?: number;
  squadStatus?: SquadStatus;
  contract?: Partial<Contract>;
}

// --- Transfer ---
export interface TransferOffer {
  id: string;
  fromClub: Club;
  fee: number;
  contractOffer: Contract;
  squadRole: SquadStatus;
  transferWindow: 'summer' | 'winter';
  season: number;
  week: number;
}

export interface LoanOffer {
  id: string;
  fromClub: Club;
  durationWeeks: number;
  guaranteedMinutes: boolean;
  wageContribution: number;
  season: number;
  week: number;
}

// --- Social ---
export interface SocialPost {
  id: string;
  source: string;
  content: string;
  sentiment: number;   // -100 to 100
  engagement: number;  // 0-100
  week: number;
  season: number;
  type: 'fan' | 'media' | 'official' | 'agent' | 'pundit';
}

export interface Storyline {
  id: string;
  title: string;
  description: string;
  startDate: number;
  startWeek: number;
  startSeason: number;
  currentPhase: number;
  totalPhases: number;
  sentiment: number;  // -100 to 100
  status: 'active' | 'resolved' | 'dormant';
  tags: string[];
}

// --- Achievement ---
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedSeason?: number;
  category: 'career' | 'match' | 'training' | 'social' | 'transfer';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// --- Week Simulation ---
export interface WeekSimulation {
  week: number;
  season: number;
  matchResult: MatchResult | null;
  trainingCompleted: TrainingSession[];
  events: GameEvent[];
  transferOffers: TransferOffer[];
  loanOffers: LoanOffer[];
  socialPosts: SocialPost[];
  storylineUpdates: Storyline[];
  playerUpdates: Partial<Player>;
}

// --- Save Slot ---
export interface SaveSlot {
  id: string;
  name: string;
  gameState: GameState;
  savedAt: string;
  playTime: number;
}

// --- Game Notification ---
export interface GameNotification {
  id: string;
  type: 'match' | 'transfer' | 'event' | 'achievement' | 'social' | 'contract' | 'training';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionRequired: boolean;
}

// --- Game Screen Navigation ---
export type GameScreen =
  | 'main_menu' | 'career_setup' | 'dashboard' | 'match_day'
  | 'training' | 'transfers' | 'agent_hub' | 'career_hub'
  | 'analytics' | 'season_stats' | 'social' | 'events'
  | 'settings' | 'save_load' | 'league_table' | 'player_profile';

// --- Game State (Master State) ---
export interface GameState {
  player: Player;
  currentClub: Club;
  currentSeason: number;
  currentWeek: number;
  year: number;
  seasons: {
    number: number;
    year: number;
    leaguePosition: number;
    playerStats: SeasonPlayerStats;
    achievements: string[];
  }[];
  recentResults: MatchResult[];
  upcomingFixtures: Fixture[];
  leagueTable: LeagueStanding[];
  activeEvents: GameEvent[];
  resolvedEvents: GameEvent[];
  transferOffers: TransferOffer[];
  loanOffers: LoanOffer[];
  socialFeed: SocialPost[];
  storylines: Storyline[];
  achievements: Achievement[];
  trainingHistory: TrainingSession[];
  trainingAvailable: number;
  availableClubs: Club[];
  notifications: GameNotification[];
  gameMode: 'career';
  difficulty: 'easy' | 'normal' | 'hard';
  createdAt: string;
  lastSaved: string;
  playTime: number;
}
