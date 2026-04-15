'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt, Check, X, Star, Users, ArrowLeft,
  History, Trophy, Zap, Shield, AlertCircle,
  ChevronDown, ChevronUp, BarChart3, TrendingUp,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface JerseyNumberEntry {
  number: number;
  status: 'available' | 'taken' | 'yours' | 'retired';
  wearerName?: string;
  wearerPosition?: string;
}

interface NumberHistoryEntry {
  clubName: string;
  clubLogo: string;
  number: number;
  seasonStart: number;
  seasonEnd: number;
  appearances: number;
  goals: number;
  assists: number;
}

interface LegendaryNumber {
  number: number;
  players: string[];
  description: string;
  icon: 'star' | 'crown' | 'target' | 'shield' | 'gem' | 'flame';
  position: string;
}

interface NumberStats {
  number: number;
  appearances: number;
  goals: number;
  assists: number;
  winRate: number;
}

// ============================================================
// Constants
// ============================================================
const TOTAL_NUMBERS = 28;
const GRID_COLS = 4;

const LEGENDARY_NUMBERS: LegendaryNumber[] = [
  {
    number: 7,
    players: ['Cristiano Ronaldo', 'David Beckham', 'George Best'],
    description: 'The winger\'s stage — speed, skill, and showmanship.',
    icon: 'star',
    position: 'RW / LW',
  },
  {
    number: 10,
    players: ['Lionel Messi', 'Diego Maradona', 'Pelé'],
    description: 'The playmaker and talisman — the heartbeat of every team.',
    icon: 'crown',
    position: 'CAM / CF',
  },
  {
    number: 9,
    players: ['Ronaldo Nazário', 'Marco van Basten', 'Luis Suárez'],
    description: 'The ultimate striker\'s number — pure finishing instinct.',
    icon: 'target',
    position: 'ST',
  },
  {
    number: 14,
    players: ['Johan Cruyff', 'Thierry Henry'],
    description: 'The innovators — total football and limitless potential.',
    icon: 'flame',
    position: 'CF / LW',
  },
  {
    number: 1,
    players: ['Gianluigi Buffon', 'Manuel Neuer', 'Iker Casillas'],
    description: 'The guardian — last line of defense and shot-stopper.',
    icon: 'shield',
    position: 'GK',
  },
  {
    number: 21,
    players: ['Andrea Pirlo', 'Zinedine Zidane'],
    description: 'Elegant midfielders who orchestrate the game.',
    icon: 'gem',
    position: 'CM / CAM',
  },
];

const POSITION_TRADITIONS: Record<number, string> = {
  1: 'Goalkeeper',
  2: 'Right-Back',
  3: 'Left-Back',
  4: 'Centre-Back',
  5: 'Centre-Back / Sweeper',
  6: 'Defensive Midfield',
  7: 'Right Wing',
  8: 'Central Midfield',
  9: 'Striker',
  10: 'Attacking Midfield',
  11: 'Left Wing',
  14: 'Forward / Midfield',
  21: 'Midfield',
};

const MOCK_TEAMMATES: { name: string; number: number; position: string }[] = [
  { name: 'Marcus Oliveira', number: 1, position: 'GK' },
  { name: 'James Wilson', number: 4, position: 'CB' },
  { name: 'Carlos Mendez', number: 7, position: 'RW' },
  { name: 'Kenji Tanaka', number: 8, position: 'CM' },
  { name: 'Liam O\'Brien', number: 10, position: 'CAM' },
  { name: 'Yusuf Amrani', number: 11, position: 'LW' },
  { name: 'Dmitri Volkov', number: 14, position: 'CM' },
  { name: 'Ahmed Hassan', number: 17, position: 'LB' },
  { name: 'Rafa Santos', number: 21, position: 'CF' },
];

