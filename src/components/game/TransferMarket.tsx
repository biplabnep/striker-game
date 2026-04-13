'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search, Filter, Star, ArrowRight, Users, DollarSign,
  BookmarkPlus, BookmarkCheck, TrendingUp, X, Eye,
  ShoppingCart, Briefcase, ChevronDown, ChevronUp, ShoppingCart as CartIcon
} from 'lucide-react';
import { getClubsByLeague, getLeagueById, ENRICHED_CLUBS } from '@/lib/game/clubsData';
import { NATIONALITIES, POSITIONS, generatePlayerName, POSITION_WEIGHTS } from '@/lib/game/playerData';
import { Position, PlayerAttributes } from '@/lib/game/types';
import { isTransferWindow } from '@/lib/game/transferEngine';

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
// Market Player type
// ============================================================
interface MarketPlayer {
  id: string;
  name: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
  position: Position;
  overall: number;
  attributes: PlayerAttributes;
  club: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    league: string;
  };
  askingPrice: number;       // in millions
  contractRemaining: number; // years
  interestLevel: number;     // 0-100
  valueTrend: number[];      // 5 data points
}

// ============================================================
// Recent Transfer type
// ============================================================
interface RecentTransfer {
  playerName: string;
  fromClub: string;
  toClub: string;
  fee: number;       // millions
  date: string;
}

// ============================================================
// Transfer Rumor type
// ============================================================
interface TransferRumor {
  id: string;
  playerName: string;
  fromClub: string;
  targetClub: string;
  source: string;
  reliability: 'Low' | 'Medium' | 'High';
  isNew: boolean;
  weekPosted: number;
  fee: number;
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
// Price filter presets
// ============================================================
type PriceFilter = 'Any' | 10 | 25 | 50 | 100;

const PRICE_FILTERS: { label: string; value: PriceFilter }[] = [
  { label: 'Any', value: 'Any' },
  { label: 'Under €10M', value: 10 },
  { label: 'Under €25M', value: 25 },
  { label: 'Under €50M', value: 50 },
  { label: 'Under €100M', value: 100 },
];

// ============================================================
// Sort options
// ============================================================
type SortOption = 'rating_desc' | 'price_desc' | 'age_asc' | 'name_asc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Rating ↓', value: 'rating_desc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Age ↑', value: 'age_asc' },
  { label: 'Name A-Z', value: 'name_asc' },
];

// ============================================================
// League filter options
// ============================================================
const LEAGUE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Premier League', value: 'premier_league' },
  { label: 'La Liga', value: 'la_liga' },
  { label: 'Serie A', value: 'serie_a' },
  { label: 'Bundesliga', value: 'bundesliga' },
  { label: 'Ligue 1', value: 'ligue_1' },
];

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
// Key stats for position
// ============================================================
function getKeyStats(pos: Position, attrs: PlayerAttributes): { label: string; value: number }[] {
  switch (pos) {
    case 'GK':
      return [
        { label: 'DIV', value: attrs.diving ?? 50 },
        { label: 'HAN', value: attrs.handling ?? 50 },
        { label: 'REF', value: attrs.reflexes ?? 50 },
      ];
    case 'CB':
    case 'LB':
    case 'RB':
      return [
        { label: 'DEF', value: attrs.defending },
        { label: 'PHY', value: attrs.physical },
        { label: 'PAC', value: attrs.pace },
      ];
    case 'CDM':
    case 'CM':
    case 'CAM':
    case 'LM':
    case 'RM':
      return [
        { label: 'PAS', value: attrs.passing },
        { label: 'DRI', value: attrs.dribbling },
        { label: 'PAC', value: attrs.pace },
      ];
    case 'LW':
    case 'RW':
    case 'ST':
    case 'CF':
      return [
        { label: 'PAC', value: attrs.pace },
        { label: 'SHO', value: attrs.shooting },
        { label: 'DRI', value: attrs.dribbling },
      ];
    default:
      return [
        { label: 'PAC', value: attrs.pace },
        { label: 'SHO', value: attrs.shooting },
        { label: 'PAS', value: attrs.passing },
      ];
  }
}

