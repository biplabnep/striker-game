'use client';

import { useState } from 'react';
import {
  Mic,
  Newspaper,
  BarChart3,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
  Target,
  MessageSquare,
  Eye,
  Clock,
  Award,
  Quote,
  Radio,
  Tv,
  Globe,
  Users,
  ThumbsUp,
  ThumbsDown,
  Star,
  BookOpen,
  Megaphone,
  Lightbulb,
  ChevronRight,
  Info,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Trap';
type QuestionTopic = 'Form' | 'Transfer' | 'Tactics' | 'Personal' | 'Controversy' | 'Team';
type HeadlineSentiment = 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
type HeadlineCategory = 'Match Report' | 'Transfer' | 'Interview' | 'Analysis' | 'Opinion' | 'Rumor';
type PressEventType = 'Post-Match' | 'Pre-Match' | 'Midweek' | 'Emergency';
type QuoteType = 'Motivational' | 'Defensive' | 'Tactical' | 'Personal' | 'Controversial';

interface JournalistQuestion {
  id: string;
  journalist: string;
  outlet: string;
  question: string;
  difficulty: QuestionDifficulty;
  topic: QuestionTopic;
  timeAsked: string;
  answered: boolean;
}

interface StrategyCard {
  id: string;
  name: string;
  description: string;
  effectiveness: {
    mediaRelations: number;
    fanApproval: number;
    boardConfidence: number;
    playerMorale: number;
  };
  icon: React.ReactNode;
  color: string;
}

interface AdvisorTip {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
}

interface HeadlineItem {
  id: string;
  headline: string;
  outlet: string;
  sentiment: HeadlineSentiment;
  date: string;
  category: HeadlineCategory;
  reads: string;
}

interface PressEvent {
  id: string;
  match: string;
  eventType: PressEventType;
  date: string;
  score: number;
  quote: string;
  ratingChange: number;
}

interface NotableQuote {
  id: string;
  quote: string;
  context: string;
  date: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  type: QuoteType;
}

interface MediaRelationship {
  outletType: string;
  outletIcon: React.ReactNode;
  relationship: 'Strong' | 'Good' | 'Neutral' | 'Poor';
  lastInteraction: string;
  trending: 'up' | 'down' | 'stable';
  articlesThisMonth: number;
}

// ============================================================
// Constants
// ============================================================

const TABS = [
  { label: 'Live Press Scrum', icon: <Mic className="h-4 w-4" /> },
  { label: 'PR Strategy', icon: <Shield className="h-4 w-4" /> },
  { label: 'Headline Tracker', icon: <Newspaper className="h-4 w-4" /> },
  { label: 'Press Rating History', icon: <History className="h-4 w-4" /> },
];

const DIFFICULTY_CONFIG: Record<QuestionDifficulty, { color: string; bgColor: string; borderColor: string }> = {
  Easy: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  Medium: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  Hard: { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  Trap: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

const TOPIC_CONFIG: Record<QuestionTopic, { color: string; bgColor: string; borderColor: string }> = {
  Form: { color: 'text-[#58a6ff]', bgColor: 'bg-[#58a6ff]/10', borderColor: 'border-[#58a6ff]/30' },
  Transfer: { color: 'text-[#f0883e]', bgColor: 'bg-[#f0883e]/10', borderColor: 'border-[#f0883e]/30' },
  Tactics: { color: 'text-[#d2a8ff]', bgColor: 'bg-[#d2a8ff]/10', borderColor: 'border-[#d2a8ff]/30' },
  Personal: { color: 'text-[#ffa657]', bgColor: 'bg-[#ffa657]/10', borderColor: 'border-[#ffa657]/30' },
  Controversy: { color: 'text-[#f85149]', bgColor: 'bg-[#f85149]/10', borderColor: 'border-[#f85149]/30' },
  Team: { color: 'text-[#3fb950]', bgColor: 'bg-[#3fb950]/10', borderColor: 'border-[#3fb950]/30' },
};

const SENTIMENT_CONFIG: Record<HeadlineSentiment, { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  Positive: { color: 'text-[#3fb950]', bgColor: 'bg-[#3fb950]/10', borderColor: 'border-[#3fb950]/30', icon: <ThumbsUp className="h-3 w-3" /> },
  Neutral: { color: 'text-[#8b949e]', bgColor: 'bg-[#8b949e]/10', borderColor: 'border-[#8b949e]/30', icon: <Minus className="h-3 w-3" /> },
  Negative: { color: 'text-[#f85149]', bgColor: 'bg-[#f85149]/10', borderColor: 'border-[#f85149]/30', icon: <ThumbsDown className="h-3 w-3" /> },
  Mixed: { color: 'text-[#ffa657]', bgColor: 'bg-[#ffa657]/10', borderColor: 'border-[#ffa657]/30', icon: <AlertTriangle className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  High: { color: 'text-[#f85149]', bgColor: 'bg-[#f85149]/10' },
  Medium: { color: 'text-[#ffa657]', bgColor: 'bg-[#ffa657]/10' },
  Low: { color: 'text-[#3fb950]', bgColor: 'bg-[#3fb950]/10' },
};

const JOURNALIST_QUESTIONS: JournalistQuestion[] = [
  {
    id: 'q1',
    journalist: 'James Henderson',
    outlet: 'Sky Sports',
    question: 'After the recent dip in form, how confident are you that the team can bounce back and challenge for the top four?',
    difficulty: 'Medium',
    topic: 'Form',
    timeAsked: '2 min ago',
    answered: false,
  },
  {
    id: 'q2',
    journalist: 'Sarah Mitchell',
    outlet: 'The Athletic',
    question: 'There are rumors of a big-money move in January. Can you address the speculation surrounding your future at the club?',
    difficulty: 'Hard',
    topic: 'Transfer',
    timeAsked: '5 min ago',
    answered: false,
  },
  {
    id: 'q3',
    journalist: 'Carlos Rivera',
    outlet: 'Marca',
    question: 'Your tactical setup seemed quite defensive in the second half. Was that a conscious decision to protect the lead?',
    difficulty: 'Easy',
    topic: 'Tactics',
    timeAsked: '8 min ago',
    answered: true,
  },
  {
    id: 'q4',
    journalist: 'Emma Thompson',
    outlet: 'BBC Sport',
    question: 'Reports suggest there is some tension between you and the coaching staff. How would you respond to those claims?',
    difficulty: 'Trap',
    topic: 'Controversy',
    timeAsked: '12 min ago',
    answered: false,
  },
  {
    id: 'q5',
    journalist: 'David Chen',
    outlet: 'Goal.com',
    question: 'Which young player from the academy has impressed you the most in training recently?',
    difficulty: 'Easy',
    topic: 'Team',
    timeAsked: '15 min ago',
    answered: true,
  },
  {
    id: 'q6',
    journalist: 'Laura Kim',
    outlet: 'ESPN FC',
    question: 'You have been playing through a minor injury. Is that sustainable for the rest of the season, or should fans be worried?',
    difficulty: 'Hard',
    topic: 'Personal',
    timeAsked: '18 min ago',
    answered: false,
  },
];

const STRATEGY_CARDS: StrategyCard[] = [
  {
    id: 's1',
    name: 'Aggressive',
    description: 'Take bold stances, confront difficult topics head-on, and use strong language to dominate the narrative.',
    effectiveness: { mediaRelations: 65, fanApproval: 80, boardConfidence: 55, playerMorale: 70 },
    icon: <Zap className="h-5 w-5 text-[#f85149]" />,
    color: 'border-[#f85149]/40',
  },
  {
    id: 's2',
    name: 'Neutral',
    description: 'Play it safe with balanced, measured responses. Avoid controversy and stick to prepared talking points.',
    effectiveness: { mediaRelations: 75, fanApproval: 50, boardConfidence: 70, playerMorale: 55 },
    icon: <Target className="h-5 w-5 text-[#8b949e]" />,
    color: 'border-[#8b949e]/40',
  },
  {
    id: 's3',
    name: 'Balanced',
    description: 'Mix confidence with diplomacy. Be honest but tactful, showing personality while remaining professional.',
    effectiveness: { mediaRelations: 85, fanApproval: 70, boardConfidence: 75, playerMorale: 80 },
    icon: <CheckCircle className="h-5 w-5 text-[#3fb950]" />,
    color: 'border-[#3fb950]/40',
  },
  {
    id: 's4',
    name: 'Conservative',
    description: 'Give minimal responses, deflect difficult questions, and redirect focus to team achievements and upcoming fixtures.',
    effectiveness: { mediaRelations: 60, fanApproval: 40, boardConfidence: 80, playerMorale: 65 },
    icon: <Shield className="h-5 w-5 text-[#58a6ff]" />,
    color: 'border-[#58a6ff]/40',
  },
];

const ADVISOR_TIPS: AdvisorTip[] = [
  {
    id: 't1',
    title: 'Avoid Trap Questions',
    description: 'When asked about internal conflicts, redirect to team unity and collective goals. Never confirm or deny speculation about teammates.',
    priority: 'High',
    category: 'Crisis Management',
  },
  {
    id: 't2',
    title: 'Transfer Season Strategy',
    description: 'During transfer windows, always emphasize commitment to current club. Use phrases like "focused on the season" and "happy here" to manage expectations.',
    priority: 'Medium',
    category: 'Transfer Handling',
  },
  {
    id: 't3',
    title: 'Post-Loss Protocol',
    description: 'After a defeat, take responsibility, praise the opponent, and highlight areas for improvement. Avoid blaming referees or individual players.',
    priority: 'High',
    category: 'Post-Match',
  },
];

const HEADLINES: HeadlineItem[] = [
  {
    id: 'h1',
    headline: 'Star Player Commits Future to Club Amid Transfer Interest',
    outlet: 'BBC Sport',
    sentiment: 'Positive',
    date: '2 hours ago',
    category: 'Interview',
    reads: '45.2K',
  },
  {
    id: 'h2',
    headline: 'Manager Questioned After Another Lacklustre Display',
    outlet: 'The Guardian',
    sentiment: 'Negative',
    date: '5 hours ago',
    category: 'Match Report',
    reads: '32.1K',
  },
  {
    id: 'h3',
    headline: 'Inside the Transfer Strategy: What the Board Really Thinks',
    outlet: 'The Athletic',
    sentiment: 'Mixed',
    date: '1 day ago',
    category: 'Analysis',
    reads: '28.7K',
  },
  {
    id: 'h4',
    headline: 'Player of the Month Nomination Sparks Debate Among Fans',
    outlet: 'Sky Sports',
    sentiment: 'Neutral',
    date: '1 day ago',
    category: 'Opinion',
    reads: '19.4K',
  },
  {
    id: 'h5',
    headline: 'Shocking Injury Blow: Key Star Set for Months on Sidelines',
    outlet: 'The Telegraph',
    sentiment: 'Negative',
    date: '2 days ago',
    category: 'Match Report',
    reads: '51.3K',
  },
  {
    id: 'h6',
    headline: 'Club Denied Permission to Speak to Premier League Target',
    outlet: 'Marca',
    sentiment: 'Neutral',
    date: '3 days ago',
    category: 'Rumor',
    reads: '38.9K',
  },
];

const NOTABLE_QUOTES: NotableQuote[] = [
  {
    id: 'nq1',
    quote: 'We are not just here to participate. We are here to win everything.',
    context: 'Pre-match press conference before Champions League quarter-final',
    date: 'Week 9',
    impact: 'Positive',
    type: 'Motivational',
  },
  {
    id: 'nq2',
    quote: 'Every defeat is a lesson. We analyze, we adapt, and we come back stronger.',
    context: 'Post-match after 3-0 loss to Chelsea',
    date: 'Week 11',
    impact: 'Positive',
    type: 'Defensive',
  },
  {
    id: 'nq3',
    quote: 'The tactical adjustment at half-time changed the game. Credit to the coaching staff.',
    context: 'Post-match after come-from-behind win vs Tottenham',
    date: 'Week 8',
    impact: 'Positive',
    type: 'Tactical',
  },
  {
    id: 'nq4',
    quote: 'I am fully committed to this club. The fans deserve honesty, and I am happy here.',
    context: 'Responding to transfer speculation in January window',
    date: 'Week 7',
    impact: 'Positive',
    type: 'Personal',
  },
  {
    id: 'nq5',
    quote: 'Some decisions went against us today, but I will not make excuses. We need to be better.',
    context: 'Post-match after narrow 1-0 defeat at Newcastle',
    date: 'Week 6',
    impact: 'Neutral',
    type: 'Controversial',
  },
  {
    id: 'nq6',
    quote: 'The academy is the heartbeat of this club. These young players are the future.',
    context: 'Youth team integration press event',
    date: 'Week 5',
    impact: 'Positive',
    type: 'Motivational',
  },
];

const MEDIA_RELATIONSHIPS: MediaRelationship[] = [
  {
    outletType: 'Tabloids',
    outletIcon: <Newspaper className="h-4 w-4 text-[#f85149]" />,
    relationship: 'Good',
    lastInteraction: '2 days ago',
    trending: 'up',
    articlesThisMonth: 14,
  },
  {
    outletType: 'Broadsheets',
    outletIcon: <BookOpen className="h-4 w-4 text-[#58a6ff]" />,
    relationship: 'Strong',
    lastInteraction: '1 day ago',
    trending: 'stable',
    articlesThisMonth: 9,
  },
  {
    outletType: 'Sports Pubs',
    outletIcon: <Tv className="h-4 w-4 text-[#3fb950]" />,
    relationship: 'Strong',
    lastInteraction: 'Today',
    trending: 'up',
    articlesThisMonth: 18,
  },
  {
    outletType: 'Social Media',
    outletIcon: <Globe className="h-4 w-4 text-[#d2a8ff]" />,
    relationship: 'Neutral',
    lastInteraction: '3 hours ago',
    trending: 'down',
    articlesThisMonth: 42,
  },
  {
    outletType: 'TV Networks',
    outletIcon: <Radio className="h-4 w-4 text-[#ffa657]" />,
    relationship: 'Good',
    lastInteraction: '5 days ago',
    trending: 'stable',
    articlesThisMonth: 6,
  },
  {
    outletType: 'Radio',
    outletIcon: <Megaphone className="h-4 w-4 text-[#f0883e]" />,
    relationship: 'Neutral',
    lastInteraction: '1 week ago',
    trending: 'up',
    articlesThisMonth: 3,
  },
];

const PRESS_EVENTS: PressEvent[] = [
  {
    id: 'pe1',
    match: 'vs Arsenal (H) — Won 2-1',
    eventType: 'Post-Match',
    date: 'Week 12',
    score: 82,
    quote: 'A massive three points. The lads showed incredible character today.',
    ratingChange: +5,
  },
  {
    id: 'pe2',
    match: 'vs Chelsea (A) — Lost 3-0',
    eventType: 'Post-Match',
    date: 'Week 11',
    score: 35,
    quote: 'We were not at our best. Credit to Chelsea, they were the better side.',
    ratingChange: -12,
  },
  {
    id: 'pe3',
    match: 'vs Liverpool (H) — Drew 1-1',
    eventType: 'Post-Match',
    date: 'Week 10',
    score: 68,
    quote: 'A hard-fought point against a top side. We move forward together.',
    ratingChange: +2,
  },
  {
    id: 'pe4',
    match: 'vs Man City (A) — Won 2-0',
    eventType: 'Pre-Match',
    date: 'Week 9',
    score: 90,
    quote: 'We are going there to win. No fear, no backing down.',
    ratingChange: +8,
  },
  {
    id: 'pe5',
    match: 'vs Tottenham (H) — Won 3-2',
    eventType: 'Post-Match',
    date: 'Week 8',
    score: 78,
    quote: 'The atmosphere was electric. The fans drove us to that victory.',
    ratingChange: +6,
  },
  {
    id: 'pe6',
    match: 'vs Newcastle (A) — Lost 1-0',
    eventType: 'Emergency',
    date: 'Week 7',
    score: 42,
    quote: 'Disappointing result but the season is long. We will bounce back.',
    ratingChange: -8,
  },
  {
    id: 'pe7',
    match: 'vs Aston Villa (H) — Won 4-1',
    eventType: 'Post-Match',
    date: 'Week 6',
    score: 88,
    quote: 'That was close to our best performance of the season. Pleasing.',
    ratingChange: +10,
  },
  {
    id: 'pe8',
    match: 'vs Brighton (A) — Drew 0-0',
    eventType: 'Midweek',
    date: 'Week 5',
    score: 55,
    quote: 'A clean sheet away from home is always a positive foundation.',
    ratingChange: -1,
  },
];

// ============================================================
// SVG Chart Components
// ============================================================

function MediaPresenceGauge({ value }: { value: number }): React.JSX.Element {
  const radius = 70;
  const cx = 80;
  const cy = 80;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const angleRange = endAngle - startAngle;
  const valueAngle = startAngle + (value / 100) * angleRange;
  const arcX = cx + radius * Math.cos(valueAngle);
  const arcY = cy - radius * Math.sin(valueAngle);
  const largeArcFlag = value > 50 ? 1 : 0;

  const color = value >= 75 ? '#3fb950' : value >= 50 ? '#ffa657' : value >= 25 ? '#f0883e' : '#f85149';

  const tickMarks = [0, 25, 50, 75, 100].map((tick) => {
    const tickAngle = startAngle + (tick / 100) * angleRange;
    const innerR = radius - 12;
    const outerR = radius - 4;
    return {
      x1: cx + innerR * Math.cos(tickAngle),
      y1: cy - innerR * Math.sin(tickAngle),
      x2: cx + outerR * Math.cos(tickAngle),
      y2: cy - outerR * Math.sin(tickAngle),
      labelX: cx + (radius + 16) * Math.cos(tickAngle),
      labelY: cy - (radius + 16) * Math.sin(tickAngle),
      label: String(tick),
    };
  });

  return (
    <svg viewBox="0 0 160 110" className="w-full h-auto">
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#21262d"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcX} ${arcY}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {tickMarks.map((tick, i) => (
        <g key={i}>
          <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#30363d" strokeWidth="2" />
          <text x={tick.labelX} y={tick.labelY} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="9">
            {tick.label}
          </text>
        </g>
      ))}
      <text x={cx} y={cy - 15} textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="10">
        Media Presence
      </text>
    </svg>
  );
}

function QuestionDifficultyDonut({ questions }: { questions: JournalistQuestion[] }): React.JSX.Element {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const cx = 80;
  const cy = 80;

  const difficultyCounts = questions.reduce<Record<QuestionDifficulty, number>>((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, { Easy: 0, Medium: 0, Hard: 0, Trap: 0 });

  const total = questions.length;
  const segments: { difficulty: QuestionDifficulty; color: string; offset: number }[] = [];
  let currentOffset = 0;

  const difficultyColors: Record<QuestionDifficulty, string> = {
    Easy: '#3fb950',
    Medium: '#ffa657',
    Hard: '#f0883e',
    Trap: '#f85149',
  };

  const difficultyOrder: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard', 'Trap'];
  for (const diff of difficultyOrder) {
    const count = difficultyCounts[diff];
    if (count > 0) {
      segments.push({
        difficulty: diff,
        color: difficultyColors[diff],
        offset: currentOffset,
      });
      currentOffset += count;
    }
  }

  const segmentElements = segments.map((seg, i) => {
    const segLength = (difficultyCounts[seg.difficulty] / total) * circumference;
    const gap = 4;
    const dashOffset = -seg.offset * (circumference / total) - circumference / 4;
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth="16"
        strokeDasharray={`${segLength - gap} ${circumference - segLength + gap}`}
        strokeDashoffset={dashOffset}
      />
    );
  });

  return (
    <svg viewBox="0 0 160 160" className="w-full h-auto">
      {segmentElements}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="10">
        Questions
      </text>
      {segments.map((seg, i) => {
        const angle = (seg.offset + difficultyCounts[seg.difficulty] / 2) / total * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (radius + 22) * Math.cos(angle);
        const ly = cy + (radius + 22) * Math.sin(angle);
        return (
          <text key={`leg-${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={seg.color} fontSize="9" fontWeight="600">
            {seg.difficulty}
          </text>
        );
      })}
    </svg>
  );
}

function ResponseQualityBars({ qualities }: { qualities: { label: string; value: number; color: string }[] }): React.JSX.Element {
  const maxVal = 100;
  const barHeight = 18;
  const barGap = 24;
  const labelWidth = 90;
  const chartWidth = 200;

  return (
    <svg viewBox="0 0 340 140" className="w-full h-auto">
      {qualities.map((q, i) => {
        const y = 12 + i * barGap;
        const barWidth = (q.value / maxVal) * chartWidth;
        return (
          <g key={i}>
            <text x={0} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize="11" fontWeight="500">
              {q.label}
            </text>
            <rect x={labelWidth} y={y} width={chartWidth} height={barHeight} rx="4" fill="#21262d" />
            <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx="4" fill={q.color} opacity="0.85" />
            <text x={labelWidth + barWidth - 8} y={y + barHeight / 2} dominantBaseline="central" textAnchor="end" fill="#c9d1d9" fontSize="10" fontWeight="600">
              {q.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PressConferenceMomentumChart({ questions }: { questions: { quality: number; difficulty: QuestionDifficulty }[] }): React.JSX.Element {
  const chartLeft = 40;
  const chartRight = 290;
  const chartTop = 10;
  const chartBottom = 80;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const diffColors: Record<QuestionDifficulty, string> = {
    Easy: '#3fb950',
    Medium: '#ffa657',
    Hard: '#f0883e',
    Trap: '#f85149',
  };

  const areaPath = questions.reduce<string>((path, q, i) => {
    const x = chartLeft + (i / (questions.length - 1)) * chartWidth;
    const y = chartBottom - (q.quality / 100) * chartHeight;
    if (i === 0) return `M ${x} ${y}`;
    return `${path} L ${x} ${y}`;
  }, '');

  const closePath = `${areaPath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;

  const gridLines = [0, 25, 50, 75, 100];
  const gridPath = gridLines.map((val) => {
    const y = chartBottom - (val / 100) * chartHeight;
    return `M ${chartLeft} ${y} L ${chartRight} ${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 320 100" className="w-full h-auto">
      <path d={gridPath} fill="none" stroke="#21262d" strokeWidth="1" />
      <path d={closePath} fill="#58a6ff" opacity="0.12" />
      <path d={areaPath} fill="none" stroke="#58a6ff" strokeWidth="2" />
      {questions.map((q, i) => {
        const x = chartLeft + (i / (questions.length - 1)) * chartWidth;
        const y = chartBottom - (q.quality / 100) * chartHeight;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#0d1117" stroke={diffColors[q.difficulty]} strokeWidth="2" />
            <text x={x} y={chartBottom + 14} textAnchor="middle" fill="#8b949e" fontSize="9">
              Q{i + 1}
            </text>
          </g>
        );
      })}
      {gridLines.map((val, i) => {
        const y = chartBottom - (val / 100) * chartHeight;
        return (
          <text key={`grid-${i}`} x={chartLeft - 8} y={y} textAnchor="end" dominantBaseline="central" fill="#30363d" fontSize="8">
            {val}
          </text>
        );
      })}
    </svg>
  );
}

function MediaRelationshipHexRadar({ relationships }: { relationships: { axis: string; value: number }[] }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const maxRadius = 70;

  const n = relationships.length;
  const axisAngle = (2 * Math.PI) / n;
  const startOffset = -Math.PI / 2;

  const getPoint = (index: number, value: number) => {
    const angle = startOffset + index * axisAngle;
    const r = (value / 100) * maxRadius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [25, 50, 75, 100];
  const gridPaths = gridLevels.map((level) => {
    const points = relationships.map((_, i) => {
      const p = getPoint(i, level);
      return `${p.x},${p.y}`;
    }).join(' ');
    return { level, points };
  });

  const dataPoints = relationships.map((r, i) => getPoint(i, r.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto">
      {gridPaths.map((gp, i) => (
        <polygon key={i} points={gp.points} fill="none" stroke="#21262d" strokeWidth="1" />
      ))}
      {relationships.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#21262d" strokeWidth="1" />;
      })}
      <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="#58a6ff" opacity="0.15" stroke="#58a6ff" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#58a6ff" />
      ))}
      {relationships.map((r, i) => {
        const p = getPoint(i, 115);
        return (
          <text key={`label-${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="9" fontWeight="500">
            {r.axis}
          </text>
        );
      })}
    </svg>
  );
}

function PressRatingTrendLine({ weeks }: { weeks: { label: string; rating: number }[] }): React.JSX.Element {
  const chartLeft = 35;
  const chartRight = 290;
  const chartTop = 10;
  const chartBottom = 80;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const linePath = weeks.reduce<string>((path, w, i) => {
    const x = chartLeft + (i / (weeks.length - 1)) * chartWidth;
    const y = chartBottom - (w.rating / 100) * chartHeight;
    if (i === 0) return `M ${x} ${y}`;
    return `${path} L ${x} ${y}`;
  }, '');

  const gridValues = [0, 25, 50, 75, 100];

  return (
    <svg viewBox="0 0 320 100" className="w-full h-auto">
      {gridValues.map((val) => {
        const y = chartBottom - (val / 100) * chartHeight;
        return <line key={val} x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#21262d" strokeWidth="1" />;
      })}
      <path d={linePath} fill="none" stroke="#3fb950" strokeWidth="2" />
      {weeks.map((w, i) => {
        const x = chartLeft + (i / (weeks.length - 1)) * chartWidth;
        const y = chartBottom - (w.rating / 100) * chartHeight;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="#0d1117" stroke="#3fb950" strokeWidth="2" />
            <text x={x} y={chartBottom + 14} textAnchor="middle" fill="#8b949e" fontSize="8">
              {w.label}
            </text>
          </g>
        );
      })}
      {gridValues.map((val) => {
        const y = chartBottom - (val / 100) * chartHeight;
        return (
          <text key={`label-${val}`} x={chartLeft - 8} y={y} textAnchor="end" dominantBaseline="central" fill="#30363d" fontSize="8">
            {val}
          </text>
        );
      })}
    </svg>
  );
}

function StrategyEffectivenessBars({ strategies }: { strategies: StrategyCard[] }): React.JSX.Element {
  const metrics = ['mediaRelations', 'fanApproval', 'boardConfidence', 'playerMorale'] as const;
  const metricLabels = ['Media Rel.', 'Fan Approv.', 'Board Conf.', 'Player Mor.'];
  const metricColors = ['#58a6ff', '#ffa657', '#d2a8ff', '#3fb950'];
  const barGroupWidth = 80;
  const groupGap = 16;
  const barHeight = 10;
  const barGap = 14;
  const chartLeft = 85;
  const chartWidth = strategies.length * barGroupWidth + (strategies.length - 1) * groupGap;

  return (
    <svg viewBox="0 0 500 140" className="w-full h-auto">
      {metrics.map((metric, mi) => {
        const y = 10 + mi * barGap;
        return (
          <g key={mi}>
            <text x={0} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize="10">
              {metricLabels[mi]}
            </text>
            {strategies.map((strategy, si) => {
              const groupX = chartLeft + si * (barGroupWidth + groupGap);
              const barWidth = (strategy.effectiveness[metric] / 100) * barGroupWidth;
              return (
                <g key={si}>
                  <rect x={groupX} y={y} width={barGroupWidth} height={barHeight} rx="2" fill="#21262d" />
                  <rect x={groupX} y={y} width={barWidth} height={barHeight} rx="2" fill={metricColors[mi]} opacity="0.8" />
                </g>
              );
            })}
          </g>
        );
      })}
      {strategies.map((strategy, si) => {
        const groupX = chartLeft + si * (barGroupWidth + groupGap);
        return (
          <text key={`sname-${si}`} x={groupX + barGroupWidth / 2} y={128} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="500">
            {strategy.name}
          </text>
        );
      })}
    </svg>
  );
}

function HeadlineSentimentAreaChart({ data }: { data: { week: string; positive: number; negative: number }[] }): React.JSX.Element {
  const chartLeft = 40;
  const chartRight = 290;
  const chartTop = 10;
  const chartBottom = 80;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const buildArea = (key: 'positive' | 'negative', color: string): React.JSX.Element[] => {
    const path = data.reduce<string>((p, d, i) => {
      const x = chartLeft + (i / (data.length - 1)) * chartWidth;
      const y = chartBottom - (d[key] / 100) * chartHeight;
      if (i === 0) return `M ${x} ${y}`;
      return `${p} L ${x} ${y}`;
    }, '');
    const closePath = `${path} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;
    return [
      <path key={key + '-area'} d={closePath} fill={color} opacity="0.15" />,
      <path key={key + '-line'} d={path} fill="none" stroke={color} strokeWidth="2" />,
    ];
  };

  const gridValues = [0, 25, 50, 75, 100];

  return (
    <svg viewBox="0 0 320 100" className="w-full h-auto">
      {gridValues.map((val) => {
        const y = chartBottom - (val / 100) * chartHeight;
        return <line key={val} x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#21262d" strokeWidth="1" />;
      })}
      {buildArea('positive', '#3fb950')}
      {buildArea('negative', '#f85149')}
      {data.map((d, i) => {
        const x = chartLeft + (i / (data.length - 1)) * chartWidth;
        return (
          <text key={i} x={x} y={chartBottom + 14} textAnchor="middle" fill="#8b949e" fontSize="9">
            {d.week}
          </text>
        );
      })}
    </svg>
  );
}

function HeadlineFrequencyBars({ categories }: { categories: { name: string; count: number; color: string }[] }): React.JSX.Element {
  const maxCount = categories.reduce((max, c) => Math.max(max, c.count), 0);
  const chartLeft = 90;
  const chartTop = 10;
  const barHeight = 16;
  const barGap = 22;
  const chartWidth = 200;

  return (
    <svg viewBox="0 0 340 140" className="w-full h-auto">
      {categories.map((cat, i) => {
        const y = chartTop + i * barGap;
        const barW = maxCount > 0 ? (cat.count / maxCount) * chartWidth : 0;
        return (
          <g key={i}>
            <text x={0} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize="10">
              {cat.name}
            </text>
            <rect x={chartLeft} y={y} width={chartWidth} height={barHeight} rx="3" fill="#21262d" />
            <rect x={chartLeft} y={y} width={barW} height={barHeight} rx="3" fill={cat.color} opacity="0.85" />
            <text x={chartLeft + barW - 6} y={y + barHeight / 2} textAnchor="end" dominantBaseline="central" fill="#c9d1d9" fontSize="10" fontWeight="600">
              {cat.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CoverageByOutletDonut({ outlets }: { outlets: { name: string; count: number; color: string }[] }): React.JSX.Element {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const cx = 90;
  const cy = 80;
  const total = outlets.reduce((sum, o) => sum + o.count, 0);

  const segments = outlets.reduce<{ name: string; color: string; startOffset: number; segLen: number }[]>((acc, outlet) => {
    const segLen = (outlet.count / total) * circumference;
    const lastItem = acc.length > 0 ? acc[acc.length - 1] : null;
    const startOffset = lastItem ? lastItem.startOffset + lastItem.segLen : 0;
    acc.push({ name: outlet.name, color: outlet.color, startOffset, segLen });
    return acc;
  }, []);

  return (
    <svg viewBox="0 0 200 180" className="w-full h-auto">
      {segments.map((seg, i) => {
        const gap = 3;
        const dashOffset = -(seg.startOffset + circumference / 4);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${seg.segLen - gap} ${circumference - seg.segLen + gap}`}
            strokeDashoffset={dashOffset}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="20" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="9">
        Articles
      </text>
      {segments.map((seg, i) => (
        <g key={`leg-${i}`}>
          <rect x={155} y={10 + i * 20} width="10" height="10" rx="2" fill={seg.color} />
          <text x={170} y={19} fill="#8b949e" fontSize="9">{seg.name}</text>
        </g>
      ))}
    </svg>
  );
}

function SentimentAnalysisGauge({ value }: { value: number }): React.JSX.Element {
  const radius = 70;
  const cx = 80;
  const cy = 80;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const angleRange = endAngle - startAngle;
  const normalizedValue = (value + 100) / 200;
  const valueAngle = startAngle + normalizedValue * angleRange;
  const arcX = cx + radius * Math.cos(valueAngle);
  const arcY = cy - radius * Math.sin(valueAngle);
  const largeArcFlag = normalizedValue > 0.5 ? 1 : 0;

  const color = value >= 50 ? '#3fb950' : value >= 0 ? '#ffa657' : value >= -50 ? '#f0883e' : '#f85149';

  const tickMarks = [-100, -50, 0, 50, 100].map((tick) => {
    const normTick = (tick + 100) / 200;
    const tickAngle = startAngle + normTick * angleRange;
    const innerR = radius - 12;
    const outerR = radius - 4;
    return {
      x1: cx + innerR * Math.cos(tickAngle),
      y1: cy - innerR * Math.sin(tickAngle),
      x2: cx + outerR * Math.cos(tickAngle),
      y2: cy - outerR * Math.sin(tickAngle),
      labelX: cx + (radius + 16) * Math.cos(tickAngle),
      labelY: cy - (radius + 16) * Math.sin(tickAngle),
      label: String(tick),
    };
  });

  return (
    <svg viewBox="0 0 160 110" className="w-full h-auto">
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#21262d"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcX} ${arcY}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {tickMarks.map((tick, i) => (
        <g key={i}>
          <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#30363d" strokeWidth="2" />
          <text x={tick.labelX} y={tick.labelY} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="9">
            {tick.label}
          </text>
        </g>
      ))}
      <text x={cx} y={cy - 12} textAnchor="middle" fill={color} fontSize="24" fontWeight="bold">
        {value > 0 ? '+' : ''}{value}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="10">
        Sentiment
      </text>
    </svg>
  );
}

function WeeklyHeadlineTrend({ weeks }: { weeks: { label: string; positive: number; neutral: number; negative: number }[] }): React.JSX.Element {
  const chartLeft = 40;
  const chartTop = 8;
  const barGroupWidth = 30;
  const barGap = 10;
  const groupGap = 20;
  const maxVal = weeks.reduce((max, w) => Math.max(max, w.positive + w.neutral + w.negative), 1);
  const chartHeight = 80;

  return (
    <svg viewBox="0 0 340 110" className="w-full h-auto">
      {weeks.map((w, i) => {
        const groupX = chartLeft + i * (barGroupWidth * 3 + barGap * 2 + groupGap);
        const total = w.positive + w.neutral + w.negative;
        const negH = maxVal > 0 ? (w.negative / maxVal) * chartHeight : 0;
        const neuH = maxVal > 0 ? (w.neutral / maxVal) * chartHeight : 0;
        const posH = maxVal > 0 ? (w.positive / maxVal) * chartHeight : 0;
        return (
          <g key={i}>
            <rect x={groupX} y={chartTop + chartHeight - negH} width={barGroupWidth} height={negH} rx="2" fill="#f85149" opacity="0.8" />
            <rect x={groupX + barGroupWidth + barGap} y={chartTop + chartHeight - neuH} width={barGroupWidth} height={neuH} rx="2" fill="#8b949e" opacity="0.6" />
            <rect x={groupX + (barGroupWidth + barGap) * 2} y={chartTop + chartHeight - posH} width={barGroupWidth} height={posH} rx="2" fill="#3fb950" opacity="0.8" />
            <text x={groupX + barGroupWidth + barGap} y={chartTop + chartHeight + 14} textAnchor="middle" fill="#8b949e" fontSize="9">
              {w.label}
            </text>
            <text x={groupX + barGroupWidth + barGap} y={chartTop + chartHeight + 26} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="600">
              {total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PressScoreTimeline({ events }: { events: PressEvent[] }): React.JSX.Element {
  const lineX = 40;
  const topY = 20;
  const bottomY = 320;
  const dotSpacing = (bottomY - topY) / (events.length - 1);

  const getDotColor = (score: number): string => {
    if (score >= 80) return '#3fb950';
    if (score >= 60) return '#58a6ff';
    if (score >= 40) return '#ffa657';
    return '#f85149';
  };

  return (
    <svg viewBox="0 0 140 350" className="w-full h-auto">
      <line x1={lineX} y1={topY} x2={lineX} y2={bottomY} stroke="#21262d" strokeWidth="2" />
      {events.map((event, i) => {
        const y = topY + i * dotSpacing;
        const color = getDotColor(event.score);
        return (
          <g key={i}>
            <circle cx={lineX} cy={y} r="8" fill={color} opacity="0.2" />
            <circle cx={lineX} cy={y} r="5" fill={color} />
            <text x={lineX + 16} y={y - 4} fill="#c9d1d9" fontSize="10" fontWeight="600">
              {event.score}
            </text>
            <text x={lineX + 16} y={y + 8} fill="#8b949e" fontSize="8">
              {event.date}
            </text>
            {event.ratingChange > 0 && (
              <text x={lineX + 52} y={y + 2} fill="#3fb950" fontSize="9" fontWeight="600">+{event.ratingChange}</text>
            )}
            {event.ratingChange < 0 && (
              <text x={lineX + 52} y={y + 2} fill="#f85149" fontSize="9" fontWeight="600">{event.ratingChange}</text>
            )}
            {event.ratingChange === 0 && (
              <text x={lineX + 52} y={y + 2} fill="#8b949e" fontSize="9">0</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function QuoteQualityBars({ quotes }: { quotes: { type: string; score: number; count: number; color: string }[] }): React.JSX.Element {
  const maxScore = 100;
  const chartLeft = 100;
  const chartTop = 10;
  const barHeight = 16;
  const barGap = 24;
  const chartWidth = 190;

  return (
    <svg viewBox="0 0 360 150" className="w-full h-auto">
      {quotes.map((q, i) => {
        const y = chartTop + i * barGap;
        const barW = (q.score / maxScore) * chartWidth;
        return (
          <g key={i}>
            <text x={0} y={y + barHeight / 2} dominantBaseline="central" fill="#8b949e" fontSize="10">
              {q.type}
            </text>
            <rect x={chartLeft} y={y} width={chartWidth} height={barHeight} rx="3" fill="#21262d" />
            <rect x={chartLeft} y={y} width={barW} height={barHeight} rx="3" fill={q.color} opacity="0.85" />
            <text x={chartLeft + barW - 6} y={y + barHeight / 2} textAnchor="end" dominantBaseline="central" fill="#c9d1d9" fontSize="10" fontWeight="600">
              {q.score}%
            </text>
            <text x={chartLeft + chartWidth + 8} y={y + barHeight / 2} dominantBaseline="central" fill="#30363d" fontSize="9">
              ({q.count})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MediaOutletRatingBars({ outlets }: { outlets: { name: string; playerRating: number; teamAvg: number }[] }): React.JSX.Element {
  const chartLeft = 80;
  const chartTop = 10;
  const barHeight = 12;
  const groupGap = 8;
  const barGap = 20;
  const chartWidth = 200;

  return (
    <svg viewBox="0 0 340 150" className="w-full h-auto">
      {outlets.map((o, i) => {
        const y = chartTop + i * (barHeight * 2 + groupGap + barGap);
        const playerW = (o.playerRating / 100) * chartWidth;
        const teamW = (o.teamAvg / 100) * chartWidth;
        return (
          <g key={i}>
            <text x={0} y={y + barHeight + groupGap / 2} dominantBaseline="central" fill="#8b949e" fontSize="10">
              {o.name}
            </text>
            <rect x={chartLeft} y={y} width={chartWidth} height={barHeight} rx="2" fill="#21262d" />
            <rect x={chartLeft} y={y} width={playerW} height={barHeight} rx="2" fill="#58a6ff" opacity="0.85" />
            <text x={chartLeft + playerW - 4} y={y + barHeight / 2} textAnchor="end" dominantBaseline="central" fill="#c9d1d9" fontSize="8" fontWeight="600">
              {o.playerRating}
            </text>
            <rect x={chartLeft} y={y + barHeight + groupGap} width={chartWidth} height={barHeight} rx="2" fill="#21262d" />
            <rect x={chartLeft} y={y + barHeight + groupGap} width={teamW} height={barHeight} rx="2" fill="#8b949e" opacity="0.5" />
            <text x={chartLeft + teamW - 4} y={y + barHeight + groupGap + barHeight / 2} textAnchor="end" dominantBaseline="central" fill="#c9d1d9" fontSize="8">
              {o.teamAvg}
            </text>
          </g>
        );
      })}
      <rect x={chartLeft} y={chartTop + outlets.length * (barHeight * 2 + groupGap + barGap)} width="10" height="10" rx="2" fill="#58a6ff" opacity="0.85" />
      <text x={chartLeft + 14} y={chartTop + outlets.length * (barHeight * 2 + groupGap + barGap) + 9} fill="#8b949e" fontSize="9">You</text>
      <rect x={chartLeft + 40} y={chartTop + outlets.length * (barHeight * 2 + groupGap + barGap)} width="10" height="10" rx="2" fill="#8b949e" opacity="0.5" />
      <text x={chartLeft + 54} y={chartTop + outlets.length * (barHeight * 2 + groupGap + barGap) + 9} fill="#8b949e" fontSize="9">Team Avg</text>
    </svg>
  );
}

function PressRatingPercentileRing({ value }: { value: number }): React.JSX.Element {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const cx = 80;
  const cy = 80;
  const strokeLen = (value / 100) * circumference;
  const gap = 4;
  const dashOffset = circumference / 4;

  const color = value >= 75 ? '#3fb950' : value >= 50 ? '#58a6ff' : value >= 25 ? '#ffa657' : '#f85149';

  const percentile = value * 2.3;

  return (
    <svg viewBox="0 0 160 160" className="w-full h-auto">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth="12" />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={`${strokeLen - gap} ${circumference - strokeLen + gap}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="10">
        Press Rating
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize="11" fontWeight="600">
        Top {100 - percentile > 0 ? (100 - percentile).toFixed(0) : '0'}%
      </text>
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PressScrum() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>('s3');
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set(['q3', 'q5']));
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);

  // ---- Computed Data (using .reduce, no let accumulation) ----

  const questionDifficulties = JOURNALIST_QUESTIONS.map((q) => q.difficulty);

  const momentumData = JOURNALIST_QUESTIONS.map((q) => ({
    quality: q.answered
      ? q.difficulty === 'Easy' ? 85 : q.difficulty === 'Medium' ? 65 : q.difficulty === 'Hard' ? 50 : 30
      : 0,
    difficulty: q.difficulty,
  }));

  const responseQualities = [
    { label: 'Clarity', value: 78, color: '#58a6ff' },
    { label: 'Diplomacy', value: 85, color: '#3fb950' },
    { label: 'Confidence', value: 62, color: '#ffa657' },
    { label: 'Honesty', value: 71, color: '#d2a8ff' },
  ];

  const mediaRelationships = [
    { axis: 'Tabloids', value: 65 },
    { axis: 'Broadsheets', value: 78 },
    { axis: 'Sports', value: 82 },
    { axis: 'Social', value: 70 },
    { axis: 'TV', value: 55 },
    { axis: 'Radio', value: 60 },
  ];

  const pressRatingTrend = [
    { label: 'W3', rating: 62 },
    { label: 'W4', rating: 58 },
    { label: 'W5', rating: 64 },
    { label: 'W6', rating: 72 },
    { label: 'W7', rating: 55 },
    { label: 'W8', rating: 68 },
    { label: 'W9', rating: 75 },
    { label: 'W10', rating: 70 },
    { label: 'W11', rating: 58 },
    { label: 'W12', rating: 80 },
  ];

  const sentimentData = [
    { week: 'W7', positive: 55, negative: 30 },
    { week: 'W8', positive: 70, negative: 20 },
    { week: 'W9', positive: 80, negative: 10 },
    { week: 'W10', positive: 45, negative: 40 },
    { week: 'W11', positive: 30, negative: 55 },
    { week: 'W12', positive: 65, negative: 25 },
  ];

  const headlineCategories = HEADLINES.reduce<{ name: string; count: number; color: string }[]>((acc, h) => {
    const existing = acc.find((c) => c.name === h.category);
    if (existing) {
      existing.count += 1;
    } else {
      const catColors: Record<string, string> = {
        'Match Report': '#58a6ff',
        'Transfer': '#f0883e',
        'Interview': '#3fb950',
        'Analysis': '#d2a8ff',
        'Opinion': '#ffa657',
        'Rumor': '#f85149',
      };
      acc.push({ name: h.category, count: 1, color: catColors[h.category] ?? '#8b949e' });
    }
    return acc;
  }, []);

  const coverageOutlets = [
    { name: 'BBC Sport', count: 14, color: '#f85149' },
    { name: 'Sky Sports', count: 11, color: '#d4a017' },
    { name: 'The Athletic', count: 9, color: '#f0883e' },
    { name: 'ESPN FC', count: 8, color: '#dc2626' },
    { name: 'The Guardian', count: 6, color: '#0f766e' },
    { name: 'Marca', count: 4, color: '#e11d48' },
  ];

  const weeklyTrend = [
    { label: 'W7', positive: 8, neutral: 5, negative: 3 },
    { label: 'W8', positive: 12, neutral: 4, negative: 2 },
    { label: 'W9', positive: 15, neutral: 6, negative: 1 },
    { label: 'W10', positive: 5, neutral: 8, negative: 7 },
    { label: 'W11', positive: 3, neutral: 5, negative: 10 },
    { label: 'W12', positive: 10, neutral: 6, negative: 4 },
  ];

  const quoteQualityData = [
    { type: 'Motivational', score: 82, count: 24, color: '#3fb950' },
    { type: 'Defensive', score: 65, count: 18, color: '#ffa657' },
    { type: 'Tactical', score: 74, count: 15, color: '#58a6ff' },
    { type: 'Personal', score: 58, count: 12, color: '#d2a8ff' },
    { type: 'Controversial', score: 35, count: 5, color: '#f85149' },
  ];

  const outletRatings = [
    { name: 'Tabloids', playerRating: 72, teamAvg: 58 },
    { name: 'Broadsheets', playerRating: 85, teamAvg: 70 },
    { name: 'Sports Pubs', playerRating: 78, teamAvg: 65 },
    { name: 'Digital', playerRating: 68, teamAvg: 72 },
  ];

  const overallPressRating = PRESS_EVENTS.reduce((sum, e) => sum + e.score, 0) / PRESS_EVENTS.length;

  const unansweredCount = JOURNALIST_QUESTIONS.reduce((count, q) => {
    return answeredQuestions.has(q.id) ? count : count + 1;
  }, 0);

  const positiveQuotesCount = NOTABLE_QUOTES.reduce((c, q) => q.impact === 'Positive' ? c + 1 : c, 0);
  const negativeQuotesCount = NOTABLE_QUOTES.reduce((c, q) => q.impact === 'Negative' ? c + 1 : c, 0);

  const strongRelationships = MEDIA_RELATIONSHIPS.reduce((c, r) => r.relationship === 'Strong' || r.relationship === 'Good' ? c + 1 : c, 0);

  const quoteImpactColors: Record<string, string> = {
    Positive: 'text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10',
    Negative: 'text-[#f85149] border-[#f85149]/30 bg-[#f85149]/10',
    Neutral: 'text-[#8b949e] border-[#8b949e]/30 bg-[#8b949e]/10',
  };

  const relationshipColorMap: Record<string, string> = {
    Strong: 'text-[#3fb950]',
    Good: 'text-[#58a6ff]',
    Neutral: 'text-[#ffa657]',
    Poor: 'text-[#f85149]',
  };

  const trendingIcons: Record<string, React.ReactNode> = {
    up: <TrendingUp className="h-3 w-3 text-[#3fb950]" />,
    down: <TrendingDown className="h-3 w-3 text-[#f85149]" />,
    stable: <Minus className="h-3 w-3 text-[#8b949e]" />,
  };

  const handleAnswerQuestion = (id: string) => {
    setAnsweredQuestions((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleToggleTip = (id: string) => {
    setExpandedTip((prev) => (prev === id ? null : id));
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Tab Bar */}
      <div className="bg-[#0d1117] border-b border-[#21262d] px-2 pt-2">
        <div className="flex overflow-x-auto gap-1">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === i
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:border-[#30363d]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-[#58a6ff]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wider">Media Presence</span>
                </div>
                <span className="text-2xl font-bold text-[#c9d1d9]">72</span>
                <span className="text-xs text-[#3fb950] ml-2">+5 this week</span>
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-[#ffa657]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wider">Questions Pending</span>
                </div>
                <span className="text-2xl font-bold text-[#c9d1d9]">{unansweredCount}</span>
                <span className="text-xs text-[#8b949e] ml-2">of {JOURNALIST_QUESTIONS.length}</span>
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#3fb950]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wider">Avg Response</span>
                </div>
                <span className="text-2xl font-bold text-[#c9d1d9]">74%</span>
                <span className="text-xs text-[#3fb950] ml-2">Good</span>
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-[#d2a8ff]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wider">Scrum Rating</span>
                </div>
                <span className="text-2xl font-bold text-[#c9d1d9]">B+</span>
                <span className="text-xs text-[#ffa657] ml-2">Improving</span>
              </div>
            </div>

            {/* SVG Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Media Presence Gauge</h3>
                <MediaPresenceGauge value={72} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Question Difficulty Breakdown</h3>
                <QuestionDifficultyDonut questions={JOURNALIST_QUESTIONS} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Response Quality</h3>
                <ResponseQualityBars qualities={responseQualities} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Conference Momentum</h3>
                <PressConferenceMomentumChart questions={momentumData} />
              </div>
            </div>

            {/* Journalist Questions */}
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-4">Press Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {JOURNALIST_QUESTIONS.map((q, i) => {
                  const diffCfg = DIFFICULTY_CONFIG[q.difficulty];
                  const topicCfg = TOPIC_CONFIG[q.topic];
                  const isAnswered = answeredQuestions.has(q.id);
                  return (
                    <div
                      key={i}
                      className={`bg-[#161b22] border border-[#21262d] p-4 ${isAnswered ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#c9d1d9]">{q.journalist}</span>
                          <span className="text-xs text-[#30363d]">|</span>
                          <span className="text-xs text-[#8b949e]">{q.outlet}</span>
                        </div>
                        <span className="text-xs text-[#30363d]">{q.timeAsked}</span>
                      </div>
                      <p className="text-sm text-[#8b949e] mb-3 leading-relaxed">{'\u201C' + q.question + '\u201D'}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium border ${diffCfg.bgColor} ${diffCfg.color} ${diffCfg.borderColor}`}>
                            {q.difficulty}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium border ${topicCfg.bgColor} ${topicCfg.color} ${topicCfg.borderColor}`}>
                            {q.topic}
                          </span>
                        </div>
                        {isAnswered ? (
                          <span className="flex items-center gap-1 text-xs text-[#3fb950]">
                            <CheckCircle className="h-3 w-3" />
                            Answered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAnswerQuestion(q.id)}
                            className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                          >
                            Respond
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6">
            {/* Strategy Cards */}
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-4">PR Strategy Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STRATEGY_CARDS.map((strategy, i) => {
                  const isSelected = selectedStrategy === strategy.id;
                  const metrics = [
                    { label: 'Media', value: strategy.effectiveness.mediaRelations },
                    { label: 'Fans', value: strategy.effectiveness.fanApproval },
                    { label: 'Board', value: strategy.effectiveness.boardConfidence },
                    { label: 'Morale', value: strategy.effectiveness.playerMorale },
                  ];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedStrategy(strategy.id)}
                      className={`bg-[#161b22] border p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : `border-[#21262d] hover:border-[#30363d] ${strategy.color}`
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {strategy.icon}
                        <span className="text-base font-semibold text-[#c9d1d9]">{strategy.name}</span>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] mb-3 leading-relaxed">{strategy.description}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {metrics.map((m, mi) => (
                          <div key={mi} className="text-center">
                            <div className="text-sm font-bold text-[#c9d1d9]">{m.value}</div>
                            <div className="text-xs text-[#30363d]">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Media Relationship Hex Radar</h3>
                <MediaRelationshipHexRadar relationships={mediaRelationships} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Press Rating Trend (10 Weeks)</h3>
                <PressRatingTrendLine weeks={pressRatingTrend} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Strategy Effectiveness Comparison</h3>
                <StrategyEffectivenessBars strategies={STRATEGY_CARDS} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Headline Sentiment Trend</h3>
                <HeadlineSentimentAreaChart data={sentimentData} />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#3fb950] opacity-60" />
                    <span className="text-xs text-[#8b949e]">Positive</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#f85149] opacity-60" />
                    <span className="text-xs text-[#8b949e]">Negative</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Relationships Overview */}
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-4">Media Relationships Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MEDIA_RELATIONSHIPS.map((rel, i) => (
                  <div key={i} className="bg-[#161b22] border border-[#21262d] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {rel.outletIcon}
                        <span className="text-sm font-semibold text-[#c9d1d9]">{rel.outletType}</span>
                      </div>
                      <span className={`text-xs font-medium ${relationshipColorMap[rel.relationship]}`}>
                        {rel.relationship}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">Last Interaction</span>
                        <span className="text-xs text-[#c9d1d9]">{rel.lastInteraction}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">Trending</span>
                        <div className="flex items-center gap-1">
                          {trendingIcons[rel.trending]}
                          <span className="text-xs capitalize text-[#c9d1d9]">{rel.trending}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">Articles This Month</span>
                        <span className="text-xs text-[#c9d1d9]">{rel.articlesThisMonth}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advisor Tips */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-[#ffa657]" />
                <h2 className="text-lg font-bold text-[#c9d1d9]">PR Advisor Tips</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ADVISOR_TIPS.map((tip, i) => {
                  const priorityCfg = PRIORITY_CONFIG[tip.priority];
                  const isExpanded = expandedTip === tip.id;
                  return (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium ${priorityCfg.bgColor} ${priorityCfg.color}`}>
                          {tip.priority}
                        </span>
                        <span className="text-xs text-[#30363d]">{tip.category}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">{tip.title}</h3>
                      <p className={`text-xs text-[#8b949e] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {tip.description}
                      </p>
                      <button
                        onClick={() => handleToggleTip(tip.id)}
                        className="flex items-center gap-1 text-xs text-[#58a6ff] mt-2 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronRight className={`h-3 w-3 transition-all ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Key Metrics */}
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-4">Strategy Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#161b22] border border-[#21262d] p-4 text-center">
                  <div className="text-2xl font-bold text-[#58a6ff]">{strongRelationships}</div>
                  <div className="text-xs text-[#8b949e] mt-1">Strong/Good Relations</div>
                  <div className="text-xs text-[#30363d] mt-0.5">of {MEDIA_RELATIONSHIPS.length} outlets</div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] p-4 text-center">
                  <div className="text-2xl font-bold text-[#3fb950]">{positiveQuotesCount}</div>
                  <div className="text-xs text-[#8b949e] mt-1">Positive Quotes</div>
                  <div className="text-xs text-[#30363d] mt-0.5">of {NOTABLE_QUOTES.length} total</div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] p-4 text-center">
                  <div className="text-2xl font-bold text-[#f85149]">{negativeQuotesCount}</div>
                  <div className="text-xs text-[#8b949e] mt-1">Negative Quotes</div>
                  <div className="text-xs text-[#30363d] mt-0.5">needs improvement</div>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] p-4 text-center">
                  <div className="text-2xl font-bold text-[#d2a8ff]">A-</div>
                  <div className="text-xs text-[#8b949e] mt-1">PR Grade</div>
                  <div className="text-xs text-[#30363d] mt-0.5">season average</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-6">
            {/* Headline Cards */}
            <div>
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-4">Recent Headlines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HEADLINES.map((h, i) => {
                  const sentCfg = SENTIMENT_CONFIG[h.sentiment];
                  return (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#8b949e]">{h.outlet}</span>
                        <span className="flex items-center gap-1 text-xs text-[#30363d]">
                          <Clock className="h-3 w-3" />
                          {h.date}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2 leading-snug">{h.headline}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${sentCfg.bgColor} ${sentCfg.color} ${sentCfg.borderColor}`}>
                            {sentCfg.icon}
                            {h.sentiment}
                          </span>
                          <span className="px-2 py-0.5 text-xs text-[#8b949e] bg-[#21262d] border border-[#30363d]">
                            {h.category}
                          </span>
                        </div>
                        <span className="text-xs text-[#30363d]">{h.reads}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Headline Frequency by Category</h3>
                <HeadlineFrequencyBars categories={headlineCategories} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Coverage by Outlet</h3>
                <CoverageByOutletDonut outlets={coverageOutlets} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Overall Sentiment Analysis</h3>
                <SentimentAnalysisGauge value={38} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Weekly Headline Trend</h3>
                <WeeklyHeadlineTrend weeks={weeklyTrend} />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#f85149] opacity-80" />
                    <span className="text-xs text-[#8b949e]">Negative</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#8b949e] opacity-60" />
                    <span className="text-xs text-[#8b949e]">Neutral</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#3fb950] opacity-80" />
                    <span className="text-xs text-[#8b949e]">Positive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-[#161b22] border border-[#21262d] p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <PressRatingPercentileRing value={Math.round(overallPressRating)} />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#c9d1d9] mb-1">Career Press Rating</h2>
                  <p className="text-sm text-[#8b949e] mb-4">
                    Your overall media performance across {PRESS_EVENTS.length} press interactions this season.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#0d1117] border border-[#21262d] p-3 text-center">
                      <div className="text-lg font-bold text-[#3fb950]">{PRESS_EVENTS.reduce((c, e) => e.ratingChange > 0 ? c + 1 : c, 0)}</div>
                      <div className="text-xs text-[#30363d]">Positive</div>
                    </div>
                    <div className="bg-[#0d1117] border border-[#21262d] p-3 text-center">
                      <div className="text-lg font-bold text-[#f85149]">{PRESS_EVENTS.reduce((c, e) => e.ratingChange < 0 ? c + 1 : c, 0)}</div>
                      <div className="text-xs text-[#30363d]">Negative</div>
                    </div>
                    <div className="bg-[#0d1117] border border-[#21262d] p-3 text-center">
                      <div className="text-lg font-bold text-[#58a6ff]">{PRESS_EVENTS.reduce((best, e) => Math.max(best, e.score), 0)}</div>
                      <div className="text-xs text-[#30363d]">Best Score</div>
                    </div>
                    <div className="bg-[#0d1117] border border-[#21262d] p-3 text-center">
                      <div className="text-lg font-bold text-[#f0883e]">{PRESS_EVENTS.reduce((worst, e) => Math.min(worst, e.score), 100)}</div>
                      <div className="text-xs text-[#30363d]">Worst Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Press Score Timeline</h3>
                <PressScoreTimeline events={PRESS_EVENTS} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Quote Quality Distribution</h3>
                <QuoteQualityBars quotes={quoteQualityData} />
              </div>
              <div className="bg-[#161b22] border border-[#21262d] p-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Media Outlet Ratings: You vs Team Average</h3>
                <MediaOutletRatingBars outlets={outletRatings} />
              </div>
            </div>

            {/* Notable Quotes */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Quote className="h-5 w-5 text-[#d2a8ff]" />
                <h2 className="text-lg font-bold text-[#c9d1d9]">Notable Quotes This Season</h2>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {NOTABLE_QUOTES.map((nq, i) => (
                  <div
                    key={i}
                    className="bg-[#161b22] border border-[#21262d] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Quote className="h-4 w-4 text-[#30363d] mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#c9d1d9] italic leading-relaxed mb-2">
                          &ldquo;{nq.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs font-medium border ${quoteImpactColors[nq.impact]}`}>
                            {nq.impact}
                          </span>
                          <span className="px-2 py-0.5 text-xs text-[#8b949e] bg-[#21262d] border border-[#30363d]">
                            {nq.type}
                          </span>
                          <span className="text-xs text-[#30363d]">{nq.date}</span>
                        </div>
                        <p className="text-xs text-[#30363d] mt-2">{nq.context}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Press Event Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#c9d1d9]">Press Event History</h2>
                <div className="flex items-center gap-1 text-xs text-[#30363d]">
                  <Info className="h-3 w-3" />
                  <span>Click to highlight</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESS_EVENTS.map((event, i) => {
                  const scoreColor = event.score >= 80 ? 'text-[#3fb950]' : event.score >= 60 ? 'text-[#58a6ff]' : event.score >= 40 ? 'text-[#ffa657]' : 'text-[#f85149]';
                  const changeColor = event.ratingChange > 0 ? 'text-[#3fb950]' : event.ratingChange < 0 ? 'text-[#f85149]' : 'text-[#8b949e]';
                  const changeIcon = event.ratingChange > 0 ? <TrendingUp className="h-3 w-3" /> : event.ratingChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />;
                  const eventTypeColors: Record<PressEventType, string> = {
                    'Post-Match': 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30',
                    'Pre-Match': 'bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30',
                    'Midweek': 'bg-[#d2a8ff]/10 text-[#d2a8ff] border-[#d2a8ff]/30',
                    'Emergency': 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30',
                  };
                  const evtTypeStyle = eventTypeColors[event.eventType];
                  return (
                    <div key={i} className="bg-[#161b22] border border-[#21262d] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium border ${evtTypeStyle}`}>
                          {event.eventType}
                        </span>
                        <span className="text-xs text-[#30363d]">{event.date}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">{event.match}</h3>
                      <p className="text-xs text-[#8b949e] italic mb-3 flex items-start gap-1">
                        <Quote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {event.quote}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#8b949e]">Score:</span>
                          <span className={`text-lg font-bold ${scoreColor}`}>{event.score}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}>
                          {changeIcon}
                          {event.ratingChange > 0 ? '+' : ''}{event.ratingChange}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
