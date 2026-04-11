// ============================================================
// Elite Striker - International Duty Engine
// Handles national team call-ups, fixtures, and match simulation
// ============================================================

import { Player, InternationalFixture, InternationalMatchType, InternationalCareer } from './types';
import { NATIONALITIES } from './playerData';
import { generateId, randomBetween, clamp } from './gameUtils';

// -----------------------------------------------------------
// International break weeks by league
// These are the weeks during the season where international
// breaks occur (no league matches, national team matches instead)
// -----------------------------------------------------------
const INTERNATIONAL_BREAK_WEEKS: Record<string, number[]> = {
  premier_league: [10, 22, 34],
  la_liga: [11, 23, 35],
  serie_a: [11, 23, 35],
  bundesliga: [9, 19, 29],
  ligue_1: [9, 19, 29],
};

// -----------------------------------------------------------
// Opponent nations for international matches
// Grouped roughly by strength tier
// -----------------------------------------------------------
const TIER_1_NATIONS = [
  { name: 'France', flag: '🇫🇷' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Belgium', flag: '🇧🇪' },
];

const TIER_2_NATIONS = [
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Austria', flag: '🇦🇹' },
];

const TIER_3_NATIONS = [
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Ivory Coast', flag: '🇨🇮' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Ukraine', flag: '🇺🇦' },
];

const ALL_OPPONENTS = [...TIER_1_NATIONS, ...TIER_2_NATIONS, ...TIER_3_NATIONS];

// -----------------------------------------------------------
// Get the player's nation info from NATIONALITIES
// -----------------------------------------------------------
export function getPlayerNationInfo(nationality: string): { name: string; flag: string } {
  const found = NATIONALITIES.find(n => n.name === nationality);
  return found
    ? { name: found.name, flag: found.flag }
    : { name: nationality, flag: '🏳️' };
}

// -----------------------------------------------------------
// Get international break weeks for a given league
// -----------------------------------------------------------
export function getInternationalBreakWeeks(league: string): number[] {
  return INTERNATIONAL_BREAK_WEEKS[league] ?? INTERNATIONAL_BREAK_WEEKS['premier_league'];
}

// -----------------------------------------------------------
// Check if a specific week is an international break week
// -----------------------------------------------------------
export function isInternationalBreakWeek(week: number, league: string): boolean {
  return getInternationalBreakWeeks(league).includes(week);
}

// -----------------------------------------------------------
// Determine if the player should be called up to national team
// Requirements: reputation >= 60, form >= 5.5, age 17-36
// Higher reputation and form increase probability
// -----------------------------------------------------------
export function shouldCallUp(
  player: Player,
  season: number,
  week: number
): boolean {
  // Age check: must be at least 17 and at most 36
  if (player.age < 17 || player.age > 36) return false;

  // Minimum requirements
  if (player.reputation < 60) return false;
  if (player.form < 5.5) return false;

  // Injury check - can't be called up if injured
  if (player.injuryWeeks > 0) return false;

  // Base probability from reputation
  const reputationFactor = (player.reputation - 60) / 40; // 0 to 1
  const formFactor = (player.form - 5.5) / 4.5; // 0 to 1
  const overallFactor = (player.overall - 70) / 30; // 0 to 1 for 70-100 OVR

  // Combined probability
  const probability = 0.3 + (reputationFactor * 0.3) + (formFactor * 0.2) + (Math.max(0, overallFactor) * 0.2);

  return Math.random() < clamp(probability, 0.3, 0.95);
}