// ============================================================
// Generate market players deterministically
// ============================================================
function generateMarketPlayers(season: number, week: number): MarketPlayer[] {
  const seed = season * 1000 + week * 7 + 42;
  const rng = seededRandom(seed);

  const allPositions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'LM', 'RM', 'ST', 'CF'];
  const leagues = ['premier_league', 'la_liga', 'serie_a', 'bundesliga', 'ligue_1'];

  const players: MarketPlayer[] = [];
  const playerCount = 18;

  // Use ENRICHED_CLUBS and avoid duplicates
  const usedClubIds = new Set<string>();

  for (let i = 0; i < playerCount; i++) {
    const leagueIdx = Math.floor(rng() * leagues.length);
    const leagueId = leagues[leagueIdx];
    const leagueClubs = getClubsByLeague(leagueId);
    const availableClubs = leagueClubs.filter(c => !usedClubIds.has(c.id));

    if (availableClubs.length === 0) continue;

    const club = availableClubs[Math.floor(rng() * availableClubs.length)];
    usedClubIds.add(club.id);

    const position = allPositions[Math.floor(rng() * allPositions.length)];
    const age = Math.floor(rng() * 18) + 18; // 18-35

    // Determine nationality based on league
    const leagueNatMap: Record<string, string> = {
      premier_league: 'England',
      la_liga: 'Spain',
      serie_a: 'Italy',
      bundesliga: 'Germany',
      ligue_1: 'France',
    };
    // 60% local, 40% foreign
    const nat = rng() < 0.6
      ? leagueNatMap[leagueId]
      : NATIONALITIES[Math.floor(rng() * NATIONALITIES.length)].name;

    const { firstName, lastName } = generatePlayerName(nat);
    const name = `${firstName} ${lastName}`;
    const natData = NATIONALITIES.find(n => n.name === nat);
    const nationalityFlag = natData?.flag ?? '🏴󠁧󠁢󠁥󠁮󠁧󠁿';

    // Generate attributes based on position and league tier
    const weights = POSITION_WEIGHTS[position];
    const baseOvr = 55 + Math.floor(rng() * 35); // 55-89
    const leagueBonus = leagueId === 'premier_league' || leagueId === 'la_liga' ? 5 : 0;

    const genAttr = (key: keyof PlayerAttributes): number => {
      const weight = weights[key] ?? 0.1;
      const base = Math.floor(baseOvr * 0.6 + weight * baseOvr * 0.4 + leagueBonus);
      const variance = Math.floor(rng() * 14) - 7;
      return Math.max(30, Math.min(99, base + variance));
    };

    const attributes: PlayerAttributes = {
      pace: genAttr('pace'),
      shooting: genAttr('shooting'),
      passing: genAttr('passing'),
      dribbling: genAttr('dribbling'),
      defending: genAttr('defending'),
      physical: genAttr('physical'),
    };

    if (position === 'GK') {
      attributes.diving = genAttr('diving' as keyof PlayerAttributes);
      attributes.handling = genAttr('handling' as keyof PlayerAttributes);
      attributes.positioning = genAttr('positioning' as keyof PlayerAttributes);
      attributes.reflexes = genAttr('reflexes' as keyof PlayerAttributes);
    }

    // Calculate OVR from weighted attributes
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

    // Pricing: based on OVR, age, position
    let priceMultiplier = 1;
    if (overall >= 85) priceMultiplier = 8 + (overall - 85) * 2;
    else if (overall >= 80) priceMultiplier = 4 + (overall - 80) * 0.8;
    else if (overall >= 75) priceMultiplier = 2 + (overall - 75) * 0.4;
    else if (overall >= 70) priceMultiplier = 0.8 + (overall - 70) * 0.24;
    else priceMultiplier = 0.2 + (overall - 55) * 0.04;

    // Age factor: peak 24-28
    if (age < 22) priceMultiplier *= 0.7;
    else if (age < 24) priceMultiplier *= 0.9;
    else if (age <= 28) priceMultiplier *= 1.0;
    else if (age <= 30) priceMultiplier *= 0.85;
    else priceMultiplier *= 0.6;

    // Position premium
    if (['ST', 'CF', 'CAM', 'LW', 'RW'].includes(position)) priceMultiplier *= 1.15;
    if (position === 'GK') priceMultiplier *= 0.9;

    const askingPrice = Math.round(priceMultiplier * 10 * 10) / 10; // millions, 1 decimal

    // Interest level: random
    const interestLevel = Math.floor(rng() * 100);

    // Value trend: 5 points, slight variations around asking price
    const trendBase = askingPrice * (0.85 + rng() * 0.3);
    const valueTrend = Array.from({ length: 5 }, () =>
      Math.round((trendBase + (rng() - 0.5) * askingPrice * 0.3) * 10) / 10
    );

    // Contract remaining
    const contractRemaining = Math.floor(rng() * 4) + 1;

    players.push({
      id: `market_${leagueId}_${club.id}_${i}`,
      name,
      age,
      nationality: nat,
      nationalityFlag,
      position,
      overall,
      attributes,
      club: {
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        logo: club.logo,
        league: leagueId,
      },
      askingPrice,
      contractRemaining,
      interestLevel,
      valueTrend,
    });
  }

  return players;
}

// ============================================================
// Generate recent transfers
// ============================================================
function generateRecentTransfers(season: number, week: number): RecentTransfer[] {
  const seed = season * 500 + week * 3 + 77;
  const rng = seededRandom(seed);

  const clubs = ENRICHED_CLUBS;
  const nats = NATIONALITIES;
  const allPositions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'LM', 'RM', 'ST', 'CF'];

  const transfers: RecentTransfer[] = [];
  const names = [
    'Marcus Rashford', 'Frenkie de Jong', 'Victor Osimhen', 'Lamine Yamal', 'Declan Rice',
    'Jamal Musiala', 'Bukayo Saka', 'Federico Chiesa', 'Aurelien Tchouameni', 'Rafael Leao',
    'Martin Odegaard', 'Pedri Gonzalez', 'Dušan Vlahović', 'Vinicius Jr', 'Jude Bellingham',
    'Florian Wirtz', 'Khvicha Kvaratskhelia', 'Sandro Tonali', 'Rodrygo Goes', 'Gabriel Martinelli',
  ];

  for (let i = 0; i < 5; i++) {
    const fromIdx = Math.floor(rng() * clubs.length);
    let toIdx = Math.floor(rng() * clubs.length);
    while (toIdx === fromIdx) toIdx = Math.floor(rng() * clubs.length);

    const nameIdx = Math.floor(rng() * names.length);
    const fee = Math.round((5 + rng() * 90) * 10) / 10;
    const weeksAgo = Math.floor(rng() * 8) + 1;

    transfers.push({
      playerName: names[nameIdx],
      fromClub: clubs[fromIdx].shortName,
      toClub: clubs[toIdx].shortName,
      fee,
      date: `Week ${Math.max(1, week - weeksAgo)}`,
    });
  }

  return transfers;
}

