'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import {
  Mic, TrendingUp, TrendingDown, Newspaper,
  Heart, Flame, X, Shield, Star, MessageSquare
} from 'lucide-react';
import type { MatchResult } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================
type AnswerStyle = 'confident' | 'cautious' | 'controversial';

interface PressConferenceQuestion {
  id: string;
  text: string;
  category: string;
  answers: {
    style: AnswerStyle;
    text: string;
    moraleEffect: number;
    reputationEffect: number;
  }[];
}

interface AnswerRecord {
  questionId: string;
  style: AnswerStyle;
  moraleEffect: number;
  reputationEffect: number;
}

// ============================================================
// Pre-match question pools
// ============================================================
const PRE_MATCH_QUESTIONS: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "Your thoughts on the upcoming match against {opponent}?",
    category: 'opponent',
    answers: [
      { style: 'confident', text: "We're fully prepared. I expect us to get the three points.", moraleEffect: 3, reputationEffect: 2 },
      { style: 'cautious', text: "It'll be a tough test. We respect them but believe in ourselves.", moraleEffect: 1, reputationEffect: 1 },
      { style: 'controversial', text: "We should beat them easily. Anything less would be disappointing.", moraleEffect: 2, reputationEffect: 3 },
    ],
  },
  {
    text: "How is your form heading into this game?",
    category: 'form',
    answers: [
      { style: 'confident', text: "I'm feeling sharp. Training has been excellent this week.", moraleEffect: 4, reputationEffect: 2 },
      { style: 'cautious', text: "I'm working hard to find my best level. Every session counts.", moraleEffect: 2, reputationEffect: 1 },
      { style: 'controversial', text: "My form has been the best on the team. Others need to step up.", moraleEffect: 1, reputationEffect: 4 },
    ],
  },
  {
    text: "Any changes to your preparation this week?",
    category: 'preparation',
    answers: [
      { style: 'confident', text: "We've studied them thoroughly. We know exactly what to do.", moraleEffect: 3, reputationEffect: 1 },
      { style: 'cautious', text: "Just the usual routine — focused training and recovery.", moraleEffect: 1, reputationEffect: 1 },
      { style: 'controversial', text: "I've been doing extra sessions because some players aren't pulling their weight.", moraleEffect: -2, reputationEffect: 3 },
    ],
  },
  {
    text: "What's your target for this match?",
    category: 'target',
    answers: [
      { style: 'confident', text: "Three points and a strong performance. Nothing less.", moraleEffect: 4, reputationEffect: 2 },
      { style: 'cautious', text: "A solid team display. Results will take care of themselves.", moraleEffect: 1, reputationEffect: 2 },
      { style: 'controversial', text: "I want to score and make a statement. The spotlight should be on me.", moraleEffect: 2, reputationEffect: 4 },
    ],
  },
];

// ============================================================
// Post-match question pools
// ============================================================
const POST_MATCH_GENERIC: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "What are your thoughts on the team's overall performance?",
    category: 'overall',
    answers: [
      { style: 'confident', text: "We showed real character and quality out there today.", moraleEffect: 3, reputationEffect: 1 },
      { style: 'cautious', text: "There were positives but also areas we need to improve.", moraleEffect: 1, reputationEffect: 2 },
      { style: 'controversial', text: "Some players didn't show up. We need better from everyone.", moraleEffect: -3, reputationEffect: 3 },
    ],
  },
];

const POST_MATCH_WIN: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "Brilliant performance! What was the key to victory?",
    category: 'victory',
    answers: [
      { style: 'confident', text: "Our quality shone through. We controlled the game from start to finish.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'cautious', text: "Great team effort. Everyone contributed to this result.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "I told you we'd win. This team is built around me.", moraleEffect: 3, reputationEffect: 5 },
    ],
  },
];

