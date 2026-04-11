'use client';

import { useGameStore } from '@/store/gameStore';
import { Injury, InjuryType, InjuryCategory } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Heart, AlertTriangle, Clock, Calendar,
  Shield, Zap, Bone, Brain, Thermometer,
  TrendingUp, History, ArrowRight,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================
const severityConfig: Record<InjuryType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  minor: {
    label: 'Minor',
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Zap className="h-4 w-4" />,
  },
  moderate: {
    label: 'Moderate',
    color: '#f97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  severe: {
    label: 'Severe',
    color: '#ef4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <Shield className="h-4 w-4" />,
  },
  career_threatening: {
    label: 'Career-Threatening',
    color: '#dc2626',
    bg: 'bg-red-600/15',
    border: 'border-red-600/40',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

const categoryConfig: Record<InjuryCategory, { icon: React.ReactNode; color: string }> = {
  muscle: { icon: <Activity className="h-3.5 w-3.5" />, color: '#f59e0b' },
  ligament: { icon: <Bone className="h-3.5 w-3.5" />, color: '#ef4444' },
  bone: { icon: <Shield className="h-3.5 w-3.5" />, color: '#8b5cf6' },
  concussion: { icon: <Brain className="h-3.5 w-3.5" />, color: '#06b6d4' },
  illness: { icon: <Thermometer className="h-3.5 w-3.5" />, color: '#ec4899' },
};

// ============================================================
// Main Component
// ============================================================
export default function InjuryReport() {
  const gameState = useGameStore(state => state.gameState);

  if (!gameState) return null;

  const { currentInjury, injuries, currentSeason, currentWeek } = gameState;

  // Season injuries
  const seasonInjuries = injuries.filter(i => i.seasonSustained === currentSeason);
  const careerInjuries = injuries;

  // Stats
  const totalMatchesMissed = seasonInjuries.reduce((sum, i) => sum + i.weeksOut, 0);
  const injuryCount = seasonInjuries.length;
  const mostCommonCategory = getMostCommonCategory(seasonInjuries);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-red-400" />
        <h2 className="text-lg font-bold text-[#c9d1d9]">Injury Report</h2>
      </div>

      {/* Current Injury Status */}
      <AnimatePresence mode="wait">
        {currentInjury ? (
          <motion.div
            key="active-injury"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ActiveInjuryCard injury={currentInjury} currentWeek={currentWeek} />
          </motion.div>
        ) : (
          <motion.div
            key="fit-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-[#161b22] border-emerald-700/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Fully Fit</p>
                    <p className="text-xs text-[#8b949e]">No active injuries. Ready to play.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Season Injury Stats */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Season Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Injuries" value={injuryCount.toString()} color="#ef4444" />
            <StatBox label="Weeks Out" value={totalMatchesMissed.toString()} color="#f59e0b" />
            <StatBox label="Common" value={mostCommonCategory} color="#8b949e" />
          </div>
        </CardContent>
      </Card>

      {/* Injury History */}
      {seasonInjuries.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Season History</span>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {seasonInjuries.slice().reverse().map((injury, idx) => (
                <motion.div
                  key={injury.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                >
                  {/* Category icon */}
                  <div
                    className="p-1.5 rounded-md shrink-0"
                    style={{
                      backgroundColor: `${categoryConfig[injury.category].color}15`,
                      color: categoryConfig[injury.category].color,
                    }}
                  >
                    {categoryConfig[injury.category].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-[#c9d1d9]">{injury.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className="h-3.5 px-1 text-[8px] border-0 rounded"
                        style={{
                          backgroundColor: `${severityConfig[injury.type].color}15`,
                          color: severityConfig[injury.type].color,
                        }}
                      >
                        {severityConfig[injury.type].label}
                      </Badge>
                      <span className="text-[10px] text-[#484f58]">
                        {injury.weeksOut}wk out
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#484f58]">
                      S{injury.seasonSustained} W{injury.weekSustained}
                    </span>
                    {injury.weeksRemaining <= 0 && (
                      <div className="flex items-center gap-0.5 justify-end">
                        <span className="text-[9px] text-emerald-400">Healed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Injury History */}
      {careerInjuries.length > seasonInjuries.length && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Career History</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {careerInjuries
                .filter(i => i.seasonSustained !== currentSeason)
                .slice()
                .reverse()
                .map((injury, idx) => (
                  <div
                    key={injury.id}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                  >
                    <div
                      className="p-1.5 rounded-md shrink-0"
                      style={{
                        backgroundColor: `${categoryConfig[injury.category].color}10`,
                        color: `${categoryConfig[injury.category].color}90`,
                      }}
                    >
                      {categoryConfig[injury.category].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[#8b949e]">{injury.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#484f58]">
                          {severityConfig[injury.type].label} • {injury.weeksOut}wk
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#484f58] shrink-0">
                      S{injury.seasonSustained}
                    </span>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {careerInjuries.length === 0 && !currentInjury && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
            <p className="text-sm text-[#8b949e]">No injuries recorded</p>
            <p className="text-xs text-[#484f58] mt-1">Stay fit and avoid high-intensity training when fatigued</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Active Injury Card
// ============================================================
function ActiveInjuryCard({ injury, currentWeek }: { injury: Injury; currentWeek: number }) {
  const config = severityConfig[injury.type];
  const catConfig = categoryConfig[injury.category];
  const progress = injury.weeksOut > 0 ? ((injury.weeksOut - injury.weeksRemaining) / injury.weeksOut) * 100 : 0;
  const weeksHealed = injury.weeksOut - injury.weeksRemaining;

  return (
    <Card className={`bg-[#161b22] ${config.border} border`}>
      <CardContent className="p-4">
        {/* Severity header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15`, color: config.color }}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: config.color }}>
                {injury.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                className="h-4 px-1.5 text-[9px] border-0 rounded"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                {config.label}
              </Badge>
              <div className="flex items-center gap-0.5" style={{ color: catConfig.color }}>
                {catConfig.icon}
                <span className="text-[10px] capitalize">{injury.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recovery progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Recovery Progress</span>
            <span className="text-xs font-medium" style={{ color: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
              style={{ backgroundColor: progress >= 75 ? '#10b981' : progress >= 50 ? '#f59e0b' : config.color }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#484f58]">{weeksHealed} of {injury.weeksOut} weeks</span>
            <span className="text-[#8b949e]">
              {injury.weeksRemaining <= 0 ? (
                <span className="text-emerald-400">Ready to return</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {injury.weeksRemaining} week{injury.weeksRemaining !== 1 ? 's' : ''} remaining
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Impact info */}
        <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-[#8b949e]">Cannot play matches</span>
          </div>
          {injury.weeksRemaining > 2 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-[#8b949e]">Training limited</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Stat Box
// ============================================================
function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-[#21262d]">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#484f58] mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function getMostCommonCategory(injuries: Injury[]): string {
  if (injuries.length === 0) return '—';
  const counts: Record<string, number> = {};
  for (const i of injuries) {
    counts[i.category] = (counts[i.category] ?? 0) + 1;
  }
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return max ? max[0].charAt(0).toUpperCase() + max[0].slice(1) : '—';
}
