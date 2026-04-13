'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Club } from '@/lib/game/types';
import { ENRICHED_CLUBS, LEAGUES, getLeagueById } from '@/lib/game/clubsData';
import { formatCurrency, calculateMarketValue, calculateWage, randomBetween, randomFloatBetween } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Handshake, ArrowLeft, CheckCircle, XCircle, TrendingUp, TrendingDown,
  DollarSign, Clock, AlertTriangle, PartyPopper, Ban, ChevronRight,
  MessageSquare, Shield, ArrowRightLeft, Users, History, Star,
  Flame, ThumbsDown, ThumbsUp, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Types
// ============================================================

type NegotiationPhase = 'offers_list' | 'offer_detail' | 'negotiating' | 'counter_response' | 'result';
type OutcomeType = 'accepted' | 'rejected_club' | 'rejected_player' | 'failed';

interface TransferOfferData {
  id: string;
  fromClub: Club;
  transferFee: number;
  weeklyWage: number;
  contractLength: number;
  signingBonus: number;
  releaseClause: number | undefined;
  squadRole: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface NegotiationState {
  offer: TransferOfferData;
  round: number;
  maxRounds: number;
  patience: number;
  currentWage: number;
  currentContractLength: number;
  currentSigningBonus: number;
  currentReleaseClause: number | undefined;
}

interface NegotiationResult {
  offer: TransferOfferData;
  outcome: OutcomeType;
  rounds: number;
  finalWage: number;
  finalContractLength: number;
  finalSigningBonus: number;
  finalReleaseClause: number | undefined;
  moraleImpact: number;
  reputationImpact: number;
}

interface NegotiationRoundEntry {
  round: number;
  party: 'club' | 'agent';
  wage: number;
  contractLength: number;
  signingBonus: number;
  releaseClause: number | undefined;
  transferFee: number;
  accepted: boolean | null;
}

// ============================================================
// Seeded pseudo-random based on player stats + week
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ============================================================
// Generate NPC transfer offers
// ============================================================
function generateTransferOffers(
  playerOverall: number,
  playerAge: number,
  playerPosition: string,
  playerPotential: number,
  playerReputation: number,
  currentClubId: string,
  week: number,
  season: number
): TransferOfferData[] {
  const rng = seededRandom(playerOverall * 1000 + week * 100 + season * 7 + playerAge * 13);
  const offerCount = 2 + Math.floor(rng() * 2); // 2-3 offers

  // Filter clubs that are not the current club
  const eligibleClubs = ENRICHED_CLUBS.filter(c => c.id !== currentClubId);

  // Weight clubs by reputation proximity (slightly higher or equal rep clubs more likely)
  const weighted = eligibleClubs.map(club => {
    const repDiff = Math.abs(club.reputation - playerReputation);
    const weight = Math.max(1, 100 - repDiff);
    return { club, weight };
  });

  // Sort by weight descending and take top offers
  weighted.sort((a, b) => b.weight - a.weight);

  const offers: TransferOfferData[] = [];
  const usedClubIds = new Set<string>();

  for (let i = 0; i < offerCount && i < weighted.length; i++) {
    const club = weighted[i].club;
    if (usedClubIds.has(club.id)) continue;
    usedClubIds.add(club.id);

    // Calculate transfer fee (1.5-3x market value)
    const marketValue = calculateMarketValue(playerOverall, playerAge, playerPotential, playerReputation);
    const feeMultiplier = 1.5 + rng() * 1.5;
    const transferFee = Math.round(marketValue * feeMultiplier * 100) / 100;

    // Calculate wage offer based on club finances and tier
    const baseWage = calculateWage(playerOverall, club.tier, playerReputation);
    const wageFactor = 0.9 + rng() * 0.4; // 90-130% of fair wage
    const weeklyWage = Math.round(baseWage * wageFactor * 10) / 10;

    // Contract length based on age
    const contractLength = playerAge <= 23 ? randomBetween(3, 5) : randomBetween(2, 4);

    // Signing bonus: 2-10 weeks of wages
    const signingBonusWeeks = 2 + rng() * 8;
    const signingBonus = Math.round(weeklyWage * signingBonusWeeks * 10) / 10;

    // Release clause: 2-5x fee
    const hasReleaseClause = rng() < 0.5;
    const releaseClause = hasReleaseClause
      ? Math.round(transferFee * (2 + rng() * 3) * 100) / 100
      : undefined;

    // Squad role: depends on player overall vs club quality
    const qualityDiff = club.squadQuality - playerOverall;
    let squadRole = 'starter';
    if (qualityDiff > 10) squadRole = 'rotation';
    if (qualityDiff > 20) squadRole = 'bench';

    // Negotiation difficulty: easier for top players at lower rep clubs
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (playerOverall >= 80 && club.reputation < 80) difficulty = 'easy';
    if (club.finances >= 85 && playerOverall < 75) difficulty = 'hard';

    offers.push({
      id: `tn-${club.id}-${week}-${i}`,
      fromClub: club,
      transferFee,
      weeklyWage,
      contractLength,
      signingBonus,
      releaseClause,
      squadRole,
      difficulty,
    });
  }

  return offers;
}

// ============================================================
// Get club reaction to counter-offer
// ============================================================
function getClubReaction(
  negotiation: NegotiationState,
  counterWage: number,
  counterContractLength: number,
  counterSigningBonus: number,
  counterReleaseClause: number | undefined,
  playerOverall: number,
  agentQuality: number
): { accepted: boolean; newWage: number; newContractLength: number; newSigningBonus: number; newReleaseClause: number | undefined; patienceLoss: number } {
  const { offer, round, patience, currentWage, currentContractLength, currentSigningBonus } = negotiation;
  const wageDiff = counterWage - currentWage;
  const wageDiffPct = currentWage > 0 ? wageDiff / currentWage : 0;

  // Agent helps negotiate (higher quality = better deals)
  const agentBonus = agentQuality / 200; // 0-0.5

  // Player quality makes clubs more willing
  const playerBonus = playerOverall / 200; // 0-0.5

  // Difficulty modifier
  const difficultyMod = offer.difficulty === 'easy' ? 0.15 : offer.difficulty === 'hard' ? -0.15 : 0;

  // Will the club accept this counter?
  // More likely if demand is close to offer and player is valuable
  const acceptanceThreshold = 0.35 - agentBonus - playerBonus - difficultyMod + (round * 0.05);
  const demandReasonableness = wageDiffPct <= 0.15 ? 0.8 : wageDiffPct <= 0.3 ? 0.5 : wageDiffPct <= 0.5 ? 0.2 : 0.05;

  if (demandReasonableness >= (1 - acceptanceThreshold) && patience > 20) {
    return {
      accepted: true,
      newWage: counterWage,
      newContractLength: counterContractLength,
      newSigningBonus: counterSigningBonus,
      newReleaseClause: counterReleaseClause,
      patienceLoss: 5,
    };
  }

  // Club counter-compromises
  const meetPoint = 0.3 + agentBonus + playerBonus + difficultyMod;
  const compromiseWage = Math.round((currentWage + wageDiff * Math.min(0.8, meetPoint)) * 10) / 10;
  const compromiseLength = Math.round((currentContractLength + counterContractLength) / 2);
  const bonusRatio = currentSigningBonus / (currentWage || 1);
  const compromiseBonus = Math.round(compromiseWage * bonusRatio * 10) / 10;

  const patLoss = Math.round(10 + wageDiffPct * 15);

  return {
    accepted: false,
    newWage: compromiseWage,
    newContractLength: compromiseLength,
    newSigningBonus: compromiseBonus,
    newReleaseClause: counterReleaseClause,
    patienceLoss: patLoss,
  };
}

// ============================================================
// Format league name
// ============================================================
function formatLeagueName(leagueId: string): string {
  return getLeagueById(leagueId)?.name ?? leagueId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================
// Get role color
// ============================================================
function getRoleColor(role: string): string {
  switch (role) {
    case 'starter': return 'text-emerald-400';
    case 'rotation': return 'text-amber-400';
    case 'bench': return 'text-red-400';
    default: return 'text-[#8b949e]';
  }
}

function getRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================
// Main Component
// ============================================================
export default function TransferNegotiation() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const [phase, setPhase] = useState<NegotiationPhase>('offers_list');
  const [selectedOffer, setSelectedOffer] = useState<TransferOfferData | null>(null);
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [counterWage, setCounterWage] = useState(0);
  const [counterContractLength, setCounterContractLength] = useState(0);
  const [counterSigningBonus, setCounterSigningBonus] = useState(0);
  const [counterReleaseClause, setCounterReleaseClause] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [history, setHistory] = useState<NegotiationResult[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [clubMessage, setClubMessage] = useState('');
  const [negotiationRounds, setNegotiationRounds] = useState<NegotiationRoundEntry[]>([]);

  const player = gameState?.player;
  const currentClub = gameState?.currentClub;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;

  // Generate offers derived from player data (no setState needed)
  const offers = useMemo(() => {
    if (!player || !currentClub) return [];
    return generateTransferOffers(
      player.overall, player.age, player.position, player.potential,
      player.reputation, currentClub.id, currentWeek, currentSeason
    );
  }, [player, currentClub, currentWeek, currentSeason]);

  // Start negotiation with a selected offer
  const startNegotiation = useCallback((offer: TransferOfferData) => {
    setSelectedOffer(offer);
    setNegotiation({
      offer,
      round: 1,
      maxRounds: offer.difficulty === 'easy' ? 5 : offer.difficulty === 'hard' ? 3 : 4,
      patience: 100,
      currentWage: offer.weeklyWage,
      currentContractLength: offer.contractLength,
      currentSigningBonus: offer.signingBonus,
      currentReleaseClause: offer.releaseClause,
    });
    setCounterWage(offer.weeklyWage);
    setCounterContractLength(offer.contractLength);
    setCounterSigningBonus(offer.signingBonus);
    setCounterReleaseClause(offer.releaseClause);
    setResult(null);
    setClubMessage('');
    setNegotiationRounds([{
      round: 1,
      party: 'club',
      wage: offer.weeklyWage,
      contractLength: offer.contractLength,
      signingBonus: offer.signingBonus,
      releaseClause: offer.releaseClause,
      transferFee: offer.transferFee,
      accepted: null,
    }]);
    setPhase('negotiating');
  }, []);

  // Accept the current club offer
  const acceptOffer = useCallback(() => {
    if (!negotiation || !selectedOffer) return;
    setIsAnimating(true);
    setTimeout(() => {
      const res: NegotiationResult = {
        offer: selectedOffer,
        outcome: 'accepted',
        rounds: negotiation.round,
        finalWage: negotiation.currentWage,
        finalContractLength: negotiation.currentContractLength,
        finalSigningBonus: negotiation.currentSigningBonus,
        finalReleaseClause: negotiation.currentReleaseClause,
        moraleImpact: 10,
        reputationImpact: 3,
      };
      setResult(res);
      setHistory(prev => [res, ...prev]);
      setPhase('result');
      setIsAnimating(false);
    }, 600);
  }, [negotiation, selectedOffer]);

  // Reject the offer
  const rejectOffer = useCallback(() => {
    if (!selectedOffer) return;
    setIsAnimating(true);
    setTimeout(() => {
      const res: NegotiationResult = {
        offer: selectedOffer,
        outcome: 'rejected_player',
        rounds: negotiation?.round ?? 0,
        finalWage: negotiation?.currentWage ?? 0,
        finalContractLength: negotiation?.currentContractLength ?? 0,
        finalSigningBonus: negotiation?.currentSigningBonus ?? 0,
        finalReleaseClause: negotiation?.currentReleaseClause,
        moraleImpact: -5,
        reputationImpact: -2,
      };
      setResult(res);
      setHistory(prev => [res, ...prev]);
      setPhase('result');
      setIsAnimating(false);
    }, 400);
  }, [selectedOffer, negotiation]);

  // Submit counter-offer
  const submitCounterOffer = useCallback(() => {
    if (!negotiation || !player) return;
    setIsAnimating(true);
    setPhase('counter_response');
    setNegotiationRounds(prev => [...prev, {
      round: negotiation.round,
      party: 'agent' as const,
      wage: counterWage,
      contractLength: counterContractLength,
      signingBonus: counterSigningBonus,
      releaseClause: counterReleaseClause,
      transferFee: selectedOffer!.transferFee,
      accepted: null,
    }]);

    setTimeout(() => {
      const reaction = getClubReaction(
        negotiation,
        counterWage,
        counterContractLength,
        counterSigningBonus,
        counterReleaseClause,
        player.overall,
        player.agentQuality
      );

      const newPatience = Math.max(0, negotiation.patience - reaction.patienceLoss);

      // Generate club message
      if (reaction.accepted) {
        setClubMessage('The club has accepted your terms! They are eager to finalize the deal.');
      } else if (newPatience <= 0) {
        setClubMessage('The club has lost patience. They are walking away from the negotiation.');
      } else if (reaction.patienceLoss > 20) {
        setClubMessage('The club is visibly frustrated but willing to make one more compromise.');
      } else {
        setClubMessage('The club has considered your counter-offer and made a revised proposal.');
      }

      const updatedNegotiation: NegotiationState = {
        ...negotiation,
        currentWage: reaction.newWage,
        currentContractLength: reaction.newContractLength,
        currentSigningBonus: reaction.newSigningBonus,
        currentReleaseClause: reaction.newReleaseClause,
        patience: newPatience,
      };

      setNegotiation(updatedNegotiation);
      setNegotiationRounds(prev => [...prev, {
        round: negotiation.round,
        party: 'club' as const,
        wage: reaction.newWage,
        contractLength: reaction.newContractLength,
        signingBonus: reaction.newSigningBonus,
        releaseClause: reaction.newReleaseClause,
        transferFee: selectedOffer!.transferFee,
        accepted: reaction.accepted,
      }]);
      setCounterWage(reaction.newWage);
      setCounterContractLength(reaction.newContractLength);
      setCounterSigningBonus(reaction.newSigningBonus);
      setCounterReleaseClause(reaction.newReleaseClause);

      setTimeout(() => {
        if (reaction.accepted) {
          const res: NegotiationResult = {
            offer: selectedOffer!,
            outcome: 'accepted',
            rounds: negotiation.round,
            finalWage: reaction.newWage,
            finalContractLength: reaction.newContractLength,
            finalSigningBonus: reaction.newSigningBonus,
            finalReleaseClause: reaction.newReleaseClause,
            moraleImpact: 15,
            reputationImpact: 5,
          };
          setResult(res);
          setHistory(prev => [res, ...prev]);
          setPhase('result');
        } else if (newPatience <= 0 || negotiation.round >= negotiation.maxRounds) {
          const res: NegotiationResult = {
            offer: selectedOffer!,
            outcome: newPatience <= 0 ? 'rejected_club' : 'failed',
            rounds: negotiation.round,
            finalWage: reaction.newWage,
            finalContractLength: reaction.newContractLength,
            finalSigningBonus: reaction.newSigningBonus,
            finalReleaseClause: reaction.newReleaseClause,
            moraleImpact: -8,
            reputationImpact: -3,
          };
          setResult(res);
          setHistory(prev => [res, ...prev]);
          setPhase('result');
        } else {
          setNegotiation(prev => prev ? { ...prev, round: prev.round + 1 } : null);
          setPhase('negotiating');
        }
        setIsAnimating(false);
      }, 1500);
    }, 1200);
  }, [negotiation, player, selectedOffer, counterWage, counterContractLength, counterSigningBonus, counterReleaseClause]);

  // Back to offers
  const backToOffers = useCallback(() => {
    setPhase('offers_list');
    setSelectedOffer(null);
    setNegotiation(null);
    setResult(null);
    setClubMessage('');
  }, []);

  // Wage quick adjust
  const adjustWage = useCallback((pct: number) => {
    if (!negotiation) return;
    const base = negotiation.currentWage;
    const adjusted = Math.round(base * (1 + pct / 100) * 10) / 10;
    setCounterWage(adjusted);
  }, [negotiation]);

  // ============================================================
  // Visual Enhancement: Negotiation Phase Indicator
  // ============================================================
  const renderPhaseIndicator = (currentPhaseIdx: number, isFailed: boolean) => {
    const steps = ['Inquiry', 'Offer', 'Negotiation', 'Medical', isFailed ? 'Failed' : 'Agreement'];
    return (
      <div className="flex items-center px-1 py-2">
        {steps.map((step, i) => {
          const isCurrent = i === currentPhaseIdx;
          const isPast = i < currentPhaseIdx;
          const isFailStep = isFailed && i === currentPhaseIdx;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                    isCurrent && !isFailStep ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/30' :
                    isFailStep ? 'bg-red-600 text-white ring-2 ring-red-400/30' :
                    isPast ? 'bg-emerald-800 text-emerald-300' :
                    'bg-[#21262d] text-[#484f58] border border-[#30363d]'
                  }`}
                >
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-[7px] leading-none whitespace-nowrap ${
                  isCurrent ? (isFailStep ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold') :
                  isPast ? 'text-emerald-500' : 'text-[#484f58]'
                }`}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-1.5 min-w-[12px] ${
                  isPast || (isCurrent && !isFailStep && i < currentPhaseIdx) ? 'bg-emerald-600' : 'bg-[#30363d]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // Visual Enhancement: Contract Terms Stacked Bar Breakdown
  // ============================================================
  const renderContractBreakdown = () => {
    if (!negotiation) return null;
    const wage = negotiation.currentWage;
    const years = negotiation.currentContractLength;
    const bonus = negotiation.currentSigningBonus;
    const release = negotiation.currentReleaseClause ?? 0;

    const baseSalary = wage * 52 * years;
    const signingBonusVal = bonus;
    const loyaltyBonus = baseSalary * 0.1;
    const releaseClauseVal = release;

    const total = baseSalary + signingBonusVal + loyaltyBonus + releaseClauseVal;
    if (total <= 0) return null;

    const segments = [
      { label: 'Base Salary', value: baseSalary, color: '#34d399' },
      { label: 'Signing Bonus', value: signingBonusVal, color: '#38bdf8' },
      { label: 'Loyalty Bonus', value: loyaltyBonus, color: '#fbbf24' },
      { label: 'Release Clause', value: releaseClauseVal, color: '#f87171' },
    ].filter(s => s.value > 0);

    const pcts = segments.map(s => (s.value / total) * 100);

    return (
      <div className="space-y-2 mt-2 pt-2 border-t border-[#30363d]">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">Contract Value Breakdown</p>
        <div className="flex items-center gap-0.5 h-3 bg-[#21262d] rounded overflow-hidden">
          {segments.map((seg, i) => (
            <div
              key={seg.label}
              className="h-full"
              style={{
                width: `${pcts[i]}%`,
                backgroundColor: seg.color,
                borderRadius: i === 0 ? '4px 0 0 4px' : i === segments.length - 1 ? '0 4px 4px 0' : '0',
                minWidth: '2px',
              }}
              title={`${seg.label}: ${formatCurrency(seg.value, 'M')}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-1.5 text-[9px]">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[#8b949e] truncate">{seg.label}</span>
              <span className="text-[#c9d1d9] ml-auto whitespace-nowrap">{formatCurrency(seg.value, 'M')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#21262d]">
          <span className="text-[#8b949e]">Total Value</span>
          <span className="text-xs font-bold text-[#c9d1d9]">{formatCurrency(total, 'M')}</span>
        </div>
      </div>
    );
  };

  // ============================================================
  // Visual Enhancement: Agent Advice Panel
  // ============================================================
  const renderAgentAdvice = () => {
    if (!player || !negotiation || !selectedOffer) return null;
    const agentQ = player.agentQuality ?? 50;
    const wageOffer = negotiation.currentWage;
    const currentWageVal = player.contract?.weeklyWage ?? 0;
    const wageRatio = currentWageVal > 0 ? wageOffer / currentWageVal : 1;

    let recommendation: string;
    let confidence: 'high' | 'medium' | 'low';

    if (wageRatio >= 1.3 && selectedOffer.squadRole === 'starter') {
      recommendation = 'This is an excellent offer. Significant wage increase and a guaranteed starting spot. I strongly recommend accepting this deal.';
      confidence = 'high';
    } else if (wageRatio >= 1.15 && selectedOffer.squadRole !== 'bench') {
      recommendation = 'A solid offer with meaningful wage improvement. The squad role is reasonable. Consider accepting or negotiating a small bump.';
      confidence = 'medium';
    } else if (wageRatio >= 0.9) {
      recommendation = 'The terms are fair but not a major step up. You could negotiate for better conditions, especially on the squad role front.';
      confidence = 'medium';
    } else {
      recommendation = 'I have concerns about this offer. The wages are below your current level. Push back firmly or consider walking away unless the sporting project is compelling.';
      confidence = 'low';
    }

    const agentInitial = player.name?.charAt(0)?.toUpperCase() ?? 'A';
    const agentColor = agentQ >= 70 ? '#34d399' : agentQ >= 40 ? '#fbbf24' : '#f87171';

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: agentColor }}>
              {agentInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#c9d1d9]">Your Agent</p>
              <p className="text-[9px] text-[#8b949e]">Quality: {agentQ}/100</p>
            </div>
            <div className={`px-2.5 py-1 rounded-md text-[9px] font-semibold shrink-0 ${
              confidence === 'high' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/30' :
              confidence === 'medium' ? 'bg-amber-900/50 text-amber-400 border border-amber-700/30' :
              'bg-red-900/50 text-red-400 border border-red-700/30'
            }`}>
              {confidence === 'high' ? 'Confident' : confidence === 'medium' ? 'Cautious' : 'Worried'}
            </div>
          </div>
          <p className="text-[10px] text-[#c9d1d9] leading-relaxed">{recommendation}</p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-[9px] text-[#8b949e] shrink-0">Confidence</span>
            <div className="flex-1 h-1.5 bg-[#21262d] rounded overflow-hidden">
              <div
                className={`h-full rounded ${
                  confidence === 'high' ? 'bg-emerald-500' : confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence === 'high' ? '85' : confidence === 'medium' ? '55' : '25'}%` }}
              />
            </div>
            <span className={`text-[9px] font-medium shrink-0 ${
              confidence === 'high' ? 'text-emerald-400' : confidence === 'medium' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {confidence === 'high' ? '85%' : confidence === 'medium' ? '55%' : '25%'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // Visual Enhancement: Club Comparison Panel
  // ============================================================
  const renderClubComparison = () => {
    if (!selectedOffer || !currentClub || !player) return null;
    const target = selectedOffer.fromClub;

    const pros: string[] = [];
    const cons: string[] = [];

    if (target.reputation > currentClub.reputation) pros.push(`Higher reputation (+${target.reputation - currentClub.reputation})`);
    else if (target.reputation < currentClub.reputation) cons.push(`Lower reputation (-${currentClub.reputation - target.reputation})`);

    if (target.facilities > currentClub.facilities) pros.push(`Better facilities (+${target.facilities - currentClub.facilities})`);
    else if (target.facilities < currentClub.facilities) cons.push(`Worse facilities (-${currentClub.facilities - target.facilities})`);

    if (target.squadQuality < player.overall + 2) pros.push('Good chance to start');
    else if (target.squadQuality > currentClub.squadQuality + 5) cons.push('Harder to break into team');

    if (selectedOffer.weeklyWage > player.contract.weeklyWage) pros.push(`Wage increase (+${formatCurrency(selectedOffer.weeklyWage - player.contract.weeklyWage, 'K')}/wk)`);
    else if (selectedOffer.weeklyWage < player.contract.weeklyWage) cons.push(`Wage cut (-${formatCurrency(player.contract.weeklyWage - selectedOffer.weeklyWage, 'K')}/wk)`);

    if (target.tier < currentClub.tier) pros.push('Higher league tier');
    else if (target.tier > currentClub.tier) cons.push('Lower league tier');

    const hasEurope = target.tier <= 2;
    const currentEurope = currentClub.tier <= 2;
    if (hasEurope && !currentEurope) pros.push('European competition');
    if (!hasEurope && currentEurope) cons.push('No European football');

    const maxWage = Math.max(currentClub.wageBudget, target.wageBudget, 1);

    const tierBadge = (tier: number) => {
      if (tier <= 2) return 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30';
      if (tier <= 4) return 'bg-amber-900/40 text-amber-400 border-amber-700/30';
      return 'bg-red-900/40 text-red-400 border-red-700/30';
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3 space-y-2.5">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">Club Comparison</p>

          <div className="grid grid-cols-3 gap-x-2 text-center">
            <div className="text-[9px] text-[#484f58]" />
            <div className="text-[10px] font-semibold text-emerald-400">{currentClub.shortName}</div>
            <div className="text-[10px] font-semibold text-cyan-400">{target.shortName}</div>
          </div>

          <div className="grid grid-cols-3 gap-x-2 text-center items-center">
            <div className="text-[9px] text-[#484f58] text-left">League</div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium border ${tierBadge(currentClub.tier)}`}>Tier {currentClub.tier}</span></div>
            <div><span className={`inline-block px-2 py-0.5 rounded text-[9px] font-medium border ${tierBadge(target.tier)}`}>Tier {target.tier}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-x-2 text-center items-center">
            <div className="text-[9px] text-[#484f58] text-left">Wage Cap</div>
            <div className="space-y-0.5">
              <div className="h-2 bg-[#21262d] rounded overflow-hidden"><div className="h-full bg-emerald-500 rounded" style={{ width: `${(currentClub.wageBudget / maxWage) * 100}%` }} /></div>
              <span className="text-[8px] text-[#8b949e]">{formatCurrency(currentClub.wageBudget / 1000, 'K')}</span>
            </div>
            <div className="space-y-0.5">
              <div className="h-2 bg-[#21262d] rounded overflow-hidden"><div className="h-full bg-cyan-500 rounded" style={{ width: `${(target.wageBudget / maxWage) * 100}%` }} /></div>
              <span className="text-[8px] text-[#8b949e]">{formatCurrency(target.wageBudget / 1000, 'K')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-2 text-center items-center">
            <div className="text-[9px] text-[#484f58] text-left">Squad</div>
            <div className="text-[10px] text-[#c9d1d9]">{currentClub.squadQuality}</div>
            <div className="text-[10px] text-[#c9d1d9]">{target.squadQuality}</div>
          </div>

          <div className="grid grid-cols-3 gap-x-2 text-center items-center">
            <div className="text-[9px] text-[#484f58] text-left">Europe</div>
            <div className="text-[10px]">{currentEurope ? <span className="text-emerald-400">&#9733; Yes</span> : <span className="text-[#484f58]">&#8212; No</span>}</div>
            <div className="text-[10px]">{hasEurope ? <span className="text-emerald-400">&#9733; Yes</span> : <span className="text-[#484f58]">&#8212; No</span>}</div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 pt-2 border-t border-[#21262d]">
            <div>
              <p className="text-[9px] text-emerald-500 font-semibold mb-1">Pros</p>
              {pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="text-[9px] text-[#c9d1d9]">{pro}</span>
                </div>
              ))}
              {pros.length === 0 && <span className="text-[9px] text-[#484f58]">&#8212;</span>}
            </div>
            <div>
              <p className="text-[9px] text-red-400 font-semibold mb-1">Cons</p>
              {cons.map((con, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span className="text-[9px] text-[#c9d1d9]">{con}</span>
                </div>
              ))}
              {cons.length === 0 && <span className="text-[9px] text-[#484f58]">&#8212;</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // Visual Enhancement: Negotiation History Timeline
  // ============================================================
  const renderNegotiationTimeline = () => {
    if (negotiationRounds.length === 0) return null;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <History className="h-3 w-3" />
            Negotiation Timeline
          </p>
          <div className="space-y-0">
            {negotiationRounds.map((rnd, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${
                    rnd.accepted === true ? 'bg-emerald-400 ring-2 ring-emerald-400/20' :
                    rnd.accepted === false ? 'bg-red-400 ring-2 ring-red-400/20' :
                    'bg-[#30363d] ring-2 ring-[#30363d]/20'
                  }`} />
                  {i < negotiationRounds.length - 1 && (
                    <div className="w-px flex-1 bg-[#30363d] min-h-[20px]" />
                  )}
                </div>
                <div className="pb-3 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`text-[9px] font-semibold ${
                      rnd.party === 'club' ? 'text-cyan-400' : 'text-amber-400'
                    }`}>
                      {rnd.party === 'club' ? 'Club Offer' : 'Agent Counter'}
                    </span>
                    <span className="text-[8px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded">R{rnd.round}</span>
                    {rnd.accepted === true && <span className="text-[8px] text-emerald-400 font-semibold bg-emerald-900/30 px-1.5 py-0.5 rounded">Accepted</span>}
                    {rnd.accepted === false && <span className="text-[8px] text-red-400 font-semibold bg-red-900/30 px-1.5 py-0.5 rounded">Rejected</span>}
                  </div>
                  <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap text-[9px]">
                    <span><span className="text-[#484f58]">Wage </span><span className="text-emerald-400 font-medium">{formatCurrency(rnd.wage, 'K')}</span></span>
                    <span className="text-[#30363d]">|</span>
                    <span><span className="text-[#484f58]">Len </span><span className="text-[#c9d1d9]">{rnd.contractLength}yr</span></span>
                    <span className="text-[#30363d]">|</span>
                    <span><span className="text-[#484f58]">Bonus </span><span className="text-[#c9d1d9]">{formatCurrency(rnd.signingBonus, 'K')}</span></span>
                    <span className="text-[#30363d]">|</span>
                    <span><span className="text-[#484f58]">Fee </span><span className="text-[#c9d1d9]">{formatCurrency(rnd.transferFee, 'M')}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // Visual Enhancement: Transfer Fee Escalation Chart (SVG)
  // ============================================================
  const renderFeeEscalationChart = () => {
    if (negotiationRounds.length < 1 || !selectedOffer) return null;

    const fees = negotiationRounds.map(r => r.transferFee);
    const maxFee = Math.max(...fees);
    const minFee = Math.min(...fees);
    const range = maxFee - minFee || 1;

    const svgW = 300;
    const svgH = 80;
    const pad = { top: 18, right: 8, bottom: 8, left: 8 };
    const chartW = svgW - pad.left - pad.right;
    const chartH = svgH - pad.top - pad.bottom;

    const points = fees.map((fee, i) => ({
      x: pad.left + (fees.length === 1 ? chartW / 2 : (i / (fees.length - 1)) * chartW),
      y: pad.top + chartH - ((fee - minFee) / range) * chartH * 0.9 - chartH * 0.05,
      value: fee,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${pad.top + chartH} L ${points[0].x.toFixed(1)} ${pad.top + chartH} Z`
      : '';

    return (
      <div className="space-y-1.5">
        <p className="text-[10px] text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Transfer Fee Progression
        </p>
        <div className="bg-[#21262d] rounded-lg p-2">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: `${svgH}px` }}>
            {[0.25, 0.5, 0.75, 1].map(pct => (
              <line
                key={pct}
                x1={pad.left}
                y1={pad.top + (1 - pct) * chartH}
                x2={svgW - pad.right}
                y2={pad.top + (1 - pct) * chartH}
                stroke="#30363d"
                strokeWidth="0.5"
              />
            ))}
            {areaPath && (
              <path d={areaPath} fill="#34d399" fillOpacity="0.08" />
            )}
            <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#0d1117" stroke="#34d399" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#8b949e" fontSize="7" fontWeight="600">
                  {formatCurrency(p.value, 'M')}
                </text>
                <text x={p.x} y={pad.top + chartH + 7} textAnchor="middle" fill="#484f58" fontSize="6">
                  R{i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (!gameState || !player || !currentClub) return null;

  // ============================================================
  // Offers List Phase
  // ============================================================
  if (phase === 'offers_list') {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('transfers')} className="p-1 text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Handshake className="h-5 w-5 text-emerald-400" />
                Transfer Negotiation
              </h2>
              <p className="text-xs text-[#8b949e]">Week {currentWeek} - Season {currentSeason}</p>
            </div>
          </div>
          <Badge className="bg-amber-700 text-amber-100 text-[10px]">
            {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </Badge>
        </motion.div>

        {/* Player Info Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-[10px] text-[#8b949e]">{player.position} - OVR {player.overall} - {currentClub.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</p>
                <p className="text-[10px] text-[#8b949e]">Market Value</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offers */}
        {offers.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-[#484f58] mx-auto mb-2" />
                <p className="text-sm text-[#8b949e]">No transfer offers available this week.</p>
                <p className="text-[10px] text-[#484f58] mt-1">Check back during the transfer window for new interest.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer, idx) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 + idx * 0.06 }}
              >
                <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
                  <CardContent className="p-4">
                    {/* Club Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#21262d] flex items-center justify-center text-2xl border border-[#30363d]">
                        {offer.fromClub.logo}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{offer.fromClub.name}</p>
                        <p className="text-[10px] text-[#8b949e]">
                          {formatLeagueName(offer.fromClub.league)} - Rep {offer.fromClub.reputation}
                        </p>
                      </div>
                      <Badge className={`text-[9px] ${
                        offer.difficulty === 'easy' ? 'bg-emerald-700' :
                        offer.difficulty === 'hard' ? 'bg-red-700' :
                        'bg-amber-700'
                      }`}>
                        {offer.difficulty === 'easy' ? 'Favorable' : offer.difficulty === 'hard' ? 'Tough' : 'Standard'}
                      </Badge>
                    </div>

                    {/* Key Terms */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#21262d] rounded-lg p-2.5">
                        <span className="text-[9px] text-[#8b949e] uppercase">Transfer Fee</span>
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(offer.transferFee, 'M')}</p>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2.5">
                        <span className="text-[9px] text-[#8b949e] uppercase">Weekly Wage</span>
                        <p className="text-sm font-bold text-white">{formatCurrency(offer.weeklyWage, 'K')}</p>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2.5">
                        <span className="text-[9px] text-[#8b949e] uppercase">Contract</span>
                        <p className="text-sm font-semibold text-white">{offer.contractLength} years</p>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2.5">
                        <span className="text-[9px] text-[#8b949e] uppercase">Squad Role</span>
                        <p className={`text-sm font-semibold ${getRoleColor(offer.squadRole)}`}>
                          {getRoleLabel(offer.squadRole)}
                        </p>
                      </div>
                    </div>

                    {/* Wage Comparison */}
                    <div className="bg-[#21262d] rounded-lg p-2.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8b949e]">Current Wage</span>
                        <span className="text-[#c9d1d9]">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-[#8b949e]">Offered Wage</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-400">{formatCurrency(offer.weeklyWage, 'K')}</span>
                          {offer.weeklyWage > player.contract.weeklyWage ? (
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                          ) : offer.weeklyWage < player.contract.weeklyWage ? (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startNegotiation(offer)}
                        className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Review & Negotiate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Negotiation History */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className="text-sm font-semibold text-[#8b949e] mb-2 flex items-center gap-2">
              <History className="h-4 w-4" />
              Negotiation History
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className={`bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.offer.fromClub.logo}</span>
                    <div>
                      <p className="text-xs font-semibold">{h.offer.fromClub.name}</p>
                      <p className="text-[10px] text-[#8b949e]">
                        {h.rounds} round{h.rounds !== 1 ? 's' : ''} - {h.outcome === 'accepted' ? 'Signed' : 'Failed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {h.outcome === 'accepted' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ============================================================
  // Negotiation Phase (Offer Detail + Turn-based Dialogue)
  // ============================================================
  if ((phase === 'negotiating' || phase === 'counter_response') && negotiation && selectedOffer) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <button onClick={backToOffers} className="p-1 text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Negotiation</h2>
            <p className="text-xs text-[#8b949e]">
              Round {negotiation.round} of {negotiation.maxRounds}
            </p>
          </div>
          <Badge className={`text-[10px] ${
            negotiation.offer.difficulty === 'easy' ? 'bg-emerald-700' :
            negotiation.offer.difficulty === 'hard' ? 'bg-red-700' :
            'bg-amber-700'
          }`}>
            {negotiation.offer.difficulty === 'easy' ? 'Favorable' : negotiation.offer.difficulty === 'hard' ? 'Tough' : 'Standard'}
          </Badge>
        </motion.div>

        {/* Phase Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-2">
              {renderPhaseIndicator(
                negotiation.round === 1 ? 1 : 2,
                false
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Club Info Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#21262d] flex items-center justify-center text-xl border border-[#30363d]">
                  {selectedOffer.fromClub.logo}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{selectedOffer.fromClub.name}</p>
                  <p className="text-[10px] text-[#8b949e]">
                    {formatLeagueName(selectedOffer.fromClub.league)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(selectedOffer.transferFee, 'M')}</p>
                  <p className="text-[10px] text-[#8b949e]">Transfer Fee</p>
                </div>
              </div>

              {/* Comparison: Current vs Offering Club */}
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="text-[9px] text-[#484f58]" />
                <div className="text-[9px] text-emerald-500 font-medium">{currentClub.shortName}</div>
                <div className="text-[9px] text-cyan-500 font-medium">{selectedOffer.fromClub.shortName}</div>
                <div className="text-[9px] text-[#484f58] text-left">Quality</div>
                <div className="text-[9px] text-[#c9d1d9]">{currentClub.squadQuality}</div>
                <div className={`text-[9px] text-[#c9d1d9]`}>{selectedOffer.fromClub.squadQuality}</div>
                <div className="text-[9px] text-[#484f58] text-left">Rep</div>
                <div className="text-[9px] text-[#c9d1d9]">{currentClub.reputation}</div>
                <div className="text-[9px] text-[#c9d1d9]">{selectedOffer.fromClub.reputation}</div>
                <div className="text-[9px] text-[#484f58] text-left">Facilities</div>
                <div className="text-[9px] text-[#c9d1d9]">{currentClub.facilities}</div>
                <div className="text-[9px] text-[#c9d1d9]">{selectedOffer.fromClub.facilities}</div>
              </div>

              {/* Patience Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#8b949e]">Club Patience</span>
                  <span className={`font-medium ${
                    negotiation.patience > 60 ? 'text-emerald-400' :
                    negotiation.patience > 30 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {negotiation.patience}%
                  </span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${negotiation.patience}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      negotiation.patience > 60 ? 'bg-emerald-500' :
                      negotiation.patience > 30 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Club Comparison */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}>
          {renderClubComparison()}
        </motion.div>

        {/* Agent Advice Panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          {renderAgentAdvice()}
        </motion.div>

        {/* Club Message */}
        {clubMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`border rounded-lg p-3 flex items-start gap-2 ${
              result?.outcome === 'accepted'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <MessageSquare className={`h-4 w-4 mt-0.5 shrink-0 ${
                result?.outcome === 'accepted' ? 'text-emerald-400' : 'text-amber-400'
              }`} />
              <p className="text-xs text-[#c9d1d9]">{clubMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Counter Response Waiting */}
        {phase === 'counter_response' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 space-y-3">
            <div className="w-10 h-10 rounded-xl border-2 border-[#30363d] border-t-emerald-400 animate-spin" />
            <p className="text-sm text-[#8b949e]">{selectedOffer.fromClub.name} is considering your offer...</p>
          </motion.div>
        )}

        {/* Negotiation Terms */}
        {phase === 'negotiating' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <span className="text-base">{selectedOffer.fromClub.logo}</span>
                  {selectedOffer.fromClub.name}&apos;s Current Offer
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {/* Current Offer Terms */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Weekly Wage
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#484f58] line-through">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(negotiation.currentWage, 'K')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Contract Length
                    </span>
                    <span className="text-sm font-semibold text-white">{negotiation.currentContractLength} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5" /> Signing Bonus
                    </span>
                    <span className="text-sm text-white">{formatCurrency(negotiation.currentSigningBonus, 'K')}</span>
                  </div>
                  {negotiation.currentReleaseClause && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" /> Release Clause
                      </span>
                      <span className="text-sm text-amber-400">{formatCurrency(negotiation.currentReleaseClause, 'M')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Squad Role
                    </span>
                    <span className={`text-sm font-semibold ${getRoleColor(selectedOffer.squadRole)}`}>
                      {getRoleLabel(selectedOffer.squadRole)}
                    </span>
                  </div>
                </div>

                {/* Contract Terms Breakdown */}
                {renderContractBreakdown()}

                {/* Transfer Fee Escalation Chart */}
                {renderFeeEscalationChart()}

                {/* Divider */}
                <div className="border-t border-[#30363d] pt-3">
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-2">Your Counter-Offer</p>

                  {/* Counter Wage */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(counterWage, 'K')}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => adjustWage(10)} className="flex-1 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[10px] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-700/40 transition-colors">
                        +10%
                      </button>
                      <button onClick={() => adjustWage(20)} className="flex-1 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[10px] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-700/40 transition-colors">
                        +20%
                      </button>
                      <button onClick={() => adjustWage(30)} className="flex-1 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-[10px] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-700/40 transition-colors">
                        +30%
                      </button>
                    </div>
                  </div>

                  {/* Counter Contract Length */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b949e]">Contract Length</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setCounterContractLength(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-bold">{counterContractLength}yr</span>
                      <button
                        onClick={() => setCounterContractLength(prev => Math.min(6, prev + 1))}
                        className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Signing Bonus Toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b949e]">Signing Bonus</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setCounterSigningBonus(prev => Math.max(0, Math.round(prev - counterWage * 2)))}
                        className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-16 text-center text-xs font-bold text-white">{formatCurrency(counterSigningBonus, 'K')}</span>
                      <button
                        onClick={() => setCounterSigningBonus(prev => Math.round(prev + counterWage * 2))}
                        className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-[#c9d1d9] transition-colors flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Comparison */}
                  <div className="bg-[#21262d] rounded-lg p-2.5 mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8b949e]">Wage Diff</span>
                      <span className={counterWage > negotiation.currentWage ? 'text-amber-400' : 'text-emerald-400'}>
                        {counterWage > negotiation.currentWage
                          ? `+${((counterWage - negotiation.currentWage) / negotiation.currentWage * 100).toFixed(0)}% above`
                          : counterWage < negotiation.currentWage
                          ? `${((counterWage - negotiation.currentWage) / negotiation.currentWage * 100).toFixed(0)}% below`
                          : 'Same as offer'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        {phase === 'negotiating' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2">
            <Button
              onClick={acceptOffer}
              disabled={isAnimating}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept Offer
            </Button>
            <Button
              onClick={submitCounterOffer}
              disabled={isAnimating}
              className="w-full h-11 bg-amber-700 hover:bg-amber-600 text-white font-semibold rounded-lg"
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Submit Counter-Offer
            </Button>
            <Button
              onClick={rejectOffer}
              disabled={isAnimating}
              variant="outline"
              className="w-full h-10 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] rounded-lg text-xs"
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
              Reject & Walk Away
            </Button>
          </motion.div>
        )}

        {/* Negotiation Timeline */}
        {negotiationRounds.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            {renderNegotiationTimeline()}
          </motion.div>
        )}
      </div>
    );
  }

  // ============================================================
  // Result Phase
  // ============================================================
  if (phase === 'result' && result && selectedOffer) {
    const isSuccess = result.outcome === 'accepted';

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Result Phase Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-2">
              {renderPhaseIndicator(isSuccess ? 4 : 4, !isSuccess)}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center space-y-3 py-6">
            {isSuccess ? (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <PartyPopper className="h-14 w-14 text-emerald-400 mx-auto" />
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-2xl font-bold text-emerald-400">Deal Complete!</h2>
                  <p className="text-sm text-[#8b949e] mt-1">
                    You have reached an agreement with {selectedOffer.fromClub.name}
                  </p>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  {result.outcome === 'rejected_club' ? (
                    <Ban className="h-14 w-14 text-red-400 mx-auto" />
                  ) : (
                    <XCircle className="h-14 w-14 text-red-400 mx-auto" />
                  )}
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-2xl font-bold text-red-400">Deal Falls Through</h2>
                  <p className="text-sm text-[#8b949e] mt-1">
                    {result.outcome === 'rejected_club'
                      ? `${selectedOffer.fromClub.name} has walked away from negotiations.`
                      : result.outcome === 'rejected_player'
                      ? 'You chose to walk away from the offer.'
                      : `No agreement could be reached after ${result.rounds} rounds.`}
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Final Deal Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className={`border ${isSuccess ? 'bg-[#161b22] border-emerald-800/50' : 'bg-[#161b22] border-[#30363d]'}`}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className={`text-xs uppercase tracking-wider flex items-center gap-2 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                <span className="text-base">{selectedOffer.fromClub.logo}</span>
                {isSuccess ? 'New Contract' : 'Failed Negotiation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Club</span>
                <span className="text-sm font-semibold">{selectedOffer.fromClub.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">League</span>
                <span className="text-xs">{formatLeagueName(selectedOffer.fromClub.league)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Transfer Fee</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(result.offer.transferFee, 'M')}</span>
              </div>
              {isSuccess && (
                <>
                  <div className="border-t border-[#30363d] pt-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Final Wage</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(result.finalWage, 'K')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Contract Length</span>
                      <span className="text-sm font-semibold">{result.finalContractLength} years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Signing Bonus</span>
                      <span className="text-sm">{formatCurrency(result.finalSigningBonus, 'K')}</span>
                    </div>
                    {result.finalReleaseClause && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">Release Clause</span>
                        <span className="text-xs text-amber-400">{formatCurrency(result.finalReleaseClause, 'M')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Squad Role</span>
                      <span className={`text-sm font-semibold ${getRoleColor(selectedOffer.squadRole)}`}>
                        {getRoleLabel(selectedOffer.squadRole)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Rounds</span>
                <span className="text-xs">{result.rounds}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">Impact</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> Morale
                </span>
                <span className={`text-sm font-bold ${result.moraleImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.moraleImpact >= 0 ? '+' : ''}{result.moraleImpact}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" /> Reputation
                </span>
                <span className={`text-sm font-bold ${result.reputationImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.reputationImpact >= 0 ? '+' : ''}{result.reputationImpact}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div className={`border rounded-lg p-3 ${
            isSuccess
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-2">
              {isSuccess ? (
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              )}
              <div className="text-xs text-[#c9d1d9]">
                {isSuccess
                  ? `Congratulations! After ${result.rounds} round${result.rounds !== 1 ? 's' : ''} of negotiation, you secured a move to ${selectedOffer.fromClub.name}. Your agent negotiated a ${formatCurrency(result.finalWage, 'K')}/week deal.`
                  : `The negotiation with ${selectedOffer.fromClub.name} didn't work out. ${result.outcome === 'rejected_club' ? 'The club felt your demands were too high.' : result.outcome === 'rejected_player' ? 'You decided the terms weren\'t right for you.' : 'Neither side could find common ground after multiple rounds.'} Other clubs may still be interested.`
                }
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Button
            onClick={backToOffers}
            className="w-full h-11 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-semibold rounded-lg"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {offers.length > 1 ? 'View Other Offers' : 'Back to Transfers'}
          </Button>
        </motion.div>

        {/* History */}
        {history.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <h3 className="text-xs text-[#8b949e] mb-2 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Recent Negotiations
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {history.slice(1).map((h, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{h.offer.fromClub.logo}</span>
                    <p className="text-[10px] text-[#8b949e]">{h.offer.fromClub.name}</p>
                  </div>
                  {h.outcome === 'accepted' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}
