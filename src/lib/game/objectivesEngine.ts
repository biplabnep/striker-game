// ============================================================
// Elite Striker - Season Objectives & Awards Engine
// Generates board expectations, personal targets, and season awards
// ============================================================

import { Club, Player, SeasonObjective, SeasonObjectivesSet, SeasonAward, LeagueStanding } from './types';
import { generateId } from './gameUtils';

// ============================================================
// Board Expectation Level
// ============================================================
export function getBoardExpectation(club: Club): SeasonObjectivesSet['boardExpectation'] {
  if (club.reputation >= 90) return 'title_challenge';
  if (club.reputation >= 80) return 'top_four';
  if (club.reputation >= 65) return 'mid_table';
  return 'survival';
}

// ============================================================
// Generate Season Objectives
// ============================================================
export function generateSeasonObjectives(
  club: Club,
  player: Player,
  season: number,
  totalMatchdays: number
): SeasonObjectivesSet {
  const expectation = getBoardExpectation(club);
  const objectives: SeasonObjective[] = [];

  // --- Board Objectives (club performance based) ---
  const boardTargetPosition = {
    title_challenge: 1,
    top_four: 4,
    mid_table: 10,
    survival: 17,
  };

  objectives.push({
    id: generateId(),
    category: 'board',
    title: 'League Position',
    description: `Finish ${expectation === 'title_challenge' ? '1st' : expectation === 'top_four' ? 'top 4' : expectation === 'mid_table' ? 'top 10' : 'above 17th'}`,
    target: boardTargetPosition[expectation],
    current: 20, // will be updated during season
    status: 'in_progress',
    reward: expectation === 'title_challenge' ? 50000 : expectation === 'top_four' ? 30000 : expectation === 'mid_table' ? 15000 : 10000,
    icon: '🏆',
    deadline: 'season_end',
  });

  // Board: Minimum wins target
  const winsTarget = {
    title_challenge: Math.floor(totalMatchdays * 0.7),
    top_four: Math.floor(totalMatchdays * 0.55),
    mid_table: Math.floor(totalMatchdays * 0.4),
    survival: Math.floor(totalMatchdays * 0.28),
  };

  objectives.push({
    id: generateId(),
    category: 'board',
    title: 'Minimum Wins',
    description: `Win at least ${winsTarget[expectation]} league matches`,
    target: winsTarget[expectation],
    current: 0,
    status: 'in_progress',
    reward: 20000,
    icon: '✅',
    deadline: 'season_end',
  });

  // --- Personal Objectives (player performance based) ---
  const position = player.position;
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(position);
  const isMidfielder = ['CM', 'CDM'].includes(position);
  const isDefender = ['CB', 'LB', 'RB'].includes(position);
  const isGK = position === 'GK';

  // Goals target
  if (isAttacker) {
    objectives.push({
      id: generateId(),
      category: 'personal',
      title: 'Goal Target',
      description: `Score at least ${player.squadStatus === 'starter' ? 12 : 8} goals this season`,
      target: player.squadStatus === 'starter' ? 12 : 8,
      current: player.seasonStats.goals,
      status: 'in_progress',
      reward: 15000,
      icon: '⚽',
      deadline: 'season_end',
    });
  } else if (isMidfielder) {
    objectives.push({
      id: generateId(),
      category: 'personal',
      title: 'Goal Contributions',
      description: `Achieve at least ${player.squadStatus === 'starter' ? 15 : 10} goals + assists`,
      target: player.squadStatus === 'starter' ? 15 : 10,
      current: player.seasonStats.goals + player.seasonStats.assists,
      status: 'in_progress',
      reward: 15000,
      icon: '🎯',
      deadline: 'season_end',
    });
  } else if (isDefender || isGK) {
    objectives.push({
      id: generateId(),
      category: 'personal',
      title: 'Clean Sheet Target',
      description: `Keep at least ${player.squadStatus === 'starter' ? 10 : 6} clean sheets`,
      target: player.squadStatus === 'starter' ? 10 : 6,
      current: player.seasonStats.cleanSheets,
      status: 'in_progress',
      reward: 15000,
      icon: '🛡️',
      deadline: 'season_end',
    });
  }

  // Appearances target
  const appsTarget = player.squadStatus === 'starter' ? Math.floor(totalMatchdays * 0.8) : Math.floor(totalMatchdays * 0.5);
  objectives.push({
    id: generateId(),
    category: 'personal',
    title: 'Appearances',
    description: `Make at least ${appsTarget} appearances this season`,
    target: appsTarget,
    current: player.seasonStats.appearances,
    status: 'in_progress',
    reward: 10000,
    icon: '👕',
    deadline: 'season_end',
  });

  // Average rating target
  const ratingTarget = player.squadStatus === 'starter' ? 6.8 : 6.5;
  objectives.push({
    id: generateId(),
    category: 'personal',
    title: 'Performance Rating',
    description: `Maintain an average rating of ${ratingTarget}+`,
    target: ratingTarget * 10, // stored as integer (68 = 6.8)
    current: Math.round(player.seasonStats.averageRating * 10),
    status: 'in_progress',
    reward: 12000,
    icon: '⭐',
    deadline: 'season_end',
  });

  // --- Bonus Objectives (stretch goals) ---
  objectives.push({
    id: generateId(),
    category: 'bonus',
    title: 'Hat-Trick Hero',
    description: 'Score a hat-trick in any match',
    target: 1,
    current: 0,
    status: 'in_progress',
    reward: 25000,
    icon: '🎩',
    deadline: 'season_end',
  });

  objectives.push({
    id: generateId(),
    category: 'bonus',
    title: 'Fan Favorite',
    description: 'Reach 80+ reputation this season',
    target: 80,
    current: player.reputation,
    status: player.reputation >= 80 ? 'completed' : 'in_progress',
    reward: 20000,
    icon: '❤️',
    deadline: 'season_end',
  });

  objectives.push({
    id: generateId(),
    category: 'bonus',
    title: 'Iron Man',
    description: 'Stay injury-free for the entire season',
    target: 1,
    current: player.injuryHistory.filter(i => i.seasonOccured === season).length === 0 ? 1 : 0,
    status: player.injuryHistory.filter(i => i.seasonOccured === season).length === 0 ? 'in_progress' : 'failed',
    reward: 18000,
    icon: '💪',
    deadline: 'season_end',
  });

  return {
    season,
    objectives,
    boardExpectation: expectation,
    bonusPaid: false,
  };
}

