'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/lib/game/types';
import { motion } from 'framer-motion';

// ============================================================
// Badge Types
// ============================================================

type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type BadgeCategory = 'scoring' | 'assisting' | 'defending' | 'career' | 'special' | 'international';

interface BadgeProgress {
  current: number;
  target: number;
  label: string;
}

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  lore: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  progress: BadgeProgress;
  relatedBadgeIds: string[];
  earnedDate: string | null;
}

// ============================================================
// Rarity Configuration
// ============================================================

const RARITY_CONFIG: Record<BadgeRarity, { label: string; color: string; borderColor: string; bgColor: string; textColor: string }> = {
  common:    { label: 'Common',    color: '#8b949e', borderColor: 'border-[#8b949e]/40', bgColor: 'bg-[#8b949e]/10', textColor: 'text-[#8b949e]' },
  uncommon:  { label: 'Uncommon',  color: '#3fb950', borderColor: 'border-[#3fb950]/40', bgColor: 'bg-[#3fb950]/10', textColor: 'text-[#3fb950]' },
  rare:      { label: 'Rare',      color: '#58a6ff', borderColor: 'border-[#58a6ff]/40', bgColor: 'bg-[#58a6ff]/10', textColor: 'text-[#58a6ff]' },
  epic:      { label: 'Epic',      color: '#bc8cff', borderColor: 'border-[#bc8cff]/40', bgColor: 'bg-[#bc8cff]/10', textColor: 'text-[#bc8cff]' },
  legendary: { label: 'Legendary', color: '#d29922', borderColor: 'border-[#d29922]/40', bgColor: 'bg-[#d29922]/10', textColor: 'text-[#d29922]' },
};

const CATEGORY_CONFIG: Record<BadgeCategory, { label: string; icon: string }> = {
  scoring:      { label: 'Scoring',      icon: '⚽' },
  assisting:    { label: 'Assisting',    icon: '👟' },
  defending:    { label: 'Defending',    icon: '🛡️' },
  career:       { label: 'Career',       icon: '🏆' },
  special:      { label: 'Special',      icon: '⭐' },
  international:{ label: 'International', icon: '🌍' },
};

// ============================================================
// Badge SVG Icons (unique per category)
// ============================================================

function BadgeIcon({ category, rarity, size = 40 }: { category: BadgeCategory; rarity: BadgeRarity; size?: number }) {
  const color = RARITY_CONFIG[rarity].color;
  const s = size;

  const icons: Record<BadgeCategory, React.JSX.Element> = {
    scoring: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <path d="M20 6 L22 16 L32 16 L24 22 L27 32 L20 26 L13 32 L16 22 L8 16 L18 16 Z" fill={color} opacity="0.9" />
      </svg>
    ),
    assisting: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <path d="M10 24 L16 18 L22 24 L28 14" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="14" r="3" fill={color} />
      </svg>
    ),
    defending: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <path d="M12 30 L20 8 L28 30 Z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
        <line x1="15" y1="22" x2="25" y2="22" stroke={color} strokeWidth="2" />
      </svg>
    ),
    career: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <rect x="14" y="12" width="12" height="16" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
        <line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="1.5" />
        <line x1="17" y1="19" x2="23" y2="19" stroke={color} strokeWidth="1.5" />
        <line x1="17" y1="22" x2="21" y2="22" stroke={color} strokeWidth="1.5" />
        <circle cx="20" cy="8" r="3" fill={color} />
      </svg>
    ),
    special: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <path d="M20 6 L23 15 L32 15 L25 21 L27 30 L20 24 L13 30 L15 21 L8 15 L17 15 Z" fill={color} opacity="0.8" />
        <circle cx="20" cy="18" r="4" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    international: (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
        <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="1.5" fill="none" />
        <ellipse cx="20" cy="20" rx="5" ry="10" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="8" y1="20" x2="32" y2="20" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
  };

  return icons[category];
}

// ============================================================
// Completion Ring SVG
// ============================================================

