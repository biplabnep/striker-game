'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeftRight,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X,
  Shield,
  UserCheck,
  BarChart3,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  UserRound,
  Calendar,
  Eye,
  Swords,
  Timer,
  Wallet,
  Award,
  Activity,
  Play,
  Plus,
  ArrowDownRight,
} from 'lucide-react';
import { getClubsByLeague, ENRICHED_CLUBS, LEAGUES } from '@/lib/game/clubsData';
import { NATIONALITIES, generatePlayerName, POSITION_WEIGHTS } from '@/lib/game/playerData';
import { Position, PlayerAttributes } from '@/lib/game/types';

// ============================================================
// Seeded random number generator (deterministic per season/week)
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================
// Loan Candidate type
// ============================================================
interface LoanCandidate {
  id: string;
  name: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
  position: Position;
  overall: number;
  potential: number;
  currentClub: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    league: string;
  };
  loanType: 'Season Long' | 'Short Term';
  wageContribution: number; // 50-100%
  askingFee: number; // optional loan fee in millions
  guaranteedMinutes: boolean;
}

// ============================================================
// Active Loan type
// ============================================================
interface ActiveLoan {
  id: string;
  playerName: string;
  position: Position;
  overall: number;
  age: number;
  loanClub: {
    name: string;
    shortName: string;
    logo: string;
    league: string;
  };
  loanType: 'Season Long' | 'Short Term';
  startWeek: number;
  endWeek: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
}

// ============================================================
// Past Loan type
// ============================================================
interface PastLoan {
  id: string;
  playerName: string;
  position: Position;
  overall: number;
  originalClub: {
    name: string;
    shortName: string;
    logo: string;
  };
  loanClub: {
    name: string;
    shortName: string;
    logo: string;
  };
  season: number;
  duration: string;
  apps: number;
  goals: number;
  assists: number;
  averageRating: number;
  successRating: 'Successful' | 'Disappointing';
  improvement: number; // OVR improvement during loan
}

// ============================================================
// Position filter categories
// ============================================================
type PositionFilter = 'All' | 'GK' | 'DEF' | 'MID' | 'FWD';

const POSITION_FILTER_MAP: Record<string, Position[]> = {
  All: [],
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  FWD: ['LW', 'RW', 'ST', 'CF'],
};

// ============================================================
// Age filter
// ============================================================
type AgeFilter = 'Any' | 'U21' | 'U23';

// ============================================================
// Sort options
// ============================================================
type SortOption = 'rating_desc' | 'age_asc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Rating ↓', value: 'rating_desc' },
  { label: 'Age ↑', value: 'age_asc' },
];

// ============================================================
// OVR tier color
// ============================================================
function getOvrColor(ovr: number): string {
  if (ovr >= 85) return 'text-emerald-400';
  if (ovr >= 75) return 'text-sky-400';
  if (ovr >= 65) return 'text-amber-400';
  return 'text-[#8b949e]';
}

// ============================================================
// OVR tier bg
// ============================================================
function getOvrBg(ovr: number): string {
  if (ovr >= 85) return 'bg-emerald-500/15';
  if (ovr >= 75) return 'bg-sky-500/15';
  if (ovr >= 65) return 'bg-amber-500/15';
  return 'bg-[#21262d]';
}

// ============================================================
// Position accent color for card left border
// ============================================================
function getPositionAccent(pos: Position): string {
  if (pos === 'GK') return 'border-l-amber-500';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'border-l-sky-500';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'border-l-emerald-500';
  return 'border-l-red-400';
}

// ============================================================
// Format price in millions
// ============================================================
function formatPrice(millions: number): string {
  if (millions >= 1) {
    return `€${millions.toFixed(1)}M`;
  }
  return `€${Math.round(millions * 1000)}K`;
}

// ============================================================
// Generate loan candidates deterministically (~12)
// ============================================================
function generateLoanCandidates(season: number, week: number): LoanCandidate[] {
  const seed = season * 1000 + week * 13 + 99;
  const rng = seededRandom(seed);

  const allPositions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'LM', 'RM', 'ST', 'CF'];
  const leagues = ['premier_league', 'la_liga', 'serie_a', 'bundesliga', 'ligue_1'];

  const candidates: LoanCandidate[] = [];
  const usedClubIds = new Set<string>();
  const playerCount = 12;

  for (let i = 0; i < playerCount; i++) {
    const leagueIdx = Math.floor(rng() * leagues.length);
    const leagueId = leagues[leagueIdx];
    const leagueClubs = getClubsByLeague(leagueId);
    const availableClubs = leagueClubs.filter(c => !usedClubIds.has(c.id));

    if (availableClubs.length === 0) continue;

    const club = availableClubs[Math.floor(rng() * availableClubs.length)];
    usedClubIds.add(club.id);

    const position = allPositions[Math.floor(rng() * allPositions.length)];

    // Loan candidates tend to be younger
    const age = Math.floor(rng() * 9) + 18; // 18-26

    // Determine nationality based on league
    const leagueNatMap: Record<string, string> = {
      premier_league: 'England',
      la_liga: 'Spain',
      serie_a: 'Italy',
      bundesliga: 'Germany',
      ligue_1: 'France',
    };
    const nat = rng() < 0.5
      ? leagueNatMap[leagueId]
      : NATIONALITIES[Math.floor(rng() * NATIONALITIES.length)].name;

    const { firstName, lastName } = generatePlayerName(nat);
    const name = `${firstName} ${lastName}`;
    const natData = NATIONALITIES.find(n => n.name === nat);
    const nationalityFlag = natData?.flag ?? '🏴󠁧󠁢󠁥󠁮󠁧󠁿';

    // Generate attributes based on position
    const weights = POSITION_WEIGHTS[position];
    const baseOvr = 58 + Math.floor(rng() * 28); // 58-85
    const leagueBonus = leagueId === 'premier_league' || leagueId === 'la_liga' ? 4 : 0;

    const genAttr = (key: keyof PlayerAttributes): number => {
      const weight = weights[key] ?? 0.1;
      const base = Math.floor(baseOvr * 0.6 + weight * baseOvr * 0.4 + leagueBonus);
      const variance = Math.floor(rng() * 12) - 6;
      return Math.max(35, Math.min(95, base + variance));
    };

    const attributes: PlayerAttributes = {
      pace: genAttr('pace'),
      shooting: genAttr('shooting'),
      passing: genAttr('passing'),
      dribbling: genAttr('dribbling'),
      defending: genAttr('defending'),
      physical: genAttr('physical'),
    };

    // Calculate OVR
    let totalWeight = 0;
    let weightedSum = 0;
    (Object.keys(weights) as (keyof PlayerAttributes)[]).forEach(key => {
      const w = weights[key];
      const v = attributes[key];
      if (v !== undefined && w !== undefined && w > 0) {
        weightedSum += v * w;
        totalWeight += w;
      }
    });
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 65;
    const potential = Math.min(99, overall + Math.floor(rng() * 10) + 3);

    const loanType = rng() < 0.65 ? 'Season Long' : 'Short Term';
    const wageContribution = [50, 60, 75, 80, 85, 100][Math.floor(rng() * 6)];
    const askingFee = rng() < 0.4 ? Math.round((1 + rng() * 8) * 10) / 10 : 0;
    const guaranteedMinutes = rng() < 0.5;

    candidates.push({
      id: `loan_candidate_${club.id}_${i}`,
      name,
      age,
      nationality: nat,
      nationalityFlag,
      position,
      overall,
      potential,
      currentClub: {
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        logo: club.logo,
        league: leagueId,
      },
      loanType,
      wageContribution,
      askingFee,
      guaranteedMinutes,
    });
  }

  return candidates;
}

