'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Award,
  ArrowLeft,
  Flame,
  Zap,
  Clock,
  Shield,
  Medal,
  Crosshair,
  Calendar,
  BarChart3,
  Users,
  Gem,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Animation Constants
// ═══════════════════════════════════════════════════════════════
const D = 0.04;
const A = { duration: 0.18, ease: 'easeOut' as const };

// ═══════════════════════════════════════════════════════════════
// Legend reference data
// ═══════════════════════════════════════════════════════════════
interface LegendRef {
  name: string;
  goals: number;
  assists: number;
  caps: number;
  trophies: number;
  seasons: number;
}

const LEGEND_DATA: Record<string, LegendRef> = {
  Pele: { name: 'Pelé', goals: 762, assists: 369, caps: 92, trophies: 26, seasons: 21 },
  Maradona: { name: 'Maradona', goals: 353, assists: 188, caps: 91, trophies: 11, seasons: 18 },
  Messi: { name: 'Messi', goals: 821, assists: 374, caps: 187, trophies: 44, seasons: 19 },
  Ronaldo: { name: 'Ronaldo', goals: 873, assists: 252, caps: 206, trophies: 34, seasons: 22 },
  Cruyff: { name: 'Cruyff', goals: 402, assists: 168, caps: 48, trophies: 16, seasons: 16 },
};

const HOF_INDUCTEE_AVG: Record<string, number> = {
  goals: 450,
  assists: 200,
  trophies: 15,
  longevity: 16,
  impact: 78,
};

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
type TabId = 'progress' | 'comparison' | 'milestones' | 'hof';

interface CriterionData {
  label: string;
  icon: React.JSX.Element;
  value: number;
  max: number;
  color: string;
}

interface MilestoneItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  category: string;
  progress: number;
}

