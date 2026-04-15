'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Seeded PRNG (Mulberry32)
// ============================================================
function hashSeed(str: string): number {
  const h = Array.from(str).reduce(
    (acc, ch) => (Math.imul(31, acc) + ch.charCodeAt(0)) | 0,
    0
  );
  return h >>> 0;
}

function mulberry32(initialSeed: number): () => number {
  return () => {
    const s = ((initialSeed |= 0), (initialSeed = (initialSeed + 0x6d2b79f5) | 0), initialSeed);
    const t = Math.imul(s ^ (s >>> 15), 1 | s);
    const u = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((u ^ (u >>> 14)) >>> 0) / 4294967296;
  };
}

function seededInt(seed: number, min: number, max: number): number {
  const rng = mulberry32(seed);
  return Math.floor(rng() * (max - min + 1)) + min;
}

function seededArr(seed: number, count: number, min: number, max: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => Math.floor(rng() * (max - min + 1)) + min);
}

// ============================================================
// Web3 Color Tokens
// ============================================================
const COLORS = {
  oledBlack: '#000000',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  mutedGray: '#666666',
  textPrimary: '#c9d1d9',
  textMuted: '#888888',
  borderDim: '#222222',
} as const;

// ============================================================
// Font Token
// ============================================================
const FONT_FAMILY = "'Monaspace Neon', 'Space Grotesk', monospace";

