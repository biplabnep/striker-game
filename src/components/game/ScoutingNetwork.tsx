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
// SVG 1: Scouting Coverage Map
// ============================================================

function ScoutingCoverageMap(): React.JSX.Element {
  const continentShapes = [
    { id: 'na', path: 'M8 18 L22 15 L28 20 L30 30 L26 37 L20 40 L16 36 L10 30 L6 24 Z', label: 'N. America' },
    { id: 'sa', path: 'M20 46 L27 43 L32 49 L34 57 L30 66 L26 71 L22 73 L18 69 L16 58 L17 50 Z', label: 'S. America' },
    { id: 'eu', path: 'M36 14 L54 12 L57 17 L55 24 L51 30 L44 32 L39 30 L35 24 L36 18 Z', label: 'Europe' },
    { id: 'af', path: 'M38 34 L51 32 L55 40 L57 50 L54 60 L49 66 L43 68 L39 64 L37 52 L36 42 Z', label: 'Africa' },
    { id: 'as', path: 'M56 10 L78 8 L88 14 L90 24 L86 32 L80 37 L73 40 L66 38 L60 32 L56 24 Z', label: 'Asia' },
    { id: 'oc', path: 'M73 52 L83 50 L88 54 L86 60 L80 62 L74 60 Z', label: 'Oceania' },
  ];

  const scoutLocations = [
    { x: 48, y: 20, region: 'Europe', color: '#58a6ff' },
    { x: 57, y: 17, region: 'Europe', color: '#58a6ff' },
    { x: 28, y: 55, region: 'S. America', color: '#3fb950' },
    { x: 47, y: 48, region: 'Africa', color: '#f0883e' },
    { x: 70, y: 22, region: 'Asia', color: '#d2a8ff' },
    { x: 45, y: 23, region: 'Europe', color: '#58a6ff' },
  ];

  return (
    <svg viewBox="0 0 100 78" className="w-full h-auto">
      {/* Continental regions */}
      {continentShapes.map((c, i) => (
        <path
          key={c.id}
          d={c.path}
          fill="#21262d"
          stroke="#30363d"
          strokeWidth="0.3"
          opacity={0.6}
        />
      ))}

      {/* Scout location dots with pulse rings */}
      {scoutLocations.map((loc, i) => (
        <g key={i}>
          <circle cx={loc.x} cy={loc.y} r="4" fill={loc.color} opacity={0.12} />
          <circle cx={loc.x} cy={loc.y} r="2" fill={loc.color} opacity={0.25} />
          <circle cx={loc.x} cy={loc.y} r="1.2" fill={loc.color} />
        </g>
      ))}

      {/* Legend */}
      <rect x="3" y="72" width="94" height="5" rx="1" fill="#161b22" stroke="#30363d" strokeWidth="0.2" />
      <circle cx="10" cy="74.5" r="1.2" fill="#58a6ff" />
      <text x="13" y="75.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">Europe (3)</text>
      <circle cx="32" cy="74.5" r="1.2" fill="#3fb950" />
      <text x="35" y="75.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">S.Am (1)</text>
      <circle cx="50" cy="74.5" r="1.2" fill="#f0883e" />
      <text x="53" y="75.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">Africa (1)</text>
      <circle cx="70" cy="74.5" r="1.2" fill="#d2a8ff" />
      <text x="73" y="75.5" fill="#8b949e" fontSize="3" fontFamily="sans-serif">Asia (1)</text>
    </svg>
  );
}

// ============================================================
// SVG 2: Scout Network Hexagonal Radar
// ============================================================

