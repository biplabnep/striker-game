'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Footprints,
  Navigation,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Star,
  Trophy,
  Zap,
  RotateCcw,
  Play,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { PlayerAttributes } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

type ChallengeId = 'free_kick' | 'dribbling' | 'crossing';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface FreeKickZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  points: number;
}

interface CrossingZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  points: number;
}

interface AttemptResult {
  zoneId: string;
  points: number;
  hit: boolean;
  label: string;
}

interface ChallengeResult {
  totalScore: number;
  rating: string;
  attempts: AttemptResult[];
  attributeGain: { attr: keyof PlayerAttributes; value: number };
}

interface BestScores {
  free_kick: number;
  dribbling: number;
  crossing: number;
}

// ============================================================
// Constants
// ============================================================

const RATING_THRESHOLDS = [
  { min: 450, rating: 'S', color: '#f59e0b' },
  { min: 375, rating: 'A', color: '#22c55e' },
  { min: 250, rating: 'B', color: '#3b82f6' },
  { min: 125, rating: 'C', color: '#a855f7' },
  { min: 0, rating: 'D', color: '#ef4444' },
];

const FREE_KICK_ZONES: FreeKickZone[] = [
  { id: 'tl', label: 'Top Left', cx: 60, cy: 35, points: 50 },
  { id: 'tc', label: 'Top Center', cx: 150, cy: 35, points: 75 },
  { id: 'tr', label: 'Top Right', cx: 240, cy: 35, points: 50 },
  { id: 'bl', label: 'Bottom Left', cx: 60, cy: 100, points: 50 },
  { id: 'bc', label: 'Bottom Center', cx: 150, cy: 100, points: 100 },
  { id: 'br', label: 'Bottom Right', cx: 240, cy: 100, points: 50 },
];

const CROSSING_ZONES: CrossingZone[] = [
  { id: 'near', label: 'Near Post', cx: 80, cy: 120, points: 75 },
  { id: 'center', label: 'Center', cx: 160, cy: 90, points: 100 },
  { id: 'far', label: 'Far Post', cx: 240, cy: 120, points: 50 },
];

const CROSSING_POWERS = [
  { id: 'low', label: 'Low', accuracyMod: 15 },
  { id: 'medium', label: 'Medium', accuracyMod: 0 },
  { id: 'high', label: 'High', accuracyMod: -15 },
];

const DRIBBLING_CONFIGS: Record<DifficultyLevel, { gapWidth: number; label: string; coneCount: number }> = {
  easy: { gapWidth: 90, label: 'Easy', coneCount: 5 },
  medium: { gapWidth: 60, label: 'Medium', coneCount: 7 },
  hard: { gapWidth: 40, label: 'Hard', coneCount: 10 },
};

const MAX_ATTEMPTS_PER_WEEK = 3;

// ============================================================
// Helpers
// ============================================================

