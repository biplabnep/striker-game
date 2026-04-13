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
  AlertTriangle,
  ThumbsUp,
  Repeat2,
  BookmarkCheck,
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

type BaseNewsItem = {
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
};

interface NewsItem extends BaseNewsItem {
  readTime: number;
  reliability: 'reliable' | 'rumor';
  relatedToClub: boolean;
}

interface TransferRumor {
  id: string;
  club: string;
  confidence: 'Low' | 'Medium' | 'High';
  confidencePercent: number;
  source: string;
  fee: string;
  detail: string;
  timeAgo: string;
}

interface SocialReaction {
  id: string;
  username: string;
  handle: string;
  avatarInitial: string;
  text: string;
  likes: number;
  retweets: number;
}

type FilterTab = 'all' | 'transfer' | 'results' | 'injuries' | 'rumours' | 'international';

interface FeaturedArticle {
  headline: string;
  subtitle: string;
  author: string;
  date: string;
  readTime: number;
  category: 'Transfer' | 'Match' | 'Analysis' | 'Interview' | 'Rumor';
  keyTakeaways: string[];
  readCount: string;
}

interface TransferRumorMillItem {
  id: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  fee: string;
  reliability: number;
  source: string;
  status: 'Done Deal' | 'Likely' | 'Rumor' | 'Unlikely';
}

interface LeagueSummary {
  leagueName: string;
  leader: string;
  keyResult: string;
  topScorer: string;
  relegationUpdate: string;
  topTeams: string[];
  bottomTeams: string[];
}

interface PowerRankingEntry {
  rank: number;
  clubName: string;
  prevRank: number;
  rating: number;
  form: Array<'W' | 'D' | 'L'>;
}

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

const RELIABLE_SOURCES = [
  'BBC Sport', 'Sky Sports', 'The Athletic', 'ESPN FC', 'Premier League.com', 'UEFA.com', 'BBC Radio 5 Live',
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

const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': '#bb1919',
  'Sky Sports': '#d4a017',
  'The Athletic': '#f97316',
  'ESPN FC': '#dc2626',
  'ESPN': '#dc2626',
  'Goal.com': '#16a34a',
  'Marca': '#e11d48',
  "L'Equipe": '#2563eb',
  'Gazzetta dello Sport': '#059669',
  'Kicker': '#dc2626',
  'The Guardian': '#0f766e',
  'Football Italia': '#059669',
  'Bundesliga.com': '#dc2626',
  'Premier League.com': '#3b0764',
  'CBS Sports': '#1d4ed8',
  'The Telegraph': '#475569',
  'BBC Radio 5 Live': '#bb1919',
  'Football Daily': '#64748b',
};

const CATEGORY_CONFIG: Record<NewsCategory, {
  label: string;
  badgeColor: string;
  badgeTextColor: string;
  iconBg: string;
  icon: React.ReactNode;
  imageBg: string;
  borderColor: string;
}> = {
  transfer: {
    label: 'Transfer',
    badgeColor: 'bg-amber-500/15 border-amber-500/30',
    badgeTextColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    imageBg: 'bg-amber-500/10',
    icon: <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />,
    borderColor: 'border-l-amber-400',
  },
  match: {
    label: 'Result',
    badgeColor: 'bg-emerald-500/15 border-emerald-500/30',
    badgeTextColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    imageBg: 'bg-emerald-500/10',
    icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" />,
    borderColor: 'border-l-emerald-400',
  },
  player: {
    label: 'Injury',
    badgeColor: 'bg-red-500/15 border-red-500/30',
    badgeTextColor: 'text-red-400',
    iconBg: 'bg-red-500/15',
    imageBg: 'bg-red-500/10',
    icon: <UserCircle className="h-3.5 w-3.5 text-red-400" />,
    borderColor: 'border-l-red-400',
  },
  league: {
    label: 'Rumour',
    badgeColor: 'bg-purple-500/15 border-purple-500/30',
    badgeTextColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    imageBg: 'bg-purple-500/10',
    icon: <TrendingUp className="h-3.5 w-3.5 text-purple-400" />,
    borderColor: 'border-l-purple-400',
  },
  international: {
    label: 'International',
    badgeColor: 'bg-sky-500/15 border-sky-500/30',
    badgeTextColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    imageBg: 'bg-sky-500/10',
    icon: <Globe className="h-3.5 w-3.5 text-sky-400" />,
    borderColor: 'border-l-sky-400',
  },
  youth: {
    label: 'Youth',
    badgeColor: 'bg-cyan-500/15 border-cyan-500/30',
    badgeTextColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    imageBg: 'bg-cyan-500/10',
    icon: <Sprout className="h-3.5 w-3.5 text-cyan-400" />,
    borderColor: 'border-l-cyan-400',
  },
  social: {
    label: 'Social',
    badgeColor: 'bg-pink-500/15 border-pink-500/30',
    badgeTextColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    imageBg: 'bg-pink-500/10',
    icon: <Heart className="h-3.5 w-3.5 text-pink-400" />,
    borderColor: 'border-l-pink-400',
  },
  manager: {
    label: 'Manager',
    badgeColor: 'bg-violet-500/15 border-violet-500/30',
    badgeTextColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    imageBg: 'bg-violet-500/10',
    icon: <Shield className="h-3.5 w-3.5 text-violet-400" />,
    borderColor: 'border-l-violet-400',
  },
};

