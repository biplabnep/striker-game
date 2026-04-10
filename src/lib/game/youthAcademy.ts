// ============================================================
// Elite Striker - Youth Academy Engine
// Handles youth player generation, progression, promotion,
// youth league simulation, and youth cup fixtures
// ============================================================

import {
  YouthPlayer,
  YouthCategory,
  YouthTeam,
  YouthLeagueStanding,
  YouthFixture,
  YouthMatchResult,
  Club,
  Position,
  PlayerAttributes,
  PlayerTrait,
} from './types';
import { generatePlayerName, generateInitialAttributes, NATIONALITIES } from './playerData';
import { generateId, randomBetween, clamp } from './gameUtils';
import { calculateOverall } from './progressionEngine';
import { getClubsByLeague } from './clubsData';

// ============================================================
// Youth Player Generation
// ============================================================

const YOUTH_FIRST_NAMES = [
  'Mateo', 'Ethan', 'Noah', 'Liam', 'Oliver', 'Lucas', 'Leo', 'Julian',
  'Adrian', 'Kai', 'Hugo', 'Dani', 'Alejandro', 'Marco', 'Yusuf', 'Rhys',
  'Thiago', 'Gabriel', 'Oscar', 'Rafael', 'Ivan', 'Fabio', 'Denis', 'Jan',
  'Nico', 'Pau', 'Pedro', 'Santi', 'Jude', 'Bukayo', 'Florian', 'Warren',
  'Lamine', 'Pau', 'Giovanni', 'Mathys', 'Arda', 'Endrick', 'Estevao',
  'Vitor', 'Warren', 'Leny', 'Kobbie', 'Alejandro', 'Savinho', 'Jorrel',
  'Ilkay', 'Xavi', 'Gavi', 'Ansu', 'Pedri', 'Eric', 'Mason', 'Cole',
];

const YOUTH_LAST_NAMES = [
  'Fernandez', 'Martinez', 'Silva', 'Santos', 'Weber', 'Johansson',
  'Dubois', 'Rossi', 'Muller', 'Van Bergen', 'Okafor', 'Tremouille',
  'Delacroix', 'Hernandez', 'Torres', 'Kimura', 'Osei', 'Diallo',
  'Patel', 'Nguyen', 'Ramirez', 'Gonzalez', 'Schneider', 'Andersen',
  'Moreau', 'Colombo', 'Becker', 'Bakker', 'Mensah', 'Konate',
  'Walsh', 'Palmer', 'Rice', 'Mainoo', 'Garnacho', 'Simons',
  'Yamal', 'Cubarsi', 'Bernal', 'Zaire-Emery', 'Doku', 'Mudryk',
];

const YOUTH_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

// Potential star ratings for display
function getPotentialStars(potential: number): string {
  if (potential >= 90) return '★★★★★';
  if (potential >= 82) return '★★★★☆';
  if (potential >= 74) return '★★★☆☆';
  if (potential >= 65) return '★★☆☆☆';
  return '★☆☆☆☆';
}

export function getPotentialRange(potential: number): { label: string; color: string } {
  if (potential >= 90) return { label: 'Exceptional', color: 'text-amber-400' };
  if (potential >= 82) return { label: 'Exciting', color: 'text-emerald-400' };
  if (potential >= 74) return { label: 'Showing Great Potential', color: 'text-blue-400' };
  if (potential >= 65) return { label: 'Promising', color: 'text-cyan-400' };
  if (potential >= 55) return { label: 'Average', color: 'text-slate-400' };
  return { label: 'Limited', color: 'text-red-400' };
}

