'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

// ============================================================
// Types
// ============================================================

interface ScoutedPlayer {
  id: string;
  name: string;
  age: number;
  position: string;
  nationality: string;
  flagEmoji: string;
  club: string;
  league: string;
  ovr: number;
  potential: number;
  keyStat: string;
  keyStatValue: number;
  estimatedPrice: number;
  strengths: string[];
  weaknesses: string[];
  scoutRating: number;
  scoutStars: number;
  recommendation: 'Sign' | 'Monitor' | 'Avoid';
  styleOfPlay: string;
  region: string;
  attributes: AttributeCategory[];
}

interface AttributeCategory {
  name: string;
  attrs: { name: string; value: number; comparison: number }[];
}

interface ScoutStaff {
  id: string;
  name: string;
  nationality: string;
  flagEmoji: string;
  specialization: string;
  quality: number;
  stars: number;
  currentAssignment: string;
  reportsThisMonth: number;
  region: string;
}

interface MapRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  players: number;
  scouts: number;
}

type ShortlistTab = 'shortlist' | 'watchlist' | 'rejected';
type PositionFilter = 'Any' | 'GK' | 'DEF' | 'MID' | 'FWD';
type LeagueFilter = 'Any' | 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'Ligue 1';
type SortKey = 'ovr' | 'age' | 'price' | 'position' | 'scoutRating';
type ScoutLevel = 'Amateur' | 'Professional' | 'Elite';

// ============================================================
// Constants
// ============================================================

const NATIONALITIES: { name: string; flag: string }[] = [
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Canada', flag: '🇨🇦' },
];

const FIRST_NAMES: string[] = [
  'Lucas', 'Gabriel', 'Mateo', 'Thiago', 'Marco', 'Rafael', 'Leo', 'Santiago',
  'Andre', 'Carlos', 'Nicolas', 'Luis', 'Felix', 'Enzo', 'Matteo', 'Federico',
  'Erik', 'Jamal', 'Florian', 'Kai', 'Jude', 'Phil', 'Bukayo', 'Cole',
  'Pedro', 'Joao', 'Diogo', 'Bruno', 'Ruben', 'Vitinha', 'Xavi', 'Gavi',
  'Toni', 'Joshua', 'Leroy', 'Serge', 'Dayot', 'Aurelien', 'Youssouf',
  'Cody', 'Donyell', 'Memphis', 'Virgil', 'Frenkie', 'Matthijs', 'Denzel',
  'Christian', 'Pierre', 'Rafael', 'Ederson', 'Alisson', 'Casemiro',
];

const LAST_NAMES: string[] = [
  'Silva', 'Santos', 'Oliveira', 'Rodriguez', 'Hernandez', 'Martinez',
  'Garcia', 'Lopez', 'Muller', 'Schmidt', 'Weber', 'Fischer',
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard',
  'Rossi', 'Romano', 'Colombo', 'Ricci', 'Ferrari', 'Bianchi',
  'Lopez', 'Torres', 'Ruiz', 'Navarro', 'Gomez', 'Diaz',
  'Jansen', 'De Jong', 'Bergwijn', 'Simons', 'Timber', 'Wijndal',
  'Hazard', 'Lukaku', 'De Bruyne', 'Tielemans', 'Doku', 'Openda',
  'Dias', 'Leao', 'Raphinha', 'Neres', 'Vinicius', 'Paqueta',
  'Saka', 'Rice', 'Bellingham', 'Palmer', 'Foden', 'Gordon',
  'Yamal', 'Pedri', 'Balde', 'Gyokeres', 'Isak', 'Hojlund',
];

const POSITIONS: string[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'LM', 'RM', 'ST', 'CF'];

const CLUBS: string[] = [
  'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Tottenham',
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
  'Bayern Munich', 'Dortmund', 'Leipzig', 'Leverkusen', 'Wolfsburg',
  'PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille',
  'Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma',
  'Ajax', 'Benfica', 'Porto', 'Sporting CP', 'Braga',
  'Flamengo', 'Palmeiras', 'Santos', 'River Plate', 'Boca Juniors',
];

const LEAGUES: string[] = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

const REGIONS: { id: string; name: string; nations: string[] }[] = [
  { id: 'western_europe', name: 'Western Europe', nations: ['England', 'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium'] },
  { id: 'eastern_europe', name: 'Eastern Europe', nations: ['Croatia', 'Serbia', 'Poland', 'Turkey', 'Norway', 'Sweden', 'Denmark'] },
  { id: 'south_america', name: 'South America', nations: ['Brazil', 'Argentina', 'Uruguay', 'Colombia'] },
  { id: 'north_america', name: 'North America', nations: ['USA', 'Mexico', 'Canada'] },
  { id: 'africa', name: 'Africa', nations: ['Nigeria', 'Senegal', 'Morocco', 'Ghana', 'Cameroon'] },
  { id: 'asia', name: 'Asia', nations: ['Japan', 'South Korea', 'Australia'] },
];

const STRENGTHS_POOL: string[] = [
  'Clinical Finishing', 'Pace', 'Dribbling', 'Passing Range', 'Aerial Ability',
  'Tackling', 'Positioning', 'Work Rate', 'Vision', 'Composure',
  'Long Shots', 'Crossing', 'Free Kicks', 'Leadership', 'Stamina',
  'Ball Control', 'First Touch', 'Anticipation', 'Strength', 'Agility',
];

const WEAKNESSES_POOL: string[] = [
  'Weak Foot', 'Aerial Duels', 'Discipline', 'Consistency', 'Injury Prone',
  'Slow Pace', 'Poor Finishing', 'Positioning', 'Passing', 'Decision Making',
  'Strength', 'Stamina', 'Composure Under Pressure', 'Heading', 'Tackling',
  'Crossing', 'Off-Ball Movement', 'Set Pieces', 'Concentration', 'Dribbling',
];