// ============================================================
// Tab Configuration
// ============================================================
const TABS = [
  { id: 'interview_room', label: 'Interview Room', icon: '🎙️' },
  { id: 'press_conference', label: 'Press Conference', icon: '📰' },
  { id: 'media_training', label: 'Media Training', icon: '📚' },
  { id: 'public_image', label: 'Public Image', icon: '⭐' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ============================================================
// Interview Type Labels
// ============================================================
const INTERVIEW_TYPES = [
  'Pre-match',
  'Post-match',
  'Transfer',
  'Rumors',
  'General',
] as const;

const QUESTION_AXES = [
  'Tactical',
  'Personal',
  'Controversial',
  'Financial',
  'Future Plans',
] as const;

const QUOTE_TYPES = [
  'Motivational',
  'Controversial',
  'Humble',
  'Confident',
  'Humorous',
] as const;

const HEADLINE_CATEGORIES = [
  'Positive',
  'Neutral',
  'Negative',
  'Critical',
] as const;

const SCENARIO_AXES = [
  'Crisis Mgmt',
  'Celebration',
  'Deflection',
  'Inspiration',
  'Honesty',
] as const;

const BRAND_CATEGORIES = [
  'Marketability',
  'Social Media',
  'Fan Base',
  'Sponsor Appeal',
  'Legacy',
] as const;

const CAREER_PHASES = [
  'Youth',
  'Debut',
  'Breakthrough',
  'Peak',
  'Veteran',
  'Twilight',
  'Legend',
  'Icon',
] as const;

// ============================================================
// Data Derivation Helpers
// ============================================================
function deriveInterviewFrequency(
  reputation: number,
  week: number,
  season: number,
  recentResultsCount: number
): number[] {
  const seed = hashSeed(`int-freq-${reputation}-${week}-${season}`);
  const base = reputation * 2 + week + recentResultsCount * 3;
  return INTERVIEW_TYPES.map((_, i) =>
    Math.max(1, Math.min(100, base + seededInt(seed + i * 7, -15, 25)))
  );
}

function deriveQuestionDifficulty(
  reputation: number,
  week: number,
  season: number
): number[] {
  const seed = hashSeed(`q-diff-${reputation}-${week}-${season}`);
  return QUESTION_AXES.map((_, i) =>
    Math.max(5, Math.min(95, 30 + reputation * 0.5 + seededInt(seed + i * 13, -20, 30)))
  );
}

function deriveResponseQuality(
  morale: number,
  form: number,
  reputation: number,
  week: number
): number {
  const seed = hashSeed(`resp-qual-${morale}-${form}-${reputation}-${week}`);
  const base = (morale * 0.3 + form * 8 + reputation * 0.4);
  const jitter = seededInt(seed, -8, 12);
  return Math.max(0, Math.min(100, Math.round(base + jitter)));
}

function derivePressAttendance(
  reputation: number,
  week: number,
  recentResultsCount: number
): number[] {
  const seed = hashSeed(`press-att-${reputation}-${week}`);
  const base = 20 + reputation * 1.5 + recentResultsCount * 4;
  return Array.from({ length: 8 }, (_, i) =>
    Math.max(10, Math.min(100, base + seededInt(seed + i * 11, -15, 20) - (7 - i) * 2))
  );
}

function deriveHeadlineSentiment(
  form: number,
  morale: number,
  week: number,
  season: number
): { label: string; value: number }[] {
  const seed = hashSeed(`headline-sent-${form}-${morale}-${week}-${season}`);
  const raw = HEADLINE_CATEGORIES.map((label, i) => ({
    label,
    value: Math.max(5, seededInt(seed + i * 17, 10, 60)),
  }));
  // Boost based on form/morale
  const boosted = raw.map((item, i) => {
    if (item.label === 'Positive' && form > 7) return { ...item, value: item.value + Math.round((form - 7) * 8) };
    if (item.label === 'Negative' && form < 5) return { ...item, value: item.value + Math.round((5 - form) * 6) };
    return item;
  });
  const total = boosted.reduce((sum, item) => sum + item.value, 0);
  return boosted.map(item => ({
    ...item,
    value: Math.round((item.value / total) * 100),
  }));
}

function deriveQuoteImpact(
  reputation: number,
  form: number,
  week: number
): number[] {
  const seed = hashSeed(`quote-impact-${reputation}-${form}-${week}`);
  return QUOTE_TYPES.map((_, i) =>
    Math.max(5, Math.min(95, 40 + reputation * 0.4 + form * 3 + seededInt(seed + i * 19, -20, 20)))
  );
}

function deriveTrainingProgress(
  week: number,
  season: number,
  overall: number
): number {
  const seed = hashSeed(`train-prog-${week}-${season}-${overall}`);
  const base = Math.min(95, (week / 38) * 70 + overall * 0.2);
  const jitter = seededInt(seed, -5, 10);
  return Math.max(0, Math.min(100, Math.round(base + jitter)));
}

function deriveSkillImprovement(
  overall: number,
  age: number,
  week: number,
  season: number
): number[] {
  const seed = hashSeed(`skill-imp-${overall}-${age}-${week}-${season}`);
  const growthRate = age < 23 ? 1.5 : age < 28 ? 0.8 : 0.3;
  return Array.from({ length: 8 }, (_, i) => {
    const baseVal = 20 + overall * 0.3 + i * growthRate * 5;
    return Math.max(10, Math.min(95, Math.round(baseVal + seededInt(seed + i * 23, -8, 12))));
  });
}

function deriveScenarioMastery(
  reputation: number,
  morale: number,
  week: number
): number[] {
  const seed = hashSeed(`scenario-mastery-${reputation}-${morale}-${week}`);
  return SCENARIO_AXES.map((_, i) =>
    Math.max(10, Math.min(95, 35 + reputation * 0.3 + morale * 0.2 + seededInt(seed + i * 29, -15, 25)))
  );
}

function derivePublicPerception(
  reputation: number,
  overall: number,
  form: number,
  age: number,
  week: number
): number[] {
  const seed = hashSeed(`pub-perc-${reputation}-${overall}-${form}-${age}-${week}`);
  const phaseBase = Math.min(CAREER_PHASES.length - 1, Math.floor(age / 4));
  return CAREER_PHASES.map((_, i) => {
    const phaseBonus = i <= phaseBase ? 15 : -5;
    const repBonus = reputation * 0.3;
    const formBonus = form * 2;
    return Math.max(5, Math.min(95, Math.round(40 + phaseBonus + repBonus + formBonus + seededInt(seed + i * 31, -12, 12))));
  });
}

function deriveFanApproval(
  morale: number,
  form: number,
  reputation: number,
  week: number,
  season: number
): number {
  const seed = hashSeed(`fan-approval-${morale}-${form}-${reputation}-${week}-${season}`);
  const base = morale * 0.4 + form * 5 + reputation * 0.3;
  const jitter = seededInt(seed, -6, 8);
  return Math.max(0, Math.min(100, Math.round(base + jitter)));
}

function deriveBrandValue(
  overall: number,
  reputation: number,
  age: number,
  form: number,
  week: number
): number[] {
  const seed = hashSeed(`brand-val-${overall}-${reputation}-${age}-${form}-${week}`);
  const ageMultiplier = age < 25 ? 1.2 : age < 30 ? 1.0 : 0.7;
  return BRAND_CATEGORIES.map((_, i) =>
    Math.max(5, Math.min(95, Math.round((30 + overall * 0.3 + reputation * 0.5 + form * 2) * ageMultiplier + seededInt(seed + i * 37, -15, 20))))
  );
}

// ============================================================
// SVG 1: InterviewFrequencyBars
// ============================================================
function InterviewFrequencyBars({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  const barHeight = 18;
  const gap = 14;
  const labelWidth = 80;
  const chartWidth = 180;
  const startX = labelWidth + 8;
  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.neonLime, marginBottom: 6 }}
      >
        Interview Frequency by Type
      </h3>
      <svg viewBox={`0 0 300 ${data.length * (barHeight + gap) + 20}`} width="100%">
        {data.map((val, i) => {
          const y = i * (barHeight + gap) + 4;
          const barW = Math.max(2, (val / maxVal) * chartWidth);
          return (
            <g key={`freq-bar-${i}`}>
              <text
                key={`freq-label-${i}`}
                x={labelWidth - 6}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textPrimary }}
              >
                {INTERVIEW_TYPES[i]}
              </text>
              <rect
                key={`freq-bg-${i}`}
                x={startX}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill={COLORS.borderDim}
                rx={2}
              />
              <rect
                key={`freq-fill-${i}`}
                x={startX}
                y={y}
                width={barW}
                height={barHeight}
                fill={COLORS.cyanBlue}
                rx={2}
                opacity={0.85}
              />
              <text
                key={`freq-val-${i}`}
                x={startX + barW + 6}
                y={y + barHeight / 2 + 4}
                style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textMuted }}
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 2: QuestionDifficultyRadar
// ============================================================
function QuestionDifficultyRadar({ data }: { data: number[] }) {
  const cx = 150;
  const cy = 105;
  const maxR = 80;
  const sides = data.length;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  function getPoint(index: number, radius: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = data.map((val, i) => {
    const r = (val / 100) * maxR;
    return getPoint(i, r);
  });

  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ') + ' Z';

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.electricOrange, marginBottom: 6 }}
      >
        Question Difficulty Radar
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Grid polygons */}
        {gridLevels.map((level, li) => {
          const pts = Array.from({ length: sides }, (_, i) => {
            const p = getPoint(i, maxR * level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={`radar-grid-${li}`}
              points={pts}
              fill="none"
              stroke={COLORS.borderDim}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Axis lines */}
        {Array.from({ length: sides }, (_, i) => {
          const p = getPoint(i, maxR);
          return (
            <line
              key={`radar-axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={COLORS.borderDim}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Data shape */}
        <path
          d={dataPath}
          fill={COLORS.electricOrange}
          fillOpacity={0.15}
          stroke={COLORS.electricOrange}
          strokeWidth={1.5}
        />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={`radar-dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLORS.electricOrange}
          />
        ))}
        {/* Axis labels */}
        {QUESTION_AXES.map((label, i) => {
          const p = getPoint(i, maxR + 14);
          return (
            <text
              key={`radar-label-${i}`}
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textPrimary }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 3: ResponseQualityRing
// ============================================================
function ResponseQualityRing({ score }: { score: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 65;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const startOffset = circumference * 0.25;

  const color =
    score >= 75 ? COLORS.neonLime
    : score >= 50 ? COLORS.cyanBlue
    : COLORS.electricOrange;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.neonLime, marginBottom: 6 }}
      >
        Overall Response Quality
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={COLORS.borderDim}
          strokeWidth={strokeWidth}
        />
        {/* Value ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={startOffset}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 700, fill: color }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textMuted }}
        >
          out of 100
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 4: PressConferenceAttendanceLine
// ============================================================
function PressConferenceAttendanceLine({ data }: { data: number[] }) {
  const padding = { left: 30, right: 20, top: 15, bottom: 25 };
  const chartW = 300 - padding.left - padding.right;
  const chartH = 200 - padding.top - padding.bottom;
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = Math.max(maxVal - minVal, 1);

  const points = data.map((val, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + (1 - (val - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
    ` L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.electricOrange, marginBottom: 6 }}
      >
        Press Conference Attendance
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padding.top + (1 - frac) * chartH;
          const val = Math.round(minVal + frac * range);
          return (
            <g key={`line-grid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={300 - padding.right}
                y2={y}
                stroke={COLORS.borderDim}
                strokeWidth={0.5}
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                textAnchor="end"
                style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
              >
                {val}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path
          d={areaPath}
          fill={COLORS.electricOrange}
          fillOpacity={0.08}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={COLORS.electricOrange}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={`att-dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLORS.electricOrange}
          />
        ))}
        {/* X labels */}
        {data.map((_, i) => (
          <text
            key={`att-xlabel-${i}`}
            x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
            y={200 - 5}
            textAnchor="middle"
            style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
          >
            M{i + 1}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 5: HeadlineSentimentDonut
// ============================================================
function HeadlineSentimentDonut({ data }: { data: { label: string; value: number }[] }) {
  const cx = 150;
  const cy = 95;
  const outerR = 70;
  const innerR = 40;
  const strokeWidth = outerR - innerR;
  const midR = (outerR + innerR) / 2;
  const circumference = 2 * Math.PI * midR;

  const segmentColors = [
    COLORS.neonLime,
    COLORS.textMuted,
    COLORS.electricOrange,
    '#FF2200',
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Compute each segment's dash using reduce
  const segments = data.reduce(
    (acc, d, i) => {
      const segLen = (d.value / Math.max(total, 1)) * circumference;
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].end : 0;
      return [
        ...acc,
        {
          dash: `${segLen} ${circumference - segLen}`,
          offset: -prevEnd,
          end: prevEnd + segLen,
          color: segmentColors[i] ?? COLORS.textMuted,
        },
      ];
    },
    [] as { dash: string; offset: number; end: number; color: string }[]
  );

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.cyanBlue, marginBottom: 6 }}
      >
        Headline Sentiment Distribution
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={midR}
          fill="none"
          stroke={COLORS.borderDim}
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg, i) => (
          <circle
            key={`donut-seg-${i}`}
            cx={cx}
            cy={cy}
            r={midR}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dash}
            strokeDashoffset={seg.offset}
            opacity={0.85}
          />
        ))}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 700, fill: COLORS.textPrimary }}
        >
          Headlines
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textMuted }}
        >
          {total} total
        </text>
        {/* Legend */}
        {data.map((d, i) => (
          <g key={`donut-legend-${i}`}>
            <rect
              x={20}
              y={175 + i * 0 - data.length * 2}
              width={8}
              height={8}
              fill={segmentColors[i] ?? COLORS.textMuted}
              rx={1}
            />
            <text
              x={32}
              y={183 + i * 0 - data.length * 2}
              style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textPrimary }}
            >
              {d.label}: {d.value}%
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 6: QuoteImpactBars
// ============================================================
function QuoteImpactBars({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  const barHeight = 18;
  const gap = 14;
  const labelWidth = 78;
  const chartWidth = 180;
  const startX = labelWidth + 8;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.neonLime, marginBottom: 6 }}
      >
        Quote Impact by Type
      </h3>
      <svg viewBox={`0 0 300 ${data.length * (barHeight + gap) + 20}`} width="100%">
        {data.map((val, i) => {
          const y = i * (barHeight + gap) + 4;
          const barW = Math.max(2, (val / maxVal) * chartWidth);
          return (
            <g key={`quote-bar-${i}`}>
              <text
                key={`quote-label-${i}`}
                x={labelWidth - 6}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textPrimary }}
              >
                {QUOTE_TYPES[i]}
              </text>
              <rect
                key={`quote-bg-${i}`}
                x={startX}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill={COLORS.borderDim}
                rx={2}
              />
              <rect
                key={`quote-fill-${i}`}
                x={startX}
                y={y}
                width={barW}
                height={barHeight}
                fill={COLORS.neonLime}
                rx={2}
                opacity={0.85}
              />
              <text
                key={`quote-val-${i}`}
                x={startX + barW + 6}
                y={y + barHeight / 2 + 4}
                style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textMuted }}
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 7: TrainingProgressGauge
// ============================================================
function TrainingProgressGauge({ progress }: { progress: number }) {
  const cx = 150;
  const cy = 120;
  const radius = 80;
  const strokeWidth = 12;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalAngle = endAngle - startAngle;
  const circumference = radius * totalAngle;
  const filled = (progress / 100) * circumference;

  const color =
    progress >= 80 ? COLORS.neonLime
    : progress >= 50 ? COLORS.cyanBlue
    : COLORS.electricOrange;

  // Compute the arc SVG path for the background
  const bgArc = describeArc(cx, cy, radius, startAngle, endAngle);
  const fgArc = describeArc(cx, cy, radius, startAngle, startAngle + totalAngle * (progress / 100));

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.cyanBlue, marginBottom: 6 }}
      >
        Media Training Completion
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Background arc */}
        <path
          d={bgArc}
          fill="none"
          stroke={COLORS.borderDim}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={fgArc}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 34, fontWeight: 700, fill: color }}
        >
          {progress}%
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textMuted }}
        >
          complete
        </text>
        {/* Scale markers */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const angle = startAngle + totalAngle * (mark / 100);
          const innerPt = {
            x: cx + Math.cos(angle) * (radius - 20),
            y: cy + Math.sin(angle) * (radius - 20),
          };
          const outerPt = {
            x: cx + Math.cos(angle) * (radius + 4),
            y: cy + Math.sin(angle) * (radius + 4),
          };
          return (
            <g key={`gauge-mark-${mark}`}>
              <line
                x1={innerPt.x}
                y1={innerPt.y}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke={COLORS.textMuted}
                strokeWidth={0.8}
                opacity={0.5}
              />
              <text
                x={cx + Math.cos(angle) * (radius + 14)}
                y={cy + Math.sin(angle) * (radius + 14) + 3}
                textAnchor="middle"
                style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
              >
                {mark}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

/** Helper: describe an SVG arc path */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: cx + Math.cos(startAngle) * r,
    y: cy + Math.sin(startAngle) * r,
  };
  const end = {
    x: cx + Math.cos(endAngle) * r,
    y: cy + Math.sin(endAngle) * r,
  };
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// ============================================================
// SVG 8: SkillImprovementArea
// ============================================================
function SkillImprovementArea({ data }: { data: number[] }) {
  const padding = { left: 30, right: 15, top: 15, bottom: 25 };
  const chartW = 300 - padding.left - padding.right;
  const chartH = 200 - padding.top - padding.bottom;
  const maxVal = Math.max(...data, 1);

  const points = data.map((val, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + (1 - val / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
    ` L ${points[0].x} ${padding.top + chartH} Z`;

  const weekLabels = ['W1', 'W4', 'W8', 'W12', 'W16', 'W20', 'W28', 'W36'];

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.electricOrange, marginBottom: 6 }}
      >
        Media Skill Improvement Over Time
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padding.top + (1 - frac) * chartH;
          return (
            <g key={`area-grid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={300 - padding.right}
                y2={y}
                stroke={COLORS.borderDim}
                strokeWidth={0.5}
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                textAnchor="end"
                style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
              >
                {Math.round(frac * maxVal)}
              </text>
            </g>
          );
        })}
        {/* Area */}
        <path
          d={areaPath}
          fill={COLORS.electricOrange}
          fillOpacity={0.2}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={COLORS.electricOrange}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={`skill-dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLORS.electricOrange}
          />
        ))}
        {/* X labels */}
        {data.map((_, i) => (
          <text
            key={`skill-xlabel-${i}`}
            x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
            y={200 - 5}
            textAnchor="middle"
            style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
          >
            {weekLabels[i] ?? `W${i + 1}`}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 9: ScenarioMasteryRadar
// ============================================================
function ScenarioMasteryRadar({ data }: { data: number[] }) {
  const cx = 150;
  const cy = 105;
  const maxR = 80;
  const sides = data.length;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  function getPoint(index: number, radius: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = data.map((val, i) => getPoint(i, (val / 100) * maxR));

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.neonLime, marginBottom: 6 }}
      >
        Scenario Mastery Radar
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Grid */}
        {gridLevels.map((level, li) => {
          const pts = Array.from({ length: sides }, (_, i) => {
            const p = getPoint(i, maxR * level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={`scenario-grid-${li}`}
              points={pts}
              fill="none"
              stroke={COLORS.borderDim}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Axes */}
        {Array.from({ length: sides }, (_, i) => {
          const p = getPoint(i, maxR);
          return (
            <line
              key={`scenario-axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={COLORS.borderDim}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Data shape */}
        <path
          d={dataPath}
          fill={COLORS.neonLime}
          fillOpacity={0.12}
          stroke={COLORS.neonLime}
          strokeWidth={1.5}
        />
        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={`scenario-dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={COLORS.neonLime}
          />
        ))}
        {/* Labels */}
        {SCENARIO_AXES.map((label, i) => {
          const p = getPoint(i, maxR + 14);
          return (
            <text
              key={`scenario-label-${i}`}
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textPrimary }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 10: PublicPerceptionTimeline
// ============================================================
function PublicPerceptionTimeline({ data }: { data: number[] }) {
  const nodeSpacing = 36;
  const startX = 20;
  const y = 100;
  const nodeR = 6;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.electricOrange, marginBottom: 6 }}
      >
        Public Perception Timeline
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Connecting line */}
        <line
          x1={startX}
          y1={y}
          x2={startX + (data.length - 1) * nodeSpacing}
          y2={y}
          stroke={COLORS.borderDim}
          strokeWidth={2}
        />
        {/* Nodes */}
        {data.map((val, i) => {
          const x = startX + i * nodeSpacing;
          const isHighest = val === Math.max(...data);
          const color = isHighest ? COLORS.neonLime : COLORS.electricOrange;
          return (
            <g key={`timeline-node-${i}`}>
              {/* Vertical connector */}
              <line
                key={`timeline-vline-${i}`}
                x1={x}
                y1={y}
                x2={x}
                y2={y - val * 0.4}
                stroke={color}
                strokeWidth={1}
                opacity={0.5}
              />
              {/* Node */}
              <circle
                key={`timeline-circle-${i}`}
                cx={x}
                cy={y}
                r={nodeR}
                fill={color}
                opacity={isHighest ? 1 : 0.7}
              />
              {/* Value above */}
              <text
                key={`timeline-val-${i}`}
                x={x}
                y={y - val * 0.4 - 6}
                textAnchor="middle"
                style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: color }}
              >
                {val}
              </text>
              {/* Label below */}
              <text
                key={`timeline-label-${i}`}
                x={x}
                y={y + 20}
                textAnchor="middle"
                style={{ fontFamily: FONT_FAMILY, fontSize: 7, fill: COLORS.textMuted }}
              >
                {CAREER_PHASES[i] ?? `P${i + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG 11: FanApprovalRing
// ============================================================
function FanApprovalRing({ score }: { score: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 65;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const startOffset = circumference * 0.25;

  const color =
    score >= 75 ? COLORS.neonLime
    : score >= 50 ? COLORS.cyanBlue
    : COLORS.electricOrange;

  const sentiment =
    score >= 80 ? 'Loved'
    : score >= 60 ? 'Liked'
    : score >= 40 ? 'Neutral'
    : score >= 20 ? 'Doubtful'
    : 'Critical';

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.cyanBlue, marginBottom: 6 }}
      >
        Fan Approval Rating
      </h3>
      <svg viewBox="0 0 300 200" width="100%">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={COLORS.borderDim}
          strokeWidth={strokeWidth}
        />
        {/* Value ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={startOffset}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: 700, fill: color }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{ fontFamily: FONT_FAMILY, fontSize: 10, fill: sentiment === 'Loved' || sentiment === 'Liked' ? COLORS.neonLime : COLORS.textMuted }}
        >
          {sentiment}
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG 12: BrandValueBars
// ============================================================
function BrandValueBars({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  const barHeight = 18;
  const gap = 14;
  const labelWidth = 82;
  const chartWidth = 170;
  const startX = labelWidth + 8;

  return (
    <section>
      <h3
        style={{ fontFamily: FONT_FAMILY, fontSize: 11, fill: COLORS.electricOrange, marginBottom: 6 }}
      >
        Brand Value Components
      </h3>
      <svg viewBox={`0 0 300 ${data.length * (barHeight + gap) + 20}`} width="100%">
        {data.map((val, i) => {
          const y = i * (barHeight + gap) + 4;
          const barW = Math.max(2, (val / maxVal) * chartWidth);
          return (
            <g key={`brand-bar-${i}`}>
              <text
                key={`brand-label-${i}`}
                x={labelWidth - 6}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                style={{ fontFamily: FONT_FAMILY, fontSize: 9, fill: COLORS.textPrimary }}
              >
                {BRAND_CATEGORIES[i]}
              </text>
              <rect
                key={`brand-bg-${i}`}
                x={startX}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill={COLORS.borderDim}
                rx={2}
              />
              <rect
                key={`brand-fill-${i}`}
                x={startX}
                y={y}
                width={barW}
                height={barHeight}
                fill={COLORS.electricOrange}
                rx={2}
                opacity={0.85}
              />
              <text
                key={`brand-val-${i}`}
                x={startX + barW + 6}
                y={y + barHeight / 2 + 4}
                style={{ fontFamily: FONT_FAMILY, fontSize: 8, fill: COLORS.textMuted }}
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// Tab Content Panels
// ============================================================
function InterviewRoomTab({
  reputation,
  week,
  season,
  morale,
  form,
  recentResultsCount,
}: {
  reputation: number;
  week: number;
  season: number;
  morale: number;
  form: number;
  recentResultsCount: number;
}) {
  const frequencyData = deriveInterviewFrequency(reputation, week, season, recentResultsCount);
  const difficultyData = deriveQuestionDifficulty(reputation, week, season);
  const responseScore = deriveResponseQuality(morale, form, reputation, week);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InterviewFrequencyBars data={frequencyData} />
      <QuestionDifficultyRadar data={difficultyData} />
      <ResponseQualityRing score={responseScore} />
    </div>
  );
}

function PressConferenceTab({
  reputation,
  week,
  season,
  form,
  morale,
  recentResultsCount,
}: {
  reputation: number;
  week: number;
  season: number;
  form: number;
  morale: number;
  recentResultsCount: number;
}) {
  const attendanceData = derivePressAttendance(reputation, week, recentResultsCount);
  const sentimentData = deriveHeadlineSentiment(form, morale, week, season);
  const quoteData = deriveQuoteImpact(reputation, form, week);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PressConferenceAttendanceLine data={attendanceData} />
      <HeadlineSentimentDonut data={sentimentData} />
      <QuoteImpactBars data={quoteData} />
    </div>
  );
}

function MediaTrainingTab({
  week,
  season,
  overall,
  age,
  reputation,
  morale,
}: {
  week: number;
  season: number;
  overall: number;
  age: number;
  reputation: number;
  morale: number;
}) {
  const trainingProgress = deriveTrainingProgress(week, season, overall);
  const skillData = deriveSkillImprovement(overall, age, week, season);
  const scenarioData = deriveScenarioMastery(reputation, morale, week);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TrainingProgressGauge progress={trainingProgress} />
      <SkillImprovementArea data={skillData} />
      <ScenarioMasteryRadar data={scenarioData} />
    </div>
  );
}

function PublicImageTab({
  reputation,
  overall,
  form,
  age,
  week,
  morale,
  season,
}: {
  reputation: number;
  overall: number;
  form: number;
  age: number;
  week: number;
  morale: number;
  season: number;
}) {
  const perceptionData = derivePublicPerception(reputation, overall, form, age, week);
  const fanApproval = deriveFanApproval(morale, form, reputation, week, season);
  const brandData = deriveBrandValue(overall, reputation, age, form, week);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PublicPerceptionTimeline data={perceptionData} />
      <FanApprovalRing score={fanApproval} />
      <BrandValueBars data={brandData} />
    </div>
  );
}

// ============================================================
// Stat Pill Component
// ============================================================
function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        border: `1px solid ${COLORS.borderDim}`,
        borderRadius: 6,
        background: COLORS.bgCard,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 10,
          color: COLORS.textMuted,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 12,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MediaInterviewEnhanced() {
  const gameState = useGameStore((state) => state.gameState);
  const setScreen = useGameStore((state) => state.setScreen);
  const [activeTab, setActiveTab] = useState<TabId>('interview_room');

  const player = gameState?.player;
  const clubName = gameState?.currentClub?.name ?? 'Unknown Club';
  const week = gameState?.currentWeek ?? 1;
  const season = gameState?.currentSeason ?? 1;
  const recentResultsCount = gameState?.recentResults.length ?? 0;

  const playerName = player?.name ?? 'Unknown Player';
  const reputation = player?.reputation ?? 10;
  const overall = player?.overall ?? 50;
  const form = player?.form ?? 5.0;
  const morale = player?.morale ?? 50;
  const age = player?.age ?? 20;

  const totalAppearances = player?.careerStats?.totalAppearances ?? 0;
  const totalGoals = player?.careerStats?.totalGoals ?? 0;

  // Derived summary stats via reduce
  const interviewScore = [reputation * 2, form * 5, morale * 0.5, Math.min(week, 20) * 1.5].reduce(
    (sum, v) => sum + v,
    0
  );

  const mediaGrade =
    interviewScore >= 200 ? 'A+'
    : interviewScore >= 150 ? 'A'
    : interviewScore >= 120 ? 'B+'
    : interviewScore >= 90 ? 'B'
    : interviewScore >= 60 ? 'C'
    : 'D';

  const gradeColor =
    mediaGrade.startsWith('A') ? COLORS.neonLime
    : mediaGrade.startsWith('B') ? COLORS.cyanBlue
    : mediaGrade === 'C' ? COLORS.electricOrange
    : '#FF2200';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.oledBlack,
        color: COLORS.textPrimary,
        fontFamily: FONT_FAMILY,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: `1px solid ${COLORS.borderDim}`,
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setScreen('dashboard')}
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.borderDim}`,
              borderRadius: 6,
              padding: '6px 10px',
              color: COLORS.textMuted,
              cursor: 'pointer',
              fontFamily: FONT_FAMILY,
              fontSize: 12,
            }}
          >
            ← Back
          </button>
          <div>
            <h1
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: 0,
              }}
            >
              Media Interview Center
            </h1>
            <p
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 11,
                color: COLORS.textMuted,
                margin: 0,
              }}
            >
              {playerName} — {clubName} — Season {season}, Week {week}
            </p>
          </div>
        </div>

        {/* Media Grade Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px',
            border: `1px solid ${gradeColor}`,
            borderRadius: 6,
            background: `${gradeColor}11`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 10,
              color: COLORS.textMuted,
            }}
          >
            MEDIA GRADE
          </span>
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 22,
              fontWeight: 700,
              color: gradeColor,
            }}
          >
            {mediaGrade}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <StatPill label="Reputation" value={reputation} color={COLORS.electricOrange} />
        <StatPill label="Form" value={form.toFixed(1)} color={COLORS.cyanBlue} />
        <StatPill label="Morale" value={morale} color={COLORS.neonLime} />
        <StatPill label="Overall" value={overall} color={COLORS.textPrimary} />
        <StatPill label="Appearances" value={totalAppearances} color={COLORS.textMuted} />
        <StatPill label="Goals" value={totalGoals} color={COLORS.electricOrange} />
        <StatPill label="Age" value={age} color={COLORS.textMuted} />
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          borderBottom: `1px solid ${COLORS.borderDim}`,
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? COLORS.electricOrange : COLORS.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${COLORS.electricOrange}` : '2px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.7,
                transition: 'opacity 0.2s ease',
              }}
            >
              <span style={{ marginRight: 6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.borderDim}`,
          borderRadius: 8,
          padding: 20,
        }}
      >
        {activeTab === 'interview_room' && (
          <InterviewRoomTab
            reputation={reputation}
            week={week}
            season={season}
            morale={morale}
            form={form}
            recentResultsCount={recentResultsCount}
          />
        )}

        {activeTab === 'press_conference' && (
          <PressConferenceTab
            reputation={reputation}
            week={week}
            season={season}
            form={form}
            morale={morale}
            recentResultsCount={recentResultsCount}
          />
        )}

        {activeTab === 'media_training' && (
          <MediaTrainingTab
            week={week}
            season={season}
            overall={overall}
            age={age}
            reputation={reputation}
            morale={morale}
          />
        )}

        {activeTab === 'public_image' && (
          <PublicImageTab
            reputation={reputation}
            overall={overall}
            form={form}
            age={age}
            week={week}
            morale={morale}
            season={season}
          />
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 16,
          padding: '10px 16px',
          border: `1px solid ${COLORS.borderDim}`,
          borderRadius: 6,
          background: COLORS.bgDark,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 10,
            color: COLORS.textMuted,
          }}
        >
          12 Web3 SVG Visualizations • 4 Data Tabs • Derived from {recentResultsCount} recent match results
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 10,
            color: COLORS.mutedGray,
          }}
        >
          Powered by On-Chain Media Analytics
        </span>
      </div>
    </div>
  );
}