const POST_MATCH_LOSS: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "Tough result today. What went wrong?",
    category: 'defeat',
    answers: [
      { style: 'confident', text: "One bad game won't define our season. We'll bounce back.", moraleEffect: 4, reputationEffect: 1 },
      { style: 'cautious', text: "We have to be honest — we weren't good enough today.", moraleEffect: 1, reputationEffect: 3 },
      { style: 'controversial', text: "The referee was a disgrace. Everyone saw it.", moraleEffect: -4, reputationEffect: 4 },
    ],
  },
];

const POST_MATCH_DRAW: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "A hard-fought draw. How do you feel about the result?",
    category: 'draw',
    answers: [
      { style: 'confident', text: "We deserved more, but we take the point and move on.", moraleEffect: 3, reputationEffect: 1 },
      { style: 'cautious', text: "A fair result. Both teams had their moments.", moraleEffect: 1, reputationEffect: 2 },
      { style: 'controversial', text: "Dropped points. We should be winning these games.", moraleEffect: -2, reputationEffect: 3 },
    ],
  },
];

const POST_MATCH_GOAL: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "Your goal was fantastic. Talk us through it.",
    category: 'goal',
    answers: [
      { style: 'confident', text: "I saw the opening and took it. That's what I do.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'cautious', text: "Great team build-up. I was just in the right place at the right time.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "I should have had a hat-trick. One goal isn't enough.", moraleEffect: 1, reputationEffect: 5 },
    ],
  },
];

