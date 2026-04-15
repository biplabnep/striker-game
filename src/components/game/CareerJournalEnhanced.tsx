'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Star,
  Calendar,
  Trophy,
  Heart,
  MessageCircle,
  Target,
  TrendingUp,
  Brain,
  Award,
  PenLine,
  ChevronRight,
  Clock,
  Zap,
  Flame,
  Shield,
} from 'lucide-react';

/* ================================================================
   Seeded PRNG — deterministic data from playerName + week + extra
   ================================================================ */

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(playerName: string, week: number, extra: string = ''): number {
  const seed = hashSeed(`${playerName}-cje-w${week}-${extra}`);
  return mulberry32(seed)();
}

function seededInt(playerName: string, week: number, extra: string, min: number, max: number): number {
  return Math.floor(seededRandom(playerName, week, extra) * (max - min + 1)) + min;
}

/* ================================================================
   Internal Types
   ================================================================ */

interface JournalEntryData {
  id: string;
  week: number;
  month: number;
  title: string;
  excerpt: string;
  mood: number;
}

interface MemoryItem {
  id: string;
  week: number;
  title: string;
  category: 'goals' | 'trophies' | 'records' | 'milestones';
  impact: number;
}

interface GrowthArea {
  label: string;
  current: number;
  previous: number;
}

interface GoalItem {
  id: string;
  title: string;
  category: 'performance' | 'financial' | 'personal' | 'team' | 'awards';
  progress: number;
  target: number;
}

interface ReflectionPeriod {
  label: string;
  rating: number;
}

interface TrajectoryPoint {
  week: number;
  value: number;
  label: string;
}

/* ================================================================
   Constants
   ================================================================ */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const JOURNAL_TITLES = [
  'First Day at the Academy',
  'Breakthrough Performance',
  'Tough Defeat Against Rivals',
  'Contract Renewal Talks',
  'Training Ground Grind',
  'Fan Appreciation Day',
  'Under the Floodlights',
  'Setback and Recovery',
  'International Call-Up Dream',
  'Derby Day Drama',
  'Mid-Season Reflections',
  'A Moment to Remember',
  'Press Conference Pressure',
  'New Boots, New Confidence',
  'Youth Tournament Finals',
  'Coach Said Believe in Yourself',
  'Home Debut Nerves',
  'Gym Session at Dawn',
  'Social Media Storm',
  'Scouted by Top Club',
  'Injury Comeback Match',
  'Team Bonding Trip',
  'Record-Breaking Streak',
  'Late Night Video Analysis',
];

const JOURNAL_EXCERPTS = [
  'Arrived at the training ground early. The air smelled of fresh grass and ambition. Everything felt new, exciting, and slightly overwhelming.',
  'The gaffer gave me the nod. Stepped onto the pitch with butterflies but left with wings. Two assists and a standing ovation from the away end.',
  'Tough night. Conceded late and the dressing room was silent. But tough nights build tough players. Back to training tomorrow.',
  'Sat across from the chairman. Discussed my future at the club. The numbers looked good but I care more about playing time.',
  'Extra session after everyone left. Working on weak foot. The ball hit the post three times before finding the top corner. Progress.',
  'Hundreds of fans waited outside the stadium. Signed shirts, took photos. Their support means everything in this journey.',
  'Champions League night under the lights. 60,000 people roaring. This is what every kid dreams of in the backyard.',
  'Hamstring tightened in the 30th minute. Frustrating but part of the game. Focus shifts to rehab and coming back stronger.',
  'Watched the national team play on TV. One day that jersey will be mine. For now, keep working, keep improving.',
  'The atmosphere was electric. Local derby, everything on the line. Scored the winner in the 89th minute. Pure chaos.',
  'Half the season gone. Some highs, some lows. Overall rating trending up. Need to add more end product to my game.',
  'Picked up the young player award. My family in the stands, tears in their eyes. This moment will stay with me forever.',
  'Twelve microphones pointed at my face. Every word weighed and measured. Handling the press is becoming second nature now.',
  'Unwrapped the new boots in the locker room. Laced them up, stepped onto the pitch, and felt an instant connection with the ball.',
  'Final whistle blew and we won the tournament. The lads lifted me onto their shoulders. A memory etched in gold.',
  'Coach pulled me aside after training. Said he sees something special. Those words replay in my mind before every session.',
  'Walking out of the tunnel for my home debut. The roar of the crowd hit me like a wave. Pure adrenaline and pride.',
  'Alarm went off at 5 AM. Gym session before first training. The discipline required at this level is no joke. Worth every rep.',
  'A tweet went viral after my goal celebration. Mixed reactions online but the important thing is what happens on the grass.',
  'Saw the chief scout from a top European club in the stands. Pretended not to notice. Let the football do the talking.',
  'First match back after six weeks out. The rust showed early but by the second half I was flying. Never felt so grateful to play.',
  'Weekend away with the squad. Paintball, team dinners, late-night FIFA tournaments. The bonds we build off the pitch matter.',
  'Five games, seven goals, three assists. The stats are catching attention. But the team results matter more than personal numbers.',
  'Sat in the video room until midnight studying the opposition left-back. Found a weakness. Tomorrow it will be exploited.',
];

const MEMORY_TITLES = [
  'First Professional Goal',
  'Debut Match Performance',
  'Hat-Trick Masterclass',
  'Player of the Month Award',
  'Clean Sheet Shutout',
  'Transfer Deadline Drama',
  'International Debut Cap',
  'Trophy Lift Moment',
  'Century of Appearances',
  'Wonderkid Recognition',
  'Contract Extension Signed',
  'Season MVP Selection',
  'Academy Graduation Day',
  'Record Attendance Match',
  'Last Minute Winner',
  'Fan Chant Dedicated',
];

const GOAL_TITLES = [
  'Score 15 League Goals',
  'Reach 80 Overall Rating',
  'Win Player of the Month',
  'Earn First International Cap',
  'Keep 10 Clean Sheets',
  'Achieve 50 Career Goals',
  'Sign Premium Sponsorship Deal',
  'Win League Title',
  'Maintain 7.5+ Average Rating',
  'Become Team Captain',
  'Reach 100 Career Appearances',
  'Win Continental Trophy',
  'Complete 200 Training Sessions',
  'Build 5 Strong Relationships',
  'Earn Legend Status at Club',
  'Score in Every Competition',
  'Win Golden Boot Award',
  'Never Miss a Training Session',
];

const TRAJECTORY_LABELS = [
  'Academy Join', 'First Team', 'Breakout', 'Rising Star',
  'Established', 'Team Leader', 'Club Legend', 'Hall of Fame',
];