// -----------------------------------------------------------
// Pick a random opponent nation (avoiding same nation as player)
// Weighted toward same-tier nations for competitive matches
// -----------------------------------------------------------
function pickOpponent(playerNationality: string): { name: string; flag: string } {
  const playerNation = getPlayerNationInfo(playerNationality);
  const eligible = ALL_OPPONENTS.filter(n => n.name !== playerNation.name);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// -----------------------------------------------------------
// Determine match type based on season timing
// First break: friendlies, second: qualifiers, third: tournament/mixed
// -----------------------------------------------------------
export function determineMatchType(
  breakIndex: number,
  season: number
): InternationalMatchType {
  // Every 4th season has a "tournament" at the third break
  if (breakIndex === 2 && season % 4 === 0) {
    return 'tournament_group';
  }
  if (breakIndex === 2 && season % 4 === 1) {
    return 'tournament_knockout';
  }

  // First break usually friendlies
  if (breakIndex === 0) {
    return Math.random() < 0.7 ? 'friendly' : 'qualifier';
  }

  // Second break usually qualifiers
  if (breakIndex === 1) {
    return Math.random() < 0.6 ? 'qualifier' : 'friendly';
  }

  // Third break: mix
  const roll = Math.random();
  if (roll < 0.3) return 'friendly';
  if (roll < 0.7) return 'qualifier';
  return 'tournament_group';
}

// -----------------------------------------------------------
// Get human-readable match type label
// -----------------------------------------------------------
export function getMatchTypeLabel(type: InternationalMatchType): string {
  const labels: Record<InternationalMatchType, string> = {
    friendly: 'Friendly',
    qualifier: 'Qualifier',
    tournament_group: 'Group Stage',
    tournament_knockout: 'Knockout',
    tournament_final: 'Final',
  };
  return labels[type];
}

// -----------------------------------------------------------
// Get tournament name based on season
// -----------------------------------------------------------
export function getTournamentName(season: number): string {
  const year = new Date().getFullYear() + season - 1;
  const cycle = season % 4;

  if (cycle === 0) return `World Cup ${year + 2}`;
  if (cycle === 2) return `Euro ${year + 1}/${year + 2}`;
  return `Continental Cup ${year + 1}`;
}

// -----------------------------------------------------------
// Generate international fixtures for a specific break
// Player gets called up for 1-2 matches during the break
// -----------------------------------------------------------
export function generateInternationalFixtures(
  nationality: string,
  season: number,
  breakWeeks: number[]
): InternationalFixture[] {
  const playerNation = getPlayerNationInfo(nationality);
  const fixtures: InternationalFixture[] = [];

  // Generate 1-2 matches per break
  const numMatches = Math.random() < 0.4 ? 2 : 1;

  for (let i = 0; i < numMatches; i++) {
    const opponent = pickOpponent(nationality);
    const breakIndex = i % breakWeeks.length;
    const matchWeek = breakWeeks[breakIndex];

    // Determine if home or away
    const isHome = Math.random() < 0.5;

    // Determine match type
    const breakOrder = breakWeeks.indexOf(matchWeek);
    const matchType = determineMatchType(breakOrder >= 0 ? breakOrder : 0, season);

    fixtures.push({
      id: generateId(),
      homeNation: isHome ? playerNation.name : opponent.name,
      awayNation: isHome ? opponent.name : playerNation.name,
      matchType,
      homeFlag: isHome ? playerNation.flag : opponent.flag,
      awayFlag: isHome ? opponent.flag : playerNation.flag,
      week: matchWeek + i, // Slight offset for 2nd match
      season,
      played: false,
      playerCalledUp: false, // Will be set later
    });
  }

  return fixtures;
}

// -----------------------------------------------------------
// Simulate an international match
// Uses simplified match engine with random scores (0-4 range)
// Player contribution based on overall, form, etc.
// -----------------------------------------------------------
export function processInternationalMatch(
  fixture: InternationalFixture,
  player: Player
): InternationalFixture {
  // Generate random score (0-4 range, weighted toward lower scores)
  const homeStrength = randomBetween(0, 10);
  const awayStrength = randomBetween(0, 10);
  const homeScore = poissonRandom(1.2 + homeStrength * 0.05);
  const awayScore = poissonRandom(1.0 + awayStrength * 0.05);

  // Determine if player starts
  const startChance = 0.5 + (player.overall - 75) * 0.02 + (player.form - 6) * 0.05;
  const playerStarted = Math.random() < clamp(startChance, 0.2, 0.9);

  // Player minutes
  const playerMinutes = playerStarted
    ? randomBetween(60, 90)
    : randomBetween(15, 45);

  // Player goals (based on overall and position)
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const goalChance = isAttacker
    ? 0.15 + (player.overall - 70) * 0.008 + (player.form - 6) * 0.03
    : 0.03 + (player.overall - 70) * 0.002;
  let playerGoals = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.random() < goalChance) playerGoals++;
  }

  // Player assists
  const assistChance = isAttacker
    ? 0.1 + (player.overall - 70) * 0.005
    : 0.08 + (player.overall - 70) * 0.004;
  let playerAssists = 0;
  for (let i = 0; i < 2; i++) {
    if (Math.random() < assistChance) playerAssists++;
  }

  // Player rating (5.0-10.0 range)
  const baseRating = 6.0;
  const formBonus = (player.form - 6) * 0.3;
  const goalBonus = playerGoals * 0.5;
  const assistBonus = playerAssists * 0.3;
  const overallBonus = (player.overall - 70) * 0.05;
  const matchImpactBonus = playerMinutes > 60 ? 0.2 : 0;
  const randomVariance = (Math.random() - 0.5) * 1.5;

  const playerRating = clamp(
    baseRating + formBonus + goalBonus + assistBonus + overallBonus + matchImpactBonus + randomVariance,
    4.0,
    10.0
  );

  return {
    ...fixture,
    played: true,
    homeScore,
    awayScore,
    playerCalledUp: true,
    playerStarted,
    playerMinutes,
    playerGoals,
    playerAssists,
    playerRating: Math.round(playerRating * 10) / 10,
  };
}

