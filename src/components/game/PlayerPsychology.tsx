'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Brain, Heart, Target, Zap, Shield, Flame, Eye, Wind,
  Activity, TrendingUp, Award, BookOpen, Clock, Star,
  ChevronRight, AlertTriangle, Sparkles, Sun, Moon, Compass
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface MentalAttribute {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface MentalEvent {
  id: string;
  title: string;
  description: string;
  impact: number;
  weekAgo: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface ConfidenceEvent {
  id: string;
  title: string;
  description: string;
  impact: number;
  category: 'form' | 'media' | 'team' | 'personal';
}

interface PressureSource {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface CopingStrategy {
  id: string;
  label: string;
  description: string;
  effectiveness: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PsychologyTechnique {
  id: string;
  label: string;
  description: string;
  effectiveness: number;
  duration: string;
  icon: React.ReactNode;
  color: string;
}

interface MindfulnessExercise {
  id: string;
  label: string;
  description: string;
  duration: number;
  completed: boolean;
  icon: React.ReactNode;
  color: string;
}

interface PsychologistTip {
  id: string;
  title: string;
  tip: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: string;
}

type TabIndex = 0 | 1 | 2 | 3;

// ============================================================
// Helper: Generate seeded mental attributes from game state
// ============================================================

function generateMentalAttributes(
  morale: number,
  form: number,
  reputation: number,
  fitness: number,
  age: number,
  traits: string[]
): MentalAttribute[] {
  const bigGameBonus = traits.includes('big_game_player') ? 8 : 0;
  const coolPressure = traits.includes('cool_under_pressure') ? 7 : 0;
  const neverGiveUp = traits.includes('never_give_up') ? 6 : 0;

  const confidence = Math.min(100, Math.max(10,
    Math.round(morale * 0.4 + form * 4 + reputation * 0.15 + (Math.random() * 6 - 3))
  ));
  const focus = Math.min(100, Math.max(10,
    Math.round(morale * 0.3 + fitness * 0.2 + (Math.random() * 8 - 4) + 30)
  ));
  const motivation = Math.min(100, Math.max(10,
    Math.round(morale * 0.35 + form * 3 + reputation * 0.1 + (age < 25 ? 5 : 0) + (Math.random() * 6 - 3))
  ));
  const resilience = Math.min(100, Math.max(10,
    Math.round(morale * 0.25 + neverGiveUp + fitness * 0.15 + (Math.random() * 8 - 4) + 25)
  ));
  const composure = Math.min(100, Math.max(10,
    Math.round(morale * 0.3 + coolPressure + reputation * 0.1 + (Math.random() * 6 - 3) + 20)
  ));
  const aggression = Math.min(100, Math.max(10,
    Math.round(40 + (Math.random() * 10 - 5) + bigGameBonus + (form > 7 ? 8 : 0))
  ));

  return [
    { id: 'confidence', label: 'Confidence', value: confidence, icon: <Zap className="h-4 w-4" />, color: 'text-emerald-400' },
    { id: 'focus', label: 'Focus', value: focus, icon: <Target className="h-4 w-4" />, color: 'text-sky-400' },
    { id: 'motivation', label: 'Motivation', value: motivation, icon: <Flame className="h-4 w-4" />, color: 'text-amber-400' },
    { id: 'resilience', label: 'Resilience', value: resilience, icon: <Shield className="h-4 w-4" />, color: 'text-purple-400' },
    { id: 'composure', label: 'Composure', value: composure, icon: <Compass className="h-4 w-4" />, color: 'text-cyan-400' },
    { id: 'aggression', label: 'Aggression', value: aggression, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-400' },
  ];
}

// ============================================================
// Helper: Generate mental events
// ============================================================

function generateMentalEvents(morale: number, form: number): MentalEvent[] {
  const pool: MentalEvent[] = [
    { id: 'e1', title: 'Match Winner', description: 'Scored the winning goal in stoppage time', impact: 12, weekAgo: 1, type: 'positive' },
    { id: 'e2', title: 'Media Praise', description: 'Named in Team of the Week by sports press', impact: 8, weekAgo: 2, type: 'positive' },
    { id: 'e3', title: 'Tough Defeat', description: 'Lost a closely contested derby match', impact: -6, weekAgo: 3, type: 'negative' },
    { id: 'e4', title: 'Training Ground Incident', description: 'Minor disagreement with teammate in training', impact: -3, weekAgo: 4, type: 'negative' },
    { id: 'e5', title: 'Fan Appreciation', description: 'Received standing ovation from home supporters', impact: 10, weekAgo: 5, type: 'positive' },
    { id: 'e6', title: 'Contract Talks', description: 'Productive discussion with agent about future', impact: 4, weekAgo: 6, type: 'neutral' },
    { id: 'e7', title: 'International Call-Up', description: 'Selected for national squad duty', impact: 15, weekAgo: 2, type: 'positive' },
    { id: 'e8', title: 'Fitness Setback', description: 'Felt minor strain during warm-up', impact: -5, weekAgo: 1, type: 'negative' },
    { id: 'e9', title: 'Personal Achievement', description: 'Reached a personal career milestone', impact: 9, weekAgo: 3, type: 'positive' },
  ];
  return pool.slice(0, 3).map(e => ({
    ...e,
    impact: Math.round(e.impact * (morale / 80 + 0.3)),
  }));
}

// ============================================================
// Helper: Get mood from mental score
// ============================================================

function getMoodFromScore(score: number): { label: string; emoji: string; description: string; color: string; bgColor: string } {
  if (score >= 85) return { label: 'Elite', emoji: '🔥', description: 'You are in the zone. Peak mental performance — everything clicks.', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' };
  if (score >= 70) return { label: 'Confident', emoji: '😊', description: 'Feeling sharp and positive. Ready to take on any challenge.', color: 'text-emerald-300', bgColor: 'bg-emerald-500/5' };
  if (score >= 55) return { label: 'Steady', emoji: '😐', description: 'Balanced mindset. Room to sharpen focus before big games.', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
  if (score >= 40) return { label: 'Uncertain', emoji: '😟', description: 'Some doubts creeping in. Consider mental preparation techniques.', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  if (score >= 25) return { label: 'Struggling', emoji: '😰', description: 'Mental fatigue setting in. Rest and mindfulness recommended.', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
  return { label: 'Critical', emoji: '😤', description: 'Mental state is fragile. Immediate action needed — rest and support.', color: 'text-red-400', bgColor: 'bg-red-500/10' };
}

// ============================================================
// Helper: Generate confidence events
// ============================================================

function generateConfidenceEvents(confidence: number): ConfidenceEvent[] {
  const events: ConfidenceEvent[] = [
    { id: 'c1', title: 'Hat-Trick Performance', description: 'Scored three goals in a single match', impact: 15, category: 'form' },
    { id: 'c2', title: 'Manager Praise', description: 'Publicly commended by the head coach', impact: 8, category: 'team' },
    { id: 'c3', title: 'Viral Social Moment', description: 'Match highlights trending on social media', impact: 6, category: 'media' },
    { id: 'c4', title: 'Personal Fitness Goal', description: 'Hit a new personal best in sprint drills', impact: 5, category: 'personal' },
    { id: 'c5', title: 'Missed Penalty', description: 'Failed to convert from the spot in a key moment', impact: -10, category: 'form' },
    { id: 'c6', title: 'Fan Chants', description: 'Supporters singing your name at the stadium', impact: 7, category: 'team' },
    { id: 'c7', title: 'Critical Media Article', description: ' pundit questioned your starting position', impact: -8, category: 'media' },
    { id: 'c8', title: 'Award Nomination', description: 'Shortlisted for Player of the Month', impact: 9, category: 'personal' },
  ];
  return events;
}

// ============================================================
// Helper: Generate confidence trend data (10 matches)
// ============================================================

function generateConfidenceTrend(current: number): { match: number; value: number }[] {
  const startVal = current - 18 + Math.random() * 12;
  return [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].reduce<{ match: number; value: number }[]>(
    (acc, matchNum) => {
      const prevVal = acc.length > 0 ? acc[acc.length - 1].value : startVal;
      const value = matchNum === 0 ? current : Math.max(15, Math.min(95, Math.round(prevVal + (Math.random() - 0.45) * 14)));
      return [...acc, { match: matchNum, value }];
    },
    []
  );
}

// ============================================================
// Helper: Generate pre/post match confidence comparison
// ============================================================

function generatePrePostMatchConfidence(): { label: string; pre: number; post: number }[] {
  return [
    { label: 'vs Arsenal', pre: 65, post: 72 },
    { label: 'vs Chelsea', pre: 68, post: 55 },
    { label: 'vs Wolves', pre: 60, post: 78 },
    { label: 'vs Liverpool', pre: 70, post: 48 },
    { label: 'vs Brighton', pre: 63, post: 70 },
    { label: 'vs Nott\'m Forest', pre: 66, post: 82 },
  ];
}

// ============================================================
// Helper: Generate pressure sources
// ============================================================

function generatePressureSources(reputation: number, contractYears: number, recentForm: number): PressureSource[] {
  return [
    { id: 'fans', label: 'Fans', value: Math.min(100, Math.round(reputation * 0.6 + recentForm * 3 + Math.random() * 10)), icon: <Heart className="h-4 w-4" />, color: 'text-red-400' },
    { id: 'media', label: 'Media', value: Math.min(100, Math.round(reputation * 0.7 + Math.random() * 15)), icon: <BookOpen className="h-4 w-4" />, color: 'text-amber-400' },
    { id: 'contract', label: 'Contract', value: Math.min(100, Math.round((3 - contractYears) * 25 + Math.random() * 10)), icon: <Star className="h-4 w-4" />, color: 'text-sky-400' },
    { id: 'competition', label: 'Competition', value: Math.min(100, Math.round(30 + Math.random() * 40)), icon: <Zap className="h-4 w-4" />, color: 'text-purple-400' },
    { id: 'expectations', label: 'Expectations', value: Math.min(100, Math.round(reputation * 0.5 + 20 + Math.random() * 10)), icon: <Target className="h-4 w-4" />, color: 'text-emerald-400' },
    { id: 'injuries', label: 'Injuries', value: Math.min(100, Math.round(10 + Math.random() * 30)), icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-400' },
  ];
}

// ============================================================
// Helper: Generate pressure trend (5 weeks)
// ============================================================

function generatePressureTrend(currentPressure: number): { week: number; value: number }[] {
  const startVal = currentPressure - 20 + Math.random() * 15;
  return [4, 3, 2, 1, 0].reduce<{ week: number; value: number }[]>(
    (acc, weekNum) => {
      const prevVal = acc.length > 0 ? acc[acc.length - 1].value : startVal;
      const value = weekNum === 0 ? currentPressure : Math.max(5, Math.min(95, Math.round(prevVal + (Math.random() - 0.5) * 18)));
      return [...acc, { week: weekNum, value }];
    },
    []
  );
}

// ============================================================
// Helper: Generate pressure vs performance scatter data
// ============================================================

function generatePressurePerformanceScatter(): { pressure: number; performance: number }[] {
  return Array.from({ length: 12 }, () => ({
    pressure: Math.round(10 + Math.random() * 80),
    performance: Math.round(3 + Math.random() * 7),
  }));
}

// ============================================================
// Helper: Generate coping strategies
// ============================================================

function getCopingStrategies(): CopingStrategy[] {
  return [
    { id: 'meditation', label: 'Meditation', description: 'Daily mindfulness sessions to stay grounded and calm', effectiveness: 82, icon: <Brain className="h-4 w-4" />, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    { id: 'visualization', label: 'Visualization', description: 'Mental rehearsal of match scenarios and key moments', effectiveness: 75, icon: <Eye className="h-4 w-4" />, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    { id: 'routine', label: 'Pre-Match Routine', description: 'Consistent routine to reduce anxiety and build familiarity', effectiveness: 88, icon: <Clock className="h-4 w-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { id: 'social', label: 'Social Support', description: 'Lean on family, friends, and teammates for emotional support', effectiveness: 70, icon: <Heart className="h-4 w-4" />, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  ];
}

// ============================================================
// Helper: Generate psychology techniques
// ============================================================

function getPsychologyTechniques(): PsychologyTechnique[] {
  return [
    { id: 'vis', label: 'Visualization', description: 'Mentally rehearse successful plays, movements, and match situations', effectiveness: 78, duration: '10 min', icon: <Eye className="h-4 w-4" />, color: 'text-sky-400' },
    { id: 'selftalk', label: 'Self-Talk', description: 'Replace negative thoughts with positive affirmations and cues', effectiveness: 72, duration: '5 min', icon: <Brain className="h-4 w-4" />, color: 'text-purple-400' },
    { id: 'breathing', label: 'Breathing', description: 'Controlled breathing exercises for relaxation and focus', effectiveness: 85, duration: '8 min', icon: <Wind className="h-4 w-4" />, color: 'text-emerald-400' },
    { id: 'routine', label: 'Routine', description: 'Establish a consistent pre-match and pre-training routine', effectiveness: 90, duration: 'Ongoing', icon: <Clock className="h-4 w-4" />, color: 'text-amber-400' },
    { id: 'goalset', label: 'Goal Setting', description: 'Set achievable micro-goals for each session and match', effectiveness: 80, duration: '15 min', icon: <Target className="h-4 w-4" />, color: 'text-cyan-400' },
  ];
}

// ============================================================
// Helper: Generate mindfulness exercises
// ============================================================

function getMindfulnessExercises(): MindfulnessExercise[] {
  return [
    { id: 'body_scan', label: 'Body Scan', description: 'Progressive relaxation from head to toe, releasing tension', duration: 300, completed: false, icon: <Sun className="h-4 w-4" />, color: 'text-amber-400' },
    { id: 'box_breathing', label: 'Box Breathing', description: '4-4-4-4 breathing pattern for instant calm and clarity', duration: 180, completed: false, icon: <Wind className="h-4 w-4" />, color: 'text-emerald-400' },
    { id: 'mindful_walk', label: 'Mindful Walk', description: 'Focused walking meditation connecting movement and breath', duration: 600, completed: false, icon: <Activity className="h-4 w-4" />, color: 'text-sky-400' },
    { id: 'gratitude', label: 'Gratitude Journal', description: 'Reflect on positive moments and achievements in your career', duration: 240, completed: false, icon: <BookOpen className="h-4 w-4" />, color: 'text-purple-400' },
  ];
}

// ============================================================
// Helper: Generate checklist items
// ============================================================

function getChecklistItems(): ChecklistItem[] {
  return [
    { id: 'cl1', label: 'Review match footage', completed: true, category: 'Preparation' },
    { id: 'cl2', label: 'Visualize key scenarios', completed: true, category: 'Mental' },
    { id: 'cl3', label: 'Listen to pre-match playlist', completed: true, category: 'Routine' },
    { id: 'cl4', label: 'Positive self-talk affirmations', completed: false, category: 'Mental' },
    { id: 'cl5', label: 'Team meeting discussion', completed: true, category: 'Team' },
    { id: 'cl6', label: 'Warm-up routine complete', completed: false, category: 'Physical' },
    { id: 'cl7', label: 'Set personal match goals', completed: true, category: 'Mental' },
    { id: 'cl8', label: 'Hydration and nutrition check', completed: false, category: 'Physical' },
  ];
}

// ============================================================
// Helper: Generate psychologist tips
// ============================================================

function getPsychologistTips(): PsychologistTip[] {
  return [
    { id: 't1', title: 'Embrace Pressure', tip: 'View pressure as a privilege, not a burden. It means you are in a position that matters. Reframe anxiety as excitement — they share the same physical symptoms.', category: 'Mindset', icon: <Sparkles className="h-4 w-4" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { id: 't2', title: 'Process Over Outcome', tip: 'Focus on what you can control: your effort, decisions, and reactions. Outcomes are influenced by many factors beyond your control. Trust the process.', category: 'Focus', icon: <Compass className="h-4 w-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { id: 't3', title: 'Recovery Rituals', tip: 'After setbacks, have a structured recovery ritual. Review what went wrong objectively, identify one thing to improve, then move forward. Don\'t dwell.', category: 'Resilience', icon: <Shield className="h-4 w-4" />, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    { id: 't4', title: 'Stay Present', tip: 'When your mind drifts to past mistakes or future worries, use a grounding technique. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.', category: 'Anchoring', icon: <Brain className="h-4 w-4" />, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  ];
}

// ============================================================
// Helper: Generate mood trend (7 days)
// ============================================================

function generateMoodTrend(currentScore: number): { day: string; value: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const startVal = currentScore - 12 + Math.random() * 8;
  return days.reduce<{ day: string; value: number }[]>(
    (acc, day, idx) => {
      const prevVal = acc.length > 0 ? acc[acc.length - 1].value : startVal;
      const isLast = idx === days.length - 1;
      const value = isLast ? currentScore : Math.max(10, Math.min(95, Math.round(prevVal + (Math.random() - 0.45) * 10)));
      return [...acc, { day, value }];
    },
    []
  );
}

// ============================================================
// Helper: High-pressure matches
// ============================================================

function getHighPressureMatches(): { opponent: string; competition: string; pressure: number; week: number }[] {
  return [
    { opponent: 'Man City', competition: 'League', pressure: 92, week: 1 },
    { opponent: 'Real Madrid', competition: 'Champions League', pressure: 97, week: 2 },
    { opponent: 'Liverpool', competition: 'Cup Semi-Final', pressure: 88, week: 3 },
  ];
}

// ============================================================
// Helper: Generate upcoming match list
// ============================================================

function getUpcomingMatchesFromFixtures(
  fixtures: { homeClubId: string; awayClubId: string; competition: string; matchday: number }[],
  clubId: string,
  clubsData: { id: string; name: string; shortName: string }[]
): { opponent: string; competition: string; pressure: number; week: number }[] {
  return fixtures.slice(0, 3).map((f, i) => {
    const isHome = f.homeClubId === clubId;
    const opponentId = isHome ? f.awayClubId : f.homeClubId;
    const opponent = clubsData.find(c => c.id === opponentId);
    return {
      opponent: opponent?.name ?? 'Unknown',
      competition: f.competition.charAt(0).toUpperCase() + f.competition.slice(1),
      pressure: Math.round(50 + Math.random() * 45),
      week: f.matchday,
    };
  });
}

// ============================================================
// SVG: Mental Hex Radar (6-axis)
// ============================================================

function MentalHexRadar({ attributes }: { attributes: MentalAttribute[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const levels = 5;

  const angleOffset = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / 6;

  function getPoint(index: number, r: number): { x: number; y: number } {
    const angle = angleOffset + index * angleStep;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridLevels = Array.from({ length: levels }, (_, lvl) => {
    const r = (radius / levels) * (lvl + 1);
    const pts = Array.from({ length: 6 }, (_, i) => getPoint(i, r));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return { d, r };
  });

  const valuePoints = attributes.map((attr, i) => {
    const r = (attr.value / 100) * radius;
    return getPoint(i, r);
  });
  const valueD = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const labelColors = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#22d3ee', '#f87171'];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 260 }}>
      {/* Grid levels */}
      {gridLevels.map((level, i) => (
        <path
          key={i}
          d={level.d}
          fill="none"
          stroke="#30363d"
          strokeWidth="0.5"
          opacity={i === gridLevels.length - 1 ? 0.6 : 0.3}
        />
      ))}
      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = getPoint(i, radius);
        return (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#30363d" strokeWidth="0.5" opacity={0.4} />
        );
      })}
      {/* Value polygon */}
      <motion.path
        d={valueD}
        fill="#34d399"
        fillOpacity={0.12}
        stroke="#34d399"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      {/* Data points */}
      {valuePoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={labelColors[i]}
          stroke="#0d1117"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.08 }}
        />
      ))}
      {/* Labels */}
      {attributes.map((attr, i) => {
        const labelR = radius + 20;
        const angle = angleOffset + i * angleStep;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text
            key={attr.id}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={labelColors[i]}
            fontSize="10"
            fontWeight="600"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {attr.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Mental Balance Ring (circular progress)
// ============================================================

function describeArc(cx: number, cy: number, r: number, startAngleDeg: number, endAngleDeg: number): string {
  const startAngle = (startAngleDeg - 90) * (Math.PI / 180);
  const endAngle = (endAngleDeg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  if (endAngleDeg - startAngleDeg <= 0) return '';
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function MentalBalanceRing({ score }: { score: number }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 54;
  const sw = 10;

  const ringColor = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';
  const trackArc = describeArc(cx, cy, radius, 0, 359.9);
  const progressArc = score > 0 ? describeArc(cx, cy, radius, 0, Math.min(359.9, (score / 100) * 360)) : '';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 140 }}>
      {/* Track */}
      {trackArc && (
        <path
          d={trackArc}
          fill="none"
          stroke="#21262d"
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
      {/* Progress arc */}
      {progressArc && (
        <motion.path
          d={progressArc}
          fill="none"
          stroke={ringColor}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
      {/* Center text */}
      <motion.text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#c9d1d9"
        fontSize="26"
        fontWeight="bold"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {score}
      </motion.text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#8b949e"
        fontSize="9"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="1.2"
      >
        MENTAL BALANCE
      </text>
    </svg>
  );
}

// ============================================================
// SVG: Mood Trend Area Chart (7 days)
// ============================================================

function MoodTrendAreaChart({ data }: { data: { day: string; value: number }[] }) {
  const vw = 280;
  const vh = 120;
  const padX = 28;
  const padY = 12;
  const chartW = vw - padX * 2;
  const chartH = vh - padY * 2;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    day: d.day,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${points[n - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <svg width={vw} height={vh + 16} viewBox={`0 0 ${vw} ${vh + 16}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {/* Y-axis labels */}
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <text
              x={padX - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fill="#484f58"
              fontSize="8"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {val}
            </text>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3 3" />
          </g>
        );
      })}
      {/* Area fill */}
      <motion.path
        d={areaStr}
        fill="#34d399"
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.path
        d={lineStr}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      {/* Data points and x-axis labels */}
      {points.map((p, i) => {
        const isLast = i === n - 1;
        return (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={isLast ? 4 : 2.5}
              fill={isLast ? '#34d399' : '#161b22'}
              stroke="#34d399"
              strokeWidth={isLast ? 2 : 1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
            />
            <text
              x={p.x}
              y={vh + 12}
              textAnchor="middle"
              fill={isLast ? '#c9d1d9' : '#484f58'}
              fontSize="8"
              fontWeight={isLast ? '700' : '400'}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {p.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Confidence Trend Line Chart (10 matches)
// ============================================================

function ConfidenceTrendLineChart({ data }: { data: { match: number; value: number }[] }) {
  const vw = 280;
  const vh = 130;
  const padX = 32;
  const padY = 12;
  const chartW = vw - padX * 2;
  const chartH = vh - padY * 2;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    match: d.match,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${points[n - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <svg width={vw} height={vh + 20} viewBox={`0 0 ${vw} ${vh + 20}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <line key={val} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3 3" />
        );
      })}
      {/* Y-axis labels */}
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <text
            key={val}
            x={padX - 6}
            y={y}
            textAnchor="end"
            dominantBaseline="central"
            fill="#484f58"
            fontSize="8"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {val}
          </text>
        );
      })}
      {/* Area */}
      <motion.path
        d={areaStr}
        fill="#38bdf8"
        fillOpacity={0.06}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.path
        d={lineStr}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      {/* Points and labels */}
      {points.map((p, i) => {
        const isLast = i === n - 1;
        const isMin = data[i].value === minVal;
        const isMax = data[i].value === maxVal;
        const showLabel = isLast || isMin || isMax;
        return (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={isLast ? 4 : showLabel ? 3 : 2}
              fill={isMax ? '#34d399' : isMin ? '#f87171' : '#161b22'}
              stroke={isMax ? '#34d399' : isMin ? '#f87171' : '#38bdf8'}
              strokeWidth={isLast ? 2 : 1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
            />
            {showLabel && (
              <text
                x={p.x}
                y={p.y - (isMax ? 8 : 10)}
                textAnchor="middle"
                fill={isMax ? '#34d399' : isMin ? '#f87171' : '#c9d1d9'}
                fontSize="8"
                fontWeight="700"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {p.value}
              </text>
            )}
            <text
              x={p.x}
              y={vh + 14}
              textAnchor="middle"
              fill={isLast ? '#c9d1d9' : '#484f58'}
              fontSize="7"
              fontWeight={isLast ? '600' : '400'}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {p.match === 0 ? 'Now' : `-${p.match}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Confidence Breakdown Donut (4 segments via reduce)
// ============================================================

function ConfidenceBreakdownDonut() {
  const segments = [
    { label: 'Form-based', value: 35, color: '#34d399' },
    { label: 'Media-based', value: 20, color: '#fbbf24' },
    { label: 'Team-based', value: 25, color: '#38bdf8' },
    { label: 'Personal', value: 20, color: '#a78bfa' },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 54;
  const innerR = 36;
  const sw = outerR - innerR;

  const angleOffset = -Math.PI / 2;

  const arcs = segments.reduce<{ items: Array<{ d: string; color: string; midAngle: number; label: string; pct: number }>; runningAngle: number }>((carry, seg) => {
    const sliceAngle = (seg.value / total) * 2 * Math.PI;
    const startAngle = carry.runningAngle;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    const midAngle = (startAngle + endAngle) / 2;

    return {
      items: [...carry.items, { d, color: seg.color, midAngle, label: seg.label, pct: seg.value }],
      runningAngle: endAngle,
    };
  }, { items: [], runningAngle: angleOffset }).items;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 140 }}>
      {/* Donut segments */}
      {arcs.map((arc, i) => (
        <motion.path
          key={i}
          d={arc.d}
          fill={arc.color}
          fillOpacity={0.7}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        />
      ))}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#0d1117" />
      {/* Center label */}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize="12" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">
        Sources
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">
        of Confidence
      </text>
      {/* Legend */}
      {segments.map((seg, i) => (
        <g key={seg.label}>
          <rect x={4} y={size - 56 + i * 14} width={8} height={8} rx={2} fill={seg.color} />
          <text x={16} y={size - 50 + i * 14} dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {seg.label} {seg.value}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Pre/Post Match Comparison Bars (6 paired bars)
// ============================================================

function PrePostMatchBars({ data }: { data: { label: string; pre: number; post: number }[] }) {
  const vw = 280;
  const vh = 180;
  const padX = 60;
  const padY = 16;
  const barW = 18;
  const gap = 10;
  const chartW = vw - padX - 16;
  const chartH = vh - padY * 2;
  const barMaxH = chartH - 10;
  const n = data.length;
  const groupWidth = (chartW - (n - 1) * gap) / n;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {/* Y-axis gridlines */}
      {[0, 25, 50, 75, 100].map((val) => {
        const y = padY + barMaxH - (val / 100) * barMaxH;
        return (
          <g key={val}>
            <line x1={padX - 4} y1={y} x2={padX + chartW} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2 2" />
            <text x={padX - 8} y={y} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">
              {val}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((item, i) => {
        const groupX = padX + i * (groupWidth + gap);
        const preH = (item.pre / 100) * barMaxH;
        const postH = (item.post / 100) * barMaxH;
        const preY = padY + barMaxH - preH;
        const postY = padY + barMaxH - postH;
        const improved = item.post >= item.pre;

        return (
          <g key={i}>
            {/* Pre-match bar */}
            <motion.rect
              x={groupX}
              y={preY}
              width={barW}
              height={preH}
              rx={3}
              fill="#38bdf8"
              fillOpacity={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
            />
            {/* Post-match bar */}
            <motion.rect
              x={groupX + barW + 3}
              y={postY}
              width={barW}
              height={postH}
              rx={3}
              fill={improved ? '#34d399' : '#f87171'}
              fillOpacity={0.7}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            />
            {/* Label */}
            <text
              x={groupX + barW + 1}
              y={padY + barMaxH + 12}
              textAnchor="middle"
              fill="#8b949e"
              fontSize="6"
              fontWeight="500"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {item.label}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={vw - 80} y={4} width={8} height={8} rx={2} fill="#38bdf8" fillOpacity={0.6} />
      <text x={vw - 68} y={8} dominantBaseline="central" fill="#8b949e" fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Pre</text>
      <rect x={vw - 44} y={4} width={8} height={8} rx={2} fill="#34d399" fillOpacity={0.7} />
      <text x={vw - 32} y={8} dominantBaseline="central" fill="#8b949e" fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">Post</text>
    </svg>
  );
}

// ============================================================
// SVG: Confidence Recovery Gauge (semi-circular)
// ============================================================

function ConfidenceRecoveryGauge({ speed }: { speed: number }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = 60;
  const sw = 12;
  const startAngle = 180;
  const endAngle = 360;
  const totalArc = endAngle - startAngle;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const filledArc = (speed / 100) * totalArc;
  const filledEndAngle = startAngle + filledArc;
  const startPt = polarToCartesian(startAngle);
  const endPt = polarToCartesian(filledEndAngle);
  const fgPath = speed > 0
    ? `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${filledArc > 180 ? 1 : 0} 1 ${endPt.x} ${endPt.y}`
    : '';

  const gaugeColor = speed >= 70 ? '#34d399' : speed >= 40 ? '#fbbf24' : '#f87171';

  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`} className="block" style={{ width: '100%', maxWidth: 160 }}>
      {/* Track */}
      <motion.path
        d={`M ${polarToCartesian(startAngle).x} ${polarToCartesian(startAngle).y} A ${radius} ${radius} 0 1 1 ${polarToCartesian(endAngle).x} ${polarToCartesian(endAngle).y}`}
        fill="none"
        stroke="#21262d"
        strokeWidth={sw}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      {/* Filled arc */}
      {speed > 0 && (
        <motion.path
          d={fgPath}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
      )}
      {/* Center value */}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize="22" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">
        {speed}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1">
        RECOVERY SPEED
      </text>
    </svg>
  );
}

// ============================================================
// SVG: Pressure Source Bars (6 horizontal bars)
// ============================================================

function PressureSourceBars({ sources }: { sources: PressureSource[] }) {
  const vw = 280;
  const barHeight = 20;
  const gap = 10;
  const labelWidth = 78;
  const padY = 8;
  const chartH = sources.length * (barHeight + gap) - gap;
  const vh = chartH + padY * 2;
  const chartW = vw - labelWidth - 40;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {sources.map((src, i) => {
        const y = padY + i * (barHeight + gap);
        const barW = Math.max(2, (src.value / 100) * chartW);
        const color = src.value >= 70 ? '#f87171' : src.value >= 40 ? '#fbbf24' : '#34d399';

        return (
          <g key={src.id}>
            <text
              x={0}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill="#8b949e"
              fontSize="10"
              fontWeight="500"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {src.label}
            </text>
            {/* Track */}
            <rect x={labelWidth} y={y} width={chartW} height={barHeight} rx={4} fill="#21262d" />
            {/* Bar */}
            <motion.rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={color}
              fillOpacity={0.75}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            />
            {/* Value */}
            <text
              x={labelWidth + chartW + 6}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill={color}
              fontSize="10"
              fontWeight="700"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {src.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Pressure Trend Area Chart (5 weeks)
// ============================================================

function PressureTrendAreaChart({ data }: { data: { week: number; value: number }[] }) {
  const vw = 280;
  const vh = 120;
  const padX = 28;
  const padY = 12;
  const chartW = vw - padX * 2;
  const chartH = vh - padY * 2;
  const n = data.length;

  const points = data.map((d, i) => ({
    x: padX + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value / 100) * chartH),
    value: d.value,
    week: d.week,
  }));

  const lineStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${points[n - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return (
    <svg width={vw} height={vh + 16} viewBox={`0 0 ${vw} ${vh + 16}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {/* Grid */}
      {[0, 50, 100].map((val) => {
        const y = padY + chartH - (val / 100) * chartH;
        return (
          <g key={val}>
            <text x={padX - 6} y={y} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">
              {val}
            </text>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3 3" />
          </g>
        );
      })}
      {/* Area */}
      <motion.path
        d={areaStr}
        fill="#f87171"
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.path
        d={lineStr}
        fill="none"
        stroke="#f87171"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      {/* Points */}
      {points.map((p, i) => {
        const isLast = i === n - 1;
        return (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={isLast ? 4 : 2.5}
              fill={isLast ? '#f87171' : '#161b22'}
              stroke="#f87171"
              strokeWidth={isLast ? 2 : 1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            />
            <text
              x={p.x}
              y={vh + 12}
              textAnchor="middle"
              fill={isLast ? '#c9d1d9' : '#484f58'}
              fontSize="8"
              fontWeight={isLast ? '600' : '400'}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {p.week === 0 ? 'Now' : `-${p.week}w`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Coping Effectiveness Donut (4 segments via reduce)
// ============================================================

function CopingEffectivenessDonut({ strategies }: { strategies: CopingStrategy[] }) {
  const total = strategies.reduce((sum, s) => sum + s.effectiveness, 0);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 54;
  const innerR = 36;
  const colors = ['#a78bfa', '#38bdf8', '#34d399', '#f87171'];

  const angleOffset = -Math.PI / 2;

  const arcs = strategies.reduce<{ items: Array<{ d: string; color: string; label: string; pct: number }>; runningAngle: number }>((carry, strat) => {
    const sliceAngle = (strat.effectiveness / total) * 2 * Math.PI;
    const startAngle = carry.runningAngle;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    return {
      items: [...carry.items, { d, color: colors[carry.items.length % colors.length], label: strat.label, pct: strat.effectiveness }],
      runningAngle: endAngle,
    };
  }, { items: [], runningAngle: angleOffset }).items;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 140 }}>
      {arcs.map((arc, i) => (
        <motion.path
          key={i}
          d={arc.d}
          fill={arc.color}
          fillOpacity={0.65}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#0d1117" />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize="11" fontWeight="bold" fontFamily="ui-sans-serif, system-ui, sans-serif">
        Coping
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">
        Effectiveness
      </text>
      {/* Legend */}
      {strategies.map((s, i) => (
        <g key={s.id}>
          <rect x={4} y={size - 56 + i * 14} width={8} height={8} rx={2} fill={colors[i % colors.length]} />
          <text x={16} y={size - 50 + i * 14} dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {s.label} {s.effectiveness}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Pressure vs Performance Scatter
// ============================================================

function PressureVsPerformanceScatter({ data }: { data: { pressure: number; performance: number }[] }) {
  const vw = 260;
  const vh = 180;
  const padX = 30;
  const padY = 16;
  const chartW = vw - padX - 16;
  const chartH = vh - padY - 30;

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 260 }}>
      {/* Grid */}
      {[0, 50, 100].map((val) => (
        <g key={val}>
          <line x1={padX} y1={padY + chartH - (val / 100) * chartH} x2={padX + chartW} y2={padY + chartH - (val / 100) * chartH} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2 2" />
          <text x={padX - 6} y={padY + chartH - (val / 100) * chartH} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif">
            {val}
          </text>
          <line x1={padX + (val / 100) * chartW} y1={padY} x2={padX + (val / 100) * chartW} y2={padY + chartH} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2 2" />
        </g>
      ))}
      {/* Axis labels */}
      <text x={padX + chartW / 2} y={vh - 4} textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">Pressure →</text>
      <text x={8} y={padY + chartH / 2} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="7" fontFamily="ui-sans-serif, system-ui, sans-serif" writingMode="vertical-rl">Performance</text>
      {/* Scatter points */}
      {data.map((pt, i) => {
        const x = padX + (pt.pressure / 100) * chartW;
        const y = padY + chartH - ((pt.performance / 10) * chartH);
        const perfColor = pt.performance >= 7 ? '#34d399' : pt.performance >= 5 ? '#fbbf24' : '#f87171';
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={5}
            fill={perfColor}
            fillOpacity={0.6}
            stroke={perfColor}
            strokeWidth={1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          />
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Technique Effectiveness Bars (5 horizontal bars)
// ============================================================

function TechniqueEffectivenessBars({ techniques }: { techniques: PsychologyTechnique[] }) {
  const vw = 280;
  const barHeight = 18;
  const gap = 8;
  const labelWidth = 82;
  const padY = 6;
  const chartH = techniques.length * (barHeight + gap) - gap;
  const vh = chartH + padY * 2;
  const chartW = vw - labelWidth - 40;

  const barColors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#22d3ee'];

  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} className="block" style={{ width: '100%', maxWidth: 280 }}>
      {techniques.map((tech, i) => {
        const y = padY + i * (barHeight + gap);
        const barW = Math.max(2, (tech.effectiveness / 100) * chartW);

        return (
          <g key={tech.id}>
            <text
              x={0}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill="#8b949e"
              fontSize="9"
              fontWeight="500"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {tech.label}
            </text>
            <rect x={labelWidth} y={y} width={chartW} height={barHeight} rx={4} fill="#21262d" />
            <motion.rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={barColors[i]}
              fillOpacity={0.7}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            />
            <text
              x={labelWidth + chartW + 6}
              y={y + barHeight / 2}
              dominantBaseline="central"
              fill={barColors[i]}
              fontSize="9"
              fontWeight="700"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {tech.effectiveness}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG: Mindfulness Streak Ring (circular progress)
// ============================================================

function MindfulnessStreakRing({ current, goal }: { current: number; goal: number }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 44;
  const sw = 8;
  const pct = Math.round((current / goal) * 100);
  const trackArc = describeArc(cx, cy, radius, 0, 359.9);
  const progressArc = current > 0 ? describeArc(cx, cy, radius, 0, Math.min(359.9, Math.min(1, current / goal) * 360)) : '';

  const ringColor = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 120 }}>
      {trackArc && (
        <path d={trackArc} fill="none" stroke="#21262d" strokeWidth={sw} strokeLinecap="round" />
      )}
      {progressArc && (
        <motion.path
          d={progressArc}
          fill="none"
          stroke={ringColor}
          strokeWidth={sw}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
      <motion.text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#c9d1d9"
        fontSize="20"
        fontWeight="bold"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {current}/{goal}
      </motion.text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1">
        DAY STREAK
      </text>
    </svg>
  );
}

// ============================================================
// SVG: Preparation Checklist Progress (stacked bar)
// ============================================================

function PreparationChecklistProgress({ items }: { items: ChecklistItem[] }) {
  const total = items.length;
  const completed = items.reduce((sum, item) => sum + (item.completed ? 1 : 0), 0);
  const pct = Math.round((completed / total) * 100);

  const categories = ['Preparation', 'Mental', 'Routine', 'Team', 'Physical'];
  const catColors: Record<string, string> = {
    'Preparation': '#34d399',
    'Mental': '#a78bfa',
    'Routine': '#fbbf24',
    'Team': '#38bdf8',
    'Physical': '#f87171',
  };

  const categoryBreakdown = categories.reduce<Array<{ cat: string; total: number; done: number; color: string }>>((acc, cat) => {
    const catItems = items.filter(it => it.category === cat);
    if (catItems.length === 0) return acc;
    acc.push({
      cat,
      total: catItems.length,
      done: catItems.filter(it => it.completed).length,
      color: catColors[cat] ?? '#30363d',
    });
    return acc;
  }, []);

  const segmentWidths = categoryBreakdown.map(cb => (cb.total / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">Checklist Completion</span>
        <span className="text-xs font-bold text-emerald-400">{completed}/{total} ({pct}%)</span>
      </div>
      {/* Stacked bar */}
      <div className="h-5 bg-[#21262d] rounded-lg overflow-hidden flex">
        {categoryBreakdown.map((cb, i) => {
          const segWidth = segmentWidths[i];
          const completedWidth = segWidth * (cb.done / cb.total);
          const remainingWidth = segWidth - completedWidth;

          return (
            <div key={cb.cat} className="flex" style={{ width: `${segWidth}%` }}>
              <motion.div
                className="h-full"
                style={{ width: `${cb.total > 0 ? (cb.done / cb.total) * 100 : 0}%`, backgroundColor: cb.color, opacity: 0.75 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              />
              <div className="h-full bg-[#161b22]" style={{ width: `${cb.total > 0 ? ((cb.total - cb.done) / cb.total) * 100 : 0}%` }} />
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {categoryBreakdown.map(cb => (
          <div key={cb.cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cb.color }} />
            <span className="text-[9px] text-[#8b949e]">{cb.cat} ({cb.done}/{cb.total})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SVG: Psychological Profile Radar (5-axis)
// ============================================================

function PsychologicalProfileRadar({ attributes }: { attributes: { label: string; value: number; color: string }[] }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 88;
  const levels = 5;
  const n = attributes.length;
  const angleOffset = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / n;

  function getPoint(index: number, r: number): { x: number; y: number } {
    const angle = angleOffset + index * angleStep;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridLevels = Array.from({ length: levels }, (_, lvl) => {
    const r = (radius / levels) * (lvl + 1);
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, r));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return { d };
  });

  const valuePoints = attributes.map((attr, i) => {
    const r = (attr.value / 100) * radius;
    return getPoint(i, r);
  });
  const valueD = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" style={{ width: '100%', maxWidth: 240 }}>
      {gridLevels.map((level, i) => (
        <path key={i} d={level.d} fill="none" stroke="#30363d" strokeWidth="0.5" opacity={i === gridLevels.length - 1 ? 0.6 : 0.3} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#30363d" strokeWidth="0.5" opacity={0.4} />;
      })}
      <motion.path
        d={valueD}
        fill="#a78bfa"
        fillOpacity={0.12}
        stroke="#a78bfa"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      {valuePoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={attributes[i].color}
          stroke="#0d1117"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.1 }}
        />
      ))}
      {attributes.map((attr, i) => {
        const labelR = radius + 18;
        const angle = angleOffset + i * angleStep;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <text
            key={attr.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={attr.color}
            fontSize="9"
            fontWeight="600"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {attr.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Section Card Wrapper
// ============================================================

function SectionCard({ title, icon, children, delay = 0 }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="bg-[#161b22] border border-[#21262d] rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-emerald-400">{icon}</span>
        <h3 className="text-sm font-bold text-[#c9d1d9]">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ============================================================
// Tab 1: Mental State Dashboard
// ============================================================

function MentalStateDashboard({ attributes, moodData, events, overallScore, moodTrend }: {
  attributes: MentalAttribute[];
  moodData: ReturnType<typeof getMoodFromScore>;
  events: MentalEvent[];
  overallScore: number;
  moodTrend: { day: string; value: number }[];
}) {
  return (
    <div className="space-y-4">
      {/* Overall Score + Mood Indicator */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Overall Mental Health" icon={<Brain className="h-4 w-4" />} delay={0.05}>
          <div className="flex justify-center">
            <MentalBalanceRing score={overallScore} />
          </div>
          <p className="text-[10px] text-[#8b949e] text-center mt-2 leading-relaxed">
            Combined score across all mental attributes
          </p>
        </SectionCard>

        <SectionCard title="Current Mood" icon={<Sun className="h-4 w-4" />} delay={0.1}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-xl ${moodData.bgColor} flex items-center justify-center`}>
              <span className="text-4xl" role="img" aria-label="mood">{moodData.emoji}</span>
            </div>
            <span className={`text-sm font-bold ${moodData.color}`}>{moodData.label}</span>
            <p className="text-[10px] text-[#8b949e] text-center leading-relaxed px-2">{moodData.description}</p>
          </div>
        </SectionCard>
      </div>

      {/* 6 Mental Attribute Cards */}
      <SectionCard title="Mental Attributes" icon={<Activity className="h-4 w-4" />} delay={0.15}>
        <div className="grid grid-cols-3 gap-2">
          {attributes.map((attr, i) => {
            const barColor = attr.value >= 70 ? 'bg-emerald-500' : attr.value >= 45 ? 'bg-amber-500' : 'bg-red-500';
            return (
              <motion.div
                key={attr.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5"
              >
                <div className={`w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center ${attr.color} mb-1.5`}>
                  {attr.icon}
                </div>
                <span className="text-[10px] text-[#8b949e] block">{attr.label}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-bold text-[#c9d1d9]">{attr.value}</span>
                  <div className="flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                    <motion.div
                      className={`h-full rounded-md ${barColor}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      style={{ width: `${attr.value}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* Recent Mental Events */}
      <SectionCard title="Recent Mental Events" icon={<Clock className="h-4 w-4" />} delay={0.2}>
        <div className="space-y-2">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                event.type === 'positive' ? 'border-emerald-500/20 bg-emerald-500/5' :
                event.type === 'negative' ? 'border-red-500/20 bg-red-500/5' :
                'border-[#21262d] bg-[#0d1117]'
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                event.type === 'positive' ? 'bg-emerald-500/10' :
                event.type === 'negative' ? 'bg-red-500/10' :
                'bg-[#21262d]'
              }`}>
                {event.type === 'positive' ? <TrendingUp className="h-3 w-3 text-emerald-400" /> :
                 event.type === 'negative' ? <AlertTriangle className="h-3 w-3 text-red-400" /> :
                 <Activity className="h-3 w-3 text-[#8b949e]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{event.title}</span>
                  <span className={`text-[10px] font-bold ${
                    event.impact > 0 ? 'text-emerald-400' : event.impact < 0 ? 'text-red-400' : 'text-[#8b949e]'
                  }`}>
                    {event.impact > 0 ? '+' : ''}{event.impact}
                  </span>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-0.5">{event.description}</p>
                <span className="text-[9px] text-[#484f58]">{event.weekAgo}w ago</span>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Mental Hex Radar */}
      <SectionCard title="Mental Hex Radar" icon={<Compass className="h-4 w-4" />} delay={0.25}>
        <div className="flex justify-center">
          <MentalHexRadar attributes={attributes} />
        </div>
      </SectionCard>

      {/* Mood Trend Area Chart */}
      <SectionCard title="Mood Trend (7-Day)" icon={<TrendingUp className="h-4 w-4" />} delay={0.3}>
        <div className="flex justify-center">
          <MoodTrendAreaChart data={moodTrend} />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 2: Confidence Tracker
// ============================================================

function ConfidenceTracker({ confidence, events, prePostData, trendData, recoverySpeed }: {
  confidence: number;
  events: ConfidenceEvent[];
  prePostData: { label: string; pre: number; post: number }[];
  trendData: { match: number; value: number }[];
  recoverySpeed: number;
}) {
  const confidenceLevel = useMemo(() => {
    if (confidence >= 85) return { label: 'Very High', description: 'You believe you can beat anyone. Channel it wisely.', color: 'text-emerald-400' };
    if (confidence >= 65) return { label: 'High', description: 'Strong self-belief driving positive performances.', color: 'text-emerald-300' };
    if (confidence >= 45) return { label: 'Moderate', description: 'Some uncertainty. Focus on process, not outcomes.', color: 'text-amber-400' };
    if (confidence >= 25) return { label: 'Low', description: 'Self-doubt creeping in. Work with your support network.', color: 'text-orange-400' };
    return { label: 'Critical', description: 'Confidence is shattered. Rebuild through small wins.', color: 'text-red-400' };
  }, [confidence]);

  return (
    <div className="space-y-4">
      {/* Confidence Level */}
      <SectionCard title="Current Confidence" icon={<Zap className="h-4 w-4" />} delay={0.05}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-emerald-400">{confidence}</span>
          </div>
          <div className="flex-1">
            <span className={`text-sm font-bold ${confidenceLevel.color}`}>{confidenceLevel.label}</span>
            <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{confidenceLevel.description}</p>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden mt-2">
              <motion.div
                className="h-full rounded-md bg-emerald-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Confidence Events */}
      <SectionCard title="Confidence Events" icon={<Activity className="h-4 w-4" />} delay={0.1}>
        <div className="space-y-2">
          {events.map((event, i) => {
            const catColors: Record<string, string> = {
              form: 'bg-emerald-500/10 text-emerald-400',
              media: 'bg-amber-500/10 text-amber-400',
              team: 'bg-sky-500/10 text-sky-400',
              personal: 'bg-purple-500/10 text-purple-400',
            };
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-[#21262d] bg-[#0d1117]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#c9d1d9]">{event.title}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-medium ${catColors[event.category] ?? ''}`}>
                      {event.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">{event.description}</p>
                </div>
                <span className={`text-[10px] font-bold shrink-0 ${
                  event.impact > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {event.impact > 0 ? '+' : ''}{event.impact}
                </span>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* Confidence Trend */}
      <SectionCard title="Confidence Trend (Last 10 Matches)" icon={<TrendingUp className="h-4 w-4" />} delay={0.15}>
        <div className="flex justify-center">
          <ConfidenceTrendLineChart data={trendData} />
        </div>
      </SectionCard>

      {/* Confidence Breakdown Donut + Recovery Gauge */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Breakdown" icon={<Sparkles className="h-4 w-4" />} delay={0.2}>
          <div className="flex justify-center">
            <ConfidenceBreakdownDonut />
          </div>
        </SectionCard>

        <SectionCard title="Recovery" icon={<Heart className="h-4 w-4" />} delay={0.25}>
          <div className="flex justify-center">
            <ConfidenceRecoveryGauge speed={recoverySpeed} />
          </div>
          <p className="text-[9px] text-[#8b949e] text-center mt-1">
            How quickly confidence returns after setbacks
          </p>
        </SectionCard>
      </div>

      {/* Pre/Post Match Comparison */}
      <SectionCard title="Pre-Match vs Post-Match Confidence" icon={<ChevronRight className="h-4 w-4" />} delay={0.3}>
        <div className="flex justify-center">
          <PrePostMatchBars data={prePostData} />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 3: Pressure Management
// ============================================================

function PressureManagement({ pressureLevel, sources, strategies, highPressureMatches, pressureTrend, scatterData }: {
  pressureLevel: number;
  sources: PressureSource[];
  strategies: CopingStrategy[];
  highPressureMatches: { opponent: string; competition: string; pressure: number; week: number }[];
  pressureTrend: { week: number; value: number }[];
  scatterData: { pressure: number; performance: number }[];
}) {
  const pressureDesc = useMemo(() => {
    if (pressureLevel >= 80) return { label: 'Extreme', description: 'Crushing pressure. Risk of burnout and poor decisions.', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (pressureLevel >= 60) return { label: 'High', description: 'Significant pressure. Use coping strategies to manage.', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    if (pressureLevel >= 40) return { label: 'Moderate', description: 'Normal competitive pressure. Channel it into motivation.', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
    if (pressureLevel >= 20) return { label: 'Low', description: 'Minimal pressure. Stay alert and maintain standards.', color: 'text-emerald-300', bgColor: 'bg-emerald-500/5' };
    return { label: 'None', description: 'No external pressure. Focus on self-improvement.', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' };
  }, [pressureLevel]);

  return (
    <div className="space-y-4">
      {/* Current Pressure Level */}
      <SectionCard title="Current Pressure Level" icon={<AlertTriangle className="h-4 w-4" />} delay={0.05}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl ${pressureDesc.bgColor} flex items-center justify-center shrink-0`}>
            <span className="text-2xl font-bold" style={{ color: pressureLevel >= 70 ? '#f87171' : pressureLevel >= 40 ? '#fbbf24' : '#34d399' }}>
              {pressureLevel}
            </span>
          </div>
          <div className="flex-1">
            <span className={`text-sm font-bold ${pressureDesc.color}`}>{pressureDesc.label} Pressure</span>
            <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{pressureDesc.description}</p>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden mt-2">
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: pressureLevel >= 70 ? '#f87171' : pressureLevel >= 40 ? '#fbbf24' : '#34d399' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Pressure Sources */}
      <SectionCard title="Pressure Sources" icon={<Activity className="h-4 w-4" />} delay={0.1}>
        <div className="flex justify-center">
          <PressureSourceBars sources={sources} />
        </div>
      </SectionCard>

      {/* Pressure Trend + Coping Effectiveness */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Pressure Trend (5 Weeks)" icon={<TrendingUp className="h-4 w-4" />} delay={0.15}>
          <div className="flex justify-center">
            <PressureTrendAreaChart data={pressureTrend} />
          </div>
        </SectionCard>

        <SectionCard title="Coping Effectiveness" icon={<Shield className="h-4 w-4" />} delay={0.2}>
          <div className="flex justify-center">
            <CopingEffectivenessDonut strategies={strategies} />
          </div>
        </SectionCard>
      </div>

      {/* Pressure vs Performance Scatter */}
      <SectionCard title="Pressure vs Performance" icon={<Target className="h-4 w-4" />} delay={0.25}>
        <div className="flex justify-center">
          <PressureVsPerformanceScatter data={scatterData} />
        </div>
        <p className="text-[9px] text-[#484f58] text-center mt-2">Higher pressure (right) vs match rating (up). Green = good performance.</p>
      </SectionCard>

      {/* Coping Strategies */}
      <SectionCard title="Coping Strategies" icon={<Brain className="h-4 w-4" />} delay={0.3}>
        <div className="grid grid-cols-2 gap-2">
          {strategies.map((strat, i) => (
            <motion.div
              key={strat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5"
            >
              <div className={`w-7 h-7 rounded-lg ${strat.bgColor} flex items-center justify-center ${strat.color} mb-1.5`}>
                {strat.icon}
              </div>
              <span className="text-xs font-semibold text-[#c9d1d9] block">{strat.label}</span>
              <p className="text-[9px] text-[#8b949e] mt-0.5 leading-relaxed">{strat.description}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex-1 h-1 bg-[#21262d] rounded-md overflow-hidden">
                  <motion.div
                    className="h-full rounded-md bg-emerald-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    style={{ width: `${strat.effectiveness}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-emerald-400">{strat.effectiveness}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* High-Pressure Matches */}
      <SectionCard title="Upcoming High-Pressure Matches" icon={<Flame className="h-4 w-4" />} delay={0.35}>
        <div className="space-y-2">
          {highPressureMatches.map((match, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-[#21262d] bg-[#0d1117]"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                match.pressure >= 90 ? 'bg-red-500/10' : match.pressure >= 75 ? 'bg-amber-500/10' : 'bg-[#21262d]'
              }`}>
                <Flame className={`h-4 w-4 ${
                  match.pressure >= 90 ? 'text-red-400' : match.pressure >= 75 ? 'text-amber-400' : 'text-[#8b949e]'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-[#c9d1d9]">vs {match.opponent}</span>
                <p className="text-[10px] text-[#8b949e]">{match.competition}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-sm font-bold ${
                  match.pressure >= 90 ? 'text-red-400' : match.pressure >= 75 ? 'text-amber-400' : 'text-[#8b949e]'
                }`}>{match.pressure}</span>
                <p className="text-[8px] text-[#484f58]">pressure</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Psychology Profile Attributes (constant)
// ============================================================

const PSYCHOLOGICAL_PROFILE_ATTRIBUTES = [
  { label: 'Mental Toughness', value: 76, color: '#34d399' },
  { label: 'Emotional Ctrl', value: 62, color: '#38bdf8' },
  { label: 'Self-Belief', value: 70, color: '#fbbf24' },
  { label: 'Focus', value: 81, color: '#a78bfa' },
  { label: 'Competitiveness', value: 85, color: '#f87171' },
];

// ============================================================
// Tab 4: Psychology Toolkit
// ============================================================

function PsychologyToolkit({ techniques, exercises, checklistItems, tips, streak }: {
  techniques: PsychologyTechnique[];
  exercises: MindfulnessExercise[];
  checklistItems: ChecklistItem[];
  tips: PsychologistTip[];
  streak: { current: number; goal: number };
}) {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState<number>(0);
  const [toggledChecklist, setToggledChecklist] = useState<Record<string, boolean>>(() =>
    checklistItems.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = item.completed;
      return acc;
    }, {})
  );

  const startExercise = useCallback((exercise: MindfulnessExercise) => {
    setActiveExercise(exercise.id);
    setExerciseTimer(exercise.duration);
  }, []);

  const toggleChecklist = useCallback((id: string) => {
    setToggledChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const updatedChecklist = useMemo(() =>
    checklistItems.map(item => ({ ...item, completed: toggledChecklist[item.id] ?? item.completed })),
    [checklistItems, toggledChecklist]
  );

  return (
    <div className="space-y-4">
      {/* Technique Effectiveness + Profile Radar */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Technique Effectiveness" icon={<Award className="h-4 w-4" />} delay={0.05}>
          <div className="flex justify-center">
            <TechniqueEffectivenessBars techniques={techniques} />
          </div>
        </SectionCard>

        <SectionCard title="Psych Profile" icon={<Brain className="h-4 w-4" />} delay={0.1}>
          <div className="flex justify-center">
            <PsychologicalProfileRadar attributes={PSYCHOLOGICAL_PROFILE_ATTRIBUTES} />
          </div>
        </SectionCard>
      </div>

      {/* Psychology Techniques */}
      <SectionCard title="Sports Psychology Techniques" icon={<BookOpen className="h-4 w-4" />} delay={0.15}>
        <div className="space-y-2">
          {techniques.map((tech, i) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-[#21262d] bg-[#0d1117]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0 mt-0.5">
                <span className={tech.color}>{tech.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#c9d1d9]">{tech.label}</span>
                  <span className="text-[9px] text-[#484f58]">{tech.duration}</span>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{tech.description}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1 bg-[#21262d] rounded-md overflow-hidden">
                    <motion.div
                      className="h-full rounded-md bg-emerald-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      style={{ width: `${tech.effectiveness}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400">{tech.effectiveness}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Mindfulness Exercises with Streak Ring */}
      <div className="grid grid-cols-3 gap-3">
        <SectionCard title="Practice Streak" icon={<Star className="h-4 w-4" />} delay={0.2}>
          <div className="flex justify-center">
            <MindfulnessStreakRing current={streak.current} goal={streak.goal} />
          </div>
        </SectionCard>

        <SectionCard title="Mindfulness Exercises" icon={<Moon className="h-4 w-4" />} delay={0.25}>
          <div className="space-y-2">
            {exercises.map((ex, i) => {
              const isActive = activeExercise === ex.id;
              const minutes = Math.floor(exerciseTimer / 60);
              const seconds = exerciseTimer % 60;

              return (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#21262d] bg-[#0d1117]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                    <span className={ex.color}>{ex.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-[#c9d1d9]">{ex.label}</span>
                    <p className="text-[9px] text-[#8b949e]">{ex.duration / 60} min session</p>
                  </div>
                  {isActive ? (
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">
                      {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      onClick={() => startExercise(ex)}
                      className="text-[9px] font-semibold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      Start
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Preparation Checklist */}
      <SectionCard title="Pre-Match Mental Preparation" icon={<Target className="h-4 w-4" />} delay={0.35}>
        <PreparationChecklistProgress items={updatedChecklist} />
        <div className="mt-3 space-y-1.5">
          {updatedChecklist.map((item) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + updatedChecklist.indexOf(item) * 0.04 }}
              onClick={() => toggleChecklist(item.id)}
              className={`flex items-center gap-2.5 w-full p-2 rounded-lg border text-left transition-colors ${
                item.completed
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-[#21262d] bg-[#0d1117] hover:bg-[#161b22]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                item.completed ? 'border-emerald-500 bg-emerald-500/20' : 'border-[#30363d]'
              }`}>
                {item.completed && (
                  <span className="text-emerald-400 text-[10px] font-bold">{'\u2713'}</span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${item.completed ? 'text-[#8b949e] line-through' : 'text-[#c9d1d9]'}`}>
                {item.label}
              </span>
              <span className="ml-auto text-[8px] text-[#484f58] shrink-0">{item.category}</span>
            </motion.button>
          ))}
        </div>
      </SectionCard>

      {/* Sports Psychologist Recommendations */}
      <SectionCard title="Sports Psychologist Recommendations" icon={<Sparkles className="h-4 w-4" />} delay={0.4}>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              className="p-3 rounded-lg border border-[#21262d] bg-[#0d1117]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-md ${tip.bgColor} flex items-center justify-center ${tip.color}`}>
                  {tip.icon}
                </div>
                <span className="text-xs font-bold text-[#c9d1d9]">{tip.title}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-[#21262d] text-[#8b949e] font-medium ml-auto">{tip.category}</span>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{tip.tip}</p>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab Navigation
// ============================================================

const TAB_CONFIG = [
  { id: 0, label: 'Mental State', icon: <Brain className="h-4 w-4" /> },
  { id: 1, label: 'Confidence', icon: <Zap className="h-4 w-4" /> },
  { id: 2, label: 'Pressure', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 3, label: 'Toolkit', icon: <BookOpen className="h-4 w-4" /> },
] as const;

// ============================================================
// Main Component
// ============================================================

export default function PlayerPsychology(): React.JSX.Element {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabIndex>(0);

  const player = gameState?.player ?? {} as import('@/lib/game/types').Player;
  const club = gameState?.currentClub ?? {} as import('@/lib/game/types').Club;
  const upcomingFixtures = gameState?.upcomingFixtures ?? [];
  const availableClubs = gameState?.availableClubs ?? [];

  // All hooks before any conditional return
  const mentalAttributes = useMemo(() =>
    generateMentalAttributes(
      player.morale ?? 50,
      player.form ?? 5,
      player.reputation ?? 30,
      player.fitness ?? 70,
      player.age ?? 18,
      player.traits ?? []
    ),
    [player.morale, player.form, player.reputation, player.fitness, player.age, player.traits]
  );

  const overallMentalScore = useMemo(() =>
    Math.round(mentalAttributes.reduce((sum, attr) => sum + attr.value, 0) / mentalAttributes.length),
    [mentalAttributes]
  );

  const moodData = useMemo(() => getMoodFromScore(overallMentalScore), [overallMentalScore]);

  const mentalEvents = useMemo(() =>
    generateMentalEvents(player.morale ?? 50, player.form ?? 5),
    [player.morale, player.form]
  );

  const moodTrend = useMemo(() =>
    generateMoodTrend(overallMentalScore),
    [overallMentalScore]
  );

  const confidenceLevel = useMemo(() =>
    Math.min(100, Math.max(10, Math.round((player.morale ?? 50) * 0.6 + (player.form ?? 5) * 4 + (player.reputation ?? 30) * 0.15))),
    [player.morale, player.form, player.reputation]
  );

  const confidenceEvents = useMemo(() =>
    generateConfidenceEvents(confidenceLevel),
    [confidenceLevel]
  );

  const confidenceTrend = useMemo(() =>
    generateConfidenceTrend(confidenceLevel),
    [confidenceLevel]
  );

  const prePostMatchData = useMemo(() =>
    generatePrePostMatchConfidence(),
    []
  );

  const recoverySpeed = useMemo(() =>
    Math.round(40 + ((player.traits ?? []).includes('never_give_up') ? 25 : 0) + (player.fitness ?? 70) * 0.2 + Math.random() * 15),
    [player.traits, player.fitness]
  );

  const pressureLevel = useMemo(() =>
    Math.round(30 + (player.reputation ?? 30) * 0.3 + (player.contract?.yearsRemaining !== undefined ? (3 - Math.min(3, player.contract.yearsRemaining)) * 8 : 0) + Math.random() * 15),
    [player.reputation, player.contract?.yearsRemaining]
  );

  const pressureSources = useMemo(() =>
    generatePressureSources(player.reputation ?? 30, player.contract?.yearsRemaining ?? 3, player.form ?? 5),
    [player.reputation, player.contract?.yearsRemaining, player.form]
  );

  const pressureTrend = useMemo(() =>
    generatePressureTrend(pressureLevel),
    [pressureLevel]
  );

  const scatterData = useMemo(() =>
    generatePressurePerformanceScatter(),
    []
  );

  const copingStrategies = useMemo(() =>
    getCopingStrategies(),
    []
  );

  const psychologyTechniques = useMemo(() =>
    getPsychologyTechniques(),
    []
  );

  const mindfulnessExercises = useMemo(() =>
    getMindfulnessExercises(),
    []
  );

  const checklistItems = useMemo(() =>
    getChecklistItems(),
    []
  );

  const psychologistTips = useMemo(() =>
    getPsychologistTips(),
    []
  );

  const highPressureMatches = useMemo(() =>
    getUpcomingMatchesFromFixtures(
      upcomingFixtures.slice(0, 3).map(f => ({
        homeClubId: f.homeClubId,
        awayClubId: f.awayClubId,
        competition: f.competition,
        matchday: f.matchday,
      })),
      club.id,
      availableClubs
    ).length > 0
      ? getUpcomingMatchesFromFixtures(
          upcomingFixtures.slice(0, 3).map(f => ({
            homeClubId: f.homeClubId,
            awayClubId: f.awayClubId,
            competition: f.competition,
            matchday: f.matchday,
          })),
          club.id,
          availableClubs
        )
      : getHighPressureMatches(),
    [upcomingFixtures, club.id, availableClubs]
  );

  const streak = useMemo(() => ({
    current: Math.floor(Math.random() * 14) + 3,
    goal: 30,
  }), []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e] text-sm">No active career found. Start a new career to access Player Psychology.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] pb-20">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#21262d] px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#c9d1d9]">Player Psychology</h1>
            <p className="text-[10px] text-[#8b949e]">Mindset, confidence, and mental performance management</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">{overallMentalScore}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabIndex)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="tab-mental"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MentalStateDashboard
                attributes={mentalAttributes}
                moodData={moodData}
                events={mentalEvents}
                overallScore={overallMentalScore}
                moodTrend={moodTrend}
              />
            </motion.div>
          )}
          {activeTab === 1 && (
            <motion.div
              key="tab-confidence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ConfidenceTracker
                confidence={confidenceLevel}
                events={confidenceEvents}
                prePostData={prePostMatchData}
                trendData={confidenceTrend}
                recoverySpeed={recoverySpeed}
              />
            </motion.div>
          )}
          {activeTab === 2 && (
            <motion.div
              key="tab-pressure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PressureManagement
                pressureLevel={pressureLevel}
                sources={pressureSources}
                strategies={copingStrategies}
                highPressureMatches={highPressureMatches}
                pressureTrend={pressureTrend}
                scatterData={scatterData}
              />
            </motion.div>
          )}
          {activeTab === 3 && (
            <motion.div
              key="tab-toolkit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PsychologyToolkit
                techniques={psychologyTechniques}
                exercises={mindfulnessExercises}
                checklistItems={checklistItems}
                tips={psychologistTips}
                streak={streak}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