const POST_MATCH_CARD: Omit<PressConferenceQuestion, 'id'>[] = [
  {
    text: "The yellow card — was it deserved?",
    category: 'card',
    answers: [
      { style: 'confident', text: "I play with intensity. That's part of my game.", moraleEffect: 3, reputationEffect: -1 },
      { style: 'cautious', text: "I need to be smarter in those situations. Lesson learned.", moraleEffect: 1, reputationEffect: 2 },
      { style: 'controversial', text: "That was never a card. The referee needs to look at himself.", moraleEffect: -3, reputationEffect: 3 },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function determineResult(result: MatchResult): 'win' | 'draw' | 'loss' {
  const clubId = useGameStore.getState().gameState?.currentClub.id;
  if (!clubId) return 'draw';
  const isHome = result.homeClub.id === clubId;
  const myScore = isHome ? result.homeScore : result.awayScore;
  const theirScore = isHome ? result.awayScore : result.homeScore;
  if (myScore > theirScore) return 'win';
  if (myScore < theirScore) return 'loss';
  return 'draw';
}

function playerGotCard(result: MatchResult): boolean {
  const playerId = useGameStore.getState().gameState?.player.id;
  if (!playerId) return false;
  return result.events.some(
    e => e.playerId === playerId && (e.type === 'yellow_card' || e.type === 'red_card' || e.type === 'second_yellow')
  );
}

function generatePreMatchQuestions(opponentName: string): PressConferenceQuestion[] {
  const filled = PRE_MATCH_QUESTIONS.map(q => ({
    ...q,
    text: q.text.replace('{opponent}', opponentName),
    id: `pre-${q.category}-${Date.now()}`,
  }));
  return pickRandom(filled, 4);
}

function generatePostMatchQuestions(result: MatchResult): PressConferenceQuestion[] {
  const pool: Omit<PressConferenceQuestion, 'id'>[] = [];
  const outcome = determineResult(result);

  if (outcome === 'win') pool.push(...POST_MATCH_WIN);
  else if (outcome === 'loss') pool.push(...POST_MATCH_LOSS);
  else pool.push(...POST_MATCH_DRAW);

  pool.push(...POST_MATCH_GENERIC);

  if (result.playerGoals > 0) pool.push(...POST_MATCH_GOAL);
  if (playerGotCard(result)) pool.push(...POST_MATCH_CARD);

  const selected = pickRandom(pool, 4);
  return selected.map((q, i) => ({ ...q, id: `post-${i}-${Date.now()}` }));
}

// ============================================================
// Compute media rating (0-100)
// ============================================================
function computeMediaRating(answers: AnswerRecord[]): number {
  let score = 50;
  for (const a of answers) {
    if (a.style === 'cautious') score += 10;
    else if (a.style === 'confident') score += 4;
    else if (a.style === 'controversial') score -= 8;
    score += a.reputationEffect * 1.2;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// Reporter data
// ============================================================
const REPORTER_AVATARS = ['🧑‍💼', '👩‍💼', '🧑‍🎤', '👨‍💻', '👩‍🏫', '🧑‍🔬', '👨‍🎨', '👩‍⚖️'];
const REPORTER_NAMES = [
  'Sky Sports News', 'BBC Sport', 'The Athletic', 'ESPN FC',
  'Daily Mail Sport', 'Guardian Football', 'TalkSport', 'The Times Sport'
];

// ============================================================
// Answer style config
// ============================================================
const STYLE_CONFIG: Record<AnswerStyle, {
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  riskLabel: string;
  riskColor: string;
}> = {
  confident: {
    label: 'Confident',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-400',
    riskLabel: 'Low Risk',
    riskColor: 'text-emerald-400',
  },
  cautious: {
    label: 'Cautious',
    icon: <Shield className="w-3.5 h-3.5" />,
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20',
    textColor: 'text-sky-400',
    riskLabel: 'Safe',
    riskColor: 'text-sky-400',
  },
  controversial: {
    label: 'Controversial',
    icon: <Flame className="w-3.5 h-3.5" />,
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    textColor: 'text-amber-400',
    riskLabel: 'High Risk',
    riskColor: 'text-amber-400',
  },
};

// ============================================================
// Main Component Props
// ============================================================
export interface PressConferenceProps {
  type: 'pre-match' | 'post-match';
  open: boolean;
  onClose: () => void;
  matchResult?: MatchResult | null;
  opponentName: string;
  playerForm: number;
  playerMorale: number;
}

// ============================================================
// Main Component
// ============================================================
export default function PressConference({
  type,
  open,
  onClose,
  matchResult,
  opponentName,
  playerForm,
  playerMorale,
}: PressConferenceProps) {
  const gameState = useGameStore(state => state.gameState);
  const player = gameState?.player;
  const currentClub = gameState?.currentClub;

  // Generate questions (re-generated when open or type changes)
  const [openKey, setOpenKey] = useState(0);

  const questions = useMemo(() => {
    if (!open) return [];
    if (type === 'pre-match') {
      return generatePreMatchQuestions(opponentName);
    } else if (matchResult) {
      return generatePostMatchQuestions(matchResult);
    }
    return [];
  }, [openKey, type, matchResult, opponentName]);

  const [phase, setPhase] = useState<'intro' | 'questions' | 'summary'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showQuestion, setShowQuestion] = useState(false);

  // Track open changes to trigger question regeneration
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Just opened — reset all state for fresh conference
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally resetting state on modal open
      setOpenKey(k => k + 1);
      setCurrentIdx(0);
      setAnswers([]);
      setPhase('intro');
      setShowQuestion(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Auto-transition from intro to questions after delay
  useEffect(() => {
    if (open && phase === 'intro' && questions.length > 0) {
      const timer = setTimeout(() => {
        setPhase('questions');
        setShowQuestion(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [open, phase, questions.length]);

  const currentQuestion = questions[currentIdx];
  const allAnswered = currentIdx >= questions.length;

  const handleAnswer = (style: AnswerStyle) => {
    if (!currentQuestion) return;
    const answer = currentQuestion.answers.find(a => a.style === style);
    if (!answer) return;

    setAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      style,
      moraleEffect: answer.moraleEffect,
      reputationEffect: answer.reputationEffect,
    }]);

    setShowQuestion(false);
    const isLast = currentIdx >= questions.length - 1;
    setTimeout(() => {
      if (isLast) {
        setPhase('summary');
      } else {
        setCurrentIdx(prev => prev + 1);
        setShowQuestion(true);
      }
    }, 350);
  };

  const handleApplyEffects = useCallback(() => {
    const gs = useGameStore.getState().gameState;
    if (!gs) return;

    let totalMorale = 0;
    let totalRep = 0;
    for (const a of answers) {
      totalMorale += a.moraleEffect;
      totalRep += a.reputationEffect;
    }

    const newMorale = Math.max(0, Math.min(100, gs.player.morale + totalMorale));
    const newReputation = Math.max(0, Math.min(100, gs.player.reputation + totalRep));

    useGameStore.setState({
      gameState: {
        ...gs,
        player: {
          ...gs.player,
          morale: newMorale,
          reputation: newReputation,
        },
      },
    });

    onClose();
  }, [answers, onClose]);

  // Computed summary values
  const mediaRating = useMemo(() => computeMediaRating(answers), [answers]);
  const totalMoraleEffect = useMemo(() => answers.reduce((s, a) => s + a.moraleEffect, 0), [answers]);
  const totalRepEffect = useMemo(() => answers.reduce((s, a) => s + a.reputationEffect, 0), [answers]);

  if (!open || !player || !currentClub) return null;

  const reporterIdx = currentIdx % REPORTER_AVATARS.length;
  const reporterAvatar = REPORTER_AVATARS[reporterIdx];
  const reporterName = REPORTER_NAMES[reporterIdx];

  const ratingLabel = mediaRating < 33 ? 'Negative' : mediaRating < 66 ? 'Mixed' : 'Positive';
  const ratingColor = mediaRating < 33 ? 'text-red-400' : mediaRating < 66 ? 'text-amber-400' : 'text-emerald-400';
  const ratingBadgeClass = mediaRating < 33
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : mediaRating < 66
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin rounded-lg bg-[#161b22] border border-[#30363d]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ==================== INTRO PHASE ==================== */}
            {phase === 'intro' && (
              <div className="relative p-8 text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-5xl mb-4"
                >
                  {type === 'pre-match' ? '🎙️' : '📰'}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-black text-white tracking-wider"
                >
                  {type === 'pre-match' ? 'PRE-MATCH' : 'POST-MATCH'} PRESS CONFERENCE
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3 flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">{currentClub.logo}</span>
                  <div>
                    <p className="text-sm text-[#c9d1d9] font-medium">{player.name.split(' ').pop()}</p>
                    <p className="text-[10px] text-[#8b949e]">
                      {type === 'pre-match'
                        ? `vs ${opponentName}`
                        : matchResult
                          ? `${matchResult.homeClub.shortName || matchResult.homeClub.name.slice(0, 3)} ${matchResult.homeScore}-${matchResult.awayScore} ${matchResult.awayClub.shortName || matchResult.awayClub.name.slice(0, 3)}`
                          : 'Post-Match'
                      }
                    </p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ==================== QUESTIONS PHASE ==================== */}
            {phase === 'questions' && currentQuestion && (
              <div className="relative p-5">
                {/* Header bar */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                      {type === 'pre-match' ? 'PRE-MATCH' : 'POST-MATCH'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8b949e]">
                    Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}
                  </span>
                  <div className="flex-1" />
                  <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                    🎙️ Press Room
                  </Badge>
                </div>

                {/* Progress indicator */}
                <div className="flex gap-2 mb-5 justify-center">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i < currentIdx
                          ? 'bg-emerald-400'
                          : i === currentIdx
                          ? 'bg-amber-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Question area */}
                <AnimatePresence mode="wait">
                  {showQuestion && (
                    <motion.div
                      key={currentIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Reporter */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xl">
                          {reporterAvatar}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#c9d1d9]">{reporterName}</p>
                          <p className="text-[9px] text-[#8b949e]">Football Correspondent</p>
                        </div>
                      </div>

                      {/* Question bubble with emerald left border */}
                      <div className="bg-[#21262d] border border-[#30363d] border-l-4 border-l-emerald-500 rounded-lg p-4 mb-5">
                        <p className="text-sm text-[#c9d1d9] leading-relaxed">
                          {currentQuestion.text}
                        </p>
                      </div>

                      {/* Response cards */}
                      <div className="space-y-2.5">
                        {currentQuestion.answers.map((answer) => {
                          const config = STYLE_CONFIG[answer.style];
                          return (
                            <button
                              key={answer.style}
                              onClick={() => handleAnswer(answer.style)}
                              className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 ${config.borderColor} ${config.bgColor} group cursor-pointer`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}>
                                  {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold ${config.textColor}`}>{config.label}</span>
                                    <span className={`text-[9px] font-medium ${config.riskColor} opacity-70`}>
                                      {config.riskLabel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                                    {answer.text}
                                  </p>
                                  {/* Effect preview */}
                                  <div className="flex gap-2 mt-2">
                                    {answer.moraleEffect !== 0 && (
                                      <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.moraleEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {answer.moraleEffect > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        Morale {answer.moraleEffect > 0 ? '+' : ''}{answer.moraleEffect}
                                      </span>
                                    )}
                                    {answer.reputationEffect !== 0 && (
                                      <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.reputationEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {answer.reputationEffect > 0 ? <Star className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        Rep {answer.reputationEffect > 0 ? '+' : ''}{answer.reputationEffect}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ==================== SUMMARY PHASE ==================== */}
            {phase === 'summary' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="relative p-5"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                  <Newspaper className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Conference Summary</span>
                </div>

                {/* Media Rating */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-4 text-center"
                >
                  <p className="text-[10px] text-[#8b949e] font-semibold mb-2">Media Rating</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-4xl font-black ${ratingColor}`}>{mediaRating}</span>
                    <span className="text-xs text-[#8b949e]">/ 100</span>
                  </div>
                  <Badge className={`mt-2 text-[10px] ${ratingBadgeClass}`}>
                    {ratingLabel} Coverage
                  </Badge>
                </motion.div>

                {/* Morale Change */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] text-rose-400 font-bold">Morale Change</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Morale</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8b949e]">{playerMorale}</span>
                      <span className={`text-sm font-bold flex items-center gap-0.5 ${totalMoraleEffect >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalMoraleEffect >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {totalMoraleEffect > 0 ? '+' : ''}{totalMoraleEffect}
                      </span>
                      <span className="text-sm text-white font-bold">{Math.max(0, Math.min(100, playerMorale + totalMoraleEffect))}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Reputation Change */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-amber-400 font-bold">Reputation Change</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Reputation</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8b949e]">{player.reputation}</span>
                      <span className={`text-sm font-bold flex items-center gap-0.5 ${totalRepEffect >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalRepEffect >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {totalRepEffect > 0 ? '+' : ''}{totalRepEffect}
                      </span>
                      <span className="text-sm text-white font-bold">{Math.max(0, Math.min(100, player.reputation + totalRepEffect))}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Answer breakdown */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#21262d] border border-[#30363d] rounded-lg p-4 mb-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] text-sky-400 font-bold">Your Responses</span>
                  </div>
                  <div className="space-y-2">
                    {answers.map((a, i) => {
                      const cfg = STYLE_CONFIG[a.style];
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#484f58] font-mono w-4">{i + 1}.</span>
                          <span className={`text-[10px] font-bold ${cfg.textColor}`}>{cfg.label}</span>
                          <div className="flex-1" />
                          {a.moraleEffect !== 0 && (
                            <span className={`text-[9px] ${a.moraleEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {a.moraleEffect > 0 ? '+' : ''}{a.moraleEffect} morale
                            </span>
                          )}
                          {a.reputationEffect !== 0 && (
                            <span className={`text-[9px] ${a.reputationEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {a.reputationEffect > 0 ? '+' : ''}{a.reputationEffect} rep
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Confirm button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={handleApplyEffects}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm & Apply Effects
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