// ============================================================
// Generate active loans deterministically (2-3)
// ============================================================
function generateActiveLoans(season: number, week: number): ActiveLoan[] {
  const seed = season * 777 + week * 11 + 42;
  const rng = seededRandom(seed);

  const playerNames = [
    { name: 'Adrian Silva', pos: 'CM' as Position, ovr: 72, age: 22 },
    { name: 'Luca Bianchi', pos: 'CB' as Position, ovr: 68, age: 20 },
    { name: 'Kevin Hoffmann', pos: 'ST' as Position, ovr: 74, age: 23 },
  ];

  const clubs = ENRICHED_CLUBS;
  const usedClubs = new Set<string>();
  const loanCount = 2 + Math.floor(rng() * 2); // 2-3
  const loans: ActiveLoan[] = [];

  for (let i = 0; i < loanCount && i < playerNames.length; i++) {
    let clubIdx = Math.floor(rng() * clubs.length);
    let attempts = 0;
    while (usedClubs.has(clubs[clubIdx].id) && attempts < 20) {
      clubIdx = Math.floor(rng() * clubs.length);
      attempts++;
    }
    if (usedClubs.has(clubs[clubIdx].id)) continue;

    const club = clubs[clubIdx];
    usedClubs.add(club.id);

    const startWeek = Math.max(1, week - Math.floor(rng() * 12) - 4);
    const duration = rng() < 0.6 ? (38 - startWeek) : Math.floor(rng() * 16) + 10;
    const endWeek = Math.min(38, startWeek + duration);
    const elapsed = week - startWeek;
    const totalDuration = endWeek - startWeek;

    loans.push({
      id: `active_loan_${i}`,
      playerName: playerNames[i].name,
      position: playerNames[i].pos,
      overall: playerNames[i].ovr,
      age: playerNames[i].age,
      loanClub: {
        name: club.name,
        shortName: club.shortName,
        logo: club.logo,
        league: club.league,
      },
      loanType: totalDuration >= 20 ? 'Season Long' : 'Short Term',
      startWeek,
      endWeek,
      gamesPlayed: Math.max(0, Math.floor(elapsed * (0.5 + rng() * 0.5))),
      goals: Math.floor(rng() * Math.max(1, elapsed * 0.3)),
      assists: Math.floor(rng() * Math.max(1, elapsed * 0.2)),
      averageRating: Math.round((6.2 + rng() * 2.3) * 10) / 10,
    });
  }

  return loans;
}

// ============================================================
// Generate past loans deterministically (4-5)
// ============================================================
function generatePastLoans(season: number): PastLoan[] {
  const seed = season * 555 + 88;
  const rng = seededRandom(seed);

  const pastLoanData = [
    { name: 'Carlos Fernandez', pos: 'CAM' as Position, ovr: 76, origClubIdx: 0, loanClubIdx: 5, season: season - 1, apps: 28, goals: 5, assists: 8, rating: 7.1, improvement: 3 },
    { name: 'James Mitchell', pos: 'RB' as Position, ovr: 69, origClubIdx: 2, loanClubIdx: 10, season: season - 1, apps: 15, goals: 0, assists: 2, rating: 6.2, improvement: 1 },
    { name: 'Tom O\'Brien', pos: 'ST' as Position, ovr: 72, origClubIdx: 1, loanClubIdx: 8, season: season - 2, apps: 32, goals: 14, assists: 4, rating: 7.6, improvement: 5 },
    { name: 'Marco Rossi', pos: 'CM' as Position, ovr: 70, origClubIdx: 3, loanClubIdx: 15, season: season - 2, apps: 20, goals: 2, assists: 3, rating: 6.5, improvement: 2 },
    { name: 'David Williams', pos: 'LB' as Position, ovr: 67, origClubIdx: 4, loanClubIdx: 12, season: season - 1, apps: 18, goals: 0, assists: 5, rating: 6.8, improvement: 4 },
  ];

  const clubs = ENRICHED_CLUBS;
  const loans: PastLoan[] = [];

  for (let i = 0; i < pastLoanData.length; i++) {
    const d = pastLoanData[i];
    const origClub = clubs[d.origClubIdx % clubs.length];
    const loanClub = clubs[d.loanClubIdx % clubs.length];

    if (origClub.id === loanClub.id) continue;

    const successThreshold = 7.0;
    const successRating = d.rating >= successThreshold ? 'Successful' : 'Disappointing';

    loans.push({
      id: `past_loan_${i}`,
      playerName: d.name,
      position: d.pos,
      overall: d.ovr,
      originalClub: {
        name: origClub.name,
        shortName: origClub.shortName,
        logo: origClub.logo,
      },
      loanClub: {
        name: loanClub.name,
        shortName: loanClub.shortName,
        logo: loanClub.logo,
      },
      season: d.season,
      duration: d.apps > 25 ? 'Season Long' : 'Short Term',
      apps: d.apps,
      goals: d.goals,
      assists: d.assists,
      averageRating: d.rating,
      successRating,
      improvement: d.improvement,
    });
  }

  return loans;
}

// ============================================================
// Generate popular loan destination clubs
// ============================================================
function generatePopularDestinations(season: number): { club: typeof ENRICHED_CLUBS[0]; count: number }[] {
  const seed = season * 333 + 22;
  const rng = seededRandom(seed);

  const destinations = [
    { clubIdx: 8, count: 12 },
    { clubIdx: 18, count: 9 },
    { clubIdx: 25, count: 8 },
    { clubIdx: 10, count: 7 },
    { clubIdx: 32, count: 6 },
  ];

  return destinations.map(d => {
    const club = ENRICHED_CLUBS[d.clubIdx % ENRICHED_CLUBS.length];
    return {
      club,
      count: d.count + Math.floor(rng() * 3),
    };
  }).sort((a, b) => b.count - a.count);
}

