'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Camera, ThumbsUp, ThumbsDown, MessageSquare,
  Heart, Star, TrendingUp, TrendingDown, Newspaper, Share2,
  Eye, X, Sparkles, Flame, AlertTriangle, CheckCircle2,
  ChevronRight, Zap, Minus
} from 'lucide-react';
import type { MatchResult } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================
type AnswerStyle = 'confident' | 'humble' | 'controversial';

interface MediaQuestion {
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
// Question generation pools
// ============================================================
const WIN_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "Brilliant performance today! What was the key to your team's dominant display?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "We were simply the better side. Our quality showed from the first whistle.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "Full credit to the whole team — everyone worked incredibly hard today.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "We should be winning like this every week. Anything less is unacceptable.", moraleEffect: 8, reputationEffect: -2 },
    ],
  },
  {
    text: "Three points in the bag — are you now thinking about a title challenge?",
    category: 'ambition',
    answers: [
      { style: 'confident', text: "Absolutely. We have the quality to compete at the very top.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "We take it one game at a time. There's still a long way to go.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "If we don't win the league, it's a failure. Simple as that.", moraleEffect: -5, reputationEffect: 5 },
    ],
  },
  {
    text: "The team spirit looks incredible right now. What's the atmosphere like in the dressing room?",
    category: 'team_spirit',
    answers: [
      { style: 'confident', text: "The bond is unbreakable. We back each other 100%.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "We're a family. Every player fights for the person next to them.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "Honestly? Some players need to work harder. I'm carrying this team.", moraleEffect: -5, reputationEffect: -3 },
    ],
  },
];

const DRAW_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "A point today, but you must feel like chances were missed. What's your assessment?",
    category: 'missed_chances',
    answers: [
      { style: 'confident', text: "We created enough to win. The goals will come, I'm sure of it.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "We have to be more clinical. Credit to the opposition, they made it tough.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "We were robbed. The finishing was embarrassing — myself included.", moraleEffect: -5, reputationEffect: -3 },
    ],
  },
  {
    text: "The manager made some tactical changes today. Do you think they worked?",
    category: 'tactics',
    answers: [
      { style: 'confident', text: "We trust the gaffer completely. The system is working.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "We're still adapting. It takes time for new ideas to click.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "We need to be braver. Playing safe isn't going to get us anywhere.", moraleEffect: -3, reputationEffect: -2 },
    ],
  },
  {
    text: "What needs to change to turn draws into wins going forward?",
    category: 'improvement',
    answers: [
      { style: 'confident', text: "Nothing major — just a bit more composure in the final third.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "We need to keep working hard on the training ground. Details matter.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "Maybe some players shouldn't be starting. We need more quality.", moraleEffect: -5, reputationEffect: -3 },
    ],
  },
];

const LOSS_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "Tough result today. Where did it go wrong for the team?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "One bad day doesn't define us. We'll bounce back stronger.", moraleEffect: 5, reputationEffect: 1 },
      { style: 'humble', text: "We weren't good enough. We have to hold our hands up and accept that.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "The referee cost us. That's the reality and everyone knows it.", moraleEffect: -5, reputationEffect: -3 },
    ],
  },
  {
    text: "Team morale must be low after this. How do you lift the squad for the next match?",
    category: 'morale',
    answers: [
      { style: 'confident', text: "We're fighters. One setback won't break our spirit.", moraleEffect: 5, reputationEffect: 1 },
      { style: 'humble', text: "It's about staying together and working through it as a team.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "Some players need to look in the mirror. The effort wasn't there.", moraleEffect: -8, reputationEffect: -3 },
    ],
  },
  {
    text: "Are you worried about the direction the team is heading?",
    category: 'future',
    answers: [
      { style: 'confident', text: "Not at all. This is a bump in the road. Trust the process.", moraleEffect: 5, reputationEffect: 1 },
      { style: 'humble', text: "We need to be honest about where we are and improve every day.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "If things don't change, I might have to consider my future here.", moraleEffect: -8, reputationEffect: 5 },
    ],
  },
];

const GREAT_RATING_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "Outstanding individual display! You were the best player on the pitch — how does it feel?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "This is what I do. I set high standards and I deliver.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "I'm just grateful to help the team. My teammates made it easy.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "About time I got the recognition I deserve. I've been doing this all season.", moraleEffect: 8, reputationEffect: -3 },
    ],
  },
  {
    text: "Your rating today was exceptional. Do you feel you've reached a new level?",
    category: 'achievement',
    answers: [
      { style: 'confident', text: "I've worked hard for this. I know what I'm capable of.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "There's always room to improve. I'm just getting started.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "I've been at this level for a while — people are just noticing now.", moraleEffect: 8, reputationEffect: -2 },
    ],
  },
];

