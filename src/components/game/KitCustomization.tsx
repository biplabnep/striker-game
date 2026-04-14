'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shirt, Check, X, Star, Users, Info, ArrowLeft,
  Palette, History, Trophy, Zap, Flame, Sparkles,
  Lock, Eye, Copy, Shield, Crown, Gift, Clock,
  TrendingUp, Compass, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------
const ATTR_KEYS: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const ATTR_SHORT: Record<CoreAttribute, string> = {
  pace: 'PAC', shooting: 'SHO', passing: 'PAS',
  dribbling: 'DRI', defending: 'DEF', physical: 'PHY',
};
const ATTR_BAR_COLOR: Record<CoreAttribute, string> = {
  pace: '#f97316', shooting: '#ef4444', passing: '#3b82f6',
  dribbling: '#a855f7', defending: '#22c55e', physical: '#eab308',
};

const COLOR_SWATCHES = [
  { label: 'Red', value: '#dc2626' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'White', value: '#f8fafc' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Yellow', value: '#eab308' },
];

// Famous players by jersey number
const NUMBER_LEGENDS: Record<number, { players: string[]; description: string }> = {
  1:  { players: ['Gianluigi Buffon', 'Manuel Neuer', 'Iker Casillas'], description: 'The goalkeeper\'s number — last line of defense.' },
  2:  { players: ['Gary Neville', 'Dani Alves', 'Cafu'], description: 'Right-back territory — attacking fullbacks.' },
  3:  { players: ['Paolo Maldini', 'Ashley Cole', 'Roberto Carlos'], description: 'Left-backs and commanding center-halves.' },
  4:  { players: ['Virgil van Dijk', 'Sergio Ramos', 'Patrick Vieira'], description: 'The leader at the back or a deep-lying general.' },
  5:  { players: ['Franz Beckenbauer', 'Zinedine Zidane', 'Rio Ferdinand'], description: 'Elegant defenders and midfield generals.' },
  6:  { players: ['Xavi', 'Tony Adams', 'Lothar Matthäus'], description: 'The midfield anchor and defensive rock.' },
  7:  { players: ['Cristiano Ronaldo', 'David Beckham', 'George Best'], description: 'Wingers and playmakers — the showmen.' },
  8:  { players: ['Andrés Iniesta', 'Steven Gerrard', 'Frank Lampard'], description: 'Box-to-box midfield maestros.' },
  9:  { players: ['Ronaldo Nazário', 'Fernando Torres', 'Alan Shearer'], description: 'The ultimate striker\'s number — pure goalscorer.' },
  10: { players: ['Lionel Messi', 'Pelé', 'Diego Maradona'], description: 'The playmaker and team talisman — legendary.' },
  11: { players: ['Mohamed Salah', 'Neymar', 'Ryan Giggs'], description: 'Pacy wingers and second strikers.' },
  14: { players: ['Johan Cruyff', 'Thierry Henry'], description: 'The innovators and total footballers.' },
  21: { players: ['Andrea Pirlo', 'Zlatan Ibrahimović'], description: 'Elegant creators and larger-than-life strikers.' },
  23: { players: ['David Beckham (AC Milan)', 'Marco Reus'], description: 'Modern icons and club legends.' },
};

// Retired numbers per club (simplified)
const RETIRED_NUMBERS: Record<string, number[]> = {
  arsenal: [10],          // Dennis Bergkamp / Tony Adams
  chelsea: [25],          // Gianluca Vialli
  manchester_united: [7], // Bryan Robson / George Best
  liverpool: [6],         // Alan Hansen
  ac_milan: [3, 6],       // Paolo Maldini, Franco Baresi
  juventus: [10],         // Alessandro Del Piero
  inter_milan: [3],       // Giacinto Facchetti
  real_madrid: [5],       // Manolo Sanchís
  barcelona: [14],        // Johan Cruyff
  bayern_munich: [5, 13], // Franz Beckenbauer, Gerd Müller
};

// Position legend
const POSITION_LEGEND = [
  { range: '1', label: 'GK', color: '#eab308' },
  { range: '2-5', label: 'DEF', color: '#3b82f6' },
  { range: '6-8', label: 'MID', color: '#22c55e' },
  { range: '9-11', label: 'FWD', color: '#ef4444' },
];

// Kit Design Studio patterns
const KIT_PATTERNS = [
  { id: 'none', label: 'Classic' },
  { id: 'stripes', label: 'Classic Stripes' },
  { id: 'bands', label: 'Vertical Bands' },
  { id: 'hoops', label: 'Hoops' },
  { id: 'half', label: 'Half-and-Half' },
  { id: 'sash', label: 'Sash' },
  { id: 'chevron', label: 'Chevron' },
];

const SLEEVE_STYLES = ['Short', 'Long', 'Sleeveless'] as const;
const COLLAR_STYLES = ['V-Neck', 'Round', 'Collar', 'Polo'] as const;

// Famous real-world-inspired kits
const FAMOUS_KITS = [
  { club: 'Barcelona', league: 'La Liga', year: 2010, primary: '#a41857', secondary: '#004d98', pattern: 'stripes' },
  { club: 'Arsenal', league: 'Premier League', year: 2004, primary: '#ef4444', secondary: '#ffffff', pattern: 'sleeves' },
  { club: 'Juventus', league: 'Serie A', year: 2019, primary: '#111827', secondary: '#f8fafc', pattern: 'stripes' },
  { club: 'AC Milan', league: 'Serie A', year: 1994, primary: '#dc2626', secondary: '#111827', pattern: 'stripes' },
  { club: 'Real Madrid', league: 'La Liga', year: 2022, primary: '#f8fafc', secondary: '#eab308', pattern: 'none' },
  { club: 'Netherlands', league: 'National Team', year: 1988, primary: '#f97316', secondary: '#f8fafc', pattern: 'none' },
  { club: 'Brazil', league: 'National Team', year: 1970, primary: '#eab308', secondary: '#16a34a', pattern: 'none' },
  { club: 'Nigeria', league: 'National Team', year: 2018, primary: '#16a34a', secondary: '#f8fafc', pattern: 'zigzag' },
];

// Special edition kits
const SPECIAL_EDITION_KITS = [
  { id: 'cl-final', name: 'Champions League Final', rarity: 'Legendary' as const, unlocked: true, primary: '#1e3a8a', secondary: '#fbbf24' },
  { id: 'derby-day', name: 'Derby Day', rarity: 'Epic' as const, unlocked: true, primary: '#dc2626', secondary: '#1f2937' },
  { id: 'christmas', name: 'Christmas Edition', rarity: 'Rare' as const, unlocked: true, primary: '#166534', secondary: '#f8fafc' },
  { id: 'retro', name: 'Retro Throwback', rarity: 'Common' as const, unlocked: false, primary: '#92400e', secondary: '#fef3c7' },
];

const RARITY_COLORS: Record<string, string> = {
  Legendary: '#fbbf24',
  Epic: '#a855f7',
  Rare: '#3b82f6',
  Common: '#8b949e',
};

// -----------------------------------------------------------
// Seeded random for consistent taken numbers
// -----------------------------------------------------------
function seedHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// -----------------------------------------------------------
// Jersey SVG component
// -----------------------------------------------------------
function JerseySVG({ primaryColor, secondaryColor, number }: { primaryColor: string; secondaryColor: string; number: number }) {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Shirt body */}
      <path
        d="M25,20 L10,35 L20,40 L20,110 L80,110 L80,40 L90,35 L75,20 L65,28 Q60,32 50,32 Q40,32 35,28 Z"
        fill={primaryColor}
        stroke="#333"
        strokeWidth="1.5"
      />
      {/* Collar */}
      <path
        d="M35,20 Q40,26 50,26 Q60,26 65,20"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Sleeve trim left */}
      <path d="M20,35 L20,55 L32,55 L32,40 Z" fill={secondaryColor} opacity="0.6" />
      {/* Sleeve trim right */}
      <path d="M80,35 L80,55 L68,55 L68,40 Z" fill={secondaryColor} opacity="0.6" />
      {/* Number on shirt */}
      <text
        x="50" y="80"
        textAnchor="middle"
        fill="#fff"
        fontSize="28"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        stroke="#000"
        strokeWidth="0.5"
        paintOrder="stroke"
      >
        {number}
      </text>
    </svg>
  );
}

