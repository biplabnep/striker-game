// ============================================================
// Elite Striker - Continental Competitions Engine
// Champions League & Europa League simulation
// ============================================================

import {
  ContinentalFixture,
  ContinentalCompetition,
  ContinentalGroupStanding,
  Club,
  LeagueStanding,
} from './types';
import { generateId, randomBetween, clamp } from './gameUtils';
import { getClubsByLeague, ENRICHED_CLUBS } from './clubsData';

// --- Continental match weeks (every 2 weeks from week 3) ---
export const CONTINENTAL_GROUP_MATCH_WEEKS = [3, 5, 7, 9, 11, 13]; // 6 group stage matchdays
export const CONTINENTAL_KO_MATCH_WEEKS = [15, 17, 19, 21]; // R16, QF, SF, Final

// --- Determine continental qualification from league position ---
export function determineContinentalQualification(
  leaguePosition: number,
  _leagueTable: LeagueStanding[]
): { qualified: boolean; competition: ContinentalCompetition | null } {
  // Top 4 qualify for Champions League, 5-6 for Europa League
  if (leaguePosition <= 4) {
    return { qualified: true, competition: 'champions_league' };
  }
  if (leaguePosition <= 6) {
    return { qualified: true, competition: 'europa_league' };
  }
  return { qualified: false, competition: null };
}

// --- Select clubs from each league for continental competitions ---
export function selectContinentalClubs(): {
  championsLeague: Club[];
  europaLeague: Club[];
} {
  const leagues = ['premier_league', 'la_liga', 'serie_a', 'bundesliga', 'ligue_1'];
  const clClubs: Club[] = [];
  const elClubs: Club[] = [];

  for (const leagueId of leagues) {
    const clubs = getClubsByLeague(leagueId);
    // Sort by squad quality (proxy for league position) with some randomness
    const shuffled = [...clubs].sort((a, b) => {
      const aScore = a.squadQuality + randomBetween(-5, 5);
      const bScore = b.squadQuality + randomBetween(-5, 5);
      return bScore - aScore;
    });

    // Top 4 to CL, 5-6 to EL (adjust for 18-team leagues)
    const clCount = 4;
    const elCount = 2;

    for (let i = 0; i < Math.min(clCount, shuffled.length); i++) {
      clClubs.push(shuffled[i]);
    }
    for (let i = clCount; i < Math.min(clCount + elCount, shuffled.length); i++) {
      elClubs.push(shuffled[i]);
    }
  }

  return { championsLeague: clClubs, europaLeague: elClubs };
}