export function generateYouthPlayer(
  clubId: string,
  category: YouthCategory,
  season: number,
  clubYouthDev: number,
  position?: Position,
): YouthPlayer {
  const { firstName, lastName } = generatePlayerName(
    NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)].name
  );
  // Mix in some youth-style names
  const useYouthName = Math.random() < 0.3;
  const name = useYouthName
    ? `${YOUTH_FIRST_NAMES[Math.floor(Math.random() * YOUTH_FIRST_NAMES.length)]} ${YOUTH_LAST_NAMES[Math.floor(Math.random() * YOUTH_LAST_NAMES.length)]}`
    : `${firstName} ${lastName}`;

  const pos = position ?? YOUTH_POSITIONS[Math.floor(Math.random() * YOUTH_POSITIONS.length)];

  // Age range: U18 = 14-17, U21 = 18-20
  const ageMin = category === 'u18' ? 14 : 18;
  const ageMax = category === 'u18' ? 17 : 20;
  const age = Math.floor(Math.random() * (ageMax - ageMin + 1)) + ageMin;

  // Potential based on club youth development quality
  const potentialBase = 40 + (clubYouthDev / 100) * 40; // 40-80 base
  const potentialVariance = randomBetween(-10, 20);
  const potential = clamp(Math.round(potentialBase + potentialVariance), 30, 99);

  // Generate attributes scaled to youth level
  const attributes = generateYouthAttributes(pos, age, potential, category);

  const overall = calculateOverall(attributes, pos);

  // Determine promotion status
  const promotionStatus = getPromotionStatus(age, overall, category, potential);

  // Assign 0-2 traits for higher potential players
  const traits: PlayerTrait[] = [];
  if (potential >= 80 && Math.random() < 0.4) {
    traits.push('wonderkid');
  }
  if (potential >= 70 && Math.random() < 0.3) {
    const posTraits: PlayerTrait[] = pos === 'GK' ? ['quick_recovery'] :
      ['LW', 'RW', 'ST'].includes(pos) ? ['speed_demon', 'clinical_finisher'] :
      ['CM', 'CAM'].includes(pos) ? ['playmaker', 'technical'] :
      ['leadership', 'iron_wall'];
    traits.push(posTraits[Math.floor(Math.random() * posTraits.length)]);
  }

  return {
    id: generateId(),
    name,
    age,
    nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)].name,
    position: pos,
    secondaryPositions: [],
    attributes,
    overall,
    potential,
    fitness: randomBetween(70, 95),
    morale: randomBetween(50, 80),
    form: randomBetween(5, 8),
    category,
    clubId,
    seasonStats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      averageRating: 0,
      cleanSheets: 0,
    },
    traits,
    preferredFoot: Math.random() < 0.7 ? 'right' : Math.random() < 0.5 ? 'left' : 'both',
    joinedSeason: season,
    trainingFocus: undefined,
    promotionStatus,
  };
}