// ============================================================
// Seeded hash for deterministic data
// ============================================================
function seedHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ============================================================
// Jersey Silhouette SVG (back view)
// ============================================================
function JerseySilhouette({
  primaryColor,
  number,
  playerName,
}: {
  primaryColor: string;
  number: number;
  playerName: string;
}) {
  return (
    <svg viewBox="0 0 120 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Shirt body */}
      <path
        d="M30,22 L12,40 L24,48 L24,145 L96,145 L96,48 L108,40 L90,22 L78,32 Q70,38 60,38 Q50,38 42,32 Z"
        fill={primaryColor}
        stroke="#2a2a2a"
        strokeWidth="2"
      />
      {/* Collar */}
      <path
        d="M42,22 Q48,30 60,30 Q72,30 78,22"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Sleeve left */}
      <path d="M24,42 L24,68 L38,68 L38,48 Z" fill="#ffffff" opacity="0.25" />
      {/* Sleeve right */}
      <path d="M96,42 L96,68 L82,68 L82,48 Z" fill="#ffffff" opacity="0.25" />
      {/* Name on back */}
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
      >
        {playerName.toUpperCase()}
      </text>
      {/* Number on back */}
      <text
        x="60"
        y="115"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="48"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        stroke="#000000"
        strokeWidth="1"
        paintOrder="stroke"
      >
        {number}
      </text>
      {/* Bottom trim */}
      <rect x="24" y="140" width="72" height="5" fill="#ffffff" opacity="0.2" rx="1" />
    </svg>
  );
}

// ============================================================
// Legend Icon SVG
// ============================================================
function LegendIcon({ type, color }: { type: LegendaryNumber['icon']; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    star: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    crown: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      </svg>
    ),
    gem: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
        <path d="M6 2l-4 6 10 14L22 8l-4-6H6zm0 2h12l2.5 4H3.5L6 4z" />
      </svg>
    ),
    flame: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
        <path d="M12 2c-1.5 4-5 6-5 10a5 5 0 0010 0c0-4-3.5-6-5-10z" />
      </svg>
    ),
  };
  return icons[type] || icons.star;
}