// -----------------------------------------------------------
// Mini Pattern Preview (for pattern selector thumbnails)
// -----------------------------------------------------------
function MiniPatternPreview({ pattern, primary, secondary }: { pattern: string; primary: string; secondary: string }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill={primary} />
      {pattern === 'stripes' && (
        <>
          <rect x="0" y="4" width="32" height="5" fill={secondary} opacity="0.4" />
          <rect x="0" y="16" width="32" height="5" fill={secondary} opacity="0.4" />
          <rect x="0" y="28" width="32" height="4" fill={secondary} opacity="0.4" />
        </>
      )}
      {pattern === 'bands' && (
        <>
          <rect x="4" y="0" width="8" height="32" fill={secondary} opacity="0.4" />
          <rect x="20" y="0" width="8" height="32" fill={secondary} opacity="0.4" />
        </>
      )}
      {pattern === 'hoops' && (
        <>
          <rect x="0" y="2" width="32" height="10" fill={secondary} opacity="0.35" />
          <rect x="0" y="20" width="32" height="10" fill={secondary} opacity="0.35" />
        </>
      )}
      {pattern === 'half' && (
        <rect x="0" y="0" width="16" height="32" fill={secondary} opacity="0.35" />
      )}
      {pattern === 'sash' && (
        <path d="M0,0 L32,32 L32,32 L0,16 Z" fill={secondary} opacity="0.35" />
      )}
      {pattern === 'chevron' && (
        <path d="M4,20 L16,10 L28,20 L26,22 L16,14 L6,22 Z" fill={secondary} opacity="0.45" />
      )}
    </svg>
  );
}

