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
  ShoppingCart, Briefcase, ChevronDown, ChevronUp, ShoppingCart as CartIcon,
  Activity
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
// Helper: compute hex polygon points string for radar charts
// ============================================================
function computeHexPoints(cx: number, cy: number, r: number, n: number): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');
}

// ============================================================
// Helper: compute polyline points string from data array
// ============================================================
function computePolylinePoints(data: number[], w: number, h: number, padY: number): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = padY + h - 2 * padY - ((v - min) / range) * (h - 2 * padY);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// ============================================================
// TransferMarket Component
// ============================================================
export default function TransferMarket() {
  const gameState = useGameStore(state => state.gameState) ?? {};
  const currentSeason = (gameState as unknown as { currentSeason?: number }).currentSeason ?? 1;
  const currentWeek = (gameState as unknown as { currentWeek?: number }).currentWeek ?? 1;
  const currentClub = (gameState as unknown as { currentClub?: { budget?: number } }).currentClub ?? {};
  const transferBudget = (currentClub as unknown as { budget?: number }).budget ?? 50_000_000;

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

  // ========================================================
  // SVG 1: Transfer Budget Gauge
  // ========================================================
  const renderTransferBudgetGauge = () => {
    const pct = budgetInM > 0 ? Math.min(100, Math.round((shortlistTotalValue / budgetInM) * 100)) : 35;
    const gaugePct = pct === 0 ? 5 : pct;

    const angle = Math.PI * (1 - gaugePct / 100);
    const endX = 100 + 80 * Math.cos(angle);
    const endY = 110 - 80 * Math.sin(angle);

    const arcD = gaugePct >= 99
      ? 'M 20 110 A 80 80 0 0 1 180 110'
      : `M 20 110 A 80 80 0 0 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`;

    const gaugeColor = gaugePct > 80 ? '#f87171' : gaugePct > 50 ? '#fbbf24' : '#10b981';

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Transfer Budget Gauge</p>
          <p className="text-[9px] text-[#484f58]">{formatPrice(budgetInM)} remaining</p>
        </div>
        <div className="p-3 flex flex-col items-center">
          <svg viewBox="0 0 200 130" className="w-full max-w-[200px]">
            <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#21262d" strokeWidth="12" strokeLinecap="round" />
            <path d={arcD} fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round" />
            <text x="100" y="105" textAnchor="middle" fill="#c9d1d9" fontSize="20" fontWeight="bold">{gaugePct}%</text>
            <text x="100" y="120" textAnchor="middle" fill="#484f58" fontSize="8">utilized</text>
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 2: Market Value Distribution Donut
  // ========================================================
  const renderMarketValueDistributionDonut = () => {
    const counts = allPlayers.reduce<[number, number, number, number]>((acc, p) => {
      if (p.askingPrice < 5) acc[0]++;
      else if (p.askingPrice < 20) acc[1]++;
      else if (p.askingPrice < 50) acc[2]++;
      else acc[3]++;
      return acc;
    }, [0, 0, 0, 0]);

    const total = counts.reduce((s, c) => s + c, 0);
    if (total === 0) return null;
    const donutLabels = ['< €5M', '€5-20M', '€20-50M', '€50M+'];
    const donutColors = ['#10b981', '#38bdf8', '#fbbf24', '#f87171'];

    const cx = 100, cy = 100, r = 60, ir = 38;

    // Compute cumulative end angles using reduce
    const cumEndAngles = counts.reduce<number[]>((acc, count, i) => {
      const prevAngle = i === 0 ? -Math.PI / 2 : acc[i - 1];
      const sliceAngle = (count / total) * Math.PI * 2;
      acc.push(prevAngle + sliceAngle);
      return acc;
    }, []);

    // Build segment paths using reduce
    const segments = counts.reduce<{ path: string; color: string; label: string; count: number }[]>((acc, count, i) => {
      if (count === 0) return acc;
      const startAngle = i === 0 ? -Math.PI / 2 : cumEndAngles[i - 1];
      const endAngle = cumEndAngles[i];
      const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

      const osX = cx + r * Math.cos(startAngle);
      const osY = cy + r * Math.sin(startAngle);
      const oeX = cx + r * Math.cos(endAngle);
      const oeY = cy + r * Math.sin(endAngle);
      const ieX = cx + ir * Math.cos(endAngle);
      const ieY = cy + ir * Math.sin(endAngle);
      const isX = cx + ir * Math.cos(startAngle);
      const isY = cy + ir * Math.sin(startAngle);

      const path = `M ${osX.toFixed(1)} ${osY.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${oeX.toFixed(1)} ${oeY.toFixed(1)} L ${ieX.toFixed(1)} ${ieY.toFixed(1)} A ${ir} ${ir} 0 ${largeArc} 0 ${isX.toFixed(1)} ${isY.toFixed(1)} Z`;
      acc.push({ path, color: donutColors[i], label: donutLabels[i], count });
      return acc;
    }, []);

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Market Value Distribution</p>
          <p className="text-[9px] text-[#484f58]">{allPlayers.length} players by price tier</p>
        </div>
        <div className="p-3 flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill={seg.color} opacity={0.8} />
            ))}
            <circle cx={100} cy={100} r={ir - 2} fill="#161b22" />
            <text x="100" y="97" textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold">{total}</text>
            <text x="100" y="110" textAnchor="middle" fill="#484f58" fontSize="7">players</text>
          </svg>
          <div className="flex flex-wrap gap-2 mt-1">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                <span className="text-[8px] text-[#8b949e]">{seg.label} ({seg.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 3: Transfer Activity Trend (Area Chart)
  // ========================================================
  const renderTransferActivityTrend = () => {
    const trendData = [12, 18, 8, 22, 15, 28, 20, 25];
    const trendLabels = ['S1', 'W1', 'S2', 'W2', 'S3', 'W3', 'S4', 'W4'];
    const areaW = 300, areaH = 80;
    const areaPadY = 5;

    const linePointsStr = computePolylinePoints(trendData, areaW, areaH, areaPadY);
    const areaPointsStr = `0,${areaH} ${linePointsStr} ${areaW},${areaH}`;

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Transfer Activity Trend</p>
          <p className="text-[9px] text-[#484f58]">Transfers per window over 8 seasons</p>
        </div>
        <div className="p-3">
          <svg viewBox={`0 0 ${areaW} ${areaH + 20}`} className="w-full">
            <polygon points={areaPointsStr} fill="#10b981" opacity={0.1} />
            <polyline points={linePointsStr} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {trendData.map((v, i) => {
              const x = (i / (trendData.length - 1)) * areaW;
              const yMin = Math.min(...trendData);
              const yMax = Math.max(...trendData);
              const yRange = yMax - yMin || 1;
              const y = areaPadY + areaH - 2 * areaPadY - ((v - yMin) / yRange) * (areaH - 2 * areaPadY);
              return (
                <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#10b981" />
              );
            })}
            {trendLabels.map((label, i) => {
              const x = (i / (trendLabels.length - 1)) * areaW;
              return (
                <text key={i} x={x.toFixed(1)} y={areaH + 12} textAnchor="middle" fill="#484f58" fontSize="7">{label}</text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 4: Position Demand Bars
  // ========================================================
  const renderPositionDemandBars = () => {
    const demandPositions = ['GK', 'DEF', 'MID', 'FWD', 'CF', 'CAM'];
    const demandColors = ['#fbbf24', '#38bdf8', '#10b981', '#f87171', '#a78bfa', '#f472b6'];

    const demandCounts = allPlayers.reduce<number[]>((acc, p) => {
      if (p.position === 'GK') acc[0]++;
      else if (['CB', 'LB', 'RB'].includes(p.position)) acc[1]++;
      else if (['CDM', 'CM', 'LM', 'RM'].includes(p.position)) acc[2]++;
      else if (['LW', 'RW', 'ST'].includes(p.position)) acc[3]++;
      else if (p.position === 'CF') acc[4]++;
      else if (p.position === 'CAM') acc[5]++;
      return acc;
    }, [0, 0, 0, 0, 0, 0]);

    const demandMax = Math.max(...demandCounts, 1);
    const dbH = 14;
    const dbGap = 6;
    const dbLabelW = 28;
    const dbBarMaxW = 100;
    const dbSvgH = demandPositions.length * (dbH + dbGap) + 10;
    const dbSvgW = dbLabelW + dbBarMaxW + 30;

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Position Demand</p>
          <p className="text-[9px] text-[#484f58]">Available players by position</p>
        </div>
        <div className="p-3">
          <svg viewBox={`0 0 ${dbSvgW} ${dbSvgH}`} className="w-full">
            {demandPositions.map((pos, i) => {
              const y = i * (dbH + dbGap) + 5;
              const barW = Math.max(2, (demandCounts[i] / demandMax) * dbBarMaxW);
              return (
                <g key={pos}>
                  <text x={dbLabelW - 4} y={y + dbH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="9" fontWeight="500">{pos}</text>
                  <rect x={dbLabelW} y={y} width={barW} height={dbH} rx={3} fill={demandColors[i]} opacity={0.8} />
                  <text x={dbLabelW + barW + 4} y={y + dbH / 2 + 3} fill="#c9d1d9" fontSize="9" fontWeight="bold">{demandCounts[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 5: Top Targets Comparison Radar
  // ========================================================
  const renderTopTargetsComparisonRadar = () => {
    const sortedTargets = [...allPlayers].sort((a, b) => b.overall - a.overall);
    const topTargets = sortedTargets.slice(0, 3);
    const radarAxes = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
    const radarColors = ['#10b981', '#38bdf8', '#fbbf24'];
    const rcx = 100, rcy = 100, rr = 70;
    const radarN = radarAxes.length;

    const gridHexes = [0.25, 0.5, 0.75, 1.0].map(scale => computeHexPoints(rcx, rcy, rr * scale, radarN));

    const attrKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
    const playerRadarPaths = topTargets.map(player => {
      return attrKeys.map((key, i) => {
        const val = player.attributes[key] / 99;
        const angle = (Math.PI * 2 * i) / radarN - Math.PI / 2;
        const px = rcx + rr * val * Math.cos(angle);
        const py = rcy + rr * val * Math.sin(angle);
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      }).join(' ');
    });

    const radarAxisLabels = radarAxes.map((label, i) => {
      const angle = (Math.PI * 2 * i) / radarN - Math.PI / 2;
      const lx = rcx + (rr + 14) * Math.cos(angle);
      const ly = rcy + (rr + 14) * Math.sin(angle);
      return { x: lx, y: ly, label };
    });

    const axisLineEnds = Array.from({ length: radarN }, (_, i) => {
      const angle = (Math.PI * 2 * i) / radarN - Math.PI / 2;
      return { x: rcx + rr * Math.cos(angle), y: rcy + rr * Math.sin(angle) };
    });

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Top Targets Comparison</p>
          <p className="text-[9px] text-[#484f58]">Top 3 targets by attribute</p>
        </div>
        <div className="p-3 flex flex-col items-center">
          <svg viewBox="0 0 200 215" className="w-full max-w-[200px]">
            {gridHexes.map((pts, i) => (
              <polygon key={`gr-${i}`} points={pts} fill="none" stroke="#21262d" strokeWidth="0.5" />
            ))}
            {axisLineEnds.map((end, i) => (
              <line key={`ax-${i}`} x1={rcx} y1={rcy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#21262d" strokeWidth="0.5" />
            ))}
            {playerRadarPaths.map((pts, i) => (
              <polygon key={`pl-${i}`} points={pts} fill={radarColors[i]} opacity={0.15} stroke={radarColors[i]} strokeWidth="1.5" />
            ))}
            {radarAxisLabels.map((a, i) => (
              <text key={`rl-${i}`} x={a.x.toFixed(1)} y={(a.y + 3).toFixed(1)} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="500">{a.label}</text>
            ))}
          </svg>
          <div className="flex gap-3 mt-1">
            {topTargets.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: radarColors[i] }} />
                <span className="text-[8px] text-[#8b949e] truncate max-w-[60px]">{p.name.split(' ')[1] ?? p.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 6: Transfer Window Timeline
  // ========================================================
  const renderTransferWindowTimeline = () => {
    const windowItems = [
      { label: 'Summer 2024', transfers: 18, status: 'closed' as const },
      { label: 'Winter 2025', transfers: 12, status: windowStatus ? ('current' as const) : ('closed' as const) },
      { label: 'Summer 2025', transfers: 0, status: 'upcoming' as const },
    ];

    const tlW = 300;
    const tlSpacing = tlW / (windowItems.length + 1);

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Transfer Window Timeline</p>
          <p className="text-[9px] text-[#484f58]">Upcoming and recent windows</p>
        </div>
        <div className="p-3">
          <svg viewBox="0 0 300 70" className="w-full">
            <line x1="30" y1="25" x2="270" y2="25" stroke="#21262d" strokeWidth="2" />
            {windowItems.map((win, i) => {
              const wx = tlSpacing * (i + 1);
              const dotColor = win.status === 'current' ? '#10b981' : win.status === 'upcoming' ? '#38bdf8' : '#484f58';
              const dotR = win.status === 'current' ? 6 : 4;
              return (
                <g key={i}>
                  <circle cx={wx.toFixed(1)} cy="25" r={dotR} fill={dotColor} />
                  <text x={wx.toFixed(1)} y="15" textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="500">{win.label}</text>
                  <text x={wx.toFixed(1)} y="45" textAnchor="middle" fill="#8b949e" fontSize="8">{win.transfers} transfers</text>
                  {win.status === 'current' && (
                    <>
                      <rect x={(wx - 18).toFixed(1)} y="52" width="36" height="12" rx={3} fill="#10b981" opacity={0.15} stroke="#10b981" strokeWidth="0.5" />
                      <text x={wx.toFixed(1)} y="61" textAnchor="middle" fill="#10b981" fontSize="7" fontWeight="bold">OPEN</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 7: Squad Gaps Hex Radar
  // ========================================================
  const renderSquadGapsHexRadar = () => {
    const squadGaps = [65, 72, 55, 40, 80, 68];
    const squadLabels = ['GK', 'DEF', 'MID', 'FWD', 'CF', 'CAM'];
    const scx = 100, scy = 100, sr = 70;
    const sn = squadLabels.length;

    const squadGridHexes = [0.25, 0.5, 0.75, 1.0].map(scale => computeHexPoints(scx, scy, sr * scale, sn));

    const squadGapPoints = squadGaps.map((val, i) => {
      const normalized = val / 100;
      const angle = (Math.PI * 2 * i) / sn - Math.PI / 2;
      const px = scx + sr * normalized * Math.cos(angle);
      const py = scy + sr * normalized * Math.sin(angle);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(' ');

    const squadAxisEnds = Array.from({ length: sn }, (_, i) => {
      const angle = (Math.PI * 2 * i) / sn - Math.PI / 2;
      return { x: scx + sr * Math.cos(angle), y: scy + sr * Math.sin(angle) };
    });

    const squadLabelPositions = squadLabels.map((label, i) => {
      const angle = (Math.PI * 2 * i) / sn - Math.PI / 2;
      const lx = scx + (sr + 14) * Math.cos(angle);
      const ly = scy + (sr + 14) * Math.sin(angle);
      return { x: lx, y: ly, label, val: squadGaps[i] };
    });

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Squad Gaps Analysis</p>
          <p className="text-[9px] text-[#484f58]">Squad depth by position</p>
        </div>
        <div className="p-3 flex flex-col items-center">
          <svg viewBox="0 0 200 215" className="w-full max-w-[200px]">
            {squadGridHexes.map((pts, i) => (
              <polygon key={`sg-${i}`} points={pts} fill="none" stroke="#21262d" strokeWidth="0.5" />
            ))}
            {squadAxisEnds.map((end, i) => (
              <line key={`sa-${i}`} x1={scx} y1={scy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#21262d" strokeWidth="0.5" />
            ))}
            <polygon points={squadGapPoints} fill="#f87171" opacity={0.15} stroke="#f87171" strokeWidth="1.5" />
            {squadLabelPositions.map((a, i) => {
              const gapColor = a.val < 50 ? '#f87171' : a.val < 70 ? '#fbbf24' : '#10b981';
              return (
                <text key={`sl-${i}`} x={a.x.toFixed(1)} y={(a.y + 3).toFixed(1)} textAnchor="middle" fill={gapColor} fontSize="8" fontWeight="bold">{a.label} {a.val}</text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 8: Transfer Spending Trend Line
  // ========================================================
  const renderTransferSpendingTrendLine = () => {
    const spendingData = [45, 32, 68, 55, 78, 42];
    const spendingLabels = ["S1 '22", "W1 '22", "S2 '22", "S1 '23", "W1 '23", "S2 '23"];
    const spW = 300, spH = 80, spPadY = 5;

    const spLinePointsStr = computePolylinePoints(spendingData, spW, spH, spPadY);

    const spMin = Math.min(...spendingData);
    const spMax = Math.max(...spendingData);
    const spRange = spMax - spMin || 1;

    const dotPositions = spendingData.map((v, i) => {
      const x = (i / (spendingData.length - 1)) * spW;
      const y = spPadY + spH - 2 * spPadY - ((v - spMin) / spRange) * (spH - 2 * spPadY);
      return { x, y, v };
    });

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Transfer Spending Trend</p>
          <p className="text-[9px] text-[#484f58]">Spending per window (€M)</p>
        </div>
        <div className="p-3">
          <svg viewBox={`0 0 ${spW} ${spH + 20}`} className="w-full">
            <polyline points={spLinePointsStr} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {dotPositions.map((dot, i) => (
              <g key={i}>
                <circle cx={dot.x.toFixed(1)} cy={dot.y.toFixed(1)} r="3" fill="#38bdf8" />
                <text x={dot.x.toFixed(1)} y={(dot.y - 6).toFixed(1)} textAnchor="middle" fill="#38bdf8" fontSize="7">€{dot.v}M</text>
              </g>
            ))}
            {spendingLabels.map((label, i) => {
              const x = (i / (spendingLabels.length - 1)) * spW;
              return (
                <text key={i} x={x.toFixed(1)} y={spH + 12} textAnchor="middle" fill="#484f58" fontSize="7">{label}</text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 9: Agent Negotiation Quality Ring
  // ========================================================
  const renderAgentNegotiationQualityRing = () => {
    const successRate = 72;
    const failureRate = 28;
    const nCx = 80, nCy = 80, nR = 60;

    const nStartAngle = -Math.PI / 2;
    const nEndAngle = nStartAngle + (2 * Math.PI * successRate / 100);

    const nsX = nCx + nR * Math.cos(nStartAngle);
    const nsY = nCy + nR * Math.sin(nStartAngle);
    const neX = nCx + nR * Math.cos(nEndAngle);
    const neY = nCy + nR * Math.sin(nEndAngle);

    const nLargeArc = (successRate / 100) > 0.5 ? 1 : 0;
    const nArcPath = `M ${nsX.toFixed(1)} ${nsY.toFixed(1)} A ${nR} ${nR} 0 ${nLargeArc} 1 ${neX.toFixed(1)} ${neY.toFixed(1)}`;

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Negotiation Quality</p>
          <p className="text-[9px] text-[#484f58]">Agent success rate</p>
        </div>
        <div className="p-3 flex flex-col items-center">
          <svg viewBox="0 0 160 160" className="w-full max-w-[120px]">
            <circle cx={nCx} cy={nCy} r={nR} fill="none" stroke="#21262d" strokeWidth="10" />
            <path d={nArcPath} fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
            <text x={nCx} y={nCy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="24" fontWeight="bold">{successRate}%</text>
            <text x={nCx} y={nCy + 12} textAnchor="middle" fill="#484f58" fontSize="8">success</text>
          </svg>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500" />
              <span className="text-[9px] text-[#8b949e]">Accepted {successRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-red-400" />
              <span className="text-[9px] text-[#8b949e]">Rejected {failureRate}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 10: Scouted Players Scatter
  // ========================================================
  const renderScoutedPlayersScatter = () => {
    const scoutedPlayers = allPlayers.slice(0, 12);
    const catColorMap: Record<string, string> = {
      GK: '#fbbf24',
      DEF: '#38bdf8',
      MID: '#10b981',
      FWD: '#f87171',
    };

    const scW = 280, scH = 100, scPadX = 20, scPadY = 10;
    const scMinAge = 17, scMaxAge = 36;
    const scMinOvr = 50, scMaxOvr = 95;

    const scatterDots = scoutedPlayers.map(p => {
      const cat = getPositionCategory(p.position);
      const px = scPadX + ((p.age - scMinAge) / (scMaxAge - scMinAge)) * (scW - 2 * scPadX);
      const py = scH - ((p.overall - scMinOvr) / (scMaxOvr - scMinOvr)) * (scH - scPadY);
      return { x: px, y: py, color: catColorMap[cat] ?? '#484f58', id: p.id, cat };
    });

    const catEntries = Object.entries(catColorMap);

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Scouted Players</p>
          <p className="text-[9px] text-[#484f58]">Age vs Overall Rating</p>
        </div>
        <div className="p-3">
          <svg viewBox={`0 0 ${scW} ${scH + 30}`} className="w-full">
            <line x1={scPadX} y1={scPadY} x2={scPadX} y2={scH} stroke="#21262d" strokeWidth="1" />
            <line x1={scPadX} y1={scH} x2={scW - scPadX} y2={scH} stroke="#21262d" strokeWidth="1" />
            <text x={scW / 2} y={scH + 15} textAnchor="middle" fill="#484f58" fontSize="7">Age →</text>
            <text x={6} y={scPadY + 4} textAnchor="start" fill="#484f58" fontSize="7">OVR</text>
            {scatterDots.map(dot => (
              <circle key={dot.id} cx={dot.x.toFixed(1)} cy={dot.y.toFixed(1)} r="4" fill={dot.color} opacity={0.8} />
            ))}
            {catEntries.map(([cat, color], i) => (
              <g key={cat}>
                <circle cx={scPadX + i * 50} cy={scH + 25} r="3" fill={color} />
                <text x={scPadX + i * 50 + 5} y={scH + 28} fill="#8b949e" fontSize="7">{cat}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // ========================================================
  // SVG 11: Transfer History Butterfly Chart
  // ========================================================
  const renderTransferHistoryButterflyChart = () => {
    const bfSeasons = ['S1', 'S2', 'S3', 'S4'];
    const bfIns = [42, 65, 38, 55];
    const bfOuts = [28, 35, 52, 40];
    const bfMaxVal = Math.max(...bfIns, ...bfOuts, 1);

    const bfBarH = 14;
    const bfGap = 12;
    const bfMidX = 150;
    const bfBarMaxW = 80;
    const bfSvgH = bfSeasons.length * (bfBarH + bfGap) + 30;

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#30363d]">
          <p className="text-xs font-semibold text-[#c9d1d9]">Transfer History</p>
          <p className="text-[9px] text-[#484f58]">Ins vs Outs by season (€M)</p>
        </div>
        <div className="p-3">
          <svg viewBox={`0 0 300 ${bfSvgH}`} className="w-full">
            <line x1={bfMidX} y1="5" x2={bfMidX} y2={bfSvgH - 20} stroke="#30363d" strokeWidth="1" />
            {bfSeasons.map((season, i) => {
              const by = i * (bfBarH + bfGap) + 10;
              const inW = Math.max(2, (bfIns[i] / bfMaxVal) * bfBarMaxW);
              const outW = Math.max(2, (bfOuts[i] / bfMaxVal) * bfBarMaxW);
              return (
                <g key={season}>
                  <text x={bfMidX} y={by - 3} textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="bold">{season}</text>
                  <rect x={bfMidX - inW} y={by} width={inW} height={bfBarH} rx={3} fill="#10b981" opacity={0.7} />
                  <text x={bfMidX - inW - 3} y={by + bfBarH / 2 + 3} textAnchor="end" fill="#10b981" fontSize="8" fontWeight="bold">€{bfIns[i]}M</text>
                  <rect x={bfMidX + 2} y={by} width={outW} height={bfBarH} rx={3} fill="#f87171" opacity={0.7} />
                  <text x={bfMidX + outW + 6} y={by + bfBarH / 2 + 3} fill="#f87171" fontSize="8" fontWeight="bold">€{bfOuts[i]}M</text>
                </g>
              );
            })}
            <text x={bfMidX - 50} y={bfSvgH - 5} textAnchor="end" fill="#10b981" fontSize="7">● Incoming</text>
            <text x={bfMidX + 50} y={bfSvgH - 5} textAnchor="start" fill="#f87171" fontSize="7">● Outgoing</text>
          </svg>
        </div>
      </div>
    );
  };

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
          <TabsTrigger value="analytics" className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400">
            <Activity className="h-3 w-3 mr-1" />
            Analytics
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

        {/* Analytics Tab — 11 SVG Data Visualizations */}
        <TabsContent value="analytics">
          <div className="space-y-3 pb-4">
            {/* Row 1: Budget Gauge + Donut */}
            <div className="grid grid-cols-2 gap-2">
              {renderTransferBudgetGauge()}
              {renderMarketValueDistributionDonut()}
            </div>

            {/* Row 2: Transfer Activity Trend (full width) */}
            {renderTransferActivityTrend()}

            {/* Row 3: Position Demand + Top Targets Radar */}
            <div className="grid grid-cols-2 gap-2">
              {renderPositionDemandBars()}
              {renderTopTargetsComparisonRadar()}
            </div>

            {/* Row 4: Transfer Window Timeline (full width) */}
            {renderTransferWindowTimeline()}

            {/* Row 5: Squad Gaps + Negotiation Ring */}
            <div className="grid grid-cols-2 gap-2">
              {renderSquadGapsHexRadar()}
              {renderAgentNegotiationQualityRing()}
            </div>

            {/* Row 6: Spending Trend Line (full width) */}
            {renderTransferSpendingTrendLine()}

            {/* Row 7: Scouted Players Scatter (full width) */}
            {renderScoutedPlayersScatter()}

            {/* Row 8: Butterfly Chart (full width) */}
            {renderTransferHistoryButterflyChart()}
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
