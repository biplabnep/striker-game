'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Types & Interfaces
// ============================================================

type TabId = 'career_milestones' | 'life_events' | 'transfer_sagas' | 'season_highlights';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

// ============================================================
// Constants
// ============================================================

const FONT_FAMILY = "'Monaspace Neon', 'Space Grotesk', monospace";

const COLOR_TOKENS = {
  oledBlack: '#000000',
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  bgDark: '#0a0a0a',
  bgCard: '#111111',
  mutedGray: '#666666',
  textPrimary: '#c9d1d9',
  textMuted: '#888888',
} as const;

const tabs: readonly TabConfig[] = [
  { id: 'career_milestones', label: 'Milestones', icon: '🏆' },
  { id: 'life_events', label: 'Life Events', icon: '🌟' },
  { id: 'transfer_sagas', label: 'Transfer Sagas', icon: '🔄' },
  { id: 'season_highlights', label: 'Highlights', icon: '✨' },
] as const;

// ============================================================
// Helper: Generate mock derived data from game state
// ============================================================

function deriveCareerData(gameState: ReturnType<typeof useGameStore.getState>['gameState']) {
  if (!gameState) {
    return {
      milestoneProgress: 0,
      trajectoryPoints: [0, 0, 0, 0, 0, 0, 0, 0],
      radarAxes: [0, 0, 0, 0, 0],
      lifeEventFrequencies: [0, 0, 0, 0, 0],
      timelineNodes: [
        { label: 'Debut', impact: 50, x: 0 },
        { label: 'First Goal', impact: 60, x: 1 },
        { label: 'Transfer', impact: 70, x: 2 },
        { label: 'Injury', impact: 30, x: 3 },
        { label: 'Comeback', impact: 65, x: 4 },
        { label: 'Trophy', impact: 85, x: 5 },
        { label: 'Record', impact: 90, x: 6 },
        { label: 'Legend', impact: 95, x: 7 },
      ],
      satisfactionScore: 0,
      transferLinePoints: [0, 0, 0, 0, 0, 0, 0, 0],
      loyaltySegments: [25, 25, 25, 25],
      transferRadarAxes: [0, 0, 0, 0, 0],
      seasonComparisonCurrent: [0, 0, 0, 0, 0],
      seasonComparisonPrevious: [0, 0, 0, 0, 0],
      highlightNodes: [
        { label: 'Opening Day', impact: 50, x: 0 },
        { label: 'Hat-Trick', impact: 80, x: 1 },
        { label: 'Derby Win', impact: 70, x: 2 },
        { label: 'Injury', impact: 20, x: 3 },
        { label: 'Return', impact: 60, x: 4 },
        { label: 'Cup Final', impact: 90, x: 5 },
        { label: 'Title Race', impact: 85, x: 6 },
        { label: 'Season End', impact: 75, x: 7 },
      ],
      seasonGrade: 0,
      playerName: 'Unknown',
      clubName: 'Unknown Club',
      currentSeason: 1,
      currentWeek: 1,
    };
  }

  const { player, currentClub, currentSeason, currentWeek } = gameState;
  const { careerStats, seasonStats, overall, potential, morale, reputation } = player;

  // Milestone progress: based on overall vs potential ratio + career achievements
  const milestoneProgress = Math.min(
    100,
    Math.round(
      (overall / potential) * 50 +
        (careerStats.totalGoals / 100) * 20 +
        (careerStats.totalAppearances / 200) * 20 +
        (careerStats.trophies.length / 5) * 10
    )
  );

  // Career trajectory: 8-point area chart data derived from seasons history
  const trajectoryPoints = gameState.seasons.length > 0
    ? gameState.seasons.slice(-8).map((s, i, arr) => {
        const baseRating = 40 + (s.playerStats.averageRating || 6.0) * 5;
        const goalsBonus = (s.playerStats.goals || 0) * 2;
        const appearancesBonus = (s.playerStats.appearances || 0) * 0.3;
        return Math.min(100, Math.round(baseRating + goalsBonus + appearancesBonus));
      })
    : [0, 1, 2, 3, 5, 8, 12, 18].map((v) =>
        Math.min(100, Math.round(v * 2 + overall * 0.5 + Math.sin(v) * 5))
      );

  // Radar axes: Goals/Appearances/Trophies/Records/Awards
  const radarAxes = [
    Math.min(100, careerStats.totalGoals * 3),
    Math.min(100, careerStats.totalAppearances * 1.5),
    Math.min(100, careerStats.trophies.length * 25),
    Math.min(100, (player.traits?.length ?? 0) * 20 + overall * 0.3),
    Math.min(100, reputation),
  ];

  // Life event frequencies: Contract/Transfer/Injury/Award/Personal
  const lifeEventFrequencies = [
    Math.min(100, gameState.resolvedEvents.length * 15),
    Math.min(100, gameState.transferOffers.length * 20 + gameState.loanOffers.length * 10),
    Math.min(100, (player.injuryHistory?.length ?? 0) * 12),
    Math.min(100, careerStats.trophies.length * 20 + gameState.achievements.filter((a) => a.unlocked).length * 8),
    Math.min(100, morale + gameState.resolvedEvents.length * 10),
  ];

  // Timeline nodes with impact scores
  const allEvents = [
    ...gameState.resolvedEvents.slice(-3).map((e) => ({
      label: e.title.length > 12 ? e.title.slice(0, 12) + '..' : e.title,
      impact: Math.min(100, Math.abs(e.choices[0]?.effects.reputation ?? 50) + 50),
      x: 0,
    })),
  ];
  const timelineNodes = [
    { label: 'Debut', impact: Math.min(100, 40 + careerStats.totalAppearances), x: 0 },
    { label: '1st Goal', impact: Math.min(100, 30 + careerStats.totalGoals * 5), x: 1 },
    ...allEvents,
    { label: 'Current', impact: Math.min(100, overall), x: 7 },
  ].slice(0, 8).map((n, i) => ({ ...n, x: i }));

  // Satisfaction score
  const satisfactionScore = Math.min(
    100,
    Math.round(
      morale * 0.3 +
        overall * 0.25 +
        reputation * 0.2 +
        (seasonStats.averageRating || 0) * 5 * 0.15 +
        (player.fitness || 50) * 0.1
    )
  );

  // Transfer line chart: mock transfer fees/valuation over career
  const transferLinePoints = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const base = player.marketValue * 0.001;
    const growth = base * (i / 7) * (overall / 85);
    const wave = Math.sin(i * 1.2) * 15;
    return Math.max(0, Math.min(100, Math.round(growth + wave + 10)));
  });

  // Club loyalty donut segments: Short Stay/Medium/Long/One Club
  const totalSeasons = careerStats.seasonsPlayed || 1;
  const loyaltySegments = [
    Math.max(0, gameState.seasons.filter((s) => s.achievements.length === 0).length),
    Math.max(0, gameState.seasons.filter((s) => s.leaguePosition > 10).length),
    Math.max(0, gameState.seasons.filter((s) => s.leaguePosition > 0 && s.leaguePosition <= 10).length),
    Math.max(0, totalSeasons > 3 ? 1 : 0),
  ];

  // Transfer success radar: Adaptation/Performance/Morale Impact/Fan Reception/Win Rate
  const transferRadarAxes = [
    Math.min(100, morale * 0.8 + Math.random() * 20),
    Math.min(100, overall * 0.9 + Math.random() * 10),
    Math.min(100, morale),
    Math.min(100, reputation * 0.9 + (seasonStats.averageRating || 0) * 3),
    Math.min(100, (seasonStats.goals || 0) * 4 + (seasonStats.assists || 0) * 3),
  ].map(Math.round);

  // Season comparison: current vs previous
  const seasonComparisonCurrent = [
    Math.min(100, seasonStats.goals * 10),
    Math.min(100, seasonStats.assists * 12),
    Math.min(100, (seasonStats.averageRating || 0) * 10),
    Math.min(100, seasonStats.minutesPlayed * 0.1),
    Math.min(100, careerStats.trophies.filter((t) => t.season === currentSeason).length * 33),
  ];
  const prevSeason = gameState.seasons[gameState.seasons.length - 2];
  const seasonComparisonPrevious = prevSeason
    ? [
        Math.min(100, (prevSeason.playerStats?.goals || 0) * 10),
        Math.min(100, (prevSeason.playerStats?.assists || 0) * 12),
        Math.min(100, (prevSeason.playerStats?.averageRating || 0) * 10),
        Math.min(100, (prevSeason.playerStats?.minutesPlayed || 0) * 0.1),
        Math.min(100, (prevSeason.achievements?.length || 0) * 33),
      ]
    : [0, 0, 0, 0, 0];

  // Highlight timeline nodes
  const highlightNodes = [
    { label: 'Wk 1', impact: Math.min(100, 30 + (gameState.recentResults[0]?.playerRating || 5) * 5), x: 0 },
    { label: 'Wk 5', impact: Math.min(100, 40 + (gameState.recentResults[1]?.playerRating || 5) * 5), x: 1 },
    { label: 'Wk 10', impact: Math.min(100, 50 + (gameState.recentResults[2]?.playerRating || 5) * 5), x: 2 },
    { label: 'Wk 15', impact: Math.min(100, seasonStats.injuries > 0 ? 20 : 60), x: 3 },
    { label: 'Wk 20', impact: Math.min(100, 55 + seasonStats.manOfTheMatch * 10), x: 4 },
    { label: 'Wk 25', impact: Math.min(100, 70 + (seasonStats.goals || 0)), x: 5 },
    { label: 'Wk 30', impact: Math.min(100, overall * 0.8), x: 6 },
    { label: 'Now', impact: Math.min(100, satisfactionScore), x: 7 },
  ];

  // Season grade
  const seasonGrade = Math.min(
    100,
    Math.round(
      (seasonStats.averageRating || 0) * 8 +
        (seasonStats.goals || 0) * 2 +
        (seasonStats.assists || 0) * 1.5 +
        (seasonStats.manOfTheMatch || 0) * 3 +
        overall * 0.2 -
        (seasonStats.injuries || 0) * 2
    )
  );

  return {
    milestoneProgress,
    trajectoryPoints,
    radarAxes,
    lifeEventFrequencies,
    timelineNodes,
    satisfactionScore,
    transferLinePoints,
    loyaltySegments,
    transferRadarAxes,
    seasonComparisonCurrent,
    seasonComparisonPrevious,
    highlightNodes,
    seasonGrade,
    playerName: player.name,
    clubName: currentClub?.name ?? 'Unknown Club',
    currentSeason,
    currentWeek,
  };
}