// -----------------------------------------------------------
// Advanced Jersey SVG (with patterns, sleeves, collars)
// -----------------------------------------------------------
function AdvancedJerseySVG({
  primaryColor,
  secondaryColor,
  number,
  pattern,
  sleeveStyle,
  collarStyle,
}: {
  primaryColor: string;
  secondaryColor: string;
  number: number;
  pattern: string;
  sleeveStyle: string;
  collarStyle: string;
}) {
  const bodyPath =
    sleeveStyle === 'Long'
      ? 'M25,20 L10,35 L15,40 L15,80 L25,80 L25,110 L75,110 L75,80 L85,80 L85,40 L90,35 L75,20 L65,28 Q60,32 50,32 Q40,32 35,28 Z'
      : sleeveStyle === 'Sleeveless'
        ? 'M30,25 L22,35 L25,35 L25,110 L75,110 L75,35 L78,35 L70,25 L65,28 Q60,32 50,32 Q40,32 35,28 Z'
        : 'M25,20 L10,35 L20,40 L20,55 L32,55 L32,40 L68,40 L68,55 L80,55 L80,40 L90,35 L75,20 L65,28 Q60,32 50,32 Q40,32 35,28 Z';

  const renderPattern = () => {
    switch (pattern) {
      case 'stripes':
        return (
          <g clipPath="url(#studioClip)">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x="20" y={36 + i * 19} width="60" height="9" fill={secondaryColor} opacity="0.4" />
            ))}
          </g>
        );
      case 'bands':
        return (
          <g clipPath="url(#studioClip)">
            {[0, 1, 2].map((i) => (
              <rect key={i} x={22 + i * 19} y="30" width="9" height="80" fill={secondaryColor} opacity="0.4" />
            ))}
          </g>
        );
      case 'hoops':
        return (
          <g clipPath="url(#studioClip)">
            {[0, 1, 2].map((i) => (
              <rect key={i} x="20" y={36 + i * 25} width="60" height="14" fill={secondaryColor} opacity="0.35" />
            ))}
          </g>
        );
      case 'half':
        return (
          <g clipPath="url(#studioClip)">
            <rect x="20" y="25" width="30" height="85" fill={secondaryColor} opacity="0.4" />
          </g>
        );
      case 'sash':
        return (
          <g clipPath="url(#studioClip)">
            <path d="M20,25 L80,90 L80,100 L20,35 Z" fill={secondaryColor} opacity="0.4" />
          </g>
        );
      case 'chevron':
        return (
          <g clipPath="url(#studioClip)">
            <path d="M25,58 L50,42 L75,58 L71,63 L50,50 L29,63 Z" fill={secondaryColor} opacity="0.5" />
            <path d="M28,68 L50,55 L72,68 L69,72 L50,61 L31,72 Z" fill={secondaryColor} opacity="0.3" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderCollar = () => {
    switch (collarStyle) {
      case 'Round':
        return <path d="M35,22 Q50,30 65,22" fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />;
      case 'V-Neck':
        return <path d="M38,20 L50,30 L62,20" fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />;
      case 'Collar':
        return (
          <>
            <path d="M35,18 L65,18 L65,22 Q50,28 35,22 Z" fill={secondaryColor} opacity="0.7" />
            <path d="M35,18 Q50,28 65,18" fill="none" stroke={secondaryColor} strokeWidth="2" />
          </>
        );
      case 'Polo':
        return (
          <>
            <rect x="45" y="14" width="10" height="10" rx="2" fill={secondaryColor} opacity="0.6" />
            <path d="M35,20 Q50,26 65,20" fill="none" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      default:
        return <path d="M35,20 Q40,26 50,26 Q60,26 65,20" fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />;
    }
  };

  return (
    <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="studioClip">
          <path d="M25,20 L10,35 L20,40 L20,110 L80,110 L80,40 L90,35 L75,20 L65,28 Q60,32 50,32 Q40,32 35,28 Z" />
        </clipPath>
      </defs>
      <path d={bodyPath} fill={primaryColor} stroke="#333" strokeWidth="1.5" />
      {renderPattern()}
      {renderCollar()}
      {sleeveStyle === 'Long' ? (
        <>
          <path d="M15,70 L15,80 L25,80 L25,55 Z" fill={secondaryColor} opacity="0.5" />
          <path d="M85,70 L85,80 L75,80 L75,55 Z" fill={secondaryColor} opacity="0.5" />
        </>
      ) : sleeveStyle === 'Sleeveless' ? null : (
        <>
          <path d="M20,35 L20,55 L32,55 L32,40 Z" fill={secondaryColor} opacity="0.6" />
          <path d="M80,35 L80,55 L68,55 L68,40 Z" fill={secondaryColor} opacity="0.6" />
        </>
      )}
      <text x="50" y="82" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif" stroke="#000" strokeWidth="0.5" paintOrder="stroke">
        {number}
      </text>
    </svg>
  );
}

// -----------------------------------------------------------
// Mini Jersey SVG (for gallery cards)
// -----------------------------------------------------------
function MiniJerseySVG({ primary, secondary, pattern }: { primary: string; secondary: string; pattern: string }) {
  return (
    <svg viewBox="0 0 40 48" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10,8 L4,14 L8,16 L8,44 L32,44 L32,16 L36,14 L30,8 L26,11 Q24,13 20,13 Q16,13 14,11 Z"
        fill={primary}
        stroke="#555"
        strokeWidth="0.8"
      />
      {pattern === 'stripes' && (
        <>
          <rect x="8" y="16" width="24" height="5" fill={secondary} opacity="0.4" />
          <rect x="8" y="28" width="24" height="5" fill={secondary} opacity="0.4" />
        </>
      )}
      {pattern === 'sleeves' && (
        <>
          <path d="M4,14 L8,16 L8,26 L14,26 L14,16 Z" fill={secondary} opacity="0.7" />
          <path d="M36,14 L32,16 L32,26 L26,26 L26,16 Z" fill={secondary} opacity="0.7" />
        </>
      )}
      {pattern === 'zigzag' && (
        <>
          <path d="M8,20 L14,16 L20,20 L26,16 L32,20" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.5" />
          <path d="M8,28 L14,24 L20,28 L26,24 L32,28" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.5" />
        </>
      )}
      {pattern === 'stars' && (
        <>
          <path d="M16,24 L18,20 L20,24 L24,24 L21,27 L22,31 L18,29 L14,31 L15,27 L12,24 Z" fill={secondary} opacity="0.5" />
        </>
      )}
      <path d="M14,8 Q20,12 26,8" fill="none" stroke={secondary} strokeWidth="1.5" />
    </svg>
  );
}

// -----------------------------------------------------------
// Match Score Badge sub-component
// -----------------------------------------------------------
function hexPoints(radius: number, cx: number, cy: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
}

function MatchScoreBadge({ radarPlayerData, radarLegendaryData }: { radarPlayerData: { value: number }[]; radarLegendaryData: { value: number }[] }): React.JSX.Element {
  const avgPlayer = radarPlayerData.reduce((s, d) => s + d.value, 0) / radarPlayerData.length;
  const avgLegend = radarLegendaryData.reduce((s, d) => s + d.value, 0) / radarLegendaryData.length;
  const score = Math.round(Math.min(99, Math.max(1, (avgPlayer / avgLegend) * 100)));
  const scoreColor = score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-1">
      <svg viewBox="0 0 48 48" style={{ width: 24, height: 24 }} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#21262d" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={scoreColor} strokeWidth="4" strokeDasharray={`${(score / 100) * 125.7} 125.7`} strokeLinecap="round" strokeOpacity="0.8" />
        <text x="24" y="27" textAnchor="middle" fill={scoreColor} fontSize="12" fontWeight="800" fontFamily="Arial, sans-serif">{score}</text>
      </svg>
      <span className="text-[9px] font-bold" style={{ color: scoreColor }}>{score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Average'}</span>
    </div>
  );
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function KitCustomization() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const [selectedNumber, setSelectedNumber] = useState(10);
  const [primaryColor, setPrimaryColor] = useState(gameState?.currentClub.primaryColor ?? '#dc2626');
  const [secondaryColor, setSecondaryColor] = useState(gameState?.currentClub.secondaryColor ?? '#ffffff');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState('none');
  const [selectedSleeve, setSelectedSleeve] = useState('Short');
  const [selectedCollar, setSelectedCollar] = useState('V-Neck');
  const [previewSpecialKit, setPreviewSpecialKit] = useState<string | null>(null);

  // Generate taken numbers based on club name (seeded for consistency)
  const takenNumbers = useMemo(() => {
    if (!gameState) return [];
    const seed = seedHash(gameState.currentClub.name + 'squad');
    const nums: number[] = [];
    for (let i = 0; i < 7; i++) {
      const n = (seed + i * 17) % 99 + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a, b) => a - b);
  }, [gameState]);

  // Retired numbers for current club
  const retiredNumbers = useMemo(() => {
    if (!gameState) return [];
    const clubId = gameState.currentClub.id.toLowerCase();
    return RETIRED_NUMBERS[clubId] ?? [];
  }, [gameState]);

  // Number history (generated from season number)
  const numberHistory = useMemo(() => {
    if (!gameState) return [];
    const currentSeason = gameState.currentSeason;
    const clubName = gameState.currentClub.name;
    const history: { season: number; number: number; club: string; games: number }[] = [];

    if (currentSeason >= 3) {
      history.push({ season: currentSeason - 2, number: (seedHash(clubName) % 30) + 1, club: clubName, games: 12 + (seedHash(clubName + 'a') % 20) });
      history.push({ season: currentSeason - 1, number: selectedNumber, club: clubName, games: 18 + (seedHash(clubName + 'b') % 15) });
    } else if (currentSeason >= 2) {
      history.push({ season: currentSeason - 1, number: (seedHash(clubName) % 30) + 1, club: clubName, games: 8 + (seedHash(clubName + 'a') % 15) });
    }

    return history;
  }, [gameState, selectedNumber]);

  // Kit history across career
  const kitHistory = useMemo(() => {
    if (!gameState) return [];
    const history = [
      { season: 1, club: 'Academy FC', primary: '#2563eb', secondary: '#f8fafc', matches: 24, wins: 16 },
      { season: 2, club: 'Rovers United', primary: '#dc2626', secondary: '#f8fafc', matches: 31, wins: 18 },
      { season: 3, club: 'Metro Stars', primary: '#7c3aed', secondary: '#fbbf24', matches: 35, wins: 22 },
      { season: 4, club: 'FC Dynamo', primary: '#16a34a', secondary: '#f8fafc', matches: 38, wins: 25 },
    ];
    if (gameState.currentSeason >= 2) {
      history.push({
        season: gameState.currentSeason,
        club: gameState.currentClub.name,
        primary: gameState.currentClub.primaryColor,
        secondary: gameState.currentClub.secondaryColor,
        matches: 12,
        wins: 8,
      });
    }
    return history.slice(-5);
  }, [gameState]);

  // Lucky kit (best win rate)
  const luckyKit = useMemo(() => {
    if (kitHistory.length === 0) return null;
    let best = kitHistory[0];
    for (const kit of kitHistory) {
      if (kit.wins / kit.matches > best.wins / best.matches) best = kit;
    }
    return best;
  }, [kitHistory]);

  // GUARD_PLACEHOLDER

  const { player, currentClub } = gameState ?? { player: {} as any, currentClub: {} as any };

  const isTaken = takenNumbers.includes(selectedNumber);
  const isRetired = retiredNumbers.includes(selectedNumber);
  const currentNumber = selectedNumber;

  // Get legend info for selected number
  const legendInfo = NUMBER_LEGENDS[selectedNumber];

  // Stat bar color helper
  const statValue = (key: CoreAttribute) => player.attributes[key];

  const handleConfirm = () => {
    setToast(`Jersey number changed to ${selectedNumber}!`);
    setTimeout(() => setToast(null), 2500);
  };

  // ── SVG Data: Attribute Compatibility Radar ──
  const radarPlayerData = ATTR_KEYS.map((key) => ({
    label: ATTR_SHORT[key],
    value: statValue(key) / 100,
    color: ATTR_BAR_COLOR[key],
  }));

  // Simulated legendary comparison data based on selected number
  const radarLegendaryData = useMemo(() => {
    const num = selectedNumber;
    const base = num <= 5 ? 85 : num <= 8 ? 78 : 82;
    return ATTR_KEYS.map((key) => {
      const offset = key === 'defending' ? (num <= 5 ? 12 : -8)
        : key === 'shooting' ? (num >= 9 ? 10 : -5)
        : key === 'pace' ? (num === 7 || num === 11 ? 8 : -3)
        : (seedHash(key + String(num)) % 16) - 8;
      return {
        label: ATTR_SHORT[key],
        value: Math.max(0.4, Math.min(1, (base + offset) / 100)),
      };
    });
  }, [selectedNumber]);

  // ── SVG Data: Position Number Popularity ──
  const positionPopularity = useMemo(() => {
    const num = selectedNumber;
    const gk = num === 1 ? 95 : num <= 3 ? 15 : 3;
    const def = (num >= 2 && num <= 5) ? 60 + (5 - Math.abs(num - 3.5)) * 8 : 8 + (num === 4 ? 25 : 0);
    const mid = (num >= 6 && num <= 8) ? 55 + (8 - Math.abs(num - 7)) * 10 : 5 + (num === 10 ? 30 : 0);
    const fwd = (num >= 9 && num <= 11) ? 50 + (11 - Math.abs(num - 10)) * 10 : 3 + (num === 14 ? 20 : 0);
    return [
      { label: 'GK', value: Math.min(98, gk), color: '#eab308' },
      { label: 'DEF', value: Math.min(98, def), color: '#3b82f6' },
      { label: 'MID', value: Math.min(98, mid), color: '#22c55e' },
      { label: 'FWD', value: Math.min(98, fwd), color: '#ef4444' },
    ];
  }, [selectedNumber]);

  // ── SVG Data: Pattern Popularity (via .reduce()) ──
  const patternPopularity = useMemo(() => {
    return FAMOUS_KITS.reduce<Record<string, number>>((acc, kit) => {
      const p = kit.pattern === 'sleeves' ? 'none' : kit.pattern;
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const patternDonutSegments = useMemo(() => {
    const entries = Object.entries(patternPopularity);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4'];
    return entries.reduce<Array<{ id: string; label: string; count: number; startAngle: number; sweepAngle: number; color: string }>>((acc, [pattern, count], i) => {
      const prevCumulative = acc.reduce((s, seg) => s + seg.sweepAngle, 0);
      const sweepAngle = (count / total) * 360;
      acc.push({
        id: pattern,
        label: KIT_PATTERNS.find((kp) => kp.id === pattern)?.label ?? pattern,
        count,
        startAngle: prevCumulative,
        sweepAngle,
        color: colors[i % colors.length],
      });
      return acc;
    }, []);
  }, [patternPopularity]);

  // ── SVG Data: Sleeve style fan preference (simulated) ──
  const sleevePreferenceData = [
    { label: 'Short', value: 62, color: '#22c55e' },
    { label: 'Long', value: 24, color: '#3b82f6' },
    { label: 'Sleeveless', value: 14, color: '#f97316' },
  ];

  // ── SVG Data: Collar style ratings (simulated) ──
  const collarRatingData = [
    { label: 'V-Neck', value: 88, color: '#22c55e' },
    { label: 'Round', value: 72, color: '#3b82f6' },
    { label: 'Collar', value: 55, color: '#a855f7' },
    { label: 'Polo', value: 45, color: '#f97316' },
  ];

  // ── SVG Data: Color harmony ──
  const colorHarmonyType = useMemo(() => {
    const hueDiff = Math.abs(
      parseInt(primaryColor.slice(1, 3), 16) - parseInt(secondaryColor.slice(1, 3), 16)
    );
    const satDiff = Math.abs(
      parseInt(primaryColor.slice(3, 5), 16) - parseInt(secondaryColor.slice(3, 5), 16)
    );
    if (hueDiff > 200 || hueDiff < 55) return 'Complementary';
    if (hueDiff < 90 && satDiff < 60) return 'Analogous';
    return 'Triadic';
  }, [primaryColor, secondaryColor]);

  if (!gameState) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#8b949e]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-[#c9d1d9]">Kit & Number</h2>
          </div>
          <p className="text-xs text-[#8b949e]">{currentClub.name}</p>
        </div>
      </div>

      {/* ─── Player Card Preview ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-[#30363d] overflow-hidden"
      >
        {/* Card top - club color background */}
        <div
          className="relative p-5 flex flex-col items-center"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Secondary color accent line */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: secondaryColor }} />

          {/* OVR */}
          <div className="text-4xl font-black text-white drop-shadow-lg">{player.overall}</div>

          {/* Jersey number */}
          <div className="text-6xl font-black text-white/90 -mt-1 mb-1" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
            {selectedNumber}
          </div>

          {/* Player info */}
          <div className="text-center">
            <div className="text-sm font-bold text-white">{player.name}</div>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-xs text-white/80">{player.position}</span>
              <span className="text-xs text-white/60">|</span>
              <span className="text-xs text-white/80">{currentClub.shortName}</span>
              <span className="text-xs text-white/60">|</span>
              <span className="text-xs text-white/80">{player.nationality}</span>
            </div>
          </div>
        </div>

        {/* Stats mini-bar */}
        <div className="bg-[#161b22] px-4 py-3">
          <div className="flex items-center justify-between gap-1">
            {ATTR_KEYS.map((key) => {
              const val = statValue(key);
              return (
                <div key={key} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[9px] font-bold text-[#484f58]">{ATTR_SHORT[key]}</span>
                  <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: ATTR_BAR_COLOR[key] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ─── SVG 11: Attribute Compatibility Radar ─── */}
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-[#c9d1d9]">Number #{selectedNumber} Attribute Match</span>
          </div>
          <span className="text-[8px] text-[#484f58]">vs Legendary Avg</span>
        </div>
        {/* Match score summary */}
        <div className="flex items-center gap-2">
          <div className="text-[9px] text-[#8b949e]">Match Score:</div>
          <MatchScoreBadge radarPlayerData={radarPlayerData} radarLegendaryData={radarLegendaryData} />
        </div>
        <svg viewBox="0 0 240 160" style={{ width: '100%', maxWidth: 320 }} xmlns="http://www.w3.org/2000/svg">
          {[12, 24, 36, 48].map((r, ri) => (
            <polygon key={ri} points={hexPoints(r, 120, 80, 6)} fill="none" stroke="#c9d1d9" strokeWidth="0.5" fillOpacity={0.06} />
          ))}
          {/* Axis lines */}
          {ATTR_KEYS.map((key, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const ex = 120 + 48 * Math.cos(angle);
            const ey = 80 + 48 * Math.sin(angle);
            return (
              <line key={key} x1="120" y1="80" x2={ex} y2={ey} stroke="#30363d" strokeWidth="0.5" />
            );
          })}
          {/* Legendary comparison polygon */}
          <polygon
            points={radarLegendaryData.map((d, i) => {
              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
              return `${120 + d.value * 48 * Math.cos(angle)},${80 + d.value * 48 * Math.sin(angle)}`;
            }).join(' ')}
            fill="#fbbf24"
            fillOpacity="0.06"
            stroke="#fbbf24"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          {/* Player attribute polygon */}
          <polygon
            points={radarPlayerData.map((d, i) => {
              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
              return `${120 + d.value * 48 * Math.cos(angle)},${80 + d.value * 48 * Math.sin(angle)}`;
            }).join(' ')}
            fill="#22c55e"
            fillOpacity="0.1"
            stroke="#22c55e"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          {/* Player dots and labels */}
          {radarPlayerData.map((d, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const px = 120 + d.value * 48 * Math.cos(angle);
            const py = 80 + d.value * 48 * Math.sin(angle);
            const lx = 120 + 56 * Math.cos(angle);
            const ly = 80 + 56 * Math.sin(angle);
            return (
              <g key={d.label}>
                <circle cx={px} cy={py} r="2.5" fill={d.color} stroke="#0d1117" strokeWidth="0.5" />
                <text x={lx} y={ly - 3} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{d.label}</text>
                <text x={lx} y={ly + 5} textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="Arial, sans-serif">{Math.round(d.value * 100)}</text>
              </g>
            );
          })}
          {/* Legend */}
          <rect x="8" y="148" width="6" height="6" rx="1" fill="#22c55e" fillOpacity="0.7" />
          <text x="17" y="154" fill="#8b949e" fontSize="6" fontFamily="Arial, sans-serif">Your Stats</text>
          <rect x="65" y="148" width="6" height="6" rx="1" fill="#fbbf24" fillOpacity="0.5" />
          <text x="74" y="154" fill="#8b949e" fontSize="6" fontFamily="Arial, sans-serif">Legendary #{selectedNumber} Avg</text>
          <text x="175" y="154" fill="#30363d" fontSize="5" fontFamily="Arial, sans-serif">Higher is better</text>
        </svg>
      </div>

      {/* ─── Jersey Number Selection ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Shirt className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Select Jersey Number</h3>
        </div>

        {/* Position legend */}
        <div className="flex flex-wrap gap-2">
          {POSITION_LEGEND.map((pos) => (
            <Badge
              key={pos.range}
              className="text-[9px] font-bold border-0 px-1.5"
              style={{ backgroundColor: pos.color + '22', color: pos.color }}
            >
              {pos.label} ({pos.range})
            </Badge>
          ))}
        </div>

        {/* ─── SVG 2: Position Number Popularity ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="text-[9px] font-bold text-[#8b949e] mb-1">Number {selectedNumber} Popularity by Position</div>
          <svg viewBox="0 0 240 78" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {positionPopularity.map((seg, i) => {
              const y = 4 + i * 18;
              const barWidth = Math.max(1, (seg.value / 100) * 155);
              const isHigh = seg.value >= 60;
              return (
                <g key={seg.label}>
                  {/* Position label with icon dot */}
                  <circle cx="4" cy={y + 6} r="3" fill={seg.color} fillOpacity={isHigh ? 0.7 : 0.25} />
                  <text x="10" y={y + 9} fill={seg.color} fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{seg.label}</text>
                  {/* Background bar */}
                  <rect x="28" y={y + 1} width="155" height="9" rx="2" fill="#21262d" />
                  {/* Filled bar */}
                  <rect x="28" y={y + 1} width={barWidth} height="9" rx="2" fill={seg.color} fillOpacity={isHigh ? 0.7 : 0.35} />
                  {/* Popularity text */}
                  <text x="188" y={y + 9} fill={isHigh ? '#c9d1d9' : '#484f58'} fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{seg.value}%</text>
                  {/* Trend indicator */}
                  <text x="212" y={y + 9} fill={isHigh ? '#22c55e' : '#484f58'} fontSize="5" fontFamily="Arial, sans-serif">
                    {seg.value >= 80 ? '▲ Hot' : seg.value >= 50 ? '● Avg' : '▽ Low'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Number grid - 5 columns */}
        <div className="grid grid-cols-5 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
          {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
            const isSelected = num === selectedNumber;
            const isTakenNum = takenNumbers.includes(num);
            const isRetiredNum = retiredNumbers.includes(num);

            return (
              <button
                key={num}
                onClick={() => setSelectedNumber(num)}
                disabled={isRetiredNum}
                className={`relative flex items-center justify-center h-9 rounded-lg border text-xs font-bold transition-all
                  ${isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : isRetiredNum
                      ? 'bg-[#21262d] border-[#30363d] text-[#484f58] cursor-not-allowed opacity-50'
                      : isTakenNum
                        ? 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-amber-500/40'
                        : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:border-emerald-500/30 hover:text-emerald-400'
                  }
                `}
              >
                {num}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 text-[6px] font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1 py-px rounded-sm">
                    Current
                  </span>
                )}
                {isRetiredNum && (
                  <span className="absolute -top-1 -right-1 text-[6px] font-bold uppercase text-amber-400 bg-amber-500/15 px-1 py-px rounded-sm">
                    Retired
                  </span>
                )}
                {!isSelected && isTakenNum && (
                  <span className="absolute -top-1 -right-1 text-[6px] font-bold uppercase text-red-400 bg-red-500/15 px-1 py-px rounded-sm">
                    Taken
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current selection info */}
        <div className="flex items-center gap-2 text-xs">
          {isRetired ? (
            <div className="flex items-center gap-1 text-amber-400">
              <X className="h-3 w-3" />
              <span>This number is retired at {currentClub.name}</span>
            </div>
          ) : isTaken ? (
            <div className="flex items-center gap-1 text-amber-400">
              <Users className="h-3 w-3" />
              <span>This number is taken by a teammate</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3 w-3" />
              <span>Number {selectedNumber} is available</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Number Meaning / Trivia ─── */}
      {legendInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Number #{selectedNumber} Legends</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">{legendInfo.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {legendInfo.players.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                {p}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Kit Customization (Visual Only) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Colors</h3>
          <span className="text-[10px] text-[#484f58]">(visual only)</span>
        </div>

        {/* Jersey preview */}
        <div className="flex justify-center">
          <div className="w-28 h-36 bg-[#21262d] rounded-lg p-2 flex items-center justify-center">
            <JerseySVG primaryColor={primaryColor} secondaryColor={secondaryColor} number={selectedNumber} />
          </div>
        </div>

        {/* Primary color picker */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-1.5">Primary Color</div>
          <div className="flex gap-2">
            {/* Club's own color */}
            <button
              onClick={() => setPrimaryColor(currentClub.primaryColor)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${primaryColor === currentClub.primaryColor ? 'border-emerald-400' : 'border-[#30363d]'}`}
              style={{ backgroundColor: currentClub.primaryColor }}
              title={currentClub.name + ' color'}
            />
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                onClick={() => setPrimaryColor(swatch.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${primaryColor === swatch.value ? 'border-emerald-400' : 'border-[#30363d]'}`}
                style={{ backgroundColor: swatch.value }}
                title={swatch.label}
              />
            ))}
          </div>
        </div>

        {/* Secondary color picker */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-1.5">Secondary Color (Sleeve/Trim)</div>
          <div className="flex gap-2">
            <button
              onClick={() => setSecondaryColor(currentClub.secondaryColor)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${secondaryColor === currentClub.secondaryColor ? 'border-emerald-400' : 'border-[#30363d]'}`}
              style={{ backgroundColor: currentClub.secondaryColor }}
              title={currentClub.name + ' secondary'}
            />
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={'sec-' + swatch.value}
                onClick={() => setSecondaryColor(swatch.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${secondaryColor === swatch.value ? 'border-emerald-400' : 'border-[#30363d]'}`}
                style={{ backgroundColor: swatch.value }}
                title={swatch.label}
              />
            ))}
          </div>
        </div>

        {/* ─── SVG 4: Color Harmony Wheel ─── */}
        <div className="bg-[#0d1117] rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-[#8b949e]">Color Harmony</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{colorHarmonyType}</span>
          </div>
          <svg viewBox="0 0 120 120" style={{ width: 100, height: 100 }} xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring segments - 12 hue segments */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((seg) => {
              const startAngle = (seg * 30) - 90;
              const endAngle = ((seg + 1) * 30) - 90;
              const largeArc = 0;
              const outerR = 48;
              const innerR = 38;
              const x1o = 60 + outerR * Math.cos((startAngle * Math.PI) / 180);
              const y1o = 60 + outerR * Math.sin((startAngle * Math.PI) / 180);
              const x2o = 60 + outerR * Math.cos((endAngle * Math.PI) / 180);
              const y2o = 60 + outerR * Math.sin((endAngle * Math.PI) / 180);
              const x1i = 60 + innerR * Math.cos((endAngle * Math.PI) / 180);
              const y1i = 60 + innerR * Math.sin((endAngle * Math.PI) / 180);
              const x2i = 60 + innerR * Math.cos((startAngle * Math.PI) / 180);
              const y2i = 60 + innerR * Math.sin((startAngle * Math.PI) / 180);
              const hue = seg * 30;
              return (
                <path
                  key={seg}
                  d={`M${x1o},${y1o} A${outerR},${outerR} 0 ${largeArc},1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${largeArc},0 ${x2i},${y2i} Z`}
                  fill={`hsl(${hue}, 70%, 50%)`}
                  fillOpacity="0.35"
                  stroke="#161b22"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Inner decorative ring */}
            <circle cx="60" cy="60" r="36" fill="none" stroke="#30363d" strokeWidth="0.3" />
            {/* Inner circle */}
            <circle cx="60" cy="60" r="22" fill="#0d1117" stroke="#30363d" strokeWidth="0.5" />
            {/* Primary color indicator */}
            <circle cx="60" cy="22" r="5" fill={primaryColor} stroke="#c9d1d9" strokeWidth="1" />
            {/* Secondary color indicator */}
            <circle cx="96" cy="60" r="5" fill={secondaryColor} stroke="#c9d1d9" strokeWidth="1" />
            {/* Triadic indicator (third color) */}
            <circle cx="42" cy="91" r="4" fill={colorHarmonyType === 'Triadic' ? '#a855f7' : '#30363d'} stroke={colorHarmonyType === 'Triadic' ? '#c9d1d9' : '#21262d'} strokeWidth="0.5" opacity={colorHarmonyType === 'Triadic' ? 1 : 0.4} />
            {/* Connector line between primary and secondary */}
            <line x1="60" y1="22" x2="96" y2="60" stroke="#8b949e" strokeWidth="0.5" strokeDasharray="2,2" />
            {/* Connector line to triadic point */}
            <line x1="60" y1="22" x2="42" y2="91" stroke="#a855f7" strokeWidth="0.3" strokeDasharray="1,2" opacity={colorHarmonyType === 'Triadic' ? 0.6 : 0.2} />
            <line x1="96" y1="60" x2="42" y2="91" stroke="#a855f7" strokeWidth="0.3" strokeDasharray="1,2" opacity={colorHarmonyType === 'Triadic' ? 0.6 : 0.2} />
            {/* Center label */}
            <text x="60" y="58" textAnchor="middle" fill="#8b949e" fontSize="5" fontFamily="Arial, sans-serif">Primary</text>
            <text x="60" y="65" textAnchor="middle" fill="#8b949e" fontSize="5" fontFamily="Arial, sans-serif">+ Secondary</text>
          </svg>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-[#484f58]" style={{ backgroundColor: primaryColor }} />
              <div>
                <div className="text-[8px] font-bold text-[#c9d1d9]">Primary</div>
                <div className="text-[7px] text-[#484f58] font-mono">{primaryColor}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-[#484f58]" style={{ backgroundColor: secondaryColor }} />
              <div>
                <div className="text-[8px] font-bold text-[#c9d1d9]">Secondary</div>
                <div className="text-[7px] text-[#484f58] font-mono">{secondaryColor}</div>
              </div>
            </div>
            <div className="text-[7px] text-[#484f58] leading-tight mt-0.5">
              {colorHarmonyType === 'Complementary' && 'High contrast pairing — great for visibility and bold designs.'}
              {colorHarmonyType === 'Analogous' && 'Harmonious neighbors — creates a cohesive, elegant look.'}
              {colorHarmonyType === 'Triadic' && 'Balanced triad — vibrant and evenly spaced on the wheel.'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Kit Design Studio ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.35 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Design Studio</h3>
        </div>

        {/* Advanced jersey preview */}
        <div className="flex justify-center">
          <div className="w-36 h-44 bg-[#21262d] rounded-lg p-3 flex items-center justify-center">
            {previewSpecialKit ? (
              <AdvancedJerseySVG
                primaryColor={SPECIAL_EDITION_KITS.find((k) => k.id === previewSpecialKit)?.primary ?? primaryColor}
                secondaryColor={SPECIAL_EDITION_KITS.find((k) => k.id === previewSpecialKit)?.secondary ?? secondaryColor}
                number={selectedNumber}
                pattern="none"
                sleeveStyle={selectedSleeve}
                collarStyle={selectedCollar}
              />
            ) : (
              <AdvancedJerseySVG
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                number={selectedNumber}
                pattern={selectedPattern}
                sleeveStyle={selectedSleeve}
                collarStyle={selectedCollar}
              />
            )}
          </div>
        </div>

        {/* Pattern selector */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-2">Pattern</div>
          <div className="grid grid-cols-4 gap-1.5">
            {KIT_PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPattern(p.id);
                  setPreviewSpecialKit(null);
                }}
                className={`p-1.5 rounded-lg border text-[9px] font-medium text-center transition-colors ${
                  selectedPattern === p.id && !previewSpecialKit
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#484f58]'
                }`}
              >
                <div className="w-full aspect-square bg-[#0d1117] rounded mb-1 flex items-center justify-center overflow-hidden">
                  <MiniPatternPreview pattern={p.id} primary={primaryColor} secondary={secondaryColor} />
                </div>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── SVG 7: Pattern Popularity Donut ─── */}
        <div className="bg-[#0d1117] rounded-lg p-3 space-y-1.5">
          <div className="text-[9px] font-bold text-[#8b949e]">Pattern Usage in Famous Kits</div>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 80 80" style={{ width: 80, height: 80 }} xmlns="http://www.w3.org/2000/svg">
              {patternDonutSegments.map((seg) => {
                const startRad = ((seg.startAngle - 90) * Math.PI) / 180;
                const endRad = ((seg.startAngle + seg.sweepAngle - 90) * Math.PI) / 180;
                const outerR = 34;
                const innerR = 20;
                const x1o = 40 + outerR * Math.cos(startRad);
                const y1o = 40 + outerR * Math.sin(startRad);
                const x2o = 40 + outerR * Math.cos(endRad);
                const y2o = 40 + outerR * Math.sin(endRad);
                const x1i = 40 + innerR * Math.cos(endRad);
                const y1i = 40 + innerR * Math.sin(endRad);
                const x2i = 40 + innerR * Math.cos(startRad);
                const y2i = 40 + innerR * Math.sin(startRad);
                const largeArc = seg.sweepAngle > 180 ? 1 : 0;
                return (
                  <path
                    key={seg.id}
                    d={`M${x1o},${y1o} A${outerR},${outerR} 0 ${largeArc},1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${largeArc},0 ${x2i},${y2i} Z`}
                    fill={seg.color}
                    fillOpacity="0.7"
                    stroke="#0d1117"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Center text */}
              <text x="40" y="38" textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">
                {FAMOUS_KITS.length}
              </text>
              <text x="40" y="46" textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="Arial, sans-serif">kits</text>
            </svg>
            <div className="flex flex-col gap-1 flex-1">
              {patternDonutSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                  <span className="text-[8px] text-[#8b949e] flex-1">{seg.label}</span>
                  <span className="text-[8px] font-mono text-[#c9d1d9]">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sleeve style */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-2">Sleeve Style</div>
          <div className="flex gap-1.5">
            {SLEEVE_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSleeve(s)}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${
                  selectedSleeve === s
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#484f58]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ─── SVG 8: Sleeve Style Preference Bars ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-[#8b949e]">Fan Sleeve Preference</div>
            <div className="text-[7px] text-[#484f58]">Global Survey</div>
          </div>
          <svg viewBox="0 0 240 68" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {sleevePreferenceData.map((item, idx) => {
              const yBase = 4 + idx * 20;
              const barWidth = Math.max(1, (item.value / 100) * 155);
              const isSelected = SLEEVE_STYLES[idx] === selectedSleeve;
              return (
                <g key={item.label}>
                  {/* Label */}
                  <text x="0" y={yBase + 9} fill={isSelected ? '#22c55e' : '#8b949e'} fontSize="7" fontWeight="600" fontFamily="Arial, sans-serif">{item.label}</text>
                  {/* Selected indicator */}
                  {isSelected && (
                    <text x="44" y={yBase + 9} fill="#22c55e" fontSize="5" fontFamily="Arial, sans-serif">●</text>
                  )}
                  {/* Background bar */}
                  <rect x="50" y={yBase + 1} width="155" height="10" rx="2" fill="#21262d" />
                  {/* Filled bar */}
                  <rect x="50" y={yBase + 1} width={barWidth} height="10" rx="2" fill={item.color} fillOpacity={isSelected ? 0.8 : 0.55} />
                  {/* Percentage text */}
                  <text x="210" y={yBase + 10} fill={isSelected ? '#22c55e' : '#c9d1d9'} fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{item.value}%</text>
                  {/* Mini rank badge */}
                  <rect x={barWidth + 52} y={yBase + 2} width="16" height="8" rx="2" fill={item.color} fillOpacity="0.15" />
                  <text x={barWidth + 60} y={yBase + 9} textAnchor="middle" fill={item.color} fontSize="5" fontWeight="600" fontFamily="Arial, sans-serif">
                    {idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Collar style */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-2">Collar Style</div>
          <div className="flex gap-1.5">
            {COLLAR_STYLES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCollar(c)}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${
                  selectedCollar === c
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#484f58]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ─── SVG 9: Collar Style Ratings ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-[#8b949e]">Collar Style Ratings</div>
            <div className="text-[7px] text-[#484f58]">Expert Reviews</div>
          </div>
          <svg viewBox="0 0 240 80" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {collarRatingData.map((item, idx) => {
              const yBase = 4 + idx * 18;
              const barWidth = Math.max(1, (item.value / 100) * 155);
              const isSelected = COLLAR_STYLES[idx] === selectedCollar;
              const ratingLabel = item.value >= 80 ? 'Excellent' : item.value >= 60 ? 'Good' : 'Fair';
              const ratingColor = item.value >= 80 ? '#22c55e' : item.value >= 60 ? '#eab308' : '#ef4444';
              return (
                <g key={item.label}>
                  {/* Label */}
                  <text x="0" y={yBase + 8} fill={isSelected ? '#22c55e' : '#8b949e'} fontSize="7" fontWeight="600" fontFamily="Arial, sans-serif">{item.label}</text>
                  {/* Selected indicator */}
                  {isSelected && (
                    <text x="42" y={yBase + 8} fill="#22c55e" fontSize="5" fontFamily="Arial, sans-serif">●</text>
                  )}
                  {/* Background bar */}
                  <rect x="50" y={yBase + 1} width="155" height="8" rx="2" fill="#21262d" />
                  {/* Filled bar */}
                  <rect x="50" y={yBase + 1} width={barWidth} height="8" rx="2" fill={item.color} fillOpacity={isSelected ? 0.8 : 0.55} />
                  {/* Score text */}
                  <text x="210" y={yBase + 9} fill={isSelected ? '#22c55e' : '#c9d1d9'} fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{item.value}</text>
                  {/* Rating label */}
                  <text x={210 + (item.value >= 100 ? 14 : 10)} y={yBase + 9} fill={ratingColor} fontSize="5" fontWeight="600" fontFamily="Arial, sans-serif">{ratingLabel}</text>
                  {/* Star indicators */}
                  {[0, 1, 2, 3, 4].map((starIdx) => (
                    <g key={starIdx}>
                      <circle cx={230 + starIdx * 3} cy={yBase + 5} r="0.8" fill={starIdx < Math.round(item.value / 20) ? '#fbbf24' : '#21262d'} />
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Apply Design button */}
        <Button
          onClick={() => {
            setToast('Design applied to your kit!');
            setTimeout(() => setToast(null), 2500);
          }}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg transition-colors"
        >
          <Check className="h-3 w-3 mr-1.5" />
          Apply Design
        </Button>
      </motion.div>

      {/* ─── Kit Collection Gallery ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Collection Gallery</h3>
          <span className="text-[10px] text-[#484f58]">Famous Kits</span>
        </div>

        {/* ─── SVG 5: Kit Collection Progress Ring ─── */}
        <div className="flex items-center gap-3 bg-[#0d1117] rounded-lg p-2.5">
          <svg viewBox="0 0 56 56" style={{ width: 56, height: 56 }} xmlns="http://www.w3.org/2000/svg">
            {/* Decorative outer dots */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const dx = 28 + 26 * Math.cos(rad);
              const dy = 28 + 26 * Math.sin(rad);
              return <circle key={i} cx={dx} cy={dy} r="0.6" fill="#30363d" />;
            })}
            {/* Background ring */}
            <circle cx="28" cy="28" r="22" fill="none" stroke="#21262d" strokeWidth="4" />
            {/* Progress ring */}
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeDasharray={`${(kitHistory.length / 12) * 138.2} 138.2`}
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            {/* Progress endpoint dot */}
            {(() => {
              const progress = kitHistory.length / 12;
              const angle = (progress * 360 - 90) * Math.PI / 180;
              const dx = 28 + 22 * Math.cos(angle);
              const dy = 28 + 22 * Math.sin(angle);
              return <circle key="endpoint" cx={dx} cy={dy} r="2" fill="#22c55e" stroke="#0d1117" strokeWidth="0.5" />;
            })()}
            {/* Center text */}
            <text x="28" y="26" textAnchor="middle" fill="#c9d1d9" fontSize="10" fontWeight="800" fontFamily="Arial, sans-serif">
              {kitHistory.length}
            </text>
            <text x="28" y="35" textAnchor="middle" fill="#484f58" fontSize="6" fontFamily="Arial, sans-serif">
              / 12
            </text>
          </svg>
          <div>
            <div className="text-[10px] font-bold text-[#c9d1d9]">Collection Progress</div>
            <div className="text-[8px] text-[#8b949e]">{Math.round((kitHistory.length / 12) * 100)}% of famous kits discovered</div>
          </div>
        </div>

        {/* Horizontal scrollable gallery */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {FAMOUS_KITS.map((kit) => (
            <div
              key={kit.club}
              className="flex-shrink-0 w-36 bg-[#21262d] rounded-lg border border-[#30363d] p-2.5 space-y-2"
            >
              {/* Mini jersey preview */}
              <div className="w-full h-20 bg-[#0d1117] rounded flex items-center justify-center p-1">
                <MiniJerseySVG primary={kit.primary} secondary={kit.secondary} pattern={kit.pattern} />
              </div>

              {/* Club info */}
              <div>
                <div className="text-[11px] font-bold text-[#c9d1d9] leading-tight">{kit.club}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-[#8b949e]">{kit.league}</span>
                  <span className="text-[9px] text-[#484f58]">·</span>
                  <span className="text-[9px] text-[#484f58]">{kit.year}</span>
                </div>
              </div>

              {/* Color scheme dots */}
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm border border-[#484f58]" style={{ backgroundColor: kit.primary }} />
                <div className="w-3 h-3 rounded-sm border border-[#484f58]" style={{ backgroundColor: kit.secondary }} />
              </div>

              {/* Get Inspired button */}
              <button
                onClick={() => {
                  setPrimaryColor(kit.primary);
                  setSecondaryColor(kit.secondary);
                  setToast(`Inspired by ${kit.club} ${kit.year} kit!`);
                  setTimeout(() => setToast(null), 2500);
                }}
                className="w-full py-1 rounded text-[9px] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
              >
                <Copy className="h-2.5 w-2.5 inline mr-1" />
                Get Inspired
              </button>
            </div>
          ))}
        </div>

        {/* ─── SVG 6: Famous Kit Comparison Matrix ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-[#8b949e]">Kit Attribute Matrix</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-[6px] text-[#484f58]">High</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#eab308' }} />
                <span className="text-[6px] text-[#484f58]">Mid</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-[6px] text-[#484f58]">Low</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 240 100" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {/* Grid lines */}
            <line x1="80" y1="4" x2="80" y2="94" stroke="#21262d" strokeWidth="0.5" />
            <line x1="140" y1="4" x2="140" y2="94" stroke="#21262d" strokeWidth="0.5" />
            <line x1="200" y1="4" x2="200" y2="94" stroke="#21262d" strokeWidth="0.5" />
            {/* Column headers */}
            <text x="90" y="10" textAnchor="middle" fill="#c9d1d9" fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif">Home</text>
            <text x="150" y="10" textAnchor="middle" fill="#c9d1d9" fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif">Away</text>
            <text x="210" y="10" textAnchor="middle" fill="#c9d1d9" fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif">GK</text>
            {/* Row headers and cells */}
            {[
              { label: 'Classic', cells: [{ v: 85, c: '#22c55e' }, { v: 72, c: '#3b82f6' }, { v: 40, c: '#eab308' }] },
              { label: 'Modern', cells: [{ v: 65, c: '#eab308' }, { v: 88, c: '#22c55e' }, { v: 55, c: '#eab308' }] },
              { label: 'Retro', cells: [{ v: 92, c: '#22c55e' }, { v: 60, c: '#eab308' }, { v: 78, c: '#22c55e' }] },
              { label: 'Special', cells: [{ v: 45, c: '#eab308' }, { v: 38, c: '#ef4444' }, { v: 30, c: '#ef4444' }] },
            ].map((row, ri) => {
              const yBase = 16 + ri * 20;
              return (
                <g key={row.label}>
                  <text x="4" y={yBase + 10} fill="#c9d1d9" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{row.label}</text>
                  {row.cells.map((cell, ci) => {
                    const cx = 82 + ci * 60;
                    const barW = Math.max(1, (cell.v / 100) * 50);
                    return (
                      <g key={ci}>
                        <rect x={cx} y={yBase} width="50" height="16" rx="3" fill="#21262d" />
                        <rect x={cx} y={yBase} width={barW} height="16" rx="3" fill={cell.c} fillOpacity="0.25" />
                        {/* Score number */}
                        <text x={cx + 25} y={yBase + 10} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{cell.v}</text>
                        {/* Mini bar indicator */}
                        <rect x={cx + 2} y={yBase + 13} width={barW - 4} height="1.5" rx="0.5" fill={cell.c} fillOpacity="0.5" />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* ─── Kit Statistics & History ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.45 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Statistics & History</h3>
        </div>

        {/* Lucky Kit indicator */}
        {luckyKit && (
          <div className="flex items-center gap-2 bg-[#21262d] rounded-lg p-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d1117] flex items-center justify-center">
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                Lucky Kit
                <span className="text-[8px] text-[#484f58] font-normal">
                  {Math.round((luckyKit.wins / luckyKit.matches) * 100)}% win rate
                </span>
              </div>
              <div className="text-[9px] text-[#8b949e] truncate">
                Season {luckyKit.season} — {luckyKit.club}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm border border-[#484f58]" style={{ backgroundColor: luckyKit.primary }} />
              <div className="w-4 h-4 rounded-sm border border-[#484f58]" style={{ backgroundColor: luckyKit.secondary }} />
            </div>
          </div>
        )}

        {/* ─── SVG 3: Kit Win Rate Comparison ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-[#8b949e]">Win Rate by Kit Season</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: '#fbbf24' }} />
              <span className="text-[6px] text-[#484f58]">Lucky</span>
            </div>
          </div>
          {/* Average win rate summary */}
          {(() => {
            const avgWR = kitHistory.length > 0
              ? Math.round(kitHistory.reduce((sum, k) => sum + (k.wins / k.matches) * 100, 0) / kitHistory.length)
              : 0;
            const totalWins = kitHistory.reduce((sum, k) => sum + k.wins, 0);
            const totalMatches = kitHistory.reduce((sum, k) => sum + k.matches, 0);
            return (
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] text-[#484f58]">Career WR:</span>
                  <span className="text-[8px] font-bold text-[#c9d1d9]">{avgWR}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] text-[#484f58]">Record:</span>
                  <span className="text-[8px] font-mono text-emerald-400">{totalWins}W</span>
                  <span className="text-[8px] font-mono text-[#484f58]">/</span>
                  <span className="text-[8px] font-mono text-[#8b949e]">{totalMatches}M</span>
                </div>
              </div>
            );
          })()}
          <svg viewBox="0 0 240 96" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {/* Average line */}
            {(() => {
              const avgWR = kitHistory.length > 0
                ? Math.round(kitHistory.reduce((sum, k) => sum + (k.wins / k.matches) * 100, 0) / kitHistory.length)
                : 0;
              const avgX = 22 + (avgWR / 100) * 155;
              return (
                <line x1={avgX} y1="2" x2={avgX} y2={90} stroke="#8b949e" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
              );
            })()}
            {kitHistory.map((kit, i) => {
              const winRate = Math.round((kit.wins / kit.matches) * 100);
              const y = 4 + i * 17;
              const barWidth = Math.max(1, (winRate / 100) * 155);
              const isLucky = luckyKit?.season === kit.season && luckyKit?.club === kit.club;
              return (
                <g key={kit.season + '-' + kit.club}>
                  {/* Season label */}
                  <text x="0" y={y + 8} fill={isLucky ? '#fbbf24' : '#8b949e'} fontSize="6" fontWeight="600" fontFamily="Arial, sans-serif">
                    S{kit.season}
                  </text>
                  {/* Background bar */}
                  <rect x="22" y={y} width="155" height="11" rx="2" fill="#21262d" />
                  {/* Filled bar */}
                  <rect x="22" y={y} width={barWidth} height="11" rx="2" fill={isLucky ? '#fbbf24' : '#22c55e'} fillOpacity={isLucky ? 0.8 : 0.55} />
                  {/* Club name inside bar */}
                  <text x="24" y={y + 8} fill="#ffffff" fontSize="4" fontWeight="600" fontFamily="Arial, sans-serif" opacity="0.5">
                    {kit.club.length > 12 ? kit.club.slice(0, 12) : kit.club}
                  </text>
                  {/* Win rate percentage */}
                  <text x="182" y={y + 8} fill={isLucky ? '#fbbf24' : '#c9d1d9'} fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif">
                    {winRate}%
                  </text>
                  {/* Win/Match record */}
                  <text x="205" y={y + 8} fill="#484f58" fontSize="5" fontFamily="Arial, sans-serif">
                    {kit.wins}W/{kit.matches}M
                  </text>
                  {/* Lucky indicator */}
                  {isLucky && (
                    <text x="235" y={y + 8} fill="#fbbf24" fontSize="5" fontFamily="Arial, sans-serif">★</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Kit history timeline (horizontal scroll) */}
        <div>
          <div className="text-[10px] text-[#8b949e] font-medium mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Career Kit Timeline
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {kitHistory.map((kit, idx) => (
              <div key={idx} className="flex-shrink-0 flex flex-col items-center gap-1">
                {/* Connector line */}
                <div className="flex items-center gap-0.5 w-full">
                  {idx < kitHistory.length - 1 && (
                    <div className="w-full h-px bg-[#30363d]" />
                  )}
                </div>
                {/* Kit card */}
                <div
                  className={`w-16 rounded-lg border p-1.5 text-center ${
                    luckyKit?.season === kit.season && luckyKit?.club === kit.club
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-[#30363d] bg-[#21262d]'
                  }`}
                >
                  <div className="w-full h-10 rounded bg-[#0d1117] flex items-center justify-center mb-1">
                    <MiniJerseySVG primary={kit.primary} secondary={kit.secondary} pattern="none" />
                  </div>
                  <div className="text-[8px] font-bold text-[#c9d1d9]">{kit.club.length > 10 ? kit.club.slice(0, 10) + '…' : kit.club}</div>
                  <div className="text-[7px] text-[#484f58]">S{kit.season}</div>
                  <div className="text-[7px] text-emerald-400 font-mono mt-0.5">{kit.wins}W</div>
                </div>
                {/* Dot */}
                <div className={`w-2 h-2 rounded-sm ${
                  luckyKit?.season === kit.season && luckyKit?.club === kit.club
                    ? 'bg-amber-400'
                    : 'bg-[#30363d]'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* ─── SVG 10: Career Kit Evolution Timeline ─── */}
        <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-[#8b949e]">Career Kit Evolution</div>
            <div className="text-[7px] text-[#484f58]">{kitHistory.length} kits worn</div>
          </div>
          <svg viewBox="0 0 240 88" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
            {/* Base timeline line */}
            <line x1="20" y1="58" x2="220" y2="58" stroke="#30363d" strokeWidth="2" strokeLinecap="round" />
            {/* Arrow at end */}
            <polygon points="222,58 216,55 216,61" fill="#30363d" />
            {kitHistory.map((kit, i) => {
              const x = kitHistory.length === 1 ? 120 : 20 + (i / (kitHistory.length - 1)) * 200;
              const isLucky = luckyKit?.season === kit.season && luckyKit?.club === kit.club;
              const winRate = Math.round((kit.wins / kit.matches) * 100);
              return (
                <g key={kit.season + '-evo-' + i}>
                  {/* Vertical connector */}
                  <line x1={x} y1="40" x2={x} y2="54" stroke={isLucky ? '#fbbf24' : '#484f58'} strokeWidth="1" />
                  {/* Jersey card background */}
                  <rect x={x - 11} y="4" width="22" height="32" rx="3" fill={kit.primary} fillOpacity="0.12" stroke={kit.primary} strokeWidth="0.5" strokeOpacity="0.4" />
                  {/* Mini jersey body silhouette */}
                  <path d={`${x - 6},10 L${x - 9},16 L${x - 7},17 L${x - 7},30 L${x + 7},30 L${x + 7},17 L${x + 9},16 L${x + 6},10`} fill={kit.primary} fillOpacity="0.5" stroke={kit.secondary} strokeWidth="0.4" strokeOpacity="0.4" />
                  {/* Season number on mini jersey */}
                  <text x={x} y="24" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="800" fontFamily="Arial, sans-serif" opacity="0.8">
                    {String(kit.season).slice(-1)}
                  </text>
                  {/* Secondary color accent line on jersey */}
                  <line x1={x - 7} y1="11" x2={x + 7} y2="11" stroke={kit.secondary} strokeWidth="0.5" opacity="0.4" />
                  {/* Dot on timeline */}
                  <circle cx={x} cy="58" r={isLucky ? 4 : 3} fill={isLucky ? '#fbbf24' : kit.primary} stroke="#0d1117" strokeWidth="1" />
                  {/* Lucky indicator star */}
                  {isLucky && (
                    <text x={x} y="40" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="Arial, sans-serif">★</text>
                  )}
                  {/* Season label */}
                  <text x={x} y="70" textAnchor="middle" fill={isLucky ? '#fbbf24' : '#c9d1d9'} fontSize="5" fontWeight="600" fontFamily="Arial, sans-serif">
                    S{kit.season}
                  </text>
                  {/* Win rate label */}
                  <text x={x} y="78" textAnchor="middle" fill={winRate >= 60 ? '#22c55e' : '#484f58'} fontSize="4" fontFamily="Arial, sans-serif">
                    {winRate}%WR
                  </text>
                  {/* Club name (abbreviated) */}
                  <text x={x} y="85" textAnchor="middle" fill="#30363d" fontSize="3.5" fontFamily="Arial, sans-serif">
                    {kit.club.length > 8 ? kit.club.slice(0, 8) : kit.club}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Total kits collected progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8b949e] font-medium">Kits Collected</span>
            <span className="text-[10px] font-mono text-emerald-400">{kitHistory.length}/12</span>
          </div>
          <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(kitHistory.length / 12) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* ─── Third Kit / Special Edition Section ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.5 }}
        className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Special Edition Kits</h3>
          </div>
          <span className="text-[10px] font-bold text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded">
            {SPECIAL_EDITION_KITS.filter((k) => k.unlocked).length}/{SPECIAL_EDITION_KITS.length} Unlocked
          </span>
        </div>

        {/* Special kit cards */}
        <div className="grid grid-cols-2 gap-2">
          {SPECIAL_EDITION_KITS.map((kit) => (
            <div
              key={kit.id}
              className={`rounded-lg border p-2.5 space-y-2 relative ${
                kit.unlocked
                  ? 'border-[#30363d] bg-[#21262d]'
                  : 'border-[#21262d] bg-[#0d1117] opacity-60'
              }`}
            >
              {/* Rarity badge */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: (RARITY_COLORS[kit.rarity] ?? '#8b949e') + '18',
                    color: RARITY_COLORS[kit.rarity] ?? '#8b949e',
                  }}
                >
                  <Crown className="h-2.5 w-2.5 inline mr-0.5" />
                  {kit.rarity}
                </span>
                {!kit.unlocked && <Lock className="h-3 w-3 text-[#484f58]" />}
              </div>

              {/* Mini jersey preview */}
              <div className="w-full h-16 bg-[#0d1117] rounded flex items-center justify-center p-1">
                <MiniJerseySVG primary={kit.primary} secondary={kit.secondary} pattern="stars" />
              </div>

              {/* Kit name */}
              <div className="text-[10px] font-bold text-[#c9d1d9] leading-tight">{kit.name}</div>

              {/* Color scheme */}
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm border border-[#484f58]" style={{ backgroundColor: kit.primary }} />
                <div className="w-3 h-3 rounded-sm border border-[#484f58]" style={{ backgroundColor: kit.secondary }} />
              </div>

              {/* Preview / Locked button */}
              {kit.unlocked ? (
                <button
                  onClick={() => {
                    setPreviewSpecialKit(kit.id);
                    setSelectedPattern('none');
                    setToast(`Previewing ${kit.name} kit!`);
                    setTimeout(() => setToast(null), 2500);
                  }}
                  className={`w-full py-1 rounded text-[9px] font-bold transition-colors ${
                    previewSpecialKit === kit.id
                      ? 'text-emerald-400 border border-emerald-500 bg-emerald-500/10'
                      : 'text-[#8b949e] border border-[#30363d] bg-[#21262d] hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                >
                  <Eye className="h-2.5 w-2.5 inline mr-1" />
                  Preview
                </button>
              ) : (
                <div className="w-full py-1 rounded text-[9px] font-bold text-[#484f58] border border-[#21262d] bg-[#0d1117] text-center">
                  <Lock className="h-2.5 w-2.5 inline mr-1" />
                  Locked
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Collection progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8b949e] font-medium">Special Kits Collection</span>
            <span className="text-[10px] font-mono text-[#8b949e]">
              {SPECIAL_EDITION_KITS.filter((k) => k.unlocked).length}/12
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#a855f7' }}
              initial={{ width: 0 }}
              animate={{ width: `${(SPECIAL_EDITION_KITS.filter((k) => k.unlocked).length / 12) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[8px] text-[#484f58] mt-1 text-center">
            Win special matches to unlock more kits
          </div>
        </div>
      </motion.div>

      {/* ─── Number History ─── */}
      {numberHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.25 }}
          className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Number History</h3>
          </div>
          <div className="space-y-2">
            {numberHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0d1117] flex items-center justify-center">
                    <span className="text-sm font-black text-emerald-400">{entry.number}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#c9d1d9]">Season {entry.season}</div>
                    <div className="text-[10px] text-[#8b949e]">{entry.club}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-[#c9d1d9]">{entry.games}</div>
                  <div className="text-[10px] text-[#484f58]">games</div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── SVG 1: Jersey Number History Timeline ─── */}
          <div className="bg-[#0d1117] rounded-lg p-2.5 space-y-1.5">
            <div className="text-[9px] font-bold text-[#8b949e] mb-1">Number Changes Timeline</div>
            <svg viewBox="0 0 240 72" style={{ width: '100%', maxWidth: 280 }} xmlns="http://www.w3.org/2000/svg">
              {/* Timeline base line */}
              <line x1="24" y1="34" x2="216" y2="34" stroke="#30363d" strokeWidth="2" strokeLinecap="round" />
              {/* Current season marker arrow */}
              <polygon points="220,34 214,31 214,37" fill="#30363d" />
              {numberHistory.map((entry, i) => {
                const total = numberHistory.length;
                const x = total === 1 ? 120 : 24 + (i / (total - 1)) * 192;
                const isCurrent = entry.number === selectedNumber;
                return (
                  <g key={entry.season + '-tl-' + i}>
                    {/* Connector to dot */}
                    <line x1={x} y1="18" x2={x} y2="30" stroke={isCurrent ? '#22c55e' : '#484f58'} strokeWidth="1" />
                    {/* Number badge background */}
                    <rect x={x - 12} y="2" width="24" height="16" rx="3" fill={isCurrent ? '#22c55e' : '#21262d'} fillOpacity={isCurrent ? 0.2 : 1} stroke={isCurrent ? '#22c55e' : '#30363d'} strokeWidth="0.5" />
                    {/* Number value */}
                    <text x={x} y="13" textAnchor="middle" fill={isCurrent ? '#22c55e' : '#c9d1d9'} fontSize="8" fontWeight="800" fontFamily="Arial, sans-serif">
                      #{entry.number}
                    </text>
                    {/* Timeline dot */}
                    <circle cx={x} cy="34" r={isCurrent ? 4 : 3} fill={isCurrent ? '#22c55e' : '#484f58'} stroke="#0d1117" strokeWidth="1" />
                    {/* Current indicator */}
                    {isCurrent && (
                      <text x={x} y="18" textAnchor="middle" fill="#22c55e" fontSize="5" fontFamily="Arial, sans-serif">▼</text>
                    )}
                    {/* Season label */}
                    <text x={x} y="47" textAnchor="middle" fill={isCurrent ? '#22c55e' : '#8b949e'} fontSize="5" fontWeight="600" fontFamily="Arial, sans-serif">
                      Season {entry.season}
                    </text>
                    {/* Games and club label */}
                    <text x={x} y="55" textAnchor="middle" fill="#484f58" fontSize="4" fontFamily="Arial, sans-serif">
                      {entry.games} games
                    </text>
                    <text x={x} y="63" textAnchor="middle" fill="#30363d" fontSize="3.5" fontFamily="Arial, sans-serif">
                      {entry.club.length > 12 ? entry.club.slice(0, 12) + '…' : entry.club}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </motion.div>
      )}

      {/* ─── Confirm Button ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      >
        <Button
          onClick={handleConfirm}
          disabled={isRetired}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm Selection — #{currentNumber}
        </Button>
      </motion.div>

      {/* ─── Toast Notification ─── */}
      {toast && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-emerald-400">{toast}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
