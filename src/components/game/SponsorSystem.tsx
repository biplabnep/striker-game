'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';

// ============================================================
// Seeded random helpers — deterministic from season/week
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

// ============================================================
// Currency formatters
// ============================================================
function fmtCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `€${m.toFixed(1)}M` : `€${m.toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(1)}K`;
  }
  return `€${value.toFixed(0)}`;
}

function fmtFollowers(count: number): string {
  if (count >= 1_000_000) {
    const m = count / 1_000_000;
    return `${m.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// ============================================================
// Sponsor category types
// ============================================================
type SponsorCategory = 'Sportswear' | 'Energy Drink' | 'Watch' | 'Tech' | 'Automotive' | 'Food & Beverage';
type SponsorTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
type SponsorEndReason = 'Contract Expired' | 'Terminated' | 'Upgrade';
type EventType = 'Photo Shoot' | 'TV Commercial' | 'Charity Event' | 'Social Media Campaign' | 'Product Launch';

// ============================================================
// Sponsor data interfaces
// ============================================================
interface SponsorDeal {
  id: string;
  brand: string;
  category: SponsorCategory;
  tier: SponsorTier;
  annualValue: number;
  contractYears: number;
  yearsRemaining: number;
  totalValue: number;
  hasPerformanceClause: boolean;
  clauseDescription: string;
  color: string;
}

interface SponsorOffer {
  id: string;
  brand: string;
  category: SponsorCategory;
  tier: SponsorTier;
  annualValue: number;
  contractYears: number;
  totalValue: number;
  minOVR: number;
  minFollowers: number;
  minMarketValue: number;
  exclusivityConflict?: string;
  color: string;
}

interface SponsorHistoryEntry {
  id: string;
  brand: string;
  category: SponsorCategory;
  totalEarned: number;
  yearsActive: number;
  endReason: SponsorEndReason;
  rating: number;
  color: string;
}

interface SocialPlatform {
  name: string;
  followers: number;
  engagementRate: number;
  color: string;
  iconPath: string;
}

interface EndorsementEvent {
  id: string;
  type: EventType;
  brand: string;
  description: string;
  coinReward: number;
  reputationReward: number;
  timeCommitment: string;
  season: string;
  color: string;
}

// ============================================================
// Tier config helpers
// ============================================================
const TIER_COLORS: Record<SponsorTier, { bg: string; text: string; border: string; dot: string }> = {
  Platinum: { bg: 'bg-slate-800/60', text: 'text-slate-200', border: 'border-slate-500/40', dot: 'bg-slate-300' },
  Gold:     { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-700/40', dot: 'bg-amber-400' },
  Silver:   { bg: 'bg-gray-800/60',  text: 'text-gray-300',  border: 'border-gray-500/40',  dot: 'bg-gray-400' },
  Bronze:   { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-700/40', dot: 'bg-orange-400' },
};

function getSponsorRating(tiers: SponsorTier[]): string {
  if (tiers.includes('Platinum')) return 'A+';
  if (tiers.includes('Gold')) return 'A';
  if (tiers.filter(t => t === 'Silver').length >= 2) return 'B+';
  if (tiers.includes('Silver')) return 'B';
  if (tiers.filter(t => t === 'Bronze').length >= 2) return 'C+';
  if (tiers.includes('Bronze')) return 'C';
  return 'D';
}

function getRatingColor(rating: string): string {
  if (rating.startsWith('A')) return 'text-emerald-400';
  if (rating.startsWith('B')) return 'text-amber-400';
  if (rating.startsWith('C')) return 'text-orange-400';
  return 'text-red-400';
}

// ============================================================
// Category icon SVG paths
// ============================================================
function getCategoryIcon(category: SponsorCategory, className: string): React.ReactNode {
  switch (category) {
    case 'Sportswear':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <path d="M6.5 8h11" />
          <path d="M7 8l-2 9h14l-2-9" />
          <path d="M12 17v3" />
        </svg>
      );
    case 'Energy Drink':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8l1 7H7l1-7z" />
          <rect x="7" y="9" width="10" height="10" rx="1" />
          <path d="M10 14h4" />
          <path d="M12 12v4" />
        </svg>
      );
    case 'Watch':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="6" />
          <path d="M12 9v3l2 1" />
          <path d="M9 2h6l-1 4H10L9 2z" />
          <path d="M9 22h6l-1-4H10l1 4z" />
        </svg>
      );
    case 'Tech':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
          <path d="M8 6h8" />
        </svg>
      );
    case 'Automotive':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14" />
          <path d="M6 17l-1-5h14l-1 5" />
          <circle cx="7.5" cy="17" r="2" />
          <circle cx="16.5" cy="17" r="2" />
          <path d="M8 12h8l-1-4H9l-1 4z" />
        </svg>
      );
    case 'Food & Beverage':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2l-5 7v6" />
          <path d="M16 9h5" />
        </svg>
      );
  }
}

// ============================================================
// Star rating component
// ============================================================
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`h-3 w-3 ${i < rating ? 'text-amber-400' : 'text-[#30363d]'}`}
          viewBox="0 0 24 24"
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ============================================================
// Sponsor logo placeholder
// ============================================================
function SponsorLogo({ initial, color }: { initial: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}22`, border: `1px solid ${color}44` }}
    >
      <span className="text-sm font-bold" style={{ color }}>{initial}</span>
    </div>
  );
}

// ============================================================
// Generate deterministic sponsor data based on player state
// ============================================================
function generateActiveSponsors(seed: number, reputation: number): SponsorDeal[] {
  const sponsors: SponsorDeal[] = [];
  const tierPool: SponsorTier[] = reputation >= 70
    ? ['Platinum', 'Gold', 'Gold', 'Silver']
    : reputation >= 50
      ? ['Gold', 'Silver', 'Silver', 'Bronze']
      : ['Silver', 'Bronze', 'Bronze', 'Bronze'];

  const brandData = [
    { brand: 'Nike', category: 'Sportswear' as SponsorCategory, color: '#f97316' },
    { brand: 'Red Bull', category: 'Energy Drink' as SponsorCategory, color: '#ef4444' },
    { brand: 'Rolex', category: 'Watch' as SponsorCategory, color: '#a8a29e' },
  ];

  const count = reputation >= 70 ? 4 : reputation >= 40 ? 3 : reputation >= 20 ? 2 : 1;

  for (let i = 0; i < Math.min(count, brandData.length); i++) {
    const bd = brandData[i];
    const tier = tierPool[i] || 'Bronze';
    const years = seededInt(seed + i * 17, 2, 4);
    const yearsRemaining = seededInt(seed + i * 31, 1, years);
    const baseValue = tier === 'Platinum' ? 4000000 : tier === 'Gold' ? 2000000 : tier === 'Silver' ? 800000 : 300000;
    const annualValue = Math.round(baseValue * seededRange(seed + i * 53, 0.8, 1.4) * (reputation / 100 + 0.3));

    sponsors.push({
      id: `sponsor-active-${i}`,
      brand: bd.brand,
      category: bd.category,
      tier,
      annualValue,
      contractYears: years,
      yearsRemaining,
      totalValue: annualValue * years,
      hasPerformanceClause: seededRandom(seed + i * 71) > 0.4,
      clauseDescription: tier === 'Platinum'
        ? 'Ballon d\'Or Top 3 bonus'
        : tier === 'Gold'
          ? '10+ goals per season bonus'
          : 'Starting XI appearance bonus',
      color: bd.color,
    });
  }

  return sponsors;
}

function generateAvailableOffers(seed: number, reputation: number, activeBrands: string[]): SponsorOffer[] {
  const allOffers: { brand: string; category: SponsorCategory; color: string; exclusivityGroup?: string }[] = [
    { brand: 'Adidas', category: 'Sportswear', color: '#3b82f6', exclusivityGroup: 'sportswear' },
    { brand: 'Puma', category: 'Sportswear', color: '#22c55e', exclusivityGroup: 'sportswear' },
    { brand: 'Monster Energy', category: 'Energy Drink', color: '#16a34a', exclusivityGroup: 'energy' },
    { brand: 'Gatorade', category: 'Energy Drink', color: '#eab308', exclusivityGroup: 'energy' },
    { brand: 'Omega', category: 'Watch', color: '#6366f1', exclusivityGroup: 'watch' },
    { brand: 'Apple', category: 'Tech', color: '#8b949e', exclusivityGroup: 'tech' },
    { brand: 'BMW', category: 'Automotive', color: '#0ea5e9', exclusivityGroup: 'auto' },
    { brand: 'Coca-Cola', category: 'Food & Beverage', color: '#dc2626', exclusivityGroup: 'food' },
  ];

  const offers: SponsorOffer[] = [];
  const tierOptions: SponsorTier[] = reputation >= 70
    ? ['Platinum', 'Gold', 'Gold', 'Silver']
    : reputation >= 50
      ? ['Gold', 'Silver', 'Silver', 'Bronze']
      : ['Silver', 'Bronze', 'Bronze', 'Bronze'];

  for (let i = 0; i < allOffers.length; i++) {
    const od = allOffers[i];
    const s = seed + i * 97;

    // Check exclusivity conflict
    let exclusivityConflict: string | undefined;
    if (od.exclusivityGroup === 'sportswear' && activeBrands.some(b => b === 'Nike')) {
      exclusivityConflict = `Already have Nike — conflicts with ${od.brand}`;
    } else if (od.exclusivityGroup === 'energy' && activeBrands.some(b => b === 'Red Bull')) {
      exclusivityConflict = `Already have Red Bull — conflicts with ${od.brand}`;
    } else if (od.exclusivityGroup === 'watch' && activeBrands.some(b => b === 'Rolex')) {
      exclusivityConflict = `Already have Rolex — conflicts with ${od.brand}`;
    }

    const tier = tierOptions[i % tierOptions.length];
    const years = seededInt(s + 1, 1, 4);
    const baseValue = tier === 'Platinum' ? 5000000 : tier === 'Gold' ? 2500000 : tier === 'Silver' ? 1000000 : 400000;
    const annualValue = Math.round(baseValue * seededRange(s + 2, 0.7, 1.3) * (reputation / 100 + 0.2));

    offers.push({
      id: `sponsor-offer-${i}`,
      brand: od.brand,
      category: od.category,
      tier,
      annualValue,
      contractYears: years,
      totalValue: annualValue * years,
      minOVR: seededInt(s + 3, 60, 85),
      minFollowers: seededInt(s + 4, 50000, 2000000),
      minMarketValue: seededInt(s + 5, 5, 50) * 1000000,
      exclusivityConflict,
      color: od.color,
    });
  }

  return offers;
}