function CompletionRing({ earned, total, rarityBreakdown }: { earned: number; total: number; rarityBreakdown: Record<BadgeRarity, { earned: number; total: number }> }) {
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
  const radius = 52;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (pct / 100) * circumference;

  // Build segments by rarity for colored segments
  const segments: { color: string; length: number }[] = [];
  const rarities: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  let offset = 0;
  for (const r of rarities) {
    const count = rarityBreakdown[r].earned;
    if (count > 0) {
      const segLength = (count / total) * circumference;
      segments.push({ color: RARITY_CONFIG[r].color, length: segLength });
      offset += segLength;
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {/* Background ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#21262d"
            strokeWidth={stroke}
          />
          {/* Earned segments */}
          {segments.length > 0 && (() => {
            let dashOffset = -25; // start from top
            return segments.map((seg, i) => {
              const el = (
                <circle
                  key={i}
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  opacity="0.85"
                />
              );
              dashOffset -= seg.length;
              return el;
            });
          })()}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#c9d1d9]">{pct}%</span>
          <span className="text-[10px] text-[#8b949e]">{earned}/{total}</span>
        </div>
      </div>
      <span className="text-[10px] text-[#8b949e] mt-1.5 font-medium">Collection Complete</span>
    </div>
  );
}

// ============================================================
// Category Tabs
// ============================================================

function CategoryTabs({ active, onChange }: { active: BadgeCategory | 'all'; onChange: (c: BadgeCategory | 'all') => void }) {
  const allCats: (BadgeCategory | 'all')[] = ['all', 'scoring', 'assisting', 'defending', 'career', 'special', 'international'];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {allCats.map(cat => {
        const isActive = active === cat;
        const cfg = cat === 'all'
          ? { label: 'All', icon: '📋' }
          : CATEGORY_CONFIG[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#484f58] hover:text-[#c9d1d9]'
            }`}
          >
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Badge Card
// ============================================================

function BadgeCard({ badge, onClick }: { badge: BadgeDef; onClick: () => void }) {
  const isEarned = badge.earnedDate !== null;
  const progressPct = badge.progress.target > 0
    ? Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100))
    : 0;
  const rarityCfg = RARITY_CONFIG[badge.rarity];

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`relative w-full text-left p-3 rounded-lg border transition-colors ${rarityCfg.borderColor} ${
        isEarned ? 'bg-[#161b22]' : 'bg-[#0d1117]'
      } hover:bg-[#1c2129]`}
    >
      {/* Rarity tier dot */}
      <div className="absolute top-2 right-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: rarityCfg.color }}
        />
      </div>

      {/* Badge icon */}
      <div className="flex justify-center mb-2">
        <div className={isEarned ? '' : 'opacity-30'}>
          <BadgeIcon category={badge.category} rarity={badge.rarity} size={36} />
        </div>
      </div>

      {/* Badge name */}
      <p className={`text-xs font-semibold text-center truncate ${isEarned ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
        {badge.name}
      </p>

      {/* Rarity label */}
      <p className={`text-[10px] text-center mt-0.5 ${rarityCfg.textColor}`}>
        {rarityCfg.label}
      </p>

      {/* Progress or earned date */}
      {isEarned ? (
        <p className="text-[9px] text-emerald-400/70 text-center mt-1.5">
          {badge.earnedDate}
        </p>
      ) : (
        <div className="mt-1.5">
          <div className="flex justify-between text-[9px] text-[#484f58] mb-0.5">
            <span>{badge.progress.current}/{badge.progress.target}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full h-1 bg-[#21262d] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: rarityCfg.color }}
            />
          </div>
        </div>
      )}

      {/* Locked overlay for 0% progress */}
      {!isEarned && badge.progress.current === 0 && (
        <div className="absolute inset-0 bg-[#0d1117]/60 rounded-lg flex items-center justify-center">
          <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">Locked</span>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Badge Detail View
// ============================================================

function BadgeDetailView({ badge, onClose, allBadges }: { badge: BadgeDef; onClose: () => void; allBadges: BadgeDef[] }) {
  const isEarned = badge.earnedDate !== null;
  const progressPct = badge.progress.target > 0
    ? Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100))
    : 0;
  const rarityCfg = RARITY_CONFIG[badge.rarity];
  const catCfg = CATEGORY_CONFIG[badge.category];

  const relatedBadges = allBadges.filter(b => badge.relatedBadgeIds.includes(b.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#161b22] border border-[#30363d] rounded-t-xl sm:rounded-xl mx-auto mb-0 sm:mb-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors z-10"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="p-5 pt-4">
          {/* Large badge icon */}
          <div className="flex flex-col items-center mb-4">
            <div className={`mb-3 ${isEarned ? '' : 'opacity-30'}`}>
              <BadgeIcon category={badge.category} rarity={badge.rarity} size={72} />
            </div>
            <h3 className={`text-lg font-bold ${isEarned ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
              {badge.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${rarityCfg.bgColor} ${rarityCfg.textColor}`}>
                {rarityCfg.label}
              </span>
              <span className="text-[10px] text-[#8b949e]">
                {catCfg.icon} {catCfg.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
            <p className="text-xs text-[#c9d1d9]">{badge.description}</p>
          </div>

          {/* Lore text */}
          <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-1">Lore</p>
            <p className="text-xs text-[#8b949e] italic leading-relaxed">{badge.lore}</p>
          </div>

          {/* Progress tracker */}
          <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Progress</p>
            <div className="flex justify-between text-sm mb-1.5">
              <span className={`font-bold ${isEarned ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                {badge.progress.label}: {badge.progress.current}/{badge.progress.target}
              </span>
              <span className="text-[#8b949e]">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: rarityCfg.color }}
              />
            </div>
            {isEarned && (
              <p className="text-[10px] text-emerald-400 mt-1.5 text-center font-medium">
                Earned: {badge.earnedDate}
              </p>
            )}
          </div>

          {/* How to Unlock hint */}
          {!isEarned && (
            <div className="bg-[#0d1117] rounded-lg p-3 mb-3">
              <p className="text-[10px] font-semibold text-[#d29922] uppercase tracking-wider mb-1">How to Unlock</p>
              <p className="text-xs text-[#8b949e]">
                {badge.progress.current > 0
                  ? `Keep going! You need ${badge.progress.target - badge.progress.current} more to earn this badge.`
                  : `Reach ${badge.progress.target} ${badge.progress.label.toLowerCase()} to unlock this ${rarityCfg.label.toLowerCase()} badge.`}
              </p>
            </div>
          )}

          {/* Related badges */}
          {relatedBadges.length > 0 && (
            <div className="bg-[#0d1117] rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Related Badges</p>
              <div className="grid grid-cols-3 gap-2">
                {relatedBadges.map(rb => (
                  <div
                    key={rb.id}
                    className={`flex flex-col items-center p-2 rounded-lg border ${RARITY_CONFIG[rb.rarity].borderColor} ${
                      rb.earnedDate ? 'bg-[#161b22]' : 'bg-[#0d1117] opacity-50'
                    }`}
                  >
                    <div className={rb.earnedDate ? '' : 'opacity-40'}>
                      <BadgeIcon category={rb.category} rarity={rb.rarity} size={24} />
                    </div>
                    <span className="text-[9px] text-[#8b949e] mt-1 text-center truncate w-full">{rb.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Recent Unlocks
// ============================================================

function RecentUnlocks({ badges }: { badges: BadgeDef[] }) {
  const recent = badges
    .filter(b => b.earnedDate !== null)
    .sort((a, b) => (b.earnedDate ?? '').localeCompare(a.earnedDate ?? ''))
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="#d29922" strokeWidth="1.5" fill="none" />
          <path d="M7 3 L8.5 6 L11.5 6.5 L9.2 8.7 L9.8 11.5 L7 10 L4.2 11.5 L4.8 8.7 L2.5 6.5 L5.5 6 Z" fill="#d29922" opacity="0.8" />
        </svg>
        <span className="text-xs font-semibold text-[#c9d1d9]">Recent Unlocks</span>
      </div>
      <div className="space-y-1.5">
        {recent.map((badge, idx) => {
          const rarityCfg = RARITY_CONFIG[badge.rarity];
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2"
            >
              <div className="flex-shrink-0">
                <BadgeIcon category={badge.category} rarity={badge.rarity} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#c9d1d9] truncate">{badge.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] ${rarityCfg.textColor}`}>{rarityCfg.label}</span>
                  <span className="text-[9px] text-[#484f58]">{badge.earnedDate}</span>
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-emerald-400">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M3.5 6 L5.5 8 L8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Generate all badges deterministically from game state
// ============================================================

function generateBadges(gameState: GameState | null): BadgeDef[] {
  if (!gameState) return [];

  const { player, internationalCareer, seasons, recentResults, achievements } = gameState;
  const careerStats = player.careerStats;
  const goals = careerStats.totalGoals;
  const assists = careerStats.totalAssists;
  const cleanSheets = careerStats.totalCleanSheets;
  const appearances = careerStats.totalAppearances;
  const trophies = careerStats.trophies.length;
  const totalSeasons = careerStats.seasonsPlayed;
  const overall = player.overall;
  const age = player.age;
  const caps = internationalCareer?.caps ?? 0;
  const intlGoals = internationalCareer?.goals ?? 0;
  const intlAssists = internationalCareer?.assists ?? 0;
  const tournaments = internationalCareer?.tournaments?.length ?? 0;
  const totalAchievements = achievements.filter(a => a.unlocked).length;

  // Determine earned dates (deterministic based on thresholds)
  const earned = (condition: boolean, season?: number): string | null => {
    if (!condition) return null;
    // Assign a plausible earned date based on when the milestone was reached
    const s = season ?? totalSeasons;
    const y = 2024 + s;
    const m = Math.min(12, Math.max(1, ((goals + assists) % 12) + 1));
    const d = Math.min(28, Math.max(1, ((appearances + trophies) % 28) + 1));
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Count hat-tricks from recent results
  const hatTricks = recentResults.filter(r => r.playerGoals >= 3).length;

  const badges: BadgeDef[] = [
    // ── SCORING ──
    {
      id: 'first_goal_10',
      name: 'First Decade',
      description: 'Score your first 10 career goals. Every legend starts somewhere.',
      lore: 'The first ten goals mark the transition from hopeful to proven. Fans begin to learn your name.',
      category: 'scoring',
      rarity: 'common',
      progress: { current: goals, target: 10, label: 'Goals' },
      relatedBadgeIds: ['first_goal_50'],
      earnedDate: earned(goals >= 10, 1),
    },
    {
      id: 'first_goal_50',
      name: 'Half Century',
      description: 'Reach 50 career goals. A milestone that separates good players from great ones.',
      lore: 'Fifty goals means you\'ve found the net in every conceivable way. Defenders know your name now.',
      category: 'scoring',
      rarity: 'uncommon',
      progress: { current: goals, target: 50, label: 'Goals' },
      relatedBadgeIds: ['first_goal_10', 'first_goal_100'],
      earnedDate: earned(goals >= 50, 2),
    },
    {
      id: 'first_goal_100',
      name: 'Century Club',
      description: 'Score 100 career goals. You\'ve joined an exclusive group of prolific marksmen.',
      lore: 'Only a fraction of players ever reach triple digits. Your name is etched in club history.',
      category: 'scoring',
      rarity: 'rare',
      progress: { current: goals, target: 100, label: 'Goals' },
      relatedBadgeIds: ['first_goal_50', 'first_goal_250'],
      earnedDate: earned(goals >= 100, 3),
    },
    {
      id: 'first_goal_250',
      name: 'Elite Striker',
      description: 'Score 250 career goals. You are one of the most feared strikers in the game.',
      lore: 'Two hundred and fifty goals. Stadiums fall silent when you receive the ball. Legends whisper your name.',
      category: 'scoring',
      rarity: 'epic',
      progress: { current: goals, target: 250, label: 'Goals' },
      relatedBadgeIds: ['first_goal_100', 'first_goal_500'],
      earnedDate: earned(goals >= 250, 4),
    },
    {
      id: 'first_goal_500',
      name: 'Immortal Finisher',
      description: 'Score 500 career goals. The pinnacle of goalscoring achievement.',
      lore: 'Five hundred goals. A feat achieved by the greatest to ever play the game. Your legacy is immortal.',
      category: 'scoring',
      rarity: 'legendary',
      progress: { current: goals, target: 500, label: 'Goals' },
      relatedBadgeIds: ['first_goal_250'],
      earnedDate: earned(goals >= 500, 5),
    },

    // ── ASSISTING ──
    {
      id: 'assist_10',
      name: 'Playmaker Spark',
      description: 'Record 10 career assists. A creative mind begins to bloom.',
      lore: 'The first assists reveal a player who sees the game differently. Teammates start running for your passes.',
      category: 'assisting',
      rarity: 'common',
      progress: { current: assists, target: 10, label: 'Assists' },
      relatedBadgeIds: ['assist_50'],
      earnedDate: earned(assists >= 10, 1),
    },
    {
      id: 'assist_50',
      name: 'Creative Maestro',
      description: 'Record 50 career assists. Your vision sets up goal after goal.',
      lore: 'Fifty assists means you\'ve created fifty moments of joy for teammates and fans alike.',
      category: 'assisting',
      rarity: 'uncommon',
      progress: { current: assists, target: 50, label: 'Assists' },
      relatedBadgeIds: ['assist_10', 'assist_100'],
      earnedDate: earned(assists >= 50, 2),
    },
    {
      id: 'assist_100',
      name: 'Hundred Creations',
      description: 'Record 100 career assists. A century of creativity.',
      lore: 'One hundred goals created from nothing. You are the architect of beautiful football.',
      category: 'assisting',
      rarity: 'rare',
      progress: { current: assists, target: 100, label: 'Assists' },
      relatedBadgeIds: ['assist_50', 'assist_200'],
      earnedDate: earned(assists >= 100, 3),
    },
    {
      id: 'assist_200',
      name: 'Assist King',
      description: 'Record 200 career assists. The ultimate playmaker achievement.',
      lore: 'Two hundred assists. You don\'t just play football — you compose it.',
      category: 'assisting',
      rarity: 'epic',
      progress: { current: assists, target: 200, label: 'Assists' },
      relatedBadgeIds: ['assist_100'],
      earnedDate: earned(assists >= 200, 4),
    },

    // ── DEFENDING ──
    {
      id: 'clean_sheet_10',
      name: 'Solid Foundation',
      description: 'Keep 10 career clean sheets. The defense holds firm.',
      lore: 'Ten clean sheets. The foundation of every great team is built on moments like these.',
      category: 'defending',
      rarity: 'common',
      progress: { current: cleanSheets, target: 10, label: 'Clean Sheets' },
      relatedBadgeIds: ['clean_sheet_30'],
      earnedDate: earned(cleanSheets >= 10, 1),
    },
    {
      id: 'clean_sheet_30',
      name: 'Defensive Wall',
      description: 'Keep 30 career clean sheets. Opponents struggle to break through.',
      lore: 'Thirty shutouts. Strikers dread facing a backline you\'re part of.',
      category: 'defending',
      rarity: 'uncommon',
      progress: { current: cleanSheets, target: 30, label: 'Clean Sheets' },
      relatedBadgeIds: ['clean_sheet_10', 'clean_sheet_75'],
      earnedDate: earned(cleanSheets >= 30, 2),
    },
    {
      id: 'clean_sheet_75',
      name: 'Impenetrable',
      description: 'Keep 75 career clean sheets. A fortress that rarely falls.',
      lore: 'Seventy-five clean sheets. You\'ve kept the opposition at bay time and time again.',
      category: 'defending',
      rarity: 'rare',
      progress: { current: cleanSheets, target: 75, label: 'Clean Sheets' },
      relatedBadgeIds: ['clean_sheet_30'],
      earnedDate: earned(cleanSheets >= 75, 3),
    },

    // ── CAREER ──
    {
      id: 'debut_match',
      name: 'Professional Debut',
      description: 'Make your professional debut. The journey of a thousand miles begins with a single step.',
      lore: 'Walking onto the pitch for the first time, every dream you ever had crystallizes into reality.',
      category: 'career',
      rarity: 'common',
      progress: { current: appearances, target: 1, label: 'Appearances' },
      relatedBadgeIds: ['apps_100', 'apps_250'],
      earnedDate: earned(appearances >= 1, 1),
    },
    {
      id: 'apps_100',
      name: 'Centurion',
      description: 'Make 100 career appearances. Consistency is the mark of a true professional.',
      lore: 'One hundred matches. Through injuries, slumps, and triumphs, you always answered the call.',
      category: 'career',
      rarity: 'uncommon',
      progress: { current: appearances, target: 100, label: 'Appearances' },
      relatedBadgeIds: ['debut_match', 'apps_250'],
      earnedDate: earned(appearances >= 100, 3),
    },
    {
      id: 'apps_250',
      name: 'Evergreen',
      description: 'Make 250 career appearances. A career defined by longevity.',
      lore: 'Two hundred and fifty appearances. Year after year, you lace up the boots and deliver.',
      category: 'career',
      rarity: 'rare',
      progress: { current: appearances, target: 250, label: 'Appearances' },
      relatedBadgeIds: ['apps_100'],
      earnedDate: earned(appearances >= 250, 5),
    },
    {
      id: 'seasons_5',
      name: 'Seasoned Pro',
      description: 'Complete 5 seasons as a professional. Time flies when you\'re playing.',
      lore: 'Five seasons in the books. You\'ve seen the game evolve and evolved with it.',
      category: 'career',
      rarity: 'common',
      progress: { current: totalSeasons, target: 5, label: 'Seasons' },
      relatedBadgeIds: ['seasons_10'],
      earnedDate: earned(totalSeasons >= 5, 5),
    },
    {
      id: 'seasons_10',
      name: 'One-Club Legend',
      description: 'Complete 10 seasons. A decade of dedication to the beautiful game.',
      lore: 'Ten seasons. You\'ve become part of the fabric of the club. Young players look up to you.',
      category: 'career',
      rarity: 'rare',
      progress: { current: totalSeasons, target: 10, label: 'Seasons' },
      relatedBadgeIds: ['seasons_5'],
      earnedDate: earned(totalSeasons >= 10, 10),
    },
    {
      id: 'overall_85',
      name: 'World Class Talent',
      description: 'Reach an overall rating of 85. You\'re among the elite.',
      lore: 'Eighty-five overall. Scouts from the biggest clubs start making inquiries about you.',
      category: 'career',
      rarity: 'epic',
      progress: { current: overall, target: 85, label: 'Overall Rating' },
      relatedBadgeIds: ['overall_90'],
      earnedDate: earned(overall >= 85, 2),
    },
    {
      id: 'overall_90',
      name: 'Global Icon',
      description: 'Reach an overall rating of 90. The world recognises your greatness.',
      lore: 'Ninety overall. You are mentioned in the same breath as the all-time greats.',
      category: 'career',
      rarity: 'legendary',
      progress: { current: overall, target: 90, label: 'Overall Rating' },
      relatedBadgeIds: ['overall_85'],
      earnedDate: earned(overall >= 90, 3),
    },

    // ── SPECIAL ──
    {
      id: 'hat_trick_1',
      name: 'Hat-Trick Hero',
      description: 'Score a hat-trick in a single match. Three goals, one unforgettable performance.',
      lore: 'The hat-trick. Every striker dreams of it. When the third hits the net, the crowd erupts.',
      category: 'special',
      rarity: 'rare',
      progress: { current: hatTricks, target: 1, label: 'Hat-Tricks' },
      relatedBadgeIds: ['hat_trick_5'],
      earnedDate: earned(hatTricks >= 1, 2),
    },
    {
      id: 'hat_trick_5',
      name: 'Hat-Trick Specialist',
      description: 'Score 5 career hat-tricks. You make the extraordinary routine.',
      lore: 'Five hat-tricks. When you\'re in form, no defense can contain you.',
      category: 'special',
      rarity: 'epic',
      progress: { current: hatTricks, target: 5, label: 'Hat-Tricks' },
      relatedBadgeIds: ['hat_trick_1'],
      earnedDate: earned(hatTricks >= 5, 4),
    },
    {
      id: 'trophy_1',
      name: 'First Trophy',
      description: 'Win your first trophy. The taste of silverware is addictive.',
      lore: 'Lifting the trophy for the first time. The confetti, the cheers, the tears. Nothing compares.',
      category: 'special',
      rarity: 'uncommon',
      progress: { current: trophies, target: 1, label: 'Trophies' },
      relatedBadgeIds: ['trophy_5'],
      earnedDate: earned(trophies >= 1, 2),
    },
    {
      id: 'trophy_5',
      name: 'Trophy Hunter',
      description: 'Win 5 trophies. Your cabinet is starting to fill up.',
      lore: 'Five trophies and counting. You play for silverware and deliver season after season.',
      category: 'special',
      rarity: 'rare',
      progress: { current: trophies, target: 5, label: 'Trophies' },
      relatedBadgeIds: ['trophy_1', 'trophy_15'],
      earnedDate: earned(trophies >= 5, 4),
    },
    {
      id: 'trophy_15',
      name: 'Silverware Dynasty',
      description: 'Win 15 trophies. A dynasty of success.',
      lore: 'Fifteen trophies. You\'ve built an empire of success that will be remembered for generations.',
      category: 'special',
      rarity: 'legendary',
      progress: { current: trophies, target: 15, label: 'Trophies' },
      relatedBadgeIds: ['trophy_5'],
      earnedDate: earned(trophies >= 15, 6),
    },
    {
      id: 'achievements_5',
      name: 'Achiever',
      description: 'Unlock 5 in-game achievements. A well-rounded player.',
      lore: 'Five achievements unlocked. Your versatility on and off the pitch is unmatched.',
      category: 'special',
      rarity: 'common',
      progress: { current: totalAchievements, target: 5, label: 'Achievements' },
      relatedBadgeIds: ['achievements_12'],
      earnedDate: earned(totalAchievements >= 5, 2),
    },
    {
      id: 'achievements_12',
      name: 'Completionist',
      description: 'Unlock all 12 in-game achievements. The ultimate overachiever.',
      lore: 'Every achievement collected. You\'ve mastered every aspect of the beautiful game.',
      category: 'special',
      rarity: 'legendary',
      progress: { current: totalAchievements, target: 12, label: 'Achievements' },
      relatedBadgeIds: ['achievements_5'],
      earnedDate: earned(totalAchievements >= 12, 5),
    },

    // ── INTERNATIONAL ──
    {
      id: 'intl_debut',
      name: 'International Debut',
      description: 'Earn your first international cap. Representing your country.',
      lore: 'Hearing your national anthem before kick-off. Nothing in football compares to this feeling.',
      category: 'international',
      rarity: 'uncommon',
      progress: { current: caps, target: 1, label: 'Caps' },
      relatedBadgeIds: ['intl_caps_25', 'intl_goal'],
      earnedDate: earned(caps >= 1, 3),
    },
    {
      id: 'intl_caps_25',
      name: 'National Regular',
      description: 'Earn 25 international caps. A fixture in the national team.',
      lore: 'Twenty-five caps. You\'ve become an integral part of your country\'s footballing identity.',
      category: 'international',
      rarity: 'rare',
      progress: { current: caps, target: 25, label: 'Caps' },
      relatedBadgeIds: ['intl_debut', 'intl_caps_75'],
      earnedDate: earned(caps >= 25, 5),
    },
    {
      id: 'intl_caps_75',
      name: 'National Legend',
      description: 'Earn 75 international caps. One of your country\'s greatest servants.',
      lore: 'Seventy-five appearances for your country. Generations will remember your contributions.',
      category: 'international',
      rarity: 'epic',
      progress: { current: caps, target: 75, label: 'Caps' },
      relatedBadgeIds: ['intl_caps_25'],
      earnedDate: earned(caps >= 75, 7),
    },
    {
      id: 'intl_goal',
      name: 'National Scorer',
      description: 'Score your first international goal. Glory for your country.',
      lore: 'The net bulges and a nation erupts. Your name is on everyone\'s lips tonight.',
      category: 'international',
      rarity: 'uncommon',
      progress: { current: intlGoals, target: 1, label: 'International Goals' },
      relatedBadgeIds: ['intl_debut', 'intl_goals_15'],
      earnedDate: earned(intlGoals >= 1, 3),
    },
    {
      id: 'intl_goals_15',
      name: 'International Marksman',
      description: 'Score 15 international goals. A prolific scorer for your country.',
      lore: 'Fifteen goals on the international stage. You deliver when your country needs you most.',
      category: 'international',
      rarity: 'rare',
      progress: { current: intlGoals, target: 15, label: 'International Goals' },
      relatedBadgeIds: ['intl_goal'],
      earnedDate: earned(intlGoals >= 15, 5),
    },
    {
      id: 'intl_tournament',
      name: 'Tournament Debut',
      description: 'Participate in an international tournament. The world stage awaits.',
      lore: 'The tournament draw is announced, and your country is on the list. The adventure begins.',
      category: 'international',
      rarity: 'rare',
      progress: { current: tournaments, target: 1, label: 'Tournaments' },
      relatedBadgeIds: ['intl_debut'],
      earnedDate: earned(tournaments >= 1, 4),
    },
  ];

  return badges;
}

// ============================================================
// Main BadgeCollection Component
// ============================================================

export default function BadgeCollection() {
  const gameState = useGameStore(state => state.gameState);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

  const allBadges = useMemo(() => generateBadges(gameState), [gameState]);

  // Filtered badges by category
  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return allBadges;
    return allBadges.filter(b => b.category === activeCategory);
  }, [allBadges, activeCategory]);

  // Stats
  const stats = useMemo(() => {
    const earned = allBadges.filter(b => b.earnedDate !== null);
    const total = allBadges.length;
    const rarityBreakdown: Record<BadgeRarity, { earned: number; total: number }> = {
      common: { earned: 0, total: 0 },
      uncommon: { earned: 0, total: 0 },
      rare: { earned: 0, total: 0 },
      epic: { earned: 0, total: 0 },
      legendary: { earned: 0, total: 0 },
    };

    for (const b of allBadges) {
      rarityBreakdown[b.rarity].total++;
      if (b.earnedDate) rarityBreakdown[b.rarity].earned++;
    }

    const completionPct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

    return { earnedCount: earned.length, total, rarityBreakdown, completionPct };
  }, [allBadges]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[#8b949e]">No career data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#3fb950" strokeWidth="1.5" fill="none" />
                <path d="M10 4 L11.5 7.5 L15.5 8 L12.5 10.5 L13 14.5 L10 12.5 L7 14.5 L7.5 10.5 L4.5 8 L8.5 7.5 Z" fill="#3fb950" opacity="0.8" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#c9d1d9]">Badge Collection</h1>
              <p className="text-[10px] text-[#8b949e]">Earn badges by reaching career milestones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Recent Unlocks */}
        <RecentUnlocks badges={allBadges} />

        {/* Overview Stats: 3-column grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Total Badges */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-emerald-400">{stats.earnedCount}</span>
            <span className="text-[9px] text-[#8b949e] font-medium">of {stats.total} earned</span>
          </div>

          {/* Rarity Breakdown */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2">
            <span className="text-[9px] text-[#8b949e] font-semibold block text-center mb-1.5">Rarity</span>
            <div className="space-y-0.5">
              {(Object.keys(RARITY_CONFIG) as BadgeRarity[]).map(r => {
                const rd = stats.rarityBreakdown[r];
                if (rd.total === 0) return null;
                const cfg = RARITY_CONFIG[r];
                return (
                  <div key={r} className="flex items-center justify-between gap-1">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[8px] text-[#8b949e] flex-1">{cfg.label.substring(0, 3)}</span>
                    <span className="text-[8px] text-[#484f58]">{rd.earned}/{rd.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Ring */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-2 flex items-center justify-center">
            <CompletionRing
              earned={stats.earnedCount}
              total={stats.total}
              rarityBreakdown={stats.rarityBreakdown}
            />
          </div>
        </div>

        {/* Completion percentage bar */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#c9d1d9]">Collection Progress</span>
            <span className="text-xs font-bold text-emerald-400">{stats.completionPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#21262d] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-700 bg-emerald-500"
              style={{ width: `${stats.completionPct}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

        {/* Badge Grid: 4 columns */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {filteredBadges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.5) }}
            >
              <BadgeCard badge={badge} onClick={() => setSelectedBadge(badge)} />
            </motion.div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#30363d" strokeWidth="1.5" fill="none" />
              <path d="M16 8 L18 13 L23 13.5 L19.5 16 L20.5 21 L16 18.5 L11.5 21 L12.5 16 L9 13.5 L14 13 Z" stroke="#30363d" strokeWidth="1" fill="none" />
            </svg>
            <span className="text-xs mt-2">No badges in this category</span>
          </div>
        )}

        {/* Filtered count */}
        <div className="text-center mt-4 mb-8">
          <span className="text-[10px] text-[#484f58]">
            Showing {filteredBadges.filter(b => b.earnedDate).length} earned of {filteredBadges.length} badges
          </span>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailView
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          allBadges={allBadges}
        />
      )}
    </div>
  );
}