// ============================================================
// Sparkline SVG
// ============================================================
function SparklineSVG({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// Stat bar for detail modal
// ============================================================
function StatBar({ label, value, color }: { label: string; value: number; color?: string }) {
  const barColor = color ?? (value >= 80 ? 'bg-emerald-500' : value >= 65 ? 'bg-sky-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-400');
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium text-[#8b949e] w-8 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-[#c9d1d9] w-6">{value}</span>
    </div>
  );
}

// ============================================================
// Interest level label + color
// ============================================================
function getInterestInfo(level: number): { label: string; color: string; width: number } {
  if (level >= 66) return { label: 'High', color: 'bg-amber-500', width: level };
  if (level >= 33) return { label: 'Medium', color: 'bg-sky-500', width: level };
  return { label: 'Low', color: 'bg-[#484f58]', width: level };
}

// ============================================================
// Position category helpers
// ============================================================
function getPositionCategory(pos: Position): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'FWD';
}

function getPositionBadgeClasses(pos: Position): string {
  const cat = getPositionCategory(pos);
  switch (cat) {
    case 'GK': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'DEF': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
    case 'MID': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'FWD': return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
}

// ============================================================
// Nationality code abbreviation
// ============================================================
function getNationalityCode(nationality: string): string {
  const map: Record<string, string> = {
    'England': 'ENG', 'Spain': 'ESP', 'Italy': 'ITA', 'Germany': 'DEU',
    'France': 'FRA', 'Portugal': 'POR', 'Brazil': 'BRA', 'Argentina': 'ARG',
    'Netherlands': 'NED', 'Belgium': 'BEL', 'Croatia': 'CRO', 'Poland': 'POL',
    'Uruguay': 'URU', 'Colombia': 'COL', 'Serbia': 'SRB', 'Norway': 'NOR',
    'Denmark': 'DEN', 'Sweden': 'SWE', 'Switzerland': 'SUI', 'Austria': 'AUT',
    'Mexico': 'MEX', 'USA': 'USA', 'Japan': 'JPN', 'South Korea': 'KOR',
    'Australia': 'AUS', 'Nigeria': 'NGA', 'Senegal': 'SEN', 'Morocco': 'MAR',
    'Ghana': 'GHA', 'Cameroon': 'CMR', 'Algeria': 'DZA', 'Tunisia': 'TUN',
    'Egypt': 'EGY', 'Scotland': 'SCO', 'Wales': 'WAL', 'Ireland': 'IRL',
    'Czech Republic': 'CZE', 'Turkey': 'TUR', 'Russia': 'RUS', 'Ukraine': 'UKR',
    'Canada': 'CAN', 'Chile': 'CHI', 'Ecuador': 'ECU', 'Peru': 'PER',
    'Paraguay': 'PRY', 'Venezuela': 'VEN', 'Ivory Coast': 'CIV',
  };
  return map[nationality] ?? nationality.slice(0, 3).toUpperCase();
}

function getNationalityBgColor(nationality: string): string {
  const n = nationality.toLowerCase();
  if (n.includes('eng') || n.includes('sco') || n.includes('wal')) return 'bg-sky-600';
  if (n.includes('spa') || n.includes('arg') || n.includes('col') || n.includes('mex')) return 'bg-red-500';
  if (n.includes('ita')) return 'bg-emerald-600';
  if (n.includes('ger') || n.includes('aus')) return 'bg-amber-500';
  if (n.includes('fra')) return 'bg-blue-600';
  if (n.includes('bra') || n.includes('por')) return 'bg-yellow-600';
  if (n.includes('net') || n.includes('bel')) return 'bg-orange-500';
  if (n.includes('cro') || n.includes('ser') || n.includes('sui')) return 'bg-red-600';
  if (n.includes('nor') || n.includes('den') || n.includes('swe')) return 'bg-sky-500';
  if (n.includes('tur')) return 'bg-red-500';
  if (n.includes('japan') || n.includes('korea')) return 'bg-rose-500';
  if (n.includes('usa') || n.includes('can')) return 'bg-blue-500';
  if (n.includes('nigeria') || n.includes('ghana') || n.includes('senegal') || n.includes('morocco') || n.includes('cameroon') || n.includes('egypt') || n.includes('algeria') || n.includes('tunisia') || n.includes('ivory')) return 'bg-lime-600';
  return 'bg-[#484f58]';
}

// ============================================================
// Contract badge styling
// ============================================================
function getContractBadgeClasses(years: number): string {
  if (years <= 1) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (years <= 2) return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
}

function getContractLabel(years: number): string {
  if (years === 1) return '1Y left';
  return `${years}Y+`;
}

// ============================================================
// Interest dots (1-3 clubs)
// ============================================================
function getInterestDotCount(level: number): number {
  if (level >= 66) return 3;
  if (level >= 33) return 2;
  return 1;
}

function getInterestDotColor(level: number): string {
  if (level >= 66) return 'bg-amber-400';
  if (level >= 33) return 'bg-sky-400';
  return 'bg-[#484f58]';
}

// ============================================================
// Mini vertical bar sparkline
// ============================================================
function MiniBarSparkline({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length === 0) return null;
  const w = 32;
  const h = 16;
  const barW = Math.max(2, (w - (data.length - 1) * 1) / data.length);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const barH = Math.max(1, ((v - min) / range) * h);
        const x = i * (barW + 1);
        return (
          <rect
            key={i}
            x={x}
            y={h - barH}
            width={barW}
            height={barH}
            rx={0.5}
            fill={color}
            opacity={0.5 + (v - min) / range * 0.5}
          />
        );
      })}
    </svg>
  );
}