const FILTER_TABS: { value: FilterTab; label: string; category?: NewsCategory }[] = [
  { value: 'all', label: 'All' },
  { value: 'transfer', label: 'Transfers', category: 'transfer' },
  { value: 'results', label: 'Results', category: 'match' },
  { value: 'injuries', label: 'Injuries', category: 'player' },
  { value: 'rumours', label: 'Rumours' },
  { value: 'international', label: 'International', category: 'international' },
];

const SOCIAL_USERNAMES = [
  { username: 'FootballInsider', handle: '@footyinsider', initial: 'F' },
  { username: 'TacticalTom', handle: '@tactical_tom', initial: 'T' },
  { username: 'MatchDaySarah', handle: '@matchdaysarah', initial: 'S' },
  { username: 'GoalAlertUK', handle: '@goalalertuk', initial: 'G' },
  { username: 'ThePitchExpert', handle: '@pitchexpert', initial: 'P' },
  { username: 'StatsManDave', handle: '@statsmandave', initial: 'D' },
  { username: 'TransferCentre', handle: '@transfercentre', initial: 'T' },
  { username: 'FanViewAlex', handle: '@fanviewalex', initial: 'A' },
];

const SOCIAL_REACTION_TEMPLATES = [
  (playerName: string, clubName: string) => [
    `Can't believe how good ${playerName} has been this season. ${clubName} have a real star on their hands.`,
    `${playerName} is absolutely class. Will be playing at the highest level soon, mark my words.`,
    `Just watched ${playerName}'s highlights again. The potential is unreal. Future Ballon d'Or contender?`,
  ],
  (playerName: string, clubName: string) => [
    `If ${clubName} sell ${playerName} they're making a massive mistake. Keep him at all costs!`,
    `${playerName} to a top club this summer? I'd put money on it. The talent is undeniable.`,
    `Scouts from every top team watching ${playerName} right now. This is going to be a busy transfer window.`,
  ],
  (playerName: string, clubName: string) => [
    `${playerName}'s work rate and attitude are just as impressive as the technical ability. Rare combination.`,
    `People sleeping on ${playerName}. Trust me, this player is going to be world-class within 2 years.`,
    `The way ${playerName} reads the game is beyond their years. ${clubName} academy deserves huge credit.`,
  ],
];

// ============================================================
// Helpers
// ============================================================