// ============================================================
// Update Objectives Progress
// ============================================================
export function updateObjectivesProgress(
  objectivesSet: SeasonObjectivesSet,
  player: Player,
  leagueTable: LeagueStanding[],
  playerClubId: string,
  currentWeek: number,
  totalMatchdays: number
): SeasonObjectivesSet {
  const updatedObjectives = objectivesSet.objectives.map(obj => {
    if (obj.status !== 'in_progress') return obj;

    const updated = { ...obj };

    switch (obj.title) {
      case 'League Position': {
        const clubEntry = leagueTable.find(e => e.clubId === playerClubId);
        if (clubEntry) {
          // Position = index + 1 in sorted table
          const position = leagueTable
            .slice()
            .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
            .findIndex(e => e.clubId === playerClubId) + 1;
          updated.current = position;
          // For position, lower is better
          if (currentWeek >= totalMatchdays) {
            updated.status = position <= updated.target ? 'completed' : 'failed';
          }
        }
        break;
      }
      case 'Minimum Wins': {
        const clubEntry = leagueTable.find(e => e.clubId === playerClubId);
        if (clubEntry) {
          updated.current = clubEntry.won;
          if (clubEntry.won >= updated.target) {
            updated.status = 'completed';
          } else if (currentWeek >= totalMatchdays) {
            updated.status = 'failed';
          }
        }
        break;
      }
      case 'Goal Target':
        updated.current = player.seasonStats.goals;
        if (player.seasonStats.goals >= updated.target) updated.status = 'completed';
        else if (currentWeek >= totalMatchdays) updated.status = 'failed';
        break;
      case 'Goal Contributions':
        updated.current = player.seasonStats.goals + player.seasonStats.assists;
        if (updated.current >= updated.target) updated.status = 'completed';
        else if (currentWeek >= totalMatchdays) updated.status = 'failed';
        break;
      case 'Clean Sheet Target':
        updated.current = player.seasonStats.cleanSheets;
        if (player.seasonStats.cleanSheets >= updated.target) updated.status = 'completed';
        else if (currentWeek >= totalMatchdays) updated.status = 'failed';
        break;
      case 'Appearances':
        updated.current = player.seasonStats.appearances;
        if (player.seasonStats.appearances >= updated.target) updated.status = 'completed';
        else if (currentWeek >= totalMatchdays) updated.status = 'failed';
        break;
      case 'Performance Rating':
        updated.current = Math.round(player.seasonStats.averageRating * 10);
        if (player.seasonStats.appearances >= 5 && player.seasonStats.averageRating >= updated.target / 10) {
          updated.status = 'completed';
        } else if (currentWeek >= totalMatchdays && player.seasonStats.appearances >= 5) {
          updated.status = player.seasonStats.averageRating >= updated.target / 10 ? 'completed' : 'failed';
        }
        break;
      case 'Hat-Trick Hero':
        // Checked in match result processing
        break;
      case 'Fan Favorite':
        updated.current = player.reputation;
        if (player.reputation >= updated.target) updated.status = 'completed';
        else if (currentWeek >= totalMatchdays) updated.status = 'failed';
        break;
      case 'Iron Man':
        // Already set at generation time, no weekly update needed
        break;
    }

    return updated;
  });

  return { ...objectivesSet, objectives: updatedObjectives };
}

// ============================================================
// Calculate Objective Bonus Payout
// ============================================================
export function calculateObjectiveBonus(objectivesSet: SeasonObjectivesSet): number {
  return objectivesSet.objectives
    .filter(obj => obj.status === 'completed')
    .reduce((sum, obj) => sum + obj.reward, 0);
}