function generateSponsorHistory(seed: number, seasonsPlayed: number): SponsorHistoryEntry[] {
  if (seasonsPlayed < 1) return [];

  const historyBrands = [
    { brand: 'Umbro', category: 'Food & Beverage' as SponsorCategory, color: '#f59e0b' },
    { brand: 'Lotto', category: 'Sportswear' as SponsorCategory, color: '#06b6d4' },
  ];

  const entries: SponsorHistoryEntry[] = [];
  const count = Math.min(seasonsPlayed, historyBrands.length);

  for (let i = 0; i < count; i++) {
    const hb = historyBrands[i];
    const s = seed + i * 43 + 200;
    const yearsActive = seededInt(s + 1, 1, 3);
    const baseValue = 500000;
    const totalEarned = Math.round(baseValue * yearsActive * seededRange(s + 2, 0.6, 1.5));

    const reasonRoll = seededRandom(s + 3);
    const endReason: SponsorEndReason = reasonRoll < 0.5
      ? 'Contract Expired'
      : reasonRoll < 0.8
        ? 'Upgrade'
        : 'Terminated';

    entries.push({
      id: `sponsor-history-${i}`,
      brand: hb.brand,
      category: hb.category,
      totalEarned,
      yearsActive,
      endReason,
      rating: seededInt(s + 4, 2, 5),
      color: hb.color,
    });
  }

  return entries;
}

function generateSocialMedia(seed: number, reputation: number): SocialPlatform[] {
  const baseMultiplier = reputation / 50;
  return [
    {
      name: 'Instagram',
      followers: Math.round(150000 * baseMultiplier * seededRange(seed + 1, 0.7, 1.5)),
      engagementRate: Math.round(seededRange(seed + 2, 2.5, 6.5) * 10) / 10,
      color: '#e1306c',
      iconPath: 'instagram',
    },
    {
      name: 'Twitter/X',
      followers: Math.round(80000 * baseMultiplier * seededRange(seed + 3, 0.6, 1.8)),
      engagementRate: Math.round(seededRange(seed + 4, 1.5, 4.5) * 10) / 10,
      color: '#1da1f2',
      iconPath: 'twitter',
    },
    {
      name: 'TikTok',
      followers: Math.round(300000 * baseMultiplier * seededRange(seed + 5, 0.5, 2.0)),
      engagementRate: Math.round(seededRange(seed + 6, 4.0, 9.0) * 10) / 10,
      color: '#000000',
      iconPath: 'tiktok',
    },
  ];
}

function generateEndorsementEvents(seed: number, currentSeason: number): EndorsementEvent[] {
  const events: EndorsementEvent[] = [];
  const eventTemplates: { type: EventType; brand: string; description: string; coinReward: number; reputationReward: number; timeCommitment: string; color: string; season: string }[] = [
    { type: 'Photo Shoot', brand: 'EA Sports FC', description: 'Promo shoot for the new game cover', coinReward: 50000, reputationReward: 3, timeCommitment: '2 hours', color: '#f97316', season: 'All Year' },
    { type: 'TV Commercial', brand: 'Nike', description: '30-second TV spot for new boot launch', coinReward: 150000, reputationReward: 5, timeCommitment: '1 day', color: '#ef4444', season: 'Pre-Season' },
    { type: 'Charity Event', brand: 'UNICEF', description: 'Charity match appearance for children', coinReward: 10000, reputationReward: 8, timeCommitment: '3 hours', color: '#3b82f6', season: 'Holiday' },
    { type: 'Social Media Campaign', brand: 'Pepsi', description: 'Instagram Reels campaign with branded content', coinReward: 75000, reputationReward: 4, timeCommitment: '4 hours', color: '#22c55e', season: 'All Year' },
    { type: 'Product Launch', brand: 'Apple Watch', description: 'Keynote appearance for new fitness feature', coinReward: 200000, reputationReward: 6, timeCommitment: 'Half day', color: '#8b949e', season: 'Season Start' },
  ];

  // Show 3 events based on current week
  const showCount = 3;
  for (let i = 0; i < Math.min(showCount, eventTemplates.length); i++) {
    const tmpl = eventTemplates[(seed + i) % eventTemplates.length];
    events.push({
      id: `endorsement-event-${i}`,
      ...tmpl,
      season: tmpl.season,
    });
  }

  return events;
}