function getRating(score: number): { rating: string; color: string } {
  const t = RATING_THRESHOLDS.find(r => score >= r.min);
  return t ? { rating: t.rating, color: t.color } : { rating: 'D', color: '#ef4444' };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ============================================================
// Main Component
// ============================================================

export default function SkillChallenges() {
  const gameState = useGameStore(state => state.gameState);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeId | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<Record<ChallengeId, number>>({
    free_kick: MAX_ATTEMPTS_PER_WEEK,
    dribbling: MAX_ATTEMPTS_PER_WEEK,
    crossing: MAX_ATTEMPTS_PER_WEEK,
  });
  const [bestScores, setBestScores] = useState<BestScores>({
    free_kick: 0,
    dribbling: 0,
    crossing: 0,
  });
  const [lastResult, setLastResult] = useState<{ challenge: ChallengeId; result: ChallengeResult } | null>(null);

  const player = gameState?.player;
  const shooting = player?.attributes.shooting ?? 50;
  const passing = player?.attributes.passing ?? 50;
  const dribbling = player?.attributes.dribbling ?? 50;
  const pace = player?.attributes.pace ?? 50;
  const potential = player?.potential ?? 80;

  const handleChallengeComplete = useCallback((challengeId: ChallengeId, result: ChallengeResult) => {
    setBestScores(prev => ({
      ...prev,
      [challengeId]: Math.max(prev[challengeId], result.totalScore),
    }));
    setAttemptsLeft(prev => ({
      ...prev,
      [challengeId]: prev[challengeId] - 1,
    }));
    setLastResult({ challenge: challengeId, result });
    setActiveChallenge(null);
  }, []);

  const handleBack = useCallback(() => {
    setActiveChallenge(null);
    setLastResult(null);
  }, []);

  if (!gameState || !player) return null;

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {activeChallenge && (
            <motion.button
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBack}
              className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#c9d1d9]" />
            </motion.button>
          )}
        </AnimatePresence>
        <div>
          <h1 className="text-lg font-bold text-[#c9d1d9]">Skill Challenges</h1>
          <p className="text-xs text-[#8b949e]">Test your attributes in mini-games</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Challenge Selection */}
        {!activeChallenge && !lastResult && (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <ChallengeCard
              id="free_kick"
              icon={<Target className="h-6 w-6 text-emerald-400" />}
              title="Free Kick Accuracy"
              description="Aim for the target zones in goal. Higher shooting = better accuracy."
              attribute="Shooting"
              attributeValue={shooting}
              bestScore={bestScores.free_kick}
              attemptsLeft={attemptsLeft.free_kick}
              onClick={() => setActiveChallenge('free_kick')}
              locked={attemptsLeft.free_kick <= 0}
            />
            <ChallengeCard
              id="dribbling"
              icon={<Footprints className="h-6 w-6 text-amber-400" />}
              title="Dribbling Course"
              description="Navigate through cones. Choose difficulty. Speed + dribbling matter."
              attribute="Dribbling"
              attributeValue={dribbling}
              bestScore={bestScores.dribbling}
              attemptsLeft={attemptsLeft.dribbling}
              onClick={() => setActiveChallenge('dribbling')}
              locked={attemptsLeft.dribbling <= 0}
            />
            <ChallengeCard
              id="crossing"
              icon={<Navigation className="h-6 w-6 text-purple-400" />}
              title="Crossing Accuracy"
              description="Deliver crosses into the box. Pick power, then pick your target."
              attribute="Passing"
              attributeValue={passing}
              bestScore={bestScores.crossing}
              attemptsLeft={attemptsLeft.crossing}
              onClick={() => setActiveChallenge('crossing')}
              locked={attemptsLeft.crossing <= 0}
            />
          </motion.div>
        )}

        {/* Active Challenge */}
        {activeChallenge && (
          <motion.div
            key={activeChallenge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activeChallenge === 'free_kick' && (
              <FreeKickChallenge
                shooting={shooting}
                potential={potential}
                onComplete={(r) => handleChallengeComplete('free_kick', r)}
              />
            )}
            {activeChallenge === 'dribbling' && (
              <DribblingChallenge
                dribbling={dribbling}
                pace={pace}
                potential={potential}
                onComplete={(r) => handleChallengeComplete('dribbling', r)}
              />
            )}
            {activeChallenge === 'crossing' && (
              <CrossingChallenge
                passing={passing}
                potential={potential}
                onComplete={(r) => handleChallengeComplete('crossing', r)}
              />
            )}
          </motion.div>
        )}

        {/* Results Screen */}
        {lastResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChallengeResultScreen
              result={lastResult.result}
              challengeId={lastResult.challenge}
              onDismiss={() => setLastResult(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Challenge Selection Card
// ============================================================

function ChallengeCard({
  id,
  icon,
  title,
  description,
  attribute,
  attributeValue,
  bestScore,
  attemptsLeft,
  onClick,
  locked,
}: {
  id: ChallengeId;
  icon: React.ReactNode;
  title: string;
  description: string;
  attribute: string;
  attributeValue: number;
  bestScore: number;
  attemptsLeft: number;
  onClick: () => void;
  locked: boolean;
}) {
  return (
    <Card
      className={`bg-[#161b22] border-[#30363d] overflow-hidden transition-colors ${
        locked ? 'opacity-50' : 'cursor-pointer hover:bg-[#1c2128]'
      }`}
      onClick={locked ? undefined : onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#c9d1d9]">{title}</h3>
              <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] shrink-0 ml-2">
                {attemptsLeft}/{MAX_ATTEMPTS_PER_WEEK}
              </Badge>
            </div>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">{description}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-[#8b949e]">{attribute}: </span>
                <span className="text-xs font-semibold text-emerald-400">{attributeValue}</span>
              </div>
              {bestScore > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-[#8b949e]">Best: </span>
                  <span className="text-xs font-semibold text-amber-400">{bestScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Challenge Result Screen
// ============================================================

function ChallengeResultScreen({
  result,
  challengeId,
  onDismiss,
}: {
  result: ChallengeResult;
  challengeId: ChallengeId;
  onDismiss: () => void;
}) {
  const { rating, color } = getRating(result.totalScore);
  const challengeNames: Record<ChallengeId, string> = {
    free_kick: 'Free Kick Accuracy',
    dribbling: 'Dribbling Course',
    crossing: 'Crossing Accuracy',
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4 border-2"
              style={{ borderColor: color, background: `${color}15` }}
            >
              <span className="text-4xl font-black" style={{ color }}>{rating}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-[#c9d1d9]">{challengeNames[challengeId]}</h2>
            <p className="text-3xl font-black mt-2" style={{ color }}>
              {result.totalScore}
              <span className="text-sm font-normal text-[#8b949e] ml-1">pts</span>
            </p>
          </motion.div>

          {/* Attempt Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 space-y-1"
          >
            {result.attempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-[#21262d]">
                <span className="text-[#8b949e]">Attempt {i + 1}</span>
                <span className="text-[#c9d1d9]">{a.label}</span>
                <span className={`font-semibold ${a.hit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.hit ? `+${a.points}` : 'Miss'}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Attribute Gain */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                +{result.attributeGain.value} {result.attributeGain.attr}
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/70 mt-1">Attribute gained from challenge</p>
          </motion.div>
        </CardContent>
      </Card>

      <Button
        onClick={onDismiss}
        className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg"
      >
        Continue
      </Button>
    </div>
  );
}

// ============================================================
// CHALLENGE 1: Free Kick Accuracy
// ============================================================

function FreeKickChallenge({
  shooting,
  potential,
  onComplete,
}: {
  shooting: number;
  potential: number;
  onComplete: (result: ChallengeResult) => void;
}) {
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [animatingBall, setAnimatingBall] = useState(false);
  const [ballTarget, setBallTarget] = useState<{ x: number; y: number } | null>(null);
  const [hitZone, setHitZone] = useState<string | null>(null);
  const [missZone, setMissZone] = useState<string | null>(null);
  const totalAttempts = 5;

  const handleZoneClick = useCallback(
    (zone: FreeKickZone) => {
      if (animatingBall || currentAttempt >= totalAttempts) return;

      // Accuracy check based on shooting attribute
      const accuracyChance = Math.min(95, (shooting / 100) * 80 + 15);
      const hitRoll = Math.random() * 100;
      const didHit = hitRoll < accuracyChance;

      // Set ball animation target
      setAnimatingBall(true);
      setHitZone(null);
      setMissZone(null);
      setBallTarget({ x: zone.cx, y: zone.cy });

      setTimeout(() => {
        setAnimatingBall(false);
        setBallTarget(null);

        let result: AttemptResult;

        if (didHit) {
          // Hit the chosen zone
          result = {
            zoneId: zone.id,
            points: zone.points,
            hit: true,
            label: zone.label,
          };
          setHitZone(zone.id);
        } else {
          // Miss — ball goes elsewhere
          const missZones = FREE_KICK_ZONES.filter(z => z.id !== zone.id);
          const randomMiss = missZones[Math.floor(Math.random() * missZones.length)];
          result = {
            zoneId: randomMiss.id,
            points: 0,
            hit: false,
            label: `Missed (went ${randomMiss.label})`,
          };
          setMissZone(randomMiss.id);
        }

        const newAttempts = [...attempts, result];
        setAttempts(newAttempts);
        setScore(prev => prev + result.points);
        setCurrentAttempt(prev => prev + 1);
      }, 600);
    },
    [animatingBall, currentAttempt, shooting, attempts]
  );

  // Check for challenge completion
  useEffect(() => {
    if (currentAttempt >= totalAttempts && attempts.length === totalAttempts) {
      const finalScore = score;
      const { rating } = getRating(finalScore);

      const gainValue = finalScore >= 400 ? 2 : finalScore >= 200 ? 1 : 0;
      const actualGain = Math.min(gainValue, potential - shooting);
      const attrGain: { attr: keyof PlayerAttributes; value: number } = {
        attr: 'shooting',
        value: Math.max(0, actualGain),
      };

      onComplete({
        totalScore: finalScore,
        rating,
        attempts,
        attributeGain: attrGain,
      });
    }
  }, [currentAttempt, score, attempts, onComplete, potential, shooting]);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Free Kick Accuracy</h2>
          <p className="text-xs text-[#8b949e]">Tap a zone to shoot • {totalAttempts} attempts</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-400">{score}</p>
          <p className="text-[10px] text-[#8b949e]">
            Attempt {Math.min(currentAttempt + 1, totalAttempts)}/{totalAttempts}
          </p>
        </div>
      </div>

      {/* Attempt dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalAttempts }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < attempts.length
                ? attempts[i].hit
                  ? 'bg-emerald-400'
                  : 'bg-red-400'
                : i === currentAttempt
                ? 'bg-amber-400'
                : 'bg-[#30363d]'
            }`}
          />
        ))}
      </div>

      {/* Goal SVG */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <svg viewBox="0 0 300 145" className="w-full" style={{ maxHeight: 220 }}>
            {/* Background */}
            <rect x="0" y="0" width="300" height="145" rx="4" fill="#1a2332" />

            {/* Goal frame */}
            {/* Left post */}
            <rect x="28" y="10" width="4" height="120" fill="#8b949e" rx="1" />
            {/* Right post */}
            <rect x="268" y="10" width="4" height="120" fill="#8b949e" rx="1" />
            {/* Crossbar */}
            <rect x="28" y="8" width="244" height="4" fill="#8b949e" rx="1" />

            {/* Net lines */}
            {[20, 60, 100, 140].map(y => (
              <line key={`nh${y}`} x1="32" y1={y} x2="268" y2={y} stroke="#30363d" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}
            {[50, 100, 150, 200, 250].map(x => (
              <line key={`nv${x}`} x1={x} y1="12" x2={x} y2="128" stroke="#30363d" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}

            {/* Zone target areas */}
            {FREE_KICK_ZONES.map(zone => (
              <g key={zone.id}>
                <rect
                  x={zone.cx - 42}
                  y={zone.cy - 27}
                  width="84"
                  height="50"
                  rx="4"
                  fill={
                    hitZone === zone.id
                      ? 'rgba(34,197,94,0.3)'
                      : missZone === zone.id
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(255,255,255,0.04)'
                  }
                  stroke={
                    hitZone === zone.id
                      ? '#22c55e'
                      : missZone === zone.id
                      ? '#ef4444'
                      : '#484f58'
                  }
                  strokeWidth="1"
                  className="cursor-pointer"
                  onClick={() => handleZoneClick(zone)}
                />
                <text
                  x={zone.cx}
                  y={zone.cy - 5}
                  textAnchor="middle"
                  fill={hitZone === zone.id ? '#22c55e' : '#8b949e'}
                  fontSize="9"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {zone.label}
                </text>
                <text
                  x={zone.cx}
                  y={zone.cy + 10}
                  textAnchor="middle"
                  fill={hitZone === zone.id ? '#22c55e' : '#484f58'}
                  fontSize="8"
                  className="pointer-events-none select-none"
                >
                  {zone.points}pts
                </text>
              </g>
            ))}

            {/* Animated ball */}
            <AnimatePresence>
              {animatingBall && ballTarget && (
                <motion.circle
                  key="ball"
                  cx={150}
                  cy={140}
                  r="6"
                  fill="#f0f0f0"
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: 1,
                    cx: ballTarget.x,
                    cy: ballTarget.y,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            {/* Ball starting position indicator */}
            {!animatingBall && currentAttempt < totalAttempts && (
              <circle cx={150} cy={138} r="5" fill="#f0f0f0" opacity="0.5" />
            )}
          </svg>
        </CardContent>
      </Card>

      {/* Scoring legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-[#8b949e]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Perfect (100)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Good (75)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#8b949e]" />
          <span>OK (50)</span>
        </div>
      </div>

      {/* Shooting stat indicator */}
      <div className="px-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#8b949e]">Accuracy Chance</span>
          <span className="font-semibold text-emerald-400">
            {Math.min(95, Math.round((shooting / 100) * 80 + 15))}%
          </span>
        </div>
        <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-md"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(95, (shooting / 100) * 80 + 15)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHALLENGE 2: Dribbling Course
// ============================================================

interface ConeGate {
  id: number;
  topCone: number;
  bottomCone: number;
  targetSide: 'top' | 'bottom';
  gapCenter: number;
}

function DribblingChallenge({
  dribbling,
  pace,
  potential,
  onComplete,
}: {
  dribbling: number;
  pace: number;
  potential: number;
  onComplete: (result: ChallengeResult) => void;
}) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null);
  const [started, setStarted] = useState(false);
  const [currentGate, setCurrentGate] = useState(0);
  const [playerY, setPlayerY] = useState(50);
  const [gates, setGates] = useState<ConeGate[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [conesHit, setConesHit] = useState(0);
  const [navigated, setNavigated] = useState<number[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const config = difficulty ? DRIBBLING_CONFIGS[difficulty] : null;
  const totalGates = config?.coneCount ?? 5;

  // Generate gates for selected difficulty
  const generateGates = useCallback((diff: DifficultyLevel): ConeGate[] => {
    const cfg = DRIBBLING_CONFIGS[diff];
    const result: ConeGate[] = [];
    for (let i = 0; i < cfg.coneCount; i++) {
      const gapCenter = 15 + Math.random() * 70;
      result.push({
        id: i,
        topCone: gapCenter - cfg.gapWidth / 2,
        bottomCone: gapCenter + cfg.gapWidth / 2,
        targetSide: gapCenter > 50 ? 'top' : 'bottom',
        gapCenter,
      });
    }
    return result;
  }, []);

  const handleStart = useCallback(
    (diff: DifficultyLevel) => {
      const g = generateGates(diff);
      setDifficulty(diff);
      setGates(g);
      setStarted(true);
      setCurrentGate(0);
      setPlayerY(50);
      setTimer(0);
      setTimerActive(true);
      setConesHit(0);
      setNavigated([]);
      setFeedbackMsg(null);
      setShowResult(false);
    },
    [generateGates]
  );

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleDirection = useCallback(
    (direction: 'up' | 'down') => {
      if (!started || !config || currentGate >= totalGates) return;

      const gate = gates[currentGate];
      if (!gate) return;

      const newY = direction === 'up' ? Math.max(5, playerY - 15) : Math.min(95, playerY + 15);
      setPlayerY(newY);

      // Check if player passed through the gate correctly
      const passedThrough = newY >= gate.topCone + 5 && newY <= gate.bottomCone - 5;
      const hitCone = (newY >= gate.topCone - 3 && newY <= gate.topCone + 8) ||
                      (newY >= gate.bottomCone - 8 && newY <= gate.bottomCone + 3);

      if (passedThrough) {
        // Determine if dribbling attribute kept them clean
        const cleanChance = Math.min(95, (dribbling / 100) * 70 + 25);
        const cleanRoll = Math.random() * 100;
        const isClean = cleanRoll < cleanChance;

        const newNavigated = [...navigated, gate.id];
        setNavigated(newNavigated);
        setCurrentGate(prev => prev + 1);

        if (!isClean) {
          setConesHit(prev => prev + 1);
          setFeedbackMsg('Brushed a cone!');
        } else {
          setFeedbackMsg('Clean pass!');
        }

        // Check completion
        if (newNavigated.length >= totalGates) {
          setTimerActive(false);
          setTimeout(() => setShowResult(true), 800);
        }
      } else if (hitCone) {
        // Hit the cone directly - still counts as navigating but with penalty
        const newNavigated = [...navigated, gate.id];
        setNavigated(newNavigated);
        setConesHit(prev => prev + 1);
        setCurrentGate(prev => prev + 1);
        setFeedbackMsg('Hit a cone!');

        if (newNavigated.length >= totalGates) {
          setTimerActive(false);
          setTimeout(() => setShowResult(true), 800);
        }
      } else {
        // Went the wrong way entirely
        setFeedbackMsg('Wrong direction! Try again.');
      }

      // Clear feedback after a delay
      setTimeout(() => setFeedbackMsg(null), 800);
    },
    [started, config, currentGate, totalGates, gates, playerY, dribbling, navigated]
  );

  // Calculate result on completion
  useEffect(() => {
    if (!showResult || !difficulty || navigated.length < totalGates) return;

    // Time bonus: faster = more points (10 seconds base, faster gets bonus)
    const timeSeconds = timer / 10;
    const timeBonus = Math.max(0, Math.round(200 - timeSeconds * 15));

    // Cone penalty
    const conePenalty = conesHit * 20;

    // Clean run bonus (no cones hit)
    const cleanRunBonus = conesHit === 0 ? 100 : 0;

    // Difficulty multiplier
    const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;

    const totalScore = Math.max(0, Math.round((timeBonus + cleanRunBonus - conePenalty) * diffMultiplier));
    const { rating } = getRating(totalScore);

    const attempts: AttemptResult[] = navigated.map((gateId, i) => ({
      zoneId: `gate_${gateId}`,
      points: i === 0 ? totalScore : 0,
      hit: true,
      label: `Gate ${i + 1}`,
    }));

    // Main score as first attempt, remaining as 0 for display
    attempts[0] = {
      zoneId: 'total',
      points: totalScore,
      hit: conesHit === 0,
      label: `Time: ${timeSeconds.toFixed(1)}s`,
    };

    const gainValue = totalScore >= 300 ? 2 : totalScore >= 150 ? 1 : 0;
    const actualGain = Math.min(gainValue, potential - dribbling);
    const attrGain: { attr: keyof PlayerAttributes; value: number } = {
      attr: 'dribbling',
      value: Math.max(0, actualGain),
    };

    onComplete({
      totalScore,
      rating,
      attempts,
      attributeGain: attrGain,
    });
  }, [showResult, difficulty, navigated, totalGates, timer, conesHit, potential, dribbling, onComplete]);

  // Difficulty selection
  if (!difficulty) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Dribbling Course</h2>
          <p className="text-xs text-[#8b949e] mt-1">Choose your difficulty level</p>
        </div>
        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(diff => {
          const cfg = DRIBBLING_CONFIGS[diff];
          const diffColors: Record<DifficultyLevel, string> = {
            easy: 'border-emerald-500/30 bg-emerald-500/5',
            medium: 'border-amber-500/30 bg-amber-500/5',
            hard: 'border-red-500/30 bg-red-500/5',
          };
          const diffTextColors: Record<DifficultyLevel, string> = {
            easy: 'text-emerald-400',
            medium: 'text-amber-400',
            hard: 'text-red-400',
          };
          return (
            <Card
              key={diff}
              className={`bg-[#161b22] border ${diffColors[diff]} cursor-pointer hover:bg-[#1c2128] transition-colors`}
              onClick={() => handleStart(diff)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold text-sm ${diffTextColors[diff]}`}>{cfg.label}</h3>
                    <p className="text-xs text-[#8b949e] mt-0.5">{cfg.coneCount} gates • Gap width: {cfg.gapWidth}px</p>
                  </div>
                  <Play className="h-5 w-5 text-[#8b949e]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        <div className="text-xs text-[#8b949e] text-center px-2">
          Use Left / Right buttons to navigate through the gates. Speed determines time bonus, dribbling determines cone-hit chance.
        </div>
      </div>
    );
  }

  // Active dribbling game
  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Dribbling Course</h2>
          <Badge variant="outline" className="text-[10px] border-[#30363d] capitalize">{difficulty}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="text-[#8b949e]">Time</p>
            <p className="font-bold text-[#c9d1d9]">{(timer / 10).toFixed(1)}s</p>
          </div>
          <div className="text-center">
            <p className="text-[#8b949e]">Gates</p>
            <p className="font-bold text-emerald-400">{navigated.length}/{totalGates}</p>
          </div>
          <div className="text-center">
            <p className="text-[#8b949e]">Cone Hits</p>
            <p className={`font-bold ${conesHit > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{conesHit}</p>
          </div>
        </div>
      </div>

      {/* Gate progress dots */}
      <div className="flex gap-1 justify-center flex-wrap">
        {gates.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              navigated.includes(i)
                ? 'bg-emerald-400'
                : i === currentGate
                ? 'bg-amber-400'
                : 'bg-[#30363d]'
            }`}
          />
        ))}
      </div>

      {/* Course SVG */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <svg viewBox="0 0 300 120" className="w-full" style={{ maxHeight: 180 }}>
            {/* Pitch background */}
            <rect x="0" y="0" width="300" height="120" rx="4" fill="#1a2e1a" />
            {/* Pitch lines */}
            <line x1="0" y1="60" x2="300" y2="60" stroke="#2d4a2d" strokeWidth="0.5" strokeDasharray="4 4" />
            {/* Side boundaries */}
            <rect x="0" y="0" width="300" height="120" rx="4" fill="none" stroke="#2d4a2d" strokeWidth="1" />

            {/* Gates */}
            {gates.map((gate, i) => {
              const gateX = 30 + i * (240 / Math.max(1, totalGates - 1));
              const isActive = i === currentGate;
              const isDone = navigated.includes(i);

              return (
                <g key={i}>
                  {/* Top cone */}
                  <circle
                    cx={gateX}
                    cy={gate.topCone}
                    r="4"
                    fill={isActive ? '#f59e0b' : isDone ? '#22c55e' : '#ef4444'}
                    opacity={isActive ? 1 : 0.6}
                  />
                  {/* Bottom cone */}
                  <circle
                    cx={gateX}
                    cy={gate.bottomCone}
                    r="4"
                    fill={isActive ? '#f59e0b' : isDone ? '#22c55e' : '#ef4444'}
                    opacity={isActive ? 1 : 0.6}
                  />
                  {/* Gate indicator line */}
                  {isActive && (
                    <line
                      x1={gateX}
                      y1={gate.topCone + 5}
                      x2={gateX}
                      y2={gate.bottomCone - 5}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.5"
                    />
                  )}
                  {/* Gate number */}
                  <text
                    x={gateX}
                    y={8}
                    textAnchor="middle"
                    fill="#484f58"
                    fontSize="7"
                    className="pointer-events-none select-none"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Player dot */}
            <motion.circle
              cx={currentGate < totalGates ? 30 + currentGate * (240 / Math.max(1, totalGates - 1)) : 30 + (totalGates - 1) * (240 / Math.max(1, totalGates - 1))}
              r="6"
              fill="#22c55e"
              animate={{ cy: playerY * 1.2 }}
              transition={{ duration: 0.15 }}
            />
          </svg>
        </CardContent>
      </Card>

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs font-semibold px-3 py-2 rounded-lg bg-[#21262d]"
          >
            <span
              className={
                feedbackMsg.includes('cone') || feedbackMsg.includes('Wrong')
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }
            >
              {feedbackMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direction controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => handleDirection('up')}
          disabled={currentGate >= totalGates}
          className="w-24 h-14 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-xs font-semibold">Up</span>
        </Button>
        <Button
          onClick={() => handleDirection('down')}
          disabled={currentGate >= totalGates}
          className="w-24 h-14 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          <span className="text-xs font-semibold">Down</span>
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// CHALLENGE 3: Crossing Accuracy
// ============================================================

function CrossingChallenge({
  passing,
  potential,
  onComplete,
}: {
  passing: number;
  potential: number;
  onComplete: (result: ChallengeResult) => void;
}) {
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [selectedPower, setSelectedPower] = useState<string | null>(null);
  const [animatingBall, setAnimatingBall] = useState(false);
  const [ballPath, setBallPath] = useState<{ x: number; y: number }[]>([]);
  const [hitZone, setHitZone] = useState<string | null>(null);
  const [missFeedback, setMissFeedback] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const totalAttempts = 5;

  const handlePowerSelect = useCallback((powerId: string) => {
    if (animatingBall) return;
    setSelectedPower(powerId);
    setHitZone(null);
    setMissFeedback(null);
  }, [animatingBall]);

  const handleZoneClick = useCallback(
    (zone: CrossingZone) => {
      if (!selectedPower || animatingBall || currentAttempt >= totalAttempts) return;

      const powerConfig = CROSSING_POWERS.find(p => p.id === selectedPower);
      if (!powerConfig) return;

      setAnimatingBall(true);

      // Generate arc path for animation
      const arcPoints: { x: number; y: number }[] = [];
      const startX = 30;
      const startY = 60;
      for (let t = 0; t <= 1; t += 0.05) {
        arcPoints.push({
          x: startX + (zone.cx - startX) * t,
          y: startY + (zone.cy - startY) * t - Math.sin(t * Math.PI) * 40,
        });
      }
      setBallPath(arcPoints);

      setTimeout(() => {
        setAnimatingBall(false);
        setBallPath([]);

        // Accuracy check
        const baseChance = Math.min(90, (passing / 100) * 75 + 15);
        const powerMod = powerConfig.accuracyMod;
        const finalChance = Math.max(10, Math.min(95, baseChance + powerMod));
        const hitRoll = Math.random() * 100;
        const didHit = hitRoll < finalChance;

        let result: AttemptResult;

        if (didHit) {
          const streakBonus = streak * 10;
          const zonePoints = zone.points + streakBonus;
          result = {
            zoneId: zone.id,
            points: zonePoints,
            hit: true,
            label: `${zone.label} (${selectedPower} power)${streak > 0 ? ` +${streakBonus} streak` : ''}`,
          };
          setHitZone(zone.id);
          setStreak(prev => prev + 1);
        } else {
          result = {
            zoneId: zone.id,
            points: 0,
            hit: false,
            label: `Missed (${selectedPower} power)`,
          };
          setMissFeedback('Cross missed the target!');
          setStreak(0);
        }

        const newAttempts = [...attempts, result];
        setAttempts(newAttempts);
        setScore(prev => prev + result.points);
        setCurrentAttempt(prev => prev + 1);
        setSelectedPower(null);

        setTimeout(() => {
          setHitZone(null);
          setMissFeedback(null);
        }, 1200);
      }, 800);
    },
    [selectedPower, animatingBall, currentAttempt, passing, attempts, streak, totalAttempts]
  );

  // Check for completion
  useEffect(() => {
    if (currentAttempt >= totalAttempts && attempts.length === totalAttempts) {
      const finalScore = score;
      const { rating } = getRating(finalScore);

      const gainValue = finalScore >= 350 ? 2 : finalScore >= 175 ? 1 : 0;
      const actualGain = Math.min(gainValue, potential - passing);
      const attrGain: { attr: keyof PlayerAttributes; value: number } = {
        attr: 'passing',
        value: Math.max(0, actualGain),
      };

      onComplete({
        totalScore: finalScore,
        rating,
        attempts,
        attributeGain: attrGain,
      });
    }
  }, [currentAttempt, score, attempts, onComplete, potential, passing]);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Crossing Accuracy</h2>
          <p className="text-xs text-[#8b949e]">Select power, then tap target zone • {totalAttempts} attempts</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-400">{score}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[#8b949e]">
              Attempt {Math.min(currentAttempt + 1, totalAttempts)}/{totalAttempts}
            </p>
            {streak > 0 && (
              <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0">
                {streak}x streak
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Attempt dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalAttempts }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < attempts.length
                ? attempts[i].hit
                  ? 'bg-emerald-400'
                  : 'bg-red-400'
                : i === currentAttempt
                ? 'bg-amber-400'
                : 'bg-[#30363d]'
            }`}
          />
        ))}
      </div>

      {/* Power Selection */}
      {!selectedPower && (
        <div className="space-y-2">
          <p className="text-xs text-[#8b949e] text-center">Select crossing power:</p>
          <div className="grid grid-cols-3 gap-2">
            {CROSSING_POWERS.map(power => {
              const modColor = power.accuracyMod > 0 ? 'text-emerald-400 border-emerald-500/30' : power.accuracyMod === 0 ? 'text-amber-400 border-amber-500/30' : 'text-red-400 border-red-500/30';
              const modBg = power.accuracyMod > 0 ? 'bg-emerald-500/5' : power.accuracyMod === 0 ? 'bg-amber-500/5' : 'bg-red-500/5';
              return (
                <button
                  key={power.id}
                  onClick={() => handlePowerSelect(power.id)}
                  className={`p-3 rounded-lg border ${modColor} ${modBg} text-center hover:brightness-125 transition-all`}
                >
                  <Gauge className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-xs font-semibold block">{power.label}</span>
                  <span className="text-[10px] block mt-0.5">
                    {power.accuracyMod > 0 ? `+${power.accuracyMod}% acc` : power.accuracyMod === 0 ? 'Standard' : `${power.accuracyMod}% acc`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pitch SVG with crossing zones */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <svg viewBox="0 0 300 160" className="w-full" style={{ maxHeight: 240 }}>
            {/* Pitch background */}
            <rect x="0" y="0" width="300" height="160" rx="4" fill="#1a2e1a" />

            {/* Penalty box */}
            <rect x="120" y="20" width="175" height="120" fill="none" stroke="#2d4a2d" strokeWidth="1" rx="2" />
            {/* 6-yard box */}
            <rect x="210" y="55" width="85" height="50" fill="none" stroke="#2d4a2d" strokeWidth="0.8" rx="1" />

            {/* Center spot */}
            <circle cx="210" cy="80" r="2" fill="#2d4a2d" />

            {/* Goal line */}
            <line x1="120" y1="20" x2="120" y2="140" stroke="#2d4a2d" strokeWidth="1" />

            {/* Goal */}
            <rect x="288" y="55" width="12" height="50" fill="none" stroke="#8b949e" strokeWidth="1.5" rx="1" />

            {/* Pitch pattern lines */}
            <line x1="0" y1="80" x2="300" y2="80" stroke="#2d4a2d" strokeWidth="0.3" strokeDasharray="6 6" />

            {/* Target zones */}
            {CROSSING_ZONES.map(zone => (
              <g key={zone.id}>
                <rect
                  x={zone.cx - 35}
                  y={zone.cy - 25}
                  width="70"
                  height="50"
                  rx="4"
                  fill={
                    hitZone === zone.id
                      ? 'rgba(34,197,94,0.3)'
                      : selectedPower
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.02)'
                  }
                  stroke={
                    hitZone === zone.id
                      ? '#22c55e'
                      : selectedPower
                      ? '#484f58'
                      : '#30363d'
                  }
                  strokeWidth="1"
                  className={selectedPower ? 'cursor-pointer' : ''}
                  onClick={() => handleZoneClick(zone)}
                />
                <text
                  x={zone.cx}
                  y={zone.cy - 4}
                  textAnchor="middle"
                  fill={hitZone === zone.id ? '#22c55e' : selectedPower ? '#8b949e' : '#484f58'}
                  fontSize="9"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {zone.label}
                </text>
                <text
                  x={zone.cx}
                  y={zone.cy + 10}
                  textAnchor="middle"
                  fill={hitZone === zone.id ? '#22c55e' : selectedPower ? '#484f58' : '#30363d'}
                  fontSize="8"
                  className="pointer-events-none select-none"
                >
                  {zone.points}pts
                </text>
              </g>
            ))}

            {/* Ball at crossing position */}
            {!animatingBall && (
              <circle cx="30" cy="80" r="5" fill="#f0f0f0" opacity="0.5" />
            )}
            <text x="30" y="95" textAnchor="middle" fill="#484f58" fontSize="7" className="pointer-events-none select-none">
              Cross
            </text>

            {/* Animated ball arc */}
            {animatingBall && ballPath.length > 0 && (
              <AnimatePresence>
                {ballPath.map((pt, i) => {
                  const isLast = i === ballPath.length - 1;
                  return (
                    <motion.circle
                      key={`bp-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isLast ? 5 : 1.5}
                      fill={isLast ? '#f0f0f0' : '#f0f0f0'}
                      opacity={isLast ? 1 : 0.3}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isLast ? 1 : 0.3 }}
                      transition={{ delay: i * 0.02, duration: 0.05 }}
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </svg>
        </CardContent>
      </Card>

      {/* Miss feedback */}
      <AnimatePresence>
        {missFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs font-semibold text-red-400 px-3 py-2 rounded-lg bg-red-500/10"
          >
            {missFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power accuracy indicator */}
      <div className="px-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#8b949e]">Cross Accuracy</span>
          <span className="font-semibold text-emerald-400">
            {selectedPower
              ? `${Math.max(10, Math.min(95, Math.round((passing / 100) * 75 + 15 + (CROSSING_POWERS.find(p => p.id === selectedPower)?.accuracyMod ?? 0))))}%`
              : 'Select power'}
          </span>
        </div>
        <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
          {selectedPower && (
            <motion.div
              className="h-full bg-emerald-500 rounded-md"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(10, Math.min(95, (passing / 100) * 75 + 15 + (CROSSING_POWERS.find(p => p.id === selectedPower)?.accuracyMod ?? 0)))}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