const STYLE_OF_PLAY: string[] = [
  'A dynamic player who excels in transition, using explosive pace to get behind defences. Prefers direct attacking play and thrives in counter-attacking situations.',
  'A technically gifted player with excellent close control and vision. Orchestrates play from deep areas and rarely loses possession in tight spaces.',
  'A physical presence who dominates aerial duels and provides a strong focal point in attack. Excellent hold-up play and brings teammates into the game.',
  'A versatile midfielder who contributes both defensively and offensively. High work rate allows them to cover large areas of the pitch effectively.',
  'A composed defender who reads the game well and makes crucial interceptions. Strong in one-on-one situations and rarely gets beaten.',
  'An aggressive ball-winner who excels at pressing and winning the ball back in advanced areas. Provides energy and disruption in midfield.',
  'A creative playmaker who operates in the pockets between lines. Exceptional passing range and ability to unlock defences with through balls.',
  'A reliable shot-stopper with quick reflexes and excellent distribution. Commands the penalty area well and organises the defence effectively.',
];

const SCOUT_NAMES: { name: string; nat: string; flag: string; spec: string; region: string }[] = [
  { name: 'Carlos Mendez', nat: 'Spain', flag: '🇪🇸', spec: 'Forward Scout', region: 'western_europe' },
  { name: 'Hans Weber', nat: 'Germany', flag: '🇩🇪', spec: 'Defensive Scout', region: 'eastern_europe' },
  { name: 'Rafael Costa', nat: 'Brazil', flag: '🇧🇷', spec: 'Youth Scout', region: 'south_america' },
  { name: 'James Mitchell', nat: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', spec: 'General Scout', region: 'africa' },
  { name: 'Kenji Tanaka', nat: 'Japan', flag: '🇯🇵', spec: 'Goalkeeper Scout', region: 'asia' },
];

// ============================================================
// Seeded Random
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

function ovrColor(ovr: number): string {
  if (ovr >= 85) return '#34d399';
  if (ovr >= 75) return '#3b82f6';
  if (ovr >= 65) return '#f59e0b';
  return '#8b949e';
}

function potentialColor(pot: number): string {
  if (pot >= 90) return '#a78bfa';
  if (pot >= 80) return '#34d399';
  if (pot >= 70) return '#f59e0b';
  return '#8b949e';
}

function recommendationColor(rec: 'Sign' | 'Monitor' | 'Avoid'): string {
  if (rec === 'Sign') return '#34d399';
  if (rec === 'Monitor') return '#f59e0b';
  return '#ef4444';
}

function positionGroup(pos: string): PositionFilter {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'FWD';
}

function getRegionForNationality(nationality: string): string {
  for (const region of REGIONS) {
    if (region.nations.includes(nationality)) return region.id;
  }
  return 'western_europe';
}

// ============================================================
// Player Generation
// ============================================================

function generateScoutedPlayer(seed: number, index: number, filters: SearchFilters): ScoutedPlayer {
  const rng = seededRandom(seed + index * 7919);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const posGroup = filters.position;
  let position: string;
  if (posGroup === 'Any') {
    position = pick(POSITIONS);
  } else if (posGroup === 'GK') {
    position = 'GK';
  } else if (posGroup === 'DEF') {
    position = pick(['CB', 'LB', 'RB']);
  } else if (posGroup === 'MID') {
    position = pick(['CDM', 'CM', 'CAM', 'LM', 'RM']);
  } else {
    position = pick(['LW', 'RW', 'ST', 'CF']);
  }

  const age = Math.floor(rng() * (filters.maxAge - filters.minAge + 1)) + filters.minAge;
  const baseOvr = filters.minOvr + Math.floor(rng() * Math.max(1, (100 - filters.minOvr)));
  const ovr = Math.min(99, Math.max(40, baseOvr));
  const potentialDelta = Math.floor(rng() * 20) - 5;
  const potential = Math.min(99, Math.max(ovr, ovr + potentialDelta));

  const nat = pick(NATIONALITIES);
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);

  const league = filters.league === 'Any' ? pick(LEAGUES) : filters.league;
  const leagueClubs = CLUBS.filter(() => rng() > 0.6).slice(0, 3);
  const club = leagueClubs.length > 0 ? pick(leagueClubs) : pick(CLUBS);

  const keyStatOptions = position === 'GK'
    ? ['Reflexes', 'Positioning', 'Diving', 'Handling', 'Kicking']
    : ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];
  const keyStat = pick(keyStatOptions);
  const keyStatValue = Math.min(99, Math.max(40, ovr + Math.floor(rng() * 16) - 8));

  const priceBase = Math.pow(ovr / 10, 3) * 1_000_000;
  const estimatedPrice = Math.round((priceBase + rng() * priceBase * 0.5) * (age < 25 ? 1.3 : age < 30 ? 1.0 : 0.6));

  const shuffledStrengths = [...STRENGTHS_POOL].sort(() => rng() - 0.5);
  const shuffledWeaknesses = [...WEAKNESSES_POOL].sort(() => rng() - 0.5);
  const strengths = shuffledStrengths.slice(0, 3);
  const weaknesses = shuffledWeaknesses.slice(0, 3);

  const scoutStars = Math.min(5, Math.max(1, Math.floor(rng() * 5) + 1));
  const scoutRating = Math.round((ovr * 0.4 + potential * 0.3 + scoutStars * 6 + rng() * 10));

  let recommendation: 'Sign' | 'Monitor' | 'Avoid';
  if (scoutRating >= 75 && potential - ovr >= 3) recommendation = 'Sign';
  else if (scoutRating >= 55) recommendation = 'Monitor';
  else recommendation = 'Avoid';

  const style = pick(STYLE_OF_PLAY);
  const region = getRegionForNationality(nat.name);

  const categoryNames = position === 'GK'
    ? ['Shot Stopping', 'Command', 'Distribution', 'Physical', 'Mental', 'Speed']
    : ['Technical', 'Mental', 'Physical', 'Defending', 'Attacking', 'Movement'];

  const attrPool: string[][] = position === 'GK'
    ? [['Reflexes', 'Diving', 'Handling', 'Positioning'], ['Aerial', 'Command', 'Communication', 'Organization'], ['Kicking', 'Throwing', 'Sweeper'], ['Jumping', 'Strength', 'Agility'], ['Composure', 'Concentration', 'Decision'], ['Speed', 'Acceleration', 'Reaction']]
    : [['Finishing', 'Passing', 'Dribbling', 'Ball Control', 'First Touch'], ['Vision', 'Composure', 'Concentration', 'Work Rate'], ['Stamina', 'Strength', 'Agility', 'Jumping'], ['Tackling', 'Marking', 'Interceptions', 'Standing Tackle'], ['Finishing', 'Heading', 'Long Shots', 'Volleys'], ['Acceleration', 'Sprint Speed', 'Agility', 'Balance']];

  const attributes: AttributeCategory[] = categoryNames.map((name, ci) => ({
    name,
    attrs: (attrPool[ci] || ['Attr 1', 'Attr 2']).map((attrName: string) => {
      const base = ovr + Math.floor(rng() * 20) - 10;
      const value = Math.min(99, Math.max(30, base));
      const comparison = Math.min(99, Math.max(30, base + Math.floor(rng() * 16) - 8));
      return { name: attrName, value, comparison };
    }),
  }));

  return {
    id: `scout_${seed}_${index}`,
    name: `${firstName} ${lastName}`,
    age,
    position,
    nationality: nat.name,
    flagEmoji: nat.flag,
    club,
    league,
    ovr,
    potential,
    keyStat,
    keyStatValue,
    estimatedPrice,
    strengths,
    weaknesses,
    scoutRating,
    scoutStars,
    recommendation,
    styleOfPlay: style,
    region,
    attributes,
  };
}

