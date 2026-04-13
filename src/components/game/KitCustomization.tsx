'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute } from '@/lib/game/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shirt, Check, X, Star, Users, Info, ArrowLeft,
  Palette, History, Trophy, Zap,
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
// Main Component
// -----------------------------------------------------------
export default function KitCustomization() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const [selectedNumber, setSelectedNumber] = useState(10);
  const [primaryColor, setPrimaryColor] = useState(gameState?.currentClub.primaryColor ?? '#dc2626');
  const [secondaryColor, setSecondaryColor] = useState(gameState?.currentClub.secondaryColor ?? '#ffffff');
  const [toast, setToast] = useState<string | null>(null);

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