interface DonutSegment {
  category: string;
  count: number;
  pct: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

// ═══════════════════════════════════════════════════════════════
// SVG Helper: build polygon points string (extracted, no .map().join() in JSX)
// ═══════════════════════════════════════════════════════════════
function buildHexPoints(
  cx: number,
  cy: number,
  r: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildHexDataPoints(
  cx: number,
  cy: number,
  axes: number[],
  maxR: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < axes.length; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const r = (axes[i] / 100) * maxR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildPentagonPoints(
  cx: number,
  cy: number,
  r: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildPentagonDataPoints(
  cx: number,
  cy: number,
  axes: number[],
  maxR: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < axes.length; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const r = (axes[i] / 100) * maxR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function buildDonutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = { x: cx + outerR * Math.cos(startAngle), y: cy + outerR * Math.sin(startAngle) };
  const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
  const innerEnd = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
  const innerStart = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════
export default function LegendStatus() {
  const gameState = useGameStore((s) => s.gameState);
  const setScreen = useGameStore((s) => s.setScreen);

  const [activeTab, setActiveTab] = useState<TabId>('progress');

  // ── All hooks above conditional return ──
  if (!gameState) return <></>;

  const { player, currentSeason, seasons, achievements, internationalCareer } = gameState;
  const cs = player.careerStats;
  const playerName = player.name ?? 'Unknown';
  const playerAge = player.age ?? 16;
  const playerOvr = player.overall ?? 50;
  const totalGoals = cs.totalGoals ?? 0;
  const totalAssists = cs.totalAssists ?? 0;
  const totalApps = cs.totalAppearances ?? 0;
  const trophyCount = (cs.trophies ?? []).length;
  const seasonsPlayed = cs.seasonsPlayed ?? currentSeason;
  const caps = internationalCareer?.caps ?? 0;
  const unlockedAch = achievements.filter((a) => a.unlocked).length;

  // ── Computed: Legend Score (0-100) ──
  const legendScoreRaw = Math.min(
    100,
    (totalGoals / 500) * 25 +
    (totalAssists / 250) * 15 +
    (trophyCount / 30) * 20 +
    (seasonsPlayed / 20) * 15 +
    (caps / 100) * 10 +
    (unlockedAch / 50) * 10 +
    (playerOvr / 99) * 5,
  );
  const legendScore = Math.round(legendScoreRaw * 10) / 10;

  // ── Computed: Legend Tier ──
  let legendTier = 'Unknown';
  let legendTierColor = '#484f58';
  if (legendScore >= 90) { legendTier = 'Immortal'; legendTierColor = '#ffd700'; }
  else if (legendScore >= 75) { legendTier = 'Legendary'; legendTierColor = '#a78bfa'; }
  else if (legendScore >= 60) { legendTier = 'Iconic'; legendTierColor = '#22c55e'; }
  else if (legendScore >= 40) { legendTier = 'Distinguished'; legendTierColor = '#3b82f6'; }
  else if (legendScore >= 20) { legendTier = 'Promising'; legendTierColor = '#f59e0b'; }
  else { legendTier = 'Emerging'; legendTierColor = '#8b949e'; }

  // ── Tab definitions ──
  const tabs: { id: TabId; label: string; icon: React.JSX.Element }[] = [
    { id: 'progress', label: 'Legend Progress', icon: <Crown className="h-3.5 w-3.5" /> },
    { id: 'comparison', label: 'vs Legends', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'milestones', label: 'Milestones', icon: <Target className="h-3.5 w-3.5" /> },
    { id: 'hof', label: 'Hall of Fame', icon: <Award className="h-3.5 w-3.5" /> },
  ];

  // ═══════════════════════════════════════════════════════════
  // TAB 1: Legend Progress
  // ═══════════════════════════════════════════════════════════
  const criteriaCards: CriterionData[] = [
    { label: 'Goals', icon: <Target className="h-4 w-4" />, value: Math.min(100, (totalGoals / 500) * 100), max: 500, color: '#22c55e' },
    { label: 'Trophies', icon: <Trophy className="h-4 w-4" />, value: Math.min(100, (trophyCount / 30) * 100), max: 30, color: '#f59e0b' },
    { label: 'Records', icon: <Medal className="h-4 w-4" />, value: Math.min(100, (unlockedAch / 50) * 100), max: 50, color: '#a78bfa' },
    { label: 'Impact', icon: <Zap className="h-4 w-4" />, value: Math.min(100, (playerOvr / 99) * 100), max: 99, color: '#3b82f6' },
    { label: 'Legacy', icon: <Crown className="h-4 w-4" />, value: Math.min(100, (caps / 100) * 100), max: 100, color: '#ec4899' },
    { label: 'Longevity', icon: <Clock className="h-4 w-4" />, value: Math.min(100, (seasonsPlayed / 20) * 100), max: 20, color: '#06b6d4' },
  ];

  const radarAxes = criteriaCards.map((c) => Math.round(c.value));

  function renderLegendProgressTab(): React.JSX.Element {
    // SVG 1: Legend Score Ring
    const ringCx = 120;
    const ringCy = 120;
    const ringR = 90;
    const ringCirc = 2 * Math.PI * ringR;
    const ringOffset = ringCirc - (legendScore / 100) * ringCirc;
    const scoreColor = legendScore >= 75 ? '#ffd700' : legendScore >= 50 ? '#22c55e' : legendScore >= 25 ? '#3b82f6' : '#8b949e';

    // SVG 2: Hex Radar
    const hexCx = 120;
    const hexCy = 120;
    const hexMaxR = 85;
    const hexGrid1 = buildHexPoints(hexCx, hexCy, hexMaxR * 0.33);
    const hexGrid2 = buildHexPoints(hexCx, hexCy, hexMaxR * 0.66);
    const hexGrid3 = buildHexPoints(hexCx, hexCy, hexMaxR);
    const hexData = buildHexDataPoints(hexCx, hexCy, radarAxes, hexMaxR);
    const hexLabels = ['Goals', 'Trophies', 'Records', 'Impact', 'Legacy', 'Longevity'];

    // SVG 3: Tier Gauge (semi-circular)
    const gaugeCx = 120;
    const gaugeCy = 130;
    const gaugeR = 80;
    const gaugeStartAngle = Math.PI;
    const gaugeEndAngle = 2 * Math.PI;
    const gaugeScoreAngle = gaugeStartAngle + (legendScore / 100) * Math.PI;
    const gaugeBgPath = buildArcPath(gaugeCx, gaugeCy, gaugeR, gaugeStartAngle, gaugeEndAngle);
    const gaugeFillPath = legendScore > 0 ? buildArcPath(gaugeCx, gaugeCy, gaugeR, gaugeStartAngle, gaugeScoreAngle) : '';

    // Tick marks on gauge
    const gaugeTicks: { x: number; y: number; label: string }[] = [0, 25, 50, 75, 100].map((v) => {
      const angle = gaugeStartAngle + (v / 100) * Math.PI;
      return {
        x: gaugeCx + (gaugeR + 14) * Math.cos(angle),
        y: gaugeCy + (gaugeR + 14) * Math.sin(angle),
        label: String(v),
      };
    });

    return (
      <div className="space-y-4">
        {/* Legend Score Ring */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Crown className="h-4 w-4 text-emerald-400" />
                Legend Score
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-4">
                <svg width="140" height="140" viewBox="0 0 240 240">
                  <circle cx={ringCx} cy={ringCy} r={ringR} fill="none" stroke="#21262d" strokeWidth="12" />
                  <circle
                    cx={ringCx}
                    cy={ringCy}
                    r={ringR}
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="12"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <text x={ringCx} y={ringCy - 8} textAnchor="middle"  fill="#c9d1d9" fontSize="36" fontWeight="bold">
                    {legendScore.toFixed(0)}
                  </text>
                  <text x={ringCx} y={ringCy + 16} textAnchor="middle"  fill="#8b949e" fontSize="12">
                    /100
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  <Badge className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: legendTierColor + '20', color: legendTierColor, borderColor: legendTierColor + '40', border: '1px solid' }}>
                    {legendTier}
                  </Badge>
                  <p className="text-xs text-[#8b949e]">Your progress toward football immortality</p>
                  <div className="space-y-1 pt-1">
                    {criteriaCards.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8b949e] w-16">{c.label}</span>
                        <div className="flex-1 h-1 bg-[#21262d] rounded-sm overflow-hidden">
                          <div className="h-full rounded-sm" style={{ width: `${Math.min(100, c.value)}%`, backgroundColor: c.color }} />
                        </div>
                        <span className="text-[10px] tabular-nums" style={{ color: c.color }}>{Math.round(c.value)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Criteria Cards Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
          <div className="grid grid-cols-2 gap-2">
            {criteriaCards.map((c, i) => (
              <motion.div
                key={c.label}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...A, delay: D + i * D }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: c.color }}>{c.icon}</span>
                  <span className="text-xs font-bold text-[#c9d1d9]">{c.label}</span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm" style={{ width: `${Math.min(100, c.value)}%`, backgroundColor: c.color }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#484f58]">0</span>
                  <span className="text-[10px] text-[#8b949e] tabular-nums">
                    {c.label === 'Goals' ? totalGoals : c.label === 'Trophies' ? trophyCount : c.label === 'Records' ? unlockedAch : c.label === 'Impact' ? playerOvr : c.label === 'Legacy' ? caps : seasonsPlayed}
                    /{c.max}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Criteria Progress Hex Radar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-emerald-400" />
                Criteria Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox="0 0 240 240" className="max-w-[280px] mx-auto">
                {/* Grid layers */}
                <polygon points={hexGrid1} fill="none" stroke="#21262d" strokeWidth="0.8" />
                <polygon points={hexGrid2} fill="none" stroke="#21262d" strokeWidth="0.8" />
                <polygon points={hexGrid3} fill="none" stroke="#30363d" strokeWidth="1" />
                {/* Axis lines */}
                {radarAxes.map((_, i) => {
                  const angle = (Math.PI / 3) * i - Math.PI / 2;
                  const x2 = hexCx + hexMaxR * Math.cos(angle);
                  const y2 = hexCy + hexMaxR * Math.sin(angle);
                  return <line key={i} x1={hexCx} y1={hexCy} x2={x2} y2={y2} stroke="#21262d" strokeWidth="0.5" />;
                })}
                {/* Data polygon */}
                <polygon
                  points={hexData}
                  fill="rgba(34,197,94,0.15)"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Data dots + labels */}
                {radarAxes.map((val, i) => {
                  const angle = (Math.PI / 3) * i - Math.PI / 2;
                  const r = (val / 100) * hexMaxR;
                  const dx = hexCx + r * Math.cos(angle);
                  const dy = hexCy + r * Math.sin(angle);
                  const lx = hexCx + (hexMaxR + 18) * Math.cos(angle);
                  const ly = hexCy + (hexMaxR + 18) * Math.sin(angle);
                  const anchor: "start" | "middle" | "end" = i === 0 ? "middle" : i < 3 ? "start" : i < 5 ? "end" : "middle";
                  return (
                    <g key={i}>
                      <circle cx={dx} cy={dy} r="3" fill="#22c55e" />
                      <text x={lx} y={ly + 3} textAnchor={anchor} fill="#8b949e" fontSize="9" fontWeight="bold">
                        {hexLabels[i]} {val}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legend Tier Gauge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Gem className="h-4 w-4 text-emerald-400" />
                Legend Tier Gauge
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox="0 0 240 160" className="max-w-[320px] mx-auto">
                {/* Background arc */}
                <path d={gaugeBgPath} fill="none" stroke="#21262d" strokeWidth="14" strokeLinecap="round" />
                {/* Filled arc */}
                {gaugeFillPath && (
                  <path d={gaugeFillPath} fill="none" stroke={scoreColor} strokeWidth="14" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
                )}
                {/* Score text */}
                <text x={gaugeCx} y={gaugeCy - 10} textAnchor="middle"  fill="#c9d1d9" fontSize="28" fontWeight="bold">
                  {legendScore.toFixed(0)}
                </text>
                <text x={gaugeCx} y={gaugeCy + 8} textAnchor="middle"  fill={legendTierColor} fontSize="12" fontWeight="bold">
                  {legendTier}
                </text>
                {/* Tick labels */}
                {gaugeTicks.map((t) => (
                  <text key={t.label} x={t.x} y={t.y + 4} textAnchor="middle"  fill="#484f58" fontSize="9">
                    {t.label}
                  </text>
                ))}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Season Legend Score Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Legend Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(() => {
                const chartW = 300;
                const chartH = 130;
                const pad = { top: 10, right: 15, bottom: 20, left: 30 };
                const plotW = chartW - pad.left - pad.right;
                const plotH = chartH - pad.top - pad.bottom;
                const seasonData = seasons.map((s, idx) => {
                  const sg = s.playerStats.goals ?? 0;
                  const sa = s.playerStats.assists ?? 0;
                  const sp = s.playerStats.averageRating ?? 0;
                  const sc = (sg / 500) * 25 + (sa / 250) * 15 + (sp / 10) * 10 + ((idx + 1) / 20) * 15 + 5;
                  return { season: s.number, score: Math.min(100, sc) };
                });
                seasonData.push({ season: currentSeason, score: legendScore });
                const maxS = Math.max(100, ...seasonData.map((d) => d.score));
                const linePoints = seasonData.length > 1
                  ? seasonData.map((d, i) => {
                      const x = pad.left + (i / (seasonData.length - 1)) * plotW;
                      const y = pad.top + plotH - (d.score / maxS) * plotH;
                      return `${x},${y}`;
                    }).join(' ')
                  : '';
                return (
                  <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="max-w-[400px] mx-auto">
                    {[0, 25, 50, 75, 100].map((v) => {
                      const y = pad.top + plotH - (v / maxS) * plotH;
                      return (
                        <g key={v}>
                          <line x1={pad.left} y1={y} x2={chartW - pad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
                          <text x={pad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
                        </g>
                      );
                    })}
                    {linePoints && <polyline points={linePoints} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />}
                    {seasonData.map((d, i) => {
                      const x = seasonData.length > 1 ? pad.left + (i / (seasonData.length - 1)) * plotW : pad.left;
                      const y = pad.top + plotH - (d.score / maxS) * plotH;
                      return (
                        <g key={d.season}>
                          <circle cx={x} cy={y} r="3" fill={d.score >= 75 ? '#ffd700' : d.score >= 50 ? '#22c55e' : '#3b82f6'} />
                          <text x={x} y={chartH - 4} textAnchor="middle" fill="#484f58" fontSize="7">S{d.season}</text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Legend Score Breakdown Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 6 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Flame className="h-4 w-4 text-emerald-400" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {[
                  { label: 'Goals Contribution', pts: (totalGoals / 500) * 25, max: 25, color: '#22c55e', desc: `${totalGoals} goals scored` },
                  { label: 'Assists Contribution', pts: (totalAssists / 250) * 15, max: 15, color: '#3b82f6', desc: `${totalAssists} assists provided` },
                  { label: 'Trophy Contribution', pts: (trophyCount / 30) * 20, max: 20, color: '#f59e0b', desc: `${trophyCount} trophies won` },
                  { label: 'Longevity Contribution', pts: (seasonsPlayed / 20) * 15, max: 15, color: '#06b6d4', desc: `${seasonsPlayed} seasons played` },
                  { label: 'International Contribution', pts: (caps / 100) * 10, max: 10, color: '#a78bfa', desc: `${caps} international caps` },
                  { label: 'Achievement Contribution', pts: (unlockedAch / 50) * 10, max: 10, color: '#ec4899', desc: `${unlockedAch} achievements unlocked` },
                  { label: 'Peak Rating Bonus', pts: (playerOvr / 99) * 5, max: 5, color: '#ef4444', desc: `OVR ${playerOvr}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-2 bg-[#0d1117] rounded-lg border border-[#21262d]">
                    <div className="w-2 h-8 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#c9d1d9]">{item.label}</span>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: item.color }}>
                          +{Math.min(item.max, item.pts).toFixed(1)} / {item.max}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#484f58]">{item.desc}</p>
                      <div className="mt-1 h-1 bg-[#21262d] rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (Math.min(item.max, item.pts) / item.max) * 100)}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2: Historical Comparison
  // ═══════════════════════════════════════════════════════════
  function renderComparisonTab(): React.JSX.Element {
    const legendNames = Object.keys(LEGEND_DATA);
    const metrics = ['goals', 'assists', 'caps', 'trophies', 'seasons'] as const;
    const metricLabels: Record<string, string> = { goals: 'Goals', assists: 'Assists', caps: 'Caps', trophies: 'Trophies', seasons: 'Seasons' };

    // SVG 1: Career Stats Butterfly Chart (5 metrics)
    const butterflyMetrics = [
      { label: 'Goals', player: totalGoals, legends: [762, 353, 821, 873, 402] },
      { label: 'Assists', player: totalAssists, legends: [369, 188, 374, 252, 168] },
      { label: 'Caps', player: caps, legends: [92, 91, 187, 206, 48] },
      { label: 'Trophies', player: trophyCount, legends: [26, 11, 44, 34, 16] },
      { label: 'Seasons', player: seasonsPlayed, legends: [21, 18, 19, 22, 16] },
    ];
    const bMax = 900;
    const bLeft = 90;
    const bRight = 210;
    const bCenterX = 150;
    const bW = 300;
    const bH = 160;
    const bPadTop = 15;
    const bRowH = (bH - bPadTop - 10) / butterflyMetrics.length;

    // SVG 2: Goals vs Legends Bars (5×2 grouped bars)
    const goalBars = legendNames.map((name) => ({
      name,
      legendGoals: LEGEND_DATA[name].goals,
      playerGoals: totalGoals,
    }));
    const gMaxVal = Math.max(totalGoals, ...legendNames.map((n) => LEGEND_DATA[n].goals));
    const gBarW = 300;
    const gBarH = 160;
    const gPadTop = 20;
    const gPadBot = 25;
    const gPlotH = gBarH - gPadTop - gPadBot;
    const gGroupW = (gBarW - 20) / goalBars.length;
    const gBarW1 = gGroupW * 0.35;
    const gBarW2 = gGroupW * 0.35;

    // SVG 3: Record Proximity Scatter
    const recordProximity = [
      { label: 'All-time Goals', record: 873, current: totalGoals, color: '#22c55e' },
      { label: 'All-time Assists', record: 374, current: totalAssists, color: '#3b82f6' },
      { label: 'Int. Caps', record: 206, current: caps, color: '#a78bfa' },
      { label: 'Trophies Won', record: 44, current: trophyCount, color: '#f59e0b' },
      { label: 'Seasons Played', record: 22, current: seasonsPlayed, color: '#06b6d4' },
      { label: 'Awards Won', record: 50, current: unlockedAch, color: '#ec4899' },
      { label: 'Overall Rating', record: 99, current: playerOvr, color: '#ef4444' },
      { label: 'Apps Made', record: 1000, current: totalApps, color: '#f97316' },
    ];
    const rpW = 300;
    const rpH = 160;
    const rpPadLeft = 70;
    const rpPadRight = 15;
    const rpPadTop = 10;
    const rpPadBot = 25;
    const rpPlotW = rpW - rpPadLeft - rpPadRight;
    const rpPlotH = rpH - rpPadTop - rpPadBot;

    return (
      <div className="space-y-4">
        {/* Player vs Legend summary cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {legendNames.map((name, i) => {
              const legend = LEGEND_DATA[name];
              const similarity = metrics.reduce((sum, m) => {
                const lVal = legend[m];
                const pVal = m === 'goals' ? totalGoals : m === 'assists' ? totalAssists : m === 'caps' ? caps : m === 'trophies' ? trophyCount : seasonsPlayed;
                const maxVal = Math.max(lVal, pVal, 1);
                return sum + (1 - Math.abs(lVal - pVal) / maxVal);
              }, 0) / metrics.length;
              const simPct = Math.round(similarity * 100);
              return (
                <motion.div
                  key={name}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 min-w-[120px] shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...A, delay: i * D }}
                >
                  <p className="text-xs font-bold text-[#c9d1d9]">{legend.name}</p>
                  <p className="text-lg font-black text-emerald-400 tabular-nums">{simPct}%</p>
                  <p className="text-[9px] text-[#484f58]">similarity</p>
                  <div className="mt-1 h-1 bg-[#21262d] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm bg-emerald-500" style={{ width: `${simPct}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Butterfly Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Career Stats Butterfly
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox={`0 0 ${bW} ${bH}`} className="max-w-[400px] mx-auto">
                {/* Center line */}
                <line x1={bCenterX} y1={bPadTop} x2={bCenterX} y2={bH - 10} stroke="#30363d" strokeWidth="1" />
                {/* Legend labels top */}
                <text x={bLeft} y={10} textAnchor="end"  fill="#484f58" fontSize="8">Legends Avg</text>
                <text x={bRight} y={10} textAnchor="start"  fill="#22c55e" fontSize="8">{playerName}</text>
                {/* Rows */}
                {butterflyMetrics.map((m, i) => {
                  const y = bPadTop + i * bRowH + bRowH / 2;
                  const legAvg = Math.round(m.legends.reduce((s, v) => s + v, 0) / m.legends.length);
                  const pNorm = (m.player / bMax) * (bCenterX - bLeft - 5);
                  const lNorm = (legAvg / bMax) * (bCenterX - bLeft - 5);
                  return (
                    <g key={m.label}>
                      <text x={bCenterX} y={y + 3} textAnchor="middle"  fill="#8b949e" fontSize="9" fontWeight="bold">
                        {m.label}
                      </text>
                      {/* Legend bar (left) */}
                      <rect x={bCenterX - lNorm} y={y - 4} width={lNorm} height="8" fill="#3b82f6" rx="2" />
                      <text x={bCenterX - lNorm - 3} y={y + 3} textAnchor="end"  fill="#8b949e" fontSize="8">
                        {legAvg}
                      </text>
                      {/* Player bar (right) */}
                      <rect x={bCenterX + 2} y={y - 4} width={Math.max(1, pNorm)} height="8" fill="#22c55e" rx="2" />
                      <text x={bCenterX + pNorm + 6} y={y + 3} textAnchor="start"  fill="#22c55e" fontSize="8">
                        {m.player}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals vs Legends Bars */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                Goals vs Legends
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox={`0 0 ${gBarW} ${gBarH}`} className="max-w-[400px] mx-auto">
                {/* Y-axis gridlines */}
                {[0, 200, 400, 600, 800].map((v) => {
                  const y = gPadTop + gPlotH - (v / gMaxVal) * gPlotH;
                  return (
                    <g key={v}>
                      <line x1={10} y1={y} x2={gBarW - 10} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
                      <text x={8} y={y + 3} textAnchor="end"  fill="#484f58" fontSize="7">{v}</text>
                    </g>
                  );
                })}
                {/* Bar groups */}
                {goalBars.map((g, i) => {
                  const gx = 10 + i * gGroupW + gGroupW * 0.15;
                  const lh = (g.legendGoals / gMaxVal) * gPlotH;
                  const ph = Math.max(1, (g.playerGoals / gMaxVal) * gPlotH);
                  const ly = gPadTop + gPlotH - lh;
                  const py = gPadTop + gPlotH - ph;
                  return (
                    <g key={g.name}>
                      <rect x={gx} y={ly} width={gBarW1} height={lh} fill="#3b82f6" rx="2" />
                      <rect x={gx + gBarW1 + 2} y={py} width={gBarW2} height={ph} fill="#22c55e" rx="2" />
                      <text x={gx + gGroupW * 0.4} y={gBarH - gPadBot + 12} textAnchor="middle"  fill="#8b949e" fontSize="7" fontWeight="bold">
                        {g.name.slice(0, 5)}
                      </text>
                    </g>
                  );
                })}
                {/* Legend */}
                <rect x={gBarW - 80} y={3} width="8" height="8" fill="#3b82f6" rx="1" />
                <text x={gBarW - 69} y={10} fill="#8b949e" fontSize="7">Legend</text>
                <rect x={gBarW - 40} y={3} width="8" height="8" fill="#22c55e" rx="1" />
                <text x={gBarW - 29} y={10} fill="#8b949e" fontSize="7">You</text>
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Record Proximity Scatter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Record Proximity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox={`0 0 ${rpW} ${rpH}`} className="max-w-[400px] mx-auto">
                {/* Background grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const x = rpPadLeft + pct * rpPlotW;
                  return <line key={pct} x1={x} y1={rpPadTop} x2={x} y2={rpH - rpPadBot} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />;
                })}
                {recordProximity.map((rec, i) => {
                  const pct = rec.record > 0 ? Math.min(1, rec.current / rec.record) : 0;
                  const x = rpPadLeft + pct * rpPlotW;
                  const y = rpPadTop + (i + 0.5) * (rpPlotH / recordProximity.length);
                  return (
                    <g key={rec.label}>
                      <text x={rpPadLeft - 4} y={y + 3} textAnchor="end"  fill="#8b949e" fontSize="7">
                        {rec.label.slice(0, 12)}
                      </text>
                      <circle cx={x} cy={y} r="5" fill={rec.color} />
                      <text x={x} y={y - 8} textAnchor="middle"  fill={rec.color} fontSize="7" fontWeight="bold">
                        {Math.round(pct * 100)}%
                      </text>
                    </g>
                  );
                })}
                {/* X-axis labels */}
                <text x={rpPadLeft} y={rpH - rpPadBot + 12} textAnchor="start"  fill="#484f58" fontSize="7">0%</text>
                <text x={rpPadLeft + rpPlotW * 0.5} y={rpH - rpPadBot + 12} textAnchor="middle"  fill="#484f58" fontSize="7">50%</text>
                <text x={rpW - rpPadRight} y={rpH - rpPadBot + 12} textAnchor="end"  fill="#484f58" fontSize="7">100%</text>
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed comparison table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Head-to-Head Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-[#30363d]">
                      <th className="text-left text-[#8b949e] py-1.5 pr-2 font-medium">Player</th>
                      {metrics.map((m) => (
                        <th key={m} className="text-right text-[#8b949e] py-1.5 px-1 font-medium">{metricLabels[m]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#21262d]">
                      <td className="py-1.5 pr-2 font-bold text-emerald-400">{playerName}</td>
                      {metrics.map((m) => {
                        const val = m === 'goals' ? totalGoals : m === 'assists' ? totalAssists : m === 'caps' ? caps : m === 'trophies' ? trophyCount : seasonsPlayed;
                        return <td key={m} className="text-right py-1.5 px-1 tabular-nums text-[#c9d1d9]">{val}</td>;
                      })}
                    </tr>
                    {legendNames.map((name) => {
                      const legend = LEGEND_DATA[name];
                      return (
                        <tr key={name} className="border-b border-[#21262d]">
                          <td className="py-1.5 pr-2 text-[#8b949e]">{legend.name}</td>
                          {metrics.map((m) => (
                            <td key={m} className="text-right py-1.5 px-1 tabular-nums text-[#8b949e]">{legend[m]}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-Season Goals Comparison */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 6 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Goals Per Season Pace
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(() => {
                const pW = 300;
                const pH = 140;
                const pPad = { top: 15, right: 15, bottom: 22, left: 35 };
                const pPlotW = pW - pPad.left - pPad.right;
                const pPlotH = pH - pPad.top - pPad.bottom;
                const playerSeasonData = seasons.map((s) => s.playerStats.goals ?? 0);
                playerSeasonData.push(player.seasonStats.goals ?? 0);
                const messiPace = [38, 47, 53, 60, 73, 41, 59, 12, 45];
                const ronaldoPace = [34, 48, 46, 63, 51, 35, 44, 28, 31];
                const pMax = Math.max(60, ...playerSeasonData, ...messiPace.slice(0, playerSeasonData.length), ...ronaldoPace.slice(0, playerSeasonData.length));
                const playerLine = playerSeasonData.length > 1
                  ? playerSeasonData.map((v, i) => {
                      const x = pPad.left + (i / (playerSeasonData.length - 1)) * pPlotW;
                      const y = pPad.top + pPlotH - (v / pMax) * pPlotH;
                      return `${x},${y}`;
                    }).join(' ')
                  : '';
                const messiLine = playerSeasonData.length > 1
                  ? messiPace.slice(0, playerSeasonData.length).map((v, i) => {
                      const x = pPad.left + (i / (playerSeasonData.length - 1)) * pPlotW;
                      const y = pPad.top + pPlotH - (v / pMax) * pPlotH;
                      return `${x},${y}`;
                    }).join(' ')
                  : '';
                const ronaldoLine = playerSeasonData.length > 1
                  ? ronaldoPace.slice(0, playerSeasonData.length).map((v, i) => {
                      const x = pPad.left + (i / (playerSeasonData.length - 1)) * pPlotW;
                      const y = pPad.top + pPlotH - (v / pMax) * pPlotH;
                      return `${x},${y}`;
                    }).join(' ')
                  : '';
                return (
                  <svg width="100%" viewBox={`0 0 ${pW} ${pH}`} className="max-w-[400px] mx-auto">
                    {[0, 15, 30, 45, 60].map((v) => {
                      const y = pPad.top + pPlotH - (v / pMax) * pPlotH;
                      return (
                        <g key={v}>
                          <line x1={pPad.left} y1={y} x2={pW - pPad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
                          <text x={pPad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">{v}</text>
                        </g>
                      );
                    })}
                    {messiLine && <polyline points={messiLine} fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeLinejoin="round" strokeDasharray="4,2" />}
                    {ronaldoLine && <polyline points={ronaldoLine} fill="none" stroke="#a78bfa" strokeWidth="1.2" strokeLinejoin="round" strokeDasharray="4,2" />}
                    {playerLine && <polyline points={playerLine} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />}
                    {playerSeasonData.map((v, i) => {
                      const x = playerSeasonData.length > 1 ? pPad.left + (i / (playerSeasonData.length - 1)) * pPlotW : pPad.left;
                      const y = pPad.top + pPlotH - (v / pMax) * pPlotH;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="2.5" fill="#22c55e" />
                          <text x={x} y={pH - 5} textAnchor="middle" fill="#484f58" fontSize="6">S{i + 1}</text>
                        </g>
                      );
                    })}
                    {/* Legend */}
                    <line x1={pW - 90} y1={6} x2={pW - 78} y2={6} stroke="#22c55e" strokeWidth="2" />
                    <text x={pW - 75} y={9} fill="#22c55e" fontSize="6">You</text>
                    <line x1={pW - 55} y1={6} x2={pW - 43} y2={6} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,2" />
                    <text x={pW - 40} y={9} fill="#3b82f6" fontSize="6">Messi</text>
                    <line x1={pW - 25} y1={6} x2={pW - 13} y2={6} stroke="#a78bfa" strokeWidth="1" strokeDasharray="3,2" />
                    <text x={pW - 10} y={9} fill="#a78bfa" fontSize="6">CR7</text>
                  </svg>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* All-Time Ranking Position */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 7 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Medal className="h-4 w-4 text-emerald-400" />
                All-Time Ranking Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {[
                  { rank: 'Goals', value: totalGoals, sorted: [873, 821, 762, 402, 353, totalGoals], unit: 'goals' },
                  { rank: 'Assists', value: totalAssists, sorted: [374, 369, 252, 188, 168, totalAssists], unit: 'assists' },
                  { rank: 'Trophies', value: trophyCount, sorted: [44, 34, 26, 16, 11, trophyCount], unit: 'trophies' },
                  { rank: 'Caps', value: caps, sorted: [206, 187, 92, 91, 48, caps], unit: 'caps' },
                ].map((item) => {
                  const desc = [...item.sorted].sort((a, b) => b - a);
                  const position = desc.indexOf(item.value) + 1;
                  const total = desc.length;
                  const topPct = Math.round(((total - position + 1) / total) * 100);
                  return (
                    <div key={item.rank} className="flex items-center gap-3 p-2.5 bg-[#0d1117] rounded-lg border border-[#21262d]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-emerald-400">#{position}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#c9d1d9]">{item.rank}</span>
                        <p className="text-[9px] text-[#484f58]">{item.value} {item.unit} — top {topPct}% of legends</p>
                      </div>
                      <div className="h-8 w-16 bg-[#21262d] rounded-sm overflow-hidden flex items-end">
                        <div className="w-full rounded-t-sm bg-emerald-500" style={{ height: `${topPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3: Legacy Milestones
  // ═══════════════════════════════════════════════════════════
  function renderMilestonesTab(): React.JSX.Element {
    // Milestone definitions
    const allMilestones: MilestoneItem[] = [
      { id: 'm1', label: 'First Professional Goal', description: 'Score your first competitive goal', completed: totalGoals >= 1, category: 'Goals', progress: Math.min(100, (totalGoals / 1) * 100) },
      { id: 'm2', label: 'Century of Goals', description: 'Reach 100 career goals', completed: totalGoals >= 100, category: 'Goals', progress: Math.min(100, (totalGoals / 100) * 100) },
      { id: 'm3', label: 'Golden Boot Winner', description: 'Finish as league top scorer', completed: false, category: 'Records', progress: Math.min(100, (totalGoals / 25) * 100) },
      { id: 'm4', label: 'First Trophy', description: 'Win your first major trophy', completed: trophyCount >= 1, category: 'Trophies', progress: Math.min(100, (trophyCount / 1) * 100) },
      { id: 'm5', label: 'Decade of Service', description: 'Play 10+ professional seasons', completed: seasonsPlayed >= 10, category: 'Longevity', progress: Math.min(100, (seasonsPlayed / 10) * 100) },
      { id: 'm6', label: 'International Call-Up', description: 'Receive your first international cap', completed: caps >= 1, category: 'Legacy', progress: Math.min(100, (caps / 1) * 100) },
      { id: 'm7', label: '500 Appearances', description: 'Reach 500 total appearances', completed: totalApps >= 500, category: 'Longevity', progress: Math.min(100, (totalApps / 500) * 100) },
      { id: 'm8', label: 'World Class Rating', description: 'Reach 90+ overall rating', completed: playerOvr >= 90, category: 'Impact', progress: Math.min(100, (playerOvr / 90) * 100) },
      { id: 'm9', label: 'Triple Crown', description: 'Win league, cup, and continental in one season', completed: false, category: 'Trophies', progress: trophyCount >= 3 ? 33 : (trophyCount / 3) * 33 },
      { id: 'm10', label: '200 Goals Club', description: 'Reach 200 career goals', completed: totalGoals >= 200, category: 'Goals', progress: Math.min(100, (totalGoals / 200) * 100) },
    ];

    const completedCount = allMilestones.filter((m) => m.completed).length;
    const totalCount = allMilestones.length;
    const completionPct = Math.round((completedCount / totalCount) * 100);

    // SVG 1: Milestone Completion Ring
    const mRingCx = 120;
    const mRingCy = 120;
    const mRingR = 85;
    const mRingCirc = 2 * Math.PI * mRingR;
    const mRingOffset = mRingCirc - (completionPct / 100) * mRingCirc;

    // SVG 2: Milestone Category Donut (5 segments via .reduce())
    const categories = ['Goals', 'Trophies', 'Records', 'Longevity', 'Impact'];
    const catColors = ['#22c55e', '#f59e0b', '#a78bfa', '#06b6d4', '#3b82f6'];
    const donutSegments: DonutSegment[] = categories.reduce((acc: DonutSegment[], cat, idx) => {
      const catMilestones = allMilestones.filter((m) => m.category === cat);
      const count = catMilestones.length;
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
      const angle = (count / totalCount) * 2 * Math.PI;
      acc.push({
        category: cat,
        count,
        pct: Math.round((count / totalCount) * 100),
        color: catColors[idx],
        startAngle: prevEnd,
        endAngle: prevEnd + angle,
      });
      return acc;
    }, []);
    const donutCx = 120;
    const donutCy = 120;
    const donutOuterR = 80;
    const donutInnerR = 50;

    // SVG 3: Legacy Path Timeline (8 nodes)
    const timelineMilestones = allMilestones.slice(0, 8);
    const tlW = 300;
    const tlH = 160;
    const tlPadX = 20;
    const tlPadY = 30;
    const tlNodeSpacing = (tlW - tlPadX * 2) / (timelineMilestones.length - 1);

    return (
      <div className="space-y-4">
        {/* Milestone Completion Ring + Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                Milestone Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-4">
                <svg width="130" height="130" viewBox="0 0 240 240">
                  <circle cx={mRingCx} cy={mRingCy} r={mRingR} fill="none" stroke="#21262d" strokeWidth="14" />
                  <circle
                    cx={mRingCx}
                    cy={mRingCy}
                    r={mRingR}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="14"
                    strokeDasharray={mRingCirc}
                    strokeDashoffset={mRingOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <text x={mRingCx} y={mRingCy - 6} textAnchor="middle"  fill="#c9d1d9" fontSize="32" fontWeight="bold">
                    {completedCount}
                  </text>
                  <text x={mRingCx} y={mRingCy + 14} textAnchor="middle"  fill="#8b949e" fontSize="11">
                    / {totalCount}
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-[#8b949e]">{completionPct}% complete</p>
                  <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm bg-emerald-500" style={{ width: `${completionPct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {categories.map((cat, idx) => {
                      const catMs = allMilestones.filter((m) => m.category === cat);
                      const done = catMs.filter((m) => m.completed).length;
                      return (
                        <div key={cat} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: catColors[idx] }} />
                          <span className="text-[9px] text-[#8b949e]">{cat}</span>
                          <span className="text-[9px] tabular-nums ml-auto" style={{ color: catColors[idx] }}>{done}/{catMs.length}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestone Category Donut */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Gem className="h-4 w-4 text-emerald-400" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-4">
                <svg width="140" height="140" viewBox="0 0 240 240">
                  {donutSegments.map((seg) => {
                    const path = buildDonutArcPath(donutCx, donutCy, donutOuterR, donutInnerR, seg.startAngle, seg.endAngle);
                    return <path key={seg.category} d={path} fill={seg.color} />;
                  })}
                  <text x={donutCx} y={donutCy - 6} textAnchor="middle"  fill="#c9d1d9" fontSize="20" fontWeight="bold">
                    {totalCount}
                  </text>
                  <text x={donutCx} y={donutCy + 12} textAnchor="middle"  fill="#8b949e" fontSize="10">
                    milestones
                  </text>
                </svg>
                <div className="flex-1 space-y-1.5">
                  {donutSegments.map((seg) => (
                    <div key={seg.category} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-[10px] text-[#c9d1d9] flex-1">{seg.category}</span>
                      <span className="text-[10px] text-[#8b949e] tabular-nums">{seg.count} ({seg.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legacy Path Timeline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Legacy Path
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox={`0 0 ${tlW} ${tlH}`} className="max-w-[400px] mx-auto">
                {/* Connecting line */}
                <line x1={tlPadX} y1={tlPadY + 10} x2={tlW - tlPadX} y2={tlPadY + 10} stroke="#30363d" strokeWidth="2" />
                {/* Nodes */}
                {timelineMilestones.map((ms, i) => {
                  const x = tlPadX + i * tlNodeSpacing;
                  const nodeColor = ms.completed ? '#22c55e' : '#484f58';
                  const dotColor = ms.completed ? '#22c55e' : '#21262d';
                  return (
                    <g key={ms.id}>
                      <circle cx={x} cy={tlPadY + 10} r="7" fill={dotColor} stroke={nodeColor} strokeWidth="2" />
                      {ms.completed && <circle cx={x} cy={tlPadY + 10} r="3" fill="#22c55e" />}
                      {/* Label */}
                      <text x={x} y={tlPadY + 28} textAnchor="middle"  fill={ms.completed ? '#22c55e' : '#8b949e'} fontSize="6" fontWeight="bold">
                        {ms.label.length > 14 ? ms.label.slice(0, 14) + '...' : ms.label}
                      </text>
                      {/* Progress bar below */}
                      <rect x={x - 12} y={tlPadY + 34} width="24" height="3" fill="#21262d" rx="1" />
                      <rect x={x - 12} y={tlPadY + 34} width={24 * (ms.progress / 100)} height="3" fill={nodeColor} rx="1" />
                      {/* Step number */}
                      <text x={x} y={tlPadY - 2} textAnchor="middle"  fill="#484f58" fontSize="7">{i + 1}</text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestone List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-400" />
                All Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {allMilestones.map((ms, i) => {
                const catIdx = categories.indexOf(ms.category);
                const catColor = catIdx >= 0 ? catColors[catIdx] : '#8b949e';
                return (
                  <motion.div
                    key={ms.id}
                    className="flex items-center gap-3 p-2.5 bg-[#0d1117] rounded-lg border border-[#21262d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...A, delay: D * 3 + i * D }}
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: ms.completed ? '#22c55e20' : '#21262d' }}>
                      {ms.completed ? (
                        <Star className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Target className="h-3.5 w-3.5 text-[#484f58]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#c9d1d9]">{ms.label}</span>
                        <Badge className="text-[8px] px-1 py-0" style={{ backgroundColor: catColor + '15', color: catColor, border: 'none', fontSize: '8px' }}>
                          {ms.category}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[#484f58]">{ms.description}</p>
                      <div className="mt-1 h-1 bg-[#21262d] rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${ms.progress}%`, backgroundColor: ms.completed ? '#22c55e' : catColor }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: ms.completed ? '#22c55e' : '#484f58' }}>
                      {ms.completed ? 'DONE' : `${Math.round(ms.progress)}%`}
                    </span>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Unlock Requirements Detail */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Unlock Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {[
                  { tier: 'Emerging (0-19)', req: 'Start your career and play matches', met: legendScore > 0, color: '#8b949e' },
                  { tier: 'Promising (20-39)', req: 'Score 20+ goals or play 3+ seasons', met: legendScore >= 20, color: '#f59e0b' },
                  { tier: 'Distinguished (40-59)', req: 'Win a trophy and reach 80+ OVR', met: legendScore >= 40, color: '#3b82f6' },
                  { tier: 'Iconic (60-74)', req: '100+ goals and 10+ trophies', met: legendScore >= 60, color: '#22c55e' },
                  { tier: 'Legendary (75-89)', req: '300+ goals, 20+ caps, 15+ trophies', met: legendScore >= 75, color: '#a78bfa' },
                  { tier: 'Immortal (90+)', req: '500+ goals, 50+ caps, 25+ trophies, 90+ OVR', met: legendScore >= 90, color: '#ffd700' },
                ].map((item, i) => (
                  <motion.div
                    key={item.tier}
                    className="flex items-center gap-3 p-2.5 bg-[#0d1117] rounded-lg border border-[#21262d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...A, delay: D * 4 + i * D }}
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: item.met ? item.color + '20' : '#21262d' }}>
                      {item.met ? <Star className="h-3.5 w-3.5" style={{ color: item.color }} /> : <Shield className="h-3.5 w-3.5 text-[#484f58]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold" style={{ color: item.met ? item.color : '#8b949e' }}>{item.tier}</span>
                      <p className="text-[9px] text-[#484f58]">{item.req}</p>
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: item.met ? '#22c55e' : '#484f58' }}>{item.met ? 'UNLOCKED' : 'LOCKED'}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestone Recommendations */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-emerald-400" />
                Recommended Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {[
                  { priority: 'HIGH', action: 'Score more goals', detail: `Need ${Math.max(0, 100 - totalGoals)} more goals for Century milestone`, color: '#ef4444' },
                  { priority: 'MED', action: 'Win trophies', detail: `Need ${Math.max(0, 5 - trophyCount)} more trophies to improve legend score`, color: '#f59e0b' },
                  { priority: 'MED', action: 'Build longevity', detail: `Play ${Math.max(0, 10 - seasonsPlayed)} more seasons for Decade milestone`, color: '#f59e0b' },
                  { priority: 'LOW', action: 'Get international caps', detail: `Earn ${Math.max(0, 10 - caps)} more caps for Legacy milestones`, color: '#22c55e' },
                  { priority: 'LOW', action: 'Improve overall rating', detail: `Reach 90+ OVR for World Class milestone (currently ${playerOvr})`, color: '#22c55e' },
                ].map((rec) => (
                  <div key={rec.action} className="flex items-center gap-3 p-2 bg-[#0d1117] rounded-lg border border-[#21262d]">
                    <Badge className="text-[7px] font-bold px-1 py-0 shrink-0" style={{ backgroundColor: rec.color + '20', color: rec.color, border: 'none' }}>
                      {rec.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{rec.action}</span>
                      <p className="text-[9px] text-[#484f58]">{rec.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4: Hall of Fame Readiness
  // ═══════════════════════════════════════════════════════════
  function renderHoFTab(): React.JSX.Element {
    // HoF Probability
    const hofCriteria = [
      { label: 'Goals Scored', current: totalGoals, threshold: 200, weight: 25 },
      { label: 'Trophies Won', current: trophyCount, threshold: 10, weight: 20 },
      { label: 'International Career', current: caps, threshold: 50, weight: 15 },
      { label: 'Longevity', current: seasonsPlayed, threshold: 15, weight: 20 },
      { label: 'Peak Rating', current: playerOvr, threshold: 85, weight: 20 },
    ];

    const hofScore = hofCriteria.reduce((sum, c) => {
      const pct = Math.min(1, c.current / c.threshold);
      return sum + pct * c.weight;
    }, 0);
    const hofProbability = Math.min(99, Math.round(hofScore));

    // SVG 1: HoF Probability Gauge (semi-circular)
    const hfCx = 120;
    const hfCy = 130;
    const hfR = 80;
    const hfStartAngle = Math.PI;
    const hfEndAngle = 2 * Math.PI;
    const hfScoreAngle = hfStartAngle + (hofProbability / 100) * Math.PI;
    const hfBgPath = buildArcPath(hfCx, hfCy, hfR, hfStartAngle, hfEndAngle);
    const hfFillPath = hofProbability > 0 ? buildArcPath(hfCx, hfCy, hfR, hfStartAngle, hfScoreAngle) : '';
    const hfGaugeColor = hofProbability >= 75 ? '#22c55e' : hofProbability >= 50 ? '#f59e0b' : '#ef4444';

    // SVG 2: Qualification Criteria Bars (5 bars)
    const qcW = 300;
    const qcH = 160;
    const qcPadTop = 15;
    const qcPadBot = 15;
    const qcPadLeft = 70;
    const qcPadRight = 40;
    const qcPlotW = qcW - qcPadLeft - qcPadRight;
    const qcBarH = 12;
    const qcSpacing = (qcH - qcPadTop - qcPadBot) / hofCriteria.length;

    // SVG 3: Hall of Fame Class Radar (5-axis)
    const hofAxes = hofCriteria.map((c) => Math.min(100, Math.round((c.current / c.threshold) * 100)));
    const hofInducteeAxes = [
      Math.round((HOF_INDUCTEE_AVG.goals / 200) * 100),
      Math.round((HOF_INDUCTEE_AVG.trophies / 10) * 100),
      Math.round((HOF_INDUCTEE_AVG.longevity / 15) * 100),
      Math.round((HOF_INDUCTEE_AVG.impact / 85) * 100),
      Math.round((HOF_INDUCTEE_AVG.assists / 200) * 100),
    ];
    const hRadarCx = 120;
    const hRadarCy = 120;
    const hRadarMaxR = 80;
    const hGrid1 = buildPentagonPoints(hRadarCx, hRadarCy, hRadarMaxR * 0.33);
    const hGrid2 = buildPentagonPoints(hRadarCx, hRadarCy, hRadarMaxR * 0.66);
    const hGrid3 = buildPentagonPoints(hRadarCx, hRadarCy, hRadarMaxR);
    const hPlayerData = buildPentagonDataPoints(hRadarCx, hRadarCy, hofAxes, hRadarMaxR);
    const hInducteeData = buildPentagonDataPoints(hRadarCx, hRadarCy, hofInducteeAxes, hRadarMaxR);
    const hRadarLabels = ['Goals', 'Trophies', 'Longevity', 'Impact', 'Assists'];

    // Voting simulation
    const totalVoters = 100;
    const yesVotes = Math.round((hofProbability / 100) * totalVoters);
    const noVotes = totalVoters - yesVotes;

    return (
      <div className="space-y-4">
        {/* HoF Probability Gauge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                Hall of Fame Probability
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox="0 0 240 160" className="max-w-[320px] mx-auto">
                {/* Background arc */}
                <path d={hfBgPath} fill="none" stroke="#21262d" strokeWidth="14" strokeLinecap="round" />
                {/* Filled arc */}
                {hfFillPath && (
                  <path d={hfFillPath} fill="none" stroke={hfGaugeColor} strokeWidth="14" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
                )}
                {/* Score text */}
                <text x={hfCx} y={hfCy - 10} textAnchor="middle"  fill="#c9d1d9" fontSize="28" fontWeight="bold">
                  {hofProbability}%
                </text>
                <text x={hfCx} y={hfCy + 8} textAnchor="middle"  fill={hfGaugeColor} fontSize="11" fontWeight="bold">
                  {hofProbability >= 75 ? 'Likely Inductee' : hofProbability >= 50 ? 'Borderline' : 'Needs Work'}
                </text>
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((v) => {
                  const angle = hfStartAngle + (v / 100) * Math.PI;
                  const tx = hfCx + (hfR + 14) * Math.cos(angle);
                  const ty = hfCy + (hfR + 14) * Math.sin(angle);
                  return (
                    <text key={v} x={tx} y={ty + 4} textAnchor="middle"  fill="#484f58" fontSize="9">
                      {v}%
                    </text>
                  );
                })}
              </svg>
              {/* Voting Simulation */}
              <Separator className="my-3 bg-[#30363d]" />
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-emerald-400 font-bold">Yes: {yesVotes}</span>
                    <span className="text-[10px] text-red-400 font-bold">No: {noVotes}</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-sm overflow-hidden flex">
                    <div className="h-full bg-emerald-500 rounded-l-sm" style={{ width: `${(yesVotes / totalVoters) * 100}%` }} />
                    <div className="h-full bg-red-500 rounded-r-sm" style={{ width: `${(noVotes / totalVoters) * 100}%` }} />
                  </div>
                  <p className="text-[9px] text-[#484f58] mt-1">Simulated {totalVoters}-voter panel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Qualification Criteria Bars */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Qualification Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <svg width="100%" viewBox={`0 0 ${qcW} ${qcH}`} className="max-w-[400px] mx-auto">
                {/* Grid lines */}
                {[0, 0.5, 1.0].map((pct) => {
                  const x = qcPadLeft + pct * qcPlotW;
                  return <line key={pct} x1={x} y1={qcPadTop} x2={x} y2={qcH - qcPadBot} stroke="#21262d" strokeWidth="0.5" />;
                })}
                {hofCriteria.map((c, i) => {
                  const y = qcPadTop + i * qcSpacing + qcSpacing / 2 - qcBarH / 2;
                  const pct = Math.min(1, c.current / c.threshold);
                  const barW = pct * qcPlotW;
                  const thresholdX = qcPadLeft + qcPlotW;
                  const barColor = pct >= 1 ? '#22c55e' : pct >= 0.5 ? '#f59e0b' : '#ef4444';
                  return (
                    <g key={c.label}>
                      <text x={qcPadLeft - 4} y={y + qcBarH / 2 + 3} textAnchor="end"  fill="#8b949e" fontSize="8">
                        {c.label.length > 16 ? c.label.slice(0, 16) : c.label}
                      </text>
                      <rect x={qcPadLeft} y={y} width={qcPlotW} height={qcBarH} fill="#21262d" rx="3" />
                      <rect x={qcPadLeft} y={y} width={Math.max(1, barW)} height={qcBarH} fill={barColor} rx="3" />
                      <text x={qcPadLeft + Math.max(1, barW) + 4} y={y + qcBarH / 2 + 3} textAnchor="start"  fill={barColor} fontSize="7" fontWeight="bold">
                        {c.current}/{c.threshold}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hall of Fame Class Radar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 2 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Flame className="h-4 w-4 text-emerald-400" />
                HoF Class Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-4">
                <svg width="160" height="160" viewBox="0 0 240 240" className="max-w-[200px] mx-auto">
                  {/* Grid */}
                  <polygon points={hGrid1} fill="none" stroke="#21262d" strokeWidth="0.8" />
                  <polygon points={hGrid2} fill="none" stroke="#21262d" strokeWidth="0.8" />
                  <polygon points={hGrid3} fill="none" stroke="#30363d" strokeWidth="1" />
                  {/* Axis lines */}
                  {hofAxes.map((_, i) => {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const x2 = hRadarCx + hRadarMaxR * Math.cos(angle);
                    const y2 = hRadarCy + hRadarMaxR * Math.sin(angle);
                    return <line key={i} x1={hRadarCx} y1={hRadarCy} x2={x2} y2={y2} stroke="#21262d" strokeWidth="0.5" />;
                  })}
                  {/* Inductee average polygon */}
                  <polygon
                    points={hInducteeData}
                    fill="rgba(59,130,246,0.1)"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeDasharray="4,3"
                  />
                  {/* Player data polygon */}
                  <polygon
                    points={hPlayerData}
                    fill="rgba(34,197,94,0.15)"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Labels */}
                  {hofAxes.map((val, i) => {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const lx = hRadarCx + (hRadarMaxR + 16) * Math.cos(angle);
                    const ly = hRadarCy + (hRadarMaxR + 16) * Math.sin(angle);
                    return (
                      <text key={i} x={lx} y={ly + 3} textAnchor="middle"  fill="#8b949e" fontSize="8" fontWeight="bold">
                        {hRadarLabels[i]}
                      </text>
                    );
                  })}
                </svg>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1.5 rounded-sm bg-emerald-500" />
                      <span className="text-[10px] text-[#c9d1d9]">{playerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1.5 rounded-sm bg-blue-500" style={{ borderStyle: 'dashed' }} />
                      <span className="text-[10px] text-[#8b949e]">Avg HoF Inductee</span>
                    </div>
                  </div>
                  <Separator className="bg-[#30363d]" />
                  <div className="space-y-1.5">
                    {hofCriteria.map((c, i) => {
                      const pct = Math.min(100, Math.round((c.current / c.threshold) * 100));
                      return (
                        <div key={c.label} className="flex items-center justify-between">
                          <span className="text-[9px] text-[#8b949e]">{c.label}</span>
                          <span className="text-[9px] tabular-nums font-bold" style={{ color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* HoF Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 3 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Medal className="h-4 w-4 text-emerald-400" />
                HoF Readiness Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {hofCriteria.map((c) => {
                  const met = c.current >= c.threshold;
                  return (
                    <div key={c.label} className="p-2.5 bg-[#0d1117] rounded-lg border border-[#21262d]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#8b949e]">{c.label}</span>
                        <Badge className="text-[8px] px-1.5 py-0" style={{
                          backgroundColor: met ? '#22c55e20' : '#ef444420',
                          color: met ? '#22c55e' : '#ef4444',
                          border: 'none',
                          fontSize: '8px',
                        }}>
                          {met ? 'MET' : 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold tabular-nums text-[#c9d1d9]">{c.current} <span className="text-[#484f58]">/ {c.threshold}</span></p>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4" style={{ color: hfGaugeColor }} />
                  <span className="text-xs font-bold text-[#c9d1d9]">Overall Verdict</span>
                </div>
                <p className="text-[10px] text-[#8b949e]">
                  {hofProbability >= 75
                    ? `Outstanding career trajectory. ${playerName} is on track for Hall of Fame induction with a strong case across all criteria.`
                    : hofProbability >= 50
                    ? `${playerName} has a solid foundation but needs to continue accumulating goals, trophies, and international experience.`
                    : `${playerName} is still early in their career journey. Focus on developing skills and winning silverware to build a HoF case.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Path to Induction */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 4 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Path to Induction
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {hofCriteria.map((c) => {
                const remaining = Math.max(0, c.threshold - c.current);
                const pct = Math.min(100, Math.round((c.current / c.threshold) * 100));
                const isComplete = pct >= 100;
                const yearsEstimate = remaining > 0 ? Math.ceil(remaining / (c.label.includes('Goals') ? 25 : c.label.includes('Trophies') ? 2 : c.label.includes('Caps') ? 5 : c.label.includes('Longevity') ? 1 : 3)) : 0;
                return (
                  <div key={c.label} className="p-2.5 bg-[#0d1117] rounded-lg border border-[#21262d]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{c.label}</span>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: isComplete ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {isComplete ? 'COMPLETE' : `${pct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden mb-1">
                      <div className="h-full rounded-sm" style={{ width: `${pct}%`, backgroundColor: isComplete ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#484f58]">{c.current} / {c.threshold}</span>
                      <span className="text-[9px] text-[#484f58]">
                        {isComplete ? 'Done' : `~${yearsEstimate} season${yearsEstimate !== 1 ? 's' : ''} remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d] mt-2">
                <p className="text-[10px] text-[#8b949e]">
                  Based on current trajectory, {playerName}{' '}
                  {hofProbability >= 75 ? 'is a strong candidate for first-ballot Hall of Fame induction.' : hofProbability >= 50 ? 'has an outside chance at HoF with continued excellence.' : 'needs significant career milestones to reach HoF consideration.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={A}>
          <Button variant="ghost" size="sm" className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] p-2" onClick={() => setScreen('dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Crown className="h-5 w-5 text-emerald-400" />
            <h1 className="text-base font-bold text-[#c9d1d9]">Legend Status</h1>
          </div>
          <Badge className="text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: legendTierColor + '20', color: legendTierColor, borderColor: legendTierColor + '40', border: '1px solid' }}>
            {legendTier} ({legendScore.toFixed(0)})
          </Badge>
        </motion.div>

        {/* Player info strip */}
        <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D }}>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#c9d1d9] truncate">{playerName}</p>
            <p className="text-[10px] text-[#8b949e]">
              Age {playerAge} &middot; OVR {playerOvr} &middot; Season {currentSeason} &middot; {totalGoals}G {totalAssists}A
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black tabular-nums" style={{ color: legendTierColor }}>{legendScore.toFixed(0)}</p>
            <p className="text-[9px] text-[#484f58]">Legend Score</p>
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#30363d]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors relative"
              style={{
                color: activeTab === tab.id ? '#34d399' : '#8b949e',
                backgroundColor: activeTab === tab.id ? 'rgba(34,197,94,0.05)' : 'transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-400 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'progress' && renderLegendProgressTab()}
          {activeTab === 'comparison' && renderComparisonTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'hof' && renderHoFTab()}
        </div>

        {/* Legend Prediction */}
        <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-[#c9d1d9]">Legend Potential Forecast</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-[#0d1117] rounded-lg border border-[#21262d]">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] font-bold text-[#c9d1d9]">Projected Final Legend Score</p>
                  <p className="text-[9px] text-[#484f58]">Based on current trajectory to age 35</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black tabular-nums" style={{ color: legendTierColor }}>
                  {Math.min(100, Math.round(legendScore + (35 - playerAge) * (totalApps > 0 ? (totalGoals / totalApps) * 2 : 1.5))).toFixed(0)}
                </span>
                <p className="text-[9px] text-[#484f58]">/ 100</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#0d1117] rounded-lg border border-[#21262d] text-center">
                <p className="text-sm font-black tabular-nums text-emerald-400">{Math.max(0, 35 - playerAge)}</p>
                <p className="text-[9px] text-[#484f58]">Seasons Left</p>
              </div>
              <div className="p-2 bg-[#0d1117] rounded-lg border border-[#21262d] text-center">
                <p className="text-sm font-black tabular-nums text-amber-400">{totalApps > 0 ? Math.round(totalGoals / totalApps * 100) / 100 : 0}</p>
                <p className="text-[9px] text-[#484f58]">Goals per Game</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Career Stats Grid */}
        <motion.div className="bg-[#161b22] border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 6 }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-[#c9d1d9]">Detailed Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Goals', value: totalGoals, color: '#22c55e' },
              { label: 'Assists', value: totalAssists, color: '#3b82f6' },
              { label: 'Trophies', value: trophyCount, color: '#f59e0b' },
              { label: 'Caps', value: caps, color: '#a78bfa' },
              { label: 'Apps', value: totalApps, color: '#06b6d4' },
              { label: 'Seasons', value: seasonsPlayed, color: '#ec4899' },
              { label: 'G/A Ratio', value: totalApps > 0 ? ((totalGoals + totalAssists) / totalApps).toFixed(2) : '0.00', color: '#f97316' },
              { label: 'G per Szn', value: seasonsPlayed > 0 ? (totalGoals / seasonsPlayed).toFixed(1) : '0', color: '#22c55e' },
              { label: 'Achievements', value: unlockedAch, color: '#a78bfa' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 bg-[#0d1117] rounded-lg border border-[#21262d]">
                <p className="text-sm font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[9px] text-[#484f58]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats Footer */}
        <motion.div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...A, delay: D * 5 }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-[#c9d1d9]">Career Snapshot</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Goals', value: totalGoals, color: '#22c55e' },
              { label: 'Assists', value: totalAssists, color: '#3b82f6' },
              { label: 'Trophies', value: trophyCount, color: '#f59e0b' },
              { label: 'Caps', value: caps, color: '#a78bfa' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-sm font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[9px] text-[#484f58]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
