'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/lib/game/types';
import { LEAGUES } from '@/lib/game/clubsData';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  TrendingUp,
  Share2,
  MessageCircle,
  Eye,
  Clock,
  Filter,
  Flame,
  ArrowUpDown,
  RefreshCw,
  Trophy,
  Users,
  Zap,
  Globe,
  Heart,
  UserCircle,
  Shield,
  Sprout,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type NewsCategory =
  | 'transfer'
  | 'match'
  | 'player'
  | 'league'
  | 'international'
  | 'youth'
  | 'social'
  | 'manager';

interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  source: string;
  timeAgo: string;
  reads: string;
  reactions: string;
  isHot: boolean;
  hasImage: boolean;
  imageIcon: string;
}

type FilterTab = 'all' | 'transfer' | 'match' | 'player' | 'league';

// ============================================================
// Constants
// ============================================================

const NEWS_SOURCES = [
  'BBC Sport',
  'Sky Sports',
  'The Athletic',
  'ESPN FC',
  'Goal.com',
  'Marca',
  'L\'Equipe',
  'Gazzetta dello Sport',
  'Kicker',
  'The Guardian',
  'Football Italia',
  'Bundesliga.com',
  'Premier League.com',
  'ESPN',
  'CBS Sports',
  'The Telegraph',
  'BBC Radio 5 Live',
  'Football Daily',
];

const TIME_AGOS = [
  '1h ago',
  '2h ago',
  '3h ago',
  '5h ago',
  '8h ago',
  '12h ago',
  '1d ago',
  '2d ago',
  '3d ago',
  '4d ago',
  '5d ago',
  '1w ago',
];

const CATEGORY_CONFIG: Record<NewsCategory, {
  label: string;
  badgeColor: string;
  badgeTextColor: string;
  iconBg: string;
  icon: React.ReactNode;
  imageBg: string;
}> = {
  transfer: {
    label: 'Transfer',
    badgeColor: 'bg-sky-500/15 border-sky-500/30',
    badgeTextColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    imageBg: 'bg-sky-500/10',
    icon: <ArrowUpDown className="h-3.5 w-3.5 text-sky-400" />,
  },
  match: {
    label: 'Match',
    badgeColor: 'bg-emerald-500/15 border-emerald-500/30',
    badgeTextColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    imageBg: 'bg-emerald-500/10',
    icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" />,
  },
  player: {
    label: 'Player',
    badgeColor: 'bg-amber-500/15 border-amber-500/30',
    badgeTextColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    imageBg: 'bg-amber-500/10',
    icon: <UserCircle className="h-3.5 w-3.5 text-amber-400" />,
  },
  league: {
    label: 'League',
    badgeColor: 'bg-slate-500/15 border-slate-500/30',
    badgeTextColor: 'text-slate-400',
    iconBg: 'bg-slate-500/15',
    imageBg: 'bg-slate-500/10',
    icon: <TrendingUp className="h-3.5 w-3.5 text-slate-400" />,
  },
  international: {
    label: 'International',
    badgeColor: 'bg-purple-500/15 border-purple-500/30',
    badgeTextColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    imageBg: 'bg-purple-500/10',
    icon: <Globe className="h-3.5 w-3.5 text-purple-400" />,
  },
  youth: {
    label: 'Youth',
    badgeColor: 'bg-cyan-500/15 border-cyan-500/30',
    badgeTextColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    imageBg: 'bg-cyan-500/10',
    icon: <Sprout className="h-3.5 w-3.5 text-cyan-400" />,
  },
  social: {
    label: 'Social',
    badgeColor: 'bg-pink-500/15 border-pink-500/30',
    badgeTextColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    imageBg: 'bg-pink-500/10',
    icon: <Heart className="h-3.5 w-3.5 text-pink-400" />,
  },
  manager: {
    label: 'Manager',
    badgeColor: 'bg-violet-500/15 border-violet-500/30',
    badgeTextColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    imageBg: 'bg-violet-500/10',
    icon: <Shield className="h-3.5 w-3.5 text-violet-400" />,
  },
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'match', label: 'Results' },
  { value: 'player', label: 'Player' },
  { value: 'league', label: 'League' },
];

// ============================================================
// Helpers
// ============================================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatReads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K reads`;
  return `${n} reads`;
}