// -----------------------------------------------------------
// Update international career stats after a match
// -----------------------------------------------------------
export function updateInternationalCareer(
  career: InternationalCareer,
  fixture: InternationalFixture
): InternationalCareer {
  if (!fixture.playerCalledUp || !fixture.playerStarted && (fixture.playerMinutes ?? 0) === 0) {
    return career;
  }

  const newCaps = career.caps + 1;
  const newGoals = career.goals + (fixture.playerGoals ?? 0);
  const newAssists = career.assists + (fixture.playerAssists ?? 0);

  // Recalculate average rating
  const totalRatingPoints = career.averageRating * career.caps + (fixture.playerRating ?? 6.0);
  const newAverageRating = Math.round((totalRatingPoints / newCaps) * 10) / 10;

  // Track tournaments
  const tournamentName = getTournamentName(fixture.season);
  const newTournaments = [...career.tournaments];
  if (
    (fixture.matchType === 'tournament_group' ||
      fixture.matchType === 'tournament_knockout' ||
      fixture.matchType === 'tournament_final') &&
    !newTournaments.includes(tournamentName)
  ) {
    newTournaments.push(tournamentName);
  }

  return {
    caps: newCaps,
    goals: newGoals,
    assists: newAssists,
    averageRating: newAverageRating,
    tournaments: newTournaments,
    lastCallUpSeason: fixture.season,
    lastCallUpWeek: fixture.week,
  };
}

// -----------------------------------------------------------
// Calculate the reputation boost from an international call-up
// -----------------------------------------------------------
export function getCallUpReputationBoost(fixture: InternationalFixture): number {
  const boosts: Record<InternationalMatchType, number> = {
    friendly: 1,
    qualifier: 2,
    tournament_group: 3,
    tournament_knockout: 4,
    tournament_final: 6,
  };
  return boosts[fixture.matchType] ?? 1;
}

// -----------------------------------------------------------
// Calculate morale change from international duty
// -----------------------------------------------------------
export function getInternationalMoraleChange(fixture: InternationalFixture): number {
  // Being called up is an honor
  let moraleChange = 3;

  // Match result affects morale
  if (fixture.playerRating !== undefined) {
    if (fixture.playerRating >= 7.5) moraleChange += 5;
    else if (fixture.playerRating >= 6.5) moraleChange += 2;
    else if (fixture.playerRating < 5.0) moraleChange -= 3;
  }

  // Tournament matches are more impactful
  if (fixture.matchType.startsWith('tournament')) {
    moraleChange += 2;
  }

  return moraleChange;
}

// -----------------------------------------------------------
// Calculate fatigue cost from international duty
// -----------------------------------------------------------
export function getInternationalFatigueCost(fixture: InternationalFixture): number {
  // Travel + match fatigue
  const baseCost = 8;
  const minutesCost = Math.round((fixture.playerMinutes ?? 0) / 8);
  const tournamentExtra = fixture.matchType.startsWith('tournament') ? 3 : 0;

  return baseCost + minutesCost + tournamentExtra;
}

// -----------------------------------------------------------
// Poisson random for goal generation
// -----------------------------------------------------------
function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return Math.min(k - 1, 4); // Cap at 4 for realism
}

// -----------------------------------------------------------
// Generate fixtures for all international breaks in a season
// -----------------------------------------------------------
export function generateSeasonInternationalFixtures(
  nationality: string,
  season: number,
  league: string
): InternationalFixture[] {
  const breakWeeks = getInternationalBreakWeeks(league);
  const allFixtures: InternationalFixture[] = [];

  for (const breakWeek of breakWeeks) {
    const fixtures = generateInternationalFixtures(nationality, season, [breakWeek]);
    allFixtures.push(...fixtures);
  }

  return allFixtures;
}