// ============================================================
// Number Request Dialog
// ============================================================
function RequestDialog({
  number,
  wearerName,
  successProbability,
  onConfirm,
  onCancel,
  isOpen,
}: {
  number: number;
  wearerName: string;
  successProbability: number;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      const roll = seededRandom(Date.now()) * 100;
      const succeeded = roll < successProbability;
      setIsSuccess(succeeded);
      setIsProcessing(false);
    }, 1500);
  }, [successProbability]);

  const handleClose = useCallback(() => {
    if (isSuccess) {
      onConfirm();
    } else {
      onCancel();
    }
    setIsProcessing(false);
    setIsSuccess(false);
  }, [isSuccess, onConfirm, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4"
          >
            {!isSuccess ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#c9d1d9]">Request Number #{number}</h3>
                    <p className="text-xs text-[#8b949e]">
                      Currently worn by <span className="text-amber-400 font-semibold">{wearerName}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b949e]">Success Probability</span>
                    <span className={`font-bold ${successProbability >= 60 ? 'text-emerald-400' : successProbability >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                      {successProbability}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0d1117] rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{
                        backgroundColor: successProbability >= 60 ? '#34d399' : successProbability >= 30 ? '#fbbf24' : '#f87171',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${successProbability}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className="text-[10px] text-[#484f58]">
                    Based on your seniority, reputation, and squad status
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-lg border border-[#30363d] text-xs font-bold text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Requesting...
                      </span>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-3 py-2"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">Request Approved!</h3>
                  <p className="text-xs text-[#8b949e] mt-1">
                    You will wear #{number} starting next match.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Toast Notification
// ============================================================
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
    >
      <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-sm font-bold text-emerald-400 flex-1">{message}</span>
        <button onClick={onClose} className="text-emerald-400/60 hover:text-emerald-400 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function JerseyNumber() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const [selectedNumber, setSelectedNumber] = useState(9);
  const [playerNumber, setPlayerNumber] = useState(9);
  const [requestDialog, setRequestDialog] = useState<{
    open: boolean;
    number: number;
    wearer: string;
  }>({ open: false, number: 0, wearer: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    grid: true,
    preview: true,
    legends: true,
    history: false,
    stats: false,
  });

  // ── Generate jersey number entries ──
  const jerseyEntries = useMemo<JerseyNumberEntry[]>(() => {
    if (!gameState) return [];
    const entries: JerseyNumberEntry[] = [];
    const takenMap = new Map<number, { name: string; position: string }>();
    MOCK_TEAMMATES.forEach(t => {
      takenMap.set(t.number, { name: t.name, position: t.position });
    });

    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (i === playerNumber) {
        entries.push({ number: i, status: 'yours' });
      } else if (takenMap.has(i)) {
        const wearer = takenMap.get(i)!;
        entries.push({
          number: i,
          status: 'taken',
          wearerName: wearer.name,
          wearerPosition: wearer.position,
        });
      } else {
        entries.push({ number: i, status: 'available' });
      }
    }
    return entries;
  }, [gameState, playerNumber]);

  // ── Generate number history timeline ──
  const numberHistory = useMemo<NumberHistoryEntry[]>(() => {
    if (!gameState) return [];
    const history: NumberHistoryEntry[] = [];
    const season = gameState.currentSeason;
    const clubName = gameState.currentClub.name;
    const clubLogo = gameState.currentClub.logo;

    if (season >= 3) {
      history.push({
        clubName: `${clubName} Youth`,
        clubLogo,
        number: (seedHash(clubName) % 20) + 20,
        seasonStart: 1,
        seasonEnd: 1,
        appearances: 8 + (seedHash(clubName + 'h1') % 12),
        goals: seedHash(clubName + 'h1g') % 3,
        assists: seedHash(clubName + 'h1a') % 2,
      });
      history.push({
        clubName,
        clubLogo,
        number: (seedHash(clubName + 'h2') % 15) + 1,
        seasonStart: 2,
        seasonEnd: 2,
        appearances: 14 + (seedHash(clubName + 'h2a') % 10),
        goals: 2 + (seedHash(clubName + 'h2g') % 6),
        assists: 1 + (seedHash(clubName + 'h2as') % 4),
      });
      history.push({
        clubName,
        clubLogo,
        number: playerNumber,
        seasonStart: 3,
        seasonEnd: season,
        appearances: gameState.player.careerStats.totalAppearances,
        goals: gameState.player.careerStats.totalGoals,
        assists: gameState.player.careerStats.totalAssists,
      });
    } else if (season >= 2) {
      history.push({
        clubName: `${clubName} Youth`,
        clubLogo,
        number: (seedHash(clubName) % 20) + 20,
        seasonStart: 1,
        seasonEnd: 1,
        appearances: 6 + (seedHash(clubName + 'h1') % 10),
        goals: seedHash(clubName + 'h1g') % 2,
        assists: seedHash(clubName + 'h1a') % 2,
      });
      history.push({
        clubName,
        clubLogo,
        number: playerNumber,
        seasonStart: 2,
        seasonEnd: season,
        appearances: gameState.player.careerStats.totalAppearances,
        goals: gameState.player.careerStats.totalGoals,
        assists: gameState.player.careerStats.totalAssists,
      });
    } else {
      history.push({
        clubName: `${clubName} Youth`,
        clubLogo,
        number: playerNumber,
        seasonStart: 1,
        seasonEnd: season,
        appearances: gameState.player.careerStats.totalAppearances,
        goals: gameState.player.careerStats.totalGoals,
        assists: gameState.player.careerStats.totalAssists,
      });
    }

    return history;
  }, [gameState, playerNumber]);

  // ── Generate jersey number stats ──
  const numberStats = useMemo<NumberStats[]>(() => {
    if (!gameState) return [];
    return numberHistory.map(entry => {
      const totalApps = entry.appearances || 1;
      const winRate = Math.round(35 + seededRandom(seedHash(entry.clubName + entry.number)) * 40);
      return {
        number: entry.number,
        appearances: entry.appearances,
        goals: entry.goals,
        assists: entry.assists,
        winRate,
      };
    });
  }, [gameState, numberHistory]);

  // ── Calculate success probability for number request ──
  const getRequestProbability = useCallback(() => {
    if (!gameState) return 10;
    const { player } = gameState;
    let prob = 20;
    if (player.reputation >= 80) prob += 30;
    else if (player.reputation >= 50) prob += 15;
    else if (player.reputation >= 30) prob += 5;
    if (player.overall >= 85) prob += 20;
    else if (player.overall >= 75) prob += 10;
    if (player.squadStatus === 'starter') prob += 15;
    else if (player.squadStatus === 'rotation') prob += 8;
    if (player.age >= 28) prob += 5;
    if (player.traits.includes('leadership') || player.traits.includes('leader')) prob += 10;
    if (player.traits.includes('fan_favorite') || player.traits.includes('club_legend')) prob += 8;
    return Math.min(95, Math.max(5, prob));
  }, [gameState]);

  // ── Toggle section ──
  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Handle number selection ──
  const handleNumberClick = useCallback((entry: JerseyNumberEntry) => {
    setSelectedNumber(entry.number);
    if (entry.status === 'taken' && entry.wearerName) {
      setRequestDialog({
        open: true,
        number: entry.number,
        wearer: entry.wearerName,
      });
    }
  }, []);

  // ── Handle request confirm ──
  const handleRequestConfirm = useCallback((num: number) => {
    setPlayerNumber(num);
    setToast(`Jersey number changed to #${num}!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Handle select available ──
  const handleSelectAvailable = useCallback(() => {
    const entry = jerseyEntries.find(e => e.number === selectedNumber);
    if (!entry) return;
    if (entry.status === 'available') {
      setPlayerNumber(selectedNumber);
      setToast(`Jersey number changed to #${selectedNumber}!`);
      setTimeout(() => setToast(null), 3000);
    }
  }, [selectedNumber, jerseyEntries]);

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const currentEntry = jerseyEntries.find(e => e.number === selectedNumber);
  const selectedIsAvailable = currentEntry?.status === 'available';
  const selectedIsYours = currentEntry?.status === 'yours';
  const selectedIsTaken = currentEntry?.status === 'taken';
  const positionTradition = POSITION_TRADITIONS[selectedNumber] || 'Any position';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      {/* ─── Header ─── */}
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
            <h2 className="text-lg font-bold text-[#c9d1d9]">Jersey Number</h2>
          </div>
          <p className="text-xs text-[#8b949e]">
            {currentClub.name} — Current: <span className="text-emerald-400 font-bold">#{playerNumber}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-500/15 rounded-lg px-2.5 py-1">
          <span className="text-lg font-black text-amber-400">{playerNumber}</span>
        </div>
      </div>

      {/* ─── Jersey Preview Section ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden"
      >
        <button
          onClick={() => toggleSection('preview')}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Jersey Preview</h3>
          </div>
          {expandedSections.preview ? (
            <ChevronUp className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Jersey silhouette */}
                <div className="w-40 h-52 bg-[#0d1117] rounded-xl p-3 flex items-center justify-center border border-[#21262d]">
                  <JerseySilhouette
                    primaryColor={currentClub.primaryColor}
                    number={selectedNumber}
                    playerName={player.name.split(' ').pop() || player.name}
                  />
                </div>
                {/* Selection details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-[#c9d1d9]">#{selectedNumber}</span>
                    {selectedIsYours && (
                      <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg">
                        Your Number
                      </span>
                    )}
                    {selectedIsTaken && (
                      <span className="text-[10px] font-bold uppercase text-red-400 bg-red-500/15 px-2 py-0.5 rounded-lg">
                        Taken
                      </span>
                    )}
                    {selectedIsAvailable && (
                      <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg">
                        Available
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8b949e]">
                    <span className="text-[#484f58]">Position tradition:</span>{' '}
                    <span className="text-[#c9d1d9] font-medium">{positionTradition}</span>
                  </div>
                  {selectedIsTaken && currentEntry?.wearerName && (
                    <div className="bg-[#21262d] rounded-lg p-3 space-y-1">
                      <div className="text-[10px] text-[#484f58] uppercase font-bold">Current Wearer</div>
                      <div className="text-sm font-bold text-[#c9d1d9]">{currentEntry.wearerName}</div>
                      <div className="text-xs text-[#8b949e]">{currentEntry.wearerPosition}</div>
                    </div>
                  )}
                  {(selectedIsAvailable || selectedIsYours) && (
                    <div className="bg-emerald-500/10 rounded-lg p-3 space-y-1 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">
                          {selectedIsYours ? 'This is your current number' : 'This number is available'}
                        </span>
                      </div>
                      {selectedIsAvailable && (
                        <p className="text-[10px] text-emerald-400/60">
                          Tap to select and confirm below
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm button for available */}
              {selectedIsAvailable && selectedNumber !== playerNumber && (
                <div className="mt-4">
                  <button
                    onClick={handleSelectAvailable}
                    className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 inline mr-1.5" />
                    Select #{selectedNumber}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Jersey Number Grid ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden"
      >
        <button
          onClick={() => toggleSection('grid')}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Number Selection</h3>
            <span className="text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-lg">
              1-{TOTAL_NUMBERS}
            </span>
          </div>
          {expandedSections.grid ? (
            <ChevronUp className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.grid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                  <span className="w-2 h-2 rounded-lg bg-emerald-500 inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                  <span className="w-2 h-2 rounded-lg bg-red-500/60 inline-block" />
                  Taken
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                  <span className="w-2 h-2 rounded-lg bg-amber-400 inline-block" />
                  Yours
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-4 gap-2">
                {jerseyEntries.map(entry => {
                  const isSelected = entry.number === selectedNumber;
                  const borderColor =
                    entry.status === 'yours'
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : entry.status === 'taken'
                        ? 'border-red-500/30 bg-red-500/5'
                        : isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[#30363d] bg-[#21262d]';

                  const textColor =
                    entry.status === 'yours'
                      ? 'text-amber-400'
                      : entry.status === 'taken'
                        ? 'text-[#484f58]'
                        : isSelected
                          ? 'text-emerald-400'
                          : 'text-[#c9d1d9]';

                  return (
                    <motion.button
                      key={entry.number}
                      onClick={() => handleNumberClick(entry)}
                      className={`relative flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-colors ${borderColor} hover:border-emerald-500/40`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className={`text-2xl font-black ${textColor} leading-none`}>
                        {entry.number}
                      </span>
                      {entry.status === 'yours' && (
                        <span className="text-[8px] font-bold uppercase text-amber-400 mt-0.5">
                          Yours
                        </span>
                      )}
                      {entry.status === 'taken' && entry.wearerName && (
                        <span className="text-[7px] text-[#484f58] mt-0.5 truncate max-w-full px-1">
                          {entry.wearerName.split(' ')[0]}
                        </span>
                      )}
                      {entry.status === 'available' && POSITION_TRADITIONS[entry.number] && (
                        <span className="text-[7px] text-[#484f58] mt-0.5">
                          {POSITION_TRADITIONS[entry.number]}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Legendary Numbers ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden"
      >
        <button
          onClick={() => toggleSection('legends')}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Legendary Numbers</h3>
          </div>
          {expandedSections.legends ? (
            <ChevronUp className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.legends && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4 space-y-2"
            >
              {LEGENDARY_NUMBERS.map(legend => {
                const isPlayerNumber = legend.number === playerNumber;
                return (
                  <motion.div
                    key={legend.number}
                    onClick={() => setSelectedNumber(legend.number)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      isPlayerNumber
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#21262d] border-[#21262d] hover:border-amber-500/20'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Icon + Number */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <LegendIcon type={legend.icon} color={isPlayerNumber ? '#fbbf24' : '#8b949e'} />
                      <span className={`text-lg font-black ${isPlayerNumber ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                        #{legend.number}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-[#484f58] uppercase">
                          {legend.position}
                        </span>
                        {isPlayerNumber && (
                          <span className="text-[8px] font-bold uppercase text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-lg">
                            Your Number
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] leading-relaxed mb-1.5">
                        {legend.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {legend.players.map(p => (
                          <span
                            key={p}
                            className="text-[9px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-lg"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Number History Timeline ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden"
      >
        <button
          onClick={() => toggleSection('history')}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Number History</h3>
            <span className="text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-lg">
              {numberHistory.length} {numberHistory.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          {expandedSections.history ? (
            <ChevronUp className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.history && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              {numberHistory.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                  <p className="text-xs text-[#484f58]">No number history yet</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[#30363d]" />

                  {numberHistory.map((entry, idx) => {
                    const isLast = idx === numberHistory.length - 1;
                    const isActive = entry.number === playerNumber;
                    return (
                      <div key={idx} className="relative flex items-start gap-3 py-3">
                        {/* Timeline dot */}
                        <div className={`absolute left-[-16px] top-4 w-2.5 h-2.5 rounded-full border-2 ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-400'
                            : 'bg-[#21262d] border-[#484f58]'
                        }`} />

                        {/* Content card */}
                        <div className={`flex-1 p-3 rounded-xl border ${
                          isActive
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-[#21262d] border-[#21262d]'
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#0d1117] flex items-center justify-center">
                                <span className={`text-sm font-black ${
                                  isActive ? 'text-emerald-400' : 'text-[#8b949e]'
                                }`}>
                                  #{entry.number}
                                </span>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#c9d1d9]">
                                  {entry.clubLogo} {entry.clubName}
                                </div>
                                <div className="text-[10px] text-[#484f58]">
                                  Season {entry.seasonStart}{entry.seasonEnd !== entry.seasonStart ? `–${entry.seasonEnd}` : ''}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <span className="text-[8px] font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-lg shrink-0">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-[#8b949e]">
                              <span className="text-[#c9d1d9] font-bold">{entry.appearances}</span> apps
                            </span>
                            <span className="text-[#8b949e]">
                              <span className="text-emerald-400 font-bold">{entry.goals}</span> goals
                            </span>
                            <span className="text-[#8b949e]">
                              <span className="text-blue-400 font-bold">{entry.assists}</span> assists
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Jersey Number Stats ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden"
      >
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#c9d1d9]">Stats by Number</h3>
          </div>
          {expandedSections.stats ? (
            <ChevronUp className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4"
            >
              {numberStats.length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                  <p className="text-xs text-[#484f58]">Play more matches to see stats</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Summary header */}
                  <div className="flex items-center gap-2 mb-3 text-[10px] text-[#484f58] uppercase font-bold">
                    <span className="flex-1">Number</span>
                    <span className="w-14 text-center">Apps</span>
                    <span className="w-12 text-center">Goals</span>
                    <span className="w-12 text-center">Assists</span>
                    <span className="w-14 text-right">Win %</span>
                  </div>

                  {numberStats.map((stat, idx) => {
                    const isActive = stat.number === playerNumber;
                    return (
                      <motion.div
                        key={idx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl ${
                          isActive ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-[#21262d]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: idx * 0.05 }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-sm font-black ${isActive ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                            #{stat.number}
                          </span>
                          {isActive && (
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                        <span className="w-14 text-center text-xs text-[#c9d1d9] font-mono">
                          {stat.appearances}
                        </span>
                        <span className="w-12 text-center text-xs text-emerald-400 font-mono font-bold">
                          {stat.goals}
                        </span>
                        <span className="w-12 text-center text-xs text-blue-400 font-mono">
                          {stat.assists}
                        </span>
                        <span className={`w-14 text-right text-xs font-mono font-bold ${
                          stat.winRate >= 55 ? 'text-emerald-400' : stat.winRate >= 40 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {stat.winRate}%
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Current Number Summary ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.25 }}
        className="bg-[#161b22] rounded-xl border border-[#30363d] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#c9d1d9]">Career Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#21262d] rounded-xl p-3 text-center">
            <div className="text-lg font-black text-[#c9d1d9]">
              {player.careerStats.totalAppearances}
            </div>
            <div className="text-[10px] text-[#484f58] uppercase font-bold">Appearances</div>
          </div>
          <div className="bg-[#21262d] rounded-xl p-3 text-center">
            <div className="text-lg font-black text-emerald-400">
              {player.careerStats.totalGoals}
            </div>
            <div className="text-[10px] text-[#484f58] uppercase font-bold">Goals</div>
          </div>
          <div className="bg-[#21262d] rounded-xl p-3 text-center">
            <div className="text-lg font-black text-blue-400">
              {player.careerStats.totalAssists}
            </div>
            <div className="text-[10px] text-[#484f58] uppercase font-bold">Assists</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 bg-[#0d1117] rounded-xl p-3">
          <span className="text-[10px] text-[#484f58] uppercase font-bold">Worn Numbers</span>
          <div className="flex gap-1">
            {numberHistory.map((entry, idx) => (
              <span
                key={idx}
                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                  entry.number === playerNumber
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-[#21262d] text-[#8b949e]'
                }`}
              >
                #{entry.number}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Request Number Dialog ─── */}
      <RequestDialog
        number={requestDialog.number}
        wearerName={requestDialog.wearer}
        successProbability={getRequestProbability()}
        onConfirm={() => handleRequestConfirm(requestDialog.number)}
        onCancel={() => setRequestDialog(prev => ({ ...prev, open: false }))}
        isOpen={requestDialog.open}
      />

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