// ============================================================
// Reliability indicator dot color
// ============================================================
function getReliabilityColor(rel: 'Low' | 'Medium' | 'High'): string {
  switch (rel) {
    case 'High': return 'bg-emerald-400';
    case 'Medium': return 'bg-amber-400';
    case 'Low': return 'bg-red-400';
  }
}

// ============================================================
// Generate market rumors
// ============================================================
function generateMarketRumors(season: number, week: number): TransferRumor[] {
  const seed = season * 700 + week * 11 + 99;
  const rng = seededRandom(seed);
  const clubs = ENRICHED_CLUBS;
  const names = [
    'Kylian Mbappe', 'Erling Haaland', 'Jude Bellingham', 'Vinicius Jr', 'Rodri',
    'Mohamed Salah', 'Kevin De Bruyne', 'Luka Modric', 'Robert Lewandowski',
    'Pedri', 'Gavi', 'Federico Valverde', 'Achraf Hakimi',
    'William Saliba', 'Mikel Oyarzabal', 'Ferran Torres', 'Nicolo Barella',
    'Declan Rice', 'Bukayo Saka', 'Jamal Musiala',
  ];
  const sources = ['Sky Sports', 'ESPN FC', 'Fabrizio Romano', 'Marca', 'L\'Equipe', 'Bild', 'Gazzetta', 'BBC Sport'];
  const reliabilities: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

  const rumors: TransferRumor[] = [];
  for (let i = 0; i < 6; i++) {
    const fromIdx = Math.floor(rng() * clubs.length);
    let toIdx = Math.floor(rng() * clubs.length);
    while (toIdx === fromIdx) toIdx = Math.floor(rng() * clubs.length);
    const nameIdx = Math.floor(rng() * names.length);
    const weeksAgo = Math.floor(rng() * 4);
    const isNew = weeksAgo === 0;
    const reliability = reliabilities[Math.floor(rng() * reliabilities.length)];
    const fee = Math.round((8 + rng() * 80) * 10) / 10;

    rumors.push({
      id: `rumor_${season}_${week}_${i}`,
      playerName: names[nameIdx],
      fromClub: clubs[fromIdx].shortName,
      targetClub: clubs[toIdx].shortName,
      source: sources[Math.floor(rng() * sources.length)],
      reliability,
      isNew,
      weekPosted: week - weeksAgo,
      fee,
    });
  }

  return rumors;
}

