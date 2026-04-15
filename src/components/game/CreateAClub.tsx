'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Palette, ArrowLeft, ArrowRight, Check, Star, RefreshCw,
  Shield, Building2, Users, Euro, Zap, Trophy, Target,
  ChevronLeft, ChevronRight, Flag, Eye, Shirt, Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Constants
// ============================================================
const STEPS = ['Identity', 'Badge', 'Kit', 'Stadium', 'Budget'] as const;
type WizardStep = typeof STEPS[number];

const CITIES = [
  { name: 'London', country: 'England', league: 'premier_league' },
  { name: 'Manchester', country: 'England', league: 'premier_league' },
  { name: 'Madrid', country: 'Spain', league: 'la_liga' },
  { name: 'Barcelona', country: 'Spain', league: 'la_liga' },
  { name: 'Milan', country: 'Italy', league: 'serie_a' },
  { name: 'Turin', country: 'Italy', league: 'serie_a' },
  { name: 'Munich', country: 'Germany', league: 'bundesliga' },
  { name: 'Dortmund', country: 'Germany', league: 'bundesliga' },
  { name: 'Paris', country: 'France', league: 'ligue_1' },
  { name: 'Lyon', country: 'France', league: 'ligue_1' },
] as const;

const LEAGUES = [
  { id: 'premier_league', name: 'Premier League', country: 'England' },
  { id: 'la_liga', name: 'La Liga', country: 'Spain' },
  { id: 'serie_a', name: 'Serie A', country: 'Italy' },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
  { id: 'ligue_1', name: 'Ligue 1', country: 'France' },
] as const;

interface ColorOption {
  label: string;
  value: string;
}