// ============================================================
// SVG Component 1: MilestoneProgressGauge (Semi-circular)
// ============================================================

function MilestoneProgressGauge({ progress }: { progress: number }) {
  const cx = 150;
  const cy = 160;
  const radius = 100;
  const strokeWidth = 14;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const progressAngle = startAngle + (progress / 100) * Math.PI;

  const arcPath = (angle: number) => {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(angle);
    const y2 = cy + radius * Math.sin(angle);
    const largeArc = angle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const bgPath = arcPath(endAngle);
  const fgPath = arcPath(progressAngle);

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.neonLime, fontFamily: FONT_FAMILY }}
      >
        Milestone Progress
      </h3>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-xs">
          {/* Background arc */}
          <path
            d={bgPath}
            fill="none"
            stroke={COLOR_TOKENS.mutedGray}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Progress arc */}
          <path
            d={fgPath}
            fill="none"
            stroke={COLOR_TOKENS.neonLime}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.9}
          />
          {/* Center text */}
          <text
            x={cx}
            y={cy - 15}
            textAnchor="middle"
            fill={COLOR_TOKENS.neonLime}
            fontSize="28"
            fontWeight="bold"
            fontFamily={FONT_FAMILY}
          >
            {progress}%
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill={COLOR_TOKENS.textMuted}
            fontSize="10"
            fontFamily={FONT_FAMILY}
          >
            NEXT MILESTONE
          </text>
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = startAngle + (tick / 100) * Math.PI;
            const innerR = radius - 22;
            const outerR = radius - 10;
            const x1 = cx + innerR * Math.cos(tickAngle);
            const y1 = cy + innerR * Math.sin(tickAngle);
            const x2 = cx + outerR * Math.cos(tickAngle);
            const y2 = cy + outerR * Math.sin(tickAngle);
            return (
              <line
                key={`tick-${tick}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLOR_TOKENS.mutedGray}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={0.5}
              />
            );
          })}
        </svg>
      </div>
    </section>
  );
}

// ============================================================
// SVG Component 2: CareerTrajectoryArea (8-point area chart)
// ============================================================

function CareerTrajectoryArea({ points }: { points: number[] }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = 300 - padding.left - padding.right;
  const chartH = 200 - padding.top - padding.bottom;
  const maxVal = Math.max(...points, 1);

  const dataPoints = points.map((val, i) => ({
    x: padding.left + (i / Math.max(points.length - 1, 1)) * chartW,
    y: padding.top + chartH - (val / maxVal) * chartH,
    value: val,
    index: i,
  }));

  const areaPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const closingPath = `${areaPath} L ${dataPoints[dataPoints.length - 1].x} ${padding.top + chartH} L ${dataPoints[0].x} ${padding.top + chartH} Z`;

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Y-axis labels
  const yLabels = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.electricOrange, fontFamily: FONT_FAMILY }}
      >
        Career Trajectory
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Grid lines */}
        {yLabels.map((label, i) => {
          const y = padding.top + chartH - (label / maxVal) * chartH;
          return (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={300 - padding.right}
              y2={y}
              stroke={COLOR_TOKENS.mutedGray}
              strokeWidth="0.5"
              opacity={0.3}
            />
          );
        })}
        {/* Y-axis labels */}
        {yLabels.map((label, i) => {
          const y = padding.top + chartH - (label / maxVal) * chartH;
          return (
            <text
              key={`ylabel-${i}`}
              x={padding.left - 5}
              y={y + 3}
              textAnchor="end"
              fill={COLOR_TOKENS.textMuted}
              fontSize="8"
              fontFamily={FONT_FAMILY}
            >
              {label}
            </text>
          );
        })}
        {/* Area fill */}
        <path d={closingPath} fill={COLOR_TOKENS.electricOrange} opacity={0.2} />
        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={COLOR_TOKENS.electricOrange}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        {/* Data points */}
        {dataPoints.map((p) => (
          <circle
            key={`dp-${p.index}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={COLOR_TOKENS.electricOrange}
            stroke={COLOR_TOKENS.bgCard}
            strokeWidth="1"
          />
        ))}
        {/* X-axis labels */}
        {dataPoints.map((p) => (
          <text
            key={`xlabel-${p.index}`}
            x={p.x}
            y={200 - 5}
            textAnchor="middle"
            fill={COLOR_TOKENS.textMuted}
            fontSize="8"
            fontFamily={FONT_FAMILY}
          >
            S{p.index + 1}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 3: MilestoneCategoryRadar (5-axis radar)
// ============================================================

function MilestoneCategoryRadar({ axes }: { axes: number[] }) {
  const cx = 150;
  const cy = 100;
  const maxRadius = 70;
  const labels = ['Goals', 'Apps', 'Trophies', 'Records', 'Awards'];
  const totalAxes = axes.length;
  const angleStep = (2 * Math.PI) / totalAxes;
  const startOffset = -Math.PI / 2;

  const getPoint = (index: number, radius: number) => ({
    x: cx + radius * Math.cos(startOffset + index * angleStep),
    y: cy + radius * Math.sin(startOffset + index * angleStep),
  });

  // Grid rings at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Data polygon path
  const dataPolygonPath = axes
    .map((val, i) => {
      const r = (val / 100) * maxRadius;
      const pt = getPoint(i, r);
      return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
    })
    .join(' ') + ' Z';

  // Axis lines
  const axisLines = axes.map((_, i) => {
    const end = getPoint(i, maxRadius);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y, index: i };
  });

  // Label positions (outside the radar)
  const labelPositions = axes.map((_, i) => {
    const pt = getPoint(i, maxRadius + 15);
    return { ...pt, label: labels[i], index: i };
  });

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.cyanBlue, fontFamily: FONT_FAMILY }}
      >
        Milestone Balance
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Grid rings */}
        {gridLevels.map((level, gi) => {
          const ringPath = axes
            .map((_, i) => {
              const pt = getPoint(i, maxRadius * level);
              return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
            })
            .join(' ') + ' Z';
          return (
            <path
              key={`ring-${gi}`}
              d={ringPath}
              fill="none"
              stroke={COLOR_TOKENS.mutedGray}
              strokeWidth="0.5"
              opacity={0.3}
            />
          );
        })}
        {/* Axis lines */}
        {axisLines.map((line) => (
          <line
            key={`axis-${line.index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={COLOR_TOKENS.mutedGray}
            strokeWidth="0.5"
            opacity={0.4}
          />
        ))}
        {/* Data polygon */}
        <path
          d={dataPolygonPath}
          fill={COLOR_TOKENS.cyanBlue}
          opacity={0.15}
          stroke={COLOR_TOKENS.cyanBlue}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Data points on vertices */}
        {axes.map((val, i) => {
          const r = (val / 100) * maxRadius;
          const pt = getPoint(i, r);
          return (
            <circle
              key={`vertex-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill={COLOR_TOKENS.cyanBlue}
              opacity={0.9}
            />
          );
        })}
        {/* Labels */}
        {labelPositions.map((lp) => (
          <text
            key={`label-${lp.index}`}
            x={lp.x}
            y={lp.y + 3}
            textAnchor="middle"
            fill={COLOR_TOKENS.textPrimary}
            fontSize="8"
            fontFamily={FONT_FAMILY}
          >
            {lp.label}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 4: LifeEventFrequencyBars (5 horizontal bars)
// ============================================================

function LifeEventFrequencyBars({ frequencies }: { frequencies: number[] }) {
  const categories = ['Contract', 'Transfer', 'Injury', 'Award', 'Personal'];
  const maxVal = Math.max(...frequencies, 1);
  const barHeight = 22;
  const gap = 8;
  const labelWidth = 55;
  const barAreaWidth = 300 - labelWidth - 40;
  const topPadding = 10;

  const bars = categories.map((label, i) => ({
    label,
    value: frequencies[i],
    width: (frequencies[i] / maxVal) * barAreaWidth,
    y: topPadding + i * (barHeight + gap),
    index: i,
  }));

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.cyanBlue, fontFamily: FONT_FAMILY }}
      >
        Event Frequency
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Bars */}
        {bars.map((bar) => (
          <React.Fragment key={`bar-group-${bar.index}`}>
            {/* Label */}
            <text
              x={labelWidth - 5}
              y={bar.y + barHeight / 2 + 3}
              textAnchor="end"
              fill={COLOR_TOKENS.textPrimary}
              fontSize="9"
              fontFamily={FONT_FAMILY}
            >
              {bar.label}
            </text>
            {/* Background bar */}
            <rect
              x={labelWidth}
              y={bar.y}
              width={barAreaWidth}
              height={barHeight}
              fill={COLOR_TOKENS.mutedGray}
              opacity={0.15}
              rx="2"
            />
            {/* Value bar */}
            <rect
              x={labelWidth}
              y={bar.y}
              width={Math.max(bar.width, 2)}
              height={barHeight}
              fill={COLOR_TOKENS.cyanBlue}
              opacity={0.7}
              rx="2"
            />
            {/* Value text */}
            <text
              x={labelWidth + bar.width + 5}
              y={bar.y + barHeight / 2 + 3}
              fill={COLOR_TOKENS.textPrimary}
              fontSize="9"
              fontFamily={FONT_FAMILY}
            >
              {bar.value}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 5: EventImpactTimeline (8-node horizontal)
// ============================================================

function EventImpactTimeline({
  nodes,
}: {
  nodes: { label: string; impact: number; x: number }[];
}) {
  const padding = { left: 25, right: 25 };
  const lineY = 120;
  const usableWidth = 300 - padding.left - padding.right;
  const spacing = usableWidth / Math.max(nodes.length - 1, 1);

  const nodePositions = nodes.map((node, i) => ({
    x: padding.left + i * spacing,
    y: lineY,
    label: node.label,
    impact: node.impact,
    index: i,
  }));

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.electricOrange, fontFamily: FONT_FAMILY }}
      >
        Career-Defining Moments
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Base line */}
        <line
          x1={padding.left}
          y1={lineY}
          x2={300 - padding.right}
          y2={lineY}
          stroke={COLOR_TOKENS.mutedGray}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={0.4}
        />
        {/* Connection line segments */}
        {nodePositions.slice(1).map((pos, i) => (
          <line
            key={`conn-${i}`}
            x1={nodePositions[i].x}
            y1={lineY}
            x2={pos.x}
            y2={lineY}
            stroke={COLOR_TOKENS.electricOrange}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.3}
          />
        ))}
        {/* Nodes */}
        {nodePositions.map((pos) => {
          const nodeRadius = Math.max(4, (pos.impact / 100) * 10);
          return (
            <React.Fragment key={`node-${pos.index}`}>
              {/* Vertical line to label */}
              <line
                x1={pos.x}
                y1={lineY}
                x2={pos.x}
                y2={lineY - 35}
                stroke={COLOR_TOKENS.electricOrange}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={0.4}
              />
              {/* Impact circle */}
              <circle
                cx={pos.x}
                cy={lineY}
                r={nodeRadius}
                fill={COLOR_TOKENS.electricOrange}
                stroke={COLOR_TOKENS.bgCard}
                strokeWidth="1.5"
                opacity={0.8}
              />
              {/* Impact score inside node */}
              <text
                x={pos.x}
                y={lineY + 3}
                textAnchor="middle"
                fill={COLOR_TOKENS.bgDark}
                fontSize="7"
                fontWeight="bold"
                fontFamily={FONT_FAMILY}
              >
                {pos.impact}
              </text>
              {/* Label above */}
              <text
                x={pos.x}
                y={lineY - 40}
                textAnchor="middle"
                fill={COLOR_TOKENS.textPrimary}
                fontSize="7"
                fontFamily={FONT_FAMILY}
              >
                {pos.label}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 6: CareerSatisfactionRing (circular ring 0-100)
// ============================================================

function CareerSatisfactionRing({ score }: { score: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 65;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progressLength = (score / 100) * circumference;
  const gapLength = circumference - progressLength;

  // Dash offsets for rotation from top (-90deg)
  const dashOffset = circumference * 0.25;

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.neonLime, fontFamily: FONT_FAMILY }}
      >
        Career Satisfaction
      </h3>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-xs">
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={COLOR_TOKENS.mutedGray}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />
          {/* Progress ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={COLOR_TOKENS.neonLime}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLength} ${gapLength}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* Center score */}
          <text
            x={cx}
            y={cy - 5}
            textAnchor="middle"
            fill={COLOR_TOKENS.neonLime}
            fontSize="32"
            fontWeight="bold"
            fontFamily={FONT_FAMILY}
          >
            {score}
          </text>
          <text
            x={cx}
            y={cy + 15}
            textAnchor="middle"
            fill={COLOR_TOKENS.textMuted}
            fontSize="9"
            fontFamily={FONT_FAMILY}
          >
            OUT OF 100
          </text>
          {/* Decorative inner ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - 22}
            fill="none"
            stroke={COLOR_TOKENS.mutedGray}
            strokeWidth="0.5"
            opacity={0.2}
          />
        </svg>
      </div>
    </section>
  );
}

// ============================================================
// SVG Component 7: TransferHistoryLine (8-point line chart)
// ============================================================

function TransferHistoryLine({ points }: { points: number[] }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = 300 - padding.left - padding.right;
  const chartH = 200 - padding.top - padding.bottom;
  const maxVal = Math.max(...points, 1);
  const moveLabels = ['Start', 'Move 1', 'Move 2', 'Move 3', 'Move 4', 'Move 5', 'Move 6', 'Move 7'];

  const dataPoints = points.map((val, i) => ({
    x: padding.left + (i / Math.max(points.length - 1, 1)) * chartW,
    y: padding.top + chartH - (val / maxVal) * chartH,
    value: val,
    index: i,
  }));

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Area under line
  const areaPath =
    linePath +
    ` L ${dataPoints[dataPoints.length - 1].x} ${padding.top + chartH} L ${dataPoints[0].x} ${padding.top + chartH} Z`;

  const yLabels = [0, Math.round(maxVal * 0.5), maxVal];

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.electricOrange, fontFamily: FONT_FAMILY }}
      >
        Transfer Valuation
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Grid lines */}
        {yLabels.map((label, i) => {
          const y = padding.top + chartH - (label / maxVal) * chartH;
          return (
            <React.Fragment key={`tgrid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={300 - padding.right}
                y2={y}
                stroke={COLOR_TOKENS.mutedGray}
                strokeWidth="0.5"
                opacity={0.3}
              />
              <text
                x={padding.left - 5}
                y={y + 3}
                textAnchor="end"
                fill={COLOR_TOKENS.textMuted}
                fontSize="8"
                fontFamily={FONT_FAMILY}
              >
                {label}
              </text>
            </React.Fragment>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill={COLOR_TOKENS.electricOrange} opacity={0.1} />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={COLOR_TOKENS.electricOrange}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        {/* Data points */}
        {dataPoints.map((p) => (
          <circle
            key={`tdp-${p.index}`}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={COLOR_TOKENS.electricOrange}
            stroke={COLOR_TOKENS.bgCard}
            strokeWidth="1"
          />
        ))}
        {/* X-axis labels */}
        {dataPoints.map((p) => (
          <text
            key={`txlabel-${p.index}`}
            x={p.x}
            y={200 - 5}
            textAnchor="middle"
            fill={COLOR_TOKENS.textMuted}
            fontSize="7"
            fontFamily={FONT_FAMILY}
          >
            {moveLabels[p.index]}
          </text>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 8: ClubLoyaltyDonut (4-segment donut via reduce)
// ============================================================

function ClubLoyaltyDonut({ segments }: { segments: number[] }) {
  const cx = 150;
  const cy = 100;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const gapBetweenSegments = 4;

  const labels = ['Short Stay', 'Medium', 'Long', 'One Club'];
  const segmentColors = [
    COLOR_TOKENS.cyanBlue,
    COLOR_TOKENS.electricOrange,
    COLOR_TOKENS.neonLime,
    COLOR_TOKENS.mutedGray,
  ];

  // Compute segment arcs using reduce
  const total = segments.reduce((sum, val) => sum + val, 0);
  const computedSegments = segments.reduce<
    Array<{ value: number; length: number; offset: number; label: string; color: string }>
  >((acc, val, i) => {
    const fraction = total > 0 ? val / total : 0.25;
    const length = Math.max(0, fraction * circumference - gapBetweenSegments);
    const offset = acc.reduce((sum, s) => sum + (total > 0 ? (s.value / total) * circumference : 0), 0);
    return [
      ...acc,
      {
        value: val,
        length,
        offset,
        label: labels[i],
        color: segmentColors[i],
      },
    ];
  }, []);

  // Legend items
  const legendItems = computedSegments.map((seg, i) => ({
    label: seg.label,
    value: segments[i],
    color: seg.color,
    index: i,
  }));

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.cyanBlue, fontFamily: FONT_FAMILY }}
      >
        Club Loyalty
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Donut segments */}
        {computedSegments.map((seg, i) => (
          <circle
            key={`donut-seg-${i}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            opacity={0.75}
          />
        ))}
        {/* Center circle background */}
        <circle cx={cx} cy={cy} r={radius - strokeWidth} fill={COLOR_TOKENS.bgCard} opacity={0.8} />
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          fill={COLOR_TOKENS.textPrimary}
          fontSize="11"
          fontWeight="bold"
          fontFamily={FONT_FAMILY}
        >
          LOYALTY
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill={COLOR_TOKENS.textMuted}
          fontSize="8"
          fontFamily={FONT_FAMILY}
        >
          DISTRIBUTION
        </text>
        {/* Legend */}
        {legendItems.map((item, i) => (
          <React.Fragment key={`legend-${i}`}>
            <rect
              x={15}
              y={160 + i * 10}
              width="8"
              height="8"
              fill={item.color}
              opacity={0.8}
              rx="1"
            />
            <text
              x={28}
              y={167 + i * 10}
              fill={COLOR_TOKENS.textPrimary}
              fontSize="8"
              fontFamily={FONT_FAMILY}
            >
              {item.label}: {item.value}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 9: TransferSuccessRadar (5-axis radar)
// ============================================================

function TransferSuccessRadar({ axes }: { axes: number[] }) {
  const cx = 150;
  const cy = 105;
  const maxRadius = 65;
  const labels = ['Adapt', 'Perform', 'Morale', 'Fan Rx', 'Win %'];
  const totalAxes = axes.length;
  const angleStep = (2 * Math.PI) / totalAxes;
  const startOffset = -Math.PI / 2;

  const getPoint = (index: number, radius: number) => ({
    x: cx + radius * Math.cos(startOffset + index * angleStep),
    y: cy + radius * Math.sin(startOffset + index * angleStep),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPolygonPath = axes
    .map((val, i) => {
      const r = (val / 100) * maxRadius;
      const pt = getPoint(i, r);
      return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
    })
    .join(' ') + ' Z';

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.neonLime, fontFamily: FONT_FAMILY }}
      >
        Post-Transfer Success
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Grid rings */}
        {gridLevels.map((level, gi) => {
          const ringPath = axes
            .map((_, i) => {
              const pt = getPoint(i, maxRadius * level);
              return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
            })
            .join(' ') + ' Z';
          return (
            <path
              key={`ts-ring-${gi}`}
              d={ringPath}
              fill="none"
              stroke={COLOR_TOKENS.mutedGray}
              strokeWidth="0.5"
              opacity={0.25}
            />
          );
        })}
        {/* Axis lines */}
        {axes.map((_, i) => {
          const end = getPoint(i, maxRadius);
          return (
            <line
              key={`ts-axis-${i}`}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={COLOR_TOKENS.mutedGray}
              strokeWidth="0.5"
              opacity={0.35}
            />
          );
        })}
        {/* Data polygon */}
        <path
          d={dataPolygonPath}
          fill={COLOR_TOKENS.neonLime}
          opacity={0.12}
          stroke={COLOR_TOKENS.neonLime}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Data vertex points */}
        {axes.map((val, i) => {
          const r = (val / 100) * maxRadius;
          const pt = getPoint(i, r);
          return (
            <circle
              key={`ts-vertex-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill={COLOR_TOKENS.neonLime}
              opacity={0.85}
            />
          );
        })}
        {/* Labels */}
        {labels.map((label, i) => {
          const pt = getPoint(i, maxRadius + 16);
          return (
            <text
              key={`ts-label-${i}`}
              x={pt.x}
              y={pt.y + 3}
              textAnchor="middle"
              fill={COLOR_TOKENS.textPrimary}
              fontSize="8"
              fontFamily={FONT_FAMILY}
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
// SVG Component 10: SeasonComparisonBars (5 horizontal bars)
// ============================================================

function SeasonComparisonBars({
  current,
  previous,
}: {
  current: number[];
  previous: number[];
}) {
  const metrics = ['Goals', 'Assists', 'Rating', 'Minutes', 'Trophies'];
  const maxVal = Math.max(...current, ...previous, 1);
  const barHeight = 14;
  const gap = 12;
  const labelWidth = 55;
  const barAreaWidth = 190;
  const topPadding = 15;

  const bars = metrics.map((label, i) => ({
    label,
    currentWidth: (current[i] / maxVal) * barAreaWidth,
    previousWidth: (previous[i] / maxVal) * barAreaWidth,
    y: topPadding + i * (barHeight * 2 + gap),
    index: i,
  }));

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.electricOrange, fontFamily: FONT_FAMILY }}
      >
        Season vs Previous
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Legend */}
        <rect x={labelWidth} y={3} width="8" height="8" fill={COLOR_TOKENS.electricOrange} opacity={0.7} rx="1" />
        <text x={labelWidth + 12} y={10} fill={COLOR_TOKENS.textPrimary} fontSize="8" fontFamily={FONT_FAMILY}>
          Current
        </text>
        <rect
          x={labelWidth + 65}
          y={3}
          width="8"
          height="8"
          fill={COLOR_TOKENS.mutedGray}
          opacity={0.5}
          rx="1"
        />
        <text
          x={labelWidth + 77}
          y={10}
          fill={COLOR_TOKENS.textMuted}
          fontSize="8"
          fontFamily={FONT_FAMILY}
        >
          Previous
        </text>
        {/* Bar groups */}
        {bars.map((bar) => (
          <React.Fragment key={`comp-group-${bar.index}`}>
            {/* Label */}
            <text
              x={labelWidth - 5}
              y={bar.y + barHeight + 6}
              textAnchor="end"
              fill={COLOR_TOKENS.textPrimary}
              fontSize="9"
              fontFamily={FONT_FAMILY}
            >
              {bar.label}
            </text>
            {/* Previous bar (background) */}
            <rect
              x={labelWidth}
              y={bar.y}
              width={Math.max(bar.previousWidth, 1)}
              height={barHeight}
              fill={COLOR_TOKENS.mutedGray}
              opacity={0.25}
              rx="2"
            />
            {/* Current bar (foreground) */}
            <rect
              x={labelWidth}
              y={bar.y + barHeight + 2}
              width={Math.max(bar.currentWidth, 1)}
              height={barHeight}
              fill={COLOR_TOKENS.electricOrange}
              opacity={0.7}
              rx="2"
            />
            {/* Values */}
            <text
              x={labelWidth + Math.max(bar.previousWidth, 1) + 4}
              y={bar.y + barHeight - 2}
              fill={COLOR_TOKENS.textMuted}
              fontSize="7"
              fontFamily={FONT_FAMILY}
            >
              {previous[bar.index]}
            </text>
            <text
              x={labelWidth + Math.max(bar.currentWidth, 1) + 4}
              y={bar.y + barHeight * 2}
              fill={COLOR_TOKENS.textPrimary}
              fontSize="7"
              fontFamily={FONT_FAMILY}
            >
              {current[bar.index]}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 11: HighlightReelTimeline (8-node horizontal)
// ============================================================

function HighlightReelTimeline({
  nodes,
}: {
  nodes: { label: string; impact: number; x: number }[];
}) {
  const padding = { left: 20, right: 20 };
  const lineY = 110;
  const usableWidth = 300 - padding.left - padding.right;
  const spacing = usableWidth / Math.max(nodes.length - 1, 1);

  const nodePositions = nodes.map((node, i) => ({
    x: padding.left + i * spacing,
    y: lineY,
    label: node.label,
    impact: node.impact,
    index: i,
  }));

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.cyanBlue, fontFamily: FONT_FAMILY }}
      >
        Season Highlights
      </h3>
      <svg viewBox="0 0 300 200" className="w-full max-w-xs">
        {/* Base line */}
        <line
          x1={padding.left}
          y1={lineY}
          x2={300 - padding.right}
          y2={lineY}
          stroke={COLOR_TOKENS.mutedGray}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={0.35}
        />
        {/* Segments between nodes */}
        {nodePositions.slice(1).map((pos, i) => (
          <line
            key={`hl-conn-${i}`}
            x1={nodePositions[i].x}
            y1={lineY}
            x2={pos.x}
            y2={lineY}
            stroke={COLOR_TOKENS.cyanBlue}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.25}
          />
        ))}
        {/* Nodes */}
        {nodePositions.map((pos) => {
          const nodeRadius = Math.max(3.5, (pos.impact / 100) * 9);
          // Alternate label position (above/below)
          const isAbove = pos.index % 2 === 0;
          const labelY = isAbove ? lineY - 40 : lineY + 45;
          const connectorY = isAbove ? lineY - 25 : lineY + 30;

          return (
            <React.Fragment key={`hl-node-${pos.index}`}>
              {/* Connector line */}
              <line
                x1={pos.x}
                y1={lineY}
                x2={pos.x}
                y2={connectorY}
                stroke={COLOR_TOKENS.cyanBlue}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={0.35}
              />
              {/* Impact circle */}
              <circle
                cx={pos.x}
                cy={lineY}
                r={nodeRadius}
                fill={COLOR_TOKENS.cyanBlue}
                stroke={COLOR_TOKENS.bgCard}
                strokeWidth="1.5"
                opacity={0.75}
              />
              {/* Impact value */}
              <text
                x={pos.x}
                y={lineY + 3}
                textAnchor="middle"
                fill={COLOR_TOKENS.bgDark}
                fontSize="6"
                fontWeight="bold"
                fontFamily={FONT_FAMILY}
              >
                {pos.impact}
              </text>
              {/* Label */}
              <text
                x={pos.x}
                y={labelY}
                textAnchor="middle"
                fill={COLOR_TOKENS.textPrimary}
                fontSize="7"
                fontFamily={FONT_FAMILY}
              >
                {pos.label}
              </text>
            </React.Fragment>
          );
        })}
        {/* Title decoration */}
        <line
          x1={padding.left}
          y1={10}
          x2={100}
          y2={10}
          stroke={COLOR_TOKENS.cyanBlue}
          strokeWidth="1"
          strokeLinecap="round"
          opacity={0.3}
        />
        <text
          x={padding.left}
          y={22}
          fill={COLOR_TOKENS.textMuted}
          fontSize="7"
          fontFamily={FONT_FAMILY}
        >
          HIGHLIGHT REEL
        </text>
      </svg>
    </section>
  );
}

// ============================================================
// SVG Component 12: SeasonGradeRing (circular ring 0-100)
// ============================================================

function SeasonGradeRing({ grade }: { grade: number }) {
  const cx = 150;
  const cy = 100;
  const radius = 65;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const progressLength = (grade / 100) * circumference;
  const gapLength = circumference - progressLength;
  const dashOffset = circumference * 0.25;

  // Determine grade letter
  const gradeLetter =
    grade >= 90 ? 'S' : grade >= 80 ? 'A' : grade >= 70 ? 'B' : grade >= 60 ? 'C' : grade >= 40 ? 'D' : 'F';
  const gradeColor =
    grade >= 80
      ? COLOR_TOKENS.neonLime
      : grade >= 60
        ? COLOR_TOKENS.cyanBlue
        : grade >= 40
          ? COLOR_TOKENS.electricOrange
          : COLOR_TOKENS.mutedGray;

  return (
    <section className="space-y-2">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: COLOR_TOKENS.neonLime, fontFamily: FONT_FAMILY }}
      >
        Season Grade
      </h3>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-xs">
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={COLOR_TOKENS.mutedGray}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />
          {/* Progress ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={COLOR_TOKENS.neonLime}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLength} ${gapLength}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            opacity={0.8}
          />
          {/* Decorative tick marks around the ring */}
          {[0, 25, 50, 75].map((tick) => {
            const angle = (tick / 100) * 2 * Math.PI - Math.PI / 2;
            const innerR = radius + 10;
            const outerR = radius + 16;
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy + innerR * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy + outerR * Math.sin(angle);
            return (
              <line
                key={`grade-tick-${tick}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLOR_TOKENS.mutedGray}
                strokeWidth="1"
                strokeLinecap="round"
                opacity={0.3}
              />
            );
          })}
          {/* Grade letter */}
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            fill={gradeColor}
            fontSize="42"
            fontWeight="bold"
            fontFamily={FONT_FAMILY}
          >
            {gradeLetter}
          </text>
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            fill={COLOR_TOKENS.textMuted}
            fontSize="9"
            fontFamily={FONT_FAMILY}
          >
            {grade}/100 PTS
          </text>
        </svg>
      </div>
    </section>
  );
}

// ============================================================
// Tab Content Renderer: Career Milestones
// ============================================================

function CareerMilestonesTab({
  data,
}: {
  data: ReturnType<typeof deriveCareerData>;
}) {
  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏆</span>
        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: COLOR_TOKENS.textPrimary, fontFamily: FONT_FAMILY }}
          >
            Career Milestones
          </h2>
          <p className="text-xs" style={{ color: COLOR_TOKENS.textMuted, fontFamily: FONT_FAMILY }}>
            {data.playerName} — {data.clubName}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MilestoneProgressGauge progress={data.milestoneProgress} />
        <CareerTrajectoryArea points={data.trajectoryPoints} />
        <MilestoneCategoryRadar axes={data.radarAxes} />
      </div>
    </div>
  );
}

// ============================================================
// Tab Content Renderer: Life Events
// ============================================================

function LifeEventsTab({
  data,
}: {
  data: ReturnType<typeof deriveCareerData>;
}) {
  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🌟</span>
        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: COLOR_TOKENS.textPrimary, fontFamily: FONT_FAMILY }}
          >
            Life Events
          </h2>
          <p className="text-xs" style={{ color: COLOR_TOKENS.textMuted, fontFamily: FONT_FAMILY }}>
            Season {data.currentSeason}, Week {data.currentWeek}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LifeEventFrequencyBars frequencies={data.lifeEventFrequencies} />
        <EventImpactTimeline nodes={data.timelineNodes} />
        <CareerSatisfactionRing score={data.satisfactionScore} />
      </div>
    </div>
  );
}

// ============================================================
// Tab Content Renderer: Transfer Sagas
// ============================================================

function TransferSagasTab({
  data,
}: {
  data: ReturnType<typeof deriveCareerData>;
}) {
  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔄</span>
        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: COLOR_TOKENS.textPrimary, fontFamily: FONT_FAMILY }}
          >
            Transfer Sagas
          </h2>
          <p className="text-xs" style={{ color: COLOR_TOKENS.textMuted, fontFamily: FONT_FAMILY }}>
            Career movement analysis
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TransferHistoryLine points={data.transferLinePoints} />
        <ClubLoyaltyDonut segments={data.loyaltySegments} />
        <TransferSuccessRadar axes={data.transferRadarAxes} />
      </div>
    </div>
  );
}