// ============================================================
// TransferMarket Component
// ============================================================
export default function TransferMarket() {
  const gameState = useGameStore(state => state.gameState);
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentClub = gameState?.currentClub;
  const transferBudget = currentClub?.budget ?? 50_000_000;

  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('All');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('Any');
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<MarketPlayer | null>(null);
  const [bidPlayer, setBidPlayer] = useState<MarketPlayer | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidSubmitted, setBidSubmitted] = useState<'none' | 'success' | 'too_low'>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [showShortlistExpanded, setShowShortlistExpanded] = useState(false);

  // Generate data deterministically
  const allPlayers = useMemo(() => generateMarketPlayers(currentSeason, currentWeek), [currentSeason, currentWeek]);
  const recentTransfers = useMemo(() => generateRecentTransfers(currentSeason, currentWeek), [currentSeason, currentWeek]);
  const marketRumors = useMemo(() => generateMarketRumors(currentSeason, currentWeek), [currentSeason, currentWeek]);

  // Transfer window status
  const windowStatus = useMemo(() => isTransferWindow(currentWeek), [currentWeek]);

  // Budget in millions
  const budgetInM = transferBudget / 1_000_000;

  // Average market price
  const avgPrice = useMemo(() => {
    if (allPlayers.length === 0) return 0;
    const total = allPlayers.reduce((sum, p) => sum + p.askingPrice, 0);
    return Math.round(total / allPlayers.length * 10) / 10;
  }, [allPlayers]);

  // Filtered + sorted players
  const filteredPlayers = useMemo(() => {
    let players = [...allPlayers];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      players = players.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.club.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
      );
    }

    // Position filter
    if (positionFilter !== 'All') {
      const allowedPos = POSITION_FILTER_MAP[positionFilter] ?? [];
      players = players.filter(p => allowedPos.includes(p.position));
    }

    // League filter
    if (leagueFilter) {
      players = players.filter(p => p.club.league === leagueFilter);
    }

    // Price filter
    if (priceFilter !== 'Any') {
      players = players.filter(p => p.askingPrice < priceFilter);
    }

    // Sort
    switch (sortOption) {
      case 'rating_desc':
        players.sort((a, b) => b.overall - a.overall);
        break;
      case 'price_desc':
        players.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case 'age_asc':
        players.sort((a, b) => a.age - b.age);
        break;
      case 'name_asc':
        players.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return players;
  }, [allPlayers, searchQuery, positionFilter, leagueFilter, priceFilter, sortOption]);

  // Shortlist filter
  const shortlistedPlayers = useMemo(
    () => allPlayers.filter(p => shortlist.has(p.id)),
    [allPlayers, shortlist]
  );

  // Shortlist total value
  const shortlistTotalValue = useMemo(() => {
    return shortlistedPlayers.reduce((sum, p) => sum + p.askingPrice, 0);
  }, [shortlistedPlayers]);

  // Age range of filtered players
  const ageRange = useMemo(() => {
    if (filteredPlayers.length === 0) return { min: 0, max: 0 };
    const ages = filteredPlayers.map(p => p.age);
    return { min: Math.min(...ages), max: Math.max(...ages) };
  }, [filteredPlayers]);

  const toggleShortlist = useCallback((playerId: string) => {
    setShortlist(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }, []);

  const openBid = useCallback((player: MarketPlayer) => {
    setBidPlayer(player);
    setBidAmount(player.askingPrice);
    setBidSubmitted('none');
  }, []);

  const submitBid = useCallback(() => {
    if (!bidPlayer) return;
    const minAccepted = bidPlayer.askingPrice * 0.8;
    if (bidAmount < minAccepted) {
      setBidSubmitted('too_low');
    } else {
      setBidSubmitted('success');
    }
  }, [bidPlayer, bidAmount]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-[#c9d1d9]">Transfer Market</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players..."
              className="w-40 bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[#8b949e]">Browse players available for transfer</p>
      </div>

      {/* Market Overview Stats Bar - 3-column with sparklines */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#c9d1d9]">{allPlayers.length}</p>
            <p className="text-[9px] text-[#8b949e]">Total Available</p>
          </div>
          <MiniBarSparkline
            data={allPlayers.slice(0, 5).map(p => p.overall)}
            color="#10b981"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="w-7 h-7 bg-sky-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#c9d1d9]">{formatPrice(avgPrice)}</p>
            <p className="text-[9px] text-[#8b949e]">Avg Market Value</p>
          </div>
          <MiniBarSparkline
            data={allPlayers.slice(0, 5).map(p => p.askingPrice)}
            color="#38bdf8"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 flex items-center gap-2.5"
        >
          <div className="w-7 h-7 bg-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#c9d1d9]">{budgetInM >= 100 ? `${(budgetInM / 1000).toFixed(1)}B` : `${budgetInM.toFixed(0)}M`}</p>
            <p className="text-[9px] text-[#8b949e]">Your Budget</p>
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${windowStatus ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className="text-[8px] text-[#8b949e]">{windowStatus ? 'Open' : 'Closed'}</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="market" className="px-4">
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full mb-3">
          <TabsTrigger value="market" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Market
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <Star className="h-3 w-3 mr-1" />
            Shortlist ({shortlist.size})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <ArrowRight className="h-3 w-3 mr-1" />
            Recent
          </TabsTrigger>
        </TabsList>

        {/* Market Tab */}
        <TabsContent value="market">
          {/* Visual Filter Bar - always visible position pills + sort indicator */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
            {(['All', 'GK', 'DEF', 'MID', 'FWD'] as PositionFilter[]).map(pos => {
              const isActive = positionFilter === pos;
              const catColors: Record<string, string> = {
                All: isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
                GK: isActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
                DEF: isActive ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
                MID: isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
                FWD: isActive ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
              };
              return (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-lg border whitespace-nowrap transition-colors ${catColors[pos]}`}
                >
                  {pos}
                </button>
              );
            })}
            <div className="flex-1" />
            {/* Sort indicator + Age range */}
            <span className="text-[9px] text-[#484f58] whitespace-nowrap">
              Age {ageRange.min}-{ageRange.max}
            </span>
            <span className="text-[9px] text-[#484f58]">|</span>
            <span className="text-[9px] text-emerald-400/70 whitespace-nowrap flex items-center gap-0.5">
              <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                <path d="M4 1L7 5H1L4 1Z" fill="currentColor" opacity="0.6" />
                <path d="M4 7L1 3H7L4 7Z" fill="currentColor" />
              </svg>
              {SORT_OPTIONS.find(s => s.value === sortOption)?.label}
            </span>
          </div>

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
                {/* Position filter */}
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

                {/* League filter */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">League</p>
                  <div className="flex flex-wrap gap-1">
                    {LEAGUE_FILTERS.map(league => (
                      <button
                        key={league.value}
                        onClick={() => setLeagueFilter(league.value)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          leagueFilter === league.value
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {league.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price filter */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">Max Price</p>
                  <div className="flex flex-wrap gap-1">
                    {PRICE_FILTERS.map(pf => (
                      <button
                        key={String(pf.value)}
                        onClick={() => setPriceFilter(pf.value)}
                        className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                          priceFilter === pf.value
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        {pf.label}
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
                    setPriceFilter('Any');
                    setSortOption('rating_desc');
                    setSearchQuery('');
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
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
          </p>

          {/* Player Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
              <Search className="h-8 w-8 mb-2" />
              <p className="text-xs">No players match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {filteredPlayers.map((player, idx) => {
                const keyStats = getKeyStats(player.position, player.attributes);
                const interest = getInterestInfo(player.interestLevel);
                const isShortlisted = shortlist.has(player.id);

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex flex-col gap-1.5"
                  >
                    {/* Club + Bookmark + Contract badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm">{player.club.logo}</span>
                        <span className="text-[9px] text-[#8b949e] truncate">{player.club.shortName}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[7px] px-1 py-0 rounded-md font-medium ${getContractBadgeClasses(player.contractRemaining)}`}>
                          {getContractLabel(player.contractRemaining)}
                        </span>
                        <button
                          onClick={() => toggleShortlist(player.id)}
                          className="text-[#8b949e] hover:text-emerald-400 transition-colors flex-shrink-0"
                        >
                          {isShortlisted ? <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Name + Position color badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#c9d1d9] truncate">{player.name}</span>
                      <span className={`text-[7px] px-1.5 py-0 rounded-md font-semibold flex-shrink-0 ${getPositionBadgeClasses(player.position)}`}>
                        {player.position}
                      </span>
                    </div>

                    {/* OVR circle + Nationality flag indicator + Age */}
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 ${getOvrBg(player.overall)} rounded-lg flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          <span className={`inline-block w-3 h-3 rounded-sm flex items-center justify-center ${getNationalityBgColor(player.nationality)}`}>
                            <span className="text-[5px] font-bold text-white">{getNationalityCode(player.nationality)}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8b949e]">{player.age}y</span>
                      </div>
                    </div>

                    {/* Key stats */}
                    <div className="flex gap-1.5">
                      {keyStats.map(stat => (
                        <div key={stat.label} className="flex-1 bg-[#0d1117] rounded px-1.5 py-0.5 text-center">
                          <p className="text-[8px] text-[#484f58]">{stat.label}</p>
                          <p className={`text-[10px] font-bold ${stat.value >= 75 ? 'text-emerald-400' : stat.value >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Price with market value comparison bar */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">{formatPrice(player.askingPrice)}</span>
                        <span className={`text-[8px] font-medium ${player.askingPrice <= avgPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                          {player.askingPrice <= avgPrice ? 'Below MV' : 'Above MV'}
                        </span>
                      </div>
                      <div className="h-1 bg-[#21262d] rounded-sm overflow-hidden flex">
                        <div
                          className={`h-full ${player.askingPrice <= avgPrice ? 'bg-emerald-500' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(100, (player.askingPrice / (avgPrice * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Interest level dots (1-3 clubs interested) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={i}
                            className={`inline-block w-1.5 h-1.5 rounded-full ${i < getInterestDotCount(player.interestLevel) ? getInterestDotColor(player.interestLevel) : 'bg-[#21262d]'}`}
                          />
                        ))}
                        <span className="text-[8px] text-[#484f58] ml-0.5">{getInterestDotCount(player.interestLevel)} club{getInterestDotCount(player.interestLevel) > 1 ? 's' : ''}</span>
                      </div>
                      <SparklineSVG data={player.valueTrend} color={player.valueTrend[player.valueTrend.length - 1] >= player.valueTrend[0] ? '#10b981' : '#f87171'} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 mt-0.5">
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#21262d] border border-[#30363d] rounded-md text-[10px] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#484f58] transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => openBid(player)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-md text-[10px] text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Bid
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shortlist Tab */}
        <TabsContent value="shortlist">
          {shortlistedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
              <Star className="h-8 w-8 mb-2" />
              <p className="text-xs">No shortlisted players yet</p>
              <p className="text-[10px] mt-1">Tap the bookmark icon on players to add them</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {/* Shortlist Summary Header */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                      <Star className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-[#c9d1d9]">{shortlistedPlayers.length} Player{shortlistedPlayers.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">{formatPrice(shortlistTotalValue)}</p>
                    <p className="text-[8px] text-[#484f58]">Total Value</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#8b949e]">
                    {shortlistTotalValue <= budgetInM
                      ? `Within budget — ${formatPrice(budgetInM - shortlistTotalValue)} remaining`
                      : `Over budget by ${formatPrice(shortlistTotalValue - budgetInM)}`
                    }
                  </p>
                  <div className="h-1 flex-1 mx-3 bg-[#21262d] rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${shortlistTotalValue <= budgetInM ? 'bg-emerald-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, (shortlistTotalValue / budgetInM) * 100)}%` }}
                    />
                  </div>
                </div>
                {/* Batch Offers button */}
                <button className="w-full mt-2.5 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                    <path d="M1 6h10M6 1v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Make Offers for All
                </button>
              </div>

              {/* Shortlist compact cards */}
              <div className="space-y-1.5">
              {shortlistedPlayers.map(player => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex items-center gap-2.5"
                >
                  {/* OVR circle */}
                  <div className={`w-9 h-9 ${getOvrBg(player.overall)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-bold ${getOvrColor(player.overall)}`}>{player.overall}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-[#c9d1d9] truncate">{player.name}</p>
                      <span className={`text-[7px] px-1 py-0 rounded-md font-semibold flex-shrink-0 ${getPositionBadgeClasses(player.position)}`}>
                        {player.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-[#8b949e]">{player.club.logo} {player.club.shortName}</span>
                      <span className={`inline-block w-3 h-3 rounded-sm flex items-center justify-center ${getNationalityBgColor(player.nationality)}`}>
                        <span className="text-[5px] font-bold text-white">{getNationalityCode(player.nationality)}</span>
                      </span>
                      <span className="text-[9px] text-[#484f58]">{player.age}y</span>
                      <span className={`text-[7px] px-1 py-0 rounded-md ${getContractBadgeClasses(player.contractRemaining)}`}>
                        {getContractLabel(player.contractRemaining)}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-400 mt-0.5">{formatPrice(player.askingPrice)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="p-1 bg-[#21262d] border border-[#30363d] rounded-md text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openBid(player)}
                      className="p-1 bg-emerald-500/15 border border-emerald-500/30 rounded-md text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => toggleShortlist(player.id)}
                      className="p-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Recent Transfers Tab */}
        <TabsContent value="recent">
          {/* Market Activity Feed - Transfer Rumors */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide">Transfer Rumors</p>
              <span className="text-[9px] text-emerald-400/60">{marketRumors.filter(r => r.isNew).length} new</span>
            </div>
            <div className="space-y-1.5">
              {marketRumors.map((rumor, idx) => (
                <motion.div
                  key={rumor.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-[11px] font-semibold text-[#c9d1d9] truncate">{rumor.playerName}</p>
                      {rumor.isNew && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[7px] px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md font-bold flex-shrink-0"
                        >
                          NEW
                        </motion.span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${getReliabilityColor(rumor.reliability)}`} />
                      <span className="text-[8px] text-[#484f58]">{rumor.reliability}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-[#8b949e]">{rumor.fromClub}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-[#484f58]" />
                    <span className="text-sky-400 font-medium">{rumor.targetClub}</span>
                    <span className="text-[#30363d] mx-0.5">|</span>
                    <span className="text-[8px] text-amber-400 font-semibold">{formatPrice(rumor.fee)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] px-1.5 py-0 bg-[#21262d] border border-[#30363d] rounded-md text-[#8b949e]">
                      {rumor.source}
                    </span>
                    <span className="text-[8px] text-[#484f58]">Wk {rumor.weekPosted}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Completed Transfers */}
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-2">Completed Transfers</p>
          <div className="space-y-2 pb-4">
            {recentTransfers.map((transfer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-[#c9d1d9]">{transfer.playerName}</p>
                  <span className="text-[10px] text-[#484f58]">{transfer.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[#8b949e]">{transfer.fromClub}</span>
                  <ArrowRight className="h-3 w-3 text-[#484f58]" />
                  <span className="text-emerald-400 font-medium">{transfer.toClub}</span>
                </div>
                <p className="text-xs font-bold text-amber-400 mt-1">{formatPrice(transfer.fee)}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#161b22] border border-[#30363d] rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#c9d1d9]">Player Profile</h2>
                <button onClick={() => setSelectedPlayer(null)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Player Header */}
                <div className="flex items-center gap-3">
                  <div className={`${getOvrBg(selectedPlayer.overall)} rounded-lg px-3 py-2 text-center`}>
                    <span className={`text-2xl font-bold ${getOvrColor(selectedPlayer.overall)}`}>{selectedPlayer.overall}</span>
                    <p className="text-[8px] text-[#8b949e]">OVR</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#c9d1d9]">{selectedPlayer.name}</p>
                    <p className="text-[11px] text-[#8b949e]">
                      {selectedPlayer.club.logo} {selectedPlayer.club.name} · {selectedPlayer.nationalityFlag} {selectedPlayer.nationality}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[9px] px-1.5 py-0 border-[#30363d] bg-[#21262d] text-[#8b949e]">{selectedPlayer.position}</Badge>
                      <span className="text-[10px] text-[#8b949e]">{selectedPlayer.age} years old</span>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0d1117] rounded-lg p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase">Age</p>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{selectedPlayer.age}</p>
                  </div>
                  <div className="bg-[#0d1117] rounded-lg p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase">Position</p>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{POSITIONS[selectedPlayer.position]?.fullName ?? selectedPlayer.position}</p>
                  </div>
                  <div className="bg-[#0d1117] rounded-lg p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase">Nationality</p>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{selectedPlayer.nationalityFlag} {selectedPlayer.nationality}</p>
                  </div>
                  <div className="bg-[#0d1117] rounded-lg p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase">Contract</p>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{selectedPlayer.contractRemaining} yr{selectedPlayer.contractRemaining > 1 ? 's' : ''} left</p>
                  </div>
                </div>

                {/* Full Stats */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-2">Attributes</p>
                  <div className="space-y-1.5">
                    <StatBar label="PAC" value={selectedPlayer.attributes.pace} />
                    <StatBar label="SHO" value={selectedPlayer.attributes.shooting} />
                    <StatBar label="PAS" value={selectedPlayer.attributes.passing} />
                    <StatBar label="DRI" value={selectedPlayer.attributes.dribbling} />
                    <StatBar label="DEF" value={selectedPlayer.attributes.defending} />
                    <StatBar label="PHY" value={selectedPlayer.attributes.physical} />
                    {selectedPlayer.position === 'GK' && (
                      <>
                        <StatBar label="DIV" value={selectedPlayer.attributes.diving ?? 50} />
                        <StatBar label="HAN" value={selectedPlayer.attributes.handling ?? 50} />
                        <StatBar label="POS" value={selectedPlayer.attributes.positioning ?? 50} />
                        <StatBar label="REF" value={selectedPlayer.attributes.reflexes ?? 50} />
                      </>
                    )}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">Strengths</p>
                    {(() => {
                      const entries = Object.entries(selectedPlayer.attributes)
                        .filter(([, v]) => v !== undefined)
                        .map(([k, v]) => ({ key: k, value: v as number }))
                        .sort((a, b) => b.value - a.value);
                      return entries.slice(0, 3).map(e => (
                        <div key={e.key} className="flex items-center gap-1 mb-0.5">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                          <span className="text-[10px] text-[#c9d1d9] capitalize">{e.key}</span>
                          <span className="text-[10px] font-bold text-emerald-400">{e.value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1.5">Weaknesses</p>
                    {(() => {
                      const entries = Object.entries(selectedPlayer.attributes)
                        .filter(([, v]) => v !== undefined)
                        .map(([k, v]) => ({ key: k, value: v as number }))
                        .sort((a, b) => a.value - b.value);
                      return entries.slice(0, 2).map(e => (
                        <div key={e.key} className="flex items-center gap-1 mb-0.5">
                          <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                          <span className="text-[10px] text-[#c9d1d9] capitalize">{e.key}</span>
                          <span className="text-[10px] font-bold text-red-400">{e.value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Market Value Trend */}
                <div>
                  <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wide mb-1.5">Market Value Trend</p>
                  <div className="bg-[#0d1117] rounded-lg p-3 flex items-center justify-between">
                    <SparklineSVG data={selectedPlayer.valueTrend} />
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatPrice(selectedPlayer.askingPrice)}</p>
                      <p className="text-[9px] text-[#8b949e]">Asking Price</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1 pb-2">
                  <button
                    onClick={() => {
                      openBid(selectedPlayer);
                      setSelectedPlayer(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                  >
                    Make Bid — {formatPrice(selectedPlayer.askingPrice)}
                  </button>
                  <button
                    onClick={() => toggleShortlist(selectedPlayer.id)}
                    className={`flex-1 py-2.5 border rounded-lg text-xs font-semibold transition-colors ${
                      shortlist.has(selectedPlayer.id)
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {shortlist.has(selectedPlayer.id) ? 'Shortlisted' : 'Add to Shortlist'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bid Panel */}
      <AnimatePresence>
        {bidPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={() => { setBidPlayer(null); setBidSubmitted('none'); }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#161b22] border border-[#30363d] rounded-t-lg sm:rounded-lg w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {/* Bid Header */}
              <div className="border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#c9d1d9]">Place Bid</h2>
                <button onClick={() => { setBidPlayer(null); setBidSubmitted('none'); }} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Player Info */}
                <div className="flex items-center gap-3">
                  <div className={`${getOvrBg(bidPlayer.overall)} rounded-lg px-2.5 py-1.5 text-center`}>
                    <span className={`text-lg font-bold ${getOvrColor(bidPlayer.overall)}`}>{bidPlayer.overall}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{bidPlayer.name}</p>
                    <p className="text-[11px] text-[#8b949e]">{bidPlayer.club.logo} {bidPlayer.club.name}</p>
                  </div>
                </div>

                {/* Suggested Range */}
                <div className="bg-[#0d1117] rounded-lg p-3">
                  <p className="text-[10px] text-[#484f58] uppercase mb-1">Suggested Bid Range</p>
                  <p className="text-xs text-[#c9d1d9]">
                    <span className="text-emerald-400 font-semibold">{formatPrice(bidPlayer.askingPrice * 0.8)}</span>
                    {' — '}
                    <span className="text-emerald-400 font-semibold">{formatPrice(bidPlayer.askingPrice * 1.2)}</span>
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-1">Asking price: {formatPrice(bidPlayer.askingPrice)}</p>
                </div>

                {/* Transfer Fee Breakdown Bar */}
                <div className="bg-[#0d1117] rounded-lg p-3">
                  <p className="text-[10px] text-[#484f58] uppercase mb-2">Fee Breakdown</p>
                  <div className="h-3 bg-[#21262d] rounded-md overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      title="Base Fee"
                      style={{ width: '70%' }}
                    />
                    <div
                      className="h-full bg-sky-500"
                      title="Agent Fee"
                      style={{ width: '20%' }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      title="Signing Bonus"
                      style={{ width: '10%' }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
                      <span className="text-[8px] text-[#8b949e]">Base Fee {formatPrice(bidPlayer.askingPrice * 0.7)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm bg-sky-500" />
                      <span className="text-[8px] text-[#8b949e]">Agent {formatPrice(bidPlayer.askingPrice * 0.2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm bg-amber-500" />
                      <span className="text-[8px] text-[#8b949e]">Bonus {formatPrice(bidPlayer.askingPrice * 0.1)}</span>
                    </div>
                  </div>
                </div>

                {/* Preset buttons */}
                <div>
                  <p className="text-[10px] text-[#484f58] uppercase mb-1.5">Quick Offers</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setBidAmount(Math.round(bidPlayer.askingPrice * 0.85 * 10) / 10)}
                      className={`py-2 rounded-md border text-[11px] font-medium transition-colors ${
                        bidAmount === Math.round(bidPlayer.askingPrice * 0.85 * 10) / 10
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-amber-500/20'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      onClick={() => setBidAmount(bidPlayer.askingPrice)}
                      className={`py-2 rounded-md border text-[11px] font-medium transition-colors ${
                        bidAmount === bidPlayer.askingPrice
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setBidAmount(Math.round(bidPlayer.askingPrice * 1.15 * 10) / 10)}
                      className={`py-2 rounded-md border text-[11px] font-medium transition-colors ${
                        bidAmount === Math.round(bidPlayer.askingPrice * 1.15 * 10) / 10
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-sky-500/20'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>

                {/* Bid Amount Display */}
                <div className="bg-[#0d1117] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#484f58] uppercase mb-0.5">Your Bid</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatPrice(bidAmount)}</p>
                  {bidAmount > budgetInM && (
                    <p className="text-[10px] text-red-400 mt-1">Exceeds your transfer budget!</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  onClick={submitBid}
                  disabled={bidSubmitted === 'success'}
                  className="w-full py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Bid
                </button>

                {/* Result */}
                <AnimatePresence>
                  {bidSubmitted !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`rounded-lg p-3 text-center border ${
                        bidSubmitted === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <p className={`text-xs font-medium ${bidSubmitted === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bidSubmitted === 'success'
                          ? 'Bid submitted! Club will respond within 2 weeks.'
                          : `Bid too low — minimum accepted is ${formatPrice(bidPlayer.askingPrice * 0.8)}`
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
