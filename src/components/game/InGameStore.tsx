'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Footprints,
  Watch,
  PartyPopper,
  Building2,
  Shirt,
  Zap,
  Package,
  Coins,
  Star,
  Filter,
  Shield,
  Dumbbell,
  Sun,
  Eye,
  ChevronDown,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

type StoreCategory = 'boots' | 'accessories' | 'celebrations' | 'stadium' | 'kits' | 'boosts' | 'packs';

interface StatBoost {
  attribute: string;
  value: number;
}

type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

interface StoreItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: 'coins' | 'tokens';
  rarity: Rarity;
  owned: boolean;
  equipped: boolean;
  statBoosts: StatBoost[];
  description: string;
  color: string;
}

interface AccessoryItem {
  id: string;
  name: string;
  price: number;
  currency: 'coins' | 'tokens';
  rarity: Rarity;
  owned: boolean;
  equipped: boolean;
  statBoosts: StatBoost[];
  description: string;
  iconColor: string;
}

interface CelebrationItem {
  id: string;
  name: string;
  price: number;
  currency: 'coins' | 'tokens';
  rarity: Rarity;
  unlocked: boolean;
  description: string;
  poseColor: string;
}

interface StadiumSection {
  id: string;
  name: string;
  currentLevel: number;
  maxLevel: number;
  description: string;
  upgradeDescriptions: string[];
  costs: number[];
  effects: string[];
}

interface BoostItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: 'coins' | 'tokens';
  status: 'available' | 'active' | 'expired';
  iconColor: string;
  matchesRemaining: number;
}

interface PackTier {
  id: string;
  name: string;
  tier: 'Bronze' | 'Silver' | 'Gold';
  price: number;
  currency: 'coins' | 'tokens';
  guaranteedItem: string;
  chanceOfUpgrade: string;
  color: string;
  borderColor: string;
  contentsPreview: string[];
}

interface TransactionRecord {
  id: string;
  itemName: string;
  type: string;
  price: number;
  currency: 'coins' | 'tokens';
  date: string;
  refundable: boolean;
}

// ============================================================
// Deterministic Seeded Random
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ============================================================
// Rarity Colors
// ============================================================

const RARITY_COLORS: Record<Rarity, string> = {
  Common: '#8b949e',
  Rare: '#3b82f6',
  Epic: '#a78bfa',
  Legendary: '#f59e0b',
};

const RARITY_BG: Record<Rarity, string> = {
  Common: 'bg-[#21262d]',
  Rare: 'bg-[#1e3a5f]/40',
  Epic: 'bg-[#2d1b69]/40',
  Legendary: 'bg-[#4a3000]/40',
};

// ============================================================
// Main Component
// ============================================================