// ============================================================
// Search Filters
// ============================================================

interface SearchFilters {
  position: PositionFilter;
  minAge: number;
  maxAge: number;
  minOvr: number;
  league: LeagueFilter;
  maxPrice: number;
}

// ============================================================
// Radar Chart SVG
// ============================================================

function RadarChart({ player, comparePlayer, size = 200 }: {
  player: ScoutedPlayer;
  comparePlayer?: ScoutedPlayer;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const categories = player.attributes.length;
  const angleStep = (2 * Math.PI) / categories;

  const buildPoints = (p: ScoutedPlayer) =>
    p.attributes.map((cat, i) => {
      const avg = cat.attrs.reduce((s, a) => s + a.value, 0) / cat.attrs.length;
      const norm = avg / 99;
      const angle = angleStep * i - Math.PI / 2;
      return { x: cx + Math.cos(angle) * radius * norm, y: cy + Math.sin(angle) * radius * norm };
    });

  const points1 = buildPoints(player);
  const points2 = comparePlayer ? buildPoints(comparePlayer) : null;
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const pointsToString = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {gridRings.map((r, ri) => {
        const pts = Array.from({ length: categories }, (_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${cx + Math.cos(angle) * radius * r},${cy + Math.sin(angle) * radius * r}`;
        }).join(' ');
        return (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="#30363d"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: categories }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * radius}
            y2={cy + Math.sin(angle) * radius}
            stroke="#30363d"
            strokeWidth="1"
          />
        );
      })}

      {/* Compare player polygon */}
      {points2 && (
        <polygon
          points={pointsToString(points2)}
          fill="rgba(239,68,68,0.12)"
          stroke="#ef4444"
          strokeWidth="1.5"
        />
      )}

      {/* Player polygon */}
      <polygon
        points={pointsToString(points1)}
        fill="rgba(52,211,153,0.15)"
        stroke="#34d399"
        strokeWidth="2"
      />

      {/* Dots */}
      {points1.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#34d399" />
      ))}
      {points2?.map((p, i) => (
        <circle key={`c${i}`} cx={p.x} cy={p.y} r="2.5" fill="#ef4444" />
      ))}

      {/* Labels */}
      {player.attributes.map((cat, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = radius + 18;
        return (
          <text
            key={i}
            x={cx + Math.cos(angle) * labelR}
            y={cy + Math.sin(angle) * labelR}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#8b949e"
            fontSize="9"
            fontFamily="sans-serif"
          >
            {cat.name}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Stars Display
// ============================================================

function StarDisplay({ count, max = 5, color = '#f59e0b' }: { count: number; max?: number; color?: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < count ? color : '#30363d'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ============================================================
// Attribute Bar
// ============================================================

function AttrBar({ name, value, comparison }: { name: string; value: number; comparison: number }) {
  const barWidth = `${value}%`;
  const compWidth = `${comparison}%`;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] text-[#8b949e]">{name}</span>
        <span className="text-[11px] font-bold" style={{ color: ovrColor(value) }}>{value}</span>
      </div>
      <div className="relative h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[#30363d] rounded-sm" style={{ width: compWidth, opacity: 0.5 }} />
        <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: barWidth, backgroundColor: ovrColor(value) }} />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ScoutingNetwork() {
  const gameState = useGameStore(state => state.gameState);

  // UI State
  const [activeTab, setActiveTab] = useState<string>('discovery');
  const [filters, setFilters] = useState<SearchFilters>({
    position: 'Any',
    minAge: 16,
    maxAge: 40,
    minOvr: 60,
    league: 'Any',
    maxPrice: 200_000_000,
  });
  const [searchPage, setSearchPage] = useState<number>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<ScoutedPlayer | null>(null);
  const [shortlistTab, setShortlistTab] = useState<ShortlistTab>('shortlist');
  const [shortlist, setShortlist] = useState<ScoutedPlayer[]>([]);
  const [watchlist, setWatchlist] = useState<ScoutedPlayer[]>([]);
  const [rejected, setRejected] = useState<ScoutedPlayer[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('ovr');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  // Derived state
  const season = gameState?.currentSeason ?? 1;
  const week = gameState?.currentWeek ?? 1;
  const scoutLevel: ScoutLevel = season < 3 ? 'Amateur' : season < 7 ? 'Professional' : 'Elite';
  const budget = season * 500_000 + 200_000;
  const activeScouts = Math.min(5, 2 + Math.floor(season / 2));
  const maxScouts = 5;

  // Scout staff
  const scoutStaff: ScoutStaff[] = useMemo(() => {
    const rng = seededRandom(42);
    return SCOUT_NAMES.slice(0, activeScouts).map((s, i) => ({
      id: `scout_staff_${i}`,
      name: s.name,
      nationality: s.nat,
      flagEmoji: s.flag,
      specialization: s.spec,
      quality: Math.min(5, Math.max(1, Math.floor(rng() * 5) + 1)),
      stars: Math.min(5, Math.max(1, Math.floor(rng() * 4) + 1 + Math.floor(season / 3))),
      currentAssignment: `${s.spec} — ${REGIONS.find(r => r.id === s.region)?.name ?? 'Europe'}`,
      reportsThisMonth: Math.floor(rng() * 12) + 1,
      region: s.region,
    }));
  }, [activeScouts, season]);

  // Deterministic search results
  const searchResults = useMemo(() => {
    const seed = hashString(`${filters.position}-${filters.minAge}-${filters.maxAge}-${filters.minOvr}-${filters.league}-${filters.maxPrice}-${season}`);
    const results: ScoutedPlayer[] = [];
    for (let i = 0; i < 30; i++) {
      const p = generateScoutedPlayer(seed, i, filters);
      if (p.estimatedPrice <= filters.maxPrice) {
        results.push(p);
      }
    }
    return results;
  }, [filters, season]);

  const totalPages = Math.max(1, Math.ceil(searchResults.length / 6));
  const pagedResults = useMemo(() => {
    const start = (searchPage - 1) * 6;
    return searchResults.slice(start, start + 6);
  }, [searchResults, searchPage]);

  // Quick stats
  const quickStats = useMemo(() => ({
    playersScoutedMonth: 14 + (week % 12),
    reportsGenerated: 8 + Math.floor(week / 3),
    shortlistSize: shortlist.length,
  }), [week, shortlist.length]);

  // Map regions
  const mapRegions: MapRegion[] = useMemo(() => {
    const allPlayers = searchResults;
    return REGIONS.map(r => ({
      id: r.id,
      name: r.name,
      x: r.id === 'western_europe' ? 38 : r.id === 'eastern_europe' ? 58 : r.id === 'south_america' ? 28 : r.id === 'north_america' ? 20 : r.id === 'africa' ? 50 : 72,
      y: r.id === 'western_europe' ? 30 : r.id === 'eastern_europe' ? 28 : r.id === 'south_america' ? 65 : r.id === 'north_america' ? 32 : r.id === 'africa' ? 52 : 35,
      players: allPlayers.filter(p => p.region === r.id).length,
      scouts: scoutStaff.filter(s => s.region === r.id).length,
    }));
  }, [searchResults, scoutStaff]);

  // Handlers
  const handleSearch = useCallback(() => {
    setSearchPage(1);
    setSelectedPlayer(null);
    setShowFullReport(false);
  }, []);

  const handleAddToShortlist = useCallback((player: ScoutedPlayer) => {
    setShortlist(prev => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });
  }, []);

  const handleAddToWatchlist = useCallback((player: ScoutedPlayer) => {
    setWatchlist(prev => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });
  }, []);

  const handleReject = useCallback((player: ScoutedPlayer) => {
    setRejected(prev => {
      if (prev.some(p => p.id === player.id)) return prev;
      return [...prev, player];
    });
    setShortlist(prev => prev.filter(p => p.id !== player.id));
    setWatchlist(prev => prev.filter(p => p.id !== player.id));
  }, []);

  const handleRemoveFromShortlist = useCallback((playerId: string) => {
    setShortlist(prev => prev.filter(p => p.id !== playerId));
    setCompareIds(prev => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
  }, []);

  const handleRemoveFromWatchlist = useCallback((playerId: string) => {
    setWatchlist(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const handleRemoveFromRejected = useCallback((playerId: string) => {
    setRejected(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const handleCompareToggle = useCallback((playerId: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else if (next.size < 3) {
        next.add(playerId);
      }
      return next;
    });
  }, []);

  const handleRegionClick = useCallback((regionId: string) => {
    setSelectedRegion(prev => prev === regionId ? null : regionId);
  }, []);

  // Sorted shortlist
  const sortedShortlist = useMemo(() => {
    return [...shortlist].sort((a, b) => {
      if (sortKey === 'ovr') return b.ovr - a.ovr;
      if (sortKey === 'age') return a.age - b.age;
      if (sortKey === 'price') return a.estimatedPrice - b.estimatedPrice;
      if (sortKey === 'position') return a.position.localeCompare(b.position);
      if (sortKey === 'scoutRating') return b.scoutRating - a.scoutRating;
      return 0;
    });
  }, [shortlist, sortKey]);

  const shortlistSummary = useMemo(() => {
    const total = sortedShortlist.length;
    const avgOvr = total > 0 ? Math.round(sortedShortlist.reduce((s, p) => s + p.ovr, 0) / total) : 0;
    const totalValue = sortedShortlist.reduce((s, p) => s + p.estimatedPrice, 0);
    return { total, avgOvr, totalValue };
  }, [sortedShortlist]);

  const comparePlayers = useMemo(() => {
    return shortlist.filter(p => compareIds.has(p.id));
  }, [shortlist, compareIds]);

  const currentList = shortlistTab === 'shortlist' ? sortedShortlist
    : shortlistTab === 'watchlist' ? watchlist
    : rejected;

  if (!gameState) return null;

  // ============================================================
  // Render: Scouting Hub Header
  // ============================================================

  const renderHeader = () => (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#21262d] rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#c9d1d9]">Scouting Network</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-px rounded-sm font-semibold" style={{
                backgroundColor: scoutLevel === 'Elite' ? 'rgba(167,139,250,0.15)' : scoutLevel === 'Professional' ? 'rgba(59,130,246,0.15)' : 'rgba(139,148,158,0.15)',
                color: scoutLevel === 'Elite' ? '#a78bfa' : scoutLevel === 'Professional' ? '#3b82f6' : '#8b949e',
              }}>
                {scoutLevel}
              </span>
              <span className="text-[10px] text-[#484f58]">Season {season}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="bg-[#0d1117] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[#484f58] mb-0.5">Budget</div>
          <div className="text-xs font-bold text-[#34d399]">{formatPrice(budget)}</div>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[#484f58] mb-0.5">Active Scouts</div>
          <div className="text-xs font-bold text-[#c9d1d9]">{activeScouts}/{maxScouts}</div>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[#484f58] mb-0.5">Scouted</div>
          <div className="text-xs font-bold text-[#f59e0b]">{quickStats.playersScoutedMonth}</div>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-2 text-center">
          <div className="text-[10px] text-[#484f58] mb-0.5">Shortlist</div>
          <div className="text-xs font-bold text-[#3b82f6]">{quickStats.shortlistSize}</div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // Render: Player Discovery Search
  // ============================================================

  const renderDiscovery = () => (
    <div className="p-4 space-y-3">
      {/* Filters */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#c9d1d9]">Search Filters</span>
          <button
            onClick={() => setFilters({ position: 'Any', minAge: 16, maxAge: 40, minOvr: 60, league: 'Any', maxPrice: 200_000_000 })}
            className="text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Position Filter */}
        <div>
          <label className="text-[10px] text-[#8b949e] mb-1 block">Position</label>
          <div className="flex gap-1 flex-wrap">
            {(['Any', 'GK', 'DEF', 'MID', 'FWD'] as PositionFilter[]).map(pos => (
              <button
                key={pos}
                onClick={() => setFilters(f => ({ ...f, position: pos }))}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                  filters.position === pos
                    ? 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div>
          <label className="text-[10px] text-[#8b949e] mb-1 block">Age Range: {filters.minAge} - {filters.maxAge}</label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min={16}
              max={40}
              value={filters.minAge}
              onChange={e => setFilters(f => ({ ...f, minAge: Math.min(Number(e.target.value), f.maxAge) }))}
              className="flex-1 accent-[#34d399]"
            />
            <input
              type="range"
              min={16}
              max={40}
              value={filters.maxAge}
              onChange={e => setFilters(f => ({ ...f, maxAge: Math.max(Number(e.target.value), f.minAge) }))}
              className="flex-1 accent-[#34d399]"
            />
          </div>
        </div>

        {/* Min OVR */}
        <div>
          <label className="text-[10px] text-[#8b949e] mb-1 block">Minimum OVR: {filters.minOvr}</label>
          <input
            type="range"
            min={40}
            max={95}
            value={filters.minOvr}
            onChange={e => setFilters(f => ({ ...f, minOvr: Number(e.target.value) }))}
            className="w-full accent-[#34d399]"
          />
        </div>

        {/* League Filter */}
        <div>
          <label className="text-[10px] text-[#8b949e] mb-1 block">League</label>
          <div className="flex gap-1 flex-wrap">
            {(['Any', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'] as LeagueFilter[]).map(l => (
              <button
                key={l}
                onClick={() => setFilters(f => ({ ...f, league: l }))}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                  filters.league === l
                    ? 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {l === 'Any' ? 'All' : l.replace(' League', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Max Price */}
        <div>
          <label className="text-[10px] text-[#8b949e] mb-1 block">Max Price: {formatPrice(filters.maxPrice)}</label>
          <input
            type="range"
            min={1_000_000}
            max={200_000_000}
            step={1_000_000}
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: Number(e.target.value) }))}
            className="w-full accent-[#34d399]"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full py-2 bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 rounded-lg text-xs font-semibold hover:bg-[#34d399]/25 transition-colors"
        >
          Search Players
        </button>
      </div>

      {/* Results */}
      {!showFullReport ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#c9d1d9]">
              Results ({searchResults.length} found)
            </span>
            <span className="text-[10px] text-[#484f58]">
              Page {searchPage} of {totalPages}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {pagedResults.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Photo placeholder */}
                  <div className="w-12 h-12 bg-[#21262d] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#30363d">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#c9d1d9] truncate">{player.name}</span>
                      <span className="text-sm">{player.flagEmoji}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-px rounded-sm bg-[#21262d] text-[#8b949e]">{player.position}</span>
                      <span className="text-[10px] text-[#484f58]">{player.age} yrs</span>
                      <span className="text-[10px] text-[#484f58] truncate">{player.club}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#484f58]">OVR</span>
                        <span className="text-xs font-bold" style={{ color: ovrColor(player.ovr) }}>{player.ovr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#484f58]">POT</span>
                        <span className="text-xs font-bold" style={{ color: potentialColor(player.potential) }}>{player.potential}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#484f58]">{player.keyStat}</span>
                        <span className="text-xs font-bold text-[#c9d1d9]">{player.keyStatValue}</span>
                      </div>
                      <span className="text-[10px] text-[#f59e0b] font-semibold ml-auto">{formatPrice(player.estimatedPrice)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedPlayer(player); setShowFullReport(true); }}
                      className="text-[10px] px-2 py-1 bg-[#3b82f6]/15 text-[#3b82f6] rounded-lg hover:bg-[#3b82f6]/25 transition-colors whitespace-nowrap"
                    >
                      Full Report
                    </button>
                    <button
                      onClick={() => handleAddToShortlist(player)}
                      className="text-[10px] px-2 py-1 bg-[#34d399]/15 text-[#34d399] rounded-lg hover:bg-[#34d399]/25 transition-colors whitespace-nowrap"
                    >
                      Shortlist
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                disabled={searchPage <= 1}
                className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-xs disabled:opacity-30 hover:bg-[#30363d] transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-[#8b949e]">{searchPage} / {totalPages}</span>
              <button
                onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))}
                disabled={searchPage >= totalPages}
                className="px-3 py-1.5 bg-[#21262d] text-[#8b949e] rounded-lg text-xs disabled:opacity-30 hover:bg-[#30363d] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : selectedPlayer ? renderFullReport(selectedPlayer) : null}
    </div>
  );

  // ============================================================
  // Render: Detailed Scout Report
  // ============================================================

  const renderFullReport = (player: ScoutedPlayer) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Back button */}
      <button
        onClick={() => { setShowFullReport(false); setSelectedPlayer(null); }}
        className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to results
      </button>

      {/* Player Profile Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <div className="flex items-start gap-4">
          {/* Photo placeholder SVG */}
          <div className="w-16 h-16 bg-[#21262d] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#30363d">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#c9d1d9]">{player.name}</h2>
              <span className="text-lg">{player.flagEmoji}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-px rounded-sm bg-[#21262d] text-[#8b949e]">{player.position}</span>
              <span className="text-xs text-[#484f58]">{player.age} years old</span>
              <span className="text-[10px] text-[#484f58]">{player.nationality}</span>
            </div>
            <div className="text-xs text-[#8b949e] mt-1">{player.club} — {player.league}</div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="text-[9px] text-[#484f58]">OVR</div>
                <div className="text-xl font-bold" style={{ color: ovrColor(player.ovr) }}>{player.ovr}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-[#484f58]">POT</div>
                <div className="text-xl font-bold" style={{ color: potentialColor(player.potential) }}>{player.potential}</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#f59e0b]">{formatPrice(player.estimatedPrice)}</div>
          </div>
        </div>
      </div>

      {/* Attribute Breakdown */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#c9d1d9]">Attribute Breakdown</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#34d399]" />
              <span className="text-[9px] text-[#484f58]">Player</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#30363d]" />
              <span className="text-[9px] text-[#484f58]">Club Avg</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          {player.attributes.map(cat => (
            <div key={cat.name} className="mb-2">
              <div className="text-[10px] font-semibold text-[#8b949e] mb-1">{cat.name}</div>
              {cat.attrs.map(attr => (
                <AttrBar key={attr.name} name={attr.name} value={attr.value} comparison={attr.comparison} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
          <span className="text-[10px] font-semibold text-[#34d399] block mb-2">Strengths</span>
          {player.strengths.map(s => (
            <span key={s} className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 mr-1 mb-1">
              {s}
            </span>
          ))}
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
          <span className="text-[10px] font-semibold text-[#ef4444] block mb-2">Weaknesses</span>
          {player.weaknesses.map(w => (
            <span key={w} className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 mr-1 mb-1">
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <span className="text-xs font-semibold text-[#c9d1d9] block mb-2">Player Profile Radar</span>
        <RadarChart player={player} comparePlayer={comparePlayers.length > 0 ? comparePlayers[0] : undefined} size={220} />
      </div>

      {/* Style of Play */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <span className="text-[10px] font-semibold text-[#8b949e] block mb-1">Style of Play</span>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">{player.styleOfPlay}</p>
      </div>

      {/* Transfer Recommendation */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#484f58] block mb-0.5">Transfer Recommendation</span>
            <span
              className="text-sm font-bold"
              style={{ color: recommendationColor(player.recommendation) }}
            >
              {player.recommendation}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#484f58] block mb-0.5">Scout Confidence</span>
            <StarDisplay count={player.scoutStars} />
          </div>
        </div>
        <p className="text-[10px] text-[#8b949e] mt-2 leading-relaxed">
          {player.recommendation === 'Sign'
            ? 'This player would be a strong addition to the squad. High potential and good current ability make this an excellent investment for the future.'
            : player.recommendation === 'Monitor'
            ? 'Shows promise but may need more development or could be expensive for the current budget. Keep tracking progress before making a move.'
            : 'Does not currently meet the requirements or would not represent good value. There are better options available in this position.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAddToShortlist(player)}
          className="flex-1 py-2 bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30 rounded-lg text-xs font-semibold hover:bg-[#34d399]/25 transition-colors"
        >
          Add to Shortlist
        </button>
        <button
          onClick={() => handleAddToWatchlist(player)}
          className="flex-1 py-2 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 rounded-lg text-xs font-semibold hover:bg-[#f59e0b]/25 transition-colors"
        >
          Add to Watchlist
        </button>
        <button
          onClick={() => handleReject(player)}
          className="flex-1 py-2 bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 rounded-lg text-xs font-semibold hover:bg-[#ef4444]/25 transition-colors"
        >
          Reject
        </button>
      </div>
    </motion.div>
  );

  // ============================================================
  // Render: Shortlist Management
  // ============================================================

  const renderShortlistManagement = () => (
    <div className="p-4 space-y-3">
      {/* Shortlist Tabs */}
      <Tabs value={shortlistTab} onValueChange={(v) => setShortlistTab(v as ShortlistTab)}>
        <TabsList className="bg-[#0d1117] border border-[#21262d] w-full h-9">
          {(['shortlist', 'watchlist', 'rejected'] as ShortlistTab[]).map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-[10px] flex-1 data-[state=active]:bg-[#161b22] data-[state=active]:text-[#34d399] text-[#8b949e] rounded-lg px-2">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1 text-[9px] text-[#484f58]">
                ({tab === 'shortlist' ? shortlist.length : tab === 'watchlist' ? watchlist.length : rejected.length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Summary */}
      {shortlistTab === 'shortlist' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-center">
            <div className="text-[10px] text-[#484f58]">Players</div>
            <div className="text-sm font-bold text-[#c9d1d9]">{shortlistSummary.total}</div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-center">
            <div className="text-[10px] text-[#484f58]">Avg OVR</div>
            <div className="text-sm font-bold" style={{ color: ovrColor(shortlistSummary.avgOvr) }}>{shortlistSummary.avgOvr}</div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-center">
            <div className="text-[10px] text-[#484f58]">Total Value</div>
            <div className="text-sm font-bold text-[#f59e0b]">{formatPrice(shortlistSummary.totalValue)}</div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#484f58]">Sort by:</span>
        <div className="flex gap-1">
          {([
            { key: 'ovr' as SortKey, label: 'OVR' },
            { key: 'age' as SortKey, label: 'Age' },
            { key: 'price' as SortKey, label: 'Price' },
            { key: 'scoutRating' as SortKey, label: 'Rating' },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`text-[10px] px-2 py-0.5 rounded-sm transition-colors ${
                sortKey === s.key
                  ? 'bg-[#21262d] text-[#c9d1d9]'
                  : 'text-[#484f58] hover:text-[#8b949e]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compare Mode Toggle */}
      {shortlistTab === 'shortlist' && (
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareIds(new Set()); }}
          className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
            compareMode
              ? 'bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30'
              : 'bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:border-[#a78bfa]/30'
          }`}
        >
          {compareMode ? `Comparing (${compareIds.size}/3) — Click to exit` : 'Compare Mode'}
        </button>
      )}

      {/* Compare Radar */}
      {compareMode && comparePlayers.length >= 2 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
          <span className="text-xs font-semibold text-[#c9d1d9] block mb-2">Player Comparison</span>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {comparePlayers.map((p, i) => (
              <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-lg" style={{
                backgroundColor: i === 0 ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                color: i === 0 ? '#34d399' : '#ef4444',
              }}>
                {p.name} ({p.ovr})
              </span>
            ))}
          </div>
          <RadarChart player={comparePlayers[0]} comparePlayer={comparePlayers[1]} size={220} />
        </div>
      )}

      {/* Player List */}
      {currentList.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#30363d" strokeWidth="1.5" className="mx-auto mb-2">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <p className="text-xs text-[#484f58]">
            {shortlistTab === 'shortlist' ? 'No players shortlisted yet' : shortlistTab === 'watchlist' ? 'No players on watchlist' : 'No rejected players'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentList.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                {/* Compare checkbox */}
                {compareMode && shortlistTab === 'shortlist' && (
                  <button
                    onClick={() => handleCompareToggle(player.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      compareIds.has(player.id)
                        ? 'bg-[#a78bfa]/20 border-[#a78bfa]/50'
                        : 'bg-[#0d1117] border-[#21262d]'
                    }`}
                  >
                    {compareIds.has(player.id) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#c9d1d9] truncate">{player.name}</span>
                    <span className="text-xs">{player.flagEmoji}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-px rounded-sm bg-[#21262d] text-[#8b949e]">{player.position}</span>
                    <span className="text-xs font-bold" style={{ color: ovrColor(player.ovr) }}>{player.ovr}</span>
                    <span className="text-[10px] text-[#484f58]">{player.age}y</span>
                    <span className="text-[10px] text-[#484f58] truncate">{player.club}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold text-[#f59e0b]">{formatPrice(player.estimatedPrice)}</div>
                  <StarDisplay count={player.scoutStars} />
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {shortlistTab === 'shortlist' && (
                    <>
                      <button
                        onClick={() => { setSelectedPlayer(player); setShowFullReport(true); }}
                        className="text-[9px] px-2 py-0.5 bg-[#3b82f6]/15 text-[#3b82f6] rounded-lg hover:bg-[#3b82f6]/25 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRemoveFromShortlist(player.id)}
                        className="text-[9px] px-2 py-0.5 bg-[#ef4444]/15 text-[#ef4444] rounded-lg hover:bg-[#ef4444]/25 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {shortlistTab === 'watchlist' && (
                    <>
                      <button
                        onClick={() => handleAddToShortlist(player)}
                        className="text-[9px] px-2 py-0.5 bg-[#34d399]/15 text-[#34d399] rounded-lg hover:bg-[#34d399]/25 transition-colors"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => handleRemoveFromWatchlist(player.id)}
                        className="text-[9px] px-2 py-0.5 bg-[#ef4444]/15 text-[#ef4444] rounded-lg hover:bg-[#ef4444]/25 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {shortlistTab === 'rejected' && (
                    <button
                      onClick={() => handleRemoveFromRejected(player.id)}
                      className="text-[9px] px-2 py-0.5 bg-[#8b949e]/15 text-[#8b949e] rounded-lg hover:bg-[#8b949e]/25 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================================
  // Render: Scouting Map
  // ============================================================

  const renderScoutingMap = () => (
    <div className="p-4 space-y-3">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#c9d1d9]">Global Scouting Map</span>
          {selectedRegion && (
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* SVG World Map */}
        <div className="bg-[#0d1117] rounded-xl p-2 relative">
          <svg viewBox="0 0 100 80" className="w-full" style={{ maxHeight: '300px' }}>
            {/* Simplified continent outlines */}
            {/* North America */}
            <path d="M10 15 L25 12 L30 18 L32 28 L28 35 L22 38 L18 42 L14 38 L8 30 L6 22 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />
            {/* South America */}
            <path d="M22 45 L28 42 L33 48 L35 55 L32 65 L28 70 L24 72 L20 68 L18 58 L19 50 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />
            {/* Europe */}
            <path d="M38 12 L55 10 L58 15 L56 22 L52 28 L45 30 L40 28 L36 22 L37 16 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />
            {/* Africa */}
            <path d="M40 32 L52 30 L56 38 L58 48 L55 58 L50 64 L44 66 L40 62 L38 50 L37 40 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />
            {/* Asia */}
            <path d="M58 8 L80 6 L90 12 L92 22 L88 30 L82 35 L75 38 L68 36 L62 30 L58 22 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />
            {/* Australia */}
            <path d="M75 50 L85 48 L90 52 L88 58 L82 60 L76 58 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.3" />

            {/* Region dots and labels */}
            {mapRegions.map(region => {
              const isSelected = selectedRegion === region.id;
              const dotColor = region.players > 0 ? '#34d399' : '#30363d';
              const dotSize = Math.max(2.5, Math.min(6, region.players * 0.8 + 2));
              return (
                <g key={region.id} className="cursor-pointer" onClick={() => handleRegionClick(region.id)}>
                  <circle
                    cx={region.x}
                    cy={region.y}
                    r={isSelected ? dotSize + 1.5 : dotSize}
                    fill={dotColor}
                    stroke={isSelected ? '#ffffff' : 'transparent'}
                    strokeWidth={isSelected ? 0.8 : 0}
                    opacity={isSelected ? 1 : 0.8}
                  />
                  {region.players > 0 && (
                    <>
                      <rect
                        x={region.x + dotSize + 1}
                        y={region.y - 4}
                        width="8"
                        height="6"
                        rx="1"
                        fill="#161b22"
                        stroke="#30363d"
                        strokeWidth="0.3"
                      />
                      <text
                        x={region.x + dotSize + 5}
                        y={region.y - 0.5}
                        textAnchor="middle"
                        fill="#c9d1d9"
                        fontSize="4"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {region.players}
                      </text>
                    </>
                  )}
                  <text
                    x={region.x}
                    y={region.y - dotSize - 3}
                    textAnchor="middle"
                    fill={isSelected ? '#c9d1d9' : '#8b949e'}
                    fontSize="3.5"
                    fontFamily="sans-serif"
                  >
                    {region.name}
                  </text>
                  {region.scouts > 0 && (
                    <circle
                      cx={region.x - dotSize - 2}
                      cy={region.y + dotSize + 2}
                      r="1.5"
                      fill="#f59e0b"
                      opacity={0.7}
                    />
                  )}
                </g>
              );
            })}

            {/* Scout indicator legend */}
            <circle cx="5" cy="76" r="1.5" fill="#f59e0b" opacity={0.7} />
            <text x="8" y="77.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">Scout</text>
            <circle cx="20" cy="76" r="3" fill="#34d399" opacity={0.8} />
            <text x="25" y="77.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">Players found</text>
          </svg>
        </div>

        {/* Region details */}
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 bg-[#0d1117] rounded-lg p-3 border border-[#34d399]/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#c9d1d9]">
                {mapRegions.find(r => r.id === selectedRegion)?.name}
              </span>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-[10px] text-[#34d399] hover:underline"
              >
                Apply Filter
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-[10px] text-[#8b949e]">
                Players found: <span className="text-[#c9d1d9] font-semibold">
                  {mapRegions.find(r => r.id === selectedRegion)?.players ?? 0}
                </span>
              </div>
              <div className="text-[10px] text-[#8b949e]">
                Scouts assigned: <span className="text-[#f59e0b] font-semibold">
                  {mapRegions.find(r => r.id === selectedRegion)?.scouts ?? 0}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#484f58] mt-1">
              Nations: {REGIONS.find(r => r.id === selectedRegion)?.nations.join(', ')}
            </div>
          </motion.div>
        )}
      </div>

      {/* Region summary cards */}
      <div className="grid grid-cols-2 gap-2">
        {mapRegions.map(region => (
          <button
            key={region.id}
            onClick={() => handleRegionClick(region.id)}
            className={`bg-[#161b22] border rounded-xl p-3 text-left transition-colors ${
              selectedRegion === region.id ? 'border-[#34d399]/40' : 'border-[#30363d] hover:border-[#30363d]'
            }`}
          >
            <div className="text-[11px] font-semibold text-[#c9d1d9] mb-1">{region.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e]">{region.players} players</span>
              {region.scouts > 0 && (
                <span className="text-[10px] text-[#f59e0b]">{region.scouts} scout{region.scouts > 1 ? 's' : ''}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ============================================================
  // Render: Scout Staff Management
  // ============================================================

  const renderScoutStaff = () => (
    <div className="p-4 space-y-3">
      {/* Scout Level */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#484f58] block">Scout Department Level</span>
            <span className="text-sm font-bold" style={{
              color: scoutLevel === 'Elite' ? '#a78bfa' : scoutLevel === 'Professional' ? '#3b82f6' : '#8b949e',
            }}>
              {scoutLevel}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#484f58] block">Scouts Active</span>
            <span className="text-sm font-bold text-[#c9d1d9]">{activeScouts} / {maxScouts}</span>
          </div>
        </div>
      </div>

      {/* Scout Cards */}
      <div className="space-y-2">
        {scoutStaff.map((scout, i) => (
          <motion.div
            key={scout.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-3"
          >
            <div className="flex items-start gap-3">
              {/* Scout avatar */}
              <div className="w-10 h-10 bg-[#21262d] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#30363d">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#c9d1d9]">{scout.name}</span>
                  <span className="text-xs">{scout.flagEmoji}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-px rounded-sm bg-[#21262d] text-[#8b949e]">{scout.specialization}</span>
                  <StarDisplay count={scout.stars} />
                </div>
                <div className="text-[10px] text-[#484f58] mt-1 truncate">{scout.currentAssignment}</div>
                <div className="text-[10px] text-[#484f58]">
                  Reports this month: <span className="text-[#c9d1d9] font-semibold">{scout.reportsThisMonth}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button className="text-[9px] px-2 py-0.5 bg-[#3b82f6]/15 text-[#3b82f6] rounded-lg hover:bg-[#3b82f6]/25 transition-colors">
                  Reassign
                </button>
                <button className="text-[9px] px-2 py-0.5 bg-[#a78bfa]/15 text-[#a78bfa] rounded-lg hover:bg-[#a78bfa]/25 transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hire New Scout */}
      {activeScouts < maxScouts && (
        <button className="w-full py-3 bg-[#161b22] border border-dashed border-[#30363d] rounded-xl text-xs font-semibold text-[#8b949e] hover:border-[#34d399]/30 hover:text-[#34d399] transition-colors">
          <span className="mr-1">+</span> Hire New Scout
          <span className="block text-[10px] text-[#484f58] font-normal mt-0.5">
            Slot {activeScouts + 1} of {maxScouts} available
          </span>
        </button>
      )}
    </div>
  );

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div className="max-w-lg mx-auto">
      {renderHeader()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-[#161b22] border-b border-[#30363d] px-4">
          <TabsList className="bg-[#0d1117] border border-[#21262d] w-full h-9 mt-2">
            {[
              { value: 'discovery', label: 'Discovery' },
              { value: 'shortlist', label: 'Shortlist' },
              { value: 'map', label: 'Map' },
              { value: 'staff', label: 'Staff' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-[10px] flex-1 data-[state=active]:bg-[#161b22] data-[state=active]:text-[#34d399] text-[#8b949e] rounded-lg px-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="discovery">
          {renderDiscovery()}
        </TabsContent>

        <TabsContent value="shortlist">
          {renderShortlistManagement()}
        </TabsContent>

        <TabsContent value="map">
          {renderScoutingMap()}
        </TabsContent>

        <TabsContent value="staff">
          {renderScoutStaff()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