const JOURNAL_MOOD_LABELS = [
  { min: 9, max: 10, label: 'Euphoric', color: '#CCFF00' },
  { min: 7, max: 8, label: 'Great', color: '#CCFF00' },
  { min: 5, max: 6, label: 'Good', color: '#00E5FF' },
  { min: 3, max: 4, label: 'Mixed', color: '#FF5500' },
  { min: 1, max: 2, label: 'Struggling', color: '#666' },
];

const CAREER_ADVICE = [
  'Consistency is the key to unlocking your full potential. Focus on delivering quality performances week in, week out.',
  'Build strong relationships with your teammates. Football is a team sport and trust on the pitch translates to results.',
  'Invest in recovery. Ice baths, proper nutrition, and adequate sleep are just as important as training sessions.',
  'Study the opposition. The best players anticipate what will happen before it unfolds on the pitch.',
  'Set process goals, not just outcome goals. Focus on what you can control and the results will follow.',
  'Embrace pressure situations. The biggest moments define careers. Train your mind to thrive under stress.',
  'Stay humble. No matter how many goals you score or trophies you win, respect the game and those who play it.',
  'Document your journey. Years from now you will look back at these journal entries with gratitude and nostalgia.',
];

const MILESTONE_THRESHOLDS = [
  { label: 'First Appearance', key: 'appearances', threshold: 1 },
  { label: '10 Appearances', key: 'appearances', threshold: 10 },
  { label: '50 Appearances', key: 'appearances', threshold: 50 },
  { label: '100 Appearances', key: 'appearances', threshold: 100 },
  { label: 'First Goal', key: 'goals', threshold: 1 },
  { label: '10 Goals', key: 'goals', threshold: 10 },
  { label: '25 Goals', key: 'goals', threshold: 25 },
  { label: '50 Goals', key: 'goals', threshold: 50 },
  { label: 'First Assist', key: 'assists', threshold: 1 },
  { label: '25 Assists', key: 'assists', threshold: 25 },
  { label: '50 Assists', key: 'assists', threshold: 50 },
  { label: 'First Trophy', key: 'trophies', threshold: 1 },
  { label: '5 Trophies', key: 'trophies', threshold: 5 },
];

/* ================================================================
   SVG Component 1: JournalEntryFrequencyBars
   6 horizontal bars showing journal entries per month
   ================================================================ */