// --- Generate group stage fixtures ---
export function generateContinentalGroupFixtures(
  clubs: Club[],
  competition: ContinentalCompetition,
  season: number
): { fixtures: ContinentalFixture[]; standings: ContinentalGroupStanding[] } {
  // We need 32 clubs for 8 groups of 4
  // If we have fewer, pad with dummy clubs
  const neededClubs = competition === 'champions_league' ? 32 : 32;
  let pool = [...clubs];

  // If not enough real clubs, fill with generated ones
  while (pool.length < neededClubs) {
    const randomLeague = ['premier_league', 'la_liga', 'serie_a', 'bundesliga', 'ligue_1'];
    const leagueId = randomLeague[Math.floor(Math.random() * randomLeague.length)];
    const leagueClubs = getClubsByLeague(leagueId);
    const randomClub = leagueClubs[Math.floor(Math.random() * leagueClubs.length)];
    if (!pool.find(c => c.id === randomClub.id)) {
      pool.push(randomClub);
    }
  }

  // Shuffle and take exactly the needed number
  const selected = pool.sort(() => Math.random() - 0.5).slice(0, neededClubs);
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const fixtures: ContinentalFixture[] = [];
  const standings: ContinentalGroupStanding[] = [];

  // Distribute clubs into groups of 4
  for (let g = 0; g < 8; g++) {
    const groupClubs = selected.slice(g * 4, (g + 1) * 4);
    const group = groups[g];

    // Generate standings entries
    for (const club of groupClubs) {
      standings.push({
        clubId: club.id,
        clubName: club.shortName,
        competition,
        group,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }

    // Generate round-robin fixtures (each team plays others home and away = 6 matches)
    for (let i = 0; i < groupClubs.length; i++) {
      for (let j = i + 1; j < groupClubs.length; j++) {
        // Home leg
        fixtures.push({
          id: generateId(),
          homeClubId: groupClubs[i].id,
          awayClubId: groupClubs[j].id,
          competition,
          stage: 'group',
          group,
          matchday: (i + j) % 6 + 1,
          season,
          played: false,
        });
        // Away leg
        fixtures.push({
          id: generateId(),
          homeClubId: groupClubs[j].id,
          awayClubId: groupClubs[i].id,
          competition,
          stage: 'group',
          group,
          matchday: ((i + j + 3) % 6) + 1,
          season,
          played: false,
        });
      }
    }
  }

  return { fixtures, standings };
}

// --- Update continental group standings after a match ---
export function updateContinentalStandings(
  standings: ContinentalGroupStanding[],
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number
): ContinentalGroupStanding[] {
  const updated = standings.map(s => ({ ...s }));
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

// --- Simulate a continental match ---
export function simulateContinentalMatch(
  homeClub: Club,
  awayClub: Club
): { homeScore: number; awayScore: number } {
  const homeStrength = homeClub.squadQuality + randomBetween(-8, 8) + 3;
  const awayStrength = awayClub.squadQuality + randomBetween(-8, 8);

  const homeExpected = Math.max(0.3, (homeStrength - awayStrength) / 25 + 1.2);
  const awayExpected = Math.max(0.3, (awayStrength - homeStrength) / 25 + 0.9);

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

// --- Get top 2 from each group (qualified for knockout) ---
export function getQualifiedFromGroups(
  standings: ContinentalGroupStanding[],
  competition: ContinentalCompetition
): string[] {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const qualified: string[] = [];

  for (const group of groups) {
    const groupStandings = standings
      .filter(s => s.competition === competition && s.group === group)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aGD = a.goalsFor - a.goalsAgainst;
        const bGD = b.goalsFor - b.goalsAgainst;
        if (bGD !== aGD) return bGD - aGD;
        return b.goalsFor - a.goalsFor;
      });
    
    // Top 2 qualify
    for (let i = 0; i < Math.min(2, groupStandings.length); i++) {
      qualified.push(groupStandings[i].clubId);
    }
  }

  return qualified;
}

// --- Generate knockout stage fixtures ---
export function generateKnockoutFixtures(
  qualifiedClubIds: string[],
  competition: ContinentalCompetition,
  stage: ContinentalFixture['stage'],
  season: number
): ContinentalFixture[] {
  const fixtures: ContinentalFixture[] = [];
  const shuffled = [...qualifiedClubIds].sort(() => Math.random() - 0.5);
  const matchCount = Math.floor(shuffled.length / 2);

  const roundNumber = stage === 'round_of_16' ? 1 :
    stage === 'quarter_final' ? 2 :
    stage === 'semi_final' ? 3 : 4;

  for (let i = 0; i < matchCount; i++) {
    fixtures.push({
      id: generateId(),
      homeClubId: shuffled[i],
      awayClubId: shuffled[shuffled.length - 1 - i],
      competition,
      stage,
      matchday: roundNumber,
      season,
      played: false,
    });
  }

  return fixtures;
}

// --- Sort group standings ---
export function sortGroupStandings(standings: ContinentalGroupStanding[]): ContinentalGroupStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  });
}

// --- Get competition display name ---
export function getContinentalName(competition: ContinentalCompetition): { name: string; emoji: string } {
  switch (competition) {
    case 'champions_league': return { name: 'Champions League', emoji: '⭐' };
    case 'europa_league': return { name: 'Europa League', emoji: '🟠' };
  }
}

// --- Get stage display name ---
export function getStageName(stage: ContinentalFixture['stage']): string {
  switch (stage) {
    case 'group': return 'Group Stage';
    case 'round_of_16': return 'Round of 16';
    case 'quarter_final': return 'Quarter-Final';
    case 'semi_final': return 'Semi-Final';
    case 'final': return 'Final';
  }
}