function generateYouthAttributes(
  position: Position,
  age: number,
  potential: number,
  category: YouthCategory,
): PlayerAttributes {
  // Youth players have lower base attributes than senior players
  const youthMultiplier = category === 'u18' ? 0.55 : 0.7;
  const ageBonus = (age - 14) * 2;

  const baseAttrs = generateInitialAttributes(position, age, potential);
  const attrs: PlayerAttributes = {
    pace: clamp(Math.round((baseAttrs.pace * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
    shooting: clamp(Math.round((baseAttrs.shooting * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
    passing: clamp(Math.round((baseAttrs.passing * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
    dribbling: clamp(Math.round((baseAttrs.dribbling * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
    defending: clamp(Math.round((baseAttrs.defending * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
    physical: clamp(Math.round((baseAttrs.physical * youthMultiplier) + ageBonus + randomBetween(-3, 3)), 5, 75),
  };

  return attrs;
}

function getPromotionStatus(
  age: number,
  overall: number,
  category: YouthCategory,
  potential: number,
): 'developing' | 'ready' | 'overdue' {
  if (category === 'u18') {
    if (age >= 17 && overall >= 60) return 'ready';
    if (age >= 17 && overall >= 55) return 'overdue';
    return 'developing';
  }
  // U21
  if (age >= 20 && overall >= 68) return 'ready';
  if (age >= 20 && overall >= 62) return 'overdue';
  if (age >= 21) return 'overdue';
  if (age >= 19 && overall >= 72 && potential >= 80) return 'ready';
  return 'developing';
}

// ============================================================
// Youth Team Generation
// ============================================================

export function generateYouthTeamsForClub(
  clubId: string,
  season: number,
  clubYouthDev: number,
): YouthTeam[] {
  // U18 squad: 16-22 players
  const u18Count = randomBetween(16, 22);
  const u18Players: YouthPlayer[] = [];
  // Ensure at least 2 GKs, 4 DEF, 4 MID, 3 ATT
  const requiredPositions: Position[] = ['GK', 'GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
  for (let i = 0; i < u18Count; i++) {
    const pos = i < requiredPositions.length ? requiredPositions[i] : undefined;
    u18Players.push(generateYouthPlayer(clubId, 'u18', season, clubYouthDev, pos));
  }

  // U21 squad: 16-22 players
  const u21Count = randomBetween(16, 22);
  const u21Players: YouthPlayer[] = [];
  for (let i = 0; i < u21Count; i++) {
    const pos = i < requiredPositions.length ? requiredPositions[i] : undefined;
    u21Players.push(generateYouthPlayer(clubId, 'u21', season, clubYouthDev, pos));
  }

  return [
    { clubId, category: 'u18', players: u18Players },
    { clubId, category: 'u21', players: u21Players },
  ];
}

// Generate youth teams for all clubs in a league
export function generateAllYouthTeams(
  leagueId: string,
  season: number,
): YouthTeam[] {
  const clubs = getClubsByLeague(leagueId);
  const teams: YouthTeam[] = [];
  for (const club of clubs) {
    teams.push(...generateYouthTeamsForClub(club.id, season, club.youthDevelopment));
  }
  return teams;
}

// ============================================================
// Youth League & Cup Fixture Generation
// ============================================================

export function generateYouthLeagueFixtures(
  leagueId: string,
  category: YouthCategory,
  season: number,
): YouthFixture[] {
  const clubs = getClubsByLeague(leagueId);
  if (clubs.length < 2) return [];

  const clubIds = clubs.map(c => c.id);
  const n = clubIds.length;
  const totalRounds = n - 1;
  const matchesPerRound = Math.floor(n / 2);
  const fixtures: YouthFixture[] = [];

  // Circle method (same as senior)
  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = match === 0 ? 0 : ((round + match) % (n - 1)) + 1;
      const awayIdx = ((round + (n - 1) - match) % (n - 1)) + 1;
      const homeTeam = match === 0 ? clubIds[0] : clubIds[homeIdx];
      const awayTeam = clubIds[awayIdx];

      // First half
      fixtures.push({
        id: generateId(),
        homeClubId: homeTeam,
        awayClubId: awayTeam,
        matchday: round + 1,
        competition: 'youth_league',
        category,
        season,
        played: false,
      });

      // Second half (reversed)
      fixtures.push({
        id: generateId(),
        homeClubId: awayTeam,
        awayClubId: homeTeam,
        matchday: totalRounds + round + 1,
        competition: 'youth_league',
        category,
        season,
        played: false,
      });
    }
  }

  return fixtures;
}

export function generateYouthCupFixtures(
  leagueId: string,
  category: YouthCategory,
  season: number,
): YouthFixture[] {
  const clubs = getClubsByLeague(leagueId);
  if (clubs.length < 2) return [];

  const shuffled = [...clubs].sort(() => Math.random() - 0.5);
  const clubIds = shuffled.map(c => c.id);
  const n = clubIds.length;
  const fixtures: YouthFixture[] = [];

  let currentTeams = [...clubIds];
  let roundIndex = 1;

  while (currentTeams.length > 1) {
    const matchCount = Math.floor(currentTeams.length / 2);
    const nextRound: string[] = [];

    for (let i = 0; i < matchCount; i++) {
      fixtures.push({
        id: generateId(),
        homeClubId: currentTeams[i],
        awayClubId: currentTeams[currentTeams.length - 1 - i],
        matchday: roundIndex,
        competition: 'youth_cup',
        category,
        season,
        played: false,
      });
      nextRound.push(currentTeams[i]); // placeholder winner
    }

    if (currentTeams.length % 2 === 1) {
      nextRound.push(currentTeams[matchCount]);
    }

    currentTeams = nextRound;
    roundIndex++;
  }

  return fixtures;
}

// ============================================================
// Youth League Table Generation
// ============================================================

export function generateYouthLeagueTable(
  leagueId: string,
  category: YouthCategory,
): YouthLeagueStanding[] {
  const clubs = getClubsByLeague(leagueId);
  return clubs.map(club => ({
    clubId: club.id,
    clubName: `${club.shortName} ${category.toUpperCase()}`,
    category,
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
// Youth Match Simulation (simplified vs senior)
// ============================================================

export function simulateYouthMatch(
  homeClub: Club,
  awayClub: Club,
  category: YouthCategory,
  competition: 'youth_league' | 'youth_cup',
): { homeScore: number; awayScore: number } {
  // Youth matches have more variance and lower quality
  const youthFactor = category === 'u18' ? 0.7 : 0.85;
  const homeStrength = homeClub.youthDevelopment * youthFactor + randomBetween(-12, 12) + 3;
  const awayStrength = awayClub.youthDevelopment * youthFactor + randomBetween(-12, 12);

  const homeExpected = Math.max(0.3, (homeStrength - awayStrength) / 30 + 1.1);
  const awayExpected = Math.max(0.3, (awayStrength - homeStrength) / 30 + 0.9);

  // More goals in youth football (less organized defending)
  const homeGoals = poissonRandom(homeExpected * 1.15);
  const awayGoals = poissonRandom(awayExpected * 1.15);

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
// Youth League Table Update
// ============================================================

export function updateYouthLeagueTable(
  table: YouthLeagueStanding[],
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number,
): YouthLeagueStanding[] {
  const updated = table.map(entry => ({ ...entry }));
  const home = updated.find(e => e.clubId === homeClubId);
  const away = updated.find(e => e.clubId === awayClubId);

  if (home) {
    home.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    if (homeScore > awayScore) { home.won += 1; home.points += 3; }
    else if (homeScore === awayScore) { home.drawn += 1; home.points += 1; }
    else { home.lost += 1; }
  }

  if (away) {
    away.played += 1;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;
    if (awayScore > homeScore) { away.won += 1; away.points += 3; }
    else if (awayScore === homeScore) { away.drawn += 1; away.points += 1; }
    else { away.lost += 1; }
  }

  return updated;
}

// ============================================================
// Youth Player Weekly Progression
// ============================================================

export function applyYouthWeeklyProgression(
  player: YouthPlayer,
  clubYouthDev: number,
): Partial<YouthPlayer> {
  const updates: Partial<YouthPlayer> = {};
  const attrUpdates: Partial<PlayerAttributes> = {};

  // Youth players grow faster than seniors
  const ageGrowthRate = player.age <= 16 ? 0.08 :
    player.age <= 18 ? 0.06 :
    player.age <= 20 ? 0.04 : 0.02;

  // Club youth development factor
  const devFactor = 0.5 + (clubYouthDev / 100) * 0.8;

  // Natural growth
  const attrs = player.attributes;
  for (const key of Object.keys(attrs) as (keyof PlayerAttributes)[]) {
    const growth = ageGrowthRate * devFactor * (0.8 + Math.random() * 0.4);
    attrUpdates[key] = growth;
  }

  // Training focus boost
  if (player.trainingFocus) {
    const focusAttr = player.trainingFocus;
    if (!attrUpdates[focusAttr]) attrUpdates[focusAttr] = 0;
    attrUpdates[focusAttr]! += 0.15 * devFactor;
  }

  // Apply attribute updates
  const newAttrs = { ...attrs };
  for (const [key, value] of Object.entries(attrUpdates)) {
    if (value !== undefined) {
      newAttrs[key as keyof PlayerAttributes] = clamp(
        Math.round((newAttrs[key as keyof PlayerAttributes] + value) * 10) / 10,
        1, 85 // youth cap at 85 before promotion
      );
    }
  }
  updates.attributes = newAttrs;
  updates.overall = calculateOverall(newAttrs, player.position);

  // Potential can grow for very young players
  if (player.age <= 17 && Math.random() < 0.1) {
    const potGrowth = randomBetween(0, 2);
    if (potGrowth > 0) {
      updates.potential = clamp(player.potential + potGrowth, updates.overall ?? player.overall, 99);
    }
  }

  // Fitness recovery
  updates.fitness = clamp(player.fitness + randomBetween(3, 8), 0, 100);

  // Morale drift toward 60
  const moraleDrift = (60 - player.morale) * 0.05;
  updates.morale = clamp(Math.round(player.morale + moraleDrift), 0, 100);

  // Update promotion status
  updates.promotionStatus = getPromotionStatus(
    player.age, updates.overall ?? player.overall,
    player.category, updates.potential ?? player.potential
  );

  return updates;
}

// ============================================================
// Youth Player Promotion
// ============================================================

export function promoteYouthPlayerToU21(player: YouthPlayer): YouthPlayer {
  return {
    ...player,
    category: 'u21',
    seasonStats: { appearances: 0, goals: 0, assists: 0, averageRating: 0, cleanSheets: 0 },
    promotionStatus: 'developing',
  };
}

export function promoteYouthPlayerToFirstTeam(player: YouthPlayer): {
  name: string;
  position: Position;
  age: number;
  nationality: string;
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  traits: PlayerTrait[];
  preferredFoot: 'left' | 'right' | 'both';
} {
  // Boost attributes slightly on promotion (first-team coaching benefits)
  const promotedAttrs: PlayerAttributes = { ...player.attributes };
  for (const key of Object.keys(promotedAttrs) as (keyof PlayerAttributes)[]) {
    promotedAttrs[key] = clamp(promotedAttrs[key] + randomBetween(2, 5), 1, 99);
  }

  return {
    name: player.name,
    position: player.position,
    age: player.age,
    nationality: player.nationality,
    attributes: promotedAttrs,
    overall: calculateOverall(promotedAttrs, player.position),
    potential: player.potential,
    traits: player.traits,
    preferredFoot: player.preferredFoot,
  };
}

// ============================================================
// Youth Player Aging (Season End)
// ============================================================

export function ageUpYouthPlayers(teams: YouthTeam[]): YouthTeam[] {
  return teams.map(team => {
    const agedPlayers = team.players
      .map(player => {
        const newAge = player.age + 1;
        const newCategory: YouthCategory = newAge >= 18 ? 'u21' : 'u18';
        const newOverall = player.overall + randomBetween(1, 4); // youth natural growth

        return {
          ...player,
          age: newAge,
          category: newCategory,
          overall: clamp(newOverall, 1, 85),
          seasonStats: { appearances: 0, goals: 0, assists: 0, averageRating: 0, cleanSheets: 0 },
          promotionStatus: getPromotionStatus(newAge, newOverall, newCategory, player.potential),
        };
      })
      // Remove players who aged out of U21 (22+)
      .filter(player => player.age <= 21);

    return { ...team, players: agedPlayers };
  });
}

// ============================================================
// Youth Scouting - Generate new intake each season
// ============================================================

export function generateYouthIntake(
  clubId: string,
  season: number,
  clubYouthDev: number,
  count: number = randomBetween(3, 6),
): YouthPlayer[] {
  const newPlayers: YouthPlayer[] = [];
  for (let i = 0; i < count; i++) {
    newPlayers.push(generateYouthPlayer(clubId, 'u18', season, clubYouthDev));
  }
  return newPlayers;
}

// ============================================================
// Potential display helper
// ============================================================

export { getPotentialStars };