// ============================================================
// Main Component
// ============================================================
export default function SponsorSystem() {
  const gameState = useGameStore(state => state.gameState);
  const [tab, setTab] = useState<'overview' | 'offers' | 'history' | 'social' | 'events'>('overview');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const player = useMemo(() => gameState?.player, [gameState]);
  const currentSeason = useMemo(() => gameState?.currentSeason ?? 1, [gameState]);
  const currentWeek = useMemo(() => gameState?.currentWeek ?? 1, [gameState]);
  const seasonsPlayed = useMemo(() => gameState?.seasons.length ?? 0, [gameState]);

  // Deterministic seed from player state
  const baseSeed = useMemo(() => {
    if (!player) return 42;
    return player.name.length * 137 + currentSeason * 31 + currentWeek * 7;
  }, [player, currentSeason, currentWeek]);

  // Generate all data deterministically
  const activeSponsors = useMemo(
    () => generateActiveSponsors(baseSeed, player?.reputation ?? 10),
    [baseSeed, player?.reputation]
  );

  const activeBrandNames = useMemo(
    () => activeSponsors.map(s => s.brand),
    [activeSponsors]
  );

  const availableOffers = useMemo(
    () => generateAvailableOffers(baseSeed + 100, player?.reputation ?? 10, activeBrandNames),
    [baseSeed, player?.reputation, activeBrandNames]
  );

  const sponsorHistory = useMemo(
    () => generateSponsorHistory(baseSeed + 300, seasonsPlayed),
    [baseSeed, seasonsPlayed]
  );

  const socialPlatforms = useMemo(
    () => generateSocialMedia(baseSeed + 400, player?.reputation ?? 10),
    [baseSeed, player?.reputation]
  );

  const endorsementEvents = useMemo(
    () => generateEndorsementEvents(baseSeed + 500, currentSeason),
    [baseSeed, currentSeason]
  );

  // Computed stats
  const totalAnnualIncome = useMemo(
    () => activeSponsors.reduce((sum, s) => sum + s.annualValue, 0),
    [activeSponsors]
  );

  const sponsorRating = useMemo(
    () => getSponsorRating(activeSponsors.map(s => s.tier)),
    [activeSponsors]
  );

  const totalSocialFollowers = useMemo(
    () => socialPlatforms.reduce((sum, p) => sum + p.followers, 0),
    [socialPlatforms]
  );

  const avgEngagementRate = useMemo(() => {
    if (socialPlatforms.length === 0) return 0;
    return socialPlatforms.reduce((sum, p) => sum + p.engagementRate, 0) / socialPlatforms.length;
  }, [socialPlatforms]);

  const socialValueMultiplier = useMemo(() => {
    const followerScore = Math.min(totalSocialFollowers / 1000000, 5);
    const engagementScore = avgEngagementRate / 5;
    return (followerScore * 0.6 + engagementScore * 0.4).toFixed(1);
  }, [totalSocialFollowers, avgEngagementRate]);

  const trendDirection = useMemo(() => {
    return seededRandom(baseSeed + 999) > 0.4 ? 'up' as const : 'down' as const;
  }, [baseSeed]);

  const trendPercent = useMemo(
    () => Math.round(seededRange(baseSeed + 888, 2, 18)),
    [baseSeed]
  );

  // ============================================================
  // Section data: Brand Value Timeline
  // ============================================================
  const brandTimeline = useMemo(() => {
    const baseIncome = totalAnnualIncome;
    const seasons = [
      Math.round(baseIncome * seededRange(baseSeed + 600, 0.35, 0.55)),
      Math.round(baseIncome * seededRange(baseSeed + 601, 0.55, 0.75)),
      Math.round(baseIncome * seededRange(baseSeed + 602, 0.75, 0.95)),
      baseIncome,
    ];
    const growthPct = seasons[0] > 0
      ? Math.round(((seasons[3] - seasons[0]) / seasons[0]) * 100)
      : 0;
    const brandColors = activeSponsors.map(s => s.color);
    const barColor = brandColors.length > 0
      ? brandColors[currentSeason % brandColors.length] || '#10b981'
      : '#10b981';
    return { seasons, growthPct, barColor };
  }, [baseSeed, totalAnnualIncome, activeSponsors, currentSeason]);

  // ============================================================
  // Section data: Sponsorship Tier Pyramid
  // ============================================================
  const tierPyramid = useMemo(() => {
    const tiers: SponsorTier[] = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    const tierValues: Record<SponsorTier, { deals: number; totalValue: number }> = {
      Platinum: { deals: 0, totalValue: 0 },
      Gold:     { deals: 0, totalValue: 0 },
      Silver:   { deals: 0, totalValue: 0 },
      Bronze:   { deals: 0, totalValue: 0 },
    };

    activeSponsors.forEach(s => {
      tierValues[s.tier].deals += 1;
      tierValues[s.tier].totalValue += s.annualValue;
    });

    // Determine current tier level
    let currentTier: SponsorTier = 'Bronze';
    if (tierValues.Platinum.deals > 0) currentTier = 'Platinum';
    else if (tierValues.Gold.deals > 0) currentTier = 'Gold';
    else if (tierValues.Silver.deals > 0) currentTier = 'Silver';

    const tierOrder: SponsorTier[] = ['Platinum', 'Gold', 'Silver', 'Bronze'];
    const currentIdx = tierOrder.indexOf(currentTier);
    const nextTier: SponsorTier | null = currentIdx > 0 ? tierOrder[currentIdx - 1] : null;
    const nextTierReq = nextTier
      ? `Need 1 ${nextTier} deal to advance`
      : null;

    return { tiers, tierValues, currentTier, nextTier, nextTierReq };
  }, [activeSponsors]);

  // ============================================================
  // Section data: Sponsor Relationship Matrix
  // ============================================================
  const relationshipMatrix = useMemo(() => {
    const categories: SponsorCategory[] = [
      'Sportswear', 'Energy Drink', 'Watch', 'Tech', 'Automotive', 'Food & Beverage',
    ];
    type Strength = 'Low' | 'Medium' | 'High' | 'Exclusive';

    const matrix = categories.map(cat => {
      const activeInCat = activeSponsors.filter(s => s.category === cat);
      const offersInCat = availableOffers.filter(o => o.category === cat);
      const hasActive = activeInCat.length > 0;
      const isExclusive = activeInCat.some(s => s.tier === 'Platinum');

      let strength: Strength = 'Low';
      if (isExclusive) strength = 'Exclusive';
      else if (activeInCat.some(s => s.tier === 'Gold')) strength = 'High';
      else if (hasActive) strength = 'Medium';

      return {
        category: cat,
        strength,
        activeBrands: activeInCat.map(s => s.brand),
        availableBrands: offersInCat.map(o => o.brand),
        hasActive,
      };
    });

    // Portfolio health score (0-100)
    const activeCategories = matrix.filter(m => m.hasActive).length;
    const highOrExcl = matrix.filter(m => m.strength === 'High' || m.strength === 'Exclusive').length;
    const healthScore = Math.min(100, Math.round(
      (activeCategories / 6) * 50 + (highOrExcl / 6) * 30 + (activeSponsors.length / 6) * 20
    ));

    return { matrix, healthScore };
  }, [activeSponsors, availableOffers]);

  // ============================================================
  // Section data: Market Comparison Dashboard
  // ============================================================
  const marketComparison = useMemo(() => {
    const peerNames = ['M. Santos', 'L. Fernandez', 'K. Okafor', 'You'];
    const peerIncomes = [
      Math.round(seededRange(baseSeed + 700, 3000000, 8000000)),
      Math.round(seededRange(baseSeed + 701, 1500000, 5000000)),
      Math.round(seededRange(baseSeed + 702, 2000000, 6000000)),
      totalAnnualIncome,
    ];
    const peerDeals = [
      seededInt(baseSeed + 710, 2, 6),
      seededInt(baseSeed + 711, 1, 5),
      seededInt(baseSeed + 712, 2, 5),
      activeSponsors.length,
    ];
    const peerRatings = ['A', 'B+', 'B', sponsorRating];

    const maxIncome = Math.max(...peerIncomes);
    const sortedIncomes = [...peerIncomes].sort((a, b) => b - a);
    const yourRank = sortedIncomes.indexOf(totalAnnualIncome) + 1;
    const percentile = Math.max(5, Math.round((1 - (yourRank - 1) / 4) * 100));

    const peers = peerNames.map((name, i) => ({
      name,
      income: peerIncomes[i],
      deals: peerDeals[i],
      rating: peerRatings[i],
      isYou: i === 3,
      barPct: maxIncome > 0 ? (peerIncomes[i] / maxIncome) * 100 : 0,
    }));

    return { peers, percentile, yourRank };
  }, [baseSeed, totalAnnualIncome, activeSponsors.length, sponsorRating]);

  // ============================================================
  // Section data: SVG Visualization computed values
  // ============================================================
  const categoryCounts = activeSponsors.reduce<Record<string, number>>((acc, s) => {
    const cat = s.category === 'Sportswear' || s.category === 'Energy Drink' || s.category === 'Tech'
      ? s.category
      : 'Other';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const categoryDonutData = [
    { label: 'Sportswear', count: categoryCounts['Sportswear'] ?? 0, color: '#CCFF00' },
    { label: 'Energy', count: categoryCounts['Energy Drink'] ?? 0, color: '#00E5FF' },
    { label: 'Tech', count: categoryCounts['Tech'] ?? 0, color: '#FF5500' },
    { label: 'Other', count: categoryCounts['Other'] ?? 0, color: '#666666' },
  ];

  const totalCategoryCount = categoryDonutData.reduce((sum, d) => sum + d.count, 0) || 1;

  const incomeTrendData = Array.from({ length: 8 }, (_, i) =>
    Math.round(totalAnnualIncome * seededRange(baseSeed + 800 + i, 0.2, 1.1))
  );

  const endorsementScore = Math.min(100, Math.round(
    (Math.min(totalSocialFollowers / 500000, 1) * 50) +
    (avgEngagementRate / 8 * 30) +
    (activeSponsors.length / 6 * 20)
  ));

  const clauseBonusData = [
    { type: 'Goal Bonus', potential: activeSponsors.reduce((sum, s) => sum + (s.hasPerformanceClause ? s.annualValue * 0.15 : 0), 0) },
    { type: 'Appearance', potential: activeSponsors.reduce((sum, s) => sum + s.annualValue * 0.05, 0) },
    { type: 'Team Success', potential: activeSponsors.reduce((sum, s) => sum + s.annualValue * 0.1, 0) },
    { type: 'Award Bonus', potential: activeSponsors.reduce((sum, s) => sum + (s.tier === 'Platinum' || s.tier === 'Gold' ? s.annualValue * 0.2 : 0), 0) },
  ];

  const maxClauseBonus = Math.max(...clauseBonusData.map(d => d.potential), 1);

  const engagementTrendData = Array.from({ length: 6 }, (_, i) =>
    Math.round(seededRange(baseSeed + 900 + i, 2.0, 7.5) * 10) / 10
  );

  const radarScores = [
    { axis: 'Diversity', score: Math.min(100, Math.round((new Set(activeSponsors.map(s => s.category)).size / 6) * 100)) },
    { axis: 'Value', score: Math.min(100, Math.round(totalAnnualIncome / 80000)) },
    { axis: 'Growth', score: Math.round(seededRange(baseSeed + 850, 40, 90)) },
    { axis: 'Stability', score: Math.round(activeSponsors.reduce((sum, s) => sum + s.yearsRemaining, 0) / (activeSponsors.length || 1) * 25) },
    { axis: 'Exclusivity', score: activeSponsors.some(s => s.tier === 'Platinum') ? 95 : activeSponsors.some(s => s.tier === 'Gold') ? 70 : 40 },
  ];

  if (!gameState || !player) return null;

  // Tab configuration
  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'offers', label: 'Offers' },
    { key: 'history', label: 'History' },
    { key: 'social', label: 'Social' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* =========================================
          1. HEADER
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-950/50 border border-purple-800/40 flex items-center justify-center">
            <svg className="h-4.5 w-4.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Sponsorship Center</h1>
            <p className="text-[10px] text-[#8b949e]">Season {currentSeason} · Week {currentWeek}</p>
          </div>
        </div>
        <div className="px-2.5 py-1 h-7 rounded-lg bg-purple-950/50 text-purple-400 border border-purple-800/40 flex items-center gap-1">
          <span className="text-[9px] font-bold">{sponsorRating}</span>
        </div>
      </motion.div>

      {/* =========================================
          2. STATS DASHBOARD (3-column grid)
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {/* Total Annual Income */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center mb-2">
            <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-[9px] text-[#8b949e] mb-0.5">Annual Income</p>
          <p className="text-xs font-bold text-emerald-400">{fmtCurrencyShort(totalAnnualIncome)}</p>
          <div className="flex items-center gap-1 mt-1">
            {trendDirection === 'up' ? (
              <svg className="h-2.5 w-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg className="h-2.5 w-2.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            <span className={`text-[8px] font-medium ${trendDirection === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendPercent}%
            </span>
          </div>
        </div>

        {/* Active Sponsorships */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="w-7 h-7 rounded-lg bg-amber-950/50 border border-amber-800/30 flex items-center justify-center mb-2">
            <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-[9px] text-[#8b949e] mb-0.5">Active Deals</p>
          <p className="text-xs font-bold text-amber-400">{activeSponsors.length}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] text-[#484f58]">of 6 max slots</span>
          </div>
        </div>

        {/* Sponsor Rating */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="w-7 h-7 rounded-lg bg-purple-950/50 border border-purple-800/30 flex items-center justify-center mb-2">
            <svg className="h-3.5 w-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p className="text-[9px] text-[#8b949e] mb-0.5">Rating</p>
          <p className={`text-xs font-bold ${getRatingColor(sponsorRating)}`}>{sponsorRating}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] text-[#484f58]">tier-based</span>
          </div>
        </div>
      </motion.div>

      {/* =========================================
          3. TAB BAR
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-[#21262d]"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 text-[10px] font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-[#21262d] text-emerald-400'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* =========================================
          TAB: OVERVIEW — Active Sponsorships Grid
          ========================================= */}
      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {activeSponsors.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
              <svg className="h-10 w-10 text-[#30363d] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="text-xs text-[#8b949e] mb-1">No Active Sponsorships</p>
              <p className="text-[10px] text-[#484f58]">Build your reputation to attract sponsors</p>
            </div>
          ) : (
            activeSponsors.map((sponsor, index) => {
              const tierConf = TIER_COLORS[sponsor.tier];
              const progressPct = ((sponsor.contractYears - sponsor.yearsRemaining) / sponsor.contractYears) * 100;

              return (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + index * 0.06 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  {/* Top row: Logo, Brand info, Tier badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <SponsorLogo initial={sponsor.brand[0]} color={sponsor.color} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#c9d1d9] truncate">{sponsor.brand}</h3>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-lg ${tierConf.bg} ${tierConf.text} border ${tierConf.border}`}>
                          {sponsor.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#8b949e]">{sponsor.category}</span>
                        <span className="text-[#30363d]">·</span>
                        <span className="text-[10px] text-[#8b949e]">{sponsor.contractYears}-year deal</span>
                      </div>
                    </div>
                  </div>

                  {/* Duration bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-[#484f58]">Contract Progress</span>
                      <span className="text-[9px] text-[#8b949e]">{sponsor.yearsRemaining}yr remaining</span>
                    </div>
                    <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: `${progressPct}%`, backgroundColor: sponsor.color }}
                      />
                    </div>
                  </div>

                  {/* Value row */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]">
                      <p className="text-[8px] text-[#484f58] mb-0.5">Annual Value</p>
                      <p className="text-xs font-bold text-emerald-400">{fmtCurrencyShort(sponsor.annualValue)}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]">
                      <p className="text-[8px] text-[#484f58] mb-0.5">Total Contract</p>
                      <p className="text-xs font-bold text-[#c9d1d9]">{fmtCurrencyShort(sponsor.totalValue)}</p>
                    </div>
                  </div>

                  {/* Performance clause */}
                  {sponsor.hasPerformanceClause && (
                    <div className="flex items-center gap-2 bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-800/20">
                      <svg className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-[9px] text-amber-300">Performance Clause: {sponsor.clauseDescription}</span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}

          {/* =========================================
              Section: SVG Sponsor Portfolio Ring
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#FF5500]/50 border border-[#FF5500]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Sponsor Portfolio Ring</h3>
              </div>
              <span className="text-[9px] font-bold text-[#FF5500]">{activeSponsors.length}/6 slots</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 120, cy = 60, r = 38;
                const circumference = 2 * Math.PI * r;
                const gap = 6;
                const segLen = (circumference - gap * 6) / 6;
                const offset = -circumference / 4;
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="7" />
                    {Array.from({ length: 6 }, (_, i) => {
                      const startA = offset + i * (segLen + gap);
                      const x1 = cx + r * Math.cos(startA);
                      const y1 = cy + r * Math.sin(startA);
                      const endA = startA + segLen;
                      const x2 = cx + r * Math.cos(endA);
                      const y2 = cy + r * Math.sin(endA);
                      return (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={i < activeSponsors.length ? '#FF5500' : '#30363d'}
                          strokeWidth="7" strokeLinecap="round"
                          opacity={i < activeSponsors.length ? 1 : 0.4}
                        />
                      );
                    })}
                    <text x={cx} y={cy - 4} fill="#c9d1d9" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      {activeSponsors.length}
                    </text>
                    <text x={cx} y={cy + 10} fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
                      of 6 slots
                    </text>
                    {Array.from({ length: 6 }, (_, i) => {
                      const y = 18 + i * 17;
                      return (
                        <g key={`slot-${i}`}>
                          <rect x="220" y={y} width="8" height="8" rx="2"
                            fill={i < activeSponsors.length ? '#FF5500' : '#21262d'}
                            opacity={i < activeSponsors.length ? 1 : 0.5}
                          />
                          <text x="234" y={y + 7} fill={i < activeSponsors.length ? '#c9d1d9' : '#484f58'}
                            fontSize="7" fontFamily="sans-serif">
                            {activeSponsors[i] ? activeSponsors[i].brand : 'Empty'}
                          </text>
                          {activeSponsors[i] && (
                            <text x="310" y={y + 7} fill="#8b949e" fontSize="7" textAnchor="end" fontFamily="sans-serif">
                              {activeSponsors[i].tier}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Category Distribution Donut
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.30 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#CCFF00]/50 border border-[#CCFF00]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Category Distribution</h3>
              </div>
              <span className="text-[9px] font-bold text-[#CCFF00]">{totalCategoryCount} active</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 100, cy = 60, r = 38, inner = 22;
                const total = totalCategoryCount;
                const gapAngle = total > 1 ? 0.06 : 0;
                let currentAngle = -Math.PI / 2;
                const arcs = categoryDonutData.map((seg) => {
                  const sliceAngle = seg.count > 0 ? (seg.count / total) * Math.PI * 2 : 0.01;
                  const startA = currentAngle + gapAngle;
                  const endA = currentAngle + Math.max(sliceAngle, 0.01) - gapAngle;
                  currentAngle += sliceAngle;
                  const outerStart = { x: cx + r * Math.cos(startA), y: cy + r * Math.sin(startA) };
                  const outerEnd = { x: cx + r * Math.cos(endA), y: cy + r * Math.sin(endA) };
                  const innerEnd = { x: cx + inner * Math.cos(endA), y: cy + inner * Math.sin(endA) };
                  const innerStart = { x: cx + inner * Math.cos(startA), y: cy + inner * Math.sin(startA) };
                  const large = (endA - startA) > Math.PI ? 1 : 0;
                  return { ...seg, large };
                });
                return (
                  <>
                    <circle cx={cx} cy={cy} r={inner - 2} fill="#161b22" />
                    {arcs.map((arc, i) => {
                      const sliceAngle = arc.count > 0 ? (arc.count / total) * Math.PI * 2 : 0.01;
                      const startA = -Math.PI / 2 + categoryDonutData.slice(0, i).reduce((s, d) => s + (d.count > 0 ? (d.count / total) * Math.PI * 2 : 0.01), 0) + gapAngle;
                      const endA = startA + Math.max(sliceAngle, 0.01) - gapAngle * 2;
                      const outerStart = { x: cx + r * Math.cos(startA), y: cy + r * Math.sin(startA) };
                      const outerEnd = { x: cx + r * Math.cos(endA), y: cy + r * Math.sin(endA) };
                      const innerEnd = { x: cx + inner * Math.cos(endA), y: cy + inner * Math.sin(endA) };
                      const innerStart = { x: cx + inner * Math.cos(startA), y: cy + inner * Math.sin(startA) };
                      const large = (endA - startA) > Math.PI ? 1 : 0;
                      const d = `M ${outerStart.x} ${outerStart.y} A ${r} ${r} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${inner} ${inner} 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`;
                      return <path key={i} d={d} fill={arc.color} opacity={arc.count > 0 ? 0.85 : 0.15} />;
                    })}
                    <text x={cx} y={cy - 2} fill="#c9d1d9" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      {total}
                    </text>
                    <text x={cx} y={cy + 10} fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
                      deals
                    </text>
                    {categoryDonutData.map((arc, i) => (
                      <g key={`leg-${i}`}>
                        <rect x="195" y={20 + i * 22} width="8" height="8" rx="2" fill={arc.color} opacity={arc.count > 0 ? 0.85 : 0.3} />
                        <text x="209" y={28 + i * 22} fill="#c9d1d9" fontSize="7" fontFamily="sans-serif">{arc.label}</text>
                        <text x="310" y={28 + i * 22} fill="#8b949e" fontSize="7" textAnchor="end" fontFamily="sans-serif">
                          {arc.count} ({total > 0 ? Math.round((arc.count / total) * 100) : 0}%)
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Annual Income Trend
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#00E5FF]/50 border border-[#00E5FF]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Annual Income Trend</h3>
              </div>
              <span className="text-[9px] font-bold text-[#00E5FF]">8 seasons</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const maxVal = Math.max(...incomeTrendData, 1);
                const points = incomeTrendData.map((v, i) => ({
                  x: 40 + i * 34,
                  y: 100 - (v / maxVal) * 75,
                  val: v,
                }));
                const lineStr = points.map(p => `${p.x},${p.y}`).join(' ');
                const areaStr = `40,100 ${lineStr} ${points[points.length - 1].x},100`;
                return (
                  <>
                    <line x1="40" y1="25" x2="310" y2="25" stroke="#21262d" strokeWidth="0.5" />
                    <line x1="40" y1="62" x2="310" y2="62" stroke="#21262d" strokeWidth="0.5" />
                    <line x1="40" y1="100" x2="310" y2="100" stroke="#30363d" strokeWidth="0.5" />
                    <text x="35" y="29" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">{fmtCurrencyShort(maxVal)}</text>
                    <text x="35" y="66" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">{fmtCurrencyShort(maxVal / 2)}</text>
                    <text x="35" y="104" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">€0</text>
                    <polygon points={areaStr} fill="#00E5FF" opacity="0.1" />
                    <polyline points={lineStr} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#00E5FF" />
                        <circle cx={p.x} cy={p.y} r="1.5" fill="#161b22" />
                        <text x={p.x} y={p.y - 8} fill="#00E5FF" fontSize="6" textAnchor="middle" fontFamily="sans-serif">
                          {fmtCurrencyShort(p.val)}
                        </text>
                        <text x={p.x} y="115" fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
                          S{i + 1}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Endorsement Value Gauge
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#CCFF00]/50 border border-[#CCFF00]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="M4.93 4.93l2.83 2.83" />
                    <path d="M16.24 16.24l2.83 2.83" />
                    <path d="M2 12h4" />
                    <path d="M18 12h4" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Endorsement Value</h3>
              </div>
              <span className="text-[9px] font-bold text-[#CCFF00]">score {endorsementScore}</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 160, cy = 100, r = 75;
                const startAngle = Math.PI;
                const scoreRatio = endorsementScore / 100;
                const valueAngle = startAngle - scoreRatio * Math.PI;
                const bgX1 = cx + r * Math.cos(startAngle);
                const bgY1 = cy + r * Math.sin(startAngle);
                const bgX2 = cx + r * Math.cos(0);
                const bgY2 = cy + r * Math.sin(0);
                const bgPath = `M ${bgX1} ${bgY1} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}`;
                const vX1 = cx + r * Math.cos(startAngle);
                const vY1 = cy + r * Math.sin(startAngle);
                const vX2 = cx + r * Math.cos(valueAngle);
                const vY2 = cy + r * Math.sin(valueAngle);
                const largeArc = scoreRatio > 0.5 ? 1 : 0;
                const valuePath = `M ${vX1} ${vY1} A ${r} ${r} 0 ${largeArc} 1 ${vX2} ${vY2}`;
                const tickAngles = [0, 0.25, 0.5, 0.75, 1];
                return (
                  <>
                    <path d={bgPath} fill="none" stroke="#21262d" strokeWidth="10" strokeLinecap="round" />
                    <path d={valuePath} fill="none" stroke="#CCFF00" strokeWidth="10" strokeLinecap="round" />
                    {tickAngles.map((t, i) => {
                      const angle = startAngle - t * Math.PI;
                      const innerR = r - 16;
                      const outerR = r - 10;
                      return (
                        <line key={i}
                          x1={cx + innerR * Math.cos(angle)} y1={cy + innerR * Math.sin(angle)}
                          x2={cx + outerR * Math.cos(angle)} y2={cy + outerR * Math.sin(angle)}
                          stroke="#484f58" strokeWidth="1"
                        />
                      );
                    })}
                    <text x={cx} y={cy - 14} fill="#c9d1d9" fontSize="22" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      {endorsementScore}
                    </text>
                    <text x={cx} y={cy} fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
                      Endorsement Score
                    </text>
                    <text x={cx - r - 8} y={cy + 16} fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">0</text>
                    <text x={cx + r + 8} y={cy + 16} fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">100</text>
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Social Media Growth Bars
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.36 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#FF5500]/50 border border-[#FF5500]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Social Media Growth</h3>
              </div>
              <span className="text-[9px] font-bold text-[#FF5500]">{fmtFollowers(totalSocialFollowers)}</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const maxFollowers = Math.max(...socialPlatforms.map(p => p.followers), 1);
                const colors = ['#FF5500', '#CCFF00', '#00E5FF'];
                const labels = ['Instagram', 'Twitter/X', 'TikTok'];
                return socialPlatforms.map((platform, i) => {
                  const barWidth = (platform.followers / maxFollowers) * 160;
                  const y = 12 + i * 34;
                  return (
                    <g key={i}>
                      <text x="0" y={y + 10} fill="#c9d1d9" fontSize="8" fontWeight="bold" fontFamily="sans-serif">{labels[i]}</text>
                      <rect x="75" y={y} width="160" height="16" rx="3" fill="#21262d" />
                      <rect x="75" y={y} width={Math.max(barWidth, 4)} height="16" rx="3" fill={colors[i]} opacity="0.8" />
                      <text x={75 + barWidth + 6} y={y + 11} fill={colors[i]} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                        {fmtFollowers(platform.followers)}
                      </text>
                      <text x="310" y={y + 11} fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">
                        {platform.engagementRate}% eng
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Contract Expiry Timeline
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#00E5FF]/50 border border-[#00E5FF]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Contract Expiry Timeline</h3>
              </div>
              <span className="text-[9px] font-bold text-[#00E5FF]">{activeSponsors.length} contracts</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const nodes = activeSponsors.map(s => ({
                  brand: s.brand,
                  expiry: s.yearsRemaining,
                  color: s.color,
                }));
                const maxExpiry = Math.max(...nodes.map(n => n.expiry), 1);
                const lineY = 55;
                return (
                  <>
                    <line x1="30" y1={lineY} x2="290" y2={lineY} stroke="#30363d" strokeWidth="2" />
                    <line x1="30" y1={lineY - 12} x2="30" y2={lineY + 12} stroke="#c9d1d9" strokeWidth="1.5" />
                    <text x="30" y={lineY - 16} fill="#c9d1d9" fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">Now</text>
                    {nodes.map((node, i) => {
                      const x = 30 + (node.expiry / maxExpiry) * 260;
                      return (
                        <g key={i}>
                          <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke={node.color} strokeWidth="2" />
                          <circle cx={x} cy={lineY} r="5" fill={node.color} opacity="0.8" />
                          <circle cx={x} cy={lineY} r="2.5" fill="#161b22" />
                          <text x={x} y={lineY - 14} fill={node.color} fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
                            {node.expiry}yr
                          </text>
                          <text x={x} y={lineY + 22} fill="#8b949e" fontSize="6" textAnchor="middle" fontFamily="sans-serif">
                            {node.brand}
                          </text>
                        </g>
                      );
                    })}
                    {Array.from({ length: Math.min(maxExpiry, 5) }, (_, i) => {
                      const x = 30 + ((i + 1) / maxExpiry) * 260;
                      return (
                        <g key={`yr-${i}`}>
                          <line x1={x} y1={lineY - 4} x2={x} y2={lineY + 4} stroke="#21262d" strokeWidth="1" />
                          <text x={x} y={lineY + 35} fill="#484f58" fontSize="6" textAnchor="middle" fontFamily="sans-serif">
                            +{i + 1}yr
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Sponsor Tier Pyramid
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.40 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#CCFF00]/50 border border-[#CCFF00]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Sponsor Tier Pyramid</h3>
              </div>
              <span className="text-[9px] font-bold text-[#CCFF00]">{activeSponsors.length} deals</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const tiers = ['Platinum', 'Gold', 'Silver', 'Bronze'];
                const tierColors = ['#8b949e', '#f59e0b', '#9ca3af', '#f97316'];
                const tierCounts = tiers.map(t => activeSponsors.filter(s => s.tier === t).length);
                const maxCount = Math.max(...tierCounts, 1);
                return tiers.map((tier, i) => {
                  const barWidth = (tierCounts[i] / maxCount) * 170;
                  const y = 8 + i * 27;
                  return (
                    <g key={tier}>
                      <text x="0" y={y + 13} fill="#c9d1d9" fontSize="8" fontWeight="bold" fontFamily="sans-serif">{tier}</text>
                      <rect x="70" y={y} width="170" height="18" rx="3" fill="#21262d" />
                      <rect x="70" y={y} width={Math.max(barWidth, 4)} height="18" rx="3" fill={tierColors[i]} opacity="0.7" />
                      <text x={70 + barWidth + 6} y={y + 13} fill="#8b949e" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                        {tierCounts[i]} deal{tierCounts[i] !== 1 ? 's' : ''}
                      </text>
                      <text x="310" y={y + 13} fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">
                        {tierCounts[i] > 0 ? fmtCurrencyShort(activeSponsors.filter(s => s.tier === tier).reduce((sum, s) => sum + s.annualValue, 0)) : '-'}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Brand Portfolio Health Radar
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#00E5FF]/50 border border-[#00E5FF]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                    <line x1="12" y1="22" x2="12" y2="15.5" />
                    <polyline points="22 8.5 12 15.5 2 8.5" />
                    <polyline points="2 15.5 12 8.5 22 15.5" />
                    <line x1="12" y1="2" x2="12" y2="8.5" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Portfolio Health Radar</h3>
              </div>
              <span className="text-[9px] font-bold text-[#00E5FF]">
                {Math.round(radarScores.reduce((sum, r) => sum + r.score, 0) / radarScores.length)}/100
              </span>
            </div>
            <svg viewBox="0 0 320 140" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const cx = 110, cy = 70, maxR = 48;
                const axes = radarScores.length;
                const angleStep = (Math.PI * 2) / axes;
                const startAngle = -Math.PI / 2;
                const gridLevels = [0.25, 0.5, 0.75, 1.0];
                return (
                  <>
                    {gridLevels.map((level, li) => {
                      const pts = radarScores.map((_, i) => {
                        const angle = startAngle + i * angleStep;
                        return `${cx + maxR * level * Math.cos(angle)},${cy + maxR * level * Math.sin(angle)}`;
                      }).join(' ');
                      return <polygon key={li} points={pts} fill="none" stroke="#21262d" strokeWidth="0.5" />;
                    })}
                    {radarScores.map((_, i) => {
                      const angle = startAngle + i * angleStep;
                      return (
                        <line key={i} x1={cx} y1={cy}
                          x2={cx + maxR * Math.cos(angle)}
                          y2={cy + maxR * Math.sin(angle)}
                          stroke="#30363d" strokeWidth="0.5"
                        />
                      );
                    })}
                    <polygon
                      points={radarScores.map((rs, i) => {
                        const angle = startAngle + i * angleStep;
                        const val = rs.score / 100;
                        return `${cx + maxR * val * Math.cos(angle)},${cy + maxR * val * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="#00E5FF" opacity="0.15" stroke="#00E5FF" strokeWidth="1.5"
                    />
                    {radarScores.map((rs, i) => {
                      const angle = startAngle + i * angleStep;
                      const val = rs.score / 100;
                      return (
                        <circle key={i}
                          cx={cx + maxR * val * Math.cos(angle)}
                          cy={cy + maxR * val * Math.sin(angle)}
                          r="3" fill="#00E5FF"
                        />
                      );
                    })}
                    {radarScores.map((rs, i) => {
                      const angle = startAngle + i * angleStep;
                      const lx = cx + (maxR + 14) * Math.cos(angle);
                      const ly = cy + (maxR + 14) * Math.sin(angle);
                      return (
                        <g key={`label-${i}`}>
                          <text x={lx} y={ly - 2} fill="#c9d1d9" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
                            {rs.axis}
                          </text>
                          <text x={lx} y={ly + 8} fill="#484f58" fontSize="6" textAnchor="middle" fontFamily="sans-serif">
                            {rs.score}
                          </text>
                        </g>
                      );
                    })}
                    {radarScores.map((rs, i) => (
                      <g key={`leg-${i}`}>
                        <rect x="215" y={15 + i * 24} width="6" height="6" rx="1" fill="#00E5FF" opacity="0.6" />
                        <text x="226" y={21 + i * 24} fill="#c9d1d9" fontSize="7" fontFamily="sans-serif">{rs.axis}</text>
                        <text x="270" y={21 + i * 24} fill="#00E5FF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">{rs.score}/100</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Market Comparison Bars
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#FF5500]/50 border border-[#FF5500]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Market Comparison</h3>
              </div>
              <span className="text-[9px] font-bold text-[#FF5500]">Top {marketComparison.percentile}%</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const maxIncome = Math.max(...marketComparison.peers.map(p => p.income), 1);
                return marketComparison.peers.map((peer, i) => {
                  const barWidth = (peer.income / maxIncome) * 170;
                  const y = 10 + i * 26;
                  return (
                    <g key={i}>
                      <text x="0" y={y + 12} fill={peer.isYou ? '#FF5500' : '#c9d1d9'} fontSize="8"
                        fontWeight={peer.isYou ? 'bold' : 'normal'} fontFamily="sans-serif">{peer.name}</text>
                      <rect x="75" y={y} width="170" height="16" rx="3" fill="#21262d" />
                      <rect x="75" y={y} width={Math.max(barWidth, 4)} height="16" rx="3"
                        fill={peer.isYou ? '#FF5500' : '#30363d'} opacity={peer.isYou ? 0.8 : 0.7} />
                      <text x={75 + barWidth + 6} y={y + 12} fill={peer.isYou ? '#FF5500' : '#8b949e'}
                        fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                        {fmtCurrencyShort(peer.income)}
                      </text>
                      {peer.isYou && (
                        <text x="310" y={y + 12} fill="#FF5500" fontSize="7" textAnchor="end" fontWeight="bold" fontFamily="sans-serif">
                          YOU
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Performance Clause Impact
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#CCFF00]/50 border border-[#CCFF00]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Performance Clause Impact</h3>
              </div>
              <span className="text-[9px] font-bold text-[#CCFF00]">{fmtCurrencyShort(clauseBonusData.reduce((s, d) => s + d.potential, 0))}</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const colors = ['#FF5500', '#CCFF00', '#00E5FF', '#8b949e'];
                return clauseBonusData.map((clause, i) => {
                  const barWidth = (clause.potential / maxClauseBonus) * 165;
                  const y = 10 + i * 26;
                  return (
                    <g key={i}>
                      <text x="0" y={y + 12} fill="#c9d1d9" fontSize="8" fontFamily="sans-serif">{clause.type}</text>
                      <rect x="85" y={y} width="165" height="16" rx="3" fill="#21262d" />
                      <rect x="85" y={y} width={Math.max(barWidth, 4)} height="16" rx="3" fill={colors[i]} opacity="0.7" />
                      <text x={85 + barWidth + 6} y={y + 12} fill={colors[i]} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                        {fmtCurrencyShort(clause.potential)}
                      </text>
                      <text x="310" y={y + 12} fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">
                        potential
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section: SVG Engagement Rate Trend Line
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#00E5FF]/50 border border-[#00E5FF]/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Engagement Rate Trend</h3>
              </div>
              <span className="text-[9px] font-bold text-[#00E5FF]">{engagementTrendData[engagementTrendData.length - 1]}%</span>
            </div>
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {(() => {
                const maxVal = Math.max(...engagementTrendData, 1);
                const minVal = Math.min(...engagementTrendData, 0);
                const range = maxVal - minVal || 1;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                const points = engagementTrendData.map((v, i) => ({
                  x: 50 + i * 46,
                  y: 90 - ((v - minVal) / range) * 60,
                  val: v,
                }));
                const lineStr = points.map(p => `${p.x},${p.y}`).join(' ');
                return (
                  <>
                    <line x1="50" y1="30" x2="310" y2="30" stroke="#21262d" strokeWidth="0.5" />
                    <line x1="50" y1="60" x2="310" y2="60" stroke="#21262d" strokeWidth="0.5" />
                    <line x1="50" y1="90" x2="310" y2="90" stroke="#30363d" strokeWidth="0.5" />
                    <text x="45" y="34" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">{maxVal.toFixed(1)}%</text>
                    <text x="45" y="64" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">{((maxVal + minVal) / 2).toFixed(1)}%</text>
                    <text x="45" y="94" fill="#484f58" fontSize="7" textAnchor="end" fontFamily="sans-serif">{minVal.toFixed(1)}%</text>
                    <polyline points={lineStr} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#CCFF00" />
                        <circle cx={p.x} cy={p.y} r="1.5" fill="#161b22" />
                        <text x={p.x} y={p.y - 8} fill="#CCFF00" fontSize="6" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
                          {p.val}%
                        </text>
                        <text x={p.x} y="108" fill="#484f58" fontSize="7" textAnchor="middle" fontFamily="sans-serif">{months[i]}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </motion.div>

          {/* =========================================
              Section A: Brand Value Timeline
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Brand Value Timeline</h3>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-2.5 w-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <span className="text-[9px] font-bold text-emerald-400">+{brandTimeline.growthPct}%</span>
              </div>
            </div>

            {/* SVG bar chart */}
            <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Y-axis labels */}
              <text x="2" y="14" fill="#484f58" fontSize="8" fontFamily="sans-serif">
                {fmtCurrencyShort(Math.max(...brandTimeline.seasons))}
              </text>
              <text x="2" y="68" fill="#484f58" fontSize="8" fontFamily="sans-serif">
                {fmtCurrencyShort(Math.max(...brandTimeline.seasons) / 2)}
              </text>
              <text x="2" y="114" fill="#484f58" fontSize="8" fontFamily="sans-serif">€0</text>

              {/* Horizontal grid lines */}
              <line x1="52" y1="10" x2="310" y2="10" stroke="#21262d" strokeWidth="0.5" />
              <line x1="52" y1="64" x2="310" y2="64" stroke="#21262d" strokeWidth="0.5" />
              <line x1="52" y1="110" x2="310" y2="110" stroke="#30363d" strokeWidth="0.5" />

              {/* Bars */}
              {brandTimeline.seasons.map((val, i) => {
                const maxVal = Math.max(...brandTimeline.seasons);
                const barHeight = maxVal > 0 ? (val / maxVal) * 95 : 0;
                const barX = 70 + i * 62;
                const barY = 110 - barHeight;
                const isCurrentSeason = (i + 1) === currentSeason;
                const width = 38;

                return (
                  <g key={i}>
                    {/* Current season indicator line */}
                    {isCurrentSeason && (
                      <line
                        x1={barX - 6}
                        y1={barY - 6}
                        x2={barX - 6}
                        y2={110}
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                    )}
                    {/* Bar */}
                    <rect
                      x={barX}
                      y={barY}
                      width={width}
                      height={Math.max(barHeight, 2)}
                      rx="3"
                      fill={isCurrentSeason ? '#10b981' : brandTimeline.barColor}
                      opacity={isCurrentSeason ? 1 : 0.45}
                    />
                    {/* Value label on bar */}
                    <text
                      x={barX + width / 2}
                      y={barY - 4}
                      fill={isCurrentSeason ? '#10b981' : '#8b949e'}
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {fmtCurrencyShort(val)}
                    </text>
                    {/* X-axis label */}
                    <text
                      x={barX + width / 2}
                      y={120}
                      fill={isCurrentSeason ? '#10b981' : '#484f58'}
                      fontSize="7"
                      textAnchor="middle"
                      fontWeight={isCurrentSeason ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                    >
                      S{i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* =========================================
              Section B: Sponsorship Tier Pyramid
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-purple-950/50 border border-purple-800/30 flex items-center justify-center">
                <svg className="h-3 w-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="text-xs font-bold text-[#c9d1d9]">Sponsorship Tier Pyramid</h3>
            </div>

            {/* Pyramid levels — top to bottom */}
            <div className="space-y-1.5">
              {tierPyramid.tiers.map((tier, idx) => {
                const tierConf = TIER_COLORS[tier];
                const tv = tierPyramid.tierValues[tier];
                const isCurrent = tier === tierPyramid.currentTier;
                // Pyramid widths: narrower at top, wider at bottom
                const widths = ['w-1/2', 'w-2/3', 'w-5/6', 'w-full'];

                return (
                  <div key={tier} className="flex justify-center">
                    <div
                      className={`${widths[idx]} ${isCurrent ? `border-2 ${tierConf.border}` : 'border border-[#30363d]'} rounded-lg p-2.5 ${isCurrent ? `${tierConf.bg}` : 'bg-[#21262d]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-sm ${tierConf.dot}`} />
                          <span className={`text-[10px] font-bold ${isCurrent ? tierConf.text : 'text-[#8b949e]'}`}>
                            {tier}
                          </span>
                          {isCurrent && (
                            <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] ${isCurrent ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                            {tv.deals} deal{tv.deals !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[8px] text-[#30363d]">|</span>
                          <span className={`text-[9px] font-medium ${isCurrent ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                            {tv.deals > 0 ? fmtCurrencyShort(tv.totalValue) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next tier requirement */}
            {tierPyramid.nextTierReq && (
              <div className="flex items-center gap-2 mt-3 bg-emerald-950/15 rounded-lg px-3 py-2 border border-emerald-800/20">
                <svg className="h-3 w-3 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
                <span className="text-[9px] text-emerald-300">{tierPyramid.nextTierReq}</span>
              </div>
            )}
            {!tierPyramid.nextTierReq && (
              <div className="flex items-center gap-2 mt-3 bg-amber-950/15 rounded-lg px-3 py-2 border border-amber-800/20">
                <svg className="h-3 w-3 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-[9px] text-amber-300">Maximum tier achieved — Platinum status</span>
              </div>
            )}
          </motion.div>

          {/* =========================================
              Section C: Sponsor Relationship Matrix
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Relationship Matrix</h3>
              </div>
              {/* Health score badge */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-[#484f58]">Health</span>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${
                  relationshipMatrix.healthScore >= 70
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : relationshipMatrix.healthScore >= 40
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}>
                  {relationshipMatrix.healthScore}
                </div>
              </div>
            </div>

            {/* Grid of 6 categories */}
            <div className="grid grid-cols-2 gap-1.5">
              {relationshipMatrix.matrix.map((item) => {
                const strengthColors: Record<string, { bg: string; text: string; dot: string }> = {
                  'Exclusive': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
                  'High':      { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    dot: 'bg-cyan-400' },
                  'Medium':    { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400' },
                  'Low':       { bg: 'bg-[#21262d]',       text: 'text-[#484f58]',   dot: 'bg-[#30363d]' },
                };
                const sc = strengthColors[item.strength];

                return (
                  <div
                    key={item.category}
                    className={`rounded-lg p-2.5 border ${item.hasActive ? `${sc.bg} border-[#30363d]` : 'bg-[#21262d] border-[#21262d]'}`}
                  >
                    {/* Category icon + name */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-4 h-4 flex items-center justify-center text-[#8b949e]">
                        {getCategoryIcon(item.category, 'w-3.5 h-3.5')}
                      </div>
                      <span className="text-[8px] font-medium text-[#c9d1d9] truncate">{item.category}</span>
                    </div>
                    {/* Strength indicator */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-sm ${sc.dot}`} />
                      <span className={`text-[8px] font-bold ${sc.text}`}>{item.strength}</span>
                    </div>
                    {/* Brand names */}
                    {item.activeBrands.length > 0 && (
                      <p className="text-[7px] text-emerald-400 truncate">
                        {item.activeBrands.join(', ')}
                      </p>
                    )}
                    {item.activeBrands.length === 0 && item.availableBrands.length > 0 && (
                      <p className="text-[7px] text-[#484f58] truncate">
                        {item.availableBrands.slice(0, 2).join(', ')}
                      </p>
                    )}
                    {item.activeBrands.length === 0 && item.availableBrands.length === 0 && (
                      <p className="text-[7px] text-[#30363d]">No brands</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* =========================================
              Section D: Market Comparison Dashboard
              ========================================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-950/50 border border-amber-800/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#c9d1d9]">Market Comparison</h3>
              </div>
              {/* Rank badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-[#484f58]">Your Position</span>
                <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                  marketComparison.percentile >= 75
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : marketComparison.percentile >= 50
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}>
                  Top {marketComparison.percentile}%
                </div>
              </div>
            </div>

            {/* Peer comparison bars */}
            <div className="space-y-2">
              {marketComparison.peers.map((peer, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  {/* Player name + rating */}
                  <div className="w-20 flex-shrink-0">
                    <p className={`text-[9px] font-bold truncate ${peer.isYou ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {peer.name}
                    </p>
                    <p className="text-[7px] text-[#484f58]">
                      {peer.deals} deals · {peer.rating}
                    </p>
                  </div>
                  {/* Bar background */}
                  <div className="flex-1 h-4 bg-[#21262d] rounded-md overflow-hidden relative">
                    {/* Bar fill */}
                    <div
                      className="h-full rounded-md"
                      style={{
                        width: `${peer.barPct}%`,
                        backgroundColor: peer.isYou ? '#10b981' : '#30363d',
                        opacity: peer.isYou ? 1 : 0.7,
                      }}
                    />
                    {/* Income label inside bar */}
                    <span className={`absolute inset-0 flex items-center px-2 text-[8px] font-bold ${
                      peer.isYou ? 'text-white' : 'text-[#8b949e]'
                    }`}>
                      {fmtCurrencyShort(peer.income)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary line */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#21262d]">
              <span className="text-[8px] text-[#484f58]">
                Rank {marketComparison.yourRank} of 4 players
              </span>
              <span className="text-[8px] text-[#484f58]">
                Based on annual sponsorship income
              </span>
            </div>
          </motion.div>

        </motion.div>
      )}

      {/* =========================================
          TAB: OFFERS — Available Sponsor Offers
          ========================================= */}
      {tab === 'offers' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {availableOffers.map((offer, index) => {
            const tierConf = TIER_COLORS[offer.tier];
            const hasConflict = !!offer.exclusivityConflict;
            const isAccepted = acceptedIds.has(offer.id);
            const meetsOVR = player.overall >= offer.minOVR;
            const meetsFollowers = totalSocialFollowers >= offer.minFollowers;
            const meetsMarketValue = player.marketValue >= offer.minMarketValue;
            const meetsRequirements = meetsOVR && meetsFollowers && meetsMarketValue;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className={`bg-[#161b22] border rounded-lg p-4 ${
                  hasConflict ? 'border-red-800/40' : 'border-[#30363d]'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <SponsorLogo initial={offer.brand[0]} color={offer.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#c9d1d9] truncate">{offer.brand}</h3>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-lg ${tierConf.bg} ${tierConf.text} border ${tierConf.border}`}>
                        {offer.tier}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8b949e]">{offer.category}</span>
                  </div>
                </div>

                {/* Offer details */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                    <p className="text-[8px] text-[#484f58]">Annual</p>
                    <p className="text-[11px] font-bold text-emerald-400">{fmtCurrencyShort(offer.annualValue)}</p>
                  </div>
                  <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                    <p className="text-[8px] text-[#484f58]">Duration</p>
                    <p className="text-[11px] font-bold text-[#c9d1d9]">{offer.contractYears}yr</p>
                  </div>
                  <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                    <p className="text-[8px] text-[#484f58]">Total</p>
                    <p className="text-[11px] font-bold text-amber-400">{fmtCurrencyShort(offer.totalValue)}</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-3 space-y-1">
                  <p className="text-[9px] text-[#8b949e] uppercase tracking-wide font-medium">Requirements</p>
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${meetsOVR ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30' : 'bg-red-950/30 text-red-400 border border-red-800/30'}`}>
                      OVR {offer.minOVR}+
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${meetsFollowers ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30' : 'bg-red-950/30 text-red-400 border border-red-800/30'}`}>
                      {fmtFollowers(offer.minFollowers)} followers
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${meetsMarketValue ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30' : 'bg-red-950/30 text-red-400 border border-red-800/30'}`}>
                      {fmtCurrencyShort(offer.minMarketValue)} value
                    </span>
                  </div>
                </div>

                {/* Exclusivity conflict warning */}
                {hasConflict && (
                  <div className="flex items-center gap-2 bg-red-950/20 rounded-lg px-3 py-2 border border-red-800/20 mb-3">
                    <svg className="h-3.5 w-3.5 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-[9px] text-red-300">{offer.exclusivityConflict}</span>
                  </div>
                )}

                {/* Accept button with 2-click confirmation */}
                {isAccepted ? (
                  <div className="flex items-center justify-center gap-2 bg-emerald-950/20 rounded-lg px-3 py-2.5 border border-emerald-800/30">
                    <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[10px] font-medium text-emerald-400">Deal Accepted!</span>
                  </div>
                ) : confirmingId === offer.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAcceptedIds(prev => new Set(prev).add(offer.id));
                        setConfirmingId(null);
                      }}
                      disabled={hasConflict || !meetsRequirements}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors ${
                        hasConflict || !meetsRequirements
                          ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      Confirm Deal
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="flex-1 py-2 rounded-lg text-[10px] font-medium bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(offer.id)}
                    disabled={hasConflict || !meetsRequirements}
                    className={`w-full py-2.5 rounded-lg text-[10px] font-bold transition-colors ${
                      hasConflict || !meetsRequirements
                        ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed border border-[#30363d]'
                        : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {hasConflict ? 'Exclusivity Conflict' : !meetsRequirements ? 'Requirements Not Met' : 'Accept Deal'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* =========================================
          TAB: HISTORY — Past Sponsorships
          ========================================= */}
      {tab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {sponsorHistory.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
              <svg className="h-10 w-10 text-[#30363d] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-xs text-[#8b949e] mb-1">No Sponsor History</p>
              <p className="text-[10px] text-[#484f58]">Complete sponsorship deals to build history</p>
            </div>
          ) : (
            sponsorHistory.map((entry, index) => {
              const reasonColors: Record<SponsorEndReason, { bg: string; text: string; border: string }> = {
                'Contract Expired': { bg: 'bg-[#21262d]', text: 'text-[#8b949e]', border: 'border-[#30363d]' },
                'Terminated': { bg: 'bg-red-950/20', text: 'text-red-400', border: 'border-red-800/20' },
                'Upgrade': { bg: 'bg-emerald-950/20', text: 'text-emerald-400', border: 'border-emerald-800/20' },
              };
              const reasonConf = reasonColors[entry.endReason];

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + index * 0.06 }}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <SponsorLogo initial={entry.brand[0]} color={entry.color} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#c9d1d9]">{entry.brand}</h3>
                      <span className="text-[10px] text-[#8b949e]">{entry.category} · {entry.yearsActive} season{entry.yearsActive !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{fmtCurrencyShort(entry.totalEarned)}</p>
                      <p className="text-[8px] text-[#484f58]">total earned</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-medium px-2 py-0.5 rounded-lg ${reasonConf.bg} ${reasonConf.text} border ${reasonConf.border}`}>
                        {entry.endReason}
                      </span>
                    </div>
                    <StarRating rating={entry.rating} />
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* =========================================
          TAB: SOCIAL — Social Media Value
          ========================================= */}
      {tab === 'social' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Social Value Summary */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#c9d1d9]">Total Social Value</p>
                  <p className="text-[9px] text-[#8b949e]">{fmtFollowers(totalSocialFollowers)} total followers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-cyan-400">{socialValueMultiplier}x</p>
                <p className="text-[8px] text-[#484f58]">value multiplier</p>
              </div>
            </div>

            {/* Platform cards */}
            <div className="space-y-2">
              {socialPlatforms.map((platform) => (
                <div key={platform.name} className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Platform icon */}
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${platform.color}22`, border: `1px solid ${platform.color}44` }}
                      >
                        {platform.iconPath === 'instagram' && (
                          <svg className="h-3.5 w-3.5" style={{ color: platform.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" />
                            <circle cx="12" cy="12" r="5" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        )}
                        {platform.iconPath === 'twitter' && (
                          <svg className="h-3.5 w-3.5" style={{ color: platform.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                          </svg>
                        )}
                        {platform.iconPath === 'tiktok' && (
                          <svg className="h-3.5 w-3.5" style={{ color: platform.color === '#000000' ? '#c9d1d9' : platform.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-[#c9d1d9]">{platform.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#c9d1d9]">{fmtFollowers(platform.followers)}</p>
                    </div>
                  </div>

                  {/* Engagement rate bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-[#484f58] w-16">Engagement</span>
                    <div className="flex-1 h-1.5 bg-[#0d1117] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg"
                        style={{
                          width: `${Math.min(100, (platform.engagementRate / 10) * 100)}%`,
                          backgroundColor: platform.color === '#000000' ? '#c9d1d9' : platform.color,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-[#8b949e] w-10 text-right">{platform.engagementRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart — Player vs Average Footballer */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-medium mb-3">Following vs Average Footballer</p>
            <svg viewBox="0 0 280 140" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {[0, 35, 70, 105].map((y) => (
                <line key={y} x1="70" y1={y + 15} x2="270" y2={y + 15} stroke="#21262d" strokeWidth="0.5" />
              ))}

              {/* Y-axis labels */}
              <text x="65" y="20" fill="#484f58" fontSize="7" textAnchor="end">2M</text>
              <text x="65" y="55" fill="#484f58" fontSize="7" textAnchor="end">1M</text>
              <text x="65" y="90" fill="#484f58" fontSize="7" textAnchor="end">500K</text>
              <text x="65" y="125" fill="#484f58" fontSize="7" textAnchor="end">0</text>

              {/* Average footballer bars (gray) */}
              {socialPlatforms.map((_, i) => {
                const avgFollower = 200000; // 200K average
                const barHeight = Math.max(2, (avgFollower / 2000000) * 105);
                const x = 85 + i * 70;
                const y = 120 - barHeight;
                return (
                  <g key={`avg-${i}`}>
                    <rect x={x} y={y} width={20} height={barHeight} fill="#21262d" rx="2" />
                    <text x={x + 10} y={y - 4} fill="#484f58" fontSize="6" textAnchor="middle">200K</text>
                    <text x={x + 10} y={135} fill="#484f58" fontSize="6" textAnchor="middle">
                      {socialPlatforms[i].name === 'Instagram' ? 'IG' : socialPlatforms[i].name === 'Twitter/X' ? 'TW' : 'TT'}
                    </text>
                  </g>
                );
              })}

              {/* Player bars (colored) */}
              {socialPlatforms.map((platform, i) => {
                const barHeight = Math.max(2, Math.min(105, (platform.followers / 2000000) * 105));
                const x = 105 + i * 70;
                const y = 120 - barHeight;
                const barColor = platform.color === '#000000' ? '#c9d1d9' : platform.color;
                return (
                  <g key={`player-${i}`}>
                    <rect x={x} y={y} width={20} height={barHeight} fill={barColor} rx="2" opacity="0.8" />
                    <text x={x + 10} y={y - 4} fill={barColor} fontSize="6" textAnchor="middle" fontWeight="bold">
                      {fmtFollowers(platform.followers)}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <rect x="80" y="5" width="8" height="6" fill="#21262d" rx="1" />
              <text x="92" y="11" fill="#8b949e" fontSize="6">Average</text>
              <rect x="130" y="5" width="8" height="6" fill="#10b981" rx="1" />
              <text x="142" y="11" fill="#8b949e" fontSize="6">You</text>
            </svg>
          </div>
        </motion.div>
      )}

      {/* =========================================
          TAB: EVENTS — Endorsement Events
          ========================================= */}
      {tab === 'events' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {endorsementEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 + index * 0.06 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            >
              {/* Event type badge and season */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/30">
                  {event.type}
                </span>
                <span className="text-[8px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-md">
                  {event.season}
                </span>
              </div>

              {/* Brand and description */}
              <div className="flex items-start gap-2 mb-3">
                <SponsorLogo initial={event.brand[0]} color={event.color} />
                <div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">{event.brand}</h3>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">{event.description}</p>
                </div>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                  <p className="text-[8px] text-[#484f58]">Coins</p>
                  <p className="text-[11px] font-bold text-emerald-400">+{fmtCurrencyShort(event.coinReward)}</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                  <p className="text-[8px] text-[#484f58]">Reputation</p>
                  <p className="text-[11px] font-bold text-purple-400">+{event.reputationReward}</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2 border border-[#30363d] text-center">
                  <p className="text-[8px] text-[#484f58]">Time</p>
                  <p className="text-[11px] font-bold text-[#c9d1d9]">{event.timeCommitment}</p>
                </div>
              </div>

              {/* Accept button */}
              <button className="w-full py-2.5 rounded-lg text-[10px] font-bold bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-800/40 transition-colors">
                Accept Event
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
