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

  if (!gameState) return null;

  const { player, currentClub } = gameState;

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