// ============================================================
// Loan Summary Stats Card
// ============================================================
function LoanSummaryStats({ activeCount, totalGoals, successPct }: { activeCount: number; totalGoals: number; successPct: number }) {
  const stats = [
    {
      icon: <UserRound className="h-4 w-4 text-emerald-400" />,
      label: 'Active Loans',
      value: activeCount.toString(),
      trend: '+1 this month',
      trendUp: true,
    },
    {
      icon: <Target className="h-4 w-4 text-sky-400" />,
      label: 'Loan Goals',
      value: totalGoals.toString(),
      trend: '+4 this season',
      trendUp: true,
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-amber-400" />,
      label: 'Success Rate',
      value: `${successPct}%`,
      trend: 'Above average',
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: idx * 0.04 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-center"
        >
          <div className="flex justify-center mb-1">{stat.icon}</div>
          <p className="text-lg font-bold text-[#c9d1d9]">{stat.value}</p>
          <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            {stat.trendUp ? (
              <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-red-400" />
            )}
            <span className={`text-[8px] ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>{stat.trend}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// Popular Loan Destinations
// ============================================================
function PopularLoanDestinations({ destinations }: { destinations: { club: typeof ENRICHED_CLUBS[0]; count: number }[] }) {
  const maxCount = destinations.length > 0 ? destinations[0].count : 1;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Popular Loan Destinations</span>
      </div>
      <div className="space-y-2">
        {destinations.map((dest, idx) => {
          const pct = (dest.count / maxCount) * 100;
          return (
            <motion.div
              key={dest.club.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.04 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm w-5 text-center">{dest.club.logo}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-[#c9d1d9] truncate">{dest.club.name}</span>
                  <span className="text-[9px] text-[#8b949e] flex-shrink-0">{dest.count} loans</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="h-full bg-emerald-500/70 rounded-sm"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Loan Fee Saved Card
// ============================================================
function LoanFeeSavedCard({ season }: { season: number }) {
  const seed = season * 200 + 55;
  const rng = seededRandom(seed);

  const estimatedSavings = Math.round((8 + rng() * 35) * 10) / 10; // millions
  const permanentCost = Math.round(estimatedSavings * 3.2 * 10) / 10;
  const loanCost = Math.round(estimatedSavings * 0.4 * 10) / 10;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan Fee Saved</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[10px] text-[#8b949e]">Estimated savings from loans vs permanent transfers</p>
          <div className="mt-1.5 flex items-center gap-3">
            <div>
              <span className="text-[9px] text-red-400">Perm. cost</span>
              <p className="text-xs font-bold text-[#c9d1d9]">{formatPrice(permanentCost)}</p>
            </div>
            <ArrowRight className="h-3 w-3 text-[#484f58]" />
            <div>
              <span className="text-[9px] text-emerald-400">Loan cost</span>
              <p className="text-xs font-bold text-emerald-400">{formatPrice(loanCost)}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-[#484f58]">Saved</span>
          <p className="text-xl font-bold text-emerald-400">{formatPrice(estimatedSavings)}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Youth Loan Opportunities
// ============================================================
function YouthLoanOpportunities({ candidates }: { candidates: LoanCandidate[] }) {
  const youthPlayers = candidates.filter(p => p.age <= 21);

  if (youthPlayers.length === 0) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Youth Loan Opportunities</span>
        <Badge className="text-[8px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border border-amber-500/25">U21</Badge>
      </div>
      <div className="space-y-2">
        {youthPlayers.slice(0, 4).map((player, idx) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: idx * 0.04 }}
            className={`flex items-center gap-3 bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 border-l-2 ${getPositionAccent(player.position)}`}
          >
            <div className={`${getOvrBg(player.overall)} rounded-lg px-2 py-1.5 text-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#c9d1d9] truncate">{player.name}</p>
                <Badge className="text-[8px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e] flex-shrink-0">{player.position}</Badge>
              </div>
              <p className="text-[10px] text-[#8b949e]">
                {player.currentClub.logo} {player.currentClub.shortName} · {player.nationalityFlag} {player.age}y
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-emerald-400 font-medium">+{player.potential - player.overall} POT</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Recall Confirmation Button
// ============================================================
function RecallButton({ playerName, onRecall }: { playerName: string; onRecall: () => void }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = useCallback(() => {
    if (confirming) {
      onRecall();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  }, [confirming, onRecall]);

  return (
    <Button
      onClick={handleClick}
      size="sm"
      className={`w-full text-xs h-7 transition-all duration-200 ${
        confirming
          ? 'bg-red-500 hover:bg-red-400 text-white ring-2 ring-red-400/50'
          : 'bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58]'
      }`}
      variant={!confirming ? 'outline' : undefined}
    >
      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.span
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Confirm Recall {playerName.split(' ')[0]}?
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" />
            Recall
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

// ============================================================
// Mock Scout Board Targets
// ============================================================
interface ScoutTarget {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  age: number;
  club: string;
  league: string;
  loanType: 'Season Long' | 'Short Term' | 'Emergency';
  wageContribution: number;
}

const SCOUT_TARGETS: ScoutTarget[] = [
  { id: 'scout_1', name: 'Matteo Guerra', position: 'CM', ovr: 77, age: 21, club: 'Atalanta', league: 'Serie A', loanType: 'Season Long', wageContribution: 70 },
  { id: 'scout_2', name: 'Armando Broja', position: 'ST', ovr: 74, age: 22, club: 'Chelsea', league: 'Premier League', loanType: 'Short Term', wageContribution: 85 },
  { id: 'scout_3', name: 'Seko Fofana', position: 'CDM', ovr: 79, age: 24, club: 'Lens', league: 'Ligue 1', loanType: 'Season Long', wageContribution: 60 },
  { id: 'scout_4', name: 'Ivan Fresneda', position: 'RB', ovr: 73, age: 19, club: 'Valladolid', league: 'La Liga', loanType: 'Emergency', wageContribution: 50 },
  { id: 'scout_5', name: 'Jamie Bynoe-Gittens', position: 'LW', ovr: 76, age: 20, club: 'Dortmund', league: 'Bundesliga', loanType: 'Season Long', wageContribution: 75 },
  { id: 'scout_6', name: 'Leo Ostigard', position: 'CB', ovr: 75, age: 23, club: 'Brighton', league: 'Premier League', loanType: 'Short Term', wageContribution: 80 },
];

type ScoutSort = 'ovr_desc' | 'age_asc' | 'wage_asc';

// ============================================================
// Loan Market Scout Board
// ============================================================
function LoanMarketScoutBoard() {
  const [posFilter, setPosFilter] = useState<string>('All');
  const [ovrMin, setOvrMin] = useState(65);
  const [leagueFilter, setLeagueFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<ScoutSort>('ovr_desc');

  const filtered = useMemo(() => {
    let list = [...SCOUT_TARGETS];
    if (posFilter !== 'All') {
      const map: Record<string, Position[]> = { GK: ['GK'], DEF: ['CB', 'LB', 'RB'], MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'], FWD: ['LW', 'RW', 'ST', 'CF'] };
      const allowed = map[posFilter] ?? [];
      list = list.filter(p => allowed.includes(p.position));
    }
    list = list.filter(p => p.ovr >= ovrMin);
    if (leagueFilter !== 'All') {
      list = list.filter(p => p.league === leagueFilter);
    }
    switch (sortBy) {
      case 'ovr_desc': list.sort((a, b) => b.ovr - a.ovr); break;
      case 'age_asc': list.sort((a, b) => a.age - b.age); break;
      case 'wage_asc': list.sort((a, b) => a.wageContribution - b.wageContribution); break;
    }
    return list;
  }, [posFilter, ovrMin, leagueFilter, sortBy]);

  const leagues = ['All', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan Market Scout Board</span>
      </div>

      {/* Filter Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {(['All', 'GK', 'DEF', 'MID', 'FWD'] as const).map(p => (
            <button key={p} onClick={() => setPosFilter(p)} className={`px-2 py-0.5 text-[9px] font-medium rounded-md border transition-colors ${posFilter === p ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#484f58] flex-shrink-0">OVR ≥ {ovrMin}</span>
          <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
            <div className="h-full bg-emerald-500/50 rounded-sm" style={{ width: `${((ovrMin - 60) / 30) * 100}%` }} />
          </div>
          <input type="range" min={60} max={90} value={ovrMin} onChange={e => setOvrMin(Number(e.target.value))} className="w-16 h-1 accent-emerald-500" />
        </div>
        <div className="flex flex-wrap gap-1">
          {leagues.map(l => (
            <button key={l} onClick={() => setLeagueFilter(l)} className={`px-2 py-0.5 text-[9px] font-medium rounded-md border transition-colors ${leagueFilter === l ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'}`}>{l === 'All' ? 'All' : l.split(' ')[0]}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {([['ovr_desc', 'OVR ↓'], ['age_asc', 'Age ↑'], ['wage_asc', 'Wage ↑']] as [ScoutSort, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)} className={`px-2 py-0.5 text-[9px] font-medium rounded-md border transition-colors ${sortBy === val ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* 2-Col Grid of Scout Cards */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((player, idx) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: idx * 0.04 }}
            className={`bg-[#0d1117] border border-[#21262d] border-l-2 ${getPositionAccent(player.position)} rounded-lg p-2.5 flex flex-col gap-1.5`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${getOvrColor(player.ovr)}`}>{player.ovr}</span>
              <Badge className={`text-[7px] px-1 py-0 ${player.loanType === 'Season Long' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : player.loanType === 'Emergency' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{player.loanType}</Badge>
            </div>
            <p className="text-[11px] font-semibold text-[#c9d1d9] truncate">{player.name}</p>
            <div className="flex items-center gap-1">
              <Badge className="text-[7px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e]">{player.position}</Badge>
              <span className="text-[9px] text-[#8b949e]">{player.age}y · {player.league.split(' ')[0]}</span>
            </div>
            <p className="text-[9px] text-[#8b949e]">{player.club}</p>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[#484f58]">Wage contrib.</span>
              <span className="text-[#c9d1d9] font-medium">{player.wageContribution}%</span>
            </div>
            <Button className="w-full h-6 text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-md mt-0.5">
              Make Offer
            </Button>
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-[10px] text-[#484f58] py-4">No targets match filters</p>
      )}
    </motion.div>
  );
}

// ============================================================
// Mock Comparison Data
// ============================================================
interface ComparisonPlayer {
  name: string;
  position: Position;
  overall: number;
  potential: number;
  age: number;
  weeklyWageK: number;
  playingTimeGuarantee: number; // 0-100
  developmentRating: number; // 0-100
}

const COMPARISON_PLAYERS: ComparisonPlayer[] = [
  { name: 'Matteo Guerra', position: 'CM', overall: 77, potential: 84, age: 21, weeklyWageK: 45, playingTimeGuarantee: 80, developmentRating: 88 },
  { name: 'Armando Broja', position: 'ST', overall: 74, potential: 82, age: 22, weeklyWageK: 55, playingTimeGuarantee: 65, developmentRating: 78 },
  { name: 'Ivan Fresneda', position: 'RB', overall: 73, potential: 86, age: 19, weeklyWageK: 30, playingTimeGuarantee: 90, developmentRating: 92 },
];

// ============================================================
// Loan Comparison Matrix
// ============================================================
function LoanComparisonMatrix() {
  const metrics = [
    { key: 'overall', label: 'Overall', max: 99, best: 'highest' as const },
    { key: 'potential', label: 'Potential', max: 99, best: 'highest' as const },
    { key: 'age', label: 'Age', max: 30, best: 'lowest' as const },
    { key: 'weeklyWageK', label: 'Wage (K/wk)', max: 80, best: 'lowest' as const },
    { key: 'playingTimeGuarantee', label: 'Playing Time %', max: 100, best: 'highest' as const },
    { key: 'developmentRating', label: 'Dev. Rating', max: 100, best: 'highest' as const },
  ];

  const playerColors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500'];
  const playerColorsLight = ['bg-emerald-500/20', 'bg-sky-500/20', 'bg-amber-500/20'];

  const recommendedIdx = COMPARISON_PLAYERS.reduce((best, p, i) => {
    const score = p.developmentRating * 0.4 + p.potential * 0.3 + p.playingTimeGuarantee * 0.2 + (1 - p.weeklyWageK / 80) * 100 * 0.1;
    const bestScore = COMPARISON_PLAYERS[best].developmentRating * 0.4 + COMPARISON_PLAYERS[best].potential * 0.3 + COMPARISON_PLAYERS[best].playingTimeGuarantee * 0.2 + (1 - COMPARISON_PLAYERS[best].weeklyWageK / 80) * 100 * 0.1;
    return score > bestScore ? i : best;
  }, 0);

  const getBarWidth = (value: number, max: number) => Math.max(4, (value / max) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Swords className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan Comparison Matrix</span>
      </div>

      {/* Player Headers */}
      <div className="flex items-stretch gap-2">
        <div className="w-20 flex-shrink-0" />
        <div className="flex-1 flex gap-2">
          {COMPARISON_PLAYERS.map((p, i) => (
            <div key={p.name} className={`flex-1 bg-[#0d1117] border rounded-md p-2 text-center ${i === recommendedIdx ? 'border-emerald-500/40' : 'border-[#21262d]'}`}>
              {i === recommendedIdx && (
                <Badge className="text-[7px] px-1.5 py-0 mb-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 mx-auto block w-fit">
                  <Award className="h-2.5 w-2.5 inline mr-0.5" /> Recommended Pick
                </Badge>
              )}
              <p className="text-[10px] font-semibold text-[#c9d1d9] truncate">{p.name}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className={`text-xs font-bold ${getOvrColor(p.overall)}`}>{p.overall}</span>
                <Badge className="text-[7px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e]">{p.position}</Badge>
              </div>
              <div className={`h-1 mt-1.5 rounded-sm ${playerColors[i]}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Rows */}
      <div className="space-y-2">
        {metrics.map(metric => {
          const values = COMPARISON_PLAYERS.map(p => {
            const val = p[metric.key as keyof ComparisonPlayer] as number;
            return val;
          });
          const bestVal = metric.best === 'highest'
            ? Math.max(...values)
            : Math.min(...values);

          return (
            <div key={metric.key} className="flex items-center gap-2">
              <span className="text-[9px] text-[#8b949e] w-20 flex-shrink-0 text-right">{metric.label}</span>
              <div className="flex-1 flex gap-2">
                {COMPARISON_PLAYERS.map((p, i) => {
                  const val = values[i];
                  const isBest = val === bestVal;
                  const barW = getBarWidth(val, metric.max);
                  return (
                    <div key={p.name} className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-3 bg-[#21262d] rounded-sm overflow-hidden relative">
                        <div
                          className={`h-full rounded-sm ${isBest ? playerColors[i] : playerColorsLight[i]} transition-all duration-300`}
                          style={{ width: `${barW}%` }}
                        />
                        <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${isBest ? 'text-white' : 'text-[#c9d1d9]'}`}>
                          {metric.key === 'weeklyWageK' ? `€${val}K` : val}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// Mock Timeline Data
// ============================================================
interface TimelineEntry {
  id: string;
  club: string;
  league: string;
  season: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  successRating: 'Excellent' | 'Good' | 'Average' | 'Poor';
}

const TIMELINE_ENTRIES: TimelineEntry[] = [
  { id: 'tl_1', club: 'Brentford', league: 'Championship', season: 1, gamesPlayed: 32, goals: 14, assists: 4, successRating: 'Excellent' },
  { id: 'tl_2', club: 'Lille', league: 'Ligue 1', season: 2, gamesPlayed: 28, goals: 5, assists: 8, successRating: 'Good' },
  { id: 'tl_3', club: 'Real Betis', league: 'La Liga', season: 3, gamesPlayed: 15, goals: 0, assists: 2, successRating: 'Average' },
  { id: 'tl_4', club: 'Wolves', league: 'Premier League', season: 4, gamesPlayed: 20, goals: 2, assists: 3, successRating: 'Good' },
];

const SUCCESS_COLORS: Record<string, string> = {
  Excellent: 'border-emerald-500 bg-emerald-500',
  Good: 'bg-sky-500',
  Average: 'bg-amber-500',
  Poor: 'bg-red-500',
};

const SUCCESS_TEXT_COLORS: Record<string, string> = {
  Excellent: 'text-emerald-400',
  Good: 'text-sky-400',
  Average: 'text-amber-400',
  Poor: 'text-red-400',
};

// ============================================================
// Loan History Timeline
// ============================================================
function LoanHistoryTimeline() {
  const totalGoals = TIMELINE_ENTRIES.reduce((s, e) => s + e.goals, 0);
  const totalAssists = TIMELINE_ENTRIES.reduce((s, e) => s + e.assists, 0);
  const avgRating = TIMELINE_ENTRIES.reduce((s, e) => s + (e.goals + e.assists) / Math.max(1, e.gamesPlayed) * 10, 0) / TIMELINE_ENTRIES.length;

  const trajectoryScores = TIMELINE_ENTRIES.map(e => (e.goals + e.assists * 0.5) / Math.max(1, e.gamesPlayed));
  const recentAvg = (trajectoryScores[2] + trajectoryScores[3]) / 2;
  const olderAvg = (trajectoryScores[0] + trajectoryScores[1]) / 2;
  const trajectory = recentAvg > olderAvg + 0.02 ? 'Improving' : recentAvg < olderAvg - 0.02 ? 'Declining' : 'Plateauing';
  const trajectoryColor = trajectory === 'Improving' ? 'text-emerald-400' : trajectory === 'Declining' ? 'text-red-400' : 'text-amber-400';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan History Timeline</span>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-0">
        {/* Connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#30363d]" />

        {TIMELINE_ENTRIES.map((entry, idx) => {
          const dotColor = SUCCESS_COLORS[entry.successRating];
          const textColor = SUCCESS_TEXT_COLORS[entry.successRating];
          const isLast = idx === TIMELINE_ENTRIES.length - 1;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.06 }}
              className={isLast ? 'relative pb-0' : 'relative pb-4'}
            >
              {/* Dot */}
              <div className={`absolute left-[-18px] top-1.5 w-3.5 h-3.5 rounded-sm ${dotColor} flex items-center justify-center`}>
                <div className="w-1.5 h-1.5 rounded-sm bg-[#0d1117]" />
              </div>

              {/* Card */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#c9d1d9]">{entry.club}</p>
                  <Badge className={`text-[7px] px-1.5 py-0 ${textColor} border border-current/20`}>{entry.successRating}</Badge>
                </div>
                <p className="text-[9px] text-[#8b949e] mb-1.5">{entry.league} · Season {entry.season}</p>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="text-[#8b949e]"><strong className="text-[#c9d1d9]">{entry.gamesPlayed}</strong> apps</span>
                  <span className="text-emerald-400"><strong>{entry.goals}</strong> goals</span>
                  <span className="text-sky-400"><strong>{entry.assists}</strong> ast</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Career Trajectory & Summary */}
      <div className="flex items-center justify-between bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
        <div>
          <span className="text-[9px] text-[#484f58]">Career Trajectory</span>
          <div className="flex items-center gap-1">
            <Activity className={`h-3 w-3 ${trajectoryColor}`} />
            <span className={`text-[11px] font-semibold ${trajectoryColor}`}>{trajectory}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-sm font-bold text-[#c9d1d9]">{TIMELINE_ENTRIES.length}</p>
            <p className="text-[8px] text-[#484f58]">Total Spells</p>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">{totalGoals}</p>
            <p className="text-[8px] text-[#484f58]">Total Goals</p>
          </div>
          <div>
            <p className="text-sm font-bold text-sky-400">{totalAssists}</p>
            <p className="text-[8px] text-[#484f58]">Total Assists</p>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">{avgRating.toFixed(1)}</p>
            <p className="text-[8px] text-[#484f58]">Avg Rating</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Loan Performance Tracker
// ============================================================
function LoanPerformanceTracker() {
  const trackerData = {
    playerName: 'Adrian Silva',
    position: 'CM' as Position,
    destinationClub: 'Southampton',
    startWeek: 4,
    endWeek: 38,
    currentWeek: 22,
    gamesPlayed: 12,
    expectedGames: 18,
    goals: 2,
    targetGoals: 5,
    avgRating: 6.9,
    expectedRating: 6.5,
    ovrStart: 72,
    ovrCurrent: 74,
  };

  const gamesPct = Math.min(100, (trackerData.gamesPlayed / trackerData.expectedGames) * 100);
  const goalsPct = Math.min(100, (trackerData.goals / trackerData.targetGoals) * 100);
  const ratingPct = Math.min(100, (trackerData.avgRating / 10) * 100);
  const durationPct = ((trackerData.currentWeek - trackerData.startWeek) / (trackerData.endWeek - trackerData.startWeek)) * 100;

  const perfBars = [
    { label: 'Matches Played vs Expected', current: trackerData.gamesPlayed, target: trackerData.expectedGames, pct: gamesPct, color: 'bg-emerald-500', overColor: 'text-emerald-400' },
    { label: 'Goals vs Target', current: trackerData.goals, target: trackerData.targetGoals, pct: goalsPct, color: 'bg-sky-500', overColor: 'text-sky-400' },
    { label: 'Avg Rating vs Expected', current: trackerData.avgRating, target: trackerData.expectedRating, pct: ratingPct, color: 'bg-amber-500', overColor: 'text-amber-400', isDecimal: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan Performance Tracker</span>
      </div>

      {/* Current Loan Card */}
      <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`${getOvrBg(trackerData.ovrCurrent)} rounded-md px-2 py-1 text-center`}>
            <span className={`text-sm font-bold ${getOvrColor(trackerData.ovrCurrent)}`}>{trackerData.ovrCurrent}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#c9d1d9]">{trackerData.playerName}</p>
            <p className="text-[9px] text-[#8b949e]">{trackerData.destinationClub} · {trackerData.position}</p>
          </div>
          <Badge className="text-[8px] px-1.5 py-0 bg-sky-500/10 text-sky-400 border border-sky-500/20 flex-shrink-0">
            <Play className="h-2.5 w-2.5 inline mr-0.5" /> Active
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#161b22] rounded-md p-1.5">
            <p className="text-[8px] text-[#484f58]">Weeks Left</p>
            <p className="text-xs font-bold text-[#c9d1d9]">{trackerData.endWeek - trackerData.currentWeek}</p>
          </div>
          <div className="bg-[#161b22] rounded-md p-1.5">
            <p className="text-[8px] text-[#484f58]">Games Left</p>
            <p className="text-xs font-bold text-[#c9d1d9]">{trackerData.expectedGames - trackerData.gamesPlayed}</p>
          </div>
          <div className="bg-[#161b22] rounded-md p-1.5">
            <p className="text-[8px] text-[#484f58]">Duration</p>
            <p className="text-xs font-bold text-[#c9d1d9]">{Math.round(durationPct)}%</p>
          </div>
        </div>
      </div>

      {/* Performance Bars */}
      <div className="space-y-2">
        {perfBars.map((bar, idx) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-[#8b949e]">{bar.label}</span>
              <span className="text-[9px] text-[#c9d1d9]">{bar.isDecimal ? bar.current.toFixed(1) : bar.current}/{bar.isDecimal ? bar.target.toFixed(1) : bar.target}</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct}%` }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`h-full rounded-sm ${bar.color}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Development Progress */}
      <div className="flex items-center justify-between bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
        <div>
          <span className="text-[9px] text-[#484f58]">OVR Change Since Loan Start</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[#8b949e]">{trackerData.ovrStart}</span>
            <ArrowRight className="h-2.5 w-2.5 text-[#484f58]" />
            <span className="text-xs font-bold text-emerald-400">{trackerData.ovrCurrent}</span>
            <Badge className="text-[8px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Plus className="h-2.5 w-2.5 inline mr-0.5" />{trackerData.ovrCurrent - trackerData.ovrStart}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1 h-7 text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 rounded-md">
          <XCircle className="h-3 w-3 mr-1" /> Recall from Loan
        </Button>
        <Button className="flex-1 h-7 text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-md">
          <Plus className="h-3 w-3 mr-1" /> Extend Loan
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Loan Financial Impact
// ============================================================
function LoanFinancialImpact() {
  const finData = {
    wagesSavedOut: 2400000,
    wagesCostIn: 1800000,
    loanFeesOut: 350000,
    loanFeesIn: 800000,
    totalNetSaving: 50000,
    projectedSeasonSaving: 120000,
  };

  const fmtMoney = (val: number) => val >= 1000000 ? `€${(val / 1000000).toFixed(1)}M` : `€${(val / 1000).toFixed(0)}K`;
  const budgetMax = Math.max(finData.wagesSavedOut, finData.wagesCostIn, finData.loanFeesOut + finData.loanFeesIn) * 1.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2 }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Loan Financial Impact</span>
      </div>

      {/* Income vs Expense */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <ArrowDownRight className="h-2.5 w-2.5 text-emerald-400" />
            <span className="text-[9px] text-[#484f58]">Wage Savings (Loaned Out)</span>
          </div>
          <p className="text-sm font-bold text-emerald-400">{fmtMoney(finData.wagesSavedOut)}</p>
          <div className="h-1.5 bg-[#21262d] rounded-sm mt-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-sm" style={{ width: `${(finData.wagesSavedOut / budgetMax) * 100}%` }} />
          </div>
        </div>
        <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <DollarSign className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-[9px] text-[#484f58]">Wage Cost (Loaned In)</span>
          </div>
          <p className="text-sm font-bold text-amber-400">{fmtMoney(finData.wagesCostIn)}</p>
          <div className="h-1.5 bg-[#21262d] rounded-sm mt-1.5 overflow-hidden">
            <div className="h-full bg-amber-500/60 rounded-sm" style={{ width: `${(finData.wagesCostIn / budgetMax) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Loan Fee Breakdown */}
      <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5 space-y-2">
        <p className="text-[9px] text-[#484f58] font-semibold uppercase tracking-wide">Loan Fee Breakdown</p>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e]">Fees received (loaning out)</span>
          <span className="text-emerald-400 font-medium">{fmtMoney(finData.loanFeesOut)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e]">Fees paid (loaning in)</span>
          <span className="text-red-400 font-medium">-{fmtMoney(finData.loanFeesIn)}</span>
        </div>
        <div className="border-t border-[#21262d] pt-1.5 flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e] font-medium">Net Fee Impact</span>
          <span className="text-red-400 font-medium">-{fmtMoney(finData.loanFeesIn - finData.loanFeesOut)}</span>
        </div>
      </div>

      {/* Future Projection */}
      <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[#484f58]">Projected Season Savings</span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{fmtMoney(finData.projectedSeasonSaving)}</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-[#484f58]">Current Net Position</span>
            <p className={`text-base font-bold mt-0.5 ${finData.totalNetSaving >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {finData.totalNetSaving >= 0 ? '+' : ''}{fmtMoney(finData.totalNetSaving)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Impact Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-[#484f58]">Budget Impact</span>
          <span className="text-[9px] text-emerald-400 font-medium">Positive</span>
        </div>
        <div className="h-3 bg-[#21262d] rounded-sm overflow-hidden relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#484f58]" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '54%' }}
            transition={{ duration: 0.4 }}
            className="h-full bg-emerald-500/50 rounded-sm"
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-red-400">Cost</span>
          <span className="text-[8px] text-emerald-400">Saving</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main LoanSystem Component
// ============================================================
export default function LoanSystem() {
  const gameState = useGameStore(state => state.gameState);
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentClub = gameState?.currentClub;

  const [positionFilter, setPositionFilter] = useState<PositionFilter>('All');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Any');
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [requestingLoan, setRequestingLoan] = useState<string | null>(null);
  const [recallSuccess, setRecallSuccess] = useState<string | null>(null);

  // Generate data deterministically
  const allCandidates = useMemo(() => generateLoanCandidates(currentSeason, currentWeek), [currentSeason, currentWeek]);
  const activeLoans = useMemo(() => generateActiveLoans(currentSeason, currentWeek), [currentSeason, currentWeek]);
  const pastLoans = useMemo(() => generatePastLoans(currentSeason), [currentSeason]);
  const popularDestinations = useMemo(() => generatePopularDestinations(currentSeason), [currentSeason]);

  // Summary stats
  const totalActiveGoals = useMemo(() => activeLoans.reduce((sum, l) => sum + l.goals, 0), [activeLoans]);
  const successfulPastLoans = useMemo(() => pastLoans.filter(l => l.successRating === 'Successful').length, [pastLoans]);
  const successPct = useMemo(() => pastLoans.length > 0 ? Math.round((successfulPastLoans / pastLoans.length) * 100) : 0, [pastLoans, successfulPastLoans]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    let players = [...allCandidates];

    // Position filter
    if (positionFilter !== 'All') {
      const allowedPos = POSITION_FILTER_MAP[positionFilter] ?? [];
      players = players.filter(p => allowedPos.includes(p.position));
    }

    // League filter
    if (leagueFilter) {
      players = players.filter(p => p.currentClub.league === leagueFilter);
    }

    // Age filter
    if (ageFilter === 'U21') {
      players = players.filter(p => p.age <= 21);
    } else if (ageFilter === 'U23') {
      players = players.filter(p => p.age <= 23);
    }

    // Sort
    switch (sortOption) {
      case 'rating_desc':
        players.sort((a, b) => b.overall - a.overall);
        break;
      case 'age_asc':
        players.sort((a, b) => a.age - b.age);
        break;
    }

    return players;
  }, [allCandidates, positionFilter, leagueFilter, ageFilter, sortOption]);

  const handleRequestLoan = useCallback((playerId: string) => {
    setRequestingLoan(playerId);
    setTimeout(() => setRequestingLoan(null), 1500);
  }, []);

  const handleRecall = useCallback((playerName: string) => {
    setRecallSuccess(playerName);
    setTimeout(() => setRecallSuccess(null), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-[#c9d1d9]">Loan Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              S{currentSeason}
            </Badge>
            <Badge className="text-[10px] px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {activeLoans.length} Active
            </Badge>
          </div>
        </div>
        <p className="text-xs text-[#8b949e]">Browse loan targets, track active loans & manage deals</p>
      </div>

      {/* Loan Summary Stats */}
      <div className="px-4 mb-3">
        <LoanSummaryStats activeCount={activeLoans.length} totalGoals={totalActiveGoals} successPct={successPct} />
      </div>

      {/* 3-Tab Layout */}
      <Tabs defaultValue="available" className="px-4">
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full mb-3">
          <TabsTrigger value="available" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <Users className="h-3 w-3 mr-1" />
            Available
          </TabsTrigger>
          <TabsTrigger value="my_loans" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <UserCheck className="h-3 w-3 mr-1" />
            My Loans
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <History className="h-3 w-3 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ============ AVAILABLE TAB ============ */}
        <TabsContent value="available">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] mb-2 transition-colors"
          >
            <Filter className="h-3 w-3" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-3 space-y-3"
              >
                {/* Position */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">Position</p>
                  <div className="flex flex-wrap gap-1">
                    {(['All', 'GK', 'DEF', 'MID', 'FWD'] as PositionFilter[]).map(pos => (
                      <button
                        key={pos}
                        onClick={() => setPositionFilter(pos)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          positionFilter === pos
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* League */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">League</p>
                  <div className="flex flex-wrap gap-1">
                    {LEAGUES.map(league => (
                      <button
                        key={league.id}
                        onClick={() => setLeagueFilter(leagueFilter === league.id ? '' : league.id)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          leagueFilter === league.id
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {league.emoji} {league.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">Age</p>
                  <div className="flex flex-wrap gap-1">
                    {(['Any', 'U21', 'U23'] as AgeFilter[]).map(age => (
                      <button
                        key={age}
                        onClick={() => setAgeFilter(age)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          ageFilter === age
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">Sort By</p>
                  <div className="flex flex-wrap gap-1">
                    {SORT_OPTIONS.map(so => (
                      <button
                        key={so.value}
                        onClick={() => setSortOption(so.value)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          sortOption === so.value
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {so.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                <button
                  onClick={() => {
                    setPositionFilter('All');
                    setLeagueFilter('');
                    setAgeFilter('Any');
                    setSortOption('rating_desc');
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Reset all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <p className="text-[10px] text-[#484f58] mb-2">
            {filteredCandidates.length} player{filteredCandidates.length !== 1 ? 's' : ''} available
          </p>

          {/* Loan Candidate Grid */}
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
              <Search className="h-8 w-8 mb-2" />
              <p className="text-xs">No loan candidates match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {filteredCandidates.map((player, idx) => {
                const isRequesting = requestingLoan === player.id;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                    className={`bg-[#161b22] border border-[#30363d] border-l-2 ${getPositionAccent(player.position)} rounded-lg p-2.5 flex flex-col gap-1.5`}
                  >
                    {/* Club */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{player.currentClub.logo}</span>
                      <span className="text-[9px] text-[#8b949e] truncate">{player.currentClub.shortName}</span>
                    </div>

                    {/* Name + Position */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#c9d1d9] truncate">{player.name}</span>
                      <Badge className="text-[8px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e] flex-shrink-0">
                        {player.position}
                      </Badge>
                    </div>

                    {/* OVR + Age */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{player.nationalityFlag}</span>
                        <span className="text-[10px] text-[#8b949e]">{player.age}y</span>
                      </div>
                    </div>

                    {/* Potential */}
                    {player.potential > player.overall && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-[9px] text-emerald-400">POT {player.potential}</span>
                      </div>
                    )}

                    {/* Loan Type */}
                    <Badge className={`text-[8px] px-1.5 py-0 w-fit ${
                      player.loanType === 'Season Long'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {player.loanType}
                    </Badge>

                    {/* Wage Contribution */}
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[#484f58]">Wage contribution</span>
                      <span className="text-[#c9d1d9] font-medium">{player.wageContribution}%</span>
                    </div>

                    {/* Loan Fee */}
                    {player.askingFee > 0 && (
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-[#484f58]">Loan fee</span>
                        <span className="text-amber-400 font-medium">{formatPrice(player.askingFee)}</span>
                      </div>
                    )}

                    {player.guaranteedMinutes && (
                      <div className="flex items-center gap-1 text-[8px] text-emerald-400">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Guaranteed minutes
                      </div>
                    )}

                    {/* Request Loan Button */}
                    <Button
                      onClick={() => handleRequestLoan(player.id)}
                      size="sm"
                      disabled={isRequesting}
                      className={`w-full h-7 text-[10px] mt-0.5 transition-all ${
                        isRequesting
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {isRequesting ? (
                          <motion.span
                            key="sent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Request Sent!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="request"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            Request Loan
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============ MY LOANS TAB ============ */}
        <TabsContent value="my_loans">
          {/* Loan Fee Saved */}
          <div className="mb-3">
            <LoanFeeSavedCard season={currentSeason} />
          </div>

          {/* Active Loans List */}
          {activeLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
              <UserRound className="h-8 w-8 mb-2" />
              <p className="text-xs">No active loans</p>
              <p className="text-[10px] mt-1">Browse the Available tab to find loan targets</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {activeLoans.map((loan, idx) => {
                const elapsed = currentWeek - loan.startWeek;
                const totalDuration = loan.endWeek - loan.startWeek;
                const progressPct = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.05 }}
                    className={`bg-[#161b22] border border-[#30363d] border-l-2 ${getPositionAccent(loan.position)} rounded-lg p-3`}
                  >
                    {/* Recall success toast */}
                    <AnimatePresence>
                      {recallSuccess === loan.playerName && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mb-2 flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1.5"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {loan.playerName} has been recalled successfully!
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Player Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${getOvrBg(loan.overall)} rounded-lg px-2.5 py-1.5 text-center flex-shrink-0`}>
                        <span className={`text-lg font-bold ${getOvrColor(loan.overall)}`}>{loan.overall}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-[#c9d1d9] truncate">{loan.playerName}</p>
                          <Badge className="text-[8px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e] flex-shrink-0">{loan.position}</Badge>
                        </div>
                        <p className="text-[10px] text-[#8b949e]">
                          {loan.loanClub.logo} {loan.loanClub.name} · Age {loan.age}
                        </p>
                      </div>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#0d1117] rounded-md p-2 text-center">
                        <p className="text-[9px] text-[#484f58]">Loan Type</p>
                        <Badge className={`text-[8px] px-1.5 py-0 mt-0.5 ${
                          loan.loanType === 'Season Long'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {loan.loanType}
                        </Badge>
                      </div>
                      <div className="bg-[#0d1117] rounded-md p-2 text-center">
                        <p className="text-[9px] text-[#484f58]">Start</p>
                        <p className="text-[10px] font-semibold text-[#c9d1d9]">Wk {loan.startWeek}</p>
                      </div>
                      <div className="bg-[#0d1117] rounded-md p-2 text-center">
                        <p className="text-[9px] text-[#484f58]">End</p>
                        <p className="text-[10px] font-semibold text-[#c9d1d9]">Wk {loan.endWeek}</p>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center">
                        <p className="text-[9px] text-[#484f58]">Apps</p>
                        <p className="text-sm font-bold text-[#c9d1d9]">{loan.gamesPlayed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-[#484f58]">Goals</p>
                        <p className="text-sm font-bold text-emerald-400">{loan.goals}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-[#484f58]">Assists</p>
                        <p className="text-sm font-bold text-sky-400">{loan.assists}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-[#484f58]">Rating</p>
                        <p className={`text-sm font-bold ${loan.averageRating >= 7.0 ? 'text-emerald-400' : loan.averageRating >= 6.5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {loan.averageRating.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Loan Duration Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#484f58]">Loan Duration</span>
                        <span className="text-[9px] text-[#8b949e]">{elapsed}/{totalDuration} weeks</span>
                      </div>
                      <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className={`h-full rounded-sm ${progressPct >= 80 ? 'bg-red-400' : progressPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </div>

                    {/* Recall Button */}
                    <RecallButton playerName={loan.playerName} onRecall={() => handleRecall(loan.playerName)} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============ HISTORY TAB ============ */}
        <TabsContent value="history">
          {/* Popular Destinations */}
          <div className="mb-3">
            <PopularLoanDestinations destinations={popularDestinations} />
          </div>

          {/* Past Loans List */}
          {pastLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
              <History className="h-8 w-8 mb-2" />
              <p className="text-xs">No loan history yet</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {pastLoans.map((loan, idx) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  className={`bg-[#161b22] border border-[#30363d] rounded-lg p-3 border-l-2 ${getPositionAccent(loan.position)}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`${getOvrBg(loan.overall)} rounded-md px-2 py-1 text-center`}>
                        <span className={`text-sm font-bold ${getOvrColor(loan.overall)}`}>{loan.overall}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-[#c9d1d9]">{loan.playerName}</p>
                          <Badge className="text-[8px] px-1 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e]">{loan.position}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-sm">{loan.originalClub.logo}</span>
                          <span className="text-[10px] text-[#8b949e]">{loan.originalClub.shortName}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-[#484f58]" />
                          <span className="text-sm">{loan.loanClub.logo}</span>
                          <span className="text-[10px] text-[#c9d1d9] font-medium">{loan.loanClub.shortName}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-[8px] px-1.5 py-0 ${
                      loan.successRating === 'Successful'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {loan.successRating === 'Successful' ? '✓' : '✗'} {loan.successRating}
                    </Badge>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1 text-[#8b949e]">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>S{loan.season} · {loan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <span className="text-[#c9d1d9]"><strong>{loan.apps}</strong> apps</span>
                      <span className="text-emerald-400"><strong>{loan.goals}</strong> goals</span>
                      <span className="text-sky-400"><strong>{loan.assists}</strong> ast</span>
                      <span className={`font-medium ${loan.averageRating >= 7.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {loan.averageRating.toFixed(1)} avg
                      </span>
                    </div>
                  </div>

                  {/* Improvement bar */}
                  {loan.improvement > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400">+{loan.improvement} OVR improvement during loan</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Loan Market Insights Section */}
      <div className="px-4 pb-4 space-y-3">
        {/* Youth Loan Opportunities */}
        <YouthLoanOpportunities candidates={allCandidates} />

        {/* Loan Market Scout Board */}
        <LoanMarketScoutBoard />

        {/* Loan Comparison Matrix */}
        <LoanComparisonMatrix />

        {/* Loan History Timeline */}
        <LoanHistoryTimeline />

        {/* Loan Performance Tracker */}
        <LoanPerformanceTracker />

        {/* Loan Financial Impact */}
        <LoanFinancialImpact />
      </div>
    </div>
  );
}