function formatReactions(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function getLeagueName(leagueId: string): string {
  return LEAGUES.find(l => l.id === leagueId)?.name ?? 'the league';
}

function getPositionLabel(position: string): string {
  const map: Record<string, string> = {
    GK: 'goalkeeper',
    CB: 'centre-back',
    LB: 'left-back',
    RB: 'right-back',
    CDM: 'defensive midfielder',
    CM: 'midfielder',
    CAM: 'attacking midfielder',
    LW: 'left winger',
    RW: 'right winger',
    ST: 'striker',
  };
  return map[position] ?? 'player';
}

// ============================================================
// Big clubs for transfer rumors (not the player's current club)
// ============================================================

const BIG_CLUBS = [
  'Real Madrid', 'FC Barcelona', 'Manchester City', 'Bayern Munich',
  'Paris Saint-Germain', 'Liverpool', 'Manchester United', 'Chelsea',
  'Inter Milan', 'Juventus', 'AC Milan', 'Borussia Dortmund',
  'Atletico Madrid', 'SSC Napoli', 'Tottenham Hotspur', 'Arsenal',
  'AS Monaco', 'Bayer Leverkusen', 'Olympique de Marseille',
  'Newcastle United', 'Aston Villa',
];

function getRivalClubs(currentClubName: string): string[] {
  return BIG_CLUBS.filter(c => c !== currentClubName);
}

// ============================================================
// News Generation Functions (by category)
// ============================================================

function generateTransferNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { player, currentClub } = state;
  const rivals = getRivalClubs(currentClub.name);
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => NewsItem)[] = [
    // Transfer interest in the player
    () => {
      const club = randomFrom(rivals);
      const isHot = player.reputation > 60;
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${club} monitoring ${currentClub.name} star`,
        summary: `Sources close to ${club} have confirmed the club is tracking ${player.name}'s progress. The ${getPositionLabel(player.position)} has been impressive this season, attracting interest from several top European sides.`,
        source: randomFrom(['Sky Sports', 'The Athletic', 'ESPN FC', 'Goal.com']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 6)),
        reads: formatReads(randomBetween(800, 5000)),
        reactions: formatReactions(randomBetween(200, 2000)),
        isHot,
        hasImage: true,
        imageIcon: 'ArrowUpDown',
      };
    },
    () => {
      const club = randomFrom(rivals);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${player.name} emerges as ${club} target`,
        summary: `${club} have added ${player.name} to their shortlist of potential signings. The ${currentClub.name} youngster is valued highly after a string of strong performances.`,
        source: randomFrom(['Marca', 'BBC Sport', 'L\'Equipe', 'Football Italia']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 8)),
        reads: formatReads(randomBetween(1200, 8000)),
        reactions: formatReactions(randomBetween(300, 3000)),
        isHot: player.reputation > 50,
        hasImage: true,
        imageIcon: 'ArrowUpDown',
      };
    },
    // Club signings
    () => {
      const fromLeague = randomFrom(LEAGUES);
      const toLeague = randomFrom(LEAGUES.filter(l => l.id !== fromLeague.id));
      const fee = randomBetween(20, 120);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${fee}M€ deal: Star completes ${fromLeague.name} to ${toLeague.name} move`,
        summary: `A major transfer has been completed as a key player moves from the ${fromLeague.name} to the ${toLeague.name}. The deal is reported to be worth around €${fee}M, making it one of the biggest of the window.`,
        source: randomFrom(['Sky Sports', 'BBC Sport', 'ESPN FC']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
        reads: formatReads(randomBetween(3000, 15000)),
        reactions: formatReactions(randomBetween(1000, 8000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'ArrowUpDown',
      };
    },
    // Loan news
    () => {
      const club = randomFrom(rivals);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${club} considering loan bid for ${player.name}`,
        summary: `${club} are weighing up a season-long loan move for ${player.name} as they look to bolster their squad depth. ${currentClub.name} are reportedly open to the move.`,
        source: randomFrom(['The Athletic', 'Goal.com', 'Kicker', 'Gazzetta dello Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 10)),
        reads: formatReads(randomBetween(500, 3000)),
        reactions: formatReactions(randomBetween(150, 1200)),
        isHot: false,
        hasImage: false,
        imageIcon: 'ArrowUpDown',
      };
    },
    // Release clause
    () => {
      const amount = player.marketValue > 0
        ? Math.round(player.marketValue * 1.5 / 1000000)
        : randomBetween(15, 60);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${player.name}'s release clause revealed: €${amount}M`,
        summary: `Details of ${player.name}'s contract at ${currentClub.name} have emerged, with the ${getPositionLabel(player.position)} having a release clause of approximately €${amount}M. Several clubs are monitoring the situation.`,
        source: randomFrom(['The Athletic', 'Marca', 'Football Italia', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(3, 9)),
        reads: formatReads(randomBetween(2000, 9000)),
        reactions: formatReactions(randomBetween(500, 4000)),
        isHot: player.reputation > 55,
        hasImage: false,
        imageIcon: 'ArrowUpDown',
      };
    },
    // Generic transfer window news
    () => {
      const league = randomFrom(LEAGUES);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${league.name} clubs spend record €${randomBetween(400, 1200)}M in transfer window`,
        summary: `Clubs across the ${league.name} have broken spending records in the latest transfer window, with several high-profile deals completed on deadline day.`,
        source: randomFrom(NEWS_SOURCES),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(4000, 20000)),
        reactions: formatReactions(randomBetween(2000, 10000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'ArrowUpDown',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateMatchNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { player, currentClub, recentResults, leagueTable } = state;
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => NewsItem)[] = [
    // Player scored recently
    () => {
      const result = recentResults[0];
      if (!result) {
        return {
          id: generateId(),
          category: 'match',
          headline: `${currentClub.name} prepare for crucial ${leagueName} clash`,
          summary: `${currentClub.name} are gearing up for an important ${leagueName} fixture this weekend. The squad has been working hard in training as they aim to collect all three points.`,
          source: randomFrom(NEWS_SOURCES),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
          reads: formatReads(randomBetween(600, 2500)),
          reactions: formatReactions(randomBetween(100, 800)),
          isHot: false,
          hasImage: true,
          imageIcon: 'Trophy',
        };
      }
      const opponent = result.homeClub.id === currentClub.id
        ? result.awayClub
        : result.homeClub;
      const isWin = (result.homeClub.id === currentClub.id && result.homeScore > result.awayScore)
        || (result.awayClub.id === currentClub.id && result.awayScore > result.homeScore);
      const goals = result.playerGoals || 0;
      const assists = result.playerAssists || 0;

      let headline: string;
      if (goals >= 2) {
        headline = `${player.name}'s brace seals victory for ${currentClub.name}`;
      } else if (goals === 1) {
        headline = `${player.name} nets winner as ${currentClub.name} beat ${opponent.name}`;
      } else if (assists > 0) {
        headline = `${player.name} provides assist in ${currentClub.name}'s ${isWin ? 'win' : 'draw'} over ${opponent.name}`;
      } else if (isWin) {
        headline = `${currentClub.name} secure vital win against ${opponent.name}`;
      } else {
        headline = `${currentClub.name} held by ${opponent.name} in ${leagueName}`;
      }

      return {
        id: generateId(),
        category: 'match',
        headline,
        summary: `${currentClub.name} ${result.homeClub.id === currentClub.id ? result.homeScore : result.awayScore}-${result.homeClub.id === currentClub.id ? result.awayScore : result.homeScore} ${opponent.name}. ${player.name} ${goals > 0 ? `scored ${goals} goal${goals > 1 ? 's' : ''}` : assists > 0 ? `provided ${assists} assist${assists > 1 ? 's' : ''}` : 'featured'} in an entertaining encounter.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'ESPN FC']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 3)),
        reads: formatReads(randomBetween(2000, 12000)),
        reactions: formatReactions(randomBetween(500, 5000)),
        isHot: goals > 0 || isWin,
        hasImage: true,
        imageIcon: 'Trophy',
      };
    },
    // League standings race
    () => {
      const playerStanding = leagueTable.find(s => s.clubId === currentClub.id);
      const position = playerStanding ? leagueTable.indexOf(playerStanding) + 1 : 10;
      const leader = leagueTable[0];

      if (position <= 4) {
        return {
          id: generateId(),
          category: 'match',
          headline: `${currentClub.name} maintain ${position === 1 ? 'title push' : position <= 3 ? 'Champions League chase' : 'European challenge'}`,
          summary: `${currentClub.name} sit in ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} place in the ${leagueName} with ${playerStanding?.points ?? 0} points. The season is shaping up to be a memorable one for the club.`,
          source: randomFrom(['The Guardian', 'BBC Sport', 'Sky Sports']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
          reads: formatReads(randomBetween(1500, 8000)),
          reactions: formatReactions(randomBetween(400, 3000)),
          isHot: position <= 2,
          hasImage: true,
          imageIcon: 'Trophy',
        };
      }
      return {
        id: generateId(),
        category: 'match',
        headline: `${currentClub.name} fight for mid-table stability in ${leagueName}`,
        summary: `With the season past the halfway mark, ${currentClub.name} find themselves in ${position}th place. Manager and players remain focused on finishing as high as possible.`,
        source: randomFrom(['The Guardian', 'ESPN', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 7)),
        reads: formatReads(randomBetween(400, 2000)),
        reactions: formatReactions(randomBetween(100, 600)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Trophy',
      };
    },
    // Other league results
    () => {
      const league = randomFrom(LEAGUES.filter(l => l.id !== currentClub.league));
      const homeGoals = randomBetween(0, 5);
      const awayGoals = randomBetween(0, 5);
      const homeClub = randomFrom(BIG_CLUBS);
      const awayClub = randomFrom(BIG_CLUBS.filter(c => c !== homeClub));
      return {
        id: generateId(),
        category: 'match',
        headline: `${homeGoals}-${awayGoals}: Dramatic encounter in ${league.name}`,
        summary: `An action-packed ${league.name} match ended ${homeGoals}-${awayGoals} with both sides creating numerous chances. The result has implications at both ends of the table.`,
        source: randomFrom(NEWS_SOURCES),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
        reads: formatReads(randomBetween(800, 5000)),
        reactions: formatReactions(randomBetween(200, 2000)),
        isHot: Math.abs(homeGoals - awayGoals) >= 3,
        hasImage: true,
        imageIcon: 'Trophy',
      };
    },
    // Player rating
    () => {
      const rating = player.seasonStats.averageRating || player.form;
      if (rating >= 7.5) {
        return {
          id: generateId(),
          category: 'match',
          headline: `${player.name} earns man of the match with stellar display`,
          summary: `${player.name} delivered a masterclass performance, earning a match rating of ${rating.toFixed(1)}. Fans and pundits alike were full of praise for the ${currentClub.name} ${getPositionLabel(player.position)}.`,
          source: randomFrom(['BBC Sport', 'Sky Sports', 'The Athletic']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 3)),
          reads: formatReads(randomBetween(1500, 6000)),
          reactions: formatReactions(randomBetween(400, 2500)),
          isHot: true,
          hasImage: true,
          imageIcon: 'Trophy',
        };
      }
      return {
        id: generateId(),
        category: 'match',
        headline: `${currentClub.name} edge past opponents in tight ${leagueName} contest`,
        summary: `A hard-fought ${leagueName} match saw ${currentClub.name} come out on top in what was a closely contested affair. Both sides had chances but it was the home side who were more clinical.`,
        source: randomFrom(['BBC Sport', 'ESPN FC', 'The Telegraph']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 6)),
        reads: formatReads(randomBetween(600, 3000)),
        reactions: formatReactions(randomBetween(150, 1000)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Trophy',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generatePlayerNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { player, currentClub } = state;

  const templates: (() => NewsItem)[] = [
    // High form praise
    () => {
      if (player.form >= 7.5) {
        return {
          id: generateId(),
          category: 'player',
          headline: `${player.name} among the ${currentClub.league === 'premier_league' ? 'Premier League' : getLeagueName(currentClub.league)}'s elite performers`,
          summary: `Statistics show ${player.name} has been one of the standout players this season. With ${player.seasonStats.goals} goals and ${player.seasonStats.assists} assists, the ${getPositionLabel(player.position)} is catching the eye of top clubs.`,
          source: randomFrom(['The Athletic', 'BBC Sport', 'ESPN FC']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
          reads: formatReads(randomBetween(2000, 10000)),
          reactions: formatReactions(randomBetween(500, 4000)),
          isHot: player.form >= 8,
          hasImage: true,
          imageIcon: 'UserCircle',
        };
      }
      return {
        id: generateId(),
        category: 'player',
        headline: `Questions raised over ${player.name}'s recent form`,
        summary: `${player.name} has struggled for consistency in recent weeks, with an average rating of ${player.form.toFixed(1)}. The ${currentClub.name} ${getPositionLabel(player.position)} will be hoping to rediscover their best form soon.`,
        source: randomFrom(['Sky Sports', 'BBC Sport', 'The Telegraph']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 6)),
        reads: formatReads(randomBetween(1000, 5000)),
        reactions: formatReactions(randomBetween(300, 2000)),
        isHot: false,
        hasImage: false,
        imageIcon: 'UserCircle',
      };
    },
    // Stats milestone
    () => {
      const { goals, assists, appearances } = player.seasonStats;
      const stat = goals > assists ? goals : assists;
      const statName = goals > assists ? 'goals' : 'assists';
      if (stat > 0) {
        return {
          id: generateId(),
          category: 'player',
          headline: `${player.name} reaches ${stat} ${statName} milestone this season`,
          summary: `The ${currentClub.name} star has now contributed ${stat} ${statName} in ${appearances} appearances this term, establishing themselves as a key figure in the team's attacking setup.`,
          source: randomFrom(['Goal.com', 'ESPN FC', 'BBC Sport']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
          reads: formatReads(randomBetween(800, 4000)),
          reactions: formatReactions(randomBetween(200, 1500)),
          isHot: stat >= 10,
          hasImage: false,
          imageIcon: 'UserCircle',
        };
      }
      return {
        id: generateId(),
        category: 'player',
        headline: `${player.name} eager to make impact at ${currentClub.name}`,
        summary: `Young ${getPositionLabel(player.position)} ${player.name} is pushing for more first-team minutes at ${currentClub.name}. The academy graduate has been working hard in training to earn a starting spot.`,
        source: randomFrom(['The Athletic', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(300, 1500)),
        reactions: formatReactions(randomBetween(50, 500)),
        isHot: false,
        hasImage: false,
        imageIcon: 'UserCircle',
      };
    },
    // Overall rating
    () => {
      if (player.overall >= 80) {
        return {
          id: generateId(),
          category: 'player',
          headline: `${player.name} rated at ${player.overall} OVR — among the world's best`,
          summary: `At just ${player.age} years old, ${player.name} has developed into one of the highest-rated players in world football. Their overall rating of ${player.overall} reflects their incredible growth and consistency.`,
          source: randomFrom(['The Athletic', 'ESPN FC', 'Goal.com']),
          timeAgo: randomFrom(TIME_AGOS.slice(2, 8)),
          reads: formatReads(randomBetween(3000, 12000)),
          reactions: formatReactions(randomBetween(800, 5000)),
          isHot: player.overall >= 85,
          hasImage: true,
          imageIcon: 'UserCircle',
        };
      }
      return {
        id: generateId(),
        category: 'player',
        headline: `${player.name} shows promising development at ${currentClub.name}`,
        summary: `${player.name}, currently rated ${player.overall} overall, continues to develop at a steady pace. Scouts from across Europe have been impressed with the youngster's progress.`,
        source: randomFrom(['The Athletic', 'Kicker', 'Football Italia']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 7)),
        reads: formatReads(randomBetween(400, 2000)),
        reactions: formatReactions(randomBetween(100, 800)),
        isHot: false,
        hasImage: false,
        imageIcon: 'UserCircle',
      };
    },
    // Wonderkid narrative
    () => {
      return {
        id: generateId(),
        category: 'player',
        headline: `${player.name}: The next big thing in ${currentClub.country} football`,
        summary: `At just ${player.age} years old, ${player.name} is being hailed as one of the most exciting prospects in ${currentClub.country}. With a potential rating of ${player.potential}, the sky is the limit for this talented ${getPositionLabel(player.position)}.`,
        source: randomFrom(['Goal.com', 'ESPN FC', 'Marca']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 6)),
        reads: formatReads(randomBetween(1500, 7000)),
        reactions: formatReactions(randomBetween(400, 3000)),
        isHot: player.potential >= 85 && player.age <= 21,
        hasImage: true,
        imageIcon: 'UserCircle',
      };
    },
    // Injury concern
    () => {
      if (state.currentInjury) {
        return {
          id: generateId(),
          category: 'player',
          headline: `${player.name} sidelined with ${state.currentInjury.name}`,
          summary: `${currentClub.name} have confirmed that ${player.name} will be out for approximately ${state.currentInjury.weeksOut} weeks with a ${state.currentInjury.name.toLowerCase()}. The club's medical team is working on a recovery plan.`,
          source: randomFrom(['BBC Sport', 'Sky Sports', 'The Athletic']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 3)),
          reads: formatReads(randomBetween(2000, 10000)),
          reactions: formatReactions(randomBetween(500, 4000)),
          isHot: state.currentInjury.type === 'severe' || state.currentInjury.type === 'career_threatening',
          hasImage: false,
          imageIcon: 'UserCircle',
        };
      }
      return {
        id: generateId(),
        category: 'player',
        headline: `${player.name} injury-free and raring to go`,
        summary: `${currentClub.name} have been boosted by the news that ${player.name} is fully fit and available for selection. The ${getPositionLabel(player.position)} has been putting in extra hours on the training ground.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'ESPN FC']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(500, 2500)),
        reactions: formatReactions(randomBetween(100, 800)),
        isHot: false,
        hasImage: false,
        imageIcon: 'UserCircle',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateLeagueNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { currentClub, leagueTable } = state;
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => NewsItem)[] = [
    () => {
      const otherLeague = randomFrom(LEAGUES.filter(l => l.id !== currentClub.league));
      return {
        id: generateId(),
        category: 'league',
        headline: `${otherLeague.name} title race intensifies`,
        summary: `The ${otherLeague.name} title race is heating up as multiple clubs remain in contention. With several matches remaining, the battle for the championship looks set to go down to the wire.`,
        source: randomFrom(NEWS_SOURCES),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(2000, 10000)),
        reactions: formatReactions(randomBetween(500, 4000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'TrendingUp',
      };
    },
    () => {
      const otherLeague = randomFrom(LEAGUES.filter(l => l.id !== currentClub.league));
      return {
        id: generateId(),
        category: 'league',
        headline: `Relegation battle heats up at the bottom of ${otherLeague.name}`,
        summary: `Several clubs are locked in a desperate fight for survival in the ${otherLeague.name}. The bottom three are separated by just a handful of points with crucial matches ahead.`,
        source: randomFrom(['BBC Sport', 'The Guardian', 'ESPN']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 6)),
        reads: formatReads(randomBetween(800, 4000)),
        reactions: formatReactions(randomBetween(200, 1500)),
        isHot: false,
        hasImage: false,
        imageIcon: 'TrendingUp',
      };
    },
    () => {
      const leader = leagueTable[0];
      return {
        id: generateId(),
        category: 'league',
        headline: `${leagueName} standings: ${leader?.clubName ?? currentClub.name} lead the pack`,
        summary: `The latest ${leagueName} standings show a tight race at the top with several teams in contention. ${currentClub.name} currently sit in ${leagueTable.findIndex(s => s.clubId === currentClub.id) + 1}th place with ${leagueTable.find(s => s.clubId === currentClub.id)?.points ?? 0} points.`,
        source: randomFrom(['Premier League.com', 'BBC Sport', 'Sky Sports']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 3)),
        reads: formatReads(randomBetween(1500, 6000)),
        reactions: formatReactions(randomBetween(300, 2000)),
        isHot: false,
        hasImage: false,
        imageIcon: 'TrendingUp',
      };
    },
    () => {
      return {
        id: generateId(),
        category: 'league',
        headline: `${leagueName} top scorer race: Who will claim the golden boot?`,
        summary: `The race for the ${leagueName} golden boot is wide open with several strikers in contention. The current leader has ${randomBetween(12, 22)} goals, but the chasing pack are not far behind.`,
        source: randomFrom(['Goal.com', 'ESPN FC', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 7)),
        reads: formatReads(randomBetween(1000, 5000)),
        reactions: formatReactions(randomBetween(250, 2000)),
        isHot: false,
        hasImage: true,
        imageIcon: 'TrendingUp',
      };
    },
    // European qualification
    () => {
      const playerStanding = leagueTable.find(s => s.clubId === currentClub.id);
      const position = playerStanding ? leagueTable.indexOf(playerStanding) + 1 : 10;
      return {
        id: generateId(),
        category: 'league',
        headline: `Champions League spots up for grabs in ${leagueName}`,
        summary: `With the season entering its final stretch, the race for Champions League qualification in the ${leagueName} is intensifying. ${position <= 4 ? `${currentClub.name} are firmly in the mix.` : `${currentClub.name} will need a strong finish to have any chance.`}`,
        source: randomFrom(['The Athletic', 'BBC Sport', 'UEFA.com']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(2000, 8000)),
        reactions: formatReactions(randomBetween(400, 3000)),
        isHot: position <= 4,
        hasImage: true,
        imageIcon: 'TrendingUp',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateInternationalNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { player, currentClub, internationalCareer } = state;

  const templates: (() => NewsItem)[] = [
    () => {
      if (internationalCareer.caps > 0) {
        return {
          id: generateId(),
          category: 'international',
          headline: `${player.name} shines for ${player.nationality} in international duty`,
          summary: `${player.name} produced another impressive performance for ${player.nationality}, adding to their tally of ${internationalCareer.goals} international goals. The ${getPositionLabel(player.position)} is becoming a key figure for the national team.`,
          source: randomFrom(['BBC Sport', 'ESPN', 'Goal.com']),
          timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
          reads: formatReads(randomBetween(2000, 8000)),
          reactions: formatReactions(randomBetween(400, 3000)),
          isHot: internationalCareer.goals > 0,
          hasImage: true,
          imageIcon: 'Globe',
        };
      }
      return {
        id: generateId(),
        category: 'international',
        headline: `${player.nationality} call-up expected for rising star ${player.name}`,
        summary: `${player.name} is reportedly on the radar of the ${player.nationality} national team selectors. The ${currentClub.name} ${getPositionLabel(player.position)} has been in excellent form and could receive their first call-up soon.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'The Athletic']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(1000, 5000)),
        reactions: formatReactions(randomBetween(200, 1500)),
        isHot: player.reputation > 40,
        hasImage: false,
        imageIcon: 'Globe',
      };
    },
    () => {
      return {
        id: generateId(),
        category: 'international',
        headline: `${player.nationality} national team coach praises young talents`,
        summary: `The ${player.nationality} national team coach has spoken about the importance of developing young players for future tournaments. Several promising talents are being monitored ahead of the next international break.`,
        source: randomFrom(['BBC Sport', 'ESPN FC', 'The Guardian']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 6)),
        reads: formatReads(randomBetween(500, 2500)),
        reactions: formatReactions(randomBetween(100, 800)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Globe',
      };
    },
    () => {
      const tournaments = ['World Cup', 'European Championship', 'Copa America', 'Nations League'];
      const tournament = randomFrom(tournaments);
      return {
        id: generateId(),
        category: 'international',
        headline: `${tournament} qualifying draw: Groups revealed`,
        summary: `The draw for the upcoming ${tournament} qualifying campaign has taken place, with several intriguing groups emerging. National teams will begin their campaigns in the coming months.`,
        source: randomFrom(['BBC Sport', 'ESPN', 'FIFA.com']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 8)),
        reads: formatReads(randomBetween(3000, 15000)),
        reactions: formatReactions(randomBetween(800, 5000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'Globe',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateYouthNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { currentClub, youthTeams } = state;

  const hasYouth = youthTeams.length > 0 && youthTeams.some(t => t.players.length > 0);

  const templates: (() => NewsItem)[] = [
    () => {
      if (hasYouth) {
        return {
          id: generateId(),
          category: 'youth',
          headline: `${currentClub.name} academy produces exciting new talent`,
          summary: `${currentClub.name}'s youth academy continues to be one of the most productive in the country. Several youngsters are being tipped for first-team breakthroughs in the near future, with scouts from top clubs monitoring their progress.`,
          source: randomFrom(['The Athletic', 'BBC Sport', 'Goal.com']),
          timeAgo: randomFrom(TIME_AGOS.slice(1, 6)),
          reads: formatReads(randomBetween(600, 3000)),
          reactions: formatReactions(randomBetween(150, 1000)),
          isHot: false,
          hasImage: true,
          imageIcon: 'Sprout',
        };
      }
      return {
        id: generateId(),
        category: 'youth',
        headline: `${currentClub.name} invest in state-of-the-art academy facilities`,
        summary: `${currentClub.name} have announced plans to upgrade their youth academy facilities. The investment reflects the club's commitment to developing homegrown talent for the future.`,
        source: randomFrom(['The Athletic', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 8)),
        reads: formatReads(randomBetween(300, 1500)),
        reactions: formatReactions(randomBetween(50, 400)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Sprout',
      };
    },
    () => {
      return {
        id: generateId(),
        category: 'youth',
        headline: `Youth Cup: ${currentClub.name} U18s advance to next round`,
        summary: `${currentClub.name}'s under-18 side have progressed in the youth cup with a convincing victory. The young stars showcased their talent in what was an entertaining match.`,
        source: randomFrom(['BBC Sport', 'The Guardian', 'Club website']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(200, 1000)),
        reactions: formatReactions(randomBetween(50, 300)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Sprout',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateSocialNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { player, currentClub } = state;

  const templates: (() => NewsItem)[] = [
    () => {
      const followers = player.reputation > 60 ? randomBetween(500, 5000) : randomBetween(10, 500);
      return {
        id: generateId(),
        category: 'social',
        headline: `${player.name}'s social media following surges past ${followers}K`,
        summary: `The ${currentClub.name} star's social media presence continues to grow with ${player.reputation > 50 ? 'fans and brands' : 'supporters'} flocking to their profiles. Engagement rates are among the highest in the league for players in their position.`,
        source: randomFrom(['Goal.com', 'ESPN FC', 'The Athletic']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(400, 2000)),
        reactions: formatReactions(randomBetween(100, 800)),
        isHot: player.reputation > 60,
        hasImage: false,
        imageIcon: 'Heart',
      };
    },
    () => {
      const brands = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour'];
      const brand = randomFrom(brands);
      return {
        id: generateId(),
        category: 'social',
        headline: `${player.name} linked with ${brand} sponsorship deal`,
        summary: `${player.name} is reportedly in talks with ${brand} regarding a lucrative sponsorship agreement. The deal would see the ${currentClub.name} star become one of the brand's key ambassadors.`,
        source: randomFrom(['ESPN', 'Goal.com', 'The Athletic']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 7)),
        reads: formatReads(randomBetween(600, 3000)),
        reactions: formatReactions(randomBetween(150, 1000)),
        isHot: player.reputation > 45,
        hasImage: false,
        imageIcon: 'Heart',
      };
    },
    () => {
      return {
        id: generateId(),
        category: 'social',
        headline: `Fan reaction: ${currentClub.name} supporters rally behind ${player.name}`,
        summary: `${currentClub.name} fans have shown overwhelming support for ${player.name} on social media. The hashtag supporting the young ${getPositionLabel(player.position)} has been trending locally.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'The Athletic']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
        reads: formatReads(randomBetween(800, 4000)),
        reactions: formatReactions(randomBetween(200, 1500)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Heart',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

function generateManagerNews(state: GameState, count: number): NewsItem[] {
  const items: NewsItem[] = [];
  const { currentClub, teamDynamics } = state;

  const templates: (() => NewsItem)[] = [
    () => {
      return {
        id: generateId(),
        category: 'manager',
        headline: `${currentClub.name} manager: "We're building something special"`,
        summary: `The ${currentClub.name} manager has spoken about the club's long-term vision and the progress being made on the training ground. "The players are buying into our philosophy and the results are starting to show," the manager said.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'The Athletic']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
        reads: formatReads(randomBetween(800, 4000)),
        reactions: formatReactions(randomBetween(200, 1500)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Shield',
      };
    },
    () => {
      const atmos = teamDynamics.dressingRoomAtmosphere;
      const atmosDesc = atmos === 'excellent' || atmos === 'positive'
        ? 'positive'
        : atmos === 'tense' || atmos === 'toxic'
          ? 'difficult'
          : 'balanced';
      return {
        id: generateId(),
        category: 'manager',
        headline: `${currentClub.name} dressing room atmosphere described as ${atmosDesc}`,
        summary: `Insiders at ${currentClub.name} have described the mood in the dressing room as ${atmosDesc}. ${teamDynamics.cohesion > 70 ? 'Team cohesion is strong and players are united behind the manager.' : 'There are reports of some friction, though the manager is working to resolve the issues.'}`,
        source: randomFrom(['The Athletic', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(1, 7)),
        reads: formatReads(randomBetween(1500, 7000)),
        reactions: formatReactions(randomBetween(400, 3000)),
        isHot: atmos === 'toxic' || atmos === 'excellent',
        hasImage: false,
        imageIcon: 'Shield',
      };
    },
    () => {
      const otherClub = randomFrom(BIG_CLUBS.filter(c => c !== currentClub.name));
      return {
        id: generateId(),
        category: 'manager',
        headline: `${otherClub} part ways with manager after poor run of results`,
        summary: `${otherClub} have announced the departure of their manager following a disappointing sequence of results. The club are now searching for a replacement ahead of the next match.`,
        source: randomFrom(['BBC Sport', 'Sky Sports', 'ESPN FC']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
        reads: formatReads(randomBetween(3000, 15000)),
        reactions: formatReactions(randomBetween(800, 6000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'Shield',
      };
    },
    () => {
      return {
        id: generateId(),
        category: 'manager',
        headline: `${currentClub.name} tactical evolution under current management`,
        summary: `Since the current manager took charge, ${currentClub.name} have adopted a ${currentClub.tacticalStyle.replace('-', '-')} style of play with a ${currentClub.formation} formation. The tactical approach has been yielding positive results.`,
        source: randomFrom(['The Athletic', 'FourFourTwo', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(2, 8)),
        reads: formatReads(randomBetween(500, 2500)),
        reactions: formatReactions(randomBetween(100, 800)),
        isHot: false,
        hasImage: false,
        imageIcon: 'Shield',
      };
    },
  ];

  for (let i = 0; i < count; i++) {
    const fn = randomFrom(templates);
    items.push(fn());
  }
  return items;
}

// ============================================================
// Main News Generator
// ============================================================

function generateNewsItems(gameState: GameState): NewsItem[] {
  const items: NewsItem[] = [];

  // Generate from each category with weighted counts based on game state
  items.push(...generateTransferNews(gameState, randomBetween(2, 4)));
  items.push(...generateMatchNews(gameState, randomBetween(2, 4)));
  items.push(...generatePlayerNews(gameState, randomBetween(3, 5)));
  items.push(...generateLeagueNews(gameState, randomBetween(2, 3)));
  items.push(...generateInternationalNews(gameState, randomBetween(1, 2)));
  items.push(...generateYouthNews(gameState, randomBetween(1, 2)));
  items.push(...generateSocialNews(gameState, randomBetween(1, 2)));
  items.push(...generateManagerNews(gameState, randomBetween(2, 3)));

  // Shuffle items
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

// ============================================================
// Sub-Components
// ============================================================

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const config = CATEGORY_CONFIG[item.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.25,
        delay: index * 0.03,
        ease: 'easeOut',
      }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
    >
      <div className="p-4">
        {/* Top row: category badge + hot badge + time */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border ${config.badgeColor} ${config.badgeTextColor}`}
            >
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            {item.isHot && (
              <Badge className="text-[9px] px-1.5 py-0 bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Flame className="h-3 w-3 mr-0.5" />
                Hot
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[#8b949e]">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">{item.timeAgo}</span>
          </div>
        </div>

        {/* Image placeholder (optional) */}
        {item.hasImage && (
          <div className={`${config.imageBg} rounded-md h-24 flex items-center justify-center mb-3`}>
            <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
              {config.icon}
            </div>
          </div>
        )}

        {/* Headline */}
        <h3 className="text-sm font-semibold text-[#c9d1d9] leading-snug mb-1.5">
          {item.headline}
        </h3>

        {/* Summary */}
        <p className="text-xs text-[#8b949e] leading-relaxed mb-3">
          {item.summary}
        </p>

        {/* Footer: source + engagement */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#30363d]">
          <span className="text-[10px] text-[#8b949e] font-medium">{item.source}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#8b949e]">
              <Eye className="h-3 w-3" />
              <span className="text-[10px]">{item.reads}</span>
            </div>
            <div className="flex items-center gap-1 text-[#8b949e]">
              <MessageCircle className="h-3 w-3" />
              <span className="text-[10px]">{item.reactions}</span>
            </div>
            <button className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
              <Share2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryIcon({ category }: { category: NewsCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <div className={`w-6 h-6 rounded-md ${config.iconBg} flex items-center justify-center`}>
      {config.icon}
    </div>
  );
}

function PullToRefreshIndicator() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
      >
        <motion.div
          animate={isRefreshing ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 0.6, repeat: isRefreshing ? Infinity : 0 }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.div>
        <span className="text-[10px]">{isRefreshing ? 'Refreshing...' : 'Pull to refresh'}</span>
      </button>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      <div className="w-16 h-16 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
        <Newspaper className="h-8 w-8 text-[#30363d]" />
      </div>
      <p className="text-sm text-[#8b949e]">No news articles in this category</p>
      <p className="text-xs text-[#484f58]">Try selecting a different filter</p>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function WorldFootballNews() {
  const gameState = useGameStore(state => state.gameState);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const newsItems = useMemo(() => {
    if (!gameState) return [];
    return generateNewsItems(gameState);
  }, [gameState, refreshKey]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return newsItems;
    return newsItems.filter(item => item.category === activeFilter);
  }, [newsItems, activeFilter]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMore = visibleCount < filteredItems.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setVisibleCount(10);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: newsItems.length };
    for (const item of newsItems) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [newsItems]);

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const leagueName = getLeagueName(currentClub.league);

  return (
    <div className="min-h-screen bg-[#0d1117] pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.header
          className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d] px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                <Newspaper className="h-4.5 w-4.5 text-[#c9d1d9]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#c9d1d9] leading-tight">
                  World Football News
                </h1>
                <p className="text-[10px] text-[#8b949e] leading-tight mt-0.5">
                  {leagueName} &middot; Season {gameState.currentSeason}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center hover:bg-[#30363d] transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 text-[#8b949e] ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </motion.header>

        <div className="px-4 pt-3 space-y-3">
          {/* Quick Stats Bar */}
          <motion.div
            className="flex items-center gap-2 p-2.5 bg-[#161b22] border border-[#30363d] rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="flex-1 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#8b949e] leading-tight">Your Stats</p>
                <p className="text-[11px] text-[#c9d1d9] font-medium leading-tight truncate">
                  {player.seasonStats.goals}G {player.seasonStats.assists}A &middot; {player.form.toFixed(1)} avg
                </p>
              </div>
            </div>
            <div className="w-px h-6 bg-[#30363d]" />
            <div className="flex-1 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#8b949e] leading-tight">League Pos.</p>
                <p className="text-[11px] text-[#c9d1d9] font-medium leading-tight truncate">
                  {(() => {
                    const standing = gameState.leagueTable.find(
                      s => s.clubId === currentClub.id
                    );
                    const pos = standing
                      ? gameState.leagueTable.indexOf(standing) + 1
                      : '-';
                    const pts = standing?.points ?? 0;
                    return `${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} &middot; ${pts}pts`;
                  })()}
                </p>
              </div>
            </div>
            <div className="w-px h-6 bg-[#30363d]" />
            <div className="flex-1 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#8b949e] leading-tight">Articles</p>
                <p className="text-[11px] text-[#c9d1d9] font-medium leading-tight">
                  {newsItems.length} stories
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Filter className="h-3.5 w-3.5 text-[#484f58] shrink-0 mt-1" />
            {FILTER_TABS.map(tab => {
              const isActive = activeFilter === tab.value;
              const count = categoryCounts[tab.value] || 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveFilter(tab.value);
                    setVisibleCount(10);
                  }}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                    ${isActive
                      ? 'bg-[#c9d1d9] text-[#0d1117] border-[#c9d1d9]'
                      : 'bg-transparent text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`ml-1 text-[10px] ${isActive ? 'text-[#0d1117]/60' : 'text-[#484f58]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Refreshing Indicator */}
          {isRefreshing && (
            <motion.div
              className="flex items-center justify-center gap-2 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#8b949e] animate-spin" />
              <span className="text-xs text-[#8b949e]">Fetching latest news...</span>
            </motion.div>
          )}

          {/* Pull to Refresh */}
          {!isRefreshing && <PullToRefreshIndicator />}

          {/* News Feed */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {visibleItems.length === 0 ? (
                <EmptyState />
              ) : (
                visibleItems.map((item, index) => (
                  <NewsCard key={item.id} item={item} index={index} />
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && (
            <motion.div
              className="flex justify-center pt-2 pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 rounded-lg text-xs font-medium bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors"
              >
                Load More Stories
              </button>
            </motion.div>
          )}

          {/* End of feed */}
          {!hasMore && filteredItems.length > 0 && (
            <motion.div
              className="flex items-center justify-center gap-2 py-4 pb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-px flex-1 bg-[#30363d]" />
              <span className="text-[10px] text-[#484f58]">
                You&apos;re all caught up
              </span>
              <div className="h-px flex-1 bg-[#30363d]" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