// ============================================================
// Tab Content Renderer: Season Highlights
// ============================================================

function SeasonHighlightsTab({
  data,
}: {
  data: ReturnType<typeof deriveCareerData>;
}) {
  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✨</span>
        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: COLOR_TOKENS.textPrimary, fontFamily: FONT_FAMILY }}
          >
            Season Highlights
          </h2>
          <p className="text-xs" style={{ color: COLOR_TOKENS.textMuted, fontFamily: FONT_FAMILY }}>
            Season {data.currentSeason} performance review
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SeasonComparisonBars
          current={data.seasonComparisonCurrent}
          previous={data.seasonComparisonPrevious}
        />
        <HighlightReelTimeline nodes={data.highlightNodes} />
        <SeasonGradeRing grade={data.seasonGrade} />
      </div>
    </div>
  );
}

// ============================================================
// Summary Stats Bar
// ============================================================

function SummaryBar({
  data,
}: {
  data: ReturnType<typeof deriveCareerData>;
}) {
  const stats = [
    { label: 'Overall', value: `${data.milestoneProgress}%`, color: COLOR_TOKENS.neonLime },
    { label: 'Satisfaction', value: `${data.satisfactionScore}`, color: COLOR_TOKENS.cyanBlue },
    { label: 'Season Grade', value: `${data.seasonGrade}`, color: COLOR_TOKENS.electricOrange },
    { label: 'Season', value: `${data.currentSeason}`, color: COLOR_TOKENS.textPrimary },
  ];

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 border-b"
      style={{
        borderColor: `${COLOR_TOKENS.mutedGray}33`,
        fontFamily: FONT_FAMILY,
      }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: COLOR_TOKENS.textMuted }}>
            {stat.label}
          </span>
          <span className="text-xs font-bold" style={{ color: stat.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main CareerEventsEnhanced Component
// ============================================================

export default function CareerEventsEnhanced() {
  const gameState = useGameStore((state) => state.gameState);
  const [activeTab, setActiveTab] = useState<TabId>('career_milestones');

  const careerData = deriveCareerData(gameState);

  // Determine active tab index for the tab UI
  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div
      className="w-full"
      style={{
        fontFamily: FONT_FAMILY,
        backgroundColor: COLOR_TOKENS.bgDark,
        color: COLOR_TOKENS.textPrimary,
      }}
    >
      {/* Component Header */}
      <div className="px-4 pt-4 pb-2">
        <h2
          className="text-base font-bold tracking-tight"
          style={{ color: COLOR_TOKENS.textPrimary, fontFamily: FONT_FAMILY }}
        >
          Career Events Enhanced
        </h2>
        <p className="text-xs mt-0.5" style={{ color: COLOR_TOKENS.textMuted }}>
          Web3-powered career analytics
        </p>
      </div>

      {/* Summary Bar */}
      <SummaryBar data={careerData} />

      {/* Tab Navigation */}
      <div
        className="flex gap-1 p-2 m-3 mt-2"
        style={{
          backgroundColor: COLOR_TOKENS.bgCard,
          borderRadius: '6px',
          border: `1px solid ${COLOR_TOKENS.mutedGray}33`,
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-[11px] font-medium"
            style={{
              backgroundColor: i === activeTabIndex ? `${COLOR_TOKENS.electricOrange}22` : 'transparent',
              color: i === activeTabIndex ? COLOR_TOKENS.electricOrange : COLOR_TOKENS.textMuted,
              borderRadius: '4px',
              opacity: 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="mx-3 mb-4 p-3"
        style={{
          backgroundColor: COLOR_TOKENS.bgCard,
          borderRadius: '8px',
          border: `1px solid ${COLOR_TOKENS.mutedGray}33`,
          opacity: 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {activeTab === 'career_milestones' && <CareerMilestonesTab data={careerData} />}
        {activeTab === 'life_events' && <LifeEventsTab data={careerData} />}
        {activeTab === 'transfer_sagas' && <TransferSagasTab data={careerData} />}
        {activeTab === 'season_highlights' && <SeasonHighlightsTab data={careerData} />}
      </div>

      {/* Footer branding */}
      <div
        className="text-center py-3 border-t"
        style={{ borderColor: `${COLOR_TOKENS.mutedGray}22` }}
      >
        <span className="text-[9px] uppercase tracking-widest" style={{ color: COLOR_TOKENS.mutedGray }}>
          Career Events Enhanced // Web3 Analytics
        </span>
      </div>
    </div>
  );
}