function randomFrom<T>(arr: readonly T[]): T {
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

function getReadTime(summary: string): number {
  const words = summary.split(/\s+/).length;
  return Math.max(1, Math.min(6, Math.ceil(words / 40)));
}

function getReliability(item: BaseNewsItem): 'reliable' | 'rumor' {
  if (RELIABLE_SOURCES.includes(item.source) && item.category !== 'transfer') {
    return 'reliable';
  }
  if (item.category === 'match' || item.category === 'league' || item.category === 'international') {
    return 'reliable';
  }
  if (item.category === 'transfer') {
    return RELIABLE_SOURCES.includes(item.source) ? 'reliable' : 'rumor';
  }
  if (item.category === 'social' || item.category === 'player') {
    return Math.random() > 0.6 ? 'rumor' : 'reliable';
  }
  return 'reliable';
}

function isRelatedToClub(item: BaseNewsItem, clubName: string): boolean {
  return item.headline.includes(clubName) || item.summary.includes(clubName);
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

function generateTransferNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { player, currentClub } = state;
  const rivals = getRivalClubs(currentClub.name);
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => BaseNewsItem)[] = [
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
    () => {
      const fromLeague = randomFrom(LEAGUES);
      const toLeague = randomFrom(LEAGUES.filter(l => l.id !== fromLeague.id));
      const fee = randomBetween(20, 120);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${fee}M\u20AC deal: Star completes ${fromLeague.name} to ${toLeague.name} move`,
        summary: `A major transfer has been completed as a key player moves from the ${fromLeague.name} to the ${toLeague.name}. The deal is reported to be worth around \u20AC${fee}M, making it one of the biggest of the window.`,
        source: randomFrom(['Sky Sports', 'BBC Sport', 'ESPN FC']),
        timeAgo: randomFrom(TIME_AGOS.slice(0, 4)),
        reads: formatReads(randomBetween(3000, 15000)),
        reactions: formatReactions(randomBetween(1000, 8000)),
        isHot: true,
        hasImage: true,
        imageIcon: 'ArrowUpDown',
      };
    },
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
    () => {
      const amount = player.marketValue > 0
        ? Math.round(player.marketValue * 1.5 / 1000000)
        : randomBetween(15, 60);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${player.name}'s release clause revealed: \u20AC${amount}M`,
        summary: `Details of ${player.name}'s contract at ${currentClub.name} have emerged, with the ${getPositionLabel(player.position)} having a release clause of approximately \u20AC${amount}M. Several clubs are monitoring the situation.`,
        source: randomFrom(['The Athletic', 'Marca', 'Football Italia', 'BBC Sport']),
        timeAgo: randomFrom(TIME_AGOS.slice(3, 9)),
        reads: formatReads(randomBetween(2000, 9000)),
        reactions: formatReactions(randomBetween(500, 4000)),
        isHot: player.reputation > 55,
        hasImage: false,
        imageIcon: 'ArrowUpDown',
      };
    },
    () => {
      const league = randomFrom(LEAGUES);
      return {
        id: generateId(),
        category: 'transfer',
        headline: `${league.name} clubs spend record \u20AC${randomBetween(400, 1200)}M in transfer window`,
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

function generateMatchNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { player, currentClub, recentResults, leagueTable } = state;
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => BaseNewsItem)[] = [
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
    () => {
      const playerStanding = leagueTable.find(s => s.clubId === currentClub.id);
      const position = playerStanding ? leagueTable.indexOf(playerStanding) + 1 : 10;

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

function generatePlayerNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { player, currentClub } = state;

  const templates: (() => BaseNewsItem)[] = [
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
    () => {
      if (player.overall >= 80) {
        return {
          id: generateId(),
          category: 'player',
          headline: `${player.name} rated at ${player.overall} OVR \u2014 among the world's best`,
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

function generateLeagueNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { currentClub, leagueTable } = state;
  const leagueName = getLeagueName(currentClub.league);

  const templates: (() => BaseNewsItem)[] = [
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

function generateInternationalNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { player, currentClub, internationalCareer } = state;

  const templates: (() => BaseNewsItem)[] = [
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

function generateYouthNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { currentClub, youthTeams } = state;

  const hasYouth = youthTeams.length > 0 && youthTeams.some(t => t.players.length > 0);

  const templates: (() => BaseNewsItem)[] = [
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

function generateSocialNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { player, currentClub } = state;

  const templates: (() => BaseNewsItem)[] = [
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

function generateManagerNews(state: GameState, count: number): BaseNewsItem[] {
  const items: BaseNewsItem[] = [];
  const { currentClub, teamDynamics } = state;

  const templates: (() => BaseNewsItem)[] = [
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
// Enhanced Generation: Breaking News, Transfer Rumors, Social Reactions
// ============================================================

function generateBreakingHeadlines(state: GameState): string[] {
  const { player, currentClub } = state;
  const rivals = getRivalClubs(currentClub.name);
  const leagueName = getLeagueName(currentClub.league);

  const pool: string[] = [];

  if (player.form >= 8) {
    pool.push(`${player.name} delivers stunning performance \u2014 ${currentClub.name} fans erupt`);
  }
  if (player.reputation > 50) {
    pool.push(`BREAKING: ${randomFrom(rivals)} ready to table \u20AC${randomBetween(30, 100)}M bid for ${player.name}`);
  }
  if (state.currentInjury) {
    pool.push(`INJURY ALERT: ${player.name} suffers setback \u2014 tests underway at ${currentClub.name}`);
  }
  pool.push(`${randomFrom(BIG_CLUBS)} complete shock signing on deadline day`);
  pool.push(`${leagueName} title race takes dramatic twist after latest results`);
  pool.push(`${randomFrom(BIG_CLUBS)} part ways with manager after disastrous run`);
  if (player.overall >= 80) {
    pool.push(`${player.name} named in Team of the Season so far by leading pundits`);
  }
  pool.push(`Record-breaking attendance as ${leagueName} delivers thrilling matchday`);

  const count = Math.min(pool.length, randomBetween(3, 5));
  return pool.slice(0, count);
}

function generateTransferRumors(state: GameState): TransferRumor[] {
  const { player, currentClub } = state;
  const rivals = getRivalClubs(currentClub.name);
  const selected = rivals.sort(() => Math.random() - 0.5).slice(0, 4);

  const confidenceLevels: Array<{ confidence: TransferRumor['confidence']; percent: number }> = [
    { confidence: 'High', percent: randomBetween(65, 90) },
    { confidence: 'Medium', percent: randomBetween(35, 64) },
    { confidence: 'Low', percent: randomBetween(15, 34) },
    { confidence: 'Medium', percent: randomBetween(40, 65) },
  ];

  const details: string[] = [
    `Scouts from ${currentClub.name}'s training ground have been spotted at multiple matches. The ${getPositionLabel(player.position)} fits their tactical setup perfectly.`,
    `Director of football has personally watched ${player.name} three times this month. A formal approach could come before the window closes.`,
    `Sources within the club confirm ${player.name} is on their shortlist, though no official contact has been made with ${currentClub.name} yet.`,
    `The club's sporting director views ${player.name} as a long-term investment. Initial talks may begin during the upcoming international break.`,
  ];

  return selected.slice(0, randomBetween(3, 4)).map((club, i) => {
    const fee = player.marketValue > 0
      ? Math.round(player.marketValue * (1 + Math.random() * 0.8) / 1000000)
      : randomBetween(15, 80);
    const level = confidenceLevels[i % confidenceLevels.length];
    return {
      id: generateId(),
      club,
      confidence: level.confidence,
      confidencePercent: level.percent,
      source: randomFrom(['The Athletic', 'Sky Sports', 'Marca', 'Goal.com', 'L\'Equipe']),
      fee: `\u20AC${fee}M`,
      detail: details[i % details.length].replace('{club}', club),
      timeAgo: randomFrom(TIME_AGOS.slice(0, 5)),
    };
  });
}

function generateSocialReactionsForItem(item: NewsItem, state: GameState): SocialReaction[] {
  const { player, currentClub } = state;
  const count = randomBetween(2, 3);
  const templateGroup = SOCIAL_REACTION_TEMPLATES[randomBetween(0, SOCIAL_REACTION_TEMPLATES.length - 1)];
  const reactions: SocialReaction[] = [];

  for (let i = 0; i < count; i++) {
    const user = SOCIAL_USERNAMES[(Math.floor(Math.random() * SOCIAL_USERNAMES.length) + i) % SOCIAL_USERNAMES.length];
    reactions.push({
      id: generateId(),
      username: user.username,
      handle: user.handle,
      avatarInitial: user.initial,
      text: templateGroup(player.name, currentClub.name)[i % templateGroup(player.name, currentClub.name).length],
      likes: randomBetween(50, 5000),
      retweets: randomBetween(10, 2000),
    });
  }
  return reactions;
}

// ============================================================
// New Section Generation: Featured Article, Transfer Rumor Mill,
// League Round-Up, Power Rankings
// ============================================================

function generateFeaturedArticle(state: GameState): FeaturedArticle {
  const { player, currentClub } = state;
  const leagueName = getLeagueName(currentClub.league);

  const articles: FeaturedArticle[] = [
    {
      headline: `${player.name}: The Rise of ${currentClub.name}'s Brightest Star`,
      subtitle: `How a ${player.age}-year-old ${getPositionLabel(player.position)} is rewriting the script at ${currentClub.name} and catching the attention of Europe's elite.`,
      author: randomFrom(['James Richardson', 'Rafael Honigstein', 'Sid Lowe', 'Fabrizio Romano']),
      date: randomFrom(['Today', 'Yesterday', '2 days ago']),
      readTime: randomBetween(4, 7),
      category: 'Interview',
      keyTakeaways: [
        `${player.name} has been pivotal to ${currentClub.name}'s season with ${player.seasonStats.goals} goals and ${player.seasonStats.assists} assists`,
        `Scouts from ${randomFrom(BIG_CLUBS)} have been monitoring progress`,
        `Current form rating of ${player.form.toFixed(1)} places among the ${leagueName} elite`,
        `Club sources say ${player.name} is happy and focused on development`,
      ],
      readCount: formatReads(randomBetween(5000, 20000)),
    },
    {
      headline: `${leagueName} Transfer Window: Who's Moving Where?`,
      subtitle: `A comprehensive breakdown of the biggest deals, potential transfers, and the clubs shaping the market this season.`,
      author: randomFrom(['David Ornstein', 'Fabrizio Romano', 'Guillem Balague']),
      date: randomFrom(['Today', 'Yesterday']),
      readTime: randomBetween(5, 8),
      category: 'Transfer',
      keyTakeaways: [
        `${currentClub.name} are expected to be active in the market`,
        `${randomFrom(BIG_CLUBS)} leads spending with record investment`,
        `Loan deals are becoming increasingly popular across Europe`,
        `Financial fair play rules are impacting transfer strategies`,
      ],
      readCount: formatReads(randomBetween(8000, 30000)),
    },
    {
      headline: `Tactical Analysis: How ${currentClub.name} Have Evolved This Season`,
      subtitle: `An in-depth look at the tactical shifts and system changes that have defined ${currentClub.name}'s campaign under the current manager.`,
      author: randomFrom(['Michael Cox', 'The Athletic Staff', 'JonAS']),
      date: randomFrom(['Today', '2 days ago', '3 days ago']),
      readTime: randomBetween(6, 9),
      category: 'Analysis',
      keyTakeaways: [
        `The ${currentClub.formation} formation has been key to recent improvements`,
        `${player.name} has adapted to a new role with impressive results`,
        `Defensive solidity has improved by 15% compared to last season`,
        `Set-piece routines have yielded ${randomBetween(5, 12)} goals this term`,
      ],
      readCount: formatReads(randomBetween(4000, 15000)),
    },
  ];

  return articles[player.form >= 7.5 ? 0 : player.overall >= 75 ? 2 : 1];
}

function generateTransferRumorMill(state: GameState): TransferRumorMillItem[] {
  const { player, currentClub } = state;
  const rivals = getRivalClubs(currentClub.name);
  const shuffled = rivals.sort(() => Math.random() - 0.5).slice(0, 5);
  const statuses: Array<TransferRumorMillItem['status']> = ['Done Deal', 'Likely', 'Rumor', 'Rumor', 'Unlikely'];
  const feeMultiplier = player.marketValue > 0 ? player.marketValue / 1000000 : randomBetween(20, 60);
  const items: TransferRumorMillItem[] = [];

  for (let i = 0; i < Math.min(shuffled.length, 6); i++) {
    const toClub = shuffled[i];
    const fromClub = i === 0 ? currentClub.name : randomFrom(BIG_CLUBS.filter(c => c !== toClub));
    const playerName = i === 0 ? player.name : randomFrom(['Mateo Kovacic', 'Rafael Leao', 'Jamal Musiala', 'Bukayo Saka', 'Pedri', 'Vinicius Jr', 'Florian Wirtz', 'Lamine Yamal']);
    const fee = Math.round(feeMultiplier * (0.8 + Math.random() * 0.8));
    const reliability = statuses[i] === 'Done Deal' ? 5 : statuses[i] === 'Likely' ? 4 : statuses[i] === 'Rumor' ? randomBetween(2, 3) : 1;

    items.push({
      id: generateId(),
      playerName,
      fromClub,
      toClub,
      fee: `\u20AC${fee}M`,
      reliability,
      source: randomFrom(NEWS_SOURCES),
      status: statuses[i] ?? 'Rumor',
    });
  }

  return items;
}

function generateLeagueRoundUp(state: GameState): LeagueSummary[] {
  const summaries: LeagueSummary[] = [];
  const leagues = LEAGUES.slice(0, 5);

  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const leader = randomFrom(BIG_CLUBS.slice(i * 4, (i + 1) * 4));
    const second = randomFrom(BIG_CLUBS.filter(c => c !== leader));
    const third = randomFrom(BIG_CLUBS.filter(c => c !== leader && c !== second));
    const bottom1 = randomFrom(BIG_CLUBS.slice(i * 2 + 2, (i + 1) * 4 + 2));
    const bottom2 = randomFrom(BIG_CLUBS.filter(c => c !== bottom1));
    const bottom3 = randomFrom(BIG_CLUBS.filter(c => c !== bottom1 && c !== bottom2));
    const homeGoals = randomBetween(1, 4);
    const awayGoals = randomBetween(0, 3);

    summaries.push({
      leagueName: league.name,
      leader,
      keyResult: `${leader} ${homeGoals}-${awayGoals} ${second}`,
      topScorer: randomFrom(['Harry Kane', 'Kylian Mbappe', 'Erling Haaland', 'Victor Osimhen', 'Lautaro Martinez', 'Robert Lewandowski']),
      relegationUpdate: `${bottom1}, ${bottom2}, and ${bottom3} locked in relegation dogfight`,
      topTeams: [leader, second, third],
      bottomTeams: [bottom1, bottom2, bottom3],
    });
  }

  return summaries;
}

function generatePowerRankings(state: GameState): PowerRankingEntry[] {
  const rankings: PowerRankingEntry[] = [];
  const clubs = [...BIG_CLUBS].sort(() => Math.random() - 0.5).slice(0, 10);

  for (let i = 0; i < clubs.length; i++) {
    const formEntries: Array<'W' | 'D' | 'L'> = [];
    const formChars = ['W', 'W', 'W', 'D', 'L', 'W', 'D', 'W', 'L', 'W'];
    for (let j = 0; j < 5; j++) {
      formEntries.push(formChars[randomBetween(0, formChars.length - 1)] as 'W' | 'D' | 'L');
    }

    rankings.push({
      rank: i + 1,
      clubName: clubs[i],
      prevRank: i === 0 ? 1 : Math.max(1, i + 1 + (Math.random() > 0.5 ? 1 : -1)),
      rating: Math.round((95 - i * 3 + randomBetween(-2, 2)) * 10) / 10,
      form: formEntries,
    });
  }

  rankings.sort((a, b) => a.rank - b.rank);
  return rankings;
}

// ============================================================
// Main News Generator
// ============================================================

function generateNewsItems(gameState: GameState): NewsItem[] {
  const items: BaseNewsItem[] = [];

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

  // Enrich with enhanced fields
  const clubName = gameState.currentClub.name;
  return items.map((item): NewsItem => ({
    ...item,
    readTime: getReadTime(item.summary),
    reliability: getReliability(item),
    relatedToClub: isRelatedToClub(item, clubName),
  }));
}

// ============================================================
// Sub-Components
// ============================================================

function BreakingNewsBanner({ headlines }: { headlines: string[] }) {
  if (headlines.length === 0) return null;

  const doubled = [...headlines, ...headlines];

  return (
    <motion.div
      className="bg-red-600/15 border-b-2 border-l-4 border-l-red-500 border-b-red-600/25"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, borderLeftColor: ['#ef4444', '#991b1b'] }}
      transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse', borderLeftColor: { duration: 1.2, repeat: Infinity, repeatType: 'reverse' } }}
    >
      <div className="flex items-center max-w-lg mx-auto px-4 py-2 gap-3">
        <div className="shrink-0 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
          <AlertTriangle className="h-3 w-3" />
          BREAKING
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-breaking-ticker whitespace-nowrap">
            {doubled.map((headline, i) => (
              <span
                key={`${headline}-${i}`}
                className="text-[11px] text-red-300/90 mx-6 inline-block"
              >
                {headline}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NewsCard({
  item,
  index,
  socialReactions,
}: {
  item: NewsItem;
  index: number;
  socialReactions?: SocialReaction[];
}) {
  const config = CATEGORY_CONFIG[item.category];
  const sourceColor = SOURCE_COLORS[item.source] ?? '#64748b';
  const engagementScore = parseInt(item.reads) || 0;
  const isTrending = item.isHot || engagementScore > 5000;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.25,
        delay: index * 0.03,
        ease: 'easeOut',
      }}
      className={`bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden border-l-[3px] ${config.borderColor}`}
    >
      <div className="p-4">
        {/* Top row: category badge + trending badge + related tag + time + reading time */}
        <div className="flex items-start justify-between mb-2.5 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border ${config.badgeColor} ${config.badgeTextColor}`}
            >
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            {isTrending && (
              <Badge className="text-[9px] px-1.5 py-0 bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Flame className="h-3 w-3 mr-0.5" />
                Hot
              </Badge>
            )}
            {item.relatedToClub && (
              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Users className="h-3 w-3 mr-0.5" />
                Your Club
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[#8b949e] shrink-0">
            <span className="text-[10px]">{item.timeAgo}</span>
            <span className="text-[10px] text-[#484f58]">·</span>
            <span className="text-[10px] flex items-center gap-0.5">
              <BookmarkCheck className="h-2.5 w-2.5" />
              {item.readTime}m read
            </span>
          </div>
        </div>

        {/* Image placeholder (optional) */}
        {item.hasImage && (
          <div className={`${config.imageBg} rounded-lg h-24 flex items-center justify-center mb-3`}>
            <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
              {config.icon}
            </div>
          </div>
        )}

        {/* Headline */}
        <h3 className="text-sm font-semibold text-[#c9d1d9] leading-snug mb-1.5">
          {isTrending && <span className="mr-1">🔥</span>}
          {item.headline}
        </h3>

        {/* Summary */}
        <p className="text-xs text-[#8b949e] leading-relaxed mb-3">
          {item.summary}
        </p>

        {/* Social Reactions for major stories */}
        {item.isHot && socialReactions && socialReactions.length > 0 && (
          <SocialReactions reactions={socialReactions} />
        )}

        {/* Footer: source badge + credibility + engagement */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#30363d]">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Source badge with colored indicator */}
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: sourceColor }}
            />
            <span className="text-[10px] text-[#8b949e] font-medium truncate">
              {item.source}
            </span>
            <span className={`text-[9px] px-1 py-0 rounded-sm shrink-0 ${
              item.reliability === 'reliable'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}
            >
              {item.reliability === 'reliable' ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
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

function SocialReactions({ reactions }: { reactions: SocialReaction[] }) {
  return (
    <div className="mt-2.5 mb-1 pl-2 border-l-2 border-[#30363d] space-y-2">
      {reactions.map(r => (
        <div key={r.id} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[8px] text-[#8b949e] font-bold">{r.avatarInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{r.username}</span>
              <span className="text-[10px] text-[#484f58]">&middot;</span>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{r.text}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5 text-[#484f58]">
                <ThumbsUp className="h-2.5 w-2.5" />
                <span className="text-[9px]">
                  {r.likes >= 1000 ? `${(r.likes / 1000).toFixed(1)}K` : r.likes}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-[#484f58]">
                <Repeat2 className="h-2.5 w-2.5" />
                <span className="text-[9px]">
                  {r.retweets >= 1000 ? `${(r.retweets / 1000).toFixed(1)}K` : r.retweets}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransferRumorSection({ rumors }: { rumors: TransferRumor[] }) {
  if (rumors.length === 0) return null;

  return (
    <motion.div
      className="mt-6 space-y-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
          <ArrowUpDown className="h-3.5 w-3.5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#c9d1d9] leading-tight">Transfer Rumors About You</h2>
          <p className="text-[10px] text-[#8b949e]">Latest interest from around Europe</p>
        </div>
      </div>

      {rumors.map((rumor) => {
        const barColor = rumor.confidence === 'High'
          ? 'bg-emerald-500'
          : rumor.confidence === 'Medium'
            ? 'bg-amber-500'
            : 'bg-red-500';
        const textColor = rumor.confidence === 'High'
          ? 'text-emerald-400'
          : rumor.confidence === 'Medium'
            ? 'text-amber-400'
            : 'text-red-400';

        return (
          <div
            key={rumor.id}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#c9d1d9] leading-tight">
                  {rumor.club}
                </p>
                <p className="text-[10px] text-[#8b949e] mt-0.5">
                  {rumor.source} &middot; {rumor.timeAgo}
                </p>
              </div>
              <span className="text-sm font-bold text-sky-400 shrink-0 ml-2">
                {rumor.fee}
              </span>
            </div>

            {/* Confidence bar */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8b949e]">Confidence</span>
                <span className={`text-[10px] font-semibold ${textColor}`}>
                  {rumor.confidence}
                </span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm ${barColor} animate-confidence-fill`}
                  style={
                    { '--confidence-width': `${rumor.confidencePercent}%` } as React.CSSProperties
                  }
                />
              </div>
            </div>

            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              {rumor.detail}
            </p>
          </div>
        );
      })}
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
// Featured Article Hero Component
// ============================================================

function FeaturedArticleHero({ article }: { article: FeaturedArticle }) {
  const categoryColors: Record<FeaturedArticle['category'], string> = {
    Transfer: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    Match: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Analysis: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    Interview: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    Rumor: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  };

  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      {/* Image placeholder */}
      <div className="relative h-40 bg-[#21262d] flex items-center justify-center">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="opacity-30">
          <rect x="10" y="15" width="100" height="55" rx="4" fill="#30363d" />
          <circle cx="40" cy="42" r="12" fill="#8b949e" />
          <rect x="56" y="30" width="45" height="4" rx="2" fill="#8b949e" />
          <rect x="56" y="38" width="35" height="3" rx="1.5" fill="#8b949e" />
          <rect x="56" y="45" width="40" height="3" rx="1.5" fill="#8b949e" />
          <rect x="56" y="52" width="28" height="3" rx="1.5" fill="#8b949e" />
        </svg>
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${categoryColors[article.category]}`}>
            {article.category}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-[#8b949e]">
          <Eye className="h-3 w-3" />
          {article.readCount}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-base font-bold text-[#c9d1d9] leading-tight mb-1.5">
          {article.headline}
        </h2>
        <p className="text-xs text-[#8b949e] leading-relaxed mb-3">
          {article.subtitle}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-[10px] text-[#8b949e]">
          <span className="font-medium text-[#c9d1d9]">{article.author}</span>
          <span className="text-[#484f58]">&middot;</span>
          <span>{article.date}</span>
          <span className="text-[#484f58]">&middot;</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {article.readTime} min read
          </span>
        </div>

        {/* Key Takeaways */}
        <div className="border-t border-[#30363d] pt-3">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Key Takeaways</p>
          <ul className="space-y-1.5">
            {article.keyTakeaways.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-[#c9d1d9] leading-relaxed">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-sm shrink-0 mt-1" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Read More */}
        <button className="mt-3 w-full py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/15 transition-colors">
          Read Full Article
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Transfer Rumor Mill Component
// ============================================================

function TransferRumorMillSection({ items, playerClubName }: { items: TransferRumorMillItem[]; playerClubName: string }) {
  if (items.length === 0) return null;

  const statusConfig: Record<TransferRumorMillItem['status'], { bg: string; text: string }> = {
    'Done Deal': { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    'Likely': { bg: 'bg-sky-500/15', text: 'text-sky-400' },
    'Rumor': { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    'Unlikely': { bg: 'bg-red-500/15', text: 'text-red-400' },
  };

  return (
    <motion.div
      className="space-y-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#c9d1d9] leading-tight">Transfer Rumor Mill</h2>
          <p className="text-[10px] text-[#8b949e]">Latest whispers from the market</p>
        </div>
      </div>

      {items.map((item) => {
        const cfg = statusConfig[item.status];
        const isPlayerTransfer = item.fromClub === playerClubName;

        return (
          <div
            key={item.id}
            className={`bg-[#161b22] border rounded-lg p-3 ${isPlayerTransfer ? 'border-amber-500/40' : 'border-[#30363d]'}`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-[#c9d1d9] leading-tight truncate">
                    {item.playerName}
                  </p>
                  {isPlayerTransfer && (
                    <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-amber-500/15 text-amber-400 shrink-0">
                      YOUR CLUB
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8b949e] mt-0.5">
                  <span className="text-[#c9d1d9]">{item.fromClub}</span>
                  <span className="mx-1.5 text-[#484f58]">&rarr;</span>
                  <span className="text-[#c9d1d9]">{item.toClub}</span>
                </p>
              </div>
              <span className="text-sm font-bold text-sky-400 shrink-0 ml-2">{item.fee}</span>
            </div>

            <div className="flex items-center gap-3 mt-2">
              {/* Status badge */}
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border border-current/10`}>
                {item.status}
              </span>

              {/* Star reliability */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <svg
                    key={starIdx}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill={starIdx < item.reliability ? '#f59e0b' : '#30363d'}
                  >
                    <rect x="1" y="1" width="8" height="8" rx="1" />
                  </svg>
                ))}
              </div>

              {/* Source */}
              <span className="text-[9px] text-[#484f58] ml-auto">{item.source}</span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ============================================================
// League Round-Up Component
// ============================================================

function LeagueRoundUpSection({ summaries }: { summaries: LeagueSummary[] }) {
  if (summaries.length === 0) return null;

  return (
    <motion.div
      className="space-y-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <Trophy className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#c9d1d9] leading-tight">League Round-Up</h2>
          <p className="text-[10px] text-[#8b949e]">Across Europe&apos;s top five leagues</p>
        </div>
      </div>

      {summaries.map((summary, idx) => (
        <div key={summary.leagueName} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          {/* League name + key result */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-[12px] font-bold text-[#c9d1d9]">{summary.leagueName}</h3>
            <span className="text-[10px] text-emerald-400 font-medium shrink-0 ml-2">{summary.keyResult}</span>
          </div>

          {/* Mini table: top 3 */}
          <div className="mb-2">
            <p className="text-[9px] text-[#484f58] font-semibold uppercase tracking-wider mb-1">Top 3</p>
            <div className="flex gap-1.5">
              {summary.topTeams.map((team, teamIdx) => (
                <div key={team} className="flex items-center gap-1">
                  <span className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded ${
                    teamIdx === 0 ? 'bg-amber-500/20 text-amber-400' :
                    teamIdx === 1 ? 'bg-[#30363d] text-[#8b949e]' :
                    'bg-amber-700/20 text-amber-600'
                  }`}>
                    {teamIdx + 1}
                  </span>
                  <span className="text-[10px] text-[#c9d1d9] truncate max-w-[80px]">{team}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 3 */}
          <div className="mb-2">
            <p className="text-[9px] text-[#484f58] font-semibold uppercase tracking-wider mb-1">Relegation Zone</p>
            <div className="flex gap-1.5">
              {summary.bottomTeams.map((team, teamIdx) => (
                <div key={team} className="flex items-center gap-1">
                  <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded bg-red-500/15 text-red-400">
                    {idx * 3 + teamIdx + 1}
                  </span>
                  <span className="text-[10px] text-[#8b949e] truncate max-w-[80px]">{team}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
            <span className="text-[10px] text-[#8b949e]">
              Top Scorer: <span className="text-[#c9d1d9] font-medium">{summary.topScorer}</span>
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ============================================================
// Power Rankings Component
// ============================================================

function PowerRankingsSection({ rankings, playerClubName }: { rankings: PowerRankingEntry[]; playerClubName: string }) {
  if (rankings.length === 0) return null;

  const formColorMap: Record<string, string> = {
    W: 'bg-emerald-400',
    D: 'bg-amber-400',
    L: 'bg-red-400',
  };

  return (
    <motion.div
      className="space-y-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#c9d1d9] leading-tight">Power Rankings</h2>
          <p className="text-[10px] text-[#8b949e]">Top 10 clubs in world football</p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        {rankings.map((entry, idx) => {
          const isPlayerClub = entry.clubName === playerClubName;
          const rankChange = entry.prevRank - entry.rank;

          return (
            <div
              key={entry.clubName}
              className={`flex items-center gap-2.5 px-3 py-2.5 ${
                idx < rankings.length - 1 ? 'border-b border-[#21262d]' : ''
              } ${isPlayerClub ? 'bg-sky-500/5 border-l-2 border-l-sky-400' : ''}`}
            >
              {/* Rank number */}
              <span className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-md shrink-0 ${
                entry.rank <= 3 ? 'bg-amber-500/15 text-amber-400' : 'bg-[#21262d] text-[#8b949e]'
              }`}>
                {entry.rank}
              </span>

              {/* Club name */}
              <span className={`text-[12px] font-semibold min-w-0 flex-1 truncate ${
                isPlayerClub ? 'text-sky-400' : 'text-[#c9d1d9]'
              }`}>
                {entry.clubName}
              </span>

              {/* Rank change arrow */}
              <span className="text-[10px] shrink-0 w-5 text-center">
                {rankChange > 0 ? (
                  <span className="text-emerald-400">&#9650;{rankChange}</span>
                ) : rankChange < 0 ? (
                  <span className="text-red-400">&#9660;{Math.abs(rankChange)}</span>
                ) : (
                  <span className="text-[#484f58]">&mdash;</span>
                )}
              </span>

              {/* Rating */}
              <span className="text-[11px] text-[#8b949e] font-mono shrink-0 w-8 text-right">
                {entry.rating.toFixed(1)}
              </span>

              {/* Form dots */}
              <div className="flex items-center gap-0.5 shrink-0">
                {entry.form.map((result, formIdx) => (
                  <span
                    key={formIdx}
                    className={`w-2 h-2 rounded-sm ${formColorMap[result]}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
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

  const breakingHeadlines = useMemo(() => {
    if (!gameState) return [];
    return generateBreakingHeadlines(gameState);
  }, [gameState, refreshKey]);

  const transferRumors = useMemo(() => {
    if (!gameState) return [];
    return generateTransferRumors(gameState);
  }, [gameState, refreshKey]);

  const socialReactionsMap = useMemo(() => {
    const map = new Map<string, SocialReaction[]>();
    if (!gameState) return map;
    for (const item of newsItems) {
      if (item.isHot) {
        map.set(item.id, generateSocialReactionsForItem(item, gameState));
      }
    }
    return map;
  }, [newsItems, gameState]);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'all':
        return newsItems;
      case 'transfer':
        return newsItems.filter(i => i.category === 'transfer');
      case 'results':
        return newsItems.filter(i => i.category === 'match');
      case 'rumours':
        return newsItems.filter(i => i.reliability === 'rumor');
      case 'international':
        return newsItems.filter(i => i.category === 'international');
      case 'injuries':
        return newsItems.filter(i => i.category === 'player');
      default:
        return newsItems;
    }
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: newsItems.length,
      transfer: newsItems.filter(i => i.category === 'transfer').length,
      match: newsItems.filter(i => i.category === 'match').length,
      rumors: newsItems.filter(i => i.reliability === 'rumor').length,
      international: newsItems.filter(i => i.category === 'international').length,
      your_club: newsItems.filter(i => i.relatedToClub).length,
    };
    return counts;
  }, [newsItems]);

  const featuredArticle = useMemo(() => {
    if (!gameState) return null;
    return generateFeaturedArticle(gameState);
  }, [gameState, refreshKey]);

  const transferRumorMillItems = useMemo(() => {
    if (!gameState) return [];
    return generateTransferRumorMill(gameState);
  }, [gameState, refreshKey]);

  const leagueRoundUpSummaries = useMemo(() => {
    if (!gameState) return [];
    return generateLeagueRoundUp(gameState);
  }, [gameState, refreshKey]);

  const powerRankingEntries = useMemo(() => {
    if (!gameState) return [];
    return generatePowerRankings(gameState);
  }, [gameState, refreshKey]);

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

        {/* Breaking News Banner */}
        <BreakingNewsBanner headlines={breakingHeadlines} />

        <div className="px-4 pt-3 space-y-3">
          {/* Featured Article Hero */}
          {featuredArticle && activeFilter === 'all' && (
            <FeaturedArticleHero article={featuredArticle} />
          )}

          {/* Transfer Rumor Mill */}
          {activeFilter === 'all' && (
            <TransferRumorMillSection
              items={transferRumorMillItems}
              playerClubName={currentClub.name}
            />
          )}

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
            className="flex items-center gap-0 overflow-x-auto pb-1 -mx-1 px-1 border-b border-[#21262d]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
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
                    shrink-0 px-3 py-2 text-xs font-medium transition-colors
                    border-b-2 -mb-px
                    ${isActive
                      ? 'text-emerald-400 border-emerald-500'
                      : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9]'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`ml-1 text-[10px] ${isActive ? 'text-emerald-400/60' : 'text-[#484f58]'}`}>
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
                  <NewsCard
                    key={item.id}
                    item={item}
                    index={index}
                    socialReactions={socialReactionsMap.get(item.id)}
                  />
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
          {/* League Round-Up */}
          {activeFilter === 'all' && (
            <LeagueRoundUpSection summaries={leagueRoundUpSummaries} />
          )}

          {/* Power Rankings */}
          {activeFilter === 'all' && (
            <PowerRankingsSection
              rankings={powerRankingEntries}
              playerClubName={currentClub.name}
            />
          )}

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

          {/* Transfer Rumor Section */}
          {transferRumors.length > 0 && activeFilter === 'all' && (
            <TransferRumorSection rumors={transferRumors} />
          )}

          {/* Transfer Rumor Section - also show on transfer/rumors filter */}
          {transferRumors.length > 0 && (activeFilter === 'transfer' || activeFilter === 'rumours') && (
            <TransferRumorSection rumors={transferRumors} />
          )}
        </div>
      </div>
    </div>
  );
}