// ============================================================
// Generate Season Awards
// ============================================================
export function generateSeasonAwards(
  season: number,
  player: Player,
  playerClub: Club,
  leagueTable: LeagueStanding[],
  availableClubs: Club[]
): SeasonAward[] {
  const awards: SeasonAward[] = [];

  // Player of the Season (based on reputation and form)
  const playerOfSeasonName = player.seasonStats.appearances >= 10 && player.seasonStats.averageRating >= 7.0
    ? player.name
    : `${playerClub.shortName} Star Player`;
  const playerOfSeasonClub = playerClub.name;

  awards.push({
    id: generateId(),
    name: 'Player of the Season',
    category: 'player_of_year',
    season,
    winner: player.seasonStats.averageRating >= 7.5 ? player.name : playerOfSeasonName,
    winnerClub: playerOfSeasonClub,
    stats: player.seasonStats.appearances >= 10
      ? `${player.seasonStats.averageRating.toFixed(1)} avg rating`
      : 'Outstanding performer',
    icon: '🏆',
    isPlayer: player.seasonStats.averageRating >= 7.5,
  });

  // Young Player of the Season
  if (player.age <= 21 && player.seasonStats.appearances >= 10) {
    awards.push({
      id: generateId(),
      name: 'Young Player of the Season',
      category: 'young_player',
      season,
      winner: player.name,
      winnerClub: playerClub.name,
      stats: `${player.seasonStats.averageRating.toFixed(1)} avg, ${player.seasonStats.goals} goals`,
      icon: '🌟',
      isPlayer: true,
    });
  }

  // Golden Boot (top scorer)
  if (player.seasonStats.goals >= 10) {
    awards.push({
      id: generateId(),
      name: 'Golden Boot',
      category: 'top_scorer',
      season,
      winner: player.name,
      winnerClub: playerClub.name,
      stats: `${player.seasonStats.goals} goals`,
      icon: '👟',
      isPlayer: true,
    });
  }

  // Playmaker Award (top assists)
  if (player.seasonStats.assists >= 10) {
    awards.push({
      id: generateId(),
      name: 'Playmaker Award',
      category: 'top_assist',
      season,
      winner: player.name,
      winnerClub: playerClub.name,
      stats: `${player.seasonStats.assists} assists`,
      icon: '🎯',
      isPlayer: true,
    });
  }

  // Team of the Season (player included if rating high enough)
  if (player.seasonStats.appearances >= 15 && player.seasonStats.averageRating >= 7.0) {
    awards.push({
      id: generateId(),
      name: 'Team of the Season',
      category: 'team_of_season',
      season,
      winner: player.name,
      winnerClub: playerClub.name,
      stats: `${player.seasonStats.averageRating.toFixed(1)} avg rating`,
      icon: '⭐',
      isPlayer: true,
    });
  }

  return awards;
}

// ============================================================
// Generate Monthly Awards
// ============================================================
export function generateMonthlyAward(
  season: number,
  month: number,
  player: Player,
  playerClub: Club
): SeasonAward | null {
  // Only award if player has enough appearances and good rating
  if (player.seasonStats.appearances < 3 || player.seasonStats.averageRating < 7.0) {
    return null;
  }

  // 30% chance player wins if eligible (otherwise NPC wins)
  const playerWins = Math.random() < 0.3;

  return {
    id: generateId(),
    name: `Player of the Month`,
    category: 'player_of_month',
    season,
    month,
    winner: playerWins ? player.name : `${playerClub.shortName} teammate`,
    winnerClub: playerClub.name,
    stats: playerWins
      ? `${player.seasonStats.averageRating.toFixed(1)} avg rating this month`
      : 'Consistent performances',
    icon: '🏅',
    isPlayer: playerWins,
  };
}

// ============================================================
// Board Expectation Label
// ============================================================
export function getBoardExpectationLabel(expectation: SeasonObjectivesSet['boardExpectation']): string {
  switch (expectation) {
    case 'title_challenge': return 'Title Challenge';
    case 'top_four': return 'Top Four';
    case 'mid_table': return 'Mid-Table';
    case 'survival': return 'Survival';
  }
}

export function getBoardExpectationColor(expectation: SeasonObjectivesSet['boardExpectation']): string {
  switch (expectation) {
    case 'title_challenge': return 'text-amber-400';
    case 'top_four': return 'text-emerald-400';
    case 'mid_table': return 'text-cyan-400';
    case 'survival': return 'text-red-400';
  }
}

export function getBoardExpectationBg(expectation: SeasonObjectivesSet['boardExpectation']): string {
  switch (expectation) {
    case 'title_challenge': return 'bg-amber-500/10 border-amber-500/20';
    case 'top_four': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'mid_table': return 'bg-cyan-500/10 border-cyan-500/20';
    case 'survival': return 'bg-red-500/10 border-red-500/20';
  }
}
