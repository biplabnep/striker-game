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
  ChevronRight,
  Star,
  Trophy,
  Zap,
  RotateCcw,
  Play,
  Gauge,
  TrendingUp,
  Users,
  Crown,
  Flame,
  Gift,
  Shield,
  Swords,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  Wind,
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

            {/* Challenge Leaderboard */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <ChallengeLeaderboard />
            </motion.div>

            {/* Challenge Skill Tree */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ChallengeSkillTree />
            </motion.div>

            {/* Daily Challenge Streak */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <DailyChallengeStreak />
            </motion.div>

            {/* Challenge Difficulty Analytics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ChallengeDifficultyAnalytics />
            </motion.div>

            {/* Reward Showcase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <RewardShowcase />
            </motion.div>
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

// ============================================================
// Challenge Leaderboard
// ============================================================

const LEADERBOARD_PLAYERS = [
  { rank: 1, name: 'MarcusFC', badge: 'gold' as const, totalScore: 4820, challengesCompleted: 42, bestChallenge: 'Free Kick — 498pts', isPlayer: false, rankChange: 'stable' as const },
  { rank: 2, name: 'StrikerKing', badge: 'silver' as const, totalScore: 4510, challengesCompleted: 38, bestChallenge: 'Dribbling — 475pts', isPlayer: false, rankChange: 'up' as const },
  { rank: 3, name: 'GoalMachine', badge: 'bronze' as const, totalScore: 4285, challengesCompleted: 40, bestChallenge: 'Crossing — 460pts', isPlayer: false, rankChange: 'down' as const },
  { rank: 4, name: 'xYoux', badge: 'none' as const, totalScore: 3950, challengesCompleted: 35, bestChallenge: 'Free Kick — 420pts', isPlayer: true, rankChange: 'up' as const },
  { rank: 5, name: 'DefensiveWall', badge: 'none' as const, totalScore: 3720, challengesCompleted: 33, bestChallenge: 'Crossing — 410pts', isPlayer: false, rankChange: 'down' as const },
  { rank: 6, name: 'Winger99', badge: 'none' as const, totalScore: 3540, challengesCompleted: 30, bestChallenge: 'Dribbling — 395pts', isPlayer: false, rankChange: 'up' as const },
  { rank: 7, name: 'MidfieldMaestro', badge: 'none' as const, totalScore: 3380, challengesCompleted: 28, bestChallenge: 'Free Kick — 380pts', isPlayer: false, rankChange: 'stable' as const },
  { rank: 8, name: 'CleanSheet', badge: 'none' as const, totalScore: 3150, challengesCompleted: 26, bestChallenge: 'Crossing — 365pts', isPlayer: false, rankChange: 'stable' as const },
  { rank: 9, name: 'SpeedDemon', badge: 'none' as const, totalScore: 2900, challengesCompleted: 24, bestChallenge: 'Dribbling — 340pts', isPlayer: false, rankChange: 'down' as const },
  { rank: 10, name: 'RookieStar', badge: 'none' as const, totalScore: 2650, challengesCompleted: 20, bestChallenge: 'Free Kick — 310pts', isPlayer: false, rankChange: 'up' as const },
];

function ChallengeLeaderboard() {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'club'>('global');

  const tabs = [
    { id: 'global' as const, label: 'Global', icon: <Users className="h-3 w-3" /> },
    { id: 'friends' as const, label: 'Friends', icon: <Users className="h-3 w-3" /> },
    { id: 'club' as const, label: 'Club', icon: <Shield className="h-3 w-3" /> },
  ];

  const badgeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    gold: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: <Crown className="h-3 w-3 text-amber-400" /> },
    silver: { bg: 'bg-[#8b949e]/10 border-[#8b949e]/20', text: 'text-[#c9d1d9]', icon: <Award className="h-3 w-3 text-[#c9d1d9]" /> },
    bronze: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', icon: <Award className="h-3 w-3 text-orange-400" /> },
    none: { bg: 'bg-[#21262d] border-[#30363d]', text: 'text-[#8b949e]', icon: null },
  };

  const rankChangeIcon = (change: 'up' | 'down' | 'stable') => {
    if (change === 'up') return <ArrowUp className="h-3 w-3 text-emerald-400" />;
    if (change === 'down') return <ArrowDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-[#8b949e]" />;
  };

  const displayPlayers = activeTab === 'friends'
    ? LEADERBOARD_PLAYERS.filter(p => p.rank <= 5 || p.isPlayer)
    : activeTab === 'club'
    ? LEADERBOARD_PLAYERS.filter(p => p.rank <= 3 || p.isPlayer)
    : LEADERBOARD_PLAYERS;

  return (
    <Card className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Leaderboard</h3>
          </div>
          <span className="text-[10px] text-[#8b949e]">Your rank: #4</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-1 px-2 pb-2 border-b border-[#30363d]">
          <span className="col-span-1 text-[10px] text-[#8b949e] font-medium">#</span>
          <span className="col-span-4 text-[10px] text-[#8b949e] font-medium">Player</span>
          <span className="col-span-3 text-[10px] text-[#8b949e] font-medium text-right">Score</span>
          <span className="col-span-2 text-[10px] text-[#8b949e] font-medium text-center">Done</span>
          <span className="col-span-2 text-[10px] text-[#8b949e] font-medium text-center">Trend</span>
        </div>

        {/* Player rows */}
        <div className="mt-1 space-y-0.5">
          {displayPlayers.map((player) => {
            const badge = badgeStyles[player.badge];
            return (
              <div
                key={player.rank}
                className={`grid grid-cols-12 gap-1 items-center px-2 py-2 rounded-lg ${
                  player.isPlayer
                    ? 'bg-emerald-500/8 border border-emerald-500/25'
                    : 'hover:bg-[#21262d]'
                } transition-colors`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {player.badge !== 'none' ? (
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${badge.bg}`}>
                      {badge.icon}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-[#8b949e]">{player.rank}</span>
                  )}
                </div>
                <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                  <span className={`text-xs font-medium truncate ${player.isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                    {player.name}
                  </span>
                  {player.isPlayer && (
                    <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1 py-0 rounded border border-emerald-500/20">You</span>
                  )}
                </div>
                <span className="col-span-3 text-xs font-semibold text-[#c9d1d9] text-right">{player.totalScore.toLocaleString()}</span>
                <span className="col-span-2 text-[10px] text-[#8b949e] text-center">{player.challengesCompleted}</span>
                <div className="col-span-2 flex items-center justify-center">
                  {rankChangeIcon(player.rankChange)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Friends tab: Challenge button */}
        {activeTab === 'friends' && (
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <Button className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs h-8">
              <Swords className="h-3 w-3 mr-1" />
              Challenge a Friend
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Challenge Skill Tree
// ============================================================

const SKILL_TREE_NODES = [
  { id: 'shooting', name: 'Shooting', icon: '🎯', x: 150, y: 30, completion: 85, status: 'completed' as const },
  { id: 'passing', name: 'Passing', icon: '🎯', x: 50, y: 100, completion: 72, status: 'completed' as const },
  { id: 'dribbling', name: 'Dribbling', icon: '⚽', x: 250, y: 100, completion: 60, status: 'in_progress' as const },
  { id: 'defending', name: 'Defending', icon: '🛡️', x: 30, y: 190, completion: 45, status: 'in_progress' as const },
  { id: 'speed', name: 'Speed', icon: '⚡', x: 150, y: 170, completion: 30, status: 'in_progress' as const },
  { id: 'strength', name: 'Strength', icon: '💪', x: 270, y: 190, completion: 0, status: 'locked' as const },
  { id: 'tactical', name: 'Tactical', icon: '🧠', x: 80, y: 270, completion: 0, status: 'locked' as const },
  { id: 'aerial', name: 'Aerial', icon: '🌀', x: 220, y: 270, completion: 0, status: 'locked' as const },
];

const SKILL_TREE_PATHS = [
  { from: 'shooting', to: 'passing' },
  { from: 'shooting', to: 'dribbling' },
  { from: 'passing', to: 'defending' },
  { from: 'passing', to: 'speed' },
  { from: 'dribbling', to: 'speed' },
  { from: 'dribbling', to: 'strength' },
  { from: 'defending', to: 'tactical' },
  { from: 'speed', to: 'tactical' },
  { from: 'speed', to: 'aerial' },
  { from: 'strength', to: 'aerial' },
];

function ChallengeSkillTree() {
  const nodeMap = new Map(SKILL_TREE_NODES.map(n => [n.id, n]));

  const nodeColor = (status: string) => {
    if (status === 'completed') return '#22c55e';
    if (status === 'in_progress') return '#f59e0b';
    return '#484f58';
  };

  const nodeBgColor = (status: string) => {
    if (status === 'completed') return 'rgba(34,197,94,0.15)';
    if (status === 'in_progress') return 'rgba(245,158,11,0.1)';
    return 'rgba(255,255,255,0.03)';
  };

  const pathColor = (fromId: string, toId: string) => {
    const from = nodeMap.get(fromId);
    const to = nodeMap.get(toId);
    if (from?.status === 'completed' && to?.status === 'completed') return '#22c55e';
    if (from?.status === 'completed' && to?.status === 'in_progress') return '#f59e0b';
    return '#30363d';
  };

  const totalSkillPoints = SKILL_TREE_NODES.reduce((sum, n) => sum + Math.round(n.completion / 10), 0);
  const completedNodes = SKILL_TREE_NODES.filter(n => n.status === 'completed').length;
  const nextNode = SKILL_TREE_NODES.find(n => n.status === 'in_progress');

  return (
    <Card className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Skill Tree</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8b949e]">{completedNodes}/8 completed</span>
            <span className="text-xs font-bold text-emerald-400">{totalSkillPoints} pts</span>
          </div>
        </div>

        {/* SVG Tree */}
        <svg viewBox="0 0 300 310" className="w-full mb-3" style={{ maxHeight: 320 }}>
          {/* Background */}
          <rect x="0" y="0" width="300" height="310" rx="6" fill="#0d1117" />

          {/* Connecting paths */}
          {SKILL_TREE_PATHS.map((path, i) => {
            const from = nodeMap.get(path.from);
            const to = nodeMap.get(path.to);
            if (!from || !to) return null;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={pathColor(path.from, path.to)}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            );
          })}

          {/* Nodes */}
          {SKILL_TREE_NODES.map((node) => {
            const color = nodeColor(node.status);
            const bgColor = nodeBgColor(node.status);
            const isNext = node.id === nextNode?.id;
            return (
              <g key={node.id}>
                {/* Current path highlight ring */}
                {isNext && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={bgColor}
                  stroke={color}
                  strokeWidth="1.5"
                />
                {/* Icon */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                >
                  {node.icon}
                </text>
                {/* Name */}
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  fill={color}
                  fontSize="8"
                  fontWeight="600"
                >
                  {node.name}
                </text>
                {/* Completion % */}
                {node.completion > 0 && (
                  <text
                    x={node.x}
                    y={node.y + 42}
                    textAnchor="middle"
                    fill="#8b949e"
                    fontSize="7"
                  >
                    {node.completion}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Next challenge indicator */}
        {nextNode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
            <ChevronRight className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">
              Current path: {nextNode.name} — {nextNode.completion}% complete
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-[#8b949e]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#484f58]" />
            <span>Locked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Daily Challenge Streak
// ============================================================

const STREAK_HISTORY = [
  { day: 'Mon', completed: true },
  { day: 'Tue', completed: true },
  { day: 'Wed', completed: true },
  { day: 'Thu', completed: true },
  { day: 'Fri', completed: true },
  { day: 'Sat', completed: false },
  { day: 'Sun', completed: false },
];

const STREAK_MILESTONES = [
  { days: 3, label: 'Bronze Streak', unlocked: true, reward: '500 coins' },
  { days: 7, label: 'Silver Streak', unlocked: true, reward: '1,500 coins + XP Boost' },
  { days: 14, label: 'Gold Streak', unlocked: false, reward: '5,000 coins + Cosmetic' },
  { days: 30, label: 'Diamond Streak', unlocked: false, reward: 'Legendary Reward' },
];

function DailyChallengeStreak() {
  const currentStreak = 5;
  const bestStreak = 12;
  const bestStreakDate = 'Dec 15, 2024';

  const motivationalText = currentStreak >= 30
    ? 'Legendary consistency! You are unstoppable!'
    : currentStreak >= 14
    ? 'On fire! Keep the momentum going!'
    : currentStreak >= 7
    ? 'Great discipline! A week strong!'
    : currentStreak >= 3
    ? 'Nice streak building! Don\'t break it!'
    : 'Start your streak today!';

  return (
    <Card className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Daily Streak</h3>
          </div>
          <div className="text-[10px] text-[#8b949e]">Best: {bestStreak} days ({bestStreakDate})</div>
        </div>

        {/* Current streak display */}
        <div className="text-center mb-4">
          <p className="text-5xl font-black text-orange-400">{currentStreak}</p>
          <p className="text-xs text-[#8b949e] mt-1">day streak</p>
          <p className="text-[10px] text-orange-400/70 mt-1 font-medium italic">{motivationalText}</p>
        </div>

        {/* 7-day history */}
        <div className="flex justify-between gap-1 mb-4">
          {STREAK_HISTORY.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  day.completed
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-[#21262d] border-[#30363d]'
                }`}
              >
                {day.completed ? (
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Minus className="h-3 w-3 text-[#484f58]" />
                )}
              </div>
              <span className={`text-[9px] ${day.completed ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                {day.day}
              </span>
            </div>
          ))}
        </div>

        {/* Streak milestones */}
        <div className="border-t border-[#30363d] pt-3">
          <p className="text-[10px] text-[#8b949e] font-medium mb-2">Milestones</p>
          <div className="grid grid-cols-2 gap-2">
            {STREAK_MILESTONES.map((milestone) => (
              <div
                key={milestone.days}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg border ${
                  milestone.unlocked
                    ? 'bg-emerald-500/8 border-emerald-500/20'
                    : 'bg-[#21262d] border-[#30363d] opacity-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  milestone.unlocked ? 'bg-emerald-500/15' : 'bg-[#30363d]'
                }`}>
                  {milestone.unlocked ? (
                    <Star className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <span className="text-[8px] text-[#484f58] font-bold">{milestone.days}d</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold truncate ${
                    milestone.unlocked ? 'text-emerald-400' : 'text-[#8b949e]'
                  }`}>
                    {milestone.label}
                  </p>
                  <p className="text-[8px] text-[#484f58] truncate">{milestone.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Challenge Difficulty Analytics
// ============================================================

const DIFFICULTY_STATS = [
  { difficulty: 'Easy', completionRate: 92, avgScore: 380, color: '#22c55e' },
  { difficulty: 'Medium', completionRate: 74, avgScore: 290, color: '#f59e0b' },
  { difficulty: 'Hard', completionRate: 48, avgScore: 195, color: '#f97316' },
  { difficulty: 'Expert', completionRate: 21, avgScore: 120, color: '#ef4444' },
];

const RADAR_DATA = [
  { label: 'Shooting', value: 85 },
  { label: 'Passing', value: 72 },
  { label: 'Dribbling', value: 60 },
  { label: 'Defending', value: 45 },
  { label: 'Speed', value: 78 },
  { label: 'Aerial', value: 35 },
];

function ChallengeDifficultyAnalytics() {
  const weakest = RADAR_DATA.reduce((min, d) => d.value < min.value ? d : min);
  const strongest = RADAR_DATA.reduce((max, d) => d.value > max.value ? d : max);

  const radarSize = 120;
  const radarCenter = 150;
  const radarTop = 90;
  const maxRadius = 80;
  const numAxes = RADAR_DATA.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: radarCenter + r * Math.cos(angle),
      y: radarTop + r * Math.sin(angle),
    };
  };

  const gridPoints = (radiusFraction: number) => {
    return Array.from({ length: numAxes }, (_, i) => {
      const pt = getPoint(i, radiusFraction * 100);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  const dataPoints = RADAR_DATA.map((d, i) => getPoint(i, d.value));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const axisEndpoints = RADAR_DATA.map((_, i) => getPoint(i, 100));

  return (
    <Card className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Analytics</h3>
          </div>
        </div>

        {/* Difficulty completion rates */}
        <div className="space-y-2 mb-4">
          {DIFFICULTY_STATS.map((stat) => (
            <div key={stat.difficulty}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#8b949e]">{stat.difficulty}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#8b949e]">Avg: {stat.avgScore}</span>
                  <span className="font-semibold" style={{ color: stat.color }}>{stat.completionRate}%</span>
                </div>
              </div>
              <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
                <motion.div
                  className="h-full rounded-md"
                  style={{ backgroundColor: stat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.completionRate}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* SVG Radar Chart */}
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 300 240" className="w-full" style={{ maxHeight: 240 }}>
            {/* Background grid rings */}
            {[0.25, 0.5, 0.75, 1].map((fraction) => (
              <polygon
                key={fraction}
                points={gridPoints(fraction)}
                fill="none"
                stroke="#30363d"
                strokeWidth="0.5"
              />
            ))}

            {/* Axis lines */}
            {axisEndpoints.map((pt, i) => (
              <line
                key={i}
                x1={radarCenter}
                y1={radarTop}
                x2={pt.x}
                y2={pt.y}
                stroke="#30363d"
                strokeWidth="0.5"
              />
            ))}

            {/* Data polygon */}
            <polygon
              points={dataPolygon}
              fill="rgba(34,197,94,0.15)"
              stroke="#22c55e"
              strokeWidth="1.5"
            />

            {/* Data points and labels */}
            {RADAR_DATA.map((d, i) => {
              const pt = dataPoints[i];
              return (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="3" fill="#22c55e" />
                  <circle cx={pt.x} cy={pt.y} r="1.5" fill="#0d1117" />
                  <text
                    x={pt.x + (pt.x > radarCenter ? 10 : -10)}
                    y={pt.y + (pt.y > radarTop ? 14 : -6)}
                    textAnchor={pt.x > radarCenter ? 'start' : 'end'}
                    fill="#8b949e"
                    fontSize="8"
                    fontWeight="600"
                  >
                    {d.label}
                  </text>
                  <text
                    x={pt.x + (pt.x > radarCenter ? 10 : -10)}
                    y={pt.y + (pt.y > radarTop ? 24 : 4)}
                    textAnchor={pt.x > radarCenter ? 'start' : 'end'}
                    fill="#c9d1d9"
                    fontSize="7"
                    fontWeight="700"
                  >
                    {d.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Weakest / Strongest indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/15">
            <p className="text-[10px] text-red-400 font-medium">Weakest Area</p>
            <p className="text-xs font-bold text-red-400 mt-0.5">{weakest.label} ({weakest.value})</p>
            <p className="text-[8px] text-[#8b949e] mt-0.5">Try more {weakest.label.toLowerCase()} challenges to improve</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
            <p className="text-[10px] text-emerald-400 font-medium">Strongest Area</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">{strongest.label} ({strongest.value})</p>
            <p className="text-[8px] text-[#8b949e] mt-0.5">Your best performing category</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Reward Showcase
// ============================================================

const REWARD_ITEMS = [
  { id: 'r1', name: 'XP Boost (2x)', icon: <Zap className="h-5 w-5 text-amber-400" />, rarity: 'Rare' as const, dateEarned: 'Dec 18', equipped: true, value: 500 },
  { id: 'r2', name: 'Coin Bundle', icon: <Gift className="h-5 w-5 text-emerald-400" />, rarity: 'Common' as const, dateEarned: 'Dec 17', equipped: false, value: 1000 },
  { id: 'r3', name: 'Elite Boots', icon: <Star className="h-5 w-5 text-purple-400" />, rarity: 'Epic' as const, dateEarned: 'Dec 15', equipped: true, value: 2500 },
  { id: 'r4', name: 'Training Kit', icon: <Trophy className="h-5 w-5 text-blue-400" />, rarity: 'Rare' as const, dateEarned: 'Dec 12', equipped: false, value: 750 },
  { id: 'r5', name: 'Streak Shield', icon: <Shield className="h-5 w-5 text-cyan-400" />, rarity: 'Common' as const, dateEarned: 'Dec 10', equipped: false, value: 300 },
  { id: 'r6', name: 'Golden Ball', icon: <Crown className="h-5 w-5 text-amber-300" />, rarity: 'Epic' as const, dateEarned: 'Dec 5', equipped: true, value: 3000 },
];

function RewardShowcase() {
  const totalValue = REWARD_ITEMS.reduce((sum, r) => sum + r.value, 0);

  const rarityStyle: Record<string, { border: string; bg: string; text: string }> = {
    Common: { border: 'border-[#8b949e]/20', bg: 'bg-[#21262d]', text: 'text-[#8b949e]' },
    Rare: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400' },
    Epic: { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400' },
  };

  return (
    <Card className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Rewards</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#8b949e]">Total value:</span>
            <span className="text-xs font-bold text-emerald-400">{totalValue.toLocaleString()} coins</span>
          </div>
        </div>

        {/* Reward grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {REWARD_ITEMS.map((reward) => {
            const rarity = rarityStyle[reward.rarity];
            return (
              <div
                key={reward.id}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${rarity.border} ${rarity.bg} transition-colors hover:brightness-110`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#0d1117] flex items-center justify-center shrink-0">
                  {reward.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#c9d1d9] truncate">{reward.name}</p>
                  <p className={`text-[9px] ${rarity.text} font-medium`}>{reward.rarity}</p>
                  <p className="text-[8px] text-[#484f58]">{reward.dateEarned}</p>
                </div>
                {reward.equipped && (
                  <span className="absolute top-1 right-1 text-[7px] bg-emerald-500/15 text-emerald-400 px-1 py-0 rounded border border-emerald-500/20 font-bold">
                    ON
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Reward shop teaser */}
        <Button className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs h-8 border border-[#30363d]">
          <Gift className="h-3 w-3 mr-1" />
          Open Reward Shop
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