export default function InGameStore() {
  const gameState = useGameStore(state => state.gameState);
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('boots');
  const [selectedBootFilter, setSelectedBootFilter] = useState<string>('all');
  const [bootPriceRange, setBootPriceRange] = useState<[number, number]>([0, 5000]);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  // Deterministic seed from game state
  const seed = useMemo(() => {
    if (!gameState) return 42;
    return gameState.player.overall * 100 + gameState.player.age * 7 + gameState.currentWeek * 3 + gameState.currentSeason * 13;
  }, [gameState]);

  // Currency balances (deterministic)
  const coins = useMemo(() => {
    if (!gameState) return 0;
    return 2500 + gameState.player.careerStats.totalGoals * 150 + gameState.player.careerStats.totalAssists * 100 + gameState.currentWeek * 50;
  }, [gameState]);

  const tokens = useMemo(() => {
    if (!gameState) return 0;
    return 10 + Math.floor(gameState.player.reputation / 10) + gameState.achievements.length * 2;
  }, [gameState]);

  // Daily deals timer (deterministic visual)
  const dailyDealsTimer = useMemo(() => {
    if (!gameState) return '23:59:59';
    const totalSeconds = ((gameState.currentWeek * 17 + gameState.currentSeason * 31) % 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [gameState]);

  // New items count
  const newItemsCount = useMemo(() => {
    const rng = seededRandom(seed + 77);
    return Math.floor(rng() * 5) + 1;
  }, [seed]);

  // ============================================================
  // Boots Data
  // ============================================================

  const boots: StoreItem[] = useMemo(() => {
    const rng = seededRandom(seed + 1);
    const brands = ['Nike', 'Adidas', 'Puma', 'Umbro', 'New Balance'];
    const models: Record<string, string[]> = {
      Nike: ['Mercurial Superfly', 'Phantom GT', 'Tiempo Legend', 'Vapor Edge'],
      Adidas: ['Predator Edge', 'X Speedportal', 'Copa Pure', 'Nemeziz'],
      Puma: ['Future Z', 'Ultra Ultimate', 'King Platinum'],
      Umbro: ['Speciali Eternal', 'Accer Pro'],
      'New Balance': ['Tekela v4', 'Furon v7'],
    };
    const bootColors = ['#ef4444', '#3b82f6', '#34d399', '#f59e0b', '#a78bfa', '#ec4899', '#06b6d4', '#f97316'];
    const rarities: Rarity[] = ['Common', 'Common', 'Rare', 'Rare', 'Epic', 'Epic', 'Legendary', 'Legendary'];
    const bootNames: string[] = [];

    brands.forEach(brand => {
      models[brand].forEach(model => {
        bootNames.push(`${brand} ${model}`);
      });
    });

    const items: StoreItem[] = [];
    for (let i = 0; i < 8; i++) {
      const brandIdx = Math.floor(rng() * brands.length);
      const brand = brands[brandIdx];
      const modelList = models[brand];
      const model = modelList[Math.floor(rng() * modelList.length)];
      const rarity = rarities[i];
      const basePrice = rarity === 'Common' ? 200 : rarity === 'Rare' ? 800 : rarity === 'Epic' ? 2000 : 4000;
      const price = basePrice + Math.floor(rng() * 500);
      const owned = rng() > 0.6;
      const equipped = owned && rng() > 0.8;

      const allStats: string[] = ['Shooting', 'Pace', 'Dribbling', 'Passing'];
      const boostCount = rarity === 'Common' ? 1 : rarity === 'Rare' ? 2 : rarity === 'Epic' ? 3 : 4;
      const stats: StatBoost[] = [];
      const shuffledStats = [...allStats].sort(() => rng() - 0.5);
      for (let s = 0; s < boostCount; s++) {
        stats.push({
          attribute: shuffledStats[s],
          value: rarity === 'Legendary' ? 3 + Math.floor(rng() * 2) : rarity === 'Epic' ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2),
        });
      }

      items.push({
        id: `boot-${i}`,
        name: `${brand} ${model}`,
        brand,
        price,
        currency: 'coins',
        rarity,
        owned,
        equipped,
        statBoosts: stats,
        description: `${brand} ${model} — premium football boot with enhanced ${stats.map(s => s.attribute).join(', ')}`,
        color: bootColors[i],
      });
    }
    return items;
  }, [seed]);

  // Filtered boots
  const filteredBoots = useMemo(() => {
    return boots.filter(b => {
      if (selectedBootFilter !== 'all' && b.brand !== selectedBootFilter) return false;
      if (b.price < bootPriceRange[0] || b.price > bootPriceRange[1]) return false;
      return true;
    });
  }, [boots, selectedBootFilter, bootPriceRange]);

  // ============================================================
  // Accessories Data
  // ============================================================

  const accessories: AccessoryItem[] = useMemo(() => {
    const rng = seededRandom(seed + 2);
    const data: Omit<AccessoryItem, 'id' | 'owned' | 'equipped'>[] = [
      { name: 'Captain Armband', price: 300, currency: 'coins', rarity: 'Rare', statBoosts: [{ attribute: 'Physical', value: 1 }], description: 'Lead by example on the pitch', iconColor: '#f59e0b' },
      { name: 'Wristband Set', price: 150, currency: 'coins', rarity: 'Common', statBoosts: [{ attribute: 'Dribbling', value: 1 }], description: 'Absorb sweat, maintain grip', iconColor: '#3b82f6' },
      { name: 'Headband Classic', price: 200, currency: 'coins', rarity: 'Common', statBoosts: [{ attribute: 'Pace', value: 1 }], description: 'Keep hair out of your eyes', iconColor: '#ef4444' },
      { name: 'Pro Grip Gloves', price: 500, currency: 'coins', rarity: 'Rare', statBoosts: [{ attribute: 'Passing', value: 2 }], description: 'Superior grip in all conditions', iconColor: '#34d399' },
      { name: 'Undershorts Pro', price: 250, currency: 'coins', rarity: 'Common', statBoosts: [{ attribute: 'Physical', value: 1 }], description: 'Compression support for muscles', iconColor: '#8b949e' },
      { name: 'Elite Tape Kit', price: 400, currency: 'coins', rarity: 'Rare', statBoosts: [{ attribute: 'Shooting', value: 1 }, { attribute: 'Passing', value: 1 }], description: 'Ankle and wrist support tape', iconColor: '#a78bfa' },
    ];
    return data.map((d, i) => ({
      ...d,
      id: `acc-${i}`,
      owned: rng() > 0.5,
      equipped: rng() > 0.85,
    }));
  }, [seed]);

  // ============================================================
  // Celebrations Data
  // ============================================================

  const celebrations: CelebrationItem[] = useMemo(() => {
    const rng = seededRandom(seed + 3);
    const data: Omit<CelebrationItem, 'id' | 'unlocked'>[] = [
      { name: 'Robot Dance', price: 200, currency: 'coins', rarity: 'Common', description: 'Mechanical dance moves after scoring', poseColor: '#8b949e' },
      { name: 'Backflip', price: 800, currency: 'coins', rarity: 'Rare', description: 'Athletic backflip celebration', poseColor: '#3b82f6' },
      { name: 'Slide', price: 500, currency: 'coins', rarity: 'Rare', description: 'Chest-first slide on the grass', poseColor: '#34d399' },
      { name: 'Knee Slide', price: 300, currency: 'coins', rarity: 'Common', description: 'Classic knee slide celebration', poseColor: '#f59e0b' },
      { name: 'Double Fist Pump', price: 150, currency: 'coins', rarity: 'Common', description: 'Pump both fists in the air', poseColor: '#ef4444' },
      { name: 'Phone Call', price: 1200, currency: 'coins', rarity: 'Epic', description: 'Make a celebratory phone call', poseColor: '#a78bfa' },
    ];
    return data.map((d, i) => ({
      ...d,
      id: `cele-${i}`,
      unlocked: rng() > 0.6,
    }));
  }, [seed]);

  // ============================================================
  // Stadium Upgrades Data
  // ============================================================

  const stadiumSections: StadiumSection[] = useMemo(() => {
    const rng = seededRandom(seed + 4);
    return [
      {
        id: 'main-stand',
        name: 'Main Stand',
        currentLevel: Math.min(5, 1 + Math.floor(rng() * 3)),
        maxLevel: 5,
        description: 'Primary seating and VIP facilities',
        upgradeDescriptions: [
          'Basic uncovered seating',
          'Covered seating (2,000 capacity)',
          'VIP boxes added (3,500 capacity)',
          'Press facilities + expanded VIP (5,000 capacity)',
          'Premium corporate suites (7,500 capacity)',
        ],
        costs: [0, 2000, 5000, 10000, 20000],
        effects: ['+500 capacity', '+1,500 capacity', '+2,000 capacity', '+2,500 capacity'],
      },
      {
        id: 'corner-sections',
        name: 'Corner Sections',
        currentLevel: Math.min(5, Math.floor(rng() * 2)),
        maxLevel: 5,
        description: 'Additional corner seating and fan zones',
        upgradeDescriptions: [
          'Empty corners',
          'Basic corner seats (1,000 capacity)',
          'Fan zone with flags (2,000 capacity)',
          'Away fan section (3,000 capacity)',
          'Full corner development (4,500 capacity)',
        ],
        costs: [0, 1500, 4000, 8000, 15000],
        effects: ['+1,000 capacity', '+1,000 capacity', '+1,000 capacity', '+1,500 capacity'],
      },
      {
        id: 'roof-facilities',
        name: 'Roof & Facilities',
        currentLevel: Math.min(3, Math.floor(rng() * 2)),
        maxLevel: 3,
        description: 'Weather protection and amenities',
        upgradeDescriptions: [
          'Open-air stadium',
          'Partial roof coverage + catering',
          'Full roof + premium toilets + concourses',
        ],
        costs: [0, 8000, 25000],
        effects: ['Weather protection', 'Premium facilities'],
      },
      {
        id: 'pitch-quality',
        name: 'Pitch Quality',
        currentLevel: Math.min(5, 1 + Math.floor(rng() * 2)),
        maxLevel: 5,
        description: 'Playing surface quality and drainage',
        upgradeDescriptions: [
          'Basic grass pitch',
          'Improved drainage system',
          'Hybrid pitch surface',
          'Undersoil heating installed',
          'World-class Desso pitch',
        ],
        costs: [0, 3000, 7000, 12000, 18000],
        effects: ['Better drainage', 'Hybrid surface', 'Winter play', 'Top quality'],
      },
    ];
  }, [seed]);

  const stadiumOverview = useMemo(() => {
    const baseCapacity = 15000;
    const levelBonuses = [0, 500, 1000, 2000, 2500];
    let totalCapacity = baseCapacity;
    stadiumSections.forEach(s => {
      totalCapacity += levelBonuses[s.currentLevel] || 0;
    });
    const totalLevels = stadiumSections.reduce((sum, s) => sum + s.currentLevel, 0);
    const maxLevels = stadiumSections.reduce((sum, s) => sum + s.maxLevel, 0);
    const overallRating = Math.round((totalLevels / maxLevels) * 100);
    const matchdayRevenue = Math.floor(totalCapacity * 35 + overallRating * 200);
    return { totalCapacity, overallRating, matchdayRevenue };
  }, [stadiumSections]);

  // ============================================================
  // Boost Items Data
  // ============================================================

  const boostItems: BoostItem[] = useMemo(() => {
    const rng = seededRandom(seed + 5);
    return [
      {
        id: 'boost-training',
        name: 'Training Boost',
        description: '+50% training XP for 3 matches',
        duration: '3 matches',
        price: 500,
        currency: 'coins',
        status: rng() > 0.7 ? 'active' : 'available',
        iconColor: '#f59e0b',
        matchesRemaining: rng() > 0.7 ? 2 : 3,
      },
      {
        id: 'boost-confidence',
        name: 'Match Confidence',
        description: '+5 morale for next match',
        duration: '1 match',
        price: 300,
        currency: 'coins',
        status: rng() > 0.8 ? 'active' : 'available',
        iconColor: '#ef4444',
        matchesRemaining: 1,
      },
      {
        id: 'boost-scout',
        name: 'Scout Boost',
        description: 'Reveals hidden player potential for 1 week',
        duration: '1 week',
        price: 800,
        currency: 'coins',
        status: 'available',
        iconColor: '#3b82f6',
        matchesRemaining: 0,
      },
      {
        id: 'boost-shield',
        name: 'Injury Shield',
        description: 'Reduces injury risk by 50% for 5 matches',
        duration: '5 matches',
        price: 1000,
        currency: 'coins',
        status: rng() > 0.9 ? 'active' : 'available',
        iconColor: '#34d399',
        matchesRemaining: rng() > 0.9 ? 4 : 5,
      },
    ];
  }, [seed]);

  // ============================================================
  // Mystery Packs Data
  // ============================================================

  const packTiers: PackTier[] = useMemo(() => {
    return [
      {
        id: 'pack-bronze',
        name: 'Bronze Pack',
        tier: 'Bronze',
        price: 500,
        currency: 'coins',
        guaranteedItem: '1 Common item',
        chanceOfUpgrade: '20% chance of Rare',
        color: '#cd7f32',
        borderColor: '#8b6914',
        contentsPreview: ['Common Boots', 'Common Accessory', 'Common Celebration'],
      },
      {
        id: 'pack-silver',
        name: 'Silver Pack',
        tier: 'Silver',
        price: 1500,
        currency: 'coins',
        guaranteedItem: '1 Rare item',
        chanceOfUpgrade: '25% chance of Epic',
        color: '#c0c0c0',
        borderColor: '#8b949e',
        contentsPreview: ['Rare Boots', 'Rare Accessory', 'Mystery Item'],
      },
      {
        id: 'pack-gold',
        name: 'Gold Pack',
        tier: 'Gold',
        price: 3000,
        currency: 'coins',
        guaranteedItem: '1 Epic item',
        chanceOfUpgrade: '15% chance of Legendary',
        color: '#f59e0b',
        borderColor: '#b45309',
        contentsPreview: ['Epic Boots', 'Epic Accessory', 'Epic Celebration', 'Mystery Item'],
      },
    ];
  }, []);

  // Pack opening history (deterministic)
  const packHistory: TransactionRecord[] = useMemo(() => {
    const rng = seededRandom(seed + 6);
    const history: TransactionRecord[] = [];
    const packTypes = ['Bronze Pack', 'Silver Pack', 'Gold Pack'];
    const itemTypes = ['Boots', 'Accessory', 'Celebration', 'Kit'];
    for (let i = 0; i < 5; i++) {
      const packType = packTypes[Math.floor(rng() * packTypes.length)];
      const itemType = itemTypes[Math.floor(rng() * itemTypes.length)];
      history.push({
        id: `history-${i}`,
        itemName: `${packType} — ${itemType}`,
        type: 'Pack',
        price: packType === 'Bronze Pack' ? 500 : packType === 'Silver Pack' ? 1500 : 3000,
        currency: 'coins',
        date: `Season ${gameState?.currentSeason ?? 1}, Week ${Math.max(1, (gameState?.currentWeek ?? 1) - i - 1)}`,
        refundable: i === 0,
      });
    }
    return history;
  }, [seed, gameState]);

  // ============================================================
  // Transaction History
  // ============================================================

  const transactionHistory: TransactionRecord[] = useMemo(() => {
    const rng = seededRandom(seed + 7);
    const history: TransactionRecord[] = [];
    const purchaseItems = [
      { name: 'Nike Mercurial Superfly', type: 'Boots' },
      { name: 'Captain Armband', type: 'Accessory' },
      { name: 'Robot Dance', type: 'Celebration' },
      { name: 'Main Stand Upgrade', type: 'Stadium' },
      { name: 'Training Boost', type: 'Boost' },
      { name: 'Bronze Pack', type: 'Pack' },
      { name: 'Adidas Predator Edge', type: 'Boots' },
      { name: 'Wristband Set', type: 'Accessory' },
      { name: 'Backflip', type: 'Celebration' },
      { name: 'Pitch Quality Upgrade', type: 'Stadium' },
    ];
    for (let i = 0; i < 10; i++) {
      const item = purchaseItems[i];
      history.push({
        id: `txn-${i}`,
        itemName: item.name,
        type: item.type,
        price: 100 + Math.floor(rng() * 3000),
        currency: i === 9 ? 'tokens' as const : 'coins' as const,
        date: `Season ${gameState?.currentSeason ?? 1}, Week ${Math.max(1, (gameState?.currentWeek ?? 1) - i)}`,
        refundable: i === 0,
      });
    }
    return history;
  }, [seed, gameState]);

  // ============================================================
  // Categories config
  // ============================================================

  const categories: { id: StoreCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'boots', label: 'Boots', icon: <Footprints className="h-4 w-4" /> },
    { id: 'accessories', label: 'Accessories', icon: <Watch className="h-4 w-4" /> },
    { id: 'celebrations', label: 'Celebrations', icon: <PartyPopper className="h-4 w-4" /> },
    { id: 'stadium', label: 'Stadium', icon: <Building2 className="h-4 w-4" /> },
    { id: 'kits', label: 'Kits', icon: <Shirt className="h-4 w-4" /> },
    { id: 'boosts', label: 'Boosts', icon: <Zap className="h-4 w-4" /> },
    { id: 'packs', label: 'Packs', icon: <Package className="h-4 w-4" /> },
  ];

  // ============================================================
  // SVG Boot Silhouette
  // ============================================================

  function BootSVG({ color }: { color: string }) {
    return (
      <svg viewBox="0 0 64 40" className="w-14 h-9" fill="none">
        <path
          d="M8 32c0-4 2-8 6-10l4-2 8-4 6-2 8-2 6-1h4l6 1 4 3 2 4v8c0 2-2 4-4 4H12c-2 0-4-2-4-4v-5z"
          fill={color}
          opacity={0.85}
        />
        <path
          d="M16 28l4-6 8-4 6-2 8-2 6-1"
          stroke="#0d1117"
          strokeWidth={1.5}
          opacity={0.4}
        />
        <ellipse cx="48" cy="33" rx="3" ry="2" fill="#0d1117" opacity={0.3} />
        <ellipse cx="42" cy="33" rx="3" ry="2" fill="#0d1117" opacity={0.3} />
        <ellipse cx="36" cy="33" rx="3" ry="2" fill="#0d1117" opacity={0.3} />
      </svg>
    );
  }

  // ============================================================
  // SVG Celebration Pose
  // ============================================================

  function CelebrationPoseSVG({ color, type }: { color: string; type: number }) {
    const poses = [
      // Robot Dance - arms at 90 degrees
      <g key="robot">
        <circle cx="32" cy="10" r="5" fill={color} />
        <line x1="32" y1="15" x2="32" y2="30" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="18" y2="20" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="46" y2="20" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="24" y2="38" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="40" y2="38" stroke={color} strokeWidth={2.5} />
      </g>,
      // Backflip - figure upside down
      <g key="backflip">
        <circle cx="32" cy="30" r="5" fill={color} />
        <line x1="32" y1="25" x2="32" y2="10" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="20" y2="14" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="44" y2="14" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="10" x2="38" y2="4" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="10" x2="26" y2="4" stroke={color} strokeWidth={2.5} />
      </g>,
      // Slide - horizontal figure
      <g key="slide">
        <circle cx="18" cy="24" r="5" fill={color} />
        <line x1="23" y1="24" x2="42" y2="26" stroke={color} strokeWidth={2.5} />
        <line x1="30" y1="24" x2="28" y2="16" stroke={color} strokeWidth={2.5} />
        <line x1="36" y1="25" x2="34" y2="18" stroke={color} strokeWidth={2.5} />
        <line x1="42" y1="26" x2="48" y2="30" stroke={color} strokeWidth={2.5} />
      </g>,
      // Knee Slide - one knee down
      <g key="kneel">
        <circle cx="32" cy="10" r="5" fill={color} />
        <line x1="32" y1="15" x2="30" y2="26" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="20" y2="28" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="42" y2="12" stroke={color} strokeWidth={2.5} />
        <line x1="30" y1="26" x2="24" y2="36" stroke={color} strokeWidth={2.5} />
        <line x1="30" y1="26" x2="36" y2="36" stroke={color} strokeWidth={2.5} />
      </g>,
      // Double Fist Pump - arms raised
      <g key="pump">
        <circle cx="32" cy="12" r="5" fill={color} />
        <line x1="32" y1="17" x2="32" y2="30" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="22" x2="18" y2="8" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="22" x2="46" y2="8" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="24" y2="38" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="40" y2="38" stroke={color} strokeWidth={2.5} />
      </g>,
      // Phone Call - hand to ear
      <g key="phone">
        <circle cx="32" cy="10" r="5" fill={color} />
        <line x1="32" y1="15" x2="32" y2="30" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="40" y2="12" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="20" x2="22" y2="28" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="24" y2="38" stroke={color} strokeWidth={2.5} />
        <line x1="32" y1="30" x2="40" y2="38" stroke={color} strokeWidth={2.5} />
        <rect x="38" y="9" width="6" height="10" rx={2} fill={color} opacity={0.6} />
      </g>,
    ];
    return (
      <svg viewBox="0 0 64 42" className="w-12 h-8">
        {poses[type] || poses[0]}
      </svg>
    );
  }

  // ============================================================
  // SVG Pack Illustration
  // ============================================================

  function PackSVG({ color, borderColor }: { color: string; borderColor: string }) {
    return (
      <svg viewBox="0 0 80 100" className="w-20 h-24">
        <rect x="8" y="15" width="64" height="75" rx={8} fill={color} opacity={0.2} stroke={borderColor} strokeWidth={2} />
        <rect x="14" y="20" width="52" height="65" rx={6} fill={color} opacity={0.4} />
        <line x1="20" y1="45" x2="60" y2="45" stroke={borderColor} strokeWidth={1.5} opacity={0.5} />
        <line x1="20" y1="55" x2="50" y2="55" stroke={borderColor} strokeWidth={1.5} opacity={0.3} />
        <rect x="30" y="8" width="20" height="14" rx={3} fill={color} stroke={borderColor} strokeWidth={1.5} />
        <circle cx="40" cy="15" r="3" fill={borderColor} opacity={0.6} />
        <text x="40" y="75" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">?</text>
      </svg>
    );
  }

  // ============================================================
  // Level Dots Component
  // ============================================================

  function LevelDots({ current, max }: { current: number; max: number }) {
    return (
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm transition-opacity ${
              i < current ? 'bg-emerald-500 opacity-100' : 'bg-[#30363d] opacity-50'
            }`}
          />
        ))}
      </div>
    );
  }

  // ============================================================
  // Rarity Badge
  // ============================================================

  function RarityBadge({ rarity }: { rarity: Rarity }) {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
        style={{
          color: RARITY_COLORS[rarity],
          backgroundColor: `${RARITY_COLORS[rarity]}18`,
        }}
      >
        {rarity}
      </span>
    );
  }

  // ============================================================
  // Active Boost Indicator
  // ============================================================

  const activeBoostsCount = useMemo(() => {
    return boostItems.filter(b => b.status === 'active').length;
  }, [boostItems]);

  // ============================================================
  // Render
  // ============================================================

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No game state available</p>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-8 max-w-lg mx-auto space-y-4">
      {/* ============ 1. STORE HEADER ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Player Store</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase text-[#f59e0b] bg-[#f59e0b]/10 px-2.5 py-1 rounded-lg">
              <Clock className="h-3 w-3" />
              Daily Deals
            </span>
            <span className="font-mono text-xs text-[#f59e0b] bg-[#161b22] px-2 py-1 rounded-lg border border-[#f59e0b]/20">
              {dailyDealsTimer}
            </span>
          </div>
        </div>

        {/* Currency & Badges Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="#f59e0b">
                <circle cx="10" cy="10" r="9" fill="#f59e0b" opacity={0.3} />
                <circle cx="10" cy="10" r="7" fill="#f59e0b" />
                <text x="10" y="13.5" textAnchor="middle" fontSize="9" fill="#0d1117" fontWeight="bold">C</text>
              </svg>
              <span className="text-sm font-bold text-[#f59e0b]">{coins.toLocaleString()}</span>
              <span className="text-[10px] text-[#8b949e]">Coins</span>
            </div>
            {/* Tokens */}
            <div className="flex items-center gap-1.5 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="#3b82f6">
                <circle cx="10" cy="10" r="9" fill="#3b82f6" opacity={0.3} />
                <polygon points="10,2 12.5,7 18,8 14,12 15,18 10,15 5,18 6,12 2,8 7.5,7" fill="#3b82f6" />
              </svg>
              <span className="text-sm font-bold text-[#3b82f6]">{tokens}</span>
              <span className="text-[10px] text-[#8b949e]">Tokens</span>
            </div>
          </div>

          {/* New Items Badge */}
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
            <Sparkles className="h-3 w-3 mr-1" />
            {newItemsCount} New
          </Badge>
        </div>

        {/* Active Boosts Bar */}
        {activeBoostsCount > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span className="text-[10px] font-semibold text-[#f59e0b] uppercase tracking-wide">Active Boosts</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {boostItems.filter(b => b.status === 'active').map(boost => (
                <div
                  key={boost.id}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-1.5 border border-[#30363d]"
                >
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: boost.iconColor }} />
                  <span className="text-[11px] font-medium text-[#c9d1d9] whitespace-nowrap">{boost.name}</span>
                  <span className="text-[10px] text-[#8b949e]">{boost.matchesRemaining} left</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ============ 2. CATEGORY TABS ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="overflow-x-auto pb-1 -mx-1 px-1"
      >
        <div className="flex gap-1.5 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:border-[#30363d] hover:text-[#c9d1d9]'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ============ 3. BOOTS COLLECTION ============ */}
      {activeCategory === 'boots' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[#8b949e]">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Filter</span>
            </div>
            <select
              value={selectedBootFilter}
              onChange={e => setSelectedBootFilter(e.target.value)}
              className="bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Brands</option>
              <option value="Nike">Nike</option>
              <option value="Adidas">Adidas</option>
              <option value="Puma">Puma</option>
              <option value="Umbro">Umbro</option>
              <option value="New Balance">New Balance</option>
            </select>
            <select
              value={bootPriceRange[1]}
              onChange={e => setBootPriceRange([0, Number(e.target.value)])}
              className="bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
            >
              <option value={5000}>Max 5,000</option>
              <option value={1000}>Max 1,000</option>
              <option value={500}>Max 500</option>
              <option value={2000}>Max 2,000</option>
            </select>
          </div>

          {/* Boot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredBoots.map(boot => (
              <motion.div
                key={boot.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#161b22] border rounded-xl p-3 relative ${
                  boot.equipped ? 'border-emerald-500/40' : 'border-[#30363d]'
                } ${RARITY_BG[boot.rarity]}`}
              >
                {/* Equipped Badge */}
                {boot.equipped && (
                  <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-lg">
                    Equipped
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Boot SVG */}
                  <div className="flex-shrink-0 mt-1">
                    <BootSVG color={boot.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[#8b949e] font-medium">{boot.brand}</span>
                      <RarityBadge rarity={boot.rarity} />
                    </div>
                    <h3 className="text-xs font-semibold text-[#c9d1d9] truncate mb-1.5">{boot.name}</h3>

                    {/* Stat Boosts */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {boot.statBoosts.map((stat, si) => (
                        <span key={si} className="text-[10px] bg-[#21262d] text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium">
                          +{stat.value} {stat.attribute}
                        </span>
                      ))}
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-[#f59e0b]" />
                        <span className="text-xs font-bold text-[#f59e0b]">{boot.price.toLocaleString()}</span>
                      </div>
                      {boot.owned ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          Owned
                        </span>
                      ) : (
                        <button className="text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg transition-colors">
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredBoots.length === 0 && (
            <div className="text-center py-8 text-[#8b949e] text-sm">
              No boots match your filters
            </div>
          )}
        </motion.div>
      )}

      {/* ============ 4. ACCESSORIES & CELEBRATIONS ============ */}
      {activeCategory === 'accessories' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accessories.map(acc => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#161b22] border rounded-xl p-3 ${RARITY_BG[acc.rarity]} ${
                  acc.equipped ? 'border-emerald-500/40' : 'border-[#30363d]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${acc.iconColor}20` }}
                  >
                    <Watch className="h-5 w-5" style={{ color: acc.iconColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-xs font-semibold text-[#c9d1d9]">{acc.name}</h3>
                      <RarityBadge rarity={acc.rarity} />
                    </div>
                    <p className="text-[10px] text-[#8b949e] mb-1.5">{acc.description}</p>

                    {/* Stat Boosts */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {acc.statBoosts.map((stat, si) => (
                        <span key={si} className="text-[10px] bg-[#21262d] text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium">
                          +{stat.value} {stat.attribute}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-[#f59e0b]" />
                        <span className="text-xs font-bold text-[#f59e0b]">{acc.price.toLocaleString()}</span>
                      </div>
                      {acc.owned ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          {acc.equipped ? 'Equipped' : 'Owned'}
                        </span>
                      ) : (
                        <button className="text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg transition-colors">
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeCategory === 'celebrations' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {celebrations.map((cele, idx) => (
              <motion.div
                key={cele.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#161b22] border rounded-xl p-3 ${RARITY_BG[cele.rarity]} border-[#30363d]`}
              >
                <div className="flex items-start gap-3">
                  {/* Pose SVG */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cele.poseColor}15` }}
                  >
                    <CelebrationPoseSVG color={cele.poseColor} type={idx} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-xs font-semibold text-[#c9d1d9]">{cele.name}</h3>
                      <RarityBadge rarity={cele.rarity} />
                    </div>
                    <p className="text-[10px] text-[#8b949e] mb-2">{cele.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-[#f59e0b]" />
                        <span className="text-xs font-bold text-[#f59e0b]">{cele.price.toLocaleString()}</span>
                      </div>
                      {cele.unlocked ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          Unlocked
                        </span>
                      ) : (
                        <button className="text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg transition-colors">
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============ 5. STADIUM UPGRADES ============ */}
      {activeCategory === 'stadium' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* Stadium Overview */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-[#c9d1d9]">Stadium Overview</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-0.5">Capacity</p>
                <p className="text-lg font-bold text-[#c9d1d9]">{stadiumOverview.totalCapacity.toLocaleString()}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-0.5">Rating</p>
                <p className="text-lg font-bold text-emerald-400">{stadiumOverview.overallRating}</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wide mb-0.5">Revenue</p>
                <p className="text-lg font-bold text-[#f59e0b]">{stadiumOverview.matchdayRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {stadiumSections.map(section => {
            const isMaxed = section.currentLevel >= section.maxLevel;
            const nextCost = isMaxed ? 0 : section.costs[section.currentLevel];
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#c9d1d9]">{section.name}</h3>
                    <p className="text-[10px] text-[#8b949e]">{section.description}</p>
                  </div>
                  <LevelDots current={section.currentLevel} max={section.maxLevel} />
                </div>

                {/* Current Level Description */}
                <div className="bg-[#21262d] rounded-lg p-2 mb-2">
                  <p className="text-[11px] text-[#c9d1d9]">
                    <span className="text-[#8b949e]">Current:</span>{' '}
                    {section.upgradeDescriptions[section.currentLevel - 1] || section.upgradeDescriptions[0]}
                  </p>
                </div>

                {/* Next Level Preview */}
                {!isMaxed && (
                  <div className="bg-[#21262d] rounded-lg p-2 mb-2 border border-[#30363d]">
                    <div className="flex items-center gap-1 mb-0.5">
                      <ChevronDown className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                        Level {section.currentLevel + 1}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#c9d1d9]">
                      {section.upgradeDescriptions[section.currentLevel]}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {section.effects[section.currentLevel - 1] || 'Enhanced facilities'}
                    </p>
                  </div>
                )}

                {/* Upgrade Button */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]">
                    Level {section.currentLevel}/{section.maxLevel}
                  </span>
                  {isMaxed ? (
                    <span className="text-[10px] font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-1 rounded-lg">
                      MAX
                    </span>
                  ) : (
                    <button className="text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Upgrade — {nextCost.toLocaleString()}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ============ 6. KITS TAB ============ */}
      {activeCategory === 'kits' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-[#c9d1d9]">Kit Customizations</h2>
            </div>
            <p className="text-[11px] text-[#8b949e] mb-3">Additional kit styles and colorways for your player.</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Classic White', price: 200, owned: true, color: '#e5e7eb' },
                { name: 'Midnight Black', price: 200, owned: true, color: '#1f2937' },
                { name: 'Neon Green', price: 500, owned: false, color: '#34d399' },
                { name: 'Royal Blue', price: 500, owned: false, color: '#3b82f6' },
                { name: 'Crimson Red', price: 500, owned: false, color: '#ef4444' },
                { name: 'Gold Edition', price: 1500, owned: false, color: '#f59e0b' },
              ].map((kit, i) => (
                <div key={i} className="bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]">
                  <div
                    className="w-full h-12 rounded-lg mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `${kit.color}30` }}
                  >
                    <Shirt className="h-6 w-6" style={{ color: kit.color }} />
                  </div>
                  <p className="text-[11px] font-medium text-[#c9d1d9] mb-1">{kit.name}</p>
                  {kit.owned ? (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">Owned</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-[#f59e0b]" />
                      <span className="text-[11px] font-bold text-[#f59e0b]">{kit.price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============ 7. BOOST ITEMS ============ */}
      {activeCategory === 'boosts' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boostItems.map(boost => (
              <motion.div
                key={boost.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`bg-[#161b22] border rounded-xl p-3 ${
                  boost.status === 'active' ? 'border-[#f59e0b]/40' : 'border-[#30363d]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${boost.iconColor}20` }}
                  >
                    {boost.id === 'boost-training' && <Dumbbell className="h-5 w-5" style={{ color: boost.iconColor }} />}
                    {boost.id === 'boost-confidence' && <Sun className="h-5 w-5" style={{ color: boost.iconColor }} />}
                    {boost.id === 'boost-scout' && <Eye className="h-5 w-5" style={{ color: boost.iconColor }} />}
                    {boost.id === 'boost-shield' && <Shield className="h-5 w-5" style={{ color: boost.iconColor }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-[#c9d1d9] mb-0.5">{boost.name}</h3>
                    <p className="text-[10px] text-[#8b949e] mb-1">{boost.description}</p>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded-sm">
                        <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                        {boost.duration}
                      </span>
                      {boost.status === 'active' && (
                        <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded-sm">
                          {boost.matchesRemaining} remaining
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-[#f59e0b]" />
                        <span className="text-xs font-bold text-[#f59e0b]">{boost.price.toLocaleString()}</span>
                      </div>
                      {boost.status === 'active' ? (
                        <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      ) : boost.status === 'expired' ? (
                        <span className="text-[10px] font-medium text-[#8b949e] bg-[#21262d] px-2 py-1 rounded-lg">
                          Expired
                        </span>
                      ) : (
                        <button className="text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-3 py-1 rounded-lg transition-colors">
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============ 8. MYSTERY PACKS ============ */}
      {activeCategory === 'packs' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* Pack Tiers */}
          <div className="grid grid-cols-3 gap-2">
            {packTiers.map(pack => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-[#161b22] border rounded-xl p-3 text-center cursor-pointer"
                style={{ borderColor: `${pack.borderColor}60` }}
                onClick={() => setExpandedPack(expandedPack === pack.id ? null : pack.id)}
              >
                <div className="flex justify-center mb-2">
                  <PackSVG color={pack.color} borderColor={pack.borderColor} />
                </div>
                <h3 className="text-xs font-semibold text-[#c9d1d9] mb-1">{pack.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="h-3 w-3 text-[#f59e0b]" />
                  <span className="text-xs font-bold text-[#f59e0b]">{pack.price.toLocaleString()}</span>
                </div>
                <button
                  className="w-full text-[10px] font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 px-2 py-1.5 rounded-lg transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  Buy Pack
                </button>
              </motion.div>
            ))}
          </div>

          {/* Expanded Pack Details */}
          {expandedPack && packTiers.map(pack => {
            if (pack.id !== expandedPack) return null;
            return (
              <motion.div
                key={`detail-${pack.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#161b22] border rounded-xl p-3 space-y-2"
                style={{ borderColor: `${pack.borderColor}40` }}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: pack.color }} />
                  <h3 className="text-xs font-semibold text-[#c9d1d9]">{pack.name} Contents</h3>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">Guaranteed: {pack.guaranteedItem}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-[#a78bfa]" />
                    <span className="text-[10px] text-[#a78bfa] font-medium">{pack.chanceOfUpgrade}</span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wide font-semibold mb-1">Possible Items</p>
                  <div className="flex flex-wrap gap-1">
                    {pack.contentsPreview.map((item, i) => (
                      <span key={i} className="text-[10px] bg-[#161b22] text-[#c9d1d9] px-2 py-0.5 rounded-sm border border-[#30363d]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Pack Opening History */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3">
            <h3 className="text-xs font-semibold text-[#c9d1d9] mb-2">Recent Pack Openings</h3>
            <div className="space-y-1.5">
              {packHistory.map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-[#21262d] rounded-lg px-2.5 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#c9d1d9] truncate">{entry.itemName}</p>
                    <p className="text-[10px] text-[#8b949e]">{entry.date}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Coins className="h-3 w-3 text-[#f59e0b]" />
                    <span className="text-[11px] font-bold text-[#f59e0b]">{entry.price.toLocaleString()}</span>
                  </div>
                  {entry.refundable && (
                    <button className="text-[9px] font-medium text-[#8b949e] hover:text-[#ef4444] bg-[#161b22] px-1.5 py-0.5 rounded-sm ml-1.5 border border-[#30363d] transition-colors flex items-center gap-0.5">
                      <RotateCcw className="h-2.5 w-2.5" />
                      Refund
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============ 9. TRANSACTION HISTORY (always visible) ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
          <h2 className="text-xs font-semibold text-[#c9d1d9]">Transaction History</h2>
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded-sm">
            Last 10
          </span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {transactionHistory.map(txn => (
              <div
                key={txn.id}
                className="flex items-center justify-between px-3 py-2.5 border-b border-[#21262d] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-medium text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded-sm">
                      {txn.type}
                    </span>
                    <p className="text-[11px] font-medium text-[#c9d1d9] truncate">{txn.itemName}</p>
                  </div>
                  <p className="text-[10px] text-[#484f58]">{txn.date}</p>
                </div>

                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {txn.currency === 'coins' ? (
                      <Coins className="h-3 w-3 text-[#f59e0b]" />
                    ) : (
                      <Star className="h-3 w-3 text-[#3b82f6]" />
                    )}
                    <span className={`text-[11px] font-bold ${txn.currency === 'coins' ? 'text-[#f59e0b]' : 'text-[#3b82f6]'}`}>
                      {txn.price.toLocaleString()}
                    </span>
                  </div>
                  {txn.refundable && (
                    <button className="text-[9px] font-medium text-[#8b949e] hover:text-[#ef4444] bg-[#21262d] px-1.5 py-0.5 rounded-sm border border-[#30363d] transition-colors flex items-center gap-0.5">
                      <RotateCcw className="h-2.5 w-2.5" />
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