const GOAL_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "You found the back of the net today! Take us through that goal...",
    category: 'goal',
    answers: [
      { style: 'confident', text: "It's what I'm paid to do. I knew exactly where to be.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "Great build-up play from the team. I just had to finish it off.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "Should've had more. Their defence was there for the taking.", moraleEffect: 8, reputationEffect: -2 },
    ],
  },
  {
    text: "That goal could be a turning point for your season. How important was it?",
    category: 'goal',
    answers: [
      { style: 'confident', text: "Every goal is important. But I always back myself to deliver.", moraleEffect: 5, reputationEffect: 2 },
      { style: 'humble', text: "It means a lot, especially after the hard work in training.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "I should be scoring every game. One goal is the bare minimum.", moraleEffect: -5, reputationEffect: 5 },
    ],
  },
];

const CARD_QUESTIONS: Omit<MediaQuestion, 'id'>[] = [
  {
    text: "You received a card today. Was it justified or do you feel hard done by?",
    category: 'discipline',
    answers: [
      { style: 'confident', text: "I play on the edge — that's my game. No apologies.", moraleEffect: 5, reputationEffect: -1 },
      { style: 'humble', text: "I have to be smarter. You can't help the team from the sideline.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "The officials need to understand the intensity of the game. That was never a card.", moraleEffect: -3, reputationEffect: -3 },
    ],
  },
  {
    text: "Discipline has been a talking point. Do you need to rein it in?",
    category: 'discipline',
    answers: [
      { style: 'confident', text: "I know where the line is. This is professional football, not a tea party.", moraleEffect: 5, reputationEffect: -2 },
      { style: 'humble', text: "I'll learn from it. I don't want to let my teammates down.", moraleEffect: 2, reputationEffect: 3 },
      { style: 'controversial', text: "Maybe if referees did their job properly, I wouldn't need to make those challenges.", moraleEffect: -5, reputationEffect: -3 },
    ],
  },
];

// ============================================================
// Helper: Pick N random items
// ============================================================
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ============================================================
// Helper: Generate questions based on match result
// ============================================================
function generateQuestions(result: MatchResult): MediaQuestion[] {
  const isHome = result.homeClub.id === useGameStore.getState().gameState?.currentClub.id;
  const playerScore = isHome ? result.homeScore : result.awayScore;
  const opponentScore = isHome ? result.awayScore : result.homeScore;
  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;

  const questions: Omit<MediaQuestion, 'id'>[] = [];

  // Base questions by result
  if (won) {
    questions.push(...pickRandom(WIN_QUESTIONS, 2));
  } else if (drew) {
    questions.push(...pickRandom(DRAW_QUESTIONS, 2));
  } else {
    questions.push(...pickRandom(LOSS_QUESTIONS, 2));
  }

  // Great personal rating
  if (result.playerRating >= 8.0) {
    questions.push(...pickRandom(GREAT_RATING_QUESTIONS, 1));
  }

  // Scored a goal
  if (result.playerGoals > 0) {
    questions.push(...pickRandom(GOAL_QUESTIONS, 1));
  }

  // Got a card
  const playerCards = result.events.filter(
    e => e.playerId === useGameStore.getState().gameState?.player.id &&
    (e.type === 'yellow_card' || e.type === 'red_card' || e.type === 'second_yellow')
  );
  if (playerCards.length > 0) {
    questions.push(...pickRandom(CARD_QUESTIONS, 1));
  }

  // Pick exactly 3
  const selected = pickRandom(questions, 3);

  return selected.map((q, i) => ({
    ...q,
    id: `q-${i}-${Date.now()}`,
  }));
}

// ============================================================
// Helper: Generate headline based on answers
// ============================================================
function generateHeadline(answers: AnswerRecord[], result: MatchResult, playerName: string): string {
  const isHome = result.homeClub.id === useGameStore.getState().gameState?.currentClub.id;
  const playerScore = isHome ? result.homeScore : result.awayScore;
  const opponentScore = isHome ? result.awayScore : result.homeScore;
  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;

  const controversialCount = answers.filter(a => a.style === 'controversial').length;
  const confidentCount = answers.filter(a => a.style === 'confident').length;
  const humbleCount = answers.filter(a => a.style === 'humble').length;

  if (controversialCount >= 2) {
    if (won) return `${playerName} Sparks Outrage with Post-Match Comments After Win`;
    if (drew) return `${playerName} Blasts Teammates in Explosive Press Conference`;
    return `${playerName} Lashes Out After Humiliating Defeat`;
  }
  if (controversialCount === 1) {
    if (won) return `${playerName} Fires Warning to Rivals Despite Victory`;
    return `${playerName} Makes Bold Claims in Tense Press Conference`;
  }
  if (confidentCount >= 2) {
    if (won) return `${playerName} Sends Strong Message with Confident Post-Match Interview`;
    return `${playerName} Remains Defiant Despite Setback`;
  }
  if (humbleCount >= 2) {
    if (won) return `${playerName} Stays Grounded After Impressive Performance`;
    if (drew) return `${playerName} Vows to Improve After Honest Self-Assessment`;
    return `${playerName} Takes Responsibility in Classy Post-Match Interview`;
  }
  if (won) return `${playerName} Pleased with Team Performance in Victory`;
  if (drew) return `${playerName} Reflects on Hard-Fought Draw`;
  return `${playerName} Disappointed but Determined After Loss`;
}

// ============================================================
// Helper: Compute media sentiment (0-100)
// ============================================================
function computeSentiment(answers: AnswerRecord[]): number {
  let score = 50;
  for (const a of answers) {
    if (a.style === 'humble') score += 12;
    else if (a.style === 'confident') score += 5;
    else if (a.style === 'controversial') score -= 10;
    score += a.reputationEffect * 1.5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// Reporter Avatar data
// ============================================================
const REPORTER_AVATARS = ['🧑‍💼', '👩‍💼', '🧑‍🎤', '👨‍💻', '👩‍🏫', '🧑‍🔬', '👨‍🎨', '👩‍⚖️'];
const REPORTER_NAMES = [
  'Sky Sports News', 'BBC Sport', 'The Athletic', 'ESPN FC',
  'Daily Mail Sport', 'Guardian Football', 'TalkSport', 'The Times Sport'
];

// ============================================================
// SVG Sentiment Gauge
// ============================================================
function SentimentGauge({ value }: { value: number }) {
  const radius = 60;
  const strokeWidth = 10;
  const cx = 80;
  const cy = 70;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const valueAngle = startAngle + (value / 100) * totalAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const arcPath = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgColor = value < 33 ? '#ef4444' : value < 66 ? '#f59e0b' : '#10b981';
  const label = value < 33 ? 'Negative' : value < 66 ? 'Mixed' : 'Positive';

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc segments */}
        <path d={arcPath(startAngle, startAngle + totalAngle / 3)} stroke="#ef4444" strokeWidth={strokeWidth} fill="none" opacity={0.2} strokeLinecap="round" />
        <path d={arcPath(startAngle + totalAngle / 3, startAngle + (2 * totalAngle) / 3)} stroke="#f59e0b" strokeWidth={strokeWidth} fill="none" opacity={0.2} strokeLinecap="round" />
        <path d={arcPath(startAngle + (2 * totalAngle) / 3, endAngle)} stroke="#10b981" strokeWidth={strokeWidth} fill="none" opacity={0.2} strokeLinecap="round" />

        {/* Value arc */}
        <motion.path
          d={arcPath(startAngle, valueAngle)}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />

        {/* Needle dot */}
        <motion.circle
          cx={polarToCartesian(valueAngle).x}
          cy={polarToCartesian(valueAngle).y}
          r="6"
          fill={bgColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
        />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-2xl font-black" style={{ color: bgColor }}>{value}</span>
        <span className="text-xs text-[#8b949e] ml-1">/ 100</span>
      </div>
      <Badge className={`mt-1 text-[10px] ${value < 33 ? 'bg-red-500/20 text-red-400 border-red-500/30' : value < 66 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
        {label} Sentiment
      </Badge>
    </div>
  );
}

// ============================================================
// Typewriter component
// ============================================================
function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

// ============================================================
// Answer style config
// ============================================================
const ANSWER_STYLE_CONFIG: Record<AnswerStyle, {
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
  humble: {
    label: 'Humble',
    icon: <Heart className="w-3.5 h-3.5" />,
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
// Main PressConference Component
// ============================================================
interface PressConferenceProps {
  open: boolean;
  onClose: () => void;
  matchResult: MatchResult | null;
}

export default function PressConference({ open, onClose, matchResult }: PressConferenceProps) {
  const gameState = useGameStore(state => state.gameState);
  const player = gameState?.player;
  const currentClub = gameState?.currentClub;

  const [phase, setPhase] = useState<'flash' | 'questions' | 'reaction'>('flash');
  const [questions, setQuestions] = useState<MediaQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showQuestion, setShowQuestion] = useState(false);

  // Generate questions when modal opens
  useEffect(() => {
    if (open && matchResult) {
      const generated = generateQuestions(matchResult);
      setQuestions(generated);
      setCurrentQuestionIdx(0);
      setAnswers([]);
      setPhase('flash');
      setShowQuestion(false);

      // Flash phase → questions phase
      const flashTimer = setTimeout(() => {
        setPhase('questions');
        setShowQuestion(true);
      }, 1200);

      return () => clearTimeout(flashTimer);
    }
  }, [open, matchResult]);

  const currentQuestion = questions[currentQuestionIdx];
  const allAnswered = currentQuestionIdx >= questions.length;

  // Move to reaction phase when all questions answered
  useEffect(() => {
    if (allAnswered && answers.length === 3 && phase === 'questions') {
      const timer = setTimeout(() => setPhase('reaction'), 600);
      return () => clearTimeout(timer);
    }
  }, [allAnswered, answers.length, phase]);

  const handleAnswer = useCallback((answerStyle: AnswerStyle) => {
    if (!currentQuestion) return;

    const answer = currentQuestion.answers.find(a => a.style === answerStyle);
    if (!answer) return;

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      style: answerStyle,
      moraleEffect: answer.moraleEffect,
      reputationEffect: answer.reputationEffect,
    };

    setAnswers(prev => [...prev, record]);

    // Transition to next question
    setShowQuestion(false);
    setTimeout(() => {
      setCurrentQuestionIdx(prev => prev + 1);
      setShowQuestion(true);
    }, 400);
  }, [currentQuestion]);

  const handleApplyEffects = useCallback(() => {
    const store = useGameStore.getState();
    const gs = store.gameState;
    if (!gs) return;

    let totalMorale = 0;
    let totalReputation = 0;
    for (const a of answers) {
      totalMorale += a.moraleEffect;
      totalReputation += a.reputationEffect;
    }

    const newMorale = Math.max(0, Math.min(100, gs.player.morale + totalMorale));
    const newReputation = Math.max(0, Math.min(100, gs.player.reputation + totalReputation));

    // Use zustand's internal set through the store API
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

  // Compute reaction data
  const sentiment = useMemo(() => computeSentiment(answers), [answers]);
  const headline = useMemo(() => {
    if (!player || !matchResult) return '';
    return generateHeadline(answers, matchResult, player.name.split(' ').pop() || player.name);
  }, [answers, matchResult, player]);

  const totalMoraleEffect = useMemo(() => answers.reduce((sum, a) => sum + a.moraleEffect, 0), [answers]);
  const totalReputationEffect = useMemo(() => answers.reduce((sum, a) => sum + a.reputationEffect, 0), [answers]);

  // Social media counts (procedurally generated based on sentiment)
  const socialLikes = useMemo(() => Math.round((sentiment * 120 + Math.random() * 2000) * (answers.filter(a => a.style === 'controversial').length + 1)), [sentiment, answers]);
  const socialRetweets = useMemo(() => Math.round(socialLikes * (0.15 + Math.random() * 0.2)), [socialLikes]);

  if (!open || !matchResult || !player || !currentClub) return null;

  // Determine match result type
  const isHome = matchResult.homeClub.id === currentClub.id;
  const playerScore = isHome ? matchResult.homeScore : matchResult.awayScore;
  const opponentScore = isHome ? matchResult.awayScore : matchResult.homeScore;
  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;

  // Current reporter
  const reporterIdx = currentQuestionIdx % REPORTER_AVATARS.length;
  const reporterAvatar = REPORTER_AVATARS[reporterIdx];
  const reporterName = REPORTER_NAMES[reporterIdx];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 "
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin rounded-lg"
            style={{
              backgroundColor: '#161b22',
              border: '1px solid rgba(220, 38, 38, 0.15)',
            }}
          >
            {/* Red carpet / warm gradient overlay */}
            <div className="absolute inset-0 bg-red-950/5 pointer-events-none rounded-lg" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ==================== FLASH PHASE ==================== */}
            {phase === 'flash' && (
              <div className="relative p-8 text-center">
                {/* Camera flash effect */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="absolute inset-0 bg-white/30 pointer-events-none rounded-lg"
                />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="text-5xl mb-4"
                >
                  🎙️
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-black text-white tracking-wider"
                >
                  PRESS CONFERENCE
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">{currentClub.logo}</span>
                  <div>
                    <p className="text-sm text-[#c9d1d9] font-medium">{player.name.split(' ').pop()}</p>
                    <p className="text-[10px] text-[#8b949e]">
                      {won ? 'After Victory' : drew ? 'After Draw' : 'After Defeat'} • {matchResult.homeClub.shortName || matchResult.homeClub.name.slice(0, 3)} {matchResult.homeScore}-{matchResult.awayScore} {matchResult.awayClub.shortName || matchResult.awayClub.name.slice(0, 3)}
                    </p>
                  </div>
                </motion.div>

                {/* Flash effect dots */}
                <div className="absolute top-4 left-4 flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.2, delay: i * 0.15, repeat: 1 }}
                      className="w-2 h-2 rounded-full bg-amber-400"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ==================== QUESTIONS PHASE ==================== */}
            {phase === 'questions' && currentQuestion && (
              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                    <Mic className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
                  </div>
                  <span className="text-[10px] text-[#8b949e]">
                    Question {currentQuestionIdx + 1} of {questions.length}
                  </span>
                  <div className="flex-1" />
                  <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                    🎙️ Press Room
                  </Badge>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 mb-5 justify-center">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i < currentQuestionIdx
                          ? 'bg-emerald-400'
                          : i === currentQuestionIdx
                          ? 'bg-amber-400 scale-125'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Reporter card */}
                <AnimatePresence mode="wait">
                  {showQuestion && (
                    <motion.div
                      key={currentQuestionIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Reporter avatar + name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xl">
                          {reporterAvatar}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#c9d1d9]">{reporterName}</p>
                          <p className="text-[9px] text-[#8b949e]">Senior Football Correspondent</p>
                        </div>
                        <div className="ml-auto">
                          <Badge className="text-[8px] bg-red-500/15 text-red-400 border-red-500/25">
                            <Camera className="w-2.5 h-2.5 mr-0.5" />
                            LIVE
                          </Badge>
                        </div>
                      </div>

                      {/* Question with typewriter */}
                      <div className="bg-[#161b22]/60 border border-[#30363d] rounded-lg p-4 mb-5">
                        <p className="text-sm text-[#c9d1d9] leading-relaxed">
                          <TypewriterText text={currentQuestion.text} speed={20} />
                        </p>
                      </div>

                      {/* Answer options */}
                      <div className="space-y-2.5">
                        {currentQuestion.answers.map((answer) => {
                          const config = ANSWER_STYLE_CONFIG[answer.style];
                          return (
                            <motion.button
                              key={answer.style}
                              onClick={() => handleAnswer(answer.style)}
                              whileHover={{ opacity: 0.9 }}
                              className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 ${config.borderColor} ${config.bgColor} group`}
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
                                  <p className="text-xs text-[#c9d1d9] leading-relaxed pr-8">
                                    {answer.text}
                                  </p>
                                  {/* Effect indicators */}
                                  <div className="flex gap-2 mt-2">
                                    {answer.moraleEffect !== 0 && (
                                      <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.moraleEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {answer.moraleEffect > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        Morale {answer.moraleEffect > 0 ? '+' : ''}{answer.moraleEffect}
                                      </span>
                                    )}
                                    {answer.reputationEffect !== 0 && (
                                      <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.reputationEffect > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {answer.reputationEffect > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        Rep {answer.reputationEffect > 0 ? '+' : ''}{answer.reputationEffect}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${config.textColor} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-2`} />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ==================== REACTION PHASE ==================== */}
            {phase === 'reaction' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative p-5"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                  <Newspaper className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Media Reaction</span>
                </div>

                {/* Sentiment Gauge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="bg-[#161b22]/60 border border-[#30363d] rounded-lg p-4 mb-4"
                >
                  <p className="text-[10px] text-[#8b949e]  font-semibold mb-3 text-center">
                    Media Sentiment
                  </p>
                  <SentimentGauge value={sentiment} />
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-[#161b22]/60 border border-[#30363d] rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-amber-400 font-bold ">Key Headline</span>
                  </div>
                  <p className="text-sm font-bold text-white leading-snug">
                    &ldquo;{headline}&rdquo;
                  </p>
                </motion.div>

                {/* Social media reaction */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-[#161b22]/60 border border-[#30363d] rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] text-sky-400 font-bold ">Social Reaction</span>
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-lg font-black text-white">{socialLikes.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] text-[#8b949e]">Likes</span>
                    </div>
                    <div className="w-px h-8 bg-slate-700/50" />
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4 text-sky-400" />
                        <span className="text-lg font-black text-white">{socialRetweets.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] text-[#8b949e]">Retweets</span>
                    </div>
                    <div className="w-px h-8 bg-slate-700/50" />
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span className="text-lg font-black text-white">{((socialLikes + socialRetweets) * 3.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                      </div>
                      <span className="text-[9px] text-[#8b949e]">Impressions</span>
                    </div>
                  </div>
                </motion.div>

                {/* Effect Summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-[#161b22]/60 border border-[#30363d] rounded-lg p-4 mb-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-amber-400 font-bold ">Effect Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#21262d] rounded-lg p-3 text-center">
                      <p className="text-[9px] text-[#8b949e] uppercase mb-1">Morale</p>
                      <div className="flex items-center justify-center gap-1">
                        {totalMoraleEffect > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : totalMoraleEffect < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-[#8b949e]" />
                        )}
                        <span className={`text-lg font-black ${totalMoraleEffect > 0 ? 'text-emerald-400' : totalMoraleEffect < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                          {totalMoraleEffect > 0 ? '+' : ''}{totalMoraleEffect}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#8b949e] mt-0.5">
                        {player.morale} → {Math.max(0, Math.min(100, player.morale + totalMoraleEffect))}
                      </p>
                    </div>
                    <div className="bg-[#21262d] rounded-lg p-3 text-center">
                      <p className="text-[9px] text-[#8b949e] uppercase mb-1">Reputation</p>
                      <div className="flex items-center justify-center gap-1">
                        {totalReputationEffect > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : totalReputationEffect < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-[#8b949e]" />
                        )}
                        <span className={`text-lg font-black ${totalReputationEffect > 0 ? 'text-emerald-400' : totalReputationEffect < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                          {totalReputationEffect > 0 ? '+' : ''}{totalReputationEffect}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#8b949e] mt-0.5">
                        {player.reputation} → {Math.max(0, Math.min(100, player.reputation + totalReputationEffect))}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Continue button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <Button
                    onClick={handleApplyEffects}
                    className="w-full h-12 bg-red-700 hover:bg-red-600 rounded-lg font-semibold text-white transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Leave Press Conference
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