const PRIMARY_COLORS: ColorOption[] = [
  { label: 'Red', value: '#dc2626' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'White', value: '#f8fafc' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Gold', value: '#eab308' },
];

const SECONDARY_COLORS: ColorOption[] = [
  { label: 'Sky Blue', value: '#0ea5e9' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Crimson', value: '#991b1b' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Silver', value: '#94a3b8' },
];

const BADGE_SHAPES = ['shield', 'circle', 'diamond', 'hexagon', 'oval', 'square'] as const;
type BadgeShape = typeof BADGE_SHAPES[number];

const BADGE_ELEMENTS = [
  { id: 'stars', label: 'Stars', icon: '★' },
  { id: 'crown', label: 'Crown', icon: '♛' },
  { id: 'anchor', label: 'Anchor', icon: '⚓' },
  { id: 'eagle', label: 'Eagle', icon: '🦅' },
  { id: 'lion', label: 'Lion', icon: '🦁' },
  { id: 'tree', label: 'Tree', icon: '🌳' },
  { id: 'tower', label: 'Tower', icon: '🗼' },
  { id: 'cross', label: 'Cross', icon: '✚' },
  { id: 'stripes', label: 'Stripes', icon: '☰' },
  { id: 'chevron', label: 'Chevron', icon: '▶' },
  { id: 'ball', label: 'Ball', icon: '⚽' },
  { id: 'wings', label: 'Wings', icon: '🪽' },
] as const;

const KIT_COLORS: ColorOption[] = [
  { label: 'White', value: '#f8fafc' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Orange', value: '#ea580c' },
];

const KIT_STYLES = ['Classic', 'Modern', 'Retro'] as const;
type KitStyle = typeof KIT_STYLES[number];

const FONT_OPTIONS = ['Bold', 'Italic', 'Outline'] as const;
type FontOption = typeof FONT_OPTIONS[number];

interface KitZone {
  label: string;
  key: string;
}

const KIT_ZONES: KitZone[] = [
  { label: 'Shirt', key: 'shirt' },
  { label: 'Sleeves', key: 'sleeves' },
  { label: 'Shorts', key: 'shorts' },
  { label: 'Socks', key: 'socks' },
];

interface KitConfig {
  shirt: string;
  sleeves: string;
  shorts: string;
  socks: string;
}

const STADIUM_TYPES = [
  { id: 'modern_bowl', name: 'Modern Bowl', desc: 'Sleek contemporary design' },
  { id: 'traditional', name: 'Traditional Ground', desc: 'Classic English-style' },
  { id: 'arena', name: 'Arena', desc: 'Compact atmospheric venue' },
  { id: 'unique', name: 'Unique', desc: 'One-of-a-kind design' },
] as const;

interface StadiumFeature {
  id: string;
  label: string;
  icon: string;
  desc: string;
  capacityImpact: number;
  costImpact: number;
}

const STADIUM_FEATURES: StadiumFeature[] = [
  { id: 'roof', label: 'Roof', icon: '🏠', desc: 'Full or partial roof coverage', capacityImpact: 0, costImpact: 5000000 },
  { id: 'vip_boxes', label: 'VIP Boxes', icon: '👑', desc: 'Luxury corporate hospitality', capacityImpact: -2000, costImpact: 8000000 },
  { id: 'training_ground', label: 'Training Ground', icon: '🏟', desc: 'State-of-the-art facilities', capacityImpact: 0, costImpact: 10000000 },
  { id: 'academy', label: 'Academy', icon: '🎓', desc: 'Youth development center', capacityImpact: 0, costImpact: 6000000 },
  { id: 'parking', label: 'Parking', icon: '🅿', desc: 'Multi-level parking garage', capacityImpact: 0, costImpact: 2000000 },
];

const MANAGER_TYPES = [
  { id: 'attacking', name: 'Attacking', desc: 'High-tempo, goal-focused' },
  { id: 'defensive', name: 'Defensive', desc: 'Solid, organized, compact' },
  { id: 'balanced', name: 'Balanced', desc: 'Adaptable, well-rounded' },
  { id: 'tactical', name: 'Tactical', desc: 'Strategic, possession-based' },
] as const;

const LEAGUE_BUDGET_RANGE: Record<string, { min: number; max: number }> = {
  premier_league: { min: 20000000, max: 200000000 },
  la_liga: { min: 15000000, max: 180000000 },
  serie_a: { min: 12000000, max: 150000000 },
  bundesliga: { min: 10000000, max: 140000000 },
  ligue_1: { min: 8000000, max: 120000000 },
};

const LEAGUE_OBJECTIVES: Record<string, string[]> = {
  premier_league: ['Win the Premier League', 'Finish in Top 4', 'Avoid relegation'],
  la_liga: ['Win La Liga', 'Finish in Top 4', 'Avoid relegation'],
  serie_a: ['Win Serie A', 'Finish in Top 4', 'Avoid relegation'],
  bundesliga: ['Win the Bundesliga', 'Finish in Top 4', 'Avoid relegation'],
  ligue_1: ['Win Ligue 1', 'Finish in Top 4', 'Avoid relegation'],
};

const LEAGUE_RIVALS: Record<string, string[]> = {
  premier_league: ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United', 'Tottenham'],
  la_liga: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia'],
  serie_a: ['Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma'],
  bundesliga: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Leverkusen'],
  ligue_1: ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Lille'],
};

// ============================================================
// Interfaces
// ============================================================
interface ClubFormData {
  name: string;
  city: string;
  foundedYear: number;
  motto: string;
  stadiumName: string;
  primaryColor: string;
  secondaryColor: string;
  nickname: string;
  league: string;
  rival: string;
}

interface BadgeFormData {
  shape: BadgeShape;
  elements: string[];
  starCount: number;
}

interface KitFormData {
  home: KitConfig;
  away: KitConfig;
  third: KitConfig;
  style: KitStyle;
  font: FontOption;
}

interface StadiumFormData {
  type: string;
  baseCapacity: number;
  northStand: number;
  southStand: number;
  eastStand: number;
  westStand: number;
  features: string[];
}

interface BudgetFormData {
  budget: number;
  wageBudget: number;
  transferBudget: number;
  squadQuality: number;
  squadSize: number;
  managerType: string;
  objective: string;
  reputation: number;
}

// ============================================================
// Helpers
// ============================================================
function formatCurrency(value: number): string {
  if (value >= 1000000000) return `€${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `€${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

// ============================================================
// SVG Sub-components
// ============================================================
function BadgeShapeSVG({ shape, primaryColor, secondaryColor, width = 200, height = 200 }: {
  shape: BadgeShape;
  primaryColor: string;
  secondaryColor: string;
  width?: number;
  height?: number;
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  const shapePath = (() => {
    switch (shape) {
      case 'shield':
        return `M${halfW},10 L${width - 10},${halfH - 20} L${width - 10},${height - 40} Q${width - 10},${height - 10} ${halfW},${height - 10} Q10,${height - 10} 10,${height - 40} L10,${halfH - 20} Z`;
      case 'circle':
        return `M${halfW},10 A${halfW - 10},${halfH - 10} 0 1,1 ${halfW},${height - 10} A${halfW - 10},${halfH - 10} 0 1,1 ${halfW},10 Z`;
      case 'diamond':
        return `M${halfW},5 L${width - 5},${halfH} L${halfW},${height - 5} L5,${halfH} Z`;
      case 'hexagon':
        return `M${halfW},8 L${width - 15},${halfH - 25} L${width - 15},${halfH + 25} L${halfW},${height - 8} L15,${halfH + 25} L15,${halfH - 25} Z`;
      case 'oval':
        return `M${halfW},8 Q${width - 8},${halfH} ${halfW},${height - 8} Q8,${halfH} ${halfW},8 Z`;
      case 'square':
        return `M12,12 L${width - 12},12 L${width - 12},${height - 12} L12,${height - 12} Z`;
      default:
        return `M${halfW},10 L${width - 10},${halfH} L${halfW},${height - 10} L10,${halfH} Z`;
    }
  })();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <path d={shapePath} fill={primaryColor} stroke={secondaryColor} strokeWidth="3" />
      <path d={shapePath} fill="none" stroke={secondaryColor} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function BadgePreviewSVG({ shape, primaryColor, secondaryColor, elements, starCount }: {
  shape: BadgeShape;
  primaryColor: string;
  secondaryColor: string;
  elements: string[];
  starCount: number;
}) {
  return (
    <div className="relative inline-flex items-center justify-center w-[200px] h-[200px]">
      <BadgeShapeSVG shape={shape} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
        {elements.includes('stars') && (
          <div className="flex gap-0.5">
            {Array.from({ length: starCount }, (_, i) => (
              <span key={i} className="text-[14px]" style={{ color: secondaryColor }}>★</span>
            ))}
          </div>
        )}
        {elements.includes('crown') && (
          <span className="text-[24px]" style={{ color: secondaryColor }}>♛</span>
        )}
        {elements.includes('ball') && (
          <span className="text-[20px]" style={{ color: secondaryColor }}>⚽</span>
        )}
        {elements.includes('eagle') && (
          <span className="text-[18px]" style={{ color: secondaryColor }}>🦅</span>
        )}
        {elements.includes('lion') && (
          <span className="text-[18px]" style={{ color: secondaryColor }}>🦁</span>
        )}
        {elements.includes('anchor') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>⚓</span>
        )}
        {elements.includes('tree') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>🌳</span>
        )}
        {elements.includes('tower') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>🗼</span>
        )}
        {elements.includes('cross') && (
          <span className="text-[20px]" style={{ color: secondaryColor }}>✚</span>
        )}
        {elements.includes('stripes') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>☰</span>
        )}
        {elements.includes('chevron') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>▶</span>
        )}
        {elements.includes('wings') && (
          <span className="text-[16px]" style={{ color: secondaryColor }}>🪽</span>
        )}
      </div>
    </div>
  );
}

function KitPreviewSVG({ kit, style, font }: { kit: KitConfig; style: KitStyle; font: FontOption }) {
  const collarWidth = style === 'Retro' ? 6 : style === 'Modern' ? 3 : 4;
  const sleeveOpacity = style === 'Retro' ? 0.9 : 0.7;
  const textWeight = font === 'Bold' ? '900' : font === 'Italic' ? '700' : '400';

  return (
    <svg viewBox="0 0 100 130" width="90" height="117" xmlns="http://www.w3.org/2000/svg">
      {/* Shirt body */}
      <path
        d={style === 'Modern'
          ? 'M22,22 L8,38 L18,42 L18,108 L82,108 L82,42 L92,38 L78,22 L68,30 Q62,36 50,36 Q38,36 32,30 Z'
          : 'M25,18 L10,35 L20,40 L20,110 L80,110 L80,40 L90,35 L75,18 L65,26 Q60,32 50,32 Q40,32 35,26 Z'
        }
        fill={kit.shirt}
        stroke="#333"
        strokeWidth="1.2"
      />
      {/* Sleeves */}
      <path d="M20,35 L20,55 L32,55 L32,40 Z" fill={kit.sleeves} opacity={sleeveOpacity} />
      <path d="M80,35 L80,55 L68,55 L68,40 Z" fill={kit.sleeves} opacity={sleeveOpacity} />
      {/* Collar */}
      <path
        d={style === 'Retro'
          ? 'M35,18 L42,26 L50,22 L58,26 L65,18'
          : 'M35,18 Q42,26 50,26 Q58,26 65,18'
        }
        fill="none"
        stroke={kit.sleeves}
        strokeWidth={collarWidth}
        strokeLinecap="round"
      />
      {/* Shorts */}
      <path d="M28,108 L28,128 Q50,124 72,128 L72,108 Z" fill={kit.shorts} stroke="#333" strokeWidth="1" />
      {/* Socks */}
      <rect x="25" y="126" width="16" height="30" rx="2" fill={kit.socks} stroke="#333" strokeWidth="0.8" />
      <rect x="59" y="126" width="16" height="30" rx="2" fill={kit.socks} stroke="#333" strokeWidth="0.8" />
      {/* Number */}
      <text
        x="50" y="78"
        textAnchor="middle"
        fill="#fff"
        fontSize="26"
        fontWeight={textWeight}
        fontFamily="Arial, sans-serif"
        {...(font === 'Italic' ? { fontStyle: 'italic' } : {})}
        {...(font === 'Outline' ? { stroke: '#000', strokeWidth: 0.8, paintOrder: 'stroke' } : {})}
      >
        10
      </text>
    </svg>
  );
}

function StadiumPreviewSVG({ type, capacity, features }: {
  type: string;
  capacity: number;
  features: string[];
}) {
  const hasRoof = features.includes('roof');
  const hasVIP = features.includes('vip_boxes');
  const scaledCapacity = Math.min(capacity / 80000, 1);

  return (
    <svg viewBox="0 0 200 140" width="280" height="196" xmlns="http://www.w3.org/2000/svg">
      {/* Sky */}
      <rect x="0" y="0" width="200" height="60" fill="#0d1117" />
      {/* Field */}
      <rect x="30" y="55" width="140" height="70" rx="2" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
      {/* Field lines */}
      <line x1="100" y1="55" x2="100" y2="125" stroke="#15803d" strokeWidth="0.5" opacity="0.5" />
      <circle cx="100" cy="90" r="12" fill="none" stroke="#15803d" strokeWidth="0.5" opacity="0.5" />
      <rect x="30" y="78" width="20" height="24" fill="none" stroke="#15803d" strokeWidth="0.5" opacity="0.5" />
      <rect x="150" y="78" width="20" height="24" fill="none" stroke="#15803d" strokeWidth="0.5" opacity="0.5" />

      {type === 'modern_bowl' && (
        <>
          {/* Bowl stands */}
          <path d="M10,40 L10,60 L30,55 L30,35 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <path d="M170,40 L170,60 L190,55 L190,35 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <path d="M20,25 Q100,18 180,25 L170,40 L30,40 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <path d="M25,125 L30,125 L30,55 L170,55 L170,125 L175,125 Q100,132 25,125 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
        </>
      )}
      {type === 'traditional' && (
        <>
          {/* Distinct stands */}
          <rect x="10" y="10" width="180" height="25" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="10" y="125" width="180" height="15" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="0" y="35" width="30" height="90" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="170" y="35" width="30" height="90" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
        </>
      )}
      {type === 'arena' && (
        <>
          {/* Compact oval stands */}
          <ellipse cx="100" cy="35" rx="90" ry="18" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <ellipse cx="100" cy="125" rx="90" ry="18" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="0" y="35" width="30" height="90" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="170" y="35" width="30" height="90" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
        </>
      )}
      {type === 'unique' && (
        <>
          {/* Asymmetric stands */}
          <path d="M10,8 L10,60 L30,55 L30,20 Q50,12 70,18 L70,55 L30,55 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <path d="M130,55 L130,18 Q150,12 170,20 L170,55 L190,60 L190,8 L130,8 Z" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="25" y="125" width="60" height="15" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
          <rect x="115" y="125" width="60" height="15" rx="2" fill="#21262d" stroke="#30363d" strokeWidth="0.5" />
        </>
      )}

      {/* Roof overlay */}
      {hasRoof && (
        <path d="M15,30 Q100,22 185,30 L180,35 L20,35 Z" fill="#30363d" opacity="0.7" />
      )}

      {/* VIP boxes indicator */}
      {hasVIP && (
        <>
          <rect x="72" y="12" width="56" height="8" rx="1" fill="#f59e0b" opacity="0.8" />
          <text x="100" y="19" textAnchor="middle" fill="#0d1117" fontSize="5" fontWeight="bold">VIP</text>
        </>
      )}

      {/* Capacity label */}
      <text x="100" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" opacity="0.8">
        {formatNumber(capacity)}
      </text>
    </svg>
  );
}

function StarRating({ rating, max = 5, size = 'sm' }: { rating: number; max?: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function CreateAClub() {
  const setScreen = useGameStore(state => state.setScreen);

  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Step 1: Identity
  const [identity, setIdentity] = useState<ClubFormData>({
    name: '',
    city: CITIES[0].name,
    foundedYear: 2000,
    motto: '',
    stadiumName: '',
    primaryColor: '#dc2626',
    secondaryColor: '#f8fafc',
    nickname: '',
    league: 'premier_league',
    rival: '',
  });

  // Step 2: Badge
  const [badge, setBadge] = useState<BadgeFormData>({
    shape: 'shield',
    elements: ['ball'],
    starCount: 1,
  });

  // Step 3: Kit
  const [kit, setKit] = useState<KitFormData>({
    home: { shirt: '#dc2626', sleeves: '#ffffff', shorts: '#ffffff', socks: '#dc2626' },
    away: { shirt: '#f8fafc', sleeves: '#0f172a', shorts: '#0f172a', socks: '#f8fafc' },
    third: { shirt: '#f59e0b', sleeves: '#0f172a', shorts: '#0f172a', socks: '#f59e0b' },
    style: 'Classic',
    font: 'Bold',
  });

  // Step 4: Stadium
  const [stadium, setStadium] = useState<StadiumFormData>({
    type: 'modern_bowl',
    baseCapacity: 40000,
    northStand: 10000,
    southStand: 10000,
    eastStand: 10000,
    westStand: 10000,
    features: ['roof'],
  });

  // Step 5: Budget
  const [budget, setBudget] = useState<BudgetFormData>({
    budget: 50000000,
    wageBudget: 800000,
    transferBudget: 30000000,
    squadQuality: 3,
    squadSize: 25,
    managerType: 'balanced',
    objective: LEAGUE_OBJECTIVES.premier_league[1],
    reputation: 3,
  });

  const totalCapacity = stadium.northStand + stadium.southStand + stadium.eastStand + stadium.westStand;
  const selectedLeague = LEAGUES.find(l => l.id === identity.league);
  const leagueRivals = LEAGUE_RIVALS[identity.league] ?? [];
  const leagueObjectives = LEAGUE_OBJECTIVES[identity.league] ?? LEAGUE_OBJECTIVES.premier_league;
  const budgetRange = LEAGUE_BUDGET_RANGE[identity.league] ?? LEAGUE_BUDGET_RANGE.premier_league;

  const estimatedDifficulty = useMemo(() => {
    let score = 0;
    score += (5 - budget.squadQuality) * 2;
    score += budget.reputation <= 2 ? 2 : 0;
    score += budget.objective.includes('Win') ? 2 : budget.objective.includes('Top 4') ? 1 : 0;
    score += totalCapacity < 30000 ? 1 : 0;
    if (score <= 2) return { label: 'Easy', color: '#34d399' };
    if (score <= 4) return { label: 'Normal', color: '#f59e0b' };
    return { label: 'Hard', color: '#ef4444' };
  }, [budget, totalCapacity]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const goToStep = (step: number) => setCurrentStep(step);

  const toggleBadgeElement = (elementId: string) => {
    setBadge(prev => ({
      ...prev,
      elements: prev.elements.includes(elementId)
        ? prev.elements.filter(e => e !== elementId)
        : [...prev.elements, elementId],
    }));
  };

  const toggleStadiumFeature = (featureId: string) => {
    setStadium(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const updateKitZone = (kitKey: 'home' | 'away' | 'third', zoneKey: string, color: string) => {
    setKit(prev => ({
      ...prev,
      [kitKey]: { ...prev[kitKey], [zoneKey]: color },
    }));
  };

  const randomizeBadge = () => {
    const randShape = BADGE_SHAPES[Math.floor(Math.random() * BADGE_SHAPES.length)];
    const shuffledElements = [...BADGE_ELEMENTS].sort(() => Math.random() - 0.5);
    const randElements = shuffledElements
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(e => e.id);
    const randStars = Math.floor(Math.random() * 5) + 1;
    setBadge({ shape: randShape, elements: randElements, starCount: randStars });
    showToast('Badge randomized!');
  };

  const handleStartCareer = () => {
    showToast('Career created! Starting season...');
    setTimeout(() => setScreen('dashboard'), 1500);
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#8b949e]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-[#c9d1d9]">Create Your Club</h2>
          </div>
          <p className="text-xs text-[#8b949e]">Design every detail of your dream club</p>
        </div>
      </div>

      {/* ─── Step Indicator ─── */}
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <button
                key={step}
                onClick={() => goToStep(idx)}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#21262d] text-[#484f58] border border-[#30363d]'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-[9px] font-medium ${
                    isActive ? 'text-emerald-400' : isCompleted ? 'text-[#8b949e]' : 'text-[#484f58]'
                  }`}
                >
                  {step}
                </span>
              </button>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-[#21262d] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ─── Step Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ========== STEP 1: Club Identity ========== */}
          {currentStep === 0 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#c9d1d9]">Club Identity</h3>
                </div>

                {/* Club Name */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Club Name *</label>
                  <input
                    type="text"
                    value={identity.name}
                    onChange={e => setIdentity(p => ({ ...p, name: e.target.value }))}
                    placeholder="Enter club name..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                {/* City & Founded Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">City/Town</label>
                    <select
                      value={identity.city}
                      onChange={e => setIdentity(p => ({ ...p, city: e.target.value }))}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      {CITIES.map(c => (
                        <option key={c.name} value={c.name}>{c.name}, {c.country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Founded Year</label>
                    <input
                      type="number"
                      value={identity.foundedYear}
                      onChange={e => setIdentity(p => ({ ...p, foundedYear: Math.min(2025, Math.max(1880, parseInt(e.target.value) || 2000)) }))}
                      min={1880}
                      max={2025}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Motto */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Club Motto</label>
                  <input
                    type="text"
                    value={identity.motto}
                    onChange={e => setIdentity(p => ({ ...p, motto: e.target.value }))}
                    placeholder="Your club's motto..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                {/* Stadium Name */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Stadium Name</label>
                  <input
                    type="text"
                    value={identity.stadiumName}
                    onChange={e => setIdentity(p => ({ ...p, stadiumName: e.target.value }))}
                    placeholder="e.g. Fortress Arena..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Club Nickname</label>
                  <input
                    type="text"
                    value={identity.nickname}
                    onChange={e => setIdentity(p => ({ ...p, nickname: e.target.value }))}
                    placeholder="e.g. The Lions..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                {/* League */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">League</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEAGUES.map(league => (
                      <button
                        key={league.id}
                        onClick={() => {
                          setIdentity(p => ({
                            ...p,
                            league: league.id,
                            rival: '',
                            objective: LEAGUE_OBJECTIVES[league.id][1],
                          }));
                          setBudget(p => ({
                            ...p,
                            objective: LEAGUE_OBJECTIVES[league.id][1],
                          }));
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          identity.league === league.id
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{league.name}</div>
                        <div className="text-[10px] text-[#484f58]">{league.country}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rival Club */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Rival Club</label>
                  <select
                    value={identity.rival}
                    onChange={e => setIdentity(p => ({ ...p, rival: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="">Select a rival...</option>
                    {leagueRivals.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Club Colors */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-1.5 block">Club Colors</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] text-[#484f58] mb-1">Primary</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {PRIMARY_COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => setIdentity(p => ({ ...p, primaryColor: c.value }))}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              identity.primaryColor === c.value ? 'border-emerald-400 scale-105' : 'border-[#30363d]'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#484f58] mb-1">Secondary</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {SECONDARY_COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => setIdentity(p => ({ ...p, secondaryColor: c.value }))}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              identity.secondaryColor === c.value ? 'border-emerald-400 scale-105' : 'border-[#30363d]'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg">
                  <div
                    className="w-10 h-10 rounded-lg border border-[#30363d]"
                    style={{ backgroundColor: identity.primaryColor }}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#c9d1d9]">
                      {identity.name || 'Your Club'}
                    </div>
                    <div className="text-[10px] text-[#8b949e]">
                      {identity.city} &middot; {selectedLeague?.name ?? 'Premier League'}
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-md border border-[#30363d]"
                    style={{ backgroundColor: identity.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== STEP 2: Club Badge ========== */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-[#c9d1d9]">Club Badge</h3>
                  </div>
                  <button
                    onClick={randomizeBadge}
                    className="flex items-center gap-1.5 text-[10px] text-[#8b949e] hover:text-emerald-400 transition-colors px-2 py-1 rounded-md bg-[#21262d] border border-[#30363d]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Randomize
                  </button>
                </div>

                {/* Badge Shape Selector */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Badge Shape</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGE_SHAPES.map(shape => (
                      <button
                        key={shape}
                        onClick={() => setBadge(p => ({ ...p, shape }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          badge.shape === shape
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : 'bg-[#21262d] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <BadgeShapeSVG
                            shape={shape}
                            primaryColor={badge.shape === shape ? identity.primaryColor : '#21262d'}
                            secondaryColor={badge.shape === shape ? identity.secondaryColor : '#30363d'}
                            width={40}
                            height={40}
                          />
                        </div>
                        <span className="text-[9px] text-[#8b949e] capitalize">{shape}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Star Count (when stars element selected) */}
                {badge.elements.includes('stars') && (
                  <div>
                    <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Number of Stars</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setBadge(p => ({ ...p, starCount: n }))}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                            badge.starCount === n
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-[#21262d] border-[#30363d] text-[#484f58] hover:border-amber-500/20'
                          }`}
                        >
                          <span className="text-sm font-bold">{'★'.repeat(n)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badge Elements */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Badge Elements</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BADGE_ELEMENTS.map(element => {
                      const isSelected = badge.elements.includes(element.id);
                      return (
                        <button
                          key={element.id}
                          onClick={() => toggleBadgeElement(element.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                          }`}
                        >
                          <span className="text-sm">{element.icon}</span>
                          <span className="text-[9px] font-medium">{element.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="flex justify-center p-4 bg-[#0d1117] rounded-lg border border-[#21262d]">
                  <BadgePreviewSVG
                    shape={badge.shape}
                    primaryColor={identity.primaryColor}
                    secondaryColor={identity.secondaryColor}
                    elements={badge.elements}
                    starCount={badge.starCount}
                  />
                </div>

                {identity.name && (
                  <div className="text-center text-xs font-bold text-[#c9d1d9]" style={{ color: identity.secondaryColor }}>
                    {identity.name.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== STEP 3: Kit Design ========== */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Design</h3>
                </div>

                {/* Kit Style */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Kit Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {KIT_STYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => setKit(p => ({ ...p, style }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          kit.style === style
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{style}</div>
                        <div className="text-[9px] text-[#484f58] mt-0.5">
                          {style === 'Classic' ? 'Clean & timeless' : style === 'Modern' ? 'Sleek & bold' : 'Vintage feel'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Selection */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Number Font</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_OPTIONS.map(font => (
                      <button
                        key={font}
                        onClick={() => setKit(p => ({ ...p, font }))}
                        className={`p-2.5 rounded-lg border text-center transition-colors ${
                          kit.font === font
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                        }`}
                      >
                        <span
                          className="text-lg"
                          style={{
                            fontWeight: font === 'Bold' ? 900 : font === 'Italic' ? 700 : 400,
                            fontStyle: font === 'Italic' ? 'italic' : 'normal',
                            WebkitTextStroke: font === 'Outline' ? '0.5px #fff' : undefined,
                          }}
                        >
                          10
                        </span>
                        <div className="text-[9px] mt-0.5">{font}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kit Color Pickers - Home, Away, Third */}
                {(['home', 'away', 'third'] as const).map(kitKey => (
                  <div key={kitKey} className="border border-[#21262d] rounded-lg p-3 space-y-3">
                    <div className="text-xs font-bold text-[#c9d1d9] capitalize">{kitKey} Kit</div>
                    {KIT_ZONES.map(zone => (
                      <div key={zone.key}>
                        <div className="text-[10px] text-[#8b949e] mb-1.5">{zone.label}</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {KIT_COLORS.map(color => (
                            <button
                              key={color.value}
                              onClick={() => updateKitZone(kitKey, zone.key, color.value)}
                              className={`w-7 h-7 rounded-md border-2 transition-all ${
                                kit[kitKey][zone.key as keyof KitConfig] === color.value
                                  ? 'border-emerald-400'
                                  : 'border-[#30363d]'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Kit Preview */}
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#c9d1d9]">Kit Preview</h3>
                </div>
                <div className="flex justify-around items-end">
                  <div className="text-center">
                    <div className="flex justify-center">
                      <KitPreviewSVG kit={kit.home} style={kit.style} font={kit.font} />
                    </div>
                    <div className="text-[10px] font-bold text-[#8b949e] mt-1">HOME</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center">
                      <KitPreviewSVG kit={kit.away} style={kit.style} font={kit.font} />
                    </div>
                    <div className="text-[10px] font-bold text-[#8b949e] mt-1">AWAY</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center">
                      <KitPreviewSVG kit={kit.third} style={kit.style} font={kit.font} />
                    </div>
                    <div className="text-[10px] font-bold text-[#8b949e] mt-1">THIRD</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== STEP 4: Stadium ========== */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#c9d1d9]">Stadium</h3>
                </div>

                {/* Stadium Type */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Stadium Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STADIUM_TYPES.map(st => (
                      <button
                        key={st.id}
                        onClick={() => setStadium(p => ({ ...p, type: st.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          stadium.type === st.id
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{st.name}</div>
                        <div className="text-[9px] text-[#484f58]">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Capacity Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] text-[#8b949e] font-medium">Base Capacity</label>
                    <span className="text-xs font-mono text-emerald-400">{formatNumber(stadium.baseCapacity)}</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={80000}
                    step={1000}
                    value={stadium.baseCapacity}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      const quarter = Math.floor(val / 4);
                      setStadium(p => ({
                        ...p,
                        baseCapacity: val,
                        northStand: quarter,
                        southStand: quarter,
                        eastStand: quarter,
                        westStand: val - quarter * 3,
                      }));
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#484f58]">
                    <span>5,000</span>
                    <span>80,000</span>
                  </div>
                </div>

                {/* Individual Stand Sliders */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Stand Configuration</label>
                  <div className="space-y-2">
                    {([
                      { key: 'northStand', label: 'North Stand' },
                      { key: 'southStand', label: 'South Stand' },
                      { key: 'eastStand', label: 'East Stand' },
                      { key: 'westStand', label: 'West Stand' },
                    ] as const).map(stand => (
                      <div key={stand.key} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8b949e] w-20 shrink-0">{stand.label}</span>
                        <input
                          type="range"
                          min={1000}
                          max={40000}
                          step={500}
                          value={stadium[stand.key]}
                          onChange={e => setStadium(p => ({ ...p, [stand.key]: parseInt(e.target.value) }))}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="text-[10px] font-mono text-[#c9d1d9] w-14 text-right">
                          {formatNumber(stadium[stand.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-[#21262d] rounded-md text-center">
                    <span className="text-[10px] text-[#8b949e]">Total: </span>
                    <span className="text-xs font-bold text-emerald-400">{formatNumber(totalCapacity)}</span>
                  </div>
                </div>

                {/* Stadium Features */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Stadium Features</label>
                  <div className="space-y-1.5">
                    {STADIUM_FEATURES.map(feature => {
                      const isActive = stadium.features.includes(feature.id);
                      return (
                        <button
                          key={feature.id}
                          onClick={() => toggleStadiumFeature(feature.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
                            isActive
                              ? 'bg-emerald-500/15 border-emerald-500/30'
                              : 'bg-[#21262d] border-[#30363d] hover:border-emerald-500/20'
                          }`}
                        >
                          <span className="text-base">{feature.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                              {feature.label}
                            </div>
                            <div className="text-[9px] text-[#484f58]">{feature.desc}</div>
                          </div>
                          <div className="text-right shrink-0">
                            {feature.costImpact > 0 && (
                              <div className="text-[9px] text-amber-400 font-mono">{formatCurrency(feature.costImpact)}</div>
                            )}
                            {isActive && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-[9px] text-emerald-400">Active</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stadium Preview */}
                <div className="flex justify-center p-3 bg-[#0d1117] rounded-lg border border-[#21262d]">
                  <StadiumPreviewSVG
                    type={stadium.type}
                    capacity={totalCapacity}
                    features={stadium.features}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== STEP 5: Budget & Squad ========== */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#c9d1d9]">Budget & Squad</h3>
                </div>

                {/* Starting Budget */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] text-[#8b949e] font-medium">Starting Budget</label>
                    <span className="text-xs font-mono text-emerald-400">{formatCurrency(budget.budget)}</span>
                  </div>
                  <input
                    type="range"
                    min={budgetRange.min}
                    max={budgetRange.max}
                    step={1000000}
                    value={budget.budget}
                    onChange={e => setBudget(p => ({ ...p, budget: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#484f58]">
                    <span>{formatCurrency(budgetRange.min)}</span>
                    <span>{formatCurrency(budgetRange.max)}</span>
                  </div>
                </div>

                {/* Wage Budget */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] text-[#8b949e] font-medium">Weekly Wage Budget</label>
                    <span className="text-xs font-mono text-amber-400">{formatCurrency(budget.wageBudget)}/wk</span>
                  </div>
                  <input
                    type="range"
                    min={200000}
                    max={3000000}
                    step={50000}
                    value={budget.wageBudget}
                    onChange={e => setBudget(p => ({ ...p, wageBudget: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Transfer Budget */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] text-[#8b949e] font-medium">Transfer Budget</label>
                    <span className="text-xs font-mono text-emerald-400">{formatCurrency(budget.transferBudget)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={budget.budget}
                    step={1000000}
                    value={budget.transferBudget}
                    onChange={e => setBudget(p => ({ ...p, transferBudget: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Squad Quality */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Starting Squad Quality</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setBudget(p => ({ ...p, squadQuality: n }))}
                        className={`flex-1 p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                          budget.squadQuality === n
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : 'bg-[#21262d] border-[#30363d] hover:border-emerald-500/20'
                        }`}
                      >
                        <StarRating rating={n} max={5} />
                        <span className="text-[9px] text-[#8b949e]">
                          {n === 1 ? 'Amateur' : n === 2 ? 'Semi-Pro' : n === 3 ? 'Pro' : n === 4 ? 'Good' : 'Elite'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Squad Size */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] text-[#8b949e] font-medium">Squad Size</label>
                    <span className="text-xs font-mono text-[#c9d1d9]">{budget.squadSize} players</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={30}
                    step={1}
                    value={budget.squadSize}
                    onChange={e => setBudget(p => ({ ...p, squadSize: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[9px] text-[#484f58]">
                    <span>18</span>
                    <span>30</span>
                  </div>
                </div>

                {/* Manager Type */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Manager Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MANAGER_TYPES.map(mt => (
                      <button
                        key={mt.id}
                        onClick={() => setBudget(p => ({ ...p, managerType: mt.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          budget.managerType === mt.id
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{mt.name}</div>
                        <div className="text-[9px] text-[#484f58]">{mt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Season Objective */}
                <div>
                  <label className="text-[10px] text-[#8b949e] font-medium mb-2 block">Season Objective</label>
                  <div className="space-y-1.5">
                    {leagueObjectives.map((obj, idx) => {
                      const isTop = idx === 0;
                      return (
                        <button
                          key={obj}
                          onClick={() => setBudget(p => ({ ...p, objective: obj }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                            budget.objective === obj
                              ? 'bg-emerald-500/15 border-emerald-500/30'
                              : 'bg-[#21262d] border-[#30363d] hover:border-emerald-500/20'
                          }`}
                        >
                          <Target className={`h-4 w-4 shrink-0 ${isTop ? 'text-amber-400' : 'text-[#8b949e]'}`} />
                          <span className={`text-xs font-bold ${
                            budget.objective === obj ? 'text-emerald-400' : 'text-[#c9d1d9]'
                          }`}>
                            {obj}
                          </span>
                          <div className="ml-auto">
                            {isTop && <Badge className="text-[8px] bg-amber-500/15 text-amber-400 border-0">Hard</Badge>}
                            {idx === 1 && <Badge className="text-[8px] bg-blue-500/15 text-blue-400 border-0">Medium</Badge>}
                            {idx === 2 && <Badge className="text-[8px] bg-emerald-500/15 text-emerald-400 border-0">Easy</Badge>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Club Reputation Preview */}
                <div className="p-3 bg-[#21262d] rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#8b949e]">Club Reputation</div>
                      <StarRating rating={budget.reputation} max={5} size="md" />
                    </div>
                    <button
                      onClick={() => setBudget(p => ({ ...p, reputation: (p.reputation % 5) + 1 }))}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-md bg-emerald-500/10"
                    >
                      Cycle (1-5)
                    </button>
                  </div>
                </div>

                {/* Estimated Difficulty */}
                <div className="p-3 bg-[#21262d] rounded-lg border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-[#8b949e]">Estimated Difficulty</div>
                    <div
                      className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ color: estimatedDifficulty.color, backgroundColor: estimatedDifficulty.color + '15' }}
                    >
                      {estimatedDifficulty.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Summary (Step 5 footer) ─── */}
      {currentStep === STEPS.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-3"
        >
          {/* Club Summary Card */}
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            {/* Summary Header */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: identity.primaryColor }}
            >
              <div className="w-14 h-14 bg-black/20 rounded-lg flex items-center justify-center">
                <BadgeShapeSVG
                  shape={badge.shape}
                  primaryColor={identity.primaryColor}
                  secondaryColor={identity.secondaryColor}
                  width={56}
                  height={56}
                />
              </div>
              <div className="flex-1">
                <div className="text-base font-black text-white drop-shadow">
                  {identity.name || 'Untitled Club'}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>{identity.city}</span>
                  <span>&middot;</span>
                  <span>{selectedLeague?.name}</span>
                  <span>&middot;</span>
                  <span>Est. {identity.foundedYear}</span>
                </div>
              </div>
            </div>

            {/* Summary Details Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {/* Badge */}
              <button
                onClick={() => goToStep(1)}
                className="bg-[#21262d] rounded-lg p-3 text-left hover:border-emerald-500/30 border border-transparent transition-colors"
              >
                <div className="text-[9px] text-[#484f58] mb-1">Badge</div>
                <div className="flex items-center gap-2">
                  <BadgeShapeSVG shape={badge.shape} primaryColor={identity.primaryColor} secondaryColor={identity.secondaryColor} width={24} height={24} />
                  <span className="text-[10px] text-[#8b949e] capitalize">{badge.shape}</span>
                </div>
              </button>

              {/* Kit */}
              <button
                onClick={() => goToStep(2)}
                className="bg-[#21262d] rounded-lg p-3 text-left hover:border-emerald-500/30 border border-transparent transition-colors"
              >
                <div className="text-[9px] text-[#484f58] mb-1">Kit</div>
                <div className="flex gap-1">
                  {[kit.home.shirt, kit.away.shirt, kit.third.shirt].map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-sm border border-[#30363d]" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>

              {/* Stadium */}
              <button
                onClick={() => goToStep(3)}
                className="bg-[#21262d] rounded-lg p-3 text-left hover:border-emerald-500/30 border border-transparent transition-colors"
              >
                <div className="text-[9px] text-[#484f58] mb-1">Stadium</div>
                <div className="text-xs font-bold text-[#c9d1d9]">{formatNumber(totalCapacity)}</div>
                <div className="text-[9px] text-[#484f58]">{identity.stadiumName || 'Stadium'}</div>
              </button>

              {/* Budget */}
              <div className="bg-[#21262d] rounded-lg p-3">
                <div className="text-[9px] text-[#484f58] mb-1">Budget</div>
                <div className="text-xs font-bold text-emerald-400">{formatCurrency(budget.budget)}</div>
                <div className="text-[9px] text-[#484f58]">{budget.squadSize} players</div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Squad Quality</span>
                <StarRating rating={budget.squadQuality} max={5} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Objective</span>
                <span className="text-[#c9d1d9] font-bold">{budget.objective}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Manager</span>
                <span className="text-[#c9d1d9] capitalize">{budget.managerType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Difficulty</span>
                <span
                  className="font-bold text-[10px] px-2 py-0.5 rounded-md"
                  style={{ color: estimatedDifficulty.color, backgroundColor: estimatedDifficulty.color + '15' }}
                >
                  {estimatedDifficulty.label}
                </span>
              </div>
              {identity.rival && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Rival</span>
                  <span className="text-red-400 font-bold">{identity.rival}</span>
                </div>
              )}
              {identity.nickname && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Nickname</span>
                  <span className="text-[#c9d1d9]">"{identity.nickname}"</span>
                </div>
              )}
              {identity.motto && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8b949e]">Motto</span>
                  <span className="text-[#c9d1d9] text-right text-[10px] italic max-w-[180px] truncate">{identity.motto}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Step Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                onClick={() => goToStep(idx)}
                className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-center hover:border-emerald-500/30 transition-colors"
              >
                <span className="text-[9px] text-[#8b949e]">Edit</span>
                <div className="text-[8px] text-[#484f58]">{step}</div>
              </button>
            ))}
          </div>

          {/* Start Career Button */}
          <Button
            onClick={handleStartCareer}
            disabled={!identity.name.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-lg transition-colors text-sm"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Start Career{identity.name ? ` — ${identity.name}` : ''}
          </Button>

          {!identity.name.trim() && (
            <div className="text-center text-[10px] text-amber-400">
              Please enter a club name to start your career
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Navigation Buttons (steps 0-3) ─── */}
      {currentStep < STEPS.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex gap-3"
        >
          <Button
            onClick={goBack}
            disabled={currentStep === 0}
            variant="outline"
            className="flex-1 bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#8b949e] py-3 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={goNext}
            className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {currentStep === STEPS.length - 2 ? 'Review & Confirm' : 'Continue'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-emerald-400">{toast}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
