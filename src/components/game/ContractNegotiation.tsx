'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency, calculateWage, calculateMarketValue, randomBetween, randomFloatBetween } from '@/lib/game/gameUtils';
import { Contract, Player, Club } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FileText, DollarSign, Clock, CheckCircle, XCircle,
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle,
  PartyPopper, Handshake, RotateCcw, Ban, ChevronRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Types
// ============================================================

interface ContractOfferData {
  weeklyWage: number;
  yearsRemaining: number;
  signingBonus: number;
  performanceBonuses: {
    goalsBonus?: number;
    assistBonus?: number;
    cleanSheetBonus?: number;
  };
  releaseClause?: number;
}

type NegotiationPhase = 'overview' | 'offer' | 'counter' | 'response' | 'outcome';
type OutcomeType = 'accepted' | 'counter_accepted' | 'rejected_by_club' | 'rejected_by_player' | 'walked_away';

interface NegotiationRound {
  round: number;
  clubOffer: ContractOfferData;
  playerDemand?: ContractOfferData;
  clubResponse?: ContractOfferData;
}

// ============================================================
// Helper: Generate club's initial contract offer
// ============================================================

function generateClubOffer(
  player: Player,
  club: Club,
  currentWage: number
): ContractOfferData {
  // Base offer depends on player performance, squad status, and club quality
  const performanceFactor = player.form >= 7.0 ? 1.15 : player.form >= 5.5 ? 1.0 : 0.85;
  const reputationFactor = 0.7 + (player.reputation / 100) * 0.5;
  const clubBudgetFactor = club.finances >= 80 ? 1.1 : club.finances >= 60 ? 1.0 : 0.85;
  const squadRoleFactor = player.squadStatus === 'starter' ? 1.2 :
    player.squadStatus === 'rotation' ? 1.0 :
    player.squadStatus === 'bench' ? 0.8 : 0.65;

  // Calculate a fair wage using the formula
  const fairWage = calculateWage(player.overall, club.tier, player.reputation);
  const proposedWage = Math.round(fairWage * performanceFactor * reputationFactor * clubBudgetFactor * squadRoleFactor * 10) / 10;

  // Clamp the offer between 80%-120% of fair wage (clubs try to be reasonable initially)
  const minOffer = Math.round(fairWage * 0.8 * 10) / 10;
  const maxOffer = Math.round(fairWage * 1.3 * 10) / 10;
  const finalWage = Math.min(maxOffer, Math.max(minOffer, proposedWage));

  // Contract length: 2-5 years depending on age and status
  const years = player.age <= 22 ? randomBetween(4, 5) :
    player.age <= 28 ? randomBetween(3, 5) :
    player.age <= 32 ? randomBetween(2, 3) :
    randomBetween(1, 2);

  // Signing bonus: 2-8 weeks of wages
  const signingBonusWeeks = randomFloatBetween(2, 8);
  const signingBonus = Math.round(finalWage * signingBonusWeeks * 10) / 10;

  // Performance bonuses
  const goalsBonus = ['ST', 'LW', 'RW', 'CAM'].includes(player.position)
    ? Math.round(finalWage * randomFloatBetween(0.5, 2.0) * 10) / 10
    : Math.round(finalWage * randomFloatBetween(0.2, 0.8) * 10) / 10;

  const assistBonus = Math.round(finalWage * randomFloatBetween(0.2, 1.0) * 10) / 10;

  const cleanSheetBonus = ['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position)
    ? Math.round(finalWage * randomFloatBetween(0.3, 1.2) * 10) / 10
    : 0;

  // Release clause: typically 2-5x market value for important players
  const hasReleaseClause = Math.random() < 0.5;
  const releaseMultiplier = randomFloatBetween(2.0, 5.0);
  const releaseClause = hasReleaseClause
    ? Math.round(player.marketValue * releaseMultiplier * 100) / 100
    : undefined;

  return {
    weeklyWage: finalWage,
    yearsRemaining: years,
    signingBonus,
    performanceBonuses: {
      goalsBonus,
      assistBonus,
      cleanSheetBonus: cleanSheetBonus || undefined,
    },
    releaseClause,
  };
}

// ============================================================
// Helper: Club responds to counter-offer
// ============================================================

function generateClubResponse(
  originalOffer: ContractOfferData,
  playerDemand: ContractOfferData,
  player: Player,
  club: Club,
  round: number
): { offer: ContractOfferData; accepted: boolean } {
  // How far apart are they?
  const wageDiff = playerDemand.weeklyWage - originalOffer.weeklyWage;
  const wageDiffPct = wageDiff / originalOffer.weeklyWage;

  // Willingness to negotiate depends on club finances, player importance, and round
  const importanceFactor = player.squadStatus === 'starter' ? 1.3 :
    player.squadStatus === 'rotation' ? 1.0 : 0.7;
  const financesFactor = club.finances >= 80 ? 1.2 : club.finances >= 60 ? 1.0 : 0.8;

  // If demand is too high (more than 50% above offer), club may reject outright
  if (wageDiffPct > 0.5 && round >= 2) {
    return { offer: originalOffer, accepted: false };
  }

  // If demand is very reasonable (within 10%), accept with slight improvement
  if (wageDiffPct <= 0.1) {
    const compromise = Math.round((originalOffer.weeklyWage + playerDemand.weeklyWage) / 2 * 10) / 10;
    return {
      offer: { ...originalOffer, weeklyWage: compromise },
      accepted: true,
    };
  }

  // Calculate compromise: club meets player somewhere in the middle
  // The more important the player and richer the club, the more they'll budge
  const negotiationPower = importanceFactor * financesFactor;
  const meetPoint = Math.min(0.8, 0.3 + (negotiationPower - 0.7) * 0.5); // how far towards player the club moves (0-0.8)

  const compromiseWage = Math.round(
    (originalOffer.weeklyWage + wageDiff * meetPoint) * 10
  ) / 10;

  // Compromise on years too
  const yearsCompromise = Math.round(
    (originalOffer.yearsRemaining + playerDemand.yearsRemaining) / 2
  );

  // Recalculate signing bonus proportional to new wage
  const signingBonusRatio = originalOffer.signingBonus / originalOffer.weeklyWage;
  const newSigningBonus = Math.round(compromiseWage * signingBonusRatio * 10) / 10;

  // Performance bonuses scale with wage
  const bonusScale = compromiseWage / originalOffer.weeklyWage;
  const newBonuses = { ...originalOffer.performanceBonuses };
  if (newBonuses.goalsBonus) newBonuses.goalsBonus = Math.round(newBonuses.goalsBonus * bonusScale * 10) / 10;
  if (newBonuses.assistBonus) newBonuses.assistBonus = Math.round(newBonuses.assistBonus * bonusScale * 10) / 10;
  if (newBonuses.cleanSheetBonus) newBonuses.cleanSheetBonus = Math.round(newBonuses.cleanSheetBonus * bonusScale * 10) / 10;

  // Release clause might increase
  const newReleaseClause = originalOffer.releaseClause
    ? Math.round(originalOffer.releaseClause * (1 + wageDiffPct * 0.3) * 100) / 100
    : undefined;

  return {
    offer: {
      weeklyWage: compromiseWage,
      yearsRemaining: yearsCompromise,
      signingBonus: newSigningBonus,
      performanceBonuses: newBonuses,
      releaseClause: newReleaseClause,
    },
    accepted: false,
  };
}

// ============================================================
// Component Props
// ============================================================

interface ContractNegotiationProps {
  open: boolean;
  onClose: () => void;
}

// ============================================================
// Main Component
// ============================================================

export default function ContractNegotiation({ open, onClose }: ContractNegotiationProps) {
  const gameState = useGameStore(state => state.gameState);
  const negotiateContract = useGameStore(state => state.negotiateContract);
  const addNotification = useGameStore(state => state.addNotification);

  // Negotiation state
  const [phase, setPhase] = useState<NegotiationPhase>('overview');
  const [rounds, setRounds] = useState<NegotiationRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [outcome, setOutcome] = useState<OutcomeType | null>(null);
  const [finalOffer, setFinalOffer] = useState<ContractOfferData | null>(null);

  // Counter-offer state
  const [counterWage, setCounterWage] = useState(0);
  const [counterYears, setCounterYears] = useState(3);
  const [wageMin, setWageMin] = useState(0);
  const [wageMax, setWageMax] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rejection tracking: store in a simple state
  const [rejectionCount, setRejectionCount] = useState(0);

  // Reset negotiation when dialog opens
  const resetNegotiation = useCallback(() => {
    setPhase('overview');
    setRounds([]);
    setCurrentRound(0);
    setOutcome(null);
    setFinalOffer(null);
    setCounterWage(0);
    setCounterYears(3);
    setWageMin(0);
    setWageMax(0);
    setIsAnimating(false);
  }, []);

  // Initialize negotiation when opened
  const startNegotiation = useCallback(() => {
    if (!gameState) return;
    const { player, currentClub } = gameState;

    const clubOffer = generateClubOffer(player, currentClub, player.contract.weeklyWage);
    const round: NegotiationRound = { round: 1, clubOffer };
    setRounds([round]);
    setCurrentRound(1);

    // Set counter-offer slider range
    const minWage = Math.round(clubOffer.weeklyWage * 0.5 * 10) / 10;
    const maxWage = Math.round(clubOffer.weeklyWage * 2.5 * 10) / 10;
    setWageMin(minWage);
    setWageMax(maxWage);
    setCounterWage(Math.round(clubOffer.weeklyWage * 1.2 * 10) / 10);
    setCounterYears(clubOffer.yearsRemaining + 1);

    setPhase('offer');
  }, [gameState]);

  // Handle accepting the club's current offer
  const handleAccept = useCallback((offer: ContractOfferData) => {
    if (!gameState) return;
    setIsAnimating(true);
    setTimeout(() => {
      negotiateContract(offer);
      setFinalOffer(offer);
      setOutcome('accepted');
      setPhase('outcome');
      setIsAnimating(false);
    }, 600);
  }, [gameState, negotiateContract]);

  // Handle rejecting and walking away
  const handleReject = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setOutcome('rejected_by_player');
      setPhase('outcome');
      setRejectionCount(prev => prev + 1);
      addNotification({
        type: 'contract',
        title: 'Contract Rejected',
        message: 'You rejected the contract offer. The club may be reluctant to negotiate again soon.',
        actionRequired: false,
      });
      setIsAnimating(false);
    }, 400);
  }, [addNotification]);

  // Handle counter-offer submission
  const handleCounterOffer = useCallback(() => {
    if (!gameState || rounds.length === 0) return;
    const { player, currentClub } = gameState;
    const currentRoundData = rounds[rounds.length - 1];

    const playerDemand: ContractOfferData = {
      weeklyWage: counterWage,
      yearsRemaining: counterYears,
      signingBonus: Math.round(counterWage * randomFloatBetween(3, 8) * 10) / 10,
      performanceBonuses: {
        goalsBonus: Math.round(counterWage * randomFloatBetween(0.5, 2.0) * 10) / 10,
        assistBonus: Math.round(counterWage * randomFloatBetween(0.2, 1.0) * 10) / 10,
        cleanSheetBonus: ['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position)
          ? Math.round(counterWage * randomFloatBetween(0.3, 1.2) * 10) / 10
          : undefined,
      },
    };

    // Update the current round with player demand
    const updatedRounds = [...rounds];
    updatedRounds[updatedRounds.length - 1] = {
      ...currentRoundData,
      playerDemand,
    };

    setRounds(updatedRounds);
    setPhase('response');
    setIsAnimating(true);

    // Simulate club response after a delay
    setTimeout(() => {
      const { offer: clubResponse, accepted } = generateClubResponse(
        currentRoundData.clubOffer,
        playerDemand,
        player,
        currentClub,
        currentRound
      );

      const finalRounds = [...updatedRounds];
      finalRounds[finalRounds.length - 1] = {
        ...finalRounds[finalRounds.length - 1],
        clubResponse,
      };
      setRounds(finalRounds);

      if (accepted) {
        // Club accepts the counter-offer terms
        setFinalOffer(clubResponse);
        negotiateContract(clubResponse);
        setOutcome('counter_accepted');
        setPhase('outcome');
      } else if (currentRound >= 3) {
        // Max rounds reached, negotiation failed
        setOutcome('walked_away');
        setPhase('outcome');
        addNotification({
          type: 'contract',
          title: 'Negotiations Failed',
          message: 'The club could not reach an agreement with you after 3 rounds of negotiation.',
          actionRequired: false,
        });
      } else {
        // Another round
        const newRound: NegotiationRound = {
          round: currentRound + 1,
          clubOffer: clubResponse,
        };
        setRounds(prev => [...prev, newRound]);
        setCurrentRound(prev => prev + 1);

        // Update slider range for new round
        const newMinWage = Math.round(clubResponse.weeklyWage * 0.5 * 10) / 10;
        const newMaxWage = Math.round(clubResponse.weeklyWage * 2.5 * 10) / 10;
        setWageMin(newMinWage);
        setWageMax(newMaxWage);
        setCounterWage(Math.round(clubResponse.weeklyWage * 1.15 * 10) / 10);
        setCounterYears(clubResponse.yearsRemaining);

        setPhase('offer');
      }

      setIsAnimating(false);
    }, 1200);
  }, [gameState, rounds, currentRound, counterWage, counterYears, negotiateContract, addNotification]);

  // Get current club offer
  const currentClubOffer = useMemo(() => {
    if (rounds.length === 0) return null;
    return rounds[rounds.length - 1].clubOffer;
  }, [rounds]);

  // Can the player negotiate? (≤ 2 years remaining)
  const canNegotiate = useMemo(() => {
    if (!gameState) return false;
    return gameState.player.contract.yearsRemaining <= 2;
  }, [gameState]);

  // Get years remaining color
  const getYearsColor = (years: number) => {
    if (years <= 1) return 'text-red-400';
    if (years <= 2) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getYearsBg = (years: number) => {
    if (years <= 1) return 'bg-red-500/10 border-red-500/20';
    if (years <= 2) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-emerald-500/10 border-emerald-500/20';
  };

  const getYearsBadgeBg = (years: number) => {
    if (years <= 1) return 'bg-red-600';
    if (years <= 2) return 'bg-amber-600';
    return 'bg-emerald-600';
  };

  if (!gameState || !canNegotiate) return null;

  const { player, currentClub } = gameState;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onClose(); } }}>
      <DialogContent className="bg-[#0d1117] border-[#30363d] text-white max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Contract Negotiation</DialogTitle>
          <DialogDescription>Negotiate your contract with {currentClub.name}</DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* ====== OVERVIEW PHASE ====== */}
          {phase === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Contract Negotiation</h3>
                  <p className="text-xs text-[#8b949e]">{currentClub.name} wants to discuss your contract</p>
                </div>
              </div>

              {/* Current Contract Status */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Current Contract Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  {/* Weekly Wage */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Weekly Wage
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(player.contract.weeklyWage, 'K')}
                    </span>
                  </div>

                  {/* Years Remaining */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Years Remaining
                    </span>
                    <Badge className={`${getYearsBadgeBg(player.contract.yearsRemaining)} text-white text-xs`}>
                      {player.contract.yearsRemaining} year{player.contract.yearsRemaining !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Market Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Market Value
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(player.marketValue, 'M')}
                    </span>
                  </div>

                  {/* Release Clause */}
                  {player.contract.releaseClause && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Release Clause
                      </span>
                      <span className="text-sm text-amber-400">
                        {formatCurrency(player.contract.releaseClause, 'M')}
                      </span>
                    </div>
                  )}

                  {/* Signing Bonus */}
                  {player.contract.signingBonus ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#8b949e] flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        Signing Bonus
                      </span>
                      <span className="text-sm text-white">
                        {formatCurrency(player.contract.signingBonus, 'K')}
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Expiring Warning */}
              {player.contract.yearsRemaining <= 1 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-400">Contract Expiring!</p>
                    <p className="text-[10px] text-red-300/70 mt-0.5">
                      Your contract expires at the end of this season. Negotiate now to secure your future.
                    </p>
                  </div>
                </div>
              )}

              {player.contract.yearsRemaining === 2 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-400">Contract Running Low</p>
                    <p className="text-[10px] text-amber-300/70 mt-0.5">
                      With 2 years remaining, it&apos;s a good time to negotiate improved terms.
                    </p>
                  </div>
                </div>
              )}

              {/* Start Negotiation Button */}
              <Button
                onClick={startNegotiation}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
              >
                <Handshake className="mr-2 h-4 w-4" />
                Start Negotiation
              </Button>
            </motion.div>
          )}

          {/* ====== OFFER PHASE ====== */}
          {phase === 'offer' && currentClubOffer && (
            <motion.div
              key={`offer-${currentRound}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Round {currentRound} of 3</h3>
                  {currentRound > 1 && (
                    <Badge className="bg-amber-600 text-white text-[10px]">
                      <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                      Revised
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(r => (
                    <div
                      key={r}
                      className={`w-6 h-1.5 rounded-full ${
                        r < currentRound ? 'bg-emerald-500' :
                        r === currentRound ? 'bg-emerald-400' :
                        'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Club's Offer Card */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-base">{currentClub.logo}</span>
                    {currentClub.name}&apos;s Offer
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {/* Wage Comparison */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#484f58] line-through">
                        {formatCurrency(player.contract.weeklyWage, 'K')}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(currentClubOffer.weeklyWage, 'K')}
                      </span>
                      {currentClubOffer.weeklyWage > player.contract.weeklyWage ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : currentClubOffer.weeklyWage < player.contract.weeklyWage ? (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      ) : null}
                    </div>
                  </div>

                  {/* Contract Length */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Contract Length</span>
                    <span className={`text-sm font-semibold ${getYearsColor(currentClubOffer.yearsRemaining)}`}>
                      {currentClubOffer.yearsRemaining} year{currentClubOffer.yearsRemaining !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Signing Bonus */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Signing Bonus</span>
                    <span className="text-sm text-white">
                      {formatCurrency(currentClubOffer.signingBonus, 'K')}
                    </span>
                  </div>

                  {/* Performance Bonuses */}
                  {currentClubOffer.performanceBonuses && (
                    <div className="pt-2 border-t border-[#30363d] space-y-1.5">
                      <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Performance Bonuses</span>
                      {currentClubOffer.performanceBonuses.goalsBonus && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#8b949e]">Goal Bonus</span>
                          <span className="text-xs text-emerald-400">{formatCurrency(currentClubOffer.performanceBonuses.goalsBonus, 'K')}/goal</span>
                        </div>
                      )}
                      {currentClubOffer.performanceBonuses.assistBonus && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#8b949e]">Assist Bonus</span>
                          <span className="text-xs text-blue-400">{formatCurrency(currentClubOffer.performanceBonuses.assistBonus, 'K')}/assist</span>
                        </div>
                      )}
                      {currentClubOffer.performanceBonuses.cleanSheetBonus && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#8b949e]">Clean Sheet Bonus</span>
                          <span className="text-xs text-amber-400">{formatCurrency(currentClubOffer.performanceBonuses.cleanSheetBonus, 'K')}/CS</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Release Clause */}
                  {currentClubOffer.releaseClause && (
                    <div className="pt-2 border-t border-[#30363d]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">Release Clause</span>
                        <span className="text-xs text-amber-400">{formatCurrency(currentClubOffer.releaseClause, 'M')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleAccept(currentClubOffer)}
                  disabled={isAnimating}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Offer
                </Button>
                <Button
                  onClick={() => setPhase('counter')}
                  disabled={isAnimating || currentRound >= 3}
                  variant="outline"
                  className="w-full h-11 border-amber-700/50 text-amber-300 hover:bg-amber-900/20 font-semibold rounded-lg"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Counter-Offer
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isAnimating}
                  variant="outline"
                  className="w-full h-11 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] rounded-lg"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject & Walk Away
                </Button>
              </div>
            </motion.div>
          )}

          {/* ====== COUNTER-OFFER PHASE ====== */}
          {phase === 'counter' && currentClubOffer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm">Your Counter-Offer</h3>
              </div>

              {/* Wage Slider */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#8b949e]">Weekly Wage Demand</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(counterWage, 'K')}
                      </span>
                    </div>
                    <Slider
                      value={[counterWage]}
                      min={wageMin}
                      max={wageMax}
                      step={0.1}
                      onValueChange={([val]) => setCounterWage(Math.round(val * 10) / 10)}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-[#484f58]">{formatCurrency(wageMin, 'K')}</span>
                      <span className="text-[10px] text-[#8b949e]">
                        Club offer: {formatCurrency(currentClubOffer.weeklyWage, 'K')}
                      </span>
                      <span className="text-[10px] text-[#484f58]">{formatCurrency(wageMax, 'K')}</span>
                    </div>
                  </div>

                  {/* Contract Length Dropdown */}
                  <div>
                    <span className="text-xs text-[#8b949e] mb-2 block">Contract Length</span>
                    <Select
                      value={String(counterYears)}
                      onValueChange={(val) => setCounterYears(Number(val))}
                    >
                      <SelectTrigger className="w-full bg-[#21262d] border-[#30363d] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161b22] border-[#30363d]">
                        {[1, 2, 3, 4, 5].map(year => (
                          <SelectItem key={year} value={String(year)} className="text-white focus:bg-[#21262d] focus:text-white">
                            {year} year{year !== 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick comparison */}
                  <div className="bg-[#21262d] rounded-lg p-3 space-y-1.5">
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Comparison</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Current Wage</span>
                      <span className="text-[#c9d1d9]">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Club Offer</span>
                      <span className="text-emerald-400">{formatCurrency(currentClubOffer.weeklyWage, 'K')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b949e]">Your Demand</span>
                      <span className={`font-semibold ${counterWage > currentClubOffer.weeklyWage ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(counterWage, 'K')}
                      </span>
                    </div>
                    {counterWage > currentClubOffer.weeklyWage && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Difference</span>
                        <span className="text-amber-400">
                          +{((counterWage - currentClubOffer.weeklyWage) / currentClubOffer.weeklyWage * 100).toFixed(0)}% above offer
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit / Back buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCounterOffer}
                  disabled={isAnimating}
                  className="w-full h-11 bg-amber-700 hover:bg-amber-600 text-white font-semibold rounded-lg"
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Submit Counter-Offer
                </Button>
                <Button
                  onClick={() => setPhase('offer')}
                  variant="outline"
                  className="w-full h-10 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] rounded-lg text-sm"
                >
                  Back to Offer
                </Button>
              </div>
            </motion.div>
          )}

          {/* ====== RESPONSE PHASE (Club considering) ====== */}
          {phase === 'response' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-2 border-[#30363d] border-t-emerald-400"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{currentClub.name} is considering...</p>
                <p className="text-xs text-[#8b949e] mt-1">The board is reviewing your counter-offer</p>
              </div>
            </motion.div>
          )}

          {/* ====== OUTCOME PHASE ====== */}
          {phase === 'outcome' && finalOffer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Outcome Message */}
              <AnimatePresence mode="wait">
                {(outcome === 'accepted' || outcome === 'counter_accepted') && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="text-center space-y-3"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <PartyPopper className="h-12 w-12 text-emerald-400 mx-auto" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg text-emerald-400">Contract Signed!</h3>
                      <p className="text-xs text-[#8b949e] mt-1">
                        {outcome === 'accepted'
                          ? 'You accepted the club\'s offer!'
                          : 'The club accepted your counter-offer!'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {outcome === 'rejected_by_player' && (
                  <motion.div
                    key="rejected-player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="text-center space-y-3"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <XCircle className="h-12 w-12 text-red-400 mx-auto" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg text-red-400">Offer Rejected</h3>
                      <p className="text-xs text-[#8b949e] mt-1">
                        You walked away from the negotiation table. The club may be reluctant to negotiate again soon.
                      </p>
                    </div>
                  </motion.div>
                )}

                {outcome === 'walked_away' && (
                  <motion.div
                    key="walked-away"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="text-center space-y-3"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Ban className="h-12 w-12 text-red-400 mx-auto" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg text-red-400">Negotiations Failed</h3>
                      <p className="text-xs text-[#8b949e] mt-1">
                        After 3 rounds, no agreement could be reached. Your contract remains unchanged.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Contract Summary (for successful outcomes) */}
              {(outcome === 'accepted' || outcome === 'counter_accepted') && (
                <Card className="bg-[#161b22] border-emerald-800/50">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-emerald-500 uppercase tracking-wider">New Contract</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#484f58] line-through">
                          {formatCurrency(player.contract.weeklyWage, 'K')}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatCurrency(finalOffer.weeklyWage, 'K')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Contract Length</span>
                      <span className={`text-sm font-semibold ${getYearsColor(finalOffer.yearsRemaining)}`}>
                        {finalOffer.yearsRemaining} year{finalOffer.yearsRemaining !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b949e]">Signing Bonus</span>
                      <span className="text-sm text-white">{formatCurrency(finalOffer.signingBonus, 'K')}</span>
                    </div>
                    {finalOffer.releaseClause && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8b949e]">Release Clause</span>
                        <span className="text-xs text-amber-400">{formatCurrency(finalOffer.releaseClause, 'M')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Negotiation History (for failed outcomes) */}
              {(outcome === 'walked_away') && rounds.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Negotiation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {rounds.map((r, idx) => (
                      <div key={idx} className="bg-[#21262d] rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#8b949e]">Round {r.round}</span>
                          <span className="text-[#8b949e]">
                            Club: {formatCurrency(r.clubOffer.weeklyWage, 'K')}
                          </span>
                        </div>
                        {r.playerDemand && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#484f58]">Your demand:</span>
                            <span className="text-amber-400">{formatCurrency(r.playerDemand.weeklyWage, 'K')}</span>
                          </div>
                        )}
                        {r.clubResponse && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#484f58]">Club response:</span>
                            <span className="text-emerald-400">{formatCurrency(r.clubResponse.weeklyWage, 'K')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Close Button */}
              <Button
                onClick={() => {
                  resetNegotiation();
                  onClose();
                }}
                className="w-full h-11 bg-[#21262d] hover:bg-slate-700 text-white font-semibold rounded-lg"
              >
                {outcome === 'accepted' || outcome === 'counter_accepted' ? 'Continue' : 'Close'}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