function ScoutNetworkHexagonalRadar(): React.JSX.Element {
  const axes = ['Europe', 'S.America', 'Africa', 'Asia', 'N.America', 'Oceania'];
  const values = [88, 65, 48, 38, 22, 12];
  const cx = 50;
  const cy = 54;
  const maxR = 36;
  const n = 6;
  const angleStep = (2 * Math.PI) / n;

  const hexVertex = (angle: number, r: number): { x: number; y: number } => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const hexPoints = (r: number) =>
    Array.from({ length: n }, (_, i) => {
      const v = hexVertex(angleStep * i - Math.PI / 2, r);
      return `${v.x},${v.y}`;
    }).join(' ');

  const dataPoints = values.map((val, i) => {
    const r = maxR * (val / 100);
    return hexVertex(angleStep * i - Math.PI / 2, r);
  });

  const dataPointsStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labelPositions = axes.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + (maxR + 12) * Math.cos(angle),
      y: cy + (maxR + 12) * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto">
      {/* Hexagonal grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
        <polygon
          key={i}
          points={hexPoints(maxR * level)}
          fill="none"
          stroke="#30363d"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const v = hexVertex(angleStep * i - Math.PI / 2, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={v.x}
            y2={v.y}
            stroke="#30363d"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPointsStr}
        fill="rgba(88,166,255,0.15)"
        stroke="#58a6ff"
        strokeWidth="1.5"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#58a6ff" />
          <text
            x={p.x}
            y={p.y - 5}
            textAnchor="middle"
            fill="#c9d1d9"
            fontSize="5"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            {values[i]}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      {axes.map((label, i) => (
        <text
          key={i}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#8b949e"
          fontSize="5.5"
          fontFamily="sans-serif"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 3: Scout Budget Allocation Donut
// ============================================================

function ScoutBudgetAllocationDonut(): React.JSX.Element {
  const segments = [
    { label: 'Travel', value: 35, color: '#58a6ff' },
    { label: 'Salaries', value: 30, color: '#3fb950' },
    { label: 'Database', value: 15, color: '#f0883e' },
    { label: 'Equipment', value: 12, color: '#d2a8ff' },
    { label: 'Misc', value: 8, color: '#8b949e' },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = 50;
  const cy = 50;
  const radius = 30;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  const arcsData = segments.reduce<{
    cumulative: number;
    arcs: { length: number; offset: number; color: string; label: string; pct: number }[];
  }>(
    (acc, seg) => {
      const length = (seg.value / total) * circumference;
      return {
        cumulative: acc.cumulative + length,
        arcs: [
          ...acc.arcs,
          {
            length,
            offset: circumference / 4 - acc.cumulative,
            color: seg.color,
            label: seg.label,
            pct: Math.round((seg.value / total) * 100),
          },
        ],
      };
    },
    { cumulative: 0, arcs: [] },
  );

  return (
    <svg viewBox="0 0 100 80" className="w-full h-auto">
      {/* Donut segments */}
      {arcsData.arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.length} ${circumference - arc.length}`}
          strokeDashoffset={arc.offset}
          opacity={0.85}
        />
      ))}

      {/* Center text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="8" fontFamily="sans-serif" fontWeight="bold">
        Budget
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#8b949e" fontSize="5" fontFamily="sans-serif">
        Allocation
      </text>

      {/* Legend */}
      {arcsData.arcs.map((arc, i) => (
        <g key={`leg-${i}`}>
          <rect x="4" y="4 + i * 6" width="3" height="3" rx="0.5" fill={arc.color} opacity={0.85}>
            <animate attributeName="y" values="4 + i * 6;{4 + i * 6}" dur="0s" />
          </rect>
          <circle cx="5.5" cy={6.5 + i * 6} r="1.5" fill={arc.color} opacity={0.85} />
          <text x="10" y={8 + i * 6} fill="#8b949e" fontSize="4" fontFamily="sans-serif">
            {arc.label} {arc.pct}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 4: Player Discovery Trend Area Chart
// ============================================================

function PlayerDiscoveryTrend(): React.JSX.Element {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [8, 12, 15, 11, 18, 22, 25, 20, 28, 24, 30, 26];
  const maxVal = Math.max(...data);
  const chartW = 90;
  const chartH = 50;
  const padLeft = 5;
  const padBottom = 12;
  const padTop = 5;

  const points = data.map((val, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (val / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 100 72" className="w-full h-auto">
      {/* Grid lines */}
      {gridLines.map((level, i) => {
        const y = padTop + chartH - level * chartH;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#30363d" strokeWidth="0.3" />
            <text x={padLeft - 1} y={y + 1} textAnchor="end" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
              {Math.round(maxVal * level)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="rgba(63,185,80,0.1)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3fb950" strokeWidth="1.5" />

      {/* Data dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="2.5" fill="#0d1117" stroke="#3fb950" strokeWidth="1" />
          {data[i] === maxVal && (
            <circle cx={p.x} cy={p.y} r="4" fill="#3fb950" opacity={0.2} />
          )}
        </g>
      ))}

      {/* Peak label */}
      {points.map((p, i) =>
        data[i] === maxVal ? (
          <text key={`peak-${i}`} x={p.x} y={p.y - 5} textAnchor="middle" fill="#3fb950" fontSize="4" fontFamily="sans-serif" fontWeight="bold">
            {maxVal}
          </text>
        ) : null,
      )}

      {/* Month labels */}
      {months.map((m, i) => {
        const x = padLeft + (i / (months.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={padTop + chartH + 8} textAnchor="middle" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
            m
          </text>
        );
      })}

      {/* Title */}
      <text x="50" y="4" textAnchor="middle" fill="#8b949e" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
        Players Discovered / Month
      </text>
    </svg>
  );
}

// ============================================================
// SVG 5: Scout Rating Comparison Bars
// ============================================================

function ScoutRatingComparisonBars(): React.JSX.Element {
  const attrs = [
    { name: 'Accuracy', value: 82, color: '#3fb950' },
    { name: 'Speed', value: 68, color: '#58a6ff' },
    { name: 'Network', value: 91, color: '#d2a8ff' },
    { name: 'Reporting', value: 75, color: '#f0883e' },
    { name: 'Ethics', value: 88, color: '#79c0ff' },
  ];

  const barH = 8;
  const gap = 5;
  const labelW = 22;
  const barMaxW = 55;
  const startX = 25;
  const startY = 8;

  return (
    <svg viewBox="0 0 100 72" className="w-full h-auto">
      {/* Title */}
      <text x="50" y="6" textAnchor="middle" fill="#8b949e" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
        Scout Attribute Ratings
      </text>

      {/* Bars */}
      {attrs.map((attr, i) => {
        const y = startY + i * (barH + gap);
        const barW = (attr.value / 100) * barMaxW;
        const bgW = barMaxW;

        return (
          <g key={i}>
            {/* Label */}
            <text x={startX - 2} y={y + barH / 2 + 1} textAnchor="end" fill="#c9d1d9" fontSize="5" fontFamily="sans-serif">
              {attr.name}
            </text>

            {/* Background bar */}
            <rect x={startX} y={y} width={bgW} height={barH} rx="2" fill="#21262d" />

            {/* Value bar */}
            <rect x={startX} y={y} width={barW} height={barH} rx="2" fill={attr.color} opacity={0.8} />

            {/* Value text */}
            <text x={startX + bgW + 3} y={y + barH / 2 + 1} fill="#c9d1d9" fontSize="5" fontFamily="sans-serif" fontWeight="bold">
              {attr.value}
            </text>
          </g>
        );
      })}

      {/* Average line indicator */}
      {(() => {
        const avg = Math.round(attrs.reduce((s, a) => s + a.value, 0) / attrs.length);
        const avgW = (avg / 100) * barMaxW;
        return (
          <g>
            <line x1={startX + avgW} y1={startY - 2} x2={startX + avgW} y2={startY + attrs.length * (barH + gap)} stroke="#f85149" strokeWidth="0.5" strokeDasharray="2 1" />
            <text x={startX + avgW} y={startY - 3} textAnchor="middle" fill="#f85149" fontSize="3" fontFamily="sans-serif">
              avg {avg}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ============================================================
// SVG 6: Scouting Pipeline Funnel
// ============================================================

function ScoutingPipelineFunnel(): React.JSX.Element {
  const stages = [
    { name: 'Identified', value: 150, color: '#58a6ff' },
    { name: 'Watched', value: 85, color: '#79c0ff' },
    { name: 'Scouted', value: 45, color: '#f0883e' },
    { name: 'Reported', value: 22, color: '#ffa657' },
    { name: 'Recommended', value: 8, color: '#3fb950' },
  ];

  const maxVal = stages[0].value;
  const stageH = 10;
  const gap = 3;
  const maxW = 80;
  const cx = 50;
  const startY = 8;

  const stageWidths = stages.map(s => (s.value / maxVal) * maxW);
  const funnelShapes = stageWidths.reduce<{
    shapes: { points: string; color: string; name: string; value: number; labelX: number }[];
  }>((acc, width, i) => {
    const prevW = i > 0 ? stageWidths[i - 1] : width;
    const y = startY + i * (stageH + gap);
    const left = cx - width / 2;
    const right = cx + width / 2;
    const prevLeft = cx - prevW / 2;
    const prevRight = cx + prevW / 2;

    const points = `${prevLeft},${y} ${prevRight},${y} ${right},${y + stageH} ${left},${y + stageH}`;

    return {
      shapes: [
        ...acc.shapes,
        {
          points,
          color: stages[i].color,
          name: stages[i].name,
          value: stages[i].value,
          labelX: cx,
        },
      ],
    };
  }, { shapes: [] });

  return (
    <svg viewBox="0 0 100 76" className="w-full h-auto">
      {/* Title */}
      <text x="50" y="5" textAnchor="middle" fill="#8b949e" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
        Scouting Pipeline
      </text>

      {/* Funnel stages */}
      {funnelShapes.shapes.map((shape, i) => {
        const y = startY + i * (stageH + gap);
        return (
          <g key={i}>
            <polygon points={shape.points} fill={shape.color} opacity={0.2} />
            <polygon points={shape.points} fill="none" stroke={shape.color} strokeWidth="0.5" />
            <text x={shape.labelX} y={y + stageH / 2 + 1.5} textAnchor="middle" fill="#c9d1d9" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
              {shape.name}
            </text>
          </g>
        );
      })}

      {/* Value labels on the right */}
      {funnelShapes.shapes.map((shape, i) => {
        const y = startY + i * (stageH + gap) + stageH / 2 + 1.5;
        const stageW = stageWidths[i];
        return (
          <text key={`val-${i}`} x={cx + stageW / 2 + 3} y={y} fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">
            {shape.value}
          </text>
        );
      })}

      {/* Conversion rates */}
      {funnelShapes.shapes.map((shape, i) => {
        if (i === 0) return null;
        const y = startY + i * (stageH + gap) - 1;
        const rate = Math.round((shape.value / funnelShapes.shapes[i - 1].value) * 100);
        return (
          <text key={`rate-${i}`} x={cx - stageWidths[i] / 2 - 2} y={y} textAnchor="end" fill="#484f58" fontSize="3" fontFamily="sans-serif">
            {rate}%
          </text>
        );
      })}

      {/* Bottom summary */}
      <text x="50" y={startY + stages.length * (stageH + gap) + 5} textAnchor="middle" fill="#3fb950" fontSize="4" fontFamily="sans-serif">
        {stages[stages.length - 1].value} of {stages[0].value} recommended ({Math.round((stages[stages.length - 1].value / stages[0].value) * 100)}%)
      </text>
    </svg>
  );
}

// ============================================================
// SVG 7: Regional Spending Bars
// ============================================================

function RegionalSpendingBars(): React.JSX.Element {
  const regions = [
    { name: 'Europe', planned: 45, actual: 42 },
    { name: 'S. America', planned: 25, actual: 28 },
    { name: 'Africa', planned: 15, actual: 12 },
    { name: 'Asia', planned: 20, actual: 18 },
    { name: 'N. America', planned: 10, actual: 14 },
    { name: 'Oceania', planned: 5, actual: 4 },
  ];

  const maxVal = Math.max(...regions.reduce<number[]>((acc, r) => [...acc, r.planned, r.actual], []));
  const barH = 5;
  const gap = 3;
  const groupGap = 2;
  const barMaxW = 52;
  const labelW = 22;
  const startX = 26;
  const startY = 10;

  return (
    <svg viewBox="0 0 100 80" className="w-full h-auto">
      {/* Title */}
      <text x="50" y="6" textAnchor="middle" fill="#8b949e" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
        Regional Spending (€K)
      </text>

      {/* Bars for each region */}
      {regions.map((region, i) => {
        const y = startY + i * (barH * 2 + groupGap + gap);
        const plannedW = (region.planned / maxVal) * barMaxW;
        const actualW = (region.actual / maxVal) * barMaxW;

        return (
          <g key={i}>
            {/* Region label */}
            <text x={startX - 2} y={y + barH + 2} textAnchor="end" fill="#c9d1d9" fontSize="4.5" fontFamily="sans-serif">
              {region.name}
            </text>

            {/* Planned bar */}
            <rect x={startX} y={y} width={plannedW} height={barH} rx="1" fill="#58a6ff" opacity={0.35} />
            <text x={startX + plannedW + 2} y={y + barH - 0.5} fill="#58a6ff" fontSize="3.5" fontFamily="sans-serif" opacity={0.7}>
              {region.planned}
            </text>

            {/* Actual bar */}
            <rect x={startX} y={y + barH + groupGap} width={actualW} height={barH} rx="1" fill="#3fb950" opacity={0.7} />
            <text x={startX + actualW + 2} y={y + barH * 2 + groupGap - 0.5} fill="#3fb950" fontSize="3.5" fontFamily="sans-serif">
              {region.actual}
            </text>

            {/* Variance indicator */}
            {region.actual > region.planned && (
              <text x={startX + barMaxW + 8} y={y + barH + 1} fill="#f85149" fontSize="3" fontFamily="sans-serif">
                +{region.actual - region.planned}
              </text>
            )}
            {region.actual < region.planned && (
              <text x={startX + barMaxW + 8} y={y + barH + 1} fill="#3fb950" fontSize="3" fontFamily="sans-serif">
                -{region.planned - region.actual}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <rect x="20" y={startY + regions.length * (barH * 2 + groupGap + gap) + 2} width="5" height="3" rx="0.5" fill="#58a6ff" opacity={0.35} />
      <text x="27" y={startY + regions.length * (barH * 2 + groupGap + gap) + 4.5} fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">
        Planned
      </text>
      <rect x="42" y={startY + regions.length * (barH * 2 + groupGap + gap) + 2} width="5" height="3" rx="0.5" fill="#3fb950" opacity={0.7} />
      <text x="49" y={startY + regions.length * (barH * 2 + groupGap + gap) + 4.5} fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">
        Actual
      </text>
    </svg>
  );
}

// ============================================================
// SVG 8: Scout Assignment Status Donut
// ============================================================

function ScoutAssignmentStatusDonut(): React.JSX.Element {
  const segments = [
    { label: 'Active', value: 3, color: '#3fb950' },
    { label: 'Available', value: 1, color: '#58a6ff' },
    { label: 'On-Leave', value: 1, color: '#8b949e' },
  ];

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = 50;
  const cy = 46;
  const radius = 24;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;

  const arcsData = segments.reduce<{
    cumulative: number;
    arcs: { length: number; offset: number; color: string; label: string; count: number }[];
  }>(
    (acc, seg) => {
      const length = (seg.value / total) * circumference;
      return {
        cumulative: acc.cumulative + length,
        arcs: [
          ...acc.arcs,
          {
            length,
            offset: circumference / 4 - acc.cumulative,
            color: seg.color,
            label: seg.label,
            count: seg.value,
          },
        ],
      };
    },
    { cumulative: 0, arcs: [] },
  );

  return (
    <svg viewBox="0 0 100 72" className="w-full h-auto">
      {/* Donut segments */}
      {arcsData.arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.length} ${circumference - arc.length}`}
          strokeDashoffset={arc.offset}
          opacity={0.85}
        />
      ))}

      {/* Center text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#8b949e" fontSize="4" fontFamily="sans-serif">
        Total Scouts
      </text>

      {/* Legend below */}
      {arcsData.arcs.map((arc, i) => (
        <g key={`leg-${i}`}>
          <circle cx={15 + i * 28} cy={68} r="3" fill={arc.color} opacity={0.85} />
          <text x={20 + i * 28} y={69.5} fill="#c9d1d9" fontSize="4.5" fontFamily="sans-serif">
            {arc.label}
          </text>
          <text x={20 + i * 28} y={65} fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">
            {arc.count}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 9: Target Player Attributes Radar
// ============================================================

function TargetPlayerAttributesRadar(): React.JSX.Element {
  const axes = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'];
  const values = [78, 85, 72, 88, 65, 76];
  const cx = 50;
  const cy = 54;
  const maxR = 34;
  const n = 6;
  const angleStep = (2 * Math.PI) / n;

  const hexVertex = (angle: number, r: number): { x: number; y: number } => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const hexPoints = (r: number) =>
    Array.from({ length: n }, (_, i) => {
      const v = hexVertex(angleStep * i - Math.PI / 2, r);
      return `${v.x},${v.y}`;
    }).join(' ');

  const dataPoints = values.map((val, i) => {
    const r = maxR * (val / 100);
    return hexVertex(angleStep * i - Math.PI / 2, r);
  });

  const dataPointsStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const avgValue = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  const labelPositions = axes.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + (maxR + 12) * Math.cos(angle),
      y: cy + (maxR + 12) * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto">
      {/* Hexagonal grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
        <polygon
          key={i}
          points={hexPoints(maxR * level)}
          fill="none"
          stroke="#30363d"
          strokeWidth="0.5"
        />
      ))}

      {/* Grid ring labels */}
      {[0.5, 1.0].map((level, i) => {
        const labelAngle = angleStep * 0 - Math.PI / 2;
        const lx = cx + (maxR * level + 3) * Math.cos(labelAngle);
        const ly = cy + (maxR * level + 3) * Math.sin(labelAngle);
        return (
          <text key={`gl-${i}`} x={lx} y={ly} textAnchor="start" fill="#484f58" fontSize="3" fontFamily="sans-serif">
            {level * 100}
          </text>
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const v = hexVertex(angleStep * i - Math.PI / 2, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={v.x}
            y2={v.y}
            stroke="#30363d"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon fill */}
      <polygon
        points={dataPointsStr}
        fill="rgba(240,136,62,0.12)"
        stroke="#f0883e"
        strokeWidth="1.5"
      />

      {/* Data dots with values */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0d1117" stroke="#f0883e" strokeWidth="1.2" />
          <text
            x={p.x}
            y={p.y - 6}
            textAnchor="middle"
            fill={values[i] >= 80 ? '#3fb950' : '#c9d1d9'}
            fontSize="5"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            {values[i]}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      {axes.map((label, i) => (
        <text
          key={`al-${i}`}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#c9d1d9"
          fontSize="5.5"
          fontFamily="sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Center average */}
      <text x={cx} y={cy - 1} textAnchor="middle" fill="#c9d1d9" fontSize="5" fontFamily="sans-serif" fontWeight="bold">
        {avgValue}
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#8b949e" fontSize="3" fontFamily="sans-serif">
        AVG
      </text>
    </svg>
  );
}

// ============================================================
// SVG 10: Scouting Efficiency Gauge
// ============================================================

function ScoutingEfficiencyGauge(): React.JSX.Element {
  const currentValue = 73;
  const cx = 50;
  const cy = 54;
  const radius = 32;
  const strokeWidth = 8;
  const zones = [
    { start: 0, end: 20, color: '#f85149' },
    { start: 20, end: 40, color: '#f0883e' },
    { start: 40, end: 60, color: '#ffa657' },
    { start: 60, end: 80, color: '#58a6ff' },
    { start: 80, end: 100, color: '#3fb950' },
  ];

  const arcPath = (startDeg: number, endDeg: number): string => {
    const startRad = (startDeg - 180) * (Math.PI / 180);
    const endRad = (endDeg - 180) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  const needleAngle = (currentValue / 100) * 180;
  const needleRad = (needleAngle - 180) * (Math.PI / 180);
  const needleLen = radius - 6;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy + needleLen * Math.sin(needleRad);

  return (
    <svg viewBox="0 0 100 72" className="w-full h-auto">
      {/* Zone arcs */}
      {zones.map((zone, i) => (
        <path
          key={i}
          d={arcPath(zone.start, zone.end)}
          fill="none"
          stroke={zone.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.35}
        />
      ))}

      {/* Value arc highlight */}
      {(() => {
        const startDeg = 0;
        const endDeg = currentValue;
        const startRad = (startDeg - 180) * (Math.PI / 180);
        const endRad = (endDeg - 180) * (Math.PI / 180);
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const largeArc = currentValue > 50 ? 1 : 0;
        return (
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke="#3fb950"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="butt"
            opacity={0.7}
          />
        );
      })()}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#c9d1d9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill="#161b22" stroke="#c9d1d9" strokeWidth="1" />

      {/* Value text */}
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#c9d1d9" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
        {currentValue}%
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#8b949e" fontSize="4" fontFamily="sans-serif">
        Efficiency
      </text>

      {/* Scale labels */}
      <text x={cx - radius - 4} y={cy + 5} textAnchor="end" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
        0
      </text>
      <text x={cx + radius + 4} y={cy + 5} textAnchor="start" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
        100
      </text>
      <text x={cx} y={cy - radius - 3} textAnchor="middle" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
        50
      </text>
    </svg>
  );
}

// ============================================================
// SVG 11: Monthly Reports Timeline
// ============================================================

function MonthlyReportsTimeline(): React.JSX.Element {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const qualityColors: Record<string, string> = {
    high: '#3fb950',
    medium: '#ffa657',
    low: '#f85149',
  };
  const qualities = ['high', 'high', 'medium', 'high', 'low', 'medium', 'high', 'high', 'medium', 'high', 'medium', 'high'];
  const reportCounts = [12, 15, 8, 14, 5, 9, 16, 18, 10, 15, 11, 17];

  const lineY = 40;
  const startX = 8;
  const endX = 92;
  const dotR = 4;

  return (
    <svg viewBox="0 0 100 60" className="w-full h-auto">
      {/* Title */}
      <text x="50" y="8" textAnchor="middle" fill="#8b949e" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">
        Monthly Reports Quality
      </text>

      {/* Timeline line */}
      <line x1={startX} y1={lineY} x2={endX} y2={lineY} stroke="#30363d" strokeWidth="1" />

      {/* Dots and labels */}
      {months.map((month, i) => {
        const x = startX + (i / (months.length - 1)) * (endX - startX);
        const color = qualityColors[qualities[i]];
        const isHigh = qualities[i] === 'high';
        return (
          <g key={i}>
            {/* Outer ring for high quality */}
            {isHigh && (
              <circle cx={x} cy={lineY} r={dotR + 3} fill={color} opacity={0.15} />
            )}

            {/* Main dot */}
            <circle cx={x} cy={lineY} r={dotR} fill={color} opacity={0.85} />

            {/* Inner dot */}
            <circle cx={x} cy={lineY} r={1.5} fill="#0d1117" />

            {/* Month label below */}
            <text x={x} y={lineY + 10} textAnchor="middle" fill="#484f58" fontSize="3.5" fontFamily="sans-serif">
              {month.charAt(0)}
            </text>

            {/* Report count above */}
            <text x={x} y={lineY - 8} textAnchor="middle" fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">
              {reportCounts[i]}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <circle cx="18" cy="56" r="2.5" fill={qualityColors.high} opacity={0.85} />
      <text x="22" y="57" fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">High</text>
      <circle cx="38" cy="56" r="2.5" fill={qualityColors.medium} opacity={0.85} />
      <text x="42" y="57" fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">Medium</text>
      <circle cx="62" cy="56" r="2.5" fill={qualityColors.low} opacity={0.85} />
      <text x="66" y="57" fill="#8b949e" fontSize="3.5" fontFamily="sans-serif">Low</text>
    </svg>
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

      {/* SVG 3: Budget Allocation Donut & SVG 10: Efficiency Gauge */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2">
          <ScoutBudgetAllocationDonut />
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2">
          <ScoutingEfficiencyGauge />
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

      {/* SVG 4: Player Discovery Trend Area Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <PlayerDiscoveryTrend />
      </div>

      {/* SVG 6: Scouting Pipeline Funnel */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <ScoutingPipelineFunnel />
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

      {/* SVG 9: Target Player Attributes Radar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <span className="text-xs font-semibold text-[#c9d1d9] block mb-2">Target Player Attributes</span>
        <TargetPlayerAttributesRadar />
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

      {/* SVG 1: Scouting Coverage Map */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <span className="text-xs font-semibold text-[#c9d1d9] block mb-2">Scout Location Coverage</span>
        <ScoutingCoverageMap />
      </div>

      {/* SVG 2: Scout Network Hexagonal Radar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <span className="text-xs font-semibold text-[#c9d1d9] block mb-2">Network Coverage Radar</span>
        <ScoutNetworkHexagonalRadar />
      </div>

      {/* SVG 7: Regional Spending Bars */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <RegionalSpendingBars />
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

      {/* SVG 5: Scout Rating Comparison Bars */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <ScoutRatingComparisonBars />
      </div>

      {/* SVG 8: Scout Assignment Status Donut */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <ScoutAssignmentStatusDonut />
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

      {/* SVG 11: Monthly Reports Timeline */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
        <MonthlyReportsTimeline />
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