function JournalEntryFrequencyBars({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = data.reduce((max, d) => Math.max(max, d.count), 1);
  const barWidth = 280;
  const barH = 14;
  const gap = 6;
  const labelW = 32;
  const valueW = 24;
  const svgW = labelW + barWidth + valueW;
  const svgH = data.length * (barH + gap);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Entry Frequency
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Journal entry frequency bars">
        {data.map((d, i) => {
          const y = i * (barH + gap);
          const w = Math.max(2, (d.count / maxCount) * barWidth);
          return (
            <g key={i}>
              <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="9" fontFamily="monospace">
                {d.month}
              </text>
              <rect x={labelW} y={y} width={w} height={barH} fill="#FF5500" rx="3" />
              <text x={labelW + barWidth + 4} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="9" fontFamily="monospace">
                {d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 2: EmotionalArcAreaChart
   8-point area chart of mood/emotion scores over 8 weeks
   ================================================================ */

function EmotionalArcAreaChart({ data }: { data: { label: string; value: number }[] }) {
  const svgW = 320;
  const svgH = 100;
  const padX = 8;
  const padY = 10;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - (d.value / 10) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Emotional Arc
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Emotional arc area chart">
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => {
          const y = padY + (i / 3) * chartH;
          return <line key={i} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#21262d" strokeWidth="0.5" />;
        })}
        {/* Area fill */}
        <path d={areaPath} fill="#00E5FF" fillOpacity="0.15" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00E5FF" stroke="#0d1117" strokeWidth="1.5" />
        ))}
        {/* Labels */}
        {data.map((d, i) => (
          <text key={i} x={padX + i * stepX} y={svgH - 1} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="monospace">
            W{d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 3: JournalConsistencyRing
   Circular ring showing journaling consistency
   ================================================================ */

function JournalConsistencyRing({ percentage }: { percentage: number }) {
  const svgW = 120;
  const svgH = 120;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const r = 44;
  const strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const filled = (percentage / 100) * circumference;
  const dashOffset = circumference - filled;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center gap-4">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-24 h-24 flex-shrink-0" aria-label="Journal consistency ring">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={strokeW} />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#CCFF00"
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="bold" fontFamily="monospace">
          {percentage}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="monospace">
          CONSISTENT
        </text>
      </svg>
      <div>
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
          Journal Consistency
        </p>
        <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
          Entries logged across the season. Keep writing to build your career story.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   SVG Component 4: MemoryCategoryDonut
   4-segment donut chart via .reduce()
   ================================================================ */

function MemoryCategoryDonut({ data }: { data: { category: string; value: number; color: string }[] }) {
  const svgW = 160;
  const svgH = 160;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const outerR = 60;
  const innerR = 38;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  interface DonutSegment { category: string; value: number; color: string; startAngle: number; endAngle: number }
  const segments = data.reduce<DonutSegment[]>((acc, d) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const angle = total > 0 ? (d.value / total) * 360 : 0;
    return [...acc, { ...d, startAngle: prevEnd, endAngle: prevEnd + angle }];
  }, []);

  const polarToCart = (angle: number, radius: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Memory Categories
      </p>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-28 h-28 flex-shrink-0" aria-label="Memory category donut">
          {segments.map((seg, i) => {
            const start = polarToCart(seg.startAngle, outerR);
            const end = polarToCart(seg.endAngle, outerR);
            const innerStart = polarToCart(seg.startAngle, innerR);
            const innerEnd = polarToCart(seg.endAngle, innerR);
            const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
            const d = [
              `M${start.x},${start.y}`,
              `A${outerR},${outerR} 0 ${largeArc} 1 ${end.x},${end.y}`,
              `L${innerEnd.x},${innerEnd.y}`,
              `A${innerR},${innerR} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}`,
              'Z',
            ].join(' ');
            return <path key={i} d={d} fill={seg.color} />;
          })}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold" fontFamily="monospace">
            {total}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="monospace">
            MEMORIES
          </text>
        </svg>
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-[#8b949e]">{d.category}</span>
              <span className="text-[10px] text-[#c9d1d9] font-mono ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SVG Component 5: CareerHighlightTimeline
   8-node horizontal timeline
   ================================================================ */

function CareerHighlightTimeline({ data }: { data: { week: number; title: string; color: string }[] }) {
  const svgW = 340;
  const svgH = 80;
  const padX = 16;
  const padY = 30;
  const lineY = padY;
  const lineW = svgW - padX * 2;
  const stepX = lineW / (data.length - 1);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Career Highlights
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Career highlight timeline">
        {/* Horizontal line */}
        <line x1={padX} y1={lineY} x2={svgW - padX} y2={lineY} stroke="#30363d" strokeWidth="2" />
        {/* Nodes */}
        {data.map((d, i) => {
          const x = padX + i * stepX;
          return (
            <g key={i}>
              <circle cx={x} cy={lineY} r="6" fill={d.color} stroke="#0d1117" strokeWidth="2" />
              <text x={x} y={lineY - 12} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontFamily="monospace">
                {`W${d.week}`}
              </text>
              <text x={x} y={lineY + 22} textAnchor="middle" fill="#8b949e" fontSize="6">
                {d.title.length > 14 ? d.title.slice(0, 13) + '...' : d.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 6: MemoryImpactRadar
   5-axis radar chart
   ================================================================ */

function MemoryImpactRadar({ data }: { data: { axis: string; value: number }[] }) {
  const svgW = 180;
  const svgH = 180;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const maxR = 65;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  const polarToCart = (idx: number, radius: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  /* Grid rings */
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridLevels.map(level => {
    const pts = Array.from({ length: n }, (_, i) => polarToCart(i, maxR * level));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  });

  /* Data polygon */
  const dataPoints = data.map((d, i) => polarToCart(i, maxR * (d.value / 100)));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  /* Axis lines and labels */
  const axes = Array.from({ length: n }, (_, i) => {
    const end = polarToCart(i, maxR);
    const label = polarToCart(i, maxR + 14);
    return { line: end, label, text: data[i].axis };
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Memory Impact
      </p>
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-40 h-40" aria-label="Memory impact radar">
          {/* Grid */}
          {gridPaths.map((gp, i) => (
            <path key={i} d={gp} fill="none" stroke="#21262d" strokeWidth="0.5" />
          ))}
          {/* Axes */}
          {axes.map((a, i) => (
            <line key={i} x1={cx} y1={cy} x2={a.line.x} y2={a.line.y} stroke="#21262d" strokeWidth="0.5" />
          ))}
          {/* Data fill */}
          <path d={dataPath} fill="#FF5500" fillOpacity="0.2" stroke="#FF5500" strokeWidth="1.5" />
          {/* Data dots */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FF5500" stroke="#0d1117" strokeWidth="1" />
          ))}
          {/* Labels */}
          {axes.map((a, i) => (
            <text key={i} x={a.label.x} y={a.label.y} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="monospace">
              {a.text}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ================================================================
   SVG Component 7: GrowthAreaBars
   6 horizontal bars (current vs previous)
   ================================================================ */

function GrowthAreaBars({ data }: { data: { label: string; current: number; previous: number }[] }) {
  const maxVal = data.reduce((max, d) => Math.max(max, d.current, d.previous), 1);
  const barW = 100;
  const barH = 10;
  const gap = 14;
  const labelW = 80;
  const svgW = labelW + barW * 2 + 16;
  const svgH = data.length * gap + 8;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Growth Areas
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Growth area comparison bars">
        {/* Legend */}
        <rect x={labelW} y={0} width={8} height={4} fill="#CCFF00" rx="1" />
        <text x={labelW + 12} y={4} fill="#8b949e" fontSize="6" fontFamily="monospace">NOW</text>
        <rect x={labelW + 44} y={0} width={8} height={4} fill="#00E5FF" rx="1" />
        <text x={labelW + 56} y={4} fill="#8b949e" fontSize="6" fontFamily="monospace">PREV</text>
        {data.map((d, i) => {
          const y = 10 + i * gap;
          const curW = Math.max(2, (d.current / maxVal) * barW);
          const prevW = Math.max(2, (d.previous / maxVal) * barW);
          return (
            <g key={i}>
              <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="monospace">
                {d.label}
              </text>
              <rect x={labelW} y={y} width={curW} height={barH} fill="#CCFF00" rx="2" />
              <text x={labelW + curW + 3} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="7" fontFamily="monospace">
                {d.current}
              </text>
              <rect x={labelW + barW + 16} y={y} width={prevW} height={barH} fill="#00E5FF" rx="2" />
              <text x={labelW + barW + 16 + prevW + 3} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="7" fontFamily="monospace">
                {d.previous}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 8: SeasonComparisonButterfly
   Current vs previous season (5 metrics butterfly)
   ================================================================ */

function SeasonComparisonButterfly({ data }: { data: { label: string; current: number; previous: number }[] }) {
  const svgW = 300;
  const svgH = data.length * 28 + 20;
  const cx = svgW / 2;
  const barH = 12;
  const halfW = (svgW - 60) / 2;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Season Comparison
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Season comparison butterfly chart">
        {/* Center line */}
        <line x1={cx} y1={10} x2={cx} y2={svgH - 10} stroke="#30363d" strokeWidth="1" />
        {/* Legend */}
        <rect x={10} y={2} width={8} height={4} fill="#CCFF00" rx="1" />
        <text x={20} y={5} fill="#8b949e" fontSize="6" fontFamily="monospace">PREVIOUS</text>
        <rect x={svgW - 60} y={2} width={8} height={4} fill="#00E5FF" rx="1" />
        <text x={svgW - 48} y={5} fill="#8b949e" fontSize="6" fontFamily="monospace">CURRENT</text>
        {data.map((d, i) => {
          const y = 14 + i * 28;
          const prevW = Math.max(2, (d.previous / 100) * halfW);
          const curW = Math.max(2, (d.current / 100) * halfW);
          return (
            <g key={i}>
              <text x={cx} y={y + barH + 14} textAnchor="middle" fill="#8b949e" fontSize="7" fontFamily="monospace">
                {d.label}
              </text>
              <rect x={cx - prevW} y={y} width={prevW} height={barH} fill="#CCFF00" rx="2" />
              <text x={cx - prevW - 3} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="7" fontFamily="monospace">
                {d.previous}
              </text>
              <rect x={cx} y={y} width={curW} height={barH} fill="#00E5FF" rx="2" />
              <text x={cx + curW + 3} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="7" fontFamily="monospace">
                {d.current}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 9: SelfAssessmentTrend
   6-point line chart
   ================================================================ */

function SelfAssessmentTrend({ data }: { data: { label: string; rating: number }[] }) {
  const svgW = 320;
  const svgH = 100;
  const padX = 8;
  const padY = 12;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - (d.rating / 10) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Self-Assessment Trend
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Self-assessment trend line chart">
        {/* Grid */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padY + (i / 4) * chartH;
          return <line key={i} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#21262d" strokeWidth="0.5" />;
        })}
        {/* Line */}
        <path d={linePath} fill="none" stroke="#FF5500" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#FF5500" stroke="#0d1117" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#c9d1d9" fontSize="7" fontFamily="monospace">
              {data[i].rating.toFixed(1)}
            </text>
          </g>
        ))}
        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={padX + i * stepX} y={svgH - 1} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="monospace">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 10: GoalCompletionRing
   Circular ring showing completed goals / total goals
   ================================================================ */

function GoalCompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const svgW = 120;
  const svgH = 120;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const r = 44;
  const strokeW = 8;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;
  const dashOffset = circumference - filled;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center gap-4">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-24 h-24 flex-shrink-0" aria-label="Goal completion ring">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={strokeW} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#CCFF00"
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold" fontFamily="monospace">
          {completed}/{total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="8" fontFamily="monospace">
          {pct}% DONE
        </text>
      </svg>
      <div>
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
          Goal Completion
        </p>
        <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
          {completed} of {total} career goals achieved. Keep pushing towards greatness.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   SVG Component 11: GoalCategoryBars
   5 horizontal bars
   ================================================================ */

function GoalCategoryBars({ data }: { data: { category: string; progress: number; target: number }[] }) {
  const maxTarget = data.reduce((max, d) => Math.max(max, d.target), 1);
  const barW = 200;
  const barH = 14;
  const gap = 12;
  const labelW = 72;
  const valueW = 40;
  const svgW = labelW + barW + valueW;
  const svgH = data.length * (barH + gap) + 4;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Goal Progress by Category
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Goal category progress bars">
        {data.map((d, i) => {
          const y = i * (barH + gap);
          const bgW = Math.max(2, (d.target / maxTarget) * barW);
          const fgW = Math.max(1, (d.progress / d.target) * bgW);
          return (
            <g key={i}>
              <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="8" fontFamily="monospace">
                {d.category}
              </text>
              <rect x={labelW} y={y} width={bgW} height={barH} fill="#21262d" rx="3" />
              <rect x={labelW} y={y} width={fgW} height={barH} fill="#FF5500" rx="3" />
              <text x={labelW + barW + 4} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="8" fontFamily="monospace">
                {d.progress}/{d.target}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================
   SVG Component 12: CareerTrajectoryLine
   8-point line chart showing projected career trajectory
   ================================================================ */

function CareerTrajectoryLine({ data }: { data: { label: string; value: number }[] }) {
  const svgW = 320;
  const svgH = 100;
  const padX = 8;
  const padY = 12;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;
  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const range = maxVal - minVal || 1;
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
        Career Trajectory
      </p>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" aria-label="Career trajectory line chart">
        {/* Grid */}
        {[0, 1, 2, 3].map(i => {
          const y = padY + (i / 3) * chartH;
          return <line key={i} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#21262d" strokeWidth="0.5" />;
        })}
        {/* Area */}
        <path d={areaPath} fill="#00E5FF" fillOpacity="0.1" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#00E5FF" stroke="#0d1117" strokeWidth="1.5" />
          </g>
        ))}
        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={padX + i * stepX} y={svgH - 1} textAnchor="middle" fill="#484f58" fontSize="7" fontFamily="monospace">
            {d.label.length > 8 ? d.label.slice(0, 7) + '..' : d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   Additional Data: Memory Descriptions & Milestone Data
   ================================================================ */

const MEMORY_DESCRIPTIONS: Record<string, string> = {
  'First Professional Goal': 'The ball bounced off the defender and fell perfectly. One touch to control, second to bury it. The net rippled. Pure euphoria.',
  'Debut Match Performance': 'Walking out of the tunnel for the first time. Legs shaking, heart pounding. The captain put an arm around my shoulder and said "enjoy it".',
  'Hat-Trick Masterclass': 'Three goals in forty-five minutes. The crowd chanting my name. The manager subbed me off early to protect me from myself.',
  'Player of the Month Award': 'A silver plaque with my name engraved. The manager presented it in front of the whole squad. Standing ovation followed.',
  'Clean Sheet Shutout': 'The defense was immense. Every tackle, every header, every block. Shared the clean sheet bonus with the back four.',
  'Transfer Deadline Drama': 'Final hour of the window. Agent calling every five minutes. In the end, stayed. The grass is not always greener.',
  'International Debut Cap': 'The national anthem playing, the jersey on my back, 70,000 fans singing. Capped my country for the first time.',
  'Trophy Lift Moment': 'Lifting silverware above my head. Confetti falling, fireworks exploding. The culmination of years of sacrifice and dedication.',
  'Century of Appearances': 'One hundred games for this club. Through injuries, setbacks, and triumphs. Loyalty means something.',
  'Wonderkid Recognition': 'Named in the top 50 wonderkids worldwide. The scouts had been watching for months. Now everyone knows the name.',
  'Contract Extension Signed': 'New four-year deal with improved terms. The club showed faith in the project. Time to repay that trust.',
  'Season MVP Selection': 'Voted by teammates and fans. The golden boot statuette sits on the mantle at home now. A proud achievement.',
  'Academy Graduation Day': 'Walking across the stage to receive the graduation certificate. From academy kid to professional footballer. The journey begins.',
  'Record Attendance Match': '75,000 packed into the stadium. The noise was deafening. Played the best game of my life on the biggest stage.',
  'Last Minute Winner': 'Ninety-third minute. Corner kick swung in. Got a head to it and watched it nestle in the top corner. Bedlam ensued.',
  'Fan Chant Dedicated': 'The away end started singing a song about me. Goosebumps. This is why we play the game.',
};

const CAREER_PHASES = [
  { label: 'Academy', range: 'Age 14-17', description: 'Learning the fundamentals, building technical foundation' },
  { label: 'Reserves', range: 'Age 17-19', description: 'Transitioning to senior football, gaining match fitness' },
  { label: 'Breakthrough', range: 'Age 19-22', description: 'Establishing in the first team, earning recognition' },
  { label: 'Peak Years', range: 'Age 22-28', description: 'Prime performance, winning trophies and individual awards' },
  { label: 'Veteran', range: 'Age 28-33', description: 'Leading by example, mentoring younger players' },
];

const STRENGTHS_LIST = [
  'Pace and acceleration',
  'Finishing under pressure',
  'Aerial duels',
  'Composure in front of goal',
  'Work rate and pressing',
  'Vision and playmaking',
  'Set piece delivery',
  'One-on-one situations',
];

const IMPROVEMENTS_LIST = [
  'Weak foot consistency',
  'Defensive positioning',
  'Game intelligence',
  'Leadership communication',
  'Long-range shooting',
  'Movement off the ball',
  'Heading accuracy',
  'Tactical awareness',
];

/* ================================================================
   Data Generation Functions
   ================================================================ */

function generateJournalEntries(playerName: string, week: number, season: number): JournalEntryData[] {
  const count = Math.min(week, 24);
  return Array.from({ length: count }, (_, i) => {
    const w = i + 1;
    const titleIdx = seededInt(playerName, w, `je-title-${season}`, 0, JOURNAL_TITLES.length - 1);
    const excerptIdx = seededInt(playerName, w, `je-excerpt-${season}`, 0, JOURNAL_EXCERPTS.length - 1);
    const mood = seededInt(playerName, w, `je-mood-${season}`, 3, 10);
    return {
      id: `je-${season}-${w}`,
      week: w,
      month: Math.min(Math.ceil(w / 4), 12),
      title: JOURNAL_TITLES[titleIdx],
      excerpt: JOURNAL_EXCERPTS[excerptIdx],
      mood,
    };
  });
}

function generateMemories(playerName: string, week: number, season: number): MemoryItem[] {
  const categories: MemoryItem['category'][] = ['goals', 'trophies', 'records', 'milestones'];
  const count = Math.min(Math.max(week, 4), 12);
  return Array.from({ length: count }, (_, i) => {
    const w = seededInt(playerName, i, `mem-week-${season}`, 1, Math.max(week, 1));
    const catIdx = seededInt(playerName, i, `mem-cat-${season}`, 0, categories.length - 1);
    const titleIdx = seededInt(playerName, i, `mem-title-${season}`, 0, MEMORY_TITLES.length - 1);
    const impact = seededInt(playerName, i, `mem-impact-${season}`, 40, 100);
    return {
      id: `mem-${season}-${i}`,
      week: w,
      title: MEMORY_TITLES[titleIdx],
      category: categories[catIdx],
      impact,
    };
  });
}

function generateGoals(playerName: string, week: number, season: number): GoalItem[] {
  const categories: GoalItem['category'][] = ['performance', 'financial', 'personal', 'team', 'awards'];
  const count = Math.min(week + 2, 15);
  return Array.from({ length: count }, (_, i) => {
    const titleIdx = seededInt(playerName, i, `goal-title-${season}`, 0, GOAL_TITLES.length - 1);
    const catIdx = seededInt(playerName, i, `goal-cat-${season}`, 0, categories.length - 1);
    const target = seededInt(playerName, i, `goal-target-${season}`, 5, 30);
    const progress = seededInt(playerName, i, `goal-prog-${season}`, 0, target);
    return {
      id: `goal-${season}-${i}`,
      title: GOAL_TITLES[titleIdx],
      category: categories[catIdx],
      progress,
      target,
    };
  });
}

function generateReflectionPeriods(playerName: string, week: number, season: number): ReflectionPeriod[] {
  const labels = ['Pre-Season', 'Early', 'Mid-S1', 'Mid-S2', 'Late', 'End'];
  return labels.map((label, i) => ({
    label,
    rating: seededInt(playerName, week, `ref-${i}-${season}`, 40, 95) / 10,
  }));
}

function generateTrajectoryData(playerName: string, week: number, season: number): TrajectoryPoint[] {
  let baseRating = 45 + seededInt(playerName, 0, `traj-base-${season}`, 0, 15);
  return TRAJECTORY_LABELS.map((label, i) => {
    const boost = seededInt(playerName, i, `traj-boost-${season}`, 2, 12);
    baseRating = Math.min(baseRating + boost, 99);
    return { week: i + 1, value: baseRating, label };
  });
}

/* ================================================================
   Tab 1: Journal
   ================================================================ */

function JournalTab({
  playerName,
  week,
  season,
}: {
  playerName: string;
  week: number;
  season: number;
}) {
  const entries = useMemo(() => generateJournalEntries(playerName, week, season), [playerName, week, season]);

  const frequencyData = useMemo(() => {
    return MONTH_NAMES.map((month, idx) => {
      const count = entries.filter(e => e.month === idx + 1).length;
      return { month, count };
    }).filter(d => d.count > 0).slice(0, 6);
  }, [entries]);

  const emotionalArcData = useMemo(() => {
    const recent = entries.slice(-8);
    return recent.map(e => ({ label: `${e.week}`, value: e.mood }));
  }, [entries]);

  const consistencyPct = useMemo(() => {
    if (week === 0) return 0;
    return Math.round((entries.length / week) * 100);
  }, [entries.length, week]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* SVG 1: Entry Frequency */}
      <JournalEntryFrequencyBars data={frequencyData.length > 0 ? frequencyData : MONTH_NAMES.slice(0, 6).map(m => ({ month: m, count: 0 }))} />

      {/* SVG 2: Emotional Arc */}
      <EmotionalArcAreaChart data={emotionalArcData.length > 1 ? emotionalArcData : [{ label: '1', value: 5 }, { label: '2', value: 6 }]} />

      {/* SVG 3: Consistency Ring */}
      <JournalConsistencyRing percentage={consistencyPct} />

      {/* Recent entries list */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Recent Entries
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {entries.slice(-8).reverse().map((entry, i) => {
            const moodLabel = entry.mood >= 8 ? 'Amazing' : entry.mood >= 6 ? 'Good' : entry.mood >= 4 ? 'Mixed' : 'Low';
            const moodColor = entry.mood >= 8 ? 'text-[#CCFF00] bg-[#CCFF00]/15' : entry.mood >= 6 ? 'text-[#00E5FF] bg-[#00E5FF]/15' : entry.mood >= 4 ? 'text-[#FF5500] bg-[#FF5500]/15' : 'text-[#666] bg-[#666]/15';
            return (
              <div key={`${entry.id}-${i}`} className="border-l-2 border-[#FF5500] pl-3 py-1.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock className="h-3 w-3 text-[#484f58]" />
                  <span className="text-[9px] text-[#484f58] font-mono">S{season} W{entry.week}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-medium ${moodColor}`}>
                    {moodLabel}
                  </span>
                  <span className="text-[9px] text-[#484f58] font-mono ml-auto">Mood: {entry.mood}/10</span>
                </div>
                <p className="text-xs text-[#c9d1d9] font-medium">{entry.title}</p>
                <p className="text-[10px] text-[#8b949e] mt-0.5 line-clamp-2">{entry.excerpt}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Journal writing stats */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Writing Stats
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Avg Mood', value: entries.length > 0 ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : '0.0' },
            { label: 'Best Mood', value: entries.length > 0 ? String(Math.max(...entries.map(e => e.mood))) : '0' },
            { label: 'Entries', value: String(entries.length) },
            { label: 'Active Weeks', value: String(week) },
          ].map((stat, i) => (
            <div key={i} className="bg-[#21262d]/50 rounded-lg p-2 flex justify-between items-center">
              <span className="text-[9px] text-[#8b949e]">{stat.label}</span>
              <span className="text-[10px] text-[#c9d1d9] font-mono font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career advice section */}
      <div className="bg-[#0d1117] border border-[#CCFF00]/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-3.5 w-3.5 text-[#CCFF00]" />
          <p className="text-[10px] font-semibold text-[#CCFF00] uppercase tracking-widest">
            Weekly Wisdom
          </p>
        </div>
        <p className="text-[10px] text-[#8b949e] leading-relaxed italic">
          {CAREER_ADVICE[week % CAREER_ADVICE.length]}
        </p>
      </div>
    </motion.div>
  );
}

/* ================================================================
   Tab 2: Memories
   ================================================================ */

function MemoriesTab({
  playerName,
  week,
  season,
}: {
  playerName: string;
  week: number;
  season: number;
}) {
  const memories = useMemo(() => generateMemories(playerName, week, season), [playerName, week, season]);

  const categoryData = useMemo(() => {
    const catMap = memories.reduce<Record<string, number>>((acc, m) => {
      acc[m.category] = (acc[m.category] ?? 0) + 1;
      return acc;
    }, {});
    const colorMap: Record<string, string> = {
      goals: '#FF5500',
      trophies: '#CCFF00',
      records: '#00E5FF',
      milestones: '#666',
    };
    const labelMap: Record<string, string> = {
      goals: 'Goals',
      trophies: 'Trophies',
      records: 'Records',
      milestones: 'Milestones',
    };
    return Object.entries(catMap).map(([cat, val]) => ({
      category: labelMap[cat] ?? cat,
      value: val,
      color: colorMap[cat] ?? '#666',
    }));
  }, [memories]);

  const timelineData = useMemo(() => {
    return memories.slice(0, 8).map(m => ({
      week: m.week,
      title: m.title,
      color: '#00E5FF',
    }));
  }, [memories]);

  const radarData = useMemo(() => {
    const axes = ['Emotional', 'Profess.', 'Financial', 'Social', 'Legacy'];
    return axes.map((axis, i) => ({
      axis,
      value: seededInt(playerName, i, `radar-${season}`, 30, 100),
    }));
  }, [playerName, season]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* SVG 4: Category Donut */}
      <MemoryCategoryDonut data={categoryData.length > 0 ? categoryData : [
        { category: 'Goals', value: 1, color: '#FF5500' },
        { category: 'Trophies', value: 1, color: '#CCFF00' },
        { category: 'Records', value: 1, color: '#00E5FF' },
        { category: 'Milestones', value: 1, color: '#666' },
      ]} />

      {/* SVG 5: Highlight Timeline */}
      <CareerHighlightTimeline data={timelineData} />

      {/* SVG 6: Impact Radar */}
      <MemoryImpactRadar data={radarData} />

      {/* Memory cards */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Top Memories
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {memories.slice(0, 8).map((m, i) => {
            const iconMap: Record<string, React.ReactNode> = {
              goals: <Trophy className="h-3.5 w-3.5 text-[#FF5500]" />,
              trophies: <Award className="h-3.5 w-3.5 text-[#CCFF00]" />,
              records: <TrendingUp className="h-3.5 w-3.5 text-[#00E5FF]" />,
              milestones: <Star className="h-3.5 w-3.5 text-[#8b949e]" />,
            };
            const bgMap: Record<string, string> = {
              goals: 'bg-[#FF5500]/15',
              trophies: 'bg-[#CCFF00]/15',
              records: 'bg-[#00E5FF]/15',
              milestones: 'bg-[#8b949e]/15',
            };
            const description = MEMORY_DESCRIPTIONS[m.title] ?? 'A memorable moment in the career.';
            return (
              <div key={`${m.id}-${i}`} className="p-2.5 rounded-lg bg-[#21262d]/50">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-8 h-8 ${bgMap[m.category] ?? 'bg-[#FF5500]/15'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {iconMap[m.category] ?? <Star className="h-3.5 w-3.5 text-[#FF5500]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c9d1d9] font-medium truncate">{m.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#484f58] font-mono">W{m.week}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#21262d] text-[#8b949e]">
                        {m.category}
                      </span>
                      <span className="text-[9px] text-[#484f58] font-mono ml-auto">
                        Impact {m.impact}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b949e] leading-relaxed line-clamp-2 pl-11">{description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory impact summary */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Impact Summary
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Memories', value: memories.length, color: 'text-[#c9d1d9]' },
            { label: 'Avg Impact', value: memories.length > 0 ? Math.round(memories.reduce((s, m) => s + m.impact, 0) / memories.length) : 0, color: 'text-[#FF5500]' },
            { label: 'Top Impact', value: memories.length > 0 ? Math.max(...memories.map(m => m.impact)) : 0, color: 'text-[#CCFF00]' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#21262d]/50 rounded-lg p-2 text-center">
              <p className={`text-base font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[8px] text-[#484f58] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Memory quote section */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Memory of the Season
          </p>
        </div>
        <blockquote className="border-l-2 border-[#CCFF00] pl-3 py-1">
          <p className="text-xs text-[#c9d1d9] italic leading-relaxed">
            {memories.length > 0
              ? '"' + memories[0].title + ' - a moment that defined Week ' + memories[0].week + '. The impact rating of ' + memories[0].impact + ' reflects how deeply this memory resonates."'
              : '"No memories recorded yet. Start making history on the pitch."'}
          </p>
        </blockquote>
      </div>

      {/* Career milestones tracker */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Career Milestones
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MILESTONE_THRESHOLDS.map((m, i) => {
            const reached = seededRandom(playerName, week, `milestone-${m.key}-${m.threshold}-${season}`) > 0.4;
            return (
              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-sm bg-[#21262d]/50">
                <span className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${reached ? 'bg-[#CCFF00]' : 'bg-[#30363d]'}`} />
                <span className={`text-[9px] ${reached ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================
   Tab 3: Reflections
   ================================================================ */

function ReflectionsTab({
  playerName,
  week,
  season,
  overall,
  morale,
  form,
}: {
  playerName: string;
  week: number;
  season: number;
  overall: number;
  morale: number;
  form: number;
}) {
  const growthData = useMemo((): GrowthArea[] => {
    const areas = [
      { label: 'Technical', key: 'tech' },
      { label: 'Physical', key: 'phys' },
      { label: 'Mental', key: 'ment' },
      { label: 'Leadership', key: 'lead' },
      { label: 'Comms', key: 'comm' },
      { label: 'Resilience', key: 'resi' },
    ];
    return areas.map(a => ({
      label: a.label,
      current: seededInt(playerName, week, `${a.key}-cur-${season}`, 40, 95),
      previous: seededInt(playerName, week, `${a.key}-prev-${season}`, 25, 80),
    }));
  }, [playerName, week, season]);

  const seasonComparisonData = useMemo(() => {
    const metrics = [
      { label: 'Goals', key: 'goals' },
      { label: 'Assists', key: 'assists' },
      { label: 'Rating', key: 'rating' },
      { label: 'Fitness', key: 'fitness' },
      { label: 'Morale', key: 'morale' },
    ];
    return metrics.map(m => ({
      label: m.label,
      current: seededInt(playerName, week, `${m.key}-cur-comp-${season}`, 30, 95),
      previous: seededInt(playerName, week, `${m.key}-prev-comp-${season}`, 20, 85),
    }));
  }, [playerName, week, season]);

  const trendData = useMemo(() => generateReflectionPeriods(playerName, week, season), [playerName, week, season]);

  const insightCards = useMemo(() => {
    return [
      {
        icon: <TrendingUp className="h-3.5 w-3.5 text-[#CCFF00]" />,
        label: 'Overall Rating',
        value: `${overall}`,
        note: overall >= 80 ? 'Elite level performance' : overall >= 65 ? 'Solid progression' : 'Room for growth',
      },
      {
        icon: <Heart className="h-3.5 w-3.5 text-[#FF5500]" />,
        label: 'Morale',
        value: `${morale}`,
        note: morale >= 75 ? 'High spirits' : morale >= 50 ? 'Steady mindset' : 'Needs attention',
      },
      {
        icon: <Flame className="h-3.5 w-3.5 text-[#00E5FF]" />,
        label: 'Form',
        value: form.toFixed(1),
        note: form >= 7.5 ? 'Red hot streak' : form >= 6.0 ? 'Consistent performer' : 'Finding rhythm',
      },
    ];
  }, [overall, morale, form]);

  const topStrengths = useMemo(() => {
    return STRENGTHS_LIST
      .map((s, i) => ({ name: s, score: seededInt(playerName, week, `str-${i}-${season}`, 50, 100) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [playerName, week, season]);

  const topImprovements = useMemo(() => {
    return IMPROVEMENTS_LIST
      .map((s, i) => ({ name: s, score: seededInt(playerName, week, `imp-${i}-${season}`, 20, 70) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [playerName, week, season]);

  const currentPhase = useMemo(() => {
    const age = seededInt(playerName, 0, `phase-age-${season}`, 14, 33);
    if (age <= 17) return CAREER_PHASES[0];
    if (age <= 19) return CAREER_PHASES[1];
    if (age <= 22) return CAREER_PHASES[2];
    if (age <= 28) return CAREER_PHASES[3];
    return CAREER_PHASES[4];
  }, [playerName, season]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Insight cards */}
      <div className="grid grid-cols-3 gap-2">
        {insightCards.map((card, i) => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1.5">{card.icon}</div>
            <p className="text-base font-bold text-[#c9d1d9] font-mono">{card.value}</p>
            <p className="text-[9px] text-[#484f58] uppercase tracking-wider mt-0.5">{card.label}</p>
            <p className="text-[9px] text-[#8b949e] mt-1 leading-relaxed">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Career phase indicator */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Current Career Phase
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#CCFF00]/15 border border-[#CCFF00]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 text-[#CCFF00]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#c9d1d9]">{currentPhase.label}</p>
            <p className="text-[9px] text-[#484f58] font-mono">{currentPhase.range}</p>
            <p className="text-[10px] text-[#8b949e] mt-0.5">{currentPhase.description}</p>
          </div>
        </div>
      </div>

      {/* Strengths and improvements */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">
            Top Strengths
          </p>
          <div className="space-y-1.5">
            {topStrengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-[#CCFF00] font-mono w-4">{s.score}</span>
                <span className="text-[10px] text-[#c9d1d9]">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">
            To Improve
          </p>
          <div className="space-y-1.5">
            {topImprovements.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-[#FF5500] font-mono w-4">{s.score}</span>
                <span className="text-[10px] text-[#c9d1d9]">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG 7: Growth Area Bars */}
      <GrowthAreaBars data={growthData} />

      {/* SVG 8: Season Comparison Butterfly */}
      <SeasonComparisonButterfly data={seasonComparisonData} />

      {/* SVG 9: Self-Assessment Trend */}
      <SelfAssessmentTrend data={trendData} />

      {/* Reflection prompts */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <PenLine className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Reflection Prompts
          </p>
        </div>
        <div className="space-y-2">
          {[
            'What was my biggest achievement this period?',
            'How did I handle pressure situations?',
            'What skill needs the most improvement?',
            'Am I on track to reach my seasonal goals?',
            'How has my relationship with teammates evolved?',
            'What would I do differently if I could replay last month?',
            'Am I balancing training intensity with recovery properly?',
            'How can I contribute more to team dynamics off the pitch?',
          ].map((prompt, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[#21262d]/50">
              <ChevronRight className="h-3 w-3 text-[#FF5500] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{prompt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly mood log */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Weekly Mood Log
          </p>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const moodVal = seededInt(playerName, week, `mood-${i}-${season}`, 3, 10);
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const moodColor = moodVal >= 8 ? 'bg-[#CCFF00]' : moodVal >= 6 ? 'bg-[#00E5FF]' : moodVal >= 4 ? 'bg-[#FF5500]' : 'bg-[#666]';
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[9px] text-[#484f58] font-mono w-6">{dayNames[i]}</span>
                <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <div className={`h-full ${moodColor} rounded-full`} style={{ width: `${moodVal * 10}%` }} />
                </div>
                <span className="text-[9px] text-[#8b949e] font-mono w-5 text-right">{moodVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================
   Tab 4: Goals
   ================================================================ */

function GoalsTab({
  playerName,
  week,
  season,
}: {
  playerName: string;
  week: number;
  season: number;
}) {
  const goals = useMemo(() => generateGoals(playerName, week, season), [playerName, week, season]);

  const completedCount = useMemo(() => goals.filter(g => g.progress >= g.target).length, [goals]);
  const totalCount = goals.length;

  const categoryData = useMemo(() => {
    const catMap = goals.reduce<Record<string, { progress: number; target: number }>>((acc, g) => {
      const existing = acc[g.category];
      acc[g.category] = {
        progress: (existing?.progress ?? 0) + g.progress,
        target: (existing?.target ?? 0) + g.target,
      };
      return acc;
    }, {});
    const labelMap: Record<string, string> = {
      performance: 'Perform.',
      financial: 'Financial',
      personal: 'Personal',
      team: 'Team',
      awards: 'Awards',
    };
    return Object.entries(catMap).map(([cat, val]) => ({
      category: labelMap[cat] ?? cat,
      progress: val.progress,
      target: val.target,
    }));
  }, [goals]);

  const trajectoryData = useMemo(() => generateTrajectoryData(playerName, week, season), [playerName, week, season]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* SVG 10: Goal Completion Ring */}
      <GoalCompletionRing completed={completedCount} total={totalCount} />

      {/* SVG 11: Goal Category Bars */}
      <GoalCategoryBars data={categoryData.length > 0 ? categoryData : [
        { category: 'Perform.', progress: 0, target: 1 },
        { category: 'Financial', progress: 0, target: 1 },
        { category: 'Personal', progress: 0, target: 1 },
        { category: 'Team', progress: 0, target: 1 },
        { category: 'Awards', progress: 0, target: 1 },
      ]} />

      {/* SVG 12: Career Trajectory */}
      <CareerTrajectoryLine data={trajectoryData} />

      {/* Goal list */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Active Goals
          </p>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {goals.map((g, i) => {
            const pct = g.target > 0 ? Math.min(Math.round((g.progress / g.target) * 100), 100) : 0;
            const isDone = pct >= 100;
            return (
              <div key={`${g.id}-${i}`} className="p-2.5 rounded-lg bg-[#21262d]/50">
                <div className="flex items-center justify-between mb-1.5">
                  <p className={`text-xs font-medium ${isDone ? 'text-[#CCFF00]' : 'text-[#c9d1d9]'}`}>
                    {isDone ? '✓ ' : ''}{g.title}
                  </p>
                  <span className="text-[9px] font-mono text-[#8b949e]">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#161b22] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-[#CCFF00]' : 'bg-[#FF5500]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[8px] text-[#484f58] uppercase">{g.category}</span>
                  <span className="text-[8px] text-[#484f58] font-mono">{g.progress}/{g.target}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational section */}
      <div className="bg-[#161b22] border border-[#FF5500]/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-[#FF5500]" />
          <p className="text-xs font-semibold text-[#FF5500]">Career Vision</p>
        </div>
        <p className="text-[10px] text-[#8b949e] leading-relaxed">
          Your journey from academy prospect to club legend is documented here.
          Every goal achieved, every setback overcome, and every milestone reached
          shapes the story of your career. Keep pushing your limits.
        </p>
      </div>

      {/* Goals summary stats */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Goals Breakdown
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'In Progress',
              value: goals.filter(g => g.progress < g.target && g.progress > 0).length,
              color: 'text-[#00E5FF]',
              icon: <TrendingUp className="h-3 w-3 text-[#00E5FF]" />,
            },
            {
              label: 'Completed',
              value: completedCount,
              color: 'text-[#CCFF00]',
              icon: <Award className="h-3 w-3 text-[#CCFF00]" />,
            },
            {
              label: 'Not Started',
              value: goals.filter(g => g.progress === 0).length,
              color: 'text-[#8b949e]',
              icon: <Clock className="h-3 w-3 text-[#8b949e]" />,
            },
          ].map((stat, i) => (
            <div key={i} className="bg-[#21262d]/50 rounded-lg p-2.5 text-center">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className={`text-base font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[8px] text-[#484f58] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Season objectives alignment */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Focus Areas This Season
          </p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Scoring consistency across all competitions', priority: 'High', color: 'border-[#FF5500]' },
            { label: 'Build leadership presence in the dressing room', priority: 'Medium', color: 'border-[#00E5FF]' },
            { label: 'Improve weak foot accuracy by 15%', priority: 'High', color: 'border-[#FF5500]' },
            { label: 'Maintain fitness above 85 for the full season', priority: 'Medium', color: 'border-[#00E5FF]' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg bg-[#21262d]/50 border-l-2 ${item.color}`}>
              <p className="text-[10px] text-[#c9d1d9] flex-1 leading-relaxed">{item.label}</p>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${
                item.priority === 'High' ? 'bg-[#FF5500]/15 text-[#FF5500]' : 'bg-[#00E5FF]/15 text-[#00E5FF]'
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================
   Main Export: CareerJournalEnhanced
   ================================================================ */

export default function CareerJournalEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState('journal');

  const player = gameState?.player;
  const week = gameState?.currentWeek ?? 1;
  const season = gameState?.currentSeason ?? 1;
  const playerName = player?.name ?? 'Player';
  const clubName = gameState?.currentClub?.name ?? 'Club';
  const overall = player?.overall ?? 50;
  const morale = player?.morale ?? 50;
  const form = player?.form ?? 5.0;

  const totalEntries = useMemo(() => {
    return week * 2 + seededInt(playerName, week, `total-entries-${season}`, 5, 30);
  }, [playerName, week, season]);

  if (!gameState || !player) return <></>;

  const tabs = [
    { id: 'journal', label: 'Journal', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'memories', label: 'Memories', icon: <Star className="h-4 w-4" /> },
    { id: 'reflections', label: 'Reflections', icon: <Brain className="h-4 w-4" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF5500]/15 border border-[#FF5500]/30 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-[#FF5500]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Career Journal</h1>
            <p className="text-[10px] text-[#8b949e]">
              S{season} W{week} - {clubName} - {playerName}
            </p>
          </div>
          <div className="px-2.5 py-1 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-lg">
            <span className="text-[10px] font-semibold text-[#CCFF00] font-mono">{totalEntries}</span>
            <span className="text-[9px] text-[#8b949e] ml-1">entries</span>
          </div>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-4 gap-2"
      >
        {[
          { icon: <PenLine className="h-3 w-3 text-[#FF5500]" />, value: totalEntries, label: 'Entries' },
          { icon: <Award className="h-3 w-3 text-[#CCFF00]" />, value: player.careerStats.trophies.length, label: 'Trophies' },
          { icon: <Trophy className="h-3 w-3 text-[#00E5FF]" />, value: player.careerStats.totalGoals, label: 'Goals' },
          { icon: <Shield className="h-3 w-3 text-[#8b949e]" />, value: player.careerStats.totalAppearances, label: 'Apps' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="text-sm font-bold text-[#c9d1d9] font-mono">{stat.value}</p>
            <p className="text-[8px] text-[#484f58] uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tab Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {activeTab === 'journal' && (
          <JournalTab playerName={playerName} week={week} season={season} />
        )}
        {activeTab === 'memories' && (
          <MemoriesTab playerName={playerName} week={week} season={season} />
        )}
        {activeTab === 'reflections' && (
          <ReflectionsTab
            playerName={playerName}
            week={week}
            season={season}
            overall={overall}
            morale={morale}
            form={form}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsTab playerName={playerName} week={week} season={season} />
        )}
      </motion.div>

      {/* Footer stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-[#484f58]" />
            <span className="text-[9px] text-[#484f58] uppercase tracking-wider">
              Career Journal Enhanced
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#8b949e] font-mono">
              Season {season}
            </span>
            <span className="text-[9px] text-[#8b949e] font-mono">
              Week {week}
            </span>
            <span className="text-[9px] text-[#CCFF00] font-mono">
              OVR {overall}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
